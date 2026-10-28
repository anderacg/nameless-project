'use strict';
// Quotes and commands share eligibility, conserve money/people/XP, and work on injected records without a screen.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,G=t.G;try{localStorage.clear()}catch(e){}
  const globalBefore=JSON.stringify(P);let allowed=true,capacity=5;
  const p={gold:100,attr:{cha:2},race:'human',troops:{},txp:{},comps:{},add(k){this.troops[k]=(this.troops[k]||0)+1},remove(k){if(!--this.troops[k])delete this.troops[k]}};
  const town={name:'Test',T:{train:true},races:['human'],hires:()=>['a'],vol:2,pop:20};
  const rules={troops:{a:{race:'human',tier:1},b:{race:'human',tier:2},c:{tier:3}},hire:{a:20,b:30},upgrades:{a:['b']},companions:{ally:{town:'Test',cost:40}},xp:{need:{1:40,2:80,4:220}},prisonerCost:10,has:()=>false,effect:()=>0,lead:()=>0,size:()=>Object.values(p.troops).reduce((a,b)=>a+b,0)+Object.keys(p.comps).length,capacity:()=>capacity,canHire:()=>allowed,day:()=>1};
  const service=new t.RecruitmentService(p,rules),snap=()=>JSON.stringify({p,town});
  let before=snap(),q=service.quoteHire(town,'a');
  ok(q.ok&&q.cost===16&&snap()===before,'a hire quote applies race and charisma discounts without spending anything');
  ok(service.hire(town,'a').ok&&p.gold===84&&p.troops.a===1&&town.vol===1&&town.pop===19,'a hire pays once and transfers one volunteer from the population');
  const rejects=(fn,code,label)=>{const s=snap(),r=fn();ok(!r.ok&&r.code===code&&snap()===s,label)};
  allowed=false;rejects(()=>service.hire(town,'a'),'standing','low standing leaves gold, volunteers and troops untouched');allowed=true;
  capacity=1;rejects(()=>service.hire(town,'a'),'capacity','a full party cannot hire');capacity=5;
  town.vol=0;rejects(()=>service.hire(town,'a'),'volunteers','no volunteers means no hire');town.vol=1;
  p.gold=0;rejects(()=>service.hire(town,'a'),'gold','an unaffordable hire cannot spend or transfer anything');p.gold=100;
  rejects(()=>service.hire(town,'missing'),'invalid-unit','an unknown recruit is rejected safely');
  rejects(()=>service.hire(town,'b'),'unavailable','a holding cannot raise a troop outside its roster');
  town.raided=3;rejects(()=>service.hire(town,'a'),'closed','a recovering holding cannot recruit through a direct command');town.raided=0;
  p.troops={a:2};p.txp={};rejects(()=>service.train(town,'a','b'),'experience','training without XP is an atomic refusal');
  p.txp={a:45};town.T.train=false;rejects(()=>service.train(town,'a','b'),'training-unavailable','a village without barracks cannot train through a direct command');town.T.train=true;
  rejects(()=>service.train(town,'a','c'),'upgrade','an invalid upgrade cannot spend XP or gold');
  rejects(()=>service.train(town,'constructor','b'),'upgrade','an inherited object property is not a troop upgrade');
  const gold=p.gold;ok(service.train(town,'a','b').ok&&p.troops.a===1&&p.troops.b===1&&p.txp.a===5&&p.gold===gold-25,'training preserves headcount and spends exactly one XP threshold and its gold price');
  service.gainXp('a',9999);ok(service.ready('a')===1&&p.txp.a===40,'XP cannot exceed what the surviving troops can use');
  delete p.troops.a;service.clampXp();ok(!p.txp.a,'losing the last soldier removes its pooled XP');
  p.gold=100;ok(service.hireCompanion(town,'ally').ok&&p.gold===60&&p.comps.ally.role==='','a companion joins for its price');
  rejects(()=>service.hireCompanion(town,'ally'),'companion-hired','the same companion cannot be paid for twice');
  ok(!service.quoteCompanion({...town,name:'Elsewhere'},'ally').ok,'a companion is offered only at its home tavern');
  p.prisoners={a:1};capacity=0;rejects(()=>service.recruitPrisoner('a'),'capacity','a full party cannot take a prisoner into its roster');capacity=5;p.gold=20;
  ok(service.recruitPrisoner('a').ok&&p.gold===10&&!p.prisoners.a&&p.troops.a===1,'a prisoner transfers to the roster for the existing fee exactly once');
  rejects(()=>service.recruitPrisoner('a'),'prisoner-unavailable','an already recruited prisoner cannot be recruited again');
  ok(JSON.stringify(P)===globalBefore,'the injected service never changes the live player record');
  t.begin('soldier');G.quietEvents=true;const ash=t.townBy('Ashford');P.troops={};P.gold=1000;P.rep[ash.name]=90;ash.vol=2;
  t.enterTown(ash);t.act('tab','recruit');const kind=t.RACES.human.melee,quote=t.recruitment.quoteHire(ash,kind),button=document.querySelector('[data-act="rec-add"][data-arg="'+kind+':1"]'),row=button&&button.closest('.rec-row');
  ok(quote.ok&&button&&!button.disabled&&row.textContent.includes(quote.cost+'g'),'the recruit row uses the service eligibility and price');
  const g0=P.gold;t.act('hire',kind);ok(P.troops[kind]===1&&P.gold===g0-quote.cost&&ash.vol===1,'the existing hire action delegates to the service');
  const saved=JSON.stringify({gold:P.gold,troops:P.troops,txp:P.txp});t.act('hire','missing');t.act('train',kind+':missing');
  ok(JSON.stringify({gold:P.gold,troops:P.troops,txp:P.txp})===saved,'invalid UI action arguments cannot mutate the roster or funds');
  P.txp[kind]=t.txpNeed(kind);t.act('rec-tab','train');const to=t.UP[kind][0],train=document.querySelector('[data-act="train"][data-arg^="'+kind+':'+to+':"]');
  ok(train&&!train.disabled&&t.recruitment.quoteTraining(ash,kind,to).ok,'training eligibility agrees between the screen and service');
  t.act('train',kind+':'+to);ok(P.troops[to]===1&&!P.troops[kind],'the training action changes the roster through the service');
  t.act('leave');G.mode='world';t.saveGame(true);const snapshot=JSON.stringify({gold:P.gold,troops:P.troops,txp:P.txp});t.begin('hedge');t.loadGame();
  ok(JSON.stringify({gold:P.gold,troops:P.troops,txp:P.txp})===snapshot&&t.recruitment.player===P,'save/load keeps recruitment state and the service record reference');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
