'use strict';
/* ---------- estates and walls: what each holding has built ---------- */
// t.bld = {farm:lv, …}: 0 is none, up to BLD_MAX[kind]. t.wall = 0..WALL_MAX[kind]. t.work = {k, lv, done}: the project underway.
// Outdoor estates sit on a spot in the holding's land that suits them, where their workers go each day. What they make
// goes into the holding's stock (see economy.js); building needs gold and materials from that stock. Raids and sacks burn them.
// Walls make defenders stronger, sieges longer and the garrison bigger; a breach on capture costs a level.
const bldCost=(k,lv)=>ESTATES[k].cost*lv*lv;
const buildDays=lv=>1+2*lv;
const wallOf=t=>t.wall==null?WALL0[t.kind]:t.wall;
const bldLv=(t,k)=>t.bld&&t.bld[k]||0;
const bldTotal=t=>Object.keys(ESTATES).reduce((a,k)=>a+bldLv(t,k),0);

/* where each outdoor estate stands: the nearest suitable tile 3 to 11 tiles out (a port town looks up to 20 for its shore), apart from the other estates */
const GROUND={
  open:(x,y)=>tAt(x,y)===T_OPEN,
  forest:(x,y)=>tAt(x,y)===T_FOREST,
  rock:(x,y)=>passable(tAt(x,y))&&(tAt(x,y)===T_HILL||[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_MOUNT)),
  shore:(x,y)=>passable(tAt(x,y))&&tAt(x,y)!==T_ROAD&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>tAt(x+a,y+b)===T_WATER)
};
function bldSpots(t){
  if(t._spots)return t._spots;const sp={},taken=[];
  for(const k of Object.keys(ESTATES)){const g=ESTATES[k].ground;if(!g)continue;let best=null,bd=1e9;const R=k==='port'&&t.style==='port'?20:11;
    for(let y=t.ty-R;y<=t.ty+R;y++)for(let x=t.tx-R;x<=t.tx+R;x++){const d=Math.hypot(x-t.tx,y-t.ty);if(d<3||d>R||!GROUND[g](x,y))continue;
      if(taken.some(o=>Math.hypot(o[0]-x,o[1]-y)<3.5))continue;const s=d+hash(x,y,t.seed)*2;if(s<bd){bd=s;best=[x,y]}}
    if(best){taken.push(best);sp[k]={tx:best[0],ty:best[1],x:(best[0]+.5)*TILE,y:(best[1]+.5)*TILE}}}
  return t._spots=sp;
}
const canHave=(t,k)=>!ESTATES[k].ground||!!bldSpots(t)[k];
const bldCap=(t,k)=>canHave(t,k)?BLD_MAX[t.kind]:0;

// what a holding starts with: what its land and trade suggest
function initEstates(t){
  const R=seeded(t.seed*131+7),m=t.mod||{},b={},v=t.kind==='village',c=t.kind==='castle';
  const set=(k,lv)=>{b[k]=Math.min(bldCap(t,k),Math.max(0,lv))};
  set('farm',v?2:1+(m.grain<=.8?1:0));set('pasture',v?1:R()<.4?1:0);
  set('lumber',m.timber<=.75?2:R()<.5?1:0);set('mine',m.iron<=.8?2:R()<.4?1:0);
  set('port',t.style==='port'?2:R()<.3?1:0);set('workshop',c?0:m.cloth<=.85||m.furs<=.8?1+(v?0:1):0);set('market',c?0:v?0:1);
  set('quarry',m.iron<=1||c?1:R()<.3?1:0);set('smithy',v?0:1);set('brewery',v?(R()<.3?1:0):R()<.6?1:0);set('granary',c?1:R()<.3?1:0);
  t.bld=b;t.wall=WALL0[t.kind];t.work=null;
}
const estateLine=t=>{const ks=Object.keys(ESTATES).filter(k=>bldLv(t,k));return (ks.length?ks.map(k=>ESTATES[k].n+' '+bldLv(t,k)).join(', '):'none')};

// once a day: projects finish, caravan goods fade, and every realm slowly builds; the frontier fortifies first
function estateDay(){
  for(const t of TOWNS){
    if(!t.bld)initEstates(t);
    if(t.work){if(besieged(t))t.work.done++;else if(G.day>=t.work.done)finishWork(t)}
    if(t.owner==='player'||t.work||besieged(t)||ruined(t)||Math.random()>.05)continue;
    // what to build: walls on the frontier, then whatever the holding is shortest of
    const front=TOWNS.some(o=>o!==t&&atWar(t.owner,o.owner)&&Math.hypot(o.tx-t.tx,o.ty-t.ty)<60);
    let k=null;if(wallOf(t)<WALL_MAX[t.kind]&&(front||Math.random()<.2))k='wall';
    else{const ks=Object.keys(ESTATES).filter(e=>bldLv(t,e)<bldCap(t,e));ensureEcon(t);
      const want=e=>{const gs=ESTATES[e].goods;let w=gs.reduce((a,g)=>a+Math.max(0,1-(t.stock[g]||0)/targetStock(t,g)),0);if(e==='granary')w+=foodDays(t)<5?.6:0;if(e==='market')w+=.3;return w+Math.random()*.3};
      k=ks.sort((p,q)=>want(q)-want(p))[0]||null}
    if(!k)continue;const lv=k==='wall'?wallOf(t)+1:bldLv(t,k)+1,mats=k==='wall'?WALL_MAT[lv]:ESTATE_MAT(k,lv),gold=k==='wall'?WALL_COST[lv]:bldCost(k,lv);
    if(matsLacking(t,mats).length||!payRealm(t.owner,gold))continue;
    takeMats(t,mats);t.work={k,lv,done:G.day+buildDays(lv)};
    if(k==='wall'&&(t.owner===P.fac||Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5))log('The '+FACS[t.owner].n+' starts raising '+WALL_N[lv].toLowerCase()+' around '+t.name+'.');
  }
}
function finishWork(t){
  const w=t.work;t.work=null;if(w.k==='wall')t.wall=Math.min(WALL_MAX[t.kind],wallOf(t)+1);else t.bld[w.k]=Math.min(bldCap(t,w.k),bldLv(t,w.k)+1);
  if(t.owner==='player')log((w.k==='wall'?WALL_N[t.wall]+' now ring '+t.name:'The '+ESTATES[w.k].n.toLowerCase()+' of '+t.name+' reaches level '+t.bld[w.k])+'.','good');
}
// war's damage: burn n estates (fields and herds first), and breach the walls on capture
function burnEstates(t,n){
  const out=[];for(let i=0;i<n;i++){const ks=['farm','pasture','lumber','workshop','brewery','granary','market','smithy','quarry','mine','port'].filter(k=>bldLv(t,k));if(!ks.length)break;const k=ks[Math.random()<.6?0:rint(0,ks.length-1)];t.bld[k]--;out.push(ESTATES[k].n.toLowerCase())}
  if(t.work&&t.work.k!=='wall')t.work=null;return out;
}
const breach=t=>{t.wall=Math.max(0,wallOf(t)-1);if(t.work&&t.work.k==='wall')t.work=null};

/* someone else's estate: plunder or burn it */
/* estates: plunder or burn what a holding has built in its fields */
const estateGuards=(t,k)=>{const lv=bldLv(t,k),near=Math.hypot(bldSpots(t)[k].x-t.x,bldSpots(t)[k].y-t.y)<7*TILE,n=2+2*lv+(near?Math.min(4,t.gar||0):0),a=[];
  for(let i=0;i<n;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%3===2?c.ranged:c.melee)}return a};
function estatePick(t,k){const p=bldSpots(t)[k];return{est:true,town:t.name,k,x:p.x,y:p.y,fac:t.owner}}
function estateMeet(o){
  const t=townBy(o.town),k=o.k;if(!t||!bldLv(t,k))return;G.est=o;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const E=ESTATES[k],lv=bldLv(t,k),own=t.owner==='player',emp=P.fac&&P.fac===t.owner,out=(t.last&&t.last.out)||{},gs=E.goods.filter(g=>out[g]);
  const hands=(W.folk||[]).filter(f=>f.home===t.name&&f.k===k).length,guard=estateGuards(t,k),pw=rating(guard);
  showPanel('<div class="top"><h2>'+E.n+' of '+t.name+'</h2><span class="muted">Level '+lv+' · '+(t.owner?'<span style="color:'+FACS[t.owner].col+'">'+FACS[t.owner].n+'</span>':'')+'</span></div>'+
    '<p>'+E.d+'</p><p class="muted">'+(gs.length?'Yesterday it sent '+gs.map(g=>out[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+' to '+t.name+'. ':'')+(hands?hands+' at work here now. ':'')+(until(t,'fear')?'The workers are afraid to come out. ':'')+'</p>'+
    (own?'<p class="good">Your estate. Build and upgrade it from the Fief tab in '+t.name+'.</p><div class="btns">'+dlgBtn('dlg-close',null,'Leave',null,true)+'</div>':
     '<p>'+guard.length+' guards watch it (power '+pw+' vs your '+partyPower()+').</p><div class="btns">'+
     dlgBtn('es-plunder',null,'Plunder its stores',emp?'Your employer':troopCount()<3?'Need 3 troops':'')+dlgBtn('es-burn',null,'Burn it',emp?'Your employer':troopCount()<3?'Need 3 troops':'')+dlgBtn('dlg-close',null,'Leave',null,true)+'</div>'+
     '<p class="muted">Plunder: you fight the guards and take what the estate made for '+t.name+': reputation there −'+CONDUCT.plunderEstate.rep+', honor −'+CONDUCT.plunderEstate.honor+(hostileTo(t.owner)?'':', and the '+FACS[t.owner].n+' turns hostile for '+CONDUCT.plunderEstate.hostile+' days')+'. Burning also knocks it down a level and costs more: reputation −'+CONDUCT.burnEstate.rep+', honor −'+CONDUCT.burnEstate.honor+(hostileTo(t.owner)?'':', hostile for '+CONDUCT.burnEstate.hostile+' days')+'; its people may leave.</p>'));
}
function estateAct(a){
  const o=G.est,t=o&&townBy(o.town);if(!t||!bldLv(t,o.k)){closeDialog();return}
  if((a==='es-plunder'||a==='es-burn')&&troopCount()>=3&&P.fac!==t.owner){const burn=a==='es-burn';wrong(t,{hostile:(burn?CONDUCT.burnEstate:CONDUCT.plunderEstate).hostile});G.est=null;
    startEncounter({kind:'estate',ref:{town:t.name,k:o.k,burn,x:o.x,y:o.y,fac:t.owner,cool:0},list:estateGuards(t,o.k),title:'Guards of the '+ESTATES[o.k].n.toLowerCase()+' of '+t.name})}
}
// won the fight at an estate (from concludeEncounter): the spoils and the damage
function estateWon(e){
  const r=e.ref,t=townBy(r.town);if(!t)return '';ensureEcon(t);const lv=bldLv(t,r.k),M=MAKE[r.k]||{},got=[];
  for(const g in M.out||{}){const n=Math.min(t.stock[g]||0,Math.ceil(M.out[g]*Math.max(1,lv)*3));if(n<=0)continue;const k=invAdd('good',g,n);t.stock[g]-=n;if(k)got.push(k+' '+GOODS[g].n.toLowerCase())}
  const gold=rint(10,25)*Math.max(1,lv),c=r.burn?CONDUCT.burnEstate:CONDUCT.plunderEstate;P.gold+=gold;
  const cost=wrong(t,{rep:c.rep,honor:c.honor,fear:c.fear,pros:c.pros});
  if(r.burn){t.bld[r.k]=Math.max(0,lv-1);t.raided=Math.max(t.raided||0,G.day+4);mood('cruel')}
  return ' You '+(r.burn?'burn the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name+' (now level '+bldLv(t,r.k)+')':'plunder the '+ESTATES[r.k].n.toLowerCase()+' of '+t.name)+': '+(got.length?got.join(', ')+' and ':'')+gold+' gold. Its workers flee and '+t.name+' grows poorer ('+cost+').';
}

/* the Estates section of the Fief tab */
function estatesBody(t){
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  const w=t.work,busy=!!w,b=(arg,label,why)=>'<button class="btn sm" type="button" data-act="fief-build" data-arg="'+arg+'"'+(why?' disabled title="'+why+'"':'')+'>'+label+'</button>';
  const wl=wallOf(t),wn=wl+1,wc=WALL_COST[wn];
  const mt=(mats)=>{const l=matsLacking(t,mats);return ' Needs '+matsText(mats)+(l.length?' (short: '+l.join(', ')+')':'')+'.'};
  return '<div class="lab" style="margin-top:6px">Walls and estates · built with gold and materials from '+t.name+'&rsquo;s stock</div>'+
    (w?'<p class="gold" style="font-size:13px">Building: '+(w.k==='wall'?WALL_N[w.lv||wn]:ESTATES[w.k].n+' level '+(bldLv(t,w.k)+1))+', done in '+Math.max(1,w.done-G.day)+' days'+(besieged(t)?' (stopped by the siege)':'')+'. One project at a time.</p>':'')+
    row(WALL_N[wl]+(wl<WALL_MAX[t.kind]?'':' (best)'),'Defenders fight as level '+(1+wl)+'; sieges by lords take '+(2+wl)+' days; garrison up to '+fiefCap(t)+'.'+(wl<WALL_MAX[t.kind]?' Next: '+WALL_N[wn]+'.'+mt(WALL_MAT[wn]):''),
      wl<WALL_MAX[t.kind]?b('wall','Fortify '+wc+'g · '+buildDays(wn)+' days',busy?'Already building':P.gold<wc?'Not enough gold':matsLacking(t,WALL_MAT[wn]).length?'Not enough materials in stock':''):'')+
    Object.keys(ESTATES).map(k=>{const lv=bldLv(t,k),cap=bldCap(t,k),c=bldCost(k,lv+1);
      return row(ESTATES[k].n+' '+lv+' / '+(cap||'–'),ESTATES[k].d+(cap?(lv<cap?mt(ESTATE_MAT(k,lv+1)):''):' No suitable land near '+t.name+'.'),
        cap&&lv<cap?b(k,(lv?'Upgrade ':'Build ')+c+'g · '+buildDays(lv+1)+' days',busy?'Already building':P.gold<c?'Not enough gold':matsLacking(t,ESTATE_MAT(k,lv+1)).length?'Not enough materials in stock':''):'')}).join('');
}
function buildAct(t,k){
  if(t.work)return;
  if(k==='wall'){const n=wallOf(t)+1;if(n>WALL_MAX[t.kind]||P.gold<WALL_COST[n]||matsLacking(t,WALL_MAT[n]).length)return;P.gold-=WALL_COST[n];takeMats(t,WALL_MAT[n]);t.work={k,lv:n,done:G.day+buildDays(n)};log('Masons start on '+WALL_N[n].toLowerCase()+' at '+t.name+'.');return}
  if(!ESTATES[k])return;const lv=bldLv(t,k);if(lv>=bldCap(t,k))return;const c=bldCost(k,lv+1),mats=ESTATE_MAT(k,lv+1);if(P.gold<c||matsLacking(t,mats).length)return;P.gold-=c;takeMats(t,mats);t.work={k,lv:lv+1,done:G.day+buildDays(lv+1)};log('Work starts on the '+ESTATES[k].n.toLowerCase()+' of '+t.name+'.');
}

/* on the map: each estate drawn on its spot, sized by its level; walls around the holdings */
function estateSprite(k,lv,clim){
  const key='es'+k+lv+clim;if(spr[key])return spr[key];
  const crop={grass:['#c8b048','#a8903a'],frost:['#b8b090','#98907a'],desert:['#c8a050','#a8803a'],swamp:['#8a9a48','#6a7a38']}[clim]||['#c8b048','#a8903a'];
  const sz={farm:[14+8*lv,10+4*lv],pasture:[16+6*lv,12+3*lv],lumber:[22,16],mine:[22,16],quarry:[22,16],port:[26,16]}[k];if(!sz)return null;
  return spr[key]=mkc(sz[0],sz[1],g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1),[W,H]=sz;
    if(k==='farm'){r('#6a5030',0,0,W,H);for(let y=1;y<H-1;y+=2)r(y%4===1?crop[0]:crop[1],1,y,W-2,1);r('#8a6a3a',0,0,W,1);r('#8a6a3a',0,0,1,H)}
    else if(k==='pasture'){for(let x=0;x<W;x+=3){r('#8a6a3a',x,0,1,2);r('#8a6a3a',x,H-2,1,2)}r('#8a6a3a',0,1,W,1);r('#8a6a3a',0,H-1,W,1);for(let y=0;y<H;y+=3){r('#8a6a3a',0,y,1,1);r('#8a6a3a',W-1,y,1,1)}
      for(let i=0;i<lv+1;i++){const x=3+i*5%(W-6),y=3+(i*7)%(H-7);r('#f0ece0',x,y,3,2);r('#3a3020',x+3,y,1,1)}}
    else if(k==='lumber'){r('#6a4a2a',2,6,9,7);r('#8a3d2d',1,4,11,3);r('#3a2418',5,9,2,4);for(let i=0;i<lv+1;i++)r('#a8783a',13,8+i*2,8,2),r('#d8b070',13,8+i*2,1,2);r('#7a5a3a',16,3,3,2);r('#c8a060',16,3,1,2)}
    else if(k==='mine'){r('#5a5048',3,3,14,11);r('#2a2420',6,6,8,8);r('#7a5a3a',5,5,10,1);r('#7a5a3a',5,5,1,9);r('#7a5a3a',14,5,1,9);r('#8a8a90',16,11,5,3);r('#3a3030',16,14,1,1);r('#3a3030',20,14,1,1);for(let i=0;i<lv;i++)r('#c8ced8',17+i,10,1,1)}
    else if(k==='quarry'){r('#6a6a64',2,6,18,9);r('#8e8e86',3,4,12,4);r('#a8a8a0',4,4,6,1);r('#55554e',14,6,1,8);r('#55554e',8,8,1,7);for(let i=0;i<lv+1;i++){r('#b4b4ac',16-i*4,12,3,3);r('#8e8e86',16-i*4,14,3,1)}r('#7a5a3a',1,10,1,5)}
    else if(k==='port'){r('#8a6a3a',0,6,18,3);for(let x=1;x<18;x+=4)r('#5a3a20',x,9,1,3);r('#6a4a2a',18,4,8,5);r('#e8e4d0',21,0,1,4);r('#e8e4d0',22,1,3,3);if(lv>1){r('#6a4a2a',4,11,8,4);r('#e8e4d0',7,7,3,4)}}
  });
}
function drawEstates(cam,V){
  for(const t of TOWNS){if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>V+260)continue;const sp=bldSpots(t),clim=climAt(t.x,t.y);
    for(const k in sp){const lv=bldLv(t,k);if(!lv)continue;const s=estateSprite(k,lv,clim);if(!s)continue;const p=sp[k],sx=Math.round(p.x-s.width/2-cam.x),sy=Math.round(p.y-s.height/2-cam.y);
      if(sx>VW||sy>VH||sx+s.width<0||sy+s.height<0)continue;ctx.drawImage(s,sx,sy);
      if(Math.hypot(p.x-P.x,p.y-P.y)<60)txt(ESTATES[k].n,Math.round(p.x-cam.x),sy+s.height+7,'#c8c2ae','center')}}
}
// a ring around the holding: back half before its sprite, front half after
function drawWall(t,sx,sy,w,h,front){
  const lv=wallOf(t);if(!lv)return;const col=lv===1?'#7a5a32':'#8a8e98',dk=lv===1?'#4a3420':'#5a5e68',th=lv,x0=sx-4,x1=sx+w+4,yb=sy+h-2,yt=yb-Math.max(10,Math.round(h*.45));
  if(!front){rect(ctx,col,x0,yt,x1-x0,th);rect(ctx,col,x0,yt,th,yb-yt);rect(ctx,col,x1-th,yt,th,yb-yt);if(lv===1)for(let x=x0;x<x1;x+=2)rect(ctx,dk,x,yt-1,1,1);return}
  rect(ctx,col,x0,yb,x1-x0,th+1);rect(ctx,dk,x0,yb+th+1,x1-x0,1);
  if(lv===1)for(let x=x0;x<x1;x+=2)rect(ctx,dk,x,yb-1,1,1);else for(let x=x0;x<x1;x+=3)rect(ctx,col,x,yb-1,2,1);
  const gx=Math.round((x0+x1)/2)-2;rect(ctx,'#3a2418',gx,yb,4,th+1);
  if(lv===3)[x0-1,x1-4].forEach(x=>{rect(ctx,col,x,yt-4,5,yb-yt+th+5);rect(ctx,dk,x,yt-5,5,1);rect(ctx,dk,x+1,yt-2,1,2);rect(ctx,dk,x+3,yt-2,1,2)});
}
onAct('es-',estateAct);
