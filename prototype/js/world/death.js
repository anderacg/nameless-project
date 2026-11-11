'use strict';
/* ---------- a fight lost to beasts (doc/DEATH_DESIGN.md; the owner, 2026-11-09). Beasts take no captives: when your whole side falls
   to them (no one of yours, nor an ally, still standing or fled: beastLoss), you roll to live (odds: DEATH.live, shifted by Medicine,
   armour, daylight, a holding or road near, the beast's strength, a frost night, being alone). A lost roll kills you (DEATH.die;
   phase 2: died, the Slain page, your Remains below). Living (phase 1: fall, then after, as the fight's report is up):
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
  static pending=null;static slain=null;
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
    // (a lost roll kills you, DEATH.die: off, every roll lives)
    const o=this.odds(e),m=e.kind==='monster'&&e.ref instanceof Monster?e.ref:null;
    if(DEATH.die&&!Dice.check(o.ch,'The roll to live',undefined,(o.why.find(w=>w[0]==='Medicine')||[0,0])[1]))return this.died(e,o,m);
    const say=['The '+this.beastName(e)+' tear through the last of you, and you fall among your dead. A day later you wake, badly hurt.'];
    if(DEATH.die)say[0]+=' ('+Math.round(o.ch*100)+'% chance to live)';
    say.push(this.dismiss());
    const comps=this.scatter();if(comps)say.push(comps);
    const goods=this.goods();if(goods)say.push(goods);
    const pass=this.passengers();if(pass)say.push(pass);
    const eater=m&&this.eater(m);if(eater)say.push(eater);
    this.pending={m,hx:m?.hx,hy:m?.hy};
    return {how:'beast',text:say.join(' ')}}
  /* ---- dying (phase 2): your remains where you fell (Remains: your gear, your bag and a share of your gold, for whoever finds them
     first), the beast a man-eater with a bounty on it, the chronicle's line, then the Slain page (open). A new person in the same
     world is phase 3: until then its way out is a save or the main menu */
  static died(e,o,m){
    const by=m?.eater?m.eater.name:'the '+this.beastName(e),life=this.life(by),r=Remains.lay(P.x,P.y,life.who);
    if(m)this.eater(m,life.who);Legacy.fallen++;this.slain={...life,n:Legacy.fallen,by:m?.eater?m.eater.name:by,gold:r.gold,items:r.items.length};Legacy.record(this.slain);this.pending={m,hx:m?.hx,hy:m?.hy,slain:true};
    log(cap1(life.who)+' fell to '+this.slain.by+(life.near?' near '+life.near:'')+', on day '+G.day+': level '+life.level+', renown '+life.renown+'.','bad','story');
    return {how:'slain',text:'The '+this.beastName(e)+' tear through the last of you, and you do not rise again ('+Math.round(o.ch*100)+'% chance to live).'}}
  // (your life in a few numbers, for the Slain page and the chronicle)
  static life(by){const h=Spatial.nearestHolding(P.x,P.y);return {who:heroName()||'a wanderer',day:G.day,born:P.born||1,days:G.day-(P.born||1)+1,level:P.level,renown:Math.round(P.renown||0),earned:Math.round(P.xpEarned||0),by,near:h?.name||'',race:P.race,bg:P.bg,g:P.gender==='f'?'f':'m',face:typeof Faces!=='undefined'?Faces.yours():null}}
  // the Slain page (the frame: its way out a new person in the same world, world/legacy.js; else a save, or the main menu)
  static open(){const s=this.slain;if(!s)return;G.mode='dialog';
    showPanel('<div class="top"><h2>Slain</h2><span class="muted">Day '+s.day+'</span></div>'+
      '<p><b>'+htmlText(cap1(s.who))+'</b> fell to '+htmlText(s.by)+(s.near?' near '+htmlText(s.near):'')+'.'+(s.n>1?' The '+ordinal(s.n)+' of your line to fall.':'')+'</p>'+
      '<div class="loot-stats">'+[['Days on the road',s.days],['Level',s.level],['Renown',s.renown],['Experience gained',s.earned]].map(([k,v])=>'<span><b>'+k+'</b><span>'+v+'</span></span>').join('')+'</div>'+
      '<p>Your remains lie where you fell, with your gear ('+s.items+' piece'+(s.items===1?'':'s')+') and '+s.gold+' gold: whoever finds them first may take them. Men will put a price on '+htmlText(s.by)+'.</p>'+
      '<p class="muted">The world goes on without them. Go on in it as someone new, or load a save.</p><div class="btns"><button class="btn sm" type="button" data-act="death-load">Load a save</button><button class="btn sm" type="button" data-act="death-menu">Main menu</button></div>'+
      nav(null,['death-new',null,'Go on as someone new']))}// (Esc: on as someone new, never out of the game)
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
      out.push(cap1(q.pn)+' did not live.');q.fail(cap1(q.pn)+' was killed by the beasts.','dead')}
    return out.join(' ')}
  // the beast that beat you may become a man-eater: its name, stronger, its bounty raised, talked of
  // (slew: the hero it killed, a man-eater for sure then, a bounty on it (slayer gold), told by the news)
  static eater(m,slew){const X=DEATH.eater;
    if(slew&&!m.bounty)m.bounty=Math.round(X.slayer.base+X.slayer.lv*P.level);
    if(m.eater||!slew&&(MONSTERS[m.id].mythic||Math.random()>=X.chance)){if(slew&&m.eater)m.eater.slew=slew;return ''}const R=rngOf('maneater');
    m.eater={name:MONSTERS[m.id].mythic?'the '+MONSTERS[m.id].n:'the '+R.pick(X.first)+' '+R.pick(X.last),day:G.day,...(slew?{slew}:{})};if(!MONSTERS[m.id].mythic){m.lv+=X.lv;m.n+=X.n}if(m.changed)m.changed();
    const q=m.qid&&P.quests.find(x=>x.id===m.qid);if(q?.reward)q.reward.gold=Math.round(q.reward.gold*X.bounty);
    newsRecord('maneater',m,{id:m.id,name:m.eater.name,...(slew?{slew}:{})});
    return 'They will talk of '+m.eater.name+' now: a man-eater, stronger for what it has done'+(q?', its bounty raised':'')+'.'}
  // (a man-eater's name, for its tip and the news)
  static nameOf(m){return m?.eater?cap1(m.eater.name):''}
  // the report shown: the day passes, you wake, the beast is gone; quests told
  static after(){
    const p=this.pending;if(!p)return;this.pending=null;const m=p.m;this.home(p);if(p.slain)return;
    Clock.passHours(DEATH.wake);
    const [max]=vitals();P.hp=Math.max(1,Math.round(max*DEATH.hp));Timed.of(P).set('weak',DEATH.weak.days);
    worldEmit('hero:fell',{lived:true,monster:m});updateHUD(true)}
  // (the beast gone home: its lair, or away from it when it fought you there)
  static home(p){const m=p.m;
    if(m&&W.monsters.includes(m)){if(p.hx!=null){m.hx=p.hx;m.hy=p.hy}
      if(Math.hypot(m.hx-P.x,m.hy-P.y)<4*TILE){const dx=m.hx-P.x,dy=m.hy-P.y,l=Math.hypot(dx,dy)||1;m.x=P.x;m.y=P.y;walk(m,dx/l||1,dy/l,8*TILE);m.hx=m.x;m.hy=m.y}
      m.x=m.hx;m.y=m.hy;m.cool=Math.max(m.cool||0,24)}}
  // (out of your sight, and not the place you stand at: what changes there changes unseen)
  static unseenAt(x,y){return !yourSight().sees(x,y,1)&&!(G.mode==='site'&&G.site&&Math.hypot(G.site.x-x,G.site.y-y)<60)}
  static weak(){return Timed.of(P).has('weak')}
  // ---- your lost companions (c.lost {at: the holding, until: the day they give up, left: gone from your service, tried: a talk's day})
  static lost(){return Object.keys(P.comps).filter(id=>P.comps[id].lost)}
  static questOf(id){const q=P.quests.find(q=>q.type==='reunion'&&q.cid===id);return q?Quest.as(q):null}
  // each hour: one left waiting too long gives up on you, for another holding (DEATH.comps.far tiles off)
  static hour(){const X=DEATH.comps;if(this.slain){if(G.mode==='world'&&!G.modal)this.open();return}Remains.hour();Grave.hour();if(this.day!==G.day){this.day=G.day;Grave.daily()}
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
  static act(a,id){
    if(a==='death-load')return toTitle('load');
    if(a==='death-menu')return toTitle();
    if(a==='death-take'||a==='death-leave')return Remains.act(a,id);
    if(['death-new','death-slain','death-race','death-past'].includes(a))return Legacy.act(a,id);
    if(a==='death-respect'){const c=G.remains;if(c instanceof Crypt){c.respect();c.meet()}return}
    if(a==='death-pray'){const g=G.remains;G.remains=null;if(g instanceof Grave)g.pray();return}
    const c=P.comps[id],L=c?.lost;if(!L)return;
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
/* ---------- your remains (phase 2): where you fell, your gear, your bag and a share of your gold (DEATH.remains.gold), never fading.
   Anyone may take them: a bandit band near finds them (DEATH.remains: seek px, find a chance an hour) and carries them off (its
   plunder: beat it, and it is yours); one who comes to them takes what is left (meet). Saved (the save piece remains). Phase 4 buries
   them in the grave ---------- */
class Remains extends WorldObject{
  static list=[];
  // (laid where you fell: all you wore and carried, and the share of your gold)
  static lay(x,y,who){const items=[];
    for(const k in P.gear){const id=P.gear[k];if(id){items.push(['gear',id,1]);P.gear[k]=null}}
    P.inv=P.inv.map(s=>{if(s)items.push([s.k,s.id,s.n||1]);return null});
    const gold=Math.floor((P.gold||0)*DEATH.remains.gold);P.gold=0;
    const r=asRemains({rm:1,x:Math.round(x),y:Math.round(y),who,day:G.day,gold,items});this.list.push(r);return r}
  get mapKind(){return 'remains'}
  // (a grave or a crypt is met through its resting place, a site: world/lineage.js RestSite; remains not yet buried, as they are)
  get placed(){return !!(this.grave||this.crypt)}
  here(){return Remains.list.includes(this)}
  empty(){return !this.gold&&!this.items.length}
  inView(V){return spotted(this,V)}
  pick(at){if(!this.placed)at.add(this,9,2)}
  get meetsAnyTime(){return true}
  what(){const n=k=>this.items.reduce((a,x)=>a+((x[0]==='gear')===k?x[2]:0),0),g=n(true),o=n(false);
    return [this.gold&&this.gold+' gold',g&&g+' piece'+(g>1?'s':'')+' of gear',o&&o+' other thing'+(o>1?'s':'')].filter(Boolean).join(', ')||'nothing left'}
  tip(){return '<b>The remains of '+htmlText(this.who)+'</b><small>Fell on day '+this.day+(this.empty()?', picked clean'+(this.robbed?' by '+htmlText(this.robbed):''):', '+this.what())+'</small><span class="act">Click: go there</span>'}
  // (met: what is left, yours to take)
  meet(){G.mode='dialog';G.remains=this;
    showPanel('<div class="top"><h2>Remains</h2><span class="muted">'+htmlText(cap1(this.who))+', fell on day '+this.day+'</span></div>'+
      '<p>Bones and torn cloth where '+htmlText(this.who)+' fell'+(this.empty()?': '+(this.robbed?htmlText(this.robbed)+' got here first':'nothing is left')+'.':', and what they had: '+this.what()+'.')+'</p>'+
      nav(['death-leave',null,'Leave'],this.empty()?null:['death-take',null,'Take it']))}
  static act(a){const r=G.remains;G.remains=null;if(!r){toWorld();return}
    if(a==='death-take'){const got=r.take();if(got)log('From the '+(r.grave?r.kind:'remains')+' of '+r.who+': '+got+'.','gold');if(r.grave)return r.meet()}
    hidePanel();toWorld()}
  // (taken by you: the gold, and what fits in your bag; the rest left)
  take(){const g=this.gold;P.gold+=g;this.gold=0;let n=0;this.items=this.items.filter(it=>{const put=invAdd(it[0],it[1],it[2]);n+=put;it[2]-=put;return it[2]>0});
    return [g&&g+' gold',n&&n+' piece'+(n>1?'s':'')].filter(Boolean).join(' and ')}
  draw(ents,cam,V){if(!this.inView(V))return;const r=this;
    ents.push({y:r.y,f:()=>{const x=Math.round(r.x-cam.x),y=Math.round(r.y-cam.y),C=DEATH.remains.col;
      ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x-5,y,10,2);ctx.fillStyle=C.cloth;ctx.fillRect(x-4,y-2,7,2);ctx.fillStyle=C.bone;ctx.fillRect(x+3,y-3,2,2);ctx.fillRect(x-5,y-1,1,1);
      if(!r.empty()){ctx.fillStyle=C.steel;ctx.fillRect(x-3,y-4,6,1);ctx.fillStyle=C.glint;ctx.fillRect(x+2,y-4,1,1)}}})}
  // each hour: a band near finds remains not yet picked clean, and carries all of it off (its plunder); never before your eyes
  static hour(){const X=DEATH.remains;
    for(const r of this.list){if(r.empty()||!r.robbable()||!Death.unseenAt(r.x,r.y))continue;const b=bandits.find(o=>!o.dead&&Math.hypot(o.x-r.x,o.y-r.y)<X.seek);if(!b||Math.random()>=X.find)continue;
      const p=b.plunder||(b.plunder={gold:0,items:[],of:[]});p.gold+=r.gold;p.items.push(...r.items);if(!p.of.includes(r.who))p.of.push(r.who);r.gold=0;r.items=[];r.robbed=robberOf(b)}}
  // (a band beaten that carried off remains: its plunder yours)
  static beaten(b){const p=b?.plunder;if(!p)return;b.plunder=null;P.gold+=p.gold;let n=0;for(const [k,id,c] of p.items)n+=invAdd(k,id,c);
    log('Among their plunder, the goods of '+p.of.join(' and ')+': '+[p.gold&&p.gold+' gold',n&&n+' piece'+(n>1?'s':'')].filter(Boolean).join(' and ')+'.','gold')}
  static save(){return this.list.length?this.list.map(r=>{const o={...r};delete o.flow;return o}):undefined}// (its flow is only what you see)
  static load(v){this.list=(v||[]).map(o=>o.crypt?asCrypt(o):o.grave?asGrave(o):asRemains(o))}
  // (all of them drawn, and your family's plot round its graves: gfx/graveart.js)
  static drawAll(ents,cam,V){const plots=new Map();for(const o of this.list)if(o.grave&&o.plot){if(!plots.has(o.plot))plots.set(o.plot,[]);plots.get(o.plot).push(o)}
    for(const gs of plots.values())GraveArt.plot(ents,cam,V,null,gs);for(const r of this.list)r.draw(ents,cam,V)}
  // (open to robbers: remains always; a grave, see Grave)
  robbable(){return true}
}
const asRemains=asClass(Remains);
/* ---------- a grave (phase 4; the owner, 2026-11-09: "a grave system where you can regain all exp"; "the grave should have a cool
   flow animations, and when interact player can select Pray and then the flow (like xp, etc) will flow into new character"): your
   remains buried as a new person goes on (bury, Legacy.reborn): with an heir, at a holding of theirs (safe from robbers while it is
   theirs); with none, under a cairn by where you fell. It holds half the experience that hero gained in their life (xp:
   P.xpEarned × DEATH.grave.share) and what was left of their remains (its grave goods). Rumours tell of it (hour: a news kind,
   'grave'); near it, you see it, its light rising while it holds anything (draw). Pray at it (pray): the light flows from it into
   you (flow, drawn over the map), and on its arrival (flowed) you gain it (a gift: Character#addXp's, never counted toward your own
   grave); spent, it stays a grave. Never fades. Numbers: data/death.js DEATH.grave ---------- */
class Grave extends Remains{
  // the remains of the hero just dead, buried (old: their life, Death.slain; lord: their heir's, or none)
  /* (as you go on (Legacy.reborn): your remains lie where you fell, unburied (the owner, 2026-11-09: "What times when remains turn into
     grave or is there a chance to let the remain stay there"; "Yes, go with that"): what lingers of that hero in them, a place of
     their own; your heir (lord) comes for them in DEATH.grave.find.heir days. Each day someone may find and bury them (Grave.daily),
     or your new hero may (the place's page: here, or in the family plot); one no one buries stays as it lies) */
  static bury(old,lord){const X=DEATH.grave,r=Remains.list.find(o=>!o.grave&&o.who===old.who&&o.day===old.day)||Remains.lay(P.x,P.y,old.who);
    Object.assign(r,{grave:1,rest:'remains',unburied:1,n:old.n||1,xp:Math.round((old.earned||0)*X.share),life:{level:old.level,renown:old.renown,days:old.days,by:old.by},cloth:FACS.player.col});
    if(lord){r.heir=lord.id;r.fetch=G.day+X.find.heir}const g=asGrave(r);RestSite.sync();return g}
  /* (laid to rest: by your heir (lord), who carries them to your family's plot or their holding; by someone who found them (how
     'found': near people to your family's plot, the finer the more renown; far from anyone, a cairn if they were known, else a
     small grave there); by your new hero (how 'here': a small grave, or a cairn for one known, where they lie; 'plot': carried to
     your family's plot, the nearest holding's if you have none). Never on another grave, for you may die many times in one place) */
  static rest(g,lord,how){const X=DEATH.grave,ren=g.life?.renown||0,fine=Object.keys(X.tiers.near).filter(k=>ren>=X.tiers.near[k]).pop();
    let T=how==='here'?{tier:ren>=X.tiers.cairn?'cairn':'small'}:how==='plot'?{tier:fine,home:townBy(Legacy.plot?.at)||Spatial.nearestHolding(g.x,g.y,t=>!t.gone)}:Grave.tierOf({renown:ren},g,lord);
    if(how==='found'&&T.tier==='remains')T={tier:'small'};const home=T.home&&!T.home.gone?T.home:null;
    const off=T.tier==='cairn'?X.cairn:T.tier==='small'?X.cairn/2:0,p=home?Grave.inPlot(home,{who:g.who},g):Grave.spot(g.x+off,g.y+Math.round(off/2),0,g);
    delete g.unburied;delete g.heir;delete g.fetch;g.rest=home?(T.tier==='remains'?'small':T.tier):T.tier;
    if(home){const t=townBy(Legacy.plot?.at)||home;g.at=t.name;g.fac=t.owner;g.plot=Legacy.plot?.at||t.name;g.family=Legacy.plot?.family||Legacy.family||g.who}g.x=p.x;g.y=p.y;RestSite.sync();return g}
  // each day: the unburied found and buried (the chance a day: DEATH.grave.find; near people more, the known more), or fetched by your
  // heir; never before your eyes (the owner: "Will it going to disappear right in front of the eye if I happen to be near that place"):
  // while you see the spot, or stand at its page, it waits for a day you are away (Grave.unseen)
  static daily(){const F=DEATH.grave.find;
    for(const g of Remains.list.filter(o=>o.grave&&o.unburied)){if(!Grave.unseen(g))continue;const lord=g.heir&&W.lords.find(l=>l.id===g.heir&&!l.dead&&!l.gone);
      if(lord&&G.day>=g.fetch){Grave.rest(g,lord,'heir');log(cap1(lord.name)+' comes for the body of '+g.who+', and buries them'+(g.at?' at '+g.at:'')+'.','gold','story');continue}
      const h=Spatial.nearestHolding(g.x,g.y,t=>!t.gone),near=h&&Math.hypot(h.x-g.x,h.y-g.y)/TILE<=DEATH.grave.tiers.far||RoadBand.on(g.x,g.y),ch=(near?F.near:F.far)+(g.life?.renown||0)*F.renown;
      if(Math.random()<Math.min(F.max,ch)){Grave.rest(g,null,'found');if(Math.hypot(P.x-g.x,P.y-g.y)<vis()*2||g.at)log('Someone has buried '+g.who+(g.at?', at '+g.at:'')+'.','muted','story')}}}
  // (your family's plot: made by the first of your line buried by people, at that holding (Legacy.plot: its holding, its middle,
  // its family's name); its graves in rows from its middle, DEATH.grave.plot)
  static inPlot(home,old,self){const X=DEATH.grave,F=X.plot;let fp=Legacy.plot;const t=fp&&townBy(fp.at);
    if(!t||t.gone){const c=Grave.ground(home.x,home.y,self);fp=Legacy.plot={at:home.name,x:c.x,y:c.y,family:Legacy.family||old.who}}
    // (a plot by a holding: its own graves; a holding gone, a new plot begun at the next, the old one kept as it is)
    const i=Remains.list.filter(o=>o!==self&&o.grave&&o.plot===fp.at).length,col=i%F.cols,row=Math.floor(i/F.cols),x=Math.round(fp.x+(col-(F.cols-1)/2)*F.gap),y=Math.round(fp.y+row*F.gap*F.row);
    return Grave.clear(x,y)&&!Remains.list.some(o=>o!==self&&(o.grave||o.crypt)&&Math.hypot(o.x-x,o.y-y)<F.gap*.6)?{x,y}:Grave.ground(fp.x,fp.y,self,0,true)}
  /* (ground for a grave, a plot or a crypt by a holding (the owner: "Can you make it away from holding or estates? At least make it in
     forest or some where"): out past its lots and its estates' fields, on clear ground (clear), none within DEATH.grave.apart of
     another; the nearest the woods best, or the nearest of all (close) (DEATH.grave.yard: how far out, the ring's step and ways, the woods counted round it)) */
  static ground(cx,cy,self,min,close){const X=DEATH.grave,Y=X.yard,lo=min==null?Y.min:min;let best=null;
    for(let r=lo;r<=Y.max;r+=Y.step)for(let i=0;i<Y.tries;i++){const a=i/Y.tries*6.283+r*.01,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);
      if(!Grave.clear(x,y)||Remains.list.some(o=>o!==self&&(o.grave||o.crypt)&&Math.hypot(o.x-x,o.y-y)<X.apart))continue;
      const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);let w=0;for(let j=-Y.wood;j<=Y.wood;j++)for(let k=-Y.wood;k<=Y.wood;k++)if(tAt(tx+k,ty+j)===T_FOREST)w++;
      // (close: the nearest clear ground, a plot's next row)
      const score=close?-r:w-r/Y.step*Y.near;if(!best||score>best.s)best={x,y,s:score}}
    return best?{x:best.x,y:best.y}:Grave.spot(cx,cy,Y.r,self)}
  // (clear ground: walkable, no water or road under it, and no lot, estate field or holding within DEATH.grave.yard.clear tiles)
  static clear(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),c=DEATH.grave.yard.clear;if(!passable(terrAt(x,y))||tAt(tx,ty)===T_ROAD)return false;
    for(let j=-c;j<=c;j++)for(let i=-c;i<=c;i++){const v=occAt(tx+i,ty+j),k=tAt(tx+i,ty+j);if(v!==0||k===T_WATER||k===T_ROAD&&Math.abs(i)+Math.abs(j)<2)return false}
    return !TOWNS.some(t=>!t.gone&&Math.hypot(t.x-x,t.y-y)<DEATH.grave.yard.town)}
  /* (how you are laid to rest, by your renown and where you fell (the owner, 2026-11-09: "if you died whatout much renown or if you
     died far away then you may have a grave or remains"; "If you death near town, someone may burry for you right? But if you have
     more renown you may have a good looking grave"; DEATH.grave.tiers): far from anyone (over far tiles from a holding, off the
     roads) no one buries you: your remains lie as they fell, a cairn if you were known. Near people, someone buries you at the
     holding nearest, your heir at theirs: the finer the more renown you had (near): a small grave (a mound, a cross of sticks), a
     headstone (stone), a fenced plot (grave), a tomb) */
  static tierOf(old,r,lord){const X=DEATH.grave.tiers,ren=old.renown||0,fine=Object.keys(X.near).filter(k=>ren>=X.near[k]).pop();
    if(lord){const home=Spatial.nearest(TOWNS.filter(t=>t.owner===lord.fac&&!t.gone),lord.x,lord.y);if(home)return {tier:fine==='tomb'?'tomb':'grave',home}}
    const h=Spatial.nearestHolding(r.x,r.y,t=>!t.gone),far=(!h||h.gone||Math.hypot(h.x-r.x,h.y-r.y)/TILE>X.far)&&!RoadBand.on(r.x,r.y);
    if(far||!h||h.gone)return {tier:ren>=X.cairn?'cairn':'remains'};
    return {tier:fine,home:h}}
  // (open ground for a grave: the spot itself (r0 0), or a ring r0 round it, then rings further out, from the south; none within
  // DEATH.grave.apart of another grave)
  static spot(cx,cy,r0,self){const X=DEATH.grave,free=(x,y)=>passable(terrAt(x,y))&&!Remains.list.some(o=>o!==self&&(o.grave||o.crypt)&&Math.hypot(o.x-x,o.y-y)<X.apart);
    if(!r0&&free(Math.round(cx),Math.round(cy)))return {x:Math.round(cx),y:Math.round(cy)};
    for(let k=0;k<X.rings;k++){const r=(r0||X.apart)+k*X.apart;for(let i=0;i<X.yard.tries;i++){const a=Math.PI/2+(i%2?1:-1)*Math.ceil(i/2)*6.283/X.yard.tries,x=Math.round(cx+Math.cos(a)*r),y=Math.round(cy+Math.sin(a)*r);if(free(x,y))return {x,y}}}
    return {x:Math.round(cx),y:Math.round(cy+(r0||X.apart))}}
  get kind(){return this.rest||(this.at?'grave':'cairn')}// (rest: how it was laid to rest, tierOf)
  get words(){return DEATH.grave.words[this.kind]}
  // (anything for you: its experience not yet prayed for, or its goods (a rumour of it: hour))
  holds(){return !this.spent&&this.xp>0||!this.empty()}
  // (its light (the owner, 2026-11-09: "if money, items, etc still there then can have glow"): while its experience waits for you or
  // its goods are there; prayed at and emptied, nothing left, it lies dark)
  glows(){return this.holds()}
  robbable(){return !(this.at&&townBy(this.at)?.owner===this.fac)}
  tip(){return '<b>'+this.words.tip+htmlText(this.who)+'</b><small>Fell on day '+this.day+(this.spent?', prayed at':this.xp?', a warmth lingers here':'')+'</small><span class="act">Click: go there</span>'}
  // (met: its page, the hero's life; Pray, and its goods)
  meet(){G.mode='dialog';G.remains=this;const L=this.life||{};
    const Wd=this.words;showPanel('<div class="top"><h2>'+Wd.h+'</h2><span class="muted">'+htmlText(cap1(this.who))+', fell on day '+this.day+'</span></div>'+
      '<p>'+(this.plot?'In the plot of the family of '+htmlText(this.family||Legacy.plot?.family||'your line')+'. ':'')+Wd.line.replace('{at}',htmlText(this.at||''))+'here lies '+htmlText(this.who)+', who fell to '+htmlText(L.by||'beasts')+(this.n>1?', the '+ordinal(this.n)+' of your line':'')+'.</p>'+
      '<div class="loot-stats">'+[['Days on the road',L.days||0],['Level',L.level||0],['Renown',L.renown||0]].map(([k,v])=>'<span><b>'+k+'</b><span>'+v+'</span></span>').join('')+'</div>'+
      (this.spent?'<p class="muted">You prayed here once. It is quiet now.</p>':this.xp?'<p class="gold">Something of them lingers here: '+this.xp+' experience, for one who prays.</p>':'')+
      (this.empty()?'':'<p>With them: '+this.what()+'.</p><div class="btns"><button class="btn sm" type="button" data-act="death-take">Take the grave goods</button></div>')+
      nav(['death-leave',null,'Leave'],!this.spent&&this.xp?['death-pray',null,'Pray']:null))}
  // pray: the light flows into you (back on the map to see it), gained as it arrives
  // (the gain is yours as you pray, so a save or a load while it flows loses nothing and gives it to no one else; the flow, then its
  // line over you as it arrives (flowed), is what you see)
  pray(){if(this.spent||!(this.xp>0))return false;this.spent=true;const n=this.xp,lv=P.level;leaderOf(P).addXp(n,true);this.flow={t0:performance.now(),n};hidePanel();toWorld();
    log('You pray '+this.words.at+' '+this.who+', and what they learned flows into you: +'+n+' XP'+(P.level>lv?', level '+P.level:'')+'.','gold','story');updateHUD(true);
    setTimeout(()=>this.flowed(),DEATH.grave.flow.dur*1000);return true}
  flowed(){const f=this.flow;if(!f||f.done)return;f.done=true;f.end=performance.now()}
  // (its place: its ground under everything, what stands on it among the figures, what moves on it; its light while its
  // experience waits (glows): a glow breathing, a faint column, motes rising and turning: gfx/graveart.js)
  draw(ents,cam,V){const g=this,X=DEATH.grave,C=X.col,t=performance.now()/1000;if(g.flow)this.drawFlow(ents,cam);if(!g.inView(V))return;
    const S=GraveArt.sprite(g.kind,g.seed||(g.seed=1+Math.floor(Math.abs(g.x*7+g.y*13))%997)),night=darkness()>.35;
    ents.push({y:g.y-1e5,f:()=>{ctx.drawImage(S.ground,Math.round(g.x-cam.x)-S.ax,Math.round(g.y-cam.y)-S.ay)}});
    ents.push({y:g.y,f:()=>{const x=Math.round(g.x-cam.x),y=Math.round(g.y-cam.y),I=X.idle,pulse=.5+.5*Math.sin(t*I.breathe),lit=g.glows();ctx.save();
      if(lit){const [gw,gh]=X.art.groundOf[g.kind]||[13,6];ctx.globalAlpha=.14+.12*pulse;ctx.fillStyle=C.glow;ctx.beginPath();ctx.ellipse(x,y-2,gw*.8+pulse*2,gh*.8+pulse,0,0,6.283);ctx.fill();ctx.globalAlpha=1}
      ctx.drawImage(S.cv,x-S.ax,y-S.ay);GraveArt.live(g,x,y,t,night);
      if(lit){const top=y-({cairn:17,grave:15,small:9,remains:5,stone:12,tomb:28}[g.kind]||12);
        const col=ctx.createLinearGradient(0,top-I.h,0,top+2);col.addColorStop(0,'rgba(255,231,160,0)');col.addColorStop(1,'rgba(255,231,160,'+(.1+.08*pulse).toFixed(2)+')');ctx.fillStyle=col;ctx.fillRect(x-2,top-I.h,5,I.h+2);
        for(let i=0;i<I.motes;i++){const p=(t*I.rise+i/I.motes)%1,mx=x+Math.sin(t*1.7+i*2.1)*6*(1-p),my=top-p*I.h;
          ctx.globalAlpha=(1-p)*.35;ctx.fillStyle=i%2?C.mote:C.mote2;ctx.beginPath();ctx.arc(mx,my,1.8,0,6.283);ctx.fill();
          ctx.globalAlpha=(1-p)*.95;ctx.fillStyle=C.core;ctx.fillRect(Math.round(mx),Math.round(my),1,1)}}
      ctx.restore()}})}
  // (on the minimap once you know it; found as a place is, its title rising: world/discovery.js)
  mapDot(V){return null}
  get name(){return this.words.name+this.who}
  get label(){return this.words.label}
  // (the flow: motes from the grave to you along curves, one after another; you glow as they arrive; then the gain over you)
  drawFlow(ents,cam){const g=this,f=g.flow,X=DEATH.grave.flow,C=DEATH.grave.col,now=performance.now(),e=(now-f.t0)/1000/X.dur;
    if(f.end&&(now-f.end)/1000>X.show){g.flow=null;return}
    ents.push({y:1e9,f:()=>{ctx.save();const gx=g.x-cam.x,gy=g.y-cam.y-6,hx=P.x-cam.x,hy=P.y-cam.y-10;
      for(let i=0;i<X.motes;i++){const p=clamp((e-i/X.motes*X.spread)/(1-X.spread),0,1);if(p<=0||p>=1)continue;const s=Math.sin(i*2.39),q=1-p,
          cx=(gx+hx)/2+s*X.bend,cy=Math.min(gy,hy)-X.arc-Math.abs(s)*X.bend*.5,x=q*q*gx+2*q*p*cx+p*p*hx,y=q*q*gy+2*q*p*cy+p*p*hy;
        ctx.globalAlpha=.35;ctx.fillStyle=i%2?C.mote:C.mote2;ctx.beginPath();ctx.arc(x,y,2.2,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=C.core;ctx.fillRect(Math.round(x),Math.round(y),1,1)}
      if(e>X.spread){const a=clamp(1-Math.abs(e-1)/.6,0,1);ctx.globalAlpha=.35*a;ctx.fillStyle=C.glow;ctx.beginPath();ctx.ellipse(hx,hy+4,10,14,0,0,6.283);ctx.fill()}
      if(f.end){const k=(now-f.end)/1000/X.show;ctx.globalAlpha=1-k;txt('+'+f.n+' XP',Math.round(hx),Math.round(hy-6-k*10),C.text,'center')}
      ctx.restore()}})}
  // each hour: now and then someone speaks of a grave that still holds anything (the news)
  // (one grave at most an hour, however many there are: a world of many dead is not all talk of them)
  // (talked of by its kind: remains no one buried, never; a small grave, less: DEATH.grave.tiers.talk)
  static hour(){const T=DEATH.grave.tiers.talk,gs=Remains.list.filter(g=>g.grave&&g.holds()&&T[g.kind]>0);if(!gs.length||Math.random()>=DEATH.grave.rumour/24)return;const g=gs[Math.floor(Math.random()*gs.length)];
    if(T[g.kind]>=1||Math.random()<T[g.kind])newsRecord('grave',g,{who:g.who,kind:g.kind,at:g.at||''})}// (no grave, no draw: the world's Math.random as it was)
}
const asGrave=asClass(Grave);
Grave.unseen=g=>Death.unseenAt(g.x,g.y);
const ordinal=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');
const robberOf=b=>b?.ld?.name?b.ld.name+'’s band':'bandits';
onAct('death-',(a,arg)=>Death.act(a,arg));
// (the fight's report shown: the day passes: Death.after)
worldOn('battle:ended',()=>Death.after());
// (a man-eater slain: renown, and the news of it)
worldOn('monster:slain',d=>{const m=d?.monster;if(!m?.eater)return;P.renown+=DEATH.eater.renown;const g=m.bounty||0;P.gold+=g;
  log('You slay '+m.eater.name+', the man-eater'+(m.eater.slew?' that killed '+m.eater.slew:'')+'. Renown +'+DEATH.eater.renown+(g?', its bounty '+g+' gold':'')+'.','good','war')});
worldOn('band:beaten',d=>Remains.beaten(d?.band));
onWorld(()=>{Death.pending=null;Death.slain=null;Remains.list=[]});
Saves.add({key:'remains',order:332,defaults:null,save:()=>Remains.save(),load:v=>Remains.load(v),settle:()=>RestSite.sync()});// (their places after the sites: world/lineage.js)
Systems.add({name:'lost companions',order:{hour:165},hour:()=>Death.hour()});
