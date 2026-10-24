'use strict';
/* ---------- data: the world's scale: its named distances, one lever for how fast everything moves on screen, and how many wild
   things each size of map holds. Arrival and touch radii (8-20 px) are not here: they follow the figures, not the world.
   Units: px unless the group says tiles. ---------- */
const WORLD_SCALE={
  // every step on the map is moveStep(pace, d): pace (px per world second, unscaled) x d x move. Flee odds and chase choices
  // read the unscaled paces, so this changes how fast things look, never who outruns whom. .68 (D9): a band on foot some 9 px a
  // second on open ground at 1x, 100 tiles (25 km) a day
  // Campaign travel is twice the base pace; world combat explicitly keeps the base scale.
  move:.68,travel:2,
  // how far each kind sees you, before your cover cuts it (Brain.sight, hiddenAt)
  sight:{lord:90,band:95,monster:70,caravan:80,refugee:70},
  // what the parties weigh (brains.js, monsters.js, critters.js, folk.js, companions.js, patrols.js)
  ai:{
    graceGap:24,// after a fight (G.encCool) hunters keep this far off
    grace:1.47,// and the grace lasts this many times its world time (1/move), so the gap you open in it stays as it was
    dread:70,// a marching lord turns home from an enemy army half again his strength this near
    bandCamp:220,// a band shelters at night in a camp this near
    lairHunt:140,lairLeash:60,// a beast hunts you only this near its lair; wanders back past the leash
    mythicRoam:[120,90],mythicScorch:200,// a mythic beast's next roam (x, y), and how near a holding it burns the fields
    gameLeash:50,herdLeash:24,penLeash:99,// wild game, livestock and a penned herd wander back past these
    compFoes:90,compFlee:70,compBeat:[80,60],// your companion's party: foes it weighs, runs from the strong ones, its holding's beat (x, y)
    compTake:60,compDraft:120,// (companions.js) handing soldiers over, drafting at a holding
    folkNear:520,folkForget:120,// workers live round holdings this near you; gone past it plus folkForget
    folkBandit:70,folkFear:90,// a worker hurries home from bandits, or from you while his holding fears you
    slipAway:40// running from the guards puts this between you
  },
  // where new things appear: never nearer you than [at the start, later], nor a holding. The owner, 2026-10-19: bands never
  // nearer a holding or any of its built estates than away (outlaws lurk out on a land's reaches, by the roads); a beast makes
  // its lair in the wilds, on no holding's land, or, its kind's ground not found there this time, within rim tiles of a land's
  // edge and away from every holding and estate (monsters.js lairLand)
  spawn:{bandit:[220,260],monster:[180,240],monsterHold:64,mythic:200,critter:[120,200],critterHold:56,away:120,rim:3},
  // trade and work (tiles): realm caravans' range and their cost of distance, where refugees go, a holding's veins and its own
  econ:{caravanNear:10,caravanFar:90,caravanCost:150,refuge:70,resRange:10,homeRange:24},
  // deeds and who hears of them (tiles): field deeds and road events count for a holding this near, a sack angers those this near
  law:{repNear:15,eventNear:15,siegeOutrage:20},
  // the land round a holding: its shelter from the land (px), healing near a friendly one (px), its garrison guards an estate (tiles);
  // territory (tiles): friendly holdings this near raise its reach's cap, a camp cleared this near pushes it out (territory.js)
  land:{shelter:48,healNear:80,estateGuard:7,friendly:50,pacify:35},
  // war: a realm fortifies a holding with an enemy this near (tiles); walking this far off ends your raid or siege (px)
  war:{front:60,raidLeash:80,siegeLeash:80},
  // a battle's reach into the world round its tile (tiles; worldmap.js battleSite): an elven town this near makes elven woods;
  // road bridges seen this far (the battle's own reaches, terrain.js TERRAIN_RIVER.near and engage.js BTYPE_WORLD.near, within it)
  battle:{elfR:10,bridge:2}
};
const moveStep=(px,d,travel=true)=>px*d*WORLD_SCALE.move*(travel?WORLD_SCALE.travel:1);
/* how many of each wild thing a world holds (doc/WORLD_DESIGN.md §10.6). classic: the base caps and starting counts (the old
   hand-made map's, the measure every world grows from); sites by kind (sites.js SITE_TYPES), camps by the map's spots; daily: the
   tries a day to bring bands, beasts and game back.
   grow: how each count follows a bigger world: the base number x (the world's measure / the base's)^pow, rounded, by its key
   in by ([measure, pow]; sites, a rule for each kind); daily: each kind's tries grow as the count named. The measures:
   land (tiles not water, a ford water: the base 32,042), holdings (the realm holdings the world was made with: the base 37),
   ports (the world in's holdings with a port as it first stood: the base 9), roads (the road's tiles between the holdings, a
   great road's 1, a track's track, never an estate's track: the base 1,680, so the travellers' 21 make one camp to every 80 tiles
   of road, their rate), wild (the land far from every holding and road, world/sites.js wildLand: the base 37,400, so the
   classic seed's 46,773 make 30 hideouts). pow 1 keeps the base number per tile of land, per holding, per port or per tile of
   road; above 1 a bigger world is busier, below 1 emptier (the bands .8: fewer to a holding than the land alone would give). The owner's
   play-test of 2026-10-22: the travellers' camps by the roads, not the land ("too many pilgrim and wanderer camps": 67 on the
   classic seed, now 21); caves, ruins and shrines about 1.5 x the base on the classic seed ("ok 1.5": its land 3.19 x the
   base's, ^.35), growing gently past it. The owner, 2026-10-23: the hideouts deep in the wilds, by the wild land, about half the
   land's (61 on the classic seed, now 30). The generated classic seed grows as any world */
const DENSITY={
  classic:{bandits:30,camps:12,monsterStart:48,monsterCap:60,critterStart:96,critterCap:120,caravans:72,refugees:42,ships:30,
    sites:{cave:30,travelers:21,hideout:24,ruins:21,shrine:18},daily:{bandits:1,monsters:3,critters:3}},
  grow:{land:32042,holdings:37,ports:9,roads:1680,track:.5,wild:37400,
    by:{bandits:['land',.8],camps:['land',1],monsterStart:['land',1],monsterCap:['land',1],critterStart:['land',1],critterCap:['land',1],
      caravans:['holdings',1],refugees:['holdings',1],ships:['ports',1],
      sites:{cave:['land',.35],travelers:['roads',1],hideout:['wild',1],ruins:['land',.35],shrine:['land',.35]}},
    daily:{bandits:'bandits',monsters:'monsterCap',critters:'critterCap'}}
};
// a world's land: its tiles not water (a ford is water), counted once (kept off every list and hash, as WorldMap's _site)
function worldLand(m){if(m._land==null)Object.defineProperty(m,'_land',{value:m.kind.reduce((n,k)=>k===T_WATER||k===T_FORD?n:n+1,0),configurable:true});return m._land}
// a world's ports: its holdings with a port, counted once the world is in (as it first stands: a new game counts first; a port
// built or lost in play moves nothing), kept as the land is; a world not in: the base
function worldPorts(m){if(m._ports==null){if(m!==WM)return DENSITY.grow.ports;Object.defineProperty(m,'_ports',{value:TOWNS.filter(t=>bldLv(t,'port')).length,configurable:true})}return m._ports}
// a world's road (DENSITY.grow roads): the tiles of the roads between its holdings, each once, a great road's 1, a track's
// grow.track, never an estate's (lots.js estTrack: laid later, a worker's way); counted again as its roads change (none: 0)
function worldRoads(m){const R=m.roads||[],n=R.filter(r=>!r.est).length;if(m._roads&&m._roads.n===n)return m._roads.v;const w=new Map();
  for(const r of R)if(!r.est){const v=r.kind==='road'?1:DENSITY.grow.track;for(const i of r.path)if(!(w.get(i)>=v))w.set(i,v)}
  let v=0;for(const x of w.values())v+=x;Object.defineProperty(m,'_roads',{value:{n,v},configurable:true,writable:true});return v}
// a world's wild land (DENSITY.grow wild): its land far from every holding and road (world/sites.js wildLand, where the hideouts
// stand), the world in's; a world not in: the base
const worldWild=m=>m===WM?wildLand().n:DENSITY.grow.wild;
// a world's measures against the base's (DENSITY.grow): its land, its holdings, its ports, its road, its wild land
function worldMeasures(m){const g=DENSITY.grow;return{land:worldLand(m)/g.land,holdings:(m.settings?m.settings.holdings:g.holdings)/g.holdings,ports:worldPorts(m)/g.ports,roads:worldRoads(m)/g.roads,wild:worldWild(m)/g.wild}}
/* the counts for world m (density(WM): the world in's; a world being made: its own map). No world (none in yet, or none given):
   the base, so nothing reads the last world's by chance (the generator's camps: one world code, one world). Else each grown by
   its rule, kept on the map till a measure changes (a measure of 1, or pow 1, multiplies alone: the same in every browser) */
function density(m){const D=DENSITY,g=D.grow;if(!m)return D.classic;
  const f=worldMeasures(m),key=f.land+' '+f.holdings+' '+f.ports+' '+f.roads+' '+f.wild;if(m._dens&&m._dens.key===key)return m._dens.t;
  const one=(v,[by,pow])=>Math.round(v*(pow===1||f[by]===1?f[by]:Math.pow(f[by],pow))),t={};
  for(const k in D.classic){const v=D.classic[k];t[k]=k==='daily'?Object.fromEntries(Object.keys(v).map(s=>[s,one(v[s],g.by[g.daily[s]])])):typeof v==='object'?Object.fromEntries(Object.keys(v).map(s=>[s,one(v[s],Array.isArray(g.by[k])?g.by[k]:g.by[k][s])])):one(v,g.by[k])}
  Object.defineProperty(m,'_dens',{value:{key,t},configurable:true,writable:true});return t}
// the base: roving bands at most, and beasts at the start and at most (a world's own: density(WM); tests, the wiki)
const BANDITS=density().bandits,MONSTER_START=density().monsterStart,MONSTER_CAP=density().monsterCap;
