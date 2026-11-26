<?php
declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

$dbError = null;
$vehicles = [];
$bookings = [];
$notifications = [];
$users = [];

try {
    $pdo = getDbConnection();

    $vRows = $pdo->query('SELECT * FROM vehicles ORDER BY id ASC')->fetchAll();
    foreach ($vRows as $row) {
        $vehicles[] = [
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

    $bRows = $pdo->query(
        'SELECT b.*, v.name AS vehicle_name, v.plate_number, v.owner_user_id, v.owner_name, v.owner_share_percent, u.name AS customer_name
         FROM bookings b
         JOIN vehicles v ON b.vehicle_id = v.id
         JOIN users u ON b.user_id = u.id
         ORDER BY b.created_at DESC, b.id DESC'
    )->fetchAll();
    foreach ($bRows as $row) {
        $bookings[] = [
            'id'                => (int) $row['id'],
            'bookingCode'       => (string) $row['booking_code'],
            'userId'            => (int) $row['user_id'],
            'vehicleId'         => (int) $row['vehicle_id'],
            'vehicleName'       => (string) $row['vehicle_name'],
            'plateNumber'       => (string) $row['plate_number'],
            'customerName'      => (string) $row['customer_name'],
            'customerWhatsapp'  => (string) $row['customer_whatsapp'],
            'ownerUserId'       => $row['owner_user_id'] !== null ? (int) $row['owner_user_id'] : null,
            'ownerName'         => (string) ($row['owner_name'] ?? 'Mitra Batam'),
            'ownerSharePercent' => (int) ($row['owner_share_percent'] ?? 80),
            'ktpNumber'         => (string) ($row['ktp_number'] ?? ''),
            'ktpPhotoPath'      => (string) ($row['ktp_photo_path'] ?? ''),
            'kkPhotoPath'       => (string) ($row['kk_photo_path'] ?? ''),
            'simPhotoPath'      => (string) ($row['sim_photo_path'] ?? ''),
            'selfiePhotoPath'   => (string) ($row['selfie_photo_path'] ?? ''),
            'termsAccepted'     => (bool) $row['terms_accepted'],
            'kycStatus'         => (string) ($row['kyc_status'] ?? 'pending'),
            'kycNotes'          => (string) ($row['kyc_notes'] ?? ''),
            'startDate'         => (string) $row['start_date'],
            'endDate'           => (string) $row['end_date'],
            'totalDays'         => (int) $row['total_days'],
            'withDriver'        => (bool) $row['with_driver'],
            'pickupLocation'    => (string) $row['pickup_location'],
            'baseAmount'        => (int) $row['base_amount'],
            'driverAmount'      => (int) $row['driver_amount'],
            'taxAmount'         => (int) $row['tax_amount'],
            'totalAmount'       => (int) $row['total_amount'],
            'bookingStatus'     => (string) $row['booking_status'],
            'paymentStatus'     => (string) $row['payment_status'],
            'paymentMethod'     => $row['payment_method'] !== null ? (string) $row['payment_method'] : null,
            'paymentReference'  => $row['payment_reference'] !== null ? (string) $row['payment_reference'] : null,
            'paidAt'            => $row['paid_at'] !== null ? (string) $row['paid_at'] : null,
            'createdAt'         => (string) $row['created_at'],
        ];
    }

    $nRows = $pdo->query('SELECT * FROM whatsapp_notifications ORDER BY id DESC LIMIT 100')->fetchAll();
    foreach ($nRows as $r) {
        $notifications[] = [
            'id'             => (int) $r['id'],
            'bookingId'      => $r['booking_id'] !== null ? (int) $r['booking_id'] : null,
            'bookingCode'    => (string) $r['booking_code'],
            'recipientPhone' => (string) $r['recipient_phone'],
            'eventType'      => (string) $r['event_type'],
            'messageBody'    => (string) $r['message_body'],
            'deliveryStatus' => (string) $r['delivery_status'],
            'providerRef'    => (string) $r['provider_ref'],
            'createdAt'      => (string) $r['created_at'],
        ];
    }

    $uRows = $pdo->query('SELECT id, name, email, whatsapp_number, role FROM users ORDER BY id ASC')->fetchAll();
    foreach ($uRows as $u) {
        $users[] = [
            'id'       => (int) $u['id'],
            'name'     => (string) $u['name'],
            'email'    => (string) $u['email'],
            'whatsapp' => (string) $u['whatsapp_number'],
            'role'     => (string) $u['role'],
        ];
    }
} catch (Throwable $e) {
    $dbError = 'Gagal terhubung ke MySQL XAMPP: ' . $e->getMessage();
}

$initialView = $_GET['view'] ?? 'armada';
if (!in_array($initialView, ['armada', 'pelanggan', 'pemilik', 'admin'], true)) {
    $initialView = 'armada';
}

$bootstrapJson = json_encode([
    'initialView'   => $initialView,
    'dbError'       => $dbError,
    'vehicles'      => $vehicles,
    'bookings'      => $bookings,
    'notifications' => $notifications,
    'users'         => $users,
], JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_HEX_AMP);
?>
<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>NusaDrive Batam — Rental Mobil &amp; Manajemen Pemesanan</title>
  <meta name="description" content="Platform rental mobil di Batam dengan manajemen pemesanan responsif, peta titik jemput interaktif, pembayaran otomatis, struk digital, dan notifikasi WhatsApp real-time." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin="" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            display: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace']
          }
        }
      }
    };
  </script>
  <script>
    (function () {
      try {
        var stored = localStorage.getItem('nusadrive_theme');
        var isDark =
          stored === 'dark' ||
          (stored !== 'light' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.style.colorScheme = 'light';
        }
      } catch (e) {}
    })();
  </script>
  <style>
    html { font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif; scroll-behavior: smooth; }
    h1, h2, h3, h4, .font-display { font-family: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif; }
    .tabular-nums { font-variant-numeric: tabular-nums; }

    .dual-range-input {
      -webkit-appearance: none;
      appearance: none;
      pointer-events: none;
      background: transparent;
    }
    .dual-range-input::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      pointer-events: auto;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #1d4ed8;
      border: 2.5px solid #ffffff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.35);
      cursor: pointer;
      transition: transform 0.12s ease, background-color 0.15s ease;
    }
    .dark .dual-range-input::-webkit-slider-thumb {
      background: #60a5fa;
      border-color: #0f172a;
    }
    .dual-range-input::-webkit-slider-thumb:hover { transform: scale(1.1); }
    .dual-range-input::-moz-range-thumb {
      pointer-events: auto;
      width: 18px;
      height: 18px;
      border-radius: 9999px;
      background: #1d4ed8;
      border: 2.5px solid #ffffff;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.35);
      cursor: pointer;
    }
    .dark .dual-range-input::-moz-range-thumb {
      background: #60a5fa;
      border-color: #0f172a;
    }

    @keyframes promoSlideDown {
      0% { opacity: 0; transform: translateY(-20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .animate-promo-slide-down {
      animation: promoSlideDown 480ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @media print {
      body * { visibility: hidden; }
      [data-receipt-printable="true"],
      [data-receipt-printable="true"] * { visibility: visible; }
      [data-receipt-printable="true"] {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        max-width: 100%;
        background: #ffffff;
        color: #0f172a;
        box-shadow: none !important;
        border-color: #cbd5e1 !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-700 selection:text-white transition-colors duration-200">
  <div id="app-shell" class="min-h-screen flex flex-col">
    <!-- Sticky Header -->
    <header class="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <a href="#top" data-nav="armada" class="font-display text-xl font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          NusaDrive
        </a>

        <nav aria-label="Navigasi utama" class="hidden md:flex items-center gap-7" id="desktop-nav">
          <button type="button" data-nav="armada" class="nav-tab py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2">Armada</button>
          <button type="button" data-nav="pelanggan" class="nav-tab py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2">Pelanggan</button>
          <button type="button" data-nav="pemilik" class="nav-tab py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2">Pemilik Mobil</button>
          <button type="button" data-nav="admin" class="nav-tab py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 border-b-2">Admin</button>
        </nav>

        <div class="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="theme-toggle-btn"
            aria-label="Ganti tema tampilan"
            class="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
          ></button>

          <div class="hidden md:block relative">
            <select
              id="role-account-select"
              aria-label="Pilih akun pengguna aktif"
              class="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-700"
            >
              <option value="customer">Akun: Pelanggan (Budi)</option>
              <option value="owner">Akun: Pemilik Mobil (Hendra)</option>
              <option value="admin">Akun: Admin Operasional</option>
            </select>
          </div>

          <button
            type="button"
            id="mobile-menu-btn"
            aria-label="Buka menu navigasi"
            class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
        </div>
      </div>

      <div id="mobile-drawer" class="hidden md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 space-y-1">
        <button type="button" data-nav="armada" class="mobile-nav-tab w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg">Armada</button>
        <button type="button" data-nav="pelanggan" class="mobile-nav-tab w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg">Pelanggan</button>
        <button type="button" data-nav="pemilik" class="mobile-nav-tab w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg">Pemilik Mobil</button>
        <button type="button" data-nav="admin" class="mobile-nav-tab w-full text-left px-3 min-h-[44px] flex items-center text-sm font-medium rounded-lg">Admin</button>
        <div class="pt-2 border-t border-slate-200 dark:border-slate-800">
          <select
            id="mobile-role-select"
            aria-label="Pilih akun aktif mobile"
            class="w-full px-3 py-2.5 text-sm font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          >
            <option value="customer">Akun: Pelanggan (Budi)</option>
            <option value="owner">Akun: Pemilik Mobil (Hendra)</option>
            <option value="admin">Akun: Admin Operasional</option>
          </select>
        </div>
      </div>
    </header>

    <?php if ($dbError !== null): ?>
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div class="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-sm text-red-800 dark:text-red-200">
          <strong>Peringatan Koneksi Database:</strong> <?= htmlspecialchars($dbError, ENT_QUOTES, 'UTF-8') ?>. Pastikan layanan <strong>MySQL</strong> di XAMPP Control Panel aktif.
        </div>
      </div>
    <?php endif; ?>

    <main id="app-main" class="flex-1"></main>

    <footer class="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 py-8 transition-colors">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <p class="font-medium text-slate-700 dark:text-slate-200">
          NusaDrive Fleet &amp; Mobility · Batam, Kepulauan Riau
        </p>
        <div class="flex flex-wrap items-center justify-center gap-6">
          <button type="button" data-nav="armada" class="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Armada</button>
          <button type="button" data-nav="pelanggan" class="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Portal Pelanggan</button>
          <button type="button" data-nav="pemilik" class="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Pemilik Mobil</button>
          <button type="button" data-nav="admin" class="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0">Admin</button>
        </div>
        <p>© <?= date('Y') ?> NusaDrive Batam. Seluruh hak cipta dilindungi.</p>
      </div>
    </footer>
  </div>

  <div id="modal-root"></div>
  <div id="toast-root" class="hidden fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 dark:bg-slate-800 text-white text-xs sm:text-sm px-4 py-3 rounded-lg border border-slate-700 shadow-lg"></div>

  <script>
    window.__NUSADRIVE_BOOTSTRAP__ = <?= $bootstrapJson ?>;
  </script>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
  <script src="assets/app.js"></script>
</body>
</html>
