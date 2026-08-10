# Deployment

Phase 1 dapat dipreview melalui static server. Deployment produksi belum disarankan karena database, autentikasi, dan PWA belum dibangun.

Backend Phase 3 dapat diuji sebagai Web App: deploy sebagai user pemilik project (**Execute as: Me**) agar setiap request memakai izin pemilik terhadap spreadsheet. Untuk aplikasi publik, pilih **Who has access: Anyone**; pada akun/domain Google Workspace, administrator domain mungkin membatasi opsi ini. Jangan memilih execute-as user karena peserta tidak seharusnya memperoleh izin langsung ke spreadsheet.

Urutan produksi final: buat repository GitHub → push source → Settings → Pages → Deploy from branch → `main` dan `/ (root)` → catat URL repository Pages → set `BASE_PATH` → buat project GAS dari folder `gas-backend` → deploy Web App melalui menu Deploy (execute as owner; atur siapa yang dapat mengakses sesuai populasi target) → salin URL `/exec` → set `API_URL` di `js/config.js` → uji health/API → uji semua route Pages → validasi manifest/service worker/icon → uji instalasi Android Chrome dan petunjuk iOS pada perangkat nyata. Opsi akses Web App adalah konfigurasi deployment, bukan isi `appsscript.json`.
