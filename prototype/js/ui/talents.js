'use strict';
/* ---------- the Skills page: skill tree, skill bar, disciplines ---------- */
// One word for one thing: the Skill tree holds every passive, notable, keystone and active skill; you learn them with skill points
// (one per level). Active skills go into the ten skill slots on the Skill bar: your hero uses them in battle when the moment is
// right (battles are commanded, not played by hand: no keys). Disciplines rise as you use them. The special skills sit apart: the
// basic moves everyone has, and the combo's upgrades, which come with practice in your weapon's discipline (SPECIAL).
// P.tree: learned node ids (your origin always; P.origin). P.tp: unspent skill points. P.slots: ten slot entries, an active skill id or null.
// Every character has a tree of its own (o: its record, with tree, tp, slots and attr; yours is P): the ...Of functions work on any
// record, the plain ones on yours. A companion, a lord or a chieftain starts from the crossroads ('start'); you from your origin.
const knowsOf=(o,id)=>!HSKILLS[id].learn||treeHasOf(o,HSKILLS[id].learn);
const treeHasOf=(o,id)=>(o.tree||[]).includes(id);
const treeRootOf=o=>o===P&&P.origin&&treeHasOf(P,P.origin)?P.origin:'start';
const canTakeOf=(o,id)=>!treeHasOf(o,id)&&o.tp>0&&TREE[id].t!=='origin'&&TREE[id].links.some(n=>treeHasOf(o,n));
const knows=id=>knowsOf(P,id),treeHas=id=>treeHasOf(P,id),treeRoot=()=>treeRootOf(P),canTake=id=>canTakeOf(P,id);
const refundCost=()=>15*P.level;
// unlearning must leave every other node connected to the start
function canRefundOf(o,id){
  const root=treeRootOf(o);if(id===root||TREE[id].t==='origin'||!treeHasOf(o,id))return false;const keep=new Set(o.tree.filter(x=>x!==id)),seen=new Set([root]),q=[root];
  while(q.length){const c=q.pop();for(const n of TREE[c].links)if(keep.has(n)&&!seen.has(n)){seen.add(n);q.push(n)}}
  return seen.size===keep.size;
}
const canRefund=id=>canRefundOf(P,id);
// (your attributes never fall below 1; another's, below 0)
function applyNodeOf(o,id,sign){const m=TREE[id].m,lo=o===P?1:0;if(m.attr)for(const a in m.attr)o.attr[a]=Math.max(lo,(o.attr[a]||0)+sign*m.attr[a])}
const applyNode=(id,sign)=>applyNodeOf(P,id,sign);
// a newly learned active skill takes the first empty slot
function slotSkillOf(o,id){o.slots=o.slots||Array(10).fill(null);if(o.slots.includes(id))return o.slots.indexOf(id);const i=o.slots.indexOf(null);if(i>=0)o.slots[i]=id;return i}
const slotSkill=id=>slotSkillOf(P,id);
// whose it is, for the news ('You', or the character's name)
const treeWho=o=>o===P?null:(Object.keys(P.comps||{}).find(k=>P.comps[k]===o));
function takeNodeOf(o,id,quiet){
  if(!canTakeOf(o,id))return false;o.tree.push(id);o.tp--;applyNodeOf(o,id,1);const u=TREE[id].m.unlock,who=treeWho(o),nm=who&&COMPS[who]?COMPS[who].short:null;
  if(u){const i=slotSkillOf(o,u);if(!quiet)log((nm?nm+' learns':'Learned')+' the active skill '+HSKILLS[u].n+(i>=0?', in slot '+(i+1):'; put it in a free slot on the Skill bar')+'.','gold')}else if(!quiet)log((nm?nm+' learns':'Learned')+': '+TREE[id].n+'.','gold');
  return true;
}
const takeNode=id=>takeNodeOf(P,id);
function refundNodeOf(o,id){
  if(!canRefundOf(o,id)||P.gold<refundCost())return false;P.gold-=refundCost();o.tree=o.tree.filter(x=>x!==id);o.tp++;applyNodeOf(o,id,-1);if(o===P)vitals();
  const u=TREE[id].m.unlock;if(u)o.slots=(o.slots||[]).map(s=>s===u?null:s);log((o===P?'You unlearn ':COMPS[treeWho(o)].short+' unlearns ')+TREE[id].n+'.');return true;
}
const refundNode=id=>refundNodeOf(P,id);
// an active skill's numbers after its upgrades; Spellcraft lowers the mana it costs
function abilOf(o,id,spell){
  const S=HSKILLS[id],t=k=>tmOf(o,k),c=1-t(id+'Cost');
  return{...S,mp:Math.round(S.mp*c*(1-.02*spell)),sp:Math.round(S.sp*c),cd:+(S.cd*(1-t(id+'Cd'))).toFixed(1),r:1+t(id+'R'),dmg:1+t(id+'Dmg'),stun:t(id+'Stun'),dur:t(id+'Dur')};
}
const abil=id=>abilOf(P,id,skill('spell'));
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
// whose page it is: yours, or a companion's (who: its id; opened from its window, and back to it)
const skWho=()=>G.skWho&&P.comps[G.skWho]?G.skWho:null;
const skSubj=()=>skWho()?compInit(skWho()):P;
function openSkills(tab,who){
  if(who){if(G.mode!=='comp'||!P.comps[who])return;charKit(charOf(compInit(who),who));G.skWho=who}else{if(G.mode!=='world'||G.modal)return;G.skWho=null}
  G.mode='skills';G.skTab=tab||G.skTab||'talents';if(G.skWho&&G.skTab==='disciplines')G.skTab='talents';G.skSel=!G.skWho&&G.skSel&&TREE[G.skSel]?G.skSel:treeRootOf(skSubj());renderSkills()}// (another's page opens at its crossroads)
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
  const S=skSubj(),treeHas=id=>treeHasOf(S,id),canTake=id=>canTakeOf(S,id);
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
  const S=skSubj(),treeHas=id=>treeHasOf(S,id),canTake=id=>canTakeOf(S,id),canRefund=id=>canRefundOf(S,id),treeRoot=()=>treeRootOf(S);
  const id=G.skSel,N=TREE[id];if(!N)return '';const u=N.m.unlock;
  const btn=N.t==='origin'?(treeHas(id)?'<span class="muted">'+(S===P?'Your origin':'Their origin')+'</span>':'<span class="muted">Another past\u2019s origin</span>'):treeHas(id)?(id===treeRoot()?'':'<button class="btn sm" type="button" data-act="tree-refund" data-arg="'+id+'"'+(canRefund(id)&&P.gold>=refundCost()?'':' disabled title="'+(canRefund(id)?'Not enough gold':'Other skills depend on it')+'"')+'>Unlearn · '+refundCost()+'g</button>')
    :'<button class="btn sm primary" type="button" data-act="tree-take" data-arg="'+id+'"'+(canTake(id)?'':' disabled title="'+(S.tp<1?'No skill points':'Not connected to your skills yet')+'"')+'>Learn</button>';
  return '<div class="tdetail"><div><strong>'+N.n+'</strong> <span class="muted">· '+NODE_KIND(N)+(N.br&&N.br!=='hybrid'?' · '+TREE_BRANCHES.find(b=>b.k===N.br).n:'')+'</span><p>'+N.d+(u&&S===P?' <span class="muted">'+skillStats(u)+'.</span>':'')+'</p></div><div class="acts">'+btn+'</div></div>';
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
    SPECIAL.map(S=>{const have=S.have(),can=S.fin&&!P.fin&&finReady();
      return '<div class="spnode'+(have?' on':can?' open':'')+'"><strong>'+S.n+'</strong><small>'+S.d()+'</small>'+(have?'<small class="good">Learned</small>':can?'<button class="btn sm primary" type="button" data-act="sk-fin" data-arg="'+S.fin+'">Choose</button>':'<small class="muted">'+(S.req?S.req():'')+'</small>')+'</div>'}).join('')+'</div>';
}
// the Skill bar: the ten slots your hero uses in battle, the active skills you have learned, and the basic moves you can use now
function skillBarBody(){
  const S=skSubj();if(S!==P)return compSkillBar(S);
  const known=Object.keys(HSKILLS).filter(knows),slot=i=>{const id=P.slots[i];
    return '<label class="slotpick"><b>'+(i+1)+'</b><select data-act="slot-set" data-arg="'+i+'" aria-label="Skill slot '+(i+1)+'"><option value="">— empty —</option>'+known.map(k=>'<option value="'+k+'"'+(k===id?' selected':'')+'>'+HSKILLS[k].n+'</option>').join('')+'</select></label>'};
  const row=(name,stats,note)=>'<div class="row"><div class="info"><strong>'+name+'</strong><small>'+stats+'</small>'+(note?'<small>'+note+'</small>':'')+'</div></div>';
  const ups=id=>{const all=Object.values(TREE).filter(N=>N.t==='a'&&!N.m.unlock&&Object.keys(N.m).some(m=>m.startsWith(id))&&treeHas(N.id));return all.length?'Upgraded: '+all.map(N=>'<span class="good">'+N.n+'</span>').join(' · '):''};
  const CB=heroCombo(),k=shoveKind();
  return '<div class="lab">Skill slots · your hero uses what is in them in battle, when the moment is right</div><div class="slotgrid">'+SLOT_KEYS.map((k,i)=>slot(i)).join('')+'</div>'+
    '<div class="lab" style="margin-top:6px">Active skills</div>'+(known.length?known.map(id=>{const S=HSKILLS[id],i=P.slots.indexOf(id);
      return row(S.n,S.d+'<br><span class="muted">'+skillStats(id)+'</span>',(i>=0?'<span class="gold">In slot '+(i+1)+'</span>':'<span class="muted">Not in a slot: your hero will not use it</span>')+(ups(id)?' · '+ups(id):''))}).join('')
      :'<p class="muted">No active skills yet. Learn them on the Skill tree.</p>')+
    '<div class="lab" style="margin-top:6px">Basic moves</div>'+
    (heroKind()==='melee'?row('Combo','<span>'+CB.map(c=>c.n+' ×'+c.mult).join(' → ')+'</span>',CB.length<3?'<span class="muted">A third blow at '+SKILLS[meleeSk()].n+' '+COMBO_UP.third+'</span>':P.fin?'<span class="gold">'+(P.fin==='stun'?'Stunning':'Crushing')+' finisher</span>':finReady()?'<span class="gold">Choose its finishing style on the Skill tree</span>':'<span class="muted">Choose its finishing style at '+SKILLS[meleeSk()].n+' '+COMBO_UP.fin+'</span>')
     :heroKind()==='ranged'?row('Shoot ('+ITEMS[P.gear.weapon].n.toLowerCase()+')',(ammoOf()?'Uses '+GOODS[ammoOf()].n.toLowerCase()+' ('+goodN(ammoOf())+' left). ':'')+'Your hero draws and looses at whoever is in range.')
     :row('Cast ('+ITEMS[P.gear.weapon].n.toLowerCase()+')','Magic bolts, '+heroShot().mult+'× damage, splash half to enemies beside the target, ignore armor and trees · '+heroShot().mp+' mana each · every '+heroShot().cd+'s'))+
    row('Dodge Roll',SPECIAL.find(S=>S.id==='dodge').d())+
    (k?row(k==='bash'?'Shield Bash':'Shove',SPECIAL.find(S=>S.id===k).d()):'');
}
// a companion's skill bar: its slots, the active skills it has learned
function compSkillBar(S){
  S.slots=S.slots||Array(10).fill(null);const known=Object.keys(HSKILLS).filter(k=>knowsOf(S,k)),nm=COMPS[skWho()].short;
  const slot=i=>'<label class="slotpick"><b>'+(i+1)+'</b><select data-act="slot-set" data-arg="'+i+'" aria-label="Skill slot '+(i+1)+'"><option value="">— empty —</option>'+known.map(k=>'<option value="'+k+'"'+(k===S.slots[i]?' selected':'')+'>'+HSKILLS[k].n+'</option>').join('')+'</select></label>';
  return '<div class="lab">'+nm+'’s skill slots · they use what is in them in battle, when the moment is right</div><div class="slotgrid">'+SLOT_KEYS.map((k,i)=>slot(i)).join('')+'</div>'+
    '<div class="lab" style="margin-top:6px">Active skills</div>'+(known.length?known.map(id=>'<div class="row"><div class="info"><strong>'+HSKILLS[id].n+'</strong><small>'+HSKILLS[id].d+'</small><small>'+(S.slots.includes(id)?'<span class="gold">In slot '+(S.slots.indexOf(id)+1)+'</span>':'<span class="muted">Not in a slot: '+nm+' will not use it</span>')+'</small></div></div>').join(''):'<p class="muted">No active skills yet. Learn them on '+nm+'’s skill tree.</p>');
}
function disciplinesBody(){
  return '<p class="muted" style="font-size:13px">Disciplines rise as you use them. The skill tree and gear add to them.</p>'+Object.keys(SKILLS).map(k=>{const s=P.sk[k],b=skill(k)-s.lv,need=(s.lv+1)*20,pc=s.lv>=10?100:Math.round(s.xp/need*100);
    return '<div class="row"><div class="info"><strong>'+SKILLS[k].n+(P.apt&&P.apt[k]?' <span class="good" style="font-size:12px">knack +'+Math.round(P.apt[k]*100)+'%</span>':'')+'</strong><small>'+SKILLS[k].d+' · grows faster with '+ATTRS[SKILLS[k].a][0]+'</small><div class="bar" role="progressbar" aria-label="'+SKILLS[k].n+' progress" aria-valuenow="'+pc+'"><i style="width:'+pc+'%"></i></div></div><span class="own">'+s.lv+(b?' <span class="good">+'+b+'</span>':'')+'</span></div>'}).join('');
}
function renderSkills(){
  const S=skSubj(),who=skWho(),tab=G.skTab,taken=S.tree.length-1,pts=S.tp+' skill point'+(S.tp===1?'':'s');
  const body=tab==='talents'?'<div class="top"><span class="lab">'+(S.tp?'<span class="gold">'+pts+' to spend</span>':'No skill points. '+(who?'They gain':'You gain')+' one each level.')+' · '+taken+' learned · unlearning costs '+refundCost()+'g</span><span class="zoom"><button class="btn sm" type="button" data-act="tree-zout" aria-label="Zoom out">−</button><button class="btn sm" type="button" data-act="tree-zin" aria-label="Zoom in">+</button><button class="btn sm" type="button" data-act="tree-fit">Fit</button></span></div>'+treeSvg()+nodeDetail()+(who?'':specialBody())
    :tab==='abilities'?skillBarBody():disciplinesBody();
  showPanel('<div class="top"><h2>'+(who?COMPS[who].short+'’s skills':'Skills')+'</h2><span class="muted">Level '+(who?S.lv:P.level)+' · '+pts+'</span></div><div class="tabs">'+
    [['talents','Skill tree'],['abilities','Skill bar'],...(who?[]:[['disciplines','Disciplines']])].map(x=>'<button class="btn sm'+(x[0]===tab?' on':'')+'" type="button" data-act="sk-tab" data-arg="'+x[0]+'">'+x[1]+'</button>').join('')+
    '</div><div>'+body+'</div>'+(who?nav(['sk-close',null,'Back to '+COMPS[who].short]):nav(null,['sk-close',null,'Back to map'])));
}
// zoom around a point of the view (fx, fy are 0..1 across it)
function treeZoom(f,fx,fy){
  const v=treeView(),full=treeBounds(),w=clamp(v.w*f,full.w*.18,full.w),h=w/TREE_ASPECT,cx=v.x+v.w*(fx==null?.5:fx),cy=v.y+v.h*(fy==null?.5:fy);
  G.tv=w>=full.w-1?null:{x:cx-w*(fx==null?.5:fx),y:cy-h*(fy==null?.5:fy),w,h};const sv=panel.querySelector('svg.tree');if(sv)sv.setAttribute('viewBox',vbText(treeView()));
}
function skillsAct(a,arg){
  if(!a.startsWith('sk-')&&!a.startsWith('tree-')&&a!=='slot-set')return false;
  if(a==='sk-close'){const who=skWho();G.skWho=null;if(who){G.mode='comp';G.compSel=who;renderComp();return true}G.mode='world';hidePanel();return true}
  if(G.mode!=='skills')return true;
  if(a==='sk-tab')G.skTab=arg;
  else if(a==='tree-sel')G.skSel=arg;
  else if(a==='tree-take'){if(takeNodeOf(skSubj(),arg))G.skSel=arg}
  else if(a==='tree-refund')refundNodeOf(skSubj(),arg);
  else if(a==='tree-zin'){treeZoom(1/1.4);return true}
  else if(a==='tree-zout'){treeZoom(1.4);return true}
  else if(a==='tree-fit')G.tv=null;
  // the combo's finishing style: chosen once, when your weapon's discipline is high enough
  else if(a==='sk-fin'){if(finReady()&&!P.fin&&FIN_STYLE[arg]){P.fin=arg;log('Your combo now ends in a '+(arg==='stun'?'stunning':'crushing')+' finisher.','gold')}}
  else if(a==='slot-set'){const S=skSubj(),[i,id]=arg.split(':'),n=+i;S.slots=S.slots||Array(10).fill(null);if(n>=0&&n<10&&(!id||HSKILLS[id]&&knowsOf(S,id))){S.slots=S.slots.map(s=>s===id?null:s);S.slots[n]=id||null}}
  updateHUD(true);renderSkills();return true;
}
// a double click on an open node learns it
panel.addEventListener('dblclick',e=>{const g=e.target.closest&&e.target.closest('.tnode');if(g&&G.mode==='skills'&&canTakeOf(skSubj(),g.dataset.arg))act('tree-take',g.dataset.arg)});
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
