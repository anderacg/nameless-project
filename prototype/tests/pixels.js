'use strict';
// Pixels: what the map shows is true to the pixel and nothing clips. Every building the PX engine draws fits its own tiles
// exactly and is never cut off at its canvas's edge (sites too); every pixel of it is fully there or not at all; estates, piers, boats and sites keep off holdings, each other and the trees painted on the map;
// the world is drawn without scaling, at whole pixels; and the screen shows each game pixel as whole device pixels.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE;t.act('begin','soldier');G.quietEvents=true;
 const solid=c=>{const a=c.getContext('2d').getImageData(0,0,c.width,c.height).data;for(let i=3;i<a.length;i+=4)if(a[i]!==0&&a[i]!==255)return false;return true};
 // ---- every building type, for every people, both ways round, end-on where it can be, across seeds
 const DEEP=['longhouse','barn','warehouse','hidehall','elfhall','stonehall'];let n=0;const clip=[],wide=[],soft=[];
 for(const type of PX.BUILDING_TYPES.concat(PX.SITE_TYPES.filter(k=>!PX.site({type:k,seed:1}).camp)))for(const style of ['human','dwarf','elf','orc'])for(let s=1;s<=4;s++)for(const facing of ['left','right'])for(const deep of DEEP.includes(type)?[false,true]:[false]){
   const b=(PX.SITE_TYPES.includes(type)?PX.site:PX.building)({type,style,seed:s*37+1,facing,deep,banner:'#c84040'}),id=type+'/'+style+'/'+s+'/'+facing+(deep?'/deep':'');n++;
   if(b.clipped)clip.push(id);if(b.img.width!==b.tiles[0]*TILE||b.ax!==0||!Number.isInteger(b.ay))wide.push(id+' '+b.img.width+'px');if(!solid(b.img))soft.push(id)}
 ok(!clip.length,n+' buildings: none is cut off or spills past its tiles'+(clip.length?': '+clip.slice(0,8).join(', '):''));
 ok(!wide.length,'each is exactly as wide as its tiles (16 px a tile), standing on its footprint\'s left edge'+(wide.length?': '+wide.slice(0,8).join(', '):''));
 ok(!soft.length,'every pixel of every building is fully drawn or not at all (no blending, no half-transparent outline)'+(soft.length?': '+soft.slice(0,8).join(', '):''));
 // ---- placed buildings: each its own cell, none sharing a tile with another, on its holding's land, the grid true to them
 const bad=[],seenT=new Map();
 for(const tw of t.TOWNS)for(const l of tw.lots){const b=PX.building({type:l.type,style:t.lotPeople(tw,l),seed:l.seed,env:'grass'});
   if(b&&(b.clipped||b.tiles[0]!==l.n||b.img.width!==l.n*TILE))bad.push(tw.name+': '+l.type+' is not its '+l.n+'x'+l.n+' cell');
   const tiles=[];for(let j=0;j<l.n;j++)for(let i=0;i<l.n;i++)tiles.push([l.x+i,l.y+j]);for(const [x,y] of tiles.concat(l.plots||[])){const k=x+','+y;if(seenT.has(k))bad.push(tw.name+' '+l.type+' shares '+k+' with '+seenT.get(k));seenT.set(k,tw.name+' '+l.type);if(t.occAt(x,y)!==l.id)bad.push(tw.name+' '+l.type+': the grid says '+t.occAt(x,y)+' at '+k)}}
 ok(!bad.length,t.TOWNS.reduce((a,z)=>a+z.lots.length,0)+' placed buildings: each exactly its cell, none sharing a tile (fields included), and the grid agrees'+(bad.length?': '+bad.slice(0,6).join('; '):''));
 const cen=t.TOWNS.filter(z=>{const c=t.lotCentre(z);return!c||c.y+c.n!==z.ty+1||z.tx<c.x||z.tx>=c.x+c.n});ok(!cen.length,'every holding has one centre, standing on its own tile (where its roads end and parties arrive)'+(cen.length?': '+cen.map(z=>z.name).join(', '):''));
 // ---- estates: their boats float clear of their piers
 // (moored boats are the sailing ships' sprites, moored: power-of-two cells, waterline on the bottom row, the hull on water)
 const eb=[];let nb=0,ncog=0;for(const tw of t.TOWNS){if(tw.lots.some(l=>l.k==='port')&&t.pierOf(tw))for(const lv of [1,2,3])for(const bt of t.estateBoats(tw,lv)){const pr=t.pierOf(tw),[l,tp,r,bm]=bt.box,v=pr.dir==='n'||pr.dir==='s',n=bt.b.img.width;nb++;if(bt.big)ncog++;
   if(v?(l<=pr.x+5&&r>=pr.x-5):(tp<=pr.y+6&&bm>=pr.y-5))eb.push(tw.name+' boat on the pier');
   if(n!==bt.b.img.height||![32,64].includes(n)||bt.b.ay!==n-1)eb.push(tw.name+' boat not in its power-of-two cell');
   for(const [x,y] of [[l,bm],[r,bm],[(l+r)>>1,bm],[l,tp],[r,tp]])if(x<0||y<0||x>=t.MW*TILE||y>=t.MH*TILE||t.tAt(Math.floor(x/TILE),Math.floor(y/TILE))!==t.T_WATER)eb.push(tw.name+' boat aground at '+x+','+y)}}
 ok(nb&&ncog&&!eb.length,nb+' boats moored at the ports’ piers (levels 1 to 3, '+ncog+' of them cogs): in power-of-two cells, afloat and clear of their piers'+(eb.length?': '+eb.slice(0,8).join('; '):''));
 // ---- sites: on open ground, nothing painted on the map inside or over them
 const sb=W.sites.filter(s=>s.type!=='camp'&&!t.siteClear(s.type,s.tx,s.ty));// (the camps: their own check below)ok(!sb.length,W.sites.length+' sites, all on open ground clear of trees, hills and peaks (a cave: in the face of its hill or mountain)'+(sb.length?': '+sb.map(s=>s.type+'@'+s.tx+','+s.ty).slice(0,6).join(', '):''));
 {const on=[],foot=(o,sp)=>{const x0=Math.floor((o.x-sp.ax)/TILE),y0=Math.floor((o.y+8-sp.ay)/TILE);for(let j=0;j<sp.height/TILE;j++)for(let i=0;i<sp.width/TILE;i++)if(t.tAt(x0+i,y0+j)===t.T_ROAD)return true;return false};
  t.camps().forEach((c,i)=>{const sp=t.siteSprite(c);if(foot(c,sp))on.push('bandit camp '+i);if(sp.width!==2*TILE||sp.height!==2*TILE||(c.x-sp.ax)%TILE)on.push('bandit camp '+i+' is not its 2 x 2 tiles')});
  W.sites.filter(s=>s.type==='hideout'||s.type==='travelers').forEach(s=>{const sp=t.siteSprite(s);if(foot(s,sp))on.push(s.type+'@'+s.tx+','+s.ty);if((s.x-sp.ax)%TILE||(s.y+8-sp.ay)%TILE)on.push(s.type+' off the grid')});
  ok(!on.length,t.camps().length+' bandit camps (2 x 2 tiles), hideouts and travellers\u2019 camps: on their own tiles, none over a road'+(on.length?': '+on.slice(0,6).join('; '):''))}
 {const cs=W.sites.filter(s=>s.type==='cave'),off=cs.filter(s=>![t.T_HILL,t.T_MOUNT].includes(t.tAt(s.tx,s.ty))||!t.passable(t.tAt(s.tx,s.ty+1)));
  ok(cs.length&&!off.length,cs.length+' caves, each cut into a hill or mountain, its mouth on ground parties can reach'+(off.length?': '+off.map(s=>s.tx+','+s.ty).join(' '):''));
  const c=cs[0],sp=t.siteSprite(c),x0=c.x-sp.ax,y0=c.y+8-sp.ay;c.seen=true;P.x=c.x;P.y=c.y+30;
  ok(y0+sp.height===(c.ty+1)*TILE&&sp.width===TILE&&x0===c.tx*TILE,'a cave is drawn exactly on its rock tile');
  ok(t.pickAt(x0+2,y0+2)===c&&t.pickAt(x0+13,y0+13)===c&&t.pickAt(x0-6,y0+8)!==c&&t.pickAt(x0+8,y0-6)!==c&&t.pickAt(x0+22,y0+8)!==c,'a click picks a cave on its picture, and not beside it')}
 // ---- the world drawn at whole pixels and its own size, with everything in view
 const tw=t.townBy('Ashford');P.x=tw.x+40;P.y=tw.y+30;G.mode='world';G.modal=false;t.hidePanel();W.sites.forEach(s=>s.seen=true);
 if(W.monsters[0]){W.monsters[0].x=P.x+60;W.monsters[0].y=P.y}const dm=t.mythicOf('dragon')||t.spawnMythic('dragon');if(dm){dm.x=P.x-60;dm.y=P.y-20}
 const ctx=t.ctx,orig=ctx.drawImage,off=[];
 ctx.drawImage=function(img,...a){const m=ctx.getTransform(),whole=v=>Math.abs(v-Math.round(v))<1e-6,[dx,dy]=a.length===8?[a[4],a[5]]:[a[0],a[1]];
   const sw=a.length===8?a[2]:img.width,sh=a.length===8?a[3]:img.height,dw=a.length>=4?(a.length===8?a[6]:a[2]):sw,dh=a.length>=4?(a.length===8?a[7]:a[3]):sh;
   if(Math.abs(Math.abs(m.a)-1)>1e-9||Math.abs(Math.abs(m.d)-1)>1e-9||m.b||m.c||dw!==sw||dh!==sh)off.push('scaled '+img.width+'x'+img.height);
   else if(!whole(m.a*dx+m.e)||!whole(m.d*dy+m.f))off.push('at '+(m.a*dx+m.e).toFixed(2)+','+(m.d*dy+m.f).toFixed(2)+' ('+img.width+'x'+img.height+') '+(new Error().stack.split('\n')[2]||'').trim().split('/').pop());
   return orig.call(ctx,img,...a)};
 for(const at of ['Ashford','Saltmere','Highmoor','Sunreach']){const z=t.townBy(at);P.x=z.x+30;P.y=z.y+20;t.drawWorld()}
 ctx.drawImage=orig;
 ok(!off.length,'the world map draws every picture unscaled, at whole pixels'+(off.length?': '+[...new Set(off)].slice(0,6).join('; '):''));
 // ---- sprite cells: every figure sits in an 8, 16, 32 or 64 pixel square, feet on its bottom row, never cut off
 {const pow=c=>c.width===c.height&&[8,16,32,64].includes(c.width)&&c.cw<=c.width&&c.ch<=c.height,list=[];
  const add=(n,c)=>list.push([n,c]);add('party',t.partySprite('#e8b94a','',0));add('party mounted',t.partySprite('#e8b94a','#8a6a4a',1));add('bandit',t.banditSprite(0));add('follower',t.followerSprite('#3d74d6',0));
  add('caravan',t.caravanSprite('#3d74d6'));add('refugee',t.refugeeSprite(0));[0,1,2].forEach(v=>{add('ship trade',t.shipSprite({seed:v,big:true,col:'#3d74d6'}));add('ship fishing',t.shipSprite({seed:v,big:false}))});[0,1,2].forEach(v=>{add('ship trade',t.shipSprite({seed:v,big:true,col:'#3d74d6'}));add('ship fishing',t.shipSprite({seed:v,big:false}))});Object.keys(t.JOBS).forEach(j=>add('worker '+j,t.folkSprite(j,0)));Object.keys(t.CRITTERS).forEach(c=>add('critter '+c,t.critterSprite(c)));
  Object.keys(t.ST).forEach(u=>{for(const pose of [0,3,7,10,13])add(u+' pose '+pose,t.unitSprite(u,0,false,0,pose))});add('hero',t.unitSprite('hero',0,true,0,7));
  Object.keys(t.MONSTERS).forEach(m=>add('monster '+m,t.unitSprite(t.MONSTERS[m].unit,1,false)));['tree','cactus','rock'].forEach(k=>add('obstacle '+k,t.obstacleSprite(k,'grass')));add('townsfolk',t.personSprite('folk','human',1,0));
  const bad=list.filter(([,c])=>!pow(c)).map(([n,c])=>n+' '+c.width+'x'+c.height),by={};list.forEach(([n,c])=>{(by[c.width]=by[c.width]||new Set()).add(n.split(' ')[0])});
  ok(!bad.length,list.length+' sprites, each in a power-of-two cell: '+Object.keys(by).map(k=>k+'x'+k+' '+[...by[k]].slice(0,6).join('/')).join(', ')+(bad.length?' — not: '+bad.slice(0,6).join(', '):''));
  ok(t.followerSprite('#3d74d6',1).width===16,'army followers stand as tall as their lord, in a 16x16 cell')}
 // ---- the tile grid: off by default; on, a line runs down every tile edge and nowhere else
 t.setGrid(false);
 {const z=t.townBy('Ashford');P.x=z.x+30;P.y=z.y+20;G.paused=true;const col=x=>{const a=ctx.getImageData(x,0,1,t.VH).data;return a};
  t.drawWorld();const ex=((16-G.cam.x%16)%16)+64,a0=col(ex),m0=col(ex+8);t.setGrid(true);t.drawWorld();const a1=col(ex),m1=col(ex+8);t.setGrid(false);
  let de=0,dm=0;for(let i=0;i<a0.length;i+=4){if(a0[i]!==a1[i])de++;if(m0[i]!==m1[i])dm++}const rows=t.VH;
  ok(de>rows*.9&&dm<rows*.15,'the tile grid (Settings, or G on the map) draws a line down every tile edge ('+de+' of '+rows+' pixels changed) and leaves the tiles themselves alone ('+dm+')')}
 // ---- the screen
 const dpr=devicePixelRatio||1,k=parseFloat(t.cv.style.width)*dpr/t.VW;ok(Math.abs(k-Math.round(k))<1e-6&&k>=1,'the screen shows each game pixel as '+Math.round(k)+'x'+Math.round(k)+' device pixels, a whole number');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
