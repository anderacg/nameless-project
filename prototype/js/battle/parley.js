'use strict';
/* ---------- parley: a party that ran from you and was caught may yield instead of fighting ---------- */
/* cornered: a party that ran from you and was caught may yield instead of fighting */
const cornered=(o,kind)=>(kind==='lord'?hostileTo(o.fac):true)&&stance(kind==='lord'?rating(o.troops):bandPower(o))==='afraid';
// how likely they are to yield: the weaker they are against you, the likelier, and a famous name helps
const yieldChance=(o,kind)=>{const pw=kind==='lord'?rating(o.troops):bandPower(o),r=pw/Math.max(1,partyPower());return clamp(1.15-1.9*r+P.renown/600+.03*skill('pers')-(kind==='lord'?.15-relWith(o)/400:0),.05,.95)};
function parley(o,kind){
  G.par={o,kind};G.mode='dialog';P.tx=null;G.chase=null;const lord=kind==='lord',n=lord?o.troops.length:o.n,ch=Math.round(yieldChance(o,kind)*100);
  showPanel('<h2>'+(lord?o.name+' is cornered':'The '+(o.kind==='raiders'?'raiders':o.kind==='bog'?'bog raiders':'bandits')+' are cornered')+'</h2>'+
    '<p>They ran from you, but you have caught them. '+n+' '+(lord?'soldiers of the '+FACS[o.fac].n:'fighters')+' (power '+(lord?rating(o.troops):bandPower(o))+') against your '+partyPower()+'.</p>'+
    '<p class="muted">Call on them to yield (about '+ch+'% they do; if not, they fight), attack at once, or let them go.</p><div class="btns">'+
    dlgBtn('pl-yield',null,'Demand surrender',null,true)+dlgBtn('pl-fight',null,'Attack')+dlgBtn('pl-go',null,'Let them go')+'</div>');
}
function parleyFight(o,kind){G.par=null;if(kind==='lord')return startEncounter({kind:'lord',ref:o,list:o.troops.slice()});startEncounter({kind:'party',ref:o,n:o.n,list:o.list.slice(),band:o.kind||'bandits'})}
// they yield: take them prisoner, (bandits) take them into your band, or disarm them and let them go
function parleyYield(){
  const {o,kind}=G.par,lord=kind==='lord',list=lord?o.troops:o.list;
  if(lord){const ransom=80+5*list.length;P.gold+=ransom;rippleRel(o,RELATION.ransom,'you took their ransom');P.renown+=8;addHonor(o.fac,-5,true);FIDS.filter(f=>atWar(f,o.fac)).forEach(f=>addHonor(f,3,true));
    const pr=cage(list);questNotify('lord',o);defeatLord(o);G.par=null;mood('ransom');
    return notice(o.name+' yields','The sword is handed over, and '+ransom+' gold paid as ransom. '+(pr?pr+' of the soldiers become your prisoners; the rest are sent home unarmed.':'The soldiers are sent home unarmed.')+' Renown +8; the '+FACS[o.fac].n+' will not forget the shame (−5 honor).','good')}
  G.mode='dialog';showPanel('<h2>They yield</h2><p>The '+(o.kind==='raiders'?'raiders':'bandits')+' throw down their weapons. What becomes of them?</p><div class="btns">'+
    dlgBtn('pl-cage',null,'Take them prisoner ('+Math.min(list.length,prisonCap()-prisonerCount())+' fit)',prisonerCount()>=prisonCap()?'No room for prisoners':'',true)+
    dlgBtn('pl-join',null,'Take them into your band ('+Math.min(list.length,partyRoom())+')',partyRoom()<1?'Your band is full':'')+dlgBtn('pl-free',null,'Disarm them and let them go')+'</div>'+
    '<p class="muted">Brigands in your ranks lower morale and every realm\'s opinion of you. Setting them free is merciful, but the roads stay dangerous.</p>');
}
function cage(list){let n=0;for(const k of list){if(prisonerCount()>=prisonCap())break;if(!ST[k]||ST[k].tier>=4||ST[k].beast)continue;P.prisoners[k]=(P.prisoners[k]||0)+1;n++}return n}
function bandGone(o){bandits=bandits.filter(x=>x!==o);questNotify('band',o);repNear(o.x,o.y,3)}
function parleyAct(a){
  const p=G.par;if(!p){closeDialog();return}const {o,kind}=p;
  if(a==='pl-fight')return parleyFight(o,kind);
  if(a==='pl-go'){o.cool=8;G.encCool=3;if(kind==='lord'){addHonor(o.fac,2,true);changeRel(o,RELATION.letGo,'you let them go')}else repNear(o.x,o.y,-2);mood('mercy');closeDialog();log(kind==='lord'?'You let '+o.name+' ride away.':'You let the band go. The roads stay dangerous.');return}
  if(a==='pl-yield'){const y=Math.random()<yieldChance(o,kind);train('pers',y?6:2);if(y)return parleyYield();log((kind==='lord'?o.name:'The band')+' refuses to yield and draws steel.','bad');return parleyFight(o,kind)}
  if(a==='pl-cage'&&kind==='band'){const n=cage(o.list),gold=rint(5,15)+o.n*2;P.gold+=gold;P.renown+=2;bandGone(o);G.par=null;return notice('Prisoners',n+' of them are bound and marched with you'+(o.n>n?'; the rest are disarmed and chased off':'')+'. You take '+gold+' gold they had stolen.','good')}
  if(a==='pl-join'&&kind==='band'&&partyRoom()>0){const k=Math.min(o.list.length,partyRoom());for(const u of o.list.slice(0,k))P.add(u);const c=CONDUCT.takeBrigands;P.morale=clamp(P.morale-c.morale,0,100);FIDS.forEach(f=>addHonor(f,-c.honorAll,true));mood('cruel');bandGone(o);G.par=null;
    return notice('New recruits',k+' brigands join your band. Your honest soldiers grumble (morale −'+c.morale+'), and every realm thinks a little less of you (−'+c.honorAll+' honor).','gold')}
  if(a==='pl-free'&&kind==='band'){P.renown+=1;bandGone(o);mood('mercy');G.par=null;return notice('Set free','You break their weapons and send them off. Some may find honest work; some will not.','good')}
}
// what happens when you reach a roaming party: a hostile one that fears you is cornered; else the fight it wants
function meetBand(b){if(cornered(b,'band'))return parley(b,'band');startEncounter({kind:'party',ref:b,n:b.n,list:b.list.slice(),band:b.kind||'bandits'})}
onAct('pl-',parleyAct);
