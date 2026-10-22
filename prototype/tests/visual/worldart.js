'use strict';
// Not a test: the world art the owner's play-tests of the generated world asked to fix, for his approval. Each piece drawn by the
// game's own drawWorld at the spot (by day, the fog lifted, you and the folk out of the way), a third of the view round it shown at
// x3, labelled; a piece this world lacks is looked for on the next Normal seeds (the world forged afresh and put in, as the New world screen does).
// part=2 (the default; the second play-test, 2026-10-22): estates' ground by climate (pastures in the snow, the desert and the
// swamp, a farm in the snow and the swamp), fords in each climate (frost, swamp, desert, grass), the water's noise by Thornbrook
// (the water across a climate's edge), the swamp's open ground and its forest, each climate's wood, a lake, a river's bend.
// part=3: each climate's trees (engine/worldnature.js PX.WORLD_TREES), each species' four on its climate's ground at x6, then deep
// in a wood (dimmer).
// part=4 (the third play-test, 2026-10-22): fords in each climate (a dirt track down each bank, the shallows sandy or gravelly with
// ripples, rocks scattered: grass, desert, swamp, frost), the grass meeting the swamp and the desert (the covers: wet and dry), a
// wood's edge on the grass; each border again as the whole view.
// part=5 (the fourth play-test, 2026-10-22; Normal seed 1 first): the hills by a road (what read as swamp: a hill's shade; the hill
// now runs on under the road), a brook crossing a road (a splash ford over a track, planks over a great road), a road across the
// grass's edge with the desert, the frost and the swamp (its colour blended by the covers), woods across each edge (the species
// by the world's own temperature, moisture and height: an ecotone) and hills across the frost's edge (by the snow's cover); a
// bridge\'s foot (stone, wood; the frost, the desert, the swamp): the shore curved up to the deck, a stone abutment no wider than it.
// part=6 (the fifth play-test, 2026-10-22; the generated classic seed first, the owner's): hills crossed by a road on a slant, a
// track through a wood to a ford, a road through a wood, each kind of mountain (PX.WORLD_MOUNTS), an oasis and ponds of each kind
// put into the world (WM.oases, WM.ponds: the generator's lists; a knoll's mountain tiles too), brooks into water and along a road,
// and the fog's edge (drawn, held still). &at=k:s:x:y,... puts piece k at a spot an earlier run printed (the same spots before and
// after a fix). 1200 x 5450.
// part=7 (the owner's notes on the fifth play-test's mountains, 2026-10-22; the generated classic seed first): a forested mountain at
// the owner's spot (classic, 425, 219) and its whole view, each kind of mountain (PX.WN_MOUNT.pool: the original look in each
// climate, then PX.WORLD_MOUNTS), a range across a climate's edge (the most of each of two climates) and a forested one across an
// edge. 1200 x 4300.
// part=1 (the first, 2026-10-22): roads into a holding's gate (Millbrook's, and one coming from behind its centre), roads onto a
// stone and a wooden bridge's deck, a ford, a frost edge (grass to snow), the swamp's trees and a fork; the frost edge and the swamp
// again as the whole view.
// Run by name: Ashmark.html?test=visual/worldart (&part=1), then screenshot it (part 2: a window 1200 x
// 4660; part 3: 950 x 2100; part 1: 1200 x 2340; part 4: 1200 x 2000; part 5: 1200 x 3500). The "before" pictures are this scene run on the commit before the fix.
window.RUN=()=>{const t=T,o=[],G=t.G,P=t.P,W=t.W,TILE=t.TILE,Z=3,part=+(new URLSearchParams(location.search).get('part')||2);
 try{
  if(part===3){const CL=['grass','frost','desert','swamp'],BG={grass:'#54803a',frost:'#d6dee8',desert:'#d6b668',swamp:'#48583a'},Z=6,rows=[];for(const c of CL)for(const sp of PX.WORLD_SPECIES[c])rows.push([c,sp]);
   const pg=document.createElement('canvas');pg.width=8*(16*Z+6)+120;pg.height=rows.length*(16*Z+6)+10;pg.style.cssText='position:absolute;left:0;top:0;z-index:9999';document.body.appendChild(pg);
   const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
   rows.forEach(([c,sp],r)=>{g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(c+' · '+sp,4,r*(16*Z+6)+50);
    for(let k=0;k<8;k++){const s=PX.worldTree(c,sp,k&3,k>>2),X=120+k*(16*Z+6),Y=r*(16*Z+6)+4;g.fillStyle=BG[c];g.fillRect(X,Y,16*Z,16*Z);g.drawImage(s,X,Y,16*Z,16*Z)}});
   o.push('INFO page '+pg.width+' x '+pg.height,'PASS drawn ('+rows.length+' species)');throw 0}
  window.requestAnimationFrame=()=>0;Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
  window.__fog0=window.drawWorldFog;(0,eval)('drawWorldFog=function(){}');
  // (&at=k:s:x:y,...: piece k at tile (x, y) of world s (0 the page's, n Normal seed n), as an earlier run printed: the same spots
  //  before and after a fix)
  const AT={};for(const q of (new URLSearchParams(location.search).get('at')||'').split(',').filter(Boolean)){const [k,s,x,y]=q.split(':').map(Number);AT[k]=[s,x,y]}
  const kind=(x,y)=>t.tAt(x,y),cl=(x,y)=>{const MW=t.MW,MH=t.MH;return t.CLIMS[t.climate[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]]};
  const count=(x0,y0,r,f)=>{let c=0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(x>=0&&y>=0&&x<t.MW&&y<t.MH&&f(x,y))c++;return c};
  const best=score=>{let b=null,bs=-1e9;for(let y=12;y<t.MH-12;y++)for(let x=20;x<t.MW-20;x++){const s=score(x,y);if(s>bs){bs=s;b=[x,y]}}return bs>-1e8?b:null};
  const mid=c=>{const i=c.tiles[c.tiles.length>>1];return[i%t.MW,(i-i%t.MW)/t.MW]};
  const xing=f=>{const c=(t.WM.crossings||[]).find(f);return c?mid(c):null};
  // (a built estate of kind k whose plots lie in climate c: its middle)
  const estate=(k,c)=>{for(const h of t.TOWNS)for(const l of h.lots||[])if(l.k===k&&l.st==='built'&&(l.plots||[]).length&&t.climAt((l.x+.5)*TILE,(l.y+.5)*TILE)===c){const q=[[l.x,l.y],...l.plots];return[Math.round(q.reduce((s,p)=>s+p[0],0)/q.length),Math.round(q.reduce((s,p)=>s+p[1],0)/q.length)]}return null};
  const wood=c=>best((x,y)=>cl(x,y)!==c||kind(x,y)!==t.T_FOREST?-1e9:count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST&&cl(a,b)===c)+.6*count(x,y,4,(a,b)=>kind(a,b)===t.T_OPEN));
  // (a lake: water of no river, 12-90 tiles of it within 6, land round it; a river's bend: a river tile with river on two sides at a
  //  right angle and land on the other two)
  const lake=()=>best((x,y)=>{if(kind(x,y)!==t.T_WATER||t.WM.river[y*t.MW+x]&3)return -1e9;const n=count(x,y,6,(a,b)=>kind(a,b)===t.T_WATER);return n<12||n>90?-1e9:-Math.abs(n-50)+.3*count(x,y,6,(a,b)=>kind(a,b)===t.T_FOREST)});
  const bend=()=>best((x,y)=>{const rv=(a,b)=>kind(a,b)===t.T_WATER&&(t.WM.river[b*t.MW+a]&3)===1;if(!rv(x,y))return -1e9;const L=rv(x-1,y),R=rv(x+1,y),U=rv(x,y-1),D=rv(x,y+1);
    if(!((L||R)&&(U||D))||L&&R||U&&D)return -1e9;return count(x,y,4,rv)-count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER&&!rv(a,b))*3});
  // (the water's noise: water where the frost meets the grass, as by Thornbrook in the owner's game)
  const noise=()=>best((x,y)=>kind(x,y)!==t.T_WATER?-1e9:Math.min(count(x,y,3,(a,b)=>cl(a,b)==='frost'),count(x,y,3,(a,b)=>cl(a,b)!=='frost'))+.4*count(x,y,3,(a,b)=>kind(a,b)===t.T_WATER));
  // (a ford in climate c; in the frost, where it has the most frost round it, 6 of its 7 x 7 tiles at least: few lie in it)
  const fordIn=c=>{if(c!=='frost')return xing(x=>x.kind==='ford'&&cl(...mid(x))===c);let b=null,bn=5;for(const x of t.WM.crossings){if(x.kind!=='ford')continue;const m=mid(x),n=count(m[0],m[1],3,(a,y)=>cl(a,y)==='frost');if(n>bn){bn=n;b=m}}return b};
  // (a border between the grass and climate c on open ground: as much of each within 4 tiles, little water or wood; a wood's edge on
  //  the grass: as much wood as open ground round it)
  const open=(a,b)=>kind(a,b)===t.T_OPEN||kind(a,b)===t.T_HILL;
  const border=c=>()=>best((x,y)=>cl(x,y)!==c&&cl(x,y)!=='grass'||!open(x,y)?-1e9:Math.min(count(x,y,4,(a,b)=>cl(a,b)===c&&open(a,b)),count(x,y,4,(a,b)=>cl(a,b)==='grass'&&open(a,b)))-.5*count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER));
  const edge=()=>best((x,y)=>cl(x,y)!=='grass'||kind(x,y)!==t.T_FOREST?-1e9:Math.min(count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST),count(x,y,3,(a,b)=>cl(a,b)==='grass'&&open(a,b)))-count(x,y,3,(a,b)=>kind(a,b)===t.T_ROAD||kind(a,b)===t.T_WATER)-count(x,y,5,(a,b)=>cl(a,b)!=='grass'));
  // (part 5's: a hill among roads on the grass; a brook crossing a road (n: the n-th best, kept 12 tiles from those before); a road
  //  across the grass's edge with climate c; woods of the grass and climate c meeting; hills of the grass and the frost meeting)
  const brook=(x,y)=>{const i=y*t.MW+x;return kind(x,y)!==t.T_WATER&&!(t.WM.river[i]&3)&&(t.WM.flow[i]&31)>=6},near=[];
  const hillRoad=()=>best((x,y)=>kind(x,y)!==t.T_ROAD||cl(x,y)!=='grass'?-1e9:count(x,y,2,(a,b)=>kind(a,b)===t.T_HILL)-.5*count(x,y,3,(a,b)=>kind(a,b)===t.T_WATER||kind(a,b)===t.T_FOREST));
  const brookRoad=n=>()=>{let b=null;for(let k=0;k<=n;k++){b=best((x,y)=>kind(x,y)!==t.T_ROAD||!brook(x,y)||near.some(([a,c])=>Math.abs(a-x)+Math.abs(c-y)<12)?-1e9:count(x,y,2,brook)-count(x,y,2,(a,c)=>kind(a,c)===t.T_FOREST));if(b)near.push(b)}return b};
  const roadEdge=c=>()=>best((x,y)=>kind(x,y)!==t.T_ROAD?-1e9:Math.min(count(x,y,3,(a,b)=>cl(a,b)===c),count(x,y,3,(a,b)=>cl(a,b)==='grass'))+.5*count(x,y,3,(a,b)=>kind(a,b)===t.T_ROAD)-.5*count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST));
  const woods=c=>()=>best((x,y)=>kind(x,y)!==t.T_FOREST?-1e9:Math.min(count(x,y,4,(a,b)=>kind(a,b)===t.T_FOREST&&cl(a,b)===c),count(x,y,4,(a,b)=>kind(a,b)===t.T_FOREST&&cl(a,b)==='grass')));
  const frostHills=()=>best((x,y)=>kind(x,y)!==t.T_HILL?-1e9:Math.min(count(x,y,3,(a,b)=>kind(a,b)===t.T_HILL&&cl(a,b)==='frost'),count(x,y,3,(a,b)=>kind(a,b)===t.T_HILL&&cl(a,b)!=='frost')));
  // (a bridge\'s foot (stone or not, in climate c): the end tile with the most water round it, of the bridges with that)
  const foot=(stone,c)=>()=>{let b=null,bn=-1;for(const x of t.WM.crossings){if(x.kind!=='bridge'||!x.stone!==!stone)continue;for(const q of [x.i,x.j]){const fx=q%t.MW,fy=(q-fx)/t.MW;if(c&&cl(fx,fy)!==c)continue;
    const n=count(fx,fy,1,(a,y)=>kind(a,y)===t.T_WATER);if(n>bn){bn=n;b=[fx,fy]}}}return b};
  // (part 6's: a ford whose banks' road runs into a wood; a road through a wood; a range of mountain kind k (engine/worldnature.js
  //  PX.WORLD_MOUNTS: the plan's masses' kind; before kinds, the climate's); an oasis and ponds put into the world (WM.oases, WM.ponds:
  //  the generator's lists, injected here: 1-3 water tiles each); a brook into water and one along a road; the fog's edge)
  const lane=(x,y)=>kind(x,y)===t.T_ROAD&&count(x,y,1,(a,b)=>kind(a,b)===t.T_FOREST)>=4;
  const fordWood=()=>{let b=null,bs=-1;for(const c of t.WM.crossings||[]){if(c.kind!=='ford')continue;let s=0;for(const q of [c.i,c.j]){const x=q%t.MW,y=(q-x)/t.MW;s+=count(x,y,3,lane)*3+count(x,y,2,(a,b)=>kind(a,b)===t.T_FOREST)}if(s>bs){bs=s;b=mid(c)}}return bs>4?b:null};
  const woodRoad=()=>best((x,y)=>!lane(x,y)?-1e9:count(x,y,3,lane)*2+count(x,y,2,(a,b)=>kind(a,b)===t.T_FOREST)-3*count(x,y,3,(a,b)=>kind(a,b)===t.T_WATER));
  const MK={sandstone:'desert',alpine:'frost',knoll:'swamp',granite:'grass',forested:'grass',basalt:null};
  const mount=k=>()=>{const NP=t.WorldArt.ensure().nature;let b=null,bs=-1;for(const m of NP.M){const ok=m.kind!=null?m.kind===k:MK[k]===m.c&&(k!=='forested'||m.n<40);if(!ok||m.c0<12||m.r0<10||m.c1>t.MW-12||m.r1>t.MH-10)continue;const s=Math.min(m.n,60);if(s>bs){bs=s;b=[(m.c0+m.c1+1)>>1,(m.r0+m.r1+1)>>1]}}return b};
  // (part 7's: a range of kind k (classic: the original look; before the pool, the climate's look: no kind) whose most tiles are
  //  climate c (any if none), the biggest up to 60 tiles; a range across an edge (its tiles' second climate the most, f: of kind k)
  //  at its mount tile with the most of each climate round it)
  const masses=()=>{const NP=t.WorldArt.ensure().nature;return NP.M.map(m=>{const n={};for(let j=m.r0;j<=m.r1;j++)for(let i=m.c0;i<=m.c1;i++)if(NP.lab[j*t.MW+i]===m.id){const c=cl(i,j);n[c]=(n[c]||0)+1}
    const cs=Object.keys(n).sort((a,b)=>n[b]-n[a]);return{m,n,c:cs[0],c2:cs[1]||null,k:m.kind||'classic'}}).filter(q=>q.m.c0>=12&&q.m.r0>=10&&q.m.c1<=t.MW-12&&q.m.r1<=t.MH-10)};
  const kindOf=(k,c)=>()=>{let b=null,bs=-1;for(const q of masses()){if(q.k!==k||c&&q.c!==c)continue;const s=Math.min(q.m.n,60);if(s>bs){bs=s;b=[(q.m.c0+q.m.c1+1)>>1,(q.m.r0+q.m.r1+1)>>1]}}return b};
  const across=k=>()=>{let b=null,bs=0;const NP=t.WorldArt.ensure().nature;for(const q of masses()){
    for(let j=q.m.r0;j<=q.m.r1;j++)for(let i=q.m.c0;i<=q.m.c1;i++){if(NP.lab[j*t.MW+i]!==q.m.id||k&&(q.m.kinds||{})[cl(i,j)]!==k)continue;const c=cl(i,j),v=Math.min(count(i,j,3,(a,e)=>NP.lab[e*t.MW+a]===q.m.id&&cl(a,e)===c),count(i,j,3,(a,e)=>cl(a,e)!==c));if(v>bs){bs=v;b=[i,j]}}}return b};
  // (climate c's pool kind k alone while a piece is drawn; the swamp's: the knoll put in (4 x 2 tiles of mountain on its open ground)
  //  of kind k)
  const asKind=(c,k)=>()=>{const L=PX.WN_MOUNT.pool[c];PX.WN_MOUNT.pool[c]=[[k,1]];t.WorldArt.invalidate();return()=>{PX.WN_MOUNT.pool[c]=L;t.WorldArt.invalidate()}};
  const swampAs=k=>[()=>{inject();return window.__knoll||null},0,asKind('swamp',k)];
  const isOpen=(x,y)=>kind(x,y)===t.T_OPEN;
  const spot=(f,r)=>best((x,y)=>!f(x,y)||count(x,y,r+1,(a,b)=>!isOpen(a,b)||t.WorldArt.ensure().clear.at(a*TILE+8,b*TILE+8))?-1e9:-Math.abs(x-t.MW/2)*.01);
  const inject=()=>{if(window.__inj===t.WM)return;window.__inj=t.WM;const O=t.WM.oases=t.WM.oases||[],PD=t.WM.ponds=t.WM.ponds||[],put=(x,y)=>{t.tiles[y*t.MW+x]=t.T_WATER};
   const des=spot((x,y)=>cl(x,y)==='desert'&&count(x,y,5,(a,b)=>cl(a,b)==='desert')>110,3);if(des){put(des[0],des[1]);O.push({i:des[1]*t.MW+des[0],r:1,big:false});window.__oa=des}
   const dh=t.TOWNS.find(h=>cl(h.tx,h.ty)==='desert');if(dh){let b=null;for(let r=3;r<8&&!b;r++)for(let a=-r;a<=r&&!b;a++)for(const [x,y] of [[dh.tx+a,dh.ty+r],[dh.tx+a,dh.ty-r]])if(!b&&count(x,y,2,(p,q)=>!isOpen(p,q)||t.WorldArt.ensure().clear.at(p*TILE+8,q*TILE+8))===0){b=[x,y]}
    if(b){put(b[0],b[1]);put(b[0]+1,b[1]);put(b[0],b[1]+1);O.push({i:b[1]*t.MW+b[0],r:2,big:true});window.__ob=b}}
   const pond=(kd,f,r,key)=>{const at=spot(f,r);if(!at)return;put(at[0],at[1]);if(kd!=='spring')put(at[0]+1,at[1]);PD.push({i:at[1]*t.MW+at[0],r:kd==='spring'?1:2,kind:kd});window[key||'__p_'+kd+(kd==='tarn'?cl(...at):'')]=at};
   pond('hollow',(x,y)=>cl(x,y)==='grass'&&count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST)>6,1);
   pond('oxbow',(x,y)=>cl(x,y)==='grass'&&count(x,y,3,(a,b)=>(t.WM.river[b*t.MW+a]&3)>0)>3&&count(x,y,1,(a,b)=>kind(a,b)===t.T_WATER)===0,1);
   pond('tarn',(x,y)=>cl(x,y)==='frost'&&count(x,y,2,(a,b)=>kind(a,b)===t.T_MOUNT||kind(a,b)===t.T_HILL)>8,0);
   pond('tarn',(x,y)=>cl(x,y)!=='frost'&&cl(x,y)!=='desert'&&count(x,y,2,(a,b)=>kind(a,b)===t.T_MOUNT)>5,-1);
   pond('spring',(x,y)=>{if(cl(x,y)!=='grass'||(t.WM.flow[y*t.MW+x]&31)>=6)return false;const d=t.WM.flow[y*t.MW+x]>>5,nx=x+t.DIR8[d][0],ny=y+t.DIR8[d][1];return brook(nx,ny)},1);
   pond('pool',(x,y)=>cl(x,y)==='swamp',1);
   // (a hollow in a wood (its trees round it); a hollow where the grass meets the swamp, the desert or the frost (a blended bank))
   {const at=best((x,y)=>kind(x,y)!==t.T_FOREST||cl(x,y)!=='grass'?-1e9:count(x,y,2,(a,b)=>kind(a,b)===t.T_FOREST)-(count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER||kind(a,b)===t.T_ROAD)?99:0));
    if(at){put(at[0],at[1]);put(at[0],at[1]+1);PD.push({i:at[1]*t.MW+at[0],r:2,kind:'hollow'});window.__p_wood=at}}
   pond('hollow',(x,y)=>cl(x,y)==='grass'&&count(x,y,2,(a,b)=>cl(a,b)!=='grass')>=8,1,'__p_edge');
   // (a knoll: 4 x 2 tiles of mountain on the swamp's open ground, its fields the land's there)
   {const at=spot((x,y)=>cl(x,y)==='swamp'&&count(x,y,3,(a,b)=>cl(a,b)==='swamp')>40,3);if(at){for(let b=0;b<2;b++)for(let a=-1;a<3;a++)t.tiles[(at[1]+b)*t.MW+at[0]+a]=t.T_MOUNT;window.__knoll=at}}
   t.WorldArt.invalidate()};
  const injected=k=>()=>{inject();return window[k]||null};
  const brookIn=()=>best((x,y)=>{if(!brook(x,y))return -1e9;const d=t.WM.flow[y*t.MW+x]>>5,nx=x+t.DIR8[d][0],ny=y+t.DIR8[d][1];return kind(nx,ny)===t.T_WATER?count(x,y,3,brook)-count(x,y,3,(a,b)=>kind(a,b)===t.T_FOREST):-1e9});
  const brookAlong=()=>best((x,y)=>kind(x,y)!==t.T_ROAD||!brook(x,y)?-1e9:count(x,y,2,(a,b)=>kind(a,b)===t.T_ROAD&&brook(a,b)));
  const fogEdge=()=>{const at=best((x,y)=>cl(x,y)!=='grass'||count(x,y,14,(a,b)=>cl(a,b)!=='grass')>6?-1e9:count(x,y,6,isOpen)-3*count(x,y,6,(a,b)=>kind(a,b)===t.T_WATER));if(at)window.__fogAt=at;return at};
  // (a hill crossed by a road on a slant: a road tile with road on two diagonal corners and the most hill round it; n: the n-th, kept
  //  10 tiles from those before)
  const diag=(x,y)=>kind(x,y)===t.T_ROAD&&(kind(x-1,y-1)===t.T_ROAD&&kind(x+1,y+1)===t.T_ROAD||kind(x+1,y-1)===t.T_ROAD&&kind(x-1,y+1)===t.T_ROAD),hn=[];
  const hillSlant=n=>()=>{let b=null;for(let k=0;k<=n;k++){b=best((x,y)=>!diag(x,y)||hn.some(([a,c])=>Math.abs(a-x)+Math.abs(c-y)<10)?-1e9:count(x,y,2,(a,c)=>kind(a,c)===t.T_HILL));if(b)hn.push(b)}hn.length=0;return b};
  const PIECES=part===7?[
   ["a forested mountain (the owner's spot)",()=>[425,219]],["a forested mountain (the owner's spot), the whole view",()=>[425,219],1],
   ["mountains: forested, a big range (put in: the granite's, the grass's pool forested alone)",kindOf('granite'),0,asKind('grass','forested')],["mountains: forested across a climate's edge",across('forested')],
   ["mountains: the original look, on the grass",kindOf('classic','grass')],["mountains: the original look, in the frost",kindOf('classic','frost')],
   ["mountains: the original look, in the desert",kindOf('classic','desert')],["mountains: the original look, in the swamp (put in: 4 x 2 tiles)",...swampAs('classic')],
   ["mountains: grey granite",kindOf('granite')],["mountains: dark basalt",kindOf('basalt')],
   ["mountains: snow-capped alpine",kindOf('alpine')],["mountains: desert sandstone",kindOf('sandstone')],
   ["mountains: the swamp's knolls (put in: 4 x 2 tiles)",...swampAs('knoll')],["a range across a climate's edge",across()],
   ["a range across a climate's edge, the whole view",across(),1],["mountains: forested in the swamp (put in: 4 x 2 tiles)",...swampAs('forested')]]:part===6?[
   ['a hill crossed by a road on a slant',hillSlant(0)],['a hill crossed by a road on a slant (another)',hillSlant(1)],
   ['a track through a wood to a ford',fordWood],['a track through a wood to a ford, the whole view',fordWood,1],
   ['a road through a wood',woodRoad],['a road through a wood, the whole view',woodRoad,1],
   ['mountains: desert sandstone',mount('sandstone')],['mountains: grey granite',mount('granite')],
   ['mountains: dark basalt',mount('basalt')],['mountains: snow-capped alpine',mount('alpine')],
   ['mountains: forested, on wet grassland',mount('forested')],['mountains: the swamp\'s knolls (put in: 4 x 2 tiles)',()=>{inject();return window.__knoll||mount('knoll')()}],
   ['mountains: desert sandstone, the whole view',mount('sandstone'),1],['mountains: grey granite, the whole view',mount('granite'),1],
   ['an oasis in the desert (put in: 1 tile)',injected('__oa')],['a big oasis by a holding (put in: 3 tiles)',injected('__ob')],
   ['a pond: a wet hollow by a wood (put in)',injected('__p_hollow')],['a pond: an oxbow by a river (put in)',injected('__p_oxbow')],
   ['a pond: a tarn in the frost (put in)',injected('__p_tarnfrost')],['a pond: a tarn among mountains (put in)',injected('__p_tarngrass')],
   ['a pond: a spring at a brook\'s source (put in)',injected('__p_spring')],['a pond: a swamp pool (put in)',injected('__p_pool')],
   ['a pond in a wood (put in)',injected('__p_wood')],['a pond where the grass meets another climate (put in)',injected('__p_edge')],
   ['a brook into water',brookIn],['a brook along a road',brookAlong],
   ['the fog\'s edge (you, the land you remember, the land you never saw)',fogEdge,2]]:part===5?[
   ['hills by a road on the grass (the dark patches)',hillRoad],['hills by a road, the whole view',hillRoad,1],
   ['a brook crossing a road',brookRoad(0)],['a brook crossing a road (another)',brookRoad(1)],
   ['a road from the grass into the desert',roadEdge('desert')],['a road from the grass into the frost',roadEdge('frost')],
   ['a road from the grass into the swamp',roadEdge('swamp')],['woods of the grass and the frost meeting',woods('frost')],
   ['woods of the grass and the swamp meeting',woods('swamp')],['woods of the grass and the desert meeting',woods('desert')],
   ['hills of the grass and the frost meeting',frostHills],['woods of the grass and the frost meeting, the whole view',woods('frost'),1],
   ['a stone bridge\'s foot on the grass',foot(true,'grass')],['a wooden bridge\'s foot',foot(false)],
   ['a bridge\'s foot in the frost',foot(true,'frost')],['a bridge\'s foot in the desert',foot(true,'desert')],['a bridge\'s foot in the swamp',foot(true,'swamp')]]:part===4?[
   ['a ford on the grass',()=>fordIn('grass')],['a ford in the desert',()=>fordIn('desert')],
   ['a ford in the swamp',()=>fordIn('swamp')],['a ford in the frost',()=>fordIn('frost')],
   ['the grass meeting the swamp',border('swamp')],['the grass meeting the desert',border('desert')],
   ['a wood\'s edge on the grass',edge],['the grass meeting the swamp, the whole view',border('swamp'),1],
   ['the grass meeting the desert, the whole view',border('desert'),1],['a wood\'s edge, the whole view',edge,1]]:part===1?(()=>{const mb=t.townBy('Millbrook'),
    behind=()=>{for(const h of t.TOWNS)for(const r of t.WM.roads||[])for(const l of r.line||[])for(const [e,n] of [[0,2],[l.length-2,l.length-4]]){if(n<0||n>=l.length)continue;
      if(Math.abs(l[e]-h.tx)<.01&&Math.abs(l[e+1]-(h.ty+1))<.01&&l[n+1]<h.ty)return h}return t.TOWNS.find(h=>h.kind==='town')},bh=behind();
    const L=[
     ['a road into Millbrook\'s gate',()=>mb&&[mb.tx,mb.ty]],
     ['a road into '+bh.name+'\'s gate',()=>[bh.tx,bh.ty]],
     ['a road onto a stone bridge',()=>xing(c=>c.kind==='bridge'&&c.stone)],
     ['a road onto a wooden bridge',()=>xing(c=>c.kind==='bridge'&&!c.stone)],
     ['a ford',()=>xing(c=>c.kind==='ford')],
     ['a frost edge',()=>best((x,y)=>cl(x,y)!=='frost'||cl(x,y+3)!=='grass'?-1e9:count(x,y,5,(a,b)=>kind(a,b)===t.T_OPEN||kind(a,b)===t.T_HILL)+(count(x,y,4,(a,b)=>kind(a,b)===t.T_ROAD)?8:0))],
     ['the swamp',()=>best((x,y)=>cl(x,y)!=='swamp'?-1e9:count(x,y,5,(a,b)=>cl(a,b)==='swamp'&&kind(a,b)===t.T_OPEN)+.5*count(x,y,5,(a,b)=>kind(a,b)===t.T_WATER))],
     ['a fork',()=>{const Gr=t.WM.graph;if(Gr)for(let v=0;v<Gr.n;v++)if(Gr.nk[v]===1){const i=Gr.tile[v],x=i%t.MW,y=(i-x)/t.MW;if(x>20&&y>12&&x<t.MW-20&&y<t.MH-12)return[x,y]}return null}]];
    L.push(['the frost edge, the whole view',L[5][1],1],['the swamp, the whole view',L[6][1],1]);return L})():[
   ['a pasture in the snow',()=>estate('pasture','frost')],['a pasture in the desert',()=>estate('pasture','desert')],
   ['a pasture in the swamp',()=>estate('pasture','swamp')],['a pasture on the grass',()=>estate('pasture','grass')],
   ['a farm in the snow',()=>estate('farm','frost')],['a farm in the swamp',()=>estate('farm','swamp')],
   ['a farm in the desert',()=>estate('farm','desert')],['a quarry in the snow',()=>estate('quarry','frost')],
   ['a ford in the frost',()=>fordIn('frost')],['a ford in the swamp',()=>fordIn('swamp')],
   ['a ford in the desert',()=>fordIn('desert')],['a ford on the grass',()=>fordIn('grass')],
   ['the water where the frost meets the grass (the noise by Thornbrook)',noise],['the water there, the whole view',noise,1],
   ['the swamp\'s open ground',()=>best((x,y)=>cl(x,y)!=='swamp'||kind(x,y)!==t.T_OPEN?-1e9:count(x,y,4,(a,b)=>cl(a,b)==='swamp'&&kind(a,b)===t.T_OPEN)+.4*count(x,y,4,(a,b)=>kind(a,b)===t.T_WATER))],
   ['the swamp\'s forest',()=>wood('swamp')],
   ['a wood on the grass',()=>wood('grass')],['a wood in the frost',()=>wood('frost')],
   ['a wood in the desert',()=>wood('desert')],['the swamp\'s forest, the whole view',()=>wood('swamp'),1],
   ['a lake',lake],['a river\'s bend',bend],['a lake, the whole view',lake,1],['a river\'s bend, the whole view',bend,1]];
  const cw=Math.round(t.VW/3),ch=Math.round(t.VH/3),lab=18,per=2,rows=Math.ceil(PIECES.length/per),pg=document.createElement('canvas');pg.width=per*(cw*Z+8)+8;pg.height=rows*(ch*Z+lab+8)+8;
  pg.style.cssText='position:absolute;left:0;top:0;z-index:9999;background:#1a1c26';document.body.appendChild(pg);const g=pg.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#1a1c26';g.fillRect(0,0,pg.width,pg.height);
  o.push('INFO page '+pg.width+' x '+pg.height);
  // (the ground and what is built only: no folk, caravans, beasts, parties, banners or labels over it)
  const quiet=()=>{W.folk=[];W.caravans=[];W.critters=[];W.monsters=[]};quiet();const stay=P.stay,keep=[window.txt,window.drawParties,window.drawBanners];window.txt=window.drawParties=window.drawBanners=()=>{};
  // (&only=k,...: those pieces alone)
  const only=(new URLSearchParams(location.search).get('only')||'').split(',').filter(Boolean).map(Number),left=new Set(PIECES.map((p,k)=>k).filter(k=>!only.length||only.includes(k)));
  try{
   for(let s=part===5?1:0;s<=6&&left.size;s++){
    if(s){window.txt=keep[0];t.forgeInstall(t.genWorld({preset:'normal',seed:String(s)}));G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();quiet();window.txt=()=>{}}
    if(part===6||part===7)inject();
    for(const k of [...left]){const [pn,f,wide,setup]=PIECES[k],at=AT[k]?(AT[k][0]===s?AT[k].slice(1):null):f();if(!at)continue;left.delete(k);const c=k%per,r=(k/per)|0,X=8+c*(cw*Z+8),Y=8+r*(ch*Z+lab+8);g.fillStyle='#e8e0c8';g.font='13px Arial';
     const fx=(at[0]+.5)*TILE,fy=(at[1]+.5)*TILE;P.x=fx;P.y=fy;P.stay=1;G.clock=t.DAY*.3;
     // (the fog's piece: the fog drawn, held still; you in the middle of land you remember, some 14 tiles round, the rest never seen)
     if(wide===2){const S=t.seenArr();S.fill(0);for(let y=-12;y<=12;y++)for(let x=-16;x<=16;x++){const u=at[0]+x,v=at[1]+y;if(u>=0&&v>=0&&u<t.MW&&v<t.MH&&x*x/256+y*y/144<=1+.15*Math.sin(x*.7+y))S[v*t.MW+u]=1}
      window.__rmV=t.reducedMotion;(0,eval)('drawWorldFog=__fog0;reducedMotion=()=>true;WFOGV=null')}
     const undo=setup&&PX.WN_MOUNT&&PX.WN_MOUNT.pool?setup():null;// (part 7: a kind put in for this piece alone)
     try{t.drawWorld();t.drawWorld()}finally{if(wide===2)(0,eval)('drawWorldFog=function(){};reducedMotion=__rmV')}
     const sx=Math.max(0,Math.min(t.cv.width-cw,Math.round(fx-G.cam.x-cw/2))),sy=Math.max(0,Math.min(t.cv.height-ch,Math.round(fy-G.cam.y-ch/2)));
     g.fillText(pn+' · '+(s?'normal '+s:t.WM.gen)+' ('+at[0]+', '+at[1]+')',X,Y+13);if(wide)g.drawImage(t.cv,0,0,t.VW,t.VH,X,Y+lab,cw*Z,ch*Z);else g.drawImage(t.cv,sx,sy,cw,ch,X,Y+lab,cw*Z,ch*Z);if(undo)undo();o.push('INFO '+pn+': '+(s?'normal '+s:t.WM.gen)+' '+at.join(', ')+' (at='+k+':'+s+':'+at.join(':')+')')}}
   for(const k of left){const c=k%per,r=(k/per)|0;g.fillStyle='#e8e0c8';g.font='13px Arial';g.fillText(PIECES[k][0]+' · none found',8+c*(cw*Z+8),8+r*(ch*Z+lab+8)+13);o.push('INFO '+PIECES[k][0]+': none found')}}
  finally{P.stay=stay;[window.txt,window.drawParties,window.drawBanners]=keep}o.push('PASS drawn ('+t.WM.gen+')');
 }catch(e){if(e!==0)o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.style.display='none';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
