'use strict';
/* ---------- staggering (the owner, 2026-11-03: "make a physic charge look more impact ... like stagger in more realistic way with
   slight push back ... at least 3-4 or more variations based on the unit"). Drawn only: the down itself, how long and when he is
   up, stays physics.js's (u.down, u.downFor).
   Knocked down, a man goes one of STAGGER.ways, picked by his build (light, foot, heavy: physMass) and a hash of his id and how
   many times he has gone down this battle: reel, rocked back on his feet, stumbling a step or two, never lying; back, staggered
   back and over onto his back; face, pitched onto his face; spin, spun round and down on his face; knee, driven to one knee, head
   bowed; sit, thrown back onto his seat. He goes the way he was thrown (u.reelA: thrown from behind, over on his face). Thrown and not felled (physics.js physReel), a
   short reel: leaning back from the blow, a step or two back, by how hard (render.js) ---------- */
const STAGGER={on:true,
  // the ways' weights by build: light under light of mass, heavy at heavy and over (mail, plate, heavy troops)
  ways:{light:{back:3,spin:2,sit:2,reel:1,knee:1,face:1},foot:{back:2,reel:2,knee:2,face:1,spin:1,sit:1},heavy:{reel:3,knee:3,back:1,sit:1}},light:1.15,heavy:1.3,
  // a throw that does not fell him: from min of what would (a share of it, 0-1); t s at full strength (half as long at the
  // least), lean rad back, back px, steps (1 to steps, by his id)
  reel:{min:.3,t:.45,lean:.4,back:3,steps:3},
  // going down: fall s (at most half his time down) to hit the ground, pre the share of it stumbling (lean rad, back px), rise s
  // to get up (at most a third); crouch px a knee drops him, sit px his seat; wob rad, a reel's sway; bounce px landing
  fall:{t:.34,pre:.45,lean:.45,back:4,rise:.3,crouch:4,sit:5,wob:.12,bounce:1}};
const Stagger={
  // (which way he goes down this time: kept on him till the next down, by when it began)
  way(u){const s0=B.t-((u.downFor||0)-(u.down||0));if(u.stgWay&&Math.abs(s0-u.stgS)<.05)return u.stgWay;
    const m=physMass(u),S=STAGGER,W=S.ways[m<S.light?'light':m>=S.heavy?'heavy':'foot'];u.stgN=(u.stgN||0)+1;u.stgS=s0;return u.stgWay=deathPick(u.id,W,4421+u.stgN)},
  // (+1: thrown the way he faces, from behind; -1: back, from the front)
  side(u,a){return a==null?-1:Math.cos(a)*(u.face<0?-1:1)>=0?1:-1},
  // a throw that rocks him (render.js): lean (rad, + forward), dx (px, + the way he faces), dy (px, + down), live; none: null
  reel(u){const R=STAGGER.reel;if(!STAGGER.on||u.reelAt==null)return null;const k=u.reelK||0,e=(B.t-u.reelAt)/(R.t*(.5+.5*k));if(!(e>=0&&e<1))return null;
    const sd=this.side(u,u.reelA),env=Math.sin(e*Math.PI),steps=1+(u.id|0)%R.steps;
    return{lean:sd*R.lean*k*env,dx:sd*Math.round(R.back*k*Math.sin(Math.min(1,e*1.6)*Math.PI/2)),dy:-Math.round(Math.abs(Math.sin(e*Math.PI*steps))*1.5*k)}},
  /* knocked down (render.js drawDowned): c his downed sprites (sprites.js downedOf: stand, him upright, his weapon kept; body,
     lying on his face). Drawn about his feet, in his facing */
  draw(u,c,x,y){const F=STAGGER.fall,way=this.way(u),T=u.downFor||u.down||1,s=T-(u.down||0),ft=Math.min(F.t,T*.5),rt=Math.min(F.rise,T/3),
      a=clamp(s/ft,0,1),r=clamp((u.down||0)/rt,0,1),st1=clamp(a/F.pre,0,1),st2=clamp((a-F.pre)/(1-F.pre),0,1),sd=this.side(u,u.reelA),
      ez=v=>v*v*(3-2*v),land=a>=1&&s-ft<.12?Math.round(F.bounce*Math.sin((s-ft)/.12*Math.PI)):0,top=c.top||0;
    let rot=0,dx=0,dy=0,crouch=0,flip=1,lie=null;
    if(way==='reel'){const q=Math.min(ez(a),r),w=Math.exp(-s*2.5);rot=sd*F.lean*q+F.wob*Math.sin(s*13)*w*q;dx=sd*Math.round(F.back*q);dy=-Math.round(Math.abs(Math.sin(s*11))*w*q*1.5);crouch=Math.round(2*q*(1-w))}
    else if(way==='knee'){const q=Math.min(ez(a),r);rot=.25*q;crouch=Math.round(F.crouch*q);dx=sd*Math.round(F.back*.5*st1*r);dy=land}
    else if(way==='sit'){const q=Math.min(ez(a),r);rot=-.38*q;crouch=Math.round(F.sit*ez(st2)*r);dx=sd*Math.round(F.back*st1*r);dy=land}
    else{/* back, face, spin: a stumble (pre) then over; lying flat, the turned sprites; up again the way he went */
      const over=way==='back'?sd:1,q=r<1?ez(r):ez(st2);rot=(r<1?0:sd*F.lean*ez(st1)*(1-st2))+over*Math.PI/2*q;dx=sd*Math.round(F.back*(r<1?r:st1));
      if(way==='spin'&&st1>.5&&r>.5)flip=-1;if(q>=1)lie=over<0?'back':'face'}
    ctx.save();ctx.translate(Math.round(x),Math.round(y+dy));if(u.face<0)ctx.scale(-1,1);ctx.translate(dx,0);if(flip<0)ctx.scale(-1,1);
    if(lie==='face')ctx.drawImage(c.body,-c.ax,1-c.ay);
    else{ctx.translate(0,1);if(rot)ctx.rotate(lie==='back'?-Math.PI/2:rot);const im=c.stand,W=im.width,H=im.height,X=-12,Y=-18-top,ly=15+top;
      if(crouch>0){ctx.drawImage(im,0,0,W,ly,X,Y+crouch,W,ly);ctx.drawImage(im,0,ly,W,H-ly,X,Y+ly+crouch,W,Math.max(1,H-ly-crouch))}else ctx.drawImage(im,X,Y)}
    ctx.restore()}};
