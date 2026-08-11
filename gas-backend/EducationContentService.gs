function seedEducationMaterials(){
  return DatabaseService.withLock(function(){
    var now=nowIso_(),rows=[
      {MaterialID:'MAT_EDU_PEMILIH_PEMULA',Title:'Kenali Hak Pilihmu',Category:'Pemilih Pemula',Content:'Pemilih pemula memiliki hak yang setara untuk menentukan pilihan secara mandiri. Pastikan terdaftar sebagai pemilih, pelajari informasi peserta pemilu dari sumber tepercaya, pahami tata cara memilih, dan gunakan hak pilih tanpa tekanan dari pihak mana pun.'},
      {MaterialID:'MAT_EDU_POLITIK_UANG',Title:'Suaramu Bukan untuk Dibeli',Category:'Tolak Politik Uang',Content:'Politik uang merusak kebebasan memilih dan kualitas demokrasi. Tolak uang, barang, fasilitas, atau janji imbalan yang bertujuan memengaruhi pilihan. Simpan informasi secara aman dan gunakan saluran resmi pengawas pemilu untuk melaporkan dugaan pelanggaran.'},
      {MaterialID:'MAT_EDU_STOP_GOLPUT',Title:'Stop Golput: Partisipasimu Menentukan',Category:'Partisipasi',Content:'Menggunakan hak pilih adalah kesempatan menyampaikan aspirasi secara demokratis. Cari tahu jadwal dan lokasi pemungutan suara, siapkan dokumen yang diperlukan, pelajari pilihan secara kritis, dan ajak teman berpartisipasi tanpa mengarahkan pilihan mereka.'},
      {MaterialID:'MAT_EDU_ANTI_HOAKS',Title:'Periksa Sebelum Membagikan',Category:'Anti-Hoaks',Content:'Periksa sumber, tanggal, konteks, dan bukti sebelum mempercayai atau membagikan informasi politik. Bandingkan dengan kanal resmi dan media kredibel. Waspadai judul provokatif, gambar lama, potongan video, dan akun yang tidak jelas.'},
      {MaterialID:'MAT_EDU_SUARA_RAHASIA',Title:'Pilihanmu adalah Hak Pribadi',Category:'Kerahasiaan Suara',Content:'Setiap pemilih bebas menentukan pilihan tanpa tekanan, intimidasi, atau paksaan. Hormati kerahasiaan pilihan orang lain, jangan memaksa seseorang mengungkap pilihannya, dan gunakan saluran resmi jika menemukan gangguan terhadap kebebasan memilih.'},
      {MaterialID:'MAT_EDU_BEDA_PILIHAN',Title:'Berbeda Pilihan, Tetap Bersaudara',Category:'Demokrasi',Content:'Perbedaan pilihan adalah bagian dari demokrasi. Diskusikan program dan gagasan dengan santun, hindari serangan pribadi dan ujaran kebencian, hormati pilihan orang lain, serta terus mengawasi kebijakan publik secara kritis dan konstruktif setelah pemilihan.'}
    ].map(function(row){row.Thumbnail='';row.VideoURL='';row.Status='PUBLISHED';row.PublishedAt=now;row.CreatedAt=now;row.UpdatedAt=now;return row;}),created=rows.filter(function(row){return !DatabaseService.exists('Materials','MaterialID',row.MaterialID);});
    if(created.length)DatabaseService.insertMany('Materials',created);
    logActivity_('SYSTEM','SEED_EDUCATION_MATERIALS','Material','',created.length+' materi edukasi dibuat','APPS_SCRIPT');
    return{success:true,created:created.length,total:rows.length};
  });
}
