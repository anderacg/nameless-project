'use strict';
/* ---------- critters: wild game to hunt, and the livestock of the holdings' pastures ---------- */
// W.critters: {crit:true, id, x, y, hx, hy, n, home (holding name, livestock only), t, a, dir, tire, cool, milked}
// a herd on the map (plain data, saved as it is; made a Herd in place: asHerd): a world object (parties.js). Wild game roams,
// is seen, hovered and met (hunted). Livestock lives in its holding's pasture: drawn there with the estate, inside its fence
// (penEnts, from structures.js holdingEnts), never a figure of its own; a holding with no pasture keeps its animals out of sight.
// Nothing is bought from a herd: the pasture's meat, milk, cheese and wool go to its holding (economy.js)
class Herd extends WorldObject{
  get mapKind(){return 'critter'}
  // its record in a save (HERD_KEYS, below)
  toJSON(){return packs()?packRec(this,HERD_KEYS,['crit','t','a']):this}
  here(){return W.critters.includes(this)}
  get meetsAnyTime(){return true}
  get wild(){return !CRITTERS[this.id].live}
  meet(){this.cool=4;if(this.wild)hunt(this)}
  // its holding's pasture fields, where it lives (livestock only; none: no pasture, or none worked)
  pasture(){return !this.wild&&this.home&&fieldsOf(townBy(this.home),'pasture')||null}
  inView(V){return this.wild&&spotted(this,V)}
  pick(at){if(this.wild)at.add(this,9,4)}
  // up to three of its animals, behind and beside the first, a walk of PX.MAP_STEPS frames to a body length walked (critterSprite;
  // render.js stepOf), its count near you; each at its own place to the screen's pixel (render.js subT)
  draw(ents,cam,V){if(!this.inView(V)||WildHunt.active?.herd===this)return;const c=this;if(WORLD_BATTLE.on)marchCircle(ents,c,cam,Math.max(WORLD_BATTLE.outer,WORLD_BATTLE.inner+Math.sqrt(c.n||1)*2),'#b4c985');
    ents.push({y:c.y,f:()=>{subT(c);const s=critterSprite(c.id),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y),k=Math.min(3,c.n||1),sp=Math.max(4,Math.round(s.cw*.55)),go=mapStepping(c),N=PX.MAP_STEPS;
      for(let i=k-1;i>=0;i--){const ox=i===0?0:i===1?-sp:Math.round(sp*.4),oy=i===0?0:i===1?-1:-3,fr=go?(frameOf(c,Math.max(4,s.cw)/N,N)+i*3)%N:0,a=critterSprite(c.id,fr),w=Math.max(4,a.cw-2);
        ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx+(c.dir<0?-ox:ox)-(w>>1),sy+oy-1,w,2);
        ctx.save();ctx.translate(sx+(c.dir<0?-ox:ox),sy+oy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(a,-(a.width>>1),-a.height+1);ctx.restore()}
      if(WORLD_BATTLE.on)BANNERQ.push({o:c,marker:{h:s.ch,col:'#b4c985'}});else if(c.n>1&&c.fromYou()<90)txt(String(c.n),sx,sy-s.ch-4,'#c8e0a0','center')}})}
  tip(){const D=CRITTERS[this.id];return this.wild?'<b>'+D.n+(this.n>1?' ×'+this.n:'')+'</b><small>Wild game</small><span class="act">Click: hunt</span>':''}// (livestock: never hovered)
}
const asHerd=asClass(Herd);
// (its record in a save: packed on a generated world, worldobject.js packRec, its grazing drawn again on its next moment (t, a:
// 0); herdRec reads it back, either way)
const HERD_KEYS=['id','x','y','hx','hy','n','dir','tire','cool','idle'];
const herdRec=o=>Array.isArray(o)?asHerd(unpackRec(o,HERD_KEYS,{crit:true,t:0,a:0})):o;
// the wild herds on the map (render.js drawWorld); livestock is drawn with its pasture (penEnts)
function drawHerds(ents,cam,V){for(const c of W.critters.map(asHerd))if(c.wild)c.draw(ents,cam,V)}
// a pasture's herd, drawn with its estate (structures.js holdingEnts, while its pasture is in sight): its animals inside the
// fence, a cow to a fenced tile or two of the smaller kinds (one at the front of the tile, one at the back), each grazing to and
// fro on its own tile by the clock, turning as it goes, never past its fence (penSpots: where each stands at time now: x, y its
// feet, a its picture, flip). None while the pasture has no worked fields or no herd. Seen only: the pasture answers a click
// (estates.js), its Pens tell of the herd
function penSpots(t,now){const c=herdOf(t),F=c&&fieldsOf(t,'pasture');if(!F)return [];const T=F.tiles,per=CRITTERS[c.id].size>=3?1:2,out=[];
  for(let j=0;j<Math.min(c.n,T.length*per);j++){const [tx,ty]=T[j%T.length],ph=now/2600+hash(tx,ty,t.seed+j)*6.283,mv=Math.cos(ph),fr=Math.abs(mv)>.6?Math.floor(now*PX.MAP_STEPS/(2*D_STEP)+j*3)%PX.MAP_STEPS:0,
    a=critterSprite(c.id,fr),amp=Math.max(0,Math.min(3,(TILE-4-a.cw)>>1));out.push({x:tx*TILE+TILE/2+Math.sin(ph)*amp,y:ty*TILE+(j<T.length?TILE-3:TILE-8),a,flip:mv<0,tx,ty})}
  return out}
function penEnts(t,ents,cam){penSpots(t,0).forEach((s0,j)=>ents.push({y:s0.y,f:()=>{const s=penSpots(t,performance.now())[j];if(!s)return;ctx.save();subT(s);const x=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y),w=Math.max(4,s.a.cw-2);// (its fraction of a pixel kept inside save/restore: drawn into the scene, a shift left over would pile up frame on frame)
  ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-(w>>1),sy-1,w,2);ctx.translate(x,sy);if(s.flip)ctx.scale(-1,1);ctx.drawImage(s.a,-(s.a.width>>1),-s.a.height+1);ctx.restore()}}))}
// (the wild game's and the herds' own dice: the stream 'critters', core/rng.js, so a kind added or a spawning rule changed never
// moves the world's Math.random)
const critRng=()=>rngOf('critters');
function spawnCritter(initial){
  const ids=Object.keys(CRITTERS).filter(k=>!CRITTERS[k].live),wt=id=>CRITTERS[id].w/(1+W.critters.filter(c=>c.id===id).length*.3);
  const R=critRng();
  let r=R.next()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const D=CRITTERS[id];
  for(let k=0;k<200;k++){
    const x=R.int(2,MW-3)*TILE+8,y=R.int(2,MH-3)*TILE+8,tags=habitatAt(x,y);
    if(!D.where.some(w=>tags.includes(w))||D.where.includes('forest')&&!tags.includes('forest')&&R.next()>CRITTER_WOODS.keep||D.rare&&tags.some(g=>D.rare[g]!=null&&R.next()>D.rare[g])||Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.critter[initial?0:1]||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<WORLD_SCALE.spawn.critterHold))continue;
    W.critters.push(asHerd({crit:true,id,x,y,hx:x,hy:y,n:R.int(D.herd[0],D.herd[1]),t:0,a:0,dir:1,tire:0,cool:0}));return;
  }
}
// can this kind of livestock stand here? its own ground and climate, never a road, a holding's yard, or another estate's plot
const GROUND_OF={[T_OPEN]:'open',[T_HILL]:'hills',[T_FOREST]:'forest'};
function grazeOk(id,x,y,pen){
  if(pen&&pen.town){const F=fieldsOf(townBy(pen.town),pen.k);return F?onFields(F,x,y):true}// (a pasture's fields: estates.js)
  if(pen)return x>=pen.x&&x<=pen.x+pen.w&&y>=pen.y&&y<=pen.y+pen.h;
  const G0=GRAZE[id];if(!G0)return passable(terrAt(x,y));const g=GROUND_OF[terrAt(x,y)];
  if(!g||!G0.on.includes(g)||G0.clim&&!G0.clim.includes(climAt(x,y)))return false;
  return !isClear(x,y);
}
// wild game wanders inside its habitat
const habitatOk=(id,x,y)=>{const tags=habitatAt(x,y);return CRITTERS[id].where.some(w=>tags.includes(w))};
// (a copy of a shuffled by binary insertion, a draw a comparison: what sort(()=>Math.random()-.5) did on a fresh page. That sort
// is not a function of its draws: once the browser optimizes its caller it compares in another order and draws fewer, so a
// new game's later draws hung on how warm the page was)
function drawShuffle(a){const R=critRng();a=a.slice();for(let s=1;s<a.length;s++){const p=a[s];let l=0,r=s;while(l<r){const m=(l+r)>>1;if(R.next()-.5<0)r=m;else l=m+1}a.splice(s,1);a.splice(l,0,p)}return a}
/* a pasture's herd: one of its land's animals (PASTURE_HERD), its people's taste tipping the choice, the same for a holding every
   game (its own hash). Its land: the climate where its barn stands; on the grass, hills or the forest's edge round it
   (PASTURE_LAND; the land as it lay before the estates' tracks, lots.js kindWas), else grass. What the pasture makes of it: its
   kind's own make, else MAKE.pasture's (estates.js Estate makes) */
function pastureLand(t){
  const l=lotAt(t,'pasture'),x0=l?l.x+(l.n>>1):t.tx,y0=l?l.y+(l.n>>1):t.ty,c=climAt((x0+.5)*TILE,(y0+.5)*TILE),L=PASTURE_LAND;if(c!=='grass')return c;
  const was=trackWas();let n=0,hill=0,wood=0;for(let y=y0-L.r;y<=y0+L.r;y++)for(let x=x0-L.r;x<=x0+L.r;x++){const g=kindWas(was,x,y);n++;if(g===T_HILL||g===T_MOUNT)hill++;else if(g===T_FOREST)wood++}
  return hill>=n*L.hill?'hills':wood>=n*L.wood?'forest':'grass'}
function pastureHerd(t){
  const ks=PASTURE_HERD[pastureLand(t)],like=LIVESTOCK[t.races[0]]||LIVESTOCK.human,w=ks.map(k=>like.includes(k)?PASTURE_LAND.taste:1);
  let r=hash(t.tx,t.ty,93)*w.reduce((a,b)=>a+b,0);for(let i=0;i<ks.length;i++){r-=w[i];if(r<0)return ks[i]}return ks[ks.length-1]}
const herdMake=t=>CRITTERS[pastureHerd(t)].make||MAKE.pasture.out;
// (a herd of a holding with a pasture: of the kind its pasture keeps (one that grazed by the holding before its pasture was built)
function herdKind(c){const t=c.home&&townBy(c.home);if(!t||!bldLv(t,'pasture'))return;const id=pastureHerd(t);if(c.id!==id){c.id=id;c.n=Math.min(c.n,CRITTERS[id].herd[1])}}
// one herd grazing beside a holding, of an animal its people keep and its land can feed: inside the pasture fence if it has one
// (of its pasture's kind: pastureHerd)
function spawnHerd(t){
  const kinds=drawShuffle(LIVESTOCK[t.races[0]]||LIVESTOCK.human),sp=typeof bldSpots==='function'&&bldLv(t,'pasture')?bldSpots(t).pasture:null;
  // (a pasture's herd grazes the middle of its fields (or round the barn, if it has none), a sight to see: its herders are met at
  // the pasture itself (estates.js estateMeet))
  if(sp){const F=fieldsOf(t,'pasture'),lv=bldLv(t,'pasture'),w=16+6*lv,h=12+3*lv,pen=F?{town:t.name,k:'pasture'}:{x:sp.x-w/2+3,y:sp.y-h/2+3,w:w-6,h:h-6},at=F||sp,
      id=pastureHerd(t),D=CRITTERS[id];
    W.critters.push(asHerd({crit:true,decor:true,id,x:at.x,y:at.y,hx:at.x,hy:at.y,pen,n:critRng().int(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0}));return true}
  for(const id of kinds){const D=CRITTERS[id],near=id==='hen';
    for(let k=0;k<160;k++){const R=critRng(),a=R.next()*6.283,d=(near?22:30)+R.next()*(near?10:18)+k*.5,// wider out if it finds no room close by
      x=t.x+Math.cos(a)*d,y=t.y+12+Math.sin(a)*d;
      // the spot and the ground around it, so the herd has room to graze
      if(!grazeOk(id,x,y)||[[8,0],[-8,0],[0,6],[0,-6]].filter(([a2,b2])=>grazeOk(id,x+a2,y+b2)).length<3)continue;
      W.critters.push(asHerd({crit:true,id,x,y,hx:x,hy:y,n:critRng().int(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0}));return true}}
  return false;
}
const herdOf=t=>W.critters.find(c=>c.home===t.name);
// (a pasture herd from before: moved to the middle of its fields, to be seen only)
function herdToFields(c){herdKind(c);const t=c.home&&townBy(c.home),F=t&&bldLv(t,'pasture')&&fieldsOf(t,'pasture');if(!c.pen||!t)return;c.decor=true;if(F&&!c.pen.town){c.pen={town:t.name,k:'pasture'};c.x=c.hx=F.x;c.y=c.hy=F.y}}
// (the wild game: as much as the world's density, data/world.js)
function initCritters(){TOWNS.filter(t=>t.T.herds).forEach(spawnHerd);for(let i=0,n=density(WM).critterStart;i<n;i++)spawnCritter(true)}
// each day: game returns, herds regrow and empty pastures restock
function critterDay(){
  const R=critRng(),D=density(WM);
  for(let k=0;k<D.daily.critters;k++)if(W.critters.filter(c=>!c.home).length<D.critterCap&&R.chance(.7))spawnCritter(false);
  for(const c of W.critters){herdKind(c);const D=CRITTERS[c.id];if(c.n<D.herd[1]&&R.chance(c.home?.35:.15))c.n++}
  TOWNS.filter(t=>t.T.herds&&!herdOf(t)&&R.chance(.25)).forEach(spawnHerd);
}
// Nearby people and beasts spook game even outside the player's view. Runtime caches never enter saves.
class WildlifeThreats{
  static index=Spatial.index([]);
  static chosen=new WeakMap();
  static present(o){return o&&!o.dead&&!o.gone&&!o.inside&&Number.isFinite(o.x)&&Number.isFinite(o.y)}
  static rebuild(){this.index.rebuild([...new Set([...W.parties,...W.caravans,...W.refugees,...W.monsters,...W.folk.filter(folkSeen)])].filter(o=>o!==P&&this.present(o)))}
  static target(c){
    const D=CRITTERS[c.id];if(!D||D.live)return null;
    const player=TravelAwareness.target(c),near=this.index.within(c.x,c.y,D.shy).filter(o=>this.present(o)&&Math.hypot(o.x-c.x,o.y-c.y)<D.shy*(hiddenAt(o.x,o.y)?WILDLIFE_AWARE.cover:1));
    if(player)near.push(player);
    const distance=o=>Math.hypot(o.x-c.x,o.y-c.y),previous=this.chosen.get(c);
    let target=Spatial.nearest(near,c.x,c.y);
    // Keep an escape heading until another threat is clearly closer.
    if(previous&&near.includes(previous)&&target&&distance(target)>=distance(previous)*WILDLIFE_AWARE.switch)target=previous;
    if(target)this.chosen.set(c,target);else this.chosen.delete(c);
    return target;
  }
}
onWorld(()=>{WildlifeThreats.index.rebuild([]);WildlifeThreats.chosen=new WeakMap()});
// Move every herd: wild game bolts from perceived threats and tires as it runs; livestock just grazes.
// a herd's moment (parties.js lodThink; hide: how well you are hidden from it). Hunting is an explicit choice.
const HERD_MIND={think(c,d,hide){
    if(WildHunt.active?.herd===c)return false;
    const A=WORLD_SCALE.ai,D=CRITTERS[c.id],threat=WildlifeThreats.target(c),ox=c.x,oy=c.y;c.cool=Math.max(0,c.cool-d);
    // (fleeing: its grazing ground goes with it, and it keeps on away a little after, so it does not turn back into you)
    if(threat){const sp=moveStep(D.spd*(c.tire>4?.4:1)*Math.min(1,speedAt(c.x,c.y)||1),d);Router.flee(c,threat,sp);c.tire+=d;
      c.hx=c.x;c.hy=c.y;c.a=Math.atan2(c.y-threat.y,c.x-threat.x);c.t=Math.max(c.t,1.5);c.idle=false}
    else{c.tire=Math.max(0,c.tire-d*.5);c.t-=d;if(c.t<=0){const R=critRng();c.t=2+R.next()*4;c.a=R.next()*6.283;c.idle=R.chance(.5)}
      const hx=c.hx-c.x,hy=c.hy-c.y;if(Math.hypot(hx,hy)>(D.live?(c.pen?A.penLeash:A.herdLeash):A.gameLeash))c.a=Math.atan2(hy,hx);
      if(!c.idle){const ok=D.live?(x,y)=>grazeOk(c.id,x,y,c.pen):(x,y)=>habitatOk(c.id,x,y);if(!walk(c,Math.cos(c.a),Math.sin(c.a),moveStep(D.live?4:8,d),ok)){c.a=Math.atan2(hy,hx)+(critRng().next()-.5);c.idle=true}}}
    // (it faces the way it went, turning only on a clear step sideways: no flicker as it swerves or runs straight up or down)
    {const mx=c.x-ox,my=c.y-oy;if(Math.abs(mx)>Math.hypot(mx,my)*.35&&Math.abs(mx)>.01)c.dir=mx>0?1:-1}

    return false}};
function updateCritters(d){WildlifeThreats.rebuild();return lodEach(W.critters,HERD_MIND,d,P.stay?0:hiddenAt(P.x,P.y)?.6:1)}
// One collected animal pays the existing meat, materials and experience rewards.
function hunt(c){return WildHunt.prepare(asHerd(c))}
function huntRewards(c,kills){
  const D=CRITTERS[c.id];
  const meat=invAdd('good','meat',kills*D.meat),got=[meat+' meat'];
  if(D.mat){let m=0;for(let i=0;i<kills;i++)if(critRng().chance(D.mat[1]*(1+.05*skill('hunt'))))m++;if(m){const k=invAdd('mat',D.mat[0],m);if(k)got.push(k+' '+MATS[D.mat[0]].n.toLowerCase()+(k>1?'s':''))}}
  gainXp(kills*D.xp);train('hunt',kills*3);
  log('You bring down '+(kills>1?kills+' '+D.n.toLowerCase():an(D.one))+': '+got.join(', ')+'.'+(meat<kills*D.meat?' Your bag is full, so you leave some meat.':''),'good');
  updateHUD(true);
}
/* sprites: the animals on the world map's scale (doc/WORLD_DESIGN.md §10.1: a person stands 10 high there, a house 16): a cow 9 × 5
   inside its outline (a water buffalo the same, its horns swept back), a camel 10 × 7 (its hump and neck), a deer 7 × 6 (a stag or
   a reindeer with its antlers over that), a sheep, a pig or a goat 4 × 3, a hen, a rabbit, a hare or a fowl 4 × 3; drawn pixel by
   pixel, side-on facing right, in its colour's hue-shifted ramp (engine PX.ramp:
   h its light, H the coat, d its shade, k darker; w white, e eye, n nose, b beak, y legs, r comb, a antler, o horn, s spots, f a
   face), with the people's outline (people.js), each in the smallest power-of-two cell it fits (8, 16: sprites.js cellOf). rows:
   the body over the legs; legs: two steps (under it, then apart), walked in PX.MAP_STEPS frames (engine/beasts.js PX.mapLegs; f 0
   standing: a walk to a body length walked, critters.js draw) */
const CRITTER_MAP={
  cow:{rows:['......ow.','.hhhshhHe','dHsHHHHHn','.dHHHHHd.'],legs:[['.kH..kH..'],['k.H.k..H.']]},
  sheep:{x:{f:'#4a423c'},rows:['hhh.','HHHf'],legs:[['.f.f'],['f.f.']]},
  pig:{rows:['hhh.','dHHn'],legs:[['.k.k'],['k.k.']]},
  goat:{rows:['.hho','dHHe'],legs:[['.k.k'],['k.k.']]},
  deer:{rows:['.....hd','.....He','whhhhHn','.dHHHd.'],legs:[['.kH.kH.','.kH.kH.'],['.kH.kH.','k.H.k.H']]},
  stag:{rows:['....a.a','.....a.','.....He','whhhhHn','.dHHHd.'],legs:[['.kH.kH.','.kH.kH.'],['.kH.kH.','k.H.k.H']]},
  reindeer:{rows:['....a.a','....aa.','.....He','dhhhhwn','.dHHHw.'],legs:[['.kH.kH.','.kH.kH.'],['.kH.kH.','k.H.k.H']]},
  ibex:{rows:['....oo.','.....oe','dhhhhHk','.dHHHd.'],legs:[['.kH.kH.','.kH.kH.'],['.kH.kH.','k.H.k.H']]},
  gazelle:{rows:['.....o.','.....He','dhhhhHn','.kkkkd.'],legs:[['.kH.kH.','.kH.kH.'],['.kH.kH.','k.H.k.H']]},
  rabbit:{rows:['..h.','whHe'],legs:[['.dd.'],['d..d']]},
  hare:{rows:['..hd','whHe'],legs:[['.dd.'],['d..d']]},
  hen:{rows:['d.r.','dhHb'],legs:[['.y.y'],['y.y.']]},
  camel:{rows:['....h...he','...hHh..Hn','.hhHHHh.H.','dHHHHHHHH.','.dHHHHHd..'],legs:[['..kH..kH..','..kH..kH..'],['..kH..kH..','.k.H.k..H.']]},
  buffalo:{x:{n:'#2a2628'},rows:['.....ooo.','.hhhhhhHe','dHHHHHHHn','.dHHHHHd.'],legs:[['.kH..kH..'],['k.H.k..H.']]},
  fowl:{rows:['..hH','dhHb'],legs:[['.y.y'],['y.y.']]}
};
function critterSprite(id,f){f=(f||0)%PX.MAP_STEPS;const k='cr'+id+f;if(spr[k])return spr[k];
  const D=CRITTERS[id],T=CRITTER_MAP[D.look||id],R=PX.ramp(D.col),rows=T.rows.concat(PX.mapLegs(T.legs[0],T.legs[1],f)),g=pgrid(Math.max(...rows.map(r=>r.length))+2,rows.length+2),
    col={h:R[0],H:R[1],d:R[2],k:R[3],w:'#f4f0e8',e:'#1a1410',n:'#e8a0a0',b:'#e8b94a',y:'#d8963a',r:'#d83a2a',a:'#d8c8a0',o:'#a89a7a',s:D.spots||R[3],...(T.x||{})};
  rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(col[c])pset(g,x+1,y+1,col[c])}));poutline(g);return spr[k]=cellOf(pcanvas(g))}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'herds',order:{day:80,frame:120},day:critterDay,frame:updateCritters,ends:true});
