'use strict';
/* ---------- the world's events: a bus (doc/CORE_DESIGN.md, K2; doc/STORY_DESIGN.md §3.6) ----------
   The world's twin of the battle's battleOn (battle/battle.js): a system says once, where it happens, that something happened
   (worldEmit('raided', {town})), and whoever cares listens (worldOn('raided', fn)) without the two knowing each other.
   Listeners run at once, in the order they were added, with the event's data (and its type); they read the state of that
   moment.
   Infrastructure only for now: the story wave moves today's direct calls (questNotify, newsRecord) onto it. */
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
