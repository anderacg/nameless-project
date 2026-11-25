'use strict';
/* ---------- world: dealing with the outlaws at their hideout (the owner, 2026-11-25: a hideout "just like a mini holding for
   bandit factions"; its places' services) ----------
   Paid their toll (its parley: Come to deal), they let you in for hours: none of them comes for you (SiteLife.hostile), and over
   its places badges for its services (LairSpots, as a camp's: MapBadges), each a step of its page:
   - fence, at its stash: your gear and goods for cut of what the nearest market pays, no questions asked;
   - hire, at its pen: its own raiders, most a visit, gold by their tier, keep of them staying; brigands in your band, as a
     yielded band's (CONDUCT.takeBrigands, once a visit);
   - ransom, at its cage: your prisoners sold to them, gold by their tier (every realm's honor lower, honor an act), or one of
     your companions held here (world/prisons.js, a site's) bought free for comp.
   Attacking them (Lair fight), or being seen at their stash, ends it. A lair, a den in ruins, a camp and the goblins deal with no one.
   icons: the badges (near: px from you they show; css, gap, tap: MapBadges'; up: px over its place; ico: their pictures) */
const LAIR_DEAL={on:true,toll:{base:20,per:3},hours:12,
  fence:{cut:.55},
  hire:{most:3,gold:[30,30,55,90,140],keep:6},
  ransom:{gold:[8,8,14,24,40,60],honor:1,comp:150},
  places:{fence:'stash',hire:'pen',ransom:'cage'},
  names:{fence:'Fence',hire:'Cutthroats for hire',ransom:'The cage'},
  icons:{near:140,css:22,gap:3,tap:5,up:18,ico:{fence:'sack',hire:'recruit',ransom:'prisoners'}}};
const LairDeal={
  // (whether it deals with you at all; its toll; whether you are in now)
  can(s){return LAIR_DEAL.on&&s instanceof Hideout&&!(s instanceof GoblinCamp)&&!!s.life&&!s.tunnel&&!s.cleared},
  toll(s){const T=LAIR_DEAL.toll;return T.base+T.per*s.people},
  open(s){return !!s&&!!s.deal&&!s.cleared&&Clock.hours()<s.deal},
  hoursLeft(s){return Math.max(1,Math.ceil(s.deal-Clock.hours()))},
  // (its services: those of its places it has)
  keys(s){const L=s.layout();return Object.keys(LAIR_DEAL.places).filter(k=>L.some(q=>q.k===LAIR_DEAL.places[k]))},
  at(s,k){return s.layout().find(q=>q.k===LAIR_DEAL.places[k])||null},
  // (paid: in for its hours; a line, '' if you cannot pay)
  pay(s){const g=this.toll(s);if(!this.can(s)||P.gold<g)return '';P.gold-=g;s.deal=Clock.hours()+LAIR_DEAL.hours;s.dealTook=false;s.dealHired=0;
    return (s.ld?s.ld.name:'Their chieftain')+' pockets your '+g+' gold and waves you in. You may deal here for '+LAIR_DEAL.hours+' hours.'},
  end(s){s.deal=null},
  // (the fence: what of your bag it takes, at its price)
  wares(s){const t=Spatial.nearestHolding(s.x,s.y),out=[];
    P.inv.forEach((x,i)=>{if(!x||!catAllows(i,'sell'))return;const K=itemKind(x),g=Math.max(1,Math.floor(K.fetches(x,t)*LAIR_DEAL.fence.cut));out.push({i,x,K,g})});return out},
  fence(s,i){const w=this.wares(s).find(o=>o.i===+i);if(!w)return '';P.gold+=w.g;P.inv[w.i]=null;train('trade',w.g/30);return 'Their fence takes '+w.K.sold(w.x)+' for '+w.g+' gold, no questions asked.'},
  // (its men for hire: its raiders past keep, most a visit; a man's price by his tier)
  price(type){const H=LAIR_DEAL.hire.gold;return H[clamp(ST[type]?.tier|0,0,H.length-1)]},
  men(s){const H=LAIR_DEAL.hire,all=SiteLife.fighters(s),free=Math.max(0,Math.min(H.most-(s.dealHired|0),all.length-H.keep));
    return all.filter(p=>p.type!=='chief'&&p.role!=='watch').slice(0,free)},
  hireWhy(s,p){return partyRoom()<1?'Your band is full':!partyRoster(P).canAdd(p.type)?'No room for that kind':P.gold<this.price(p.type)?'Not enough gold':''},
  hire(s,id){const p=this.men(s).find(q=>q.id===+id);if(!p||this.hireWhy(s,p))return '';const g=this.price(p.type);P.gold-=g;P.add(p.type);p.hp=0;p.mode='dead';p.hired=true;s.dealHired=(s.dealHired|0)+1;
    let m=ST[p.type].n+' takes your '+g+' gold and falls in with your band.';
    if(!s.dealTook){s.dealTook=true;const c=CONDUCT.takeBrigands;P.morale=clamp(P.morale-c.morale,0,100);FIDS.forEach(f=>addHonor(f,-c.honorAll,true));mood('cruel');
      m+=' Your honest soldiers grumble (morale −'+c.morale+'), and every realm thinks a little less of you (−'+c.honorAll+' honor).'}return m},
  // (the cage: your prisoners sold to them, by kind; yours held here bought free)
  ransomOf(type){const R=LAIR_DEAL.ransom.gold;return R[clamp(ST[type]?.tier|0,0,R.length-1)]},
  key(s){return Prisons.keyOf({k:'site',i:s.i,seed:s.seed})},
  held(s){return Prisons.of(this.key(s)).filter(r=>r.k==='comp')},
  sell(s,type){const n=P.prisoners[type]|0;if(!n)return '';const g=n*this.ransomOf(type);P.gold+=g;delete P.prisoners[type];
    FIDS.forEach(f=>addHonor(f,-LAIR_DEAL.ransom.honor,true));mood('cruel');return 'You sell '+n+' '+(n>1?'prisoners':'prisoner')+' ('+ST[type].n+') into their cage for '+g+' gold. Every realm thinks less of you (−'+LAIR_DEAL.ransom.honor+' honor).'},
  free(s,n){const r=this.held(s)[+n],g=LAIR_DEAL.ransom.comp;if(!r||P.gold<g)return '';P.gold-=g;const who=Prisons.who(r);Prisons.freedByYou(r,this.key(s));return 'You pay '+g+' gold, and '+who+' walks out of their cage.'},
  // its page while you are in (Lair page): home, and each service's step
  home(s){const ld=s.ld,K=this.keys(s),N=LAIR_DEAL.names,facts={fence:[this.wares(s).length+' to sell','for less than a market'],hire:[this.men(s).length+' for hire','brigands'],ransom:[prisonerCount()+' prisoners','sold to them']};
    return{body:'<p>'+(ld?ld.name+'’s':'Their')+' men let you in to deal: '+this.hoursLeft(s)+' hours left.</p>'+Prisons.siteNote(s),
      acts:K.map(k=>({icon:LAIR_DEAL.icons.ico[k],label:N[k],act:'site-tab',arg:k,facts:facts[k]})).concat({icon:'attack',label:'Attack',act:'site-ask',facts:['break your word','their fighters'],tip:'Turn on them while you are inside: the fight as ever.'})}},
  page(s,k){const N=LAIR_DEAL.names,back=['site-tab','home','Back'];let body='';
    if(k==='fence'){const W=this.wares(s);body='<p class="muted">Their fence pays '+Math.round(LAIR_DEAL.fence.cut*100)+'% of what a market would, and asks nothing.</p>'+
      (W.length?W.map(w=>railRow(htmlText(w.K.some(w.x)),w.g+' gold',railBtn('site-fence',w.i,'Sell'))).join(''):'<p>You have nothing they want.</p>')}
    else if(k==='hire'){const M=this.men(s);body='<p class="muted">A few of their raiders will ride with you, for gold. At most '+LAIR_DEAL.hire.most+' a visit; brigands in your band trouble your soldiers and the realms.</p>'+
      (M.length?M.map(p=>railRow(htmlText(ST[p.type].n),'Tier '+(ST[p.type].tier|0)+', '+this.price(p.type)+' gold',railBtn('site-hire',p.id,'Hire',this.hireWhy(s,p)))).join(''):'<p>None of them will go with you now.</p>')}
    else if(k==='ransom'){const T=Object.keys(P.prisoners||{}).filter(t=>P.prisoners[t]>0),H=this.held(s),c=LAIR_DEAL.ransom.comp;
      body='<p class="muted">They buy captives, to sell on or put to work, and keep their own here.</p>'+
      H.map((r,n)=>railRow(htmlText(Prisons.who(r)),'Held here: '+c+' gold to buy free',railBtn('site-free',n,'Buy free',P.gold<c?'Not enough gold':''))).join('')+
      (T.length?T.map(t=>railRow(htmlText(ST[t].n)+' ×'+P.prisoners[t],this.ransomOf(t)+' gold each, '+P.prisoners[t]*this.ransomOf(t)+' in all',railBtn('site-sell',t,'Sell'))).join(''):'<p>You bring no prisoners to sell.</p>')}
    return{title:N[k],body,back}},
  act(s,a,arg,done){if(a==='site-deal'){const m=this.pay(s);if(m){G.siteTab=null;done(m)}return true}
    if(!this.open(s))return false;
    const m=a==='site-fence'?this.fence(s,arg):a==='site-hire'?this.hire(s,arg):a==='site-sell'?this.sell(s,arg):a==='site-free'?this.free(s,arg):null;
    if(m==null)return false;if(m)done(m);return true},
  // (a badge clicked: its page at that service)
  go(s,k){G.lastSite=s;if(!s.enter())return;if(this.open(s)&&this.keys(s).includes(k)){G.siteTab=k;showSite()}}
};
// a hideout's service on the map, its badge over its place (LairSpots), while you may deal there
class LairSpot extends WorldObject{
  constructor(s,k){super();this.s=s;this.k=k;this.x=s.x;this.y=s.y;this.box=null}
  get mapKind(){return 'lairspot'}
  here(){return W.sites.includes(this.s)&&LairDeal.open(this.s)}
  get meetsAnyTime(){return true}
  inView(V){return !!this.box}
  pick(at){const b=this.box;if(b)at.box(this,b[0],b[1],b[2],b[3])}
  meet(){LairDeal.go(this.s,this.k)}
  get label(){return LAIR_DEAL.names[this.k]}
  tip(){return '<b>'+this.label+'</b><small>'+this.s.name+'</small><span class="act">Click: go to it</span>'}
}
const LairSpots={
  of:new Map(),
  list(s){let L=this.of.get(s);const ks=LairDeal.keys(s);if(!L||L.map(o=>o.k).join()!==ks.join()){L=ks.map(k=>(L||[]).find(o=>o.k===k)||new LairSpot(s,k));this.of.set(s,L)}return L},
  shown(s){return s instanceof Hideout&&LairDeal.open(s)&&s.known()&&Math.hypot(s.x-P.x,s.y-P.y)<=LAIR_DEAL.icons.near},
  all(){const out=[];for(const L of this.of.values())out.push(...L);return out},
  // each frame: the hideouts you may deal at near you, their badges over their places (render.js drawWorld)
  draw(cam){const I=LAIR_DEAL.icons;
    for(const [s,L] of this.of)if(!W.sites.includes(s)||!this.shown(s)){for(const o of L)o.box=null;if(!W.sites.includes(s)||!LairDeal.open(s))this.of.delete(s)}
    const items=[];for(const s of W.sites){if(!this.shown(s))continue;for(const o of this.list(s)){const q=LairDeal.at(s,o.k);if(q)items.push({o,a:{x:q.x,y:q.y,up:I.up}})}}
    if(items.length)MapBadges.draw(items,cam,I,o=>I.ico[o.k])}
};
onWorld(()=>LairSpots.of.clear());
