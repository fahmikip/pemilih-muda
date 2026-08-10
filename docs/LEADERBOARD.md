# Leaderboard Season

Leaderboard v1.5.0 selalu dihitung per `SeasonID`. Sumber poin adalah penjumlahan `PointTransactions.Point` dengan `Status=VALID`; `Users.TotalPointCache` tidak digunakan sebagai sumber ranking. Akun `BLOCKED` dan `SUSPENDED`, transaksi INVALID/REVERSED, nilai nol, serta transaksi season lain dikeluarkan.

## Aturan ranking

Urutan peserta:

1. total poin season lebih tinggi;
2. jumlah jawaban benar dari QuizSessions COMPLETED lebih tinggi;
3. jumlah quiz completed lebih tinggi;
4. average score lebih tinggi;
5. UserID secara alfabetis sebagai urutan deterministik.

Urutan terakhir tidak memberi keunggulan waktu finalisasi. Rank saat ini berupa posisi unik setelah seluruh tie-break diterapkan.

Public response tidak memuat UserID, NIS/NISN, email, WhatsApp, tanggal lahir, token session, FraudScore, hash, atau salt. Nama publik memakai nama depan dan inisial setiap bagian berikutnya, misalnya `Ahmad Fauzi` menjadi `Ahmad F.`. Endpoint admin boleh memuat UserID dan `fraudStatus`, tetapi tetap tidak memuat kredensial atau data kontak.

## Cache dan performa

Snapshot agregasi memakai key `LEADERBOARD_V2_<SeasonID>` dengan TTL 180 detik. Dalam cache miss, PointTransactions, Users, Schools, QuizSessions, dan FraudLogs masing-masing dibaca sekali lalu dibentuk menjadi map in-memory. `getLeaderboard` dan `getMyRank` menggunakan helper `buildSeasonLeaderboard_()` yang sama, sehingga rank, poin season, dan jumlah peserta selalu berasal dari snapshot identik. Semua peserta dihasilkan tanpa lookup Spreadsheet per peserta.

`PointService.awardQuiz` membatalkan cache season setelah award. Helper `invalidateLeaderboardCache_(seasonId)` wajib dipanggil endpoint admin adjust, invalidasi, atau reversal transaksi ketika endpoint tersebut ditambahkan. Perubahan manual langsung pada spreadsheet dapat terlihat paling lambat setelah TTL berakhir.

School leaderboard mengurutkan total poin, lalu average point, jumlah peserta, dan nama sekolah. Response menampilkan total point, jumlah peserta, serta average point agar ukuran sekolah tetap terlihat.
