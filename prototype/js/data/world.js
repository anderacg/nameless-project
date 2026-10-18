'use strict';
/* ---------- data: the world's scale: its named distances, one lever for how fast everything moves on screen, and how many wild
   things each size of map holds. Arrival and touch radii (8-20 px) are not here: they follow the figures, not the world.
   Units: px unless the group says tiles. ---------- */
const WORLD_SCALE={
  // every step on the map is moveStep(pace, d): pace (px per world second, unscaled) x d x move. Flee odds and chase choices
  // read the unscaled paces, so this changes how fast things look, never who outruns whom
  move:1,
  // how far each kind sees you, before your cover cuts it (Brain.sight, hiddenAt)
  sight:{lord:90,band:95,monster:70,caravan:80,refugee:70},
  // what the parties weigh (brains.js, monsters.js, critters.js, folk.js, companions.js, patrols.js)
  ai:{
    graceGap:24,// after a fight (G.encCool) hunters keep this far off
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
  // where new things appear: never nearer you than [at the start, later], nor a holding
  spawn:{bandit:[220,260],monster:[180,240],monsterHold:64,mythic:200,critter:[120,200],critterHold:56},
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
  // road bridges seen this far (the battle's own reaches, terrain.js TERRAIN_RIVER.near and encounters.js BTYPE_WORLD.near, within it)
  battle:{elfR:10,bridge:2}
};
const moveStep=(px,d)=>px*d*WORLD_SCALE.move;
/* how many of each wild thing a map holds, per size of map (explicit numbers, not grown with its area): caps and starting
   counts; sites by kind (sites.js SITE_TYPES), camps by the map's spots */
const DENSITY={
  classic:{bandits:30,camps:12,monsterStart:48,monsterCap:60,critterStart:96,critterCap:120,caravans:72,refugees:42,ships:30,
    sites:{cave:30,travelers:21,hideout:24,ruins:21,shrine:18}}
};
// the caps in use: the classic map's (the map presets will pick theirs)
const density=()=>DENSITY.classic;
// roving bands at most, and beasts at the start and at most (session.js, world.js, monsters.js)
const BANDITS=density().bandits,MONSTER_START=density().monsterStart,MONSTER_CAP=density().monsterCap;
