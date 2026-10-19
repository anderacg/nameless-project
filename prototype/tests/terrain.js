'use strict';
// Terrain phase 1 (battle/terrain.js; doc/TERRAIN_DESIGN.md): the ground grid, its generation (determinism, isolation from
// Math.random, fairness), one check per rule of the hills, woods and marsh tables, the race exemptions, D2/D6, no scattered props with terrain (D10 reversed), no woods in deserts, terrain off is
// today's battle, and the arrow tree-memory fix (more than 32 trees). TERRAIN.on is turned on here (tests/harness.js turns it off).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,L=t.BattleLab,ev=s=>(0,eval)(s),near=(a,b,e=1e-9)=>Math.abs(a-b)<=e;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
 const TR=t.TERRAIN,TG=t.TERRAIN_GROUND,H=t.HILL,K=t.TKIND;
 ok(TR.on===false,'the harness turns terrain off for the older suites');
 // ---- terrain off is today's battle: a lab battle with ground 'none', the page's first (the first lab battle after a page loads
 // plays a little differently from a later one, at HEAD too: tests/visual/battleperf.js), fingerprinted as at HEAD 2c90bef
 const fp=()=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v|0),16777619)>>>0};for(const u of t.B.units){mix(u.x*1e6);mix(u.y*1e6);mix(u.hp*1e3);mix(u.rout?1:0)}return h.toString(16)};
 const run=(ground,on)=>{ev('TERRAIN.on='+on);G.mode='world';G.modal=false;L.start({leftGroups:[{type:'hum_foot',count:12},{type:'hum_bow',count:8},{type:'hum_knight',count:6,form:'wedge'}],rightGroups:[{type:'dw_clan',count:12},{type:'dw_sling',count:8},{type:'hum_knight',count:6,form:'wedge'}],deploy:false,ai:true,paused:true,morale:true,seed:9,terrain:'forest',ground});t.B.paused=false;for(let f=0;f<300&&!L.session.result;f++)t.updateBattle(1/60);const r=fp();L.exit();return r};
 {const first=run('none',false),HEAD_FP='6b1cc863';ok(first===HEAD_FP||t.BW!==960,'terrain off: the page’s first lab battle plays as at HEAD (fingerprint '+first+(t.BW!==960?'; field '+t.BW+' px wide, HEAD’s was taken at 960':'')+')')}
 ev('TERRAIN.on=true');
 const gridHash=T=>{let h=2166136261;const mix=v=>{h=Math.imul(h^(v&255),16777619)>>>0};for(const a of [T.kind,T.lvl,T.up])for(const v of a)mix(v);return h.toString(16)};
 // ---- generation: same place, same field; never Math.random
 const env={c:'grass',t:t.T_OPEN};let calls=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};
 let A,A2,Bt;try{for(const rc of Object.keys(t.TERRAIN_RECIPE)){A=t.buildTerrain({recipe:rc,seed:12345,W:1100,top:40,bot:560});A2=t.buildTerrain({recipe:rc,seed:12345,W:1100,top:40,bot:560})}
  A=t.buildTerrain({recipe:'forest',seed:777,W:1100,top:40,bot:560});A2=t.buildTerrain({recipe:'forest',seed:777,W:1100,top:40,bot:560});Bt=t.buildTerrain({recipe:'forest',seed:778,W:1100,top:40,bot:560})}finally{Math.random=r0}
 ok(calls===0,'generation never draws Math.random (the spawn sequence is untouched): '+calls+' calls');
 ok(gridHash(A)===gridHash(A2)&&gridHash(A)!==gridHash(Bt),'same seed, same grid ('+gridHash(A)+'); another seed, another ('+gridHash(Bt)+')');
 ok(A.cs===16&&A.C===Math.ceil(1100/16)&&A.R===Math.ceil(t.BH/16)&&A.kind instanceof Uint8Array&&A.lvl instanceof Uint8Array&&A.up instanceof Int8Array&&A.kind.length===A.C*A.R,'B.terrain shape: 16-px cells, '+A.C+'×'+A.R+', Uint8 kind/lvl, Int8 up');
 ok(A.has&&'hills' in A.has&&'wood' in A.has&&'marsh' in A.has&&A.has.water===false&&A.recipe&&Array.isArray(A.recipe.hills)&&A.ai&&Array.isArray(A.ai.tops)&&Array.isArray(A.ai.crossings)&&typeof A.seed==='number','B.terrain carries has, seed, recipe and the static AI reading (§4)');
 ok([...A.up].every((d,i)=>d===-1||A.lvl[i]>0&&d>=0&&d<8),'slope cells: on a terrace, uphill one of 8 directions');
 // the world tile: same tile, same seed; a neighbour tile, another
 const tiles=[];for(let i=0;i<t.MW*t.MH&&tiles.length<2;i+=97)if(t.tiles[i]===t.T_OPEN&&t.CLIMS[t.climate[i]]==='grass')tiles.push({x:(i%t.MW+.5)*t.TILE,y:(Math.floor(i/t.MW)+.5)*t.TILE});
 const s1=t.terrainAt(tiles[0].x,tiles[0].y,env),s1b=t.terrainAt(tiles[0].x+3,tiles[0].y-3,env),s2=t.terrainAt(tiles[1].x,tiles[1].y,env);
 ok(s1.seed===s1b.seed&&s1.seed!==s2.seed&&s1.recipe==='open','D4: a battle at the same world tile has the same seed, another tile another');
 // ---- fairness over 200 tiles (D5 symmetric)
 {let bad=[],dropped=0,tried=0;const recs=Object.keys(t.TERRAIN_RECIPE);
  for(let i=0;i<200;i++){const W=960+(i*37)%341,top=30+(i*13)%50,bot=600-((i*7)%40)-10,T=t.buildTerrain({recipe:recs[i%recs.length],seed:(i*2654435761+99)>>>0,W,top,bot}),f=t.terrainFair(T,W,top,bot);
   tried+=T.recipe.tries;if(T.recipe.dropped.length)dropped++;
   // (field variety: a layout may pair its hills round a middle one (rolling, erg, fen's isles): each hill centred or mirrored by another)
   const hs=T.recipe.hills,sym=/^pair/.test(T.recipe.layout)?hs.length===2&&Math.abs(hs[0].x+hs[1].x-W)<=TR.mirror+1e-9&&hs[0].x<W/2&&hs[1].x>W/2:hs.every(h=>Math.abs(h.x-W/2)<TR.centre*W||hs.some(o=>o!==h&&Math.abs(h.x+o.x-W)<=TR.mirror+1e-9&&(h.x<W/2)!==(o.x<W/2)));
   if(!f.ok||!sym)bad.push(recs[i%recs.length]+'#'+i+(f.zone?'':' zone')+(f.score?'':' score')+(f.lane?'':' lane')+(sym?'':' hills'))}
  ok(!bad.length,'fairness over 200 tiles: deployment zones ≤'+TR.zoneWood*100+'% woods (a forest’s or a fen’s: alike cover, glades and an open way), halves within '+TR.score*100+'%, a '+TR.lane+'-px open lane, hills centred or mirrored'+(bad.length?': '+bad.slice(0,6).join('; '):''));
  const seen=new Set(),woodHigh={n:0},deserts={wood:0,marsh:0};for(let i=0;i<300;i++){const rc=recs[i%recs.length],T=t.buildTerrain({recipe:rc,seed:(i*40503+7)>>>0,W:1100,top:40,bot:560});seen.add(rc+':'+T.recipe.layout);
   if(T.kind.some((k,j)=>k===K.wood&&T.lvl[j]>0))woodHigh.n++;if(rc==='desert'){if(T.has.wood)deserts.wood++;if(T.has.marsh)deserts.marsh++}}
  const all=Object.entries(t.TERRAIN_RECIPE).flatMap(([k,R])=>R.layouts.map(l=>k+':'+l[0]));
  ok(all.every(l=>seen.has(l)),'every layout turns up over 300 tiles ('+all.length+': '+all.map(l=>l.split(':')[1]).join(', ')+')'+(all.some(l=>!seen.has(l))?'; missing: '+all.filter(l=>!seen.has(l)).join(', '):''));
  ok(woodHigh.n>=20,'woods grow on hills too: '+woodHigh.n+'/300 fields have wood on a terrace');
  ok(deserts.wood===0&&deserts.marsh===0,'a desert has no woods, water or marsh of its own');
  {const O=t.buildTerrain({recipe:'desert',seed:5,W:1100,top:40,bot:560,oasis:true});ok(O.has.marsh&&!O.has.wood&&O.recipe.oasis&&/oasis/.test(O.recipe.text),'an oasis (a small marsh) in a desert by water: '+O.recipe.text)}
  {let dry=null,wet=null;for(let i=0;i<t.MW*t.MH&&!(dry&&wet);i++){if(t.CLIMS[t.climate[i]]!=='desert'||t.tiles[i]!==t.T_OPEN)continue;const tx=i%t.MW,ty=Math.floor(i/t.MW);let w=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(t.tAt(tx+dx,ty+dy)===t.T_WATER)w++;
    if(w&&!wet)wet={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE};if(!w&&!dry)dry={x:(tx+.5)*t.TILE,y:(ty+.5)*t.TILE}}const de={c:'desert',t:t.T_OPEN};
   ok(dry&&!t.terrainAt(dry.x,dry.y,de).oasis&&(!wet||t.terrainAt(wet.x,wet.y,de).oasis),'the world decides: a desert tile by water has an oasis'+(wet?'':' (no such tile on this map)')+', a dry one none')}
  ok(dropped<=20,'a fair field is found without dropping features for most tiles ('+(200-dropped)+'/200; '+(tried/200).toFixed(2)+' sub-seeds on average)')}
 // ---- a lab field to try the rules on: a level-2 hill, a wood and a marsh, no scattered trees
 G.mode='world';G.modal=false;
 const lab=(left,right,ground,extra)=>{L.start({leftGroups:left,rightGroups:right,deploy:false,ai:false,paused:true,morale:false,seed:5,ground,...extra});const B=t.B;B.obs=[];return B};
 let B=lab([{type:'hum_bow',count:1},{type:'hum_knight',count:1},{type:'dw_clan',count:1},{type:'elf_glade',count:1},{type:'orc_grunt',count:1},{type:'hum_foot',count:1}],[{type:'hum_foot',count:1},{type:'troll',count:1}],
  {hills:[{x:.5,y:.5,r:160,top:2}],woods:[{x:.15,y:.25,r:70}],marsh:[{x:.15,y:.75,r:70}],seed:3});
 const TT=B.terrain,cs=TT.cs;ok(TT&&TT.has.hills&&TT.has.wood&&TT.has.marsh&&B.env.terrain===true,'a lab ground lays a hill, a wood and a marsh');
 const cellWhere=f=>{for(let i=0;i<TT.C*TT.R;i++)if(f(i))return{i,x:(i%TT.C+.5)*cs,y:(Math.floor(i/TT.C)+.5)*cs};return null};
 const lv=n=>cellWhere(i=>TT.lvl[i]===n&&TT.up[i]<0&&TT.kind[i]===0),open0=lv(0),top1=lv(1),top2=lv(2),wood=cellWhere(i=>TT.kind[i]===K.wood&&TT.lvl[i]===0&&TT.up[i]<0),marsh=cellWhere(i=>TT.kind[i]===K.marsh&&TT.up[i]<0),slope=cellWhere(i=>TT.up[i]>=0&&TT.kind[i]===0);
 ok(open0&&top1&&top2&&wood&&marsh&&slope,'the fixture field has open ground, levels 1 and 2, a slope, wood and marsh');
 const U=type=>B.units.find(u=>u.type===type&&u.hp>0),at=(u,p,dx=0,dy=0)=>{u.x=p.x+dx;u.y=p.y+dy;return u};
 const bow=U('hum_bow'),knight=U('hum_knight'),dwarf=U('dw_clan'),elf=U('elf_glade'),orc=U('orc_grunt'),foot=B.units.find(u=>u.type==='hum_foot'&&u.team===0),foe=B.units.find(u=>u.type==='hum_foot'&&u.team===1),troll=U('troll');
 // range by level, only rewritten when the level changes; D2: the old whole-field rule gone with terrain
 const R0=t.ST.hum_bow.range,rangeAt=p=>{at(bow,p);t.terrainStep();return bow.s.range};
 ok(near(rangeAt(open0),R0)&&near(rangeAt(top1),R0*(1+H.range))&&near(rangeAt(top2),R0*(1+2*H.range))&&near(rangeAt(open0),R0),'range by level: '+[0,1,2].map(n=>Math.round(R0*(1+n*H.range))).join(', ')+' (+7.5% a level), back to '+R0+' off the hill');
 {at(bow,top2);t.terrainStep();const s=bow.s;t.terrainStep();ok(bow.s===s&&s!==t.ST.hum_bow,'the stats are copied once, then rewritten in place only on a change of level')}
 {const T2=B.terrain,i=T2.C*Math.floor(top2.y/cs)+Math.floor(top2.x/cs),k0=T2.kind[i];T2.kind[i]=K.wood;at(bow,top2);t.terrainStep();const r2=bow.s.range,w2=t.groundMul(knight.x===0?knight:at(knight,top2),1,0);T2.kind[i]=k0;
  ok(near(r2,R0*(1+2*H.range))&&near(w2,TG.wood.spd.mounted),'woods on a hilltop: the range from its height and the woods’ slow together')}
 // speed: woods and marsh by foot/mounted/big, the race exemptions (D7), slopes
 const gm=(u,p,mx=1,my=0)=>{at(u,p);return t.groundMul(u,mx,my)};
 ok(near(gm(foot,wood),TG.wood.spd.foot)&&near(gm(knight,wood),TG.wood.spd.mounted)&&near(gm(troll,wood),TG.wood.spd.big)&&near(gm(elf,wood),1),'woods: foot ×'+TG.wood.spd.foot+', riders and big ×'+TG.wood.spd.mounted+', elves ×1');
 // Woodcraft (a character's skill): your hero, a companion or a lord who has it is slowed less in the woods; troops never
 {const WC=t.WOODCRAFT,f=TG.wood.spd.foot,lv=P.sk.wood.lv;P.sk.wood.lv=5;const h={...foot,hero:true},c={...foot,unit:{isChar:true,skill:k=>k==='wood'?10:0}};
  const exp=n=>1-(1-f)*(1-Math.min(WC.cap,WC.per*n));
  ok(near(gm(h,wood),exp(5))&&near(gm(c,wood),exp(10))&&near(gm(foot,wood),f)&&near(gm(h,marsh),TG.marsh.spd.foot),'Woodcraft in the woods: your hero at 5 ×'+exp(5).toFixed(2)+', a character at 10 ×'+exp(10).toFixed(2)+', a troop ×'+f+' as ever; marsh as ever');
  P.sk.wood.lv=lv}
 ok(near(gm(foot,marsh),TG.marsh.spd.foot)&&near(gm(knight,marsh),TG.marsh.spd.mounted)&&near(gm(troll,marsh),TG.marsh.spd.big)&&near(gm(orc,marsh),1)&&near(gm(foot,open0),1),'marsh: foot ×'+TG.marsh.spd.foot+', riders ×'+TG.marsh.spd.mounted+', big ×'+TG.marsh.spd.big+', orcs ×1; open ×1');
 {const d=TT.up[slope.i],ux=t.TDX[d],uy=t.TDY[d];
  ok(near(gm(foot,slope,ux,uy),H.climb.foot)&&near(gm(knight,slope,ux,uy),H.climb.mounted)&&near(gm(troll,slope,ux,uy),H.climb.big)&&near(gm(foot,slope,-ux,-uy),H.descend)&&near(gm(foot,slope,-uy,ux),1)&&near(gm(dwarf,slope,ux,uy),1)&&near(gm(dwarf,slope,-ux,-uy),H.descend),'slopes: climbing ×'+H.climb.foot+' (riders ×'+H.climb.mounted+', big ×'+H.climb.big+'), descending ×'+H.descend+', across ×1; dwarves climb freely');
  // climbState for the art; a climb breaks cohesion
  {const cl=(p,dir,spd)=>{at(foot,p);foot.dir=dir;foot.spdNow=spd;return t.climbState(foot)},g=B.groups[foot.grp];g.order='hold';foot.run=0;
   ok(cl(slope,Math.atan2(uy,ux),20)==='up'&&cl(slope,Math.atan2(-uy,-ux),20)==='down'&&cl(slope,Math.atan2(uy,ux),0)===null&&cl(open0,0,20)===null,'climbState: up, down, or null standing or on the flat');
   cl(slope,Math.atan2(uy,ux),.5);const up=t.cohesionReady(foot);cl(slope,Math.atan2(-uy,-ux),.5);const down=t.cohesionReady(foot);foot.spdNow=0;ok(!up&&down,'climbing breaks cohesion while it lasts (going down does not)')}
  // momentum: up and down a slope, woods, marsh
  const gr=(u,p,mx,my)=>{at(u,p);u.run=0;return t.groundRun(u,mx,my,1)};
  ok(near(gr(knight,slope,ux,uy),H.runUp)&&near(gr(knight,slope,-ux,-uy),H.runDown)&&near(gr(knight,wood,1,0),TG.wood.run)&&near(gr(knight,marsh,1,0),TG.marsh.run)&&near(gr(orc,marsh,1,0),1)&&near(gr(knight,open0,1,0),1),'charge momentum builds ×'+H.runUp+' uphill, ×'+H.runDown+' downhill, ×'+TG.wood.run+' in woods, ×'+TG.marsh.run+' in marsh');
  // stamina: running uphill, in marsh (not orcs, not dwarves uphill)
  const drain=(u,p,dir)=>{at(u,p);u.dir=dir;u.sta=80;t.fatigueStep(u,1,true,false,false,false);return 80-u.sta},flat=drain(foot,open0,0);
  ok(near(drain(foot,marsh,0),flat*TG.marsh.sta,1e-9)&&near(drain(orc,marsh,0)/(orc.vig||1),drain(orc,open0,0)/(orc.vig||1),1e-9)&&near(drain(foot,slope,Math.atan2(uy,ux)),flat*H.climbSta,1e-9)&&near(drain(foot,slope,Math.atan2(-uy,-ux)),flat,1e-9)&&near(drain(dwarf,slope,Math.atan2(uy,ux)),drain(dwarf,open0,0),1e-9),'stamina: running in marsh ×'+TG.marsh.sta+' (orcs ×1), uphill ×'+H.climbSta+' (dwarves ×1), downhill ×1')}
 // the speed hooks in place: a soldier's own move (actors.js), a rout (morale.js)
 {for(const u of B.units)if(u.hp>0&&u.team===1){u.x=t.BW-20;u.y=20}
  const step=(u,p)=>{at(u,p);const g=B.groups[u.grp];g.order='charge';g.tgt=null;at(foe,p,400,0);u.rt=0;u.tgt=null;u.cd=9;const x0=u.x,y0=u.y;t.aiUnit(u,.05,null);return Math.hypot(u.x-x0,u.y-y0)};
  const a=step(foot,open0),w=step(foot,wood),m=step(foot,marsh);ok(a>0&&near(w/a,TG.wood.spd.foot,1e-6)&&near(m/a,TG.marsh.spd.foot,1e-6),'a soldier moving through woods and marsh goes ×'+(w/a).toFixed(2)+' and ×'+(m/a).toFixed(2)+' as far');
  const rs=(u,p)=>{at(u,p);at(foe,p,600,0);const x0=u.x;t.routStep(u,.05);return Math.abs(u.x-x0)};ok(near(rs(knight,wood)/rs(knight,open0),TG.wood.spd.mounted,1e-6),'routing riders are slowed by woods too')}
 // charges: downhill ×2.22, flat ×1.9, uphill ×1.59 at full momentum; into woods the bonus halved
 {const ch=(pa,pt,rlv)=>{at(knight,pa);at(foe,pt,4,0);foe.face=-1;foe.dir=Math.PI;foe.inSlot=false;knight.run=t.CHARGE.run;knight.sta=100;if(rlv==null)delete knight.rlv;else knight.rlv=rlv;knight.kx=knight.ky=0;return t.chargeMul(knight,foe)};
  ok(t.unitClass(foe.s)!=='spear','(the charged foot do not brace)');
  const dn=ch(top2,top1),fl=ch(top1,top1),upc=ch(top1,top2),fl0=ch(open0,open0),wd=ch(wood,wood);
  ok(near(dn,1+t.CHARGE.cav*(1+H.charge))&&near(fl,1+t.CHARGE.cav)&&near(upc,1+t.CHARGE.cav*(1-H.charge))&&near(fl0,fl),'a full cavalry charge: downhill ×'+dn.toFixed(3)+', flat ×'+fl.toFixed(2)+', uphill ×'+upc.toFixed(3));
  ok(near(wd,1+t.CHARGE.cav*TG.wood.chargeIn),'a charge into woods: its bonus halved (×'+wd.toFixed(2)+')');
  // the run's height lags behind the runner: down off a hill keeps it a while, a long run on the flat loses it
  at(knight,top2);knight.run=0;t.groundRun(knight,1,0,1);knight.run=1;at(knight,open0);t.groundRun(knight,1,0,20);const kept=knight.rlv;for(let k=0;k<20;k++)t.groundRun(knight,1,0,20);
  ok(kept>1&&knight.rlv<.01,'the height a charge comes from follows the rider ('+kept.toFixed(2)+' just off the crest, '+knight.rlv.toFixed(3)+' after a long run on the flat)')}
 // melee from higher ground; from marsh
 {// (hit() does not mind the distance: each stands in his own cell, the foe facing the attacker)
  const dmg=(pa,pt)=>{at(foot,pa);at(foe,pt);foe.dir=Math.atan2(foot.y-foe.y,foot.x-foe.x);foe.face=foot.x>=foe.x?1:-1;foe.inSlot=false;foe.hp=foe.max=1e6;const r=Math.random;Math.random=()=>.5;try{t.hit(foot,foe,100)}finally{Math.random=r}return 1e6-foe.hp};
  const ex=(p,q)=>{foe.x=q.x;foe.y=q.y;return t.groundHit({x:p.x,y:p.y,s:foot.s,unit:foot.unit},foe)};
  ok(near(ex(top1,open0),1+H.melee)&&near(ex(top2,top1),1+H.melee)&&near(ex(open0,open0),1)&&near(ex(open0,top1),1),'high ground: a blow at a foe a level lower ×'+(1+H.melee)+'; level or uphill ×1');
  ok(near(ex(marsh,open0),TG.marsh.hit)&&near(t.groundHit({x:marsh.x,y:marsh.y,s:orc.s,unit:orc.unit},foe),1),'marsh: blows ×'+TG.marsh.hit+' (orcs ×1)');
  const flatHit=dmg(open0,{x:open0.x+cs,y:open0.y}),highHit=dmg(top1,open0);ok(flatHit>0&&Math.abs(highHit/flatHit-(1+H.melee))<.02,'in hit(): the same blow on the level '+flatHit+', from a level higher '+highHit)}
 // woods: missiles, sight, cohesion, shield wall and wedge
 {const row=wood.i/TT.C|0,cc=TT.C>>1,saveK=TT.kind.slice(),saveL=TT.lvl.slice(),y=(row+.5)*cs;TT.kind.fill(0);TT.lvl.fill(0);for(let c=cc;c<cc+3;c++)TT.kind[row*TT.C+c]=K.wood;TT.has.wood=true;t.terrainIndex(TT);
  for(const u of B.units)if(u.hp>0){u.x=40;u.y=t.BH-40;u.cd=99}
  const shoot=(arrow,N)=>{let stopped=0;const r=Math.random;Math.random=t.seeded(4242);try{for(let k=0;k<N;k++){B.arrows=[{...arrow}];for(let s=0;s<60&&B.arrows.length&&B.arrows[0].x<(cc+5)*cs;s++)t.updateProjectiles(1/60);if(!B.arrows.length||B.arrows[0].x<(cc+3)*cs)stopped++}}finally{Math.random=r}return stopped};
  const N=400,bolt={x:(cc-2)*cs,y:y-6,vx:320,vy:0,team:1,dmg:0,life:2,a:0,elf:false,tk:0,src:{}},low={x:(cc-2)*cs,y,vx:200,vy:0,z:2,vz:0,g:0,t:0,team:1,dmg:0,life:9,a:0,elf:false,tk:0,arc:true,src:{}};
  const sb=shoot(bolt,N),sl=shoot(low,N),se=shoot({...bolt,elf:true},N),sm=shoot({...bolt,magic:true,col:'#fff'},N),sh=shoot({...low,z:30},N),exp=1-(1-TG.wood.stop)**3;
  ok(sb>N*(exp-.07)&&sb<N*(exp+.07)&&sl>N*(exp-.07)&&sl<N*(exp+.07),'3 wood cells stop about '+Math.round(exp*100)+'% of low missiles: bolts '+sb+'/'+N+', low arrows '+sl+'/'+N);
  {const r=Math.random;Math.random=t.seeded(77);let n=0,again=0;try{for(let k=0;k<N;k++){const a={};if(t.woodStops(a,(cc+1)*cs+8,y,(cc+1)*cs+8,y,true))n++;if(t.woodStops(a,(cc+1)*cs+8,y,(cc+1)*cs+8,y,true))again++}}finally{Math.random=r}
   ok(n>N*(TG.wood.canopy-.07)&&n<N*(TG.wood.canopy+.07)&&again===0,'an arrow coming down into woods is caught by the canopy once, about '+TG.wood.canopy*100+'% ('+n+'/'+N+')')}
  ok(se===0&&sm===0&&sh===0,'elves, magic and high arcs pass the woods ('+se+', '+sm+', '+sh+')');
  const a={x:(cc-1)*cs+8,y},b={x:(cc+4)*cs+8,y},b2={x:(cc+2)*cs+8,y};
  ok(t.terrainBlocksView(a,b)&&!t.moraleVisible(a,b)&&!t.terrainBlocksView(a,b2),'three wood cells block a morale view; two do not');
  {const F=t.buildTerrain({recipe:'forest',seed:4,W:1100,top:40,bot:560}),save=B.terrain;let same=0,n=0,blk=0;B.terrain=F;const pts=[];const rr=t.seeded(11);for(let k=0;k<300;k++)pts.push({x:rr()*1100,y:rr()*600});
   const real=pts.map((p,k)=>t.terrainBlocksView(p,pts[(k*7+3)%300])),S=F.woodSum;F.woodSum=Int32Array.from(S,(v,i)=>Math.floor(i/(F.C+1))*(i%(F.C+1))*1000);
   pts.forEach((p,k)=>{n++;const v=t.terrainBlocksView(p,pts[(k*7+3)%300]);if(v===real[k])same++;if(v)blk++});F.woodSum=S;B.terrain=save;
   ok(same===n&&blk>0,'the woods-in-the-box shortcut never changes a view ('+same+'/'+n+' alike, '+blk+' blocked)')}
  TT.lvl[row*TT.C+cc-1]=1;ok(!t.terrainBlocksView(a,b)&&t.moraleVisible(a,b),'a viewer a level higher sees over the woods');TT.lvl[row*TT.C+cc-1]=0;
  TT.kind.set(saveK);TT.lvl.set(saveL);t.terrainIndex(TT)}
 {at(foot,wood);const g=B.groups[foot.grp];g.order='hold';foot.spdNow=0;foot.run=0;const inW=t.cohesionReady(foot);at(foot,open0);ok(!inW&&t.cohesionReady(foot),'woods break cohesion');
  g.shieldWall=true;g.walk=true;g.run=false;const sw=t.wallReady(foot);at(foot,wood);const sww=t.wallReady(foot);g.shieldWall=false;
  ok(sw&&!sww,'no shield wall in woods (ready on open ground)')}
 L.exit();G.mode='world';G.modal=false;
 {const cav=lab([{type:'hum_knight',count:8,form:'wedge'}],[{type:'hum_foot',count:1}],{woods:[{x:.3,y:.5,r:50}],seed:2},{distance:500});const g=Object.keys(cav.groups).find(id=>cav.groups[id].form==='wedge'),m=t.grpUnits(g);
  const n0=t.wedgeMembers(g).length,WT=cav.terrain;let ix=-1;for(let i=0;i<WT.C*WT.R;i++)if(WT.kind[i]===K.wood){ix=i;break}
  const wx=(ix%WT.C+.5)*WT.cs,wy=((ix/WT.C|0)+.5)*WT.cs,d=wx-m[0].x,e=wy-m[0].y;for(const u of m){u.x+=d;u.y+=e}const inWood=m.filter(u=>t.inWood(u)).length;
  ok(n0===8&&inWood>0&&t.wedgeMembers(g).length<=8-inWood,'riders in woods do not count toward the wedge ('+n0+' formed on open ground; '+inWood+' of them moved into the wood)')}
 // ---- D6: none in sieges, raids, tournaments; D2, no props, no desert woods, and same place same field in a real battle
 L.exit();G.mode='world';G.modal=false;
 const envAt=()=>t.battleEnv(false);
 G.enc={kind:'siege'};const sg=t.groundSpecFor({},envAt());G.enc={kind:'raid'};const rd=t.groundSpecFor({},envAt());G.enc={kind:'party'};const pt=t.groundSpecFor({},envAt()),tn=t.groundSpecFor({tournament:true},envAt());
 ok(sg===null&&rd===null&&tn===null&&pt&&pt.recipe,'D6: no terrain in sieges, raids or tournaments; a field battle has one ('+pt.recipe+')');
 const find=(clim,terr)=>{for(let i=0;i<t.MW*t.MH;i++){if(t.CLIMS[t.climate[i]]!==clim||t.tiles[i]!==terr)continue;const x=(i%t.MW+.5)*t.TILE,y=(Math.floor(i/t.MW)+.5)*t.TILE;if(t.TOWNS.every(w=>Math.hypot(w.x-x,w.y-y)>60))return{x,y}}return null};
 const fight=(spot,opts)=>{P.x=spot.x;P.y=spot.y;P.troops={hum_bow:4,hum_foot:4};const enemies=['militia','militia','archer'];G.enc={kind:'party',ref:{x:P.x,y:P.y,cool:0},list:enemies,allies:[],foes:[]};t.startBattle({enemies,tournament:false,...opts});return t.B};
 const forest=find('grass',t.T_FOREST),hill=find('grass',t.T_HILL);
 {let B1=fight(forest);const h1=gridHash(B1.terrain);
  ok(B1.terrain&&B1.terrain.recipe.kind==='forest'&&!B1.env.text.includes('15%'),'a battle in a forest gets the forest recipe: '+B1.env.text);
  ok(B1.obs.length===0,'with terrain no scattered trees, rocks or props: the woods are the forest (the owner reversed D10; '+B1.obs.length+' obstacles)');
  const B2=fight(forest);ok(gridHash(B2.terrain)===h1,'D4: the same place gives the same field ('+h1+')')}
 {const B3=fight(hill),b=B3.units.find(u=>u.type==='hum_bow'),lv=t.levelAt(b.x,b.y);ok(B3.terrain.has.hills&&near(b.s.range,t.ST.hum_bow.range*(1+H.range*lv)),'D2: on a hill field archers reach by the level they stand on ('+lv+': '+Math.round(b.s.range)+'), no whole-field +15%')}
 {const desert=find('desert',t.T_OPEN),Bd=fight(desert);let woods=0;for(let k=0;k<200;k++){const T=t.buildTerrain({recipe:'desert',seed:k*7919+5,W:1100,top:40,bot:560});if(T.has.wood||T.has.marsh)woods++}
  ok(Bd.terrain&&Bd.terrain.recipe.kind==='desert'&&!Bd.terrain.has.wood&&!Bd.terrain.has.marsh&&Bd.obs.length===0&&woods===0,'a desert field has no woods or marsh (nor any of 200 desert recipes: '+woods+'), and no scattered cacti')}
 {ev('TERRAIN.on=false');const Bf=fight(forest);ok(!Bf.terrain&&Bf.obs.filter(x=>x.kind==='tree').length>=12,'terrain off: the forest field has its scattered trees as ever ('+Bf.obs.length+')');ev('TERRAIN.on=true')}
 {ev('TERRAIN.on=false');const B4=fight(hill),b=B4.units.find(u=>u.type==='hum_bow');ok(!('terrain' in B4)&&!B4.env.terrain&&near(b.s.range,t.ST.hum_bow.range*1.15),'terrain off: no B.terrain, and the old hill rule (+15%) is back');ev('TERRAIN.on=true')}
 {const B5=fight(hill,{tournament:true});ok(!B5.terrain,'a tournament has no terrain')}
 ev('B=null');G.mode='world';G.modal=false;
 // ---- a lab ground of none is the flat battle whatever TERRAIN.on; generated ground is reproducible
 const off=run('none',false),noneOn=run('none',true),auto1=run('auto',true),auto2=run('auto',true);
 ok(off===noneOn,'a lab ground of none is the flat battle, terrain on or off ('+off+')');
 ok(auto1===auto2&&auto1!==off,'a battle on generated ground is reproducible ('+auto1+') and differs from the flat one');
 // ---- the arrows' tree memory: more than 32 trees no longer alias (projectiles.js)
 {L.start({leftGroups:[{type:'hum_bow',count:1}],rightGroups:[{type:'hum_foot',count:1}],deploy:false,ai:false,paused:true,morale:false,seed:5});const B=t.B;for(const u of B.units){u.x=40;u.y=t.BH-40;u.cd=99}
  const y=200;B.obs=Array.from({length:33},(_,k)=>({kind:'tree',x:k===0?300:k===32?400:900+k*20,y:k===0||k===32?y:60,r:6}));
  let n=0;const r=Math.random;Math.random=()=>n++===0?.99:0;try{B.arrows=[{x:280,y:y-6,vx:320,vy:0,team:1,dmg:0,life:2,a:0,elf:false,tk:0,src:{}}];for(let s=0;s<30&&B.arrows.length;s++)t.updateProjectiles(1/60)}finally{Math.random=r}
  ok(!B.arrows.length||B.arrows[0].x<400,'an arrow that passed tree 0 can still be stopped by tree 32 (no bit alias)');
  const a={tk:0};t.treeMark(a,0);ok(t.treePast(a,0)&&!t.treePast(a,32)&&(t.treeMark(a,33),t.treePast(a,33))&&a.tk===1,'trees 0-31 stay in the bitmask, later ones in a list');L.exit()}
 // ======== phase 2: rivers, fords and bridges (D1: deep water wadeable but punishing) ========
 {const V=t.TERRAIN_RIVER,cellK=(T,x,y)=>T.kind[T.C*Math.floor(y/T.cs)+Math.floor(x/T.cs)],rowHas=(T,y,k)=>{const r=Math.floor(y/T.cs);for(let c=0;c<T.C;c++)if(T.kind[r*T.C+c]===k)return true;return false};
  // ---- generation: determinism, isolation, fairness, the crossings contract
  let calls=0;const r0=Math.random;Math.random=()=>{calls++;return r0()};let R1,R2,R3;
  try{const sp=s=>({recipe:'open',seed:s,W:1100,top:40,bot:560,river:{bridge:true}});R1=t.buildTerrain(sp(4242));R2=t.buildTerrain(sp(4242));R3=t.buildTerrain(sp(9001))}finally{Math.random=r0}
  ok(calls===0&&gridHash(R1)===gridHash(R2)&&gridHash(R1)!==gridHash(R3)&&R1.has.water,'rivers: same seed, same river ('+gridHash(R1)+'); another seed, another; never Math.random ('+calls+' calls)');
  {const keys=o=>Object.keys(o).sort().join(),C=R1.ai.crossings;
   ok(C.length===2&&C[0].y<C[1].y&&C.every(c=>keys(c)==='kind,w,x,x0,x1,y,y0,y1'&&c.w===V[c.kind]&&c.y1-c.y0===c.w&&c.y===(c.y0+c.y1)/2&&c.x0<c.x&&c.x<c.x1&&c.x1-c.x0===2*V.half&&cellK(R1,c.x,c.y)===(c.kind==='ford'?K.ford:K.bridge)&&cellK(R1,c.x0+1,c.y)===cellK(R1,c.x1-1,c.y)&&cellK(R1,c.x0-8,c.y)<K.ford&&cellK(R1,c.x1+8,c.y)<K.ford&&rowHas(R1,c.y0-8,K.deep)&&rowHas(R1,c.y1+8,K.deep)),
    'the crossings contract (B.terrain.ai.crossings): sorted {kind, x, y, w, y0, y1, x0, x1}; a ford '+V.ford+' px and a bridge '+V.bridge+' px along the river, x0-x1 its water, dry banks, deep water above and below: '+JSON.stringify(C.map(c=>({kind:c.kind,x:Math.round(c.x),y:c.y,x0:c.x0,x1:c.x1}))));
   const ar=R1.ai.river;ok(ar&&keys(ar)==='deep,frozen,stream,w,x,x0,x1'&&ar.deep&&ar.w===2*V.half&&ar.x0<ar.x&&ar.x<ar.x1&&R1.recipe.river&&R1.recipe.river.path.length===R1.R&&R1.recipe.rivers.length===1,'ai.river {x, x0, x1, w, deep, frozen, stream} and recipe.river (its path a middle per cell row)');
   ok(!t.buildTerrain({recipe:'forest',seed:5,W:1100,top:40,bot:560}).has.water&&t.buildTerrain({recipe:'forest',seed:5,W:1100,top:40,bot:560}).ai.river===null,'no river spec, no water (ai.river null, crossings [])')}
  {const specs=[{},{bridge:true},{frozen:true},{stream:true}],recs=['open','forest','hills','swamp'],bad=[];let dropped=0,nb=0,nf=0,frozenX=0,lanes=0;
   for(let i=0;i<200;i++){const W=960+(i*37)%341,top=30+(i*13)%50,bot=600-((i*7)%40)-10,rv=specs[i%4],rc=rv.stream?'swamp':recs[(i>>2)%4],T=t.buildTerrain({recipe:rc,seed:(i*2654435761+7)>>>0,W,top,bot,river:rv}),f=t.terrainFair(T,W,top,bot),L2=T.ai.crossings,deep=!rv.frozen&&!rv.stream,fails=[];
    if(T.recipe.dropped.includes('rivers'))dropped++;if(!f.ok)fails.push((f.zone?'':' zone')+(f.score?'':' score')+(f.lane?'':' lane')+(f.river?'':' river'));if(!T.has.water)fails.push('dry');
    if(deep!==T.kind.includes(K.deep)||deep!==!!L2.length)fails.push('deep/crossings');
    for(const c of L2)if(Math.abs(c.x-W/2)>V.mid||c.y0<top+V.edge||c.y1>bot-V.edge)fails.push('crossing place');
    for(let k=0;k<T.C*T.R;k++){const x=(k%T.C+.5)*T.cs;if(T.kind[k]>=K.ford&&(x<TR.zone*W||x>(1-TR.zone)*W)){fails.push('water in a zone');break}}
    if(rv.bridge&&!L2.some(c=>c.kind==='bridge')&&deep)fails.push('no bridge');if(rv.frozen&&T.kind.includes(K.deep))frozenX++;
    if(deep&&T.recipe.lane&&L2.some(c=>c.y0<T.recipe.lane.y1&&c.y1>T.recipe.lane.y0))lanes++;
    nb+=L2.filter(c=>c.kind==='bridge').length;nf+=L2.filter(c=>c.kind==='ford').length;if(fails.length)bad.push(rc+JSON.stringify(rv)+'#'+i+':'+fails.join(','))}
   ok(!bad.length&&!dropped&&!frozenX,'fairness over 200 river fields: deployment zones dry, crossings within '+V.mid+' px of the middle (both sides reach them alike) and '+V.edge+' px off the edges, the open lane over a crossing; a road bridge gives a bridge; frost and swamp streams all ford ('+nb+' bridges, '+nf+' fords; '+lanes+'/100 deep rivers with a crossing in the lane)'+(bad.length?': '+bad.slice(0,5).join('; '):''))}
  {let bad=0,gaps=new Set();for(let i=0;i<60;i++){const top=100+(i%7)*3,bot=top+270+(i%5)*10,T=t.buildTerrain({recipe:['open','forest','hills'][i%3],seed:(i*40503+11)>>>0,W:960,top,bot,river:{bridge:i%2===0}});
    if(T.recipe.dropped.includes('rivers')||!t.terrainFair(T,960,top,bot).ok||!T.ai.crossings.length)bad++;else gaps.add(T.recipe.river.gap)}
   ok(!bad,'a short field (270-310 px, a phone’s): the river is kept, its crossings closer together ('+[...gaps].sort((a,b)=>a-b).join(', ')+' px apart at least)'+(bad?'; '+bad+'/60 lost it':''))}
  // ---- the world: water beside the tile runs a river; a road bridge near gives a bridge; frost freezes it; deserts and monsters none
  {const near=(i,f,N=1)=>{const tx=i%t.MW,ty=Math.floor(i/t.MW);for(let dy=-N;dy<=N;dy++)for(let dx=-N;dx<=N;dx++)if((dx||dy)&&f(tx+dx,ty+dy))return true;return false},water=(a,b)=>t.tAt(a,b)===t.T_WATER,
    rb=(a,b)=>t.tAt(a,b)===t.T_ROAD&&(water(a-1,b)&&water(a+1,b)||water(a,b-1)&&water(a,b+1)),spot=i=>({x:(i%t.MW+.5)*t.TILE,y:(Math.floor(i/t.MW)+.5)*t.TILE});
   let wet=-1,dry=-1,br=-1,frost=-1,desert=-1;for(let i=0;i<t.MW*t.MH;i++){if(t.tiles[i]!==t.T_OPEN)continue;const cl=t.CLIMS[t.climate[i]],w=near(i,water);
    if(cl==='grass'&&w&&wet<0)wet=i;if(cl==='grass'&&!w&&dry<0)dry=i;if(cl!=='desert'&&cl!=='frost'&&w&&br<0&&near(i,rb,2))br=i;if(cl==='frost'&&w&&frost<0)frost=i;if(cl==='desert'&&w&&desert<0)desert=i}
   const at2=(i,c)=>{const p=spot(i);return t.terrainAt(p.x,p.y,{c,t:t.T_OPEN})};
   ok(wet>=0&&at2(wet,'grass').river&&!at2(dry,'grass').river,'a battle beside water has a river ('+JSON.stringify(at2(wet,'grass').river)+'), one away from it none');
   ok(br<0||at2(br,'grass').river.bridge,'a road bridge within '+V.near+' tiles gives the field a bridge'+(br<0?' (no such tile on this map)':''));
   ok(frost<0||at2(frost,'frost').river.frozen,'in the frost the river is frozen'+(frost<0?' (no such tile)':''));
   ok(desert<0||!at2(desert,'desert').river&&at2(desert,'desert').oasis,'a desert by water has an oasis, never a river'+(desert<0?' (no such tile)':''));
   {let st=0,n=0;for(let i=0;i<t.MW*t.MH&&n<200;i++){if(t.tiles[i]!==t.T_OPEN||t.CLIMS[t.climate[i]]!=='swamp'||near(i,water))continue;n++;const r=at2(i,'swamp').river;if(r&&r.stream)st++}
    ok(!n||st>n*.3&&st<n*.7,'a swamp away from water: a ford-only stream about half the time ('+st+'/'+n+')')}
   const p=spot(wet),envW={c:'grass',t:t.T_OPEN};P.x=p.x;P.y=p.y;const sp=k=>{G.enc={kind:k};return t.groundSpecFor({},envW)};
   ok(sp('party').river&&sp('lord').river&&sp('monster').river===null&&sp('cave').river===null&&sp('siege')===null,'river fields for lords and parties; none against a monster or in a cave (hills and woods only), no terrain in a siege');
   ok(/river/i.test(t.terrainEnvText({...envW,text:'X.'},'party'))&&!/river/i.test(t.terrainEnvText({...envW,text:'X.'},'monster')),'the pre-battle panel tells of the river: '+t.terrainEnvText({...envW,text:'X.'},'party'));
   const Bw=fight(p);ok(Bw.terrain&&Bw.terrain.has.water&&Bw.terrain.ai.crossings.length>0&&Bw.obs.length===0&&/river/i.test(Bw.env.text),'a battle beside water is fought over a river: '+Bw.env.text);ev('B=null');G.mode='world';G.modal=false}
  // ---- the rules, on a lab field: a river down the middle, a ford above, a bridge below
  // (wadeable deep water: phase 2's rules, kept under TERRAIN.wade (phase 4 makes it impassable: tests/routing.js); crossWay steers
  // round it there)
  L.exit();G.mode='world';G.modal=false;ev('TERRAIN.wade=true');
  const RB=lab([{type:'hum_foot',count:1},{type:'hum_knight',count:1},{type:'orc_grunt',count:1},{type:'hum_bow',count:1},{type:'hum_foot',count:16},{type:'hum_knight',count:8,form:'wedge'}],[{type:'hum_foot',count:1},{type:'troll',count:1},{type:'dw_shield',count:6}],
   {rivers:[{x:.5,crossings:[{kind:'ford',y:.22},{kind:'bridge',y:.5}]}],seed:3});
  const RT=RB.terrain,[cF,cB]=RT.ai.crossings,mid=(cF.x0+cF.x1)/2,dp={x:mid,y:t.BH*.36},fd={x:mid,y:cF.y},bg={x:(cB.x0+cB.x1)/2,y:cB.y},dry={x:cF.x0-120,y:t.BH*.36};
  ok(RT.has.water&&cellK(RT,dp.x,dp.y)===K.deep&&cellK(RT,fd.x,fd.y)===K.ford&&cellK(RT,bg.x,bg.y)===K.bridge&&cF.kind==='ford'&&cB.kind==='bridge','a lab river ({rivers:[…]}): deep water, a ford and a bridge');
  const W0=RB.units.filter(u=>u.hp>0),one=(ty,tm=0)=>W0.find(u=>u.type===ty&&u.team===tm&&t.grpUnits(u.grp).length===1),foot=one('hum_foot'),kn=one('hum_knight'),orc=one('orc_grunt'),bow=one('hum_bow'),foe=one('hum_foot',1),troll=W0.find(u=>u.type==='troll');
  const put=(u,p,dx=0,dy=0)=>{u.x=p.x+dx;u.y=p.y+dy;return u},gm=(u,p)=>{put(u,p);return t.groundMul(u,1,0)},DG=t.TERRAIN_GROUND.deep,FG=t.TERRAIN_GROUND.ford;
  ok(near(gm(foot,dp),DG.spd.foot)&&near(gm(kn,dp),DG.spd.mounted)&&near(gm(troll,dp),DG.spd.big)&&near(gm(orc,dp),DG.spd.foot),'deep water: ×'+DG.spd.foot+' for foot and riders, ×'+DG.spd.big+' for big units, orcs too');
  ok(near(gm(foot,fd),FG.spd.foot)&&near(gm(kn,fd),FG.spd.mounted)&&near(gm(troll,fd),FG.spd.big)&&near(gm(orc,fd),1),'a ford: foot ×'+FG.spd.foot+', riders ×'+FG.spd.mounted+', big ×'+FG.spd.big+', orcs ×1');
  ok([foot,kn,troll,orc].every(u=>near(gm(u,bg),1)),'a bridge: open ground (×1)');
  {for(const u of RB.units)if(u.hp>0&&u.team===1&&u!==foe){u.x=t.BW-20;u.y=20}
   const step=(u,p)=>{put(u,p);const g=RB.groups[u.grp];g.order='charge';g.tgt=null;put(foe,p,0,200);u.rt=0;u.tgt=null;u.cd=9;const x0=u.x,y0=u.y;t.aiUnit(u,.05,null);return Math.hypot(u.x-x0,u.y-y0)};
   const a=step(foot,dry),w=step(foot,dp),f=step(foot,fd);ok(a>0&&near(w/a,DG.spd.foot,1e-6)&&near(f/a,FG.spd.foot,1e-6),'a soldier wading deep water goes ×'+(w/a).toFixed(2)+', through a ford ×'+(f/a).toFixed(2)+' as far')}
  {const gr=(u,p)=>{put(u,p);u.run=0;return t.groundRun(u,1,0,1)};ok(gr(kn,dp)===0&&near(gr(kn,fd),FG.run)&&near(gr(orc,fd),1)&&near(gr(kn,bg),1),'charge momentum: none builds in deep water, ×'+FG.run+' in a ford (orcs ×1), ×1 on a bridge');
   put(kn,dp);kn.run=60;t.terrainStep();const lost=kn.run;put(kn,bg);kn.run=60;t.terrainStep();ok(lost===0&&kn.run===60,'deep water takes a rider’s momentum away (a bridge does not)')}
  {const FA=t.FATIGUE,drain=(u,p,walk)=>{put(u,p);u.dir=0;u.sta=80;t.fatigueStep(u,1,true,walk,false,false);return 80-u.sta},flat=drain(foot,dry,false);
   ok(near(drain(foot,dp,false),flat*DG.sta,1e-9)&&near(drain(foot,fd,false),flat*FG.sta,1e-9)&&near(drain(orc,fd,false),drain(orc,dry,false),1e-9)&&drain(foot,dry,true)===0&&near(drain(foot,dp,true),FA.run*DG.wade/(foot.vig||1),1e-9),'stamina: running in deep water ×'+DG.sta+', in a ford ×'+FG.sta+' (orcs ×1); wading at a walk spends '+FA.run+'/s (walking on dry ground none)')}
  {const ex=(p,q,a=foot)=>{put(foe,q);const v={x:p.x,y:p.y,s:a.s,unit:a.unit};return t.groundHit(v,foe)};
   ok(near(ex(dp,dry),DG.hit)&&near(ex(dry,dp),DG.hurt)&&near(ex(dp,{x:dp.x+8,y:dp.y}),DG.hit*DG.hurt)&&near(ex(fd,dry),FG.hit)&&near(ex(fd,dry,orc),1)&&near(ex(bg,dry),1),'melee: blows from deep water ×'+DG.hit+', at a foe in it ×'+DG.hurt+'; from a ford ×'+FG.hit+' (orcs ×1); a bridge ×1')}
  {for(const u of RB.units)if(u.hp>0&&u!==bow&&u!==foe){u.x=40;u.y=40}const shots=p=>{put(bow,p);put(foe,p,180,0);bow.shot=null;bow.cd=0;bow.tgt=null;bow.rt=0;RB.groups[bow.grp].order='hold';RB.groups[bow.grp].ax=bow.x;RB.groups[bow.grp].ay=bow.y;bow.sx=bow.sy=0;let drew=0;
     for(let k=0;k<40;k++){t.aiUnit(bow,.05,()=>{});if(bow.shot)drew++;bow.x=p.x;bow.y=p.y}return drew};
   ok(shots(dp)===0&&shots(dry)>0,'no shooting from deep water (a bowman there never draws; on the bank he does)')}
  {const g=RB.groups[foot.grp];g.order='hold';foot.spdNow=0;foot.run=0;const co=p=>{put(foot,p);return t.cohesionReady(foot)},wr=p=>{put(foot,p);return t.wallReady(foot)};
   const sh=W0.find(u=>u.type==='dw_shield'),sg=RB.groups[sh.grp];sg.shieldWall=true;sg.walk=true;sg.run=false;sg.order='hold';const wall=p=>{put(sh,p);return t.wallReady(sh)};
   ok(!co(dp)&&co(fd)&&co(bg)&&co(dry),'cohesion: lost in deep water; kept in a ford, on a bridge and on dry ground');
   ok(!wall(dp)&&!wall(fd)&&wall(bg)&&wall(dry),'shield wall: not in deep water or a ford (formations thin there); on a bridge it holds');sg.shieldWall=false}
  {const wg=Object.keys(RB.groups).find(id=>RB.groups[id].form==='wedge'),m=t.grpUnits(wg);for(const u of m){u.x=dry.x-60+(u.sx||0);u.y=dry.y+(u.sy||0)}RB.groups[wg].ax=dry.x-60;RB.groups[wg].ay=dry.y;const n0=t.wedgeMembers(wg).length;
   const d=fd.x-m[0].x,e=fd.y-m[0].y;for(const u of m){u.x+=d;u.y+=e}const inF=m.filter(u=>t.groundThin(u)).length;ok(n0===8&&inF>0&&t.wedgeMembers(wg).length<=8-inF,'riders in a ford do not count toward the wedge ('+inF+' of 8 in it)')}
  ok(t.holdsBank(put(foot,{x:cF.x1+12,y:fd.y}),put(foe,fd))&&t.holdsBank(put(foot,dry),put(foe,dp))&&!t.holdsBank(put(foot,fd),put(foe,{x:fd.x+4,y:fd.y}))&&!t.holdsBank(put(foot,dry),put(foe,dry,10,0)),'a man in formation on the bank keeps it: he does not step down into the water after a foe there');
  {foot.xc=null;const way=(p,q)=>{put(foot,p);return t.crossWay(foot,q.x,q.y)},P1=way({x:cF.x0-60,y:cF.y+40},{x:cF.x1+80,y:cF.y+40});
   ok(P1&&near(P1[0],cF.x0-V.pad)&&P1[1]>=cF.y0+V.inset&&P1[1]<=cF.y1-V.inset&&foot.xc===cF,'a man whose way crosses deep water near a ford makes for its mouth ('+P1.map(Math.round)+')');
   const P2=way({x:cF.x0-4,y:cF.y+10},{x:cF.x1+80,y:cF.y+40});ok(P2&&near(P2[0],cF.x1+V.pad),'at its mouth, over to the far side');
   foot.xc=null;ok(way({x:cF.x0-20,y:t.BH*.37},{x:cF.x1+20,y:t.BH*.37})===null,'a short hop over, far from a crossing: he wades (quicker than the way round)');
   ok(way(dp,{x:cF.x1+80,y:dp.y})===null&&foot.xc===null,'and once in deep water he wades on');ok(way(dry,{x:dry.x-40,y:dry.y})===null,'a way that does not cross the river: none')}
  // marching over: a line of 16 squeezes onto a bridge (those far off its line wade); a charge goes over a bridge, not through the water
  {const g=RB.groups[Object.keys(RB.groups).find(id=>RB.groups[id].type==='hum_foot'&&t.grpUnits(id).length===16)],m=g.units;for(const u of RB.units)if(u.hp>0&&!m.includes(u)){u.x=u.team?t.BW-30:30;u.y=t.fieldTop()+10;u.hp=u.max=1e9;u.s={...u.s,spd:0}}
   g.face=0;g.currentFacing=0;g.placeAt(cB.x0-90,cB.y);t.layForm(g.id);for(const u of m){u.x=g.ax+u.sx;u.y=g.ay+u.sy}g.moveTo(cB.x1+120,cB.y,{face:0});
   const wet=new Set(),dryX=new Set();RB.paused=false;ev('B.cmdT=1e9');for(let f=0;f<60*25;f++){t.updateBattle(1/60);for(const u of m){const k=t.groundAt(u.x,u.y);if(k===K.deep)wet.add(u);else if(k===K.bridge)dryX.add(u)}}
   const over=m.filter(u=>u.x>cB.x1).length;ok(over===16&&dryX.size>=8&&wet.size<16,'a line of 16 marching over: '+dryX.size+' squeeze over the bridge, '+wet.size+' far off its line wade; '+over+'/16 across')}
  L.exit();G.mode='world';G.modal=false;ev('TERRAIN.wade=false');
  // (impassable, phase 4: the same line all over the bridge, no one in the water)
  {const B2=lab([{type:'hum_foot',count:16}],[{type:'hum_foot',count:1}],{rivers:[{x:.5,crossings:[{kind:'ford',y:.22},{kind:'bridge',y:.5}]}],seed:3}),c=B2.terrain.ai.crossings[1],g=Object.values(B2.groups).find(q=>q.player),m=g.units;
   for(const u of B2.units)if(u.team){u.x=t.BW-30;u.y=t.fieldTop()+10;u.hp=u.max=1e9;u.s={...u.s,spd:0}}g.face=0;g.currentFacing=0;g.placeAt(c.x0-90,c.y);t.layForm(g.id);for(const u of m){u.x=g.ax+u.sx;u.y=g.ay+u.sy}g.moveTo(c.x1+120,c.y,{face:0});
   const wet=new Set(),onB=new Set();B2.paused=false;ev('B.cmdT=1e9');for(let f=0;f<60*25;f++){t.updateBattle(1/60);for(const u of m){const k=t.groundAt(u.x,u.y);if(k===K.deep)wet.add(u);else if(k===K.bridge)onB.add(u)}}
   const over=m.filter(u=>u.x>c.x1).length;ok(over===16&&onB.size===16&&!wet.size,'deep water impassable (phase 4): the line of 16 all over the bridge ('+onB.size+'), none in the water; '+over+'/16 across');L.exit();G.mode='world';G.modal=false}
  {const CB=lab([{type:'hum_knight',count:1}],[{type:'hum_foot',count:1}],{rivers:[{x:.5,crossings:[{kind:'bridge',y:.5}]}],seed:3}),k=CB.units.find(u=>u.type==='hum_knight'),f=CB.units.find(u=>u.type==='hum_foot'),c=CB.terrain.ai.crossings[0];
   k.x=c.x0-100;k.y=c.y+30;f.x=c.x1+90;f.y=c.y-20;f.s={...f.s,spd:0};CB.groups[k.grp].attack(f);CB.paused=false;ev('B.cmdT=1e9');let wet=0,onB=0;for(let i=0;i<60*8&&f.hp>0;i++){t.updateBattle(1/60);const g=t.groundAt(k.x,k.y);if(g===K.deep)wet++;if(g===K.bridge)onB++}
   ok(!wet&&onB>0,'a charge goes over the bridge, not through the water (frames: '+onB+' on it, '+wet+' wading)');L.exit();G.mode='world';G.modal=false}
  {const T2=t.buildTerrain({recipe:'open',seed:1,W:1100,top:40,bot:560,river:{bridge:true}}),save=t.B;ev('B={terrain:null}');t.B.terrain=T2;const ux=T2.ai.crossings[0],hm=[{x:ux.x,y:ux.y-40,hp:1,s:{range:300}}],dw=[{x:(ux.x0+ux.x1)/2,y:ux.y-60,hp:1,s:{range:300}}];
   const l1=t.groundLabel(hm),l2=t.groundLabel(dw);ev('B=null');ok(/Deep water \(slowed, cannot shoot\)/.test(l1+l2),'the details tell of it: '+(l1||l2))}
  // ---- text, the lab key, reproducible
  {const T3=t.buildTerrain({recipe:'hills',seed:2,W:1100,top:40,bot:560,river:{bridge:true}});ok(/^A river with a bridge and a ford\./.test(T3.recipe.text)&&/Deep water/.test(T3.recipe.text),'the ground in words: '+T3.recipe.text)}
  ok(L.validate({ground:{recipe:'river',seed:3}}).ground.river&&L.validate({ground:{recipe:'hills',river:{bridge:true}}}).ground.river.bridge&&L.validate({ground:{rivers:[{x:.5,crossings:[{kind:'ford',y:.5}]}]}}).ground.rivers[0].crossings[0].kind==='ford','the lab ground key takes rivers: {recipe:"river"}, {recipe, river:{bridge, frozen, stream}}, {rivers:[{x, crossings:[{kind, y}]}]}');
  {let th=0;for(const g of [{rivers:[{x:2}]},{rivers:[{x:.5,crossings:[{kind:'moat',y:.5}]}]},{recipe:'open',river:5},{rivers:'x'},{rivers:[{x:.5,meander:900}]}])try{L.validate({ground:g})}catch(e){th++}ok(th===5,'bad river grounds are refused')}
  {const rg={recipe:'river',seed:11,river:{bridge:true}},a1=run(rg,true),a2=run(rg,true);ok(a1===a2,'a battle over a river is reproducible ('+a1+')')}}
 // ---- the lab key
 ok(L.validate({}).ground==='none'&&L.validate({ground:'auto'}).ground==='auto'&&L.validate({ground:{recipe:'hills',seed:3}}).ground.recipe==='hills','the lab ground key: none by default, auto, a recipe');
 let threw=0;for(const g of [{recipe:'moon'},{hills:[{x:2,y:.5,r:50}]},{woods:'x'},{hills:[{x:.5,y:.5,r:50,top:3}]},5])try{L.validate({ground:g})}catch(e){threw++}ok(threw===5,'bad grounds are refused');
 ok(t.terrainEnvText({c:'grass',t:t.T_OPEN,text:'X.'},'siege')==='X.','the pre-battle panel keeps the old text where there is no terrain');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
try{(0,eval)('TERRAIN.on=false');if(T.BattleLab.active)T.BattleLab.exit()}catch(e){}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
