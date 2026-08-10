# Security Baseline

Trust boundary berada di GAS. Frontend dianggap tidak terpercaya. Role, correct answer, score, point, rank, winner, dan status reward selalu dihitung/diverifikasi server. Data leaderboard diminimalkan. Password plaintext, password hash/salt, token mentah tersimpan, dan stack trace tidak boleh keluar dari API.

Admin bootstrap membaca credential sementara dari Script Properties. Password minimal 12 karakter di-hash dengan salt acak dan iterative SHA-256, lalu property plaintext dihapus setelah insert berhasil. Spreadsheet dan project GAS tetap harus dibatasi karena Apps Script tidak menyediakan KDF memory-hard bawaan. Detail session dan threat tests diperluas pada Phase 4 dan Phase 16.

## Session browser

Frontend menyimpan hanya token, expiry, dan snapshot user publik minimum (`UserID`, nama, `SchoolID`, role, status) di `sessionStorage`. Password, hash, salt, poin, FraudScore, dan data profil privat tidak disimpan. `sessionStorage` mengurangi persistensi dibanding `localStorage`, tetapi token tetap dapat dicuri bila terjadi XSS atau perangkat/tab dikuasai pihak lain. Karena itu aplikasi menghindari script pihak ketiga, merender data API sebagai text/escaped HTML, memvalidasi token dan role kembali di server, serta mencabut token saat logout. Snapshot role hanya dipakai untuk navigasi; `getProfile` dan setiap endpoint admin tetap menjadi pemeriksaan server-side.
