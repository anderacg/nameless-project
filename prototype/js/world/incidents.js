'use strict';
/* ---------- the incidents: what befalls you on the road with no one to meet (the weather, sickness, a find). Incident kinds
   (the shape: story/incident.js Incident, which rolls them once a day: Incident.daily), registered with the trigger 'day':
   w = weight, ok(c) = can it happen here and now (c: the story context), run() = what it does, returning its outcome (its log
   line and tone in it). The people you meet on the road are encounters (world/encounters.js, world/road.js) ---------- */
defineKinds('incident',{trigger:'day'},{
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
const INCIDENTS=Kinds.on('incident','day');
// chance: of one a day (.32 while the people met on the road were in the roll; .1 keeps the weather and the finds about as
// often as they came then: they were about 3 in 10 of its weight)
const INCIDENT={chance:.1};
// the day's last word: now and then an incident, never while you stay somewhere (core/systems.js; its roll from the stream
// 'incidents', core/rng.js)
Systems.add({name:'incidents',order:{day:230},day:()=>Incident.daily()});
