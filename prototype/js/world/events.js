'use strict';
/* ---------- road events: what befalls you on the road without anyone to meet (the weather, sickness, a find). Each: w = weight,
   ok() = can it happen here and now, run() = what it does, returning a log line and its tone. The people you meet on the road are
   encounters on the map now (world/encounters.js, doc/ENCOUNTERS_DESIGN.md), no longer events ---------- */
const nearHold=()=>{const t=nearestOf(P,TOWNS);return t&&Math.hypot(t.x-P.x,t.y-P.y)<WORLD_SCALE.law.eventNear*TILE?t:null};
const gainGrain=n=>invAdd('good','grain',n);
const EVENTS=[
  {id:'wagon',w:2,ok:()=>true,run:()=>{P.gold+=15;return['You find an abandoned wagon and sell what is in it for 15 gold.','good']}},
  {id:'fever',w:1.5,ok:()=>climAt(P.x,P.y)!=='swamp',run:()=>{P.morale-=6;return['Fever spreads through the camp. Morale drops.','bad']}},
  {id:'storm',w:1.5,ok:()=>true,run:()=>{foodTake(2);return['A storm soaks your supplies. Some food is ruined.','bad']}},
  {id:'blizzard',w:3,ok:()=>climAt(P.x,P.y)==='frost',run:()=>{if(RACES[P.race].home.includes('frost'))return['A blizzard howls, but your dwarven instincts find shelter.','good'];foodTake(3);P.morale-=4;return['A blizzard buries the camp. You lose food and spirits sink.','bad']}},
  {id:'sandstorm',w:3,ok:()=>climAt(P.x,P.y)==='desert',run:()=>{if(RACES[P.race].home.includes('desert'))return['A sandstorm rolls past. Your band shrugs it off.','good'];foodTake(2);P.morale-=4;return['A sandstorm scours the camp. Supplies are lost.','bad']}},
  {id:'mirage',w:2,ok:()=>climAt(P.x,P.y)==='desert',run:()=>Math.random()<.5?(P.morale+=5,['Your scouts find a real spring among the dunes. Everyone drinks deep.','good']):(P.morale-=2,['The lake on the horizon was only a mirage. Spirits sag.','bad'])}
];
function nearMount(){const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(tAt(tx+i,ty+j)===T_MOUNT)return true;return false}
// the chance of one a day (dayTick): .32 while the people were in the roll; .1 keeps the weather and the finds about as often
// as they came then (they were about 3 in 10 of its weight)
const ROAD_EVENT_DAY=.1;
// called from the daily tick: one of the events that can come here and now, by weight
function roadEvent(){
  if(G.quietEvents||G.mode!=='world'||G.modal)return;
  const ok=EVENTS.filter(e=>e.ok());let r=Math.random()*ok.reduce((a,e)=>a+e.w,0),ev=ok[0];for(const e of ok){r-=e.w;if(r<=0){ev=e;break}}
  if(!ev)return;const [m,c]=ev.run();log(m,c);
}
