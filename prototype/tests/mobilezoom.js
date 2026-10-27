'use strict';
Kit.suite(({ok})=>{
 const t=T,G=t.G,Z=t.MAPZOOM;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;
 t.prefSet('mapzoom',0);t.frame();// (the screen in device pixels as fitScreen measures it: the tests' fixed view, 576 x 360 at s0, unless ?v=)
 const dpr=devicePixelRatio||1,phone=Z.phone(innerWidth,innerHeight),s0=Z.s0,defaultScale=t.VS,dw=t.FIXED_VIEW?576*s0:innerWidth*dpr,dh=t.FIXED_VIEW?360*s0:innerHeight*dpr,oldHi=Math.max(s0,Math.floor(Math.min(dw/(phone?240:320),dh/(phone?120:180)))),formerDefault=phone?Math.min(oldHi,s0*3):s0;
 const sizes=()=>{const dock=document.querySelector(phone?'.mwh-dock':'.dock'),r=dock.getBoundingClientRect(),mini=t.worldMiniRect();return{width:r.width,height:r.height,miniWidth:mini.w*t.VS/dpr,miniHeight:mini.h*t.VS/dpr,hud:t.HUD_PX}};
 const original=sizes(),same=(a,b)=>Math.abs(a-b)<=1.1;
 if(phone){
  ok(Z.lo===formerDefault,'the former mobile default is now the farthest allowed view');
  ok(defaultScale>=formerDefault*1.5&&Z.auto===defaultScale&&Z.hi>defaultScale,'Auto starts at least 50% closer and leaves more zoom-in available');
  t.prefSet('mapzoom',1);t.frame();ok(t.VS===formerDefault&&!t.mapZoom(-1)&&document.getElementById('zoomOut').disabled,'old wider preferences clamp to the new farthest view');
 }else ok(defaultScale===s0&&Z.hi===oldHi&&Z.lo<s0,'desktop default and zoom range remain unchanged');
 t.prefSet('mapzoom',0);t.frame();
 document.getElementById('zoomIn').click();t.frame();const closer=t.VS;
 ok(closer===defaultScale+1&&Number.isInteger(closer)&&!t.ctx.imageSmoothingEnabled,'Zoom + enlarges the world by a crisp whole-device-pixel step');
 const zoomed=sizes(),miniTolerance=Math.max(defaultScale,closer)/dpr,miniSame=(a,b)=>Math.abs(a-b)<=miniTolerance;ok(same(original.width,zoomed.width)&&same(original.height,zoomed.height)&&miniSame(original.miniWidth,zoomed.miniWidth)&&miniSame(original.miniHeight,zoomed.miniHeight)&&original.hud===zoomed.hud,'menus, buttons and minimap retain their screen size while the world grows');
 document.getElementById('zoomOut').click();t.frame();ok(t.VS===defaultScale&&Z.z===0,'Zoom − returns to the new Auto view');
 const rectangle=t.cv.getBoundingClientRect(),point={clientX:rectangle.left+rectangle.width*.4,clientY:rectangle.top+rectangle.height*.5},p=t.toCanvas(point);
 ok(Math.abs(p.x/ t.VW-.4)<.002&&Math.abs(p.y/t.VH-.5)<.002,'touch coordinates still map to the enlarged world accurately');
 t.prefSet('mapzoom',Z.hi);t.frame();const highest=t.VS,stored=localStorage.getItem('ashmark.mapzoom');Z.z=t.prefLoad('mapzoom');t.fitScreen();
 ok(highest===Z.hi&&!t.mapZoom(1)&&document.getElementById('zoomIn').disabled&&Number(stored)===highest&&Z.z===highest,'the closest view is bounded and its preference survives loading, including scales over 16');
 t.prefSet('mapzoom',0);t.frame();ok(t.VS===defaultScale&&t.HUD_PX===original.hud,'Auto restores the closer mobile start without resizing the UI');
 ok(!ERR.length,'zoom changes produce no runtime errors');
});
