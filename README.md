# Sistem Informasi Penyewaan Lapangan Futsal (Chandra! Arena)

Sistem Informasi Penyewaan Lapangan Futsal ini dikembangkan sebagai bagian dari proyek praktikum mata kuliah **Rekayasa Perangkat Lunak (RPL)** di **ITB Stikom Bali**. Sistem ini dirancang untuk mendigitalisasi proses pemesanan lapangan konvensional guna menghindari kendala operasional seperti *double booking* (jadwal bentrok) dan pengelolaan pembayaran yang tidak terstruktur.

---

## Fitur Utama

Sistem ini memisahkan hak akses dan fungsionalitas menjadi 2 entitas pengguna:

### 1. Area Pelanggan (Customer Frontend)
*   **Autentikasi Mandiri:** Fitur pendaftaran akun baru menggunakan nomor WhatsApp unik serta modul login pengguna.
*   **Cek Ketersediaan Real-Time:** Menampilkan kalender visual interaktif dan matriks grid slot jam operasional (08.00 s.d. 23.00) yang membedakan slot kosong, menunggu konfirmasi, atau sudah disewa.
*   **Formulir Pemesanan Praktis:** Pengisian data pesanan (tanggal, jam mulai, durasi) langsung terintegrasi dengan deteksi konflik jadwal otomatis.
*   **Input Bukti Pembayaran:** Fitur unggah screenshot/foto resi bukti transfer bank untuk validasi transaksi sebelum diajukan ke admin.

### 2. Panel Manajemen (Admin Dashboard)
*   **Proteksi Halaman Admin:** Halaman manajemen terproteksi autentikasi *client-side* demi menjaga keamanan rekap data.
*   **Manajemen Status Sewa:** Mengubah status transaksi pemesanan masuk (Menyetujui, Menolak, atau Menghapus pesanan). Status pesanan yang disetujui otomatis memperbarui visual warna slot jadwal pelanggan secara *real-time*.
*   **Modul Edit Jadwal Fleksibel:** Kemampuan admin mengubah tanggal, jam, atau durasi sewa secara manual melalui jendela modal yang dilengkapi validasi bentrok internal.

---

## Teknologi & Arsitektur Sistem

Aplikasi ini dibangun menggunakan arsitektur **Pure Client-Side** murni, berjalan responsif, dan dioptimalkan penuh untuk dijalankan pada browser modern seperti Google Chrome.

*   **Frontend:** HTML5, CSS3 (Kustomisasi Layout Responsif), dan Vanilla JavaScript (Manipulasi DOM & Manajemen Event).
*   **Manajemen Data & State:** Memanfaatkan fitur bawaan browser **HTML5 LocalStorage**. Seluruh data akun pengguna, status lapangan, matriks jadwal, dan riwayat transaksi disimpan, diproses, dan dipertahankan secara lokal di dalam penyimpanan internal browser pengguna tanpa memerlukan server database eksternal yang kompleks.
*   **Alur Data:** Pemodelan sistem dirancang menggunakan Diagram Alir Data (DFD) Konteks hingga Level 1 untuk menjamin kebenaran logika aliran data transaksi.

---

## Cara Menjalankan Aplikasi

Karena aplikasi ini berbasis *client-side* murni tanpa membutuhkan server backend (seperti NodeJS atau PHP), Anda dapat menjalankannya dengan sangat mudah:

1.  **Clone Repositori Ini:**
    ```bash
    git clone (https://github.com/Chandra17-chan/Sistem-Informasi-Penyewaan-Lapangan-Futsal)
    ```
2.  **Jalankan Aplikasi:**
    *   Buka folder proyek hasil klon.
    *   Cari file utama halaman utama aplikasi (`index.html`).
    *   Klik dua kali (*double click*) file tersebut atau seret (*drag & drop*) file ke dalam browser **Google Chrome** atau **Microsoft Edge**.
3.  **Kredensial Akses Admin (Demo):**
    *   **Username Admin:** `admin`
    *   **Password Admin:** `admin123`

---

## Informasi Pengembang

*   **Nama:** I Putu Gita Chandra Arimbawa
*   **NIM:** 240030069
*   **Kelas:** BA 243
*   **Institusi:** Institut Teknologi dan Bisnis (ITB) Stikom Bali
*   **Tahun:** 2026
