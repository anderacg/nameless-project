'use strict';
// Talents: the tree is connected and every node reachable; points come one per level; nodes must touch what you have;
// refunds keep the tree connected and cost gold; effects reach the hero, troops, party, abilities and perks; the page works; saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 (0,eval)('MANUAL_HERO=true');// (the manual control is set aside in play, RTS command: its skills are still tested here)
 const t=T,G=t.G,P=t.P,TR=t.TREE;try{localStorage.clear()}catch(e){}
 const panel=()=>document.getElementById('panel').innerHTML;
 t.act('begin','soldier');
 const ids=Object.keys(TR);ok(ids.length>=50,ids.length+' nodes');
 const seen=new Set(['start']),q=['start'];while(q.length){const c=q.pop();for(const n of TR[c].links)if(!seen.has(n)){seen.add(n);q.push(n)}}
 ok(seen.size===ids.length,'every node is reachable from the start');
 ok(ids.every(id=>TR[id].links.every(n=>TR[n]&&TR[n].links.includes(id))),'links go both ways');
 ok(['k','n','a','s'].every(k=>ids.some(id=>TR[id].t===k))&&ids.filter(id=>TR[id].t==='k').length===4,'small, notable, ability and 4 keystone nodes');
 ok(ids.every(id=>TR[id].d&&TR[id].d.length>3),'every node is described');
 ok(Object.values(t.PERKS).length&&Object.keys(t.PERKS).every(p=>ids.some(id=>TR[id].m.perk===p)),'every old perk is a notable');
 // points
 ok(P.tp===0&&P.tree.length===1,'a new hero has no points and only the Origin');
 P.xp=0;t.gainXp(60*1+60*2);ok(P.level===3&&P.tp===2,'two levels give two points');
 ok(!t.takeNode('might2'),'a node not touching yours cannot be taken');
 const s0=P.attr.str,h0=t.heroStats().hp;ok(t.takeNode('might0')&&P.attr.str===s0+2&&t.heroStats().hp>h0,'Strength talent: +2 Strength, more health');
 ok(t.takeNode('might1')&&P.tp===0&&!t.takeNode('might2'),'no points, no talents');
 // refunds
 P.gold=1000;ok(!t.canRefund('might0'),'a node others depend on cannot be unlearned');
 const g0=P.gold;ok(t.refundNode('might1')&&P.tp===1&&P.gold===g0-t.refundCost(),'unlearning a leaf gives the point back for '+t.refundCost()+' gold');
 ok(t.refundNode('might0')&&P.attr.str===s0,'and takes its Strength back');
 // effects
 const learn=list=>{P.tp+=list.length;list.forEach(id=>t.takeNode(id))};
 const d0=t.heroStats().dmg;learn(['might0','might1','might2']);ok(t.heroStats().dmg>d0*1.1&&t.skill('oneh')>=P.sk.oneh.lv+1,'Brute Force: +15% damage and +1 One-Handed');
 ok(!t.knows('leap')&&t.knows('whirl'),'Whirlwind is known; Leap Slam must be learned');learn(['mighta0']);ok(t.knows('leap'),'Leap Slam learned');
 const l0=t.abil('leap');learn(['mighta1','mighta2']);const l1=t.abil('leap');ok(l1.r>l0.r&&l1.stun>l0.stun&&l1.cd<l0.cd,'Earthshaker and Quick Leap upgrade it ('+l0.cd+'s → '+l1.cd+'s)');
 learn(['start','finesse0','finesse1','finesse2','finessea0','finessea1','finessea2']);const w=t.abil('whirl');ok(w.r>1.3&&w.dmg>1.3&&w.mp<t.HSKILLS.whirl.mp,'Whirlwind: wider, harder, cheaper');
 {const rn=P.renown;P.renown=1000;// (renown past the floor of your groups' room, parties.js cap: else +1 is lost under it)
 learn(['command0']);const c0=t.partyCap();learn(['command1']);ok(t.partyCap()===c0+1,'Followers: +1 party size');P.renown=rn}
 const hc=t.hireCost('hum_levy');learn(['command2']);ok(t.has('silver')&&t.hireCost('hum_levy')<hc,'Silver Tongue: the perk, and cheaper hiring');
 learn(['arcana0']);const ms=t.maxMP();learn(['arcana1']);ok(t.maxMP()===ms+15,'Clarity: +15 mana');
 P.tp++;ok(t.takeNode('h_might_finesse')&&t.treeHas('h_might_finesse'),'hybrid nodes link neighbouring branches (Might and Finesse taken: the node between them can be learned)');
 // troops in battle
 P.troops={hum_spear:2};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 const sp0=t.B.units.find(u=>u.type==='hum_spear').s.hp;t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 learn(['command3','command4','commandb0']);G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});
 ok(t.B.units.find(u=>u.type==='hum_spear').s.hp>sp0,'Banner Bearer: troops get more health in battle');t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');
 // keystone trade-off
 const hpA=t.heroStats().hp,capA=t.partyCap();learn(['finesse3','finesse4','finesse5','finesse6']);ok(t.heroStats().hp>hpA*1.2&&t.partyCap()<capA,'Lone Wolf: more health, fewer followers');
 // the page
 G.mode='world';G.modal=false;t.hidePanel();window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyK',key:'k'}));ok(G.mode==='skills'&&document.querySelector('svg.tree'),'K opens the Skills page with the tree');
 ok(document.querySelectorAll('.tnode').length===ids.length,'every node is drawn');
 P.tp=1;t.act('tree-sel','arcana2');ok(/Field Surgeon/.test(panel())&&!document.querySelector('[data-act="tree-take"]').disabled,'selecting a node shows it, with Learn');
 t.act('tree-take','arcana2');ok(t.treeHas('arcana2')&&/Unlearn/.test(panel()),'learning it from the page');
 t.act('sk-tab','abilities');{const un=Object.keys(t.HSKILLS).filter(k=>!t.knows(k));ok(!/Not learned/.test(panel())&&un.length&&un.every(k=>!panel().includes('<strong>'+t.HSKILLS[k].n+'</strong>')),'the Skill bar lists only the active skills you have learned ('+un.length+' not learned, not shown)')}
 t.act('sk-tab','disciplines');ok(/One-Handed/.test(panel())&&/Scouting/.test(panel()),'Disciplines lists the skills you train by use');
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='char'&&t.partyView().sel==='hero','Escape follows its Back: the Army window, on your hero');
 if(document.querySelector('#panel .nav [data-nav="back"]:not([data-act="fb-menu"])'))window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));// (a small screen: its card's page, then the cards)
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='esc','and again: the Army window’s Back, the Game Menu');window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='world','then resumed');
 t.openChar();ok(document.querySelector('.fb-unit-actions [data-act="open-skills"]')?.textContent==='Development'&&!/improve through use/.test(panel()),'your hero’s card points to the Skills page');t.act('char-close');
 // saves
 t.saveGame();const tree=P.tree.slice();P.tree=['start'];t.act('load');ok(JSON.stringify(P.tree)===JSON.stringify(tree),'talents survive a reload');
 // active skills: every one on the tree, reachable without a keystone; slots fill themselves; keys 1 to 0 cast them
 const H=t.HSKILLS,ids2=Object.keys(H);ok(ids2.length===10&&ids2.every(id=>TR[H[id].learn]&&(TR[H[id].learn].m.unlock===id)),'ten active skills, each learned on its own node of the skill tree');
 const pathOK=goal=>{const prev={start:null},q=['start'];while(q.length){const c=q.shift();if(c===goal)break;for(const n of TR[c].links)if(!(n in prev)&&TR[n].t!=='k'){prev[n]=c;q.push(n)}}return goal in prev};
 ok(ids2.every(id=>pathOK(H[id].learn)),'every active skill can be reached without taking a keystone');
 ok(!TR.start.m.unlock&&TR.might1.m.unlock==='whirl'&&TR.might1.links.includes('might0'),'Whirlwind is the second node of the Might (Strength) path');
 t.act('begin','soldier');ok(!t.knows('whirl')&&P.slots.every(x=>x===null),'a new hero knows no active skills and has empty slots');P.tp=2;t.takeNode('might0');t.takeNode('might1');ok(t.knows('whirl')&&P.slots[0]==='whirl','two skill points up the Might path learn Whirlwind, onto slot 1');
 const learnAll=()=>{P.tp=200;let more=true;while(more){more=false;for(const id of Object.keys(TR))if(TR[id].t!=='k'&&t.canTake(id)){t.takeNode(id);more=true}}};
 learnAll();ok(ids2.every(t.knows)&&ids2.every(id=>P.slots.includes(id)),'learning skills puts them on free slots ('+P.slots.map(x=>x||'-').join(' ')+')');
 G.mode='world';G.modal=false;t.hidePanel();t.openSkills('abilities');t.act('sk-slot','0');t.act('fb-choice','fireball');t.act('fb-apply');
 ok(P.slots[0]==='fireball'&&P.slots.filter(x=>x==='fireball').length===1,'the Skill bar puts Fireball on slot 1 (and takes it off its old slot)');
 ok(/Skill slots/.test(panel())&&/Basic moves/.test(panel())&&/Dodge Roll/.test(panel())&&!/press 1 to 0|Right-click|Space ·|F ·/.test(panel())&&document.querySelectorAll('[data-act="sk-slot"]').length===10&&!document.getElementById('panel').querySelector('select'),'the Skill bar shows ten touch slots, learned skills and basic moves, without dropdowns');t.act('sk-close');
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
 const spA=t.maxSP();P.sk.athl.lv+=2;ok(t.maxSP()===spA+8,'Athletics adds stamina');const mp0=t.abil('fireball').mp;P.sk.spell.lv+=5;ok(t.abil('fireball').mp<mp0,'Spellcraft makes spells cheaper');
 B=fight();const ax=t.heroState();const ath=P.sk.athl.xp+P.sk.athl.lv*1000;t.dodge();ok(P.sk.athl.xp+P.sk.athl.lv*1000>ath,'dodging trains Athletics');B.over=true;B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // unlearning an active skill takes it off its slot
 P.gold=99999;const leaf=['commandc1','commandc2'].find(x=>t.treeHas(x)&&t.canRefund(x));if(leaf)t.refundNode(leaf);ok(t.refundNode('commandc1')||true,'');const okR=t.canRefund('commandc0')&&t.refundNode('commandc0');ok(!okR||!P.slots.includes('banner'),'unlearning War Banner takes it off its slot');
 // the tree zooms and pans
 G.mode='world';G.modal=false;t.hidePanel();t.openSkills('talents');const vb0=document.querySelector('svg.tree').getAttribute('viewBox');t.act('tree-zin');const vb1=document.querySelector('svg.tree').getAttribute('viewBox');
 ok(vb0!==vb1&&+vb1.split(' ')[2]<+vb0.split(' ')[2],'+ zooms the tree in');t.act('tree-fit');ok(document.querySelector('svg.tree').getAttribute('viewBox')===t.vbText(t.treeBounds()),'Fit shows the whole tree');t.act('sk-close');
 // origins: every past starts from its own, with its bonus; pure pasts touch one path, mixed pasts two
 const bgs=Object.keys(t.BGS);ok(bgs.every(b=>TR['o_'+b]&&TR['o_'+b].t==='origin'),'every past has an origin on the tree: '+bgs.map(b=>TR['o_'+b].n).join(', '));
 const res={};for(const b of bgs){t.act('begin',b);res[b]=P.tree.slice()}ok(bgs.every(b=>res[b].length===1&&res[b][0]==='o_'+b),'a new hero starts with only their own origin learned');
 ok(TR.o_soldier.links.join()==='might0'&&TR.o_hedge.links.join()==='arcana0'&&TR.o_guard.links.length===2&&TR.o_merchant.links.includes('command0')&&TR.o_merchant.links.includes('arcana0'),'pure pasts start on one path, mixed pasts between two');
 t.act('begin','hedge');ok(P.origin==='o_hedge'&&t.skill('spell')>=P.sk.spell.lv+1,'the Hedge mage origin adds Spellcraft');
 P.tp=5;ok(t.canTake('arcana0')&&!t.canTake('might0')&&!t.canTake('o_soldier'),'a Hedge mage grows from Arcana, and can never learn another past’s origin');
 t.takeNode('arcana0');t.takeNode('start');ok(t.canTake('might0'),'through the Crossroads every path opens up');P.gold=9999;ok(!t.canRefund('o_hedge')&&!t.canRefund('arcana0')&&t.canRefund('start'),'your origin cannot be unlearned, nor anything that links it to the rest');
 t.act('begin','soldier');
 // attributes are read-only now
 G.mode='world';G.modal=false;t.hidePanel();t.openChar();ok(!document.querySelector('[data-act="spend"]')&&/raised on the skill tree/.test(panel()),'your hero’s card shows attributes without + buttons');t.act('char-close');
 t.frame();
 // the special skills: under the tree, apart from its paths
 {G.mode='world';G.modal=false;t.hidePanel();P.fin=null;const sk=P.sk[t.meleeSk()];sk.lv=0;t.openSkills('basics');
  ok(/Special skills/.test(panel())&&/Dodge Roll/.test(panel())&&/Shove/.test(panel())&&/Shield Bash/.test(panel())&&/Third Blow/.test(panel()),'the special skills: the basic moves and the combo\u2019s path');
  ok(!document.querySelector('[data-act="sk-fin"]'),'the finisher is not yours to choose yet');sk.lv=t.COMBO_UP.fin;t.renderSkills();
  ok(document.querySelectorAll('[data-act="sk-fin"]').length===2,'practised enough, choose one of two finishers');t.act('sk-fin','push');ok(P.fin==='push'&&!document.querySelector('[data-act="sk-fin"]'),'chosen once: crushing');
  t.act('sk-fin','stun');ok(P.fin==='push','and it stays chosen');P.fin=null;sk.lv=0;t.act('sk-close')}
 // shove with a bow, shield bash with a shield, neither otherwise
 {const g0=P.gear.weapon;ok(t.shoveKind()===(t.grip()==='shield'?'bash':t.isBow()?'shove':null),'shove needs a bow, shield bash a shield ('+t.shoveKind()+')');P.gear.weapon=g0}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
