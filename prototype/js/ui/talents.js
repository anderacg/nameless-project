'use strict';
/* ---------- the Skills page: skill tree, skill bar, disciplines ---------- */
// One word for one thing: the Skill tree holds every passive, notable, keystone and active skill; you learn them with skill points
// (one per level). Active skills go into the ten skill slots (keys 1 to 0) on the Skill bar. Disciplines rise as you use them.
// P.tree: learned node ids (your origin always; P.origin). P.tp: unspent skill points. P.slots: ten slot entries, an active skill id or null.
const knows=id=>!HSKILLS[id].learn||treeHas(HSKILLS[id].learn);
const treeHas=id=>(P.tree||[]).includes(id);
const refundCost=()=>15*P.level;
// a node can be learned once it touches one you have
const treeRoot=()=>P.origin&&treeHas(P.origin)?P.origin:'start';
const canTake=id=>!treeHas(id)&&P.tp>0&&TREE[id].t!=='origin'&&TREE[id].links.some(treeHas);
// unlearning must leave every other node connected to the start
function canRefund(id){
  const root=treeRoot();if(id===root||TREE[id].t==='origin'||!treeHas(id))return false;const keep=new Set(P.tree.filter(x=>x!==id)),seen=new Set([root]),q=[root];
  while(q.length){const c=q.pop();for(const n of TREE[c].links)if(keep.has(n)&&!seen.has(n)){seen.add(n);q.push(n)}}
  return seen.size===keep.size;
}
function applyNode(id,sign){const m=TREE[id].m;if(m.attr)for(const a in m.attr)P.attr[a]=Math.max(1,P.attr[a]+sign*m.attr[a])}
// a newly learned active skill takes the first empty slot
function slotSkill(id){P.slots=P.slots||Array(10).fill(null);if(P.slots.includes(id))return P.slots.indexOf(id);const i=P.slots.indexOf(null);if(i>=0)P.slots[i]=id;return i}
function takeNode(id){
  if(!canTake(id))return false;P.tree.push(id);P.tp--;applyNode(id,1);const u=TREE[id].m.unlock;
  if(u){const i=slotSkill(u);log('Learned the active skill '+HSKILLS[u].n+(i>=0?', on slot '+SLOT_KEYS[i]:'; put it on a free slot in the Skill bar')+'.','gold')}else log('Learned: '+TREE[id].n+'.','gold');
  return true;
}
function refundNode(id){
  if(!canRefund(id)||P.gold<refundCost())return false;P.gold-=refundCost();P.tree=P.tree.filter(x=>x!==id);P.tp++;applyNode(id,-1);vitals();
  const u=TREE[id].m.unlock;if(u)P.slots=P.slots.map(s=>s===u?null:s);log('You unlearn '+TREE[id].n+'.');return true;
}
// an active skill's numbers after its upgrades; Spellcraft lowers the mana it costs
function abil(id){
  const S=HSKILLS[id],c=1-tm(id+'Cost');
  return{...S,mp:Math.round(S.mp*c*(1-.02*skill('spell'))),sp:Math.round(S.sp*c),cd:+(S.cd*(1-tm(id+'Cd'))).toFixed(1),r:1+tm(id+'R'),dmg:1+tm(id+'Dmg'),stun:tm(id+'Stun'),dur:tm(id+'Dur')};
}
const dodgeCost=()=>Math.round(STAM.dodge*(1-tm('dodgeCost'))),dodgeCd=()=>DODGE_CD*(1-tm('dodgeCd'));
// what an active skill does right now, in numbers
function skillStats(id){
  const A=abil(id),sm=HSKILLS[id].magic?spellMul():1,x=v=>(v*A.dmg*sm).toFixed(2)+'×';
  return{whirl:'Hits everything around you for '+x(1.3)+' damage',leap:'Leaps up to 100, stuns '+(1+A.stun).toFixed(1)+'s where you land',quake:'Hits everything within '+Math.round(50*A.r)+' for '+x(.9)+', staggers '+(.6+A.stun).toFixed(1)+'s',
    dash:'Dashes 80, '+x(1.1)+' to everyone you pass',volley:'8 arrows of '+x(.7)+' over a '+Math.round(28*A.r)+' radius; uses 4 arrows',fireball:x(2)+' fire bursting over '+Math.round(32*A.r),
    nova:x(.7)+' to everyone within '+Math.round(60*A.r)+', slowed '+(3+A.dur)+'s',heal:'Heals you '+Math.round(30*A.dmg*sm)+'% and troops within '+Math.round(90*A.r)+' '+Math.round(20*A.dmg*sm)+'%',
    cry:'Troops within '+Math.round(90*A.r)+' fight harder for '+(6+A.dur)+'s; enemies flinch '+(.8+A.stun).toFixed(1)+'s',banner:'Troops within '+Math.round(100*A.r)+' take 25% less damage for '+(8+A.dur)+'s'}[id]+' · '+costText(A)+' · cooldown '+A.cd+'s';
}
/* the page */
function openSkills(tab){if(G.mode!=='world'||G.modal)return;G.mode='skills';G.skTab=tab||G.skTab||'talents';G.skSel=G.skSel&&TREE[G.skSel]?G.skSel:treeRoot();renderSkills()}
const NODE_R={start:13,origin:15,s:9,n:13,k:16,a:12};
const NODE_KIND=N=>({start:'Crossroads',origin:'Origin',s:'Passive',n:'Notable',k:'Keystone'}[N.t]||(N.m.unlock?'Active skill':'Skill upgrade'));
// the whole tree, widened to the shape of the view box so zooming and panning map straight to the screen
const TREE_ASPECT=2.4;
function treeBounds(){
  const ids=Object.keys(TREE),xs=ids.map(i=>TREE[i].x),ys=ids.map(i=>TREE[i].y),pad=40;let x=Math.min(...xs)-pad,y=Math.min(...ys)-pad,w=Math.max(...xs)+pad-x,h=Math.max(...ys)+pad-y;
  if(w/h<TREE_ASPECT){const nw=h*TREE_ASPECT;x-=(nw-w)/2;w=nw}else{const nh=w/TREE_ASPECT;y-=(nh-h)/2;h=nh}return{x,y,w,h};
}
const treeView=()=>G.tv||treeBounds();
const vbText=v=>Math.round(v.x)+' '+Math.round(v.y)+' '+Math.round(v.w)+' '+Math.round(v.h);
function treeSvg(){
  const ids=Object.keys(TREE),done=new Set();let lines='',nodes='';
  for(const id of ids)for(const n of TREE[id].links){const k=id<n?id+'|'+n:n+'|'+id;if(done.has(k))continue;done.add(k);const a=TREE[id],b=TREE[n],on=treeHas(id)&&treeHas(n),next=treeHas(id)&&!treeHas(n)||treeHas(n)&&!treeHas(id);
    lines+='<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke="'+(on?'#e8b94a':next?'#8a7a52':'#3a3f52')+'" stroke-width="'+(on?4:2.5)+'"/>'}
  for(const id of ids){const N=TREE[id],col=N.br&&N.br!=='hybrid'?TREE_BRANCHES.find(b=>b.k===N.br).col:'#c8c2ae',have=treeHas(id),open=canTake(id),sel=G.skSel===id,r=NODE_R[N.t];
    const shape=N.t==='origin'?'<circle cx="'+N.x+'" cy="'+N.y+'" r="'+(r-5)+'" fill="none" stroke="'+(have?'#ffe08a':'#4a5068')+'" stroke-width="2"/><circle cx="'+N.x+'" cy="'+N.y+'" r="'+r+'"':N.t==='k'?'<rect x="'+(N.x-r)+'" y="'+(N.y-r)+'" width="'+r*2+'" height="'+r*2+'" transform="rotate(45 '+N.x+' '+N.y+')"':N.t==='a'?'<rect x="'+(N.x-r)+'" y="'+(N.y-r)+'" width="'+r*2+'" height="'+r*2+'" rx="3"':'<circle cx="'+N.x+'" cy="'+N.y+'" r="'+r+'"';
    nodes+='<g class="tnode" data-act="tree-sel" data-arg="'+id+'" role="button" tabindex="-1" aria-label="'+N.n+' ('+NODE_KIND(N)+(have?', learned':open?', available':'')+')">'+shape+' fill="'+(have?col:'#1c2030')+'" stroke="'+(sel?'#fff':open?'#e8b94a':have?col:'#4a5068')+'" stroke-width="'+(sel?3:open?2.5:2)+'"'+(open?' class="pulse"':'')+'/>'+
      (N.t==='a'&&N.m.unlock?'<text x="'+N.x+'" y="'+(N.y+4)+'" text-anchor="middle" class="tglyph">✦</text>':'')+
      (N.t!=='s'?(()=>{const [lx,ly]=N.lab||[0,1],ax=Math.abs(lx)>.3,x=N.x+lx*(r+6),y=N.y+(ax?6:ly>0?r+19:-r-7);
        return '<text x="'+Math.round(x)+'" y="'+Math.round(y)+'" text-anchor="'+(!ax?'middle':lx>0?'start':'end')+'" class="tlab'+(have?' on':'')+'">'+N.n+'</text>'})():'')+'</g>'}
  return '<svg class="tree" viewBox="'+vbText(treeView())+'" preserveAspectRatio="xMidYMid meet">'+lines+nodes+'</svg>';
}
function nodeDetail(){
  const id=G.skSel,N=TREE[id];if(!N)return '';const u=N.m.unlock;
  const btn=N.t==='origin'?(treeHas(id)?'<span class="muted">Your origin</span>':'<span class="muted">Another past\u2019s origin</span>'):treeHas(id)?(id===treeRoot()?'':'<button class="btn sm" type="button" data-act="tree-refund" data-arg="'+id+'"'+(canRefund(id)&&P.gold>=refundCost()?'':' disabled title="'+(canRefund(id)?'Not enough gold':'Other skills depend on it')+'"')+'>Unlearn · '+refundCost()+'g</button>')
    :'<button class="btn sm primary" type="button" data-act="tree-take" data-arg="'+id+'"'+(canTake(id)?'':' disabled title="'+(P.tp<1?'No skill points':'Not connected to your skills yet')+'"')+'>Learn</button>';
  return '<div class="tdetail"><div><strong>'+N.n+'</strong> <span class="muted">· '+NODE_KIND(N)+(N.br&&N.br!=='hybrid'?' · '+TREE_BRANCHES.find(b=>b.k===N.br).n:'')+'</span><p>'+N.d+(u?' <span class="muted">'+skillStats(u)+'.</span>':'')+'</p></div><div class="acts">'+btn+'</div></div>';
}
// the Skill bar: what sits on keys 1 to 0, every active skill and where to learn it, and the moves you always have
function skillBarBody(){
  const known=Object.keys(HSKILLS).filter(knows),slot=i=>{const id=P.slots[i];
    return '<label class="slotpick"><b>'+SLOT_KEYS[i]+'</b><select data-act="slot-set" data-arg="'+i+'" aria-label="Skill slot '+SLOT_KEYS[i]+'"><option value="">— empty —</option>'+known.map(k=>'<option value="'+k+'"'+(k===id?' selected':'')+'>'+HSKILLS[k].n+'</option>').join('')+'</select></label>'};
  const row=(name,key,stats,note)=>'<div class="row"><div class="info"><strong>'+(key?key+' · ':'')+name+'</strong><small>'+stats+'</small>'+(note?'<small>'+note+'</small>':'')+'</div></div>';
  const ups=id=>{const all=Object.values(TREE).filter(N=>N.t==='a'&&!N.m.unlock&&Object.keys(N.m).some(m=>m.startsWith(id)));return all.length?'Upgrades: '+all.map(N=>'<span class="'+(treeHas(N.id)?'good':'muted')+'">'+N.n+'</span>').join(' · '):''};
  return '<div class="lab">Skill slots · press 1 to 0 in battle</div><div class="slotgrid">'+SLOT_KEYS.map((k,i)=>slot(i)).join('')+'</div>'+
    '<div class="lab" style="margin-top:6px">Active skills</div>'+Object.keys(HSKILLS).map(id=>{const S=HSKILLS[id],i=P.slots.indexOf(id),N=TREE[S.learn];
      return row(S.n,i>=0?SLOT_KEYS[i]:'',S.d+'<br><span class="muted">'+skillStats(id)+'</span>',knows(id)?(ups(id)||''):'<span class="muted">Not learned: '+(N?N.n+' on the '+(N.br?TREE_BRANCHES.find(b=>b.k===N.br).n+' path':'skill tree'):'')+'.</span>')}).join('')+
    '<div class="lab" style="margin-top:6px">Always available</div>'+
    (grip()==='shield'?row('Shield Bash','Right-click','Slam your shield into enemies in front of you: stagger '+BASH.stun+'s · '+BASH.mult+'× damage · '+BASH.sp+' SP · cooldown '+BASH.cd+'s'):row('Shove','Right-click','Push enemies in front of you back and stagger them for '+SHOVE.stun+'s · '+SHOVE.mult+'× damage · '+SHOVE.sp+' SP · cooldown '+SHOVE.cd+'s'))+
    row('Dodge roll','F','A quick roll you cannot be hit in · '+dodgeCost()+' SP · cooldown '+dodgeCd().toFixed(1)+'s',ups('dodge'))+
    (heroKind()==='melee'?row('Combo ('+{one:'one-handed',dual:'dual wield',shield:'sword and board',two:'two-handed'}[grip()]+')','Space',heroCombo().map(c=>c.n+' ('+{arc:'sweep',thrust:'thrust',twin:'twin thrust',slam:'slam',spin:'spin'}[c.shape]+') ×'+c.mult).join(' → ')+' · '+STAM.swing.map(v=>Math.round(v*(heroCombo().sp||1))).join(' / ')+' SP'):
     heroKind()==='ranged'?row('Shoot ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Space',(ammoOf()?'Uses '+GOODS[ammoOf()].n.toLowerCase()+' ('+goodN(ammoOf())+' left; buy more at a smith). ':'')+(isBow()?'Hold to draw, let go to shoot: more power flies faster, farther and harder. Holding a full draw drains stamina. The mouse wheel sets your range'+(has('guide')?'; Hawkeye shows the path. ':' (learn Hawkeye for a path guide). '):'Straight, fast bolts. ')+heroShot().sp+' SP each · every '+heroShot().cd+'s')
     :row('Cast ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Space','Magic bolts, '+heroShot().mult+'× damage, splash half to enemies beside the target, ignore armor and trees · '+heroShot().mp+' MP each · every '+heroShot().cd+'s'));
}
function disciplinesBody(){
  return '<p class="muted" style="font-size:13px">Disciplines rise as you use them. The skill tree and gear add to them.</p>'+Object.keys(SKILLS).map(k=>{const s=P.sk[k],b=skill(k)-s.lv,need=(s.lv+1)*20,pc=s.lv>=10?100:Math.round(s.xp/need*100);
    return '<div class="row"><div class="info"><strong>'+SKILLS[k].n+'</strong><small>'+SKILLS[k].d+' · grows faster with '+ATTRS[SKILLS[k].a][0]+'</small><div class="bar" role="progressbar" aria-label="'+SKILLS[k].n+' progress" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div></div><span class="own">'+s.lv+(b?' <span class="good">+'+b+'</span>':'')+'</span></div>'}).join('');
}
function renderSkills(){
  const tab=G.skTab,taken=P.tree.length-1,pts=P.tp+' skill point'+(P.tp===1?'':'s');
  const body=tab==='talents'?'<div class="top"><span class="lab">'+(P.tp?'<span class="gold">'+pts+' to spend</span>':'No skill points. You gain one each level.')+' · '+taken+' learned · unlearning costs '+refundCost()+'g</span><span class="zoom"><button class="btn sm" type="button" data-act="tree-zout" aria-label="Zoom out">−</button><button class="btn sm" type="button" data-act="tree-zin" aria-label="Zoom in">+</button><button class="btn sm" type="button" data-act="tree-fit">Fit</button></span></div>'+treeSvg()+nodeDetail()
    :tab==='abilities'?skillBarBody():disciplinesBody();
  showPanel('<div class="top"><h2>Skills</h2><span class="muted">Level '+P.level+' · '+pts+'</span></div><div class="tabs">'+
    [['talents','Skill tree'],['abilities','Skill bar'],['disciplines','Disciplines']].map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="sk-tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+
    '</div><div>'+body+'</div><div class="btns"><button class="btn primary" type="button" data-act="sk-close">Back to map</button></div>');
}
// zoom around a point of the view (fx, fy are 0..1 across it)
function treeZoom(f,fx,fy){
  const v=treeView(),full=treeBounds(),w=clamp(v.w*f,full.w*.18,full.w),h=w/TREE_ASPECT,cx=v.x+v.w*(fx==null?.5:fx),cy=v.y+v.h*(fy==null?.5:fy);
  G.tv=w>=full.w-1?null:{x:cx-w*(fx==null?.5:fx),y:cy-h*(fy==null?.5:fy),w,h};const sv=panel.querySelector('svg.tree');if(sv)sv.setAttribute('viewBox',vbText(treeView()));
}
function skillsAct(a,arg){
  if(!a.startsWith('sk-')&&!a.startsWith('tree-')&&a!=='slot-set')return false;
  if(a==='sk-close'){G.mode='world';hidePanel();return true}
  if(G.mode!=='skills')return true;
  if(a==='sk-tab')G.skTab=arg;
  else if(a==='tree-sel')G.skSel=arg;
  else if(a==='tree-take'){if(takeNode(arg))G.skSel=arg}
  else if(a==='tree-refund')refundNode(arg);
  else if(a==='tree-zin'){treeZoom(1/1.4);return true}
  else if(a==='tree-zout'){treeZoom(1.4);return true}
  else if(a==='tree-fit')G.tv=null;
  else if(a==='slot-set'){const [i,id]=arg.split(':'),n=+i;if(n>=0&&n<10&&(!id||HSKILLS[id]&&knows(id))){P.slots=P.slots.map(s=>s===id?null:s);P.slots[n]=id||null}}
  updateHUD(true);renderSkills();return true;
}
// a double click on an open node learns it
panel.addEventListener('dblclick',e=>{const g=e.target.closest&&e.target.closest('.tnode');if(g&&G.mode==='skills'&&canTake(g.dataset.arg))act('tree-take',g.dataset.arg)});
// slot pickers
panel.addEventListener('change',e=>{const s=e.target.closest&&e.target.closest('select[data-act="slot-set"]');if(s&&G.mode==='skills')act('slot-set',s.dataset.arg+':'+s.value)});
// the tree: wheel to zoom at the cursor, drag to pan (a drag does not count as a click)
panel.addEventListener('wheel',e=>{const sv=e.target.closest&&e.target.closest('svg.tree');if(!sv||G.mode!=='skills')return;e.preventDefault();const r=sv.getBoundingClientRect();
  treeZoom(e.deltaY<0?1/1.2:1.2,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)},{passive:false});
let treeDrag=null;
panel.addEventListener('pointerdown',e=>{const sv=e.target.closest&&e.target.closest('svg.tree');if(sv&&G.mode==='skills'&&e.button===0)treeDrag={x:e.clientX,y:e.clientY,v:{...treeView()},sv,moved:false}});
window.addEventListener('pointermove',e=>{if(!treeDrag)return;const dx=e.clientX-treeDrag.x,dy=e.clientY-treeDrag.y;if(!treeDrag.moved&&Math.hypot(dx,dy)<4)return;treeDrag.moved=true;
  const r=treeDrag.sv.getBoundingClientRect(),v=treeDrag.v;G.tv={...v,x:v.x-dx*v.w/r.width,y:v.y-dy*v.h/r.height};treeDrag.sv.setAttribute('viewBox',vbText(G.tv))});
window.addEventListener('pointerup',()=>{if(treeDrag&&treeDrag.moved)G.treeDragged=true;treeDrag=null});
panel.addEventListener('click',e=>{if(G.treeDragged){G.treeDragged=false;e.stopPropagation()}},true);
onAct('sk-',skillsAct);onAct('tree-',skillsAct);onAct('slot-',skillsAct);
