'use strict';
/* ---------- world ---------- */
// a band takes to the roads away from where people live (the owner, 2026-10-19): never nearer a holding or any of its estates
// than WORLD_SCALE.spawn.away; out on a land's reaches it may
function spawnBandit(initial,ld){// (ld: a chieftain coming back)
  for(let tries=0;tries<80;tries++){
    const x=rint(3,MW-4)*TILE+8,y=rint(3,MH-4)*TILE+8;
    if(!passable(terrAt(x,y)))continue;
    if(Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.bandit[initial?0:1]||!farFromHomes(x,y,WORLD_SCALE.spawn.away))continue;
    const c=climAt(x,y),n=rint(3,5)+Math.floor(G.day/12),kind=c==='desert'?'raiders':c==='swamp'?'bog':'bandits';bandits.push(asParty({x,y,n,kind,list:makeEnemies(n,false,kind),t:0,a:0,idle:false,cool:0,ld:ld||newChief(kind,1+Math.floor(G.day/25)+(Math.random()<.3?1:0))}));if(ld&&Math.hypot(x-P.x,y-P.y)<vis()*3)log(ld.name+' is back on the roads with a new band.','bad');return;
  }
}
/* where you come out onto the map by a holding (a new game, a load that left you off the land, a defeat, leaving your lodgings):
   the nearest open land in front of its gate, 2 tiles under its tile as ever (each row nearer the holding than that GATE.back
   tiles dearer: the gate's own row, then beside and behind it, only if nothing in front will do), within GATE.r tiles; never
   water, a ford or the peaks, never on a building's lot, and on the holding's own land (Router.reach). Its tile's middle {x, y}.
   (The generated world's holdings stand by rivers and coasts with lots round them: 2 tiles under one was often water or a house) */
const GATE={r:12,back:1.5};
function gateSpot(t){const cx=t.tx,cy=t.ty+2,c=[];
  for(let dy=-GATE.r;dy<=GATE.r;dy++)for(let dx=-GATE.r;dx<=GATE.r;dx++){const x=cx+dx,y=cy+dy,k=tAt(x,y);if(k!==T_WATER&&k!==T_MOUNT&&k!==T_FORD&&!lotOf(x,y))c.push([Math.hypot(dx,dy)+GATE.back*Math.max(0,-dy),x,y])}
  c.sort((a,b)=>a[0]-b[0]);const at=([,x,y])=>({x:(x+.5)*TILE,y:(y+.5)*TILE}),own=c.find(q=>Router.reach(t,at(q)));
  return own?at(own):c.length?at(c[0]):{x:(cx+.5)*TILE,y:(cy+.5)*TILE}}
// you put on the map at a holding's gate (gateSpot), going nowhere
function heroAtGate(t){const s=gateSpot(t);P.x=s.x;P.y=s.y;P.tx=P.ty=null;P.stuck=0}
// on a bridge, anyone crossing keeps to the middle of its deck
const bridgeAt=(tx,ty)=>tAt(tx,ty)!==T_ROAD?0:tAt(tx-1,ty)===T_WATER&&tAt(tx+1,ty)===T_WATER?1:tAt(tx,ty-1)===T_WATER&&tAt(tx,ty+1)===T_WATER?2:0;
function walk(o,dx,dy,step,ok){
  const a0=Math.atan2(dy,dx);
  for(const off of [0,.6,-.6,1.2,-1.2,1.9,-1.9]){const a=a0+off;let nx=o.x+Math.cos(a)*step,ny=o.y+Math.sin(a)*step;if(passable(terrAt(nx,ny))&&(!ok||ok(nx,ny))){
    const tx=Math.floor(nx/TILE),ty=Math.floor(ny/TILE),b=bridgeAt(tx,ty),m=Math.max(1,step);if(b===1)nx+=clamp((tx+.5)*TILE-nx,-m,m);else if(b===2)ny+=clamp((ty+.5)*TILE-ny,-m,m);
    WALKED.set(o,(WALKED.get(o)||0)+Math.hypot(nx-o.x,ny-o.y));o.x=nx;o.y=ny;return true}}
  return false;
}
// a click on something you already stand beside opens it at once, even if you just left it or fled from it
// touching distance: you interact with something only when you reach it; a click on something farther away walks you there
const REACH=14;
// everything on the map, each made one of its kind, in the order a click weighs them when two are as near (pickAt): each
// holding then its built estates, the parties (lords, bands, patrols, your companions'), the beasts, the sites, the herds, the
// caravans, the refugees, the encounters on the road, the workers, the ships (never clicked), then the fights (none picked: a click on a party in one meets
// it, interact). Not you.
const worldObjects=()=>[...TOWNS.flatMap(t=>[t,...t.estates()]),...W.parties,...W.monsters.map(asMonster),...W.sites,...W.critters.map(asHerd),...W.caravans,...W.refugees.map(asRefugees),...roadList(),...W.folk.map(asWorker),...W.ships.map(asShip),...W.fights.map(asFight)];
// a thing on the map made one of its kind if it is still plain data (new, from a save or a test), by its fields: a herd (crit),
// refugees (rf), an encounter on the road (rd), a worker (folk), a ship (its path over the water), a beast (a MONSTERS kind). Parties are made theirs by asParty
const asWorldObject=o=>!o||o instanceof WorldObject?o:o.crit?asHerd(o):o.rf?asRefugees(o):o.rd?asRoadEnc(o):o.folk?asWorker(o):o.path?asShip(o):MONSTERS[o.id]&&!o.type?asMonster(o):o;
// what lies under a click: the nearest clickable thing you can see
function pickAt(wx,wy){
  const V=vis(),c=[],add=(o,r,dy)=>{const d=Math.hypot(o.x-wx,o.y-(dy||0)-wy);if(d<r&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([d,o])};
  // structures answer anywhere on what is drawn of them, ranked as near as their own spot (a holding's gate) but never nearer
  // than 12 pixels away, so someone clicked on top of one is picked, and a click on the gate still picks the holding
  const box=(o,x0,y0,x1,y1,dy)=>{if(wx>=x0&&wx<x1&&wy>=y0&&wy<y1&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([Math.min(12,Math.hypot(o.x-wx,o.y-(dy||0)-wy))+Math.hypot(o.x-wx,o.y-wy)/1000,o])};
  const camp=(o,sp)=>{const x0=o.x-sp.ax,y0=o.y+8-sp.ay;box(o,x0,y0,x0+sp.width,y0+sp.height)};// anywhere on its picture
  // a big figure (a mounted lord, a caravan's cart, ox and drover) answers anywhere on what is drawn of it (its picture s, cell
  // top left x0, y0, mirrored when it faces left: render.js opaqueBox), ranked 10-12 by how far from its middle: after anyone's
  // ring (someone small beside it, clicked on, is still picked), before a building it stands in front of
  const fig=(o,s,x0,y0,flip)=>{if(Math.hypot(o.x-wx,o.y-wy)>s.width)return;const b=opaqueBox(s),L=flip?x0+s.width-1-b[2]:x0+b[0],R=L+b[2]-b[0]+1,T=y0+b[1],Bt=y0+b[3]+1,hw=(R-L)/2,hh=(Bt-T)/2;
    if(wx>=L&&wx<R&&wy>=T&&wy<Bt&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([10+2*Math.max(Math.abs(wx-L-hw)/hw,Math.abs(wy-T-hh)/hh),o])};
  // a party's banner (render.js bannerAt) answers anywhere on it while the party is in sight, ranked 9.5: over the buildings and
  // figures it floats over, after anyone's ring clicked nearer
  const flag=(o,B)=>{const b=opaqueBox(B.s);if(wx>=B.x+b[0]&&wx<=B.x+b[2]&&wy>=B.y+b[1]&&wy<=B.y+b[3]&&o.inView(V))c.push([9.5,o])};
  // every world object says where a click answers on it (WorldObject pick), with these, in worldObjects' order (a tie keeps it)
  const at={x:wx,y:wy,V,add,box,fig,camp,flag};for(const o of worldObjects())o.pick(at);
  c.sort((a,b)=>a[0]-b[0]);return c.length?c[0][1]:null;
}
// what a thing on the map is (its mapKind), while it is still on the map (here); null for anything else
const objKind=o=>(o=asWorldObject(o)) instanceof WorldObject&&o.here()?o.mapKind:null;
// meet whatever you have reached, each its own way (WorldObject meet; G.youAttack: you started whatever fight this opens at once:
// engage.js startEncounter)
function interact(o){
  const k=objKind(o);P.tx=null;G.chase=null;G.youAttack=true;if(k)breakCamp();
  try{
    if(o&&o.fight&&fightOf(o)){fightMeet(fightOf(o));return true}
    if(k)o.meet();
    return !!k;
  }finally{G.youAttack=false}
}
// a click on the map: interact if you are touching it, else walk to it (and interact on arrival). Returns true if something opened.
function clickAt(wx,wy){
  const o=pickAt(wx,wy);if(!o){G.chase=null;return false}
  return approach(o);
}
// (what you clicked on, or picked Approach for on its ring (ui/input.js worldApproach): met if you are touching it, else chased)
function approach(o){if(WildHunt.active){if(o===WildHunt.active.herd)return true;WildHunt.active.finish('You leave the hunt.')}if(o.mapKind==='critter'&&o.wild&&o.inView(vis()))return hunt(o);if(Math.hypot(o.x-P.x,o.y-P.y)<=worldBattleReach(o))return interact(o);G.chase=o;P.tx=o.x;P.ty=o.y;P.stuck=0;return false}
/* ---------- Follow (the owner, 2026-10-23: "add new Action called 'Follow' which can be used when you click at the other unit in
   the world map"): your band shadows a party, keeping after it at a distance, never closing in to meet or fight it (a chase,
   G.chase, does). G.follow: {o: the party, crumbs: where it has walked, a point each FOLLOW.crumb px, the oldest FOLLOW.trail tiles
   back} (an order: never saved, as a chase; a new world forgets it). Each moment of your march (followStep) you make for the point
   FOLLOW.trail tiles behind it along the way it came, so you trail it rather than step on it; with no way behind it yet (it has
   not moved), that far from it on your side; within FOLLOW.near tiles of it you stand. It ends (followWatch, every frame): out of
   your sight ("You lose sight of ..."), gone into a holding ("... rides into Ashford") or a camp, or gone (beaten, broken up),
   your band stopping there; any other order (a click, Travel here, a chase, making camp: followStop, quietly), or a battle, a
   meeting, an encounter (the map no longer yours: G.mode one of FOLLOW.ends). Hostile or not: what it does about you is its own
   mind's. What can be followed: a party on the map that is not yours, moving (FOLLOW.kinds), in sight and in no fight. Its
   ring's Follow and Stop following (supply.js mapRingItems, partyRingItems: followItem), the day bar's tag (followPill), the
   footprints to it (gfx/worldui.js) ---------- */
const FOLLOW={trail:2.5,near:1.5,crumb:4,kinds:['lord','cparty','patrol','band','caravan','refugee'],ends:['battle','besiege','capture','dialog','road','scene','site','story','town','dead','title','loading']};
onWorld(()=>{if(typeof G!=='undefined')G.follow=null});
const followable=o=>!!o&&FOLLOW.kinds.includes(objKind(o))&&!o.fight&&o.inView(vis());
// (its name in a line: a lord's or your companion's party's own, the rest "the caravan of Ashford", "the bandits"...; cap: as a tag)
function followName(o,cap){const k=o.mapKind,l=k==='lord'?lordName(o):o.label?o.label():k==='refugee'?'Refugees':'';if(cap||k==='lord'||k==='cparty')return l;return 'the '+l.charAt(0).toLowerCase()+l.slice(1)}
function followStart(o){if(!followable(o))return false;breakCamp();G.chase=null;G.pitch=null;G.byRoad=null;G.follow={o,crumbs:[[o.x,o.y]]};P.stuck=0;
  toast('You follow '+followName(o)+' at a distance.');followStep();updateHUD(true);return true}
// it ends (why: said in the log; halt: your band stops where it is, else whatever was ordered stands)
function followStop(why,halt){if(!G.follow)return false;G.follow=null;if(halt){P.tx=P.ty=null;P.stuck=0}if(why)toast(why);if(typeof WUI!=='undefined')WUI.way=null;updateHUD(true);return true}
// (every frame, whatever is shown: world.js fastWatch)
function followWatch(){const F=G.follow;if(!F)return;const o=F.o;
  if(FOLLOW.ends.includes(G.mode)||P.camp||G.pitch||P.stay||G.chase)return followStop();
  const nm=followName(o),gone=!objKind(o)||o.dead||o.inside;
  if(gone){const t=o.inside?townBy(o.inside):TOWNS.find(h=>Math.hypot(h.x-o.x,h.y-o.y)<30),c=!t&&camps().find(k=>Math.hypot(k.x-o.x,k.y-o.y)<30);
    return followStop(t?cap1(nm)+' rides into '+t.name+'.':c?cap1(nm)+' slips into '+(c.name||'their camp')+'.':cap1(nm)+' is gone.',true)}
  if(!o.inView(vis()))return followStop('You lose sight of '+nm+'.',true)}
// (your goal this moment: the point FOLLOW.trail tiles behind it along its crumbs (those older dropped), else that far from it on
// your side; within FOLLOW.near tiles of it, where you stand)
function followStep(){const F=G.follow,o=F.o,c=F.crumbs,l=c[c.length-1],T=FOLLOW.trail*TILE;if(Math.hypot(o.x-l[0],o.y-l[1])>=FOLLOW.crumb)c.push([o.x,o.y]);
  let s=0,px=o.x,py=o.y,tx=null,ty=null;for(let i=c.length-1;i>=0;i--){const [x,y]=c[i],d=Math.hypot(x-px,y-py);if(s+d>=T&&d>0){const q=(T-s)/d;tx=px+(x-px)*q;ty=py+(y-py)*q;c.splice(0,i);break}s+=d;px=x;py=y}
  const d=Math.hypot(P.x-o.x,P.y-o.y);if(tx==null){tx=d>T?o.x+(P.x-o.x)/d*T:P.x;ty=d>T?o.y+(P.y-o.y)/d*T:P.y}
  if(d<FOLLOW.near*TILE){tx=P.x;ty=P.y}P.tx=tx;P.ty=ty}
// (the ring's item for o: Stop following (lit) while you follow it, or anything with o not one to follow; Follow for one to
// follow; none else)
const followItem=o=>G.follow&&(G.follow.o===o||!followable(o))?{icon:'shoe',label:'Stop following',active:true,run:()=>followStop('You stop following '+followName(G.follow.o)+'.',true)}
  :followable(o)?{icon:'shoe',label:'Follow',run:()=>followStart(o)}:null;
// (the day bar's tag while you follow: render.js updateHUD)
const followPill=()=>G.follow?'<em class="wroad wfollow" title="Following '+followName(G.follow.o)+': your band keeps after it at a distance (any other order, or the action ring’s Stop following, ends it)">'+icon('shoe',12)+'<i><small>Following </small>'+followName(G.follow.o,true)+'</i></em>':'';
// the camp a band heads for at night: the nearest that is not cleared, within reach
const campNear=b=>{let best=null,bd=WORLD_SCALE.ai.bandCamp;for(const c of camps()){if(c.cleared)continue;const d=Math.hypot(c.x-b.x,c.y-b.y);if(d<bd){bd=d;best=c}}return best};
// at dawn the bands in a camp ride out again
function campEmpty(c){if(!c.bands||!c.bands.length)return;for(const b of c.bands){b.x=c.x+rint(-12,12);b.y=c.y+rint(10,18);b.cool=2;b.gone=false;bandits.push(b)}c.bands=[]}
// attacking a camp: its own bandits and chieftain (own: as your scouts saw them; else rolled now: sites.js BanditCamp foes), and
// any bands sheltering there tonight
function campFight(c,own){own=own||c.foes();const bands=c.bands||[];
  startEncounter({kind:'camp',ref:c,list:own.concat(...bands.map(b=>b.troops)),title:(c.name||'Bandit camp')+(bands.length?' · '+bands.length+' band'+(bands.length>1?'s':'')+' sheltering inside':'')})}
// the hero's speed multiplier where they stand: ground, race, mount, Pathfinder and gear
/* how fast a party moves on the map: what it is made of. Each member's pace is its battle speed (a foot soldier 38, a rider 62
   to 80); a party moves near its slowest (3/4 the slowest, 1/4 the average), compressed so riders are about 1.5x foot. Big
   parties are slower, and a party mostly of riders loses more in forest, hills and swamp, unless the mounts are at home there.
   The same for you, lords, bands, patrols and your companions' parties (each with its own base: MAP_BASE x its factor). */
const PACE_REF=38,MAP_BASE=34;
function paceRatio(sp){let n=0,sum=0,mn=1e9;for(const [s,c] of sp){if(!c)continue;n+=c;sum+=s*c;if(s<mn)mn=s}return n?Math.pow((.75*mn+.25*sum/n)/PACE_REF,.7):1}
const sizeMul=n=>Math.max(.7,1-.006*Math.max(0,n-12));
const mountedShare=sp=>{let n=0,m=0;for(const [s,c] of sp){n+=c;if(s>=60)m+=c}return n?m/n:0};
const roughFor=(x,y,ign)=>{const t=RoadBand.on(x,y)?T_ROAD:terrAt(x,y);ign=ign||[];return t===T_FOREST&&!ign.includes('forest')||t===T_HILL&&!ign.includes('hills')||climAt(x,y)==='swamp'&&!ign.includes('swamp')};
function listSpeeds(list){const m={};for(const k of list){const s=(ST[k]&&ST[k].spd)||PACE_REF;m[s]=(m[s]||0)+1}return Object.entries(m).map(([s,c])=>[+s,c])}
function partySpeed(o,list){const sp=listSpeeds(list);return MAP_BASE*paceRatio(sp)*sizeMul(list.length)*Math.max(.45,speedAt(o.x,o.y)||1)*(mountedShare(sp)>=.5&&roughFor(o.x,o.y)?.8:1)}
// your hero's own pace: on foot a fit 40; mounted, by the mount
// a lord's army: its pace, slowed by its baggage train unless it is mostly mounted
const lordSpeed=l=>partySpeed(l,l.troops)*(mountedShare(listSpeeds(l.troops))>=.5?1:.85);
const heroPace=()=>{const m=mountDef();return m?40+150*(m.m.travel||0):40};
function bandSpeeds(){const sp=[[heroPace(),1]];for(const k in P.troops)if(P.troops[k]>0)sp.push([(ST[k]&&ST[k].spd)||PACE_REF,P.troops[k]]);for(const id of compsInBand())sp.push([(ST[id]&&ST[id].spd)||PACE_REF,1]);return sp}
// your band's pace before the ground: the slowest of you and its size, the wounded you carry and your own wounds, Athletics on
// foot or Riding in the saddle, gear, a Guide, Forced March; at most 1.8x; then slower Tired or Exhausted (world/supply.js)
function bandPace(){
  const sp=bandSpeeds(),n=sp.reduce((a,[,c])=>a+c,0),m=mountDef(),w=woundedN(),hpf=P.hp/Math.max(1,vitals()[0]);
  let p=paceRatio(sp)*sizeMul(n)*(1+gm('travel')-(m&&m.m.travel||0))*(m?1+.02*skill('ride'):1+.015*skill('athl'));
  p*=1-.5*w/Math.max(1,n+w);if(hpf<.5)p*=1-.4*(.5-hpf);
  const g=roleOf('guide');if(g&&compInBand(g))p*=1.03+.01*compSkill(g,'scout');if(has('forced'))p*=1.15;
  return Math.min(1.8,p)*P.staminaPace()*bagPace()*CHEAT.speed;// (an overfilled bag: core/inventory.js; the console's speed: core.js CHEAT)
}
// (Woodcraft: in a wood, its slowing cut by WOODCRAFT.per a level, up to cap)
const WOODCRAFT={per:.06,cap:.6,xp:.1};
function travelMul(){let t=speedAt(P.x,P.y,P.race,mountIgn())||1;if(t<1&&has('path'))t=1-(1-t)/2;if(t<1&&terrAt(P.x,P.y)===T_FOREST)t=1-(1-t)*(1-Math.min(WOODCRAFT.cap,WOODCRAFT.per*skill('wood')));return bandPace()*t*(mountedShare(bandSpeeds())>=.5&&roughFor(P.x,P.y,mountIgn())?.8:1)}
// daily price of the land you camp in; holdings shelter you from all of it. (By the hour, world/supply.js: the frost's extra food,
// its cold short of furs and frostbite; the desert's thirst.) Each night short of furs in the frost costs a little morale; swamp fever
function survive(){
  const clim=climAt(P.x,P.y),home=RACES[P.race].home,shelter=TOWNS.some(t=>Math.hypot(t.x-P.x,t.y-P.y)<WORLD_SCALE.land.shelter);
  if(shelter)return;
  // Survival: each day in harsh land teaches it, and it softens what the land costs (sv: the share still paid)
  const harsh=clim==='frost'&&!home.includes('frost')||clim==='desert'&&!home.includes('desert')||clim==='swamp'&&!home.includes('swamp');if(harsh)train('surv',4);
  const sv=survivalShare();
  if(clim==='frost'&&!home.includes('frost')){
    const need=P.furNeed();
    if(goodN('furs')<need){P.morale-=Math.ceil(SUPPLY.frost.morale*sv);log('Your band shivers through the night. Carry 1 fur for every '+SUPPLY.furPer+' people in the frost ('+need+' needed).','bad','band')}
  }else if(clim==='swamp'&&!home.includes('swamp')&&Math.random()<Math.max(.05,.25-.02*skill('surv'))){
    // (the owner, 2026-10-21: as thirst and hunger, a sickness first: a man falls sick with fever, and one already sick may die of it,
    // a sick one first: world/supply.js; SUPPLY.fever)
    const F=SUPPLY.fever;P.morale-=Math.ceil(5*sv);
    if(Object.keys(BAND.sick).some(k=>BAND.sick[k].fever>0)&&Math.random()<Math.max(F.dieMin,F.die-F.med*skill('med')))supplyDie('fever');
    if(Object.keys(P.troops).some(k=>P.troops[k]>0)&&Math.random()<F.sick)supplyHurt('fever');else log('Swamp fever spreads through the camp. Morale drops.','bad','band');
  }
}
// your troops' average Morale (matchups.js unitMoraleOf), by their numbers; null with none
const PARTY_MOR={drift:.1};
function bandNerve(){let n=0,sum=0;for(const k in P.troops){const c=P.troops[k]||0;if(c>0&&ST[k]){n+=c;sum+=c*unitMoraleOf(ST[k])}}return n?sum/n:null}
// a new day: counted, then every system's day in its order (core/systems.js; Systems.names('day') lists them: the estates'
// guards and your band first, the autosave and a road event last)
function dayTick(){
  G.day++;
  Systems.day();
}
// your band's wages for the day (cnt: everyone paid), and its larder: fresh food spoils; a varied larder (3 or more kinds) lifts
// spirits. (It eats by the hour: world/supply.js)
const BAND_PAY={soldier:.5,mounted:.5,companion:2};
function bandPayroll(cnt){const detached=cparties().reduce((a,p)=>a+p.troops.length,0),soldiers=cnt??troopCount()+woundedN()+detached,base=soldiers*BAND_PAY.soldier,mounts=mountedN()*BAND_PAY.mounted,companions=compCount()*BAND_PAY.companion,raw=base+mounts+companions;return{base,mounts,companions,detached,raw,total:Math.ceil(raw)}}
function bandWages(cnt){const wage=bandPayroll(cnt).total;
  if(wage>0){if(P.gold>=wage)P.gold-=wage;else{P.gold=0;P.morale-=6;log('You cannot pay your troops. Morale falls.','bad','band');mood('unpaid')}}}
function bandLarder(){
  let rot=0;for(const g of FOODS){const r=GOODS[g].spoil,n=goodN(g);if(r&&n)rot+=goodTake(g,Math.min(n,Math.floor(n*r+Math.random())))}
  if(rot>2)log(rot+' food spoils in the packs. Fresh food is eaten first; grain and cheese keep.','bad','band');
  const kinds=foodKinds();if(kinds>=3)P.morale+=kinds-2;
}
// your band's day: wages and its larder (spoiling, a varied larder), quarrels, desertion, the land's price, morale; a new band on the
// roads now and then; your fame; a realm's pay
function bandDay(){
  const cnt=troopCount()+woundedN()+cparties().reduce((a,p)=>a+p.troops.length,0);
  bandWages(cnt);bandLarder();
  for(const id in P.comps){const r=COMPS[id].rival;if(r&&P.comps[r]&&Math.random()<.12){P.comps[id].ap--;P.comps[r].ap--;log(COMPS[id].short+' and '+COMPS[r].short+' quarrel by the fire. Both are unhappy.','bad','band')}}
  if(P.morale<25&&cnt>0&&Math.random()<.5){const ks=Object.keys(P.troops).filter(k=>P.troops[k]>0);if(ks.length){const k=ks[rint(0,ks.length-1)];P.remove(k);log(cap1(an(ST[k].n.toLowerCase()))+' deserts in the night.','bad','band')}}// (only a fit soldier: the wounded and companions' parties count in cnt)
  survive();
  // (your band's morale drifts toward its troops' Morale, by their numbers: veterans keep their spirits, levies sag)
  {const st=bandNerve();if(st!=null)P.morale+=(st-P.morale)*PARTY_MOR.drift}
  P.morale=clamp(P.morale,Math.min(30,skill('lead')*3)+tm('morale'),100);
  {const D=density(WM);for(let k=0;k<D.daily.bandits;k++)if(bandits.length<D.bandits&&Math.random()<.6)spawnBandit(false)}// (the world's: data/world.js)
  if(P.renown>=250&&!G.rankSeen){G.rankSeen=1;log('Your name carries across Ashmark. A throne is within reach.','gold')}
  if(P.fac){P.gold+=troopCount();addHonor(P.fac,1,true)}
}
/* the speed you set holds till you change it (the owner, 2026-10-19): no drop to 1x on arriving, on danger in sight, or when an
   event or a window opens (windows pause the map anyway). dangerInSight stays for whoever asks what is about */
function dangerInSight(){const V=vis();
  if(W.fights.some(f=>asFight(f).inView(V)))return 'a fight ahead';
  for(const o of W.parties){const k=o.mapKind;if(o.inView(V)&&(k==='band'||(k==='lord'||k==='patrol')&&hostileTo(o.faction)))return k==='band'?'bandits in sight':k==='lord'?'an enemy army in sight':'enemy guards in sight'}
  for(const m of W.monsters){const M=MONSTERS[m.id];if((M.mythic||M.aggro||stance(monPower(m))==='attack')&&asMonster(m).inView(V))return (M.mythic?'the ':'')+(M.n||m.id).toLowerCase()+' in sight'}
  return ''}
// Hurry (supply.js) holds only while nothing calls for you: an event, a meeting or any window opening (main.js calls this every
// frame, whatever is shown), your band Exhausted, in camp or staying in a holding end it. Following a party is watched here too
// (followWatch)
function fastWatch(){followWatch();if(!G.hurry)return;const why=G.mode!=='world'||G.modal?'':P.staminaState()==='exhausted'?'your band is exhausted':P.camp||P.stay?'you stop':null;if(why!=null)setHurry(false,why)}
function updateWorld(dt){
  if(G.paused||G.dead)return;
  fastWatch();KNOWLEDGE.watch();// (last-known sightings: knowledge.js)
  const d=dt*G.speed*WORLD_PACE;lodTick(dt);
  Clock.advance(dt*G.speed*DAY/DAY_SECONDS);// (a new day: dayTick; a new hour: Systems.hour; core/clock.js)
  if(G.dead){if(G.mode!=='dead')showDeath();return}// (your hero died on the road in that time: the game is over, ui.js)
  G.encCool=Math.max(0,G.encCool-d/WORLD_SCALE.ai.grace);regenVitals(d/DAY);
  // then every system's step in its order (core/systems.js; Systems.names('frame') lists them: a stay first, a holding you reach
  // last); one that opens something ends the frame
  Systems.frame(d,dt);
}
// your march: in camp, the camp's moment (world/supply.js campStep: a travel order breaks it, and you march on); a siege you leave
// behind is lifted; whatever you follow (your goal behind it: followStep) or chase, then your step toward where you go (true: you
// reached what you chased and met it; following, at your goal you wait there)
function marchStep(d){
  if(P.camp&&!campStep())return false;
  if(P.siege){const st=townBy(P.siege.town);if(!st||Math.hypot(P.x-st.x,P.y-st.y)>WORLD_SCALE.war.siegeLeash){P.siege=null;log('You march away and the siege'+(st?' of '+st.name:'')+' is lifted.','bad','war')}}
  // (a chase ends when what you chase is gone or not worth it: WorldObject here, chaseable; reached, it is met, unless you just
  // fought and it would fight you: meetsAnyTime)
  if(G.follow)followStep();
  if(G.chase){const o=G.chase;if(!objKind(o)||!o.chaseable())G.chase=null;else{P.tx=o.x;P.ty=o.y;
    if(Math.hypot(o.x-P.x,o.y-P.y)<=worldBattleReach(o)&&!G.modal&&(G.encCool<=0||o.meetsAnyTime)){interact(o);return true}}}
  if(P.tx!=null){
    const dx=P.tx-P.x,dy=P.ty-P.y,dist=Math.hypot(dx,dy);
    if(dist<2){if(!G.follow){P.tx=null;G.byRoad=null;campArrive()}}// (the clear ground you walked to: your band pitches there, supply.js)
    else{
      const step=Math.min(dist,moveStep(MAP_BASE*travelMul(),d)*(P.morale<25?.8:1)*roadSprint()*hurryPace());// (roadSprint: after a thief on the road, encounters.js; Hurry: supply.js)
      P.dir=dx>=0?1:-1;
      const x0=P.x,y0=P.y;if(heroStep(dx,dy,dist,step)){P.stuck=0;const moved=Math.hypot(P.x-x0,P.y-y0);if(moved>0){train('scout',moved/TILE*.08);if(mountDef())train('ride',moved/TILE*.1);if(terrAt(P.x,P.y)===T_FOREST)train('wood',moved/TILE*WOODCRAFT.xp)}}else{P.stuck+=d;if(P.stuck>.4){P.tx=null;P.stuck=0;campArrive()}}
    }
  }
}
/* your step toward where you go: straight on while the way there is open ground (as ever); else by the router (world/router.js:
   round water and the peaks, over a ford, a bridge or a ferry), facing the way you went. True while you get on: moved by the router,
   or, with no way it knows (the goal off your land: water, a peak), nearer the goal than you have yet been on the way to it
   (HERO_WAY: a walk sliding back and forth along a shore gets nowhere, and stops) */
const HERO_WAY={x:NaN,y:NaN,d:Infinity};
// (a step of walker o toward (tx, ty) by that rule: 1 moved straight, 2 moved by the router, 0 not moved, -1 the router knows no
// way. Your hero's own (heroStep), and the ghost the drawn way follows ahead of you: gfx/worldui.js wuiWay. By road (byRoadTo,
// below): never straight, the router's way keeping to the roads)
function heroWay(o,tx,ty,step){const rd=byRoadTo(tx,ty);
  if(!rd&&passable(terrAt(o.x,o.y))&&clearLine(o.x,o.y,tx,ty))return walk(o,tx-o.x,ty-o.y,step)?1:0;// (not while on a ferry's water: its leg goes on by the router)
  const x0=o.x,y0=o.y;if(!Router.travel(o,rd?{x:tx,y:ty,road:ROAD_GO.keep}:{x:tx,y:ty},step))return -1;return o.x!==x0||o.y!==y0?2:0}
function heroStep(dx,dy,dist,step){
  const x0=P.x,r=heroWay(P,P.tx,P.ty,step);if(r===2&&P.x!==x0)P.dir=P.x>x0?1:-1;if(r>=0)return r>0;
  const W=HERO_WAY;if(W.x!==P.tx||W.y!==P.ty){W.x=P.tx;W.y=P.ty;W.d=dist}
  if(!walk(P,dx,dy,step))return false;const nd=Math.hypot(P.tx-P.x,P.ty-P.y);if(nd>=W.d-step*.25)return false;W.d=nd;return true}
/* by road (the owner, 2026-10-23: "a road snap in the action ring, to make the pathfinder prefer moving by road"; then "By road
   mode should be a toggle: the pathfinder always uses roads for travelling (if any are near)"): a mode, P.byRoad (true while on;
   absent, off: saved with you, a new hero's off). While it is on, every way you go (a click, Travel here, a chase, Hurry here)
   keeps to the roads and tracks (the router's road keeping, goal.road: off them a tile costs ROAD_GO.keep times as much, a
   mild preference: the shortest way, preferring the road (the owner, 2026-10-23: no going on along the road and back across to a
   spot near it); a caravan's or a worker's keeping, WAY.keep, is strict), leaving them only to reach the spot;
   the dots ahead show it (gfx/worldui.js wuiWay walks heroWay). With no road or track within
   ROAD_GO.near tiles of you or of the point, that trip goes the plain way, quietly. G.byRoad: the trip's answer, {k: the goal's
   tile, on} (never saved; a new order or arriving forgets it). Turned on or off by key B (ui/input.js) or the action ring's By
   road (supply.js mapRingItems: lit while on); the day bar shows it (render.js updateHUD, byRoadPill) */
const ROAD_GO={near:8,keep:1.15};
function byRoadTo(x,y){if(!P.byRoad)return false;const k=Math.floor(x/TILE)+','+Math.floor(y/TILE);
  if(!G.byRoad||G.byRoad.k!==k)G.byRoad={k,on:roadNear(P.x,P.y,ROAD_GO.near)||roadNear(x,y,ROAD_GO.near)};return G.byRoad.on}
// (a road's or a track's tile within n tiles of (x, y))
function roadNear(x,y,n){const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);for(let j=-n;j<=n;j++)for(let i=-n;i<=n;i++)if(tAt(tx+i,ty+j)===T_ROAD)return true;return false}
// by-road mode on or off (the way you go now taken again by it); its state
function setByRoad(on){on=!!on;G.byRoad=null;if(typeof WUI!=='undefined')WUI.way=null;if(on===!!P.byRoad)return on;
  if(on)P.byRoad=true;else delete P.byRoad;toast(on?'By road: your band keeps to the roads wherever one is near.':'By road off: your band takes the plain way again.');updateHUD(true);return on}
// (key B: on or off. The action ring's By road (roadGo): off, it turns on and you go to (wx, wy) by it; on, it turns off; the mode's state)
const toggleByRoad=()=>setByRoad(!P.byRoad);
function roadGo(wx,wy){if(P.byRoad)return setByRoad(false);setByRoad(true);worldMove(wx,wy);return true}
// (the day bar's mark while it is on: render.js updateHUD)
const byRoadPill=()=>P.byRoad?'<em class="wroad" title="By road: every way you go keeps to the roads and tracks when one is within '+ROAD_GO.near+' tiles (B or the action ring’s By road turns it off)">'+icon('map',12)+'<i>By road</i></em>':'';
// a holding you reach opens (true), unless you only pass it
function arriveStep(){
  for(const t of TOWNS){
    const dd=Math.hypot(P.x-t.x,P.y-t.y);
    // (it opens when you stop at it or ride to it (a click on it: the chase); passing by or through on your way, it does not)
    if(dd<11&&G.lastTown!==t&&!G.modal&&(P.tx==null||G.chase===t)){
      approachHolding(t);
      return true;
    }
    if(G.lastTown===t&&dd>28)G.lastTown=null;
  }
}

// the wounded heal: each day a share of them is fit again (more with Medicine, more near a friendly holding, faster in camp or
// staying in a holding)
function healShare(){const near=TOWNS.some(t=>!hostileTo(t.owner)&&Math.hypot(t.x-P.x,t.y-P.y)<WORLD_SCALE.land.healNear);return{near,share:Math.min(.9,(.2+.03*skill('med')+(near?.2:0))*(P.stay?2:P.camp?SUPPLY.camp.heal:1))}}
// up to n of the wounded of kind k fit again, back into their own groups first; a blocked originating group keeps its
// wounded (they never silently reinforce a duplicate group). Returns how many came back. (The day's healing, the herbalist.)
function woundedBack(k,n){const W0=P.wounded;let h=Math.min(n,W0[k]||0),got=0;
  for(const g of (P.woundedGroups||[]).filter(g=>g.type===k&&g.count)){if(!h)break;const m=partyRoster(P).restore(g,Math.min(h,g.count));g.count-=m;h-=m;got+=m}
  if(h&&!(P.woundedGroups||[]).some(g=>g.type===k&&g.count))got+=partyRoster(P).add(k,h);
  W0[k]-=got;if(!W0[k])delete W0[k];return got}
// Expected daily healing rolls until a type (or its originating group in recovery order) is fit again.
// Healing remains stochastic; this forecast uses today's rate and never consumes random draws.
function woundedRecoveryHours(k,id){
  const n=P.wounded?.[k]||0;if(!n)return 0;const r=partyRoster(P),rows=(P.woundedGroups||[]).filter(g=>g.type===k&&g.count>0);let needed=n;
  if(id){const index=rows.findIndex(g=>g.id===id);if(index<0)return 0;const w=rows[index],g=r.groups.find(g=>g.id===id);
    if(g?g.count+w.count>r.groupCap(k):r.slots>=r.groupLimit)return Infinity;needed=rows.slice(0,index+1).reduce((a,g)=>a+g.count,0)}
  const left=Math.max(0,n-needed),rate=healShare().share,E=new Float64Array(n+1);
  for(let m=left+1;m<=n;m++){const v=m*rate,whole=Math.floor(v),p=v-whole;E[m]=whole?1+(1-p)*E[Math.max(0,m-whole)]+p*E[Math.max(0,m-whole-1)]:1/p+E[m-1]}
  return Math.max(0,(E[n]-Clock.frac)*24);
}
function woundedDay(){const W0=P.wounded||{},r=healShare().share;let back=0;
  for(const k in W0){const n=W0[k];if(!n)continue;back+=woundedBack(k,Math.min(n,Math.floor(n*r+Math.random())))}
  P.woundedGroups=(P.woundedGroups||[]).filter(g=>g.count>0);
  sickTrim();// (the sick never more than the wounded left: supply.js)
  if(back)log(back+' of your wounded '+(back>1?'are':'is')+' fit to fight again.','good','band')}

// this file's work in the world's day and frame (core/systems.js)
Systems.add({name:'band',order:{day:20},day:bandDay});
Systems.add({name:'march',order:{frame:50},frame:marchStep,ends:true});
Systems.add({name:'wounded',order:{day:160},day:woundedDay});
Systems.add({name:'arrival',order:{frame:150},frame:arriveStep,ends:true});
