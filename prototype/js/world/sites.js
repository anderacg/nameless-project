'use strict';
/* ---------- sites: caves, traveller camps, bandit hideouts, ruins and shrines scattered across the map ---------- */
// Each site in W.sites: {i, type, name, tx, ty, x, y, seed, seen, cleared, back} plus fields of its type.
// Sites stay hidden until your scouts see them. Clearing a cave or hideout, or searching ruins, empties it until day `back`.
const SITE_TYPES={
  cave:{n:'Cave',count:10,col:'#c58af0',respawn:25,d:'A monster lair. Beat its beasts for their trophies and a treasure chest.'},
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
const siteLabel=s=>s.name+' ('+SITE_TYPES[s.type].n.toLowerCase()+')';

/* placement */
const nearTile=(tx,ty,type,r)=>{for(let j=-r;j<=r;j++)for(let i=-r;i<=r;i++)if(tAt(tx+i,ty+j)===type)return true;return false};
const SITE_GROUND={
  cave:(x,y)=>tAt(x,y)!==T_ROAD&&(tAt(x,y)===T_HILL||nearTile(x,y,T_MOUNT,1)),
  travelers:(x,y)=>tAt(x,y)!==T_ROAD&&nearTile(x,y,T_ROAD,1),
  hideout:(x,y)=>tAt(x,y)!==T_ROAD&&!nearTile(x,y,T_ROAD,3),
  ruins:(x,y)=>tAt(x,y)!==T_ROAD,
  shrine:(x,y)=>tAt(x,y)!==T_ROAD
};
// a free tile for a site of this type: reachable from the roads, clear of holdings, camps and other sites
function siteSpot(type,sites,gap){
  const f=flowTo(TOWNS[0]);
  for(let k=0;k<5000;k++){
    const g=k<2500?gap:gap*.6,tx=rint(3,MW-4),ty=rint(3,MH-4);
    if(!passable(tAt(tx,ty))||!isFinite(f[ty*MW+tx])||!SITE_GROUND[type](tx,ty))continue;
    if(TOWNS.some(t=>Math.hypot(t.tx-tx,t.ty-ty)<6)||CAMPS.some(c=>Math.hypot(c.tx-tx,c.ty-ty)<5)||sites.some(s=>Math.hypot(s.tx-tx,s.ty-ty)<g))continue;
    return[tx,ty];
  }
  return null;
}
// which beasts lair here: monsters whose habitat matches the spot, the rare ones less often
function caveMonster(x,y){
  const tags=[...habitatAt(x,y),climAt(x,y)],ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.some(w=>tags.includes(w)));
  if(!ids.length)return'bear';let r=Math.random()*ids.reduce((a,id)=>a+MONSTERS[id].w,0);for(const id of ids){r-=MONSTERS[id].w;if(r<=0)return id}return ids[0];
}
function stockTravelers(s){
  const T=TRAVELERS[s.kind];s.name=T.n;s.until=G.day+rint(6,10);s.stock=Object.fromEntries(T.goods.map(g=>[g,rint(8,20)]));
  s.unit=T.race?(Math.random()<.5?RACES[T.race].melee:RACES[T.race].ranged):null;s.mercs=T.race?rint(2,4):0;s.news=false;s.special=false;s.fire=0;
}
function makeSite(type,tx,ty,sites){
  const x=(tx+.5)*TILE,y=(ty+.5)*TILE,s={i:sites.length,type,tx,ty,x,y,seed:rint(1,99999),seen:false,cleared:false,back:0},c=climAt(x,y);
  const unused=list=>{const free=list.filter(n=>!sites.some(o=>o.name===n));return free.length?free[rint(0,free.length-1)]:list[rint(0,list.length-1)]};
  if(type==='cave'){s.name=unused(CAVE_NAMES);s.id=caveMonster(x,y)}
  else if(type==='travelers'){s.kind=rint(0,TRAVELERS.length-1);stockTravelers(s)}
  else if(type==='hideout'){s.band=c==='desert'?'raiders':c==='swamp'?'bog':'bandits';s.name=HIDEOUT_NAMES[s.band]}
  else if(type==='ruins')s.name=unused(RUIN_NAMES);
  else s.name=SHRINE_NAMES[terrAt(x,y)===T_FOREST?'forest':c];
  return s;
}
function genSites(){
  const sites=[];
  for(const type of Object.keys(SITE_TYPES))for(let n=0,N=Math.round(SITE_TYPES[type].count*MAP_DENS);n<N;n++){const p=siteSpot(type,sites,9);if(p)sites.push(makeSite(type,p[0],p[1],sites))}
  return sites;
}

/* on the map */
// spot sites in view, and step into one you reach. Returns true if a panel or a fight opened.
function updateSites(){
  const V=vis();
  for(const s of W.sites){
    const dd=Math.hypot(P.x-s.x,P.y-s.y);
    if(!s.seen&&dd<V*.9){s.seen=true;log('Your scouts spot '+(s.type==='travelers'?'a camp of '+s.name.toLowerCase():'the '+siteLabel(s))+'.')}
    if(G.lastSite===s){if(dd>28)G.lastSite=null;continue}
    if(dd<12&&!G.modal&&G.encCool<=0){G.lastSite=s;P.tx=null;return enterSite(s)}
  }
  return false;
}
function enterSite(s){
  if(s.cleared&&s.type!=='travelers'&&s.type!=='shrine'){log('The '+s.name+' lies empty. Come back in '+Math.max(1,s.back-G.day)+' days.');return false}
  if(s.type==='hideout'){startEncounter({kind:'camp',ref:s,n:rint(5,7)+Math.floor(G.day/15),band:s.band});return true}
  G.site=s;G.siteMsg='';G.mode='site';showSite();return true;
}
// the day's changes: emptied places fill again, travellers pack up and move on
function siteDay(){
  for(const s of W.sites){
    if(s.cleared&&G.day>=s.back){s.cleared=false;if(s.type==='cave')s.id=caveMonster(s.x,s.y)}
    if(s.type==='travelers'&&G.day>=s.until&&G.site!==s){const p=siteSpot('travelers',W.sites.filter(o=>o!==s),9);if(p){s.tx=p[0];s.ty=p[1];s.x=(p[0]+.5)*TILE;s.y=(p[1]+.5)*TILE}
      s.kind=rint(0,TRAVELERS.length-1);s.seed=rint(1,99999);s.seen=false;stockTravelers(s);if(G.lastSite===s)G.lastSite=null}
  }
}
// a cave or ruin's chest: gold that grows with the days, and usually a piece of gear
function siteChest(s){
  const top=Math.min(MATERIALS.length-1,1+Math.floor(G.day/20)),gold=rint(30,70)+G.day*2+(s.type==='ruins'?40:0);P.gold+=gold;
  let x=' The chest holds <strong class="gold">'+gold+' gold</strong>';
  if(Math.random()<(s.type==='ruins'?.9:.7)){const id=randomGear(Math.max(0,top-1),Math.min(MATERIALS.length-1,top+1));
    x+=invAdd('gear',id,1)?' and a <span style="color:'+RARITY[ITEMS[id].r]+'">'+ITEMS[id].n+'</span>':'. Your bag is too full for the '+ITEMS[id].n;}
  return x+'.';
}
function caveFight(s){
  const M=MONSTERS[s.id];s.lv=monLevel()+1;
  startEncounter({kind:'cave',ref:s,lv:s.lv,list:Array(M.count[1]+1).fill(M.unit)});
}

/* the panel */
const travPrice=g=>Math.max(2,Math.ceil(GOODS[g].base*1.1*(1-.015*skill('trade'))));
const mercCost=k=>Math.round(hireCost(k)*1.3);
function showSite(){
  const s=G.site,T=SITE_TYPES[s.type],r=regionAt(s.x,s.y),btn=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  let body='';
  if(s.type==='cave'){const M=MONSTERS[s.id];
    body='<p>A cave mouth in the '+r.name.toLowerCase()+'. Bones and tracks litter the ground: '+M.n.toLowerCase()+' lair here, more than you would meet in the open.</p><p class="muted">'+T.d+' Trophy: '+MATS[M.mat].n+'.</p>'+
      row('Enter the cave',M.count[1]+1+' × '+ST[M.unit].n+', stronger than usual',btn('site-fight',null,'Enter'))}
  else if(s.type==='ruins')
    body='<p>Broken walls in the '+r.name.toLowerCase()+', older than any kingdom on your maps.</p><p class="muted">'+T.d+'</p>'+row('Search the ruins','Treasure, old lore, or guardians that do not sleep',btn('site-search',null,'Search'));
  else if(s.type==='shrine'){const ready=G.day>=s.back;
    body='<p>The '+s.name+' stands alone in the '+r.name.toLowerCase()+'. Old offerings lie at its foot.</p><p class="muted">'+T.d+'</p>'+
      row('Pray','Restores your stamina and mana and some health. Morale +6',btn('site-pray','0','Pray',ready?'':'Wait '+(s.back-G.day)+' more days'))+
      row('Leave an offering','25 gold: fully restores you, morale +10 and +40 XP',btn('site-pray','1','Offer 25g',!ready?'Wait '+(s.back-G.day)+' more days':P.gold<25?'Not enough gold':''))}
  else{const TR=TRAVELERS[s.kind];
    body='<p>'+TR.d+'</p><p class="muted">They break camp in '+Math.max(1,s.until-G.day)+' days.</p>'+
      Object.keys(s.stock).map(g=>{const p=travPrice(g),n=s.stock[g],k=Math.min(5,n);return row('Buy '+GOODS[g].n.toLowerCase(),p+'g each · '+n+' left · you have '+goodN(g),btn('site-buy',g,'Buy '+k+' for '+p*k+'g',!k?'Sold out':P.gold<p*k?'Not enough gold':goodRoom(g)<k?'No room in your bag':''))}).join('')+
      (P.inv.some(x=>x&&x.k==='mat')?row('Sell trophies','They pay a little less than a town market',btn('site-sell',null,'Sell all '+Math.round(P.inv.reduce((a,x)=>a+(x&&x.k==='mat'?matPrice(x.id)*x.n:0),0)*.85)+'g')):'')+
      (s.unit?row('Hire a sellsword',ST[s.unit].n+' · tier '+ST[s.unit].tier+' · no standing needed · '+s.mercs+' willing',btn('site-hire',null,'Hire '+mercCost(s.unit)+'g',!s.mercs?'No one left to hire':P.gold<mercCost(s.unit)?'Not enough gold':partySize()>=partyCap()?'Your party is full':'')):'')+
      row('Share their fire','Recover half your missing health, stamina and mana. Morale +5',btn('site-fire',null,'Rest',s.fire===G.day?'You rested here today':''))+
      row('Ask for news','They tell you of places you have not found',btn('site-news',null,'Ask',s.news?'You have heard their news':''))+
      (TR.special==='bless'?row('Ask for a blessing','Fully restores your mana. Morale +8',btn('site-bless',null,'Kneel',s.special?'They have blessed you already':'')):'')+
      (TR.special==='song'?row('Pay for a song','15 gold: they will sing of you on the road. Renown +3, morale +5',btn('site-song',null,'Pay 15g',s.special?'They already sing of you':P.gold<15?'Not enough gold':'')):'');
  }
  showPanel('<div class="top"><h2>'+s.name+'</h2><span class="muted">'+T.n+' · '+r.name+' · <span class="gold">'+P.gold+' gold</span></span></div>'+body+
    (G.siteMsg?'<p class="gold">'+G.siteMsg+'</p>':'')+'<div class="btns"><button class="btn primary" type="button" data-act="site-leave">Leave</button></div>');
}
function siteAct(a,arg){
  if(!a.startsWith('site-'))return false;
  const s=G.site;if(G.mode!=='site'||!s)return true;
  const done=m=>{G.siteMsg=m;log(m.replace(/<[^>]+>/g,''));updateHUD(true);showSite()};
  if(a==='site-leave'){G.site=null;G.mode='world';hidePanel();saveGame(true);return true}
  if(a==='site-fight'&&s.type==='cave'&&!s.cleared){G.site=null;caveFight(s);return true}
  if(a==='site-search'&&s.type==='ruins'&&!s.cleared){
    const r=Math.random();
    if(r<.3){G.site=null;s.id=caveMonster(s.x,s.y);caveFight(s);log('Stones shift in the dark. The ruins have guardians.','bad');return true}
    s.cleared=true;s.back=G.day+SITE_TYPES.ruins.respawn;
    if(r<.75)return done('Under a fallen slab you find a sealed chest.'+siteChest(s)),true;
    gainXp(30);P.renown+=2;return done('No treasure, but the carvings tell of the old kings. You learn much. (+30 XP, +2 renown)'),true;
  }
  if(a==='site-pray'&&s.type==='shrine'&&G.day>=s.back){
    const m=vitals();
    if(arg==='1'){if(P.gold<25)return true;P.gold-=25;restoreVitals();P.morale=clamp(P.morale+10,0,100);gainXp(40);s.back=G.day+7;return done('You leave 25 gold at the '+s.name+'. Warmth runs through you. (+40 XP)'),true}
    P.sp=m[1];P.mp=m[2];P.hp=Math.min(m[0],P.hp+m[0]*.25);P.morale=clamp(P.morale+6,0,100);s.back=G.day+7;return done('You kneel at the '+s.name+'. Your strength returns.'),true;
  }
  if(s.type!=='travelers')return true;
  if(a==='site-buy'){const g=arg,p=travPrice(g),k=Math.min(5,s.stock[g]||0);if(k&&P.gold>=p*k&&goodRoom(g)>=k){P.gold-=p*k;s.stock[g]-=k;invAdd('good',g,k);train('trade',k*p/40);done('You buy '+k+' '+GOODS[g].n.toLowerCase()+' for '+p*k+' gold.')}}
  else if(a==='site-sell'){let g=0;P.inv.forEach((x,i)=>{if(x&&x.k==='mat'){g+=matPrice(x.id)*x.n;P.inv[i]=null}});g=Math.round(g*.85);if(g){P.gold+=g;train('trade',g/20);done('The travellers buy your trophies for '+g+' gold.')}}
  else if(a==='site-hire'){const k=s.unit,c=mercCost(k);if(k&&s.mercs>0&&P.gold>=c&&partySize()<partyCap()){P.gold-=c;s.mercs--;P.troops[k]=(P.troops[k]||0)+1;done(cap1(an(ST[k].n.toLowerCase()))+' takes your coin and joins you.')}}
  else if(a==='site-fire'&&s.fire!==G.day){const m=vitals();s.fire=G.day;P.hp+=(m[0]-P.hp)/2;P.sp+=(m[1]-P.sp)/2;P.mp+=(m[2]-P.mp)/2;P.morale=clamp(P.morale+5,0,100);done('You share their fire and their stew. Everyone sleeps well.')}
  else if(a==='site-news'&&!s.news){s.news=true;
    const far=W.sites.filter(o=>!o.seen&&o.type!=='travelers').sort((a,b)=>Math.hypot(a.x-s.x,a.y-s.y)-Math.hypot(b.x-s.x,b.y-s.y)).slice(0,2);
    far.forEach(o=>o.seen=true);
    done(far.length?'They tell you of '+far.map(o=>'the '+siteLabel(o)+' to the '+compass(o.x-s.x,o.y-s.y)).join(', and ')+'. Both are on your map now.':'They have no news you have not heard.')}
  else if(a==='site-bless'&&!s.special){s.special=true;vitals();P.mp=maxMP();P.morale=clamp(P.morale+8,0,100);done('The pilgrims pray over you. Your mind is clear.')}
  else if(a==='site-song'&&!s.special&&P.gold>=15){s.special=true;P.gold-=15;P.renown+=3;P.morale=clamp(P.morale+5,0,100);done('By the next town, children are singing of you. (+3 renown)')}
  return true;
}
onAct('site-',siteAct);
