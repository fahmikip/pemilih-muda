class ApiError extends Error{constructor(message,code="INTERNAL_ERROR"){super(message);this.name="ApiError";this.code=code}}

const Api=(()=>{
  async function send(method,action,payload={},token=""){
    if(!Utils.isConfiguredApi())throw new ApiError("API belum dikonfigurasi. Isi CONFIG.API_URL dengan URL deployment /exec.","API_NOT_CONFIGURED");
    const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),CONFIG.REQUEST_TIMEOUT_MS);
    try{
      let url=CONFIG.API_URL;const options={method,redirect:"follow",signal:controller.signal,cache:"no-store"};
      if(method==="GET"){
        const query=new URLSearchParams({action});if(Object.keys(payload).length)query.set("payload",JSON.stringify(payload));url+=`${url.includes("?")?"&":"?"}${query}`;
      }else{
        const fields={action,payload:JSON.stringify(payload)};if(token)fields.token=token;
        options.headers={"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"};options.body=new URLSearchParams(fields);
      }
      const response=await fetch(url,options);if(!response.ok)throw new ApiError(`Server merespons HTTP ${response.status}.`,"NETWORK_ERROR");
      let result;try{result=await response.json()}catch{throw new ApiError("Respons server bukan JSON yang valid.","INVALID_RESPONSE")}
      if(!result||typeof result.success!=="boolean")throw new ApiError("Format respons API tidak valid.","INVALID_RESPONSE");
      if(!result.success){handleSessionError(result.code);throw new ApiError(result.message||"Permintaan gagal.",result.code)}
      return result;
    }catch(error){if(error.name==="AbortError")throw new ApiError("Server tidak merespons. Periksa koneksi lalu coba lagi.","REQUEST_TIMEOUT");if(error instanceof ApiError)throw error;throw new ApiError(navigator.onLine?"Tidak dapat terhubung ke server.":"Koneksi internet terputus.","NETWORK_ERROR");}
    finally{clearTimeout(timeout)}
  }
  function handleSessionError(code){if(code!=="SESSION_INVALID"&&code!=="SESSION_EXPIRED")return;if(typeof Auth!=="undefined")Auth.clearSession();const page=document.body?.dataset.page;if(page&&page!=="login")location.replace(Utils.pageUrl("login.html",{reason:code.toLowerCase()}));}
  async function apiGet(action,params={}){return send("GET",action,params)}
  async function apiPost(action,payload={},token=""){return send("POST",action,payload,token)}
  async function checkApiHealth(){try{const result=await apiGet("health");if(CONFIG.DEBUG)console.info("Pemilih Muda API connected",{database:result.data.database,version:result.data.version});return result}catch(error){if(CONFIG.DEBUG)console.warn("Pemilih Muda API connection failed",error.code,error.message);throw error}}
  return Object.freeze({apiGet,apiPost,checkApiHealth,request:apiPost});
})();

const apiGet=Api.apiGet;const apiPost=Api.apiPost;const checkApiHealth=Api.checkApiHealth;
