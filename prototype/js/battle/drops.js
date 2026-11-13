'use strict';
/* ---------- what falls in a fight (the owner, 2026-11-09: "it drops something on the ground like just cool dot effects or small icons
   for exp and items"; doc/ACTION_DESIGN.md §0): each foe of yours that falls bursts into gold dots that fly to your hero (the
   experience a kill is worth, DROPS.xp, shown: the end of the fight pays it, as ever) and blue ones into the soldier of yours who
   struck it (his own experience for the kill, attacks.js earnXp, as ever); a man may leave coins and a piece of gear, a beast its hide,
   lying where it fell, bobbing and glinting; your hero or a companion who comes near draws them in (into your purse and bag:
   DROPS.loot), a line over them; the fight won, what is left on the ground is gathered for you, lost or fled, it is left. What the
   field gave (tally: its gold, gear and hides) is taken off the fight's own spoils at its end (resolution.js conclude, monsterLoot), so
   the whole is as it was, and listed in its report (fieldLine). Its state is its own, never on the battle or its men (BattleDrops.of:
   kept by the battle), so nothing it does moves a battle's numbers.
   Numbers: data/drops.js DROPS ---------- */
const DROP_OF=new WeakMap(),DROP_BY=new WeakMap();
class BattleDrops{
  constructor(){this.ground=[];this.orbs=[];this.done=new WeakSet();this.tally={gold:0,gear:0,mats:{},names:[]}}
  static of(b){if(!b)return null;let d=DROP_OF.get(b);if(!d)DROP_OF.set(b,d=new BattleDrops());return d}
  // (who struck the blow that felled t: attacks.js earnXp)
  static struck(t,u){if(t&&u)DROP_BY.set(t,u)}
  // each moment: a foe newly fallen bursts (not one who left the field alive, nor one not yet come onto it); the dots fly; what
  // lies near your hero or a companion is drawn in
  step(dt){
    const D=DROPS,k=worldEffectScale(),h=B.hero;
    for(const u of B.units){if(u.hp>0||u.team===0||u.left||u.waiting||this.done.has(u)||(h?!battleEnemy(h,u):false))continue;this.done.add(u);this.fall(u)}
    for(const o of this.orbs){o.t+=dt;if(o.t<o.wait){o.x+=o.vx*dt;o.y+=o.vy*dt;o.vx*=.92;o.vy=o.vy*.92+60*k*dt;continue}
      const to=o.to&&o.to.hp>0?o.to:null;if(!to){o.gone=true;if(o.item)this.ground.push(o.item);continue}
      const tx=to.x,ty=to.y-8*k,dx=tx-o.x,dy=ty-o.y,d=Math.hypot(dx,dy),v=D.speed*k*(1+2*(o.t-o.wait));
      if(d<=v*dt+2){o.gone=true;if(o.on)o.on();continue}o.x+=dx/d*v*dt;o.y+=dy/d*v*dt}
    this.orbs=this.orbs.filter(o=>!o.gone);
    const pick=B.units.filter(u=>u.team===0&&u.hp>0&&(u.hero||u.comp));
    // (one a full bag gave back waits till its taker steps away: skip)
    this.ground=this.ground.filter(g=>{const near=u=>Math.hypot(u.x-g.x,u.y-g.y)<D.pick*k;if(g.skip&&!near(g.skip))g.skip=null;const p=pick.find(u=>u!==g.skip&&near(u));if(!p)return true;
      this.orbs.push({x:g.x,y:g.y-4*k,vx:0,vy:-40*k,t:0,wait:.15,to:p,item:g,on:()=>this.take(g,p)});return false})}
  // (a foe fallen: its dots, and what it leaves on the ground)
  fall(u){
    const D=DROPS,k=worldEffectScale(),h=B.hero,by=DROP_BY.get(u);
    if(h&&h.hp>0)for(let i=0;i<D.dots.xp;i++)this.burst(u,h,D.col.xp,D.col.xpCore,i?null:()=>B.floats.push({x:h.x,y:h.y-28*k,t:'+'+D.xp+' XP',life:.9,c:D.col.xp}));
    if(by&&by.team===0&&!by.hero&&!by.comp&&by.hp>0)for(let i=0;i<D.dots.troop;i++)this.burst(u,by,D.col.troop,D.col.troopCore,null);
    const spot=()=>({x:u.x+(Math.random()-.5)*14*k,y:u.y+(Math.random()-.5)*8*k,ph:Math.random()*6.283}),M=Object.values(MONSTERS).find(m=>m.unit===u.type);
    // (a beast leaves its hide or nothing, never coins nor gear: a hunted animal (its meat and trophies the hunt's), a breed, an alpha
    // with no monster of its own type (they dropped a man's coins and gear, 2026-11-13))
    if(M||ST[u.type]?.beast||ST[u.type]?.wildlife){if(M&&M.mat&&Math.random()<D.beast)this.ground.push({k:'mat',id:M.mat,...spot()});return}
    if(Math.random()<D.coin.chance)this.ground.push({k:'gold',n:rint(D.coin.n[0],D.coin.n[1]),...spot()});
    if(Math.random()<D.gear&&(this.gears||0)<D.gears){this.gears=(this.gears||0)+1;this.ground.push({k:'gear',id:randomGear(0,gearTop()),...spot()})}}
  // (dots from u to whom they go: out in a burst, then home on him)
  burst(u,to,c,c2,on){const k=worldEffectScale(),a=Math.random()*6.283,v=(40+Math.random()*70)*k;
    this.orbs.push({x:u.x,y:u.y-6*k,vx:Math.cos(a)*v,vy:Math.sin(a)*v-50*k,t:0,wait:.3+Math.random()*.25,to,c,c2,on})}
  // (one drawn in: into your purse or bag (DROPS.loot), its line over whoever took it; a full bag leaves it on the ground)
  take(g,p){const k=worldEffectScale(),say=(t,c)=>B.floats.push({x:p.x,y:p.y-30*k,t,life:1,c});
    if(g.k==='gold'){this.gain(g);say('+'+g.n+' gold',DROPS.col.coin);return}
    if(DROPS.loot&&!invAdd(g.k,g.id,1)){say('Bag full','#e07a6a');this.ground.push({...g,x:p.x+8*k,y:p.y,skip:p});return}
    this.gain(g,true);say(g.k==='gear'?ITEMS[g.id].n:MATS[g.id].n,'#f0e6c8')}
  // (one taken: into your purse (or, an item, already in the bag: in), and the tally)
  gain(g,in_){const T=this.tally;if(g.k==='gold'){if(DROPS.loot)P.gold+=g.n;T.gold+=g.n;return}if(!in_&&DROPS.loot&&!invAdd(g.k,g.id,1))return;
    if(g.k==='gear')T.gear++;else T.mats[g.id]=(T.mats[g.id]||0)+1;T.names.push(g.k==='gear'?ITEMS[g.id].n:MATS[g.id].n)}
  // the fight over: won, the ground gathered for you (lost or fled, it stays)
  end(b){if(b.win)for(const g of this.ground.splice(0))this.gain(g)}
  // (its report's line: what the field gave, '' if nothing)
  fieldLine(){const T=this.tally,n={};for(const x of T.names)n[x]=(n[x]||0)+1;const L=[T.gold?T.gold+' gold':'',...Object.keys(n).map(x=>n[x]>1?n[x]+' × '+x:x)].filter(Boolean);
    return L.length?'<p class="fb-field-loot">From the field: '+htmlText(L.join(', '))+'.</p>':''}
  // drawn over the field: the ground's icons (a shadow, a glint by its worth, bobbing), then the dots and what flies
  draw(){const D=DROPS,t=performance.now()/1000;
    for(const g of this.ground){ctx.save();effectTransform(g.x,g.y);this.icon(g,g.x,g.y-4+Math.sin(t*2+g.ph)*D.bob[0],(Math.sin(t*6.283/D.bob[1]+g.ph)+1)/2,true);ctx.restore()}
    for(const o of this.orbs){ctx.save();effectTransform(o.x,o.y);if(o.item)this.icon(o.item,o.x,o.y,1,false);
      else{ctx.globalAlpha=.3;ctx.fillStyle=o.c;ctx.beginPath();ctx.arc(o.x,o.y,3.2,0,6.283);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle=o.c2;ctx.fillRect(Math.round(o.x)-1,Math.round(o.y)-1,2,2)}ctx.restore()}}
  icon(g,x,y,gl,shade){
    if(shade){ctx.fillStyle='rgba(0,0,0,.28)';ctx.beginPath();ctx.ellipse(x,y+7,4.5,1.6,0,0,6.283);ctx.fill()}
    if(g.k==='gold'){const C=DROPS.col;for(const [dx,dy] of [[-2,1],[2,1],[0,-1]].slice(0,Math.min(3,g.n))){ctx.fillStyle=C.coinEdge;ctx.beginPath();ctx.ellipse(x+dx,y+dy+.6,2.6,1.6,0,0,6.283);ctx.fill();ctx.fillStyle=C.coin;ctx.beginPath();ctx.ellipse(x+dx,y+dy,2.6,1.6,0,0,6.283);ctx.fill()}
      ctx.globalAlpha=gl*.9;ctx.fillStyle='#fffbe6';ctx.fillRect(Math.round(x+1),Math.round(y-2),1,1);ctx.globalAlpha=1;return}
    // (its picture: the inventory's illustration (ui/icons.js itemArtCanvas), drawn smooth at DROPS.art px; its pixel icon while that loads)
    const def=g.k==='gear'?ITEMS[g.id]:MATS[g.id],art=def&&typeof itemArtCanvas==='function'&&itemArtCanvas(def,DROPS.art*2),c=art||def&&itemIcon(def);
    ctx.globalAlpha=.18+.3*gl;ctx.fillStyle=g.k==='gear'?'#ffe08a':'#e8d8b0';ctx.beginPath();ctx.arc(x,y,7.5,0,6.283);ctx.fill();ctx.globalAlpha=1;
    if(art){const z=DROPS.art,sm=ctx.imageSmoothingEnabled;ctx.imageSmoothingEnabled=true;ctx.drawImage(art,x-z/2,y-z/2,z,z);ctx.imageSmoothingEnabled=sm}else if(c)ctx.drawImage(c,Math.round(x-6),Math.round(y-6),12,12)}
}
