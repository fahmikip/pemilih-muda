const fs=require('fs'),assert=require('assert');
const variables=fs.readFileSync('css/variables.css','utf8'),html=fs.readFileSync('materials.html','utf8'),js=fs.readFileSync('js/materials.js','utf8'),seed=fs.readFileSync('gas-backend/EducationContentService.gs','utf8'),index=fs.readFileSync('index.html','utf8');
assert(variables.includes('--primary:#7b1e2d')&&variables.includes('--accent:#c9a227'),'tema marun-emas wajib');
for(const topic of ['PEMILIH PEMULA','TOLAK POLITIK UANG','STOP GOLPUT','ANTI-HOAKS','SUARA RAHASIA','PARTISIPASI BERTANGGUNG JAWAB'])assert(html.includes(topic),`materi hilang: ${topic}`);
assert(html.includes('tidak mendukung kandidat atau partai politik mana pun'),'disclaimer netralitas wajib');
assert(js.includes("apiGet('getPublishedMaterials')")&&!js.includes('.innerHTML'),'materi admin harus dimuat aman');
for(const id of ['MAT_EDU_PEMILIH_PEMULA','MAT_EDU_POLITIK_UANG','MAT_EDU_STOP_GOLPUT','MAT_EDU_ANTI_HOAKS'])assert(seed.includes(id),`seed id hilang: ${id}`);
assert(index.includes('href="materials.html"'),'landing wajib menautkan pusat materi');
console.log('Civic materials and maroon-gold theme tests passed.');
