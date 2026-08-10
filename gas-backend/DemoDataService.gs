var DEMO_ID_PATTERN = /^[A-Z]{3}_DEMO_/;

function seedDemoData() {
  return DatabaseService.withLock(function () {
    var schema = validateDatabaseSchema();
    if (!schema.valid) throw new Error('Schema database belum valid. Jalankan setupApplication() lebih dahulu.');
    var now = new Date().toISOString();
    var created = {Schools:0,Questions:0,Seasons:0,Materials:0,Announcements:0};

    var schools=[];
    for(var i=1;i<=5;i++) schools.push({SchoolID:'SCH_DEMO_'+pad2_(i),SchoolName:'Sekolah Demo '+i,NPSN:'9900000'+i,Type:i%2?'SMA':'SMK',Address:'Alamat sekolah demo '+i,District:'Kecamatan Demo',Status:'ACTIVE',CreatedAt:now,UpdatedAt:now});
    created.Schools=insertMissingDemo_('Schools','SchoolID',schools);

    var questions=[];
    var categories=['Hak Pilih','Pemilu','Demokrasi','Anti Hoaks','Partisipasi'];
    for(var q=1;q<=30;q++) questions.push({QuestionID:'QUE_DEMO_'+pad2_(q),Category:categories[(q-1)%categories.length],Question:'[DEMO] Pertanyaan edukasi netral nomor '+q+'?',OptionA:'Pilihan A',OptionB:'Pilihan B',OptionC:'Pilihan C',OptionD:'Pilihan D',CorrectAnswer:['A','B','C','D'][(q-1)%4],Explanation:'[DEMO] Pembahasan untuk pertanyaan nomor '+q+'.',Difficulty:q%3===0?'HARD':(q%2===0?'MEDIUM':'EASY'),Point:10,Status:'ACTIVE',CreatedAt:now,UpdatedAt:now});
    created.Questions=insertMissingDemo_('Questions','QuestionID',questions);

    var season=[{SeasonID:'SEA_DEMO_202608',Name:'Season Demo',Theme:'Kenali Hak Pilihmu',Description:'[DEMO] Season untuk pengujian development.',StartDate:'2026-08-01',EndDate:'2026-08-31',Status:'ACTIVE',Reward:'Pulsa Demo',QuestionCount:25,PointPerQuestion:10,MaxAttempt:1,QuizDuration:1800,ShowExplanation:true,CreatedAt:now,UpdatedAt:now}];
    created.Seasons=insertMissingDemo_('Seasons','SeasonID',season);

    var materials=[];
    for(var m=1;m<=5;m++) materials.push({MaterialID:'MAT_DEMO_'+pad2_(m),Title:'Materi Edukasi Demo '+m,Category:categories[(m-1)%categories.length],Thumbnail:'',Content:'[DEMO] Konten materi netral dan nonpartisan '+m+'.',VideoURL:'',Status:'PUBLISHED',PublishedAt:now,CreatedAt:now,UpdatedAt:now});
    created.Materials=insertMissingDemo_('Materials','MaterialID',materials);

    var announcements=[];
    for(var a=1;a<=3;a++) announcements.push({AnnouncementID:'ANN_DEMO_'+pad2_(a),Title:'Pengumuman Demo '+a,Content:'[DEMO] Pengumuman development '+a+'.',Type:'INFO',Status:'ACTIVE',StartDate:'2026-08-01',EndDate:'2026-08-31',CreatedAt:now,UpdatedAt:now});
    created.Announcements=insertMissingDemo_('Announcements','AnnouncementID',announcements);
    var result={success:true,created:created}; Logger.log(JSON.stringify(result,null,2)); return result;
  });
}

function clearDemoData() {
  return DatabaseService.withLock(function () {
    var idFields={Schools:'SchoolID',Questions:'QuestionID',Seasons:'SeasonID',Materials:'MaterialID',Announcements:'AnnouncementID'};
    var removed={};
    Object.keys(idFields).forEach(function(sheetName){
      var rows=DatabaseService.getAllRows(sheetName); var kept=rows.filter(function(row){return !DEMO_ID_PATTERN.test(String(row[idFields[sheetName]]));});
      removed[sheetName]=rows.length-kept.length;
      if(removed[sheetName]) DatabaseService.replaceRows(sheetName,kept);
    });
    var result={success:true,removed:removed}; Logger.log(JSON.stringify(result,null,2)); return result;
  });
}

function insertMissingDemo_(sheetName,idField,objects){var missing=objects.filter(function(item){return !DatabaseService.exists(sheetName,idField,item[idField]);});if(missing.length)DatabaseService.insertMany(sheetName,missing);return missing.length;}
function pad2_(value){return ('0'+value).slice(-2);}
