'use strict';
/* ---------- Phase 3 of RTS command: facing, morale and charges. Every soldier faces somewhere (where it marches, whom it strikes,
   or its formation's front when standing in it); a blow from the flank or behind hurts more and shakes it more. Every soldier has
   morale: it sinks under blows, losses close by, being outnumbered, a charge, its leader falling, and comes back when the fighting
   leaves it alone. Wavering under 30; at 0 it routs, running for its own edge, and leaves the field there (alive: not a loss).
   A routing soldier left alone can rally once; the second time it breaks for good. When a side has no one left fighting, the
   battle ends: a rout. Your hero, companions, lords and chieftains, and beasts never break. Charges build momentum as they run. ---------- */
// side: blow multipliers from the flank (60-120° off its front) and the rear (beyond 120°); arrows get half that
const FLANK={flank:1.25,rear:1.5,arrow:.5};
// mor: start (yours from the band's morale, theirs by level); hurt: per share of health lost; death: an ally falling close (near);
// side: anyone on its side falling; flank/rear: extra shock; outnumbered: per second, more than twice as many foes close by;
// losing: per second, its side under half the other's; lead: a leader falling; cascade: a neighbour breaking; back: recovery per
// second with no enemy within quiet; rally: it rallies at; waver: wavering under
const MORALE={hurt:25,death:6,near:60,side:1,flank:3,rear:6,outnumbered:3,crowd:50,losing:1.5,lead:20,cascade:8,quiet:60,back:2,
  rallyBack:6,rally:40,waver:30,cry:15,charge:15,inspire:90,edge:10};
// charge momentum: full after a run of this far; how it hits (cavalry, others); the shock it deals to the one it hits
const CHARGE={run:60,cav:.9,foot:.3,min:.2,foot_min:.35,shock:15,footShock:6,knock:2};
/* the push of a charge, by who hits whom: riders hard (heavy riders harder), big beasts hardest, shock troops some, other
   foot a little; heavy troops and a shield wall give less ground (a big creature barely moves: knock); those at the one hit's
   side are pushed too, splash of it, within splashR */
const PUSH={cav:2.6,heavyCav:3.4,big:3.6,shock:1.4,foot:.9,heavy:.6,wall:.35,splash:.5,splashR:16};
function chargePush(u,t,m){
  const s=u.s,at=tagsOf(s),base=s.big?PUSH.big:s.charge?(at.includes('heavy')?PUSH.heavyCav:PUSH.cav):at.includes('shock')?PUSH.shock:PUSH.foot,g=t.grp&&B.groups[t.grp];
  const f=base*m*(tagsOf(t.s).includes('heavy')?PUSH.heavy:1)*(g&&g.form==='wall'?PUSH.wall:1);knock(t,u.x,u.y,f);
  for(const o of B.units)if(o!==t&&o.team===t.team&&o.hp>0&&!o.s.big&&Math.hypot(o.x-t.x,o.y-t.y)<PUSH.splashR)knock(o,u.x,u.y,f*PUSH.splash)}

// who never breaks
// (a shock to a soldier's morale, by his steadiness: a unit of higher Morale is shaken less)
const steadiness=u=>clamp(UNIT_MOR.ref/unitMoraleOf(u.s),UNIT_MOR.min,UNIT_MOR.max);
function shake(u,n){u.mor-=n*steadiness(u)}
const steady=u=>!!(u.hero||u.comp||u.leader||u.s.beast||u.s.big||ST[u.type]&&ST[u.type].beast);
// is it still in the fight (not dead, not running)
const fighting=u=>u.hp>0&&!u.rout;
function moraleInit(units,opts){
  exitInit(units);// (the withdrawal edge)
  if(opts.tournament){B.noMorale=true;return}
  // (each soldier from his own Morale (matchups.js unitMoraleOf): yours scaled by your band's morale, theirs by their level;
  // a lord's men +10)
  const lv=opts.lv||1,mine=.6+.4*clamp(P.morale,0,100)/100,theirs=clamp(.9+.05*(lv-1),.8,1.2);
  for(const u of units){u.mor0=Math.round(clamp(unitMoraleOf(u.s)*(u.team?theirs:mine)+(u.team&&u.lord?10:0),20,100));u.mor=u.mor0}
}
// where a soldier faces: its formation's front while it stands in its slot, else where it last moved or struck
function facing(u){const g=u.grp&&B.groups[u.grp];if(g&&g.form&&u.inSlot)return g.face||0;return u.dir!=null?u.dir:u.face<0?Math.PI:0}
// which side of t a blow from src comes at
function sideOf(t,src){
  const a=Math.atan2(src.y-t.y,src.x-t.x),f=facing(t),df=angGap(a,f);
  return df<1.05?'front':df<2.1?'flank':'rear';
}
// a word over a soldier, unless the same word is already up close by (a whole line breaking says it once)
function moraleSay(u,t,c,life){if(B.floats.some(f=>f.t===t&&Math.abs(f.x-u.x)<40&&Math.abs(f.y-u.y+22)<30))return;B.floats.push({x:u.x,y:u.y-22,t,life:life||.8,c})}
// a blow's weight by the side it lands on (and a shake to its morale)
function flankMul(t,src){
  if(!src||B.noMorale||t.hero&&MANUAL_HERO)return 1;const s=sideOf(t,src);if(s==='front')return 1;
  if(!steady(t))shake(t,MORALE[s]);t.flankAt=B.t;
  if(!src.arrow)moraleSay(t,s==='rear'?'Rear!':'Flank!','#ffb04a',.5);
  return 1+(FLANK[s]-1)*(src.arrow?FLANK.arrow:1);
}
// a blow on morale: by the share of health it took
function moraleHurt(t,amt){if(B.noMorale||steady(t)||t.hp<=0)return;shake(t,amt/t.max*MORALE.hurt*(inspired(t)?.75:1))}
// a death: its side shaken (most of all close by, and by a leader's fall); the other side heartened a little
function moraleDeath(t){
  if(withdrawing(t))B.caught=(B.caught||0)+1;// (cut down withdrawing: the rearguard)
  if(t.team===0&&!t.lord)B.lastOut='died';
  if(B.noMorale)return;const lead=t.hero||t.leader;
  for(const u of B.units){if(!fighting(u)||steady(u))continue;const d=Math.hypot(u.x-t.x,u.y-t.y);
    if(u.team===t.team)shake(u,MORALE.side+(d<MORALE.near?MORALE.death:0)+(lead?MORALE.lead:0));
    else u.mor=Math.min(100,u.mor+(lead?MORALE.lead/2:d<MORALE.near?2:0))}
  if(lead){(B.leadFell=B.leadFell||[])[t.team]=B.t}
  if(lead)B.floats.push({x:t.x,y:t.y-30,t:t.team?'Their leader falls!':'Your leader falls!',life:1.4,c:t.team?'#ffe08a':'#ff9a90'});
}
// a leader close by steadies them: your hero, a lord or chieftain of theirs
const inspired=u=>B.units.some(o=>o.team===u.team&&o.hp>0&&(o.hero||o.leader)&&Math.hypot(o.x-u.x,o.y-u.y)<MORALE.inspire);
// a war cry heartens those it reaches
function moraleCry(list){if(B.noMorale)return;for(const u of list)if(u.mor!=null)u.mor=Math.min(100,u.mor+MORALE.cry)}

// each moment: morale drifts with the fight, soldiers break, rally, and leave the field
function moraleTick(dt){
  if(B.noMorale)return;
  const live=B.units.filter(fighting),n=[0,0];for(const u of live)n[u.team]++;B.losing=[n[0]<n[1]*.5,n[1]<n[0]*.5];
  for(const u of B.units){if(u.hp<=0||steady(u)||u.mor==null)continue;
    let foes=0,friends=0,closest=1e9;for(const o of live){const d=Math.hypot(o.x-u.x,o.y-u.y);if(o.team!==u.team){if(d<closest)closest=d;if(d<MORALE.crowd)foes++}else if(d<MORALE.crowd)friends++}
    if(u.rout){
      // running: left alone long enough it may rally (once)
      if(closest>MORALE.quiet+10&&!u.rallied){u.mor+=MORALE.rallyBack*dt;if(u.mor>=MORALE.rally){u.rout=false;u.rallied=true;u.tgt=null;moraleSay(u,'Rallies','#9fe09a')}}
      continue}
    if(foes>2*Math.max(1,friends)){shake(u,MORALE.outnumbered*dt);u.outAt=B.t}
    if(n[u.team]<n[1-u.team]*.5)shake(u,MORALE.losing*dt);
    if(closest>MORALE.quiet)u.mor=Math.min(u.mor0,u.mor+(MORALE.back+(inspired(u)?1:0))*dt);
    if(u.mor<=0)rout(u)}
  if((B.cardT=(B.cardT||0)-dt)<=0){B.cardT=.5;setOrderUI()}// (the unit cards' morale)
}
// a soldier breaks: it drops its fight and runs; its neighbours are shaken
function rout(u){
  u.rout=true;u.mor=Math.max(0,u.mor);u.tgt=null;if(u.rallied)u.shattered=true;
  moraleSay(u,u.shattered?'Shattered':'Routs!',u.team?'#ffe08a':'#ff9a90');
  for(const o of B.units)if(o!==u&&o.team===u.team&&fighting(o)&&!steady(o)&&Math.hypot(o.x-u.x,o.y-u.y)<MORALE.crowd)shake(o,MORALE.cascade);
}
// a routing soldier's moment: away from the enemy, toward its own edge; there it leaves the field
function routStep(u,dt){
  const ex=u.team?BW-MORALE.edge:MORALE.edge,e=nearest(u);let mx=Math.sign(ex-u.x)||1,my=0;
  if(e){const dx=u.x-e.x,dy=u.y-e.y,d=Math.hypot(dx,dy)||1;if(d<80){mx+=dx/d*.6;my+=dy/d*.6}}
  const m=Math.hypot(mx,my)||1,sp=u.s.spd*1.1*dt*(u.slow>0?.5:1);u.x+=mx/m*sp;u.y+=my/m*sp;u.spdNow=u.s.spd;u.dir=Math.atan2(my,mx);u.face=mx>=0?1:-1;u.run=0;fatigueStep(u,dt,true,false,false);
  if(u.team?u.x>=BW-MORALE.edge-2:u.x<=MORALE.edge+2){u.fled=true;if(u.team===1)B.fledFoes=(B.fledFoes||0)+1;else B.fledMine=(B.fledMine||0)+1;leaveField(u)}
}
// a soldier off the field (at its edge): out of the fight, alive (not a loss); its health kept for after (your hero's)
function leaveField(u){u.hpLeft=u.hp;u.hp=0;u.left=true;if(u.team===0&&!u.lord)B.lastOut='left';if(u.grp){if(B.sel===u.grp&&!grpUnits(u.grp).length)B.sel='all';setOrderUI()}}

/* withdrawing (W) is fleeing the battle: the group drops its fight and runs for your edge of the field (the side you formed up on,
   marked there while any of yours withdraw), straight back, striking no one; there they leave the field, alive. The enemy may run
   them down on the way: that is the rearguard's cost. Once all of yours have withdrawn (or fallen), the battle is over: your
   retreat, and the summary shows what it cost. */
const WITHDRAW={band:14};// the edge's strip: past this far from the edge they are off the field
const withdrawing=u=>{const g=u.team===0&&u.grp&&B.groups[u.grp];return !!g&&g.order==='withdraw'};
// the withdrawal edge: your side of the field (x), its strip (w); y is the middle of where your band formed up (for the lines)
function exitInit(units){const m=units.filter(u=>u.team===0&&!u.lord);B.exit={x:MORALE.edge,w:WITHDRAW.band,y:m.length?m.reduce((a,u)=>a+u.y,0)/m.length:BH/2}}
// where a soldier withdraws to: the nearest point of your edge, straight back
const exitFor=u=>({x:B.exit.x,y:clamp(u.y,fieldTop(),fieldBot())});
function withdrawStep(u,dt){
  u.run=0;u.inSlot=false;if(u.x<=B.exit.x+B.exit.w){B.withdrawn=(B.withdrawn||0)+1;leaveField(u);return}
  const X=exitFor(u),dx=X.x-u.x,dy=X.y-u.y,d=Math.hypot(dx,dy)||1,sp=Math.min(d,u.s.spd*dt*(u.slow>0?.5:1));
  u.x+=dx/d*sp;u.y+=dy/d*sp;u.spdNow=u.s.spd;u.dir=Math.atan2(dy,dx);u.face=dx>=0?1:-1;
}
// is the battle over by your retreat: some of yours withdrew, and none of your own is left on the field (bar any running in a rout).
// Your hero knocked down: a retreat if the last of your band got away withdrawing (they carry you off), a defeat if they fell
function retreating(){
  if(!B.withdrawn||B.hero&&B.hero.hp<=0&&!B.hero.left&&B.lastOut!=='left')return false;
  return !B.units.some(u=>u.team===0&&!u.lord&&u.hp>0&&!u.rout);
}
function retreatNow(){B.over=true;B.endT=END_WAIT;B.win=false;B.retreat=true;log('Your band withdraws from the battle'+(B.caught?': '+B.caught+' cut down on the way.':'.'),'bad')}
// the withdrawal edge on the field: a faint strip along your edge, bright with a word while any of yours withdraw
function drawExit(){
  const X=B.exit;if(!X||B.opts.tournament)return;const on=B.units.some(u=>u.hp>0&&withdrawing(u));
  ctx.fillStyle=on?'rgba(111,168,224,.22)':'rgba(228,224,207,.06)';ctx.fillRect(0,18,X.x+X.w,BH-24);
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle=on?'rgba(111,168,224,.9)':'rgba(228,224,207,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(X.x+X.w+.5,18);ctx.lineTo(X.x+X.w+.5,BH-6);ctx.stroke();ctx.restore();
  if(on){ctx.save();ctx.translate(X.x+X.w/2+3,BH/2);ctx.rotate(-Math.PI/2);txt('Withdraw',0,0,'#9fc0ff','center');ctx.restore()}
}
// charge momentum: how far it has run at its target, 0 to 1
const momentum=u=>clamp((u.run||0)/CHARGE.run,0,1);
// a charge's weight on its first blow (spearmen brace against riders); its shock to the one it hits. The run is spent.
function chargeMul(u,t){
  const m=momentum(u),s=u.s;u.run=0;if(m>=CHARGE.min)fatigueCharge(u,m);// (the charge spends the runner's stamina: fatigue.js)
  if(B.noMorale&&!s.charge)return 1;
  if(s.charge){if(m<CHARGE.min)return 1;if(unitClass(t.s)==='spear'){B.floats.push({x:t.x,y:t.y-22,t:'Braced',life:.6,c:'#cfe0ff'});return 1}
    vfxCharge(u,t,m);fx(t.x,t.y-6,'#fff',4);if(!steady(t)&&t.mor!=null){shake(t,CHARGE.shock*m);t.shockAt=B.t}chargePush(u,t,m);if(m>.6)moraleSay(t,'Charge!','#fff',.6);
    return (1+CHARGE.cav*m)*formCharge(u,t)}
  if(s.range||m<CHARGE.foot_min)return 1;if(unitClass(t.s)==='spear'){B.floats.push({x:t.x,y:t.y-22,t:'Braced',life:.6,c:'#cfe0ff'});return 1}
  if(!steady(t)&&t.mor!=null){shake(t,CHARGE.footShock*m);t.shockAt=B.t}chargePush(u,t,m);return 1+CHARGE.foot*m;
}
// a group's morale (unit cards and the icons over groups): the average, how many waver or run, its state, and what weakens it now
// state: steady (60+), shaken (30+), wavering, routing (most of them running), shattered (all running, broken for good)
// weak: flanked (hit from the side or behind), outnumbered (2 to 1 close by), charged (hit by a charge), leader (its leader fell),
// losing (its side under half the other's); each shows a while (seconds) after it last happened
const MORALE_WEAK={flanked:2,outnumbered:1.5,charged:2,leader:6};
function grpMorale(m){const l=m.filter(u=>u.mor!=null&&!steady(u));if(!l.length)return null;
  const v=l.reduce((a,u)=>a+Math.max(0,u.mor),0)/l.length/100,rout=l.filter(u=>u.rout).length,waver=l.filter(u=>!u.rout&&u.mor<MORALE.waver).length,shat=l.filter(u=>u.shattered).length;
  const state=rout===l.length&&shat*2>=l.length?'shattered':rout*2>l.length?'routing':v<MORALE.waver/100||waver*2>l.length?'wavering':v<.6?'shaken':'steady';
  const ago=(k,w)=>l.some(u=>u[k]!=null&&B.t-u[k]<w),team=l[0].team,weak=[];
  if(ago('flankAt',MORALE_WEAK.flanked))weak.push('flanked');if(ago('outAt',MORALE_WEAK.outnumbered))weak.push('outnumbered');if(ago('shockAt',MORALE_WEAK.charged))weak.push('charged');
  if(B.leadFell&&B.leadFell[team]!=null&&B.t-B.leadFell[team]<MORALE_WEAK.leader)weak.push('leader');if(B.losing&&B.losing[team])weak.push('losing');
  {const st=grpStamina(m);if(st!=null&&st*FATIGUE.max<FATIGUE.tired)weak.push('tired')}
  return{v,rout,waver,state,weak,team}}
/* the look, as in Total War: over each group a small icon in its side's colour showing what it is (sword, spear, axe, hammer,
   bow, crossbow, javelin, staff, horse, a beast's paw, your hero's crown) and a thin health bar under it; beside it a round badge
   for each thing wrong with it, and nothing when all is well. The badges: wavering, routing, shattered (its morale), flanked,
   outnumbered, charged, its leader fallen, its side losing, tired (what weakens it). Drawn on the field and as SVG on the unit
   cards and in the details. */
const BADGE=['..xxxxx..','.xooooox.','xooooooox','xooooooox','xooooooox','xooooooox','xooooooox','.xooooox.','..xxxxx..'];
const GLYPH={
  wavering:['..g..','..g..','..g..','.....','..g..'],
  routing:['gggg.','ggggg','gggg.','g....','g....'],
  shattered:['g...g','.g.g.','..g..','.g.g.','g...g'],
  flanked:['g....','.g...','..g.g','...gg','..ggg'],
  outnumbered:['g...g','.....','g.g.g','.....','g...g'],
  charged:['...gg','..gg.','.ggg.','.gg..','gg...'],
  leader:['g.g.g','ggggg','ggggg','.....','.....'],
  losing:['..g..','..g..','g.g.g','.ggg.','..g..'],
  tired:['gggg.','..g..','.g...','gggg.','.....']
};
// each badge's rim: morale in its own colours, weaknesses in red (a charge in gold)
const BADGE_RIM={tired:'#c8a04a',wavering:'#ffa040',routing:'#f2efe6',shattered:'#8a8f98',flanked:'#e0605a',outnumbered:'#e0605a',charged:'#ffd25a',leader:'#e0605a',losing:'#e0605a'};
const MORALE_STATE={steady:{c:'#78c474',n:'Steady'},shaken:{c:'#e8d04a',n:'Shaken'},wavering:{c:'#ffa040',n:'Wavering'},routing:{c:'#f2efe6',n:'Routing'},shattered:{c:'#8a8f98',n:'Shattered'}};
const WEAK_N={tired:'Tired: slower and weaker; standing still restores them',flanked:'Flanked: hit from the side or behind',outnumbered:'Outnumbered: 2 to 1 close by',charged:'Charged: hit by a charge',leader:'Leader fallen',losing:'Losing: its side under half the other'};
// a state's badge (only when its morale is failing: steady and shaken show none)
const stateIcon=st=>st==='wavering'||st==='routing'||st==='shattered'?st:null;
// a badge's pixels: [x, y, colour] (9×9)
function badgePx(k){const rim=BADGE_RIM[k]||'#e4e0cf',G=GLYPH[k],out=[];BADGE.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch==='.')return;const gy=y-2,gx=x-2,g=G&&G[gy]&&G[gy][gx]==='g';out.push([x,y,ch==='x'?rim:g?'#ffffff':'#141822'])}));return out}
function moraleSVG(k,col,size){if(!k)return '';size=size||14;return '<svg class="mico" viewBox="0 0 9 9" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+badgePx(k).map(([x,y,c])=>'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>').join('')+'</svg>'}
// a group's badges: its failing morale, then what weakens it
const statusOf=mo=>[stateIcon(mo.state),...mo.weak].filter(Boolean);
const moraleCardIcons=mo=>statusOf(mo).map(k=>moraleSVG(k)).join('');
const moraleWords=mo=>'morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')'+(mo.weak.length?' · '+mo.weak.map(w=>WEAK_N[w].split(':')[0].toLowerCase()).join(', '):'');
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
