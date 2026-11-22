'use strict';
/* A clicked animal is approached at its own position. The herd retains its roaming and fleeing behavior;
   additional visible animals and hostile armies can join the live encounter through WorldCombat. */
class WildHunt{
  // (its ground: the herd's, or as far toward you as puts you inside it)
  static areaFor(c,target=c){c=target;const R=HUNT_AREA.radius-WORLD_BATTLE.inner-4,d=Math.hypot(P.x-c.x,P.y-c.y);if(d<R)return{x:c.x,y:c.y};const k=(d-R)/d;return{x:c.x+(P.x-c.x)*k,y:c.y+(P.y-c.y)*k}}
  static prepare(c,target=null){if(!c?.wild||!c.n||!W.critters.includes(c)||!c.inView(vis())||P.stay||B||G.mode!=='world')return false;
    const p=target||c,d=Math.hypot(P.x-p.x,P.y-p.y);if(d>worldBattleReach(p)&&d>=HUNT_AREA.radius-WORLD_BATTLE.inner){G.chase=c;const q=marchMeetAt(c);P.tx=q.x;P.ty=q.y;P.stuck=0;return true}
    return this.start(c,target)}
  static start(c,target=null){
    if(!c?.wild||!c.n||B||G.mode!=='world'||P.stay)return false;const area=this.areaFor(c,target||c);if(Math.hypot(P.x-area.x,P.y-area.y)>=HUNT_AREA.radius-WORLD_BATTLE.inner)return false;
    // (your walk ends here, as any fight's (engage.js startEncounter): its goal's way and arrow were drawn on through the hunt, the
    // map under it; the owner, 2026-11-13: "bug on the new hunting (the guide path)")
    breakCamp();followStop();G.chase=null;G.pitch=null;G.byRoad=null;P.tx=P.ty=null;P.stuck=0;hidePanel();
    G.enc={kind:'hunt',name:'Wildlife hunt',ref:c,list:[],lv:1,allies:[],foes:[],hunt:{...area,herds:[c]}};return new HuntBattleSetup({enemies:[],lv:1,deploy:false,surprise:true}).start();
  }
}
