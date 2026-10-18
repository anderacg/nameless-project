'use strict';
// The battle HUD's pictures: the unit cards show icons, not words (their order, pace, flags, morale, by rank, CARD.show at most;
// every one the same round badge, its rim by its kind;
// every word in the card's tooltip and each icon's own; the All card's counts; a long press on a phone shows the words); the
// banners over the groups (moraleicons.js iconLayout) stay over their groups with no jump, may overlap (selected, pointed at,
// yours over theirs), fan out, eased, only for groups at blows with each other; a click again on the same spot picks the next
// banner under; less motion: no easing. All of it reads the battle and changes nothing in it (no Math.random).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),t=T,G=t.G,L=t.BattleLab,ev=s=>(0,eval)(s),rm0=ev('reducedMotion');window.__rm0=rm0;
 const end=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 let later=false;
 try{
  t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;
  const lab=()=>{G.mode='world';G.modal=false;if(L.active)L.exit();
   L.start({leftGroups:[{type:'hum_foot',count:6},{type:'hum_bow',count:6},{type:'hum_knight',count:4}],rightGroups:[{type:'hum_foot',count:6},{type:'hum_foot',count:6}],deploy:false,ai:false,paused:true,morale:true,seed:5,ground:'none'});
   const B=t.B;B.obs=[];return B};
  let B=lab();const mine=t.playerGroups(),[foot,bow,kn]=mine,[e1,e2]=Object.keys(B.groups).filter(g=>B.groups[g].team===1),card=g=>document.querySelector('.ucard[data-grp="'+g+'"]');
  const mid=t.toField({x:t.BVW/2,y:t.BVH/2});
  // (a group's men in a block about x, y, its place there too, no one set on anyone)
  const put=(g,x,y)=>{t.grpUnits(g).forEach((u,i)=>{u.x=x+(i%3-1)*8;u.y=y+Math.floor(i/3)*8;u.tgt=null});const gr=B.groups[g];gr.ax=x;gr.ay=y+4;gr.tgt=null;gr.queue=[]};
  // (what a card shows as words: its text, the icons' tooltips (SVG titles) left out)
  const shown=c=>{const k=c.cloneNode(true);k.querySelectorAll('title').forEach(e=>e.remove());return k.textContent.trim()};
  const sts=c=>[...c.querySelectorAll('.cmi .si')].map(e=>e.dataset.st);
  // (every icon on every card, gathered as the test goes (peek): a round badge is BADGE's shape, its rim all one colour (its
  // key's, BADGE_RIM), a dark inside and its own glyph in white)
  const seen=[],peek=()=>document.querySelectorAll('.bcards .cmi .si').forEach(e=>seen.push({k:e.dataset.st,svg:e.querySelector('svg')}));
  const isBadge=({k,svg})=>{if(!svg||!svg.classList.contains('mico')||svg.getAttribute('viewBox')!=='0 0 9 9'||!t.GLYPH[k])return false;const px={};svg.querySelectorAll('rect').forEach(r=>px[r.getAttribute('x')+','+r.getAttribute('y')]=r.getAttribute('fill'));
   return Object.keys(px).length===t.BADGE.join('').replace(/\./g,'').length&&t.BADGE.every((row,y)=>[...row].every((ch,x)=>{const c=px[x+','+y];if(ch==='.')return c===undefined;if(ch==='x')return c===t.BADGE_RIM[k];return c===((t.GLYPH[k][y-2]||'')[x-2]==='g'?'#ffffff':'#141822')}))};
  const words=c=>[...c.querySelectorAll('.cmi .si')].map(e=>e.querySelector('svg title').textContent);
  put(foot,mid.x-160,mid.y);put(bow,mid.x-160,mid.y+60);put(kn,mid.x-160,mid.y-70);put(e1,mid.x+160,mid.y);put(e2,mid.x+160,mid.y+70);t.setOrderUI();

  // ---- the cards: pictures, no words
  ok([...document.querySelectorAll('.bcards .ucard')].every(c=>/^[\d×\s]*$/.test(shown(c))&&!c.querySelector('.cn,.cf')),'no card shows a word: its key, count and shape in figures, the rest pictures ('+[...document.querySelectorAll('.bcards .ucard')].map(shown).join(' | ')+')');
  ok([...document.querySelectorAll('.bcards .ucard')].every(c=>c.title&&c.getAttribute('aria-label')===c.title),'each card says it all in words in its tooltip and accessible label');
  ok(card(foot).title.startsWith(t.groupName(foot)+': 6')&&/holding/.test(card(foot).title)&&!card(foot).querySelector('[data-st=hold],[data-st=walk],[data-st=run]'),'a group standing: no order or pace icon, “holding” in its words');
  B.groups[foot].moveTo(mid.x-60,mid.y);t.setOrderUI();
  peek();ok(sts(card(foot)).join()===(t.walking(B.groups[foot])?'move,walk':'move,run')&&card(foot).querySelector('[data-st=move] svg title').textContent==='Moving','sent somewhere: moving, then its pace ('+sts(card(foot)).join()+'), each icon with its words (an SVG title)');
  B.groups[foot].setWalk(false);t.setOrderUI();peek();ok(sts(card(foot)).join()==='move,run','at a run: the run icon');
  // (a shooters' group with every flag, on the move: rank and overflow)
  {const g=B.groups[bow];['firm','cease','skirmish','melee'].forEach(f=>g.setFlag(f,true));g.moveTo(mid.x-60,mid.y+60);t.setOrderUI();
   peek();ok(words(card(bow)).join()===['Moving',t.walking(g)?'At a walk':'At a run','Holding their ground','Cease fire'].join()&&card(bow).querySelector('.si[data-st=firm]').className==='si','the words in each icon\u2019s tooltip, as before ('+words(card(bow)).join(', ')+')');
   const s=sts(card(bow));ok(s.length===t.CARD.show&&s.join()===['move',t.walking(g)?'walk':'run','firm','cease'].join()&&/skirmishing/.test(card(bow).title)&&/melee mode/.test(card(bow).title),'by rank, '+t.CARD.show+' at most: order, pace, then flags ('+s.join()+'); the rest (skirmish, melee mode) in its tooltip only');
   const R=t.resolveOf(t.grpUnits(bow)[0]);R.mor=20;t.setOrderUI();peek();ok(sts(card(bow))[0]==='wavering'&&sts(card(bow)).length===t.CARD.show&&/wavering/.test(card(bow).title),'its morale failing comes first (wavering), pushing a flag off the card');
   R.mor=80;['firm','cease','skirmish','melee'].forEach(f=>g.setFlag(f,false));put(bow,mid.x-160,mid.y+60);g.hold()}
  // (out of shots, and an ability on)
  {t.grpUnits(bow).forEach(u=>{u.ammo=0;u.empty=true});t.setOrderUI();peek();ok(sts(card(bow)).includes('noammo')&&/out of ammunition/.test(card(bow).title),'out of shots: an empty quiver');t.grpUnits(bow).forEach(u=>{u.ammo=null;u.empty=false})
   const q=t.grpUnits(bow);q.forEach((u,i)=>u.ammo=i?0:1);t.setOrderUI();peek();const a=card(bow).querySelector('.si[data-st=ammo]');ok(a&&a.className==='si si-w'&&/^Low on ammunition: \d+\/\d+$/.test(a.querySelector('title').textContent),'few shots left: the quiver badge, a warning, its count in its words ('+(a&&a.querySelector('title').textContent)+')');q.forEach(u=>u.ammo=null)}
  // (the All card: the troops icon and how many; those running, a badge and how many)
  {const R=t.resolveOf(t.grpUnits(kn)[0]);R.mor=0;R.routed=true;R.sync&&R.sync();t.setOrderUI();const a=card('all'),r=a.querySelector('[data-st=routing]');
   ok(a.querySelector('.uall svg')&&a.querySelector('.uall b').textContent===String(t.playerGroups().flatMap(t.grpUnits).length)&&r&&r.querySelector('b').textContent===String(t.grpMorale(t.playerGroups().flatMap(t.grpUnits)).rout)&&/running/.test(r.querySelector('title').textContent),'the All card: the troops icon and its count, a running badge with how many run ('+shown(a)+')');
   peek();ok(sts(card(kn))[0]==='routing','the routing group: routing first');R.mor=80;R.routed=false;R.sync&&R.sync()}

  // ---- the banners
  const lay=rt=>{t.iconLayout(rt);return B.icons},ic=g=>B.icons.find(r=>r.g===g),over=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
  const centre=g=>{const r=ic(g);return r.x+r.w/2-t.fromField({x:r.cx,y:r.cy}).x};
  B.sel='all';B.iconHov=null;
  // (a group of yours and one of theirs passing close, not fighting)
  put(foot,mid.x,mid.y);put(e1,mid.x+4,mid.y-6);B.iconPos={};lay(1);lay(1);
  ok(over(ic(foot),ic(e1))&&Math.abs(centre(foot))<=1&&Math.abs(centre(e1))<=1,'passing close, not fighting: the banners overlap, each over its own group');
  ok(B.icons.indexOf(ic(foot))>B.icons.indexOf(ic(e1))&&ic(e1).under&&!ic(foot).under,'yours drawn over theirs; theirs, under, faded');
  B.sel=e1;B.iconHov=e1;lay(1);ok(B.icons.indexOf(ic(e1))>B.icons.indexOf(ic(foot)),'the one pointed at drawn on top');B.iconHov=null;B.sel='all';
  // (at blows: one of yours set on one of theirs within reach)
  const fight=on=>{const a=t.grpUnits(foot),b=t.grpUnits(e1);a.forEach((u,i)=>u.tgt=on?b[i%b.length]:null)};
  fight(true);const apart=()=>{const [a,b]=[ic(foot),ic(e1)].sort((p,q)=>p.x-q.x);return{d:b.x-a.x,need:a.bw+t.ICON_FAN.gap}};lay(.05);const d1=apart().d;
  for(let i=0;i<5;i++)lay(.05);const d2=apart().d,step=apart().need;
  ok(d1<step-1&&d2>=step-1,'at blows with each other, they fan out side by side ('+Math.round(d2)+' px of '+Math.round(step)+'), eased: '+Math.round(d1)+' px after 0.05 s, in place by '+(6*.05).toFixed(2)+' s');
  ok(Math.abs(centre(foot)+centre(e1))<=2,'fanned about the middle they had (each off its group by '+Math.round(centre(foot))+' and '+Math.round(centre(e1))+' px)');
  // (another of theirs whose banner overlaps, not at blows with either: it stays over its group)
  put(e2,mid.x+4,mid.y+2);B.iconPos[e2]=null;lay(1);lay(1);ok(Math.abs(centre(e2))<=1,'a third overlapping, not at blows with them, is not fanned');put(e2,mid.x+160,mid.y+70);
  fight(false);lay(.05);const d3=Math.abs(ic(foot).x-ic(e1).x);lay(1);
  ok(d3>2&&Math.abs(centre(foot))<=1&&Math.abs(centre(e1))<=1,'the fight over, they ease back over their groups ('+Math.round(d3)+' px apart after 0.05 s, then 0)');
  // (following: no jump as the group moves, nor as its top man falls)
  {const m=t.grpUnits(foot);for(let i=0;i<10;i++){m.forEach(u=>u.x+=3);B.t+=.05;lay(.05)}ok(Math.abs(centre(foot))<=10,'it follows its group as it marches ('+Math.round(centre(foot))+' px behind its middle)');
   B.iconPos={};lay(1);const y0=ic(foot).y,first=Math.min(...m.map(u=>u.y)),row=m.filter(u=>u.y===first);row.forEach(u=>u.hp=0);B.t+=.05;lay(.05);const y1=ic(foot).y;for(let i=0;i<30;i++){B.t+=.05;lay(.05)}const y2=ic(foot).y;
   ok(Math.abs(y1-y0)<Math.abs(y2-y0)&&Math.abs(y2-y0)>4,'its front rank falling, it settles lower without a jump: '+Math.round(Math.abs(y1-y0))+' px in the first 0.05 s of '+Math.round(Math.abs(y2-y0)));row.forEach(u=>u.hp=u.max)}
  // (two of yours on one spot: a click picks the top one, again the next under, and round)
  {put(foot,mid.x,mid.y);put(bow,mid.x+6,mid.y+2);B.iconPos={};B.sel='all';lay(1);const a=ic(foot),b=ic(bow),p=t.toField({x:Math.max(a.x,b.x)+3,y:Math.max(a.y,b.y)+3});
   const picks=[];for(let i=0;i<3;i++){t.rtsSelect(p.x,p.y,p.x,p.y);picks.push(B.sel);lay(1)}
   ok(picks[0]!==picks[1]&&picks[2]===picks[0]&&[foot,bow].includes(picks[0])&&[foot,bow].includes(picks[1]),'a click where banners overlap picks the top one, again the next under, then round ('+picks.map(g=>t.groupName(g)).join(', ')+')');
   const top=B.icons[B.icons.length-1].g;ok(top===picks[2],'the one selected drawn on top');
   const q=t.toField({x:t.BVW-4,y:t.BVH-4});t.rtsSelect(q.x,q.y,q.x,q.y);t.rtsSelect(p.x,p.y,p.x,p.y);ok(B.sel===B.icons[B.icons.length-1].g,'a click elsewhere in between: the top one again');
   ok([0,1,2].every(()=>t.rtsUnitAt(p.x,p.y,0).grp===B.icons[B.icons.length-1].g),'pointing and orders (no pick) never cycle: always the top one')}
  // ---- less motion: no easing, each put where it goes at once
  {ev('reducedMotion=()=>true');put(bow,mid.x-160,mid.y+60);put(foot,mid.x,mid.y);put(e1,mid.x+4,mid.y-6);B.iconPos={};lay(1);fight(true);lay(0);
   ok(apart().d>=apart().need-1,'less motion: the fan in place at once');fight(false);lay(0);const m=t.grpUnits(foot);m.forEach(u=>u.x+=20);B.t+=.01;lay(0);
   ok(Math.abs(centre(foot))<=1,'and the banner on its group at once, as it moves');ev('reducedMotion=__rm0')}
  // ---- one style: every card icon the same round badge, its rim by its kind
  {B.groups[bow].useAbility('fire');t.setOrderUI();peek();const f=card(bow).querySelector('.si[data-st=fire]');
   ok(f&&f.className==='si si-g'&&f.querySelector('title').textContent===t.UNIT_ABILITIES.fire.n+' on','an ability on: its badge, its words ('+(f&&f.querySelector('title').textContent)+')');
   const bad=seen.filter(o=>!isBadge(o));ok(seen.length>15&&!bad.length,'every icon on the cards ('+seen.length+': '+[...new Set(seen.map(o=>o.k))].join(', ')+') is a round badge: BADGE\u2019s shape, its rim, a dark inside, its white glyph'+(bad.length?' (not: '+bad.map(o=>o.k).join()+')':''));
   ok(!document.querySelector('.bcards .cmi svg.oico')&&[...document.querySelectorAll('.obtn[data-order] svg,.obtn[data-flag] svg,.obtn[data-abil] svg')].every(e=>e.classList.contains('oico')),'no bare glyph left on a card; the order bar\u2019s buttons keep their own icons');
   // (every key cardStatus can show: the ones it names, the morale states, the weaknesses and the abilities; hold has no icon)
   const keys=new Set();for(const m of String(t.cardStatus).matchAll(/add\(\d+,([^,]+),/g))for(const q of m[1].matchAll(/'(\w+)'/g))keys.add(q[1]);
   ['wavering','breaking','routing','rallying','shattered','confident','standfast',...Object.keys(t.WEAK_N),...t.UNIT_ABIL_ORDER].forEach(k=>keys.add(k));keys.delete('hold');
   const five=G=>Array.isArray(G)&&G.length===5&&G.every(r=>/^[g.]{5}$/.test(r))&&G.join('').includes('g'),miss=[...keys].filter(k=>!five(t.GLYPH[k]));
   ok(keys.size>=35&&!miss.length,'every status the cards use ('+keys.size+') has a 5×5 glyph'+(miss.length?' (missing: '+miss.join()+')':''));
   const look=new Map();for(const k of keys){const id=JSON.stringify(t.GLYPH[k])+t.BADGE_RIM[k];look.set(id,(look.get(id)||[]).concat(k))}const same=[...look.values()].filter(v=>v.length>1);
   ok(!same.length,'no two of them look alike (glyph and rim; spent is tired\u2019s mark in red)'+(same.length?': '+same.map(v=>v.join('=')).join(' '):''));
   // (the rim by kind; morale and weaknesses their own)
   const KIND={order:['move','attack','charge','advance','withdraw'],pace:['walk','run'],ability:[...t.UNIT_ABIL_ORDER,'standfast'],warning:['ammo','tired','fallback'],bad:['noammo','spent'],flag:['shieldWall','firm','cease','skirmish','melee'],sight:['hidden','seen','woods']};
   const wrong=Object.entries(KIND).flatMap(([c,ks])=>ks.filter(k=>t.BADGE_KIND[k]!==c||t.BADGE_RIM[k]!==t.BADGE_CAT[c]));
   ok(!wrong.length&&new Set(Object.values(t.BADGE_CAT)).size===Object.keys(KIND).length,'each kind its own rim: order '+t.BADGE_CAT.order+', pace '+t.BADGE_CAT.pace+', ability '+t.BADGE_CAT.ability+', warning '+t.BADGE_CAT.warning+', bad '+t.BADGE_CAT.bad+', flag '+t.BADGE_CAT.flag+', sight '+t.BADGE_CAT.sight+(wrong.length?' (wrong: '+wrong+')':''));
   const own=[...keys].filter(k=>!t.BADGE_KIND[k]);ok(own.every(k=>t.BADGE_RIM[k])&&t.BADGE_RIM.routing==='#f2efe6'&&t.BADGE_RIM.wavering==='#ffa040'&&t.BADGE_RIM.flanked==='#e0605a'&&t.BADGE_RIM.confident==='#70dfb0','morale and weaknesses keep their own rims ('+own.join(', ')+')');
   ok(seen.every(o=>o.svg.querySelector('rect').getAttribute('fill')===(t.BADGE_KIND[o.k]?t.BADGE_CAT[t.BADGE_KIND[o.k]]:t.BADGE_RIM[o.k])),'on the cards, each badge\u2019s rim the colour of its kind')}
  // ---- reading only: no Math.random, nothing of the battle changed
  {const r0=Math.random;let n=0;Math.random=()=>{n++;return r0()};const snap=JSON.stringify(B.units.map(u=>[u.x,u.y,u.hp,u.tgt&&u.tgt.id,u.ch]));
   try{t.setOrderUI();lay(.1);t.drawUnitIcons()}finally{Math.random=r0}
   ok(n===0&&snap===JSON.stringify(B.units.map(u=>[u.x,u.y,u.hp,u.tgt&&u.tgt.id,u.ch])),'cards and banners read the battle and change nothing (no Math.random)')}
  // ---- a long press on a card, on a phone: its words
  {const c=card(foot),r=c.getBoundingClientRect();c.dispatchEvent(new PointerEvent('pointerdown',{pointerType:'touch',bubbles:true,clientX:r.left+10,clientY:r.top+10}));later=true;
   setTimeout(()=>{try{const tip=document.getElementById('tip');ok(tip&&!tip.hidden&&tip.textContent.includes(t.groupName(foot)+': '),'a long press on a card shows its words ('+(tip&&tip.textContent)+')');t.hideTip()}catch(e){o.push('EXC '+e.message)}finally{if(L.active)L.exit();ev('reducedMotion=__rm0');end()}},t.TOUCH.hold+80)}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 finally{if(!later){if(L.active)L.exit();end()}}
};
