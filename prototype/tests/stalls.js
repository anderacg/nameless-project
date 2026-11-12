'use strict';
// No party stuck for good on its way (the owner, 2026-11-12: "when the world is simulated far away it seems like we will end up
// having a lot of entities stuck at certain places"). A lord chooses only holdings he can walk to (realms.js lordThink, walkable:
// one sent across the water stood at the shore for good); none of his own in reach, he rests and thinks again each day. A lord,
// caravan or patrol still for WORLD_STALL.hours with somewhere to go is sent another way, and kept in Stalls.seen (world/stalls.js).
Kit.suite(({ok,info})=>{
 const t=T,W=t.W,G=t.G,P=t.P,S=t.Stalls,X=t.WORLD_STALL;Kit.begin('soldier',1);Kit.world();t.GUIDE.on=false;
 const reach=t.Router.reach;
 try{
  // ---- a lord's choice: only what he can reach
  {const l=W.lords.find(x=>!x.dead&&!x.gone&&!x.inside),own=t.fiefsOf(l.fac),near=t.Spatial.nearest(own,l.x,l.y);
   window.__cut=near.name;t.Router.reach=(a,b)=>!(b&&b.name===window.__cut)&&reach.call(t.Router,a,b);const keep={troops:l.troops,state:l.state,tgt:l.tgt};l.troops=['militia'];
   t.lordThink(l);ok(l.state==='home'&&l.tgt&&l.tgt!==near.name,'home: his nearest holding beyond his reach, he makes for another he can walk to ('+l.tgt+', not '+near.name+')');
   t.Router.reach=()=>false;t.lordThink(l);ok(l.state==='rest'&&l.tgt==null,'none he can reach: he rests where he is, no holding to walk at');
   t.Router.reach=reach;Object.assign(l,keep)}
  // ---- stalled: sent another way, and kept
  {const l=W.lords.find(x=>!x.dead&&!x.gone&&!x.inside&&!x.with),keep={state:l.state,tgt:l.tgt,x:l.x,y:l.y};l.state='home';l.tgt=t.Spatial.nearest(t.fiefsOf(l.fac),l.x,l.y).name;const was=l.tgt;
   S.rec=new WeakMap();S.seen=[];const h0=t.Clock.hours(),hours=t.Clock.hours;let h=h0;t.Clock.hours=()=>h;
   try{S.hour();for(let i=0;i<X.hours-1;i++){h++;S.hour()}ok(!S.seen.length,'still for '+(X.hours-1)+' hours: not yet');
    h++;S.hour();const r=S.seen[0];ok(r&&r.k==='lord'&&/home/.test(r.was)&&l.tgt!==was,'still for '+X.hours+' hours on his way home: he thinks again, that holding put aside ('+(r?r.was+' → '+r.now:'none')+')');
    S.seen=[];S.rec=new WeakMap();l.state='home';l.tgt=was;S.hour();for(let i=0;i<X.hours;i++){h++;l.x+=X.px+1;S.hour()}ok(!S.seen.length,'one that keeps moving: never')}
   finally{t.Clock.hours=hours;Object.assign(l,keep)}}
  {G.speed=8;for(let i=0;i<4000&&(!W.caravans.some(x=>!x.mine&&!x.idle&&!x.gone)||!W.patrols.some(x=>!x.gone));i++){G.encCool=1e9;if(G.mode!=='world'){t.hidePanel();G.mode='world';G.modal=false;G.road=null}t.updateWorld(.05)}}// (the world on a while: caravans and patrols out)
  {const c=W.caravans.find(x=>!x.mine&&!x.idle&&!x.gone);if(c){const to=c.to;S.free(c);ok(c.to!==to||c.gone,'a caravan stalled: on to another holding of its realm, or home ('+to+' → '+(c.gone?'home':c.to)+')');c.to=to;c.gone=false}else info('no caravan on the road')}
  {const p=W.patrols.find(x=>!x.gone);if(p){S.free(p);ok(p.gone,'a patrol stalled: back inside its holding');W.patrols=W.patrols.filter(x=>x!==p)}else info('no patrol out')}
  ok(!S.going({mapKind:'lord',state:'siege'})&&!S.going({mapKind:'lord',state:'home',with:'x'})&&!S.going({mapKind:'caravan',mine:true})&&S.going({mapKind:'patrol'}),'not watched: a siege laid, a lord in a campaign\'s column, your own caravan');
 }finally{t.Router.reach=reach}
});
