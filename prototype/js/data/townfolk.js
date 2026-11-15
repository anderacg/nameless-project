'use strict';
/* ---------- townsfolk: the people of each holding and their day (world/townfolk.js; the owner, 2026-11-15: "Add people to the
   town and make their daily life routines") ---------- */
/* TOWNFOLK, the one table. on: false, no townsfolk (everything as before). near / forget: a holding's people about while you are
   this near it (px), forgotten past near + forget (made again from its seed). per: one out and about for every per of its people,
   least to most (a hamlet's few, a city's crowd); child: the share of them children, folk: of the rest, those with no trade (at
   home and on errands). gait / haste: their pace about the day and home from danger (data/world.js ON_FOOT.gait: everyone's on foot); kid: a child's, times. pad:
   the tiles round the town they walk in; square: the tiles either side of the gate and out from it (the market square before the
   centre); danger: a band or a beast this near (px) sends them in; searches: the most ways they look for in a frame.
   day (shares of the day, Clock.frac: 0 dawn, .5 dusk): each wakes between wake's two, comes out to his door, is at work from his
   hour in work, at the square, the market or the well between noon's (noon: the share who go), back to work, in the evening
   (from eve's) at the tavern if there is one (tavern: the share who go) or chatting outside, home between home's two (inside,
   unseen, through the night); still out at late, he slips in at once.
   idle: at a stop, a while (wait), then maybe to another spot of it (shift), a turn (turn), and facing whoever stands within
   chat px. cost: a step's cost by the ground (roads cheapest: they keep to the streets and lanes).
   work: each place of work, an estate's building by its key or a street's nook by its type (world/lots.js INNER,
   LOT_STREET.nooks): who works there (role), how many, and their look (gfx/people.js folkLook) or a peasant's trade (data/units.js
   peasantKind: the estates' workers' figures). greet: what one says when you click him, by what he is about (TownFolk mode; the
   owner, 2026-11-15: "clicking at town folks should not open the city dialogue") */
const TOWNFOLK={on:true,near:520,forget:120,per:8,least:3,most:28,child:.15,folk:.3,gait:'stroll',haste:'hurry',kid:1.25,pad:3,square:{w:2,d:3},danger:110,searches:12,
  day:{wake:[.004,.04],work:[.05,.09],noon:[.19,.23],back:[.28,.32],eve:[.39,.44],home:[.47,.53],late:.6},noon:.55,tavern:.6,
  idle:{wait:[1.5,5],shift:.35,turn:.4,chat:16},cost:{road:1,open:1.3,hill:1.8,forest:2.4,other:1.6},
  work:{smithy:{role:'smith',n:2,look:'smith'},market:{role:'trader',n:3,look:'merchant'},workshop:{role:'artisan',n:2,look:'folk'},
    brewery:{role:'alewife',n:1,look:'innkeeper'},granary:{role:'granary keeper',n:1,look:'steward'},stall:{role:'stallholder',n:1,look:'merchant'},
    well:{role:'water carrier',n:1,look:'folk'},cart:{role:'carter',n:1,trade:'farmer'},barrels:{role:'cooper',n:1,trade:'farmer'},
    crates:{role:'porter',n:1,trade:'farmer'},woodpile:{role:'woodcutter',n:1,trade:'woodcutter'},haystack:{role:'farmhand',n:1,trade:'herder'}},
  greet:{work:['Busy day. Mind the cart.','Can\'t stop, there\'s work to do.','Good day to you.'],noon:['Fine weather for the market.','Heard the roads are bad of late.','Good day, traveller.'],
    tavern:['The ale here is the best for leagues.','Buy a round, will you?','Evening, stranger.'],chat:['Evening.','Mind how you go.','A quiet day, thank the gods.'],
    door:['Morning.','Up early, are we?','Good morning.'],play:['Are you a knight?','Can I see your sword?','Catch me if you can!'],home:['Off home, it\'s late.','Stay safe out there.']}};
