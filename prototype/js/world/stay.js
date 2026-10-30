'use strict';
/* ---------- staying in a holding: your band goes inside and waits while the world's time runs on (pause, 1x, 2x, 3x).
   Inside you are off the map (nothing chases you, the frost and the desert cannot reach you), you recover far faster, and
   you can still use the town. Free for as long as you like where they know you (your own fief, your employer's holding,
   standing 30 or more); elsewhere the inn charges for each day, and sends you out when you cannot pay. Castles take no
   paying guests. A siege on the holding is the one thing that interrupts you. ---------- */
// P.stay: {town, paidTo (world time the paid days run to), warned (siege seen)}
const STAY_FREE=30,STAY_BASE=5;
const stayMen=()=>troopCount()+woundedN()+compsInBand().length;
const stayCost=()=>STAY_BASE+Math.ceil(stayMen()/2);
const stayFree=t=>t.owner==='player'||!!P.fac&&t.owner===P.fac||standingAt(t)>=STAY_FREE;
const worldTime=()=>Clock.worldTime();// (clock.js)
const stayTown=()=>P.stay&&townBy(P.stay.town);
// why you may not stay here ('' if you may)
// (the rules for you and your companions' parties; every party has its own: parties.js shelterWhy)
function yourShelterWhy(t,cost){
  if(hostileTo(t.owner))return 'Its realm is hostile to you';
  if(besieged(t))return 'The gates are barred for the siege';
  if(ruined(t))return 'It lies in ruins';
  if(standingAt(t)<0)return 'They will not have you';
  const free=stayFree(t);
  if(!t.takesGuests(free))return 'A '+t.label+' takes no paying guests';
  if(!free&&cost!=null&&P.gold<cost)return 'Not enough gold for a day';
  return '';
}
const stayWhy=t=>P.shelterWhy(t);
// the terms, for the button
const stayTerms=t=>stayFree(t)?'free (they know you)':stayCost()+'g a day';
const stayBtn=t=>{const why=stayWhy(t);return '<button class="btn" type="button" data-act="sy-stay" data-arg="'+t.name+'"'+(why?' disabled title="'+why+'"':'')+'>Stay · '+(why||stayTerms(t))+'</button>'};
// the day your gold runs out at this rate
const stayUntil=()=>Math.floor((P.stay.paidTo+Math.floor(P.gold/stayCost())*DAY)/DAY);
function startStay(t){
  if(stayWhy(t))return false;const free=stayFree(t);
  if(!free)P.gold-=stayCost();
  P.stay={town:t.name,paidTo:worldTime()+DAY,warned:false};P.tx=null;G.chase=null;P.x=t.x;P.y=t.y;G.lastTown=t;
  G.town=null;G.scene=null;G.mode='world';hidePanel();
  log('Your band takes lodgings in '+t.name+(free?'. They will not take your coin.':' for '+stayCost()+' gold a day.'),'good');
  updateHUD(true);return true;
}
// out of the gate (why: the message, if it was not your choice)
function leaveStay(why,cls){
  const t=stayTown();P.stay=null;if(t){heroAtGate(t);G.lastTown=t}G.encCool=2;P.tx=null;G.chase=null;
  log(why||'You leave '+(t?t.name:'your lodgings')+' and take the road again.',cls||'');updateHUD(true);
}
// each moment inside: stay at the gate (unseen), recover, and watch for trouble; true if it opened a window
function stayTick(d){
  const t=stayTown();if(!t){P.stay=null;return false}
  if(hostileTo(t.owner)){leaveStay('The gates of '+t.name+' are no longer open to you. You are put out on the road.','bad');return false}
  P.x=t.x;P.y=t.y;P.tx=null;G.chase=null;G.encCool=Math.max(G.encCool,.5);G.lastTown=t;
  regenVitals(d/DAY);P.morale=Math.min(100,P.morale+15*d/DAY);// on top of the road's rate: 4x in all
  if(!P.stay.warned&&siegeLordsAt(t).length){P.stay.warned=true;staySiege(t);return true}
  if(!stayFree(t)&&worldTime()>=P.stay.paidTo){
    if(P.gold<stayCost()){leaveStay('You cannot pay for another day. The innkeeper of '+t.name+' sends your band out.','bad');return false}
    P.gold-=stayCost();P.stay.paidTo+=DAY;
  }
  return false;
}
// clicking on the map while you stay: the holding opens its panel, anything else reminds you to leave first
function stayClick(wx,wy){
  const t=stayTown(),o=pickAt(wx,wy);
  if(o===t){if(siegeLordsAt(t).length)return staySiege(t);return enterTown(t)}
  const now=performance.now();if(now-(G.stayNag||-1e9)>2500){G.stayNag=now;log('You are staying in '+t.name+'. Leave first (Leave, under the minimap).')}
}
// a siege on the holding while you are inside: man the walls, slip out, or wait it out
function staySiege(t){
  const ls=siegeLordsAt(t);if(!ls.length)return;G.mode='dialog';P.tx=null;
  const l=ls.slice().sort((a,b)=>lordSpeed(b)-lordSpeed(a))[0],od=fleeOdds({kind:'lord',ref:l,foes:ls.filter(o=>o!==l&&Math.hypot(o.x-l.x,o.y-l.y)>40)});
  showPanel('<div class="top"><h2>'+t.name+' is besieged</h2><span class="muted">You are inside</span></div>'+
    '<p>'+ls.map(o=>o.name+' of the '+FACS[o.fac].n+' ('+o.troops.length+' soldiers, power '+o.power()+')').join(' and ')+' '+(ls.length>1?'surround':'surrounds')+' the walls. Your power <strong>'+partyPower()+'</strong>, the garrison '+t.gar+'.</p>'+
    '<div class="btns" style="flex-direction:column;align-items:stretch">'+
    ls.map((o,i)=>dlgBtn('sy-defend',i,'Defend the walls: attack '+o.name+(hostileTo(o.fac)?'':' (the '+FACS[o.fac].n+' turns hostile)'),P.fac&&P.fac===o.fac?'Your employer':'',!i)).join('')+
    dlgBtn('sy-slip','','Slip out past '+l.name+(od.ch>0?' · '+Math.round(od.ch*100)+'% to get away':''),od.ch>0?'':od.why)+
    dlgBtn('sy-wait','','Stay inside and wait it out')+'</div>'+
    '<p class="muted" style="font-size:13px">If you wait and '+t.name+' falls, you are thrown out with the defeated and a quarter of your soldiers are lost. Slipping out and caught, your rearguard pays and you must fight.</p>');
}
// the holding falls while you are inside
function stayFall(t){
  if(!P.stay||P.stay.town!==t.name)return;const lost={};
  for(const k in P.troops){const n=Math.round(P.troops[k]*.25);if(n)lost[k]=n}applyLosses(lost);
  leaveStay(t.name+' falls with your band inside. You are thrown out with the defeated'+(Object.keys(lost).length?', and lose '+lossText(lost):'')+'.','bad');
}
function stayAct(a,arg){
  if(a==='sy-stay'){const t=townBy(arg);if(t)startStay(t);return}
  if(a==='sy-leave'){if(G.mode!=='world'&&G.mode!=='town'&&G.mode!=='scene')return;if(G.mode!=='world'){G.town=null;G.scene=null;G.mode='world';hidePanel()}leaveStay();return}
  const t=stayTown();if(!t){closeDialog();return}
  if(a==='sy-wait'){G.mode='world';hidePanel();log('Your band waits inside the walls of '+t.name+'.');return}
  if(a==='sy-defend'){const l=siegeLordsAt(t)[+arg];if(!l||P.fac&&P.fac===l.fac)return;
    realmOf(l.fac).provoke(20,15);
    leaveStay('You lead your band out of the gate of '+t.name+' against '+l.name+'.');G.encCool=0;startEncounter({kind:'lord',ref:l,list:l.troops.slice(),mine:true});return}
  if(a==='sy-slip'){const ls=siegeLordsAt(t),l=ls.slice().sort((a,b)=>lordSpeed(b)-lordSpeed(a))[0];if(!l)return;
    const e={kind:'lord',ref:l,list:l.troops.slice(),foes:ls.filter(o=>o!==l&&Math.hypot(o.x-l.x,o.y-l.y)>40),mine:false};if(fleeOdds(e).ch<=0)return;
    leaveStay('Your band slips out of '+t.name+' by night.');e.foes=[];G.enc=e;flee();return}
}
onAct('sy-',stayAct);
// its work in the world's day and frame (core/systems.js) (a stay's moment ends the frame while it runs: stayTick)
Systems.add({name:'stay',order:{frame:10},frame:d=>P.stay&&stayTick(d),ends:true});
