# Pemilih Muda

Pemilih Muda adalah PWA edukasi pemilih pemula yang netral dan nonpartisan. Frontend statis berjalan di GitHub Pages, business logic berjalan di Google Apps Script Web App, dan Google Sheets menjadi penyimpanan utama.

## Status

Phase 1–4 selesai. Frontend GitHub Pages kini memakai satu API client untuk health, schools, active season, register, login, profile, session, dan logout. Quiz engine belum diaktifkan agar tidak ada API palsu.

## Menghubungkan frontend

1. Buka `js/config.js` dan ganti `API_URL` dengan URL Web App `/exec` hasil deployment Phase 3.
2. Sesuaikan `BASE_PATH` dengan nama repository GitHub Pages, misalnya `/kip-pemilih-pemula/`.
3. Gunakan `DEBUG: true` hanya saat development untuk health log tanpa data sensitif; kembalikan ke `false` untuk production.
4. Deploy ke GitHub Pages dan uji landing, register, login, dashboard/profile, logout, serta session kedaluwarsa.

Session client disimpan di `sessionStorage` dan hanya berisi token serta `expiresAt`. Password, role, profil, poin, FraudScore, dan jawaban quiz tidak disimpan sebagai sumber kebenaran client.

## Menjalankan frontend lokal

Gunakan static HTTP server dari root repository, misalnya `python -m http.server 8080`, lalu buka `http://localhost:8080/`. Fetch ke GAS baru berfungsi setelah `API_URL` pada `js/config.js` diganti dengan URL deployment `/exec`.

## Prinsip produk

- Netral, nonpartisan, edukatif, dan informatif.
- Server menjadi sumber kebenaran role, soal, jawaban, skor, poin, ranking, dan pemenang.
- Data pribadi tidak pernah menjadi data leaderboard publik.
- Tidak ada localStorage yang diperlakukan sebagai database produksi.

Lihat [ARCHITECTURE.md](ARCHITECTURE.md) untuk rancangan lengkap dan [DEPLOYMENT.md](DEPLOYMENT.md) untuk batas deployment Phase 1.

## Menyiapkan database GAS

1. Buat project Google Apps Script dan salin seluruh file `.gs` serta `appsscript.json` dari `gas-backend`.
2. Di Project Settings → Script Properties, isi `DATABASE_SPREADSHEET_ID` bila memakai spreadsheet yang sudah ada. Jika dikosongkan, setup membuat spreadsheet baru satu kali.
3. Untuk admin awal, isi `INITIAL_ADMIN_NAME`, `INITIAL_ADMIN_EMAIL`, dan `INITIAL_ADMIN_PASSWORD` (minimal 12 karakter). Password property akan dihapus setelah admin berhasil dibuat.
4. Pilih fungsi `setupApplication`, klik Run, dan selesaikan authorization.
5. Periksa execution log dan spreadsheet hasilnya.
6. Jalankan `setupApplication` sekali lagi; `createdSheets` dan `createdSettings` harus kosong.
7. Jalankan `validateDatabaseSchema`; pastikan `valid: true`.
8. Hanya untuk development, jalankan `seedDemoData`. Jalankan ulang untuk memastikan seluruh nilai `created` menjadi `0`.
9. Untuk menghapus demo, jalankan `clearDemoData`; fungsi ini hanya menghapus ID bertanda `_DEMO_`.
