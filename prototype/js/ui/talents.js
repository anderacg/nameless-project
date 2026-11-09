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
    cry:'Troops within '+Math.round(90*A.r)+' fight harder for '+(6+A.dur)+'s; enemies flinch '+(.8+A.stun).toFixed(1)+'s',banner:'Troops within '+Math.round(100*A.r)+' take 25% less damage for '+(8+A.dur)+'s'}[id]+', '+costText(A)+', cooldown '+A.cd+'s';
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
const NODE_KIND=N=>({origin:'Origin',s:'Passive',n:'Notable',k:'Keystone',b:'Bonus'}[N.t]||(N.m.unlock?'Active skill':'Skill upgrade'));
// (the proficiencies whose trees it has: its own; the tree shown, G.skTree: one with a choice waiting, else your weapon's)
const skProfs=S=>TREE_RING.flatMap(g=>g[1]).filter(k=>S.sk&&S.sk[k]&&PROF_TREE[k]);// (round the wheel, data/tree.js TREE_RING)
function skTreeOf(S){const L=skProfs(S);if(L.includes(G.skTree))return G.skTree;const w=treePendingOf(S)[0];return w?w:L.includes(S===P?leaderOf(P).weaponProf():'oneh')?(S===P?leaderOf(P).weaponProf():'oneh'):L[0]}
/* the round tree (the owner, 2026-11-08: "one big circle node tree spans across each proficiency"): your origin in the middle; each
   proficiency a slice of the circle (data/tree.js TREE_RING's order, a gap between groups, its name at its foot), its path out from the
   middle: a tier's pair side by side across the slice, the bonus node between two tiers on its middle line (ring n at r0 + n × dr). The
   shown proficiency's slice is turned to the top (the wheel spins to it from the last one shown: G.skRot) and the view holds that slice
   (its names shown, the rest dim); G.skWhole: the whole circle. Links learned gold with light flowing along them, the ways open now
   dashed and flickering, the rest dim; nodes hexagons (a keystone a diamond, a bonus a small one, an active skill ringed): learned gold,
   open pulsing, reachable bronze, not yet dark. Shown anew (G.skGrow) the nodes fly out of the middle; one just learned (G.skJust)
   bursts. TREE_ROUND: its numbers, in the view's units (r0 far enough out that the first ring's nodes, evenly spaced, never touch:
   the owner, 2026-11-09, "make the node not overlap") */
const TREE_ROUND={r0:400,dr:46,gap:.6,spread:.25,top:46,foot:92,half:250,r:{s:17,n:19,k:22,a:20,b:9}};
const NODE_GLYPH={s:'+',n:'◆',k:'✸',a:'✦',b:''};
// (a hexagon of radius r round x, y)
const hexPts=(x,y,r)=>[0,1,2,3,4,5].map(i=>{const a=Math.PI/3*i+Math.PI/6;return (x+r*Math.cos(a)).toFixed(1)+','+(y+r*Math.sin(a)).toFixed(1)}).join(' ');
// (every node's place, each slice's angle (a, radians, 0 east), width and rim; made once)
let TREE_POS=null;
function treePos(){if(TREE_POS)return TREE_POS;const R=TREE_ROUND,P={},sec={},units=TREE_RING.reduce((n,[,L])=>n+L.length+R.gap,0);let u=R.gap/2;
  for(const [g,L] of TREE_RING){for(const k of L){const a=-Math.PI/2+(u+.5)/units*2*Math.PI,w=2*Math.PI/units,da=w*R.spread;u++;let top=0;
    // (each node on its ring (data/tree.js ring): a pair a quarter of its slice either side of its middle, a bonus node on its middle;
    // every node evenly spaced round each ring, none touching another)
    for(const id in TREE){const N=TREE[id];if(N.prof!==k)continue;const r=R.r0+N.ring*R.dr,b=N.hub?a:a+(PROF_TREE[k][N.tier][0][0]===id?-da:da);P[id]=[r*Math.cos(b),r*Math.sin(b)];top=Math.max(top,N.ring)}
    sec[k]={a,w,g,rim:R.r0+top*R.dr}}u+=R.gap}
  return TREE_POS={P,sec,rim:Math.max(...Object.values(sec).map(q=>q.rim))}}
// (the view of the wheel: the shown slice turned up, from just under its foot to over its rim; or the whole circle)
const treeView=(k,whole)=>{const R=TREE_ROUND,{sec,rim}=treePos(),s=sec[k]||sec.oneh;return whole?[-(rim+110),-(rim+110),2*(rim+110),2*(rim+110)]:[-R.half,-(s.rim+R.top),2*R.half,s.rim+R.top-R.r0+R.foot]};
const twKey=k=>k+(G.skWhole?'*':'');
// (a name beside its node, outward of its pair (side -1 left, 1 right), in two lines when long)
const nameLines=(n,x,y,side)=>{const w=n.split(' '),tx=(x+side*(TREE_ROUND.r.n+9)).toFixed(1);if(n.length<11||w.length<2)return '<tspan x="'+tx+'" y="'+(y+5).toFixed(1)+'">'+htmlText(n)+'</tspan>';const h=Math.ceil(w.length/2);
  return '<tspan x="'+tx+'" y="'+(y-3).toFixed(1)+'">'+htmlText(w.slice(0,h).join(' '))+'</tspan><tspan x="'+tx+'" dy="17">'+htmlText(w.slice(h).join(' '))+'</tspan>'};
function treeSvg(S,k){
  const R=TREE_ROUND,{P,sec,rim}=treePos(),TS=talentsOf(S),whole=!!G.skWhole,grow=!!G.skGrow,f=sec[k]||sec.oneh,rot=whole?0:-90-f.a*180/Math.PI,
    from=G.skRot==null?rot:G.skRot,deg=d=>((d%360)+540)%360-180,spin=from+deg(rot-from);G.skRot=spin;
  const del=(x,y)=>grow?(.1+Math.hypot(x,y)/rim*.7).toFixed(2)+'s':'0s',up=(x,y)=>' transform="rotate('+(-spin).toFixed(2)+' '+x.toFixed(1)+' '+y.toFixed(1)+')"';
  let defs='<defs><radialGradient id="tpGlow"><stop offset="0" stop-color="#ffe08a" stop-opacity=".55"/><stop offset="1" stop-color="#ffe08a" stop-opacity="0"/></radialGradient></defs>';
  // the field: faint motes; the rings each tier stands on
  let svg='';for(let n=0;n<=9;n+=3)svg+='<circle cx="0" cy="0" r="'+(R.r0+n*R.dr)+'" class="tw-ring"/>';
  svg+=[...Array(60)].map((_,i)=>{const a=hash(i,1,53)*Math.PI*2,r=hash(i,2,53)*(rim+60);return '<circle class="tp-mote" cx="'+(r*Math.cos(a)).toFixed(0)+'" cy="'+(r*Math.sin(a)).toFixed(0)+'" r="'+(hash(i,3,53)<.3?2:1.3)+'" style="--t:'+(hash(i,4,53)*4).toFixed(2)+'s"/>'}).join('');
  // each slice: its spoke from the middle, its proficiency's name and level at its foot, the shown one lit
  for(const q in sec){const s=sec[q],x=Math.cos(s.a),y=Math.sin(s.a),lx=(R.r0-62)*x,ly=(R.r0-62)*y,on=q===k,lv=TS.profLv(q);if(!whole&&!on){svg+='<line x1="'+(48*x).toFixed(1)+'" y1="'+(48*y).toFixed(1)+'" x2="'+((R.r0-26)*x).toFixed(1)+'" y2="'+((R.r0-26)*y).toFixed(1)+'" class="tw-spoke"/>';continue}
    svg+='<line x1="'+(48*x).toFixed(1)+'" y1="'+(48*y).toFixed(1)+'" x2="'+((R.r0-26)*x).toFixed(1)+'" y2="'+((R.r0-26)*y).toFixed(1)+'" class="tw-spoke'+(on?' on':'')+'"/>'+
      '<g class="tw-sec'+(on?' on':'')+'" data-act="tree-focus" data-arg="'+q+'" role="button" aria-label="'+htmlText(SKILLS[q].n)+'"><text x="'+lx.toFixed(1)+'" y="'+ly.toFixed(1)+'" text-anchor="middle"'+up(lx,ly)+'>'+htmlText(SKILLS[q].n)+'<tspan x="'+lx.toFixed(1)+'" dy="14" class="tw-lv">'+lv+'</tspan></text></g>'}
  // the groups, named outside the rim at their middle
  for(const [g,L] of TREE_RING){const a=(sec[L[0]].a+sec[L[L.length-1]].a)/2,r=rim+70,x=r*Math.cos(a),y=r*Math.sin(a);svg+='<text x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" text-anchor="middle" class="tw-group"'+up(x,y)+'>'+htmlText(g)+'</text>'}
  // the links, behind the nodes: each once, the first pairs' to the middle
  const st=id=>treeHasOf(S,id),done=new Set(),ids=Object.keys(P),linkOf=(x1,y1,x2,y2,a,b,open,cur)=>'<path class="tp-link'+(a&&b?' lit':open?' open':'')+(cur?'':' far')+'" pathLength="1" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" style="--d:'+del(x2,y2)+'"/>'+(a&&b?'<path class="tp-flow" pathLength="1" d="M'+x1.toFixed(1)+' '+y1.toFixed(1)+' L'+x2.toFixed(1)+' '+y2.toFixed(1)+'" style="--t:'+(hash(Math.round(x2),Math.round(y2),7)*1.4).toFixed(2)+'s"/>':'');
  for(const id of ids){const N=TREE[id],[x,y]=P[id],cur=N.prof===k||whole;
    if(N.entry){const s=sec[N.prof],sx=(R.r0-26)*Math.cos(s.a),sy=(R.r0-26)*Math.sin(s.a);svg+=linkOf(sx,sy,x,y,true,st(id),canTakeOf(S,id),cur)}
    for(const l of N.links){if(done.has(l+'|'+id)||!P[l])continue;done.add(id+'|'+l);const [x2,y2]=P[l],a=st(id),b=st(l);svg+=linkOf(x,y,x2,y2,a,b,a&&canTakeOf(S,l)||b&&canTakeOf(S,id),cur)}}
  // the middle: your origin (a companion's, a lord's: their start)
  const O=TREE[TS.root()]||TREE.start;svg+='<g class="tp-root"><circle cx="0" cy="0" r="58" fill="url(#tpGlow)"/><polygon points="'+hexPts(0,0,34)+'" class="tp-rootbody"/><text x="0" y="5" text-anchor="middle" class="tp-roottext"'+up(0,0)+'>'+htmlText(O.n)+'</text></g>';
  // the nodes, each flying out of the middle to its place; their names over everything (labs)
  let labs='';for(const id of ids){const N=TREE[id],[x,y]=P[id],have=st(id),can=canTakeOf(S,id),ok=TS.reach(id),r=R.r[N.t]||16,cur=N.prof===k;
    const cls='tp-node '+(have?'have':can?'open':ok?'wait':'locked')+(N.t==='b'?' bonus':'')+(cur||whole?'':' far')+(G.skSel===id?' sel':'')+(G.skJust===id?' just':'');
    const body=N.t==='k'?'<rect x="'+(x-r*.8).toFixed(1)+'" y="'+(y-r*.8).toFixed(1)+'" width="'+(r*1.6).toFixed(1)+'" height="'+(r*1.6).toFixed(1)+'" rx="3" transform="rotate(45 '+x.toFixed(1)+' '+y.toFixed(1)+')" class="tp-body"/>':'<polygon points="'+hexPts(x,y,r)+'" class="tp-body"/>';
    svg+='<g class="'+cls+'" data-act="tree-sel" data-arg="'+id+'" role="button" tabindex="'+(cur?0:-1)+'" aria-pressed="'+(G.skSel===id)+'" aria-label="'+htmlText(N.n)+' ('+(have?'learned':can?'can learn':ok?'no point left':'not reached yet')+')" style="--d:'+del(x,y)+';--fx:'+(-x).toFixed(0)+'px;--fy:'+(-y).toFixed(0)+'px">'+
      '<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r+16)+'" fill="url(#tpGlow)" class="tp-aura"/>'+(N.t==='a'?'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r+6)+'" class="tp-ring"/>':'')+'<circle cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" r="'+(r+10)+'" class="tp-burst"/>'+body+
      (NODE_GLYPH[N.t]?'<text x="'+x.toFixed(1)+'" y="'+(y+5).toFixed(1)+'" text-anchor="middle" class="tp-glyph"'+up(x,y)+'>'+NODE_GLYPH[N.t]+'</text>':'')+
      '</g>';if(N.t!=='b'&&!whole&&cur){const side=PROF_TREE[N.prof][N.tier][0][0]===id?-1:1;labs+='<g class="tp-lab '+(have?'have':can?'open':ok?'wait':'locked')+'" style="--d:'+del(x,y)+'"><text text-anchor="'+(side<0?'end':'start')+'" class="tp-name"'+up(x,y)+'>'+nameLines(N.n,x,y,side)+'</text></g>'}}
  svg+=labs;
  // the view: the shown slice turned up, from just under its foot to over its rim (or the whole circle)
  const vb=G.skVB&&G.skVBk===twKey(k)?G.skVB:treeView(k,whole);
  return '<svg class="tr-svg tp tw'+(grow?' grow':'')+(whole?' whole':'')+'" data-key="'+twKey(k)+'" viewBox="'+vb.map(v=>+v.toFixed(1)).join(' ')+'" preserveAspectRatio="xMidYMid meet" role="group" aria-label="The skill tree, '+SKILLS[k].n+' shown">'+defs+
    '<g class="tw-wheel" style="--from:'+from.toFixed(2)+'deg;--to:'+spin.toFixed(2)+'deg;transform:rotate('+spin.toFixed(2)+'deg)">'+svg+'</g></svg>';
}
// the node chosen on the tree: what it does, its kind and tier, how strong it is at its proficiency now, Learn (a point) or Unlearn
// (gold), or why not yet
function treeNodePane(S,k){
  const id=G.skSel&&TREE[G.skSel]&&TREE[G.skSel].prof===k?G.skSel:null;if(!id)return '<aside class="tr-pane"><p class="muted">Choose a node on the tree to see it.</p></aside>';
  const N=TREE[id],T=talentsOf(S),have=T.has(id),can=T.canTake(id),pts=T.points(),u=N.m.unlock,refund=T.quoteRefund(id),lv=T.profLv(k),sc=Math.round(100*treeScale(lv));
  const why=have?(refund.ok?'':refund.code==='gold'?'Not enough gold to unlearn it.':'A node above grows from it: unlearn that first.'):N.tier&&!T.tierHas(k,N.tier-1)?'Learn a node of the tier below first.':!pts.left?'No skill points left: one each level.':'';
  const str=Object.keys(N.m).some(q=>typeof N.m[q]==='number'||q==='sk')?'<p class="muted">At '+SKILLS[k].n+' '+lv+' it gives '+sc+'% of this (a quarter at 0, whole at 100, more past it).</p>':'';
  return '<aside class="tr-pane"><small>'+NODE_KIND(N)+', '+SKILLS[k].n+(N.hub?' path, after tier '+(N.tier+1):' tier '+(N.tier+1))+'</small><h3>'+htmlText(N.n)+'</h3><p>'+N.d+'</p>'+str+(u&&S===P?'<p class="muted">'+skillStats(u)+'.</p>':'')+
    (have?'<p class="good">Learned</p>'+fbBtn('tree-refund',id,'Unlearn, '+refundCost()+'g',refund.ok?'':'x'):fbBtn('tree-take',id,fbIcon('skills')+' Learn, 1 point',can?'':'x','primary'))+(why?'<p class="muted">'+why+'</p>':'')+'</aside>'}
/* the traits (were Basics; the owner, 2026-11-08): the moves everyone has from the start, and what your race and your past are. The
   combo's Third Blow and its finishers are nodes of the weapons' trees (data/tree.js combo3, fin) */
const HERO_TRAITS=[
  {id:'combo',n:'Combo',d:()=>'Two blows in a row with a melee weapon; a third, the finisher, from a Third Blow or a finisher in the One-Handed, Two-Handed or Unarmed tree.'},
  {id:'dodge',n:'Dodge Roll',d:()=>'A quick roll you cannot be hit in, away from trouble, '+dodgeCost()+' stamina, every '+dodgeCd().toFixed(1)+'s'},
  {id:'shove',n:'Shove',d:()=>'With a bow: push back an enemy who reaches you and stagger them '+SHOVE.stun+'s, '+SHOVE.sp+' stamina'},
  {id:'bash',n:'Shield Bash',d:()=>'With a shield: slam an enemy in front of you, stagger '+BASH.stun+'s, '+BASH.mult+'× damage, '+BASH.sp+' stamina'}];
// (the knacks: a race's and a past's proficiencies learned faster, P.apt)
const knackText=apt=>Object.keys(apt||{}).filter(k=>apt[k]>0&&SKILLS[k]).map(k=>SKILLS[k].n+' +'+Math.round(apt[k]*100)+'%').join(', ');
function traitBody(){
  const S=skSubj(),who=skWho(),race=who?ST[who]&&ST[who].race:P.race,R=RACES[race]||RACES.human,B=!who&&BGS[P.bg],card=(n,d,cls)=>'<div class="spnode on'+(cls?' '+cls:'')+'"><strong>'+n+'</strong><small>'+d+'</small></div>';
  return (who?'':'<div class="lab" style="margin-top:6px">Your attack, with the weapon in hand</div>'+heroAttackRow())+'<div class="lab" style="margin-top:6px">Moves, everyone has them from the start</div><div class="specials">'+HERO_TRAITS.filter(T=>who||T.id!=='combo').map(T=>card(T.n,T.d())).join('')+'</div>'+
    '<div class="lab" style="margin-top:10px">Your people, '+htmlText(R.n)+'</div><div class="specials">'+card(R.n,htmlText(R.d))+'</div>'+
    (B?'<div class="lab" style="margin-top:10px">Your past, '+htmlText(B.n)+'</div><div class="specials">'+card(B.n,htmlText(B.d))+(knackText(P.apt)?card('Knack','Learned faster: '+knackText(P.apt)+'.'):'')+'</div>':'');
}
// the Skill bar: the ten slots your hero uses in battle and the active skills you have learned
function skillSlotPick(i){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 fbChoose({title:'Skill slot '+(i+1),value:S.slots[i]||'',items:[{id:'',name:'Empty slot',sub:'No skill assigned',ico:'skills'},...known.map(k=>({id:k,name:HSKILLS[k].n,sub:HSKILLS[k].d,ico:'skills',note:S.slots.includes(k)&&S.slots[i]!==k?'Moves this skill from slot '+(S.slots.indexOf(k)+1)+'.':''}))],back:renderSkills,apply:k=>{talentsOf(S).assignSlot(i,k);renderSkills()},focus:'[data-act="sk-slot"][data-arg="'+i+'"]'});
}
function skillBarBody(){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 return '<div class="lab">Skill slots, used automatically in battle</div><div class="fb-slot-grid">'+SLOT_KEYS.map((k,i)=>{const id=S.slots[i];return fbBtn('sk-slot',i,'<small>'+(i+1)+'</small>'+fbIcon('skills',28)+'<strong>'+(id?HSKILLS[id].n:'Empty')+'</strong>','','fb-slot')}).join('')+'</div><div class="lab">Active skills</div>'+(known.length?known.map(id=>'<div class="row"><div class="info"><strong>'+HSKILLS[id].n+'</strong><small>'+HSKILLS[id].d+'</small>'+(S===P?'<small>'+skillStats(id)+'</small>':'')+'<small class="'+(S.slots.includes(id)?'gold':'muted')+'">'+(S.slots.includes(id)?'In slot '+(S.slots.indexOf(id)+1):'Not assigned, will not be used in battle')+'</small></div></div>').join(''):'<p>No active skills yet. Learn them in the skill trees as your proficiencies rise.</p>');
}
// your hero's own attack with the weapon in hand: the combo, the shot or the cast, with its numbers
function heroAttackRow(){
 const row=(name,stats,note)=>'<div class="row"><div class="info"><strong>'+name+'</strong><small>'+stats+'</small>'+(note?'<small>'+note+'</small>':'')+'</div></div>',CB=heroCombo();
 return heroKind()==='melee'?row('Combo','<span>'+CB.map(c=>c.n+' ×'+c.mult).join(' → ')+'</span>',CB.length<3?'<span class="muted">A third blow: Third Blow in your weapon\'s skill tree (at 15)</span>':heroFin()?'<span class="gold">'+(heroFin()==='stun'?'Stunning':'Crushing')+' finisher</span>':'<span class="muted">Its finishing style: a finisher in your weapon\'s skill tree (at 60)</span>')+(unarmed()?row('Grapple','Bare hands: now and then you seize the one before you and throw him, perhaps down, every '+Moveset.of({hero:true,s:{},type:'hero'}).hard.cd.toFixed(1)+'s'):'')
  :heroKind()==='ranged'?row('Shoot ('+ITEMS[P.gear.weapon].n.toLowerCase()+')',heroQuiverText()+'Your hero draws and looses at whoever is in range.')
  :row('Cast ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Magic bolts, '+heroShot().mult+'× damage, splash half to enemies beside the target, ignore armor and trees, '+heroShot().mp+' mana each, every '+heroShot().cd+'s');
}
/* the Proficiency tab: your level, its experience and the skill points it left you (characters.js xpNeed; the tree's points, LEVEL.pts
   a level), then each proficiency (from 0, no top) with its bar, its power and what the tree, gear and roles add, a knack, what it does */
const PROF_GROUPS=[['Fighting',['oneh','twoh','block','archery','spell','fist','athl']],['Command',['lead','tact','med','eng','pers']],['The road',['scout','ride','wood','hunt','surv']],['Trade and rule',['trade','stew']]];
function profBody(){
  const S=skSubj(),who=skWho(),C=who?compOf(who):leaderOf(P),lvl=who?S.lv:P.level,need=C.xpNeed(),pc=Math.min(100,Math.round(100*(S.xp||0)/need)),keys=who?Object.keys(COMP_SK):null;
  const pts=talentsOf(S).points(),xp=Math.floor(S.xp||0);
  const head='<div class="row fb-prof-level"><div class="info"><strong>Level '+lvl+(pts.left?', <span class="gold">'+pts.left+' skill point'+(pts.left===1?'':'s')+' to spend</span>':'')+'</strong><small>Experience comes from battles, quests, beasts and lore, and from every level your proficiencies reach. Each level: '+LEVEL.pts+' skill point for the tree (Skill trees).</small><div class="bar" role="progressbar" aria-label="Level progress" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div><small>'+xp+' / '+Math.round(need)+' XP to level '+(lvl+1)+'</small></div></div>';
  const row=k=>{const s=S.sk[k];if(!s)return '';const lv=s.lv,pw=profPow(lv),bonus=who?0:skill(k)-pw,pc2=Math.round(100*s.xp/SK_XP(lv)),apt=!who&&P.apt&&P.apt[k];
    return '<div class="row"><div class="info"><strong>'+SKILLS[k].n+(apt?' <span class="good" style="font-size:12px">knack +'+Math.round(apt*100)+'%</span>':'')+'</strong><small>'+SKILLS[k].d+', power '+pw.toFixed(1)+(bonus>=.05?' <span class="good">+'+bonus.toFixed(1)+'</span> from your tree, gear and roles':'')+'</small><div class="bar" role="progressbar" aria-label="'+SKILLS[k].n+' progress" aria-valuenow="'+pc2+'"><i style="width:'+pc2+'%"></i></div></div><span class="own">'+lv+'</span></div>'};
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
 const out='<div class="fb-skill-work fb-trees"><section class="fb-tree-pane" aria-label="'+SKILLS[k].n+' skill tree"><div class="fb-tree-head"><strong>'+SKILLS[k].n+', '+T.profLv(k)+'</strong><small>'+
   '<b class="'+(pts.left?'gold':'')+'">'+pts.left+' skill point'+(pts.left===1?'':'s')+' to spend</b>, one each level, on any tree, its nodes '+Math.round(100*treeScale(T.profLv(k)))+'% strong at '+SKILLS[k].n+' '+T.profLv(k)+'</small></div>'+
   '<div class="tr-stage">'+treeSvg(S,k)+'<div class="tw-tools">'+tsBtn('tree-whole',null,G.skWhole?'◉':'◎',G.skWhole?'Back to '+SKILLS[k].n:'The whole tree','fb-ts-whole'+(G.skWhole?' on':''))+tsBtn('tree-zoom','in','+','Zoom in','tw-zoom')+tsBtn('tree-zoom','out','−','Zoom out','tw-zoom')+'</div>'+treeNodePane(S,k)+list+'</div>'+sw+'</section></div>';
 G.skGrow=false;G.skJust=null;return out;
}
function renderSkills(){
 const S=skSubj(),who=skWho(),tab=G.skTab,n=treePendingOf(S).length,pts=n?n+' skill point'+(n>1?'s':'')+' to spend':'no skill point to spend';
 const tabs=fbTabs([['prof',fbIcon('book')+' Proficiency'],['talents',fbIcon('skills')+' Skill trees'],['traits',fbIcon('shield')+' Trait'],['abilities',fbIcon('sword')+' Skill bar']],tab,'sk-tab','Skills sections');// (the owner's order, 2026-11-08)
 const body=tab==='talents'?skTreeBody():'<div class="fb-scroll" data-fb-scroll="skills:'+tab+'">'+(tab==='abilities'?skillBarBody():tab==='traits'?traitBody():profBody())+'</div>';
 fbShow(who?COMPS[who].short+'’s skills':'Skills','Level '+(who?S.lv:P.level)+', '+pts,tabs,body,['sk-close',null,'Back to '+(who?COMPS[who].short:'Army')],['sk-map',null,'Back to map'],'fb-skills','Army, '+htmlText(bandName()));
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
  else if(a==='tree-sel'&&TREE[arg]){G.skSel=arg;if(TREE[arg].prof&&TREE[arg].prof!==G.skTree){G.skTree=TREE[arg].prof;G.skWhole=false}}// (another slice's node: the wheel turns to it)
  else if(a==='tree-whole')G.skWhole=!G.skWhole;
  else if(a==='tree-zoom'){const svg=panel.querySelector('svg.tw');if(svg)twZoom(svg,arg==='in'?1/TREE_PAN.step:TREE_PAN.step)}
  else if(a==='tree-focus'&&PROF_TREE[arg]){if(G.skTree!==arg)G.skSel=null;G.skTree=arg;G.skWhole=false}// (a slice's name: the wheel turns to it, close)
  else if(a==='sk-slot'){skillSlotPick(Number(arg));return true}
  else if(a==='tree-take'){if(takeNodeOf(skSubj(),arg)){G.skSel=arg;G.skJust=arg}}
  else if(a==='tree-refund')refundNodeOf(skSubj(),arg);
  else if(a==='slot-set'){const [i,id]=String(arg).split(':');talentsOf(skSubj()).assignSlot(+i,id)}
  updateHUD(true);renderSkills();return true;
}
addEventListener('resize',()=>{if(G.mode==='skills'&&!FIELDBOOK.pick)renderSkills()});
/* the wheel under your hands (the owner, 2026-11-08, step 3): a drag pans it, two fingers, the mouse wheel or a trackpad's pinch zoom
   about the point under them, + and − a step about the middle; the view kept (G.skVB) while the same slice (or the whole wheel) is
   shown, another one its own view again (treeView). A tap still chooses a node or a slice's name; a drag is never a tap (its click
   eaten). TREE_PAN: the least of it in view (units across; the most the whole wheel), what counts as a drag (px), a button's step */
const TREE_PAN={min:200,drag:6,step:1.4};
const TW={pts:new Map(),drag:null,pinch:null,ate:false};
// (the view set, its middle at cx, cy and w units across (its height in step), kept inside the wheel)
function twSet(svg,cx,cy,w,vb){const {rim}=treePos(),M=rim+110,W=clamp(w,TREE_PAN.min,2*M),H=vb[3]*W/vb[2],x=clamp(cx,-M,M)-W/2,y=clamp(cy,-M,M)-H/2;
  G.skVB=[x,y,W,H];G.skVBk=svg&&svg.dataset.key;if(svg)svg.setAttribute('viewBox',G.skVB.map(v=>v.toFixed(1)).join(' '))}
// (a screen point in the wheel's units; the view now)
const twAt=(svg,cx,cy)=>{const m=svg.getScreenCTM();return m?new DOMPoint(cx,cy).matrixTransform(m.inverse()):{x:0,y:0}};
const twVB=svg=>svg.getAttribute('viewBox').split(/\s+/).map(Number);
// (zoom by k about wheel point p: what is under it stays)
function twZoom(svg,k,p){const vb=twVB(svg),cx=vb[0]+vb[2]/2,cy=vb[1]+vb[3]/2;p=p||{x:cx,y:cy};twSet(svg,p.x+(cx-p.x)*k,p.y+(cy-p.y)*k,vb[2]*k,vb)}
panel.addEventListener('pointerdown',e=>{const svg=e.target.closest&&e.target.closest('svg.tw');if(!svg||G.mode!=='skills'||e.button>0)return;TW.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});TW.svg=svg;
  const vb=twVB(svg);if(TW.pts.size===1)TW.drag={x:e.clientX,y:e.clientY,vb,moved:false};
  else if(TW.pts.size===2){const [a,b]=[...TW.pts.values()],m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};TW.pinch={d:Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),vb,p:twAt(svg,m.x,m.y)};if(TW.drag)TW.drag.moved=true}});
addEventListener('pointermove',e=>{if(!TW.pts.has(e.pointerId))return;TW.pts.set(e.pointerId,{x:e.clientX,y:e.clientY});const svg=TW.svg;if(!svg||!svg.isConnected){TW.pts.clear();TW.drag=TW.pinch=null;return}
  if(TW.pinch&&TW.pts.size>=2){const [a,b]=[...TW.pts.values()],P0=TW.pinch,k=P0.d/Math.max(1,Math.hypot(a.x-b.x,a.y-b.y)),vb=P0.vb,cx=vb[0]+vb[2]/2,cy=vb[1]+vb[3]/2;
    twSet(svg,P0.p.x+(cx-P0.p.x)*k,P0.p.y+(cy-P0.p.y)*k,vb[2]*k,vb);return}
  const d=TW.drag;if(!d)return;const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)<TREE_PAN.drag)return;d.moved=true;
  const m=svg.getScreenCTM(),sc=m?Math.hypot(m.a,m.b):1;twSet(svg,d.vb[0]+d.vb[2]/2-dx/sc,d.vb[1]+d.vb[3]/2-dy/sc,d.vb[2],d.vb)});
const twEnd=e=>{if(!TW.pts.delete(e.pointerId))return;if(TW.pinch){if(TW.pts.size<2)TW.pinch=null;if(TW.drag)TW.ate=true;TW.drag=null;return}if(TW.drag&&TW.drag.moved)TW.ate=true;TW.drag=null};
addEventListener('pointerup',twEnd);addEventListener('pointercancel',twEnd);
// (the click a drag ends with goes nowhere)
panel.addEventListener('click',e=>{if(!TW.ate)return;TW.ate=false;if(e.target.closest&&e.target.closest('svg.tw')){e.stopPropagation();e.preventDefault()}},true);
panel.addEventListener('wheel',e=>{const svg=e.target.closest&&e.target.closest('svg.tw');if(!svg||G.mode!=='skills')return;e.preventDefault();twZoom(svg,Math.pow(2,e.deltaY*(e.ctrlKey?.01:.0025)),twAt(svg,e.clientX,e.clientY))},{passive:false});
// (a node of the tree: Enter or Space chooses it, as a click)
// (← and →: the proficiency before or after, on the Skill trees tab)
panel.addEventListener('keydown',e=>{if(G.mode!=='skills'||G.skTab!=='talents'||!['ArrowLeft','ArrowRight'].includes(e.key)||e.target.closest?.('input,select,textarea'))return;e.preventDefault();act('tree-step',e.key==='ArrowLeft'?'-1':'1')});
panel.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.tp-node');if(!g||G.mode!=='skills'||!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();act('tree-sel',g.dataset.arg)});
onAct('sk-',skillsAct);onAct('tree-',skillsAct);onAct('slot-',skillsAct);onAct('lv-',skillsAct);
