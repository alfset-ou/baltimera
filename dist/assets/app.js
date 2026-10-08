(() => {
 'use strict';
 const root=document.documentElement;
 root.dataset.palette='sand';
 const header=document.querySelector('.site-header');
 function updateHeader(){header.classList.toggle('scrolled',window.scrollY>24)}
 window.addEventListener('scroll',updateHeader,{passive:true});updateHeader();
 const sections=document.querySelectorAll('section[id],footer[id]');
 const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.desktop-nav a,.mobile-menu nav a').forEach(a=>{if(a.hash==='#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')})}})},{rootMargin:'-15% 0px -60% 0px'});
 sections.forEach(section=>observer.observe(section));
 const navLinks=document.querySelectorAll('.desktop-nav a,.mobile-menu nav a');
 navLinks.forEach(link=>link.addEventListener('click',()=>navLinks.forEach(item=>{if(item.hash===link.hash)item.setAttribute('aria-current','location');else item.removeAttribute('aria-current')})));
 const menu=document.getElementById('mobile-menu'),toggle=document.querySelector('.menu-toggle');
 function openDialog(d){d.showModal();document.body.classList.add('dialog-open')}
 function closeDialog(d){d.close();if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open')}
 document.querySelectorAll('dialog').forEach(d=>d.addEventListener('close',()=>{if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open')}));
 toggle.addEventListener('click',()=>{openDialog(menu);toggle.setAttribute('aria-expanded','true')});
 document.querySelector('.close-menu').addEventListener('click',()=>closeDialog(menu));
 menu.addEventListener('close',()=>toggle.setAttribute('aria-expanded','false'));
 menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeDialog(menu)));
 const info=document.getElementById('information');
 function showInfo(title,text){document.getElementById('info-title').textContent=title;document.getElementById('info-copy').textContent=text;openDialog(info)}
 document.querySelectorAll('[data-language]').forEach(b=>b.addEventListener('click',()=>showInfo(b.dataset.language==='ET'?'Эстонская версия':'Английская версия','Место для языка предусмотрено в дизайне. Утверждённый перевод не приложен; по Design guides.md тексты для ET и EN должны быть предоставлены или согласованы клиентом. Сейчас доступен русский прототип.')));
 document.querySelectorAll('[data-info]').forEach(b=>b.addEventListener('click',()=>showInfo(b.dataset.info==='privacy'?'Политика конфиденциальности':'Cookies',b.dataset.info==='privacy'?'[ТЕКСТ ПОЛИТИКИ ОТ КЛИЕНТА]. В этом прототипе данные формы не сохраняются и никуда не отправляются. Перед запуском необходимо добавить реквизиты оператора и утверждённый текст политики.':'В прототипе нет аналитики и рекламных cookies. Выбор палитры хранится только в пределах текущей сессии браузера. Настройки согласия нужно добавить при подключении аналитики.')));
 document.querySelectorAll('.close-info').forEach(b=>b.addEventListener('click',()=>closeDialog(info)));
 info.addEventListener('click',e=>{if(e.target===info){const r=info.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeDialog(info)}});
 const descriptions={1:'Вертикальные панели на фасаде рядом с окном',2:'Образец панели с вертикальными ламелями',3:'Модульный дом с панелями на переднем фасаде',4:'Панели в отделке стены и потолка террасы',5:'Компактное строение с комбинированным фасадом',6:'Крупный план фактуры и ритма ламелей',7:'Отделка панелями входной зоны под навесом',8:'Образец фасадной панели на фоне тёмной стены',9:'Дом с вертикальными панелями и двускатной крышей',10:'Входная группа с вертикальными панелями',11:'Отделка фасада вокруг входной двери'};
 const photos=[9,10,4,3,1,11,5,7,2,6,8];
 let current=0,startX=null;
 const lightbox=document.getElementById('lightbox'),image=document.getElementById('lightbox-image');
 function renderPhoto(){const id=photos[current];image.src='assets/photo-'+String(id).padStart(2,'0')+'.webp';image.alt=descriptions[id];document.getElementById('photo-counter').textContent=String(current+1).padStart(2,'0')+' / 11';document.getElementById('photo-caption').textContent=descriptions[id]}
 function changePhoto(step){current=(current+step+photos.length)%photos.length;renderPhoto()}
 document.querySelectorAll('[data-photo]').forEach(b=>b.addEventListener('click',()=>{current=photos.indexOf(Number(b.dataset.photo));renderPhoto();openDialog(lightbox)}));
 document.getElementById('photo-prev').addEventListener('click',()=>changePhoto(-1));
 document.getElementById('photo-next').addEventListener('click',()=>changePhoto(1));
 document.getElementById('lightbox-close').addEventListener('click',()=>closeDialog(lightbox));
 lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'){e.preventDefault();changePhoto(-1)}if(e.key==='ArrowRight'){e.preventDefault();changePhoto(1)}});
 lightbox.addEventListener('click',e=>{if(e.target===lightbox||e.target.classList.contains('lightbox-content'))closeDialog(lightbox)});
 image.addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX},{passive:true});
 image.addEventListener('touchend',e=>{if(startX!==null){const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>50)changePhoto(delta>0?-1:1);startX=null}},{passive:true});
 const more=document.getElementById('load-more');
 if(more)more.addEventListener('click',()=>{document.querySelector('.more-gallery').hidden=false;document.getElementById('gallery-count').textContent='11 из 11';more.hidden=true;document.querySelector('.more-gallery button').focus()});
 const form=document.querySelector('.inquiry-form');
 if(form){const initial=Array.from(form.children).filter(e=>!e.classList.contains('form-result')),result=form.querySelector('.form-result');
  function error(name,text){const input=form.elements[name];input.setAttribute('aria-invalid',text?'true':'false');input.setAttribute('aria-describedby',name+'-error');document.getElementById(name+'-error').textContent=text}
  form.addEventListener('submit',e=>{e.preventDefault();let invalid=[];const name=form.elements.name.value.trim(),contact=form.elements.contact.value.trim();
   error('name',name?'':'Укажите ваше имя.');if(!name)invalid.push(form.elements.name);
   const validContact=contact.includes('@')?/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact):/^\+?[\d\s()\-]{7,}$/.test(contact)&&contact.replace(/\D/g,'').length>=7;
   error('contact',validContact?'':'Укажите телефон или корректный e-mail.');if(!validContact)invalid.push(form.elements.contact);
   error('consent',form.elements.consent.checked?'':'Подтвердите согласие с обработкой данных.');if(!form.elements.consent.checked)invalid.push(form.elements.consent);
   if(invalid.length){invalid[0].focus();return}
   initial.forEach(e=>e.hidden=true);result.hidden=false;result.focus();
  });
  form.querySelector('.reset-form').addEventListener('click',()=>{initial.forEach(e=>e.hidden=false);result.hidden=true;form.elements.name.focus()});
 }
})();

// One-time section entrance, independent of navigation and the 3D viewer.
(() => {
 function startReveals(){
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 if(preference.matches||!('IntersectionObserver' in window))return;
 const selectors='.hero-copy,.hero-facts,.section-heading,.project,.construction-showcase,.services>div,.about-copy,.about-photo,.request-card,.model-layout,.model-draft-note,.footer-grid,.footer-bottom,.gallery-bottom,.about-photo-pair>figure,.about-photo-wide,.architecture-break,.manufacturing-photo,.manufacturing-steps>li';
 const elements=Array.from(document.querySelectorAll(selectors));
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
   if(!entry.isIntersecting)return;
   entry.target.classList.add('is-visible');
   observer.unobserve(entry.target);
  });
 },{threshold:0,rootMargin:'0px 0px -24px 0px'});
 elements.forEach(element=>{
  element.classList.add('scroll-reveal');
  if(element.matches('.project,.services>div')){
   const columns=window.matchMedia('(max-width:700px)').matches?2:3;
   const index=Array.from(element.parentElement.children).indexOf(element);
   element.style.setProperty('--reveal-delay',(index%columns)*70+'ms');
  }
  observer.observe(element);
 });
 document.documentElement.classList.add('motion-ready');
 function showAll(){
  elements.forEach(element=>element.classList.add('is-visible'));
  observer.disconnect();
  document.documentElement.classList.remove('motion-ready');
 }
 preference.addEventListener('change',event=>{if(event.matches)showAll()});
 window.addEventListener('beforeprint',showAll);
 }
 if(document.documentElement.classList.contains('intro-active')){
  window.addEventListener('baltimera:intro-complete',startReveals,{once:true});
 }else startReveals();
})();

// A shallow parallax inside the architectural photo, without moving layout.
(() => {
 const frame=document.querySelector('.architecture-break');
 if(!frame)return;
 const image=frame.querySelector('img');
 const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,scheduled=0;
 function update(){
  scheduled=0;
  if(motion.matches||!visible)return;
  const rect=frame.getBoundingClientRect();
  const viewport=window.innerHeight;
  const progress=Math.max(-1,Math.min(1,(rect.top+rect.height/2-viewport/2)/((rect.height+viewport)/2)));
  image.style.transform='translate3d(0,'+(-progress*rect.height*.1).toFixed(2)+'px,0)';
 }
 function schedule(){if(!scheduled&&visible&&!motion.matches)scheduled=requestAnimationFrame(update)}
 function preference(){
  frame.classList.toggle('depth-enabled',!motion.matches);
  if(motion.matches){image.style.removeProperty('transform');if(scheduled)cancelAnimationFrame(scheduled);scheduled=0}
  else schedule();
 }
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{rootMargin:'120px'}).observe(frame);
 window.addEventListener('scroll',schedule,{passive:true});
 window.addEventListener('resize',schedule,{passive:true});
 motion.addEventListener('change',preference);
 preference();
})();

// Keep mobile processing information available without a long stack of paragraphs.
(() => {
 const steps=[...document.querySelectorAll('.manufacturing-steps details')];
 if(!steps.length)return;
 const mobile=window.matchMedia('(max-width:700px)');
 function adapt(){steps.forEach((step,index)=>{step.open=!mobile.matches||index===0;});}
 for(const step of steps){
  step.querySelector('summary').addEventListener('click',event=>{if(!mobile.matches)event.preventDefault();});
  step.addEventListener('toggle',()=>{
   if(!mobile.matches||!step.open)return;
   for(const other of steps)if(other!==step)other.open=false;
  });
 }
 adapt();mobile.addEventListener('change',adapt);
})();
// Position the mobile roof a small, consistent distance below the action buttons.
(() => {
 const hero=document.querySelector('.hero-inner');
 const actions=hero?.querySelector('.hero-actions');
 if(!hero||!actions)return;
 const mobile=window.matchMedia('(max-width:700px)');
 const imageWidth=1037,imageHeight=1517,roofY=871;
 let frame=0;
 function update(){
  frame=0;if(!mobile.matches)return;
  let buttonBottom=actions.offsetHeight,node=actions;
  while(node&&node!==hero){buttonBottom+=node.offsetTop;node=node.offsetParent;}
  const gap=parseFloat(getComputedStyle(actions).rowGap)||10;
  const target=buttonBottom+gap*2;
  const width=hero.clientWidth;
  const heightFit=target*imageHeight/roofY;
  const height=heightFit>=width*imageHeight/imageWidth
   ?heightFit:target+(imageHeight-roofY)*width/imageWidth;
  hero.style.setProperty('--mobile-hero-height',`${Math.ceil(height)}px`);
 }
 function schedule(){if(!frame)frame=requestAnimationFrame(update);}
 if('ResizeObserver' in window){const observer=new ResizeObserver(schedule);observer.observe(actions);observer.observe(hero.querySelector('.hero-copy'));}
 window.addEventListener('resize',schedule,{passive:true});mobile.addEventListener('change',schedule);
 if(document.fonts)document.fonts.ready.then(schedule);
 schedule();
})();
