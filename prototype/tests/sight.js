'use strict';
// Your sight is every man's of your army, not one circle round your hero or its middle (fog.js Sight; the owner, 2026-11-01: "the
// vision and fog of war should be based on all army units not only heroes"): on the map each marcher of yours, in a battle fought
// on the map each of your side's living men, each seeing vis() times his kind's share (battlefog.js fogRange / FOG.char). Its
// eyes are the men whose disks make its edge, so a big army keeps a dozen or so; the fog, what is remembered, what you learn and
// what is drawn all read them. Its cost a frame, measured.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.clock=t.DAY*.3;G.encCool=1e9;P.comps={};
 // (on plain open ground, so every man's sight is the plain's: map.js visMulAt)
 const home=Kit.goHome('Ashford'),plain=(x,y)=>{for(let j=-9;j<=9;j++)for(let i=-9;i<=9;i++){const px=x+i*16,py=y+j*16;if(t.visMulAt(px,py)!==1||!t.passable(t.terrAt(px,py)))return false}return true};
 let spot=null;for(let r=0;r<160&&!spot;r++)for(let i=-r;i<=r&&!spot;i++)for(const [dx,dy] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=home.x+240+dx*16,y=home.y+200+dy*16;if(plain(x,y)){spot=[x,y];break}}
 ok(!!spot,'an open plain for the fixture');Kit.goTo(spot[0],spot[1]);
 const march=n=>{for(let i=0;i<n;i++)t.MarchArmy.of(P).step(.05)},S=()=>t.yourSight(),raw=s=>{const o=[];for(let i=0;i<3*s.m;i+=3)o.push({x:s.raw[i],y:s.raw[i+1],r:s.raw[i+2]});return o};
 const rawEdge=(s,x,y)=>Math.min(...raw(s).map(e=>Math.hypot(x-e.x,y-e.y)-e.r));
 // ---- alone: one eye, at your hero, vis() wide (as before)
 P.troops={};march(20);{const s=S();ok(s.eyes.length===1&&Math.abs(s.eyes[0].r-t.vis())<1e-9&&Math.hypot(s.eyes[0].x-P.x,s.eyes[0].y-P.y)<12,'alone: one eye, your hero\'s, vis() wide ('+s.eyes.length+' eye, r '+s.eyes[0].r.toFixed(1)+')')}
 // ---- a hundred men: the eyes merged, the edge where every man's sight puts it
 P.troops={hum_spear:45,hum_bow:30,hum_knight:24};march(80);
 const a=t.MARCH_ARMIES.get(P),V=t.vis(),s=S(),men=raw(s);
 info('army: '+a.units.length+' marchers, '+s.eyes.length+' eyes, its ring '+t.marchOuter(P).toFixed(1)+' px, vis '+V.toFixed(1));
 // (in lanes, marchstyles.js, the default since 2026-11-01, a long line's edge needs an eye every 50-70 px: a dozen or two)
 ok(a.units.length>=100&&s.m===a.units.length+1&&s.eyes.length<=Math.max(t.SIGHT_EYES.max,a.units.length/4),'a hundred men (and your army\'s middle) see as a dozen or two eyes ('+a.units.length+' men, '+s.eyes.length+' eyes)');
 ok([...Array(36)].every((_,k)=>t.inSight(P.x+Math.cos(k/36*2*Math.PI)*V*.97,P.y+Math.sin(k/36*2*Math.PI)*V*.97)),'your army\'s middle keeps its eye: no army sees less than it did (all round, 0.97 of vis() out)');
 // (on and past the edge, where the fog is drawn: deep inside, a man the others cover still reads deeper (min of each one's d - r),
 // and the fog is clear there either way; the merging may cost at most SIGHT_EYES.most px, never an edge man's sight)
 {let worst=0,n=0;for(let k=0;k<720;k++){const q=k/720*2*Math.PI,d=V*(.6+(k%15)*.06),x=P.x+Math.cos(q)*d,y=P.y+Math.sin(q)*d,r=rawEdge(s,x,y);if(r<-10)continue;n++;worst=Math.max(worst,Math.abs(s.edge(x,y)-r))}
  ok(n>50&&worst<=t.SIGHT_EYES.most+2,'the merged edge lies within a few px of every man\'s (at most '+worst.toFixed(2)+' px off, '+n+' points on or past it)')}
 ok(men.some(e=>e.r>V*1.01)&&men.some(e=>e.r<V*.95)&&men.some(e=>Math.abs(e.r-V)<1e-9),'each man sees by his kind: a rider farther, a man on foot less, your hero vis()');
 // ---- a man at the ring's edge: the land past him revealed, what only he sees in sight; the far side, past everyone, not
 // (the man reaching farthest past the old circle at a point still on the screen, so the lord there can be drawn and looked at:
 // a lanes army's ring is wide, its farthest reach often off the screen's top or bottom)
 let best=null;for(const e of men){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<=1)continue;const ux=(e.x-P.x)/d,uy=(e.y-P.y)/d,q={x:e.x+ux*(e.r-18),y:e.y+uy*(e.r-18)};
  if(Math.abs(q.x-P.x)>t.VW/2-24||Math.abs(q.y-P.y)>t.VH/2-40)continue;const far=Math.hypot(q.x-P.x,q.y-P.y);if(!best||far>best.far)best={e,d,ux,uy,q,far,reach:d+e.r}}
 const {ux,uy,q}=best,most=Math.max(...men.map(e=>Math.hypot(e.x-P.x,e.y-P.y)+e.r)),back={x:P.x-ux*(most+30),y:P.y-uy*(most+30)};// (past every man's reach)
 t.fogReset();t.reveal();
 ok(Math.hypot(q.x-P.x,q.y-P.y)>V+10&&t.inSight(q.x,q.y)&&t.seenAt(q.x,q.y),'a man at the ring\'s edge sees and reveals the land past him, out of the old circle round the middle ('+(Math.hypot(q.x-P.x,q.y-P.y)-V).toFixed(1)+' px past it)');
 ok(!t.inSight(back.x,back.y),'land past every man stays out of sight');
 // trails (the owner, 2026-11-01: seen from every man too, world/tracks.js Tracks.sees): your own where only an edge man sees;
 // another's at an edge man's feet, past the old circle round the middle, by his Scouting share of his sight
 {const K=t.Tracks,TV=K.view(),n=t.trackNow(),mk=(own,x,y)=>{const tr=new t.Track(own?'you':'band:bandits',6,0,'X',0);tr.add(x,y,n-10);tr.add(x+ux*20,y+uy*20,n-7);return tr},e=best.e,fx=e.x+ux*e.r*TV.k*.5,fy=e.y+uy*e.r*TV.k*.5;
  ok(K.sight(mk(true,q.x,q.y),0,TV)!==null&&K.sight(mk(true,back.x,back.y),0,TV)===null,'your own trail where only an edge man sees: seen; past every man, not');
  ok(Math.hypot(fx-P.x,fy-P.y)>Math.sqrt(TV.r2)&&K.sight(mk(false,fx,fy),0,TV)!==null,'another\'s trail by an edge man, past the old circle round the middle: seen by his share of his sight ('+(Math.hypot(fx-P.x,fy-P.y)-Math.sqrt(TV.r2)).toFixed(1)+' px past it)')}
 const L=W.lords.find(l=>!l.dead),keep=[L.x,L.y,L.inside];L.inside=null;Object.assign(L,{x:q.x,y:q.y});
 ok(L.inView(V)&&t.spotted(L,V),'a lord seen only by an edge man is in sight');
 const K=t.KNOWLEDGE,kept=K.lords;K.lords={[L.id]:null};K.watch();const learnt=!!K.lords[L.id]?.seen;
 {const shot=()=>{t.drawWorld();return t.ctx.getImageData(Math.round(q.x-G.cam.x-10),Math.round(q.y-G.cam.y-22),20,26).data};const b1=shot();L.x=-9999;L.y=-9999;const b0=shot();let d=0;for(let i=0;i<b0.length;i++)if(Math.abs(b0[i]-b1[i])>6)d++;
  ok(d>40,'and he is drawn there, through the remembered scene\'s cut-out ('+d+' pixels)')}
 Object.assign(L,{x:back.x,y:back.y});K.lords={[L.id]:null};K.watch();ok(!L.inView(V)&&!K.lords[L.id],'a lord past every man is not');
 ok(learnt,'what an edge man sees you learn: the journal\'s sighting of that lord');K.lords=kept;[L.x,L.y,L.inside]=keep;
 // ---- built at most once a frame, and only when someone moved
 {const v0=S().ver;for(let i=0;i<50;i++)t.inSight(P.x+i,P.y);const v1=S().ver;P.x+=.01;S();const v2=S().ver;P.x-=.01;P.x+=40;const v3=S().ver;P.x-=40;
  ok(v1===v0&&v2===v0&&v3===v0+1,'built again only when someone moved: asked 50 times, nothing ('+(v1-v0)+'); a step under half a px, nothing ('+(v2-v0)+'); 40 px, once ('+(v3-v0)+')')}
 // ---- the save: what you have explored, as before
 {for(let i=0;i<20;i++){P.x+=24;P.y+=i%2?18:-12;march(2);t.reveal()}const s0=t.seenSave(),n0=t.seenArr().reduce((n,v)=>n+v,0);t.fogReset();t.seenLoad(s0);
  ok(t.seenSave()===s0&&t.seenArr().reduce((n,v)=>n+v,0)===n0,'a save keeps what every man revealed, tile for tile ('+n0+' tiles)');
  const s1=t.seenSave();for(let i=0;i<3;i++)t.drawWorld();ok(t.seenSave()===s1,'drawing the fog never changes what you have explored');Kit.goTo(spot[0],spot[1]);march(40)}
 // ---- its cost a frame: the fog, the remembered scene and the reveal, alone and with a hundred men (the camera moving)
 {const pn=performance.now,ms=(f,n)=>{f();const a=pn.call(performance);for(let i=0;i<n;i++)f();t.ctx.getImageData(0,0,1,1);return (pn.call(performance)-a)/n};
  const mem=t.mkc(t.VW+1,t.VH+1,()=>{}),cam={x:G.cam.x,y:G.cam.y};let k=0;
  const frame=()=>{cam.x=G.cam.x+(k++%40);P.x+=(k%2?.75:-.75);const v=t.vis();t.reveal();t.fogMem(mem,cam,v);t.drawWorldFog(cam,v)};
  const build=()=>{P.x+=(k++%2?.75:-.75);S()};
  const army=ms(frame,120),armyB=ms(build,400),n=S().eyes.length;
  const tc=P.troops;P.troops={};march(20);const lone=ms(frame,120),loneB=ms(build,400);P.troops=tc;march(40);
  info('a frame of fog, remembered scene and reveal: alone '+lone.toFixed(3)+' ms, a hundred men ('+n+' eyes) '+army.toFixed(3)+' ms; a build alone '+loneB.toFixed(4)+' ms, with them '+armyB.toFixed(4)+' ms');
  ok(army-lone<1.5&&armyB<.5,'a hundred men cost the fog little more a frame ('+(army-lone).toFixed(3)+' ms more; a build '+armyB.toFixed(4)+' ms)')}
 // ---- in a battle fought on the map: each of your side's living men sees, as the enemy's do
 {const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y}),enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
  G.enc=enc;t.startBattle({enemies:enc.list,tournament:false});const b=t.B,w=b.world;
  const hero=w.world(b.hero),man=b.units.find(u=>!u.team&&!u.hero&&u.hp>0&&!u.left),foe=b.units.find(u=>u.team===1);
  ok(!!man&&w.sight().length>=1&&w.sight().length<=Math.max(t.SIGHT_EYES.max,b.units.filter(u=>!u.team&&u.hp>0).length/4),'your side\'s men are its eyes ('+w.sight().length+')');
  // (a man sent far from your hero, across the field from him; your hero at its middle (as lanes deploy him), due east)
  const ed=Math.hypot(w.x-hero.x,w.y-hero.y),ux=ed>1?(w.x-hero.x)/ed:1,uy=ed>1?(w.y-hero.y)/ed:0,far={x:w.x+ux*(w.r-10),y:w.y+uy*(w.r-10)},past={x:far.x+ux*t.vis()*.5,y:far.y+uy*t.vis()*.5};
  const beyond=Math.hypot(past.x-hero.x,past.y-hero.y)>t.vis()+20;
  for(const u of b.units)if(!u.team&&u!==man&&u!==b.hero&&u.hp>0)u.left=true;// (the rest of your side out of it)
  Object.assign(man,w.field(far));Object.assign(foe,w.field(past));b.t+=.01;w.view=null;t.fogReset();t.reveal();t.sightStep(true);
  ok(beyond&&t.inSight(past.x,past.y)&&t.seenAt(past.x,past.y)&&t.seenBy(0,foe),'a man far from your hero sees: the land past him revealed, the foe there seen ('+Math.round(Math.hypot(past.x-hero.x,past.y-hero.y)-t.vis())+' px past your hero\'s sight)');
  man.rout=true;b.t+=.01;t.sightStep(true);ok(!t.inSight(past.x,past.y)&&!t.seenBy(0,foe),'a man routed sees no more for you');delete man.rout;
  for(const u of b.units)if(!u.team)delete u.left;b.t+=.01;
  for(let i=0;i<3;i++)t.frame();ok(true,'the battle drawn with its sight');window.eval('B=null');Kit.world()}
 for(let i=0;i<3;i++)t.drawWorld();
 ok(!ERR.length,'no runtime errors');
});
