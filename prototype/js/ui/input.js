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
  if(a==='lord-leave'&&G.scene&&G.mode==='scene'){G.enc=null;return backToScene()}
  if(a==='lord-leave'){const l=G.enc&&G.enc.ref;if(l)l.cool=3;G.enc=null;G.encCool=2;G.mode='world';hidePanel();return}
  if(a==='lord-attack'){const l=G.enc.ref;P.hostile[l.fac]=G.day+20;addHonor(l.fac,-15,true);log('You attack '+l.name+'. The '+FACS[l.fac].n+' is now hostile to you.','bad');return startEncounter({kind:'lord',ref:l,list:l.troops.slice(),mine:true})}
  if(a.startsWith('q-')){const tq=G.town&&G.town.ref;questAct(a,arg,G.mode==='town'?tq:null);if(a.startsWith('q-lord'))return;updateHUD(true);if(G.mode==='char')return renderChar();if(G.mode==='town')renderTown();return}
  if(charAct(a,arg))return;
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
  const o=e.target.closest('[data-order]');if(o)setOrder(o.dataset.order);
  const g=e.target.closest('[data-grp]');if(g)selectGroup(g.dataset.grp,e.shiftKey);
});
bhudInit();// (the order, flag and formation buttons' icons: battlehud.js)
document.querySelectorAll('[data-form]').forEach(b=>b.addEventListener('click',()=>setForm(b.dataset.form)));
document.querySelectorAll('[data-flag]').forEach(b=>b.addEventListener('click',()=>toggleFlag(b.dataset.flag)));
document.querySelectorAll('[data-bspeed]').forEach(b=>b.addEventListener('click',()=>setBattleSpeed(+b.dataset.bspeed)));
$('#bPause').addEventListener('click',()=>battlePause());
$('#bAuto').addEventListener('click',()=>autoKey());// (the selected groups, or with none the whole army: deploy.js)
{const b=document.getElementById('bAmove');if(b)b.addEventListener('click',()=>armAttackMove())}// (the next ground order an attack-move: commands.js)
{const b=document.getElementById('bSkills');if(b)b.addEventListener('click',()=>setAutoSkills(!AUTOSK.on))}
$('#hpBtn').addEventListener('click',()=>setHpBars(!HPBARS.on));setHpBars(HPBARS.on);
$('#pause').addEventListener('click',togglePause);pauseUI();
// the dock's tiles: an icon over the name, the key in the corner
document.querySelectorAll('.dbtn[data-ico]').forEach(b=>{b.innerHTML=icon(b.dataset.ico,18)+'<span class="dl">'+b.textContent+'</span>'+(b.dataset.key?'<kbd>'+b.dataset.key+'</kbd>':'')});
$('#saveBtn').addEventListener('click',()=>saveGame(false,'quick'));
// the main menu, from anywhere outside a battle
$('#menuBtn').addEventListener('click',()=>{if(BattleLab.active)return DevConsole.show('battle');if(G.mode==='title')return;if(G.mode==='esc')return escAct('esc-resume');showEsc()});

$('#charBtn').addEventListener('click',()=>{if(G.mode==='char')act('char-close');else openChar()});
$('#helpBtn').addEventListener('click',()=>{if(G.mode==='help')closeOver();else openHelp()});
$('#journalBtn').addEventListener('click',()=>{if(G.mode==='journal')closeOver();else openJournal()});
$('#fsBtn').addEventListener('click',toggleFull);
document.addEventListener('fullscreenchange',fitScreen);
$('#skillBtn').addEventListener('click',()=>{if(G.mode==='skills')act('sk-close');else openSkills()});
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
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  // the tooltip: what is under the pointer on the map
  const tip=$('#tip');if(holdCardUp()&&e.pointerType==='touch')return;// (a long press's card stays until the next tap: below)
  if(G.mode!=='world'||G.modal||e.pointerType==='touch'){tip.hidden=true;return}
  const o=pickAt(G.cam.x+p.x,G.cam.y+p.y),h=o?tipFor(o):'';if(!h){tip.hidden=true;return}
  tip.innerHTML=h;tip.classList.remove('hold');tip.hidden=false;const r=cv.getBoundingClientRect(),x=e.clientX-r.left+16,y=e.clientY-r.top+14;
  tip.style.left=Math.min(x,r.width-tip.offsetWidth-6)+'px';tip.style.top=Math.min(y,r.height-tip.offsetHeight-6)+'px'});
cv.addEventListener('pointerleave',()=>{G.mouse.in=false;if(!holdCardUp())hideTip();if(B)B.hov=null;cv.style.cursor=''});
cv.addEventListener('pointerdown',e=>{
  const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  if(G.modal)return;
  if(e.pointerType==='touch'&&touchDown(e,p))return;// (a finger in battle or on the map: below; it acts when it lifts)
  if(G.mode==='world'){const wx=G.cam.x+p.x,wy=G.cam.y+p.y;if(G.place){if(e.button===2){G.place=null;log('You stop placing.')}else placeClick(wx,wy);return}if(P.stay)return stayClick(wx,wy);worldGo(wx,wy)}
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
window.addEventListener('pointerup',e=>{if(e.pointerType==='touch'&&touchUp(e))return;
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
// the map: travel to a point, or meet what is there
function worldGo(wx,wy){if(clickAt(wx,wy)||G.chase)return;P.tx=clamp(wx,8,MW*TILE-8);P.ty=clamp(wy,8,MH*TILE-8);P.stuck=0}
/* ---------- touch (a phone on its side): Pointer Events with pointerType 'touch' only; the mouse, pen and keys above are as they were.
   Battle: a tap selects and a tap again sends, as before (now when the finger lifts); a long press (TOUCH.hold ms, the finger
   within TOUCH.slop CSS px) sends the selection there, or onto the enemy under it; a long press then a drag lays the line, as a
   right-drag does (where, how wide, facing); a drag before it boxes groups. Two fingers: pinch to zoom about their middle, move
   both to pan; a second finger calls off whatever the first was doing, and a pinch never selects or orders.
   Map: a tap travels; a long press on something shows its card (the tooltip), which the next tap puts away, travelling nowhere ---------- */
// hold: ms to a long press; slop: CSS px a finger may wander in it; ring: the filling ring's radius (CSS px, round the finger)
const TOUCH={hold:450,slop:10,ring:34,pts:new Map(),lp:null,pinch:null,spent:new Set()};
const touchMid=()=>{const [a,b]=[...TOUCH.pts.values()];return{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y))}};
const holdCardUp=()=>{const t=$('#tip');return!!t&&!t.hidden&&t.classList.contains('hold')};
// the press under way (TOUCH.lp) dropped: its box or line gone, nothing sent
function touchDrop(){const l=TOUCH.lp;if(!l)return;clearTimeout(l.timer);TOUCH.lp=null;if(l.mode==='battle'&&B&&B===l.B){if(l.box)B.box=null;if(l.armed)B.rdrag=null}}
function touchDown(e,p){const T=TOUCH,id=e.pointerId;
  if(e.isPrimary&&T.pts.size){touchDrop();T.pts.clear();T.spent.clear();T.pinch=null}// (the first finger of a new touch: anything a lost lift left behind goes)
  if(G.mode==='world'){if(holdCardUp()){hideTip();touchDrop();T.pts.set(id,p);T.spent.add(id);return true}if(G.place||P.stay)return false;// (the card up: this tap only puts it away)
    T.pts.set(id,p);if(T.pts.size>1){touchDrop();T.spent.add(id);return true}
    T.lp={id,mode:'world',cx:e.clientX,cy:e.clientY,wx:G.cam.x+p.x,wy:G.cam.y+p.y,t0:performance.now()};touchTimer();return true}
  if(G.mode!=='battle'||!B)return false;T.pts.set(id,p);
  if(T.pts.size===2){touchDrop();for(const k of T.pts.keys())T.spent.add(k);const m=touchMid();T.pinch={d0:m.d,z0:B.cam?B.cam.z:1,w:toField(m)};return true}
  if(T.pts.size>2){T.spent.add(id);return true}
  {const mh=miniHit(p);if(mh){camCentre(mh.x,mh.y);T.spent.add(id);return true}}// (the small map: look there)
  T.lp={id,mode:'battle',B,cx:e.clientX,cy:e.clientY,q:toField(p),t0:performance.now()};touchTimer();return true}
function touchTimer(){const l=TOUCH.lp;l.timer=setTimeout(()=>touchTick(performance.now()),TOUCH.hold+5)}
// the press comes due at time now (its timer; a move or the lift if the timer is late): in battle the order is armed (a line
// to drag from there), on the map the card of what is under it (nothing there: the lift still travels)
function touchTick(now){const l=TOUCH.lp;if(!l||l.armed||l.box||l.off||now-l.t0<TOUCH.hold)return false;
  if(l.mode==='battle'){if(B!==l.B||G.mode!=='battle'){touchDrop();return false}l.armed=true;B.box=null;B.rdrag={x0:l.q.x,y0:l.q.y,x1:l.q.x,y1:l.q.y,shift:false}}
  else{const o=G.mode==='world'&&!G.modal?pickAt(l.wx,l.wy):null,h=o?tipFor(o):'';if(!h){l.off=true;return false}l.armed=true;holdCard(h,l.cx,l.cy)}
  try{if(navigator.vibrate)navigator.vibrate(12)}catch(err){}return true}
function touchMove(e,p){const T=TOUCH,pt=T.pts.get(e.pointerId);if(!pt)return;pt.x=p.x;pt.y=p.y;
  if(T.pinch){if(T.pts.size>=2&&B&&G.mode==='battle'){const m=touchMid();camPinch(T.pinch.w,T.pinch.z0*m.d/T.pinch.d0,m.x,m.y)}return}
  const l=T.lp;if(!l||l.id!==e.pointerId)return;touchTick(performance.now());
  if(l.armed||l.box||Math.hypot(e.clientX-l.cx,e.clientY-l.cy)<=T.slop)return;
  if(l.mode==='world'){l.off=true;return}// (wandered: no card; the lift still travels to where it went down)
  if(B===l.B){l.box=true;const q=toField(p);B.box={x0:l.q.x,y0:l.q.y,x1:q.x,y1:q.y,add:false}}}
// a finger lifts (cancel: the browser took it): what the press was comes about; true when it was a touch of ours
function touchUp(e,cancel){const T=TOUCH,id=e.pointerId;if(!T.pts.has(id))return false;T.pts.delete(id);if(T.pinch&&T.pts.size<2)T.pinch=null;
  if(T.spent.delete(id))return true;const l=T.lp;if(!l||l.id!==id)return true;
  if(cancel){touchDrop();return true}touchTick(performance.now());clearTimeout(l.timer);T.lp=null;
  if(l.mode==='world'){if(!l.armed&&G.mode==='world'&&!G.modal)worldGo(l.wx,l.wy);return true}
  if(B!==l.B||G.mode!=='battle')return true;const q=l.q;
  if(l.armed){const d=B.rdrag;B.rdrag=null;if(d&&Math.hypot(d.x1-d.x0,d.y1-d.y0)>=FORM_DRAG)formDragTo(d.x0,d.y0,d.x1,d.y1);else rtsOrder(q.x,q.y);return true}
  if(l.box){const b=B.box;B.box=null;if(b)rtsSelect(b.x0,b.y0,b.x1,b.y1,false);return true}
  if(B.sel!=='all'&&selGroups().length&&!rtsUnitAt(q.x,q.y,0))rtsOrder(q.x,q.y);else rtsSelect(q.x,q.y,q.x,q.y,false);return true}// (a tap: as it always was)
cv.addEventListener('pointermove',e=>{if(e.pointerType==='touch')touchMove(e,toCanvas(e))});
window.addEventListener('pointercancel',e=>{if(e.pointerType==='touch')touchUp(e,true)});
// anything else pressed puts the card away
document.addEventListener('pointerdown',e=>{if(e.target!==cv&&holdCardUp())hideTip()},true);
// the screen's safe area (clear of a notch, rounded corners, a home bar), CSS px: style.css --sa-*, read off the HUD layer's
// padding (its children are placed against its padding box, so the padding moves nothing)
function safeInsets(){const h=$('.hudlayer'),s=h&&getComputedStyle(h),n=v=>parseFloat(v)||0;return s?{t:n(s.paddingTop),r:n(s.paddingRight),b:n(s.paddingBottom),l:n(s.paddingLeft)}:{t:0,r:0,b:0,l:0}}
// the card: over the finger (not under it), kept on the screen and in its safe area; 'Tap' where the tooltip says 'Click'
function holdCard(h,cx,cy){const tip=$('#tip'),r=cv.getBoundingClientRect(),sa=safeInsets();tip.innerHTML=h.replace(/>Click:/g,'>Tap:');tip.classList.add('hold');tip.hidden=false;
  const w=tip.offsetWidth,ht=tip.offsetHeight,x=cx-r.left,y=cy-r.top,up=y-ht-TOUCH.ring,L=6+sa.l,T=6+sa.t;
  tip.style.left=clamp(x-w/2,L,Math.max(L,r.width-w-6-sa.r))+'px';tip.style.top=(up>=T?up:clamp(y+TOUCH.ring,T,Math.max(T,r.height-ht-6-sa.b)))+'px'}
// iOS Safari ignores user-scalable=no: a pinch begun on the HUD or a window would zoom the whole page. Its own gesture events
// (iOS only; other browsers never send them) are stopped; the game's pinch reads pointers and windows still scroll (style.css
// touch-action)
['gesturestart','gesturechange'].forEach(t=>document.addEventListener(t,e=>{if(e.cancelable)e.preventDefault()},{passive:false}));
// the long press filling, on the field (battlehud.js drawSelection): a ring round the finger, wider than it, gold, red on an
// enemy; full once armed. From 90 ms, so a quick tap shows nothing
function drawTouchHold(){const l=TOUCH.lp;if(!l||l.mode!=='battle'||l.B!==B||l.box)return;const t=performance.now()-l.t0;if(!l.armed&&t<90)return;
  const r=cv.getBoundingClientRect(),k=cv.width/Math.max(1,r.width)/(B.cam?B.cam.z:1),R=TOUCH.ring*k,col=rtsUnitAt(l.q.x,l.q.y,1)?'255,106,90':'232,185,74',f=l.armed?1:Math.min(1,t/TOUCH.hold);
  ctx.lineWidth=3*k;ctx.strokeStyle='rgba(10,12,18,.45)';ctx.beginPath();ctx.arc(l.q.x,l.q.y,R,0,7);ctx.stroke();
  ctx.strokeStyle='rgba('+col+','+(l.armed?1:.85)+')';ctx.beginPath();ctx.arc(l.q.x,l.q.y,R,-Math.PI/2,-Math.PI/2+f*Math.PI*2);ctx.stroke();
  if(l.armed){ctx.fillStyle='rgba('+col+',.9)';ctx.beginPath();ctx.arc(l.q.x,l.q.y,2.5*k,0,7);ctx.fill()}ctx.lineWidth=1}
// the wheel zooms the battle toward the cursor (camera.js)
cv.addEventListener('wheel',e=>{if(G.mode==='battle'&&B&&!G.modal){e.preventDefault();const p=toCanvas(e);camZoom(e.deltaY<0?1:-1,p.x,p.y)}},{passive:false});
// the arrow keys pan while held
window.addEventListener('keyup',e=>{if(B&&B.cam){const k=keyOf(e);if(k.startsWith('arrow'))B.cam.keys[k]=false}});
window.addEventListener('blur',()=>{if(B&&B.cam)B.cam.keys={}});
/* (the bow's angle on the wheel, set aside with the manual control:) cv.addEventListener('wheel',e=>{if(G.mode==='battle'&&B&&isBow()){e.preventDefault();bowRangeStep(e.deltaY<0?15:-15)}},{passive:false}); */
// keys are read by physical position (e.code), so WASD and the hotkeys work on any keyboard layout, Thai included
function keyOf(e){const c=e.code||'';
  if(c.startsWith('Key'))return c.slice(3).toLowerCase();if(c.startsWith('Digit'))return c.slice(5);if(c.startsWith('Numpad')&&/\d$/.test(c))return c.slice(-1);
  if(c.startsWith('Arrow'))return c.toLowerCase();if(c.startsWith('Shift'))return 'shift';if(c==='Escape')return 'escape';return (e.key||'').toLowerCase()}
window.addEventListener('keydown',e=>{
  if(e.target&&/INPUT|TEXTAREA|SELECT/.test(e.target.tagName))return;
  const k=keyOf(e);
  if(e.key==='F6'){e.preventDefault();saveGame(false,'quick');return}
  if(k==='escape'){e.preventDefault();if(dragCancel())uiSfx('back');else if(G.mode==='battle'&&B&&B.amArm){armAttackMove(false);uiSfx('back')}else onEscape();return}// (a drag first, then an armed attack-move: Esc calls it off and nothing else)
  if(k==='m'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){if(!e.repeat)toggleMute();return}// M: the sound off or on, anywhere (ui.js)
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
    // commander powers: Z rally the line, S stand fast, O scout (commandpowers.js)
    if(!e.repeat){const cp=powerKey(k);if(cp)return commandPower(cp)}
    // unit abilities: G brace, I fire arrows, U spur, Y rally (unitabilities.js)
    if(!e.repeat){const ab=UNIT_ABIL_ORDER.find(id=>UNIT_ABILITIES[id].key.toLowerCase()===k);if(ab)return groupAbility(ab)}
    /* (moving your hero with WASD, sprinting with Shift, blocking with B: set aside)
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    G.keys[k]=true;if(e.shiftKey)G.keys.shift=true; */
  }else if(G.mode==='scene'&&!G.modal){
    if(k==='e'||e.code==='Space'||e.code==='Enter'){e.preventDefault();if(!e.repeat)sceneUse();return}
    if(k==='h'&&!e.repeat)return openHelp();if(k==='l'&&!e.repeat)return openJournal();
    if(['arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();
    G.keys[k]=true;if(e.shiftKey)G.keys.shift=true;
  }else if(G.mode==='world'&&!G.modal){
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)togglePause()}
    if(k>='1'&&k<='3')setSpeed(SPEEDS[k-1]);if(k==='4'&&!e.repeat)setSpeed(G.speed===TRAVEL_FAST?1:TRAVEL_FAST);
    if(k==='c')openChar();if(k==='i')openInv();if(k==='k')openSkills();if(k==='h')openHelp();if(k==='l')openJournal();
    if(k==='g'&&!e.repeat){setGrid(!GRID.on);log(GRID.on?'Tile grid on (G to hide).':'Tile grid off.')}
  }else if(G.mode==='help'&&k==='h'||G.mode==='journal'&&k==='l')closeOver();
  else if(G.mode==='char'&&k==='c')act('char-close');
  else if(G.mode==='skills'&&k==='k')act('sk-close');
  else if(G.mode==='inv'&&k==='i')act('inv-close');
});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&B&&B.draw)drawRelease();const k=keyOf(e);G.keys[k]=false;if(k==='shift'||!e.shiftKey)G.keys.shift=false});
window.addEventListener('blur',()=>{G.keys={}});
