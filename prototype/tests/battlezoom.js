'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);P.troops={hum_foot:2};const e=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B,a=b.world,Z=t.MAPZOOM;
 const dpr=Object.getOwnPropertyDescriptor(window,'devicePixelRatio');try{
  Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:4});t.fitScreen();t.frame();t.prefSet('mapzoom',Z.lo);
  const centred=()=>Math.abs(G.cam.x-t.clamp(a.x-t.VW/2,0,t.MW*t.TILE-t.VW))<.001&&Math.abs(G.cam.y-t.clamp(a.y-t.VH/2,0,t.MH*t.TILE-t.VH))<.001;
  const radius=a.r,shift=()=>{G.cam.x+=80;G.cam.y+=40;a.syncCamera()};shift();let z=t.VS;t.camZoom(1,1,1);
  ok(t.VS>z&&centred(),'zoom in centres the battle area instead of following the cursor or old viewport');
  shift();z=t.VS;t.camZoom(-1,t.VW-1,t.VH-1);ok(t.VS<z&&centred(),'zoom out keeps the fixed battlefield centre in view');
  shift();t.camPan(20,10);const x=G.cam.x;t.camTick();ok(Math.abs(G.cam.x-x)<.001,'ordinary camera ticks preserve manual panning');
  t.prefSet('mapzoom',Z.lo);const touch=t.TOUCH;touch.pts.set(1,{x:0,y:0,cx:0,cy:0});touch.pts.set(2,{x:100,y:0,cx:100,cy:0});touch.pinch={d0:100,z0:b.cam.z,w:t.toField({x:50,y:0})};shift();z=t.VS;
  t.touchMove({pointerId:2,clientX:150,clientY:0},{x:150,y:0});ok(t.VS>z&&centred(),'two-finger zoom uses the same battlefield-centred zoom');
  z=t.VS;t.touchMove({pointerId:2,clientX:150,clientY:0},{x:150,y:0});ok(t.VS===z,'holding a pinch stationary does not repeatedly zoom');const panX=G.cam.x;touch.pts.get(1).x+=30;t.touchMove({pointerId:2,clientX:180,clientY:0},{x:180,y:0});ok(Math.abs(G.cam.x-panX+30)<.001,'moving both fingers still pans between zoom steps');touch.pts.clear();touch.pinch=null;
  ok(a.r===radius,'camera zoom never resizes the battlefield boundary');
 }finally{t.TOUCH.pts.clear();t.TOUCH.pinch=null;if(dpr)Object.defineProperty(window,'devicePixelRatio',dpr);else delete window.devicePixelRatio;t.fitScreen()}
});
