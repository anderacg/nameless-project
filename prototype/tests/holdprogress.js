'use strict';
// Real map presses: visible progress without changing click/hold actions; cancellation must leave no pending menu.
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T,R=t.RING,TO=t.TOUCH,cv=t.cv,ctx=t.ctx,wait=ms=>new Promise(r=>setTimeout(r,ms));
 const fire=(type,p,kind='mouse',id=1)=>(type==='pointerdown'||type==='pointermove'||type==='pointerleave'?cv:window).dispatchEvent(new PointerEvent(type,{...p,pointerType:kind,pointerId:id,isPrimary:id===1,button:type==='pointermove'?-1:0,bubbles:true}));
 const reset=()=>{t.ringDrop();t.touchDrop();TO.pts.clear();TO.spent.clear();TO.pinch=null;t.ActionRing.close();t.hideTip();t.G.mode='world';t.G.modal=false;t.P.tx=null;t.P.ty=null;t.G.chase=null};
 let arcs=[],strokes=[],arc=ctx.arc,stroke=ctx.stroke,css='';
 try{
  Kit.begin('soldier',23);Kit.clear();Kit.world();t.frame();const scr=document.getElementById('screen');css=scr.style.cssText;
  const point=()=>{const r=cv.getBoundingClientRect();return{clientX:r.left+r.width*.4,clientY:r.top+r.height*.55}},same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),matrix=()=>[...Object.values(ctx.getTransform().toJSON())];
  ctx.arc=function(...a){arcs.push(a);return arc.apply(this,a)};ctx.stroke=function(...a){strokes.push({color:this.strokeStyle,matrix:this.getTransform(),width:this.lineWidth});return stroke.apply(this,a)};
  reset();let p=point();fire('pointerdown',p);const start=R.press.t0,press=R.press,tx=t.P.tx;
  ok(Number.isFinite(start)&&!t.drawMapHold(start+40)&&!arcs.length,'a quick click has no loading flash');
  const before=matrix();ok(t.drawMapHold(start+R.hold/2),'the mouse hold draws halfway through its real threshold');
  const half=arcs.at(-1),right={x:half[0]+half[2],y:half[1]},left={x:half[0]-half[2],y:half[1]},m=strokes.at(-1).matrix,pixel=p=>[...ctx.getImageData(Math.round(p.x*m.a),Math.round(p.y*m.d),1,1).data],gold=p=>p[0]>170&&p[1]>100&&p[2]<130;
  ok(Math.abs(half[4]-half[3]-Math.PI)<.001&&gold(pixel(right))&&!gold(pixel(left)),'the actual circle fills clockwise: halfway has a gold right side and a faint left track');
  ok(same(before,matrix())&&R.press===press&&t.P.tx===tx&&!t.ActionRing.now,'drawing restores the canvas state and triggers no travel or action');
  t.drawMapHold(start+R.hold*.8);ok(arcs.at(-1)[4]>half[4],'the arc advances as the hold timer progresses');
  fire('pointerup',p);ok(!R.press&&!t.drawMapHold()&&t.P.tx!=null,'releasing early removes progress and retains the normal click action');
  reset();p=point();fire('pointerdown',p);fire('pointermove',{clientX:p.clientX+R.slop+5,clientY:p.clientY});ok(R.press.off&&!t.drawMapHold(R.press.t0+200),'wandering cancels the progress before opening');fire('pointerup',p);
  reset();fire('pointerdown',p);fire('pointercancel',p);ok(!R.press&&!t.drawMapHold()&&t.P.tx==null,'mouse pointer cancellation removes the pending hold without travel');
  reset();fire('pointerdown',p);fire('pointerleave',p);ok(!R.press&&!t.drawMapHold(),'leaving the canvas cancels the pending mouse hold');
  reset();fire('pointerdown',p);window.dispatchEvent(new Event('blur'));ok(!R.press&&!t.drawMapHold(),'switching away clears mouse hold progress and its timer');
  reset();fire('pointerdown',p);t.G.modal=true;ok(!t.drawMapHold(R.press.t0+200),'a window suppresses the map indicator');t.G.modal=false;t.G.mode='esc';ok(!t.drawMapHold(R.press.t0+200),'another game mode suppresses the map indicator');
  reset();fire('pointerdown',p,'touch');const lp=TO.lp;arcs=[];ok(lp&&t.drawMapHold(lp.t0+R.hold/2)&&arcs.at(-1)[2]===TO.ring,'a finger uses the same progress with a circle wide enough to see around it');
  fire('pointermove',{clientX:p.clientX+TO.slop+5,clientY:p.clientY},'touch');ok(TO.lp.off&&!t.drawMapHold(lp.t0+250),'a wandering finger cancels its progress');fire('pointercancel',p,'touch');
  reset();fire('pointerdown',p,'touch');fire('pointerdown',{clientX:p.clientX+60,clientY:p.clientY},'touch',2);ok(!TO.lp&&!t.drawMapHold(),'a second finger replaces hold progress with the existing pinch gesture');
  reset();fire('pointerdown',p,'touch');window.dispatchEvent(new Event('blur'));ok(!TO.lp&&!TO.pts.size&&!TO.pinch&&!t.drawMapHold(),'switching away clears touch hold progress and gesture state');
  for(const [w,h] of [[1280,800],[844,390],[390,844]]){reset();scr.style.width=w+'px';scr.style.height=h+'px';p=point();fire('pointerdown',p);arcs=[];strokes=[];t.drawMapHold(R.press.t0+175);const a=arcs.at(-1),m=strokes.at(-1).matrix,r=cv.getBoundingClientRect();
   ok(a[2]===R.progress.r&&Math.abs(m.a-cv.width/r.width)<.001&&Math.abs(m.d-cv.height/r.height)<.001,'circle radius and line width stay in CSS pixels at '+w+'x'+h)}
  reset();scr.style.cssText=css;p=point();fire('pointerdown',p);let calls=0;const draw=t.drawMapHold;window.drawMapHold=function(...a){calls++;return draw(...a)};try{t.frame()}finally{window.drawMapHold=draw}ok(calls===1,'the normal frame draws hold progress over the map');
  await wait(R.hold+60);ok(!!t.ActionRing.now&&!R.press&&!t.drawMapHold()&&t.P.tx==null,'a completed hold replaces progress with the real action menu, travelling nowhere');
 }catch(e){exc(e)}finally{reset();ctx.arc=arc;ctx.stroke=stroke;if(css)document.getElementById('screen').style.cssText=css}out();
};
