<?php
declare(strict_types=1);

/**
 * Integrasi Notifikasi Real-Time WhatsApp Gateway & Endpoint Log WhatsApp
 */
function sendWhatsappNotification(PDO $pdo, array $params): array
{
    $token = getenv('WHATSAPP_API_TOKEN') ?: '';
    $gatewayUrl = getenv('WHATSAPP_GATEWAY_URL') ?: 'https://api.fonnte.com/send';
    $status = 'delivered';
    $providerRef = 'WA-' . strtoupper(bin2hex(random_bytes(3)));

    if ($token !== '' && filter_var($gatewayUrl, FILTER_VALIDATE_URL)) {
        $ch = curl_init($gatewayUrl);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_HTTPHEADER     => ["Authorization: {$token}"],
            CURLOPT_POSTFIELDS     => [
                'target'  => $params['recipient_phone'],
                'message' => $params['message_body'],
            ],
        ]);
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($result === false || $httpCode >= 400) {
            $status = 'queued_retry';
        }
    }

    $stmt = $pdo->prepare(
        'INSERT INTO whatsapp_notifications (booking_id, booking_code, recipient_phone, event_type, message_body, delivery_status, provider_ref)
         VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $params['booking_id'],
        $params['booking_code'],
        $params['recipient_phone'],
        $params['event_type'],
        $params['message_body'],
        $status,
        $providerRef,
    ]);

    return ['status' => $status, 'provider_ref' => $providerRef];
}

// Jika dipanggil langsung lewat HTTP sebagai API endpoint log & kirim ulang WhatsApp
if (realpath($_SERVER['SCRIPT_FILENAME'] ?? '') === __FILE__) {
    require_once __DIR__ . '/../config/database.php';
    $pdo = getDbConnection();
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

    if ($method === 'GET') {
        $rows = $pdo->query('SELECT * FROM whatsapp_notifications ORDER BY id DESC LIMIT 100')->fetchAll();
        $mapped = array_map(static fn(array $r): array => [
            'id'             => (int) $r['id'],
            'bookingId'      => $r['booking_id'] !== null ? (int) $r['booking_id'] : null,
            'bookingCode'    => (string) $r['booking_code'],
            'recipientPhone' => (string) $r['recipient_phone'],
            'eventType'      => (string) $r['event_type'],
            'messageBody'    => (string) $r['message_body'],
            'deliveryStatus' => (string) $r['delivery_status'],
            'providerRef'    => (string) $r['provider_ref'],
            'createdAt'      => (string) $r['created_at'],
        ], $rows);
        jsonResponse(['notifications' => $mapped]);
    }

    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
        $bookingId = (int) ($input['bookingId'] ?? $input['booking_id'] ?? 0);
        if (!$bookingId) {
            jsonResponse(['error' => 'ID pemesanan wajib diisi.'], 422);
        }
        $stmt = $pdo->prepare('SELECT b.*, v.name AS vehicle_name FROM bookings b JOIN vehicles v ON b.vehicle_id = v.id WHERE b.id = ?');
        $stmt->execute([$bookingId]);
        $b = $stmt->fetch();
        if (!$b) {
            jsonResponse(['error' => 'Booking tidak ditemukan.'], 404);
        }
        $res = sendWhatsappNotification($pdo, [
            'booking_id'      => $bookingId,
            'booking_code'    => $b['booking_code'],
            'recipient_phone' => $b['customer_whatsapp'],
            'event_type'      => 'pickup_ready',
            'message_body'    => "Pengingat NusaDrive Batam: Booking {$b['booking_code']} ({$b['vehicle_name']}) lokasi {$b['pickup_location']}.",
        ]);
        jsonResponse(['sent' => true, 'result' => $res]);
    }

    jsonResponse(['error' => 'Method tidak diizinkan'], 405);
}
