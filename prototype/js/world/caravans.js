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
    const c={cv:true,fac:t.owner,from:t.name,to:to.name,x:t.x+rint(-6,6),y:t.y+14,goods:load,guards:rint(3,5)+(t.kind==='village'?0:2),cool:0,dir:1};W.caravans.push(c);return c}
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
function updateCaravans(d){
  W.caravans=W.caravans||[];const hide=hiddenAt(P.x,P.y)?.55:1;
  for(const c of W.caravans){
    if(c.idle)continue;
    c.cool=Math.max(0,c.cool-d);const to=townBy(c.to);if(!to||!c.mine&&atWar(to.owner,c.fac)){c.gone=true;continue}
    const dx=P.x-c.x,dy=P.y-c.y,pd=Math.hypot(dx,dy),scared=!c.mine&&hostileTo(c.fac)&&pd<80*hide;
    if(scared){walk(c,-dx,-dy,CARAVAN_SPD*.9*d);c.dir=dx>0?-1:1}
    else{const ox=c.x;travelTo(c,to,to.x,to.y+12,CARAVAN_SPD*Math.max(.5,speedAt(c.x,c.y)||1)*d);c.dir=c.x>=ox?1:-1}
    if(Math.hypot(to.x-c.x,to.y+12-c.y)<8){if(c.mine){if(myCaravanArrive(c,to))c.gone=true}else{caravanArrive(c,to);c.gone=true}continue}
    // preyed on: bandits close by (the guards may beat them off), or a lord at war with its owner, who takes the goods home
    const b=bandits.find(o=>Math.hypot(o.x-c.x,o.y-c.y)<12&&!o.cvT);
    const l=!b&&W.lords.find(o=>!o.dead&&o.state!=='siege'&&(c.mine?hostileTo(o.fac):atWar(o.fac,c.fac))&&Math.hypot(o.x-c.x,o.y-c.y)<14);
    if(b&&guardsHold(c,b.n)){b.cvT=1;b.n=Math.max(1,b.n-1);b.list.pop();b.pw=0;c.guards=Math.max(1,c.guards-(Math.random()<.4?1:0));b.cool=6;
      if(c.mine)log('Your caravan’s guards drive off bandits near '+nearestOf(c,TOWNS).name+'.','good');continue}
    if(b||l){c.gone=true;if(b){b.n++;b.list.push('militia');b.pw=0}
      else{const home=nearestOf(l,fiefsOf(l.fac));if(home){ensureEcon(home);for(const g in c.goods)home.stock[g]=(home.stock[g]||0)+c.goods[g]}}
      if(c.mine||c.fac===P.fac||pd<vis())log((b?'Bandits':l.name)+' '+(b?'plunder':'seizes')+' a caravan of '+c.from+(c.mine?', one of yours':'')+'.',c.mine||c.fac===P.fac?'bad':'')}
    if(!c.gone&&pd<10&&c.cool<=0&&G.encCool<=0&&!G.modal&&G.chase===c){caravanMeet(c);return true}
  }
  for(const b of bandits)if(b.cvT&&Math.random()<.01)b.cvT=0;
  W.caravans=W.caravans.filter(c=>!c.gone);return false;
}

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
    '<div class="btns">'+caravanExtra(c,hostile)+(mine?btn('cv-repeat',null,c.repeat?'End the standing route':'Make it a standing route')+btn('cv-disband',null,'Disband here'):'<button class="btn" type="button" data-act="cv-attack"'+(P.fac===c.fac?' disabled title="Your employer"':'')+'>Attack'+(hostile?'':' (the '+f.n+' turns hostile)')+'</button>')+'<button class="btn primary" type="button" data-act="cv-leave">Leave</button></div>'+
    (mine||hostile?'':'<p class="muted">Attacking a caravan makes its owner hostile for 20 days and costs 10 honor with them.</p>'));
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
// whether guards hold off an attack: their numbers against the raiders'
const guardsHold=(c,n)=>c.guards*(1+.1*c.guards)>=n*.9;

/* on the map */
function caravanSprite(col){
  const key='cv'+col;if(spr[key])return spr[key];
  return spr[key]=mkc(20,12,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1);
    r('#7a5a3a',1,5,8,3);r('#5a3a20',1,8,8,1);r('#3a2a1a',2,9,2,2);r('#3a2a1a',6,9,2,2);r('#7a5030',9,7,3,1);
    r('#8a7a6a',12,4,6,4);r('#6a5a4a',16,2,3,3);r('#3a3020',13,8,1,3);r('#3a3020',17,8,1,3);r('#e8e4d0',2,2,6,3);r('#c8c2ae',2,4,6,1);r('#5a3a20',1,0,1,5);r(col,2,0,3,2)});
}
function drawCaravans(ents,cam,V){
  for(const c of W.caravans||[]){if(Math.hypot(c.x-P.x,c.y-P.y)>V*1.2)continue;
    ents.push({y:c.y,f:()=>{const s=caravanSprite(c.fac==='player'?FACS.player.col:FACS[c.fac].col),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-8,sy-1,16,2);
      ctx.save();ctx.translate(sx,sy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-10,-11);ctx.restore();
      if(Math.hypot(c.x-P.x,c.y-P.y)<90)txt('Caravan',sx,sy-13,hostileTo(c.fac)?'#ff9a90':'#e8d8a0','center')}})}
}
onAct('cv-',caravanAct);
