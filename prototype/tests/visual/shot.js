'use strict';
// Not a test: sets up a scene for a screenshot (tests/visual/shot.sh). ?scene=world|battle|town
window.RUN=()=>{
  const t=T,G=t.G,P=t.P,W=t.W,scene=new URLSearchParams(location.search).get('scene')||'world';
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');
  const go=()=>{
    if(scene==='skills'){const bg=new URLSearchParams(location.search).get('bg');if(bg)t.act('begin',bg);P.level=9;P.tp=8;(bg?[]:['might0','might1','might2','mighta0','finesse0','h_might_finesse']).forEach(id=>{P.tp++;t.takeNode(id)});G.mode='world';G.modal=false;t.hidePanel();t.openSkills(new URLSearchParams(location.search).get('tab')||'talents');t.act('tree-sel','might3')}
    else if(scene==='inv'){const g=t.gearId;P.gear.weapon=g('spear',2);P.gear.offhand=g('shield',1);P.gear.head=g('helm',2);P.gear.body=g('mail',1);P.gear.cape=g('cloak',3);P.gear.feet=g('boots',1);P.gear.belt=g('belt',2);
      P.gear.ring0=g('ring',2);P.gear.ring5=g('ring',4);P.gear.ring6=g('ring',1);P.gear.mount='m_horse';P.gear.marmor=g('barding',2);P.gear.macc=g('saddle',1);t.fitInv();
      [g('greatsword',3),g('dagger',2),g('tome',2),g('chanfron',1),'wyrmspear'].forEach(id=>t.invAdd('gear',id,1));t.invAdd('good','meat',12);t.invAdd('good','spice',8);t.invAdd('mat','pelt',7);
      G.mode='world';G.modal=false;t.hidePanel();t.openInv();t.act('inv-sel',String(P.inv.findIndex(x=>x&&x.id===g('greatsword',3))))}
    else if(scene==='fief'||scene==='trade'){const tw=t.townBy('Ashford');if(scene==='fief'){tw.owner='player';tw.lastOwner='player'}for(let d=0;d<3;d++)t.econDay();P.gold=900;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(tw);t.act('tab',scene);
      const sc=+(new URLSearchParams(location.search).get('scroll')||0);document.getElementById('panel').scrollTop=sc}
    else if(scene==='jobs'){const tw=t.townBy('Ashford');P.x=tw.x;P.y=tw.y+5;G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.acceptQuest(t.makeQuest('supply',tw));t.updateWorld(.01);t.act('tab','jobs')}
    else if(scene==='battle'){P.troops={hum_spear:4,hum_bow:3,hum_knight:2,dw_axe:2,elf_glade:2};P.comps={brann:{ap:0,role:''},tavi:{ap:0,role:''}};G.mode='world';G.modal=false;t.hidePanel();
      G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt','orc_shaman','orc_shaman','chief','hedge','archer','boar','troll']};P.troops.hum_mage=3;P.troops.hum_long=6;{const w=new URLSearchParams(location.search).get('wpn');P.gear.weapon=w?t.gearId(w,2):'g_bow_2';if(w)P.gear.offhand=null}t.startBattle({enemies:G.enc.list,tournament:false});
      for(let i=0;i<110;i++)t.updateBattle(.03);t.B.aim=0;t.B.hero.cd=0;{const W=new URLSearchParams(location.search).get('wpn');if(W){const h=t.B.hero,es=t.B.units.filter(u=>u.team===1&&u.hp>0).slice(0,3);es.forEach((u,i)=>{u.x=h.x+16+i*12;u.y=h.y+(i-1)*8;u.cd=9;u.hp=u.max=999});const k=+(new URLSearchParams(location.search).get('step')||0);for(let j=0;j<k;j++){t.swing();for(let i=0;i<14;i++)t.updateBattle(.03);t.B.hero.cd=0}}}t.swing();for(let i=0;i<(new URLSearchParams(location.search).get('wpn')?2:6);i++)t.updateBattle(.03);if(new URLSearchParams(location.search).get('bow')){G.bowRange=200;P.tree.push('finesseb2');t.B.aim=-.2;t.B.draw={t:.6}}t.drawBattle()}
    else{const tw=t.townBy(new URLSearchParams(location.search).get('town')||'Ashford');P.x=tw.x+40;P.y=tw.y+30;
      {const at=new URLSearchParams(location.search).get('at');if(at){const [ax,ay]=at.split(',').map(Number);P.x=(ax+.5)*16;P.y=(ay+.5)*16}}
      G.clock=t.DAY*.25;W.folk=[];for(let i=0;i<240;i++)t.updateFolk(.05);W.caravans=[];for(let i=0;i<9&&!W.caravans.length;i++)t.sendCaravan(tw);W.caravans.forEach(c=>{c.x=P.x-40;c.y=P.y+20});
      W.sites.forEach(s=>s.seen=true);if(new URLSearchParams(location.search).get('mount'))P.gear.mount='m_horse';
      // gather some of everything around the hero
      const near=(o,dx,dy)=>{o.x=P.x+dx;o.y=P.y+dy};
      if(W.lords[0])near(W.lords[0],-60,20);if(W.monsters[0])near(W.monsters[0],70,-30);W.monsters[1]&&(W.monsters[1].id='troll',near(W.monsters[1],90,30));
      t.spawnBandit&&t.bandits[0]&&near(t.bandits[0],-80,-30);W.critters.slice(0,4).forEach((c,i)=>near(c,-40+i*25,55));W.critters[0].id='pig';W.critters[1].id='sheep';W.critters[2].id='hen';W.critters[3].id='goat';
      W.sites.slice(0,5).forEach((s,i)=>{s.x=P.x-120+i*55;s.y=P.y-75;s.type=['cave','ruins','shrine','hideout','travelers'][i];s.kind=0;s.cleared=false});
      {const n=+(new URLSearchParams(location.search).get('army')||0);if(n){P.troops={hum_spear:n};if(W.lords[0])W.lords[0].troops=Array(n).fill('hum_levy');t.bandits[0]&&(t.bandits[0].n=Math.round(n/3));W.refugees=[];const rg=t.sendRefugees(tw,t.TOWNS.find(x=>x!==tw&&x.owner),'hunger')||t.sendRefugees(tw,t.TOWNS[1],'hunger');if(rg)near(rg,30,-40)}}
      {const dm=t.mythicOf('dragon')||t.spawnMythic('dragon')||t.spawnMythic('dragon');if(dm)near(dm,150,-60)}G.mode='world';G.modal=false;t.hidePanel();t.drawWorld()}
    const d=document.createElement('pre');d.id='OUT';d.textContent='PASS shot '+scene;document.body.appendChild(d)};
  go();
};
// ?zoom=1 copies the middle of the canvas into a large image for close inspection
addEventListener('load',()=>setTimeout(function z(){if(!document.getElementById('OUT'))return setTimeout(z,100);if(!new URLSearchParams(location.search).get('zoom'))return;
  const src=document.getElementById('cv')||document.querySelector('canvas'),c=document.createElement('canvas');c.width=1400;c.height=880;const g=c.getContext('2d');g.imageSmoothingEnabled=false;
  g.drawImage(src,src.width/2-175,src.height/2-110,350,220,0,0,1400,880);c.style.cssText='position:fixed;left:0;top:0;z-index:99';document.body.appendChild(c)},100));
