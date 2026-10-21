'use strict';
// The action ring (doc/SUPPLY_DESIGN.md §7a, ui/ring.js): the left button held still on the map opens a ring of the actions that
// apply there; a short click still travels; a move before it opens calls it off; let go over a button picks it, or let go first
// and tap one; Esc, a right-click or a tap outside closes it, travelling nowhere. Only what applies: Make camp or Break camp,
// Travel here (fast) on the ground, Fill waterskins by water, Drink liquor with liquor, Look on something. A finger's long press
// opens it too, and its Look shows the card.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
try{
 const t=T,G=t.G,P=t.P,ev=s=>(0,eval)(s),cv=t.cv,R=t.RING;
 Kit.begin('soldier',4242);Kit.clear();Kit.world();W0();
 function W0(){t.W.folk=[];t.W.patrols=[];t.W.caravans=[];t.W.refugees=[];t.W.critters=[]}
 const spot=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&t.climAt(x,y)==='grass'&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<200)&&!t.nearWater(x,y,5))return [x,y]}})();
 const bag=g=>{for(const k of ['water','ale','liquor'])t.goodTake(k,1e9);for(const k in g)t.playerInventory.add('good',k,g[k])};
 const reset=()=>{t.ActionRing.close();t.hideTip();Kit.world();Kit.goTo(spot[0],spot[1]);ev('BAND=freshBand()');G.encCool=99;G.speed=1;G.chase=null;P.tx=null;t.bandits.length=0;W0();t.drawWorld()};
 // (client points of a world point; a pointer event on the canvas, or at a point of the window)
 const cl=(wx,wy)=>{const r=cv.getBoundingClientRect();return{clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH}};
 const down=(p,more)=>cv.dispatchEvent(new PointerEvent('pointerdown',{...p,pointerType:'mouse',button:0,pointerId:1,bubbles:true,...more}));
 const up=(p,more)=>window.dispatchEvent(new PointerEvent('pointerup',{...p,pointerType:'mouse',button:0,pointerId:1,bubbles:true,...more}));
 const move=p=>cv.dispatchEvent(new PointerEvent('pointermove',{...p,pointerType:'mouse',pointerId:1,bubbles:true}));
 const ring=()=>t.ActionRing.now,labels=()=>ring()?ring().items.map(i=>i.label):[];
 const btn=l=>{const b=[...document.querySelectorAll('.aring .ar-btn')].find(x=>x.textContent===l);if(!b)return null;const r=b.getBoundingClientRect();return{el:b,clientX:r.left+r.width/2,clientY:r.top+r.height/2}};
 const held=async()=>wait(R.hold+80);
 // ---- a short click travels, as ever; no ring
 reset();{const p=cl(P.x+60,P.y+20);down(p);up(p);await held();ok(P.tx!=null&&!ring(),'a short click travels, and no ring opens')}
 // ---- held still: the ring, the travel put back
 reset();{const wx=P.x+60,p=cl(wx,P.y+20);down(p);ok(P.tx!=null,'(the press travels at once, as a click)');await held();
  ok(!!ring()&&P.tx==null&&document.querySelector('.aring'),'held still '+R.hold+' ms: the ring opens, and the travel is put back');
  ok(labels().join()==='Make camp,Travel here,Travel here fast','on bare ground: '+labels().join(', '));
  const b=btn('Travel here');up(b);ok(!ring()&&P.tx!=null&&Math.abs(P.tx-wx)<2,'let go over Travel here: you travel there, the ring closed ('+(b&&b.el.textContent)+', '+P.tx+' for '+wx+')')}
 // ---- a move before it opens: no ring
 reset();{const p=cl(P.x+60,P.y+20);down(p);move({clientX:p.clientX+30,clientY:p.clientY});await held();ok(!ring(),'a move before it opens calls it off');up(p)}
 // ---- let go first, then tap one
 reset();{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);ok(!!ring(),'let go on the spot: the ring stays');btn('Make camp').el.click();ok(!ring()&&!!P.camp,'then tap Make camp: your band makes camp')}
 // ---- in camp: Break camp; with liquor: Drink liquor; by water: Fill waterskins
 {const p=cl(P.x+60,P.y+20);down(p);await held();ok(labels()[0]==='Break camp'&&!labels().includes('Make camp'),'in camp it offers Break camp ('+labels().join(', ')+')');
  t.ActionRing.close();P.camp=null;up(p)}
 reset();bag({liquor:5});{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);ok(labels().includes('Drink liquor')&&!labels().includes('Fill waterskins'),'carrying liquor: Drink liquor; far from water, no Fill waterskins');
  btn('Drink liquor').el.click();ok(t.BAND.liquor===true,'Drink liquor: your band drinks its liquor first');t.BAND.liquor=false}
 {const h=t.TOWNS[0];Kit.goTo(h.x,h.y+30);t.drawWorld();const p=cl(P.x+30,P.y+10);down(p);await held();up(p);ok(labels().includes('Fill waterskins'),'by a holding’s well: Fill waterskins');
  bag({});btn('Fill waterskins').el.click();ok(t.goodN('water')>0,'and it fills them ('+t.goodN('water')+' water)')}
 // ---- closing it: Esc, a right-click, a tap outside, travelling nowhere
 reset();{const p=cl(P.x+60,P.y+20);down(p);await held();up(p);Kit.key('Escape','Escape');ok(!ring()&&P.tx==null&&G.mode==='world','Esc closes it');
  down(p);await held();up(p);const q=cl(P.x-80,P.y-30);down(q,{button:2});up(q,{button:2});ok(!ring()&&P.tx==null,'a right-click closes it and travels nowhere');
  down(p);await held();up(p);down(q);up(q);ok(!ring()&&P.tx==null,'a tap outside closes it and travels nowhere')}
 // ---- on something: Look; not Travel here
 reset();{const h=t.TOWNS.slice().sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];Kit.goTo(h.x-90,h.y);t.drawWorld();const p=cl(h.x,h.y);
  ok(t.pickAt(h.x,h.y)===h,'(a holding answers where it is pressed)');down(p);await held();up(p);ok(labels().includes('Look')&&!labels().includes('Travel here'),'held on a holding: Look, no Travel here ('+labels().join(', ')+')');
  btn('Look').el.click();const tip=document.getElementById('tip');ok(!tip.hidden&&tip.classList.contains('hold')&&tip.textContent.includes(h.name),'Look shows its card ('+tip.textContent.slice(0,40)+')');t.hideTip();P.tx=null;G.chase=null}
 // ---- a finger: a long press opens it
 reset();{const p=cl(P.x+60,P.y+20),f=(type,q)=>(type==='pointerdown'?cv:window).dispatchEvent(new PointerEvent(type,{...q,pointerType:'touch',pointerId:7,isPrimary:true,bubbles:true}));
  f('pointerdown',p);ok(P.tx==null,'a finger down travels nowhere yet');t.touchTick(performance.now()+R.hold+20);ok(!!ring()&&labels().includes('Make camp'),'a long press opens the ring');
  f('pointerup',p);ok(!!ring()&&P.tx==null,'lifted on the spot: it stays, travelling nowhere');btn('Travel here').el.click();ok(!ring()&&P.tx!=null,'a tap on Travel here travels')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{T.ActionRing.close()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
