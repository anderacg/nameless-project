'use strict';
// Towns of models (the world-map building redesign, stage 3: engine/buildmodels.js on the world map, the owner's scale): every lot
// its model's cell (houses 32 px, estates 32 or 64, centres 64 by tier, a city's 128; nothing of 16 but objects); the culture
// from the realm a holding was founded under (lots.js FAC_CULTURE: vale, karn, sylvan, the Horde's ashgor, the Salt League's
// league), kept when another takes it; the households (2-4 a house) give the room the houses gave; each lot facing its street;
// the yards painted into the land (gfx/worldart.js townGround) with no square patch round any building; the estates' flat ground
// none under their buildings; sites and camps their models, fires and flags; no old hand-drawn art loaded.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,PX=t.PX,TL=t.TILE,MW=t.MW;Kit.fresh();t.act('begin','soldier');G.quietEvents=true;const TW=t.TOWNS;
 // ---- sizes
 {const S=PX.MODEL_SIZES,bad=[],by={};
  for(const z of TW)for(const l of z.lots){const m=t.lotModel(z,l),k=l.k==='centre'?'centre '+z.kind:l.k==='house'?'house':'estate';(by[k]=by[k]||new Set()).add(m.cell);
   if(m.cell!==l.n*TL||m.img.width!==m.cell)bad.push(z.name+' '+l.k+' '+l.type+' '+m.cell+' on '+l.n+' tiles');
   if(l.k==='house'&&m.cell!==32||ESTATES_SIZE(l)&&![32,64].includes(m.cell)||l.k==='centre'&&m.cell!==(z.kind==='city'?128:64))bad.push(z.name+' '+l.k+' '+l.type+' at '+m.cell+' px')}
  function ESTATES_SIZE(l){return !!t.ESTATES[l.k]}
  ok(!bad.length,'every building at the owner\'s scale, on its own cell: '+Object.entries(by).map(([k,s])=>k+' '+[...s].sort((a,b)=>a-b).join('/')).join(', ')+(bad.length?': '+bad.slice(0,6).join('; '):''))}
 // ---- culture by the founding realm, not the owner
 {const bad=TW.filter(z=>t.holdingCulture(z)!==({vale:'vale',karn:'karn',sylvan:'sylvan',horde:'ashgor',salt:'league'})[t.HOME[z.name]]),cs=new Set(TW.map(t.holdingCulture));
  ok(!bad.length&&cs.size===5,'each holding builds in its founding realm\'s culture (vale, karn, sylvan, the Horde\'s ashgor, the Salt League\'s league: '+[...cs].join(', ')+')'+(bad.length?': not '+bad.map(z=>z.name).join(', '):''));
  const z=TW.find(q=>t.HOME[q.name]==='karn'),c=t.lotCentre(z),o0=z.owner,cu0=t.lotModel(z,c).culture;
  try{z.owner='horde';c._s=null;const cu1=t.lotModel(z,c).culture,s1=t.lotSprite(z,c);ok(cu0==='karn'&&cu1==='karn'&&s1.width===c.n*TL,'a captured holding keeps its builders\' culture ('+z.name+', taken by the Horde: '+cu1+'); its owner flies the banners')}finally{z.owner=o0;c._s=null}}
 // ---- households
 {const H=t.HOUSING,bad=[],room=[];let hh=0,nh=0;
  for(const z of TW){let s=0;for(const l of z.lots){if(l.st!=='built')continue;if(l.k==='house'){const n=t.lotHouseholds(z,l);hh+=n;nh++;s+=n*H.household;if(n<2||n>4)bad.push(z.name+' '+l.type+' '+n)}else if(l.k==='centre')s+=H.centre[l.type]||0}
   if(s!==t.housing(z))bad.push(z.name+' counts '+t.housing(z)+' for '+s);if(t.housing(z)<z.pop)room.push(z.name)}
  ok(!bad.length&&!room.length,'the houses count households (2-4 a house, '+H.household+' people each; '+nh+' houses, '+hh+' households), the centres their own room, and every holding starts with room for its people'+(bad.length?': '+bad.slice(0,6).join('; '):'')+(room.length?'; short: '+room.join(', '):''))}
 // ---- facing the street
 {let n=0,good=0,est=0,eg=0,rk=0,rg=0;const off=[];
  for(const z of TW)for(const l of z.lots){if(l.k==='centre'){if(l.yaw)off.push(z.name+' centre');continue}
   if(![0,2,4,6].includes(l.yaw)){off.push(z.name+' '+l.k+' yaw '+l.yaw);continue}
   // (a mine or a quarry with rock to one side: its back to it, lots.js rockYaw; workplaces)
   {const ry=t.rockYaw(l);if(ry!=null){rk++;if(ry===l.yaw)rg++;continue}}
   // (an outer estate's own track, come to its building (the first of its tiles and fields beside the track's end, south, west,
   // east, north, one of the building's; not to its fields): lots.js estTrack)
   const own=(x,y)=>x>=l.x&&x<l.x+l.n&&y>=l.y&&y<l.y+l.n,mine=(x,y)=>own(x,y)||(l.plots||[]).some(p=>p[0]===x&&p[1]===y),
    tr=t.ESTATES[l.k]&&!t.INNER.includes(l.k)&&t.WM.roads.find(r=>r.est===z.name&&(e=>{const ex=e%MW,ey=(e-ex)/MW,o=[[0,1],[-1,0],[1,0],[0,-1]].find(([a,b])=>mine(ex+a,ey+b));return !!o&&own(ex+o[0],ey+o[1])})(r.path[r.path.length-1]));
   if(tr){est++;const e=tr.path[tr.path.length-1];if(t.faceTo(l,e%MW+.5,(e-e%MW)/MW+.5)===l.yaw)eg++;continue}
   if(l.k==='port')continue;n++;
   // (its nearest road tile now, as lotYaw looks; a track laid after it was built may have come nearer)
   let best=null,bd=1e9;for(let y=l.y-t.LOT_FACE;y<l.y+l.n+t.LOT_FACE;y++)for(let x=l.x-t.LOT_FACE;x<l.x+l.n+t.LOT_FACE;x++){if(t.tAt(x,y)!==t.T_ROAD)continue;const d=Math.hypot(x+.5-l.x-l.n/2,y+.5-l.y-l.n/2);if(d<bd){bd=d;best=[x+.5,y+.5]}}
   if((best?t.faceTo(l,best[0],best[1]):t.faceTo(l,z.tx+.5,z.ty+1.5))===l.yaw)good++}
  ok(!off.length&&good>=n*.85&&eg>=est*.9&&rg===rk,'each building faces its street (S 0, W 2, N 4, E 6; the centres straight on): '+good+' of '+n+' to their nearest road or track (the rest built before a track came nearer), '+eg+' of '+est+' outer estates to the track laid to them (a track ending by two counted for both), '+rg+' of '+rk+' mines and quarries their backs to the rock'+(off.length?': '+off.slice(0,5).join(', '):''))}
 // ---- the yards painted into the land: no square patch round any building
 {const pick=['city','town','village','castle'].map(k=>TW.find(z=>z.kind===k)),L=(a,o)=>a[o]*.3+a[o+1]*.59+a[o+2]*.11,keep=window.townGround,runs=[],ring=[];let cells=0,yard=0;
  for(const z of pick){const b={x0:Math.min(...z.lots.map(l=>l.x)),y0:Math.min(...z.lots.map(l=>l.y)),x1:Math.max(...z.lots.map(l=>l.x+l.n-1)),y1:Math.max(...z.lots.map(l=>l.y+l.n-1))},X=(b.x0-3)*TL,Y=(b.y0-3)*TL,w=(b.x1-b.x0+7)*TL,h=(b.y1-b.y0+7)*TL,paint=()=>{const c=document.createElement('canvas');c.width=w;c.height=h;t.runGen(t.paintSteps(t.WorldArt.ensure(),X,Y,w,h,c.getContext('2d', { willReadFrequently: true }),0,0,{}));return c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,w,h).data};
   const d=paint();let r;try{window.townGround=function*(){};r=paint()}finally{window.townGround=keep}
   for(const l of z.lots){cells++;const x0=l.x*TL-X,y0=l.y*TL-Y,N=l.n*TL;let worst=0,diff=0;
    for(let y=y0;y<y0+N;y++)for(let x=x0;x<x0+N;x++){const o=(y*w+x)*4;if(Math.abs(d[o]-r[o])+Math.abs(d[o+1]-r[o+1])+Math.abs(d[o+2]-r[o+2])>6)diff++}if(diff>N)yard++;
    // (along each edge of its cell and 3 px in, any run of 8 px or more across which the yard alone makes a step of light)
    const scan=(len,at)=>{let run=0,sg=0;for(let s=0;s<len;s++){const q=at(s);if(!q){run=0;continue}const dl=L(d,q[0])-L(d,q[1]),dr=L(r,q[0])-L(r,q[1]),zz=Math.abs(dl)>14&&Math.abs(dl-dr)>14?Math.sign(dl):0;if(zz&&zz===sg)run++;else run=zz?1:0;sg=zz;if(run>worst)worst=run}};
    const P2=(x,y)=>(y*w+x)*4,inW=(x,y)=>x>=1&&y>=1&&x<w&&y<h;
    for(const k of [0,1,2,3])for(const [xx,dir] of [[x0+k,1],[x0+N-1-k,-1]])scan(N+16,s=>{const y=y0-8+s;return inW(xx,y)&&inW(xx-dir,y)?[P2(xx,y),P2(xx-dir,y)]:null});
    for(const k of [0,1,2,3])for(const [yy,dir] of [[y0+k,1],[y0+N-1-k,-1]])scan(N+16,s=>{const x=x0-8+s;return inW(x,yy)&&inW(x,yy-dir)?[P2(x,yy),P2(x,yy-dir)]:null});
    runs.push(worst)}
   // (the land's colour just round the town's yards: the yard taken into the land there (its edge), not a patch of another colour)
   let A=[0,0,0],B=[0,0,0],n=0;for(const l of z.lots){const x0=l.x*TL-X,y0=l.y*TL-Y,N=l.n*TL;for(let s=0;s<N;s++)for(const [x,y] of [[x0+s,y0],[x0+s,y0+N-1],[x0,y0+s],[x0+N-1,y0+s]]){const o=(y*w+x)*4;for(let c=0;c<3;c++){A[c]+=d[o+c];B[c]+=r[o+c]}n++}}
   ring.push(n?Math.hypot(A[0]-B[0],A[1]-B[1],A[2]-B[2])/n:0)}
  ok(yard>=cells*.9,'the yards are painted into the land under the buildings ('+yard+' of '+cells+' cells of a city, a town, a village and a castle)');
  ok(Math.max(...runs)<8&&ring.every(v=>v<24),'no square patch round any building on the world map: no straight run of the yard\'s along a cell\'s edges (the longest '+Math.max(...runs)+' px), the cells\' rims near the land\'s colour (within '+Math.round(Math.max(...ring))+')')}
 // ---- a lot placed paints its ground again; the estates' flat ground has nothing under their buildings
 {const z=TW.find(q=>q.kind==='town'),l=z.lots.find(q=>q.k==='house'),cx=Math.floor(l.x*TL/t.CHUNK),cy=Math.floor(l.y*TL/t.CHUNK),k=cy*t.WorldArt.cols+cx;t.WorldArt.chunk(cx,cy);const had=t.WorldArt.chunks.has(k);
  t.relot(l);ok(had&&!t.WorldArt.chunks.has(k),'a lot placed, taken away or changed has its chunk painted again (WorldArt relot): its yard follows it')}
 {const bad=[];let n=0;for(const z of TW)for(const l of z.lots){const lv=t.bldLv(z,l.k);if(!t.ESTATES[l.k]||!lv)continue;const g=t.estateGround(z,l.k,lv);if(!g)continue;n++;const d=g.getContext('2d', { willReadFrequently: true }).getImageData(0,0,g.width,g.height).data,pr=l.k==='port'&&t.pierOf(z);let px=0;
   for(let y=l.y*TL;y<(l.y+l.n)*TL;y++)for(let x=l.x*TL;x<(l.x+l.n)*TL;x++){const u=x-g.x,v=y-g.y;if(u<0||v<0||u>=g.width||v>=g.height)continue;if(pr&&Math.hypot(x-pr.x,y-pr.y)<40)continue;if(d[(v*g.width+u)*4+3])px++}
   if(px)bad.push(z.name+' '+l.k+' '+px+' px')}
  ok(n>20&&!bad.length,'the estates\' flat ground ('+n+') lays nothing under their buildings: no square of soil or logs, the model\'s yard is theirs'+(bad.length?': '+bad.slice(0,5).join('; '):''))}
 // ---- sites and camps: their models, their fires and flags
 {const want={cave:32,ruins:32,shrine:16,camp:32,hideout:64,travelers:32},bad=[],seen=new Set();
  for(const s of W.sites){const sp=t.siteSprite(s),N=want[s.type];seen.add(s.type);if(sp.width!==N||!sp.gr||!sp.sh)bad.push(s.type+' '+sp.width);if(['camp','hideout','travelers'].includes(s.type)&&(!sp.fire||!sp.flag))bad.push(s.type+' fire/flag')}
  ok(!bad.length&&seen.size>=5,'every site and camp its model ('+[...seen].map(k=>k+' '+want[k]).join(', ')+' px), its yard and shadow, a camp\'s fire (its flame at marks.fire) and flag'+(bad.length?': '+bad.slice(0,6).join('; '):''))}
 // ---- the old hand-drawn art retired
 {const scripts=[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
  ok(!PX.building&&!PX.site&&!PX.camp&&!PX.prop&&!PX.part&&!scripts.some(s=>/engine\/buildings\.js/.test(s)),'no old art loaded: engine/buildings.js retired (no PX.building, PX.site, PX.camp, PX.prop or PX.part), the pier and the flame kept (pieces.js)')}
 // ---- drawn: the world at a city, at whole pixels, its buildings and sites
 // (cold: no model made, no chunk painted; the first view makes its chunks and its models at once; then frames)
 {const z=TW.reduce((a,q)=>q.lots.length>a.lots.length?q:a),M=()=>TW.reduce((a,q)=>a+q.lots.filter(l=>l._s).length,0);P.x=z.x;P.y=z.y+30;G.mode='world';G.modal=false;t.hidePanel();
  PX.modelCacheClear();for(const q of TW)for(const l of q.lots){l._s=null;l._gimg=null}t.WorldArt.invalidate();
  const t0=performance.now();t.drawWorld();const first=performance.now()-t0,made=M();let ms=0;for(let i=0;i<10;i++){const a=performance.now();t.drawWorld();ms+=performance.now()-a}
  info('the biggest holding ('+z.name+', a '+z.kind+' of '+z.lots.length+' buildings), cold: its first view drawn in '+first.toFixed(0)+' ms (its chunks painted and '+made+' models made then), then '+(ms/10).toFixed(1)+' ms a frame')}
});
