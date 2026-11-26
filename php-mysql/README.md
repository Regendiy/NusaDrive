# NusaDrive Batam — Paket PHP 8.2 & MySQL (Tampilan Penuh & Siap XAMPP)

Paket ini berisi versi **PHP 8 + MySQL (PDO)** dengan tampilan dan alur fitur lengkap seperti pratinjau NusaDrive Batam:
- Katalog 6 armada Batam lengkap dengan foto mobil, filter kategori, filter BBM, dual slider tarif harian, transmisi, dan banner promo.
- Peta interaktif titik jemput Batam & pelacakan GPS armada real-time.
- Pemesanan dengan unggah berkas KYC (e-KTP, Kartu Keluarga/KK, SIM A, Swafoto), pembayaran otomatis (QRIS/VA), dan struk digital siap cetak.
- Switcher akun langsung di navbar untuk mencoba portal **Pelanggan**, **Pemilik Mobil**, dan **Admin** (termasuk verifikasi foto KYC & log WhatsApp).

## Cara Menjalankan di XAMPP
1. Buka **XAMPP Control Panel**, lalu klik **Start** pada **Apache** dan **MySQL**.
2. Ekstrak folder ZIP ini ke direktori `htdocs` XAMPP Anda:
   - Windows: `C:\xampp\htdocs\nusadrive-batam-php-mysql`
   - macOS: `/Applications/XAMPP/htdocs/nusadrive-batam-php-mysql`
3. Buka `http://localhost/phpmyadmin` → tab **Import** → pilih `schema.sql` → klik **Import / Go** *(opsional: aplikasi juga otomatis membuat database & tabel saat pertama dibuka jika MySQL sudah berjalan)*.
4. Buka di browser:
   - `http://localhost/nusadrive-batam-php-mysql/`
