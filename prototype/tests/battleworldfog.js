'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.troops={hum_foot:2};P.comps={};
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);const enemy=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y});
 G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world;Object.assign(b.hero,a.field(P));a.view=null;
 // (your sight: every living man's of your side, fog.js Sight; the owner, 2026-11-01: "the vision and fog of war should be based on
 // all army units not only heroes")
 {const S=t.yourSight(),mine=b.units.filter(u=>!u.team&&u.hp>0&&!u.left&&!u.rout),hr=[];for(let i=0;i<3*S.m;i+=3)if(Math.hypot(S.raw[i]-P.x,S.raw[i+1]-P.y)<1e-6)hr.push(S.raw[i+2]);
  ok(S.m===mine.length&&hr.some(r=>Math.abs(r-t.vis())<1e-9)&&a.sight()===S.eyes,'combat uses the normal world vision range: your hero sees vis(), each living man of yours an eye ('+S.m+')')}
 const friend={...b.hero,id:999,hero:false,...a.field({x:P.x+2*t.vis(),y:P.y})};b.units.push(friend);b.t+=.01;
 ok(t.inSight(P.x+2*t.vis(),P.y)&&a.sight().some(e=>Math.hypot(e.x-P.x-2*t.vis(),e.y-P.y)<1e-6),'a man of yours far off sees for you: his own eye');b.units.pop();b.t+=.01;
 const fog=window.drawWorldFog,mem=window.fogMem;let fogCalls=0,memCalls=0;
 try{window.drawWorldFog=(...args)=>{fogCalls++;return fog(...args)};window.fogMem=(...args)=>{memCalls++;return mem(...args)};t.frame();ok(fogCalls===1&&memCalls===1,'battle background uses the normal fog and remembered-land renderer exactly once')}finally{window.drawWorldFog=fog;window.fogMem=mem}
 ok(typeof a.fog==='undefined','battle has no separate circular clear-cut mask around its fog');
 const ctx=t.ctx,cam={x:P.x-t.vis()/2,y:P.y-t.vis()/2},desc=Object.getOwnPropertyDescriptor(performance,'now'),reduced=window.reducedMotion;
 window.__normalFogBattle=b;ctx.save();try{
  Object.defineProperty(performance,'now',{configurable:true,value:()=>5000});window.reducedMotion=()=>true;
  const picture=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,t.cv.width,t.cv.height);t.drawWorldFog(cam,t.vis());return ctx.getImageData(0,0,256,256).data};
  // (the same eyes both ways: in the battle your hero alone, at your army's middle; on the map you alone, no army marching)
  const out=b.units.filter(u=>!u.team&&u!==b.hero&&!u.left);for(const u of out)u.left=true;b.t+=.01;
  const during=picture();window.eval('B=null');t.WORLD_BATTLE.on=false;const normal=picture();t.WORLD_BATTLE.on=true;for(const u of out)delete u.left;
  ok(during.every((v,i)=>v===normal[i]),'battle and normal world fog produce identical mist, dimming and edge pixels for the same eyes');
 }finally{window.eval('B=window.__normalFogBattle');delete window.__normalFogBattle;t.WORLD_BATTLE.on=true;b.t+=.01;window.reducedMotion=reduced;if(desc)Object.defineProperty(performance,'now',desc);else delete performance.now;ctx.restore()}
 /* (the ring drawn only with OPEN_FIGHT.ring on: a fight on the map is open, none round it, 2026-11-14; tests/openfights.js) */const radius=a.r,arc=ctx.arc,arcs=[],ring=t.OPEN_FIGHT.ring;t.OPEN_FIGHT.ring=true;try{ctx.arc=function(x,y,r,...rest){arcs.push({r,dash:this.getLineDash().slice()});return arc.call(this,x,y,r,...rest)};a.draw()}finally{ctx.arc=arc;t.OPEN_FIGHT.ring=ring}
 ok(arcs.some(p=>p.r===a.radius&&p.dash.length===2)&&a.r===radius,'yellow dashed movement boundary keeps its size and drawing (its ring on)');
 t.fogReset();t.reveal();const count=t.seenSave(),before=JSON.stringify(a.sight());a.r*=3;t.reveal();ok(t.seenSave()===count&&JSON.stringify(a.sight())===before,'changing the movement boundary neither reveals land nor changes vision');a.r=radius;
});
