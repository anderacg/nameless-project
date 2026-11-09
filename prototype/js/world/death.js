'use strict';
/* ---------- a fight lost to beasts (doc/DEATH_DESIGN.md; the owner, 2026-11-09). Beasts take no captives: when your whole side falls
   to them (no one of yours, nor an ally, still standing or fled: beastLoss), you roll to live (odds: DEATH.live, shifted by Medicine,
   armour, daylight, a holding or road near, the beast's strength, a frost night, being alone). Phase 1: living (a lost roll kills you
   only once phase 2 is built: DEATH.die). Living (fall, then after, as the fight's report is up):
   - you lie there a day (DEATH.wake), the world going on; you wake badly hurt and weak for days (Timed 'weak': world/parties.js
     heroStats);
   - your army is gone for good (its dead and wounded with it); your prisoners escaped as ever (resolution.js);
   - each companion wakes wounded in the tavern of a holding near, a quest marks it (ReunionQuest); left there over DEATH.comps.wander
     days, they go to another holding and leave your service, to be won back (a talk or their pay: the tavern's card, cards);
   - the beasts eat your food, your horse may bolt, each passenger you escort lives (waiting at a holding near: world/escort.js
     EscortQuest wait) or dies;
   - the beast goes home (its lair, or away from it when it fought you there), and may become a man-eater: a name, stronger, its
     bounty raised, talked of (news.js 'maneater'); slaying it, renown;
   - quests hear it (the bus: hero:fell {lived, monster}), their days run on through the lost day.
   Numbers: data/death.js DEATH ---------- */
class Death{
  static pending=null;
  // a loss to beasts with your whole side down (e: the encounter; b: the battle fought, none when auto-resolved)
  static beastLoss(e,b){
    if(!DEATH.on||!e||!['monster','cave'].includes(e.kind)||(e.foes||[]).length||!(e.list||[]).length||!e.list.every(k=>ST[k]?.beast))return false;
    if(!b)return !(e.allies||[]).some(l=>(l.troops||[]).length);
    const friend=u=>u.team===0||!!b.sides?.active&&b.sides.relation(0,u.team)>0;
    // (a man still up against you, a band come into it: a fight with men, their capture rules)
    const man=u=>u.hp>0&&!friend(u)&&!ST[u.type]?.beast;
    return !b.units.some(u=>u.hp>0&&friend(u))&&!b.fledMine&&!b.units.some(man)}
  // (those with you: your companions not away, held or lost)
  static with(){return Object.keys(P.comps).filter(id=>{const c=compInit(id);return c&&!c.party&&!c.jail&&!c.lost})}
  static alone(){return !this.with().length&&!troopCount()&&!(P.woundedGroups||[]).some(w=>w.count>0)}
  // your chance to live, and what moved it
  static odds(e){
    const X=DEATH.shift,m=e.kind==='monster'?e.ref:null,M=m&&MONSTERS[m.id],h=Spatial.nearestHolding(P.x,P.y),night=Clock.isNight,why=[];let ch=DEATH.live;
    const add=(v,w)=>{if(v){ch+=v;why.push([w,v])}};
    add(Math.max(skill('med'),...this.with().map(id=>compSkill(id,'med')))*X.med,'Medicine');
    add(X.armor[itemArmor(P.gear.body)]||0,'your armour');
    add(night?X.night:X.day,night?'the night':'daylight');
    add(h&&Math.hypot(h.x-P.x,h.y-P.y)<DEATH.near*TILE?X.near:0,'a holding near');
    add(RoadBand.on(P.x,P.y)?X.road:0,'the road');
    add(-X.lv*Math.max(0,(m?.lv||e.lv||1)-1),'the beast’s strength');
    add(e.list.some(k=>ST[k]?.big)?-X.big:0,'a great beast');
    add(M?.mythic?-X.mythic:0,'a beast of legend');
    add(night&&climAt(P.x,P.y)==='frost'?-X.frost:0,'the frost');
    add(this.alone()?-X.alone:0,'alone');
    return {ch:clamp(ch,DEATH.min,DEATH.max),why}}
  // the loss (Captivity.defeat): the roll, and all that befalls you; its words for the battle's page
  static fall(e){
    // (a lost roll kills you once dying is built, phase 2: until then DEATH.die is off, and every roll lives)
    const o=this.odds(e),m=e.kind==='monster'&&e.ref instanceof Monster?e.ref:null;
    const say=['The '+this.beastName(e)+' tear through the last of you, and you fall among your dead. A day later you wake, badly hurt.'];
    if(DEATH.die)say[0]+=' ('+Math.round(o.ch*100)+'% chance to live)';
    say.push(this.dismiss());
    const comps=this.scatter();if(comps)say.push(comps);
    const goods=this.goods();if(goods)say.push(goods);
    const pass=this.passengers();if(pass)say.push(pass);
    const eater=m&&this.eater(m);if(eater)say.push(eater);
    this.pending={m,hx:m?.hx,hy:m?.hy};
    return {how:'beast',text:say.join(' ')}}
  static beastName(e){const M=e.kind==='monster'&&e.ref&&MONSTERS[e.ref.id];return M?M.n.toLowerCase()+((e.list||[]).length>1&&!/s$/.test(M.n)?'s':''):'beasts'}
  // your army gone for good: the fit, the wounded
  static dismiss(){const r=partyRoster(P);let n=0;for(const g of r.groups.slice()){n+=g.count;r.remove(g.type,g.count,g.id)}
    n+=(P.woundedGroups||[]).reduce((a,w)=>a+(w.count||0),0);P.woundedGroups=[];
    return n?'Your army is gone: '+n+' soldier'+(n>1?'s':'')+', dead around you or fled home.':''}
  // each companion with you wakes wounded in the tavern of a holding near (one of the DEATH.comps.n nearest not hostile), a quest
  // marking where
  static scatter(){
    const X=DEATH.comps,ids=this.with();if(!ids.length)return '';
    const near=TOWNS.filter(t=>!t.gone&&!hostileTo(t.owner)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y)).slice(0,X.n);if(!near.length)return '';
    const at={};for(const id of ids){const c=compInit(id),t=near[Math.floor(Math.random()*near.length)];
      c.lost={at:t.name,until:G.day+X.wander,left:false};c.hurt=Math.max(c.hurt||0,G.day+X.hurt);(at[t.name]=at[t.name]||[]).push(COMPS[id].short);
      const q=Quest.make('reunion',t,null,{id});if(q)q.accept()}
    return Object.entries(at).map(([t,ns])=>ns.join(' and ')+(ns.length>1?' were':' was')+' carried to '+t).join('; ')+': find them in the tavern there before they give up on you (Quests).'}
  // the beasts at your food; your horse bolting
  static goods(){const out=[],f=Math.floor(foodN()*DEATH.food);if(f>0&&foodTake(f))out.push('The beasts ate '+f+' of your food.');
    const h=P.gear.mount;if(h&&Math.random()<DEATH.horse){P.gear.mount=null;out.push('Your '+(ITEMS[h]?.n||'horse').toLowerCase()+' bolted, and is gone.')}
    return out.join(' ')}
  // each passenger you escort: lives (waits at the holding near) or dies; none left riding for the rout to carry off (Escort.lost)
  static passengers(){const out=[];
    for(const q of Escort.list()){if(q.wait)continue;
      if(Math.random()<DEATH.pass){const t=Spatial.nearestHolding(P.x,P.y,t=>!t.gone);if(t){q.wait=t.name;out.push(cap1(q.pn)+' got away to '+t.name+', and waits for you there.');continue}}
      out.push(cap1(q.pn)+' did not live.');q.fail(cap1(q.pn)+' was killed by the beasts.','slain')}
    return out.join(' ')}
  // the beast that beat you may become a man-eater: its name, stronger, its bounty raised, talked of
  static eater(m){
    if(m.eater||MONSTERS[m.id].mythic||Math.random()>=DEATH.eater.chance)return '';const X=DEATH.eater,R=rngOf('maneater');
    m.eater={name:'the '+R.pick(X.first)+' '+R.pick(X.last),day:G.day};m.lv+=X.lv;m.n+=X.n;if(m.changed)m.changed();
    const q=m.qid&&P.quests.find(x=>x.id===m.qid);if(q?.reward)q.reward.gold=Math.round(q.reward.gold*X.bounty);
    newsRecord('maneater',m,{id:m.id,name:m.eater.name});
    return 'They will talk of '+m.eater.name+' now: a man-eater, stronger for what it has done'+(q?', its bounty raised':'')+'.'}
  // (a man-eater's name, for its tip and the news)
  static nameOf(m){return m?.eater?cap1(m.eater.name):''}
  // the report shown: the day passes, you wake, the beast is gone; quests told
  static after(){
    const p=this.pending;if(!p)return;this.pending=null;const m=p.m;
    if(m&&W.monsters.includes(m)){if(p.hx!=null){m.hx=p.hx;m.hy=p.hy}
      if(Math.hypot(m.hx-P.x,m.hy-P.y)<4*TILE){const dx=m.hx-P.x,dy=m.hy-P.y,l=Math.hypot(dx,dy)||1;m.x=P.x;m.y=P.y;walk(m,dx/l||1,dy/l,8*TILE);m.hx=m.x;m.hy=m.y}
      m.x=m.hx;m.y=m.hy;m.cool=Math.max(m.cool||0,24)}
    Clock.passHours(DEATH.wake);
    const [max]=vitals();P.hp=Math.max(1,Math.round(max*DEATH.hp));Timed.of(P).set('weak',DEATH.weak.days);
    worldEmit('hero:fell',{lived:true,monster:m});updateHUD(true)}
  static weak(){return Timed.of(P).has('weak')}
  // ---- your lost companions (c.lost {at: the holding, until: the day they give up, left: gone from your service, tried: a talk's day})
  static lost(){return Object.keys(P.comps).filter(id=>P.comps[id].lost)}
  static questOf(id){const q=P.quests.find(q=>q.type==='reunion'&&q.cid===id);return q?Quest.as(q):null}
  // each hour: one left waiting too long gives up on you, for another holding (DEATH.comps.far tiles off)
  static hour(){const X=DEATH.comps;
    for(const id of this.lost()){const c=P.comps[id],L=c.lost;if(L.left||G.day<L.until)continue;const from=townBy(L.at)||P,[lo,hi]=X.far;
      const ts=TOWNS.filter(t=>!t.gone&&t.name!==L.at&&!hostileTo(t.owner)),far=ts.filter(t=>{const d=Math.hypot(t.x-from.x,t.y-from.y)/TILE;return d>=lo&&d<=hi}),t=(far.length?far:ts)[Math.floor(Math.random()*(far.length||ts.length))];
      if(!t)continue;L.at=t.name;L.left=true;c.ap=(c.ap||0)-X.left;const q=this.questOf(id);if(q)q.moved(t);
      log(COMPS[id].short+' gave up waiting for you and left your service. They are said to be in '+t.name+'.','bad','story',q?.journalKey)}}
  // ---- in a tavern: your lost companions there (Find; or, gone from your service, win them back)
  static cards(t){return this.lost().filter(id=>P.comps[id].lost.at===t.name).map(id=>{const c=P.comps[id],L=c.lost;
    if(!L.left)return {pic:portrait(id),name:COMPS[id].n,role:'Your companion, hurt',note:'Carried here after the beasts, waiting for you.',acts:[['death-find',id,'Take them back']]};
    const tried=L.tried===G.day,p=this.payOf(id);
    return {pic:portrait(id),name:COMPS[id].n,role:'Left your service',facts:['Approval '+apName(c.ap)],note:'You left them too long. They will hear you out, or want their pay.',
      acts:[['death-talk',id,'Talk them round ('+Math.round(this.talkOdds(id)*100)+'%)',tried?'You tried today':''],['death-pay',id,'Pay them '+p+'g',P.gold<p?'You have '+P.gold+'g':'']]}})}
  static talkOdds(id){const X=DEATH.comps.talk,c=P.comps[id];return clamp(X.base+skill('pers')*X.pers+(c.ap||0)*X.ap,X.min,X.max)}
  static payOf(id){const X=DEATH.comps.pay;return Math.round((X.base+X.lv*(P.comps[id].lv||0))/5)*5}
  // (back with you)
  static rejoin(id,how){const c=P.comps[id];if(!c?.lost)return;const q=this.questOf(id);delete c.lost;
    log(COMPS[id].short+' '+how,'good','story',q?.journalKey);if(q)q.found()}
  static act(a,id){const c=P.comps[id],L=c?.lost;if(!L)return;
    if(a==='death-find'&&!L.left)this.rejoin(id,'is with you again.');
    if(a==='death-talk'&&L.left&&L.tried!==G.day){L.tried=G.day;if(Math.random()<this.talkOdds(id))this.rejoin(id,'hears you out, and comes back to your band.');else log(COMPS[id].short+' will not hear it today.','bad','story')}
    if(a==='death-pay'&&L.left){const p=this.payOf(id);if(P.gold<p)return;P.gold-=p;this.rejoin(id,'takes the pay you owe them, and comes back to your band.')}
    updateHUD(true);if(G.town)renderTown()}
}
/* the quest to find a lost companion (a side quest, never on a board; step kind 'reunion'): its place the holding they wait in (moved
   when they wander off: moved); done when they are back with you (Death.rejoin: found) */
class ReunionQuest extends StepQuest{
  setup(t,lord,s){if(!s||!COMPS[s.id])return false;this.cid=s.id;this.prize={};this.forfeit={};this.reward=StepQuest.reward({});this.giver=t.name;
    this.to=StepQuest.place({town:t.name});this.title='Find '+COMPS[s.id].short;this.text=COMPS[s.id].short+' was carried, hurt, to '+t.name+' after the beasts. Find them in its tavern before they give up on you.'}
  begin(){this.x=this.to.x;this.y=this.to.y}
  todo(){const L=P.comps[this.cid]?.lost;return (L?.left?'Win back ':'Find ')+COMPS[this.cid].short+' in the tavern of '+this.to.name+'.'}
  moved(t){this.to=StepQuest.place({town:t.name});this.x=this.to.x;this.y=this.to.y;this.text=COMPS[this.cid].short+' left your service and went to '+t.name+'. Win them back in its tavern: a talk, or the pay you owe them.'}
  found(){this.lines={found:COMPS[this.cid].short+' is back with you.'};this.pay('found','found')}
  lapse(){if(!P.comps[this.cid]?.lost)this.over('gone','gone')}
  sayOf(k){return {gone:'They are no longer lost.'}[k]||super.sayOf(k)}
}
defineKind('step','reunion',{cls:ReunionQuest});
onAct('death-',(a,arg)=>Death.act(a,arg));
// (the fight's report shown: the day passes: Death.after)
worldOn('battle:ended',()=>Death.after());
// (a man-eater slain: renown, and the news of it)
worldOn('monster:slain',d=>{const m=d?.monster;if(!m?.eater)return;P.renown+=DEATH.eater.renown;log('You slay '+m.eater.name+', the man-eater. Renown +'+DEATH.eater.renown+'.','good','war')});
onWorld(()=>{Death.pending=null});
Systems.add({name:'lost companions',order:{hour:165},hour:()=>Death.hour()});
