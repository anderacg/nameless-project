'use strict';
/* ---------- monsters ---------- */
// habitat tags for a spot: its climate on open ground, or 'forest' / 'hills' on those tiles
// (a wood in the frost is also 'snowwood': the reindeer's and snow hares' (data/critters.js), and the snow spiders' (MONSTER_BREEDS))
function habitatAt(x,y){const t=terrAt(x,y),c=t===T_FOREST&&climAt(x,y);return t===T_FOREST?['forest',c==='swamp'?'swamp':c==='frost'?'snowwood':'']:t===T_HILL?['hills']:t===T_OPEN?[climAt(x,y)]:[]}
/* a beast on the map (W.monsters: plain data, saved as it is; made a Monster in place: asMonster): a world object (parties.js) */
const MON_COUNTS=new WeakMap();
const monsterTroops=m=>m.id==='wolf'&&m.alpha&&m.n>0?[WOLF_ALPHA.unit,...Array(m.n-1).fill('wolf')]:Array(Math.max(0,m.n)).fill(monOf(m).unit);
// A spawn-only roll derived from its lair; no extra draw advances either RNG stream.
const wolfAlphaAt=m=>m.id==='wolf'&&m.n>1&&PX.hash(Math.round(m.hx),Math.round(m.hy),(WM?.seedNum||0)^m.lv)<WOLF_ALPHA.chance;
class Monster extends Party{
  get tc(){let c=MON_COUNTS.get(this);if(!c){c={};if(this.id==='wolf'&&this.alpha&&this.n>0)c[WOLF_ALPHA.unit]=1;MON_COUNTS.set(this,c)}const a=this.id==='wolf'&&this.alpha&&this.n>0?1:0;if(a)c[WOLF_ALPHA.unit]=1;else delete c[WOLF_ALPHA.unit];c[monOf(this).unit]=Math.max(0,this.n-a);return c}
  set tc(counts){const a=this.id==='wolf'?Math.min(1,counts[WOLF_ALPHA.unit]||0):0;if(this.id==='wolf')this.alpha=a;this.n=(counts[monOf(this).unit]||0)+a;MON_COUNTS.set(this,{...counts,...(a?{[WOLF_ALPHA.unit]:a}:{})});this.pw=0}
  changed(){const c=MON_COUNTS.get(this);if(c){const a=this.id==='wolf'?Math.min(1,c[WOLF_ALPHA.unit]||0):0;if(this.id==='wolf')this.alpha=a;this.n=(c[monOf(this).unit]||0)+a}this.pw=0;super.changed()}
  look(){return{col:'#c58af0',dir:faceDir(this),moving:true,race:ST[monOf(this).unit]?.race}}
  get mapKind(){return 'monster'}
  // its record in a save (MON_KEYS, below)
  toJSON(){return packs()?packRec(this,MON_KEYS,['pw','t','a']):this}
  here(){return W.monsters.includes(this)}
  meet(){startMonster(this)}
  // in sight: a mythic one from afar (it flies over everything), the rest as anyone, nearer in woods and hills
  inView(V){return MONSTERS[this.id].mythic?yourSight(V).sees(this.x,this.y,1.6):spotted(this,V)}
  pick(at){at.add(this,11,6);at.army?.(this)}// (marched man by man: on any of them or inside its outline too, world.js pickAt army)
  // its figure (a mythic one in flight, its wings beating, bobbing, drawn over what it flies above; the rest a walk of
  // PX.MAP_STEPS frames to a body length walked: render.js stepOf), its count and level by how it means to fight
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;if(WORLD_BATTLE.on){marchDraw(ents,this,cam);return}const m=this,M=MONSTERS[m.id],Y=M.mythic;
    ents.push({y:m.y+(Y&&Y.fly?30:0),top:!!(Y&&Y.fly),f:()=>{subT(m);
      const u=monOf(m).unit,s=monsterMapSprite(m.id,Y?Math.floor(performance.now()/260+(m.hx||0))%2:stepOf(m,Math.max(4,monsterMapSprite(m.id,0,!!m.alpha,u).cw)/PX.MAP_STEPS,PX.MAP_STEPS),!!m.alpha,u),w=s.width,h=s.ch,sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
      ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-Math.max(2,(s.cw>>1)-1),sy-1,Math.max(4,s.cw-2),2);
      ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:faceDir(m)<0)ctx.scale(-1,1);ctx.drawImage(s,-(w>>1),-s.height+2);ctx.restore();
      if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})}
  mapDot(V){const Y=MONSTERS[this.id].mythic;return yourSight(V).sees(this.x,this.y)?[Y?'#ff7a30':'#c58af0',Y?2:1]:null}
  tip(){const M=monOf(this);return '<b>'+(this.eater?Death.nameOf(this)+', ':'')+(M.n||this.id)+(this.n>1?' ×'+this.n:'')+'</b><small>Level '+this.lv+tipOdds(monPower(this))+(this.id==='wolf'&&this.alpha?', Led by an Alpha Wolf':'')+'</small><span class="act">Click: fight</span>'}
  // as one side of a fight on the map (fights.js), the face every party there shows: its fighters (n of its kind), its strength
  // (monPower; in a fight, its fighters at its level), its name, no realm; it loses its fighters one by one (n goes down)
  get troops(){return monsterTroops(this)}
  set troops(list){this.tc=countsOf(list);this.changed()}
  power(){return monPower(this)}
  fightPower(){return power(this.troops)*lvPow(this.lv)}
  label(){return monOf(this).n+(this.id==='wolf'&&this.alpha?', Alpha Wolf':'')}
  get faction(){return null}
  removeAny(k=1){const n=Math.max(0,Math.min(Math.floor(k),this.n)),a=this.id==='wolf'&&this.alpha&&this.n>0?1:0,regular=Math.min(n,this.n-a),out=Array(regular).fill(monOf(this).unit);if(n>regular){out.push(WOLF_ALPHA.unit);this.alpha=0}this.n-=n;this.pw=0;MON_COUNTS.delete(this);super.changed();return out}
  // a blow in a fight on the map (blow: the strength of the fighter that dealt it): a wound (hurt); wounds as strong as one of
  // the pack fell it, so a troll takes the blows of many militia
  takeLoss(blow){const one=this.fightPower()/Math.max(1,this.n);this.hurt=(this.hurt||0)+blow;while(this.n>0&&this.hurt>=one){this.hurt-=one;this.removeAny(1)}}
}
// (its record in a save: packed on a generated world, worldobject.js packRec, its strength made again and its wandering drawn
// again on its next moment (t, a: 0); read back either way)
const MON_KEYS=['id','x','y','hx','hy','lv','n','cool','escapeSta'];
const asMonster=o=>asClass(Monster)(Array.isArray(o)?unpackRec(o,MON_KEYS,{t:0,a:0}):o);
// (the beasts' own dice: the stream 'monsters', core/rng.js, so a kind added or a weight changed never moves the world's Math.random)
const monRng=()=>rngOf('monsters');
// (monLevel0: without the chance of one more; r: the stream it rolls on, Math.random by default: the sites')
const monLevel0=()=>1+Math.floor(G.day/20),monLevel=r=>monLevel0()+((r?r.next():Math.random())<.3?1:0);
const lvMul=lv=>(1+.2*(lv-1))*(1+.12*(lv-1));
// a kind's ground with its breeds' (MONSTER_BREEDS); a lair's breed by its ground: one whose ground it is, or its kind's own (weight
// 1, on its kind's ground), by a hash of where it lies (no draw on the stream); null: its kind's own
const breedsFor=id=>MONSTER_BREEDS.on?Object.entries(MONSTER_BREEDS.kinds).filter(([,b])=>b.kind===id):[];
const lairWhere=id=>[...MONSTERS[id].where,...breedsFor(id).flatMap(([,b])=>b.where)];
function breedAt(id,x,y,tags){const on=w=>tags.includes(w),L=[...(MONSTERS[id].where.some(on)?[[null,1]]:[]),...breedsFor(id).filter(([,b])=>b.where.some(on)).map(([k,b])=>[k,b.w])];
  let r=PX.hash(Math.round(x),Math.round(y),(WM?.seedNum||0)^7919)*L.reduce((a,q)=>a+q[1],0);for(const [k,w] of L){r-=w;if(r<=0)return k}return L.length?L[L.length-1][0]:null}
function spawnMonster(initial){
  // pick the kind first, favoring kinds that are scarce on the map, then find it a home in its habitat
  const ids=Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic),wt=id=>MONSTERS[id].w/(1+W.monsters.filter(m=>m.id===id).length);
  const R=monRng();
  let r=R.next()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const M=MONSTERS[id];
  // (in the wilds, far from every holding (monsterHold px: the owner, 2026-11-05, "monsters should spawn far away from holdings"; half
  // that after 300 tries); after 200 tries, its ground not found there, at a land's far edge: lairLand)
  for(let k=0;k<400;k++){
    const x=R.int(2,MW-3)*TILE+8,y=R.int(2,MH-3)*TILE+8,tags=habitatAt(x,y),hold=WORLD_SCALE.spawn.monsterHold*(k>=300?.5:1);
    if(!lairWhere(id).some(w=>tags.includes(w))||Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.monster[initial?0:1]||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<hold)||!lairLand(x,y,k>=200))continue;
    const m=asMonster({id,x,y,hx:x,hy:y,lv:monLevel(R),n:R.int(M.count[0],M.count[1]),t:0,a:0,cool:0});if(wolfAlphaAt(m))m.alpha=1;{const br=breedAt(id,x,y,tags);if(br)m.breed=br}W.monsters.push(m);return;
  }
}
// where a beast may make its lair (the owner, 2026-10-19): in the wilds, on no holding's land; or, when rim (its kind's ground
// not found in the wilds this time), within WORLD_SCALE.spawn.rim tiles of a land's edge, away from every holding and estate
const lairLand=(x,y,rim)=>!landHold(x,y)||!!rim&&landRim(x,y,WORLD_SCALE.spawn.rim)&&farFromHomes(x,y,WORLD_SCALE.spawn.away);
// (as many tries a day as the world's density: data/world.js)
function monsterDay(){const D=density(WM);for(let k=0;k<D.daily.monsters;k++)if(W.monsters.length<D.monsterCap&&monRng().chance(.6))spawnMonster(false);mythicDay()}
// a beast's moment (parties.js lodThink; hide: how well you are hidden from it): a mythic one roams; the rest hunt you, keep
// off, or wander near the lair; one that waits to be hunted charges when you corner it. True when it falls on you
const BEAST_MIND={think(m,d,hide){
    if(inFight(m))return false;// (fighting on the map: fights.js)
    if(MONSTERS[m.id].mythic)return roamMythic(m,d);
    const x0=m.x,y0=m.y,wild0=!landHold(x0,y0);try{return BEAST_MIND.move(m,d,hide)}finally{beastKeepsOut(m,x0,y0,wild0)}},
  move(m,d,hide){
    const A=WORLD_SCALE.ai,M=MONSTERS[m.id],prey=TravelAwareness.target(m)||P,dx=prey.x-m.x,dy=prey.y-m.y,dist=Math.hypot(dx,dy);m.cool=Math.max(0,m.cool-d);
    // (how it means to fight you weighed only while you are in its sight: out of it, it wanders whatever it thinks of you; but
    // afraid of you and remembering you (engage.js fearOf) it keeps away, just after a fight too, not back to its lair past you)
    const see=TravelAwareness.sees(m)?travelDetection(m).range:0,pw=monPower(m),at=stance(pw,m),fear=fearOf(m,at),st=dist<see||fear?at:null,hunt=M.aggro&&Math.hypot(prey.x-m.hx,prey.y-m.hy)<A.lairHunt;
    if(m.cool>0&&!fear||!stanceMove(m,st,dist,dx,dy,see,moveStep(26*Math.min(1,speedAt(m.x,m.y)||1),d),hunt)){m.t-=d;if(m.t<=0){const R=monRng();m.t=2+R.next()*4;m.a=R.next()*6.283}
      // wander, but stay near the lair
      const hx=m.hx-m.x,hy=m.hy-m.y;if(Math.hypot(hx,hy)>A.lairLeash)m.a=Math.atan2(hy,hx);walk(m,Math.cos(m.a),Math.sin(m.a),moveStep(10,d))}
    // a band it meets: it falls on them, and they fight back (a fight on the map)
    {const b=beastMeets(m);if(b){startFight([asMonster(m)],[b]);return false}}
    // (on you: a hunter when it is the stronger; one that waits to be hunted (a boar, a bear) when cornered, you right on it and
    // not far the stronger, the owner 2026-10-31: "make them charge when cornered")
    {if((M.aggro?at==='attack':at!=='afraid')&&TravelAwareness.sees(m)&&dist<(WORLD_BATTLE.on?worldBattleReach(m):10)&&m.cool<=0&&G.encCool<=0&&!G.modal){startMonster(m);return true}}
    return false},
  // far from you (the far tier, worldobject.js): a beast holds by its lair (doc/WORLD_DESIGN.md §3.5: it wanders only near you); a
  // mythic one roams on, as a mid one thinks
  farStep(m,d,x,k){return MONSTERS[m.id].mythic?lodMid(this,m,k,d,x):false}};
// a beast keeps off the holdings' land (the owner, 2026-11-05: "they tend to avoid holding territories"): a step from the wilds onto a
// holding's land taken back, and it turns for its lair; one on such land already walks off it as it will (a lair at a land's rim)
function beastKeepsOut(m,x0,y0,wild0){if(!wild0||(m.x===x0&&m.y===y0)||!landHold(m.x,m.y))return;m.x=x0;m.y=y0;m.a=Math.atan2(m.hy-m.y,m.hx-m.x);m.t=2}
// the party a beast falls on: one it meets, out of any fight; a band always, any other (a lord's army, a watch, a caravan, a
// companion's party) when the beast dares it (DEFEND.dare); neither of them set out by a quest, nor a mythic beast (it ravages
// armies its own way: roamMythic)
const fightsOnMap=m=>!m.qid&&!MONSTERS[m.id].mythic;
const beastPrey=()=>[...bandits,...W.lords.filter(l=>!l.dead&&!l.inside),...W.patrols,...W.caravans,...cparties()];
const beastDares=(m,o)=>o.mapKind==='band'||monPower(m)>=o.power()*DEFEND.dare;
// (the first such in the parties' order; while the beasts move, from a grid of where they stand, which answers as the scan of
// them all does: Spatial.index. One set in a fight meanwhile is out of the reckoning wherever it stands)
let BAND_GRID=null;
// (the prey where beasts think, for the frame: from the chunk grid (worldobject.js lodBox, DEFEND.meet wider), in beastPrey's
// order (its kinds in turn, each in its list's); box: where a beast may ask it, null everywhere (the tiers off: every prey, as
// ever). One asking from beyond it is answered by the scan)
const PREY_RANK=(T=>({[T.band]:0,[T.lord]:1,[T.patrol]:2,[T.caravan]:3,[T.cparty]:4}))(LOD_TAG);
function beastPreyGrid(){const b=lodBox(DEFEND.meet+WORLD_LOD.lag),box=lodBox(0);if(!b)return Object.assign(Spatial.index(beastPrey(),64),{box:null});
  const G=lodGrid(),R=o=>PREY_RANK[G.tag.get(o)],L=G.box(b[0],b[1],b[2],b[3],[]).filter(o=>R(o)!=null&&!(G.tag.get(o)===LOD_TAG.lord&&(o.dead||o.inside)));
  L.sort((a,c)=>R(a)-R(c)||G.ord.get(a)-G.ord.get(c));return Object.assign(Spatial.index(L,64),{box})}
const beastMeets=m=>m.cool<=0&&fightsOnMap(m)&&(BAND_GRID&&lodIn(BAND_GRID.box,m.x,m.y)?BAND_GRID.within(m.x,m.y,DEFEND.meet):beastPrey()).find(b=>!b.qid&&!b.fight&&!b.gone&&!b.dead&&!b.inside&&b.troops.length&&Math.hypot(b.x-m.x,b.y-m.y)<DEFEND.meet&&beastDares(m,b))||null;
// beaten in a fight on the map: cut down as it flees (DEFEND.rout of the pack, rounded up: a lone beast dies), and those left
// break off, wounded, and slink back to its lair
function beastRouted(m){m.fight=null;asMonster(m).removeAny(Math.ceil(m.n*DEFEND.rout));m.pw=0;const near=Math.hypot(m.x-P.x,m.y-P.y)<vis()*1.5,nm=monOf(m).n.toLowerCase(),many=/s$/.test(nm);
  if(m.n<=0){W.monsters=W.monsters.filter(x=>x!==m);if(near)log('The '+nm+(many?' are':' is')+' slain near '+Spatial.nearestHolding(m.x,m.y).name+'.');return}
  m.cool=6;m.a=Math.atan2(m.hy-m.y,m.hx-m.x);m.t=3;if(near)log('The '+nm+(many?' break off and slink':' breaks off and slinks')+' away.')}
// (each beast asks whose land it stands on, before and after its step, and none of them changes it: looked at once, territory.js landHeldFor)
function updateMonsters(d){BAND_GRID=beastPreyGrid();try{return landHeldFor(()=>lodEach(W.monsters,BEAST_MIND,d,hiddenAt(P.x,P.y)?.55:1))}finally{BAND_GRID=null}}
function startMonster(m){startEncounter({kind:'monster',ref:m,lv:m.lv,list:monsterTroops(m)})}
// roll trophies and gear for a won monster fight, into the bag (the victory panel lists them with the rest of the spoils)
function monsterLoot(m,slain){
  const M=monOf(m),all=slain.filter(k=>k===M.unit||m.id==='wolf'&&k===WOLF_ALPHA.unit).length,mats=Math.max(0,all-(G.enc?.field?.mats?.[M.mat]||0));// (the hides the field gave already: battle/drops.js)
  if(mats&&M.mat){const kept=invAdd('mat',M.mat,mats);if(kept<mats)log('Your bag is full. You leave '+(mats-kept)+' '+MATS[M.mat].n.toLowerCase()+(mats-kept>1?'s':'')+' behind.','bad')}
  // (every beast's meat: a hide picked up on the field cost its meat)
  if(M.meat&&all){const n=invAdd('good','meat',all*M.meat);if(n)worldEmit('meat:hunted',{n})}
  for(const [it,ch] of M.gear)if(monRng().chance(ch*(1+.1*(m.lv-1)))){
    if(invAdd('gear',it,1))log('You found '+ITEMS[it].n+' ('+ITEMS[it].r+')!','gold');
    else log('Your bag is full. You leave '+ITEMS[it].n+' behind.','bad');
  }
  return '';
}
function monsterXp(m,slain){return Math.round(slain.reduce((a,k)=>a+(k===monOf(m).unit?monOf(m).xp:m.id==='wolf'&&k===WOLF_ALPHA.unit?WOLF_ALPHA.xp:0),0)*(1+.25*(m.lv-1)))}

/* mythic monsters (MONSTERS[id].mythic): one of each at a time, anywhere on the map. W.mythic[id] = {back}: the day the next one
   may appear. It hunts you when it sees you, mauls any army it lands on, burns the fields of holdings near it, and pays a hoard. */
const LAIR_TILES={mountains:()=>T_MOUNT,hills:()=>T_HILL};
const mythicIds=()=>Object.keys(MONSTERS).filter(id=>MONSTERS[id].mythic);
const mythicOf=id=>W.monsters.find(m=>m.id===id);
// a line of news about the mythic monsters abroad, for the realms page and tavern talk
const mythicNews=(verb)=>W.monsters.filter(m=>MONSTERS[m.id].mythic).map(m=>cap1(an(MONSTERS[m.id].n.toLowerCase()))+' '+verb+' near '+Spatial.nearestHolding(m.x,m.y).name+'.').join(' ');
function spawnMythic(id){
  const M=MONSTERS[id],Y=M.mythic,lairs=Y.lair.map(l=>LAIR_TILES[l]());
  // its favorite ground first; the others only if that keeps failing; in the wilds, or late at a land's far edge (lairLand)
  const R=monRng();
  for(let k=0;k<160;k++){const tx=R.int(3,MW-4),ty=R.int(3,MH-4),tt=tAt(tx,ty),ok=k<100?tt===lairs[0]:lairs.includes(tt);if(!ok)continue;
    const x=(tx+.5)*TILE,y=(ty+.5)*TILE;if(Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.mythic||!lairLand(x,y,k>=130))continue;
    const m=asMonster({id,x,y,hx:x,hy:y,tx:x,ty:y,lv:1,n:1,t:0,a:0,cool:5,dir:1});W.monsters.push(m);
    log(cap1(an(M.n.toLowerCase()))+' has been sighted near '+Spatial.nearestHolding(m.x,m.y).name+'!','bad');return m}
  W.mythic[id]={back:G.day+2};return null;
}
function mythicDay(){
  for(const id of mythicIds()){const M=MONSTERS[id],Y=M.mythic,m=mythicOf(id),st=W.mythic[id]||(W.mythic[id]={back:Y.first});
    if(!m){if(G.day>=st.back)spawnMythic(id);continue}
    if(Y.scorch&&monRng().chance(Y.scorch)){const t=Spatial.nearestHolding(m.x,m.y);if(Math.hypot(t.x-m.x,t.y-m.y)<WORLD_SCALE.ai.mythicScorch){t.gar=Math.floor(t.gar/2);m.tx=t.x;m.ty=t.y-20;m.t=6;log('The '+M.n.toLowerCase()+' burns the fields of '+t.name+'. Its garrison is halved.','bad')}}}
}
// one frame of a mythic monster: hunt you if it sees you, else roam; returns true if it starts a fight
function roamMythic(m,d){
  const M=MONSTERS[m.id],Y=M.mythic;m.cool=Math.max(0,m.cool-d);
  const prey=TravelAwareness.target(m)||P,pd=Math.hypot(prey.x-m.x,prey.y-m.y),hunt=TravelAwareness.sees(m)&&m.cool<=0;let tx=m.tx,ty=m.ty;
  if(hunt){tx=prey.x;ty=prey.y}
  else{m.t-=d;if(m.t<=0||Math.hypot(tx-m.x,ty-m.y)<4){const r=monRng(),R=WORLD_SCALE.ai.mythicRoam;m.t=4+r.next()*5;m.tx=tx=clamp(m.x+r.int(-R[0],R[0]),24,MW*TILE-24);m.ty=ty=clamp(m.y+r.int(-R[1],R[1]),24,MH*TILE-24)}}
  const dx=tx-m.x,dy=ty-m.y,dl=Math.hypot(dx,dy);
  if(dl>1){const sp=Math.min(dl,moveStep(Y.speed[0],d));if(Y.fly){m.x+=dx/dl*sp;m.y+=dy/dl*sp}else walk(m,dx,dy,sp);m.dir=dx>=0?1:-1}
  if(Y.ravage)for(const l of W.lords)if(!l.dead&&!l.inside&&!((l.dcool||0)>G.day)&&Math.hypot(l.x-m.x,l.y-m.y)<16){l.dcool=G.day+3;cull(l,Y.ravage);log('The '+M.n.toLowerCase()+' falls upon the army of '+l.name+'. '+(Y.ravage>=.5?'Half':'Many')+' are lost.','bad');if(l.troops.length<3)defeatLord(l)}
  if(TravelAwareness.sees(m)&&pd<(WORLD_BATTLE.on?worldBattleReach(m):12)&&m.cool<=0&&G.encCool<=0&&!G.modal){startMonster(m);return true}
  return false;
}
// slain: its hoard (all of its gold yours: res.own, never shared with those beside you, engage.js reinfCut), and the wait for the next one
function mythicSlain(m,res){
  const M=MONSTERS[m.id],Y=M.mythic,H=Y.hoard||{};let txt='';
  W.mythic[m.id]={back:G.day+Y.back};res.fame=Y.fame;
  if(H.gold){res.gold+=H.gold;res.own=(res.own||0)+H.gold}if(H.renown)P.renown+=H.renown;if(H.text)txt+=' '+H.text;
  if(H.gear){const g=Rng.use('monsters',()=>randomGear(H.gear[0],H.gear[1]));if(!invAdd('gear',g,1))log('Your bag is full. You leave a '+ITEMS[g].n+' behind.','bad')}
  if(H.egg&&monRng().chance(H.egg[1])&&invAdd('gear',H.egg[0],1))txt+=' Among the gold, an egg hatches: a <span style="color:'+RARITY[ITEMS[H.egg[0]].r]+'">'+ITEMS[H.egg[0]].n+'</span>.';
  log('The '+M.n.toLowerCase()+' is slain! Your name rings across Ashmark.','gold');
  return txt;
}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'monsters',order:{day:60,frame:110},day:monsterDay,frame:updateMonsters,ends:true});
