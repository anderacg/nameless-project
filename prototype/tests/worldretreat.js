'use strict';
// Routed world units return through terrain routes; physical missiles match the world sprite scale.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_foot:3};
 const e=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+70,y:P.y,cool:0});
 G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,a=b.world,tr=b.terrain,u=b.units.find(u=>u.team===1),gr=b.groups[u.grp];b.paused=true;
 tr.kind.fill(t.TKIND.open);tr.lvl.fill(0);tr.built.fill(0);tr.wall.fill(0);
 // A wall just inside the east edge blocks a straight return. Both ends can be walked around.
 for(let i=0;i<tr.kind.length;i++){const x=(i%tr.C+.5)*tr.cs,y=(Math.floor(i/tr.C)+.5)*tr.cs;
  if(x>a.cx+a.radius-55&&x<a.cx+a.radius-5&&Math.abs(y-a.cy)<80)tr.kind[i]=t.TKIND.rock}
 tr.routes.build(8,t.BH-8);a.escapeRoutes=tr.route;tr.index();
 u.x=a.cx+a.radius+4;u.y=a.cy;u.rout=true;gr.resolve.routed=true;const hp=u.hp,sta=u.sta;
 a.escape(u,.01);ok(u.left&&u.regroup&&u.hpLeft===hp,'crossing the ring starts a bounded regroup without losing health');
 const w=a.returnPlan(u),grid=a.escapeRoutes[t.routeWho(u.s)];
 ok(w&&a.inside(w.to,18)&&w.p.length>1,'return chooses a reachable point inside the boundary around the wall');
 let legal=true,frames=0;for(;frames<1600&&u.regroup;frames++){const x=u.x,y=u.y;a.step(.05);legal&&=t.routeWalk(grid,x,y,u.x,u.y,255)}
 ok(legal,'every return step respects terrain rather than cutting through the wall');
 ok(!u.regroup&&!u.left&&!u.rout&&u.hp===hp&&u.sta===sta&&a.inside(u,17),'routed unit physically returns and accepts orders without healing or fatigue reset');
 gr.resolve.worldReturns=t.WORLD_BATTLE.returns;gr.resolve.routed=true;u.rout=true;u.x=a.cx+a.radius+4;u.y=a.cy;a.escape(u,.01);
 ok(u.left&&!u.regroup,'a second rout leaves permanently rather than looping at the boundary');
 const ctx=t.ctx,fill=ctx.fillRect,arrows=b.arrows.slice(),scale=t.WORLD_BATTLE.sprite;
 try{for(const arc of [false,true]){const shapes=[];b.arrows=[{arc,x:b.hero.x,y:b.hero.y,z:0,a:0,vx:1,vy:0,vz:0,t:0,by:{type:'hum_bow'}}];
   ctx.fillRect=function(x,y,w,h){if(this.fillStyle==='#e8e4d0'&&x===-4&&w===7)shapes.push(this.getTransform().a);return fill.call(this,x,y,w,h)};
   t.drawBattle();ok(shapes.some(k=>Math.abs(Math.abs(k)-b.cam.z*scale)<.0001),'physical '+(arc?'arcing':'direct')+' arrow draws at world character scale');
  }}finally{ctx.fillRect=fill;b.arrows=arrows}
});
