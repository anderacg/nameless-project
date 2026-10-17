'use strict';
/* ---------- leaders in battle, and what becomes of them. A lord or a bandit chieftain fights at the head of his men as you do:
   one fighter, far tougher than his soldiers, the more so the higher his level. Beat his army and he is yours: a lord to ransom
   to his realm or to let go, a chieftain to hand over for the bounty on his head or to let go. Either way he is back in time,
   with a new army or band. Broken by anyone else, he gets away and rebuilds. Your companions are never killed: knocked down,
   they are wounded for a few days. Lose a battle, and your captives slip away. ---------- */
// P.captives: [{k:'lord', id, name, fac, lv} | {k:'chief', ld}]; W.exiles: [{ld, back}] chieftains rebuilding a band
// (a leader's numbers: his own, as every character's: charStats, characters.js)
const captives=()=>P.captives=P.captives||[];
const lordUnit=l=>{const rs=facRaces(l.fac),r=RACES[rs[0]]||RACES.human;return r.horse||r.melee};
// the leaders fighting in this encounter, each with the side it fights on (team 1: against you)
function battleLeaders(e){
  const a=[],lord=(l,team)=>{if(l&&W.lords.includes(l)&&!l.dead)a.push({type:lordUnit(l),team,lv:lordStats(l).lv,name:l.name,ref:l})};
  if(e.kind==='lord')lord(e.ref,1);
  if((e.kind==='party'||e.kind==='camp')&&e.ref&&e.ref.ld)a.push({type:'chief',team:1,lv:e.ref.ld.lv,name:e.ref.ld.name,ref:e.ref.ld});
  const reinforcement=(l,team)=>{lord(l,team);if(l.kind==='cparty'&&l.src&&P.comps[l.src.cid])a.push({type:l.src.cid,comp:l.src.cid,team,lv:compInit(l.src.cid).lv,name:COMPS[l.src.cid].n,ref:l})};
  (e.allies||[]).forEach(l=>reinforcement(l,0));(e.foes||[]).forEach(l=>reinforcement(l,1));
  return a;
}
// his fighter: his kind's soldier, made a leader by his level

/* taken, freed, escaped */
function captureLord(l){
  captives().push({k:'lord',id:l.id,name:l.name,fac:l.fac,lv:lordStats(l).lv});l.shame=(l.shame||0)+1;// (taken often enough, he is disgraced: recruitWhy)
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

/* recruiting: a captive may join your band as a companion, a character as he was (his level, his skill tree as he grew it,
   his skills and gear), yours to grow from then on. A bandit chieftain right away, if your honor allows (an outlaw in your
   band costs RECRUIT.honor with every realm, and a realm you serve will not stand for it if it takes your honor with it below
   0). A lord only when his realm has fallen, or once he is disgraced: taken by you RECRUIT.shame times. */
const RECRUIT={honor:5,shame:3};
// '' if this captive may join you, else why not
function recruitWhy(c){
  if(partySize()>=partyCap())return 'No room in your band';
  if(c.k==='chief')return P.fac&&honorWith(P.fac)-RECRUIT.honor<0?'The '+FACS[P.fac].n+' will not stand for an outlaw in your band (your honor with them: '+honorWith(P.fac)+')':'';
  const l=W.lords.find(x=>x.id===c.id),fallen=!!W.dead[c.fac]||!fiefsOf(c.fac).length,shame=l&&l.shame||0;
  return !l?'Gone':fallen||shame>=RECRUIT.shame?'':'Sworn to the '+FACS[c.fac].n+': only when his realm falls, or once he is disgraced (taken '+RECRUIT.shame+' times; '+shame+' so far)'}
// a recruit's companion entry and its kind (made again on loading: P.recruits keeps them)
function registerRecruit(id,r){
  COMPS[id]={n:r.n,short:r.n.split(' ')[0],look:r.kind,recruit:r.from,
    d:r.from==='chief'?'Once a bandit chief; now he rides with you.':'Once a lord of the '+(FACS[r.fac]?FACS[r.fac].n:'old realms')+'; now he rides with you.',
    react:r.from==='chief'?{win:1,ransom:1,cruel:1,mercy:-1,flee:-1}:{win:1,mercy:1,release:1,cruel:-2,flee:-1}};
  ST[id]={...ST[r.kind],n:r.n,look:typeof PEOPLE_LOOK!=='undefined'&&PEOPLE_LOOK[r.kind]?r.kind:ST[r.kind].look||r.kind}}
function registerRecruits(){for(const id in P.recruits||{})registerRecruit(id,P.recruits[id])}
function recruitCaptive(i){
  const cs=captives(),c=cs[i];if(!c||recruitWhy(c))return false;
  const src=c.k==='chief'?c.ld:W.lords.find(x=>x.id===c.id),C=charOf(src);charKit(C);// (grown as he grew, by his class)
  const id='rc_'+(P.recN=(P.recN||0)+1),r=(P.recruits=P.recruits||{})[id]={n:c.k==='chief'?c.ld.name:c.name,kind:C.key,from:c.k,fac:c.k==='lord'?c.fac:null};
  registerRecruit(id,r);
  const sk={};for(const k in COMP_SK)sk[k]={lv:0,xp:0};for(const k in src.sk||{})sk[k]={...src.sk[k]};
  P.comps[id]={ap:c.k==='chief'?-1:1,role:'',lv:C.lv,xp:0,sk,gear:{...src.gear},perks:[],perkPend:0,party:null,hurt:0,tree:src.tree.slice(),tp:src.tp||0,slots:src.slots.slice(),attr:{...src.attr},kit:2,grow:c.k==='chief'?'chieftain':'lord'};
  cs.splice(i,1);
  if(c.k==='lord'){const l=W.lords.find(x=>x.id===c.id);Object.assign(l,{gone:true,held:false,recruited:true,dead:true,back:1e9})}
  else for(const f of FIDS)if(!W.dead[f])addHonor(f,-RECRUIT.honor,true);
  log(r.n+' joins your band as a companion'+(c.k==='chief'?' (the realms think less of you for it)':'')+'. Manage him in the Party tab.','gold');return true}

/* the Party tab: your captives, and what to do with them */
function captivesHtml(){
  const cs=captives(),b=(act,i,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'" data-arg="'+i+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  return '<div class="lab" style="margin-top:6px">Captives ('+cs.length+')</div>'+(cs.length?cs.map((c,i)=>c.k==='lord'
    ?'<div class="row"><div class="info"><strong>'+c.name+' <span class="muted">Lv '+c.lv+'</span></strong><small>Lord of the '+FACS[c.fac].n+'. Ransomed or let go, he rides home to raise a new army.</small></div><div class="acts">'+
      b('ct-ransom',i,'Ransom '+lordRansom(c)+'g',fiefsOf(c.fac).length?'':'His realm has fallen: no one will pay')+b('ct-recruit',i,'Recruit',recruitWhy(c))+b('ct-free',i,'Let go')+'</div></div>'
    :'<div class="row"><div class="info"><strong>'+c.ld.name+' <span class="muted">Lv '+c.ld.lv+'</span></strong><small>Bandit chief. Handed over, he hangs; let go, he gathers a new band; or he may join you.</small></div><div class="acts">'+
      b('ct-hand',i,'Hand over '+bountyOf(c.ld)+'g')+b('ct-recruit',i,'Recruit',recruitWhy(c))+b('ct-free',i,'Let go')+'</div></div>').join(''):'<p class="muted">None. Beat a lord or a bandit chief in battle to take him.</p>');
}
function captiveAct(a,arg){
  const cs=captives(),c=cs[+arg];if(!c)return;
  if(a==='ct-ransom'&&c.k==='lord'&&fiefsOf(c.fac).length){const g=lordRansom(c);P.gold+=g;W.treas[c.fac]=Math.max(0,(W.treas[c.fac]||0)-g);addHonor(c.fac,-3,true);
    const l=W.lords.find(x=>x.id===c.id);if(l)changeRel(l,RELATION.ransom,'you held them for ransom');freeCaptive(c);cs.splice(+arg,1);log('The '+FACS[c.fac].n+' pays '+g+' gold for '+c.name+'.','gold')}
  else if(a==='ct-hand'&&c.k==='chief'){const g=bountyOf(c.ld);P.gold+=g;P.renown+=2;repNear(P.x,P.y,4);cs.splice(+arg,1);log('You hand '+c.ld.name+' over to justice: '+g+' gold.','gold')}
  else if(a==='ct-recruit')recruitCaptive(+arg);
  else if(a==='ct-free'){if(c.k==='lord'){addHonor(c.fac,8,true);const l=W.lords.find(x=>x.id===c.id);if(l)changeRel(l,RELATION.letGo,'you let them go')}else repNear(P.x,P.y,-3);
    freeCaptive(c);cs.splice(+arg,1);mood('release');log('You let '+(c.k==='lord'?c.name:c.ld.name)+' go.')}
  updateHUD(true);if(G.mode==='char')renderChar();
}
onAct('ct-',captiveAct);
