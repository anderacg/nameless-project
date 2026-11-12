'use strict';
/* ---------- the battle HUD, laid out as in Total War (Ashmark.html #bbar): the balance of power at the top middle, time at the top
   right, the selected unit's details at the bottom left, the orders over a row of unit cards at the bottom middle. On the field:
   rings under the soldiers you have selected, a softer one under the group you point at, and lines from each selected group to
   where it is going (or whom it is set on). ---------- */
// Glyph identities resolve to shared illustrated commands; unknown rows keep their compact fallback.
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
  amove:['.....a..a','......aa.','......aa.','.b...a..a','bbb......','.b.......','.b.......','.b.......','.b.......'],
  // (keep formation: a front rank and a rear rank, bracketed together)
  keep:['aa.....aa','a.......a','..aaaaa..','.........','.........','..bbbbb..','.........','a.......a','aa.....aa']
};
function pixelSVG(rows,size,cls){const key=Object.keys(ORDER_ICON).find(k=>ORDER_ICON[k]===rows)||Object.keys(ABIL_ICON).find(k=>ABIL_ICON[k]===rows),art=key&&uiOrderIcon(key,size,cls);if(art)return art;const s=rows.length;let r='';rows.forEach((row,y)=>[...row].forEach((c,x)=>{if(c!=='.')r+='<rect x="'+x+'" y="'+y+'" width="1" height="1" fill="currentColor"'+(c==='b'?' opacity=".5"':'')+'/>'}));
  return '<svg class="'+(cls||'oico')+'" viewBox="0 0 '+s+' '+s+'" width="'+size+'" height="'+size+'" shape-rendering="crispEdges" aria-hidden="true">'+r+'</svg>'}
/* the order bar (doc/UNIT_KITS_DESIGN.md §2, §3, §5, §7b), built from the tables (data/kits.js; its keys KIT_KEYS, by KITS.keys2): the
   orders (ORDERS: Hold, Charge (keys2: a true order, bCharge), the Attack-move; Withdraw last, on the right), the stances (STANCES:
   Pace, its Run and Walk; Discipline; keys2, the three stance slots, Q W E, each the selected units' own stance in it (bhudStances);
   step 1, a row each: Shooting, one cycle; Shield wall; Mounted, kept under keys2 hidden: their buttons the flags' own), the
   formations (FORMS; the ring, each kind its own, bRing (no data-form: bhudRing lights it); keep formation after them) and the skill bar (its slots, Z X C V B: bhudSkills). Today's buttons keep their
   data-order, data-flag and data-form, in their order (render.js setOrderUI lights them; tests/battlecommands.js reads them so);
   a group's place on the bar by CSS (style.css: Withdraw's). Their icon and key, at load; built again when the keys change */
const barBtn=(attr,key,title,extra)=>'<button class="obtn" type="button" '+attr+' data-key="'+keyFace(key||'')+'" title="'+htmlText(title+(key?' ('+keyFace(key)+')':''))+'"'+(extra||'')+'></button>';
function bhudBar(){const O=ORDERS,S=STANCES,K=kitKey,k2=KITS.keys2,row=(id,h,hid)=>'<span class="srow'+(hid?' legacy':'')+'" role="group" data-stance="'+id+'"'+(hid?' hidden':'')+' aria-label="'+htmlText(S[id].n+(K(id)?' ('+K(id)+')':'')+(S[id].cycle?': '+[S[id].none,...S[id].ch.map(c=>c.n)].join(', '):''))+'">'+h+'</span>',
    flag=(c,key)=>barBtn('data-flag="'+c.flag+'"',key,c.d,' aria-pressed="false"'),pace=S.pace.ch;
  return '<div class="ogrp orders" role="group" aria-label="Orders">'+barBtn('data-order="hold"',K('hold'),O.hold.d)+(k2?barBtn('id="bCharge"',K('charge'),O.charge.d):'')+barBtn('id="bAmove"',K('amove'),O.attack.amove.d,' aria-pressed="false"')+'</div>'+
    '<div class="ogrp stances pace" role="group" aria-label="Stances">'+row('pace',barBtn('data-order="charge"',k2?'':K('charge'),k2?O.run.d:'Charge: they move at a run; a run at an enemy is a charge')+barBtn('data-order="advance"',K('pace'),pace[1].d+'; '+K('pace')+' switches walking and running'))+'</div>'+
    '<div class="ogrp wd" role="group" aria-label="Withdraw">'+barBtn('data-order="withdraw"',K('withdraw'),O.withdraw.d)+'</div>'+
    '<div class="ogrp stances rest" role="group" aria-label="Stances">'+row('discipline',flag(S.discipline.ch[0],K('discipline')))+
      (k2?'<span class="srow sslots" role="group" aria-label="Stance slots ('+KIT_KEYS.now.stance.join(', ')+': each selected unit its own stance in that slot)">'+KIT_KEYS.now.stance.map((k,i)=>'<button class="obtn abtn sslot" type="button" data-sslot="'+i+'" hidden aria-pressed="false"><i class="acd" aria-hidden="true"></i><span class="si"></span><span class="at" aria-hidden="true"></span><span class="k">'+k+'</span><span class="mbh-label"></span></button>').join('')+'</span>':'')+
      row('shooting',S.shooting.ch.map((c,i)=>flag({...c,d:c.d+'; pressed again, '+S.shooting.none.toLowerCase()+(K('shooting')?'. '+K('shooting')+': the next of '+[S.shooting.none,...S.shooting.ch.map(x=>x.n)].join(', '):'')},i?'':K('shooting'))).join(''),k2)+
      row('shieldWall',flag(S.shieldWall.ch[0],K('shieldWall')),k2)+
      row('mounted','<button class="obtn abtn" type="button" id="bMounted" hidden aria-pressed="false"><i class="acd" aria-hidden="true"></i>'+pixelSVG(ABIL_ICON.dismount,18)+'<span class="at" aria-hidden="true"></span><span class="k">'+K('mounted')+'</span></button>',k2)+'</div>'+
    '<div class="ogrp forms" role="group" aria-label="Formations ('+(k2?K('form')+': the next of line, loose, a circle, wedge or column; '+K('ring')+': a circle':'L/T again: line')+'; drag for width and depth)">'+FORM_PICK.map(f=>'<button class="obtn" type="button" data-form="'+f+'" aria-pressed="false"></button>').join('')+'<button class="obtn" type="button" id="bRing" aria-pressed="false"></button></div>'+
    '<div class="ogrp abils skills" role="group" aria-label="Skills ('+skillKeys().join(', ')+': each selected unit its own in that slot)" hidden></div>'}
function bhudInit(){
  {const bar=document.querySelector('#bbar .borders');if(bar){bar.innerHTML=bhudBar();bar.dataset.keys=KITS.keys2;withdrawView.bind()}}// (Withdraw's preview on its new button: orderpaths.js)
  document.querySelectorAll('.obtn[data-order],.obtn[data-flag]').forEach(b=>{const k=b.dataset.order||b.dataset.flag;b.innerHTML=pixelSVG(ORDER_ICON[k],18)+'<span class="k">'+(b.dataset.key||'')+'</span>';b.setAttribute('aria-label',b.title)});
  {const b=document.getElementById('bAmove');if(b){b.innerHTML=pixelSVG(ORDER_ICON.amove,18)+'<span class="k">'+(b.dataset.key||'')+'</span>';b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>armAttackMove())}}// (attack-move: commands.js armAttackMove)
  // (the Mounted stance: commands.js toggleMounted; Charge, a true order: chargeOrder; the stance slots: stanceSlot)
  {const b=document.getElementById('bMounted');if(b)b.addEventListener('click',()=>{if(!b.disabled)toggleMounted()})}
  {const b=document.getElementById('bCharge');if(b){b.innerHTML=pixelSVG(ORDER_ICON.charge,18)+'<span class="k">'+b.dataset.key+'</span><span class="mbh-label">Charge</span>';b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>chargeOrder())}}
  {const el=document.querySelector('#bbar .borders .sslots');if(el)el.addEventListener('click',e=>{const b=e.target.closest('[data-sslot]');if(b&&!b.disabled)stanceSlot(+b.dataset.sslot)})}
  // (the skill bar's slots: commands.js groupSlot; one past the third, its skill: groupAbility)
  {const el=document.querySelector('#bbar .borders .skills');if(el)el.addEventListener('click',e=>{const b=e.target.closest('[data-slot]');if(!b||b.disabled)return;if(+b.dataset.slot<skillKeys().length)groupSlot(+b.dataset.slot);else groupAbility(b.dataset.abil)})}
  // (keep formation: a toggle kept as a setting, lit while on, after the formations; its own label on a phone: commands.js toggleKeepForm)
  {const f=document.querySelector('.borders .ogrp.forms');if(f&&!document.getElementById('bKeep')){const b=document.createElement('button');b.type='button';b.className='obtn';b.id='bKeep';b.dataset.key='⇧K';
    b.title='Keep formation (Shift+K): two or more groups selected move as one block, each keeping its place (archers stay behind the foot); a right-click turns the block to face the way it goes, a right-drag sets its front line. Off: each group goes on its own';
    b.innerHTML=pixelSVG(ORDER_ICON.keep,18)+'<span class="k">⇧K</span><span class="mbh-label">Keep form</span>';b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>toggleKeepForm());f.appendChild(b)}keepFormUI()}
  {const b=document.getElementById('bRing');if(b)b.addEventListener('click',()=>{if(!b.disabled)ringForm()});bhudRing()}// (the ring: commands.js ringForm)
  {const el=document.getElementById('bInfo');if(el)el.addEventListener('click',e=>{if(e.target.closest('[data-bi-card]')&&B){B.infoCard=!B.infoCard;bhudInfo()}})}// (its portrait opens its unit card: bhudCardOf)
  document.querySelectorAll('.obtn[data-form]').forEach(b=>{const F=FORMS[b.dataset.form],k=KITS.keys2?kitKey('form'):F.key;b.innerHTML=formIcon(b.dataset.form,24,16)+'<span class="k">'+k+'</span>';b.title=F.n+': '+F.d+' ('+k+(KITS.keys2?' cycles':'')+')';b.setAttribute('aria-label',b.title)});
}
/* the ring's button (O: commands.js ringForm): the selection's ring, a circle or, horse archers alone, a Cantabrian circle (its icon,
   name and words); lit when every selected group it suits stands in its ring; dimmed when it suits none */
function bhudRing(){const b=typeof document!=='undefined'&&document.getElementById('bRing');if(!b)return;const gs=B?selGroups().filter(g=>grpUnits(g).length):[],fit=gs.filter(groupRing),fs=[...new Set(fit.map(groupRing))];
  const f=fs.length===1?fs[0]:'circle',F=FORMS[f],k=kitKey('ring'),on=fit.length>0&&fit.every(g=>B.groups[g].form===groupRing(g)),title=(fs.length>1?'Circle or Cantabrian circle, each its own: ':F.n+': ')+F.d+' ('+k+'; again: line)';
  if(b.dataset.f!==f){b.dataset.f=f;b.innerHTML=formIcon(f,24,16)+'<span class="k">'+k+'</span><span class="mbh-label">'+(f==='circle'?'Circle':'Cantabrian')+'</span>'}
  if(b.title!==title){b.title=title;b.setAttribute('aria-label',title)}b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!fit.length}
// the keep-formation button, lit while it is on (ui.js PREFS.keepform)
function keepFormUI(){const b=typeof document!=='undefined'&&document.getElementById('bKeep');if(!b)return;const on=keepFormOn();b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))}
// a unit's portrait: its painted one (a named face, or its kind's: data/unitportraits.js; the owner, 2026-10-29), else its
// sprite, drawn once into a picture (cached by kind); hudPic, the battle's own cards: the sprite, as its soldiers look on the field
const PORTRAITS={};
// (your hero's and a named companion's: their faces (ui/faces.js), while there are)
function portrait(type,hero,v){const f=typeof Faces!=='undefined'&&Faces.ok()?hero?Faces.yours():COMPS[type]?Faces.companion(type):Faces.unit(type,v):null;if(f)return Faces.pic(f);return !hero&&NamedPortraits.unit(type)||hudPic(type,hero,v)}
function hudPic(type,hero,v){const fc=!hero&&COMPS[type]&&typeof Faces!=='undefined'&&Faces.ok()?Faces.companion(type):null;if(fc)return Faces.pic(fc);const art=!hero&&NamedPortraits.of(type);if(art)return art;return spritePic((hero?'hero:'+heroLookKey()+':':'')+type+(v?':'+v:''),()=>unitSprite(type,0,!!hero,v||0))}// (v: one of its looks; your hero's by what he wears now)
// (your hero's look in a picture's key: his race and gear, so one who takes up a weapon or armour is drawn anew)
const heroLookKey=()=>[typeof Faces!=='undefined'?Faces.lookKey(true,'hero'):'',P.race,P.gender,P.gear?.weapon,P.gear?.offhand,P.gear?.body,P.gear?.head,P.gear?.mount].join('/')
// any figure's picture the same way (mk: its sprite cell): a worker at his trade (workerPic), a townsperson (personPic: the
// smith, the innkeeper, a merchant…)
function spritePic(k,mk){if(!PORTRAITS[k]){try{const sp=mk(),n=sp.width,S=Math.min(n,Math.max(sp.cw||n,(sp.ch||n)+3));// (the figure itself, cropped from its cell: feet at the bottom, centred)
    PORTRAITS[k]=mkc(S,S,g=>g.drawImage(sp,(n-S)>>1,n-S,S,S,0,0,S,S)).toDataURL()}catch(e){PORTRAITS[k]=''}}return PORTRAITS[k]}
const workerPic=(job,race,v)=>spritePic('wk:'+job+':'+race+':'+(v??1),()=>workerSprite(job,0,race,v??1));
const critterPic=id=>spritePic('cr:'+id,()=>critterSprite(id));// an animal (critters.js)
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
  return parts.join(', ')}
function moraleContextText(mo){if(!mo||mo.cohesion==null)return '';return (mo.weak.includes('outmatched')?'Outmatched, ':'')+(mo.weak.includes('outnumbered')?'Locally overwhelmed, ':'')+'Cohesion '+Math.round(mo.cohesion*100)+'%'+(mo.lossStrain>0.1?', Recent-loss pressure '+mo.lossStrain.toFixed(1):'')}
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
    for(const id of SKILL_ORDER)if(abilityActive(gr,id))add(3,id,UNIT_SKILLS[id].n+' on',{tone:'si-g'});
    const q=quiverLeft(m),sta=stm==null?null:stm*FATIGUE.max;
    if(q&&!q.left)add(4,'noammo','Out of ammunition',{tone:'si-b'});
    if(sta!=null&&sta<FATIGUE.spent)add(4,'spent','Exhausted: stamina '+Math.round(sta));
    if(gr.shieldWall)add(5,'shieldWall','Shield wall');
    if(gr.posts&&gr.posted('brace'))add(5,'brace',gr.planted('brace')?'Braced':'Bracing');
    if(gr.posts&&gr.posted('pavise'))add(5,'pavise',gr.planted('pavise')?'Pavises planted':'Planting pavises');
    if(gr.firm)add(5,'firm','Holding their ground');
    if(gr.cease)add(5,'cease','Cease fire');
    if(gr.skirmish)add(5,'skirmish','Skirmishing');
    if(gr.melee&&m.some(u=>u.s.range))add(5,'melee','Melee mode: bows put away');
    {const r=Dismount.tally(m);if(r&&r.on<r.of)add(5,'mounted',r.on+'/'+r.of+' mounted',{n:r.on+'/'+r.of})}// (riders on foot: battle/dismount.js)
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
  const ids=['all',...playerGroups()],signature=ids.join('|');
  if(row.dataset.groups!==signature){row.dataset.groups=signature;row.classList.toggle('many',ids.length>8);row.replaceChildren();ids.forEach(id=>{const b=document.createElement('button');b.type='button';b.className='ucard'+(id==='all'?' all':'');b.dataset.grp=id;row.appendChild(b)})}
  const keys=Object.fromEntries(ids.map(id=>[id,[]]));for(const k of '1234567890'){const gs=ctrlGroups(k);for(const g of gs==='all'?ids.filter(id=>id==='all'||grpUnits(id).length):gs)if(keys[g])keys[g].push(k)}
  // Update bindings without replacing cards or losing focus. Two keys fit; the tooltip carries every key.
  for(const b of row.children){const ks=keys[b.dataset.grp];b.dataset.key=ks.join(', ');b.dataset.badge=ks.slice(0,2).join(',')+(ks.length>2?'+'+(ks.length-2):'');if(ks.length)b.setAttribute('aria-keyshortcuts',ks.join(' '));else b.removeAttribute('aria-keyshortcuts')}
}
function bhudCard(b,g){
  const m=g==='all'?playerGroups().flatMap(grpUnits):grpUnits(g),n=m.length,on=B.sel===g||Array.isArray(B.sel)&&B.sel.includes(g),gr=B.groups[g];
  const hp=m.reduce((a,u)=>a+u.hp,0)/Math.max(1,m.reduce((a,u)=>a+u.max,0)),mo=B.noMorale?null:grpMorale(m),sh=g!=='all'&&g!=='hero'&&gr?grpShape(g):null,rep=g==='hero'?'hero':repOf(m),stm=grpStamina(m);
  const st=cardStatus(g,m,mo,stm),vis=st.filter(o=>o.svg).slice(0,CARD.show),rg=gr?.player&&gr.sourceGroupId&&partyRoster(P).groups.find(x=>x.id===gr.sourceGroupId);// (its rank's badge: ui/rankbadge.js)
  // (built again only when it changes, so a tooltip under the pointer stays; the bars on their own, as they move each moment)
  const head='<span class="ukey">'+(b.dataset.badge||'')+'</span>'+(g==='all'?'<span class="uall">'+icon('troops',18)+'<b>'+n+'</b></span>':(rep?'<img class="upic" src="'+hudPic(rep,g==='hero')+'" alt="">':'')+'<span class="ucount">'+n+'</span>')+
    '<span class="utop">'+(rg?groupBadge(rg,10):'')+(sh?'<small class="csh">'+sh.files+'×'+sh.ranks+'</small>':'')+(gr&&g!=='hero'&&gr.form&&gr.form!=='line'?formIcon(gr.form,18,12):'')+'</span>'+(vis.length?'<span class="cmi">'+vis.map(cardIco).join('')+'</span>':'');
  if(b.cardHead!==head){b.cardHead=head;b.innerHTML=head+'<span class="ubars"></span>'}
  const bars='<span class="ub"><i class="chp" style="width:'+pct(hp)+'"></i></span>'+(mo?'<span class="ub"><i class="cmo'+(mo.v<MORALE.waver/100?' low':'')+'" style="width:'+pct(mo.v)+'"></i></span>':'')+(stm!=null?'<span class="ub"><i class="cst'+(stm*FATIGUE.max<FATIGUE.tired?' low':'')+'" style="width:'+pct(stm)+'"></i></span>':''),bb=b.querySelector('.ubars');
  if(bb.cardBars!==bars){bb.cardBars=bars;bb.innerHTML=bars}
  b.title=(g==='all'?'All troops: '+n:groupName(g)+': '+n+(gr&&g!=='hero'?', '+FORMS[gr.form||'line'].n.toLowerCase()+(sh?' '+sh.files+' wide, '+sh.ranks+' deep':''):''))+(mo?', morale '+Math.round(mo.v*100)+' ('+MORALE_STATE[mo.state].n.toLowerCase()+')':'')+
    (st.length?', '+st.map(o=>o.s).join(', '):'')+(g!=='all'&&groupAbilityText(g)?', '+groupAbilityText(g):'')+(b.dataset.key?' ('+b.dataset.key+')':'');
  b.setAttribute('aria-label',b.title);b.disabled=g!=='all'&&!n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));
}
// the selected unit's details (bottom left): one group in full; several, a line each
function bhudInfo(){
  const el=document.getElementById('bInfo');if(!el||!B)return;const gs=selGroups().filter(g=>grpUnits(g).length);
  if(!gs.length){setHtml(el,'<p class="muted">No one left to command.</p>');return}
  const stat=(g)=>{const m=grpUnits(g),gr=B.groups[g],mo=B.noMorale?null:grpMorale(m),hp=m.reduce((a,u)=>a+u.hp,0),mx=m.reduce((a,u)=>a+u.max,0);return{m,gr,mo,hp,mx}};
  if(gs.length>1){setHtml(el,'<div class="bi-title">'+(B.sel==='all'?'All troops':gs.length+' units')+'</div>'+gs.map(g=>{const S=stat(g);return '<div class="bi-row"><img class="bi-mini" src="'+hudPic(g==='hero'?'hero':repOf(S.m),g==='hero')+'" alt=""><span class="bi-n">'+htmlText(groupName(g))+' <b>'+S.m.length+'</b></span><span class="ub"><i class="chp" style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i></span>'+(aiHas(S.gr)?badgeSVG('ai',12):'')+(S.mo?badgeSVG(stateIcon(S.mo.state),12)+(S.mo.confident?badgeSVG('confident',12):''):'')+'</div>'}).join(''));return}
  const g=gs[0],S=stat(g),gr=S.gr,rep=g==='hero'?'hero':repOf(S.m),st=g==='hero'?B.hero.s:ST[rep]||S.m[0].s,sh=g!=='hero'?grpShape(g):null;
  const flags=[S.mo&&S.mo.breaking?'Breaking: '+S.mo.breaking+' (morale collapse)':'',gr.walk?'Walking':'Running',gr.firm?'Holding ground':'',gr.cease?'Cease fire':'',gr.skirmish?'Skirmishing':'',gr.melee===false&&grpUnits(g).some(u=>u.s.range)?'Melee mode off':'',(r=>r&&r.on<r.of?r.on+'/'+r.of+' mounted':'')(Dismount.tally(S.m)),S.mo?.confident?'Confident: local superiority':''].filter(Boolean).join(', ');
  const head='<div class="bi-head"><button class="bi-picb'+(B.infoCard?' on':'')+'" type="button" data-bi-card title="'+(B.infoCard?'Back to its orders and bars':'Its unit card')+'" aria-pressed="'+!!B.infoCard+'"><img class="bi-pic" src="'+hudPic(rep,g==='hero')+'" alt=""></button><div><div class="bi-title">'+htmlText(g==='hero'&&!gr.customName?(P.name||'Your hero'):groupName(g))+'</div><small>'+(g==='hero'?'Your hero':S.m.length+' × '+(ST[rep]?ST[rep].n:rep))+'</small>'+
    '<small>'+(aiHas(gr)?'AI, ':'')+(gr.amove?'Attack-move':cap1(gr.order))+(g!=='hero'?', '+FORMS[gr.form||'line'].n+(sh?' '+sh.files+'×'+sh.ranks:''):'')+'</small></div></div>';
  if(B.infoCard){setHtml(el,head+bhudCardOf(g,S,rep,st));return}
  setHtml(el,head+
    '<div class="bi-bar hp"><i style="width:'+pct(S.hp/Math.max(1,S.mx))+'"></i><em>Health '+Math.round(S.hp)+' / '+Math.round(S.mx)+'</em></div>'+
    (g==='hero'&&B.hx?'<div class="bi-bar sp"><i style="width:'+pct(B.hx.sp/maxSP())+'"></i><em>Stamina '+Math.round(B.hx.sp)+'</em></div><div class="bi-bar mp"><i style="width:'+pct(B.hx.mp/maxMP())+'"></i><em>Mana '+Math.round(B.hx.mp)+'</em></div>':'')+
    (g!=='hero'&&grpStamina(S.m)!=null?(st=>'<div class="bi-bar st"><i class="'+(st*FATIGUE.max<FATIGUE.tired?'low':'')+'" style="width:'+pct(st)+'"></i><em>Stamina '+Math.round(st*FATIGUE.max)+(st*FATIGUE.max<FATIGUE.spent?', spent':st*FATIGUE.max<FATIGUE.tired?', tired':'')+'</em></div>')(grpStamina(S.m)):'')+
    (S.mo?'<div class="bi-bar mo"><i class="'+(S.mo.v<MORALE.waver/100?'low':'')+'" style="width:'+pct(S.mo.v)+'"></i><em>Morale '+Math.round(S.mo.v*100)+', '+MORALE_STATE[S.mo.state].n+'</em></div>'+
      (S.mo.confident?'<div class="bi-weak"><span title="'+CONFIDENCE_LABEL+'">'+badgeSVG('confident',14)+'Confident</span></div>':'')+
      (S.mo.weak.length?'<div class="bi-weak">'+S.mo.weak.map(w=>'<span title="'+WEAK_N[w]+'">'+badgeSVG(w,12)+WEAK_N[w].split(':')[0]+'</span>').join('')+'</div>':''):'')+
    (st?'<div class="bi-stats"><span><b>Damage</b>'+Math.round(st.dmg)+'</span><span><b>'+(st.range?'Range':'Reach')+'</b>'+(st.range||st.reach)+'</span><span><b>Speed</b>'+Math.round(st.spd)+'</span><span><b>Health</b>'+Math.round(st.hp)+'</span>'+(ammoText(S.m)?'<span><b>Ammo</b>'+ammoText(S.m)+'</span>':'')+'</div>':'')+
    (flags?'<small class="bi-flags">'+flags+'</small>':'')+(moraleContextText(S.mo)?'<small class="bi-flags">'+moraleContextText(S.mo)+'</small>':'')+(groupAbilityText(g)?'<small class="bi-flags">'+groupAbilityText(g)+'</small>':'')+(st&&g!=='hero'?'<small class="vs">'+vsLine(st)+'</small>':''));
}
// a group's unit card in the battle (ui/unitcard.js UnitCard): its men left of those it began with, their health, its morale now,
// its speed and blows as tiredness has them (fatigue.js tiredMul), your hero's stamina and mana
function bhudCardOf(g,S,rep,st){const m=S.m,hero=g==='hero',tm=tiredMul(m[0]),start=B.units.filter(u=>u.grp===g).length,now={hp:S.hp/Math.max(1,m.length),spd:st.spd*tm.spd,atk:meleeDmgOf(st)/st.cd*tm.dmg,shot:missileDmgOf(st)/st.cd*tm.dmg};
  if(S.mo)now.mor=S.mo.v*100;
  return new UnitCard({key:rep,s:st,name:htmlText(hero&&!S.gr.customName?(P.name||'Your hero'):groupName(g)),sub:hero?'Your hero':ST[rep]?ST[rep].n:rep,hero,now,strength:hero?null:{fit:m.length,max:start,hurt:0,tip:'Men still fighting, of the '+start+' it began with'},
    meters:hero&&B.hx?[{label:'Stamina',v:B.hx.sp,max:maxSP()},{label:'Mana',v:B.hx.mp,max:maxMP()}]:null,abil:unitAbilities(st),kit:!hero&&m[0]&&!ladderless(m[0])?kitChips(battleRec(B.groups[g])):null}).html()}// (a troop's kit: unitcard.js kitChips)
// the top bar: each side's numbers and strength (health by tier), the field, and what is happening (deploying, paused, speed)
function bhudTop(){
  if(!B)return;window.mobileBattleHud?.update();const w=u=>u.hp/Math.max(1,u.max)*(u.hero||u.leader||u.comp?4:(ST[u.type]&&ST[u.type].tier||1));let me=0,foe=0,nm=0,nf=0;
  for(const u of B.units){if(u.hp<=0)continue;if(battleFriend(0,u)){nm++;if(!u.rout)me+=w(u)}else if(battleEnemy(0,u)){nf++;if(!u.rout)foe+=w(u)}}
  const $id=id=>document.getElementById(id);if(!$id('bMine'))return;$id('bMine').textContent=nm;$id('bFoe').textContent=nf;$id('bPowMe').style.width=pct(me/Math.max(.01,me+foe));
  const huntEnd=$id('huntEnd');if(huntEnd)huntEnd.hidden=!B.hunt;const foeLabel=$id('bFoeLabel');if(foeLabel)foeLabel.textContent=B.hunt?'Wildlife':B.sides?.active?'Hostile':'Enemy';
  $id('bField').textContent=B.env.name+(B.env.w&&WEATHER.kinds[B.env.w]?', '+Weather.name(B.env.w):'')+(B.opts.tournament?', tournament':'')+(B.sides?', '+B.sides.records.filter(r=>r.joined).length+'/'+BATTLE_JOIN.armies+' armies':'');
  $id('bStatus').textContent=B.over?(B.hunt?'Hunt over':B.retreat?'Withdrawn':B.win?'Victory':'Defeat'):B.muster?.active?(B.paused?'Preparation paused, Space to continue':'Forming up, '+B.muster.done+'/'+B.muster.entries.length):B.ready?'Ready, Start Battle to begin':B.deploy?(GUIDE.on?'Deploy: place your band in the shaded zone, Space to begin':'Deploying'):B.paused?(GUIDE.on?'Paused, give your orders, Space to go on':'Paused'):B.speed!==1?B.speed+'×':'';
  document.querySelector('.bfield').classList.toggle('alert',!!(B.deploy||B.paused));
  {const b=$id('bAmove');if(b){b.classList.toggle('on',!!B.amArm);b.setAttribute('aria-pressed',String(!!B.amArm));b.disabled=!!B.deploy}}// (armed: commands.js armAttackMove)
  bhudSkills();bhudRing();bhudArmies();withdrawView.hud();bhudSkip();
}
// (your army down, others fighting on for you: a bar saying so, and Skip to the end: sides.js skipBattle)
function bhudSkip(){let el=document.getElementById('bSkip');const on=ownDown();
  if(!el){if(!on)return;const top=document.querySelector('.btop');if(!top)return;el=document.createElement('div');el.id='bSkip';el.className='bwithdraw';el.setAttribute('role','status');top.appendChild(el);
    el.addEventListener('click',e=>{if(e.target.closest('[data-bskip]'))skipBattle();else if(e.target.closest('[data-bres]'))resolveBattle()})}
  const h=on?'<b>Your army is down</b> <em>'+(B.rivals?'Your foes fight on against each other.':'The others fight on.')+'</em> <button type="button" class="wgo" data-bskip>Skip to the end</button> <button type="button" class="wgo" data-bres>Auto-resolve</button>':'';
  el.hidden=!on;if(el.dataset.h!==h){el.dataset.h=h;el.innerHTML=h}}
// Army banners open a relationship view without changing selection or issuing an order.
class BattleArmyHud{
 constructor(){
  this.root=document.createElement('div');this.root.className='army-intel';this.root.hidden=true;
  this.root.innerHTML='<button type="button" id="battleArmiesToggle" aria-expanded="false" aria-controls="battleArmiesPanel">Armies</button><div class="army-arrivals" role="status" aria-live="polite"></div><section id="battleArmiesPanel" class="army-panel" aria-label="Battle armies" hidden><header><strong>Battle armies</strong><button type="button" data-army-close aria-label="Close army relationships">×</button></header><div class="army-banners" aria-label="Choose an army"></div><div class="army-relations"></div></section>';
  document.querySelector('.btop').appendChild(this.root);this.toggle=this.root.querySelector('button');this.panel=this.root.querySelector('section');
  this.root.addEventListener('click',e=>{if(e.target.closest('#battleArmiesToggle')){const open=this.panel.hidden;this.close();if(open){window.mobileBattleHud?.close();this.panel.hidden=false;this.toggle.setAttribute('aria-expanded','true');this.render()}}else if(e.target.closest('[data-army-close]')){this.close();this.toggle.focus()}else{const b=e.target.closest('[data-army]');if(b){this.selected=+b.dataset.army;this.render()}}});
  document.addEventListener('pointerdown',e=>{if(!this.root.contains(e.target))this.close()});
 }
 close(){const open=!this.panel.hidden;this.panel.hidden=true;this.toggle.setAttribute('aria-expanded','false');return open}
 static stance(s,r){if(r.owner===P)return 'Your army';const relation=s.pair(s.records.find(q=>q.owner===P),r);return relation>0?'Ally':relation<0?'Hostile':'Neutral'}
 relation(r){return BattleArmyHud.stance(this.s,r)}
 direction(o){const p=fromField(B.world.field(o)),a=Math.round(Math.atan2(p.y-BVH/2,p.x-BVW/2)/(Math.PI/4)),i=(a+8)%8;return ['→ E','↘ SE','↓ S','↙ SW','← W','↖ NW','↑ N','↗ NE'][i]}
 pending(r){return B.world.pending.find(p=>p.o===r.owner)}
 state(r){
  const p=this.pending(r);if(p){const count=p.existing?p.existing.reduce((n,id)=>n+B.units.filter(u=>u.grp===id).length,0):null;return !this.s.room(p.o,count)?'Waiting to enter, fighter limit':'Approaching'}
  if(!r.joined)return r.away?'Turned away':'Not yet entered';const m=this.s.survivors(r);if(!m.length)return 'Defeated';return m.some(u=>u.hp>0&&!u.left&&!u.rout&&!withdrawing(u))?'Fighting, '+m.length:'Withdrawn / withdrawing';
 }
 update(){
  if(!B?.sides){this.root.hidden=true;this.close();this.battle=null;return}
  if(this.battle!==B){this.battle=B;this.s=B.sides;this.selected=0;this.close();this.noticed=new Set();this.signature=null;this.detailSignature=null}
  this.root.hidden=false;this.toggle.textContent='Armies '+this.s.records.filter(r=>r.joined).length+'/'+BATTLE_JOIN.armies+' '+(this.panel.hidden?'▾':'▴');
  const pending=this.s.records.filter(r=>this.pending(r)),lines=pending.map(r=>({r,text:this.direction(r.owner)+', '+this.s.label(r)+' — '+this.relation(r)+', '+this.state(r)}));
  for(const {r,text} of lines)if(!this.noticed.has(r.id)){this.noticed.add(r.id);callout(text,r.team,'approach:'+r.id,{major:true,side:this.relation(r)==='Ally'?'ally':this.relation(r)==='Neutral'?'neutral':'foe'})}
  const sig=lines.map(l=>l.text).join('|');if(sig!==this.signature){this.signature=sig;const el=this.root.querySelector('.army-arrivals');el.replaceChildren();for(const {r,text} of lines.slice(0,2)){const b=document.createElement('button');b.type='button';b.dataset.army=r.id;b.textContent=text;b.title='View this army’s allies and enemies';b.addEventListener('click',()=>{window.mobileBattleHud?.close();this.panel.hidden=false;this.toggle.setAttribute('aria-expanded','true')});el.appendChild(b)}if(lines.length>2){const more=document.createElement('small');more.textContent='+'+(lines.length-2)+' more approaching, see Armies';el.appendChild(more)}}
  if(!this.panel.hidden)this.render();
 }
 fit(){const screen=document.getElementById('screen').getBoundingClientRect(),r=this.root.parentElement.getBoundingClientRect(),space=this.root.closest('.mobile-battle-hud')?r.top-screen.top-6:screen.bottom-r.bottom-6;this.panel.style.maxHeight=Math.max(60,Math.floor(space))+'px'}
 render(){
  this.fit();const s=this.s,r=s.records.find(q=>q.id===this.selected)||s.records[0],rows=s.records.map(q=>({q,name:s.label(q),relation:this.relation(q),state:this.state(q)})),sig=JSON.stringify([r.id,rows.map(x=>[x.name,x.relation,x.state]),s.records.map(q=>s.pair(r,q))]);if(sig===this.detailSignature)return;this.detailSignature=sig;
  const banners=this.root.querySelector('.army-banners');setHtml(banners,rows.map(({q,name,relation,state})=>'<button type="button" data-army="'+q.id+'" aria-pressed="'+(q===r)+'"><span class="army-flag" style="background:'+s.colour(q.id)+'" aria-hidden="true">⚑</span><span><strong>'+htmlText(name)+'</strong><small>'+htmlText(relation+', '+state)+'</small></span></button>').join(''));
  const names=v=>s.records.filter(q=>q!==r&&s.pair(r,q)===v).map(q=>htmlText(s.label(q))).join(', ')||'None';
  this.root.querySelector('.army-relations').innerHTML='<strong>'+htmlText(s.label(r))+'</strong><dl><dt>Allies</dt><dd>'+names(1)+'</dd><dt>Enemies</dt><dd>'+names(-1)+'</dd><dt>Neutral</dt><dd>'+names(0)+'</dd></dl><small>Neutral armies may fight each other. Viewing an army does not issue orders.</small>';
 }
}
function bhudArmies(){if(!window.battleArmyHud)window.battleArmyHud=new BattleArmyHud();window.battleArmyHud.update()}

/* the skill bar (doc/UNIT_KITS_DESIGN.md §5, §7b) at the end of the order bar: its slots, Z X C V B (data/kits.js KIT_KEYS; step 1,
   Z X C), each selected group its own skill in each (battle/unitkit.js groupSlots: its kit's, in its kind's order), one past the
   last (a dismounted rider's) with no key. On (lit): the seconds it has left; cooling down: a shade over it that shrinks as it comes back,
   and the seconds; dimmed, with the reason in its tooltip, when none of them can use it now (locked: its rank not reached). A
   press (or its key) uses it for every selected group that can (commands.js groupSlot). data-slot (and data-abil, the skill in
   it), never data-order/flag/form: those lists are the orders' own */
const ABIL_ICON={
  lunge:['........a','.......a.','......a..','.....a...','....a....','...a.....','..a......','.bb......','bb.......'],
  volley:['a.a.a.a..','.a.a.a.a.','..a.a.a.a','.........','bbbbbbbbb','.........','a.a.a.a..','.a.a.a.a.','..a.a.a.a'],
  pikePush:['a...a...a','a...a...a','a...a...a','aa..aa..a','.a...a...','.a...a...','bbbbbbbbb','.........','.........'],
  counter:['a.......a','.a.....a.','..a...a..','...a.a...','....a....','...a.a...','..a...a..','.b.....b.','b.......b'],
  storm:['.a..a..a.','a..a..a..','.a..a..a.','.........','....a....','...a.a...','..a...a..','.bbbbbbb.','.........'],
  parthian:['.........','a....aaa.','.a..a....','aaaa.....','.a..a....','a....aaa.','.........','.bb..bb..','.........'],
  ward:['...aaa...','..a...a..','.a.bbb.a.','.a.b.b.a.','.a.bbb.a.','..a...a..','...a.a...','....a....','.........'],
  pavise:['.aaaaaaa.','.abbbbba.','.ab...ba.','.ab...ba.','.ab...ba.','.abbbbba.','.aaaaaaa.','..a...a..','.a.....a.'],
  rapid:['.........','.a...a...','..a...a..','...a...a.','aaaaaaaaa','...a...a.','..a...a..','.a...a...','.........'],
  brace:['....a....','...aaa...','....a....','....a....','....a....','...ba....','..b.a....','.b..a....','aaaaaaaaa'],
  fire:['....a....','...aa....','...aab...','..aabba..','.aabbba..','.abbbbaa.','.abbbbba.','..abbba..','...aaa...'],
  spur:['.........','a...a....','.a...a...','..a...a..','...a...a.','..a...a..','.a...a...','a...a....','.........'],
  rally:['a........','aaaaaa...','abbbbba..','abbbba...','aaaaaaa..','a........','a........','a........','aa.......'],
  scout:['.........','..aaaaa..','.a.....a.','a..bbb..a','a.bbabb.a','a..bbb..a','.a.....a.','..aaaaa..','.........'],
  dismount:['....a....','....a....','....a....','..a.a.a..','...aaa...','....a....','.........','aaaaaaaaa','.b.....b.'],
  mount:['....a....','...aaa...','..a.a.a..','....a....','....a....','....a....','.........','aaaaaaaaa','.b.....b.']
};
// (a skill's tooltip: what it does, how long, its cooldown)
const skillTip=(A,key)=>A.n+(key?' ('+key+')':'')+': '+A.d+(A.note?A.note():'')+(A.dur?' Lasts '+A.dur+' s.':'')+' Cooldown '+A.cd+' s.';
// (a button's state from the statuses of those who have its skill: lit while on, the shade and seconds of the soonest back; its words)
function skillState(b,st,cd){const ready=st.filter(x=>!x.why),on=st.filter(x=>x.active),cool=st.filter(x=>x.cooldown>0);
  const back=!ready.length&&!on.length&&cool.length?Math.min(...cool.map(x=>x.cooldown)):0,left=on.length?Math.max(...on.map(x=>x.left)):0;
  b.classList.toggle('on',on.length>0);b.setAttribute('aria-pressed',String(on.length>0));b.disabled=!ready.length;
  // (its shade and seconds only where the button still has them: a hero's slot text written over it once threw here every HUD tick, the
  // game's loop stopped and the battle frozen while forming up: combat.js HeroHands#updateBar)
  const shade=b.querySelector('.acd'),secs=b.querySelector('.at');if(shade)shade.style.height=back?pct(back/cd):'0%';if(secs)secs.textContent=on.length?Math.ceil(left-1e-9):back?Math.ceil(back-1e-9):'';
  return (on.length?' Active: '+Math.ceil(left-1e-9)+' s left.':'')+(ready.length?ready.length<st.length?' Ready for '+ready.length+' of '+st.length+' selected units.':' Ready.':st.length?' Unavailable: '+(back?'ready in '+Math.ceil(back-1e-9)+' s':st[0].why)+'.':'')}
function bhudSkills(){
  bhudPowers();// (the commander bar, on the same clock: commandpowers.js)
  {const bar=document.querySelector('#bbar .borders');if(bar&&bar.dataset.keys&&bar.dataset.keys!==String(KITS.keys2))bhudInit()}// (the keys changed: the bar made again)
  const el=document.querySelector('#bbar .borders .skills');if(!el||!B)return;bhudMounted();bhudStances();
  const SK=skillKeys(),gs=selGroups().filter(g=>grpUnits(g).length).map(g=>B.groups[g]),bars=gs.map(g=>groupSlots(g)),n=Math.max(0,...bars.map(x=>x.length)),slots=[];
  for(let i=0;i<Math.max(n?SK.length:0,n);i++){const xs=[];bars.forEach((x,j)=>{if(x[i])xs.push({g:gs[j],...x[i]})});if(xs.length||i<SK.length)slots.push(xs)}
  // (built again only when what is in the slots changes)
  const sig=slots.map(xs=>[...new Set(xs.map(x=>x.id+(x.locked?'!':'')))].join('/')).join();
  if(el.dataset.ids!==sig||[...el.children].some(b=>!b.querySelector('.acd'))){el.dataset.ids=sig;el.replaceChildren(...slots.map((xs,i)=>{const b=document.createElement('button'),id=xs[0]?.id;b.type='button';b.className='obtn abtn'+(new Set(xs.map(x=>x.id)).size>1?' mix':'');b.dataset.slot=i;if(id)b.dataset.abil=id;
    b.innerHTML='<i class="acd" aria-hidden="true"></i>'+(id?pixelSVG(ABIL_ICON[id],18):'')+'<span class="at" aria-hidden="true"></span><span class="k">'+(SK[i]||'')+'</span>'+(id?'<span class="mbh-label">'+htmlText(UNIT_SKILLS[id].n)+'</span>':'');return b}))}
  el.hidden=!n;
  for(const b of el.children){const i=+b.dataset.slot,xs=slots[i]||[],key=SK[i],ids=[...new Set(xs.map(x=>x.id))],open=xs.filter(x=>!x.locked);
    if(!ids.length){b.disabled=true;b.title='Slot '+(i+1)+(key?' ('+key+')':'')+': empty for the selected units.';b.setAttribute('aria-label',b.title);continue}
    const A=UNIT_SKILLS[ids[0]],st=open.filter(x=>groupHasAbility(x.g,x.id)).map(x=>abilityStatus(x.g,x.id)),lock=xs.filter(x=>x.locked);
    b.title=(ids.length>1?'Slot '+(i+1)+(key?' ('+key+')':'')+', each selected unit its own: '+ids.map(id=>UNIT_SKILLS[id].n).join(' / ')+'.':skillTip(A,key))+
      (lock.length?' Unlocks at rank '+Math.min(...lock.map(x=>x.rank))+(lock.length<xs.length?' for '+lock.length+' of '+xs.length+' selected units':'')+'.':'')+skillState(b,st,A.cd)+(!st.length&&!lock.length?' Unavailable: '+abilityWhyNot(xs[0].g,xs[0].id).toLowerCase()+'.':'');
    b.setAttribute('aria-label',b.title)}
}
// (the old name: main.js redraws it on the HUD's clock)
const bhudAbilities=bhudSkills;
// the Mounted stance's button (data/kits.js STANCES.mounted; commands.js toggleMounted): shown while a selected group has riders who
// can step down; lit while they are all on foot; its press: Dismount while any is up, else Mount, each with its cooldown
function bhudMounted(){const b=document.getElementById('bMounted');if(!b)return;const gs=selGroups().filter(g=>grpUnits(g).some(u=>Dismount.rider(u))).map(g=>B.groups[g]),r=gs.map(g=>Dismount.tally(g.units)).filter(Boolean);
  b.hidden=!r.length;if(!r.length)return;const up=gs.some(g=>groupHasAbility(g,'dismount')),id=up?'dismount':'mount',A=UNIT_SKILLS[id],S=STANCES.mounted,afoot=r.every(x=>!x.on);
  if(b.dataset.abil!==id){b.dataset.abil=id;b.querySelector('svg').outerHTML=pixelSVG(ABIL_ICON[id],18)}
  const words=skillState(b,gs.filter(g=>groupHasAbility(g,id)).map(g=>abilityStatus(g,id)),A.cd);b.setAttribute('aria-pressed',String(afoot));
  b.title=S.n+(kitKey('mounted')?' ('+kitKey('mounted')+')':'')+': '+(afoot?'on foot':'mounted')+'. '+skillTip(A,'')+words;b.setAttribute('aria-label',b.title)}
/* the stance slots (§7b, KITS.keys2: Q W E; commands.js stanceSlot): each its icon, key and what it holds for the units selected (a
   slot whose units differ marked +); lit while on (Brace, Pavise: planted or planting; Shield wall; Shooting: any choice but Fire at
   will, its name the label; Mounted: all on foot, its cooldowns' shade); empty slots hidden */
const STANCE_ICON={brace:ABIL_ICON.brace,pavise:ABIL_ICON.pavise,shieldWall:ORDER_ICON.shieldWall,shooting:ORDER_ICON.cease,mounted:ABIL_ICON.dismount};
function stanceState(id,gs){const S=STANCES[id];
  if(id==='shooting'){const ch=gs.map(g=>shootingOf(g)),i=ch.every(x=>x===ch[0])?ch[0]:-2;return{on:i>=0,n:i>=0?S.ch[i].n:i===-1?S.none:'Mixed',icon:ORDER_ICON[i>=0?S.ch[i].flag:'cease']}}
  if(id==='mounted'){const r=gs.map(g=>Dismount.tally(g.units)).filter(Boolean),afoot=r.length>0&&r.every(x=>!x.on);return{on:afoot,n:afoot?S.ch[0].n:S.ch[1].n,icon:ABIL_ICON[afoot?'mount':'dismount']}}
  if(S.ch[0].post){const on=gs.every(g=>g.posted(id));return{on,n:on?S.ch[0].n:S.n,icon:STANCE_ICON[id]}}
  const f=S.ch[0].flag,on=gs.every(g=>g[f]);return{on,n:S.n,icon:STANCE_ICON[id]}}
function bhudStances(){const el=document.querySelector('#bbar .borders .sslots');if(!el||!B)return;const gs=selGroups().filter(g=>grpUnits(g).length).map(g=>B.groups[g]),by=gs.map(g=>groupStances(g));
  for(const b of el.children){const i=+b.dataset.sslot,xs=gs.map((g,j)=>[g,by[j][i]]).filter(x=>x[1]),ids=[...new Set(xs.map(x=>x[1]))];b.hidden=!ids.length;if(!ids.length)continue;
    const id=ids[0],own=xs.filter(x=>x[1]===id).map(x=>x[0]),st=stanceState(id,own),S=STANCES[id],sig=ids.join('/')+':'+st.n;
    if(b.dataset.sig!==sig){b.dataset.sig=sig;b.dataset.stance=id;b.querySelector('.si').innerHTML=pixelSVG(st.icon,18);b.querySelector('.mbh-label').textContent=ids.length>1?'Slot '+(i+1):st.n}
    b.classList.toggle('mix',ids.length>1);b.classList.toggle('on',st.on);b.setAttribute('aria-pressed',String(st.on));
    let words='';if(id==='mounted'){const up=own.some(g=>groupHasAbility(g,'dismount')),A=UNIT_SKILLS[up?'dismount':'mount'];words=skillState(b,own.filter(g=>groupHasAbility(g,A===UNIT_SKILLS.dismount?'dismount':'mount')).map(g=>abilityStatus(g,up?'dismount':'mount')),A.cd);b.classList.toggle('on',st.on)}else{b.disabled=false;b.querySelector('.acd').style.height='0%';b.querySelector('.at').textContent=''}
    b.title=(ids.length>1?'Stance slot '+(i+1)+' ('+KIT_KEYS.now.stance[i]+'), each selected unit its own: '+ids.map(x=>STANCES[x].n).join(' / ')+'.':S.n+' ('+KIT_KEYS.now.stance[i]+'): '+st.n.toLowerCase()+'. '+(S.ch[0].d||S.ch.map(c=>c.n).join(' or '))+(S.cycle?'. Pressed: the next of '+[S.none,...S.ch.map(c=>c.n)].join(', '):''))+words;b.setAttribute('aria-label',b.title)}}
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
  C.q.push({id:++C.n,text,team:team?1:0,side:o.side||(team?'foe':o.ally?'ally':'mine'),major:!!o.major,age:0});
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
  case 'reinforcement':{const s=B.sides,r=s?.byOwner.get(d.party);if(!r)return;const relation=BattleArmyHud.stance(s,r);return callout(s.label(r)+' enters — '+relation,r.team,'arrival:'+r.id,{major:true,side:relation==='Ally'?'ally':relation==='Neutral'?'neutral':'foe'})}
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
/* each group's health (the owner, 2026-10-31: no bars over each man, one for the group by its flag): a bar standing on the left of
   its flag (ui/moraleicons.js drawUnitIcons, B.icons; 2026-11-10, the owner: "HP should still at the left side"), clear of its
   crossbar's end, as tall as its cloth while the group is whole: its men's health now over theirs as the battle began (GROUP_HP0,
   by battle and group: taken the first frame the group is on the field, a group come late at its coming; more men since count as
   whole), in the unit card's health green over a dark trough; every group's, yours, your allies' and the enemy's, faded as its flag
   is under another. On the screen as the flags are, at their scale. w, gap: its width and the gap to the crossbar, art px (the flag's) */
const GROUP_HP={w:4,gap:1,col:'#78c474',trough:'#2c2a26',edge:'#0a0c12',now:{}},GROUP_HP0=new WeakMap();
function drawGroupHealth(){
  const G=GROUP_HP,now=G.now;for(const k in now)now[k]=0;for(const u of B.units)if(u.grp&&u.hp>0)now[u.grp]=(now[u.grp]||0)+u.hp;
  let h0=GROUP_HP0.get(B);if(!h0)GROUP_HP0.set(B,h0={});for(const g in B.groups)if(h0[g]==null&&now[g]>0)h0[g]=now[g];
  if(!B.icons||!B.icons.length)return;const K=unitIconScale(),H=FLAG.ch;
  for(const r of B.icons){const f=Math.min(1,(now[r.g]||0)/Math.max(1,h0[r.g]||1)),n=Math.round((H-2)*f);
    ctx.save();ctx.translate(r.x-(G.w+G.gap+2)*K,r.y);ctx.scale(K,K);if(r.under)ctx.globalAlpha=ICON_FAN.under;
    ctx.fillStyle=G.edge;ctx.fillRect(0,0,G.w,H);ctx.fillStyle=G.trough;ctx.fillRect(1,1,G.w-2,H-2);if(n>0){ctx.fillStyle=G.col;ctx.fillRect(1,H-1-n,G.w-2,n)}ctx.restore()}
}
// rings: under every soldier of the groups you have selected (bright; with All, light), under the group you point at (soft); an enemy you point
// at, red (a right-click sets them on it)
function drawSelection(){
  const ring=(u,col,a,w)=>{const k=u.s.big?2:1;ctx.globalAlpha=a;ctx.strokeStyle=col;ctx.lineWidth=w||1;ctx.beginPath();ctx.ellipse(Math.round(u.x)+.5,Math.round(u.y)+.5,7*k,3.5*k,0,0,7);ctx.stroke();ctx.globalAlpha=1};
  // (All selected: every soldier of yours, a lighter ring, so the field does not turn gold)
  const sel=selGroups(),all=B.sel==='all';
  for(const g of sel)for(const u of grpUnits(g)){const k=u.s.big?2:1;ctx.fillStyle='rgba(255,210,90,.35)';ctx.beginPath();ctx.ellipse(Math.round(u.x),Math.round(u.y),7*k,3.5*k,0,0,7);ctx.fill();ring(u,'#ffe08a',1,2)}
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
function rangeView(){const cm=B.cam,V=bview(),native=B.world?VS:V.k,z=(cm?cm.z:1)*native,cx=Math.round((cm?cm.x:0)*z),cy=Math.round((cm?cm.y:0)*z),ox=Math.max(0,cx-RANGE_M),oy=Math.max(0,cy-RANGE_M);
  return{z,cx,cy,ox,oy,w:Math.max(1,Math.min(Math.ceil(BW*z),cx+V.w*native+RANGE_M)-ox),h:Math.max(1,Math.min(Math.ceil(BH*z),cy+V.h*native+RANGE_M)-oy)}}
function rangeLayer(){const v=rangeView(),c=B.rangeCv||(B.rangeCv=document.createElement('canvas'));if(c.width!==v.w||c.height!==v.h){c.width=v.w;c.height=v.h}c.rv=v;return c}
function rangeClear(g){const v=g.canvas.rv;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,g.canvas.width,g.canvas.height);g.setTransform(v.z,0,0,v.z,-v.ox,-v.oy)}
function rangeBlit(c){const v=c.rv,m=ctx.getTransform();ctx.save();ctx.setTransform(1,0,0,1,Math.round(m.e+v.cx)+v.ox-v.cx,Math.round(m.f+v.cy)+v.oy-v.cy);ctx.globalAlpha=.75;ctx.drawImage(c,0,0);ctx.restore()}
const convexHull=points=>{const p=points.slice().sort((a,b)=>a.x-b.x||a.y-b.y),cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lo=[],hi=[];
  for(const q of p){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}for(let i=p.length-1;i>=0;i--){const q=p[i];while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],q)<=0)hi.pop();hi.push(q)}lo.pop();hi.pop();return lo.concat(hi)};
function formationReachGeometry(id){
  const gr=B.groups[id],m=shooters(id);if(!gr||!m.length)return null;
  const ax=medianValue(m.map(u=>u.x-(u.sx||0))),ay=medianValue(m.map(u=>u.y-(u.sy||0))),range=Math.min(...m.map(u=>u.s.range)),all=m.every(roundFire);
  const slots=formSlots(gr.form||'line',Math.max(1,grpUnits(id).length),0,gr.files,B.world?WORLD_BATTLE.sprite:1),lat=slots.map(p=>p[1]),half=(Math.max(...lat)-Math.min(...lat))/2;
  return formationRangeShape(ax,ay,range,half,all,gr.currentFacing??gr.face);
}
// Shared by the live battle and the march editor (using world-distance coordinates there).
function formationRangeShape(ax,ay,range,half,circle,a=0){
  if(circle)return{ax,ay,range,half,circle:true,points:[]};
  const ha=SHOOT.arc/2,ca=Math.cos(a),sa=Math.sin(a),points=[];
  for(const side of [-1,1]){
    points.push({x:ax-sa*side*half,y:ay+ca*side*half});
    for(let i=0;i<=32;i++){const theta=-ha+SHOOT.arc*i/32,forward=range*Math.cos(theta),lateral=side*half+range*Math.sin(theta);
    points.push({x:ax+ca*forward-sa*lateral,y:ay+sa*forward+ca*lateral})}
  }
  return{ax,ay,range,half,circle:false,points:convexHull(points)};
}
// one area round them all: the circles filled, then their insides cut a little smaller, leaving the outer edge
function drawReach(us,col){
  if(!us.length)return;const c=rangeLayer(),g=c.getContext('2d', { willReadFrequently: true });rangeClear(g);
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
  const c=rangeLayer(),g=c.getContext('2d', { willReadFrequently: true }),edge=FIRE.edge/(B.world?(B.cam?.z||1):1),fill=(inset)=>{g.beginPath();
    if(shape.circle){g.arc(shape.ax,shape.ay,Math.max(0,shape.range+inset),0,Math.PI*2);g.closePath()}
    else{const pts=convexHull(shape.points.map(p=>({x:shape.ax+(p.x-shape.ax)*(Math.max(0,shape.range+inset)/shape.range),y:shape.ay+(p.y-shape.ay)*(Math.max(0,shape.range+inset)/shape.range)})));
      if(pts.length){g.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)g.lineTo(pts[i].x,pts[i].y);g.closePath()}}
    g.fill()};
  rangeClear(g);g.globalCompositeOperation='source-over';g.fillStyle='rgba('+col+',1)';fill(0);
  g.globalCompositeOperation='destination-out';g.fillStyle='rgba(0,0,0,1)';fill(-edge);
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
    if(Math.hypot(a.x-c.x,a.y-c.y)>14){line(c,a,'rgba(255,210,90,.85)');ctx.fillStyle='rgba(255,210,90,.35)';const s=B.world?4*WORLD_BATTLE.sprite:2;for(const u of m)ctx.fillRect(Math.round(a.x+(u.sx||0))-s/2,Math.round(a.y+(u.sy||0))-s/2,s,s)}
    let p=a;for(const w of gr.queue||[]){line(p,w,'rgba(255,210,90,.55)');p=w}}
}
