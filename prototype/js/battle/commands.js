'use strict';
/* ---------- player battle commands ---------- */
// Stateless routing over the active battle. BattleControl owns group mechanics; formations owns layout; the HUD owns drawing.
// Keep these global entry points for existing mouse, touch, keyboard, HUD and test callers.
// what you have selected: all, one group, or several (a box round them)
const selGroups=()=>!B?[]:(B.sel==='all'?playerGroups():Array.isArray(B.sel)?B.sel:[B.sel]).filter(g=>playerGroups().includes(g));
const selLabel=()=>B.sel==='all'?groupName('all'):selGroups().map(g=>groupName(g)).join(' and ');
const regroup=g=>B.groups[g]&&B.groups[g].regroup();// (its place where its men are: battlecontrol.js)
const RTS_PICK=10;
// an order of yours to these groups: counted (orderSeq), so a character's fall-back ends on any of them (charmind.js fallLook)
const ordered=gs=>gs.forEach(g=>{const gr=B.groups[g];if(gr)gr.orderSeq=(gr.orderSeq|0)+1});
// every order of yours to groups gs: those the AI has taken back (deploy.js), counted (a move, an attack, Hold, the pace, a formation, a flag;
// not a unit ability: counts false), done (fn), the order bar redrawn; returns what fn does
// (late: a move order, carried out late while an ambush has your army off guard: morale.js Surprise)
function playerOrder(gs,fn,{counts=true,late=false}={}){if(B?.muster?.active)return false;takeCommand(gs);if(counts)ordered(gs);if(late&&B.surprise?.late(gs,fn))return;const r=fn();setOrderUI();return r}
// the unit under a point: on a group's icon, its soldier nearest the group's middle (the icon is clicked as the group: select,
// attack, everything a click on a soldier does); else the nearest soldier within RTS_PICK. An enemy your side does not see (in
// woods or behind a rise: terrain.js seenBy) is no one to click. pick: a select's click, where icons overlap clicked again on the
// same spot, the next one under (moraleicons.js iconPick)
function rtsUnitAt(x,y,team,pick){
  const ic=pick?iconPick(x,y,team):iconAt(x,y,team);if(ic){let best=null,bd=1e9;for(const u of B.units){if(u.hp<=0||u.grp!==ic.g||!seenBy(0,u))continue;const d=Math.hypot(u.x-ic.cx,u.y-ic.cy);if(d<bd){bd=d;best=u}}if(best)return best}
  let best=null,bd=RTS_PICK*(B.world?WORLD_BATTLE.sprite:1);for(const u of B.units){if(u.hp<=0||(team===1?!battleEnemy(0,u):u.team!==team)||!seenBy(0,u))continue;const d=Math.hypot(u.x-x,u.y-6*(B.world?WORLD_BATTLE.sprite:1)-y);if(d<bd){bd=d;best=u}}return best}
// select: a click picks the group of the unit under it (nothing of yours under it: none, as in Total War; the All card, Ctrl+A or
// a box round everyone picks all); a box picks every group with a unit inside
function rtsSelect(x0,y0,x1,y1,add){
  const was=add?selGroups():[];
  if(Math.hypot(x1-x0,y1-y0)<5){const u=rtsUnitAt(x1,y1,0,true);B.sel=u&&playerGroups().includes(u.grp)?u.grp:add?B.sel:null}// (your allies' men are theirs to command)
  else{const xa=Math.min(x0,x1),xb=Math.max(x0,x1),ya=Math.min(y0,y1),yb=Math.max(y0,y1),gs=playerGroups().filter(g=>grpUnits(g).some(u=>u.x>=xa&&u.x<=xb&&u.y-6*(B.world?WORLD_BATTLE.sprite:1)>=ya&&u.y-6*(B.world?WORLD_BATTLE.sprite:1)<=yb));
    B.sel=!gs.length?B.sel:gs.length===1?gs[0]:gs.length===playerGroups().filter(g=>grpUnits(g).length).length?'all':gs}
  if(add&&B.sel!=='all'){const all=[...new Set([...was,...selGroups()])].filter(g=>grpUnits(g).length);B.sel=all.length>=playerGroups().filter(g=>grpUnits(g).length).length?'all':all.length===1?all[0]:all}// (Shift: added to what you had)
  setOrderUI();
}
// right-click: on an enemy, the selected set on it; on the ground, sent there keeping their places relative to one another
// (opt.queue: Shift, a waypoint after the ones they have; opt.run: a double right-click, at a run; opt.amove: Ctrl, or the
// Attack-move button armed (B.amArm), an attack-move there: battlecontrol.js AMOVE). Any order but a waypoint ends an attack-move.
// Keep formation on (two or more groups): sent as one block, turned to face the way it goes (formations.js GroupBlock)
function rtsOrder(x,y,opt){
  if(B?.muster?.active)return;
  opt=opt||{};const gs=selGroups().filter(g=>grpUnits(g).length&&!B.groups[g].resolve?.routed);if(!gs.length)return;const am=amTake(opt),keep=gs.length>1&&keepFormOn();playerOrder(gs,()=>{
  if(B.deploy){const p=inZone(x,y);x=p.x;y=p.y;opt={}}// (deploying: a spot in your zone, no enemy to set them on)
  const e=B.deploy?null:rtsUnitAt(x,y,1);
  {const ic=!e&&iconAt(x,y,0);if(ic&&!B.deploy){x=ic.cx;y=ic.cy}}// (on one of your icons: to where that group stands)
  gs.forEach(g=>B.groups[g].setRun(!!opt.run));// (a double right-click: this order at a run, a charge on an enemy)
  if(!e&&opt.queue){// a waypoint after their last, the groups keeping their places relative to one another
    gs.forEach(g=>B.groups[g].toHold());
    const last=g=>{const gr=B.groups[g];return gr.queue.length?gr.queue[gr.queue.length-1]:{x:gr.ax,y:gr.ay}},cx=gs.reduce((a,g)=>a+last(g).x,0)/gs.length,cy=gs.reduce((a,g)=>a+last(g).y,0)/gs.length;
    // (keep formation: the block as it will stand at their last waypoints, turned from there; each waypoint keeps the facing it
    // is given, so the next one turns from it)
    if(keep){const K=GroupBlock.of(gs,g=>{const l=last(g);return{x:l.x,y:l.y,face:l.face??B.groups[g].face??0}});
      for(const p of K.placeAt(x,y,K.faceTo(x,y))){const gr=B.groups[p.g],n=gr.queue.length;gr.queueTo(p.ax,p.ay,am);if(gr.queue.length>n)gr.queue[n].face=p.face}}
    else gs.forEach(g=>{const l=last(g),gr=B.groups[g];if(am)gr.queueTo(x+l.x-cx,y+l.y-cy,true);else gr.queueTo(x+l.x-cx,y+l.y-cy)});B.mark={x,y,t:.7,foe:false};if(am){B.mark.am=true;amSay()}return}
  gs.forEach(g=>B.groups[g].amEnd());
  if(e){gs.forEach(g=>B.groups[g].attack(e,{run:!!opt.run}));toast(htmlText(selLabel())+': attack the '+htmlText(e.grp&&B.groups[e.grp]?groupName(e.grp):e.leader?e.leader.name:ST[e.type]?ST[e.type].n.toLowerCase():'enemy')+'.')}
  else if(keep){const K=GroupBlock.of(gs);for(const p of K.placeAt(x,y,K.faceTo(x,y)))B.groups[p.g][am?'attackMove':'moveTo'](p.ax,p.ay,{run:!!opt.run,face:p.face});if(am)amSay()}
  else{gs.forEach(regroup);const cx=gs.reduce((a,g)=>a+B.groups[g].ax,0)/gs.length,cy=gs.reduce((a,g)=>a+B.groups[g].ay,0)/gs.length;
    gs.forEach(g=>{const gr=B.groups[g];gr[am?'attackMove':'moveTo'](x+gr.ax-cx,y+gr.ay-cy,{run:!!opt.run})});if(am)amSay()}
  if(B.deploy)deploySnap(gs);
  B.mark={x,y,t:.7,foe:!!e};if(am&&!e)B.mark.am=true},{late:true});
}
// an attack-move asked for (Ctrl) or armed (the button: armAttackMove), the arm spent by this order; never while deploying
function amTake(opt){const am=!!(opt&&opt.amove||B.amArm)&&!B.deploy;if(B.amArm){B.amArm=false;setOrderUI()}return am}
const amSay=()=>toast(htmlText(selLabel())+': attack-move.');
// the Attack-move button (D): the selection's next order on the ground an attack-move (pressed again, or Esc: not)
function armAttackMove(on){if(!B||B.deploy||B.muster?.active)return;B.amArm=on??(!B.amArm&&selGroups().length>0);setOrderUI()}
// keep formation on or off (its button, Shift+K; a setting kept: ui.js PREFS.keepform): on, two or more groups sent as one block
function toggleKeepForm(on){prefSet('keepform',on??!prefGet('keepform'));toast(prefGet('keepform')?'Keep formation: several groups move as one block, turning to face the way they go.':'Keep formation off: each group goes on its own.')}
// an order to the selected groups: hold (where they stand), charge, advance, withdraw (flee the battle: off your edge,
// straight back off your edge, striking no one: once all have withdrawn the battle ends as your retreat, morale.js). Any order calls off a target and the waypoints
function setOrder(o){
  if(!B||B.muster?.active)return;const pace=o==='charge'||o==='advance';
  // (Charge and Advance set the pace, run or walk, and nothing else: where they go and whom they fight stay as they were;
  // hold: where they stand; withdraw: off your edge (battlecontrol.js))
  playerOrder(selGroups(),()=>{for(const g of selGroups()){const gr=B.groups[g];if(pace)gr.setWalk(o==='advance');else if(o==='withdraw')gr.withdraw();else if(o==='hold'){gr.amEnd();gr.hold()}}},{late:true});
  // (withdrawing: the preview done (orderpaths.js WithdrawView); in a battle of several armies, told the rest fight on)
  if(o==='withdraw')withdrawView.disarm();
  toast(htmlText(selLabel())+': '+(pace?o==='charge'?'at a run.':'at a walk.':o==='withdraw'&&B.sides?.active?'withdraw. The other armies fight on after you leave.':o+'.'));
  if(o==='charge'&&sfxOn()){const gs=selGroups();if(gs.length)sfx(gs.some(g=>grpUnits(g).some(u=>unitClass(u.s)==='cav'))?'gallop':'charge')}// (riders' hooves, else the horn)
}
// Charge (G, doc/UNIT_KITS_DESIGN.md §7b: a true order): the selection at a run into the enemy, each group at the foe it is set on,
// else each man at the foe nearest him
function chargeOrder(){if(!B||B.muster?.active||B.deploy)return;const gs=selGroups().filter(g=>grpUnits(g).length&&!B.groups[g].resolve?.routed);if(!gs.length)return;
  playerOrder(gs,()=>{for(const g of gs){const gr=B.groups[g],e=gr.tgt;gr.amEnd();if(e)gr.attack(e,{run:true});else gr.charge({run:true})}},{late:true});
  toast(htmlText(selLabel())+': charge!');if(sfxOn())sfx(gs.some(g=>grpUnits(g).some(u=>unitClass(u.s)==='cav'))?'gallop':'charge')}
// a group's flag on or off for the selection (gs: those of it, the stance slots'): walk, firm (hold ground), cease (cease fire),
// skirmish, melee (shooters' blades), shieldWall; what is said of each (FLAG_N, on and off): its stance's (data/kits.js STANCES)
const FLAG_N=Object.assign({},...STANCE_ORDER.map(id=>STANCES[id].say||{}));
function toggleFlag(f,sel=selGroups()){if(!B||B.muster?.active||!FLAG_N[f])return;const gs=sel.filter(g=>grpUnits(g).some(u=>flagEligible(u,f)));if(!gs.length)return;const on=playerOrder(gs,()=>{const on=!gs.every(g=>B.groups[g][f]);gs.forEach(g=>B.groups[g].setFlag(f,on));return on});toast(htmlText(selLabel())+': '+FLAG_N[f][on?0:1]+'.')}
/* the Shooting stance (data/kits.js STANCES.shooting): one cycle, Fire at will, Hold fire, Skirmish, Melee, one at a time (its
   flags: cease, skirmish, melee). A group's choice: its first flag on, none Fire at will (-1) */
const SHOOT_FLAGS=STANCES.shooting.ch.map(c=>c.flag);
const shootingOf=gr=>SHOOT_FLAGS.findIndex(f=>gr[f]);
// (the selection's shooters to choice i, -1 Fire at will)
function setShooting(i,sel=selGroups()){if(!B||B.muster?.active)return;const gs=sel.filter(g=>grpUnits(g).some(u=>flagEligible(u,'cease')));if(!gs.length)return;
  playerOrder(gs,()=>gs.forEach(g=>SHOOT_FLAGS.forEach((f,k)=>B.groups[g].setFlag(f,k===i))));toast(htmlText(selLabel())+': '+(i<0?STANCES.shooting.none:STANCES.shooting.ch[i].n).toLowerCase()+'.')}
// (its key: on to the next choice, from the first of the selection's shooters as it stands)
function shootingCycle(sel=selGroups()){if(!B)return;const g=sel.find(g=>grpUnits(g).some(u=>flagEligible(u,'cease')));if(!g)return;const i=shootingOf(B.groups[g]);setShooting(i+1<SHOOT_FLAGS.length?i+1:-1,sel)}
// a flag's button on the order bar: a Shooting choice picked (pressed again: Fire at will); any other, toggled
function stanceFlag(f){if(STANCES[f]?.ch[0].post)return toggleStance(f);const i=SHOOT_FLAGS.indexOf(f);if(i<0)return toggleFlag(f);if(!B)return;const gs=selGroups().filter(g=>grpUnits(g).some(u=>flagEligible(u,f)));setShooting(gs.length&&gs.every(g=>shootingOf(B.groups[g])===i)?-1:i)}
// control groups: Ctrl+1-9/0 keeps the selection; the same live binding drives recall and card badges.
function ctrlGroups(k){if(!B)return[];const c=B.ctrl&&B.ctrl[k],id=playerGroups()[k==='0'?9:Number(k)-1];return c==='all'?'all':(c||[id]).filter(g=>g&&grpUnits(g).length)}
function ctrlGroup(k,save){if(!B)return;B.ctrl=B.ctrl||{};if(save){B.ctrl[k]=B.sel==='all'?'all':selGroups().slice();toast('Group '+k+': '+htmlText(selLabel())+'.');setOrderUI();return}
  const gs=ctrlGroups(k);if(gs!=='all'&&!gs.length)return;B.sel=gs==='all'?'all':gs.length===1?gs[0]:gs;setOrderUI()}
function selectGroup(g,add=false){if(!B||g!=='all'&&(!playerGroups().includes(g)||!grpUnits(g).length))return;if(add&&g!=='all'){const gs=B.sel==='all'?[]:selGroups();B.sel=[...new Set([...gs,g])]}else B.sel=g;setOrderUI()}
function cycleGroup(){if(!B)return;const opts=['all',...playerGroups().filter(g=>grpUnits(g).length)];B.sel=opts[(opts.indexOf(B.sel)+1)%opts.length];setOrderUI()}
/* a post (Brace, Pavise: data/kits.js STANCES, KITS.brace) planted or taken up by the selection's groups (gs) that take it, all
   planted already: taken up; an order (battlecontrol.js plant) */
function toggleStance(id,sel=selGroups()){if(!B||B.muster?.active||!STANCES[id])return false;const gs=sel.filter(g=>grpUnits(g).some(u=>!u.rout&&STANCES[id].who(u)));if(!gs.length)return false;
  const on=playerOrder(gs,()=>{const on=!gs.every(g=>B.groups[g].posted(id));gs.forEach(g=>B.groups[g].plant(id,on));return on});
  toast(htmlText(gs.map(g=>groupName(g)).join(' and '))+': '+STANCES[id].say[id][on?0:1]+'.');if(on&&id==='brace'&&sfxOn()){const C=B.groups[gs[0]].centre();sfxAt('brace',C.x,C.y)}return true}
// (a stance slot's key or button (§7b: Q W E): each selected group its own stance in slot i, each stance for those whose it is)
function stanceSlot(i){if(!B||B.muster?.active)return false;const by={};
  for(const g of selGroups()){const id=grpUnits(g).length&&groupStances(B.groups[g])[i];if(id)(by[id]||(by[id]=[])).push(g)}
  for(const id in by){const gs=by[id];if(id==='shooting')shootingCycle(gs);else if(id==='mounted')toggleMounted(gs);else if(STANCES[id].ch[0].post)toggleStance(id,gs);else toggleFlag(STANCES[id].ch[0].flag,gs)}
  return Object.keys(by).length>0}
/* your commands: a formation for the selected groups it suits (pressed again: back to line) */
function setForm(f){
  if(B?.muster?.active)return;
  if(f==='wall')return toggleFlag('shieldWall');// Compatibility for old command callers, not a formation.
  if(!B||!FORMS[f])return;const sel=selGroups().filter(g=>grpUnits(g).length),gs=sel.filter(g=>formFits(g,f));
  if(!gs.length){if(sel.length)toast('Only '+WHO_N[FORMS[f].who]+' can form '+(f==='wall'?'a shield wall':FORMS[f].say||(f==='wedge'?'a wedge':'loose order'))+'.');return}
  const to=playerOrder(gs,()=>{const to=f!=='line'&&gs.every(g=>B.groups[g].form===f)?'line':f;gs.forEach(g=>B.groups[g].setForm(to));return to});toast(gs.map(g=>htmlText(groupName(g))).join(' and ')+': '+FORMS[to].n.toLowerCase()+'.');
}
// (o.amove: Ctrl, or the Attack-move button: an attack-move to the line, rtsOrder)
function formDragTo(x0,y0,x1,y1,o){
  if(B?.muster?.active)return false;
  if(B.deploy){const a=inZone(x0,y0),b=inZone(x1,y1);x0=a.x;y0=a.y;x1=b.x;y1=b.y}// (deploying: the line in your zone)
  const plan=formPlan(x0,y0,x1,y1);if(!plan.length)return false;const am=amTake(o);playerOrder(plan.map(p=>p.g),()=>{
  // (each a move to its part of the line, facing as dragged, as wide as its share of it: battlecontrol.js; your hero shares the line)
  for(const p of plan){const gr=B.groups[p.g],go=am?'attackMove':'moveTo';gr.amEnd();if(p.hero){gr[go](p.ax,p.ay,{face:p.face});B.hero.sx=B.hero.sy=0;continue}gr[go](p.ax,p.ay,{face:p.face,files:p.files})}
  B.mark={x:(x0+x1)/2,y:(y0+y1)/2,t:.7,foe:false};if(am)B.mark.am=true;if(B.deploy)deploySnap(plan.map(p=>p.g))},{late:true});toast(htmlText(selLabel())+(am?': attack-move to the line.':': form up there.'));return true;
}
// a skill (unitabilities.js UNIT_SKILLS) for every selected group that has it (gs: those groups, the selection's): each that can use it now
// does; the rest are left as they are (cooling down, routing...). The skill bar's slots (groupSlot), the Mounted stance and the
// old letters (quiet aliases: input.js) come here
function groupAbility(id,gs=selGroups()){
  if(B?.muster?.active)return false;
  const A=B&&UNIT_SKILLS[id];if(!A)return false;const has=gs.filter(g=>grpUnits(g).length&&groupHasAbility(B.groups[g],id));if(!has.length)return false;
  const used=playerOrder(has,()=>has.filter(g=>B.groups[g].useAbility(id)),{counts:false});// (a skill is no order: a fall-back goes on)
  toast(used.length?used.map(g=>htmlText(groupName(g))).join(' and ')+': '+A.n.toLowerCase()+'.':htmlText(A.n)+': '+htmlText(abilityWhyNot(B.groups[has[0]],id).toLowerCase())+'.');return used.length>0;
}
// the formation cycle (T, §7b): each selected group on to its next of Line, Loose, a Circle (foot) or a Cantabrian circle (horse
// archers), then Wedge or Column (what its kind has: formFits)
const FORM_CYCLE=['line','loose','circle','cantabrian','wedge','column'];
function formCycle(){if(!B||B.muster?.active)return;const gs=selGroups().filter(g=>grpUnits(g).length);if(!gs.length)return;
  const next=g=>{const gr=B.groups[g],has=['line',...['loose',...RING_FORMS].filter(f=>formFits(g,f)),formFits(g,'wedge')?'wedge':'column'],i=has.indexOf(gr.form);return has[(i+1)%has.length]};
  const to=playerOrder(gs,()=>gs.map(g=>{const f=next(g);B.groups[g].setForm(f);return f}));if(to)toast(gs.map((g,i)=>htmlText(groupName(g))+': '+FORMS[to[i]].n.toLowerCase()).join(' · ')+'.')}
/* the ring (O, its button: the owner, 2026-11-01): each selected group into its own ring, a circle (foot who fight hand to hand) or a
   Cantabrian circle (horse archers), those it suits; all of them in theirs already: back to line. Its size: as the group stands
   (its files), or the line you drag next */
const groupRing=g=>RING_FORMS.find(f=>formFits(g,f))||null;
function ringForm(){if(!B||B.muster?.active)return false;const sel=selGroups().filter(g=>grpUnits(g).length),gs=sel.filter(groupRing);
  if(!gs.length){if(sel.length)toast('Only foot who fight hand to hand can form a circle, and horse archers a Cantabrian circle.');return false}
  const back=gs.every(g=>B.groups[g].form===groupRing(g)),to=playerOrder(gs,()=>gs.map(g=>{const f=back?'line':groupRing(g);B.groups[g].setForm(f);return f}));
  toast(gs.map((g,i)=>htmlText(groupName(g))+': '+FORMS[to[i]].n.toLowerCase()).join(' · ')+'.');return true}
// the skill bar's slot i (0-4: Z, X, C, V, B; battle/unitkit.js groupSlots): each selected group its own skill in that slot
function groupSlot(i){
  if(!B||B.muster?.active)return false;const by={};
  for(const g of selGroups()){const x=grpUnits(g).length&&groupSlots(B.groups[g])[i];if(x&&!x.locked)(by[x.id]||(by[x.id]=[])).push(g)}
  let used=false;for(const id in by)used=groupAbility(id,by[id])||used;return used}
// the Mounted stance (data/kits.js STANCES.mounted; its slot's key): its riders step down while any is up, else mount again
function toggleMounted(sel=selGroups()){if(!B)return false;const gs=sel.filter(g=>grpUnits(g).length);return groupAbility(gs.some(g=>groupHasAbility(B.groups[g],'dismount'))?'dismount':'mount',gs)}
