'use strict';
/* ---------- the battle HUD, laid out as in Total War (Ashmark.html #bbar): the balance of power at the top middle, time at the top
   right, the selected unit's details at the bottom left, the orders over a row of unit cards at the bottom middle. On the field:
   rings under the soldiers you have selected, a softer one under the group you point at, and lines from each selected group to
   where it is going (or whom it is set on). ---------- */
// the order and flag icons: 9×9 pixel maps (a: the button's colour, b: dimmer), on the buttons only (the cards: badgeSVG)
const ORDER_ICON={
  shieldWall:['.aaaaaaa.','.a..a..a.','.a..a..a.','.aaaaaaa.','.a..a..a.','.a..a..a.','..aaaaa..','...aaa...','....a....'],
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
  skirmish:['.........','..a...b..','.aa...bb.','aaaaa.bbb','.aa...bb.','..a...b..','.........','.........','.........'],
  // (attack-move: an arrow on, crossed blades where it ends)
  amove:['.....a..a','......aa.','......aa.','.b...a..a','bbb......','.b.......','.b.......','.b.......','.b.......']
};
function pixelSVG(rows,size,cls){const s=rows.length;let r='';rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="currentColor"'+(c==='b'?' opacity=".5"':'')+'/>'}));
  return '<svg class="'+(cls||'oico')+'" viewBox="0 0 '+s+' '+s+'" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'}
// the order, flag and formation buttons: their icon and key (once, at load)
function bhudInit(){
  document.querySelectorAll('.obtn[data-order],.obtn[data-flag]').forEach(b=>{const k=b.dataset.order||b.dataset.flag;b.innerHTML=pixelSVG(ORDER_ICON[k],18)+'<span class="k">'+(b.dataset.key||'')+'</span>';b.setAttribute('aria-label',b.title)});
  {const b=document.getElementById('bAmove');if(b){b.innerHTML=pixelSVG(ORDER_ICON.amove,18)+'<span class="k">'+(b.dataset.key||'')+'</span>';b.setAttribute('aria-label',b.title)}}// (attack-move: commands.js armAttackMove)
  document.querySelectorAll('.obtn[data-form]').forEach(b=>{const F=FORMS[b.dataset.form];b.innerHTML=formIcon(b.dataset.form,24,16)+'<span class="k">'+F.key+'</span>';b.title=F.n+': '+F.d+' ('+F.key+')';b.setAttribute('aria-label',b.title)});
}
// a unit's portrait: its sprite, drawn once into a picture (cached by kind)
const PORTRAITS={};
function portrait(type,hero){return spritePic((hero?'hero:':'')+type,()=>unitSprite(type,0,!!hero,0))}
// any figure's picture the same way (mk: its sprite cell): a worker at his trade (workerPic), a townsperson (personPic: the
// smith, the innkeeper, a merchant…)
function spritePic(k,mk){if(!PORTRAITS[k]){try{const sp=mk(),n=sp.width,S=Math.min(n,Math.max(sp.cw||n,(sp.ch||n)+3));// (the figure itself, cropped from its cell: feet at the bottom, centred)
    PORTRAITS[k]=mkc(S,S,g=>g.drawImage(sp,(n-S)>>1,n-S,S,S,0,0,S,S)).toDataURL()}catch(e){PORTRAITS[k]=''}}return PORTRAITS[k]}
const workerPic=(job,race,v)=>spritePic('wk:'+job+':'+race+':'+(v??1),()=>workerSprite(job,0,race,v??1));
const personPic=(look,race,v)=>spritePic('ps:'+look+':'+race+':'+(v||0),()=>personSprite(look,race,v||0,0));
// the kind most of a group is (its card's picture and its numbers)
function repOf(m){const c={};for(const u of m)c[u.type]=(c[u.type]||0)+1;let best=null;for(const k in c)if(!best||c[k]>c[best])best=k;return best}
const pct=x=>Math.round(clamp(x,0,1)*100)+'%';
// (its shooters' shots left, of all they carried: {left, tot}, said '31/40'; none for fighters and casters)
const quiverLeft=m=>{const sh=m.filter(u=>u.s.range||u.empty);if(!sh.length||sh.every(u=>!isFinite(quiverOf(u.s))&&!u.empty))return null;const tot=sh.reduce((a,u)=>a+(isFinite(quiverOf(u.s))?quiverOf(u.s):0),0),left=sh.reduce((a,u)=>a+(u.empty?0:u.ammo==null?quiverOf(u.s):u.ammo),0);return isFinite(tot)&&tot?{left,tot}:null};
const ammoText=m=>{const q=quiverLeft(m);return q?q.left+'/'+q.tot:''};
function groupAbilityText(g){const gr=B.groups[g],m=grpUnits(g);if(!gr)return '';const eligible=m.filter(shieldEligible).length,parts=[];
  if(eligible)parts.push('Shield wall: '+eligible+'/'+m.length+' eligible, '+m.filter(shieldWallActive).length+' active'+(gr.shieldWall?'':' (off)'));
  if(gr.form==='wedge'){const n=wedgeMembers(g).length;parts.push('Wedge: '+n+' formed cavalry, +'+Math.round(wedgeBonus(n)*1000)/10+'% charge')}
  return parts.join(' · ')}
function moraleContextText(mo){if(!mo||mo.cohesion==null)return '';return (mo.weak.includes('outmatched')?'Outmatched · ':'')+(mo.weak.includes('outnumbered')?'Locally overwhelmed · ':'')+'Cohesion '+Math.round(mo.cohesion*100)+'%'+(mo.lossStrain>0.1?' · Recent-loss pressure '+mo.lossStrain.toFixed(1):'')}
/* a unit card, all pictures and no words: its key, its soldiers' portrait (All: the troops icon), how many, its shape and
   formation, up to CARD.show status icons, its health, morale and stamina bars. The words are in its tooltip (title and
   aria-label; a long press on a phone shows them) and in each icon's own (an SVG title). Its statuses, most pressing first
   (cardStatus; the rest only in the words): 0 its morale failing (and how many run or break), 1 its order (none shown while it
   just holds), 2 its pace while on the move, 3 an ability on, 4 out of shots or spent, 5 its flags, 6 a character falling back,
   7 few shots left or tired, 8 hidden from the enemy or in woods, 9 confident, 10 what weakens it */
const CARD={show:4,low:.25,moved:14};
// a status: p its rank, k its key (data-st, and its badge: moraleicons.js GLYPH, rimmed by its kind, BADGE_KIND), svg its badge
// (none: in the words only), w its words; n a count beside it, tone its kind (si-g good, si-w a warning, si-b bad), s its words
// in the card's tooltip (w, lower case)
function cardStatus(g,m,mo,stm){
  const gr=g!=='all'&&B.groups[g],out=[],add=(p,k,w,o,shown=true)=>out.push({p,k,svg:shown?badgeSVG(k,11):null,w,s:w[0].toLowerCase()+w.slice(1),...o});
  if(gr?aiHas(gr):g==='all'&&aiAll())add(-1,'ai','The AI in command (A: take '+(gr?'it':'them')+' back)');// (first, always shown: deploy.js)
  if(mo){const st=stateIcon(mo.state);
    if(st)add(0,st,MORALE_STATE[mo.state].n+((st==='routing'||st==='shattered')&&mo.rout?': '+mo.rout+' running':st==='breaking'&&mo.breaking?': '+mo.breaking+' breaking':''));
    if(mo.rout&&st!=='routing'&&st!=='shattered')add(0,'routing',mo.rout+' running',{n:mo.rout});
    if(mo.breaking&&st!=='breaking')add(0,'breaking',mo.breaking+' breaking',{n:mo.breaking})}
  if(gr){const live=m.filter(u=>!u.rout),c=live.length?{x:live.reduce((a,u)=>a+u.x,0)/live.length,y:live.reduce((a,u)=>a+u.y,0)/live.length}:null;
    const moving=gr.order!=='hold'||gr.hasTarget||!!(gr.queue&&gr.queue.length)||!!c&&Math.hypot(gr.ax-c.x,gr.ay-c.y)>CARD.moved,tg=gr.hasTarget&&gr.targetGroupId&&B.groups[gr.targetGroupId];
    if(gr.order==='withdraw')add(1,'withdraw','Withdrawing',{tone:'si-w'});
    else if(gr.hasTarget)add(1,'attack','Attacking'+(tg?': '+calloutName(tg):'')+(gr.amove?' (attack-move)':''),{tone:'si-b'});
    else if(gr.order==='charge')add(1,'charge','Charging',{tone:'si-b'});
    else if(gr.order==='advance')add(1,'advance','Advancing');
    else if(gr.amove)add(1,'amove',gr.amove.at?'Attack-move: fighting on the way':'Attack-move: fighting what they meet',{tone:'si-b'});
    else add(1,moving?'move':'hold',moving?'Moving':'Holding',null,moving);
    const walk=walking(gr);add(2,walk?'walk':'run',walk?'At a walk':'At a run',null,moving);
    for(const id of UNIT_ABIL_ORDER)if(abilityActive(gr,id))add(3,id,UNIT_ABILITIES[id].n+' on',{tone:'si-g'});
    const q=quiverLeft(m),sta=stm==null?null:stm*FATIGUE.max;
    if(q&&!q.left)add(4,'noammo','Out of ammunition',{tone:'si-b'});
    if(sta!=null&&sta<FATIGUE.spent)add(4,'spent','Exhausted: stamina '+Math.round(sta));
    if(gr.shieldWall)add(5,'shieldWall','Shield wall');
    if(gr.firm)add(5,'firm','Holding their ground');
    if(gr.cease)add(5,'cease','Cease fire');
    if(gr.skirmish)add(5,'skirmish','Skirmishing');
    if(gr.melee&&m.some(u=>u.s.range))add(5,'melee','Melee mode: bows put away');
    // (read off its state, never made: charmind.js champ would roll a new one)
    if(m.some(u=>{const S=u.hero?B.hx:u.ch;return S&&S.fallBack}))add(6,'fallback','Falling back',{tone:'si-w'});
    if(q&&q.left&&q.left<q.tot*CARD.low)add(7,'ammo','Low on ammunition: '+q.left+'/'+q.tot,{tone:'si-w'});
    if(sta!=null&&sta>=FATIGUE.spent&&sta<FATIGUE.tired)add(7,'tired','Tired: stamina '+Math.round(sta));
    if(sightOn()&&m.length){const hid=m.every(u=>!seenBy(1,u));add(8,hid?'hidden':'seen',hid?'Hidden from the enemy':'Seen by the enemy',{tone:'si-g'},hid)}
    if(m.filter(inWood).length*2>m.length)add(8,'woods','In woods',{tone:'si-g'})}
  if(mo){if(mo.stand)add(3,'standfast','Standing fast (Stand Fast!)');// (commandpowers.js)
    if(mo.confident)add(9,'confident','Confident',{s:'confident'});
    for(const w of mo.weak)if(w!=='tired'||!out.some(o=>o.k==='tired'||o.k==='spent'))add(10,w,WEAK_N[w],{s:WEAK_N[w].split(':')[0].toLowerCase()})}
  return out.sort((a,b)=>a.p-b.p);
}
// a status icon on a card: its words its tooltip (an SVG title, kept when it has its own)
const cardIco=o=>'<i class="si'+(o.tone?' '+o.tone:'')+'" data-st="'+o.k+'">'+(o.svg.includes('<title>')?o.svg:o.svg.replace('>','><title>'+htmlText(o.w)+'</title>'))+(o.n?'<b>'+o.n+'</b>':'')+'</i>';
function bhudCards(){
  const row=document.querySelector('.bcards');if(!row)return;
  // (a long press on a card, on a phone: its words, the tooltip a mouse would show; input.js holdCard)
  if(!row.dataset.hold){row.dataset.hold='1';let tm=0;const off=()=>clearTimeout(tm);
    row.addEventListener('pointerdown',e=>{const b=e.pointerType==='touch'&&e.target.closest('.ucard');if(!b)return;off();tm=setTimeout(()=>{if(b.isConnected&&b.title)holdCard('<p>'+htmlText(b.title)+'</p>',e.clientX,e.clientY)},TOUCH.hold)});
    ['pointerup','pointercancel','pointerleave'].forEach(t=>row.addEventListener(t,off))}
  const ids=['all',...playerGroups()],signature=ids.join('|');if(row.dataset.groups===signature)return;
  row.dataset.groups=signature;row.classList.toggle('many',ids.length>8);row.replaceChildren();ids.forEach((id,i)=>{const b=document.createElement('button');b.type='button';b.className='ucard'+(id==='all'?' all':'');b.dataset.grp=id;b.dataset.key=i?String(i%10):'';row.appendChild(b)});
}
function bhudCard(b,g){
  const m=g==='all'?playerGroups().flatMap(grpUnits):grpUnits(g),n=m.length,on=B.sel===g||Array.isArray(B.sel)&&B.sel.includes(g),gr=B.groups[g];
  const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),mo=B.noMorale?null:grpMorale(m),sh=g!=='all'&&g!=='hero'&&gr?grpShape(g):null,rep=g==='hero'?'hero':repOf(m),stm=grpStamina(m);
  const st=cardStatus(g,m,mo,stm),vis=st.filter(o=>o.svg).slice(0,CARD.show);
  // (built again only when it changes, so a tooltip under the pointer stays; the bars on their own, as they move each moment)
  const head='<span class="ukey">'+(b.dataset.key||'')+'</span>'+(g==='all'?'<span class="uall">'+icon('troops',18)+'<b>'+n+'</b></span>':(rep?'<img class="upic" src="'+portrait(rep,g==='hero')+'" alt="">':'')+'<span class="ucount">'+n+'</span>')+
    '<span class="utop">'+(sh?'<small class="csh">'+sh.files+'×'+sh.ranks+'</small>':'')+(gr&&g!=='hero'&&gr.form&&gr.form!=='line'?formIcon(gr.form,18,12):'')+'</span>'+(vis.length?'<span class="cmi">'+vis.map(cardIco).join('')+'</span>':'');
  if(b.cardHead!==head){b.cardHead=head;b.innerHTML=head+'<span class="ubars"></span>'}
  const bars='<span class="ub"><i class="chp" style="width:'+pct(hp)+'"></i></span>'+(mo?'<span class="ub"><i class="cmo'+(mo.v<MORALE.waver/100?' low':'')+'" style="width:'+pct(mo.v)+'"></i></span>':'')+(stm!=null?'<span class="ub"><i class="cst'+(stm*FATIGUE.max<FATIGUE.tired?' low':'')+'" style="width:'+pct(stm)+'"></i></span>':''),bb=b.querySelector('.ubars');
  if(bb.cardBars!==bars){bb.cardBars=bars;bb.innerHTML=bars}
  b.title=(g==='all'?'All troops: '+n:groupName(g)+': '+n+(gr&&g!=='hero'?' · '+FORMS[gr.form||'line'].n.toLowerCase()+(sh?' '+sh.files+' wide, '+sh.ranks+' deep':''):''))+(mo?' · morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')':'')+
    (st.length?' · '+st.map(o=>o.s).join(' · '):'')+(g!=='all'&&groupAbilityText(g)?' · '+groupAbilityText(g):'')+(b.dataset.key?' ('+b.dataset.key+')':'');
  b.setAttribute('aria-label',b.title);b.disabled=g!=='all'&&!n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
}
// the selected unit's details (bottom left): one group in full; several, a line each
function bhudInfo(){
  const el=document.getElementById('bInfo');if(!el||!B)return;const gs=selGroups().filter(g=>grpUnits(g).length);
  if(!gs.length){el.innerHTML='<p class="muted">No one left to command.</p>';return}
  const stat=(g)=>{const m=grpUnits(g),gr=B.groups[g],mo=B.noMorale?null:grpMorale(m),hp=m.reduce((a,u)=>a+u.hp,0),mx=m.reduce((a,u)=>a+u.max,0);return{m,gr,mo,hp,mx}};
  if(gs.length>1){el.innerHTML='<div class="bi-title">'+(B.sel==='all'?'All troops':gs.length+' units')+'</div>'+gs.map(g=>{const S=stat(g);return '<div class="bi-row"><img class="bi-mini" src="'+portrait(g==='hero'?'hero':repOf(S.m),g==='hero')+'" alt=""><span class="bi-n">'+htmlText(groupName(g))+' <b>'+S.m.length+'</b></span><span class="ub"><i class="chp" style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i></span>'+(aiHas(S.gr)?badgeSVG('ai',12):'')+(S.mo?badgeSVG(stateIcon(S.mo.state),12)+(S.mo.confident?badgeSVG('confident',12):''):'')+'</div>'}).join('');return}
  const g=gs[0],S=stat(g),gr=S.gr,rep=g==='hero'?'hero':repOf(S.m),st=g==='hero'?B.hero.s:ST[rep]||S.m[0].s,sh=g!=='hero'?grpShape(g):null;
  const flags=[S.mo&&S.mo.breaking?'Breaking: '+S.mo.breaking+' (morale collapse)':'',gr.walk?'Walking':'Running',gr.firm?'Holding ground':'',gr.cease?'Cease fire':'',gr.skirmish?'Skirmishing':'',gr.melee===false&&grpUnits(g).some(u=>u.s.range)?'Melee mode off':'',S.mo?.confident?'Confident: local superiority':''].filter(Boolean).join(' · ');
  el.innerHTML='<div class="bi-head"><img class="bi-pic" src="'+portrait(rep,g==='hero')+'" alt=""><div><div class="bi-title">'+htmlText(g==='hero'&&!gr.customName?(P.name||'Your hero'):groupName(g))+'</div><small>'+(g==='hero'?'Your hero':S.m.length+' × '+(ST[rep]?ST[rep].n:rep))+'</small>'+
    '<small>'+(aiHas(gr)?'AI · ':'')+(gr.amove?'Attack-move':cap1(gr.order))+(g!=='hero'?' · '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+'×'+sh.ranks:''):'')+'</small></div></div>'+
    '<div class="bi-bar hp"><i style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i><em>Health '+Math.round(S.hp)+' / '+Math.round(S.mx)+'</em></div>'+
    (g==='hero'&&B.hx?'<div class="bi-bar sp"><i style="width:'+pct(B.hx.sp/maxSP())+'"></i><em>Stamina '+Math.round(B.hx.sp)+'</em></div><div class="bi-bar mp"><i style="width:'+pct(B.hx.mp/maxMP())+'"></i><em>Mana '+Math.round(B.hx.mp)+'</em></div>':'')+
    (g!=='hero'&&grpStamina(S.m)!=null?(st=>'<div class="bi-bar st"><i class="'+(st*FATIGUE.max<FATIGUE.tired?'low':'')+'" style="width:'+pct(st)+'"></i><em>Stamina '+Math.round(st*FATIGUE.max)+(st*FATIGUE.max<FATIGUE.spent?' · spent':st*FATIGUE.max<FATIGUE.tired?' · tired':'')+'</em></div>')(grpStamina(S.m)):'')+
    (S.mo?'<div class="bi-bar mo"><i class="'+(S.mo.v<MORALE.waver/100?'low':'')+'" style="width:'+pct(S.mo.v)+'"></i><em>Morale '+Math.round(S.mo.v*100)+' · '+MORALE_STATE[S.mo.state].n+'</em></div>'+
      (S.mo.confident?'<div class="bi-weak"><span title="'+CONFIDENCE_LABEL+'">'+badgeSVG('confident',14)+'Confident</span></div>':'')+
      (S.mo.weak.length?'<div class="bi-weak">'+S.mo.weak.map(w=>'<span title="'+WEAK_N[w]+'">'+badgeSVG(w,12)+WEAK_N[w].split(':')[0]+'</span>').join('')+'</div>':''):'')+
    (st?'<div class="bi-stats"><span><b>Damage</b>'+Math.round(st.dmg)+'</span><span><b>'+(st.range?'Range':'Reach')+'</b>'+(st.range||st.reach)+'</span><span><b>Speed</b>'+Math.round(st.spd)+'</span><span><b>Health</b>'+Math.round(st.hp)+'</span>'+(ammoText(S.m)?'<span><b>Ammo</b>'+ammoText(S.m)+'</span>':'')+'</div>':'')+
    (flags?'<small class="bi-flags">'+flags+'</small>':'')+(moraleContextText(S.mo)?'<small class="bi-flags">'+moraleContextText(S.mo)+'</small>':'')+(groupAbilityText(g)?'<small class="bi-flags">'+groupAbilityText(g)+'</small>':'')+(st&&g!=='hero'?'<small class="vs">'+vsLine(st)+'</small>':'');
}
// the top bar: each side's numbers and strength (health by tier), the field, and what is happening (deploying, paused, speed)
function bhudTop(){
  if(!B)return;const w=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));let me=0,foe=0,nm=0,nf=0;
  for(const u of B.units){if(u.hp<=0)continue;if(u.team===0){nm++;if(!u.rout)me+=w(u)}else{nf++;if(!u.rout)foe+=w(u)}}
  const $id=id=>document.getElementById(id);if(!$id('bMine'))return;$id('bMine').textContent=nm;$id('bFoe').textContent=nf;$id('bPowMe').style.width=pct(me/Math.max(.01,me+foe));
  $id('bField').textContent=B.env.name+(B.opts.tournament?' · tournament':'');
  $id('bStatus').textContent=B.over?(B.retreat?'Withdrawn':B.win?'Victory':'Defeat'):B.deploy?(GUIDE.on?'Deploy: place your band in the shaded zone · Space to begin':'Deploying'):B.paused?(GUIDE.on?'Paused · give your orders · Space to go on':'Paused'):B.speed!==1?B.speed+'×':'';
  document.querySelector('.bfield').classList.toggle('alert',!!(B.deploy||B.paused));
  {const b=$id('bAmove');if(b){b.classList.toggle('on',!!B.amArm);b.setAttribute('aria-pressed',String(!!B.amArm));b.disabled=!!B.deploy}}// (armed: commands.js armAttackMove)
  bhudAbilities();
}
/* the unit abilities (unitabilities.js) in their own group at the end of the order bar: a button for each one any selected group
   has. On (lit): the seconds it has left; cooling down: a shade over it that shrinks as it comes back, and the seconds; dimmed,
   with the reason in its tooltip, when none of them can use it now. A press (or its key) uses it for every selected group that
   can (commands.js groupAbility). data-abil, never data-order/flag/form: those lists are the orders' own */
const ABIL_ICON={
  brace:['....a....','...aaa...','....a....','....a....','....a....','...ba....','..b.a....','.b..a....','aaaaaaaaa'],
  fire:['....a....','...aa....','...aab...','..aabba..','.aabbba..','.abbbbaa.','.abbbbba.','..abbba..','...aaa...'],
  spur:['.........','a...a....','.a...a...','..a...a..','...a...a.','..a...a..','.a...a...','a...a....','.........'],
  rally:['a........','aaaaaa...','abbbbba..','abbbba...','aaaaaaa..','a........','a........','a........','aa.......']
};
function bhudAbilities(){
  bhudPowers();// (the commander bar, on the same clock: commandpowers.js)
  const bar=document.querySelector('#bbar .borders');if(!bar||!B)return;let el=bar.querySelector('.abils');
  if(!el){el=document.createElement('div');el.className='ogrp abils';el.setAttribute('role','group');el.setAttribute('aria-label','Unit abilities (G brace, I fire arrows, U spur, Y rally)');
    el.addEventListener('click',e=>{const b=e.target.closest('[data-abil]');if(b&&!b.disabled)groupAbility(b.dataset.abil)});bar.appendChild(el)}
  const gs=selGroups().filter(g=>grpUnits(g).length).map(g=>B.groups[g]),ids=UNIT_ABIL_ORDER.filter(id=>gs.some(g=>groupHasAbility(g,id)));
  if(el.dataset.ids!==ids.join()){el.dataset.ids=ids.join();el.replaceChildren(...ids.map(id=>{const b=document.createElement('button');b.type='button';b.className='obtn abtn';b.dataset.abil=id;
    b.innerHTML='<i class="acd" aria-hidden="true"></i>'+pixelSVG(ABIL_ICON[id],18)+'<span class="at" aria-hidden="true"></span><span class="k">'+UNIT_ABILITIES[id].key+'</span>';return b}))}
  el.hidden=!ids.length;
  for(const b of el.children){const id=b.dataset.abil,A=UNIT_ABILITIES[id],st=gs.filter(g=>groupHasAbility(g,id)).map(g=>abilityStatus(g,id)),ready=st.filter(x=>!x.why),on=st.filter(x=>x.active),cool=st.filter(x=>x.cooldown>0);
    // (the soonest back of those cooling down, when none is ready nor on; the longest still on)
    const back=!ready.length&&!on.length&&cool.length?Math.min(...cool.map(x=>x.cooldown)):0,left=on.length?Math.max(...on.map(x=>x.left)):0;
    b.classList.toggle('on',on.length>0);b.setAttribute('aria-pressed',String(on.length>0));b.disabled=!ready.length;
    b.querySelector('.acd').style.height=back?pct(back/A.cd):'0%';b.querySelector('.at').textContent=on.length?Math.ceil(left-1e-9):back?Math.ceil(back-1e-9):'';
    b.title=A.n+' ('+A.key+'): '+A.d+(A.dur?' Lasts '+A.dur+' s.':'')+' Cooldown '+A.cd+' s.'+(on.length?' Active: '+Math.ceil(left-1e-9)+' s left.':'')+(ready.length?ready.length<st.length?' Ready for '+ready.length+' of '+st.length+' selected units.':' Ready.':' Unavailable: '+(back?'ready in '+Math.ceil(back-1e-9)+' s':st[0].why)+'.');
    b.setAttribute('aria-label',b.title)}
}
/* callouts: a short banner at the top middle of the field for the big moments, in the colour of the side it is about: a group
   routs, is shattered, rallies or is flanked, a leader falls, the enemy falls back. Each is said once (key, again only after
   CALLOUT.same combat seconds; a flank once a group in flankEvery), never twice on screen at once; a rout or shattering of yours
   and a leader's fall go to the battle log as well (theirs breaking is logged once, at the end: battle.js). Banners come up one
   at most every gap seconds and stay life seconds (real time); stale ones are dropped, the small ones (flank, rally) first. The
   words over the soldiers (moraleSay) stay as they were */
const CALLOUT={gap:1.2,life:1.8,show:2,queue:4,stale:4,same:6,flankEvery:8};
const calloutState=()=>B.callouts||(B.callouts={q:[],on:[],last:{},wait:0,n:0,lt:0});
// a callout (team: whose it is, 0 yours (o.ally: your allies'), 1 theirs; its colour: battle.js SIDE, style.css); o.major: rout, shatter, leader, fall-back; o.log: to the battle log too (o.cls)
function callout(text,team,key,o={}){
  if(!B||B.opts.tournament)return false;const C=calloutState();
  if(key){if(C.last[key]!=null&&B.t-C.last[key]<(o.every??CALLOUT.same))return false;C.last[key]=B.t}
  if(o.log)log(htmlText(text),o.cls);
  if(C.q.some(c=>c.text===text)||C.on.some(c=>c.text===text))return true;
  C.q.push({id:++C.n,text,team:team?1:0,side:team?'foe':o.ally?'ally':'mine',major:!!o.major,age:0});
  while(C.q.length>CALLOUT.queue){const i=C.q.findIndex(c=>!c.major);C.q.splice(i<0?0:i,1)}
  return true;
}
// a group by its name, theirs and allies' marked so
const calloutName=g=>(g.foe?'Enemy ':g.ally?'Allied ':'')+g.name;
// the moments (morale.js tells them: battleEvent, heard below)
function calloutRout(r){const g=r.control;if(!g)return;const mine=!r.team;
  callout(calloutName(g)+(r.shattered?' is shattered!':' routs!'),r.team,(r.shattered?'shatter:':'rout:')+g.id,{major:true,log:mine,cls:'bad',ally:!!g.ally});if(mine&&g.player)jolt(SHAKE.rout)}
function calloutRally(r){const g=r.control;if(g)callout(calloutName(g)+' rallies',r.team,'rally:'+g.id,{ally:!!g.ally})}
function calloutFlank(t,src){const g=t.grp&&B.groups[t.grp];if(!g||!g.resolve||src.arrow||steady(t))return;callout(calloutName(g)+' is flanked!',g.team,'flank:'+g.id,{every:CALLOUT.flankEvery,ally:!!g.ally})}
// a group unseen till it charged springs an ambush (terrain.js ambushMul: once a battle a group); yours, logged
function calloutAmbush(u){const g=u.grp&&B.groups[u.grp],mine=!u.team;callout('Ambush!',u.team,'ambush:'+(u.grp||u.id),{major:true,log:mine,cls:'good'});sfxAt('charge',u.x,u.y);if(g&&!mine&&typeof log==='function')log(htmlText(calloutName(g))+' springs an ambush!','bad')}
// (your hero's and a companion's fall are already in the log: applyDmg)
function calloutLeader(u){const mine=!u.team;callout(mine?'Your leader falls!':'Their leader falls!',u.team,'lead:'+u.id,{major:true,log:!u.hero&&!u.comp,cls:mine?'bad':'good'})}
// each moment (rt: real seconds): banners age, the next comes up
function calloutTick(rt){
  if(!B)return;const C=calloutState();
  C.wait-=rt;for(const c of C.on)c.life-=rt;C.on=C.on.filter(c=>c.life>0);for(const c of C.q)c.age+=rt;C.q=C.q.filter(c=>c.age<CALLOUT.stale*(c.major?2:1));
  if(C.wait<=0&&C.q.length&&C.on.length<CALLOUT.show){const c=C.q.shift();c.life=CALLOUT.life;C.on.unshift(c);C.wait=CALLOUT.gap}
  calloutDraw(C);
}
// what the HUD hears from the fight (battle.js battleEvent), at once: the banners; a soldier fallen or off the field, the cards
// (and the selection, All when the selected group has no one left: render.js setOrderUI)
battleOn((type,d)=>{switch(type){
  case 'rout':return calloutRout(d.r);
  case 'rally':return calloutRally(d.r);
  case 'flank':return calloutFlank(d.u,d.src);
  case 'ambush':return calloutAmbush(d.u);
  case 'leader':return calloutLeader(d.u);
  case 'fallback':return callout('The enemy falls back',1,'fallback',{major:true});
  case 'btype':return callout(d.text,d.team,'btype',{major:true});
  case 'power':return callout(POWER_SAY[d.id][d.team?2:1],d.team,'power:'+d.id+':'+d.team,{major:true});
  case 'down':case 'left':{const g=d.u.grp;if(!g)return;if(B.sel===g&&!grpUnits(g).length)B.sel='all';return setOrderUI()}}});
// each drawn frame (drawBattle): on the real clock, so they come and go while paused too
function calloutFrame(){const C=calloutState(),now=performance.now()/1000;calloutTick(C.lt?Math.min(.25,now-C.lt):0);C.lt=now}
// the banners in the battle HUD (#bbar), newest on top; kept while they show, so their fade runs on
function calloutDraw(C){
  const bar=document.getElementById('bbar');if(!bar)return;let el=document.getElementById('bCallouts');
  if(!el){el=document.createElement('div');el.id='bCallouts';el.className='callouts';el.setAttribute('role','status');el.setAttribute('aria-live','polite');bar.appendChild(el)}
  if(el.calls!==C){el.calls=C;el.replaceChildren();el.dataset.sig=''}// (a new battle: none of the last one's)
  const ids=C.on.map(c=>String(c.id));if(el.dataset.sig===ids.join())return;
  for(const d of [...el.children])if(!ids.includes(d.dataset.id))d.remove();
  for(const c of C.on.slice().reverse())if(!el.querySelector('[data-id="'+c.id+'"]')){const d=document.createElement('div');d.className='callout '+c.side+(c.major?' major':'');d.dataset.id=c.id;d.textContent=c.text;d.style.animationDuration=CALLOUT.life+'s';el.prepend(d)}
  el.dataset.sig=ids.join();
}

/* on the field */
// rings: under every soldier of the groups you have selected (bright; with All, light), under the group you point at (soft); an enemy you point
// at, red (a right-click sets them on it)
function drawSelection(){
  const ring=(u,col,a,w)=>{const k=u.s.big?2:1;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w||1;ctx.beginPath();ctx.ellipse(Math.round(u.x)+.5,Math.round(u.y)+.5,7*k,3.5*k,0,0,7);ctx.stroke();ctx.globalAlpha=1};
  // (All selected: every soldier of yours, a lighter ring, so the field does not turn gold)
  const sel=selGroups(),all=B.sel==='all';
  for(const g of sel)for(const u of grpUnits(g)){const k=u.s.big?2:1;ctx.fillStyle='rgba(255,210,90,.35)';ctx.beginPath();ctx.ellipse(Math.round(u.x),Math.round(u.y),7*k,3.5*k,0,0,7);ctx.fill();ring(u,'#ffe08a',1,2)}
  if(typeof drawTouchHold==='function')drawTouchHold();// (a finger held on the field: its filling ring, input.js)
  const h=B.hov;if(!h)return;const mine=rtsUnitAt(h.x,h.y,0),foe=!mine&&rtsUnitAt(h.x,h.y,1);
  if(mine&&mine.grp&&(all||!sel.includes(mine.grp)))for(const u of grpUnits(mine.grp))ring(u,sideKey(u)==='ally'?SIDE.ally.ui:'#ffffff',.7,1.5);// (your allies': their colour)
  if(foe){const g=foe.grp;for(const u of g?grpUnits(g):[foe])if(seenBy(0,u))ring(u,'#ff6a5a',.9,1.5)}// (none under those you cannot see: terrain.js)
}
/* the reach of shooters: one frontage-aware shaded envelope for each selected group (or the group whose icon you point at);
   an enemy group of shooters you point at, theirs, in red. Point at an enemy with shooters selected: a line of fire from each group, green when all can
   reach, amber when some, red when none, with how many; a flat shot (a crossbow, a sling, a bolt) whose line crosses trees,
   which stop flat shots, dashed (arrows arc over them); no words, only the reach and the lines */
const FIRE={fill:.1,edge:1.5,blue:'120,190,255',red:'255,110,95',kinds:['120,190,255','140,230,160','240,200,110','220,150,255'],foes:['255,110,95','255,170,90','255,120,190','240,220,120']};
const shooters=g=>grpUnits(g).filter(u=>!u.rout&&!u.empty&&u.s.range>0);
// (the reach's layer (R16): the field's part in view and RANGE_M px round it, at the zoom's scale, never past the field (a fill's
// curve cut at the layer's edge is cut as the field's own layer cut it): a field seen whole at ×1 has the field's own layer. rangeView:
// its rect in the zoom's pixels (ox, oy, w, h) and the camera's (cx, cy); rangeClear sets the layer to it; rangeBlit puts it over the view)
const RANGE_M=32;
function rangeView(){const cm=B.cam,z=cm?cm.z:1,cx=Math.round((cm?cm.x:0)*z),cy=Math.round((cm?cm.y:0)*z),ox=Math.max(0,cx-RANGE_M),oy=Math.max(0,cy-RANGE_M);
  return{z,cx,cy,ox,oy,w:Math.max(1,Math.min(Math.ceil(BW*z),cx+BVW+RANGE_M)-ox),h:Math.max(1,Math.min(Math.ceil(BH*z),cy+BVH+RANGE_M)-oy)}}
function rangeLayer(){const v=rangeView(),c=B.rangeCv||(B.rangeCv=document.createElement('canvas'));if(c.width!==v.w||c.height!==v.h){c.width=v.w;c.height=v.h}c.rv=v;return c}
function rangeClear(g){const v=g.canvas.rv;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,g.canvas.width,g.canvas.height);g.setTransform(v.z,0,0,v.z,-v.ox,-v.oy)}
function rangeBlit(c){const v=c.rv,m=ctx.getTransform();ctx.save();ctx.setTransform(1,0,0,1,Math.round(m.e+v.cx)+v.ox-v.cx,Math.round(m.f+v.cy)+v.oy-v.cy);ctx.globalAlpha=.75;ctx.drawImage(c,0,0);ctx.restore()}
const convexHull=points=>{const p=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lo=[],hi=[];
  for(const q of p){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],q)<=0)hi.pop();hi.push(q)}lo.pop();hi.pop();return lo.concat(hi)};
function formationReachGeometry(id){
  const gr=B.groups[id],m=shooters(id);if(!gr||!m.length)return null;
  const ax=medianValue(m.map(u=>u.x-(u.sx||0))),ay=medianValue(m.map(u=>u.y-(u.sy||0))),range=Math.min(...m.map(u=>u.s.range)),all=m.every(roundFire);
  const slots=formSlots(gr.form||'line',Math.max(1,grpUnits(id).length),0,gr.files),lat=slots.map(p=>p[1]),half=(Math.max(...lat)-Math.min(...lat))/2;
  if(all)return{ax,ay,range,half,circle:true,points:[]};
  const a=gr.currentFacing??gr.face,ha=SHOOT.arc/2,ca=Math.cos(a),sa=Math.sin(a),points=[];
  for(const side of [-1,1]){
    points.push({x:ax-sa*side*half,y:ay+ca*side*half});
    for(let i=0;i<=32;i++){const theta=-ha+SHOOT.arc*i/32,forward=range*Math.cos(theta),lateral=side*half+range*Math.sin(theta);
    points.push({x:ax+ca*forward-sa*lateral,y:ay+sa*forward+ca*lateral})}
  }
  return{ax,ay,range,half,circle:false,points:convexHull(points)};
}
// one area round them all: the circles filled, then their insides cut a little smaller, leaving the outer edge
function drawReach(us,col){
  if(!us.length)return;const c=rangeLayer(),g=c.getContext('2d');rangeClear(g);
  // (each man's reach: the fan in front of him he can shoot into (battle.js SHOOT.arc), or all round for those who shoot all round;
  // drawn smaller and narrower to cut out its inside, leaving its edge)
  // (the inside of a fan: its point moved forward by sh so its sides stand in by -r0, and its radius cut by that too, so the far edge stays)
  const disc=(r0)=>{g.beginPath();for(const u of us){if(roundFire(u)){const r=Math.max(0,u.s.range+r0);g.moveTo(u.x+r,u.y);g.arc(u.x,u.y,r,0,6.283);continue}
    const a=arcAim(u),sh=r0?-r0/Math.sin(SHOOT.arc/2):0,r=Math.max(0,u.s.range+r0-sh),ox=Math.cos(a)*sh,oy=Math.sin(a)*sh;g.moveTo(u.x+ox,u.y+oy);g.arc(u.x+ox,u.y+oy,r,a-SHOOT.arc/2,a+SHOOT.arc/2);g.closePath()}g.fill()};
  g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+',1)';disc(0);g.globalCompositeOperation='destination-out';disc(-FIRE.edge);
  g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+','+FIRE.fill+')';disc(-FIRE.edge);
  rangeBlit(c)}
// One formation envelope, anchored by the median inferred slot anchor. The hull sweeps both frontage ends through
// the firing arc. Minimum member range is an indicative range, not guaranteed coverage from every soldier's position.
const medianValue=a=>{a.sort((x,y)=>x-y);return a[Math.floor(a.length/2)]||0};
function drawFormationReach(id,col){
  const shape=formationReachGeometry(id);if(!shape)return;
  const c=rangeLayer(),g=c.getContext('2d'),fill=(inset)=>{g.beginPath();
    if(shape.circle){g.arc(shape.ax,shape.ay,Math.max(0,shape.range+inset),0,Math.PI*2);g.closePath()}
    else{const pts=convexHull(shape.points.map(p=>({x:shape.ax+(p.x-shape.ax)*(Math.max(0,shape.range+inset)/shape.range),y:shape.ay+(p.y-shape.ay)*(Math.max(0,shape.range+inset)/shape.range)})));
      if(pts.length){g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath()}}
    g.fill()};
  rangeClear(g);g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+',1)';fill(0);
  g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,1)';fill(-FIRE.edge);
  g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+','+FIRE.fill+')';fill(-FIRE.edge);
  rangeBlit(c);
}
// the trees a straight line from a to b passes through
const treesOn=(a,b)=>B.obs.filter(o=>{if(o.kind!=='tree')return false;const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy||1,k=clamp(((o.x-a.x)*dx+(o.y-6-a.y)*dy)/L,0,1);return Math.hypot(a.x+dx*k-o.x,a.y+dy*k-(o.y-6))<o.r+2}).length;
function drawFireRange(){
  if(B.deploy&&!B.sel)return;
  const sel=selGroups().filter(g=>shooters(g).length),ic=B.iconHov&&playerGroups().includes(B.iconHov)&&shooters(B.iconHov).length?[B.iconHov]:[];
  // One envelope per group; duplicate types retain separate identity, heading, anchor and tint.
  const mineShow=[...new Set([...sel,...ic])];mineShow.forEach((id,i)=>drawFormationReach(id,FIRE.kinds[i%FIRE.kinds.length]));
  const h=B.hov;if(!h)return;const foe=rtsUnitAt(h.x,h.y,1);if(!foe)return;
  // (their reach, when you point at their shooters)
  if(foe.grp&&shooters(foe.grp).length&&!sel.length)drawFormationReach(foe.grp,FIRE.foes[0]);
  else if(!foe.grp&&foe.s.range>0&&!sel.length)drawReach([foe],FIRE.foes[0]);
  // (your line of fire at them)
  for(const g of sel){const m=shooters(g),c={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length},rn=m.filter(u=>Math.hypot(foe.x-u.x,foe.y-u.y)<=u.s.range),n=rn.filter(u=>inArc(u,foe)).length,turn=rn.length-n;
    // (in range but outside their arc: they must turn first)
    const col=n===m.length?'143,224,138':n||turn?'232,185,74':FIRE.red,flat=m.some(u=>u.s.flat||u.s.magic),tr=flat?treesOn(c,foe):0;
    ctx.save();ctx.strokeStyle='rgba('+col+',.9)';ctx.lineWidth=1;ctx.setLineDash(n&&!tr?[]:[3,3]);ctx.beginPath();ctx.moveTo(c.x,c.y-4);ctx.lineTo(foe.x,foe.y-6);ctx.stroke();ctx.restore();
  }
}
// lines from each selected group to where it is going: a move (gold, with its men's places there, faint), the next waypoints,
// an attack (red, to the one it is set on, or to those it charges), withdrawing (blue, straight back to your edge, or its exit: morale.js)
function drawOrderLines(){
  if(B.deploy)return;// (every selected group, All included)
  const line=(a,b,col,dash)=>{ctx.save();ctx.strokeStyle=col;ctx.lineWidth=1;ctx.setLineDash(dash||[4,3]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore();
    const an=Math.atan2(b.y-a.y,b.x-a.x);ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-Math.cos(an-.5)*5,b.y-Math.sin(an-.5)*5);ctx.lineTo(b.x-Math.cos(an+.5)*5,b.y-Math.sin(an+.5)*5);ctx.fill()};
  for(const g of selGroups()){const m=grpUnits(g).filter(u=>!u.rout);if(!m.length)continue;const gr=B.groups[g],c={x:m.reduce((a,u)=>a+u.x,0)/m.length,y:m.reduce((a,u)=>a+u.y,0)/m.length};
    // (an attack on those gone from sight: to where they were last seen, terrain.js sightGoal)
    const target=sightGoal(gr,0)||gr.targetPoint();if(target){line(c,target,'rgba(255,106,90,.9)',[]);ctx.strokeStyle='#ff6a5a';ctx.beginPath();ctx.ellipse(target.x,target.y,8,4,0,0,7);ctx.stroke();continue}
    if(gr.order==='charge'){const ts=[...new Set(m.map(u=>u.tgt).filter(t=>t&&t.hp>0))];if(ts.length){const t={x:ts.reduce((a,u)=>a+u.x,0)/ts.length,y:ts.reduce((a,u)=>a+u.y,0)/ts.length};if(Math.hypot(t.x-c.x,t.y-c.y)>12)line(c,t,'rgba(255,106,90,.7)')}continue}
    if(gr.order==='withdraw'&&B.exit){line(c,exitFor({x:c.x,y:c.y,team:gr.team,grp:g}),'rgba(111,168,224,.9)');continue}
    const a={x:gr.ax,y:gr.ay};
    if(Math.hypot(a.x-c.x,a.y-c.y)>14){line(c,a,'rgba(255,210,90,.85)');ctx.fillStyle='rgba(255,210,90,.35)';for(const u of m)ctx.fillRect(Math.round(a.x+(u.sx||0))-1,Math.round(a.y+(u.sy||0))-1,2,2)}
    let p=a;for(const w of gr.queue||[]){line(p,w,'rgba(255,210,90,.55)');p=w}}
}
