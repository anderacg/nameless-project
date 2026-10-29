'use strict';
/* ---------- the Skills page: skill tree, skill bar, disciplines ---------- */
// Graph rules, spending, refunds and slot commands live in core/talents.js; this file presents their results.
// One word for one thing: the Skill tree holds every passive, notable, keystone and active skill; you learn them with skill points
// (one per level). Active skills go into the ten skill slots on the Skill bar: your hero uses them in battle when the moment is
// right (battles are commanded, not played by hand: no keys). Disciplines rise as you use them. The special skills sit apart: the
// basic moves everyone has, and the combo's upgrades, which come with practice in your weapon's discipline (SPECIAL).
// P.tree: learned node ids (your origin always; P.origin). P.tp: unspent skill points. P.slots: ten slot entries, an active skill id or null.
// Every character has a tree of its own (o: its record, with tree, tp, slots and attr; yours is P): the ...Of functions work on any
// record, the plain ones on yours. A companion, a lord or a chieftain starts from the crossroads ('start'); you from your origin.
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
  G.mode='skills';G.skTab=tab||G.skTab||'talents';if(G.skWho&&['disciplines','basics'].includes(G.skTab))G.skTab='talents';const v=skPage();G.skSel=v.sel&&TREE[v.sel]?v.sel:treeRootOf(skSubj());G.tv=v.view||skFocusView(G.skSel);renderSkills()}// (each character keeps its own runtime selection and camera)
const NODE_R={start:13,origin:15,s:9,n:13,k:16,a:12};
const NODE_KIND=N=>({start:'Crossroads',origin:'Origin',s:'Passive',n:'Notable',k:'Keystone'}[N.t]||(N.m.unlock?'Active skill':'Skill upgrade'));
// the whole tree, widened to the shape of the view box so zooming and panning map straight to the screen
const skPage=()=>{const k=skWho()||'hero';G.skPages=G.skPages||{};return G.skPages[k]||(G.skPages[k]={sel:null,view:null,mode:'path'})};
const skAspect=()=>G.skAspect||1.6;
function skFocusView(id){const n=TREE[id]||TREE[treeRootOf(skSubj())],w=360,h=w/skAspect();return{x:n.x-w/2,y:n.y-h/2,w,h}}
const skBranchIcon=k=>({might:'sword',finesse:'speed',arcana:'skills',command:'banner'}[k]||'hero');
function treeBounds(){
  const ids=Object.keys(TREE),xs=ids.map(i=>TREE[i].x),ys=ids.map(i=>TREE[i].y),pad=40;let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)+pad-x,h=Math.max(...ys)+pad-y;
  if(w/h<skAspect()){const nw=h*skAspect();x-=(nw-w)/2;w=nw}else{const nh=w/skAspect();y-=(nh-h)/2;h=nh}return{x,y,w,h};
}
const treeView=()=>G.tv||treeBounds();
const vbText=v=>Math.round(v.x)+' '+Math.round(v.y)+' '+Math.round(v.w)+' '+Math.round(v.h);
function treeSvg(){
  const S=skSubj(),treeHas=id=>treeHasOf(S,id),canTake=id=>canTakeOf(S,id);
  const ids=Object.keys(TREE),done=new Set();let lines='',nodes='';
  for(const id of ids)for(const n of TREE[id].links){const k=id<n?id+'|'+n:n+'|'+id;if(done.has(k))continue;done.add(k);const a=TREE[id],b=TREE[n],on=treeHas(id)&&treeHas(n),next=treeHas(id)&&!treeHas(n)||treeHas(n)&&!treeHas(id);
    lines+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+(on?'#e8b94a':next?'#8a7a52':'#3a3f52')+'" stroke-width="'+(on?4:2.5)+'"/>'}
  for(const id of ids){const N=TREE[id],col=N.br&&N.br!=='hybrid'?TREE_BRANCHES.find(b=>b.k===N.br).col:'#c8c2ae',have=treeHas(id),open=canTake(id),sel=G.skSel===id,r=NODE_R[N.t];
    const shape=N.t==='origin'?'<circle cx="'+N.x+'" cy="'+N.y+'" r="'+(r-5)+'" fill="none" stroke="'+(have?'#ffe08a':'#4a5068')+'" stroke-width="2"/><circle cx="'+N.x+'" cy="'+N.y+'" r="'+r+'"':N.t==='k'?'<rect x="'+(N.x-r)+'" y="'+(N.y-r)+'" width="'+r*2+'" height="'+r*2+'" transform="rotate(45 '+N.x+' '+N.y+')"':N.t==='a'?'<rect x="'+(N.x-r)+'" y="'+(N.y-r)+'" width="'+r*2+'" height="'+r*2+'" rx="3"':'<circle cx="'+N.x+'" cy="'+N.y+'" r="'+r+'"';
    nodes+='<g class="tnode" data-act="tree-sel" data-arg="'+id+'" role="button" tabindex="'+(G.skSel===id?0:-1)+'" aria-pressed="'+sel+'" aria-label="'+N.n+' ('+NODE_KIND(N)+(have?', learned':open?', available':'')+')">'+'<circle cx="'+N.x+'" cy="'+N.y+'" class="fb-node-hit" r="23" fill="transparent"/>'+shape+' fill="'+(have?col:'#1c2030')+'" stroke="'+(sel?'#fff':open?'#e8b94a':have?col:'#4a5068')+'" stroke-width="'+(sel?3:open?2.5:2)+'"'+(open?' class="pulse"':'')+'/>'+
      (N.t==='a'&&N.m.unlock?'<text x="'+N.x+'" y="'+(N.y+4)+'" text-anchor="middle" class="tglyph">✦</text>':'')+
      (N.t!=='s'?(()=>{const [lx,ly]=N.lab||[0,1],ax=Math.abs(lx)>.3,x=N.x+lx*(r+6),y=N.y+(ax?6:ly>0?r+19:-r-7);
        return '<text x="'+Math.round(x)+'" y="'+Math.round(y)+'" text-anchor="'+(!ax?'middle':lx>0?'start':'end')+'" class="tlab'+(have?' on':'')+'">'+N.n+'</text>'})():'')+'</g>'}
  return '<svg class="tree" viewBox="'+vbText(treeView())+'" preserveAspectRatio="xMidYMid meet">'+lines+nodes+'</svg>';
}
function nodeDetail(){
 const S=skSubj(),id=G.skSel,N=TREE[id];if(!N)return '';const have=treeHasOf(S,id),can=canTakeOf(S,id),root=id===treeRootOf(S),refund=talentsOf(S).quoteRefund(id),u=N.m.unlock;
 const why=N.t==='origin'?(have?'Your origin is permanent.':'Only your own origin can be learned.'):have?(root?'Your starting point.':refund.ok?'Unlearn returns one skill point.':refund.code==='gold'?'Not enough gold to unlearn.':'Other learned skills depend on this connection.'):S.tp<1?'No skill points. Gain one each level.':!can?'Learn a connected skill first.':'Costs 1 skill point.';
 const button=N.t==='origin'||root?'':have?fbBtn('tree-refund',id,'Unlearn · '+refundCost()+'g',refund.ok?'':why):fbBtn('tree-take',id,fbIcon('skills')+' Learn · 1 point',can?'':why,'primary');
 return '<aside class="fb-node-pane" aria-label="Selected skill"><div class="fb-node-copy" data-fb-scroll="node:'+id+'">'+fbIcon(skBranchIcon(N.br),30)+'<small>'+NODE_KIND(N)+(N.br&&N.br!=='hybrid'?' · '+TREE_BRANCHES.find(b=>b.k===N.br).n:'')+'</small><h3>'+N.n+'</h3><p>'+N.d+'</p><p class="'+(have?'good':'')+'">'+(have?'Learned · ':'')+why+'</p>'+(u&&S===P?fbDetails('Skill effects','<p>'+skillStats(u)+'.</p>'):'')+'</div><div class="fb-node-actions">'+button+'<p>'+S.tp+' points available · '+P.gold+' gold</p></div></aside>';
}
/* the special skills: not on the tree's paths (no point buys them). The basic moves everyone has from the start; the combo grows with
   practice in the discipline of the weapon you fight with: a third blow, then the choice of its finishing style (one or the other) */
const SPECIAL=[
  {id:'combo',n:'Combo',d:()=>'Two blows in a row with a melee weapon; a third comes with practice.',have:()=>true},
  {id:'combo3',n:'Third Blow',d:()=>'Your combo ends in a finisher: a third, heavier blow.',req:()=>SKILLS[meleeSk()].n+' '+COMBO_UP.third,have:()=>comboBlows()>=3},
  {id:'fin_stun',n:'Stunning Finisher',d:()=>'The finisher stuns '+Math.round((FIN_STYLE.stun.stun-1)*100)+'% longer and barely pushes.',req:()=>SKILLS[meleeSk()].n+' '+COMBO_UP.fin+', then choose one',fin:'stun',have:()=>P.fin==='stun'},
  {id:'fin_push',n:'Crushing Finisher',d:()=>'The finisher knocks foes far away, but does not stun.',req:()=>SKILLS[meleeSk()].n+' '+COMBO_UP.fin+', then choose one',fin:'push',have:()=>P.fin==='push'},
  {id:'dodge',n:'Dodge Roll',d:()=>'A quick roll you cannot be hit in, away from trouble · '+dodgeCost()+' stamina · every '+dodgeCd().toFixed(1)+'s',have:()=>true},
  {id:'shove',n:'Shove',d:()=>'With a bow: push back an enemy who reaches you and stagger them '+SHOVE.stun+'s · '+SHOVE.sp+' stamina',have:()=>true},
  {id:'bash',n:'Shield Bash',d:()=>'With a shield: slam an enemy in front of you, stagger '+BASH.stun+'s, '+BASH.mult+'× damage · '+BASH.sp+' stamina',have:()=>true}
];
function specialBody(){
  return '<div class="lab" style="margin-top:6px">Special skills · apart from the paths: the basic moves everyone has, and the combo, which grows as you practise your weapon</div><div class="specials">'+
    SPECIAL.map(S=>{const have=S.have(),can=talentsOf(P).canChooseFinisher(S.fin);
      return '<div class="spnode'+(have?' on':can?' open':'')+'"><strong>'+S.n+'</strong><small>'+S.d()+'</small>'+(have?'<small class="good">Learned</small>':can?'<button class="btn sm primary" type="button" data-act="sk-fin" data-arg="'+S.fin+'">Choose</button>':'<small class="muted">'+(S.req?S.req():'')+'</small>')+'</div>'}).join('')+'</div>';
}
// the Skill bar: the ten slots your hero uses in battle, the active skills you have learned, and the basic moves you can use now
function skillSlotPick(i){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 fbChoose({title:'Skill slot '+(i+1),value:S.slots[i]||'',items:[{id:'',name:'Empty slot',sub:'No skill assigned',ico:'skills'},...known.map(k=>({id:k,name:HSKILLS[k].n,sub:HSKILLS[k].d,ico:'skills',note:S.slots.includes(k)&&S.slots[i]!==k?'Moves this skill from slot '+(S.slots.indexOf(k)+1)+'.':''}))],back:renderSkills,apply:k=>{talentsOf(S).assignSlot(i,k);renderSkills()},focus:'[data-act="sk-slot"][data-arg="'+i+'"]'});
}
function skillBarBody(){
 const S=skSubj(),known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k));
 return '<div class="lab">Skill slots · used automatically in battle</div><div class="fb-slot-grid">'+SLOT_KEYS.map((k,i)=>{const id=S.slots[i];return fbBtn('sk-slot',i,'<small>'+(i+1)+'</small>'+fbIcon('skills',28)+'<strong>'+(id?HSKILLS[id].n:'Empty')+'</strong>','','fb-slot')}).join('')+'</div><div class="lab">Active skills</div>'+(known.length?known.map(id=>'<div class="row"><div class="info"><strong>'+HSKILLS[id].n+'</strong><small>'+HSKILLS[id].d+'</small>'+(S===P?'<small>'+skillStats(id)+'</small>':'')+'<small class="'+(S.slots.includes(id)?'gold':'muted')+'">'+(S.slots.includes(id)?'In slot '+(S.slots.indexOf(id)+1):'Not assigned · will not be used in battle')+'</small></div></div>').join(''):'<p>No active skills yet. Learn them on the Skill tree.</p>')+(S===P?fbDetails('Basic moves',heroAttackRow()+specialBody()):'');
}
// your hero's own attack with the weapon in hand: the combo, the shot or the cast, with its numbers
function heroAttackRow(){
 const row=(name,stats,note)=>'<div class="row"><div class="info"><strong>'+name+'</strong><small>'+stats+'</small>'+(note?'<small>'+note+'</small>':'')+'</div></div>',CB=heroCombo();
 return heroKind()==='melee'?row('Combo','<span>'+CB.map(c=>c.n+' ×'+c.mult).join(' → ')+'</span>',CB.length<3?'<span class="muted">A third blow at '+SKILLS[meleeSk()].n+' '+COMBO_UP.third+'</span>':P.fin?'<span class="gold">'+(P.fin==='stun'?'Stunning':'Crushing')+' finisher</span>':finReady()?'<span class="gold">Choose its finishing style below</span>':'<span class="muted">Choose its finishing style at '+SKILLS[meleeSk()].n+' '+COMBO_UP.fin+'</span>')+(unarmed()?row('Grapple','Bare hands: now and then you seize the one before you and throw him, perhaps down · every '+Moveset.of({hero:true,s:{},type:'hero'}).hard.cd.toFixed(1)+'s'):'')
  :heroKind()==='ranged'?row('Shoot ('+ITEMS[P.gear.weapon].n.toLowerCase()+')',heroQuiverText()+'Your hero draws and looses at whoever is in range.')
  :row('Cast ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Magic bolts, '+heroShot().mult+'× damage, splash half to enemies beside the target, ignore armor and trees · '+heroShot().mp+' mana each · every '+heroShot().cd+'s');
}
function disciplinesBody(){
  return '<p class="muted" style="font-size:13px">Disciplines rise as you use them. The skill tree and gear add to them.</p>'+Object.keys(SKILLS).map(k=>{const s=P.sk[k],b=skill(k)-s.lv,need=(s.lv+1)*20,pc=s.lv>=10?100:Math.round(s.xp/need*100);
    return '<div class="row"><div class="info"><strong>'+SKILLS[k].n+(P.apt&&P.apt[k]?' <span class="good" style="font-size:12px">knack +'+Math.round(P.apt[k]*100)+'%</span>':'')+'</strong><small>'+SKILLS[k].d+' · grows faster with '+ATTRS[SKILLS[k].a][0]+'</small><div class="bar" role="progressbar" aria-label="'+SKILLS[k].n+' progress" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div></div><span class="own">'+s.lv+(b?' <span class="good">+'+b+'</span>':'')+'</span></div>'}).join('');
}
function skTreeBody(){
 const mode=skPage().mode,tools='<div class="fb-tree-tools"><div>'+fbBtn('tree-focus',null,'My path')+fbBtn('tree-overview',null,'Paths')+fbBtn('tree-list',null,'List')+'</div><div>'+fbBtn('tree-zout',null,'<span aria-hidden="true">−</span><span class="fb-sr">Zoom out</span>')+fbBtn('tree-zin',null,'<span aria-hidden="true">+</span><span class="fb-sr">Zoom in</span>')+fbBtn('tree-fit',null,'Fit')+'</div></div>';
 const body=mode==='overview'?'<div class="fb-tree-overview">'+TREE_BRANCHES.map(b=>fbBtn('tree-branch',b.k,fbIcon(skBranchIcon(b.k),30)+'<strong>'+b.n+'</strong><small>'+Object.values(TREE).filter(n=>n.br===b.k&&treeHasOf(skSubj(),n.id)).length+' learned</small>')).join('')+'</div>':mode==='list'?'<div class="fb-tree-list" data-fb-scroll="skill-list:'+htmlText(skWho()||'hero')+'">'+Object.values(TREE).map(n=>fbBtn('tree-list-sel',n.id,'<strong>'+n.n+'</strong><small>'+NODE_KIND(n)+' · '+(treeHasOf(skSubj(),n.id)?'Learned':canTakeOf(skSubj(),n.id)?'Available':n.t==='origin'?'Origin':'Locked')+'</small>')).join('')+'</div>':treeSvg();
 return '<div class="fb-skill-work"><section class="fb-tree-pane" aria-label="Skill paths">'+tools+body+'</section>'+nodeDetail()+'</div>';
}
function skDrawView(){const sv=panel.querySelector('svg.tree');if(!sv)return;sv.setAttribute('viewBox',vbText(treeView()));const r=Math.max(23,22*treeView().w/Math.max(1,sv.getBoundingClientRect().width));sv.querySelectorAll('.fb-node-hit').forEach(e=>e.setAttribute('r',r))}
function renderSkills(){
 const S=skSubj(),who=skWho(),tab=G.skTab,pts=S.tp+' skill point'+(S.tp===1?'':'s');
 const tabs=fbTabs([['talents',fbIcon('skills')+' Tree'],['abilities',fbIcon('sword')+' Skill bar'],...(who?[]:[['disciplines',fbIcon('book')+' Disciplines'],['basics',fbIcon('shield')+' Basics']])],tab,'sk-tab','Skills sections');
 const body=tab==='talents'?skTreeBody():'<div class="fb-scroll" data-fb-scroll="skills:'+tab+'">'+(tab==='abilities'?skillBarBody():tab==='basics'?specialBody():disciplinesBody())+'</div>';
 fbShow(who?COMPS[who].short+'’s skills':'Skills','Level '+(who?S.lv:P.level)+' · '+pts,tabs,body,['sk-close',null,'Back to '+(who?COMPS[who].short:'Army')],['sk-map',null,'Back to map'],'fb-skills','Army · '+htmlText(bandName()));
 const sv=panel.querySelector('svg.tree');if(sv){const b=sv.getBoundingClientRect(),a=Math.max(.3,b.width/Math.max(1,b.height));if(Math.abs(a-skAspect())>.02){const v=treeView(),cy=v.y+v.h/2;G.skAspect=a;G.tv={...v,y:cy-v.w/a/2,h:v.w/a};sv.setAttribute('viewBox',vbText(G.tv))}}
 skDrawView();skPage().sel=G.skSel;skPage().view=G.tv?{...G.tv}:null;
}
// zoom around a point of the view (fx, fy are 0..1 across it)
function treeZoom(f,fx,fy){
  const v=treeView(),full=treeBounds(),w=clamp(v.w*f,Math.min(160,full.w*.18),full.w),h=w/skAspect(),cx=v.x+v.w*(fx==null?.5:fx),cy=v.y+v.h*(fy==null?.5:fy);
  G.tv=w>=full.w-1?null:{x:cx-w*(fx==null?.5:fx),y:cy-h*(fy==null?.5:fy),w,h};skDrawView();skPage().view=G.tv?{...G.tv}:null;
}
function skillsAct(a,arg){
  if(!a.startsWith('sk-')&&!a.startsWith('tree-')&&a!=='slot-set')return false;
  if(a==='sk-map'){G.skWho=null;G.mode='world';hidePanel();return true}
  if(a==='sk-close'){const who=skWho(),s=partyView();G.skWho=null;G.mode='char';G.char='roster';G.armyEdit=null;s.sel=who?'comp_'+who:'hero';s.open=true;s.path=false;if(who)compPick(who);renderChar();return true}// (back to its card)
  if(G.mode!=='skills')return true;
  if(a==='sk-tab'){if(['talents','abilities',...(skWho()?[]:['disciplines','basics'])].includes(arg))G.skTab=arg}
  else if(a==='tree-sel'&&TREE[arg])G.skSel=arg;
  else if(a==='tree-list-sel'&&TREE[arg]){G.skSel=arg;skPage().mode='path';G.tv=skFocusView(arg)}
  else if(a==='tree-focus'){skPage().mode='path';G.tv=skFocusView(G.skSel||treeRootOf(skSubj()))}
  else if(a==='tree-overview')skPage().mode='overview';
  else if(a==='tree-list')skPage().mode='list';
  else if(a==='tree-branch'&&TREE[arg+'0']){G.skSel=arg+'0';G.tv=skFocusView(G.skSel);skPage().mode='path'}
  else if(a==='sk-slot'){skillSlotPick(Number(arg));return true}
  else if(a==='tree-take'){if(takeNodeOf(skSubj(),arg))G.skSel=arg}
  else if(a==='tree-refund')refundNodeOf(skSubj(),arg);
  else if(a==='tree-zin'){treeZoom(1/1.4);return true}
  else if(a==='tree-zout'){treeZoom(1.4);return true}
  else if(a==='tree-fit'){skPage().mode='path';G.tv=null}
  // the combo's finishing style: chosen once, when your weapon's discipline is high enough
  else if(a==='sk-fin'){if(talentsOf(P).chooseFinisher(arg).ok)log('Your combo now ends in a '+(arg==='stun'?'stunning':'crushing')+' finisher.','gold')}
  else if(a==='slot-set'){const [i,id]=String(arg).split(':');talentsOf(skSubj()).assignSlot(+i,id)}
  updateHUD(true);renderSkills();return true;
}
// Keyboard access to graph nodes: Enter selects; arrows move through their links.
panel.addEventListener('keydown',e=>{const g=e.target.closest&&e.target.closest('.tnode');if(!g||G.mode!=='skills')return;e.stopPropagation();const id=g.dataset.arg,n=TREE[id];if(['Enter',' '].includes(e.key)){e.preventDefault();act('tree-sel',id)}else if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const axis=e.key==='ArrowLeft'||e.key==='ArrowRight'?'x':'y',sign=e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:1,links=n.links.filter(k=>(TREE[k][axis]-n[axis])*sign>0),to=links.sort((a,b)=>Math.hypot(TREE[a].x-n.x,TREE[a].y-n.y)-Math.hypot(TREE[b].x-n.x,TREE[b].y-n.y))[0];if(to){act('tree-list-sel',to);panel.querySelector('.tnode[data-arg="'+to+'"]')?.focus({preventScroll:true})}}});
// the tree: wheel to zoom at the cursor, drag to pan (a drag does not count as a click)
panel.addEventListener('wheel',e=>{const sv=e.target.closest&&e.target.closest('svg.tree');if(!sv||G.mode!=='skills')return;e.preventDefault();const r=sv.getBoundingClientRect();
  treeZoom(e.deltaY<0?1/1.2:1.2,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)},{passive:false});
let treeDrag=null;
const treePointers=new Map();
panel.addEventListener('pointerdown',e=>{const sv=e.target.closest&&e.target.closest('svg.tree');if(!sv||G.mode!=='skills'||e.button!==0)return;treePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...treePointers.values()];treeDrag={x:e.clientX,y:e.clientY,v:{...treeView()},sv,moved:ps.length>1,pinch:ps.length>1?Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y):0}});
window.addEventListener('pointermove',e=>{if(!treeDrag||!treePointers.has(e.pointerId))return;treePointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const ps=[...treePointers.values()],d=treeDrag,r=d.sv.getBoundingClientRect();if(ps.length>1){const distance=Math.hypot(ps[0].x-ps[1].x,ps[0].y-ps[1].y);if(d.pinch&&distance){G.tv={...d.v};treeZoom(d.pinch/distance)}d.moved=true;return}const dx=e.clientX-d.x,dy=e.clientY-d.y;if(!d.moved&&Math.hypot(dx,dy)<5)return;d.moved=true;G.tv={...d.v,x:d.v.x-dx*d.v.w/r.width,y:d.v.y-dy*d.v.h/r.height};d.sv.setAttribute('viewBox',vbText(G.tv))});
function treePointerEnd(e){if(!treePointers.has(e.pointerId))return;treePointers.delete(e.pointerId);if(treeDrag?.moved||e.type==='pointercancel')G.treeDragged=true;treeDrag=null;treePointers.clear();if(G.mode==='skills')skPage().view=G.tv?{...G.tv}:null}
window.addEventListener('pointerup',treePointerEnd);window.addEventListener('pointercancel',treePointerEnd);
panel.addEventListener('click',e=>{if(G.treeDragged){G.treeDragged=false;if(e.target.closest('svg.tree')){e.preventDefault();e.stopPropagation()}}},true);
addEventListener('resize',()=>{if(G.mode==='skills'&&!FIELDBOOK.pick)renderSkills()});
onAct('sk-',skillsAct);onAct('tree-',skillsAct);onAct('slot-',skillsAct);
