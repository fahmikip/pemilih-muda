# PWA Production

Pemilih Muda dipasang dari `https://fahmikip.github.io/pemilih-muda/`. Frontend tetap berada di GitHub Pages; URL Google Apps Script hanya dipakai sebagai API.

## Instalasi

### Android dan desktop

Buka landing page dengan Chrome/Edge. Tombol **INSTALL APLIKASI** hanya muncul setelah browser mengirim `beforeinstallprompt`. Klik tombol lalu konfirmasi dialog native. Tombol disembunyikan ketika aplikasi sudah berjalan dalam mode standalone atau setelah event `appinstalled`.

### iPhone dan iPad

Buka dengan Safari, tekan **CARA PASANG**, kemudian Share → Add to Home Screen → aktifkan Open as Web App jika tersedia → Add. Apple touch icon 180px dan meta status bar tersedia di halaman utama.

## Manifest dan GitHub Pages

`manifest.webmanifest` memakai `start_url` dan `scope` `/pemilih-muda/`. Semua asset dan navigasi tetap file-based agar refresh GitHub Pages tidak menghasilkan 404. Ikon `any` tersedia pada 72, 96, 128, 144, 152, 180, 192, 384, dan 512px; maskable tersedia pada 192 dan 512px.

## Service worker dan cache

Cache shell bernama `pemilih-muda-shell-2.1.0`. Install menyimpan landing, offline fallback, CSS/JS inti, manifest, dan ikon. Activate menghapus cache Pemilih Muda versi lama. Navigasi memakai network-first dengan `offline.html` sebagai fallback.

Google Apps Script berbeda origin dengan GitHub Pages. Service worker segera melewati seluruh request cross-origin sehingga login, register, session token, profile, quiz package, jawaban, ranking privat, winner/reward admin, dan semua response admin selalu **network-only** dan tidak pernah ditulis ke Cache Storage. Request POST juga tidak pernah diintersep.

## Update aman

Ketika worker baru terpasang, UI menawarkan **PERBARUI SEKARANG**. Worker hanya menerima `SKIP_WAITING` setelah pengguna memilih. Jika session flag quiz aktif, update ditunda dan halaman tidak direload. Draft jawaban berada di localStorage per QuizSession dan dihapus setelah submit server sukses; submit offline tidak dianggap berhasil.

## Debugging

Chrome DevTools → Application menyediakan Manifest, Service Workers, dan Cache Storage. Untuk reset: klik Unregister pada Service Workers lalu Clear site data pada Storage. Muat ulang dengan DevTools terbuka dan centang Update on reload hanya saat debugging.

Periksa bahwa Cache Storage hanya berisi asset GitHub Pages. Jika terdapat data API, unregister worker dan pastikan deployment memakai `service-worker.js` terbaru. Android/iOS installability akhir harus diuji pada perangkat fisik karena prompt native tidak dapat disimulasikan sepenuhnya oleh test Node.
