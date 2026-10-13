'use strict';
/* ---------- the battle HUD, laid out as in Total War (Ashmark.html #bbar): the balance of power at the top middle, time at the top
   right, the selected unit's details at the bottom left, the orders over a row of unit cards at the bottom middle. On the field:
   rings under the soldiers you have selected, a softer one under the group you point at, and lines from each selected group to
   where it is going (or whom it is set on). ---------- */
// the order and flag icons: 9×9 pixel maps (a: the button's colour, b: dimmer)
const ORDER_ICON={
  hold:['.aaaaa...','.abbba...','.aaaaa...','.a.......','.a.......','.a.......','.a.......','aaa......','.........'],
  follow:['.........','......bb.','.....bbbb','..a...bb.','.aaa..bb.','aaaaa.b.b','..a......','..a......','.........'],
  charge:['.........','a...a....','.a...a...','..a...a..','...a...a.','..a...a..','.a...a...','a...a....','.........'],
  advance:['.........','....a....','....aa...','aaaaaaa..','aaaaaaaa.','aaaaaaa..','....aa...','....a....','.........'],
  halt:['.........','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.aa...aa.','.........'],
  withdraw:['.........','....a....','...aa....','..aaaaaaa','.aaaaaaaa','..aaaaaaa','...aa....','....a....','.........'],
  walk:['.........','.aa......','.aa......','.aa......','.....aa..','.....aa..','.....aa..','.........','.........'],
  firm:['.aaaaaaa.','.abbbbba.','.abbbbba.','.abbbbba.','..abbba..','..abbba..','...aba...','....a....','.........'],
  fire:['.....aaaa','.......aa','......a.a','.....a...','....a....','...a.....','b.a......','.b.......','b.b......'],
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
function portrait(type,hero){const k=(hero?'hero:':'')+type;if(!PORTRAITS[k]){try{PORTRAITS[k]=unitSprite(type,0,!!hero,0).toDataURL()}catch(e){PORTRAITS[k]=''}}return PORTRAITS[k]}
// the kind most of a group is (its card's picture and its numbers)
function repOf(m){const c={};for(const u of m)c[u.type]=(c[u.type]||0)+1;let best=null;for(const k in c)if(!best||c[k]>c[best])best=k;return best}
const pct=x=>Math.round(clamp(x,0,1)*100)+'%';
// a unit card: its key, picture, name and count, shape and formation, morale icons, health and morale
function bhudCard(b,g){
  const m=g==='all'?GRPS.flatMap(grpUnits):grpUnits(g),n=m.length,on=B.sel===g||Array.isArray(B.sel)&&B.sel.includes(g),gr=B.groups[g];
  const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),mo=B.noMorale?null:grpMorale(m),sh=g!=='all'&&g!=='hero'&&gr?grpShape(g):null,rep=g==='hero'?'hero':repOf(m);
  const fl=[gr&&gr.walk?'walk':'',gr&&gr.firm?'firm':'',gr&&gr.fire===false?'no fire':'',gr&&gr.skirmish?'skirm':'',mo&&mo.rout?mo.rout+' running':''].filter(Boolean).join(' · ');
  b.innerHTML='<span class="ukey">'+(b.dataset.key||'')+'</span>'+(g==='all'?'<span class="uall">All</span>':rep?'<img class="upic" src="'+portrait(rep,g==='hero')+'" alt="">':'')+
    '<span class="cn">'+(g==='all'?'All':GN[g])+' '+n+'</span><span class="utop">'+(sh?'<small class="csh">'+sh.files+'×'+sh.ranks+'</small>':'')+(gr&&g!=='hero'&&gr.form&&gr.form!=='line'?formIcon(gr.form,18,12):'')+'</span>'+
    (mo&&g!=='all'?'<span class="cmi">'+moraleCardIcons(mo)+'</span>':'')+
    '<span class="ubars"><span class="ub"><i class="chp" style="width:'+pct(hp)+'"></i></span>'+(mo?'<span class="ub"><i class="cmo'+(mo.v<MORALE.waver/100?' low':'')+'" style="width:'+pct(mo.v)+'"></i></span>':'')+'</span>'+
    (fl?'<small class="cf'+(mo&&(mo.rout||mo.waver)?' warn':'')+'">'+fl+'</small>':'');
  b.title=(g==='all'?'Every soldier you have':GN[g]+(gr?' · '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+' wide, '+sh.ranks+' deep':'')+' · '+gr.order:''))+(mo?' · '+moraleWords(mo):'')+' ('+(b.dataset.key||'')+')';
  b.disabled=g!=='all'&&!n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
}
// the selected unit's details (bottom left): one group in full; several, a line each
function bhudInfo(){
  const el=document.getElementById('bInfo');if(!el||!B)return;const gs=selGroups().filter(g=>grpUnits(g).length);
  if(!gs.length){el.innerHTML='<p class="muted">No one left to command.</p>';return}
  const stat=(g)=>{const m=grpUnits(g),gr=B.groups[g],mo=B.noMorale?null:grpMorale(m),hp=m.reduce((a,u)=>a+u.hp,0),mx=m.reduce((a,u)=>a+u.max,0);return{m,gr,mo,hp,mx}};
  if(gs.length>1){el.innerHTML='<div class="bi-title">'+(B.sel==='all'?'All troops':gs.length+' units')+'</div>'+gs.map(g=>{const S=stat(g);return '<div class="bi-row"><img class="bi-mini" src="'+portrait(g==='hero'?'hero':repOf(S.m),g==='hero')+'" alt=""><span class="bi-n">'+GN[g]+' <b>'+S.m.length+'</b></span><span class="ub"><i class="chp" style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i></span>'+(S.mo?moraleSVG(stateIcon(S.mo.state),MORALE_STATE[S.mo.state].c,12):'')+'</div>'}).join('');return}
  const g=gs[0],S=stat(g),gr=S.gr,rep=g==='hero'?'hero':repOf(S.m),st=g==='hero'?B.hero.s:ST[rep],sh=g!=='hero'?grpShape(g):null;
  const flags=[gr.walk?'Walking':'Running',gr.firm?'Holding ground':'',gr.fire===false?'Holding fire':'',gr.skirmish?'Skirmishing':''].filter(Boolean).join(' · ');
  el.innerHTML='<div class="bi-head"><img class="bi-pic" src="'+portrait(rep,g==='hero')+'" alt=""><div><div class="bi-title">'+(g==='hero'?(P.name||'Your hero'):GN[g])+'</div><small>'+(g==='hero'?'Your hero':S.m.length+' × '+(ST[rep]?ST[rep].n:rep))+'</small>'+
    '<small>'+cap1(gr.order)+(g!=='hero'?' · '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+'×'+sh.ranks:''):'')+'</small></div></div>'+
    '<div class="bi-bar hp"><i style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i><em>Health '+Math.round(S.hp)+' / '+Math.round(S.mx)+'</em></div>'+
    (S.mo?'<div class="bi-bar mo"><i class="'+(S.mo.v<MORALE.waver/100?'low':'')+'" style="width:'+pct(S.mo.v)+'"></i><em>Morale '+Math.round(S.mo.v*100)+' · '+MORALE_STATE[S.mo.state].n+'</em></div>'+
      (S.mo.weak.length?'<div class="bi-weak">'+S.mo.weak.map(w=>'<span title="'+WEAK_N[w]+'">'+moraleSVG(w,null,12)+WEAK_N[w].split(':')[0]+'</span>').join('')+'</div>':''):'')+
    (st?'<div class="bi-stats"><span><b>Damage</b>'+Math.round(st.dmg)+'</span><span><b>'+(st.range?'Range':'Reach')+'</b>'+(st.range||st.reach)+'</span><span><b>Speed</b>'+Math.round(st.spd)+'</span><span><b>Health</b>'+Math.round(st.hp)+'</span></div>':'')+
    (flags?'<small class="bi-flags">'+flags+'</small>':'')+(st&&g!=='hero'?'<small class="vs">'+vsLine(st)+'</small>':'');
}
// the top bar: each side's numbers and strength (health by tier), the field, and what is happening (deploying, paused, speed)
function bhudTop(){
  if(!B)return;const w=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));let me=0,foe=0,nm=0,nf=0;
  for(const u of B.units){if(u.hp<=0)continue;if(u.team===0){nm++;if(!u.rout)me+=w(u)}else{nf++;if(!u.rout)foe+=w(u)}}
  const $id=id=>document.getElementById(id);if(!$id('bMine'))return;$id('bMine').textContent=nm;$id('bFoe').textContent=nf;$id('bPowMe').style.width=pct(me/Math.max(.01,me+foe));
  $id('bField').textContent=B.env.name+(B.opts.tournament?' · tournament':'');
  $id('bStatus').textContent=B.over?(B.retreat?'Withdrawn':B.win?'Victory':'Defeat'):B.deploy?'Deploy: place your band in the shaded zone · Space to begin':B.paused?'Paused · give your orders · Space to go on':B.speed!==1?B.speed+'×':'';
  document.querySelector('.bfield').classList.toggle('alert',!!(B.deploy||B.paused));
}

/* on the field */
// rings: under every soldier of the groups you have selected (bright; with All, light), under the group you point at (soft); an enemy you point
// at, red (a right-click sets them on it)
function drawSelection(){
  const ring=(u,col,a,w)=>{const k=u.s.big?2:1;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w||1;ctx.beginPath();ctx.ellipse(Math.round(u.x)+.5,Math.round(u.y)+.5,7*k,3.5*k,0,0,7);ctx.stroke();ctx.globalAlpha=1};
  // (All selected: every soldier of yours, a lighter ring, so the field does not turn gold)
  const sel=selGroups(),all=B.sel==='all';
  if(all){for(const g of sel)for(const u of grpUnits(g))ring(u,'#ffe08a',.45)}
  else for(const g of sel)for(const u of grpUnits(g)){const k=u.s.big?2:1;ctx.fillStyle='rgba(255,210,90,.35)';ctx.beginPath();ctx.ellipse(Math.round(u.x),Math.round(u.y),7*k,3.5*k,0,0,7);ctx.fill();ring(u,'#ffe08a',1,2)}
  const h=B.hov;if(!h)return;const mine=rtsUnitAt(h.x,h.y,0),foe=!mine&&rtsUnitAt(h.x,h.y,1);
  if(mine&&mine.grp&&(all||!sel.includes(mine.grp)))for(const u of grpUnits(mine.grp))ring(u,'#ffffff',.7,1.5);
  if(foe){const g=foe.grp;for(const u of g?grpUnits(g):[foe])ring(u,'#ff6a5a',.9,1.5)}
}
// lines from each selected group to where it is going: a move (gold, with its men's places there, faint), the next waypoints,
// an attack (red, to the one it is set on, or to those it charges), following your hero (green), withdrawing (blue)
function drawOrderLines(){
  if(B.deploy)return;// (every selected group, All included)
  const line=(a,b,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash(dash||[4,3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
    const an=Math.atan2(b.y-a.y,b.x-a.x);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-Math.cos(an-.5)*5,b.y-Math.sin(an-.5)*5);ctx.lineTo(b.x-Math.cos(an+.5)*5,b.y-Math.sin(an+.5)*5);ctx.fill()};
  for(const g of selGroups()){const m=grpUnits(g).filter(u=>!u.rout);if(!m.length)continue;const gr=B.groups[g],c={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length};
    if(gr.tgt&&gr.tgt.hp>0){line(c,gr.tgt,'rgba(255,106,90,.9)',[]);ctx.strokeStyle='#ff6a5a';ctx.beginPath();ctx.ellipse(gr.tgt.x,gr.tgt.y,8,4,0,0,7);ctx.stroke();continue}
    if(gr.order==='charge'){const ts=[...new Set(m.map(u=>u.tgt).filter(t=>t&&t.hp>0))];if(ts.length){const t={x:ts.reduce((a,u)=>a+u.x,0)/ts.length,y:ts.reduce((a,u)=>a+u.y,0)/ts.length};if(Math.hypot(t.x-c.x,t.y-c.y)>12)line(c,t,'rgba(255,106,90,.7)')}continue}
    if(gr.order==='follow'&&B.hero&&B.hero.hp>0){if(Math.hypot(B.hero.x-c.x,B.hero.y-c.y)>30)line(c,B.hero,'rgba(120,196,116,.8)');continue}
    if(gr.order==='withdraw'&&B.exit){line(c,B.exit,'rgba(111,168,224,.9)');continue}
    const a={x:gr.ax,y:gr.ay};
    if(Math.hypot(a.x-c.x,a.y-c.y)>14){line(c,a,'rgba(255,210,90,.85)');ctx.fillStyle='rgba(255,210,90,.35)';for(const u of m)ctx.fillRect(Math.round(a.x+(u.sx||0))-1,Math.round(a.y+(u.sy||0))-1,2,2)}
    let p=a;for(const w of gr.queue||[]){line(p,w,'rgba(255,210,90,.55)');p=w}}
}
