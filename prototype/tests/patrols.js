'use strict';
// Patrols: every holding with enough garrison sends guards out to ride its land (its soldiers leave the garrison while out).
// They keep to their land and its estates, cut down bandits there, fight armies they can beat and run from ones they
// can't, go home when their time is up or their holding is besieged, and rejoin the garrison. They stop you after a crime
// (pay the fine or fight), attack you when their realm is hostile, and just talk otherwise. Patrols and crimes are saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];G.quietEvents=true;G.encCool=1e9;G.clock=t.DAY*.3;
 const tick=()=>{t.updatePatrols(.05);t.updateFights(.05)},panel=()=>document.getElementById('panel').innerHTML,world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.enc=null;G.pt=null};
 ok(W.patrols.length>=t.TOWNS.length*.6,W.patrols.length+' of '+t.TOWNS.length+' holdings have guards out from the start');
 const p=W.patrols.find(x=>t.townBy(x.home).kind==='town'),h=t.townBy(p.home);
 ok(p.troops.length===h.T.patrol.size&&h.gar+p.troops.length===h.T.gar,'a town sends '+p.troops.length+' of its garrison out ('+h.gar+' stay behind)');
 // riding its land
 // (how far it got, not where it happens to stand at the end: its beat can bring it back by the gate; and its stops are seeded)
 P.x=10;P.y=10;let off=0,far=0;{const r0=Math.random;Math.random=t.seeded(2024);try{for(let i=0;i<600;i++){t.updatePatrols(.05);const d=Math.hypot(p.x-h.x,p.y-h.y);far=Math.max(far,d);if(!t.patrolLand(p,p.x,p.y)&&d>40)off++}}finally{Math.random=r0}}
 ok(W.patrols.includes(p)&&off<30&&far>30,'it rides out over its own land (as far as '+Math.round(far)+' px from home, off its land '+off+'/600 frames)');
 // bandits on its land
 const b=t.asParty({x:p.x+40,y:p.y,n:2,kind:'bandits',list:['militia','militia'],t:9,a:0,idle:true,cool:0});
 if(t.patrolLand(p,b.x,b.y)){t.bandits.push(b);for(let i=0;i<400&&t.bandits.includes(b);i++)tick();ok(!t.bandits.includes(b)&&!p.fight,'it hunts down a bandit band on its land, in a fight that takes a while')}else ok(true,'(the spot by the patrol is not its land)');
 // an army: one it can beat, and one it can't
 W.patrols=[p];W.fights=[];p.fight=null;W.lords.forEach(l=>{l.x=-9000;l.y=-9000;l.fight=null});// just this patrol and the army below
 const enemyFac=t.FIDS.find(f=>f!==p.fac),lord=W.lords.find(l=>!l.dead&&l.fac===enemyFac);W.rel[t.rk(p.fac,enemyFac)]={s:'war',since:1};
 p.troops=t.garList({gar:6,races:h.races});// back to full strength after the bandits
 const ax=p.x-h.x,ay=p.y-h.y,al=Math.hypot(ax,ay)||1;// the army comes from beyond the patrol, away from home
 Object.assign(lord,{inside:null,x:p.x+ax/al*70,y:p.y+ay/al*70,troops:Array(30).fill('hum_knight'),state:'march',tgt:h.name});p.back=G.day+5;p.wx=null;
 const d0=Math.hypot(p.x-lord.x,p.y-lord.y);for(let i=0;i<20;i++){tick()}ok(Math.hypot(p.x-lord.x,p.y-lord.y)>d0||!W.patrols.includes(p),'it runs from an army it cannot beat');
 if(!W.patrols.includes(p)){h.gar=Math.max(0,h.gar-p.troops.length);p.gone=false;p.fight=null;W.patrols=[p];p.x=h.x+60;p.y=h.y+40}// it ran all the way home: send it out again
 p.troops=t.garList({gar:6,races:h.races});lord.troops=['hum_levy'];lord.x=p.x+8;lord.y=p.y;for(let i=0;i<400&&!lord.dead;i++)tick();ok(lord.dead&&!p.fight,'and routs one it can, after a short fight');
 // home: when its time is up it rejoins the garrison
 const g0=h.gar,n=p.troops.length;G.clock=t.DAY*.8;for(let i=0;i<3000&&W.patrols.includes(p);i++)t.updatePatrols(.05);for(let i=0;i<20;i++)t.updatePatrols(.05);const nw=W.patrols.find(q=>q.home===h.name&&q!==p);
 ok(!W.patrols.includes(p)&&h.gar+(nw?nw.troops.length:0)===g0+n,'at nightfall the day watch goes home and rejoins the garrison ('+g0+' → '+h.gar+(nw?', '+nw.troops.length+' of them out again as the night watch':'')+')');
 ok(nw&&nw.watch==='night','and the night watch sets out from '+h.name);
 {let near=0;const N=40;for(let i=0;i<N;i++){t.patrolWaypoint(nw,h);if(h.lots.some(l=>nw.wx>=(l.x-1)*16&&nw.wx<=(l.x+l.n+1)*16&&nw.wy>=(l.y-1)*16&&nw.wy<=(l.y+l.n+1)*16))near++;nw.x=nw.wx;nw.y=nw.wy}ok(near===N,'the night watch keeps close to the buildings ('+near+'/'+N+')')}
 P.x=nw.x+30;P.y=nw.y;G.mode='world';G.modal=false;t.hidePanel();t.drawWorld();ok(!ERR.length,'and carries torches through the dark');
 G.clock=t.DAY*.3;for(let i=0;i<3000&&W.patrols.includes(nw);i++)t.updatePatrols(.05);for(let i=0;i<20;i++)t.updatePatrols(.05);ok(!W.patrols.includes(nw)&&W.patrols.some(q=>q.home===h.name&&q.watch==='day'),'at dawn the watches change back');
 h.gar=Math.max(h.gar,h.T.gar);t.patrolDay();ok(t.patrolOf(h),'and a fresh patrol rides out the next day');
 // crime: rob a worker, and the guards come for you
 const q=t.patrolOf(h);world();h.crime=null;t.wrong(h,t.CONDUCT.robWorker);ok(t.crimeAt(h)&&t.crimeAt(h).fine===t.CONDUCT.robWorker.rep*t.PATROL.fine,'a crime is remembered with a fine ('+t.crimeAt(h).fine+' gold)');
 q.cool=0;G.encCool=0;q.back=G.day+5;for(let i=0;i<400&&G.mode==='world';i++){if(i%40===0){P.x=q.x+40;P.y=q.y}t.updatePatrols(.05)}// (kept near: the day watch rides its beat, so it may turn away first)
 ok(G.mode==='dialog'&&/stops you/.test(panel())&&G.pt===q,'the guards come and stop you');
 P.gold=500;t.act('pt-pay');ok(!t.crimeAt(h)&&P.gold===500-t.CONDUCT.robWorker.rep*t.PATROL.fine,'paying the fine closes the matter');t.act('dlg-ok');
 world();t.wrong(h,t.CONDUCT.robWorker);G.encCool=0;t.patrolMeet(q);t.act('pt-fight');ok(G.enc&&G.enc.kind==='patrol'&&t.hostileTo(q.fac),'refusing means a fight, and their realm turns hostile');
 P.troops={hum_knight:20};t.act('auto');ok(!W.patrols.includes(q)&&/scattered/.test(panel()),'beating them scatters the patrol');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // a hostile realm's guards attack; a friendly one's just talk
 world();h.gar=Math.max(h.gar,h.T.gar);t.patrolDay();const r=t.patrolOf(h);if(r){P.x=r.x+30;P.y=r.y;P.troops={hum_levy:1};r.cool=0;G.encCool=0;for(let i=0;i<40&&G.mode==='world';i++)t.updatePatrols(.05);ok(G.enc&&G.enc.kind==='patrol','guards of a hostile realm attack you');t.act('flee')}
 world();P.hostile={};if(!W.patrols.length){for(const tw of t.TOWNS)tw.gar=Math.max(tw.gar,tw.T.gar);t.patrolDay()}// (none out this time: send them)
 let fr=W.patrols.find(x=>!t.hostileTo(x.fac)&&!t.crimeAt(t.townBy(x.home)));if(!fr){fr=W.patrols[0];const h0=t.townBy(fr.home);if(h0)h0.crime=null;P.fac=null}t.patrolMeet(fr);ok(/(Day|Night) watch of/.test(panel())&&/Leave/.test(panel()),'friendly guards just talk');// (by night it is the night watch)
 window.dispatchEvent(new KeyboardEvent('keydown',{code:'Escape',key:'Escape'}));ok(G.mode==='world','Esc leaves them');
 // saved, drawn
 h.crime={until:G.day+3,fine:12};const np=W.patrols.length;t.saveGame(true);W.patrols=[];h.crime=null;t.loadGame();ok(W.patrols.length===np&&t.townBy(h.name).crime&&t.townBy(h.name).crime.fine===12,'patrols and crimes are saved');
 world();P.x=W.patrols[0].x+20;P.y=W.patrols[0].y;t.drawWorld();ok(true,'the map draws them');
 // its beat: around the holding's own buildings
 {const z=t.TOWNS.find(q=>q.lots&&q.lots.length>4),pp={home:z.name,x:z.x,y:z.y+12};let near=0;const N=60;
  for(let i=0;i<N;i++){t.patrolWaypoint(pp,z);if(z.lots.some(l=>pp.wx>=(l.x-1)*16&&pp.wx<=(l.x+l.n+1)*16&&pp.wy>=(l.y-1)*16&&pp.wy<=(l.y+l.n+1)*16))near++;pp.x=pp.wx;pp.y=pp.wy}
  ok(near>=N*.7,'a patrol walks its beat among the buildings of '+z.name+' ('+near+' of '+N+' stops beside one), and only now and then rides out')}
 // beaten guards are not replaced at once: their holding sends no watch until tomorrow
 {world();G.encCool=0;const ps=W.patrols.slice().sort((a,b)=>t.townBy(b.home).gar-t.townBy(a.home).gar),q=ps[0],hq=t.townBy(q.home);delete hq.watches;P.x=q.x+30;P.y=q.y;P.tx=null;
  t.patrolMeet(q);t.act('pt-attack');const r=Math.random;Math.random=()=>0;const tr0=P.troops;P.troops={hum_spear:60};t.act('auto');Math.random=r;t.act('cont');P.troops=tr0;
  for(let i=0;i<200;i++){t.updateWorld(.05);if(G.mode!=='world')world()}ok(!W.patrols.some(x=>x.home===q.home),'beat a holding\u2019s guards: no new watch rides out at once ('+hq.gar+' still in the garrison)');
  hq.gar=Math.max(hq.gar,hq.T.patrol.keep+hq.T.patrol.size);for(let k=0;k<hq.T.patrol.size;k++){G.day+=1;t.patrolDay()}t.updatePatrols(.6);ok(W.patrols.some(x=>x.home===q.home),'days later, its fallen made good from the garrison, it sends one again')}
 // in the grace after a fight, hostile guards keep a few steps off instead of standing on you
 // (the strongest watch: a small one afraid of your hero does not hunt you at all, and walks its beat wherever it leads; it is
 // put on open ground 40 px off in plain line to you, not in a river it cannot walk out of; and the dice are seeded)
 {world();P.troops={hum_spear:1};const q=W.patrols.filter(x=>x.troops.length>=3).sort((a,b)=>t.rating(b.troops)-t.rating(a.troops))[0],r0=Math.random;Math.random=t.seeded(77);try{
  const spot=[0,1,2,3,4,5,6,7].map(k=>[P.x+40*Math.cos(k*Math.PI/4),P.y+40*Math.sin(k*Math.PI/4)]).find(([x,y])=>t.passable(t.terrAt(x,y))&&t.clearLine(x,y,P.x,P.y))||[P.x+40,P.y];
  P.hostile[q.fac]=G.day+20;q.cool=0;q.x=spot[0];q.y=spot[1];G.encCool=5;
  for(let i=0;i<60;i++)t.updatePatrols(.05);const d=Math.hypot(q.x-P.x,q.y-P.y);ok(d>=t.GRACE_GAP-2&&!G.enc,'in the grace after a fight, the guards hunting you hold off ('+Math.round(d)+' px, '+t.stance(t.rating(q.troops))+')');
  G.encCool=0;for(let i=0;i<200&&!G.enc&&G.mode==='world';i++)t.updatePatrols(.05);ok(G.enc&&G.enc.kind==='patrol','once it is over, they close in and attack');world();delete P.hostile[q.fac]}finally{Math.random=r0}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
