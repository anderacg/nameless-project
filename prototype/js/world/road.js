'use strict';
/* ---------- the road: when and where you meet someone travelling (doc/ENCOUNTERS_DESIGN.md, phases 1, 2 and 4; the kinds, who and what:
   world/encounters.js; their numbers: data/encounters.js; the shape: story/encounter.js). The people you meet are small scenes on
   the map, not windows popping up: a wounded man by the road, a peddler walking up, hunters round a fire, a caravan fighting off
   raiders. Today's people events moved here from world/events.js, now world/incidents.js (it keeps the weather, the sickness and the finds), their
   rules and outcomes as they were; phase 2 adds eight of their own (a cart stuck in the mud, a thief on the run, a poacher, a
   funeral, a wedding party, a runaway horse, a beggar, a messenger); phase 4 the fake wounded (a lure), pilgrims bound for or
   praying at a real shrine, and the messenger's sealed letter as a real thing in your bag (world/letters.js). W.road (made with the first, saved only then: roadSave): {on (the encounters and their
   traces), c (the hours you have travelled since you last met one), h (the hour under way), day, n (how many came that day), cd
   ({kind: the day it last came}), id}.
   - Spawning, a pity timer (ENC_SPAWN): each whole hour you travel (moving on the map: not in a holding, paused, in a window or
     a battle), the chance is base + rate × c, at most cap, × the land you are on (a road busier, a holding's land, the wild
     rarer); at most perDay a day, a kind not again within `again` days, one at a time. Met (you meet it): c is 0; passed by
     (you knew of it, it left unmet): c falls by 25–50%. G.quietEvents (the tests' switch) holds it all, as it holds the events.
   - Which (ROAD_ENC w, wf, ok: today's events' rules: the climate, the land, the night, a holding near, your band) and where
     (on: ENC_ON, its own ground): your sight + 40–120 px out, ahead of the way you go, never in a holding.
   - Behaviour (beh: one small strategy each, story/happening.js Behaviours): approach (walks up to you; reaching you, it is met), stay, flee (runs as you come; or across your view,
     on its own way: hx, hy; or, startled, a little way and then stops: stop), scene (already under way: it plays out by
     itself), walk (a procession: walks the roads to its goal and ends there), leave (going: walks off), bolt (gone at a run).
     The chase and the catch (ENC_CATCH: the thief run down on the map, the runaway horse caught by hand) are shared, by your
     Agility and Riding. How long each lasts unmet: ENC_LIFE. Everything leaves once you are
     far (leave × your sight, or farther than it first stood); met and done with, once out of your sight. Nothing ends while
     you can see it (its ends: story/happening.js): its time up in your sight, it ends its kind's way (walks off, waits, plays out) and is gone once
     out of it. A few, their time up unresolved, leave a trace (the body, the burnt wagon) that fades after a day.
   - Shown (no pause): heard or seen the first time, a log line and a soft sound; then, while unmet, highlights (gfx/worldui.js
     wuiRoadUnder, wuiRoadOver): a glow round its figures, a pulsing "!" over it, its call-out line, an arrow at the screen's
     edge while it is off the screen. Its figures: today's map people and beasts, a cart, a tent, a fire, a shrine, a mine's
     head (EncounterScene, gfx/encounterscene.js, from its kind's scene).
   - Met: its page (window.js PageScreen: its banner cropped from the map round it, what you see, Insight by Scouting, its
     choices as key actions, a confirm before what cannot be undone, Leave at the bottom). An ambush springs as you pass: its
     page a forced choice; only Scouting INSIGHT.rough or more sees it before ---------- */
// (the road's own dice: its stream, core/rng.js, so a kind added or a weight changed never moves the world's Math.random)
const roadRng=()=>rngOf('road');
const roadNow=()=>Clock.hours();// (the world's clock, in hours: clock.js)
const roadDay=()=>Clock.isDay;// (by day: the kinds that walk the roads in daylight)
// (time spent with them: h hours on the clock, a new day rolling over as it does on the map)
const roadHours=h=>Clock.passHours(h);
const roadSt=()=>W.road||(W.road={on:[],c:0,h:0,day:G.day,n:0,cd:{},id:0});
const roadList=()=>W.road?W.road.on:[];
// the land under a point, for the chance: a road (on one or a tile by), a holding's land, the wild (its story place's: the chance
// reads your story context's, story/context.js)
const roadLand=(x,y)=>new StoryPlace(x,y).landKind;
// each kind's ground (a tile): on or by a road (those walking it); beside a road, a camp or a scene (byroad: off it, 2-3 tiles
// from it, ENC_BY: the owner's play-test 2, the gamblers played on the road; a scene spans a tile and more either way, so never
// by its edge); open land off it; anywhere off a road and not by one; a wood's edge (open land with the trees behind or beside it,
// none in front, so its camp shows; open land in the frost; not by a road); hills (or by the mountains); a bog; cover beside a road (engage.js coverAt);
// a lure: beside a road as the wounded traveller lies, with woods or hills by it for the bandits to lie in;
// mud: by a road where it runs by water or a ford, or through a bog; a lord's wood: a wood's edge (no frost) on a holding's land
// that has a lord (a realm's, or yours)
// (each reads the tile's story place: story/storyplace.js StoryPlace, via story/context.js Story.at, its terrain, climate, land and cover at the tile's middle)
const roadOwned=(x,y)=>{const t=landHold(x,y);return t&&t.owner?t:null};
const roadBeside=(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain!==T_ROAD&&p.terrain!==T_FORD&&!p.byRoad&&p.by(T_ROAD,ENC_BY)&&!roadPaint()[ty*MW+tx]};
const ENC_ON={road:(tx,ty)=>Story.at(tx,ty).byRoad,byroad:roadBeside,open:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain===T_OPEN&&!p.byRoad},wild:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain!==T_ROAD&&!p.byRoad},
  wood:(tx,ty)=>{const p=Story.at(tx,ty);return(p.woodsEdge||p.terrain===T_OPEN&&p.climate==='frost')&&!p.byRoad},hill:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain===T_HILL||p.by(T_MOUNT,1)},
  bog:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain!==T_ROAD&&p.climate==='swamp'},cover:(tx,ty)=>{const p=Story.at(tx,ty);return p.by(T_ROAD,2)&&!!p.cover},
  mud:(tx,ty)=>{const p=Story.at(tx,ty);return p.byRoad&&(p.by(T_WATER,1)||p.by(T_FORD,2)||p.climate==='swamp')},
  lordwood:(tx,ty)=>{const p=Story.at(tx,ty);return p.woodsEdge&&p.climate!=='frost'&&!!p.owned},
  lure:(tx,ty)=>{const p=Story.at(tx,ty);return roadBeside(tx,ty)&&(p.by(T_FOREST,2)||p.by(T_HILL,1))}};

/* ---------- how one ends: nothing ends while you can see it (owner, 2026-10-19). Its time up out of your sight, it ends there
   (its trace, if any); in your sight, it ends its kind's way (its ends, else its behaviour's: story/happening.js Encounter ends),
   and is gone once out of it:
   leave (packs up and walks off, along the road where there is one: its people only (goes), its trace left at once in its
   place, the farmer's cart, the raiders' burnt wagon; one that is running walks off once it has stopped), unseen (stays as it
   is, or runs on, till you are not looking: the mine, the lure, the ambush, one running), die (as unseen, but ENC_LIFE.dying
   hours past his time he dies before your eyes: the wounded traveller). A procession reaching a shrine or ruins in your sight
   stays there a while (ENC_LIFE.pray: the pilgrims kneel, the mourners stand by their dead) and then walks off; at a holding's
   gate it ends (they went in) ---------- */
// (the pieces that walk off: its people (as they walk), or its kind's goes; none left behind (o.at))
const ROAD_GOERS=['walk','stand','kneel','soldier','refugee','worker','beast','rider','horse'];
function roadPieces(e){const ps=e.D.scene(e);if(!e.left)return ps;const f=e.D.goes||(p=>ROAD_GOERS.includes(p[0]));
  return ps.filter(p=>f(p)&&!(p[4]&&p[4].at)).map(p=>p[0]==='stand'||p[0]==='kneel'?['walk',...p.slice(1)]:p)}
/* the way one walking off takes (ENC_OFF): from the road beside it (within near tiles), along the road to the road tile
   farthest from you within steps tiles of it (lg: its tile, saved); none (no road by it, or the road only runs toward you):
   away from you, as once it has come to that tile: to a spot far × your sight from you (la, saved), by the land's ways, round
   water. Its tiles to pass are found again when needed (ROAD_OFF: kept aside) */
const ROAD_OFF=new WeakMap();
// (the road tile by a point: its own, else the nearest within near tiles; -1: none)
function roadTileBy(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),n=ENC_OFF.near;let best=-1,bd=Infinity;
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){const X=tx+i,Y=ty+j;if(tAt(X,Y)!==T_ROAD)continue;const d=Math.hypot((X+.5)*TILE-x,(Y+.5)*TILE-y);if(d<bd){bd=d;best=Y*MW+X}}
  return best}
// (the road tiles within n steps of s, along the road: each one's way back; stop: done once it is found)
function roadAlong(s,n,stop){const from=new Map([[s,-1]]),dep=new Map([[s,0]]),q=[s];
  for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i-x)/MW,d=dep.get(i);if(i===stop)break;if(d>=n)continue;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const X=x+a,Y=y+b,k=Y*MW+X;if(!a&&!b||X<0||Y<0||X>=MW||Y>=MH||from.has(k)||tAt(X,Y)!==T_ROAD)continue;from.set(k,i);dep.set(k,d+1);q.push(k)}}
  return from}
// (a spot away from you, off.far × your sight from you, it can walk to: the first of its ways (offs, rad from straight away)
// on open ground on its own piece of land; null: none)
function roadAwayAt(e){const R=vis()*ENC_OFF.far,a0=Math.atan2(e.y-P.y,e.x-P.x);
  for(const da of ENC_OFF.offs){const a=a0+da,x=P.x+Math.cos(a)*R,y=P.y+Math.sin(a)*R;if(x>=TILE&&y>=TILE&&x<(MW-1)*TILE&&y<(MH-1)*TILE&&passable(terrAt(x,y))&&Router.reach(e,{x,y}))return[Math.round(x),Math.round(y)]}
  return null}
function roadOffGoal(e){const s=roadTileBy(e.x,e.y);if(s<0)return null;const far=k=>Math.hypot((k%MW+.5)*TILE-P.x,(Math.floor(k/MW)+.5)*TILE-P.y);let best=s,bd=far(s);
  for(const k of roadAlong(s,ENC_OFF.steps).keys()){const d=far(k);if(d>bd){bd=d;best=k}}
  return bd>far(s)+TILE?[best%MW,Math.floor(best/MW)]:null}

/* ---------- an encounter on the map: story/happening.js Encounter (its record, its moment, how it ends) ---------- */
const ROAD_SAY=new WeakMap();// (when its call-out first showed: real ms, kept aside)
// (while you travel toward a goal, where one hurrying to you meets you on your way: the point ahead you both reach at once, you
// at your pace, it at its own, vo (|r − u·vp·t| = vo·t, its first t); none if it cannot catch you there, or you are not moving: it
// comes straight at you)
function roadWay(o,vo){if(P.tx==null||!(ROAD_AT.m>0))return null;const vx=P.tx-P.x,vy=P.ty-P.y,L=Math.hypot(vx,vy);if(L<1)return null;
  const ux=vx/L,uy=vy/L,vp=MAP_BASE*travelMul(),rx=o.x-P.x,ry=o.y-P.y,a=vp*vp-vo*vo,b=-2*vp*(rx*ux+ry*uy),c=rx*rx+ry*ry;let t=null;
  if(Math.abs(a)<1e-6)t=b<0?-c/b:null;else{const D=b*b-4*a*c;if(D>=0){const q=Math.sqrt(D);t=[(-b-q)/(2*a),(-b+q)/(2*a)].filter(x=>x>0).sort((m,n)=>m-n)[0]??null}}
  if(t==null)return null;const k=Math.min(vp*t,L);return[P.x+ux*k,P.y+uy*k]}
function drawRoad(ents,cam,V){for(const e of roadList())e.draw(ents,cam,V)}

/* ---------- spawning ---------- */
// one of a kind at (x, y): its time by its behaviour (or its life's), the nearest holding's people; facing (its scene laid out
// toward: dir) the open side when only one is (a wood's edge: its camp out of the trees), else you. None if its setup finds no
// way for it from there (a procession with nowhere to go)
const roadOpen=(x,y,i)=>{const q=tAt(Math.floor(x/TILE)+i,Math.floor(y/TILE));return q===T_OPEN||q===T_ROAD};
function roadSpawn(k,x,y){const D=ROAD_ENC[k],R=roadSt(),r=roadRng(),now=roadNow(),L=ENC_LIFE[D.life||D.beh],t=Spatial.nearestHolding(x,y),side=roadOpen(x,y,1)!==roadOpen(x,y,-1)?(roadOpen(x,y,1)?1:-1):0;
  const e=asRoadEnc({rd:1,i:++R.id,k,x,y,dir:side||(P.x>=x?1:-1),beh:D.beh,race:t&&t.races?t.races[r.int(0,t.races.length-1)]:'human',t0:now,end:now+L[0]+r.next()*(L[1]-L[0]),d0:Math.hypot(x-P.x,y-P.y),seed:r.int(1,9999),seen:0,met:0,done:0});
  if(e.setup()===false)return null;R.on.push(e);if(R.day!==G.day){R.day=G.day;R.n=0}R.n++;R.cd[k]=G.day;return e}
// a spot for its ground (ENC_ON): past your sight by near px, ahead of where you are going (within arc; else wider after half the
// tries), on ground you can walk to, nothing built on it, clear of the holdings
function roadSpot(on,arc,near){const S=ENC_SPAWN,V=vis(),fit=ENC_ON[on],R=roadRng(),a0=P.tx!=null?Math.atan2(P.ty-P.y,P.tx-P.x):R.next()*6.2832,N=near||S.near;
  for(let i=0;i<S.tries;i++){const a=a0+(R.next()*2-1)*(arc||S.arc*(i<S.tries/2?1:2.86)),r=V+N[0]+R.next()*(N[1]-N[0]),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||occAt(tx,ty)||!fit(tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<S.hold)||!Router.reach(P,{x,y}))continue;
    return[x,y]}
  return null}
const roadW=k=>{const D=ROAD_ENC[k];return D.w*(D.wf?D.wf():1)};
// which comes: of the kinds the pity timer can start (its bucket: story/kinds.js) that can come here and now (not too soon again),
// by weight; tried at its own ground, else another
function roadPick(){const R=roadSt(),c=storyCtx(),ks=Kinds.on('encounter','travelHour').map(K=>K.id).filter(k=>!(R.cd[k]!=null&&G.day-R.cd[k]<ENC_SPAWN.again)&&ROAD_ENC[k].ok(c));
  while(ks.length){let r=roadRng().next()*ks.reduce((a,k)=>a+roadW(k),0),k=ks[0];for(const q of ks){r-=roadW(q);if(r<=0){k=q;break}}
    const D=ROAD_ENC[k],p=roadSpot(D.on,D.beh==='approach'?ENC_SPAWN.arcTo:0,D.near),e=p&&roadSpawn(k,p[0],p[1]);if(e)return e;ks.splice(ks.indexOf(k),1)}
  return null}
// the hour's roll: none past perDay a day or while one is about; else the pity timer's chance, by the land you are on
function roadRoll(){const R=roadSt(),S=ENC_SPAWN;if(R.day!==G.day){R.day=G.day;R.n=0}
  if(R.n>=S.perDay||R.on.some(e=>!e.trace&&!e.gone))return null;
  return roadRng().chance(roadChance())?roadPick():null}
const roadChance=()=>{const S=ENC_SPAWN;return Math.min(S.cap,S.base+S.rate*roadSt().c)*S.land[storyCtx().landKind]};
// a moment's travel: the hours you moved add to the timer; each whole one, the roll (ROAD_AT: where you were, how far you went
// last moment: kept aside)
const ROAD_AT={x:NaN,y:NaN,m:0};
function roadTravel(d){const m=Math.hypot(P.x-ROAD_AT.x,P.y-ROAD_AT.y);ROAD_AT.x=P.x;ROAD_AT.y=P.y;ROAD_AT.m=m<20?m:0;if(G.quietEvents||!(m>0&&m<20))return;
  const R=roadSt(),h=Clock.hoursIn(d);R.c+=h;R.h+=h;while(R.h>=1){R.h--;if(roadRoll())break}}
// each moment on the map (world.js updateWorld): the travel, then each encounter; true when one opened its page. One story
// context for the moment (story/context.js Story.frame: its rolls read it)
function updateRoad(d){return Story.frame(()=>{roadTravel(d);const R=W.road;if(!R)return false;R.on=R.on.filter(e=>!e.gone);const V=vis(),now=roadNow();
  for(const e of R.on)if(asRoadEnc(e).step(d,V,now))return true;return false})}

/* ---------- meeting one: its page ---------- */
function roadMeet(e){e.met=1;e.seen=1;roadSt().c=0;G.road=e;G.roadMsg='';G.mode='road';P.tx=null;G.chase=null;showRoad()}
// forced: no Leave till chosen
const roadForced=e=>typeof e.D.forced==='function'?!!e.D.forced(e):!!e.D.forced;
// (its page: story/choice.js ChoicePage, its choices as key actions: the encounter's page())
function showRoad(){const e=G.road;CHOICE_PAGE.show(e.page(),'road:'+e.i)}
// (done with, or left be: Encounter settle, whoever walks going on their way; a procession on along its own, a bolting horse at
// a run; a grazing one grazes on; lights and ambushers gone)
function roadAct(a,arg){const e=G.road;if(G.mode!=='road'||!e)return;const D=e.D;
  if(a==='enc-leave'){if(roadForced(e)&&!e.done)return;if(!e.done&&D.left)log(D.left(e));e.settle();G.road=null;G.mode='world';hidePanel();saveGame(true);return}
  if(a==='enc-back'){showRoad();return}
  if(a==='enc-do'&&!e.done){const i=parseInt(arg),c=CHOICE_PAGE.choose(D.acts,arg,e);if(!c)return;
    if(c.asks(e)&&!String(arg).endsWith('!'))return CHOICE_PAGE.confirm(c,e,{sub:D.n,act:'enc-do',i,back:['enc-back',null,'Back']});
    const m=c.perform(e);P.morale=clamp(P.morale,0,100);updateHUD(true);if(G.road!==e)return;// (a fight began, or a chase)
    if(!c.again){e.done=1;e.settle()}G.roadMsg=m;log(m);showRoad();railFocus(a,arg)}}
onAct('enc-',roadAct);

/* ---------- the save: W.road, once there is one (absent: none, as every save before it; the save registry, core/saves.js). Each
   encounter its record (Encounter save); loaded, each wrapped by its kind's class, one whose kind is gone dropped (Encounter.load) ---------- */
Saves.add({key:'road',order:230,defaults:null,save:()=>W.road?{...W.road,on:W.road.on.filter(e=>!e.gone).map(e=>asRoadEnc(e).save())}:undefined,load:r=>{W.road=r;if(r)r.on=r.on.filter(o=>Encounter.load(o))}});
const roadSave=()=>Saves.saveOf('road');
// its work in the world's day and frame (core/systems.js) (the travel, then each encounter on the road)
Systems.add({name:'road',order:{frame:70},frame:updateRoad,ends:true});
