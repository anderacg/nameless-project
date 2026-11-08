'use strict';
/* ---------- the Skills page: proficiency, skill trees, traits, skill bar (the owner's order, 2026-11-08) ---------- */
// The rules live in core/talents.js; this file presents them. Each proficiency has a skill tree of its own (the owner, 2026-11-08:
// "make each skill tree separated by proficiency"; data/tree.js PROF_TREE). Your level comes from experience (Skyrim's way:
// doc/PROFICIENCY_DESIGN.md §11), each a skill point (data/progression.js LEVEL) spent as you like on any tree's nodes (passives,
// notables, keystones and the active skills), each growing from the tier below; a node's strength follows its proficiency. Active
// skills go into the ten slots on the Skill bar: your hero uses them in battle when the moment is right. Traits sit apart: the moves
// everyone has, your race's and your past's (HERO_TRAITS).
// P.tree: learned node ids (your origin always; P.origin). P.slots: ten slot entries, an active
// skill id or null. Every character has trees of its own (o: its record, with tree, sk and slots; yours is P): the ...Of
// functions work on any record, the plain ones on yours.
// what an active skill does right now, in numbers
function skillStats(id){
  const A=abil(id),sm=HSKILLS[id].magic?spellMul():1,x=v=>(v*A.dmg*sm).toFixed(2)+'×';
  return{whirl:'Hits everything around you for '+x(1.3)+' damage',leap:'Leaps up to 100, stuns '+(1+A.stun).toFixed(1)+'s where you land',quake:'Hits everything within '+Math.round(50*A.r)+' for '+x(.9)+', staggers '+(.6+A.stun).toFixed(1)+'s',
    dash:'Dashes 80, '+x(1.1)+' to everyone you pass',volley:'8 arrows of '+x(.7)+' over a '+Math.round(28*A.r)+' radius; uses 4 arrows',fireball:x(2)+' fire bursting over '+Math.round(32*A.r),
    nova:x(.7)+' to everyone within '+Math.round(60*A.r)+', slowed '+(3+A.dur)+'s',heal:'Heals you '+Math.round(30*A.dmg*sm)+'% and troops within '+Math.round(90*A.r)+' '+Math.round(20*A.dmg*sm)+'%',
    cry:'Troops within '+Math.round(90*A.r)+' fight harder for '+(6+A.dur)+'s; enemies flinch '+(.8+A.stun).toFixed(1)+'s',banner:'Troops within '+Math.round(100*A.r)+' take 25% less damage for '+(8+A.dur)+'s'}[id]+' · '+costText(A)+' · cooldown '+A.cd+'s';
}
/* the view: part of the Army window (ui/partypage.js), opened from a card's Skills (your hero's or a companion's) or by K (your
   hero's); its Back returns to that card on the Roster */
// whose it is: yours, or a companion's (who: its id)
const skWho=()=>G.skWho&&P.comps[G.skWho]?G.skWho:null;
const skSubj=()=>skWho()?compInit(skWho()):P;
function openSkills(tab,who){
  if(who&&!P.comps[who])return;if(G.mode==='world'&&!G.modal)G.mode='char';if(G.mode!=='char')return;// (K from the map: the Army window, on your hero's)
  if(who)charKit(charOf(compInit(who),who));G.skWho=who||null;
  G.mode='skills';G.skTreeList=false;G.skTab=tab||G.skTab||'prof';if(!['prof','talents','traits','abilities'].includes(G.skTab))G.skTab='prof';G.skGrow=true;renderSkills()}
const NODE_KIND=N=>({origin:'Origin',s:'Passive',n:'Notable',k:'Keystone'}[N.t]||(N.m.unlock?'Active skill':'Skill upgrade'));
// (the proficiencies whose trees it has: its own; the tree shown, G.skTree: one with a choice waiting, else your weapon's)
const skProfs=S=>PROF_GROUPS.flatMap(g=>g[1]).filter(k=>S.sk&&S.sk[k]&&PROF_TREE[k]);
function skTreeOf(S){const L=skProfs(S);if(L.includes(G.skTree))return G.skTree;const w=treePendingOf(S)[0];return w?w:L.includes(S===P?leaderOf(P).weaponProf():'oneh')?(S===P?leaderOf(P).weaponProf():'oneh'):L[0]}
/* a proficiency's tree as a path of nodes (the owner, 2026-11-08: "not an actual tree but a tree node path with more cool animation"):
   its root (the proficiency, its level) at the foot, each milestone a row of two nodes above, every node linked to both of the row
   below (any of them opens it: core/talents.js canTake); a rail at the side fills with the proficiency's level, a mark at each
   milestone. Links: learned ones gold with light flowing up them, the ways open now dashed and flickering, the rest dim. Nodes:
   hexagons, a keystone a diamond, an active skill ringed with a turning ring; learned gold and glowing, open pulsing, reached bronze,
   not yet dark. Shown anew (another proficiency, the page opened: G.skGrow) the nodes fly out of the root and the links draw after
   them, row by row; a node just learned (G.skJust) bursts (fieldbook.css "skill trees"). TREE_ART: its numbers, in the view's units */
const TREE_ART={w:420,h:380,root:[226,342],top:46,spread:[78,104],rail:34,r:{s:15,n:18,k:21,a:19}};
const NODE_GLYPH={s:'+',n:'◆',k:'✸',a:'✦'};
// (a hexagon of radius r round x, y)
const hexPts=(x,y,r)=>[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i+Math.PI/6;return (x+r*Math.cos(a)).toFixed(1)+','+(y+r*Math.sin(a)).toFixed(1)}).join(' ');
function treeSvg(S,k){
  const A=TREE_ART,T=PROF_TREE[k],n=T.length,TS=talentsOf(S),lv=TS.profLv(k),[rx,ry]=A.root,ys=T.map((_,i)=>Math.round(ry-70-(ry-70-A.top)*(n>1?i/(n-1):0)));
  const pos=(i,side)=>[rx+(side?1:-1)*A.spread[i%2],ys[i]],grow=!!G.skGrow,del=(i,b)=>grow?(.12+i*.2+(b||0)).toFixed(2)+'s':'0s';
  let defs='<defs><radialGradient id="tpGlow"><stop offset="0" stop-color="#ffe08a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient>'+
    '<linearGradient id="tpRail" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#b8862a"/><stop offset="1" stop-color="#ffe08a"/></linearGradient></defs>';
  // the field: faint motes; the rail of its level, to 100 (its nodes' strength: a quarter at 0, whole at 100, treeScale), marked each 25
  let svg=defs+[...Array(26)].map((_,i)=>'<circle class="tp-mote" cx="'+Math.round(hash(i,1,53)*A.w)+'" cy="'+Math.round(hash(i,2,53)*A.h)+'" r="'+(hash(i,3,53)<.3?1.6:1)+'" style="--t:'+(hash(i,4,53)*4).toFixed(2)+'s"/>').join('');
  const top=A.top-20,yAt=v=>ry-(ry-top)*Math.min(1,Math.max(0,v)/TREE_SCALE.full);
  const rl=A.rail,fy=yAt(lv);
  svg+='<line x1="'+rl+'" y1="'+ry+'" x2="'+rl+'" y2="'+(A.top-20)+'" class="tp-rail"/><line x1="'+rl+'" y1="'+ry+'" x2="'+rl+'" y2="'+fy.toFixed(1)+'" class="tp-railfill" pathLength="1" style="--d:'+del(0,-.1)+'"/>';
  [25,50,75,100].forEach(v=>{const y=Math.round(yAt(v));svg+='<g class="tp-mark'+(lv>=v?' on':'')+'"><line x1="'+(rl-6)+'" y1="'+y+'" x2="'+(rl+6)+'" y2="'+y+'"/><text x="'+(rl+10)+'" y="'+(y+4)+'">'+v+'</text></g>'});
  svg+='<circle cx="'+rl+'" cy="'+fy.toFixed(1)+'" r="4" class="tp-railhead"/><text x="'+(rl-2)+'" y="'+(ry+22)+'" class="tp-raillv" text-anchor="middle">'+lv+'</text>';
  // the links: the root to the first row, each row to the next (both ways), behind the nodes
  const linkOf=(x1,y1,x2,y2,a,b,i)=>{const lit=a&&b===true,open=a&&b&&b!==true&&b.open,mx=(x1+x2)/2,d='M'+x1+' '+y1+' C'+x1+' '+(y1-22)+' '+x2+' '+(y2+22)+' '+x2+' '+y2;
    return '<path class="tp-link'+(lit?' lit':open?' open':'')+'" pathLength="1" d="'+d+'" style="--d:'+del(i,.18)+'"/>'+(lit?'<path class="tp-flow" pathLength="1" d="'+d+'" style="--t:'+(hash(Math.round(mx),y1,7)*1.4).toFixed(2)+'s"/>':'')};
  const st=id=>{const h=treeHasOf(S,id);return h?true:{open:canTakeOf(S,id)}};
  T[0].forEach(([id],side)=>{const [x,y]=pos(0,side),b=st(id);svg+=linkOf(rx,ry-20,x,y+18,true,b,0)});
  for(let i=1;i<n;i++)T[i].forEach(([id],side)=>{const [x,y]=pos(i,side),b=st(id);T[i-1].forEach(([lo],s0)=>{const [x0,y0]=pos(i-1,s0),a=treeHasOf(S,lo);svg+=linkOf(x0,y0-18,x,y+18,a,b,i)})});
  // the root: the proficiency, its level
  svg+='<g class="tp-root" style="--d:'+del(0,-.15)+'"><circle cx="'+rx+'" cy="'+ry+'" r="34" fill="url(#tpGlow)"/><polygon points="'+hexPts(rx,ry,22)+'" class="tp-rootbody"/><text x="'+rx+'" y="'+(ry+5)+'" text-anchor="middle" class="tp-roottext">'+(w=>w.length>1?w.map(x=>x[0]).join(''):SKILLS[k].n.slice(0,2))(SKILLS[k].n.split(/[\s-]+/))+'</text></g>';
  // the nodes, each flying out of the root to its place
  T.forEach((pair,i)=>pair.forEach(([id],side)=>{const N=TREE[id],[x,y]=pos(i,side),have=treeHasOf(S,id),can=canTakeOf(S,id),ok=!N.tier||TS.tierHas(k,N.tier-1)>0,r=A.r[N.t]||16;
    const cls='tp-node '+(have?'have':can?'open':ok?'wait':'locked')+(G.skSel===id?' sel':'')+(G.skJust===id?' just':'');
    const body=N.t==='k'?'<rect x="'+(x-r*.8)+'" y="'+(y-r*.8)+'" width="'+(r*1.6)+'" height="'+(r*1.6)+'" rx="3" transform="rotate(45 '+x+' '+y+')" class="tp-body"/>':'<polygon points="'+hexPts(x,y,r)+'" class="tp-body"/>';
    svg+='<g class="'+cls+'" data-act="tree-sel" data-arg="'+id+'" role="button" tabindex="0" aria-pressed="'+(G.skSel===id)+'" aria-label="'+htmlText(N.n)+' ('+(have?'learned':can?'can learn':ok?'no point left':'grows from the tier below')+')" style="--d:'+del(i,.05)+';--fx:'+(rx-x)+'px;--fy:'+(ry-y)+'px">'+
      '<circle cx="'+x+'" cy="'+y+'" r="'+(r+16)+'" fill="url(#tpGlow)" class="tp-aura"/>'+(N.t==='a'?'<circle cx="'+x+'" cy="'+y+'" r="'+(r+6)+'" class="tp-ring"/>':'')+'<circle cx="'+x+'" cy="'+y+'" r="'+(r+10)+'" class="tp-burst"/>'+body+
      '<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" class="tp-glyph">'+NODE_GLYPH[N.t]+'</text><text x="'+x+'" y="'+(y+r+16)+'" text-anchor="middle" class="tp-name">'+htmlText(N.n)+'</text></g>'}));
  return '<svg class="tr-svg tp'+(grow?' grow':'')+'" viewBox="0 0 '+A.w+' '+A.h+'" preserveAspectRatio="xMidYMid meet" role="group" aria-label="'+SKILLS[k].n+' skill tree">'+svg+'</svg>';
}
// the node chosen on the tree: what it does, its kind and tier, how strong it is at its proficiency now, Learn (a point) or Unlearn
// (gold), or why not yet
function treeNodePane(S,k){
  const id=G.skSel&&TREE[G.skSel]&&TREE[G.skSel].prof===k?G.skSel:null;if(!id)return '<aside class="tr-pane"><p class="muted">Choose a node on the tree to see it.</p></aside>';
  const N=TREE[id],T=talentsOf(S),have=T.has(id),can=T.canTake(id),pts=T.points(),u=N.m.unlock,refund=T.quoteRefund(id),lv=T.profLv(k),sc=Math.round(100*treeScale(lv));
  const why=have?(refund.ok?'':refund.code==='gold'?'Not enough gold to unlearn it.':'A node above grows from it: unlearn that first.'):N.tier&&!T.tierHas(k,N.tier-1)?'Learn a node of the tier below first.':!pts.left?'No skill points left: one each level.':'';
  const str=Object.keys(N.m).some(q=>typeof N.m[q]==='number'||q==='sk')?'<p class="muted">At '+SKILLS[k].n+' '+lv+' it gives '+sc+'% of this (a quarter at 0, whole at 100, more past it).</p>':'';
  return '<aside class="tr-pane"><small>'+NODE_KIND(N)+' · '+SKILLS[k].n+' tier '+(N.tier+1)+'</small><h3>'+htmlText(N.n)+'</h3><p>'+N.d+'</p>'+str+(u&&S===P?'<p class="muted">'+skillStats(u)+'.</p>':'')+
    (have?'<p class="good">Learned</p>'+fbBtn('tree-refund',id,'Unlearn · '+refundCost()+'g',refund.ok?'':'x'):fbBtn('tree-take',id,fbIcon('skills')+' Learn · 1 point',can?'':'x','primary'))+(why?'<p class="muted">'+why+'</p>':'')+'</aside>'}
/* the traits (were Basics; the owner, 2026-11-08): the moves everyone has from the start, and what your race and your past are. The
   combo's Third Blow and its finishers are nodes of the weapons' trees (data/tree.js combo3, fin) */
const HERO_TRAITS=[
  {id:'combo',n:'Combo',d:()=>'Two blows in a row with a melee weapon; a third, the finisher, from a Third Blow or a finisher in the One-Handed, Two-Handed or Unarmed tree.'},
  {id:'dodge',n:'Dodge Roll',d:()=>'A quick roll you cannot be hit in, away from trouble · '+dodgeCost()+' stamina · every '+dodgeCd().toFixed(1)+'s'},
  {id:'shove',n:'Shove',d:()=>'With a bow: push back an enemy who reaches you and stagger them '+SHOVE.stun+'s · '+SHOVE.sp+' stamina'},
  {id:'bash',n:'Shield Bash',d:()=>'With a shield: slam an enemy in front of you, stagger '+BASH.stun+'s, '+BASH.mult+'× damage · '+BASH.sp+' stamina'}];
// (the knacks: a race's and a past's proficiencies learned faster, P.apt)
const knackText=apt=>Object.keys(apt||{}).filter(k=>apt[k]>0&&SKILLS[k]).map(k=>SKILLS[k].n+' +'+Math.round(apt[k]*100)+'%').join(', ');
function traitBody(){
  const S=skSubj(),who=skWho(),race=who?ST[who]&&ST[who].race:P.race,R=RACES[race]||RACES.human,B=!who&&BGS[P.bg],card=(n,d,cls)=>'<div class="spnode on'+(cls?' '+cls:'')+'"><strong>'+n+'</strong><small>'+d+'</small></div>';
  return (who?'':'<div class="lab" style="margin-top:6px">Your attack · with the weapon in hand</div>'+heroAttackRow())+'<div class="lab" style="margin-top:6px">Moves · everyone has them from the start</div><div class="specials">'+HERO_TRAITS.filter(T=>who||T.id!=='combo').map(T=>card(T.n,T.d())).join('')+'</div>'+
    '<div class="lab" style="margin-top:10px">Your people · '+htmlText(R.n)+'</div><div class="specials">'+card(R.n,htmlText(R.d))+'</div>'+
    (B?'<div class="lab" style="margin-top:10px">Your past · '+htmlText(B.n)+'</div><div class="specials">'+card(B.n,htmlText(B.d))+(knackText(P.apt)?card('Knack','Learned faster: '+knackText(P.apt)+'.'):'')+'</div>':'');
}
// the Skill bar: the ten slots your hero uses in battle and the active skills you have learned
function skillSlotPick(i){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 fbChoose({title:'Skill slot '+(i+1),value:S.slots[i]||'',items:[{id:'',name:'Empty slot',sub:'No skill assigned',ico:'skills'},...known.map(k=>({id:k,name:HSKILLS[k].n,sub:HSKILLS[k].d,ico:'skills',note:S.slots.includes(k)&&S.slots[i]!==k?'Moves this skill from slot '+(S.slots.indexOf(k)+1)+'.':''}))],back:renderSkills,apply:k=>{talentsOf(S).assignSlot(i,k);renderSkills()},focus:'[data-act="sk-slot"][data-arg="'+i+'"]'});
}
function skillBarBody(){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 return '<div class="lab">Skill slots · used automatically in battle</div><div class="fb-slot-grid">'+SLOT_KEYS.map((k,i)=>{const id=S.slots[i];return fbBtn('sk-slot',i,'<small>'+(i+1)+'</small>'+fbIcon('skills',28)+'<strong>'+(id?HSKILLS[id].n:'Empty')+'</strong>','','fb-slot')}).join('')+'</div><div class="lab">Active skills</div>'+(known.length?known.map(id=>'<div class="row"><div class="info"><strong>'+HSKILLS[id].n+'</strong><small>'+HSKILLS[id].d+'</small>'+(S===P?'<small>'+skillStats(id)+'</small>':'')+'<small class="'+(S.slots.includes(id)?'gold':'muted')+'">'+(S.slots.includes(id)?'In slot '+(S.slots.indexOf(id)+1):'Not assigned · will not be used in battle')+'</small></div></div>').join(''):'<p>No active skills yet. Learn them in the skill trees as your proficiencies rise.</p>');
}
// your hero's own attack with the weapon in hand: the combo, the shot or the cast, with its numbers
function heroAttackRow(){
 const row=(name,stats,note)=>'<div class="row"><div class="info"><strong>'+name+'</strong><small>'+stats+'</small>'+(note?'<small>'+note+'</small>':'')+'</div></div>',CB=heroCombo();
 return heroKind()==='melee'?row('Combo','<span>'+CB.map(c=>c.n+' ×'+c.mult).join(' → ')+'</span>',CB.length<3?'<span class="muted">A third blow: Third Blow in your weapon\'s skill tree (at 15)</span>':heroFin()?'<span class="gold">'+(heroFin()==='stun'?'Stunning':'Crushing')+' finisher</span>':'<span class="muted">Its finishing style: a finisher in your weapon\'s skill tree (at 60)</span>')+(unarmed()?row('Grapple','Bare hands: now and then you seize the one before you and throw him, perhaps down · every '+Moveset.of({hero:true,s:{},type:'hero'}).hard.cd.toFixed(1)+'s'):'')
  :heroKind()==='ranged'?row('Shoot ('+ITEMS[P.gear.weapon].n.toLowerCase()+')',heroQuiverText()+'Your hero draws and looses at whoever is in range.')
  :row('Cast ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Magic bolts, '+heroShot().mult+'× damage, splash half to enemies beside the target, ignore armor and trees · '+heroShot().mp+' mana each · every '+heroShot().cd+'s');
}
/* the Proficiency tab: your level, its experience and the skill points it left you (characters.js xpNeed; the tree's points, LEVEL.pts
   a level), then each proficiency (from 0, no top) with its bar, its power and what the tree, gear and roles add, a knack, what it does */
const PROF_GROUPS=[['Fighting',['oneh','twoh','block','archery','spell','fist','athl']],['Command',['lead','tact','med','eng','pers']],['The road',['scout','ride','wood','hunt','surv']],['Trade and rule',['trade','stew']]];
function profBody(){
  const S=skSubj(),who=skWho(),C=who?compOf(who):leaderOf(P),lvl=who?S.lv:P.level,need=C.xpNeed(),pc=Math.min(100,Math.round(100*(S.xp||0)/need)),keys=who?Object.keys(COMP_SK):null;
  const pts=talentsOf(S).points(),xp=Math.floor(S.xp||0);
  const head='<div class="row fb-prof-level"><div class="info"><strong>Level '+lvl+(pts.left?' · <span class="gold">'+pts.left+' skill point'+(pts.left===1?'':'s')+' to spend</span>':'')+'</strong><small>Experience comes from battles, quests, beasts and lore, and from every level your proficiencies reach. Each level: '+LEVEL.pts+' skill point for the tree (Skill trees).</small><div class="bar" role="progressbar" aria-label="Level progress" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div><small>'+xp+' / '+Math.round(need)+' XP to level '+(lvl+1)+'</small></div></div>';
  const row=k=>{const s=S.sk[k];if(!s)return '';const lv=s.lv,pw=profPow(lv),bonus=who?0:skill(k)-pw,pc2=Math.round(100*s.xp/SK_XP(lv)),apt=!who&&P.apt&&P.apt[k];
    return '<div class="row"><div class="info"><strong>'+SKILLS[k].n+(apt?' <span class="good" style="font-size:12px">knack +'+Math.round(apt*100)+'%</span>':'')+'</strong><small>'+SKILLS[k].d+' · power '+pw.toFixed(1)+(bonus>=.05?' <span class="good">+'+bonus.toFixed(1)+'</span> from your tree, gear and roles':'')+'</small><div class="bar" role="progressbar" aria-label="'+SKILLS[k].n+' progress" aria-valuenow="'+pc2+'"><i style="width:'+pc2+'%"></i></div></div><span class="own">'+lv+'</span></div>'};
  return head+'<p class="muted" style="font-size:13px">Proficiencies rise as you use them, with no top. The higher one is, the stronger the nodes of its tree (a quarter at 0, whole at 100).</p>'+PROF_GROUPS.map(([g,L])=>{const r=L.filter(k=>!keys||keys.includes(k)).map(row).join('');return r?'<div class="lab">'+g+'</div>'+r:''}).join('');
}
// the Skill trees tab: the shown one's tree, the main thing, and the chosen node; under it the switch between the proficiencies (the
// owner, 2026-11-08: "the selection between proficiency should be at the bottom and have an arrow to click or swap between them. Or
// can press to show list of all"): ‹ the one before (faded), this one (its level, its points left), the one after (faded) ›, round
// and round (tree-step), the arrows by this one's name; its name opens the list of them all (tree-list, G.skTreeList), their points left marked
const treeWait=n=>n?'<b class="fb-tree-wait" title="Points to spend">'+n+'</b>':'';
const tsBtn=(a,arg,label,name,cls)=>'<button type="button" class="btn sm '+cls+'" data-act="'+a+'"'+(arg!=null?' data-arg="'+arg+'"':'')+' title="'+htmlText(name)+'" aria-label="'+htmlText(name)+'">'+label+'</button>';
function skTreeBody(){
 const S=skSubj(),k=skTreeOf(S),L=skProfs(S),T=talentsOf(S),pts=T.points(k),i=L.indexOf(k),at=d=>L[(i+d+L.length)%L.length],open=!!G.skTreeList,more=L.some(p=>p!==k&&T.pending(p).length);
 const side=d=>{const p=at(d);return L.length>1?tsBtn('tree-step',String(d),(d>0?'<i class="fb-ts-ar" aria-hidden="true">›</i>':'')+'<span>'+SKILLS[p].n+'</span>'+treeWait(T.pending(p).length?'•':0)+(d<0?'<i class="fb-ts-ar" aria-hidden="true">‹</i>':''),(d<0?'Before: ':'Next: ')+SKILLS[p].n,'fb-ts-side '+(d<0?'prev':'next')):''};
 const list='<nav class="fb-tree-list'+(open?' open':'')+'" aria-label="Proficiencies"'+(open?'':' hidden')+' data-fb-scroll="tree-profs:'+htmlText(skWho()||'hero')+'">'+L.map(p=>
   fbBtn('tree-prof',p,'<strong>'+SKILLS[p].n+'</strong><small>'+S.sk[p].lv+'</small>'+treeWait(T.pending(p).length?'•':0),'',p===k?'on':'')).join('')+'</nav>';
 const sw='<div class="fb-tree-switch">'+side(-1)+tsBtn('tree-list',null,'<strong>'+SKILLS[k].n+'</strong><small>'+T.profLv(k)+'</small>'+treeWait(pts.left)+'<i class="fb-ts-more'+(more?' wait':'')+'" aria-hidden="true">'+(open?'▴':'▾')+'</i>',open?'Hide the list':'All proficiencies','fb-ts-now'+(open?' on':''))+side(1)+'</div>';
 const out='<div class="fb-skill-work fb-trees"><section class="fb-tree-pane" aria-label="'+SKILLS[k].n+' skill tree"><div class="fb-tree-head"><strong>'+SKILLS[k].n+' · '+T.profLv(k)+'</strong><small>'+
   '<b class="'+(pts.left?'gold':'')+'">'+pts.left+' skill point'+(pts.left===1?'':'s')+' to spend</b> · one each level, on any tree · its nodes '+Math.round(100*treeScale(T.profLv(k)))+'% strong at '+SKILLS[k].n+' '+T.profLv(k)+'</small></div>'+
   '<div class="tr-stage">'+treeSvg(S,k)+treeNodePane(S,k)+list+'</div>'+sw+'</section></div>';
 G.skGrow=false;G.skJust=null;return out;
}
function renderSkills(){
 const S=skSubj(),who=skWho(),tab=G.skTab,n=treePendingOf(S).length,pts=n?n+' skill point'+(n>1?'s':'')+' to spend':'no skill point to spend';
 const tabs=fbTabs([['prof',fbIcon('book')+' Proficiency'],['talents',fbIcon('skills')+' Skill trees'],['traits',fbIcon('shield')+' Trait'],['abilities',fbIcon('sword')+' Skill bar']],tab,'sk-tab','Skills sections');// (the owner's order, 2026-11-08)
 const body=tab==='talents'?skTreeBody():'<div class="fb-scroll" data-fb-scroll="skills:'+tab+'">'+(tab==='abilities'?skillBarBody():tab==='traits'?traitBody():profBody())+'</div>';
 fbShow(who?COMPS[who].short+'’s skills':'Skills','Level '+(who?S.lv:P.level)+' · '+pts,tabs,body,['sk-close',null,'Back to '+(who?COMPS[who].short:'Army')],['sk-map',null,'Back to map'],'fb-skills','Army · '+htmlText(bandName()));
}
function skillsAct(a,arg){
  if(!a.startsWith('sk-')&&!a.startsWith('tree-')&&!a.startsWith('lv-')&&a!=='slot-set')return false;
  if(a==='sk-map'){G.skWho=null;G.mode='world';hidePanel();return true}
  if(a==='sk-close'){const who=skWho(),s=partyView();G.skWho=null;G.mode='char';G.char='roster';G.armyEdit=null;s.sel=who?'comp_'+who:'hero';s.open=true;s.path=false;if(who)compPick(who);renderChar();return true}// (back to its card)
  if(G.mode!=='skills')return true;
  if(a==='sk-tab'){if(['prof','talents','traits','abilities'].includes(arg)){if(arg==='talents'&&G.skTab!=='talents')G.skGrow=true;G.skTab=arg}}
  else if(a==='tree-prof'&&PROF_TREE[arg]){if(G.skTree!==arg)G.skGrow=true;G.skTree=arg;G.skSel=null;G.skTreeList=false}
  else if(a==='tree-step'){const S=skSubj(),L=skProfs(S),i=L.indexOf(skTreeOf(S)),p=L[(i+(+arg<0?-1:1)+L.length)%L.length];if(p&&p!==G.skTree){G.skGrow=true;G.skTree=p;G.skSel=null}G.skTreeList=false}
  else if(a==='tree-list')G.skTreeList=!G.skTreeList;
  else if(a==='tree-sel'&&TREE[arg])G.skSel=arg;
  else if(a==='sk-slot'){skillSlotPick(Number(arg));return true}
  else if(a==='tree-take'){if(takeNodeOf(skSubj(),arg)){G.skSel=arg;G.skJust=arg}}
  else if(a==='tree-refund')refundNodeOf(skSubj(),arg);
  else if(a==='slot-set'){const [i,id]=String(arg).split(':');talentsOf(skSubj()).assignSlot(+i,id)}
  updateHUD(true);renderSkills();return true;
}
addEventListener('resize',()=>{if(G.mode==='skills'&&!FIELDBOOK.pick)renderSkills()});
// (a node of the tree: Enter or Space chooses it, as a click)
// (← and →: the proficiency before or after, on the Skill trees tab)
panel.addEventListener('keydown',e=>{if(G.mode!=='skills'||G.skTab!=='talents'||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest?.('input,select,textarea'))return;e.preventDefault();act('tree-step',e.key==='ArrowLeft'?'-1':'1')});
panel.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.tp-node');if(!g||G.mode!=='skills'||!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();act('tree-sel',g.dataset.arg)});
onAct('sk-',skillsAct);onAct('tree-',skillsAct);onAct('slot-',skillsAct);onAct('lv-',skillsAct);
