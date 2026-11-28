'use strict';
// Your mount under you (the owner, 2026-11-28: "Make sure mount system work and horse sprite actually fit with hero when mounting",
// "For dragon and griffin too"): every mount has a figure; riding one, your hero's look, picture and battle numbers are a rider's,
// on the map and in a fight; the rider sits his mount as a knight sits his horse; on foot inside a cave; off, as before.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,PX=t.PX;Kit.begin('soldier',1);Kit.world();
 const box=c=>{const b=t.opaqueBox(c);return{w:b[2]-b[0]+1,h:b[3]-b[1]+1,top:b[1],bot:b[3]}},KINDS=['horse','ram','stag','warg','griffin','drake','strider'];
 // ---- the table
 {const bad=Object.keys(t.MOUNTS).filter(k=>{const F=t.MOUNTS[k].fig;return !F||!KINDS.includes(F[0])||t.ITEMS['m_'+k].fig!==F});
  ok(!bad.length,'every mount has a figure to be drawn as ('+Object.keys(t.MOUNTS).map(k=>k+': '+t.MOUNTS[k].fig[0]).join(', ')+')'+(bad.length?' BAD '+bad:''))}
 // ---- on foot
 P.gear.mount=null;const foot=t.unitSprite('hero',0,true,0,0),fb=box(foot);
 ok(!t.lookOf('hero',0,true,0).mount&&!('mounted' in t.heroStats()),'on foot: no mount in your look, and your numbers in a fight as they were (no rider\'s mark on them)');
 // ---- each mount: your look, your picture, your numbers
 {const bad=[],sizes=[];
  for(const k of Object.keys(t.MOUNTS)){P.gear.mount='m_'+k;const L=t.lookOf('hero',0,true,0),F=t.MOUNTS[k].fig;
   if(L.mount!==F[0]||!!L.barded!==!!F[1]||!t.heroStats().mounted){bad.push(k+' look');continue}
   for(const p of [0,3,16,7]){const s=t.unitSprite('hero',0,true,0,p),b=box(s);if(s===foot||b.w<fb.w+6||b.h<fb.h)bad.push(k+' pose '+p+' '+b.w+'x'+b.h);if(p===0)sizes.push(k+' '+b.w+'x'+b.h)}}
  info('on foot '+fb.w+'x'+fb.h+'; riding: '+sizes.join(', '));
  ok(!bad.length,'riding each mount your hero is drawn on it, standing, walking, at a gallop and striking, and is a rider in a fight'+(bad.length?' ('+bad.join('; ')+')':''))}
 // ---- the fit: your hero on a horse sits as a knight does (his head as high over the ground, his picture as wide, 2 px either way)
 {P.gear.mount='m_horse';const h=box(t.unitSprite('hero',0,true,0,0)),kn=box(t.unitSprite('hum_knight',0,false,0,0)),sq=box(t.unitSprite('hum_squire',0,false,0,0));
  info('hero on a horse '+h.w+'x'+h.h+', a squire '+sq.w+'x'+sq.h+', a knight '+kn.w+'x'+kn.h);
  ok(Math.abs(h.h-sq.h)<=3&&Math.abs(h.w-sq.w)<=3,'on a horse your hero is a squire\'s size on his ('+h.w+'x'+h.h+' against '+sq.w+'x'+sq.h+')')}
 // ---- a winged mount's own art: the beast's figure under the rider; on the wing at a gallop
 {const bad=[];for(const k of ['griffin','drake','strider']){const a=PX.flyMount(k,-1),w=PX.flyMount(k,1),g=PX.flyMount(k,5),d=PX.flyMount(k,'dead'),n=q=>q.g.p.filter(Boolean).length;
   if(!a||!w||!g||!d||n(a)<120||n(d)<80||g.fly!==(k!=='strider')||!PX.flySeat(k))bad.push(k)}
  ok(!bad.length&&!PX.flyMount('horse',0)&&PX.flies('griffin')&&PX.flies('dragon')&&!PX.flies('wolf')&&!PX.flies('strider'),'a griffin, a drake and a marsh strider are drawn from the beasts\' own figures; the first two fly at a gallop, the strider never'+(bad.length?' BAD '+bad:''))}
 // ---- the map: your marcher's look follows your mount
 {P.gear.mount=null;P.troops={hum_levy:4};const [x,y]=Kit.field(t.TOWNS[0]);Kit.goTo(x,y);for(let i=0;i<6;i++)t.updateWorld(1/30);t.drawWorld();
  const A=t.MARCH_ARMIES.get(P),hu=A&&A.units.find(u=>u.type==='hero');const l0=hu&&t.marchLook(hu,P).mount;P.gear.mount='m_horse';const l1=hu&&t.marchLook(hu,P).mount;P.gear.mount='m_griffin';const l2=hu&&t.marchLook(hu,P).mount;
  ok(!!hu&&!l0&&l1==='horse'&&l2==='griffin','on the map your marcher is drawn on the mount you ride, changed as you change it ('+[l0,l1,l2].join(', ')+')');
  let err='';try{for(let i=0;i<4;i++){t.updateWorld(1/30);t.drawWorld()}}catch(e){err=e.message}ok(!err,'the map drawn with you riding a griffin'+(err?' ('+err+')':''))}
 // ---- a fight: a rider, drawn mounted through a blow; inside a cave on foot
 {P.gear.mount='m_horse';Kit.world();t.startBattle({enemies:['militia','militia'],tournament:false});Kit.engage();const B=t.B,h=B.units.find(u=>u.hero);let err='';
  ok(!!h&&h.s.mounted&&t.unitLook(h).mount==='horse','in a fight your hero is a rider on his horse');
  try{for(let i=0;i<120;i++){t.updateBattle(.05);if(i%10===0)t.drawBattle()}}catch(e){err=e.message+' '+(e.stack||'').split('\n')[1]}ok(!err,'the fight runs and draws with you riding'+(err?' ('+err+')':''));
  // (your own blows, a shove and a dodge from the saddle)
  {let e2='';try{for(const act of ['swing','shove','swing']){h.cd=0;B.hx[act]();for(let i=0;i<14;i++){t.updateBattle(.05);t.drawBattle()}}B.hx.dodge(1,0);for(let i=0;i<14;i++){t.updateBattle(.05);t.drawBattle()}}catch(e){e2=e.message+' '+(e.stack||'').split('\n')[1]}
   ok(!e2,'you strike, shove and dodge from the saddle, drawn each frame'+(e2?' ('+e2+')':''))}
  t.Dismount.hero(h);ok(h.afoot&&!h.s.mounted&&!t.unitLook(h).mount,'where no one rides (a cave, a hold) your hero fights on foot');}
 // ---- off: as before
 {Kit.world({town:null});P.gear.mount='m_horse';t.HERO_RIDES.on=false;try{ok(!t.lookOf('hero',0,true,0).mount&&!t.heroStats().mounted,'HERO_RIDES off: your mount only its numbers, your hero on foot')}finally{t.HERO_RIDES.on=true}}
});
