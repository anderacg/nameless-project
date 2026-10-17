'use strict';
/* ---------- morale presentation (moved out of battle/morale.js; loaded right after it): the badges and glyphs, their SVG for
   the unit cards and details, the words for a group's morale, the icons over each group on the field (and picking them) and the
   marks over a wavering or running soldier. It only reads grpMorale (morale.js) and the soldiers' morale mirrors; it decides nothing ---------- */
/* the look, as in Total War: over each group a small icon in its side's colour showing what it is (sword, spear, axe, hammer,
   bow, crossbow, javelin, staff, horse, a beast's paw, your hero's crown) and a thin health bar under it; beside it a round badge
   for each status: a green confidence arrow, or wavering, routing, shattered (its morale), flanked,
   outnumbered, charged, its leader fallen, its side losing, tired (what weakens it). Drawn on the field and as SVG on the unit
   cards and in the details. */
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
  leader:['g.g.g','ggggg','ggggg','.....','.....'],
  losing:['..g..','..g..','g.g.g','.ggg.','..g..'],
  tired:['gggg.','..g..','.g...','gggg.','.....']
};
// each badge's rim: morale in its own colours, weaknesses in red (a charge in gold)
const BADGE_RIM={breaking:'#ff8040',rallying:'#9fe09a',missile:'#e8a75a',confident:'#70dfb0',outmatched:'#d8b35a',recentloss:'#e8a75a',tired:'#c8a04a',wavering:'#ffa040',routing:'#f2efe6',shattered:'#8a8f98',flanked:'#e0605a',outnumbered:'#e0605a',charged:'#ffd25a',leader:'#e0605a',losing:'#e0605a'};
const CONFIDENCE_LABEL='Confident: visible, distance-weighted fighting strength advantage. Up to +'+CONFIDENCE.max+' morale and '+Math.round(CONFIDENCE.resist*100)+'% less ordinary morale shock. Panic and leader loss can suppress it.';
const MORALE_STATE={steady:{c:'#78c474',n:'Steady'},shaken:{c:'#e8d04a',n:'Shaken'},wavering:{c:'#ffa040',n:'Wavering'},breaking:{c:'#ff8040',n:'Breaking'},rallying:{c:'#9fe09a',n:'Rallying'},routing:{c:'#f2efe6',n:'Routing'},shattered:{c:'#8a8f98',n:'Shattered'}};
const WEAK_N={missile:'Unanswered missile fire: recent ranged damage without enough successful retaliation',tired:'Tired: slower and weaker; standing still restores them',flanked:'Flanked: hit from the side or behind',outmatched:'Outmatched: stronger visible opposition in the wider area',recentloss:'Recent losses: temporary pressure that fades; some morale loss remains',outnumbered:'Locally overwhelmed: close fighting strength or substantial threats on opposite sides',charged:'Charged: hit by a charge',leader:'Leader fallen',losing:'Army depleted: fewer than half as many active troops overall (informational, not a direct morale penalty)'};
// a state's badge (only when its morale is failing: steady and shaken show none)
const stateIcon=st=>['wavering','breaking','routing','rallying','shattered'].includes(st)?st:null;
// a badge's pixels: [x, y, colour] (9×9)
function badgePx(k){const rim=BADGE_RIM[k]||'#e4e0cf',G=GLYPH[k],out=[];BADGE.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.')return;const gy=y-2,gx=x-2,g=G&&G[gy]&&G[gy][gx]==='g';out.push([x,y,ch==='x'?rim:g?'#ffffff':'#141822'])}));return out}
function moraleSVG(k,col,size){if(!k)return '';size=size||14;const confident=k==='confident';return '<svg class="mico" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges"'+(confident?' data-status="confident" role="img" aria-label="'+CONFIDENCE_LABEL+'"':' aria-hidden="true"')+'>'+(confident?'<title>'+CONFIDENCE_LABEL+'</title>':'')+badgePx(k).map(([x,y,c])=>'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>').join('')+'</svg>'}
// a group's badges: its failing morale, then what weakens it
const statusOf=mo=>[stateIcon(mo.state),mo.confident?'confident':null,...mo.weak].filter(Boolean);
const moraleCardIcons=mo=>statusOf(mo).map(k=>moraleSVG(k)).join('');
const moraleWords=mo=>'morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')'+(mo.confident?' · '+CONFIDENCE_LABEL:'')+(mo.weak.length?' · '+mo.weak.map(w=>WEAK_N[w].split(':')[0].toLowerCase()).join(', '):'');
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
// the icon under a point of the field (screen-sized, so tested on the screen), for clicks: the icon stands for its group
function iconAt(x,y,team){if(!B.icons)return null;const p=fromField({x,y});for(let i=B.icons.length-1;i>=0;i--){const r=B.icons[i];if((team==null||r.team===team)&&p.x>=r.x&&p.x<r.x+r.w&&p.y>=r.y&&p.y<r.y+r.h)return r}return null}
// the icons over each group on the field (yours and theirs), drawn on the screen (not the zoomed field) so they keep their size
const UICON={s:13,lift:22,k:2};// (its art in pixels, drawn k times over)
function drawUnitIcons(){
  const sel=selGroups(),blink=Math.floor(B.t*3)%2,K=UICON.k,S=UICON.s;B.icons=[];// (where each was drawn, for clicks: iconAt)
  // (each icon's place over its group; then those that would overlap, as where the lines meet, are set side by side in a row
  // under the highest of them, the row centred on them; and each icon glides to its place rather than jumping)
  const items=[];
  for(const g in B.groups){const m=B.units.filter(u=>u.grp===g&&u.hp>0);if(!m.length)continue;const mo=B.noMorale?null:grpMorale(m);
    const f=m.filter(u=>!u.rout),at=f.length?f:m,cx=at.reduce((a,u)=>a+u.x,0)/at.length,top=Math.min(...at.map(u=>u.y));
    const st=mo?statusOf(mo):[],W=(S+(st.length?Math.ceil(st.length/2)*10+1:0))*K,H=(S+6)*K;
    const sp=fromField({x:cx,y:top}),z=B.cam?B.cam.z:1;if(sp.x<-W||sp.x>BVW+W||sp.y<0||sp.y>BVH+40)continue;// (off the view: none)
    items.push({g,m,mo,st,W,H,cx,cy:at.reduce((a,u)=>a+u.y,0)/at.length,x:sp.x-S*K/2,y:Math.max(4,sp.y-UICON.lift*z-H)})}
  items.sort((p,q)=>p.x-q.x);const rows=[];
  for(const it of items){const r=rows.find(r=>r.some(o=>Math.abs(o.y-it.y)<it.H+4&&it.x<o.x+o.W+4&&o.x<it.x+it.W+4));if(r)r.push(it);else rows.push([it])}
  for(const r of rows){if(r.length<2)continue;const w=r.reduce((a,o)=>a+o.W+4,-4),mid=r.reduce((a,o)=>a+o.x+o.W/2,0)/r.length,y=Math.min(...r.map(o=>o.y));let x=mid-w/2;for(const o of r){o.x=x;o.y=y;x+=o.W+4}}
  const IP=B.iconPos=B.iconPos||{};
  for(const it of items){const p=IP[it.g];if(!p||Math.hypot(p.x-it.x,p.y-it.y)>200)IP[it.g]={x:it.x,y:it.y};else{p.x+=(it.x-p.x)*.25;p.y+=(it.y-p.y)*.25}}
  // (and while they glide, none may cross another: pushed aside along the row)
  {const L=items.map(it=>({it,p:IP[it.g]})).sort((a,b)=>a.p.x-b.p.x);for(let i=1;i<L.length;i++)for(let j=0;j<i;j++){const a=L[j],b=L[i];if(Math.abs(a.p.y-b.p.y)<b.it.H&&b.p.x<a.p.x+a.it.W+2)b.p.x=a.p.x+a.it.W+2}}
  for(const it of items){const {g,m,mo,st,W,H,cx,cy}=it,x=Math.round(IP[g].x),y=Math.round(IP[g].y);
    B.icons.push({g,x,y,w:S*K,h:H,team:m[0].team,cx,cy});
    const team=(mo?mo.team:m[0].team)?['#a8443e','#c8605a','#7a2e2a']:g.startsWith('a_')?['#5aa0c8','#8ac4e0','#3a7898']:['#3466c0','#5a8ae0','#24488a'],wav=mo&&mo.state==='wavering'&&blink;
    const hov=B.iconHov===g,edge=sel.includes(g)?'#ffd25a':wav?'#ffa040':hov?'#f4efe0':'#0a0c12';
    ctx.save();ctx.translate(x,y);ctx.scale(K,K);ctx.globalAlpha=mo&&(mo.state==='routing'||mo.state==='shattered')?.6:1;
    // the plate: an edge (gold when selected), its side's colour, lighter at the top and darker at the foot, a notch pointing down
    ctx.fillStyle=edge;ctx.fillRect(1,0,S-2,S);ctx.fillRect(0,1,S,S-2);ctx.fillRect(S/2-1.5|0,S,3,1);
    ctx.fillStyle=team[0];ctx.fillRect(1,1,S-2,S-2);ctx.fillStyle=team[1];ctx.fillRect(2,1,S-4,1);ctx.fillStyle=team[2];ctx.fillRect(1,S-3,S-2,2);
    // its type, in white with a dark shadow
    const gl=UNIT_GLYPH[unitIcon(g,m)];
    for(const [col,dx] of [['rgba(0,0,0,.45)',1],['#f4efe0',0]]){ctx.fillStyle=col;gl.forEach((row,ry)=>[...row].forEach((c,rx)=>{if(c==='g')ctx.fillRect(2+rx+dx,2+ry+dx,1,1)}))}
    ctx.globalAlpha=1;
    // its health, under it
    const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),hy=S+2;
    ctx.fillStyle='#0a0c12';ctx.fillRect(0,hy,S,3);ctx.fillStyle=hp>.6?'#78c474':hp>.3?'#e8d04a':'#e0605a';ctx.fillRect(1,hy+1,Math.max(1,Math.round((S-2)*hp)),1);
    // what is wrong with it, beside it (two to a column)
    st.forEach((k,i)=>{const bx=S+2+Math.floor(i/2)*10,by=(i%2)*10;for(const [px,py,c] of badgePx(k)){ctx.fillStyle=c;ctx.fillRect(bx+px,by+py,1,1)}});
    ctx.restore()}
}
// over a soldier: a white flag while it runs, a blinking mark while it wavers
function drawMorale(u,x,y){
  if(B.noMorale||u.mor==null||steady(u))return;
  if(u.rout){ctx.fillStyle='#5a4a3a';ctx.fillRect(x+3,y-8,1,8);ctx.fillStyle='#f2efe6';ctx.fillRect(x+4,y-8,4,3)}
  else if(u.mor<MORALE.waver&&Math.floor(B.t*4)%2)rect(ctx,'#ffd24a',x-1,y-3,2,2);
}
