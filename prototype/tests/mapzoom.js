'use strict';
// The world map's zoom (core.js MAPZOOM, mapZoom): the map drawn at a whole number of device pixels to a game pixel still, one
// step at a time by the wheel, + and −, the buttons by Save (dimmed at the ends) and a two-finger pinch (never a tap), within its
// range; clicks and picking read through it, the minimap keeps its size on the screen, the step is remembered (PREFS mapzoom,
// Settings → Map zoom); the default is the window's own scale, three times it on a phone; battles keep their own zoom and the window's scale. The screen
// here a 3x one (devicePixelRatio 3: the fixed view's 576 x 360 game px at 3x or more).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
const t=T,G=t.G,P=t.P,W=t.W,Z=t.MAPZOOM,ev=s=>(0,eval)(s),pn=performance.now,r0=Math.random,cv=document.querySelector('canvas');
const dprD=Object.getOwnPropertyDescriptor(window,'devicePixelRatio');
try{
 try{localStorage.clear()}catch(e){}
 window.requestAnimationFrame=()=>0;Object.defineProperty(window,'devicePixelRatio',{get:()=>3,configurable:true});
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;G.clock=t.DAY*.3;let now=1e7;performance.now=()=>now;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.chase=null;P.tx=null};world();
 // a quiet spot on open ground, as tests/smoothmove.js finds one
 let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;let n=0;for(let j=-3;j<=3;j++)for(let i=-5;i<=5;i++)if(t.tAt(tx+i,ty+j)===t.T_OPEN)n++;
  if(n===77&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>240)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>120))spot=[x,y]}
 const clear=()=>{t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];W.ships=[];W.fights=[]};clear();
 P.x=spot[0]+.4;P.y=spot[1]+.2;P.stay=null;P.troops={hum_levy:12};t.reveal();
 t.fitScreen();t.frame();const s0=Z.s0,inB=$=>document.getElementById($);
 const view=()=>t.VW===Math.ceil(576*s0/t.VS)&&t.VH===Math.ceil(360*s0/t.VS)&&t.cv.width===t.VW*t.VS&&t.cv.height===t.VH*t.VS&&t.CVS===t.VS;
 // ---- the default: the window's own scale, the fixed view as ever
 ok(Z.z===0&&t.VS===s0&&t.VW===576&&t.VH===360&&view()&&t.HUD_PX===3/s0,'the default is auto: the window\'s own scale ('+s0+'), the view 576 x 360 as before');
 ok(Z.lo<s0&&Z.hi>s0&&Math.ceil(576*s0/Z.hi)>=Z.IN&&Math.ceil(576*s0/Z.lo)*Math.ceil(360*s0/Z.lo)<=Z.OUT,'the range: '+Z.lo+' (out, '+Math.ceil(576*s0/Z.lo)+' x '+Math.ceil(360*s0/Z.lo)+' game px) to '+Z.hi+' (in, '+Math.ceil(576*s0/Z.hi)+' x '+Math.ceil(360*s0/Z.hi)+')');
 // ---- the wheel: a step a notch, throttled
 const wheel=dy=>cv.dispatchEvent(new WheelEvent('wheel',{deltaY:dy,clientX:200,clientY:200,bubbles:true,cancelable:true}));
 wheel(-100);t.frame();const a1=t.VS;wheel(-100);t.frame();const a2=t.VS;now+=Z.WHEEL+10;wheel(-100);t.frame();const a3=t.VS;
 ok(a1===s0+1&&a2===a1&&a3===s0+2&&view(),'the wheel up zooms in a step a notch ('+s0+' to '+a1+'), one more within '+Z.WHEEL+' ms is ignored, after it another ('+a3+'); the view follows ('+t.VW+' x '+t.VH+')');
 now+=1000;wheel(100);t.frame();ok(t.VS===s0+1&&view(),'the wheel down zooms out a step');
 // ---- + and −
 const key=(k,code)=>window.dispatchEvent(new KeyboardEvent('keydown',{key:k,code,bubbles:true}));
 key('-','Minus');t.frame();const k1=t.VS;key('=','Equal');t.frame();const k2=t.VS;key('+','NumpadAdd');t.frame();const k3=t.VS;key('-','NumpadSubtract');t.frame();
 ok(k1===s0&&k2===s0+1&&k3===s0+2&&t.VS===s0+1&&view(),'− zooms out, + (= or the keypad\'s) in, a step each ('+[k1,k2,k3,t.VS].join(', ')+')');
 // ---- the range's ends, and the buttons dimmed at them
 const bIn=inB('zoomIn'),bOut=inB('zoomOut');
 for(let i=0;i<12;i++)key('=','Equal');t.frame();const top=t.VS,inOff=bIn.disabled&&!bOut.disabled,more=t.mapZoom(1);
 for(let i=0;i<12;i++)key('-','Minus');t.frame();const bot=t.VS,outOff=bOut.disabled&&!bIn.disabled;
 ok(top===Z.hi&&!more&&bot===Z.lo&&view(),'steps stop at the ends of the range ('+bot+' to '+top+')');
 ok(inOff&&outOff,'the + button is dimmed at the closest, the − at the farthest');
 bIn.click();t.frame();const c1=t.VS;bIn.click();t.frame();const c2=t.VS;bOut.click();t.frame();
 ok(c1===Z.lo+1&&c2===Z.lo+2&&t.VS===Z.lo+1&&!bIn.disabled&&!bOut.disabled,'the + and − buttons zoom a step each');
 {const sc=inB('screen'),m0=sc.dataset.mode,shown=()=>getComputedStyle(bIn).display!=='none'&&getComputedStyle(bOut).display!=='none';sc.dataset.mode='world';const onMap=shown();sc.dataset.mode='battle';const inBat=shown();sc.dataset.mode='town';const inTown=shown();sc.dataset.mode=m0;
  ok(onMap&&!inBat&&!inTown&&bIn.closest('.dockrow.sys')&&bOut.closest('.dockrow.sys'),'the buttons sit in the dock\'s bottom row, shown on the map only')}
 // ---- a pinch: a step each time the fingers spread or close enough; never travels, never a long press
 {const r=()=>cv.getBoundingClientRect(),fire=(type,x,y,id)=>cv.dispatchEvent(new PointerEvent(type,{clientX:x,clientY:y,pointerId:id,isPrimary:id===1,pointerType:'touch',button:type==='pointermove'?-1:0,bubbles:true,cancelable:true}));
  const R=r(),cx=R.left+R.width/2,cy=R.top+R.height/2-40,tx0=P.tx,sel=G.chase;const v0=t.VS;
  fire('pointerdown',cx-30,cy,1);fire('pointerdown',cx+30,cy,2);fire('pointermove',cx-34,cy,1);fire('pointermove',cx+34,cy,2);const v1=t.VS;
  fire('pointermove',cx-40,cy,1);fire('pointermove',cx+40,cy,2);const v2=t.VS;fire('pointermove',cx-52,cy,1);fire('pointermove',cx+52,cy,2);const v3=t.VS;
  const lp=t.touchTick(now+t.TOUCH.hold+50);fire('pointermove',cx-41,cy,1);fire('pointermove',cx+41,cy,2);const v4=t.VS;fire('pointerup',cx-41,cy,1);fire('pointerup',cx+41,cy,2);t.frame();
  ok(v1===v0&&v2===v0+1&&v3===v0+2&&v4===v0+1,'spreading two fingers zooms in a step each '+Z.PINCH+'x apart ('+[v0,v1,v2,v3].join(', ')+'), closing them zooms out ('+v4+')');
  ok(P.tx===tx0&&G.chase===sel&&!lp&&document.getElementById('tip').hidden&&!t.TOUCH.pts.size&&!t.TOUCH.pinch,'a pinch travels nowhere and shows no card');
  fire('pointerdown',cx+60,cy,1);fire('pointerup',cx+60,cy,1);ok(P.tx!=null,'a tap after it travels as ever');P.tx=null;
  // (lift one finger and put it back: a new pinch)
  fire('pointerdown',cx-30,cy,1);fire('pointerdown',cx+30,cy,2);fire('pointerup',cx+30,cy,2);fire('pointerdown',cx+30,cy,3);fire('pointermove',cx+60,cy,3);const v5=t.VS;fire('pointerup',cx-30,cy,1);fire('pointerup',cx+60,cy,3);
  ok(v5===v4+1&&P.tx==null,'a finger lifted and put back pinches again, still travelling nowhere')}
 // ---- through the zoom: a click travels to the map's point under it; a party under the pointer is picked; the minimap's size
 const c=t.ctx,calls=[];let rec=false;const di0=c.drawImage;c.drawImage=function(img,...a){if(rec)calls.push([img,a,this.getTransform()]);return di0.apply(this,[img,...a])};
 const frame=()=>{calls.length=0;rec=true;try{t.frame()}finally{rec=false}};const isInt=v=>Math.abs(v-Math.round(v))<1e-4,EPS=1e-4;
 const miniW=()=>{const m=t.WorldArt.mini(Math.max(1,Math.round(t.MW/256)))._at,q=calls.find(([img])=>img===m);return q?[m.width*t.VS,q[2].e+q[2].a*q[1][0]]:null};
 try{
  const minis=[];
  for(const s of [Z.lo,s0,Z.hi]){t.act('mapzoom',String(s===s0?0:s));world();P.x=Math.floor(P.x)+.4;frame();const S=t.VS;minis.push(miniW());
   const R=cv.getBoundingClientRect(),cl=(wx,wy)=>({clientX:R.left+(wx-G.cam.x)*R.width/t.VW,clientY:R.top+(wy-G.cam.y)*R.height/t.VH});
   // (the picture: what stands in whole S x S blocks on the camera's fraction; every picture at its own size, a whole S)
   {const g=c.getImageData(0,0,t.cv.width,t.cv.height),d=g.data,W2=g.width,C=G.cam,off=((-Math.round(C.x*S))%S+S)%S,offy=((-Math.round(C.y*S))%S+S)%S,px=(x,y)=>d.subarray((y*W2+x)*4,(y*W2+x)*4+4).join();
    let blocks=0,badB=0;for(let by=offy+S;by<60*S;by+=S)for(let bx=off+S;bx<200*S;bx+=S){const p0=px(bx,by);let same=true;for(let j=0;j<S&&same;j++)for(let i=0;i<S;i++)if(px(bx+i,by+j)!==p0){same=false;break}blocks++;if(!same)badB++}
    const bad=calls.filter(([img,a,m])=>{const sz=a.length===2||(a.length===8&&a[2]===a[6]&&a[3]===a[7]);return !sz||Math.abs(Math.abs(m.a)-S)>EPS||Math.abs(m.d-S)>EPS||m.b||m.c||!isInt(m.e+m.a*(a.length===8?a[4]:a[0]))||!isInt(m.f+m.d*(a.length===8?a[5]:a[1]))});
    ok(S===s&&view()&&blocks>1000&&!badB&&calls.length>8&&!bad.length,'at '+S+' ('+t.VW+' x '+t.VH+' game px) the map lies in whole '+S+' x '+S+' blocks ('+blocks+(badB?', '+badB+' not':'')+') and no picture of '+calls.length+' is resampled'+(bad.length?': '+bad.slice(0,2).map(([img,a,m])=>img.width+'x'+img.height+' @'+[m.a,m.e].map(v=>+v.toFixed(3))).join('; '):''))}
   {const wx=P.x+37.3,wy=P.y-21.6,e=cl(wx,wy),p=t.toCanvas(e);t.cv.dispatchEvent(new PointerEvent('pointerdown',{...e,pointerType:'mouse',button:0,bubbles:true}));t.cv.dispatchEvent(new PointerEvent('pointerup',{...e,pointerType:'mouse',button:0,bubbles:true}));
    ok(Math.abs(G.cam.x+p.x-wx)<1e-6&&Math.abs(P.tx-wx)<1e-6&&Math.abs(P.ty-wy)<1e-6,'at '+S+' a click travels to the map\'s point under it ('+P.tx.toFixed(2)+', '+P.ty.toFixed(2)+')');P.tx=null}
   {const L=W.lords.find(l=>!l.dead);Object.assign(L,{x:P.x+40.37,y:P.y+12.2,inside:null,fight:null,dir:1});frame();const p=t.toCanvas(cl(L.x+.3,L.y-6));
    ok(t.pickAt(G.cam.x+p.x,G.cam.y+p.y)===L,'at '+S+' the party under the pointer is picked');L.x=-9999;L.y=-9999}}
  ok(minis.every(m=>m&&Math.abs(m[0]-112*s0)<=t.VS*2&&Math.abs(m[0]-minis[1][0])<=Z.hi*2),'the minimap keeps its size on the screen at every zoom ('+minis.map(m=>m&&m[0]).join(', ')+' device px across)');
 }finally{c.drawImage=di0}
 // ---- remembered: the stored step comes back as the game loads; Settings offers Auto and every step
 {t.act('mapzoom',String(Z.hi));const st=localStorage.getItem('ashmark.mapzoom');Z.z=0;t.fitScreen();const auto=t.VS;Z.z=t.prefLoad('mapzoom');t.fitScreen();
  ok(st===String(Z.hi)&&auto===s0&&t.VS===Z.hi,'the zoom is stored (ashmark.mapzoom '+st+') and read back on load');
  world();t.mapZoom(-Z.hi);t.mapZoom(s0-Z.lo);ok(t.VS===s0&&Z.z===0&&localStorage.getItem('ashmark.mapzoom')==='0','zoomed back to the window\'s own scale it is auto again');
  t.showTitle('settings');const bs=[...document.querySelectorAll('#panel [data-act="mapzoom"]')].map(b=>b.dataset.arg+(b.classList.contains('on')?'*':''));
  t.act('mapzoom',String(Z.lo+1));const on=document.querySelector('#panel [data-act="mapzoom"].on');
  ok(bs.join()===['0*',...Array.from({length:Z.hi-Z.lo+1},(_,i)=>String(Z.lo+i))].join()&&on&&on.dataset.arg===String(Z.lo+1)&&t.prefGet('mapzoom')===Z.lo+1,'Settings → Map zoom: Auto and '+Z.lo+'–'+Z.hi+', the one chosen lit and stored');
  t.act('mapzoom','0');world();t.frame()}
 // ---- battles: their own zoom and the window's scale, whatever the map's
 {t.act('mapzoom',String(Z.hi));world();t.frame();const zv=[t.VW,t.VH,t.VS];
  const fight=()=>{P.troops={hum_spear:6,hum_bow:4};Math.random=t.seeded(3);t.startBattle({enemies:['orc_grunt','orc_grunt','archer'],tournament:false});G.mode='battle';Math.random=t.seeded(5);now=2e7;t.frame();
   const d=t.ctx.getImageData(0,0,t.cv.width,t.cv.height).data;let h=0;for(let i=0;i<d.length;i+=7)h=(h*31+d[i])|0;return [t.cv.width,t.cv.height,t.CVS,t.VS,t.VW,t.VH,t.HUD_PX,t.B.cam?t.B.cam.z:1,JSON.stringify(t.B.obs),h].join('|')};
  // (a battle first, unzoomed: the first one lays its HUD out afresh, so compare the next two)
  t.act('mapzoom','0');world();t.frame();fight();ev('B=null');t.act('mapzoom',String(Z.hi));world();t.frame();
  const zoomed=fight(),z0=t.B.cam&&t.B.cam.z;wheel(-100);const zw=t.B.cam&&t.B.cam.z;key('=','Equal');const zk=t.B.cam&&t.B.cam.z;
  ok(t.VS===s0&&t.VW===576&&t.cv.width===t.BVW&&t.CVS===1&&Z.z===Z.hi,'in a battle the screen is the window\'s own scale again (the map\'s zoom kept for the map)');
  ok(z0!=null&&zw>z0&&zk>zw&&Z.z===Z.hi&&t.VS===s0,'the wheel and + zoom the battle\'s camera, as ever ('+[z0,zw,zk].map(v=>v.toFixed(2)).join(' → ')+'), not the map');
  ev('B=null');world();t.frame();ok(t.VW===zv[0]&&t.VH===zv[1]&&t.VS===zv[2],'back on the map, its zoom again');
  t.act('mapzoom','0');world();t.frame();const plain=fight();
  ok(zoomed===plain,'a battle started from the zoomed map is the same as from the unzoomed one: its field, obstacles and drawing ('+plain.split('|').slice(0,8).join(',')+')'+(zoomed===plain?'':': '+zoomed.split('|').map((v,i)=>v===plain.split('|')[i]?'=':v.slice(0,80)+' vs '+plain.split('|')[i].slice(0,80)).join(' ')));
  ev('B=null');world();t.frame()}
 // ---- a phone (the window's shorter side MAPZOOM.SMALL CSS px or less; the fixed view here, so phone() is told so): the map
 // drawn PHONE times the window's scale by default (the owner, 2026-10-22), within the range; still Auto; the HUD and the minimap
 // at the window's scale; a step from there stored, a step back Auto again; off the map the window's own scale
 {const ph=Z.phone;try{Z.phone=()=>true;t.act('mapzoom','0');world();t.fitScreen();t.frame();const A=Math.min(Z.hi,s0*Z.PHONE);
   ok(Z.auto===A&&A>s0&&t.VS===A&&Z.z===0&&t.HUD_PX===3/s0&&Math.abs(Z.k()-s0/t.VS)<1e-9&&view(),'on a phone the map is drawn at '+A+' by default, not the window\'s '+s0+' ('+t.VW+' x '+t.VH+' game px); the HUD at the window\'s scale');
   const m=t.worldMiniRect();ok(Math.abs(m.w*t.VS-112*s0)<=t.VS*2,'the minimap keeps its size on the screen ('+m.w*t.VS+' device px across)');
   const a1=t.mapZoom(-1);t.frame();const v1=t.VS,st=localStorage.getItem('ashmark.mapzoom');const a2=t.mapZoom(1);t.frame();
   ok(a1&&a2&&v1===A-1&&st===String(A-1)&&t.VS===A&&Z.z===0&&localStorage.getItem('ashmark.mapzoom')==='0','a step out from it is stored ('+st+'), a step back is Auto again');
   ok(document.getElementById('zoomIn').disabled===(A>=Z.hi)&&!document.getElementById('zoomOut').disabled,'the zoom buttons dimmed from the phone\'s default ('+A+', in to '+Z.hi+')');
   Z.map=false;t.fitScreen();const off=t.VS;Z.map=true;t.fitScreen();ok(off===s0&&t.VS===A,'off the map (a battle, a scene) the window\'s own scale, '+off)}
  finally{Z.phone=ph;t.act('mapzoom','0');world();t.fitScreen();t.frame()}
  t.fitScreen();ok(Z.auto===s0&&t.VS===s0,'a desktop window: the default is the window\'s own scale, as ever')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
finally{performance.now=pn;Math.random=r0;try{if(dprD)Object.defineProperty(window,'devicePixelRatio',dprD);else delete window.devicePixelRatio}catch(e){}try{localStorage.removeItem('ashmark.mapzoom');t.MAPZOOM.z=0;t.fitScreen()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
