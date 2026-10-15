'use strict';
/* ---------- the battle HUD, laid out as in Total War (Ashmark.html #bbar): the balance of power at the top middle, time at the top
   right, the selected unit's details at the bottom left, the orders over a row of unit cards at the bottom middle. On the field:
   rings under the soldiers you have selected, a softer one under the group you point at, and lines from each selected group to
   where it is going (or whom it is set on). ---------- */
// the order and flag icons: 9×9 pixel maps (a: the button's colour, b: dimmer)
const ORDER_ICON={
  hold:['...a.a...','.a.a.a.a.','.a.a.a.a.','.a.a.a.a.','.aaaaaaa.','.aaaaaaa.','..aaaaa..','..aaaaa..','...aaa...'],
  follow:['.........','......bb.','.....bbbb','..a...bb.','.aaa..bb.','aaaaa.b.b','..a......','..a......','.........'],
  charge:['......aa.','......aa.','b..aaaaa.','bb.a.aa.a','b....aa..','....a.aa.','...a....a','..a......','.........'],
  advance:['....aa...','....aa...','...aaaa..','..a.aa.a.','....aa...','....a.a..','...a..a..','...a...a.','..aa...aa'],
  halt:['.........','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.........'],
  withdraw:['.baaaaa..','.baaaaaa.','.baaaaa..','.baaaa...','.b.......','.b.......','.b.......','.b.......','bbb......'],
  walk:['.........','.aa......','.aa......','.aa......','.....aa..','.....aa..','.....aa..','.........','.........'],
  firm:['.aaaaaaa.','.abbbbba.','.abbbbba.','.abbbbba.','..abbba..','..abbba..','...aba...','....a....','.........'],
  // (cease fire: an arrow, struck through)
  cease:['a....bbbb','.a.....bb','..a...b.b','...a.b...','....a....','...b.a...','b.b...a..','.b.....a.','b.b.....a'],
  // (blades: a short sword, point up)
  melee:['.......a.','......a.a','.....a.a.','....a.a..','.b.a.a...','..b.a....','..bb.....','.b..b....','b........'],
  skirmish:['.........','..a...b..','.aa...bb.','aaaaa.bbb','.aa...bb.','..a...b..','.........','.........','.........']
};
function pixelSVG(rows,size,cls){const s=rows.length;let r='';rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="currentColor"'+(c==='b'?' opacity=".5"':'')+'/>'}));
  return '<svg class="'+(cls||'oico')+'" viewBox="0 0 '+s+' '+s+'" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'}
// the order, flag and formation buttons: their icon and key (once, at load)
function bhudInit(){
  document.querySelectorAll('.obtn[data-order],.obtn[data-flag]').forEach(b=>{const k=b.dataset.order||b.dataset.flag;b.innerHTML=pixelSVG(ORDER_ICON[k],18)+'<span class="k">'+(b.dataset.key||'')+'</span>';b.setAttribute('aria-label',b.title)});
  document.querySelectorAll('.obtn[data-form]').forEach(b=>{const F=FORMS[b.dataset.form];b.innerHTML=formIcon(b.dataset.form,24,16)+'<span class="k">'+F.key+'</span>';b.title=F.n+': '+F.d+' ('+F.key+')';b.setAttribute('aria-label',b.title)});
}
// a unit's portrait: its sprite, drawn once into a picture (cached by kind)
const PORTRAITS={};
function portrait(type,hero){const k=(hero?'hero:':'')+type;if(!PORTRAITS[k]){try{const sp=unitSprite(type,0,!!hero,0),n=sp.width,S=Math.min(n,Math.max(sp.cw||n,(sp.ch||n)+3));// (the figure itself, cropped from its cell: feet at the bottom, centred)
    PORTRAITS[k]=mkc(S,S,g=>g.drawImage(sp,(n-S)>>1,n-S,S,S,0,0,S,S)).toDataURL()}catch(e){PORTRAITS[k]=''}}return PORTRAITS[k]}
// the kind most of a group is (its card's picture and its numbers)
function repOf(m){const c={};for(const u of m)c[u.type]=(c[u.type]||0)+1;let best=null;for(const k in c)if(!best||c[k]>c[best])best=k;return best}
const pct=x=>Math.round(clamp(x,0,1)*100)+'%';
// (its shooters' shots left, of all they carried: '31/40'; none for fighters and casters)
const ammoText=m=>{const sh=m.filter(u=>u.s.range||u.empty);if(!sh.length||sh.every(u=>!isFinite(quiverOf(u.s))&&!u.empty))return '';const tot=sh.reduce((a,u)=>a+(isFinite(quiverOf(u.s))?quiverOf(u.s):0),0),left=sh.reduce((a,u)=>a+(u.empty?0:u.ammo==null?quiverOf(u.s):u.ammo),0);return isFinite(tot)&&tot?left+'/'+tot:''};
// a unit card: its key, picture, name and count, shape and formation, morale icons, health and morale
function bhudCard(b,g){
  const m=g==='all'?GRPS.flatMap(grpUnits):grpUnits(g),n=m.length,on=B.sel===g||Array.isArray(B.sel)&&B.sel.includes(g),gr=B.groups[g];
  const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),mo=B.noMorale?null:grpMorale(m),sh=g!=='all'&&g!=='hero'&&gr?grpShape(g):null,rep=g==='hero'?'hero':repOf(m),stm=grpStamina(m);
  const fl=[gr&&gr.walk?'walk':'',gr&&gr.firm?'firm':'',gr&&gr.cease?'cease fire':'',g!=='all'&&ammoText(m)?'ammo '+ammoText(m):'',gr&&gr.skirmish?'skirm':'',gr&&gr.melee===false&&grpUnits(g).some(u=>u.s.range)?'melee mode off':'',mo&&mo.rout?mo.rout+' running':''].filter(Boolean).join(' · ');
  b.innerHTML='<span class="ukey">'+(b.dataset.key||'')+'</span>'+(g==='all'?'<span class="uall">All</span>':rep?'<img class="upic" src="'+portrait(rep,g==='hero')+'" alt="">':'')+
    '<span class="cn">'+(g==='all'?'All':GN[g])+' '+n+'</span><span class="utop">'+(sh?'<small class="csh">'+sh.files+'×'+sh.ranks+'</small>':'')+(gr&&g!=='hero'&&gr.form&&gr.form!=='line'?formIcon(gr.form,18,12):'')+'</span>'+
    (mo&&g!=='all'?'<span class="cmi">'+moraleCardIcons(mo)+'</span>':'')+
    '<span class="ubars"><span class="ub"><i class="chp" style="width:'+pct(hp)+'"></i></span>'+(mo?'<span class="ub"><i class="cmo'+(mo.v<MORALE.waver/100?' low':'')+'" style="width:'+pct(mo.v)+'"></i></span>':'')+(stm!=null?'<span class="ub"><i class="cst'+(stm*FATIGUE.max<FATIGUE.tired?' low':'')+'" style="width:'+pct(stm)+'"></i></span>':'')+'</span>'+
    (fl?'<small class="cf'+(mo&&(mo.rout||mo.waver)?' warn':'')+'">'+fl+'</small>':'');
  b.title=(g==='all'?'Every soldier you have':GN[g]+(gr?' · '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+' wide, '+sh.ranks+' deep':'')+' · '+gr.order:''))+(mo?' · '+moraleWords(mo):'')+(b.dataset.key?' ('+b.dataset.key+')':'');
  b.disabled=g!=='all'&&!n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
}
// the selected unit's details (bottom left): one group in full; several, a line each
function bhudInfo(){
  const el=document.getElementById('bInfo');if(!el||!B)return;const gs=selGroups().filter(g=>grpUnits(g).length);
  if(!gs.length){el.innerHTML='<p class="muted">No one left to command.</p>';return}
  const stat=(g)=>{const m=grpUnits(g),gr=B.groups[g],mo=B.noMorale?null:grpMorale(m),hp=m.reduce((a,u)=>a+u.hp,0),mx=m.reduce((a,u)=>a+u.max,0);return{m,gr,mo,hp,mx}};
  if(gs.length>1){el.innerHTML='<div class="bi-title">'+(B.sel==='all'?'All troops':gs.length+' units')+'</div>'+gs.map(g=>{const S=stat(g);return '<div class="bi-row"><img class="bi-mini" src="'+portrait(g==='hero'?'hero':repOf(S.m),g==='hero')+'" alt=""><span class="bi-n">'+GN[g]+' <b>'+S.m.length+'</b></span><span class="ub"><i class="chp" style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i></span>'+(S.mo?moraleSVG(stateIcon(S.mo.state),null,12):'')+'</div>'}).join('');return}
  const g=gs[0],S=stat(g),gr=S.gr,rep=g==='hero'?'hero':repOf(S.m),st=g==='hero'?B.hero.s:ST[rep],sh=g!=='hero'?grpShape(g):null;
  const flags=[gr.walk?'Walking':'Running',gr.firm?'Holding ground':'',gr.cease?'Cease fire':'',gr.skirmish?'Skirmishing':'',gr.melee===false&&grpUnits(g).some(u=>u.s.range)?'Melee mode off':''].filter(Boolean).join(' · ');
  el.innerHTML='<div class="bi-head"><img class="bi-pic" src="'+portrait(rep,g==='hero')+'" alt=""><div><div class="bi-title">'+(g==='hero'?(P.name||'Your hero'):GN[g])+'</div><small>'+(g==='hero'?'Your hero':S.m.length+' × '+(ST[rep]?ST[rep].n:rep))+'</small>'+
    '<small>'+cap1(gr.order)+(g!=='hero'?' · '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+'×'+sh.ranks:''):'')+'</small></div></div>'+
    '<div class="bi-bar hp"><i style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i><em>Health '+Math.round(S.hp)+' / '+Math.round(S.mx)+'</em></div>'+
    (g==='hero'&&B.hx?'<div class="bi-bar sp"><i style="width:'+pct(B.hx.sp/maxSP())+'"></i><em>Stamina '+Math.round(B.hx.sp)+'</em></div><div class="bi-bar mp"><i style="width:'+pct(B.hx.mp/maxMP())+'"></i><em>Mana '+Math.round(B.hx.mp)+'</em></div>':'')+
    (g!=='hero'&&grpStamina(S.m)!=null?(st=>'<div class="bi-bar st"><i class="'+(st*FATIGUE.max<FATIGUE.tired?'low':'')+'" style="width:'+pct(st)+'"></i><em>Stamina '+Math.round(st*FATIGUE.max)+(st*FATIGUE.max<FATIGUE.spent?' · spent':st*FATIGUE.max<FATIGUE.tired?' · tired':'')+'</em></div>')(grpStamina(S.m)):'')+
    (S.mo?'<div class="bi-bar mo"><i class="'+(S.mo.v<MORALE.waver/100?'low':'')+'" style="width:'+pct(S.mo.v)+'"></i><em>Morale '+Math.round(S.mo.v*100)+' · '+MORALE_STATE[S.mo.state].n+'</em></div>'+
      (S.mo.weak.length?'<div class="bi-weak">'+S.mo.weak.map(w=>'<span title="'+WEAK_N[w]+'">'+moraleSVG(w,null,12)+WEAK_N[w].split(':')[0]+'</span>').join('')+'</div>':''):'')+
    (st?'<div class="bi-stats"><span><b>Damage</b>'+Math.round(st.dmg)+'</span><span><b>'+(st.range?'Range':'Reach')+'</b>'+(st.range||st.reach)+'</span><span><b>Speed</b>'+Math.round(st.spd)+'</span><span><b>Health</b>'+Math.round(st.hp)+'</span>'+(ammoText(S.m)?'<span><b>Ammo</b>'+ammoText(S.m)+'</span>':'')+'</div>':'')+
    (flags?'<small class="bi-flags">'+flags+'</small>':'')+(st&&g!=='hero'?'<small class="vs">'+vsLine(st)+'</small>':'');
}
// the top bar: each side's numbers and strength (health by tier), the field, and what is happening (deploying, paused, speed)
function bhudTop(){
  if(!B)return;const w=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));let me=0,foe=0,nm=0,nf=0;
  for(const u of B.units){if(u.hp<=0)continue;if(u.team===0){nm++;if(!u.rout)me+=w(u)}else{nf++;if(!u.rout)foe+=w(u)}}
  const $id=id=>document.getElementById(id);if(!$id('bMine'))return;$id('bMine').textContent=nm;$id('bFoe').textContent=nf;$id('bPowMe').style.width=pct(me/Math.max(.01,me+foe));
  $id('bField').textContent=B.env.name+(B.opts.tournament?' · tournament':'');
  $id('bStatus').textContent=B.over?(B.retreat?'Withdrawn':B.win?'Victory':'Defeat'):B.deploy?(GUIDE.on?'Deploy: place your band in the shaded zone · Space to begin':'Deploying'):B.paused?(GUIDE.on?'Paused · give your orders · Space to go on':'Paused'):B.speed!==1?B.speed+'×':'';
  document.querySelector('.bfield').classList.toggle('alert',!!(B.deploy||B.paused));
}

/* on the field */
// rings: under every soldier of the groups you have selected (bright; with All, light), under the group you point at (soft); an enemy you point
// at, red (a right-click sets them on it)
function drawSelection(){
  const ring=(u,col,a,w)=>{const k=u.s.big?2:1;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w||1;ctx.beginPath();ctx.ellipse(Math.round(u.x)+.5,Math.round(u.y)+.5,7*k,3.5*k,0,0,7);ctx.stroke();ctx.globalAlpha=1};
  // (All selected: every soldier of yours, a lighter ring, so the field does not turn gold)
  const sel=selGroups(),all=B.sel==='all';
  for(const g of sel)for(const u of grpUnits(g)){const k=u.s.big?2:1;ctx.fillStyle='rgba(255,210,90,.35)';ctx.beginPath();ctx.ellipse(Math.round(u.x),Math.round(u.y),7*k,3.5*k,0,0,7);ctx.fill();ring(u,'#ffe08a',1,2)}
  const h=B.hov;if(!h)return;const mine=rtsUnitAt(h.x,h.y,0),foe=!mine&&rtsUnitAt(h.x,h.y,1);
  if(mine&&mine.grp&&(all||!sel.includes(mine.grp)))for(const u of grpUnits(mine.grp))ring(u,'#ffffff',.7,1.5);
  if(foe){const g=foe.grp;for(const u of g?grpUnits(g):[foe])ring(u,'#ff6a5a',.9,1.5)}
}
/* the reach of shooters, as Total War shows it: the selected groups' (or the group whose icon you point at) on the ground, one
   shaded area round all their shooters with its edge drawn, each man's own range in the arc he shoots into (out of ammo: none); an enemy group of shooters
   you point at, theirs, in red. Point at an enemy with shooters selected: a line of fire from each group, green when all can
   reach, amber when some, red when none, with how many; a flat shot (a crossbow, a sling, a bolt) whose line crosses trees,
   which stop flat shots, dashed (arrows arc over them); no words, only the reach and the lines */
const FIRE={fill:.1,edge:1.5,blue:'120,190,255',red:'255,110,95',kinds:['120,190,255','140,230,160','240,200,110','220,150,255'],foes:['255,110,95','255,170,90','255,120,190','240,220,120']};
const shooters=g=>grpUnits(g).filter(u=>!u.rout&&!u.empty&&u.s.range>0);
function rangeLayer(){const c=B.rangeCv||(B.rangeCv=document.createElement('canvas'));if(c.width!==BW||c.height!==BH){c.width=BW;c.height=BH}return c}
// one area round them all: the circles filled, then their insides cut a little smaller, leaving the outer edge
function drawReach(us,col){
  if(!us.length)return;const c=rangeLayer(),g=c.getContext('2d');g.clearRect(0,0,BW,BH);
  // (each man's reach: the fan in front of him he can shoot into (battle.js SHOOT.arc), or all round for those who shoot all round;
  // drawn smaller and narrower to cut out its inside, leaving its edge)
  // (the inside of a fan: its point moved forward by sh so its sides stand in by -r0, and its radius cut by that too, so the far edge stays)
  const disc=(r0)=>{g.beginPath();for(const u of us){if(roundFire(u)){const r=Math.max(0,u.s.range+r0);g.moveTo(u.x+r,u.y);g.arc(u.x,u.y,r,0,6.283);continue}
    const a=arcAim(u),sh=r0?-r0/Math.sin(SHOOT.arc/2):0,r=Math.max(0,u.s.range+r0-sh),ox=Math.cos(a)*sh,oy=Math.sin(a)*sh;g.moveTo(u.x+ox,u.y+oy);g.arc(u.x+ox,u.y+oy,r,a-SHOOT.arc/2,a+SHOOT.arc/2);g.closePath()}g.fill()};
  g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+',1)';disc(0);g.globalCompositeOperation='destination-out';disc(-FIRE.edge);
  g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+','+FIRE.fill+')';disc(-FIRE.edge);
  ctx.save();ctx.globalAlpha=.75;ctx.drawImage(c,0,0);ctx.restore()}
function reachByKind(us,cols){
  const kinds=[...new Set(us.map(u=>u.type))];kinds.forEach((k,i)=>{const m=us.filter(u=>u.type===k),col=cols[i%cols.length];drawReach(m,col);
  })}
// the trees a straight line from a to b passes through
const treesOn=(a,b)=>B.obs.filter(o=>{if(o.kind!=='tree')return false;const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy||1,k=clamp(((o.x-a.x)*dx+(o.y-6-a.y)*dy)/L,0,1);return Math.hypot(a.x+dx*k-o.x,a.y+dy*k-(o.y-6))<o.r+2}).length;
function drawFireRange(){
  if(B.deploy&&!B.sel)return;
  const sel=selGroups().filter(g=>shooters(g).length),ic=B.iconHov&&GRPS.includes(B.iconHov)&&shooters(B.iconHov).length?[B.iconHov]:[];
  // (each kind of shooter its own reach, its own colour, its name and range at its far edge: a group of bowmen and crossbowmen shows two)
  const mineShow=[...new Set([...sel,...ic])];reachByKind(mineShow.flatMap(shooters),FIRE.kinds);
  const h=B.hov;if(!h)return;const foe=rtsUnitAt(h.x,h.y,1);if(!foe)return;
  // (their reach, when you point at their shooters)
  if(foe.grp&&shooters(foe.grp).length&&!sel.length)reachByKind(shooters(foe.grp),FIRE.foes);
  else if(!foe.grp&&foe.s.range>0&&!sel.length)reachByKind([foe],FIRE.foes);
  // (your line of fire at them)
  for(const g of sel){const m=shooters(g),c={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},rn=m.filter(u=>Math.hypot(foe.x-u.x,foe.y-u.y)<=u.s.range),n=rn.filter(u=>inArc(u,foe)).length,turn=rn.length-n;
    // (in range but outside their arc: they must turn first)
    const col=n===m.length?'143,224,138':n||turn?'232,185,74':FIRE.red,flat=m.some(u=>u.s.flat||u.s.magic),tr=flat?treesOn(c,foe):0;
    ctx.save();ctx.strokeStyle='rgba('+col+',.9)';ctx.lineWidth=1;ctx.setLineDash(n&&!tr?[]:[3,3]);ctx.beginPath();ctx.moveTo(c.x,c.y-4);ctx.lineTo(foe.x,foe.y-6);ctx.stroke();ctx.restore();
  }
}
// lines from each selected group to where it is going: a move (gold, with its men's places there, faint), the next waypoints,
// an attack (red, to the one it is set on, or to those it charges), withdrawing (blue, straight back to your edge)
function drawOrderLines(){
  if(B.deploy)return;// (every selected group, All included)
  const line=(a,b,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash(dash||[4,3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
    const an=Math.atan2(b.y-a.y,b.x-a.x);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-Math.cos(an-.5)*5,b.y-Math.sin(an-.5)*5);ctx.lineTo(b.x-Math.cos(an+.5)*5,b.y-Math.sin(an+.5)*5);ctx.fill()};
  for(const g of selGroups()){const m=grpUnits(g).filter(u=>!u.rout);if(!m.length)continue;const gr=B.groups[g],c={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length};
    if(gr.tgt&&gr.tgt.hp>0){line(c,gr.tgt,'rgba(255,106,90,.9)',[]);ctx.strokeStyle='#ff6a5a';ctx.beginPath();ctx.ellipse(gr.tgt.x,gr.tgt.y,8,4,0,0,7);ctx.stroke();continue}
    if(gr.order==='charge'){const ts=[...new Set(m.map(u=>u.tgt).filter(t=>t&&t.hp>0))];if(ts.length){const t={x:ts.reduce((a,u)=>a+u.x,0)/ts.length,y:ts.reduce((a,u)=>a+u.y,0)/ts.length};if(Math.hypot(t.x-c.x,t.y-c.y)>12)line(c,t,'rgba(255,106,90,.7)')}continue}
    if(gr.order==='withdraw'&&B.exit){line(c,exitFor(c),'rgba(111,168,224,.9)');continue}
    const a={x:gr.ax,y:gr.ay};
    if(Math.hypot(a.x-c.x,a.y-c.y)>14){line(c,a,'rgba(255,210,90,.85)');ctx.fillStyle='rgba(255,210,90,.35)';for(const u of m)ctx.fillRect(Math.round(a.x+(u.sx||0))-1,Math.round(a.y+(u.sy||0))-1,2,2)}
    let p=a;for(const w of gr.queue||[]){line(p,w,'rgba(255,210,90,.55)');p=w}}
}
