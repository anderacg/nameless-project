'use strict';
/* ---------- word of the world (the owner, 2026-10-23): you learn of a world event as you hear rumours. Each goes through one
   gateway, worldEvent(ev), which picks how word of it reaches you:
   1. you took part (ev.involved; your battle's aftermath, worldPart; or you besiege or stay in one of its holdings, ev.towns):
      into your log at once;
   2. you saw it (where it happened, ev.x, ev.y, within WORLD_LOG.sight times your sight: fights.js's rule): at once, worded as
      seen (ev.seen, else its text);
   3. your own realm's affairs (one of its realms, ev.fac, your employer's or your own banner's; or yours, ev.mine: your caravan,
      a battle your realm's lord fought): a rider brings it from your realm's holding nearest it, a day for every WORLD_LOG.tiles
      tiles from where it happened to where you are (at least WORLD_LOG.minHours), and then it goes into your log: who sent him and
      when it happened (its words in the past, ev.past, then ev.also; the log's record keeps the day it happened). ev.post false:
      no rider for it (a battle begun: the rider brings its end);
   4. anything else: news only (news.js), heard as a rumour.
   Its news: ev.news [kind, at, detail], recorded here, or ev.heard [kind, at], the item the bus (core/bus.js) recorded a moment
   before. What you learn at once or by rider is heard already: no source tells it you again as new. ev.cls: the log's tone.
   The riders on their way: W.news.post [{due (Clock.hours), day (it happened), from (who sent him), p (its words), a (more), cls}],
   saved with the news (news.js). WORLD_LOG.on false: every event logged where it was before the gateway (ev.was false: it was
   not), nothing recorded (the fingerprints' check, tests/worldlog.js). The map's holding colours still change at once ---------- */
// sight: × your sight; tiles: a rider's day; minHours: the least he takes; buy: a tavern's news for gold (base + tier × the
// holding's tier, n more rumours than the free ones, once a day)
const WORLD_LOG={on:true,sight:1.5,tiles:60,minHours:3,buy:{base:10,tier:10,n:2}};
// (you took part: told so, in your battle's aftermath (worldPart), or you besiege it or stay inside; you see it; it is yours:
// your employer's, your banner's, your own)
const WL_PART={n:0},worldPart=fn=>{WL_PART.n++;try{return fn()}finally{WL_PART.n--}};
const wlPart=ev=>!!ev.involved||WL_PART.n>0||[].concat(ev.towns||[]).some(t=>t&&(P.siege&&P.siege.town===t.name||P.stay&&P.stay.town===t.name));
const wlSees=ev=>ev.x!=null&&Math.hypot(ev.x-P.x,ev.y-P.y)<vis()*WORLD_LOG.sight;
const wlYours=ev=>!!ev.mine||[].concat(ev.fac||[]).some(f=>f&&(f==='player'||f===P.fac));
// (the item the bus recorded just now: its kind by that holding today, the newest)
const newsAt=(k,at)=>{const t=newsNear(at);return t&&newsW().items.filter(it=>it.k===k&&it.near===t.name&&it.day===G.day).pop()||null};
// the gateway; the route it took ('part', 'seen', 'rider', 'news'; 'log' with the gateway off)
function worldEvent(ev){
  if(!WORLD_LOG.on){if(ev.was!==false)log(ev.text,ev.cls,'war');return 'log'}
  const it=ev.news?newsRecord(...ev.news):ev.heard?newsAt(...ev.heard):null,how=wlPart(ev)?'part':wlSees(ev)?'seen':wlYours(ev)&&ev.post!==false?'rider':'news';
  if(how==='part'||how==='seen')log(how==='seen'&&ev.seen||ev.text,ev.cls,'war');
  else if(how==='rider')wlSend(ev);
  if(it&&how!=='news')newsW().heard[it.id]=G.day;
  return how}
// (news only, with the gateway on: what was never logged, as a garrison starving under another's siege)
const worldNews=(k,at,detail)=>WORLD_LOG.on?newsRecord(k,at,detail):null;
// where two realms meet: halfway between their nearest holdings (one has none: the other's first; neither: null)
function realmsMeet(a,b){const A=fiefsOf(a),B=fiefsOf(b);if(!A.length||!B.length)return A[0]||B[0]||null;let at=null,bd=Infinity;
  for(const p of A)for(const q of B){const d=Math.hypot(p.x-q.x,p.y-q.y);if(d<bd){bd=d;at={x:(p.x+q.x)/2,y:(p.y+q.y)/2}}}return at}

/* ---- the riders ---- */
// one sets out: from your realm's holding nearest where it happened (none: the holding nearest it), as long on the road as from
// there (no place: from his holding) to you, in whole hours
function wlSend(ev){
  const at=ev.x!=null?{x:ev.x,y:ev.y}:null,q=at||P,own=TOWNS.filter(t=>!t.gone&&(t.owner==='player'||P.fac&&t.owner===P.fac));
  const h=Spatial.nearest(own,q.x,q.y)||Spatial.nearestHolding(q.x,q.y),o=at||h||P,L=WORLD_LOG;
  const r={due:Math.ceil(Clock.hours()+Math.max(L.minHours,Math.hypot(o.x-P.x,o.y-P.y)/(L.tiles*TILE)*24)),day:G.day,from:h?h.name:'',p:ev.past||ev.text.replace(/\.$/,'')};
  if(ev.also)r.a=ev.also;if(ev.cls)r.cls=ev.cls;const N=newsW();(N.post||(N.post=[])).push(r);return r}
const WL_N=['','one','two','three','four','five','six','seven','eight','nine','ten'];
const wlWhen=d=>{const a=Clock.daysSince(d);return a<=0?'earlier today':a===1?'yesterday':(WL_N[a]||a)+' days ago'};
// each hour: the riders due come in, each a line in your log ("A rider from Ashford: Thornford fell to … two days ago.")
function wlArrive(){const N=W.news;if(!N||!N.post||!N.post.length)return;const now=Clock.hours(),come=N.post.filter(r=>r.due<=now);if(!come.length)return;
  N.post=N.post.filter(r=>r.due>now);if(!N.post.length)delete N.post;
  for(const r of come)log((r.from?'A rider from '+r.from:'A rider')+': '+cap1(r.p)+' '+wlWhen(r.day)+'.'+(r.a||''),r.cls,'war',null,r.day)}
Systems.add({name:'riders',order:{hour:30},hour:wlArrive});

/* ---- a tavern's news for gold (ui/town.js Tavern): WORLD_LOG.buy.n more rumours than the free ones, once a day, from its own
   source (its own cap: 'tavern:<name>+'), at its price by the holding's tier ---- */
const newsPrice=t=>WORLD_LOG.buy.base+WORLD_LOG.buy.tier*(t.T&&t.T.tier||0);
const newsBuySrc=t=>rumourSource('tavern',t.name+'+',t,{cap:WORLD_LOG.buy.n,from:'the innkeeper of '+t.name});
const newsBought=t=>{const x=newsW().told['tavern:'+t.name+'+'];return x&&x.day===G.day?x:null};
// (why you cannot buy it here now: '' when you can)
const newsBuyWhy=t=>newsBought(t)?'You bought the news here today':!rumourCands(newsBuySrc(t)).length?'They know nothing more':P.gold<newsPrice(t)?'Not enough gold':'';
function newsBuy(t){if(newsBuyWhy(t))return null;const p=newsPrice(t);P.gold-=p;log('You pay the innkeeper of '+t.name+' '+p+' gold for the news.','gold');return rumourFrom(newsBuySrc(t))}
// (under the tavern's Rumours: what you bought today, or the offer)
function newsBuyHtml(t){const b=newsBought(t);
  if(b)return '<div class="lab">Bought news</div>'+b.ids.map(newsById).filter(Boolean).map(it=>'<p class="rum-new"><span class="rum-q">?</span> '+rumourText(it)+'</p>').join('')+'<p class="muted">You paid for the news here today; come back tomorrow.</p>';
  return railRow('Buy news','The innkeeper hears what is not said aloud: '+WORLD_LOG.buy.n+' more rumours, once a day.',railBtn('buy-news',null,'Buy · '+newsPrice(t)+'g',newsBuyWhy(t)))}
