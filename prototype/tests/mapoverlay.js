'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;P.stay=null;P.camp=null;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+240,home.y+200);
 const herd=t.asHerd({crit:true,id:'deer',n:2,x:P.x+20,y:P.y,hx:P.x+20,hy:P.y,dir:1,t:5,a:0,tire:0,cool:0,idle:true});W.critters=[herd];
 const dpr=Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),scale=t.VS,draw=window.drawStealthEye;let calls=[];
 try{
  window.drawStealthEye=(...args)=>{calls.push(args);return draw(...args)};
  for(const density of [1,3])for(const zoom of [1,5,8,14])for(const n of [2,300]){
   Object.defineProperty(window,'devicePixelRatio',{configurable:true,value:density});window.eval('VS='+zoom+';BANNERQ=[]');herd.n=n;const cam={x:Math.floor(P.x-60),y:Math.floor(P.y-80)},ents=[];herd.draw(ents,cam,t.vis());ents.forEach(e=>e.f());
   const queued=t.BANNERQ.find(q=>q.o===herd&&q.marker);calls=[];t.drawTravelDetection(cam);const eye=calls[0],marker=t.bandMarkerAt(herd,queued.marker,cam),pic=t.mapTxtPic(String(n),queued.marker.col,'center',zoom,density),labelRight=marker.x+4+(pic.width-pic.ox)/zoom,actualX=Math.round(eye[2]*zoom)/zoom;
   ok(calls.length===2&&actualX>=Math.max(marker.x+marker.s.width,labelRight)+t.STEALTH_EYE.gap*density/zoom-1/zoom&&eye[3]===marker.y&&eye[4]===18,'wildlife eye clears the group icon and count '+n+' at density '+density+', zoom '+zoom);
   t.drawBanners(cam);
  }
 }finally{window.drawStealthEye=draw;window.eval('VS='+scale+';BANNERQ=[]');if(dpr)Object.defineProperty(window,'devicePixelRatio',dpr);else delete window.devicePixelRatio;t.fitScreen()}
 // Leave a real prepared battle for the browser runner to press and release Start Battle.
 W.critters=[];P.troops={hum_foot:2};const enemy=t.asParty({kind:'bandits',troops:Array(4).fill('militia'),x:P.x+65,y:P.y,cool:0});t.bandits.push(enemy);G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:enemy.troops.slice(),tournament:false});
 for(let i=0;i<1600&&t.B.muster?.active;i++)t.updateBattle(.1);t.frame();const button=document.getElementById('bStart'),r=button.getBoundingClientRect(),screen=document.getElementById('screen').getBoundingClientRect();
 ok(t.B.ready&&t.B.paused&&!button.disabled&&!button.hidden&&Math.abs(r.left+r.width/2-screen.left-screen.width/2)<.01&&Math.abs(r.top+r.height/2-screen.top-screen.height/2)<.01,'prepared battle exposes an enabled centered Start Battle button');
 ok(!ERR.length,'map overlays render without runtime errors');
});
