'use strict';
window.ARENA=true;// (the battle screen's own field: tests/harness.js)
// Figures and their gear (gfx/figures.js, the owner, 2026-10-31): every figure a body and its gear apart, laid at the body's anchors
// in GEAR's layers; nothing cut off (a pike, a lance); a cell's feet where its callers expect them; the finished figures kept in an
// LRU; the battle's weapon behind the body or in front; what a unit carries shown (a shield in the off hand, a bow put away, a
// dismounted rider's lance); health shown by group, by its icon, not over each man; the map's banner over its army's ring
Kit.suite(({ok})=>{
 const t=T,G=t.G,P=t.P;Kit.begin('soldier',3);
 const px=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,OUT=[0x1a,0x1c,0x26];
 const isOut=(d,i)=>d[i]===OUT[0]&&d[i+1]===OUT[1]&&d[i+2]===OUT[2];
 // ---- nothing cut off, the feet where they were
 {const L=k=>t.lookOf(k,0,false,0,'',null),fig=t.unitSprite('hum_pike',0,false,0,0),body=t.unitSprite('hum_pike',0,false,0,0,true),b=t.opaqueBox(fig),bb=t.opaqueBox(body);
  ok(fig.height-b[1]>19&&b[3]===bb[3]&&b[3]===fig.height-1,'a pike stands its full length over the old 24 x 19 frame ('+(fig.height-b[1])+' rows), the feet on the cell\'s bottom row as the body\'s');
  const lance=t.unitSprite('hum_knight',0,false,0,10),lb=t.opaqueBox(lance);ok(lb[2]-(lance.width>>1)>16,'a rider\'s lance levelled in a thrust reaches past his 32-px frame ('+(lb[2]-(lance.width>>1))+' px before his middle)');
  const m=t.unitSprite('militia',1,false,2,0);ok(m.width===32&&m.cw===24&&m.ch===16,'a figure whose gear fits keeps its frame (24 wide, 16 high in a 32 cell)');
  const mids=['hum_spear','hum_pike','hum_bow','dw_axe','elf_blade'].every(k=>{const a=t.unitSprite(k,0,false,0,0),c=t.unitSprite(k,0,false,0,0,true);return a.width===c.width||Math.abs(a.hand[0]-a.width/2-(c.hand[0]-c.width/2))<1});
  ok(mids,'the body\'s middle stays the cell\'s middle however far the gear reaches (its hand as far from it)')}
 // ---- layers: a slung shield and a quiver behind the body, a raised shield and the weapon in front
 {const L=t.lookOf('hum_spear',0,false,0,'',null),bare=t.peopleSprite({...L,weapon:null,shield:null},0),sl=t.peopleSprite({...L,weapon:null},0),up=t.peopleSprite({...L,weapon:null},t.DEF_POSE);
  const same=(a,b)=>{const A=px(a),B=px(b);let cov=0;for(let i=0;i<A.length;i+=4)if(A[i+3]&&!isOut(A,i)&&(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2]))cov++;return cov};
  ok(same(bare,sl)===0,'a shield slung on the far arm is behind him: not one pixel of his body is covered');
  ok(same(bare,up)>4,'raised to meet a blow it is before him ('+same(bare,up)+' of his pixels covered)');
  const A=t.lookOf('hum_bow',0,false,0,'',null),ab=t.peopleSprite({...A,weapon:null},0),aq=t.peopleSprite({...A,weapon:null,slung:'bow'},0);ok(same(ab,aq)===0&&px(ab).join()!==px(aq).join(),'a bow put away and its quiver hang on his back, behind him');
  ok(t.GEAR.layer.shield<0&&t.GEAR.layer.quiver<0&&t.GEAR.layer.main>0&&t.GEAR.layer.guard>0,'one table says it (GEAR.layer)')}
 // ---- what a unit carries
 {const arm=t.unitSprite('hum_bow',0,false,0,0,true,true),bare=t.unitSprite('hum_bow',0,false,0,0,true);ok(px(arm).join()!==px(bare).join()&&t.opaqueBox(arm)[0]<t.opaqueBox(t.unitSprite('hum_bow',0,false,0,0,true,false))[0]+1,'an archer in melee mode has his bow on his back');
  const off=t.unitSprite('hum_knight',0,false,0,0,false,false,null,true),ob=t.opaqueBox(off);ok(off.height-ob[1]>19&&!t.unitLook({type:'hum_knight',team:0,v:0,afoot:true}).mount,'a rider off his horse carries his lance, as long as it is');
  const it=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].icon==='shield'),w0=P.gear.offhand;const h0=px(t.unitSprite('hero',0,true,0,0)).join();P.gear.offhand=it;
  try{const L=t.lookOf('hero',0,true,0);ok(px(t.unitSprite('hero',0,true,0,0)).join()!==h0&&L.offShield&&!L.shield,'a shield in your hero\'s off hand shows on his arm (drawn only: offShield, the look\'s shield the AI reads untouched)')}finally{P.gear.offhand=w0}}
 // ---- the finished figures' LRU
 {const C=new (t.FigureCache)(3),mk=()=>document.createElement('canvas');for(let i=0;i<5;i++){C.frame();C.set('a'+i,mk())}
  ok(C.map.size===3&&!C.get('a0')&&C.get('a4'),'past its cap the least lately drawn go');
  C.frame();for(let i=0;i<6;i++)C.set('b'+i,mk());ok(C.map.size>=6&&[0,1,2,3,4,5].every(i=>C.get('b'+i)),'but never what this frame draws (a crowd bigger than the cap is not drawn afresh each frame)');
  ok(t.FIGURES.map.size>0&&[...t.FIGURES.map.values()].every(c=>c.width&&c.height),'the map\'s and the cards\' figures are kept there ('+t.FIGURES.map.size+')')}
 // ---- in battle: the weapon behind on the shoulder, in front at rest; no health bars over men; the group's health by its icon
 {G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_foot:6,hum_spear:6};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia','militia','militia']};t.startBattle({enemies:G.enc.list,tournament:false});
  const B=t.B,sw=B.units.find(u=>u.type==='hum_foot'),sp=t.actorSprite(sw,0,true);sw.tgt=null;sw.atkAt=null;sw.stun=0;sw.spdNow=0;sw.wIdx=null;
  const rest=t.heldNow(sw,t.unitLook(sw),sp).back;sw.spdNow=sw.s.spd*.55;sw.wIdx=null;const mh=t.heldNow(sw,t.unitLook(sw),sp),march=mh.back,ma=(sw.wIdx/t.WEAPON_STEPS*360+180)%360-180;sw.spdNow=0;
  ok(!rest&&!march&&ma>t.GEAR.behind[0]&&ma<t.GEAR.behind[1],'a sword at rest is drawn before him; on his shoulder on the march too, where behind him his body would hide it (weapons.js peeks)');
  t.HPBARS.on=false;const c=t.ctx,f0=c.fillRect,fills=[];try{c.fillRect=function(...a){fills.push(c.fillStyle);return f0.apply(this,a)};for(const u of B.units){u.plx=u.x;u.ply=u.y;t.drawUnit(u)}}finally{c.fillRect=f0}
  ok(!fills.includes('#e8b94a'),'no health bar over your hero or your companions (nor anyone) with the bars off');
  for(let i=0;i<30;i++)t.updateBattle(.03);t.drawBattle();const g=B.units.find(u=>u.team===1).grp;for(const u of B.units)if(u.grp===g)u.hp=Math.max(1,u.hp*.5);
  const bars=[];try{c.fillRect=function(x,y,w,h){if(c.fillStyle===t.GROUP_HP.col&&w===t.GROUP_HP.w-2)bars.push(h);return f0.apply(this,arguments)};t.drawBattle()}finally{c.fillRect=f0}
  const icons=t.B.icons.length,foe=t.B.icons.findIndex(r=>r.g===g);ok(icons>=2&&bars.length===icons,'every group, yours and theirs, has its health bar by its icon ('+bars.length+' of '+icons+')');
  ok(foe>=0&&Math.abs(bars[foe]/(t.UICON.s-2)-.5)<.15,'its height its health now over what it began with (a group at half health: '+(bars[foe]/(t.UICON.s-2)).toFixed(2)+')');
  B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);t.B=null;G.mode='world'}
 // ---- the map's banner on its army's ring
 {const wb=t.WORLD_BATTLE.on;t.WORLD_BATTLE.on=true;try{Kit.world();t.frame();const a=t.MarchArmy.of(P),r=t.marchOuter(P);a.mid={x:P.x+r*.5,y:P.y+3};
   const b=t.bannerAt(P,0),c=t.MARCH_MOVE.menCentre&&a.units.some(u=>!u.dead)?(P.x===a.wx&&P.y===a.wy?P:a.centre()):a.mid;// (the army where its men are (march.js menCentre): its banner at its men's middle, where its outline is drawn round)
   ok(Math.abs(b.c.x-c.x)<1e-6&&Math.abs(b.c.y-c.y)<1e-6&&b.x===Math.round(c.x)-b.s.px,'your banner stands over the middle your rings are drawn on');
   a.mid={x:P.x+r*2,y:P.y};const f=t.bannerAt(P,0);ok(f.c===P&&f.x===Math.round(P.x)-f.s.px,'that middle out past the ring: over you, as the rings are')}finally{t.WORLD_BATTLE.on=wb}}
});
