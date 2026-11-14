'use strict';
// Fights on the map in the open (doc/OPEN_FIGHTS_DESIGN.md; the owner, 2026-11-14: "remove the battle area for hunting", "the same
// world speed", every map fight): no ring drawn, the field wider than the ring was, the world running on through the fight (its
// clock, every party not in it), the fight's own parties and your march left to it, your band's days held till it is over, and no
// encounter opened while it goes on.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,O=t.OPEN_FIGHT;window.requestAnimationFrame=()=>0;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;G.paused=false;G.speed=1;
 let tile=0;for(let i=0;i<t.WM.kind.length;i++)if(t.WM.kind[i]===t.T_OPEN&&i%t.MW>20&&i%t.MW<t.MW-20&&Math.floor(i/t.MW)>20){tile=i;break}
 Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);P.troops={hum_foot:5,hum_bow:3};
 const enemy=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+70,y:P.y,cool:0});W.parties.push(enemy);
 ok(O.on&&!O.ring&&O.reach>1&&O.world,'fights on the map are open: no ring, a wider field, the world running on');
 G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 const was=O.on;O.on=false;const old=new t.WorldBattleArea(G.enc);O.on=was;const now=new t.WorldBattleArea(G.enc);
 ok(Math.abs(now.r-old.r*O.reach)<1e-6,'the field '+O.reach+' times as wide as the ring was ('+Math.round(old.r)+' → '+Math.round(now.r)+' px), its edge past your sight');
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const b=t.B,a=b?.world;if(!a){ok(false,'a fight on the map begins');info(JSON.stringify(G.msgs.slice(-3)));return}
 {const arc=t.ctx.arc,rs=[];t.ctx.arc=function(x,y,r,...z){rs.push(r);return arc.call(this,x,y,r,...z)};try{a.draw()}finally{t.ctx.arc=arc}ok(!rs.some(r=>Math.abs(r-a.radius)<.5),'no ring drawn round the fight')
  O.ring=true;rs.length=0;t.ctx.arc=function(x,y,r,...z){rs.push(r);return arc.call(this,x,y,r,...z)};try{a.draw()}finally{t.ctx.arc=arc;O.ring=false}ok(rs.some(r=>Math.abs(r-a.radius)<.5),'with ring on, as before')}
 // (who hears of it: from the ring's edge as ever, not the open field's)
 {const J=t.WORLD_BATTLE.join,at=d=>({mapKind:'cparty',x:a.x+d,y:a.y});ok(a.ring<a.r&&a.knows(at(a.ring+J-5),0)&&!a.knows(at(a.ring+J+5),0),'armies hear of it and join from the ring\'s edge as before ('+Math.round(a.ring+J)+' px from its middle, not '+Math.round(a.r+J)+')')}
 // (the world's moment beside the fight's)
 b.paused=false;b.deploy=false;if(b.muster)b.muster.active=false;
 const others=W.lords.filter(l=>!l.dead&&!l.inside&&!a.participants.has(l)).slice(0,12),at=others.map(l=>[l.x,l.y]),e0=[enemy.x,enemy.y],p0=[P.x,P.y],c0=G.day+t.Clock.frac;
 P.tx=P.x+200;P.ty=P.y;
 for(let i=0;i<120;i++)t.openFightWorld(.05);
 ok(G.day+t.Clock.frac>c0,'the world\'s clock runs on through the fight ('+(G.day+t.Clock.frac-c0).toFixed(4)+' of a day in 6 s)');
 ok(others.some((l,i)=>Math.hypot(l.x-at[i][0],l.y-at[i][1])>.5),'the lords not in it go about their business');
 ok(enemy.x===e0[0]&&enemy.y===e0[1],'the band in the fight is the fight\'s: its own moment leaves it be');
 ok(P.x===p0[0]&&P.y===p0[1],'your march waits: you are in the fight');
 {const c1=G.day+t.Clock.frac;b.paused=true;for(let i=0;i<20;i++)t.openFightWorld(.05);ok(G.day+t.Clock.frac===c1,'the fight paused: the world waits too');b.paused=false}
 // (your band's day held through the fight, run once it is over)
 {const S=t.Systems;S.waiting.length=0;const day=G.day;let n=0;for(;G.day===day&&n<5000;n++)t.openFightWorld(.05);const held=S.waiting.map(([s,ph])=>s.name+' '+ph);
  ok(G.day===day+1&&held.includes('band day')&&held.includes('wounded day')&&!held.includes('realms day'),'a day passed in the fight: your band\'s day ('+held.filter(h=>/day/.test(h)).join(', ')+') waits, the realms\' runs');
  S.release();ok(!S.hold&&!S.waiting.length,'the fight over, your band\'s day is run')}
 {const other=t.asParty({kind:'bandits',troops:['militia'],x:P.x-60,y:P.y,cool:0}),e=G.enc;ok(t.startEncounter({kind:'party',ref:other,n:1})===false&&G.enc===e&&G.mode==='battle','no encounter opens while the fight goes on')}
 {const was=O.world;O.world=false;const c1=G.day+t.Clock.frac;for(let i=0;i<20;i++)t.openFightWorld(.05);ok(G.day+t.Clock.frac===c1,'world off: the world waits through the fight, as before');O.world=was}
 // (one near the fight, not in it: steps aside out of its way, its own moment held till the fight is over)
 {const cv=W.caravans.find(c=>!c.gone);if(!cv){ok(false,'a caravan to stand by');return}
  const d0=a.r+4;cv.x=a.x+d0;cv.y=a.y;for(let i=0;i<60&&t.B===b;i++)t.updateBattle(.05);
  const held=a.bystanders?.entries.has(cv),d=Math.hypot(cv.x-a.x,cv.y-a.y),p=[cv.x,cv.y];for(let i=0;i<60;i++)t.openFightWorld(.05);
  ok(held&&t.fightHolds(cv)&&!a.participants.has(cv)&&d>d0,'a caravan by the fight steps aside out of its way ('+Math.round(d0)+' → '+Math.round(d)+' px from its middle)');
  ok(cv.x===p[0]&&cv.y===p[1],'and waits there: the world running on leaves it be till the fight is over')}
 t.Systems.hold=null;t.Systems.waiting.length=0;
});
