import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { createServer as createViteServer } from 'vite';
import { adminAuth } from './src/lib/firebase-admin.ts';
import { AuthRequest, requireAuth } from './src/middleware/auth.ts';
import {
  createBookingRecord,
  createVehicle,
  deleteVehicle,
  getBookingByCode,
  getBookingById,
  getOrCreateUser,
  getVehicleById,
  listAllBookings,
  listBookingsByVehicle,
  listBookingsForOwner,
  listBookingsForUser,
  listVehicles,
  listVehiclesByOwner,
  listWhatsappNotifications,
  listWhatsappNotificationsForBookingCodes,
  updateBookingStatus,
  updateUserRole,
  updateVehicle,
  updateVehicleTracking,
} from './src/db/queries.ts';
import {
  broadcastRealtimeEvent,
  dispatchWhatsappNotification,
  registerSseClient,
} from './src/services/realtime.ts';
import {
  calculateBookingPrice,
  generateBookingCode,
  hasDateOverlap,
  normalizeWhatsappNumber,
  signWebhookPayload,
  verifyWebhookSignature,
} from './src/utils/rentalLogic.ts';
import { validateKycSubmission } from './src/utils/kycValidation.ts';
import { computeNextBatamWaypoint } from './src/utils/ownerTelemetry.ts';
import {
  buildZipArchive,
  collectProjectZipEntries,
} from './src/utils/zipBuilder.ts';

const PORT = 3000;
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'nusadrive-auto-payment-secret';

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Public fleet catalog from PostgreSQL
  app.get('/api/vehicles', async (_req, res) => {
    try {
      const items = await listVehicles();
      res.json({ vehicles: items });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat daftar kendaraan.' });
    }
  });

  // Public occupied date ranges (no PII) for responsive calendar availability
  app.get('/api/vehicles/:id/booked-dates', async (req, res) => {
    try {
      const vehicleId = Number(req.params.id);
      if (!Number.isInteger(vehicleId) || vehicleId <= 0) {
        return res.status(400).json({ error: 'ID kendaraan tidak valid.' });
      }
      const rows = await listBookingsByVehicle(vehicleId);
      const active = rows
        .filter((b) => ['pending', 'confirmed', 'active'].includes(b.bookingStatus))
        .map((b) => ({
          startDate: b.startDate,
          endDate: b.endDate,
          bookingStatus: b.bookingStatus,
        }));
      res.json({ bookedDates: active });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat jadwal kendaraan.' });
    }
  });

  // Public live GPS fleet telemetry (no customer PII)
  app.get('/api/vehicles/tracking', async (_req, res) => {
    try {
      const items = await listVehicles();
      const tracking = items.map((v) => ({
        id: v.id,
        name: v.name,
        brand: v.brand,
        category: v.category,
        plateNumber: v.plateNumber,
        status: v.status,
        ownerUid: v.ownerUid,
        ownerName: v.ownerName,
        ownerSharePercent: v.ownerSharePercent,
        currentLat: Number(v.currentLat) || 1.1286,
        currentLng: Number(v.currentLng) || 104.0539,
        currentSpeedKmh: v.currentSpeedKmh ?? 0,
        currentHeading: v.currentHeading ?? 0,
        trackingStatus: v.trackingStatus || 'parked',
        trackingLocationLabel: v.trackingLocationLabel || 'Pool Batam Centre',
        gpsUpdatedAt: v.gpsUpdatedAt,
      }));
      res.json({ vehicles: tracking });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat telemetri GPS armada.' });
    }
  });

  // Downloadable ZIP archive of the complete PHP 8.2 + MySQL 8.0 app (XAMPP ready)
  app.get('/api/php-bundle.zip', async (_req, res) => {
    try {
      const baseDir = path.resolve(process.cwd(), 'php-mysql');
      const entries = await collectProjectZipEntries(baseDir, 'nusadrive-batam-php-mysql');
      const zipBuffer = buildZipArchive(entries);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="nusadrive-batam-php-mysql.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (error) {
      console.error('Failed to build php-mysql zip archive:', error);
      res.status(500).json({ error: 'Gagal membuat arsip ZIP paket PHP & MySQL.' });
    }
  });

  // Downloadable ZIP archive of the complete NusaDrive Batam TypeScript/React/Express app
  app.get('/api/project-bundle.zip', async (_req, res) => {
    try {
      const entries = await collectProjectZipEntries(process.cwd(), 'nusadrive-batam');
      const zipBuffer = buildZipArchive(entries);
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="nusadrive-batam.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (error) {
      console.error('Failed to build project zip archive:', error);
      res.status(500).json({ error: 'Gagal membuat arsip ZIP aplikasi NusaDrive Batam.' });
    }
  });

  // Real-time Server-Sent Events stream (authenticated via Bearer or query token)
  app.get('/api/events', async (req, res) => {
    const token =
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split('Bearer ')[1]
        : null) || (typeof req.query.token === 'string' ? req.query.token : null);

    if (!token) {
      return res.status(401).json({ error: 'Token SSE diperlukan.' });
    }

    try {
      await adminAuth.verifyIdToken(token);
    } catch {
      return res.status(401).json({ error: 'Token SSE tidak valid.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);
    const unregister = registerSseClient(res);

    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unregister();
    });
  });

  // Sync current authenticated user profile
  app.get('/api/me', requireAuth, async (req: AuthRequest, res) => {
    try {
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || '',
        req.user!.name || req.user!.email?.split('@')[0] || 'Pengguna'
      );
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat profil pengguna.' });
    }
  });

  // Switch workspace role between 'customer', 'owner', and 'admin' for the signed-in user
  app.patch('/api/me/role', requireAuth, async (req: AuthRequest, res) => {
    try {
      const requestedRole = req.body?.role;
      if (requestedRole !== 'admin' && requestedRole !== 'owner' && requestedRole !== 'customer') {
        return res.status(400).json({ error: 'Peran tidak valid.' });
      }
      await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const updated = await updateUserRole(req.user!.uid, requestedRole);
      res.json({ user: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui peran.' });
    }
  });

  // Owner: Claim up to 2 unassigned partner fleet vehicles for portfolio management
  app.post('/api/owner/claim-demo', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Aktifkan peran Pemilik Mobil terlebih dahulu.' });
      }

      const existingOwn = await listVehiclesByOwner(currentUser.uid);
      if (existingOwn.length > 0) {
        return res.json({ vehicles: existingOwn, claimedCount: 0 });
      }

      const all = await listVehicles();
      const unassigned = all.filter((v) => !v.ownerUid).slice(0, 2);
      const claimed = [];
      for (const v of unassigned) {
        const updated = await updateVehicle(v.id, {
          ownerUid: currentUser.uid,
          ownerName: `${currentUser.name} (Mitra Pemilik)`,
        });
        if (updated) claimed.push(updated);
      }

      if (claimed.length > 0) {
        broadcastRealtimeEvent('vehicle_updated', { claimedBy: currentUser.uid });
      }
      res.json({ vehicles: claimed, claimedCount: claimed.length });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal menghubungkan unit mitra.' });
    }
  });

  // Owner: List bookings for owned vehicles
  app.get('/api/owner/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role !== 'owner' && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Akses khusus Pemilik Mobil.' });
      }
      const ownerBookings = await listBookingsForOwner(currentUser.uid);
      res.json({ bookings: ownerBookings });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat jadwal unit pemilik.' });
    }
  });

  // Admin or Owner: Add vehicle
  app.post('/api/vehicles', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role !== 'admin' && currentUser.role !== 'owner') {
        return res.status(403).json({ error: 'Hanya admin atau pemilik mobil yang dapat menambah armada.' });
      }

      const {
        name,
        brand,
        category,
        plateNumber,
        year,
        transmission,
        fuelType,
        seats,
        dailyRate,
        driverFeePerDay,
        imageUrl,
        features,
        ownerName,
        ownerWhatsapp,
        ownerSharePercent,
        trackingLocationLabel,
      } = req.body || {};

      if (!name || !brand || !category || !plateNumber || !dailyRate) {
        return res.status(400).json({ error: 'Lengkapi nama, merek, kategori, nomor polisi, dan tarif harian.' });
      }

      const share = Math.min(95, Math.max(50, Number(ownerSharePercent) || 80));
      const created = await createVehicle({
        name: String(name).trim(),
        brand: String(brand).trim(),
        category: String(category),
        plateNumber: String(plateNumber).trim().toUpperCase(),
        year: Number(year) || 2025,
        transmission: String(transmission || 'Otomatis'),
        fuelType: String(fuelType || 'Bensin'),
        seats: Number(seats) || 5,
        dailyRate: Number(dailyRate),
        driverFeePerDay: Number(driverFeePerDay) || 200000,
        imageUrl: String(imageUrl || '/src/assets/images/car_mpv_zenix_1794672684036.jpg'),
        status: 'available',
        features: JSON.stringify(Array.isArray(features) ? features : ['Asuransi All-Risk', 'GPS Tracker Aktif']),
        ownerUid: currentUser.role === 'owner' ? currentUser.uid : null,
        ownerName: String(ownerName || (currentUser.role === 'owner' ? `${currentUser.name} (Mitra)` : 'Mitra NusaDrive Batam')).trim(),
        ownerWhatsapp: String(ownerWhatsapp || currentUser.phone || '628117700123').trim(),
        ownerSharePercent: share,
        trackingLocationLabel: String(trackingLocationLabel || 'Pool Batam Centre (Jl. Engku Putri)'),
      });

      broadcastRealtimeEvent('vehicle_updated', created);
      res.status(201).json({ vehicle: created });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal menambah armada.' });
    }
  });

  // Admin or Assigned Owner: Update vehicle
  app.patch('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID kendaraan tidak valid.' });
      }

      const existing = await getVehicleById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }

      const isAdmin = currentUser.role === 'admin';
      const isVehicleOwner = currentUser.role === 'owner' && existing.ownerUid === currentUser.uid;
      if (!isAdmin && !isVehicleOwner) {
        return res.status(403).json({ error: 'Anda tidak memiliki izin mengubah unit ini.' });
      }

      const allowed: Record<string, any> = {};
      const body = req.body || {};
      if (typeof body.name === 'string') allowed.name = body.name.trim();
      if (typeof body.brand === 'string') allowed.brand = body.brand.trim();
      if (typeof body.category === 'string') allowed.category = body.category;
      if (typeof body.plateNumber === 'string') allowed.plateNumber = body.plateNumber.trim().toUpperCase();
      if (body.dailyRate !== undefined) allowed.dailyRate = Number(body.dailyRate);
      if (body.driverFeePerDay !== undefined) allowed.driverFeePerDay = Number(body.driverFeePerDay);
      if (typeof body.status === 'string') allowed.status = body.status;
      if (typeof body.transmission === 'string') allowed.transmission = body.transmission;
      if (isAdmin && body.ownerSharePercent !== undefined) {
        allowed.ownerSharePercent = Math.min(95, Math.max(50, Number(body.ownerSharePercent)));
      }
      if (isAdmin && typeof body.ownerName === 'string') {
        allowed.ownerName = body.ownerName.trim();
      }

      const updated = await updateVehicle(id, allowed);
      if (!updated) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }
      broadcastRealtimeEvent('vehicle_updated', updated);
      res.json({ vehicle: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui kendaraan.' });
    }
  });

  // Admin or Assigned Owner: Step / Ping real-time GPS location for vehicle
  app.post('/api/vehicles/:id/tracking', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID kendaraan tidak valid.' });
      }

      const existing = await getVehicleById(id);
      if (!existing) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }

      const isAdmin = currentUser.role === 'admin';
      const isVehicleOwner = currentUser.role === 'owner' && existing.ownerUid === currentUser.uid;
      if (!isAdmin && !isVehicleOwner) {
        return res.status(403).json({ error: 'Hanya admin atau pemilik unit yang dapat memperbarui sinyal GPS.' });
      }

      const { lat, lng, speedKmh, heading, trackingStatus, locationLabel } = req.body || {};
      let nextTracking;
      if (lat !== undefined && lng !== undefined && Number.isFinite(Number(lat)) && Number.isFinite(Number(lng))) {
        nextTracking = {
          currentLat: Number(lat).toFixed(4),
          currentLng: Number(lng).toFixed(4),
          currentSpeedKmh: Math.max(0, Math.min(160, Number(speedKmh) || 0)),
          currentHeading: Math.max(0, Math.min(359, Number(heading) || 0)),
          trackingStatus: ['parked', 'en_route', 'idle'].includes(String(trackingStatus))
            ? String(trackingStatus)
            : 'en_route',
          trackingLocationLabel: String(locationLabel || existing.trackingLocationLabel || 'Koridor Batam').trim(),
        };
      } else {
        nextTracking = computeNextBatamWaypoint({
          currentLat: existing.currentLat,
          currentLng: existing.currentLng,
          vehicleId: existing.id,
          requestedStatus: typeof trackingStatus === 'string' ? trackingStatus : undefined,
        });
      }

      const updated = await updateVehicleTracking(id, nextTracking);
      if (!updated) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }

      broadcastRealtimeEvent('vehicle_tracked', updated);
      res.json({ vehicle: updated });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui pelacakan GPS.' });
    }
  });

  // Admin: Delete vehicle
  app.delete('/api/vehicles/:id', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin yang dapat menghapus armada.' });
      }

      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'ID kendaraan tidak valid.' });
      }

      const deleted = await deleteVehicle(id);
      if (!deleted) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }
      broadcastRealtimeEvent('vehicle_deleted', { id });
      res.json({ deleted });
    } catch (error: any) {
      res.status(409).json({ error: error.message || 'Gagal menghapus kendaraan.' });
    }
  });

  // Get bookings (customer's own or all for admin)
  app.get('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const scope = req.query.scope;

      if (scope === 'all' && currentUser.role === 'admin') {
        const all = await listAllBookings();
        return res.json({ bookings: all });
      }

      const mine = await listBookingsForUser(currentUser.uid);
      res.json({ bookings: mine });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat pemesanan.' });
    }
  });

  // Create booking + validate KYC documents + auto-dispatch real-time WhatsApp notification
  app.post('/api/bookings', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const {
        vehicleId,
        startDate,
        endDate,
        withDriver,
        pickupLocation,
        customerWhatsapp,
        customerName,
        notes,
        ktpNumber,
        ktpPhotoData,
        kkPhotoData,
        simPhotoData,
        selfiePhotoData,
        termsAccepted,
      } = req.body || {};

      const vehicle = await getVehicleById(Number(vehicleId));
      if (!vehicle) {
        return res.status(404).json({ error: 'Kendaraan tidak ditemukan.' });
      }
      if (vehicle.status === 'maintenance') {
        return res.status(409).json({ error: 'Kendaraan sedang dalam perawatan berkala.' });
      }

      const waValidation = normalizeWhatsappNumber(String(customerWhatsapp || ''));
      if (!waValidation.valid) {
        return res.status(400).json({ error: waValidation.error });
      }

      if (!pickupLocation || String(pickupLocation).trim().length < 4) {
        return res.status(400).json({ error: 'Lokasi pengambilan kendaraan wajib diisi.' });
      }

      const kycCheck = validateKycSubmission({
        ktpNumber: String(ktpNumber || ''),
        ktpPhotoData: String(ktpPhotoData || ''),
        kkPhotoData: String(kkPhotoData || ''),
        simPhotoData: typeof simPhotoData === 'string' ? simPhotoData : '',
        selfiePhotoData: typeof selfiePhotoData === 'string' ? selfiePhotoData : '',
        withDriver: Boolean(withDriver),
        termsAccepted: Boolean(termsAccepted),
      });

      if (!kycCheck.valid) {
        return res.status(400).json({ error: kycCheck.error });
      }

      const pricing = calculateBookingPrice({
        dailyRate: vehicle.dailyRate,
        driverFeePerDay: vehicle.driverFeePerDay,
        startDate: String(startDate || ''),
        endDate: String(endDate || ''),
        withDriver: Boolean(withDriver),
      });

      if (!pricing.valid) {
        return res.status(400).json({ error: pricing.error });
      }

      const existing = await listBookingsByVehicle(vehicle.id);
      if (hasDateOverlap(existing, String(startDate), String(endDate))) {
        return res.status(409).json({
          error: 'Tanggal yang dipilih sudah terpesan oleh pelanggan lain. Silakan pilih rentang tanggal lain.',
        });
      }

      const bookingCode = generateBookingCode();
      const created = await createBookingRecord({
        bookingCode,
        userUid: currentUser.uid,
        customerName: String(customerName || currentUser.name).trim(),
        customerEmail: currentUser.email,
        customerWhatsapp: waValidation.formatted,
        vehicleId: vehicle.id,
        startDate: String(startDate),
        endDate: String(endDate),
        totalDays: pricing.totalDays,
        withDriver: Boolean(withDriver),
        pickupLocation: String(pickupLocation).trim(),
        notes: String(notes || '').trim(),
        ktpNumber: kycCheck.normalizedNik!,
        ktpPhotoData: String(ktpPhotoData).trim(),
        kkPhotoData: String(kkPhotoData).trim(),
        simPhotoData: String(simPhotoData || '').trim(),
        selfiePhotoData: String(selfiePhotoData || '').trim(),
        termsAccepted: true,
        kycStatus: 'pending',
        baseAmount: pricing.baseAmount,
        driverAmount: pricing.driverAmount,
        taxAmount: pricing.taxAmount,
        totalAmount: pricing.totalAmount,
      });

      const notification = await dispatchWhatsappNotification({
        bookingId: created.id,
        bookingCode: created.bookingCode,
        recipientPhone: created.customerWhatsapp,
        recipientName: created.customerName,
        eventType: 'booking_created',
        vehicleName: vehicle.name,
        startDate: created.startDate,
        endDate: created.endDate,
        totalAmount: created.totalAmount,
        pickupLocation: created.pickupLocation,
      });

      const fullBooking = { ...created, vehicle };
      broadcastRealtimeEvent('booking_updated', fullBooking);

      res.status(201).json({
        booking: fullBooking,
        notification,
        paymentToken: signWebhookPayload(created.bookingCode, created.totalAmount, WEBHOOK_SECRET),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal membuat pemesanan.' });
    }
  });

  // Customer automatic payment checkout (verifies ownership, settles atomically, triggers WhatsApp)
  app.post('/api/payments/checkout', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const { bookingId, paymentMethod } = req.body || {};

      const booking = await getBookingById(Number(bookingId));
      if (!booking) {
        return res.status(404).json({ error: 'Pemesanan tidak ditemukan.' });
      }
      if (booking.userUid !== currentUser.uid && currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Anda tidak memiliki akses ke pemesanan ini.' });
      }
      if (booking.bookingStatus === 'cancelled') {
        return res.status(409).json({ error: 'Pemesanan yang sudah dibatalkan tidak dapat dibayar.' });
      }
      if (booking.paymentStatus === 'paid') {
        return res.json({ booking, alreadyPaid: true });
      }

      const methodLabel = String(paymentMethod || 'QRIS Otomatis');
      const paymentReference = `PAY-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const updated = await updateBookingStatus(booking.id, {
        paymentStatus: 'paid',
        bookingStatus: booking.bookingStatus === 'pending' ? 'confirmed' : booking.bookingStatus,
        paymentMethod: methodLabel,
        paymentReference,
        paidAt: new Date(),
      });

      const notification = await dispatchWhatsappNotification({
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        recipientPhone: booking.customerWhatsapp,
        recipientName: booking.customerName,
        eventType: 'payment_confirmed',
        vehicleName: booking.vehicle.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
        paymentMethod: methodLabel,
      });

      const fullBooking = { ...updated, vehicle: booking.vehicle };
      broadcastRealtimeEvent('booking_updated', fullBooking);

      res.json({ booking: fullBooking, notification });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memproses pembayaran otomatis.' });
    }
  });

  // External payment gateway webhook (HMAC SHA-256 signature verification)
  app.post('/api/payments/webhook', async (req, res) => {
    try {
      const { orderId, grossAmount, paymentType, transactionId, transactionStatus } = req.body || {};
      const signature = String(req.headers['x-webhook-signature'] || req.body?.signature || '');

      if (!orderId || !grossAmount || !signature) {
        return res.status(400).json({ error: 'Payload webhook tidak lengkap.' });
      }
      if (!verifyWebhookSignature(String(orderId), Number(grossAmount), WEBHOOK_SECRET, signature)) {
        return res.status(403).json({ error: 'Signature webhook tidak valid.' });
      }

      const booking = await getBookingByCode(String(orderId));
      if (!booking) {
        return res.status(404).json({ error: 'Order ID tidak ditemukan.' });
      }

      if (transactionStatus === 'settlement') {
        const updated = await updateBookingStatus(booking.id, {
          paymentStatus: 'paid',
          bookingStatus: booking.bookingStatus === 'pending' ? 'confirmed' : booking.bookingStatus,
          paymentMethod: String(paymentType || 'Virtual Account Otomatis'),
          paymentReference: String(transactionId || `PG-${Date.now()}`),
          paidAt: new Date(),
        });

        await dispatchWhatsappNotification({
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          recipientPhone: booking.customerWhatsapp,
          recipientName: booking.customerName,
          eventType: 'payment_confirmed',
          vehicleName: booking.vehicle.name,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
          pickupLocation: booking.pickupLocation,
          paymentMethod: String(paymentType || 'Virtual Account Otomatis'),
        });

        broadcastRealtimeEvent('booking_updated', { ...updated, vehicle: booking.vehicle });
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memproses webhook pembayaran.' });
    }
  });

  // Update booking status (Admin lifecycle or Customer cancel)
  app.patch('/api/bookings/:id/status', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const id = Number(req.params.id);
      const nextStatus = String(req.body?.bookingStatus || '');

      const validStatuses = ['pending', 'confirmed', 'active', 'completed', 'cancelled'];
      if (!validStatuses.includes(nextStatus)) {
        return res.status(400).json({ error: 'Status pemesanan tidak valid.' });
      }

      const booking = await getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Pemesanan tidak ditemukan.' });
      }

      if (currentUser.role !== 'admin') {
        if (booking.userUid !== currentUser.uid || nextStatus !== 'cancelled') {
          return res.status(403).json({ error: 'Akses ditolak.' });
        }
      }

      const updated = await updateBookingStatus(id, { bookingStatus: nextStatus });

      if (nextStatus === 'active') {
        await updateVehicle(booking.vehicleId, { status: 'rented' });
      } else if (nextStatus === 'completed' || nextStatus === 'cancelled') {
        await updateVehicle(booking.vehicleId, { status: 'available' });
      }

      const eventMap: Record<string, 'pickup_ready' | 'rental_completed' | 'booking_cancelled' | null> = {
        active: 'pickup_ready',
        completed: 'rental_completed',
        cancelled: 'booking_cancelled',
      };

      const waEvent = eventMap[nextStatus];
      let notification = null;
      if (waEvent) {
        notification = await dispatchWhatsappNotification({
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          recipientPhone: booking.customerWhatsapp,
          recipientName: booking.customerName,
          eventType: waEvent,
          vehicleName: booking.vehicle.name,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalAmount: booking.totalAmount,
          pickupLocation: booking.pickupLocation,
        });
      }

      const fullBooking = { ...updated, vehicle: booking.vehicle };
      broadcastRealtimeEvent('booking_updated', fullBooking);
      res.json({ booking: fullBooking, notification });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui status pemesanan.' });
    }
  });

  // Verify or reject customer KYC documents (KTP, KK, SIM A, Swafoto)
  app.patch('/api/bookings/:id/kyc', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      const id = Number(req.params.id);
      const nextKycStatus = String(req.body?.kycStatus || '');
      const kycNotes = String(req.body?.kycNotes || '').trim();

      if (!['pending', 'verified', 'rejected'].includes(nextKycStatus)) {
        return res.status(400).json({ error: 'Status verifikasi KYC tidak valid.' });
      }

      const booking = await getBookingById(id);
      if (!booking) {
        return res.status(404).json({ error: 'Pemesanan tidak ditemukan.' });
      }

      const isAdmin = currentUser.role === 'admin';
      const isVehicleOwner =
        currentUser.role === 'owner' && booking.vehicle.ownerUid === currentUser.uid;
      if (!isAdmin && !isVehicleOwner) {
        return res.status(403).json({ error: 'Hanya admin atau pemilik mobil terkait yang dapat memverifikasi dokumen.' });
      }

      const updated = await updateBookingStatus(id, {
        kycStatus: nextKycStatus,
        kycNotes,
      });

      const fullBooking = { ...updated, vehicle: booking.vehicle };
      broadcastRealtimeEvent('booking_updated', fullBooking);
      res.json({ booking: fullBooking });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memperbarui verifikasi KYC.' });
    }
  });

  // Get WhatsApp notification logs
  app.get('/api/notifications', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role === 'admin' && req.query.scope === 'all') {
        const logs = await listWhatsappNotifications(60);
        return res.json({ notifications: logs });
      }

      const mine = await listBookingsForUser(currentUser.uid);
      const codes = mine.map((b) => b.bookingCode);
      const logs = await listWhatsappNotificationsForBookingCodes(codes);
      res.json({ notifications: logs });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal memuat riwayat WhatsApp.' });
    }
  });

  // Admin: Manual trigger WhatsApp pickup/reminder notification
  app.post('/api/notifications/resend', requireAuth, async (req: AuthRequest, res) => {
    try {
      const currentUser = await getOrCreateUser(req.user!.uid, req.user!.email || '', req.user!.name);
      if (currentUser.role !== 'admin') {
        return res.status(403).json({ error: 'Hanya admin yang dapat mengirim notifikasi manual.' });
      }

      const booking = await getBookingById(Number(req.body?.bookingId));
      if (!booking) {
        return res.status(404).json({ error: 'Pemesanan tidak ditemukan.' });
      }

      const notification = await dispatchWhatsappNotification({
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        recipientPhone: booking.customerWhatsapp,
        recipientName: booking.customerName,
        eventType: 'pickup_ready',
        vehicleName: booking.vehicle.name,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
        pickupLocation: booking.pickupLocation,
      });

      res.json({ notification });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Gagal mengirim notifikasi WhatsApp.' });
    }
  });

  // Vite dev middleware vs static production build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NusaDrive server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start NusaDrive server:', err);
  process.exit(1);
});
