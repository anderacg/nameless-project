'use strict';
/* ---------- prisons: who is held where (doc/PRISONS_DESIGN.md, phases 2–4; the kinds PRISONS and the rules PRISON: data/prisons.js).
   Every holding, bandit camp and hideout has a prison of its kind (Captivity.prisonOf): Prisons.of(key) its list, key a holding's
   name or a site's 's:i:seed'. A record each:
     {k:'lord', id, name, fac, lv, keep, since, due | offer, offerDay, asked, seen}: a lord; keep, who holds him (a realm, or 'player':
       yours); due, the day his realm pays for him (a realm's); offer, what his realm offers you for him (yours: from offerDay);
       seen, the day you last visited him;
     {k:'chief', ld, keep:'player', since}: a bandit chieftain you locked up;
     {k:'comp', id, keep, since}: your companion, left there when you broke out alone (keep: a realm, 'band', 'broker');
     {k:'men', type, n, keep:'player'}: soldiers you took prisoner, locked up.
   Phase 2 (the Prison place, ui/town.js definePlace('prison')): who is held there; pay a ransom, bribe the gaoler, visit a lord,
   break one out (a crime); a story's captive (story/steps.js HeldQuest) is ransomed there. Not at a prison of yours or your realm's.
   Phase 3: a lord routed by a realm at war with his is taken half the time (take) to its nearest walled holding with room; his
   realm ransoms him in weeks (ransom), two realms at war trade lords (exchange), peace frees them (peace); a holding lost, sacked
   or gone (a camp cleared) breaks its prison open (broken). Your companions held there may get away (comp.escape).
   Phase 4 (yours: at a holding of yours or your realm's): lock up the captives and soldiers you carry (a lost battle frees them no
   more); take them out again; a lord's ransom (his realm's offer, or ask more), mercy, an exchange (for your companion or a lord
   of your realm his realm holds), death; a chieftain handed over; soldiers recruited or let go. ---------- */
class Prisons{
  static jails={};
  static of(key){return this.jails[key]||[]}
  static put(key,r){(this.jails[key]=this.jails[key]||[]).push(r);return r}
  static drop(key,r){const a=this.jails[key];if(!a)return;const i=a.indexOf(r);if(i>=0)a.splice(i,1);if(!a.length)delete this.jails[key]}
  static each(f){for(const key of Object.keys(this.jails))for(const r of this.of(key).slice())f(r,key)}
  static all(f){const out=[];this.each((r,key)=>{if(f(r,key))out.push({r,key})});return out}
  // (a key and its place: Captivity's {k:'holding', town} or {k:'site', i, seed})
  static keyOf(at){return at.k==='site'?'s:'+at.i+':'+at.seed:at.town}
  static at(key){if(!key.startsWith('s:'))return{k:'holding',town:key};const [,i,seed]=key.split(':');return{k:'site',i:+i,seed:isNaN(+seed)?seed:+seed}}
  static kind(key){return Captivity.prisonOf({k:'realm',at:this.at(key)})}
  // (its name: the Dungeon of Highmoor, the pit)
  static title(key){const k=this.kind(key);return k?k.title.replace(/^In t/,'t'):'their cage'}
  // (room in it: cells for leaders, places for soldiers; none in a sacked holding's, its prison broken open)
  static room(key){const k=this.kind(key);return k&&!this.sacked(key)?k.holds-this.of(key).filter(r=>r.k!=='men').length:0}
  static menRoom(key){const k=this.kind(key);return k&&!this.sacked(key)?k.men-this.of(key).filter(r=>r.k==='men').reduce((n,r)=>n+r.n,0):0}
  static sacked(key){const t=!key.startsWith('s:')&&townBy(key);return !!t&&Timed.of(t).has('sacked')}
  static lordOf(r){return W.lords.find(l=>l.id===r.id)||null}
  // (his name: a lord's as you know him (yours: you took him), a chieftain's, your companion's, a soldier's kind)
  static who(r){return r.k==='lord'?(r.keep!=='player'&&this.lordOf(r)?lordName(this.lordOf(r)):r.name):r.k==='chief'?r.ld.name:r.k==='comp'?COMPS[r.id]?.n||r.id:ST[r.type]?.n||r.type}
  static ransomOf(r){return r.k==='comp'?PRISON.comp.base+PRISON.comp.lv*(P.comps[r.id]?.lv||1):r.k==='chief'?bountyOf(r.ld):lordRansom(r)}
  // ---- phase 3: a lord taken by a realm at war with his (PRISON.take), to its nearest walled holding with room (at: that one if it
  // has room); the holding, or null (he gets away)
  static take(l,keep,x,y,at){if(!keep||!FACS[keep]||!l||!atWar(keep,l.fac)||Math.random()>=PRISON.take)return null;
    const t=at&&at.owner===keep&&this.room(at.name)>0?at:this.holdingFor(keep,x,y);if(!t)return null;
    Object.assign(l,{inside:null,dead:true,held:true,troops:[],back:1e9,state:'rest',jail:t.name});
    this.put(t.name,{k:'lord',id:l.id,name:l.name,fac:l.fac,lv:lordStats(l).lv,keep,since:G.day,due:G.day+rint(...PRISON.ransom)});return t}
  static holdingFor(f,x,y){const own=fiefsOf(f).filter(t=>!t.gone&&this.room(t.name)>0&&!Timed.of(t).has('sacked')),walled=own.filter(t=>wallOf(t)>0);return Spatial.nearest(walled.length?walled:own,x,y)}
  // (let go: a lord rides home to raise a new army (in days), your companion finds you, a chieftain gathers a new band, soldiers scatter)
  static out(r,key,why,days=5){this.drop(key,r);
    if(r.k==='lord'){const l=this.lordOf(r);if(l&&!l.gone){l.held=false;l.jail=null;l.back=G.day+days}}
    else if(r.k==='comp'){const c=P.comps[r.id];if(c){c.jail=null;log(COMPS[r.id].short+' '+(why==='escaped'?'gets away from':'is let out of')+' '+this.title(key)+', and finds you again.','good','war')}}
    else if(r.k==='chief')chiefEscapes(r.ld,days)}
  // (why its prison no longer holds r: its holding gone, sacked or no longer its keeper's (yours: no longer yours or your realm's),
  // its camp cleared or gone; '' holds)
  static broken(r,key){const s=Captivity.spot(this.at(key));if(!s||s.site?.cleared)return 'gone';if(!s.town)return '';const t=s.town;if(t.gone)return 'gone';if(Timed.of(t).has('sacked'))return 'sacked';
    if(r.keep==='player')return t.owner==='player'||P.fac&&t.owner===P.fac?'':'taken';return FACS[r.keep]&&t.owner!==r.keep?'taken':''}
  // each day: prisons broken open; realms ransom their lords; realms at war trade them; your companions may get away; your
  // prisoners' ransoms offered
  static day(){
    this.each((r,key)=>{const why=this.broken(r,key);if(!why)return;if(r.keep==='player')log(this.who(r)+(r.k==='men'?'s':'')+' in '+this.title(key)+' go free: '+(why==='sacked'?'it was sacked':why==='gone'?'it is gone':'it is no longer yours')+'.','bad','war');this.out(r,key,why)});
    this.each((r,key)=>{if(r.k!=='lord'||!FIDS.includes(r.keep)||G.day<r.due)return;const g=lordRansom(r);if(!fiefsOf(r.fac).length||!payRealm(r.fac,g)){r.due=G.day+7;return}
      W.treas[r.keep]=treas(r.keep)+g;this.out(r,key,'ransomed');worldEvent({text:'The '+FACS[r.fac].n+' ransom '+r.name+' from '+this.title(key)+'.',fac:[r.fac,r.keep],cls:r.fac===P.fac?'good':'',past:'the '+FACS[r.fac].n+' ransomed '+r.name})});
    for(const a of FIDS)for(const b of FIDS){if(a>=b||!atWar(a,b))continue;const ab=this.all(r=>r.k==='lord'&&r.keep===a&&r.fac===b),ba=this.all(r=>r.k==='lord'&&r.keep===b&&r.fac===a);
      if(!ab.length||!ba.length||Math.random()>=PRISON.exchange)continue;const x=ab[0],y=ba[0];this.out(x.r,x.key,'exchanged');this.out(y.r,y.key,'exchanged');
      worldEvent({text:'The '+FACS[a].n+' and the '+FACS[b].n+' trade prisoners: '+x.r.name+' for '+y.r.name+'.',fac:[a,b],cls:a===P.fac||b===P.fac?'good':'',past:'the '+FACS[a].n+' and the '+FACS[b].n+' traded prisoners'})}
    this.each((r,key)=>{if(r.k==='comp'&&Math.random()<PRISON.comp.escape)this.out(r,key,'escaped')});
    this.each((r,key)=>{if(r.k==='lord'&&r.keep==='player'&&!r.offer&&G.day>=r.offerDay&&fiefsOf(r.fac).length){r.offer=lordRansom(r);log('The '+FACS[r.fac].n+' offer '+r.offer+' gold for '+r.name+', in '+this.title(key)+'.','gold','war')}})}
  // peace between a and b (realms.js setRel): the prisoners each holds of the other go free, your companions with them
  static peace(a,b){this.each((r,key)=>{if(r.k==='lord'&&(r.keep===a&&r.fac===b||r.keep===b&&r.fac===a)||r.k==='comp'&&(r.keep===a&&P.fac===b||r.keep===b&&P.fac===a))this.out(r,key,'peace')})}
  // a camp or hideout you cleared: all it held are free
  static cleared(s){const key=this.keyOf({k:'site',i:s.i,seed:s.seed});for(const r of this.of(key).slice())this.out(r,key,'freed')}
  // your companions left behind when you break out alone (world/captivity.js free): in that prison, held by keep
  static leave(ids,at,keep){const key=this.keyOf(at);for(const id of ids)if(P.comps[id]){P.comps[id].jail=key;this.put(key,{k:'comp',id,keep,since:G.day})}return this.title(key)}
  // a lord of your realm held by a realm (exchange): the first
  static heldBy(f,pred){return this.all((r,key)=>r.keep===f&&pred(r))[0]||null}

  // ---- the Prison place (phase 2, 4): its window
  static mine(t){return t.owner==='player'||!!P.fac&&t.owner===P.fac}
  static quests(t){return P.quests.filter(q=>q.type==='held'&&q.held?.k==='holding'&&q.held.town===t.name).map(q=>Quest.as(q))}
  static dot(t){return this.quests(t).length>0||this.of(t.name).some(r=>r.k==='comp'||r.k==='lord'&&r.offer&&r.keep==='player')}
  static bribe(r,key){const k=this.kind(key)||{bribe:1,watch:0},X=PRISON.bribe;return{cost:Math.max(10,Math.round(this.ransomOf(r)*X.price*k.bribe/5)*5),ch:clamp(X.ch-(k.watch||0)*X.watch,.05,.9)}}
  static breakChance(key){const k=this.kind(key)||{brk:0,watch:0},X=PRISON.brk;return clamp(X.base+(P.attr?.agi||0)*X.agi+skill('athl')*X.athl+k.brk-(k.watch||0)*X.watch,.05,.85)}
  static odds(ch){return insight(['you cannot tell your odds',ch>=.5?'a fair chance':'a long chance','about '+Math.round(ch*100)+'%'],'know the odds')}
  static body(t){const key=t.name,k=this.kind(key),mine=this.mine(t),list=this.of(key),qs=this.quests(t),i=r=>list.indexOf(r);
    const head='<p class="muted">'+(k?'The '+k.name+' of '+t.name+': '+['its keepers a few men of the '+t.T.n,'kept by the watch','kept by a strong guard','kept by the garrison'][Math.max(0,['village','town','city','castle'].indexOf(t.kind))]+'. ':'')+
      (list.filter(r=>r.k!=='men').length)+' of '+(k?.holds||0)+' cells taken'+(mine&&k?.men?', '+(k.men-this.menRoom(key))+' of '+k.men+' places for soldiers':'')+'.</p>';
    const theirs=list.filter(r=>r.keep!=='player'),yours=list.filter(r=>r.keep==='player');
    const cards=[...qs.map(q=>({pic:personPic('folk',t.races?.[0]||'human',1),name:cap1(q.pn),role:q.title,facts:[[q.price+'g asked','gold']],note:q.say('gaol')||'Held here until someone pays.',
        acts:[['pz-quest',q.id,'Pay '+q.price+'g',P.gold<q.price?'You have '+P.gold+'g':''],!mine&&['pz-qbreak',q.id,'Break out · '+this.odds(this.breakChance(key))]]})),
      ...theirs.map(r=>this.card(r,i(r),key,t,mine))];
    const lock=mine&&this.lockCards(key);
    return head+(cards.length?railCards(cards):'<p class="muted">No one is held here now.</p>')+
      (yours.length?'<div class="lab">Your prisoners</div>'+railCards(yours.map(r=>this.yourCard(r,i(r),key))):'')+
      (lock?'<div class="lab">Lock them up</div>'+lock:'')+
      (!mine?'<p class="muted">Paying, bribing and breaking out take place at once. A bribe found out, or a break-out, is a crime against the '+(FACS[t.owner]?.n||'holding')+'.</p>':'')}
  // (one held by others: a lord, your companion; what you can do for him)
  static card(r,i,key,t,mine){const pay=this.ransomOf(r),bb=this.bribe(r,key),br=this.breakChance(key),l=r.k==='lord'&&this.lordOf(r),
      acts=mine?[]:[['pz-pay',i,'Pay '+pay+'g',P.gold<pay?'You have '+P.gold+'g':''],['pz-bribe',i,'Bribe the gaoler · '+bb.cost+'g',P.gold<bb.cost?'You have '+P.gold+'g':''],['pz-break',i,'Break out · '+this.odds(br)]];
    if(r.k==='lord')return{fac:r.fac,pic:lordPic(l||r),name:this.who(r),role:'Lord of the '+FACS[r.fac].n+', held by the '+FACS[r.keep].n,facts:['Lv '+r.lv,'since day '+r.since,l&&['Relation '+relWith(l),relWith(l)>=0?'good':'bad']],
      acts:[['pz-visit',i,'Visit',r.seen!=null&&G.day-r.seen<PRISON.visit.days?'Not again so soon':''],...acts]};
    return{pic:portrait(r.id),name:this.who(r),role:'Your companion, held by '+(FACS[r.keep]?'the '+FACS[r.keep].n:r.keep==='broker'?'the ransom broker':'the band'),facts:['since day '+r.since],note:'Get him out, or he may slip away in time.',acts}}
  // (yours: a lord, a chieftain, soldiers; what becomes of them)
  static yourCard(r,i,key){
    if(r.k==='men')return{pic:portrait(r.type),name:ST[r.type].n,role:'Prisoners',n:r.n,acts:[['pz-recruit',i,'Recruit one'],['pz-out',i,'Take out',prisonerCount()>=prisonCap()?'No room for prisoners':''],['pz-free',i,'Let them go']]};
    if(r.k==='chief')return{pic:portrait('chief'),name:this.who(r),role:'Bandit chief, your prisoner',facts:['Lv '+r.ld.lv],acts:[['pz-hand',i,'Hand over '+bountyOf(r.ld)+'g'],['pz-out',i,'Take out'],['pz-free',i,'Let go']]};
    const swap=this.swapFor(r);
    return{fac:r.fac,pic:lordPic(this.lordOf(r)||r),name:this.who(r),role:'Lord of the '+FACS[r.fac].n+', your prisoner',facts:['Lv '+r.lv,'since day '+r.since,r.offer?['His realm offers '+r.offer+'g','gold']:'no offer yet'],
      acts:[['pz-ransom',i,r.offer?'Ransom '+r.offer+'g':'Ransom',r.offer?'':fiefsOf(r.fac).length?'His realm has made no offer yet':'His realm has fallen: no one will pay'],r.offer&&!r.asked&&['pz-ask',i,'Ask for more'],
        ['pz-swap',i,'Exchange'+(swap?' for '+this.who(swap.r):''),swap?'':'His realm holds no one of yours'],['pz-free',i,'Let go'],['pz-out',i,'Take out'],['pz-exec',i,'Execute']]}}
  // (what you carry that can be locked up: your captives, your soldier prisoners)
  static lockCards(key){const cs=captives(),room=this.room(key),men=this.menRoom(key),n=prisonerCount();
    const cards=cs.map((c,i)=>({fac:c.k==='lord'?c.fac:undefined,pic:c.k==='chief'?portrait('chief'):lordPic(c),name:c.k==='lord'?c.name:c.ld.name,role:c.k==='lord'?'Lord of the '+FACS[c.fac].n+', with you':'Bandit chief, with you',
      acts:[['pz-lock',i,'Lock up',room>0?'':'No cell free']]}));
    if(n)cards.push({pic:portrait(Object.keys(P.prisoners).find(k=>P.prisoners[k]>0)),name:'Your soldier prisoners',role:'With you',n,acts:[['pz-lockmen',null,'Lock up '+Math.min(n,Math.max(0,men)),men>0?'':'No room for soldiers']]});
    return cards.length?railCards(cards):''}
  // (for an exchange: one of yours his realm holds: your companion, else a lord of your realm)
  static swapFor(r){return this.heldBy(r.fac,x=>x.k==='comp')||(P.fac?this.heldBy(r.fac,x=>x.k==='lord'&&x.fac===P.fac):null)}
  // (a crime at t: found out bribing, or breaking one out; the watch's fine)
  static crime(t,fine){if(!t.owner||t.owner==='player')return;const old=crimeAt(t);t.crime={until:G.day+PATROL.wanted,fine:(old?old.fine:0)+fine}}
  static act(a,arg,t){const key=t.name,list=this.of(key),r=list[+arg],mine=this.mine(t);
    if(a==='pz-quest'||a==='pz-qbreak'){const q=this.quests(t).find(q=>String(q.id)===String(arg));if(!q)return;if(a==='pz-quest')return void q.ransom();
      if(mine)return;if(Math.random()<this.breakChance(key)){this.crimeOut(t);return void q.pay('freed','taken')}return void this.caught(t)}
    if(a==='pz-lock'){const c=captives()[+arg];if(!c||!mine||this.room(key)<1)return;captives().splice(+arg,1);
      this.put(key,c.k==='lord'?{k:'lord',id:c.id,name:c.name,fac:c.fac,lv:c.lv,keep:'player',since:G.day,offerDay:G.day+rint(...PRISON.offer)}:{k:'chief',ld:c.ld,keep:'player',since:G.day});
      const l=c.k==='lord'&&W.lords.find(x=>x.id===c.id);if(l)l.jail=key;return void log('You lock '+(c.k==='lord'?c.name:c.ld.name)+' in '+this.title(key)+'.','gold','war')}
    if(a==='pz-lockmen'){if(!mine)return;let room=this.menRoom(key),n=0;for(const k of Object.keys(P.prisoners)){const m=Math.min(P.prisoners[k],room);if(m<=0)continue;room-=m;n+=m;P.prisoners[k]-=m;if(P.prisoners[k]<=0)delete P.prisoners[k];
        const had=list.find(x=>x.k==='men'&&x.type===k);if(had)had.n+=m;else this.put(key,{k:'men',type:k,n:m,keep:'player'})}
      return void(n&&log('You lock '+n+' prisoners in '+this.title(key)+'.','gold','war'))}
    if(!r)return;
    if(r.keep!=='player'){if(mine&&a!=='pz-visit')return;
      if(a==='pz-visit'&&r.k==='lord'){const l=this.lordOf(r);if(!l||r.seen!=null&&G.day-r.seen<PRISON.visit.days)return;r.seen=G.day;KNOWLEDGE.lord(l);changeRel(l,PRISON.visit.rel,'you visited them in prison');
        return void log('You visit '+lordName(l)+' in '+this.title(key)+'. He is glad of the company.','gold','war')}
      if(a==='pz-pay'){const g=this.ransomOf(r);if(P.gold<g)return;P.gold-=g;if(FACS[r.keep])W.treas[r.keep]=treas(r.keep)+g;log('You pay '+g+' gold for '+this.who(r)+'.','gold','war');return void this.freedByYou(r,key)}
      if(a==='pz-bribe'){const b=this.bribe(r,key);if(P.gold<b.cost)return;P.gold-=b.cost;if(Math.random()<b.ch){log('The gaoler takes your '+b.cost+' gold and leaves a door unbarred: '+this.who(r)+' walks free.','gold','war');return void this.freedByYou(r,key)}
        this.crime(t,PRISON.bribe.fine);return void log('The gaoler takes your '+b.cost+' gold, and tells the watch.','bad','war')}
      if(a==='pz-break'){if(Math.random()<this.breakChance(key)){this.crimeOut(t);log('In the night you break '+this.who(r)+' out of '+this.title(key)+'.','gold','war');return void this.freedByYou(r,key,PRISON.brk.rel)}return void this.caught(t)}
      return}
    // yours
    if(a==='pz-out'){if(r.k==='men'){const m=Math.min(r.n,prisonCap()-prisonerCount());if(m<=0)return;P.prisoners[r.type]=(P.prisoners[r.type]||0)+m;r.n-=m;if(!r.n)this.drop(key,r);return}
      this.drop(key,r);captives().push(r.k==='lord'?{k:'lord',id:r.id,name:r.name,fac:r.fac,lv:r.lv}:{k:'chief',ld:r.ld});const l=r.k==='lord'&&this.lordOf(r);if(l)l.jail=null;return}
    if(a==='pz-recruit'&&r.k==='men'){P.prisoners[r.type]=(P.prisoners[r.type]||0)+1;const res=recruitment.recruitPrisoner(r.type);if(!res.ok){P.prisoners[r.type]--;if(P.prisoners[r.type]<=0)delete P.prisoners[r.type]}else{r.n--;if(!r.n)this.drop(key,r)}
      return void recruitmentFeedback(res,t)}
    if(a==='pz-free'){this.drop(key,r);if(r.k==='men'){P.renown+=Math.ceil(r.n/5);mood('release');return void log('You let '+r.n+' prisoners go.')}
      if(r.k==='lord'){addHonor(r.fac,8,true);const l=this.lordOf(r);if(l)changeRel(l,RELATION.letGo,'you let them go')}else repNear(P.x,P.y,-3);
      this.out(r,key,'free');mood('release');return void log('You let '+this.who(r)+' go.')}
    if(a==='pz-hand'&&r.k==='chief'){const g=bountyOf(r.ld);P.gold+=g;P.renown+=2;repNear(P.x,P.y,4);this.drop(key,r);return void log('You hand '+r.ld.name+' over to justice: '+g+' gold.','gold')}
    if(r.k!=='lord')return;const l=this.lordOf(r);
    if(a==='pz-ransom'&&r.offer){P.gold+=r.offer;W.treas[r.fac]=Math.max(0,(W.treas[r.fac]||0)-r.offer);addHonor(r.fac,-3,true);if(l)changeRel(l,RELATION.ransom,'you held them for ransom');log('The '+FACS[r.fac].n+' pay '+r.offer+' gold for '+r.name+'.','gold');mood('ransom');return void this.out(r,key,'ransomed')}
    if(a==='pz-ask'&&r.offer&&!r.asked){r.asked=true;const X=PRISON.ask;if(Math.random()<X.ch){r.offer=Math.round(r.offer*X.more/5)*5;return void log('The '+FACS[r.fac].n+' grumble, and raise their offer to '+r.offer+' gold.','gold')}
      r.offer=0;r.offerDay=G.day+X.wait;return void log('The '+FACS[r.fac].n+' take back their offer. They may make another in '+X.wait+' days.','bad')}
    if(a==='pz-swap'){const s=this.swapFor(r);if(!s)return;this.out(s.r,s.key,'exchanged');this.out(r,key,'exchanged');if(s.r.k==='lord'&&P.fac){addHonor(P.fac,PRISON.pay.honor,true);const o=this.lordOf(s.r);if(o)changeRel(o,PRISON.pay.rel,'you traded for them')}
      return void log('You trade '+r.name+' to the '+FACS[r.fac].n+' for '+this.who(s.r)+'.','gold','war')}
    if(a==='pz-exec'){const X=PRISON.exec;this.drop(key,r);if(l)Object.assign(l,{gone:true,dead:true,held:false,jail:null,back:1e9});addHonor(r.fac,X.honor,true);for(const f of FIDS)if(f!==r.fac&&!W.dead[f])addHonor(f,X.all,true);
      for(const o of lordsOf(r.fac))if(o!==l&&!o.gone)changeRel(o,X.rel,'you put '+r.name+' to death');mood('cruel');
      worldEvent({text:r.name+' of the '+FACS[r.fac].n+' is put to death in '+this.title(key)+'.',fac:[r.fac],cls:'bad',past:r.name+' was put to death'});return}}
  // (freed by your hand: a lord thinks better of you (more, broken out), and your realm if he is its own; your companion with you)
  static freedByYou(r,key,rel=PRISON.pay.rel){if(r.k==='lord'){const l=this.lordOf(r);if(l)changeRel(l,rel,'you freed them from prison');if(r.fac===P.fac)addHonor(P.fac,PRISON.pay.honor,true)}this.out(r,key,'freed')}
  // (a break-out: a crime against the holding's realm, hostile for days, your honour with it lower; caught: its fine, and hurt)
  static crimeOut(t){const X=PRISON.brk;if(FACS[t.owner]&&t.owner!==P.fac)realmOf(t.owner).provoke(X.hostile,X.honor)}
  static caught(t){const X=PRISON.brk;this.crime(t,X.fine);P.hp=Math.max(1,Math.round(P.hp-vitals()[0]*X.hurt));log('The guards catch you at the cells and beat you off. The watch wants '+(crimeAt(t)?.fine||X.fine)+' gold of you.','bad','war')}
  // a hostile holding's prison, from outside its walls (siege.js showSiege: The prison): the same page, Back to the walls
  static outside(t){G.mode='besiege';G.bes=t;showPanel('<div class="top"><h2>'+cap1(this.title(t.name))+'</h2><span class="muted">'+t.name+' · '+P.gold+' gold</span></div><p class="muted">From outside its walls: coin for its keepers, or a night over the wall.</p>'+
    this.body(t)+nav(['sg-back',null,'Back'],['sg-leave',null,'Leave']),'prison:'+t.name)}
  // a camp's or hideout's page (world/sites.js Lair): who it holds of yours
  static siteNote(s){const key=this.keyOf({k:'site',i:s.i,seed:s.seed}),cs=this.of(key).filter(r=>r.k==='comp');return cs.length?'<p class="bad">'+cs.map(r=>this.who(r)).join(' and ')+' '+(cs.length>1?'are':'is')+' held here, in '+this.title(key)+'. Clear it to free '+(cs.length>1?'them':'him')+'.</p>':''}
  static save(){return Object.keys(this.jails).length?this.jails:null}
  static load(v){this.jails=v||{}}
}
// (its verbs: in a holding's window, the town's (ui/town.js townAct); from outside a hostile holding's walls, here)
onAct('pz-',(a,arg)=>{if(G.town?.ref)return townAct(a,arg,G.town.ref);const t=G.mode==='besiege'&&G.bes;if(!t)return;Prisons.act(a,arg,t);updateHUD(true);if(G.mode==='besiege')Prisons.outside(t)});
worldOn('site:cleared',d=>{if(d?.site)Prisons.cleared(d.site)});
onWorld(()=>{Prisons.jails={}});
Systems.add({name:'prisons',order:{day:175},day:()=>Prisons.day()});
Saves.add({key:'prisons',order:335,defaults:null,save:()=>Prisons.save(),load:v=>Prisons.load(v)});
