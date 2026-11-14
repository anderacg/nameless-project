'use strict';
/* ---------- encampments (doc/ENCAMPMENTS_DESIGN.md; the owner, 2026-11-14: "make them have some people standing there have their
   life", "camp can be more larger area or have more tents etc based on people live there") ----------
   Each kind of camp (its place in the list is a camp's kind, world/encampments.js Encampment; the first six were the old
   travellers'): n, race (null: the people of the land it stands in), goods sold, col (its colour), special (bless, song, counsel,
   alms), d (what you see riding in), see (what your scouts call it); pop: how many live there [least, most]; life: settled (stays),
   seasonal or wandering (moves on after stay days); ground: where it pitches (road: 2-4 tiles off a road; wood: a wood's edge;
   hills: under the mountains; desert; wild: far from holdings and roads; water: by water, near a road); roles: who lives there,
   [role, share], filled in order (ENCAMP_ROLES); count: how many on the base world (ENCAMP.count); mercs: sellswords to hire
   (levy: its own folk as levies); props: its pieces round the tents (ENCAMP_PROPS), [kind, how many] */
const ENCAMP_KINDS=[
  {key:'merchants',props:[['wagon',2],['crates',1]],n:'Merchant caravan',race:'human',goods:['cloth','spice'],col:'#3d74d6',pop:[8,14],life:'wandering',ground:'road',count:2,mercs:true,
    roles:[['trader',.3],['guard',.3],['drover',.25],['cook',.15]],d:'Wagons circled for the night, guards dozing by the fire.'},
  {key:'prospectors',props:[['cart',1],['barrels',1]],n:'Dwarf prospectors',race:'dwarf',goods:['iron','cheese'],col:'#8a6a4a',pop:[5,10],life:'seasonal',ground:'hills',count:1,mercs:true,
    roles:[['miner',.5],['guard',.25],['smith',.15],['cook',.1]],d:'Dwarves with picks and pack ponies, arguing over a map.'},
  {key:'wanderers',props:[['woodpile',1]],n:'Elf wanderers',race:'elf',goods:['timber','fruit'],col:'#3f8a3e',pop:[5,9],life:'wandering',ground:'wood',count:1,mercs:true,
    roles:[['ranger',.5],['singer',.3],['cook',.2]],d:'A quiet camp under lanterns. They watch you a while before they greet you.'},
  {key:'hunters',props:[['rack',2],['woodpile',1]],n:'Orc hunters',race:'orc',goods:['furs','meat'],col:'#7e2a26',pop:[6,12],life:'seasonal',ground:'wood',count:2,mercs:true,
    roles:[['hunter',.5],['skinner',.2],['child',.2],['cook',.1]],d:'Meat on spits and trophies on poles. They laugh loudly as you ride in.'},
  {key:'pilgrims',props:[['shrine',1],['cart',1]],n:'Pilgrims',race:null,goods:['grain','fruit'],col:'#e8e4d0',special:'bless',pop:[6,16],life:'wandering',ground:'road',count:2,
    roles:[['priest',.1],['pilgrim',.9]],d:'Robed pilgrims singing softly. They offer bread and blessings.'},
  {key:'minstrels',props:[['wagon',1],['stall',1]],n:'Minstrels',race:null,goods:['cloth','spice'],col:'#c58af0',special:'song',pop:[4,8],life:'wandering',ground:'road',count:1,
    roles:[['player',.6],['dancer',.25],['cook',.15]],d:'Painted wagons and a fiddle. They trade songs for coin and news.'},
  {key:'burners',props:[['mound',2],['woodpile',2]],n:'Charcoal burners',race:'human',goods:['timber','tools'],col:'#5a5650',pop:[4,8],life:'settled',ground:'wood',count:1,
    roles:[['burner',.4],['woodcutter',.35],['child',.25]],d:'Smoking mounds of earth by the trees, and soot-black folk tending them.'},
  {key:'nomads',props:[['crates',1],['barrels',2]],n:'Desert nomads',race:'human',goods:['spice','cloth'],col:'#d8a040',pop:[8,16],life:'seasonal',ground:'desert',count:1,mercs:true,
    roles:[['herder',.35],['guard',.25],['trader',.2],['child',.2]],d:'Wide tents of dyed wool, goats, and veiled riders who greet you with water.'},
  {key:'hermit',props:[['woodpile',1]],n:'Hermit',race:'human',goods:[],col:'#9a8a6a',special:'counsel',pop:[1,1],life:'settled',ground:'wild',count:1,see:'a hermit’s camp',
    roles:[['hermit',1]],d:'One small tent, a fire and a bent old man who seems to have been expecting you.'},
  {key:'refugees',props:[['cart',1],['barrels',1]],n:'Refugees',race:null,goods:[],col:'#b0a890',special:'alms',pop:[6,14],life:'settled',ground:'water',count:1,levy:true,
    roles:[['folk',.55],['child',.3],['guard',.15]],d:'Ragged tents by the water, folk who fled their homes. They look at your band with hope and fear.'}
];
const TRAVELERS=ENCAMP_KINDS;// (the old name)
/* who does what: look (people.js folkLook's: their dress) or unit (a soldier of their race: melee or ranged); work by day (fire: at the
   fire; ring: walks round the camp; goods: by the wares; tend: about the animals and carts; tent: at his tent's door (a burner: at
   his mound); out: out to work on the ground round it, to (wood, rock, grass, any); pray: kneels at midday; play: music and dance
   by the fire; run: a child at play; idle: about the tents); watch: keeps the night's watch; child: smaller. Talked to (a click on
   him): at (the place of its page he opens: trade, hire, fire) and say (what he does as you come up, after his name and calling) */
const ENCAMP_ROLES={
  trader:{look:'merchant',work:'goods',at:'trade',say:'spreads out the wares for you'},guard:{unit:'melee',work:'ring',watch:true,at:'hire',say:'sizes you up, and names a price for a sword'},
  drover:{look:'groom',work:'tend',at:'trade',say:'pats a wagon and says the traders will see you'},cook:{look:'innkeeper',work:'fire',at:'fire',say:'offers you a bowl from the pot'},
  miner:{look:'smith',work:'out',to:'rock',at:'trade',say:'shows you a lump of ore, grinning'},smith:{look:'smith',work:'tent',at:'trade',say:'hammers on, and points you to the goods'},
  ranger:{unit:'ranged',work:'out',to:'wood',watch:true,at:'hire',say:'watches you in silence, then nods'},singer:{look:'folk',work:'play',at:'fire',say:'hums a tune and waves you to the fire'},
  hunter:{unit:'ranged',work:'out',to:'wood',watch:true,at:'hire',say:'eyes your weapons and laughs'},skinner:{look:'folk',work:'tent',at:'trade',say:'scrapes a hide and grunts at the furs for sale'},
  priest:{look:'priest',work:'pray',at:'fire',say:'blesses your road'},pilgrim:{look:'folk',work:'pray',at:'fire',say:'murmurs a prayer for you'},
  player:{look:'innkeeper',work:'play',at:'fire',say:'plays a few notes in your honour'},dancer:{look:'folk',work:'play',at:'fire',say:'twirls past and laughs'},
  burner:{look:'smith',work:'tent',at:'trade',say:'wipes the soot away and points you to the charcoal'},woodcutter:{look:'folk',work:'out',to:'wood',at:'trade',say:'leans on the axe and points to the woodpile'},
  herder:{look:'folk',work:'out',to:'grass',at:'trade',say:'whistles to the goats and greets you'},hermit:{look:'priest',work:'out',to:'any',at:'fire',say:'has been expecting you'},
  folk:{look:'folk',work:'idle',at:'fire',say:'asks whether you have news of home'},child:{look:'folk',work:'run',child:true,at:'fire',say:'stares at your banner, then runs to tell the others'}
};
/* the numbers: count (each kind's number grows with the world's land, (land / the base's)^pow, at least one: the owner, "at least one
   for each and scale based on the world"); tents (a tent for every per people, most at most); stay (days a seasonal or wandering
   camp stays: [least, most]); gap (tiles to the next camp); the day (Clock.frac): dawn, work till work, dusk till dusk (then night,
   core.js NIGHT_AT); pray (the midday prayer, from to); folk (their pace px, a child's run x, how long they stop [least, most],
   how far out to work, tiles [least, most], how long at it, route: a walk longer than this (tiles) goes by the router (its ways
   round water and rock), near: how far a camp's people are kept for (px from you), most drawn,
   seat: the ring round the fire, px; danger px: a band or beast that near sends them in); travellers: the first kinds who travel
   and may camp anywhere, among a ruin's broken walls too (sites.js RUIN_OCC) */
/* a camp's pieces: model (the engine's 16 px building of that type: engine/buildmodels.js) or drawn here (rack: a drying rack of hides;
   mound: a charcoal burner's smoking mound); ring: px past the tents they stand at; gap: px kept from a tent and from one another */
const ENCAMP_PROPS={wagon:{model:true},cart:{model:true},crates:{model:true},barrels:{model:true},woodpile:{model:true},shrine:{model:true},stall:{model:true},rack:{},mound:{smoke:true},ring:12,gap:13};
const ENCAMP={travellers:6,count:{pow:.5},tents:{per:3,most:8},stay:{seasonal:[20,40],wandering:[3,8]},gap:24,
  day:{dawn:.06,work:.4,dusk:.5,pray:[.18,.28]},
  folk:{route:2,speed:20,run:1.5,pause:[1.5,4],out:[3,6],work:[4,9],near:520,most:16,seat:13,danger:90,ring:10}};
