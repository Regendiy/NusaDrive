<?php
declare(strict_types=1);

require_once __DIR__ . '/../config/database.php';

$pdo = getDbConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

$waypoints = [
    ['label' => 'Pool Batam Centre (Jl. Engku Putri)', 'lat' => 1.128600, 'lng' => 104.053900, 'speed' => 0,  'heading' => 90,  'status' => 'parked'],
    ['label' => 'Bandara Internasional Hang Nadim',    'lat' => 1.121000, 'lng' => 104.118600, 'speed' => 46, 'heading' => 75,  'status' => 'en_route'],
    ['label' => 'Kawasan Bisnis Nagoya Hill',          'lat' => 1.142200, 'lng' => 104.013800, 'speed' => 34, 'heading' => 115, 'status' => 'en_route'],
    ['label' => 'Pelabuhan Ferry Harbour Bay',         'lat' => 1.153600, 'lng' => 104.000500, 'speed' => 42, 'heading' => 145, 'status' => 'en_route'],
    ['label' => 'Jembatan 1 Barelang',                 'lat' => 0.981400, 'lng' => 104.041900, 'speed' => 58, 'heading' => 15,  'status' => 'en_route'],
    ['label' => 'Nongsa Pura & Resort Coast',          'lat' => 1.189500, 'lng' => 104.095800, 'speed' => 0,  'heading' => 210, 'status' => 'parked'],
];

if ($method === 'GET') {
    $rows = $pdo->query('SELECT id, name, plate_number, owner_name, status, current_lat, current_lng, current_speed_kmh, current_heading, tracking_status, tracking_location_label, gps_updated_at FROM vehicles ORDER BY id ASC')->fetchAll();
    jsonResponse(['vehicles' => $rows]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input') ?: '{}', true) ?? [];
    $vehicleId = (int) ($input['vehicleId'] ?? $input['vehicle_id'] ?? 0);
    if (!$vehicleId) {
        jsonResponse(['error' => 'ID kendaraan wajib diisi.'], 422);
    }

    $curStmt = $pdo->prepare('SELECT * FROM vehicles WHERE id = ?');
    $curStmt->execute([$vehicleId]);
    $current = $curStmt->fetch();
    if (!$current) {
        jsonResponse(['error' => 'Kendaraan tidak ditemukan.'], 404);
    }

    $currentIdx = 0;
    foreach ($waypoints as $idx => $wp) {
        if ($wp['label'] === $current['tracking_location_label']) {
            $currentIdx = $idx;
            break;
        }
    }
    $next = $waypoints[($currentIdx + 1) % count($waypoints)];

    $upd = $pdo->prepare(
        'UPDATE vehicles
         SET tracking_location_label = ?, current_lat = ?, current_lng = ?, current_speed_kmh = ?, current_heading = ?, tracking_status = ?, gps_updated_at = NOW()
         WHERE id = ?'
    );
    $upd->execute([$next['label'], $next['lat'], $next['lng'], $next['speed'], $next['heading'], $next['status'], $vehicleId]);

    $after = $pdo->prepare('SELECT * FROM vehicles WHERE id = ?');
    $after->execute([$vehicleId]);
    $v = $after->fetch();

    jsonResponse([
        'vehicle' => [
            'id'                    => (int) $v['id'],
            'name'                  => (string) $v['name'],
            'plateNumber'           => (string) $v['plate_number'],
            'currentLat'            => (string) $v['current_lat'],
            'currentLng'            => (string) $v['current_lng'],
            'currentSpeedKmh'       => (int) $v['current_speed_kmh'],
            'currentHeading'        => (int) $v['current_heading'],
            'trackingStatus'        => (string) $v['tracking_status'],
            'trackingLocationLabel' => (string) $v['tracking_location_label'],
            'gpsUpdatedAt'          => (string) $v['gps_updated_at'],
        ],
    ]);
}

jsonResponse(['error' => 'Method tidak diizinkan'], 405);
