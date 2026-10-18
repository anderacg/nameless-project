'use strict';
/* ---------- loading: one overlay for the long waits, and the driver that runs long work in steps (doc/WORLD_DESIGN.md §5) ----------
   runSteps(title, steps, opt): the driver. Returns a Promise of the last step's value (kept as LOADING.task too).
     steps: [{id, label, w, run}], in order. w: the step's share of the bar (1 if left out). run(): its work: plain, or a generator
       function that yields at safe points (yield a number 0-1: how far through the step it is), or one that returns a Promise
       (a gunzip: save.js), waited for, the game waiting too. Or steps is one generator function: one step, its yields as above.
     The work runs in slices of up to LOADING.slice ms a frame (requestAnimationFrame), cut only between steps and at yields.
       Between slices G.mode is 'loading' and G.modal is set: main.js runs no simulation, render.js frame() draws the overlay over
       the last frame and nothing that draws a random, and input waits. Each slice gives G.mode and G.modal back as the work left
       them, so it sees what it would in one go, and draws its randoms in the same order.
     opt.back: [label, fn]: the way back on an error or a stall (by default to the title).
     One run at a time: called again while one runs, it returns that run's promise and does nothing.
     On an error: the error view, and the promise rejects. No step for LOADING.stall ms (20 s): the stall view (Keep waiting, or
       the way back; taking it calls the run off and the promise rejects).
     LOADING.sync (the tests, harness.js): every step at once, in order, inside the call, no overlay; an error is thrown
       (a step that returns a Promise, too: it cannot be waited for).
   loadingShow(title, steps): opens the overlay for these steps ([{id, label, w}]). It shows only after LOADING.delay ms (300) and,
     once shown, stays LOADING.hold ms (400) at least (runSteps waits it out); until it shows it is clear and only takes the
     pointer, so a quick load never flashes.
   loadingStep(id, frac): the step under way and how far through it (0-1). The bar is the steps before it plus its share x frac,
     and never goes back.
   loadingHide(): closes it, and gives G.mode and G.modal back as the work left them (runSteps does, in a finally).
   loadingFail(err, back): the error view: what went wrong, Copy error, and the way back (back: [label, fn]).
   Esc while it is open: the error and stall views follow their bottom bar (Back, else the way out: ui.js nav); otherwise nothing,
   and no key reaches the game. A tip (TIPS) changes every LOADING.tip ms; your flag flutters by the title (loadingFrame: render.js
   frame() calls it in loading mode and draws nothing else). */
const LOADING={sync:false,delay:300,hold:400,stall:20000,slice:12,tip:4000,
  on:false,task:null,title:'',steps:[],cur:null,frac:0,at:0,last:0,shownAt:0,view:null,back:null,keep:null,run:null,stop:null,err:null,el:null,timer:null,tipAt:0,tipI:0};
const TIPS=['Hover anything on the map to see what it is and how strong it is against you.','Space pauses; 1, 2 and 3 set the speed of the game. 4 travels fast until anything hostile comes into sight.',
  'F6 saves at any time. The game also saves itself each day and when you leave a town.','L opens the message log; H shows every control.',
  'In the frost, carry one bundle of furs for every five people.','Elves make the best arrows, dwarves the best bolts.',
  'Grain and cheese never spoil. Milk turns within days.','Fish is cheap by the water, and spoils quickly.','Spice is worth the most for each bag slot.',
  'Every building project and estate wears out tools.','Towns drink ale, and content people work harder.','Bronze wants copper and tin alike.',
  'Mithril is found only under the frozen peaks.','Pearls are dived for in warm southern waters.','Iron is cheapest in Ironvein, grain in Brookhollow.',
  'Stonebridge trades everything at fair prices.','Sunreach is the orc capital, on the spice road.','A castle lodges only those it knows: it is a garrison, not an inn.',
  'Castles hire mounted troops. Orc strongholds hire wolf riders.','Towns and cities hold tourneys; their taverns have brokers and contracts.',
  'A holding\'s land grows while it is held in peace. Siege, sack and raids cut it back.','Strong holdings push their borders into weak ones.',
  'A captured holding brings all its land to its new owner.','Roads are quick ground: a holding\'s land runs far along them.',
  'Lords win levels and renown from their battles, as you do.','A realm short of holdings rallies more soldiers to its lords.',
  'A lord resting in a holding stands with its garrison in any siege.','A holding\'s guards are drawn from its own people.',
  'Standing with a holding lets you hire better troops there.','Your own people trust you a little from the start.',
  'Your race and your past give you a knack: those disciplines come faster.','Holdings you take for yourself fly the Free Banner.',
  'In battle, right-click an enemy to attack it; double right-click to charge.','H, C and V: hold, charge and advance.',
  'Right-drag to lay out a line where you want it.','After a won battle you gather some of your arrows and bolts back.',
  'Workers from the estates bring their goods in through the afternoon and go home at dusk.','Herds graze round villages, towns and cities.',
  'Companions wait in their own towns until you find them.','Sacking a holding fills your purse; taking one earns renown.'];
// the overlay (made when first needed, over the whole screen)
function loadingEl(){const L=LOADING;if(L.el)return L.el;const el=document.createElement('div');el.className='loading';el.hidden=true;
  el.innerHTML='<div class="lwin" role="dialog" aria-live="polite"><div class="ltop"><canvas class="lflag" width="9" height="13"></canvas><h2></h2></div>'+
    '<div class="lbar"><i></i></div><p class="lstep"></p><p class="ltip"></p><div class="lmore"></div><div class="btns nav"></div></div>';
  el.addEventListener('click',e=>{const b=e.target.closest('[data-ld]');if(b)loadingAct(b.dataset.ld)});
  (document.getElementById('screen')||document.body).appendChild(el);return L.el=el}
function loadingShow(title,steps){const L=LOADING,el=loadingEl(),now=performance.now();loadingHide();
  Object.assign(L,{on:true,title,steps:steps||[],cur:null,frac:0,at:now,last:now,shownAt:0,tipAt:now,tipI:Math.floor(Date.now()/L.tip)%TIPS.length});
  el.hidden=false;el.classList.add('wait');loadingView('bar');L.timer=setInterval(loadingTick,100)}
// it shows (the delay passed, or there is something to say)
function loadingReveal(){const L=LOADING;if(!L.on||L.shownAt)return;L.shownAt=performance.now();L.el.classList.remove('wait');loadingTick()}
function loadingStep(id,frac){const L=LOADING;if(!L.on)return;L.last=performance.now();
  let a=0,sum=0,w=0;for(const s of L.steps){const k=s.w==null?1:s.w;if(s.id===id){w=k;a=sum}sum+=k}
  L.cur=id;L.frac=Math.max(L.frac,sum?(a+w*clamp(+frac||0,0,1))/sum:0);if(L.view!=='error')loadingView('bar')}
function loadingHide(){const L=LOADING;clearInterval(L.timer);L.timer=null;L.on=false;L.view=null;L.run=null;
  if(L.keep){G.mode=L.keep.mode;G.modal=L.keep.modal;L.keep=null}if(L.el){L.el.hidden=true;L.el.classList.remove('wait')}}
function loadingFail(err,back){const L=LOADING;if(!L.on)loadingShow('',[]);L.err=err;L.back=back||L.back||['Back to the title',()=>showTitle()];
  loadingView('error');loadingReveal()}
// what the window shows: the bar (the step under way, a tip), the error, or the stall; and its bottom bar
function loadingView(view){const L=LOADING,el=L.el,q=s=>el.querySelector(s),btn=(k,cls,nav)=>'<button class="btn'+cls+'" type="button" data-ld="'+k+'" data-nav="'+nav+'"></button>';
  if(L.view!==view){L.view=view;el.dataset.view=view;
    q('.lmore').innerHTML=view==='error'?'<pre class="lerr"></pre><div class="btns"><button class="btn sm" type="button" data-ld="copy">Copy error</button></div>':'';
    q('.nav').innerHTML=view==='bar'?'':(view==='stall'?btn('wait','','back'):'')+'<span class="grow"></span>'+btn('back',' primary','close');
    const b=q('[data-ld="back"]');if(b)b.textContent=L.back?L.back[0]:'Back';const k=q('[data-ld="wait"]');if(k)k.textContent='Keep waiting';
    if(view==='error')q('.lerr').textContent=String(L.err&&L.err.stack||L.err)}
  q('h2').textContent=view==='error'?'Something went wrong':L.title;
  const s=L.steps.find(s=>s.id===L.cur);
  q('.lstep').textContent=view==='error'?String(L.err&&L.err.message||L.err):view==='stall'?'This is taking longer than expected.':s?s.label||'':'';
  q('.lbar i').style.width=(L.frac*100).toFixed(1)+'%';q('.ltip').textContent=view==='bar'?TIPS[L.tipI%TIPS.length]:''}
// a tenth of a second: the delay, a stall, the next tip, the flag
function loadingTick(){const L=LOADING;if(!L.on)return;const now=performance.now();
  if(!L.shownAt&&now-L.at>=L.delay)return loadingReveal();
  if(L.view==='bar'&&now-L.last>=L.stall){loadingView('stall');loadingReveal()}
  if(L.view==='bar'&&now-L.tipAt>=L.tip){L.tipAt=now;L.tipI++;L.el.querySelector('.ltip').textContent=TIPS[L.tipI%TIPS.length]}
  loadingFrame()}
// a frame while it is open (render.js frame() calls it in loading mode, and draws nothing else): the flag flutters
function loadingFrame(){const L=LOADING;if(!L.on||!L.shownAt||typeof flagSprite!=='function')return;const c=L.el.querySelector('.lflag'),f=Math.floor(performance.now()/220)%3;if(c._f===f)return;
  const s=flagSprite(FACS.player.col,f),g=c.getContext('2d');c._f=f;if(c.width!==s.width||c.height!==s.height){c.width=s.width;c.height=s.height}g.clearRect(0,0,c.width,c.height);g.drawImage(s,0,0)}
// its buttons: Copy error; Keep waiting (the bar again, the stall clock from now); the way back (the run called off)
function loadingAct(k){const L=LOADING;
  // (where the clipboard is shut, the error is selected to copy by hand)
  if(k==='copy'){const t=String(L.err&&L.err.stack||L.err),b=L.el.querySelector('[data-ld="copy"]'),pick=()=>getSelection().selectAllChildren(L.el.querySelector('.lerr'));
    try{navigator.clipboard.writeText(t).then(()=>{if(b)b.textContent='Copied'},pick)}catch(e){pick()}return}
  if(k==='wait'){L.last=performance.now();return loadingView('bar')}
  if(k==='back'){const b=L.back,stop=L.stop;loadingHide();G.modal=false;if(stop)stop();if(b)b[1]()}}
// Esc and every other key: theirs while it is open
addEventListener('keydown',e=>{const L=LOADING;if(!L.on)return;e.stopImmediatePropagation();if(e.key!=='Escape')return;e.preventDefault();
  if(L.view==='stall')loadingAct('wait');else if(L.view==='error')loadingAct('back')},true);
function runSteps(title,steps,opt){const L=LOADING,list=typeof steps==='function'?[{id:'work',label:'',w:1,run:steps}]:steps,iter=v=>v&&typeof v.next==='function',later=v=>v&&typeof v.then==='function';
  if(L.sync){let v;for(const s of list){v=s.run?s.run():undefined;if(later(v))throw new Error('A step that waits cannot run at once: '+s.id);if(iter(v)){let n;while(!(n=v.next()).done);v=n.value}}return L.task=Promise.resolve(v)}
  if(L.on&&L.run)return L.task;
  const back=opt&&opt.back||['Back to the title',()=>showTitle()];loadingShow(title,list);L.back=back;
  return L.task=new Promise((res,rej)=>{const run=L.run={};let i=0,it=null,v;
    const away=()=>{L.keep={mode:G.mode,modal:G.modal};G.mode='loading';G.modal=true},home=()=>{if(L.keep){G.mode=L.keep.mode;G.modal=L.keep.modal;L.keep=null}};
    const fail=e=>{G.modal=false;away();L.run=null;L.stop=null;loadingFail(e,back);rej(e)};
    L.stop=()=>{L.stop=null;rej(new Error('Called off'))};
    // (a slice: the tick first, as timers can starve behind busy frames; then the work, as the last slice left the game. A step
    // that returns a Promise (a gunzip) is waited for, the game waiting too, its value the step's)
    const slice=()=>{if(L.run!==run)return;loadingTick();home();const t0=performance.now();
      try{while(i<list.length){const s=list[i];
          if(!it){loadingStep(s.id,0);v=s.run?s.run():undefined;if(iter(v))it=v;
            else if(later(v)){away();v.then(x=>{if(L.run!==run)return;v=x;loadingStep(s.id,1);i++;slice()},e=>{if(L.run===run){home();fail(e)}});return}
            else{loadingStep(s.id,1);i++}}
          else{const n=it.next();if(n.done){v=n.value;it=null;loadingStep(s.id,1);i++}else if(typeof n.value==='number')loadingStep(s.id,n.value)}
          if(i<list.length&&performance.now()-t0>=L.slice){away();requestAnimationFrame(slice);return}}}
      catch(e){fail(e);return}
      // (done: once shown, it stays its least time, the game still waiting)
      L.stop=null;const wait=L.shownAt?L.hold-(performance.now()-L.shownAt):0;
      if(wait>0){away();setTimeout(()=>{if(L.run===run)loadingHide();res(v)},wait)}else{loadingHide();res(v)}};
    slice()})}
