'use strict';
/* ---------- news and rumours: talk that points at real things (the owner, 2026-10-19). W.news keeps what really happened on
   the map, as it happens (items: {id, k (its kind: NEWS_KINDS), x, y, day, near (the nearest holding's name), detail}): it
   listens to the world's events on the bus (core/bus.js: emitted in fights.js, realms.js, brains.js, siege.js, estates.js,
   caravans.js, defence.js, story/happening.js; NEWS_HEARS below) and records each (newsRecord), as the world's log does (worldlog.js
   worldEvent: a world event you neither took part in, nor saw, nor hear of by your realm's rider is news only). Recording draws no random
   number and changes nothing else, so the world runs as it did; the words are picked
   when you hear it, from the item's id. Kept bounded: NEWS.keep items, each NEWS.days days, and the same kind near the same
   holding within NEWS.merge days is one item, brought up to date.
   You hear it from the people you meet, every one through the same service (rumourFrom), each its own daily cap keyed by who
   tells it (RUMOUR_SOURCES): the taverns, the estate workers, the watch captains, the caravan masters, the lords, the road's
   talkers (the peddler, the bard, the pilgrims, the refugees, the messenger), the travellers' camp and the ruin hermit. They tell
   news near them (or their realm's, a lord), recent, newest and weightiest first (each source leaning to the kinds it would
   know), never what you have heard already. What you hear goes into the log and puts a faint "?" on the map near the event
   (a little off its true spot, by its id), the rumour as its tooltip, fading after NEWS.markDays (drawRumourMarks; the minimap).
   W.news also keeps what you have heard (heard: id → the day), today's counts (told: source key → {day, ids}) and the marks;
   saved once there is any (as W.road: a save before it has none).
   Three classes of news (the owner, 2026-10-23: news spreads as it did in medieval times):
   1. proclamations, free (PROCLAIM.kinds: war, peace, alliances, a realm fallen, a holding taken): a wave from where it happened
      (an item keeps its origin, x, y, and its hour, h; proclaimReached(it, p) is a formula, no day-by-day walk): a day per
      PROCLAIM.tiles tiles between the holdings (the roads), PROCLAIM.wild off them, a village a little later (lag). Once it has
      reached a holding, you hear it there for free (the crier: entering it, or each hour you are at or in it, proclaimAt), or from
      anyone you meet whose place it has reached (rumourFrom: travellers, caravans, the watch, lords), never against a cap; then
      it is heard (your realm's riders still bring their own: worldlog.js);
   2. common talk, free, capped (everything else): the rumours above, vaguer the farther and older (NEWS_VAGUE: the level as
      heard, kept in v: id → level; rougher places, swollen numbers);
   3. intelligence, paid (worldlog.js INTEL: a lord's army, armies on the march, a siege's true state, a hideout, a caravan):
      precise and current, bought at a tavern, never news ---------- */
// keep, days: how many and how long; merge: days within which the same kind by the same holding is one; radius: a tavern's ears
// (px); markDays: how long a "?" stays; off: how far it may lie from the true spot (px); at: nearer than this to a holding or
// estate, it is "near" it, else to one side of it (px); band: the strength (rating) a band must have to be talked of; age: how
// much a day's age weighs against a kind's weight (w) when choosing; prefer: the weight a source's own kinds gain
const NEWS={keep:60,days:6,merge:1,radius:360,markDays:3,off:28,at:70,band:65,age:1.5,prefer:4};
// proclamations: on (false: every kind a rumour, as before); kinds; tiles: the wave's tiles a day from where it happened to a
// holding (the roads join them); wild: its tiles a day over the land (to anywhere off the holdings, from the nearest holding the
// wave has, or straight from where it happened, the sooner); lag: the days more a holding of that kind waits (no crier of its
// own); days: how long one is kept (NEWS.keep counts only the rest)
const PROCLAIM={on:true,kinds:['war','peace','ally','realm','fell'],tiles:60,wild:15,lag:{village:1.5,castle:.5},days:20};
// common talk's vagueness: on; a level (0 to max) as heard, a level for every tiles tiles from you and every days days of its
// age; inflate: how much a level swells its numbers (× 1 + inflate × level)
const NEWS_VAGUE={on:true,tiles:40,days:2,max:3,inflate:.5};
const newsW=()=>W.news||(W.news={items:[],n:0,heard:{},told:{},marks:[]});
const facN=f=>FACS[f]?FACS[f].n:'a realm';
// (a beast's name in a sentence: "A wolf pack" has, "Dire boars" have)
const beastN=d=>{const n=MONSTERS[d.id]?MONSTERS[d.id].n:'Beasts',pl=/s$/.test(n);return [pl?n:cap1(an(n.toLowerCase())),pl]};
// (how many, in words, swollen by the talk's vagueness v)
const NEWS_MANY=[[9,'half a dozen'],[16,'a dozen'],[26,'a score'],[70,'scores'],[Infinity,'hundreds']];
const newsMany=(n,v)=>{const m=n*(1+NEWS_VAGUE.inflate*(v||0));return NEWS_MANY.find(x=>m<x[0])[1]};
/* the kinds: w (how much it matters), say (its sentences, picked by the item's id; each (detail, s): s.where (place-based,
   rough), s.when, s.road (on the road …)), same(item, detail, x, y) (one that moves: the same one seen again, though by another
   holding now, or days on: one item, moved), apart (only same makes two one, never the holding and the day), wide (a realm's
   affairs: every source that hears the realms' talk knows it, RUMOUR_SOURCES wide, wherever it happened) */
// (two realms in a sentence: "the Vale and the Karn")
const facPair=d=>'the '+facN(d.a)+' and the '+facN(d.b);
const samePair=(it,d)=>it.detail.a===d.a&&it.detail.b===d.b;
// (who took a holding: a realm, or your band by name (by), for a realm or its own (fac 'player'))
const fellBy=d=>!d.by?'the '+facN(d.fac):d.fac&&d.fac!=='player'?d.by+' in the name of the '+facN(d.fac):d.by;
const NEWS_KINDS={
  // (a wandering trainer where he teaches now, and where next: world/trainers.js; heard anywhere)
  trainer:{w:6,wide:true,apart:true,same:(it,d)=>it.detail.id===d.id,say:[d=>'A '+d.lv.toLowerCase()+' of '+d.roles.toLowerCase()+', '+d.name+', is teaching at '+d.town+'; '+d.town+' will not keep him long: he goes on to '+d.next+'.',
    d=>'They say '+d.name+', a '+d.lv.toLowerCase()+' of '+d.roles.toLowerCase()+', drills soldiers at '+d.town+' these days, and '+d.next+' after.']},
  fell:{w:10,say:[(d,s)=>d.town+' has fallen to '+fellBy(d)+(d.sacked?', and was sacked':'')+', '+s.when+'.',
    (d,s)=>'They say '+fellBy(d)+' took '+d.town+' '+s.when+(d.sacked?' and put it to the torch':'')+'.']},
  siege:{w:9,say:[d=>'The '+facN(d.fac)+'’s men are besieging '+d.town+'.',(d,s)=>d.lord+' of the '+facN(d.fac)+' laid siege to '+d.town+' '+s.when+'.']},
  relieved:{w:8,say:[(d,s)=>'The siege of '+d.town+' is broken: '+d.lord+' fell back '+s.when+'.',(d,s)=>d.town+' held. '+d.lord+'’s men were driven off '+s.when+'.']},
  raid:{w:7,say:[(d,s)=>d.town+' was raided '+s.when+(d.estate&&ESTATES[d.estate]?'; its '+ESTATES[d.estate].n.toLowerCase()+' burnt':'')+'.',(d,s)=>'Smoke over '+d.town+' '+s.when+': raiders took what they could carry.']},
  lord:{w:7,say:[(d,s)=>d.lord+' of the '+facN(d.fac)+' was beaten '+s.where+', '+s.when+'.',(d,s)=>'Word is '+d.lord+'’s army was routed '+s.where+'.']},
  caravan:{w:6,say:[(d,s)=>'A caravan'+(d.from?' out of '+d.from:'')+' was '+(d.lord?'seized by '+d.lord+'’s men':d.band?'plundered by bandits':'robbed')+' '+s.road+', '+s.when+'.',
    (d,s)=>'Merchants are wary: a caravan was '+(d.band?'burnt':'taken')+' '+s.road+' '+s.when+'.']},
  beast:{w:5,same:(it,d,x,y)=>it.detail.id===d.id&&Math.hypot(it.x-x,it.y-y)<NEWS.radius,say:[(d,s)=>{const [n,pl]=beastN(d);return n+(pl?' have':' has')+' been seen '+s.where+'.'},(d,s)=>{const [n,pl]=beastN(d);return 'Keep off the fields '+s.where+': '+n.toLowerCase()+(pl?' prowl':' prowls')+' there.'}]},
  band:{w:5,same:(it,d)=>!!d.chief&&it.detail.chief===d.chief,say:[(d,s)=>d.grew?(d.chief?d.chief+'’s band':'A band of cutthroats')+' grows bolder '+s.where+', fat on plunder.':'A big band of '+(d.label||'bandits').toLowerCase()+', '+newsMany(d.n||0,s.v)+' strong, was seen '+s.where+'.',
    (d,s)=>'Travellers keep off the road '+s.where+': '+(d.chief?d.chief+'’s':'a big')+' band is out.']},
  fight:{w:4,say:[(d,s)=>'There was a battle '+s.where+' '+s.when+': '+d.win+' won.',(d,s)=>cap1(d.win)+' beat '+d.lose+' '+s.where+', '+s.when+'.']},
  // (the realms' affairs, worldlog.js: a war, a peace (an alliance ended: ended), an alliance, a realm fallen; a lord's new army;
  // a garrison starving under siege)
  war:{w:9,wide:true,apart:true,same:samePair,say:[(d,s)=>'War! '+cap1(facPair(d))+' went to war '+s.when+'.',(d,s)=>'Word is '+facPair(d)+' are at war: it began '+s.when+'.']},
  peace:{w:7,wide:true,apart:true,same:samePair,say:[(d,s)=>d.ended?'The alliance between '+facPair(d)+' ended '+s.when+'.':cap1(facPair(d))+' made peace '+s.when+'.',
    (d,s)=>d.ended?'They say '+facPair(d)+' no longer ride together: their alliance ended '+s.when+'.':'They say the war between '+facPair(d)+' is over: a truce, '+s.when+'.']},
  ally:{w:7,wide:true,apart:true,same:samePair,say:[(d,s)=>cap1(facPair(d))+' swore an alliance '+s.when+'.',(d,s)=>'They say '+facPair(d)+' ride together now: an alliance, made '+s.when+'.']},
  realm:{w:10,wide:true,apart:true,same:(it,d)=>it.detail.fac===d.fac,say:[(d,s)=>'The '+facN(d.fac)+' is no more: its last holding, '+d.town+', fell '+s.when+'.',
    (d,s)=>'They say the banners of the '+facN(d.fac)+' are gone from the land since '+d.town+' fell '+s.when+'.']},
  army:{w:6,apart:true,same:(it,d)=>it.detail.lord===d.lord,say:[(d,s)=>d.lord+' of the '+facN(d.fac)+' raised a new army at '+d.town+' '+s.when+'.',
    (d,s)=>'They say '+d.lord+' is back in the field: '+newsMany(d.n||0,s.v)+' men, raised at '+d.town+' '+s.when+'.']},
  starving:{w:7,say:[(d,s)=>'The garrison of '+d.town+' is starving under siege: its stores ran dry '+s.when+'.',(d,s)=>'They say '+d.town+' ate its last grain '+s.when+': its defenders starve behind the walls.']},
  // (a realm's new walls, world/buildings.js; people leaving a holding, world/refugees.js)
  walls:{w:3,say:[d=>'The '+facN(d.fac)+' is raising '+d.wall+' around '+d.town+'.',(d,s)=>'Masons are busy at '+d.town+': the '+facN(d.fac)+' began '+d.wall+' there '+s.when+'.']},
  exodus:{w:4,say:[d=>'Folk are leaving '+d.town+' for '+d.to+': '+(REFUGEE_WHY[d.why]||'hard times')+'.',(d,s)=>'They say '+newsMany(d.n||0,s.v)+' people left '+d.town+' for '+d.to+' '+s.when+'.']},
  // (the road's small encounters, world/encounters.js: a campfire's tracks read, where they lead; a false toll-man handed in)
  tracks:{w:2,say:[(d,s)=>'Tracks of '+(d.who||'strangers')+' lead off '+s.where+'.',(d,s)=>'Someone saw '+(d.who||'strangers')+' '+s.where+', '+s.when+'.']},
  toll:{w:3,say:[(d,s)=>'Men in the '+facN(d.fac)+'’s colours were taking a false toll '+s.road+'. Their ringleader hangs in '+(d.town||'the town')+'.',
    (d,s)=>'Beware “the lord’s men” at a barrier '+s.road+': false toll-men, they say, though one was caught '+s.when+'.']},
  trace:{w:3,say:[(d,s)=>({body:'A traveller was found dead by the road '+s.where+', '+s.when+'.',wreck:'A burnt wagon lies '+s.road+'. Raiders, they say.',cart:'Someone left a cart stuck in the mud '+s.road+', '+s.when+'.'})[d.t]||'Something bad happened '+s.road+'.']},
  // (Ander The Fallen wandering the taverns, story/wounded.js Wanderer: far, every tavern but his tells it)
  ander:{w:8,far:true,say:[(d,s)=>'A scarred sellsword in a dark cloak, Ander they call him, came to drink in the tavern of '+d.town+' '+s.when+'. He did not look like a man who wanted company.',
    (d,s)=>'They say Ander the Fallen is in '+d.town+', sitting alone in its tavern with his back to the wall. He came '+s.when+'.']}
};

/* ---- recording ---- */
// the holding an event is told by: the nearest standing one
const newsNear=at=>Spatial.nearestHolding(at.x,at.y,t=>!t.gone);
// an event: k (NEWS_KINDS), at (where: {x, y}), detail (its own facts: names, never objects). The same kind by the same holding
// within NEWS.merge days, or the same one that moves seen again (its kind's same: a beast, a chieftain's band, while the
// news of it lasts), is brought up to date instead (place, holding, day, facts), keeping its id (heard stays heard); a kind kept
// apart only by its same. A proclamation keeps its hour (h), its wave starting there; one brought up to date starts again, unheard.
// Returns it
function newsRecord(k,at,detail){
  const K=NEWS_KINDS[k];if(!K||!at||!isFinite(at.x)||!isFinite(at.y))return null;const t=newsNear(at);if(!t)return null;
  const N=newsW(),x=Math.round(at.x),y=Math.round(at.y),old=N.items.find(it=>it.k===k&&(!K.apart&&Clock.daysSince(it.day)<=NEWS.merge&&it.near===t.name||K.same&&K.same(it,detail,x,y)));
  if(old){Object.assign(old,{x,y,near:t.name,day:G.day,detail:{...old.detail,...detail}});if(newsProc(old)){old.h=Math.floor(Clock.hours());delete N.heard[old.id]}return old}
  const it={id:++N.n,k,x,y,day:G.day,near:t.name,detail:{...detail}};if(newsProc(it))it.h=Math.floor(Clock.hours());N.items.push(it);newsTrim();return it;
}
// (a proclamation, with proclamations on; how long an item is kept)
const newsProc=it=>PROCLAIM.on&&PROCLAIM.kinds.includes(it.k);
const newsLife=it=>newsProc(it)?PROCLAIM.days:NEWS.days;
// (gone: news older than its life, the oldest common talk past NEWS.keep, heard ids and levels of news gone, yesterday's counts,
// faded marks)
function newsTrim(){const N=newsW();N.items=N.items.filter(it=>Clock.daysSince(it.day)<newsLife(it));
  let over=N.items.filter(it=>!newsProc(it)).length-NEWS.keep;if(over>0)N.items=N.items.filter(it=>newsProc(it)||over--<=0);
  const ids=new Set(N.items.map(it=>it.id));for(const id in N.heard)if(!ids.has(+id))delete N.heard[id];
  if(N.v){for(const id in N.v)if(!ids.has(+id))delete N.v[id];if(!Object.keys(N.v).length)delete N.v}
  for(const k in N.told)if(N.told[k].day!==G.day)delete N.told[k];N.marks=N.marks.filter(m=>Clock.daysSince(m.day)<NEWS.markDays)}

/* ---- proclamations: the wave ---- */
// the days one takes from where it happened to p: to a holding by the roads (its kind's lag more), to anywhere else by the
// holding nearest it and on over the land; or straight over the land, if that is sooner
function proclaimDays(it,p){const L=PROCLAIM,d=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE,o={x:it.x,y:it.y},land=d(o,p)/L.wild;
  const h=p instanceof Holding?p:newsNear(p);if(!h)return land;return Math.min(land,d(o,h)/L.tiles+(L.lag[h.kind]||0)+(h===p?0:d(h,p)/L.wild))}
// has it reached p (a holding, or any place) by now
const proclaimReached=(it,p)=>Clock.hours()-(it.h||0)>=proclaimDays(it,p)*24;
// its words: its first sentence, saying exactly when
function proclaimText(it){const s={where:newsWhere(it,false),road:newsWhere(it,true),when:wlWhen(it.day),v:0};return NEWS_KINDS[it.k].say[0](it.detail||{},s)}
// heard free: each proclamation not heard yet that has reached any of ps (a holding, or a source's places), into your log, told by
// from; those heard
function proclaimHear(ps,from){const N=W.news;if(!N||!PROCLAIM.on)return [];const got=N.items.filter(it=>newsProc(it)&&N.heard[it.id]==null&&ps.some(p=>proclaimReached(it,p)));
  for(const it of got){N.heard[it.id]=G.day;const text=proclaimText(it);KNOWLEDGE.news(it,text);log('Proclamation ('+from+'): '+text,undefined,'war')}return got}
// the crier of a holding you are at or in (town.js enterTown; each hour: worldlog.js)
const proclaimAt=t=>t?proclaimHear([t],'the crier of '+t.name):[];
// (the holding you are in, staying at, or at the gates of on the map; none: null)
function proclaimWhere(){if(G.town&&G.town.ref)return G.town.ref;if(P.stay)return townBy(P.stay.town)||null;
  const h=Spatial.nearestHolding(P.x,P.y,t=>!t.gone);return h&&Math.hypot(h.x-P.x,h.y-P.y)<NEWS.at?h:null}
// who fought, in a sentence: a lord or your companion by name, the watch, a band by its chieftain, a beast, a caravan
function newsWho(o){const k=o.mapKind,n=o.label();if(k==='patrol')return 'the '+n[0].toLowerCase()+n.slice(1);if(k==='band')return o.ld?o.ld.name+'’s band':'a band of '+n.toLowerCase();
  if(k==='monster'){const [b,pl]=beastN(o);return pl?b.toLowerCase():b[0].toLowerCase()+b.slice(1)}return k==='caravan'?'a caravan of '+o.from:n}
// a battle on the map ended (fights.js endFight): who won near where, and a band that won grows bolder
function newsFight(f,won,lost){
  if(!won.length||!lost.length)return;const names=ps=>ps.map(newsWho).join(' and ');
  newsRecord('fight',f,{win:names(won),lose:names(lost)});
  for(const b of won)if(b.mapKind==='band')newsRecord('band',b,{grew:1,chief:b.ld?b.ld.name:'',label:b.label(),n:b.troops.length});
}
// a threat on a holding's land (defence.js landDefence): a beast, or a band strong enough to talk of (its strength worked out
// here, its own cache left as it was)
function newsThreat(o){
  if(o.mapKind==='monster')return newsRecord('beast',o,{id:o.id,n:o.n});
  if(o.mapKind==='band'&&rating(o.troops,chiefLv(o))>=NEWS.band)newsRecord('band',o,{chief:o.ld?o.ld.name:'',label:o.label(),n:o.troops.length});
}
/* what it hears: each world event (core/bus.js) recorded as its kind, with its facts (names, never objects), at the moment it
   happens (the bus calls at once, in order) */
const NEWS_HEARS={
  'siege:laid':d=>newsRecord('siege',d.town,{town:d.town.name,lord:d.lord.name,fac:d.lord.fac}),
  'siege:broken':d=>newsRecord('relieved',d.town,{town:d.town.name,lord:d.lord.name,fac:d.lord.fac}),
  'holding:taken':d=>newsRecord('fell',d.town,{town:d.town.name,fac:d.lord.fac,lord:d.lord.name,sacked:d.sacked?1:0}),
  'holding:raided':d=>newsRecord('raid',d.town,{town:d.town.name}),
  // (by the burnt estate, if it still stands on the map)
  'estate:burnt':d=>newsRecord('raid',bldSpots(d.town)[d.estate]||d.town,{town:d.town.name,estate:d.estate}),
  'lord:routed':d=>newsRecord('lord',d.lord,{lord:d.lord.name,fac:d.lord.fac}),
  'caravan:robbed':d=>newsRecord('caravan',d.caravan,{from:d.caravan.from}),
  'caravan:beaten':d=>newsRecord('caravan',d.caravan,{from:d.caravan.from,lord:d.lord?d.lord.name:'',band:d.band?1:0}),
  'fight:ended':d=>newsFight(d.fight,d.won,d.lost),
  'trace:left':d=>newsRecord('trace',d.e,{t:d.trace}),
  'land:threat':d=>newsThreat(d.foe),
};
for(const [type,fn] of Object.entries(NEWS_HEARS))worldOn(type,fn);

/* ---- the words (when you hear it) ---- */
// when, roughly (v: its vagueness: at 2, anything past yesterday is "some days back")
const newsWhen=(it,v)=>{const a=Clock.daysSince(it.day);return a<=0?'today':a===1?'yesterday':a<=3&&(v||0)<2?['two','three'][a-2]+' days back':'some days back'};
// where, roughly: by an estate of its holding, by the holding, or to one side of it ("east of Millbrook"); vaguer (v): 1 never by
// an estate, 2 "somewhere about Millbrook", 3 only its realm's lands
function newsWhere(it,road,v){const t=townBy(it.near);if(!t)return road?'on the road':'in the wilds';const d=Math.hypot(it.x-t.x,it.y-t.y);v=v||0;
  if(v>=3)return t.owner&&FACS[t.owner]?(road?'on some road ':'somewhere ')+'in the lands of the '+facN(t.owner):road?'on some road in the wilds':'somewhere off in the wilds';
  if(v>=2)return (road?'on a road ':'')+'somewhere about '+t.name;
  if(!road&&!v){let e=null,ed=NEWS.at;for(const [k,p] of Object.entries(bldSpots(t)))if(bldLv(t,k)>0){const q=Math.hypot(it.x-p.x,it.y-p.y);if(q<ed){ed=q;e=k}}
    if(e&&ed<d)return 'near '+t.name+'’s '+ESTATES[e].n.toLowerCase()}
  return (road?'on the road ':'')+(d<NEWS.at?'near ':compass(it.x-t.x,it.y-t.y)+' of ')+t.name}
// how vague common talk is as you hear it now: a level for every NEWS_VAGUE.tiles tiles from you, and every NEWS_VAGUE.days days
// of its age (0 to max; off: 0)
function newsVague(it){const V=NEWS_VAGUE;if(!V.on)return 0;return Math.min(V.max,Math.floor(Math.hypot(it.x-P.x,it.y-P.y)/(V.tiles*TILE)+Clock.daysSince(it.day)/V.days))}
// the rumour itself, its sentence picked by its id, as vague as when you heard it (v: else the level kept; none 0)
function rumourText(it,v){const K=NEWS_KINDS[it.k];if(!K)return '';if(v==null)v=W.news&&W.news.v&&W.news.v[it.id]||0;
  const s={where:newsWhere(it,false,v),road:newsWhere(it,true,v),when:newsWhen(it,v),v};
  return K.say[it.id%K.say.length](it.detail||{},s)}

/* ---- hearing: the sources and the service ---- */
/* who tells it: cap (new rumours a day, per source: its key), r (how near, px: to its place, or any of its places), land (news
   on its holding's land instead), realm (news of a lord's realm, its lands and wars), wide (it hears the realms' affairs, the
   wide kinds, from anywhere), prefer (the kinds it leans to), from (the log's word), quiet (its page logs what is said: the road's
   talkers, the sites) */
const RUMOUR_SOURCES={
  tavern:{cap:2,r:NEWS.radius,wide:true,from:'tavern talk'},
  estate:{cap:1,r:220,prefer:['beast','band','trace','raid'],from:'a worker'},
  watch:{cap:1,land:true,r:160,prefer:['band','beast','trace','raid','caravan'],from:'the watch'},
  caravan:{cap:1,r:240,wide:true,prefer:['caravan','trace','band','beast'],from:'a caravan master'},
  lord:{cap:1,realm:true,wide:true,prefer:['siege','fell','relieved','lord','fight','army','starving'],from:'a lord'},
  road:{cap:1,r:320,wide:true,quiet:true,from:'the road'},
  refugees:{cap:1,r:320,prefer:['raid','siege','fell','exodus'],quiet:true,from:'refugees'},
  camp:{cap:1,r:420,wide:true,quiet:true,from:'the travellers'},
  hermit:{cap:1,r:420,prefer:['beast','trace','band'],quiet:true,from:'the hermit'}
};
// a source: its kind's rules, its key (one cap each), where it is (a place, or several: a caravan's road), and any of its own
const rumourSource=(kind,key,at,o)=>({kind,key:kind+':'+key,at:[].concat(at).filter(Boolean),...RUMOUR_SOURCES[kind],...o});
const newsById=id=>newsW().items.find(it=>it.id===id)||null;
// is it news this source would know: a realm's affairs (it hears them), on its land, of its realm, or near it
function newsKnows(src,it){
  if(NEWS_KINDS[it.k].wide&&src.wide)return true;
  if(NEWS_KINDS[it.k].far)return src.kind==='tavern'&&!src.at.some(p=>p.name===(it.detail||{}).town);
  if(src.realm){const d=it.detail||{},own=n=>{const t=n&&townBy(n);return !!t&&t.owner===src.fac};return d.fac===src.fac||own(it.near)||own(d.town)}
  if(src.land&&src.at[0]&&landHold(it.x,it.y)===src.at[0])return true;
  return src.at.some(p=>Math.hypot(p.x-it.x,p.y-it.y)<=src.r)}
// what it could tell you new now: recent common talk (never a proclamation: those are free), known to it, not heard; weightiest
// and newest first, its own kinds first
function rumourCands(src){const N=newsW(),score=it=>NEWS_KINDS[it.k].w+(src.prefer&&src.prefer.includes(it.k)?NEWS.prefer:0)-NEWS.age*Clock.daysSince(it.day);
  return N.items.filter(it=>N.heard[it.id]==null&&!newsProc(it)&&Clock.daysSince(it.day)<NEWS.days&&newsKnows(src,it)).sort((a,b)=>score(b)-score(a)||b.id-a.id)}
// heard: kept as heard (no source tells it as new again) with how vague it was (v, when vague at all), its "?" on the map near it,
// and the log (its ref: the Chronicle's Show on map)
function rumourHear(it,src){const N=newsW(),v=newsVague(it),t=rumourText(it,v),j=k=>(hash(it.id,k,7919)-.5)*2*NEWS.off;N.heard[it.id]=G.day;KNOWLEDGE.news(it,t);
  if(v)(N.v||(N.v={}))[it.id]=v;else if(N.v)delete N.v[it.id];
  N.marks=N.marks.filter(m=>m.id!==it.id);N.marks.push({id:it.id,x:Math.round(it.x+j(1)),y:Math.round(it.y+j(2)),day:G.day,t});
  if(!src.quiet)log('Rumour ('+src.from+'): '+t,undefined,'rumour','n'+it.id)}
/* the service: what a source tells you now. First, free and past its cap, the proclamations that have reached its places
   (proclaimHear: proc); then up to its cap of new rumours today (each heard: rumourHear), never again that day; fresh (told
   just now), today (all it told you today, fresh ones too: a page that asks again shows the same), before (rumours you heard
   already of news it knows, not today's from it), capped (its cap is spent) */
function rumourFrom(src){if(src.kind==='tavern')Wanderer.news();newsTrim();const proc=proclaimHear(src.at,src.from),N=newsW(),day=G.day,told=N.told[src.key]||(N.told[src.key]={day,ids:[]}),fresh=[];
  for(const it of rumourCands(src)){if(told.ids.length>=src.cap)break;rumourHear(it,src);told.ids.push(it.id);fresh.push(it);if(it.k==='trainer')trainerHeard(it.detail)}
  const today=told.ids.map(newsById).filter(Boolean);
  return {proc,fresh,today,before:N.items.filter(it=>N.heard[it.id]!=null&&!newsProc(it)&&!today.includes(it)&&newsKnows(src,it)).sort((a,b)=>b.day-a.day||b.id-a.id),capped:told.ids.length>=src.cap}}
// (one line a talker says today, or none: what a worker, a captain, a caravan master or a lord says beside his own words; a
// proclamation he brings first)
const rumourSay=src=>{const r=rumourFrom(src),it=r.today[0];return r.proc.length?proclaimText(r.proc[0]):it?rumourText(it):''};
// the tavern's Rumours: what you heard on coming in (fresh: new), else that there is nothing new today; then what you heard
// before (today's here too, once they are not fresh)
function rumourHtml(r){
  const line=(it,cls)=>'<p class="'+cls+'"><span class="rum-q">?</span> '+rumourText(it)+'</p>',old=[...r.today.filter(it=>!r.fresh.includes(it)),...r.before];
  return (r.fresh.length?r.fresh.map(it=>line(it,'rum-new')).join(''):'<p class="muted">'+(r.capped?'Nothing new today; come back tomorrow.':'No fresh news of late.')+'</p>')+
    (old.length?'<div class="lab">Heard before</div>'+old.slice(0,6).map(it=>line(it,'muted')).join(''):'')}

/* ---- the marks on the map: a faint "?" by each rumour you heard (over the labels: render.js), fading over its last day; gold on
   its very spot for intelligence you bought (i: worldlog.js intelLearn) ---- */
const rumourMarks=()=>newsW().marks.filter(m=>Clock.daysSince(m.day)<NEWS.markDays);
const rumourFade=m=>clamp(m.day+NEWS.markDays-G.day-Clock.frac,0,1);
const RUMOUR_COL='#cdb8ff';
function drawRumourMarks(cam){const r=wuiArrow('ask',RUMOUR_COL),g=wuiArrow('ask',INTEL.col);for(const m of rumourMarks()){const a=rumourFade(m),sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),c=m.i?g:r;
  if(a<=0||sx<-10||sy<-10||sx>VW+10||sy>VH+16)continue;ctx.save();ctx.globalAlpha=.8*a;wuiPut(c,sx,sy-2,c.cx,c.tip);ctx.restore()}}
// (the tooltip over one, where nothing else is under the pointer: input.js)
function rumourTip(wx,wy){const m=rumourMarks().filter(m=>rumourFade(m)>0&&Math.abs(m.x-wx)<=6&&wy>=m.y-16&&wy<=m.y-2)[0];
  return m?'<b>'+(m.i?'Information':'A rumour')+'</b><small>'+m.t+'</small><small class="muted">'+(m.i?'Bought':'Heard')+' on day '+m.day+'</small>':''}

/* ---- the save: W.news once there is any (none: as every save before it; the save registry, core/saves.js), with the riders on
   their way (post: worldlog.js, there once one has set out) ---- */
Saves.add({key:'news',order:240,defaults:{items:[],n:0,heard:{},told:{},marks:[]},
  save:()=>{const N=W.news;return N&&(N.items.length||N.marks.length||Object.keys(N.heard).length||Object.keys(N.told).length||N.post&&N.post.length)?N:undefined},load:n=>{W.news=n}});
const newsLoad=n=>Saves.loadOf('news',n);
