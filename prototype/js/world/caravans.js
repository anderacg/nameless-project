'use strict';
/* ---------- caravans: realms ship surplus to shortage; yours run the routes you give them ---------- */
// W.caravans: {cv, fac, from, to, x, y, goods:{g:n}, guards, cool}, plus mine/home/dest/order/repeat/leg/purse for yours.
// Realms ship their holdings' surplus to friendly holdings short of it; the goods move from one stock to the other, and the
// receiving owner takes a toll. Bandits (unless the guards hold) and enemy lords take them. You can trade with them, demand a
// toll, attack them for their cargo, or (with a fief) seize them.
const CARAVAN_CAP=Math.round(24*MAP_DENS),CARAVAN_SPD=17;

/* realm caravans */
// a holding's surplus: goods it holds well beyond its own ten days, which a caravan can take away
const surplusOf=t=>{ensureEcon(t);return Object.keys(t.stock).map(g=>[g,Math.floor((t.stock[g]||0)-targetStock(t,g)*1.3)]).filter(([g,n])=>n>=4).sort((a,b)=>b[1]*GOODS[b[0]].base-a[1]*GOODS[a[0]].base)};
// where a good is needed most: the friendly holding within reach whose stock is lowest against its own needs
function neediest(t,g){
  const ok=o=>o!==t&&o.owner&&(o.owner===t.owner||!atWar(o.owner,t.owner))&&!besieged(o)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)>10&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<90;
  let best=null,bv=0;for(const o of TOWNS){if(!ok(o))continue;ensureEcon(o);const v=targetStock(o,g)/((o.stock[g]||0)+1)-Math.hypot(o.tx-t.tx,o.ty-t.ty)/150;if(v>bv){bv=v;best=o}}
  return bv>1.2?best:null;
}
// realms ship surplus to where it is short; the goods leave the source's stock and arrive in the destination's
function sendCaravan(t){
  const sur=surplusOf(t);for(const [g,n] of sur){const to=neediest(t,g);if(!to)continue;const load={[g]:Math.min(n,25)};
    const second=sur.find(([h,m])=>h!==g&&targetStock(to,h)>(to.stock[h]||0));if(second)load[second[0]]=Math.min(second[1],15);
    for(const k in load)t.stock[k]-=load[k];
    const c={cv:true,fac:t.owner,from:t.name,to:to.name,x:t.x+rint(-6,6),y:t.y+14,goods:load,guards:rint(3,5)+t.T.guards,cool:0,dir:1};W.caravans.push(c);return c}
  return null;
}
const caravanList=c=>{const f=c.fac==='player'?null:c.fac,a=f?armyOf(f,c.guards):Array(c.guards).fill('militia');return a};
function caravanDay(){
  W.caravans=W.caravans||[];
  for(const t of TOWNS){if(W.caravans.length>=CARAVAN_CAP)break;if(!t.bld||t.owner==='player'||besieged(t)||ruined(t))continue;
    const out=W.caravans.filter(c=>c.from===t.name&&!c.mine).length;if(out<2&&Math.random()<.25+.1*bldLv(t,'market'))sendCaravan(t)}
  // your idle caravans try to load again
  for(const c of myCaravans())if(c.idle){const at=townBy(c.home);if(at){c.idle=false;myCaravanArrive(c,at)}}
}
// arrival: goods into the destination's stock; its owner takes a toll (5% of their worth)
function caravanArrive(c,to){
  ensureEcon(to);for(const g in c.goods)to.stock[g]=(to.stock[g]||0)+c.goods[g];
  const toll=Math.round(Object.keys(c.goods).reduce((a,g)=>a+GOODS[g].base*c.goods[g],0)*.05);
  if(to.owner==='player'){P.gold+=toll;P.tradeWeek=(P.tradeWeek||0)+toll}else if(to.owner){W.tolls=W.tolls||{};W.tolls[to.owner]=(W.tolls[to.owner]||0)+toll}
}
// each moment on the road: CaravanBrain (brains.js)

/* meeting a caravan: trade, toll, attack or seize */
const cargoText=c=>Object.keys(c.goods).length?Object.keys(c.goods).map(g=>c.goods[g]+' '+GOODS[g].n.toLowerCase()).join(', '):'nothing';
// what a caravan's merchants charge and pay: the going rate where they came from, a little either way
const caravanPrice=(c,g)=>{const t=townBy(c.from);return Math.max(2,Math.round((t?marketPrice(t,g):GOODS[g].base)*1.05))};
const caravanPays=(c,g)=>{const t=townBy(c.to);return Math.max(1,Math.round((t?marketPrice(t,g):GOODS[g].base)*.8))};
function caravanMeet(c){
  G.cv=c;G.mode='dialog';P.tx=null;G.chase=null;c.cool=4;const f=c.fac==='player'?FACS.player:FACS[c.fac],hostile=!c.mine&&hostileTo(c.fac),mine=c.mine;
  const btn=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const wants=mine||hostile?[]:Object.keys(GOODS).filter(g=>goodN(g)>0&&!GOODS[g].ammo&&townBy(c.to)&&marketState(townBy(c.to),g)==='shortage').slice(0,4);
  showPanel('<div class="top"><h2>'+(mine?'Your caravan':'Caravan of '+c.from)+'</h2><span class="muted">'+(mine&&c.leg==='back'?'Heading home to '+c.home:'Bound for '+c.to)+'</span></div>'+
    '<p class="muted">Flying the colors of the <span style="color:'+f.col+'">'+f.n+'</span>. '+c.guards+' guards walk beside the carts.</p><p>Carrying '+cargoText(c)+(c.purse?', and '+c.purse+' gold from its sales':'')+'.</p>'+
    (mine?'<p class="good">'+(c.repeat?'A standing route: '+c.home+' → '+(c.dest||c.to)+' and back, again and again.':'One run: '+c.home+' → '+(c.dest||c.to)+', then home.')+'</p>':hostile?'':
      Object.keys(c.goods).map(g=>{const p=caravanPrice(c,g),n=Math.min(5,c.goods[g]);return '<div class="row"><div class="info"><strong>Buy '+GOODS[g].n.toLowerCase()+'</strong><small>'+p+'g each · '+c.goods[g]+' aboard · you have '+goodN(g)+'</small></div><div class="acts">'+
        btn('cv-buy',g,'Buy '+n+' for '+p*n+'g',P.gold<p*n?'Not enough gold':goodRoom(g)<n?'No room in your bag':'')+'</div></div>'}).join('')+
      wants.map(g=>{const p=caravanPays(c,g),n=Math.min(5,goodN(g));return '<div class="row"><div class="info"><strong>Sell '+GOODS[g].n.toLowerCase()+'</strong><small>'+c.to+' is short of it · '+p+'g each</small></div><div class="acts">'+btn('cv-sell',g,'Sell '+n+' for '+p*n+'g')+'</div></div>'}).join(''))+
    '<div class="btns">'+caravanExtra(c,hostile)+(mine?btn('cv-repeat',null,c.repeat?'End the standing route':'Make it a standing route')+btn('cv-disband',null,'Disband here'):'<button class="btn" type="button" data-act="cv-attack"'+(P.fac===c.fac?' disabled title="Your employer"':'')+'>Attack'+(hostile?'':' (the '+f.n+' turns hostile)')+'</button>')+'</div>'+
    (mine||hostile?'':'<p class="muted">Attacking a caravan makes its owner hostile for 20 days and costs 10 honor with them.</p>')+nav(null,['cv-leave',null,'Leave']));
}
function caravanAct(a,arg){
  const c=G.cv;if(!c)return true;if(caravanExtraAct(a,c))return true;
  if(a==='cv-leave'){G.cv=null;G.mode='world';hidePanel();return true}
  if(a==='cv-buy'){const g=arg,p=caravanPrice(c,g),n=Math.min(5,c.goods[g]||0);if(n&&P.gold>=p*n&&goodRoom(g)>=n){P.gold-=p*n;c.goods[g]-=n;if(!c.goods[g])delete c.goods[g];invAdd('good',g,n);train('trade',n*p/40);log('You buy '+n+' '+GOODS[g].n.toLowerCase()+' from the caravan.')}
    if(!Object.keys(c.goods).length){c.gone=true;W.caravans=W.caravans.filter(x=>x!==c);G.cv=null;G.mode='world';hidePanel();log('The caravan sold out and turns home.');return true}
    caravanMeet(c);updateHUD(true);return true}
  if(a==='cv-sell'){const g=arg,p=caravanPays(c,g),n=goodTake(g,Math.min(5,goodN(g)));if(n){P.gold+=p*n;c.goods[g]=(c.goods[g]||0)+n;train('trade',n*p/40);log('You sell '+n+' '+GOODS[g].n.toLowerCase()+' to the caravan.')}caravanMeet(c);updateHUD(true);return true}
  if(a==='cv-repeat'&&c.mine){c.repeat=!c.repeat;caravanMeet(c);return true}
  if(a==='cv-disband'&&c.mine){if(c.purse){P.gold+=c.purse;c.purse=0}const got=Object.keys(c.goods).map(g=>invAdd('good',g,c.goods[g])).reduce((x,y)=>x+y,0);W.caravans=W.caravans.filter(x=>x!==c);G.cv=null;G.mode='world';hidePanel();log('You disband the caravan'+(got?' and take '+got+' goods into your bag':'')+'.');updateHUD(true);return true}
  if(a==='cv-attack'&&!c.mine&&P.fac!==c.fac){if(!hostileTo(c.fac)){P.hostile[c.fac]=Math.max(P.hostile[c.fac]||0,G.day+20);addHonor(c.fac,-10,true)}G.cv=null;
    startEncounter({kind:'caravan',ref:c,list:caravanList(c),title:'Caravan of '+c.from});return true}
  return true;
}
// the spoils: its cargo (what fits) and the strongbox
function caravanLoot(c){
  const got=Object.keys(c.goods).map(g=>{const n=invAdd('good',g,c.goods[g]);return n?n+' '+GOODS[g].n.toLowerCase():''}).filter(Boolean),gold=rint(20,50)+c.guards*5;P.gold+=gold;
  W.caravans=W.caravans.filter(x=>x!==c);addRep(c.from,-8,true);
  return ' You take the caravan: '+(got.length?got.join(', ')+' and ':'')+gold+' gold from its strongbox.';
}
// a toll from a weak one; a hostile one that fears you may hand over its cargo
const caravanFears=c=>rating(caravanList(c))<partyPower()*.5;
function caravanExtra(c,hostile){
  if(c.mine)return '';
  return hostile?(caravanFears(c)?dlgBtn('cv-yield',null,'Demand their cargo'):''):dlgBtn('cv-toll',null,'Demand a toll',c.tolled?'Already paid':P.fac===c.fac?'Your employer':'')+
    (playerFiefs().length?dlgBtn('cv-seize',null,'Attack and seize it for '+nearestOf(c,playerFiefs()).name,P.fac===c.fac?'Your employer':''):'');
}
function caravanExtraAct(a,c){
  const worth=Object.keys(c.goods).reduce((s,g)=>s+GOODS[g].base*c.goods[g],0),from=townBy(c.from);
  if(a==='cv-toll'&&!c.tolled){c.tolled=true;
    if(caravanFears(c)){const g=Math.max(10,Math.round(worth*.1));P.gold+=g;const cost=from?wrong(from,CONDUCT.toll):'';mood('cruel');log('The merchants pay you '+g+' gold to pass'+(cost?' ('+cost+')':'')+'.','bad')}
    else log('The guards laugh at your demand. The caravan rolls on.','bad');
    caravanMeet(c);updateHUD(true);return true}
  if(a==='cv-yield'&&hostileTo(c.fac)){if(Math.random()<.75){const txt=caravanLoot(c,true);G.cv=null;mood('cruel');notice('The caravan yields','The guards throw down their spears rather than die for another man\'s goods.'+txt,'good')}
    else{log('The guards will not give up the carts.','bad');G.cv=null;startEncounter({kind:'caravan',ref:c,list:caravanList(c),title:'Caravan of '+c.from})}return true}
  if(a==='cv-seize'&&playerFiefs().length&&P.fac!==c.fac){if(!hostileTo(c.fac)){P.hostile[c.fac]=Math.max(P.hostile[c.fac]||0,G.day+20);addHonor(c.fac,-10,true)}G.cv=null;
    startEncounter({kind:'caravan',ref:c,seize:true,list:caravanList(c),title:'Caravan of '+c.from});return true}
  return false;
}
// a beaten caravan becomes yours: it drives its cargo to your nearest fief and is then yours to send again
function seizeCaravan(c){
  const home=nearestOf(c,playerFiefs());if(!home)return caravanLoot(c);
  Object.assign(c,{mine:true,fac:'player',home:home.name,to:home.name,dest:home.name,from:home.name,leg:'out',repeat:false,order:{},guards:Math.max(1,Math.floor(c.guards/2)),cool:4,purse:0});
  addRep(c.from,-8,true);return ' Your soldiers take the carts and drive them to '+home.name+': '+cargoText(c)+'.';
}

/* your own caravans: hired at a fief, carrying its stock to a destination; to your own fief they deliver, elsewhere they sell
   at the market there and bring the gold home. Standing routes reload and go again. Upkeep is paid daily. */
const myCaravans=()=>(W.caravans||[]).filter(c=>c.mine);
function hireCaravan(from,to,cargo,guards,repeat){
  const t=townBy(from),d=townBy(to);if(!t||!d||t.owner!=='player'||hostileTo(d.owner)&&d.owner!=='player')return 'Pick a destination that is not hostile to you.';
  if(myCaravans().length>=PCV.max)return 'You already run '+PCV.max+' caravans.';
  const cost=PCV.hire+guards*PCV.guard;if(P.gold<cost)return 'Not enough gold ('+cost+' needed).';
  const load={};for(const g in cargo){const n=Math.min(cargo[g],t.stock[g]||0);if(n>0)load[g]=n}if(!Object.keys(load).length)return 'Nothing to carry: '+t.name+' has none of that in stock.';
  for(const g in load)t.stock[g]-=load[g];P.gold-=cost;
  const c={cv:true,mine:true,fac:'player',from,to,dest:to,home:from,goods:load,order:{...cargo},guards,repeat:!!repeat,leg:'out',x:t.x+rint(-6,6),y:t.y+14,cool:0,dir:1};
  (W.caravans=W.caravans||[]).push(c);log('A caravan leaves '+from+' for '+to+' with '+cargoText(c)+'.','gold');return '';
}
// a caravan of yours reaches the end of a leg
function myCaravanArrive(c,at){
  if(c.leg==='out'){
    ensureEcon(at);
    if(at.owner==='player'){for(const g in c.goods)at.stock[g]=(at.stock[g]||0)+c.goods[g];log('Your caravan delivers '+cargoText(c)+' to '+at.name+'.','good')}
    else{let gold=0;for(const g in c.goods)for(let i=0;i<c.goods[g];i++){gold+=Math.max(1,Math.floor(marketPrice(at,g)*.92));at.stock[g]=(at.stock[g]||0)+1}
      c.purse=(c.purse||0)+gold;log('Your caravan sells '+cargoText(c)+' at '+at.name+' for '+gold+' gold.','gold')}
    c.goods={};c.leg='back';c.to=c.home;return false}
  // home again: pay out, and reload for another run if it is a standing route
  if(c.purse){P.gold+=c.purse;log('Your caravan is back at '+at.name+' with '+c.purse+' gold.','gold');c.purse=0}
  if(!c.repeat||at.owner!=='player'){log('Your caravan is disbanded at '+at.name+'.');return true}
  const load={};ensureEcon(at);for(const g in c.order){const n=Math.min(c.order[g],at.stock[g]||0);if(n>0){load[g]=n;at.stock[g]-=n}}
  if(!Object.keys(load).length){log('Your caravan waits at '+at.name+': nothing in stock to carry.');c.idle=true;return false}
  c.goods=load;c.leg='out';c.to=c.dest||c.to;return false;
}
function caravanUpkeep(){const mine=myCaravans();if(!mine.length)return;const cost=mine.reduce((a,c)=>a+PCV.upkeep+c.guards*PCV.guardUp,0);P.gold=Math.max(0,P.gold-cost)}

/* on the map: a covered two-wheeled cart behind an ox, its drover walking ahead at its head (people.js mapPerson), all on the people's
   scale (a man 15 high: the ox's back at his shoulder, the wheel to his chest; critters.js), in a 64×64 cell (sprites.js cellOf),
   its middle where the caravan stands. The cart's cover is canvas dyed in its owner's colour: col */
const CV_WOOD=['#b8925e','#8e6a44','#604630','#3e2e26'],CV_OX=['#d8c094','#a88a62','#6e5a44','#463a32'];
// (a colour mixed toward another by k: the cover's lights warm, its shade cool)
const cvMix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
function caravanSprite(col){
  const key='cv'+col;if(spr[key])return spr[key];
  const Wd=64,G=21,g=pgrid(Wd,G+2),s=(x,y,c)=>pset(g,x,y,c),Wo=CV_WOOD,O=CV_OX;
  const Cv=[cvMix(col,'#f4e8c8',.5),cvMix(col,'#d8ccb0',.3),cvMix(col,'#2e2a40',.35),cvMix(col,'#1a1c26',.55)];
  // the ox, facing right (x0: its rump), a head taller than a cow at the hump: its far legs first, then its body, near legs,
  // neck, dewlap, head (carried low), horns, tail
  const x0=25,y0=G-16,o=(x,y,c)=>s(x0+x,y0+y,c),hoof='#2c2622';
  for(let y=11;y<=15;y++){o(7,y,O[3]);o(16,y,O[3])}o(7,16,hoof);o(16,16,hoof);
  for(let y=4;y<=10;y++){const r=y===4||y===10,a=r?4:3,b=r?18:19;for(let x=a;x<=b;x++)o(x,y,x===3?O[2]:y===4?O[0]:y>=9?O[2]:O[1])}
  for(let x=13;x<=17;x++)o(x,3,O[0]);
  for(const lx of [4,17]){for(let y=11;y<=15;y++){o(lx,y,y<13?O[1]:O[2]);o(lx+1,y,O[2])}o(lx,16,hoof);o(lx+1,16,hoof)}
  for(let y=4;y<=9;y++)for(let x=20;x<=21;x++)o(x,y,y===4?O[0]:y>=8?O[2]:O[1]);
  for(let x=19;x<=21;x++)o(x,10,O[2]);o(20,11,O[2]);o(21,11,O[3]);
  [[4,21,23,0],[5,22,24,1],[6,22,25,1],[7,23,25,1]].forEach(([y,a,b,k])=>{for(let x=a;x<=b;x++)o(x,y,O[k])});
  o(23,8,'#b8a090');o(24,8,'#b8a090');o(25,8,'#8e7a6e');o(25,7,'#3a302c');o(23,5,'#1a1410');o(24,4,O[1]);
  o(20,3,O[2]);o(21,3,O[2]);o(22,3,'#ece4cc');o(23,2,'#ece4cc');o(23,1,'#a8987a');o(21,2,'#a8987a');
  for(let y=4;y<=11;y++)o(2,y,O[2]);o(2,12,O[3]);o(2,13,O[3]);o(1,13,O[3]);
  // the yoke on its neck, before the hump, its bow down the near side
  o(18,3,Wo[1]);o(19,3,Wo[0]);o(20,2,Wo[1]);o(19,4,Wo[2]);o(19,5,Wo[2]);o(19,6,Wo[2]);o(19,7,Wo[2]);
  // the cart: a bed on one big wheel, the cover over it on hoops, its front open; the shaft
  const cx=1;
  for(let x=cx;x<=cx+20;x++){s(x,G-9,Wo[1]);s(x,G-8,Wo[2])}s(cx,G-9,Wo[2]);
  for(let y=G-18;y<=G-10;y++){const t=y-(G-18),a=cx+(t===0?3:t===1?1:0),b=cx+20-(t===0?3:t===1?1:0);
    for(let x=a;x<=b;x++)s(x,y,t===0||t===1&&(x<a+2||x>b-2)?Cv[0]:y===G-10?Cv[2]:(x-cx)%6===4?Cv[2]:t<3?Cv[0]:Cv[1])}
  for(let y=G-15;y<=G-11;y++)s(cx+20,y,'#2a2420');s(cx+19,G-13,Cv[3]);s(cx+19,G-12,Cv[3]);
  for(let x=cx+21;x<=x0+2;x++)s(x,G-7,Wo[1]);// (the shaft, on to the yoke along the ox's far side)
  const wx=cx+7,wy=G-4;
  for(const [x,y] of [[-2,-4],[-1,-4],[0,-4],[1,-4],[2,-4],[-3,-3],[3,-3],[-4,-2],[4,-2],[-4,-1],[4,-1],[-4,0],[4,0],[-4,1],[4,1],[-4,2],[4,2],[-3,3],[3,3],[-2,4],[-1,4],[0,4],[1,4],[2,4]])s(wx+x,wy+y,y>=3||x<=-3&&y>0?Wo[3]:Wo[2]);
  for(const [x,y] of [[0,-3],[0,-2],[0,-1],[0,1],[0,2],[0,3],[-3,0],[-2,0],[-1,0],[1,0],[2,0],[3,0],[-2,-2],[2,-2],[-2,2],[2,2]])s(wx+x,wy+y,Wo[1]);s(wx,wy,'#6e7890');
  poutline(g);
  // the drover, walking ahead at the ox's head, leading it, his goad in hand (his own outline)
  const drover=mapPerson({race:'human',skin:'skinTan',hair:'brown',eye:PEOPLE_EYE,helm:'hood',hood:'linen',outer:'cloth',inner:'dark',team:'leather',weapon:'javelin',shortHair:true},0);
  const c=mkc(Wd,G+2,x=>{x.drawImage(pcanvas(g),0,0);x.drawImage(drover,x0+31-(drover.width>>1),G+2-drover.height)});
  return spr[key]=cellOf(c);
}
// (a caravan's picture, in its owner's colour: drawn here, clicked on its whole cart, ox and drover: world.js pickAt)
const caravanPic=c=>caravanSprite(c.fac==='player'||!FACS[c.fac]?FACS.player.col:FACS[c.fac].col);
function drawCaravans(ents,cam,V){
  for(const c of W.caravans||[]){if(Math.hypot(c.x-P.x,c.y-P.y)>V*1.2)continue;
    ents.push({y:c.y,f:()=>{const s=caravanPic(c),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-(s.cw>>1)+3,sy-1,s.cw-6,2);
      ctx.save();ctx.translate(sx,sy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
      if(Math.hypot(c.x-P.x,c.y-P.y)<90)txt('Caravan',sx,sy-s.ch-1,hostileTo(c.fac)?'#ff9a90':'#e8d8a0','center')}})}
}
onAct('cv-',caravanAct);
