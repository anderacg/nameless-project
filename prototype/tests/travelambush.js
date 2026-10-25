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
  const groups=t.MarchAmbush.groups(),baitPower=groups.find(g=>g.id===bait.id).power;ok(Math.abs(A.power(observer)-baitPower)<.001&&A.power(observer)<t.partyPower(),'enemy strength estimate contains only the troops it has actually spotted');
  ok(t.stance(baitPower,observer)==='attack'&&t.stance(baitPower)==='afraid','a force willing to attack the bait would avoid the actual larger army');
  const aim=t.BRAINS.band.look(observer);ok(Math.abs(aim.dx-(d.target.x-observer.x))<.001&&Math.abs(aim.dx-(P.x-observer.x))>20,'enemy pursuit aims at the observed bait rather than the unseen hero');
  const other=t.asParty({kind:'bandits',troops:['militia'],x:observer.x,y:observer.y});ok(A.power(other)===0,'observers do not share perfect knowledge');
  ok(t.MarchAmbush.set(main.id,true),'a troop group can receive Hold concealed');const held={...t.MarchAmbush.held(main.id)},x=P.x;P.x+=10;
  const targets=army.targets().filter(u=>u.row===main.id),cx=targets.reduce((n,u)=>n+u.x,0)/targets.length;ok(Math.abs(cx-held.x)<.001,'held group targets stay at their world anchor when the hero moves');P.x=x;
  ok(t.partyUnitActions({id:main.id,kind:'troop'},t.partyRoster(P)).includes('Rejoin march'),'Army exposes an active hold order and a way to release it');
  ok(!t.MarchAmbush.set('hero',true),'the hero remains the moving army anchor');
  place(main.id,P.x+20,t.T_OPEN);A.step(2.1);const known=A.power(observer);ok(known>baitPower,'revealing the main army increases the enemy strength estimate');
  place(main.id,P.x+20,t.T_FOREST);observer.x=P.x+300;A.step(1);ok(A.power(observer)===known,'entering cover does not instantly erase known troops');A.step(9);ok(A.power(observer)===0,'old sightings eventually expire');observer.x=P.x+100;
  const saved=t.saveRecord();ok(saved.P.army.concealed[main.id].x===held.x,'hold anchors are plain saved army data');
  t.MarchAmbush.set(main.id,false);ok(!t.MarchAmbush.held(main.id),'Rejoin march releases the group');t.MarchAmbush.set(main.id,true);P.x+=t.TRAVEL_AMBUSH.leash+100;t.MarchAmbush.releaseFar();ok(!t.MarchAmbush.held(main.id),'distant held groups automatically rejoin instead of being abandoned');P.x=x;
  place(main.id,P.x+20,t.T_FOREST);place(bait.id,P.x+60,t.T_OPEN);t.MarchAmbush.set(main.id,true);const starts=army.forGroup(main.id).map(u=>({u,x:u.x,y:u.y}));
  G.enc={kind:'party',ref:observer,list:observer.troops.slice(),allies:[],foes:[],mine:false};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,g=Object.values(b.groups).find(g=>g.player&&g.sourceGroupId===main.id),units=b.units.filter(u=>u.grp===g.id);
  ok(units.every(u=>{const p=b.world.world(u),s=starts.find(s=>s.u===u.marchUnit);return s&&Math.hypot(p.x-s.x,p.y-s.y)<.001}),'hidden troops enter combat at their actual travel positions');
  ok(g.concealHold&&g.cease&&g.firm,'held troops start combat holding position and fire');b.auto=true;ok(!t.aiHas(g),'the automatic commander cannot release a held ambush group');
  ok(units.every(u=>!t.seenBy(1,u)),'forest troops remain concealed from enemies when combat begins');
  t.playerOrder([g.id],()=>{});ok(!g.concealHold&&!g.cease&&!g.firm,'a player order releases the selected ambush group');
  const foe=b.units.find(u=>u.team===1&&u.hp>0);b.sight.struckBy(units[0],foe);ok(t.seenBy(1,units[0]),'attacking reveals the ambusher through existing battle sight');
  b.world.finish(b);ok(!P.army.concealed,'combat settlement clears old travel hold orders');
 }finally{for(const [i,k] of changed)t.tiles[i]=k;window.eval('B=null');t.MarchAmbush.finish();A.reset();G.mode='world';G.modal=false}
});
