'use strict';
/* ---------- conduct: what your deeds cost, and the small dialogs for meeting people on the map ---------- */
// Everything you do to people and estates has a price, set in CONDUCT (data/conduct.js): reputation where it happened, honor
// with the owner, the owner's hostility, frightened workers (half a holding's output for days), lost prosperity, your
// band's morale, and your companions' approval.

// charge a deed (a CONDUCT entry, or part of one) against holding t; returns what it cost, as a phrase for the dialog
function wrong(t,c){
  const cost=[];
  if(c.rep){addRep(t.name,-c.rep,true);cost.push('reputation in '+t.name+' −'+c.rep);
    // the holding's guards remember it: they stop you and demand a fine (patrols.js)
    if(t.owner&&t.owner!=='player'){const old=crimeAt(t);t.crime={until:G.day+PATROL.wanted,fine:(old?old.fine:0)+c.rep*PATROL.fine}}}
  if(c.pros)t.pros=Math.max(0,t.pros-c.pros);
  if(c.fear)frighten(t,c.fear);
  if(c.morale){P.morale=clamp(P.morale-c.morale,0,100);cost.push('morale −'+c.morale)}
  if(t.owner&&t.owner!=='player'){
    if(c.honor){addHonor(t.owner,-c.honor,true);cost.push('honour with the '+FACS[t.owner].n+' −'+c.honor);W.lords.filter(l=>l.fac===t.owner&&!l.dead).forEach(l=>changeRel(l,RELATION.harmRealm,'you wronged the people of '+t.name))}
    if(c.hostile&&!hostileTo(t.owner)){Timed.of(P,'hostile').extend(t.owner,c.hostile);log('The '+FACS[t.owner].n+' turns hostile to you for '+c.hostile+' days.','bad')}
  }
  return cost.join(', ');
}
// frightened workers run home and keep away: half the holding's output for a few days
const frighten=(t,days)=>{Timed.of(t).extend('fear',days);for(const f of W.folk)if(f.home===t.name&&folkOut(f)){f.st='back';const door=folkDoor(t,f.k);f.tx=door.x;f.ty=door.y}};// (its workers on the road hurry back in: folk.js)

/* dialogs */
// a dialog button; why (if set) disables it and says why
const dlgBtn=(act,arg,label,why,primary)=>'<button class="btn'+(primary?' primary':'')+'" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+(why?' · '+why:'')+'</button>';
const closeDialog=()=>{G.wk=G.rf=G.est=G.par=null;G.mode='world';G.encCool=Math.max(G.encCool,1);hidePanel();updateHUD(true)};
// a moment's notice in the dialog, then back to the map
function notice(title,msg,cls){G.mode='dialog';showPanel('<h2>'+title+'</h2><p class="'+(cls||'')+'">'+msg+'</p>'+nav(null,['dlg-ok',null,'Continue']));updateHUD(true)}
const levyOf=race=>RACES[race]?RACES[race].melee:'militia';
onAct('dlg-',()=>closeDialog());
