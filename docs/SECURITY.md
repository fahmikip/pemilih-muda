# Security Baseline

Trust boundary berada di GAS. Frontend dianggap tidak terpercaya. Role, correct answer, score, point, rank, winner, dan status reward selalu dihitung/diverifikasi server. Data leaderboard diminimalkan. Password plaintext, password hash/salt, token mentah tersimpan, dan stack trace tidak boleh keluar dari API.

Admin bootstrap membaca credential sementara dari Script Properties. Password minimal 12 karakter di-hash dengan salt acak dan iterative SHA-256, lalu property plaintext dihapus setelah insert berhasil. Spreadsheet dan project GAS tetap harus dibatasi karena Apps Script tidak menyediakan KDF memory-hard bawaan. Detail session dan threat tests diperluas pada Phase 4 dan Phase 16.
