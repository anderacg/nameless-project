'use strict';
// Estates, walls and folk: what each holding has built and where; prices and fief income from estates; building in your fief;
// walls in sieges (defender level, AI siege length, garrison cap, breach on capture); raids and sacks burn estates;
// farmers and woodcutters walking to work; caravans carrying goods, being robbed, traded with and attacked; saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];W.lords=[];t.bandits.length=0;G.quietEvents=true;
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 // estates where the land suits them
 ok(TW.every(x=>x.bld&&x.wall!=null),'every holding has estates and a wall level');
 const spotsOk=TW.every(x=>{const sp=t.bldSpots(x);return Object.keys(sp).every(k=>{const s=sp[k],g=t.ESTATES[k].ground;return t.GROUND[g](s.tx,s.ty)})});
 ok(spotsOk,'every estate stands on land that suits it (fields on open ground, woodcutters in forest, mines by rock, ports on the shore)');
 ok(TW.every(x=>Object.keys(x.bld).every(k=>x.bld[k]<=t.bldCap(x,k))),'no estate where the land has no room for it');
 const ports=TW.filter(x=>x.style==='port');ok(ports.length&&ports.every(x=>x.bld.port),'port towns have ports ('+ports.filter(x=>x.bld.port).map(x=>x.name).join(', ')+')');
 ok(TW.filter(x=>x.kind==='village').every(x=>x.bld.farm>0||!t.canHave(x,'farm')),'villages farm');
 ok(t.wallOf(t.townBy('Highmoor'))===3&&t.wallOf(t.townBy('Ashford'))===2&&t.wallOf(t.townBy('Thornwick'))===0,'castles start with great walls, towns stone, villages none');
 const n=TW.reduce((a,x)=>a+t.bldTotal(x),0);ok(n>TW.length*3,n+' estate levels across Ashmark');
 // prices: estates make their goods cheaper
 const ash=t.townBy('Ashford');const g0=ash.bld.farm;ash.bld.farm=0;const o0=t.produce(ash,null).grain||0;ash.bld.farm=3;const o3=t.produce(ash,null).grain||0;ash.bld.farm=g0;
 ok(o3>=12&&o3>o0,'three levels of farmland grow '+o3+' grain a day into the stores');
 // your fief: income, building, walls
 ash.owner='player';ash.lastOwner='player';ash.sacked=ash.raided=ash.turmoil=0;
 ok(t.fiefIncome(ash)===t.taxOf(ash)&&t.fiefIncome(ash)>0,'a fief pays its taxes: '+t.fiefIncome(ash)+' gold a day');
 G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(ash);t.act('tab','fief');const pan=()=>document.getElementById('panel').innerHTML;
 ok(/Walls and estates/.test(pan())&&/Farmland/.test(pan())&&/Fortify/.test(pan()),'the Fief tab lists walls and estates');
 Object.assign(ash.stock,{timber:300,stone:300,tools:60,iron:60});P.gold=5000;const lv0=ash.bld.market;t.act('fief-build','market');ok(ash.work&&ash.work.k==='market'&&P.gold<5000,'building starts and costs gold');
 const g1=P.gold;t.act('fief-build','farm');ok(P.gold===g1,'one project at a time');
 t.act('leave');done();G.day=ash.work.done;t.estateDay();ok(ash.bld.market===lv0+1&&!ash.work,'the market reaches level '+(lv0+1));
 ash.wall=2;t.enterTown(ash);t.act('tab','fief');t.act('fief-build','wall');t.act('leave');done();G.day=ash.work.done;t.estateDay();ok(ash.wall===3,'fortifying raises stone walls to great walls');
 ok(t.fiefCap(ash)===t.GARCAP.town+6+9,'great walls hold a bigger garrison ('+t.fiefCap(ash)+')');
 // walls in sieges
 const hm=t.townBy('Highmoor');ok(t.siegeLv(hm)===4,'great walls: defenders fight as level 4');hm.wall=0;ok(t.siegeLv(hm)===1,'without walls, level 1');hm.wall=3;
 const vil=t.townBy('Thornwick');vil.wall=1;ok(t.siegeLv(vil)===2,'a village palisade makes its militia level 2');vil.wall=0;
 {const keep={...ash.stock};t.FOODS.forEach(g=>ash.stock[g]=0);ash.stock.grain=200;const d1=t.foodDays(ash);ash.stock.grain=0;ok(d1>3&&t.foodDays(ash)===0,'a besieged holding lives on its stores: '+d1+' days of food in its granaries');ash.stock=keep}
 // AI siege: takes 2 + wall days
 {const tgt=t.townBy('Saltmere'),att=t.FIDS.find(f=>f!==tgt.owner);W.rel={};t.setRel(att,tgt.owner,'war');tgt.wall=3;
  W.lords=[{id:'x0',name:'Test Lord',fac:att,x:tgt.x+16,y:tgt.y+12,troops:Array(60).fill('hum_knight'),state:'siege',tgt:tgt.name,sd:0,cool:0,dead:false,gone:false,back:0}];
  const own0=tgt.owner;for(let i=0;i<4;i++)t.worldDay();ok(tgt.owner===own0,'great walls hold for more than 4 days');t.worldDay();
  ok(tgt.owner===att&&tgt.wall===2,'after 5 days it falls, and the breach costs a wall level');W.lords=[]}
 // war burns estates
 {const v=t.townBy('Brookhollow');const b0=t.bldTotal(v);const out=t.burnEstates(v,2);ok(t.bldTotal(v)===b0-out.length&&out.length===2,'a sack burns two estates ('+out.join(', ')+')')}
 // AI builds over time
 {const f=TW.filter(x=>x.owner!=='player'),b0=f.reduce((a,x)=>a+t.bldTotal(x)+t.wallOf(x),0);for(let i=0;i<40;i++){G.day++;t.estateDay()}const b1=f.reduce((a,x)=>a+t.bldTotal(x)+t.wallOf(x),0);ok(b1>b0,'realms build and fortify over time ('+b0+' → '+b1+')')}
 // folk: workers walk out by day
 W.folk=[];P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.2;for(let i=0;i<300;i++)t.updateFolk(.05);
 const ws=W.folk.filter(f=>f.home==='Ashford');ok(ws.length>=2,ws.length+' workers from Ashford: '+[...new Set(ws.map(f=>f.job))].join(', '));
 ok(ws.some(f=>f.st==='work'),'some reach their estate and work');
 G.clock=t.DAY*.7;for(let i=0;i<400;i++)t.updateFolk(.05);ok(!W.folk.some(f=>f.home==='Ashford'&&f.st!=='back'),'at dusk they all head home');
 // caravans
 W.caravans=[];const from=t.townBy('Saltmere');from.owner=t.HOME.Saltmere;from.sacked=from.raided=0;const fill=()=>{from.stock.cloth=400;from.stock.timber=400};fill();let c=null;for(let i=0;i<20&&!c;i++)c=t.sendCaravan(from);
 ok(c&&Object.keys(c.goods).length&&c.to!==c.from,'a caravan sets out from '+(c&&c.from)+' to '+(c&&c.to)+' with '+(c&&t.cargoText(c)));
 const to=t.townBy(c.to),gk=Object.keys(c.goods)[0],before=to.stock[gk]||0,load=c.goods[gk];P.x=-9999;P.y=-9999;for(let i=0;i<4000&&W.caravans.includes(c);i++)t.updateCaravans(.05);
 ok(!W.caravans.includes(c)&&(to.stock[gk]||0)>=before+load-2,'it travels the roads and its '+load+' '+gk+' arrive in the stores of '+c.to);
 fill();c=t.sendCaravan(from);W.caravans=[c];c.guards=3;t.bandits.push({x:c.x+4,y:c.y,n:12,kind:'bandits',list:Array(12).fill('militia'),t:0,a:0,idle:true,cool:0});t.updateCaravans(.01);
 ok(!W.caravans.length,'a big band of bandits plunders a caravan');t.bandits.length=0;
 fill();c=t.sendCaravan(from);W.caravans=[c];c.guards=6;t.bandits.push({x:c.x+4,y:c.y,n:3,kind:'bandits',list:Array(3).fill('militia'),t:0,a:0,idle:true,cool:0});t.updateCaravans(.01);
 ok(W.caravans.length===1,'six guards drive off three bandits');t.bandits.length=0;
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
 // the clock: a day lasts 2 minutes at 1x; 60% daylight, 40% dusk, night and dawn
 {W.lords=[];t.bandits.length=0;W.monsters=[];W.critters=[];W.caravans=[];G.mode='world';G.modal=false;t.hidePanel();t.setSpeed(1);G.paused=false;G.clock=0;G.encCool=99;
  const far=[30,60,90,120,150].flatMap(x=>[30,60,90,120].map(y=>({x:(x+.5)*16,y:(y+.5)*16}))).filter(p=>t.passable(t.terrAt(p.x,p.y))).sort((a,b)=>Math.min(...t.TOWNS.map(o=>Math.hypot(o.x-b.x,o.y-b.y)))-Math.min(...t.TOWNS.map(o=>Math.hypot(o.x-a.x,o.y-a.y))))[0];
  P.x=far.x;P.y=far.y;P.tx=null;const d0=G.day;for(let i=0;i<119;i++){G.encCool=99;t.updateWorld(1)}const mid=G.day;for(let i=0;i<2;i++){G.encCool=99;t.updateWorld(1)}
  ok(mid===d0&&G.day===d0+1,'a day on the map lasts 120 seconds at 1x');
  G.clock=t.DAY*.59;const l=t.darkness();G.clock=t.DAY*.61;const dusk=t.darkness();G.clock=t.DAY*.8;const n=t.darkness();ok(l===0&&dusk>0&&dusk<1&&n===1,'daylight for 60% of the day, then dusk and night ('+t.timeOfDay()+')');G.mode='world'}
 t.updateHUD(true);P.x=ash.x;P.y=ash.y+40;G.clock=t.DAY*.2;for(let i=0;i<60;i++)t.updateFolk(.05);t.frame();ok(true,'estates, walls, folk and caravans draw');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
