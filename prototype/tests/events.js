'use strict';
// Road events: every event can fire somewhere, instant ones log, choices open a dialog, unaffordable choices are disabled, outcomes apply.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=false;P.troops={hum_levy:4};
 const ev=id=>t.EVENTS.find(e=>e.id===id),panel=()=>document.getElementById('panel').innerHTML;
 ok(t.EVENTS.length>=20&&t.EVENTS.filter(e=>e.choices).length>=11,t.EVENTS.length+' events, '+t.EVENTS.filter(e=>e.choices).length+' with choices');
 // force one event at a time
 const fire=id=>{G.mode='world';G.modal=false;t.hidePanel();const keep=t.EVENTS.slice();t.EVENTS.length=0;t.EVENTS.push(keep.find(e=>e.id===id));t.roadEvent();t.EVENTS.length=0;keep.forEach(e=>t.EVENTS.push(e))};
 const g0=P.gold;fire('wagon');ok(P.gold===g0+15&&G.mode==='world','instant events apply and log ('+G.msgs[G.msgs.length-1].m+')');
 fire('traveler');ok(G.mode==='event'&&/wounded traveler/.test(panel())&&document.querySelectorAll('[data-act="ev-choose"]').length===3,'choice events open a dialog with options');
 const gr=t.goodN('grain');t.act('ev-choose','0');ok(t.goodN('grain')===gr-3&&/Continue/.test(panel()),'a choice applies its outcome and shows it');t.act('ev-done');ok(G.mode==='world','Continue returns to the map');
 P.gold=5;fire('bard');ok(document.querySelector('[data-act="ev-choose"][data-arg="0"]').disabled&&/Not enough gold/.test(panel()),'choices you cannot afford are disabled with a reason');t.act('ev-choose','0');ok(G.mode==='event'&&P.gold===5,'a disabled choice does nothing');t.act('ev-choose','1');t.act('ev-done');
 P.gold=500;P.inv=Array(t.INV_SIZE).fill(null);fire('merchant');t.act('ev-choose','0');ok(P.inv.some(x=>x&&x.k==='gear'),'the peddler sells a piece of gear');t.act('ev-done');
 fire('caravan');t.act('ev-choose','0');t.act('ev-done');ok(G.mode==='dialog'&&G.enc&&G.enc.kind==='party','defending the caravan starts a fight');
 ok(G.enc.ref instanceof t.BandParty&&G.enc.ref.troops.length===G.enc.list.length&&G.enc.ref.power()>0,'the ambushers are a band of their own, its fighters the ones you face ('+G.enc.list.length+')');t.act('flee');
 // where each event can happen
 const spot=(clim,terr)=>{for(let i=0;i<t.MW*t.MH;i++)if(t.CLIMS[t.climate[i]]===clim&&t.tiles[i]===terr){P.x=(i%t.MW+.5)*t.TILE;P.y=(Math.floor(i/t.MW)+.5)*t.TILE;return true}return false};
 const seen=new Set();for(const [c,tr] of [['grass',t.T_OPEN],['grass',t.T_FOREST],['grass',t.T_HILL],['frost',t.T_OPEN],['desert',t.T_OPEN],['swamp',t.T_OPEN]]){spot(c,tr);t.EVENTS.forEach(e=>{if(e.ok())seen.add(e.id)})}
 P.x=t.townBy('Ashford').x+30;P.y=t.townBy('Ashford').y;t.EVENTS.forEach(e=>{if(e.ok())seen.add(e.id)});
 const never=t.EVENTS.filter(e=>!seen.has(e.id)).map(e=>e.id);ok(!never.length,'every event can happen somewhere'+(never.length?': never '+never.join(', '):''));
 // frequency
 G.mode='world';G.modal=false;t.hidePanel();let n=0;for(let d=0;d<200;d++){const m=G.msgs.length;t.dayTick();if(G.mode==='event'){n++;t.act('ev-choose',String(t.EVENTS.find(e=>e.id===G.event.id).choices.length-1));t.act('ev-done');G.mode='world'}else if(G.msgs.length>m)n+=0}
 ok(n>15,'choice events come up regularly ('+n+' dialogs in 200 days)');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
