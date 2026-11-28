'use strict';
/* ---------- speed: every mover's pace read from the one table (data/speed.js SPEED; doc/TIME_SPEED_DESIGN.md) ----------
   gait(g): a man's px a game second at the ladder's gait g; ratio(a, b): gait a as a
   share of gait b (a formation's walk of its run: battle.js MARCH.walk).
   The map reckons in its own calendar time (a day is DAY_SECONDS of its seconds, core.js) and its own pace numbers (34 a march:
   world.js SPEED.base), kept so that a day's march covers the same ground whatever the march's speed on screen:
   mapRate(): the map's seconds to a game second (core/time.js Time.map: the one place the map's time is made);
   share(g): a walker's gait g (the ladder's, or his own word for it: SPEED.foot) as a share of a march (world.js footPace); pace(k): a row of SPEED.map as the map's pace number (what moveStep
   takes); px(n): a pace number as map px a game second.
   scale(): field px a map px where a battle is fought: SPEED.body on the battle screen, times fightSpace in a fight on the map;
   field(): a soldier's field px a battle second for each point of his speed stat (terrain.js groundMul), a run's;
   scene(g, stat): a figure's px a second in a town's scene. */
class Speed{
  static gait(g){return SPEED.gait[g]}
  static ratio(a,b){return Speed.gait(a)/Speed.gait(b)}
  static mapRate(){return SPEED.gait.march/(SPEED.base*WORLD_PACE*WORLD_SCALE.move*WORLD_SCALE.travel)}
  static share(g){return SPEED.gait[SPEED.foot[g]||g]/SPEED.gait.march}
  static pace(k){return SPEED.map[k]*SPEED.base/SPEED.gait.march}
  static px(n){return n*SPEED.gait.march/SPEED.base}
  static scale(){return SPEED.body*fightSpace()}
  static field(){return SPEED.gait.run/SPEED.man*Speed.scale()}
  static scene(g,stat=SPEED.man){return Speed.gait(g)*stat/SPEED.man*SPEED.body}
}
