'use strict';
/* ---------- the economy: stock, production, people, prices and treasuries ---------- */
// Every holding keeps t.stock {good: n}. Each day its estates (staffed by its people) and its land produce, workshops turn
// inputs into goods, its people and garrison eat and use things up, food spoils, and what is left sets the price: scarce
// goods cost more, plentiful ones less, and each unit bought or sold moves the price. t.pop grows on full bellies and
// shrinks in famine; t.pros (0-100) follows how well needs are met and sets taxes, volunteers and growth.
// Realms keep W.treas[f]: taxes and tolls in, lords, garrisons, recruits and building out. How strictly armies depend on
// it is the Realm economy setting (ECON.mode): full (broke or hungry realms shrink), light (half costs, never collapses),
// off (armies as of old). The tables (what estates make, what people need, taxes) are in data/economy.js; caravans in caravans.js.
const ECON_KEY='ashmark.econ',ECON={mode:(()=>{try{return localStorage.getItem(ECON_KEY)||'full'}catch(e){return 'full'}})()};
function setEconMode(m){ECON.mode=ECON_MODES[m]?m:'full';try{localStorage.setItem(ECON_KEY,ECON.mode)}catch(e){}}

const T_GOODS=()=>Object.keys(GOODS);
const isFood=g=>!!GOODS[g].food;

/* setting a holding up: people, prosperity, and stock shaped by what it is known for (its old trade profile) */
function initEconomy(t){
  t.pop=t.T.pop0;t.pros=55;t.tax=1;t.vol=Math.round(t.pop/12);t.stock={};t.popF=0;t.hist=[];
  for(const g of T_GOODS()){const m=(t.mod&&t.mod[g])||1,tg=targetStock(t,g);t.stock[g]=Math.round(Math.max(2,tg)*Math.min(3,Math.pow(1/m,2))*(.8+Math.random()*.4))}
  // regional goods (metals, gems, rare fish, pearls): a store of what its own land yields, none of the rest
  for(const g of T_GOODS())if(GOODS[g].res)t.stock[g]=resOf(t)[g]?Math.round(Math.max(4,targetStock(t,g))*(1+Math.random())):0;
}
const ensureEcon=t=>{if(!t.stock)initEconomy(t)};

/* demand: what the people and garrison want each day, what workshops take, and what a building project still needs */
function needOf(t,g){
  const N=t.T.needs,per=t.pop/100;let n=0;
  if(isFood(g))n=(N.food*per+t.gar/4)/3;
  else n=((N[g]||0)+(t.T.wants[g]||0))*per;
  if(g==='furs'&&climAt(t.x,t.y)==='frost')n+=1.5*per;
  for(const k in MAKE){const i=MAKE[k].in;if(i&&i[g])n+=i[g]*bldLv(t,k)}
  const w=t.work&&projectNeed(t.work);if(w&&w[g])n+=w[g]/5;
  return n;
}
// a holding aims to keep ten days of what it needs; prices rise below that and fall above it
const targetStock=(t,g)=>Math.max(6,needOf(t,g)*10);
const storeCap=t=>t.T.store*(1+.5*bldLv(t,'granary'));
const foodStock=t=>FOODS.reduce((a,g)=>a+(t.stock[g]||0),0);
const foodNeed=t=>t.T.needs.food*t.pop/100+(t.gar+insideTroops(t).length)/4;
const foodDays=t=>Math.floor(foodStock(t)/Math.max(.1,foodNeed(t)));

/* prices: base x √(target ÷ stock), between 0.4x and 3x; ruin adds 40% */
function marketPrice(t,g){ensureEcon(t);const s=t.stock[g]||0,tg=targetStock(t,g);return Math.max(1,Math.round(GOODS[g].base*clamp(Math.sqrt(tg/(s+1)),.4,3)*(ruined(t)?1.4:1)))}
const marketState=(t,g)=>{const r=(t.stock[g]||0)/targetStock(t,g);return r<.35?'shortage':r>1.8?'surplus':''};
// take food from a stock, perishables first; returns how much it found
function takeFood(st,n){let left=n;for(const g of FOODS){if(left<=0)break;const k=Math.min(left,st[g]||0);st[g]-=k;left-=k}return n-left}

/* the day */
const workerScale=t=>{const need=Object.keys(MAKE).reduce((a,k)=>a+(MAKE[k].out&&Object.keys(MAKE[k].out).length?bldLv(t,k)*WORKERS:0),0);return (need?Math.min(1,t.pop*.6/need):1)*((t.fear||0)>G.day?.5:1)};
// what the land itself yields without any estate: a little food from open ground, timber from forest, stone from the hills
function landYield(){const y=TOWNS.map(()=>({grain:0,timber:0,stone:0}));if(typeof LAND==='undefined')return y;landFresh();
  for(let k=0;k<LAND.length;k++){const i=LAND[k];if(i<0)continue;const tt=tiles[k];if(tt===T_OPEN)y[i].grain+=1/50;else if(tt===T_FOREST)y[i].timber+=1/60;else if(tt===T_HILL)y[i].stone+=1/60}return y}
function produce(t,ly){
  const st=t.stock,ws=workerScale(t),clim=climAt(t.x,t.y),out={};
  const add=(g,n)=>{if(n<=0)return;const v=n+(Math.random()<n%1?1:0);st[g]=(st[g]||0)+Math.floor(v);out[g]=(out[g]||0)+Math.floor(v)};
  for(const k in MAKE){const lv=bldLv(t,k),M=MAKE[k];if(!lv||!M.out||sabotaged(t,k))continue;
    // workshops first take their inputs: as many batches as the stock allows; farms, pastures and quarries make what their fields allow
    let f=lv*ws*fieldShare(t,k)*handsLeft(t,k);if(M.in)for(const g in M.in)f=Math.min(f,(st[g]||0)/M.in[g]);if(f<=0)continue;
    if(M.in)for(const g in M.in)st[g]-=Math.round(M.in[g]*f);
    const O=k==='mine'||k==='port'?resOut(t,k):M.out;// mines and ports bring up what their land holds (resources.js)
    for(const g in O)add(g,O[g]*f*(k==='farm'?FARM_CLIM[clim]:1));
    if(k==='workshop'&&clim==='frost')add('furs',f)}
  if(ly){add('grain',ly.grain*FARM_CLIM[clim]);add('timber',ly.timber);add('stone',ly.stone)}
  return out;
}
function consume(t){
  const st=t.stock,N=t.T.needs,per=t.pop/100,use={};
  const fn=foodNeed(t),ate=takeFood(st,fn),fs=fn?ate/fn:1;use.food=ate;
  const kinds=FOODS.filter(g=>(st[g]||0)>0).length;
  let sum=fs*3,wt=3;
  for(const g in N){if(g==='food')continue;const n=N[g]*per+(g==='furs'&&climAt(t.x,t.y)==='frost'?1.5*per:0);if(n<=0)continue;const k=Math.min(n,st[g]||0);st[g]-=k;use[g]=k;sum+=k/n;wt++}
  // wants: taken when there is some, never missed (they do not touch contentment)
  const Wt=t.T.wants;for(const g in Wt){const k=Math.min(Wt[g]*per,st[g]||0);if(k>0){st[g]-=k;use[g]=(use[g]||0)+k}}
  return{fs,sat:sum/wt,kinds,use};
}
function spoil(t){const half=bldLv(t,'granary')?.5:1;for(const g of FOODS){const r=GOODS[g].spoil;if(r&&t.stock[g])t.stock[g]-=Math.floor(t.stock[g]*r*half+Math.random())}
  const cap=storeCap(t);for(const g in t.stock)t.stock[g]=Math.max(0,Math.min(cap,Math.round(t.stock[g])))}
// people grow when fed and content, starve in famine; prosperity follows needs, taxes and war
function people(t,c){
  const cap=Math.min(t.T.popCap*(1+.15*bldLv(t,'granary'))+Math.floor(landOf(t)/12),t.lots?housing(t):1e9);
  if(c.fs<1){t.pop=Math.max(10,t.pop-Math.ceil(t.pop*.03*(1-c.fs)));}
  else if(t.pros>40&&t.pop<cap){t.popF=(t.popF||0)+t.pop*.004*(t.pros/100);if(t.popF>=1){const k=Math.floor(t.popF);t.pop+=k;t.popF-=k}}
  let d=(c.sat*100-t.pros)*.08+(c.kinds>=3?.5:0)+[1,0,-1.5][t.tax==null?1:t.tax];
  if(until(t,'turmoil'))d-=2;if(ruined(t))d-=3;if(besieged(t))d-=1.5;
  t.pros=clamp(t.pros+d,0,100);
  t.vol=Math.min(Math.round(t.pop/10),(t.vol||0)+t.pop/150*(t.pros/60));
}
// a day's taxes at the holding's rate (fiefs pay you; the rest pay their realm), plus market dues
const taxOf=(t,rate)=>ruined(t)?0:Math.round(t.pop*TAX_RATE[rate==null?(t.tax==null?1:t.tax):rate]*(.4+t.pros/100)*(until(t,'turmoil')?.5:1)+3*bldLv(t,'market'));

const treas=f=>{if(W.treas[f]==null)W.treas[f]=TREAS0+60*fiefsOf(f).length;return W.treas[f]};
// pay for something a realm wants: gold from its treasury, food from a holding's stock; false if it cannot (never in off mode)
function payRealm(f,gold,t,food){
  if(ECON.mode==='off'||!f||f==='player')return true;const light=ECON.mode==='light';gold*=light?.5:1;
  if(treas(f)-gold<(light?-400:0))return false;
  if(food&&t){ensureEcon(t);if(foodStock(t)<food&&!light)return false;takeFood(t.stock,food)}
  W.treas[f]-=gold;return true;
}
// give back what payRealm took (a project that could not start after all)
function refundRealm(f,gold){if(ECON.mode==='off'||!f||f==='player')return;W.treas[f]+=gold*(ECON.mode==='light'?.5:1)}
// is a realm worn out by its economy (broke, or a third of its holdings hungry)? it leans toward peace
const econWeary=f=>ECON.mode!=='off'&&(treas(f)<0||fiefsOf(f).filter(t=>t.stock&&foodDays(t)<2).length>fiefsOf(f).length/3);
function realmDay(){
  for(const f of FIDS){if(W.dead[f])continue;treas(f);
    const own=fiefsOf(f),lords=W.lords.filter(l=>l.fac===f&&!l.dead);
    W.treas[f]+=own.reduce((a,t)=>a+taxOf(t,1),0)+(W.tolls&&W.tolls[f]||0);
    if(ECON.mode==='off')continue;
    const light=ECON.mode==='light',upkeep=(lords.reduce((a,l)=>a+l.troops.length*.6,0)+own.reduce((a,t)=>a+t.gar*.4,0))*(light?.5:1);W.treas[f]-=Math.round(upkeep);
    // armies eat from the realm's best-stocked holdings
    let hungry=0;for(const l of lords){const need=Math.ceil(l.troops.length/6),src=own.slice().sort((a,b)=>foodStock(b)-foodStock(a))[0];const got=src?takeFood(src.stock,need):0;if(got<need)hungry++}
    if(!light&&(W.treas[f]<0||hungry))for(const l of lords){if(l.troops.length>4&&(W.treas[f]<0||hungry&&Math.random()<.5)){const n=Math.max(1,Math.round(l.troops.length*.06));l.removeAny(n)}}
    if(!light&&(W.treas[f]<0||hungry)&&(f===P.fac||Math.random()<.1)&&G.day%3===0)log('The '+FACS[f].n+(W.treas[f]<0?' cannot pay its soldiers':' cannot feed its armies')+'. Men desert.',f===P.fac?'bad':'')}
  W.tolls={};
}
function econDay(){
  const ly=landYield();
  TOWNS.forEach((t,i)=>{ensureEcon(t);const out=produce(t,ly[i]),c=consume(t);spoil(t);people(t,c);t.last={out,use:c.use,fs:c.fs,sat:c.sat}});
  realmDay();
}

/* trading with a holding's market: each unit changes its stock, and so the next unit's price */
const spreadBuy=()=>1.08*(1-.015*skill('trade')),spreadSell=()=>.92*(1+.01*skill('trade'));
function buyGoods(t,g,n){ensureEcon(t);let got=0,spent=0;for(let i=0;i<n;i++){if((t.stock[g]||0)<1)break;const p=Math.max(1,Math.ceil(marketPrice(t,g)*spreadBuy()));if(P.gold<p||goodRoom(g)<1)break;
    P.gold-=p;spent+=p;t.stock[g]--;invAdd('good',g,1);got++}
  if(got&&isFood(g)&&foodDays(t)<3){addRep(t.name,-got/2,true);log('The people of '+t.name+' watch you carry off food they need.','bad')}
  return{got,spent};}
function sellGoods(t,g,n){ensureEcon(t);let sold=0,earned=0;for(let i=0;i<n;i++){if(goodN(g)<1)break;const p=Math.max(1,Math.floor(marketPrice(t,g)*spreadSell()));goodTake(g,1);t.stock[g]=(t.stock[g]||0)+1;P.gold+=p;earned+=p;sold++}
  return{sold,earned};}
const nextBuy=(t,g)=>Math.max(1,Math.ceil(marketPrice(t,g)*spreadBuy())),nextSell=(t,g)=>Math.max(1,Math.floor(marketPrice(t,g)*spreadSell()));

const projectNeed=w=>w.k==='wall'?WALL_MAT[w.lv]:ESTATE_MAT(w.k,w.lv);
const matsLacking=(t,mats)=>{ensureEcon(t);return Object.keys(mats).filter(g=>(t.stock[g]||0)<mats[g]).map(g=>(mats[g]-(t.stock[g]||0))+' '+GOODS[g].n.toLowerCase())};
const takeMats=(t,mats)=>{for(const g in mats)t.stock[g]-=mats[g]};
const matsText=m=>Object.keys(m).map(g=>m[g]+' '+GOODS[g].n.toLowerCase()).join(', ');

/* the fief panel: people, taxes, the stores, and the caravans you send from here */
function fiefEconBody(t){
  ensureEcon(t);const L=t.last||{out:{},use:{}},b=(act,arg,label,why,on)=>'<button class="btn sm'+(on?' on':'')+'" type="button" data-act="'+act+'" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const goods=Object.keys(GOODS).filter(g=>(t.stock[g]||0)>0||goodN(g)>0||needOf(t,g)>.05);
  const cap=t.T.popCap*(1+.15*bldLv(t,'granary'))+Math.floor(landOf(t)/12);
  const dests=TOWNS.filter(o=>o!==t&&(o.owner==='player'||!hostileTo(o.owner))).sort((a,c)=>Math.hypot(a.x-t.x,a.y-t.y)-Math.hypot(c.x-t.x,c.y-t.y)).slice(0,14);
  const gsel=id=>'<select id="'+id+'" class="sel"><option value="">—</option>'+goods.filter(g=>(t.stock[g]||0)>0).map(g=>'<option value="'+g+'">'+GOODS[g].n+' ('+t.stock[g]+')</option>').join('')+'</select>';
  const nsel=id=>'<select id="'+id+'" class="sel">'+[10,20,40,80].map(n=>'<option>'+n+'</option>').join('')+'</select>';
  const mine=myCaravans().filter(c=>c.home===t.name);
  return '<div class="lab">People and stores</div><p style="font-size:14px">'+t.pop+' people (room for '+Math.round(cap)+') · prosperity <b>'+Math.round(t.pros)+'%</b> · food for <b class="'+(foodDays(t)<4?'bad':'')+'">'+foodDays(t)+'</b> days · '+Math.floor(t.vol||0)+' volunteers</p>'+
    '<div class="row"><div class="info"><strong>Taxes · '+taxOf(t)+' gold a day</strong><small>High taxes pay more but wear prosperity down; low taxes let it grow.</small></div><div class="acts">'+TAX_N.map((n,i)=>b('fief-tax',i,n,'',(t.tax==null?1:t.tax)===i)).join('')+'</div></div>'+
    '<div class="lab" style="margin-top:6px">Stores · made and used each day</div>'+goods.map(g=>{const st=t.stock[g]||0,mk=L.out&&L.out[g]||0,us=(L.use&&(isFood(g)?0:L.use[g])||0),ms=marketState(t,g);
      return '<div class="row"><div class="info"><strong>'+GOODS[g].n+' · '+st+(ms?' <span class="'+(ms==='shortage'?'bad':'good')+'" style="font-size:12px">'+cap1(ms)+'</span>':'')+'</strong><small>'+(mk?'+'+mk+' made':'')+(mk&&us?' · ':'')+(us?'−'+Math.round(us)+' used':'')+(!mk&&!us?'—':'')+' · you carry '+goodN(g)+'</small></div><div class="acts">'+
        b('fief-store',g+':10','Store 10',goodN(g)<1?'You carry none':'')+b('fief-take',g+':10','Take 10',st<1?'None in store':goodRoom(g)<1?'No room in your bag':'')+'</div></div>'}).join('')+
    '<div class="lab" style="margin-top:6px">Caravans · '+myCaravans().length+' / '+PCV.max+' running · upkeep '+PCV.upkeep+'g a day plus '+PCV.guardUp+'g a guard</div>'+
    mine.map(c=>'<p style="font-size:13px">'+(c.idle?'Waiting at '+c.home+' for goods':c.leg==='out'?'On the way to '+c.to+' with '+cargoText(c):'Heading home from '+(c.dest||c.to)+(c.purse?' with '+c.purse+' gold':''))+' · '+c.guards+' guards'+(c.repeat?' · standing route':'')+'</p>').join('')+
    '<div class="row cvform"><div class="info"><strong>Send a caravan from '+t.name+'</strong><small>To one of your fiefs it delivers; anywhere else it sells at the market there and brings the gold home.</small>'+
      '<small>To <select id="cv-to" class="sel">'+dests.map(o=>'<option value="'+o.name+'">'+o.name+(o.owner==='player'?' (yours)':'')+'</option>').join('')+'</select> '+gsel('cv-g1')+nsel('cv-n1')+' '+gsel('cv-g2')+nsel('cv-n2')+'</small>'+
      '<small>Guards <select id="cv-guards" class="sel">'+[2,3,4,6,8].map(n=>'<option'+(n===4?' selected':'')+'>'+n+'</option>').join('')+'</select> <label><input type="checkbox" id="cv-rep"> standing route</label></small></div>'+
      '<div class="acts">'+b('fief-cv','go','Hire '+PCV.hire+'g + '+PCV.guard+'g a guard',myCaravans().length>=PCV.max?'Too many caravans':'')+'</div></div>';
}
function fiefEconAct(a,arg,t){
  if(a==='fief-tax'){t.tax=clamp(+arg,0,2);return true}
  if(a==='fief-store'){const [g,n]=arg.split(':');const k=goodTake(g,+n);ensureEcon(t);t.stock[g]=(t.stock[g]||0)+k;if(k)log('You store '+k+' '+GOODS[g].n.toLowerCase()+' in '+t.name+'.');return true}
  if(a==='fief-take'){const [g,n]=arg.split(':');ensureEcon(t);const k=invAdd('good',g,Math.min(+n,t.stock[g]||0));t.stock[g]-=k;if(k)log('You take '+k+' '+GOODS[g].n.toLowerCase()+' from the stores of '+t.name+'.');return true}
  if(a==='fief-cv'){const v=id=>{const e=panel.querySelector('#'+id);return e?(e.type==='checkbox'?e.checked:e.value):''};
    const cargo={};[['cv-g1','cv-n1'],['cv-g2','cv-n2']].forEach(([g,n])=>{if(v(g))cargo[v(g)]=(cargo[v(g)]||0)+(+v(n)||0)});
    const err=hireCaravan(t.name,v('cv-to'),cargo,+v('cv-guards')||3,v('cv-rep'));if(err)log(err,'bad');return true}
  return false;
}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'economy',order:{day:110},day:econDay});
