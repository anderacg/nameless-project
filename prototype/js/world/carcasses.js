'use strict';
/* ---------- the fallen of a fight on the map (doc/OPEN_FIGHTS_DESIGN.md; the owner, 2026-11-14: "trophy required player to click at
   carcass to loot them", "if auto loot then we need a window to decide which to take and inspect"): every foe who fell in a fight
   on the map lies where he fell (Carcass.from: read off the field as it ends; lay: on the map once it is settled), and what the
   fight gave in things (its pile: ui/loot.js) lies on them, not in your bag: a beast's meat, hide and trophies on its own kind,
   gear and goods on the men (share). A click on one walks you there; met, the window (the spoils' own: ui/loot.js renderLoot) holds
   all on the fallen within CARCASS.near of it, beside your bag: look each over, take what you want, the rest stays on them (keep).
   They rot: CARCASS.days with anything on them, bare once picked clean (day), at most CARCASS.most on the map. A band near ones
   you cannot see picks them over (hour: its plunder, yours if you beat it, as the remains': world/death.js). Saved (their
   picture with them only till the game is closed: their fall as the fight drew it, corpse; after a load a plain one) ---------- */
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
      '<p>'+(beasts?'Meat to cut and trophies to take':'What they carried')+'. Look each over and take what you want; the rest stays here till it rots ('+CARCASS.days+' days).</p>',next:'carc-done',
      keep:pile=>{for(const c of here)c.items=[];for(const s of pile)if(s.n>0)self.items.push({k:s.k,id:s.id,n:s.n})}};
    renderLoot()}
  // (the window closed: what is left back on the fallen, and on to the map)
  static done(){const V=G.lootView;if(V?.keep)V.keep(G.loot?.pile||[]);lootEnd();hidePanel();toWorld()}
  // the foes fallen in a fight on the map, read off its field before it goes (resolution.js finish): each where his body lies
  static from(b){if(!CARCASS.on||!OPEN_FIGHT.on||!b?.world||!b.corpses)return null;const out=[];
    // (your foes' only: an ally's fallen hold nothing of yours)
    for(const c of b.corpses){const u=DEATH_OF.get(c);if(!u||u.hp>0||u.left||u.waiting||!battleEnemy(0,u))continue;const p=b.world.world(c),M=Object.keys(MONSTERS).find(k=>MONSTERS[k].unit===u.type);
      out.push({x:Math.round(p.x*10)/10,y:Math.round(p.y*10)/10,type:u.type,wild:u.wildlife||null,mon:M||null,bst:!!ST[u.type]?.beast,face:c.face||1,corpse:c})}
    return out}
  // laid on the map once the fight is settled: what its window would have held shared among them (share), the window told
  static lay(fell){if(!fell?.length)return;const cs=fell.map(f=>asCarcass({cc:1,...f,day:G.day+Clock.frac,items:[]})),L=G.loot,V=G.lootView;this.list.push(...cs);
    // (a quest item stays in the window, yours: never left to rot, core/items.js QuestItem)
    const on=L&&!L.capture&&V&&!V.keep?L.pile.filter(s=>!lootBound(s)):[];if(on.length){const n=on.reduce((a,s)=>a+s.n,0);for(const s of on)this.share(cs,s);L.pile=L.pile.filter(lootBound);
      V.head+='<p class="fb-carcass gold">'+n+' thing'+(n>1?'s':'')+' lie on the fallen: walk to them and click one to look them over.</p>';renderLoot()}
    this.prune()}
  // (a pile entry onto the fallen it belongs to: meat, furs and a beast's trophy on beasts (its own kind's first), gear and goods
  // on the men; else on any; split among them, a piece at a time)
  static share(cs,s){const mat=c=>c.mon?MONSTERS[c.mon]?.mat:c.wild?CRITTERS[c.wild]?.mat?.[0]:null,beasty=s.k==='good'&&['meat','furs'].includes(s.id)||s.k==='mat',
      pick=[s.k==='mat'&&cs.filter(c=>mat(c)===s.id),beasty&&cs.filter(c=>c.beast),!beasty&&cs.filter(c=>!c.beast),cs].find(l=>l&&l.length);
    this.turn=this.turn||0;for(let i=0;i<s.n;i++){const c=pick[this.turn++%pick.length],x=s.k!=='gear'&&c.items.find(q=>q.k===s.k&&q.id===s.id);if(x)x.n++;else c.items.push({k:s.k,id:s.id,n:1})}}
  // (rotted: CARCASS.days with anything on them, bare once picked clean; the oldest first past CARCASS.most)
  static prune(){const X=CARCASS,now=G.day+Clock.frac;this.list=this.list.filter(c=>now-c.day<(c.empty()?X.bare:X.days));if(this.list.length>X.most)this.list=this.list.slice(-X.most)}
  static day(){this.prune()}
  // each hour: a band near the fallen you cannot see takes all on them within CARCASS.near of one (its plunder: Remains.beaten)
  static hour(){const X=CARCASS;
    for(const c of this.list){if(c.empty()||!Death.unseenAt(c.x,c.y))continue;const b=bandits.find(o=>!o.dead&&!o.gone&&!fightHolds(o)&&Math.hypot(o.x-c.x,o.y-c.y)<X.seek);if(!b||Math.random()>=X.find)continue;
      const p=b.plunder||(b.plunder={gold:0,items:[],of:[]}),who=robberOf(b);for(const o of c.near()){for(const s of o.items)p.items.push([s.k,s.id,s.n]);o.items=[];o.robbed=who}if(!p.of.includes('the fallen of your fight'))p.of.push('the fallen of your fight')}}
  // drawn where it lies: its fall as the fight drew it (vfx.js drawBody, at the fight's scale), else a plain one; a glint while
  // anything is on it
  draw(ents,cam,V){if(!this.inView(V))return;const c=this;
    ents.push({y:c.y,f:()=>{const x=c.x-cam.x,y=c.y-cam.y,C=CARCASS.col,k=(B?.world?1:WORLD_BATTLE.sprite)/WORLD_BATTLE.scale;// (in a fight on the map drawBody makes it the fight's size itself)
      if(c.corpse?.sp){ctx.save();ctx.translate(x,y);ctx.scale(k,k);ctx.translate(-c.corpse.x,-c.corpse.y);try{drawBody(ctx,c.corpse,1,1)}finally{ctx.restore()}}
      else{const X=Math.round(x),Y=Math.round(y),f=c.face<0?-1:1;ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(X-5,Y,10,2);ctx.fillStyle=c.beast?C.hide:C.cloth;ctx.fillRect(X-4,Y-3,8,3);ctx.fillStyle=C.bone;ctx.fillRect(X+(f>0?3:-5),Y-3,2,2)}
      if(!c.empty()){const t=performance.now()/1000,g=(Math.sin(t*3+c.x)+1)/2;ctx.globalAlpha=.4+.5*g;ctx.fillStyle=C.glint;ctx.fillRect(Math.round(x)+1,Math.round(y)-5,1,1);ctx.globalAlpha=1}}})}
  static drawAll(ents,cam,V){for(const c of this.list)c.draw(ents,cam,V)}
  static save(){return this.list.length?this.list.map(c=>{const o={...c};delete o.corpse;return o}):undefined}// (its picture only what you see)
  static load(v){this.list=(v||[]).map(o=>asCarcass(o))}
}
const asCarcass=asClass(Carcass);
onAct('carc-',()=>Carcass.done());
Systems.add({name:'carcasses',order:{hour:168,day:235},hour:()=>Carcass.hour(),day:()=>Carcass.day()});
Saves.add({key:'carcasses',order:333,defaults:null,save:()=>Carcass.save(),load:v=>Carcass.load(v)});
onWorld(()=>{Carcass.list=[]});
