'use strict';
// People: refugees leave ruined holdings and settle elsewhere; you can talk to, hire, rob or press-gang workers; feed, settle,
// recruit or rob refugees; plunder or burn estates; demand tolls from caravans or seize them; corner fleeing bandits and lords
// and take their surrender. Every deed has a cost or a reward. Big hosts look big on the map. Refugees are saved.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');t.bandits.length=0;W.monsters=[];G.quietEvents=true;
 const rnd=Math.random,fix=v=>{Math.random=()=>v},unfix=()=>{Math.random=rnd};
 const world=()=>{G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null};
 const panel=()=>document.getElementById('panel').innerHTML;
 // ---- refugees
 TW.forEach(x=>{t.ensureEcon(x);x.pros=70});const src=TW.find(x=>x.kind==='town'&&x.owner&&x.owner!=='player'&&(x.pros=30,t.refuge(x))),pop0=src.pop;
 src.sacked=G.day+10;ok(t.fleeReason(src)==='sacked','a sacked holding gives its people a reason to leave');
 W.refugees=[];fix(.01);t.refugeeDay();unfix();
 const r=W.refugees.find(x=>x.from===src.name);ok(r&&src.pop===pop0-r.n&&r.n>=4,'its people set out for '+(r&&r.to)+' and leave '+src.name+' ('+pop0+' → '+src.pop+')');
 const dst=t.townBy(r.to),dpop=dst.pop;ok(dst!==src&&!t.atWar(dst.owner,src.owner),'they head for a friendly holding that is better off');
 P.x=0;P.y=0;let steps=0;while(W.refugees.includes(r)&&steps++<40000)t.updateRefugees(.05);
 ok(!W.refugees.includes(r)&&dst.pop>=dpop+r.n,'they walk there and join its people ('+dpop+' → '+dst.pop+')');
 src.sacked=0;
 // meeting refugees: feed, recruit, settle, rob
 const mk=()=>{const g=t.sendRefugees(src,dst,'hunger');g.x=P.x=src.x+60;g.y=P.y=src.y+60;return g};
 world();let g=mk();t.invAdd('good','grain',20);const rep0=t.repAt(src.name);t.interact(g);
 ok(G.rf===g&&/Refugees from/.test(panel()),'clicking refugees you reach opens a talk with them');
 t.act('rf-feed');ok(g.fed&&t.repAt(src.name)>rep0,'sharing food raises your name where they came from');t.act('dlg-ok');
 const lv=t.RACES[g.race].melee,had=P.troops[lv]||0,n0=g.n;world();t.interact(g);t.act('rf-recruit');ok((P.troops[lv]||0)>had&&g.n<n0,'some of them take up arms with you, and fewer arrive');t.act('dlg-ok');
 const fief=TW.find(x=>x!==src&&x!==dst&&x.kind==='village'),fo=fief.owner;fief.owner='player';world();t.interact(g);t.act('rf-settle');
 ok(g.to===fief.name,'they can be offered a home in your fief');t.act('dlg-ok');fief.owner=fo;
 g=mk();world();const gold0=P.gold,rep1=t.repAt(src.name),h0=t.honorWith(src.owner);t.interact(g);t.act('rf-rob');
 ok(P.gold>gold0&&t.repAt(src.name)<rep1-10&&t.honorWith(src.owner)<h0&&g.fear,'robbing them pays, shames you in '+src.name+' and with its lord, and they fear you');t.act('dlg-ok');
 // ---- workers
 W.refugees=[];const wt=TW.find(x=>x.owner&&x.owner!=='player'&&Object.keys(t.bldSpots(x)).some(k=>t.bldLv(x,k)&&t.ESTATES[k].work));
 P.x=wt.x+30;P.y=wt.y+30;G.clock=t.DAY*.25;W.folk=[];wt.fear=0;for(let i=0;i<300;i++)t.updateFolk(.05);
 const f=W.folk.find(x=>x.home===wt.name);ok(f,'workers walk out to the estates of '+wt.name);
 world();P.x=f.x;P.y=f.y;t.interact(f);ok(G.wk===f&&/We |Good times|bread/.test(panel()),'a worker tells you how '+wt.name+' fares');
 const ws=t.workerScale(wt),wr=t.repAt(wt.name);t.act('wk-rob');
 ok(t.repAt(wt.name)<wr&&wt.fear>G.day&&t.workerScale(wt)<=ws*.5+1e-9,'robbing a worker costs reputation and frightens the fields: half the work for days');t.act('dlg-ok');
 for(let i=0;i<60;i++)t.updateFolk(.05);ok(!W.folk.some(x=>x.home===wt.name&&x.st!=='back'),'and the workers go home');
 wt.fear=0;W.folk=[];for(let i=0;i<300;i++)t.updateFolk(.05);const f2=W.folk.find(x=>x.home===wt.name);
 if(f2){world();P.x=f2.x;P.y=f2.y;const pp=wt.pop,tc=t.troopCount();t.interact(f2);t.act('wk-press');ok(t.troopCount()===tc+1&&wt.pop===pp-1&&!W.folk.includes(f2),'press-ganging a worker adds a soldier and takes one of '+wt.name+'\'s people');t.act('dlg-ok')}
 else ok(false,'a second worker to press-gang');
 // ---- estates
 wt.fear=0;const ek=Object.keys(t.bldSpots(wt)).find(k=>t.bldLv(wt,k)),sp=t.bldSpots(wt)[ek];world();P.x=sp.x+20;P.y=sp.y+20;
 const pick=t.pickAt(sp.x,sp.y);ok(pick&&pick.est&&pick.k===ek,'estates on the map can be clicked');
 P.troops={hum_knight:25};P.hostile={};world();P.x=sp.x;P.y=sp.y;t.interact(pick);ok(G.est&&/Plunder its stores/.test(panel()),'an estate offers plunder or burning');
 const own=wt.owner,lv0=t.bldLv(wt,ek),pr0=wt.pros;t.act('es-burn');
 ok(G.enc&&G.enc.kind==='estate'&&t.hostileTo(own),'attacking an estate means fighting its guards, and its realm turns hostile');
 t.act('auto');ok(/burn the/.test(panel())&&t.bldLv(wt,ek)===lv0-1&&wt.pros<pr0,'burning it knocks it down a level ('+lv0+' → '+t.bldLv(wt,ek)+') and impoverishes '+wt.name);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // ---- caravans: toll and seizure
 W.caravans=[];const ct=TW.find(x=>x.owner&&x.owner!==own&&!t.hostileTo(x.owner)&&t.surplusOf(x).length&&t.neediest(x,t.surplusOf(x)[0][0]));
 if(ct){const c=t.sendCaravan(ct);c.guards=1;world();P.x=c.x;P.y=c.y;const gd=P.gold,cr=t.repAt(ct.name);t.interact(c);t.act('cv-toll');
   ok(P.gold>gd&&t.repAt(ct.name)<cr&&c.tolled,'a weak caravan pays a toll to pass, at a cost to your name');t.act('cv-leave');
   const fz=TW.find(x=>x.kind==='village'&&x!==ct),fzo=fz.owner;fz.owner='player';world();t.interact(c);ok(/seize it for/.test(panel()),'with a fief, you can seize a caravan');
   t.act('cv-seize');t.act('auto');ok(c.mine&&c.fac==='player'&&c.to===t.nearestOf(c,t.playerFiefs()).name&&W.caravans.includes(c),'a seized caravan drives its cargo to your fief');t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
   fz.owner=fzo;W.caravans=[]}
 else ok(false,'a caravan to stop');
 // ---- cornered parties
 world();P.troops={hum_knight:8};P.prisoners={};const b={x:P.x+5,y:P.y,n:2,kind:'bandits',list:['militia','militia'],t:0,a:0,idle:false,cool:0};t.bandits.push(b);
 ok(t.cornered(b,'band'),'a small band is afraid of a big one');t.meetBand(b);ok(G.par&&/cornered/.test(panel()),'catching a band that fled from you opens a parley');
 fix(.01);t.act('pl-yield');unfix();ok(/throw down/.test(panel()),'it may yield');const pc=t.prisonerCount();t.act('pl-cage');
 ok(t.prisonerCount()===pc+2&&!t.bandits.includes(b),'and its fighters become your prisoners ('+pc+' → '+t.prisonerCount()+', cap '+t.prisonCap()+')');t.act('dlg-ok');
 const b2={x:P.x+5,y:P.y,n:2,kind:'bandits',list:['militia','spearman'],t:0,a:0,idle:false,cool:0};t.bandits.push(b2);world();t.meetBand(b2);fix(.01);t.act('pl-yield');unfix();
 P.wounded={};// (the wounded from earlier take room in the band)
 const tc2=t.troopCount(),hh=t.honorWith(t.FIDS[0]);t.act('pl-join');ok(t.troopCount()===tc2+2&&t.honorWith(t.FIDS[0])<hh,'or join your band, at a cost to your honor');t.act('dlg-ok');
 const b3={x:P.x+5,y:P.y,n:2,kind:'bandits',list:['militia','militia'],t:0,a:0,idle:false,cool:0};t.bandits.push(b3);world();t.meetBand(b3);fix(.99);t.act('pl-yield');unfix();
 ok(G.enc&&G.enc.ref===b3&&/Fight/.test(panel()),'if they refuse, they fight');t.act('flee');
 const l=W.lords.find(x=>!x.dead);l.troops=['hum_levy','hum_levy'];P.hostile[l.fac]=G.day+20;world();P.x=l.x;P.y=l.y;t.interact(l);
 ok(G.par&&G.par.o===l,'a weak enemy lord who is caught may be called on to yield');const lg=P.gold;fix(.01);t.act('pl-yield');unfix();
 ok(l.dead&&P.gold>lg&&/yields/.test(panel()),'the lord pays a ransom and the army is gone');t.act('dlg-ok');
 // ---- a big host looks big
 ok(t.hostSize(3)===0&&t.hostSize(12)>0&&t.hostSize(60)>t.hostSize(12),'followers grow with the army: '+[3,12,30,60].map(n=>n+' → '+t.hostSize(n)).join(', '));
 world();P.troops={hum_knight:40};W.refugees=[];t.sendRefugees(src,dst,'hunger');W.refugees[0].x=P.x+30;W.refugees[0].y=P.y;t.drawWorld();ok(true,'the map draws big hosts and refugees');
 // ---- saved
 t.saveGame(true);const nr=W.refugees.length;W.refugees=[];t.loadGame();ok(W.refugees.length===nr&&nr>0,'refugees on the road are saved');
 t.updateHUD(true);t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
