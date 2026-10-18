'use strict';
/* ---------- monsters ---------- */
// habitat tags for a spot: its climate on open ground, or 'forest' / 'hills' on those tiles
function habitatAt(x,y){const t=terrAt(x,y);return t===T_FOREST?['forest',climAt(x,y)==='swamp'?'swamp':'']:t===T_HILL?['hills']:t===T_OPEN?[climAt(x,y)]:[]}
/* a beast on the map (W.monsters: plain data, saved as it is; made a Monster in place: asMonster): a world object (parties.js) */
class Monster extends WorldObject{
  get mapKind(){return 'monster'}
  here(){return W.monsters.includes(this)}
  meet(){startMonster(this)}
  // in sight: a mythic one from afar (it flies over everything), the rest as anyone, nearer in woods and hills
  inView(V){return MONSTERS[this.id].mythic?this.fromYou()<V*1.6:spotted(this,V)}
  pick(at){at.add(this,11,6)}
  // its figure (a mythic one in flight, bobbing, drawn over what it flies above), its count and level by how it means to fight
  draw(ents,cam,V){if(!this.inView(V))return;const m=this,M=MONSTERS[m.id],Y=M.mythic;
    ents.push({y:m.y+(Y&&Y.fly?30:0),f:()=>{
      const s=monsterMapSprite(m.id,Math.floor(performance.now()/(Y?260:D_STEP*1.4)+(m.hx||0))%(Y?2:4)),w=s.width,h=s.ch,sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
      ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-5,sy-1,10,2);
      ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:faceDir(m)<0)ctx.scale(-1,1);ctx.drawImage(s,-(w>>1),-s.height+2);ctx.restore();
      if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})}
  mapDot(V){const Y=MONSTERS[this.id].mythic;return this.fromYou()<V?[Y?'#ff7a30':'#c58af0',Y?2:1]:null}
  tip(){const M=MONSTERS[this.id];return '<b>'+(M.n||this.id)+(this.n>1?' ×'+this.n:'')+'</b><small>Level '+this.lv+tipOdds(monPower(this))+'</small><span class="act">Click: fight</span>'}
}
const asMonster=asClass(Monster);
const monLevel=()=>1+Math.floor(G.day/20)+(Math.random()<.3?1:0);
const lvMul=lv=>(1+.2*(lv-1))*(1+.12*(lv-1));
function spawnMonster(initial){
  // pick the kind first, favoring kinds that are scarce on the map, then find it a home in its habitat
  const ids=Object.keys(MONSTERS).filter(id=>!MONSTERS[id].mythic),wt=id=>MONSTERS[id].w/(1+W.monsters.filter(m=>m.id===id).length);
  let r=Math.random()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const M=MONSTERS[id];
  for(let k=0;k<200;k++){
    const x=rint(2,MW-3)*TILE+8,y=rint(2,MH-3)*TILE+8,tags=habitatAt(x,y);
    if(!M.where.some(w=>tags.includes(w))||Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.monster[initial?0:1]||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<WORLD_SCALE.spawn.monsterHold))continue;
    W.monsters.push(asMonster({id,x,y,hx:x,hy:y,lv:monLevel(),n:rint(M.count[0],M.count[1]),t:0,a:0,cool:0}));return;
  }
}
function monsterDay(){for(let k=0;k<3;k++)if(W.monsters.length<MONSTER_CAP&&Math.random()<.6)spawnMonster(false);mythicDay()}
function updateMonsters(d){
  const hide=hiddenAt(P.x,P.y)?.55:1,A=WORLD_SCALE.ai;
  for(const m of W.monsters){
    if(MONSTERS[m.id].mythic){if(roamMythic(m,d))return true;continue}
    const M=MONSTERS[m.id],dx=P.x-m.x,dy=P.y-m.y,dist=Math.hypot(dx,dy);m.cool=Math.max(0,m.cool-d);
    const st=stance(monPower(m)),hunt=M.aggro&&Math.hypot(P.x-m.hx,P.y-m.hy)<A.lairHunt;
    if(m.cool>0||!stanceMove(m,st,dist,dx,dy,WORLD_SCALE.sight.monster*hide,moveStep(26*Math.min(1,speedAt(m.x,m.y)||1),d),hunt)){m.t-=d;if(m.t<=0){m.t=2+Math.random()*4;m.a=Math.random()*6.283}
      // wander, but stay near the lair
      const hx=m.hx-m.x,hy=m.hy-m.y;if(Math.hypot(hx,hy)>A.lairLeash)m.a=Math.atan2(hy,hx);walk(m,Math.cos(m.a),Math.sin(m.a),moveStep(10,d))}
    if(M.aggro&&stance(monPower(m))==='attack'&&dist<10&&m.cool<=0&&G.encCool<=0&&!G.modal){startMonster(m);return true}
  }
  return false;
}
function startMonster(m){const M=MONSTERS[m.id];startEncounter({kind:'monster',ref:m,lv:m.lv,list:Array(m.n).fill(M.unit)})}
// roll trophies and gear for a won monster fight, into the bag (the victory panel lists them with the rest of the spoils)
function monsterLoot(m,slain){
  const M=MONSTERS[m.id],mats=slain.filter(k=>k===M.unit).length;
  if(mats&&M.mat){const kept=invAdd('mat',M.mat,mats);if(kept<mats)log('Your bag is full. You leave '+(mats-kept)+' '+MATS[M.mat].n.toLowerCase()+(mats-kept>1?'s':'')+' behind.','bad')}
  if(M.meat&&mats)invAdd('good','meat',mats*M.meat);
  for(const [it,ch] of M.gear)if(Math.random()<ch*(1+.1*(m.lv-1))){
    if(invAdd('gear',it,1))log('You found '+ITEMS[it].n+' ('+ITEMS[it].r+')! Open your inventory with I.','gold');
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
const mythicNews=(verb)=>W.monsters.filter(m=>MONSTERS[m.id].mythic).map(m=>cap1(an(MONSTERS[m.id].n.toLowerCase()))+' '+verb+' near '+nearestOf(m,TOWNS).name+'.').join(' ');
function spawnMythic(id){
  const M=MONSTERS[id],Y=M.mythic,lairs=Y.lair.map(l=>LAIR_TILES[l]());
  // its favorite ground first; the others only if that keeps failing
  for(let k=0;k<160;k++){const tx=rint(3,MW-4),ty=rint(3,MH-4),tt=tAt(tx,ty),ok=k<100?tt===lairs[0]:lairs.includes(tt);if(!ok)continue;
    const x=(tx+.5)*TILE,y=(ty+.5)*TILE;if(Math.hypot(x-P.x,y-P.y)<WORLD_SCALE.spawn.mythic)continue;
    const m=asMonster({id,x,y,hx:x,hy:y,tx:x,ty:y,lv:1,n:1,t:0,a:0,cool:5,dir:1});W.monsters.push(m);
    log(cap1(an(M.n.toLowerCase()))+' has been sighted near '+nearestOf(m,TOWNS).name+'!','bad');return m}
  W.mythic[id]={back:G.day+2};return null;
}
function mythicDay(){
  for(const id of mythicIds()){const M=MONSTERS[id],Y=M.mythic,m=mythicOf(id),st=W.mythic[id]||(W.mythic[id]={back:Y.first});
    if(!m){if(G.day>=st.back)spawnMythic(id);continue}
    if(Y.scorch&&Math.random()<Y.scorch){const t=nearestOf(m,TOWNS);if(Math.hypot(t.x-m.x,t.y-m.y)<WORLD_SCALE.ai.mythicScorch){t.gar=Math.floor(t.gar/2);m.tx=t.x;m.ty=t.y-20;m.t=6;log('The '+M.n.toLowerCase()+' burns the fields of '+t.name+'. Its garrison is halved.','bad')}}}
}
// one frame of a mythic monster: hunt you if it sees you, else roam; returns true if it starts a fight
function roamMythic(m,d){
  const M=MONSTERS[m.id],Y=M.mythic;m.cool=Math.max(0,m.cool-d);
  const pd=Math.hypot(P.x-m.x,P.y-m.y),hunt=!P.stay&&pd<Y.see*(hiddenAt(P.x,P.y)?.55:1)&&m.cool<=0;let tx=m.tx,ty=m.ty;
  if(hunt){tx=P.x;ty=P.y}
  else{m.t-=d;if(m.t<=0||Math.hypot(tx-m.x,ty-m.y)<4){m.t=4+Math.random()*5;const R=WORLD_SCALE.ai.mythicRoam;m.tx=tx=clamp(m.x+rint(-R[0],R[0]),24,MW*TILE-24);m.ty=ty=clamp(m.y+rint(-R[1],R[1]),24,MH*TILE-24)}}
  const dx=tx-m.x,dy=ty-m.y,dl=Math.hypot(dx,dy);
  if(dl>1){const sp=Math.min(dl,moveStep(Y.speed[hunt?1:0],d));if(Y.fly){m.x+=dx/dl*sp;m.y+=dy/dl*sp}else walk(m,dx,dy,sp);m.dir=dx>=0?1:-1}
  if(Y.ravage)for(const l of W.lords)if(!l.dead&&!l.inside&&!((l.dcool||0)>G.day)&&Math.hypot(l.x-m.x,l.y-m.y)<16){l.dcool=G.day+3;cull(l,Y.ravage);log('The '+M.n.toLowerCase()+' falls upon the army of '+l.name+'. '+(Y.ravage>=.5?'Half':'Many')+' are lost.','bad');if(l.troops.length<3)defeatLord(l)}
  if(pd<12&&m.cool<=0&&G.encCool<=0&&!G.modal){startMonster(m);return true}
  return false;
}
// slain: its hoard, and the wait for the next one
function mythicSlain(m,res){
  const M=MONSTERS[m.id],Y=M.mythic,H=Y.hoard||{};let txt='';
  W.mythic[m.id]={back:G.day+Y.back};res.fame=Y.fame;
  if(H.gold)res.gold+=H.gold;if(H.renown)P.renown+=H.renown;if(H.text)txt+=' '+H.text;
  if(H.gear){const g=randomGear(H.gear[0],H.gear[1]);if(!invAdd('gear',g,1))log('Your bag is full. You leave a '+ITEMS[g].n+' behind.','bad')}
  if(H.egg&&Math.random()<H.egg[1]&&invAdd('gear',H.egg[0],1))txt+=' Among the gold, an egg hatches: a <span style="color:'+RARITY[ITEMS[H.egg[0]].r]+'">'+ITEMS[H.egg[0]].n+'</span>.';
  log('The '+M.n.toLowerCase()+' is slain! Your name rings across Ashmark.','gold');
  return txt;
}
