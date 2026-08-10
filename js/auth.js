const Auth=(()=>{
  const KEY="pemilih_muda_session_v1";
  function saveSession(data){if(!data?.token||!data?.expiresAt)throw new Error("Data session tidak valid.");try{sessionStorage.setItem(KEY,JSON.stringify({token:data.token,expiresAt:data.expiresAt}))}catch{throw new Error("Browser tidak dapat menyimpan session.")}}
  function getSession(){try{const value=JSON.parse(sessionStorage.getItem(KEY)||"null");if(!value?.token||!value?.expiresAt||new Date(value.expiresAt).getTime()<=Date.now()){clearSession();return null}return value}catch{clearSession();return null}}
  function clearSession(){try{sessionStorage.removeItem(KEY)}catch{}}
  function isLoggedIn(){return Boolean(getSession())}
  function requireLogin(){const session=getSession();if(!session){location.replace(Utils.pageUrl("login.html"));return null}return session}
  return Object.freeze({saveSession,getSession,clearSession,isLoggedIn,requireLogin});
})();

async function loadSchools(){
  const select=document.querySelector("#schoolId"),state=document.querySelector("#school-state"),search=document.querySelector("#school-search");if(!select)return;
  select.disabled=true;state.textContent="Memuat daftar sekolah…";
  try{const result=await apiGet("getSchools");const schools=Array.isArray(result.data)?result.data:[];select.replaceChildren(new Option(schools.length?"Pilih sekolah":"Belum ada sekolah aktif",""));schools.forEach(s=>{const option=new Option(`${s.SchoolName}${s.District?` — ${s.District}`:""}`,s.SchoolID);option.dataset.search=`${s.SchoolName} ${s.Type||""} ${s.District||""}`.toLowerCase();select.add(option)});select.disabled=!schools.length;search.disabled=!schools.length;state.textContent=schools.length?`${schools.length} sekolah tersedia.`:"Belum ada sekolah aktif. Hubungi administrator."}
  catch(error){state.textContent=Utils.errorMessage(error);state.classList.add("text-danger");Utils.toast(Utils.errorMessage(error),"error")}
}

document.querySelector("#school-search")?.addEventListener("input",event=>{const term=event.target.value.trim().toLowerCase();document.querySelectorAll("#schoolId option").forEach((option,index)=>{if(index)option.hidden=term&&!option.dataset.search.includes(term)})});

document.querySelector("#register-form")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button[type=submit]"),message=form.querySelector(".form-message"),values=Utils.formObject(form);let completed=false;if(values.password!==values.confirmPassword){message.textContent="Konfirmasi password tidak sama.";return}delete values.confirmPassword;Utils.setButtonLoading(button,true,"Mendaftarkan…");message.textContent="";try{const result=await apiPost("register",values);completed=true;form.reset();Utils.toast(result.message,"success");message.className="form-message text-success";message.textContent="Registrasi berhasil. Mengalihkan ke halaman masuk…";setTimeout(()=>location.assign(Utils.pageUrl("login.html",{registered:"1"})),900)}catch(error){message.className="form-message text-danger";message.textContent=Utils.errorMessage(error);Utils.toast(message.textContent,"error")}finally{if(!completed)Utils.setButtonLoading(button,false)}});

document.querySelector("#login-form")?.addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,button=form.querySelector("button[type=submit]"),message=form.querySelector(".form-message");let completed=false;Utils.setButtonLoading(button,true,"Masuk…");message.textContent="";try{const result=await apiPost("login",Utils.formObject(form));Auth.saveSession(result.data);completed=true;form.reset();Utils.toast("Login berhasil.","success");location.replace(Utils.pageUrl("app.html"))}catch(error){message.textContent=Utils.errorMessage(error);Utils.toast(message.textContent,"error")}finally{if(!completed)Utils.setButtonLoading(button,false)}});

if(document.body.dataset.page==="register")loadSchools();
if(document.body.dataset.page==="login"&&Auth.isLoggedIn())location.replace(Utils.pageUrl("app.html"));
if(CONFIG.DEBUG)checkApiHealth().catch(()=>{});
