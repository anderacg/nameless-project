'use strict';
/* ---------- relations: how each lord feels about you, and about each other ---------- */
// P.lrel[lordId]: you and a lord, -100..100, starting at 0, with P.lrelWhy[lordId] the last few reasons. W.lrel['a|b']: the
// change between two lords on top of where they started (lords of one realm start friendly, others anywhere from cool to
// warm, the same every game). What moves them and what they buy is in RELATION (data/factions.js).
const relWith=l=>l&&P.lrel?P.lrel[l.id]||0:0;
const relLevel=v=>RELATION.levels.find(([t])=>v>=t);
const relName=v=>relLevel(v)[1];
const relTag=v=>{const [,n,c]=relLevel(v);return '<span class="'+c+'">'+n+' ('+(v>0?'+':'')+Math.round(v)+')</span>'};
// change how a lord feels about you; big changes are told in the log
function changeRel(l,n,why){
  if(!l||!n)return;P.lrel=P.lrel||{};P.lrelWhy=P.lrelWhy||{};const v=clamp(relWith(l)+n,-100,100);P.lrel[l.id]=v;
  (P.lrelWhy[l.id]=P.lrelWhy[l.id]||[]).push({d:G.day,n:Math.round(n),why});P.lrelWhy[l.id]=P.lrelWhy[l.id].slice(-4);
  if(Math.abs(n)>=5)log(l.name+(n>0?' thinks better of you':' thinks less of you')+': '+why+' ('+(n>0?'+':'')+Math.round(n)+').',n>0?'good':'bad');
}
// a deed against (or for) a lord: their friends feel some of it, their rivals the opposite
function rippleRel(l,n,why){
  changeRel(l,n,why);
  for(const o of W.lords){if(o===l||o.dead)continue;const r=lordRel(l,o);
    if(r>=RELATION.friend)changeRel(o,Math.round(n*RELATION.ripple),(n<0?'you wronged ':'you helped ')+'their friend '+l.name);
    else if(r<=RELATION.rival)changeRel(o,-Math.round(n*RELATION.ripple*.75),(n<0?'you humbled ':'you helped ')+'their rival '+l.name)}
}
// between lords: where they start (same realm: friendly; else seeded from their names) plus what has happened since
const lordKey=(a,b)=>a.id<b.id?a.id+'|'+b.id:b.id+'|'+a.id;
const lordRel0=(a,b)=>{const k=lordKey(a,b);let h=0;for(const c of k)h=(h*31+c.charCodeAt(0))|0;return a.fac===b.fac?15+Math.abs(h)%21:(Math.abs(h)%41)-20};
const lordRel=(a,b)=>clamp(lordRel0(a,b)+((W.lrel||{})[lordKey(a,b)]||0),-100,100);
function changeLordRel(a,b,n){if(!a||!b||a===b||!n)return;W.lrel=W.lrel||{};const k=lordKey(a,b);W.lrel[k]=(W.lrel[k]||0)+n}
const lordFriends=l=>W.lords.filter(o=>o!==l&&!o.gone&&lordRel(l,o)>=RELATION.friend);
const lordRivals=l=>W.lords.filter(o=>o!==l&&!o.gone&&lordRel(l,o)<=RELATION.rival);
// friendship's favours
const lordHelps=l=>relWith(l)>=RELATION.helpAt&&!hostileTo(l.fac);
const lordSpares=l=>relWith(l)>=RELATION.spareAt&&!(P.fac&&atWar(P.fac,l.fac));
// the days soften everything a little
function relDay(){
  const k=1-RELATION.decay;for(const id in P.lrel||{}){P.lrel[id]*=k;if(Math.abs(P.lrel[id])<.5)delete P.lrel[id]}
  for(const id in W.lrel||{}){W.lrel[id]*=k;if(Math.abs(W.lrel[id])<.5)delete W.lrel[id]}
}

/* in a lord's audience: where you stand, and what you can ask */
function relHtml(l){
  const why=(P.lrelWhy||{})[l.id]||[],fr=lordFriends(l).filter(o=>!o.dead).slice(0,3),rv=lordRivals(l).filter(o=>!o.dead).slice(0,3),R=RELATION,v=relWith(l);
  const giftWait=(l.gift||0)>G.day,lendWait=(l.lend||0)>G.day;
  return '<p>Toward you: '+relTag(v)+(why.length?' <span class="muted" style="font-size:13px">· '+why.slice().reverse().map(w=>w.why+' ('+(w.n>0?'+':'')+w.n+')').join(' · ')+'</span>':'')+'</p>'+
    ((fr.length||rv.length)?'<p class="muted" style="font-size:13px">'+(fr.length?'Friends with '+fr.map(o=>o.name).join(', ')+'. ':'')+(rv.length?'At odds with '+rv.map(o=>o.name).join(', ')+'.':'')+'</p>':'')+
    '<div class="btns" style="margin:0">'+dlgBtn('lr-gift',l.id,'Give '+R.gift.gold+' gold',P.gold<R.gift.gold?'Not enough gold':giftWait?'Gave lately':'')+
    dlgBtn('lr-troops',l.id,'Ask for '+R.troops+' soldiers',v<R.troopsAt?'Needs '+relName(R.troopsAt).toLowerCase()+' (+'+R.troopsAt+')':lendWait?'Asked lately':l.troops.length<R.troops+6?'Too few to spare':partyRoom()<R.troops?'No room in your band':'')+'</div>';
}
function relAct(a,arg){
  const l=W.lords.find(x=>x.id===arg);if(!l||l.dead)return;const R=RELATION;
  if(a==='lr-gift'&&P.gold>=R.gift.gold&&!((l.gift||0)>G.day)){P.gold-=R.gift.gold;l.gift=G.day+R.gift.days;changeRel(l,R.gift.rel,'your gift');updateHUD(true)}
  if(a==='lr-troops'&&relWith(l)>=R.troopsAt&&!((l.lend||0)>G.day)&&l.troops.length>=R.troops+6&&partyRoom()>=R.troops){
    l.lend=G.day+R.troopsDays;const got=[];for(let i=0;i<R.troops;i++){const k=partyRemoveAny(l,1)[0];P.add(k);got.push(ST[k].n.toLowerCase())}
    log(l.name+' lends you '+got.join(', ')+'.','good');updateHUD(true)}
  lordMeet(l);
}
onAct('lr-',relAct);
