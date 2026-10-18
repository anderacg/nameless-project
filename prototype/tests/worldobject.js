'use strict';
// World objects (parties.js WorldObject): whatever is on the map says for itself what it is (mapKind), whether you see it, where
// a click answers on it, how you meet it, how it is drawn and dotted on the minimap. The parties came first: lords, bands,
// patrols, caravans, your companions' parties and your band. Held here to the ways before (HEAD a55bcc4, kept below as text):
// the same kinds, the same pick on every spot, the same pictures and labels, the same minimap dots and dialogs, the same save.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,ev=s=>(0,eval)(s);try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;G.encCool=1e9;
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc=null;G.cv=null;G.pt=null;G.fg=null;G.par=null;G.town=null;G.site=null;G.herd=null;P.tx=null;G.chase=null};
 // ---- the ways before
 const oldObjKind=ev("(o=>o&&o.cid&&o.troops?'cparty':o&&o.est?'estate':TOWNS.includes(o)?'town':W.lords.includes(o)?'lord':W.monsters.includes(o)?'monster':bandits.includes(o)?'band':W.sites.includes(o)?'site':W.critters.includes(o)?'critter':(W.caravans||[]).includes(o)?'caravan':(W.refugees||[]).includes(o)?'refugee':(W.patrols||[]).includes(o)?'patrol':(W.folk||[]).includes(o)?'worker':null)");
 const oldPartyKind=ev("(o=>o&&o.cid?'cparty':W.lords.includes(o)?'lord':bandits.includes(o)?'band':(W.patrols||[]).includes(o)?'patrol':'caravan')");
 const oldDots=ev("((dot,V)=>{W.lords.forEach(l=>{if(!l.dead&&!l.inside&&Math.hypot(l.x-P.x,l.y-P.y)<V)dot(l.x,l.y,FACS[l.fac].col,1)});(W.caravans||[]).forEach(c=>{if(Math.hypot(c.x-P.x,c.y-P.y)<V)dot(c.x,c.y,'#e8d8a0',1)});bandits.forEach(b=>{if(Math.hypot(b.x-P.x,b.y-P.y)<V)dot(b.x,b.y,'#ff6a60',1)});(W.patrols||[]).forEach(p=>{if(Math.hypot(p.x-P.x,p.y-P.y)<V)dot(p.x,p.y,p.fac==='player'?FACS.player.col:FACS[p.fac].col,1)})})");
 const oldPick=ev(`(function pickAt(wx,wy){
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
  // (a party on its leader's figure too: a lord's whole horse and banner; render.js partyFig)
  W.parties.forEach(o=>{if(!o.onMap())return;add(o,10,4);if(o!==P&&Math.hypot(o.x-wx,o.y-wy)<32){const F=partyFig(o,o.look(),0);fig(o,F.s,F.x,F.y,F.flip)}});W.monsters.forEach(m=>add(m,11,6));
  // each kind of site says where it is clicked (sites.js)
  W.sites.forEach(s=>{if(s.pickable())s.box(box,camp)});W.critters.forEach(k=>{if(!k.decor)add(k,9,4)});/* (a pasture's herd is only to be seen: the pasture answers) */(W.caravans||[]).forEach(k=>{add(k,11,5);const s=caravanPic(k);fig(k,s,k.x-(s.width>>1),k.y+1-s.height,k.dir<0)});(W.refugees||[]).forEach(k=>add(k,10,4));
  // (workers: met at their estate while they work inside it; out on the road with a delivery, met where they walk: folk.js)
  (W.folk||[]).forEach(k=>{if(folkOut(k))add(k,6,4)});
  c.sort((a,b)=>a[0]-b[0]);return c.length?c[0][1]:null;
})`),oldDrawParties=ev(`(function drawParties(ents,cam,V){
  for(const o of W.parties){if(!o.inView(V))continue;
    ents.push({y:o.y,f:()=>{const L=o.look(),sx=Math.round(o.x-cam.x),sy=Math.round(o.y-10-cam.y),fd=L.dir<0?-1:1,fr=L.moving?Math.floor(performance.now()/(L.bandit?160:170))%2:0;
      const s=partyFig(o,L,fr).s;// (a rider: his host behind his horse)
      drawHost(o.size,L.col,sx-(s.width>16?fd*6:0),sy+12,fd,L.moving,L.seed,L.race,L.bandit);
      ctx.save();ctx.translate(sx,sy);if(fd<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),13-s.height);ctx.restore();
      if(L.torch){const tx=sx+fd*6,ty=sy-4;rect(ctx,'#5a3e24',tx,ty,1,5);LIGHTQ.push({x:tx,y:ty-1,r:20})}
      // (its label clear above the figure, its banner's top: over it, the label in the banner's own colour was lost on the flag)
      if(!o.fight&&L.label)txt(L.label,sx,sy+13-s.height+figTop(L)-2,L.labelCol,'center')}})}
})`),oldDrawCaravans=ev(`(function drawCaravans(ents,cam,V){
  for(const c of W.caravans||[]){if(Math.hypot(c.x-P.x,c.y-P.y)>V*1.2)continue;
    ents.push({y:c.y,f:()=>{const L=asParty(c).look(),s=caravanSprite(L.col),sx=Math.round(c.x-cam.x),sy=Math.round(c.y-cam.y);ctx.fillStyle='rgba(0,0,0,.3)';ctx.fillRect(sx-(s.cw>>1)+3,sy-1,s.cw-6,2);
      ctx.save();ctx.translate(sx,sy);if(c.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-(s.width>>1),1-s.height);ctx.restore();
      if(Math.hypot(c.x-P.x,c.y-P.y)<90)txt(L.label,sx,sy-s.ch-1,L.labelCol,'center')}})}
})`);
 // ---- a crowd by a holding: a lord, a band beside him, a patrol, a caravan, your companion's party, a beast, a herd, refugees
 const tw=t.townBy('Ashford'),other=t.TOWNS.find(x=>x!==tw&&x.owner&&!t.hostileTo(x.owner)),cx=tw.x+8,cy=tw.y+22;
 G.lastTown=null;P.x=cx;P.y=cy+40;P.fac=null;P.hostile={};W.fights=[];t.bandits.length=0;W.patrols=[];W.caravans=[];W.refugees=[];W.folk=[];
 W.lords.forEach(l=>{l.x=-9999;l.y=-9999;l.fight=null});
 const L=W.lords.find(l=>!l.dead&&!t.hostileTo(l.fac));Object.assign(L,{x:cx,y:cy,inside:null,fight:null,state:'march'});
 t.spawnBandit(true);const b=t.bandits[0];Object.assign(b,{x:cx+5,y:cy+1,fight:null,cool:0});
 const pt=t.asParty({pt:true,watch:'day',home:tw.name,fac:tw.owner,troops:['hum_spear','hum_spear','hum_bow'],x:cx-22,y:cy+8,wx:null,wy:null,cool:0,dir:1});W.patrols.push(pt);
 const cv=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:other.name,x:cx+30,y:cy+6,goods:{grain:5},guards:3,cool:0,dir:-1});W.caravans.push(cv);
 P.comps={brann:{ap:5,role:''}};t.compInit('brann').lv=3;P.troops={hum_levy:6};t.cpGive('brann','hum_levy',4);const cp=P.comps.brann.party;Object.assign(cp,{x:cx+14,y:cy-12,order:'stay'});
 const mo=W.monsters[0];if(mo)Object.assign(mo,{x:cx-12,y:cy-14});const cr=W.critters.find(k=>!k.decor);if(cr)Object.assign(cr,{x:cx-30,y:cy-4});
 const rf=t.sendRefugees(tw,other,'hardship');if(rf)Object.assign(rf,{x:cx+40,y:cy-10});
 const parties=[L,b,pt,cv,cp];
 // ---- every party is a world object of its kind
 ok(parties.every(q=>q instanceof t.WorldObject)&&P instanceof t.WorldObject,'every party, and your band, is a WorldObject');
 ok(L.mapKind==='lord'&&b.mapKind==='band'&&pt.mapKind==='patrol'&&cv.mapKind==='caravan'&&cp.mapKind==='cparty'&&P.mapKind==='you','each says its kind: '+[...parties,P].map(q=>q.mapKind).join(', '));
 ok(b.kind&&b.kind!==b.mapKind&&t.BANDS[b.kind],'a band keeps its own kind of bandits ('+b.kind+') beside what it is on the map');
 const wo=t.worldObjects();ok(parties.every(q=>wo.includes(q))&&!wo.includes(P)&&wo.indexOf(cv)>wo.indexOf(cp),'worldObjects(): the parties, then (after the others) the caravans ('+wo.length+'), not you');
 // ---- objKind and each party's own kind (mapKind; partyKind before) as before, for everything on the map
 {const things=[...t.TOWNS,...W.lords,...t.bandits,...W.patrols,...W.caravans,...t.cparties(),...W.monsters,...W.sites,...W.critters,...W.refugees,...W.folk,...t.TOWNS.flatMap(x=>Object.keys(t.ESTATES).filter(k=>t.bldLv(x,k)).map(k=>t.estatePick(x,k))),null,undefined,P];
  const bad=things.filter(q=>t.objKind(q)!==oldObjKind(q)).map(q=>t.objKind(q)+'≠'+oldObjKind(q));
  ok(!bad.length,'objKind is as before for all '+things.length+' things'+(bad.length?': '+bad.slice(0,5).join(' '):''));
  const ps=[...W.lords.filter(l=>!l.dead),...t.bandits,...W.patrols,...W.caravans,...t.cparties()],pb=ps.filter(q=>q.mapKind!==oldPartyKind(q));
  ok(ps.length>=5&&!pb.length,'each party’s kind is as before for all '+ps.length+' parties on the map');
  ok([L,cv,b,pt].every(q=>t.BRAINS[q.mapKind]===q.brain),'each party’s brain by its kind, as before')}
 // ---- gone from the map: nothing to meet, no chase; and no more 'caravan' for whatever is not in a list
 {const gone=t.asParty({x:cx,y:cy,n:3,kind:'bandits',list:['militia','militia','militia'],t:0,a:0,cool:0});
  ok(t.objKind(gone)===null&&oldObjKind(gone)===null&&!t.interact(gone),'a band no longer on the map is nothing to meet (as before)');
  ok(gone.mapKind==='band'&&oldPartyKind(gone)==='caravan'&&P.mapKind==='you','a party says what it is, even off the map (before: a caravan)');
}
 // ---- pick: the same thing on every spot as before
 // (a party's banner, floating over it since Phase 1, answers a click too: a spot on one picks its party, whatever was under it)
 {const onFlag=(q,x,y)=>{const B=q&&q.banner&&t.bannerAt(q,0);if(!B)return false;const b=t.opaqueBox(B.s);return x>=B.x+b[0]&&x<=B.x+b[2]&&y>=B.y+b[1]&&y<=B.y+b[3]};let n=0,nf=0;const diff=[];for(let y=cy-50;y<=cy+30;y+=2)for(let x=cx-56;x<=cx+56;x+=2){n++;const a=oldPick(x,y),c=t.pickAt(x,y);if(a!==c&&onFlag(c,x,y)){nf++;continue}if(a!==c)diff.push((x-cx)+','+(y-cy)+' '+(t.objKind(c)||c)+'≠'+(t.objKind(a)||a))}
  ok(!diff.length&&nf>0,'a click picks the same thing as before on all '+n+' spots round the crowd, or a party on its banner ('+nf+')'+(diff.length?' ('+diff.length+' differ: '+diff.slice(0,4).join('; ')+')':''));
  ok(t.pickAt(b.x,b.y-4)===b,'the bandit, small, beside the mounted lord is picked on his ring');
  // (his banner's top: since Phase 1's smaller figures (a rider in a 16 cell), wherever it is drawn)
  {const F=t.partyFig(L,L.look(),0),q=t.opaqueBox(F.s),mx=(q[0]+q[2])>>1,tx=F.flip?F.x+F.s.width-1-mx:F.x+mx;ok(t.pickAt(tx,F.y+q[1]+1)===L,'the lord on his banner, above the bandit')}
  ok(t.pickAt(cv.x-8,cv.y-8)===cv,'the caravan anywhere on its cart');
  ok(t.pickAt(pt.x,pt.y-4)===pt&&t.pickAt(cp.x,cp.y-4)===cp,'the patrol and your companion’s party on their rings')}
 // ---- drawn as before: the same pictures, labels and order (the clock held still)
 {const pn=performance.now;performance.now=()=>4321;const V=t.vis(),cam={x:Math.round(P.x-t.VW/2),y:Math.round(P.y-t.VH/2)},c=t.ctx;
  const paint=fn=>{const e=[];fn(e,cam,V);c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,c.canvas.width,c.canvas.height);c.restore();ev('LIGHTQ=[]');e.forEach(q=>q.f());
   const d=c.getImageData(0,0,c.canvas.width,c.canvas.height).data;let h=0,lit=0;for(let i=0;i<d.length;i++){h=(h*31+d[i])|0;if(d[i])lit++}return [e.map(q=>q.y).join(),h,lit,ev('LIGHTQ.length')]};
  try{const a=paint(oldDrawParties),n=paint(t.drawParties),ca=paint(oldDrawCaravans),cn=paint(t.drawCaravans);
   // (Phase 1 redrew the map's figures smaller on purpose, D25: how each looks is mapfigures.js's; here each is still drawn, in
   // the same order, with its torches)
   ok(n[2]>0&&a[0]===n[0]&&a[3]===n[3],'every party is drawn as before: each in its turn, with its torches ('+n[0].split(',').length+' parties)');
   ok(cn[2]>0&&ca[0]===cn[0],'the caravan’s cart, ox and label as before: drawn, in its turn')}finally{performance.now=pn}
  const e0=ERR.length;t.frame();ok(ERR.length===e0,'and the whole frame draws')}
 // ---- sight: the same rule as before for parties and beasts (nearer in woods and hills)
 {let f=null;for(let ty=2;ty<t.MH-2&&!f;ty++)for(let tx=2;tx<t.MW-2&&!f;tx++)if(t.tAt(tx,ty)===t.T_FOREST)f=[(tx+.5)*t.TILE,(ty+.5)*t.TILE];
  const was=parties.map(q=>[q.x,q.y]),V=150,old=q=>q===cp?Math.hypot(q.x-P.x,q.y-P.y)<V:q===cv?Math.hypot(q.x-P.x,q.y-P.y)<=V*1.2:Math.hypot(q.x-P.x,q.y-P.y)<V*(t.hiddenAt(q.x,q.y)?.45:1);
  const px=P.x,py=P.y,spots=[0,40,60,100,140,170,200];let same=true,n=0;
  for(const d of spots)for(const q of parties){if(f){q.x=f[0];q.y=f[1];P.x=f[0]+d;P.y=f[1]}else{q.x=px+d;q.y=py}n++;if(q.inView(V)!==old(q))same=false}
  if(mo)for(const d of spots){if(f){mo.x=f[0];mo.y=f[1];P.x=f[0]+d;P.y=f[1]}n++;if(t.spotted(mo,V)!==(Math.hypot(mo.x-P.x,mo.y-P.y)<V*(t.hiddenAt(mo.x,mo.y)?.45:1)))same=false}
  parties.forEach((q,i)=>{q.x=was[i][0];q.y=was[i][1]});P.x=px;P.y=py;if(mo)Object.assign(mo,{x:cx-12,y:cy-14});
  ok(same,'who is in sight is as before ('+n+' checks'+(f?', in the woods too':'')+')');
  L.inside=tw.name;ok(!L.inView(999)&&!L.mapDot(999),'a lord inside a holding is neither seen nor dotted');L.inside=null}
 // ---- the minimap: the same dots
 {const V=t.vis(),a=[],n=[];oldDots((x,y,col,s)=>a.push([x,y,col,s].join()),V);for(const q of t.worldObjects().filter(q=>q instanceof t.Party)){const d=q.mapDot(V);if(d)n.push([q.x,q.y,d[0],d[1]].join())}
  ok(a.length>=4&&a.sort().join('|')===n.sort().join('|'),'the minimap dots the same parties and caravans, in the same colours ('+n.length+')')}
 // ---- meeting: the same dialog for each kind; G.youAttack set while it opens and cleared as soon as interact is done
 {const spies=['lordMeet','meetBand','patrolMeet','openComp'],orig={},got=[];
  for(const k of spies){orig[k]=window[k];window[k]=(...a)=>{got.push([k,a[0],G.youAttack])}}
  try{for(const q of [L,b,pt,cp]){world();t.interact(q)}
   ok(got.map(g=>g[0]).join()==='lordMeet,meetBand,patrolMeet,openComp'&&got[0][1]===L&&got[1][1]===b&&got[2][1]===pt&&got[3][1]==='brann','interact meets a lord, a band, a patrol and your companion as before');
   ok(got.every(g=>g[2]===true)&&G.youAttack===false,'G.youAttack is set while it opens, and cleared as soon as interact returns');
   window.lordMeet=()=>{throw new Error('boom')};let threw=false;world();try{t.interact(L)}catch(e){threw=/boom/.test(e.message)}
   ok(threw&&G.youAttack===false,'and cleared even when meeting throws')}finally{for(const k of spies)window[k]=orig[k]}
  world();ok(t.interact(cv)&&G.mode==='dialog'&&G.cv===cv&&G.youAttack===false,'reaching a caravan opens it (and nothing is left set)');t.act('cv-leave');
  world();ok(t.interact(L)&&G.enc&&G.enc.kind==='lord'&&G.enc.ref===L,'reaching a friendly lord opens his audience');
  world();P.troops={hum_knight:20};t.interact(b);ok(G.enc&&G.enc.ref===b&&G.enc.mine===true||G.par&&G.par.o===b,'reaching bandits starts your fight with them (you attacked), or their offer to talk');
  if(G.enc)t.act('flee');world()}
 // ---- gone while you chase it: the chase ends (as before; last, as the world moves on)
 {const gone=t.asParty({x:P.x+60,y:P.y,n:3,kind:'bandits',list:['militia','militia','militia'],t:0,a:0,cool:0});t.bandits.push(gone);world();G.chase=gone;t.bandits.splice(t.bandits.indexOf(gone),1);
  t.updateWorld(.01);ok(G.chase===null,'a chase after a band that is gone ends');world()}
 // ---- saves: plain data, the same after loading (a band's cached power is reckoned anew, and loadGame frees anyone stuck)
 {world();const strip=s=>s.replace(/"at":\d+,/,'').replace(/"pw":\d+/g,'"pw"'),save=()=>{G.mode='world';t.saveGame(true);return localStorage.getItem(t.slotKey('auto'))};
  const shape=s=>{const d=JSON.parse(s),w=d.world;return JSON.stringify([...d.bandits,...w.lords,...w.patrols,...w.caravans,...Object.values(d.P.comps).map(c=>c.party).filter(Boolean)].map(q=>Object.keys(q).sort().join()))};
  const s1=save();ok(!!s1&&!/mapKind|"here"|"meet"|"pick"|"draw"|"mapDot"/.test(s1),'a save holds no world-object fields');
  t.loadGame();ok(W.lords.every(q=>q instanceof t.LordParty)&&t.bandits.every(q=>q instanceof t.BandParty)&&W.patrols.every(q=>q.mapKind==='patrol')&&W.caravans.every(q=>q.mapKind==='caravan')&&t.cparties().length&&t.cparties().every(q=>q.mapKind==='cparty'),'loading makes every party a world object of its kind again');
  const s2=save();t.loadGame();const s3=save();ok(shape(s1)===shape(s2)&&strip(s2)===strip(s3),'and saving again writes the same save: every party’s fields as they were ('+s1.length+' characters)')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
