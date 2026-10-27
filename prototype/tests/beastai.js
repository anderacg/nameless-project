'use strict';
// Beasts in battle (beastmind.js BEAST_TACTICS): wolves split into packs that circle their prey and bite from two sides or more,
// hit and run, and break off to regroup when hurt; boars rush, back off and rush again; brutes go for the thickest fight (else the
// strongest group); spiders wait unseen in a wood and strike; griffins mark the shooters and dive at their rear; no stall at a
// cliff; AI-on-AI beast battles end within 300 s; with the switch off, beasts fight as before; no Math.random in their mind
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),ev=s=>(0,eval)(s);try{
 const BT=t.BEAST_TACTICS,G=(type,count,form)=>({type,count,...(form?{form}:{})}),C=g=>g.centre(),d2=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),lv=p=>t.levelAt(p.x,p.y);
 const put=(g,x,y)=>{g.placeAt(x,y);t.layForm(g.id);g.units.forEach(u=>{u.x=g.ax+(u.sx||0);u.y=g.ay+(u.sy||0)})};
 const still=g=>g.units.forEach(u=>{u.s={...u.s,spd:0}}),tough=(g,k=3)=>g.units.forEach(u=>{u.hp=u.max=u.max*k});
 // a lab battle: left (yours, holding: no Auto unless ai), right (the AI's); at: [x,y] for each of yours, then one for all of theirs
 const army=(left,right,at,extra={})=>{if(L.active)L.exit();t.G.mode='world';t.G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:false,deploy:false,paused:true,ai:false,seed:7,ground:'none',...extra});const b=t.B;b.obs=[];
  const mine=t.playerGroups().map(id=>b.groups[id]),foe=Object.values(b.groups).filter(g=>g.foe);
  if(at){mine.forEach((g,i)=>put(g,at[i][0],at[i][1]));const p=at[mine.length];if(p)foe.forEach((g,i)=>put(g,p[0],p[1]+(i-(foe.length-1)/2)*60))}return{b,mine,foe}};
 const step=s=>{const end=t.B.t+s;while(t.B.t<end-1e-9&&!L.session.result)L.step(30)},Q=()=>t.captainMem(1).beast,N=()=>Q()?Q().n:{};
 ev('BEAST_TACTICS.on=true');
 ok(Object.values(BT.kinds).every(K=>typeof t.BEAST_WAYS[K.way]==='function'&&(K.way==='blob'||BT[K.way]))&&['wolf','boar','bear','troll','spider','scorpion','griffin','slime','wyrm','dragon','tiger'].every(k=>BT.kinds[k]&&t.ST[k]&&t.ST[k].beast),'every beast has a way in BEAST_TACTICS, and every way its numbers and its mind');
 // ----- wolves: packs of 3-5, circling to two sides or more and biting at once
 {const w=army([G('hum_foot',12)],[G('wolf',13)],[[400,300],[750,300]]);still(w.mine[0]);tough(w.mine[0]);const packs=w.foe;
  ok(packs.length===3&&packs.every(g=>g.units.length>=3&&g.units.length<=5&&g.form==='pack'&&g.type==='wolf')&&new Set(packs.map(g=>g.name)).size===3,'13 wolves split into '+packs.length+' packs ('+packs.map(g=>g.units.length).join(', ')+'), each in the pack spread with its own name');
  {const S=t.formSlots('pack',5,0,null),ys=S.map(p=>p[1]),xs=S.map(p=>p[0]);ok(new Set(xs.map(x=>Math.round(x))).size>=4&&Math.max(...ys)-Math.min(...ys)>30,'the pack spread is ragged, no rows (5 wolves: '+S.map(p=>Math.round(p[0])+','+Math.round(p[1])).join(' ')+')')}
  let spread=0,sides=0;const C0=C(w.mine[0]);
  for(let i=0;i<120&&!L.session.result;i++){step(.25);const a=packs.filter(g=>t.atGrips(g.units,1).length).map(g=>Math.atan2(C(g).y-C0.y,C(g).x-C0.x));
   for(let x=0;x<a.length;x++)for(let y=x+1;y<a.length;y++)spread=Math.max(spread,t.angGap(a[x],a[y]));sides=Math.max(sides,a.length)}
  ok(N().bite>=3&&spread>=Math.PI/2&&sides>=2,'the packs circle their prey and bite from different sides at once ('+sides+' packs at grips together, '+Math.round(spread*180/Math.PI)+'° apart; '+N().bite+' bites)');
  ok(N().back>=1,'wolves hit and run: a pack bites, pulls back and comes round again ('+N().back+' pull-backs in '+Math.round(t.B.t)+' s)')}
 // the pull-back: away from the prey, then in again (the wolves tough too: a bite that costs them dear is a regroup, below)
 {const w=army([G('hum_foot',12)],[G('wolf',4)],[[400,300],[700,300]]);still(w.mine[0]);tough(w.mine[0]);const g=w.foe[0];tough(g);let away=0,again=false,b0=null;
  for(let i=0;i<240&&!again;i++){step(.25);if(g.phase==='back'&&b0==null)b0=d2(C(g),C(w.mine[0]));if(b0!=null){away=Math.max(away,d2(C(g),C(w.mine[0]))-b0);if(g.phase==='bite')again=true}}
  ok(away>=30&&again,'a pack’s pull-back takes it '+Math.round(away)+' px off its prey, and it bites again')}
 // packs hurt in a bite break off and regroup; a pack too small joins another
 {const w=army([G('hum_sword',14)],[G('wolf',12)],[[400,300],[650,300]]);still(w.mine[0]);tough(w.mine[0],2);let off=0;
  for(let i=0;i<300&&!L.session.result&&!(N().regroup&&off>=60);i++){step(.25);for(const g of w.foe)if(g.phase==='regroup'&&g.units.length)off=Math.max(off,Math.min(...g.units.map(u=>Math.min(...w.mine[0].units.map(e=>d2(u,e)))))) }
  ok(N().regroup>=1&&off>=60,'a pack hurt in its bite breaks off and regroups '+Math.round(off)+' px from the foe ('+N().regroup+' regroups, '+N().join+' joined another pack)')}
 // surrounded (morale on): the prey's morale shaken
 {const w=army([G('hum_foot',12)],[G('wolf',13)],[[400,300],[750,300]],{morale:true});still(w.mine[0]);tough(w.mine[0]);step(25);
  ok(N().dread>=1,'a prey bitten from two sides at once is surrounded: its morale shaken ('+N().dread+' thinks)')}
 // ----- boars: a rush, a few steps back, and again
 {const w=army([G('hum_foot',8)],[G('boar',3)],[[400,300],[700,300]]);still(w.mine[0]);tough(w.mine[0]);const g=w.foe[0];let hits=0,was=false;
  for(let i=0;i<240&&!L.session.result;i++){step(.25);const at=t.atGrips(g.units,1).length>0;if(at&&!was)hits++;was=at}
  ok(w.foe.length===1&&N().rush>=2&&hits>=3,'boars rush, back off and rush again ('+N().rush+' rushes, '+hits+' times at grips)')}
 // ----- brutes: the thickest fight, else the strongest group
 {const w=army([G('hum_foot',6),G('hum_foot',6)],[G('troll',1),G('wolf',6)],null);const [A,B2]=w.mine,tr=w.foe.find(g=>g.type==='troll'),wolves=w.foe.filter(g=>g.type==='wolf');
  put(A,400,180);put(B2,400,420);put(tr,520,420);wolves.forEach(g=>put(g,404,180));still(A);still(B2);t.command(1);
  ok(tr.prey===A.id&&tr.order==='charge','a troll goes for the thickest fight (the group the wolves are at grips with, '+Math.round(d2(C(tr),C(A)))+' px off) over the one beside it ('+Math.round(d2(C(tr),C(B2)))+' px): '+tr.prey)}
 {const w=army([G('hum_foot',3),G('hum_foot',14)],[G('bear',1)],[[450,250],[420,420],[650,280]]);const [S1,S2]=w.mine,br=w.foe[0];t.command(1);
  ok(br.prey===S2.id,'with no fight yet, a bear goes for the strongest group, not the weak one nearer it ('+br.prey+')')}
 {const w=army([G('hum_foot',8)],[G('troll',3)],[[400,300],[700,300]]);ok(w.foe.length===2&&w.foe.map(g=>g.units.length).sort().join()==='1,2','trolls go as loners or pairs (3 trolls: '+w.foe.map(g=>g.units.length).join(' and ')+')')}
 // ----- spiders: unseen in a wood; your men marching by it, they strike at their flank
 {const ground={hills:[],woods:[{x:.62,y:.55,r:90}],seed:3},w=army([G('hum_foot',10)],[G('spider',6)],null,{ground});const sp=w.foe[0],T=t.B.terrain,M=w.mine[0],wy=t.BH*.55;
  put(M,280,wy-115);put(sp,t.BW*.62+130,wy);let inWood=0,hidden=0,march=false;
  for(let i=0;i<400&&!L.session.result&&!N().strike;i++){step(.25);if(sp.phase==='hide'){const m=sp.units;inWood=Math.max(inWood,m.filter(u=>t.groundAt(u.x,u.y)===t.TKIND.wood).length);hidden=Math.max(hidden,m.filter(u=>!t.seenBy(0,u)).length)}
   if(!march&&t.B.t>4){march=true;M.moveTo(t.BW-60,wy-115,{run:true})}}
  const near=Math.min(...sp.units.map(u=>Math.min(...M.units.map(e=>d2(u,e)))));
  ok(T.has.wood&&inWood===6&&hidden===6,'spiders go into the wood and wait there unseen ('+inWood+'/6 in it, '+hidden+' hidden from you)');
  ok(N().strike===1&&N().unseen===1&&sp.phase==='strike'&&near<=BT.ambush.strike+20&&t.B.t<4+BT.ambush.wait,'your men marching past, they strike from hiding (at '+Math.round(t.B.t)+' s, the nearest '+Math.round(near)+' px off)');
  step(3);ok(sp.units.filter(u=>t.seenBy(0,u)).length>=sp.units.length/2,'sprung, they are seen by the men they fight ('+sp.units.filter(u=>t.seenBy(0,u)).length+'/'+sp.units.length+')')}
 // ----- griffins: their mark the shooters, dived at from their rear
 {const w=army([G('hum_foot',10),G('hum_bow',8)],[G('griffin',2)],[[420,300],[260,300],[800,300]]);const [F,A]=w.mine,gr=w.foe[0];let first=null,rear=null;
  for(let i=0;i<200&&!L.session.result&&first==null;i++){step(.25);if(gr.phase==='dive'){first=gr.prey;rear=C(gr).x<C(A).x+20}}
  ok(Q().mark.swoop===A.id&&first===A.id&&rear,'griffins mark the shooters and dive at them from their rear (mark '+Q().mark.swoop+', first dive at '+first+', from '+(rear?'behind':'in front of')+' them)')}
 // ----- no stall at a cliff: men on a sheer-sided top (its ramp west), wolves below its east face go round and up
 {const ground={hills:[{x:.5,y:.5,r:110,top:1,cliff:true,ramps:[180]}],woods:[],seed:3},w=army([G('hum_foot',10)],[G('wolf',8)],null,{ground});const h=t.B.terrain.recipe.hills[0];
  put(w.mine[0],h.x,h.y);still(w.mine[0]);tough(w.mine[0]);w.foe.forEach((g,i)=>put(g,h.x+h.rx+60,h.y-40+i*80));let up=null,stall=0,last={};
  for(let i=0;i<360&&!L.session.result&&up==null;i++){step(.25);if(w.foe.some(g=>t.atGrips(g.units,1).length))up=t.B.t;
   for(const g of w.foe){const c=C(g),p=last[g.id];if(p&&d2(c,p.c)<4)p.s+=.25;else last[g.id]={c,s:0};stall=Math.max(stall,last[g.id].s)}}
  ok(up!=null&&up<60&&stall<8,'wolves below a sheer top go round by its ramp and reach the men on it (at grips at '+(up==null?'never':Math.round(up)+' s')+', longest stand '+stall.toFixed(1)+' s)')}
 // ----- AI-on-AI beast battles (terrain, fog, sizes as in the game) end within 300 s
 {const TR0=ev('TERRAIN.on'),FS0=ev('FIELD_SIZES.on');ev('TERRAIN.on=true;FIELD_SIZES.on=true');const res=[];
  const sets=[['wolves',[G('wolf',10)],'open','frost'],['boars',[G('boar',4)],'open','grass'],['trolls',[G('troll',2)],'hill','frost'],['spiders',[G('spider',8)],'forest','grass'],['griffins',[G('griffin',2)],'hill','grass'],
   ['scorpions',[G('scorpion',4)],'open','desert'],['slimes',[G('slime',5)],'open','swamp'],['wyrm',[G('wyrm',1)],'open','desert'],['mixed',[G('wolf',8),G('troll',1),G('boar',3),G('spider',4)],'open','grass']];
  for(const [name,right,terrain,climate] of sets)for(const seed of [1,2]){army([G('hum_foot',10),G('hum_bow',6)],right,null,{ai:true,morale:true,seed,distance:500,ground:'auto',terrain,climate,fog:true});
   let s=0;while(!L.session.result&&t.B.t<300&&s++<3000)L.step(60);res.push(name+' '+(L.session.result?(/Left/.test(L.session.result)?'men':'beasts')+' '+Math.round(t.B.t)+'s':'UNFINISHED'))}
  ev('TERRAIN.on='+TR0+';FIELD_SIZES.on='+FS0);ok(!res.some(r=>/UNFINISHED/.test(r)),'AI-on-AI beast battles all end within 300 s ('+res.join('; ')+')')}
 // ----- a monster encounter on the map, fought out
 {if(L.active)L.exit();const G0=t.G,P=t.P,W=t.W;t.act('begin','soldier');W.critters=[];W.sites=[];W.lords.forEach(l=>{l.x=-999;l.y=-999});P.troops={hum_spear:8,hum_long:4};
  const m={id:'wolf',x:P.x+40,y:P.y,hx:P.x+40,hy:P.y,lv:1,n:6,cool:0,t:9,a:0};W.monsters.push(m);G0.encCool=0;t.startMonster(m);t.act('fight');t.beginFight();const B=t.B,packs=Object.values(B.groups).filter(g=>g.foe).map(g=>g.units.length);
  let i=0;while(t.B&&i<12000){t.updateBattle(.033);i++}
  ok(packs.join()==='3,3'&&!t.B,'a wolf pack met on the map (6) fights as two packs of 3, and the battle ends ('+Math.round(i*.033)+' s)');if(G0.loot)t.act('lt-all');t.act('cont')}
 // ----- the switch off: beasts as before (one group in its line, the captain's arms; no pack, no beast memory)
 {ev('BEAST_TACTICS.on=false');const w=army([G('hum_foot',12)],[G('wolf',13)],[[400,300],[750,300]]);t.command(1);step(3);
  ok(w.foe.length===1&&w.foe[0].form==='line'&&!Q()&&!w.foe[0].phase&&['advance','charge','hold'].includes(w.foe[0].order),'with BEAST_TACTICS off the wolves are one group in a line under the captain’s infantry orders ('+w.foe[0].order+'), no pack in sight');ev('BEAST_TACTICS.on=true')}
 // ----- no Math.random in the beasts' mind
 {const get=u=>{const x=new XMLHttpRequest();x.open('GET',u,false);x.send();return x.responseText},src=get('js/battle/beastmind.js');
  const w=army([G('hum_foot',10),G('hum_bow',6)],[G('wolf',8),G('boar',3),G('troll',1),G('spider',4),G('griffin',1)],[[400,240],[300,380],[760,300]]);let calls=0;const R0=Math.random,cb=t.captainBeasts;
  ev('captainBeasts=function(...a){const r=Math.random;Math.random=()=>{window.__beastRnd=(window.__beastRnd||0)+1;return r()};try{return __cb0(...a)}finally{Math.random=r}}'.replace('__cb0','window.__cb0'));window.__cb0=cb;window.__beastRnd=0;
  step(20);calls=window.__beastRnd;ev('captainBeasts=window.__cb0');Math.random=R0;
  ok(!/Math\.random/.test(src)&&calls===0,'no Math.random in beastmind.js, and none drawn while the beasts are commanded (20 s of a mixed fight)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{try{if(L.active)L.exit();ev('BEAST_TACTICS.on=false')}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
