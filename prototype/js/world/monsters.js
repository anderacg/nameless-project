'use strict';
/* ---------- monsters ---------- */
// habitat tags for a spot: its climate on open ground, or 'forest' / 'hills' on those tiles
// (a wood in the frost is also 'snowwood': the reindeer's and snow hares' (data/critters.js), no monster's)
function habitatAt(x,y){const t=terrAt(x,y),c=t===T_FOREST&&climAt(x,y);return t===T_FOREST?['forest',c==='swamp'?'swamp':c==='frost'?'snowwood':'']:t===T_HILL?['hills']:t===T_OPEN?[climAt(x,y)]:[]}
/* a beast on the map (W.monsters: plain data, saved as it is; made a Monster in place: asMonster): a world object (parties.js) */
const MON_COUNTS=new WeakMap();
class Monster extends Party{
  get tc(){let c=MON_COUNTS.get(this);if(!c){c={};MON_COUNTS.set(this,c)}c[MONSTERS[this.id].unit]=this.n;return c}
  set tc(counts){this.n=counts[MONSTERS[this.id].unit]||0;MON_COUNTS.set(this,{...counts});this.pw=0}
  changed(){const c=MON_COUNTS.get(this);if(c)this.n=c[MONSTERS[this.id].unit]||0;this.pw=0;super.changed()}
  look(){return{col:'#c58af0',dir:faceDir(this),moving:true,race:ST[MONSTERS[this.id].unit]?.race}}
  get mapKind(){return 'monster'}
  // its record in a save (MON_KEYS, below)
  toJSON(){return packs()?packRec(this,MON_KEYS,['pw','t','a']):this}
  here(){return W.monsters.includes(this)}
  meet(){startMonster(this)}
  // in sight: a mythic one from afar (it flies over everything), the rest as anyone, nearer in woods and hills
  inView(V){return MONSTERS[this.id].mythic?this.fromYou()<V*1.6:spotted(this,V)}
  pick(at){at.add(this,11,6)}
  // its figure (a mythic one in flight, its wings beating, bobbing, drawn over what it flies above; the rest a walk of
  // PX.MAP_STEPS frames to a body length walked: render.js stepOf), its count and level by how it means to fight
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;if(WORLD_BATTLE.on){marchDraw(ents,this,cam);return}const m=this,M=MONSTERS[m.id],Y=M.mythic;
    ents.push({y:m.y+(Y&&Y.fly?30:0),top:!!(Y&&Y.fly),f:()=>{subT(m);
      const s=monsterMapSprite(m.id,Y?Math.floor(performance.now()/260+(m.hx||0))%2:stepOf(m,Math.max(4,monsterMapSprite(m.id,0).cw)/PX.MAP_STEPS,PX.MAP_STEPS)),w=s.width,h=s.ch,sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
      ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-Math.max(2,(s.cw>>1)-1),sy-1,Math.max(4,s.cw-2),2);
      ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:faceDir(m)<0)ctx.scale(-1,1);ctx.drawImage(s,-(w>>1),-s.height+2);ctx.restore();
      if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})}
  mapDot(V){const Y=MONSTERS[this.id].mythic;return this.fromYou()<V?[Y?'#ff7a30':'#c58af0',Y?2:1]:null}
  tip(){const M=MONSTERS[this.id];return '<b>'+(M.n||this.id)+(this.n>1?' ×'+this.n:'')+'</b><small>Level '+this.lv+tipOdds(monPower(this))+'</small><span class="act">Click: fight</span>'}
  // as one side of a fight on the map (fights.js), the face every party there shows: its fighters (n of its kind), its strength
  // (monPower; in a fight, its fighters at its level), its name, no realm; it loses its fighters one by one (n goes down)
  get troops(){return Array(this.n).fill(MONSTERS[this.id].unit)}
  set troops(list){this.n=list.length;this.pw=0}
  power(){return monPower(this)}
  fightPower(){return power(this.troops)*lvPow(this.lv)}
  label(){return MONSTERS[this.id].n}
  get faction(){return null}
  removeAny(k=1){const n=Math.min(k,this.n);this.n-=n;this.pw=0;return Array(n).fill(MONSTERS[this.id].unit)}
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
function spawnMonster(initial){
  // pick the kind first, favoring kinds that are scarce on the map, then find it a home in its habitat
  const ids=Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic),wt=id=>MONSTERS[id].w/(1+W.monsters.filter(m=>m.id===id).length);
  const R=monRng();
  let r=R.next()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const M=MONSTERS[id];
  // (in the wilds; after 200 tries, its ground not found there, at a land's far edge: lairLand)
  for(let k=0;k<400;k++){
    const x=R.int(2,MW-3)*TILE+8,y=R.int(2,MH-3)*TILE+8,tags=habitatAt(x,y);
    if(!M.where.some(w=>tags.includes(w))||Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.monster[initial?0:1]||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<WORLD_SCALE.spawn.monsterHold)||!lairLand(x,y,k>=200))continue;
    W.monsters.push(asMonster({id,x,y,hx:x,hy:y,lv:monLevel(R),n:R.int(M.count[0],M.count[1]),t:0,a:0,cool:0}));return;
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
    const A=WORLD_SCALE.ai,M=MONSTERS[m.id],prey=TravelAwareness.target(m)||P,dx=prey.x-m.x,dy=prey.y-m.y,dist=Math.hypot(dx,dy);m.cool=Math.max(0,m.cool-d);
    // (how it means to fight you weighed only while you are in its sight: out of it, it wanders whatever it thinks of you)
    const see=TravelAwareness.sees(m)?travelDetection(m).range:0,pw=monPower(m),st=dist<see?stance(pw,m):null,hunt=M.aggro&&Math.hypot(prey.x-m.hx,prey.y-m.hy)<A.lairHunt;
    if(m.cool>0||!stanceMove(m,st,dist,dx,dy,see,moveStep(26*Math.min(1,speedAt(m.x,m.y)||1),d),hunt)){m.t-=d;if(m.t<=0){const R=monRng();m.t=2+R.next()*4;m.a=R.next()*6.283}
      // wander, but stay near the lair
      const hx=m.hx-m.x,hy=m.hy-m.y;if(Math.hypot(hx,hy)>A.lairLeash)m.a=Math.atan2(hy,hx);walk(m,Math.cos(m.a),Math.sin(m.a),moveStep(10,d))}
    // a band it meets: it falls on them, and they fight back (a fight on the map)
    {const b=beastMeets(m);if(b){startFight([asMonster(m)],[b]);return false}}
    // (on you: a hunter when it is the stronger; one that waits to be hunted (a boar, a bear) when cornered, you right on it and
    // not far the stronger, the owner 2026-10-31: "make them charge when cornered")
    {const at=stance(monPower(m),m);if((M.aggro?at==='attack':at!=='afraid')&&TravelAwareness.sees(m)&&dist<(WORLD_BATTLE.on?worldBattleReach(m):10)&&m.cool<=0&&G.encCool<=0&&!G.modal){startMonster(m);return true}}
    return false}};
// the party a beast falls on: one it meets, out of any fight; a band always, any other (a lord's army, a watch, a caravan, a
// companion's party) when the beast dares it (DEFEND.dare); neither of them set out by a quest, nor a mythic beast (it ravages
// armies its own way: roamMythic)
const fightsOnMap=m=>!m.qid&&!MONSTERS[m.id].mythic;
const beastPrey=()=>[...bandits,...W.lords.filter(l=>!l.dead&&!l.inside),...W.patrols,...W.caravans,...cparties()];
const beastDares=(m,o)=>o.mapKind==='band'||monPower(m)>=o.power()*DEFEND.dare;
// (the first such in the parties' order; while the beasts move, from a grid of where they stand, which answers as the scan of
// them all does: Spatial.index. One set in a fight meanwhile is out of the reckoning wherever it stands)
let BAND_GRID=null;
const beastMeets=m=>m.cool<=0&&fightsOnMap(m)&&(BAND_GRID?BAND_GRID.within(m.x,m.y,DEFEND.meet):beastPrey()).find(b=>!b.qid&&!b.fight&&!b.gone&&!b.dead&&!b.inside&&b.troops.length&&Math.hypot(b.x-m.x,b.y-m.y)<DEFEND.meet&&beastDares(m,b))||null;
// beaten in a fight on the map: cut down as it flees (DEFEND.rout of the pack, rounded up: a lone beast dies), and those left
// break off, wounded, and slink back to its lair
function beastRouted(m){m.fight=null;m.n=Math.max(0,m.n-Math.ceil(m.n*DEFEND.rout));m.pw=0;const near=Math.hypot(m.x-P.x,m.y-P.y)<vis()*1.5,nm=MONSTERS[m.id].n.toLowerCase(),many=/s$/.test(nm);
  if(m.n<=0){W.monsters=W.monsters.filter(x=>x!==m);if(near)log('The '+nm+(many?' are':' is')+' slain near '+Spatial.nearestHolding(m.x,m.y).name+'.');return}
  m.cool=6;m.a=Math.atan2(m.hy-m.y,m.hx-m.x);m.t=3;if(near)log('The '+nm+(many?' break off and slink':' breaks off and slinks')+' away.')}
function updateMonsters(d){BAND_GRID=Spatial.index(beastPrey(),64);try{return lodEach(W.monsters,BEAST_MIND,d,hiddenAt(P.x,P.y)?.55:1)}finally{BAND_GRID=null}}
function startMonster(m){const M=MONSTERS[m.id];startEncounter({kind:'monster',ref:m,lv:m.lv,list:Array(m.n).fill(M.unit)})}
// roll trophies and gear for a won monster fight, into the bag (the victory panel lists them with the rest of the spoils)
function monsterLoot(m,slain){
  const M=MONSTERS[m.id],mats=slain.filter(k=>k===M.unit).length;
  if(mats&&M.mat){const kept=invAdd('mat',M.mat,mats);if(kept<mats)log('Your bag is full. You leave '+(mats-kept)+' '+MATS[M.mat].n.toLowerCase()+(mats-kept>1?'s':'')+' behind.','bad')}
  if(M.meat&&mats)invAdd('good','meat',mats*M.meat);
  for(const [it,ch] of M.gear)if(monRng().chance(ch*(1+.1*(m.lv-1)))){
    if(invAdd('gear',it,1))log('You found '+ITEMS[it].n+' ('+ITEMS[it].r+')!','gold');
    else log('Your bag is full. You leave '+ITEMS[it].n+' behind.','bad');
  }
  return '';
}
function monsterXp(m,slain){return Math.round(slain.reduce((a,k)=>a+(k===MONSTERS[m.id].unit?MONSTERS[m.id].xp:0),0)*(1+.25*(m.lv-1)))}

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
