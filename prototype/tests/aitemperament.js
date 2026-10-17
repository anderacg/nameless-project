'use strict';
// race fighting styles (commander.js TEMPERAMENT): each captain's temperament chosen from its army's troops, human the base
// itself, and each style shifting the captain's decisions its own way (dwarves hold, elves skirmish, orcs come on, a mixed
// host goes for the wavering); the enemy's style told once as the battle opens
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);try{
 const TM=t.TEMPERAMENT,X=t.AI_TACTICS,F=t.FOE_CMD,U=t.UNIT_AI,CP=t.CAPT,H=t.HUNT;
 // left/right: group specs; at: [x,y] for each group (left first, then right), laid out in its formation there
 const army=(left,right,at,extra={})=>{if(L.active)L.exit();L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:false,seed:42,...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  if(at)[...mine,...foe].forEach((g,i)=>{g.placeAt(at[i][0],at[i][1]);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})});return {b,mine,foe}};
 const G=(type,count)=>({type,count}),C=g=>g.centre(),said=m=>t.G.msgs.filter(x=>x.m===m).length,set=(ck,k)=>{t.captainMem(ck).temper=k};
 // ----- chosen from the army's troops
 const pick=(right,left=[G('hum_foot',10)])=>{army(left,right);return t.temperFor(1)};
 ok(pick([G('orc_grunt',20),G('orc_thrower',10)])==='orc','an orc army: orc');
 ok(pick([G('dw_clan',20),G('dw_xbow',10)])==='dwarf','a dwarf army: dwarf');
 ok(pick([G('elf_spear',10),G('elf_archer',20)])==='elf','an elf army: elf');
 ok(pick([G('hum_foot',20),G('hum_bow',10)])==='human','a human army: human');
 ok(pick([G('elf_archer',10),G('hum_foot',10),G('orc_grunt',10)])==='mixed','a league host, no race 60% of it: mixed');
 ok(pick([G('elf_archer',21),G('hum_foot',9)])==='elf','70% elves and 30% men: elf (the dominant race)');
 ok(pick([G('boar',10),G('spider',10)])===null,'beasts: none (the base)');
 ok(pick([G('militia',20),G('archer',10)])===null,'generic levies of no race: none (the base)');
 army([G('orc_grunt',20)],[G('dw_clan',20)]);ok(t.temperFor(0)==='orc'&&t.temperFor(1)==='dwarf','each side its own: your army and the enemy’s apart');
 // ----- kept once in the captain's memory; the enemy's style told once, not human's nor your own army's
 let w=army([G('hum_foot',20)],[G('orc_grunt',20)],[[200,300],[800,300]]);let n0=t.G.msgs.length;t.command(1);t.command(1);
 ok(t.captainMem(1).temper==='orc'&&said('The orcs come on in a frenzy.')===1,'the enemy captain keeps its temperament (orc) and the log tells it once');
 w.foe[0].units.slice(0,15).forEach(u=>u.hp=0);t.command(1);ok(t.captainMem(1).temper==='orc','chosen once: losses do not change it');
 w=army([G('hum_foot',20)],[G('dw_clan',20)],[[200,300],[800,300]]);t.command(1);ok(said('The dwarves hold the line.')===1,'dwarves: "The dwarves hold the line."');
 w=army([G('hum_foot',20)],[G('elf_glade',20)],[[200,300],[800,300]]);t.command(1);ok(said('The elves keep their distance.')===1,'elves: "The elves keep their distance."');
 w=army([G('hum_foot',20)],[G('hum_foot',20)],[[200,300],[800,300]]);n0=t.G.msgs.length;t.command(1);ok(t.captainMem(1).temper==='human'&&t.G.msgs.length===n0,'a human enemy: the base, and nothing said');
 w=army([G('orc_grunt',20)],[G('hum_foot',20)],[[200,300],[800,300]],{ai:true});n0=t.G.msgs.length;t.command(1);
 ok(w.b.auto&&t.captainMem(0).temper==='orc'&&!t.G.msgs.slice(n0).some(x=>/orcs/.test(x.m)),'your army under the AI takes its own race’s style (orc), unannounced');
 // ----- human: the base itself
 const tabs={FOE_CMD:F,UNIT_AI:U,AI_TACTICS:X,CAPT:CP,HUNT:H};
 ok(!Object.keys(TM.human).length&&Object.values(tabs).every(tb=>Object.keys(tb).every(k=>t.tun(TM.human,tb,k)===tb[k]&&t.tun(null,tb,k)===tb[k])),'human: every tunable its base value (identity)');
 ok(Object.values(TM).every(tm=>Object.keys(tm).every(k=>Object.values(tabs).filter(tb=>k in tb).length===(k==='prey'?2:1))),'every temperament key names one tunable in one table (prey: UNIT_AI’s, not CAPT’s distance)');
 // the same battle with the human style and with none: the same decisions, frame for frame
 const run=k=>{army([G('hum_foot',16),G('hum_bow',12),G('hum_squire',6)],[G('hum_foot',16),G('hum_bow',12),G('hum_squire',6)],null,{ai:true,seed:3});set(1,k);set(0,k);for(let i=0;i<40&&!L.session.result;i++)L.step(30);
  return JSON.stringify(t.B.units.map(u=>[Math.round(u.x*100),Math.round(u.y*100),Math.round(u.hp*100)]))};
 ok(run('human')===run(null),'a human army fights exactly as with no temperament (20 s of an AI-on-AI battle)');
 // ----- posture: orcs attack sooner, dwarves hold where men go in
 army([G('hum_foot',10)],[G('hum_foot',10)]);const post=(k,S,P,tm=0)=>{set(1,k);t.captainMem(1).post=P;t.B.t=tm;return t.posture(1,S)};
 let S={ratio:1,shootMe:.3,shootFoe:.3};
 ok(post('human',S,'defend')==='defend'&&post('orc',S,'defend')==='attack','evenly matched and holding: men keep holding, orcs go in (attackAt '+F.attackAt+' vs '+t.tun(TM.orc,F,'attackAt').toFixed(2)+')');
 S={ratio:.95,shootMe:.3,shootFoe:.3};
 ok(post('human',S,null)==='attack'&&post('dwarf',S,null)==='defend','a little the weaker with as many shooters: men attack, dwarves hold (defendAt '+t.tun(TM.dwarf,F,'defendAt').toFixed(2)+')');
 S={ratio:1.1,shootMe:.3,shootFoe:.3};ok(post('dwarf',S,'defend',40)==='defend'&&post('human',S,'defend',40)==='attack','and dwarves wait longer before a stand-off turns into an attack (stall '+t.tun(TM.dwarf,F,'stall')+' s)');
 // ----- orc infantry starts its charge from further off, and runs from further
 const footGap=k=>{w=army([G('hum_foot',16)],[G('hum_foot',16)],[[300,300],[470,300]]);w.mine[0].units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999});set(1,k);const g=w.foe[0],gp=Math.min(...g.units.map(u=>Math.min(...w.mine[0].units.map(e=>Math.hypot(e.x-u.x,e.y-u.y)))));t.command(1);return {gp,order:g.order}};
 let hu=footGap('human'),oc=footGap('orc'),dw=footGap('dwarf');
 ok(hu.gp>X.footFar&&hu.gp<t.tun(TM.orc,X,'footFar')&&hu.order!=='charge'&&oc.order==='charge','at a '+Math.round(hu.gp)+' px gap, men advance but orcs charge (footFar '+X.footFar+' vs '+t.tun(TM.orc,X,'footFar')+')');
 ok(dw.order!=='charge','dwarves, like men, advance at that gap');
 ok(t.runFor('inf',100,TM.orc)>t.runFor('inf',100,null)&&t.runFor('inf',100,TM.human)===t.runFor('inf',100,null)&&t.runFor('inf',100,TM.dwarf)<t.runFor('inf',100,null),'fresh orcs break into a run further off, dwarves nearer (runFar)');
 // ----- orcs pull a wavering group back later; dwarves rotate one out sooner
 const pulls=(k,mor)=>{w=army([G('hum_foot',20)],[G('hum_foot',15),G('hum_foot',15)],[[200,300],[700,270],[700,340]]);const [a,s]=w.foe;a.resolve.mor=mor;s.resolve.mor=80;set(1,k);t.command(1);return !!a.recover};
 ok(pulls('human',20)&&!pulls('orc',20),'a group at morale 20: men pull it back, orcs fight on (pullAt '+U.pullAt+' vs '+t.tun(TM.orc,U,'pullAt')+')');
 ok(!pulls('human',28)&&pulls('dwarf',28),'at 28: men fight on, dwarves rotate it out of the line (pullAt '+t.tun(TM.dwarf,U,'pullAt')+')');
 // ----- elf shooters lead where men's stay safe
 const lead=k=>{w=army([G('hum_foot',12),G('hum_bow',20)],[G('hum_foot',20),G('hum_bow',20)],[[200,300],[160,300],[780,300],[830,300]]);w.mine.forEach(g=>g.units.forEach(u=>{u.s={...u.s,spd:0};u.cd=999}));set(1,k);t.command(1);return t.captainMem(1).rmode};
 const mh=lead('human'),me=lead('elf');
 ok(mh.mode==='safe'&&mh.why==='outshot'&&me.mode==='aggressive','bow against bow, as many each: men’s shooters stay safe (outshot), elves’ lead');
 ok(t.captainMem(1).plan&&t.captainMem(1).plan.leads&&Math.abs(t.captainMem(1).plan.inf-t.captainMem(1).plan.x.arc)>=X.screenGap*1.5-1,'leading, the elves’ infantry stands further behind them (screenGap '+t.tun(TM.elf,X,'screenGap')+')');
 ok(t.tun(TM.elf,F,'volley')>F.volley&&t.tun(TM.elf,H,'safe')<H.safe,'elf infantry goes in after longer volleys; their shooters hunt from closer spots');
 // ----- elf riders ride round a wider flank; orc riders come back in sooner
 const flank=k=>{w=army([G('hum_foot',20)],[G('hum_knight',10)],[[200,300],[700,300]]);set(1,k);const g=w.foe[0];t.command(1);return Math.abs(g.ay-C(w.mine[0]).y)};
 const fh=flank('human'),fe=flank('elf');
 ok(fe>fh+30,'elf riders swing round a wider flank ('+Math.round(fh)+' vs '+Math.round(fe)+' px off the line)');
 ok(t.tun(TM.orc,X,'restMax')<X.restMax&&t.tun(TM.orc,U,'chargeAt')<U.chargeAt&&t.tun(TM.orc,U,'cavRecover')<U.cavRecover,'orc riders rest less and charge again on shakier nerve');
 // ----- dwarves raise a shield wall against a charge from further off
 const wall=k=>{w=army([G('hum_knight',8)],[G('hum_foot',16)],[[300,300],[480,300]]);const g=w.foe[0],I=C(g);w.mine[0].units.forEach((u,i)=>{u.x=I.x-160;u.y=I.y-20+i*5;u.run=t.CHARGE.run;u.s={...u.s,spd:0}});set(1,k);g.order='hold';
  const N={inf:[g.id],arc:[],mag:[],cav:[],hero:[]};t.captainFinish(1,N);return !!g.shieldWall};
 ok(!wall('human')&&wall('dwarf'),'riders charging 160 px off: men keep their line, dwarves lock shields (brace '+CP.brace+' vs '+t.tun(TM.dwarf,CP,'brace')+' px)');
 // ----- a mixed host goes for the wavering; a beaten orc army fights on longer
 ok(t.tun(TM.mixed,U,'prey')>U.prey&&t.tun(TM.mixed,U,'preyShot')>U.preyShot,'a mixed host’s riders and shooters favour a wavering foe more');
 w=army([G('hum_foot',30)],[G('hum_foot',10)],[[200,300],[700,300]]);w.foe[0].resolve.mor=10;const N1=t.captainGroups(1),S1={ratio:.35};
 ok(t.beatenArmy(N1,S1)&&t.beatenArmy(N1,S1,TM.human)&&!t.beatenArmy(N1,S1,TM.orc),'a beaten army at a third of your strength: men fall back, orcs fight on (beaten '+F.beaten+' vs '+t.tun(TM.orc,F,'beaten').toFixed(2)+')');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit()}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
