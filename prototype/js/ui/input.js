'use strict';
/* ---------- actions ---------- */
function act(a,arg){
  if(a==='begin')return begin(arg);
  if(settingAct(a,arg))return;// (the Settings buttons: ui.js)
  if(routeAct(a,arg)||menuAct(a,arg))return;
  if(a==='race'){G.race=arg;showTitle('new');const b=panel.querySelector('[data-act="race"].on');if(b)b.focus({preventScroll:true});return}
  if(a==='load')return loadGame(arg);
  if(a==='wipe')return wipeSave(arg);
  if(a==='fight'){const e=G.enc;return startBattle({enemies:e.list,tournament:false,lv:e.lv||1,deploy:true})}
  if(a==='auto')return autoResolve();
  if(a==='flee')return flee();
  if(a==='cont'){lootEnd();updateHUD(true);if(G.encAgain){const e=G.encAgain;G.encAgain=null;return startEncounter(e)}// (run down after withdrawing: face them again)
    if(G.capture){toWorld();return showCapture()}return toWorld()}
  if(a==='leave'){if(G.town&&G.town.inScene)return backToScene();G.town=null;G.scene=null;return toWorld()}
  if(a==='back-town'){lootEnd();G.mode='town';renderTown();return}
  if(a==='lord-leave'&&G.mode==='dialog'&&G.town&&!G.town.inScene&&G.enc&&G.enc.ref&&G.enc.ref.inside===G.town.ref.name){G.enc=null;G.mode='town';renderTown();return}// (a court audience: back to the hall)
  if(a==='lord-leave'&&G.scene&&G.mode==='scene'){G.enc=null;return backToScene()}
  if(a==='lord-leave'){const l=G.enc&&G.enc.ref;if(l)l.cool=3;G.enc=null;G.encCool=2;G.mode='world';hidePanel();return}
  if(a==='lord-attack'){const l=G.enc.ref;Timed.of(P,'hostile').set(l.fac,20);addHonor(l.fac,-15,true);log('You attack '+l.name+'. The '+FACS[l.fac].n+' is now hostile to you.','bad');return startEncounter({kind:'lord',ref:l,list:l.troops.slice(),mine:true})}
  if(a.startsWith('q-')){const tq=G.town&&G.town.ref;questAct(a,arg,G.mode==='town'?tq:null);if(a.startsWith('q-lord'))return;updateHUD(true);if(G.mode==='char')return renderChar();if(G.mode==='quests')return renderQuests();if(G.mode==='town')renderTown();return}
  if(charAct(a,arg))return;
  if(G.est&&G.mode==='dialog'&&estateFief(a,arg))return;// (your own estate's window on the map: its building buttons, estates.js)
  const t=G.town&&G.town.ref;if(t)return townAct(a,arg,t);// (the rest: a town's window and its tabs, town.js)
}
panel.addEventListener('click',e=>{if(e.target.closest('[data-recruit-field]'))return;const b=e.target.closest('[data-act]');if(b)act(b.dataset.act,b.dataset.arg)});
function updateRecruitDraft(e){const field=e.target.dataset.recruitField;if(!['hireCount','hireTarget','trainingGroup'].includes(field)||G.mode!=='town'||!G.town)return;
  const value=field==='hireCount'?Number(e.target.value):e.target.value;if(Object.is(G.town[field],value))return;
  G.town[field]=value;G.town.review=null;G.town.recruitNotice='';
  // Keep the input node/focus/caret alive. In particular, blur must not replace the Review button during a click.
  const preview=document.createElement('div');preview.innerHTML=townRecruitControls(G.town.ref,G.town.pick);
  panel.querySelector('.recruit-summary')?.replaceWith(preview.querySelector('.recruit-summary'));
}
panel.addEventListener('input',updateRecruitDraft);
panel.addEventListener('change',updateRecruitDraft);
panel.addEventListener('input',updateCompTransferDraft);
panel.addEventListener('change',updateCompTransferDraft);
document.addEventListener('click',e=>{
  const s=e.target.closest('[data-speed]');if(s){const n=+s.dataset.speed;setSpeed(n===TRAVEL_FAST&&G.speed===n?1:n)}// (Travel fast toggles)
  // (Withdraw on a touch screen: a first tap shows the way off the field (the orders drawer closing, so it can be seen) and is
  // held; a second, or Retreat now beside the preview, withdraws: orderpaths.js WithdrawView)
  const o=e.target.closest('[data-order]');if(o&&!(o.dataset.order==='withdraw'&&(e.pointerType==='touch'||window.mobileBattleHud?.enabled)&&withdrawView.tap()))setOrder(o.dataset.order);
  const g=e.target.closest('[data-grp]');if(g)selectGroup(g.dataset.grp,e.shiftKey);
});
bhudInit();// (the order, flag and formation buttons' icons: battlehud.js)
document.querySelectorAll('[data-form]').forEach(b=>b.addEventListener('click',()=>setForm(b.dataset.form)));
document.querySelectorAll('[data-flag]').forEach(b=>b.addEventListener('click',()=>toggleFlag(b.dataset.flag)));
document.querySelectorAll('[data-bspeed]').forEach(b=>b.addEventListener('click',()=>setBattleSpeed(+b.dataset.bspeed)));
$('#bPause').addEventListener('click',()=>battlePause());
{const b=document.getElementById('bAmove');if(b)b.addEventListener('click',()=>armAttackMove())}// (the next ground order an attack-move: commands.js)
{const b=document.getElementById('bSkills');if(b)b.addEventListener('click',()=>setAutoSkills(!AUTOSK.on))}
$('#hpBtn').addEventListener('click',()=>setHpBars(!HPBARS.on));setHpBars(HPBARS.on);
$('#pause').addEventListener('click',togglePause);pauseUI();
// the dock's tiles: an icon over the name, the key in the corner
document.querySelectorAll('.dbtn[data-ico]').forEach(b=>{b.innerHTML=icon(b.dataset.ico,18)+'<span class="dl">'+b.textContent+'</span>'+(b.dataset.key?'<kbd>'+b.dataset.key+'</kbd>':'')});
$('#saveBtn').addEventListener('click',()=>saveGame(false,'quick'));
// the Game Menu, opened or closed (hub.js; the dock is hidden in battle, where Esc and Tab open it)
$('#menuBtn').addEventListener('click',menuKey);$('#bMenu').addEventListener('click',menuKey);// (the battle's own, for phones: the dock is hidden there)

$('#charBtn').addEventListener('click',()=>{if(G.mode==='char')act('char-close');else if(G.mode==='skills')act('sk-map');else openChar()});// (the Army window, its Skills view too)
$('#campBtn').addEventListener('click',()=>toggleCamp());// (make camp or break it: world/supply.js)
$('#mapBtn').addEventListener('click',()=>fullMapKey());// (the full map opened, or closed: map.js)
$('#helpBtn').addEventListener('click',()=>{if(G.mode==='help')closeOver();else openHelp()});
$('#journalBtn').addEventListener('click',()=>journalKey());// (the Journal opened, or closed: journal.js)
$('#fsBtn').addEventListener('click',toggleFull);
// the map's zoom buttons (shown on the map only: style.css), each dimmed at its end of the range (core.js mapZoom)
$('#zoomIn').addEventListener('click',()=>{if(G.mode==='world'&&!G.modal)mapZoom(1)});$('#zoomOut').addEventListener('click',()=>{if(G.mode==='world'&&!G.modal)mapZoom(-1)});
function zoomUI(){const i=$('#zoomIn'),o=$('#zoomOut'),Z=MAPZOOM,s=Z.map?VS:Z.auto;if(i)i.disabled=s>=Z.hi;if(o)o.disabled=s<=Z.lo}
zoomUI();
document.addEventListener('fullscreenchange',fitScreen);
$('#skillBtn').addEventListener('click',()=>{if(G.mode==='skills')act('sk-map');else openSkills()});// (your hero's Skills, in the Army window)
$('#invBtn').addEventListener('click',()=>{if(G.mode==='inv')act('inv-close');else openInv()});
/* the manual control's buttons (Attack, the skill slots, Dodge, Block), set aside for now with it (RTS command: battle.js)
$('#swing').addEventListener('click',swing);
document.querySelectorAll('[data-skill]').forEach(b=>b.addEventListener('click',()=>dodge()));
document.addEventListener('click',e=>{const s=e.target.closest&&e.target.closest('[data-slot]');if(s&&B)castSlot(+s.dataset.slot)});
const blk=$('#block');
blk.addEventListener('pointerdown',()=>{if(B)B.touchBlock=true});
['pointerup','pointerleave','pointercancel'].forEach(ev=>blk.addEventListener(ev,()=>{if(B)B.touchBlock=false}));
*/
/* ---------- input ---------- */
// (in the canvas's own pixels: the screen's game pixels (the world map's canvas has CVS of its own to one: core.js), or the
// battlefield's in a battle)
function toCanvas(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width/CVS,y:(e.clientY-r.top)*cv.height/r.height/CVS}}
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;ringMove(e);
  // the tooltip: what is under the pointer on the map
  const tip=$('#tip');if(holdCardUp()&&e.pointerType==='touch')return;// (a long press's card stays until the next tap: below)
  if(G.mode!=='world'||G.modal||e.pointerType==='touch'){tip.hidden=true;return}
  const o=pickAt(G.cam.x+p.x,G.cam.y+p.y),h=o&&tipFor(o)||rumourTip(G.cam.x+p.x,G.cam.y+p.y)||trackTip(G.cam.x+p.x,G.cam.y+p.y);if(!h){tip.hidden=true;return}// (nothing there: a rumour's "?", news.js; else tracks you see, world/tracks.js)
  tip.innerHTML=h;tip.classList.remove('hold');tip.hidden=false;const r=cv.getBoundingClientRect(),x=e.clientX-r.left+16,y=e.clientY-r.top+14;
  tip.style.left=Math.min(x,r.width-tip.offsetWidth-6)+'px';tip.style.top=Math.min(y,r.height-tip.offsetHeight-6)+'px'});
cv.addEventListener('pointerleave',()=>{ringDrop();G.mouse.in=false;if(!holdCardUp())hideTip();if(B)B.hov=null;cv.style.cursor=''});
cv.addEventListener('pointerdown',e=>{
  const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  if(ActionRing.now){const o=partyAgain(p);ringTapOut();if(o)worldApproach(o,true);return}// (the action ring open: a press outside it only closes it, ring.js; on the party whose ring a click just opened, it approaches it: partyAgain)
  if(G.modal)return;
  if(G.mode==='world'&&!G.place&&e.button===0&&fullMapHit(p)){fullMapOpen();return}// (a click or a tap on the minimap: the full map, map.js)
  if(e.pointerType==='touch'&&touchDown(e,p))return;// (a finger in battle or on the map: below; it acts when it lifts)
  if(G.mode==='world'){const wx=G.cam.x+p.x,wy=G.cam.y+p.y;if(G.place){if(e.button===2){G.place=null;toast('You stop placing.')}else placeClick(wx,wy);return}if(P.stay)return stayClick(wx,wy);
    if(e.button===0)ringPress(e,wx,wy);else worldMove(wx,wy)}// (the left button: nothing yet; let go, you travel (on a party, its ring: worldGo); held still, the action ring: ring.js. The right one travels, or chases, at once)
  else if(G.mode==='scene')sceneClick(p.x,p.y);
  // battle: RTS command (commands.js): left-click or drag to select, right-click to move or attack (a touch: select, then a
  // second touch sends them)
  // (the camera, camera.js: the middle button pans, a click on the small map looks there; every point is on the field)
  else if(G.mode==='battle'&&B){const mh=miniHit(p),q=toField(p);
    if(e.button===0&&B.rdrag){B.rdrag=null;return}// (a left-click during a right-drag calls it off: dragCancel below)
    if(e.button===1&&B.cam){e.preventDefault();B.cam.drag={x:p.x,y:p.y}}
    else if(mh&&e.button===0)camCentre(mh.x,mh.y);
    else if(e.button===2&&e.pointerType==='mouse'){B.rdrag={x0:q.x,y0:q.y,x1:q.x,y1:q.y,shift:e.shiftKey};if(e.ctrlKey)B.rdrag.am=true}// (let go: an order, or a line if dragged; Ctrl: an attack-move)
    else if(e.pointerType!=='mouse'&&B.sel!=='all'&&selGroups().length&&!rtsUnitAt(q.x,q.y,0))rtsOrder(q.x,q.y)
    else if(e.button===0)B.box={x0:q.x,y0:q.y,x1:q.x,y1:q.y,add:e.shiftKey}
    /* the manual control, set aside for now: if(e.pointerType==='mouse'){if(e.button===2)shove();else if(e.button===0){if(isBow())drawStart();else swing()}}else B.mt={x:p.x,y:p.y} */}
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
// the bow: let go of the button (anywhere) to shoot; the wheel sets the angle
window.addEventListener('pointerup',e=>{if(e.pointerType==='touch'&&touchUp(e))return;if(e.button===0&&ringUp(e))return;
  if(e.button===1&&B&&B.cam&&B.cam.drag){B.cam.drag=null;return}
  if(e.button===2&&B&&B.rdrag){const d=B.rdrag;B.rdrag=null;
  if(Math.hypot(d.x1-d.x0,d.y1-d.y0)>=FORM_DRAG)formDragTo(d.x0,d.y0,d.x1,d.y1,{amove:d.am});
  else{const L=B.lastRc,now=performance.now(),dbl=!!L&&now-L.t<350&&Math.hypot(L.x-d.x0,L.y-d.y0)<16;B.lastRc={t:now,x:d.x0,y:d.y0};rtsOrder(d.x0,d.y0,{queue:d.shift,run:dbl,amove:d.am})}return}
  if(e.button===0&&B&&B.box){const b=B.box;B.box=null;rtsSelect(b.x0,b.y0,b.x1,b.y1,b.add)}/* (the bow, set aside:) if(e.button===0&&B&&B.draw)drawRelease() */});
cv.addEventListener('pointermove',e=>{if(G.mode!=='battle'||!B)return;const p=toCanvas(e);
  {const q=toField(p);B.hov=q;{const ic=iconAt(q.x,q.y);B.iconHov=ic?ic.g:null}cv.style.cursor=B.amArm||B.sel!=='all'&&selGroups().length&&rtsUnitAt(q.x,q.y,1)?'crosshair':rtsUnitAt(q.x,q.y,0)?'pointer':''}// (what you point at: a ring, battlehud.js)
  if(B.cam&&B.cam.drag){camPan(B.cam.drag.x-p.x,B.cam.drag.y-p.y);B.cam.drag={x:p.x,y:p.y};return}// (middle-drag: pan)
  if(B.rdrag&&e.pointerType==='mouse'&&e.buttons&1){B.rdrag=null;return}// (the left button pressed mid right-drag comes as a move: called off)
  if(B.box||B.rdrag){const q=toField(p),o=B.box||B.rdrag;o.x1=q.x;o.y1=q.y}});
// a drag under way in battle called off (Esc; a left-click during a right-drag; a second finger: touchDown): the line ghost,
// the box or the finger's press gone, nothing sent, the selection kept; letting go after it does nothing. True if there was one
function dragCancel(){if(G.mode!=='battle'||!B||!(B.rdrag||B.box||TOUCH.lp))return false;touchDrop();B.rdrag=null;B.box=null;return true}
// the map's click or tap (ring.js ringUp, touchUp): on another party, its ring (partyRing); else worldMove
const WORLD_CLICK={dbl:400,r:18};
function worldGo(wx,wy){
  if(G.mode!=='world'||G.modal)return;
  const was=!!G.hurry,last=G.travelClick,now=performance.now(),box=cv.getBoundingClientRect(),sx=(wx-G.cam.x)*box.width/VW,sy=(wy-G.cam.y)*box.height/VH;
  if(was)setHurry(false);if(partyRing(pickAt(wx,wy))){G.travelClick=null;return}
  const twice=!was&&last&&now-last.t<=WORLD_CLICK.dbl&&Math.hypot(sx-last.x,sy-last.y)<=WORLD_CLICK.r;
  worldMove(wx,wy);G.travelClick=twice||was?null:{x:sx,y:sy,t:now};
  if(twice&&G.mode==='world'&&!G.modal&&(P.tx!=null||G.chase))setHurry(true);
}
// travel to a point, or meet what is there (Follow ends: world.js followStop)
// (a new trip: by road, if that mode is on, asks again whether a road is near: world.js byRoadTo)
function worldMove(wx,wy){if(G.hurry)setHurry(false);G.travelClick=null;followStop();G.pitch=null;G.byRoad=null;if(!(clickAt(wx,wy)||G.chase)){P.tx=clamp(wx,8,MW*TILE-8);P.ty=clamp(wy,8,MH*TILE-8);P.stuck=0}wuiClick(wx,wy)}// (the click's ripple: worldui.js)
/* a click or a tap on another party (the owner, 2026-10-23: Follow "can be used when you click at the other unit in the world
   map"): its ring at it (ActionRing; supply.js partyRingItems: Approach, today's chase, Follow, Look), nothing done yet; Esc or a
   press elsewhere closes it (ring.js). A second press on it within PARTY_CLICK.dbl ms (a double click or tap) approaches it at
   once, as one click did before. Which: world.js FOLLOW.kinds, not in a fight (a click on a fight meets it). last: the ring a
   click opened, its party, when */
const PARTY_CLICK={dbl:400,r:16,last:null};
function partyRing(o){if(!o||!FOLLOW.kinds.includes(objKind(o))||o.fight||G.mode!=='world'||G.modal)return false;
  const r=cv.getBoundingClientRect(),cx=r.left+(o.x-G.cam.x)*r.width/VW,cy=r.top+(o.y-6-G.cam.y)*r.height/VH,items=partyRingItems(o,cx,cy);if(!items.length)return false;
  const R=new ActionRing(cx,cy,items).open();PARTY_CLICK.last={R,o,t:performance.now()};return true}
// (a press at canvas point p with a ring open: the party it is on, if a click opened that ring on it within PARTY_CLICK.dbl ms)
function partyAgain(p){const q=PARTY_CLICK.last;PARTY_CLICK.last=null;if(!q||ActionRing.now!==q.R||performance.now()-q.t>PARTY_CLICK.dbl||G.mode!=='world'||G.modal||!objKind(q.o))return null;
  const wx=G.cam.x+p.x,wy=G.cam.y+p.y;return pickAt(wx,wy)===q.o||Math.hypot(wx-q.o.x,wy-q.o.y)<PARTY_CLICK.r?q.o:null}
// its ring's Approach (or the double click): today's chase of o, or met at once beside it (world.js approach)
function worldApproach(o,hurry=false){if(G.hurry)setHurry(false);G.travelClick=null;followStop();G.pitch=null;G.byRoad=null;approach(o);if(hurry&&G.mode==='world'&&!G.modal&&(P.tx!=null||G.chase))setHurry(true);wuiClick(o.x,o.y)}
/* ---------- touch (a phone on its side): Pointer Events with pointerType 'touch' only; the mouse, pen and keys above are as they were.
   Battle: a tap selects and a tap again sends, as before (now when the finger lifts); a long press (TOUCH.hold ms, the finger
   within TOUCH.slop CSS px) sends the selection there, or onto the enemy under it; a long press then a drag lays the line, as a
   right-drag does (where, how wide, facing); a drag before it boxes groups. Two fingers: pinch to zoom about their middle, move
   both to pan; a second finger calls off whatever the first was doing, and a pinch never selects or orders.
   Map: a tap travels when the finger lifts (as a click does when the button is let go: ring.js); a long press opens the action ring
   (its Look shows the card of what is there, which the next tap puts away, travelling nowhere) ---------- */
// hold: ms to a long press; slop: CSS px a finger may wander in it; ring: the filling ring's radius (CSS px, round the finger)
const TOUCH={hold:450,slop:10,ring:34,pts:new Map(),lp:null,pinch:null,spent:new Set()};
const touchSpan=()=>{const [a,b]=[...TOUCH.pts.values()];return Math.max(1,Math.hypot(a.cx-b.cx,a.cy-b.cy))};// (two fingers apart, CSS px: the map's pinch)
const touchMid=()=>{const [a,b]=[...TOUCH.pts.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}};
const holdCardUp=()=>{const t=$('#tip');return!!t&&!t.hidden&&t.classList.contains('hold')};
// the press under way (TOUCH.lp) dropped: its box or line gone, nothing sent
function touchDrop(){const l=TOUCH.lp;if(!l)return;clearTimeout(l.timer);TOUCH.lp=null;if(l.mode==='battle'&&B&&B===l.B){if(l.box)B.box=null;if(l.armed)B.rdrag=null}}
function touchDown(e,p){const T=TOUCH,id=e.pointerId;
  if(e.isPrimary&&T.pts.size){touchDrop();T.pts.clear();T.spent.clear();T.pinch=null}// (the first finger of a new touch: anything a lost lift left behind goes)
  if(G.mode==='world'){if(holdCardUp()){hideTip();touchDrop();T.pts.set(id,p);T.spent.add(id);return true}if(G.place||P.stay)return false;// (the card up: this tap only puts it away)
    p.cx=e.clientX;p.cy=e.clientY;T.pts.set(id,p);if(T.pts.size>1){touchDrop();T.spent.add(id);if(T.pts.size===2){for(const k of T.pts.keys())T.spent.add(k);T.pinch={map:true,d0:touchSpan()}}return true}// (two fingers: a pinch, never a tap: zooms the map by steps, touchMove)
    T.lp={id,mode:'world',cx:e.clientX,cy:e.clientY,wx:G.cam.x+p.x,wy:G.cam.y+p.y,t0:performance.now()};touchTimer();return true}
  if(G.mode!=='battle'||!B)return false;T.pts.set(id,p);
  if(T.pts.size===2){touchDrop();for(const k of T.pts.keys())T.spent.add(k);const m=touchMid();T.pinch={d0:m.d,z0:B.cam?B.cam.z:1,w:toField(m)};return true}
  if(T.pts.size>2){T.spent.add(id);return true}
  {const mh=miniHit(p);if(mh){camCentre(mh.x,mh.y);T.spent.add(id);return true}}// (the small map: look there)
  T.lp={id,mode:'battle',B,cx:e.clientX,cy:e.clientY,q:toField(p),t0:performance.now()};touchTimer();return true}
function touchTimer(){const l=TOUCH.lp;l.timer=setTimeout(()=>touchTick(performance.now()),touchHold(l)+5)}
// (a press's time: the map's ring, RING.hold, ring.js; the battle's order, TOUCH.hold)
const touchHold=l=>l.mode==='world'?RING.hold:TOUCH.hold;
// the press comes due at time now (its timer; a move or the lift if the timer is late): in battle the order is armed (a line
// to drag from there), on the map the action ring opens there (ring.js; its Look shows the card of what is under it; nothing
// to do there: the lift still travels)
function touchTick(now){const l=TOUCH.lp;if(!l||l.armed||l.box||l.off||now-l.t0<touchHold(l))return false;
  if(l.mode==='battle'){if(B!==l.B||G.mode!=='battle'){touchDrop();return false}l.armed=true;B.box=null;B.rdrag={x0:l.q.x,y0:l.q.y,x1:l.q.x,y1:l.q.y,shift:false}}
  else{if(!(G.mode==='world'&&!G.modal&&ringOpen(l.cx,l.cy,l.wx,l.wy))){l.off=true;return false}l.armed=true}
  try{if(navigator.vibrate)navigator.vibrate(12)}catch(err){}return true}
function touchMove(e,p){const T=TOUCH,pt=T.pts.get(e.pointerId);if(!pt)return;pt.x=p.x;pt.y=p.y;pt.cx=e.clientX;pt.cy=e.clientY;
  // (the map: a step in or out each time the fingers are MAPZOOM.PINCH times as far apart, or as near, as at the last step)
  if(T.pinch&&T.pinch.map){if(T.pts.size>=2&&G.mode==='world'&&!G.modal){const d=touchSpan(),r=d/T.pinch.d0;if(r>=MAPZOOM.PINCH||r<=1/MAPZOOM.PINCH){mapZoom(r>1?1:-1);T.pinch.d0=d}}return}
  if(T.pinch){if(T.pts.size>=2&&B&&G.mode==='battle'){const m=touchMid();if(B.world){const r=m.d/T.pinch.d0;if(r>=MAPZOOM.PINCH||r<=1/MAPZOOM.PINCH){camZoom(r>1?1:-1);T.pinch.d0=m.d;T.pinch.z0=B.cam.z;T.pinch.w=toField(m)}else camPinch(T.pinch.w,T.pinch.z0,m.x,m.y)}else camPinch(T.pinch.w,T.pinch.z0*m.d/T.pinch.d0,m.x,m.y)}return}
  const l=T.lp;if(!l||l.id!==e.pointerId)return;touchTick(performance.now());
  if(l.armed||l.box||Math.hypot(e.clientX-l.cx,e.clientY-l.cy)<=T.slop)return;
  if(l.mode==='world'){l.off=true;return}// (wandered: no card; the lift still travels to where it went down)
  if(B===l.B){l.box=true;const q=toField(p);B.box={x0:l.q.x,y0:l.q.y,x1:q.x,y1:q.y,add:false}}}
// a finger lifts (cancel: the browser took it): what the press was comes about; true when it was a touch of ours
function touchUp(e,cancel){const T=TOUCH,id=e.pointerId;if(!T.pts.has(id))return false;T.pts.delete(id);if(T.pinch&&T.pts.size<2)T.pinch=null;
  if(T.spent.delete(id))return true;const l=T.lp;if(!l||l.id!==id)return true;
  if(cancel){touchDrop();return true}touchTick(performance.now());clearTimeout(l.timer);T.lp=null;
  if(l.mode==='world'){if(l.armed)ringUp(e);else if(G.mode==='world'&&!G.modal)worldGo(l.wx,l.wy);return true}// (let go over a ring's button: picked)
  if(B!==l.B||G.mode!=='battle')return true;const q=l.q;
  if(l.armed){const d=B.rdrag;B.rdrag=null;if(d&&Math.hypot(d.x1-d.x0,d.y1-d.y0)>=FORM_DRAG)formDragTo(d.x0,d.y0,d.x1,d.y1);else rtsOrder(q.x,q.y);return true}
  if(l.box){const b=B.box;B.box=null;if(b)rtsSelect(b.x0,b.y0,b.x1,b.y1,false);return true}
  if(B.sel!=='all'&&selGroups().length&&!rtsUnitAt(q.x,q.y,0))rtsOrder(q.x,q.y);else rtsSelect(q.x,q.y,q.x,q.y,false);return true}// (a tap: as it always was)
cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch')touchMove(e,toCanvas(e))});
window.addEventListener('pointercancel',e=>{if(e.pointerType==='touch')touchUp(e,true);else if(RING.press?.id===e.pointerId)ringDrop()});
// anything else pressed puts the card away
document.addEventListener('pointerdown',e=>{if(e.target!==cv&&holdCardUp())hideTip()},true);
// the screen's safe area (clear of a notch, rounded corners, a home bar), CSS px: style.css --sa-*, read off the HUD layer's
// padding (its children are placed against its padding box, so the padding moves nothing)
function safeInsets(){const h=$('.hudlayer'),s=h&&getComputedStyle(h),n=v=>parseFloat(v)||0;return s?{t:n(s.paddingTop),r:n(s.paddingRight),b:n(s.paddingBottom),l:n(s.paddingLeft)}:{t:0,r:0,b:0,l:0}}
// the card: over the finger (not under it), kept on the screen and in its safe area; 'Tap' where the tooltip says 'Click'
// a finger held on a button and let go on it still presses it (phones drop the click of a held tap); not a battle card's, whose
// long press shows its card (battlehud.js)
{let down=null,pend=null;
 document.addEventListener('pointerdown',e=>{const b=e.pointerType==='touch'&&e.target.closest('button:not(.ucard)');down=b?{b,x:e.clientX,y:e.clientY,t:performance.now()}:null},true);
 document.addEventListener('click',()=>{if(pend)pend.clicked=true},true);
 document.addEventListener('pointerup',e=>{const h=down;down=null;if(!h||e.pointerType!=='touch'||performance.now()-h.t<TOUCH.hold||Math.hypot(e.clientX-h.x,e.clientY-h.y)>TOUCH.slop||document.elementFromPoint(e.clientX,e.clientY)?.closest('button')!==h.b)return;
  pend=h;setTimeout(()=>{if(!h.clicked&&!h.b.disabled&&h.b.isConnected)h.b.click();if(pend===h)pend=null},80)},true)}
function holdCard(h,cx,cy){const tip=$('#tip'),r=cv.getBoundingClientRect(),sa=safeInsets();tip.innerHTML=h.replace(/>Click:/g,'>Tap:');tip.classList.add('hold');tip.hidden=false;
  const w=tip.offsetWidth,ht=tip.offsetHeight,x=cx-r.left,y=cy-r.top,up=y-ht-TOUCH.ring,L=6+sa.l,T=6+sa.t;
  tip.style.left=clamp(x-w/2,L,Math.max(L,r.width-w-6-sa.r))+'px';tip.style.top=(up>=T?up:clamp(y+TOUCH.ring,T,Math.max(T,r.height-ht-6-sa.b)))+'px'}
// iOS Safari ignores user-scalable=no: a pinch begun on the HUD or a window would zoom the whole page. Its own gesture events
// (iOS only; other browsers never send them) are stopped; the game's pinch reads pointers and windows still scroll (style.css
// touch-action)
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>{if(e.cancelable)e.preventDefault()},{passive:false}));
// The long press progress over the finished frame (render.js frame): a ring round the finger, wider than it, gold, red on an
// enemy; full once armed. From 90 ms, so a quick tap shows nothing
function drawTouchHold(now=performance.now()){const l=TOUCH.lp;if(!l||G.mode!=='battle'||G.modal||l.mode!=='battle'||l.B!==B||l.box||l.off)return false;const t=now-l.t0;if(!l.armed&&t<90)return false;
  const r=cv.getBoundingClientRect();if(!r.width||!r.height)return false;const x=l.cx-r.left,y=l.cy-r.top,R=TOUCH.ring,col=rtsUnitAt(l.q.x,l.q.y,1)?'255,106,90':'232,185,74',f=l.armed?1:clamp(t/TOUCH.hold,0,1);
  ctx.save();try{ctx.setTransform(cv.width/r.width,0,0,cv.height/r.height,0,0);ctx.lineWidth=3;ctx.lineCap='round';ctx.strokeStyle='rgba(10,12,18,.45)';ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba('+col+','+(l.armed?1:.85)+')';ctx.beginPath();ctx.arc(x,y,R,-Math.PI/2,-Math.PI/2+f*Math.PI*2);ctx.stroke();
    if(l.armed){ctx.fillStyle='rgba('+col+',.9)';ctx.beginPath();ctx.arc(x,y,2.5,0,Math.PI*2);ctx.fill()}
  }finally{ctx.restore()}return true;
}
// the wheel zooms the battle toward the cursor (camera.js); on the map a step a notch, one each MAPZOOM.WHEEL ms at most (core.js)
cv.addEventListener('wheel',e=>{if(G.mode==='battle'&&B&&!G.modal){e.preventDefault();const p=toCanvas(e);camZoom(e.deltaY<0?1:-1,p.x,p.y)}
  else if(G.mode==='world'&&!G.modal&&e.deltaY){e.preventDefault();const now=performance.now();if(now-MAPZOOM.wt>=MAPZOOM.WHEEL){MAPZOOM.wt=now;mapZoom(e.deltaY<0?1:-1)}}},{passive:false});
// the arrow keys pan while held
window.addEventListener('keyup',e=>{if(B&&B.cam){const k=keyOf(e);if(k.startsWith('arrow'))B.cam.keys[k]=false}});
window.addEventListener('blur',()=>{ringDrop();touchDrop();TOUCH.pts.clear();TOUCH.spent.clear();TOUCH.pinch=null;if(B&&B.cam)B.cam.keys={}});
/* (the bow's angle on the wheel, set aside with the manual control:) cv.addEventListener('wheel',e=>{if(G.mode==='battle'&&B&&isBow()){e.preventDefault();bowRangeStep(e.deltaY<0?15:-15)}},{passive:false}); */
// keys are read by physical position (e.code), so WASD and the hotkeys work on any keyboard layout, Thai included
function keyOf(e){const c=e.code||'';
  if(c.startsWith('Key'))return c.slice(3).toLowerCase();if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad')&&/\d$/.test(c))return c.slice(-1);
  if(c.startsWith('Arrow'))return c.toLowerCase();if(c.startsWith('Shift'))return 'shift';if(c==='Escape')return 'escape';return (e.key||'').toLowerCase()}
window.addEventListener('keydown',e=>{
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const k=keyOf(e);
  if(e.key==='F6'){e.preventDefault();saveGame(false,'quick');return}
  if(k==='tab'&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.shiftKey&&!G.modal&&['world','scene','battle'].includes(G.mode)){e.preventDefault();if(!e.repeat)menuKey();return}// Tab: the Game Menu (hub.js; in a window, the menu too, Tab moves between its buttons)
  if(k==='escape'){e.preventDefault();if(window.battleArmyHud?.close()||window.mobileBattleHud?.close()||window.mobileWorldHud?.close()||ActionRing.close()||dragCancel())uiSfx('back');else if(G.mode==='battle'&&B&&B.amArm){armAttackMove(false);uiSfx('back')}else onEscape();return}// (a drag first, then an armed attack-move: Esc calls it off and nothing else)
  if(k==='m'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(!e.repeat){if(e.shiftKey)toggleMute();else fullMapKey()}return}// M: the full map (map.js); Shift+M: the sound off or on, anywhere (ui.js)
  if(/^[0-9]$/.test(k)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&G.mode!=='battle'&&railKey(k)){e.preventDefault();return}// a number: a place on the window's rail (window.js)
  if(/^[qwer]$/.test(k)&&!e.ctrlKey&&!e.metaKey&&!e.altKey&&!e.repeat&&G.mode!=='battle'&&railActKey(k)){e.preventDefault();return}// Q, W, E, R: the window's key actions (window.js)
  if(G.mode==='battle'&&B){
    // the battle's speed: Space pauses (orders still go: a tactical pause), [ and ] slow it down and speed it up
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)battlePause();return}
    if(!e.repeat&&(k==='['||k===']')){battleSpeedStep(k==='['?-1:1);return}
    // 1–9/0 select the ten army cards; Ctrl stores an override selection. Double-tap centres the camera.
    const twice=()=>{const now=performance.now(),L=B.lastKey;B.lastKey={k,t:now};if(L&&L.k===k&&now-L.t<BCAM.dbl)camLookAt(selGroups())};
    if(!e.repeat&&k==='a'&&(e.ctrlKey||e.metaKey)){e.preventDefault();B.sel='all';setOrderUI();return}// Ctrl+A: every group (a click on empty ground selects none)
    if(!e.repeat&&/^[0-9]$/.test(k)){e.preventDefault();ctrlGroup(k,e.ctrlKey||e.metaKey);if(!e.ctrlKey&&!e.metaKey)twice();return}
    // the camera: arrows pan (held), + and - zoom on the middle, Home the whole field
    if(k.startsWith('arrow')){e.preventDefault();B.cam.keys[k]=true;return}
    if(!e.repeat&&(k==='='||k==='+'||k==='-')){camZoom(k==='-'?-1:1);return}
    if(!e.repeat&&k==='home'){camReset();return}
    // H hold (where they stand), W withdraw; R walk or run, F hold ground, Q cease fire, E skirmish, X melee mode
    if(!e.repeat&&k==='a')return autoKey();// (the selected groups to the AI or back; none selected: the whole army, deploy.js)
    if(!e.repeat&&k==='d'&&!e.ctrlKey&&!e.metaKey)return armAttackMove();// (the next order on the ground an attack-move: commands.js)
    if(!e.repeat&&k==='k')return setAutoSkills(!AUTOSK.on);// (your characters' skills on their own)// (the AI in command of your army)
    if(!e.repeat){if(k==='h')return setOrder('hold');if(k==='w')return setOrder('withdraw');const fl={r:'walk',f:'firm',q:'cease',e:'skirmish',x:'melee'}[k];if(fl)return toggleFlag(fl)}
    /* the manual control, set aside for now:
    if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(isBow())drawStart();else swing()}return}
    if(!e.repeat){const si=SLOT_KEYS.indexOf(k);if(si>=0)return castSlot(si);if(k==='f')return dodge()} */
    if(k==='c')return setOrder('charge');if(k==='v')return setOrder('advance');
    // formations: B shield wall, L loose, T wedge (pressed again: line)
    if(!e.repeat){if(k==='b')return toggleFlag('shieldWall');const fk=FORM_PICK.find(f=>FORMS[f].key.toLowerCase()===k);if(fk)return setForm(fk)}
    // commander powers: Z rally the line, S stand fast (commandpowers.js)
    if(!e.repeat){const cp=powerKey(k);if(cp)return commandPower(cp)}
    // unit abilities: G brace, I fire arrows, U spur, Y rally, O scout ahead (unitabilities.js)
    if(!e.repeat){const ab=UNIT_ABIL_ORDER.find(id=>UNIT_ABILITIES[id].key.toLowerCase()===k);if(ab)return groupAbility(ab)}
    /* (moving your hero with WASD, sprinting with Shift, blocking with B: set aside)
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    G.keys[k]=true;if(e.shiftKey)G.keys.shift=true; */
  }else if(G.mode==='scene'&&!G.modal){
    if(k==='e'||e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)sceneUse();return}
    if(k==='h'&&!e.repeat)return openHelp();if(k==='l'&&!e.repeat)return chronicleKey();if(k==='j'&&!e.repeat)return journalKey();if(k==='q'&&!e.repeat)return questsKey();
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    G.keys[k]=true;if(e.shiftKey)G.keys.shift=true;
  }else if(G.mode==='world'&&!G.modal){
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePause()}
    if(k>='1'&&k<='3')setSpeed(SPEEDS[k-1]);if(k==='4'&&!e.repeat)setSpeed(G.speed===TRAVEL_FAST?1:TRAVEL_FAST);// (4: Travel fast, 8×, or back to 1×)
    if(k==='r'&&!e.repeat)toggleHurry();// R: Hurry, or stop hurrying (world/supply.js; the action ring's Hurry here too)
    if(k==='b'&&!e.repeat)toggleByRoad();// B: by-road mode on or off, every trip keeping to the roads while it is on (world.js; the action ring's By road too)
    if(k==='c')openChar();if(k==='i')openInv();if(k==='k')openSkills();if(k==='h')openHelp();// (C: the Army window; K: it, on your hero's Skills)
    if(!e.repeat){if(k==='q')questsKey();if(k==='j')journalKey();if(k==='l')chronicleKey()}// (Q: your Quests; J: the Journal, L: on its Chronicle)
    if(!e.repeat&&(k==='='||k==='+'||k==='-')){mapZoom(k==='-'?-1:1);return}// + and −: the map's zoom (core.js)
    if(k==='g'&&!e.repeat){setGrid(!GRID.on);toast(GRID.on?'Tile grid on (G to hide).':'Tile grid off.')}
    if(k==='z'&&!e.repeat)toggleCamp();// Z: make camp or break it (world/supply.js)
  }else if(G.mode==='help'&&k==='h')closeOver();
  else if(G.mode==='journal'&&!e.repeat&&(k==='j'||k==='l')){if(k==='j')journalKey();else chronicleKey()}
  else if(G.mode==='quests'&&k==='q'&&!e.repeat)questsKey();
  else if(G.mode==='char'&&k==='c')act('char-close');
  else if(G.mode==='skills'&&(k==='k'||k==='c'))act('sk-map');
  else if(G.mode==='inv'&&k==='i')act('inv-close');
});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&B&&B.draw)drawRelease();const k=keyOf(e);G.keys[k]=false;if(k==='shift'||!e.shiftKey)G.keys.shift=false});
window.addEventListener('blur',()=>{G.keys={}});


/* Mobile world controls share the existing buttons and handlers; restore them outside the map. */
class MobileWorldHud{
  constructor(){
    this.media=matchMedia('(max-width:600px), (pointer:coarse) and (max-height:600px)');
    this.screen=$('#screen');this.enabled=false;
    this.root=document.createElement('div');this.root.className='mobile-world-hud';this.root.hidden=true;
    this.root.innerHTML='<div class="mwh-status"><div data-place="day"></div><button type="button" id="partyToggle" aria-controls="stats" aria-expanded="false"><span>Party status</span> <b aria-hidden="true">▴</b></button></div>'+
      '<nav class="mwh-dock" aria-label="World controls"><div data-place="pause"></div><button type="button" id="speedToggle" aria-controls="worldSpeedChoices" aria-expanded="false"><strong>1× ▴</strong><small>Speed</small></button><div data-place="map"></div><div data-place="army"></div><div data-place="menu"></div></nav>'+
      '<div id="worldSpeedChoices" class="mwh-speeds" role="group" aria-label="Travel speed" hidden></div>';
    $('.hudlayer').appendChild(this.root);
    this.speedButton=$('#speedToggle');this.partyButton=$('#partyToggle');this.choices=$('#worldSpeedChoices');
    this.mapChoices=document.createElement('div');this.mapChoices.id='worldMapChoices';this.mapChoices.className='mwh-map';this.mapChoices.hidden=true;this.mapChoices.setAttribute('role','group');this.mapChoices.setAttribute('aria-label','Map view and zoom');this.mapChoices.innerHTML='<strong>Map view</strong><button class="btn sm" type="button" data-act="hunt-area" aria-pressed="false">Hunting area</button><div class="mwh-map-actions"><div data-place="mapOut"></div><div data-place="mapIn"></div><div data-place="mapFull"></div></div>';this.root.appendChild(this.mapChoices);this.mapChoices.addEventListener('click',e=>{if(e.target.closest('[data-act="hunt-area"]')){WildHunt.toggle();this.close()}});
    this.mapButton=document.createElement('button');this.mapButton.type='button';this.mapButton.id='mapToggle';this.mapButton.className='dbtn';this.mapButton.setAttribute('aria-controls','worldMapChoices');this.mapButton.setAttribute('aria-expanded','false');this.mapButton.innerHTML=icon('map',18)+'<span class="dl">Map ▴</span>';this.root.querySelector('[data-place="map"]').appendChild(this.mapButton);
    this.mapButton.addEventListener('click',()=>{const open=this.mapChoices.hidden;this.close();this.mapChoices.hidden=!open;this.mapButton.setAttribute('aria-expanded',String(open))});
    const node=(selector,place)=>{const el=$(selector),home=document.createComment('mobile control home');el.before(home);return{el,home,to:this.root.querySelector('[data-place="'+place+'"]')||this.choices}};
    this.nodes=[node('#pause','pause'),node('#mapBtn','mapFull'),node('#zoomOut','mapOut'),node('#zoomIn','mapIn'),node('#charBtn','army'),node('#menuBtn','menu'),node('#wday','day'),node('.wtime','speed')];
    this.speedButton.addEventListener('click',()=>{const open=this.choices.hidden;this.close();this.choices.hidden=!open;this.speedButton.setAttribute('aria-expanded',String(open));this.speed()});
    this.partyButton.addEventListener('click',()=>{const open=this.partyButton.getAttribute('aria-expanded')!=='true';this.close();this.partyButton.setAttribute('aria-expanded',String(open));this.screen.classList.toggle('party-open',open)});
    document.addEventListener('click',e=>{if(e.target.closest('[data-speed]')||!this.root.contains(e.target)&&!$('#stats').contains(e.target))this.close();this.sync()});
    document.addEventListener('pointerdown',e=>{if(!this.root.contains(e.target)&&!$('#stats').contains(e.target))this.close()});
    this.media.addEventListener('change',()=>this.sync());addEventListener('resize',()=>this.sync());
    window.visualViewport?.addEventListener('resize',()=>{fitScreen();this.sync()});
    new ResizeObserver(()=>this.measure()).observe(this.root);
    this.sync();this.speed();
  }
  sync(){
    const mobile=this.media.matches;if(this.mobile!==mobile){this.mobile=mobile;this.screen.classList.toggle('mobile-controls',mobile)}
    const enabled=mobile&&G.mode==='world'&&!G.modal;if(enabled===this.enabled)return;
    this.close();this.enabled=enabled;this.screen.classList.toggle('mobile-world',enabled);this.root.hidden=!enabled;
    for(const n of this.nodes)if(enabled)n.to.appendChild(n.el);else n.home.after(n.el);
    $('#mapBtn .dl').textContent=enabled?'Full map':'Map';
    this.measure();
  }
  measure(){if(this.enabled){const pixels=this.root.getBoundingClientRect().height,height=pixels+'px';if(pixels>0&&this.screen.style.getPropertyValue('--mobile-hud-height')!==height)this.screen.style.setProperty('--mobile-hud-height',height)}}
  close(){
    const was=!this.choices.hidden||!this.mapChoices.hidden||this.partyButton.getAttribute('aria-expanded')==='true';
    this.mapChoices.hidden=true;this.mapButton.setAttribute('aria-expanded','false');this.choices.hidden=true;this.speedButton.setAttribute('aria-expanded','false');this.partyButton.setAttribute('aria-expanded','false');this.screen.classList.remove('party-open');this.speed();return was;
  }
  speed(){this.speedButton.querySelector('strong').textContent=G.speed+'× '+(this.choices.hidden?'▴':'▾');this.speedButton.setAttribute('aria-label','Travel speed '+G.speed+' times')}
  update(fitness,morale,stamina){
    const text='Fit '+fitness+'% · Morale '+morale+'% · Stamina '+stamina+'%',label=this.partyButton.querySelector('span');if(label.textContent!==text){label.textContent=text;this.measure()}
    this.partyButton.setAttribute('aria-label','Party status: fitness '+fitness+' percent, morale '+morale+' percent, stamina '+stamina+' percent');this.partyButton.classList.toggle('warn',fitness<50||morale<30||stamina<SUPPLY.tired);
  }
}
window.mobileWorldHud=new MobileWorldHud();


/* Mobile battle presentation reuses live controls; combat and desktop orders stay authoritative. */
class MobileBattleHud{
  constructor(){
    this.screen=$('#screen');this.enabled=false;this.nodes=[];
    this.root=document.createElement('div');this.root.className='mobile-battle-hud';this.root.hidden=true;
    const drawer=(id,title,body)=>'<section id="'+id+'" class="mbh-drawer" aria-label="'+title+'" hidden><header><strong>'+title+'</strong><button type="button" class="mbh-close" aria-label="Close '+title+'">×</button></header>'+body+'</section>';
    this.root.innerHTML='<div data-bplace="status"></div><div data-bplace="cards"></div><nav class="mbh-dock" aria-label="Battle controls"><div data-bplace="pause"></div><button type="button" id="battleSpeedToggle" aria-expanded="false" aria-controls="battleSpeedChoices">1× ▴</button><button type="button" id="battleOrdersToggle" aria-expanded="false" aria-controls="battleOrderChoices">Orders ▴</button><button type="button" id="battleMoreToggle" aria-expanded="false" aria-controls="battleMoreChoices">More ▴</button><div data-bplace="menu"></div></nav>'+
      drawer('battleSpeedChoices','Battle speed','<div class="mbh-speed-grid" data-bplace="speed"></div>')+
      drawer('battleOrderChoices','Orders & formations','<p class="mbh-help">Unit abilities affect selected troop groups. Commander abilities affect friendly groups near your hero.</p><div data-bplace="orders"></div><div data-bplace="powers"></div>')+
      drawer('battleMoreChoices','Battle view','<div class="mbh-options" data-bplace="options"><button type="button" data-bview="out">Zoom −</button><button type="button" data-bview="in">Zoom +</button><button type="button" data-bview="reset">Reset view</button></div><div data-bplace="info"></div>');
    $('#bbar').appendChild(this.root);
    this.panels=[['battleSpeedToggle','battleSpeedChoices'],['battleOrdersToggle','battleOrderChoices'],['battleMoreToggle','battleMoreChoices']].map(([button,panel])=>({button:$('#'+button),panel:$('#'+panel)}));
    for(const p of this.panels)p.button.addEventListener('click',()=>{const open=p.panel.hidden;this.close();p.panel.hidden=!open;p.button.setAttribute('aria-expanded',String(open))});
    this.root.addEventListener('click',e=>{if(e.target.closest('.mbh-close'))this.close();const view=e.target.closest('[data-bview]');if(view){if(view.dataset.bview==='reset')camReset();else camZoom(view.dataset.bview==='in'?1:-1)}});
    document.addEventListener('click',e=>{if(e.target.closest('[data-bspeed],[data-order],#bAmove,[data-power],#bAuto')||!this.root.contains(e.target))this.close();this.sync()});
    document.addEventListener('pointerdown',e=>{if(!this.root.contains(e.target))this.close()});
    new ResizeObserver(()=>this.measure()).observe(this.root);
    window.mobileWorldHud.media.addEventListener('change',()=>this.sync());addEventListener('resize',()=>this.sync());
  }
  move(el,place){
    if(!el||this.nodes.some(n=>n.el===el))return;const home=document.createComment('battle control home');el.before(home);this.nodes.push({el,home});this.root.querySelector('[data-bplace="'+place+'"]').appendChild(el);
  }
  sync(){
    const enabled=window.mobileWorldHud.media.matches&&G.mode==='battle'&&!!B;
    if(enabled!==this.enabled){
      this.close();this.battle=null;this.enabled=enabled;this.root.hidden=!enabled;this.screen.classList.toggle('mobile-battle',enabled);
      if(enabled){
        for(const [selector,place] of [['.btop','status'],['.bcards','cards'],['#bPause','pause'],['#bMenu','menu'],['.borders','orders'],['#bInfo','info'],['#bSkills','options'],['#hpBtn','options']])this.move($(selector),place);
        document.querySelectorAll('[data-bspeed]').forEach(el=>this.move(el,'speed'));
      }else{for(const n of this.nodes){n.home.after(n.el);n.home.remove()}this.nodes=[]}
      this.measure();
    }
    if(enabled){this.move($('#huntEnd'),'options');this.move($('#bCmd'),'powers');if(this.battle!==B){this.battle=B;this.update()}}
  }
  close(){const was=this.panels.some(p=>!p.panel.hidden);for(const p of this.panels){p.panel.hidden=true;p.button.setAttribute('aria-expanded','false')}return was}
  measure(){if(this.enabled){const height=this.root.getBoundingClientRect().height;if(height>0)this.screen.style.setProperty('--mobile-battle-height',height+'px')}}
  update(){
    if(!this.enabled||!B)return;const speed=B.world?G.speed:B.speed,button=$('#battleSpeedToggle'),text=speed+'× ▴';if(button.textContent!==text)button.textContent=text;button.setAttribute('aria-label','Battle speed '+speed+' times');
    const labels={hold:'Hold',charge:'Run',advance:'Walk',withdraw:'Retreat',firm:'Hold ground',cease:'Hold fire',skirmish:'Skirmish',melee:'Melee',shieldWall:'Shields'};
    for(const b of this.root.querySelectorAll('.obtn'))if(!b.querySelector('.mbh-label')){
      const label=b.id==='bAmove'?'Attack move':labels[b.dataset.order||b.dataset.flag]||(b.dataset.form&&FORMS[b.dataset.form]?.n)||(b.dataset.abil&&UNIT_ABILITIES[b.dataset.abil]?.n);
      if(label){const span=document.createElement('span');span.className='mbh-label';span.textContent=label;b.appendChild(span)}
    }
  }
}
window.mobileBattleHud=new MobileBattleHud();
