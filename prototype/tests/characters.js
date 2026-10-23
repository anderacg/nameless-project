'use strict';
// Units: everyone who fights is a Unit: a Troop (one per kind, shared by all its soldiers) or a Character (one person: your hero,
// a companion, a lord, a chieftain, by role). Battles make every soldier from its Unit, with the numbers they always had.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,ST=t.ST;try{localStorage.clear()}catch(e){}t.act('begin','soldier');G.quietEvents=true;
 const same=(a,b)=>['hp','dmg','spd','reach','range','cd'].every(k=>Math.abs((a[k]||0)-(b[k]||0))<1e-9);
 // the kinds
 {const a=t.troopOf('hum_spear'),b=t.troopOf('hum_spear');ok(a===b&&a instanceof t.Troop&&a instanceof t.Unit&&!a.isChar,'a Troop is one object for every soldier of its kind');
  ok(a.key==='hum_spear'&&a.name==='Man-at-Arms'&&a.race==='human'&&a.stats()===ST.hum_spear&&a.tags.includes('spear')&&a.abilities().includes('brace'),'its key, name, race, numbers (its data), tags and abilities')}
 P.comps={brann:{ap:0,role:''}};const c=t.compInit('brann'),L=W.lords[0],ch=t.newChief('bandits',4);
 const H=t.charOf(P),C=t.charOf(c,'brann'),Lc=t.charOf(L),Cc=t.charOf(ch);
 ok([H,C,Lc,Cc].every(x=>x instanceof t.Character&&x instanceof t.Unit&&x.isChar)&&[H,C,Lc,Cc].map(x=>x.role).join()==='hero,companion,lord,chieftain','your hero, a companion, a lord and a chieftain: each a Character, in its role');
 ok(t.charOf(P)===H&&t.leaderOf(L)===Lc,'one Character per person (and leaderOf is the same)');
 ok(H.key==='hero'&&C.key==='brann'&&Lc.key===t.lordUnit(L)&&Cc.key==='chief','each fights as its own kind ('+[H,C,Lc,Cc].map(x=>x.key).join(', ')+')');
 ok(H.name==='you'&&C.name==='Brann'&&Lc.name===L.name&&Cc.name===ch.name,'and has its name');
 // the numbers: the same as before the Units (each kind's own way, for now)
 const env=t.battleEnv(false);
 ok(same(H.fieldStats(env,0,1),t.envStats(t.heroStats(),P.race,env)),'your hero’s numbers: from your level, attributes and gear, on the ground');
 ok(same(C.fieldStats(env,0,1),t.envStats(t.compStats('brann'),ST.brann.race,env)),'a companion’s: from its level and gear');
 {const b=t.envStats(Lc.base(),Lc.race,env),lv=3,sc={...b,hp:Math.round(b.hp*(1+.2*(lv-1))),dmg:b.dmg*(1+.12*(lv-1))};
  ok(same(Lc.fieldStats(env,1,lv),sc)&&same(Lc.base(),t.charStats(Lc)),'a lord\u2019s: his own (charStats), on the ground, at the encounter\u2019s level')}
 ok(same(Cc.stats(),t.charStats(Cc))&&Cc.stats().hp>ST.chief.hp,'a chieftain\u2019s: his own, tougher than a plain chief');
 {const k='orc_grunt',b=t.envStats(ST[k],'orc',env);ok(same(t.troopOf(k).fieldStats(env,1,2),{...b,hp:Math.round(b.hp*1.2),dmg:b.dmg*1.12}),'a troop’s: its kind’s, at the encounter’s level')}
 // a battle: every soldier from its Unit
 {P.troops={hum_spear:3,hum_bow:2};G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia']};t.startBattle({enemies:['militia','militia'],tournament:false});const B=t.B;
  ok(B.units.every(u=>u.unit instanceof t.Unit&&u.unit.key===u.type),'in battle, every soldier links to its Unit, and fights as its kind');
  ok(B.hero.unit===H&&B.units.find(u=>u.comp).unit===C,'your hero and your companion: their Characters');
  const sp=B.units.filter(u=>u.type==='hum_spear');ok(sp.length===3&&sp.every(u=>u.unit===t.troopOf('hum_spear')),'three spearmen: one Troop');
  B.over=true;B.endT=0;t.B=null}
 // abilities: one list for every unit; traits by what a unit is, actives cast the same way by every caster
 {const A=t.ABILITIES,act=Object.keys(A).filter(k=>A[k].kind==='active');ok(act.length===10&&act.every(k=>t.HSKILLS[k]===A[k]),'ten actives, the same ones your hero learns (HSKILLS is their view)');
  ok(t.traitsOf(ST.hum_knight).join()==='charge,heavy,wedge'&&t.traitsOf(ST.troll).includes('regen')&&t.traitsOf(ST.troll).includes('huge'),'traits: a knight\u2019s by its kind, a troll\u2019s by what it is ('+t.traitsOf(ST.troll).join(', ')+')');
  ok(t.troopOf('hum_spear').actives().length===0&&t.troopOf('hum_spear').traits().includes('brace'),'troops: their traits, no actives (yet)');
  ok((()=>{try{t.CHAMP_SK;return false}catch(e){return true}})(),'(the champions\u2019 own list is gone)');
  P.slots=['whirl','heal',...Array(8).fill(null)];P.tree=['start','might0','might1'];ok(H.actives().join()==='whirl','your hero: the learned skills in her slots (Healing is slotted but not learned)');
  c.lv=1;ok(C.actives().join()==='whirl','a companion at level 1 has grown its tree as a warrior: Whirlwind ('+c.tree.join(', ')+')');ok(Lc.actives().length>0&&Lc.actives().every(k=>t.knowsOf(L,k)&&L.slots.includes(k)),'a lord: the skills his tree has given him, in his slots ('+Lc.actives().join(', ')+')');}
 // one cast, one chooser, for a champion as for your hero
 {P.troops={hum_spear:2};P.comps={brann:{ap:0,role:''}};const cc=t.compInit('brann');cc.lv=7;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia','militia','militia']};t.startBattle({enemies:['militia','militia','militia'],tournament:false});const B=t.B;
  const u=B.units.find(x=>x.comp),fs=B.units.filter(x=>x.team===1);fs.forEach((e,i)=>{e.x=u.x+12;e.y=u.y+(i-1)*7;e.cd=99;e.hp=e.max=9999;e.s={...e.s,spd:0};e.grp=null});B.hero.x=10;B.hero.y=10;
  const C2=t.champ(u);C2.sp=C2.mp=999;C2.cds={};ok(t.castAbility(u,'quake')&&fs.every(e=>e.hp<9999&&e.stun>0)&&C2.cds.quake===t.ABILITIES.quake.cd,'a companion casts Earthquake as your hero would: every foe around hurt and staggered, then its cooldown');
  ok(!t.castAbility(u,'quake'),'not again until it cools down');
  C2.cds={};const far=fs[0];fs.forEach(e=>{e.x=u.x+70;e.y=u.y+(e===far?0:5)});t.castAbility(u,'leap',{x:far.x,y:far.y});ok(C2.leap,'Leap Slam: away');for(let k=0;k<20&&C2.leap;k++)t.charThink(u,.03);
  ok(!C2.leap&&Math.hypot(u.x-far.x,u.y-far.y)<20&&fs.some(e=>e.stun>0),'and lands among them, stunning');
  const o=u.unit.o;o.tree.push('arcana0','arcana1','arcana2','arcanad0');o.slots[9]='heal';u.hp=u.max*.3;C2.cds={};C2.mp=999;const h0=u.hp;ok(t.chooseAbility(u)&&u.hp>h0&&C2.cds.heal>0,'badly hurt (Healing learned and slotted), the chooser picks Healing first');
  B.over=true;B.endT=0;t.B=null}
 // the kit: every character but your hero has its own skill tree, fighting skills and gear; one formula for them all
 {const L2=W.lords.find(l=>l!==L)||L;for(const k of ['kit','tree','tp','slots','attr','gear','gearT'])delete L2[k];L2.lv=7;L2.sk={lead:{lv:1,xp:0}};const c2=new t.Lord(L2);t.charKit(c2);
  ok(L2.tree.length===9&&L2.tp===0&&t.CLASS_PATHS[c2.cls()],'a lord at 7 has grown his tree himself: 8 points along a '+c2.cls()+'\u2019s path ('+L2.tree.slice(1).join(', ')+')');
  ok(c2.actives().length>0&&Object.values(L2.attr).reduce((a,b)=>a+b,0)>0,'its skills in his slots ('+c2.actives().join(', ')+'), its attributes from the tree ('+JSON.stringify(L2.attr)+')');
  ok(L2.gear.weapon===t.gearId(t.OUTFIT[c2.race][0],2)&&L2.gear.body===t.gearId('mail',2)&&L2.gear.head===t.gearId('helm',2),'and wears gear of his level (tier 2: '+[L2.gear.weapon,L2.gear.body,L2.gear.head].join(', ')+')');
  ok(t.FIGHT_SK.every(k=>L2.sk[k]&&L2.sk[k].lv===2),'and fights with the skills of his level (One-Handed, Two-Handed, Archery 2)');
  L2.xp=0;const lv0=L2.lv,n0=L2.tree.length;c2.gainXp(t.LV_XP(L2.lv)+t.LV_XP(L2.lv+1));ok(L2.lv===lv0+2&&L2.tree.length===n0+2&&L2.tp===0&&L2.gearT===3,'two levels on: two more nodes he chose, and better gear (tier '+L2.gearT+')')}
 ok(['warrior','guardian','rider','archer','caster'].every(k=>t.CLASS_PATHS[k].every(n=>t.TREE[n])),'every class\u2019s path is made of real nodes');
 {P.comps={tavi:{ap:0,role:''},elske:{ap:0,role:''}};ok(t.charOf(t.compInit('tavi'),'tavi').cls()==='archer'&&t.charOf(t.compInit('elske'),'elske').cls()==='caster','Tavi grows as an archer, Elske as a caster')}
 {P.comps={brann:{ap:0,role:''}};const cb=t.compInit('brann');cb.lv=1;cb.xp=0;const cc=t.charOf(cb,'brann');t.charKit(cc);
  ok(same(t.compStats('brann'),t.charStats(cc)),'a companion\u2019s numbers are the same formula');
  const n0=cb.tree.length;cc.gainXp(60);ok(cb.lv===2&&cb.tp===1&&cb.tree.length===n0,'with you, a level brings a point for you to spend (it does not choose for itself)');
  const h1=t.charStats(cc).hp,nd=t.TREE.might2?['might2','might3','finesse0'].find(id=>t.canTakeOf(cb,id)):null;const st0=cb.attr.str;ok(nd&&t.takeNodeOf(cb,nd,true)&&cb.tp===0,'you spend it on its tree ('+nd+')');
  cb.tp=1;const hb=t.charStats(cc).hp;cb.tree.push('mightb0');const ha=t.charStats(cc).hp;cb.tree.pop();ok(ha>hb,'and what its tree gives shows in its numbers (Thick Skin: '+hb+' \u2192 '+ha+' health)')}
 // the window: a companion's card, its tree to grow (the Skills page, for it), its slots
 {P.comps={brann:{ap:0,role:''}};const cb=t.compInit('brann');cb.lv=3;cb.xp=0;G.mode='world';G.modal=false;t.hidePanel();t.openComp('brann');const pn=()=>document.getElementById('panel');
  ok((card=>card&&card.querySelectorAll('.uc-stat').length&&/Skills/.test(card.innerHTML)&&/Whirlwind/.test(card.innerHTML))(pn().querySelector('.fb-comp-detail .fb-details .ucard-x')),'a companion\u2019s window shows its card: its numbers, abilities and its skills');
  const P0=P.tree.slice(),T0=P.tp;cb.tp=2;t.renderComp();t.act('party-comp-tab','skills');ok(/· 2 points/.test(pn().querySelector('.fb-head').textContent)&&/Skill points<\/span><strong>2<\/strong>/.test(pn().querySelector('.fb-skills-summary').innerHTML)&&pn().querySelector('.fb-skills-summary [data-act="cm-tree"]'),'its skill points, and its tree to open');
  t.act('cm-tree');ok(G.mode==='skills'&&G.skWho==='brann'&&/Brann’s skills/.test(pn().innerHTML)&&/Back to Brann/.test(pn().innerHTML)&&!/Special skills/.test(pn().innerHTML),'the Skills page opens on Brann\u2019s own tree');
  const nd=Object.keys(t.TREE).find(id=>t.canTakeOf(cb,id));t.act('tree-take',nd);ok(cb.tree.includes(nd)&&cb.tp===1&&P.tree.join()===P0.join()&&P.tp===T0,'learning there grows Brann\u2019s tree, not yours ('+nd+')');
  t.act('sk-tab','abilities');const PS=JSON.stringify(P.slots);t.act('slot-set','4:whirl');ok(cb.slots[4]==='whirl'&&JSON.stringify(P.slots)===PS,'its skill bar sets its own slots');
  t.act('sk-close');ok(G.mode==='comp'&&/Brann the Wolf/.test(pn().innerHTML),'and Back returns to its window');
  t.act('cm-back');t.hidePanel();G.mode='world';t.openSkills('talents');ok(!G.skWho&&/<h2>Skills<\/h2>/.test(pn().innerHTML),'your own Skills page is still yours');t.act('sk-close')}
 // recruiting: a chieftain right away (if your honor allows); a lord when his realm has fallen or he is disgraced
 {G.mode='world';G.modal=false;t.hidePanel();P.comps={};P.troops={};P.captives=[];P.fac=null;P.gold=0;const ch2=t.newChief('bandits',5);t.captureChief(ch2);const C0=t.charOf(ch2);t.charKit(C0);
  const lv=ch2.lv,tree=ch2.tree.slice(),h0=t.charStats(C0).hp;
  P.fac=t.FIDS[0];P.honor[P.fac]=2;ok(/will not stand/.test(t.recruitWhy(P.captives[0])),'a realm you serve will not stand for an outlaw in your band (honor 2)');
  P.fac=null;const hon=t.FIDS.map(f=>t.honorWith(f));ok(t.recruitWhy(P.captives[0])===''&&t.recruitCaptive(0),'free of any realm, the chieftain may join you');
  const id=Object.keys(P.comps)[0],c3=P.comps[id];ok(id&&t.COMPS[id].n===ch2.name&&P.captives.length===0,'he is a companion now: '+t.COMPS[id].n);
  ok(t.FIDS.every((f,k)=>t.W.dead[f]||t.honorWith(f)===hon[k]-t.RECRUIT.honor),'and every realm thinks '+t.RECRUIT.honor+' less of you');
  const cc=t.charOf(c3,id);ok(cc.role==='companion'&&c3.lv===lv&&c3.tree.join()===tree.join()&&Math.abs(t.charStats(cc).hp-h0)<=1,'the same character: his level, the tree he grew, his numbers ('+t.charStats(cc).hp+' hp)');
  ok(t.unitSprite(id,0,false,0).width>0,'he has his look');ok(t.charCard(cc).includes(t.COMPS[id].short),'and his card');
  const n0=c3.tree.length;cc.gainXp(t.LV_XP(c3.lv));ok(c3.tp===1&&c3.tree.length===n0,'from now on his points are yours to spend');
  P.troops={hum_spear:2};G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']};t.startBattle({enemies:['militia'],tournament:false});const u=t.B.units.find(x=>x.type===id);
  ok(u&&u.comp&&u.unit===cc&&u.unit.actives().length>0,'he fights for you, with his skills ('+u.unit.actives().join(', ')+')');t.B.over=true;t.B.endT=0;t.B=null;G.mode='world';
  t.saveGame(true);delete t.COMPS[id];t.loadGame();ok(t.COMPS[id]&&t.COMPS[id].n===ch2.name&&t.P.comps[id],'a save keeps him')}
 {G.mode='world';G.modal=false;t.hidePanel();P.comps={};P.captives=[];const l=W.lords.find(x=>!x.dead&&t.fiefsOf(x.fac).length);l.shame=0;t.captureLord(l);
  ok(/Sworn to the/.test(t.recruitWhy(P.captives[0])),'a lord of a standing realm will not join you ('+t.recruitWhy(P.captives[0])+')');
  l.shame=t.RECRUIT.shame;ok(t.recruitWhy(P.captives[0])==='','disgraced (taken '+t.RECRUIT.shame+' times), he may');
  ok(t.recruitCaptive(0)&&l.gone&&l.recruited&&Object.values(P.comps).some(c=>c.grow==='lord'),'he joins you, and leaves his realm\u2019s lords')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
