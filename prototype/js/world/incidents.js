'use strict';
/* ---------- the incidents: what befalls you on the road with no one to meet (the weather, sickness, a find). Incident kinds
   (the shape: story/incident.js Incident, which rolls them once a day: Incident.daily), registered with the trigger 'day':
   w = weight, ok(c) = can it happen here and now (c: the story context), run() = what it does, returning its outcome (its log
   line and tone in it). The weather's come only in their weather where you are (c.weather: world/weather.js; a storm, a blizzard,
   a sandstorm, rain, a heat wave, a clear sky). The people you meet on the road are encounters (world/encounters.js, world/road.js) ---------- */
// (n of your men hurt, of a kind drawn from the stream 'incidents': an outcome's wounded, or none without men)
function incidentHurt(n){
  const ks=Object.keys(P.troops||{}).filter(k=>P.troops[k]>0);
  if(!ks.length)return null;
  const k=rngOf('incidents').pick(ks);
  return {[k]:Math.min(n,P.troops[k])};
}
// (at home in the climate there: your race's)
const incidentHome=c=>RACES[P.race].home.includes(c.climate);
defineKinds('incident',{trigger:'day'},{
  fever:{w:1.5,ok:(c=storyCtx())=>c.climate!=='swamp',
    run:()=>({morale:-6,log:['Fever spreads through the camp. Morale drops.','bad']})},
  storm:{w:3,ok:(c=storyCtx())=>c.weather==='storm',
    run:()=>({food:-2,log:['A storm soaks your supplies. Some food is ruined.','bad']})},
  blizzard:{w:3,ok:(c=storyCtx())=>c.weather==='blizzard',
    run:(c=storyCtx())=>{
      if(incidentHome(c))return {log:['A blizzard howls, but your dwarven instincts find shelter.','good']};
      return {food:-3,morale:-4,log:['A blizzard buries the camp. You lose food and spirits sink.','bad']};
    }},
  sandstorm:{w:3,ok:(c=storyCtx())=>c.weather==='sandstorm',
    run:(c=storyCtx())=>{
      if(incidentHome(c))return {log:['A sandstorm rolls past. Your band shrugs it off.','good']};
      return {food:-2,morale:-4,log:['A sandstorm scours the camp. Supplies are lost.','bad']};
    }},
  // (the rain swells the fords: the long way round)
  flood:{w:2,ok:(c=storyCtx())=>c.weather==='rain'||c.weather==='storm',
    run:()=>({food:-1,morale:-2,log:['The rain has swollen the ford ahead. The long way round costs food and tempers.','bad']})},
  // (a lightning strike: a tree split by the camp, a man or two hurt by its fall)
  lightning:{w:2,ok:(c=storyCtx())=>c.weather==='storm',
    run:()=>{
      const hurt=incidentHurt(rngOf('incidents').int(1,2));
      if(!hurt)return {morale:-2,log:['Lightning splits a tree beside the camp. Nobody is hurt, but nobody sleeps.','bad']};
      return {wounded:hurt,morale:-2,log:['Lightning splits a tree beside the camp; its fall hurts some of your men.','bad']};
    }},
  // (frostbite in a blizzard, but for those at home in the frost)
  frostbite:{w:2,ok:(c=storyCtx())=>c.weather==='blizzard'&&!incidentHome(c),
    run:()=>{
      const hurt=incidentHurt(2);
      return hurt?{wounded:hurt,log:['Frostbite takes hold in the blizzard. Some of your men cannot march.','bad']}:{morale:-3,log:['The cold bites to the bone.','bad']};
    }},
  // (lost in a sandstorm: a day's march wasted)
  lost:{w:2,ok:(c=storyCtx())=>c.weather==='sandstorm',
    run:()=>({food:-1,morale:-3,log:['You lose the way in the blowing sand and march in circles until it lifts.','bad']})},
  heat:{w:2,ok:(c=storyCtx())=>c.weather==='heat',
    run:(c=storyCtx())=>incidentHome(c)?{log:['The heat is fierce, but your band is used to it.','good']}:{morale:-3,log:['The heat saps the band. Every mile is a struggle.','bad']}},
  // (a fine day: a clear sky over green land)
  fineday:{w:1,ok:(c=storyCtx())=>c.weather==='clear'&&c.climate==='grass',
    run:()=>({morale:3,log:['A clear sky and a dry road: a fine day lifts the band\'s spirits.','good']})},
  // (the roll first: a real spring or a mirage)
  mirage:{w:2,ok:(c=storyCtx())=>c.climate==='desert'&&c.weather!=='sandstorm',
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
