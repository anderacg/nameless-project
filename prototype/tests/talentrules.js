'use strict';
// Talent services can operate without the Skills screen: connectivity, currencies, skill slots, modifiers and record lifetime.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,G=t.G;try{localStorage.clear()}catch(e){}
  const globalBefore=JSON.stringify(P),nodes={root:{t:'origin',links:['a'],m:{}},a:{t:'s',links:['root','b'],m:{attr:{str:2}}},b:{t:'a',links:['a'],m:{unlock:'storm'}},other:{t:'origin',links:['a'],m:{}}};
  const owner={tree:['root'],tp:2,attr:{str:1},slots:[null,null,null],fin:null},wallet={gold:10};let ready=false;
  const effects={stormCost:.1,stormCd:.25,stormR:.2,stormDmg:.5,stormStun:.3,stormDur:1};
  const rules={nodes,skills:()=>({storm:{learn:'b',mp:10,sp:20,cd:8},unknown:{learn:'never',mp:1,sp:1,cd:1}}),root:()=>'root',minAttribute:1,slotCount:3,wallet,refundCost:()=>15,effect:k=>effects[k]||0,finisher:{styles:()=>({stun:{},push:{}}),ready:()=>ready}};
  const service=new t.TalentService(owner,rules),snap=()=>JSON.stringify({owner,wallet});
  let before=snap();ok(!service.take('b').ok&&!service.take('missing').ok&&!service.take('constructor').ok&&!service.take('other').ok&&!service.knows('constructor')&&!service.canRefund('__proto__')&&snap()===before,'disconnected, unknown and foreign origin nodes spend nothing');
  ok(service.take('a').ok&&owner.tp===1&&owner.attr.str===3,'learning spends one point and applies attributes once');
  before=snap();ok(!service.take('a').ok&&snap()===before,'a duplicate learn cannot spend or apply effects again');
  ok(service.take('b').ok&&owner.tp===0&&owner.slots[0]==='storm'&&service.knows('storm'),'an unlocked active fills the first empty slot');
  before=snap();ok(!service.refund('a').ok&&!service.refund('root').ok&&snap()===before,'refunds preserve the root and nodes connecting learned descendants');
  ok(service.quoteRefund('b').code==='gold'&&snap()===before&&!service.refund('b').ok&&snap()===before,'an unaffordable refund is read-only and cannot remove a skill');
  wallet.gold=50;ok(service.assignSlot(2,'storm').ok&&owner.slots[2]==='storm'&&owner.slots.filter(x=>x==='storm').length===1,'slot assignment moves a learned skill instead of duplicating it');
  before=snap();ok(!service.assignSlot(-1,'storm').ok&&!service.assignSlot(1.5,'storm').ok&&!service.assignSlot(3,'storm').ok&&!service.assignSlot(1,'unknown').ok&&snap()===before,'invalid slots and unlearned skills leave the bar untouched');
  const A=service.ability('storm',5);ok(A.mp===8&&A.sp===18&&A.cd===6&&A.r===1.2&&A.dmg===1.5&&A.stun===.3&&A.dur===1,'ability costs, cooldown and effects use the character modifiers');
  ok(service.refund('b').ok&&wallet.gold===35&&owner.tp===1&&!owner.slots.includes('storm')&&!service.knows('storm'),'refunding returns a point, charges the wallet and clears every slot for that active');
  ok(service.refund('a').ok&&wallet.gold===20&&owner.attr.str===1,'refunding the attribute leaf reverses its effects');
  before=snap();ok(!service.chooseFinisher('push').ok&&snap()===before,'a finisher cannot be chosen before its discipline is ready');ready=true;
  ok(!service.chooseFinisher('constructor').ok&&service.chooseFinisher('push').ok&&!service.chooseFinisher('stun').ok&&owner.fin==='push','only a defined finishing style can be chosen, and only once');
  const cycleNodes={root:{t:'start',links:['a','c'],m:{}},a:{t:'s',links:['root','b'],m:{}},b:{t:'s',links:['a','c'],m:{}},c:{t:'s',links:['root','b'],m:{}}};
  const cycleOwner={tree:['root','a','b','c'],tp:0,attr:{str:1}},cycle=new t.TalentService(cycleOwner,{...rules,nodes:cycleNodes});wallet.gold=50;
  ok(cycle.canRefund('a')&&cycle.refund('a').ok&&cycleOwner.tree.includes('b'),'an alternate route permits a non-leaf refund without disconnecting descendants');
  ok(JSON.stringify(P)===globalBefore,'the injected talent service does not touch the live hero');
  t.begin('soldier');G.quietEvents=true;const live=t.talentsOf(P);P.tp=2;t.takeNode('might0');t.takeNode('might1');P.gold=1000;
  G.mode='world';G.modal=false;t.hidePanel();t.openSkills('talents');t.act('tree-sel','might1');
  const refund=document.querySelector('[data-act="tree-refund"]');ok(refund&&!refund.disabled===live.quoteRefund('might1').ok,'the refund button uses service eligibility');
  before=JSON.stringify({tree:P.tree,tp:P.tp,gold:P.gold});t.act('tree-take','missing');t.act('tree-refund','missing');
  ok(JSON.stringify({tree:P.tree,tp:P.tp,gold:P.gold})===before,'invalid tree actions are harmless');
  t.act('sk-close');t.saveGame(true);const saved=JSON.stringify({tree:P.tree,tp:P.tp,slots:P.slots});t.begin('hedge');
  ok(t.talentsOf(P)===live&&live.root()==='o_hedge'&&!live.knows('whirl'),'the cached service sees the new campaign origin and empty skill bar');
  t.loadGame();ok(t.talentsOf(P)===live&&JSON.stringify({tree:P.tree,tp:P.tp,slots:P.slots})===saved&&live.root()==='o_soldier','loading restores talents through the same live service');
  P.comps={brann:{ap:3,role:''}};const c=t.compInit('brann'),ch=t.charOf(c,'brann');t.charKit(ch);c.tp=1;
  const id=Object.keys(t.TREE).find(k=>t.canTakeOf(c,k)),heroTree=JSON.stringify(P.tree),gold=P.gold;
  ok(id&&t.takeNodeOf(c,id,true)&&JSON.stringify(P.tree)===heroTree,'companion talent spending uses its own record');
  ok(t.refundNodeOf(c,id)&&P.gold===gold-t.refundCost()&&JSON.stringify(P.tree)===heroTree,'companion refunds use the shared purse without changing the hero tree');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
