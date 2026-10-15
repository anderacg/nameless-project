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
  if(pen&&pen.town){const F=fieldsOf(townBy(pen.town),pen.k);return F?onFields(F,x,y):true}// (a pasture's fields: estates.js)
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
  // (a pasture's herd grazes the middle of its fields (or round the barn, if it has none), a sight to see: its herders are met at
  // the pasture itself (estates.js estateMeet))
  if(sp){const F=fieldsOf(t,'pasture'),lv=bldLv(t,'pasture'),w=16+6*lv,h=12+3*lv,pen=F?{town:t.name,k:'pasture'}:{x:sp.x-w/2+3,y:sp.y-h/2+3,w:w-6,h:h-6},at=F||sp,
      grazers=kinds.filter(id=>id!=='hen'),id=(grazers.length?grazers:kinds)[0],D=CRITTERS[id];
    W.critters.push({crit:true,decor:true,id,x:at.x,y:at.y,hx:at.x,hy:at.y,pen,n:rint(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0});return true}
  for(const id of kinds){const D=CRITTERS[id],near=id==='hen';
    for(let k=0;k<160;k++){const a=Math.random()*6.283,d=(near?22:30)+Math.random()*(near?10:18)+k*.5,// wider out if it finds no room close by
      x=t.x+Math.cos(a)*d,y=t.y+12+Math.sin(a)*d;
      // the spot and the ground around it, so the herd has room to graze
      if(!grazeOk(id,x,y)||[[8,0],[-8,0],[0,6],[0,-6]].filter(([a2,b2])=>grazeOk(id,x+a2,y+b2)).length<3)continue;
      W.critters.push({crit:true,id,x,y,hx:x,hy:y,n:rint(D.herd[0],D.herd[1]),home:t.name,t:0,a:0,dir:1,tire:0,cool:0,milked:0});return true}}
  return false;
}
const herdOf=t=>W.critters.find(c=>c.home===t.name);
// (a pasture herd from before: moved to the middle of its fields, to be seen only)
function herdToFields(c){const t=c.home&&townBy(c.home),F=t&&bldLv(t,'pasture')&&fieldsOf(t,'pasture');if(!c.pen||!t)return;c.decor=true;if(F&&!c.pen.town){c.pen={town:t.name,k:'pasture'};c.x=c.hx=F.x;c.y=c.hy=F.y}}
function initCritters(){TOWNS.filter(t=>t.T.herds).forEach(spawnHerd);for(let i=0;i<CRITTER_START;i++)spawnCritter(true)}
// each day: game returns, herds regrow and empty pastures restock
function critterDay(){
  for(let k=0;k<3;k++)if(W.critters.filter(c=>!c.home).length<CRITTER_CAP&&Math.random()<.7)spawnCritter(false);
  for(const c of W.critters){const D=CRITTERS[c.id];if(c.n<D.herd[1]&&Math.random()<(c.home?.35:.15))c.n++}
  TOWNS.filter(t=>t.T.herds&&!herdOf(t)&&Math.random()<.25).forEach(spawnHerd);
}
// move every herd: wild game bolts when you come close and tires as it runs; livestock just grazes
function updateCritters(d){
  const hide=P.stay?0:hiddenAt(P.x,P.y)?.6:1;
  for(const c of W.critters){
    const D=CRITTERS[c.id],dx=c.x-P.x,dy=c.y-P.y,dist=Math.hypot(dx,dy),ox=c.x,oy=c.y;c.cool=Math.max(0,c.cool-d);
    // (fleeing: its grazing ground goes with it, and it keeps on away a little after, so it does not turn back into you)
    if(!D.live&&dist<D.shy*hide){const sp=D.spd*(c.tire>4?.4:1)*Math.min(1,speedAt(c.x,c.y)||1)*d;walk(c,dx,dy,sp);c.tire+=d;
      c.hx=c.x;c.hy=c.y;c.a=Math.atan2(dy,dx);c.t=Math.max(c.t,1.5);c.idle=false}
    else{c.tire=Math.max(0,c.tire-d*.5);c.t-=d;if(c.t<=0){c.t=2+Math.random()*4;c.a=Math.random()*6.283;c.idle=Math.random()<.5}
      const hx=c.hx-c.x,hy=c.hy-c.y;if(Math.hypot(hx,hy)>(D.live?(c.pen?99:24):50))c.a=Math.atan2(hy,hx);
      if(!c.idle){const ok=D.live?(x,y)=>grazeOk(c.id,x,y,c.pen):(x,y)=>habitatOk(c.id,x,y);if(!walk(c,Math.cos(c.a),Math.sin(c.a),(D.live?4:8)*d,ok)){c.a=Math.atan2(hy,hx)+(Math.random()-.5);c.idle=true}}}
    // (it faces the way it went, turning only on a clear step sideways: no flicker as it swerves or runs straight up or down)
    {const mx=c.x-ox,my=c.y-oy;if(Math.abs(mx)>Math.hypot(mx,my)*.35&&Math.abs(mx)>.01)c.dir=mx>0?1:-1}
    if(dist<10&&!c.decor&&c.cool<=0&&G.encCool<=0&&!G.modal){c.cool=4;if(G.chase===c)G.chase=null;if(D.live){openHerd(c);return true}hunt(c)}
  }
  return false;
}
// a hunt: one animal, plus one for every 4 bows or slings and every 3 levels of Scouting; the rest scatter
const rangedCount=()=>Object.keys(P.troops).reduce((a,k)=>a+(ST[k].range?P.troops[k]:0),0);
function hunt(c){
  const D=CRITTERS[c.id],kills=Math.min(c.n,1+Math.floor(rangedCount()/4)+Math.floor(skill('hunt')/3)+(Math.random()<.4?1:0));
  c.n-=kills;if(c.n<=0)W.critters=W.critters.filter(x=>x!==c);else{c.tire=0;c.cool=6}
  const meat=invAdd('good','meat',kills*D.meat),got=[meat+' meat'];
  if(D.mat){let m=0;for(let i=0;i<kills;i++)if(Math.random()<D.mat[1]*(1+.05*skill('hunt')))m++;if(m){const k=invAdd('mat',D.mat[0],m);if(k)got.push(k+' '+MATS[D.mat[0]].n.toLowerCase()+(k>1?'s':''))}}
  gainXp(kills*D.xp);train('hunt',kills*3);
  log('You bring down '+(kills>1?kills+' '+D.n.toLowerCase():an(D.one))+': '+got.join(', ')+'.'+(meat<kills*D.meat?' Your bag is full, so you leave some meat.':''),'good');
  updateHUD(true);
}
/* livestock: the herders' panel */
// (from: the estate it was opened from, its pasture: Back returns there)
function openHerd(c,from){G.herd=c;G.herdFrom=from||null;G.herdMsg='';G.mode='herd';P.tx=null;showHerd()}
const milkCost=n=>n*3;
function showHerd(){
  const c=G.herd,D=CRITTERS[c.id],t=townBy(c.home),own=t?' of '+t.name:'',btn=(act,label,why)=>'<button class="btn sm" type="button" data-act="'+act+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const price=Math.round(D.price*(1-.015*skill('trade')));
  showPanel('<div class="top"><h2>'+D.n+'</h2><span class="muted">'+c.n+' grazing · herders'+own+' · <span class="gold">'+P.gold+' gold</span></span></div><p>The herders'+own+' watch you over their staffs while the '+D.n.toLowerCase()+' graze.</p>'+
    row('Buy '+an(D.one),'Slaughtered on the spot: +'+D.meat+' meat',btn('herd-buy','Buy '+price+'g',c.n<2?'They will not sell their last one':P.gold<price?'Not enough gold':goodRoom('meat')<D.meat?'No room in your bag':''))+
    (D.milk?row('Buy milk','+'+D.milk+' milk, fresh today',btn('herd-milk','Buy '+milkCost(D.milk)+'g',c.milked===G.day?'Already milked today':P.gold<milkCost(D.milk)?'Not enough gold':goodRoom('milk')<D.milk?'No room in your bag':'')):'')+
    row('Take one','+'+D.meat+' meat for free. The herders will tell '+(t?t.name:'everyone')+': reputation −12, honor −3',btn('herd-steal','Take it',c.n<1?'None left':goodRoom('meat')<D.meat?'No room in your bag':''))+
    (G.herdMsg?'<p class="gold">'+G.herdMsg+'</p>':'')+nav(G.herdFrom?['herd-back',null,'Back']:null,['herd-leave',null,'Leave']));
}
function herdAct(a){
  if(!a.startsWith('herd-'))return false;
  const c=G.herd;if(G.mode!=='herd'||!c)return true;const D=CRITTERS[c.id],t=townBy(c.home),price=Math.round(D.price*(1-.015*skill('trade')));
  const done=m=>{G.herdMsg=m;log(m);updateHUD(true);showHerd()};
  if(a==='herd-leave'){G.herd=null;G.herdFrom=null;G.mode='world';G.encCool=1;hidePanel();return true}
  if(a==='herd-back'&&G.herdFrom){const o=G.herdFrom;G.herd=null;G.herdFrom=null;estateMeet(o);return true}
  if(a==='herd-buy'&&c.n>=2&&P.gold>=price&&goodRoom('meat')>=D.meat){P.gold-=price;c.n--;invAdd('good','meat',D.meat);train('trade',price/30);if(t)addRep(t.name,price/80,true);done('You buy '+an(D.one)+' for '+price+' gold. +'+D.meat+' meat.')}
  else if(a==='herd-milk'&&D.milk&&c.milked!==G.day&&P.gold>=milkCost(D.milk)&&goodRoom('milk')>=D.milk){P.gold-=milkCost(D.milk);c.milked=G.day;invAdd('good','milk',D.milk);done('The herders fill your skins: +'+D.milk+' milk.')}
  else if(a==='herd-steal'&&c.n>=1&&goodRoom('meat')>=D.meat){c.n--;invAdd('good','meat',D.meat);if(t){addRep(t.name,-12,true);addHonor(t.owner,-3,true)}
    if(c.n<=0)W.critters=W.critters.filter(x=>x!==c);done('You drive off '+an(D.one)+' while the herders shout. '+(t?t.name+' will remember this.':''))}
  return true;
}
/* sprites: the animals side-on, facing right, on the people's scale (a person stands 15 high: a cow's back at his shoulder and its
   body half again his length, a deer's head as high as his, a sheep or a pig to his waist, a hen or a rabbit to his knee), drawn
   pixel by pixel with the people's outline (people.js), each in the smallest power-of-two cell it fits (8, 16, 32: sprites.js
   cellOf). f: the step (0, 1: the legs apart or crossed) */
// the four-legged: a body len × depth on legs leg long (lw: the near legs' width), a head hw × hh at hx past the chest and rise
// above the back, a neck between; top: room over the head (ears, horns, antlers); tail: hanging (its length), 'up', 'white' (a
// deer's scut) or 'curl'; the rest their marks
const BEASTS={
  cow:{len:15,depth:6,leg:4,lw:2,hw:5,hh:4,hx:-1,rise:1,top:2,tail:5,muzzle:'#e8b8b0',horns:'cow',spots:true,udder:true},
  pig:{len:8,depth:5,leg:2,lw:1,hw:3,hh:4,hx:0,rise:0,top:2,tail:'curl',snout:true,ears:'flop'},
  sheep:{len:9,depth:5,leg:3,lw:1,hw:3,hh:3,hx:0,rise:1,top:2,tail:2,wool:true,face:'#4a423c'},
  goat:{len:8,depth:4,leg:4,lw:1,hw:3,hh:3,hx:0,rise:3,top:3,tail:'up',horns:'back',beard:true},
  deer:{len:9,depth:4,leg:5,lw:1,hw:4,hh:3,hx:0,rise:3,top:2,tail:'white',ears:'up'},
  stag:{len:11,depth:5,leg:5,lw:1,hw:4,hh:3,hx:0,rise:3,top:6,nw:3,tail:'white',antlers:'stag',ears:'up'},
  reindeer:{len:10,depth:5,leg:4,lw:1,hw:4,hh:3,hx:0,rise:2,top:6,nw:3,tail:'white',antlers:'rein',ruff:true},
  ibex:{len:9,depth:4,leg:4,lw:1,hw:3,hh:3,hx:0,rise:2,top:4,tail:'up',horns:'arc',beard:true},
  gazelle:{len:8,depth:3,leg:5,lw:1,hw:3,hh:2,hx:0,rise:3,top:3,tail:'up',horns:'thin',stripe:true}
};
// the same animals made small, to fit a pasture's field tile (16 pixels: a sight on the fields, render.js); the big ones above
// stay for everywhere else
const BEASTS_SMALL={
  cow:{len:9,depth:4,leg:2,lw:1,hw:3,hh:3,hx:-1,rise:1,top:2,tail:3,muzzle:'#e8b8b0',horns:'cow',spots:true,udder:true},
  pig:{len:6,depth:3,leg:2,lw:1,hw:3,hh:3,hx:0,rise:0,top:2,tail:'curl',snout:true,ears:'flop'},
  sheep:{len:6,depth:4,leg:2,lw:1,hw:2,hh:2,hx:0,rise:1,top:2,tail:1,wool:true,face:'#4a423c'},
  goat:{len:6,depth:3,leg:3,lw:1,hw:2,hh:2,hx:0,rise:2,top:3,tail:'up',horns:'back',beard:true}
};
// the small: pixel templates, two steps each (H the coat, h its light, d its shade, k darker, w white, e eye, n nose, b beak,
// y legs, r comb)
const SMALL_BEASTS={
  rabbit:[['....hd','...hHH','.hHHHe','wHHHHn','.dHHdd','.dd.d.'],['....hd','...hHH','.hHHHe','wHHHHn','.dHHdd','dd...d']],
  hare:[['.....hd','.....hd','....hHH','..hHHHe','whHHHHn','.dHHHdd','.dd..d.'],['.....hd','.....hd','....hHH','..hHHHe','whHHHHn','.dHHHdd','dd....d']],
  hen:[['....r.','d..hHb','dd.HHr','dhhHH.','.dHHd.','..y.y.'],['....r.','d..hHb','dd.HHr','dhhHH.','.dHHd.','.y..y.']],
  fowl:[['...hH.','...HHb','dhhHH.','.HHHd.','..y.y.'],['...hH.','...HHb','dhhHH.','.HHHd.','.y..y.']]
};
function critterSprite(id,f,small){f=f?1:0;small=!!(small&&BEASTS_SMALL[id]);const k='cr'+id+f+(small?'s':'');if(spr[k])return spr[k];
  const D=CRITTERS[id],R=rampOf(D.col),eye='#1a1410',hoof='#2c2622';
  const T=SMALL_BEASTS[id];
  if(T){const rows=T[f],g=pgrid(rows[0].length+2,rows.length+2),col={H:R[1],h:R[0],d:R[2],k:R[3],w:'#f4f0e8',e:eye,n:'#e8a0a0',b:'#e8b94a',y:'#d8963a',r:'#d83a2a'};
    rows.forEach((r,y)=>[...r].forEach((c,x)=>{if(col[c])pset(g,x+1,y+1,col[c])}));poutline(g);return spr[k]=cellOf(pcanvas(g))}
  const B=small?BEASTS_SMALL[id]:BEASTS[id]||BEASTS.goat,F=B.face?rampOf(B.face):R,bx=2,ex=bx+B.len-1,by=B.top+B.rise,ey=by+B.depth-1,G=ey+B.leg,hy=by-B.rise,x0=ex+1+B.hx;
  const W=x0+B.hw+(B.snout?1:0)+1,g=pgrid(W,G+2),s=(x,y,c)=>pset(g,x,y,c);
  // the legs: the far pair darker, behind; the near pair over them; a stride (f) swings their lower half
  // (a stride: the near hind and the far fore swing back, the others forward; standing, the far leg just behind the near one)
  const low=y=>y>ey+Math.floor(B.leg/2),hN=bx+1,hF=hN+B.lw,fN=ex-B.lw,fF=fN-1;
  const leg=(x,near,fore)=>{for(let y=ey+1;y<=G;y++){const dx=f&&low(y)?(near===fore?1:-1):0,c=y===G?(id==='pig'?R[3]:hoof):near?F[1]:F[3];s(x+dx,y,c);if(near&&B.lw>1)s(x+1+dx,y,y===G?c:F[2])}};
  leg(hF,false,false);leg(fF,false,true);
  // the neck, widening to the chest; the body, light along the back and dark along the belly, its corners rounded
  for(let y=hy+1;y<=by+1;y++){const nl=x0-(B.nw||2)-Math.floor((y-hy)/2);for(let x=nl;x<=x0;x++)s(x,y,y===hy+1&&x===nl?R[0]:R[1])}
  for(let y=by;y<=ey;y++)for(let x=bx;x<=ex;x++){if((y===by||y===ey)&&(x===bx||x===ex))continue;s(x,y,y===by?R[0]:y===ey?R[2]:R[1])}
  leg(hN,true,false);leg(fN,true,true);
  // the head: its brow light, the jaw dark; a muzzle, a nose, an eye, an ear
  for(let y=hy;y<hy+B.hh;y++)for(let x=x0;x<x0+B.hw;x++){if(y===hy&&x===x0+B.hw-1&&B.hh>2)continue;s(x,y,y===hy?F[0]:y===hy+B.hh-1?F[2]:F[1])}
  const mx=x0+B.hw-1;
  if(B.muzzle){for(let y=hy+1;y<hy+B.hh;y++)s(mx,y,B.muzzle);s(mx,hy+2,shade(B.muzzle,.75))}else s(mx,hy+B.hh-2,F[3]);
  if(B.snout){s(mx+1,hy+1,'#f0b4b4');s(mx+1,hy+2,'#d88a8a')}
  s(x0+Math.max(B.hw>2?1:0,B.hw-3),hy+(B.hh>2?1:0),eye);
  if(B.ears==='up'){s(x0,hy-1,F[1]);s(x0-1,hy-1,F[2])}else if(B.ears==='flop'){s(x0,hy-1,R[2]);s(x0+1,hy-1,R[2]);s(x0+1,hy,R[2])}else s(x0-1,hy+1,F[2]);
  // its kind: horns, antlers, a beard, a ruff, wool, spots, an udder, a stripe
  if(B.horns==='cow'){s(x0+1,hy-1,'#e8e0c8');s(x0+2,hy-1,'#a89a7a')}
  if(B.horns==='back'){s(x0,hy-1,'#8a7a62');s(x0-1,hy-2,'#6a5a46')}
  if(B.horns==='thin'){s(x0+1,hy-1,'#3a3028');s(x0,hy-2,'#3a3028')}
  if(B.horns==='arc')[[1,-1],[0,-2],[-1,-3],[-2,-3],[-3,-2]].forEach(([x,y],i)=>s(x0+x,hy+y,i%2?'#6a5a46':'#9a8a6e'));
  if(B.antlers){const pts=B.antlers==='stag'?[[1,-1],[0,-2],[0,-3],[-1,-4],[-2,-5],[1,-3],[2,-4],[0,-5],[-3,-4]]:[[1,-1],[0,-2],[-1,-3],[-2,-4],[-2,-5],[2,-1],[3,-2],[0,-4],[1,-5],[-3,-3],[-4,-4]];
    pts.forEach(([x,y])=>s(x0+x-1,hy+y,'#b09a74'));pts.forEach(([x,y])=>s(x0+x,hy+y,'#e0d0b0'))}
  if(B.beard)s(mx-1,hy+B.hh,F[3]);
  if(B.ruff)for(let y=hy+B.hh;y<=by+2;y++){s(x0-1,y,'#ece6d8');s(x0,y,y>hy+B.hh?'#d8d0c0':'#ece6d8')}
  if(B.wool){for(let x=bx+1;x<ex;x+=3){s(x,by-1,R[0]);s(x+1,by-1,R[0])}for(let y=by+1;y<ey;y++)for(let x=bx+1;x<ex;x++)if((x*3+y*5)%7===0)s(x,y,R[2])}
  if(B.spots&&D.spots){(small?[[1,1],[2,1],[2,2],[5,0],[6,0],[6,1]]:[[2,1],[3,1],[2,2],[3,2],[4,2],[3,3],[8,0],[9,0],[8,1],[9,1],[10,1],[9,2],[12,3],[13,3],[12,4]]).forEach(([x,y])=>s(bx+x,by+y,D.spots));s(x0+1,hy+1,D.spots)}
  if(B.udder){const u=bx+Math.round(B.len*.42);s(u,ey+1,'#e8a8a8');if(!small)s(u+1,ey+1,'#d89090')}
  if(B.stripe)for(let x=bx+1;x<ex;x++){s(x,ey-1,R[3]);s(x,ey,'#f4ece0')}
  // the tail
  if(typeof B.tail==='number'){for(let i=0;i<B.tail;i++)s(bx-1,by+1+i,i===B.tail-1?R[3]:R[2])}
  else if(B.tail==='up'){s(bx-1,by,R[2]);s(bx-1,by-1,R[3])}
  else if(B.tail==='white'){s(bx-1,by,'#f4ece0');s(bx-1,by+1,'#e8dcc8');s(bx,by+1,'#f4ece0')}
  else if(B.tail==='curl'){s(bx-1,by,R[2]);s(bx-1,by-1,R[2]);s(bx,by-1,R[3])}
  poutline(g);return spr[k]=cellOf(pcanvas(g));
}
onAct('herd-',herdAct);
