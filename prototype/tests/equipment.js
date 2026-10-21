'use strict';
// Equipment transfers must conserve items, obey handedness, and roll back when the shared bag is full (at its limit: its size and
// BAG.maxOver overflow slots, core/inventory.js).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,g=t.gearId;try{localStorage.clear()}catch(e){}
  t.begin('soldier');P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann');
  const sword=g('sword',1),shield=g('shield',1),great=g('greatsword',2);
  const setup=()=>{P.gear=t.emptyGear();P.inv=Array(t.INV_SIZE+t.BAG.maxOver).fill(null).map(()=>({k:'mat',id:'silk',n:t.STACK}));c.gear={weapon:sword,offhand:shield};P.inv[0]={k:'gear',id:great,n:1}};
  const snapshot=()=>JSON.stringify({gear:c.gear,inv:P.inv});
  setup();let before=snapshot();
  ok(!t.compEquip('brann','weapon',0),'a full bag refuses a companion two-handed swap');
  ok(snapshot()===before,'the failed swap preserves every item and equipped slot');
  P.inv[1]=null;
  ok(t.compEquip('brann','weapon',0)&&c.gear.weapon===great&&!c.gear.offhand,'making one slot free allows the swap and clears the off hand');
  ok(t.invCount('gear',sword)===1&&t.invCount('gear',shield)===1&&t.invCount('gear',great)===0,'the old sword and shield each return to the bag once');
  const si=P.inv.findIndex(x=>x&&x.id===shield);before=snapshot();
  ok(!t.compEquip('brann','offhand',si)&&snapshot()===before,'a shield cannot be given to a companion wielding a two-handed weapon');
  ok(!t.compFits('brann','offhand').length,'blocked companion off-hand choices are not offered');
  before=snapshot();ok(!t.compUnequip('brann','weapon')&&snapshot()===before,'taking companion gear back into a full bag fails without losing it');
  P.inv[2]=null;ok(t.compUnequip('brann','weapon')&&!c.gear.weapon&&t.invCount('gear',great)===1,'taking gear back uses a free slot exactly once');
  setup();c.gear.weapon=null;
  ok(t.compEquip('brann','weapon',0)&&!c.gear.offhand&&P.inv[0].id===shield,'equipping into an empty hand reuses the source bag slot for the shield');
  setup();P.inv[1]=null;c.gear.weapon=g('spear',1);
  ok(t.compEquip('brann','weapon',1)===false,'an empty bag slot cannot be equipped');
  P.inv[1]={k:'gear',id:g('spear',2),n:1};
  ok(t.compEquip('brann','weapon',1)&&c.gear.offhand===shield,'a hybrid spear keeps its shield');
  before=snapshot();ok(!t.compEquip('brann','bag',0)&&snapshot()===before,'companions retain their supported equipment slots');
  setup();P.gear.weapon=sword;P.gear.offhand=shield;const heroBefore=JSON.stringify({gear:P.gear,inv:P.inv});
  ok(!t.invEquip(0)&&JSON.stringify({gear:P.gear,inv:P.inv})===heroBefore,'the hero has the same full-bag rollback guarantee');
  setup();P.inv[1]=null;t.lootStart();
  ok(t.compEquip('brann','weapon',0)&&t.invCount('gear',shield)===1&&!t.G.loot.pile.length,'equipment transfers return displaced gear to the bag, never to the reward pile');
  t.lootEnd();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
