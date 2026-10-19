'use strict';
// Field work (folk.js FIELD): as you come near, each estate has 1 to its full crew (seeded by the estate and the day); inside at
// night and dawn; in the morning and at midday each worker is out on the estate's own ground or inside, by his id and the day
// (FIELD.out of them out), working a round of their trade within FIELD.reach of it; the delivery after it as before; a field worker is clicked on the map to talk;
// they go in from bandits, fear and a siege and come out again once it is safe; the estate's living area lists only those
// inside; the ground's scene keeps no shift while they move (as tests/mapshake.js).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,F=t.FIELD,TL=t.TILE;try{localStorage.clear()}catch(e){}
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)];
 t.act('begin','soldier');G.quietEvents=true;P.fac=null;P.hostile={};
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.wk=null;G.wkFrom=null;G.est=null;P.tx=null;G.chase=null;P.siege=null};
 const calm=()=>{t.bandits.length=0;W.lords.forEach(l=>{if(l.state==='siege')l.state='march'});t.TOWNS.forEach(x=>{x.fear=0;x.lost={};delete x.mem})};
 // (you near a holding at a share of the day; its workers and its neighbours' made afresh)
 const near=(tw,clock)=>{world();W.folk=[];t.FOLK_SEEN.clear();P.x=tw.x;P.y=tw.y+30;G.clock=t.DAY*clock;t.updateFolk(.05)};
 const most=(tw,k)=>Math.min(3,t.bldLv(tw,k)+1)-t.lostHands(tw,k);
 const ash=t.townBy('Ashford');calm();
 // ---- the start: 1 to the full crew at each estate, seeded by the estate and the day
 {let n=0,bad=[],less=0,full=0;const tws=t.TOWNS.filter(x=>x.bld&&!t.ruined(x)).slice(0,6);
  for(let day=1;day<=12;day++){G.day=day;for(const tw of tws){near(tw,.02);
    for(const k in t.bldSpots(tw)){if(!t.bldLv(tw,k)||!t.ESTATES[k].work)continue;const c=W.folk.filter(f=>f.home===tw.name&&f.k===k).length,m=most(tw,k);n++;
      if(c<1||c>m)bad.push(tw.name+' '+k+' '+c+'/'+m);if(m>1){if(c<m)less++;else full++}}}}
  ok(n>40&&!bad.length&&less>0&&full>0,'as you come near, each estate has 1 to its full crew ('+n+' estates over 12 days: '+less+' short of a full crew, '+full+' full'+(bad.length?'; wrong: '+bad.slice(0,4).join(', '):'')+')');
  G.day=5;near(ash,.02);const a=W.folk.map(f=>f.id).join();near(ash,.02);ok(W.folk.map(f=>f.id.replace(/\|\d+$/,'')).join()===a.split(',').map(s=>s.replace(/\|\d+$/,'')).join(),'and the same estate on the same day, the same crew')}
 // ---- the day: inside at night and dawn; out or inside in the morning and at midday; inside again by the evening
 {G.day=3;near(ash,.2);for(let i=0;i<5;i++)t.updateFolk(.05);const day=W.folk.filter(f=>f.home==='Ashford');
  ok(day.length&&day.every(f=>f.st==='in'||f.st==='field')&&day.every(f=>(f.st==='field')===t.fieldOut(f)),'in the morning each is out on his estate\'s ground or inside, as his day says ('+day.map(f=>f.k+' '+f.st).join(', ')+')');
  for(const c of [.8,.95,.03]){G.clock=t.DAY*c;for(let i=0;i<400;i++)t.updateFolk(.05);const a=W.folk.filter(f=>f.home==='Ashford');
   ok(a.length&&a.every(f=>f.st==='in'),'at '+t.timeOfDay().toLowerCase()+' ('+c+') all are inside ('+a.length+')')}}
 // about FIELD.out of them out by day, seeded by worker and day
 {let out=0,all=0;for(let day=1;day<=60;day++){G.day=day;near(ash,.25);for(const f of W.folk){all++;if(f.st==='field')out++}}
  const r=out/all;ok(F.out===.6&&all>300&&Math.abs(r-F.out)<.08,'by day '+Math.round(r*100)+'% of '+all+' workers are out (60 days near Ashford; FIELD.out '+F.out+')');
  const f={id:'Ashford|farm|1'};G.day=9;const a=t.fieldOut(f);G.day=9;ok(t.fieldOut(f)===a,'his day out or in is seeded: the same each time it is asked');
  let s=0;for(let i=0;i<4000;i++){G.day=i%97;if(t.fieldOut({id:'X|farm|'+i}))s++}ok(Math.abs(s/4000-F.out)<.03,'over many workers and days, '+(s/40).toFixed(1)+'% out')}
 // ---- their rounds: never beyond FIELD.reach of their estate, on ground they can walk (a fisher on his pier), a herder never in
 // the pens; a woodcutter to a tree in the woods and back to the log yard with the log, a miner to the rock, a fisher to the pier's end
 const onPier=f=>{const tw=t.townBy(f.home),pr=f.k==='port'&&t.pierOf(tw);if(!pr)return false;const len=10+t.bldLv(tw,'port')*6,v=pr.dir==='n'||pr.dir==='s',sg=pr.dir==='s'||pr.dir==='e'?1:-1,a=(v?f.y-pr.y:f.x-pr.x)*sg,b=v?f.x-pr.x:f.y-pr.y;return a>=-.01&&a<=len&&b>=-3&&b<=2};
 const onLot=f=>{const l=t.lotAt(t.townBy(f.home),f.k),tx=Math.floor(f.x/TL),ty=Math.floor(f.y/TL);return tx>=l.x&&tx<l.x+l.n&&ty>=l.y&&ty<l.y+l.n};
 {F.out=1;const kinds={},bad=[],far=[],pens=[],S=new Map();let steps=0,moved=0,maxd=0,woods=0,logs=0,rock=0,pierEnd=0;
  for(const tw of t.TOWNS.filter(x=>x.bld&&!t.ruined(x))){G.day=4;near(tw,.06);const sp=t.bldSpots(tw);
   for(let i=0;i<1500;i++){G.clock=t.DAY*Math.min(.5,.06+i*.0003);t.updateFolk(.05);
    for(const f of W.folk){if(f.home!==tw.name||f.st!=='field')continue;steps++;kinds[f.k]=(kinds[f.k]||0)+1;const tx=Math.floor(f.x/TL),ty=Math.floor(f.y/TL),d=Math.hypot(f.x-sp[f.k].x,f.y-sp[f.k].y);maxd=Math.max(maxd,d);
     if(d>F.reach*TL&&far.length<4)far.push(tw.name+' '+f.k+' '+d.toFixed(1)+' px');
     if(!t.passable(t.tAt(tx,ty))&&!onPier(f)&&bad.length<4)bad.push(tw.name+' '+f.k+' at '+f.x.toFixed(1)+','+f.y.toFixed(1));
     if(f.k==='pasture'&&t.plotsAt(tw,'pasture',t.bldLv(tw,'pasture')).some(c=>f.x>c[0]*TL+1&&f.x<c[0]*TL+TL-1&&f.y>c[1]*TL+1&&f.y<c[1]*TL+TL-1)&&pens.length<4)pens.push(tw.name+' '+f.x.toFixed(1)+','+f.y.toFixed(1));
     const s=S.get(f)||{};S.set(f,s);if(s.x!=null&&(s.x!==f.x||s.y!==f.y))moved++;s.x=f.x;s.y=f.y;
     if(f.k==='lumber'&&!f.moving&&t.tAt(tx,ty)===t.T_FOREST&&!onLot(f))s.tree=1;if(f.k==='lumber'&&s.tree&&f.load)s.log=1;if(f.k==='lumber'&&s.log&&!f.moving&&onLot(f)&&!s.home){s.home=1;logs++}
     if(f.k==='lumber'&&s.tree&&!s.w){s.w=1;woods++}if((f.k==='mine'||f.k==='quarry')&&!f.moving&&t.rockAt(tx,ty)&&!onLot(f)&&!s.r){s.r=1;rock++}
     if(f.k==='port'&&!f.moving&&onPier(f)&&Math.hypot(f.x-t.pierOf(tw).x,f.y-t.pierOf(tw).y)>=8&&!s.p){s.p=1;pierEnd++}}}}
  F.out=.6;
  ok(steps>2000&&!far.length&&maxd<=F.reach*TL,'at work out of doors none goes beyond FIELD.reach ('+F.reach+' tiles) of his estate: '+steps+' worker-steps, the farthest '+maxd.toFixed(1)+' px ('+Object.entries(kinds).map(([k,n])=>k+' '+n).join(', ')+')'+(far.length?'; beyond: '+far.join('; '):''));
  ok(!bad.length,'and every step on ground one can walk, or a fisher\'s pier'+(bad.length?': '+bad.join('; '):''));
  ok(!pens.length&&kinds.pasture,'herders go round the pens, never in among the animals (inside a fence)'+(pens.length?': '+pens.join('; '):''));
  ok(woods>0&&logs>0,'woodcutters go to a tree in the woods near by ('+woods+') and carry the log back to the yard ('+logs+')');
  ok(rock>0&&pierEnd>0,'miners and quarrymen to the rock or hill near by ('+rock+'), fishers out along the pier ('+pierEnd+')');
  ok(moved>200&&['farm','pasture','lumber'].every(k=>kinds[k]),'and they move about their work ('+moved+' steps that moved)')}
 // ---- the delivery after the field hours, as before
 {F.out=1;G.day=6;near(ash,.3);let field=0,out=0,town=0;for(let i=0;i<5000;i++){G.clock=t.DAY*Math.min(.69,.3+i*.0001);t.updateFolk(.05);const a=W.folk.filter(f=>f.home==='Ashford');
   if(G.clock<t.DAY*F.to)field=Math.max(field,a.filter(f=>f.st==='field').length);out+=a.filter(f=>f.st==='out').length;town+=a.filter(f=>f.st==='town').length}
  for(let i=0;i<3000&&W.folk.some(f=>f.home==='Ashford'&&f.st!=='in');i++){G.clock=t.DAY*.75;t.updateFolk(.05)}F.out=.6;
  ok(field>0&&out>0&&town>0&&W.folk.filter(f=>f.home==='Ashford').every(f=>f.st==='in'&&f.done===G.day),'out in the fields by midday ('+field+'), in at the end of the field hours, then the delivery in the afternoon as before, and all inside by night')}
 // ---- danger: bandits near, the holding afraid, a siege: in they go, and out again once it is safe
 {F.out=1;G.day=7;near(ash,.2);for(let i=0;i<5;i++)t.updateFolk(.05);const ws=()=>W.folk.filter(f=>f.home==='Ashford'),fld=()=>ws().filter(f=>f.st==='field').length,n0=fld();
  const run=n=>{for(let i=0;i<n;i++)t.updateFolk(.05)};
  const f=ws().find(x=>x.st==='field'),b=t.asParty({x:f.x+20,y:f.y,n:3,kind:'bandits',list:['bandit','bandit','bandit'],t:0,a:0,idle:true,cool:9});t.bandits.push(b);
  const R=t.WORLD_SCALE.ai.folkBandit,hit=()=>ws().filter(x=>x.k===f.k);run(1);const fast=f.gin;run(600);
  ok(n0>0&&fast&&hit().every(x=>x.st==='in'||Math.hypot(b.x-x.x,b.y-x.y)>=R)&&f.st==='in','bandits come near the '+f.k+': its workers within '+R+' px hurry in ('+hit().map(x=>x.st).join(', ')+')');
  t.bandits.length=0;run(5);ok(f.st==='field','the bandits gone, out again');
  {const ms=W.monsters.splice(0),m=t.asMonster({id:'wolf',x:f.x+20,y:f.y,hx:f.x+20,hy:f.y,lv:1,n:3,t:0,a:0,cool:1e9});W.monsters.push(m);run(600);
   ok(f.st==='in','a beast near the '+f.k+': its workers go in too ('+f.st+')');W.monsters.length=0;W.monsters.push(...ms);run(5);ok(f.st==='field','the beast gone, out again')}
  ash.fear=G.day+2;run(600);ok(fld()===0,'the holding afraid of you: all go in ('+ws().length+')');ash.fear=0;run(5);ok(fld()===ws().length,'and out again once it is not ('+fld()+')');
  P.siege={town:'Ashford'};run(600);ok(fld()===0&&t.besieged(ash),'under siege: all inside');P.siege=null;run(5);ok(fld()===ws().length,'the siege over: out again');F.out=.6}
 // ---- met on the map: a click on a field worker beside you opens his talk; robbing him, a little of his product and a few coins
 {F.out=1;G.day=8;near(ash,.2);t.updateFolk(.05);const f=W.folk.find(x=>x.home==='Ashford'&&x.st==='field');P.x=f.x+6;P.y=f.y+2;f.wait=1e9;f.turn=0;
  ok(t.pickAt(f.x,f.y-4)===f,'a field worker is picked where he stands');
  t.drawWorld();const cv=q('canvas'),r=cv.getBoundingClientRect();cv.dispatchEvent(new PointerEvent('pointerdown',{clientX:r.left+(f.x-G.cam.x)*r.width/t.VW,clientY:r.top+(f.y-4-G.cam.y)*r.height/t.VH,pointerType:'mouse',bubbles:true}));
  ok(G.mode==='dialog'&&G.wk===f&&q('.rkact[data-act="wk-hire"]')&&q('.rkact[data-act="wk-ask"][data-arg="rob"]')&&q('.rkact[data-act="wk-ask"][data-arg="press"]')&&document.getElementById('panel').textContent.includes(t.cap1(t.an(f.job))+' of Ashford'),
    'clicking him opens his talk: Hire, Rob, Press-gang ('+f.name+', '+f.job+')');
  const st=f.st;f.st='in';const inn=t.robCarries(ash,f);f.st=st;ok(t.robLoot(f)===t.ROB.loot.in&&t.robCarries(ash,f)===inn,'robbing him: what one at work carries ('+inn+')');world();F.out=.6}
 // ---- the living area: only those inside, the rest at work outside
 {let hit=null;for(let day=1;day<=60&&!hit;day++){G.day=day;near(ash,.2);t.updateFolk(.05);for(const k of ['farm','pasture','smithy']){const ws=W.folk.filter(f=>f.home==='Ashford'&&f.k===k);if(ws.some(f=>f.st==='in')&&ws.some(f=>f.st==='field')){hit=k;break}}}
  if(!hit)ok(false,'(no estate of Ashford with workers both inside and out in 60 days)');else{const ws=W.folk.filter(f=>f.home==='Ashford'&&f.k===hit),inn=ws.filter(f=>f.st==='in'),out=ws.filter(f=>f.st==='field');
   world();t.estateMeet(t.estatePick(ash,hit));t.act('es-tab','folk');const ids=qa('.rwbody .rcard [data-act="es-folk"]').map(b=>b.dataset.arg);
   ok(ids.length===inn.length&&inn.every(f=>ids.includes(f.id))&&!out.some(f=>ids.includes(f.id))&&/at work outside/.test(q('.rwbody').textContent),'the '+t.ESTATE_AREAS[hit].folk+' lists only those inside ('+inn.length+' cards; '+out.length+' at work outside, met on the map)');world()}}
 // ---- drawn as movers: the ground's scene keeps no shift while they work (tests/mapshake.js), at scale 3
 {F.out=1;G.day=8;const ev=x=>(0,eval)(x);ev('VS=3');near(ash,.2);const fm=t.bldSpots(ash).farm;P.x=fm.x+10;P.y=fm.y+24;
  const pn=performance.now;let now=1e7;performance.now=()=>now;const pic=()=>{const m=t.MEM,d=m.getContext('2d').getImageData(0,0,m.width,Math.floor(m.height/3)).data;let h=0;for(let i=0;i<d.length;i+=16)h=(h*31+d[i])|0;return h};
  const ws=W.folk.filter(f=>f.home==='Ashford'&&f.st==='field');t.frame();const h0=pic(),x0=ws.map(f=>f.x+','+f.y).join();let moved=0,tf=0,tr=0;
  let mv=false;for(let i=0;i<90;i++){now+=16.7;t.updateFolk(.05);if(ws.map(f=>f.x+','+f.y).join()!==x0)mv=true;const m0=t.ctx.getTransform();t.frame();const T2=t.MEM.getContext('2d').getTransform(),m1=t.ctx.getTransform();if(T2.e||T2.f)tf++;if(m1.e!==m0.e||m1.f!==m0.f)tr++;if(i%10===9&&pic()!==h0)moved++}
  performance.now=pn;ev('VS=1');F.out=.6;
  ok(ws.length&&mv,'('+ws.length+' at work by Ashford\'s farm, moving)');
  ok(tf===0&&tr===0,'the ground\'s scene and the screen start every frame unshifted ('+tf+', '+tr+' frames carried a shift)');
  ok(moved===0,'standing by Ashford\'s fields at scale 3, the upper ground stays put for 90 frames ('+moved+' of 9 samples moved)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
