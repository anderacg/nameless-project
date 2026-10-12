'use strict';
/* ---------- critters: wild game to hunt and livestock to buy (or rustle) ---------- */
// W.critters: {crit:true, id, x, y, hx, hy, n, home (holding name, livestock only), t, a, dir, tire, cool, milked}
function spawnCritter(initial){
  const ids=Object.keys(CRITTERS).filter(k=>!CRITTERS[k].live),wt=id=>CRITTERS[id].w/(1+W.critters.filter(c=>c.id===id).length*.3);
  let r=Math.random()*ids.reduce((a,id)=>a+wt(id),0),id=ids[0];for(const f of ids){r-=wt(f);if(r<=0){id=f;break}}
  const D=CRITTERS[id];
  for(let k=0;k<200;k++){
    const x=rint(2,MW-3)*TILE+8,y=rint(2,MH-3)*TILE+8,tags=habitatAt(x,y);
    if(!D.where.some(w=>tags.includes(w))||Math.hypot(x-P.x,y-P.y)<(initial?120:200)||TOWNS.some(t=>Math.hypot(t.x-x,t.y-y)<56))continue;
    W.critters.push({crit:true,id,x,y,hx:x,hy:y,n:rint(D.herd[0],D.herd[1]),t:0,a:0,dir:1,tire:0,cool:0});return;
  }
}
// can this kind of livestock stand here? its own ground and climate, never a road, a holding's yard, or another estate's plot
const GROUND_OF={[T_OPEN]:'open',[T_HILL]:'hills',[T_FOREST]:'forest'};
function grazeOk(id,x,y,pen){
  if(pen)return x>=pen.x&&x<=pen.x+pen.w&&y>=pen.y&&y<=pen.y+pen.h;
  const G0=GRAZE[id];if(!G0)return passable(terrAt(x,y));const g=GROUND_OF[terrAt(x,y)];
  if(!g||!G0.on.includes(g)||G0.clim&&!G0.clim.includes(climAt(x,y)))return false;
  return !(typeof CLEAR!=='undefined'&&CLEAR&&isClear(x,y));
}
// wild game wanders inside its habitat
const habitatOk=(id,x,y)=>{const tags=habitatAt(x,y);return CRITTERS[id].where.some(w=>tags.includes(w))};
// one herd grazing beside a holding, of an animal its people keep and its land can feed: inside the pasture fence if it has one
function spawnHerd(t){
  if(typeof worldCv==='function')worldCv();
  const kinds=(LIVESTOCK[t.races[0]]||LIVESTOCK.human).slice().sort(()=>Math.random()-.5),sp=typeof bldSpots==='function'&&bldLv(t,'pasture')?bldSpots(t).pasture:null;
  if(sp){const lv=bldLv(t,'pasture'),w=16+6*lv,h=12+3*lv,pen={x:sp.x-w/2+3,y:sp.y-h/2+3,w:w-6,h:h-6},grazers=kinds.filter(id=>id!=='hen'),id=(grazers.length?grazers:kinds)[0],D=CRITTERS[id];
    W.critters.push({crit:true,id,x:sp.x,y:sp.y,hx:sp.x,hy:sp.y,pen,n:rint(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0});return true}
  for(const id of kinds){const D=CRITTERS[id],near=id==='hen';
    for(let k=0;k<80;k++){const a=Math.random()*6.283,d=(near?22:30)+Math.random()*(near?10:18),x=t.x+Math.cos(a)*d,y=t.y+12+Math.sin(a)*d;
      // the spot and the ground around it, so the herd has room to graze
      if(!grazeOk(id,x,y)||[[8,0],[-8,0],[0,6],[0,-6]].filter(([a2,b2])=>grazeOk(id,x+a2,y+b2)).length<3)continue;
      W.critters.push({crit:true,id,x,y,hx:x,hy:y,n:rint(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0});return true}}
  return false;
}
const herdOf=t=>W.critters.find(c=>c.home===t.name);
function initCritters(){TOWNS.filter(t=>t.kind!=='castle').forEach(spawnHerd);for(let i=0;i<CRITTER_START;i++)spawnCritter(true)}
// each day: game returns, herds regrow and empty pastures restock
function critterDay(){
  for(let k=0;k<3;k++)if(W.critters.filter(c=>!c.home).length<CRITTER_CAP&&Math.random()<.7)spawnCritter(false);
  for(const c of W.critters){const D=CRITTERS[c.id];if(c.n<D.herd[1]&&Math.random()<(c.home?.35:.15))c.n++}
  TOWNS.filter(t=>t.kind!=='castle'&&!herdOf(t)&&Math.random()<.25).forEach(spawnHerd);
}
// move every herd: wild game bolts when you come close and tires as it runs; livestock just grazes
function updateCritters(d){
  const hide=hiddenAt(P.x,P.y)?.6:1;
  for(const c of W.critters){
    const D=CRITTERS[c.id],dx=c.x-P.x,dy=c.y-P.y,dist=Math.hypot(dx,dy);c.cool=Math.max(0,c.cool-d);
    if(!D.live&&dist<D.shy*hide){const sp=D.spd*(c.tire>4?.4:1)*Math.min(1,speedAt(c.x,c.y)||1)*d;walk(c,dx,dy,sp);c.dir=dx>=0?1:-1;c.tire+=d}
    else{c.tire=Math.max(0,c.tire-d*.5);c.t-=d;if(c.t<=0){c.t=2+Math.random()*4;c.a=Math.random()*6.283;c.idle=Math.random()<.5}
      const hx=c.hx-c.x,hy=c.hy-c.y;if(Math.hypot(hx,hy)>(D.live?(c.pen?99:24):50))c.a=Math.atan2(hy,hx);
      if(!c.idle){const ok=D.live?(x,y)=>grazeOk(c.id,x,y,c.pen):(x,y)=>habitatOk(c.id,x,y);if(!walk(c,Math.cos(c.a),Math.sin(c.a),(D.live?4:8)*d,ok)){c.a=Math.atan2(hy,hx)+(Math.random()-.5);c.idle=true}c.dir=Math.cos(c.a)>=0?1:-1}}
    if(dist<10&&c.cool<=0&&G.encCool<=0&&!G.modal){c.cool=4;if(G.chase===c)G.chase=null;if(D.live){openHerd(c);return true}hunt(c)}
  }
  return false;
}
// a hunt: one animal, plus one for every 4 bows or slings and every 3 levels of Scouting; the rest scatter
const rangedCount=()=>Object.keys(P.troops).reduce((a,k)=>a+(ST[k].range?P.troops[k]:0),0);
function hunt(c){
  const D=CRITTERS[c.id],kills=Math.min(c.n,1+Math.floor(rangedCount()/4)+Math.floor(skill('scout')/3)+(Math.random()<.4?1:0));
  c.n-=kills;if(c.n<=0)W.critters=W.critters.filter(x=>x!==c);else{c.tire=0;c.cool=6}
  const meat=invAdd('good','meat',kills*D.meat),got=[meat+' meat'];
  if(D.mat){let m=0;for(let i=0;i<kills;i++)if(Math.random()<D.mat[1])m++;if(m){const k=invAdd('mat',D.mat[0],m);if(k)got.push(k+' '+MATS[D.mat[0]].n.toLowerCase()+(k>1?'s':''))}}
  gainXp(kills*D.xp);train('scout',kills*3);
  log('You bring down '+(kills>1?kills+' '+D.n.toLowerCase():an(D.one))+': '+got.join(', ')+'.'+(meat<kills*D.meat?' Your bag is full, so you leave some meat.':''),'good');
  updateHUD(true);
}
/* livestock: the herders' panel */
function openHerd(c){G.herd=c;G.herdMsg='';G.mode='herd';P.tx=null;showHerd()}
const milkCost=n=>n*3;
function showHerd(){
  const c=G.herd,D=CRITTERS[c.id],t=townBy(c.home),own=t?' of '+t.name:'',btn=(act,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const price=Math.round(D.price*(1-.015*skill('trade')));
  showPanel('<div class="top"><h2>'+D.n+'</h2><span class="muted">'+c.n+' grazing · herders'+own+' · <span class="gold">'+P.gold+' gold</span></span></div><p>The herders'+own+' watch you over their staffs while the '+D.n.toLowerCase()+' graze.</p>'+
    row('Buy '+an(D.one),'Slaughtered on the spot: +'+D.meat+' meat',btn('herd-buy','Buy '+price+'g',c.n<2?'They will not sell their last one':P.gold<price?'Not enough gold':goodRoom('meat')<D.meat?'No room in your bag':''))+
    (D.milk?row('Buy milk','+'+D.milk+' milk, fresh today',btn('herd-milk','Buy '+milkCost(D.milk)+'g',c.milked===G.day?'Already milked today':P.gold<milkCost(D.milk)?'Not enough gold':goodRoom('milk')<D.milk?'No room in your bag':'')):'')+
    row('Take one','+'+D.meat+' meat for free. The herders will tell '+(t?t.name:'everyone')+': reputation −12, honor −3',btn('herd-steal','Take it',c.n<1?'None left':goodRoom('meat')<D.meat?'No room in your bag':''))+
    (G.herdMsg?'<p class="gold">'+G.herdMsg+'</p>':'')+'<div class="btns"><button class="btn primary" type="button" data-act="herd-leave">Leave</button></div>');
}
function herdAct(a){
  if(!a.startsWith('herd-'))return false;
  const c=G.herd;if(G.mode!=='herd'||!c)return true;const D=CRITTERS[c.id],t=townBy(c.home),price=Math.round(D.price*(1-.015*skill('trade')));
  const done=m=>{G.herdMsg=m;log(m);updateHUD(true);showHerd()};
  if(a==='herd-leave'){G.herd=null;G.mode='world';G.encCool=1;hidePanel();return true}
  if(a==='herd-buy'&&c.n>=2&&P.gold>=price&&goodRoom('meat')>=D.meat){P.gold-=price;c.n--;invAdd('good','meat',D.meat);train('trade',price/30);if(t)addRep(t.name,price/80,true);done('You buy '+an(D.one)+' for '+price+' gold. +'+D.meat+' meat.')}
  else if(a==='herd-milk'&&D.milk&&c.milked!==G.day&&P.gold>=milkCost(D.milk)&&goodRoom('milk')>=D.milk){P.gold-=milkCost(D.milk);c.milked=G.day;invAdd('good','milk',D.milk);done('The herders fill your skins: +'+D.milk+' milk.')}
  else if(a==='herd-steal'&&c.n>=1&&goodRoom('meat')>=D.meat){c.n--;invAdd('good','meat',D.meat);if(t){addRep(t.name,-12,true);addHonor(t.owner,-3,true)}
    if(c.n<=0)W.critters=W.critters.filter(x=>x!==c);done('You drive off '+an(D.one)+' while the herders shout. '+(t?t.name+' will remember this.':''))}
  return true;
}
/* sprites: small side-on animals, 14x11, facing right */
function critterSprite(id){const k='cr'+id;return spr[k]||(spr[k]=mkc(14,11,g=>{
  const D=CRITTERS[id],c=D.col,dk=shade(c,.7),lt=shade(c,1.15),r=(col,x,y,w,h)=>rect(g,col,x,y,w||1,h||1),eye='#1a1410';
  if(D.bird){r(c,3,4,7,4);r(dk,3,7,7,1);r(lt,4,4,3,1);r(c,9,2,3,3);r('#e8b94a',12,3,2,1);r(eye,10,3,1,1);r(dk,1,3,3,2);r('#e8b94a',5,8,1,3);r('#e8b94a',8,8,1,3);if(id==='hen')r('#d83a2a',10,1,2,1);return}
  if(D.size===1){r(c,3,6,7,4);r(lt,4,6,4,1);r(c,9,4,3,3);r(c,9,1,1,3);r(c,11,1,1,3);r(dk,9,2,1,1);r(eye,11,5,1,1);r('#ffffff',2,6,2,2);r(dk,4,10,2,1);r(dk,8,10,2,1);return}
  const big=D.size===3,x0=1,w=big?9:8,y0=big?4:5,h=big?4:3,leg=11-(y0+h);
  r(c,x0,y0,w,h);r(lt,x0+1,y0,w-2,1);r(dk,x0,y0+h-1,w,1);r(dk,0,y0,1,2);
  [x0+1,x0+3,x0+w-3,x0+w-1].forEach(x=>r(dk,x,y0+h,1,leg));
  const hx=x0+w-1,hy=y0-2;r(c,hx,y0-1,2,3);r(c,hx+1,hy,3,3);r(dk,hx+3,hy+2,1,1);r(eye,hx+2,hy,1,1);
  if(D.spots){r(D.spots,x0+2,y0+1,2,2);r(D.spots,x0+5,y0,2,2)}
  if(D.wool){r('#ffffff',x0,y0-1,w,1);r('#ffffff',x0+1,y0+1,1,1);r('#ffffff',x0+4,y0+1,1,1);r(dk,hx+1,hy,3,3);r(eye,hx+2,hy,1,1)}
  if(id==='pig'){r('#f0b8b8',hx+3,hy+1,1,2);r(dk,x0,y0-1,1,1)}
  if(D.antlers){r('#e0d0b0',hx+1,hy-3,1,3);r('#e0d0b0',hx+2,hy-3,1,1);r('#e0d0b0',hx,hy-2,1,1);r('#e0d0b0',hx+3,hy-2,1,1)}
  else if(D.horns){r('#e8e4d0',hx+1,hy-1,1,1);r('#e8e4d0',hx+3,hy-1,1,1)}
  if(id==='deer'||id==='gazelle')r('#f0e8d8',x0+2,y0+1,1,1);
}))}
onAct('herd-',herdAct);
