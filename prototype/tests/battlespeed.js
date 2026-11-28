'use strict';
// One speed for both kinds of battle (the owner, 2026-11-18: "Can you make battle map and world battle use the same speed?"; battle.js
// battleStep, fightSpace): a classic field and a fight on the map run on one clock, game seconds (main.js, core/time.js), so a
// swing's cooldown runs down as fast on both; its men, drawn WORLD_BATTLE.sprite times their size on the map, step as many times as far,
// so they cross as many of their own lengths a second; the speed buttons mean the same on both. Measured as a player sees it: real time
// at 1/60 s a frame, each passed through main.js's updateBattle(dt).
// No slow motion, a calm pace (the owner, 2026-11-19: "make it not look like slow motion please but just want a battle not to be so fast
// pace"): that clock is a real second a second, and the pace is the rules' own (data/units.js BATTLE_RHYTHM): a walk of about .7 of a
// man's lengths a second, a blow every 1.5 to 2.5 s, a shot every 2.5 to 4, a 20 v 20 melee as long as it was at the old slow clock; the
// map's march the one table's (data/speed.js): between a formation's walk and a charge.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 const fr=1/60,within=(a,b,q)=>Math.abs(a-b)<=q*Math.max(Math.abs(a),Math.abs(b),1e-9),med=a=>{const v=a.slice().sort((x,y)=>x-y);return v.length?v[v.length>>1]:NaN};
 const home={x:P.x,y:P.y},shooter=m=>/bow|archer/.test(m.type);
 // (the targets: a blow's and a shot's gap by the median, and a 20 v 20's melee, its first wound to its last blow, in real seconds; the
 //  melee's as long as at the old slow clock (0.33 battle s a real second, 2026-11-18: 19 to 26 s on a field, 42 to 46 on the map, seed
 //  1) or a little longer. A side that withdraws in order walks off the field after its last blow, as long as the field is wide)
 const RHYTHM={gap:[1.5,2.5],shot:[2.5,4],melee:{field:[18,34],map:[36,56]}};
 const fight=(world,sp,mine,theirs)=>{t.WORLD_BATTLE.on=world;G.mode='world';G.modal=false;P.x=home.x;P.y=home.y;P.troops=mine;
  const e=t.asParty({kind:'bandits',troops:theirs,x:P.x+70,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;if(!B||!!B.world!==world)return null;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;B.speed=sp;return B};
 // (each man's gaps between his blows or shots, in real seconds: n frames at 1/60 s)
 const blows=B=>{const at=new Map(),last=new Map(),gaps=[];let n=0,blow=null;
  return{gaps,get last(){return blow},before(){for(const m of B.units)at.set(m,m.atkAt);n++},after(pick){for(const m of B.units){if(m.hp<=0||m.atkAt==null||m.atkAt===at.get(m))continue;blow=n;if(pick&&!pick(m))continue;const l=last.get(m);if(l!=null)gaps.push((n-l)/60);last.set(m,n)}}}};
 const res={},shots=[];
 for(const sp of [1,2])for(const kind of ['field','map']){const B=fight(kind==='map',sp,{hum_levy:8,hum_bow:4},['militia','militia','militia','militia','archer','archer']);if(!B){ok(false,kind+' x'+sp+': the fight begins');continue}
  const k=kind==='map'?t.WORLD_BATTLE.sprite:1,T0=B.t,secs=sp===1?14:8,bl=blows(B);
  const v=[];let was=null;
  for(let i=0;i<secs*60&&t.B===B&&!B.over;i++){was=new Map(B.units.map(m=>[m,[m.x,m.y]]));bl.before();t.updateBattle(fr);bl.after(shooter);
   for(const m of B.units){if(m.hp<=0||m.s.mounted||shooter(m))continue;const b=was.get(m);const d=b?Math.hypot(m.x-b[0],m.y-b[1]):0;if(d>0)v.push(d/(t.actorSprite(m).ch*k)*60)}}
  if(sp===1)shots.push(...bl.gaps);
  // (one of your levies walking on open ground, by the rule: his pace at MARCH.walk, as far as the field steps him a point of his speed
  //  (core/speed.js Speed.field: the ladder's run on this field's scale), on its clock, over his length as drawn; the ground under him
  //  is each field's own, groundMul)
  const m=B.units.find(w=>w.hp>0&&w.team===0&&w.type==='hum_levy'),clock=(B.t-T0)/secs,rule=m.s.spd*t.MARCH.walk*t.Speed.field()*clock/(t.actorSprite(m).ch*k);
  res[kind+sp]={clock,walk:med(v)||0,n:v.length,rule,space:t.fightSpace(),ch:t.actorSprite(m).ch};B.over=true}
 for(const sp of [1,2]){const f=res['field'+sp],m=res['map'+sp];if(!f||!m)continue;
  ok(within(f.clock,m.clock,.05),'x'+sp+': one clock, '+f.clock.toFixed(3)+' battle s a real second on a field, '+m.clock.toFixed(3)+' on the map (a swing, a shot, a cooldown as long)');
  ok(within(f.rule,m.rule,.05),'x'+sp+': a man on foot walking crosses '+f.rule.toFixed(3)+' of his lengths a second on a field, '+m.rule.toFixed(3)+' on the map');
  ok(f.n>0&&m.n>0&&within(f.walk,m.walk,.1),'x'+sp+': and so as they go, the men on foot by their median: '+f.walk.toFixed(2)+' on a field, '+m.walk.toFixed(2)+' on the map (some run)')}
 {const a=res.field1,b=res.field2,c=res.map1,d=res.map2;if(a&&b&&c&&d)ok(within(b.clock/a.clock,2,.05)&&within(d.clock/c.clock,2,.05),'2x is twice 1x on both ('+(b.clock/a.clock).toFixed(2)+', '+(d.clock/c.clock).toFixed(2)+')')}
 if(res.field1&&res.map1)ok(res.field1.space===1&&res.map1.space===t.WORLD_BATTLE.sprite,'a field steps as ever (fightSpace '+res.field1.space+'), the map as many times as its men are drawn ('+res.map1.space+')');
 // (no slow motion: at 1x a battle second is a real second on both, so a swing, a shot and a fall play at their own speed)
 {const a=res.field1,c=res.map1;if(a&&c)ok(within(a.clock,1,.05)&&within(c.clock,1,.05),'at 1x the clock is real time: '+a.clock.toFixed(3)+' battle s a real second on a field, '+c.clock.toFixed(3)+' on the map')}
 // (a calm walk: about .7 of his lengths a second, by the rule, on both)
 {const a=res.field1,c=res.map1;if(a&&c)ok(within(a.rule,.7,.1)&&within(c.rule,.7,.1),'a walk of about .7 of his lengths a second: '+a.rule.toFixed(2)+' on a field, '+c.rule.toFixed(2)+' on the map')}
 {const g=med(shots);ok(shots.length>=8&&g>=RHYTHM.shot[0]&&g<=RHYTHM.shot[1],'a bowman draws and looses every '+g.toFixed(2)+' s by the median ('+shots.length+' gaps; between '+RHYTHM.shot.join(' and ')+')')}
 // (a 20 v 20 of levies and militia at 1x on each)
 for(const kind of ['field','map']){const B=fight(kind==='map',1,{hum_levy:20},Array(20).fill('militia'));if(!B){ok(false,kind+' 20 v 20: the fight begins');continue}
  const hp0=B.units.reduce((a,m)=>a+m.hp,0),bl=blows(B);let n=0,hit=null;
  for(;n<60*240&&t.B===B&&!B.over;n++){bl.before();t.updateBattle(fr);bl.after();
   if(hit==null&&B.units.reduce((a,m)=>a+Math.max(0,m.hp),0)<hp0)hit=n/60}
  const over=B.over,last=bl.last==null?null:bl.last/60,melee=hit==null||last==null?NaN:last-hit,g=med(bl.gaps),[lo,hi]=RHYTHM.melee[kind];B.over=true;
  info(kind+' 20 v 20: first wound '+(hit==null?'-':hit.toFixed(1))+' s, last blow '+(last==null?'-':last.toFixed(1))+' s, over at '+(n/60).toFixed(1)+' s, '+bl.gaps.length+' gaps between blows');
  ok(g>=RHYTHM.gap[0]&&g<=RHYTHM.gap[1],kind+': a man strikes every '+g.toFixed(2)+' s by the median (between '+RHYTHM.gap.join(' and ')+')');
  ok(over&&melee>=lo&&melee<=hi,kind+': a 20 v 20 melee lasts '+(over?melee.toFixed(1):'past 240')+' real s (between '+lo+' and '+hi+')')}
 // (the map's march: your army walking on the map at 1x, once under way, goes at the one table's march for its men, its load and its
 //  ground (data/speed.js SPEED.gait.march through world.js travelMul): px a game second, main.js updateWorld(Time.map(dt)); a march
 //  is slower than a charge and faster than a formation's walk (the owner, 2026-11-28: the battle's speeds everywhere))
 {t.WORLD_BATTLE.on=true;G.mode='world';G.modal=false;G.enc=null;P.troops={hum_levy:8};let best=null;
  for(const a of [0,Math.PI,Math.PI/2,-Math.PI/2]){P.x=home.x;P.y=home.y;P.tx=null;for(let i=0;i<30;i++)t.updateWorld(t.Time.map(fr));
   P.tx=home.x+Math.cos(a)*400;P.ty=home.y+Math.sin(a)*400;let n=0,went=0,want=0;
   for(let i=0;i<60*14&&P.tx!=null;i++){const x=P.x,y=P.y;t.updateWorld(t.Time.map(fr));if(i>=240){went+=Math.hypot(P.x-x,P.y-y);want+=t.Speed.px(t.MAP_BASE*t.travelMul())*fr;n++}}
   if(n>120&&(!best||n>best.n))best={n,v:went/(n*fr),want:want/(n*fr)};if(best&&best.n>480)break}
  const g=t.SPEED.gait;ok(!!best&&within(best.v,best.want,best.want*.06),'the map\'s march, once under way: '+(best?best.v.toFixed(2):'-')+' px a game second at 1x (by the table '+(best?best.want.toFixed(2):'-')+')');
  ok(!!best&&best.v>g.walk*.9&&best.v<g.run*1.1,'between a formation\'s walk ('+g.walk.toFixed(1)+') and a charge ('+g.run.toFixed(1)+')')}
});
