'use strict';
/* ---------- under way (the owner, 2026-10-30: "staying should be more compact and use less space, at a corner of the screen; a
   panel that groups all the special actions"): on the world map, under the minimap, one small box of what your band is doing
   that lasts (recruiting volunteers, or the chance to; staying in a holding, in camp or making for it, following, by road, a siege or a raid of yours), each a
   line and its one way out. Each kind a row of UNDERWAY: on() its state (falsy: not shown), its icon (cls: uw-live, a pulse while it runs), line and
   button (off: why it cannot be pressed now, shown in its tooltip). ---------- */
const UNDERWAY=[
  {k:'stay',on:()=>stayTown(),ico:'house',line:t=>'<b>'+t.name+'</b>, '+(stayFree(t)?'free':stayCost()+'g/day')+(siegeLordsAt(t).length?', <span class="bad">besieged</span>':''),
   title:t=>'Staying in '+t.name+(stayFree(t)?': free, as long as you like':': '+stayCost()+'g a day; your gold lasts until Day '+stayUntil()),btn:['sy-leave','Leave']},
  {k:'recruit',on:()=>P.recruit&&townBy(P.recruit.town),ico:'recruit',cls:'uw-live',line:t=>'<b>Recruiting</b>, '+t.name+', +'+P.recruit.n,title:t=>P.recruit.n+' joined so far. Volunteers from '+t.name+' join your groups for free, about '+volunteerRate(t).toFixed(1)+' an hour, while you stay or camp on its lands',btn:['uw-vstop','Stop']},
  {k:'volunteers',on:()=>!P.recruit&&(P.camp||P.stay)&&volunteerTown(),ico:'recruit',line:t=>'<b>Volunteers</b>, '+t.name,title:t=>volunteerWhy(t)||'Its people would join you for free to refill your groups: about '+volunteerRate(t).toFixed(1)+' an hour',btn:['uw-vgo','Recruit'],off:t=>volunteerWhy(t)},
  {k:'camp',on:()=>P.camp,ico:'fire',line:()=>'<b>In camp</b>'+(P.recruit?' '+icon('recruit',12,'gico uw-live')+' <small>recruiting</small>':''),title:()=>'Your band rests: stamina comes back faster and the wounded mend (Z)',btn:['uw-camp','Break']},
  {k:'pitch',on:()=>!P.camp&&G.pitch,ico:'fire',line:()=>'<b>Making camp</b>',title:()=>'Your band makes for clear ground to camp',btn:['uw-pitch','Stop']},
  {k:'follow',on:()=>G.follow,ico:'shoe',line:f=>'<b>'+followName(f.o,true)+'</b>',title:f=>'Following '+followName(f.o)+': your band keeps after it at a distance (any other order ends it)',btn:['uw-follow','Stop']},
  // (in column: your army marching in one now, marchstyles.js TravelStyle)
  {k:'road',on:()=>P.byRoad,ico:'map',line:()=>'<b>By road</b>'+(TravelStyle.column(P)?', in column':''),title:()=>'Every way you go keeps to the roads and tracks when one is within '+ROAD_GO.near+' tiles, your band in a column on them, two abreast (B)',btn:['uw-road','Off']},
  {k:'siege',on:()=>P.siege&&townBy(P.siege.town),ico:'ladder',line:t=>'<b>'+t.name+'</b>, siege, day '+P.siege.days,title:t=>'Your band besieges '+t.name,btn:['uw-siege','Open']},
  {k:'raid',on:()=>P.raid&&townBy(P.raid.town),ico:'axe',line:t=>'<b>'+t.name+'</b>, raid '+Math.min(100,Math.round(P.raid.t/RAID_TIME*100))+'%',title:t=>'Your band plunders '+t.name,btn:['uw-siege','Open']},
];
const UW={el:null};
// (where it stands: just under the minimap's frame (render.js drawMapFrame, UW_FRAME game px round its map), as wide as it, its
// edges the frame's (the owner, 2026-11-01: "the ui is a bit off"), never narrower than UW_MIN px; clear of a phone's notch)
const UW_FRAME=2,UW_MIN=168;
// (no narrower than UW_MIN, nor wider than 40% of a narrow screen: a phone held upright; the minimap as wide, render.js worldMiniRect)
const uwMin=()=>Math.min(UW_MIN,Math.floor(innerWidth*.4));
function uwPlace(el,host){if(!WM)return;const r=worldMiniRect(),c=cv.getBoundingClientRect(),h=host.getBoundingClientRect(),k=c.width/VW,f=UW_FRAME;
  el.style.top=Math.round(c.top-h.top+(r.y+r.h+f)*k+4)+'px';el.style.right=Math.max(safeInsets().r+4,Math.round(h.right-c.left-(r.x+r.w+f)*k))+'px';
  el.style.width=Math.max(uwMin(),Math.round((r.w+2*f)*k))+'px'}
// each HUD tick (render.js updateHUD): drawn afresh only when what it shows has changed
function underwayHUD(){
  let el=UW.el;const host=document.querySelector('.hudlayer');if(!host)return;
  if(!el){el=UW.el=document.createElement('aside');el.id='underway';el.className='underway';el.setAttribute('aria-label','Under way');host.appendChild(el);
    el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.stopPropagation();act(b.dataset.act,b.dataset.arg)}})}
  const rows=G.mode==='world'?UNDERWAY.map(R=>{const v=R.on();return v?'<div class="uw-row" data-k="'+R.k+'" title="'+htmlText(R.title(v))+'">'+icon(R.ico,14,R.cls?'gico '+R.cls:'')+'<span>'+R.line(v)+'</span><button type="button" class="btn sm" data-act="'+R.btn[0]+'"'+(R.off&&R.off(v)?' disabled':'')+'>'+R.btn[1]+'</button></div>':''}).join(''):'';
  el.hidden=!rows||G.modal;if(el.hidden){if(el.dataset.sig){el.innerHTML='';el.dataset.sig=''}return}uwPlace(el,host);
  if(el.dataset.sig!==rows){el.innerHTML=rows;el.dataset.sig=rows}
}
onAct('uw-',a=>{
  if(a==='uw-camp')breakCamp();
  else if(a==='uw-pitch'){G.pitch=null;P.tx=P.ty=null}
  else if(a==='uw-follow'&&G.follow)followItem(G.follow.o).run();
  else if(a==='uw-road')setByRoad(false);
  else if(a==='uw-vgo')volunteerStart();
  else if(a==='uw-vstop')volunteerStop();
  if(G.mode==='town'&&(a==='uw-vgo'||a==='uw-vstop'))renderTown();
  else if(a==='uw-siege'){const t=townBy((P.siege||P.raid)?.town);if(t&&G.mode==='world')P.raid?(G.bes=t,G.mode='besiege',showRaid(t)):openSiege(t)}
  updateHUD(true);
});
