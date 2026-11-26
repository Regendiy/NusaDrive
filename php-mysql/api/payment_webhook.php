<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/whatsapp_notify.php';

/**
 * Pembayaran Otomatis & Webhook Gateway (XAMPP & Production compatible)
 */
$payload = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
$orderId       = (string) ($payload['order_id'] ?? $payload['bookingCode'] ?? '');
$statusCode    = (string) ($payload['status_code'] ?? '200');
$grossAmount   = (string) ($payload['gross_amount'] ?? '');
$signatureKey  = (string) ($payload['signature_key'] ?? '');
$checkoutMode  = (string) ($payload['checkout_mode'] ?? '');
$paymentMethod = (string) ($payload['payment_type'] ?? $payload['paymentMethod'] ?? 'QRIS Instan');

$pdo = getDbConnection();
$stmt = $pdo->prepare(
    'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, u.name AS customer_name
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON b.user_id = u.id
     WHERE b.booking_code = ?'
);
$stmt->execute([$orderId]);
$booking = $stmt->fetch();

if (!$booking) {
    jsonResponse(['error' => 'Booking tidak ditemukan'], 404);
}

// Verifikasi signature webhook eksternal jika tidak dipanggil dari UI lokal XAMPP
if ($checkoutMode !== 'xampp_gateway') {
    $serverKey = getenv('PAYMENT_SERVER_KEY') ?: 'demo_server_key';
    $expectedSig = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
    if (!hash_equals($expectedSig, $signatureKey)) {
        jsonResponse(['error' => 'Signature pembayaran tidak valid'], 403);
    }
}

$paymentRef = (string) ($payload['transaction_id'] ?? ('TRX-NDV-' . strtoupper(bin2hex(random_bytes(3)))));

$upd = $pdo->prepare(
    "UPDATE bookings
     SET payment_status = 'paid',
         booking_status = 'confirmed',
         payment_method = ?,
         payment_reference = ?,
         paid_at = NOW()
     WHERE id = ?"
);
$upd->execute([$paymentMethod, $paymentRef, $booking['id']]);

sendWhatsappNotification($pdo, [
    'booking_id'      => (int) $booking['id'],
    'booking_code'    => $booking['booking_code'],
    'recipient_phone' => $booking['customer_whatsapp'],
    'event_type'      => 'payment_confirmed',
    'message_body'    => "Pembayaran Lunas ({$paymentMethod})! Booking {$booking['booking_code']} ({$booking['vehicle_name']}) telah dikonfirmasi otomatis. Referensi: {$paymentRef}.",
]);

$after = $pdo->prepare(
    'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, u.name AS customer_name
     FROM bookings b
     JOIN vehicles v ON b.vehicle_id = v.id
     JOIN users u ON b.user_id = u.id
     WHERE b.id = ?'
);
$after->execute([$booking['id']]);
$row = $after->fetch();

jsonResponse([
    'status'  => 'ok',
    'booking' => [
        'id'               => (int) $row['id'],
        'bookingCode'      => (string) $row['booking_code'],
        'vehicleId'        => (int) $row['vehicle_id'],
        'vehicleName'      => (string) $row['vehicle_name'],
        'plateNumber'      => (string) $row['plate_number'],
        'customerName'     => (string) $row['customer_name'],
        'customerWhatsapp' => (string) $row['customer_whatsapp'],
        'ktpNumber'        => (string) $row['ktp_number'],
        'kycStatus'        => (string) $row['kyc_status'],
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
        'paymentMethod'    => (string) $row['payment_method'],
        'paymentReference' => (string) $row['payment_reference'],
        'paidAt'           => (string) $row['paid_at'],
    ],
]);
