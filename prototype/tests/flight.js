'use strict';
// Flight (the owner, 2026-11-28: "Dragon and griffin should also flying in the map or when figthing as well ( make it like a
// phase where they can fly and land for attacks)"): the winged kinds' figures on the wing; on the map one who travels climbs,
// and comes down standing; in a fight a winged beast rises, flies at its mark out of a blade's reach (an arrow's still),
// dives, lands with its blow and fights on the ground, then rises again; off, as before.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,PX=t.PX,F=t.FLIGHT;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,differ=(a,b)=>{const A=px(a),Bq=px(b);if(A.length!==Bq.length)return true;for(let i=0;i<A.length;i++)if(A[i]!==Bq[i])return true;return false};
 // ---- the figures
 {const bad=[];for(const k of ['griffin','dragon']){const st=t.unitSprite(k,1,false,0,0),f=[0,1,2,3].map(i=>t.unitSprite(k,1,false,0,PX.BEAST_FLY+i));
   if(!f.every(c=>c&&c.width===st.width&&differ(c,st))||!differ(f[0],f[1]))bad.push(k)}
  ok(!bad.length&&t.unitSprite('wolf',1,false,0,PX.BEAST_FLY)===t.unitSprite('wolf',1,false,0,15),'a griffin and the dragon have their own figures on the wing, beating; a beast with no wings only runs'+(bad.length?' BAD '+bad:''))}
 // ---- the map: who flies
 const [x,y]=Kit.field(t.TOWNS[0]);Kit.goTo(x,y);P.troops={hum_levy:3};for(let i=0;i<6;i++)t.updateWorld(1/30);t.drawWorld();
 const A=t.MARCH_ARMIES.get(P),hu=A.units.find(u=>u.type==='hero'),man=A.units.find(u=>u.type!=='hero');
 {P.gear.mount=null;const k0=t.MapFlight.kind(hu,P);P.gear.mount='m_horse';const k1=t.MapFlight.kind(hu,P);P.gear.mount='m_griffin';const k2=t.MapFlight.kind(hu,P),k3=t.MapFlight.kind(man,P);P.gear.mount='m_drake';const k4=t.MapFlight.kind(hu,P);
  ok(!k0&&!k1&&k2==='griffin'&&!k3&&k4==='drake','on the map your hero flies on a griffin or a drake, not on a horse, and his men walk ('+[k0,k1,k2,k3,k4].join(', ')+')')}
 // ---- the map: the climb and the landing (drawn only, on the real clock: each look a tenth of a second on)
 {P.gear.mount='m_griffin';const look=(go,n)=>{let r;for(let i=0;i<n;i++){hu.walking=go;hu.tg=null;hu._flT=performance.now()/1000-.1;r={...t.MapFlight.of(hu,P)}}return r};
  hu._air=0;const g0=look(false,1),mid=look(true,4),top=look(true,12),up=t.MapFlight.up(hu),down=look(false,3),land=look(false,10);
  info('climb '+mid.up+' then '+top.up+' px, pose '+top.pose+'; coming down '+down.up+', landed '+land.up);
  ok(!g0.air&&mid.air>0&&mid.air<1&&top.air===1&&Math.abs(top.up-F.map.h.griffin)<=F.map.bob&&top.pose>=15&&top.pose<=18&&up&&down.air<1&&down.air>0&&!land.air&&!t.MapFlight.up(hu),'setting out he climbs to his height, his mount on the wing, over everyone he passes; standing he comes down and lands');
  let err='';try{hu.walking=true;hu._air=1;t.drawWorld();hu._air=0}catch(e){err=e.message}ok(!err,'the map drawn with you on the wing'+(err?' ('+err+')':''))}
 // ---- the map: a griffin flies while it hunts, walks while it wanders; the dragon whenever it travels
 {const u={type:'griffin',id:3,walking:true},gr={mapKind:'monster',wing:true},dr={mapKind:'monster'};
  ok(t.MapFlight.kind(u,gr)==='griffin'&&t.MapFlight.wants(u,gr)&&!t.MapFlight.wants(u,{mapKind:'monster',wing:false})&&t.MapFlight.wants({type:'dragon',walking:true},dr)&&!t.MapFlight.wants({type:'dragon',walking:false},dr)&&!t.MapFlight.kind({type:'wolf'},gr),'a griffin takes wing to hunt or flee and walks about its lair; the dragon flies wherever it goes; a wolf never')}
 // ---- a fight: the phases
 P.gear.mount=null;Kit.world();P.troops={hum_spear:6,hum_bow:3};
 const fight=kind=>{t.startBattle({enemies:[kind],tournament:false});Kit.engage();const B=t.B,b=B.units.find(u=>u.type===kind);return{B,b}};
 for(const kind of ['griffin','dragon']){const {B,b}=fight(kind),K=F.battle.kinds[kind],seen=[],hp0=B.units.filter(u=>u.team===0).reduce((a,u)=>a+u.hp,0);let zmax=0,aloftHit=null,arrowHit=null,err='',landed=0;
  ok(!!b&&t.BattleFlight.flies(b),'a '+kind+' flies in a fight');
  try{for(let i=0;i<900&&b.hp>0&&landed<2;i++){b.hp=b.max;t.updateBattle(.05);const ph=b.fl?.ph;if(ph&&seen[seen.length-1]!==ph){seen.push(ph);if(ph==='ground'&&seen.length>1)landed++}zmax=Math.max(zmax,b.z||0);
    if(ph==='air'&&aloftHit==null){const h=b.hp,src=B.units.find(u=>u.team===0&&!u.hero);t.applyDmg(b,20,1,'slash',src,false);aloftHit=h-b.hp;const h2=b.hp;t.applyDmg(b,20,1,'pierce',src,true);arrowHit=h2-b.hp;if(i%7===0)t.drawBattle()}}}catch(e){err=e.message+' '+(e.stack||'').split('\n')[1]}
  const hp1=B.units.filter(u=>u.team===0).reduce((a,u)=>a+Math.max(0,u.hp),0);
  info(kind+': '+seen.join(' > ')+'; highest '+zmax.toFixed(1)+' px; yours hurt '+Math.round(hp0-hp1));
  ok(!err,'the fight with a '+kind+' runs'+(err?' ('+err+')':''));
  ok(seen.join(',').includes('rise,air,dive,ground')&&landed>=2,'it rises, flies, dives and lands, then fights on the ground, and rises again ('+seen.join(' > ')+')');
  ok(zmax>=K.h*t.BattleFlight.scale()*.95&&aloftHit===0&&arrowHit>0&&!b.aloft===(b.fl.ph==='ground'||b.z<=F.battle.reach*t.BattleFlight.scale()),'on the wing ('+zmax.toFixed(0)+' px up) a blade does not reach it ('+aloftHit+'), an arrow does ('+arrowHit+')');
  ok(hp1<hp0,'it lands with its blow: your men are hurt ('+Math.round(hp0-hp1)+')');Kit.world()}
 // ---- off: no one flies
 {F.on=false;try{const {B,b}=fight('griffin');for(let i=0;i<200;i++)t.updateBattle(.05);ok(!t.BattleFlight.flies(b)&&!b.aloft&&!(b.fl&&b.fl.ph!=='ground')&&!t.MapFlight.kind({type:'griffin'},{mapKind:'monster'}),'FLIGHT.on false: no one flies, in a fight or on the map')}finally{F.on=true;Kit.world()}}
});
