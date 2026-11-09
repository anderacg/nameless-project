'use strict';
// Proficiency (doc/PROFICIENCY_DESIGN.md): 0 to 99 by use, its power, your level from them, a tree point a level, rewards as
// practice, repeats, the past's free start, the combo's Tree nodes, companions, lords, the skill page and old saves refused.

window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,PROF=t.PROF;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;const H=t.leaderOf(P);
 // where you start: level 0, every proficiency 0 but your past's, free (15 at most: PROF.pastPer a point, rounded)
 ok(P.level===0&&t.talentsOf(P).points().left===0,'a new hero is level 0 with no skill point waiting (level '+P.level+')');
 ok(P.sk.oneh.lv===Math.round(2*PROF.pastPer)&&P.sk.oneh.lv===15&&P.sk.lead.lv===Math.round(PROF.pastPer)&&P.sk.trade.lv===0,'a veteran starts at One-Handed '+P.sk.oneh.lv+' and Leadership '+P.sk.lead.lv+', the rest at 0');
 // power (the owner, 2026-11-08: "nerf the buff from proficiency"): .06 a level to 100, then slower (profPow)
 ok(Math.abs(t.profPow(100)-6)<1e-9&&Math.abs(t.profPow(50)-3)<1e-9&&t.profPow(500)>9.9&&t.profPow(500)<10.1&&t.profPow(1000)<12,'power: 3 at 50, 6 at 100, '+t.profPow(500).toFixed(1)+' at 500, '+t.profPow(1000).toFixed(1)+' at 1000 (was a level ÷ 9.9: 10 at 99)');
 P.sk.archery={lv:100,xp:0};ok(Math.abs(t.skill('archery')-6)<1e-9,'Archery 100 is a power of 6');P.sk.archery={lv:0,xp:0};
 // the curve: 0 to 99 the same practice as before
 let sum=0;for(let l=0;l<99;l++)sum+=t.SK_XP(l);ok(sum>2600&&sum<2900,'0 to 99 takes '+Math.round(sum)+' practice');
 // no top (the owner, 2026-11-08: "no cap on max how you can gain proficiency"); the effects made for the old top read it as 99
 // (skillSafe), the rest grow on
 P.sk.med={lv:98,xp:0};H.train('med',999,true);const past=P.sk.med.lv;P.sk.med={lv:20000,xp:0};H.train('med',1e5,true);
 ok(PROF.max===Infinity&&past>99&&P.sk.med.lv>20000,'a proficiency rises past 99 ('+past+' from 98 with 999 practice), and past 20000: no top');
 {const was=P.sk.trade;P.sk.trade={lv:5000,xp:0};const buy=t.spreadBuy(),sell=t.spreadSell(),sh=(P.sk.surv=P.sk.surv||{lv:0,xp:0},P.sk.surv.lv=5000,t.survivalShare());P.sk.surv.lv=0;P.sk.trade=was;P.sk.archery={lv:5000,xp:0};const pw=t.skill('archery');P.sk.archery={lv:0,xp:0};
  ok(buy>0&&sell>0&&sh>0&&pw>15,'at 5000 the effects made for the old top read it as 99: prices as at 99 ('+buy.toFixed(3)+', '+sell.toFixed(3)+'), Survival still needs food ('+sh.toFixed(2)+'), power grows on ('+pw.toFixed(1)+')')}
 // (the characters made never start past the old top)
 ok(t.SK_MADE===99&&Math.min(t.SK_MADE,30*t.PROF.per)===99,'a lord, chieftain, companion or past starts at no more than 99 (SK_MADE)');P.sk.med={lv:0,xp:0};P.level=0;P.xp=0;// (as new again)
 // your level, Skyrim's way (the owner, 2026-11-08): experience from deeds and from each level a proficiency reaches; a skill point a level
 {const need=[0,1,2,3].map(l=>H.xpNeed.call({aiOwned:false,lv:l}));ok(need.join()===[0,1,2,3].map(l=>t.LEVEL.base+t.LEVEL.per*l).join(),'each level takes more: '+need.join(', ')+' XP')}
 P.level=0;P.xp=0;H.addXp(t.LEVEL.base-1);ok(P.level===0,'one short: still level 0');H.addXp(1);ok(P.level===1&&P.xp===0&&t.talentsOf(P).points().left===t.LEVEL.pts,'then level 1 and a skill point');
 P.level=0;P.xp=0;P.sk.tact={lv:0,xp:0};H.train('tact',t.SK_XP(0)+t.SK_XP(1),true);ok(P.sk.tact.lv===2&&Math.abs(P.xp-t.LEVEL.prof*(1+2))<1e-9,'Tactics to 2: experience of its new levels (1 + 2 = '+P.xp+')');
 P.level=0;P.xp=0;P.sk.tact={lv:0,xp:0};const sk0=JSON.stringify(P.sk.oneh);t.gainXp(40,'battle');ok(P.xp>=40&&JSON.stringify(P.sk.oneh)!==sk0,'a battle: its experience, and practice for your weapon ('+Math.round(P.xp)+' XP)');P.level=0;P.xp=0;
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
 // the combo's upgrades in the weapons' trees (One-Handed: Third Blow at 15, the finishers at 60)
 P.tree=[P.origin];P.sk.oneh.lv=20;ok(t.heroCombo().length===2,'the combo is two blows to begin with');
 ok(t.canTakeOf(P,'oneh_third')&&!t.canTakeOf(P,'oneh_push'),'Third Blow at One-Handed 15, the finishers not before 60');
 t.takeNode('oneh_third');ok(t.heroCombo().length===3,'Third Blow: a third blow');
 P.level=30;P.sk.oneh.lv=60;t.talentsOf(P).pathTo('oneh_push').forEach(id=>t.takeNode(id));ok(t.heroFin()==='push','Crushing Finisher: its style');t.takeNode('oneh_stun');ok(t.heroFin()==='push','with both, the first learned rules');
 P.tree=[P.origin];P.sk.twoh.lv=60;t.takeNode('twoh_tough');t.talentsOf(P).pathTo('twoh_stun').forEach(id=>t.takeNode(id));ok(t.heroCombo().length===3&&t.heroFin()==='stun','a finisher without a Third Blow (Two-Handed 60) brings its third blow');P.tree=[P.origin];
 // companions level the same way
 delete P.comps.brann;t.compJoin('brann');const C=t.compOf('brann');
 if(C){ok(C.lv===0&&Object.values(C.sk).every(s=>s.lv===0),'a companion starts at level 0, every proficiency at 0 ('+C.lv+')');
  t.compXp('brann',1000,'battle');ok(C.lv>0,'a companion levels by their proficiencies (level '+C.lv+')')}
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
