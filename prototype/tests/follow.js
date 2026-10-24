'use strict';
// Follow (world.js FOLLOW, followStart, followStep, followWatch; the owner, 2026-10-23): a click on another party opens its ring
// (ui/input.js partyRing: Approach, Follow, Look; Esc or a press elsewhere closes it doing nothing; a double click or a double tap
// approaches at once, as one click did before); the hold ring on a party has Follow too. Following, your band trails a lord
// marching home at about FOLLOW.trail tiles, its goal that far behind him on his way, never closing to meet him; the ring then
// shows Stop following, lit; the day bar a Following tag; the way's footprints lead to him (no arrow). It ends: out of sight,
// into a holding, gone; any other order (a click, Travel here, making camp), a meeting or a battle; Stop following. Following a
// band (hostile) is allowed. Never saved.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,F=t.FOLLOW,TL=t.TILE,cv=t.cv,CH=t.CHEAT,sp0=CH.speed,msgs=n=>G.msgs.slice(n).map(q=>q.m).join(' ');
 Kit.begin('soldier',4242);Kit.clear();Kit.world({encCool:1e9});t.setSpeed(1);P.fac=null;P.hostile={};P.troops={hum_levy:2};P.bsta=100;CH.speed=2;
 // (a lord of a realm with two holdings far apart, at the gate of the one, marching home to the other; you three tiles behind him)
 const lord=()=>{for(const L of W.lords){if(L.dead)continue;const fs=t.TOWNS.filter(h=>h.owner===L.fac);for(const a of fs)for(const b of fs)if(a!==b&&Math.hypot(a.x-b.x,a.y-b.y)>60*TL&&t.Router.reach(a,b)){
   const s=t.gateSpot(a);Object.assign(L,{x:s.x,y:s.y,inside:null,fight:null,state:'home',tgt:b.name,cool:0});const d=Math.hypot(b.x-s.x,b.y-s.y);
   let px=s.x-(b.x-s.x)/d*48,py=s.y-(b.y-s.y)/d*48;if(!t.passable(t.terrAt(px,py))){px=s.x;py=s.y+40}Kit.goTo(px,py);G.chase=null;P.tx=null;return L}}return null};
 const ring=()=>t.ActionRing.now,labels=()=>ring()?ring().items.map(i=>i.label).join():'none';
 // (pointer events on the canvas at a world point)
 const cl=(wx,wy)=>{const r=cv.getBoundingClientRect();return{clientX:r.left+(wx-G.cam.x)*r.width/t.VW,clientY:r.top+(wy-G.cam.y)*r.height/t.VH}};
 const press=(wx,wy,kind)=>{t.drawWorld();const e={...cl(wx,wy),pointerType:kind||'mouse',pointerId:kind==='touch'?7:1,isPrimary:true,button:0,bubbles:true,cancelable:true};
  cv.dispatchEvent(new PointerEvent('pointerdown',e));window.dispatchEvent(new PointerEvent('pointerup',e))};
 try{
  const L=lord();if(!L){ok(false,'no lord with two holdings far apart');return}
  // ---- a click on him: his ring, at him; Esc closes it; a press elsewhere closes it; a double click approaches
  {press(L.x,L.y-4);const l1=labels(),r=ring()&&ring().el.getBoundingClientRect(),c=cl(L.x,L.y-6),at=r&&Math.hypot(r.left-c.clientX,r.top-c.clientY);
   ok(l1==='Meet,Follow,Look'&&G.chase==null&&P.tx==null&&at<2,'a click on a lord (not hostile): his ring opens at him ('+l1+'), nothing done yet');
   Kit.key('Escape','Escape');ok(!ring()&&G.chase==null&&P.tx==null&&!G.follow,'Esc closes it, doing nothing');
   press(L.x,L.y-4);press(L.x+60,L.y+60);ok(!ring()&&G.chase==null&&P.tx==null,'a press elsewhere closes it, doing nothing (no travel)');
   // (a press elsewhere soon after: still closes only)
   press(L.x,L.y-4);press(L.x,L.y-4);ok(!ring()&&G.chase===L&&P.tx===L.x,'a double click on him approaches at once: today\'s chase');G.chase=null;P.tx=null;
   press(L.x,L.y-4);ring().pick(0);ok(!ring()&&G.chase===L,'its Meet is today\'s chase too');G.chase=null;P.tx=null;
   press(L.x,L.y-4,'touch');const lt=labels();press(L.x,L.y-4,'touch');ok(lt==='Meet,Follow,Look'&&!ring()&&G.chase===L,'a tap opens it too ('+lt+'), a double tap approaches');G.chase=null;P.tx=null;
   const h=t.mapRingItems(L.x,L.y,L,0,0).map(i=>i.label);ok(h.includes('Follow')&&!h.includes('Meet'),'the hold ring on him has Follow, as it had the rest ('+h.join(', ')+')');
   const g=t.mapRingItems(P.x+40,P.y,null,0,0).map(i=>i.label);ok(!g.includes('Follow')&&!g.includes('Stop following'),'on the ground, not following: neither')}
  // ---- Follow: he marches home, you trail him
  {press(L.x,L.y-4);const n0=G.msgs.length,b=[...document.querySelectorAll('.aring .ar-btn')].find(x=>x.textContent==='Follow');b.click();
   ok(G.follow&&G.follow.o===L&&!G.chase&&msgs(n0).includes('You follow '+t.lordName(L)+' at a distance'),'Follow: your band follows him ('+msgs(n0)+')');
   const ds=[],gs=[];let mode=G.mode,met=false;for(let f=0;f<700&&G.follow;f++){t.updateWorld(.05);if(G.mode!=='world'){mode=G.mode;met=true;break}if(f>=80){ds.push(Math.hypot(P.x-L.x,P.y-L.y));if(P.tx!=null)gs.push(Math.hypot(P.tx-L.x,P.ty-L.y))}}
   const srt=a=>[...a].sort((x,y)=>x-y),med=a=>srt(a)[a.length>>1],T=F.trail*TL;
   ok(!met&&G.follow&&ds.length>=600&&Math.min(...ds)>=F.near*TL-4&&Math.abs(med(ds)-T)<=10,'over '+ds.length+' moments he marches on and you trail him, never meeting him: '+Math.min(...ds).toFixed(1)+' to '+Math.max(...ds).toFixed(1)+' px apart, '+med(ds).toFixed(1)+' most ('+F.trail+' tiles: '+T+' px)'+(met?' (met: '+mode+')':''));
   ok(gs.length>500&&Math.abs(med(gs)-T)<=4&&Math.max(...gs)<=T+1,'each moment you make for a point '+T+' px behind him on his way ('+med(gs).toFixed(1)+' px from him most, at most '+Math.max(...gs).toFixed(1)+')');
   t.frame();if(t.WUI.way)t.WUI.way.t0-=2000;t.frame();const W2=t.WUI;ok(W2.tgt&&W2.tgt.o===L&&W2.tgt.f&&W2.way&&Math.hypot(W2.way.gx-L.x,W2.way.gy-L.y)<6&&W2.dots.length>0,'the footprints lead to him ('+W2.dots.length/3+' prints), his ring round him, no arrow');
   t.updateHUD(true);const pill=document.querySelector('#wday .wfollow');ok(pill&&pill.textContent==='Following '+t.lordName(L)&&/Stop following/.test(pill.title),'the day bar: '+(pill&&pill.textContent));
   const it=t.mapRingItems(P.x+30,P.y,null,0,0).find(i=>i.label==='Stop following'),il=t.mapRingItems(L.x,L.y,L,0,0).find(i=>i.label==='Stop following'),pr=t.partyRingItems(L,0,0).map(i=>i.label+(i.active?'*':''));
   ok(it&&it.active&&il&&il.active&&pr.join()==='Meet,Stop following*,Look','the ring shows Stop following, lit (on the ground, on him; his click ring: '+pr.join(', ')+')');
   t.ringOpen(200,200,P.x+30,P.y);const lit=[...document.querySelectorAll('.aring .ar-btn.on')].map(b=>b.textContent);t.ActionRing.close();ok(lit.join()==='Stop following','lit in the ring as the other modes are ('+lit.join()+')');
   const n1=G.msgs.length;it.run();t.updateHUD(true);ok(!G.follow&&P.tx==null&&!document.querySelector('#wday .wfollow')&&/You stop following/.test(msgs(n1)),'Stop following: it ends, your band stops, the tag gone')}
  // ---- not saved
  {t.followStart(L);G.mode='world';t.saveGame(true,'7');const s=localStorage.getItem(t.slotKey('7'));ok(G.follow&&s&&!/"follow"/.test(s),'a save keeps no Follow (an order, as a chase)');
   t.loadGame('7');ok(!G.follow,'and a load starts without one');Kit.world({encCool:1e9})}
  // ---- the ends
  // (open ground away from the holdings: you there, him 3 tiles east, marching home; following him)
  const sp=(()=>{for(let ty=8;ty<t.MH-8;ty++)for(let tx=8;tx<t.MW-8;tx++){const x=(tx+.5)*TL,y=(ty+.5)*TL;if(t.tAt(tx,ty)===t.T_OPEN&&t.tAt(tx+3,ty)===t.T_OPEN&&!t.TOWNS.some(h=>Math.hypot(h.x-x,h.y-y)<200)&&t.campGround(x,y))return [x,y]}})();
  const again=()=>{const M=lord();Kit.goTo(sp[0],sp[1]);M.x=sp[0]+48;M.y=sp[1];t.followStart(M);t.updateWorld(.05);return M};
  {const M=again(),n=G.msgs.length;M.x+=4000;t.updateWorld(.05);ok(!G.follow&&P.tx==null&&msgs(n).includes('You lose sight of '+t.lordName(M)),'he goes out of sight: '+msgs(n))}
  {const M=again(),n=G.msgs.length,h=t.townBy(M.tgt);M.enter(h);t.updateWorld(.05);ok(!G.follow&&P.tx==null&&msgs(n).includes(t.lordName(M)+' rides into '+h.name),'he goes into a holding: '+msgs(n))}
  {const M=again(),n=G.msgs.length,i=W.lords.indexOf(M);W.lords.splice(i,1);t.updateWorld(.05);W.lords.splice(i,0,M);ok(!G.follow&&msgs(n).includes(t.lordName(M)+' is gone'),'he is gone (beaten): '+msgs(n))}
  {again();const n=G.msgs.length;t.worldMove(P.x+50,P.y+20);ok(!G.follow&&P.tx!=null&&Math.abs(P.tx-P.x-50)<60&&msgs(n)==='','another order (a click on the ground: Travel) ends it quietly, the new order stands')}
  {again();const n=G.msgs.length;t.worldGo(P.x+50,P.y+20);ok(!G.follow,'a click on the ground ends it')}
  {again();const why=t.campWhy();t.makeCamp();t.updateWorld(.05);ok(!why&&!G.follow&&(P.camp||G.pitch),'making camp ends it'+(why?' ('+why+')':''))}
  P.camp=null;G.pitch=null;
  {const M=again();t.worldApproach(M);ok(!G.follow&&G.chase===M,'Approach on his ring ends it, and chases him')}G.chase=null;
  {again();G.mode='dialog';t.fastWatch();ok(!G.follow,'a meeting, an encounter or a battle ends it (the map no longer yours)');Kit.world({encCool:1e9})}
  // ---- a band: hostile, still followed
  {Kit.clear();const s=t.gateSpot(t.TOWNS[0]),b=t.asParty({x:P.x+60,y:P.y,n:4,cool:5,t:0,a:0,kind:'bandits',idle:true});b.troops=t.makeEnemies(4,false,'bandits');t.bandits.push(b);t.drawWorld();
   const pr=t.partyRingItems(b,0,0).map(i=>i.label);ok(pr.join()==='Attack,Follow,Look'&&t.followStart(b)&&G.follow.o===b,'a band: its ring '+pr.join(', ')+'; you may follow it (shadowing; what it does about you is its own mind\'s)');t.followStop();t.bandits.length=0}
 }finally{CH.speed=sp0;t.ActionRing.close();if(G.follow)t.followStop()}
});
