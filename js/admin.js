const AdminPage=(()=>{
  async function init(){const session=Auth.requireLogin();if(!session)return;try{const result=await apiPost("getProfile",{},session.token),user=result.data;if(user.Role!=="ADMIN"&&user.Role!=="SUPERADMIN"){location.replace(Utils.pageUrl("app.html",{reason:"forbidden"}));return}Utils.setText("[data-admin-name]",user.Name);Utils.setText("[data-admin-role]",user.Role);document.querySelector("#admin-loading")?.setAttribute("hidden","");document.querySelector("#admin-content")?.removeAttribute("hidden")}catch(error){document.querySelector("#admin-loading").textContent=Utils.errorMessage(error)}}
  async function logout(button){const token=Auth.getSessionToken();Utils.setButtonLoading(button,true,"Keluar…");try{if(token)await apiPost("logout",{},token)}catch(error){if(CONFIG.DEBUG)console.warn("Logout admin gagal",error.code)}finally{Auth.clearSession();location.replace(Utils.pageUrl("login.html"))}}
  return Object.freeze({init,logout});
})();
document.querySelector("[data-admin-logout]")?.addEventListener("click",event=>AdminPage.logout(event.currentTarget));AdminPage.init();
