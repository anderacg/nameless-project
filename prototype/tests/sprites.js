'use strict';
// Sprites: everything is drawn by code. Soldiers get varied looks and animated poses with an outline, struck fighters flash,
// every holding, site, critter and obstacle has a sprite, the world map is painted in detail and roads and holdings stay clear.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G,P=t.P,W=t.W;const world2=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']}};
 try{
  t.act('begin','soldier');
  ok((0,eval)('typeof ART')==='undefined'&&!document.querySelector('script[src="js/art.js"]')&&!document.getElementById('artBtn'),'no sprite sheets are loaded and there is no art switch');
  ok(t.TOWNS.every(x=>{const c=t.lotCentre(x);return c&&t.lotSprite(x,c).width===c.n*16}),'every holding has a centre building, its picture exactly its cell');
  ok(['cave','ruins','shrine','hideout','travelers'].every(ty=>t.siteSprite({type:ty,seed:7,i:1,x:100,y:100,kind:0}).width>0),'every kind of site has a generated sprite');
  ok(['grass','frost','desert','swamp'].every(c=>['tree','rock','cactus'].every(k=>{const o=t.PX.battleObstacle(k,c,0);return o.s.width>0&&o.g.width>0})),'trees, rocks and cacti for every climate');
  ok(Object.keys(t.CRITTERS).every(k=>t.critterSprite(k).width>0),'every critter has a sprite');
  ok(Object.keys(t.ST).every(k=>t.unitSprite(k,1,false).width>0),'every fighter has a sprite');
  // drawing
  P.troops={hum_spear:3,hum_bow:2,hum_knight:1,dw_axe:1,elf_glade:1,orc_wolf:1};P.comps={brann:{ap:0,role:''}};G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt','chief','boar','troll','dragon']};t.startBattle({enemies:G.enc.list,tournament:false});
  for(let i=0;i<40;i++)t.updateBattle(.03);t.B.units.forEach(u=>u.atkAt=t.B.t-.1);t.drawBattle();for(let i=0;i<5;i++)t.updateBattle(.03);t.drawBattle();
  ok(t.B.units.filter(u=>u.plx!=null).length>=10,'a battle draws its fighters');
  t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  W.sites.forEach(s=>s.seen=true);P.gear.mount='m_horse';G.mode='world';t.drawWorld();ok(Object.keys(t.spr).some(k=>k.startsWith('p#e8b94a'+t.ITEMS.m_horse.col)),'the hero rides a horse on the map');P.gear.mount=null;
  const px=c=>c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data.join(),looks=new Set([0,1,2,3,4,5].map(v=>px(t.unitSprite('hum_spear',0,false,v))));
  ok(looks.size===6,'six different looks for one kind of soldier');
  ok(px(t.unitSprite('hero',0,true,3))===px(t.unitSprite('hero',0,true,0)),'your hero always looks the same');
  world2();t.startBattle({enemies:['militia','militia','militia'],tournament:false});ok(t.B.units.every(u=>u.v>=0&&u.v<6),'every soldier in a battle gets a look');t.drawBattle();t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  t.showTitle('settings');ok(!/Procedural|Pack sprites/.test(document.getElementById('panel').innerHTML),'Settings no longer offers an art choice');
 // procedural detail and animation
 {const px=c=>{const d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=4)h=(h*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])|0;return h};
  const poses=[0,1,2,3,4,5,6,7,8].map(p=>px(t.unitSprite('spearman',0,false,1,p)));ok(new Set(poses).size>=7,'a soldier has '+new Set(poses).size+' distinct poses: breathing, striding and striking');
  const s0=t.unitSprite('militia',1,false,2,0),d0=s0.getContext('2d', { willReadFrequently: true }).getImageData(0,0,s0.width,s0.height).data;let dark=0;for(let i=0;i<d0.length;i+=4)if(d0[i+3]>150&&d0[i]<40&&d0[i+1]<40&&d0[i+2]<50)dark++;
  ok(s0.width===32&&s0.cw===24&&s0.ch===16&&dark>20,'soldiers are the 16-pixel template figures with their dark navy outline (a 24-pixel canvas, room for a weapon, in its 32-pixel cell; '+s0.ch+' tall)');
  const w=t.whiteOf(s0),wd=w.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w.width,w.height).data;let white=0,any=0;for(let i=0;i<wd.length;i+=4)if(wd[i+3]){any++;if(wd[i]===255&&wd[i+1]===255)white++}ok(any&&white===any,'a struck fighter flashes white');
  const m=t.worldCv().getContext('2d', { willReadFrequently: true }).getImageData(t.townBy('Ashford').x-200,t.townBy('Ashford').y-200,400,400).data,cols=new Set();for(let i=0;i<m.length;i+=16)cols.add(m[i]>>3<<10|m[i+1]>>3<<5|m[i+2]>>3);
  ok(cols.size>40,'the world map is painted in '+cols.size+' shades around Ashford');
  t.worldCv();
  // (the roads painted along their softened lines, not by tile (gfx/worldart.js artGenPlan), so their clear band is checked along
  // the painted segments: a raw line's corner may lie beside the road)
  const segs=t.WorldArt.ensure().segs;let pts=0,clearPts=0;for(let k=0;k<segs.length;k+=5)for(const f of [0,.25,.5,.75,1]){pts++;if(t.isClear(segs[k]+(segs[k+2]-segs[k])*f,segs[k+1]+(segs[k+3]-segs[k+1])*f))clearPts++}
  ok(pts&&clearPts===pts&&t.TOWNS.every(x=>t.isClear(x.x,x.y)),'roads and each holding’s own tile (its centre) (and the gate before it) are kept clear of trees, hills and peaks'+' (along the '+pts+' points of the painted roads)');
  ok(t.TOWNS.every(x=>Object.entries(t.bldSpots(x)).every(([k,p])=>{const l=t.lotOf(p.tx,p.ty);return l&&l.k===k&&l.town===x.name})),'every estate stands on a building of its own holding (its yard drawn over whatever the map painted there)');
  // the estates' worked ground by the land it lies on (gfx/structures.js estateGround, the second play-test): a pasture's pen the
  // land's own ground, grazed and trodden in patches (no square of green: most of its pixels left clear, its marks in its climate's
  // colours); a field's soil and furrows its climate's (snow in its furrows in the frost), its edge ragged into the ground round it
  {const pens=[],fields=[],cl=x=>t.climAt((x[1].x+.5)*16,(x[1].y+.5)*16),px=(g,x,y)=>{const d=g.getContext('2d', { willReadFrequently: true }).getImageData(x-g.x,y-g.y,1,1).data;return d[3]?[d[0],d[1],d[2]]:null};
   for(const x of t.TOWNS)for(const l of x.lots||[]){const lv=t.bldLv(x,l.k);if(!lv||l.st!=='built'||!(l.plots||[]).length)continue;if(l.k==='pasture')pens.push([x,l,lv]);if(l.k==='farm')fields.push([x,l,lv])}
   const clear=([x,l,lv])=>{const g=t.estateGround(x,l.k,lv);let n=0,m=0;for(const [tx,ty] of t.plotsAt(x,l.k,lv))for(let y=3;y<13;y++)for(let i=3;i<13;i++){m++;if(!px(g,tx*16+i,ty*16+y))n++}return n/m};
   const rag=([x,l,lv])=>{const g=t.estateGround(x,l.k,lv),P=t.plotsAt(x,l.k,lv),has=(a,b)=>P.some(q=>q[0]===a&&q[1]===b)||a===l.x&&b===l.y;let n=0,m=0;
     for(const [tx,ty] of P){if(!has(tx,ty-1))for(let i=0;i<16;i++){m++;if(!px(g,tx*16+i,ty*16))n++}if(!has(tx,ty+1))for(let i=0;i<16;i++){m++;if(!px(g,tx*16+i,ty*16+15))n++}}return m?n/m:.5};
   const pc=pens.map(clear),fr=fields.map(rag),snowy=fields.filter(f=>cl(f)==='frost').some(([x,l,lv])=>{const g=t.estateGround(x,l.k,lv),d=g.getContext('2d', { willReadFrequently: true }).getImageData(0,0,g.width,g.height).data;for(let i=0;i<d.length;i+=4)if(d[i]===228&&d[i+1]===234&&d[i+2]===242)return true;return false});
   // (the pens together two fifths of their ground their own or more, each a fifth at least: a pen's patches follow a noise over 5
   //  px, so one of a plot or two may come out mostly marked; play-test 2's roads and lots (agent K) moved one to 26%, the generated
   //  world's pens to 50% together)
   const pm=pc.reduce((a,b)=>a+b,0)/Math.max(1,pc.length);
   ok(pens.length&&pm>.4&&Math.min(...pc)>.2&&fields.length&&Math.min(...fr)>.2&&(snowy||!fields.some(f=>cl(f)==='frost')),pens.length+' pastures lie on their land ('+Math.round(pm*100)+'% of the pens’ ground their own, each pen’s at least '+Math.round(Math.min(...pc)*100)+'%, the climates: '+[...new Set(pens.map(cl))].join(', ')+'); '+fields.length+' fields ragged at their edge (at least '+Math.round(Math.min(...fr)*100)+'% of its edge open)'+(snowy?', snow in the frost’s furrows':''))}
  ok(t.arenaFor('desert')!==t.arenaFor('frost')&&t.arenaFor('grass').width===t.BW&&t.arenaFor('grass').height===t.BH,'each climate has its own battle ground, as large as the battlefield');}
 // weapons held apart from the body: the battle sprite leaves the melee weapon off and knows where the hand is
 {const px=c=>{const d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data;let n=0;for(let k=3;k<d.length;k+=4)if(d[k])n++;return n};
  const full=t.unitSprite('hum_spear',0,false,0,0),bare=t.unitSprite('hum_spear',0,false,0,0,true);ok(bare.hand&&px(bare)<px(full)-8,'a battle sprite is the body alone, its hand marked ('+bare.hand+')');
  const L=t.lookOf('hum_spear',0,false,0,'',null);ok(t.heldWeapon(L)==='spear'&&!t.heldWeapon(t.lookOf('hum_bow',0,false,0,'',null)),'melee weapons are held apart; bows stay with the body');
  const w0=t.weaponSprite('spear','blue','#f3bfad',0),w8=t.weaponSprite('spear','blue','#f3bfad',8);ok(w0!==w8&&w0===t.weaponSprite('spear','blue','#f3bfad',0)&&w0.R>0,'each weapon is drawn once at each angle, and kept');
  // (a weapon at any angle is one solid line: its pixels in each row (or column) one unbroken run, never two side by side
  // with the outline between them, and all of them joined edge to edge)
  {const hex=c=>{const n=parseInt(c.slice(1),16);return[n>>16,(n>>8)&255,n&255]};let bad='',n=0;
   for(const [k,col] of [['spear',t.PPAL.wood[1]],['pike',t.PPAL.wood[1]],['lance',t.PPAL.wood[1]],['sword',t.PPAL.steel[0]],['great',t.PPAL.steel[0]]])for(let i=0;i<t.WEAPON_STEPS;i++){const c=t.weaponSprite(k,'blue','#f3bfad',i),d=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,c.width,c.height).data,cc=hex(col),W=c.width,H=c.height;n++;
     const on=(x,y)=>{if(x<0||y<0||x>=W||y>=H)return false;const j=(y*W+x)*4;return d[j+3]&&d[j]===cc[0]&&d[j+1]===cc[1]&&d[j+2]===cc[2]};const pts=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(on(x,y))pts.push([x,y]);
     const a=i/t.WEAPON_STEPS*2*Math.PI,steep=Math.abs(Math.sin(a))>=Math.abs(Math.cos(a));
     for(let m=0;m<(steep?H:W);m++){const r=pts.filter(p=>(steep?p[1]:p[0])===m).map(p=>steep?p[0]:p[1]);if(r.length&&Math.max(...r)-Math.min(...r)+1!==r.length){bad=k+' step '+i+' (a gap)';break}}
     const seen=new Set([pts[0]+'']),q=[pts[0]];while(q.length){const [x,y]=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(on(x+dx,y+dy)&&!seen.has((x+dx)+','+(y+dy))){seen.add((x+dx)+','+(y+dy));q.push([x+dx,y+dy])}}
     if(seen.size!==pts.length)bad=k+' step '+i+' (in pieces)';if(bad)break}
   ok(!bad,'every weapon at every angle is one solid line ('+(bad||n+' sprites checked')+')')}
  const run=t.peopleSprite(L,15,true),walk=t.peopleSprite(L,2,true);ok(run.toDataURL()!==walk.toDataURL(),'running is its own stride, not the walk sped up');
  const kn=t.lookOf('hum_knight',0,false,0,'',null);ok(t.peopleSprite(kn,15,true).toDataURL()!==t.peopleSprite(kn,2,true).toDataURL(),'and a mount gallops');
  world2();P.troops={hum_spear:1,hum_foot:1};t.startBattle({enemies:['militia'],tournament:false});const B=t.B,sp=B.units.find(u=>u.type==='hum_spear'),sw=B.units.find(u=>u.type==='hum_foot');
  const st=(u,k)=>t.holdOf(u,k)[0];[sp,sw].forEach(u=>{u.tgt=null;u.atkAt=null;u.stun=0;u.spdNow=0});
  const restS=st(sp,'spear'),restW=st(sw,'sword');sp.spdNow=sp.s.spd;sw.spdNow=sw.s.spd;const runS=st(sp,'spear'),runW=st(sw,'sword');sw.spdNow=sw.s.spd*.55;const marchW=st(sw,'sword');
  ok(restS<-80&&Math.abs(runS)<20,'a spear: upright at rest, levelled in a charge ('+restS+' \u2192 '+runS+')');
  ok(restW>40&&marchW<-100&&runW<-100,'a sword: point down at rest, on the shoulder on the march, raised up and back in a charge ('+restW+', '+marchW+', '+runW+')');
  sp.spdNow=sw.spdNow=0;sp.tgt={x:sp.x+18,y:sp.y+8,hp:1,s:{}};sw.tgt={x:sw.x+18,y:sw.y,hp:1,s:{}};ok(st(sp,'spear')>0&&st(sp,'spear')<35&&st(sw,'sword')<0&&st(sw,'sword')>-70,'a foe close by: the spear points at him, the sword comes up in guard');
  sw.atkStyle='swing';const at=f=>{sw.atkAt=B.t-f*t.ATK_ANIM;return st(sw,'sword')};const a0=at(.05),a1=at(.42),a2=at(.6);ok(a0<a1&&a1<a2&&a0<-100&&a2>30&&at(.2)===a0,'a blow: a wind-up held a moment, then a fast strike from raised behind to down in front ('+[a0,a1,a2].map(Math.round).join(' \u2192 ')+')');
  sp.atkStyle='thrust';sp.atkAt=B.t-.4*t.ATK_ANIM;ok(t.holdOf(sp,'spear')[1]>1,'a thrust drives the spear forward');
  sp.atkAt=null;sp.tgt=null;sp.spdNow=sp.s.spd;sp.plx=sp.x-1;ok(t.procPose(sp,true)>=15&&t.procPose(sp,true)<=18,'running shows the run');sp.spdNow=sp.s.spd*.5;ok(t.procPose(sp,true)>=2&&t.procPose(sp,true)<=5,'walking the walk');
  B.over=true;B.endT=0;t.B=null;G.mode='world'}
 // obstacles (a field without terrain): drawn in the ground's style (engine/ground.js PX.battleObstacle: a battle tree of the
 // climate's, a boulder of its rock, a cactus), never the old sprites; where they stand and what they block as before
 {ok((0,eval)('typeof obstacleSprite')==='undefined'&&!/paintDecor/.test(t.paintArena.toString())&&/PX\.battleDetails/.test(t.paintArena.toString())&&/PX\.smallTree/.test(t.sceneCv.toString()),'the old sprites are gone: no obstacleSprite; the battle ground\u2019s small things are the terrain\u2019s; a town\u2019s trees are the ground\u2019s small ones');
  // (placement: as before the art changed, seeds 1, 2, 3, 7 and 44, every climate and ground: kinds, places and radii)
  const mr0=Math.random;let h=0;for(const s of [1,2,3,7,44])for(const c of ['grass','frost','desert','swamp'])for(const tt of [t.T_OPEN,t.T_FOREST,t.T_HILL]){Math.random=t.seeded(s);for(const q of t.placeObstacles({c,t:tt}))h=(Math.imul(h,31)+q.kind.length*1009+q.x*7+q.y*131+q.r*17)|0}Math.random=mr0;
  ok(h===2075583050,'obstacles stand where they stood, as large (placement fingerprint '+h+' on a '+t.BW+'x'+t.BH+' field)');
  const SP={grass:['oak','birch'],frost:['pine'],desert:['palm'],swamp:['willow','dead']},bad=[],looks={};let rnd=0;
  world2();P.troops={hum_spear:2};t.startBattle({enemies:['militia'],tournament:false});const B=t.B,ctx=t.ctx,orig=ctx.drawImage,drawn=new Set();
  ctx.drawImage=function(img,...a){drawn.add(img);return orig.call(ctx,img,...a)};
  try{for(const c of ['grass','frost','desert','swamp']){B.env.c=c;B.obs=['tree','rock','cactus'].flatMap((k,i)=>[0,1,2,3].map(j=>({kind:k,x:200+j*40+i*3,y:200+i*40+j*7,r:k==='rock'?7:k==='cactus'?5:6})));
    const before=JSON.stringify(B.obs);drawn.clear();const mr=Math.random;Math.random=()=>{rnd++;return mr()};try{t.obstacleGround();B.obs.forEach(t.drawObstacle)}finally{Math.random=mr}t.drawBattle();
    for(const o of B.obs){const k=t.obstacleLook(o);(looks[o.kind+c]=looks[o.kind+c]||new Set()).add(k);if(!drawn.has(k.s)||!drawn.has(k.g))bad.push(c+' '+o.kind+' not drawn');
      if(o.kind==='tree'&&!SP[c].some(sp=>[0,1,2].some(v=>t.PX.battleTree(c,sp,v)===k.s)))bad.push(c+' tree not a battle tree')}
    if(JSON.stringify(B.obs)!==before)bad.push(c+' drawing changed the obstacles')}}finally{ctx.drawImage=orig}
  ok(!bad.length&&!rnd,'each kind draws with the new sprite and its ground in each climate, a tree a battle tree of the climate\u2019s, by a hash of where it stands (no Math.random), the obstacles untouched'+(bad.length?': '+bad.slice(0,4).join('; '):rnd?': Math.random '+rnd+'x':''));
  ok(Object.values(looks).every(s=>s.size>=2),'obstacles of one kind vary in look ('+Object.entries(looks).map(([k,s])=>k+' '+s.size).join(', ')+')');
  ok(t.obstacleLook({kind:'rock',x:5,y:9,r:7})===t.obstacleLook({kind:'rock',x:5,y:9,r:7})&&t.PX.battleObstacle('cactus','desert',2)===t.PX.battleObstacle('cactus','desert',2)&&t.PX.battleObstacle('tree','frost',1).s===t.PX.battleTree('frost','pine',1),'their sprites are made once and kept (one a kind, climate and look)');
  // (the footprint: a boulder about 2r across, its foot just before the point; a cactus, a trunk on it; true pixels, opaque or empty)
  let foot='',semi=0;for(const c of ['grass','frost','desert','swamp'])for(let v=0;v<6;v++)for(const [k,r] of [['rock',7],['cactus',5],['tree',6]]){const o=t.PX.battleObstacle(k,c,v),b=o.box,w=b[2]-b[0]+1,y1=b[3]-o.ay,cx=(b[0]+b[2])/2-o.ax;
    if(k==='rock'&&(w<2*r||w>2*r+6||y1<3||y1>5||Math.abs(cx)>1.5)||k!=='rock'&&(y1<1||y1>3))foot+=k+' '+c+' '+v+' ('+w+' wide, foot '+y1+') ';
    const d=o.s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,o.s.width,o.s.height).data;for(let i=3;i<d.length;i+=4)if(d[i]&&d[i]<255)semi++}
  ok(!foot,'each obstacle\u2019s footprint is about what blocks'+(foot?': '+foot:''));ok(!semi,'obstacle sprites are true pixels ('+semi+' half-clear)');
  B.over=true;B.endT=0;t.B=null;G.mode='world'}
 // smooth frames: a battle's sprites are made ahead, a little each frame, so no pose is first drawn mid-fight
 {world2();P.troops={hum_spear:4,hum_bow:3};t.startBattle({enemies:['orc_grunt','orc_hunter'],tournament:false});const n0=t.WARM.q.length;ok(n0>40,'a battle lists the sprites it will need ('+n0+')');
  const a=performance.now();t.warmStep();const ms=performance.now()-a;ok(t.WARM.q.length<n0&&ms<t.WARM.budget+12,'and makes them a little at a time ('+(n0-t.WARM.q.length)+' in '+ms.toFixed(1)+' ms)');
  let k=0;while(t.WARM.q.length&&k++<400)t.warmStep();ok(!t.WARM.q.length,'until all are ready');
  const b0=t.unitSprite('hum_spear',0,false,0,0,true),b7=t.unitSprite('hum_spear',0,false,0,7,true);ok(b0===b7,'a blow\u2019s frames share the standing body (the weapon swings apart)');
  t.B.over=true;t.B.endT=0;t.B=null;G.mode='world'}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 out();
};
