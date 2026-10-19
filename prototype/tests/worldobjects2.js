'use strict';
// World objects, step 2 (parties.js WorldObject): the holdings and their estates, the sites, beasts, herds, refugees, workers and
// ships are world objects too, as the parties became in step 1: each says what it is, whether it is still there, where a click
// answers on it, how you meet it, what the pointer shows over it, how it is drawn and dotted on the minimap. Held here to the
// ways before (HEAD 460c917, kept below as text; there only the parties were world objects, so Party stands in for WorldObject):
// the same kinds, the same pick on every spot, the same dialogs, tooltips, chases, pictures and minimap, the same save.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,ev=s=>(0,eval)(s);try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.cv=null;G.pt=null;G.fg=null;G.par=null;G.town=null;G.site=null;G.herd=null;G.rf=null;G.wk=null;G.est=null;P.tx=null;G.chase=null};
 // ---- the ways before
 const OLD_OBJKIND=`const objKind=o=>o instanceof WorldObject?(o.here()?o.mapKind:null):o&&o.est?'estate':TOWNS.includes(o)?'town':W.monsters.includes(o)?'monster':W.sites.includes(o)?'site':W.critters.includes(o)?'critter':W.refugees.includes(o)?'refugee':W.folk.includes(o)?'worker':null;`,OLD_PICK=`function pickAt(wx,wy){
  const V=vis(),c=[],add=(o,r,dy)=>{const d=Math.hypot(o.x-wx,o.y-(dy||0)-wy);if(d<r&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([d,o])};
  // structures answer anywhere on what is drawn of them, ranked as near as their own spot (a holding's gate) but never nearer
  // than 12 pixels away, so someone clicked on top of one is picked, and a click on the gate still picks the holding
  const box=(o,x0,y0,x1,y1,dy)=>{if(wx>=x0&&wx<x1&&wy>=y0&&wy<y1&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([Math.min(12,Math.hypot(o.x-wx,o.y-(dy||0)-wy))+Math.hypot(o.x-wx,o.y-wy)/1000,o])};
  const camp=(o,sp)=>{const x0=o.x-sp.ax,y0=o.y+8-sp.ay;box(o,x0,y0,x0+sp.width,y0+sp.height)};// anywhere on its picture
  // a big figure (a mounted lord, a caravan's cart, ox and drover) answers anywhere on what is drawn of it (its picture s, cell
  // top left x0, y0, mirrored when it faces left: render.js opaqueBox), ranked 10-12 by how far from its middle: after anyone's
  // ring (someone small beside it, clicked on, is still picked), before a building it stands in front of
  const fig=(o,s,x0,y0,flip)=>{if(Math.hypot(o.x-wx,o.y-wy)>s.width)return;const b=opaqueBox(s),L=flip?x0+s.width-1-b[2]:x0+b[0],R=L+b[2]-b[0]+1,T=y0+b[1],Bt=y0+b[3]+1,hw=(R-L)/2,hh=(Bt-T)/2;
    if(wx>=L&&wx<R&&wy>=T&&wy<Bt&&Math.hypot(o.x-P.x,o.y-P.y)<V*1.2)c.push([10+2*Math.max(Math.abs(wx-L-hw)/hw,Math.abs(wy-T-hh)/hh),o])};
  // a holding answers on its square and on any of its buildings and walls; an estate on its building and its fields
  TOWNS.forEach(t=>{if(Math.hypot(t.x-P.x,t.y-P.y)>V+340)return;box(t,t.x-8,t.y-18,t.x+8,t.y+8,4);// its gate
    for(const l of t.lots||[]){const o=ESTATES[l.k]&&bldLv(t,l.k)?estatePick(t,l.k):t;box(o,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,ESTATES[l.k]?0:4);
      if(o!==t)plotsAt(t,l.k,bldLv(t,l.k)).forEach(([x,y])=>box(o,x*TILE,y*TILE,(x+1)*TILE,(y+1)*TILE))}});
  // a world object says where it is clicked (parties.js WorldObject.pick), with these
  const at={x:wx,y:wy,add,box,fig,camp};
  W.parties.forEach(o=>o.pick(at));W.monsters.forEach(m=>add(m,11,6));
  // each kind of site says where it is clicked (sites.js)
  W.sites.forEach(s=>{if(s.pickable())s.box(box,camp)});W.critters.forEach(k=>{if(!k.decor)add(k,9,4)});/* (a pasture's herd is only to be seen: the pasture answers) */W.caravans.forEach(k=>asParty(k).pick(at));W.refugees.forEach(k=>add(k,10,4));
  // (workers: met at their estate while they work inside it; out on the road with a delivery, met where they walk: folk.js)
  W.folk.forEach(k=>{if(folkOut(k))add(k,6,4)});
  c.sort((a,b)=>a[0]-b[0]);return c.length?c[0][1]:null;
}`,OLD_INTERACT=`function interact(o){
  const k=objKind(o);P.tx=null;G.chase=null;G.youAttack=true;
  try{
    if(o&&o.fight&&fightOf(o)){fightMeet(fightOf(o));return true}
    if(o instanceof WorldObject){if(k)o.meet()}// (a party: parties.js, caravans.js)
    else if(k==='town')approachHolding(o);
    else if(k==='monster')startMonster(o);
    else if(k==='site'){G.lastSite=o;enterSite(o)}
    else if(k==='refugee')refugeeMeet(o);
    else if(k==='worker')workerMeet(o);
    else if(k==='estate')estateMeet(o);
    else if(k==='critter'){o.cool=4;if(CRITTERS[o.id].live)openHerd(o);else hunt(o)}
    return !!k;
  }finally{G.youAttack=false}
}`,OLD_TIP=`function tipFor(o){
  const k=objKind(o),fc=f=>f&&FACS[f]?'<span style="color:'+FACS[f].col+'">'+FACS[f].n+'</span>':'',vs=pw=>{const [n,c]=odds(pw);return ' · <span class="'+c+'">'+n+'</span>'};
  if(k==='town')return '<b>'+o.name+'</b><small>'+cap1(o.label)+(o.owner?' of the '+fc(o.owner):'')+' · '+WALL_N[wallOf(o)]+'</small>'+(closedNow(o)?'<small class="bad">Under siege</small>':'')+'<span class="act">'+(hostileTo(o.owner)?'Click: attack it':'Click: enter')+'</span>';
  if(k==='estate')return '<b>'+ESTATES[o.k].n+'</b><small>Estate of '+o.town+'</small><span class="act">Click: look</span>';
  if(k==='lord')return '<b>'+o.name+' <span class="muted">Lv '+lordStats(o).lv+'</span></b><small>'+fc(o.fac)+' · '+o.troops.length+' soldiers'+vs(rating(o.troops))+paceVs(lordSpeed(o))+'</small><span class="act">Click: '+(hostileTo(o.fac)?'fight':'talk')+'</span>';
  if(k==='band')return '<b>'+(BANDS[o.kind||'bandits']?BANDS[o.kind||'bandits'][0].replace(' ahead',''):'Bandits')+'</b>'+chiefTip(o)+'<small>'+o.n+' fighters'+vs(bandPower(o))+paceVs(partySpeed(o,o.list||[]))+'</small><span class="act">Click: attack</span>';
  if(k==='monster'){const M=MONSTERS[o.id];return '<b>'+(M.n||o.id)+(o.n>1?' ×'+o.n:'')+'</b><small>Level '+o.lv+vs(monPower(o))+'</small><span class="act">Click: fight</span>'}
  if(k==='site')return o.tip();// (each kind of site: sites.js)
  if(k==='critter'){const D=CRITTERS[o.id];return '<b>'+D.n+(o.n>1?' ×'+o.n:'')+'</b><small>'+(D.live?'Livestock of '+o.home:'Wild game')+'</small><span class="act">Click: '+(D.live?'look':'hunt')+'</span>'}
  if(k==='caravan')return '<b>Caravan</b><small>'+(o.from||'')+' → '+(o.to||'')+(o.fac?' · '+fc(o.fac):'')+'</small><span class="act">Click: meet</span>';
  if(k==='refugee')return '<b>Refugees</b><small>From '+o.from+' to '+o.to+'</small><span class="act">Click: meet</span>';
  if(k==='patrol')return '<b>'+(o.watch==='night'?'Night watch':'Guards')+' of '+o.home+'</b><small>'+fc(o.fac)+' · '+o.troops.length+' soldiers'+(hostileTo(o.fac)?vs(rating(o.troops)):'')+'</small><span class="act">Click: meet</span>';
  if(k==='cparty')return '<b>'+COMPS[o.cid].short+'’s party</b><small>Your companion · '+o.troops.length+' soldiers · '+({follow:'riding with you',patrol:'patrolling '+o.base,return:'coming back'})[o.order]+'</small><span class="act">Click: orders</span>';
  // (a worker now has a name of his own, seeded from his estate (folk.js folkName): his card leads with it, the rest as before)
  if(k==='worker')return '<b>'+(o.name?o.name+', '+o.job:cap1(o.job))+'</b><small>Of '+o.home+'</small><span class="act">Click: talk</span>';
  return '';
}`,OLD_CHASE=`  if(G.chase){const o=G.chase,k=objKind(o);if(!k||o.dead||k==='site'&&!o.pickable()||k==='estate'&&!bldLv(townBy(o.town)||{},o.k))G.chase=null;else{P.tx=o.x;P.ty=o.y;
    if(Math.hypot(o.x-P.x,o.y-P.y)<=REACH&&!G.modal&&(G.encCool<=0||['town','site','critter','caravan','refugee','worker','estate','patrol'].includes(k))){interact(o);return}}}`;
 const OLD_DRAW=`function drawWorld(){
  reveal();const V=vis(),cam=G.cam;cam.x=Math.round(clamp(P.x-VW/2,0,MW*TILE-VW));cam.y=Math.round(clamp(P.y-VH/2,0,MH*TILE-VH));
  ctx.drawImage(worldCv(),cam.x,cam.y,VW,VH,0,0,VW,VH);
  drawEnv(cam,V,0);drawLand(cam);drawEstates(cam,V);
  const ents=[];
  W.sites.forEach(s=>{if(siteKnown(s))ents.push({st:true,y:s.y,f:()=>{const sx=Math.round(s.x-cam.x),sy=Math.round(s.y-cam.y);if(s.patch)ctx.drawImage(groundPatch(climAt(s.x,s.y)),sx-15,sy-4);if(s.cleared)ctx.globalAlpha=.5;const sp=siteSprite(s);ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);if(sp.fire&&!s.cleared)drawFire(sx-sp.ax+sp.fire[0],sy+8-sp.ay+sp.fire[1],s.seed);if(sp.flag&&!s.cleared)drawFlag(s.flagCol(),sx-sp.ax+sp.flag[0],sy+8-sp.ay+sp.flag[1],s.seed);ctx.globalAlpha=1;
    if(Math.hypot(s.x-P.x,s.y-P.y)<70)txt(s.name,sx,sy+12,s.cleared?'#9a958a':'#e4e0cf','center')}})});
  // the holdings are drawn as their placed buildings (lotEnts, called with the estates below)
  drawParties(ents,cam,V);// lords, bands, patrols and your companions' parties (each party draws itself: parties.js)
  W.monsters.forEach(m=>{const M=MONSTERS[m.id],Y=M.mythic;if(Y?Math.hypot(m.x-P.x,m.y-P.y)<V*1.6:spotted(m,V))ents.push({y:m.y+(Y&&Y.fly?30:0),f:()=>{
    const s=monsterMapSprite(m.id,Math.floor(performance.now()/(Y?260:D_STEP*1.4)+(m.hx||0))%(Y?2:4)),w=s.width,h=s.ch,sx=Math.round(m.x-cam.x),sy=Math.round(m.y-cam.y),lift=Y&&Y.fly?6-Math.round(Math.sin(performance.now()/260)*2):0;
    ctx.fillStyle='rgba(0,0,0,.3)';if(Y)ctx.fillRect(sx-8,sy-1,16,3);else ctx.fillRect(sx-5,sy-1,10,2);
    ctx.save();ctx.translate(sx,sy-lift);if(Y?m.dir<0:faceDir(m)<0)ctx.scale(-1,1);ctx.drawImage(s,-(w>>1),-s.height+2);ctx.restore();
    if(!Y)txt((m.n>1?m.n+' ':'')+'Lv'+m.lv,sx,sy-h,STANCE_COL[M.aggro||stance(monPower(m))==='afraid'?stance(monPower(m)):'wary'],'center')}})});
  // (a herd: up to three of its animals, behind and beside the first, each stepping as they go (critters.js critterSprite))
  // (a pasture's herd, only to be seen: one animal on each worked field tile, grazing to and fro on it)
  W.critters.forEach(c=>{if(!c.decor||Math.hypot(c.x-P.x,c.y-P.y)>V)return;const F=fieldsOf(townBy(c.home),'pasture');if(!F)return;
    F.tiles.slice(0,c.n).forEach(([tx,ty],i)=>{const y=ty*TILE+TILE-3;ents.push({y,f:()=>{const now=performance.now(),ph=now/2600+i*1.9+tx,mv=Math.cos(ph),fr=Math.abs(mv)>.6?Math.floor(now/D_STEP+i)%2:0,
      a=critterSprite(c.id,fr,true),x=Math.round(tx*TILE+TILE/2+Math.sin(ph)*3-cam.x),sy=Math.round(y-cam.y),w=Math.max(4,a.cw-2);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-(w>>1),sy-1,w,2);ctx.save();ctx.translate(x,sy);if(mv<0)ctx.scale(-1,1);ctx.drawImage(a,-(a.width>>1),-a.height+1);ctx.restore()}})})});
  W.critters.forEach(c=>{if(c.decor&&fieldsOf(townBy(c.home),'pasture'))return;if(spotted(c,V))ents.push({y:c.y,f:()=>{const s=critterSprite(c.id),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y),now=performance.now(),k=Math.min(3,c.n||1),sp=Math.max(4,Math.round(s.cw*.55));
    for(let i=k-1;i>=0;i--){const ox=i===0?0:i===1?-sp:Math.round(sp*.4),oy=i===0?0:i===1?-2:-4,fr=c.idle?0:Math.floor(now/(D_STEP)+c.x+i)%2,a=critterSprite(c.id,fr),w=Math.max(4,a.cw-2);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx+(c.dir<0?-ox:ox)-(w>>1),sy+oy-1,w,2);
      ctx.save();ctx.translate(sx+(c.dir<0?-ox:ox),sy+oy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(a,-(a.width>>1),-a.height+1);ctx.restore()}
    if(c.n>1&&!c.decor&&Math.hypot(c.x-P.x,c.y-P.y)<90)txt(String(c.n),sx,sy-s.ch-1,CRITTERS[c.id].live?'#e8d8a0':'#c8e0a0','center')}})});
  if(P.raid)ents.push({y:P.y-1,f:()=>txt('Raiding '+Math.round(P.raid.t/RAID_TIME*100)+'%',Math.round(P.x-cam.x),Math.round(P.y-20-cam.y),'#ff9a90','center')});
  if(P.siege)ents.push({y:P.y-1,f:()=>{const s=campSprite(77,'bandit'),X=Math.round(P.x-24-s.ax-cam.x),Y=Math.round(P.y+2-s.ay-cam.y);ctx.drawImage(s,X,Y);drawFire(X+s.fire[0],Y+s.fire[1],0);drawFlag(FACS.player.col,X+s.flag[0],Y+s.flag[1],0);txt('Siege day '+P.siege.days,Math.round(P.x-cam.x),Math.round(P.y-18-cam.y),'#e8b94a','center')}});
  // (you: on foot, a bob as you walk; mounted, your horse in its 32 cell on the same feet, your host behind it, as a lord's: drawParties)
  if(!P.stay)ents.push({y:P.y,f:()=>{const sx=Math.round(P.x-cam.x),sy=Math.round(P.y-cam.y),f=P.tx!=null?Math.floor(performance.now()/150)%2:0,s=partySprite('#e8b94a',mountDef()?mountDef().col:'',f),big=s.width>16;
    ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-5,sy-1,10,2);drawHost(partySize(),'#3d74d6',sx-(big?P.dir*6:0),sy+2,P.dir,P.tx!=null,5,P.race);ctx.save();ctx.translate(sx,sy-10);ctx.scale(P.dir,1);ctx.drawImage(s,-(s.width>>1),13-s.height-(big?0:f));ctx.restore()}});
  drawFolk(ents,cam,V);drawCaravans(ents,cam,V);drawShips(ents,cam,V);drawRefugees(ents,cam,V);drawFights(ents,cam,V);
  // buildings, camps and sites first (in their own order), then every character over them, then all their labels on top
  TXTQ=[];TXTQ.ctx=ctx;LIGHTQ=[];const bents=[];estateEnts(bents,cam,V);for(const e of ents.filter(e=>e.st))bents.push(e);
  bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  // fog of war: keep the scene of structures, draw everyone, then put the remembered scene back over all but your sight, so
  // nothing that moves shows outside it; labels likewise (a place's, where you know the land; anyone's, only in your sight)
  {const mg=memCv().getContext('2d');mg.clearRect(0,0,VW,VH);mg.drawImage(cv,0,0)}const nPlace=TXTQ.length,px0=P.x-cam.x,py0=P.y-cam.y;
  ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y).forEach(e=>e.f());
  ctx.save();ctx.beginPath();ctx.rect(0,0,VW,VH);ctx.arc(px0,py0,V,0,Math.PI*2,true);ctx.clip('evenodd');ctx.drawImage(memCv(),0,0);ctx.restore();
  const q=TXTQ;TXTQ=null;q.forEach((a,i)=>{const wx=a[1]+cam.x,wy=a[2]+cam.y;if(i<nPlace?seenAt(wx,wy+6):inSight(wx,wy+8))txt(...a)});
  drawEnv(cam,V,1);
  drawQuestMarks(cam);
  if(P.tx!=null){const sx=Math.round(P.tx-cam.x),sy=Math.round(P.ty-cam.y);ctx.strokeStyle='#e8b94a';ctx.lineWidth=1;ctx.strokeRect(sx-3.5,sy-3.5,7,7)}
  // fog and night
  // the land you remember, outside your sight, lies dim; land you have never seen is dark
  const px=P.x-cam.x,py=P.y-cam.y,gr=ctx.createRadialGradient(px,py,V*.82,px,py,V);gr.addColorStop(0,'rgba(5,8,20,0)');gr.addColorStop(1,'rgba(5,8,20,.5)');ctx.fillStyle=gr;ctx.fillRect(0,0,VW,VH);
  drawDark(cam);
  // the tile grid and a building being placed lie over the fog
  if(GRID.on||G.place)drawGrid(cam.x,cam.y,VW,VH,cam.x,cam.y,1);
  if(G.place)drawPlace(cam);
  const a=darkness();
  if(a>0){ctx.fillStyle='rgba(10,14,50,'+(a*.34).toFixed(3)+')';ctx.fillRect(0,0,VW,VH)}
  // torchlight: a warm glow over the dark, and the flame itself, flickering
  {const now=performance.now();for(const L of LIGHTQ){if(!inSight(L.x+cam.x,L.y+cam.y))continue;const r=L.r*(1+.06*Math.sin(now/90+L.x)),g=ctx.createRadialGradient(L.x,L.y,1,L.x,L.y,r);g.addColorStop(0,'rgba(255,190,90,'+(.12+.28*a).toFixed(3)+')');g.addColorStop(1,'rgba(255,150,60,0)');
    ctx.save();ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(L.x-r,L.y-r,2*r,2*r);ctx.restore();const f=Math.floor(now/120+L.x)%2;rect(ctx,'#e8803a',L.x-1+f,L.y-2,2,2);rect(ctx,'#ffe090',L.x,L.y-1-f,1,1)}}
  // minimap
  const MS=112/MW,mw=Math.round(MW*MS),mh=Math.round(MH*MS),mx=VW-mw-6,my=6,dot=(x,y,col,s)=>rect(ctx,col,mx+Math.floor(x/TILE*MS)-(s>>1),my+Math.floor(y/TILE*MS)-(s>>1),s,s);
  ctx.fillStyle='#000';ctx.fillRect(mx-1,my-1,mw+2,mh+2);ctx.drawImage(atSize(miniCv,mw,mh),mx,my);ctx.globalAlpha=.4;ctx.drawImage(atSize(landMiniCv(),mw,mh),mx,my);ctx.globalAlpha=1;ctx.drawImage(atSize(fogMiniCv(),mw,mh),mx,my);
  TOWNS.forEach(tw=>{if(seenTile(tw.tx,tw.ty))dot(tw.x,tw.y,tw._memCol||facCol(tw),3)});
  W.sites.forEach(s=>{if(siteKnown(s))dot(s.x,s.y,s.cleared?'#555':s.T.col,2)});
  W.monsters.forEach(m=>{const Y=MONSTERS[m.id].mythic;if(Math.hypot(m.x-P.x,m.y-P.y)<V)dot(m.x,m.y,Y?'#ff7a30':'#c58af0',Y?2:1)});
  // (the movers over the places: lords, bands, patrols and caravans in sight, each its own dot: WorldObject.mapDot)
  for(const o of worldObjects()){const d=o.mapDot(V);if(d)dot(o.x,o.y,d[0],d[1])}
  P.quests.forEach(q=>{const g=questGoal(q);if(g)dot(g.x,g.y,'#ffe040',2)});
  dot(P.x,P.y,'#fff',3);
}`,OLD_LOTS=`function lotEnts(ents,cam,V){
  for(const t of TOWNS){if(!t.lots||Math.hypot(t.x-P.x,t.y-P.y)>V+340)continue;const now=facCol(t),live0=inSight(t.x,t.y);if(live0)t._memCol=now;const col=live0?now:t._memCol||now;
    for(const l of t.lots){const N=l.n*TILE,X=Math.round(l.x*TILE-cam.x),Y=Math.round((l.y+l.n)*TILE-cam.y);if(X>VW||X+N<0||Y-N>VH+20||Y<-12)continue;
      ents.push({y:(l.y+l.n)*TILE-1,f:()=>{
        // outside your sight: the building as you last saw it (fog.js), or nothing if you never saw its ground
        const live=inSight((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE);
        if(!live){if(!seenTile(l.x,l.y)&&!seenTile(l.x+l.n-1,l.y+l.n-1))return;const m=l._mem||lotSprite(t,l);ctx.drawImage(m,X,Y-N);if(l.k==='centre'&&(l._memSt||l.st)!=='ruined'){if(m.flag)drawFlag(col,X+m.flag[0],Y-N+m.flag[1],t.seed);txt(t.name,Math.round(t.x-cam.x),Math.round(t.y+16-cam.y),'#a8a496','center')}return}
        const s=lotSprite(t,l),w=t.work&&(t.work.lot?t.work.lot===l.id:t.work.k===l.k||t.work.k==='wall'&&l.k==='centre'),p=w?workProg(t):0;l._mem=s;l._memSt=l.st;
        if(l.st==='building')drawSite(s,X,Y,N,p,false,l.seed);else{ctx.drawImage(s,X,Y-N);if(w&&l.st==='built')drawSite(s,X,Y,N,p,true,l.seed)}
        if(ESTATES[l.k]&&sabotaged(t,l.k)){const now=performance.now()/1000;for(let i=0;i<6;i++){const ph=(now*.35+i/6)%1;ctx.globalAlpha=(1-ph)*.6;rect(ctx,ph<.3?'#4a4440':'#7a7470',Math.round(X+N/2-1+Math.sin(ph*6+i)*3+ph*5),Math.round(Y-N*.6-ph*20),2,2)}ctx.globalAlpha=1}
        if(l.k==='centre'&&l.st!=='ruined'){if(s.flag)drawFlag(col,X+s.flag[0],Y-N+s.flag[1],t.seed);holdingLabel(t,cam,X,Y,N)}
        if(ESTATES[l.k]){const m=lotMid(l);if(Math.hypot(m.x-P.x,m.y-P.y)<60)txt(ESTATES[l.k].n,Math.round(m.x-cam.x),Y+8,'#c8c2ae','center')}}});
      if(l.k==='port'&&l.st==='built')for(const o of estateBoats(t,bldLv(t,'port')))ents.push({y:o.y,f:()=>drawMoored(o,cam)})}}
}`,OLD_FOLK=`function drawFolk(ents,cam,V){
  // (only those out on the road: the rest are at work inside their estate, or delivering inside the gate)
  for(const f of W.folk){if(!folkOut(f)||Math.abs(f.x-P.x)>V*1.3||Math.abs(f.y-P.y)>V*1.3)continue;
    ents.push({y:f.y,f:()=>{const fr=f.moving?Math.floor((performance.now()/180+f.ph))%2:0,t=townBy(f.home),s=folkSprite(f.job,fr,t&&t.races?t.races[0]:'human',Math.floor(f.ph*7),f.st==='out'),sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-3,sy-1,6,2);ctx.save();ctx.translate(sx,sy);if(f.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}})}
}`,OLD_SHIPS=`function drawShips(ents,cam,V){
  const now=performance.now();
  for(const s of W.ships){if(Math.hypot(s.x-P.x,s.y-P.y)>V*1.2)continue;
    ents.push({y:s.y+4,f:()=>{const b=shipSprite(s),sx=Math.round(s.x-cam.x),sy=Math.round(s.y+4-cam.y)+(Math.floor(now/450+s.seed)%2);
      const sailing=s.state!=='fish';
      if(sailing)for(let i=1;i<=3;i++){const ph=(now/300+i/3)%1;ctx.fillStyle=i===1?'#e8f4fa':'#bcd8e8';ctx.fillRect(sx-s.dir*(b.stern+i*3+Math.floor(ph*2)),sy-2+(i%2),2,1)}
      ctx.save();ctx.translate(sx,sy);if(s.dir<0)ctx.scale(-1,1);ctx.drawImage(b,-b.ax,-b.ay);ctx.restore();
      if(!sailing){const ph=(now/700+s.seed)%2;ctx.fillStyle='#d8c890';ctx.fillRect(sx+s.dir*b.net,sy-5,1,5);if(ph<1){ctx.fillStyle='#e8f4fa';ctx.fillRect(sx+s.dir*b.net-1,sy+1,3,1)}}
      if(s.k==='trade'&&Math.hypot(s.x-P.x,s.y-P.y)<110)txt('Trade ship',sx,sy-b.ay+opaqueBox(b)[1]-2,hostileTo(s.fac)?'#ff9a90':'#e8d8a0','center')}})}
}`,OLD_REF=`function drawRefugees(ents,cam,V){
  for(const r of W.refugees){if(Math.hypot(r.x-P.x,r.y-P.y)>V*1.2)continue;
    ents.push({y:r.y,f:()=>{const sx=Math.round(r.x-cam.x),sy=Math.round(r.y-cam.y),k=Math.min(6,Math.max(3,Math.ceil(r.n/3))),mv=performance.now();ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-8,sy-1,16,2);
      for(let i=0;i<k;i++){const px=sx-r.dir*((i%3)*6-6)+(i>2?-r.dir*3:0),py=sy-(i>2?3:0);const s=refugeeSprite(Math.floor(mv/220+i)%2,i);ctx.save();ctx.translate(px,py);if(r.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-15);ctx.restore()}
      if(Math.hypot(r.x-P.x,r.y-P.y)<90)txt('Refugees '+r.n,sx,sy-12,r.fear?'#ff9a90':'#c8c2ae','center')}})}
}`;
 window.__oldObjKind=ev('('+OLD_OBJKIND.replace('const objKind=','').replace(/;$/,'').replace('o instanceof WorldObject','o instanceof Party')+')');
 // (livestock, on purpose since: it lives in its holding's pasture, drawn with it (critters.js penEnts), never picked, met or
 // hovered, and nothing is bought from it; the old texts are read with that: a kept herd was picked, met (openHerd) and carded)
 const kept=s=>s.replace('W.critters.forEach(k=>{if(!k.decor)add(k,9,4)})','W.critters.forEach(k=>{if(!CRITTERS[k.id].live)add(k,9,4)})').replace('if(CRITTERS[o.id].live)openHerd(o);else hunt(o)','if(!CRITTERS[o.id].live)hunt(o)').replace("if(k==='critter'){const D=CRITTERS[o.id];return","if(k==='critter'){const D=CRITTERS[o.id];if(D.live)return '';return");
 const oldObjKind=window.__oldObjKind,oldPick=ev('('+kept(OLD_PICK)+')');
 const oldInteract=ev('('+kept(OLD_INTERACT).replace('objKind(o)','__oldObjKind(o)').replace('o instanceof WorldObject','o instanceof Party')+')');
 // (the helpers named there that are gone since, read as their methods now: item 10)
 const since=s=>s.replace(/siteKnown\(s\)/g,'s.known()').replace(/bandPower\(o\)/g,'o.power()').replace(/o\.list\|\|\[\]/g,'o.troops');
 const oldTip=ev('('+kept(since(OLD_TIP)).replace('objKind(o)','__oldObjKind(o)')+')');
 // (the chase: dropped when, and met during the cool-down after a fight: its two lines, read as two tests)
 const oldDrop=ev('(o=>{const k=__oldObjKind(o);return '+OLD_CHASE.slice(OLD_CHASE.indexOf('if(!k')+3,OLD_CHASE.indexOf(')G.chase=null'))+'})');
 const oldCool=ev('(k=>'+OLD_CHASE.match(/(\[\'town\'[^\]]*\])\.includes\(k\)/)[0]+')');
 // (the depth work (gfx/depth.js, doc/WORLD_DESIGN.md §12.5) changed what is drawn on purpose: each structure's shadow is its own
 // picture, laid in one pass under them all (structures.js drawShadows), its picture kept for the depth (depthPic); everyone who
 // moves has what stands in front of him drawn again over him (worldOverdraw); the clouds and weather, fog, night and lights come
 // before the banners, labels, quest marks and your goal. The old texts are read with those changes, so the rest is held as before)
 const depthLots=s=>s.replace(/(      ents\.push\(\{y:\(l\.y\+l\.n\)\*TILE-1,)f:\(\)=>\{\n(\s*\/\/[^\n]*\n)\s*const live=inSight[^\n]*\n/,
   (m,a,c)=>"      const live=inSight((l.x+l.n/2)*TILE,(l.y+l.n/2)*TILE),sm=live?l.st!=='building'&&lotSprite(t,l):(seenTile(l.x,l.y)||seenTile(l.x+l.n-1,l.y+l.n-1))&&(l._mem||lotSprite(t,l));\n"+a+"sh:sm&&sm.sh?[sm.sh,X,Y-N]:null,f:()=>{\n"+c)
  .replace('ctx.drawImage(m,X,Y-N);','ctx.drawImage(m,X,Y-N);depthPic(m,X,Y-N);').replace('else{ctx.drawImage(s,X,Y-N);','else{ctx.drawImage(s,X,Y-N);depthPic(s,X,Y-N);');
 const depthDraw=s=>{const m=s.match(/(const q=TXTQ;TXTQ=null;[^\n]*)\n\s*drawEnv\(cam,V,1\);\n\s*drawQuestMarks\(cam\);\n\s*(if\(P\.tx!=null\)[^\n]*)\n/);
  return s.replace(m[0],'drawEnv(cam,V,1);\n').replace('  // minimap','  drawBanners(cam);'+m[1].replace(/q\.forEach\([^\n]*/,'labelLayout(q,nPlace,cam).forEach(a=>txt(...a));')+'drawQuestMarks(cam);'+m[2]+'\n  // minimap')
   .replace('ents.push({st:true,y:s.y,f:','ents.push({st:true,y:s.y,sh:(q=>q.sh?[q.sh,Math.round(s.x-cam.x)-q.ax,Math.round(s.y-cam.y)+8-q.ay]:null)(siteSprite(s)),f:')
   .replace('ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);','ctx.drawImage(sp,sx-sp.ax,sy+8-sp.ay);if(!s.cleared)depthPic(sp,sx-sp.ax,sy+8-sp.ay);')
   .replace('bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());','WDEPTH.pics.length=0;drawShadows(bents);bents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());')
   .replace('ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y).forEach(e=>e.f());','worldOverdraw(ents.filter(e=>!e.st).sort((a,b)=>a.y-b.y),cam);')};
 ev('window.__oldLotEnts=('+depthLots(OLD_LOTS)+');window.__oldDrawFolk=('+OLD_FOLK+');window.__oldDrawShips=('+OLD_SHIPS+');window.__oldDrawRefugees=('+OLD_REF+')');
 // (drawWorld as it was: its helpers as they were; the minimap's movers were then the parties and caravans: worldObjects; the fog
 // as it is now (fog.js fogMem, drawWorldFog: the fog's look is tests/fog.js's))
 // (Phase 1 redrew the map's figures smaller on purpose, D25 (mapfigures.js holds them to their sizes): you are drawn as now in
 // both, and the movers the text draws its own old ways (beasts, herds, workers, ships, refugees, fights) are taken off the map
 // while the two are compared below; the parties and caravans draw themselves in both)
 // (and the parties' banners, drawn over all, as now: drawBanners; a spot on a banner picks its party, below; the labels laid out as
 // now: render.js labelLayout, tests/labels.js)
 const PLINE=/if\(!P\.stay\)ents\.push\(\{y:P\.y,(?:own:1,)?f:\(\)=>\{[\s\S]*?\}\}\);/,nowP=t.drawWorld.toString().match(PLINE)[0];const onFlag=(q,x,y)=>{const B=q&&q.banner&&t.bannerAt(q,0);if(!B)return false;const b=t.opaqueBox(B.s);return x>=B.x+b[0]&&x<=B.x+b[2]&&y>=B.y+b[1]&&y<=B.y+b[3]};
 const oldDraw=ev('('+depthDraw(since(OLD_DRAW)).replace(PLINE,()=>nowP).replace('estateEnts(bents,cam,V)','__oldLotEnts(bents,cam,V)').replace('drawFolk(ents,cam,V)','__oldDrawFolk(ents,cam,V)').replace('drawShips(ents,cam,V)','__oldDrawShips(ents,cam,V)').replace('drawRefugees(ents,cam,V)','__oldDrawRefugees(ents,cam,V)').replace('worldObjects()','[...W.parties,...W.caravans.map(asParty)]').replace('atSize(miniCv,mw,mh)','atSize(WorldArt.mini(1),mw,mh)').replace("ctx.save();ctx.beginPath();ctx.rect(0,0,VW,VH);ctx.arc(px0,py0,V,0,Math.PI*2,true);ctx.clip('evenodd');ctx.drawImage(memCv(),0,0);ctx.restore();",'fogMem(memCv(),px0,py0,V);').replace(/const px=P\.x-cam\.x,py=P\.y-cam\.y,gr=[^\n]*\n\s*drawDark\(cam\);/,'drawWorldFog(cam,V);')+')');
 ok([OLD_PICK,OLD_INTERACT,OLD_TIP,OLD_DRAW].every(s=>s.length>500)&&/estateEnts\(bents/.test(OLD_DRAW)&&/worldObjects\(\)/.test(OLD_DRAW),'the old ways are kept as text ('+[OLD_PICK,OLD_INTERACT,OLD_TIP,OLD_DRAW].map(s=>s.length).join(', ')+' characters)');
 // ---- a crowd by a holding: a lord, a band beside him, two patrols, a caravan, your companion's party, a beast and the dragon,
 // herds wild and kept, refugees, workers on the road, every kind of site and a ship; some made as a save or a test makes them
 // (plain data), the rest as the game does
 const tw=t.townBy('Ashford'),other=t.TOWNS.find(x=>x!==tw&&x.owner&&!t.hostileTo(x.owner)),cx=tw.x+8,cy=tw.y+22;
 G.lastTown=null;P.x=cx;P.y=cy+40;P.fac=null;P.hostile={};W.fights=[];t.bandits.length=0;W.patrols=[];W.caravans=[];W.refugees=[];W.folk=[];W.ships=[];W.monsters=[];
 W.lords.forEach(l=>{l.x=-9999;l.y=-9999;l.fight=null});
 const L=W.lords.find(l=>!l.dead&&!t.hostileTo(l.fac));Object.assign(L,{x:cx,y:cy,inside:null,fight:null,state:'march'});
 t.spawnBandit(true);const b=t.bandits[0];Object.assign(b,{x:cx+5,y:cy+1,fight:null,cool:0});
 const pt=t.asParty({pt:true,watch:'day',home:tw.name,fac:tw.owner,troops:['hum_spear','hum_spear','hum_bow'],x:cx-22,y:cy+8,wx:null,wy:null,cool:0,dir:1});W.patrols.push(pt);
 const pn=t.asParty({pt:true,watch:'night',home:tw.name,fac:tw.owner,troops:['hum_spear','hum_bow'],x:cx-40,y:cy+20,wx:null,wy:null,cool:0,dir:-1});W.patrols.push(pn);
 const cv=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:other.name,x:cx+30,y:cy+6,goods:{grain:5},guards:3,cool:0,dir:-1});W.caravans.push(cv);
 P.comps={brann:{ap:5,role:''}};t.compInit('brann').lv=3;P.troops={hum_levy:6};t.cpGive('brann','hum_levy',4);const cp=P.comps.brann.party;Object.assign(cp,{x:cx+14,y:cy-12,order:'stay'});
 const mo={id:'wolf',x:cx-12,y:cy-14,hx:cx-12,hy:cy-14,lv:2,n:3,t:0,a:0,cool:0},dr={id:'dragon',x:cx+44,y:cy-30,hx:cx,hy:cy,tx:cx,ty:cy,lv:1,n:1,t:0,a:0,cool:5,dir:-1};W.monsters.push(mo,dr);
 const deer={crit:true,id:'deer',x:cx-30,y:cy-4,hx:cx-30,hy:cy-4,n:3,t:0,a:0,dir:1,tire:0,cool:0},cow={crit:true,id:'cow',x:cx+22,y:cy+16,hx:cx,hy:cy,n:3,home:tw.name,t:0,a:0,dir:-1,tire:0,cool:0,milked:0};W.critters.push(deer,cow);
 const rf=t.sendRefugees(tw,other,'hardship');if(rf)Object.assign(rf,{x:cx+40,y:cy-10});
 const rf2={rf:true,from:other.name,to:tw.name,n:7,why:'hunger',race:'human',goods:{},purse:3,x:cx-6,y:cy+24,dir:-1,cool:0};W.refugees.push(rf2);
 G.clock=t.DAY*.2;for(let i=0;i<40;i++)t.updateFolk(.05);const ws=W.folk.filter(f=>f.home===tw.name);
 if(ws[0])Object.assign(ws[0],{st:'out',x:cx+10,y:cy+10,dir:1});if(ws[1])Object.assign(ws[1],{st:'back',x:cx-18,y:cy-20,dir:-1});
 const wk={folk:true,home:tw.name,k:ws[0]?ws[0].k:'farm',job:ws[0]?ws[0].job:'farmer',x:cx+2,y:cy-6,tx:cx,ty:cy,st:'out',leave:.5,done:-1,dir:1,ph:1};W.folk.push(wk);
 const byType=k=>W.sites.find(s=>s.type===k),sites=['cave','ruins','shrine','hideout','travelers','camp'].map(byType).filter(Boolean);
 sites.forEach((s,i)=>{s.x=cx-50+i*20;s.y=cy-34+(i%2)*14;s.seen=true;s.cleared=false});
 const ship={k:'trade',home:tw.name,to:other.name,fac:tw.owner,x:cx+50,y:cy+30,path:[],i:0,seed:3,dir:-1,state:'out',big:true,col:'#a8483a'};W.ships.push(ship);
 const ests=tw.estates(),moved=[...W.monsters,...W.critters,...W.refugees,...W.folk,...W.ships];
 // ---- each is a world object of its kind, made one in place
 {const plain=[mo,dr,deer,cow,rf2,wk,ship];ok(plain.every(q=>!(q instanceof t.WorldObject))&&[rf].every(q=>q instanceof t.WorldObject),'made as plain data, things stay plain until the map asks; made by the game, they are their kind at once');
  const wo=t.worldObjects();
  ok(plain.every(q=>q instanceof t.WorldObject&&wo.includes(q))&&W.monsters[0]===mo&&W.critters.includes(cow),'worldObjects() makes each its kind in place (the same objects, in their lists)');
  ok(tw instanceof t.WorldObject&&tw instanceof t.HoldingObject&&tw instanceof t.City&&tw.T===t.HOLDING_TYPES.city&&tw.has(tw.T.tabs[0])&&tw.label===t.HOLDING_TYPES.city.n,'a holding is a world object, and still its kind of holding (its T, label, tabs)');
  ok(ests.length>=2&&ests.every(e=>e instanceof t.Estate&&e.est&&e.town===tw.name&&t.bldLv(tw,e.k)),'its built estates are world objects ('+ests.map(e=>e.k).join(', ')+')');
  const kinds=[[tw,'town'],[ests[0],'estate'],[mo,'monster'],[dr,'monster'],[sites[0],'site'],[deer,'critter'],[rf,'refugee'],[wk,'worker'],[ship,'ship'],[L,'lord'],[b,'band'],[pt,'patrol'],[cv,'caravan'],[cp,'cparty']];
  ok(kinds.every(([q,k])=>q.mapKind===k),'each says what it is: '+kinds.map(([q])=>q.mapKind).join(', '));
  ok(sites.every(s=>s instanceof t.Site&&s instanceof t.WorldObject)&&W.sites.every(s=>s.mapKind==='site'),'every site is a world object ('+sites.map(s=>s.type).join(', ')+')');
  // (in their order: a holding then its estates, the parties, the beasts, the sites, the herds, the caravans, the refugees,
  // the workers, the ships, the fights; everything in their lists, nothing else)
  const ix=q=>wo.indexOf(q),seq=[tw,ests[0],L,b,pt,cp,mo,sites[0],deer,cv,rf,wk,ship];
  const all=[...t.TOWNS,...t.TOWNS.flatMap(x=>x.estates()),...W.parties,...W.monsters,...W.sites,...W.critters,...W.caravans,...W.refugees,...W.folk,...W.ships,...W.fights];
  ok(seq.every((q,i)=>!i||ix(seq[i-1])<ix(q))&&ix(ests[ests.length-1])<ix(t.TOWNS[t.TOWNS.indexOf(tw)+1]||L)&&wo.length===all.length&&all.every(q=>wo.includes(q))&&!wo.includes(P),'worldObjects() lists everything on the map in its order ('+wo.length+'), not you');
  const names=['mapKind','here','fromYou','inView','pick','meet','chaseable','meetsAnyTime','tip','draw','mapDot','est','estates','pickOn','pasture'];
  const shadow=wo.filter(q=>names.some(n=>Object.prototype.hasOwnProperty.call(q,n)));ok(!shadow.length,'no field of anything on the map hides a world-object method'+(shadow.length?': '+shadow.slice(0,3).map(q=>q.mapKind).join():''))}
 // ---- an estate: one object per holding and kind (no throwaway on every pick), its spot and owner as they are now
 {const e=ests[0],p=t.bldSpots(tw)[e.k],o0=tw.owner;ok(t.estatePick(tw,e.k)===e&&e.x===p.x&&e.y===p.y&&e.fac===tw.owner,'estatePick gives the same estate each time, at its building ('+e.k+')');
  tw.owner='player';ok(t.estatePick(tw,e.k).fac==='player','with its holding’s owner as it is now');tw.owner=o0;t.estatePick(tw,e.k)}
 // ---- objKind as before, for everything on the map (a ship was nothing before: now it says it is a ship)
 {const gone=[{id:'wolf',x:cx,y:cy,lv:1,n:1},{crit:true,id:'deer',x:cx,y:cy,n:1},{rf:true,from:'a',to:'b',x:cx,y:cy},{folk:true,home:tw.name,x:cx,y:cy,st:'out'},{x:cx,y:cy}];
  const things=[...t.TOWNS,...t.TOWNS.flatMap(x=>Object.keys(t.ESTATES).filter(k=>t.bldLv(x,k)&&t.bldSpots(x)[k]).map(k=>t.estatePick(x,k))),...W.lords,...t.bandits,...W.patrols,...W.caravans,...t.cparties(),...W.monsters,...W.sites,...W.critters,...W.refugees,...W.folk,...gone,null,undefined,P,'x',3];
  const bad=things.filter(q=>t.objKind(q)!==oldObjKind(q)).map(q=>t.objKind(q)+'≠'+oldObjKind(q));
  ok(!bad.length&&things.length>60,'objKind is as before for all '+things.length+' things, and for things no longer on the map'+(bad.length?': '+bad.slice(0,5).join(' '):''));
  ok(W.ships.every(s=>t.objKind(s)==='ship'&&oldObjKind(s)===null),'a ship says it is a ship (before: nothing; it is never clicked)');
  // (plain data handed straight in, as a test or a save gives it: made its kind on asking)
  const m2={id:'boar',x:cx,y:cy,hx:cx,hy:cy,lv:1,n:2,t:0,a:0,cool:0},h2={crit:true,id:'stag',x:cx,y:cy,hx:cx,hy:cy,n:1,t:0,a:0,dir:1,tire:0,cool:0};W.monsters.push(m2);W.critters.push(h2);
  ok(t.objKind(m2)==='monster'&&m2 instanceof t.Monster&&t.objKind(h2)==='critter'&&h2 instanceof t.Herd,'a plain beast or herd in its list is what it is when asked (made its kind)');
  W.monsters.splice(W.monsters.indexOf(m2),1);W.critters.splice(W.critters.indexOf(h2),1)}
 // ---- pick: the same thing on every spot as before, round the crowd, the holding's estates and fields, and the sites
 {const V=t.vis(),areas=[[cx,cy,60,50,2]];for(const e of ests)areas.push([e.x,e.y,40,40,3]);
  for(const e of ests)for(const [x,y] of t.plotsAt(tw,e.k,t.bldLv(tw,e.k)).slice(0,2))areas.push([x*TILE+8,y*TILE+8,14,14,2]);
  let n=0;const diff=[],seen=new Set();
  for(const [ax,ay,rx,ry,st] of areas){const px=P.x,py=P.y;if(Math.hypot(ax-P.x,ay-P.y)>V)Object.assign(P,{x:ax,y:ay+30});
   for(let y=ay-ry;y<=ay+ry;y+=st)for(let x=ax-rx;x<=ax+rx;x+=st){n++;const a=oldPick(x,y),c=t.pickAt(x,y);if(c)seen.add(t.objKind(c));if(a!==c&&onFlag(c,x,y))continue;if(a!==c)diff.push(Math.round(x-ax)+','+Math.round(y-ay)+' '+(t.objKind(c)||c)+'≠'+(t.objKind(a)||a))}
   P.x=px;P.y=py}
  ok(!diff.length&&n>4000,'a click picks the same thing as before on all '+n+' spots ('+[...seen].sort().join(', ')+')'+(diff.length?' ('+diff.length+' differ: '+diff.slice(0,4).join('; ')+')':''));
  ok(['town','estate','lord','band','patrol','cparty','caravan','monster','site','critter','refugee','worker'].every(k=>seen.has(k)),'every kind that is clicked was picked somewhere');
  ok(t.pickAt(ship.x,ship.y-4)!==ship&&!seen.has('ship'),'a ship is never picked');
  ok(t.pickAt(mo.x,mo.y-6)===mo&&t.pickAt(wk.x,wk.y-4)===wk,'a beast and a worker on the road, on their rings')}
 // ---- tooltips: the same card for everything, byte for byte (a band's still names its own kind of bandits)
 {const tips=()=>[...t.worldObjects(),P,null,undefined,{x:1}],cmp=(lab)=>{const bad=tips().filter(q=>t.tipFor(q)!==oldTip(q));ok(!bad.length,'every tooltip as before'+lab+' ('+tips().filter(q=>t.tipFor(q)).length+' cards)'+(bad.length?': '+bad.slice(0,3).map(q=>q&&q.mapKind+' '+JSON.stringify(t.tipFor(q))+' ≠ '+JSON.stringify(oldTip(q))).join(' | '):''))};
  cmp('');ok(/Wolves|Wolf/i.test(t.tipFor(mo))&&t.tipFor(b).includes(t.BANDS[b.kind][0].replace(' ahead',''))&&/Dragon/i.test(t.tipFor(dr))&&t.tipFor(ship)===''&&t.tipFor(P)==='','the beast’s, the band’s (its kind: '+b.kind+'), the dragon’s; nothing for a ship or you');
  P.hostile={[L.fac]:G.day+20,[tw.owner]:G.day+20};P.raid={town:other.name,t:0};const c0=sites.find(s=>s.type==='camp');if(c0)c0.cleared=G.day+5;cp.order='follow';
  cmp(' when they are hostile, a holding is raided and a camp cleared');P.hostile={};P.raid=null;if(c0)c0.cleared=false;cp.order='stay'}
 // ---- chasing: dropped when, and met during the cool-down after a fight, as before
 {const e=ests[0],lv=t.bldLv(tw,e.k),cs=sites.find(s=>s.type==='camp'),gone={id:'wolf',x:cx,y:cy,lv:1,n:1};
  const check=lab=>{const qs=[...t.worldObjects().filter(q=>q.mapKind!=='ship'),gone,P,null],bad=qs.filter(q=>(!t.objKind(q)||!q.chaseable())!==!!oldDrop(q)),cool=t.worldObjects().filter(q=>oldObjKind(q)&&q.meetsAnyTime!==oldCool(oldObjKind(q)));
   ok(!bad.length&&!cool.length,'a chase ends as before for all '+qs.length+' things'+lab+(bad.length||cool.length?': '+bad.concat(cool).slice(0,4).map(q=>q&&q.mapKind).join():''))};
  check('');L.dead=true;tw.bld[e.k]=0;if(cs)cs.cleared=G.day+5;check(' (a dead lord, a pulled-down estate, a cleared camp)');L.dead=false;tw.bld[e.k]=lv;if(cs)cs.cleared=false;
  ok(['town','estate','site','critter','refugee','worker','patrol','caravan'].every(k=>t.worldObjects().find(q=>q.mapKind===k).meetsAnyTime)&&!['lord','band','cparty','monster'].some(k=>t.worldObjects().find(q=>q.mapKind===k).meetsAnyTime),'met at once even after a fight: places, herds, folk, patrols and caravans; not lords, bands, beasts or your companions');
  if(cs){world();G.chase=cs;cs.cleared=G.day+9;t.updateWorld(.001);ok(G.chase===null,'a chase after a camp just cleared ends');cs.cleared=false;world()}}
 // ---- meeting: the same way for each kind, with the same result, as before
 {const spies=['approachHolding','startMonster','refugeeMeet','workerMeet','estateMeet','hunt','lordMeet','meetBand','patrolMeet','openComp','fightMeet'],orig={};let got=[];
  for(const k of spies){orig[k]=window[k];window[k]=(...a)=>{got.push(k+':'+(a[0]&&(a[0].mapKind||a[0].name||a[0].id||a[0].cid))+':'+G.youAttack)}}
  const qs=[tw,...ests,mo,dr,deer,cow,rf,rf2,wk,ship,L,b,pt,cp,...sites,{x:1},null],res=[];
  try{for(const q of qs){const run=fn=>{world();got=[];const was={};if(q instanceof t.Site)q.enter=function(){got.push('enter:'+this.type)};if(q&&q.crit){q.cool=0}const r=fn(q),gs=got.join(),c=q&&q.cool,ls=G.lastSite;if(q instanceof t.Site)delete q.enter;G.lastSite=null;return [r,gs,c,ls===q,G.youAttack].join('|')};
    const a=run(oldInteract),n=run(t.interact);res.push([q&&q.mapKind,a,n])}}finally{for(const k of spies)window[k]=orig[k]}
  const bad=res.filter(r=>r[1]!==r[2]&&r[0]!=='ship');
  ok(!bad.length,'interact meets each kind the same way as before: '+res.filter(r=>r[0]).map(r=>r[0]+' '+r[2].split('|')[1].split(':')[0]).join(', ')+(bad.length?' — differ: '+bad.slice(0,3).map(r=>r.join(' / ')).join('; '):''));
  const sh=res.find(r=>r[0]==='ship');ok(sh&&sh[2].split('|')[1]===''&&sh[1].split('|')[1]==='','a ship opens nothing (before: nothing either; never picked)')}
 // ---- sight: the dragon from afar, other beasts and herds as anyone, nearer in the woods; workers only on the road
 {const V=150,px=P.x,py=P.y,res=[];for(const d of [0,60,100,140,170,200,230,260]){P.x=mo.x+d;P.y=mo.y;res.push(mo.inView(V)===t.spotted(mo,V));P.x=dr.x+d;P.y=dr.y;res.push(dr.inView(V)===(Math.hypot(dr.x-P.x,dr.y-P.y)<V*1.6))}
  P.x=px;P.y=py;const st=wk.st;wk.st='in';const inn=wk.inView(999);wk.st=st;ok(res.every(Boolean)&&!inn&&wk.inView(999),'who is in sight is as before (the dragon seen from afar; a worker at work inside never)')}
 // ---- drawn as before: the whole map, its buildings, everyone on it and the minimap, pixel for pixel (the clock held still)
 {const pn=performance.now,rnd=Math.random,c=t.ctx;performance.now=()=>4321;
  const paint=fn=>{Math.random=t.seeded(7);c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);c.restore();fn();
   const d=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;let h=0,lit=0;for(let i=0;i<d.length;i++){h=(h*31+d[i])|0;if(d[i])lit++}return [h,lit].join()};
  // (the marks on the screen and on the scene of what stands, memCv: drawWorld draws that scene in game pixels first, render.js)
  const rects=fn=>{const got=[],P2=CanvasRenderingContext2D.prototype,f0=P2.fillRect,lo=t.memCv().getContext('2d');P2.fillRect=function(...a){if(this===c||this===lo)got.push(this.fillStyle+' '+a.join());return f0.apply(this,a)};try{paint(fn)}finally{P2.fillRect=f0}return got.join('|')};
  const off={monsters:W.monsters,critters:W.critters,folk:W.folk,ships:W.ships,refugees:W.refugees,fights:W.fights};for(const k in off)W[k]=[];
  try{paint(t.drawWorld);paint(oldDraw);const a=paint(oldDraw),n=paint(t.drawWorld),a2=paint(oldDraw);
   ok(a===n&&a===a2,'the whole map is drawn as before, pixel for pixel ('+n+')');
   const ra=rects(oldDraw),rn=rects(t.drawWorld);ok(ra.length>100&&ra===rn,'the same small marks, minimap dots among them, in the same order ('+rn.split('|').length+')');
   G.clock=t.DAY*.8;const na=paint(oldDraw),nn=paint(t.drawWorld);ok(na===nn,'and at night (torches)');G.clock=t.DAY*.2}finally{performance.now=pn;Math.random=rnd;Object.assign(W,off)}
  const e0=ERR.length;t.frame();ok(ERR.length===e0,'and the whole frame draws')}
 // ---- the minimap: the same dots, layered as before (the places, then the beasts, parties and caravans over them)
 {const V=t.vis(),a=[],n=[],dot=arr=>(x,y,col,s)=>arr.push([x,y,col,s].join());
  ev('((dot,V)=>{'+since(OLD_DRAW.slice(OLD_DRAW.indexOf("  TOWNS.forEach(tw=>{if(seenTile"),OLD_DRAW.indexOf("  P.quests.forEach"))).replace('worldObjects()','[...W.parties,...W.caravans.map(asParty)]')+'})')(dot(a),V);
  for(const os of [t.TOWNS,W.sites,W.monsters,W.parties,W.caravans])for(const q of os){const d=q.mapDot(V);if(d)dot(n)(q.x,q.y,d[0],d[1])}
  ok(a.length>=10&&a.join('|')===n.join('|'),'the minimap dots the same things, in the same colours and order ('+n.length+')')}
 // ---- saves: plain data; the same after loading (the classes add no fields), and made their kinds again when the map asks
 {world();const save=()=>{G.mode='world';t.saveGame(true);return localStorage.getItem(t.slotKey('auto'))},strip=s=>s.replace(/"at":\d+,/,'').replace(/"pw":\d+/g,'"pw"');
  const lists=d=>JSON.stringify(['monsters','critters','refugees','sites','caravans','patrols','lords'].map(k=>d.world[k]))+JSON.stringify(d.world.own);
  sites.forEach(s=>s.placed());if(!W.refugees.length)W.refugees.push({...rf2,gone:false});// (refugees the world sent on their way meanwhile)
  const s1=save();ok(!!s1&&!/mapKind|"here"|"meet"|"pick"|"draw"|"mapDot"|"est":|"meetsAnyTime"|"chaseable"/.test(s1),'a save holds no world-object fields, and no estates');
  ok(['monsters','critters','refugees','sites'].every(k=>JSON.stringify(W[k])===JSON.stringify(W[k].map(q=>({...q})))),'each thing saves as its plain fields');
  t.loadGame();ok(W.monsters.length&&W.critters.length&&W.refugees.length&&W.sites.every(s=>s instanceof t.Site)&&t.objKind(W.monsters[0])==='monster'&&t.objKind(W.refugees[0])==='refugee'&&t.TOWNS.every(x=>x instanceof t.HoldingObject),'loaded, each is what it is again (a beast, refugees: asked; sites, holdings): '+[W.monsters.length,W.critters.length,W.refugees.length].join('/'));
  t.worldObjects();ok(W.monsters.every(q=>q instanceof t.Monster)&&W.critters.every(q=>q instanceof t.Herd)&&W.refugees.every(q=>q instanceof t.Refugees),'and made its kind once the map asks');
  const s2=save();t.loadGame();const s3=save();ok(lists(JSON.parse(s1))===lists(JSON.parse(s2)),'loaded and saved again, every holding, beast, herd, refugee band, site, caravan, patrol and lord saves as it did');
  ok(strip(s1)===strip(s2)&&strip(s2)===strip(s3),'and the whole save is the same ('+s2.length+' characters)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
