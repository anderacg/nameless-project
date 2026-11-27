'use strict';
/* ---------- casual command: the battles as an auto battler with a few orders (doc/AUTO_BATTLE_DESIGN.md; the owner, 2026-11-27: "I want
   to make it auto battler but with formation management and ordering a bit (just casual style like attack hold etc.)") ----------
   Your army is laid out by its standing plan (the Army window's March formation: each group's place, formation and opening order,
   P.army.march), and fights on its own: a group on Attack is the AI's (deploy.js aiHas: commander.js fights it as it fights its own),
   one on Hold stands where it is and fights whoever comes within reach (battlecontrol.js hold). In the fight you give each group
   (or all) one of three orders, Attack, Hold or Fall back, change its formation, or take the whole army off the field (Withdraw);
   your hero is one of them. Taps on the field only pick your groups: no moves, targets or lines dragged (input.js, commands.js
   rtsOrder, formDragTo). Off (PREFS.casual: Settings, the developer console's casual on|off): the battles as before, every order
   yours. The tests' harness turns it off, as the AI's Auto (CASUAL.on). Its orders: CASUAL_ORDERS */
const CASUAL=prefView('casual');
// (the orders: n its name, d what it does; open: one a plan may open a battle with. back: how far Fall back walks, field px (a
// fight on the map's, times fightSpace))
const CASUAL_ORDERS={
  attack:{n:'Attack',open:true,d:'They fight on their own: the AI leads them at the enemy.'},
  hold:{n:'Hold',open:true,d:'They stand where they are and fight whoever comes within reach; shooters shoot.'},
  back:{n:'Fall back',d:'They step back from the enemy, facing it, and hold there.'}};
const CASUAL_BACK=70;
class Casual{
  // (in casual command now: this battle's, set as it begins, not a tournament's or the lab's)
  static on(){return !!(typeof B!=='undefined'&&B&&B.casual)}
  // (a plan's opening order for a group of yours: its march row's (world/march.js marchRowOf), Attack unless set)
  static opening(g){const id=marchRowOf(g,grpUnits(g.id)[0]),o=P.army?.march?.[id]?.order;return CASUAL_ORDERS[o]?.open?o:'attack'}
  // (the battle begins: no deploying (the plan is where they stand), each group on its plan's order)
  static begin(opts){B.casual=CASUAL.on&&!opts.tournament&&!opts.sandbox;if(!B.casual)return;B.deploy=false;B.auto=false;
    for(const id of playerGroups()){const g=B.groups[id],o=this.opening(g);g.casual=o;g.aiCmd=o==='attack'}}
  // (a group's order as you gave it: what the HUD shows; taken back to you by an order of the detailed bar's, Hold)
  static orderOf(g){return !g?'':aiHas(g)?'attack':g.casual==='back'&&g.order==='hold'?'back':'hold'}
  // (an order to groups gs (the selected, or All): each its own; the AI's notes on a group it takes cleared)
  static give(o,gs=selGroups()){if(!B||B.muster?.active||!CASUAL_ORDERS[o])return;gs=gs.filter(id=>B.groups[id]?.player&&grpUnits(id).some(u=>u.hp>0&&!u.left)&&!B.groups[id].resolve?.routed);if(!gs.length)return;
    if(o==='attack')setGroupsAuto(gs,true,true);else takeCommand(gs);
    for(const id of gs){const g=B.groups[id];g.casual=o;if(o==='hold'){g.amEnd();g.hold()}else if(o==='back')this.fallBack(g)}
    if(B.deploy)deploySnap(gs);setOrderUI();toast(htmlText(B.sel==='all'?groupName('all'):gs.map(groupName).join(' and '))+': '+CASUAL_ORDERS[o].n.toLowerCase()+'.')}
  // (Fall back: back from the foes it sees, facing them, CASUAL_BACK px (none seen, it holds where it is))
  static fallBack(g){const m=grpUnits(g.id).filter(u=>u.hp>0&&!u.left);g.amEnd();const C=g.centre(),foes=B.units.filter(e=>battleEnemy(g.team,e)&&e.hp>0&&!e.left&&!e.rout&&seenBy(g.team,e));
    if(!m.length||!foes.length){g.hold();return}const near=foes.reduce((a,e)=>Math.hypot(e.x-C.x,e.y-C.y)<Math.hypot(a.x-C.x,a.y-C.y)?e:a),a=Math.atan2(near.y-C.y,near.x-C.x),d=CASUAL_BACK*fightSpace();
    g.moveTo(C.x-Math.cos(a)*d,C.y-Math.sin(a)*d,{face:a})}
}
