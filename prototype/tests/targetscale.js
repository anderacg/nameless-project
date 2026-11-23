'use strict';
window.PHONE=true;
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.SEAMLESS.on=true;
 const enemy=t.asParty({kind:'bandits',troops:['militia'],x:P.x+35,y:P.y,cool:0});t.bandits.push(enemy);t.startEncounter({kind:'party',ref:enemy,list:enemy.troops.slice(),mine:true});
 t.Kit.engage();
 const b=t.B,F=t.battleTargetFeedback,target=b.units.find(u=>u.team===1&&u.hp>0),z=t.MAPZOOM,old={dpr:Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),cap:t.RENDER.cap,z:z.z};
 ok(!!b.world,'scale regression uses real continuous world combat, not an arena');t.selectGroup(b.hero.grp);t.WorldCombat.attack(target);t.battlePause(true);target.hid=0;
 const orders=()=>JSON.stringify({area:[b.world.x,b.world.y,b.world.radius],groups:Object.values(b.groups).map(g=>[g.id,g.order,g.targetUnitId]),units:b.units.map(u=>[u.id,u.hp,u.x,u.y])});
 const before=orders();
 try{
  t.RENDER.cap=3;
  for(const density of [1,2,3])for(const zoom of ['auto','close']){
   Object.defineProperty(window,'devicePixelRatio',{value:density,configurable:true});z.map=true;z.z=0;t.fitScreen();if(zoom==='close'){z.z=z.hi;t.fitScreen()}b.world.syncCamera();F.at=0;t.frame();
   const g=t.ctx,ellipse=g.ellipse,fill=g.fill,begin=g.beginPath,move=g.moveTo,line=g.lineTo;let shape=null,diamond=null,points=[];
   g.ellipse=function(...a){const m=this.getTransform(),css=Math.hypot(m.a,m.b)*t.cv.clientWidth/t.cv.width;shape={radius:a[2]*css,stroke:this.lineWidth*css,x:a[0],y:a[1]};return ellipse.apply(this,a)};
   g.beginPath=function(...args){points=[];return begin.apply(this,args)};
   g.moveTo=function(x,y){points.push(y);return move.call(this,x,y)};g.lineTo=function(x,y){points.push(y);return line.call(this,x,y)};
   g.fill=function(...args){const m=this.getTransform(),css=Math.hypot(m.a,m.b)*t.cv.clientWidth/t.cv.width;diamond=(Math.max(...points)-Math.min(...points))*css;return fill.apply(this,args)};
   try{g.save();g.scale(t.CVS,t.CVS);F.drawTarget();g.restore()}finally{g.ellipse=ellipse;g.fill=fill;g.beginPath=begin;g.moveTo=move;g.lineTo=line}
   info(JSON.stringify({density,zoom,vs:t.VS,...shape}));
   ok(shape&&shape.radius>=3&&shape.radius<=16,'target ring stays near the unit at DPR '+density+', '+zoom+' zoom');
   ok(shape&&shape.stroke>0&&shape.stroke<=3,'target outline stays thin at DPR '+density+', '+zoom+' zoom');
   ok(diamond>0&&diamond<=10,'target diamond stays compact at DPR '+density+', '+zoom+' zoom');
   const at=t.fromField({x:target.x,y:target.y-t.fieldLift(target.x,target.y)});ok(shape&&Math.abs(shape.x-at.x)<1e-8&&Math.abs(shape.y-at.y)<1e-8,'marker still follows the individual at DPR '+density+', '+zoom+' zoom');
  }
  ok(before===orders(),'display density and marker drawing do not alter combat or the battle boundary');
 }finally{if(old.dpr)Object.defineProperty(window,'devicePixelRatio',old.dpr);else delete window.devicePixelRatio;t.RENDER.cap=old.cap;z.z=old.z;t.fitScreen()}
 ok(!ERR.length,'world battle marker has no rendering errors');
});
