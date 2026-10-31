'use strict';
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;P.troops={hum_bow:10,hum_knight:6};G.mode='char';t.openMarch();
 const roster=t.partyRoster(P),arch=roster.groups.find(g=>g.type==='hum_bow'),cav=roster.groups.find(g=>g.type==='hum_knight');t.act('march-select',arch.id);
 const fixedRadius=t.marchDraftOuter(),fixedScale=t.marchCanvasView().scale;
 const drag=(x0,y0,x1,y1,{touch=false,cancel=false,short=false}={})=>{const cv=document.getElementById('marchCanvas'),v=t.marchCanvasView(),r=cv.getBoundingClientRect(),capture=cv.setPointerCapture;cv.setPointerCapture=()=>{};
  const fire=(type,x,y)=>cv.dispatchEvent(new PointerEvent(type,{pointerId:7,pointerType:touch?'touch':'mouse',button:touch?0:2,buttons:touch?1:2,clientX:r.left+(v.x+x*v.scale)*r.width/v.w,clientY:r.top+(v.y+y*v.scale)*r.height/v.h,bubbles:true,cancelable:true}));
  try{fire('pointerdown',x0,y0);fire('pointermove',x1,y1);fire(cancel?'pointercancel':'pointerup',x1,y1)}finally{cv.setPointerCapture=capture}
 };
 drag(0,-10,0,10);let d=G.march.draft[arch.id];
 ok(d.files===4&&Math.abs(d.face)<.001&&Math.hypot(d.x,d.y)<.001,'right-drag sets frontage, midpoint and battle-style facing in world units');
 const saved=JSON.stringify(G.march.draft);drag(-10,0,10,0,{cancel:true});ok(JSON.stringify(G.march.draft)===saved,'pointer cancellation restores the complete draft');
 drag(0,0,.1,.1);ok(JSON.stringify(G.march.draft)===saved,'a short right-click does not change the formation');
 t.act('march-tool','form');drag(-10,0,10,0,{touch:true});d=G.march.draft[arch.id];ok(Math.abs(d.face+Math.PI/2)<.001&&d.files===4,'touch Draw formation uses the same frontage and facing');
 drag(100,100,120,100,{touch:true});ok(t.marchDraftRows().every(row=>t.marchFoot(row,row.x,row.y)<=t.marchDraftOuter()+.001),'drawn formations stay fully inside the allowed army circle (every man of them)');
 {const s=G.march,id=t.marchDraftRows().find(r=>!r.character)?.id;if(id){s.sel=id;Object.assign(s.draft[id],{x:0,y:0,face:0,form:'line',files:null});const row=()=>t.marchDraftRows().find(r=>r.id===id),R=t.marchDraftOuter();for(let i=0;i<80;i++)t.act('march-step','right');const r=row(),old=R-t.marchExtent(r);
  ok(t.marchFoot(r,r.x,r.y)<=R+.001&&r.x>old+1,'a line facing east steps out east till its men reach the ring ('+r.x.toFixed(1)+' px; a circle its width wide stopped it at '+old.toFixed(1)+')')}}
 ok(t.marchDraftOuter()===fixedRadius&&Math.abs(t.marchCanvasView().scale-fixedScale)<.001,'army circle radius and displayed scale remain fixed after frontage drags');
 t.act('march-select',arch.id);drag(-100,0,100,0,{touch:true});
 ok(t.marchDraftOuter()===fixedRadius&&t.marchExtent(t.marchDraftRows().find(r=>r.id===arch.id))<=fixedRadius&&Math.abs(t.marchCanvasView().scale-fixedScale)<.001,'an oversized frontage fits the allowed circle instead of enlarging or reframing it');
 for(const face of [0,Math.PI/2,-Math.PI/2,Math.PI]){const lines=[],moves=[],g={beginPath(){},moveTo(x,y){moves.push([x,y])},lineTo(x,y){lines.push([x,y])},stroke(){}};
  t.marchFacingGuide(g,{...t.marchDraftRows().find(r=>r.id===arch.id),face},100,100,2);const dx=lines[0][0]-moves[0][0],dy=lines[0][1]-moves[0][1];
  ok(Math.abs(dx*Math.sin(face)-dy*Math.cos(face))<.001&&dx*Math.cos(face)+dy*Math.sin(face)>0&&lines.length===3,'facing guide paints a forward arrow with a head at angle '+face);
 }
 t.act('march-select',cav.id);t.act('march-form','wedge');drag(0,-20,0,20,{touch:true});ok(G.march.draft[cav.id].form==='wedge'&&G.march.draft[cav.id].files>=1,'dragging a wedge keeps it a wedge, the drag its width at the back (the owner, 2026-10-31: right-drag "seems to support only lines"): '+G.march.draft[cav.id].files+' wide');
 {const S=t.formSlots('wedge',10,0,3),rows=new Set(S.map(p=>Math.round(p[0])));ok(Math.max(...[...rows].map(x=>S.filter(p=>Math.round(p[0])===x).length))===3&&S.length===10,'a wedge 3 wide: its point, then ranks of 2 and 3, the rest 3 abreast')}
 ok(t.dragFiles('wedge',12,60,1)>1&&t.dragFiles('pack',12,60,1)>1&&t.dragFiles('loose',12,60,1)>1&&t.dragFiles('line',12,60,1)>1&&t.dragFiles('column',12,60,1)<t.dragFiles('line',12,60,1),'in battle too, a drag sets the width of a wedge, a pack, loose order and a line; a column\'s, fewer columns than a line\'s files, deeper');
 {t.act('march-form','column');drag(0,-40,0,40,{touch:true});const c=G.march.draft[cav.id];ok(c.form==='column'&&c.files>=1,'a column dragged stays a column: '+c.files+' column(s) side by side, the men behind (the owner: "column will prioritize unit to the back")');
  t.act('march-form','line');drag(0,-40,0,40,{touch:true});const l=G.march.draft[cav.id];ok(l.form==='line'&&l.files>1,'and back to a line, a drag widens it again ('+l.files+' abreast)')}
 {const S=t.formSlots('column',12,0,2),xs=[...new Set(S.map(p=>Math.round(p[1])))].sort((a,b)=>a-b),gaps=xs.slice(1).map((x,i)=>x-xs[i]);
  ok(xs.length===4&&gaps.some(g=>g>t.FORMS.column.gx*1.5)&&new Set(S.map(p=>Math.round(p[0]))).size===3,'two columns of 12: two men abreast each, a gap between them, three ranks deep')}
 t.act('march-select','hero');const hero=JSON.stringify(G.march.draft.hero);drag(-10,0,10,0,{touch:true});ok(JSON.stringify(G.march.draft.hero)===hero,'the hero remains the fixed army anchor');
 t.act('march-select',arch.id);drag(-10,0,10,0,{touch:true});t.act('march-apply');const row=t.marchRows(P).find(r=>r.id===arch.id);ok(Math.abs(row.face+Math.PI/2)<.001&&row.files===4,'Apply persists facing and frontage into marching rows');
 const army=t.MarchArmy.of(P);army.sync();const targets=army.targets().filter(p=>p.row===arch.id),first=targets[0],second=targets[1];ok(Math.abs(first.x-second.x)>Math.abs(first.y-second.y)*5,'marching slots rotate with the saved relative facing');
 t.openMarch();ok(Math.abs(G.march.draft[arch.id].face+Math.PI/2)<.001,'reopening the editor retains saved facing');t.act('march-back');Kit.world();
 const h=Kit.goHome('Ashford');Kit.goTo(h.x+160,h.y+120);const e=t.asParty({kind:'bandits',troops:['militia'],x:P.x+70,y:P.y,cool:0});G.enc={kind:'party',ref:e,list:e.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});
 const b=t.B,g=Object.values(b.groups).find(g=>g.player&&g.sourceGroupId===arch.id);const mine=b.muster.armies.find(a=>a.owner===P);// (the armies form up facing each other first: c0ba7c6)
 ok(g.files===4&&t.angGap(g.face,mine.anchor.facing+row.face)<.001,'world battle preserves dragged frontage and facing relative to the marching army');
});
