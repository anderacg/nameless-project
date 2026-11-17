'use strict';
// The fallen and who comes for them (the owner, 2026-11-15: "make every unit the same way, make random looters loot or check body,
// make people work to clear those corpses"; world/carcasses.js, CARCASS in data/drops.js): every one fallen in a fight on the map lies
// where he fell, yours and your allies' too (nothing of the spoils on them); a band near the fallen walks to them, searches them a
// while and takes what is on them, seen or not; fresh ones with no band near may draw looters out of the wilds; the folk of a holding
// near them come out, dig, and clear them (out of your sight they are simply gone).
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,W=t.W,C=t.Carcass,X=t.CARCASS;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;G.paused=false;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+140,home.y+90);const r0=Math.random;
 // ---- a fight you lose men in: your fallen lie there too, nothing of the spoils on them
 {P.troops={hum_foot:4};const b=t.asParty({kind:'bandits',troops:Array(12).fill(t.ST.band_brigand?'band_brigand':'militia'),x:P.x+50,y:P.y,cool:0});t.bandits.push(b);Math.random=t.seeded(5);
  G.enc={kind:'party',ref:b,list:b.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});const B=t.B;
  for(let i=0;i<4000&&B.muster?.active;i++)t.updateBattle(.05);try{t.beginFight()}catch(e){}t.setAuto(true,true);let fell=null;const fr=C.from;C.from=function(b){return fell=fr.apply(this,arguments)};
  try{for(let f=0;f<9000&&t.B===B;f++)t.updateBattle(1/30)}finally{C.from=fr;Math.random=r0}
  const ours=(fell||[]).filter(c=>c.ours).length,foes=(fell||[]).filter(c=>!c.ours).length;
  ok(fell&&ours>=1&&C.list.filter(c=>c.ours).length===ours&&C.list.filter(c=>c.ours).every(c=>c.empty()),'every one fallen lies where he fell: '+ours+' of yours and '+foes+' of theirs, nothing of the spoils on yours');
  Kit.done({world:true});C.list=[];t.bandits.length=0}
 // ---- a band near the fallen walks to them, searches them, takes what is on them (seen or not): out in the wilds, where no
 // patrol of the town's rides it down first
 {Kit.goTo(home.x+1500,home.y);const c=t.asCarcass({x:P.x+60,y:P.y+10,type:'militia',wild:null,mon:null,bst:false,face:1,items:[{k:'good',id:'meat',n:2},{k:'mat',id:'iron',n:1}],day:G.day+t.Clock.frac,at:G.day});C.list=[c];
  const b=t.asParty({kind:'bandits',troops:['militia','militia'],x:c.x+90,y:c.y,cool:0});t.bandits.push(b);Math.random=()=>0;try{C.hour()}finally{Math.random=r0}const px=P.x;P.x+=420;// (you off past its sight: it does not turn on you)
  ok(b.corpse&&Math.hypot(b.corpse.x-c.x,b.corpse.y-c.y)<1,'a band near the fallen sets out for them');let n=0,at=-1;
  for(;n<3000&&b.corpse;n++){const d=Math.hypot(b.x-c.x,b.y-c.y);t.updateWorld(.05);if(at<0&&d<=X.loot.at+1)at=n}// (+1: stopped at L.at, the world's step may leave it a hair past, 24.1 px)
  ok(at>=0&&n-at>=3&&c.empty()&&c.robbed&&b.plunder?.items.length===2,'it walks there ('+at+' steps), searches them a while ('+(n-at)+'), and takes all on them ('+(b.plunder?.items.map(q=>q[2]+' '+q[1]).join(', '))+')');
  P.x=px;t.bandits.length=0;C.list=[]}
 // ---- fresh fallen with something on them and no band near: looters may come out of the wilds for them
 {const c=t.asCarcass({x:P.x+40,y:P.y,type:'militia',wild:null,mon:null,bst:false,face:1,items:[{k:'good',id:'meat',n:1}],day:G.day+t.Clock.frac,at:G.day});C.list=[c];t.bandits.length=0;
  Math.random=()=>0;try{C.hour()}finally{Math.random=r0}const L=t.bandits.find(o=>o.looters);
  ok(L&&L.corpse&&L.troops.every(k=>k===(t.ST[X.loot.kind]?X.loot.kind:'militia'))&&Math.hypot(L.x-c.x,L.y-c.y)>=X.loot.from[0]-1&&t.Death.unseenAt(L.x,L.y),'fresh fallen with no band near: looters out of the wilds for them ('+(L?L.troops.length+' '+L.troops[0]+', '+Math.round(Math.hypot(L.x-c.x,L.y-c.y))+' px off, out of your sight':'none')+')');
  t.bandits.length=0;C.list=[]}
 // ---- the folk of a holding near the fallen clear them: in your sight one walks out, digs, and walks home; out of it, simply gone
 {const g=t.gateGoal(home);P.x=g.x+20;P.y=g.y+40;t.reveal();const now=G.day+t.Clock.frac,c=t.asCarcass({x:g.x+40,y:g.y+30,type:'militia',wild:null,mon:null,bst:false,face:1,items:[],day:now-X.clear.bare-.01,at:G.day});C.list=[c];C.diggers=[];
  C.hour();const f=C.diggers[0];ok(f&&f.home===home.name&&c.digger,'picked clean and old enough, near '+home.name+': one of its folk sets out to clear it');
  let n=0,dug=0;const ents=[];for(;n<4000&&C.diggers.length;n++){C.dig(.05);if(f.st==='dig')dug++;if(n===5){C.drawAll(ents,G.cam,t.vis())}}
  ok(!C.list.includes(c)&&dug>=Math.floor(X.clear.dig/.05)-2&&!C.diggers.length&&ents.length>=1,'he walks there, digs a while ('+dug+' steps), the fallen is gone, he walks home ('+n+' steps)');
  const far=t.asCarcass({x:g.x+40,y:g.y+30,type:'militia',wild:null,mon:null,bst:false,face:1,items:[{k:'good',id:'meat',n:1}],day:now-X.clear.after-.01,at:G.day});C.list=[far];Kit.goTo(home.x+1500,home.y);
  C.hour();ok(!C.list.length&&!C.diggers.length,'out of your sight: old fallen near a holding are simply cleared');C.list=[]}
});
