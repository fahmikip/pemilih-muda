const QuizPage=(()=>{
  let token="",seasonId="",quizSessionId="",questions=[],answers={},currentIndex=0,timerId=null,remaining=0,submitting=false;
  const draftKey=()=>`quiz_draft_${quizSessionId}`;

  async function init(){
    const session=Auth.requireLogin();if(!session)return;
    token=session.token;seasonId=new URLSearchParams(location.search).get("seasonId")||"";
    try{const started=await apiPost("startQuiz",{seasonId},token);if(started.data.completed){sessionStorage.removeItem('pemilih_muda_quiz_active');renderResult(started.data.result);return}loadPackage(started.data)}catch(error){sessionStorage.removeItem('pemilih_muda_quiz_active');showFatal(error)}
  }

  function loadPackage(data){
    if(!Array.isArray(data.questions)||!data.questions.length){showFatal({code:"QUIZ_NOT_AVAILABLE",message:"Paket soal tidak tersedia pada deployment API ini."});return}
    quizSessionId=data.quizSessionId;questions=data.questions;remaining=Math.max(0,Number(data.remainingSeconds||0));sessionStorage.setItem('pemilih_muda_quiz_active','1');restoreDraft();
    document.querySelector("#quiz-loading")?.setAttribute("hidden","");document.querySelector("#quiz-screen")?.removeAttribute("hidden");Utils.setText("[data-season-name]",data.season.Name);startTimer(Number(data.season.QuizDuration||0));renderQuestion();
  }

  function restoreDraft(){
    answers={};currentIndex=0;
    try{const draft=JSON.parse(localStorage.getItem(draftKey())||"null");if(!draft||draft.quizSessionId!==quizSessionId)return;const allowedQuestions=new Set(questions.map(question=>question.questionId));questions.forEach(question=>{const optionIds=new Set(question.options.map(option=>option.id)),selected=draft.answers?.[question.questionId];if(allowedQuestions.has(question.questionId)&&optionIds.has(selected))answers[question.questionId]=selected});currentIndex=Math.min(Math.max(0,Number(draft.currentIndex)||0),questions.length-1)}catch{localStorage.removeItem(draftKey())}
  }

  function saveDraft(){try{localStorage.setItem(draftKey(),JSON.stringify({quizSessionId,answers,currentIndex}))}catch{} }

  function renderQuestion(){
    const question=questions[currentIndex],answeredCount=Object.keys(answers).length,percent=Math.round(answeredCount/questions.length*100);
    document.querySelector("#quiz-review").hidden=true;document.querySelector("#quiz-screen").hidden=false;Utils.setText("[data-question-count]",`SOAL ${currentIndex+1} / ${questions.length}`);Utils.setText("[data-progress-percent]",`${percent}%`);document.querySelector("[data-progress-bar]").style.width=`${percent}%`;Utils.setText("[data-question-text]",question.question);
    const options=document.querySelector("[data-answer-options]");options.replaceChildren();question.options.forEach((option,index)=>{const label=document.createElement("label");label.className="answer-option";const input=document.createElement("input");input.type="radio";input.name="selectedOption";input.value=option.id;input.checked=answers[question.questionId]===option.id;input.addEventListener("change",()=>{answers[question.questionId]=option.id;saveDraft();renderNavigator()});const marker=document.createElement("span");marker.className="answer-marker";marker.textContent=option.label||String.fromCharCode(65+index);const text=document.createElement("span");text.textContent=option.text;label.append(input,marker,text);options.append(label)});
    const previous=document.querySelector("[data-previous]"),next=document.querySelector("[data-next]");previous.hidden=currentIndex===0;next.textContent=currentIndex===questions.length-1?"REVIEW JAWABAN":"BERIKUTNYA →";saveDraft();renderNavigator();
  }

  function move(delta){const target=currentIndex+delta;if(target<0)return;if(target>=questions.length){showReview();return}currentIndex=target;renderQuestion();window.scrollTo({top:0,behavior:"smooth"})}
  function goTo(index){currentIndex=index;document.querySelector("[data-navigator-dialog]")?.close();renderQuestion();window.scrollTo({top:0,behavior:"smooth"})}

  function navigatorButtons(container){container.replaceChildren();questions.forEach((question,index)=>{const button=document.createElement("button");button.type="button";button.textContent=String(index+1);button.className=`navigator-number${answers[question.questionId]?" is-answered":" is-unanswered"}${index===currentIndex?" is-current":""}`;button.setAttribute("aria-label",`Soal ${index+1}${answers[question.questionId]?", sudah dijawab":", belum dijawab"}`);button.addEventListener("click",()=>goTo(index));container.append(button)})}
  function renderNavigator(){document.querySelectorAll("[data-question-navigator]").forEach(navigatorButtons)}

  function showReview(){
    const answered=Object.keys(answers).length,unanswered=questions.length-answered;document.querySelector("#quiz-screen").hidden=true;document.querySelector("#quiz-review").hidden=false;Utils.setText("[data-review-answered]",answered);Utils.setText("[data-review-unanswered]",unanswered);const warning=document.querySelector("[data-review-warning]"),check=document.querySelector("[data-check-unanswered]");warning.hidden=unanswered===0;warning.textContent=unanswered?`Masih ada ${unanswered} soal yang belum dijawab. Jawaban kosong akan dianggap salah.`:"";check.hidden=unanswered===0;navigatorButtons(document.querySelector("[data-review-navigator]"));window.scrollTo({top:0,behavior:"smooth"})
  }

  function checkUnanswered(){const index=questions.findIndex(question=>!answers[question.questionId]);if(index>=0)goTo(index)}
  function requestSubmit(){const unanswered=questions.length-Object.keys(answers).length;if(unanswered){document.querySelector("[data-confirm-message]").textContent=`Masih ada ${unanswered} soal yang belum dijawab. Jawaban kosong akan dianggap salah. Tetap kirim?`;document.querySelector("[data-confirm-dialog]").showModal();return}submitQuiz(false)}

  async function submitQuiz(autoSubmit){
    if(submitting)return;submitting=true;clearInterval(timerId);document.querySelector("[data-confirm-dialog]")?.close();const button=document.querySelector("[data-submit-quiz]");Utils.setButtonLoading(button,true,autoSubmit?"Waktu habis, mengirim…":"Mengirim jawaban…");
    try{const payload=questions.filter(question=>answers[question.questionId]).map(question=>({questionId:question.questionId,selectedOptionId:answers[question.questionId]})),response=await apiPost("submitQuiz",{quizSessionId,answers:payload},token);localStorage.removeItem(draftKey());sessionStorage.removeItem('pemilih_muda_quiz_active');renderResult(response.data.result)}catch(error){submitting=false;Utils.setButtonLoading(button,false);Utils.toast(navigator.onLine?Utils.errorMessage(error):"Jawaban tersimpan sementara di perangkat. Hubungkan kembali ke internet untuk mengirim.","error");if(error.code==="QUIZ_SESSION_EXPIRED")showFatal(error);else showReview()}
  }

  function renderResult(result){
    clearInterval(timerId);document.querySelector("#quiz-loading")?.setAttribute("hidden","");document.querySelector("#quiz-screen")?.setAttribute("hidden","");document.querySelector("#quiz-review")?.setAttribute("hidden","");document.querySelector("#quiz-result")?.removeAttribute("hidden");Utils.setText("[data-result-correct]",result.correct);Utils.setText("[data-result-wrong]",result.wrong);Utils.setText("[data-result-score]",result.score);Utils.setText("[data-result-point]",`+${Number(result.point||0)}`);Utils.setText("[data-result-bonus]",`+${Number(result.bonus||0)}`);Utils.setText("[data-result-total]",new Intl.NumberFormat("id-ID").format(Number(result.seasonPoint??result.totalPoint??0)));const node=document.querySelector("[data-result-explanations]");if(Array.isArray(result.explanations)&&result.explanations.length){node.hidden=false;node.innerHTML="<h2>Pembahasan</h2>";result.explanations.forEach((item,index)=>{const article=document.createElement("article");const title=document.createElement("strong"),body=document.createElement("p");title.textContent=`${index+1}. ${item.isCorrect?"Benar":"Belum tepat"} — Jawaban: ${item.correctAnswer}`;body.textContent=item.explanation||"Tidak ada pembahasan.";article.append(title,body);node.append(article)})}}

  function startTimer(duration){const node=document.querySelector("[data-quiz-timer]");clearInterval(timerId);if(duration<=0){node.hidden=true;return}node.hidden=false;renderTimer(node);timerId=setInterval(()=>{remaining=Math.max(0,remaining-1);renderTimer(node);if(remaining===0){clearInterval(timerId);Utils.toast("Waktu habis. Jawaban yang sudah dipilih akan dikirim.","error");submitQuiz(true)}},1000)}
  function renderTimer(node){const minutes=Math.floor(remaining/60),seconds=remaining%60;node.textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;node.classList.toggle("timer-warning",remaining<=60)}
  function showFatal(error){clearInterval(timerId);document.querySelector("#quiz-screen")?.setAttribute("hidden","");document.querySelector("#quiz-review")?.setAttribute("hidden","");const loading=document.querySelector("#quiz-loading");loading.removeAttribute("hidden");loading.classList.remove("skeleton-card");loading.innerHTML=`<p class="eyebrow">QUIZ</p><h1>Challenge tidak dapat dibuka</h1><p>${escapeHtml(Utils.errorMessage(error))}</p><a class="button button-primary" href="app.html">Kembali ke dashboard</a>`}
  function escapeHtml(value){const node=document.createElement("span");node.textContent=String(value??"");return node.innerHTML}
  return Object.freeze({init,move,showReview,requestSubmit,submitQuiz,checkUnanswered});
})();

document.querySelector("[data-previous]")?.addEventListener("click",()=>QuizPage.move(-1));document.querySelector("[data-next]")?.addEventListener("click",()=>QuizPage.move(1));document.querySelector("[data-open-navigator]")?.addEventListener("click",()=>document.querySelector("[data-navigator-dialog]").showModal());document.querySelector("[data-close-navigator]")?.addEventListener("click",()=>document.querySelector("[data-navigator-dialog]").close());document.querySelector("[data-return-question]")?.addEventListener("click",()=>QuizPage.move(0));document.querySelector("[data-check-unanswered]")?.addEventListener("click",QuizPage.checkUnanswered);document.querySelector("[data-submit-quiz]")?.addEventListener("click",QuizPage.requestSubmit);document.querySelector("[data-cancel-submit]")?.addEventListener("click",()=>document.querySelector("[data-confirm-dialog]").close());document.querySelector("[data-confirm-submit]")?.addEventListener("click",()=>QuizPage.submitQuiz(false));QuizPage.init();
