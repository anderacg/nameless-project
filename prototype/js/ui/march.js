'use strict';
/* ---------- march formation: group offsets round the hero, used unchanged when a road battle starts ---------- */
function openMarch(){
  if(G.mode!=='char')return;const draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y}]));G.march={draft,sel:marchRows(P).find(r=>r.id!=='hero')?.id||'hero'};renderMarch();
}
function renderMarch(){
  const s=G.march;if(!s)return;const ids=marchRows(P).map(r=>r.id),scale=140/(marchOuter(P)+WORLD_BATTLE.interaction);
  fbShow('March formation','Hero anchors your army','',
    '<div class="march-layout"><div><canvas id="marchCanvas" width="880" height="640" aria-label="Drag a group inside the outer formation ring"></canvas><p class="fb-note">Inner: core · Outer: free placement · Outermost: interaction only. Drag groups, or choose a group and use the arrows. Front faces your travel direction.</p></div><div><div class="btns">'+ids.map(id=>fbBtn('march-select',id,htmlText(armyGroupLabel(id)),id==='hero'?'Your hero is the fixed anchor':'',s.sel===id?'on':'')).join('')+'</div><p id="marchLabel"></p><div class="btns">'+[['up','↑'],['left','←'],['right','→'],['down','↓']].map(([k,n])=>fbBtn('march-step',k,n,s.sel==='hero'?'The hero stays at the centre':'')).join('')+'</div>'+fbBtn('march-reset',null,'Reset formation')+'</div></div>',
    ['march-back',null,'Back'],['march-apply',null,'Apply formation'],'fb-march');
  const cv=document.getElementById('marchCanvas'),point=e=>{const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*440/r.width,y:(e.clientY-r.top)*320/r.height}},put=e=>{const p=point(e),a={x:(p.x-220)/scale,y:(p.y-160)/scale},row=marchRows(P).find(r=>r.id===s.sel),limit=marchOuter(P)-marchExtent(row),d=Math.hypot(a.x,a.y),k=d>limit?limit/d:1;s.draft[s.sel]={x:a.x*k,y:a.y*k};drawMarch()};
  cv.onpointerdown=e=>{const p=point(e),id=ids.filter(id=>id!=='hero').sort((a,b)=>Math.hypot(p.x-220-s.draft[a].x*scale,p.y-160-s.draft[a].y*scale)-Math.hypot(p.x-220-s.draft[b].x*scale,p.y-160-s.draft[b].y*scale))[0];if(!id||Math.hypot(p.x-220-s.draft[id].x*scale,p.y-160-s.draft[id].y*scale)>22)return;s.sel=id;s.drag=e.pointerId;cv.setPointerCapture(e.pointerId);put(e)};
  cv.onpointermove=e=>{if(s.drag===e.pointerId)put(e)};cv.onpointerup=cv.onpointercancel=()=>{s.drag=null};drawMarch();
}
function drawMarch(){
  const s=G.march,cv=document.getElementById('marchCanvas');if(!s||!cv)return;const scale=140/(marchOuter(P)+WORLD_BATTLE.interaction),g=cv.getContext('2d');g.setTransform(2,0,0,2,0,0);g.clearRect(0,0,440,320);g.fillStyle='#211c18';g.fillRect(0,0,440,320);g.font='11px Arial';g.textAlign='center';
  for(const [r,col,dash] of [[marchOuter(P)+WORLD_BATTLE.interaction,'#756447',[4,4]],[marchOuter(P),'#c9a551',[]],[WORLD_BATTLE.inner,'#796943',[]]]){g.strokeStyle=col;g.setLineDash(dash);g.beginPath();g.arc(220,160,r*scale,0,Math.PI*2);g.stroke()}g.setLineDash([]);g.fillStyle='#cfba85';g.fillText('FRONT →',384,160);
  for(const row of marchRows(P)){const p=s.draft[row.id],x=220+p.x*scale,y=160+p.y*scale;g.fillStyle=row.id===s.sel?'#55462d':'#2f2a23';g.strokeStyle=row.id===s.sel?'#ffe09a':'#97804c';g.beginPath();g.arc(x,y,Math.max(10,marchExtent(row)*scale),0,Math.PI*2);g.fill();g.stroke();g.fillStyle='#eee0bc';g.fillText(row.id==='hero'?'♛':String(partyRoster(P).order.indexOf(row.id)+1),x,y+4)}
  const label=document.getElementById('marchLabel');if(label)label.textContent=armyGroupLabel(s.sel)+' · '+Math.round(s.draft[s.sel].x*10)/10+', '+Math.round(s.draft[s.sel].y*10)/10;
}
onAct('march-',(a,arg)=>{
  if(a==='march-open')return openMarch();const s=G.march;if(!s||G.mode!=='char')return;
  if(a==='march-apply'){P.army.march=structuredClone(s.draft);G.march=null;renderChar();return}
  if(a==='march-back'){G.march=null;renderChar();return}
  if(a==='march-select'&&s.draft[arg]){s.sel=arg;renderMarch();return}
  if(a==='march-reset'){const old=P.army.march;delete P.army.march;s.draft=Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y}]));if(old)P.army.march=old;drawMarch();return}
  if(a==='march-step'&&s.sel!=='hero'){const p=s.draft[s.sel],d={up:[0,-2],down:[0,2],left:[-2,0],right:[2,0]}[arg];if(!d)return;const row=marchRows(P).find(r=>r.id===s.sel),limit=marchOuter(P)-marchExtent(row),x=p.x+d[0],y=p.y+d[1],l=Math.hypot(x,y),k=l>limit?limit/l:1;p.x=x*k;p.y=y*k;drawMarch()}
});
