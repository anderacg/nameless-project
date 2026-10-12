'use strict';
/* ---------- conduct: what your deeds cost, and the small dialogs for meeting people on the map ---------- */
// Everything you do to people and estates has a price, set in CONDUCT (data/conduct.js): reputation where it happened, honor
// with the owner, the owner's hostility, frightened workers (half a holding's output for days), lost prosperity, your
// band's morale, and your companions' approval.

// charge a deed (a CONDUCT entry, or part of one) against holding t; returns what it cost, as a phrase for the dialog
function wrong(t,c){
  const cost=[];
  if(c.rep){addRep(t.name,-c.rep,true);cost.push('reputation in '+t.name+' −'+c.rep)}
  if(c.pros)t.pros=Math.max(0,t.pros-c.pros);
  if(c.fear)frighten(t,c.fear);
  if(c.morale){P.morale=clamp(P.morale-c.morale,0,100);cost.push('morale −'+c.morale)}
  if(t.owner&&t.owner!=='player'){
    if(c.honor){addHonor(t.owner,-c.honor,true);cost.push('honor with the '+FACS[t.owner].n+' −'+c.honor)}
    if(c.hostile&&!hostileTo(t.owner)){P.hostile[t.owner]=Math.max(P.hostile[t.owner]||0,G.day+c.hostile);log('The '+FACS[t.owner].n+' turns hostile to you for '+c.hostile+' days.','bad')}
  }
  return cost.join(', ');
}
// frightened workers run home and keep away: half the holding's output for a few days
const frighten=(t,days)=>{t.fear=Math.max(t.fear||0,G.day+days);for(const f of W.folk||[])if(f.home===t.name){f.st='back';const h=folkHome(t);f.tx=h.x;f.ty=h.y}};

/* dialogs */
// a dialog button; why (if set) disables it and says why
const dlgBtn=(act,arg,label,why,primary)=>'<button class="btn'+(primary?' primary':'')+'" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+(why?' · '+why:'')+'</button>';
const closeDialog=()=>{G.wk=G.rf=G.est=G.par=null;G.mode='world';G.encCool=Math.max(G.encCool,1);hidePanel();updateHUD(true)};
// a moment's notice in the dialog, then back to the map
function notice(title,msg,cls){G.mode='dialog';showPanel('<h2>'+title+'</h2><p class="'+(cls||'')+'">'+msg+'</p><div class="btns"><button class="btn primary" type="button" data-act="dlg-ok">Continue</button></div>');updateHUD(true)}
const levyOf=race=>RACES[race]?RACES[race].melee:'militia';
// how many more your band can take
const partyRoom=()=>partyCap()-partySize();
onAct('dlg-',()=>closeDialog());
