# Quiz Performance Optimization

## Bottleneck awal

Flow lama melakukan dua round trip untuk setiap soal: `submitAnswer` lalu `getCurrentQuestion`. Tiap endpoint kembali memvalidasi session, membaca user/session, dan memperbarui `LastActivityAt`. Di backend, helper database juga membuka ulang data range untuk lookup session, season, jawaban, dan pertanyaan. Question bank dipindai pada setiap jawaban dan finalisasi membaca ulang jawaban yang baru saja ditulis.

Secara analitis, satu soal non-final pada flow lama memerlukan sekitar 13 pembacaan range dan 4 penulisan bila request `submitAnswer` dan `getCurrentQuestion` dihitung bersama. Angka tepat di produksi dapat berbeda menurut jalur cache dan kondisi GAS.

## Flow hasil optimasi

Satu `submitAnswer` sekarang memvalidasi jawaban, menyimpan satu row dengan `setValues`, menghitung progres, menentukan pertanyaan yang belum dijawab berikutnya, dan memfinalisasi jawaban terakhir. Frontend merender `nextQuestion` dari respons yang sama. Fallback `getCurrentQuestion` hanya dipakai bila GitHub Pages sementara masih berbicara dengan deployment GAS lama.

Cache yang digunakan:

- map question ACTIVE `QUESTIONS_ACTIVE_V1`, TTL 600 detik, serta map lookup in-memory O(1);
- settings `APP_SETTINGS_V1`, TTL 600 detik;
- session aktif minimal, TTL 45 detik;
- Spreadsheet, Sheet, dan header sebagai execution cache; row cache di-reset pada awal setiap HTTP request.

Cache question dibatalkan saat endpoint admin membuat pertanyaan. Helper invalidasi yang sama wajib dipanggil oleh endpoint update/delete/status pertanyaan ketika endpoint tersebut ditambahkan. Settings saat ini belum memiliki endpoint mutasi; helper invalidasinya sudah tersedia untuk endpoint admin mendatang.

## Pengukuran otomatis

Harness lokal menyelesaikan 25 soal melalui 25 `submitAnswer` tanpa `getCurrentQuestion`: rata-rata 1 ms, minimum 0 ms, maksimum 2 ms pada run 10 Agustus 2026. Tercatat 103 pembacaan dan 54 penulisan sheet mock untuk seluruh run, atau rata-rata 4,12 read dan 2,16 write per submit, termasuk recheck source-of-truth di dalam lock, finalisasi, ledger poin, dan activity log. Ini adalah pengukuran struktur kode di mock, bukan latency jaringan Google Apps Script.

Test yang sama memverifikasi submit normal, double submit, opsi manipulatif, resume/current question, jawaban terakhir, finalisasi, point ledger idempotent, expiry, dan session invalid. Seluruh test lulus.

## Batas tersisa

Google Apps Script tetap memiliki cold start, redirect ContentService, latency jaringan, dan quota Spreadsheet/Cache. Lookup jawaban masih harus membaca data QuizAnswers dari source of truth di dalam lock untuk menjaga proteksi double-submit; data lalu difilter berdasarkan `SessionID` dan dibentuk menjadi lookup set. Target 500–800 ms hanya dapat divalidasi dari Execution log deployment nyata dan bukan jaminan konstan.

Tidak ada service worker pada versi repository ini. Semua fetch API sudah menggunakan `cache: "no-store"`, sehingga response quiz privat tidak masuk cache browser/service worker.

## Arsitektur batch v1.4.0

Quiz aktif sekarang hanya memerlukan dua request utama: satu `startQuiz` yang membawa seluruh paket snapshot dan satu `submitQuiz` setelah review. Pemilihan jawaban, previous/next, navigator, dan review menghasilkan nol request. Draft lokal memakai key `quiz_draft_<QuizSessionID>` dan hanya menyimpan `{quizSessionId, answers, currentIndex}`; draft dihapus setelah submit sukses.

Pada harness lokal, submit 25 jawaban sekaligus selesai dalam 12 ms dengan 13 pembacaan dan 8 penulisan total lintas seluruh proses finalisasi. Seluruh 25 row `QuizAnswers` dipastikan menggunakan tepat satu batch write. Angka ini bukan latency jaringan GAS. Pengujian juga mencakup paket tanpa answer key, jawaban kosong, option/question manipulatif, duplicate payload, kepemilikan session, expiry, dan retry idempotent.
