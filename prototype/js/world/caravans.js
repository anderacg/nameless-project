'use strict';
/* ---------- caravans: realms ship surplus to shortage; yours run the routes you give them ---------- */
// W.caravans: CaravanParty (a party: parties.js), saved as plain {cv, fac, from, to, x, y, goods:{g:n}, guards, cool, dir}, plus
// mine/home/dest/order/repeat/leg/purse for yours.
// Realms ship their holdings' surplus to friendly holdings short of it; the goods move from one stock to the other, and the
// receiving owner takes a toll. Bandits (unless the guards hold) and enemy lords take them. You can trade with them, demand a
// toll, attack them for their cargo, or (with a fief) seize them.
const CARAVAN_CAP=density().caravans,CARAVAN_SPD=17;

/* realm caravans */
// a holding's surplus: goods it holds well beyond its own ten days, which a caravan can take away
const surplusOf=t=>{ensureEcon(t);return Object.keys(t.stock).map(g=>[g,Math.floor((t.stock[g]||0)-targetStock(t,g)*1.3)]).filter(([g,n])=>n>=4).sort((a,b)=>b[1]*GOODS[b[0]].base-a[1]*GOODS[a[0]].base)};
// where a good is needed most: the friendly holding within reach whose stock is lowest against its own needs
function neediest(t,g){
  const E=WORLD_SCALE.econ,ok=o=>o!==t&&o.owner&&(o.owner===t.owner||!atWar(o.owner,t.owner))&&!besieged(o)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)>E.caravanNear&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<E.caravanFar;
  let best=null,bv=0;for(const o of TOWNS){if(!ok(o))continue;ensureEcon(o);const v=targetStock(o,g)/((o.stock[g]||0)+1)-Math.hypot(o.tx-t.tx,o.ty-t.ty)/E.caravanCost;if(v>bv){bv=v;best=o}}
  return bv>1.2?best:null;
}
// realms ship surplus to where it is short; the goods leave the source's stock and arrive in the destination's
function sendCaravan(t){
  const sur=surplusOf(t);for(const [g,n] of sur){const to=neediest(t,g);if(!to)continue;const load={[g]:Math.min(n,25)};
    const second=sur.find(([h,m])=>h!==g&&targetStock(to,h)>(to.stock[h]||0));if(second)load[second[0]]=Math.min(second[1],15);
    for(const k in load)t.stock[k]-=load[k];
    const c=asParty({cv:true,fac:t.owner,from:t.name,to:to.name,x:t.x+rint(-6,6),y:t.y+14,goods:load,guards:rint(3,5)+t.T.guards,cool:0,dir:1});W.caravans.push(c);return c}
  return null;
}
function caravanDay(){
  for(const t of TOWNS){if(W.caravans.length>=CARAVAN_CAP)break;if(!t.bld||t.owner==='player'||besieged(t)||ruined(t))continue;
    const out=W.caravans.filter(c=>c.from===t.name&&!c.mine).length;if(out<2&&Math.random()<.25+.1*bldLv(t,'market'))sendCaravan(t)}
  // your idle caravans try to load again
  for(const c of myCaravans())if(c.idle){const at=townBy(c.home);if(at){c.idle=false;c.endLeg(at)}}
}
// arrival: goods into the destination's stock; its owner takes a toll (5% of their worth)
function caravanArrive(c,to){
  ensureEcon(to);for(const g in c.goods)to.stock[g]=(to.stock[g]||0)+c.goods[g];
  const toll=Math.round(Object.keys(c.goods).reduce((a,g)=>a+GOODS[g].base*c.goods[g],0)*.05);
  if(to.owner==='player'){P.gold+=toll;P.tradeWeek=(P.tradeWeek||0)+toll}else if(to.owner){W.tolls[to.owner]=(W.tolls[to.owner]||0)+toll}
}
// each moment on the road: CaravanBrain (brains.js)

/* a caravan is a party (parties.js), its guards its soldiers. A save keeps only how many (guards): their kinds (its realm's
   soldiers; militia for yours) are rolled from that and kept aside, rolled again whenever guards is set (hired, seized, loaded),
   and a change to its soldiers (a fight's losses) sets guards. CaravanBrain (brains.js) moves it each moment. */
const CV_TC=new WeakMap(),CV_ARMY=new WeakMap();
const cargoText=c=>Object.keys(c.goods).length?Object.keys(c.goods).map(g=>c.goods[g]+' '+GOODS[g].n.toLowerCase()).join(', '):'nothing';
class CaravanParty extends Party{
  get mapKind(){return 'caravan'}
  here(){return W.caravans.includes(this)}
  // on the map (drawCaravans): its carts seen out to a little past your sight, not hidden by woods; its label near you
  inView(V){return this.fromYou()<=V*1.2}
  // a click: on its ring, and anywhere on its cart, ox and drover (caravanPic)
  pick(at){at.add(this,11,5);const s=caravanPic(this);at.fig(this,s,this.x-(s.width>>1),this.y+1-s.height,this.dir<0);const B=at.flag&&bannerAt(this,0);if(B)at.flag(this,B)}
  // a small trade pennant in its owner's colour over its cart (Party banner)
  banner(){return{k:'trade',col:caravanCol(this),dev:'coin'}}
  headY(){const s=caravanPic(this);return Math.round(this.y)+1-s.height+opaqueBox(s)[1]}
  draw(ents,cam,V){if(!this.inView(V))return;const c=this;
    ents.push({y:c.y,f:()=>{subT(c);const L=c.look(),s=caravanSprite(L.col,stepOf(c,1.2)),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-(s.cw>>1)+3,sy-1,s.cw-6,2);
      ctx.save();ctx.translate(sx,sy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
      BANNERQ.push({o:c,label:c.fromYou()<90?[L.label,L.labelCol]:null})}})}
  mapDot(V){return this.fromYou()<V?['#e8d8a0',1]:null}
  get meetsAnyTime(){return true}
  label(){return 'Caravan of '+this.from}
  tip(){return '<b>Caravan</b><small>'+(this.from||'')+' → '+(this.to||'')+(this.fac?' · '+tipFac(this.fac):'')+'</small><span class="act">Click: meet</span>'}
  get brain(){return BRAINS.caravan}
  get tc(){let c=CV_TC.get(this);if(!c||sum(c)!==this.guards){c=countsOf(this.rollGuards());CV_TC.set(this,c);LISTS.delete(this)}return c}
  set tc(v){CV_TC.set(this,v||{})}
  get army(){return CV_ARMY.get(this)} set army(v){CV_ARMY.set(this,v)}// (its formations: kept aside too, matched to its kinds as they change: ArmyRoster.groups)
  get troops(){this.tc;return super.troops} set troops(list){super.troops=list}// (guards set since: rolled again first)
  changed(){super.changed();const c=CV_TC.get(this);if(c)this.guards=sum(c)}
  rollGuards(){const f=this.fac==='player'?null:this.fac;return f?armyOf(f,this.guards):Array(this.guards).fill('militia')}
  look(){return{col:caravanCol(this),dir:this.dir||1,moving:!this.idle,seed:0,label:'Caravan',labelCol:hostileTo(this.fac)?'#ff9a90':'#e8d8a0'}}
  // where it is bound (CaravanBrain): true when it is done there (a realm's unloads; yours ends a leg: endLeg)
  arrive(to){if(this.mine)return this.endLeg(to);caravanArrive(this,to);return true}

  /* meeting a caravan: trade, toll, attack or seize */
  // what its merchants charge and pay: the going rate where they came from, a little either way
  price(g){const t=townBy(this.from);return Math.max(2,Math.round((t?marketPrice(t,g):GOODS[g].base)*1.05))}
  pays(g){const t=townBy(this.to);return Math.max(1,Math.round((t?marketPrice(t,g):GOODS[g].base)*.8))}
  meet(){
    const c=this;G.cv=c;G.mode='dialog';P.tx=null;G.chase=null;c.cool=4;const f=c.fac==='player'?FACS.player:FACS[c.fac],hostile=!c.mine&&hostileTo(c.fac),mine=c.mine;
    const btn=(act,arg,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(arg!=null?' data-arg="'+arg+'"':'')+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
    const rum=hostile?'':rumourSay(rumourSource('caravan',c.from+'>'+c.to,[c,townBy(c.from),townBy(c.to)],{from:'a caravan master'}));// (news along its road: news.js)
    const wants=mine||hostile?[]:Object.keys(GOODS).filter(g=>goodN(g)>0&&!GOODS[g].ammo&&townBy(c.to)&&marketState(townBy(c.to),g)==='shortage').slice(0,4);
    showPanel('<div class="top"><h2>'+(mine?'Your caravan':'Caravan of '+c.from)+'</h2><span class="muted">'+(mine&&c.leg==='back'?'Heading home to '+c.home:'Bound for '+c.to)+'</span></div>'+
      '<p class="muted">Flying the colors of the <span style="color:'+f.col+'">'+f.n+'</span>. '+c.guards+' guards walk beside the carts.</p><p>Carrying '+cargoText(c)+(c.purse?', and '+c.purse+' gold from its sales':'')+'.</p>'+(rum?'<p>The caravan master: &ldquo;'+rum+'&rdquo;</p>':'')+
      (mine?'<p class="good">'+(c.repeat?'A standing route: '+c.home+' → '+(c.dest||c.to)+' and back, again and again.':'One run: '+c.home+' → '+(c.dest||c.to)+', then home.')+'</p>':hostile?'':
        Object.keys(c.goods).map(g=>{const p=c.price(g),n=Math.min(5,c.goods[g]);return '<div class="row"><div class="info"><strong>Buy '+GOODS[g].n.toLowerCase()+'</strong><small>'+p+'g each · '+c.goods[g]+' aboard · you have '+goodN(g)+'</small></div><div class="acts">'+
          btn('cv-buy',g,'Buy '+n+' for '+p*n+'g',P.gold<p*n?'Not enough gold':goodRoom(g)<n?'No room in your bag':'')+'</div></div>'}).join('')+
        wants.map(g=>{const p=c.pays(g),n=Math.min(5,goodN(g));return '<div class="row"><div class="info"><strong>Sell '+GOODS[g].n.toLowerCase()+'</strong><small>'+c.to+' is short of it · '+p+'g each</small></div><div class="acts">'+btn('cv-sell',g,'Sell '+n+' for '+p*n+'g')+'</div></div>'}).join(''))+
      '<div class="btns">'+c.demands(hostile)+(mine?btn('cv-repeat',null,c.repeat?'End the standing route':'Make it a standing route')+btn('cv-disband',null,'Disband here'):'<button class="btn" type="button" data-act="cv-attack"'+(P.fac===c.fac?' disabled title="Your employer"':'')+'>Attack'+(hostile?'':' (the '+f.n+' turns hostile)')+'</button>')+'</div>'+
      (mine||hostile?'':'<p class="muted">Attacking a caravan makes its owner hostile for 20 days and costs 10 honor with them.</p>')+nav(null,['cv-leave',null,'Leave']));
  }
  // a button in its window (cv-…: onAct below)
  act(a,arg){
    const c=this;if(c.demandAct(a))return true;
    if(a==='cv-leave'){G.cv=null;G.mode='world';hidePanel();return true}
    if(a==='cv-buy'){const g=arg,p=c.price(g),n=Math.min(5,c.goods[g]||0);if(n&&P.gold>=p*n&&goodRoom(g)>=n){P.gold-=p*n;c.goods[g]-=n;if(!c.goods[g])delete c.goods[g];invAdd('good',g,n);train('trade',n*p/40);log('You buy '+n+' '+GOODS[g].n.toLowerCase()+' from the caravan.')}
      if(!Object.keys(c.goods).length){c.gone=true;W.caravans=W.caravans.filter(x=>x!==c);G.cv=null;G.mode='world';hidePanel();log('The caravan sold out and turns home.');return true}
      c.meet();updateHUD(true);return true}
    if(a==='cv-sell'){const g=arg,p=c.pays(g),n=goodTake(g,Math.min(5,goodN(g)));if(n){P.gold+=p*n;c.goods[g]=(c.goods[g]||0)+n;train('trade',n*p/40);log('You sell '+n+' '+GOODS[g].n.toLowerCase()+' to the caravan.')}c.meet();updateHUD(true);return true}
    if(a==='cv-repeat'&&c.mine){c.repeat=!c.repeat;c.meet();return true}
    if(a==='cv-disband'&&c.mine){if(c.purse){P.gold+=c.purse;c.purse=0}const got=Object.keys(c.goods).map(g=>invAdd('good',g,c.goods[g])).reduce((x,y)=>x+y,0);W.caravans=W.caravans.filter(x=>x!==c);G.cv=null;G.mode='world';hidePanel();log('You disband the caravan'+(got?' and take '+got+' goods into your bag':'')+'.');updateHUD(true);return true}
    if(a==='cv-attack'&&!c.mine&&P.fac!==c.fac){if(!hostileTo(c.fac)){Timed.of(P,'hostile').extend(c.fac,20);addHonor(c.fac,-10,true)}G.cv=null;
      startEncounter({kind:'caravan',ref:c,list:c.troops.slice(),title:'Caravan of '+c.from});return true}
    return true;
  }
  // the spoils: its cargo (what fits) and the strongbox
  loot(){
    const c=this,got=Object.keys(c.goods).map(g=>{const n=invAdd('good',g,c.goods[g]);return n?n+' '+GOODS[g].n.toLowerCase():''}).filter(Boolean),gold=rint(20,50)+c.guards*5;P.gold+=gold;
    W.caravans=W.caravans.filter(x=>x!==c);addRep(c.from,-8,true);newsRecord('caravan',c,{from:c.from});// (news.js)
    return ' You take the caravan: '+(got.length?got.join(', ')+' and ':'')+gold+' gold from its strongbox.';
  }
  // a toll from a weak one; a hostile one that fears you may hand over its cargo
  fears(){return this.power()<partyPower()*.5}
  demands(hostile){
    const c=this;if(c.mine)return '';
    return hostile?(c.fears()?dlgBtn('cv-yield',null,'Demand their cargo'):''):dlgBtn('cv-toll',null,'Demand a toll',c.tolled?'Already paid':P.fac===c.fac?'Your employer':'')+
      (playerFiefs().length?dlgBtn('cv-seize',null,'Attack and seize it for '+Spatial.nearest(playerFiefs(),c.x,c.y).name,P.fac===c.fac?'Your employer':''):'');
  }
  demandAct(a){
    const c=this,worth=Object.keys(c.goods).reduce((s,g)=>s+GOODS[g].base*c.goods[g],0),from=townBy(c.from);
    if(a==='cv-toll'&&!c.tolled){c.tolled=true;
      if(c.fears()){const g=Math.max(10,Math.round(worth*.1));P.gold+=g;const cost=from?wrong(from,CONDUCT.toll):'';mood('cruel');log('The merchants pay you '+g+' gold to pass'+(cost?' ('+cost+')':'')+'.','bad')}
      else log('The guards laugh at your demand. The caravan rolls on.','bad');
      c.meet();updateHUD(true);return true}
    if(a==='cv-yield'&&hostileTo(c.fac)){if(Math.random()<.75){const txt=c.loot();G.cv=null;mood('cruel');notice('The caravan yields','The guards throw down their spears rather than die for another man\'s goods.'+txt,'good')}
      else{log('The guards will not give up the carts.','bad');G.cv=null;startEncounter({kind:'caravan',ref:c,list:c.troops.slice(),title:'Caravan of '+c.from})}return true}
    if(a==='cv-seize'&&playerFiefs().length&&P.fac!==c.fac){if(!hostileTo(c.fac)){Timed.of(P,'hostile').extend(c.fac,20);addHonor(c.fac,-10,true)}G.cv=null;
      startEncounter({kind:'caravan',ref:c,seize:true,list:c.troops.slice(),title:'Caravan of '+c.from});return true}
    return false;
  }
  // a beaten caravan becomes yours: it drives its cargo to your nearest fief and is then yours to send again
  seize(){
    const c=this,home=Spatial.nearest(playerFiefs(),c.x,c.y);if(!home)return c.loot();
    addRep(c.from,-8,true);// (the holding it came from resents it, before the carts become yours)
    Object.assign(c,{mine:true,fac:'player',home:home.name,to:home.name,dest:home.name,from:home.name,leg:'out',repeat:false,order:{},guards:Math.max(1,Math.floor(c.guards/2)),cool:4,purse:0});
    return ' Your soldiers take the carts and drive them to '+home.name+': '+cargoText(c)+'.';
  }

  // a caravan of yours reaches the end of a leg: true when it is disbanded there
  endLeg(at){
    const c=this;
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
}
onAct('cv-',(a,arg)=>G.cv?G.cv.act(a,arg):true);

/* your own caravans: hired at a fief, carrying its stock to a destination; to your own fief they deliver, elsewhere they sell
   at the market there and bring the gold home. Standing routes reload and go again. Upkeep is paid daily. */
const myCaravans=()=>W.caravans.filter(c=>c.mine);
function hireCaravan(from,to,cargo,guards,repeat){
  const t=townBy(from),d=townBy(to);if(!t||!d||t.owner!=='player'||hostileTo(d.owner)&&d.owner!=='player')return 'Pick a destination that is not hostile to you.';
  if(myCaravans().length>=PCV.max)return 'You already run '+PCV.max+' caravans.';
  const cost=PCV.hire+guards*PCV.guard;if(P.gold<cost)return 'Not enough gold ('+cost+' needed).';
  const load={};for(const g in cargo){const n=Math.min(cargo[g],t.stock[g]||0);if(n>0)load[g]=n}if(!Object.keys(load).length)return 'Nothing to carry: '+t.name+' has none of that in stock.';
  for(const g in load)t.stock[g]-=load[g];P.gold-=cost;
  const c=asParty({cv:true,mine:true,fac:'player',from,to,dest:to,home:from,goods:load,order:{...cargo},guards,repeat:!!repeat,leg:'out',x:t.x+rint(-6,6),y:t.y+14,cool:0,dir:1});
  W.caravans.push(c);log('A caravan leaves '+from+' for '+to+' with '+cargoText(c)+'.','gold');return '';
}
function caravanUpkeep(){const mine=myCaravans();if(!mine.length)return;const cost=mine.reduce((a,c)=>a+PCV.upkeep+c.guards*PCV.guardUp,0);P.gold=Math.max(0,P.gold-cost)}

/* on the map: a covered two-wheeled cart behind an ox, its drover walking ahead at its head (people.js mapPerson), all on the map's
   scale (a man 10 high: the ox's back at his chest, a wheel 6 across; doc/WORLD_DESIGN.md §10.1), some 30 × 12 in a 32×32 cell
   (sprites.js cellOf), its middle where the caravan stands. The cart's cover is canvas dyed in its owner's colour: col. f: 0 to
   PEOPLE_STEPS-1, a step each 1.2 px walked (CaravanParty.draw): the wheel's spokes an eighth of a turn each other one (f >> 1 & 1:
   a 6-px wheel turns once in 19 px), the drover's step each (people.js), the ox's walk each (engine/beasts.js PX.mapLegs) */
const CV_WOOD=['#b8925e','#8e6a44','#604630','#3e2e26'],CV_OX=['#d8c094','#a88a62','#6e5a44','#463a32'];
// (a colour mixed toward another by k: the cover's lights warm, its shade cool)
const cvMix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
const CV_OXT=['......ow.','.hhhhhhHe','dHHHHHHHn','.dHHHHHd.'],CV_OXL=[['.kH..kH..'],['k.H.k..H.']];
function caravanSprite(col,f){
  f=(f||0)%PEOPLE_STEPS;const key='cv'+col+f;if(spr[key])return spr[key];
  const g=pgrid(30,12),s=(x,y,c)=>pset(g,x+1,y+1,c),Wo=CV_WOOD,O=CV_OX,G=9;
  const Cv=[cvMix(col,'#f4e8c8',.5),cvMix(col,'#d8ccb0',.3),cvMix(col,'#2e2a40',.35),cvMix(col,'#1a1c26',.55)];
  // the ox (13-21), facing right, its far legs in shade, its head carried low; the yoke on its neck
  const oc={h:O[0],H:O[1],d:O[2],k:O[3],o:'#a8987a',w:'#ece4cc',e:'#1a1410',n:'#b8a090'};
  CV_OXT.concat(PX.mapLegs(CV_OXL[0],CV_OXL[1],f)).forEach((r,y)=>[...r].forEach((c,x)=>{if(oc[c])s(13+x,G-4+y,oc[c])}));s(19,G-4,Wo[0]);s(19,G-3,Wo[1]);
  // the cart: the cover on its hoops, its front open; the bed; the shaft on to the yoke
  for(let y=0;y<=3;y++)for(let x=y?1:2;x<=(y?9:8);x++)s(x,y,x===9?Cv[3]:y===0?Cv[0]:(x-1)%3===2?Cv[2]:y===1?Cv[0]:Cv[1]);
  for(let x=0;x<=10;x++){s(x,4,Wo[0]);s(x,5,Wo[2])}s(11,6,Wo[1]);s(12,6,Wo[1]);
  // the wheel, its rim, four spokes and the hub
  const wx=2,wy=4;for(const [x,y] of [[1,0],[2,0],[3,0],[4,0],[0,1],[5,1],[0,2],[5,2],[0,3],[5,3],[0,4],[5,4],[1,5],[2,5],[3,5],[4,5]])s(wx+x,wy+y,y>=4||x===0&&y>=2?Wo[3]:Wo[2]);
  for(const [x,y] of (f>>1&1?[[3,1],[4,3],[2,4],[1,2]]:[[2,1],[4,2],[3,4],[1,3]]))s(wx+x,wy+y,Wo[1]);for(const [x,y] of [[2,2],[3,2],[2,3],[3,3]])s(wx+x,wy+y,x===2&&y===2?'#8e95a6':'#6e7890');
  poutline(g);
  // the drover, walking at the ox's head, leading it, his goad in hand (his own outline)
  const drover=mapPerson({race:'human',skin:'skinTan',hair:'brown',eye:PEOPLE_EYE,helm:'hood',hood:'linen',outer:'cloth',inner:'dark',team:'leather',weapon:'javelin',shortHair:true},f);
  const c=mkc(32,12,x=>{x.drawImage(pcanvas(g),0,0);x.drawImage(drover,26-8,12-16)});
  return spr[key]=cellOf(c);
}
// (a caravan's picture, in its owner's colour: drawn as it looks (CaravanParty.look, draw), clicked on its whole cart, ox and
// drover: CaravanParty.pick)
const caravanCol=c=>c.fac==='player'||!FACS[c.fac]?FACS.player.col:FACS[c.fac].col,caravanPic=c=>caravanSprite(caravanCol(c));
function drawCaravans(ents,cam,V){for(const c of W.caravans)c.draw(ents,cam,V)}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'caravans',order:{day:130},day:caravanDay});
Systems.add({name:'caravan upkeep',order:{day:190},day:caravanUpkeep});
