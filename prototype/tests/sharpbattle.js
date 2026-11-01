'use strict';
window.ARENA=true;// (the battle screen's own field: tests/harness.js)
// The battle screen drawn sharp (core.js bview, camera.js camZooms; the owner, 2026-11-01: "why separated battle screen seems not
// sharp like the world screen?"). The game's page in a frame at a real window's size (?v=: not the tests' fixed view), a lab
// battle on it, on a desktop (1600 x 900, its screen's density 1) and a phone on its side (844 x 390, 3, capped by the Resolution
// setting): the canvas is the window in device px (CSS size x the capped density), the view still FIELD_H px down; at rest every
// zoom stop is a whole number of device px a field px, and the whole field fits at the farthest; a wheel's step glides there and
// lands on one, as a pinch let go does, and a window resized keeps one; the HUD on whole device px; a click on a man selects his
// group and a right-click on the ground sends it to that very spot; RENDER.sharpBattle off: today's canvas, BVW x BVH, exactly
if(/[?&]v=/.test(location.search))window.RUN=()=>{window.requestAnimationFrame=()=>0;window.SHARP_READY=true};// (the page in the frame: driven from here)
else window.RUN=()=>{
  const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);let done=false;
  window.requestAnimationFrame=()=>0;Kit.fresh();
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);document.querySelectorAll('iframe').forEach(f=>f.remove());const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  const timer=setTimeout(()=>{ok(false,'the pages and their checks finish within 200 seconds');finish()},200000);
  // (the game's page in a frame W x H, its screen's density dpr; resolved once its suite is ready)
  const open=(W,H,dpr)=>new Promise((res,rej)=>{const f=document.createElement('iframe');f.width=W;f.height=H;f.style.cssText='position:absolute;left:-12000px;top:0;border:0';
    f.src='Ashmark.html?test=sharpbattle&v=1';document.body.appendChild(f);const t0=performance.now();
    const poll=()=>{const w=f.contentWindow;if(w&&w.SHARP_READY){Object.defineProperty(w,'devicePixelRatio',{configurable:true,value:dpr});w.eval('fitScreen()');return res(f)}
      if(performance.now()-t0>90000)return rej(Error('the page in the frame never came up'));setTimeout(poll,100)};poll()});
  const whole=v=>Math.abs(v-Math.round(v))<1e-6;
  const check=(f,tag)=>{
    const w=f.contentWindow,ev=s=>w.eval(s),cv=w.document.getElementById('game');
    ev(`G.mode='world';G.modal=false;hidePanel();BattleLab.start({leftGroups:[{type:'hum_foot',count:40},{type:'hum_bow',count:20}],rightGroups:[{type:'hum_foot',count:40},{type:'hum_bow',count:20}],deploy:false,ai:false,paused:true,morale:false,seed:5,size:'big'});B.cmdT=1e9;frame()`);
    const settle=()=>ev('for(let i=0;i<200&&B.cam.ease;i++){B.cam.lt=performance.now()-50;camTick()}frame()'),px=()=>ev('B.cam.z*CVS');
    // ---- the canvas: the window in device px, capped; the view FIELD_H px down; the HUD on whole device px
    const r=cv.getBoundingClientRect(),d=ev('dprOf()'),V=ev('bview()');
    ok(V.sharp&&cv.width===V.cw&&cv.height===V.ch&&Math.abs(cv.width-r.width*d)<.5&&Math.abs(cv.height-r.height*d)<.5&&r.width>=w.innerWidth-.5&&r.height>=w.innerHeight-.5&&cv.width<w.innerWidth*d+ev('VS')&&cv.height<w.innerHeight*d+ev('VS'),
      tag+': the canvas is the window in device px ('+cv.width+' x '+cv.height+' for '+w.innerWidth+' x '+w.innerHeight+' at '+d+')');
    ok(ev('CVS')===V.k&&V.h===ev('BVH')&&Math.abs(V.w-ev('BVW'))<=.5&&Math.abs(V.k*V.w-cv.width)<1e-6,tag+': the view is still '+ev('BVH')+' px down, '+V.w.toFixed(1)+' across ('+V.k.toFixed(3)+' device px each)');
    ok(whole(V.w/ev('VW')*V.k)&&Math.round(V.w/ev('VW')*V.k)===ev('VS'),tag+': the HUD on whole device px ('+(V.w/ev('VW')*V.k)+' a HUD px)');
    // ---- the stops: whole numbers in; the farthest the field whole
    const Z=ev('camZooms()'),far=Z[0];
    ok(Z.slice(1).every(z=>whole(z*V.k))&&Z.length>2,tag+': every stop in from the whole field is a whole number of device px a field px ('+Z.map(z=>+(z*V.k).toFixed(3)).join(', ')+')');
    ev('camReset();frame()');ok(ev('B.cam.z')===far&&ev('BW')*far<=V.w+1e-6&&ev('BH')*far<=V.h+1e-6&&(whole(far*V.k)||Math.abs(Math.min(V.w/ev('BW'),V.h/ev('BH'))-far)<1e-9),tag+': the whole field fits at the farthest ('+(far*V.k).toFixed(3)+' device px a field px, the field '+ev('BW')+' x '+ev('BH')+')');
    ok(Math.abs(Z[Z.length-1]*V.k-3*V.k)<=.5+1e-9,tag+': the nearest about today\'s nearest (3 view px a field px: '+Z[Z.length-1]*V.k+')');
    // ---- the wheel: a step glides (between whole numbers on the way) and lands on one, the point under the cursor held
    const at={x:V.w/2,y:V.h/2},q0=ev('toField('+JSON.stringify(at)+')');
    cv.dispatchEvent(new w.WheelEvent('wheel',{deltaY:-100,clientX:r.left+at.x*V.k*r.width/cv.width,clientY:r.top+at.y*V.k*r.height/cv.height,bubbles:true,cancelable:true}));
    ev('B.cam.lt=performance.now()-16;camTick()');const mid=px();settle();const q1=ev('toField('+JSON.stringify(at)+')');
    ok(!whole(mid)&&mid>far*V.k&&whole(px())&&px()>mid&&Math.hypot(q1.x-q0.x,q1.y-q0.y)<.5,tag+': a wheel step glides ('+mid.toFixed(2)+') and lands on '+px()+' device px a field px, the point under the cursor held');
    ev('camZoom(1);');settle();ok(whole(px())&&!ev('B.cam.ease'),tag+': + lands on a whole number too ('+px()+')');
    // ---- a click on a man selects his group; a right-click on the ground sends it to that very spot
    ev("B.sel='all';setOrderUI()");
    const u=ev(`(()=>{const v=camView(),g=playerGroups().find(g=>B.groups[g].role==='inf'),m=grpUnits(g).filter(u=>u.x>v.x+40&&u.x<v.x+v.w-40&&u.y>v.y+60&&u.y<v.y+v.h-60);const u=m[m.length>>1]||grpUnits(g)[0];camCentre(u.x,u.y);frame();return{x:u.x,y:u.y-4,g}})()`);
    const client=p=>{const s=ev('fromField('+JSON.stringify(p)+')'),R=cv.getBoundingClientRect();return{clientX:R.left+s.x*ev('CVS')*R.width/cv.width,clientY:R.top+s.y*ev('CVS')*R.height/cv.height}};
    const press=(p,button)=>{const c=client(p),o={...c,button,buttons:button===2?2:1,pointerType:'mouse',pointerId:1,isPrimary:true,bubbles:true,cancelable:true};cv.dispatchEvent(new w.PointerEvent('pointerdown',o));w.dispatchEvent(new w.PointerEvent('pointerup',{...o,buttons:0}))};
    press(u,0);ok(ev('B.sel')===u.g,tag+': a click on a man of '+u.g+' selects his group ('+JSON.stringify(ev('B.sel'))+')');
    const spot=ev(`(()=>{const v=camView();for(let i=0;i<400;i++){const x=v.x+v.w*(.15+.7*((i*37)%100)/100),y=v.y+v.h*(.2+.6*((i*61)%100)/100);if(y>fieldTop()+4&&y<fieldBot()-4&&!rtsUnitAt(x,y,0)&&!rtsUnitAt(x,y,1)&&!iconAt(x,y)&&!miniHit(fromField({x,y})))return{x:Math.round(x)+.3,y:Math.round(y)+.6}}return null})()`);
    press(spot,2);const mk=ev('B.mark'),gr=ev('(g=>({x:g.ax,y:g.ay}))(B.groups['+JSON.stringify(u.g)+'])');
    ok(mk&&Math.hypot(mk.x-spot.x,mk.y-spot.y)<1e-6&&!mk.foe&&Math.hypot(gr.x-spot.x,gr.y-spot.y)<1e-6,tag+': a right-click on the ground sends it to that spot ('+[spot.x,spot.y].map(v=>v.toFixed(2))+' -> '+(mk?[mk.x,mk.y].map(v=>v.toFixed(2)):'none')+', its place '+[gr.x,gr.y].map(v=>v.toFixed(2))+')');
    // ---- a pinch between the stops; let go, it settles on the nearest
    ev(`(()=>{const T=TOUCH,c=B.cam;T.pts.clear();T.pts.set(1,{x:200,y:200,cx:0,cy:0});T.pts.set(2,{x:300,y:200,cx:0,cy:0});T.pinch={d0:100,z0:c.z,w:toField({x:250,y:200})};
      T.pts.get(2).x=300+100*(Math.round(c.z*CVS)-.4)/(c.z*CVS)-100;touchMove({pointerId:2,clientX:0,clientY:0},T.pts.get(2))})()`);
    const pz=px();ev('touchUp({pointerId:2,clientX:0,clientY:0})');settle();
    ok(!whole(pz)&&whole(px())&&Math.abs(px()-pz)<.5+1e-9&&!ev('TOUCH.pinch'),tag+': a pinch between the stops ('+pz.toFixed(2)+'), let go, settles on the nearest ('+px()+')');ev('TOUCH.pts.clear()');
    // ---- the window resized at a zoom: a whole number still; the field whole when it was
    const W0=f.width,H0=f.height;f.width=Math.round(W0*.83);f.height=Math.round(H0*.91);void w.innerWidth;ev('fitScreen();frame()');const V2=ev('bview()');
    ok(whole(px())&&cv.width===V2.cw&&ev('CVS')===V2.k,tag+': resized ('+w.innerWidth+' x '+w.innerHeight+'): the canvas follows ('+cv.width+' x '+cv.height+') and the zoom is a whole number still ('+px()+')');
    ev('camReset()');f.width=W0;f.height=H0;void w.innerWidth;ev('fitScreen();frame()');ok(ev('B.cam.fit')&&ev('B.cam.z')===ev('camZooms()[0]'),tag+': seen whole, resized back, still whole');
    // ---- less motion: a step at once
    const rm=w.reducedMotion;w.reducedMotion=()=>true;try{ev('camZoom(1)');ok(!ev('B.cam.ease')&&whole(px()),tag+': with less motion a step lands at once ('+px()+')')}finally{w.reducedMotion=rm}
    // ---- the switch off: today's canvas, BVW x BVH, its stops today's
    ev('RENDER.sharpBattle=false;camReset();frame()');
    ok(cv.width===ev('BVW')&&cv.height===ev('BVH')&&ev('CVS')===1&&!ev('bview().sharp')&&JSON.stringify(ev('camZooms()'))===JSON.stringify(ev('[camFit(),...BCAM.zooms.filter(z=>z>camFit()+.01)]'))&&ev('B.cam.z')===ev('camFit()'),tag+': RENDER.sharpBattle off: today\'s canvas ('+cv.width+' x '+cv.height+'), stops and fit');
    press(u,0);ok(ev('B.sel')!=null,tag+': and clicks still land');
    ev('RENDER.sharpBattle=true;camReset();frame();BattleLab.exit()');
  };
  (async()=>{
    try{
      for(const [W,H,dpr,tag] of [[1600,900,1,'desktop 1600 x 900'],[844,390,3,'phone 844 x 390 (density 3, Balanced)']]){const f=await open(W,H,dpr);check(f,tag);f.remove()}
      // (Fast on the phone: the density capped at 1.5, so the canvas about today's)
      const f=await open(844,390,3),w=f.contentWindow;w.eval("RENDER.cap=1.5;fitScreen()");check(f,'phone, Fast');f.remove();
    }catch(e){o.push('EXC '+e.message+' '+e.stack)}
    finish()})();
};
