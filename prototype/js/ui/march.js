'use strict';
/* ---------- march formation: group offsets round the hero, used unchanged when a road battle starts ---------- */
const marchDraftRows=()=>marchRows(P).map(r=>({...r,...G.march?.draft[r.id]}));
const marchDraftOuter=()=>G.march?.radius??marchOuter(P);
// Fit frontage to the fixed allowed radius; changing files must not grow the army circle.
function marchFitRow(row){
  if(marchExtent(row)<=marchDraftOuter())return row;if(FORMS[row.form]?.drag==='fixed')return null;
  let best=null,gap=Infinity;for(let files=1;files<=row.count;files++){const r={...row,files},d=Math.abs(files-(row.files||FORMS[row.form]?.files||1));if(d<gap&&marchExtent(r)<=marchDraftOuter()){best=r;gap=d}}return best;
}
function marchDraftClamp(){for(const row of marchDraftRows()){const r=marchFitRow(row)||marchRows(P).find(r=>r.id===row.id),p=G.march.draft[row.id];Object.assign(p,{form:r.form,files:r.files});const d=Math.hypot(p.x,p.y),limit=Math.max(0,marchDraftOuter()-marchExtent(r));if(d>limit){p.x*=limit/d;p.y*=limit/d}}}
function marchFormFits(row,f){
  if(!row||row.character||!['line','column','loose','wedge'].includes(f))return false;
  const who=FORMS[f]?.who;return (!who||FORM_WHO[who]({s:ST[row.type]}))&&!!marchFitRow({...row,form:f==='column'?'line':f,files:f==='column'?1:FORMS[f].files});
}
function marchFormControls(){
  const row=marchDraftRows().find(r=>r.id===G.march.sel),selected=row?.form==='line'&&row.files===1?'column':row?.form;
  return '<div class="lab">Unit formation</div><div class="btns">'+['line','column','loose','wedge'].map(f=>fbBtn('march-form',f,f==='column'?'Column':FORMS[f].n,marchFormFits(row,f)?'':row?.character?'Individual characters have no troop formation':'Not suited to this troop type',selected===f?'on':'')).join('')+'</div><p class="fb-note">Applied to travel and the starting formation in world battles.</p>';
}
// Sprite size stays in CSS pixels; formation spacing follows the map without shrinking the character art.
const MARCH_PREVIEW={sprite:2,pad:26};
function marchPreviewFigures(row,scale){
  const hero=row.id==='hero',type=hero?'hero':row.character?row.type.replace(/^comp_/,''):row.type,k=MARCH_PREVIEW.sprite;
  const figures=formSlots(row.form,row.count,row.face||0,row.files,WORLD_BATTLE.sprite).map(([sx,sy],i)=>({sx:sx/WORLD_BATTLE.scale*scale,sy:sy/WORLD_BATTLE.scale*scale,s:unitSprite(type,0,hero,i%6,0,false,false,P.look().col)}));
  const left=Math.min(...figures.map(p=>p.sx-p.s.width*k/2)),right=Math.max(...figures.map(p=>p.sx+p.s.width*k/2)),top=Math.min(...figures.map(p=>p.sy-p.s.height*k)),bottom=Math.max(...figures.map(p=>p.sy));
  return{figures,cx:0,cy:0,r:Math.max(Math.abs(left),Math.abs(right),Math.abs(top),Math.abs(bottom))+4};
}
function marchUnitPreview(g,row,x,y,scale){
  const p=marchPreviewFigures(row,scale),k=MARCH_PREVIEW.sprite;g.save();g.imageSmoothingEnabled=false;
  for(const f of p.figures)g.drawImage(f.s,x+f.sx-p.cx-f.s.width*k/2,y+f.sy-p.cy-f.s.height*k,f.s.width*k,f.s.height*k);g.restore();
}
// Ground footprints follow the actual slots; fixed-size artwork does not enlarge the allowed army circle.
function marchGuidePoints(row){
  return convexHull(formSlots(row.form,row.count,row.face||0,row.files,WORLD_BATTLE.sprite).flatMap(([x,y])=>Array.from({length:8},(_,i)=>({x:x/WORLD_BATTLE.scale+3*Math.cos(i*Math.PI/4),y:y/WORLD_BATTLE.scale+3*Math.sin(i*Math.PI/4)}))));
}
function marchRangeShape(row){
  if(!row)return null;const s=(row.id==='hero'?charOf(P):row.character?charOf(compInit(row.id.slice(5)),row.id.slice(5)):troopOf(row.type)).stats();if(!s.range)return null;
  const slots=formSlots(row.form,row.count,0,row.files,WORLD_BATTLE.sprite),lat=slots.map(p=>p[1]/WORLD_BATTLE.scale),half=(Math.max(...lat)-Math.min(...lat))/2;
  return formationRangeShape(row.x,row.y,s.range/WORLD_BATTLE.scale,half,roundFire({s}),row.face||0);
}
function marchCanvasView(){
  if(G.march?.gesture?.view)return G.march.gesture.view;
  const cv=document.getElementById('marchCanvas'),box=cv.getBoundingClientRect(),w=box.width,h=box.height;
  const extent=G.march.viewRadius;
  return{w,h,x:w/2,y:h/2,scale:(Math.min(w,h)/2-MARCH_PREVIEW.pad)/Math.max(marchDraftOuter()+WORLD_BATTLE.interaction,extent)};
}
function openMarch(){
  if(G.mode!=='char')return;const draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y,face:r.face||0,form:r.form,files:r.files}]));G.march={draft,radius:marchOuter(P),sel:marchRows(P).find(r=>r.id!=='hero')?.id||'hero'};G.march.viewRadius=Math.max(marchDraftOuter()+WORLD_BATTLE.interaction,marchDraftOuter()+Math.max(0,...marchDraftRows().map(r=>{const reach=marchRangeShape(r);return reach?reach.range+reach.half:0})));renderMarch();
}
function renderMarch(){
  const s=G.march;if(!s)return;const ids=marchRows(P).map(r=>r.id);
  fbShow('March formation','Hero anchors your army','',
    '<div class="march-layout"><div><canvas id="marchCanvas" width="880" height="640" aria-label="Drag a group inside the outer formation ring"></canvas><p class="fb-note">Inner: core · Outer: free placement · Outermost: interaction only. Drag groups, or choose a group and use the arrows. Front faces your travel direction. Right-drag a line to set the selected group frontage and facing; on touch, choose Draw formation first. The army circle stays fixed; frontage is fitted inside it. Arrows show each group facing. Dashed unit outlines guide formation placement; blue shows base attack range for the selected group (terrain can modify it).</p></div><div><div class="btns">'+ids.map(id=>fbBtn('march-select',id,htmlText(marchNumbers(P)[id]+' · '+armyGroupLabel(id)),id==='hero'?'Your hero is the fixed anchor':'',s.sel===id?'on':'')).join('')+'</div><p id="marchLabel"></p>'+fbBtn('march-tool','move','Move groups','',s.tool!=='form'?'on':'')+fbBtn('march-tool','form','Draw formation',s.sel==='hero'?'Select a troop group first':'',s.tool==='form'?'on':'')+marchFormControls()+'<div class="btns">'+[['up','↑'],['left','←'],['right','→'],['down','↓']].map(([k,n])=>fbBtn('march-step',k,n,s.sel==='hero'?'The hero stays at the centre':'')).join('')+'</div>'+fbBtn('march-reset',null,'Reset formation')+'</div></div>',
    ['march-back',null,'Back'],['march-apply',null,'Apply formation'],'fb-march');
  const cv=document.getElementById('marchCanvas'),point=e=>{const v=s.gesture?.view||marchCanvasView(),r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*v.w/r.width,y:(e.clientY-r.top)*v.h/r.height}},put=e=>{
    const d=s.gesture;if(!d||d.id!==e.pointerId)return;const p=point(e),v=d.view,world={x:(p.x-v.x)/v.scale,y:(p.y-v.y)/v.scale};
    if(d.form){d.end=p;if(Math.hypot(p.x-d.start.x,p.y-d.start.y)<6)return;const row=marchDraftRows().find(r=>r.id===s.sel),dx=p.x-d.start.x,dy=p.y-d.start.y;
      Object.assign(s.draft[s.sel],{x:((p.x+d.start.x)/2-v.x)/v.scale,y:((p.y+d.start.y)/2-v.y)/v.scale,face:Math.atan2(-dx,dy),files:dragFiles(row.form,row.count,Math.hypot(dx,dy)/v.scale*WORLD_BATTLE.scale,WORLD_BATTLE.sprite)});
    }else Object.assign(s.draft[s.sel],world);marchDraftClamp();drawMarch();
  };
  cv.oncontextmenu=e=>e.preventDefault();
  cv.onpointerdown=e=>{if(s.gesture||e.button!==0&&e.button!==2)return;const v=marchCanvasView(),p=point(e),form=e.button===2||s.tool==='form';
    if(form){if(s.sel==='hero')return}else{const id=ids.filter(id=>id!=='hero').sort((a,b)=>Math.hypot(p.x-v.x-s.draft[a].x*v.scale,p.y-v.y-s.draft[a].y*v.scale)-Math.hypot(p.x-v.x-s.draft[b].x*v.scale,p.y-v.y-s.draft[b].y*v.scale))[0];if(!id||Math.hypot(p.x-v.x-s.draft[id].x*v.scale,p.y-v.y-s.draft[id].y*v.scale)>Math.max(22,marchPreviewFigures(marchDraftRows().find(r=>r.id===id),v.scale).r))return;s.sel=id}
    e.preventDefault();s.gesture={id:e.pointerId,form,start:p,end:p,view:v,before:structuredClone(s.draft)};cv.setPointerCapture(e.pointerId);if(!form)put(e);
  };
  cv.onpointermove=put;cv.onpointerup=e=>{if(s.gesture?.id!==e.pointerId)return;put(e);s.gesture=null;renderMarch()};
  cv.onpointercancel=e=>{if(s.gesture?.id!==e.pointerId)return;s.draft=s.gesture.before;s.gesture=null;renderMarch()};G.marchResize?.disconnect();G.marchResize=new ResizeObserver(()=>{if(G.march&&document.getElementById('marchCanvas')===cv)drawMarch();else G.marchResize?.disconnect()});G.marchResize.observe(cv);drawMarch();
}
// Facing arrow sits just beyond the ground footprint, with a fixed-size head readable on touch screens.
function marchFacingGuide(g,row,x,y,scale){
  const a=row.face||0,c=Math.cos(a),s=Math.sin(a),r=marchExtent(row)*scale+6,sx=x+c*r,sy=y+s*r,ex=sx+c*24,ey=sy+s*24;
  g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.moveTo(ex-c*8-s*5,ey-s*8+c*5);g.lineTo(ex,ey);g.lineTo(ex-c*8+s*5,ey-s*8-c*5);g.stroke();
}
function drawMarch(){
  const s=G.march,cv=document.getElementById('marchCanvas');if(!s||!cv)return;const v=marchCanvasView(),scale=v.scale,g=cv.getContext('2d'),dpr=window.devicePixelRatio||1;
  cv.width=Math.round(v.w*dpr);cv.height=Math.round(v.h*dpr);g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#211c18';g.fillRect(0,0,v.w,v.h);g.font='12px Arial';g.textAlign='center';
  for(const [r,col,dash] of [[marchDraftOuter()+WORLD_BATTLE.interaction,'#756447',[4,4]],[marchDraftOuter(),'#c9a551',[]],[marchCore(P),'#796943',[]]]){g.strokeStyle=col;g.setLineDash(dash);g.beginPath();g.arc(v.x,v.y,r*scale,0,Math.PI*2);g.stroke()}g.setLineDash([]);g.fillStyle='#cfba85';g.fillText('FRONT →',v.w-48,v.y);
  const drag=s.gesture;if(drag?.form){g.strokeStyle='#ffe09a';g.lineWidth=2;g.beginPath();g.moveTo(drag.start.x,drag.start.y);g.lineTo(drag.end.x,drag.end.y);g.stroke();g.lineWidth=1}
  const reach=marchRangeShape(marchDraftRows().find(r=>r.id===s.sel));
  if(reach){g.save();g.translate(v.x,v.y);g.scale(scale,scale);g.beginPath();if(reach.circle)g.arc(reach.ax,reach.ay,reach.range,0,Math.PI*2);else{reach.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath()}g.fillStyle='rgba(120,190,255,.09)';g.strokeStyle='#78beff';g.lineWidth=1.5/scale;g.fill();g.stroke();g.restore()}
  for(const row of marchDraftRows()){const x=v.x+row.x*scale,y=v.y+row.y*scale,points=marchGuidePoints(row);g.strokeStyle=row.id===s.sel?'#ffe09a':'#97804c';g.setLineDash([3,3]);g.beginPath();points.forEach((p,i)=>i?g.lineTo(x+p.x*scale,y+p.y*scale):g.moveTo(x+p.x*scale,y+p.y*scale));g.closePath();g.stroke();g.setLineDash([]);g.lineWidth=row.id===s.sel?2:1.5;marchFacingGuide(g,row,x,y,scale);g.lineWidth=1}g.setLineDash([]);
  for(const row of marchDraftRows()){const p=s.draft[row.id],x=v.x+p.x*scale,y=v.y+p.y*scale,r=Math.max(marchExtent(row)*scale,marchPreviewFigures(row,scale).r);marchUnitPreview(g,row,x,y,scale);g.fillStyle='#211c18';g.fillRect(x-9,y-r-7,18,15);g.fillStyle='#eee0bc';g.fillText(String(marchNumbers(P)[row.id]),x,y-r+5)}
  const label=document.getElementById('marchLabel');if(label)label.textContent=armyGroupLabel(s.sel)+' · '+Math.round(s.draft[s.sel].x*10)/10+', '+Math.round(s.draft[s.sel].y*10)/10;
}
onAct('march-',(a,arg)=>{
  if(a==='march-open')return openMarch();const s=G.march;if(!s||G.mode!=='char')return;
  if(a==='march-apply'){marchDraftClamp();P.army.march=Object.fromEntries(Object.entries(s.draft).map(([id,p])=>[id,{x:p.x,y:p.y,face:p.face||0}]));for(const g of partyRoster(P).groups){const p=s.draft[g.id];if(p){g.form=p.form;g.files=p.files}}G.marchResize?.disconnect();G.march=null;renderChar();return}
  if(a==='march-tool'){s.tool=arg==='form'?'form':'move';renderMarch();return}
  if(a==='march-form'){const row=marchDraftRows().find(r=>r.id===s.sel);if(!marchFormFits(row,arg))return;Object.assign(s.draft[s.sel],{form:arg==='column'?'line':arg,files:arg==='column'?1:arg==='wedge'?null:FORMS[arg].files});marchDraftClamp();renderMarch();return}
  if(a==='march-back'){G.marchResize?.disconnect();G.march=null;renderChar();return}
  if(a==='march-select'&&s.draft[arg]){s.sel=arg;renderMarch();return}
  if(a==='march-reset'){const old=P.army.march;delete P.army.march;s.draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y,face:r.face||0,form:r.form,files:r.files}]));if(old)P.army.march=old;marchDraftClamp();renderMarch();return}
  if(a==='march-step'&&s.sel!=='hero'){const p=s.draft[s.sel],d={up:[0,-2],down:[0,2],left:[-2,0],right:[2,0]}[arg];if(!d)return;const row=marchDraftRows().find(r=>r.id===s.sel),limit=marchDraftOuter()-marchExtent(row),x=p.x+d[0],y=p.y+d[1],l=Math.hypot(x,y),k=l>limit?limit/l:1;p.x=x*k;p.y=y*k;drawMarch()}
});
