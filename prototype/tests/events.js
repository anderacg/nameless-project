'use strict';
// Road events: the weather, the sickness and the finds, instant as ever: every one can fire somewhere, each logs its line and opens
// no window, and they come about as often as they did. The people met on the road are encounters on the map now
// (world/road.js, tests/encounters.js), out of this roll.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=false;P.troops={hum_levy:4};
 const ids=t.EVENTS.map(e=>e.id);
 ok(ids.join()==='wagon,fever,storm,blizzard,sandstorm,mirage'&&t.EVENTS.every(e=>typeof e.run==='function'&&!e.choices),'the road events are instant: '+ids.join(', '));
 const people=['refugees','pilgrims','warning','traveler','merchant','shrine','deserters','gamblers','mine','hunters','child','bard','wisps','caravan','ambush'];
 ok(!people.some(id=>ids.includes(id))&&(0,eval)('typeof TERRAIN_EVENTS')==='undefined','the people events are out of the roll (on the map now: '+Object.keys(t.ROAD_ENC).length+' kinds of encounter)');
 // force one event at a time
 const fire=id=>{G.mode='world';G.modal=false;t.hidePanel();const keep=t.EVENTS.slice();t.EVENTS.length=0;t.EVENTS.push(keep.find(e=>e.id===id));t.roadEvent();t.EVENTS.length=0;keep.forEach(e=>t.EVENTS.push(e))};
 const g0=P.gold;fire('wagon');ok(P.gold===g0+15&&G.mode==='world'&&!G.modal&&/abandoned wagon/.test(G.msgs[G.msgs.length-1].m),'instant events apply and log ('+G.msgs[G.msgs.length-1].m+')');
 const spot=(clim,terr)=>{for(let i=0;i<t.MW*t.MH;i++)if(t.CLIMS[t.climate[i]]===clim&&t.tiles[i]===terr){P.x=(i%t.MW+.5)*t.TILE;P.y=(Math.floor(i/t.MW)+.5)*t.TILE;return true}return false};
 {spot('frost',t.T_OPEN);P.race='human';t.invAdd('good','grain',10);const f0=t.foodN(),m0=P.morale=60;fire('blizzard');ok(t.foodN()===f0-3&&P.morale===m0-4&&/blizzard buries/.test(G.msgs[G.msgs.length-1].m),'a blizzard in the frost: −3 food, morale −4, as before')}
 {const m0=P.morale=60;fire('fever');ok(P.morale===m0-6&&G.mode==='world','a fever: morale −6, no window')}
 G.quietEvents=true;const n0=G.msgs.length;t.roadEvent();ok(G.msgs.length===n0,'quiet events: none');G.quietEvents=false;
 // where each event can happen
 const seen=new Set();for(const [c,tr] of [['grass',t.T_OPEN],['grass',t.T_FOREST],['grass',t.T_HILL],['frost',t.T_OPEN],['desert',t.T_OPEN],['swamp',t.T_OPEN]]){spot(c,tr);t.EVENTS.forEach(e=>{if(e.ok())seen.add(e.id)})}
 const never=t.EVENTS.filter(e=>!seen.has(e.id)).map(e=>e.id);ok(!never.length,'every event can happen somewhere'+(never.length?': never '+never.join(', '):''));
 // how often: about one in ten days (ROAD_EVENT_DAY), as the weather and the finds came while the people were in the roll
 {spot('grass',t.T_OPEN);G.mode='world';G.modal=false;t.hidePanel();let n=0;const keep=t.EVENTS.map(e=>e.run);t.EVENTS.forEach((e,i)=>{e.run=()=>{n++;return keep[i]()}});
  for(let d=0;d<300;d++){t.dayTick();G.mode='world';G.modal=false;t.hidePanel()}t.EVENTS.forEach((e,i)=>e.run=keep[i]);
  ok(n>=15&&n<=50,'they come about once in ten days ('+n+' in 300 days; chance '+t.ROAD_EVENT_DAY+' a day)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
