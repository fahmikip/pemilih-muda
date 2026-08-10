# Winner Engine dan Reward Management

Winner Engine memakai `LeaderboardService.buildSeasonLeaderboard()`; tidak ada perhitungan ranking kedua dan tidak ada random winner. Season harus FINISHED/ARCHIVED atau melewati EndDate. SUPERADMIN dapat memakai `override=true` secara eksplisit.

Flow admin: preview → review fraud/tie → disqualify bila perlu → finalize → verify → reward SENT/COMPLETED → publish. Preview tidak menulis Winner. Full tie pada poin, correct, completed, dan average menghasilkan `NEED_REVIEW`; finalize membutuhkan alasan.

Diskualifikasi disimpan sebagai record Winners berstatus DISQUALIFIED dan ActivityLog, tanpa menghapus poin atau quiz. Final winner menyimpan snapshot rank, point, correct, completed, average, reward, admin, waktu, dan catatan. Satu season hanya memiliki satu record final berstatus PENDING_REVIEW/VALIDATED/PUBLISHED; retry finalize mengembalikan record existing dan reward yang sama.

Reward dibuat WAITING lalu mengikuti transisi WAITING → VERIFIED → SENT → COMPLETED. FAILED dapat kembali ke VERIFIED untuk penanganan ulang. Transisi mundur memerlukan override SUPERADMIN. Nomor tujuan hanya tersedia di response admin.

Public API hanya mengembalikan season, nama pemenang termasking, sekolah, point, nama hadiah, dan publishedAt. NIS, email, WhatsApp, destination number, FraudScore, hash, dan salt tidak pernah dikirim.
