'use strict';
// World sim report: five 120-day campaigns. Prints holdings over time and diplomacy counts; it never fails on balance.
window.RUN=()=>{const o=[];
try{const t=T,G=t.G,P=t.P,W=t.W;
 for(let run=0;run<5;run++){
  t.act('begin','soldier');P.x=-999;P.y=-999;const ev={war:0,truce:0,ally:0,falls:0,defeats:0,failed:0};const snaps=[];
  for(let day=0;day<120;day++){
   for(let f=0;f<300;f++){t.updateLords(.04);t.W.monsters.filter(m=>t.MONSTERS[m.id].mythic).forEach(m=>t.roamMythic(m,.04))}G.day++;t.worldDay();t.mythicDay();
   for(const m of G.msgs.splice(0)){const s=m.m;if(/^War!/.test(s))ev.war++;if(/truce/.test(s))ev.truce++;if(/form an alliance/.test(s))ev.ally++;if(/ falls to /.test(s))ev.falls++;if(/ defeats /.test(s))ev.defeats++;if(/fails/.test(s))ev.failed++}
   if(day%30===29)snaps.push(t.FIDS.map(f=>f.slice(0,2)+t.fiefsOf(f).length).join(' '));
  }
  o.push('run '+run+': holdings by day 30/60/90/120 '+snaps.join(' ')+' fallen='+Object.keys(W.dead).join(',')+' '+JSON.stringify(ev));
 }
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
