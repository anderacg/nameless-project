'use strict';
// Estates, walls and folk: what each holding has built and where; prices and fief income from estates; building in your fief;
// walls in sieges (defender level, AI siege length, garrison cap, breach on capture); raids and sacks burn estates;
// farmers and woodcutters walking to work; caravans carrying goods, being robbed, traded with and attacked; saves; each estate's
// pieces (ground, boats, herd, workers) stay with it.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];W.lords=[];t.bandits.length=0;G.quietEvents=true;
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 // estates where the land suits them
 ok(TW.every(x=>x.bld&&x.wall!=null),'every holding has estates and a wall level');
 const spotsOk=TW.every(x=>(x.lots||[]).filter(l=>t.ESTATES[l.k]).every(l=>{let ok=true;for(let j=0;j<l.n;j++)for(let i=0;i<l.n;i++)ok=ok&&t.lotGround[t.groundOf(l.k)](l.x+i,l.y+j);return ok}));
 ok(spotsOk,'every estate stands on land that suits it (fields on open ground, woodcutters in forest, mines by rock, ports on the shore)');
 ok(TW.every(x=>Object.keys(x.bld).every(k=>x.bld[k]<=t.bldCap(x,k))),'no estate where the land has no room for it');
 const ports=TW.filter(x=>x.style==='port');ok(ports.length&&ports.every(x=>x.bld.port),'port towns have ports ('+ports.filter(x=>x.bld.port).map(x=>x.name).join(', ')+')');
 ok(TW.filter(x=>x.kind==='village').every(x=>x.bld.farm>0||!t.canHave(x,'farm')),'villages farm');
 ok(t.wallOf(t.townBy('Highmoor'))===3&&t.wallOf(t.townBy('Ashford'))===3&&t.wallOf(t.townBy('Oakhurst'))===2&&t.wallOf(t.townBy('Thornwick'))===0,'castles and cities start with great walls, towns stone, villages none');
 const n=TW.reduce((a,x)=>a+t.bldTotal(x),0);ok(n>TW.length*3,n+' estate levels across Ashmark');
 // prices: estates make their goods cheaper
 const ash=t.townBy('Ashford');const g0=ash.bld.farm;ash.bld.farm=0;const o0=t.produce(ash,null).grain||0;ash.bld.farm=3;const o3=t.produce(ash,null).grain||0;ash.bld.farm=g0;
 ok(o3>=12&&o3>o0,'three levels of farmland grow '+o3+' grain a day into the stores');
 // your fief: income, building, walls
 ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;ash.wall=2;// (a city starts with great walls: take them down a step to build them back)
 ok(t.fiefIncome(ash)===t.taxOf(ash)&&t.fiefIncome(ash)>0,'a fief pays its taxes: '+t.fiefIncome(ash)+' gold a day');
 G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ash);t.act('tab','fief');const pan=()=>document.getElementById('panel').innerHTML;
 {const lists=/Walls and estates/.test(pan())&&/Farmland/.test(pan());t.act('bld','wall');ok(lists&&/Fortify/.test(pan()),'the Fief tab lists walls and estates (on the holding rail; the walls window fortifies)');t.act('tab','fief')}
 Object.assign(ash.stock,{timber:300,stone:300,tools:60,iron:60});P.gold=5000;const lv0=ash.bld.market;t.act('fief-build','market');ok(ash.work&&ash.work.k==='market'&&P.gold<5000,'building starts and costs gold');
 const g1=P.gold;t.act('fief-build','farm');ok(P.gold===g1,'one project at a time');
 t.act('leave');done();G.day=ash.work.done;t.estateDay();ok(ash.bld.market===lv0+1&&!ash.work,'the market reaches level '+(lv0+1));
 ash.wall=2;t.enterTown(ash);t.act('tab','fief');t.act('fief-build','wall');t.act('leave');done();G.day=ash.work.done;t.estateDay();ok(ash.wall===3,'fortifying raises stone walls to great walls');
 ok(t.fiefCap(ash)===ash.T.gar+6+9,'great walls hold a bigger garrison ('+t.fiefCap(ash)+')');
 // walls in sieges
 const hm=t.townBy('Highmoor');ok(t.siegeLv(hm)===4,'great walls: defenders fight as level 4');hm.wall=0;ok(t.siegeLv(hm)===1,'without walls, level 1');hm.wall=3;
 const vil=t.townBy('Thornwick');vil.wall=1;ok(t.siegeLv(vil)===2,'a village palisade makes its militia level 2');vil.wall=0;
 {const keep={...ash.stock};t.FOODS.forEach(g=>ash.stock[g]=0);ash.stock.grain=200;const d1=t.foodDays(ash);ash.stock.grain=0;ok(d1>3&&t.foodDays(ash)===0,'a besieged holding lives on its stores: '+d1+' days of food in its granaries');ash.stock=keep}
 // AI siege: takes 2 + wall days
 {const tgt=t.townBy('Saltmere'),att=t.FIDS.find(f=>f!==tgt.owner);W.rel={};t.setRel(att,tgt.owner,'war');tgt.wall=3;
  W.lords=[t.asParty({id:'x0',name:'Test Lord',fac:att,x:tgt.x+16,y:tgt.y+12,troops:Array(60).fill('hum_knight'),state:'siege',tgt:tgt.name,sd:0,cool:0,dead:false,gone:false,back:0})];
  const own0=tgt.owner;for(let i=0;i<4;i++)t.worldDay();ok(tgt.owner===own0,'great walls hold for more than 4 days');t.worldDay();
  ok(tgt.owner===att&&tgt.wall===2,'after 5 days it falls, and the breach costs a wall level');W.lords=[]}
 // war burns estates
 {const v=t.townBy('Brookhollow');const b0=t.bldTotal(v);const out=t.burnEstates(v,2);ok(t.bldTotal(v)===b0-out.length&&out.length===2,'a sack burns two estates ('+out.join(', ')+')')}
 // AI builds over time
 {const f=TW.filter(x=>x.owner!=='player'),b0=f.reduce((a,x)=>a+t.bldTotal(x)+t.wallOf(x),0);for(let i=0;i<40;i++){G.day++;t.estateDay()}const b1=f.reduce((a,x)=>a+t.bldTotal(x)+t.wallOf(x),0);ok(b1>b0,'realms build and fortify over time ('+b0+' → '+b1+')')}
 // folk: every estate's workers work inside it (in the morning and at midday some out on its ground: tests/fieldwork.js), and
 // carry the day's load to the holding between the afternoon and dusk
 W.folk=[];P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.02;for(let i=0;i<300;i++)t.updateFolk(.05);
 const ws=W.folk.filter(f=>f.home==='Ashford');ok(ws.length>=2,ws.length+' workers from Ashford: '+[...new Set(ws.map(f=>f.job))].join(', '));
 ok(ws.every(f=>f.st==='in'&&!t.folkOut(f)),'at dawn they are all at work inside their estates (unseen)');
 {const f=ws[0],o=t.pickAt(f.x,f.y-4);ok(!o||o!==f,'one at work inside is not picked by a click (his estate is): '+(o&&(o.k||o.name||o.job)))}
 {let out=0,town=0,back=0,loaded=false;for(let i=0;i<4000;i++){G.clock=Math.min(t.DAY*.69,t.DAY*(.4+i*.00008));t.updateFolk(.05);const a=W.folk.filter(f=>f.home==='Ashford');
    out=Math.max(out,a.filter(f=>f.st==='out').length);town=Math.max(town,a.filter(f=>f.st==='town').length);back=Math.max(back,a.filter(f=>f.st==='back').length)}
  ok(out>0&&town>0&&back>0,'between the afternoon and dusk they carry their load to the holding and walk back (out '+out+', in town '+town+', back '+back+')');
  for(let i=0;i<2000&&W.folk.some(f=>f.home==='Ashford'&&f.st!=='in');i++){G.clock=t.DAY*.75;t.updateFolk(.05)}
  ok(W.folk.filter(f=>f.home==='Ashford').every(f=>f.st==='in'&&f.done===G.day),'by night all have delivered and gone back inside')}
 {const night=W.folk.filter(f=>f.home==='Ashford'),k=night[0].k,n0=night.filter(f=>f.k===k).length;t.estateMeet(t.estatePick(ash,k));ok(document.querySelector('.rail [data-act="es-tab"][data-arg="folk"]'),'the estate offers its '+t.ESTATES[k].work+'s');
  P.gold=500;P.troops={};t.act('es-folk');ok(G.mode==='dialog'&&document.querySelector('#panel [data-act="wk-hire"]'),'and talking to them opens the worker dialog');
  t.act('wk-back');ok(G.est&&document.querySelector('.rail [data-act="es-tab"][data-arg="folk"]'),'Back returns to the estate');t.act('es-folk');t.act('wk-hire');
  ok(W.folk.filter(f=>f.home==='Ashford'&&f.k===k).length===n0-1,'hiring one takes him from the estate');G.mode='world';G.modal=false;t.hidePanel()}
 // caravans
 W.caravans=[];const from=t.townBy('Saltmere');from.owner=t.HOME.Saltmere;from.sacked=from.raided=0;const fill=()=>{from.stock.cloth=400;from.stock.timber=400};fill();let c=null;for(let i=0;i<20&&!c;i++)c=t.sendCaravan(from);
 ok(c&&Object.keys(c.goods).length&&c.to!==c.from,'a caravan sets out from '+(c&&c.from)+' to '+(c&&c.to)+' with '+(c&&t.cargoText(c)));
 const to=t.townBy(c.to),gk=Object.keys(c.goods)[0],before=to.stock[gk]||0,load=c.goods[gk];P.x=-9999;P.y=-9999;for(let i=0;i<4000&&W.caravans.includes(c);i++)t.updateCaravans(.05);
 ok(!W.caravans.includes(c)&&(to.stock[gk]||0)>=before+load-2,'it travels the roads and its '+load+' '+gk+' arrive in the stores of '+c.to);
 fill();c=t.sendCaravan(from);W.caravans=[c];c.guards=3;W.patrols=[];W.lords.forEach(l=>{if(!l.inside&&Math.hypot(l.x-c.x,l.y-c.y)<150)l.x=-999});// (no one rides to help)
 t.bandits.push(t.asParty({x:c.x+4,y:c.y,n:12,kind:'bandits',list:Array(12).fill('militia'),t:0,a:0,idle:true,cool:0}));t.updateCaravans(.01);for(let i=0;i<4000&&W.fights.length;i++)t.updateFights(.05);
 ok(!W.caravans.length,'a big band of bandits beats the guards and plunders a caravan');t.bandits.length=0;W.fights=[];
 fill();c=t.sendCaravan(from);W.caravans=[c];c.guards=6;t.bandits.push(t.asParty({x:c.x+4,y:c.y,n:3,kind:'bandits',list:Array(3).fill('militia'),t:0,a:0,idle:true,cool:0}));t.updateCaravans(.01);for(let i=0;i<4000&&W.fights.length;i++)t.updateFights(.05);
 ok(W.caravans.length===1&&!t.bandits.length&&!c.fight,'six guards beat three bandits, and the caravan goes on');t.bandits.length=0;W.fights=[];
 // trade with a caravan, then attack one
 fill();c=t.sendCaravan(from);W.caravans=[c];P.x=c.x;P.y=c.y;G.mode='world';G.modal=false;t.hidePanel();P.hostile={};P.fac=null;
 t.interact(c);ok(G.mode==='dialog'&&/Caravan of/.test(pan()),'meeting a caravan opens it');
 const g=Object.keys(c.goods)[0],have=t.goodN(g);P.gold=500;t.act('cv-buy',g);ok(t.goodN(g)>have,'you can buy from it');
 if(W.caravans.includes(c)){t.act('cv-attack');ok(G.enc&&G.enc.kind==='caravan'&&t.hostileTo(c.fac),'attacking makes its owner hostile and starts a fight');
  P.troops={hum_knight:20};t.autoResolve();ok(!W.caravans.includes(c)&&/take the caravan/.test(pan()),'winning takes its cargo and strongbox');t.act('cont');done()}
 // a raid burns an estate
 {const v=t.townBy('Millbrook');const b0=t.bldTotal(v);P.raid={town:v.name,t:0};t.finishRaid(v,1);ok(t.bldTotal(v)===b0-1,'a full raid burns an estate')}
 // saves
 G.mode='world';G.modal=false;t.hidePanel();ash.bld.mine=0;ash.bld.farm=2;ash.wall=3;fill(),W.caravans=[t.sendCaravan(from)].filter(Boolean);const nc=W.caravans.length;t.saveGame(true);ash.bld.farm=0;ash.wall=0;W.caravans=[];t.act('load');
 ok(t.townBy('Ashford').bld.farm===2&&t.townBy('Ashford').wall===3&&W.caravans.length===nc,'estates, walls and caravans survive a reload');
 // the clock: a day lasts 3 minutes at 1x (Phase 1, D9: it was 2); 60% daylight, 40% dusk, night and dawn
 {W.lords=[];t.bandits.length=0;W.monsters=[];W.critters=[];W.caravans=[];G.mode='world';G.modal=false;t.hidePanel();t.setSpeed(1);G.paused=false;G.clock=0;G.encCool=99;
  const far=[30,60,90,120,150].flatMap(x=>[30,60,90,120].map(y=>({x:(x+.5)*16,y:(y+.5)*16}))).filter(p=>t.passable(t.terrAt(p.x,p.y))).sort((a,b)=>Math.min(...t.TOWNS.map(o=>Math.hypot(o.x-b.x,o.y-b.y)))-Math.min(...t.TOWNS.map(o=>Math.hypot(o.x-a.x,o.y-a.y))))[0];
  P.x=far.x;P.y=far.y;P.tx=null;const d0=G.day;for(let i=0;i<179;i++){G.encCool=99;t.updateWorld(1)}const mid=G.day;for(let i=0;i<2;i++){G.encCool=99;t.updateWorld(1)}
  ok(mid===d0&&G.day===d0+1,'a day on the map lasts 180 seconds at 1x');
  G.clock=t.DAY*.49;const l=t.darkness();G.clock=t.DAY*.51;const dusk=t.darkness();G.clock=t.DAY*.75;const n=t.darkness();ok(l===0&&dusk>0&&dusk<1&&n===1,'daylight for half the day, then dusk and night ('+t.timeOfDay()+')');G.mode='world'}
 // ---- each estate's pieces stay with it: its fields, pens, pits and pier (estateGround), a port's moored boats (estateBoats), a
 // pasture's herd (critters.js penSpots) and its workers. Kept on the estate's lot: pulled down and placed again elsewhere (or a
 // holding of the same name in another world), its pieces are drawn at the new place, never the old
 {const TILE=t.TILE,bad=[],kinds=new Set();
  for(const x of TW)for(const l of x.lots||[]){const k=l.k,lv=t.bldLv(x,k);if(!t.ESTATES[k]||!lv)continue;const g=t.estateGround(x,k,lv);if(!g)continue;kinds.add(k);
    const tiles=[[l.x,l.y],...t.plotsAt(x,k,lv)],inside=([tx,ty])=>tx*TILE>=g.x&&ty*TILE>=g.y&&(tx+1)*TILE<=g.x+g.width&&(ty+1)*TILE<=g.y+g.height;
    if(!tiles.every(inside)||g.width>(l.n+8)*TILE*2)bad.push(x.name+' '+k);
    if(k==='port')for(const b of t.estateBoats(x,lv)){const pr=t.pierOf(x);if(!pr||Math.hypot(b.x-pr.x,b.y-pr.y)>10+lv*6+40)bad.push(x.name+' boat')}}
  ok(!bad.length&&kinds.size>=5,'every estate\'s ground lies on its own lot and fields, every moored boat by its pier ('+[...kinds].join(', ')+')'+(bad.length?': '+bad.slice(0,4).join('; '):''));
  // pulled down and placed again three tiles east: its ground, and a port's boats, follow it
  const moved=[];for(const k of ['farm','pasture','quarry','lumber','mine','port']){const x=TW.find(z=>t.bldLv(z,k)&&t.lotAt(z,k)&&t.estateGround(z,k,t.bldLv(z,k)));if(!x)continue;const l=t.lotAt(x,k),lv=t.bldLv(x,k),g0=t.estateGround(x,k,lv),b0=k==='port'&&t.estateBoats(x,lv).map(b=>b.x);
    t.lotDrop(x,l);const n={...l,id:0,x:l.x+3,plots:(l.plots||[]).map(([a,b])=>[a+3,b])};for(const q of Object.keys(n))if(q[0]==='_')delete n[q];t.lotAdd(x,n);x._spots=null;
    const g1=t.estateGround(x,k,lv),b1=k==='port'&&t.estateBoats(x,lv).map(b=>b.x);moved.push(k+(g1&&g0&&g1!==g0&&(k==='port'||g1.x===g0.x+3*TILE&&g1.y===g0.y)?'':' STAYED')+(k==='port'&&b0&&b1&&b0.length?(b1.join()!==b0.join()?'':' boats STAYED'):''));
    t.lotDrop(x,n);t.lotAdd(x,l);x._spots=null}
  ok(moved.length>=4&&moved.every(m=>!/STAYED/.test(m)),'an estate placed again elsewhere draws its pieces there, not where it stood ('+moved.join(', ')+')');
  // its workers: those at work inside go with it; one out on the road goes home first
  {const x=TW.find(z=>Object.keys(t.bldSpots(z)).some(k=>t.bldLv(z,k)&&t.ESTATES[k].work)),k=Object.keys(t.bldSpots(x)).find(k=>t.bldLv(x,k)&&t.ESTATES[k].work),lv=t.bldLv(x,k);
   W.folk=[];t.FOLK_SEEN.clear();P.x=x.x;P.y=x.y+30;G.clock=t.DAY*.2;for(let i=0;i<5;i++)t.updateFolk(.05);t.updateFolk(60);const ws=W.folk.filter(f=>f.home===x.name&&f.k===k);ws.slice(1).forEach(f=>f.st='in');if(ws[0])ws[0].st='out';
   x.bld[k]=0;t.updateFolk(.05);const left=W.folk.filter(f=>f.home===x.name&&f.k===k);ok(ws.length>=2&&left.length===1&&left[0]===ws[0],'an estate burnt to nothing: its workers inside go with it, the one on the road walks home first ('+ws.length+' → '+left.length+')');
   x.bld[k]=lv;W.folk=[];t.FOLK_SEEN.clear()}}
 t.updateHUD(true);P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.2;for(let i=0;i<60;i++)t.updateFolk(.05);t.frame();ok(true,'estates, walls, folk and caravans draw');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
