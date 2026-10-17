'use strict';
/* ---------- player battle commands ---------- */
// Stateless routing over the active battle. BattleControl owns group mechanics; formations owns layout; the HUD owns drawing.
// Keep these global entry points for existing mouse, touch, keyboard, HUD and test callers.
// what you have selected: all, one group, or several (a box round them)
const selGroups=()=>!B?[]:(B.sel==='all'?playerGroups():Array.isArray(B.sel)?B.sel:[B.sel]).filter(g=>playerGroups().includes(g));
const selLabel=()=>B.sel==='all'?groupName('all'):selGroups().map(g=>groupName(g)).join(' and ');
const regroup=g=>B.groups[g]&&B.groups[g].regroup();// (its place where its men are: battlecontrol.js)
const RTS_PICK=10;
// an order of yours to these groups: counted (orderSeq), so a character's fall-back ends on any of them (commander.js fallLook)
const ordered=gs=>gs.forEach(g=>{const gr=B.groups[g];if(gr)gr.orderSeq=(gr.orderSeq|0)+1});
// every order of yours to groups gs: command taken back from Auto, counted (a move, an attack, Hold, the pace, a formation, a flag;
// not a unit ability: counts false), done (fn), the order bar redrawn; returns what fn does
function playerOrder(gs,fn,{counts=true}={}){takeCommand();if(counts)ordered(gs);const r=fn();setOrderUI();return r}
// the unit under a point: on a group's icon, its soldier nearest the group's middle (the icon is clicked as the group: select,
// attack, everything a click on a soldier does); else the nearest soldier within RTS_PICK
function rtsUnitAt(x,y,team){
  const ic=iconAt(x,y,team);if(ic){let best=null,bd=1e9;for(const u of B.units){if(u.hp<=0||u.grp!==ic.g)continue;const d=Math.hypot(u.x-ic.cx,u.y-ic.cy);if(d<bd){bd=d;best=u}}if(best)return best}
  let best=null,bd=RTS_PICK;for(const u of B.units){if(u.hp<=0||u.team!==team)continue;const d=Math.hypot(u.x-x,u.y-6-y);if(d<bd){bd=d;best=u}}return best}
// select: a click picks the group of the unit under it (nothing under it: all); a box picks every group with a unit inside
function rtsSelect(x0,y0,x1,y1,add){
  const was=add?selGroups():[];
  if(Math.hypot(x1-x0,y1-y0)<5){const u=rtsUnitAt(x1,y1,0);B.sel=u&&playerGroups().includes(u.grp)?u.grp:add?B.sel:'all'}// (your allies' men are theirs to command)
  else{const xa=Math.min(x0,x1),xb=Math.max(x0,x1),ya=Math.min(y0,y1),yb=Math.max(y0,y1),gs=playerGroups().filter(g=>grpUnits(g).some(u=>u.x>=xa&&u.x<=xb&&u.y-6>=ya&&u.y-6<=yb));
    B.sel=!gs.length?B.sel:gs.length===1?gs[0]:gs.length===playerGroups().filter(g=>grpUnits(g).length).length?'all':gs}
  if(add&&B.sel!=='all'){const all=[...new Set([...was,...selGroups()])].filter(g=>grpUnits(g).length);B.sel=all.length>=playerGroups().filter(g=>grpUnits(g).length).length?'all':all.length===1?all[0]:all}// (Shift: added to what you had)
  setOrderUI();
}
// right-click: on an enemy, the selected set on it; on the ground, sent there keeping their places relative to one another
// (opt.queue: Shift, a waypoint after the ones they have; opt.run: a double right-click, at a run)
function rtsOrder(x,y,opt){
  opt=opt||{};const gs=selGroups().filter(g=>grpUnits(g).length&&!B.groups[g].resolve?.routed);if(!gs.length)return;playerOrder(gs,()=>{
  if(B.deploy){const p=inZone(x,y);x=p.x;y=p.y;opt={}}// (deploying: a spot in your zone, no enemy to set them on)
  const e=B.deploy?null:rtsUnitAt(x,y,1);
  {const ic=!e&&iconAt(x,y,0);if(ic&&!B.deploy){x=ic.cx;y=ic.cy}}// (on one of your icons: to where that group stands)
  gs.forEach(g=>B.groups[g].setRun(!!opt.run));// (a double right-click: this order at a run, a charge on an enemy)
  if(!e&&opt.queue){// a waypoint after their last, the groups keeping their places relative to one another
    gs.forEach(g=>B.groups[g].toHold());
    const last=g=>{const gr=B.groups[g];return gr.queue.length?gr.queue[gr.queue.length-1]:{x:gr.ax,y:gr.ay}},cx=gs.reduce((a,g)=>a+last(g).x,0)/gs.length,cy=gs.reduce((a,g)=>a+last(g).y,0)/gs.length;
    gs.forEach(g=>{const l=last(g);B.groups[g].queueTo(x+l.x-cx,y+l.y-cy)});B.mark={x,y,t:.7,foe:false};return}
  if(e){gs.forEach(g=>B.groups[g].attack(e,{run:!!opt.run}));log(htmlText(selLabel())+': attack the '+htmlText(e.grp&&B.groups[e.grp]?groupName(e.grp):e.leader?e.leader.name:ST[e.type]?ST[e.type].n.toLowerCase():'enemy')+'.')}
  else{gs.forEach(regroup);const cx=gs.reduce((a,g)=>a+B.groups[g].ax,0)/gs.length,cy=gs.reduce((a,g)=>a+B.groups[g].ay,0)/gs.length;
    gs.forEach(g=>{const gr=B.groups[g];gr.moveTo(x+gr.ax-cx,y+gr.ay-cy,{run:!!opt.run})})}
  if(B.deploy)deploySnap(gs);
  B.mark={x,y,t:.7,foe:!!e}});
}
// an order to the selected groups: hold (where they stand), charge, advance, withdraw (flee the battle: off your edge,
// straight back off your edge, striking no one: once all have withdrawn the battle ends as your retreat, morale.js). Any order calls off a target and the waypoints
function setOrder(o){
  if(!B)return;const pace=o==='charge'||o==='advance';
  // (Charge and Advance set the pace, run or walk, and nothing else: where they go and whom they fight stay as they were;
  // hold: where they stand; withdraw: off your edge (battlecontrol.js))
  playerOrder(selGroups(),()=>{for(const g of selGroups()){const gr=B.groups[g];if(pace)gr.setWalk(o==='advance');else if(o==='withdraw')gr.withdraw();else if(o==='hold')gr.hold()}});
  log(htmlText(selLabel())+': '+(pace?o==='charge'?'at a run.':'at a walk.':o+'.'));
}
// a group's flag on or off for the selection: walk, firm (hold ground), cease (cease fire), skirmish, melee (shooters' blades)
const FLAG_N={walk:['walk','run'],firm:['hold their ground','fight freely'],shieldWall:['shield wall requested for eligible soldiers','shields lowered'],cease:['cease fire','fire at will'],skirmish:['skirmish','stand'],melee:['melee mode on: they fight whoever reaches them','melee mode off: they keep shooting, point blank']};
function toggleFlag(f){if(!B||!FLAG_N[f])return;const gs=selGroups().filter(g=>grpUnits(g).some(u=>flagEligible(u,f)));if(!gs.length)return;const on=playerOrder(gs,()=>{const on=!gs.every(g=>B.groups[g][f]);gs.forEach(g=>B.groups[g].setFlag(f,on));return on});log(htmlText(selLabel())+': '+FLAG_N[f][on?0:1]+'.')}
// control groups: Ctrl+1-9 keeps the selection under that key, 1-9 picks it again
function ctrlGroup(k,save){if(!B)return;B.ctrl=B.ctrl||{};if(save){B.ctrl[k]=B.sel==='all'?'all':selGroups().slice();log('Group '+k+': '+htmlText(selLabel())+'.');return}
  const c=B.ctrl[k];if(!c){const id=playerGroups()[k==='0'?9:Number(k)-1];if(id)selectGroup(id);return}const gs=c==='all'?'all':c.filter(g=>grpUnits(g).length);if(gs!=='all'&&!gs.length)return;B.sel=gs==='all'?'all':gs.length===1?gs[0]:gs;setOrderUI()}
function selectGroup(g,add=false){if(!B||g!=='all'&&(!playerGroups().includes(g)||!grpUnits(g).length))return;if(add&&g!=='all'){const gs=B.sel==='all'?[]:selGroups();B.sel=[...new Set([...gs,g])]}else B.sel=g;setOrderUI()}
function cycleGroup(){if(!B)return;const opts=['all',...playerGroups().filter(g=>grpUnits(g).length)];B.sel=opts[(opts.indexOf(B.sel)+1)%opts.length];setOrderUI()}
/* your commands: a formation for the selected groups it suits (pressed again: back to line) */
function setForm(f){
  if(f==='wall')return toggleFlag('shieldWall');// Compatibility for old command callers, not a formation.
  if(!B||!FORMS[f])return;const sel=selGroups().filter(g=>grpUnits(g).length),gs=sel.filter(g=>formFits(g,f));
  if(!gs.length){if(sel.length)log('Only '+WHO_N[FORMS[f].who]+' can form '+(f==='wall'?'a shield wall':f==='wedge'?'a wedge':'loose order')+'.');return}
  const to=playerOrder(gs,()=>{const to=f!=='line'&&gs.every(g=>B.groups[g].form===f)?'line':f;gs.forEach(g=>B.groups[g].setForm(to));return to});log(gs.map(g=>htmlText(groupName(g))).join(' and ')+': '+FORMS[to].n.toLowerCase()+'.');
}
function formDragTo(x0,y0,x1,y1){
  if(B.deploy){const a=inZone(x0,y0),b=inZone(x1,y1);x0=a.x;y0=a.y;x1=b.x;y1=b.y}// (deploying: the line in your zone)
  const plan=formPlan(x0,y0,x1,y1);if(!plan.length)return false;playerOrder(plan.map(p=>p.g),()=>{
  // (each a move to its part of the line, facing as dragged, as wide as its share of it: battlecontrol.js; your hero stands behind)
  for(const p of plan){const gr=B.groups[p.g];if(p.hero){gr.moveTo(p.ax,p.ay,{face:p.face});B.hero.sx=B.hero.sy=0;continue}gr.moveTo(p.ax,p.ay,{face:p.face,files:p.files})}
  B.mark={x:(x0+x1)/2,y:(y0+y1)/2,t:.7,foe:false};if(B.deploy)deploySnap(plan.map(p=>p.g))});log(htmlText(selLabel())+': form up there.');return true;
}
// a unit ability (unitabilities.js) for every selected group that has it: each that can use it now does; the rest are left as
// they are (cooling down, routing...). The order bar's ability buttons and their keys (G, I, U, Y) come here
function groupAbility(id){
  const A=B&&UNIT_ABILITIES[id];if(!A)return false;const has=selGroups().filter(g=>grpUnits(g).length&&groupHasAbility(B.groups[g],id));if(!has.length)return false;
  const used=playerOrder(has,()=>has.filter(g=>B.groups[g].useAbility(id)),{counts:false});// (an ability is no order: a fall-back goes on)
  log(used.length?used.map(g=>htmlText(groupName(g))).join(' and ')+': '+A.n.toLowerCase()+'.':htmlText(A.n)+': '+htmlText(abilityWhyNot(B.groups[has[0]],id).toLowerCase())+'.');return used.length>0;
}
