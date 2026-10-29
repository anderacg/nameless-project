'use strict';
/* ---------- morale presentation (moved out of battle/morale.js; loaded right after it): the badges and glyphs, their SVG for
   the unit cards and details, the icons over each group on the field (where they stand, and picking them) and the
   marks over a wavering or running soldier. It only reads grpMorale (morale.js) and the soldiers' morale mirrors; it decides nothing ---------- */
/* the look, as in Total War: over each group a small icon in its side's colour showing what it is (sword, spear, axe, hammer,
   bow, crossbow, javelin, staff, horse, a beast's paw, your hero's crown) and a thin health bar under it; beside it a round badge
   for each status: a green confidence arrow, or wavering, routing, shattered (its morale), flanked,
   outnumbered, charged, its leader fallen, its side losing, tired (what weakens it). Drawn on the field and as SVG on the unit
   cards and in the details. Its colour is its side's (battle.js SIDE): yours blue, your allies' green, theirs red; with an AI
   badge while the AI has it (A: deploy.js aiHas). */
const BADGE=['..xxxxx..','.xooooox.','xooooooox','xooooooox','xooooooox','xooooooox','xooooooox','.xooooox.','..xxxxx..'];
const GLYPH={
  breaking:['g...g','.g.g.','..g..','.....','..g..'],
  rallying:['..g..','.ggg.','g.g.g','..g..','.ggg.'],
  missile:['g.g.g','.g.g.','..g..','.g.g.','g.g.g'],
  confident:['..g..','.ggg.','g.g.g','..g..','..g..'],
  wavering:['..g..','..g..','..g..','.....','..g..'],
  routing:['gggg.','ggggg','gggg.','g....','g....'],
  shattered:['g...g','.g.g.','..g..','.g.g.','g...g'],
  flanked:['g....','.g...','..g.g','...gg','..ggg'],
  outnumbered:['g...g','.....','g.g.g','.....','g...g'],
  outmatched:['g...g','gg.gg','.....','.g.g.','..g..'],
  recentloss:['ggggg','.g.g.','..g..','.g.g.','ggggg'],
  charged:['...gg','..gg.','.ggg.','.gg..','gg...'],
  surprised:['g.g.g','.....','..g..','..g..','..g..'],
  leader:['g.g.g','ggggg','ggggg','.....','.....'],
  losing:['..g..','..g..','g.g.g','.ggg.','..g..'],
  tired:['gggg.','..g..','.g...','gggg.','.....'],
  standfast:['ggggg','g.g.g','ggggg','.ggg.','..g..'],
  // the unit cards' other statuses (battlehud.js cardStatus): its order, pace, an ability on, its flags, shots, sight
  move:['..g..','...g.','ggggg','...g.','..g..'],
  attack:['g...g','.g.g.','..g..','.g.g.','gg.gg'],
  charge:['..g..','.g.g.','g.g.g','.g.g.','g...g'],
  advance:['.....','..g..','.ggg.','gg.gg','g...g'],
  withdraw:['..g..','.g...','ggggg','.g...','..g..'],
  walk:['.g...','..g..','...g.','..g..','.g...'],
  run:['g.g..','.g.g.','..g.g','.g.g.','g.g..'],
  brace:['....g','...g.','..g..','.g...','ggggg'],
  spur:['g.g.g','.ggg.','gg.gg','.ggg.','g.g.g'],
  fire:['..g..','.gg..','.ggg.','ggggg','.ggg.'],
  rally:['ggggg','.ggg.','.ggg.','.ggg.','.g.g.'],
  scout:['g...g','.ggg.','gg.gg','.ggg.','g...g'],
  noammo:['g...g','g...g','g...g','g...g','ggggg'],
  ammo:['..g..','.ggg.','g.g.g','g.g.g','ggggg'],
  shieldWall:['gg.gg','gg.gg','gg.gg','gg.gg','.g.g.'],
  firm:['..g..','ggggg','..g..','g.g.g','.ggg.'],
  cease:['.ggg.','g..gg','g.g.g','gg..g','.ggg.'],
  skirmish:['...g.','ggggg','.....','ggggg','.g...'],
  melee:['..g..','..g..','..g..','.ggg.','..g..'],
  fallback:['.g...','gggg.','.g..g','....g','..gg.'],
  hidden:['.....','g...g','.ggg.','g.g.g','.....'],
  seen:['.....','.ggg.','g.g.g','.ggg.','.....'],
  woods:['.ggg.','ggggg','ggggg','.ggg.','..g..'],
  // (the AI in command of the group: A, deploy.js; on its card and its icon; amove: an attack-move under way, commands.js)
  ai:['.g..g','g.g.g','ggg.g','g.g.g','g.g.g'],
  amove:['g...g','.g.g.','..g..','.g.gg','g..gg']
};
GLYPH.spent=GLYPH.tired;// (spent: tired's mark, rimmed red)
// each badge's rim: morale in its own colours, weaknesses in red (a charge in gold)
const BADGE_RIM={breaking:'#ff8040',rallying:'#9fe09a',missile:'#e8a75a',confident:'#70dfb0',outmatched:'#d8b35a',recentloss:'#e8a75a',wavering:'#ffa040',routing:'#f2efe6',shattered:'#8a8f98',flanked:'#e0605a',outnumbered:'#e0605a',charged:'#ffd25a',surprised:'#e0605a',leader:'#e0605a',losing:'#e0605a'};
/* the cards' other badges, rimmed by their kind (BADGE_KIND): an order warm gold, the pace pale grey, an ability on green
   (Stand Fast! too), a warning amber (few shots, tired, falling back), something bad red (no shots, spent), a flag steel blue,
   sight teal; morale and weaknesses keep their own rims above */
const BADGE_CAT={order:'#e0b050',pace:'#c8ccd4',ability:'#6cd06c',warning:'#e8a040',bad:'#e0605a',flag:'#8ca4c0',sight:'#4cc0a8',ai:'#b48cf0'};
const BADGE_KIND={ai:'ai',amove:'order',move:'order',attack:'order',charge:'order',advance:'order',withdraw:'order',walk:'pace',run:'pace',brace:'ability',spur:'ability',fire:'ability',rally:'ability',scout:'ability',standfast:'ability',
  ammo:'warning',tired:'warning',fallback:'warning',noammo:'bad',spent:'bad',shieldWall:'flag',firm:'flag',cease:'flag',skirmish:'flag',melee:'flag',hidden:'sight',seen:'sight',woods:'sight'};
for(const k in BADGE_KIND)BADGE_RIM[k]=BADGE_CAT[BADGE_KIND[k]];
const CONFIDENCE_LABEL='Confident: visible, distance-weighted fighting strength advantage. Up to +'+CONFIDENCE.max+' morale and '+Math.round(CONFIDENCE.resist*100)+'% less ordinary morale shock. Panic and leader loss can suppress it.';
const MORALE_STATE={steady:{c:'#78c474',n:'Steady'},shaken:{c:'#e8d04a',n:'Shaken'},wavering:{c:'#ffa040',n:'Wavering'},breaking:{c:'#ff8040',n:'Breaking'},rallying:{c:'#9fe09a',n:'Rallying'},routing:{c:'#f2efe6',n:'Routing'},shattered:{c:'#8a8f98',n:'Shattered'}};
const WEAK_N={surprised:'Surprised: caught off guard by an ambush; slow to answer orders, no time to brace',missile:'Unanswered missile fire: recent ranged damage without enough successful retaliation',tired:'Tired: slower and weaker; standing still restores them',flanked:'Flanked: hit from the side or behind',outmatched:'Outmatched: stronger visible opposition in the wider area',recentloss:'Recent losses: temporary pressure that fades; some morale loss remains',outnumbered:'Locally overwhelmed: close fighting strength or substantial threats on opposite sides',charged:'Charged: hit by a charge',leader:'Leader fallen',losing:'Army depleted: fewer than half as many active troops overall (informational, not a direct morale penalty)'};
// a state's badge (only when its morale is failing: steady and shaken show none)
const stateIcon=st=>['wavering','breaking','routing','rallying','shattered'].includes(st)?st:null;
// a badge's pixels: [x, y, colour] (9×9: its rim, a dark inside, its 5×5 glyph in white; rim: another colour than its own)
function badgePx(k,rim){rim=rim||BADGE_RIM[k]||'#e4e0cf';const G=GLYPH[k],out=[];BADGE.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.')return;const gy=y-2,gx=x-2,g=G&&G[gy]&&G[gy][gx]==='g';out.push([x,y,ch==='x'?rim:g?'#ffffff':'#141822'])}));return out}
// every badge as SVG: the unit cards' statuses, the details, the wiki
function badgeSVG(k,size,rim){if(!k)return '';size=size||14;const confident=k==='confident';return '<svg class="mico" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges"'+(confident?' data-status="confident" role="img" aria-label="'+CONFIDENCE_LABEL+'"':' aria-hidden="true"')+'>'+(confident?'<title>'+CONFIDENCE_LABEL+'</title>':'')+badgePx(k,rim).map(([x,y,c])=>'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>').join('')+'</svg>'}
// a group's badges: its failing morale, then what weakens it
const statusOf=mo=>[stateIcon(mo.state),mo.confident?'confident':null,mo.stand?'standfast':null,...mo.weak].filter(Boolean);// (standfast: Stand Fast!, commandpowers.js)
// the unit types' glyphs on the icons (9×9)
const UNIT_GLYPH={
  sword:['.......gg','......ggg','.....ggg.','....ggg..','.g.ggg...','..ggg....','..gg.....','.g..g....','g........'],
  spear:['....g....','...ggg...','..ggggg..','...ggg...','....g....','....g....','....g....','....g....','....g....'],
  axe:['..g..g...','.gg.ggg..','gggggg...','gggggg...','gggggg...','.gg..g...','..g..g...','.....g...','.....g...'],
  hammer:['ggggggg..','ggggggg..','ggggggg..','...g.....','...g.....','...g.....','...g.....','...g.....','..ggg....'],
  bow:['.gg......','g..g.....','g...g....','g....g...','ggggggggg','g....g...','g...g....','g..g.....','.gg......'],
  xbow:['....g....','.ggggggg.','g...g...g','....g....','....g....','....g....','...ggg...','...ggg...','.........'],
  javelin:['......g.g','.....g.g.','....g.g..','...g.g...','..g.g....','.g.g.....','g.g......','.g.......','.........'],
  staff:['...ggg...','..g...g..','..g.g.g..','..g...g..','...ggg...','....g....','....g....','....g....','....g....'],
  horse:['....g.g..','...ggggg.','..gggggg.','.ggggggg.','gggg.ggg.','ggg..ggg.','.....ggg.','.....gggg','.....gggg'],
  beast:['..g...g..','g.g...g.g','g.......g','...ggg...','..ggggg..','.ggggggg.','.ggggggg.','..gg.gg..','.........'],
  hero:['.........','g...g...g','gg.ggg.gg','ggggggggg','ggggggggg','ggggggggg','.........','.........','.........']
};
// what a group is, by its most common soldier: its weapon (people.js) or what it is (a beast, a rider, a caster)
function unitIcon(g,m){
  if(g==='hero')return 'hero';const rep=repOf(m),s=ST[rep]||m[0].s;if(s.beast||s.big)return 'beast';
  const L=PEOPLE_LOOK[rep]||PEOPLE_LOOK[s.look]||{},w=L.weapon;if(L.mount)return 'horse';if(s.magic||w==='staff')return 'staff';
  if(w==='xbow')return 'xbow';if(s.range)return w==='javelin'?'javelin':'bow';
  return {sword:'sword',great:'sword',axe:'axe',bigaxe:'axe',hammer:'hammer',spear:'spear',pike:'spear',lance:'spear'}[w]||(unitClass(s)==='spear'?'spear':'sword')}
// the icons under a point of the field (screen-sized, so tested on the screen), the topmost first (team: one side's only)
function iconsAt(x,y,team){if(!B.icons)return [];const p=fromField({x,y}),out=[];for(let i=B.icons.length-1;i>=0;i--){const r=B.icons[i];if((team==null||(team===1?battleEnemy(0,r):r.team===team))&&p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h)out.push(r)}return out}
// the topmost icon under a point, for pointing and orders: the icon stands for its group
const iconAt=(x,y,team)=>iconsAt(x,y,team)[0]||null;
// a click (select): the topmost; clicked again on the same spot (ICON_FAN.again screen px), the next one under it, and round
// again (B.iconCyc: the stack as it was at the first click, so a group lifted on top by being selected does not trap it)
function iconPick(x,y,team){
  const st=iconsAt(x,y,team);if(st.length<2){B.iconCyc=null;return st[0]||null}
  const p=fromField({x,y}),key=st.map(r=>r.g).sort().join(),C=B.iconCyc;
  if(C&&C.key===key&&Math.hypot(C.x-p.x,C.y-p.y)<=ICON_FAN.again)C.i=(C.i+1)%C.order.length;else B.iconCyc={key,x:p.x,y:p.y,order:st.map(r=>r.g),i:0};
  const c=B.iconCyc;return st.find(r=>r.g===c.order[c.i])||st[0]}
// the icons over each group on the field (yours and theirs), drawn on the screen (not the zoomed field) so they keep their size
const UICON={s:13,lift:22,k:2,crowd:2};// (its art in pixels, drawn k times over; crowd: the badges a banner keeps in a press: iconLayout)
const unitIconScale=()=>B?.world?UICON.k*dprOf()/VS:UICON.k;
/* where they stand (iconLayout; B.icons, for clicks, in the order drawn): each over its own group, its place on the field eased
   after its men on the battle's clock (follow: a man falling or running moves it with no jump; snap: field px past which it is
   simply put there, as when a group comes back into sight; deploying, the clock stands still and groups are placed at once, so
   each is simply put over its own). Preparation also follows actual soldiers directly while the combat clock is frozen. They may overlap: drawn the selected on top, then the one pointed
   at, then yours over theirs, the nearer (lower) over the farther; one under another faded a little (under). Only where banners
   overlap and their groups are at blows with each other (a man of one set on a man of the other within contact field px) are
   they fanned out side by side, gap px apart (badges and all), so each can be seen and clicked; eased in and out over about ease real seconds. Less motion
   (vfx.js reducedMotion): no easing, each simply put */
const ICON_FAN={contact:30,gap:2,ease:.25,follow:15,snap:120,under:.7,again:6};
const atBlows=(a,b)=>a.m.some(u=>{const t=u.tgt;return !u.rout&&t&&t.hp>0&&t.grp===b.g&&Math.hypot(t.x-u.x,t.y-u.y)<ICON_FAN.contact});
// rt: real seconds since the last (the fan's easing); returns the icons as drawn, bottom first
function iconLayout(rt){
  const K=unitIconScale(),S=UICON.s,z=B.cam?B.cam.z:1,rm=reducedMotion(),IP=B.iconPos||(B.iconPos={}),dt=Math.max(0,B.t-(B.iconT??B.t)),sel=selGroups(),items=[];B.iconT=B.t;
  // (an enemy group your side does not see has no icon; one partly seen, over those seen: terrain.js seenBy)
  for(const g in B.groups){const m=B.units.filter(u=>u.grp===g&&u.hp>0&&seenBy(0,u));if(!m.length){delete IP[g];continue}const mo=B.noMorale?null:grpMorale(m);
    const f=m.filter(u=>!u.rout),at=f.length?f:m,cx=at.reduce((a,u)=>a+u.x,0)/at.length,cy=at.reduce((a,u)=>a+u.y,0)/at.length,top=Math.min(...at.map(u=>u.y));
    let p=IP[g];if(!p||rm||B.deploy||B.muster&&(B.muster.active||B.ready)||Math.hypot(p.x-cx,p.y-top)>ICON_FAN.snap)p=IP[g]={x:cx,y:top,dx:p?p.dx:0};else{const k=1-Math.exp(-dt*ICON_FAN.follow);p.x+=(cx-p.x)*k;p.y+=(top-p.y)*k}
    const st=[...(aiHas(B.groups[g])?['ai']:[]),...(mo?statusOf(mo):[])],W=(S+(st.length?Math.ceil(st.length/2)*10+1:0))*K,H=(S+6)*K,sp=fromField({x:p.x,y:p.y});
    if(sp.x<-W||sp.x>BVW+W||sp.y<0||sp.y>BVH+40)continue;// (off the view: none)
    items.push({g,m,mo,st,W,H,cx,cy,p,team:m[0].team,bx:sp.x-S*K/2,y:Math.max(4,sp.y-UICON.lift*z*(B.world?WORLD_BATTLE.sprite:1)-H),tier:sel.includes(g)?3:B.iconHov===g?2:m[0].team?0:1})}
  const hit=(a,b)=>a.bx<b.bx+b.W&&b.bx<a.bx+a.W&&a.y<b.y+b.H&&b.y<a.y+a.H,up=items.map((_,i)=>i),root=i=>up[i]===i?i:(up[i]=root(up[i]));
  // (a crowd: a banner whose badges reach over another's keeps its first UICON.crowd, one column, so a press of them stays legible)
  for(const a of items)if(a.st.length>UICON.crowd&&items.some(b=>b!==a&&hit(a,b))){a.st=a.st.slice(0,UICON.crowd);a.W=(S+Math.ceil(a.st.length/2)*10+1)*K}
  // the fan: banners that overlap where they stand, of groups at blows with each other, in clusters; each cluster set side by
  // apart, left to right as they stand, about the middle they had
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],b=items[j];if(a.team!==b.team&&hit(a,b)&&(atBlows(a,b)||atBlows(b,a)))up[root(i)]=root(j)}
  const fan=new Map();
  for(const i of new Set(items.map((_,i)=>root(i)))){const c=items.filter((_,j)=>root(j)===i).sort((a,b)=>a.bx-b.bx||(a.g<b.g?-1:1));if(c.length<2)continue;
    const t=[];c.forEach((o,j)=>t.push(j?Math.max(o.bx,t[j-1]+c[j-1].W+ICON_FAN.gap):o.bx));const sh=(c.reduce((a,o)=>a+o.bx,0)-t.reduce((a,x)=>a+x,0))/c.length;c.forEach((o,j)=>fan.set(o.g,t[j]+sh-o.bx))}
  const k=rm?1:1-Math.exp(-Math.max(0,rt)*3/ICON_FAN.ease);// (about 95% of the way in ease s)
  for(const it of items){const p=it.p,to=fan.get(it.g)||0;p.dx=(p.dx||0)+(to-(p.dx||0))*k;if(Math.abs(to-p.dx)<.05)p.dx=to;it.x=Math.round(it.bx+p.dx);it.y=Math.round(it.y)}
  items.sort((a,b)=>a.tier-b.tier||a.y-b.y||(a.g<b.g?-1:1));
  B.icons=items.map(it=>({g:it.g,x:it.x,y:it.y,w:S*K,h:it.H,bw:it.W,team:it.team,cx:it.cx,cy:it.cy}));// (w: the plate, what is clicked; bw: with its badges)
  items.forEach((it,i)=>{it.under=items.some((o,j)=>j>i&&it.x<o.x+o.W&&o.x<it.x+it.W&&it.y<o.y+o.H&&o.y<it.y+it.H);B.icons[i].under=it.under});
  return items;
}
function drawUnitIcons(){
  const sel=selGroups(),blink=Math.floor(B.t*3)%2,K=unitIconScale(),S=UICON.s,now=performance.now()/1000,rt=B.iconRT?Math.min(.25,now-B.iconRT):0;B.iconRT=now;
  for(const it of iconLayout(rt)){const {g,m,mo,st,x,y}=it;
    const team=SIDE[sideKey(B.groups[g])].plate,wav=mo&&mo.state==='wavering'&&blink;
    const hov=B.iconHov===g,edge=sel.includes(g)?'#ffd25a':wav?'#ffa040':hov?'#f4efe0':'#0a0c12',fade=it.under?ICON_FAN.under:1;
    ctx.save();ctx.translate(x,y);ctx.scale(K,K);ctx.globalAlpha=(mo&&(mo.state==='routing'||mo.state==='shattered')?.6:1)*fade;
    // the plate: an edge (gold when selected), its side's colour, lighter at the top and darker at the foot, a notch pointing down
    ctx.fillStyle=edge;ctx.fillRect(1,0,S-2,S);ctx.fillRect(0,1,S,S-2);ctx.fillRect(S/2-1.5|0,S,3,1);
    ctx.fillStyle=team[0];ctx.fillRect(1,1,S-2,S-2);ctx.fillStyle=team[1];ctx.fillRect(2,1,S-4,1);ctx.fillStyle=team[2];ctx.fillRect(1,S-3,S-2,2);
    // its type, in white with a dark shadow
    const gl=UNIT_GLYPH[unitIcon(g,m)];
    for(const [col,dx] of [['rgba(0,0,0,.45)',1],['#f4efe0',0]]){ctx.fillStyle=col;gl.forEach((row,ry)=>[...row].forEach((c,rx)=>{if(c==='g')ctx.fillRect(2+rx+dx,2+ry+dx,1,1)}))}
    ctx.globalAlpha=fade;
    // its health, under it
    const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),hy=S+2;
    ctx.fillStyle='#0a0c12';ctx.fillRect(0,hy,S,3);ctx.fillStyle=hp>.6?'#78c474':hp>.3?'#e8d04a':'#e0605a';ctx.fillRect(1,hy+1,Math.max(1,Math.round((S-2)*hp)),1);
    // what is wrong with it, beside it (two to a column)
    st.forEach((k,i)=>{const bx=S+2+Math.floor(i/2)*10,by=(i%2)*10;for(const [px,py,c] of badgePx(k)){ctx.fillStyle=c;ctx.fillRect(bx+px,by+py,1,1)}});
    ctx.restore()}
}
/* the fog's ghosts (battlefog.js fogGhosts): where an enemy group was last seen, its icon greyed, fading over FOG.ghost s, a
   faint dashed ring on the ground under it; drawn on the screen as the icons, but no icon of B.icons (nothing to click) */
function drawFogGhosts(){
  const Gs=B.fog&&B.sight&&B.sight.ghost;if(!Gs||!Gs.size)return;const K=unitIconScale(),S=UICON.s,z=B.cam?B.cam.z:1;
  for(const [g,q] of Gs){const m=grpUnits(g),a=ghostFade(q);if(!m.length||a<=0)continue;const p=fromField({x:q.x,y:q.y}),x=Math.round(p.x-S*K/2),y=Math.round(p.y-UICON.lift*z-(S+6)*K);
    if(p.x<-40||p.x>BVW+40||p.y<0||p.y>BVH+60)continue;
    ctx.save();ctx.globalAlpha=.75*a;ctx.strokeStyle='#b8bcc4';ctx.setLineDash([3,3]);ctx.lineWidth=1;const rr=Math.max(8,Math.sqrt(m.length)*5)*z;ctx.beginPath();ctx.ellipse(Math.round(p.x),Math.round(p.y),rr,rr*.5,0,0,7);ctx.stroke();ctx.setLineDash([]);
    ctx.translate(x,y);ctx.scale(K,K);ctx.fillStyle='#2a2d33';ctx.fillRect(1,0,S-2,S);ctx.fillRect(0,1,S,S-2);ctx.fillRect(S/2-1.5|0,S,3,1);ctx.fillStyle='#6a6e78';ctx.fillRect(1,1,S-2,S-2);ctx.fillStyle='#585c66';ctx.fillRect(1,S-3,S-2,2);
    ctx.fillStyle='#d8dae0';UNIT_GLYPH[unitIcon(g,m)].forEach((row,ry)=>[...row].forEach((c,rx)=>{if(c==='g')ctx.fillRect(2+rx,2+ry,1,1)}));ctx.restore()}}
// over a soldier: a white flag while it runs, a blinking mark while it wavers
function drawMorale(u,x,y){
  if(B.noMorale||u.mor==null||steady(u))return;
  if(u.rout){ctx.fillStyle='#5a4a3a';ctx.fillRect(x+3,y-8,1,8);ctx.fillStyle='#f2efe6';ctx.fillRect(x+4,y-8,4,3)}
  else if(u.mor<MORALE.waver&&Math.floor(B.t*4)%2)rect(ctx,'#ffd24a',x-1,y-3,2,2);
}
