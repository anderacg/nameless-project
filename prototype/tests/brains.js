'use strict';
// Brains: each kind of party on the map behaves through one class (lord, band, companion's party, patrol, caravan) over the
// same steps: cool down, size you up (sight: less when you are hidden, none while you stay inside), then act. One loop runs
// them all and stops when one of them opens an encounter.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;W.monsters=[];W.critters=[];
 const all=W.parties;ok(all.every(p=>p.brain instanceof t.Brain&&p.brain===t.BRAINS[p.mapKind]),'every party has the brain of its kind');
 ok(['lord','band','cparty','patrol','caravan'].every(k=>t.BRAINS[k] instanceof t.Brain)&&t.BRAINS.lord instanceof t.LordBrain&&t.BRAINS.band instanceof t.BandBrain,'one brain for each kind, all built on Brain');
 // the shared steps
 {const B=t.BRAINS.band,b={cool:2};B.cool(b,.5);ok(b.cool===1.5,'its cool-down runs');
  const open=P.x;P.x=open;const s0=B.sight(100);P.stay={town:'x'};const s1=B.sight(100);P.stay=null;ok(s0>0&&s1===0,'it cannot see you while you stay inside ('+s0+' → '+s1+')');
  ok(B.canMeet({cool:0},5)===(G.encCool<=0&&!G.modal)&&!B.canMeet({cool:0},20),'it meets you only when close and free to')}
 // one loop for all: each kind's brain runs
 {const seen={};const keep={};for(const k in t.BRAINS){keep[k]=t.BRAINS[k].think;t.BRAINS[k].think=function(o,d,n){seen[k]=(seen[k]||0)+1;return keep[k].call(this,o,d,n)}}
  P.comps={brann:{ap:5,role:''}};const c=t.compInit('brann');c.lv=3;P.troops={hum_levy:6};t.cpGive('brann','hum_levy',3);
  if(!(W.caravans||[]).length){const from=t.TOWNS.find(z=>z.owner&&z.stock);for(let i=0;i<20&&!W.caravans.length;i++)t.sendCaravan(from)}
  G.encCool=1e9;t.updateParties(.05);for(const k in keep)t.BRAINS[k].think=keep[k];
  ok(['lord','band','cparty','patrol'].every(k=>seen[k]>0)&&(seen.caravan>0||!W.caravans.length),'one loop runs every kind ('+Object.keys(seen).map(k=>k+' '+seen[k]).join(', ')+')')}
 // it stops at an encounter
 {G.encCool=0;G.modal=false;G.mode='world';W.fights=[];P.comps={};// (your companion’s party would run the band down first)
  const b=t.bandits[0];t.bandits.forEach(x=>{x.fight=null;if(x!==b){x.x=-999;x.y=-999}});W.lords.forEach(l=>{l.fight=null;l.x=-999});W.patrols=[];b.cool=0;b.x=P.x+3;b.y=P.y;P.troops={};b.power();const met=t.updateParties(.01);ok(met&&(G.enc&&G.enc.ref===b||G.par&&G.par.o===b),'and stops when a band meets you (to fight, or to yield if it is cornered)');if(G.enc)t.act('flee')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
