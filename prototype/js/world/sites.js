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
  ruins:{n:'Ruins',ico:'ruin',col:'#e8d8a0',respawn:40,d:'Search them for old treasure, but something may still guard it.'},
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
// and its mouth opens onto the ground in front (any you can walk), where parties reach it. Its point (x, y) is that mouth,
// CAVE_MOUTH pixels into the tile in front.
const CAVE_MOUTH=2;
// a camp's tiles, from its picture: [left, top] from its own tile, then [across, deep]
const CAMP_FOOT={};
const campFoot=type=>CAMP_FOOT[type]||(CAMP_FOOT[type]=(c=>[(8-c.ax)/TILE,1-c.ay/TILE,c.w/TILE,c.h/TILE])(PX.site({type,seed:1})));
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
  // met: walked into (a fight, or its window), the one you last left (G.lastSite: not opened again as you stand by it)
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
  // walking in: a fight, or its window; false if nothing opened. A visit: what your scouts saw (G.siteSpy) is this visit's
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
    return{key:'site:'+s.type+':'+s.seed+':'+(s.kind??'')+':'+(on?1:0),x:s.x,y:s.y+8,alt:s.name,ps:[s.patch&&[groundPatch(climAt(s.x,s.y)),s.x-15,s.y-4],sp.sh&&[sp.sh,X,Y,SHADOW.a],[sp,X,Y,on?1:.5],
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
  scoutDeed(){const tried=G.siteSpy&&G.siteSpy.s===this;return{icon:'eye',label:'Scout',act:'site-scout',facts:[Math.round(scoutChance()*100)+'% unseen','once a visit'],why:tried?'Your scouts have had their look':'',
    tip:'Send your scouts for a close look: unseen, they see exactly what is there. Seen, it comes for you. Scouting and Agility help, and the night; a big band is harder to hide.'}}
  // the day's change: back after being cleared, and whatever its kind does
  day(){if(this.cleared&&G.day>=this.back){this.cleared=false;this.returned()}}
  returned(){}
  // the treasure it may hold (siteChest): extra gold, and the chance of gear
  get chest(){return{gold:0,gear:.7}}
  // on the map: a patch of ground under it, its banner's colour, a banner of its own (travellers), clicked where
  get patch(){return true}
  flagCol(){return '#2a1e14'}
  banner(){return null}
  pickable(){return this.known()}
  pick(at){if(this.pickable())this.box(at.box,at.camp)}
  box(box,camp){box(this,this.x-8,this.y-8,this.x+8,this.y+8)}
  // drawn once you know of it (as you last saw it, outside your sight: a building, render.js drawWorld), its name near you; dotted
  // on the minimap in its kind's colour (grey, cleared)
  inView(V){return this.known()}
  draw(ents,cam,V){if(!this.inView(V))return;const s=this;
    const sp0=siteSprite(s);ents.push({st:true,y:s.y,sh:sp0.sh?[sp0.sh,Math.round(s.x-cam.x)-sp0.ax,Math.round(s.y-cam.y)+8-sp0.ay]:null,f:()=>{const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y);if(s.patch)ctx.drawImage(groundPatch(climAt(s.x,s.y)),sx-15,sy-4);if(s.cleared)ctx.globalAlpha=.5;const sp=siteSprite(s);ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);if(!s.cleared)depthPic(sp,sx-sp.ax,sy+8-sp.ay);if(sp.fire&&!s.cleared)drawFire(sx-sp.ax+sp.fire[0],sy+8-sp.ay+sp.fire[1],s.seed);if(sp.flag&&!s.cleared)drawFlag(s.flagCol(),sx-sp.ax+sp.flag[0],sy+8-sp.ay+sp.flag[1],s.seed);ctx.globalAlpha=1;
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
  static clear(tx,ty){return!occAt(tx,ty)&&passable(tAt(tx,ty+1))&&!occAt(tx,ty+1)}
  static point(tx,ty){return[(tx+.5)*TILE,(ty+1)*TILE+CAVE_MOUTH]}
  static reachRow(ty){return ty+1}
  setup(sites){this.name=unusedName(CAVE_NAMES,sites);this.id=caveMonster(this.x,this.y)}
  returned(){this.id=caveMonster(this.x,this.y)}// (something new moves in)
  get patch(){return false}
  get mouth(){return true}
  get scouts(){return true}
  box(box){box(this,this.x-8,this.y-16-CAVE_MOUTH,this.x+8,this.y+2)}
  get lair(){const M=MONSTERS[this.id];return{M,U:ST[M.unit],n:M.count[1]+1}}
  about(r){const {M,n}=this.lair;return '<p>A cave mouth in the '+r.name.toLowerCase()+'. '+(this.spied()?M.n+' lair here, more than you would meet in the open.':'Bones and tracks litter the ground: '+beastSize(M.unit)+' tracks, '+fewSay(n)+' of them, going in and out.')+'</p><p class="muted">'+this.T.d+'</p>'}
  // (its fight's level, rolled now and kept for it: caveFight)
  spyRoll(){return{lv:monLevel()+1}}
  spyLine(){const {U,n}=this.lair;return 'Your scouts creep to the mouth and back unseen: '+n+' × '+U.n.toLowerCase()+', level '+this.spied().lv+'.'}
  alarm(){G.site=null;log('A stone rolls under a scout’s boot. Something wakes in the dark.','bad');caveFight(this)}
  power(lv){const {M,n}=this.lair;return rating(Array(n).fill(M.unit),lv)}
  page(r){const {M,U,n}=this.lair,y=this.spied(),loot=y&&['trophy: '+MATS[M.mat].n.toLowerCase(),...M.gear.map(([it,ch])=>ITEMS[it].n+' ('+Math.round(Math.min(1,ch*(1+.1*(y.lv-1)))*100)+'%)'),'a chest'].join(', ');
    return{body:this.about(r)+(y?'<div class="lab">What your scouts saw</div>'+railCards([{pic:portrait(M.unit),name:U.n,role:'Lairing in the cave',n,facts:['Level '+y.lv,['Stronger than usual','bad'],'Power '+this.power(y.lv)+' vs your '+partyPower()],note:'Likely loot: '+loot+'.'}]):
        pageFacts([cap1(fewSay(n))+', '+beastSize(M.unit),'you cannot tell what without a closer look','a chest, they say'])),
      acts:[this.scoutDeed(),{icon:'cave',label:'Enter',act:'site-ask',facts:[y?'power '+this.power(y.lv)+' vs '+partyPower():'what lairs there: unknown','a chest'],tip:'Go in and fight whatever lairs there. It asks you first.'}],
      note:'Whatever lairs here fights harder than in the open.'}}
  act(a,arg,done){if(super.act(a,arg,done))return true;if(this.cleared)return false;const y=this.spied(),{U,n}=this.lair;
    if(a==='site-ask'){railConfirm({title:'Enter the '+this.name+'?',sub:this.T.n,text:y?n+' × '+U.n.toLowerCase()+' (level '+y.lv+') wait in the dark. Once inside, you fight.':'Something lairs in the dark. Once inside, you fight.',
      facts:[y?'Power '+this.power(y.lv)+' vs your '+partyPower():'You do not know what you will meet'],confirm:['site-fight',null,'Enter'],back:['site-tab','home','Back']});return true}
    if(a==='site-fight'){G.site=null;caveFight(this,y&&y.lv);return true}return false}
  get clearJob(){return true}
}

// ruins: search them for old treasure, or old lore; something may still guard them
class Ruins extends Site{
  get screen(){return PAGE_SCREEN}
  setup(sites){this.name=unusedName(RUIN_NAMES,sites)}
  get chest(){return{gold:40,gear:.9}}
  about(r){return '<p>Broken walls in the '+r.name.toLowerCase()+', older than any kingdom on your maps.</p><p class="muted">'+this.T.d+'</p>'}
  page(r){return{body:this.about(r)+pageFacts([this.cleared?'Searched: empty for now':'Treasure, old lore, or guardians that do not sleep']),
    acts:[{icon:'ruin',label:'Search',act:'site-search',facts:['treasure, lore','or guardians'],why:this.cleared?'Searched: empty for now':'',tip:'Search the ruins: a sealed chest, the old kings’ carvings, or guardians that wake.'}]}}
  act(a,arg,done){
    if(a!=='site-search'||this.cleared)return false;const r=Math.random();
    if(r<.3){G.site=null;this.id=caveMonster(this.x,this.y);caveFight(this);log('Stones shift in the dark. The ruins have guardians.','bad');return true}
    this.cleared=true;this.back=G.day+this.T.respawn;
    if(r<.75){done('Under a fallen slab you find a sealed chest.'+siteChest(this));return true}
    gainXp(30);P.renown+=2;done('No treasure, but the carvings tell of the old kings. You learn much. (+30 XP, +2 renown)');return true}
}

// a shrine: pray once a week to recover, or leave an offering
class Shrine extends Site{
  get screen(){return PAGE_SCREEN}
  setup(sites,clim){this.name=SHRINE_NAMES[terrAt(this.x,this.y)===T_FOREST?'forest':clim]}
  get empties(){return false}
  about(r){return '<p>The '+this.name+' stands alone in the '+r.name.toLowerCase()+'. Old offerings lie at its foot.</p><p class="muted">'+this.T.d+'</p>'}
  page(r){const ready=G.day>=this.back,why=ready?'':'Wait '+(this.back-G.day)+' more days';
    return{body:this.about(r)+'<ul class="tnotes"><li>Pray at the altar: your stamina and mana restored, some health, morale +6.</li><li>Leave 25 gold on the offering stone: fully restored, morale +10, +40 XP.</li><li>'+(ready?'You may pray: once a week.':'<span class="gold">You may pray again in '+(this.back-G.day)+' days.</span>')+'</li></ul>',
      acts:[{icon:'altar',label:'Pray',act:'site-pray',arg:'0',facts:['stamina, mana, health','morale +6'],why,tip:'Kneel at the altar: your stamina and mana come back, some health, morale +6. Once a week.'},
        {icon:'gold',label:'Offer 25g',act:'site-pray',arg:'1',facts:['fully restored','morale +10 · +40 XP'],why:why||(P.gold<25?'Not enough gold':''),tip:'Leave 25 gold on the offering stone: fully restored, morale +10, +40 XP. Once a week.'}]}}
  act(a,arg,done){
    if(a!=='site-pray'||G.day<this.back)return false;const m=vitals();
    if(arg==='1'){if(P.gold<25)return true;P.gold-=25;restoreVitals();P.morale=clamp(P.morale+10,0,100);gainXp(40);this.back=G.day+7;done('You leave 25 gold at the '+this.name+'. Warmth runs through you. (+40 XP)');return true}
    P.sp=m[1];P.mp=m[2];P.hp=Math.min(m[0],P.hp+m[0]*.25);P.morale=clamp(P.morale+6,0,100);this.back=G.day+7;done('You kneel at the '+this.name+'. Your strength returns.');return true}
}

/* a bandit lair, a hideout or a camp: a chieftain and his raiders. Walking up opens its page: what you can see from outside
   (guess: about how many, how strong they look, the talk of their loot; its chieftain is known by name), Scout for the truth
   (the fight's foes rolled then: the fight is the one they saw), Attack (it asks first: the fight as walking in always made it),
   Parley (pay them to break camp, or make them yield if they fear you: parley.js lairPay, lairYield, lairFate), Leave. Cleared,
   it lies empty. A new chief takes it when it returns */
class Lair extends Site{
  get screen(){return PAGE_SCREEN}
  get scouts(){return true}
  get emptyPage(){return true}
  get bandKind(){return this.band||'bandits'}
  returned(){this.ld=newChief(this.bandKind,rint(1,3)+Math.floor(G.day/30))}
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
          {icon:'prisoners',label:'Demand surrender',act:'site-yield',facts:[afraid?ch+'% they yield':'they do not fear you','else they fight'],why:afraid?'':'They do not fear you: it takes about twice their strength',tip:'Call on them to yield, as a cornered band would. If they do, you choose their fate: prisoners, recruits or let go. If not, they fight.'}],
        note:'They '+(afraid?'eye your band warily.':'laugh at your band.'),back:['site-tab','home','Back']}}
    const all=y&&s.all(y.list),pw=all?s.power(all):g.pw,lk=looks(pw/Math.max(1,partyPower())),gold=all?all.length*4+25:0;
    return{body:'<p class="muted">'+s.T.d+'</p>'+(y?'<div class="lab">What your scouts saw</div>'+railCards(Object.entries(countsOf(all)).map(([k,n])=>({pic:portrait(k),name:k==='chief'&&ld?chiefLabel(ld):ST[k].n,role:k==='chief'?'Their chieftain · bounty '+bountyOf(ld)+'g':'Tier '+ST[k].tier,n})))+
        '<ul class="tnotes"><li>Power <b>'+pw+'</b> vs your '+partyPower()+'.</li><li>Loot: about '+gold+' gold in their purses, likely a piece of gear (4 in 5), and '+(ld?ld.name:'their chieftain')+' to take captive ('+bountyOf(ld)+'g bounty).</li></ul>':
        pageFacts([cap1(roughly(g.n))+' '+band.toLowerCase()+(s.sheltering().length?', bands among them sheltering for the night':''),'<span class="'+lk[1]+'">'+lk[0].replace('They','they')+'</span>'])+
        '<ul class="tnotes"><li>Led by '+(ld?chiefLabel(ld)+', '+bountyOf(ld)+' gold on his head':'a chieftain')+'.</li><li>Talk of plunder piled in the tents.</li></ul>'),
      acts:[s.scoutDeed(),{icon:'sword',label:'Attack',act:'site-ask',facts:[y?'power '+pw+' vs '+partyPower():lk[0].replace('They look ','')],tip:'Storm it: its fighters, its chieftain and any band sheltering there. It asks you first.'},
        {icon:'truce',label:'Parley',act:'site-tab',arg:'parley',facts:['pay them off','or make them yield'],tip:'Talk: pay them to break camp, or, if they fear you, demand their surrender.'}]}}
  act(a,arg,done){if(super.act(a,arg,done))return true;if(this.cleared)return false;const s=this,y=s.spied();
    if(a==='site-ask'){const g=s.guess(),all=y&&s.all(y.list);railConfirm({title:'Attack the '+s.T.n.toLowerCase()+'?',sub:s.name,text:'You storm it: '+(all?all.length+' fighters':roughly(g.n)+' of them, as far as you can tell')+', their chieftain at their head.',
      facts:[all?'Power '+s.power(all)+' vs your '+partyPower():looks(g.pw/Math.max(1,partyPower()))[0],'You may still call it off before the first blow'],confirm:['site-attack',null,'Attack'],back:['site-tab','home','Back']});return true}
    if(a==='site-attack'){s.fight(true,y&&y.list);return true}
    if(a==='site-pay'){const m=lairPay(s);if(m){G.siteTab=null;done(m)}return true}
    if(a==='site-yield'){const m=lairYield(s);if(m){G.siteTab='yield';done(m)}return true}
    if(a==='site-fate'){const yl=G.siteSpy&&G.siteSpy.s===s&&G.siteSpy.yielded;if(yl){G.siteTab=null;done(lairFate(s,yl,arg))}return true}
    return false}
}
// a hideout: hidden off the roads, its raiders by the climate; it keeps clear of the estates (lots.js)
class Hideout extends Lair{
  static ground(tx,ty){return tAt(tx,ty)!==T_ROAD&&!nearTile(tx,ty,T_ROAD,3)}
  static clear(tx,ty){return campClear('hideout',tx,ty)}
  static fits(tx,ty){return !estateNear(tx,ty,BANDIT_GAP)}
  setup(sites,clim){this.band=clim==='desert'?'raiders':clim==='swamp'?'bog':'bandits';this.name=HIDEOUT_NAMES[this.band];this.ld=newChief(this.band,rint(1,3),sites)}
  get size0(){return 6}
  // its raiders and chieftain (makeEnemies, as startEncounter makes them from n), and the fight with them
  foes(){const n=rint(5,7)+Math.floor(G.day/15);return makeEnemies(n,true,this.band)}
  attack(own){startEncounter(own?{kind:'camp',ref:this,n:own.length-1,list:own,band:this.band}:{kind:'camp',ref:this,n:rint(5,7)+Math.floor(G.day/15),band:this.band})}
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
  places(r){const TR=this.TR,s=this,left=Object.keys(s.stock).filter(g=>s.stock[g]>0).length,race=TR.race||'human',u=s.unit;
    return [{k:'trade',n:'Wagons',ico:'stall',note:left?left+' goods for sale':'sold out',
      body:railCards([{pic:personPic('merchant',race),name:'The traders',role:TR.n,facts:[left?left+' goods for sale':['Sold out','bad'],'They move on in '+Math.max(1,s.until-G.day)+' days']}])+'<div class="lab">Goods</div>'+
        Object.keys(s.stock).map(g=>{const p=travPrice(g),n=s.stock[g],k=Math.min(5,n);return railRow(GOODS[g].n,p+'g each · '+n+' left · you have '+goodN(g)+(k?' · '+k+' for '+p*k+'g':''),railBtn('site-buy',g,'Buy',!k?'Sold out':P.gold<p*k?'Not enough gold':goodRoom(g)<k?'No room in your bag':''))}).join('')+
        (P.inv.some(x=>x&&x.k==='mat')?railRow('Your trophies','They pay a little less than a town market: '+Math.round(P.inv.reduce((a,x)=>a+(x&&x.k==='mat'?matPrice(x.id)*x.n:0),0)*.85)+'g for all',railBtn('site-sellpick',null,'Sell')):'')},
      {k:'fire',n:'Campfire',short:'Fire',ico:'fire',note:[u&&(s.mercs?s.mercs+' sellsword'+(s.mercs>1?'s':'')+' willing':'no sellswords left'),TR.special&&!s.special&&(TR.special==='bless'?'a blessing':'a song'),s.news?'':'news',s.fire===G.day?'rested today':'rest'].filter(Boolean).join(' · '),
      body:railCards([...s.swords().map(w=>{const c=w.c;return {pic:portrait(w.k,false,w.v),name:w.name,role:'Sellsword · '+ST[w.k].n,facts:['Tier '+ST[w.k].tier,c+'g','No standing needed'],
          acts:[['site-hire',w.i,'Hire',P.gold<c?'Not enough gold':partySize()>=partyCap()?'Your party is full':!partyRoster(P).canAdd(w.k)?'No room for another group':'']]}}),
        u&&!s.mercs&&{pic:portrait(u),name:'The sellswords',role:'Gone with their pay',facts:[['No one left to hire','bad']]},
        TR.special==='bless'&&{pic:personPic('priest',race),name:'The pilgrims',role:'Robed, singing softly',facts:[s.special?'They have blessed you':'A blessing: your mana restored, morale +8'],acts:[['site-bless',null,'Kneel',s.special?'They have blessed you already':'']]},
        TR.special==='song'&&{pic:personPic('innkeeper',race,2),name:'The minstrels',role:'A fiddle and painted wagons',facts:[s.special?'They sing of you already':'15 gold: renown +3, morale +5'],acts:[['site-song',null,'Pay 15g',s.special?'They already sing of you':P.gold<15?'Not enough gold':'']]},
        {pic:personPic('folk',race,5),name:'A greybeard by the fire',role:'Knows the roads',facts:[s.news?'You have heard his news':'Tells of places you have not found'],acts:[['site-news',null,'Ask for news',s.news?'You have heard their news':'']]}])+
        '<div class="lab">The fire</div>'+railRow('Share their fire','Recover half your missing health, stamina and mana. Morale +5',railBtn('site-fire',null,'Rest',s.fire===G.day?'You rested here today':''))}]}
  act(a,arg,done){const s=this;
    if(a==='site-buy'){const g=arg,p=travPrice(g),k=Math.min(5,s.stock[g]||0);if(k&&P.gold>=p*k&&goodRoom(g)>=k){P.gold-=p*k;s.stock[g]-=k;invAdd('good',g,k);train('trade',k*p/40);done('You buy '+k+' '+GOODS[g].n.toLowerCase()+' for '+p*k+' gold.')}}
    // (Sell chooses first: which trophies; its Confirm sends site-sell with the bag's slots)
    else if(a==='site-sellpick'){const it=P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k==='mat');if(it.length)railPicker({title:'Sell trophies',sub:s.name,total:'They pay',unit:'g',confirm:['site-sell','Sell'],back:['site-tab','trade','Back'],encode:sel=>Object.keys(sel).filter(i=>sel[i]).join(','),
      items:it.map(([x,i])=>({id:i,name:MATS[x.id].n+' ×'+x.n,sub:Math.round(matPrice(x.id)*x.n*.85)+'g',max:1,unit:Math.round(matPrice(x.id)*x.n*.85)}))});return true}
    else if(a==='site-sell'){let g=0;const pick=arg?String(arg).split(',').map(Number):null;P.inv.forEach((x,i)=>{if(x&&x.k==='mat'&&(!pick||pick.includes(i))){g+=matPrice(x.id)*x.n;P.inv[i]=null}});g=Math.round(g*.85);if(g){P.gold+=g;train('trade',g/20);done('The travellers buy your trophies for '+g+' gold.')}}
    // (one sellsword, by his place in line: his card goes)
    else if(a==='site-hire'){const w=s.swords().find(x=>x.i===+arg),c=w&&w.c;
      if(w&&s.mercs>0&&P.gold>=c&&partySize()<partyCap()&&partyRoster(P).canAdd(w.k)){P.gold-=c;s.mercs--;(s.hired=s.hired||[]).push(w.i);P.add(w.k);done(w.name+' takes your coin and joins you as '+an(ST[w.k].n.toLowerCase())+'.')}}
    else if(a==='site-fire'&&s.fire!==G.day){const m=vitals();s.fire=G.day;P.hp+=(m[0]-P.hp)/2;P.sp+=(m[1]-P.sp)/2;P.mp+=(m[2]-P.mp)/2;P.morale=clamp(P.morale+5,0,100);done('You share their fire and their stew. Everyone sleeps well.')}
    else if(a==='site-news'&&!s.news){s.news=true;
      const far=W.sites.filter(o=>!o.seen&&o.scoutable&&!(o instanceof TravellersCamp)).sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,2);
      far.forEach(o=>o.seen=true);
      done(far.length?'They tell you of '+far.map(o=>'the '+o.label+' to the '+compass(o.x-s.x,o.y-s.y)).join(', and ')+'. Both are on your map now.':'They have no news you have not heard.')}
    else if(a==='site-bless'&&!s.special){s.special=true;vitals();P.mp=maxMP();P.morale=clamp(P.morale+8,0,100);done('The pilgrims pray over you. Your mind is clear.')}
    else if(a==='site-song'&&!s.special&&P.gold>=15){s.special=true;P.gold-=15;P.renown+=3;P.morale=clamp(P.morale+5,0,100);done('By the next town, children are singing of you. (+3 renown)')}
    return true}
}
const SITE_CLASS={camp:BanditCamp,cave:Cave,travelers:TravellersCamp,hideout:Hideout,ruins:Ruins,shrine:Shrine};
// a site of its kind again (from a save)
const siteOf=s=>{if(s instanceof Site)return s;Object.setPrototypeOf(s,SITE_CLASS[s.type].prototype);s.restore();return s};
const camps=()=>W.sites.filter(s=>s instanceof BanditCamp);

/* placement */
// a free tile for a site of this kind: reachable from the roads, on its ground, clear of holdings and other sites (the camps among them)
function siteSpot(type,sites,gap){
  const C=SITE_CLASS[type],from=startHolding();
  for(let k=0;k<5000;k++){
    const g=k<2500?gap:gap*.6,tx=rint(3,MW-4),ty=rint(3,MH-4),fy=C.reachRow(ty);// where parties reach it
    if(!passable(tAt(tx,fy))||!Router.reach(from,{x:(tx+.5)*TILE,y:(fy+.5)*TILE})||!C.ground(tx,ty)||!C.clear(tx,ty)||!C.fits(tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<6)||sites.some(s=>Math.hypot(s.tx-tx,s.ty-ty)<g))continue;
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
// a world's sites: a camp on each of its camp spots, then of each other kind as many as its size of map holds (data/world.js)
function genSites(){
  const sites=[],N=density().sites;for(const c of CAMP_SPOTS)sites.push(makeSite('camp',c.tx,c.ty,sites));
  for(const type of Object.keys(SITE_TYPES))if(!SITE_TYPES[type].spots)for(let n=0;n<(N[type]||0);n++){const p=siteSpot(type,sites,9);if(p)sites.push(makeSite(type,p[0],p[1],sites))}
  return sites;
}

/* on the map */
// spot sites in view, and step into one you reach. Returns true if a panel or a fight opened.
function updateSites(){
  const V=vis();
  for(const s of W.sites){
    const dd=Math.hypot(P.x-s.x,P.y-s.y);
    if(!s.seen&&s.scoutable&&dd<V*.9){s.seen=true;train('scout',4);log('Your scouts spot '+s.scoutLine()+'.')}
    if(G.lastSite===s){if(dd>28)G.lastSite=null;continue}
    if(dd<12&&!G.modal&&G.encCool<=0){G.lastSite=s;P.tx=null;return enterSite(s)}
  }
  return false;
}
const enterSite=s=>s.enter();
// the day's changes: emptied places fill again, travellers pack up and move on
function siteDay(){for(const s of W.sites)s.day()}
// a cave or ruin's chest: gold that grows with the days, and usually a piece of gear
function siteChest(s){
  const C=s.chest,top=Math.min(MATERIALS.length-1,1+Math.floor(G.day/20)),gold=rint(30,70)+G.day*2+C.gold;P.gold+=gold;
  let x=' The chest holds <strong class="gold">'+gold+' gold</strong>';
  if(Math.random()<C.gear){const id=randomGear(Math.max(0,top-1),Math.min(MATERIALS.length-1,top+1));
    x+=invAdd('gear',id,1)?' and a <span style="color:'+RARITY[ITEMS[id].r]+'">'+ITEMS[id].n+'</span>':'. Your bag is too full for the '+ITEMS[id].n;}
  return x+'.';
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
  if(a==='site-leave'){G.site=null;G.mode='world';hidePanel();saveGame(true);return true}
  if(a==='site-tab'){G.siteTab=arg==='home'?null:arg;G.siteMsg='';showSite();return true}// (a place on the rail, or home: the overview)
  s.act(a,arg,done);return true;
}
onAct('site-',siteAct);
