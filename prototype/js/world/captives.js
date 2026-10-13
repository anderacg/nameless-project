'use strict';
/* ---------- leaders in battle, and what becomes of them. A lord or a bandit chieftain fights at the head of his men as you do:
   one fighter, far tougher than his soldiers, the more so the higher his level. Beat his army and he is yours: a lord to ransom
   to his realm or to let go, a chieftain to hand over for the bounty on his head or to let go. Either way he is back in time,
   with a new army or band. Broken by anyone else, he gets away and rebuilds. Your companions are never killed: knocked down,
   they are wounded for a few days. Lose a battle, and your captives slip away. ---------- */
// P.captives: [{k:'lord', id, name, fac, lv} | {k:'chief', ld}]; W.exiles: [{ld, back}] chieftains rebuilding a band
const LEADER_HP=[1.6,.12],LEADER_DMG=[1.2,.07];// a leader's health and damage against his kind's: base, and more a level
const captives=()=>P.captives=P.captives||[];
const lordUnit=l=>{const rs=facRaces(l.fac),r=RACES[rs[0]]||RACES.human;return r.horse||r.melee};
// the leaders fighting in this encounter, each with the side it fights on (team 1: against you)
function battleLeaders(e){
  const a=[],lord=(l,team)=>{if(l&&W.lords.includes(l)&&!l.dead)a.push({type:lordUnit(l),team,lv:lordStats(l).lv,name:l.name,ref:l})};
  if(e.kind==='lord')lord(e.ref,1);
  if((e.kind==='party'||e.kind==='camp')&&e.ref&&e.ref.ld)a.push({type:'chief',team:1,lv:e.ref.ld.lv,name:e.ref.ld.name,ref:e.ref.ld});
  (e.allies||[]).forEach(l=>lord(l,0));(e.foes||[]).forEach(l=>lord(l,1));
  return a;
}
// his fighter: his kind's soldier, made a leader by his level
const leaderStats=(s,lv)=>({...s,hp:Math.round(s.hp*(LEADER_HP[0]+LEADER_HP[1]*lv)),dmg:+(s.dmg*(LEADER_DMG[0]+LEADER_DMG[1]*lv)).toFixed(1)});

/* taken, freed, escaped */
function captureLord(l){
  captives().push({k:'lord',id:l.id,name:l.name,fac:l.fac,lv:lordStats(l).lv});
  l.inside=null;l.dead=true;l.held=true;l.troops=[];l.back=1e9;l.state='rest';// (back when ransomed or let go)
}
function captureChief(ld){if(ld)captives().push({k:'chief',ld})}
// a chieftain who got away: back with a new band in a few days
function chiefEscapes(ld,days){if(!ld)return;(W.exiles=W.exiles||[]).push({ld,back:G.day+(days||rint(4,8))})}
// a captive let go (or slipped away): a lord rides home to raise a new army, a chieftain to gather a new band
function freeCaptive(c,days){
  if(c.k==='lord'){const l=W.lords.find(x=>x.id===c.id);if(l){l.held=false;l.back=G.day+(days||5)}}
  else chiefEscapes(c.ld,days);
}
const lordRansom=c=>80+30*c.lv;
// once a day: chieftains who got away come back with a new band
function chiefDay(){
  const ex=W.exiles=W.exiles||[];for(const x of ex.filter(x=>G.day>=x.back)){spawnBandit(false,x.ld);x.done=true}
  W.exiles=ex.filter(x=>!x.done);
}
// your band is routed: the captives slip away in the chaos
function captivesEscape(){const cs=captives();if(!cs.length)return;cs.forEach(c=>freeCaptive(c,3));P.captives=[];log('Your captives slip away in the chaos.','bad')}

/* the Party tab: your captives, and what to do with them */
function captivesHtml(){
  const cs=captives(),b=(act,i,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+i+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  return '<div class="lab" style="margin-top:6px">Captives ('+cs.length+')</div>'+(cs.length?cs.map((c,i)=>c.k==='lord'
    ?'<div class="row"><div class="info"><strong>'+c.name+' <span class="muted">Lv '+c.lv+'</span></strong><small>Lord of the '+FACS[c.fac].n+'. Ransomed or let go, he rides home to raise a new army.</small></div><div class="acts">'+
      b('ct-ransom',i,'Ransom '+lordRansom(c)+'g',fiefsOf(c.fac).length?'':'His realm has fallen: no one will pay')+b('ct-free',i,'Let go')+'</div></div>'
    :'<div class="row"><div class="info"><strong>'+c.ld.name+' <span class="muted">Lv '+c.ld.lv+'</span></strong><small>Bandit chief. Handed over, he hangs; let go, he gathers a new band.</small></div><div class="acts">'+
      b('ct-hand',i,'Hand over '+bountyOf(c.ld)+'g')+b('ct-free',i,'Let go')+'</div></div>').join(''):'<p class="muted">None. Beat a lord or a bandit chief in battle to take him.</p>');
}
function captiveAct(a,arg){
  const cs=captives(),c=cs[+arg];if(!c)return;
  if(a==='ct-ransom'&&c.k==='lord'&&fiefsOf(c.fac).length){const g=lordRansom(c);P.gold+=g;W.treas[c.fac]=Math.max(0,(W.treas[c.fac]||0)-g);addHonor(c.fac,-3,true);
    const l=W.lords.find(x=>x.id===c.id);if(l)changeRel(l,RELATION.ransom,'you held them for ransom');freeCaptive(c);cs.splice(+arg,1);log('The '+FACS[c.fac].n+' pays '+g+' gold for '+c.name+'.','gold')}
  else if(a==='ct-hand'&&c.k==='chief'){const g=bountyOf(c.ld);P.gold+=g;P.renown+=2;repNear(P.x,P.y,4);cs.splice(+arg,1);log('You hand '+c.ld.name+' over to justice: '+g+' gold.','gold')}
  else if(a==='ct-free'){if(c.k==='lord'){addHonor(c.fac,8,true);const l=W.lords.find(x=>x.id===c.id);if(l)changeRel(l,RELATION.letGo,'you let them go')}else repNear(P.x,P.y,-3);
    freeCaptive(c);cs.splice(+arg,1);mood('release');log('You let '+(c.k==='lord'?c.name:c.ld.name)+' go.')}
  updateHUD(true);if(G.mode==='char')renderChar();
}
onAct('ct-',captiveAct);
