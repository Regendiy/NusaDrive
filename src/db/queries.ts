import { desc, eq } from 'drizzle-orm';
import { db } from './index.ts';
import { bookings, users, vehicles, whatsappNotifications } from './schema.ts';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const defaultRole = email.toLowerCase() === 'rizkymsur@gmail.com' ? 'admin' : 'customer';
    const existing = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    if (existing.length > 0) {
      const updated = await db
        .update(users)
        .set({
          email,
          name: name || existing[0].name,
        })
        .where(eq(users.uid, uid))
        .returning();
      return updated[0];
    }

    const inserted = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || email.split('@')[0],
        role: defaultRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email },
      })
      .returning();

    return inserted[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('Gagal menyinkronkan profil pengguna.', { cause: error });
  }
}

export async function updateUserRole(uid: string, role: 'admin' | 'owner' | 'customer') {
  try {
    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.uid, uid))
      .returning();
    return updated[0];
  } catch (error) {
    console.error('Database error in updateUserRole:', error);
    throw new Error('Gagal mengubah peran pengguna.', { cause: error });
  }
}

export async function listVehicles() {
  try {
    return await db.select().from(vehicles).orderBy(vehicles.id);
  } catch (error) {
    console.error('Database error in listVehicles:', error);
    throw new Error('Gagal memuat daftar armada kendaraan.', { cause: error });
  }
}

export async function listVehiclesByOwner(ownerUid: string) {
  try {
    return await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.ownerUid, ownerUid))
      .orderBy(vehicles.id);
  } catch (error) {
    console.error('Database error in listVehiclesByOwner:', error);
    throw new Error('Gagal memuat daftar armada pemilik.', { cause: error });
  }
}

export async function getVehicleById(id: number) {
  try {
    const rows = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
    return rows[0] ?? null;
  } catch (error) {
    console.error('Database error in getVehicleById:', error);
    throw new Error('Gagal memuat detail kendaraan.', { cause: error });
  }
}

export async function createVehicle(data: {
  name: string;
  brand: string;
  category: string;
  plateNumber: string;
  year: number;
  transmission: string;
  fuelType: string;
  seats: number;
  dailyRate: number;
  driverFeePerDay: number;
  imageUrl: string;
  status: string;
  features: string;
  ownerUid?: string | null;
  ownerName?: string;
  ownerWhatsapp?: string;
  ownerSharePercent?: number;
  currentLat?: string;
  currentLng?: string;
  currentSpeedKmh?: number;
  currentHeading?: number;
  trackingStatus?: string;
  trackingLocationLabel?: string;
}) {
  try {
    const inserted = await db.insert(vehicles).values(data).returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in createVehicle:', error);
    throw new Error('Gagal menambahkan kendaraan baru. Pastikan nomor polisi belum terdaftar.', { cause: error });
  }
}

export async function updateVehicle(
  id: number,
  data: Partial<{
    name: string;
    brand: string;
    category: string;
    plateNumber: string;
    year: number;
    transmission: string;
    fuelType: string;
    seats: number;
    dailyRate: number;
    driverFeePerDay: number;
    imageUrl: string;
    status: string;
    features: string;
    ownerUid: string | null;
    ownerName: string;
    ownerWhatsapp: string;
    ownerSharePercent: number;
    currentLat: string;
    currentLng: string;
    currentSpeedKmh: number;
    currentHeading: number;
    trackingStatus: string;
    trackingLocationLabel: string;
    gpsUpdatedAt: Date;
  }>
) {
  try {
    const updated = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database error in updateVehicle:', error);
    throw new Error('Gagal memperbarui data kendaraan.', { cause: error });
  }
}

export async function updateVehicleTracking(
  id: number,
  data: {
    currentLat: string;
    currentLng: string;
    currentSpeedKmh: number;
    currentHeading: number;
    trackingStatus: string;
    trackingLocationLabel: string;
  }
) {
  try {
    const updated = await db
      .update(vehicles)
      .set({
        ...data,
        gpsUpdatedAt: new Date(),
      })
      .where(eq(vehicles.id, id))
      .returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database error in updateVehicleTracking:', error);
    throw new Error('Gagal memperbarui posisi GPS kendaraan.', { cause: error });
  }
}

export async function deleteVehicle(id: number) {
  try {
    const deleted = await db.delete(vehicles).where(eq(vehicles.id, id)).returning();
    return deleted[0] ?? null;
  } catch (error) {
    console.error('Database error in deleteVehicle:', error);
    throw new Error('Kendaraan tidak dapat dihapus karena masih terkait riwayat pemesanan.', { cause: error });
  }
}

export async function listBookingsByVehicle(vehicleId: number) {
  try {
    return await db.select().from(bookings).where(eq(bookings.vehicleId, vehicleId));
  } catch (error) {
    console.error('Database error in listBookingsByVehicle:', error);
    throw new Error('Gagal memeriksa jadwal kendaraan.', { cause: error });
  }
}

export async function listBookingsForUser(userUid: string) {
  try {
    const rows = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.userUid, userUid))
      .orderBy(desc(bookings.createdAt));

    return rows.map((r) => ({ ...r.booking, vehicle: r.vehicle }));
  } catch (error) {
    console.error('Database error in listBookingsForUser:', error);
    throw new Error('Gagal memuat daftar pemesanan Anda.', { cause: error });
  }
}

export async function listBookingsForOwner(ownerUid: string) {
  try {
    const rows = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(vehicles.ownerUid, ownerUid))
      .orderBy(desc(bookings.createdAt));

    return rows.map((r) => ({ ...r.booking, vehicle: r.vehicle }));
  } catch (error) {
    console.error('Database error in listBookingsForOwner:', error);
    throw new Error('Gagal memuat daftar pemesanan unit pemilik.', { cause: error });
  }
}

export async function listAllBookings() {
  try {
    const rows = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .orderBy(desc(bookings.createdAt));

    return rows.map((r) => ({ ...r.booking, vehicle: r.vehicle }));
  } catch (error) {
    console.error('Database error in listAllBookings:', error);
    throw new Error('Gagal memuat seluruh data pemesanan.', { cause: error });
  }
}

export async function getBookingById(id: number) {
  try {
    const rows = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.id, id))
      .limit(1);

    if (!rows.length) return null;
    return { ...rows[0].booking, vehicle: rows[0].vehicle };
  } catch (error) {
    console.error('Database error in getBookingById:', error);
    throw new Error('Gagal memuat detail pemesanan.', { cause: error });
  }
}

export async function getBookingByCode(bookingCode: string) {
  try {
    const rows = await db
      .select({
        booking: bookings,
        vehicle: vehicles,
      })
      .from(bookings)
      .innerJoin(vehicles, eq(bookings.vehicleId, vehicles.id))
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);

    if (!rows.length) return null;
    return { ...rows[0].booking, vehicle: rows[0].vehicle };
  } catch (error) {
    console.error('Database error in getBookingByCode:', error);
    throw new Error('Gagal mencari kode pemesanan.', { cause: error });
  }
}

export async function createBookingRecord(data: {
  bookingCode: string;
  userUid: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  vehicleId: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  withDriver: boolean;
  pickupLocation: string;
  notes: string;
  ktpNumber: string;
  ktpPhotoData: string;
  kkPhotoData: string;
  simPhotoData: string;
  selfiePhotoData: string;
  termsAccepted: boolean;
  kycStatus?: string;
  baseAmount: number;
  driverAmount: number;
  taxAmount: number;
  totalAmount: number;
}) {
  try {
    const inserted = await db.insert(bookings).values(data).returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in createBookingRecord:', error);
    throw new Error('Gagal menyimpan pemesanan ke database.', { cause: error });
  }
}

export async function updateBookingStatus(
  id: number,
  updates: Partial<{
    bookingStatus: string;
    paymentStatus: string;
    paymentMethod: string;
    paymentReference: string;
    paidAt: Date | null;
    kycStatus: string;
    kycNotes: string;
  }>
) {
  try {
    const updated = await db.update(bookings).set(updates).where(eq(bookings.id, id)).returning();
    return updated[0] ?? null;
  } catch (error) {
    console.error('Database error in updateBookingStatus:', error);
    throw new Error('Gagal memperbarui status pemesanan.', { cause: error });
  }
}

export async function insertWhatsappNotification(data: {
  bookingId: number | null;
  bookingCode: string;
  recipientPhone: string;
  recipientName: string;
  eventType: string;
  messageBody: string;
  deliveryStatus: string;
  providerRef: string;
}) {
  try {
    const inserted = await db.insert(whatsappNotifications).values(data).returning();
    return inserted[0];
  } catch (error) {
    console.error('Database error in insertWhatsappNotification:', error);
    throw new Error('Gagal mencatat log notifikasi WhatsApp.', { cause: error });
  }
}

export async function listWhatsappNotifications(limitCount = 50) {
  try {
    return await db
      .select()
      .from(whatsappNotifications)
      .orderBy(desc(whatsappNotifications.createdAt))
      .limit(limitCount);
  } catch (error) {
    console.error('Database error in listWhatsappNotifications:', error);
    throw new Error('Gagal memuat log notifikasi WhatsApp.', { cause: error });
  }
}

export async function listWhatsappNotificationsForBookingCodes(codes: string[]) {
  try {
    const all = await listWhatsappNotifications(100);
    const set = new Set(codes);
    return all.filter((n) => set.has(n.bookingCode));
  } catch (error) {
    console.error('Database error in listWhatsappNotificationsForBookingCodes:', error);
    throw new Error('Gagal memuat notifikasi WhatsApp pelanggan.', { cause: error });
  }
}
