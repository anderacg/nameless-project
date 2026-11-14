'use strict';
// Seamless fights (battle/worldbattle.js SEAMLESS; the owner, 2026-11-12: "make battle seamless without preparations, no talking"): an
// encounter on the map opens no window, the fight begins at once where both armies stand, with no muster; sieges keep theirs; off, as before.
Kit.suite(({ok,info})=>{const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.SEAMLESS.on=true;
 const end=()=>{if(t.B)t.B.over=true;t.B=null;G.enc=null;G.mode='world';G.modal=false;t.hidePanel();Kit.world()};
 try{
  P.troops={hum_foot:4,hum_bow:2};
  // ---- a band meets you: the fight at once, no window, no muster
  {const band=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(band);
   t.startEncounter({kind:'party',ref:band,list:band.troops.slice()});const b=t.B;
   ok(G.mode==='battle'&&b&&b.world&&!b.muster&&!b.ready&&!b.paused,'a band met: the fight begins at once on the map, no muster, not paused ('+G.mode+')');
   ok(!document.querySelector('#panel [data-act="fight"],#panel [data-act="flee"],#panel [data-act="auto"]'),'no window first: no Fight, Flee or Auto-resolve to press');
   const mine=b.units.filter(u=>u.team===0&&!u.hero),foes=b.units.filter(u=>u.team===1);ok(mine.length&&foes.length,'both sides on the field ('+mine.length+' yours, '+foes.length+' theirs)');
   t.updateBattle(.5);ok(t.B===b&&b.t>0,'and it runs at once');end()}
  // ---- a beast falls on you: the same
  {const m=t.asMonster({id:'boar',x:P.x+30,y:P.y,hx:P.x+30,hy:P.y,lv:1,n:2,t:0,a:0,cool:0});W.monsters=[m];t.startMonster(m);
   ok(G.mode==='battle'&&t.B&&!t.B.muster,'a beast met: the fight at once too');end()}
  // ---- the switch off: its window again, then its muster
  {t.SEAMLESS.on=false;const band=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(band);
   t.startEncounter({kind:'party',ref:band,list:band.troops.slice()});ok(G.mode==='dialog'&&!!document.querySelector('#panel [data-act="fight"]'),'off: its window first, as before');
   t.act('fight');ok(G.mode==='battle'&&t.B&&t.B.muster?.active,'and the armies muster before the fight');end();t.SEAMLESS.on=true}
  // ---- a cornered band: no parley first, the fight at once
  {const band=t.asParty({kind:'bandits',troops:['militia'],x:P.x+20,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(band);const c0=window.cornered;window.cornered=()=>true;
   try{t.meetBand(band);ok(G.mode==='battle'&&!G.par,'a cornered band: no parley, the fight at once')}finally{window.cornered=c0}end()}
  // ---- held: its ring, Attack or Talk (a beast: Choose); Talk opens its window when you meet, its talk and choices, once
  {const band=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(band);t.frame();
   const labels=t.partyRingItems(band,0,0).map(i=>i.label);ok(labels[0]==='Attack'&&labels.includes('Talk'),'a foe held: its ring, '+labels.join(', '));
   t.partyRingItems(band,0,0).find(i=>i.label==='Talk').run();if(G.mode==='world'){G.encCool=0;t.startEncounter({kind:'party',ref:band,list:band.troops.slice()})}
   ok(G.mode==='dialog'&&(!!document.querySelector('#panel [data-act="fight"]')||!!G.par),'Talk: its window when you meet, its words and choices ('+(G.par?'a parley: they are cornered':'Fight, Flee')+')');
   ok(!t.Talk.o,'and only that once');end();
   const m=t.asMonster({id:'boar',x:P.x+30,y:P.y,hx:P.x+30,hy:P.y,lv:1,n:2,t:0,a:0,cool:0});W.monsters=[m];const ml=t.partyRingItems(m,0,0).map(i=>i.label);
   ok(ml[0]==='Attack'&&ml.includes('Choose'),'a beast held: '+ml.join(', '));W.monsters=[];end()}
  // ---- a foe clicked or tapped: attacked at once, no ring
  {const band=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(band);t.frame();
   if(t.wuiKind(band)==='foe'){t.worldGo(band.x,band.y-3);ok((G.chase===band||G.mode==='battle')&&!t.ActionRing.now,'a foe clicked: your band goes at it at once, no ring ('+(G.chase===band?'chasing':G.mode)+')')}else info('band not a foe here: '+t.wuiKind(band));end()}
  ok(!t.seamless({kind:'siege'})&&!t.seamless({kind:'tourney'})&&!t.seamless({kind:'raid'})&&t.seamless({kind:'lord'}),'a siege, a raid and a tournament keep their own; a lord\'s army does not');
 }finally{t.SEAMLESS.on=false}
});
