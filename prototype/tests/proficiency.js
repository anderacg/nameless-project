'use strict';
// Proficiency (doc/PROFICIENCY_DESIGN.md): 0 to 99 by use, its power, your level from them, a tree point a level, rewards as
// practice, repeats, the past's free start, the combo's Tree nodes, companions, lords, the skill page and old saves refused.

window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,PROF=t.PROF;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;const H=t.leaderOf(P);
 // where you start: level 0, every proficiency 0 but your past's, free
 ok(P.level===0&&P.tp===0,'a new hero is level 0 with no tree points (level '+P.level+', '+P.tp+')');
 ok(P.sk.oneh.lv===2*PROF.pastPer&&P.sk.lead.lv===PROF.pastPer&&P.sk.trade.lv===0,'a veteran starts at One-Handed '+P.sk.oneh.lv+' and Leadership '+P.sk.lead.lv+', the rest at 0');
 ok(H.profProgress()===0,'and the past’s start does not count toward the level');
 // power: level / PROF.per, 99 the old 10
 P.sk.archery={lv:PROF.max,xp:0};ok(Math.abs(t.skill('archery')-10)<1e-9,'Archery 99 is a power of 10 (as the old top)');
 P.sk.archery={lv:0,xp:0};
 // the curve: 0 to 99 takes about the old 0 to 10's practice
 let sum=0;for(let l=0;l<PROF.max;l++)sum+=t.SK_XP(l);ok(sum>1000&&sum<1200,'0 to 99 takes '+Math.round(sum)+' practice (0 to 10 took 1100)');
 // practice raises it to 99 and no further
 P.sk.med={lv:98,xp:0};H.train('med',999,true);ok(P.sk.med.lv===PROF.max&&P.sk.med.xp===0,'a proficiency stops at 99');P.sk.med={lv:0,xp:0};
 // level from progress, a tree point a level
 const lv0=P.level,tp0=P.tp;H.train('tact',300,true);
 ok(P.level>lv0&&P.tp-tp0===P.level-lv0,'practising Tactics raises the level, a tree point each (level '+P.level+', +'+(P.tp-tp0)+' points)');
 ok(P.level===t.PROF_LEVEL(H.profProgress()),'the level is the one its progress reaches');
 // weights: the easy ones count less
 const a=H.profProgress();P.sk.scout={lv:10,xp:0};const b=H.profProgress()-a;P.sk.scout={lv:0,xp:0};P.sk.eng={lv:10,xp:0};const c=H.profProgress()-a;P.sk.eng={lv:0,xp:0};
 ok(Math.abs(b-c*PROF.weight.scout)<1e-6,'Scouting counts '+Math.round(PROF.weight.scout*100)+'% of Engineering toward the level');
 // repeats: the same practice over and over within an hour gives less
 P.sk.trade={lv:0,xp:0};for(let i=0;i<3*PROF.burst;i++)H.train('trade',1);const damp=P.sk.trade.lv*1000+P.sk.trade.xp;
 P.sk.trade={lv:0,xp:0};for(let i=0;i<3*PROF.burst;i++)H.train('trade',1,true);const whole=P.sk.trade.lv*1000+P.sk.trade.xp;
 ok(damp<whole,'trading again and again in one hour gives less practice than it would whole');P.sk.trade={lv:0,xp:0};
 // rewards are practice: a battle trains the weapon, Leadership and Tactics
 const w=H.weaponProf(),before={w:P.sk[w].lv+P.sk[w].xp/1e3,lead:P.sk.lead.lv+P.sk.lead.xp/1e3,tact:P.sk.tact.lv+P.sk.tact.xp/1e3},xp0=P.xp,L0=P.level;
 t.gainXp(80,'battle');
 ok(P.sk[w].lv+P.sk[w].xp/1e3>before.w&&P.sk.lead.lv+P.sk.lead.xp/1e3>before.lead&&P.sk.tact.lv+P.sk.tact.xp/1e3>before.tact,'a battle’s reward trains '+t.SKILLS[w].n+', Leadership and Tactics');
 ok(P.level>L0||P.xp>xp0,'and fills the level bar');
 {const s0=P.sk.pers.lv+P.sk.pers.xp/1e3;t.gainXp(40,'talk');ok(P.sk.pers.lv+P.sk.pers.xp/1e3>s0,'a talk trains Persuasion');}
 ok(t.QUEST_TRAIN.CourierQuest==='trade'&&t.QUEST_TRAIN.MissingQuest==='search','quests train by kind (deliveries Trade, the missing Scouting)');
 // the combo's upgrades on the Tree
 P.tree=[P.origin];P.tp=10;ok(t.heroCombo().length===2,'the combo is two blows to begin with');
 for(const id of ['might0','might1','might2'])if(!P.tree.includes(id))P.tree.push(id);
 ok(t.canTakeOf(P,'third')&&!t.canTakeOf(P,'fin_stun'),'Third Blow is on the Tree after Brute Force, the finishers after it');
 t.takeNode('third');ok(t.heroCombo().length===3,'Third Blow: a third blow');
 t.takeNode('fin_push');ok(t.heroFin()==='push'&&!t.canTakeOf(P,'fin_stun'),'Crushing Finisher taken shuts Stunning Finisher');
 // companions level the same way
 delete P.comps.brann;t.compJoin('brann');const C=t.compOf('brann');
 if(C){ok(C.lv===0&&Object.values(C.sk).every(s=>s.lv===0),'a companion starts at level 0, every proficiency at 0 ('+C.lv+')');
  t.compXp('brann',400,'battle');ok(C.lv>0&&C.o.tp>=C.lv,'a companion levels by their proficiencies, a tree point each (level '+C.lv+')')}
 else ok(false,'a companion to test');
 // lords grow their own way
 const l=t.W.lords.find(x=>!x.dead);if(l)t.lordStats(l);
 ok(!!l&&Math.abs(l.sk.lead.lv/PROF.per-Math.floor(l.lv/2))<=1.001,'a lord’s Leadership follows his level ('+(l?l.lv+' → '+l.sk.lead.lv:'none')+')');
 // the skill page: Proficiency, Tree, Trait, Skill bar
 G.mode='world';G.modal=false;t.hidePanel();t.openChar();t.openSkills();
 const tabs=[...document.querySelectorAll('[data-act="sk-tab"]')].map(e=>e.dataset.arg).join(',');
 ok(tabs==='prof,talents,traits,abilities'&&G.skTab==='prof','the tabs: Proficiency, Tree, Trait, Skill bar, opening on Proficiency ('+tabs+')');
 const html=()=>document.getElementById('panel').innerHTML;
 ok(/Level \d+/.test(html())&&/to level/.test(html())&&/One-Handed/.test(html()),'Proficiency shows the level bar and the proficiencies');
 t.act('sk-tab','traits');ok(/Dodge Roll/.test(html())&&/Veteran soldier/.test(html())&&/Human/.test(html()),'Trait shows the moves, your people and your past');
 ok(!/[Dd]iscipline/.test(html()),'no "discipline" on the page');t.act('sk-close');
 // old saves refused
 ok(t.SAVE_V===4,'saves are version 4');
 localStorage.setItem(t.slotKey('quick'),JSON.stringify({v:3,at:1,P:{army:{}},world:{v:3,map:{}}}));ok(!t.readSlot('quick')&&t.oldSlot('quick'),'a save from before is refused');
 localStorage.removeItem(t.slotKey('quick'));
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
