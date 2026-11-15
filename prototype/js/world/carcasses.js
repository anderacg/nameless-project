'use strict';
/* ---------- the fallen of a fight on the map (doc/OPEN_FIGHTS_DESIGN.md; the owner, 2026-11-14: "trophy required player to click at
   carcass to loot them", "if auto loot then we need a window to decide which to take and inspect"): every foe who fell in a fight
   on the map lies where he fell (Carcass.from: read off the field as it ends; lay: on the map once it is settled), and what the
   fight gave in things (its pile: ui/loot.js) lies on them, not in your bag: a beast's meat, hide and trophies on its own kind,
   gear and goods on the men (share). A click on one walks you there; met, the window (the spoils' own: ui/loot.js renderLoot) holds
   all on the fallen within CARCASS.near of it, beside your bag: look each over, take what you want, the rest stays on them (keep).
   They rot as every body does (BodyRot: fresh, rotting, bones, then gone), at most CARCASS.most on the map. A band near ones
   you cannot see picks them over (hour: its plunder, yours if you beat it, as the remains': world/death.js). Saved (their
   picture with them only till the game is closed: their fall as the fight drew it, corpse; after a load a plain one) ---------- */
/* ---------- how every body on the map rots (data/drops.js BODY_ROT; the owner, 2026-11-15: "after a while the corpse can start
   rotting and finally turns into bones. This should be the same for all dead bodies"): the fallen of a fight (Carcass) and your
   remains (world/death.js Remains, an unburied Grave) lie as they fell, then rot (tinted; flies, if any, are another sprite's to draw over), then lie as bones.
   Each one's picture made once into a canvas of its own (pic, never saved); the bones by kind and length (bonesOf) ---------- */
class BodyRot{
  static age(day){return G.day+Clock.frac-day}
  // (fresh, rot or bones by how long ago it fell (day: G.day + Clock.frac then); gone: past BODY_ROT.gone)
  static stage(day){const R=BODY_ROT,a=this.age(day);return !R.on||a<R.rot?'fresh':a<R.bones?'rot':'bones'}
  static gone(day){return BODY_ROT.on&&this.age(day)>=BODY_ROT.gone}
  static pics=new WeakMap();
  // (o's picture as it fell, paint(g) drawing it with its foot at g's origin, in a box of its own; that rotted; w: its length, px)
  static pic(o,paint){let p=this.pics.get(o);if(p)return p;const R=BODY_ROT,[W,H]=R.box,mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;return c},c=mk(),g=c.getContext('2d');
    g.translate(W>>1,R.foot);try{paint(g)}catch(e){}let [w]=artBox(c);
    if(!w){const C=R.col;g.setTransform(1,0,0,1,0,0);g.fillStyle=C.stain;g.fillRect((W>>1)-5,R.foot,10,2);g.fillStyle=C.cloth;g.fillRect((W>>1)-4,R.foot-3,8,3);w=10}// (no picture to be had: a plain shape)
    const r=mk(),q=r.getContext('2d');q.drawImage(c,0,0);q.globalCompositeOperation='source-atop';q.fillStyle=R.tint;q.fillRect(0,0,W,H);
    p={fresh:c,rot:r,w};this.pics.set(o,p);return p}
  // (one with no picture of its fall (after a load, or never seen to fall): its kind lying as the battle's fallen lie (sprites.js
  // corpseOf), at the map's scale; u: {type, team, v})
  static plain(g,u){const k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale,c=corpseOf({face:1,hero:false,...u});g.scale(k,k);
    if(c.beast){const s=c.down||c.beast;g.drawImage(s,-(s.width>>1),-s.height+2)}else g.drawImage(c.body,-c.ax,1-c.ay)}
  // (bones lying len px long, head to the right, on ground darkened under them: a man's (skull, ribs, limbs, a rag of his clothes)
  // or a beast's (a long skull, its spine arched with ribs, four legs, a scrap of hide); kept by kind, length and seed)
  static BONES=new Map();
  static bonesOf(beast,len,seed){const key=(beast?'b':'m')+len+':'+seed;let s=this.BONES.get(key);if(s)return s;const C=BODY_ROT.col,W=len+4,H=beast?Math.round(len*.3)+6:7,y0=H-2,
      c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d'),r=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h)))},h=k=>PX.hash(k,seed,41);
    r(2,y0+1,len-1,1,C.stain);
    if(beast){const sk=Math.max(3,Math.round(len*.22)),sp=len-sk,rib=Math.max(1,len*.1);r(3,y0,sp*.5,1,C.hide);r(2,y0-2,sp,1,C.bone);
      for(let i=Math.round(sp*.3);i<sp*.75;i+=2){const t=Math.round(1+Math.sin((i-sp*.3)/(sp*.45)*Math.PI)*rib);r(2+i,y0-2-t,1,t,C.bone2)}
      r(2+sp,y0-3,sk,2,C.bone);r(2+sp+sk-1,y0-1,1,1,C.bone2);r(2+sp+1,y0-3,1,1,C.dark);
      for(const f of [.1,.25,.75,.9])r(2+sp*f-1,y0-1+(h(f*10)<.5?0:1),Math.max(2,len*.14),1,C.bone2)}
    else{const L=len;r(2+L*.3,y0-1,L*.4,2,C.cloth);r(1+L-2,y0-3,2,2,C.bone);r(1+L-2,y0-3,1,1,C.dark);
      r(3,y0-1,L-5,1,C.bone2);for(let x=Math.round(L*.5);x<L-2;x+=2)r(1+x,y0-2,1,2,C.bone);r(1+L*.3,y0-2,2,1,C.bone);
      r(1,y0-1+(h(1)<.5?0:1),L*.3,1,C.bone);r(1,y0,L*.25,1,C.bone2);r(1+L*.55,y0+(h(2)<.5?0:-2),L*.25,1,C.bone2)}
    s={cv:c,ax:W>>1,ay:y0};this.BONES.set(key,s);return s}
  // o at screen (x, y), fallen on day, as its stage has it: its picture (paint), rotted, or its bones (beast: a
  // beast's; face: the way its head lies)
  static draw(o,x,y,day,paint,beast,face){const st=this.stage(day),R=BODY_ROT,p=this.pic(o,paint);x=Math.round(x);y=Math.round(y);
    if(st==='bones'){const b=this.bonesOf(beast,Math.max(7,Math.min(40,Math.round(p.w))),Math.abs(Math.round(o.x*3+o.y*7))%5);ctx.save();ctx.translate(x,y);if(face<0)ctx.scale(-1,1);ctx.drawImage(b.cv,-b.ax,-b.ay);ctx.restore();return}
    ctx.drawImage(st==='rot'?p.rot:p.fresh,x-(R.box[0]>>1),y-R.foot)}
}
class Carcass extends WorldObject{
  static list=[];
  get mapKind(){return 'carcass'}
  here(){return Carcass.list.includes(this)}
  empty(){return !this.items.length}
  inView(V){return spotted(this,V)}
  pick(at){at.add(this,CARCASS.pick,2)}
  get meetsAnyTime(){return true}
  get beast(){return !!(this.wild||this.mon||this.bst)}
  name(){return this.wild?CRITTERS[this.wild]?.n||'Beast':this.mon?MONSTERS[this.mon]?.n||'Beast':ST[this.type]?.n||'Foe'}
  label(){return (this.beast?'A '+this.name().toLowerCase()+'’s carcass':'A fallen '+this.name().toLowerCase())}
  what(){const n=this.items.reduce((a,s)=>a+s.n,0);return n?n+' thing'+(n>1?'s':'')+' on '+(this.beast?'it':'him'):'picked clean'+(this.robbed?' by '+this.robbed:'')}
  ago(){const d=Math.floor(G.day+Clock.frac-this.day);return d<1?'fell today':d===1?'fell yesterday':'fell '+d+' days ago'}
  tip(){return '<b>'+htmlText(this.label())+'</b><small>'+htmlText(cap1(this.ago()))+', '+this.what()+'</small>'+(this.empty()?'':'<span class="act">Click: go there and look</span>')}
  // (all with anything on them within CARCASS.near of it: what one click opens)
  near(){return Carcass.list.filter(c=>!c.empty()&&Math.hypot(c.x-this.x,c.y-this.y)<=CARCASS.near)}
  // met: the window of what lies on the fallen here, beside your bag (ui/loot.js), the rest left on this one
  meet(){const here=this.near();if(!here.length){toast(cap1(this.label())+': '+this.what()+'.');return}
    lootEnd();G.mode='dialog';G.loot={from:lootSnap(),pile:[],capture:false};for(const c of here)for(const s of c.items)lootPile(s.k,s.id,s.n);
    const kinds=[...new Set(here.map(c=>c.name().toLowerCase()))],n=here.length,beasts=here.every(c=>c.beast),self=this;
    G.lootView={head:'<div class="top"><h2>'+(n>1?'The fallen':beasts?'A carcass':'The fallen')+'</h2><span class="muted">'+htmlText(n>1?n+' here: '+kinds.join(', '):cap1(this.name().toLowerCase()))+', '+this.ago()+'</span></div>'+
      '<p>'+(beasts?'Meat to cut and trophies to take':'What they carried')+'. Look each over and take what you want; the rest stays on them till they are bones and gone ('+BODY_ROT.gone+' days).</p>',next:'carc-done',
      keep:pile=>{for(const c of here)c.items=[];for(const s of pile)if(s.n>0)self.items.push({k:s.k,id:s.id,n:s.n})}};
    renderLoot()}
  // (the window closed: what is left back on the fallen, and on to the map)
  static done(){const V=G.lootView;if(V?.keep)V.keep(G.loot?.pile||[]);lootEnd();hidePanel();toWorld()}
  // the foes fallen in a fight on the map, read off its field before it goes (resolution.js finish): each where his body lies
  static from(b){if(!CARCASS.on||!OPEN_FIGHT.on||!b?.world||!b.corpses)return null;const out=[];
    // (every one fallen, yours and your allies' too (the owner, 2026-11-15: "make every unit the same way"): ours, holding nothing of
    // yours (share puts the spoils on your foes))
    for(const c of b.corpses){const u=DEATH_OF.get(c);if(!u||u.hp>0||u.left||u.waiting||u.hero)continue;// (you: your remains, world/death.js)
const p=b.world.world(c),M=Object.keys(MONSTERS).find(k=>MONSTERS[k].unit===u.type);
      out.push({x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,type:u.type,wild:u.wildlife||null,mon:M||null,bst:!!ST[u.type]?.beast,face:c.face||1,corpse:c,...(battleEnemy(0,u)?{}:{ours:true})})}
    return out}
  // laid on the map once the fight is settled: what its window would have held shared among them (share), the window told
  static lay(fell){if(!fell?.length)return;const cs=fell.map(f=>asCarcass({cc:1,...f,day:G.day+Clock.frac,items:[]})),L=G.loot,V=G.lootView;this.list.push(...cs);
    // (a quest item stays in the window, yours: never left to rot, core/items.js QuestItem)
    const on=L&&!L.capture&&V&&!V.keep?L.pile.filter(s=>!lootBound(s)):[];if(on.length){const n=on.reduce((a,s)=>a+s.n,0);for(const s of on)this.share(cs,s);L.pile=L.pile.filter(lootBound);
      V.head+='<p class="fb-carcass gold">'+n+' thing'+(n>1?'s':'')+' lie on the fallen: walk to them and click one to look them over.</p>';renderLoot()}
    this.prune()}
  // (a pile entry onto the fallen it belongs to: meat, furs and a beast's trophy on beasts (its own kind's first), gear and goods
  // on the men; else on any; split among them, a piece at a time)
  static share(cs,s){const foes=cs.filter(c=>!c.ours);if(foes.length)cs=foes;const mat=c=>c.mon?MONSTERS[c.mon]?.mat:c.wild?CRITTERS[c.wild]?.mat?.[0]:null,beasty=s.k==='good'&&['meat','furs'].includes(s.id)||s.k==='mat',
      pick=[s.k==='mat'&&cs.filter(c=>mat(c)===s.id),beasty&&cs.filter(c=>c.beast),!beasty&&cs.filter(c=>!c.beast),cs].find(l=>l&&l.length);
    this.turn=this.turn||0;for(let i=0;i<s.n;i++){const c=pick[this.turn++%pick.length],x=s.k!=='gear'&&c.items.find(q=>q.k===s.k&&q.id===s.id);if(x)x.n++;else c.items.push({k:s.k,id:s.id,n:1})}}
  // (gone once their bones have lain their time (BodyRot); the oldest first past CARCASS.most)
  static prune(){const X=CARCASS;this.list=this.list.filter(c=>!BodyRot.gone(c.day));if(this.list.length>X.most)this.list=this.list.slice(-X.most)}
  static day(){this.prune()}
  // each hour: a band near the fallen with something on them sets out for them (b.corpse: BandBrain walks it there, seek), seen or
  // not; fresh ones may draw looters out of the wilds (looters); then the clearers (clear)
  static hour(){const X=CARCASS,L=X.loot,now=G.day+Clock.frac,sought=bandits.filter(o=>o.corpse&&!o.dead&&!o.gone);
    for(const c of this.list){if(c.empty()||sought.some(o=>Math.hypot(o.corpse.x-c.x,o.corpse.y-c.y)<X.near))continue;
      let b=bandits.find(o=>!o.dead&&!o.gone&&!o.inside&&!fightHolds(o)&&!o.corpse&&!o.qid&&!o.wave&&Math.hypot(o.x-c.x,o.y-c.y)<X.seek);
      if(!b&&now-c.day<L.fresh&&Math.random()<L.spawn)b=this.looters(c);if(!b||Math.random()>=X.find)continue;b.corpse={x:c.x,y:c.y,wait:L.check};sought.push(b)}
    this.clear(now)}
  // (a band of looters out of the wilds for the fallen at c: L.from px off, out of your sight, on open ground; none past L.most)
  static looters(c){const L=CARCASS.loot;if(bandits.filter(o=>o.looters&&!o.dead&&!o.gone).length>=L.most)return null;
    for(let k=0;k<8;k++){const a=Math.random()*6.283,r=L.from[0]+Math.random()*(L.from[1]-L.from[0]),x=c.x+Math.cos(a)*r,y=c.y+Math.sin(a)*r;
      if(x<16||y<16||x>MW*TILE-16||y>MH*TILE-16||!passable(terrAt(x,y))||!Death.unseenAt(x,y))continue;const kind=ST[L.kind]?L.kind:'militia',n=L.n[0]+Math.floor(Math.random()*(L.n[1]-L.n[0]+1));
      const b=asParty({kind:'bandits',troops:Array(n).fill(kind),x,y,cool:0});b.looters=true;bandits.push(b);return b}
    return null}
  // (a band at the fallen it set out for (BandBrain): there, it stands searching them L.check s, then takes all on them within
  //  CARCASS.near (its plunder, yours if you beat it: Remains.beaten); true while it is about it)
  static seek(b,d){const q=b.corpse;if(!q)return false;const dx=q.x-b.x,dy=q.y-b.y,dd=Math.hypot(dx,dy);
    if(dd>CARCASS.loot.at){const s=moveStep(partySpeed(b,b.troops),d);if(dd<2*CARCASS.loot.at||!Router.travel(b,q,s))walk(b,dx,dy,Math.min(dd,s));b.idle=false;return true}// (the last of the way straight: the router's cells stop short; at L.at its men stand round them, its middle off them)
    b.idle=true;q.wait-=d;if(q.wait>0)return true;b.corpse=null;
    const c=this.list.find(o=>Math.hypot(o.x-q.x,o.y-q.y)<1);if(c){const p=b.plunder||(b.plunder={gold:0,items:[],of:[]}),who=robberOf(b);let n=0;
      for(const o of c.near()){for(const s of o.items){p.items.push([s.k,s.id,s.n]);n+=s.n}o.items=[];o.robbed=who}if(n&&!p.of.includes('the fallen of your fight'))p.of.push('the fallen of your fight')}
    return true}
  // (the clearers: each of the fallen past its time (C.bare picked clean, C.after any) with a holding's gate within C.reach: out of
  //  your sight gone at once; in it, one of its folk walks out to it (Carcass.diggers), digs, and walks home)
  static clear(now){const C=CARCASS.clear;
    for(const c of this.list.slice()){if(c.digger)continue;const age=now-c.day;if(age<(c.empty()?C.bare:C.after))continue;
      let t=null,best=C.reach;for(const h of TOWNS){if(ruined(h)||besieged(h))continue;const g=gateGoal(h),d=Math.hypot(g.x-c.x,g.y-c.y);if(d<best){best=d;t=h}}if(!t)continue;
      if(Death.unseenAt(c.x,c.y)){this.list=this.list.filter(o=>o!==c);continue}
      if(this.diggers.length>=C.most)continue;const g=gateGoal(t);c.digger=true;this.diggers.push({c,home:t.name,x:g.x,y:g.y,st:'out',t:0,id:t.name+'|dig|'+Math.round(c.x),job:'farmer',dir:c.x>=g.x?1:-1,walk:0})}}
  static diggers=[];
  // (each clearer's moment: out to the fallen, digging there C.dig s, the fallen gone, home to the gate and in)
  static dig(d){const C=CARCASS.clear,s=footStep(C.gait,d);
    for(const f of this.diggers){const to=f.st==='back'?gateGoal(townBy(f.home)||{x:f.x,y:f.y-12}):f.c;if(f.st==='dig'){f.t-=d;if(f.t<=0){this.list=this.list.filter(o=>o!==f.c);f.st='back'}continue}
      const dx=to.x-f.x,dy=to.y-f.y,dd=Math.hypot(dx,dy);if(dd<2){if(f.st==='out'){f.st='dig';f.t=C.dig}else f.gone=true;continue}
      const k=Math.min(dd,s);f.x+=dx/dd*k;f.y+=dy/dd*k;f.walk+=k;if(Math.abs(dx)>.01)f.dir=dx>0?1:-1;if(f.st==='out'&&!this.list.includes(f.c))f.st='back'}
    this.diggers=this.diggers.filter(f=>!f.gone)}
  // drawn where it lies, as it has rotted (BodyRot): its fall as the fight drew it (vfx.js drawBody, at the map's scale), else its
  // kind lying; a glow while anything is on it
  paint(g){const c=this,k=(B?.world?1:WORLD_BATTLE.sprite)/WORLD_BATTLE.scale;// (in a fight on the map drawBody makes it the fight's size itself)
    if(c.corpse?.sp){g.scale(k,k);g.translate(-c.corpse.x,-c.corpse.y);drawBody(g,c.corpse,1,1)}else BodyRot.plain(g,{type:c.wild?wildTroop(c.wild):c.type,team:c.ours?0:1,v:Math.abs(Math.round(c.x+c.y))%6})}
  draw(ents,cam,V){if(!this.inView(V))return;const c=this;
    ents.push({x:c.x,y:c.y,f:()=>{const x=c.x-cam.x,y=c.y-cam.y;BodyRot.draw(c,x,y,c.day,g=>c.paint(g),c.beast,c.face);
      if(!c.empty())lootGlow(x,y-2,LOOT_GLOW.r*(B?.world?WORLD_BATTLE.sprite/2:1),performance.now()/1000,c.x*.13+c.y*.07)}})}// (something on it: its glow, battle/drops.js)
  static drawAll(ents,cam,V){for(const c of this.list)c.draw(ents,cam,V);
    // (the clearers: their holding's folk (folk.js workerAppearance), walking, or at the fallen swinging their tools)
    const S=yourSight(V),k=WORLD_BATTLE.sprite/WORLD_BATTLE.scale;for(const f of this.diggers){if(!S.sees(f.x,f.y))continue;
      ents.push({x:f.x,y:f.y,f:()=>dressedIn(dressClimAt(f.x,f.y),()=>{const L=workerAppearance(f),pose=f.st==='dig'?6+Math.floor(performance.now()/260)%3:2+footFrame(f.walk),sp=unitSprite(L.type,0,false,L.v,pose,false,false,L.tint);
        ctx.save();ctx.translate(Math.round(f.x-cam.x),Math.round(f.y-cam.y));ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(-2,-1,5,2);ctx.scale(f.dir<0?-k:k,k);ctx.drawImage(sp,-(sp.width>>1),-sp.height+2);ctx.restore()})})}}
  static save(){return this.list.length?this.list.map(c=>{const o={...c};delete o.corpse;delete o.digger;return o}):undefined}// (its picture only what you see)
  static load(v){this.list=(v||[]).map(o=>asCarcass(o))}
}
const asCarcass=asClass(Carcass);
onAct('carc-',()=>Carcass.done());
Systems.add({name:'carcasses',order:{hour:168,day:235,frame:142},hour:()=>Carcass.hour(),day:()=>Carcass.day(),frame:d=>Carcass.dig(d)});
Saves.add({key:'carcasses',order:333,defaults:null,save:()=>Carcass.save(),load:v=>Carcass.load(v)});
onWorld(()=>{Carcass.list=[];Carcass.diggers=[]});
