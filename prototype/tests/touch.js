'use strict';
// Touch: a phone on its side. Real PointerEvents (pointerType 'touch', each finger its own pointerId) on the game canvas:
// a pinch zooms about its middle and a two-finger drag pans, never ordering; a tap selects and a tap again sends, as before;
// a long press sends the selection to the ground or onto an enemy, and dragged on lays the line; a second finger calls a press
// off; on the map a long press opens the action ring (ui/ring.js), whose Look shows what is there in a card, travelling nowhere.
// The mouse's own clicks are as they were.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,P=t.P,random0=Math.random,measure0=t.measureField;
  window.requestAnimationFrame=()=>0;try{localStorage.clear()}catch(e){}
  const cv=document.querySelector('canvas'),TO=t.TOUCH,near=(a,b,e=1)=>Math.abs(a-b)<=e,later=()=>performance.now()+TO.hold+50;
  // (client points: from the field (battle), the canvas's own pixels, or the world map)
  const fromF=(x,y)=>{const p=t.fromField({x,y});return fromC(p.x,p.y)},fromC=(x,y)=>{const r=cv.getBoundingClientRect();return{clientX:r.left+x*r.width/cv.width,clientY:r.top+y*r.height/cv.height}};
  const fromW=(wx,wy)=>fromC(wx-G.cam.x,wy-G.cam.y);
  const fire=(type,c,id=1,kind='touch',button=type==='pointermove'?-1:0,extra={})=>cv.dispatchEvent(new PointerEvent(type,{...c,pointerId:id,isPrimary:id===1,pointerType:kind,button,bubbles:true,cancelable:true,...extra}));
  const tap=(c,id=1)=>{fire('pointerdown',c,id);fire('pointerup',c,id)};
  const calls=[],orig={},methods=['moveTo','attack','queueTo'];
  const fresh=()=>{P.troops={hum_foot:4,hum_bow:3,hum_mage:2,hum_knight:2};P.comps={};P.hp=40;P.morale=60;
    G.mode='world';G.modal=false;G.loot=null;G.enc={kind:'party',ref:{x:P.x+8,y:P.y,cool:0},list:['militia','archer','horse'],allies:[],foes:[]};
    t.BDEPLOY.on=false;t.BAUTO.on=false;t.startBattle({enemies:G.enc.list,tournament:false,deploy:true});
    const B=t.B,anchors={hero:[100,300],inf:[200,180],arc:[200,380],mag:[140,490],cav:[140,90]};
    for(const g of t.playerGroups()){const gr=B.groups[g],[x,y]=anchors[gr.role];gr.placeAt(x,y);t.grpUnits(g).forEach(u=>{u.x=x+(u.sx||0);u.y=y+(u.sy||0)})}
    B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=720;u.y=220+i*80});t.frame();B.icons=[];B.paused=true;B.sel=testGroup('inf');t.setOrderUI();G.msgs=[];calls.length=0;return B};
  let randoms=0,far=null;
  try{
    Math.random=t.seeded(4100);t.act('begin','soldier');G.quietEvents=true;t.W.lords=[];t.GUIDE.on=false;
    window.__touchMeasure=measure0;(0,eval)('measureField=()=>({top:40,bot:560})');
    for(const m of methods){orig[m]=t.BattleControl.prototype[m];t.BattleControl.prototype[m]=function(...a){calls.push([m,this.id]);return orig[m].apply(this,a)}}
    const seeded=t.seeded(4200);Math.random=()=>{randoms++;return seeded()};
    let B=fresh();const inf=()=>B.groups[testGroup('inf')],arc=()=>B.groups[testGroup('arc')];
    // a quick tap: selects, and a tap again sends (as it always did)
    B.sel='all';const u0=t.grpUnits(testGroup('arc'))[0];tap(fromF(u0.x,u0.y-6));ok(B.sel===testGroup('arc')&&!B.box&&!B.rdrag&&!calls.length,'a quick tap selects the group under it, ordering nothing');
    tap(fromF(520,330));ok(arc().ax===520&&arc().ay===330&&calls.some(c=>c[0]==='moveTo'&&c[1]===testGroup('arc')),'a tap again on the ground sends it there');
    // a long press on the ground: the selection moves there
    B=fresh();B.sel=testGroup('arc');let c=fromF(480,420);fire('pointerdown',c);ok(!calls.length&&!B.rdrag,'pressing does nothing yet');
    ok(t.touchTick(later())&&TO.lp.armed&&B.rdrag,'held past '+TO.hold+' ms: the order is armed');let drew=true;try{t.frame()}catch(e){drew=false}ok(drew,'the filling ring draws on the field');
    fire('pointerup',c);ok(arc().ax===480&&arc().ay===420&&!B.rdrag&&!TO.lp&&B.sel===testGroup('arc'),'let go: a long press on the ground moves the selection there ('+arc().ax+','+arc().ay+')');
    // a long press on an enemy: attack it
    B=fresh();const foe=B.units.find(u=>u.team===1&&u.hp>0);c=fromF(foe.x,foe.y-6);fire('pointerdown',c);t.touchTick(later());fire('pointerup',c);
    ok(inf().tgt===foe&&B.mark&&B.mark.foe&&calls.some(x=>x[0]==='attack'),'a long press on an enemy sets the selection on it');
    // a long press, then a drag: the line, as a right-drag lays it
    B=fresh();const a=fromF(400,150),b=fromF(400,400);fire('pointerdown',a);t.touchTick(later());fire('pointermove',fromF(400,280));fire('pointermove',b);
    ok(B.rdrag&&near(B.rdrag.y1,400,.6),'dragging after the press stretches the line ghost');fire('pointerup',b);const line={ax:inf().ax,ay:inf().ay,files:inf().files,face:inf().face};
    B=fresh();fire('pointerdown',a,1,'mouse',2);fire('pointermove',b,1,'mouse',2);window.dispatchEvent(new PointerEvent('pointerup',{...b,pointerType:'mouse',button:2,bubbles:true}));
    const mouse={ax:inf().ax,ay:inf().ay,files:inf().files,face:inf().face};
    ok(line.ax===400&&line.files>1&&JSON.stringify(line)===JSON.stringify(mouse),'long press and drag lays the same line as a right-drag: where, as wide, facing the same ('+JSON.stringify(line)+')');
    // a second finger calls the press off: no order, no line, no selection
    B=fresh();calls.length=0;const ax0=inf().ax,ay0=inf().ay;randoms=0;fire('pointerdown',fromF(520,300),1);fire('pointerdown',fromF(560,300),2);
    ok(!TO.lp&&!t.touchTick(later())&&!B.rdrag&&!B.box,'a second finger cancels a pending long press');fire('pointerup',fromF(520,300),1);fire('pointerup',fromF(560,300),2);
    ok(!calls.length&&inf().ax===ax0&&inf().ay===ay0&&B.sel===testGroup('inf')&&!TO.pts.size,'and lifting both orders and selects nothing');
    // ... and an armed press with its line half-dragged too
    fire('pointerdown',fromF(400,150),1);t.touchTick(later());fire('pointermove',fromF(400,300),1);fire('pointerdown',fromF(600,300),2);ok(!B.rdrag&&!TO.lp,'a second finger after the press is armed drops its line');
    fire('pointerup',fromF(400,300),1);fire('pointerup',fromF(600,300),2);ok(!calls.length,'and nothing is sent');
    // a one-finger drag before the press boxes groups
    B=fresh();B.sel='all';fire('pointerdown',fromF(150,140));fire('pointermove',fromF(200,300));fire('pointermove',fromF(250,410));ok(B.box&&!t.touchTick(later()),'a drag before the press is a box, never a long press');
    fire('pointerup',fromF(250,410));ok(Array.isArray(B.sel)&&B.sel.includes(testGroup('inf'))&&B.sel.includes(testGroup('arc'))&&!calls.length,'the box selects the groups in it');
    // pinch: zoom in and out about the fingers' middle
    B=fresh();t.camReset();const W=cv.width,H=cv.height,mx=W/2,my=H/2,w0=t.toField({x:mx,y:my}),z0=B.cam.z;calls.length=0;randoms=0;const sel0=B.sel;
    fire('pointerdown',fromC(mx-20,my),1);fire('pointerdown',fromC(mx+20,my),2);fire('pointermove',fromC(mx-40,my),1);fire('pointermove',fromC(mx+40,my),2);
    const zIn=B.cam.z,wIn=t.toField({x:mx,y:my});ok(zIn>z0*1.5&&near(wIn.x,w0.x)&&near(wIn.y,w0.y),'spreading two fingers zooms in about their middle ('+z0.toFixed(2)+' to '+zIn.toFixed(2)+')');
    fire('pointermove',fromC(mx-25,my),1);fire('pointermove',fromC(mx+25,my),2);const zOut=B.cam.z,wOut=t.toField({x:mx,y:my});ok(zOut<zIn&&zOut>z0&&near(wOut.x,w0.x)&&near(wOut.y,w0.y),'pinching them back zooms out about it ('+zOut.toFixed(2)+')');
    fire('pointerup',fromC(mx-25,my),1);fire('pointerup',fromC(mx+25,my),2);
    ok(!calls.length&&B.sel===sel0&&!B.box&&!B.rdrag&&!B.mark&&!randoms,'a pinch issues no order or selection, and draws on no chance');
    fire('pointerdown',fromC(mx-60,my),1);fire('pointerdown',fromC(mx+60,my),2);fire('pointermove',fromC(mx-2,my),1);fire('pointermove',fromC(mx+2,my),2);fire('pointerup',fromC(mx-2,my),1);fire('pointerup',fromC(mx+2,my),2);
    ok(near(B.cam.z,t.camFit(),.001)&&B.cam.fit,'fingers brought right together: back to the whole field, no further');
    const z1=B.cam.z;t.camZoom(1);ok(B.cam.z>z1,'the wheel and keys still step from a pinched zoom');
    // two fingers moved together: pan
    t.camReset();t.camZoom(1);t.camZoom(1);t.camZoom(1);t.camCentre(t.BW/2,t.BH/2);const x0=B.cam.x,y0=B.cam.y,z2=B.cam.z;
    fire('pointerdown',fromC(mx-30,my),1);fire('pointerdown',fromC(mx+30,my),2);fire('pointermove',fromC(mx-70,my+20),1);fire('pointermove',fromC(mx-10,my+20),2);
    ok(near(B.cam.z,z2,.001)&&near(B.cam.x,x0+40/z2,.01)&&near(B.cam.y,y0-20/z2,.01),'a two-finger drag pans the view with the fingers ('+(B.cam.x-x0).toFixed(1)+','+(B.cam.y-y0).toFixed(1)+')');
    fire('pointerup',fromC(mx-70,my+20),1);fire('pointermove',fromC(mx+40,my),2);fire('pointerup',fromC(mx+40,my),2);ok(!calls.length&&!B.box&&!TO.pts.size&&!TO.pinch,'the finger left after a pinch does nothing when it moves or lifts');
    // a lift the page never heard of (a finger leaving the window): the next first finger starts afresh, not as a pinch
    B=fresh();B.sel='all';fire('pointerdown',fromF(600,500),5);const u2=t.grpUnits(testGroup('arc'))[0];tap(fromF(u2.x,u2.y-6),1);ok(B.sel===testGroup('arc')&&!TO.pinch&&!TO.pts.size&&!calls.length,'a lost lift does not turn the next tap into a pinch');
    // the mouse, as it was: left-click selects, right-click moves, double right-click runs, right-drag lays the line
    B=fresh();B.sel='all';const u1=t.grpUnits(testGroup('arc'))[0],mc=fromF(u1.x,u1.y-6);
    const mclick=(cc,btn)=>{fire('pointerdown',cc,1,'mouse',btn);window.dispatchEvent(new PointerEvent('pointerup',{...cc,pointerType:'mouse',button:btn,bubbles:true}))};
    mclick(mc,0);ok(B.sel===testGroup('arc'),'mouse: a left-click selects');B.lastRc=null;mclick(fromF(500,300),2);ok(arc().ax===500&&!arc().run,'mouse: a right-click moves at a walk');
    mclick(fromF(500,300),2);ok(arc().run,'mouse: a double right-click runs');fire('pointerdown',fromF(500,300),1,'mouse',0);fire('pointermove',fromF(500,300),1,'mouse',-1);ok(!TO.lp&&!TO.pts.size,'the mouse never starts a touch press');
    window.dispatchEvent(new PointerEvent('pointerup',{...fromF(500,300),pointerType:'mouse',button:0,bubbles:true}));
    // the map: a long press shows the card of what is there, travelling nowhere; the next tap puts it away
    B.paused=false;B.over=true;B.endT=0;for(let i=0;i<3;i++)t.loop((0,eval)('last')+16);if(G.mode!=='world')t.act('cont');
    G.mode='world';G.modal=false;t.hidePanel();G.enc=null;P.tx=null;G.chase=null;t.W.folk=[];t.W.patrols=[];t.W.caravans=[];t.W.refugees=[];t.W.critters=[];
    t.frame();t.drawWorld();far=t.TOWNS.filter(x=>Math.hypot(x.x-P.x,x.y-P.y)>t.REACH+2&&Math.abs(x.x-G.cam.x-t.VW/2)<t.VW/2-20&&Math.abs(x.y-G.cam.y-t.VH/2)<t.VH/2-20).sort((p,q)=>Math.hypot(p.x-P.x,p.y-P.y)-Math.hypot(q.x-P.x,q.y-P.y))[0]||null;
    if(!far)ok(false,'a holding on the screen to press ('+G.mode+' cam '+JSON.stringify(G.cam)+' P '+Math.round(P.x)+','+Math.round(P.y)+' VW '+t.VW+'x'+t.VH+' cv '+cv.width+' towns '+t.TOWNS.map(x=>Math.round(x.x)+','+Math.round(x.y)).join(' ')+')');else{
      const tip=document.getElementById('tip'),wc=fromW(far.x,far.y);ok(t.pickAt(far.x,far.y)===far,'the holding answers where it is pressed');
      fire('pointerdown',wc);ok(P.tx==null&&!G.chase,'pressing the map travels nowhere yet');t.touchTick(later());
      const look=()=>[...document.querySelectorAll('.aring .ar-btn')].find(b=>b.textContent==='Look');ok(!!t.ActionRing.now&&!!look(),'held: the action ring opens, with Look');
      fire('pointermove',wc);fire('pointerup',wc);look().click();
      ok(!tip.hidden&&tip.classList.contains('hold')&&tip.textContent.includes(far.name)&&/Tap:/.test(tip.innerHTML),'its Look: a card says what it is ('+tip.textContent.slice(0,60)+')');
      cv.dispatchEvent(new PointerEvent('pointerleave',{pointerType:'touch',pointerId:1}));t.frame();
      ok(!tip.hidden&&P.tx==null&&!G.chase&&G.mode==='world','let go: the card stays, and you do not travel');
      const away=fromW(P.x+30,P.y+30);tap(away);ok(tip.hidden&&!tip.classList.contains('hold')&&P.tx==null&&!G.chase,'the next tap puts the card away and travels nowhere');
      tap(wc);ok(G.chase===far||P.tx!=null,'a quick tap still travels');P.tx=null;G.chase=null;
      fire('pointerdown',fromW(P.x+40,P.y+10),1);fire('pointerdown',fromW(P.x+60,P.y+10),2);fire('pointerup',fromW(P.x+40,P.y+10),1);fire('pointerup',fromW(P.x+60,P.y+10),2);ok(P.tx==null&&!G.chase&&!TO.pts.size,'two fingers on the map travel nowhere')}
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{
    Math.random=random0;for(const m in orig)t.BattleControl.prototype[m]=orig[m];if(window.__touchMeasure){(0,eval)('measureField=window.__touchMeasure');delete window.__touchMeasure}
  }
  // the real timer: a finger held arms the order on its own
  const end=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  try{if(!far)return end();t.hideTip();P.tx=null;G.chase=null;const wc=fromW(far.x,far.y),tip=document.getElementById('tip');fire('pointerdown',wc);
    setTimeout(()=>{try{ok(!!t.ActionRing.now&&TO.lp&&TO.lp.armed,'a finger simply held: its own timer opens the ring');fire('pointerup',wc);ok(!TO.lp&&!TO.pts.size&&P.tx==null&&!G.chase,'and lifting it travels nowhere');t.ActionRing.close();t.hideTip()}catch(e){o.push('EXC '+e.message)}end()},TO.hold+80)}
  catch(e){o.push('EXC '+e.message);end()}
};
