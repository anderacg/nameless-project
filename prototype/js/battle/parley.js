'use strict';
/* ---------- parley: a party that ran from you and was caught may yield instead of fighting ---------- */
/* cornered: a party that ran from you and was caught may yield instead of fighting */
const cornered=(o,kind)=>(kind==='lord'?hostileTo(o.fac):true)&&stance(o.power())==='afraid';
// how likely they are to yield: the weaker they are against you, the likelier, and a famous name helps
const yieldChance=(o,kind)=>{const r=o.power()/Math.max(1,partyPower());return clamp(1.15-1.9*r+P.renown/600+.03*skill('pers')-(kind==='lord'?.15-relWith(o)/400:0),.05,.95)};
function parley(o,kind){
  if(kind==='lord'&&W.lords.includes(o))KNOWLEDGE.sight(o);
  G.par={o,kind};G.mode='dialog';P.tx=null;G.chase=null;const lord=kind==='lord',n=lord?o.troops.length:o.n,ch=Math.round(yieldChance(o,kind)*100);
  showPanel('<h2>'+(lord?o.name+' is cornered':'The '+(o.kind==='raiders'?'raiders':o.kind==='bog'?'bog raiders':o.kind==='goblins'?'goblins':'bandits')+' are cornered')+'</h2>'+
    '<p>They ran from you, but you have caught them. '+n+' '+(lord?'soldiers of the '+FACS[o.fac].n:'fighters')+' (power '+o.power()+') against your '+partyPower()+'.</p>'+
    '<p class="muted">'+goblinTongueSay(o.kind==='goblins')+'Call on them to yield ('+(r=>r?r+'; ':'')(insight([null,'they '+(ch>=50?'may well':'might')+' yield','about '+ch+'% they do'],'know the odds'))+'if not, they fight), attack at once, or let them go.</p><div class="btns">'+
    dlgBtn('pl-yield',null,'Demand surrender',kind!=='lord'?goblinTongueWhy(o.kind==='goblins')||null:null,true)+dlgBtn('pl-fight',null,'Attack')+dlgBtn('pl-go',null,'Let them go')+'</div>'+
    '<p class="muted" style="font-size:13px">'+YIELD_WHY+'</p>');
}
// what decides it, said plainly (the owner, 2026-10-30: "just need explanations"); and why they would not, when they will not
const YIELD_WHY='Who yields: they ran because they are under half your strength, but those near half of it still think they can fight their way out and seldom give up; the weaker they are, the likelier, and nearly all of a band a tenth of yours do. Your renown and Persuasion make it likelier.';
const yieldNo=o=>{const r=o.power()/Math.max(1,partyPower());return r>=.35?'they are not beaten yet: near half your strength, they mean to fight their way out':r>=.2?'enough of them think they can still break through':'a few hard men among them will not kneel'};
function parleyFight(o,kind){G.par=null;if(kind==='lord')return startEncounter({kind:'lord',ref:o,list:o.troops.slice(),mine:true});startEncounter({kind:'party',ref:o,n:o.n,list:o.troops.slice(),band:o.kind||'bandits',mine:true})}
// they yield: take them prisoner, (bandits) take them into your band, or disarm them and let them go
function parleyYield(){
  const {o,kind}=G.par,lord=kind==='lord',list=o.troops;
  // (a lord: his ransom, renown and the honor it costs as ever; his end the same window as a band's, his army's spoils a beaten
  // lord's (yieldSpoils: ON_WIN lord's drop, his purse), the soldiers sent home unarmed leaving their weapons)
  if(lord){lootStart();const ransom=80+5*list.length;P.gold+=ransom;rippleRel(o,RELATION.ransom,'you took their ransom');P.renown+=8;addHonor(o.fac,-5,true);FIDS.filter(f=>atWar(f,o.fac)).forEach(f=>addHonor(f,3,true));
    const n=cage(list),more=yieldSpoils({kind:'lord',ref:o,list},list.length-n);worldEmit('lord:beaten',{lord:o});defeatLord(o,true);G.par=null;mood('ransom');G.mode='dialog';
    return lootShow('<h2>'+o.name+' yields</h2><p>The sword is handed over, and '+ransom+' gold paid as ransom. '+(n?n+' of the soldiers become your prisoners; the rest are sent home unarmed.':'The soldiers are sent home unarmed.')+' Renown +8; the '+FACS[o.fac].n+' will not forget the shame (−5 honor).'+more+'</p>',null,0,'cont')}
  G.mode='dialog';showPanel('<h2>They yield</h2><p>The '+(o.kind==='raiders'?'raiders':o.kind==='goblins'?'goblins':'bandits')+' throw down their weapons. What becomes of them?</p><div class="btns">'+
    dlgBtn('pl-cage',null,'Take them prisoner ('+Math.min(list.length,prisonCap()-prisonerCount())+' fit)',prisonerCount()>=prisonCap()?'No room for prisoners':'',true)+
    dlgBtn('pl-join',null,'Take them into your band…',RecruitPick.room()?'':'Your band is full')+dlgBtn('pl-free',null,'Disarm them and let them go')+'</div>'+
    '<p class="muted">Brigands in your ranks lower morale and every realm\'s opinion of you. Setting them free is merciful, but the roads stay dangerous.</p>');
}
/* who of a band that yielded joins yours (the owner, 2026-10-27: you choose): each kind of theirs, as many as your band has room
   for, its headcount (partyRoom) and its groups (a kind fills its groups of ten, then takes a free one: core/army.js). It opens
   with as many as fit, taken in their order; whoever you leave is disarmed and sent off. G.par.take: {kind: n} */
class RecruitPick{
  static kinds(){const c={};for(const k of G.par.o.troops)c[k]=(c[k]||0)+1;return c}
  // (does this choice fit your band?)
  static fits(take){const r=partyRoster(P);let heads=partyRoom(),free=r.groupLimit-r.slots;
    for(const [k,n] of Object.entries(take)){if(!n)continue;if(!r.accepts(k))return false;heads-=n;const cap=r.groupCap(k),room=r.groups.filter(g=>g.type===k).reduce((a,g)=>a+Math.max(0,cap-g.count-r.wounded(g.id)),0);free-=Math.ceil(Math.max(0,n-room)/cap)}
    return heads>=0&&free>=0}
  static room(){return partyRoom()>0&&Object.keys(this.kinds()).some(k=>this.fits({[k]:1}))}
  static open(){const take={},have=this.kinds();for(const k in have)while(take[k]!==have[k]&&this.fits({...take,[k]:(take[k]||0)+1}))take[k]=(take[k]||0)+1;G.par.take=take;this.show()}
  static step(k,d){const t=G.par.take,n=(t[k]||0)+d;if(n<0||n>(this.kinds()[k]||0)||d>0&&!this.fits({...t,[k]:n}))return;t[k]=n;this.show()}
  static btn(k,d,label,off){return '<button class="btn" type="button" data-act="pl-pick" data-arg="'+k+':'+d+'" aria-label="'+(d>0?'One more ':'One fewer ')+htmlText(ST[k].n)+'"'+(off?' disabled':'')+'>'+label+'</button>'}
  static show(){const t=G.par.take,have=this.kinds(),r=partyRoster(P),n=sum(t),heads=partyRoom()-n,free=r.groupLimit-r.slots;
    const rows=Object.keys(have).map(k=>{const c=t[k]||0,no=!r.accepts(k)?'Will not serve you':'',more=c<have[k]&&this.fits({...t,[k]:c+1});
      return '<div class="pick-row"><span>'+htmlText(ST[k].n)+' <small class="muted">'+have[k]+' yielded'+(!no&&c<have[k]&&!more?', no room in your groups':'')+'</small></span>'+(no?'<small class="muted">'+no+'</small>':
        '<span class="pick-step">'+this.btn(k,-1,'−',!c)+'<b>'+c+'</b>'+this.btn(k,1,'+',!more)+'</span>')+'</div>'}).join('');
    G.mode='dialog';showPanel('<h2>Take them into your band</h2><p class="muted">Room for '+Math.max(0,heads)+' more fighters; '+free+' free group'+(free===1?'':'s')+' of ten. The rest are disarmed and sent off.</p><div class="pick-rows">'+rows+'</div>'+
      nav(['pl-back',null,'Back'],['pl-take',null,n?'Take '+n:'Take none',n?'':'Choose who joins']))}
  static take(){const {o,take}=G.par,r=partyRoster(P);lootStart();let k=0;for(const [type,n] of Object.entries(take))if(n)k+=r.add(type,n);
    const c=CONDUCT.takeBrigands;P.morale=clamp(P.morale-c.morale,0,100);FIDS.forEach(f=>addHonor(f,-c.honorAll,true));mood('cruel');
    return yieldEnd(o,'New recruits',k+' brigands join your band'+(o.troops.length>k?'; the rest are disarmed and sent off':'')+'. Your honest soldiers grumble (morale −'+c.morale+'), and every realm thinks a little less of you (−'+c.honorAll+' honor).',o.troops.length-k)}
}
function cage(list){let n=0;for(const k of list){if(prisonerCount()>=prisonCap())break;if(!ST[k]||ST[k].tier>=4||ST[k].beast)continue;P.prisoners[k]=(P.prisoners[k]||0)+1;n++}return n}
function bandGone(o){bandits=bandits.filter(x=>x!==o);worldEmit('band:beaten',{band:o});repNear(o.x,o.y,3)}
/* what a band that yields hands over (the owner, 2026-11-01: "disarm bandit should also show renown loots from them like battle
   ends"): every yield ends in a won fight's window (ui/loot.js lootShow: the head, the renown and gold it brought, the pile to take
   or leave), opened with lootStart() before the yield's own gains so it counts them. Its spoils are a win's (yieldSpoils), with no
   experience for a fight not fought. Its chieftain is yours if you take them prisoner, his purse with him; else he gets away */
function yieldEnd(o,head,text,sent,caught){
  const ld=o.ld;if(ld&&!caught){chiefEscapes(ld);o.ld=null}
  let more=yieldSpoils({kind:'party',ref:o,list:o.troops},sent);
  if(ld&&caught){captureChief(ld);o.ld=null;more+=' '+chiefCaught(ld)}
  bandGone(o);G.par=null;G.mode='dialog';lootShow('<h2>'+head+'</h2><p>'+text+more+'</p>',null,0,'cont')}
/* a yield's spoils, rolled as a win rolls them (engage.js ON_WIN: its kind's drop; a chieftain's purse, a camp's plunder:
   captives.js spoilsWon); those disarmed and sent off (sent) leave their weapons: the drop once more for every YIELD_SPOILS.arms
   of them. While a window is collecting (lootStart) it all goes on its pile. Returns the line for its window */
const YIELD_SPOILS={arms:4};
function yieldSpoils(e,sent){const O=ON_WIN[e.kind]||ON_WIN.party;
  for(let i=1+Math.round(sent/YIELD_SPOILS.arms);O.drop&&i>0;i--){const d=O.drop();if(d&&!invAdd('gear',d,1))log(BAG_FULL+'. You leave a '+ITEMS[d].n+' behind.','bad')}
  return spoilsWon(e)}
function parleyAct(a,arg){
  const p=G.par;if(!p){closeDialog();return}const {o,kind}=p;
  if(a==='pl-fight')return parleyFight(o,kind);
  if(a==='pl-go'){o.cool=8;G.encCool=3;if(kind==='lord'){addHonor(o.fac,2,true);changeRel(o,RELATION.letGo,'you let them go')}else repNear(o.x,o.y,-2);mood('mercy');closeDialog();log(kind==='lord'?'You let '+o.name+' ride away.':'You let the band go. The roads stay dangerous.');return}
  if(a==='pl-yield'){if(kind!=='lord'&&goblinTongueWhy(o.kind==='goblins'))return;const y=Math.random()<yieldChance(o,kind);train('pers',y?6:2);if(y)return parleyYield();log((kind==='lord'?o.name:'The band')+' refuses to yield: '+yieldNo(o)+'.','bad');return parleyFight(o,kind)}
  if(a==='pl-cage'&&kind==='band'){lootStart();const n=cage(o.troops),gold=rint(5,15)+o.n*2;P.gold+=gold;P.renown+=2;
    return yieldEnd(o,'Prisoners',n+' of them are bound and marched with you'+(o.n>n?'; the rest are disarmed and chased off':'')+'. You take '+gold+' gold they had stolen.',o.troops.length-n,true)}
  if(a==='pl-join'&&kind==='band'&&RecruitPick.room())return RecruitPick.open();
  if(a==='pl-pick'&&kind==='band'&&p.take){const [k,d]=String(arg).split(':');return RecruitPick.step(k,+d)}
  if(a==='pl-back'&&kind==='band')return parleyYield();
  if(a==='pl-take'&&kind==='band'&&p.take&&sum(p.take)>0&&RecruitPick.fits(p.take))return RecruitPick.take();
  if(a==='pl-free'&&kind==='band'){lootStart();P.renown+=1;mood('mercy');return yieldEnd(o,'Disarmed','You take their weapons and send them off. Some may find honest work; some will not.',o.troops.length)}
}
/* a bandit camp or hideout, from its page (sites.js Lair): parley as with a band. Pay them to break camp (tribute: a price a
   head of what you see, 12 gold), and they ride away, any bands sheltering there back on the road: no fight, no loot, no bounty.
   Or, if they fear you as a cornered band would (stance: afraid), call on them to yield, at the band's yieldChance: they do, and
   you choose their fate as a band's (lairFate: prisoners and their plunder, recruits, or let go), their chieftain your captive
   if you take them prisoner; they do not, and it is the fight. Either way the place is empty for a while, as if beaten (lairGone) */
const tribute=s=>12*s.guess().n;
function lairGone(s,gone){worldEmit('site:cleared',{site:s});if(gone)(s.bands||[]).forEach(b=>{worldEmit('band:beaten',{band:b});chiefEscapes(b.ld)});else campEmpty(s);s.bands=[];clearPlace(s,SITE_TYPES[s.type].respawn)}
function lairPay(s){const g=tribute(s);if(P.gold<g)return '';P.gold-=g;chiefEscapes(s.ld);s.ld=null;lairGone(s,false);
  return 'You pay '+g+' gold. By nightfall they have broken camp and ridden off; the '+s.T.n.toLowerCase()+' lies empty.'}
// (their power as you know it: as your scouts saw it, else as they look (Lair guess), the same the parley shows. They yield: their
// fate is yours (G.siteSpy.yielded: everyone there, their own as scouted or rolled now); they refuse: the fight, with the same)
function lairYield(s){const y=s.spied(),pw=y?s.power(s.all(y.list)):s.guess().pw;if(stance(pw)!=='afraid')return '';
  const ok=Math.random()<yieldChance({power:()=>pw},'band'),own=y?y.list:s.foes();train('pers',ok?6:2);
  if(!ok){log((s.ld?s.ld.name:'Their chieftain')+' refuses to yield and draws steel.','bad');s.fight(true,own);return ''}
  G.siteSpy=Object.assign(G.siteSpy&&G.siteSpy.s===s?G.siteSpy:{s,ok:false},{yielded:s.all(own)});return 'They throw down their weapons.'}
// (their fate: as a band's, its end the same window (lootShow), the spoils a beaten camp's (yieldSpoils: ON_WIN camp's drop, its
// chieftain's purse and its plunder: spoilsWon), those sent off disarmed; its chieftain your captive with the prisoners, his purse
// with him; else he gets away. You have left its page (sites.js Lair site-fate))
function lairFate(s,list,how){lootStart();const ld=s.ld,men=list.filter(u=>u!=='chief').length;let head,m,sent=men;
  if(how==='cage'){const n=cage(list),gold=rint(5,15)+list.length*2;P.gold+=gold;P.renown+=2;sent=men-n;head='Prisoners';
    m=n+' of them are bound and marched with you'+(men>n?'; the rest are disarmed and chased off':'')+'. You take '+gold+' gold they had stolen.'}
  else if(how==='join'&&partyRoom()>0){let k=0;for(const u of list)if(u!=='chief'&&partyRoom()>0&&partyRoster(P).canAdd(u)){P.add(u);k++}
    const c=CONDUCT.takeBrigands;P.morale=clamp(P.morale-c.morale,0,100);FIDS.forEach(f=>addHonor(f,-c.honorAll,true));mood('cruel');sent=men-k;head='New recruits';
    m=k+' brigands join your band'+(men>k?'; the rest are disarmed and sent off':'')+'. Your honest soldiers grumble (morale −'+c.morale+'), and every realm thinks a little less of you (−'+c.honorAll+' honor).'}
  else{P.renown+=1;mood('mercy');head='Disarmed';m='You take their weapons and send them off. Some may find honest work; some will not.'}
  const caught=how==='cage'&&ld;if(ld&&!caught){chiefEscapes(ld);s.ld=null}
  m+=yieldSpoils({kind:'camp',ref:s,list},sent);
  if(caught){captureChief(ld);s.ld=null;m+=' '+chiefCaught(ld)}
  G.siteSpy=null;lairGone(s,true);G.mode='dialog';lootShow('<h2>'+head+'</h2><p>'+m+'</p>',null,0,'cont')}
// (a chieftain taken: what to do with him)
const chiefCaught=ld=>'You take '+chiefLabel(ld)+' captive: hand '+pr(ld).him+' over for '+bountyOf(ld)+' gold, or let '+pr(ld).him+' go (Hero, Party).'
// what happens when you reach a roaming party: a hostile one that fears you is cornered; else the fight it wants
function meetBand(b){if(cornered(b,'band')&&!seamless({kind:'party'}))return parley(b,'band');// (seamless: no talk, the fight at once: SEAMLESS)
  startEncounter({kind:'party',ref:b,n:b.n,list:b.troops.slice(),band:b.kind||'bandits',word:b.word})}
onAct('pl-',parleyAct);
