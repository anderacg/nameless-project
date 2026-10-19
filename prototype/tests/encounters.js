'use strict';
// Encounters on the road (world/encounters.js, doc/ENCOUNTERS_DESIGN.md phase 1): the pity timer (travel only, met resets it,
// passed by takes 25–50% off), at most 2 a day and no kind again within 5 days, placed past your sight on its own ground, each
// behaviour (approach, stay, flee, scene), their lifetimes and leaving when you are far, the traces, the highlights ("!", the
// glow, the call-out, the arrow at the screen's edge), a click opens the page, each of the 14 kinds' page, choices and outcomes
// (today's events'), the ambush hidden below Scouting 2 and springing as you pass, the save, the weather still instant, and
// nothing drawn leaking a shift into the ground's scene
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,ev=s=>(0,eval)(s);try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=false;
 const q=s=>document.querySelector(s),qa=s=>[...document.querySelectorAll(s)],panel=()=>document.getElementById('panel').innerHTML,txt=()=>(q('#panel')||{}).textContent||'';
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.road=null;G.chase=null;P.tx=null;G.encCool=0;G.paused=false};
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.fights=[];W.critters=[];W.road=null};
 const R=()=>t.roadSt(),D=k=>t.ROAD_ENC[k],r0=Math.random;
 const stub=(v,fn)=>{const k=Math.random;Math.random=typeof v==='function'?v:()=>v;try{return fn()}finally{Math.random=k}};
 // a place: open, walkable ground all round (12 tiles), a road through it, far from holdings and sites
 const far=(tx,ty)=>t.TOWNS.every(z=>Math.hypot(z.tx-tx,z.ty-ty)>10)&&W.sites.every(s=>Math.hypot(s.tx-tx,s.ty-ty)>4);
 const around=(tx,ty,r,f)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(!f(t.tAt(tx+i,ty+j)))return false;return true};
 let home=null;for(let ty=16;ty<t.MH-16&&!home;ty++)for(let tx=16;tx<t.MW-16&&!home;tx++)if(t.tAt(tx,ty)===t.T_ROAD&&far(tx,ty)&&around(tx,ty,4,x=>x===t.T_OPEN||x===t.T_ROAD)&&around(tx,ty,11,x=>t.passable(x))&&t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='grass')home={tx,ty,x:(tx+.5)*TILE,y:(ty+.5)*TILE};
 ok(!!home,'a test spot: a road over open grassland ('+(home&&home.tx+','+home.ty)+')');
 const at=(x,y)=>{world();clear();P.x=x;P.y=y;P.stay=null;t.reveal()};const goHome=()=>at(home.x,home.y);
 G.clock=t.DAY*.3;P.troops={hum_levy:6};P.gold=500;P.sk.scout.lv=0;goHome();const V=t.vis();
 const frames=(n,d=.05)=>{for(let i=0;i<n&&G.mode==='world';i++)t.updateRoad(d)};

 // ---- the pity timer: travel only
 {goHome();t.updateRoad(.05);ok(!W.road,'standing still: no timer kept, nothing saved');
  let want=0;stub(.999,()=>{for(let i=0;i<200;i++){P.x+=.6;t.updateRoad(.05);want+=.05/t.WORLD_PACE*24/t.DAY_SECONDS}});
  ok(W.road&&Math.abs(R().c-want)<1e-6&&R().c>0,'moving on the map, the timer counts the hours travelled ('+R().c.toFixed(3)+' h)');
  const c0=R().c;stub(.999,()=>{for(let i=0;i<50;i++)t.updateRoad(.05)});ok(R().c===c0,'standing still adds nothing');
  G.paused=true;P.tx=P.x+300;P.ty=P.y;stub(.999,()=>{for(let i=0;i<50;i++)t.updateWorld(.05)});ok(R().c===c0&&P.x<P.tx-290,'paused: nothing moves, nothing adds');G.paused=false;
  G.mode='town';stub(.999,()=>{for(let i=0;i<5;i++)t.updateRoad(.05)});ok(R().c===c0,'in a window or a town (no map time): nothing adds');world();
  G.quietEvents=true;stub(.999,()=>{for(let i=0;i<20;i++){P.x+=.6;t.updateRoad(.05)}});ok(R().c===c0,'quiet events (the tests’ switch): the timer holds, as the events do');G.quietEvents=false;
  // the chance: base + rate × hours, capped, by the land
  const S=t.ENC_SPAWN;goHome();R().c=10;const ch=t.roadChance();ok(Math.abs(ch-(S.base+S.rate*10)*S.land.road)<1e-9,'the hour’s chance: base + rate × hours, × the road ('+ch.toFixed(4)+')');R().c=1e6;ok(t.roadChance()===S.cap*S.land.road,'capped at '+S.cap+' (× '+S.land.road+' on a road)');
  // tuned: about one encounter in every one or two days of travel (a day = 24 hours on the road)
  {let sum=0,n=0;const s=t.seeded(42);for(let k=0;k<400;k++){let c=0,h=0;for(;;){h++;c++;const p=Math.min(S.cap,S.base+S.rate*c)*S.land.held;if(s()<p)break}sum+=h;n++}
   const avg=sum/n/24;ok(avg>=1&&avg<=2,'tuned: one comes after '+avg.toFixed(2)+' days of travel on average (on a holding’s land)')}
  // met: 0; passed by: −25–50%; never seen: kept
  R().c=20;R().on=[];const e=t.roadSpawn('traveller',P.x+30,P.y);t.roadMeet(e);ok(R().c===0&&G.mode==='road','met: the timer is back at 0');world();
  const cuts=[];for(let i=0;i<6;i++){goHome();R().c=20;const f=t.roadSpawn('traveller',P.x+30,P.y);f.seen=1;P.x+=V*1.6+80;t.updateRoad(.05);cuts.push(R().c)}
  ok(cuts.every(c=>c>=10-1e-9&&c<=15+1e-9)&&new Set(cuts.map(c=>c.toFixed(3))).size>1,'passed by (seen, left unmet): the timer falls by a quarter to a half ('+cuts.map(c=>c.toFixed(1)).join(', ')+' from 20)');
  goHome();R().c=20;t.roadSpawn('mine',P.x+30,P.y);P.x+=V*1.6+80;t.updateRoad(.05);ok(R().c===20,'one never seen leaves the timer as it was')}

 // ---- at most 2 a day; no kind again within 5 days; one at a time
 {goHome();const first0=s=>{let f=true;return()=>f?(f=false,0):s()};let n=0;const s=t.seeded(11);
  for(let i=0;i<6;i++){R().on=[];if(stub(first0(s),()=>t.roadRoll()))n++}
  ok(n===2&&R().n===2,'at most 2 a day ('+n+' of 6 sure rolls came)');
  G.day++;R().on=[];ok(!!stub(first0(s),()=>t.roadRoll()),'the next day, one comes again');
  R().n=0;ok(R().on.length===1&&!stub(first0(s),()=>t.roadRoll()),'none while one is about');
  const kinds=[],s1=t.seeded(100);for(let i=0;i<60;i++){R().on=[];R().n=0;R().cd={traveller:G.day-4};const e=stub(s1,()=>t.roadPick());if(e)kinds.push(e.k)}
  ok(kinds.length>40&&!kinds.includes('traveller'),'a kind not again within 5 days ('+kinds.length+' came, no wounded traveller 4 days after the last)');
  const k2=[],s2=t.seeded(300);for(let i=0;i<120;i++){R().on=[];R().n=0;R().cd={traveller:G.day-5};const e=stub(s2,()=>t.roadPick());if(e)k2.push(e.k)}
  ok(k2.includes('traveller'),'after 5 days it may come again ('+k2.filter(k=>k==='traveller').length+' of '+k2.length+')');R().on=[];R().cd={}}

 // ---- placement: past your sight by 40–120 px, ahead, on its own ground, never in a holding
 {const S=t.ENC_SPAWN,check=(on,m)=>{const ps=[],sd=t.seeded(500);for(let i=0;i<30;i++){const p=stub(sd,()=>t.roadSpot(on));if(p)ps.push(p)}
    const bad=ps.filter(([x,y])=>{const d=Math.hypot(x-P.x,y-P.y),tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);return d<t.vis()+S.near[0]-1e-6||d>t.vis()+S.near[1]+1e-6||!t.passable(t.tAt(tx,ty))||!t.ENC_ON[on](tx,ty)||t.occAt(tx,ty)||t.TOWNS.some(z=>Math.hypot(z.tx-tx,z.ty-ty)<S.hold)});
    ok(ps.length>0&&!bad.length,m+': '+ps.length+' of 30 placed, all '+S.near[0]+'–'+S.near[1]+' px past your sight on '+on+' ground'+(bad.length?' (bad: '+bad.length+')':''));return ps};
  goHome();check('road','by a road');P.tx=P.x+500;P.ty=P.y;const ps=check('wild','off the road');ok(ps.filter(([x])=>x>P.x).length>=ps.length*.7,'mostly ahead of the way you go ('+ps.filter(([x])=>x>P.x).length+' of '+ps.length+' east)');P.tx=null;
  const findT=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return[(tx+.5)*TILE,(ty+.5)*TILE];return null};
  {const w=findT((tx,ty)=>t.tAt(tx,ty)===t.T_FOREST&&around(tx,ty,2,x=>x===t.T_FOREST)&&far(tx,ty)&&t.climAt((tx+.5)*TILE,(ty+.5)*TILE)!=='frost');if(w){at(w[0],w[1]);check('wood','hunters by a wood')}else ok(false,'no forest to test')}
  {const h=findT((tx,ty)=>t.tAt(tx,ty)===t.T_HILL&&around(tx,ty,4,x=>x===t.T_HILL)&&far(tx,ty));if(h){at(h[0],h[1]);check('hill','the mine in the hills')}else ok(false,'no hills to test')}
  {const b=findT((tx,ty)=>t.climAt((tx+.5)*TILE,(ty+.5)*TILE)==='swamp'&&t.passable(t.tAt(tx,ty))&&far(tx,ty)&&around(tx,ty,9,x=>t.passable(x)));if(b){at(b[0],b[1]);check('bog','the wisps in a bog')}else ok(false,'no bog to test')}
  {const A=t.townBy('Ashford');at(A.x,A.y+40);const ps=[],sd=t.seeded(900);for(let i=0;i<40;i++){const p=stub(sd,()=>t.roadSpot('road'));if(p)ps.push(p)}
   ok(ps.every(([x,y])=>t.TOWNS.every(z=>Math.hypot(z.tx-Math.floor(x/TILE),z.ty-Math.floor(y/TILE))>=S.hold)),'never inside a holding (beside Ashford: '+ps.length+' placed, none within '+S.hold+' tiles of one)')}}

 // ---- behaviours
 {goHome();const e=t.roadSpawn('merchant',P.x+150,P.y),d0=e.fromYou();frames(20);ok(e.fromYou()<d0-5,'approach: the peddler walks to you ('+Math.round(d0)+' → '+Math.round(e.fromYou())+' px)');
  frames(2000);ok(G.mode==='road'&&G.road===e&&q('.rwin h2').textContent===D('merchant').n,'reaching you, he is met: his page opens');t.act('enc-leave');ok(G.mode==='world'&&e.beh==='leave','Leave: he goes on his way');
  const x1=e.fromYou();frames(40);ok(e.fromYou()>x1,'walking off');}
 {goHome();const S0=W.sites;W.sites=[];P.tx=P.x+2000;P.ty=P.y;const d=V+80,e=t.roadSpawn('merchant',P.x+Math.cos(.3)*d,P.y+Math.sin(.3)*d);for(let i=0;i<1500&&G.mode==='world'&&!e.gone;i++)t.updateWorld(.05);W.sites=S0;
  ok(G.mode==='road'&&G.road===e,'while you travel, one walking up meets you on your way (it hurries to where your ways cross)');world()}
 {goHome();const e=t.roadSpawn('traveller',P.x+60,P.y),x=e.x,y=e.y;frames(200);ok(e.x===x&&e.y===y&&!e.gone,'stay: the wounded traveller stays where he lies')}
 {goHome();const e=t.roadSpawn('wisps',P.x+40,P.y),d0=e.fromYou();frames(30);ok(e.fromYou()>d0+3,'flee: the lights drift away as you come ('+Math.round(d0)+' → '+Math.round(e.fromYou())+' px)')}
 {goHome();const e=t.roadSpawn('caravan',P.x+60,P.y),L=t.ENC_LIFE.scene;ok(e.end-e.t0>=L[0]&&e.end-e.t0<=L[1],'scene: the caravan fight is under way, '+(e.end-e.t0).toFixed(1)+' h to run');
  G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;frames(1);ok(e.gone&&R().on.some(x=>x.trace&&x.k==='wreck'),'and ends by itself: plundered, a burnt wagon left');G.clock=t.DAY*.3}
 // lifetimes by behaviour, and leaving when far
 {const bad=[];for(const k of Object.keys(t.ROAD_ENC)){goHome();for(let i=0;i<5;i++){R().on=[];const e=t.roadSpawn(k,P.x+30,P.y),L=t.ENC_LIFE[e.beh==='flee'?'flee':t.ROAD_ENC[k].beh],h=e.end-e.t0;if(h<L[0]-1e-9||h>L[1]+1e-9)bad.push(k+' '+h.toFixed(2))}}
  const L=t.ENC_LIFE;ok(!bad.length,'lifetimes by behaviour: approach '+L.approach.join('–')+' h, stay '+L.stay.join('–')+' h, flee at most '+L.flee[1]+' h, scene '+L.scene.join('–')+' h'+(bad.length?': '+bad.join(', '):''));
  goHome();const a=t.roadSpawn('bard',P.x+60,P.y);G.clock+=(a.end-t.roadNow()+.05)*t.DAY/24;frames(1);ok(a.beh==='leave'&&!a.gone,'an approach whose time is up walks off');frames(3000);ok(a.gone,'and is gone once out of your sight');G.clock=t.DAY*.3;
  goHome();const s=t.roadSpawn('hunters',P.x+50,P.y);P.x+=V*t.ENC_LIFE.leave+60;frames(1);ok(s.gone,'anything leaves once you are '+t.ENC_LIFE.leave+'× your sight away');
  goHome();const m=t.roadSpawn('merchant',P.x+V+100,P.y);P.x-=20;frames(1);ok(!m.gone,'(not one just come past your sight, you a little farther)');P.x-=200;frames(1);ok(m.gone,'outpaced: gone')}

 // ---- traces: ignored, the traveller dies (a body), fading after a day; tended, none
 {goHome();const e=t.roadSpawn('traveller',P.x+40,P.y);e.seen=1;G.clock+=(e.end-t.roadNow()+.1)*t.DAY/24;frames(1);const b=R().on.find(x=>x.trace&&x.k==='body');
  ok(e.gone&&b&&b.from<=t.roadNow()&&Math.abs(b.end-b.from-t.ENC_LIFE.trace)<1e-9&&b.x===e.x,'ignored, the wounded traveller dies: a body by the road, for a day');
  ok(b&&b.inView(V)&&!b.chaseable()&&!b.marked()&&t.objKind(b)==='road'&&t.pickAt(b.x,b.y-4)!==b,'drawn, never highlighted nor clicked');
  G.clock+=t.DAY*1.01;if(G.clock>=t.DAY){G.day+=Math.floor(G.clock/t.DAY);G.clock%=t.DAY}frames(1);ok(b.gone&&!b.inView(V),'gone after a day');G.clock=t.DAY*.3;
  goHome();const f=t.roadSpawn('traveller',P.x+40,P.y);P.gold=500;t.invAdd('good','grain',10);t.roadMeet(f);t.act('enc-do','0');world();P.x+=V*2+200;frames(1);ok(f.gone&&!R().on.some(x=>x.trace),'tended, he walks away: no body');
  goHome();const g=t.roadSpawn('traveller',P.x+40,P.y);P.x+=V*2+200;frames(1);ok(g.gone&&R().on.some(x=>x.trace&&x.k==='body'&&x.from>=g.end-1e-9),'ridden away from, he dies all the same, when his time is up (the body shows from then)')}

 // ---- the highlights: heard or seen, a log line and a sound; the "!", the glow, the call-out on the screen; the arrow off it
 {goHome();P.sk.scout.lv=0;const n0=G.msgs.length,e=t.roadSpawn('traveller',P.x+V+60,P.y+10);frames(1);
  ok(e.seen&&G.msgs.slice(n0).some(m=>/calls out from the road to the east/.test(m.m)),'heard: a log line ("'+(G.msgs[G.msgs.length-1]||{}).m+'")');
  const bang=t.wuiArrow('bang',t.WUI_K.col.gold),edges=[0,1,2,3,4,5,6,7].map(k=>t.wuiEdge(k,t.WUI_K.col.gold));
  const spy=fn=>{const r={bang:0,arrow:0,glow:0,say:0};const di=CanvasRenderingContext2D.prototype.drawImage,rg=CanvasRenderingContext2D.prototype.createRadialGradient;
    CanvasRenderingContext2D.prototype.drawImage=function(s,...a){if(s===bang)r.bang++;if(edges.includes(s))r.arrow++;return di.call(this,s,...a)};
    CanvasRenderingContext2D.prototype.createRadialGradient=function(...a){r.glow++;return rg.apply(this,a)};
    try{fn()}finally{CanvasRenderingContext2D.prototype.drawImage=di;CanvasRenderingContext2D.prototype.createRadialGradient=rg}return r};
  const on=spy(()=>t.frame());ok(on.bang>0&&on.arrow===0,'on the screen (not yet in sight): a "!" over it, no arrow');
  e.x=P.x+40;e.y=P.y;t.ROAD_SAY.delete(e);const s1=spy(()=>t.frame());ok(s1.bang>0&&s1.glow>0&&t.ROAD_SAY.get(e)!=null,'in sight: the "!", a glow round it, and its call-out ("'+t.ROAD_ENC.traveller.call+'")');
  e.x=P.x+t.VW/2+60;e.y=P.y;const off=spy(()=>t.frame());ok(off.arrow>0&&off.bang>0,'off the screen: an arrow at the screen’s edge, the "!" beside it');
  t.roadMeet(e);world();const met=spy(()=>t.frame());ok(met.bang===0&&met.arrow===0&&!e.marked(),'met: no more highlights');
}

 // ---- a click on one: you walk there and its page opens
 {goHome();const e=t.roadSpawn('hunters',P.x+50,P.y+8);e.seen=1;t.frame();const b=e.box(),hit=t.pickAt((b[0]+b[2])/2,(b[1]+b[3])/2);ok(hit===e,'a click anywhere on its scene picks it ('+b.join(',')+')');
  ok(/Hunters/.test(t.tipFor(e))&&t.wuiKind(e)==='neutral','its tooltip, its colour ('+t.wuiKind(e)+')');
  t.clickAt((b[0]+b[2])/2,(b[1]+b[3])/2);ok(G.chase===e,'a click sends you to it');for(let i=0;i<400&&G.mode==='world';i++)t.updateWorld(.05);
  ok(G.mode==='road'&&G.road===e&&q('#panel.paged')&&q('.pg-banner')&&q('.rwin h2').textContent==='Hunters’ camp','reached, its page: the banner from the map, its name');
  t.act('enc-leave');ok(G.mode==='world'&&e.met&&!e.gone,'Leave: back on the map')}

 // ---- each of the 14 kinds: its page (its picture, what you see, its choices as key actions, Leave) and today's outcomes
 const meet=(k,set)=>{goHome();R().on=[];const e=t.roadSpawn(k,P.x+10,P.y);if(set)set(e);t.roadMeet(e);return e};
 const acts=()=>qa('.rwbody .rkact').map(b=>b.querySelector('b').textContent),pickA=i=>t.act('enc-do',String(i)),sure=()=>q('.nav [data-nav="close"]').click();
 const ks=Object.keys(t.ROAD_ENC);ok(ks.length===14&&['traveller','merchant','pilgrims','deserters','gamblers','mine','hunters','child','bard','wisps','caravan','ambush','refugees','warning'].every(k=>ks.includes(k)),'the 14 people events, now on the map: '+ks.join(', '));
 {const bad=[];ev('TERRAIN.on=true');for(const k of ks){const e=meet(k);const Dk=D(k),want=Dk.acts.map(a=>a.label).join('|'),got=acts().join('|'),leave=q('.nav [data-nav="close"]');
   if(!(q('#panel.paged')&&q('.pg-banner')&&q('.rwin h2').textContent===Dk.n&&got===want&&(Dk.forced?!leave:leave&&leave.dataset.act==='enc-leave')&&q('.rwbody>p').textContent.length>20))bad.push(k+' ['+got+']')}
  ev('TERRAIN.on=false');world();ok(!bad.length,'every kind has its page: its banner, its name, what you see, its choices as key actions and Leave (none for the ambush)'+(bad.length?': '+bad.join('; '):''))}
 {const pics=ks.map(k=>{goHome();R().on=[];const e=t.roadSpawn(k,P.x+10,P.y);return t.ENC_SCENE.pics(e).length});ok(pics.every(n=>n>0),'every kind is drawn from its pieces ('+pics.join(' ')+')')}
 world();P.morale=50;
 // the wounded traveller
 {P.gold=100;t.invAdd('good','grain',10);const f0=t.foodN(),r0=P.renown;meet('traveller');pickA(0);ok(t.foodN()===f0-3&&P.renown===r0+1&&/recovers/.test(panel())&&!qa('.rwbody .rkact').length,'Tend his wounds: −3 food, +1 renown; then only Leave');world();
  meet('traveller');const g0=P.gold;pickA(1);ok(q('#panel.confirm')&&P.gold===g0,'Take his purse asks first');t.onEscape();ok(G.mode==='road'&&q('#panel.paged'),'Back: his page again');pickA(1);sure();ok(P.gold===g0+20&&/You take 20 gold/.test(panel()),'confirmed: +20 gold');world();
  const e=meet('traveller');t.act('enc-leave');ok(G.msgs[G.msgs.length-1].m==='You leave him to his fate.','Leave: you leave him to his fate')}
 // the peddler
 {P.gold=2000;P.inv=Array(t.INV_SIZE).fill(null);const e=meet('merchant'),p=t.roadPrice(e);pickA(0);ok(P.inv.some(x=>x&&x.k==='gear'&&x.id===e.item)&&P.gold===2000-p,'the peddler sells his piece of gear ('+t.ITEMS[e.item].n+', '+p+' gold)');world();
  P.gold=1;meet('merchant');ok(q('.rkact').disabled&&/Not enough gold/.test(panel()),'unaffordable: disabled, with the reason');pickA(0);ok(G.mode==='road'&&P.gold===1,'and does nothing');world();P.gold=500}
 // the shrine and its pilgrims
 {P.morale=50;meet('pilgrims');pickA(0);ok(P.morale===58,'Pray with them: morale +8');world();
  const g0=P.gold,x0=P.xp+P.level*1e5;P.morale=50;meet('pilgrims');pickA(1);ok(P.gold===g0-20&&P.morale===62&&P.xp+P.level*1e5>x0,'Give alms: 20 gold, morale +12, XP');world();
  P.morale=50;meet('pilgrims');pickA(2);sure();ok(P.gold===g0-8&&P.morale===42,'Take the coins (asks first): +12 gold, morale −8');world();
  const A=t.townBy('Ashford');at(A.x+60,A.y+60);const e=t.roadSpawn('pilgrims',P.x+10,P.y),r1=e.to&&t.repAt(e.to);t.roadMeet(e);pickA(0);ok(e.to&&t.repAt(e.to)>r1&&/good words about you in/.test(panel()),'near a holding they speak well of you there ('+e.to+')');world()}
 // deserters
 {P.troops={hum_levy:2};P.gold=100;const e=meet('deserters',e=>{e.fac=e.fac||'kingdom'});const n0=t.troopCount();pickA(0);ok(t.troopCount()===n0+2&&P.troops[e.unit]>=2&&P.gold===85,'Take them in: two '+t.ST[e.unit].n+'s for 15 gold');world();
  const f=meet('deserters',e=>{e.fac=Object.keys(t.FACS).find(x=>x!=='player')}),h0=t.honorWith(f.fac),g1=P.gold;pickA(1);sure();ok(t.honorWith(f.fac)>h0&&P.gold===g1+10,'Turn them in (asks first): honour with the '+t.FACS[f.fac].n+', a 10-gold bounty');world();
  meet('deserters',e=>{e.fac=null});ok(qa('.rkact')[1].disabled&&/serve no realm/.test(panel()),'no realm to turn them in to: disabled');world();
  goHome();const fac=Object.keys(t.FACS).find(x=>x!=='player');P.fac=fac;const A=t.nearestOf(P,t.TOWNS),own=A.owner;A.owner=fac;const z=t.roadSpawn('deserters',P.x+30,P.y);A.owner=own;P.fac=null;ok(z.fac===fac&&z.beh==='flee','deserters of your own realm run from you');world()}
 // gamblers
 {P.gold=100;meet('gamblers');stub(0,()=>pickA(1));ok(P.gold===120&&/You win 20/.test(panel())&&qa('.rkact').length===3,'a hand for 20, won: +20 gold, and they deal again');stub(.99,()=>pickA(2));ok(P.gold===70&&/You lose 50/.test(panel()),'a hand for 50, lost: −50');world()}
 // the mine
 {const i0=t.goodN('iron');meet('mine');stub(.5,()=>pickA(0));ok(t.goodN('iron')===i0+5&&/tunnels hold/.test(panel()),'Search it, lucky: 5 iron');world();
  P.troops={hum_levy:3};meet('mine');stub(.99,()=>pickA(0));ok(t.troopCount()===2&&/caves in/.test(panel()),'unlucky: a tunnel caves in on a soldier');world()}
 // hunters
 {P.gold=100;const f0=t.goodN('furs');meet('hunters');pickA(0);ok(t.goodN('furs')===f0+3&&P.gold===85,'Buy 3 furs for 15 gold');world();const m0=t.goodN('meat');meet('hunters');pickA(1);ok(t.goodN('meat')===m0+3,'Join the hunt: meat, XP and Scouting');world()}
 // the lost child (near a holding)
 {const A=t.townBy('Ashford');at(A.x+60,A.y+60);const e=t.roadSpawn('child',P.x+10,P.y),r1=t.repAt(e.to);P.morale=50;t.roadMeet(e);pickA(0);ok(t.repAt(e.to)>r1&&P.morale===55&&new RegExp(e.to).test(panel()),'Take her home: her family in '+e.to+' remembers (reputation, morale +5)');world()}
 // the bard
 {P.gold=100;const r1=P.renown;meet('bard');pickA(0);ok(P.gold===90&&P.renown===r1+2,'Hear his song: 10 gold, renown +2');world()}
 // the wisps
 {const g0=P.gold;const e=meet('wisps');stub(0,()=>pickA(0));ok(P.gold===g0+40&&e.gone,'Follow the lights, lucky: a drowned chest of 40 gold; they are gone');world()}
 // a caravan under attack
 {P.troops={hum_levy:6};const e=meet('caravan');pickA(0);ok(G.mode==='dialog'&&G.enc&&G.enc.kind==='party'&&G.enc.ref instanceof t.BandParty&&G.enc.list.length===e.n&&e.gone,'Join the fight: the raiders, a band of their own, '+e.n+' of them');t.act('flee');world()}
 // refugees
 {const g0=t.goodN('grain'),r1=P.renown;meet('refugees');pickA(0);ok(t.goodN('grain')===g0+4&&P.renown===r1+1,'Escort them: they leave you 4 grain, renown +1');world();
  const f0=t.foodN();meet('refugees');pickA(1);ok(t.foodN()===f0-3,'Give food: −3 food');world()}
 // the shepherd
 {const b0=t.bandits.length,s0=P.sk.scout.xp+P.sk.scout.lv*1e4;meet('warning');pickA(0);ok(t.bandits.length===b0+1&&P.sk.scout.xp+P.sk.scout.lv*1e4>s0&&/raiders on the move to the/.test(panel()),'Listen: he tells of a band and which way it is');world()}

 // ---- the ambush: unseen below Scouting 2, it springs as you pass; a forced choice
 {ev('TERRAIN.on=true');const findT=f=>{for(let ty=12;ty<t.MH-12;ty++)for(let tx=12;tx<t.MW-12;tx++)if(f(tx,ty))return[(tx+.5)*TILE,(ty+.5)*TILE];return null};
  const c=findT((tx,ty)=>t.tAt(tx,ty)===t.T_ROAD&&t.coverAt((tx+.5)*TILE,(ty+.5)*TILE)==='forest'&&far(tx,ty));ok(!!c,'a road through a wood');at(c[0],c[1]);P.troops={hum_levy:6};
  ok(t.ROAD_ENC.ambush.ok(),'the ambush can come where there is cover');ev('TERRAIN.on=false');ok(!t.ROAD_ENC.ambush.ok(),'never without battle terrain');ev('TERRAIN.on=true');
  P.sk.scout.lv=1;const e=t.roadSpawn('ambush',P.x+60,P.y);frames(1);ok(!e.inView(t.vis())&&!e.seen&&!e.marked()&&t.pickAt(e.x,e.y-4)!==e,'Scouting 1: unseen, unmarked, nothing to click');
  P.sk.scout.lv=2;frames(1);ok(e.inView(t.vis())&&e.seen&&e.marked()&&/movement in the trees/.test(G.msgs[G.msgs.length-1].m),'Scouting 2: “movement in the trees”, marked');P.sk.scout.lv=0;
  P.x=e.x-30;P.y=e.y;frames(1);ok(G.mode==='world','not yet sprung at 30 px');P.x=e.x-10;frames(1);ok(G.mode==='road'&&G.road===e&&!q('.nav [data-nav="close"]')&&!t.escDismiss(),'passing it, it springs: a forced choice, no Leave');
  pickA(0);ok(G.enc&&G.enc.btype&&G.enc.btype.kind==='ambush'&&G.enc.btype.hid===1&&/Ambush!/.test(panel()),'Close up and fight: the ambush battle');t.act('flee');world();
  at(c[0],c[1]);P.gold=100;t.invAdd('good','grain',10);const f0=t.foodN(),m0=P.morale=50,g=t.roadSpawn('ambush',P.x+10,P.y);t.roadMeet(g);pickA(1);ok(P.gold===85&&t.foodN()===f0-4&&P.morale===46&&g.gone&&q('.nav [data-nav="close"]'),'Cut the baggage loose: −4 food, −15 gold, morale −4; then Leave');world();ev('TERRAIN.on=false')}

 // ---- the save: the encounters, the timer, the day's count and the cooldowns
 {goHome();R().c=7.5;R().cd={bard:G.day};const e=t.roadSpawn('merchant',P.x+90,P.y);e.seen=1;const b=t.roadSpawn('traveller',P.x+50,P.y+30);G.mode='world';G.modal=false;
  const snap=JSON.stringify(W.road);t.saveGame(true);W.road=null;t.loadGame();ok(JSON.stringify(W.road)===snap&&W.road.on.every(x=>x instanceof t.RoadEncounter),'saved and loaded as they were ('+W.road.on.length+' encounters, the timer '+W.road.c+' h, cooldowns)');
  ok(W.road.on[0].D===t.ROAD_ENC.merchant&&W.road.on[0].marked(),'and as they were to you (the peddler still marked)');
  world();clear();t.saveGame(true);t.loadGame();ok(W.road===null&&!('road' in JSON.parse(localStorage.getItem(t.slotKey('auto'))).world),'none: nothing saved, none loaded')}

 // ---- the weather and sickness: still instant events, as ever
 {ok(t.EVENTS.map(e=>e.id).join()==='wagon,fever,storm,blizzard,sandstorm,mirage'&&t.EVENTS.every(e=>e.run&&!e.choices),'the road events left are instant: the weather, the sickness, the finds ('+t.EVENTS.map(e=>e.id).join(', ')+')');
  goHome();G.quietEvents=false;const keep=t.EVENTS.slice();t.EVENTS.length=0;t.EVENTS.push(keep.find(e=>e.id==='storm'));const n0=G.msgs.length;t.roadEvent();t.EVENTS.length=0;keep.forEach(e=>t.EVENTS.push(e));
  ok(G.mode==='world'&&G.msgs.length===n0+1&&/storm/.test(G.msgs[n0].m),'a storm comes at once, a line in the log, no window')}

 // ---- drawn as a mover: nothing leaks a shift into the ground's scene (gfx/render.js memCv), at the screen's finer scale
 {ev('VS=3');goHome();const e=t.roadSpawn('merchant',P.x+60.37,P.y+.41),c=t.roadSpawn('caravan',P.x-40.2,P.y+20.6);e.seen=1;c.seen=1;const pn=performance.now;let now=1e7;performance.now=()=>now;
  let tf=0,leak=0;const C=t.ctx,m0=C.getTransform();for(let i=0;i<30;i++){now+=16.7;t.updateRoad(.05);t.frame();const T2=t.MEM.getContext('2d').getTransform();if(T2.e||T2.f)tf++;const M=C.getTransform();if(M.a!==m0.a||M.e!==m0.e||M.f!==m0.f)leak++}
  performance.now=pn;ev('VS=1');ok(tf===0&&leak===0,'30 frames with a moving peddler and a caravan fight at scale 3: the ground’s scene unshifted, the screen’s transform as it was ('+tf+', '+leak+')')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
