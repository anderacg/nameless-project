'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;G.paused=false;G.speed=1;P.stay=null;P.camp=null;
 let tile=0;for(let i=0;i<t.WM.kind.length;i++)if(t.WM.kind[i]===t.T_OPEN&&i%t.MW>20&&i%t.MW<t.MW-25&&Math.floor(i/t.MW)>20){tile=i;break}
 Kit.goTo((tile%t.MW+.5)*t.TILE,(Math.floor(tile/t.MW)+.5)*t.TILE);P.troops={hum_foot:10,hum_bow:2};W.lords=[];
 const changed=new Map(),paint=(p,kind)=>{const i=Math.floor(p.y/t.TILE)*t.MW+Math.floor(p.x/t.TILE);if(!changed.has(i))changed.set(i,t.tiles[i]);t.tiles[i]=kind};
 const army=t.MarchArmy.of(P),rows=t.marchRows(P),main=rows.find(r=>r.type==='hum_foot'),bait=rows.find(r=>r.type==='hum_bow'),A=t.TravelAwareness;
 const place=(id,x,kind)=>{army.forGroup(id).forEach((u,i)=>{u.x=x+(i%3-1)*3;u.y=P.y+Math.floor(i/3)*3;u.walking=false;paint(u,kind)})};
 const observer=t.asParty({kind:'bandits',troops:['militia','militia','archer'],x:P.x+100,y:P.y,cool:0,t:999,idle:true});t.bandits.push(observer);
 try{
  paint(P,t.T_OPEN);place(main.id,P.x+20,t.T_FOREST);place(bait.id,P.x+60,t.T_OPEN);A.reset();A.step(2.1);
  const d=t.travelDetection(observer),records=A.records.get(observer);ok(d.sees&&records.get(bait.id).q===1&&(records.get(main.id)?.q||0)===0,'an observer spots the open bait without revealing the forest group');
  const groups=t.TravelGroups.groups(),baitPower=groups.find(g=>g.id===bait.id).power;ok(Math.abs(A.power(observer)-baitPower)<.001&&A.power(observer)<t.partyPower(),'enemy strength estimate contains only the troops it has actually spotted');
  ok(t.stance(baitPower,observer)==='attack'&&t.stance(baitPower)==='afraid','a force willing to attack the bait would avoid the actual larger army');
  const aim=t.BRAINS.band.look(observer);ok(Math.abs(aim.dx-(d.target.x-observer.x))<.001&&Math.abs(aim.dx-(P.x-observer.x))>20,'enemy pursuit aims at the observed bait rather than the unseen hero');
  const other=t.asParty({kind:'bandits',troops:['militia'],x:observer.x,y:observer.y});ok(A.power(other)===0,'observers do not share perfect knowledge');
  place(main.id,P.x+20,t.T_OPEN);A.step(2.1);const known=A.power(observer);ok(known>baitPower,'revealing the main army increases the enemy strength estimate');
  place(main.id,P.x+20,t.T_FOREST);observer.x=P.x+300;A.step(1);ok(A.power(observer)===known,'entering cover does not instantly erase known troops');A.step(9);ok(A.power(observer)===0,'old sightings eventually expire');observer.x=P.x+100;
  const oldX=P.x;P.army.concealed={[main.id]:{x:P.x-80,y:P.y-30,face:2}};const targets=army.targets().filter(u=>u.row===main.id);P.x+=10;const following=army.targets().filter(u=>u.row===main.id);
  ok(following.every((p,i)=>Math.abs(p.x-targets[i].x-10)<.001&&p.y===targets[i].y),'all troop targets follow the hero even if an old save contains hold anchors');P.x=oldX;
  const actions=t.partyUnitActions({id:main.id,kind:'troop'},t.partyRoster(P));ok(!/Hold concealed|Rejoin march|conceal-toggle/.test(actions),'troop actions no longer expose the removed hold feature');
  t.act('conceal-toggle',main.id);ok(JSON.stringify(army.targets().filter(u=>u.row===main.id))===JSON.stringify(targets),'an old hold action has no effect');
  G.enc={kind:'party',ref:observer,list:observer.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,g=Object.values(b.groups).find(g=>g.player&&g.sourceGroupId===main.id);
  ok(b.muster?.active&&!g.concealHold&&!g.cease&&!g.firm,'old save hold data cannot skip preparation or force battle hold orders');b.auto=true;ok(t.aiHas(g),'every troop group can follow the automatic commander');
 }finally{for(const [i,k] of changed)t.tiles[i]=k;window.eval('B=null');delete P.army.concealed;A.reset();G.mode='world';G.modal=false}
});
