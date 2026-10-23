'use strict';
// The action ring (doc/SUPPLY_DESIGN.md §7a, ui/ring.js): the left button held still on the map opens a ring of the actions that
// apply there; a press does nothing yet: let go before it opens, it travels (the owner, 2026-10-22: click or hold); a move
// before it opens calls the ring off, and letting go still travels; let go over a button picks it, or let go first
// and tap one; Esc, a right-click or a tap outside closes it, travelling nowhere. A short click on another party opens its own
// ring at it (ui/input.js partyRing: Attack or Meet, Follow, Look), chasing nothing yet; held on it, the map's with Follow. Only what applies: Make camp or Break camp,
// Travel here, By road (world.js roadGo: by-road mode on, and you go there; on, it turns it off) and Hurry here on the ground (Stop
// hurrying while you hurry), Fill waterskins at the water's edge or a holding's well (lit while they fill; "No empty waterskins" with none to fill), Drink liquor with liquor, Look on something. A mode that is on (camped, by
// road, hurrying) is lit: the button's class on, a gold glow; the rest are not. A finger's long press opens it too, and its Look
// shows the card. At a phone's 844 x 390 every button, lit or not, is on the screen.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const t=T,G=t.G,P=t.P,ev=s=>(0,eval)(s),cv=t.cv,R=t.RING;
 Kit.begin('soldier',4242);Kit.clear();Kit.world();W0();
 function W0(){t.W.folk=[];t.W.patrols=[];t.W.caravans=[];t.W.refugees=[];t.W.critters=[]}
 const spot=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<200)&&!t.nearWater(x,y,5)&&t.campGround(x,y))return [x,y]}})();// (clear ground: Make camp pitches there at once)
 const bag=g=>{for(const k of ['water','skin_empty','ale','liquor'])t.goodTake(k,1e9);for(const k in g)t.playerInventory.add('good',k,g[k])};
 const reset=()=>{t.ActionRing.close();t.hideTip();Kit.world();Kit.goTo(spot[0],spot[1]);ev('BAND=freshBand()');G.encCool=99;G.speed=1;G.chase=null;P.tx=null;t.bandits.length=0;W0();t.drawWorld()};
 // (client points of a world point; a pointer event on the canvas, or at a point of the window)
 const cl=(wx,wy)=>{const r=cv.getBoundingClientRect();return{clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH}};
 const down=(p,more)=>cv.dispatchEvent(new PointerEvent('pointerdown',{...p,pointerType:'mouse',button:0,pointerId:1,bubbles:true,...more}));
 const up=(p,more)=>window.dispatchEvent(new PointerEvent('pointerup',{...p,pointerType:'mouse',button:0,pointerId:1,bubbles:true,...more}));
 const move=p=>cv.dispatchEvent(new PointerEvent('pointermove',{...p,pointerType:'mouse',pointerId:1,bubbles:true}));
 const ring=()=>t.ActionRing.now,labels=()=>ring()?ring().items.map(i=>i.label):[];
 const btn=l=>{const b=[...document.querySelectorAll('.aring .ar-btn')].find(x=>x.textContent===l);if(!b)return null;const r=b.getBoundingClientRect();return{el:b,clientX:r.left+r.width/2,clientY:r.top+r.height/2}};
 const held=async()=>wait(R.hold+80);
 // ---- a short click travels when it is let go; no ring
 reset();{const wx=P.x+60,p=cl(wx,P.y+20);down(p);const none=P.tx==null&&!G.chase;await wait(R.hold/3);const still=P.tx==null;up(p);const went=P.tx!=null&&Math.abs(P.tx-wx)<2;await held();
  ok(none&&still,'a press travels nowhere yet');ok(went&&!ring(),'let go before '+R.hold+' ms: you travel there, and no ring opens')}
 // ---- held still: the ring, the travel put back
 reset();{const wx=P.x+60,p=cl(wx,P.y+20);down(p);await held();
  ok(!!ring()&&P.tx==null&&document.querySelector('.aring'),'held still '+R.hold+' ms: the ring opens, travelling nowhere');
  ok(labels().join()==='Make camp,Travel here,By road,Hurry here','on bare ground: '+labels().join(', '));
  const b=btn('Travel here');up(b);ok(!ring()&&P.tx!=null&&Math.abs(P.tx-wx)<2,'let go over Travel here: you travel there, the ring closed ('+(b&&b.el.textContent)+', '+P.tx+' for '+wx+')')}
 // ---- By road: by-road mode on and you travel there; it stays on for a plain click after it, and the ring lights it; picked
 // again, it is off
 const lit=()=>[...document.querySelectorAll('.aring .ar-btn.on')].map(b=>b.textContent),glow=l=>{const b=btn(l);return b?getComputedStyle(b.el).boxShadow:''};
 reset();t.setByRoad(false);{const wx=P.x+60,p=cl(wx,P.y+20);down(p);await held();const none=lit().length===0;const said=G.msgs.length;up(btn('By road'));const m=G.msgs.slice(said).map(q=>q.m).join(' ');
  ok(none&&!ring()&&P.tx!=null&&Math.abs(P.tx-wx)<2&&P.byRoad===true&&/keeps to the roads/.test(m),'let go over By road (none lit before): by-road mode on, you travel there ('+m+')');
  t.worldGo(wx,P.y);ok(P.byRoad===true,'and it stays on for a plain click after it');P.tx=null;
  down(p);await held();up(p);const b=btn('By road');
  ok(lit().join()==='By road'&&b.el.getAttribute('aria-checked')==='true'&&/\(on\)/.test(b.el.title)&&/rgba?\(232, 185, 74/.test(glow('By road'))&&!/rgba?\(232, 185, 74/.test(glow('Travel here')),'the ring lights By road while it is on (gold glow: '+glow('By road').slice(0,60)+'), and only it ('+lit().join()+')');
  b.el.click();ok(!P.byRoad&&P.tx==null,'picked again: off, travelling nowhere');
  down(p);await held();up(p);ok(lit().length===0&&labels().includes('By road'),'off: none lit');t.ActionRing.close()}
 // ---- hurrying, camped: lit too
 reset();{const p=cl(P.x+60,P.y+20);t.worldGo(P.x+200,P.y);t.setHurry(true);down(p);await held();up(p);ok(lit().join()==='Stop hurrying','hurrying: Stop hurrying is lit ('+lit().join()+')');t.ActionRing.close();t.setHurry(false);P.tx=null}
 // ---- a phone on its side (844 x 390): every button on the screen, the lit one too
 reset();t.setByRoad(true);{const scr=document.getElementById('screen'),css=scr.style.cssText;scr.style.cssText+=';width:844px;height:390px';
  const bad=[];for(const [fx,fy] of [[.5,.5],[.04,.06],[.96,.94]]){const r=scr.getBoundingClientRect(),cx=r.left+r.width*fx,cy=r.top+r.height*fy;t.ringOpen(cx,cy,P.x+40,P.y+20);
   for(const b of document.querySelectorAll('.aring .ar-btn')){const q=b.getBoundingClientRect(),l=b.querySelector('span').getBoundingClientRect();if(q.left<r.left-.5||q.right>r.right+.5||q.top<r.top-.5||l.bottom>r.bottom+.5)bad.push(b.textContent+'@'+fx)}
   if(!document.querySelector('.aring .ar-btn.on'))bad.push('none lit @'+fx);t.ActionRing.close()}
  scr.style.cssText=css;ok(!bad.length,'at 844 x 390 the ring, held in the middle or by a corner, keeps every button and its name on the screen, By road lit'+(bad.length?': '+bad.join(', '):''))}
 t.setByRoad(false)
 // ---- a move before it opens: no ring
 reset();{const wx=P.x+60,p=cl(wx,P.y+20);down(p);move({clientX:p.clientX+30,clientY:p.clientY});await held();ok(!ring()&&P.tx==null,'a move before it opens calls it off, travelling nowhere yet');up(p);ok(P.tx!=null&&Math.abs(P.tx-wx)<2,'and letting go travels to where it was pressed')}
 // ---- a right-click on the map travels at once, as ever (it has no hold)
 reset();{const wx=P.x+60,p=cl(wx,P.y+20);down(p,{button:2});ok(P.tx!=null&&Math.abs(P.tx-wx)<2,'a right-click travels at once');up(p,{button:2});await held();ok(!ring(),'and opens no ring')}
 // ---- a short click on a holding beside you meets it as it is let go
 reset();{const h=t.TOWNS.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];Kit.goTo(h.x,h.y+12);G.lastTown=h;t.drawWorld();const p=cl(h.x,h.y);down(p);const m0=G.mode;up(p);
  ok(m0==='world'&&G.mode!=='world','a click on a holding beside you: nothing on the press, its window as it is let go ('+m0+' then '+G.mode+')');if(G.mode==='town')t.act('leave');else t.hidePanel();G.mode='world';G.modal=false;G.lastTown=null}
 // ---- let go first, then tap one
 reset();{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);ok(!!ring(),'let go on the spot: the ring stays');btn('Make camp').el.click();ok(!ring()&&!!P.camp,'then tap Make camp: your band makes camp')}
 // ---- in camp: Break camp; with liquor: Drink liquor; by water: Fill waterskins
 {const p=cl(P.x+60,P.y+20);down(p);await held();ok(labels()[0]==='Break camp'&&!labels().includes('Make camp')&&lit().join()==='Break camp','in camp it offers Break camp, lit ('+labels().join(', ')+')');
  t.ActionRing.close();P.camp=null;up(p)}
 reset();bag({liquor:5});{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);ok(labels().includes('Drink liquor')&&!labels().includes('Fill waterskins'),'carrying liquor: Drink liquor; far from water, no Fill waterskins');
  btn('Drink liquor').el.click();ok(t.BAND.liquor===true,'Drink liquor: your band drinks its liquor first');down(p);await held();up(p);ok(lit().join()==='Water first','and the ring lights Water first while it does ('+lit().join()+')');t.ActionRing.close();t.BAND.liquor=false}
 {const h=t.TOWNS[0];Kit.goTo(h.x,h.y+20);G.lastTown=h;t.drawWorld();const p=cl(P.x+30,P.y+10);down(p);await held();up(p);const none=labels().includes('No empty waterskins')&&!labels().includes('Fill waterskins');t.ActionRing.close();
  bag({skin_empty:20});down(p);await held();up(p);ok(none&&labels().includes('Fill waterskins'),'by a holding’s well (within '+t.SUPPLY.fill.well+' tiles): Fill waterskins; with no empty waterskins it says so ("No empty waterskins")');
  bag({skin_empty:20});t.SKINS.reset(false);btn('Fill waterskins').el.click();const on=!!t.SKINS.on,w0=t.goodN('water');t.Clock.advance(t.SKINS.on?t.SKINS.on.h*1.01*t.DAY/24:0);t.SKINS.frame(0);
  ok(on&&w0===0&&t.goodN('water')>0,'and it fills them over game time ('+w0+' water at once, '+t.goodN('water')+' once its time has passed)');
  bag({skin_empty:20});t.SKINS.reset(false);t.fillSkins();down(p);await held();up(p);ok(labels().includes('Fill waterskins')&&lit().includes('Fill waterskins'),'while they fill, it is lit ('+lit().join(', ')+')');t.ActionRing.close();t.SKINS.reset(false);G.lastTown=null;
  Kit.goTo(h.x,h.y-3*16);t.drawWorld();const q=cl(P.x+30,P.y+10);down(q);await held();up(q);ok(!labels().some(l=>/waterskins/.test(l)),'3 tiles off the holding: no Fill waterskins');t.ActionRing.close()}
 // ---- closing it: Esc, a right-click, a tap outside, travelling nowhere
 reset();{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);Kit.key('Escape','Escape');ok(!ring()&&P.tx==null&&G.mode==='world','Esc closes it');
  down(p);await held();up(p);const q=cl(P.x-80,P.y-30);down(q,{button:2});up(q,{button:2});ok(!ring()&&P.tx==null,'a right-click closes it and travels nowhere');
  down(p);await held();up(p);down(q);up(q);ok(!ring()&&P.tx==null,'a tap outside closes it and travels nowhere')}
 // ---- on something: Look; not Travel here
 reset();{const h=t.TOWNS.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];Kit.goTo(h.x-90,h.y);t.drawWorld();const p=cl(h.x,h.y);
  ok(t.pickAt(h.x,h.y)===h,'(a holding answers where it is pressed)');down(p);await held();up(p);ok(labels().includes('Look')&&!labels().includes('Travel here'),'held on a holding: Look, no Travel here ('+labels().join(', ')+')');
  btn('Look').el.click();const tip=document.getElementById('tip');ok(!tip.hidden&&tip.classList.contains('hold')&&tip.textContent.includes(h.name),'Look shows its card ('+tip.textContent.slice(0,40)+')');t.hideTip();P.tx=null;G.chase=null}
 // ---- a short click on a band: its own ring (Attack, Follow, Look), no chase yet; held on it: the map's ring, with Follow
 reset();{const b=t.asParty({x:P.x+60,y:P.y+10,n:4,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(4,false,'bandits');t.bandits.push(b);t.drawWorld();const p=cl(b.x,b.y-4);
  down(p);up(p);ok(labels().join()==='Attack,Follow,Look'&&!G.chase&&P.tx==null,'a short click on a band: its ring at it ('+labels().join(', ')+'), no chase yet');t.ActionRing.close();
  down(p);await held();up(p);ok(labels().includes('Follow')&&labels().includes('Look')&&!labels().includes('Attack'),'held on it: the map\'s ring, with Follow ('+labels().join(', ')+')');t.ActionRing.close();t.bandits.length=0}
 // ---- a finger: a long press opens it
 reset();{const p=cl(P.x+60,P.y+20),f=(type,q)=>(type==='pointerdown'?cv:window).dispatchEvent(new PointerEvent(type,{...q,pointerType:'touch',pointerId:7,isPrimary:true,bubbles:true}));
  f('pointerdown',p);ok(P.tx==null,'a finger down travels nowhere yet');t.touchTick(performance.now()+R.hold+20);ok(!!ring()&&labels().includes('Make camp'),'a long press opens the ring');
  f('pointerup',p);ok(!!ring()&&P.tx==null,'lifted on the spot: it stays, travelling nowhere');btn('Travel here').el.click();ok(!ring()&&P.tx!=null,'a tap on Travel here travels')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{T.ActionRing.close()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
