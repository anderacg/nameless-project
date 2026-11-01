'use strict';
// The March formation tab's two previews (ui/march.js; the owner, 2026-11-01): "previews in march formation not showing flag": each
// fits group's share of men fly your banner as on the map (gfx/marchgear.js: a fifth, one at least; a spearman's on his spear, his body
// bare; anyone else's at his back), in the Field preview and the By road column alike, none with MARCH_GEAR.flags off; and "by road
// and in field they face different direction": both now face right, unflipped, the column's head on the right; desktop and phone.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,M=t.MARCH_GEAR,flags0=M.flags,scr=document.getElementById('screen'),original=scr.style.cssText,C2=CanvasRenderingContext2D.prototype,img0=C2.drawImage,scale0=C2.scale;
 try{
  Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:99});t.GUIDE.on=false;t.WORLD_BATTLE.on=true;
  P.troops={hum_pike:15,hum_bow:10};delete P.army.column;delete P.army.march;
  const open=view=>{Kit.world({encCool:99});t.openChar();t.act('char-tab','march');t.act('march-view',view);t.marchBind()};
  // (the flag pictures one draw puts down, by kind: pole (on a spear) and back; and whether anything was drawn mirrored)
  const watch=draw=>{const got=[];let flipped=0;C2.drawImage=function(s,...a){got.push(s);return img0.call(this,s,...a)};C2.scale=function(x,y){if(x<0)flipped++;return scale0.call(this,x,y)};
   try{draw()}finally{C2.drawImage=img0;C2.scale=scale0}const kind=new Map([...t.MARCH_FLAGS].map(([k,c])=>[c,k.slice(0,2)]));
   return{pole:got.filter(c=>kind.get(c)==='fp').length,back:got.filter(c=>kind.get(c)==='fb').length,flipped}};
  const rows=t.marchRows(P),pike=rows.filter(r=>r.type==='hum_pike'),bow=rows.filter(r=>r.type==='hum_bow');
  info('rows: '+rows.map(r=>r.id+' '+r.type+' ×'+r.count).join(', '));
  const want={pole:pike.reduce((a,r)=>a+t.gearShare(r.count,M.flag),0),back:bow.reduce((a,r)=>a+t.gearShare(r.count,M.flag),0)};
  ok(pike.length===1&&pike[0].count===15&&bow.length===1&&bow[0].count===10&&want.pole===3&&want.back===2,'a group of 15 pikes and one of 10 bows: 3 and 2 flags (a fifth, MARCH_GEAR.flag)');
  ok(t.POLE(t.lookOf('hum_pike',0,false,0).weapon)&&!t.POLE(t.lookOf('hum_bow',0,false,0).weapon)&&!t.marchFlagMen(rows.find(r=>r.id==='hero')).size,'pikes carry theirs on the spear, bows at the back; your hero none');
  for(const [w,h] of [[1280,800],[844,390]]){scr.style.cssText=original+';width:'+w+'px;height:'+h+'px';const at=w+' × '+h;
   // ---- the Field preview
   open('field');{const f=watch(()=>t.drawMarch());ok(f.pole===want.pole&&f.back===want.back,at+' Field: '+f.pole+' pole flags, '+f.back+' back flags');
    ok(!f.flipped,at+' Field: every man drawn facing right, unflipped');
    M.flags=false;const n=watch(()=>t.drawMarch());M.flags=flags0;ok(!n.pole&&!n.back,at+' Field: no flag with MARCH_GEAR.flags off')}
   // ---- the By road column
   open('column');{const ed=G.column,f=watch(()=>ed.draw());ok(f.pole===want.pole&&f.back===want.back,at+' By road: '+f.pole+' pole flags, '+f.back+' back flags');
    ok(!f.flipped,at+' By road: every man drawn facing right, unflipped, as the Field view');
    const L=ed.layout(),ids=ed.ids(),head=ed.xAt(L.span[ids[0]].c),tail=ed.xAt(L.span[ids[ids.length-1]].c);
    ok(head>tail&&head>ed.v.w/2&&tail<ed.v.w/2,at+' By road: its head on the right ('+Math.round(head)+' px), its tail on the left ('+Math.round(tail)+' px)');
    M.flags=false;const n=watch(()=>ed.draw());M.flags=flags0;ok(!n.pole&&!n.back,at+' By road: no flag with MARCH_GEAR.flags off')}}
  // ---- drag and drop, mirrored: the head dragged to the left goes to the rear; the first in the order is still the head
  scr.style.cssText=original;open('column');
  {const ed=G.column,cv=document.getElementById('columnCanvas'),ids=ed.ids(),xOf=id=>ed.xAt(ed.layout().span[id].c),y=ed.v.y0-3*ed.v.scale,cap=window.HTMLElement.prototype.setPointerCapture;
   const fire=(type,x)=>cv.dispatchEvent(new PointerEvent(type,{pointerId:4,pointerType:'mouse',button:0,buttons:type==='pointerup'?0:1,clientX:cv.getBoundingClientRect().left+x,clientY:cv.getBoundingClientRect().top+y,bubbles:true,cancelable:true}));
   window.HTMLElement.prototype.setPointerCapture=function(){};try{const x0=xOf(ids[0]),x1=xOf(ids[ids.length-1])-20;fire('pointerdown',x0);fire('pointermove',x0-10);fire('pointermove',x1);fire('pointerup',x1)}finally{window.HTMLElement.prototype.setPointerCapture=cap}
   ok(G.column.ids().join()===[...ids.slice(1),ids[0]].join(),'the head dragged left, past the tail, goes to the rear: '+G.column.ids().join(', '));
   t.act('march-col-apply');ok(P.army.column[0]===ids[1]&&G.column.ids()[0]===ids[1]&&G.column.xAt(G.column.layout().span[ids[1]].c)>G.column.v.w/2,'applied: the first saved (P.army.column) is the head, drawn on the right')}
  ok(!ERR.length,'no runtime errors');
 }finally{M.flags=flags0;C2.drawImage=img0;C2.scale=scale0;scr.style.cssText=original}
});
