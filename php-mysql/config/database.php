<?php
declare(strict_types=1);

/**
 * Koneksi PDO MySQL 8 / MariaDB untuk NusaDrive Batam (Siap XAMPP)
 * Otomatis membuat database & tabel dari schema.sql bila belum diimpor.
 */
function getDbConnection(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $port = getenv('DB_PORT') ?: '3306';
    $db   = getenv('DB_NAME') ?: 'nusadrive_rental';
    $user = getenv('DB_USER') ?: 'root';
    $pass = getenv('DB_PASS') ?: '';

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        $pdo = new PDO($dsn, $user, $pass, $options);
        ensureXamppSchemaReady($pdo);
        return $pdo;
    } catch (PDOException $e) {
        // Jika database belum dibuat di phpMyAdmin, bootstrap otomatis dari schema.sql
        if (str_contains($e->getMessage(), 'Unknown database') || (string) $e->getCode() === '1049') {
            $rootDsn = "mysql:host={$host};port={$port};charset=utf8mb4";
            $bootstrapPdo = new PDO($rootDsn, $user, $pass, $options);
            runSchemaFile($bootstrapPdo);
            $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
            $pdo = new PDO($dsn, $user, $pass, $options);
            return $pdo;
        }
        throw $e;
    }
}

function ensureXamppSchemaReady(PDO $pdo): void
{
    static $checked = false;
    if ($checked) {
        return;
    }
    $checked = true;

    try {
        $hasVehicles = $pdo->query("SHOW TABLES LIKE 'vehicles'")->fetchColumn();
        if (!$hasVehicles) {
            runSchemaFile($pdo);
            return;
        }

        // Pastikan kolom GPS & KYC tersedia bila user mengimpor versi lama
        $cols = $pdo->query('SHOW COLUMNS FROM vehicles')->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('current_heading', $cols, true)) {
            $pdo->exec("ALTER TABLE vehicles ADD COLUMN current_heading SMALLINT UNSIGNED NOT NULL DEFAULT 90 AFTER current_speed_kmh");
        }
        $bCols = $pdo->query('SHOW COLUMNS FROM bookings')->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('customer_name', $bCols, true)) {
            $pdo->exec("ALTER TABLE bookings ADD COLUMN customer_name VARCHAR(120) NOT NULL DEFAULT 'Penyewa Batam' AFTER vehicle_id");
        }
        if (!in_array('notes', $bCols, true)) {
            $pdo->exec("ALTER TABLE bookings ADD COLUMN notes VARCHAR(255) NOT NULL DEFAULT '' AFTER customer_whatsapp");
        }
    } catch (Throwable) {
        // Abaikan bila hak akses terbatas
    }
}

function runSchemaFile(PDO $pdo): void
{
    $schemaPath = dirname(__DIR__) . '/schema.sql';
    if (!is_file($schemaPath)) {
        return;
    }
    $sql = file_get_contents($schemaPath);
    if ($sql === false) {
        return;
    }
    // Pisahkan statement SQL dengan aman pada akhiran titik koma baris
    $statements = preg_split('/;\s*(\r?\n|$)/', $sql) ?: [];
    foreach ($statements as $stmt) {
        $trimmed = trim($stmt);
        if ($trimmed === '' || str_starts_with($trimmed, '--')) {
            continue;
        }
        $pdo->exec($trimmed);
    }
}

function jsonResponse(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}
