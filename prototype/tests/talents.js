'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Talents: a tree for each proficiency; your skill points (one a level, LEVEL.pts) spent freely on any tree's nodes, each tier from the
// one below, no milestone, a node's strength by its proficiency's level (treeScale); refunds cost gold and give the point back; effects reach the hero, troops, party, abilities and perks; the page works; saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 (0,eval)('MANUAL_HERO=true');// (the manual control is set aside in play, RTS command: its skills are still tested here)
 const t=T,G=t.G,P=t.P,TR=t.TREE;try{localStorage.clear()}catch(e){}
 const panel=()=>document.getElementById('panel').innerHTML;
 t.act('begin','soldier');
 // ---- the trees: one for each proficiency, its milestones a pair of nodes each (the owner, 2026-11-08: "make each skill tree
 // separated by proficiency"; data/tree.js PROF_TREE)
 const ids=Object.keys(TR),nodes=ids.filter(id=>TR[id].prof),profs=Object.keys(t.PROF_TREE);
 ok(profs.length===Object.keys(t.SKILLS).length&&profs.every(k=>t.SKILLS[k]),'a tree for each of the '+profs.length+' proficiencies ('+nodes.length+' nodes)');
 ok(profs.every(k=>{const T=t.PROF_TREE[k];return T.length>=3&&T.every(([[a],[b]],i)=>TR[a].tier===i&&TR[b].tier===i&&TR[a].pair===b&&TR[b].pair===a&&TR[a].prof===k&&TR[a].at==null)}),'each tier a pair, each node knowing its other; no milestone')
 ok(['k','n','a','s'].every(k=>nodes.some(id=>TR[id].t===k))&&nodes.filter(id=>TR[id].t==='k').length>=5,'small, notable, ability and keystone nodes ('+nodes.filter(id=>TR[id].t==='k').length+' keystones)');
 // (harder to unlock, the owner, 2026-11-13: a node's cost by its kind, its tier opening at its proficiency's level; a new tier each)
 ok(nodes.every(id=>t.talentsOf(P).cost(id)===t.TREE_COST[TR[id].t])&&t.TREE_COST.k>t.TREE_COST.n&&t.TREE_COST.n>t.TREE_COST.s&&profs.every(k=>t.PROF_TREE[k].length>=4),'nodes cost '+JSON.stringify(t.TREE_COST)+'; every tree 4 tiers or more');
 {const L=t.talentsOf(P),lv=P.sk.oneh.lv;P.level=99;P.sk.oneh.lv=0;const g=L.gate('oneh_whirl'),a=L.gated('oneh_whirl');P.sk.oneh.lv=g;const b=L.gated('oneh_whirl');P.sk.oneh.lv=lv;P.level=0;ok(g===t.TREE_GATE[1]&&a&&!b&&L.gate('oneh_third')===0&&L.gate('oneh_p1')===0,'a tier opens at its proficiency\'s level: Whirlwind\'s at One-Handed '+g+', the first tier and its path at once')}
 ok(ids.every(id=>TR[id].d&&TR[id].d.length>3),'every node is described');
 ok(Object.values(t.PERKS).length&&Object.keys(t.PERKS).filter(p=>!['captain'].includes(p)).every(p=>nodes.some(id=>TR[id].m.perk===p)),'every old perk is a node of a tree');
 // skill points: one a level (the owner, 2026-11-08: Skyrim's way), on any tree, no milestone
 ok(P.level===0&&P.tree.length===1&&P.tree[0]===P.origin&&!t.treePending().length,'a new hero has only the origin and no point to spend');
 P.level=1;ok(t.talentsOf(P).points().left===1&&t.treePending().length===1&&!t.takeNode('oneh_whirl')&&t.canTake('lead_follow')&&!t.canTake('lead_cry'),'level 1: a point, for a passive of any tree\'s first tier (Leadership\'s at '+P.sk.lead.lv+' too); an active skill costs '+t.TREE_COST.a);
 const h0=t.heroStats().hp;ok(t.takeNode('oneh_str')&&t.heroStats().hp>h0&&!t.canTake('oneh_third')&&!t.treePending().length,'Strength: more health; no point left for Third Blow, nothing waiting');
 P.gold=1000;const g0=P.gold;ok(t.refundNode('oneh_str')&&t.heroStats().hp===h0&&P.gold===g0-t.refundCost()&&t.talentsOf(P).points().left===1&&!t.canTake('oneh_third'),'unlearning it for '+t.refundCost()+' gold takes its health back and gives the point back');
 P.level=3;t.takeNode('oneh_third');t.takeNode('oneh_str');ok(t.treeHas('oneh_third')&&t.treeHas('oneh_str')&&!t.canTake('oneh_whirl'),'level 3: three points, Third Blow (2) and Strength (1) on the first tier; Whirlwind waits');
 P.gold=1000;ok(t.refundNode('oneh_str')&&t.canTake('oneh_p1')&&!t.canTake('oneh_whirl'),'unlearn one, and the point goes up the path instead: its bonus node first (Whirlwind beyond it)');t.takeNode('oneh_p1');ok(!t.canRefund('oneh_third'),'the node a higher one grows from cannot go while it holds it');
 ok((w=>w.length===5&&w[0]==='oneh_p2'&&w[4]==='oneh_stun')(t.talentsOf(P).pathTo('oneh_stun'))&&!t.talentsOf(P).pathTo('oneh_p1').length,'the way to a node: what is still to learn, the first open now (pathTo)');
 // a node's strength by its proficiency (the owner: "quarter at 0"): Strength's health at One-Handed 0, 100, 400
 {const lv=P.sk.oneh.lv,at=v=>{P.sk.oneh.lv=v;const g=t.tmOf(P,'hp')-t.TREE[P.origin].m.hp;return Math.round(g*100)/100};P.gold=1000;t.takeNode('oneh_str')||(P.level++,t.takeNode('oneh_str'));
  const hp=P.tree.reduce((n,id)=>n+(TR[id]&&TR[id].prof==='oneh'&&TR[id].m.hp||0),0),a=at(0),b=at(100),c=at(400);P.sk.oneh.lv=lv;ok(Math.abs(a-hp*t.treeScale(0))<.01&&Math.abs(b-hp*t.TREE_SCALE.most)<.01&&c>b&&t.TREE_SCALE.most<1,'its One-Handed nodes\' '+hp+' health: '+Math.round(100*t.treeScale(0))+'% at 0 ('+a+'), '+Math.round(100*t.TREE_SCALE.most)+'% at 100 ('+b+'), more past it ('+c+' at 400)')}
 // no health, stamina or mana to choose: the level gives points only
 ok((0,eval)('typeof levelPick')==='undefined'&&(0,eval)('typeof LEVEL_UP')==='undefined','no level choice of health, stamina or mana');
 // effects: a node taken as its proficiency reaches it
 // (each at its proficiency 100: whole; the points it needs given)
 const learn=list=>list.forEach(id=>{const N=TR[id],k=N.prof;P.sk[k].lv=Math.max(P.sk[k].lv,100);const w=t.talentsOf(P).pathTo(id);P.level+=w.reduce((n,x)=>n+t.talentsOf(P).cost(x),0);w.forEach(x=>t.takeNode(x))});P.gold=99999;// (the way to it learned, its points given)
 const d0=t.heroStats().dmg;learn(['oneh_duel']);ok(t.heroStats().dmg>d0*1.05,'Duelist: +10% damage');
 ok(!t.knows('leap'),'Leap Slam must be learned');learn(['twoh_leap','oneh_whirl']);ok(t.knows('leap')&&t.knows('whirl'),'Leap Slam (Two-Handed 35) and Whirlwind (One-Handed 35) learned');
 const l0=t.abil('leap');learn(['twoh_shake']);const l1=t.abil('leap');ok(l1.r>l0.r&&l1.stun>l0.stun,'Earthshaker upgrades it');
 {const rn=P.renown;P.renown=1000;P.sk.lead.lv=Math.max(P.sk.lead.lv,100);const c0=t.partyRoster(P).groupLimit;learn(['lead_follow']);ok(t.partyRoster(P).groupLimit===Math.min(t.ARMY_LIMIT,c0+1),'Followers: +1 unit slot (a slot whole, at any Leadership)');P.renown=rn}
 const hc=t.hireCost('hum_levy');learn(['pers_silver']);ok(t.has('silver')&&t.hireCost('hum_levy')<hc,'Silver Tongue: the perk, and cheaper hiring');
 const ms=t.maxMP(),wm=t.talentsOf(P).pathTo('spell_clarity').reduce((n,id)=>n+(TR[id].m.mp||0),0);learn(['spell_clarity']);ok(Math.abs(t.maxMP()-(ms+wm*t.treeScale(100)))<=1&&wm>=20,'Clarity: +20 mana (with the bonus on its path: +'+wm+', '+Math.round(100*t.treeScale(100))+'% of it at Spellcasting 100)');
 // troops in battle
 P.troops={hum_spear:2};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 const sp0=t.B.units.find(u=>u.type==='hum_spear').s.hp;t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 learn(['lead_bearer']);G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 ok(t.B.units.find(u=>u.type==='hum_spear').s.hp>sp0,'Banner Bearer: troops get more health in battle');t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');
 // keystone trade-off
 P.sk.archery.lv=Math.max(P.sk.archery.lv,100);const ld=P.sk.lead.lv;P.sk.lead.lv=0;const hpA=t.heroStats().hp,capA=t.partyCap();learn(['arch_wolf']);ok(t.heroStats().hp>hpA*1.1&&t.partyCap()<capA,'Lone Wolf: more health, fewer followers (under the army\'s top)');P.sk.lead.lv=ld;
 // the page
 G.mode='world';G.modal=false;t.hidePanel();window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',key:'k'}));t.act('sk-tab','talents');
 ok(G.mode==='skills'&&document.querySelectorAll('[data-act="tree-prof"]').length===profs.length&&document.querySelectorAll('svg.tr-svg .tp-node').length>=6&&document.querySelector('svg.tr-svg.grow .tp-root'),'K opens the Skills page; Skill trees lists every proficiency and draws one as a path of nodes, flying out of its root');
 // (the switch under the tree (the owner, 2026-11-08): ‹ the one before, this one, the one after ›, round and round; its name opens the
 // list of them all, hidden till then; ← and → step too)
 {const L=t.skProfs(P),sw=()=>document.querySelector('.fb-tree-switch'),side=c=>sw()?.querySelector('.fb-ts-side.'+c+' span')?.textContent,list=()=>document.querySelector('.fb-tree-list'),key=k=>document.getElementById('panel').dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
  t.act('tree-prof',L[0]);ok(side('prev')===t.SKILLS[L[L.length-1]].n&&side('next')===t.SKILLS[L[1]].n&&sw().querySelector('.fb-ts-now strong').textContent===t.SKILLS[L[0]].n&&list().hidden,'under the tree: '+side('prev')+' ‹ '+t.SKILLS[L[0]].n+' › '+side('next')+', round from the first to the last; the list hidden');
  t.act('tree-step','-1');const a=G.skTree;t.act('tree-step','1');const b=G.skTree;key('ArrowRight');const c=G.skTree;
  ok(a===L[L.length-1]&&b===L[0]&&c===L[1],'‹ goes to the one before (the last from the first), › to the one after, → too');
  t.act('tree-list');const open=!list().hidden&&list().querySelector('[data-act="tree-prof"].on')?.dataset.arg===L[1];t.act('tree-prof',L[2]);ok(open&&list().hidden&&G.skTree===L[2],'its name opens the list of them all, the shown one marked; picking one shows it and closes the list')}
 // (the round tree (the owner, 2026-11-08: "one big circle node tree spans across each proficiency"): every proficiency a slice of one
 // wheel, round it in TREE_RING's order; a bonus node between each two tiers joining both of each; the shown slice turned up, the rest
 // dim; the whole circle at a press; another slice's node turns the wheel to it)
 {const ring=t.TREE_RING.flatMap(g=>g[1]),hubs=Object.keys(TR).filter(id=>TR[id].hub);
  ok(ring.length===profs.length&&profs.every(k=>ring.includes(k))&&t.skProfs(P).join()===ring.join(),'the wheel holds every proficiency, once, the switch going round it in its order');
  // (2026-11-09, the owner: "add more attribute nodes to each proficiency": a run of PATH_RUN between each two tiers, PATH_TAIL past the last)
  ok(profs.every(k=>{const T=t.PROF_TREE[k],B=Object.keys(TR).filter(id=>TR[id].prof===k&&TR[id].hub);if(B.length!==(T.length-1)*t.PATH_RUN+t.PATH_TAIL)return false;
    return T.every((pair,i)=>i===T.length-1||(run=>run.length===t.PATH_RUN&&pair.every(([lo])=>TR[run[0]].links.includes(lo))&&T[i+1].every(([hi])=>TR[run[run.length-1]].links.includes(hi)))(B.filter(id=>TR[id].tier===i)))})
    &&hubs.every(id=>TR[id].m&&Object.keys(TR[id].m).filter(q=>q!=='learn').length&&TR[id].t==='b'),hubs.length+' bonus nodes: a run of '+t.PATH_RUN+' between each two tiers (its first joining both below, its last both above) and '+t.PATH_TAIL+' past the last, each giving something');
  ok(document.querySelectorAll('svg.tw .tp-node').length===Object.keys(TR).filter(id=>TR[id].prof).length&&document.querySelectorAll('svg.tw .tp-node:not(.far)').length===t.talentsOf(P).nodesOf(G.skTree).length,'every node of the wheel drawn, the shown slice\'s lit, the rest dim');
  const k0=G.skTree,far=Object.keys(TR).find(id=>TR[id].prof&&TR[id].prof!==k0);t.act('tree-sel',far);ok(G.skTree===TR[far].prof&&G.skSel===far&&document.querySelector('.tw-wheel').style.transform.includes('rotate'),'a node of another slice: the wheel turns to it, chosen');
  {const {P:Q}=t.treePos(),ids=Object.keys(Q),rr=id=>t.TREE_ROUND.r[TR[id].t]||16;let m=1e9,w='';for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){const g=Math.hypot(Q[ids[i]][0]-Q[ids[j]][0],Q[ids[i]][1]-Q[ids[j]][1])-rr(ids[i])-rr(ids[j]);if(g<m){m=g;w=ids[i]+' / '+ids[j]}}
   ok(m>=8,'no two nodes of the wheel touch (the owner, 2026-11-09: "make the node not overlap"): the closest '+Math.round(m)+' apart ('+w+')')}
  t.act('tree-whole');ok(document.querySelector('svg.tw.whole')&&document.querySelectorAll('.tw-sec').length===profs.length,'the whole tree at a press: every slice named');t.act('tree-focus','oneh');ok(!document.querySelector('svg.tw.whole')&&G.skTree==='oneh','a slice\'s name: back close, on it')}
 // (step 3: a drag pans the wheel and is never a tap; the wheel and two fingers zoom about the point under them; the view kept through
 // a tap, another slice its own view again; + and − a step)
 {const svg=()=>document.querySelector('svg.tw'),vb=()=>svg().getAttribute('viewBox').split(/\s+/).map(Number),R=svg().getBoundingClientRect(),cx=R.left+R.width/2,cy=R.top+R.height/2,
   pe=(el,type,x,y,id=1,kind='mouse')=>el.dispatchEvent(new PointerEvent(type,{clientX:x,clientY:y,pointerId:id,pointerType:kind,isPrimary:id===1,button:0,bubbles:true,cancelable:true}));
  const v0=vb(),s0=G.skSel;pe(svg(),'pointerdown',cx,cy);pe(window,'pointermove',cx+40,cy+30);pe(window,'pointermove',cx+80,cy+60);pe(window,'pointerup',cx+80,cy+60);
  const hit=svg().querySelector('.tp-node:not(.far)');hit.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));const v1=vb();
  ok(v1[0]<v0[0]&&v1[1]<v0[1]&&v1[2]===v0[2]&&G.skSel===s0,'a drag pans the wheel (its view moved, not its size), and the click it ends with chooses nothing');
  const pt=t.twAt(svg(),cx,cy);svg().dispatchEvent(new WheelEvent('wheel',{deltaY:-300,clientX:cx,clientY:cy,bubbles:true,cancelable:true}));const v2=vb(),pt2=t.twAt(svg(),cx,cy);
  ok(v2[2]<v1[2]&&Math.abs(pt.x-pt2.x)<1&&Math.abs(pt.y-pt2.y)<1,'the mouse wheel zooms in about the point under it ('+Math.round(v1[2])+' → '+Math.round(v2[2])+' across)');
  pe(svg(),'pointerdown',cx-30,cy,11,'touch');pe(svg(),'pointerdown',cx+30,cy,12,'touch');pe(window,'pointermove',cx-10,cy,11,'touch');pe(window,'pointermove',cx+10,cy,12,'touch');pe(window,'pointerup',cx-10,cy,11,'touch');pe(window,'pointerup',cx+10,cy,12,'touch');const v3=vb();
  ok(v3[2]>v2[2]*2.5,'two fingers drawn together zoom out ('+Math.round(v2[2])+' → '+Math.round(v3[2])+' across)');
  t.act('tree-sel',hit.dataset.arg);ok(vb().every((v,i)=>Math.abs(v-v3[i])<.06),'a tap keeps the view');
  t.act('tree-zoom','in');ok(Math.abs(vb()[2]-v3[2]/t.TREE_PAN.step)<.2,'+ zooms in a step');
  const k=G.skTree;t.act('tree-step','1');ok(vb().join()===t.treeView(G.skTree,false).join()&&G.skTree!==k,'another slice: its own view again');t.act('tree-step','-1')}
 P.sk.med.lv=20;t.act('tree-prof','med');const nodeCls=id=>document.querySelector('.tp-node[data-arg="'+id+'"]')?.getAttribute('class')||'';
 P.level=t.talentsOf(P).points().spent+t.TREE_COST.n;t.act('tree-prof','oneh');t.act('tree-prof','med');ok(/Field Surgeon/.test(panel())&&/Healing Light/.test(panel())&&/open/.test(nodeCls('med_surgeon'))&&/locked/.test(nodeCls('med_renew'))&&document.querySelector('svg.tr-svg.grow'),'Medicine\'s tree: a point left, its first tier open (pulsing), its next not yet; switching trees grows it anew');
 t.act('tree-sel','med_surgeon');ok(/Learn, 2 points/.test(panel())&&!document.querySelector('[data-act="tree-take"][data-arg="med_surgeon"]').disabled,'a node chosen on the tree: what it does, and Learn');
 t.act('tree-take','med_surgeon');ok(t.treeHas('med_surgeon')&&/Unlearn/.test(panel())&&/have/.test(nodeCls('med_surgeon'))&&/just/.test(nodeCls('med_surgeon'))&&!/open/.test(nodeCls('med_heal'))&&!document.querySelector('svg.tr-svg.grow'),'learned from the page: lit and flaring, not grown again; no point left for Healing Light');
 // (each node's own icon from what it does (the owner, 2026-11-13: "use appropriate icons"); drawn on the shown slice only, a tap
 // marking its node in place, the wheel kept (the owner: "optimize skill tree performance"))
 {const I=nodes.filter(id=>TR[id].t!=='b').map(id=>t.nodeIcon(TR[id])),un=[...new Set(I)];ok(I.every(n=>t.UI_ILLUSTRATIONS[n])&&un.length>=25&&t.nodeIcon(TR.lead_cry)==='rally'&&t.nodeIcon(TR.twoh_shake)==='hammer'&&t.nodeIcon(TR.scout_eye)==='scout','every node an icon of its own kind ('+un.length+' kinds): War Cry a rally, Earthshaker Leap Slam\'s hammer, Scout\'s Eye a scout');
  const svg=document.querySelector('svg.tw'),img=[...svg.querySelectorAll('.tp-node image')].map(e=>e.closest('.tp-node')),far=svg.querySelectorAll('.tp-node.far .tp-aura,.tp-node.far image,.tp-node.far .tp-ring').length;
  t.act('tree-sel','med_heal');ok(img.length&&img.every(g=>!g.classList.contains('far'))&&!far&&document.querySelector('svg.tw')===svg&&document.querySelector('.tp-node.sel')?.dataset.arg==='med_heal'&&/Healing Light/.test(document.querySelector('.tr-pane').textContent),'icons, glows and rings on the shown slice only ('+img.length+' icons); a tap marks its node and shows it, the wheel kept as it is')}
 t.act('sk-tab','prof');ok(/Level \d+/.test(panel())&&/XP to level/.test(panel())&&!document.querySelector('[data-act="lv-pick"]'),'the Proficiency tab shows your level and its experience, no level choice');
 t.act('sk-tab','abilities');{const un=Object.keys(t.HSKILLS).filter(k=>!t.knows(k));ok(!/Not learned/.test(panel())&&un.length&&un.every(k=>!panel().includes('<strong>'+t.HSKILLS[k].n+'</strong>')),'the Skill bar lists only the active skills you have learned ('+un.length+' not learned, not shown)')}
 t.act('sk-tab','prof');ok(/One-Handed/.test(panel())&&/Scouting/.test(panel()),'Proficiency lists the proficiencies you train by use');
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='char'&&t.partyView().sel==='hero','Escape follows its Back: the Army window, on your hero');
 if(document.querySelector('#panel .nav [data-nav="back"]:not([data-act="fb-menu"])'))window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));// (a small screen: its card's page, then the cards)
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='esc','and again: the Army window’s Back, the Game Menu');window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='world','then resumed');
 t.openChar();ok(document.querySelector('.fb-unit-actions [data-act="open-skills"]')?.textContent==='Development'&&!/improve through use/.test(panel()),'your hero’s card points to the Skills page');t.act('char-close');
 // saves
 P.xp=42;t.saveGame();const tree=P.tree.slice(),lvS=P.level;P.tree=['start'];P.level=0;P.xp=0;t.act('load');ok(JSON.stringify(P.tree)===JSON.stringify(tree)&&P.level===lvS&&P.xp===42,'the trees, the level and its experience survive a reload');
 // active skills: every one learned on a node of a tree; slots fill themselves
 const H=t.HSKILLS,ids2=Object.keys(H);ok(ids2.length===10&&ids2.every(id=>TR[H[id].learn]&&TR[H[id].learn].prof&&TR[H[id].learn].m.unlock===id&&TR[H[id].learn].t!=='k'),'ten active skills, each learned on a node of a proficiency\'s tree (none a keystone)');
 t.act('begin','soldier');ok(!t.knows('whirl')&&P.slots.every(x=>x===null),'a new hero knows no active skills and has empty slots');P.level=6;P.sk.oneh.lv=Math.max(P.sk.oneh.lv,t.TREE_GATE[1]);['oneh_third','oneh_p1','oneh_p2','oneh_whirl'].forEach(id=>t.takeNode(id));ok(t.knows('whirl')&&P.slots[0]==='whirl','six points: Third Blow (2), its path\'s two bonuses, then Whirlwind (2), onto slot 1');
 const learnAll=()=>{for(const id of ids2){const N=TR[H[id].learn];P.sk[N.prof].lv=99;for(const x of t.talentsOf(P).pathTo(N.id))P.tree.push(x);t.slotSkill(id)}};// (each active's node and the way to it, put there)
 learnAll();ok(ids2.every(t.knows)&&ids2.every(id=>P.slots.includes(id)),'learning skills puts them on free slots ('+P.slots.map(x=>x||'-').join(' ')+')');
 G.mode='world';G.modal=false;t.hidePanel();t.openSkills('abilities');t.act('sk-slot','0');t.act('fb-choice','fireball');t.act('fb-apply');
 ok(P.slots[0]==='fireball'&&P.slots.filter(x=>x==='fireball').length===1,'the Skill bar puts Fireball on slot 1 (and takes it off its old slot)');
 ok(/Skill slots/.test(panel())&&!/press 1 to 0|Right-click|Space, |F, /.test(panel())&&document.querySelectorAll('[data-act="sk-slot"]').length===10&&!document.getElementById('panel').querySelector('select'),'the Skill bar shows ten touch slots and learned skills, without dropdowns');t.act('sk-close');
 // each new skill in battle
 P.troops={hum_spear:4};P.gear.weapon=t.gearId('bow',2);P.gear.quiver='q_master';const fight=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia','militia']};t.startBattle({enemies:G.enc.list,tournament:false});t.beginFight();const B=t.B;
   B.units.filter(u=>u.team===1).forEach((u,i)=>{u.x=B.hero.x+18;u.y=B.hero.y+(i-1)*8;u.cd=99;u.s={...u.s,spd:0}});B.aim=0;const X=t.heroState();X.sp=999;X.mp=999;return B};
 const foes=B=>B.units.filter(u=>u.team===1);let B=fight();
 const slotOf=id=>P.slots.indexOf(id);P.slots=['whirl','quake','dash','volley','fireball','nova','heal','cry','banner','leap'];t.buildSlotBar();
 ok(document.querySelectorAll('#slotbar [data-slot]').length===10,'the battle bar shows a button per filled slot');
 const key=k=>t.castSlot(k==='0'?9:+k-1);// (the skill keys are set aside with the manual control: the slots are cast directly)
 key('2');ok(foes(B).every(u=>u.stun>0||u.hp<u.max),'key 2: Earthquake staggers everyone around you');
 B=fight();foes(B).forEach(u=>{u.max=u.hp=999});const hx=B.hero.x;key('3');for(let i=0;i<200&&t.B&&B.hx.dash;i++)t.updateBattle(.02);if(!t.B){t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0])}ok(B.hero.x>hx+40&&foes(B).some(u=>u.hp<u.max),'key 3: Blade Dash carries you through them, cutting');
 B=fight();const ar0=t.heroShotsLeft();B.arrows=[];key('4');ok(B.arrows.length===8&&t.heroShotsLeft()===ar0-4,'key 4: Rain of Arrows looses 8 arrows for 4 of your quiver\'s');
 P.gear.weapon=t.gearId('sword',1);B=fight();key('4');ok(!B.arrows.length&&B.floats.some(f=>/needs a bow/.test(f.t)),'without a bow Rain of Arrows will not cast');
 B=fight();B.arrows=[];key('5');ok(B.arrows.length===1&&B.arrows[0].magic&&B.arrows[0].src.splash>30,'key 5: Fireball flies with a wide burst');
 B=fight();key('6');ok(foes(B).every(u=>u.slow>0),'key 6: Frost Nova slows everyone around you');
 B=fight();B.hero.hp=10;const sp=B.units.find(u=>u.type==='hum_spear');sp.x=B.hero.x;sp.y=B.hero.y+10;sp.hp=5;key('7');ok(B.hero.hp>10&&sp.hp>5,'key 7: Healing Light mends you and your troops');
 B=fight();key('9');const ally=B.units.find(u=>u.type==='hum_spear'&&Math.hypot(u.x-B.hero.x,u.y-B.hero.y)<100)||B.hero;ok(B.banner&&ally.wardT>0,'key 9: War Banner shields troops near it');
 const hb=ally.hp;t.applyDmg(ally,20);ok(hb-ally.hp===15||hb-ally.hp<20,'they take a quarter less damage');
 B=fight();key('0');ok(B.hx.leap||B.hx.cds.leap>0,'key 0 casts slot 10 (Leap Slam)');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // disciplines: four new ones that rise with use
 ok(['archery','spell','athl','eng'].every(k=>t.SKILLS[k]&&P.sk[k]),'new disciplines: Archery, Spellcraft, Athletics, Engineering');
 const spA=t.maxSP(),a0=P.sk.athl.lv;P.sk.athl.lv+=20;ok(Math.abs(t.maxSP()-spA-4*(t.profPow(a0+20)-t.profPow(a0)))<1e-9,'Athletics adds stamina (4 a point of its power)');const mp0=t.abil('fireball').mp;P.sk.spell.lv+=100;ok(t.abil('fireball').mp<mp0,'Spellcraft makes spells cheaper');
 B=fight();const ax=t.heroState();const ath=P.sk.athl.xp+P.sk.athl.lv*1000;t.dodge();ok(P.sk.athl.xp+P.sk.athl.lv*1000>ath,'dodging trains Athletics');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // unlearning an active skill takes it off its slot
 P.gold=99999;ok(t.refundNode('lead_banner')&&!P.slots.includes('banner'),'unlearning War Banner takes it off its slot');
 // origins: every past starts from its own, with its bonus; none taken or unlearned
 const bgs=Object.keys(t.BGS);ok(bgs.every(b=>TR['o_'+b]&&TR['o_'+b].t==='origin'),'every past has an origin: '+bgs.map(b=>TR['o_'+b].n).join(', '));
 const res={};for(const b of bgs){t.act('begin',b);res[b]=P.tree.slice()}ok(bgs.every(b=>res[b].length===1&&res[b][0]==='o_'+b),'a new hero starts with only their own origin learned');
 t.act('begin','hedge');ok(P.origin==='o_hedge'&&t.skill('spell')>=t.profPow(P.sk.spell.lv)+1-1e-9,'the Hedge mage origin adds Spellcraft');
 P.gold=9999;ok(!t.canTake('o_soldier')&&!t.canRefund('o_hedge'),'your origin cannot be unlearned, nor another past\'s taken');
 t.act('begin','soldier');
 // attributes are read-only now
 G.mode='world';G.modal=false;t.hidePanel();t.openChar();ok(!document.querySelector('[data-act="spend"]')&&/From the skill trees/.test(panel()),'your hero’s card shows what the trees give (no attributes, no + buttons)');t.act('char-close');
 t.frame();
 // the Trait page: the moves everyone has, your attack and the way to the combo's third blow on the Tree
 {G.mode='world';G.modal=false;t.hidePanel();t.openSkills('traits');
  ok(/Dodge Roll/.test(panel())&&/Shove/.test(panel())&&/Shield Bash/.test(panel())&&/Third Blow/.test(panel()),'the Trait page: the basic moves and the combo\u2019s path');
  ok(!document.querySelector('[data-act="sk-fin"]'),'no finisher button: the finishers are in the weapons\' trees');t.act('sk-close')}
 // shove with a bow, shield bash with a shield, neither otherwise
 {const g0=P.gear.weapon;ok(t.shoveKind()===(t.grip()==='shield'?'bash':t.isBow()?'shove':null),'shove needs a bow, shield bash a shield ('+t.shoveKind()+')');P.gear.weapon=g0}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
