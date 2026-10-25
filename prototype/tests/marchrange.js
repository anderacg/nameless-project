'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.WORLD_BATTLE.on=true;t.GUIDE.on=false;
 P.troops={hum_bow:10,hum_knight:4};G.mode='char';t.openMarch();const arch=t.partyRoster(P).groups.find(g=>g.type==='hum_bow');
 t.act('march-select',arch.id);const row=()=>t.marchDraftRows().find(r=>r.id===arch.id);
 for(const form of ['line','column','loose']){t.act('march-form',form);const r=row();G.march.draft[r.id].x=999;G.march.draft[r.id].y=999;t.marchDraftClamp();
  const q=row(),points=t.marchGuidePoints(q);ok(points.length>=4&&points.every(p=>Math.hypot(q.x+p.x,q.y+p.y)<=t.marchDraftOuter()+.001),form+' guide fits entirely inside the army placement circle');
 }
 const view=t.marchCanvasView(),r=row(),p=t.marchPreviewFigures(r,view.scale),slots=t.formSlots(r.form,r.count,0,r.files,t.WORLD_BATTLE.sprite);
 ok(p.figures.every((f,i)=>Number.isFinite(f.sx)&&Number.isFinite(f.sy)&&Math.abs(f.sx-slots[i][0]/t.WORLD_BATTLE.scale*view.scale)<.001&&Math.abs(f.sy-slots[i][1]/t.WORLD_BATTLE.scale*view.scale)<.001),'preview figures stay on their actual formation slots with fixed sprite size');
 const reach=t.marchRangeShape(r);ok(reach&&!reach.circle&&Math.abs(reach.range-t.ST.hum_bow.range/t.WORLD_BATTLE.scale)<.001,'archer preview uses its real base range and forward firing arc');
 ok(t.marchRangeShape(t.marchDraftRows().find(r=>r.type==='hum_knight'))===null,'melee-only groups have no ranged attack overlay');
 const cv=document.getElementById('marchCanvas'),ctx=cv.getContext('2d'),arc=ctx.arc,arcs=[];try{ctx.arc=function(...a){arcs.push(a);return arc.apply(this,a)};t.drawMarch()}finally{ctx.arc=arc}
 ok(arcs.length===3,'unit guides follow formation footprints instead of adding filled unit circles');
 G.march.draft[arch.id].x=999;t.act('march-apply');t.openMarch();ok(t.marchGuidePoints(row()).every(p=>Math.hypot(row().x+p.x,row().y+p.y)<=t.marchDraftOuter()+.001),'Apply validates formation bounds before saving');t.act('march-back');
 Kit.world();const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);const e=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,id=Object.keys(b.groups).find(id=>b.groups[id].sourceGroupId===arch.id),gr=b.groups[id];gr.currentFacing=gr.face=0;t.layForm(id);b.sel=id;b.hov=null;
 const native=t.VS,c=t.ctx;try{window.eval('VS=3');const shape=t.formationReachGeometry(id);b.cam.x=shape.ax-100;b.cam.y=shape.ay-100;
  const v=t.rangeView();ok(Math.abs(v.z-b.cam.z*3)<.001,'range layer includes native world-map scale');
  c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);c.scale(3*b.cam.z,3*b.cam.z);c.translate(-b.cam.x,-b.cam.y);t.drawFireRange();c.restore();
  const x=shape.ax+shape.range*.4,y=shape.ay,px=Math.round((x-b.cam.x)*v.z),py=Math.round((y-b.cam.y)*v.z);
  ok(c.getImageData(px,py,1,1).data[3]>0,'selected ranged formation paints its attack area at the correct world screen position');
 }finally{window.eval('VS='+native)}
});
