'use strict';
/* Screen-sized health segments: one square per 25 maximum HP, never a formation's combined health. */
const UNIT_HEALTH={per:25,size:3,gap:1,row:8,edge:'#39372f',empty:'#292b28',healthy:'#8bc77a',hurt:'#dab35b',critical:'#d46c55'};
class IndividualHealth{
  static segments(hp,max){return Array.from({length:max>0&&Number.isFinite(max)?Math.ceil(max/UNIT_HEALTH.per):0},(_,i)=>clamp((hp-i*UNIT_HEALTH.per)/Math.min(UNIT_HEALTH.per,max-i*UNIT_HEALTH.per),0,1))}
  static wanted(u){if(!(u.hp>0)||!(u.max>0)||u.left||u.residentHidden)return false;const selected=B&&B.sel!=='all'&&selGroups().includes(u.grp),target=B?.worldTarget===u;
    return HPBARS.on||u.hp<u.max-.01||selected||target||!!(u.tgt&&u.tgt.hp>0&&Math.hypot(u.x-u.tgt.x,u.y-u.tgt.y)<Math.max(u.s?.range||0,70*fightSpace()));}
  static paint(x,y,hp,max,k=1){
    const H=UNIT_HEALTH,values=this.segments(hp,max),rows=Math.ceil(values.length/H.row),cols=Math.min(H.row,values.length),step=H.size+H.gap,col=hp/max<.25?H.critical:hp/max<.6?H.hurt:H.healthy;
    ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.scale(k,k);
    for(let i=0;i<values.length;i++){const x0=(i%H.row)*step-cols*step/2,y0=(Math.floor(i/H.row)-rows)*step;ctx.fillStyle=H.edge;ctx.fillRect(x0-1,y0-1,H.size+2,H.size+2);ctx.fillStyle=H.empty;ctx.fillRect(x0,y0,H.size,H.size);if(values[i]>0){ctx.fillStyle=col;ctx.fillRect(x0,y0,Math.max(1,Math.round(values[i]*H.size)),H.size)}}ctx.restore();
  }
  static battle(){if(!B)return;const k=unitIconScale();for(const u of B.units){if(!this.wanted(u)||!seenBy(0,u))continue;const h=(actorSprite(u).ch+3+(u.z||0))*fightSpace(),p=fromField({x:u.x,y:u.y-fieldLift(u.x,u.y)-h});this.paint(p.x,p.y,u.hp,u.max,k)}}
  static world(cam){const k=dprOf()/VS,S=yourSight();
    for(const o of marchOwners()){const a=MARCH_ARMIES.get(o);if(!a||a.idle||fightHolds(o))continue;for(const u of a.units){
      const max=u.character&&u.type==='hero'?P.heroStats().hp*FIELD_HP:u.max||ST[u.type]?.hp||100,hp=u.character&&u.type==='hero'?P.hp*FIELD_HP:u.hp??max;
      if(!u.dead&&(HPBARS.on||hp<max-.01)&&manSpotted(S,u))this.paint(u.x-cam.x,u.y-liftAt(u.x,u.y)-(marchSprite(u,o).height+3)*WORLD_BATTLE.sprite/WORLD_BATTLE.scale-cam.y,hp,max,k)
    }}
    if(typeof SiteLife!=='undefined')for(const u of SiteLife.visible()){if(this.wanted(u))this.paint(u.x-cam.x,u.y-liftAt(u.x,u.y)-35*WORLD_BATTLE.sprite/WORLD_BATTLE.scale-cam.y,u.hp,u.max,k)}
  }
}
