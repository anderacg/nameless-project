'use strict';
/* Screen-sized health segments: one square per 25 maximum HP, never a formation's combined health. On the map each man's squares
   stand over his head as it was drawn this frame (anchors: gfx/marchdraw.js drawMarcherAt, his place to the scene's px, his step's
   bob, the land's lift, a bridge's deck), laid on the screen's whole px, not the map's (the owner, 2026-11-25: "The hp square is not
   smoothly attach to the units": they kept to the map's px and their own reckoning of his place, so they stepped as he glided) */
const UNIT_HEALTH={per:25,size:2,gap:1,row:8,scale:.6,clear:1,edge:'#39372f',empty:'#292b28',healthy:'#8bc77a',hurt:'#dab35b',critical:'#d46c55'};
class IndividualHealth{
  static anchors=new Map();
  // (his head's place as drawn, map px: x, y on the scene's layer (its own translations: his sub-px place, the lift, a bridge), the
  //  camera's whole px it is drawn from added back, as EnemyDifficulty's)
  // (not while the depth pass draws him into its own mask canvas, WDEPTH.ghosting: its place is not the scene's)
  static anchor(u,x,y){if(typeof WDEPTH!=='undefined'&&WDEPTH.ghosting)return;const m=ctx.getTransform();this.anchors.set(u,{x:Math.floor(G.cam.x)+m.e/m.a+x,y:Math.floor(G.cam.y)+m.f/m.d+y})}
  static segments(hp,max){return Array.from({length:max>0&&Number.isFinite(max)?Math.ceil(max/UNIT_HEALTH.per):0},(_,i)=>clamp((hp-i*UNIT_HEALTH.per)/Math.min(UNIT_HEALTH.per,max-i*UNIT_HEALTH.per),0,1))}
  static top(s){return Math.max(0,s.height-2-opaqueBox(s)[1])}
  static scale(k,pixels){return Math.max(1,Math.round(k*UNIT_HEALTH.scale*pixels))/pixels}
  static wanted(u){if(!(u.hp>0)||!(u.max>0)||u.left||u.residentHidden)return false;const selected=B&&B.sel!=='all'&&selGroups().includes(u.grp),target=B?.worldTarget===u;
    return HPBARS.on||ownHpBar(u)||u.hp<u.max-.01||selected||target||!!(u.tgt&&u.tgt.hp>0&&Math.hypot(u.x-u.tgt.x,u.y-u.tgt.y)<Math.max(u.s?.range||0,70*fightSpace()));}
  static paint(x,y,hp,max,k=1){
    const H=UNIT_HEALTH,values=this.segments(hp,max),rows=Math.ceil(values.length/H.row),cols=Math.min(H.row,values.length),step=H.size+H.gap,col=hp/max<.25?H.critical:hp/max<.6?H.hurt:H.healthy;
    // (on the screen's whole px: x, y to the device px under them)
    const m=ctx.getTransform(),X=m.a?(Math.round(x*m.a+m.e)-m.e)/m.a:Math.round(x),Y=m.d?(Math.round(y*m.d+m.f)-m.f)/m.d:Math.round(y);
    ctx.save();ctx.translate(X,Y);ctx.scale(k,k);
    for(let i=0;i<values.length;i++){const x0=(i%H.row)*step-Math.floor((cols*step-H.gap)/2),y0=(Math.floor(i/H.row)-rows)*step;ctx.fillStyle=H.edge;ctx.fillRect(x0-1,y0-1,H.size+2,H.size+2);ctx.fillStyle=H.empty;ctx.fillRect(x0,y0,H.size,H.size);if(values[i]>0){ctx.fillStyle=col;ctx.fillRect(x0,y0,Math.max(1,Math.round(values[i]*H.size)),H.size)}}ctx.restore();
  }
  static battle(){if(!B)return;const k=this.scale(unitIconScale(),B.world?VS:bview().k);for(const u of B.units){if(!this.wanted(u)||!seenBy(0,u))continue;const h=(this.top(actorSprite(u,0,true))+(u.z||0))*fightSpace(),p=fromField({x:u.x,y:u.y-fieldLift(u.x,u.y)-h});this.paint(p.x,p.y-UNIT_HEALTH.clear*k,u.hp,u.max,k)}}
  static world(cam){const k=this.scale(dprOf()/VS,VS),S=yourSight();
    for(const o of marchOwners()){const a=MARCH_ARMIES.get(o);if(!a||a.idle||fightHolds(o))continue;for(const u of a.units){
      const max=u.character&&u.type==='hero'?P.heroStats().hp*FIELD_HP:u.max||ST[u.type]?.hp||100,hp=u.character&&u.type==='hero'?P.hp*FIELD_HP:u.hp??max;
      const a=this.anchors.get(u);if(a&&!u.dead&&(HPBARS.on||hp<max-.01)&&manSpotted(S,u))this.paint(a.x-cam.x,a.y-cam.y-UNIT_HEALTH.clear*k,hp,max,k)
    }}
    if(typeof SiteLife!=='undefined')for(const u of SiteLife.visible()){const a=this.anchors.get(u);if(a&&this.wanted(u))this.paint(a.x-cam.x,a.y-cam.y-UNIT_HEALTH.clear*k,u.hp,u.max,k)}
  }
}
