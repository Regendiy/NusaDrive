<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

function mapVehicleRow(array $row): array
{
    return [
        'id'                    => (int) $row['id'],
        'ownerUserId'           => $row['owner_user_id'] !== null ? (int) $row['owner_user_id'] : null,
        'ownerName'             => (string) ($row['owner_name'] ?? 'Mitra NusaDrive Batam'),
        'ownerSharePercent'     => (int) ($row['owner_share_percent'] ?? 80),
        'name'                  => (string) $row['name'],
        'brand'                 => (string) $row['brand'],
        'category'              => (string) $row['category'],
        'plateNumber'           => (string) $row['plate_number'],
        'year'                  => (int) $row['year'],
        'transmission'          => (string) $row['transmission'],
        'fuelType'              => (string) $row['fuel_type'],
        'seats'                 => (int) $row['seats'],
        'dailyRate'             => (int) $row['daily_rate'],
        'driverFeePerDay'       => (int) $row['driver_fee_per_day'],
        'imageUrl'              => (string) $row['image_url'],
        'status'                => (string) $row['status'],
        'currentLat'            => (string) $row['current_lat'],
        'currentLng'            => (string) $row['current_lng'],
        'currentSpeedKmh'       => (int) $row['current_speed_kmh'],
        'currentHeading'        => (int) ($row['current_heading'] ?? 90),
        'trackingStatus'        => (string) $row['tracking_status'],
        'trackingLocationLabel' => (string) $row['tracking_location_label'],
        'gpsUpdatedAt'          => (string) $row['gps_updated_at'],
        'features'              => (string) $row['features'],
    ];
}

if ($method === 'GET') {
    $category = $_GET['category'] ?? null;
    if ($category && $category !== 'Semua') {
        $stmt = $pdo->prepare('SELECT * FROM vehicles WHERE category = ? ORDER BY id ASC');
        $stmt->execute([$category]);
    } else {
        $stmt = $pdo->query('SELECT * FROM vehicles ORDER BY id ASC');
    }
    $rows = array_map('mapVehicleRow', $stmt->fetchAll());
    jsonResponse(['vehicles' => $rows]);
}

$raw = json_decode(file_get_contents('php://input') ?: '{}', true);
$data = is_array($raw) ? $raw : [];
$action = $data['action'] ?? ($_POST['action'] ?? '');

if ($method === 'POST' && $action === 'claim_demo') {
    $ownerId = max(1, (int) ($data['ownerUserId'] ?? 2));
    $ownerName = trim((string) ($data['ownerName'] ?? 'Hendra Wijaya (Mitra Batam)'));
    $stmt = $pdo->prepare('UPDATE vehicles SET owner_user_id = ?, owner_name = ? WHERE owner_user_id IS NULL LIMIT 2');
    $stmt->execute([$ownerId, $ownerName]);
    $all = $pdo->query('SELECT * FROM vehicles ORDER BY id ASC')->fetchAll();
    jsonResponse(['vehicles' => array_map('mapVehicleRow', $all), 'claimed' => $stmt->rowCount()]);
}

if ($method === 'PATCH' || ($method === 'POST' && $action === 'update_status')) {
    $id = (int) ($data['id'] ?? $_GET['id'] ?? 0);
    $status = $data['status'] ?? '';
    if (!$id || !in_array($status, ['available', 'rented', 'maintenance'], true)) {
        jsonResponse(['error' => 'ID kendaraan atau status tidak valid.'], 422);
    }
    $upd = $pdo->prepare('UPDATE vehicles SET status = ? WHERE id = ?');
    $upd->execute([$status, $id]);
    $rowStmt = $pdo->prepare('SELECT * FROM vehicles WHERE id = ?');
    $rowStmt->execute([$id]);
    $updated = $rowStmt->fetch();
    if (!$updated) {
        jsonResponse(['error' => 'Kendaraan tidak ditemukan.'], 404);
    }
    jsonResponse(['vehicle' => mapVehicleRow($updated)]);
}

if ($method === 'DELETE' || ($method === 'POST' && $action === 'delete')) {
    $id = (int) ($data['id'] ?? $_GET['id'] ?? 0);
    if (!$id) {
        jsonResponse(['error' => 'ID kendaraan wajib diisi.'], 422);
    }
    $chk = $pdo->prepare("SELECT COUNT(*) FROM bookings WHERE vehicle_id = ? AND booking_status IN ('pending', 'confirmed', 'active')");
    $chk->execute([$id]);
    if ((int) $chk->fetchColumn() > 0) {
        jsonResponse(['error' => 'Tidak dapat menghapus unit yang masih memiliki booking aktif.'], 409);
    }
    $del = $pdo->prepare('DELETE FROM vehicles WHERE id = ?');
    $del->execute([$id]);
    jsonResponse(['deleted' => true, 'id' => $id]);
}

if ($method === 'POST') {
    $name = trim((string) ($data['name'] ?? ''));
    $brand = trim((string) ($data['brand'] ?? 'Toyota'));
    $category = (string) ($data['category'] ?? 'MPV');
    $plate = strtoupper(trim((string) ($data['plateNumber'] ?? $data['plate_number'] ?? '')));
    if ($name === '' || $plate === '') {
        jsonResponse(['error' => 'Nama model dan plat nomor wajib diisi.'], 422);
    }

    $presetImages = [
        'MPV'   => 'assets/images/car_mpv_zenix_1794672684036.jpg',
        'SUV'   => 'assets/images/car_suv_fortuner_1794672684762.jpg',
        'EV'    => 'assets/images/car_ev_ioniq_1794672685380.jpg',
        'Sedan' => 'assets/images/car_sedan_camry_1794672685228.jpg',
    ];
    $imageUrl = trim((string) ($data['imageUrl'] ?? $data['image_url'] ?? ''));
    if ($imageUrl === '') {
        $imageUrl = $presetImages[$category] ?? $presetImages['MPV'];
    }

    try {
        $stmt = $pdo->prepare(
            'INSERT INTO vehicles (
                owner_user_id, owner_name, owner_share_percent, name, brand, category,
                plate_number, year, transmission, fuel_type, seats, daily_rate,
                driver_fee_per_day, image_url, status, current_lat, current_lng,
                current_speed_kmh, current_heading, tracking_status, tracking_location_label, features
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            isset($data['ownerUserId']) ? (int) $data['ownerUserId'] : 2,
            trim((string) ($data['ownerName'] ?? 'Mitra Pemilik Batam')),
            min(90, max(60, (int) ($data['ownerSharePercent'] ?? 80))),
            $name,
            $brand,
            $category,
            $plate,
            max(2015, (int) ($data['year'] ?? 2025)),
            in_array($data['transmission'] ?? '', ['Otomatis', 'Manual'], true) ? $data['transmission'] : 'Otomatis',
            in_array($data['fuelType'] ?? $data['fuel_type'] ?? '', ['Bensin', 'Hybrid', 'Listrik', 'Diesel'], true)
                ? ($data['fuelType'] ?? $data['fuel_type'])
                : 'Bensin',
            max(2, min(12, (int) ($data['seats'] ?? 7))),
            max(250000, (int) ($data['dailyRate'] ?? $data['daily_rate'] ?? 850000)),
            max(0, (int) ($data['driverFeePerDay'] ?? $data['driver_fee_per_day'] ?? 200000)),
            $imageUrl,
            'available',
            1.128600,
            104.053900,
            0,
            90,
            'parked',
            'Pool Batam Centre (Jl. Engku Putri)',
            json_encode($data['features'] ?? ['Asuransi All-Risk', 'GPS Tracker Aktif']),
        ]);
    } catch (PDOException $e) {
        if ((string) $e->getCode() === '23000') {
            jsonResponse(['error' => 'Plat nomor sudah terdaftar di sistem.'], 409);
        }
        throw $e;
    }

    $newId = (int) $pdo->lastInsertId();
    $rowStmt = $pdo->prepare('SELECT * FROM vehicles WHERE id = ?');
    $rowStmt->execute([$newId]);
    jsonResponse(['vehicle' => mapVehicleRow($rowStmt->fetch())], 201);
}

jsonResponse(['error' => 'Method tidak diizinkan'], 405);
