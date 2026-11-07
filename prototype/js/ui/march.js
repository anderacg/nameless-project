'use strict';
/* ---------- march formation: the Army window's March formation tab (partypage.js ARMY_TABS; the owner, 2026-11-01: "make march
   formation a menu alongside Roster"), its two views by a switch at its top (partyView().march): Field, the places round the army's
   middle (no one's: your hero has his place as a group does), used unchanged when a road battle starts; By road (column), the order
   of your column (ColumnEditor). Each view keeps its draft (G.march, G.column) while the tab is shown, dropped when it is opened
   afresh; Apply saves it ---------- */
const marchDraftRows=()=>marchRows(P).map(r=>({...r,...G.march?.draft[r.id]}));
const marchDraftOuter=()=>G.march?.radius??marchRoom(P);// (the room you may place groups in: march.js marchRoom; the ring round them may be a little wider)
// Fit frontage to the fixed allowed radius; changing files must not grow the army circle.
function marchFitRow(row){
  if(marchExtent(row)<=marchDraftOuter())return row;if(FORMS[row.form]?.drag==='fixed')return null;
  let best=null,gap=Infinity;for(let files=1;files<=row.count;files++){const r={...row,files},d=Math.abs(files-(row.files||FORMS[row.form]?.files||1));if(d<gap&&marchExtent(r)<=marchDraftOuter()){best=r;gap=d}}return best;
}
function marchDraftClamp(){for(const row of marchDraftRows()){const r=marchFitRow(row)||marchRows(P).find(r=>r.id===row.id),p=G.march.draft[row.id];Object.assign(p,{form:r.form,files:r.files});const q=marchPlace({...r,face:p.face??r.face},p.x,p.y,marchDraftOuter());p.x=q.x;p.y=q.y}}
// (the tab's formations: a circle and a Cantabrian circle too (the owner, 2026-11-01: "both in battle and as a march formation"),
// their size by the formation drawn, as a battle's drag)
const MARCH_FORMS=['line','column','loose','wedge','circle','cantabrian'];
function marchFormFits(row,f){
  if(!row||row.character||!MARCH_FORMS.includes(f))return false;
  const who=FORMS[f]?.who;return (!who||FORM_WHO[who]({s:ST[row.type]}))&&!!marchFitRow({...row,form:f,files:FORMS[f].files});
}
function marchFormControls(){
  const row=marchDraftRows().find(r=>r.id===G.march.sel),selected=row?.form;
  return '<div class="lab">Unit formation</div><div class="btns">'+MARCH_FORMS.map(f=>fbBtn('march-form',f,FORMS[f].n,marchFormFits(row,f)?'':row?.character?'Individual characters have no troop formation':'Not suited to this troop type',selected===f?'on':'')).join('')+'</div><p class="fb-note">Applied to travel and the starting formation in world battles.</p>';
}
// (the owner, 2026-10-31: the preview "actually match the real battle space and proportion") each man drawn at the map's own size
// for the view's scale, as his spacing is (marchSpriteK: WORLD_BATTLE.sprite / scale map px a sprite px)
// (minR: the view never closer than an army this wide (map px): a lone hero not drawn huge, the owner, 2026-10-31)
const MARCH_PREVIEW={pad:26,hurt:.45,cross:[3,4.5],middle:5,minR:36};// (cross: beside the chest, sprite px; middle: the army's middle's mark, px)
const marchSpriteK=scale=>WORLD_BATTLE.sprite/WORLD_BATTLE.scale*scale;
// (a group's wounded march with it: drawn in its last places, faded, a red cross over each)
const marchHurt=row=>row.id==='hero'||row.character?0:partyRoster(P).wounded(row.id);
// (a row's man i as the previews draw him: his kind's figure in your colours; bare: his spear left off, a flag's: marchFlagOf)
const marchFigure=(row,i,bare)=>{const hero=row.id==='hero';return unitSprite(hero?'hero':row.character?row.type.replace(/^comp_/,''):row.type,0,hero,i%6,0,!!bare,false,P.look().col)};
/* the previews' flags, as the map flies them (the owner, 2026-11-01: "previews in march formation not showing flag"; gfx/marchgear.js):
   of a row's fit men its share MARCH_GEAR.flag (one at least), ranked by the map's hash of their places; none for a character or
   beasts, none with MARCH_GEAR.flags off. Your banner; a spearman's on his spear (drawn bare, the spear apart), anyone else's at
   his back. No torches */
function marchFlagMen(row){const n=row.count,S=ST[row.type];if(!MARCH_GEAR.flags||row.character||row.id==='hero'||!S||S.beast||S.wildlife)return new Set();
  return new Set([...Array(n).keys()].sort((a,b)=>marchHash(a)-marchHash(b)||a-b).slice(0,gearShare(n,MARCH_GEAR.flag)))}
// (man i's flag: pole, his spear's kind, and skin, his hand's (marchgear.js marchKit); else at his back)
function marchFlagOf(row,i){const L=lookOf(row.type,0,false,i%6,'',null);return POLE(L.weapon)?{pole:L.weapon,skin:pal(L.skin)[1]}:{back:true}}
// (a figure's flag into g, its sprite's corner at bx, by drawn k times: the back flag before his body, the spear's after it)
function marchFlagDraw(g,f,bx,by,k,front){const F=f.flag,b=F&&P.banner();if(!b||typeof b!=='object')return;
  if(front&&F.pole&&f.s.hand){const c=poleFlagSprite(F.pole,b,F.skin,0);g.drawImage(c,bx+(f.s.hand[0]-c.R)*k,by+(f.s.hand[1]-c.R)*k,c.width*k,c.height*k)}
  else if(!front&&F.back&&f.s.back){const c=battleBackFlag(b,0);g.drawImage(c,bx+(f.s.back[0]-c.ax)*k,by+(f.s.back[1]-c.ay)*k,c.width*k,c.height*k)}}
// (a row's man i with his flag, if he flies one (flags: marchFlagMen's))
const marchMan=(row,i,flags)=>{const flag=flags.has(i)?marchFlagOf(row,i):null;return{s:marchFigure(row,i,flag?.pole),flag}};
function marchPreviewFigures(row,scale){
  const k=marchSpriteK(scale),flags=marchFlagMen(row);
  const figures=formSlots(row.form,row.count+marchHurt(row),row.face||0,row.files,WORLD_BATTLE.sprite).map(([sx,sy],i)=>({sx:sx/WORLD_BATTLE.scale*scale,sy:sy/WORLD_BATTLE.scale*scale,...marchMan(row,i,flags),hurt:i>=row.count}));
  const left=Math.min(...figures.map(p=>p.sx-p.s.width*k/2)),right=Math.max(...figures.map(p=>p.sx+p.s.width*k/2)),top=Math.min(...figures.map(p=>p.sy-p.s.height*k)),bottom=Math.max(...figures.map(p=>p.sy));
  return{figures,cx:0,cy:0,r:Math.max(Math.abs(left),Math.abs(right),Math.abs(top),Math.abs(bottom))+4};
}
function marchUnitPreview(g,row,x,y,scale){
  const p=marchPreviewFigures(row,scale),k=marchSpriteK(scale);g.save();g.imageSmoothingEnabled=false;
  for(const f of p.figures){g.globalAlpha=f.hurt?MARCH_PREVIEW.hurt:1;const bx=x+f.sx-p.cx-f.s.width*k/2,by=y+f.sy-p.cy-f.s.height*k;
    marchFlagDraw(g,f,bx,by,k,false);g.drawImage(f.s,bx,by,f.s.width*k,f.s.height*k);marchFlagDraw(g,f,bx,by,k,true)}g.globalAlpha=1;
  // (the crosses after the men, beside each one's chest, so none is drawn over)
  g.fillStyle='#e0473a';for(const f of p.figures)if(f.hurt){const cx=x+f.sx-p.cx+MARCH_PREVIEW.cross[0]*k,cy=y+f.sy-p.cy-MARCH_PREVIEW.cross[1]*k;g.fillRect(cx-1,cy-3,2,6);g.fillRect(cx-3,cy-1,6,2)}g.restore();
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
  const row=marchDraftRows().find(r=>r.id===G.march.sel),reach=G.march.range&&marchRangeShape(row);
  const extent=reach?Math.hypot(row.x,row.y)+reach.range+reach.half:0;
  return{w,h,x:w/2,y:h/2,scale:(Math.min(w,h)/2-MARCH_PREVIEW.pad)/Math.max(marchDraftOuter()+WORLD_BATTLE.interaction,extent,MARCH_PREVIEW.minR)};
}
// (a fresh draft of the field: each row's saved place, facing and formation; base: it as it began, to tell a change)
function marchDraft(){const draft=marchDefaultsNow();return{draft,base:JSON.stringify(draft),history:[],radius:marchRoom(P),sel:marchRows(P).find(r=>r.id!=='hero')?.id||'hero'}}
const marchDefaultsNow=()=>Object.fromEntries(marchRows(P).map(r=>[r.id,{x:r.x,y:r.y,face:r.face||0,form:r.form,files:r.files}]));
// (the draft made for other rows than march now: a group joined or gone since)
const marchStale=()=>{const ids=marchRows(P).map(r=>r.id);return ids.length!==Object.keys(G.march.draft).length||ids.some(id=>!G.march.draft[id])};
// (the tab on its Field view, a fresh draft: the way the tests and any old caller open the editor)
function openMarch(){if(G.mode!=='char')return;partyView().march='field';G.march=null;renderMarch()}
function marchRemember(before){const s=G.march;if(JSON.stringify(before)===JSON.stringify(s.draft))return;s.history.push(before);if(s.history.length>20)s.history.shift()}
function marchDefaults(){const old=P.army.march;delete P.army.march;try{return marchDefaultsNow()}finally{if(old)P.army.march=old}}
// (groups with no fit men, only wounded: not in the formation; named under the field)
function marchAllHurt(ids){const r=partyRoster(P),w=[...new Set((P.woundedGroups||[]).filter(g=>g.count>0&&!ids.includes(g.id)).map(g=>g.id))];
  return w.length?'<br><span class="bad">All wounded, out of the formation: '+w.map(id=>r.wounded(id)+' '+htmlText(armyGroupLabel(id))).join(', ')+'.</span>':''}
/* the tab's page (partypage.js partyRosterPage hands it over): its pane, the switch in its head, the view's preview and its controls
   beside it; opened afresh (from another tab, or the window closed), last time's drafts are dropped. Its canvas is wired once the
   page is in (marchBind: at once from renderMarch, else just after) */
const MARCH_VIEWS=[['field','Field'],['column','By road (column)']];
function marchTabPage(){
  const v=partyView(),view=MARCH_VIEWS.some(([k])=>k===v.march)?v.march:(v.march='field');
  if(ov.hidden||!panel.querySelector('.fb-march-pane')){G.march=null;G.column=null}
  if(!G.march||marchStale())G.march=marchDraft();if(!G.column)G.column=new ColumnEditor();
  queueMicrotask(marchBind);
  return '<div class="fb-army-layout"><section class="fb-pane fb-march-pane" data-march-view="'+view+'"><div class="fb-pane-head"><h3>March formation</h3>'+fbTabs(MARCH_VIEWS,view,'march-view','March formation views')+'</div>'+(view==='column'?G.column.html():marchFieldHtml())+'</section></div>';
}
function renderMarch(){if(G.mode!=='char')return;G.char='march';renderChar();marchBind()}
function marchBind(){if(G.mode!=='char'||G.char!=='march')return;const f=document.getElementById('marchCanvas'),c=document.getElementById('columnCanvas');if(f&&G.march)marchFieldBind(f);if(c&&G.column)G.column.bind(c)}
// (a preview drawn again when its canvas changes size; one at a time)
function marchObserve(cv,draw){G.marchResize?.disconnect();G.marchResize=new ResizeObserver(()=>{if(document.body.contains(cv))draw();else G.marchResize?.disconnect()});G.marchResize.observe(cv)}
function marchFieldHtml(){
  const s=G.march,ids=marchRows(P).map(r=>r.id);
  return '<div class="march-layout"><div class="march-stage"><canvas id="marchCanvas" aria-label="Drag a group inside the outer formation ring"></canvas></div><div class="march-side"><div class="fb-scroll" data-fb-scroll="march-field"><div class="btns">'+ids.map(id=>fbBtn('march-select',id,(rg=>rg?groupBadge(rg,12)+' ':'')(partyRoster(P).groups.find(g=>g.id===id))+htmlText(marchNumbers(P)[id]+' · '+armyGroupLabel(id)),'',s.sel===id?'on':'')).join('')+'</div><p id="marchLabel"></p>'+fbBtn('march-tool','move','Move groups','',s.tool!=='form'?'on':'')+fbBtn('march-tool','form','Draw formation',s.sel==='hero'?'Select a troop group first':'',s.tool==='form'?'on':'')+fbBtn('march-range',null,s.range?'Hide range':'Show range',marchRangeShape(marchDraftRows().find(r=>r.id===s.sel))?'':'This group has no ranged attack',s.range?'on':'')+marchFormControls()+'<div class="btns">'+[['up','↑'],['left','←'],['right','→'],['down','↓']].map(([k,n])=>fbBtn('march-step',k,n)).join('')+'</div>'+'<div class="btns">'+fbBtn('march-undo',null,'Undo',s.history.length?'':'No changes to undo')+fbBtn('march-reset-selected',null,'Reset group')+fbBtn('march-reset',null,'Reset all')+'</div><p class="fb-note">Drag to move · Right-drag to set frontage and facing · On touch, choose Draw formation.<br>Gold ring: placement boundary · Dashed ring: interaction only · Red: outside boundary, fitted inside on release.<br>Show range opens a range overview. Ground obstacles are resolved while marching.'+marchAllHurt(ids)+'</p></div>'+
    '<div class="btns march-commit">'+fbBtn('march-back',null,'Discard',JSON.stringify(s.draft)!==s.base?'':'No changes')+fbBtn('march-apply',null,'Apply formation','','primary')+'</div></div></div>';
}
function marchFieldBind(cv){
  const s=G.march,ids=marchRows(P).map(r=>r.id);
  const point=e=>{const v=s.gesture?.view||marchCanvasView(),r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*v.w/r.width,y:(e.clientY-r.top)*v.h/r.height}},put=e=>{
    const d=s.gesture;if(!d||d.id!==e.pointerId)return;const p=point(e),v=d.view,world={x:(p.x-v.x)/v.scale,y:(p.y-v.y)/v.scale};
    if(d.form){d.end=p;if(Math.hypot(p.x-d.start.x,p.y-d.start.y)<6)return;const row=marchDraftRows().find(r=>r.id===s.sel),dx=p.x-d.start.x,dy=p.y-d.start.y;
      Object.assign(s.draft[s.sel],{x:((p.x+d.start.x)/2-v.x)/v.scale,y:((p.y+d.start.y)/2-v.y)/v.scale,face:Math.atan2(-dx,dy),files:dragFiles(row.form,row.count,Math.hypot(dx,dy)/v.scale*WORLD_BATTLE.scale,WORLD_BATTLE.sprite)});
    }else Object.assign(s.draft[s.sel],world);const candidate=marchDraftRows().find(r=>r.id===s.sel);s.invalid=marchFoot(candidate,candidate.x,candidate.y)>marchDraftOuter()+.001?{...candidate}:null;marchDraftClamp();drawMarch();
  };
  cv.oncontextmenu=e=>e.preventDefault();
  cv.onpointerdown=e=>{if(s.gesture||e.button!==0&&e.button!==2)return;const v=marchCanvasView(),p=point(e),form=e.button===2||s.tool==='form';
    if(form){if(s.sel==='hero')return}else{const id=ids.slice().sort((a,b)=>Math.hypot(p.x-v.x-s.draft[a].x*v.scale,p.y-v.y-s.draft[a].y*v.scale)-Math.hypot(p.x-v.x-s.draft[b].x*v.scale,p.y-v.y-s.draft[b].y*v.scale))[0];if(!id||Math.hypot(p.x-v.x-s.draft[id].x*v.scale,p.y-v.y-s.draft[id].y*v.scale)>Math.max(22,marchPreviewFigures(marchDraftRows().find(r=>r.id===id),v.scale).r))return;s.sel=id}
    e.preventDefault();s.gesture={id:e.pointerId,form,start:p,end:p,view:v,before:structuredClone(s.draft)};cv.setPointerCapture(e.pointerId);if(!form)put(e);
  };
  cv.onpointermove=put;cv.onpointerup=e=>{if(s.gesture?.id!==e.pointerId)return;put(e);marchRemember(s.gesture.before);s.gesture=null;s.invalid=null;renderMarch()};
  cv.onpointercancel=e=>{if(s.gesture?.id!==e.pointerId)return;s.draft=s.gesture.before;s.gesture=null;s.invalid=null;renderMarch()};marchObserve(cv,drawMarch);drawMarch();
}
// Facing arrow sits just beyond the ground footprint, with a fixed-size head readable on touch screens.
function marchFacingGuide(g,row,x,y,scale){
  const a=row.face||0,c=Math.cos(a),s=Math.sin(a),r=marchExtent(row)*scale+6,sx=x+c*r,sy=y+s*r,ex=sx+c*24,ey=sy+s*24;
  g.beginPath();g.moveTo(sx,sy);g.lineTo(ex,ey);g.moveTo(ex-c*8-s*5,ey-s*8+c*5);g.lineTo(ex,ey);g.lineTo(ex-c*8+s*5,ey-s*8-c*5);g.stroke();
}
/* the rings, alive (the owner, 2026-10-30: "more interesting effect or animated"): the gold boundary glowing, a highlight sweeping
   round it once every spin s (red and quicker while a group is dragged outside it), the interaction ring's dashes creeping round
   (ants px a second), the core breathing (breathe s); the selected group's outline creeping too. Drawn fps times a second while the
   window is open (marchAnimate); still for anyone who asks the system for less motion */
const MARCH_FX={spin:6,ants:10,breathe:3.5,fps:30,sweep:.7};
const marchStill=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function marchRings(g,v,scale,t,bad){const R=marchDraftOuter()*scale,I=(marchDraftOuter()+WORLD_BATTLE.interaction)*scale,C=marchCore(P)*scale,X=MARCH_FX,arc=r=>{g.beginPath();g.arc(v.x,v.y,r,0,Math.PI*2);g.stroke()};
  g.save();g.strokeStyle='#756447';g.setLineDash([4,4]);g.lineDashOffset=-t*X.ants;arc(I);g.setLineDash([]);
  g.globalAlpha=.55+.3*Math.sin(t*2*Math.PI/X.breathe);g.strokeStyle='#796943';arc(C);g.globalAlpha=1;
  const gold=bad?'#ef8176':'#c9a551',pulse=bad?.5+.5*Math.sin(t*8):0;g.lineWidth=6;g.globalAlpha=.12+.2*pulse;g.strokeStyle=gold;arc(R);g.lineWidth=3;g.globalAlpha=.2+.2*pulse;arc(R);g.globalAlpha=1;g.lineWidth=1;arc(R);
  const a=(t/(bad?X.spin/2:X.spin))%1*Math.PI*2,grd=g.createConicGradient?g.createConicGradient(a-X.sweep,v.x,v.y):null;
  if(grd){grd.addColorStop(0,'rgba(255,232,160,0)');grd.addColorStop(X.sweep/(Math.PI*2),bad?'rgba(255,190,170,.95)':'rgba(255,236,170,.95)');grd.addColorStop(X.sweep/(Math.PI*2)+.002,'rgba(255,232,160,0)');grd.addColorStop(1,'rgba(255,232,160,0)');g.strokeStyle=grd;g.lineWidth=2.5;arc(R)}
  g.restore()}
// (drawn again fps times a second while the window is open, unless still)
function marchAnimate(){if(G.marchAnim||marchStill())return;let last=0;const tick=now=>{if(!G.march||!document.getElementById('marchCanvas')){G.marchAnim=null;return}
  if(now-last>=1000/MARCH_FX.fps){last=now;drawMarch()}G.marchAnim=requestAnimationFrame(tick)};G.marchAnim=requestAnimationFrame(tick)}
function drawMarch(){
  const s=G.march,cv=document.getElementById('marchCanvas');if(!s||!cv)return;const v=marchCanvasView(),scale=v.scale,g=cv.getContext('2d'),dpr=dprOf();
  const width=Math.round(v.w*dpr),height=Math.round(v.h*dpr);if(cv.width!==width)cv.width=width;if(cv.height!==height)cv.height=height;g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#211c18';g.fillRect(0,0,v.w,v.h);g.font='12px Arial';g.textAlign='center';
  const t=marchStill()?0:performance.now()/1000;marchRings(g,v,scale,t,!!s.invalid);marchAnimate();g.fillStyle='#cfba85';g.fillText('FRONT →',v.w-48,v.y);
  // (the army's middle: no one stands there; a cross marks it here only)
  {const c=MARCH_PREVIEW.middle;g.strokeStyle='#cfba85';g.beginPath();g.moveTo(v.x-c,v.y);g.lineTo(v.x+c,v.y);g.moveTo(v.x,v.y-c);g.lineTo(v.x,v.y+c);g.stroke()}
  const drag=s.gesture;if(drag?.form){g.strokeStyle='#ffe09a';g.lineWidth=2;g.beginPath();g.moveTo(drag.start.x,drag.start.y);g.lineTo(drag.end.x,drag.end.y);g.stroke();g.lineWidth=1}
  const reach=s.range&&marchRangeShape(marchDraftRows().find(r=>r.id===s.sel));
  if(reach){g.save();g.translate(v.x,v.y);g.scale(scale,scale);g.beginPath();if(reach.circle)g.arc(reach.ax,reach.ay,reach.range,0,Math.PI*2);else{reach.points.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath()}g.fillStyle='rgba(120,190,255,.09)';g.strokeStyle='#78beff';g.lineWidth=1.5/scale;g.fill();g.stroke();g.restore()}
  if(s.invalid){const r=s.invalid,points=marchGuidePoints(r);g.strokeStyle='#ef8176';g.fillStyle='rgba(239,129,118,.12)';g.setLineDash([5,4]);g.beginPath();points.forEach((p,i)=>i?g.lineTo(v.x+(r.x+p.x)*scale,v.y+(r.y+p.y)*scale):g.moveTo(v.x+(r.x+p.x)*scale,v.y+(r.y+p.y)*scale));g.closePath();g.fill();g.stroke();g.setLineDash([]);g.fillStyle='#efaaa1';g.fillText('Outside army boundary · preview fitted inside',v.w/2,22)}
  for(const row of marchDraftRows()){const x=v.x+row.x*scale,y=v.y+row.y*scale,points=marchGuidePoints(row);g.strokeStyle=row.id===s.sel?'#ffe09a':'#97804c';g.setLineDash([3,3]);g.lineDashOffset=row.id===s.sel?-t*MARCH_FX.ants:0;g.beginPath();points.forEach((p,i)=>i?g.lineTo(x+p.x*scale,y+p.y*scale):g.moveTo(x+p.x*scale,y+p.y*scale));g.closePath();g.stroke();g.setLineDash([]);g.lineWidth=row.id===s.sel?2:1.5;marchFacingGuide(g,row,x,y,scale);g.lineWidth=1}g.setLineDash([]);
  for(const row of marchDraftRows()){const p=s.draft[row.id],x=v.x+p.x*scale,y=v.y+p.y*scale,r=Math.max(marchExtent(row)*scale,marchPreviewFigures(row,scale).r);marchUnitPreview(g,row,x,y,scale);g.fillStyle='#211c18';g.fillRect(x-9,y-r-7,18,15);g.fillStyle='#eee0bc';g.fillText(String(marchNumbers(P)[row.id]),x,y-r+5)}
  const label=document.getElementById('marchLabel');if(label){const row=marchDraftRows().find(r=>r.id===s.sel),w=row?marchHurt(row):0;label.textContent=armyGroupLabel(s.sel)+(w?' · '+row.count+' fit, '+w+' wounded':'')+' · '+Math.round(s.draft[s.sel].x*10)/10+', '+Math.round(s.draft[s.sel].y*10)/10}
}
/* ---------- By road (column): the order of your column (the owner, 2026-11-01: "add By road formation to let you decide the orders
   of units (in column)", "drag and drop adjustable preview ... locked in column form order"). Its preview is your column as it
   marches (marchstyles.js MarchColumn: 2 abreast, its own ranks and room), front at the right (facing as the Field view's men do:
   the owner, 2026-11-01: "by road and in field they face different direction"), each group a block of its men, your
   hero and each companion one man of it. Only the order changes: a block dragged along it (the others slide to make room), or
   tapped and then its new place tapped (a phone), or picked in the list and moved a place ahead or behind. Apply saves it
   (P.army.column: the rows' ids, front first; marchstyles.js columnOrder); Reset goes back to the default (by how far forward each
   stands in your field formation, its battle lanes). COLUMN_PREVIEW: pad px round it; most: its scale at most (screen px a map px);
   reach: a block caught this many screen px past its men at least; slide: of the way an entry slides to its place each frame;
   tap: px a press moves before it is a drag; road: map px of road either side of the column; body: map px a man's middle stands
   over his feet ---------- */
const COLUMN_PREVIEW={pad:22,most:6,reach:18,slide:.3,tap:6,road:9,body:4,shade:['#4c3f2d','#363f30'],on:'#6e5a2a'};
class ColumnEditor{
  // (custom: an order set (saved, or moved here); else the default, whatever it is then; was: as it began, to tell a change)
  constructor(){const saved=P.army?.column;this.custom=Array.isArray(saved)&&saved.length>0;this.order=this.custom?saved.slice():[];this.was=this.custom;this.base=this.ids().join();this.pick=null;this.drag=null;this.shown={};this.v=null}
  // (your rows front first: the draft's order, a row not in it at its default place)
  rows(){return columnOrder(P,marchRows(P),this.custom?this.order:null)}
  ids(){return this.rows().map(r=>r.id)}
  changed(){return this.custom!==this.was||this.ids().join()!==this.base}
  // (ids with id put at place j)
  with(id,j,ids=this.ids()){const o=ids.filter(x=>x!==id);o.splice(clamp(j,0,o.length),0,id);return o}
  move(id,j){this.order=this.with(id,j);this.custom=true}
  reset(){this.order=[];this.custom=false;this.pick=null}
  apply(){if(this.custom)P.army.column=this.ids();else delete P.army.column;MARCH_LAYOUTS.delete(P)}
  // (the column of an order as it marches: each man's place along it, s px back from its head, and beside it, side px; each
  // entry's span along it, first to last man; marchstyles.js MarchColumn's own ranks, its rows given in this order)
  layout(ids=this.ids()){const rows=marchRows(P),by=ids.map((id,i)=>({...rows.find(r=>r.id===id),x:-i})),c=new MarchColumn(by,{}),span={};
    const men=c.T.map(t=>({row:by.find(r=>r.id===t.row),i:t.index,rank:t.rank,s:c.s[t.rank],side:t.side}));
    for(const m of men){const p=span[m.row.id]||(span[m.row.id]={a:Infinity,b:-Infinity,side:0,n:0});p.a=Math.min(p.a,m.s);p.b=Math.max(p.b,m.s);p.side+=m.side;p.n++}
    for(const id in span){const p=span[id];p.c=(p.a+p.b)/2;p.side/=p.n}return{men,span,len:c.len}}
  // (the view: the column across the canvas, its head on the right, as big as fits; x0, y0: its head, on its line; xAt: the screen x
  // of a place s px back from it)
  view(w,h,len){const C=COLUMN_PREVIEW,scale=Math.max(.5,Math.min(C.most,(w-2*C.pad)/Math.max(len+12,40),(h-2*C.pad-28)/18));return{w,h,scale,x0:(w+len*scale)/2,y0:h/2+4*scale}}
  xAt(s,v=this.v){return v.x0-s*v.scale}
  // (where a point of the canvas is on the column: s px back from its head, side px beside it, a man's middle (body px over his feet))
  at(p,v=this.v){return{s:(v.x0-p.x)/v.scale,side:(v.y0-p.y)/v.scale-COLUMN_PREVIEW.body}}
  // (the entry under a point: the one of the man nearest it, within reach screen px (more for a big view))
  hit(p,L,v){const q=this.at(p,v);let best=null,d0=Math.max(COLUMN_PREVIEW.reach,6*v.scale)/v.scale;for(const m of L.men){const d=Math.hypot(q.s-m.s,q.side-m.side);if(d<d0){d0=d;best=m.row.id}}return best}
  // (the place for id whose middle lands nearest q (its side too: two characters of one rank told apart): its middle at each
  // place, worked out once a drag)
  place(id,q,mids){let best=0;const d=m=>Math.hypot(m.s-q.s,(m.side-q.side)/4);mids.forEach((m,j)=>{if(d(m)<d(mids[best]))best=j});return best}
  mids(id){const n=this.ids().length;return Array.from({length:n},(_,j)=>{const p=this.layout(this.with(id,j)).span[id];return{s:p.c,side:p.side}})}
  caption(){const ids=this.ids(),i=ids.indexOf(this.pick);if(i<0)return 'Drag a group along the column, or tap one and then its new place.';
    const row=marchRows(P).find(r=>r.id===this.pick);return (i+1)+' · '+armyGroupLabel(this.pick)+(row.character?'':' · '+row.count)+': tap its new place, or move it ahead or behind.'}
  html(){
    const ids=this.ids(),rows=marchRows(P),r=partyRoster(P),i=ids.indexOf(this.pick);
    return '<div class="march-layout march-column"><div class="march-stage"><canvas id="columnCanvas" aria-label="Your column on the road, front at the right: drag a group along it to change the order"></canvas><div class="march-caption-row"><p class="march-caption" id="columnLabel">'+htmlText(this.caption())+'</p><div class="btns">'+fbBtn('march-col-step','1','← Behind',i<0||i>=ids.length-1?'At the rear':'')+fbBtn('march-col-step','-1','Ahead →',i<=0?'At the front':'')+'</div></div></div><div class="march-side"><div class="fb-scroll" data-fb-scroll="march-column"><div class="lab">Column order · front first</div><div class="btns march-col-list">'+
      ids.map((id,k)=>{const row=rows.find(x=>x.id===id),g=r.groups.find(g=>g.id===id);return fbBtn('march-col-pick',id,'<b>'+(k+1)+'</b> '+(g?groupBadge(g,12)+' ':'')+htmlText(armyGroupLabel(id))+(row.character?'':' <small>'+row.count+'</small>'),'',this.pick===id?'on':'')}).join('')+'</div></div>'+
      '<div class="btns march-commit">'+fbBtn('march-col-discard',null,'Discard',this.changed()?'':'No changes')+fbBtn('march-col-reset',null,'Reset order',this.custom?'':'The default order already')+fbBtn('march-col-apply',null,'Apply order','','primary')+'</div></div></div>';
  }
  act(k,arg){
    if(k==='pick'){if(this.ids().includes(arg))this.pick=this.pick===arg?null:arg}
    else if(k==='step'){const ids=this.ids(),i=ids.indexOf(this.pick),j=i+Number(arg);if(i<0||j<0||j>=ids.length)return;this.move(this.pick,j)}
    else if(k==='reset')this.reset();
    else if(k==='discard'){G.column=new ColumnEditor()}
    else if(k==='apply'){this.apply();G.column=new ColumnEditor()}
    else return;renderMarch();
  }
  bind(cv){
    const C=COLUMN_PREVIEW,point=e=>{const r=cv.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
    cv.oncontextmenu=e=>e.preventDefault();
    cv.onpointerdown=e=>{if(this.drag||e.button!==0||!this.v)return;const p=point(e),L=this.layout(),id=this.hit(p,L,this.v);if(!id&&!this.pick)return;
      const q=this.at(p);e.preventDefault();this.drag={pid:e.pointerId,id,start:p,moved:false,grab:id?{s:q.s-L.span[id].c,side:q.side-L.span[id].side}:null,mids:null,j:null,s:0};cv.setPointerCapture?.(e.pointerId)};
    cv.onpointermove=e=>{const d=this.drag;if(!d||d.pid!==e.pointerId)return;const p=point(e);
      if(!d.moved){if(!d.id||Math.hypot(p.x-d.start.x,p.y-d.start.y)<C.tap)return;d.moved=true;d.mids=this.mids(d.id);this.pick=null}
      const q=this.at(p);d.s=q.s-d.grab.s;d.j=this.place(d.id,{s:d.s,side:q.side-d.grab.side},d.mids);this.draw()};
    cv.onpointerup=e=>{const d=this.drag;if(!d||d.pid!==e.pointerId)return;this.drag=null;
      if(d.moved){this.shown[d.id]=d.s;this.move(d.id,d.j)}
      else if(this.pick&&d.id!==this.pick){const id=this.pick;this.shown[id]=this.layout().span[id].c;this.move(id,this.place(id,this.at(point(e)),this.mids(id)));this.pick=null}
      else this.pick=d.id===this.pick?null:d.id;
      renderMarch()};
    cv.onpointercancel=e=>{if(this.drag?.pid!==e.pointerId)return;this.drag=null;this.draw()};
    marchObserve(cv,()=>this.draw());this.draw();
  }
  // the column drawn: the road under it, each entry's men (the one dragged where it is held, the others sliding to their places),
  // under each man his ground (from half way to the rank before his to half way to the next, his side of the road) in his entry's
  // shade (COLUMN_PREVIEW.shade, in turn; the one picked or dragged gold, outlined), its place's number above and below in turn;
  // front at the right, each man facing it, unflipped (his flag's cloth trailing behind him, to the left)
  draw(){
    const cv=document.getElementById('columnCanvas');if(!cv)return;const box=cv.getBoundingClientRect(),w=box.width,h=box.height,dpr=dprOf(),g=cv.getContext('2d');if(!w||!h)return;
    if(cv.width!==Math.round(w*dpr))cv.width=Math.round(w*dpr);if(cv.height!==Math.round(h*dpr))cv.height=Math.round(h*dpr);
    const C=COLUMN_PREVIEW,d=this.drag?.moved?this.drag:null,ids=d?this.with(d.id,d.j):this.ids(),L=this.layout(ids),v=this.v=d&&this.v?this.v:this.view(w,h,L.len),k=marchSpriteK(v.scale),still=marchStill();
    g.save();g.setTransform(dpr,0,0,dpr,0,0);g.fillStyle='#211c18';g.fillRect(0,0,w,h);g.imageSmoothingEnabled=false;
    g.fillStyle='#3a3127';g.fillRect(0,v.y0-C.road*v.scale,w,2*C.road*v.scale);g.strokeStyle='#5a4a35';g.setLineDash([6,6]);g.beginPath();g.moveTo(0,v.y0);g.lineTo(w,v.y0);g.stroke();g.setLineDash([]);
    g.font='12px Arial';g.textAlign='right';g.fillStyle='#cfba85';g.fillText('FRONT →',w-8,h-8);
    // (where each entry is drawn: its place, or on its way there; the one dragged where it is held)
    let moving=false;const off={};for(const id of ids){const t=L.span[id].c;let s=d&&d.id===id?d.s:this.shown[id]??t;if(!(d&&d.id===id))s=still?t:s+(t-s)*C.slide;if(Math.abs(t-s)<.2)s=t;else moving=true;this.shown[id]=s;off[id]=s-t}
    const flags={},men=L.men.map(m=>({...m,x:this.xAt(m.s+off[m.row.id],v),y:v.y0-m.side*v.scale,f:marchMan(m.row,m.i,flags[m.row.id]||(flags[m.row.id]=marchFlagMen(m.row)))})).sort((a,b)=>a.y-b.y||a.x-b.x),box0={};
    const S=[];for(const m of L.men)S[m.rank]=m.s;const half=(r,e)=>{const n=S[r+e]??S[r-e];return n==null?4:Math.abs(n-S[r])/2},R=C.road*v.scale,on=id=>id===this.pick||d?.id===id,ground={};
    for(const m of men){const x0=Math.round(m.x-half(m.rank,1)*v.scale),x1=Math.round(m.x+half(m.rank,-1)*v.scale),y0=m.side<0?v.y0:v.y0-R,y1=m.side>0?v.y0:v.y0+R,id=m.row.id,b=ground[id]||(ground[id]={x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity});
      g.fillStyle=on(id)?C.on:C.shade[ids.indexOf(id)%2];g.fillRect(x0,y0,x1-x0,y1-y0);b.x0=Math.min(b.x0,x0);b.x1=Math.max(b.x1,x1);b.y0=Math.min(b.y0,y0);b.y1=Math.max(b.y1,y1)}
    for(const m of men){const fh=m.f.s.height*k,b=box0[m.row.id]||(box0[m.row.id]={y0:Infinity});b.y0=Math.min(b.y0,m.y-fh)}
    ids.forEach((id,j)=>{const b=ground[id],x=(b.x0+b.x1)/2,y=j%2===0?box0[id].y0-8:b.y1+16;if(on(id)){g.strokeStyle='#ffe09a';g.lineWidth=2;g.strokeRect(b.x0+1,b.y0+1,b.x1-b.x0-2,b.y1-b.y0-2)}
      g.textAlign='center';g.fillStyle='#211c18';g.fillRect(x-9,y-11,18,15);g.fillStyle=on(id)?'#ffe09a':'#eee0bc';g.fillText(String(j+1),x,y)});
    for(const m of men){const f=m.f,fw=f.s.width*k,fh=f.s.height*k,bx=m.x-fw/2,by=m.y-fh;g.globalAlpha=d&&d.id===m.row.id?.8:1;marchFlagDraw(g,f,bx,by,k,false);g.drawImage(f.s,bx,by,fw,fh);marchFlagDraw(g,f,bx,by,k,true)}g.globalAlpha=1;
    g.restore();
    const label=document.getElementById('columnLabel');if(label&&!d)label.textContent=this.caption();
    if(moving&&!this.frame)this.frame=requestAnimationFrame(()=>{this.frame=0;this.draw()});
  }
}
onAct('march-',(a,arg)=>{
  if(a==='march-open')return openMarch();if(G.mode!=='char')return;
  if(a==='march-view'){if(MARCH_VIEWS.some(([k])=>k===arg))partyView().march=arg;renderMarch();return}
  if(a.startsWith('march-col-')){G.column?.act(a.slice(10),arg);return}
  const s=G.march;if(!s)return;
  if(a==='march-apply'){marchDraftClamp();P.army.march=Object.fromEntries(Object.entries(s.draft).map(([id,p])=>[id,{x:p.x,y:p.y,face:p.face||0}]));for(const g of partyRoster(P).groups){const p=s.draft[g.id];if(p){g.form=p.form;g.files=p.files}}G.march=null;renderMarch();return}
  if(a==='march-range'){s.range=!s.range;renderMarch();return}
  if(a==='march-undo'){if(s.history.length)s.draft=s.history.pop();renderMarch();return}
  if(a==='march-reset-selected'){const before=structuredClone(s.draft);s.draft[s.sel]=marchDefaults()[s.sel];marchDraftClamp();marchRemember(before);renderMarch();return}
  if(a==='march-tool'){s.tool=arg==='form'?'form':'move';renderMarch();return}
  if(a==='march-form'){const row=marchDraftRows().find(r=>r.id===s.sel);if(!marchFormFits(row,arg))return;const before=structuredClone(s.draft);Object.assign(s.draft[s.sel],{form:arg,files:arg==='wedge'?null:FORMS[arg].files});marchDraftClamp();marchRemember(before);renderMarch();return}
  // (Discard: the draft dropped, the saved formation shown again)
  if(a==='march-back'){G.march=null;renderMarch();return}
  if(a==='march-select'&&s.draft[arg]){s.sel=arg;renderMarch();return}
  if(a==='march-reset'){const before=structuredClone(s.draft);s.draft=marchDefaults();marchDraftClamp();marchRemember(before);renderMarch();return}
  if(a==='march-step'){const before=structuredClone(s.draft),p=s.draft[s.sel],d={up:[0,-2],down:[0,2],left:[-2,0],right:[2,0]}[arg];if(!d)return;const row=marchDraftRows().find(r=>r.id===s.sel),q=marchPlace({...row,face:p.face??row.face},p.x+d[0],p.y+d[1],marchDraftOuter());p.x=q.x;p.y=q.y;marchRemember(before);renderMarch()}
});
