'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:2};P.comps={};
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y});
 G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world;Object.assign(b.hero,a.field(P));a.view=null;
 ok(a.sight().length===1&&a.sight()[0].r===t.vis(),'combat uses the exact normal world vision range');
 const before=a.sight()[0],friend={...b.hero,id:999,hero:false,...a.field({x:P.x+2*t.vis(),y:P.y})};b.units.push(friend);a.view=null;
 ok(a.sight().length===1&&!t.inSight(P.x+2*t.vis(),P.y),'troops no longer create additional battle-only vision circles');b.units.pop();a.view=null;
 const fog=window.drawWorldFog,mem=window.fogMem;let fogCalls=0,memCalls=0;
 try{window.drawWorldFog=(...args)=>{fogCalls++;return fog(...args)};window.fogMem=(...args)=>{memCalls++;return mem(...args)};t.frame();ok(fogCalls===1&&memCalls===1,'battle background uses the normal fog and remembered-land renderer exactly once')}finally{window.drawWorldFog=fog;window.fogMem=mem}
 ok(typeof a.fog==='undefined','battle has no separate circular clear-cut mask around its fog');
 const ctx=t.ctx,cam={x:P.x-t.vis()/2,y:P.y-t.vis()/2},desc=Object.getOwnPropertyDescriptor(performance,'now'),reduced=window.reducedMotion;
 window.__normalFogBattle=b;ctx.save();try{
  Object.defineProperty(performance,'now',{configurable:true,value:()=>5000});window.reducedMotion=()=>true;
  const picture=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,t.cv.width,t.cv.height);t.drawWorldFog(cam,t.vis());return ctx.getImageData(0,0,256,256).data};
  const during=picture();window.eval('B=null');const normal=picture();ok(during.every((v,i)=>v===normal[i]),'battle and normal world fog produce identical mist, dimming and edge pixels at the same position');
 }finally{window.eval('B=window.__normalFogBattle');delete window.__normalFogBattle;window.reducedMotion=reduced;if(desc)Object.defineProperty(performance,'now',desc);else delete performance.now;ctx.restore()}
 const radius=a.r,arc=ctx.arc,arcs=[];try{ctx.arc=function(x,y,r,...rest){arcs.push({r,dash:this.getLineDash().slice()});return arc.call(this,x,y,r,...rest)};a.draw()}finally{ctx.arc=arc}
 ok(arcs.some(p=>p.r===a.radius&&p.dash.length===2)&&a.r===radius,'yellow dashed movement boundary keeps its size and drawing');
 t.fogReset();t.reveal();const count=t.seenSave();a.r*=3;t.reveal();ok(t.seenSave()===count&&a.sight()[0].r===before.r,'changing the movement boundary neither reveals land nor changes vision');a.r=radius;
});
