'use strict';
window.RUN=()=>{const t=T,P=t.P,G=t.G,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),random=Math.random;
try{
 const fixture=()=>{
  Math.random=t.seeded(1831);t.begin('soldier');G.quietEvents=true;t.BDEPLOY.on=false;P.sk.med={lv:3,xp:0};
  const r=t.partyRoster(P);r.add('hum_foot',12);const a=r.groups[0],b=r.split(a.id,6);r.rename(a.id,'First <Guard>');r.rename(b.id,'Second Guard');r.move(b.id,-1);
  P.wounded={hum_foot:2};P.woundedGroups=[{id:a.id,type:a.type,count:2}];
  const foe=t.asParty({kind:'bandits',troops:Array(40).fill('militia'),x:P.x+8,y:P.y,cool:0});
  G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[],mine:true};
  t.startBattle({enemies:G.enc.list,deploy:false});const B=t.B;B.kills=0;B.slain=[];B.win=true;B.lost={};
  return{r,a,b,B,fall:(id,n)=>{for(const u of B.units.filter(u=>u.grp==='p_'+id).slice(0,n))u.hp=0;B.lost.hum_foot=(B.lost.hum_foot||0)+n}};
 };
 const finish=(f,values=[])=>{let i=0;Math.random=()=>i<values.length?values[i++]:.99;new t.BattleResolution(f.B).finish();return G.lootView.report};
 let f=fixture();f.fall(f.a.id,3);const report=finish(f,[0,.99,0,.99,.99]),a=report.groups.find(g=>g.id===f.a.id),b=report.groups.find(g=>g.id===f.b.id);
 ok(a.start===6&&a.fit===4&&a.wounded===1&&a.killed===1&&a.saved===1,'medicine separates fit returns, new wounded and deaths exactly');
 ok(b.start===6&&b.fit===6&&!b.wounded&&!b.killed,'same-type duplicate with no casualties stays separate');
 ok(report.groups[0].id===f.b.id,'report follows the persisted battle-card order');
 ok(report.groups.every(g=>g.start===g.fit+g.wounded+g.killed),'starting soldiers reconcile with all three outcomes');
 ok(f.r.groups.find(g=>g.id===a.id).count===a.fit&&f.r.wounded(a.id)===3,'report agrees with campaign counts and excludes pre-existing wounded');
 ok(panel.querySelector('[data-report-group="'+a.id+'"]').textContent.includes('First <Guard>')&&!panel.querySelector('.battle-report Guard'),'custom names are rendered as literal text');
 ok(report.characters.some(c=>c.id==='hero'&&c.status==='Standing'),'hero condition is reported separately from soldier deaths');
 const kept=JSON.stringify(report);t.renderLoot();ok(JSON.stringify(G.lootView.report)===kept&&panel.querySelectorAll('[data-report-group]').length===2,'loot rerenders retain the complete report');
 f=fixture();f.fall(f.b.id,6);let result=finish(f),gone=result.groups.find(g=>g.id===f.b.id);
 ok(gone.killed===6&&gone.fit===0&&gone.name==='Second Guard'&&!f.r.groups.some(g=>g.id===gone.id),'completely destroyed group keeps its identity in the report');
 f=fixture();f.B.win=false;f.B.retreat=true;f.B.withdrawn=12;const left=f.B.units.find(u=>u.grp==='p_'+f.a.id);left.left=true;left.hpLeft=left.hp;left.hp=0;
 result=finish(f);ok(result.groups.every(g=>g.fit===6&&!g.killed&&!g.wounded),'successful withdrawal counts left-the-field soldiers as fit, not dead');
 f=fixture();f.B.win=false;f.B.retreat=true;G.enc.mine=false;G.enc.noFlee=true;f.fall(f.a.id,1);result=finish(f);
 ok(result.groups.reduce((n,g)=>n+g.rearguard,0)>0,'failed escape includes additional rearguard casualties');
 ok(result.groups.every(g=>g.fit===(f.r.groups.find(s=>s.id===g.id)?.count||0)&&g.start===g.fit+g.wounded+g.killed),'run-down report matches exact surviving group counts');
 ok(result.groups.reduce((n,g)=>n+g.killed,0)===Object.values(G.lootView.lost).reduce((n,v)=>n+v,0),'rearguard casualties are counted once, not duplicated');
 f=fixture();f.B.win=false;f.B.hero.hp=0;result=finish(f);ok(result.characters.find(c=>c.id==='hero').status==='Wounded'&&P.hp>=1,'fallen hero is wounded, never listed as killed');
 f=fixture();f.fall(f.a.id,6);result=finish(f,Array(12).fill(0).map((v,i)=>i%2===0?.99:0));const injured=result.groups.find(g=>g.id===f.a.id);
 ok(injured.fit===0&&injured.wounded===6&&!injured.killed&&f.r.nameOf(f.a.id)==='First <Guard>','fully wounded group has no fictional deaths and retains its recovery name');
 f=fixture();f.fall(f.a.id,6);result=finish(f,Array(6).fill(0));const rescued=result.groups.find(g=>g.id===f.a.id);
 ok(rescued.fit===6&&rescued.saved===6&&!rescued.wounded&&!rescued.killed,'all medicine returns are fit, not counted twice as wounded');
 f=fixture();result=finish(f);ok(result.groups.every(g=>g.start===g.fit&&!g.killed&&!g.wounded&&!g.saved),'zero-casualty groups still appear with unchanged strength');
 f=fixture();t.lootEnd();t.concludeEncounter(true,{hum_foot:1},0,true,[]);
 ok(!G.lootView.report&&!panel.querySelector('.battle-report'),'real auto-resolve settlement retains aggregate reporting');
 t.begin('soldier');G.quietEvents=true;P.comps.brann={ap:0,role:''};const emptyFoe=t.asParty({kind:'bandits',troops:['militia'],x:P.x+8,y:P.y});
 G.enc={kind:'party',ref:emptyFoe,list:['militia'],allies:[],foes:[],mine:true};t.startBattle({enemies:['militia'],deploy:false});
 f={B:t.B};f.B.win=true;f.B.kills=0;f.B.slain=[];f.B.units.find(u=>u.comp).hp=0;result=finish(f);
 ok(result.groups.length===0&&result.characters.find(c=>c.id==='comp_brann')?.status==='Wounded','character-only armies show companion condition without inventing troop groups');
 ok(panel.textContent.includes('No troop groups took part.'),'character-only report explains the empty troop breakdown');
 // Non-field callers must retain their existing aggregate summary, not invent group ownership.
 t.lootEnd();t.lootShow('<h2>Aggregate result</h2>',{hum_foot:1},0,'cont');
 ok(!G.lootView.report&&!panel.querySelector('.battle-report'),'aggregate callers remain supported without fabricated per-group data');
 t.lootEnd();ok(!G.lootView&&!G.loot,'continuing clears the transient report with the loot state');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{Math.random=random}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
