'use strict';
// Spoils left on the field (world/fieldloot.js; the owner, 2026-10-30: withdrawn or beaten with beasts holding the field, "you can
// still get all loots, but you have to come back at that area and claim it"; "the beast may wander around there, looters or
// bandits may also seek this"): the fight's spoils stay where it was fought, the pack makes it its ground, and a side quest points
// you back; there with no beast on the spot, they are yours; a band near it may take them first; in FIELD_LOOT.days they are gone.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,X=t.FIELD_LOOT,rnd=Math.random;Kit.begin('soldier',1);Kit.clear();t.GUIDE.on=false;
 const spot=()=>{for(let k=0;k<4000;k++){const h=t.TOWNS[k%t.TOWNS.length],a=k*2.39996,d=300+(k%7)*40,x=h.x+Math.cos(a)*d,y=h.y+Math.sin(a)*d;if(t.passable(t.terrAt(x,y))&&!t.hiddenAt(x,y))return[x,y]}return null};
 const pack=(x,y)=>{const m=t.asMonster({id:'wolf',x:x+30,y,hx:x+400,hy:y,lv:1,n:5,t:0,a:0,cool:0});W.monsters=[m];return m};
 const mine=()=>P.quests.filter(q=>q.type==='fieldloot').map(q=>t.Quest.as(q));
 const at=spot();ok(!!at,'(a spot in the wilds)');
 try{
  // ======== withdrawn from a world battle: the spoils stay, the pack takes the field for its ground
  {Kit.world({encCool:0});Kit.goTo(at[0],at[1]);P.troops={hum_foot:4};P.quests=[];const m=pack(P.x,P.y);G.enc={kind:'monster',ref:m,lv:1,list:Array(m.n).fill('wolf')};
   t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();const b=t.B,A=b.world;ok(A instanceof t.WorldBattleArea,'a pack met on the map: fought in the map\'s circle');
   b.slain=['wolf','wolf','wolf','wolf'];b.kills=4;b.over=true;b.win=false;b.retreat=true;b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();
   const [q]=mine(),pn=document.getElementById('panel')?.innerHTML||'';
   ok(q&&q.x===Math.round(A.x)&&q.y===Math.round(A.y),'withdrawn, the beasts on the field: a quest to take the spoils back, where it was fought');
   ok(q&&q.items.some(([k,id,n])=>k==='mat'&&id==='pelt'&&n===4)&&q.items.some(([k,id,n])=>id==='furs'&&n===2),'its spoils as a won fight\'s: '+q?.what());
   ok(/stay on the field/.test(pn),'the battle\'s report says so');
   ok(m.hx===A.x&&m.hy===A.y,'the pack makes the field its ground (it wanders there)');
   ok(t.invCount('mat','pelt')===0,'nothing in your bag yet');t.act('cont');t.hidePanel();
   // ======== back there: not while a beast stands on it; then yours
   Kit.goTo(q.x,q.y);m.x=q.x+10;m.y=q.y;ok(!q.near(),'back on the spot with a wolf on it: not yet ('+q.todo()+')');
   W.monsters=[];ok(q.near(),'the pack gone: there');const g0=P.gold;q.reached();
   ok(!mine().length&&t.invCount('mat','pelt')===4&&t.invCount('good','furs')>=2&&P.gold===g0+q.gold,'gathered: the pelts and furs in your bag, the quest done')}
  // ======== beaten (auto-resolve): the same; nothing slain, nothing left
  {Kit.world();Kit.goTo(at[0],at[1]);P.quests=[];const m=pack(P.x,P.y);G.enc={kind:'monster',ref:m,lv:1,list:Array(m.n).fill('wolf')};
   t.concludeEncounter(false,{},2,true,['wolf','wolf'],false,{});const [q]=mine();ok(q&&q.x===Math.round(m.x)&&q.items.some(([k,id,n])=>id==='pelt'&&n===2),'beaten by them too: the spoils stay (at the pack)');t.act('cont');t.hidePanel();
   P.quests=[];G.enc={kind:'monster',ref:m,lv:1,list:Array(m.n).fill('wolf')};t.concludeEncounter(false,{},0,true,[],{caught:0,got:0,standing:5,fallen:0},{});ok(!mine().length,'nothing slain: nothing left, no quest');t.act('cont');t.hidePanel()}
  // ======== a band near it may set out for it, and takes it
  {Kit.world();P.quests=[];const m=pack(at[0],at[1]);const q=t.leaveFieldLoot(at[0],at[1],['wolf','wolf'],m);
   const far=t.asParty({kind:'bandits',troops:['militia','militia'],x:at[0]+X.seek+80,y:at[1],cool:0}),b=t.asParty({kind:'bandits',troops:['militia','militia'],x:at[0]+60,y:at[1],cool:0});t.bandits.length=0;t.bandits.push(far,b);
   window.Math.random=()=>.05;q.lapse();window.Math.random=rnd;ok(b.lootGo?.q===q.id&&!far.lootGo,'a day: a band within '+X.seek+' px sets out for it, one farther off does not');
   const d0=Math.hypot(b.x-q.x,b.y-q.y);for(let i=0;i<5;i++)t.FieldLootQuest.seek(b,.2);ok(Math.hypot(b.x-q.x,b.y-q.y)<d0,'it heads there');
   for(let i=0;i<400&&b.lootGo;i++)t.FieldLootQuest.seek(b,.2);ok(!b.lootGo&&!mine().length&&q.fate==='looted','there, it takes the spoils: the quest is over')}
  // ======== its days up: gone
  {P.quests=[];const m=pack(at[0],at[1]),q=t.leaveFieldLoot(at[0],at[1],['wolf'],m);ok(q.due===G.day+X.days,'it lasts '+X.days+' days');G.day=q.due+1;q.lapse();ok(!mine().length&&q.fate==='late','after them, gone')}
 }finally{window.Math.random=rnd;W.monsters=[]}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
