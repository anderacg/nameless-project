'use strict';
/* ---------- core: DOM handles, canvas, constants and tiny helpers ---------- */
const $=s=>document.querySelector(s);
const TILE=16,VW=576,VH=360,MW=224,MH=160,DAY=12,SAVE='ashmark.save.v1';
const cv=$('#game'),ctx=cv.getContext('2d');
cv.width=VW;cv.height=VH;ctx.imageSmoothingEnabled=false;
const ov=$('#ov'),panel=$('#panel'),bbar=$('#bbar');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const rint=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
// pace: share of full speed for the world (travel, days, everyone on the map) and for battles (movement, attacks, arrows).
// Visual effects ignore it. Lower is calmer; 1 is the original pace.
// the world clock: one day (DAY clock units) lasts DAY_SECONDS real seconds at 1x speed, whatever the travel pace;
// the first 60% is daylight, then dusk, night and dawn fill the last 40% (NIGHT_AT on)
const DAY_SECONDS=120,NIGHT_AT=.6;
const WORLD_PACE=.6,BATTLE_PACE=.6,HERO_PACE=.85;
const MAP_AREA=MW*MH/(112*80),MAP_DENS=.75*MAP_AREA; // the world is 4x the old map; wild things are 3x as many
const BANDITS=Math.round(10*MAP_DENS),MONSTER_CAP=Math.round(20*MAP_DENS),MONSTER_START=Math.round(16*MAP_DENS);
// actions: every button names one (data-act="prefix-name"); each system claims its prefix once with onAct, so two systems can
// never answer the same button. Actions without a registered prefix fall through to the town and encounter handlers in input.js.
const ACTS={};
function onAct(prefix,fn){if(!/^[a-z]+-$/.test(prefix))throw new Error('Action prefixes look like "name-": '+prefix);if(ACTS[prefix])throw new Error('Two systems claim the action prefix '+prefix);ACTS[prefix]=fn}
// run a registered action; false if no system owns its prefix
function routeAct(a,arg){const i=a.indexOf('-'),fn=i>0&&ACTS[a.slice(0,i+1)];if(!fn)return false;fn(a,arg);return true}
const cap1=w=>w[0].toUpperCase()+w.slice(1);
const an=w=>(/^[aeiou]/i.test(w)?'an ':'a ')+w;
