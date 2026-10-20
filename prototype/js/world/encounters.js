'use strict';
/* ---------- encounters on the road (doc/ENCOUNTERS_DESIGN.md, phases 1, 2 and 4): the people you meet travelling are small scenes on
   the map, not windows popping up: a wounded man by the road, a peddler walking up, hunters round a fire, a caravan fighting off
   raiders. Today's people events moved here from world/events.js (it keeps the weather, the sickness and the finds), their
   rules and outcomes as they were; phase 2 adds eight of their own (a cart stuck in the mud, a thief on the run, a poacher, a
   funeral, a wedding party, a runaway horse, a beggar, a messenger); phase 4 the fake wounded (a lure), pilgrims bound for or
   praying at a real shrine, and the messenger's sealed letter as a real thing in your bag (world/letters.js). W.road (made with the first, saved only then: roadSave): {on (the encounters and their
   traces), c (the hours you have travelled since you last met one), h (the hour under way), day, n (how many came that day), cd
   ({kind: the day it last came}), id}.
   - Spawning, a pity timer (ENC_SPAWN): each whole hour you travel (moving on the map: not in a holding, paused, in a window or
     a battle), the chance is base + rate × c, at most cap, × the land you are on (a road busier, a holding's land, the wild
     rarer); at most perDay a day, a kind not again within `again` days, one at a time. Met (you meet it): c is 0; passed by
     (you knew of it, it left unmet): c falls by 25–50%. G.quietEvents (the tests' switch) holds it all, as it holds the events.
   - Which (ROAD_ENC w, wf, ok: today's events' rules: the climate, the land, the night, a holding near, your band) and where
     (on: ENC_ON, its own ground): your sight + 40–120 px out, ahead of the way you go, never in a holding.
   - Behaviour (beh: one small strategy each, story/happening.js Behaviours): approach (walks up to you; reaching you, it is met), stay, flee (runs as you come; or across your view,
     on its own way: hx, hy; or, startled, a little way and then stops: stop), scene (already under way: it plays out by
     itself), walk (a procession: walks the roads to its goal and ends there), leave (going: walks off), bolt (gone at a run).
     The chase and the catch (ENC_CATCH: the thief run down on the map, the runaway horse caught by hand) are shared, by your
     Agility and Riding. How long each lasts unmet: ENC_LIFE. Everything leaves once you are
     far (leave × your sight, or farther than it first stood); met and done with, once out of your sight. Nothing ends while
     you can see it (its ends: story/happening.js): its time up in your sight, it ends its kind's way (walks off, waits, plays out) and is gone once
     out of it. A few, their time up unresolved, leave a trace (the body, the burnt wagon) that fades after a day.
   - Shown (no pause): heard or seen the first time, a log line and a soft sound; then, while unmet, highlights (gfx/worldui.js
     wuiRoadUnder, wuiRoadOver): a glow round its figures, a pulsing "!" over it, its call-out line, an arrow at the screen's
     edge while it is off the screen. Its figures: today's map people and beasts, a cart, a tent, a fire, a shrine, a mine's
     head (EncounterScene, from its kind's scene).
   - Met: its page (window.js PageScreen: its banner cropped from the map round it, what you see, Insight by Scouting, its
     choices as key actions, a confirm before what cannot be undone, Leave at the bottom). An ambush springs as you pass: its
     page a forced choice; only Scouting INSIGHT.rough or more sees it before ---------- */
// spawning: base, rate (a travelled hour), cap; land (× by where you are); perDay, again (days); near: how far past your sight
// (px); arc: how far off the way you go (rad; arcTo for those that walk up to you, so they can reach your way); tries (spots tried); hold: tiles from a holding; pass: what passing one by takes
// off the timer [from, to]
const ENC_SPAWN={base:.004,rate:.0016,cap:.15,land:{road:1.5,held:1,wild:.6},perDay:2,again:5,near:[40,120],arc:1.1,arcTo:.5,tries:60,hold:6,pass:[.25,.5]};
// how long one lasts unmet, in-game hours [from, to], by behaviour; trace: the hours a trace lies; leave: gone past this × your
// sight (or slack px farther than it first stood); say: real seconds its call-out shows; hail: px at which one walking up to you
// stops you (it has reached you); spring: px at which an ambush springs
// (run: one running across your view; walk: a procession, ending sooner where it arrives; spook: × your sight, one that flees runs as you come within it)
// (its time up in your sight (its ends): pray: [from, to] hours a procession stays at the shrine or ruins it walked to; dying: hours
// past his time the wounded traveller lasts while you watch him; linger: hours past its time after which one walking off ends
// once past 0.8 × your sight, though still in it)
const ENC_LIFE={approach:[2,3],stay:[6,8],flee:[2,2],run:[2,3],scene:[3,8],walk:[4,10],trace:24,leave:1.5,slack:24,say:4,hail:20,spring:18,spook:.6,pray:[2,3],dying:6,linger:6};
// how fast they walk (px of world time, as a party's base, yours 34): hurrying to you, a rider coming, running from you, running
// across your view, a procession, going away, bolting
const ENC_SPD={approach:24,ride:32,flee:20,run:36,walk:20,leave:12,bolt:34,stray:16};
/* the chase and the catch, shared (story/happening.js: Encounter run, the chase behaviour; the thief, the runaway horse): one you chase runs from you at
   ENC_SPD.run × (1 − agi × your Agility), never under lo of it, and you go after him at sprint × your pace (your Riding in it
   when mounted: world.js updateWorld, roadSprint); you have him within reach + agiReach × your Agility; he is away after hours,
   or once lose × your sight from you. A startled beast runs bolt px [from, to], then stops (spook: × your sight, it bolts as you
   come). A catch by hand: a stat check (ENC_STAT.horse: Riding and Agility) */
const ENC_CATCH={sprint:1.6,agi:.04,lo:.6,reach:14,agiReach:2,hours:1.5,lose:1,bolt:[40,64],spook:.5};
// a procession's way (walk): its goal at least min px from where it comes into the world, and near enough to reach in its
// longest time (ENC_LIFE.walk) at its pace, the roads winding (wind: the share of its way that is straight on); places within far
// px of you (the kinds' ok)
const ENC_WALK={min:64,wind:.75,far:400};
/* the new kinds' numbers: mud (Help push: sp stamina, else hours of time; rep there; give [from, to] of its goods; Rob: goods and
   coins [from, to], CONDUCT.robWorker), thief (his purse [from, to]; Return it: reward gold, rep; Keep it: honor), poacher (see:
   × your sight, he sees you first, scout less a Scouting level; Turn him in: rep, bounty; Buy the meat: meat for price),
   funeral (mourners [from, to]; Pay respects: honor, morale), wedding (Join: morale, hours; a gift: gold, rep), beggar (gold
   to give, honor for each), messenger (his purse [from, to]; Rob: CONDUCT.robMessenger, and his sealed letter: ENC_TUNE.letter,
   world/letters.js).
   Phase 4: pilgrims (n [from, to] of them; Pray with them: morale, rep in their holding, walk: hours walking with them; alms: gold,
   morale, xp; Take the coins: gold, morale), the lure (the fake wounded: w its weight, × night, × wild (no holding's land), ×
   (1 + bandit for each band or camp within near px, at most bands of them), never over cap (the real one weighs 2); warn: the
   Scouting that sees the brush move, count: that tells how many and the odds; scare: calling them out may send a band of max or
   fewer running: base + lead × Leadership + cha × Charisma, between lo and hi), the sealed letter (stale: [from, to] days it keeps;
   worth: gold [from, to] × its kind's; w: how likely each kind is, of those there can be; sell: × worth a rival pays, deliver: ×
   worth its lord pays; opened: × for an opened one, old: × for a stale one; rep: sell, deliver, seen (what delivering costs when
   the robbery was seen); witness: the roll when you rob the rider: base + per for each soul within r px of him + hold when a
   holding is within holdR px, × (1 − scout × Scouting), × night by night, between lo and hi; reveal: tiles round a place its news
   uncovers on your map); and the old ones: traveller (Tend his wounds: food; rep and renown × (1 + your care: ENC_STAT.care);
   gift: × your care, the chance he gives you gold [from, to] from his purse), hunters (Join the hunt: xp; meat × (1 + your
   ENC_STAT.hunt); furs × it) */
/* strayed sheep: n strays (from, to), r: px from the shepherd they wander (from, to), shy: px you come before one trots off,
   hours: how long he waits once you help, rep and good (wool or cheese) a sheep brought back, all: more when every one is */
const ENC_SHEEP={n:[3,4],r:[40,80],shy:26,hours:3,rep:1,good:1,all:{rep:2,morale:3}};
const ENC_TUNE={traveller:{food:3,rep:4,renown:1,gift:.6,gold:[5,10]},hunters:{xp:15,meat:3,furs:2},mud:{sp:20,hours:1,rep:3,give:[2,4],goods:[3,5],coins:[3,8]},thief:{purse:[20,40],reward:10,rep:4,honor:3},poacher:{see:1.15,scout:.1,rep:3,bounty:10,meat:4,price:8},
  funeral:{n:[3,5],honor:2,morale:4},wedding:{morale:10,hours:2,gift:25,rep:5},beggar:{gold:[5,10,20],honor:[1,2,3]},messenger:{purse:[8,16]},
  pilgrims:{n:[2,4],morale:8,rep:3,walk:1,alms:20,almsMorale:12,xp:25,coins:12,coinsMorale:8},
  lure:{w:.5,night:1.6,wild:1.4,bandit:.3,bands:3,near:400,cap:1.6,warn:3,count:5,scare:{max:6,base:.2,lead:.06,cha:.05,lo:.05,hi:.85}},
  letter:{stale:[5,10],worth:[30,45],kind:{army:1.4,attack:1.3,deal:1.1,news:.6},w:{army:1,attack:1,deal:.7,news:.8},sell:1.2,deliver:.8,opened:.5,old:.15,
    rep:{sell:4,deliver:5,seen:6},witness:{r:120,base:.08,per:.12,hold:.25,holdR:160,scout:.07,night:.5,lo:.02,hi:.9},reveal:5}};
const ENC_DICE=.48;// (a hand of bones won)
// (the gamblers play at most hands hands with you, and quit early once they are quit gold down to you: no endless purse)
const ENC_GAMBLE={hands:5,quit:100};
const diceLeft=e=>ENC_GAMBLE.hands-(e.hands||0);
/* ---------- your stats on the road (owner, 2026-10-19: stats only add to what anyone gets, up to a cap; a stat of 0 is today's
   odds or outcome, never worse). ENC_STAT, each check: {base (what anyone gets), parts: [[stat, per]…] (a stat: a discipline,
   P.sk, or an attribute, str, agi, int, cha; a list of them: the highest counts), cap}. statOdds(k): base + Σ stat × per, at
   most cap. A chance (horse: Catch it; dice: a hand won; mine: the tunnels hold, mineGear: gear deep inside; wisps: the
   treasure) or a share added on top (care: how well you tend the wounded traveller, 0–1, kept on him as e.care; push: of the
   stamina and time a cart takes, taken off; hunt, respect: × (1 + it) the haul, or the honour, reputation and morale given).
   statRead: a chance's Insight read (vague, rough or exact by Scouting); statHelps: the stats that help, by name; statParts:
   each stat's worth, for the wiki ---------- */
const ENC_STAT={horse:{base:.25,parts:[['ride',.08],['agi',.04]],cap:.9},dice:{base:ENC_DICE,parts:[[['int','cha'],.015]],cap:.65},
  mine:{base:.6,parts:[['surv',.04],['int',.01]],cap:.85},mineGear:{base:.4,parts:[['surv',.02],['int',.01]],cap:.55},wisps:{base:.5,parts:[['int',.025]],cap:.75},
  care:{base:0,parts:[['med',.15],['int',.03]],cap:1},push:{base:0,parts:[['str',.05],['athl',.05]],cap:.6},
  hunt:{base:0,parts:[['surv',.1],['hunt',.05],['archery',.05]],cap:1},respect:{base:0,parts:[['cha',.08]],cap:1}};
const statOf=s=>Array.isArray(s)?Math.max(...s.map(statOf)):Math.max(0,s in P.attr?P.attr[s]:skill(s));
const statOdds=k=>{const S=ENC_STAT[k];return Math.min(S.cap,S.parts.reduce((a,[s,p])=>a+p*statOf(s),S.base))};
const statMore=(k,v)=>Math.round(v*(1+statOdds(k)));// (a share's worth on top of v)
const statName=s=>Array.isArray(s)?s.map(statName).join(' or '):ATTRS[s]?ATTRS[s][0]:SKILLS[s].n;
function statHelps(k){const n=ENC_STAT[k].parts.map(([s])=>statName(s));return(n.length>1?n.slice(0,-1).join(', ')+' and '+n[n.length-1]+' help':n[0]+(Array.isArray(ENC_STAT[k].parts[0][0])?' (the higher) helps':' helps'))}
const statParts=k=>ENC_STAT[k].parts.map(([s,p])=>'+'+Math.round(p*1000)/10+'% '+(Array.isArray(s)||ATTRS[s]?'a point of ':'a level of ')+statName(s)).join(', ');
// (o: vague, what (the words after a rough or exact chance), rough(p) and exact(p) (words of their own), more (its tooltip))
function statRead(k,o){const p=statOdds(k);return insight([o.vague,o.rough?o.rough(p):oddsWord(p)+' '+o.what,o.exact?o.exact(p):Math.round(p*100)+'% '+o.what],o.more||'know your odds')}
const ENC_RAIDER='#4a2c26';// (raiders' rags: darker than any realm's colours, so a fight reads at a glance)
const roadNow=()=>Clock.hours();// (the world's clock, in hours: clock.js)
const roadDay=()=>Clock.isDay;// (by day: the kinds that walk the roads in daylight)
// (time spent with them: h hours on the clock, a new day rolling over as it does on the map)
const roadHours=h=>Clock.passHours(h);
const roadSt=()=>W.road||(W.road={on:[],c:0,h:0,day:G.day,n:0,cd:{},id:0});
const roadList=()=>W.road?W.road.on:[];
// the land under a point, for the chance: a road (on one or a tile by), a holding's land, the wild (its story place's: the chance
// reads your story context's, story/context.js)
const roadLand=(x,y)=>new StoryPlace(x,y).landKind;
// each kind's ground (a tile): on or by a road; open land off it; anywhere off a road; a wood's edge (open land with the trees
// behind or beside it, none in front, so its camp shows; open land in the frost); hills (or by the mountains); a bog; cover beside a road (encounters.js coverAt);
// a lure: by a road with woods or hills beside it for the bandits to lie in;
// mud: by a road where it runs by water or a ford, or through a bog; a lord's wood: a wood's edge (no frost) on a holding's land
// that has a lord (a realm's, or yours)
// (each reads the tile's story place: story/context.js Story.at, its terrain, climate, land and cover at the tile's middle)
const roadOwned=(x,y)=>{const t=landHold(x,y);return t&&t.owner?t:null};
const ENC_ON={road:(tx,ty)=>Story.at(tx,ty).byRoad,open:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain===T_OPEN&&!p.byRoad},wild:(tx,ty)=>Story.at(tx,ty).terrain!==T_ROAD,
  wood:(tx,ty)=>{const p=Story.at(tx,ty);return p.woodsEdge||p.terrain===T_OPEN&&p.climate==='frost'},hill:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain===T_HILL||p.by(T_MOUNT,1)},
  bog:(tx,ty)=>{const p=Story.at(tx,ty);return p.terrain!==T_ROAD&&p.climate==='swamp'},cover:(tx,ty)=>{const p=Story.at(tx,ty);return p.by(T_ROAD,2)&&!!p.cover},
  mud:(tx,ty)=>{const p=Story.at(tx,ty);return p.byRoad&&(p.by(T_WATER,1)||p.by(T_FORD,2)||p.climate==='swamp')},
  lordwood:(tx,ty)=>{const p=Story.at(tx,ty);return p.woodsEdge&&p.climate!=='frost'&&!!p.owned},
  lure:(tx,ty)=>{const p=Story.at(tx,ty);return p.byRoad&&(p.by(T_FOREST,2)||p.by(T_HILL,1))}};
// the people in them (folk of the nearest holding's race, v a variant): today's map figures in small variants
const ENC_LOOK={traveller:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'bare',outer:'blue',team:'linen'}),healed:(r,v)=>({...ENC_LOOK.traveller(r,v),helm:'bandage'}),
  peddler:(r,v)=>({...folkLook('merchant',r,v),load:'pack',weapon:'crook'}),pilgrim:(r,v)=>({...folkLook('priest',r,v),weapon:v%2?'crook':null}),
  hunter:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'forest',outer:'leather',team:'forest',weapon:v%2?'bow':'spear'}),
  child:(r,v)=>({...folkLook('folk',r,v),robe:false,short:true,beard:null,helm:'bare',weapon:null}),
  bard:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'violet',outer:'red',team:'gold',cape:'violet',weapon:'lute'}),
  thief:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'hood',hood:'dark',outer:'dark',team:'leather',weapon:'dagger'}),
  victim:(r,v)=>({...folkLook('merchant',r,v),weapon:null}),
  mourner:(r,v)=>({...folkLook('folk',r,v),robe:v%2===0,helm:'hood',hood:'dark',outer:'dark',team:'dark',weapon:null}),
  shroud:(r,v)=>({...folkLook('folk',r,v),robe:true,helm:'hood',hood:'linen',outer:'linen',team:'linen',inner:'linen',beard:null,weapon:null}),
  villager:(r,v)=>({...folkLook('folk',r,v),helm:'bare',weapon:null}),
  beggar:(r,v)=>({...folkLook('folk',r,v),robe:false,hair:'grey',beard:'grey',helm:'hood',hood:'leather',outer:'linen',team:'dark',cape:'leather',weapon:'crook'}),
  messenger:(r,v)=>({...folkLook('folk',r,v),robe:false,helm:'cap',outer:'leather',team:'white',weapon:null})};
// (Tend his wounds' tooltip, the real wounded traveller's and the lure's: roadTend)
const ROAD_TEND_TIP='Bandage him and share your food. Medicine and Intellect: the better he mends, the more he owes you.';
const roadCol=e=>e.fac&&FACS[e.fac]?FACS[e.fac].col:'#8a7458',roadPrice=e=>Math.round(ITEMS[e.item].v*.7);
// a fight on the road, as today's events made them: the raiders on a caravan, or an ambush's band (amb: its own band by the land,
// its fighters mustered here; or the lure's, mustered when it came: e.band, e.foes); edge (as amb unless given): you in their
// trap, the ambush's battle; false: you came ready for them
const roadBand=(x,y)=>{const c=climAt(x,y);return c==='desert'?'raiders':c==='swamp'?'bog':'bandits'};
const roadBandN=()=>rint(5,7)+Math.floor(G.day/15);
function roadFight(e,amb,edge=amb){e.done=1;e.gone=1;G.road=null;const k=amb?e.band||roadBand(P.x,P.y):'bandits',n=e.foes?e.foes.length:amb?roadBandN():e.n,b=asParty({x:P.x,y:P.y,cool:0,n,kind:k,...(e.foes?{troops:e.foes.slice()}:{})});
  startEncounter({kind:'party',ref:b,n,list:b.troops.slice(),band:k,...(edge?{btype:{kind:'ambush',hid:1}}:{})})}
/* the kinds: Encounter kinds (story/kinds.js defineKinds; their trigger 'travelHour', the pity timer's: ROAD_ENC is their view;
   a kind of its own class, cls: the shepherd). n, ico (its page's icon), w (weight; wf: × by your band), ok() (can it come here and now: today's event's rule), on
   (its ground: ENC_ON), beh, call (its call-out), hear (the log line when it is first heard: {d} its way; none: seen only), tip,
   trace (left when its time is up unresolved: ROAD_TRACE), setup(e) (its own state, made when it comes), scene(e) (its pieces:
   EncounterScene), text(e), facts(e) (what you can tell: Insight), left(e) (the log line when you leave it be), acts (its
   choices: Choices, story/choice.js: {icon, label, need(e) (why not), ask(e) (asks first: what cannot be undone), again
   (it stays open), out(e) (its outcome, story/outcome.js: what it does, declared; its facts are written from it, also(e) adding
   the lines no outcome can say: a trap, a stat that helps) or run(e, choice) (a hook: a roll, a chase, its own state; it returns
   an outcome, or the result's line; facts(e), its words by hand), odds (an ENC_STAT check), when(e) (offered only then)}), hidden
   (seen only by Scouting INSIGHT.rough+), spring (springs as
   you pass), forced (no Leave until chosen; or forced(e)), vanish (gone once dealt with), glow (lights: seen from farther), foe;
   wn (its name in the wiki, when its page's is another's: the lure), after(e) (the log line when it leaves, seen and unmet),
   heard(e) (what follows when it is first heard or seen), under(e) (pictures under its own on its page's banner: a place it is at);
   and leave (its Leave's word), life (its time by another behaviour's: ENC_LIFE), near (px past your sight it comes, if not ENC_SPAWN's), spd (ENC_SPD: how fast it comes), far (a
   click on it opens its page at once: one you cannot walk up to), wary() (× your sight: he flees if he sees you there before you see him), stop (flees
   a little way, then stops), spook (× your sight: it runs as you come), lost (the log line when one you chase gets away), they (what it does, in the wiki's words);
   ends (how it ends when its time is up in your sight, if not its behaviour's: story/happening.js Behaviours), goes(piece) (which of its pieces go
   when it walks off, if not its people) */
/* the road's talkers and their news (news.js): the peddler, the bard and the pilgrims tell a rumour of the roads near where you
   meet them (Ask for news, once), the refugees why they fled (a raid or a siege at their home, when there was one), the
   messenger his news (Read the news: roadNews, and a rumour of the road). One a meeting: its key, the meeting's own (e.i) */
const roadRumour=(e,kind)=>rumourFrom(rumourSource(kind||'road',e.i,e)).today[0]||null;
const ROAD_ASK=new Choice({icon:'scroll',label:'Ask for news',again:true,facts:()=>['a rumour of the roads near here'],need:e=>e.asked&&'You have heard their news.',tip:'Ask what they have heard on the road.',
  run:e=>{e.asked=1;const it=roadRumour(e);return it?'“'+rumourText(it)+'”':'They have heard nothing worth the telling.'}});
const ROAD_FLED=new Choice({icon:'scroll',label:'Ask why they fled',again:true,facts:()=>['what drove them from home'],need:e=>e.asked&&'They have told you their story.',tip:'Ask what drove them onto the road.',
  run:e=>{e.asked=1;const it=roadRumour(e,'refugees'),why=it&&['raid','siege','fell'].includes(it.k);return !it?'They only shake their heads: hard times, nothing more.':why?'They fled '+((it.detail&&it.detail.town)||it.near)+': “'+rumourText(it)+'”':'They will not say why they left, but they tell you: “'+rumourText(it)+'”'}});
/* strayed sheep (ENC_SHEEP): the one kind with behaviour of its own, so it has its classes (story/kinds.js cls). The shepherd
   scatters his strays when he comes (fewer than two on open ground you can reach: no such shepherd here), counts them home and
   thanks you once for what came back; a stray grazes (Behaviours.graze), and once he has your help, ride into it (within
   catchReach) and it is back with the flock */
class Shepherd extends Encounter{
  setup(){
    const S=ENC_SHEEP,R=roadSt(),n=rint(S.n[0],S.n[1]),at=[];
    for(let k=0;k<60&&at.length<n;k++){
      const a=Math.random()*6.2832,d=S.r[0]+Math.random()*(S.r[1]-S.r[0]),x=this.x+Math.cos(a)*d,y=this.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
      if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||occAt(tx,ty)||!Router.reach(P,{x,y})||at.some(([u,v])=>Math.hypot(u-x,v-y)<14))continue;
      at.push([x,y]);
    }
    if(at.length<2)return false;
    this.n=at.length;
    this.got=0;
    for(const [x,y] of at)R.on.push(asRoadEnc({rd:1,i:++R.id,k:'stray',pk:this.i,x,y,dir:x<this.x?-1:1,beh:'graze',race:this.race,t0:this.t0,end:this.end,d0:Math.hypot(x-P.x,y-P.y),seed:rint(1,9999),seen:0,met:0,done:0}));
  }
  // his wool or his cheese (for each sheep back); his strays still out, and how many, in words
  good(){
    return this.seed%2?'wool':'cheese';
  }
  strays(){
    return roadList().filter(o=>o.pk===this.i&&!o.gone&&!o.caught);
  }
  astray(){
    const n=this.strays().length;
    return n===1?'One':n?String(n):'None';
  }
  // a stray driven home: back with the flock (it leaves the map; he counts it)
  herd(o){
    o.caught=1;
    this.got=(this.got||0)+1;
    train('athl',2);
    this.say('You drive a stray back to the shepherd ('+this.got+' of '+this.n+').');
    sfx('notify');
    o.over();
  }
  // every stray back or gone: he is done, and on his way with his flock
  check(){
    if(!this.help||this.ended||this.strays().length)return;
    this.done=1;
    this.goOff();
  }
  // his thanks, once, for what came back (he ends, or walks off): reputation and his wool or cheese a sheep, more for all
  ending(){
    if(this.ended)return;
    this.ended=1;
    const n=this.got||0;
    if(!this.help||!n)return;
    const S=ENC_SHEEP,all=n>=this.n,t=nearHold(),g=this.good(),k=invAdd('good',g,S.good*n);
    if(t)addRep(t.name,S.rep*n+(all?S.all.rep:0),true);
    if(all)P.morale=clamp(P.morale+S.all.morale,0,100);
    updateHUD(true);
    this.say((all?'Every sheep home. ':n+' of his '+this.n+' sheep home. ')+'The shepherd thanks you'+(k?' with '+k+' '+GOODS[g].n.toLowerCase():'')+(t?'; '+t.name+' will hear of it':'')+'.','good');
  }
}
class Stray extends Encounter{
  shepherd(){
    return roadList().find(h=>h.i===this.pk&&!h.gone)||null;
  }
  meet(){
    if(!this.chaseable())return;
    const h=this.shepherd();
    if(h&&h.help&&!h.ended)h.herd(this);
    else this.say('A stray sheep. Its shepherd must be near.');
  }
  ending(){
    const h=this.shepherd();
    if(h)h.check();
  }
  // (sent home: ridden into while its shepherd has your help)
  herded(m){
    const h=this.shepherd();
    if(h&&h.help&&!h.ended&&m.dist<=catchReach()&&!G.modal){
      h.herd(this);
      return true;
    }
    return false;
  }
}
defineKinds('encounter',{trigger:'travelHour'},{
  traveller:{n:'Wounded traveller',ico:'wounded',w:2,ok:()=>true,on:'road',beh:'stay',ends:'die',call:'Help! Over here!',hear:'Someone calls out from the road to the {d}.',trace:'body',tip:'Lying by the road',
    scene:e=>e.healed?[['walk','healed',0,0]]:[['down','traveller',0,0,{blood:1}]],// (tended: up on his feet, bandaged, and on his way)
    text:()=>'A wounded traveller lies by the road, robbed and left for dead. He clutches a purse the bandits missed.',
    facts:e=>[insight(['badly hurt','he will not last the day without help','he has about '+Math.max(1,Math.round(e.end-roadNow()))+' hours left'],'know how long he has'),'a purse: about 20 gold'],
    left:()=>'You leave him to his fate.',
    acts:[{icon:'food',label:'Tend his wounds',facts:()=>roadTendFacts(),need:()=>foodN()<ENC_TUNE.traveller.food&&'You have no food to spare.',tip:ROAD_TEND_TIP,
        run:e=>roadTend(e)},
      {icon:'gold',label:'Take his purse',ask:()=>'Take the last coins of a dying man? Your band will see it, and word gets round.',
        out:()=>{const t=nearHold(),f=t&&FACS[t.owner]&&t.owner;return{gold:20,honor:[f,-5],morale:-3,say:'You take 20 gold. Some of your band look away.'+(f?' Word reaches the '+FACS[f].n+'.':'')}}}]},
  /* the fake wounded (phase 4): the wounded traveller to the eye (his name, picture, call, page and choices), bandits lying in the
     woods by the road, a band the size of an ambush's (mustered when he comes: band, foes). Scouting warn sees the brush move,
     count how many and the odds; below it, his page is the real one's, and helping him (or robbing him) springs the ambush. Warned:
     come ready (no ambush edge), or call them out (they show themselves: fight, or leave; a small band may run). Left be, the
     bandits move on (after: the word on the road) */
  lure:{n:'Wounded traveller',wn:'Fake wounded (a lure)',ico:'wounded',w:1,wf:()=>roadLureW(),ok:(c=storyCtx())=>c.troops>=3,on:'lure',beh:'stay',ends:'unseen',call:'Help! Over here!',hear:'Someone calls out from the road to the {d}.',tip:'Lying by the road',they:'stay; bandits lie hidden near',
    setup:e=>{e.band=roadBand(e.x,e.y);e.foes=makeEnemies(roadBandN(),false,e.band)},
    scene:e=>e.out?[['stand','traveller',0,0],['soldier','',-9,-3,{band:1,col:ENC_RAIDER,v:1}],['soldier','',9,-4,{band:1,col:ENC_RAIDER,v:3,face:-1}],['soldier','',14,1,{band:1,col:ENC_RAIDER,v:5,face:-1}]]:[['down','traveller',0,0,{blood:1}]],
    text:e=>e.out?'The “wounded man” gets up, grinning. '+e.foes.length+' bandits rise from the brush behind him, weapons out.':ROAD_ENC.traveller.text(e),
    facts:e=>e.out?[e.foes.length+' bandits',roadLureOdds(e)]:[...ROAD_ENC.traveller.facts(e),roadWarned()&&'<span class="bad">something moves in the brush behind him</span>',skill('scout')>=ENC_TUNE.lure.count&&'<span class="bad">'+e.foes.length+' bandits lie in wait: '+roadLureOdds(e)+'</span>'],
    left:e=>e.out?'You ride on. The bandits watch you go.':'You leave him to his fate.',after:()=>'Word on the road: a “wounded man” lay by the road as bait for bandits.',
    acts:[{icon:'food',label:'Tend his wounds',when:e=>!roadWarned(),facts:()=>roadTendFacts(),need:()=>foodN()<ENC_TUNE.traveller.food&&'You have no food to spare.',tip:ROAD_TEND_TIP,run:e=>roadSpring(e)},
      {icon:'gold',label:'Take his purse',when:e=>!roadWarned(),facts:e=>ROAD_ENC.traveller.acts[1].factsFor(e),ask:()=>'Take the last coins of a dying man? Your band will see it, and word gets round.',run:e=>roadSpring(e)},
      {icon:'sword',label:'Approach ready',when:e=>roadWarned()&&!e.out,also:e=>['no ambush: they lose their edge',skill('scout')>=ENC_TUNE.lure.count&&e.foes.length+' bandits'],tip:'Walk up to him with your band closed up and weapons drawn.',
        out:()=>({fight:{amb:true,edge:false},say:'Your band closes up, weapons drawn. The bandits break cover too late.'})},
      {icon:'eye',label:'Call them out',when:e=>roadWarned()&&!e.out,again:true,facts:e=>[e.foes.length<=ENC_TUNE.lure.scare.max?insight(['they may run',oddsWord(roadScare())+' they run','a '+Math.round(roadScare()*100)+'% chance they run'],'know if they run'):'too many to scare off','then fight, or leave'],tip:'Shout to the brush that you see them. Leadership and Charisma may scare a small band off.',
        run:e=>{e.out=1;if(e.foes.length<=ENC_TUNE.lure.scare.max&&Math.random()<roadScare())return{end:true,gone:true,say:'You call them out. Seeing your band ready, they melt back into the woods, their “wounded man” limping after them.'};
          return'You call them out. '+e.foes.length+' bandits rise from the brush, weapons out.'}},
      {icon:'sword',label:'Fight them',when:e=>!!e.out,also:e=>[e.foes.length+' bandits',roadLureOdds(e)],out:()=>({fight:{amb:true,edge:false},say:'You ride at them.'})}]},
  merchant:{n:'Wandering merchant',ico:'stall',w:2,ok:()=>true,on:'road',beh:'approach',call:'Wares! Fine wares!',hear:'A peddler hails you from the road to the {d}.',tip:'A peddler with his pack',
    setup:e=>{e.item=randomGear(0,Math.min(MATERIALS.length-1,1+Math.floor(G.day/15)))},
    scene:()=>[['walk','peddler',0,0]],
    text:e=>{const I=ITEMS[e.item];return 'A travelling peddler opens his pack: a <span style="color:'+RARITY[I.r]+'">'+I.n+'</span> ('+I.d+') for '+roadPrice(e)+' gold.'},
    left:()=>'The peddler shrugs and moves on.',
    acts:[{icon:'gold',label:'Buy it',need:e=>P.gold<roadPrice(e)?'Not enough gold.':!invFree()&&'Your bag is full.',
      out:e=>({gold:-roadPrice(e),gear:e.item,say:'The '+ITEMS[e.item].n+' goes in your bag.'})},ROAD_ASK]},
  // (pilgrims: on the road to the nearest real shrine on the map, or, one near you, already praying at it beside its own picture:
  // roadPilgrims; they draw no shrine of their own)
  pilgrims:{n:'Pilgrims',ico:'altar',w:2,ok:(c=storyCtx())=>c.climate!=='desert'&&roadShrines().length>0,on:'road',beh:'walk',hear:'Pilgrims’ singing drifts from the {d}.',tip:'Pilgrims bound for a shrine',they:'walk to a shrine, or pray at one',
    setup:e=>roadPilgrims(e),heard:e=>{const s=e.pray&&roadShrineOf(e);if(s)s.seen=true},under:e=>{const s=e.pray&&roadShrineOf(e);return s?s.view().ps:[]},
    scene:e=>(e.pray?[['kneel','pilgrim',-10,-3,{v:1}],['kneel','pilgrim',10,-2,{v:2,face:-1}],['stand','pilgrim',-4,2,{v:3}],['stand','pilgrim',5,3,{v:4,face:-1}]]
      :[['walk','pilgrim',0,0,{v:1}],['walk','pilgrim',-8,1,{v:2}],['walk','pilgrim',-15,-1,{v:3}],['walk','pilgrim',-22,1,{v:4}]]).slice(0,e.n),
    text:e=>roadPraying(e)?'Pilgrims'+(e.to?' from '+e.to:'')+' kneel at the '+e.site+', singing low. Offerings of coin lie in a bowl before its altar.'
      :'Pilgrims'+(e.to?' from '+e.to:'')+(e.left?' walk on from the '+e.site+', their prayers said, singing, a bowl of offerings carried before them.':' walk the road to the '+e.site+', singing, a bowl of offerings carried before them.'),
    facts:e=>[e.n+' pilgrims',e.to&&'they will speak of you in '+e.to],
    left:e=>roadPraying(e)?'You leave them to their prayers.':'They walk on, singing.',
    acts:[{icon:'morale',label:'Pray with them',when:e=>roadPraying(e),out:e=>roadPray(e)},
      {icon:'morale',label:'Walk and pray with them',when:e=>!roadPraying(e),facts:e=>Outcome.facts({hours:ENC_TUNE.pilgrims.walk,...roadPray(e)}),run:e=>{roadHours(ENC_TUNE.pilgrims.walk);return roadPray(e)}},
      {icon:'gold',label:'Give alms',need:()=>P.gold<ENC_TUNE.pilgrims.alms&&'Not enough gold.',
        out:()=>{const x=ENC_TUNE.pilgrims;return{gold:-x.alms,morale:x.almsMorale,xp:x.xp,say:'You feel watched over. (+'+x.xp+' XP)'}}},
      {icon:'sack',label:'Take the coins',ask:()=>'Take the offerings from the pilgrims’ bowl? Nobody will sleep well.',
        out:()=>{const x=ENC_TUNE.pilgrims;return{gold:x.coins,morale:-x.coinsMorale,say:x.coins+' gold richer. Nobody sleeps well that night.'}}},ROAD_ASK]},
  deserters:{n:'Deserters',ico:'troops',w:1.2,ok:(c=storyCtx())=>c.size<c.cap,on:'wild',beh:'stay',tip:'Soldiers with no banner',
    setup:e=>{const t=Spatial.nearestHolding(P.x,P.y);e.race=t.races[0];e.unit=RACES[e.race].melee;e.fac=t.owner&&FACS[t.owner]?t.owner:null;if(e.fac&&P.fac===e.fac)e.beh='flee'},
    scene:e=>[['soldier','',-4,0,{col:roadCol(e),v:1}],['soldier','',5,2,{col:roadCol(e),v:4,face:-1}]],
    text:e=>'Two '+ST[e.unit].n.toLowerCase()+'s who fled their lord ask to join your band for food and 15 gold.',
    facts:e=>[e.fac&&'deserters from the '+FACS[e.fac].n,insight(['soldiers, by their gear','two '+ST[e.unit].n.toLowerCase()+'s, worn but armed','2 × '+ST[e.unit].n+', tier '+ST[e.unit].tier],'know what they are')],
    left:()=>'They vanish into the trees.',
    acts:[{icon:'troops',label:'Take them in',need:e=>P.gold<15?'Not enough gold.':partySize()+2>partyCap()?'No room in your party.':!partyRoster(P).canAdd(e.unit)&&'No free army group.',
        out:e=>({gold:-15,troops:{[e.unit]:2},say:'Two new '+ST[e.unit].n.toLowerCase()+'s fall in line.'})},
      {icon:'prisoners',label:'Turn them in',need:e=>!e.fac&&'They serve no realm.',ask:e=>'Hand them to the '+FACS[e.fac].n+'’s men? Deserters hang.',
        out:e=>({honor:[e.fac,3],gold:10,say:()=>'You hand them over to the '+FACS[e.fac].n+'. The bounty is 10 gold.'})}]},
  gamblers:{n:'Gamblers',ico:'mug',w:1.2,ok:(c=storyCtx())=>c.gold>=20,on:'road',beh:'stay',hear:'Laughter and the rattle of dice to the {d}.',tip:'Soldiers at dice',
    setup:e=>{const t=Spatial.nearestHolding(P.x,P.y);e.race=t.races[0];e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cloth','',0,1],['soldier','',-6,0,{col:roadCol(e),v:0}],['soldier','',6,0,{col:roadCol(e),v:2,face:-1}],['soldier','',1,-4,{col:roadCol(e),v:5}],['fire','',-13,-2]],
    text:()=>'Off-duty soldiers wave you over to a game of bones. Pick your stake.',
    facts:e=>[statRead('dice',{vague:'they seem to win a fair share',rough:p=>p<.5?'the dice favour them a little':'you can read their game',what:'to win a hand',more:'know the odds'}),statHelps('dice'),diceLeft(e)+(diceLeft(e)===1?' hand':' hands')+' left in them'],
    left:()=>'You leave them to it.',
    acts:[10,20,50].map(s=>({icon:'gold',label:'Play for '+s,facts:()=>[s+' gold a hand'],again:true,odds:'dice',need:()=>P.gold<s&&'Not enough gold.',
      run:(e,c)=>{const w=c.roll(),o={gold:w?s:-s};e.hands=(e.hands||0)+1;e.net=(e.net||0)+(w?s:-s);const m=w?'You win '+s+' gold. They grumble.':'You lose '+s+' gold. They laugh.';
        if(e.net>=ENC_GAMBLE.quit)return{...o,end:true,say:m+' "Enough! You have had enough of our coin." They sweep up the bones.'};
        if(diceLeft(e)<=0)return{...o,end:true,say:m+' "That is the last hand," they say, and pack up the bones.'};return{...o,say:m}}}))},
  mine:{n:'Collapsed mine',ico:'pick',w:2,ok:(c=storyCtx())=>c.terrain===T_HILL||c.byMountains,on:'hill',beh:'stay',ends:'unseen',tip:'An old shaft in the hillside',
    scene:()=>[['bld','minehead',0,2]],
    text:()=>'A collapsed mine shaft opens into the hillside. Old carts still sit inside.',
    facts:()=>[statRead('mine',{vague:'the timbers creak',rough:p=>p<.75?'the tunnels look unsafe, though more hold than fall':'you can tell which tunnels will hold',exact:p=>Math.round(p*100)+'% the tunnels hold: iron inside, and a '+Math.round(statOdds('mineGear')*100)+'% chance of gear',more:'know the risk'}),statHelps('mine')],
    left:()=>'You mark it on your map and move on.',
    acts:[{icon:'pick',label:'Search it',facts:()=>['iron, maybe gear','a cave-in may cost you'],odds:'mine',tip:'Go in with lamps and see what is left.',
      // (both rolls first, then the haul: the iron into your bag before the gear, as ever)
      run:(e,c)=>{if(c.roll()){const id=Math.random()<statOdds('mineGear')?randomGear(1,3):null;
          return{goods:{iron:5},...(id?{gear:id}:{}),say:r=>'The tunnels hold. You haul out '+r.goods.iron+' iron.'+(r.gear?' Deep inside lies a '+ITEMS[id].n+'.':'')}}
        const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);if(ks.length){const k=ks[rint(0,ks.length-1)];return{lose:k,say:'A tunnel caves in. You lose '+an(ST[k].n.toLowerCase())+'.'}}return{morale:-8,say:'A tunnel caves in. You barely crawl out.'}}}]},
  hunters:{n:'Hunters’ camp',ico:'fire',w:2,ok:(c=storyCtx())=>c.terrain===T_FOREST||c.climate==='frost',on:'wood',beh:'stay',hear:'Smoke rises from a hunters’ fire to the {d}.',tip:'Hunters drying pelts by a fire',
    scene:()=>[['bld','tent',-12,1],['prop','woodpile',13,0],['fire','',2,2],['stand','hunter',-3,5,{v:1}],['stand','hunter',8,5,{v:2,face:-1}]],
    text:()=>'A camp of hunters drying pelts by the fire.',
    left:()=>'You nod and ride past.',
    acts:[{icon:'furs',label:'Buy 3 furs',need:()=>P.gold<15?'Not enough gold.':goodRoom('furs')<3&&'No room in your bag.',out:()=>({gold:-15,goods:{furs:3},say:'Three warm furs for the road.'})},
      {icon:'eye',label:'Join the hunt',also:()=>[statHelps('hunt')],tip:'Ride with them after deer. Survival, Hunting and Archery bring home more.',
        out:()=>{const x=ENC_TUNE.hunters,h=roadHaul();return{xp:x.xp,train:['scout',8],goods:h.furs?{meat:h.meat,furs:h.furs}:{meat:h.meat},say:r=>'A good chase. (+'+x.xp+' XP, '+r.goods.meat+' meat'+(r.goods.furs?', '+r.goods.furs+' furs':'')+')'}}}]},
  child:{n:'Lost child',ico:'people',w:1,ok:(c=storyCtx())=>!!c.nearHold,on:'road',beh:'approach',call:'Please, help me!',hear:'A child is crying on the road to the {d}.',tip:'A child alone',
    setup:e=>{const t=nearHold();e.to=t.name;e.race=t.races[0]},
    scene:()=>[['walk','child',0,0]],
    text:e=>'A lost child sits crying by the road. She says she lives in '+e.to+'.',
    left:()=>'She trudges off toward home.',
    acts:[{icon:'house',label:'Take her home',out:e=>{const t=townBy(e.to);return{rep:[t&&t.name,6],morale:5,say:'Her family in '+e.to+' will not forget you.'}}}]},
  bard:{n:'Wandering bard',ico:'renown',w:1.2,wf:()=>1+Math.min(1,P.renown/60),ok:()=>true,on:'road',beh:'approach',call:'A song for a hero?',hear:'A lute plays on the road to the {d}.',tip:'A bard with a lute',
    scene:()=>[['walk','bard',0,0]],
    text:()=>'A wandering bard offers to make a song of your deeds.',
    left:()=>'He sings something rude as he leaves.',
    acts:[{icon:'renown',label:'Hear his song',need:()=>P.gold<10&&'Not enough gold.',out:()=>({gold:-10,morale:8,renown:2,say:'The song spreads from tavern to tavern. (+2 renown)'})},ROAD_ASK]},
  wisps:{n:'Will-o’-wisps',ico:'moon',w:3,ok:(c=storyCtx())=>c.climate==='swamp'&&c.dark>0,on:'bog',beh:'flee',glow:true,vanish:true,hear:'Pale lights flicker over the bog to the {d}.',tip:'Pale lights over the bog',
    scene:()=>[['wisp','',0,0,{v:0}],['wisp','',-9,-3,{v:1}],['wisp','',8,-6,{v:2}]],
    text:()=>'Pale lights dance over the bog, drifting deeper into the mire.',
    facts:()=>[statRead('wisps',{vague:'who knows where they lead',rough:p=>p<.6?'half the tales end in treasure':'you know the old tales: most end in treasure',exact:p=>Math.round(p*100)+'%: 40 gold, or a night lost',more:'know the tales'}),statHelps('wisps')],
    left:()=>'The lights fade behind you.',
    acts:[{icon:'moon',label:'Follow them',facts:()=>['treasure, or a night lost'],odds:'wisps',run:(e,c)=>c.roll()?{gold:40,say:'They lead to a drowned chest with 40 gold.'}:{morale:-6,say:'They lead you in circles until dawn.'}}]},
  caravan:{n:'Caravan under attack',ico:'sword',w:1.2,ok:(c=storyCtx())=>c.troops>=3,on:'road',beh:'scene',goes:p=>!!(p[4]&&p[4].band),call:'Raiders! Help us!',hear:'Shouts and the clash of steel on the road to the {d}.',trace:'wreck',foe:true,tip:'Raiders falling on a caravan',
    setup:e=>{e.n=rint(4,6)+Math.floor(G.day/15);const t=Spatial.nearestHolding(P.x,P.y);e.fac=t.owner&&FACS[t.owner]?t.owner:null},
    scene:e=>[['cart','',0,0,{col:roadCol(e)}],['soldier','',18,2,{col:roadCol(e),v:2}],['soldier','',20,-3,{col:roadCol(e),v:4}],['dust','',25,0],['soldier','',29,1,{band:1,col:ENC_RAIDER,v:1,face:-1}],['soldier','',32,-3,{band:1,col:ENC_RAIDER,v:4,face:-1}],['soldier','',30,5,{band:1,col:ENC_RAIDER,v:5,face:-1}]],
    text:()=>'A merchant caravan is under attack by raiders just ahead.',
    facts:e=>[insight(['raiders','about '+roughly(e.n)+' raiders',e.n+' raiders'],'know how many'),'it will not hold out long'],
    left:()=>'You wait until the screams stop.',
    acts:[{icon:'sword',label:'Join the fight',also:e=>[insight(['raiders','about '+roughly(e.n),e.n+' raiders'],'know how many')],out:()=>({fight:true,say:'You draw steel and ride at the raiders.'})}]},
  ambush:{n:'Ambush',ico:'sword',w:1.5,ok:(c=storyCtx())=>TERRAIN.on&&c.troops>=3&&!!c.cover,on:'cover',beh:'stay',ends:'unseen',hidden:true,spring:true,forced:true,vanish:true,foe:true,call:'Movement in the trees…',hear:null,tip:'Movement in the trees',
    scene:()=>[['soldier','',-4,0,{band:1,col:ENC_RAIDER,v:1,a:.7}],['soldier','',5,-2,{band:1,col:ENC_RAIDER,v:3,face:-1,a:.7}]],
    text:e=>'The road runs on between '+COVER_SAY[coverAt(e.x,e.y)||'field']+'. No birdsong. Too late, your outriders see the glint of steel beside the road: an ambush.',
    acts:[{icon:'sword',label:'Close up and fight',also:()=>['caught in their trap'],out:()=>({fight:{amb:true},say:'Your band closes up on the road, weapons drawn.'})},
      {icon:'exit',label:'Cut the baggage loose and run',out:()=>({food:-4,gold:{n:-15,min:0},morale:-4,say:'You leave the baggage to them and ride hard. They are too busy looting to follow.'})}]},
  refugees:{n:'Refugees',ico:'people',w:2,ok:()=>true,on:'road',beh:'approach',call:'Spare some bread, friend?',hear:'A family with a cart hails you from the road to the {d}.',tip:'A family with a cart',
    scene:()=>[['cart','',0,0,{col:'#9a8a6a'}],['refugee','',-19,1,{v:0}],['refugee','',-24,-2,{v:1}],['walk','child',-14,3,{v:2}]],
    text:()=>'Refugee farmers on the road with all they own on a cart, a child at their heels.',
    left:()=>'They trudge on.',
    acts:[{icon:'troops',label:'Escort them',also:()=>['safe passage'],out:()=>({goods:{grain:4},renown:1,say:r=>'Refugee farmers thank you for safe passage and leave you '+r.goods.grain+' grain.'})},
      {icon:'food',label:'Give food',need:()=>foodN()<3&&'You have no food to spare.',out:()=>({food:-3,renown:1,morale:3,mood:'kind',say:'They eat their first warm meal in days and bless your name.'})},ROAD_FLED]},
  warning:{n:'Shepherd’s warning',ico:'sheep',w:1,ok:()=>true,on:'open',beh:'approach',call:'Raiders about!',hear:'A shepherd waves to you from the {d}.',tip:'A shepherd and his flock',
    scene:()=>[['worker','herder',0,0],['beast','sheep',-8,1,{v:0}],['beast','sheep',-13,-2,{v:3}],['beast','sheep',-6,-3,{v:5}]],
    text:()=>'A shepherd leaves his flock and hurries over, waving his crook.',
    left:()=>'He goes back to his sheep, shaking his head.',
    acts:[{icon:'eye',label:'Listen',out:()=>({train:['scout',6],band:true,say:r=>'He warns of raiders on the move'+(r.band?' to the '+compass(r.band.x-P.x,r.band.y-P.y):'')+'. You keep your eyes open.'})}]},
  sheep:{n:'Strayed sheep',ico:'sheep',w:1.2,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&!['desert','swamp'].includes(c.climate),on:'open',beh:'stay',call:'My sheep! They have scattered!',
    hear:'A shepherd shouts after his flock to the {d}.',tip:'A shepherd, his flock scattered',they:'stay; his strays graze about and shy from you',
    cls:Shepherd,
    scene:e=>[['worker','herder',0,0],...ROAD_FLOCK.slice(0,e.got||0).map(([dx,dy],i)=>['beast','sheep',dx,dy,{v:i}])],
    text:e=>e.help?'The shepherd waits with '+(e.got?'the '+e.got+' you have brought back':'his crook raised')+'. '+e.astray()+' still astray.':'A shepherd runs about, crook raised: his sheep have scattered across the fields.',
    facts:e=>[e.n+' sheep astray',e.help&&(e.got||0)+' back with him','ride into each stray to drive it home','Agility lets you grab them from farther'],
    left:e=>e.help?'You leave the shepherd to his sheep.':'He goes on calling after his flock.',
    acts:[{icon:'sheep',label:'Round them up',again:true,when:e=>!e.help,facts:e=>['ride after each stray','reputation and '+GOODS[sheepGood(e)].n.toLowerCase()+' for each one back'],tip:'Ride out after them and drive them back to him.',
      run:e=>{e.help=1;e.end=Math.max(e.end,roadNow()+ENC_SHEEP.hours);for(const o of e.strays()){o.seen=1;o.end=e.end}return'You ride out after the strays. Ride into each one to send it home.'}}]},
  // ---- phase 2: the new ones (their numbers: ENC_TUNE)
  mud:{n:'Cart stuck in the mud',ico:'wheat',w:1.5,ok:(c=storyCtx())=>c.isDay&&c.climate!=='desert',on:'mud',beh:'stay',call:'Give us a push!',hear:'Someone shouts for help with a cart on the road to the {d}.',trace:'cart',tip:'A farmer and his cart, stuck fast',
    setup:e=>{const x=ENC_TUNE.mud,t=Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0];e.got=rint(x.give[0],x.give[1]);e.load=rint(x.goods[0],x.goods[1]);e.coins=rint(x.coins[0],x.coins[1])},
    scene:()=>[['mud','',-6,0],['cart','',0,0,{col:'#9a8a6a'}],['worker','farmer',-17,1]],
    text:e=>'A farmer from '+e.home+' leans on the back of his cart, its wheels sunk to the hubs in the mud. His ox strains and gets nowhere.',
    facts:e=>['a load of grain for '+e.home],
    left:()=>'You leave him to his mud.',
    acts:[{icon:'hero',label:'Help push',also:()=>[statHelps('push')],tip:'Put your shoulder to the wheel. Strength and Athletics make it quicker work.',
        out:e=>({...(roadPush()?{sp:-roadPushSp()}:{hours:roadPushH()}),rep:[e.home,ENC_TUNE.mud.rep],goods:{grain:e.got},mood:'kind',say:r=>'The cart lurches free. The farmer thanks you'+(r.goods.grain?' with '+r.goods.grain+' grain':'')+' and will speak well of you in '+e.home+'.'})},
      {icon:'bag',label:'Rob',ask:e=>'Rob a farmer of '+e.home+' stuck in the mud? '+e.home+' will hear of it, and its workers will keep off the fields.',
        out:e=>({goods:{grain:e.load},gold:e.coins,wrong:[townBy(e.home),CONDUCT.robWorker],mood:'cruel',say:r=>'You take '+(r.goods.grain?r.goods.grain+' grain and ':'')+e.coins+' coins from his cart.'+(r.cost?' It costs you: '+r.cost+'.':'')})}]},
  thief:{n:'Thief on the run',ico:'bag',w:1.2,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold,on:'road',near:[0,20],beh:'flee',life:'run',far:true,leave:'Let go',call:'Stop, thief!',hear:'Someone shouts “Stop, thief!” on the road to the {d}.',tip:'A man running off with a purse',they:'run across your view',
    setup:e=>{const x=ENC_TUNE.thief,t=nearHold()||Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0];e.fac=roadFac(t);e.purse=rint(x.purse[0],x.purse[1]);e.vx=e.x;e.vy=e.y;roadAcross(e)},
    scene:e=>[['walk','thief',0,0],['stand','victim',0,0,{at:[e.vx,e.vy],face:e.x>=e.vx?1:-1}]],
    text:e=>e.nab?'You run the thief down. He throws the purse at your feet: '+e.purse+' gold.':'A man sprints off with a purse in his fist. Back on the road its owner, a merchant of '+e.home+', shouts after him.',
    facts:e=>e.nab?[]:[roadChaseRead(e),'a stolen purse: about '+e.purse+' gold'],
    left:()=>'You let him run.',lost:'The thief slips away. You have lost him.',forced:e=>!!e.nab,
    acts:[{icon:'speed',label:'Chase',when:e=>!e.nab,also:()=>['Agility and Riding help'],tip:'After him, before he gets away.',out:()=>({chase:true})},
      {icon:'gold',label:'Return the purse',when:e=>!!e.nab,
        out:e=>{const x=ENC_TUNE.thief;return{gold:x.reward,rep:[e.home,x.rep],mood:'kind',say:'You hand the purse back. Its owner pays you '+x.reward+' gold and will speak well of you in '+e.home+'.'}}},
      {icon:'bag',label:'Keep it',when:e=>!!e.nab,ask:()=>'Keep the stolen purse for yourself? Its owner saw who caught the thief.',
        out:e=>({gold:e.purse,honor:[e.fac,-ENC_TUNE.thief.honor],say:'You pocket the '+e.purse+' gold and send the thief off with a kick.'+(e.fac?' Word reaches the '+FACS[e.fac].n+'.':'')})}]},
  poacher:{n:'Poacher',ico:'furs',w:1.5,ok:(c=storyCtx())=>!!c.owned&&c.climate!=='frost'&&c.by(T_FOREST,4),on:'lordwood',beh:'stay',goes:()=>true,wary:()=>{const x=ENC_TUNE.poacher;return Math.max(.4,x.see-x.scout*skill('scout'))},tip:'A hunter with a deer, in a lord’s wood',they:'stay; run if he sees you first',
    setup:e=>{const t=roadOwned(e.x,e.y)||Spatial.nearestHolding(e.x,e.y);e.home=t.name;e.race=t.races[0]},
    scene:()=>[['carcass','deer',7,1],['stand','hunter',-4,0,{v:1}]],
    text:e=>'A man in a hood kneels over a deer he has brought down in the woods of '+e.home+'. The hunting here is its lord’s alone.',
    facts:e=>['the deer is the lord of '+e.home+'’s'],
    left:()=>'He drags the deer off into the trees.',
    acts:[{icon:'prisoners',label:'Turn him in',
        out:e=>{const x=ENC_TUNE.poacher;return{rep:[e.home,x.rep],gold:x.bounty,say:'You march him to the reeve of '+e.home+', who pays a '+x.bounty+'-gold bounty.'}}},
      {icon:'food',label:'Buy the meat',need:()=>P.gold<ENC_TUNE.poacher.price?'Not enough gold.':goodRoom('meat')<1&&'No room in your bag.',
        out:()=>{const x=ENC_TUNE.poacher;return{gold:-x.price,goods:{meat:x.meat},say:r=>'He sells you '+r.goods.meat+' meat, cheap, and melts into the trees.'}}}]},
  funeral:{n:'Funeral procession',ico:'altar',w:1,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&roadSites().length>0,on:'road',beh:'walk',hear:'A slow dirge drifts from the road to the {d}.',tip:'Mourners bearing a bier',
    setup:e=>{const x=ENC_TUNE.funeral,t=Spatial.nearestHolding(e.x,e.y),s=roadGoal(e,roadSites());if(!s)return false;e.home=t.name;e.race=t.races[0];e.fac=roadFac(t);e.n=rint(x.n[0],x.n[1]);e.gx=s.x;e.gy=s.y+10;e.site=s.name;roadWalkEnd(e)},
    scene:e=>[['walk','mourner',8,0,{v:0}],['down','shroud',0,-3,{v:5}],['walk','mourner',-8,0,{v:1}],...[[-16,-1],[-22,2],[-28,0]].slice(0,e.n-2).map(([dx,dy],i)=>['walk','mourner',dx,dy,{v:i+2}])],
    text:e=>'Mourners from '+e.home+(e.left?' walk home from the '+e.site+', their dead laid to rest.':e.pray?' stand by their dead at the '+e.site+', heads bowed.':' bear one of their dead on a bier to the '+e.site+', singing low.'),
    facts:e=>[e.n+' mourners'],
    left:()=>'They pass on, still singing.',
    acts:[{icon:'altar',label:'Pay respects',also:()=>[statHelps('respect')],
      out:e=>{const x=ENC_TUNE.funeral;return{honor:[e.fac,statMore('respect',x.honor)],morale:statMore('respect',x.morale),say:'You bare your head as the bier passes. The mourners nod their thanks.'}}}]},
  wedding:{n:'Wedding party',ico:'mug',w:1,wf:()=>P.morale<50?1.5:1,ok:(c=storyCtx())=>c.isDay&&!!c.nearHold&&TOWNS.filter(z=>Math.hypot(z.x-P.x,z.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]).length>1,on:'road',beh:'walk',call:'Drink to the bride!',hear:'Music and laughter on the road to the {d}.',tip:'A wedding party with a lute player',
    setup:e=>{const t=Spatial.nearestHolding(e.x,e.y),to=roadGoal(e,TOWNS.filter(z=>z!==t));if(!to)return false;e.home=t.name;e.tw=to.name;e.race=t.races[0];roadWalkEnd(e)},
    scene:()=>[['notes','',12,0],['walk','bard',12,0],['walk','villager',3,-1,{v:1}],['walk','villager',-3,2,{v:2}],['walk','villager',-11,0,{v:3}],['walk','villager',-17,2,{v:4}]],
    text:e=>'A wedding party from '+e.home+' dances along the road to '+e.tw+' behind a lute player, the bride in flowers.',
    left:()=>'Their music fades behind you.',
    acts:[{icon:'mug',label:'Join',also:()=>[statHelps('respect')],out:()=>{const x=ENC_TUNE.wedding;return{hours:x.hours,morale:statMore('respect',x.morale),say:'You drink to the bride and dance a while. Your band marches on merrier.'}}},
      {icon:'gold',label:'Give a gift',also:()=>[statHelps('respect')],need:()=>P.gold<ENC_TUNE.wedding.gift&&'Not enough gold.',
        out:e=>{const x=ENC_TUNE.wedding;return{gold:-x.gift,rep:[e.home,statMore('respect',x.rep)],say:'The couple thank you, and '+e.home+' will remember your gift.'}}}]},
  horse:{n:'Runaway horse',ico:'shoe',w:1,wf:()=>P.gear.mount?1:1.5,ok:(c=storyCtx())=>c.climate!=='swamp',on:'open',beh:'flee',life:'stay',ends:'leave',stop:true,spook:ENC_CATCH.spook,tip:'A saddled horse, no rider',they:'bolt, then graze',
    setup:e=>{e.mk=roadMount(e);e.stop=rint(ENC_CATCH.bolt[0],ENC_CATCH.bolt[1]);e.coat=['horse','chestnut','horseB','horseG'][e.seed%4]},
    scene:e=>[['horse','',0,0,{coat:e.coat}]],
    text:e=>'A saddled '+(e.mk==='horse'?'horse':MOUNTS[e.mk].n.toLowerCase())+' with no rider, its reins trailing, '+(e.calm?'grazing by the way. It keeps one eye on you.':'wild-eyed.'),
    facts:e=>[statRead('horse',{vague:'skittish',what:'to catch it'}),statHelps('horse'),P.gear.mount?'you have a mount: it is worth '+itemPrice('m_'+e.mk)+' gold':'a '+MOUNTS[e.mk].n],
    left:()=>'You leave it to its grazing.',
    acts:[{icon:'shoe',label:'Catch it',facts:e=>[P.gear.mount?'+'+itemPrice('m_'+e.mk)+' gold':'a '+MOUNTS[e.mk].n],tip:'Walk up slowly and take the reins. Fail and it bolts.',run:e=>roadCatchHorse(e)}]},
  beggar:{n:'Beggar',ico:'gold',w:1.2,wf:()=>P.gold>=200?1.5:1,ok:(c=storyCtx())=>!!c.nearHold,on:'road',beh:'approach',leave:'Ignore',call:'Alms, my lord?',hear:'An old man calls to you from the road to the {d}.',tip:'An old man with a bowl',
    setup:e=>{const t=Spatial.nearestHolding(e.x,e.y);e.race=t.races[0];e.fac=roadFac(t)},
    scene:()=>[['walk','beggar',0,0]],
    text:()=>'An old man in rags hobbles up and holds out a wooden bowl. His hands shake.',
    left:()=>'You ride on. He calls a blessing after you anyway.',
    acts:ENC_TUNE.beggar.gold.map((g,i)=>({icon:'gold',label:'Give '+g+' gold',need:()=>P.gold<g&&'Not enough gold.',
      out:e=>{const h=ENC_TUNE.beggar.honor[i];return{gold:-g,...(e.fac?{honor:[e.fac,h]}:{morale:2*h}),mood:'kind',say:'He blesses you and your band. ('+g+' gold given)'}}}))},
  messenger:{n:'Messenger',ico:'scroll',w:1,ok:()=>FIDS.length>0,on:'road',beh:'approach',spd:'ride',call:'News from the realm!',hear:'Hoofbeats: a rider on the road to the {d}.',tip:'A realm’s rider',
    setup:e=>{const x=ENC_TUNE.messenger,t=Spatial.nearestHolding(e.x,e.y),f=roadFac(t)||FIDS.filter(k=>k!=='player')[rint(0,FIDS.filter(k=>k!=='player').length-1)],h=Spatial.nearestHolding(e.x,e.y,z=>z.owner===f)||t;
      e.fac=f;e.home=h.name;e.race=h.races[0];e.purse=rint(x.purse[0],x.purse[1]);e.coat=['horse','chestnut','horseB'][e.seed%3];e.letter=letterMake(e)},
    scene:e=>[['rider','messenger',0,0,{col:roadCol(e),coat:e.coat}]],
    text:e=>'A rider in the colours of the '+FACS[e.fac].n+' reins in beside you, a sealed letter in his satchel.',
    facts:e=>['bound for '+e.letter.to],
    left:()=>'He spurs on.',
    acts:[{icon:'scroll',label:'Read the news',facts:()=>['a rumour: a place, a lord or a war'],run:e=>{const it=roadRumour(e);return 'He tells you the news: '+roadNews()+'.'+(it?' And from the road: “'+rumourText(it)+'”':'')}},
      {icon:'bag',label:'Rob',also:e=>['his sealed letter, to '+e.letter.to],ask:e=>'Rob a rider of the '+FACS[e.fac].n+'? His realm will hear of it.',
        out:e=>({gold:e.purse,wrong:[townBy(e.home),CONDUCT.robMessenger],call:()=>letterTake(e),mood:'cruel',say:r=>'You take his purse ('+e.purse+' gold)'+r.call+'.'+(r.cost?' It costs you: '+r.cost+'.':'')})}]}
});
// (the road's kinds, by id: the pity timer's bucket, as the tests and the wiki read them)
const ROAD_ENC=Kinds.view('encounter','travelHour');
// (each kind's choices as Choices: story/choice.js, the shared ones kept as they are)
for(const D of Object.values(ROAD_ENC))D.acts=Choice.list(D.acts);
// (the realm a holding's people answer to: none for yours, or none at all)
const roadFac=t=>t&&t.owner&&t.owner!=='player'&&FACS[t.owner]?t.owner:null;
/* pushing a cart (ENC_TUNE.mud), less by your Strength and Athletics (ENC_STAT.push): its stamina, if you have that much left;
   else its time */
const roadPushSp=()=>Math.round(ENC_TUNE.mud.sp*(1-statOdds('push'))),roadPushH=()=>ENC_TUNE.mud.hours*(1-statOdds('push'));
const roadPush=()=>(P.sp||0)>=roadPushSp();
/* Tend his wounds (the real wounded traveller, ENC_TUNE.traveller): he always mends; your Medicine and Intellect, how well
   (ENC_STAT.care, 0–1: kept on him as e.care, for what may follow), and the more he owes you: reputation and renown × (1 + it),
   and a chance (gift × it) he presses a little gold from his purse on you. The lure shows the same (its tend springs the ambush) */
const roadCareWord=c=>c<.25?'he will live':c<.5?'he will mend':c<.8?'he will recover well':'he will be on his feet in days';
const roadTendFacts=()=>{const x=ENC_TUNE.traveller,c=statOdds('care');return['−'+x.food+' food','reputation +'+statMore('care',x.rep)+', renown +'+statMore('care',x.renown),'Medicine: '+roadCareWord(c),c>0&&'maybe a gift from his purse']};
// (he is on his feet and his gift rolled first, then the outcome: the food, the word of you, the gold; nothing of yours is read
// in between, and the one draw is the same)
function roadTend(e){const x=ENC_TUNE.traveller,c=statOdds('care'),t=nearHold();
  e.care=Math.round(c*100)/100;e.healed=1;e.done=1;e.goOff();const g=c>0&&Math.random()<c*x.gift?rint(x.gold[0],x.gold[1]):0;
  return{food:-x.food,rep:[t&&t.name,statMore('care',x.rep)],renown:statMore('care',x.renown),gold:g,
    say:'Bandaged and fed, he gets to his feet. He swears to tell '+(t?t.name:'everyone')+' of your kindness, and '+(c<.5?'limps':'walks')+' off down the road.'+(g?' He presses '+g+' gold from his purse into your hand.':'')}}
// Join the hunt (ENC_TUNE.hunters): the haul, more by your Survival, Hunting and Archery (ENC_STAT.hunt): meat × (1 + it), furs × it
const roadHaul=()=>{const x=ENC_TUNE.hunters,h=statOdds('hunt');return{meat:Math.round(x.meat*(1+h)),furs:Math.round(x.furs*h)}};
// (a runaway's kind: the mount of the region, by its climate)
const roadMount=e=>({desert:'camel',swamp:'strider',frost:'pony'})[climAt(e.x,e.y)]||'horse';
// (one running across your view: from where it starts toward a point beside you, a little over a third of your sight to one
// side, and on)
function roadAcross(e){const V=vis(),ux=P.x-e.x,uy=P.y-e.y,L=Math.hypot(ux,uy)||1,s=Math.random()<.5?1:-1,qx=P.x-uy/L*s*V*.35,qy=P.y+ux/L*s*V*.35,M=Math.hypot(qx-e.x,qy-e.y)||1;
  e.hx=(qx-e.x)/M;e.hy=(qy-e.y)/M;e.x+=e.hx*10;e.y+=e.hy*10}
/* a procession's places to go: the shrines and ruins near you; its goal, of those (or of the holdings), the one whose way passes
   nearest you (the least detour from where it is through you), not too near, not too far to walk in its time (ENC_WALK), and
   reachable; its time: as long as its walk takes, at least and at most ENC_LIFE.walk's */
const roadSites=()=>W.sites.filter(s=>(s.type==='shrine'||s.type==='ruins')&&Math.hypot(s.x-P.x,s.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]);
const roadWalkHour=()=>moveStep(ENC_SPD.walk,Clock.hourSecs());// (px a procession walks in an hour)
const roadWalkFar=()=>ENC_LIFE.walk[1]*roadWalkHour()*ENC_WALK.wind;// (the farthest, as the crow flies, it walks in its time)
function roadGoal(e,ps){let best=null,bs=Infinity;const far=roadWalkFar();
  for(const p of ps){const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<ENC_WALK.min||d>far||!Router.reach(e,p))continue;
    const s=Math.hypot(P.x-e.x,P.y-e.y)+Math.hypot(p.x-P.x,p.y-P.y)-d;if(s<bs){bs=s;best=p}}return best}
function roadWalkEnd(e){const g=e.goal(),L=ENC_LIFE.walk;e.end=e.t0+clamp(Math.hypot(g.x-e.x,g.y-e.y)/roadWalkHour()/ENC_WALK.wind+.5,L[0],L[1])}
/* the pilgrims and the real shrines (sites.js): the shrines near you (as a procession's places, ENC_WALK.far); a shrine just past
   your sight (ENC_SPAWN.near's ring), with open ground before it: they are found praying there (stay: before its altar, by its
   own picture on the map, from dy px under its point; heard or seen, the shrine is known: drawn, and on their page's banner); else they walk the roads to the nearest shrine they can reach in their
   time, and end there. None: they do not come */
const ENC_PRAY={dy:12};
const roadShrines=()=>W.sites.filter(s=>s.type==='shrine'&&Math.hypot(s.x-P.x,s.y-P.y)<ENC_WALK.far+ENC_SPAWN.near[1]);
const roadShrineOf=e=>e.st?W.sites.find(s=>s.tx===e.st[0]&&s.ty===e.st[1]):null;// (their shrine: st, its tile; names repeat)
function roadPilgrims(e){const x=ENC_TUNE.pilgrims,V=vis(),t=nearHold(),d=(s,o)=>Math.hypot(s.x-o.x,s.y-o.y);e.to=t?t.name:null;e.n=rint(x.n[0],x.n[1]);
  const pray=roadShrines().filter(s=>d(s,P)>=V&&d(s,P)<=V+ENC_SPAWN.near[1]&&passable(tAt(Math.floor(s.x/TILE),Math.floor((s.y+ENC_PRAY.dy)/TILE)))).sort((a,b)=>d(a,P)-d(b,P))[0];
  if(pray){const L=ENC_LIFE.stay;e.pray=1;e.site=pray.name;e.st=[pray.tx,pray.ty];e.x=pray.x;e.y=pray.y+ENC_PRAY.dy;e.dir=1;e.beh='stay';e.d0=d(e,P);e.end=e.t0+L[0]+Math.random()*(L[1]-L[0]);return}
  const far=roadWalkFar(),s=roadShrines().filter(s=>d(s,e)>=ENC_WALK.min&&d(s,e)<=far&&Router.reach(e,s)).sort((a,b)=>d(a,e)-d(b,e))[0];if(!s)return false;
  e.site=s.name;e.st=[s.tx,s.ty];e.gx=s.x;e.gy=s.y+ENC_PRAY.dy;roadWalkEnd(e)}
const roadPraying=e=>!!e.pray&&!e.left;// (at their prayers: at the shrine, not yet walking on)
// (Pray with them: morale, and they speak well of you at home)
function roadPray(e){const x=ENC_TUNE.pilgrims,t=e.to&&townBy(e.to);return{morale:x.morale,rep:[t&&t.name,x.rep],say:'A quiet moment. The band rises calmer.'+(t?' The pilgrims spread good words about you in '+t.name+'.':'')}}
/* the lure (ENC_TUNE.lure): its weight (the night, the wild, the bands and camps near you); warned (Scouting); the odds of its
   band against yours; the chance a call scares a small band off; and the ambush sprung as you help him */
function roadLureW(){const x=ENC_TUNE.lure,nr=o=>Math.hypot(o.x-P.x,o.y-P.y)<x.near,n=bandits.filter(nr).length+W.sites.filter(s=>(s.type==='camp'||s.type==='hideout')&&!s.cleared&&nr(s)).length;
  return Math.min(x.cap,x.w*(darkness()>0?x.night:1)*(landHold(P.x,P.y)?1:x.wild)*(1+x.bandit*Math.min(x.bands,n)))}
const roadWarned=()=>skill('scout')>=ENC_TUNE.lure.warn;
const roadLureOdds=e=>{const [w,c]=odds(rating(e.foes));return '<span class="'+c+'">'+w+'</span> odds'};
const roadScare=()=>{const s=ENC_TUNE.lure.scare;return clamp(s.base+s.lead*skill('lead')+s.cha*P.attr.cha,s.lo,s.hi)};
function roadSpring(e){const m='You kneel beside him, and he grins. Bandits burst from the brush: an ambush!';return{log:[m,'bad'],fight:{amb:true},say:m}}
// the messenger's news: a place you have not found (it goes on your map), where a lord rides, or the wars
function roadNews(){const out=[],s=W.sites.filter(x=>!x.seen&&x.scoutable).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0],
    ls=W.lords.filter(l=>!l.dead&&!l.inside&&l.x>=0&&l.y>=0&&FACS[l.fac]),wars=FIDS.flatMap(a=>FIDS.filter(b=>a<b&&atWar(a,b)).map(b=>[a,b]));
  if(s)out.push(()=>{s.seen=true;return'the '+s.label+' lies to the '+compass(s.x-P.x,s.y-P.y)+'. It is on your map now'});
  if(ls.length)out.push(()=>{const l=ls[rint(0,ls.length-1)];return l.name+' of the '+FACS[l.fac].n+' rides near '+Spatial.nearestHolding(l.x,l.y).name+', to the '+compass(l.x-P.x,l.y-P.y)});
  out.push(()=>{if(!wars.length)return'the realms keep the peace, for now';const w=wars[rint(0,wars.length-1)];return'the '+FACS[w[0]].n+' and the '+FACS[w[1]].n+' are at war'});
  return out[rint(0,out.length-1)]()}
/* the chase and the catch (ENC_CATCH), shared: how fast one you chase runs (by your Agility), how near you must come, the hours
   you would take to close on one dist px away at your sprint (Infinity: never); the odds of a catch by hand (Riding, Agility);
   roadSprint: × your pace on the map while you chase one (world.js updateWorld) */
const roadSprint=()=>G.chase&&G.chase.rd&&G.chase.chase?ENC_CATCH.sprint:1;
const catchSpd=()=>ENC_SPD.run*Math.max(ENC_CATCH.lo,1-ENC_CATCH.agi*P.attr.agi);
const catchReach=()=>ENC_CATCH.reach+ENC_CATCH.agiReach*P.attr.agi;
function catchHours(dist){const g=MAP_BASE*travelMul()*(P.morale<25?.8:1)*ENC_CATCH.sprint-catchSpd();return dist<=catchReach()?0:g>0?(dist-catchReach())/moveStep(g,Clock.hourSecs()):Infinity}
const catchOdds=()=>statOdds('horse');
// (the thief's Insight read: can you run him down, from here)
function roadChaseRead(e){const h=catchHours(e.fromYou()),H=ENC_CATCH.hours;
  return insight(['he runs like a hare',h<=H*.6?'you could run him down':h<=H?'it will be close':'he is too quick for you',h===Infinity?'he runs faster than you: you cannot catch him':'you would close on him in '+h.toFixed(1)+' h; he is away after '+H+' h'],'know if you can catch him')}
// Chase: off his page and after him on the map (G.chase: you follow him) until you have him or he is away (Behaviours.chase)
function roadChase(e){e.chase=roadNow()+ENC_CATCH.hours;e.hx=e.hy=null;G.road=null;G.mode='world';hidePanel();G.chase=e;P.tx=e.x;P.ty=e.y;P.stuck=0;const m='You run after the thief!';log(m);return m}
// Catch it: a Riding check (and Agility); caught, the mount is yours (its worth in gold if you have one); missed, it bolts
function roadCatchHorse(e){const id='m_'+e.mk;train('ride',4);
  if(Math.random()<catchOdds()){e.gone=1;if(!P.gear.mount){P.gear.mount=id;fitInv();return'You take the reins and swing into the saddle: the '+ITEMS[id].n+' is yours.'}
    const g=itemPrice(id);P.gold+=g;return'You take the reins, and sell the '+ITEMS[id].n+' on for '+g+' gold.'}
  e.beh='bolt';return'It shies, rears and bolts. Gone.'}
/* the parts of another (pk: its i), never coming on their own (no trigger): a stray sheep of the shepherd's (its class, Stray:
   it grazes, and trots off from you within ENC_SHEEP.shy; once you help him, ride into it, within catchReach, and it is back
   with the flock) */
const ROAD_PART=defineKinds('encounter',{},{stray:{n:'A stray sheep',ico:'sheep',beh:'graze',part:true,tip:'A sheep astray',cls:Stray,scene:e=>[['beast','sheep',0,0,{v:e.seed%6}]]}});
// (the flock round the shepherd: where each sheep brought back stands, dx, dy)
const ROAD_FLOCK=[[-8,1],[-13,-2],[-6,-3],[8,2],[12,-1],[-10,4]];
// (today's names: the shepherd's good and strays)
const sheepGood=h=>h.good(),sheepStrays=h=>h.strays();
// what an encounter left unresolved leaves when its time is up: the body, the burnt wagon (fading over its last hours; no
// trigger: each an encounter kind, started only by another)
const ROAD_TRACE=defineKinds('encounter',{},{body:{n:'A dead traveller',scene:()=>[['down','traveller',0,0,{blood:1}]]},wreck:{n:'A burnt wagon',scene:()=>[['wreck','',0,0],['smoke','',-1,-6]]},
  cart:{n:'An abandoned cart',scene:()=>[['mud','',0,0],['oldcart','',0,0]]}});
/* ---------- how one ends: nothing ends while you can see it (owner, 2026-10-19). Its time up out of your sight, it ends there
   (its trace, if any); in your sight, it ends its kind's way (its ends, else its behaviour's: story/happening.js Encounter ends),
   and is gone once out of it:
   leave (packs up and walks off, along the road where there is one: its people only (goes), its trace left at once in its
   place, the farmer's cart, the raiders' burnt wagon; one that is running walks off once it has stopped), unseen (stays as it
   is, or runs on, till you are not looking: the mine, the lure, the ambush, one running), die (as unseen, but ENC_LIFE.dying
   hours past his time he dies before your eyes: the wounded traveller). A procession reaching a shrine or ruins in your sight
   stays there a while (ENC_LIFE.pray: the pilgrims kneel, the mourners stand by their dead) and then walks off; at a holding's
   gate it ends (they went in) ---------- */
// (the pieces that walk off: its people (as they walk), or its kind's goes; none left behind (o.at))
const ROAD_GOERS=['walk','stand','kneel','soldier','refugee','worker','beast','rider','horse'];
function roadPieces(e){const ps=e.D.scene(e);if(!e.left)return ps;const f=e.D.goes||(p=>ROAD_GOERS.includes(p[0]));
  return ps.filter(p=>f(p)&&!(p[4]&&p[4].at)).map(p=>p[0]==='stand'||p[0]==='kneel'?['walk',...p.slice(1)]:p)}
/* the way one walking off takes (ENC_OFF): from the road beside it (within near tiles), along the road to the road tile
   farthest from you within steps tiles of it (lg: its tile, saved); none (no road by it, or the road only runs toward you):
   away from you, as once it has come to that tile: to a spot far × your sight from you (la, saved), by the land's ways, round
   water. Its tiles to pass are found again when needed (ROAD_OFF: kept aside) */
const ENC_OFF={near:1,steps:40,far:1.6,offs:[0,.5,-.5,1,-1,1.5,-1.5,2,-2,2.6,-2.6]};
const ROAD_OFF=new WeakMap();
// (the road tile by a point: its own, else the nearest within near tiles; -1: none)
function roadTileBy(x,y){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE),n=ENC_OFF.near;let best=-1,bd=Infinity;
  for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++){const X=tx+i,Y=ty+j;if(tAt(X,Y)!==T_ROAD)continue;const d=Math.hypot((X+.5)*TILE-x,(Y+.5)*TILE-y);if(d<bd){bd=d;best=Y*MW+X}}
  return best}
// (the road tiles within n steps of s, along the road: each one's way back; stop: done once it is found)
function roadAlong(s,n,stop){const from=new Map([[s,-1]]),dep=new Map([[s,0]]),q=[s];
  for(let h=0;h<q.length;h++){const i=q[h],x=i%MW,y=(i-x)/MW,d=dep.get(i);if(i===stop)break;if(d>=n)continue;
    for(let b=-1;b<=1;b++)for(let a=-1;a<=1;a++){const X=x+a,Y=y+b,k=Y*MW+X;if(!a&&!b||X<0||Y<0||X>=MW||Y>=MH||from.has(k)||tAt(X,Y)!==T_ROAD)continue;from.set(k,i);dep.set(k,d+1);q.push(k)}}
  return from}
// (a spot away from you, off.far × your sight from you, it can walk to: the first of its ways (offs, rad from straight away)
// on open ground on its own piece of land; null: none)
function roadAwayAt(e){const R=vis()*ENC_OFF.far,a0=Math.atan2(e.y-P.y,e.x-P.x);
  for(const da of ENC_OFF.offs){const a=a0+da,x=P.x+Math.cos(a)*R,y=P.y+Math.sin(a)*R;if(x>=TILE&&y>=TILE&&x<(MW-1)*TILE&&y<(MH-1)*TILE&&passable(terrAt(x,y))&&Router.reach(e,{x,y}))return[Math.round(x),Math.round(y)]}
  return null}
function roadOffGoal(e){const s=roadTileBy(e.x,e.y);if(s<0)return null;const far=k=>Math.hypot((k%MW+.5)*TILE-P.x,(Math.floor(k/MW)+.5)*TILE-P.y);let best=s,bd=far(s);
  for(const k of roadAlong(s,ENC_OFF.steps).keys()){const d=far(k);if(d>bd){bd=d;best=k}}
  return bd>far(s)+TILE?[best%MW,Math.floor(best/MW)]:null}

/* ---------- its figures: an EncounterScene lays out each kind's pieces from its data (scene(e): [piece, which, dx, dy, opts], dx
   mirrored as it faces left: walk / stand (a person of ENC_LOOK, stepping as it moves), kneel (one kneeling), down (the fallen pose), soldier (a
   follower: a realm's colour, or a band's; down with blood: lying in a pool of it), refugee, worker, beast (a herd's animal), cart (the caravan's), bld (a tent, a
   shrine, a mine's head), prop, fire, cloth (dice on it), wreck; rider (a person of ENC_LOOK on a horse: o.coat, in o.col),
   horse (saddled, no rider), carcass (a herd's beast lying dead), mud, oldcart (the caravan's cart left behind); wisp, dust,
   smoke and notes (music) drawn live), each its feet at its point (o.at: at that point of the map, not with the encounter: one
   left behind as it runs), for the map (draw: each piece by its feet in the depth order, at the encounter's own place to the
   screen's pixel: subT) and for its page's banner (pics). The new kinds' pieces are stand-ins until the props of phase 3 ---------- */
function roadPerson(key,race,v,f){const k='rp'+key+race+v+f;return spr[k]||(spr[k]=mapPerson(ENC_LOOK[key](race,v),f))}
function roadRider(key,race,v,f,col,coat){const k='rr'+key+race+v+f+col+coat;return spr[k]||(spr[k]=mapFigure({...ENC_LOOK[key](race,v),team:col||'leather'},f,coat||'horse'))}
// (a saddled horse with no rider: the map's horse, a saddle and its blanket on its back, a stirrup hanging)
function roadHorse(coat,f){const k='rh'+coat+f;if(spr[k])return spr[k];const g=pgrid(15,8),hs=drawMapHorse(g,coat,f,2,1),L=pal('leather'),R=pal('red');
  hs(3,1,L[2]);hs(4,1,L[1]);hs(5,1,L[1]);hs(6,1,L[2]);hs(4,2,R[1]);hs(5,2,R[2]);hs(4,3,'#27272c');poutline(g);return spr[k]=cellOf(pcanvas(g))}
// (a beast lying dead: its map figure on its back, legs up, in a little blood)
function roadCarcass(id){const k='rpc'+id;if(spr[k])return spr[k];const s=critterSprite(id,0),h=s.ch||s.height;
  return spr[k]=cellOf(mkc(s.width,h+1,g=>{rect(g,'#6e1a18',(s.width>>1)-4,h-1,8,2);rect(g,'#8a2a22',(s.width>>1)-2,h-1,4,1);g.save();g.translate(0,h);g.scale(1,-1);g.drawImage(s,0,s.height-h,s.width,h,0,0,s.width,h);g.restore()}))}
// (kneeling: the standing figure with its thighs folded away, ENC_KNEEL rows from its hips, on the ground)
const ENC_KNEEL=3;
function roadKneel(key,race,v){const k='rpk'+key+race+v;if(spr[k])return spr[k];const s=roadPerson(key,race,v,0),w=s.width,h=s.height,c=h-6;
  return spr[k]=mkc(w,h-ENC_KNEEL,g=>{g.drawImage(s,0,0,w,c,0,0,w,c);g.drawImage(s,0,c+ENC_KNEEL,w,h-c-ENC_KNEEL,0,c,w,h-c-ENC_KNEEL)})}
const roadMud=()=>spr.rpMud||(spr.rpMud=mkc(16,4,g=>{rect(g,'#3e2e20',2,0,12,4);rect(g,'#4e3a28',0,1,16,2);rect(g,'#5e4630',3,1,5,1);rect(g,'#6a5a48',10,2,3,1)}));
// (lying: the figure turned a quarter, head to the right, as the battle's fallen are (sprites.js corpseOf), on the ground)
function roadDown(key,race,v,blood){const k='rpd'+key+race+v+(blood?'b':'');if(spr[k])return spr[k];if(blood){const b=roadDown(key,race,v);return spr[k]=mkc(16,16,g=>{rect(g,'#5a1414',3,13,10,1);rect(g,'#6e1a18',1,14,14,1);rect(g,'#8a2a22',5,14,5,1);rect(g,'#5a1414',3,15,10,1);g.drawImage(b,0,-1)})}
  const L=pturn(mapGrid(ENC_LOOK[key](race,v),0));let h=L.h;
  while(h>1&&!L.p.slice((h-1)*L.w,h*L.w).some(Boolean))h--;L.h=h+1;L.p.length=L.w*L.h;L.p.fill(null,h*L.w);poutline(L);return spr[k]=cellOf(pcanvas(L))}
function roadBld(type,e){const c=climAt(e.x,e.y),sd=e.seed%4,k='rb'+type+sd+c;if(spr[k])return spr[k];
  const b=type==='shrine'?PX.site({type,style:'human',seed:sd,env:c,mat:ROCK_MAT[c],snow:c==='frost',glow:'#7fd8e8'}):PX.building({type,style:'human',seed:sd,snow:c==='frost'});
  return spr[k]=mkc(b.w,b.h,g=>{g.globalAlpha=SHADOW.a;g.drawImage(b.shadow,0,0);g.globalAlpha=1;g.drawImage(b.img,0,0)})}
const roadProp=t=>spr['rpp'+t]||(spr['rpp'+t]=PX.prop({type:t}).img);
const roadFire=()=>spr.rpFire||(spr.rpFire=PX.outline(PX.canvas(8,3,g=>{const P=PX.paint(g),q=PX.part.tone;P.rect(q('stone',1),0,1,8,2);P.rect(q('stone',0),0,1,8,1);P.rect(q('log',1),2,0,4,2);P.px(q('log',0),2,0)})));
const roadCloth=()=>spr.rpCloth||(spr.rpCloth=mkc(7,4,g=>{rect(g,'#1a1c26',0,0,7,4);rect(g,'#8a3a2a',1,1,5,2);rect(g,'#a8483a',1,1,5,1);rect(g,'#f4f0e0',2,1);rect(g,'#f4f0e0',4,2)}));
// (the caravan's cart without its ox and drover: left behind, or, burnt, the burnt wagon: charred)
const roadCart=burnt=>{const k=burnt?'rpWreck':'rpCart';return spr[k]||(spr[k]=cellOf(mkc(14,12,g=>{g.drawImage(caravanSprite('#6a5a48',0),0,20,14,12,0,0,14,12);if(burnt){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(28,20,16,.62)';g.fillRect(0,0,14,12)}})))};
const ROAD_FLIP=new WeakMap(),roadFlip=s=>{let c=ROAD_FLIP.get(s);if(!c){c=mkc(s.width,s.height,g=>{g.scale(-1,1);g.drawImage(s,-s.width,0)});ROAD_FLIP.set(s,c)}return c};
const ROAD_LIVE=['wisp','dust','smoke','notes'];
class EncounterScene{
  // its pieces now: {k, s (the picture, null for one drawn live), x, y (its feet on the map), face, a, o}; still: standing (the banner)
  lay(e,still){const m=e.dir<0?-1:1,go=!still&&mapStepping(e),f=go?frameOf(e,WALK.foot,WALK.n):0,out=[];
    for(const [k,w,dx,dy,o={}] of roadPieces(e)){const fr=go&&!o.at?(f+(o.v||0)*3)%WALK.n:0;
      out.push({k,s:ROAD_LIVE.includes(k)?null:this.pic(k,w,e,o,fr),x:o.at?o.at[0]:e.x+dx*m,y:o.at?o.at[1]:e.y+dy,face:(o.face||1)*(o.at?1:m),a:o.a??1,o})}
    return out}
  pic(k,w,e,o,f){const r=e.race||'human',v=o.v||0;
    return k==='walk'?roadPerson(w,r,v,f):k==='stand'?roadPerson(w,r,v,0):k==='kneel'?roadKneel(w,r,v):k==='down'?roadDown(w,r,v,o.blood):k==='soldier'?followerSprite(o.col||ENC_RAIDER,f,v,r,o.band):k==='refugee'?refugeeSprite(f,v):
      k==='worker'?workerSprite(w,f,r,v):k==='beast'?critterSprite(w,f):k==='cart'?caravanSprite(o.col||'#8a7a5a',f):k==='bld'?roadBld(w,e):k==='prop'?roadProp(w):k==='fire'?roadFire():k==='cloth'?roadCloth():k==='wreck'?roadCart(1):
      k==='rider'?roadRider(w,r,v,f,o.col,o.coat):k==='horse'?roadHorse(o.coat||'horse',f):k==='carcass'?roadCarcass(w):k==='mud'?roadMud():k==='oldcart'?roadCart(0):null}
  // the box it covers on the map [x0, y0, x1, y1] (a click anywhere on it, the highlights round it; not what it left behind)
  box(e){let b=null;for(const p of this.lay(e,true)){if(p.o.at)continue;const w=p.s?p.s.width:12,h=p.s?(p.s.ch||p.s.height):12,x0=Math.round(p.x)-(w>>1),y0=Math.round(p.y)+1-h;
    b=b?[Math.min(b[0],x0),Math.min(b[1],y0),Math.max(b[2],x0+w),Math.max(b[3],p.y+1)]:[x0,y0,x0+w,p.y+1]}
    return b||[e.x-6,e.y-12,e.x+6,e.y+2]}
  // onto the frame's list, each piece by its feet (a trace fading over its last six hours)
  draw(e,ents,cam){const fade=e.trace?clamp((e.end-roadNow())/6,0,1):1,t=performance.now()/1000,rm=reducedMotion();
    for(const p of this.lay(e,false))ents.push({y:p.y,f:()=>{if(!p.o.at)subT(e);const X=Math.round(p.x-cam.x),Y=Math.round(p.y-cam.y);ctx.globalAlpha=p.a*fade;
      if(p.k==='wisp'){const ph=e.seed%7+p.o.v*2.1,x=X+(rm?0:Math.round(Math.sin(t*.9+ph)*3)),y=Y-6+(rm?0:Math.round(Math.sin(t*1.7+ph)*2)),g=ctx.createRadialGradient(x,y,0,x,y,7);
        g.addColorStop(0,'rgba(170,255,235,.55)');g.addColorStop(1,'rgba(120,230,220,0)');ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(x-7,y-7,14,14);ctx.restore();rect(ctx,'#c8fff0',x-1,y-1,2,2);rect(ctx,'#ffffff',x,y-1)}
      else if(p.k==='dust'){for(let i=0;i<5;i++){const a=t*3+i*1.26,r=5+2*Math.sin(t*5+i);ctx.fillStyle='rgba(200,184,150,'+(.35+.15*Math.sin(t*6.7+i)).toFixed(2)+')';ctx.fillRect(Math.round(X+Math.cos(a)*r)-2,Math.round(Y-4+Math.sin(a)*r*.5)-1,3,2)}
        for(let i=-2;i<=2;i++){rect(ctx,'#1a1c26',X+i-1,Y-18+i,3,3);rect(ctx,'#1a1c26',X-i-1,Y-18+i,3,3)}for(let i=-2;i<=2;i++){rect(ctx,'#e4e0cf',X+i,Y-17+i);rect(ctx,'#e4e0cf',X-i,Y-17+i)}// (crossed blades over it, as a fight on the map has)
        if(Math.floor(t*8)%3===0)rect(ctx,'#fff8d0',X+Math.round(Math.sin(t*13)*5),Y-6-Math.round((1+Math.sin(t*7))*3))}
      else if(p.k==='notes'){for(let i=0;i<2;i++){const q=((rm?0:t*.6)+i/2)%1,x=X-3+i*5+Math.round(Math.sin(q*6.3+i)*2),y=Y-17-Math.round(q*9);ctx.globalAlpha=p.a*fade*(1-q);
        for(const [c,ox,oy] of [['#1a1c26',-1,0],['#1a1c26',1,0],['#1a1c26',0,-1],['#1a1c26',0,1],['#fff2c8',0,0]]){rect(ctx,c,x+ox,y+oy,1,3);rect(ctx,c,x-1+ox,y+2+oy,2,1)}}}
      else if(p.k==='smoke'){for(let i=0;i<3;i++){const q=((rm?0:t*.35)+i/3)%1;ctx.fillStyle='rgba(70,64,60,'+(.45*(1-q)).toFixed(2)+')';ctx.fillRect(X+Math.round(Math.sin(q*5+i)*2)-1,Y-Math.round(q*12),2+Math.round(q*2),2)}}
      else{const s=p.s;if(['walk','stand','kneel','soldier','refugee','worker','beast'].includes(p.k)){ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(X-3,Y-1,6,2)}
        ctx.save();ctx.translate(X,Y);if(p.face<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
        if(p.k==='fire'){drawFire(X,Y-1,e.seed);LIGHTQ.push({x:X,y:Y-3,r:22})}}
      ctx.globalAlpha=1}})}
  // its pictures for the page's banner: [picture, x, y (top left, map px), alpha], a fire's flame and the lights as they stand
  pics(e){const out=[];for(const p of this.lay(e,true)){
    if(p.s)out.push([p.face<0?roadFlip(p.s):p.s,Math.round(p.x)-(p.s.width>>1),Math.round(p.y)+1-p.s.height,p.a]);
    if(p.k==='fire'){const fl=spr.flm0||(spr.flm0=PX.flame(0));out.push([fl.img,Math.round(p.x)-fl.ax,Math.round(p.y)-1-fl.ay])}
    if(p.k==='wisp')out.push([spr.rpWisp||(spr.rpWisp=mkc(5,5,g=>{rect(g,'rgba(150,240,225,.45)',0,1,5,3);rect(g,'rgba(150,240,225,.45)',1,0,3,5);rect(g,'#c8fff0',1,1,3,3);rect(g,'#ffffff',2,1)})),Math.round(p.x)-2,Math.round(p.y)-8])}
    return out}
}
const ENC_SCENE=new EncounterScene();

/* ---------- an encounter on the map: story/happening.js Encounter (its record, its moment, how it ends) ---------- */
const ROAD_SAY=new WeakMap();// (when its call-out first showed: real ms, kept aside)
// (while you travel toward a goal, where one hurrying to you meets you on your way: the point ahead you both reach at once, you
// at your pace, it at its own, vo (|r − u·vp·t| = vo·t, its first t); none if it cannot catch you there, or you are not moving: it
// comes straight at you)
function roadWay(o,vo){if(P.tx==null||!(ROAD_AT.m>0))return null;const vx=P.tx-P.x,vy=P.ty-P.y,L=Math.hypot(vx,vy);if(L<1)return null;
  const ux=vx/L,uy=vy/L,vp=MAP_BASE*travelMul(),rx=o.x-P.x,ry=o.y-P.y,a=vp*vp-vo*vo,b=-2*vp*(rx*ux+ry*uy),c=rx*rx+ry*ry;let t=null;
  if(Math.abs(a)<1e-6)t=b<0?-c/b:null;else{const D=b*b-4*a*c;if(D>=0){const q=Math.sqrt(D);t=[(-b-q)/(2*a),(-b+q)/(2*a)].filter(x=>x>0).sort((m,n)=>m-n)[0]??null}}
  if(t==null)return null;const k=Math.min(vp*t,L);return[P.x+ux*k,P.y+uy*k]}
function drawRoad(ents,cam,V){for(const e of roadList())e.draw(ents,cam,V)}

/* ---------- spawning ---------- */
// one of a kind at (x, y): its time by its behaviour (or its life's), the nearest holding's people; facing (its scene laid out
// toward: dir) the open side when only one is (a wood's edge: its camp out of the trees), else you. None if its setup finds no
// way for it from there (a procession with nowhere to go)
const roadOpen=(x,y,i)=>{const q=tAt(Math.floor(x/TILE)+i,Math.floor(y/TILE));return q===T_OPEN||q===T_ROAD};
function roadSpawn(k,x,y){const D=ROAD_ENC[k],R=roadSt(),now=roadNow(),L=ENC_LIFE[D.life||D.beh],t=Spatial.nearestHolding(x,y),side=roadOpen(x,y,1)!==roadOpen(x,y,-1)?(roadOpen(x,y,1)?1:-1):0;
  const e=asRoadEnc({rd:1,i:++R.id,k,x,y,dir:side||(P.x>=x?1:-1),beh:D.beh,race:t&&t.races?t.races[rint(0,t.races.length-1)]:'human',t0:now,end:now+L[0]+Math.random()*(L[1]-L[0]),d0:Math.hypot(x-P.x,y-P.y),seed:rint(1,9999),seen:0,met:0,done:0});
  if(e.setup()===false)return null;R.on.push(e);if(R.day!==G.day){R.day=G.day;R.n=0}R.n++;R.cd[k]=G.day;return e}
// a spot for its ground (ENC_ON): past your sight by near px, ahead of where you are going (within arc; else wider after half the
// tries), on ground you can walk to, nothing built on it, clear of the holdings
function roadSpot(on,arc,near){const S=ENC_SPAWN,V=vis(),fit=ENC_ON[on],a0=P.tx!=null?Math.atan2(P.ty-P.y,P.tx-P.x):Math.random()*6.2832,N=near||S.near;
  for(let i=0;i<S.tries;i++){const a=a0+(Math.random()*2-1)*(arc||S.arc*(i<S.tries/2?1:2.86)),r=V+N[0]+Math.random()*(N[1]-N[0]),x=P.x+Math.cos(a)*r,y=P.y+Math.sin(a)*r,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||occAt(tx,ty)||!fit(tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<S.hold)||!Router.reach(P,{x,y}))continue;
    return[x,y]}
  return null}
const roadW=k=>{const D=ROAD_ENC[k];return D.w*(D.wf?D.wf():1)};
// which comes: of the kinds the pity timer can start (its bucket: story/kinds.js) that can come here and now (not too soon again),
// by weight; tried at its own ground, else another
function roadPick(){const R=roadSt(),c=storyCtx(),ks=Kinds.on('encounter','travelHour').map(K=>K.id).filter(k=>!(R.cd[k]!=null&&G.day-R.cd[k]<ENC_SPAWN.again)&&ROAD_ENC[k].ok(c));
  while(ks.length){let r=Math.random()*ks.reduce((a,k)=>a+roadW(k),0),k=ks[0];for(const q of ks){r-=roadW(q);if(r<=0){k=q;break}}
    const D=ROAD_ENC[k],p=roadSpot(D.on,D.beh==='approach'?ENC_SPAWN.arcTo:0,D.near),e=p&&roadSpawn(k,p[0],p[1]);if(e)return e;ks.splice(ks.indexOf(k),1)}
  return null}
// the hour's roll: none past perDay a day or while one is about; else the pity timer's chance, by the land you are on
function roadRoll(){const R=roadSt(),S=ENC_SPAWN;if(R.day!==G.day){R.day=G.day;R.n=0}
  if(R.n>=S.perDay||R.on.some(e=>!e.trace&&!e.gone))return null;
  return Math.random()<roadChance()?roadPick():null}
const roadChance=()=>{const S=ENC_SPAWN;return Math.min(S.cap,S.base+S.rate*roadSt().c)*S.land[storyCtx().landKind]};
// a moment's travel: the hours you moved add to the timer; each whole one, the roll (ROAD_AT: where you were, how far you went
// last moment: kept aside)
const ROAD_AT={x:NaN,y:NaN,m:0};
function roadTravel(d){const m=Math.hypot(P.x-ROAD_AT.x,P.y-ROAD_AT.y);ROAD_AT.x=P.x;ROAD_AT.y=P.y;ROAD_AT.m=m<20?m:0;if(G.quietEvents||!(m>0&&m<20))return;
  const R=roadSt(),h=Clock.hoursIn(d);R.c+=h;R.h+=h;while(R.h>=1){R.h--;if(roadRoll())break}}
// each moment on the map (world.js updateWorld): the travel, then each encounter; true when one opened its page. One story
// context for the moment (story/context.js Story.frame: its rolls read it)
function updateRoad(d){return Story.frame(()=>{roadTravel(d);const R=W.road;if(!R)return false;R.on=R.on.filter(e=>!e.gone);const V=vis(),now=roadNow();
  for(const e of R.on)if(asRoadEnc(e).step(d,V,now))return true;return false})}

/* ---------- meeting one: its page ---------- */
function roadMeet(e){e.met=1;e.seen=1;roadSt().c=0;G.road=e;G.roadMsg='';G.mode='road';P.tx=null;G.chase=null;showRoad()}
// forced: no Leave till chosen
const roadForced=e=>typeof e.D.forced==='function'?!!e.D.forced(e):!!e.D.forced;
// (its page: story/choice.js ChoicePage, its choices as key actions: the encounter's page())
function showRoad(){const e=G.road;CHOICE_PAGE.show(e.page(),'road:'+e.i)}
// (done with, or left be: Encounter settle, whoever walks going on their way; a procession on along its own, a bolting horse at
// a run; a grazing one grazes on; lights and ambushers gone)
function roadAct(a,arg){const e=G.road;if(G.mode!=='road'||!e)return;const D=e.D;
  if(a==='enc-leave'){if(roadForced(e)&&!e.done)return;if(!e.done&&D.left)log(D.left(e));e.settle();G.road=null;G.mode='world';hidePanel();saveGame(true);return}
  if(a==='enc-back'){showRoad();return}
  if(a==='enc-do'&&!e.done){const i=parseInt(arg),c=CHOICE_PAGE.choose(D.acts,arg,e);if(!c)return;
    if(c.asks(e)&&!String(arg).endsWith('!'))return CHOICE_PAGE.confirm(c,e,{sub:D.n,act:'enc-do',i,back:['enc-back',null,'Back']});
    const m=c.perform(e);P.morale=clamp(P.morale,0,100);updateHUD(true);if(G.road!==e)return;// (a fight began, or a chase)
    if(!c.again){e.done=1;e.settle()}G.roadMsg=m;log(m);showRoad();railFocus(a,arg)}}
onAct('enc-',roadAct);

/* ---------- the save: W.road, once there is one (absent: none, as every save before it; the save registry, core/saves.js). Each
   encounter its record (Encounter save); loaded, each wrapped by its kind's class, one whose kind is gone dropped (Encounter.load) ---------- */
Saves.add({key:'road',order:230,defaults:null,save:()=>W.road?{...W.road,on:W.road.on.filter(e=>!e.gone).map(e=>asRoadEnc(e).save())}:undefined,load:r=>{W.road=r;if(r)r.on=r.on.filter(o=>Encounter.load(o))}});
const roadSave=()=>Saves.saveOf('road');
// its work in the world's day and frame (core/systems.js) (the travel, then each encounter on the road)
Systems.add({name:'road',order:{frame:70},frame:updateRoad,ends:true});
