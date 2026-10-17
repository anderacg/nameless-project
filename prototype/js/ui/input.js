'use strict';
/* ---------- actions ---------- */
function act(a,arg){
  if(a==='begin')return begin(arg);
  if(a==='econmode'){setEconMode(arg);showTitle('settings');return}
  if(a==='grid'){setGrid(arg==='on');showTitle('settings');return}
  if(a==='blood'){setBlood(arg==='on');showTitle('settings');return}
  if(a==='hpbars'){setHpBars(arg==='on');showTitle('settings');return}
  if(a==='bdeploy'){setDeploy(arg==='on');showTitle('settings');return}
  if(a==='guide'){setGuide(arg==='on');showTitle('settings');return}
  if(a==='bspeed'){setBattleSpeed(+arg,true);showTitle('settings');return}
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
  const t=G.town&&G.town.ref;if(!t)return;
  const keep=panel.scrollTop;
  if(a==='plan-siege'){G.town=null;hidePanel();G.mode='world';return openSiege(t)}
  if(fiefAct(a,arg,t)){}
  else if(a==='tab'){G.town.tab=arg;G.town.greet=null}
  else if(a==='rec-pick'){G.town.pick=arg;G.town.review=null;G.town.recruitNotice=''}
  else if(['rec-review','rec-confirm','rec-cancel'].includes(a))townRecruitAction(a);
  else if(a==='hire'){const result=recruitment.hire(t,arg,1,G.town.pick===arg?G.town.hireTarget:undefined);if(result.ok&&result.target==='new'&&G.town.pick===arg)G.town.hireTarget=G.recruitTarget;recruitmentFeedback(result,t)}
  else if(a==='train'){const [k,to]=String(arg).split(':');recruitmentFeedback(recruitment.train(t,k,to),t)}
  else if(a==='contract'){if(!P.fac){P.fac=t.owner;delete P.hostile[t.owner];log('You sign on with the '+FACS[t.owner].n+'. Their enemies are now yours.','gold')}}
  else if(a==='end-contract'){if(P.fac===t.owner){P.fac=null;log('You end your contract with the '+FACS[t.owner].n+'.')}}
  else if(a==='hire-comp')recruitmentFeedback(recruitment.hireCompanion(t,arg),t);
  else if(a==='ransom'){const v=ransomValue();if(v){P.gold+=v;log('The broker pays '+v+' gold for '+prisonerCount()+' prisoners.','gold');P.prisoners={};mood('ransom')}}
  else if(a==='buy-gear'){const st=smithStock(t),id=st[+arg];if(id&&P.gold>=gearPrice(id)&&invAdd('gear',id,1)){P.gold-=gearPrice(id);st.splice(+arg,1);addRep(t.name,ITEMS[id].v/120,true);log('You buy the '+ITEMS[id].n+'.','gold')}}
  else if(a==='buy-ammo'){const [g,ns]=arg.split(':'),n=+ns;if(GOODS[g]&&GOODS[g].ammo){const r=buyGoods(t,g,n);if(r.got)log('You buy '+r.got+' '+GOODS[g].n.toLowerCase()+'.');else log('The smith has no '+GOODS[g].n.toLowerCase()+' to sell.','bad')}}
  else if(a==='buy-mount'){const id=arg,p=gearPrice(id);if(stableStock(t).includes(id)&&canBuyMount(t,id)&&P.gold>=p&&P.gear.mount!==id){
    if(!P.gear.mount){P.gear.mount=id;P.gold-=p;fitInv();log('You buy a '+ITEMS[id].n+' and ride it out of the stable.','gold')}
    else if(invAdd('gear',id,1)){P.gold-=p;log('You buy a '+ITEMS[id].n+'. Swap mounts in your inventory.','gold')}}}
  else if(a==='sell-loot'){const x=P.inv[+arg];if(x&&x.k==='mat'){const g=matPrice(x.id)*x.n;P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell '+x.n+' '+MATS[x.id].n.toLowerCase()+(x.n>1?'s':'')+' for '+g+' gold.','gold')}}
  else if(a==='sell-item'){const x=P.inv[+arg];if(x&&x.k==='gear'){const g=itemPrice(x.id);P.gold+=g;P.inv[+arg]=null;train('trade',g/20);log('You sell the '+ITEMS[x.id].n+' for '+g+' gold.','gold')}}
  else if(a==='buy'||a==='sell'){const [g,nStr]=arg.split(':');let n=+nStr;
    if(a==='buy'){const r=buyGoods(t,g,n);if(r.got)addRep(t.name,r.spent/60,true)}
    else{const r=sellGoods(t,g,n);train('trade',r.earned/20);addRep(t.name,r.earned/60,true)}}
  else if(a==='tourney'){if(P.gold>=10){P.gold-=10;updateHUD(true);return startBattle({enemies:['chief'],tournament:true})}}
  updateHUD(true);renderTown();panel.scrollTop=keep;
  if(a==='rec-pick')panel.querySelector('.recruit-order')?.scrollIntoView({block:'nearest'});
  if(a==='rec-review'&&G.town.review){panel.querySelector('[data-act="rec-confirm"]')?.focus();return}
  const again=panel.querySelector('[data-act="'+a+'"][data-arg="'+arg+'"]:not([disabled])')||panel.querySelector('[data-act="tab"].on');if(again)again.focus({preventScroll:true});
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
  const s=e.target.closest('[data-speed]');if(s)setSpeed(+s.dataset.speed);
  const o=e.target.closest('[data-order]');if(o)setOrder(o.dataset.order);
  const g=e.target.closest('[data-grp]');if(g)selectGroup(g.dataset.grp,e.shiftKey);
});
bhudInit();// (the order, flag and formation buttons' icons: battlehud.js)
document.querySelectorAll('[data-form]').forEach(b=>b.addEventListener('click',()=>setForm(b.dataset.form)));
document.querySelectorAll('[data-flag]').forEach(b=>b.addEventListener('click',()=>toggleFlag(b.dataset.flag)));
document.querySelectorAll('[data-bspeed]').forEach(b=>b.addEventListener('click',()=>setBattleSpeed(+b.dataset.bspeed)));
$('#bPause').addEventListener('click',()=>battlePause());
$('#bAuto').addEventListener('click',()=>setAuto(!(B&&B.auto)));
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
// (in the canvas's own pixels: the screen's, or the battlefield's in a battle)
function toCanvas(e){const r=cv.getBoundingClientRect();return{x:(e.clientX-r.left)*cv.width/r.width,y:(e.clientY-r.top)*cv.height/r.height}}
cv.addEventListener('pointermove',e=>{const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  // the tooltip: what is under the pointer on the map
  const tip=$('#tip');if(G.mode!=='world'||G.modal||e.pointerType==='touch'){tip.hidden=true;return}
  const o=pickAt(G.cam.x+p.x,G.cam.y+p.y),h=o?tipFor(o):'';if(!h){tip.hidden=true;return}
  tip.innerHTML=h;tip.hidden=false;const r=cv.getBoundingClientRect(),x=e.clientX-r.left+16,y=e.clientY-r.top+14;
  tip.style.left=Math.min(x,r.width-tip.offsetWidth-6)+'px';tip.style.top=Math.min(y,r.height-tip.offsetHeight-6)+'px'});
cv.addEventListener('pointerleave',()=>{G.mouse.in=false;hideTip();if(B)B.hov=null;cv.style.cursor=''});
cv.addEventListener('pointerdown',e=>{
  const p=toCanvas(e);G.mouse.x=p.x;G.mouse.y=p.y;G.mouse.in=true;G.mouse.type=e.pointerType;
  if(G.modal)return;
  if(G.mode==='world'){const wx=G.cam.x+p.x,wy=G.cam.y+p.y;if(G.place){if(e.button===2){G.place=null;log('You stop placing.')}else placeClick(wx,wy);return}if(P.stay)return stayClick(wx,wy);if(clickAt(wx,wy)||G.chase)return;
    P.tx=clamp(wx,8,MW*TILE-8);P.ty=clamp(wy,8,MH*TILE-8);P.stuck=0}
  else if(G.mode==='scene')sceneClick(p.x,p.y);
  // battle: RTS command (commands.js): left-click or drag to select, right-click to move or attack (a touch: select, then a
  // second touch sends them)
  // (the camera, camera.js: the middle button pans, a click on the small map looks there; every point is on the field)
  else if(G.mode==='battle'&&B){const mh=miniHit(p),q=toField(p);
    if(e.button===1&&B.cam){e.preventDefault();B.cam.drag={x:p.x,y:p.y}}
    else if(mh&&e.button===0)camCentre(mh.x,mh.y);
    else if(e.button===2&&e.pointerType==='mouse')B.rdrag={x0:q.x,y0:q.y,x1:q.x,y1:q.y,shift:e.shiftKey};// (let go: an order, or a line if dragged)
    else if(e.pointerType!=='mouse'&&B.sel!=='all'&&!rtsUnitAt(q.x,q.y,0))rtsOrder(q.x,q.y)
    else if(e.button===0)B.box={x0:q.x,y0:q.y,x1:q.x,y1:q.y,add:e.shiftKey}
    /* the manual control, set aside for now: if(e.pointerType==='mouse'){if(e.button===2)shove();else if(e.button===0){if(isBow())drawStart();else swing()}}else B.mt={x:p.x,y:p.y} */}
});
cv.addEventListener('contextmenu',e=>e.preventDefault());
// the bow: let go of the button (anywhere) to shoot; the wheel sets the angle
window.addEventListener('pointerup',e=>{if(e.button===1&&B&&B.cam&&B.cam.drag){B.cam.drag=null;return}
  if(e.button===2&&B&&B.rdrag){const d=B.rdrag;B.rdrag=null;
  if(Math.hypot(d.x1-d.x0,d.y1-d.y0)>=FORM_DRAG)formDragTo(d.x0,d.y0,d.x1,d.y1);
  else{const L=B.lastRc,now=performance.now(),dbl=!!L&&now-L.t<350&&Math.hypot(L.x-d.x0,L.y-d.y0)<16;B.lastRc={t:now,x:d.x0,y:d.y0};rtsOrder(d.x0,d.y0,{queue:d.shift,run:dbl})}return}
  if(e.button===0&&B&&B.box){const b=B.box;B.box=null;rtsSelect(b.x0,b.y0,b.x1,b.y1,b.add)}/* (the bow, set aside:) if(e.button===0&&B&&B.draw)drawRelease() */});
cv.addEventListener('pointermove',e=>{if(G.mode!=='battle'||!B)return;const p=toCanvas(e);
  {const q=toField(p);B.hov=q;{const ic=iconAt(q.x,q.y);B.iconHov=ic?ic.g:null}cv.style.cursor=B.sel!=='all'&&rtsUnitAt(q.x,q.y,1)?'crosshair':rtsUnitAt(q.x,q.y,0)?'pointer':''}// (what you point at: a ring, battlehud.js)
  if(B.cam&&B.cam.drag){camPan(B.cam.drag.x-p.x,B.cam.drag.y-p.y);B.cam.drag={x:p.x,y:p.y};return}// (middle-drag: pan)
  if(B.box||B.rdrag){const q=toField(p),o=B.box||B.rdrag;o.x1=q.x;o.y1=q.y}});
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
  if(k==='escape'){e.preventDefault();onEscape();return}
  if(G.mode==='battle'&&B){
    // the battle's speed: Space pauses (orders still go: a tactical pause), [ and ] slow it down and speed it up
    if(e.code==='Space'){e.preventDefault();if(!e.repeat)battlePause();return}
    if(!e.repeat&&(k==='['||k===']')){battleSpeedStep(k==='['?-1:1);return}
    // 1–9/0 select the ten army cards; Ctrl stores an override selection. Double-tap centres the camera.
    const twice=()=>{const now=performance.now(),L=B.lastKey;B.lastKey={k,t:now};if(L&&L.k===k&&now-L.t<BCAM.dbl)camLookAt(selGroups())};
    if(!e.repeat&&/^[0-9]$/.test(k)){e.preventDefault();ctrlGroup(k,e.ctrlKey||e.metaKey);if(!e.ctrlKey&&!e.metaKey)twice();return}
    // the camera: arrows pan (held), + and - zoom on the middle, Home the whole field
    if(k.startsWith('arrow')){e.preventDefault();B.cam.keys[k]=true;return}
    if(!e.repeat&&(k==='='||k==='+'||k==='-')){camZoom(k==='-'?-1:1);return}
    if(!e.repeat&&k==='home'){camReset();return}
    // H hold (where they stand), W withdraw; R walk or run, F hold ground, Q cease fire, E skirmish, X melee mode
    if(!e.repeat&&k==='a')return setAuto(!B.auto);
    if(!e.repeat&&k==='k')return setAutoSkills(!AUTOSK.on);// (your characters' skills on their own)// (the AI in command of your army)
    if(!e.repeat){if(k==='h')return setOrder('hold');if(k==='w')return setOrder('withdraw');const fl={r:'walk',f:'firm',q:'cease',e:'skirmish',x:'melee'}[k];if(fl)return toggleFlag(fl)}
    /* the manual control, set aside for now:
    if(e.code==='Space'){e.preventDefault();if(!e.repeat){if(isBow())drawStart();else swing()}return}
    if(!e.repeat){const si=SLOT_KEYS.indexOf(k);if(si>=0)return castSlot(si);if(k==='f')return dodge()} */
    if(k==='c')return setOrder('charge');if(k==='v')return setOrder('advance');
    // formations: B shield wall, L loose, T wedge (pressed again: line)
    if(!e.repeat){if(k==='b')return toggleFlag('shieldWall');const fk=FORM_PICK.find(f=>FORMS[f].key.toLowerCase()===k);if(fk)return setForm(fk)}
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
    if(k==='1')setSpeed(1);if(k==='2')setSpeed(2);if(k==='3')setSpeed(3);
    if(k==='c')openChar();if(k==='i')openInv();if(k==='k')openSkills();if(k==='h')openHelp();if(k==='l')openJournal();
    if(k==='g'&&!e.repeat){setGrid(!GRID.on);log(GRID.on?'Tile grid on (G to hide).':'Tile grid off.')}
  }else if(G.mode==='help'&&k==='h'||G.mode==='journal'&&k==='l')closeOver();
  else if(G.mode==='char'&&k==='c')act('char-close');
  else if(G.mode==='skills'&&k==='k')act('sk-close');
  else if(G.mode==='inv'&&k==='i')act('inv-close');
});
window.addEventListener('keyup',e=>{if(e.code==='Space'&&B&&B.draw)drawRelease();const k=keyOf(e);G.keys[k]=false;if(k==='shift'||!e.shiftKey)G.keys.shift=false});
window.addEventListener('blur',()=>{G.keys={}});
