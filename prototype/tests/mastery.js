'use strict';
// Proficiency and mastery (core/ranks.js rankProf, masteryOf, masteryPick; battle/rankskills.js rankUnit, rankUp; data/ranks.js
// RANKS.prof, RANKS.mastery; the owner, 2026-10-30: "each rank should also increase unit proficiency a bit", "1% per rank"; "the
// bronze, silver, gold badge means mastery: once your xp is at max and you do not or cannot upgrade, you gain mastery xp"; each
// mastery "may select which skill to improve"; upgraded, "reset, but converted to exp for the new unit").
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,R=t.RANKS,M=R.mastery;Kit.begin('soldier',1);Kit.clear();Kit.world({encCool:0});P.sk.lead.lv=10;const r=t.partyRoster(P);P.troops={};
 const grp=(k,n)=>{r.add(k,n,'new');return r.groups.filter(x=>x.type===k).pop()},full=k=>R.xp[t.ST[k].tier].reduce((a,b)=>a+b,0);
 // ======== mastery: the last rank's experience
 const sp=grp('hum_spear',5);t.rankGain(sp,full('hum_spear'));ok(t.rankOf(sp)===R.max&&t.masteryOf(sp)===0&&t.masteryXp(sp)===0,'rank '+R.max+', no mastery yet: a steel badge');
 t.rankGain(sp,M.xp[0]-1);ok(t.masteryOf(sp)===0&&t.masteryNeed(sp)===1,'its experience now mastery\'s: one short of bronze');
 t.rankGain(sp,1);ok(t.masteryOf(sp)===1&&/Bronze mastery/.test(t.groupBadge(sp,14))&&t.masteryPending(sp)===1,'bronze: its badge bronze, an improvement to pick');
 t.rankGain(sp,M.xp[1]+M.xp[2]+999);ok(t.masteryOf(sp)===3&&/Gold mastery/.test(t.groupBadge(sp,14))&&t.masteryPending(sp)===3,'on to gold, and no further: three improvements to pick');
 // ======== the picks
 Kit.world();t.openChar();t.act('party-select',sp.id);t.act('party-path',sp.id);
 {const btns=[...document.querySelectorAll('[data-act="party-master"]')].map(b=>b.dataset.arg.split(':')[1]);ok(btns.join()==='brace,reach,rally,drill','its choices: its reached skills that improve (Brace, Long reach, Rally) and a drill ('+btns.join(', ')+')')}
 t.act('party-master',sp.id+':reach');t.act('party-master',sp.id+':brace');t.act('party-master',sp.id+':hedge');t.act('party-master',sp.id+':drill');
 ok((sp.picks||[]).join()==='reach,brace,drill'&&t.masteryPending(sp)===0,'three picked (Long reach, Brace, a drill); the Hedge of spears (it does not improve) refused');t.act('char-close');
 // ======== proficiency, and the picks, in battle
 const sp1=grp('hum_spear',5),bw=grp('hum_bow',5);t.rankGain(bw,R.xp[1][0]+R.xp[1][1]);ok(t.rankOf(bw)===3&&Math.abs(t.rankProf(bw)-2*R.prof)<1e-9&&Math.abs(t.rankProf(sp)-5*R.prof)<1e-9,'proficiency: '+R.prof*100+'% a rank above the first (rank 3: 2%), and a drill one more (the spearmen: 5%)');
 {Kit.world({encCool:0});const foe=t.asParty({kind:'bandits',troops:['militia','militia'],x:P.x+30,y:P.y,cool:0});t.bandits.length=0;t.bandits.push(foe);
  G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};t.startBattle({enemies:G.enc.list,tournament:false});Kit.engage();const b=t.B;t.updateBattle(.01);
  const bg=g=>Object.values(b.groups).find(x=>x.sourceGroupId===g.id),u=g=>b.units.find(x=>x.grp===bg(g).id);
  const s=u(sp),s1=u(sp1),w=u(bw),P5=5*R.prof;ok(Math.abs(s.s.dmg/s1.s.dmg-(1+P5))<1e-9&&Math.abs(s.max/s1.max-(1+P5))<.02&&s.hp===s.max,'their damage and health by their proficiency ('+P5*100+'% over a rank-1 group\'s)');
  ok(Math.abs(t.rankAim(w)/(t.RANK_SKILLS.bow[2].aim*(1-2*R.prof))-1)<1e-9,'and their aim (Steady aim, and 2% truer)');
  const ai=b.units.find(x=>x.team===1&&!x.leader);{const rec=t.battleRec(b.groups[ai.grp]);ok(Math.abs((ai.prof||0)-t.rankProf(rec))<1e-9,'an AI army\'s, by its own group\'s rank (rank '+t.rankOf(rec)+': '+Math.round(t.rankProf(rec)*100)+'%)')}
  ok(Math.abs(t.rankDur(bg(sp),'brace')-(t.UNIT_ABILITIES.brace.dur+t.RANK_SKILLS.spear[1].up.dur))<1e-9,'Brace improved: '+t.rankDur(bg(sp),'brace')+' s (from '+t.UNIT_ABILITIES.brace.dur+')');
  const k=t.RANK_SKILLS.spear[2];ok(Math.abs(s.s.reach/s1.s.reach-(k.reach+k.up.reach))<1e-9,'Long reach improved: +'+Math.round((k.reach+k.up.reach-1)*100)+'%');
  for(const x of b.units)if(x.team===1)x.hp=0;t.checkBattleOver();b.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();t.act('cont');t.hidePanel()}
 // ======== upgraded: rank 1, half its mastery its new kind's experience
 {const ft=grp('hum_foot',4);t.rankGain(ft,full('hum_foot')+M.xp[0]);ok(t.masteryOf(ft)===1,'(a bronze footmen group)');const to=t.UP.hum_foot[0],x=t.masteryXp(ft)*M.carry;
  ok(t.recruitment.trainGroup(null,ft.id,to).ok,'it upgrades');const up=r.groups.find(g=>g.id===ft.id),ref={type:to};t.rankGain(ref,x);
  ok(up.type===to&&t.rankOf(up)===t.rankOf(ref)&&t.rankXp(up)===t.rankXp(ref)&&!t.masteryOf(up)&&!(up.picks||[]).length,'into '+t.ST[to].n+': its mastery gone, '+M.carry*100+'% of its experience ('+x+') its new ranks (rank '+t.rankOf(up)+')')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
