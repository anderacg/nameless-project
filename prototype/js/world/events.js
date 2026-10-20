'use strict';
/* ---------- road events: what befalls you on the road without anyone to meet (the weather, sickness, a find). They are the
   incidents (story/incident.js, the Incident shape), kinds registered with the trigger 'day': w = weight, ok(c) = can it happen
   here and now (c: the story context), run() = what it does, returning its outcome (its log line and tone in it). The people
   you meet on the road are encounters on the map now (world/encounters.js, doc/ENCOUNTERS_DESIGN.md), no longer events ---------- */
const nearHold=()=>{const t=Spatial.nearestHolding(P.x,P.y);return t&&Math.hypot(t.x-P.x,t.y-P.y)<WORLD_SCALE.law.eventNear*TILE?t:null};
const gainGrain=n=>invAdd('good','grain',n);
defineKinds('incident',{trigger:'day'},{
  wagon:{w:2,ok:()=>true,
    run:()=>({gold:15,log:['You find an abandoned wagon and sell what is in it for 15 gold.','good']})},
  fever:{w:1.5,ok:(c=storyCtx())=>c.climate!=='swamp',
    run:()=>({morale:-6,log:['Fever spreads through the camp. Morale drops.','bad']})},
  storm:{w:1.5,ok:()=>true,
    run:()=>({food:-2,log:['A storm soaks your supplies. Some food is ruined.','bad']})},
  blizzard:{w:3,ok:(c=storyCtx())=>c.climate==='frost',
    run:()=>{
      if(RACES[P.race].home.includes('frost'))return {log:['A blizzard howls, but your dwarven instincts find shelter.','good']};
      return {food:-3,morale:-4,log:['A blizzard buries the camp. You lose food and spirits sink.','bad']};
    }},
  sandstorm:{w:3,ok:(c=storyCtx())=>c.climate==='desert',
    run:()=>{
      if(RACES[P.race].home.includes('desert'))return {log:['A sandstorm rolls past. Your band shrugs it off.','good']};
      return {food:-2,morale:-4,log:['A sandstorm scours the camp. Supplies are lost.','bad']};
    }},
  // (the roll first: a real spring or a mirage)
  mirage:{w:2,ok:(c=storyCtx())=>c.climate==='desert',
    run:()=>{
      if(rngOf('incidents').chance(.5))return {morale:5,log:['Your scouts find a real spring among the dunes. Everyone drinks deep.','good']};
      return {morale:-2,log:['The lake on the horizon was only a mirage. Spirits sag.','bad']};
    }},
});
// the day's bucket, in the order defined (the roll's, and the tests' and the wiki's list)
const EVENTS=Kinds.on('incident','day');
function nearMount(){const tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE);for(let j=-2;j<=2;j++)for(let i=-2;i<=2;i++)if(tAt(tx+i,ty+j)===T_MOUNT)return true;return false}
// the chance of one a day (dayTick): .32 while the people were in the roll; .1 keeps the weather and the finds about as often
// as they came then (they were about 3 in 10 of its weight)
const ROAD_EVENT_DAY=.1;
// called from the daily tick: one of the incidents that can come here and now, by weight, befalls you
function roadEvent(){
  if(G.quietEvents||G.mode!=='world'||G.modal)return;
  const c=storyCtx(),K=Incident.pick(EVENTS,c);
  if(K)Incident.befall(K,c);
}
// the day's last word: now and then an event on the road, never while you stay somewhere (core/systems.js; its roll from the
// stream 'incidents', core/rng.js)
Systems.add({name:'road events',order:{day:230},day:()=>{if(!P.stay&&rngOf('incidents').chance(ROAD_EVENT_DAY))roadEvent()}});
