'use strict';
// Report, not a test (run by name: run-tests.ps1 -Suites visual/worldsim): five 120-day campaigns, each seeded (7001 + run), you
// parked off the map. Each day the lords, the caravans and the dragon move as in play: DAY_SECONDS x WORLD_PACE units of d (72; it
// was 12, so lords ran 6x slow: doc/WORLD_DESIGN.md §14.4), then the realms', the markets' and the caravans' day. Prints holdings
// over time, diplomacy counts, sieges laid, how far a lord goes a day (on average, resting too), caravans sent and arrived a day, and the realms'
// treasuries at the end; it never fails on balance.
window.RUN=()=>{const o=[],r0=Math.random;
try{const t=T,G=t.G,P=t.P,W=t.W,DT=.12,PER=Math.round(t.DAY_SECONDS*t.WORLD_PACE/DT);let sent=0,came=0;
 const arrive=(0,eval)('caravanArrive'),send=(0,eval)('sendCaravan');
 (0,eval)('caravanArrive=function(c,to){window.__came++;return window.__arrive(c,to)};sendCaravan=function(t){const c=window.__send(t);if(c)window.__sent++;return c}');
 window.__arrive=arrive;window.__send=send;
 o.push('INFO d a day '+(PER*DT).toFixed(0)+' ('+PER+' steps of '+DT+'), move '+t.WORLD_SCALE.move+', day '+t.DAY_SECONDS+' s');
 for(let run=0;run<5;run++){Math.random=t.seeded(7001+run);window.__sent=0;window.__came=0;
  t.act('begin','soldier');G.quietEvents=true;P.x=-999;P.y=-999;const ev={war:0,truce:0,ally:0,falls:0,defeats:0,failed:0};const snaps=[];let sieges=0,march=0,mdays=0;
  for(let day=0;day<120;day++){
   for(let f=0;f<PER;f++){const was=W.lords.map(l=>[l.x,l.y,l.state]);t.updateLords(DT);t.updateCaravans(DT);t.W.monsters.filter(m=>t.MONSTERS[m.id].mythic).forEach(m=>t.roamMythic(m,DT));
    W.lords.forEach((l,i)=>{const w=was[i];if(!w)return;if(l.state==='siege'&&w[2]!=='siege')sieges++;if(!l.dead&&!l.inside)march+=Math.hypot(l.x-w[0],l.y-w[1])})}
   mdays+=W.lords.filter(l=>!l.dead).length;
   G.day++;t.worldDay();t.mythicDay();t.econDay();t.caravanDay();
   for(const m of G.msgs.splice(0)){const s=m.m;if(/^War!/.test(s))ev.war++;if(/truce/.test(s))ev.truce++;if(/form an alliance/.test(s))ev.ally++;if(/ falls to /.test(s))ev.falls++;if(/ defeats /.test(s))ev.defeats++;if(/fails/.test(s))ev.failed++}
   if(day%30===29)snaps.push(t.FIDS.map(f=>f.slice(0,2)+t.fiefsOf(f).length).join(' '));
  }
  const gold=t.FIDS.map(f=>f.slice(0,2)+Math.round(t.treas(f))).join(' ');
  o.push('run '+run+': holdings by day 30/60/90/120 '+snaps.join(' ')+' fallen='+Object.keys(W.dead).join(',')+' '+JSON.stringify(ev));
  o.push('run '+run+': sieges laid '+sieges+', a lord walks '+(march/Math.max(1,mdays)).toFixed(0)+' px a day ('+(march/Math.max(1,mdays)/t.TILE).toFixed(1)+' tiles), caravans sent '+(window.__sent/120).toFixed(2)+' and arrived '+(window.__came/120).toFixed(2)+' a day ('+W.caravans.length+' on the road), treasuries '+gold);
 }
 (0,eval)('caravanArrive=window.__arrive;sendCaravan=window.__send');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{Math.random=r0}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
