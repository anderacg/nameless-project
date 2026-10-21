'use strict';
/* ---------- the world's events: a bus (doc/CORE_DESIGN.md, K2; doc/STORY_DESIGN.md §3.6) ----------
   The world's twin of the battle's battleOn (battle/battle.js): a system says once, where it happens, that something happened
   (worldEmit('holding:raided', {town})), and whoever cares listens (worldOn('holding:raided', fn)) without the two knowing each other.
   Listeners run at once, in the order they were added, with the event's data (and its type); they read the state of that
   moment.
   The events, named noun:verb (the story wave, S3: the old direct calls questNotify and newsRecord are these now). "You": by
   your hand; the rest: by anyone.
   | event            | data                    | emitted where                                           | heard by          |
   |------------------|-------------------------|---------------------------------------------------------|-------------------|
   | band:beaten      | {band}                  | you broke it: battle/engage.js (a band, a camp's),  | quests (bounty)   |
   |                  |                         | battle/parley.js (bandGone, lairGone)                   |                   |
   | monster:slain    | {monster}               | you slew it: battle/engage.js                       | quests (beast)    |
   | site:cleared     | {site}                  | you cleared it: battle/engage.js (camp, cave),      | quests (clear)    |
   |                  |                         | battle/parley.js (lairGone)                             |                   |
   | lord:beaten      | {lord}                  | you beat him: world/realms.js lordWon, parley.js (yield)| quests (lordkill) |
   | holding:razed    | {town}                  | you raided it to the ground: world/siege.js finishRaid  | quests (raid)     |
   | holding:raided   | {town}                  | you raided it (any part): world/siege.js finishRaid     | news (raid)       |
   | estate:burnt     | {town, estate}          | you burnt it: world/estates.js estateWon                | news (raid)       |
   | holding:taken    | {town, lord, sacked}    | it fell to a siege: world/realms.js resolveSiege        | news (fell)       |
   | siege:laid       | {town, lord}            | world/brains.js (a lord's march)                        | news (siege)      |
   | siege:broken     | {town, lord}            | world/realms.js (lordWon, resolveSiege), fights.js      | news (relieved)   |
   | lord:routed      | {lord}                  | his army broken: world/realms.js lordWon, fights.js     | news (lord)       |
   | caravan:robbed   | {caravan}               | you took it: world/caravans.js loot                     | news (caravan)    |
   | caravan:beaten   | {caravan, lord, band}   | taken on the map (the winners' lord, band): fights.js   | news (caravan)    |
   | fight:ended      | {fight, won, lost}      | a battle on the map: world/fights.js endFight           | news (fight, band)|
   | trace:left       | {e, trace}              | an encounter's trace: story/happening.js drop           | news (trace)      |
   | land:threat      | {town, foe}             | a beast or band on its land: world/defence.js           | news (beast, band)|
   | encounter:ended  | {e, how: done or left}  | story/happening.js (Happening.announceEnd)              | threads' steps    |
   | incident:ended   | {e}                     | story/incident.js                                       | (none yet)        |
   | quest:ended      | {e, how: paid or failed}| story/quest.js (paid or failed)                         | threads' steps    |
   | page:chosen      | {e, how}                | story/thread.js (a thread's page: the choice's how)     | threads' steps    |
   | thread:ended     | {e, how}                | story/thread.js (its last step ended: that step's key)  | (none yet)        |
   | gathering:announced | {e, at, day}         | story/gathering.js (told of: its place, the day it opens)| (none yet)       |
   | gathering:opened | {e, at, day}            | story/gathering.js                                      | (none yet)        |
   | gathering:closed | {e, at, day}            | story/gathering.js (its end: the day it closed)         | (none yet)        |
   A new event is one worldEmit where it happens and one row here. */
const WORLD_EARS=new Map();
// listen to one type of event; returns fn (to pass to worldOff)
function worldOn(type,fn){
  let ears=WORLD_EARS.get(type);
  if(!ears)WORLD_EARS.set(type,ears=[]);
  ears.push(fn);
  return fn;
}
function worldOff(type,fn){
  const ears=WORLD_EARS.get(type);
  if(!ears)return;
  const i=ears.indexOf(fn);
  if(i>=0)ears.splice(i,1);
}
// tell every listener of type, in order (a copy of the list: one that stops listening as it hears is no trouble)
function worldEmit(type,data){
  const ears=WORLD_EARS.get(type);
  if(!ears||!ears.length)return;
  for(const fn of ears.slice())fn(data,type);
}
