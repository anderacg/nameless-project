'use strict';
/* ---------- march formation: group offsets round the hero, used unchanged when a road battle starts ---------- */
const marchDraftRows=()=>marchRows(P).map(r=>({...r,...G.march?.draft[r.id]}));
const marchDraftOuter=()=>Math.max(WORLD_BATTLE.outer,marchCore(P)+4+Math.max(0,...marchDraftRows().map(marchExtent)));
function marchDraftClamp(){for(const r of marchDraftRows()){const p=G.march.draft[r.id],d=Math.hypot(p.x,p.y),limit=marchDraftOuter()-marchExtent(r);if(d>limit){p.x*=limit/d;p.y*=limit/d}}}
function marchFormFits(row,f){
  if(!row||row.character||!['line','column','loose','wedge'].includes(f))return false;
  const who=FORMS[f]?.who;return !who||FORM_WHO[who]({s:ST[row.type]});
}
function marchFormControls(){
  const row=marchDraftRows().find(r=>r.id===G.march.sel),selected=row?.form==='line'&&row.files===1?'column':row?.form;
  return '<div class="lab">Unit formation</div><div class="btns">'+['line','column','loose','wedge'].map(f=>fbBtn('march-form',f,f==='column'?'Column':FORMS[f].n,marchFormFits(row,f)?'':row?.character?'Individual characters have no troop formation':'Not suited to this troop type',selected===f?'on':'')).join('')+'</div><p class="fb-note">Applied to travel and the starting formation in world battles.</p>';
}
// Sprite size stays in CSS pixels; formation spacing follows the map without shrinking the character art.
const MARCH_PREVIEW={sprite:2,gap:5,pad:26};
function marchPreviewFigures(row,scale){
  const hero=row.id==='hero',type=hero?'hero':row.character?row.type.replace(/^comp_/,''):row.type,k=MARCH_PREVIEW.sprite;
  const figures=formSlots(row.form,row.count,0,row.files,WORLD_BATTLE.sprite).map(([sx,sy],i)=>({sx:sx/WORLD_BATTLE.scale*Math.max(MARCH_PREVIEW.gap,scale),sy:sy/WORLD_BATTLE.scale*Math.max(MARCH_PREVIEW.gap,scale),s:unitSprite(type,0,hero,i%6,0,false,false,P.look().col)}));
  const left=Math.min(...figures.map(p=>p.sx-p.s.width*k/2)),right=Math.max(...figures.map(p=>p.sx+p.s.width*k/2)),top=Math.min(...figures.map(p=>p.sy-p.s.height*k)),bottom=Math.max(...figures.map(p=>p.sy));
  return{figures,cx:(left+right)/2,cy:(top+bottom)/2,r:Math.hypot((right-left)/2,(bottom-top)/2)+4};
}
function marchUnitPreview(g,row,x,y,scale){
  const p=marchPreviewFigures(row,scale),k=MARCH_PREVIEW.sprite;g.save();g.imageSmoothingEnabled=false;
  for(const f of p.figures)g.drawImage(f.s,x+f.sx-p.cx-f.s.width*k/2,y+f.sy-p.cy-f.s.height*k,f.s.width*k,f.s.height*k);g.restore();
}
function marchCanvasView(){
  const cv=document.getElementById('marchCanvas'),box=cv.getBoundingClientRect(),w=box.width,h=box.height;
  return{w,h,x:w/2,y:h/2,scale:(Math.min(w,h)/2-MARCH_PREVIEW.pad)/(marchDraftOuter()+WORLD_BATTLE.interaction)};
}
function openMarch(){
  if(G.mode!=='char')return;const draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y,form:r.form,files:r.files}]));G.march={draft,sel:marchRows(P).find(r=>r.id!=='hero')?.id||'hero'};renderMarch();
}
function renderMarch(){
  const s=G.march;if(!s)return;const ids=marchRows(P).map(r=>r.id);
  fbShow('March formation','Hero anchors your army','',
    '<div class="march-layout"><div><canvas id="marchCanvas" width="880" height="640" aria-label="Drag a group inside the outer formation ring"></canvas><p class="fb-note">Inner: core · Outer: free placement · Outermost: interaction only. Drag groups, or choose a group and use the arrows. Front faces your travel direction.</p></div><div><div class="btns">'+ids.map(id=>fbBtn('march-select',id,htmlText(marchNumbers(P)[id]+' · '+armyGroupLabel(id)),id==='hero'?'Your hero is the fixed anchor':'',s.sel===id?'on':'')).join('')+'</div><p id="marchLabel"></p>'+marchFormControls()+'<div class="btns">'+[['up','↑'],['left','←'],['right','→'],['down','↓']].map(([k,n])=>fbBtn('march-step',k,n,s.sel==='hero'?'The hero stays at the centre':'')).join('')+'</div>'+fbBtn('march-reset',null,'Reset formation')+'</div></div>',
    ['march-back',null,'Back'],['march-apply',null,'Apply formation'],'fb-march');
  const cv=document.getElementById('marchCanvas'),view=marchCanvasView(),scale=view.scale,point=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*view.w/r.width,y:(e.clientY-r.top)*view.h/r.height}},put=e=>{const p=point(e),a={x:(p.x-view.x)/scale,y:(p.y-view.y)/scale},row=marchDraftRows().find(r=>r.id===s.sel),limit=marchDraftOuter()-marchExtent(row),d=Math.hypot(a.x,a.y),k=d>limit?limit/d:1;Object.assign(s.draft[s.sel],{x:a.x*k,y:a.y*k});drawMarch()};
  cv.onpointerdown=e=>{const p=point(e),id=ids.filter(id=>id!=='hero').sort((a,b)=>Math.hypot(p.x-view.x-s.draft[a].x*scale,p.y-view.y-s.draft[a].y*scale)-Math.hypot(p.x-view.x-s.draft[b].x*scale,p.y-view.y-s.draft[b].y*scale))[0];if(!id||Math.hypot(p.x-view.x-s.draft[id].x*scale,p.y-view.y-s.draft[id].y*scale)>Math.max(22,marchPreviewFigures(marchDraftRows().find(r=>r.id===id),scale).r))return;s.sel=id;s.drag=e.pointerId;cv.setPointerCapture(e.pointerId);put(e)};
  cv.onpointermove=e=>{if(s.drag===e.pointerId)put(e)};cv.onpointerup=cv.onpointercancel=()=>{s.drag=null;renderMarch()};G.marchResize?.disconnect();G.marchResize=new ResizeObserver(()=>{if(G.march&&document.getElementById('marchCanvas')===cv)drawMarch();else G.marchResize?.disconnect()});G.marchResize.observe(cv);drawMarch();
}
function drawMarch(){
  const s=G.march,cv=document.getElementById('marchCanvas');if(!s||!cv)return;const v=marchCanvasView(),scale=v.scale,g=cv.getContext('2d'),dpr=window.devicePixelRatio||1;
  cv.width=Math.round(v.w*dpr);cv.height=Math.round(v.h*dpr);g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#211c18';g.fillRect(0,0,v.w,v.h);g.font='12px Arial';g.textAlign='center';
  for(const [r,col,dash] of [[marchDraftOuter()+WORLD_BATTLE.interaction,'#756447',[4,4]],[marchDraftOuter(),'#c9a551',[]],[marchCore(P),'#796943',[]]]){g.strokeStyle=col;g.setLineDash(dash);g.beginPath();g.arc(v.x,v.y,r*scale,0,Math.PI*2);g.stroke()}g.setLineDash([]);g.fillStyle='#cfba85';g.fillText('FRONT →',v.w-48,v.y);
  for(const row of marchDraftRows()){const p=s.draft[row.id],x=v.x+p.x*scale,y=v.y+p.y*scale,r=Math.max(marchExtent(row)*scale,marchPreviewFigures(row,scale).r);g.fillStyle=row.id===s.sel?'#55462d':'#2f2a23';g.strokeStyle=row.id===s.sel?'#ffe09a':'#97804c';g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.stroke()}
  for(const row of marchDraftRows()){const p=s.draft[row.id],x=v.x+p.x*scale,y=v.y+p.y*scale,r=Math.max(marchExtent(row)*scale,marchPreviewFigures(row,scale).r);marchUnitPreview(g,row,x,y,scale);g.fillStyle='#211c18';g.fillRect(x-9,y-r-7,18,15);g.fillStyle='#eee0bc';g.fillText(String(marchNumbers(P)[row.id]),x,y-r+5)}
  const label=document.getElementById('marchLabel');if(label)label.textContent=armyGroupLabel(s.sel)+' · '+Math.round(s.draft[s.sel].x*10)/10+', '+Math.round(s.draft[s.sel].y*10)/10;
}
onAct('march-',(a,arg)=>{
  if(a==='march-open')return openMarch();const s=G.march;if(!s||G.mode!=='char')return;
  if(a==='march-apply'){P.army.march=Object.fromEntries(Object.entries(s.draft).map(([id,p])=>[id,{x:p.x,y:p.y}]));for(const g of partyRoster(P).groups){const p=s.draft[g.id];if(p){g.form=p.form;g.files=p.files}}G.marchResize?.disconnect();G.march=null;renderChar();return}
  if(a==='march-form'){const row=marchDraftRows().find(r=>r.id===s.sel);if(!marchFormFits(row,arg))return;Object.assign(s.draft[s.sel],{form:arg==='column'?'line':arg,files:arg==='column'?1:arg==='wedge'?null:FORMS[arg].files});marchDraftClamp();renderMarch();return}
  if(a==='march-back'){G.marchResize?.disconnect();G.march=null;renderChar();return}
  if(a==='march-select'&&s.draft[arg]){s.sel=arg;renderMarch();return}
  if(a==='march-reset'){const old=P.army.march;delete P.army.march;s.draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y,form:r.form,files:r.files}]));if(old)P.army.march=old;renderMarch();return}
  if(a==='march-step'&&s.sel!=='hero'){const p=s.draft[s.sel],d={up:[0,-2],down:[0,2],left:[-2,0],right:[2,0]}[arg];if(!d)return;const row=marchDraftRows().find(r=>r.id===s.sel),limit=marchDraftOuter()-marchExtent(row),x=p.x+d[0],y=p.y+d[1],l=Math.hypot(x,y),k=l>limit?limit/l:1;p.x=x*k;p.y=y*k;drawMarch()}
});
