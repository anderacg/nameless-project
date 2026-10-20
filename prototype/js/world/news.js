'use strict';
/* ---------- news and rumours: talk that points at real things (the owner, 2026-10-19). W.news keeps what really happened on
   the map, as it happens (items: {id, k (its kind: NEWS_KINDS), x, y, day, near (the nearest holding's name), detail}): the
   hooks where it happens call newsRecord (fights.js, realms.js, brains.js, siege.js, estates.js, caravans.js, defence.js,
   encounters.js). Recording draws no random number and changes nothing else, so the world runs as it did; the words are picked
   when you hear it, from the item's id. Kept bounded: NEWS.keep items, each NEWS.days days, and the same kind near the same
   holding within NEWS.merge days is one item, brought up to date.
   You hear it from the people you meet, every one through the same service (rumourFrom), each its own daily cap keyed by who
   tells it (RUMOUR_SOURCES): the taverns, the estate workers, the watch captains, the caravan masters, the lords, the road's
   talkers (the peddler, the bard, the pilgrims, the refugees, the messenger), the travellers' camp and the ruin hermit. They tell
   news near them (or their realm's, a lord), recent, newest and weightiest first (each source leaning to the kinds it would
   know), never what you have heard already. What you hear goes into the log and puts a faint "?" on the map near the event
   (a little off its true spot, by its id), the rumour as its tooltip, fading after NEWS.markDays (drawRumourMarks; the minimap).
   W.news also keeps what you have heard (heard: id → the day), today's counts (told: source key → {day, ids}) and the marks;
   saved once there is any (as W.road: a save before it has none) ---------- */
// keep, days: how many and how long; merge: days within which the same kind by the same holding is one; radius: a tavern's ears
// (px); markDays: how long a "?" stays; off: how far it may lie from the true spot (px); at: nearer than this to a holding or
// estate, it is "near" it, else to one side of it (px); band: the strength (rating) a band must have to be talked of; age: how
// much a day's age weighs against a kind's weight (w) when choosing; prefer: the weight a source's own kinds gain
const NEWS={keep:60,days:6,merge:1,radius:360,markDays:3,off:28,at:70,band:65,age:1.5,prefer:4};
const newsW=()=>W.news||(W.news={items:[],n:0,heard:{},told:{},marks:[]});
const facN=f=>FACS[f]?FACS[f].n:'a realm';
// (a beast's name in a sentence: "A wolf pack" has, "Dire boars" have)
const beastN=d=>{const n=MONSTERS[d.id]?MONSTERS[d.id].n:'Beasts',pl=/s$/.test(n);return [pl?n:cap1(an(n.toLowerCase())),pl]};
const newsMany=n=>n<9?'half a dozen':n<16?'a dozen':n<26?'a score':'scores';
/* the kinds: w (how much it matters), say (its sentences, picked by the item's id; each (detail, s): s.where (place-based,
   rough), s.when, s.road (on the road …)), same(item, detail, x, y) (one that moves: the same one seen again, though by another
   holding now, or days on: one item, moved) */
const NEWS_KINDS={
  fell:{w:10,say:[(d,s)=>d.town+' has fallen to the '+facN(d.fac)+(d.sacked?', and was sacked':'')+', '+s.when+'.',
    (d,s)=>'They say the '+facN(d.fac)+' took '+d.town+' '+s.when+(d.sacked?' and put it to the torch':'')+'.']},
  siege:{w:9,say:[d=>'The '+facN(d.fac)+'’s men are besieging '+d.town+'.',(d,s)=>d.lord+' of the '+facN(d.fac)+' laid siege to '+d.town+' '+s.when+'.']},
  relieved:{w:8,say:[(d,s)=>'The siege of '+d.town+' is broken: '+d.lord+' fell back '+s.when+'.',(d,s)=>d.town+' held. '+d.lord+'’s men were driven off '+s.when+'.']},
  raid:{w:7,say:[(d,s)=>d.town+' was raided '+s.when+(d.estate&&ESTATES[d.estate]?'; its '+ESTATES[d.estate].n.toLowerCase()+' burnt':'')+'.',(d,s)=>'Smoke over '+d.town+' '+s.when+': raiders took what they could carry.']},
  lord:{w:7,say:[(d,s)=>d.lord+' of the '+facN(d.fac)+' was beaten '+s.where+', '+s.when+'.',(d,s)=>'Word is '+d.lord+'’s army was routed '+s.where+'.']},
  caravan:{w:6,say:[(d,s)=>'A caravan'+(d.from?' out of '+d.from:'')+' was '+(d.lord?'seized by '+d.lord+'’s men':d.band?'plundered by bandits':'robbed')+' '+s.road+', '+s.when+'.',
    (d,s)=>'Merchants are wary: a caravan was '+(d.band?'burnt':'taken')+' '+s.road+' '+s.when+'.']},
  beast:{w:5,same:(it,d,x,y)=>it.detail.id===d.id&&Math.hypot(it.x-x,it.y-y)<NEWS.radius,say:[(d,s)=>{const [n,pl]=beastN(d);return n+(pl?' have':' has')+' been seen '+s.where+'.'},(d,s)=>{const [n,pl]=beastN(d);return 'Keep off the fields '+s.where+': '+n.toLowerCase()+(pl?' prowl':' prowls')+' there.'}]},
  band:{w:5,same:(it,d)=>!!d.chief&&it.detail.chief===d.chief,say:[(d,s)=>d.grew?(d.chief?d.chief+'’s band':'A band of cutthroats')+' grows bolder '+s.where+', fat on plunder.':'A big band of '+(d.label||'bandits').toLowerCase()+', '+newsMany(d.n||0)+' strong, was seen '+s.where+'.',
    (d,s)=>'Travellers keep off the road '+s.where+': '+(d.chief?d.chief+'’s':'a big')+' band is out.']},
  fight:{w:4,say:[(d,s)=>'There was a battle '+s.where+' '+s.when+': '+d.win+' won.',(d,s)=>cap1(d.win)+' beat '+d.lose+' '+s.where+', '+s.when+'.']},
  trace:{w:3,say:[(d,s)=>({body:'A traveller was found dead by the road '+s.where+', '+s.when+'.',wreck:'A burnt wagon lies '+s.road+'. Raiders, they say.',cart:'Someone left a cart stuck in the mud '+s.road+', '+s.when+'.'})[d.t]||'Something bad happened '+s.road+'.']}
};

/* ---- recording ---- */
// the holding an event is told by: the nearest standing one
const newsNear=at=>Spatial.nearestHolding(at.x,at.y,t=>!t.gone);
// an event: k (NEWS_KINDS), at (where: {x, y}), detail (its own facts: names, never objects). The same kind by the same holding
// within NEWS.merge days, or the same one that moves seen again (its kind's same: a beast, a chieftain's band, while the
// news of it lasts), is brought up to date instead (place, holding, day, facts), keeping its id (heard stays heard). Returns it
function newsRecord(k,at,detail){
  const K=NEWS_KINDS[k];if(!K||!at||!isFinite(at.x)||!isFinite(at.y))return null;const t=newsNear(at);if(!t)return null;
  const N=newsW(),x=Math.round(at.x),y=Math.round(at.y),old=N.items.find(it=>it.k===k&&(Clock.daysSince(it.day)<=NEWS.merge&&it.near===t.name||K.same&&K.same(it,detail,x,y)));
  if(old){Object.assign(old,{x,y,near:t.name,day:G.day,detail:{...old.detail,...detail}});return old}
  const it={id:++N.n,k,x,y,day:G.day,near:t.name,detail:{...detail}};N.items.push(it);newsTrim();return it;
}
// (gone: news older than NEWS.days, the oldest past NEWS.keep, heard ids of news gone, yesterday's counts, faded marks)
function newsTrim(){const N=newsW();N.items=N.items.filter(it=>Clock.daysSince(it.day)<NEWS.days);if(N.items.length>NEWS.keep)N.items.splice(0,N.items.length-NEWS.keep);
  const ids=new Set(N.items.map(it=>it.id));for(const id in N.heard)if(!ids.has(+id))delete N.heard[id];
  for(const k in N.told)if(N.told[k].day!==G.day)delete N.told[k];N.marks=N.marks.filter(m=>Clock.daysSince(m.day)<NEWS.markDays)}
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

/* ---- the words (when you hear it) ---- */
const newsWhen=it=>{const a=Clock.daysSince(it.day);return a<=0?'today':a===1?'yesterday':a<=3?['two','three'][a-2]+' days back':'some days back'};
// where, roughly: by an estate of its holding, by the holding, or to one side of it ("east of Millbrook")
function newsWhere(it,road){const t=townBy(it.near);if(!t)return road?'on the road':'in the wilds';const d=Math.hypot(it.x-t.x,it.y-t.y);
  if(!road){let e=null,ed=NEWS.at;for(const [k,p] of Object.entries(bldSpots(t)))if(bldLv(t,k)>0){const q=Math.hypot(it.x-p.x,it.y-p.y);if(q<ed){ed=q;e=k}}
    if(e&&ed<d)return 'near '+t.name+'’s '+ESTATES[e].n.toLowerCase()}
  return (road?'on the road ':'')+(d<NEWS.at?'near ':compass(it.x-t.x,it.y-t.y)+' of ')+t.name}
// the rumour itself, its sentence picked by its id
function rumourText(it){const K=NEWS_KINDS[it.k];if(!K)return '';const s={where:newsWhere(it,false),road:newsWhere(it,true),when:newsWhen(it)};
  return K.say[it.id%K.say.length](it.detail||{},s)}

/* ---- hearing: the sources and the service ---- */
/* who tells it: cap (new rumours a day, per source: its key), r (how near, px: to its place, or any of its places), land (news
   on its holding's land instead), realm (news of a lord's realm, its lands and wars), prefer (the kinds it leans to), from (the
   log's word), quiet (its page logs what is said: the road's talkers, the sites) */
const RUMOUR_SOURCES={
  tavern:{cap:2,r:NEWS.radius,from:'tavern talk'},
  estate:{cap:1,r:220,prefer:['beast','band','trace','raid'],from:'a worker'},
  watch:{cap:1,land:true,r:160,prefer:['band','beast','trace','raid','caravan'],from:'the watch'},
  caravan:{cap:1,r:240,prefer:['caravan','trace','band','beast'],from:'a caravan master'},
  lord:{cap:1,realm:true,prefer:['siege','fell','relieved','lord','fight'],from:'a lord'},
  road:{cap:1,r:320,quiet:true,from:'the road'},
  refugees:{cap:1,r:320,prefer:['raid','siege','fell'],quiet:true,from:'refugees'},
  camp:{cap:1,r:420,quiet:true,from:'the travellers'},
  hermit:{cap:1,r:420,prefer:['beast','trace','band'],quiet:true,from:'the hermit'}
};
// a source: its kind's rules, its key (one cap each), where it is (a place, or several: a caravan's road), and any of its own
const rumourSource=(kind,key,at,o)=>({kind,key:kind+':'+key,at:[].concat(at).filter(Boolean),...RUMOUR_SOURCES[kind],...o});
const newsById=id=>newsW().items.find(it=>it.id===id)||null;
// is it news this source would know: on its land, of its realm, or near it
function newsKnows(src,it){
  if(src.realm){const d=it.detail||{},own=n=>{const t=n&&townBy(n);return !!t&&t.owner===src.fac};return d.fac===src.fac||own(it.near)||own(d.town)}
  if(src.land&&src.at[0]&&landHold(it.x,it.y)===src.at[0])return true;
  return src.at.some(p=>Math.hypot(p.x-it.x,p.y-it.y)<=src.r)}
// what it could tell you new now: recent, known to it, not heard; weightiest and newest first, its own kinds first
function rumourCands(src){const N=newsW(),score=it=>NEWS_KINDS[it.k].w+(src.prefer&&src.prefer.includes(it.k)?NEWS.prefer:0)-NEWS.age*Clock.daysSince(it.day);
  return N.items.filter(it=>N.heard[it.id]==null&&Clock.daysSince(it.day)<NEWS.days&&newsKnows(src,it)).sort((a,b)=>score(b)-score(a)||b.id-a.id)}
// heard: kept as heard (no source tells it as new again), its "?" on the map near it, and the log
function rumourHear(it,src){const N=newsW(),t=rumourText(it),j=k=>(hash(it.id,k,7919)-.5)*2*NEWS.off;N.heard[it.id]=G.day;
  N.marks=N.marks.filter(m=>m.id!==it.id);N.marks.push({id:it.id,x:Math.round(it.x+j(1)),y:Math.round(it.y+j(2)),day:G.day,t});
  if(!src.quiet)log('Rumour ('+src.from+'): '+t)}
/* the service: what a source tells you now. It tells up to its cap of new rumours today (each heard: rumourHear), never again
   that day; fresh (told just now), today (all it told you today, fresh ones too: a page that asks again shows the same),
   before (rumours you heard already of news it knows, not today's from it), capped (its cap is spent) */
function rumourFrom(src){newsTrim();const N=newsW(),day=G.day,told=N.told[src.key]||(N.told[src.key]={day,ids:[]}),fresh=[];
  for(const it of rumourCands(src)){if(told.ids.length>=src.cap)break;rumourHear(it,src);told.ids.push(it.id);fresh.push(it)}
  const today=told.ids.map(newsById).filter(Boolean);
  return {fresh,today,before:N.items.filter(it=>N.heard[it.id]!=null&&!today.includes(it)&&newsKnows(src,it)).sort((a,b)=>b.day-a.day||b.id-a.id),capped:told.ids.length>=src.cap}}
// (one line a talker says today, or none: what a worker, a captain, a caravan master or a lord says beside his own words)
const rumourSay=src=>{const it=rumourFrom(src).today[0];return it?rumourText(it):''};
// the tavern's Rumours: what you heard on coming in (fresh: new), else that there is nothing new today; then what you heard
// before (today's here too, once they are not fresh)
function rumourHtml(r){
  const line=(it,cls)=>'<p class="'+cls+'"><span class="rum-q">?</span> '+rumourText(it)+'</p>',old=[...r.today.filter(it=>!r.fresh.includes(it)),...r.before];
  return (r.fresh.length?r.fresh.map(it=>line(it,'rum-new')).join(''):'<p class="muted">'+(r.capped?'Nothing new today; come back tomorrow.':'No fresh news of late.')+'</p>')+
    (old.length?'<div class="lab">Heard before</div>'+old.slice(0,6).map(it=>line(it,'muted')).join(''):'')}

/* ---- the marks on the map: a faint "?" by each rumour you heard (over the labels: render.js), fading over its last day ---- */
const rumourMarks=()=>newsW().marks.filter(m=>Clock.daysSince(m.day)<NEWS.markDays);
const rumourFade=m=>clamp(m.day+NEWS.markDays-G.day-Clock.frac,0,1);
const RUMOUR_COL='#cdb8ff';
function drawRumourMarks(cam){const c=wuiArrow('ask',RUMOUR_COL);for(const m of rumourMarks()){const a=rumourFade(m),sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y);
  if(a<=0||sx<-10||sy<-10||sx>VW+10||sy>VH+16)continue;ctx.save();ctx.globalAlpha=.8*a;wuiPut(c,sx,sy-2,c.cx,c.tip);ctx.restore()}}
// (the tooltip over one, where nothing else is under the pointer: input.js)
function rumourTip(wx,wy){const m=rumourMarks().filter(m=>rumourFade(m)>0&&Math.abs(m.x-wx)<=6&&wy>=m.y-16&&wy<=m.y-2)[0];
  return m?'<b>A rumour</b><small>'+m.t+'</small><small class="muted">Heard on day '+m.day+'</small>':''}

/* ---- the save: W.news once there is any (none: as every save before it; the save registry, core/saves.js) ---- */
Saves.add({key:'news',order:240,defaults:{items:[],n:0,heard:{},told:{},marks:[]},
  save:()=>{const N=W.news;return N&&(N.items.length||N.marks.length||Object.keys(N.heard).length||Object.keys(N.told).length)?N:undefined},load:n=>{W.news=n}});
const newsLoad=n=>Saves.loadOf('news',n);
