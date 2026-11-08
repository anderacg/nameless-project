'use strict';
// Talent services can operate without the Skills screen: points and milestones, currencies, skill slots, modifiers and record lifetime.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,G=t.G;try{localStorage.clear()}catch(e){}
  // (a proficiency's tree, data/tree.js: a and b its first tier at x 10, c and d its second at x 30; its points one each TREE_PT.per
  // levels of x; root the origin, of no tree)
  const globalBefore=JSON.stringify(P),nodes={root:{t:'origin',links:[],m:{}},a:{t:'s',prof:'x',at:10,tier:0,pair:'b',links:[],m:{attr:{str:2}}},b:{t:'a',prof:'x',at:10,tier:0,pair:'a',links:[],m:{unlock:'storm'}},
    c:{t:'s',prof:'x',at:30,tier:1,pair:'d',links:[],m:{}},d:{t:'s',prof:'x',at:30,tier:1,pair:'c',links:[],m:{}},other:{t:'origin',links:[],m:{}}};
  const owner={tree:['root'],sk:{x:{lv:5,xp:0}},attr:{str:1},slots:[null,null,null],fin:null},wallet={gold:10};let ready=false;
  const effects={stormCost:.1,stormCd:.25,stormR:.2,stormDmg:.5,stormStun:.3,stormDur:1};
  const rules={nodes,trees:()=>({x:[[['a'],['b']],[['c'],['d']]]}),skills:()=>({storm:{learn:'b',mp:10,sp:20,cd:8},unknown:{learn:'never',mp:1,sp:1,cd:1}}),root:()=>'root',minAttribute:1,slotCount:3,wallet,refundCost:()=>15,effect:k=>effects[k]||0,finisher:{styles:()=>({stun:{},push:{}}),ready:()=>ready}};
  const service=new t.TalentService(owner,rules),snap=()=>JSON.stringify({owner,wallet}),per=t.TREE_PT.per;
  let before=snap();ok(!service.take('a').ok&&!service.take('missing').ok&&!service.take('constructor').ok&&!service.take('other').ok&&!service.take('root').ok&&!service.knows('constructor')&&!service.canRefund('__proto__')&&snap()===before,'below its milestone, unknown nodes and origins: nothing taken');
  owner.sk.x.lv=per+1;ok(service.points('x').left===1&&service.take('a').ok&&owner.attr.str===3&&!service.canTake('b')&&!service.canTake('c'),'x '+(per+1)+': one point, spent where you like at the milestone reached (attributes applied once); none left, the next milestone not reached');
  before=snap();ok(!service.take('a').ok&&!service.take('b').ok&&snap()===before,'a duplicate, or one with no point left, cannot be taken');
  ok(!service.refund('root').ok&&service.quoteRefund('a').code==='gold'&&snap()===before&&!service.refund('a').ok&&snap()===before,'the origin stays; an unaffordable refund is read-only');
  wallet.gold=50;ok(service.refund('a').ok&&wallet.gold===35&&owner.attr.str===1&&service.canTake('b')&&service.points('x').left===1,'unlearning charges the wallet, reverses its effects and gives the point back');
  ok(service.take('b').ok&&owner.slots[0]==='storm'&&service.knows('storm'),'spent on the other instead: an unlocked active fills the first empty slot');
  ok(service.assignSlot(2,'storm').ok&&owner.slots[2]==='storm'&&owner.slots.filter(x=>x==='storm').length===1,'slot assignment moves a learned skill instead of duplicating it');
  before=snap();ok(!service.assignSlot(-1,'storm').ok&&!service.assignSlot(1.5,'storm').ok&&!service.assignSlot(3,'storm').ok&&!service.assignSlot(1,'unknown').ok&&snap()===before,'invalid slots and unlearned skills leave the bar untouched');
  const A=service.ability('storm',5);ok(A.mp===8&&A.sp===18&&A.cd===6&&A.r===1.2&&A.dmg===1.5&&A.stun===.3&&A.dur===1,'ability costs, cooldown and effects use the character modifiers');
  ok(service.refund('b').ok&&wallet.gold===20&&!owner.slots.includes('storm')&&!service.knows('storm'),'unlearning an active charges the wallet and clears every slot for it');
  owner.sk.x.lv=Math.max(30,2*per);wallet.gold=99;ok(!service.canTake('c')&&service.take('a').ok&&service.take('c').ok&&!service.canTake('b')&&!service.canRefund('a'),'x '+owner.sk.x.lv+': two points; the second tier grows from a node of the first; that node cannot go while it holds the one above');
  owner.sk.x.lv=3*per;ok(service.take('b').ok&&service.canRefund('a')&&service.points('x').left===0,'x '+owner.sk.x.lv+': a third point, both of a tier as you like; with its other there, the first can go');
  before=snap();ok(!service.chooseFinisher('push').ok&&snap()===before,'a finisher cannot be chosen before its discipline is ready');ready=true;
  ok(!service.chooseFinisher('constructor').ok&&service.chooseFinisher('push').ok&&!service.chooseFinisher('stun').ok&&owner.fin==='push','only a defined finishing style can be chosen, and only once');
  ok(JSON.stringify(P)===globalBefore,'the injected talent service does not touch the live hero');
  t.begin('soldier');G.quietEvents=true;const live=t.talentsOf(P);P.sk.oneh.lv=40;t.takeNode('oneh_str');t.takeNode('oneh_whirl');P.gold=1000;
  G.mode='world';G.modal=false;t.hidePanel();t.openSkills('talents');t.act('tree-prof','oneh');t.act('tree-sel','oneh_whirl');
  const refund=document.querySelector('[data-act="tree-refund"][data-arg="oneh_whirl"]');ok(refund&&!refund.disabled===live.quoteRefund('oneh_whirl').ok,'the refund button uses service eligibility');
  before=JSON.stringify({tree:P.tree,gold:P.gold});t.act('tree-take','missing');t.act('tree-refund','missing');t.act('tree-take','oneh_dash');
  ok(JSON.stringify({tree:P.tree,gold:P.gold})===before,'invalid tree actions, and one with no point left, are harmless');
  t.act('sk-close');t.saveGame(true);const saved=JSON.stringify({tree:P.tree,slots:P.slots});t.begin('hedge');
  ok(t.talentsOf(P)===live&&live.root()==='o_hedge'&&!live.knows('whirl'),'the cached service sees the new campaign origin and empty skill bar');
  t.loadGame();ok(t.talentsOf(P)===live&&JSON.stringify({tree:P.tree,slots:P.slots})===saved&&live.root()==='o_soldier','loading restores talents through the same live service');
  P.comps={brann:{ap:3,role:''}};const c=t.compInit('brann'),ch=t.charOf(c,'brann');t.charKit(ch);c.sk.oneh.lv=20;
  const id=t.treePendingOf(c)[0]&&'oneh_third',heroTree=JSON.stringify(P.tree),gold=P.gold;
  ok(id&&t.takeNodeOf(c,id,true)&&t.treeHasOf(c,id)&&JSON.stringify(P.tree)===heroTree,'a companion\'s points are its own, by its own proficiencies ('+id+')');
  ok(t.refundNodeOf(c,id)&&P.gold===gold-t.refundCost()&&JSON.stringify(P.tree)===heroTree,'companion refunds use the shared purse without changing the hero tree');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
