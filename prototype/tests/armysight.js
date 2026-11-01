'use strict';
// Every army sees by its men (the owner, 2026-11-01: "Every unit spots now and has its vision range, so the army should depend on
// all units' capabilities. I also plan to add scout units"): each kind's sight is data (data/world.js SIGHT_KIND, sightShare: a
// rider farther, a man on foot less, a scout far farther), the one table for the map (fog.js Sight, yours; armySight, every army's
// eyes for a threat on the march) and for battle (battlefog.js fogRange). An AI column detects a foe by any man's eyes (marchstyles.js
// TravelStyle threat), its head furthest down the road, and re-forms; a lord keeps to the roads on a long trip (brains.js LordBrain
// way, TRAVEL_STYLES.lordKeep). Its cost: eyes made only when a foe is near enough to ask, built again only when its men moved,
// for armies near you. No runtime errors.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TS=t.TRAVEL_STYLES,Style=t.TravelStyle,SK=t.SIGHT_KIND,ST=t.ST;
 Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});t.WORLD_BATTLE.on=true;t.GUIDE.on=false;G.clock=t.DAY*.3;P.comps={};
 // ---- the table: by kind, on the map and in battle
 {const f=t.sightShare('hum_foot'),b=t.sightShare('hum_bow'),k=t.sightShare('hum_knight'),fr=t.fogRange({type:'hum_foot',s:ST.hum_foot}),kr=t.fogRange({type:'hum_knight',s:ST.hum_knight});
  ok(k>1&&f<1&&b>f&&b<1&&fr===220&&t.fogRange({type:'hum_bow',s:ST.hum_bow})===260&&kr===300&&t.fogRange({hero:true,s:{}})===t.FOG.char,'a rider sees further than a footman: on the map '+k.toFixed(3)+' to '+f.toFixed(3)+' of a character\'s sight (a bowman '+b.toFixed(3)+'), in battle '+kr+' to '+fr+' px (as before: 300, 260, 220; a character '+t.FOG.char+')');
  ok(t.FOG.foot===Math.round(t.FOG.char*SK.foot)&&t.FOG.mounted===Math.round(t.FOG.char*SK.mounted),'the battle\'s ranges by kind read the one table (FOG.foot '+t.FOG.foot+', FOG.mounted '+t.FOG.mounted+')')}
 // (a scout: data/units.js SCOUT_KINDS, the tag; a kind tagged sees SIGHT_KIND.scout times its own, on the map and in battle)
 {const r=t.sightShare('ranger'),hb=t.sightShare('hum_hbow');
  ok(t.isScout('ranger')&&Math.abs(r-t.sightShare('ranger',{...ST.ranger})/1)<1e-12&&Math.abs(hb-SK.mounted*SK.scout)<1e-12&&t.fogRange({type:'hum_hbow',s:ST.hum_hbow})===Math.round(Math.round(t.FOG.char*SK.mounted*SK.scout)),'today\'s scouts see x'+SK.scout+': a mounted archer '+hb.toFixed(3)+' of a character on the map, '+t.fogRange({type:'hum_hbow',s:ST.hum_hbow})+' px in battle')}
 const spot=(()=>{const home=Kit.goHome('Ashford'),plain=(x,y)=>{for(let j=-12;j<=12;j++)for(let i=-14;i<=14;i++){const px=x+i*16,py=y+j*16;if(!t.passable(t.terrAt(px,py))||t.terrAt(px,py)===t.T_FORD)return false}return true};
  for(let r=0;r<200;r++)for(let i=-r;i<=r;i++)for(const [dx,dy] of [[i,-r],[i,r],[-r,i],[r,i]]){const x=home.x+300+dx*16,y=home.y+300+dy*16;if(plain(x,y))return [x,y]}return null})();
 ok(!!spot,'an open plain for the fixture');Kit.goTo(spot[0],spot[1]);
 const march=n=>{for(let i=0;i<n;i++)t.MarchArmy.of(P).step(.05)},raw=s=>{const o=[];for(let i=0;i<3*s.m;i+=3)o.push({x:s.raw[i],y:s.raw[i+1],r:s.raw[i+2]});return o};
 {P.troops={hum_foot:12};march(40);const V=t.vis(),a=t.MARCH_ARMIES.get(P),foot=()=>{P.x+=1;const s=t.yourSight();P.x-=1;t.yourSight();return Math.max(...raw(s).filter(e=>Math.abs(e.r-V)>1e-6).map(e=>e.r))};
  const r0=foot();t.SCOUT_KINDS.add('hum_foot');let r1,b1;try{r1=foot();b1=t.fogRange({type:'hum_foot',s:ST.hum_foot})}finally{t.SCOUT_KINDS.delete('hum_foot')}
  ok(a.units.length>=12&&Math.abs(r0-V*SK.foot)<1e-6&&Math.abs(r1-V*SK.foot*SK.scout)<1e-6&&b1===Math.round(220*SK.scout),'a kind tagged scout sees much further: your footmen\'s eyes '+r0.toFixed(1)+' px, tagged '+r1.toFixed(1)+' (x'+SK.scout+'); in battle '+b1+' px for 220')}
 // ---- an AI column: its men's eyes, its head the furthest down the road
 const L=W.lords.find(l=>!l.dead&&t.FACS[l.fac]),kinds=TS.kinds.lord,away=[spot[0]+1600,spot[1]];
 TS.kinds.lord='always';
 try{
  Object.assign(L,{inside:null,waylay:null,defend:null,follow:null,with:null,fight:null,state:'march',x:spot[0],y:spot[1]});L.troops=Array(80).fill('hum_foot');Kit.goTo(away[0],away[1]);
  const stand=(n=300)=>{t.MarchArmy.of(L);const A=t.MARCH_ARMIES.get(L);for(let i=0;i<n;i++)A.step(1/30);return A};
  Style.forget(L);t.MARCH_ARMIES.delete(L);const A=t.MarchArmy.of(L);A.face=A.heading=0;A.trail.clear();A.sync();stand();
  const col=t.marchLayout(L).column,live=A.units.filter(u=>!u.dead),head=live.reduce((a,u)=>u.x>a.x?u:a),tail=live.reduce((a,u)=>u.x<a.x?u:a);
  info('a lord of 80 foot in column: '+live.length+' men, '+Math.round(head.x-tail.x)+' px long; its point '+Math.round(L.x-tail.x)+' px from its tail');
  ok(Style.column(L)&&!!col&&A.col&&!A.forming&&head.x-tail.x>120,'an AI army in its column, formed ('+Math.round(head.x-tail.x)+' px long)');
  const band=(x,y)=>{const b=t.asParty({kind:'bandits',troops:Array(10).fill('militia'),x,y,cool:0,t:999,idle:true});t.bandits.length=0;t.bandits.push(b);return b};
  const b0=band(0,0),ob=t.marchOuter(b0),hr=TS.alert*t.sightShare('hum_foot');
  // (ahead of its head, within his eye; past what any man at its middle could see, a character's eye even)
  const ahead=band(head.x+hr+ob-6,head.y),mid=Math.hypot(ahead.x-L.x,ahead.y-L.y);
  ok(t.armyRelation(L,ahead)<0&&mid>TS.alert+ob+4&&Style.threat(L),'it sees a band ahead by its head man ('+Math.round(ahead.x-head.x)+' px past him), '+Math.round(mid)+' px from its middle, past a character\'s eye there ('+Math.round(TS.alert+ob)+' px with the band\'s ring)');
  {const E=t.armySight(A,TS.alert),by=t.armySight(A,TS.alert).eyes.filter(e=>Math.hypot(ahead.x-e.x,ahead.y-e.y)<e.r+ob);ok(by.length>0&&by.every(e=>e.x>L.x),'the eyes that see it are its van\'s ('+by.length+' of '+E.eyes.length+' eyes)')}
  // (beside its middle, inside the old circle round its point, past every man's eye: not seen; with menSight off, as before, seen)
  const side=band(L.x,L.y+hr+ob+24),inSide=Style.threat(L);TS.menSight=false;const old=Style.threat(L);TS.menSight=true;
  ok(!inSide&&old,'beside its middle, '+Math.round(side.y-L.y)+' px off (the old circle round its point reaching '+Math.round(TS.alert+t.marchOuter(L)+ob)+'): not seen by its men; menSight off, seen as before');
  // ---- it re-forms from column on its men's detection
  band(head.x+hr+ob-6,head.y);Style.forget(L);const seen=!Style.column(L);stand(200);const B0=t.MARCH_ARMIES.get(L);
  ok(seen&&!t.marchLayout(L).column&&!B0.col&&!B0.forming,'on its men\'s detection it re-forms from its column into its battle style ('+t.marchLayout(L).style+')');
  // ---- riders see further than footmen: an army of riders sees a band its footmen would not
  {t.bandits.length=0;L.troops=Array(20).fill('hum_knight').concat(Array(20).fill('hum_foot'));Style.forget(L);stand(200);const C=t.MARCH_ARMIES.get(L),men=raw(t.armySight(C,TS.alert)),of=k=>men.filter((e,i)=>C.units.filter(u=>!u.dead)[i]?.type===k).map(e=>e.r);
   const kr=of('hum_knight'),fr=of('hum_foot');ok(kr.length&&fr.length&&kr.every(r=>Math.abs(r-TS.alert*SK.mounted)<1e-9)&&fr.every(r=>Math.abs(r-TS.alert*SK.foot)<1e-9),'its riders\' eyes '+(TS.alert*SK.mounted).toFixed(1)+' px, its footmen\'s '+(TS.alert*SK.foot).toFixed(1)+' (alert '+TS.alert+' px a character)')}
  // ---- a scout tagged sees much further for its army too
  {t.bandits.length=0;L.troops=Array(30).fill('hum_foot');Style.forget(L);t.MARCH_ARMIES.delete(L);const D=t.MarchArmy.of(L);D.face=D.heading=0;D.trail.clear();D.sync();stand();
   const hd=D.units.filter(u=>!u.dead).reduce((a,u)=>u.x>a.x?u:a),far=band(hd.x+hr*1.3+ob,hd.y),no=Style.threat(L);t.SCOUT_KINDS.add('hum_foot');let yes;try{L.x+=1;yes=Style.threat(L)}finally{t.SCOUT_KINDS.delete('hum_foot');L.x-=1;Style.threat(L)}// (a nudge: its eyes gathered again)
   ok(!no&&yes,'a band '+Math.round(hr*1.3+ob)+' px past its head: unseen by footmen, seen once they are tagged scouts (x'+SK.scout+')')}
  // ---- the cost: eyes made only when a foe is near enough to ask, built again only when its men moved; armies near you only
  {t.bandits.length=0;const E=t.MARCH_ARMIES.get(L);t.ARMY_SIGHTS.delete(E);for(let i=0;i<20;i++)Style.threat(L);const none=!t.ARMY_SIGHTS.get(E);
   band(L.x+40,L.y+TS.alert*2+t.marchOuter(L));Style.threat(L);const S=t.ARMY_SIGHTS.get(E),v0=S?S.ver:-1;for(let i=0;i<50;i++)Style.threat(L);const v1=S.ver;
   L.x+=.2;Style.threat(L);const v2=S.ver;L.x-=.2;for(let i=0;i<10;i++){L.x+=3;E.step(1/30)}Style.threat(L);const v3=S.ver;
   ok(none&&S&&v1===v0&&v2===v0&&v3===v0+1,'no foe near: no eyes made; a band near: made once, asked 50 times nothing ('+(v1-v0)+'), a nudge under half a px nothing ('+(v2-v0)+'), its men marched on, once ('+(v3-v0)+')');
   const pn=performance.now.bind(performance);let k=0;const t0=pn();for(let i=0;i<200;i++){L.x+=(k++%2?1:-1);Style.threat(L)}const ms=(pn()-t0)/200;
   info('a threat asked with its eyes built again each time ('+E.units.length+' men, '+S.eyes.length+' eyes): '+ms.toFixed(4)+' ms');ok(ms<1,'built again each time, '+ms.toFixed(4)+' ms a threat for '+E.units.length+' men');
   // (far from you: not marched man by man (march.js marchMen; the march formations system leaves it idle): its ring, as before)
   E.idle=true;t.ARMY_SIGHTS.delete(E);band(head.x+hr+ob-6,head.y);const farThreat=Style.threat(L);ok(!t.marchMen(L)&&!t.ARMY_SIGHTS.get(E)&&farThreat===(Math.hypot(t.bandits[0].x-L.x,t.bandits[0].y-L.y)<=TS.alert+t.marchOuter(L)+t.marchOuter(t.bandits[0])),'an army far from you (idle, no men marched): no eyes made, alert px round its ring as before');E.idle=false}
 }finally{TS.kinds.lord=kinds;TS.menSight=true;t.bandits.length=0;Style.forget(L);t.MARCH_ARMIES.delete(L);L.x=-9999;L.y=-9999}
 // ---- a lord keeps to the roads on a long trip, a short one goes as the land does
 {const brain=L.brain,keep=TS.lordKeep,walkers=[];Kit.goTo(-5000,-5000);
  const hs=t.TOWNS.filter(h=>h.x>0),pairs=[];for(const a of hs)for(const b of hs){const d=Math.hypot(a.x-b.x,a.y-b.y);if(a!==b&&d>TS.long*1.6&&d<TS.long*3.5&&t.Router.reach({x:a.x,y:a.y+12},{x:b.x,y:b.y+12}))pairs.push([a,b,d])}
  pairs.sort((p,q)=>p[2]-q[2]);const trips=pairs.filter((p,i)=>i%Math.max(1,Math.floor(pairs.length/6))===0).slice(0,6);
  // (his walk from a's gate to b's: of each step's spot, on a road's band; the steps it took)
  const walk=(a,b,lk,from)=>{TS.lordKeep=lk;const o={x:from?from.x:a.x,y:from?from.y:a.y+12,mapKind:'lord'};let on=0,n=0;const tx=b.x,ty=b.y+12;
   for(;n<4000&&Math.hypot(tx-o.x,ty-o.y)>4;n++){if(!t.Router.travel(o,brain.way(o,tx,ty,b),4))break;if(t.RoadBand.on(o.x,o.y))on++}return{share:on/Math.max(1,n),n,o}};
  let k0=0,k1=0,n0=0,n1=0;const rows=[];
  try{for(const [a,b] of trips){const w0=walk(a,b,1),w1=walk(a,b,keep);k0+=w0.share*w0.n;n0+=w0.n;k1+=w1.share*w1.n;n1+=w1.n;rows.push(a.name+'-'+b.name+' '+Math.round(w0.share*100)+'%>'+Math.round(w1.share*100)+'%')}
   info('long trips ('+trips.length+'), the share of his steps on a road, keep 1 > '+keep+': '+rows.join(', '));
   ok(trips.length>=3&&k1/n1>k0/n0,'a lord on a long trip keeps to the roads: '+Math.round(k1/n1*100)+'% of his steps on a road, '+Math.round(k0/n0*100)+'% without lordKeep');
   // (a short trip: the last stretch of the first, within long px of its end)
   const [a,b]=trips[0],near={x:b.x+(a.x-b.x)*TS.long*.8/Math.hypot(a.x-b.x,a.y-b.y),y:b.y+12+(a.y-b.y)*TS.long*.8/Math.hypot(a.x-b.x,a.y-b.y)},g=brain.way(near,b.x,b.y+12,b),s0=walk(a,b,1,near),s1=walk(a,b,keep,near);
   ok(!g.road&&Math.abs(s0.share-s1.share)<1e-12&&s0.n===s1.n,'a short trip ('+Math.round(TS.long*.8)+' px) as the land goes: no road keeping, the same way ('+Math.round(s1.share*100)+'% on a road either way)');
   const lw=walk(a,b,keep);TS.lordKeep=keep;ok(brain.way(lw.o,b.x,b.y+12,b).road===keep&&brain.way({x:near.x,y:near.y},b.x,b.y+12,b).road===false,'his long trip\'s goal keeps to the roads x'+keep+' (router.js wayKeep) to its end (he stands '+Math.round(Math.hypot(b.x-lw.o.x,b.y+12-lw.o.y))+' px from it); one setting out within '+TS.long+' px, not')}
  finally{TS.lordKeep=keep}}
 Kit.goTo(spot[0],spot[1]);for(let i=0;i<3;i++)t.drawWorld();
 ok(!ERR.length,'no runtime errors');
});
