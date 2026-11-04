'use strict';
// Leads, not pins (doc/QUESTS_DESIGN.md §6, Q4): a bounty's band and a beast hunt's pack are not marked till you have found them:
// where they were when you took it, a circle that grows as the word ages; the talk at a holding near them sharpens it, your
// tracking inside the circle narrows it to where they are; seen, they are found and followed; the map draws the circle.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE,L=t.LEAD;Kit.begin('soldier',5);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford');P.quests=[];
 const b=t.asParty({x:ash.x+260,y:ash.y+80,n:5,kind:'bandits',list:t.makeEnemies(5,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)});t.bandits.push(b);
 P.x=ash.x-1200;P.y=ash.y-1200;// (far from it: out of sight)
 const q=t.makeQuest('bounty',ash);q.accept();
 {const g=t.questGoal(q);ok(g&&g.r===L.r&&g.x===Math.round(b.x)&&g.y===Math.round(b.y)&&!q.found,'taken: where they were, a circle of '+L.r+' tiles, not a pin')}
 b.x+=500;G.day+=4;{const g=t.questGoal(q);ok(g.r===Math.min(L.max,L.r+4*L.grow)&&Math.abs(g.x-b.x)>400,'four days on, the word older: the circle '+g.r+' tiles, still where they were (they moved on)')}
 {const steps=q.steps()[0][0];ok(/last seen .+within \d+ tiles of there \(day \d+\)/.test(steps),'its objective says so: '+steps)}
 // ---- the talk at a holding near them
 {const near=t.TOWNS.filter(z=>Math.hypot(z.x-b.x,z.y-b.y)/TILE<L.ask).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y))[0];
  t.questArrive(near);const g=t.questGoal(q);ok(g.r===L.r&&g.x===Math.round(b.x)&&G.msgs.some(m=>m.m.startsWith('In '+near.name+' they say the '+q.band)),'at '+near.name+', they say where the '+q.band+' were seen: the circle there, fresh')}
 // ---- tracking inside the circle
 {b.x+=60;P.x=q.lead.x;P.y=q.lead.y+20;let n=0;const seen=b.inView;b.inView=()=>false;
  try{Kit.stubStream('quests',0,()=>{t.questGoal(q);n++})}finally{b.inView=seen}
  const g=q.lead;ok(g.r===L.r/2&&g.x===Math.round(b.x),'tracking inside it: their tracks, fresh and close (a circle of '+g.r+' tiles where they are)')}
 // ---- seen: found, and followed
 {P.x=b.x+10;P.y=b.y;const g=t.questGoal(q);ok(q.found&&!g.r&&g.x===b.x,'seen: found, and marked where they are');b.x+=50;ok(t.questGoal(q).x===b.x,'and followed as they move')}
 // ---- a beast hunt the same
 {const id=Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic);const m=t.asMonster({id,x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:2,n:3,t:0,a:0,cool:0});W.monsters.push(m);
  P.x=ash.x-1200;P.y=ash.y-1200;const qm=t.makeQuest('beast',ash);qm.accept();const g=t.questGoal(qm);ok(g&&g.r===L.r&&!qm.found,'a beast hunt: a lead too')}
 // ---- the map draws the circle
 {let arcs=0;const c=t.ctx,arc=c.arc;c.arc=function(...a){arcs++;return arc.apply(this,a)};P.x=q.lead.x;P.y=q.lead.y;q.found=false;G.cam.x=q.lead.x-t.VW/2;G.cam.y=q.lead.y-t.VH/2;
  const seen=b.inView;b.inView=()=>false;try{t.drawQuestMarks(G.cam)}finally{c.arc=arc;b.inView=seen}ok(arcs>0&&!ERR.length,'the map draws the lead\'s circle')}
 P.quests=[];Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
