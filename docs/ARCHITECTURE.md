# Final System Architecture

## 1. Arsitektur sistem

```text
Browser / installed PWA
  └─ GitHub Pages (HTML, CSS, JS, manifest, service worker)
       └─ HTTPS form-encoded fetch tanpa preflight
            └─ GAS Web App (/exec: doGet/doPost → Router → services)
                 └─ Google Sheets (repository/batch operations)
```

Frontend tidak pernah diarahkan ke `script.google.com`. GAS hanya API. `js/config.js` adalah satu-satunya sumber URL API dan repository path.

## 2. Folder structure

Struktur target mengikuti master prompt. Phase 1 membuat seluruh halaman publik/route shell, design foundation, client API, dan entry point GAS. Service domain, schema setup, manifest, service worker, serta icon ditambahkan pada phase pemiliknya agar file yang ada selalu merepresentasikan perilaku nyata, bukan implementasi palsu.

## 3. Database schema

Satu spreadsheet berisi `Users`, `Schools`, `Seasons`, `Questions`, `QuizSessions`, `QuizAnswers`, `PointTransactions`, `Achievements`, `UserAchievements`, `Materials`, `Announcements`, `Winners`, `Rewards`, `Sessions`, `FraudLogs`, `ActivityLogs`, dan `Settings`. Kolom mengikuti master prompt. Foreign key memakai ID berprefiks; tanggal disimpan ISO-8601; `PointTransactions` menjadi ledger sumber kebenaran. Header, tipe logis, indeks aplikasi, dan aturan retensi akan difinalkan pada Phase 2 di `DATABASE.md`.

## 4. API architecture

`doGet` dibatasi untuk health check dan endpoint publik yang aman/cacheable. Mutasi/private API memakai `doPost`. Karena GAS Web App tidak menyediakan handler OPTIONS yang setara server umum, browser mengirim body `application/x-www-form-urlencoded` dengan `action` dan JSON `payload`; ini termasuk CORS-safelisted request dan menghindari preflight. GAS dapat merespons redirect deployment dan Fetch mengikuti redirect. Semua response memakai `{success,message,data}` atau `{success:false,message,code}`. Router allowlist memanggil service, validation, authorization, repository, lalu audit log.

## 5. Authentication flow

Register → validasi server → lock → cek NIS/email unik → salt acak → iterative SHA-256 hash → simpan user STUDENT. Login → lookup → constant-time verify → session token acak yang hanya disimpan dalam bentuk hash → server mengembalikan token dan role. Request privat membawa token di payload; middleware memeriksa status, expiry, user, dan role. Logout mencabut session. Frontend tidak menetapkan role. Penyimpanan token browser akan diputuskan dan didokumentasikan di Phase 4 dengan mempertimbangkan keterbatasan cookie lintas origin GAS.

## 6. Quiz flow

Start → server validasi season/user/attempt → pilih QuestionID secara acak → acak opsi → simpan mapping privat/session → kirim soal tanpa jawaban benar. Submit tiap jawaban → lock + validasi token/session/question/replay → server menilai dan menyimpan sekali → kirim status dan pembahasan sesuai konfigurasi. Finish → server menghitung hasil dari jawaban tersimpan, menutup session secara idempotent, dan membuat transaksi poin. Offline tidak pernah menghasilkan poin.

## 7. Point flow

Event tervalidasi → `PointService` membuat satu ledger row ber-ID unik dan idempotency source → transaksi berstatus VALID → agregasi cache user diperbarui di lock yang sama. Client tidak mengirim skor final, total poin, atau ranking. Koreksi dilakukan dengan transaksi reversal/penalty agar audit trail tidak hilang.

## 8. Leaderboard flow

Query menjumlahkan transaksi VALID per season, bergabung dengan nama publik/masked dan sekolah, menerapkan urutan stabil, lalu mengembalikan Top 10/50 atau jendela ranking saya. Cache publik berumur pendek boleh digunakan; response tidak memuat NIS, email, WhatsApp, lahir, session, atau hash.

## 9. Winner flow

Season FINISHED → agregasi poin VALID → urutkan total poin, jawaban benar, challenge selesai, average score → jika seluruh tie breaker sama, status NEED_REVIEW → admin berotorisasi mereview dan memfinalkan satu winner → reward WAITING dibuat terpisah. Tidak ada random selection dan finalisasi bersifat idempotent serta diaudit.

## 10. PWA installation flow

GitHub Pages HTTPS → manifest dan service worker valid dalam `BASE_PATH` → simpan `beforeinstallprompt` → tampilkan tombol Android hanya saat event tersedia dan bukan standalone → prompt atas gesture → sembunyikan sesudah accepted/appinstalled. iOS mendapat instruksi Safari/Add to Home Screen. Fallback manual tidak tampil saat load pertama. App shell/public education boleh dicache; API private, login, profil, quiz, session, dan admin tidak dicache.

## 11. Security strategy

Server-side allowlist dan RBAC; schema validation; normalized identity uniqueness di dalam LockService; salted password hash; hashed session token + expiry/revocation; rate counters; replay/idempotency guard; minimum-duration anomaly; score/point computed server-side; immutable audit/fraud logs; generic production errors; no secrets or hashes in response; output minimization; formula-injection escaping before Sheets writes; cache separation; Script Properties untuk ID/secret; dan admin review untuk fraud score (bukan auto-disqualification berbasis device).

## 12. GitHub Pages deployment strategy

Semua link/asset HTML memakai URL relatif sehingga valid di repository path. `CONFIG.BASE_PATH`, manifest `start_url/scope`, service-worker registration/scope, dan cache URLs memakai satu repository path saat Phase 6. Pages deploy dari `main` root. GAS deploy sebagai Web App execute-as owner, akses sesuai populasi target, lalu URL `/exec` dimasukkan hanya ke `config.js`. Uji dilakukan pada URL Pages sebenarnya karena PWA/install memerlukan secure context.

## Phase ownership

1 foundation/decisions; 2 schema/setup; 3 service/router API; 4 auth; 5 frontend screens; 6 PWA/install; 7 season; 8 questions; 9 quiz; 10 points; 11 leaderboard; 12 winner/reward; 13 student dashboard; 14 admin; 15 content; 16 security/fraud; 17 report; 18 tests; 19 production deployment.
