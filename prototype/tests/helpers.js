'use strict';
// Relocated helpers keep their numeric behavior and their consumers' ordering, counts and capacity semantics.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
  const t=T,P=t.P,G=t.G,W=t.W;
  const get=url=>{const x=new XMLHttpRequest();x.open('GET',url,false);x.send();return x.responseText};
  const core=get('js/core/core.js'),state=get('js/core/state.js');
  ok(['sum','seeded','angGap'].every(n=>new RegExp('^const '+n+'=', 'm').test(core)),'shared numeric helpers belong to core, not rendering or battle files');
  ok(/^const partyRoom=/m.test(state)&&!/^const partyRoom=/m.test(get('js/world/conduct.js')),'party room belongs to state, not conduct dialogs');
  ok(t.sum({})===0&&t.sum({a:2,b:3})===5&&t.sum([2,3])===5,'sum preserves empty, count-record and array behavior');
  const random=Math.random,r=t.seeded(1),expected=[1015568748,1586005467,2165703038,3027450565,217083232];
  ok(expected.every(n=>r()===n/4294967296),'seeded RNG keeps the exact pre-cleanup sequence');
  const a=t.seeded(77),b=t.seeded(77);ok(Array.from({length:100},()=>a()===b()).every(Boolean),'equal seeds produce independent identical streams');
  const range=t.seeded(0);ok(Array.from({length:1000},()=>range()).every(n=>n>=0&&n<1)&&Math.random===random,'seeded samples stay in range without replacing the global random source');
  ok(t.angGap(0,0)===0&&t.angGap(0,Math.PI)===Math.PI,'angle gaps preserve identical and opposite facings');
  ok(Math.abs(t.angGap(Math.PI-.1,-Math.PI+.1)-.2)<1e-12,'angle gaps wrap across the negative/positive pi seam');
  let same=true;for(let i=-12;i<=12;i++)for(let j=-12;j<=12;j++){const x=i*.71,y=j*.37,old=Math.abs(Math.atan2(Math.sin(x-y),Math.cos(x-y)));same=same&&t.angGap(x,y)===old}
  ok(same,'625 angle pairs exactly match the previous inline formula');
  const target={x:0,y:0,face:1},source=angle=>({x:Math.cos(angle)*20,y:Math.sin(angle)*20});
  ok(t.sideOf(target,source(1.04))==='front'&&t.sideOf(target,source(1.06))==='flank'&&t.sideOf(target,source(2.11))==='rear','front/flank/rear thresholds remain unchanged');
  ok(t.inShape(0,0,Math.PI-.05,50,{arc:.2},{x:-20,y:-1,s:{}})&&!t.inShape(0,0,0,50,{arc:.2},{x:-20,y:-1,s:{}}),'melee arcs wrap correctly and still reject an enemy behind the facing');

  try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
  P.comps={};P.wounded={hum_levy:2};P.troops={hum_levy:3};
  ok(t.partyRoom()===t.partyCap()-5,'party room includes wounded soldiers');
  P.troops={hum_levy:t.partyCap()+2};ok(t.partyRoom()===-4,'over-cap room stays negative rather than silently changing transfer rules');
  ok(t.garrisons.rules.room===t.partyRoom,'garrison call-ups use the same party-room rule');
  P.wounded={};P.troops={hum_levy:5,hum_bow:3};P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;
  t.cpGive('brann','hum_levy',3);t.cpGive('brann','hum_bow',2);const party=c.party,snapshot=JSON.stringify(party.tc);
  G.mode='world';G.modal=false;t.hidePanel();t.openComp('brann');let text=document.getElementById('panel').textContent;
  const levy=t.ST.hum_levy.n,bow=t.ST.hum_bow.n;
  const take=()=>document.querySelector('[data-cp-transfer="take"] [data-cp-field="source"]'),options=[...take().options].map(el=>el.textContent);
  ok(options.some(s=>s.includes(levy)&&s.includes('3 fit'))&&options.some(s=>s.includes(bow)&&s.includes('2 fit')),'companion source choices show separate groups and fit counts');
  ok(options[0].includes(levy)&&options[1].includes(bow)&&JSON.stringify(party.tc)===snapshot,'group choices preserve formation order without changing party counts');
  t.cpDisband('brann',false);t.renderComp();ok(!take(),'a companion without a party has no stale take-back choices');

  const town=t.TOWNS.find(h=>h.kind==='town');town.gar=10;W.lords=[];
  const div=document.createElement('div');div.innerHTML=t.garrisonBody(town);const rows=[...div.querySelectorAll('.row')];
  ok(Object.entries(t.countsOf(t.garList(town))).every(([k,n])=>rows.some(row=>row.querySelector('strong').textContent===t.ST[k].n&&row.querySelector('.own')?.textContent==='×'+n)),'garrison troop rows retain each kind and its count');
  W.lords=[{id:'helper-test',name:'Test Lord',fac:town.owner,inside:town.name,dead:false,troops:['hum_spear','hum_bow','hum_spear','hum_bow','hum_spear']}];
  div.innerHTML=t.garrisonBody(town);text=div.textContent;
  ok(text.includes('3 '+t.ST.hum_spear.n.toLowerCase()+', 2 '+bow.toLowerCase()),'lords inside keep their descending-count troop summary');
  ok(typeof t.takeNodeOf==='function'&&typeof t.slotSkillOf==='function'&&typeof t.partyAdd==='function'&&typeof t.compEquip==='function','live compatibility commands remain available');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
