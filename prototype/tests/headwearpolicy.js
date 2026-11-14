'use strict';
// Alternate headwear stays in the player catalog; NPCs use its period replacement.
Kit.suite(({ok})=>{
 const E=T.PortraitEngine,C=T.PortraitCharacters,old=['cap','beret','fur-cap','feathered-cap','heraldic-cap'],period=old.map(E.npcHeadwear),player=C.recipe({config:{...E.random(718,'male','human'),headwear:'heraldic-cap'}});
 ok(old.every(h=>E.options.headwear.includes(h)&&E.normalize({headwear:h}).headwear===h&&E.headwearUsage[h].ai===false&&E.partLabels[h].includes('AI excluded')),'all five alternate designs remain manually selectable and visibly tagged AI excluded');
 ok(new Set(period).size===5&&period.every(h=>E.options.headwear.includes(h)&&E.headwearUsage[h].ai&&E.headwearRules[h]),'all five alternate designs have distinct AI-eligible medieval replacements');
 ok(player.config.headwear==='heraldic-cap','player recipes preserve an explicitly chosen alternate cap');
 let cases=0;for(const race of E.races)for(const role of Object.keys(C.roles))for(const mode of ['random','mixed','preset']){
  const presets=Array.from({length:8},(_,i)=>({name:'Alternate '+i,roles:[role],config:{...E.random(901+i*71,'male',race),headwear:old[i%old.length]}}));
  const records=C.generateNPCs({player,race,profile:'male',role,mode,seed:803,count:1,presets});
  if(records.some(r=>!E.headwearUsage[r.config.headwear]?.ai))throw Error('AI selected excluded headwear: '+race+'/'+role+'/'+mode);cases++;
 }
 ok(cases===E.races.length*Object.keys(C.roles).length*3,'every race and role excludes archived headwear in random, mixed and preset NPC generation');
 let converted=0;for(const headwear of old){const preset={name:'Archived '+headwear,roles:['lord'],config:{...E.random(991+converted*97,'male','human'),headwear}};let found=false;
  for(let seed=1;seed<=80&&!found;seed++){const r=C.generateNPCs({player,race:'human',profile:'male',role:'lord',mode:'preset',seed,count:1,presets:[preset]})[0];if(r.sourcePreset===preset.name){if(r.config.headwear!==E.npcHeadwear(headwear))throw Error('Preset bypasses AI policy');found=true;}}
  if(!found)throw Error('Archived preset was not exercised');converted++;
 }
 ok(converted===5,'explicit archived NPC presets keep their face while substituting the corresponding medieval headwear');
 const r=C.generateNPCs({player,race:'human',role:'lord',mode:'random',seed:46,count:1})[0];r.config.headwear='heraldic-cap';const saved={version:E.version,seed:46,player,characters:[r]},roster=C.Roster.restore(saved);
 ok(roster.get(r.id).config.headwear==='noble-chaperon'&&roster.create({id:r.id}).config.headwear==='noble-chaperon','restored NPCs and existing-ID lookups also respect the exclusion');
 ok(roster.export().characters[0].config.headwear==='heraldic-cap'&&roster.player.config.headwear==='heraldic-cap','NPC presentation applies the policy without rewriting saved recipes or the player choice');
});
