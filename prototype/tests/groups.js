'use strict';
// Troop groups: per-group orders, advance, spread and tournaments.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');P.troops={};P.gold=500;t.enterTown(t.TOWNS[1]);t.act('tab','tavern');t.act('hire-comp','brann');P.troops={militia:4,spearman:2,archer:4,horse:3};t.act('leave');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 t.startEncounter({kind:'party',ref:t.bandits[0],n:10});t.act('fight');const B=t.B;
 const n=g=>t.grpUnits(g).length;ok(n('inf')===7&&n('arc')===4&&n('cav')===3,'groups inf='+n('inf')+' arc='+n('arc')+' cav='+n('cav'));
 ok(['hero','inf','arc','cav'].every(g=>B.groups[g].order==='hold'),'defaults: every group holds until you order it');
 const btn=document.querySelector('[data-grp="cav"] .cn').textContent;ok(btn==='Cavalry 3','button label '+btn);
 t.selectGroup('inf');t.setOrder('charge');ok(!t.walking(B.groups.inf)&&t.walking(B.groups.cav)&&B.groups.inf.order==='hold','per-group pace: Charge sets the infantry running, the cavalry still walks, and nobody is sent anywhere');t.setOrder('advance');ok(t.walking(B.groups.inf),'Advance: walking again');t.setOrder('hold');
 t.cycleGroup();ok(B.sel==='arc','cycle -> '+B.sel);t.setForm('loose');ok(B.groups.arc.form==='loose'&&B.groups.inf.form==='line','archers into loose order (the old spread)');
 t.selectGroup('cav');B.groups.cav.order='advance';const ax0=B.groups.cav.ax;// (an advance on the enemy: the AI's order, yours when it commands)
 const infX0=t.grpUnits('inf').map(u=>u.x);
 for(let i=0;i<30;i++){t.updateBattle(.033);t.frame()}
 ok(B.groups.cav.ax>ax0,'cav advancing '+ax0.toFixed(0)+'->'+B.groups.cav.ax.toFixed(0));
 const drift=Math.max(...t.grpUnits('inf').map((u,i)=>Math.abs(u.x-infX0[i])));ok(drift<15,'infantry holding, max drift '+drift.toFixed(1));
 ok(!document.querySelector('[data-order="follow"]')&&!document.querySelector('[data-order="halt"]')&&document.querySelector('[data-order="hold"]').dataset.key==='H','no Follow or Halt any more: Hold (H) stops them where they stand');
 for(const g of ['hero','inf','arc','cav'])if(B.groups[g]){B.groups[g].order='charge';B.groups[g].run=true}let i=0;while(t.B&&i<9000){t.updateBattle(.033);if(t.B)t.frame();i++}
 ok(!t.B,'battle ends after charge in '+i+' steps, mode '+G.mode);
 t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 P.gold=100;t.enterTown(t.TOWNS[1]);t.act('tab','tavern');t.act('tourney');ok(t.B&&t.grpUnits('inf').length===0,'tournament has no groups');
 t.setOrder('hold');t.cycleGroup();ok(t.B.sel==='hero','in a tournament your hero is your one group: cycling picks them');for(let k=0;k<5;k++){t.updateBattle(.033);t.frame()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
