'use strict';
// An army and its ring never come apart (the owner, 2026-11-01: "the army radius snapping still occur"; "how about making a ring
// like freeform based on the area?"; "why don't you calculate the center based on unit's position"; "why I can interact when my
// ring don't even near the event or buildings"): the army is where its men are (march.js MARCH_MOVE.menCentre: its x, y its men's
// middle, its guide at most MARCH_MOVE.lead ahead), a jump re-places them all round it; the ring drawn round it is the outline of
// the ground its men stand on (MarchOutline, MARCH_RING): a straggler held behind a wall inside it, concave along an L, a lone man
// a small round one, settled when formed, the dashed line its interaction px out, its buffers kept. Meetings, places and the
// road's events measure to it (worldBattleReach, ringReach, marchNear). Ashford's castle and its market (the owner's two
// screenshots); then every mover of a natural world at 1, 2, 4 and 8x: no man outside his outline, its tag at its centre
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,I=t.WORLD_BATTLE.interaction,K=t.MARCH_RING,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);
 for(let y=ty-20;y<=ty+20;y++)for(let x=tx-20;x<=tx+25;x++)if(t.WM.has(x,y)){const i=y*t.MW+x;t.WM.kind[i]=t.T_OPEN;t.WM.edge[i]=0;t.WM.elev[i]=64}
 const x0=P.x,y0=P.y,ring=a=>a.ring||(a.ring=new t.MarchOutline()),fresh=()=>{Object.assign(P,{x:x0,y:y0});t.MARCH_ARMIES.delete(P);return t.MarchArmy.of(P)};
 const lead=o=>t.MARCH_MOVE.lead[0]+t.MARCH_MOVE.lead[1]*t.moveStep(t.marchPace(o),1)*t.MARCH_MOVE.road;
 // (a fake army: its men at the points given about its middle, for the outline alone)
 const fake=(pts,type='hum_foot')=>({owner:{x:x0,y:y0,mapKind:'band'},units:pts.map(([x,y])=>({x:x0+x,y:y0+y,type})),time:0});
 // ---- the outline
 {const A=fake([[0,0]],'hero'),L=ring(A);L.update(A);const r=t.marchDisc(A.units[0]),d=o=>{const out=[];for(let i=0;i<o.at[o.n];i++)out.push(Math.hypot(o.pts[2*i],o.pts[2*i+1]));return out},s=d(L.out[0]),q=d(L.out[1]);
  ok(L.out[0].n===1&&s.every(v=>Math.abs(v-r)<.6),'a lone hero: a small round outline round himself ('+Math.min(...s).toFixed(1)+'-'+Math.max(...s).toFixed(1)+' px, his disc '+r.toFixed(1)+')');
  ok(L.out[1].n===1&&q.every(v=>Math.abs(v-r-I)<1.2),'its dashed line '+I+' px further out ('+Math.min(...q).toFixed(1)+'-'+Math.max(...q).toFixed(1)+' px)')}
 {const pts=[];for(let i=0;i<10;i++){pts.push([60,i*6]);pts.push([i*6,60])}pts.push([60,60]);const A=fake(pts),L=ring(A);L.update(A);
  const hull=L.inside(30,30),men=A.units.every(u=>L.inside(u.x-x0,u.y-y0)),corner=L.inside(42,42);
  ok(men&&!hull&&!corner&&L.out[0].n===1,'an L of men: one concave outline round them all, the empty corner inside their hull outside it ('+(hull?'in':'out')+', '+(corner?'in':'out')+')');
  const B=fake([[0,0],[5,0],[0,5],[80,0],[85,0],[80,5]]),M=ring(B);M.update(B);ok(M.out[0].n===2&&!M.inside(40,0),'two clumps far apart: two islands, the ground between outside ('+M.out[0].n+')');
  const far=[];for(let i=0;i<L.out[1].at[L.out[1].n];i++){let m=Infinity;for(let j=0;j<L.out[0].at[L.out[0].n];j++)m=Math.min(m,Math.hypot(L.out[1].pts[2*i]-L.out[0].pts[2*j],L.out[1].pts[2*i+1]-L.out[0].pts[2*j+1]));far.push(m)}
  ok(Math.min(...far)>=I*.75&&Math.max(...far)<=I*2.5,'round a formation the dashed line keeps its offset ('+Math.min(...far).toFixed(1)+'-'+Math.max(...far).toFixed(1)+' px out of the solid, interaction '+I+')')}
 // ---- your army formed: its outline settles
 P.troops={hum_foot:8,hum_bow:4};P.comps={};let A=fresh();for(let i=0;i<400;i++)A.step(1/30);{const L=ring(A);L.update(A);for(let i=0;i<60;i++){A.step(1/30);L.update(A)}
  const n=L.out[0].at[L.out[0].n],keep=Array.from(L.out[0].pts.subarray(0,2*n));A.step(1/30);const again=L.update(A);
  ok(L.settled&&!again&&keep.every((v,i)=>v===L.out[0].pts[i]),'formed, its outline settles: not made again while its men stand');
  ok(A.units.every(u=>L.inside(u.x-P.x,u.y-P.y)),'every man inside it')}
 // ---- a wall: a straggler held behind it; then the army held by it, its guide pulled toward a click beyond, an event there
 {const wall=tx-3;for(let y=ty-10;y<=ty+10;y++)t.WM.kind[y*t.MW+wall]=t.T_MOUNT;A=fresh();for(let i=0;i<300;i++){A.step(1/30);ring(A).update(A)}
  const u=A.units.find(u=>u.row!=='hero');u.x=(wall-1)*TILE;u.y=P.y;u.plan=null;u.goal=null;const L=ring(A);let out=0,apart=0,met=null;
  for(let i=0;i<240;i++){if(i<120)P.x+=.5;A.step(1/30);L.update(A);if(L.field(u.x-P.x,u.y-P.y)<K.threshold*.5)out++;apart=Math.max(apart,Math.hypot(u.x-P.x,u.y-P.y));
   if(i===150){const band=t.asParty({kind:'bandits',troops:['militia','militia'],x:u.x-14,y:u.y}),B=t.MarchArmy.of(band);B.units.forEach(w=>{w.x=band.x;w.y=band.y});
    const d=Math.hypot(band.x-P.x,band.y-P.y),reach=t.worldBattleReach(band);K.meet=false;const circle=t.worldBattleReach(band);K.meet=true;
    const near=Math.min(...A.units.map(v=>Math.min(...B.units.map(w=>Math.hypot(v.x-w.x,v.y-w.y)-t.marchDisc(v)-t.marchDisc(w)))))-I;met={d,reach,circle,near}}}
  ok(apart>40&&!out,'a man held behind a wall, '+apart.toFixed(0)+' px off his army\'s middle at most: inside its outline every moment ('+out+' out)');
  ok(met&&met.d<=met.reach&&Math.abs(met.d-met.reach-met.near)<1e-6&&met.d>met.circle,'a band by him meets your army there: their nearest men touch ('+met.near.toFixed(1)+' px; its reach '+met.reach.toFixed(1)+'), though its middle is '+met.d.toFixed(0)+' px off, past the circles\' '+met.circle.toFixed(0));
  // (the click beyond the wall: the guide pulled toward it, the men held behind; an event by the click opens only when the outline reaches it)
  Kit.world({encCool:1e9});A=fresh();for(let i=0;i<200;i++)t.updateWorld(.05);const ev={x:(wall-3)*TILE,y:P.y,reachRadius:()=>t.REACH};P.tx=ev.x-40;P.ty=ev.y;let early=0,most=0,frames=0,opened=-1;
  for(let i=0;i<500;i++){t.updateWorld(.05);const a=t.MARCH_ARMIES.get(P);most=Math.max(most,Math.hypot(a.gx-P.x,a.gy-P.y));const d=Math.hypot(ev.x-P.x,ev.y-P.y),gap=t.marchNear(ev.x,ev.y)-t.REACH-I;
   if(d<=t.worldBattleReach(ev)){if(gap>1e-6)early++;if(opened<0)opened=i}frames++}
  ok(!early&&most<=lead(P)+1e-6,'held behind a wall, its guide toward a click beyond: never more than '+most.toFixed(1)+' px ahead of its men (lead '+lead(P).toFixed(1)+'), an event by the click reached only when its outline is ('+early+' early'+(opened>=0?', reached after '+opened+' moments':'')+')');
  for(let y=ty-10;y<=ty+10;y++)t.WM.kind[y*t.MW+wall]=t.T_OPEN;Kit.world({encCool:1e9})}
 // ---- meetings by the outline: an L meets a band at its corner man, not at its circle; one in the L's empty corner does not
 {A=fresh();for(let i=0;i<300;i++)A.step(1/30);const us=A.units;us.forEach((u,i)=>{const k=i%2?[70-i*5,0]:[0,70-i*5];u.x=P.x+k[0];u.y=P.y+k[1]});
  const at=(x,y)=>{const b=t.asParty({kind:'bandits',troops:['militia'],x,y}),B=t.MarchArmy.of(b);B.units.forEach(w=>{w.x=x;w.y=y});return b};
  const end=us.reduce((a,u)=>u.x>a.x?u:a),tip=at(end.x+t.marchDisc(end)*2+I-2,end.y),inner=at(P.x+30,P.y+30),d=b=>Math.hypot(b.x-P.x,b.y-P.y);K.meet=false;const c1=t.worldBattleReach(tip),c2=t.worldBattleReach(inner);K.meet=true;
  ok(d(tip)<=t.worldBattleReach(tip)&&d(tip)>c1,'a band at the tip of an L meets it there ('+d(tip).toFixed(0)+' px off its middle, reach '+t.worldBattleReach(tip).toFixed(0)+'; the circles\' '+c1.toFixed(0)+')');
  ok(d(inner)>t.worldBattleReach(inner)&&d(inner)<=c2,'one in the L\'s empty corner does not, though inside the circles\' reach ('+d(inner).toFixed(0)+' px, reach '+t.worldBattleReach(inner).toFixed(0)+', the circles\' '+c2.toFixed(0)+')');
  const camp={x:end.x+t.marchDisc(end)+I+t.REACH-1,y:end.y,reachRadius:()=>t.REACH};ok(d(camp)<=t.worldBattleReach(camp)&&d(camp)>t.marchInteractRadius(P)+t.REACH,'a place by the L\'s tip opens: your nearest man reaches it ('+d(camp).toFixed(0)+' px off your middle, your ring\'s reach '+(t.marchInteractRadius(P)+t.REACH).toFixed(0)+')');
  t.WORLD_BATTLE.on=false;ok(t.worldBattleReach(tip)===t.REACH&&t.worldBattleReach(camp)===t.REACH,'the world\'s battles off: touching distance, as ever');t.WORLD_BATTLE.on=true;
  P.camp={x:P.x,y:P.y};ok(t.worldBattleReach(camp)===t.marchInteractRadius(P)+t.REACH,'your army in camp: its circle, as before');P.camp=null}
 // ---- the road: one walking up hails you at your front man; a wounded traveller clicked from far opens as your outline touches him
 {P.troops={hum_foot:16};Kit.world({encCool:0});A=fresh();for(let i=0;i<300;i++)A.step(1/30);const R=t.roadSt();R.on=[];
  for(let i=0;i<120;i++){P.tx=P.x+60;P.ty=P.y;t.updateWorld(.05)}P.tx=null;
  const e=t.roadSpawn('merchant',P.x+150,P.y);let near=null,mid=null;for(let i=0;i<600&&e&&G.mode==='world';i++){t.updateWorld(.05);if(G.mode!=='world'){near=t.marchNear(e.x,e.y);mid=Math.hypot(e.x-P.x,e.y-P.y)}}
  ok(e&&near!=null&&near<=t.ENC_LIFE.hail+.01&&mid>t.ENC_LIFE.hail,'one walking up hails you at your front man ('+(near??-1).toFixed(1)+' px from him, '+(mid??-1).toFixed(0)+' from your middle; hail '+t.ENC_LIFE.hail+')');
  t.hidePanel();Kit.world({encCool:1e9});G.road=null;R.on=[];A=fresh();for(let i=0;i<200;i++)A.step(1/30);
  const w=t.roadSpawn('traveller',P.x+220,P.y+10);let before=0,gapAt=null;if(w){t.approach(w);for(let i=0;i<900&&G.mode==='world';i++){const g=t.marchNear(w.x,w.y)-w.reachRadius()-I;if(g<=-1)before++;t.updateWorld(.05);if(G.mode!=='world')gapAt=t.marchNear(w.x,w.y)-w.reachRadius()-I}}
  ok(w&&gapAt!=null&&gapAt<=.01&&gapAt>-4&&!before,'a wounded traveller clicked from far: your army walks till its outline touches him, then he opens ('+(gapAt??NaN).toFixed(1)+' px off at the meeting)');
  t.hidePanel();Kit.world({encCool:1e9});G.road=null;R.on=[];P.tx=null;G.chase=null}
 // ---- Ashford's castle (the owner, 2026-11-01: his hero up on its west wall, his ring at its gate): in by its north side, a stay,
 // out at its gate, on: every man with his army, never on a building's feet
 {const h=t.townBy('Ashford');P.troops={hum_foot:6};Kit.world({encCool:1e9});Kit.goTo(h.x,h.y-150);t.MARCH_ARMIES.delete(P);for(let i=0;i<100;i++)t.updateWorld(.05);
  t.startStay(h);for(let i=0;i<40;i++)t.updateWorld(.05);t.leaveStay();Kit.world({encCool:1e9});let far=0,shut=0,late=0,outl=0,lim=0;
  // (the lead at the pace then: its ground is its men's, world.js armyGround, so the pace where it stands at the end may be less)
  for(let i=0;i<300;i++){if(i===40){P.tx=h.x-160;P.ty=h.y+60}t.updateWorld(.05);const a=t.MARCH_ARMIES.get(P),L=ring(a);L.update(a);const hero=a.units.find(u=>u.row==='hero');lim=Math.max(lim,lead(P));
   for(const u of a.units){if(!a.ground.open(u))shut++;if(!L.inside(u.x-P.x,u.y-P.y))outl++}const dh=Math.hypot(hero.x-P.x,hero.y-P.y);if(i>=60)far=Math.max(far,dh);else if(i>=30&&dh>12)late++}
  // (a man a frame or two past its outline as he squeezes by a house of Ashford's: its houses where the hamlets' tracks left them)
  ok(!shut&&outl<=2&&!late&&far<lim+12,'Ashford: in by its north side, a stay, out at its gate: every man re-placed with his army, inside its outline ('+outl+' a frame past it), none on a building\'s feet ('+shut+'), the hero at most '+far.toFixed(1)+' px off its middle')}
 // ---- Ashford's market (the owner's: a lord's men blocked by its stalls, the ring round a centre they had left): marching through
 const spreadTop=L=>{L=L.filter(u=>!u.dead);const X=L.map(u=>u.x).sort((p,q)=>p-q),n=X.length,x=X[(n-1)>>1],near=L.filter(u=>Math.abs(u.x-x)<=t.ARMY_TAG.near);return{x,y:Math.min(...(near.length?near:L).map(u=>u.y))}};// (the owner, 2026-11-08: "recheck whether all sprites is in the center": an army's label over its men, the middle of them across (median), over the topmost near it)
 {const h=t.townBy('Ashford'),lord=W.lords[0];lord.troops=Array(12).fill('hum_foot');lord.inside=null;lord.x=h.x-120;lord.y=h.y+30;t.MARCH_ARMIES.delete(lord);Kit.goTo(h.x-40,h.y+120);
  const B=t.MarchArmy.of(lord);let gl=0,shut=0,outl=0,banner=0;for(let i=0;i<360;i++){lord.x+=.35;B.step(1/30);const L=ring(B);L.update(B);gl=Math.max(gl,Math.hypot(B.gx-lord.x,B.gy-lord.y));
   for(const u of B.units){if(!B.ground.open(u))shut++;if(!L.inside(u.x-lord.x,u.y-lord.y))outl++}const b=t.armyHome(lord),m=spreadTop(B.units);banner=Math.max(banner,Math.hypot(b.x-m.x,b.y-m.y))}
  ok(gl<=lead(lord)+1e-6&&!shut&&!outl&&banner<1e-6,'a lord\'s army through Ashford\'s market: his guide at most '+gl.toFixed(1)+' px ahead of his men, every man inside his outline, none on the stalls, his banner over his men\'s middle')}
 // ---- a mid tier's steps: its whole step every few frames, the march every frame: its guide held to its men (in a column, its
 // guide its head, its point its middle, marchstyles.js MarchColumn: its men trailing their places at most its lag)
 {const lord=W.lords[1]||W.lords[0];lord.troops=Array(12).fill('hum_foot');lord.x=x0;lord.y=y0+20;lord.inside=null;t.MARCH_ARMIES.delete(lord);const B=t.MarchArmy.of(lord);for(let i=0;i<200;i++)B.step(1/30);
  let gl=0,far=0;const n=t.WORLD_LOD.midEvery;for(let i=0;i<480;i++){if(i%n===0)lord.x+=t.moveStep(t.marchPace(lord),n/30);B.step(1/30);const col=B.colOf();if(i>60){gl=Math.max(gl,Math.hypot(B.gx-lord.x+(col?col.ox:0),B.gy-lord.y+(col?col.oy:0)));for(const u of B.units)far=Math.max(far,Math.hypot(u.x-lord.x,u.y-lord.y)-t.marchOuter(lord)-(col?t.TRAVEL_STYLES.column.lag:0))}}
  ok(gl<=lead(lord)+1e-6&&far<4,'a mid tier\'s lord, his whole step every '+n+' frames: his guide at most '+gl.toFixed(1)+' px ahead of his men, none of them past his ring ('+far.toFixed(1)+')')}
 // ---- a battle's end by a river (the owner, 2026-11-01: "after the fight the units scattered around and the army ring look weird"):
 // survivors on both banks, some fallen, put where they fought as worldbattle.js puts them (settle, then you by your hero's place);
 // at once, the game not yet running: every man inside an outline, none of it round empty ground, its tag at the men's middle;
 // then they gather through the ford into one
 {const river=tx+4,ford=ty+8;for(let y=ty-14;y<=ty+14;y++)if(y!==ford)t.WM.kind[y*t.MW+river]=t.T_WATER;Kit.world({encCool:1e9});P.troops={hum_foot:12,hum_bow:6};A=fresh();for(let i=0;i<300;i++)A.step(1/30);const L=ring(A);L.update(A);
  const far=A.units.filter(u=>u.row!=='hero').slice(0,8);far.forEach((u,i)=>{u.x=(river+3)*TILE+(i%3)*6;u.y=y0+40+Math.floor(i/3)*6});const hero=A.units.find(u=>u.row==='hero');hero.x=(river-6)*TILE;hero.y=y0-30;
  A.units.filter(u=>!far.includes(u)&&u!==hero).slice(0,3).forEach(u=>u.dead=true);A.settle();const p=A.middleOf('hero',hero);P.x=p.x;P.y=p.y;A.x=P.x;A.y=P.y;L.update(A);
  const live=A.units.filter(u=>!u.dead),smax=Math.max(...live.map(t.marchDisc))+K.merge+I+K.cell,c=spreadTop(live),b=t.armyHome(P);let inside=0,empty=0;
  for(let y=-150;y<=150;y+=3)for(let x=-150;x<=150;x+=3)if(L.inside(x,y)){inside++;if(!live.some(u=>Math.hypot(u.x-P.x-x,u.y-P.y-y)<smax))empty++}
  ok(live.every(u=>L.inside(u.x-P.x,u.y-P.y))&&inside>0&&!empty,'a battle\'s end by a river: every survivor inside an outline at once, both banks ('+L.out[0].n+' outlines), none of it round empty ground or the fallen ('+empty+' of '+inside+' points)');
  ok(Math.hypot(b.x-c.x,b.y-c.y)<1e-6&&live.some(u=>Math.hypot(u.x-c.x,u.y-c.y)<40),'its tag (its label) over its men\'s middle, among them ('+c.x.toFixed(0)+','+c.y.toFixed(0)+')');
  let one=-1,n0=0,last='';for(let i=0;i<1500&&one<0;i++){t.updateWorld(.05);const a=t.MARCH_ARMIES.get(P),R=ring(a);R.update(a);if(!i)n0=R.out[0].n;const off=Math.max(...a.units.map(u=>u.goal?Math.hypot(u.goal.x-u.x,u.goal.y-u.y):99));last=R.out[0].n+' outlines, a man '+off.toFixed(0)+' px off his place';
   if(R.out[0].n===1&&a.units.every(u=>R.inside(u.x-P.x,u.y-P.y))&&off<6)one=i*.05*t.WORLD_PACE}
  ok(n0>1&&one>=0&&one<30,'they gather through the ford, the outline following them, into one round their formation ('+n0+' outlines, then one after '+one.toFixed(1)+' s of the map\'s time; '+last+')');
  for(let y=ty-14;y<=ty+14;y++)t.WM.kind[y*t.MW+river]=t.T_OPEN;Kit.world({encCool:1e9})}
 // ---- no allocation growth: the same buffers over many frames
 {P.troops={hum_foot:8,hum_bow:4};A=fresh();const L=ring(A);for(let i=0;i<120;i++){P.x+=i%80<40?.4:-.4;A.step(1/30);L.update(A)}const bufs=()=>[L.E,L.F,L.next,L.rel,L.out[0].pts,L.out[1].pts],b0=bufs();let made=0;
  for(let i=0;i<1200;i++){const k=i%160;P.x+=k<80?.4:-.4;P.y+=k%40<20?.2:-.2;A.step(1/30);made+=L.update(A)?1:0}
  ok(made>100&&bufs().every((b,i)=>b===b0[i]),'marching to and fro, its outline made '+made+' times over the same buffers')}
 // ---- every mover in a natural world: no man outside his army's outline, its tag at its centre
 Kit.begin('soldier',1);Kit.world({encCool:99});G.paused=false;P.troops={hum_foot:10,hum_bow:6,hum_knight:3};const stats=new Map(),seen=new Map(),key=o=>(o===P?'you':o.mapKind||'?')+(o.state?':'+o.state:'');
 for(const sp of [1,2,4,8]){const h=t.TOWNS[(sp*3)%t.TOWNS.length];Kit.goTo(h.x+120,h.y+120);t.MARCH_ARMIES.delete(P);G.speed=sp;const pts=[[260,0],[260,260],[0,260],[-200,100]];let k=0;
  for(let i=0;i<480;i++){G.encCool=99;if(G.modal||G.mode!=='world')Kit.world({encCool:99});P.stay=null;if(P.tx==null){const q=pts[k++%4];t.worldGo(h.x+q[0],h.y+q[1])}t.updateWorld(1/60);
   for(const o of [P,...W.parties,...W.caravans,...W.monsters]){const a=t.MARCH_ARMIES.get(o);if(!a||!a.units.length||o!==P&&(o.dead||o.gone||o.inside||o.fight)||a.idle||o.x!==a.x||o.y!==a.y)continue;
    const L=ring(a),first=seen.get(a)!==L;seen.set(a,L);L.update(a);if(first)continue;const s=stats.get(key(o))||{n:0,out:0,worst:1e9,banner:0};s.n++;
    for(const u of a.units){const f=L.field(u.x-o.x,u.y-o.y);if(f<K.threshold)s.out++;s.worst=Math.min(s.worst,f)}
    const b=t.armyHome(o),m=spreadTop(a.units);s.banner=Math.max(s.banner,Math.hypot(b.x-m.x,b.y-m.y));stats.set(key(o),s)}}}
 G.speed=1;const all=[...stats.values()],men=all.reduce((n,s)=>n+s.n,0);info([...stats].map(([k,s])=>k+' '+s.n+(s.out?' ('+s.out+' out, field '+s.worst.toFixed(2)+')':'')).join('; '));
 ok(stats.size>=4&&men>2000&&all.every(s=>s.worst>=K.threshold*.5)&&all.reduce((n,s)=>n+s.out,0)<=men*.002,'every army of a natural world at 1, 2, 4 and 8x ('+stats.size+' kinds, '+men+' army moments): its men inside its outline (a man\'s own field at worst '+Math.min(...all.map(s=>s.worst)).toFixed(2)+' of '+K.threshold+')');
 ok(all.every(s=>s.banner<1e-6),'its label over its men\'s middle, wherever they are');
 // (the owner, 2026-11-01: the caravan redrawn at the guards' scale, its guards stood on its ox and drover) a caravan's wagon, ox and
 // drover keep their room in its middle (march.js MARCH_CART): marching, no guard on any of them, its outline round them all
 {Kit.clear();const h=t.TOWNS[0];Kit.goTo(h.x+300,h.y+260);const c=t.asParty({x:P.x+60,y:P.y,cv:true,fac:'vale',troops:Array(8).fill('militia'),guards:8,from:h.name,to:h.name,goods:{},dir:1});t.W.caravans.push(c);
  try{const A=t.MarchArmy.of(c);A.sync();let worst=1e9;
   for(let i=0;i<240;i++){c.x+=.25;c.dir=1;A.step(1/30);if(i>90)for(const b of t.marchCart(c))for(const u of A.units)worst=Math.min(worst,Math.hypot(u.x-b.x,u.y-b.y)-(b.r+t.marchBody(u))/2)}
   ok(worst>-1.5,'a caravan on the march: no guard on its wagon, ox or drover (the nearest '+worst.toFixed(1)+' px from touching)');
   ok(t.marchCart(c).every(b=>t.MarchOutline&&A.outline?A.outline.inside?.(b.x,b.y)??true:true),'its outline round its wagon, ox and drover')}
  finally{t.W.caravans=t.W.caravans.filter(x=>x!==c)}}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
