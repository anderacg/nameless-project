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
   4. anything else: news only (news.js): a proclamation spreading as a wave (heard free once it reaches you), or common talk,
      heard as a rumour.
   Its news: ev.news [kind, at, detail], recorded here, or ev.heard [kind, at], the item the bus (core/bus.js) recorded a moment
   before. What you learn at once or by rider is heard already: no source tells it you again as new. ev.cls: the log's tone.
   The riders on their way: W.news.post [{due (Clock.hours), day (it happened), from (who sent him), p (its words), a (more), cls}],
   saved with the news (news.js). WORLD_LOG.on false: every event logged where it was before the gateway (ev.was false: it was
   not), nothing recorded (the fingerprints' check, tests/worldlog.js). The map's holding colours still change at once ---------- */
// sight: × your sight; tiles: a rider's day; minHours: the least he takes
const WORLD_LOG={on:true,sight:1.5,tiles:60,minHours:3};
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
// each hour: the riders, and the crier of the holding you are at or in (news.js proclaimAt)
function wlHour(){wlArrive();proclaimAt(proclaimWhere())}
Systems.add({name:'riders',order:{hour:30},hour:wlHour});

/* ---- intelligence (the owner, 2026-10-23): what someone who knows tells you for gold, precise and current, worked out from the
   world as it is now (never news, never free): a lord's army (where, how strong, what he is about), an army on the march (where
   to, how far off), a siege's true state (the besiegers, the garrison, its food, the days to the assault), a bandit hideout's
   place (on your map then), a caravan's road and guard (INTEL_KINDS). intelGather(src): what a source knows, within src.r px of
   its places (src.at), the dearest and nearest first, never what you bought today. Now the tavern's innkeeper (Buy information:
   up to INTEL.n, once a day, each its kind's value by the holding's tier: ui/town.js Tavern); later informants, Scouting and the
   bird, through the same call. intelLearn(o, from): one bought, into your log ("Information (…): …") and its gold "?" on its
   very spot (news.js marks, i). Bought today: W.news.told['intel:<holding>'] {day, ids: [], intel: [{key, t}]}, saved with the
   news ---- */
// r: a tavern's reach (px); n: the most bought at once; list: the most offered; tier: the price's rise for each tier past a
// village's (2); v: each kind's value (gold, before the tier); col: its mark's colour
const INTEL={r:640,n:3,list:8,tier:.25,v:{siege:35,hideout:40,march:30,lord:20,caravan:15},col:'#f0c860'};
// (where, exactly: at a holding, or so many tiles to one side of the nearest; a man or men; a lord and his realm)
const intelSpot=p=>{const h=newsNear(p);if(!h)return 'in the wilds';const d=Math.round(Math.hypot(p.x-h.x,p.y-h.y)/TILE);return d<2?'at '+h.name:d+' tiles '+compass(p.x-h.x,p.y-h.y)+' of '+h.name};
const intelMen=n=>n+(n===1?' man':' men');
const intelLord=l=>l.name+' of the '+facN(l.fac);
/* the kinds: of() (what there is to know of), key(o) (one each), at(o) (where it is; none: o), name(o) and sub(o) (the offer,
   telling nothing yet), say(o) (what you learn), learn(o) (what it changes: a hideout on your map) */
const INTEL_KINDS={
  siege:{of:()=>TOWNS.filter(t=>!t.gone&&siegeLordsAt(t).length&&!(P.siege&&P.siege.town===t.name)),key:t=>TOWNS.indexOf(t),name:t=>'The siege of '+t.name,sub:()=>'Its true state',
    say:t=>{const ls=siegeLordsAt(t),lead=ls.slice().sort((a,b)=>(b.sd||0)-(a.sd||0))[0],men=ls.reduce((a,l)=>a+l.troops.length,0),inn=lordsInside(t),food=t.stock?Math.floor(foodDays(t)):null,days=Math.max(1,2+wallOf(t)-(lead.sd||0));
      return 'The siege of '+t.name+': '+ls.map(intelLord).join(' and ')+', '+intelMen(men)+' outside; inside, a garrison of '+t.gar+(inn.length?' and '+inn.map(l=>l.name+'’s '+intelMen(l.troops.length)).join(' and '):'')+
        (food==null?'':food<1?', and no food left':', and food for '+food+(food===1?' day':' days'))+'. The assault comes in '+days+(days===1?' day':' days')+'.'}},
  hideout:{of:()=>W.sites.filter(s=>s.type==='hideout'&&!s.cleared&&!s.seen),key:s=>s.i,name:s=>'A '+s.name.toLowerCase(),sub:()=>'Its place, on your map',
    say:s=>'A '+s.name.toLowerCase()+' lies '+intelSpot(s)+(s.ld&&s.ld.name?', '+s.ld.name+' its chieftain':'')+'. It is on your map now.',learn:s=>{s.seen=true}},
  march:{of:()=>W.lords.filter(l=>!l.dead&&!l.gone&&!l.inside&&(l.state==='march'||l.state==='relieve')&&townBy(l.tgt)),key:l=>l.id,name:()=>'An army on the march',sub:l=>intelLord(l),
    say:l=>{const t=townBy(l.tgt),d=Router.days(l,t,lordSpeed(l)),n=Math.round(d);return intelLord(l)+' marches on '+t.name+' with '+intelMen(l.troops.length)+' (power '+l.power()+'): '+intelSpot(l)+', '+(!isFinite(d)?'his road unknown':d<1?'there within a day':'about '+n+(n===1?' day':' days')+' away')+'.'}},
  lord:{of:()=>W.lords.filter(l=>!l.dead&&!l.gone&&(l.inside||l.state!=='march'&&l.state!=='relieve')),key:l=>l.id,at:l=>l.inside&&townBy(l.inside)||l,name:l=>l.name+'’s army',sub:l=>'Of the '+facN(l.fac)+': where it is, how strong',
    say:l=>intelLord(l)+' has '+intelMen(l.troops.length)+' (power '+l.power()+'), '+(l.inside?'holding court in '+l.inside:l.state==='siege'?'besieging '+l.tgt:l.state==='home'?'riding home to '+l.tgt+', '+intelSpot(l):'riding '+intelSpot(l))+'.'},
  caravan:{of:()=>W.caravans.filter(c=>!c.mine&&!c.gone&&c.from&&c.to),key:c=>W.caravans.indexOf(c),name:c=>'A caravan out of '+c.from,sub:()=>'Its road and guard',
    say:c=>'A caravan of the '+facN(c.fac)+' out of '+c.from+', bound for '+c.to+': '+c.guards+' guards, carrying '+cargoText(c)+(c.purse?' and '+c.purse+' gold':'')+'; now '+intelSpot(c)+'.'}
};
// (the keys you bought today, anywhere)
const intelKnown=()=>new Set(Object.values(W.news&&W.news.told||{}).filter(x=>x.day===G.day&&x.intel).flatMap(x=>x.intel.map(i=>i.key)));
// what a source knows (src: at, its places; r, its reach): offers {key, k, o, at, v (its value), name, sub}
function intelGather(src){const out=[],known=intelKnown(),d=p=>Math.min(...src.at.map(q=>Math.hypot(q.x-p.x,q.y-p.y)));
  for(const [k,K] of Object.entries(INTEL_KINDS))for(const o of K.of()){const at=K.at?K.at(o):o,key=k+':'+K.key(o);if(at&&d(at)<=src.r&&!known.has(key))out.push({key,k,o,at,v:INTEL.v[k],name:K.name(o),sub:K.sub(o)})}
  return out.sort((a,b)=>b.v-a.v||d(a.at)-d(b.at)).slice(0,INTEL.list)}
// one learnt: what it changes, its words in your log (the Chronicle's Show on map: its mark), its gold "?" on its spot; {key, t}
function intelLearn(o,from){const K=INTEL_KINDS[o.k],t=K.say(o.o),N=newsW(),id='i'+o.key;if(K.learn)K.learn(o.o);
  N.marks=N.marks.filter(m=>m.id!==id);N.marks.push({id,x:Math.round(o.at.x),y:Math.round(o.at.y),day:G.day,t,i:1});
  log('Information ('+from+'): '+t,undefined,'rumour','n'+id);return {key:o.key,t}}

/* ---- the tavern's Buy information (ui/town.js Tavern): what its innkeeper knows of the land within INTEL.r, up to INTEL.n
   things, once a day ---- */
const intelSrc=t=>({kind:'tavern',at:[t],r:INTEL.r,from:'the innkeeper of '+t.name});
const intelPrice=(o,t)=>Math.round(o.v*(1+INTEL.tier*Math.max(0,(t.T&&t.T.tier||2)-2)));
const intelBought=t=>{const x=W.news&&W.news.told['intel:'+t.name];return x&&x.day===G.day?x:null};
// (why you cannot buy here now: '' when you can)
function intelWhy(t,offers){offers=offers||intelGather(intelSrc(t));
  return intelBought(t)?'You bought information here today':!offers.length?'They know nothing worth the gold':P.gold<Math.min(...offers.map(o=>intelPrice(o,t)))?'Not enough gold':''}
// buy the offers keyed keys: at most INTEL.n, each still offered, the gold for all; '' when bought, else why not
function intelBuy(t,keys){if(intelBought(t))return 'You bought information here today';const pick=intelGather(intelSrc(t)).filter(o=>keys.includes(o.key));
  if(!pick.length)return 'Choose something first';if(pick.length>INTEL.n)return 'At most '+INTEL.n+' at a time';
  const p=pick.reduce((a,o)=>a+intelPrice(o,t),0);if(P.gold<p)return 'Not enough gold';
  P.gold-=p;log('You pay the innkeeper of '+t.name+' '+p+' gold for what he knows.','gold');
  newsW().told['intel:'+t.name]={day:G.day,ids:[],intel:pick.map(o=>intelLearn(o,'the innkeeper of '+t.name))};return ''}
// the picker: each offer and its price, none chosen (or sel), a note (why the last try failed)
function intelPicker(t,note,sel){const offers=intelGather(intelSrc(t));
  railPicker({title:'Buy information',sub:'The innkeeper of '+t.name,total:'You pay',unit:'g',sel:sel||{},confirm:['intel-buy','Buy'],back:['tab','tavern','Back'],note:note||'Choose up to '+INTEL.n+'.',
    items:offers.map(o=>({id:o.key,name:o.name,sub:o.sub+' · '+intelPrice(o,t)+'g',max:1,unit:intelPrice(o,t)}))})}
// (under the tavern's Rumours: what you bought today, or the offer)
function intelHtml(t){const b=intelBought(t);
  if(b)return '<div class="lab">Information bought</div>'+b.intel.map(x=>'<p class="rum-new"><span class="rum-q">?</span> '+x.t+'</p>').join('')+'<p class="muted">You bought what the innkeeper knows today; come back tomorrow.</p>';
  return railRow('Buy information','The innkeeper knows who rides where, and how many: up to '+INTEL.n+' things of the land around, true and current, once a day.',railBtn('intel-pick',null,'Choose',intelWhy(t)))}
