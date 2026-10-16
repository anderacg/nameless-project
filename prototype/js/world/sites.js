'use strict';
/* ---------- sites: bandit camps, caves, traveller camps, bandit hideouts, ruins and shrines scattered across the map ---------- */
// Each site in W.sites: {i, type, name, tx, ty, x, y, seed, seen, cleared, back} plus fields of its kind, read through its class (below).
// Sites stay hidden until your scouts see them. Clearing a cave or hideout, or searching ruins, empties it until day `back`.
// spots: stands on the map's fixed CAMP_SPOTS (places.js), in plain sight (known once its ground is explored), instead of count
// scattered at random and hidden until your scouts find it
const SITE_TYPES={
  camp:{n:'Bandit camp',spots:true,count:0,col:'#e0605a',respawn:10,d:'A big camp in plain sight: raiders and their chieftain, and the roving bands that shelter here by night.'},
  cave:{n:'Cave',count:10,col:'#c58af0',respawn:25,d:'A monster lair cut into a hill or mountain. Beat its beasts for their trophies and a treasure chest.'},
  travelers:{n:'Travellers',count:7,col:'#78c474',d:'A camp on the road. Trade, hire sellswords, rest by the fire and hear news. They move on after a few days.'},
  hideout:{n:'Bandit hideout',count:8,col:'#e0605a',respawn:10,d:'Bandits and their chieftain, guarding their plunder.'},
  ruins:{n:'Ruins',count:7,col:'#e8d8a0',respawn:40,d:'Search them for old treasure, but something may still guard it.'},
  shrine:{n:'Shrine',count:6,col:'#7fd8e8',d:'Pray once a week to recover and gain insight.'}
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
   walking in, the day's change, its click area and tooltip. Each kind adds what it does. ---------- */
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

class Site{
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
  // do you know it is there; can your scouts find it; what they say
  known(){return this.seen}
  get scoutable(){return true}
  scoutLine(){return 'the '+this.label}
  // does clearing it leave it empty for a while
  get empties(){return true}
  // walking in: a fight, or its window; false if nothing opened
  enter(){
    if(this.cleared&&this.empties){log('The '+this.name+' lies empty. Come back in '+Math.max(1,this.back-G.day)+' days.');return false}
    G.site=this;G.siteMsg='';G.mode='site';showSite();return true}
  // its window's body, and its actions (done(m): show the result)
  panel(r,btn,row){return ''}
  act(a,arg,done){return false}
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
  box(box,camp){box(this,this.x-8,this.y-8,this.x+8,this.y+8)}
  tip(){return '<b>'+this.name+'</b>'+(this.cleared?'':chiefTip(this))+'<small>'+this.T.n+(this.cleared?' · empty for now':'')+'</small><span class="act">Click: go there</span>'}
  // a job to clear it (quests.js)
  get clearJob(){return false}
}

// a cave: a monster lair in a hill or mountain; its beasts fight harder than in the open, and guard a chest
class Cave extends Site{
  static ground(tx,ty){return tAt(tx,ty)===T_HILL||tAt(tx,ty)===T_MOUNT}
  static clear(tx,ty){return!occAt(tx,ty)&&passable(tAt(tx,ty+1))&&!occAt(tx,ty+1)}
  static point(tx,ty){return[(tx+.5)*TILE,(ty+1)*TILE+CAVE_MOUTH]}
  static reachRow(ty){return ty+1}
  setup(sites){this.name=unusedName(CAVE_NAMES,sites);this.id=caveMonster(this.x,this.y)}
  returned(){this.id=caveMonster(this.x,this.y)}// (something new moves in)
  get patch(){return false}
  get mouth(){return true}
  box(box){box(this,this.x-8,this.y-16-CAVE_MOUTH,this.x+8,this.y+2)}
  panel(r,btn,row){const M=MONSTERS[this.id];
    return '<p>A cave mouth in the '+r.name.toLowerCase()+'. Bones and tracks litter the ground: '+M.n.toLowerCase()+' lair here, more than you would meet in the open.</p><p class="muted">'+this.T.d+' Trophy: '+MATS[M.mat].n+'.</p>'+
      row('Enter the cave',M.count[1]+1+' × '+ST[M.unit].n+', stronger than usual',btn('site-fight',null,'Enter'))}
  act(a){if(a==='site-fight'&&!this.cleared){G.site=null;caveFight(this);return true}return false}
  get clearJob(){return true}
}

// ruins: search them for old treasure, or old lore; something may still guard them
class Ruins extends Site{
  setup(sites){this.name=unusedName(RUIN_NAMES,sites)}
  get chest(){return{gold:40,gear:.9}}
  panel(r,btn,row){return '<p>Broken walls in the '+r.name.toLowerCase()+', older than any kingdom on your maps.</p><p class="muted">'+this.T.d+'</p>'+row('Search the ruins','Treasure, old lore, or guardians that do not sleep',btn('site-search',null,'Search'))}
  act(a,arg,done){
    if(a!=='site-search'||this.cleared)return false;const r=Math.random();
    if(r<.3){G.site=null;this.id=caveMonster(this.x,this.y);caveFight(this);log('Stones shift in the dark. The ruins have guardians.','bad');return true}
    this.cleared=true;this.back=G.day+this.T.respawn;
    if(r<.75){done('Under a fallen slab you find a sealed chest.'+siteChest(this));return true}
    gainXp(30);P.renown+=2;done('No treasure, but the carvings tell of the old kings. You learn much. (+30 XP, +2 renown)');return true}
}

// a shrine: pray once a week to recover, or leave an offering
class Shrine extends Site{
  setup(sites,clim){this.name=SHRINE_NAMES[terrAt(this.x,this.y)===T_FOREST?'forest':clim]}
  get empties(){return false}
  panel(r,btn,row){const ready=G.day>=this.back;
    return '<p>The '+this.name+' stands alone in the '+r.name.toLowerCase()+'. Old offerings lie at its foot.</p><p class="muted">'+this.T.d+'</p>'+
      row('Pray','Restores your stamina and mana and some health. Morale +6',btn('site-pray','0','Pray',ready?'':'Wait '+(this.back-G.day)+' more days'))+
      row('Leave an offering','25 gold: fully restores you, morale +10 and +40 XP',btn('site-pray','1','Offer 25g',!ready?'Wait '+(this.back-G.day)+' more days':P.gold<25?'Not enough gold':''))}
  act(a,arg,done){
    if(a!=='site-pray'||G.day<this.back)return false;const m=vitals();
    if(arg==='1'){if(P.gold<25)return true;P.gold-=25;restoreVitals();P.morale=clamp(P.morale+10,0,100);gainXp(40);this.back=G.day+7;done('You leave 25 gold at the '+this.name+'. Warmth runs through you. (+40 XP)');return true}
    P.sp=m[1];P.mp=m[2];P.hp=Math.min(m[0],P.hp+m[0]*.25);P.morale=clamp(P.morale+6,0,100);this.back=G.day+7;done('You kneel at the '+this.name+'. Your strength returns.');return true}
}

// a bandit lair, a hideout or a camp: a chieftain and his raiders; walk in and you fight them. A new chief takes it when it returns
class Lair extends Site{
  get bandKind(){return this.band||'bandits'}
  returned(){this.ld=newChief(this.bandKind,rint(1,3)+Math.floor(G.day/30))}
  box(box,camp){camp(this,siteSprite(this))}
}
// a hideout: hidden off the roads, its raiders by the climate; it keeps clear of the estates (lots.js)
class Hideout extends Lair{
  static ground(tx,ty){return tAt(tx,ty)!==T_ROAD&&!nearTile(tx,ty,T_ROAD,3)}
  static clear(tx,ty){return campClear('hideout',tx,ty)}
  static fits(tx,ty){return !estateNear(tx,ty,BANDIT_GAP)}
  setup(sites,clim){this.band=clim==='desert'?'raiders':clim==='swamp'?'bog':'bandits';this.name=HIDEOUT_NAMES[this.band];this.ld=newChief(this.band,rint(1,3),sites)}
  enter(){if(this.cleared)return super.enter();startEncounter({kind:'camp',ref:this,n:rint(5,7)+Math.floor(G.day/15),band:this.band});return true}
  get clearJob(){return true}
}
// a bandit camp: on its fixed spot, in plain sight once you have seen its ground; the roving bands shelter in it by night
class BanditCamp extends Lair{
  setup(sites){this.name='Bandit camp';this.bands=[];this.ld=newChief('bandits',rint(2,4),sites)}
  known(){return seenAt(this.x,this.y)}
  get scoutable(){return false}
  enter(){if(this.cleared)return super.enter();campFight(this);return true}
  pickable(){return this.known()&&!this.cleared}
  tip(){return '<b>Bandit camp</b>'+(this.cleared?'':chiefTip(this))+'<small>'+(this.cleared?'Cleared':'Its bands shelter here by night')+'</small>'+(this.cleared?'':'<span class="act">Click: attack</span>')}
}

// travellers: a camp by the road; trade, sellswords, a fire, news; they move on after a few days
const travPrice=g=>Math.max(2,Math.ceil(GOODS[g].base*1.1*(1-.015*skill('trade'))));
const mercCost=k=>Math.round(hireCost(k)*1.3);
class TravellersCamp extends Site{
  static ground(tx,ty){return tAt(tx,ty)!==T_ROAD&&nearTile(tx,ty,T_ROAD,1)}
  static clear(tx,ty){return campClear('travelers',tx,ty)}
  get TR(){return TRAVELERS[this.kind]||TRAVELERS[0]}
  setup(){this.kind=rint(0,TRAVELERS.length-1);this.stockUp()}
  // who they are this time: their goods, their sellswords, and the days until they move on
  stockUp(){const T=this.TR;this.name=T.n;this.until=G.day+rint(6,10);this.stock=Object.fromEntries(T.goods.map(g=>[g,rint(8,20)]));
    this.unit=T.race?(Math.random()<.5?RACES[T.race].melee:RACES[T.race].ranged):null;this.mercs=T.race?rint(2,4):0;this.news=false;this.special=false;this.fire=0}
  scoutLine(){return 'a camp of '+this.name.toLowerCase()}
  get empties(){return false}
  day(){super.day();if(G.day>=this.until&&G.site!==this){const p=siteSpot('travelers',W.sites.filter(o=>o!==this),9);if(p){this.tx=p[0];this.ty=p[1];this.placed()}
    this.kind=rint(0,TRAVELERS.length-1);this.seed=rint(1,99999);this.seen=false;this.stockUp();if(G.lastSite===this)G.lastSite=null}}
  flagCol(){return this.TR.col}
  banner(){return this.TR.col}
  box(box,camp){camp(this,siteSprite(this))}
  panel(r,btn,row){const TR=this.TR,s=this;
    return '<p>'+TR.d+'</p><p class="muted">They break camp in '+Math.max(1,s.until-G.day)+' days.</p>'+
      Object.keys(s.stock).map(g=>{const p=travPrice(g),n=s.stock[g],k=Math.min(5,n);return row('Buy '+GOODS[g].n.toLowerCase(),p+'g each · '+n+' left · you have '+goodN(g),btn('site-buy',g,'Buy '+k+' for '+p*k+'g',!k?'Sold out':P.gold<p*k?'Not enough gold':goodRoom(g)<k?'No room in your bag':''))}).join('')+
      (P.inv.some(x=>x&&x.k==='mat')?row('Sell trophies','They pay a little less than a town market',btn('site-sell',null,'Sell all '+Math.round(P.inv.reduce((a,x)=>a+(x&&x.k==='mat'?matPrice(x.id)*x.n:0),0)*.85)+'g')):'')+
      (s.unit?row('Hire a sellsword',ST[s.unit].n+' · tier '+ST[s.unit].tier+' · no standing needed · '+s.mercs+' willing',btn('site-hire',null,'Hire '+mercCost(s.unit)+'g',!s.mercs?'No one left to hire':P.gold<mercCost(s.unit)?'Not enough gold':partySize()>=partyCap()?'Your party is full':'')):'')+
      row('Share their fire','Recover half your missing health, stamina and mana. Morale +5',btn('site-fire',null,'Rest',s.fire===G.day?'You rested here today':''))+
      row('Ask for news','They tell you of places you have not found',btn('site-news',null,'Ask',s.news?'You have heard their news':''))+
      (TR.special==='bless'?row('Ask for a blessing','Fully restores your mana. Morale +8',btn('site-bless',null,'Kneel',s.special?'They have blessed you already':'')):'')+
      (TR.special==='song'?row('Pay for a song','15 gold: they will sing of you on the road. Renown +3, morale +5',btn('site-song',null,'Pay 15g',s.special?'They already sing of you':P.gold<15?'Not enough gold':'')):'')}
  act(a,arg,done){const s=this;
    if(a==='site-buy'){const g=arg,p=travPrice(g),k=Math.min(5,s.stock[g]||0);if(k&&P.gold>=p*k&&goodRoom(g)>=k){P.gold-=p*k;s.stock[g]-=k;invAdd('good',g,k);train('trade',k*p/40);done('You buy '+k+' '+GOODS[g].n.toLowerCase()+' for '+p*k+' gold.')}}
    else if(a==='site-sell'){let g=0;P.inv.forEach((x,i)=>{if(x&&x.k==='mat'){g+=matPrice(x.id)*x.n;P.inv[i]=null}});g=Math.round(g*.85);if(g){P.gold+=g;train('trade',g/20);done('The travellers buy your trophies for '+g+' gold.')}}
    else if(a==='site-hire'){const k=s.unit,c=mercCost(k);if(k&&s.mercs>0&&P.gold>=c&&partySize()<partyCap()){P.gold-=c;s.mercs--;P.add(k);done(cap1(an(ST[k].n.toLowerCase()))+' takes your coin and joins you.')}}
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
// a site of its kind again (from a save); and the old names, read through the classes
const siteOf=s=>s instanceof Site?s:Object.setPrototypeOf(s,SITE_CLASS[s.type].prototype);
const siteKnown=s=>s.known();
const camps=()=>W.sites.filter(s=>s instanceof BanditCamp);
const siteClear=(type,tx,ty)=>SITE_CLASS[type].clear(tx,ty);
const stockTravelers=s=>s.stockUp();

/* placement */
// a free tile for a site of this kind: reachable from the roads, on its ground, clear of holdings and other sites (the camps among them)
function siteSpot(type,sites,gap){
  const f=flowTo(TOWNS[0]),C=SITE_CLASS[type];
  for(let k=0;k<5000;k++){
    const g=k<2500?gap:gap*.6,tx=rint(3,MW-4),ty=rint(3,MH-4),fy=C.reachRow(ty);// where parties reach it
    if(!passable(tAt(tx,fy))||!isFinite(f[fy*MW+tx])||!C.ground(tx,ty)||!C.clear(tx,ty)||!C.fits(tx,ty))continue;
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
function genSites(){
  const sites=[];for(const c of CAMP_SPOTS)sites.push(makeSite('camp',c.tx,c.ty,sites));
  for(const type of Object.keys(SITE_TYPES))if(!SITE_TYPES[type].spots)for(let n=0,N=Math.round(SITE_TYPES[type].count*MAP_DENS);n<N;n++){const p=siteSpot(type,sites,9);if(p)sites.push(makeSite(type,p[0],p[1],sites))}
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
function caveFight(s){
  const M=MONSTERS[s.id];s.lv=monLevel()+1;
  startEncounter({kind:'cave',ref:s,lv:s.lv,list:Array(M.count[1]+1).fill(M.unit)});
}

/* the panel: its kind's body and actions */
function showSite(){
  const s=G.site,r=regionAt(s.x,s.y),btn=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  showPanel('<div class="top"><h2>'+s.name+'</h2><span class="muted">'+s.T.n+' · '+r.name+' · <span class="gold">'+P.gold+' gold</span></span></div>'+s.panel(r,btn,row)+
    (G.siteMsg?'<p class="gold">'+G.siteMsg+'</p>':'')+nav(null,['site-leave',null,'Leave']));
}
function siteAct(a,arg){
  if(!a.startsWith('site-'))return false;
  const s=G.site;if(G.mode!=='site'||!s)return true;
  const done=m=>{G.siteMsg=m;log(m.replace(/<[^>]+>/g,''));updateHUD(true);showSite()};
  if(a==='site-leave'){G.site=null;G.mode='world';hidePanel();saveGame(true);return true}
  s.act(a,arg,done);return true;
}
onAct('site-',siteAct);
