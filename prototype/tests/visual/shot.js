'use strict';
// Not a test: sets up a scene for a screenshot (tests/visual/shot.sh). ?scene=world|battle|town
window.RUN=()=>{
  const t=T,G=t.G,P=t.P,W=t.W,scene=new URLSearchParams(location.search).get('scene')||'world';
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');
  const go=()=>{
    if(new URLSearchParams(location.search).get('grid'))t.setGrid(true);
    // ?scene=estate|worker|herd&k=…&mine=1&tab=… (an estate met on the map, a menu of it; its workers; a pasture's Pens),
    // ?scene=site&type=…&tab=…
    if(['estate','worker','herd','site'].includes(scene)){const q=new URLSearchParams(location.search),k=q.get('k')||(scene==='herd'?'pasture':'farm');P.troops={hum_knight:6,hum_long:4};P.gold=900;P.fac=null;P.hostile={};
      const tw=q.get('mine')||scene==='herd'?t.townBy('Ashford'):t.TOWNS.find(x=>x.owner&&x.owner!=='player'&&t.bldLv(x,k)&&!x.sacked&&!x.raided);for(let d=0;d<3;d++)t.econDay();
      if(q.get('mine')||scene==='herd'){tw.owner='player';tw.lastOwner='player';Object.assign(tw.stock,{timber:300,stone:300,tools:60,iron:60})}
      G.mode='world';G.modal=false;t.hidePanel();
      if(scene==='site'){const s=W.sites.find(x=>x.type===(q.get('type')||'travelers'));s.cleared=false;s.seen=true;P.x=s.x;P.y=s.y+14;t.drawWorld();G.lastSite=null;t.enterSite(s);if(q.get('tab'))t.act('site-tab',q.get('tab'))}
      else{const sp=t.bldSpots(tw)[k];P.x=sp.x;P.y=sp.y+10;G.clock=t.DAY*.3;W.folk=[];for(let i=0;i<200;i++)t.updateFolk(.05);if(scene==='herd'){W.critters=[];t.initCritters()}t.drawWorld();
        t.estateMeet(t.estatePick(tw,k));if(scene==='worker')t.act('es-folk');if(scene==='herd')t.act('es-tab','herd');if(q.get('tab'))t.act('es-tab',q.get('tab'))}}
    else if(scene==='skills'){const bg=new URLSearchParams(location.search).get('bg');if(bg)t.act('begin',bg);P.level=9;P.tp=8;(bg?[]:['might0','might1','might2','mighta0','finesse0','h_might_finesse']).forEach(id=>{P.tp++;t.takeNode(id)});G.mode='world';G.modal=false;t.hidePanel();t.openSkills(new URLSearchParams(location.search).get('tab')||'talents');t.act('tree-sel','might3')}
    else if(scene==='inv'){const g=t.gearId;P.gear.weapon=g('spear',2);P.gear.offhand=g('shield',1);P.gear.head=g('helm',2);P.gear.body=g('mail',1);P.gear.cape=g('cloak',3);P.gear.feet=g('boots',1);P.gear.belt=g('belt',2);
      P.gear.ring0=g('ring',2);P.gear.ring5=g('ring',4);P.gear.ring6=g('ring',1);P.gear.mount='m_horse';P.gear.marmor=g('barding',2);P.gear.macc=g('saddle',1);t.fitInv();
      [g('greatsword',3),g('dagger',2),g('tome',2),g('chanfron',1),'wyrmspear'].forEach(id=>t.invAdd('gear',id,1));t.invAdd('good','meat',12);t.invAdd('good','spice',8);t.invAdd('mat','pelt',7);
      G.mode='world';G.modal=false;t.hidePanel();t.openInv();t.act('inv-sel',String(P.inv.findIndex(x=>x&&x.id===g('greatsword',3))))}
    else if(scene==='comp'){const q=new URLSearchParams(location.search),id=q.get('id')||'brann';P.comps={[id]:{ap:2,role:''}};const c=t.compInit(id);c.lv=+(q.get('lv')||4);c.xp=0;c.gear.weapon=t.gearId('axe',2);c.gear.body=t.gearId('mail',1);G.mode='world';G.modal=false;t.hidePanel();t.openComp(id);if(q.get('tree'))t.act('cm-tree')}
    else if(scene==='recruit'){const q=new URLSearchParams(location.search),tw=t.townBy(q.get('town')||'Ashford');P.troops={hum_levy:4,hum_bow:3,hum_spear:2};P.gold=900;P.rep[tw.name]=60;tw.vol=9;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab','recruit');if(q.get('pick'))t.act('rec-pick',q.get('pick'))}
    else if(scene==='fief'||scene==='trade'||scene==='garrison'||scene==='smith'){const tw=t.townBy(new URLSearchParams(location.search).get('town')||'Ashford');if(scene==='fief'||new URLSearchParams(location.search).get('mine')){tw.owner='player';tw.lastOwner='player';P.troops={hum_knight:6,hum_long:4}}for(let d=0;d<3;d++)t.econDay();P.gold=900;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab',scene);
      const sc=+(new URLSearchParams(location.search).get('scroll')||0);document.getElementById('panel').scrollTop=sc}
    else if(scene==='loot'){P.troops={hum_knight:10,hum_long:6};P.prisoners={};G.mode='world';G.modal=false;t.hidePanel();const M=t.MONSTERS.troll,g0=M.gear;M.gear=g0.map(([g])=>[g,1]);
      const m={id:'troll',x:P.x+5,y:P.y,hx:P.x,hy:P.y,lv:2,n:2,t:0,a:0,cool:0};t.W.monsters.push(m);t.startMonster(m);t.invAdd('good','arrows',4);if(new URLSearchParams(location.search).get('full'))for(let i=0;i<P.inv.length;i++)if(!P.inv[i])P.inv[i]={k:'good',id:['grain','cloth','iron','timber'][i%4],n:5};t.concludeEncounter(true,{hum_knight:2},2,true,['troll','troll']);M.gear=g0}
    else if(scene==='street'){const q=new URLSearchParams(location.search),tw=t.townBy(q.get('town')||'Ashford');G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('scene-enter');
      const S=G.scene,at=q.get('at');if(at){const [x,y]=at.split(',').map(Number);S.p.x=(x+.5)*16;S.p.y=(y+1)*16-3}else{S.p.x=(S.square.x+6)*16;S.p.y=(S.square.y+5)*16}
      if(q.get('night'))G.clock=t.DAY*.8;for(let i=0;i<40;i++)t.updateScene(.05);t.frame()}
    else if(scene==='gallery'){G.mode='world';G.modal=false;t.hidePanel();const q=new URLSearchParams(location.search),part=q.get('part')||'holdings',Z=+(q.get('z')||2),cv=document.createElement('canvas');cv.width=1400;cv.height=880;cv.style.cssText='position:fixed;left:0;top:0;z-index:9999';document.body.appendChild(cv);const c=cv.getContext('2d', { willReadFrequently: true });c.imageSmoothingEnabled=false;
      c.fillStyle='#5a8a3a';c.fillRect(0,0,1400,880);c.save();c.scale(Z,Z);let x=2,y=2,rowH=0;const put=sp=>{if(x+sp.width>1400/Z){x=2;y+=rowH+3;rowH=0}c.drawImage(sp,x,y);x+=sp.width+3;rowH=Math.max(rowH,sp.height)};
      if(part==='troops'){const nl=()=>{x=2;y+=rowH+6;rowH=0};const tree=k=>{const out=[k];(t.UP[k]||[]).forEach(u=>out.push(...tree(u)));return out};
        for(const r of Object.keys(t.RACES)){const R=t.RACES[r];for(const line of ['melee','shield','ranged','horse']){for(const k of tree(R[line]))put(t.unitSprite(k,0,false,0));x+=10}nl()}}
      else if(part==='holdings'){const kind=q.get('kind')||'town';for(const tw of t.TOWNS.filter(z=>z.kind===kind).slice(0,6))for(const l of tw.lots.filter(l=>l.k!=='wall').slice(0,6))put(t.lotSprite(tw,l))}
      else{for(const tw of t.TOWNS.slice(0,6)){const sp=t.bldSpots(tw);for(const k in sp){put(t.lotSprite(tw,t.lotAt(tw,k)));const gr=t.estateGround(tw,k,2);if(gr)put(gr)}}[0,1,2,3].forEach(i=>put(t.campSprite(i)));
        ['cave','ruins','shrine','hideout','travelers'].forEach((ty,i)=>put(t.siteSprite({type:ty,seed:5+i,x:t.TOWNS[0].x,y:t.TOWNS[0].y,kind:0})))}
      c.restore()}
    else if(scene==='jobs'){const tw=t.townBy('Ashford');P.x=tw.x;P.y=tw.y+5;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.acceptQuest(t.makeQuest('supply',tw));t.updateWorld(.01);t.act('tab','jobs')}
    else if(scene==='battle'){P.troops={hum_spear:4,hum_bow:3,hum_knight:2,dw_axe:2,elf_glade:2};P.comps={brann:{ap:0,role:''},tavi:{ap:0,role:''}};G.mode='world';G.modal=false;t.hidePanel();
      G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt','orc_shaman','orc_shaman','chief','hedge','archer','boar','troll']};if(new URLSearchParams(location.search).get('leader')){G.enc.ref.ld=t.newChief('bandits',6);G.enc.list=G.enc.list.filter(k=>k!=='chief')}/* ?leader=1: a named chieftain at their head */P.troops.hum_mage=3;P.troops.hum_long=6;{const w=new URLSearchParams(location.search).get('wpn');P.gear.weapon=w?t.gearId(w,2):'g_bow_2';if(w)P.gear.offhand=null}t.startBattle({enemies:G.enc.list,tournament:false});
      for(let i=0;i<110;i++)t.updateBattle(.03);t.B.aim=0;t.B.hero.cd=0;{const W=new URLSearchParams(location.search).get('wpn');if(W){const h=t.B.hero,es=t.B.units.filter(u=>u.team===1&&u.hp>0).slice(0,3);es.forEach((u,i)=>{u.x=h.x+16+i*12;u.y=h.y+(i-1)*8;u.cd=9;u.hp=u.max=999});const k=+(new URLSearchParams(location.search).get('step')||0);for(let j=0;j<k;j++){t.swing();for(let i=0;i<14;i++)t.updateBattle(.03);t.B.hero.cd=0}}}t.swing();for(let i=0;i<(new URLSearchParams(location.search).get('wpn')?2:6);i++)t.updateBattle(.03);if(new URLSearchParams(location.search).get('bow')){G.bowRange=200;P.tree.push('finesseb2');t.B.aim=-.2;t.B.draw={t:.6}}if(new URLSearchParams(location.search).get('tired')){t.grpUnits(testGroup('inf')).forEach(u=>u.sta=30);t.grpUnits(testGroup('cav')).forEach(u=>u.sta=8);t.grpUnits(testGroup('arc')).forEach(u=>u.sta=75);t.selectGroup(testGroup('inf'));t.setOrderUI();t.bhudInfo()}t.drawBattle()}
    else{const tw=t.townBy(new URLSearchParams(location.search).get('town')||'Ashford');P.x=tw.x+40;P.y=tw.y+30;
      {const at=new URLSearchParams(location.search).get('at');if(at){const [ax,ay]=at.split(',').map(Number);P.x=(ax+.5)*16;P.y=(ay+.5)*16}}
      if(new URLSearchParams(location.search).get('patrol')){(W.patrols||[]).filter(p=>p.home===tw.name).forEach((p,i)=>{p.x=P.x+50;p.y=P.y-30})}
      if(new URLSearchParams(location.search).get('fight')){const fa=t.FIDS[0],fb=t.FIDS[1],la=W.lords.find(l=>l.fac===fa),lb=W.lords.find(l=>l.fac===fb);W.rel[t.rk(fa,fb)]={s:'war',since:1};
        [la,lb].forEach((l,i)=>Object.assign(l,{inside:null,dead:false,x:P.x+60+i*10,y:P.y-20,troops:Array(14+i*4).fill('hum_spear'),state:'march'}));t.startFight([la],[lb]);for(let i=0;i<30;i++)t.updateFights(.05)}
      G.clock=t.DAY*.25;W.folk=[];for(let i=0;i<240;i++)t.updateFolk(.05);if(new URLSearchParams(location.search).get('ships')){W.ships=[];t.ensureEcon(tw);for(const g of ['cheese','grain','timber'])tw.stock[g]=500;t.TOWNS.filter(z=>z!==tw&&t.dockOf(z)).forEach(z=>{z.owner=tw.owner;t.ensureEcon(z);z.stock.cheese=0});t.sendShip(tw);for(let i=0;i<(new URLSearchParams(location.search).get('ships')==='trade'?120:900);i++){G.clock=t.DAY*.3;t.updateShips(.05)}}W.caravans=[];for(let i=0;i<9&&!W.caravans.length;i++)t.sendCaravan(tw);W.caravans.forEach(c=>{c.x=P.x-40;c.y=P.y+20});
      W.sites.forEach(s=>s.seen=true);if(new URLSearchParams(location.search).get('mount'))P.gear.mount='m_horse';
      // gather some of everything around the hero
      const near=(o,dx,dy)=>{o.x=P.x+dx;o.y=P.y+dy};
      if(W.lords[0])near(W.lords[0],-60,20);if(W.monsters[0])near(W.monsters[0],70,-30);W.monsters[1]&&(W.monsters[1].id='troll',near(W.monsters[1],90,30));
      t.spawnBandit&&t.bandits[0]&&near(t.bandits[0],-80,-30);W.critters.slice(0,4).forEach((c,i)=>near(c,-40+i*25,55));W.critters[0].id='pig';W.critters[1].id='sheep';W.critters[2].id='hen';W.critters[3].id='goat';
      W.sites.filter(s=>s.type!=='camp').slice(0,5).forEach((s,i)=>{s.x=P.x-200+i*90;s.y=P.y-95;s.type=['cave','ruins','shrine','hideout','travelers'][i];s.kind=0;s.cleared=false});
      {const n=+(new URLSearchParams(location.search).get('army')||0);if(n){P.troops={hum_spear:n};if(W.lords[0])W.lords[0].troops=Array(n).fill('hum_levy');t.bandits[0]&&(t.bandits[0].n=Math.round(n/3));W.refugees=[];const rg=t.sendRefugees(tw,t.TOWNS.find(x=>x!==tw&&x.owner),'hunger')||t.sendRefugees(tw,t.TOWNS[1],'hunger');if(rg)near(rg,30,-40)}}
      {const dm=t.mythicOf('dragon')||t.spawnMythic('dragon')||t.spawnMythic('dragon');if(dm)near(dm,150,-60)}G.mode='world';G.modal=false;t.hidePanel();
      // ?place=<estate>: your holding, a building site going up, and a ghost of the estate under the pointer at a free spot
      {const k=new URLSearchParams(location.search).get('place');if(k){tw.owner='player';t.ensureEcon(tw);tw.stock.timber=200;tw.stock.tools=40;tw.stock.stone=200;P.gold=9000;tw.work=null;
        t.buildHouse(tw);tw.work.start=G.day-1;tw.work.done=G.day+1;W.sites=[];W.monsters=[];W.critters=[];t.bandits.length=0;W.lords.forEach(l=>{l.x=-999});
        const n=t.lotSize(t.typeFor(tw,k,Math.random));let sp=null;for(let r=1;r<10&&!sp;r++)for(let y=tw.ty-r;y<=tw.ty+r&&!sp;y++)for(let x=tw.tx-r;x<=tw.tx+r&&!sp;x++)if(t.placeOk(tw,k,x,y,n))sp=[x,y];
        G.place=null;tw.work2=tw.work;t.startPlace(tw,k);const h=tw.lots.find(l=>l.st==='building');P.x=h?(h.x+.5)*16:tw.x;P.y=h?(h.y+1)*16+10:tw.y;t.drawWorld();if(sp){G.mouse.in=true;G.mouse.x=(sp[0]+n/2)*16-t.G.cam.x;G.mouse.y=(sp[1]+n/2)*16-t.G.cam.y}}}
      // ?ships=1: look at a boat (one at its fishing ground if there is one), the bustle cleared away
      {if(new URLSearchParams(location.search).get('ships')){const want=new URLSearchParams(location.search).get('ships'),sh=W.ships.find(x=>want==='trade'?x.k==='trade':x.state==='fish')||W.ships[0];if(sh){P.x=sh.x-30;P.y=sh.y;W.monsters=[];W.critters=[];t.bandits.length=0;W.lords.forEach(l=>{l.x=-999});W.caravans=[];W.folk=[];W.sites.forEach(x=>{x.seen=false})}}}
      // ?site=cave: stand by a real site of that type (?site=bandit&n=2: by a bandit camp), where the world put it (the zoom shows it close)
      {const st=new URLSearchParams(location.search).get('site');if(st){const s=st==='bandit'?t.camps()[+(new URLSearchParams(location.search).get('n')||0)]:W.sites.filter(x=>x.type!=='camp').slice(5).find(x=>x.type===st);if(s){P.x=s.x;P.y=s.y+20;W.monsters=[];W.critters=[];t.bandits.length=0;W.lords.forEach(l=>{l.x=-999});W.caravans=[];W.folk=[]}}}
      // ?clean=1: the holding alone, everyone else sent away
      if(new URLSearchParams(location.search).get('clean')){W.monsters=[];W.critters=[];t.bandits.length=0;W.lords.forEach(l=>{l.x=-999});W.caravans=[];W.folk=[];W.refugees=[];W.patrols=[];W.sites.forEach(x=>{x.seen=false;x.x=-999});P.x=tw.x;P.y=tw.y-8;P.gear.mount=null}
      // ?stay=btn|bar|siege: the Stay button in the holding's window, the banner while you stay, a siege while you are inside
      {const sy=new URLSearchParams(location.search).get('stay');if(sy){P.troops={hum_spear:8,hum_bow:6};P.gold=180;P.rep[tw.name]=(P.rep[tw.name]||0)+10-t.standingAt(tw);P.x=tw.x;P.y=tw.y+12;G.lastTown=null;
        if(sy==='btn'){t.enterTown(tw);t.act('tab','tavern')}
        else{t.startStay(tw);if(sy==='siege'){const L=W.lords.find(l=>!l.dead&&l.fac!==tw.owner);Object.assign(L,{inside:null,state:'siege',tgt:tw.name,x:tw.x+16,y:tw.y+12,troops:Array(18).fill('hum_spear')});t.stayTick(.01)}}t.updateHUD(true)}}
      t.drawWorld()}
    const d=document.createElement('pre');d.id='OUT';d.textContent='PASS shot '+scene;document.body.appendChild(d)};
  go();
};
// ?zoom=1 copies the middle of the canvas into a large image for close inspection
addEventListener('load',()=>setTimeout(function z(){if(!document.getElementById('OUT'))return setTimeout(z,100);if(!new URLSearchParams(location.search).get('zoom'))return;
  const src=document.getElementById('cv')||document.querySelector('canvas'),c=document.createElement('canvas');c.width=1400;c.height=880;const g=c.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;
  g.drawImage(src,src.width/2-175,src.height/2-110,350,220,0,0,1400,880);c.style.cssText='position:fixed;left:0;top:0;z-index:99';document.body.appendChild(c)},100));
