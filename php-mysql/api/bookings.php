<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/whatsapp_notify.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function mapBookingRow(array $row): array
{
    return [
        'id'               => (int) $row['id'],
        'bookingCode'      => (string) $row['booking_code'],
        'userId'           => (int) $row['user_id'],
        'vehicleId'        => (int) $row['vehicle_id'],
        'vehicleName'      => (string) ($row['vehicle_name'] ?? ''),
        'plateNumber'      => (string) ($row['plate_number'] ?? ''),
        'customerName'     => (string) ($row['customer_name'] ?: ($row['user_name'] ?? 'Penyewa Batam')),
        'customerWhatsapp' => (string) $row['customer_whatsapp'],
        'notes'            => (string) ($row['notes'] ?? ''),
        'ownerUserId'      => isset($row['owner_user_id']) ? (int) $row['owner_user_id'] : null,
        'ownerName'        => (string) ($row['owner_name'] ?? 'Mitra Batam'),
        'ownerSharePercent'=> (int) ($row['owner_share_percent'] ?? 80),
        'ktpNumber'        => (string) ($row['ktp_number'] ?? ''),
        'ktpPhotoPath'     => (string) ($row['ktp_photo_path'] ?? ''),
        'kkPhotoPath'      => (string) ($row['kk_photo_path'] ?? ''),
        'simPhotoPath'     => (string) ($row['sim_photo_path'] ?? ''),
        'selfiePhotoPath'  => (string) ($row['selfie_photo_path'] ?? ''),
        'termsAccepted'    => (bool) $row['terms_accepted'],
        'kycStatus'        => (string) ($row['kyc_status'] ?? 'pending'),
        'kycNotes'         => (string) ($row['kyc_notes'] ?? ''),
        'startDate'        => (string) $row['start_date'],
        'endDate'          => (string) $row['end_date'],
        'totalDays'        => (int) $row['total_days'],
        'withDriver'       => (bool) $row['with_driver'],
        'pickupLocation'   => (string) $row['pickup_location'],
        'baseAmount'       => (int) $row['base_amount'],
        'driverAmount'     => (int) $row['driver_amount'],
        'taxAmount'        => (int) $row['tax_amount'],
        'totalAmount'      => (int) $row['total_amount'],
        'bookingStatus'    => (string) $row['booking_status'],
        'paymentStatus'    => (string) $row['payment_status'],
        'paymentMethod'    => $row['payment_method'] !== null ? (string) $row['payment_method'] : null,
        'paymentReference' => $row['payment_reference'] !== null ? (string) $row['payment_reference'] : null,
        'paidAt'           => $row['paid_at'] !== null ? (string) $row['paid_at'] : null,
        'createdAt'        => (string) $row['created_at'],
    ];
}

function saveUploadedKycImage(string $fieldName, string $prefix): string
{
    if (empty($_FILES[$fieldName]['tmp_name']) || $_FILES[$fieldName]['error'] !== UPLOAD_ERR_OK) {
        return '';
    }
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime = $finfo->file($_FILES[$fieldName]['tmp_name']);
    $extMap = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
    ];
    if (!isset($extMap[$mime])) {
        throw new RuntimeException("Format berkas {$fieldName} harus JPG, PNG, atau WebP.");
    }
    if ((int) $_FILES[$fieldName]['size'] > 4 * 1024 * 1024) {
        throw new RuntimeException("Ukuran berkas {$fieldName} maksimal 4 MB.");
    }

    $uploadDir = dirname(__DIR__) . '/uploads';
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    $fileName = $prefix . '_' . bin2hex(random_bytes(8)) . '.' . $extMap[$mime];
    $destPath = $uploadDir . '/' . $fileName;
    if (!move_uploaded_file($_FILES[$fieldName]['tmp_name'], $destPath)) {
        throw new RuntimeException("Gagal menyimpan berkas {$fieldName}.");
    }
    return 'uploads/' . $fileName;
}

if ($method === 'GET') {
    if (($_GET['mode'] ?? '') === 'booked_dates' && isset($_GET['vehicle_id'])) {
        $vid = (int) $_GET['vehicle_id'];
        $stmt = $pdo->prepare(
            "SELECT start_date AS startDate, end_date AS endDate, booking_status AS bookingStatus
             FROM bookings
             WHERE vehicle_id = ? AND booking_status IN ('pending', 'confirmed', 'active')"
        );
        $stmt->execute([$vid]);
        jsonResponse(['bookedDates' => $stmt->fetchAll()]);
    }

    $sql = 'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent,
                   COALESCE(NULLIF(b.customer_name, \'\'), u.name) AS customer_name, u.name AS user_name
            FROM bookings b
            JOIN vehicles v ON b.vehicle_id = v.id
            JOIN users u ON b.user_id = u.id';
    $params = [];

    if (isset($_GET['user_id']) && (int) $_GET['user_id'] > 0) {
        $sql .= ' WHERE b.user_id = ?';
        $params[] = (int) $_GET['user_id'];
    } elseif (isset($_GET['owner_id']) && (int) $_GET['owner_id'] > 0) {
        $sql .= ' WHERE v.owner_user_id = ?';
        $params[] = (int) $_GET['owner_id'];
    }

    $sql .= ' ORDER BY b.created_at DESC, b.id DESC';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = array_map('mapBookingRow', $stmt->fetchAll());
    jsonResponse(['bookings' => $rows]);
}

if ($method === 'POST') {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    $input = str_contains($contentType, 'application/json')
        ? (json_decode(file_get_contents('php://input') ?: '{}', true) ?? [])
        : $_POST;
    $action = (string) ($input['action'] ?? 'create_booking');

    if ($action === 'update_kyc') {
        $id = (int) ($input['id'] ?? 0);
        $kycStatus = (string) ($input['kycStatus'] ?? '');
        $kycNotes = trim((string) ($input['kycNotes'] ?? ''));
        if (!$id || !in_array($kycStatus, ['pending', 'verified', 'rejected'], true)) {
            jsonResponse(['error' => 'ID pemesanan atau status KYC tidak valid.'], 422);
        }
        $upd = $pdo->prepare('UPDATE bookings SET kyc_status = ?, kyc_notes = ? WHERE id = ?');
        $upd->execute([$kycStatus, $kycNotes, $id]);

        $sel = $pdo->prepare(
            'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, COALESCE(NULLIF(b.customer_name, \'\'), u.name) AS customer_name, u.name AS user_name
             FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN users u ON b.user_id = u.id WHERE b.id = ?'
        );
        $sel->execute([$id]);
        $row = $sel->fetch();
        jsonResponse(['booking' => $row ? mapBookingRow($row) : null]);
    }

    if ($action === 'update_status') {
        $id = (int) ($input['id'] ?? 0);
        $bookingStatus = (string) ($input['bookingStatus'] ?? '');
        if (!$id || !in_array($bookingStatus, ['pending', 'confirmed', 'active', 'completed', 'cancelled'], true)) {
            jsonResponse(['error' => 'Status pemesanan tidak valid.'], 422);
        }

        $sel = $pdo->prepare('SELECT b.*, v.name AS vehicle_name FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id WHERE b.id = ?');
        $sel->execute([$id]);
        $existing = $sel->fetch();
        if (!$existing) {
            jsonResponse(['error' => 'Pemesanan tidak ditemukan.'], 404);
        }

        $upd = $pdo->prepare('UPDATE bookings SET booking_status = ? WHERE id = ?');
        $upd->execute([$bookingStatus, $id]);

        if ($bookingStatus === 'active') {
            $pdo->prepare("UPDATE vehicles SET status = 'rented' WHERE id = ?")->execute([$existing['vehicle_id']]);
            sendWhatsappNotification($pdo, [
                'booking_id'      => $id,
                'booking_code'    => $existing['booking_code'],
                'recipient_phone' => $existing['customer_whatsapp'],
                'event_type'      => 'pickup_ready',
                'message_body'    => "Unit {$existing['vehicle_name']} untuk booking {$existing['booking_code']} telah siap diserahterimakan di {$existing['pickup_location']}.",
            ]);
        } elseif ($bookingStatus === 'completed' || $bookingStatus === 'cancelled') {
            $pdo->prepare("UPDATE vehicles SET status = 'available' WHERE id = ?")->execute([$existing['vehicle_id']]);
            sendWhatsappNotification($pdo, [
                'booking_id'      => $id,
                'booking_code'    => $existing['booking_code'],
                'recipient_phone' => $existing['customer_whatsapp'],
                'event_type'      => $bookingStatus === 'completed' ? 'rental_completed' : 'booking_cancelled',
                'message_body'    => $bookingStatus === 'completed'
                    ? "Terima kasih! Masa sewa booking {$existing['booking_code']} ({$existing['vehicle_name']}) telah selesai."
                    : "Booking {$existing['booking_code']} ({$existing['vehicle_name']}) telah dibatalkan.",
            ]);
        }

        $after = $pdo->prepare(
            'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, COALESCE(NULLIF(b.customer_name, \'\'), u.name) AS customer_name, u.name AS user_name
             FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN users u ON b.user_id = u.id WHERE b.id = ?'
        );
        $after->execute([$id]);
        jsonResponse(['booking' => mapBookingRow($after->fetch())]);
    }

    // Create Booking + KYC Upload
    $vehicleId  = (int) ($input['vehicle_id'] ?? $input['vehicleId'] ?? 0);
    $userId     = max(1, (int) ($input['user_id'] ?? $input['userId'] ?? 3));
    $custName   = trim((string) ($input['customer_name'] ?? $input['customerName'] ?? 'Penyewa Batam'));
    $notes      = trim((string) ($input['notes'] ?? ''));
    $startDate  = (string) ($input['start_date'] ?? $input['startDate'] ?? '');
    $endDate    = (string) ($input['end_date'] ?? $input['endDate'] ?? '');
    $withDriver = !empty($input['with_driver']) || !empty($input['withDriver']);
    $pickupLoc  = trim((string) ($input['pickup_location'] ?? $input['pickupLocation'] ?? 'Batam Centre · Pelabuhan Ferry Internasional'));
    $rawWa      = (string) ($input['customer_whatsapp'] ?? $input['customerWhatsapp'] ?? '');
    $waNumber   = preg_replace('/^0/', '62', preg_replace('/\D+/', '', $rawWa) ?? '') ?? '';
    $nik        = preg_replace('/\D+/', '', (string) ($input['ktp_number'] ?? $input['ktpNumber'] ?? '')) ?? '';
    $termsOk    = !empty($input['terms_accepted']) || !empty($input['termsAccepted']);

    if (!$vehicleId || $startDate === '' || $endDate === '' || $endDate < $startDate) {
        jsonResponse(['error' => 'Unit dan rentang tanggal sewa tidak valid.'], 422);
    }
    if (!preg_match('/^628\d{7,13}$/', $waNumber)) {
        jsonResponse(['error' => 'Nomor WhatsApp aktif tidak valid (contoh: 081234567890).'], 422);
    }
    if (strlen($nik) !== 16) {
        jsonResponse(['error' => 'NIK e-KTP harus terdiri dari tepat 16 digit angka.'], 422);
    }
    if (!$termsOk) {
        jsonResponse(['error' => 'Anda wajib menyetujui syarat & ketentuan operasional Pulau Batam.'], 422);
    }

    try {
        $ktpPath    = saveUploadedKycImage('ktp_photo', 'ktp');
        $kkPath     = saveUploadedKycImage('kk_photo', 'kk');
        $simPath    = saveUploadedKycImage('sim_photo', 'sim');
        $selfiePath = saveUploadedKycImage('selfie_photo', 'selfie');
    } catch (RuntimeException $e) {
        jsonResponse(['error' => $e->getMessage()], 422);
    }

    if ($ktpPath === '' || $kkPath === '') {
        jsonResponse(['error' => 'Foto e-KTP dan Foto Kartu Keluarga (KK) wajib diunggah.'], 422);
    }
    if (!$withDriver && $simPath === '') {
        jsonResponse(['error' => 'Untuk sewa lepas kunci, foto SIM A aktif wajib diunggah.'], 422);
    }

    $pdo->beginTransaction();
    try {
        $vStmt = $pdo->prepare('SELECT * FROM vehicles WHERE id = ? FOR UPDATE');
        $vStmt->execute([$vehicleId]);
        $vehicle = $vStmt->fetch();
        if (!$vehicle || $vehicle['status'] === 'maintenance') {
            $pdo->rollBack();
            jsonResponse(['error' => 'Kendaraan sedang tidak tersedia untuk dipesan.'], 409);
        }

        $overlapStmt = $pdo->prepare(
            "SELECT COUNT(*) FROM bookings
             WHERE vehicle_id = ?
               AND booking_status IN ('pending', 'confirmed', 'active')
               AND start_date <= ? AND end_date >= ?"
        );
        $overlapStmt->execute([$vehicleId, $endDate, $startDate]);
        if ((int) $overlapStmt->fetchColumn() > 0) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Tanggal yang dipilih sudah dipesan pelanggan lain.'], 409);
        }

        $days         = max(1, (int) ((strtotime($endDate) - strtotime($startDate)) / 86400));
        $baseAmount   = (int) $vehicle['daily_rate'] * $days;
        $driverAmount = $withDriver ? ((int) $vehicle['driver_fee_per_day'] * $days) : 0;
        $taxAmount    = (int) round(($baseAmount + $driverAmount) * 0.11);
        $totalAmount  = $baseAmount + $driverAmount + $taxAmount;
        $bookingCode  = 'NDV-' . date('Ymd') . '-' . strtoupper(bin2hex(random_bytes(2)));

        $ins = $pdo->prepare(
            'INSERT INTO bookings (
                booking_code, user_id, vehicle_id, customer_name, customer_whatsapp, notes, ktp_number,
                ktp_photo_path, kk_photo_path, sim_photo_path, selfie_photo_path,
                terms_accepted, kyc_status, kyc_notes, start_date, end_date, total_days,
                with_driver, pickup_location, base_amount, driver_amount, tax_amount, total_amount
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $ins->execute([
            $bookingCode, $userId, $vehicleId, $custName !== '' ? $custName : 'Penyewa Batam', $waNumber, $notes, $nik,
            $ktpPath, $kkPath, $simPath, $selfiePath,
            'pending', '', $startDate, $endDate, $days,
            $withDriver ? 1 : 0, $pickupLoc,
            $baseAmount, $driverAmount, $taxAmount, $totalAmount,
        ]);
        $bookingId = (int) $pdo->lastInsertId();
        $pdo->commit();

        sendWhatsappNotification($pdo, [
            'booking_id'      => $bookingId,
            'booking_code'    => $bookingCode,
            'recipient_phone' => $waNumber,
            'event_type'      => 'booking_created',
            'message_body'    => "Booking {$bookingCode} untuk {$vehicle['name']} ({$startDate} s/d {$endDate}) sebesar Rp " . number_format($totalAmount, 0, ',', '.') . " berhasil dibuat. Silakan selesaikan pembayaran.",
        ]);

        $sel = $pdo->prepare(
            'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, COALESCE(NULLIF(b.customer_name, \'\'), u.name) AS customer_name, u.name AS user_name
             FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id JOIN users u ON b.user_id = u.id WHERE b.id = ?'
        );
        $sel->execute([$bookingId]);
        jsonResponse(['booking' => mapBookingRow($sel->fetch())], 201);
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        jsonResponse(['error' => 'Gagal memproses pemesanan: ' . $e->getMessage()], 500);
    }
}

jsonResponse(['error' => 'Method tidak diizinkan'], 405);
