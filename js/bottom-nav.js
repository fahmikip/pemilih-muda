const MobileBottomNavigation=(()=>{
  const NS='http://www.w3.org/2000/svg';
  const items=[
    {id:'home',label:'Beranda',page:'app.html',path:'M3 10.8 12 3l9 7.8v9.7a.5.5 0 0 1-.5.5H15v-6H9v6H3.5a.5.5 0 0 1-.5-.5z'},
    {id:'challenge',label:'Challenge',page:'app.html#challenge',path:'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2m3 5h8M8 12h8M8 16h5'},
    {id:'ranking',label:'Ranking',page:'leaderboard.html',path:'M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4'},
    {id:'profile',label:'Profil',page:'profile.html',path:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8m-7 9a7 7 0 0 1 14 0'}
  ];
  function current(){const page=document.body?.dataset.page;if(page==='quiz')return'challenge';if(page==='leaderboard')return'ranking';if(page==='profile')return'profile';if(page==='dashboard'&&location.hash==='#challenge')return'challenge';return'home'}
  function icon(path){const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');svg.setAttribute('focusable','false');const shape=document.createElementNS(NS,'path');shape.setAttribute('d',path);shape.setAttribute('fill','none');shape.setAttribute('stroke','currentColor');shape.setAttribute('stroke-width','2');shape.setAttribute('stroke-linecap','round');shape.setAttribute('stroke-linejoin','round');svg.append(shape);return svg}
  function buildAppUrl(target){const parts=target.split('#'),url=Utils.pageUrl(parts[0]);return parts[1]?`${url}#${parts[1]}`:url}
  function setVisible(nav,visible){nav.hidden=!visible;document.body.classList.toggle('has-mobile-bottom-nav',visible)}
  function render(){const session=Auth.getSession();if(!session||session.user?.Role!=='STUDENT'||!['dashboard','quiz','leaderboard','profile'].includes(document.body?.dataset.page))return null;const nav=document.createElement('nav');nav.className='mobile-bottom-nav';nav.setAttribute('aria-label','Navigasi peserta');const active=current();items.forEach(item=>{const link=document.createElement('a');link.className=`mobile-bottom-nav__item${active===item.id?' is-active':''}`;link.href=buildAppUrl(item.page);link.setAttribute('aria-label',item.label);if(active===item.id)link.setAttribute('aria-current','page');link.append(icon(item.path));const text=document.createElement('span');text.textContent=item.label;link.append(text);nav.append(link)});document.body.append(nav);if(document.body.dataset.page!=='quiz'){setVisible(nav,true);if(location.hash==='#challenge')requestAnimationFrame(()=>document.querySelector('[data-season-container]')?.scrollIntoView({behavior:'smooth',block:'start'}));return nav}setVisible(nav,false);const result=document.querySelector('#quiz-result');if(result){const update=()=>setVisible(nav,!result.hidden);new MutationObserver(update).observe(result,{attributes:true,attributeFilter:['hidden']});update()}return nav}
  function syncHash(){if(document.body?.dataset.page!=='dashboard')return;document.querySelectorAll('.mobile-bottom-nav__item').forEach((link,index)=>{const active=location.hash==='#challenge'?index===1:index===0;link.classList.toggle('is-active',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current')})}
  function init(){window.addEventListener('hashchange',syncHash);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',render,{once:true});else render()}
  return Object.freeze({init,render,buildAppUrl});
})();
MobileBottomNavigation.init();
