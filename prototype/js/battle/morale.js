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

// who never breaks
const steady=u=>!!(u.hero||u.comp||u.leader||u.s.beast||u.s.big||ST[u.type]&&ST[u.type].beast);
// is it still in the fight (not dead, not running)
const fighting=u=>u.hp>0&&!u.rout;
function moraleInit(units,opts){
  exitInit(units);// (the withdrawal point)
  if(opts.tournament){B.noMorale=true;return}
  const lv=opts.lv||1,mine=clamp(50+P.morale*.5,40,100),theirs=clamp(55+5*(lv-1),40,90);
  for(const u of units){u.mor0=u.team?theirs+(u.lord?10:0):mine;u.mor=u.mor0}
}
// where a soldier faces: its formation's front while it stands in its slot, else where it last moved or struck
function facing(u){const g=u.grp&&B.groups[u.grp];if(g&&g.form&&u.inSlot)return g.face||0;return u.dir!=null?u.dir:u.face<0?Math.PI:0}
// which side of t a blow from src comes at
function sideOf(t,src){
  const a=Math.atan2(src.y-t.y,src.x-t.x),f=facing(t),df=Math.abs(Math.atan2(Math.sin(a-f),Math.cos(a-f)));
  return df<1.05?'front':df<2.1?'flank':'rear';
}
// a word over a soldier, unless the same word is already up close by (a whole line breaking says it once)
function moraleSay(u,t,c,life){if(B.floats.some(f=>f.t===t&&Math.abs(f.x-u.x)<40&&Math.abs(f.y-u.y+22)<30))return;B.floats.push({x:u.x,y:u.y-22,t,life:life||.8,c})}
// a blow's weight by the side it lands on (and a shake to its morale)
function flankMul(t,src){
  if(!src||B.noMorale||t.hero&&MANUAL_HERO)return 1;const s=sideOf(t,src);if(s==='front')return 1;
  if(!steady(t))t.mor-=MORALE[s];t.flankAt=B.t;
  if(!src.arrow)moraleSay(t,s==='rear'?'Rear!':'Flank!','#ffb04a',.5);
  return 1+(FLANK[s]-1)*(src.arrow?FLANK.arrow:1);
}
// a blow on morale: by the share of health it took
function moraleHurt(t,amt){if(B.noMorale||steady(t)||t.hp<=0)return;t.mor-=amt/t.max*MORALE.hurt*(inspired(t)?.75:1)}
// a death: its side shaken (most of all close by, and by a leader's fall); the other side heartened a little
function moraleDeath(t){
  if(withdrawing(t))B.caught=(B.caught||0)+1;// (cut down withdrawing: the rearguard)
  if(t.team===0&&!t.lord)B.lastOut='died';
  if(B.noMorale)return;const lead=t.hero||t.leader;
  for(const u of B.units){if(!fighting(u)||steady(u))continue;const d=Math.hypot(u.x-t.x,u.y-t.y);
    if(u.team===t.team)u.mor-=MORALE.side+(d<MORALE.near?MORALE.death:0)+(lead?MORALE.lead:0);
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
    if(foes>2*Math.max(1,friends)){u.mor-=MORALE.outnumbered*dt;u.outAt=B.t}
    if(n[u.team]<n[1-u.team]*.5)u.mor-=MORALE.losing*dt;
    if(closest>MORALE.quiet)u.mor=Math.min(u.mor0,u.mor+(MORALE.back+(inspired(u)?1:0))*dt);
    if(u.mor<=0)rout(u)}
  if((B.cardT=(B.cardT||0)-dt)<=0){B.cardT=.5;setOrderUI()}// (the unit cards' morale)
}
// a soldier breaks: it drops its fight and runs; its neighbours are shaken
function rout(u){
  u.rout=true;u.mor=Math.max(0,u.mor);u.tgt=null;if(u.rallied)u.shattered=true;
  moraleSay(u,u.shattered?'Shattered':'Routs!',u.team?'#ffe08a':'#ff9a90');
  for(const o of B.units)if(o!==u&&o.team===u.team&&fighting(o)&&!steady(o)&&Math.hypot(o.x-u.x,o.y-u.y)<MORALE.crowd)o.mor-=MORALE.cascade;
}
// a routing soldier's moment: away from the enemy, toward its own edge; there it leaves the field
function routStep(u,dt){
  const ex=u.team?BW-MORALE.edge:MORALE.edge,e=nearest(u);let mx=Math.sign(ex-u.x)||1,my=0;
  if(e){const dx=u.x-e.x,dy=u.y-e.y,d=Math.hypot(dx,dy)||1;if(d<80){mx+=dx/d*.6;my+=dy/d*.6}}
  const m=Math.hypot(mx,my)||1,sp=u.s.spd*1.1*dt*(u.slow>0?.5:1);u.x+=mx/m*sp;u.y+=my/m*sp;u.spdNow=u.s.spd;u.dir=Math.atan2(my,mx);u.face=mx>=0?1:-1;u.run=0;
  if(u.team?u.x>=BW-MORALE.edge-2:u.x<=MORALE.edge+2){u.fled=true;if(u.team===1)B.fledFoes=(B.fledFoes||0)+1;else B.fledMine=(B.fledMine||0)+1;leaveField(u)}
}
// a soldier off the field (at its edge): out of the fight, alive (not a loss); its health kept for after (your hero's)
function leaveField(u){u.hpLeft=u.hp;u.hp=0;u.left=true;if(u.team===0&&!u.lord)B.lastOut='left';if(u.grp){if(B.sel===u.grp&&!grpUnits(u.grp).length)B.sel='all';setOrderUI()}}

/* withdrawing (W) is fleeing the battle: the group drops its fight and runs for the withdrawal point (where your band formed up at
   the start, marked on the field), striking no one; those who reach it leave the field, alive. The enemy may run them down on
   the way: that is the rearguard's cost. Once all of yours have withdrawn (or fallen), the battle is over: your retreat, and the
   summary shows what it cost. */
const WITHDRAW={r:36};
const withdrawing=u=>{const g=u.team===0&&u.grp&&B.groups[u.grp];return !!g&&g.order==='withdraw'};
// the withdrawal point: the middle of where your own band formed up
function exitInit(units){const m=units.filter(u=>u.team===0&&!u.lord);B.exit={x:m.length?m.reduce((a,u)=>a+u.x,0)/m.length:72,y:m.length?m.reduce((a,u)=>a+u.y,0)/m.length:BH/2,r:WITHDRAW.r}}
function withdrawStep(u,dt){
  const X=B.exit,dx=X.x-u.x,dy=X.y-u.y,d=Math.hypot(dx,dy)||1;u.run=0;u.inSlot=false;
  if(d<=X.r){B.withdrawn=(B.withdrawn||0)+1;leaveField(u);return}
  const sp=Math.min(d,u.s.spd*dt*(u.slow>0?.5:1));u.x+=dx/d*sp;u.y+=dy/d*sp;u.spdNow=u.s.spd;u.dir=Math.atan2(dy,dx);u.face=dx>=0?1:-1;
}
// is the battle over by your retreat: some of yours withdrew, and none of your own is left on the field (bar any running in a rout).
// Your hero knocked down: a retreat if the last of your band got away withdrawing (they carry you off), a defeat if they fell
function retreating(){
  if(!B.withdrawn||B.hero&&B.hero.hp<=0&&!B.hero.left&&B.lastOut!=='left')return false;
  return !B.units.some(u=>u.team===0&&!u.lord&&u.hp>0&&!u.rout);
}
function retreatNow(){B.over=true;B.endT=1.1;B.win=false;B.retreat=true;log('Your band withdraws from the battle'+(B.caught?': '+B.caught+' cut down on the way.':'.'),'bad')}
// the withdrawal point on the field: faint, and bright with a word while any of yours withdraw
function drawExit(){
  const X=B.exit;if(!X||B.opts.tournament)return;const on=B.units.some(u=>u.hp>0&&withdrawing(u));
  ctx.save();ctx.setLineDash([3,3]);ctx.strokeStyle=on?'rgba(232,185,74,.9)':'rgba(228,224,207,.25)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(X.x,X.y,X.r,X.r*.6,0,0,7);ctx.stroke();ctx.restore();
  if(on)txt('Withdraw',Math.round(X.x),Math.round(X.y-X.r*.6-4),'#e8b94a','center');
}
// charge momentum: how far it has run at its target, 0 to 1
const momentum=u=>clamp((u.run||0)/CHARGE.run,0,1);
// a charge's weight on its first blow (spearmen brace against riders); its shock to the one it hits. The run is spent.
function chargeMul(u,t){
  const m=momentum(u),s=u.s;u.run=0;if(B.noMorale&&!s.charge)return 1;
  if(s.charge){if(m<CHARGE.min)return 1;if(unitClass(t.s)==='spear'){B.floats.push({x:t.x,y:t.y-22,t:'Braced',life:.6,c:'#cfe0ff'});return 1}
    fx(t.x,t.y-6,'#fff',4);if(!steady(t)&&t.mor!=null){t.mor-=CHARGE.shock*m;t.shockAt=B.t}knock(t,u.x,u.y,CHARGE.knock*m);if(m>.6)moraleSay(t,'Charge!','#fff',.6);
    return (1+CHARGE.cav*m)*formCharge(u,t)}
  if(s.range||m<CHARGE.foot_min)return 1;if(!steady(t)&&t.mor!=null){t.mor-=CHARGE.footShock*m;t.shockAt=B.t}return 1+CHARGE.foot*m;
}
// a group's morale (unit cards and the banners over groups): the average, how many waver or run, its state, and what weakens it now
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
  return{v,rout,waver,state,weak,team}}
// the icons: 7×7 pixel maps (each letter a colour), drawn on the field and as SVG on the unit cards
const MORALE_ICON={
  flag:{px:['pffff..','pfffff.','pffff..','p......','p......','p......','p......']},
  torn:{px:['pf.f...','pfff...','p.f....','p......','.p.....','.p.....','..p....']},
  flanked:{px:['......b','..a...b','...a..b','aaaaa.b','...a..b','..a...b','......b'],c:{a:'#ff7a50',b:'#cfd6e0'}},
  outnumbered:{px:['a.a....','.......','a.a.b..','.......','a.a....','.......','.......'],c:{a:'#ff7a50',b:'#cfd6e0'}},
  charged:{px:['...aa..','..aa...','.aaaa..','...aa..','..aa...','.a.....','.......'],c:{a:'#ffe08a'}},
  leader:{px:['.......','..aaa..','.aaaaa.','.a.a.a.','.aaaaa.','..a.a..','.......'],c:{a:'#e8e2d0'}},
  losing:{px:['...a...','...a...','...a...','.a.a.a.','..aaa..','...a...','.......'],c:{a:'#ff7a50'}}
};
const MORALE_STATE={steady:{c:'#78c474',n:'Steady'},shaken:{c:'#e8d04a',n:'Shaken'},wavering:{c:'#ffa040',n:'Wavering'},routing:{c:'#f2efe6',n:'Routing'},shattered:{c:'#8a8f98',n:'Shattered',icon:'torn'}};
const WEAK_N={flanked:'Flanked: hit from the side or behind',outnumbered:'Outnumbered: 2 to 1 close by',charged:'Charged: hit by a charge',leader:'Leader fallen',losing:'Losing: its side under half the other'};
// an icon's pixels with their colours (a flag in its state's colour)
function moraleIconPx(k,col){const I=MORALE_ICON[k],c=Object.assign({p:'#8a6a44',f:col||'#78c474'},I.c||{}),out=[];I.px.forEach((r,y)=>[...r].forEach((ch,x)=>{if(ch!=='.')out.push([x,y,c[ch]])}));return out}
const stateIcon=st=>MORALE_STATE[st].icon||'flag';
function moraleSVG(k,col,size){size=size||14;return '<svg class="mico" viewBox="0 0 7 7" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+moraleIconPx(k,col).map(([x,y,c])=>'<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="'+c+'"/>').join('')+'</svg>'}
// a group's icons for its unit card: its state's flag, then its weaknesses
const moraleCardIcons=mo=>moraleSVG(stateIcon(mo.state),MORALE_STATE[mo.state].c)+mo.weak.map(w=>moraleSVG(w)).join('');
const moraleWords=mo=>'morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')'+(mo.weak.length?' · '+mo.weak.map(w=>WEAK_N[w].split(':')[0].toLowerCase()).join(', '):'');
// the banners over each group on the field (yours and theirs): its state's flag on a plate edged in its side's colour, then its weaknesses;
// drawn on the screen (not the zoomed field), so they keep their size at any zoom
const BANNER={k:2,gap:2,lift:22};
function drawBanners(){
  if(B.noMorale)return;const taken=[];
  for(const g in B.groups){const m=B.units.filter(u=>u.grp===g&&u.hp>0),mo=grpMorale(m);if(!mo)continue;
    const f=m.filter(u=>!u.rout),at=f.length?f:m,cx=at.reduce((a,u)=>a+u.x,0)/at.length,top=Math.min(...at.map(u=>u.y));
    const keys=[[stateIcon(mo.state),MORALE_STATE[mo.state].c],...mo.weak.map(w=>[w])],k=BANNER.k,w=keys.length*7*k+(keys.length-1)*BANNER.gap;
    const sp=fromField({x:cx,y:top}),z=B.cam?B.cam.z:1;if(sp.x<-w||sp.x>BW+w||sp.y<0||sp.y>BH+40)continue;// (off the view: none)
    let x=Math.round(sp.x-w/2),y=Math.round(Math.max(4,sp.y-BANNER.lift*z-7*k));const H=7*k+4;
    // (where banners would overlap, as where the lines meet, the later one stacks above)
    for(let n=0;n<6&&taken.some(r=>x-2<r.x+r.w&&r.x<x+w+2&&y-2<r.y+H&&r.y<y-2+H);n++)y=Math.max(4,y-H-2);taken.push({x:x-2,y:y-2,w:w+4});
    ctx.fillStyle='rgba(10,12,18,.72)';ctx.fillRect(x-2,y-2,w+4,7*k+4);ctx.fillStyle=mo.team?'#c0504a':'#4a7ac0';ctx.fillRect(x-2,y+7*k+1,w+4,1);
    for(const [key,col] of keys){for(const [px,py,c] of moraleIconPx(key,col)){ctx.fillStyle=c;ctx.fillRect(x+px*k,y+py*k,k,k)}x+=7*k+BANNER.gap}}
}
// over a soldier: a white flag while it runs, a blinking mark while it wavers
function drawMorale(u,x,y){
  if(B.noMorale||u.mor==null||steady(u))return;
  if(u.rout){ctx.fillStyle='#5a4a3a';ctx.fillRect(x+3,y-8,1,8);ctx.fillStyle='#f2efe6';ctx.fillRect(x+4,y-8,4,3)}
  else if(u.mor<MORALE.waver&&Math.floor(B.t*4)%2)rect(ctx,'#ffd24a',x-1,y-3,2,2);
}
