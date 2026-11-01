'use strict';
// A fighter holds at his foe (battle/actors.js MELEE_HOLD; the owner, 2026-11-01: "the fighter that I fight in battle map seems to
// move weird, jiggering left right"): the arena's champion at your hero, 6 s, his steps back and forth counted; off, as before.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,H=t.MELEE_HOLD;
 const bout=()=>{Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});G.mode='world';t.startBattle({enemies:['chief'],tournament:true});const B=t.B;B.paused=false;if(B.muster)B.muster.active=false;
  const c=B.units.find(u=>u.team===1),h=B.hero;h.x=c.x-30;h.y=c.y;h.hp=h.max=1e5;let rev=0,lv=0,px=c.x;
  for(let i=0;i<60*6;i++){t.battleStep(1/60,false);const vx=c.x-px;px=c.x;if(Math.abs(vx)>.05&&Math.sign(vx)!==Math.sign(lv)){rev++;lv=vx}}return rev};
 const on=bout();H.on=false;let off;try{off=bout()}finally{H.on=true}info('turns back and forth in 6 s: held '+on+', not '+off);
 // (his lean as drawn, physics on as in the game (physics.js physLeanDrawn; the owner: "I think it's because the sprite is stretching
 // in the animation"): eased and stepped, his head off his feet by whole pixels, not flickering with each step's jolt)
 {Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:1e9});G.mode='world';(0,eval)('PHYSICS.on=true');const ar=t.TOURNEY_ARENA.on;t.TOURNEY_ARENA.on=false;// (the open field: a long walk to him, the arena's 140 px too short to read a walk by)
  try{t.startBattle({enemies:['chief'],tournament:true});const B=t.B;B.paused=false;if(B.muster)B.muster.active=false;
  const c=B.units.find(u=>u.team===1);let raw=0,drawn=0,pr=null,pd=null;for(let i=0;i<60*4;i++){t.battleStep(1/60,false);const r=Math.round(t.physLean(c)*16),d=Math.round(t.physLeanDrawn(c,16)*16);if(pr!=null&&r!==pr)raw++;if(pd!=null&&d!==pd)drawn++;pr=r;pd=d}
  ok(drawn<=3&&raw>=drawn*4,'his lean as drawn holds: his head off his feet changes '+drawn+' times in 4 s, against '+raw+' raw')}finally{(0,eval)('PHYSICS.on=false');t.TOURNEY_ARENA.on=ar}}
 ok(on<=15&&off>=on*3,'the champion at your hero holds his ground: '+on+' steps back and forth in 6 s (blows and lunges), against '+off+' without the hold');
});
