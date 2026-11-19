'use strict';
// One speed for both kinds of battle (the owner, 2026-11-18: "Can you make battle map and world battle use the same speed?"; battle.js
// battleStep, fightSpace): a classic field and a fight on the map run on one clock, BATTLE_PACE at BATTLE_TEMPO on screen (main.js), so a
// swing's cooldown runs down as fast on both; its men, drawn WORLD_BATTLE.sprite times their size on the map, step as many times as far,
// so they cross as many of their own lengths a second; the speed buttons mean the same on both. Measured as a player sees it: real time
// at 1/60 s a frame, each passed through main.js's updateBattle(dt*BATTLE_TEMPO).
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;G.speed=1;
 const fr=1/60,within=(a,b,q)=>Math.abs(a-b)<=q*Math.max(Math.abs(a),Math.abs(b),1e-9);
 const fight=(world,sp)=>{t.WORLD_BATTLE.on=world;G.mode='world';G.modal=false;P.troops={hum_levy:8,hum_bow:4};
  const e=t.asParty({kind:'bandits',troops:['militia','militia','militia','militia','archer','archer'],x:P.x+70,y:P.y,cool:0});W.parties.push(e);G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const B=t.B;if(!B||!!B.world!==world)return null;if(B.muster)B.muster.active=false;B.ready=true;B.paused=false;B.speed=sp;return B};
 const go=(B,secs,each)=>{for(let i=0;i<secs*60&&t.B===B&&!B.over;i++){each&&each(0);t.updateBattle(fr*t.BATTLE_TEMPO);each&&each(1)}};
 const res={};
 for(const sp of [1,2])for(const kind of ['field','map']){const B=fight(kind==='map',sp);if(!B){ok(false,kind+' x'+sp+': the fight begins');continue}
  const k=kind==='map'?t.WORLD_BATTLE.sprite:1,T0=B.t;
  const v=[];let was=null;
  go(B,8,ph=>{if(!ph){was=new Map(B.units.map(m=>[m,[m.x,m.y]]));return}
   for(const m of B.units){if(m.hp<=0||m.s.mounted||/bow|archer/.test(m.type))continue;const b=was.get(m);const d=b?Math.hypot(m.x-b[0],m.y-b[1]):0;if(d>0)v.push(d/(t.actorSprite(m).ch*k)*60)}});
  // (one of your levies walking on open ground, by the rule: his pace at MARCH.walk, as far as the field steps him (fightSpace), on its
  //  clock, over his length as drawn; the ground under him is each field's own, groundMul)
  const m=B.units.find(w=>w.hp>0&&w.team===0&&w.type==='hum_levy'),clock=(B.t-T0)/8,rule=m.s.spd*t.MARCH.walk*t.fightSpace()*clock/(t.actorSprite(m).ch*k);
  v.sort((a,b)=>a-b);res[kind+sp]={clock,walk:v[v.length>>1]||0,n:v.length,rule,space:t.fightSpace()};B.over=true}
 for(const sp of [1,2]){const f=res['field'+sp],m=res['map'+sp];if(!f||!m)continue;
  ok(within(f.clock,m.clock,.05),'x'+sp+': one clock, '+f.clock.toFixed(3)+' battle s a real second on a field, '+m.clock.toFixed(3)+' on the map (a swing, a shot, a cooldown as long)');
  ok(within(f.rule,m.rule,.05),'x'+sp+': a man on foot walking crosses '+f.rule.toFixed(3)+' of his lengths a second on a field, '+m.rule.toFixed(3)+' on the map');
  ok(f.n>0&&m.n>0&&within(f.walk,m.walk,.1),'x'+sp+': and so as they go, the men on foot by their median: '+f.walk.toFixed(2)+' on a field, '+m.walk.toFixed(2)+' on the map (some run)')}
 {const a=res.field1,b=res.field2,c=res.map1,d=res.map2;if(a&&b&&c&&d)ok(within(b.clock/a.clock,2,.05)&&within(d.clock/c.clock,2,.05),'2x is twice 1x on both ('+(b.clock/a.clock).toFixed(2)+', '+(d.clock/c.clock).toFixed(2)+')')}
 // (the map fight's own world keeps the map's travel clock: its comers walk in at the map's pace, battle.js dw)
 if(res.field1&&res.map1)ok(res.field1.space===1&&res.map1.space===t.WORLD_BATTLE.sprite,'a field steps as ever (fightSpace '+res.field1.space+'), the map as many times as its men are drawn ('+res.map1.space+')');
});
