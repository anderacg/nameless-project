'use strict';
// What a marching man carries on the map (gfx/marchgear.js; the owner, 2026-11-01): a fifth of each group's men (one at least)
// fly the army's colours, picked by a hash of their marcher ids so a re-share of places keeps them; a spearman's flag on his own
// longer spear (his body drawn bare), anyone else's at his back, before his body; after dark a fifth of the men with a free hand
// hold a torch there, lit (LIGHTQ), an army of shields one all the same; each switch off draws nothing; every picture kept.
// (march.js drawMarcher's hook is a line request: until it is in, a stand-in of it, restored after)
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,M=t.MARCH_GEAR,keep={...M},clock=G.clock,draw0=window.drawMarcher,sprite0=window.marchSprite,life0=window.idleLife,img0=t.ctx.drawImage;
 try{
  Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
  const hooked=/marchGear/.test(String(draw0)+String(window.drawMarcherAt||''));info(hooked?'march.js drawMarcher carries the hook':'march.js drawMarcher without the hook: a stand-in');
  if(!hooked){
   window.marchSprite=function(u,o,pose,bare){const type=u.character?u.type.replace(/^comp_/,''):u.type,hero=type==='hero',lead=hero||u.row==='leader';
    return t.unitSprite(type,o.mapKind==='monster'?1:0,hero,lead?0:u.id%6,pose??(u.walking?2+(Math.floor((u.stepT||0)*t.MARCH_MOVE.cadence)+u.id)%4:0),!!bare,false,o.look().col)};
   window.drawMarcher=function(u,o,cam){const S=t.ST[u.type]||{},I=!u.walking?t.idleLife(u.id,performance.now()/1000,S.beast?'beast':S.mounted?'mount':'foot'):null;
    t.subT(u);const k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale,x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y),sx=Math.cos(u.dir??t.marchFacing(o))<0?-k:k,Gr=t.marchGear(u,o,x,y,sx),s=window.marchSprite(u,o,I?.pose,Gr.bare),bx=-Math.floor(s.width/2)+(I?.dx||0),by=-s.height+2;
    const c=t.ctx;c.save();c.translate(x,y);c.scale(sx,k);Gr.back(s,bx,by);c.drawImage(s,bx,by);Gr.front(s,bx,by);c.restore()}}
  // (an army of each class: data/matchups.js unitClass; set as tests/marchstyles.js sets one)
  const kind=(race,c,f)=>Object.keys(t.ST).find(k=>t.ST[k].race===race&&!t.ST[k].beast&&!t.ST[k].big&&t.unitClass(t.ST[k])===c&&t.unitSize(k)>=6&&(!f||f(t.lookOf(k,0,false,0))));
  const H={cav:kind('human','cav'),spear:kind('human','spear',L=>!!t.shieldLook(L)),ranged:kind('human','ranged')};info('kinds: '+JSON.stringify(H));
  const lord=W.lords.find(l=>t.FACS[l.fac].races[0]==='human')||W.lords[0];Object.assign(lord,{inside:null,x:P.x+60,y:P.y,state:'march'});
  const set=(o,tc)=>{o.army={nextId:1,groups:[]};o.tc={...tc};o.changed();t.MARCH_ARMIES.delete(o);const A=t.MarchArmy.of(o);A.sync();return A};
  let A=set(lord,{[H.cav]:6,[H.spear]:15,[H.ranged]:10});
  const groups=A=>{const m=new Map();for(const u of A.units){if(u.character)continue;const g=m.get(u.row)||[];g.push(u);m.set(u.row,g)}return[...m.values()]};
  const roles=A=>t.marchRoles(A),flagIds=A=>A.units.filter(u=>roles(A).get(u)?.flag).map(u=>u.id).sort((a,b)=>a-b).join();
  // ---- the share, by group
  ok([15,10,6,1].map(n=>t.gearShare(n,.2)).join()==='3,2,1,1','a fifth of a group, rounded, one at least: 15 → 3, 10 → 2, 6 → 1, 1 → 1');
  {const gs=groups(A),R=roles(A),per=gs.map(g=>g.length+':'+g.filter(u=>R.get(u).flag).length);info('groups (men:flags): '+per.join(' '));
   ok(gs.length===3&&gs.every(g=>g.filter(u=>R.get(u).flag).length===t.gearShare(g.length,M.flag)),'each group flies its share of flags ('+per.join(', ')+')');
   ok(A.units.filter(u=>u.character).every(u=>!R.get(u)?.flag),'its leader carries none')}
  // ---- the picks hold as its places are shared out again, its men in any order
  {const was=flagIds(A),torches=A.units.filter(u=>roles(A).get(u).torch).map(u=>u.id).join();
   for(const g of groups(A)){const ix=g.map(u=>u.index);g.forEach((u,i)=>u.index=ix[(i+1)%ix.length])}A.units=A.units.slice().reverse();
   ok(flagIds(A)===was&&A.units.filter(u=>roles(A).get(u).torch).map(u=>u.id).sort((a,b)=>a-b).join()===torches.split(',').map(Number).sort((a,b)=>a-b).join(),'the same men keep the flags and torches when the places are shared out again ('+was+')');
   t.MARCH_LAYOUTS.delete(lord);A.key='';A.sync();ok(flagIds(A)===was,'and when its men are matched to its rows again (MarchArmy sync)')}
  // ---- drawing: each man's pictures, in order (MARCH_FLAGS: the gear's)
  const VW=t.VW,VH=t.VH,cam={x:Math.round(lord.x-VW/2),y:Math.round(lord.y-VH/2)},gear=()=>new Set(t.MARCH_FLAGS.values());
  // (his weapon, held apart from his body since 2026-11-03 (weapons.js mapHeld), is no gear: left out)
  const held=u=>t.mapHeld(t.marchLook(u,lord),window.marchSprite(u,lord,undefined,true),u.walking)?.w;
  // (his fist laid over his weapon's grip (render.js drawGrip) is his weapon's, not other gear)
  const drawn=u=>{const out=[],w=held(u);window.eval('LIGHTQ=[]');t.ctx.drawImage=function(s,...a){const o=s&&s.src||s;if(o!==w&&!o?.fist)out.push(o);return img0.call(this,s,...a)};try{window.drawMarcher(u,lord,cam)}finally{t.ctx.drawImage=img0}return out};
  const dark=on=>{G.clock=on?t.DAY*.75:t.DAY*.3};
  window.idleLife=()=>({pose:null,dx:0});for(const u of A.units)u.walking=false;dark(false);
  {const R=roles(A),spear=groups(A).find(g=>g[0].type===H.spear),bow=groups(A).find(g=>g[0].type===H.ranged),cav=groups(A).find(g=>g[0].type===H.cav);
   const fs=spear.find(u=>R.get(u).flag),fb=bow.find(u=>R.get(u).flag),fc=cav.find(u=>R.get(u).flag),plain=bow.find(u=>!R.get(u).flag&&!R.get(u).torch);
   ok(R.get(fs).pole===t.lookOf(H.spear,0,false,0).weapon&&!R.get(fb).pole,'a spearman\'s flag is on his spear ('+R.get(fs).pole+'), a bowman\'s at his back');
   const a=drawn(fs);
   // (2026-11-07, the owner: "the same sprites as battle", "check the flags": his own spear drawn as in battle, longer, the battle's
   // cloth under its head)
   ok(a.length===3&&a[0]===window.marchSprite(fs,lord,undefined,true)&&a[0]!==window.marchSprite(fs,lord)&&a[1].R>t.WPN[R.get(fs).pole][0]+4&&gear().has(a[2])&&a[2]===t.clothSprite(lord.banner(),0),'the spearman: his body bare, then his longer spear and the battle\'s cloth on it, over him');
   const b=drawn(fb);ok(b.length===2&&gear().has(b[0])&&b[0].ax!=null&&b[1]===window.marchSprite(fb,lord,undefined,true),'the bowman: the flag on his back first, then his body over it');
   const c=drawn(fc),cp=!!R.get(fc).pole;ok(cp?c.length===3&&c[1].R&&gear().has(c[2]):c.length===2&&gear().has(c[0])&&c[0].ax!=null,'a rider flies one too ('+(cp?'on his lance':'at his back')+')');
   ok(drawn(plain).length===1,'a man with neither: his body alone');
   const s=window.marchSprite(fb,lord);ok(s.free&&s.back&&s.hand&&s.free[0]<s.hand[0]&&s.back[1]<s.free[1],'a marcher\'s figure keeps its free hand and its back by its weapon hand ('+s.free+' / '+s.back+' / '+s.hand+')')}
  // ---- torches: after dark, in a free hand
  {const R=roles(A),bearers=A.units.filter(u=>R.get(u).torch);
   ok(bearers.length>0&&bearers.every(u=>R.get(u).kit.free),'its torches are with men whose off hand is free ('+bearers.length+')');
   ok(groups(A).every(g=>{const n=g.filter(u=>R.get(u).torch).length,free=g.filter(u=>R.get(u).kit.free).length;return n===Math.min(free,t.gearShare(g.length,M.torch))}),'a fifth of each group, as far as its free hands go (none in a group of shields)');
   ok(bearers.every(u=>!R.get(u).flag||groups(A).find(g=>g.includes(u))?.filter(v=>R.get(v).kit.free&&!R.get(v).flag).length<t.gearShare(groups(A).find(g=>g.includes(u))?.length||1,M.torch)),'the torches go to the men without a flag first');
   const u=bearers.find(u=>!u.character)||bearers[0];
   const day=drawn(u),dayLit=t.LIGHTQ.length;ok(day.length===(R.get(u).flag?2:1)&&!dayLit,'by day no torch, no light');
   dark(true);const night=drawn(u),L=t.LIGHTQ[0],x=Math.round(u.x-cam.x),y=Math.round(u.y-cam.y);
   ok(night.length===day.length+1&&gear().has(night[night.length-1])&&t.LIGHTQ.length===1&&Math.abs(L.x-x)<=8&&L.y<y-3&&L.y>y-20,'at night a torch in his hand, drawn over him, its light at its flame over his feet ('+[L?.x-x,L?.y-y]+')');
   const n=A.units.reduce((s,u)=>s+(R.get(u).torch?1:0),0);let lights=0;for(const v of A.units){drawn(v);lights+=t.LIGHTQ.length}ok(lights===n,'every torch is lit, and only those ('+lights+')');
   const far={x:cam.x+5000,y:cam.y};window.eval('LIGHTQ=[]');let out=0,w=null;t.ctx.drawImage=function(s){const o=s&&s.src||s;if(o!==w&&!o?.fist)out++};try{for(const v of A.units){w=held(v);window.drawMarcher(v,lord,far)}}finally{t.ctx.drawImage=img0}
   ok(out===A.units.length&&!t.LIGHTQ.length,'a man off the screen shows no gear')}
  // ---- an army of shields: one torch all the same
  {const B=set(lord,{[H.spear]:15}),R=roles(B),n=B.units.filter(u=>R.get(u).torch).length;
   ok(n>=1&&B.units.filter(u=>!u.character).every(u=>!R.get(u).kit.free)&&(n===1),'an army whose men all bear shields still lights one ('+n+', '+(B.units.find(u=>R.get(u).torch)?.character?'its leader':'a man')+')');A=set(lord,{[H.cav]:6,[H.spear]:15,[H.ranged]:10})}
  // ---- the switches
  {const R=roles(A),count=()=>{let n=0,l=0;for(const u of A.units){n+=drawn(u).length;l+=t.LIGHTQ.length}return[n,l]};dark(true);const on=count();
   M.flags=false;M.torches=false;const off=count();M.flags=true;M.torches=true;
   ok(on[0]>A.units.length&&on[1]>0&&off[0]===A.units.length&&!off[1],'flags and torches off: only the men ('+on+' → '+off+')');
   M.flags=false;const nf=count();M.flags=true;M.torches=false;const nt=count();M.torches=true;
   ok(nf[1]===on[1]&&nf[0]===A.units.length+on[1]&&nt[1]===0&&nt[0]===on[0]-on[1],'each switch alone takes its own away ('+nf+' / '+nt+')');
   const was=keep.flag;M.flag=0;ok(!A.units.some(u=>roles(A).get(u).flag),'a share of 0: no flags');M.flag=was}
  // ---- its cost: the army drawn again and again at night, its gear off and on (told, not tested)
  {dark(true);const time=on=>{M.flags=M.torches=on;const t0=performance.now();try{for(let k=0;k<60;k++)for(const u of A.units)drawn(u)}finally{M.flags=M.torches=true}return performance.now()-t0};
   time(true);const a=time(false),b=time(true);info('60 frames of '+A.units.length+' men: '+a.toFixed(1)+' ms without their gear, '+b.toFixed(1)+' ms with it')}
  // ---- kept: each picture drawn once
  {dark(true);for(const u of A.units)drawn(u);const n=t.MARCH_FLAGS.size,pics=gear();for(const u of A.units)drawn(u);
   ok(n>0&&t.MARCH_FLAGS.size===n&&[...t.MARCH_FLAGS.values()].every(c=>pics.has(c)),'every flag and torch picture is drawn once and kept ('+n+')');
   const b=lord.banner(),f=t.poleFlagSprite('spear',b,'#f3bfad',0);ok(f===t.poleFlagSprite('spear',b,'#f3bfad',0)&&f!==t.poleFlagSprite('spear',b,'#f3bfad',1)&&t.backFlagSprite(b,0)===t.backFlagSprite(b,0)&&t.torchSprite('#f3bfad',0)===t.torchSprite('#f3bfad',0),'by angle step, banner, skin and wave');
   const w=t.weaponSprite('spear','blue','#f3bfad',24,20);ok(w.R===24&&w!==t.weaponSprite('spear','blue','#f3bfad',24)&&t.weaponSprite('spear','blue','#f3bfad',24).R===t.WPN.spear[0]+4,'a weapon drawn at a length of its own, kept apart from its usual one')}
 }finally{t.ctx.drawImage=img0;window.drawMarcher=draw0;window.marchSprite=sprite0;window.idleLife=life0;Object.assign(M,keep);G.clock=clock}
 // ---- in battle too (the owner, 2026-11-01: "the flag should be at the battle as well?"): a share of each group, its own army's
 // colours (u.sourceArmy, yours P's), a spearman's cloth at his spear's tip as he holds it, anyone else's at his back; none for a side
 // of no army (the lab's foes)
 {const L=t.BattleLab,Gp=(type,count)=>({type,count});if(L.active)L.exit();G.mode='world';G.modal=false;
  L.start({leftGroups:[Gp('hum_spear',15),Gp('hum_bow',10),Gp('hum_knight',6)],rightGroups:[Gp('militia',5)],deploy:false,ai:false,paused:true,morale:false,seed:7});const B=t.B;
  const mine=B.units.filter(u=>u.team===0&&!u.hero),grp=k=>mine.filter(u=>u.type===k),flags=k=>grp(k).filter(u=>t.battleFlag(u)).length;
  ok(B.units.filter(u=>u.team===1).every(u=>!t.battleFlag(u))&&mine.some(u=>t.battleFlag(u)),'the lab: its foes, of no army, fly none; your side yours');mine.forEach(u=>u.sourceArmy=P);const foe=t.asParty(W.lords[0]),lb=foe.banner();B.units.filter(u=>u.team===1).forEach(u=>u.sourceArmy=foe);
  ok(flags('hum_spear')===3&&flags('hum_bow')===2&&flags('hum_knight')===1,'a fifth of each group flies its flag: spears '+flags('hum_spear')+' of 15, bows '+flags('hum_bow')+' of 10, knights '+flags('hum_knight')+' of 6');
  const f0=t.battleFlag(B.units.find(u=>u.team===1&&t.battleFlag(u)));ok(t.battleFlag(grp('hum_bow').find(u=>t.battleFlag(u)))===P.banner()||JSON.stringify(t.battleFlag(grp('hum_bow').find(u=>t.battleFlag(u))))===JSON.stringify(P.banner()),'yours in your colours');
  ok(f0&&JSON.stringify(f0)===JSON.stringify(lb),'the enemy in his own');
  const seen=[],img1=t.ctx.drawImage;t.ctx.drawImage=function(c){seen.push(c);return img1.apply(this,arguments)};
  try{const sp=grp('hum_spear').find(u=>t.battleFlag(u)),bw=grp('hum_bow').find(u=>t.battleFlag(u)),b=P.banner();
   seen.length=0;t.drawUnit(sp);const cloth=seen.includes(t.clothSprite(b,0))||seen.includes(t.clothSprite(b,1)),back1=seen.includes(t.battleBackFlag(b,0))||seen.includes(t.battleBackFlag(b,1));
   seen.length=0;t.drawUnit(bw);const back2=seen.includes(t.battleBackFlag(b,0))||seen.includes(t.battleBackFlag(b,1));
   ok(cloth&&!back1&&back2,'drawn: the spearman’s cloth at his spear’s tip (no back flag), the archer’s at his back');
   // (the owner, 2026-11-07: "the flag on unit still has outline": none, as the figures; its cloth on the spear's own tip (poleTip))
   {const navy=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=0;i<d.length;i+=4)if(d[i+3]&&d[i]===0x1a&&d[i+1]===0x1c&&d[i+2]===0x26)return true;return false};
    const hw=t.heldNow(sp,t.unitLook(sp),t.actorSprite(sp)),tip=hw&&t.poleTip(hw.w);
    ok(![t.clothSprite(b,0),t.backFlagSprite(b,0),t.battleBackFlag(b,0),t.poleFlagSprite('spear',b,'#f3bfad',0),t.torchSprite('#f3bfad',0)].some(navy)&&tip&&Math.hypot(...tip)>6,'no outline on a flag, a pole or a torch; the cloth hung from the spear’s own tip ('+tip+')');
    // (the owner, 2026-11-07: "not too square and big enough to be distinctive": the army cards' banner in small, wider than tall,
    // the device in its field; a flag man's spear drawn longer, so his cloth flies over his head)
    const c=t.clothSprite(b,0),Q=t.BATTLE_BANNER,[cw,ch]=Q.cloth[b.k]||Q.cloth.banner;
    ok(cw>ch&&ch>=7&&c.width>=cw&&hw.w.R>t.WPN[hw.k][0]+4,'its cloth '+cw+' × '+ch+' (a '+b.k+'), its spear '+(hw.w.R-8)+' long, not '+t.WPN[hw.k][0])}
   M.flags=false;seen.length=0;t.drawUnit(bw);ok(!seen.includes(t.battleBackFlag(b,0))&&!seen.includes(t.battleBackFlag(b,1)),'flags off: none in battle either');M.flags=true}
  finally{t.ctx.drawImage=img1;L.exit()}}
});
