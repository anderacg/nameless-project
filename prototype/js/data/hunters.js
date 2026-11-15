'use strict';
/* ---------- data: the holdings' hunters (world/hunters.js; the owner, 2026-11-15: "Add hunters and they will hunt wildlife") ----------
   on: hunters go out at all (off: none, the world as before) · kinds: the holdings that send them, and how many bands each (none
   has a hunting lodge: the villages and hamlets) · men: a band's men [fewest, most] · near / forget: only round holdings this near
   you, gone past it plus forget (the workers': data/world.js folkNear, folkForget) · range: px from its holding a herd they hunt
   may graze · share: the bands out on a day (each by its id and the day) · leave: the share of the day they set out [from, to]
   (dawn to the morning) · turn: when they turn home, so in by dusk · night: none out past it (dusk's end: core.js NIGHT_AT, Clock
   part) · speed / stalk / carry / run: px a s walking, stalking, laden, running from danger · close: px from the herd they begin to
   stalk (past every kind's shy: data/critters.js) · quiet: the share of a herd's shy reach a stalking band is noticed at (a draw
   between the two each stalk; after a shot, all of it) · bow: px a shot reaches · aim: s to draw and loose · hit: a man's chance
   to bring one down · arrow: s an arrow flies · pick: s to dress a kill and sling it on · lift: the men a kill of its size
   (CRITTERS size) takes to carry; too few, it is left where it fell · look: s till a band with no game in range looks again ·
   tries: shots a day at most (a stalk the herd sees through costs one too) · danger: px from bandits or a beast they run home at
   (a kill not yet lifted left lying) */
const HUNTERS={on:true,kinds:{hamlet:1,village:2},men:[1,3],near:520,forget:120,range:320,share:.7,leave:[.04,.16],turn:.42,night:.6,
  speed:24,stalk:12,carry:18,run:36,close:96,quiet:[.35,.6],bow:44,aim:1.2,hit:.25,arrow:.15,pick:1.5,lift:{1:1,2:1,3:2},look:2,tries:4,danger:70};
