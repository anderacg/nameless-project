'use strict';
// Time controls (doc/WORLD_DESIGN.md D23): 1x, 2x and 4x (keys 1-3 and the top bar's buttons) and Travel fast, 8x (key 4 and the
// bar's last button, back on it after the second play-test: each toggles 8x and 1x); the speed you set holds till you change it: no
// drop on danger, on events or windows, or on arriving. Hurry (world/supply.js): off the bar, on the action ring and key R, a
// toggle; the band marches twice as fast, its stamina on the march draining 2.5x; it cannot start Exhausted and ends on its own
// once the band is Exhausted, stops, or anything calls for you (an event, a window: fastWatch, every frame).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,S=t.SUPPLY;t.act('begin','soldier');G.quietEvents=true;
 const calm=()=>{t.setSpeed(1);t.setHurry(false);t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.paused=false;P.tx=null;G.chase=null;P.stay=null;P.camp=null;G.encCool=99;P.bsta=80;
   t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.patrols=[];W.monsters=[];W.fights=[];W.caravans=[];W.critters=[];P.hostile={};P.fac=null};
 const fast=()=>{calm();t.setSpeed(4);return G.speed===4};
 const key=(code,k)=>window.dispatchEvent(new KeyboardEvent('keydown',{code,key:k,bubbles:true}));
 calm();
 // ---- the controls: the buttons, lit as the speed is set; the keys
 {const bs=[...document.querySelectorAll('#wtop [data-speed]')],hb=document.querySelector('#wtop [data-hurry]');
  ok(JSON.stringify(bs.map(b=>+b.dataset.speed))==='[1,2,4,8]'&&JSON.stringify(t.SPEEDS)==='[1,2,4]'&&t.TRAVEL_FAST===8&&bs[3].textContent==='8×'&&!hb&&!document.querySelector('[data-hurry]'),'the top bar has 1×, 2×, 4× and 8× again, and no Hurry: '+bs.map(b=>b.textContent).join(', '));
  const lit=()=>bs.filter(b=>b.classList.contains('on')&&b.getAttribute('aria-pressed')==='true').map(b=>+b.dataset.speed).join(),seen=[];
  for(const [c,k] of [['Digit2','2'],['Digit3','3'],['Digit1','1']]){key(c,k);seen.push(G.speed+':'+lit())}
  ok(seen.join(' ')==='2:2 4:4 1:1','keys 1-3 set 1×, 2×, 4×; the button lit is the speed ('+seen.join(' ')+')');
  key('Digit4','4');const k1=G.speed+':'+lit();key('Digit4','4');const k2=G.speed+':'+lit();
  ok(k1==='8:8'&&k2==='1:1'&&!G.hurry,'4 runs the world at 8×, its button lit, and again back to 1× ('+k1+' '+k2+'); Hurry untouched');
  bs[3].click();const c1=G.speed;bs[3].click();const c2=G.speed;bs[2].click();ok(c1===8&&c2===1&&G.speed===4,'its button toggles 8× and 1× too (touch); 4× by its button');
  ok(bs[3].title.includes('(4')&&/8×/.test(bs[3].title),'its button says what it does and its key ('+bs[3].title+')');
  key('KeyR','r');const on=!!G.hurry&&G.speed===4;key('KeyR','r');ok(on&&!G.hurry,'R turns Hurry on and off again; the speed stays as it was');
  {const help=t.KEYS[0][1].map(([k,v])=>k+': '+v).join(' | ');ok(help.includes('4: travel fast (8×)')&&help.includes('R: hurry')&&t.CONTROLS.includes('R to hurry')&&t.CONTROLS.includes('4 to travel fast'),'Help and the controls line name 4 for Travel fast and R for Hurry')}
  calm()}
 // ---- the speed you set holds (the owner, 2026-10-19): danger in sight, an event or a window, arriving: none of them change it
 {const V=t.vis(),near={x:P.x+V*.6,y:P.y};
  calm();t.setSpeed(t.TRAVEL_FAST);t.spawnBandit(true);Object.assign(t.bandits[0],near);t.updateWorld(.05);ok(G.speed===8,'bandits in sight: 8× goes on');
  fast();t.spawnBandit(true);Object.assign(t.bandits[0],near);t.updateWorld(.05);ok(G.speed===4,'bandits in sight: 4× goes on');
  const L=W.lords.find(l=>!l.dead);fast();Object.assign(L,near,{inside:null,fight:null});P.hostile={[L.fac]:G.day+9};t.updateWorld(.05);ok(G.speed===4,'an enemy army in sight: still 4×');L.x=-9999;
  fast();G.mode='event';t.fastWatch();ok(G.speed===4,'an event or a window opening leaves the speed as it was');G.mode='world';
  G.modal=true;t.fastWatch();G.modal=false;ok(G.speed===4,'and so does a dialog over the map');
  P.tx=P.x+20;P.ty=P.y;let f=0;for(;f<400&&P.tx!=null;f++)t.updateWorld(.05);
  ok(P.tx==null&&G.speed===4,'arriving where you were going keeps the speed ('+f+' frames)')}
 // ---- Hurry: twice the pace, the march's drain x2.5
 {calm();const x0=P.x,y0=P.y,walk=h=>{P.x=x0;P.y=y0;P.tx=x0+400;P.ty=y0;G.hurry=h;Kit.stub(.5,()=>t.updateWorld(.05));return P.x-x0},a=walk(false),b=walk(true);
  ok(a>0&&Math.abs(b/a-S.forcedMarch.pace)<1e-6,'hurrying, your band walks '+S.forcedMarch.pace+'× as far a frame ('+a.toFixed(3)+' then '+b.toFixed(3)+' px)');
  calm();const L=t.supplyLand(),dr=t.drinkNext(L),r0=t.staminaRate(true,dr,L).n;G.hurry=true;const r1=t.staminaRate(true,dr,L);
  ok(Math.abs(r1.n/r0-S.forcedMarch.drain)<1e-9&&r1.why.some(w=>/hurrying/.test(w))&&!r1.why.some(w=>/Forced March/.test(w)),'and its stamina on the march drains ×'+S.forcedMarch.drain+' ('+r0+' → '+r1.n+' an hour), named Hurry, not the Forced March perk');
  ok(Math.abs(t.staminaRate(false,dr,L).n-S.rest.stop)<1e-9,'stopped it rests as ever');
  t.updateHUD(true);ok([...document.querySelectorAll('#stats .pc-tags .tag')].some(x=>x.textContent==='Hurrying'),'the card says Hurrying')}
 // ---- it ends on its own: Exhausted, an event or a window, making camp; it cannot start Exhausted
 {calm();t.setHurry(true);P.bsta=S.exhausted-1;t.fastWatch();ok(!G.hurry&&/exhausted/.test((G.msgs[G.msgs.length-1]||{}).m||''),'your band Exhausted: Hurry ends, said in the log');
  ok(!t.setHurry(true)&&!G.hurry,'and it cannot start again while Exhausted');
  calm();t.setHurry(true);G.mode='event';t.fastWatch();ok(!G.hurry,'an event opening ends it');
  calm();t.setHurry(true);G.modal=true;t.fastWatch();ok(!G.hurry,'and so does a window over the map');G.modal=false;
  calm();t.spawnBandit(true);Object.assign(t.bandits[0],{x:P.x+t.vis()*.6,y:P.y});t.setHurry(true);t.updateWorld(.05);ok(!!G.hurry,'bandits in sight: you may hurry away');
  calm();t.setHurry(true);P.camp={at:0};t.fastWatch();ok(!G.hurry,'making camp ends it');calm()}
 // ---- the main loop watches it whatever is shown (main.js calls fastWatch every frame)
 {const src=(()=>{const x=new XMLHttpRequest();x.open('GET','js/main.js',false);x.send();return x.responseText})();ok(/fastWatch\(\)/.test(src),'the main loop watches Hurry every frame, in every mode')}
 calm();t.setSpeed(1);
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
