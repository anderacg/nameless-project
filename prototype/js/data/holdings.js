'use strict';
/* ---------- data: the kinds of holding. Everything that differs between a village, a town, a city and a castle lives in its
   entry here and is read through the holding itself (t.T, t.label, t.has(tab), ...). To add a kind: give it an entry, a
   class below (or reuse one), and holdings of that kind in places.js. ---------- */
// tier / next: its step on the growth path (camp 0 … city or castle 4) and the kinds it may grow into (holdingOf(t, next); nothing
// grows yet) · centre: what stands at its heart, by its first people (_: anyone; lots.js) · pop0 / popCap: people at the start /
// at most ·
// store: the market's room for each good · gar: garrison · patrol: the watch it sends out (size) and the guard it keeps (keep) ·
// wall0 / wallMax: fortification at the start / at best (WALL_N) · estMax: highest estate level · reach / growMax: its land, tiles
// out from it, and how far that grows in peace · ring / tries: how far from the centre its houses stand, how hard it looks for room ·
// needs / wants: what 100 of its people use each day (wants: luxuries) · jobs: the work it offers (quests.js) · sack: gold for
// sacking it · income: a fief's daily base · handover: what a realm pays you for it · renown: for taking it · guards: extra
// caravan guards · tabs: its window · hires: the kinds of troop it raises (RACES) · train / tourney / broker / contract: what
// its barracks and tavern offer · mounts: which stables' horses it sells (MOUNTS where; 'local': by race and climate) ·
// herds: livestock grazes round it · rural: farms first, few trades · fort: a stockpile and no market or workshops ·
// scene: its walkable streets (SCENES) · temple: a priest in its streets · smoke: chimneys that smoke
const HOLDING_TYPES={
  village:{n:'village',tier:2,next:['town'],centre:{_:'village'},pop0:60,popCap:140,store:150,gar:6,patrol:{size:3,keep:2},wall0:0,wallMax:1,estMax:2,
    reach:10,growMax:7,ring:9,tries:60,needs:{food:5,cloth:.4,timber:.6,tools:.3,ale:.4},wants:{},jobs:['bounty','beast','hunt','hunt'],
    sack:80,income:8,handover:60,renown:10,guards:0,tabs:['recruit','trade','stable','jobs','tavern'],hires:['melee','shield'],
    mounts:['any'],herds:true,rural:true,smoke:2},
  town:{n:'town',tier:3,next:['city','castle'],centre:{_:'citadel'},pop0:200,popCap:420,store:320,gar:16,patrol:{size:6,keep:6},wall0:2,wallMax:3,estMax:3,
    reach:15,growMax:10,ring:10,tries:60,needs:{food:5,cloth:1,timber:.8,tools:.5,ale:.8,spice:.5,iron:.3},wants:{copper:.15,tin:.08,silver:.12,gold:.05,gems:.05,pearls:.03},
    jobs:['bounty','supply','courier','clear','beast'],sack:300,income:25,handover:150,renown:25,guards:2,
    tabs:['recruit','trade','smith','stable','jobs','tavern'],hires:['melee','shield','ranged'],train:true,tourney:true,broker:true,contract:true,
    mounts:['any','town','local'],herds:true,scene:'town',temple:true,smoke:3},
  city:{n:'city',tier:4,next:[],centre:{_:'citadel'},pop0:320,popCap:700,store:480,gar:24,patrol:{size:8,keep:8},wall0:3,wallMax:3,estMax:3,
    reach:17,growMax:12,ring:12,tries:90,needs:{food:5,cloth:1.2,timber:.9,tools:.6,ale:1,spice:.8,iron:.4},wants:{copper:.2,tin:.1,silver:.18,gold:.08,gems:.08,pearls:.05},
    jobs:['bounty','supply','courier','clear','beast','supply'],sack:450,income:40,handover:250,renown:40,guards:3,
    tabs:['recruit','trade','smith','stable','jobs','tavern'],hires:['melee','shield','ranged'],train:true,tourney:true,broker:true,contract:true,
    mounts:['any','town','castle','local'],herds:true,scene:'town',temple:true,smoke:4},
  castle:{n:'castle',tier:4,next:[],centre:{_:'keep'},pop0:80,popCap:170,store:220,gar:18,patrol:{size:8,keep:6},wall0:3,wallMax:3,estMax:2,
    reach:18,growMax:10,ring:9,tries:60,needs:{food:5,cloth:.5,timber:.6,tools:.6,iron:.6,ale:.5,arrows:3,bolts:1.5},wants:{copper:.15,tin:.08,silver:.04},
    jobs:['troops','courier','bounty','clear'],sack:200,income:15,handover:200,renown:30,guards:2,
    tabs:['recruit','stores','smith','stable','jobs'],hires:['melee','shield','ranged','horse'],train:true,
    mounts:['any','town','castle','local'],fort:true,smoke:3}
};

/* a holding: the plain data of places.js (and what the world adds to it), with what it is and what it does from its kind.
   Saves keep the plain data; the class is put back from t.kind (holdingOf). */
class Holding{
  get T(){return HOLDING_TYPES[this.kind]}
  get label(){return this.T.n}
  // does its window offer this tab
  has(tab){return this.T.tabs.includes(tab)}
  // the troops it raises from one of its peoples
  hires(race){const c=RACES[race];return this.T.hires.map(k=>c[k])}
  // does its stable sell this mount (MOUNTS entry), in its climate
  sellsMount(M,clim){const m=this.T.mounts;if(m.includes(M.where))return true;if(M.where!=='any'&&M.where!=='town'&&M.where!=='castle'&&m.includes('local'))return M.race?this.races.includes(M.race):M.clim===clim;return false}
  // does it take a band in to stay (free: they know you, stay.js)
  takesGuests(free){return true}
}
class Village extends Holding{}
class Town extends Holding{}
class City extends Town{}
// a castle lodges only those it knows: it is a garrison, not an inn
class Castle extends Holding{takesGuests(free){return !!free}}
const HOLDING_CLASS={village:Village,town:Town,city:City,castle:Castle};
// make a plain holding one of its kind (and again when its kind changes)
function holdingOf(t,kind){if(kind)t.kind=kind;if(!HOLDING_TYPES[t.kind])throw new Error('No kind of holding called '+t.kind);Object.setPrototypeOf(t,HOLDING_CLASS[t.kind].prototype);return t}

/* the factory: a world's holdings, made from plain data (the classic places of places.js, or a generated world's) and while
   the world runs (addHolding, realms.js). TOWNS and CAMP_SPOTS are filled in place, so every reader keeps its reference, and a
   holding is never taken out (one that is lost is marked gone), so indices into TOWNS (LAND) stay as they were */
const TOWNS=[],HOME={};// HOME: the realm each holding starts under, by name
// where the bandit camps stand (sites.js makes a camp site on each; map.js moves each off roads and water first)
const CAMP_SPOTS=[];
// one holding from plain data, which stays as it was: its kind, its prices and its point. realm: who holds it at the start
function makeHolding(data){
  const {realm,...t}=JSON.parse(JSON.stringify(data));holdingOf(t);if(realm)HOME[t.name]=realm;
  if(t.mod){const r=t.races,c=t.clim,m=t.mod;
    // ammunition prices: elves make the best arrows, dwarves the best bolts
    if(m.arrows==null)m.arrows=r.includes('elf')?.7:1.1;if(m.bolts==null)m.bolts=r.includes('dwarf')?.7:1.15;
    // food prices by who lives there: orcs and the frost eat meat, ports and bogs fish, grassland villages sell milk, dwarves and farms cheese, elves and oases fruit
    const cheap={meat:r.includes('orc')||c==='frost',fish:t.style==='port'||t.style==='stilt'||c==='swamp',milk:!!t.T.rural&&c==='grass',cheese:r.includes('dwarf')||r.includes('human')&&c==='grass'&&!!t.T.rural,fruit:r.includes('elf')||c==='desert'};
    Object.keys(cheap).forEach((g,i)=>{if(m[g]==null){const v=((t.seed*37+i*13)%10)/50;m[g]=+(cheap[g]?.6+v:1.05+v*2).toFixed(2)}})}
  // a holding's point, where you reach it and where its name hangs: at its gate, centred under its centre building (which stands
  // on the holding's tile, its middle on that tile's left edge, its foot on that tile's bottom: lots.js)
  t.x=t.tx*TILE;t.y=(t.ty+1)*TILE+2;return t}
// the holdings and bandit camps a world starts with, in place of the last world's
function setHoldings(list){TOWNS.length=0;for(const k in HOME)delete HOME[k];for(const d of list)TOWNS.push(makeHolding(d))}
function setCamps(list){CAMP_SPOTS.length=0;for(const c of list)CAMP_SPOTS.push({tx:c.tx,ty:c.ty,x:(c.tx+.5)*TILE,y:(c.ty+.5)*TILE})}
// where a new game starts unless your people have a capital, and where reach is measured from
const startHolding=()=>TOWNS[0];
// a realm's capital: the city it starts with (one per realm). A people's: their own realm's (theirs alone, else one they share)
const realmCapital=f=>TOWNS.find(t=>HOME[t.name]===f&&t.kind==='city');
function capitalOf(race){const fs=Object.keys(FACS).filter(f=>FACS[f].races.includes(race)),f=fs.find(f=>FACS[f].races.length===1)||fs[0];return f&&realmCapital(f)||startHolding()}
