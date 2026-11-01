'use strict';
/* ---------- caravans: realms ship surplus to shortage; yours run the routes you give them ---------- */
// W.caravans: CaravanParty (a party: parties.js), saved as plain {cv, fac, from, to, x, y, goods:{g:n}, guards, cool, dir}, plus
// mine/home/dest/order/repeat/leg/purse for yours.
// Realms ship their holdings' surplus to friendly holdings short of it; the goods move from one stock to the other, and the
// receiving owner takes a toll. Bandits (unless the guards hold) and enemy lords take them. You can trade with them, demand a
// toll, attack them for their cargo, or (with a fief) seize them.
const CARAVAN_CAP=density().caravans,CARAVAN_SPD=17;
// a caravan afraid of you near where it is bound (brains.js CaravanBrain): it runs for the gate when the gate is nearer it than you
// are (dash: the gate within dash × your distance), and turns for another holding of its realm when you stand at that gate (block px)
const CARAVAN_FEAR={dash:1,block:60};// (CARAVAN_CAP: today's; a world's own: density(WM), data/world.js)
// two caravans on the same way (brains.js CaravanBrain): the one behind holds back (slow, of its pace) while another is within px
// ahead of it, heading the same way (dot: how alike their headings, 1 the same), so they string out along the road, never one heap
const CARAVAN_GAP={px:26,slow:.3,dot:.5};

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
  // (each holding may send one, until the roads hold the world's cap; then your idle caravans try to load again: sliced on a big
  // world, core/systems.js)
  const cap=density(WM).caravans;
  Systems.sliced(TOWNS,t=>{if(W.caravans.length>=cap||!t.bld||t.owner==='player'||besieged(t)||ruined(t))return;
    const out=W.caravans.filter(c=>c.from===t.name&&!c.mine).length;if(out<2&&Math.random()<.25+.1*bldLv(t,'market'))sendCaravan(t)},
    ()=>{for(const c of myCaravans())if(c.idle){const at=townBy(c.home);if(at){c.idle=false;c.endLeg(at)}}});
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
  inView(V){return yourSight(V).sees(this.x,this.y,1.2)}
  // a click: marched man by man, on any of its guards or inside its outline (world.js pickAt army) and its small ring; else on its
  // army's ring; and anywhere on its cart, ox and drover (caravanPic)
  pick(at){at.add(this,at.army?.(this)?11:WORLD_BATTLE.on?marchInteractRadius(this):11,5);const s=caravanPic(this);at.fig(this,s,this.x-(s.width>>1),this.y+2*cvK()-s.height,this.dir<0);const B=at.flag&&bannerAt(this,0);if(B)at.flag(this,B)}
  // a small trade pennant in its owner's colour over its cart (Party banner)
  banner(){return{k:'trade',col:caravanCol(this),dev:'coin'}}
  headY(){const s=caravanPic(this);return Math.round(this.y+2*cvK()-s.height+opaqueBox(s)[1])}
  // (its cart, ox and drover at its guards' size (caravanSprite): its walk by its gait, its wheel by the way it has rolled; its
  // shadow under them)
  draw(ents,cam,V){if(!this.inView(V))return;const c=this;if(WORLD_BATTLE.on&&!B?.world?.hides(c))marchDraw(ents,c,cam);
    ents.push({y:c.y,f:()=>{subT(c);const L=c.look(),s=caravanSprite(L.col,caravanGait(c),frameOf(c,caravanRoll(),CARAVAN_ART.turns)),b=opaqueBox(s),k=cvK(),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y),
        e=[(b[0]-(s.width>>1))*k,(b[2]+1-(s.width>>1))*k].map(v=>v*(c.dir<0?-1:1)),x0=Math.round(Math.min(...e));ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(x0+sx+2,sy-1,Math.round(Math.abs(e[1]-e[0]))-4,2);
      drawCaravanArt(s,sx,sy,c.dir);
      BANNERQ.push({o:c,label:c.fromYou()<90?[L.label,L.labelCol]:null})}})}
  mapDot(V){return yourSight(V).sees(this.x,this.y)?['#e8d8a0',1]:null}
  get meetsAnyTime(){return true}
  label(){return 'Caravan of '+this.from}
  tip(){return '<b>Caravan</b><small>'+(this.from||'')+' → '+(this.to||'')+(this.fac?' · '+tipFac(this.fac):'')+'</small><span class="act">Click: actions · double-click: meet</span>'}
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
    if(a==='cv-attack'&&!c.mine&&P.fac!==c.fac){realmOf(c.fac).provoke(20,10);G.cv=null;
      startEncounter({kind:'caravan',ref:c,mine:true,list:c.troops.slice(),title:'Caravan of '+c.from});return true}
    return true;
  }
  // the spoils: its cargo (what fits) and the strongbox
  loot(){
    const c=this,got=Object.keys(c.goods).map(g=>{const n=invAdd('good',g,c.goods[g]);return n?n+' '+GOODS[g].n.toLowerCase():''}).filter(Boolean),gold=rint(20,50)+c.guards*5;P.gold+=gold;
    W.caravans=W.caravans.filter(x=>x!==c);addRep(c.from,-8,true);worldEmit('caravan:robbed',{caravan:c});// (the bus: news.js)
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
      else{log('The guards will not give up the carts.','bad');G.cv=null;startEncounter({kind:'caravan',ref:c,mine:true,list:c.troops.slice(),title:'Caravan of '+c.from})}return true}
    if(a==='cv-seize'&&playerFiefs().length&&P.fac!==c.fac){realmOf(c.fac).provoke(20,10);G.cv=null;
      startEncounter({kind:'caravan',ref:c,mine:true,seize:true,list:c.troops.slice(),title:'Caravan of '+c.from});return true}
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
      c.goods={};c.leg='back';c.to=c.home;c.turned=false;return false}
    // home again: pay out, and reload for another run if it is a standing route
    if(c.purse){P.gold+=c.purse;log('Your caravan is back at '+at.name+' with '+c.purse+' gold.','gold');c.purse=0}
    if(!c.repeat||at.owner!=='player'){log('Your caravan is disbanded at '+at.name+'.');return true}
    const load={};ensureEcon(at);for(const g in c.order){const n=Math.min(c.order[g],at.stock[g]||0);if(n>0){load[g]=n;at.stock[g]-=n}}
    if(!Object.keys(load).length){log('Your caravan waits at '+at.name+': nothing in stock to carry.');c.idle=true;return false}
    c.goods=load;c.leg='out';c.to=c.dest||c.to;c.turned=false;return false;
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

/* on the map: a covered two-wheeled cart behind its ox, its drover walking at the ox's head, drawn as the battle's figures are (the
   owner, 2026-11-01: "the caravan sprite looks out of place not match with battle style"): at their density (a man 16 high), lit
   from the top left in hue-shifted ramps (PX.ramp: the beasts' and the buildings' own), one navy outline round it all, and drawn
   on the map WORLD_BATTLE.sprite/scale as big, as the guards marching round it are (march.js drawMarcher; drawCaravanArt). Its
   cart a man and a half tall: the cover on its hoops in its owner's colour (col) mixed toward canvas, the near wheel and the far
   one in shade, a planked bed, its goods at the open back, the shafts to the ox's yoke; the ox a battle beast (engine/beasts.js's
   kit: its body, its walk); the drover a battle figure (people.js peopleSprite), hooded, his goad on his shoulder (figures.js
   GoadGear), his front in its owner's colour. f: its walk, 0 standing, 1 to steps its frames, the ox's and the drover's legs in
   step (caravanGait: the march's cadence); w: the wheel's turn, 0 to turns-1 of a spoke's eighth (by the distance walked:
   caravanRoll); how: 'left', the cart alone, its shafts on the ground; 'burnt', charred, its cover gone to its hoops (both:
   gfx/encounterscene.js). Each kept in spr, built once, in a 64 cell (32 alone: sprites.js cellOf), its middle where it stands */
const CV_WOOD=['#b8925e','#8e6a44','#604630','#3e2e26'];// (the map's old wood: ships.js)
// (a colour mixed toward another by k)
const cvMix=(a,b,k)=>'#'+[1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-k)+parseInt(b.slice(i,i+2),16)*k).toString(16).padStart(2,'0')).join('');
/* CARAVAN_ART, in the battle's pixels: W, H its picture (W alone: the cart's), the ground row H-2; cart [its back's x, its bed's
   length]; bed [top, bottom] rows over the ground; top the cover's; hoops along the bed; wheel [its middle along the bed, radius],
   far (the far wheel's offset); shaft [its height at the ox, its reach on the ground alone]; yoke, its top over the ground; ox, where
   the ox begins (its haunch 6 on: oxShape); drover, his middle's x. Its palette: cover (the canvas its owner's colour is mixed toward, by mix), the ox's coat, belly, muzzle,
   horn and hoof; the buildings' timber, plank and iron (engine/model.js), sack, char and embers (burnt); spokes, turns (frames to a
   spoke's turn), steps (the walk's frames); look, the drover's */
const CARAVAN_ART={W:64,H:28,alone:32,cart:[1,24],bed:[13,9],top:24,hoops:[6,11,16,21],wheel:[12,5.5],far:[-3,-1],shaft:[9,4],yoke:14,ox:25,drover:56,
  cover:'#d4c4a0',mix:.45,coat:'#b8a486',belly:'#d4c8ae',muzzle:'#cab49c',horn:'#ece4cc',hoof:'#3e302a',
  timber:'#5e402c',plank:'#8f6c49',iron:'#5a5e66',sack:'#c4b08a',char:'#3e3430',ember:['#e8803a','#c84a20'],spokes:8,turns:3,steps:4,
  look:{race:'human',skin:'skinTan',hair:'brown',beard:'brown',helm:'hood',hood:'linen',outer:'leather',inner:'dark',shortHair:true,goad:true}};
const CV_RAMPS=new Map(),cvRamp=c=>CV_RAMPS.get(c)||CV_RAMPS.set(c,PX.ramp(c)).get(c);
const cvK=()=>WORLD_BATTLE.sprite/WORLD_BATTLE.scale;
// (the map px its wheel rolls for a frame of its turn)
const caravanRoll=()=>2*Math.PI*CARAVAN_ART.wheel[1]*cvK()/CARAVAN_ART.spokes/CARAVAN_ART.turns;
// (its walk's frame now: its own time walked at the march's cadence, as its guards' legs go (march.js marchSprite); 0 standing)
const CV_GAIT=new WeakMap();
function caravanGait(c){const now=performance.now()/1000,g=CV_GAIT.get(c)||{t:0,at:now},go=mapStepping(c);if(go)g.t+=clamp(now-g.at,0,.1);g.at=now;CV_GAIT.set(c,g);
  return go?1+Math.floor(g.t*MARCH_MOVE.cadence)%CARAVAN_ART.steps:0}
// (the ox, a beast of the battle's (engine/beasts.js quad): heavy, a little hump at its withers, its head carried low, short horns,
// a dewlap, a long tail with its tuft; X its haunch's x, Y the ground row)
function oxShape(X,Y){const A=CARAVAN_ART,K=PX._beastKit,C=cvRamp(A.coat),D=cvRamp(A.hoof),Hn=cvRamp(A.horn);
  return{Y,hip:X+6,sho:X+17,back:[12,12],belly:4,ry:5,rh:5.5,rc:6,cx:1,hump:[1,4,2.5],legs:[3,3,0],C,L:cvRamp(A.belly),lb:0,D,paw:1,pawUp:0,
    head:{x:4,y:7,w:6,h:5,snout:[3,3],sy:1,M:cvRamp(A.muzzle),ex:0,ey:-1,eye:'#1a1410',
      ear:(g,x,y)=>{K.put(g,x-2,y-3,Hn[2]);K.put(g,x-2,y-4,Hn[2]);K.put(g,x,y-3,Hn[1]);K.put(g,x+1,y-4,Hn[0]);K.put(g,x+1,y-5,Hn[0]);K.put(g,x-3,y-1,C[1]);K.put(g,x-4,y-1,C[2])},
      more:(g,x,y)=>{for(const [dx,dy,t] of [[-3,3,1],[-2,3,1],[-3,4,2],[-4,4,2],[-4,5,3]])K.put(g,x+dx,y+dy,C[t])}},
    tail:(g,x,y)=>{K.flat(g,K.mask().limb(x+1,y,x-1,Y-5,1,1),C,2,2);K.put(g,x-1,Y-4,D[1]);K.put(g,x-2,Y-4,D[2]);K.put(g,x-1,Y-3,D[2])}}}
// (a wheel at (cx, cy), radius r: its iron tyre, its felloe, its spokes turned w frames, its hub; lit from the top left, dk tones
// darker (the far one); between its spokes nothing, so what is behind shows, and the outline fills the rest)
function cvWheel(g,cx,cy,r,w,dk,Wd,Ir){const A=CARAVAN_ART,n=A.spokes,a0=w/A.turns*2*Math.PI/n,t=(dx,dy,d)=>{const L=-(dx*.45+dy*.9)/Math.max(1,d);return Math.min(3,(L>.4?0:L>-.3?1:2)+dk)};
  for(let y=Math.floor(cy-r);y<=Math.ceil(cy+r);y++)for(let x=Math.floor(cx-r);x<=Math.ceil(cx+r);x++){const dx=x+.5-cx,dy=y+.5-cy,d=Math.hypot(dx,dy);if(d>r)continue;
    if(d>r-1)pset(g,x,y,Ir[Math.min(3,t(dx,dy,d)+1)]);else if(d>r-2)pset(g,x,y,Wd[t(dx,dy,d)]);else if(d<1.5)pset(g,x,y,Ir[Math.min(3,(dx<0&&dy<0?0:1)+dk)]);
    else for(let i=0;i<n;i++){const a=a0+i*2*Math.PI/n;if(dx*Math.cos(a)+dy*Math.sin(a)>0&&Math.abs(dx*Math.sin(a)-dy*Math.cos(a))<.55){pset(g,x,y,Wd[Math.min(3,1+dk)]);break}}}}
// (a line from (x0, y0) to (x1, y1), a staircase with its corners filled, its underside a tone darker: a shaft)
function cvLine(g,x0,y0,x1,y1,R){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))||1;let q=null;
  for(let i=0;i<=n;i++){const p=[Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n)];if(q&&q[0]!==p[0]&&q[1]!==p[1])pset(g,p[0],q[1],R[1]);pset(g,p[0],p[1],R[1]);pset(g,p[0],p[1]+1,R[2]);q=p}}
function caravanSprite(col,f,w,how){
  const A=CARAVAN_ART;f=(f||0)%(A.steps+1);w=(w||0)%A.turns;const key='cv'+col+f+w+(how||'');if(spr[key])return spr[key];
  const alone=!!how,burnt=how==='burnt',K=PX._beastKit,g=pgrid(alone?A.alone:A.W,A.H),Y=A.H-2,s=(x,y,c)=>pset(g,x,y,c);
  const Wd=cvRamp(burnt?A.char:A.timber),Pl=cvRamp(burnt?A.char:A.plank),Ir=burnt?Wd:cvRamp(A.iron),Cv=cvRamp(cvMix(col,A.cover,A.mix));
  const x0=A.cart[0],x1=x0+A.cart[1]-1,bt=Y-A.bed[0],bb=Y-A.bed[1],ct=Y-A.top,c0=x0+3,c1=x1-1,wx=x0+A.wheel[0]+.5,wy=Y+1-A.wheel[1];
  // the far wheel in shade; the bed, its planks (a rail, a seam, stakes); the near wheel before it
  cvWheel(g,wx+A.far[0],wy+A.far[1],A.wheel[1],w,2,Wd,Ir);
  for(let y=bt;y<=bb;y++)for(let x=x0;x<=x1;x++){const r=y-bt;s(x,y,Pl[y===bb?3:r===0?0:r===2?2:(x-x0)%6===5?2:x===x1?2:1])}
  cvWheel(g,wx,wy,A.wheel[1],w,0,Wd,Ir);
  // the cover on its hoops (lit on the left, a fold at each hoop), open at the back; burnt, only the hoops are left, charred
  const cover=K.mask().poly([[c0,bt],[c0,ct+3],[c0+2,ct+1],[c0+4,ct],[c1-3,ct],[c1-1,ct+1],[c1+1,ct+3],[c1+1,bt]]),topAt=x=>{for(let y=ct;y<bt;y++)if(cover.has(x,y))return y;return bt};
  if(!burnt){K.shade(g,cover,Cv,{cx:c0+4,cy:ct+3,rx:c1-c0,ry:bt-ct});for(const h of A.hoops){const x=x0+h;for(let y=topAt(x);y<bt;y++){s(x,y,Cv[y===topAt(x)?1:2]);if(cover.has(x+1,y)&&y>topAt(x))s(x+1,y,Cv[1])}}
    for(let y=topAt(c0);y<bt;y++)s(c0,y,Cv[3])}
  else{for(const h of A.hoops){const x=x0+h,t0=topAt(x);for(let y=t0;y<bt;y++)s(x,y,Wd[y===t0?1:2])}for(let x=c0;x<=c1;x++)if(A.hoops.some(h=>Math.abs(x0+h-x)===1))s(x,topAt(x),Wd[2])}
  // the goods at the open back: a crate, a sack on it (burnt: what is left of them, an ember in it)
  {const C=burnt?Wd:Pl,S=burnt?Wd:cvRamp(A.sack);for(let y=bt-5;y<bt;y++)for(let x=x0;x<x0+5;x++)s(x,y,C[y===bt-5?0:x===x0+4||y===bt-1?2:x===x0?1:(x+y)%4===0?2:1]);
    if(!burnt){const m=K.mask().ell(x0+5.5,bt-3,2.5,3);K.shade(g,m,S);s(x0+5,bt-7,S[2]);s(x0+5,bt-6,S[1])}else{s(x0+2,bt-3,A.ember[0]);s(x0+3,bt-2,A.ember[1]);s(x1-4,bt,A.ember[0])}}
  // the shafts on to the ox's yoke, or left on the ground
  const X=A.ox,sho=X+17;
  if(alone)cvLine(g,x1+1,bb-1,x1+A.shaft[1],Y-1,Pl);
  else{const F=K.gait(f?'walk':'idle',f?f-1:0);K.quad(g,oxShape(X,Y),F,{team:1});cvLine(g,x1+1,bb-1,sho,Y-A.shaft[0]+F.bob,Pl);
    // (the yoke on its neck before its withers, the shafts at it)
    for(let y=Y-A.yoke+F.bob;y<=Y-A.shaft[0]+F.bob;y++){s(sho+1,y,Wd[y===Y-A.yoke+F.bob?0:1]);s(sho+2,y,Wd[2])}}
  poutline(g);let c=pcanvas(g);
  // the drover at the ox's head, before it: a battle figure, walking as it walks
  if(!alone){const d=peopleSprite({...A.look,eye:PEOPLE_EYE,team:col},f?1+f:0),bg=c,H=Math.max(A.H,d.height);c=mkc(A.W,H,x=>{x.drawImage(bg,0,H-A.H);x.drawImage(d,A.drover-(d.width>>1),H-d.height)})}
  return spr[key]=cellOf(c);
}
// (drawn on the map at its guards' size, its feet on its point (x, y: on the screen), facing face: CaravanParty draw, EncounterScene)
function drawCaravanArt(s,x,y,face){const k=cvK();ctx.save();ctx.translate(x,y);ctx.scale(face<0?-k:k,k);ctx.drawImage(s,-(s.width>>1),2-s.height);ctx.restore()}
// (its picture at the map's own size: what a click answers on, the banner's height (CaravanParty pick, headY), a page's banner)
const CV_MAP=new WeakMap();
function caravanMapPic(s){let m=CV_MAP.get(s);if(m)return m;const k=cvK();m=mkc(Math.ceil(s.width*k),Math.ceil(s.height*k),g=>g.drawImage(s,0,0,s.width*k,s.height*k));
  m.cw=Math.ceil(s.cw*k);m.ch=Math.ceil(s.ch*k);CV_MAP.set(s,m);return m}
// (a caravan's picture, in its owner's colour: drawn as it looks (CaravanParty.look, draw), clicked on its whole cart, ox and
// drover: CaravanParty.pick)
const caravanCol=c=>c.fac==='player'||!FACS[c.fac]?FACS.player.col:FACS[c.fac].col,caravanPic=c=>caravanMapPic(caravanSprite(caravanCol(c)));
function drawCaravans(ents,cam,V){for(const c of W.caravans)c.draw(ents,cam,V)}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'caravans',order:{day:130},day:caravanDay});
Systems.add({name:'caravan upkeep',order:{day:190},day:caravanUpkeep});
