'use strict';
/* The hunt (the owner, 2026-11-12: "remove hunt field feature since we can simply click at the wild life"): a click on wild game you can
   see (world.js approach; critters.js meet, come to it) is a world battle round the herd (battle/hunting.js), your whole army, its ground
   HUNT_AREA.radius about the herd, drawn toward you so you stand inside it (areaFor); too far for that, your band walks to it first. No
   hunting area to choose, no preview. Only that herd is hunted (the owner, 2026-11-13: "focus only that particular wildlife no need an
   area"): other game near it stays on the map */
class WildHunt{
  // (its ground: the herd's, or as far toward you as puts you inside it)
  static areaFor(c){const R=HUNT_AREA.radius-WORLD_BATTLE.inner-4,d=Math.hypot(P.x-c.x,P.y-c.y);if(d<R)return{x:c.x,y:c.y};const k=(d-R)/d;return{x:c.x+(P.x-c.x)*k,y:c.y+(P.y-c.y)*k}}
  static prepare(c){if(!c?.wild||!c.n||!W.critters.includes(c)||!c.inView(vis())||P.stay||B||G.mode!=='world')return false;
    const d=Math.hypot(P.x-c.x,P.y-c.y);if(d>worldBattleReach(c)&&d>=HUNT_AREA.radius-WORLD_BATTLE.inner){G.chase=c;const q=marchMeetAt(c);P.tx=q.x;P.ty=q.y;P.stuck=0;return true}
    return this.start(c)}
  static start(c){
    if(!c?.wild||!c.n||B||G.mode!=='world'||P.stay)return false;const area=this.areaFor(c);if(Math.hypot(P.x-area.x,P.y-area.y)>=HUNT_AREA.radius-WORLD_BATTLE.inner)return false;
    breakCamp();followStop();G.chase=null;G.pitch=null;G.byRoad=null;hidePanel();
    G.enc={kind:'hunt',name:'Wildlife hunt',ref:c,list:[],lv:1,allies:[],foes:[],hunt:{...area,herds:[c]}};return new HuntBattleSetup({enemies:[],lv:1,deploy:false,surprise:true}).start();
  }
}
