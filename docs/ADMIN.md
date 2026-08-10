# Admin Control Center

`admin.html` adalah control center responsif untuk role `ADMIN` dan `SUPERADMIN`. Akses divalidasi saat halaman dibuka dan setiap endpoint kembali memeriksa session serta role pada server. `STUDENT` diarahkan ke aplikasi peserta.

## Role dan permission

- `ADMIN`: dashboard, peserta, sekolah, season, bank soal, quiz, leaderboard, pemenang, hadiah, materi, pengumuman, fraud/review, dan laporan.
- `SUPERADMIN`: seluruh akses ADMIN ditambah point adjustment, settings, activity log penuh, dan admin management.
- Permission didefinisikan dalam `ADMIN_PERMISSIONS`, sehingga modul baru dapat ditambahkan tanpa mempercayai role dari frontend.

SUPERADMIN aktif terakhir tidak dapat dinonaktifkan atau diturunkan. Password lama tidak pernah ditampilkan; reset menyimpan salt dan hash baru. Suspend/block peserta wajib menyertakan alasan.

## Menu dan alur operasi

- Dashboard memakai batch read untuk statistik produksi dan chart ringan tanpa data contoh.
- Peserta menampilkan ranking berdasarkan point cache hasil rekalkulasi Point Engine; adjustment point hanya tersedia bagi SUPERADMIN dan selalu membuat transaksi `ADMIN`.
- Challenge menampilkan jumlah peserta, started, completed, expired, rata-rata score, dan rata-rata point per filter season.
- Tabel besar memakai pencarian, filter server, sorting whitelist, serta pagination maksimal 100 baris.
- Season mengikuti `DRAFT → SCHEDULED → ACTIVE → FINISHED → ARCHIVED`. Hanya satu season dapat ACTIVE.
- Soal yang tidak digunakan dinonaktifkan, bukan dihapus. Correct answer hanya tersedia lewat endpoint admin.
- Leaderboard, winner, reward, point, dan quiz memakai service engine yang sama dengan aplikasi peserta.
- Materi mendukung DRAFT/PUBLISHED/ARCHIVED dan pengumuman mendukung periode aktif. Konten disanitasi pada server.
- Fraud flag harus direview manusia; sistem tidak otomatis memblokir pengguna.
- Fraud review menggabungkan log, nama peserta, sekolah, dan fraud score melalui batch map tanpa query per baris.
- Laporan peserta, sekolah, season, quiz, leaderboard, winner, reward, point, dan fraud diekspor CSV setelah filter dijalankan server. Browser print menyediakan Print-to-PDF.

## Endpoint

Kelompok utama: `adminDashboardStats`; `adminListUsers`, `adminGetUser`, `adminUpdateUser`, `adminUpdateUserStatus`, `adminResetUserPassword`; `adminListSchools`, `adminSaveSchool`, `adminChangeSchoolStatus`; `adminGetSeasons`, `adminUpdateSeason`, `adminChangeSeasonStatus`, `adminDuplicateSeason`; `adminGetQuestions`, `adminUpdateQuestion`, `adminChangeQuestionStatus`; `adminGetQuizSessions`, `adminGetLeaderboard`, `adminAdjustPoint`; endpoint Winner Engine; `adminGetRewards`; `adminGetMaterials`, `adminSaveMaterial`; `adminGetAnnouncements`, `adminSaveAnnouncement`; `adminGetFraudLogs`, `adminReviewFraud`; `adminGetActivityLogs`; `adminExportReport`; `adminGetSettings`, `adminUpdateSetting`; `adminGetAdmins`, `adminCreateAdmin`, `adminUpdateAdmin`.

## Audit dan settings

Mutasi penting menulis `ActivityLogs` dengan actor, action, entity, description, dan waktu. Settings hanya dapat menggunakan key dari schema dan nilainya divalidasi sebagai BOOLEAN, NUMBER, atau STRING. Update settings menghapus cache. `REGISTRATION_OPEN=false` sudah ditolak oleh endpoint register dengan `REGISTRATION_CLOSED`; ADMIN/SUPERADMIN tetap dapat login ketika maintenance diberlakukan pada UI peserta.

## Deployment

Setelah backend disalin ke Apps Script, buat deployment Web App versi baru dan perbarui `CONFIG.API_URL` jika URL `/exec` berubah. GitHub Pages otomatis menggunakan control center setelah commit `main` terpublikasi.
