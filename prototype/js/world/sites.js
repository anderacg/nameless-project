'use strict';
/* ---------- sites: bandit camps, caves, traveller camps, bandit hideouts, ruins and shrines scattered across the map ---------- */
// Each site in W.sites: {i, type, name, tx, ty, x, y, seed, seen, cleared, back} plus fields of its kind, read through its class (below).
// Sites stay hidden until your scouts see them. Clearing a cave or hideout, or searching ruins, empties it until day `back`.
// spots: stands on the map's fixed CAMP_SPOTS (places.js), in plain sight (known once its ground is explored), instead of
// scattered at random and hidden until your scouts find it (how many of each: the world's DENSITY, data/world.js)
const SITE_TYPES={
  camp:{n:'Bandit camp',ico:'sword',spots:true,col:'#e0605a',respawn:10,d:'A big camp in plain sight: raiders and their chieftain, and the roving bands that shelter here by night.'},
  cave:{n:'Cave',ico:'cave',col:'#c58af0',respawn:25,d:'A monster lair cut into a hill or mountain. Beat its beasts for their trophies and a treasure chest.'},
  travelers:{n:'Travellers',ico:'fire',col:'#78c474',d:'A camp on the road. Trade, hire sellswords, rest by the fire and hear news. They move on after a few days.'},
  hideout:{n:'Bandit hideout',ico:'sword',col:'#e0605a',respawn:10,d:'Bandits and their chieftain, guarding their plunder.'},
  ruins:{n:'Ruins',ico:'ruin',col:'#e8d8a0',respawn:40,d:'Old treasure, found only once, and guardians that may wake. Once searched, others move in.'},
  shrine:{n:'Shrine',ico:'altar',col:'#7fd8e8',d:'Pray once a week to recover and gain insight.'}
};
const CAVE_NAMES=['Wolfden','Bonehollow','Darkmaw','Echo Cave','Gloomhole','Dripstone Cave','Old Burrow','Frostmaw','Sunken Grotto','Ashpit','Howling Cave','Mossy Hollow','Black Cleft','Glittercave'];
const RUIN_NAMES=['Fallen Tower','Old Watchfort','Sunken Temple','Broken Arch','Kingsgrave','Ruined Abbey','Lost Hall','Crumbled Keep','Elder Barrow','Shattered Gate'];
const SHRINE_NAMES={grass:'Standing Stones',forest:'Moon Grove',frost:'Frost Altar',desert:'Sun Obelisk',swamp:'Bog Idol'};
const HIDEOUT_NAMES={bandits:'Bandit hideout',raiders:'Raider den',bog:'Bog raider camp'};
// who you can meet on the road: their goods, their sellswords (by race) and anything special they offer
const TRAVELERS=[
  {n:'Merchant caravan',race:'human',goods:['cloth','spice'],col:'#3d74d6',d:'Wagons circled for the night, guards dozing by the fire.'},
  {n:'Dwarf prospectors',race:'dwarf',goods:['iron','cheese'],col:'#8a6a4a',d:'Dwarves with picks and pack ponies, arguing over a map.'},
  {n:'Elf wanderers',race:'elf',goods:['timber','fruit'],col:'#3f8a3e',d:'A quiet camp under lanterns. They watch you a while before they greet you.'},
  {n:'Orc hunters',race:'orc',goods:['furs','meat'],col:'#7e2a26',d:'Meat on spits and trophies on poles. They laugh loudly as you ride in.'},
  {n:'Pilgrims',race:null,goods:['grain','fruit'],col:'#e8e4d0',special:'bless',d:'Robed pilgrims singing softly. They offer bread and blessings.'},
  {n:'Minstrels',race:null,goods:['cloth','spice'],col:'#c58af0',special:'song',d:'Painted wagons and a fiddle. They trade songs for coin and news.'}
];
const COMPASS=['east','southeast','south','southwest','west','northwest','north','northeast'];
const compass=(dx,dy)=>COMPASS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];

/* ---------- the kinds of site: one class each over the plain data in W.sites (saved as it is; siteOf puts the class back).
   Site has what every place shares: where it may stand (static: ground, clear, fits; its point), whether you know of it,
   walking in, the day's change, its click area and tooltip; on the map it is a world object (parties.js WorldObject). Each
   kind adds what it does. ---------- */
const nearTile=(tx,ty,type,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(tx+i,ty+j)===type)return true;return false};
// A cave is cut into the front of a hill or mountain: it stands on that rock tile, drawn over the hill or peak painted there,
// and its mouth opens onto the ground in front (any you can walk but a road: its picture covers that tile too), where parties
// reach it. Its point (x, y) is that mouth, CAVE_MOUTH pixels into the tile in front.
const CAVE_MOUTH=2;
// a camp's tiles, from its picture: [left, top] from its own tile, then [across, deep]
const CAMP_FOOT={};
const campFoot=type=>CAMP_FOOT[type]||(CAMP_FOOT[type]=(c=>[(8-c.ax)/TILE,1-c.ay/TILE,c.width/TILE,c.height/TILE])(campSprite(1,type)));
// open ground round a camp: its own tiles open ground, the ring round them open or road, nothing built on any
function campClear(type,tx,ty){const [x0,y0,w,h]=campFoot(type);
  for(let j=y0-1;j<=y0+h;j++)for(let i=x0-1;i<=x0+w;i++){const t=tAt(tx+i,ty+j),own=i>=x0&&i<x0+w&&j>=y0&&j<y0+h;if(occAt(tx+i,ty+j)||t!==T_OPEN&&(own||t!==T_ROAD))return false}return true}
const unusedName=(list,sites)=>{const free=list.filter(n=>!sites.some(o=>o.name===n));return free.length?free[rint(0,free.length-1)]:list[rint(0,list.length-1)]};

// scouting a cave, a camp or a hideout (Site scout): the chance your scouts get a close look unseen: Scouting and Agility, the
// night; a big band is hard to hide
const scoutChance=()=>clamp(.4+.05*skill('scout')+.02*P.attr.agi+(darkness()>.5?.1:0)-(partySize()>20?.1:0),.15,.95);
// a rough count, and how strong they look against you, from outside (Lair guess)
const roughly=n=>n<6?'a handful':n<10?'fewer than ten':n<14?'about a dozen':n<18?'fifteen or so':n<26?'about a score':'dozens';
const looks=r=>r<.5?['They look far weaker than your band','good']:r<.8?['They look weaker than your band','good']:r<1.2?['They look about your match','gold']:r<1.8?['They look stronger than your band','bad']:['They look far too strong for you','bad'];
const LAIR_SAY={bandits:'Bandits',raiders:'Desert raiders',bog:'Bog raiders'};
class Site extends WorldObject{
  get mapKind(){return 'site'}
  here(){return W.sites.includes(this)}
  get meetsAnyTime(){return true}
  chaseable(){return super.chaseable()&&this.pickable()}
  // met: clicked beside it, or reached after a click on it (its window, or a fight); the one you last left (G.lastSite)
  meet(){G.lastSite=this;this.enter()}
  get T(){return SITE_TYPES[this.type]}
  get label(){return this.name+' ('+this.T.n.toLowerCase()+')'}
  // where one may stand: its ground; open ground round it (so nothing painted stands over its picture); anything else
  static ground(tx,ty){return tAt(tx,ty)!==T_ROAD}
  static clear(tx,ty){for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const t=tAt(tx+i,ty+j);if(t!==T_OPEN&&t!==T_ROAD||occAt(tx+i,ty+j))return false}return true}
  static fits(tx,ty){return true}
  // its point (where parties reach it, where it is drawn from), and the tile row parties reach it on
  static point(tx,ty){return[(tx+.5)*TILE,(ty+.5)*TILE]}
  static reachRow(ty){return ty}
  // a tile to try for one (siteSpot): anywhere on the map
  static pick(){return[rint(3,MW-4),rint(3,MH-4)]}
  // filled in when made (sites: the others made so far)
  setup(sites,clim){}
  // put its point back from its tile (after a load)
  placed(){[this.x,this.y]=this.constructor.point(this.tx,this.ty)}
  // its classes back over what it holds as plain data (siteOf, after a load); the saved JSON stays as it is
  restore(){}
  // do you know it is there; can your scouts find it; what they say
  known(){return this.seen}
  get scoutable(){return true}
  scoutLine(){return 'the '+this.label}
  // does clearing it leave it empty for a while; is its page shown then (lies empty), or nothing opens
  get empties(){return true}
  get emptyPage(){return false}
  // met (clicked: meet): a fight, or its window; false if nothing opened. A visit: what your scouts saw (G.siteSpy) is this visit's
  enter(){
    if(this.cleared&&this.empties&&!this.emptyPage){log('The '+this.name+' lies empty. Come back in '+Math.max(1,this.back-G.day)+' days.');return false}
    G.site=this;G.siteMsg='';G.siteTab=null;G.siteSpy=null;G.mode='site';showSite();return true}
  // its window (showSite): a place with rooms to walk between (its screen RAIL_SCREEN: the travellers) has its areas down the
  // rail: what it is (about: its overview), its places (each {k, n, short, ico, note (a few words on what is there, for the
  // overview), body (its window: people as cards, things as rows: window.js)}; one by default, its whole panel); a place with
  // nothing to walk between (PAGE_SCREEN: a shrine, ruins, a cave, a camp) is one page (window.js PageScreen): page(r, step)
  // gives {title, body (what it is, what you know of it), acts, note, back, close} (step: G.siteTab, a step inside it: a camp's parley), under its banner (view). Its actions: act (done(m):
  // show the result)
  about(r){return '<p class="muted">'+this.T.d+'</p>'}
  places(r){return [{k:'main',n:this.T.n,ico:this.T.ico,body:this.panel(r)}]}
  get screen(){return RAIL_SCREEN}
  page(r){return{body:this.about(r)}}
  // its banner on its page (window.js PageScreen banner): it as it stands on the map, its trampled ground, shadow, sprite, fire and
  // flag (render.js drawWorld's way), faded while it lies empty
  view(){const s=this,sp=siteSprite(s),X=s.x-sp.ax,Y=s.y+8-sp.ay,on=!s.cleared,fl=sp.fire&&on&&(spr.flm0||(spr.flm0=PX.flame(0))),fg=sp.flag&&on&&flagSprite(s.flagCol(),0);
    return{key:'site:'+s.type+':'+s.seed+':'+(s.kind??'')+':'+(on?1:0),x:s.x,y:s.y+8,alt:s.name,ps:[sp.gr&&[sp.gr,X,Y],sp.sh&&[sp.sh,X,Y,SHADOW.a],[sp,X,Y,on?1:.5],
      fl&&[fl.img,X+sp.fire[0]-fl.ax,Y+sp.fire[1]-fl.ay],fg&&[fg,X+sp.flag[0]-1,Y+sp.flag[1]-12]].filter(Boolean)}}
  panel(r){return ''}
  act(a,arg,done){if(a==='site-scout'&&this.scouts&&!this.cleared){this.scout(done);return true}return false}
  /* scouting (a cave, a camp or a hideout: scouts), once a visit: a Scouting check (scoutChance). Seen, they come for you (alarm).
     Unseen, your scouts see what is there exactly (spyLine): the rolls its fight would make are made now and kept for it (spyRoll:
     its foes, its level), so the fight is the one they saw; Scouting is trained either way, more for a look. G.siteSpy {s, ok,
     ...spyRoll}: this visit's; spied(): what they saw, if they got a look */
  get scouts(){return false}
  spied(){const y=G.siteSpy;return y&&y.s===this&&y.ok?y:null}
  scout(done){if(G.siteSpy&&G.siteSpy.s===this)return;const ok=Math.random()<scoutChance();train('scout',ok?6:2);G.siteSpy={s:this,ok};
    if(!ok)return this.alarm();Object.assign(G.siteSpy,this.spyRoll());done(this.spyLine())}
  spyRoll(){return{}}
  spyLine(){return ''}
  alarm(){}
  // its Scout key action (railKeyActions)
  scoutDeed(){const tried=G.siteSpy&&G.siteSpy.s===this,ch=scoutChance();return{icon:'eye',label:'Scout',act:'site-scout',facts:[insight(['they may spot your scouts',oddsWord(ch)+' to go unseen',Math.round(ch*100)+'% unseen'],'know the odds'),'once a visit'],why:tried?'Your scouts have had their look':'',
    tip:'Send your scouts for a close look: unseen, they see exactly what is there. Seen, it comes for you. Scouting and Agility help, and the night; a big band is harder to hide.'}}
  // the day's change: back after being cleared, and whatever its kind does
  day(){if(this.cleared&&G.day>=this.back){this.cleared=false;this.returned()}}
  returned(){}
  // the treasure it may hold (siteChest): extra gold, the chance of gear, and its valuables (VALUE_FINDS: a cave's)
  get chest(){return{gold:0,gear:.7,finds:'cave'}}
  // its beasts beaten (engage.js ON_WIN.cave): its chest, and it lies empty; withdrawn from or beaten by them: nothing kept
  lairWon(){const x=siteChest(this);clearPlace(this,this.T.respawn);return x}
  lairLost(e){}
  // on the map: its banner's colour, a banner of its own (travellers), clicked where (its yard under it: structures.js siteSprite gr)
  flagCol(){return '#2a1e14'}
  banner(){return null}
  pickable(){return this.known()}
  pick(at){if(this.pickable())this.box(at.box,at.camp)}
  box(box,camp){box(this,this.x-8,this.y-8,this.x+8,this.y+8)}
  // drawn once you know of it (as you last saw it, outside your sight: a building, render.js drawWorld), its name near you; dotted
  // on the minimap in its kind's colour (grey, cleared)
  inView(V){return this.known()}
  draw(ents,cam,V){if(!this.inView(V))return;const s=this;
    const sp0=siteSprite(s);ents.push({st:true,y:s.y,sh:sp0.sh?[sp0.sh,Math.round(s.x-cam.x)-sp0.ax,Math.round(s.y-cam.y)+8-sp0.ay]:null,f:()=>{const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y),sp=siteSprite(s);if(sp.gr)ctx.drawImage(sp.gr,sx-sp.ax,sy+8-sp.ay);if(s.cleared)ctx.globalAlpha=.5;ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);if(!s.cleared)depthPic(sp,sx-sp.ax,sy+8-sp.ay);if(sp.fire&&!s.cleared)drawFire(sx-sp.ax+sp.fire[0],sy+8-sp.ay+sp.fire[1],s.seed);if(sp.flag&&!s.cleared)drawFlag(s.flagCol(),sx-sp.ax+sp.flag[0],sy+8-sp.ay+sp.flag[1],s.seed);ctx.globalAlpha=1;
      if(s.fromYou()<70)txt(s.name,sx,sy+12,s.cleared?'#9a958a':'#e4e0cf','center')}})}
  mapDot(V){return this.known()?[this.cleared?'#555':this.T.col,2]:null}
  tip(){return '<b>'+this.name+'</b>'+(this.cleared?'':chiefTip(this))+'<small>'+this.T.n+(this.cleared?' · empty for now':'')+'</small><span class="act">Click: go there</span>'}
  // a job to clear it (quests.js)
  get clearJob(){return false}
}

// a cave: a monster lair in a hill or mountain; its beasts fight harder than in the open, and guard a chest. From outside only
// tracks and bones: how big, how many, roughly; your scouts can find out what lairs there (Scout)
const beastSize=u=>ST[u].hp<40?'small':ST[u].hp<120?'big':'huge',fewSay=n=>n<=2?'one or two':n<=4?'a few':n<=7?'several':'many';
class Cave extends Site{
  get screen(){return PAGE_SCREEN}
  static ground(tx,ty){return tAt(tx,ty)===T_HILL||tAt(tx,ty)===T_MOUNT}
  // (its picture covers its tile, the one beside it and the two over them: none a road)
  static clear(tx,ty){const m=tAt(tx,ty+1);if(occAt(tx,ty)||!passable(m)||m===T_ROAD||occAt(tx,ty+1))return false;
    for(let j=-1;j<=0;j++)for(let i=0;i<=1;i++)if(tAt(tx+i,ty+j)===T_ROAD)return false;return true}
  static point(tx,ty){return[(tx+.5)*TILE,(ty+1)*TILE+CAVE_MOUTH]}
  static reachRow(ty){return ty+1}
  setup(sites){this.name=unusedName(CAVE_NAMES,sites);this.id=caveMonster(this.x,this.y)}
  returned(){this.id=caveMonster(this.x,this.y)}// (something new moves in)
  get mouth(){return true}
  get scouts(){return true}
  box(box){box(this,this.x-8,this.y-16-CAVE_MOUTH,this.x+8,this.y+2)}
  get lair(){const M=MONSTERS[this.id];return{M,U:ST[M.unit],n:M.count[1]+1}}
  // (from outside, by Insight (window.js insight): bones and tracks; how big and how many; what lairs there, at about what level)
  get lvAbout(){return monLevel0()+1}
  about(r){const {M,U,n}=this.lair;return '<p>'+(this.within?'Deep in the cellars of the '+this.within+'. ':'A cave mouth in the '+r.name.toLowerCase()+'. ')+(this.spied()?M.n+' lair here, more than you would meet in the open.':
    'Bones and tracks litter the ground'+insight([', going in and out.',': '+beastSize(M.unit)+' tracks, '+fewSay(n)+' of them, going in and out.',': '+n+' × '+U.n.toLowerCase()+' by their sign, level '+this.lvAbout+' or '+(this.lvAbout+1)+'.'],'know what lairs there'))+'</p>'+(this.within?'':'<p class="muted">'+this.T.d+'</p>')}
  lairWon(){if(!this.within)return super.lairWon();clearPlace(this,this.T.respawn);return ''}
  // (its fight's level, rolled now and kept for it: caveFight)
  spyRoll(){return{lv:monLevel()+1}}
  spyLine(){const {U,n}=this.lair;return 'Your scouts creep to the mouth and back unseen: '+n+' × '+U.n.toLowerCase()+', level '+this.spied().lv+'.'}
  alarm(){G.site=null;log('A stone rolls under a scout’s boot. Something wakes in the dark.','bad');caveFight(this)}
  power(lv){const {M,n}=this.lair;return rating(Array(n).fill(M.unit),lv)}
  page(r){const {M,U,n}=this.lair,y=this.spied(),loot=y&&['trophy: '+MATS[M.mat].n.toLowerCase(),...M.gear.map(([it,ch])=>ITEMS[it].n+' ('+Math.round(Math.min(1,ch*(1+.1*(y.lv-1)))*100)+'%)'),'a chest'].join(', ');
    return{body:this.about(r)+(y?'<div class="lab">What your scouts saw</div>'+railCards([{pic:portrait(M.unit),name:U.n,role:'Lairing in the cave',n,facts:['Level '+y.lv,['Stronger than usual','bad'],'Power '+this.power(y.lv)+' vs your '+partyPower()],note:'Likely loot: '+loot+'.'}]):
        pageFacts([insight(['tracks and bones',cap1(fewSay(n))+', '+beastSize(M.unit),n+' × '+U.n.toLowerCase()+', power '+this.power(this.lvAbout)+' vs your '+partyPower()],'know what lairs there'),insightLv()<2&&'you cannot tell what without a closer look',!this.within&&'a chest, they say'])),
      acts:[this.scoutDeed(),{icon:'cave',label:'Enter',act:'site-ask',facts:[y?'power '+this.power(y.lv)+' vs '+partyPower():insightLv()===2?'power about '+this.power(this.lvAbout)+' vs '+partyPower():'what lairs there: unknown',!this.within&&'a chest'],tip:'Go in and fight whatever lairs there. It asks you first.'}],
      note:'Whatever lairs here fights harder than in the open.'}}
  act(a,arg,done){if(super.act(a,arg,done))return true;if(this.cleared)return false;const y=this.spied(),{U,n}=this.lair;
    if(a==='site-ask'){railConfirm({title:'Enter the '+this.name+'?',sub:this.T.n,text:y?n+' × '+U.n.toLowerCase()+' (level '+y.lv+') wait in the dark. Once inside, you fight.':'Something lairs in the dark. Once inside, you fight.',
      facts:[y?'Power '+this.power(y.lv)+' vs your '+partyPower():'You do not know what you will meet'],confirm:['site-fight',null,'Enter'],back:['site-tab','home','Back']});return true}
    if(a==='site-fight'){G.site=null;caveFight(this,y&&y.lv);return true}return false}
  get clearJob(){return true}
}

/* ruins (doc/CONDUCT_RUINS_DESIGN.md §3, §4): a treasure found once (looted: searched, never refilled), and guardians that wake at
   RUIN.wake of searches. Three checks, shown by Insight (window.js insight), may spare you the fight: Awareness before you search
   (Scouting and Agility: you hear them stir, and may still leave; stirs: kept until it is searched), Stealth as you search
   (Agility, the night, a band of RUIN.small or fewer: you take it unheard) and Lore (Intellect: the carvings tell what guards it,
   its rolls made then and kept for the fight, as a scout's are; once a visit). Woken, they fight at once (sealed: no leaving);
   beaten, their treasure is yours; withdrawn from or beaten by, the ruin remembers them (guard: kind, count, level): Attack or
   Leave, no new roll. Searched, after its cooldown others move in (occ: chosen from RUIN_OCC by its climate and land, seeded by
   the ruin and its cycle, cyc), each a cooldown long; cleared, it lies empty a cooldown; theirs is their own loot or bounty,
   never the ruin's treasure. Those that are a site of their own (bandits: a hideout's page; creatures: a cave's; travellers: the
   travellers' rail) are one (occ.s), shown and acted on through it; the others' pages are RUIN_OCC's. Its picture never changes.
   RUIN: wake, chest (the share of quiet searches with a chest), aware [base, a Scouting level, an Agility point], stealth [base,
   an Agility point, the night, a small band (−: a bigger one)], lore [base, an Intellect point], the hermit's prices and XP, a
   map's price, drop (the cultists' and robbers' chance of gear), fight (how many of them: [from, to]) */
const RUIN={wake:.3,chest:.75,aware:[.25,.05,.03],stealth:[.2,.03,.2,.15],small:12,lore:[.2,.06],hermit:{rumour:5,lore:10,xp:25},map:30,drop:.25,fight:[5,9]};
const awareChance=()=>{const A=RUIN.aware;return clamp(A[0]+A[1]*skill('scout')+A[2]*P.attr.agi,.05,.95)};
const stealthChance=()=>{const S=RUIN.stealth;return clamp(S[0]+S[1]*P.attr.agi+(darkness()>.5?S[2]:0)+(partySize()<=RUIN.small?S[3]:-S[3]),.05,.9)};
const loreChance=()=>clamp(RUIN.lore[0]+RUIN.lore[1]*P.attr.int,.05,.95);
// the people of the land round it (its holding's, or the nearest), and the realm that cares what you do to them
const ruinHold=s=>landHold(s.x,s.y)||Spatial.nearestHolding(s.x,s.y);
const ruinRealm=s=>{const h=ruinHold(s);return h&&h.owner&&h.owner!=='player'?h.owner:null};
/* who moves into searched ruins: w (its weight), × clim (by the climate there), × land (held: on a holding's land; wild: off
   it); line (what you see); make(s, o, R): what they are (R: the ruin's cycle's seeded draws); page(s, o, r): their page
   ({body, acts}); act(s, o, a, arg, done): their actions (true: handled). Those with a site of their own (o.s) have neither */
const RUIN_OCC={
  refugees:{w:3,clim:{frost:1.4},land:{held:1.6,wild:.6},line:'Homeless folk shelter among the stones, thin faces round a smoky fire.',
    make:(s,o,R)=>{const h=ruinHold(s);o.n=6+Math.floor(R()*9);o.race=h?h.races[Math.floor(R()*h.races.length)]:'human'},
    page:(s,o)=>{const C=CONDUCT.helpRefugees,f=ruinRealm(s);
      return{body:railCards([{pic:personPic('folk',o.race,3),name:'The homeless',role:'Sheltering in the ruins',n:o.n,facts:[['Hungry','bad'],'Nowhere else to go']}])+
          pageFacts([f?'The '+FACS[f].n+' will hear how you treat them':'Nobody will hear how you treat them']),
        acts:[{icon:'gold',label:'Give',act:'site-help',arg:'gold',facts:[C.gold+'g',f?'honor +'+C.honor:'kindness'],why:P.gold<C.gold?'Not enough gold':'',tip:'Give them '+C.gold+' gold to find a new home.'},
          {icon:'food',label:'Feed',act:'site-help',arg:'food',facts:[C.food+' food',f?'honor +'+C.honor:'kindness'],why:foodN()<C.food?'Not enough food':'',tip:'Share '+C.food+' of your food with them.'},
          {icon:'sword',label:'Chase off',act:'site-chase',facts:[f?'honor −'+CONDUCT.chaseRefugees.honor:'cruelty','the ruins yours'],tip:'Drive them out into the cold. It asks you first.'}]}},
    act:(s,o,a,arg,done)=>{const C=CONDUCT.helpRefugees,f=ruinRealm(s);
      if(a==='site-help'){if(arg==='gold'?P.gold<C.gold:foodN()<C.food)return true;if(arg==='gold')P.gold-=C.gold;else foodTake(C.food);if(f)addHonor(f,C.honor,true);mood('kind');s.occGone();
        done('They bless you, gather their bundles and set off for a new home.'+(f?' The '+FACS[f].n+' hears of it (honor +'+C.honor+').':''));return true}
      if(a==='site-chase'){railConfirm({title:'Chase them off?',sub:s.name,text:'Your soldiers drive the homeless out of the ruins and into the cold.',facts:[f?'Honor with the '+FACS[f].n+' −'+CONDUCT.chaseRefugees.honor:'Nobody will know'],confirm:['site-chased',null,'Chase off'],back:['site-tab','home','Back']});return true}
      if(a==='site-chased'){if(f)addHonor(f,-CONDUCT.chaseRefugees.honor,true);mood('cruel');s.occGone();done('They stumble off into the wilds.'+(f?' The '+FACS[f].n+' will hear of it (honor −'+CONDUCT.chaseRefugees.honor+').':''));return true}
      return false}},
  travellers:{w:2,land:{held:1.4,wild:.6},line:'Travellers have pitched their camp among the broken walls.',
    make:(s,o,R)=>{const c=occupantSite(s,'travelers');c.kind=Math.floor(R()*TRAVELERS.length);c.stockUp();c.until=s.back;o.s=c}},
  hermit:{w:1.5,clim:{frost:1.3,swamp:1.3},land:{held:.6,wild:1.5},line:'A hermit has made his home in the old cellars, alone with his books and bones.',
    make:(s,o,R)=>{const h=ruinHold(s);o.race=h?h.races[0]:'human';o.v=Math.floor(R()*6)},
    page:(s,o)=>{const H=RUIN.hermit,y=G.siteSpy,told=y&&y.s===s&&y.told,why=told?'He has said his piece for today':'';
      return{body:railCards([{pic:personPic('priest',o.race,o.v),name:'The hermit',role:'Living in the ruins',facts:['Knows the land','Knows the old kings']}]),
        acts:[{icon:'region',label:'Ask',act:'site-hermit',arg:'rumour',facts:['rumours: a place you have not found',H.rumour+'g'],why:why||(P.gold<H.rumour?'Not enough gold':''),tip:'Pay him for what he has heard of the land. Once a visit.'},
          {icon:'book',label:'Listen',act:'site-hermit',arg:'lore',facts:['lore of the old kings','+'+H.xp+' XP · '+H.lore+'g'],why:why||(P.gold<H.lore?'Not enough gold':''),tip:'Pay him to tell of the old kings. Once a visit.'}],note:'Once a visit: rumours or lore.'}},
    act:(s,o,a,arg,done)=>{const H=RUIN.hermit,y=G.siteSpy;if(a!=='site-hermit'||y&&y.s===s&&y.told)return false;const c=arg==='lore'?H.lore:H.rumour;if(P.gold<c)return true;
      P.gold-=c;G.siteSpy={s,told:true};
      if(arg==='lore'){gainXp(H.xp);done('By his fire the hermit tells of the old kings and the wars that broke them. (+'+H.xp+' XP)');return true}
      const far=W.sites.filter(x=>!x.seen&&x.scoutable).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];if(far)far.seen=true;
      const it=rumourFrom(rumourSource('hermit',s.tx+','+s.ty,s)).today[0];// (and a rumour of the land round his ruin, one a day: news.js)
      done([far?'He tells of the '+far.label+' to the '+compass(far.x-s.x,far.y-s.y)+'. It is on your map now.':'',it?'He has heard: “'+rumourText(it)+'”':''].filter(Boolean).join(' ')||'He knows nothing you have not heard.');return true}},
  hunters:{w:1.5,clim:{desert:1.5},line:'Rival treasure hunters pick over the rubble, maps spread on a stone.',
    make:(s,o,R)=>{const b=Object.keys(BASES);o.find=gearId(b[Math.floor(R()*b.length)],Math.min(MATERIALS.length-1,gearTop()))},
    page:(s,o)=>{const y=G.siteSpy,talked=y&&y.s===s&&y.told,c=gearPrice(o.find),map=ruinMap(s);
      return{body:railCards([{pic:personPic('merchant','human',4),name:'Treasure hunters',role:'Your rivals here',facts:[o.sold?'They have sold you their find':'A find to sell',o.map?'They have sold you their map':'A map of the old places']}]),
        acts:[{icon:'mug',label:'Talk',act:'site-hunt',arg:'talk',facts:['what they know of the ruins','once a visit'],why:talked?'They have told you what they know':''},
          {icon:'crate',label:'Trade',act:'site-hunt',arg:'find',facts:[o.sold?'sold':ITEMS[o.find].n,c+'g'],why:o.sold?'They have sold it':P.gold<c?'Not enough gold':'',tip:'Buy what they dug up: '+ITEMS[o.find].n+'.'},
          {icon:'scroll',label:'Buy',act:'site-hunt',arg:'map',facts:['their map: ruins you have not found',RUIN.map+'g'],why:o.map?'You have their map':!map?'They have no map you lack':P.gold<RUIN.map?'Not enough gold':'',tip:'Buy their map: it shows ruins you have not found.'}]}},
    act:(s,o,a,arg,done)=>{if(a!=='site-hunt')return false;const y=G.siteSpy;
      if(arg==='talk'&&!(y&&y.s===s&&y.told)){G.siteSpy={s,told:true};const r=W.sites.filter(x=>x instanceof Ruins&&x!==s&&x.seen&&!x.looted).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0];
        done(r?'They swear the '+r.name+' to the '+compass(r.x-s.x,r.y-s.y)+' still hides its treasure, and that something guards it.':'They grumble that every ruin they know of is picked clean.')}
      else if(arg==='find'&&!o.sold){const c=gearPrice(o.find);if(P.gold>=c&&invAdd('gear',o.find,1)){P.gold-=c;o.sold=true;done('You buy their find: the '+ITEMS[o.find].n+', for '+c+' gold.')}}
      else if(arg==='map'&&!o.map&&P.gold>=RUIN.map){const r=ruinMap(s);if(r){P.gold-=RUIN.map;o.map=true;r.seen=true;done('Their map shows the '+r.name+' to the '+compass(r.x-s.x,r.y-s.y)+'. It is on your map now.')}}
      return true}},
  bandits:{w:2,land:{held:.8,wild:1.4},line:'Bandits have made the ruins their den.',make:(s,o)=>{o.s=occupantSite(s,'hideout')}},
  creatures:{w:1.5,clim:{frost:1.4,swamp:1.4},land:{held:.5,wild:1.6},line:'Something has made its lair in the deep cellars.',make:(s,o)=>{o.s=occupantSite(s,'cave')}},
  cultists:{w:1,clim:{swamp:2,desert:1.3},land:{held:.6,wild:1.4},line:'Robed cultists chant by torchlight in the old hall.',say:['robed figures by torchlight','cultists'],foes:['hedge','militia','militia'],make:(s,o,R)=>ruinFoes(o,R)},
  robbers:{w:1,land:{held:1.4,wild:.8},line:'Grave robbers dig in the old barrows by lantern light.',say:['figures digging by lantern light','grave robbers'],foes:['militia','archer'],make:(s,o,R)=>ruinFoes(o,R)},
  empty:{w:2,line:'Only wind in the stones.',page:s=>({body:pageFacts(['Nobody lives here now','others may come in '+Math.max(1,s.back-G.day)+' days'])})}
};
// a band of cultists or grave robbers (their kinds in turn); their page (what you can tell of them, Attack), and their fight
function ruinFoes(o,R){const F=RUIN_OCC[o.k].foes,n=RUIN.fight[0]+Math.floor(R()*(RUIN.fight[1]-RUIN.fight[0]+1));o.list=Array.from({length:n},(_,i)=>F[(i+Math.floor(R()*F.length))%F.length])}
const ruinFoesPage=(s,o)=>{const O=RUIN_OCC[o.k],pw=rating(o.list),pp=partyPower(),lk=looks(pw/Math.max(1,pp)),cs=Object.entries(countsOf(o.list)).map(([k,n])=>n+' × '+ST[k].n.toLowerCase()).join(', ');
  return{body:pageFacts([insight([O.say[0],cap1(roughly(o.list.length))+' '+O.say[1]+', <span class="'+lk[1]+'">'+lk[0].replace('They','they')+'</span>',cs+', power '+pw+' vs your '+pp],'know their strength'),'a purse and maybe a find, if you drive them out']),
    acts:[{icon:'attack',label:'Attack',act:'site-ask',facts:[insight(['what they are: unknown',lk[0].replace('They look ',''),'power '+pw+' vs '+pp],'know their strength')],tip:'Drive them out of the ruins. It asks you first.'}]}};
for(const k of ['cultists','robbers'])Object.assign(RUIN_OCC[k],{page:ruinFoesPage,
  act:(s,o,a,arg,done)=>{const O=RUIN_OCC[o.k];
    if(a==='site-ask'){railConfirm({title:'Attack the '+O.say[1]+'?',sub:s.name,text:'You drive them out of the ruins: '+roughly(o.list.length)+' of them.',facts:[insightLv()===2?'Power '+rating(o.list)+' vs your '+partyPower():looks(rating(o.list)/Math.max(1,partyPower()))[0]],confirm:['site-attack',null,'Attack'],back:['site-tab','home','Back']});return true}
    if(a==='site-attack'){G.site=null;startEncounter({kind:'ruin',mine:true,ref:s,list:o.list.slice(),allies:[],foes:[],word:O.say[1],title:cap1(O.say[1])+' in the '+s.name});return true}
    return false}});
// a ruin you have not found, the nearest (the hunters' map)
const ruinMap=s=>W.sites.filter(x=>x instanceof Ruins&&x!==s&&!x.seen).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y))[0]||null;
// who comes this cycle: drawn by weight, seeded by the ruin and its cycle (never Math.random)
function ruinOccupant(s){const R=seeded((s.seed*7919+(s.cyc||0)*104729)>>>0),c=climAt(s.x,s.y),land=landHold(s.x,s.y)?'held':'wild',ks=Object.keys(RUIN_OCC),
    w=ks.map(k=>{const O=RUIN_OCC[k];return O.w*((O.clim||{})[c]??1)*((O.land||{})[land]??1)});
  let r=R()*w.reduce((a,b)=>a+b,0),k=ks[ks.length-1];for(let i=0;i<ks.length;i++){r-=w[i];if(r<0){k=ks[i];break}}
  const o={k};if(RUIN_OCC[k].make)RUIN_OCC[k].make(s,o,R);return o}
// occupants that are a site of their own: one of its kind on the ruin's point, of the ruin (within: its name, set before its setup
// reads it: a hideout's band), made as genSites makes one
function occupantSite(s,type){const o=Object.assign(Object.create(SITE_CLASS[type].prototype),{i:s.i,type,tx:s.tx,ty:s.ty,x:s.x,y:s.y,seed:s.seed,seen:true,cleared:false,back:0,within:s.name});o.setup(W.sites,climAt(s.x,s.y));return o}
class Ruins extends Site{
  // (its picture two tiles wide and deep since stage 3, structures.js siteSprite: no road on the tiles round it it may stand on)
  static clear(tx,ty){if(!super.clear(tx,ty))return false;for(let j=-1;j<=0;j++)for(let i=-1;i<=1;i++)if(tAt(tx+i,ty+j)===T_ROAD)return false;return true}
  get screen(){const s=this.occSite;return s?s.screen:PAGE_SCREEN}
  setup(sites){this.name=unusedName(RUIN_NAMES,sites)}
  restore(){if(this.occ&&this.occ.s)siteOf(this.occ.s)}
  get chest(){return{gold:40,gear:.9,finds:'ruin'}}
  // its occupants that are a site of their own, while they hold it
  get occSite(){const o=this.occ;return this.looted&&!this.cleared&&o&&o.s&&!o.s.cleared?o.s:null}
  // the day: occupants gone (beaten, paid, chased off, helped: their site cleared, or gone) leave it empty a cooldown; then
  // (or when their cooldown is up) the next cycle's move in
  day(){this.settle();if(this.looted&&G.day>=this.back&&G.site!==this){this.cleared=false;this.cyc=(this.cyc||0)+1;this.back=G.day+this.T.respawn;this.occ=ruinOccupant(this)}}
  settle(){const o=this.occ;if(this.looted&&o&&!this.cleared&&(o.gone||o.s&&o.s.cleared)){this.cleared=true;this.back=G.day+this.T.respawn}}
  occGone(){this.occ.gone=true;this.settle()}
  enter(){this.settle();return super.enter()}
  about(r){const s=this.occSite;if(s&&s.screen===RAIL_SCREEN)return '<p>'+RUIN_OCC[this.occ.k].line+'</p>'+s.about(r);
    return '<p>Broken walls in the '+r.name.toLowerCase()+', older than any kingdom on your maps.</p><p class="muted">'+this.T.d+'</p>'}
  places(r){return this.occSite.places(r)}
  page(r,step){this.settle();const o=this.occ;
    if(this.cleared)return{body:this.about(r)+'<p>Only wind in the stones.</p>'+pageFacts(['Others may shelter here in '+Math.max(1,this.back-G.day)+' days'])};
    if(this.guard)return this.guardPage(r);
    if(!this.looted)return this.treasurePage(r);
    const s=this.occSite,K=RUIN_OCC[o&&o.k||'empty'];if(s){const p=s.page(r,step);return{...p,body:'<p>'+K.line+'</p>'+p.body}}
    const p=K.page(this,o,r,step);return{...p,body:'<p>'+K.line+'</p>'+p.body}}
  // the treasure, its guardians asleep (what the carvings told: lore), the three checks as Insight shows them
  treasurePage(r){const y=this.lore(),w=this.stirs,aw=awareChance(),st=stealthChance(),lc=loreChance();
    return{body:this.about(r)+(w?'<p class="bad">Something stirs below… whatever guards the treasure is waking.</p>':'')+(y?'<div class="lab">What the carvings say</div>'+this.guardCards(y,'Asleep below, guarding the treasure'):'')+
        pageFacts(['A treasure, found only once',y?'guarded by '+y.n+' × '+ST[MONSTERS[y.id].unit].n.toLowerCase():'guardians that may wake']),
      acts:[{icon:'ruin',label:w?'Search anyway':'Search',act:'site-search',facts:[w?'<span class="bad">they are stirring</span>':insight(['you may hear them stir',oddsWord(aw)+' to hear them stir',pct(aw)+' to hear them stir'],'know the odds'),insight(['you may go unheard',oddsWord(st)+' to go unheard',pct(st)+' unheard'],'know the odds')],
          tip:'Search the ruins for their treasure. Its guardians may wake: Scouting and Agility may warn you first, and you may still leave; Agility, the night and a band of '+RUIN.small+' or fewer help you take it unheard. Woken, they fight at once: there is no leaving.'},
        {icon:'book',label:'Read',act:'site-lore',facts:[insight(['the old carvings',oddsWord(lc)+' to read them',pct(lc)+' to read them'],'know the odds'),'once a visit'],why:this.loreTried()?(y?'You have read what guards it':'The carvings are too worn'):'',
          tip:'Read the carvings on its walls (Intellect): they tell what guards the treasure, how many and how strong.'}]}}
  // guardians you met and left: Attack or Leave, as you found them
  guardPage(r){const g=this.guard,M=MONSTERS[g.id];
    return{body:this.about(r)+'<div class="lab">Guardians</div>'+this.guardCards(g,'Awake, guarding the treasure')+pageFacts(['Guardians: '+g.n+' × '+ST[M.unit].n+', level '+g.lv]),
      acts:[{icon:'attack',label:'Attack',act:'site-ask',facts:['power '+this.guardPower(g)+' vs '+partyPower(),'the treasure beyond'],tip:'Fight the guardians you found here: beaten, their treasure is yours. It asks you first.'}]}}
  guardPower(g){return rating(Array(g.n).fill(MONSTERS[g.id].unit),g.lv)}
  guardCards(g,role){const M=MONSTERS[g.id];return railCards([{pic:portrait(M.unit),name:ST[M.unit].n,role,n:g.n,facts:['Level '+g.lv,'Power '+this.guardPower(g)+' vs your '+partyPower()]}])}
  // what the carvings told this visit (G.siteSpy: its rolls, kept for the fight); read them already
  lore(){const y=G.siteSpy;return y&&y.s===this&&y.ok&&y.id?y:null}
  loreTried(){const y=G.siteSpy;return !!(y&&y.s===this&&y.lore)}
  guardRoll(){const id=caveMonster(this.x,this.y);return{id,n:MONSTERS[id].count[1]+1,lv:monLevel()+1}}
  guardFight(g,sealed){G.site=null;this.id=g.id;this.lv=g.lv;startEncounter({kind:'cave',ref:this,lv:g.lv,list:Array(g.n).fill(MONSTERS[g.id].unit),sealed:sealed||null})}
  // searching: woken (unless you hear them first: stirs, or go unheard), the fight at once; else the chest or the old lore
  search(done){const r=Math.random(),wake=this.stirs||r<RUIN.wake;
    if(wake&&!this.stirs&&Math.random()<awareChance()){this.stirs=true;train('scout',3);return done('Something stirs below… Your scouts hear it first: whatever guards the treasure is waking. Search anyway, or leave.')}
    if(wake&&Math.random()>=stealthChance()){log('Stones shift in the dark. The guardians wake and bar the way out!','bad');return this.guardFight(this.lore()||this.guardRoll(),'The guardians bar the way out')}
    delete this.stirs;this.looted=true;this.cleared=true;this.back=G.day+this.T.respawn;
    if(wake)return done('Soft-footed, your people slip past the guardians and lift a sealed chest from under their noses.'+siteChest(this));
    if(r<RUIN.chest)return done('Under a fallen slab you find a sealed chest.'+siteChest(this));
    gainXp(30);P.renown+=2;done('No treasure, but the carvings tell of the old kings. You learn much. (+30 XP, +2 renown)')}
  // the guardians beaten (engage.js ON_WIN.cave): their treasure, for sure; left or beaten by them, it remembers them
  lairWon(){delete this.guard;delete this.stirs;this.looted=true;const x=' Beyond them lies the treasure.'+siteChest(this);clearPlace(this,this.T.respawn);return x}
  lairLost(e){if(!this.looted)this.guard={id:this.id,n:Math.max(1,e.list.length),lv:e.lv}}
  // the cultists or grave robbers beaten (ON_WIN.ruin): their purse, and the ruins empty
  occWon(e){const g=rint(10,25)+3*e.list.length;P.gold+=g;this.occGone();return ' They leave behind a purse of '+g+' gold.'}
  act(a,arg,done){
    if(this.guard){if(a==='site-ask'){const g=this.guard;railConfirm({title:'Attack the guardians?',sub:this.name,text:g.n+' × '+ST[MONSTERS[g.id].unit].n.toLowerCase()+' (level '+g.lv+') stand between you and the treasure.',
        facts:['Power '+this.guardPower(g)+' vs your '+partyPower()],confirm:['site-fight',null,'Attack'],back:['site-tab','home','Back']});return true}
      if(a==='site-fight'){this.guardFight(this.guard);return true}return false}
    if(!this.looted){
      if(a==='site-search'){this.search(done);return true}
      if(a==='site-lore'&&!this.loreTried()){const ok=Math.random()<loreChance(),g=ok&&(this.lore()||this.guardRoll());G.siteSpy={s:this,lore:true,ok,...(g||{})};
        done(ok?'The carvings warn of what sleeps below: '+g.n+' × '+ST[MONSTERS[g.id].unit].n.toLowerCase()+', level '+g.lv+'.':'The carvings are too worn to read.');return true}
      return false}
    if(this.cleared)return false;const s=this.occSite;if(s)return s.act(a,arg,done);
    const o=this.occ,K=o&&RUIN_OCC[o.k];return !!(K&&K.act&&K.act(this,o,a,arg,done))}
}

// a shrine: pray once a week to recover, or leave an offering (its two choices: story/choice.js Choices, s the shrine; its
// page's key actions send site-pray with their place, 0 or 1)
const SHRINE_CHOICES=Choice.list([
  {icon:'altar',label:'Pray',need:s=>s.prayWait(),tip:'Kneel at the altar: your stamina and mana come back, some health, morale +6. Once a week.',
    out:s=>({vitals:'rest',morale:{n:6,min:0,max:100},say:'You kneel at the '+s.name+'. Your strength returns.'})},
  {icon:'gold',label:'Offer 25g',need:s=>s.prayWait()||(P.gold<25?'Not enough gold':''),tip:'Leave 25 gold on the offering stone: fully restored, morale +10, +40 XP. Once a week.',
    out:s=>({gold:-25,vitals:'full',morale:{n:10,min:0,max:100},xp:40,say:'You leave 25 gold at the '+s.name+'. Warmth runs through you. (+40 XP)'})}]);
class Shrine extends Site{
  get screen(){return PAGE_SCREEN}
  setup(sites,clim){this.name=SHRINE_NAMES[terrAt(this.x,this.y)===T_FOREST?'forest':clim]}
  get empties(){return false}
  about(r){return '<p>The '+this.name+' stands alone in the '+r.name.toLowerCase()+'. Old offerings lie at its foot.</p><p class="muted">'+this.T.d+'</p>'}
  // (why you may not pray yet: '' once a week has passed)
  prayWait(){return G.day>=this.back?'':'Wait '+(this.back-G.day)+' more days'}
  page(r){const ready=G.day>=this.back;
    return{body:this.about(r)+'<ul class="tnotes"><li>Pray at the altar: your stamina and mana restored, some health, morale +6.</li><li>Leave 25 gold on the offering stone: fully restored, morale +10, +40 XP.</li><li>'+(ready?'You may pray: once a week.':'<span class="gold">You may pray again in '+(this.back-G.day)+' days.</span>')+'</li></ul>',
      acts:CHOICE_PAGE.buttons(SHRINE_CHOICES,this,'site-pray')}}
  // (arg 1: the offering, anything else the prayer; then a week before the next)
  act(a,arg,done){
    if(a!=='site-pray'||G.day<this.back)return false;const offer=arg==='1';
    if(offer&&P.gold<25)return true;const m=SHRINE_CHOICES[offer?1:0].perform(this);this.back=G.day+7;done(m);return true}
}

/* a bandit lair, a hideout or a camp: a chieftain and his raiders. Clicked, it opens its page: what you can see from outside
   (guess: about how many, how strong they look, the talk of their loot; its chieftain is known by name), Scout for the truth
   (the fight's foes rolled then: the fight is the one they saw), Attack (it asks first: the fight as walking in always made it),
   Parley (pay them to break camp, or make them yield if they fear you: parley.js lairPay, lairYield, lairFate), Leave. Cleared,
   it lies empty. A new chief takes it when it returns */
class Lair extends Site{
  get screen(){return PAGE_SCREEN}
  get scouts(){return true}
  get emptyPage(){return true}
  get bandKind(){return this.band||'bandits'}
  returned(){this.ld=newChief(this.bandKind,this.newLv()+Math.floor(G.day/30))}
  // a new chieftain's level (before the days add theirs); its plunder past every camp's (engage.js ON_WIN camp): none, a line
  // for the victory panel; what your scouts say of its loot (n: how many they saw)
  newLv(){return rint(1,3)}
  plunder(res){return ''}
  lootSay(n){return 'about '+(n*4+25)+' gold in their purses, likely a piece of gear (4 in 5)'}
  box(box,camp){camp(this,siteSprite(this))}
  // the bands sheltering here tonight, as one list (a camp's: BanditCamp)
  sheltering(){return (this.bands||[]).flatMap(b=>b.troops)}
  // everyone you would fight: its own (as scouted, or rolled for a parley) and those sheltering; their power
  all(own){return own.concat(this.sheltering())}
  power(list){return rating(list,chiefLv(this))}
  // from outside: about how many (the middle of what they may be, and the bands sheltering), how strong they look (that many
  // middling raiders and their chieftain, at its level)
  guess(){const list=Array(this.size0+Math.floor(G.day/15)).fill('militia').concat('chief',this.sheltering());return{n:list.length,pw:this.power(list)}}
  spyRoll(){return{list:this.foes()}}
  spyLine(){const l=this.all(this.spied().list);return 'Your scouts crawl back unseen: '+l.length+' of them, power '+this.power(l)+'.'}
  alarm(){log('A sentry shouts: your scouts are seen. They come out for you!','bad');this.fight(false)}
  // the fight (mine: you started it, and may still call it off), its own fighters as scouted, or rolled now as walking in did
  fight(mine,own){G.site=null;G.youAttack=mine;this.attack(own)}
  page(r,step){const s=this,y=s.spied(),g=s.guess(),ld=s.ld,band=LAIR_SAY[s.bandKind];
    if(s.cleared)return{body:'<p>The '+s.T.n.toLowerCase()+' lies empty: cold fires and trampled ground.'+(s.back>G.day?' Others will gather here again in '+Math.max(1,s.back-G.day)+' days.':'')+'</p>'};
    const yl=G.siteSpy&&G.siteSpy.s===s&&G.siteSpy.yielded;
    if(step==='yield'&&yl){const n=yl.length,tb=CONDUCT.takeBrigands;
      return{title:'They yield',msg:'',body:'<p>They throw down their weapons'+(ld?', '+ld.name+' with them':'')+'. What becomes of them?</p><p class="muted">Brigands in your ranks lower morale and every realm’s opinion of you. Setting them free is merciful, but the roads stay dangerous.</p>',
        acts:[{icon:'prisoners',label:'Take them prisoner',act:'site-fate',arg:'cage',facts:[Math.min(n,Math.max(0,prisonCap()-prisonerCount()))+' fit','and their plunder'],why:prisonerCount()>=prisonCap()?'No room for prisoners':''},
          {icon:'troops',label:'Into your band',act:'site-fate',arg:'join',facts:[Math.min(n,Math.max(0,partyRoom()))+' join','morale −'+tb.morale+' · honor −'+tb.honorAll],why:partyRoom()<1?'Your band is full':''},
          {icon:'truce',label:'Let them go',act:'site-fate',arg:'free',facts:['disarmed','renown +1']}],close:['site-fate','free','Let them go']}}
    if(step==='parley'){const pw=y?s.power(s.all(y.list)):g.pw,afraid=stance(pw)==='afraid',ch=Math.round(yieldChance({power:()=>pw},'band')*100),tb=tribute(s);
      return{title:'Parley',body:'<p>You ride up with a white rag on a spear. '+(ld?ld.name+' steps out':'Their chieftain steps out')+' to hear you, '+roughly(g.n)+' at his back.</p>',
        acts:[{icon:'gold',label:'Pay them to go',act:'site-pay',facts:[tb+'g','they break camp'],why:P.gold<tb?'Not enough gold':'',tip:'Buy them off: '+tb+' gold and they break camp and ride away, any bands sheltering with them. No fight, no loot, no bounty; the place lies empty for a while.'},
          {icon:'prisoners',label:'Demand surrender',act:'site-yield',facts:[afraid?insight(['they might yield, or not',oddsWord(ch/100)+' they yield',ch+'% they yield'],'know the odds'):'they do not fear you','else they fight'],why:afraid?'':'They do not fear you: it takes about twice their strength',tip:'Call on them to yield, as a cornered band would. If they do, you choose their fate: prisoners, recruits or let go. If not, they fight.'}],
        note:'They '+(afraid?'eye your band warily.':'laugh at your band.'),back:['site-tab','home','Back']}}
    const all=y&&s.all(y.list),pw=all?s.power(all):g.pw,lk=looks(pw/Math.max(1,partyPower()));
    return{body:'<p class="muted">'+s.T.d+'</p>'+Prisons.siteNote(s)+(y?'<div class="lab">What your scouts saw</div>'+railCards(Object.entries(countsOf(all)).map(([k,n])=>({pic:portrait(k),name:k==='chief'&&ld?chiefLabel(ld):ST[k].n,role:k==='chief'?'Their chieftain · bounty '+bountyOf(ld)+'g':'Tier '+ST[k].tier,n})))+
        '<ul class="tnotes"><li>Power <b>'+pw+'</b> vs your '+partyPower()+'.</li><li>Loot: '+s.lootSay(all.length)+', and '+(ld?ld.name:'their chieftain')+' to take captive ('+bountyOf(ld)+'g bounty).</li></ul>':
        pageFacts([insight([band+' in their tents',cap1(roughly(g.n))+' '+band.toLowerCase(),g.n+' '+band.toLowerCase()+' and their chieftain'],'know their numbers')+(s.sheltering().length?', bands among them sheltering for the night':''),
          insight(['you cannot tell how strong','<span class="'+lk[1]+'">'+lk[0].replace('They','they')+'</span>','power '+g.pw+' vs your '+partyPower()],'know their strength')])+
        '<ul class="tnotes"><li>Led by '+(ld?chiefLabel(ld)+', '+bountyOf(ld)+' gold on his head':'a chieftain')+'.</li><li>Talk of plunder piled in the tents.</li></ul>'),
      acts:[s.scoutDeed(),{icon:'attack',label:'Attack',act:'site-ask',facts:[y?'power '+pw+' vs '+partyPower():insight(['what waits inside: unknown',lk[0].replace('They look ',''),'power about '+pw+' vs '+partyPower()],'know their strength')],tip:'Storm it: its fighters, its chieftain and any band sheltering there. It asks you first.'},
        {icon:'truce',label:'Parley',act:'site-tab',arg:'parley',facts:['pay them off','or make them yield'],tip:'Talk: pay them to break camp, or, if they fear you, demand their surrender.'}]}}
  act(a,arg,done){if(super.act(a,arg,done))return true;if(this.cleared)return false;const s=this,y=s.spied();
    if(a==='site-ask'){const g=s.guess(),all=y&&s.all(y.list);railConfirm({title:'Attack the '+s.T.n.toLowerCase()+'?',sub:s.name,text:'You storm it: '+(all?all.length+' fighters':roughly(g.n)+' of them, as far as you can tell')+', their chieftain at their head.',
      facts:[all?'Power '+s.power(all)+' vs your '+partyPower():insight(['You cannot tell how strong they are',looks(g.pw/Math.max(1,partyPower()))[0],'Power about '+g.pw+' vs your '+partyPower()],'know their strength'),'You may still call it off before the first blow'],confirm:['site-attack',null,'Attack'],back:['site-tab','home','Back']});return true}
    if(a==='site-attack'){s.fight(true,y&&y.list);return true}
    if(a==='site-pay'){const m=lairPay(s);if(m){G.siteTab=null;done(m)}return true}
    if(a==='site-yield'){const m=lairYield(s);if(m){G.siteTab='yield';done(m)}return true}
    if(a==='site-fate'){const yl=G.siteSpy&&G.siteSpy.s===s&&G.siteSpy.yielded;if(yl){G.siteTab=null;done(lairFate(s,yl,arg))}return true}
    return false}
}
/* where a hideout stands (the owner, 2026-10-23: "bandit and raider hideouts should spawn far away from holdings, mostly found in
   wilderness areas"): on the wild land (wildLand), far tiles or more from every holding and road from every road, track and
   ford (an estate's too); of draw tiles drawn from it, one on clear ground and wild (wildGround) first. Wild: woods, hills or
   peaks rough of the tiles within near of it (a clearing in the wilds), or deep in the swamp or the desert (its climate deep
   tiles out every way). Another hideout 20 tiles off at least (SITE_GAP). How many: by the wild land (data/world.js DENSITY) */
const HIDEOUT_PLACE={far:22,road:8,draw:48,near:10,rough:.2,deep:6};
// the wild land of the world in: at (a byte a tile: 1 on it), list (its tiles), n; kept on the map till its holdings or roads
// change (an estate's track laid or lifted: as data/world.js worldRoads; never on its lists or hashes)
function wildLand(){const m=WM,R=m.roads||[],key=TOWNS.length+' '+R.length+' '+R.reduce((n,r)=>n+r.path.length,0);if(m._wild&&m._wild.key===key)return m._wild;
  const H=HIDEOUT_PLACE,at=new Uint8Array(MW*MH),stamp=(x,y,r)=>{for(let j=1-r;j<r;j++)for(let i=1-r;i<r;i++)if(i*i+j*j<r*r&&x+i>=0&&y+j>=0&&x+i<MW&&y+j<MH)at[(y+j)*MW+x+i]=2};
  for(let i=0;i<at.length;i++)if(tiles[i]===T_ROAD||tiles[i]===T_FORD)stamp(i%MW,(i-i%MW)/MW,H.road);
  for(const t of TOWNS)stamp(t.tx,t.ty,H.far);
  const list=[];for(let i=0;i<at.length;i++){if(at[i]){at[i]=0;continue}const k=tiles[i];if(k===T_OPEN||k===T_FOREST||k===T_HILL){at[i]=1;list.push(i)}}
  Object.defineProperty(m,'_wild',{value:{key,at,list,n:list.length},configurable:true,writable:true});return m._wild}
// (a clearing in the wilds, or deep in the swamp or the desert: HIDEOUT_PLACE)
function wildGround(tx,ty){const H=HIDEOUT_PLACE,c=climate[ty*MW+tx];let n=0,r=0;
  for(let j=-H.near;j<=H.near;j++)for(let i=-H.near;i<=H.near;i++)if(i*i+j*j<=H.near*H.near){const k=tAt(tx+i,ty+j);n++;if(k===T_FOREST||k===T_HILL||k===T_MOUNT)r++}
  if(r>=n*H.rough)return true;if(c!==CLIM.swamp&&c!==CLIM.desert)return false;
  for(let a=0;a<8;a++){const x=tx+Math.round(Math.cos(a*Math.PI/4)*H.deep),y=ty+Math.round(Math.sin(a*Math.PI/4)*H.deep);if(x<0||y<0||x>=MW||y>=MH||climate[y*MW+x]!==c)return false}
  return true}
/* a hideout: deep in the wilds (HIDEOUT_PLACE), its raiders by the climate; it keeps clear of the estates (lots.js). Its band
   (HIDEOUT_BAND, the owner, 2026-10-23: finding one is an expedition): den, a hideout of its own: a bigger garrison, a stronger
   chieftain, richer plunder; ruin, bandits in searched ruins (within): as a hideout was. size0: how many its look counts on;
   foes: [from, to] (+1 every 15 days); chief: its chieftain's level [from, to]; gold: its plunder's gold x; gear: the chance
   of another piece of gear past a camp's (4 in 5; the den's 1.5 x: 1.2 a fight) */
const HIDEOUT_BAND={den:{size0:8,foes:[7,9],chief:[2,5],gold:1.5,gear:.4},ruin:{size0:6,foes:[5,7],chief:[1,3],gold:1,gear:0}};
class Hideout extends Lair{
  static ground(tx,ty){return wildLand().at[ty*MW+tx]===1}
  static clear(tx,ty){return campClear('hideout',tx,ty)}
  static fits(tx,ty){return !estateNear(tx,ty,BANDIT_GAP)}
  // (of HIDEOUT_PLACE draw tiles of the wild land: the first clear and wild, else the first clear, else the last)
  static pick(){const L=wildLand().list;if(!L.length)return super.pick();let best=null,bs=-1;
    for(let k=0;k<HIDEOUT_PLACE.draw&&bs<3;k++){const i=L[rint(0,L.length-1)],tx=i%MW,ty=(i-tx)/MW,c=this.clear(tx,ty),sc=c?wildGround(tx,ty)?3:2:1;if(sc>bs){bs=sc;best=[tx,ty]}}
    return best}
  get tune(){return HIDEOUT_BAND[this.within?'ruin':'den']}
  setup(sites,clim){this.band=clim==='desert'?'raiders':clim==='swamp'?'bog':'bandits';this.name=HIDEOUT_NAMES[this.band];this.ld=newChief(this.band,this.newLv(),sites)}
  newLv(){return rint(...this.tune.chief)}
  get size0(){return this.tune.size0}
  // its raiders and chieftain (makeEnemies, as startEncounter makes them from n), and the fight with them
  foes(){return makeEnemies(this.garrison(),true,this.band)}
  garrison(){return rint(...this.tune.foes)+Math.floor(G.day/15)}
  attack(own){startEncounter(own?{kind:'camp',ref:this,n:own.length-1,list:own,band:this.band}:{kind:'camp',ref:this,n:this.garrison(),band:this.band})}
  // (its plunder: the gold x tune's, and maybe another piece of gear)
  plunder(res){const T=this.tune;res.gold=Math.round(res.gold*T.gold);if(!T.gear||Math.random()>=T.gear)return '';const id=randomGear(0,gearTop());
    return invAdd('gear',id,1)?' Among their plunder: a <span style="color:'+RARITY[ITEMS[id].r]+'">'+ITEMS[id].n+'</span>.':' '+BAG_FULL+'. You leave a '+ITEMS[id].n+' behind.'}
  lootSay(n){const T=this.tune;return T.gold===1&&!T.gear?super.lootSay(n):'about '+Math.round((n*4+25)*T.gold)+' gold in their plunder, likely a piece of gear (4 in 5) and maybe another'}
  get clearJob(){return true}
}
// a bandit camp: on its fixed spot, in plain sight once you have seen its ground; the roving bands shelter in it by night
class BanditCamp extends Lair{
  setup(sites){this.name='Bandit camp';this.bands=[];this.ld=newChief('bandits',rint(2,4),sites)}
  // the bands sheltering here are parties (a save keeps them as plain counts)
  restore(){if(this.bands)this.bands.forEach(asParty)}
  known(){return seenAt(this.x,this.y)}
  get scoutable(){return false}
  get size0(){return 8}
  // its own raiders and chieftain, as campFight makes them (the bands sheltering join at the fight: world.js campFight)
  foes(){return makeEnemies(rint(7,9)+Math.floor(G.day/15),true)}
  attack(own){campFight(this,own)}
  pickable(){return this.known()&&!this.cleared}
  tip(){return '<b>Bandit camp</b>'+(this.cleared?'':chiefTip(this))+'<small>'+(this.cleared?'Cleared':'Its bands shelter here by night')+'</small>'+(this.cleared?'':'<span class="act">Click: ride up to it</span>')}
}

// travellers: a camp by the road; trade, sellswords, a fire, news; they move on after a few days
const travPrice=g=>Math.max(2,Math.ceil(GOODS[g].base*1.1*(1-.015*skill('trade'))));
// (a sellsword a tier up costs his training too)
const mercCost=(k,u)=>Math.round((hireCost(u||k)+(u&&u!==k?trainCost(k):0))*1.3);
const SWORD_BYNAMES=['the Tall','Redhand','Ashfoot','the Quiet','Longstride','of the Marches','Two-Blades','the Grey','Stonefist','the Lucky','Crowfeather','Half-Ear'];
class TravellersCamp extends Site{
  static ground(tx,ty){return tAt(tx,ty)!==T_ROAD&&nearTile(tx,ty,T_ROAD,1)}
  // (by a road: a tile beside one of the world's road tiles, drawn among them; ROAD_TILES, kept for the world)
  static pick(){const R=ROAD_TILES||(ROAD_TILES=tiles.reduce((a,k,i)=>(k===T_ROAD&&a.push(i),a),[]));if(!R.length)return super.pick();const i=R[rint(0,R.length-1)];return[i%MW+rint(-1,1),(i-i%MW)/MW+rint(-1,1)]}
  static clear(tx,ty){return campClear('travelers',tx,ty)}
  get TR(){return TRAVELERS[this.kind]||TRAVELERS[0]}
  setup(){this.kind=rint(0,TRAVELERS.length-1);this.stockUp()}
  // who they are this time: their goods, their sellswords, and the days until they move on
  stockUp(){const T=this.TR;this.name=T.n;this.until=G.day+rint(6,10);this.stock=Object.fromEntries(T.goods.map(g=>[g,rint(8,20)]));
    this.unit=T.race?(Math.random()<.5?RACES[T.race].melee:RACES[T.race].ranged):null;this.mercs=T.race?rint(2,4):0;this.news=false;this.special=false;this.fire=0;delete this.hired}
  // its sellswords (mercs: how many are still willing), each someone, seeded from the camp (its seed) and their place in line: a
  // name of their people, a look, and one in three a tier higher (dearer). Those hired leave the fire (hired: their places, kept
  // only once one is: the save is as it was until then)
  swords(){const u=this.unit,h=this.hired||[];if(!u)return [];const R=seeded(this.seed*977+31),N=FOLK_NAMES[this.TR.race]||FOLK_NAMES.human,used=new Set(),out=[];
    for(let i=0;i<this.mercs+h.length;i++){const k=R()<.34&&UP[u]&&UP[u][0]||u;let nm='';for(let j=0;j<20&&(!nm||used.has(nm));j++)nm=N[Math.floor(R()*N.length)]+' '+SWORD_BYNAMES[Math.floor(R()*SWORD_BYNAMES.length)];used.add(nm);
      const v=Math.floor(R()*6);if(!h.includes(i))out.push({i,k,name:nm,v,c:mercCost(k,u)})}return out}
  scoutLine(){return 'a camp of '+this.name.toLowerCase()}
  get empties(){return false}
  day(){super.day();if(G.day>=this.until&&G.site!==this){const p=siteSpot('travelers',W.sites.filter(o=>o!==this),9);if(p){this.tx=p[0];this.ty=p[1];this.placed()}
    this.kind=rint(0,TRAVELERS.length-1);this.seed=rint(1,99999);this.seen=false;this.stockUp();if(G.lastSite===this)G.lastSite=null}}
  flagCol(){return this.TR.col}
  banner(){return this.TR.col}
  box(box,camp){camp(this,siteSprite(this))}
  about(r){return '<p>'+this.TR.d+'</p><p class="muted">They break camp in '+Math.max(1,this.until-G.day)+' days.</p>'}
  // their wagons (the traders: their goods, your trophies) and their campfire (each sellsword, the pilgrims or minstrels, whoever
  // has news, and the fire to rest by)
  // (a sellsword's unit card open at the fire (G.siteCard: his place in line; i on his portrait, site-card): over the list, its Back the list)
  places(r){const TR=this.TR,s=this,left=Object.keys(s.stock).filter(g=>s.stock[g]>0).length,race=TR.race||'human',u=s.unit,card=G.siteCard!=null&&s.swords().find(w=>w.i===G.siteCard);
    return [{k:'trade',n:'Wagons',ico:'stall',note:left?left+' goods for sale':'sold out',
      body:railCards([{pic:personPic('merchant',race),name:'The traders',role:TR.n,facts:[left?left+' goods for sale':['Sold out','bad'],'They move on in '+Math.max(1,s.until-G.day)+' days']}])+'<div class="lab">Goods</div>'+
        Object.keys(s.stock).map(g=>{const p=travPrice(g),n=s.stock[g],k=Math.min(5,n);return railRow(GOODS[g].n,p+'g each · '+n+' left · you have '+goodN(g)+(k?' · '+k+' for '+p*k+'g':''),railBtn('site-buy',g,'Buy',!k?'Sold out':P.gold<p*k?'Not enough gold':goodRoom(g)<k?'No room in your bag':''))}).join('')+
        (P.inv.some(x=>x&&x.k==='mat')?railRow('Your trophies','They pay a little less than a town market: '+Math.round(P.inv.reduce((a,x)=>a+(x&&x.k==='mat'?matPrice(x.id)*x.n:0),0)*.85)+'g for all',railBtn('site-sellpick',null,'Sell')):'')},
      {k:'fire',n:'Campfire',short:'Fire',ico:'fire',note:[u&&(s.mercs?s.mercs+' sellsword'+(s.mercs>1?'s':'')+' willing':'no sellswords left'),TR.special&&!s.special&&(TR.special==='bless'?'a blessing':'a song'),s.news===G.day?'':'news',s.fire===G.day?'rested today':'rest'].filter(Boolean).join(' · '),
      body:card?'<div class="rec-info"><div class="btns"><button class="btn" type="button" data-act="site-card" data-arg="back">‹ Back to the fire</button></div>'+unitCard(card.k)+'</div>':
        railCards([...s.swords().map(w=>{const c=w.c;return {pic:portrait(w.k,false,w.v),info:['site-card',w.i],name:w.name,role:'Sellsword · '+ST[w.k].n,facts:['Tier '+ST[w.k].tier,c+'g','No standing needed'],
          acts:[['site-hire',w.i,'Hire',P.gold<c?'Not enough gold':partySize()>=partyCap()?'Your party is full':!partyRoster(P).canAdd(w.k)?'No room for another group':'']]}}),
        u&&!s.mercs&&{pic:portrait(u),name:'The sellswords',role:'Gone with their pay',facts:[['No one left to hire','bad']]},
        TR.special==='bless'&&{pic:personPic('priest',race),name:'The pilgrims',role:'Robed, singing softly',facts:[s.special?'They have blessed you':'A blessing: your mana restored, morale +8'],acts:[['site-bless',null,'Kneel',s.special?'They have blessed you already':'']]},
        TR.special==='song'&&{pic:personPic('innkeeper',race,2),name:'The minstrels',role:'A fiddle and painted wagons',facts:[s.special?'They sing of you already':'15 gold: renown +3, morale +5'],acts:[['site-song',null,'Pay 15g',s.special?'They already sing of you':P.gold<15?'Not enough gold':'']]},
        {pic:personPic('folk',race,5),name:'A greybeard by the fire',role:'Knows the roads',facts:[s.news===G.day?'You have heard his news today':s.news?'Tells what he hears on the roads':'Tells of places you have not found'],acts:[['site-news',null,'Ask for news',s.news===G.day?'You have heard their news today':'']]}])+
        '<div class="lab">The fire</div>'+railRow('Share their fire','Recover half your missing health, stamina and mana. Morale +5',railBtn('site-fire',null,'Rest',s.fire===G.day?'You rested here today':''))}]}
  act(a,arg,done){const s=this;
    if(a==='site-buy'){const g=arg,p=travPrice(g),k=Math.min(5,s.stock[g]||0);if(k&&P.gold>=p*k&&goodRoom(g)>=k){P.gold-=p*k;s.stock[g]-=k;invAdd('good',g,k);train('trade',k*p/40);done('You buy '+k+' '+GOODS[g].n.toLowerCase()+' for '+p*k+' gold.')}}
    // (Sell chooses first: which trophies; its Confirm sends site-sell with the bag's slots)
    else if(a==='site-sellpick'){const it=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k==='mat');if(it.length)railPicker({title:'Sell trophies',sub:s.name,total:'They pay',unit:'g',confirm:['site-sell','Sell'],back:['site-tab','trade','Back'],encode:sel=>Object.keys(sel).filter(i=>sel[i]).join(','),
      items:it.map(([x,i])=>({id:i,name:MATS[x.id].n+' ×'+x.n,sub:Math.round(matPrice(x.id)*x.n*.85)+'g',max:1,unit:Math.round(matPrice(x.id)*x.n*.85)}))});return true}
    else if(a==='site-sell'){let g=0;const pick=arg?String(arg).split(',').map(Number):null;P.inv.forEach((x,i)=>{if(x&&x.k==='mat'&&(!pick||pick.includes(i))){g+=matPrice(x.id)*x.n;P.inv[i]=null}});g=Math.round(g*.85);if(g){P.gold+=g;train('trade',g/20);done('The travellers buy your trophies for '+g+' gold.')}}
    // (one sellsword, by his place in line: his card goes)
    else if(a==='site-card'){G.siteCard=arg==='back'?null:+arg;showSite();return true}
    else if(a==='site-hire'){G.siteCard=null;const w=s.swords().find(x=>x.i===+arg),c=w&&w.c;
      if(w&&s.mercs>0&&P.gold>=c&&partySize()<partyCap()&&partyRoster(P).canAdd(w.k)){P.gold-=c;s.mercs--;(s.hired=s.hired||[]).push(w.i);P.add(w.k);done(w.name+' takes your coin and joins you as '+an(ST[w.k].n.toLowerCase())+'.')}}
    else if(a==='site-fire'&&s.fire!==G.day){const m=vitals();s.fire=G.day;P.hp+=(m[0]-P.hp)/2;P.sp+=(m[1]-P.sp)/2;P.mp+=(m[2]-P.mp)/2;P.morale=clamp(P.morale+5,0,100);done('You share their fire and their stew. Everyone sleeps well.')}
    else if(a==='site-news'&&s.news!==G.day){const first=!s.news;s.news=G.day;
      const far=first?W.sites.filter(o=>!o.seen&&o.scoutable&&!(o instanceof TravellersCamp)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,2):[];
      far.forEach(o=>o.seen=true);const it=rumourFrom(rumourSource('camp',s.tx+','+s.ty,s)).today[0];
      done([far.length?'They tell you of '+far.map(o=>'the '+o.label+' to the '+compass(o.x-s.x,o.y-s.y)).join(', and ')+'. '+(far.length>1?'Both are':'It is')+' on your map now.':'',it?'“'+rumourText(it)+'”':''].filter(Boolean).join(' ')||'They have no news you have not heard.')}
    else if(a==='site-bless'&&!s.special){s.special=true;vitals();P.mp=maxMP();P.morale=clamp(P.morale+8,0,100);done('The pilgrims pray over you. Your mind is clear.')}
    else if(a==='site-song'&&!s.special&&P.gold>=15){s.special=true;P.gold-=15;P.renown+=3;P.morale=clamp(P.morale+5,0,100);done('By the next town, children are singing of you. (+3 renown)')}
    return true}
}
const SITE_CLASS={camp:BanditCamp,cave:Cave,travelers:TravellersCamp,hideout:Hideout,ruins:Ruins,shrine:Shrine};
// a site of its kind again (from a save)
const siteOf=s=>{if(s instanceof Site)return s;Object.setPrototypeOf(s,SITE_CLASS[s.type].prototype);s.restore();return s};
const camps=()=>W.sites.filter(s=>s instanceof BanditCamp);

/* placement */
// the least distance (tiles) between two kinds of site, past siteSpot's gap, never relaxed (the owner's play-test, 2026-10-22:
// "too many pilgrim and wanderer camps"): a travellers' camp far from another, and from the outlaws' camps and hideouts (no
// traders' fire beside a bandits' den; a bandit camp stands on its spot first, a hideout keeps the gap to the travellers before it);
// a hideout far from another and from the bandit camps (the owner, 2026-10-23: deep in the wilds, each its own stretch of them)
const SITE_GAP={travelers:{travelers:30,camp:16,hideout:16},hideout:{travelers:16,camp:16,hideout:20}};
const siteGap=(a,b)=>SITE_GAP[a]&&SITE_GAP[a][b]||0;
// a free tile for a site of this kind: reachable from the roads, on its ground, clear of holdings and other sites (the camps among
// them; SITE_GAP's kinds farther); each try a tile its kind picks (Site pick)
let ROAD_TILES=null;onWorld(()=>{ROAD_TILES=null});
function siteSpot(type,sites,gap){
  const C=SITE_CLASS[type],from=startHolding();
  for(let k=0;k<5000;k++){
    const g=k<2500?gap:gap*.6,[tx,ty]=C.pick(),fy=C.reachRow(ty);// where parties reach it
    if(tx<3||ty<3||tx>MW-4||ty>MH-4)continue;
    if(!passable(tAt(tx,fy))||!Router.reach(from,{x:(tx+.5)*TILE,y:(fy+.5)*TILE})||!C.ground(tx,ty)||!C.clear(tx,ty)||!C.fits(tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<6)||sites.some(s=>Math.hypot(s.tx-tx,s.ty-ty)<Math.max(g,siteGap(type,s.type))))continue;
    return[tx,ty];
  }
  return null;
}
// which beasts lair here: monsters whose habitat matches the spot, the rare ones less often
function caveMonster(x,y){
  const tags=[...habitatAt(x,y),climAt(x,y)],ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.some(w=>tags.includes(w)));
  if(!ids.length)return'bear';let r=Math.random()*ids.reduce((a,id)=>a+MONSTERS[id].w,0);for(const id of ids){r-=MONSTERS[id].w;if(r<=0)return id}return ids[0];
}
function makeSite(type,tx,ty,sites){
  const C=SITE_CLASS[type],[x,y]=C.point(tx,ty),s=Object.assign(Object.create(C.prototype),{i:sites.length,type,tx,ty,x,y,seed:rint(1,99999),seen:false,cleared:false,back:0});
  s.setup(sites,climAt(x,y));return s;
}
// a world's sites: a camp on each of its camp spots, then of each other kind as many as the world holds (density(WM), data/world.js)
function genSites(){
  const sites=[],N=density(WM).sites;for(const c of CAMP_SPOTS)sites.push(makeSite('camp',c.tx,c.ty,sites));
  for(const type of Object.keys(SITE_TYPES))if(!SITE_TYPES[type].spots)for(let n=0;n<(N[type]||0);n++){const p=siteSpot(type,sites,9);if(p)sites.push(makeSite(type,p[0],p[1],sites))}
  return sites;
}

/* on the map */
// spot sites in view, and forget the one you last left once you are well away from it (G.lastSite). A site opens only when you
// clicked or tapped it (the owner, 2026-10-22): a click beside it opens it at once, one further off walks you there and opens it
// on arrival (world.js clickAt, the chase: marchStep meets it); walking past one, or stopping by one you did not click, opens
// nothing. Never opens anything itself (false)
function updateSites(){
  const V=vis();
  for(const s of W.sites){
    const dd=Math.hypot(P.x-s.x,P.y-s.y);
    if(!s.seen&&s.scoutable&&dd<V*.9){s.seen=true;train('scout',4);log('Your scouts spot '+s.scoutLine()+'.')}
    if(G.lastSite===s&&dd>28)G.lastSite=null;
  }
  return false;
}
const enterSite=s=>s.enter();
// the day's changes: emptied places fill again, travellers pack up and move on
function siteDay(){for(const s of W.sites)s.day()}
// a cave or ruin's chest: gold that grows with the days, usually a piece of gear, and maybe valuables
function siteChest(s){
  const C=s.chest,top=Math.min(MATERIALS.length-1,1+Math.floor(G.day/20)),gold=rint(30,70)+G.day*2+C.gold;P.gold+=gold;
  let x=' The chest holds <strong class="gold">'+gold+' gold</strong>';
  if(Math.random()<C.gear){const id=randomGear(Math.max(0,top-1),Math.min(MATERIALS.length-1,top+1));
    x+=invAdd('gear',id,1)?' and a <span style="color:'+RARITY[ITEMS[id].r]+'">'+ITEMS[id].n+'</span>':'. '+BAG_FULL+': you leave the '+ITEMS[id].n;}
  return x+'.'+valuablesFound(C.finds);
}
/* valuables found (doc/ITEMS_DESIGN.md §4b) where: a cave's or a ruin's chest, a bandit camp's plunder, a beaten chieftain's or
   lord's purse (VALUE_FINDS: the chance of any, how many, of which rarities, each by its weight). Drawn from the stream
   'valuables' (core/rng.js: so the world's Math.random stays as it was), into your bag (or onto the loot pile): in words ('' none) */
function valuablesFound(where){
  const F=VALUE_FINDS[where],r=rngOf('valuables');if(!F||!r.chance(F.p))return '';
  const ids=Object.keys(VALUABLES).filter(k=>F.r.includes(VALUABLES[k].r)),got={};
  for(let i=r.int(F.n[0],F.n[1]);i>0;i--){const id=r.weighted(ids,k=>VALUE_RARITY[VALUABLES[k].r]);got[id]=(got[id]||0)+1}
  const said=Object.entries(got).map(([id,n])=>{const k=invAdd('val',id,n),w=VALUABLES[id].n.toLowerCase();return k?k>1?k+' × '+w:an(w):''}).filter(Boolean);
  return said.length?' '+(where==='lord'||where==='chief'?'His purse holds ':where==='camp'?'Among their plunder: ':'Among the gold: ')+said.join(', ')+'.':' '+BAG_FULL+': you leave their valuables.';
}
// (lv: its level as your scouts saw it; else rolled now)
function caveFight(s,lv){
  const M=MONSTERS[s.id];s.lv=lv||monLevel()+1;
  startEncounter({kind:'cave',ref:s,lv:s.lv,list:Array(M.count[1]+1).fill(M.unit)});
}

/* the window (window.js): a page (PAGE_SCREEN: the site's page, G.siteTab a step inside it), or the site's areas down the rail,
   the chosen one's window beside it (G.siteTab; none: its overview, what it is and what is in each area); the last result
   (G.siteMsg) under whichever is open */
function showSite(){
  const s=G.site,r=regionAt(s.x,s.y),where=s.T.n+' · '+r.name;
  if(s.screen===PAGE_SCREEN){const p=s.page(r,G.siteTab);return PAGE_SCREEN.show({ico:s.T.ico,title:p.title||s.name,sub:p.title?s.name:where,banner:s.view(),body:p.body,acts:p.acts,note:p.note,msg:p.msg??G.siteMsg,
    back:p.back||null,close:p.close||['site-leave',null,'Leave']},'site:'+s.i+':'+(G.siteTab||''))}
  const ps=s.places(r),p=ps.find(x=>x.k===G.siteTab);if(!p)G.siteTab=null;
  showRail({head:{act:['site-tab','home'],on:!p,ico:s.T.ico,name:s.name,sub:where,back:!!p},label:'Places',gold:true,
    items:ps.map(x=>({act:'site-tab',arg:x.k,ico:x.ico,n:x.n,short:x.short,on:x===p})),
    title:p?p.n:s.name,sub:p?s.name:where,
    body:(p?p.body:s.about(r)+s.screen.overview(ps.map(x=>({...x,act:'site-tab',arg:x.k}))))+
      (G.siteMsg?'<p class="gold">'+G.siteMsg+'</p>':''),
    back:p?['site-tab','home','Back']:null,close:['site-leave',null,'Leave']},'site:'+s.i+':'+(G.siteTab||''));
}
function siteAct(a,arg){
  if(!a.startsWith('site-'))return false;
  const s=G.site;if(G.mode!=='site'||!s)return true;
  const done=m=>{G.siteMsg=m;log(m.replace(/<[^>]+>/g,''));updateHUD(true);showSite();railFocus(a,arg)};
  if(a==='site-leave'){G.site=null;G.siteCard=null;G.mode='world';hidePanel();saveGame(true);return true}
  if(a==='site-tab'){G.siteTab=arg==='home'?null:arg;G.siteMsg='';G.siteCard=null;showSite();return true}// (a place on the rail, or home: the overview)
  s.act(a,arg,done);return true;
}
onAct('site-',siteAct);
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'sites',order:{day:70,frame:60},day:siteDay,frame:updateSites,ends:true});
