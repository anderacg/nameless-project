'use strict';
window.ARENA=true;// (the battle screen's own rules, on its own field: tests/harness.js)
// Talents: a tree for each proficiency, its points (one each TREE_PT.per levels) spent freely on what its milestones open, each tier
// from the one below; a level a choice of health, stamina or mana; refunds cost gold and give the point back; effects reach the hero, troops, party, abilities and perks; the page works; saves.
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
 ok(profs.every(k=>{const at=t.treeAt(k),T=t.PROF_TREE[k];return T.length===at.length&&T.every(([[a],[b]],i)=>TR[a].at===at[i]&&TR[b].at===at[i]&&TR[a].pair===b&&TR[b].pair===a&&TR[a].prof===k)}),'each milestone a pair, each node knowing its other ('+t.TREE_AT.major.join(', ')+' for fighting and Leadership; '+t.TREE_AT.minor.join(', ')+' for the rest)');
 ok(['k','n','a','s'].every(k=>nodes.some(id=>TR[id].t===k))&&nodes.filter(id=>TR[id].t==='k').length===5,'small, notable, ability and 5 keystone nodes');
 ok(ids.every(id=>TR[id].d&&TR[id].d.length>3),'every node is described');
 ok(Object.values(t.PERKS).length&&Object.keys(t.PERKS).filter(p=>!['captain'].includes(p)).every(p=>nodes.some(id=>TR[id].m.perk===p)),'every old perk is a node of a tree');
 // milestones
 ok(P.lvUp===0&&P.tree.length===1&&P.tree[0]===P.origin,'a new hero has only the origin and no level choice');
 ok(P.sk.oneh.lv===20&&JSON.stringify(t.treePending())==='["oneh"]'&&t.talentsOf(P).points('oneh').left===1,'a veteran soldier\'s One-Handed 20: one point to spend (one each '+t.TREE_PT.per+' levels), its first milestone open (Third Blow or Strength)');
 ok(!t.takeNode('oneh_whirl')&&!t.takeNode('lead_cry'),'a milestone not reached cannot be taken');
 const s0=P.attr.str,h0=t.heroStats().hp;ok(t.takeNode('oneh_str')&&P.attr.str===s0+2&&t.heroStats().hp>h0&&!t.canTake('oneh_third')&&!t.treePending().length,'Strength: +2 Strength, more health; no point left for Third Blow, nothing waiting');
 P.gold=1000;const g0=P.gold;ok(t.refundNode('oneh_str')&&P.attr.str===s0&&P.gold===g0-t.refundCost()&&t.canTake('oneh_third'),'unlearning it for '+t.refundCost()+' gold takes its Strength back and gives the point back');
 {const H=t.leaderOf(P);let k=0;while(P.sk.oneh.lv<35&&k++<2000)H.train('oneh',5,true);t.takeNode('oneh_third');t.takeNode('oneh_str');
  ok(t.treeHas('oneh_third')&&t.treeHas('oneh_str')&&!t.canTake('oneh_whirl')&&t.talentsOf(P).points('oneh').earned===2,'One-Handed trained to '+P.sk.oneh.lv+': two points, both on the first milestone as you like (Third Blow and Strength); Whirlwind waits for a third');
  P.gold=1000;ok(t.refundNode('oneh_str')&&t.canTake('oneh_whirl')&&!t.canRefund('oneh_third')===false,'unlearn one, and the point goes up the tree instead (Whirlwind)');t.takeNode('oneh_whirl');ok(!t.canRefund('oneh_third'),'the node a higher one grows from cannot go while it holds it')}
 // the level's choice (the owner, 2026-11-08: "when you level up you choose to upgrade health, stamina or magic")
 {const H=t.leaderOf(P),l0=P.level,u0=P.lvUp;let k=0;while(P.level<l0+2&&k++<500)H.train('eng',5,true);
  ok(P.level===l0+2&&P.lvUp===u0+2,'two levels (from practice) give two choices, no tree points ('+P.lvUp+' waiting)');
  const hp=t.heroStats().hp,sp=t.maxSP(),mp=t.maxMP(),L=t.LEVEL_UP;P.lvUp=3;
  ok(t.levelPick('hp')&&t.heroStats().hp===hp+L.hp&&t.levelPick('sp')&&t.maxSP()===sp+L.sp&&t.levelPick('mp')&&t.maxMP()===mp+L.mp&&P.lvUp===0&&!t.levelPick('hp'),'each choice: +'+L.hp+' health, +'+L.sp+' stamina or +'+L.mp+' mana; none waiting, none to take')}
 // effects: a node taken as its proficiency reaches it
 const learn=list=>list.forEach(id=>{const N=TR[id],k=N.prof;P.sk[k].lv=Math.max(P.sk[k].lv,N.at,(N.tier+2)*t.TREE_PT.per);for(let i=0;i<N.tier;i++)if(!t.talentsOf(P).tierHas(k,i))t.takeNode(t.PROF_TREE[k][i][0][0]);t.takeNode(id)});P.gold=99999;
 const d0=t.heroStats().dmg;learn(['oneh_duel']);ok(t.heroStats().dmg>d0*1.05,'Duelist: +10% damage');
 ok(!t.knows('leap'),'Leap Slam must be learned');learn(['twoh_leap','oneh_whirl']);ok(t.knows('leap')&&t.knows('whirl'),'Leap Slam (Two-Handed 35) and Whirlwind (One-Handed 35) learned');
 const l0=t.abil('leap');learn(['twoh_shake']);const l1=t.abil('leap');ok(l1.r>l0.r&&l1.stun>l0.stun,'Earthshaker upgrades it');
 {const rn=P.renown;P.renown=1000;P.sk.lead.lv=Math.max(P.sk.lead.lv,2*t.TREE_PT.per);const c0=t.partyRoster(P).groupLimit;learn(['lead_follow']);ok(t.partyRoster(P).groupLimit===Math.min(t.ARMY_LIMIT,c0+1),'Followers: +1 unit slot');P.renown=rn}
 const hc=t.hireCost('hum_levy');learn(['pers_silver']);ok(t.has('silver')&&t.hireCost('hum_levy')<hc,'Silver Tongue: the perk, and cheaper hiring');
 const ms=t.maxMP();learn(['spell_clarity']);ok(t.maxMP()===ms+20,'Clarity: +20 mana');
 // troops in battle
 P.troops={hum_spear:2};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 const sp0=t.B.units.find(u=>u.type==='hum_spear').s.hp;t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 learn(['lead_bearer']);G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 ok(t.B.units.find(u=>u.type==='hum_spear').s.hp>sp0,'Banner Bearer: troops get more health in battle');t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');
 // keystone trade-off
 const hpA=t.heroStats().hp,capA=t.partyCap();learn(['arch_wolf']);ok(t.heroStats().hp>hpA*1.2&&t.partyCap()<capA,'Lone Wolf: more health, fewer followers');
 // the page
 G.mode='world';G.modal=false;t.hidePanel();window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',key:'k'}));t.act('sk-tab','talents');
 ok(G.mode==='skills'&&document.querySelectorAll('[data-act="tree-prof"]').length===profs.length&&document.querySelectorAll('svg.tr-svg .tp-node').length>=6&&document.querySelector('svg.tr-svg.grow .tp-root'),'K opens the Skills page; Skill trees lists every proficiency and draws one as a path of nodes, flying out of its root');
 P.sk.med.lv=20;t.act('tree-prof','med');const nodeCls=id=>document.querySelector('.tp-node[data-arg="'+id+'"]')?.getAttribute('class')||'';
 ok(/Field Surgeon/.test(panel())&&/Healing Light/.test(panel())&&/open/.test(nodeCls('med_surgeon'))&&/locked/.test(nodeCls('med_renew'))&&document.querySelector('svg.tr-svg.grow'),'Medicine\'s tree: at 20 its first tier open (pulsing), its next not yet; switching trees grows it anew');
 t.act('tree-sel','med_surgeon');ok(/Learn · 1 point/.test(panel())&&!document.querySelector('[data-act="tree-take"][data-arg="med_surgeon"]').disabled,'a node chosen on the tree: what it does, and Learn');
 t.act('tree-take','med_surgeon');ok(t.treeHas('med_surgeon')&&/Unlearn/.test(panel())&&/have/.test(nodeCls('med_surgeon'))&&/just/.test(nodeCls('med_surgeon'))&&!/open/.test(nodeCls('med_heal'))&&!document.querySelector('svg.tr-svg.grow'),'learned from the page: lit and flaring, not grown again; no point left for Healing Light');
 P.lvUp=1;t.act('sk-tab','prof');{const hp=t.heroStats().hp;ok(/Level up/.test(panel())&&document.querySelectorAll('[data-act="lv-pick"]').length===3,'the Proficiency tab offers the level\'s choice');t.act('lv-pick','hp');ok(t.heroStats().hp>=hp+t.LEVEL_UP.hp&&P.lvPick.hp>=1&&P.lvUp===0&&!document.querySelector('[data-act="lv-pick"]'),'chosen there: +'+t.LEVEL_UP.hp+' health, the offer gone')}
 t.act('sk-tab','abilities');{const un=Object.keys(t.HSKILLS).filter(k=>!t.knows(k));ok(!/Not learned/.test(panel())&&un.length&&un.every(k=>!panel().includes('<strong>'+t.HSKILLS[k].n+'</strong>')),'the Skill bar lists only the active skills you have learned ('+un.length+' not learned, not shown)')}
 t.act('sk-tab','prof');ok(/One-Handed/.test(panel())&&/Scouting/.test(panel()),'Proficiency lists the proficiencies you train by use');
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='char'&&t.partyView().sel==='hero','Escape follows its Back: the Army window, on your hero');
 if(document.querySelector('#panel .nav [data-nav="back"]:not([data-act="fb-menu"])'))window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));// (a small screen: its card's page, then the cards)
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='esc','and again: the Army window’s Back, the Game Menu');window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='world','then resumed');
 t.openChar();ok(document.querySelector('.fb-unit-actions [data-act="open-skills"]')?.textContent==='Development'&&!/improve through use/.test(panel()),'your hero’s card points to the Skills page');t.act('char-close');
 // saves
 P.lvUp=2;P.lvPick={hp:1,sp:0,mp:3};t.saveGame();const tree=P.tree.slice();P.tree=['start'];P.lvUp=0;P.lvPick={hp:0,sp:0,mp:0};t.act('load');ok(JSON.stringify(P.tree)===JSON.stringify(tree)&&P.lvUp===2&&P.lvPick.mp===3,'the trees and the level\'s choices survive a reload');
 // active skills: every one learned on a node of a tree; slots fill themselves
 const H=t.HSKILLS,ids2=Object.keys(H);ok(ids2.length===10&&ids2.every(id=>TR[H[id].learn]&&TR[H[id].learn].prof&&TR[H[id].learn].m.unlock===id&&TR[H[id].learn].t!=='k'),'ten active skills, each learned on a node of a proficiency\'s tree (none a keystone)');
 t.act('begin','soldier');ok(!t.knows('whirl')&&P.slots.every(x=>x===null),'a new hero knows no active skills and has empty slots');P.sk.oneh.lv=35;t.takeNode('oneh_third');P.sk.oneh.lv=45;t.takeNode('oneh_whirl');ok(t.knows('whirl')&&P.slots[0]==='whirl','One-Handed 45: Third Blow, then Whirlwind, onto slot 1');
 const learnAll=()=>{for(const id of ids2){const N=TR[H[id].learn];P.sk[N.prof].lv=99;if(!t.treeHas(N.id))P.tree.push(N.id);t.slotSkill(id)}};// (each active's node, put there: the tiers below set aside)
 learnAll();ok(ids2.every(t.knows)&&ids2.every(id=>P.slots.includes(id)),'learning skills puts them on free slots ('+P.slots.map(x=>x||'-').join(' ')+')');
 G.mode='world';G.modal=false;t.hidePanel();t.openSkills('abilities');t.act('sk-slot','0');t.act('fb-choice','fireball');t.act('fb-apply');
 ok(P.slots[0]==='fireball'&&P.slots.filter(x=>x==='fireball').length===1,'the Skill bar puts Fireball on slot 1 (and takes it off its old slot)');
 ok(/Skill slots/.test(panel())&&!/press 1 to 0|Right-click|Space ·|F ·/.test(panel())&&document.querySelectorAll('[data-act="sk-slot"]').length===10&&!document.getElementById('panel').querySelector('select'),'the Skill bar shows ten touch slots and learned skills, without dropdowns');t.act('sk-close');
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
 const spA=t.maxSP();P.sk.athl.lv+=2*PROF.per;ok(t.maxSP()===spA+8,'Athletics adds stamina');const mp0=t.abil('fireball').mp;P.sk.spell.lv+=5*PROF.per;ok(t.abil('fireball').mp<mp0,'Spellcraft makes spells cheaper');
 B=fight();const ax=t.heroState();const ath=P.sk.athl.xp+P.sk.athl.lv*1000;t.dodge();ok(P.sk.athl.xp+P.sk.athl.lv*1000>ath,'dodging trains Athletics');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // unlearning an active skill takes it off its slot
 P.gold=99999;ok(t.refundNode('lead_banner')&&!P.slots.includes('banner'),'unlearning War Banner takes it off its slot');
 // origins: every past starts from its own, with its bonus; none taken or unlearned
 const bgs=Object.keys(t.BGS);ok(bgs.every(b=>TR['o_'+b]&&TR['o_'+b].t==='origin'),'every past has an origin: '+bgs.map(b=>TR['o_'+b].n).join(', '));
 const res={};for(const b of bgs){t.act('begin',b);res[b]=P.tree.slice()}ok(bgs.every(b=>res[b].length===1&&res[b][0]==='o_'+b),'a new hero starts with only their own origin learned');
 t.act('begin','hedge');ok(P.origin==='o_hedge'&&t.skill('spell')>=P.sk.spell.lv/PROF.per+1,'the Hedge mage origin adds Spellcraft');
 P.gold=9999;ok(!t.canTake('o_soldier')&&!t.canRefund('o_hedge'),'your origin cannot be unlearned, nor another past\'s taken');
 t.act('begin','soldier');
 // attributes are read-only now
 G.mode='world';G.modal=false;t.hidePanel();t.openChar();ok(!document.querySelector('[data-act="spend"]')&&/raised on the skill trees/.test(panel()),'your hero’s card shows attributes without + buttons');t.act('char-close');
 t.frame();
 // the Trait page: the moves everyone has, your attack and the way to the combo's third blow on the Tree
 {G.mode='world';G.modal=false;t.hidePanel();t.openSkills('traits');
  ok(/Dodge Roll/.test(panel())&&/Shove/.test(panel())&&/Shield Bash/.test(panel())&&/Third Blow/.test(panel()),'the Trait page: the basic moves and the combo\u2019s path');
  ok(!document.querySelector('[data-act="sk-fin"]'),'no finisher button: the finishers are in the weapons\' trees');t.act('sk-close')}
 // shove with a bow, shield bash with a shield, neither otherwise
 {const g0=P.gear.weapon;ok(t.shoveKind()===(t.grip()==='shield'?'bash':t.isBow()?'shove':null),'shove needs a bow, shield bash a shield ('+t.shoveKind()+')');P.gear.weapon=g0}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
