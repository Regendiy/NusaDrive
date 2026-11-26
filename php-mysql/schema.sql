-- NusaDrive Batam: Skema Database MySQL / MariaDB (XAMPP Ready)
CREATE DATABASE IF NOT EXISTS nusadrive_rental
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nusadrive_rental;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  whatsapp_number VARCHAR(24) NOT NULL,
  role ENUM('admin', 'owner', 'customer') NOT NULL DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  owner_user_id BIGINT UNSIGNED NULL,
  owner_name VARCHAR(140) NOT NULL DEFAULT 'Mitra NusaDrive Batam',
  owner_share_percent TINYINT UNSIGNED NOT NULL DEFAULT 80,
  name VARCHAR(140) NOT NULL,
  brand VARCHAR(80) NOT NULL,
  category ENUM('MPV', 'SUV', 'Sedan', 'EV') NOT NULL,
  plate_number VARCHAR(20) NOT NULL UNIQUE,
  year SMALLINT UNSIGNED NOT NULL,
  transmission ENUM('Otomatis', 'Manual') NOT NULL DEFAULT 'Otomatis',
  fuel_type ENUM('Bensin', 'Hybrid', 'Listrik', 'Diesel') NOT NULL,
  seats TINYINT UNSIGNED NOT NULL DEFAULT 5,
  daily_rate INT UNSIGNED NOT NULL,
  driver_fee_per_day INT UNSIGNED NOT NULL DEFAULT 200000,
  image_url VARCHAR(255) NOT NULL,
  status ENUM('available', 'rented', 'maintenance') NOT NULL DEFAULT 'available',
  current_lat DECIMAL(9,6) NOT NULL DEFAULT 1.128600,
  current_lng DECIMAL(9,6) NOT NULL DEFAULT 104.053900,
  current_speed_kmh SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  current_heading SMALLINT UNSIGNED NOT NULL DEFAULT 90,
  tracking_status ENUM('parked', 'en_route', 'idle') NOT NULL DEFAULT 'parked',
  tracking_location_label VARCHAR(160) NOT NULL DEFAULT 'Pool Batam Centre',
  gps_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  features LONGTEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_vehicles_owner FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_vehicles_category_status (category, status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS bookings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_code VARCHAR(32) NOT NULL UNIQUE,
  user_id BIGINT UNSIGNED NOT NULL,
  vehicle_id BIGINT UNSIGNED NOT NULL,
  customer_name VARCHAR(120) NOT NULL DEFAULT 'Penyewa Batam',
  customer_whatsapp VARCHAR(24) NOT NULL,
  notes VARCHAR(255) NOT NULL DEFAULT '',
  ktp_number VARCHAR(20) NOT NULL DEFAULT '',
  ktp_photo_path VARCHAR(255) NOT NULL DEFAULT '',
  kk_photo_path VARCHAR(255) NOT NULL DEFAULT '',
  sim_photo_path VARCHAR(255) NOT NULL DEFAULT '',
  selfie_photo_path VARCHAR(255) NOT NULL DEFAULT '',
  terms_accepted TINYINT(1) NOT NULL DEFAULT 1,
  kyc_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  kyc_notes VARCHAR(255) NOT NULL DEFAULT '',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days SMALLINT UNSIGNED NOT NULL,
  with_driver TINYINT(1) NOT NULL DEFAULT 0,
  pickup_location VARCHAR(200) NOT NULL,
  base_amount INT UNSIGNED NOT NULL,
  driver_amount INT UNSIGNED NOT NULL DEFAULT 0,
  tax_amount INT UNSIGNED NOT NULL,
  total_amount INT UNSIGNED NOT NULL,
  booking_status ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
  payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
  payment_method VARCHAR(60) DEFAULT NULL,
  payment_reference VARCHAR(120) DEFAULT NULL,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_bookings_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  INDEX idx_bookings_vehicle_dates (vehicle_id, start_date, end_date),
  INDEX idx_bookings_user (user_id, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS whatsapp_notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  booking_id BIGINT UNSIGNED NULL,
  booking_code VARCHAR(32) NOT NULL,
  recipient_phone VARCHAR(24) NOT NULL,
  event_type ENUM('booking_created', 'payment_confirmed', 'pickup_ready', 'rental_completed', 'booking_cancelled') NOT NULL,
  message_body TEXT NOT NULL,
  delivery_status ENUM('delivered', 'queued_retry', 'failed') NOT NULL DEFAULT 'delivered',
  provider_ref VARCHAR(80) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_wa_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL
) ENGINE=InnoDB;

INSERT IGNORE INTO users (id, name, email, password_hash, whatsapp_number, role)
VALUES
  (1, 'Admin Operasional Batam', 'admin@nusadrive.id', '$2y$10$demoHashOnlyForLocalXamppSeed000000000000000000000', '628117700123', 'admin'),
  (2, 'Hendra Wijaya (Mitra Batam)', 'owner@nusadrive.id', '$2y$10$demoHashOnlyForLocalXamppSeed000000000000000000000', '6281270001122', 'owner'),
  (3, 'Budi Santoso', 'budi@example.com', '$2y$10$demoHashOnlyForLocalXamppSeed000000000000000000000', '6281377889900', 'customer');

INSERT IGNORE INTO vehicles (
  id, owner_user_id, owner_name, owner_share_percent, name, brand, category,
  plate_number, year, transmission, fuel_type, seats, daily_rate, driver_fee_per_day,
  image_url, status, current_lat, current_lng, current_speed_kmh, current_heading,
  tracking_status, tracking_location_label, features
)
VALUES
  (1, 2, 'PT Kepri Otomotif Sejahtera', 80, 'Toyota Alphard Hybrid', 'Toyota', 'MPV', 'BP 1924 NDV', 2025, 'Otomatis', 'Hybrid', 7, 2450000, 300000, 'assets/images/car_mpv_zenix_1794672684036.jpg', 'available', 1.121000, 104.118600, 0, 90, 'parked', 'Bandara Internasional Hang Nadim', '["Captain Seat Ottoman","Dual Sunroof","Apple CarPlay","Asuransi All-Risk"]'),
  (2, 2, 'Hendra Wijaya (Mitra Batam)', 82, 'Toyota Kijang Innova Zenix Q', 'Toyota', 'MPV', 'BP 2481 KJN', 2025, 'Otomatis', 'Hybrid', 7, 950000, 200000, 'assets/images/car_mpv_zenix_1794672684036.jpg', 'available', 1.142200, 104.013800, 38, 115, 'en_route', 'Kawasan Bisnis Nagoya Hill', '["TSS 3.0 Safety","Panoramic Roof","Wireless Charger","Asuransi All-Risk"]'),
  (3, 2, 'PT Barelang Executive Fleet', 78, 'Range Rover Autobiography', 'Land Rover', 'SUV', 'BP 8801 RVR', 2025, 'Otomatis', 'Hybrid', 5, 4200000, 350000, 'assets/images/car_suv_fortuner_1794672684762.jpg', 'available', 1.153600, 104.000500, 44, 145, 'en_route', 'Pelabuhan Ferry Harbour Bay', '["Air Suspension","Meridian Audio","360 Camera","Chauffeur Ready"]'),
  (4, NULL, 'Siti Rahma (Mitra Batam)', 80, 'Mitsubishi Pajero Sport Dakar', 'Mitsubishi', 'SUV', 'BP 1409 PJR', 2024, 'Otomatis', 'Diesel', 7, 1150000, 225000, 'assets/images/car_suv_fortuner_1794672684762.jpg', 'available', 0.981400, 104.041900, 56, 15, 'en_route', 'Jembatan 1 Barelang', '["4x2 Turbo Diesel","Adaptive Cruise","Sunroof","Asuransi All-Risk"]'),
  (5, NULL, 'Batam EV Mobility Partners', 85, 'Hyundai IONIQ 5 Signature', 'Hyundai', 'EV', 'BP 7720 ELV', 2025, 'Otomatis', 'Listrik', 5, 1650000, 250000, 'assets/images/car_ev_ioniq_1794672685380.jpg', 'available', 1.189500, 104.095800, 0, 210, 'parked', 'Nongsa Pura & Resort Coast', '["Bebas Ganjil Genap","Fast Charging 350kW","V2L Power","Bose Audio"]'),
  (6, NULL, 'NusaDrive Official Batam', 80, 'BMW 735i M Sport Executive', 'BMW', 'Sedan', 'BP 3092 BMW', 2025, 'Otomatis', 'Bensin', 5, 3600000, 350000, 'assets/images/car_sedan_camry_1794672685228.jpg', 'available', 1.128600, 104.053900, 0, 90, 'parked', 'Pool Batam Centre (Jl. Engku Putri)', '["Executive Lounge","Ambient Light","Park Assist Pro","Asuransi All-Risk"]');

INSERT IGNORE INTO bookings (
  id, booking_code, user_id, vehicle_id, customer_whatsapp, ktp_number,
  ktp_photo_path, kk_photo_path, sim_photo_path, selfie_photo_path,
  terms_accepted, kyc_status, kyc_notes, start_date, end_date, total_days,
  with_driver, pickup_location, base_amount, driver_amount, tax_amount,
  total_amount, booking_status, payment_status, payment_method, payment_reference, paid_at
)
VALUES
  (1, 'NDV-20261124-BTM1', 3, 2, '6281377889900', '2171051208940001', 'assets/images/car_mpv_zenix_1794672684036.jpg', 'assets/images/car_mpv_zenix_1794672684036.jpg', 'assets/images/car_mpv_zenix_1794672684036.jpg', '', 1, 'verified', 'Dokumen e-KTP, KK, dan SIM A terverifikasi loket Batam Centre.', DATE_SUB(CURDATE(), INTERVAL 1 DAY), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, 0, 'Batam Centre · Pelabuhan Ferry Internasional', 1900000, 0, 209000, 2109000, 'active', 'paid', 'QRIS Instan', 'TRX-NDV-908112', NOW());

INSERT IGNORE INTO whatsapp_notifications (
  id, booking_id, booking_code, recipient_phone, event_type, message_body, delivery_status, provider_ref
)
VALUES
  (1, 1, 'NDV-20261124-BTM1', '6281377889900', 'payment_confirmed', 'Pembayaran QRIS untuk booking NDV-20261124-BTM1 (Toyota Kijang Innova Zenix Q) telah lunas dan siap di Pelabuhan Ferry Batam Centre.', 'delivered', 'WA-BTM901');
