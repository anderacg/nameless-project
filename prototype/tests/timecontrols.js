'use strict';
// Time controls (doc/WORLD_DESIGN.md D23): 1x, 2x and 4x (keys 1-3 and the top bar's buttons) and Travel fast, 8x (key 4 or its
// button, a toggle). The speed you set holds till you change it: no drop on danger, on events or windows, or on arriving.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;
 const calm=()=>{t.setSpeed(1);t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.paused=false;P.tx=null;G.chase=null;P.stay=null;G.encCool=99;
   t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.patrols=[];W.monsters=[];W.fights=[];W.caravans=[];W.critters=[];P.hostile={};P.fac=null};
 const fast=()=>{calm();t.setSpeed(t.TRAVEL_FAST);return G.speed===t.TRAVEL_FAST},said=()=>(G.msgs[G.msgs.length-1]||{}).m||'';
 calm();
 // ---- the controls: the buttons, lit as the speed is set; the keys
 {const bs=[...document.querySelectorAll('#wtop [data-speed]')];ok(JSON.stringify(bs.map(b=>+b.dataset.speed))==='[1,2,4,8]'&&JSON.stringify(t.SPEEDS)==='[1,2,4]'&&t.TRAVEL_FAST===8,'the top bar has 1×, 2×, 4× and Travel fast (8×): '+bs.map(b=>b.textContent).join(', '));
  const lit=()=>bs.filter(b=>b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true').map(b=>+b.dataset.speed).join();
  const key=(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true}));const seen=[];
  for(const [c,k] of [['Digit2','2'],['Digit3','3'],['Digit1','1'],['Digit4','4']]){key(c,k);seen.push(G.speed+':'+lit())}
  key('Digit4','4');seen.push(G.speed+':'+lit());
  ok(seen.join(' ')==='2:2 4:4 1:1 8:8 1:1','keys 1-3 set 1×, 2×, 4×; 4 turns Travel fast on and off again; the button lit is the speed ('+seen.join(' ')+')');
  const b8=bs.find(b=>+b.dataset.speed===8);b8.click();const on=G.speed;b8.click();const off=G.speed;bs.find(b=>+b.dataset.speed===4).click();
  ok(on===8&&off===1&&G.speed===4,'its button toggles it too (touch): '+on+' then '+off+'; 4× by its button');
  ok(b8.title.includes('(4)')&&/hostile/.test(b8.title),'its button says what it does and its key')}
 // ---- it runs while nothing calls: 8x the world's time
 {ok(fast(),'Travel fast starts with nothing in sight');const c0=G.clock;t.updateWorld(.05);
  ok(Math.abs((G.clock-c0)-.05*8*t.DAY/t.DAY_SECONDS)<1e-9&&G.speed===8,'and runs the world at 8× ('+((G.clock-c0)/(.05*t.DAY/t.DAY_SECONDS)).toFixed(2)+'×) while nothing is near')}
 // ---- the speed you set holds (the owner, 2026-10-19): danger in sight, an event or a window, arriving: none of them change it
 {const V=t.vis(),near={x:P.x+V*.6,y:P.y};
  fast();t.spawnBandit(true);Object.assign(t.bandits[0],near);t.updateWorld(.05);ok(G.speed===8,'bandits in sight: Travel fast goes on');
  const L=W.lords.find(l=>!l.dead);fast();Object.assign(L,near,{inside:null,fight:null});P.hostile={[L.fac]:G.day+9};t.updateWorld(.05);ok(G.speed===8,'an enemy army in sight: still 8×');L.x=-9999;
  t.setSpeed(4);t.updateWorld(.05);ok(G.speed===4,'4× holds with bandits in sight too');
  calm();t.spawnBandit(true);Object.assign(t.bandits[0],near);t.setSpeed(t.TRAVEL_FAST);ok(G.speed===8,'Travel fast starts even with bandits in sight')}
 {fast();G.mode='event';t.fastWatch();ok(G.speed===8,'an event or a window opening leaves the speed as it was');G.mode='world';
  G.modal=true;t.fastWatch();G.modal=false;ok(G.speed===8,'and so does a dialog over the map');
  P.tx=P.x+20;P.ty=P.y;let f=0;for(;f<400&&P.tx!=null;f++)t.updateWorld(.05);
  ok(P.tx==null&&G.speed===8,'arriving where you were going keeps the speed ('+f+' frames)')}
 // ---- the main loop watches it whatever is shown (main.js calls fastWatch every frame)
 {const src=(()=>{const x=new XMLHttpRequest();x.open('GET','js/main.js',false);x.send();return x.responseText})();ok(/fastWatch\(\)/.test(src),'the main loop watches Travel fast every frame, in every mode')}
 calm();t.setSpeed(1);
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
