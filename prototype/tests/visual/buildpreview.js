'use strict';
// Not a test: the world-map building redesign's checkpoint (engine/model.js), seen in the real game. On the classic world it stands
// the model samples (PX.MODEL_SAMPLES) in their 4 facings (front, left side, back, right side: PX.MODEL_YAWS) among the real map art
// at real places: open grass by a road, beside Ashford, a frost
// spot, a desert spot, a forest's edge; and towns laid out as towns are, natural through layout rather than turning: a straight
// street of house plots (compact rows wall to wall, a hamlet's loose yards, a lone cottage), a diagonal street (its plots stepping a
// tile at a time down the 45° road, each at its nearest straight facing, sheds and gardens in the triangles between), a street
// round a bend (the facings turning with it), a human town beside a dwarf one (the peoples' roofs), and a village made only of
// clusters (several small buildings to a cell: an inn, a market, a chapel, a smithy, a farmstead, a mill, a 64 px town quarter). Your band, a lord under
// his floating banner, townsfolk and a caravan stand among them for scale. Each is drawn by the game's own drawWorld at its normal
// zoom (1x; the fog lifted so the whole view shows) with a x3 crop of its middle, printed as "SHOT <name> <data URL>" lines
// (decode them into PNGs). The game itself still draws today's buildings.
//   ?only=grass,desert: just those (grass, ashford, frost, desert, forest, street, diagonal, curve, peoples, village)
window.RUN=()=>{const o=[],t=T,G=t.G,P=t.P,W=t.W,TL=16;
try{
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(4242);t.act('begin','soldier');G.quietEvents=true;G.mode='world';G.modal=false;t.hidePanel();
 (0,eval)('drawWorldFog=function(){}');// (the whole view as clear as your sight: the fog would dim what lies past it)
 const MW=t.MW,MH=t.MH,only=(new URLSearchParams(location.search).get('only')||'').split(',').filter(Boolean),YAWS=PX.MODEL_YAWS;
 const climOf=(x,y)=>t.climAt((x+.5)*TL,(y+.5)*TL),kind=(x,y)=>x<0||y<0||x>=MW||y>=MH?-1:t.tAt(x,y),isRoad=(x,y)=>kind(x,y)===t.T_ROAD;
 const siteAt=new Set(W.sites.map(s=>s.tx+','+s.ty));
 // a tile a building may stand on: open ground, nobody's lot or field, no site, not yet taken here
 let taken=new Set();
 const open=(x,y)=>kind(x,y)===t.T_OPEN&&t.occAt(x,y)===0&&!siteAt.has(x+','+y);
 const free=(x,y,n)=>{for(let j=-1;j<=n;j++)for(let i=-1;i<=n;i++){const X=x+i,Y=y+j,edge=i<0||j<0||i>=n||j>=n;if(taken.has(X+','+Y))return false;if(!edge&&!open(X,Y))return false}return true};
 const tight=(x,y,n)=>{for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(taken.has((x+i)+','+(y+j))||!open(x+i,y+j))return false;return true};// (no gap: wall to wall)
 const take=(x,y,n)=>{for(let j=0;j<n;j++)for(let i=0;i<n;i++)taken.add((x+i)+','+(y+j))};
 // the nearest free n x n cell to (ax, ay), ring by ring
 const near=(ax,ay,n,rmax)=>{for(let r=0;r<=(rmax||16);r++)for(let y=ay-r;y<=ay+r;y++)for(let x=ax-r;x<=ax+r;x++){if(Math.max(Math.abs(x-ax),Math.abs(y-ay))!==r)continue;if(free(x,y,n)){take(x,y,n);return[x,y]}}return null};
 const count=(x0,y0,r,f)=>{let c=0;for(let y=y0-r;y<=y0+r;y++)for(let x=x0-r;x<=x0+r;x++)if(f(x,y))c++;return c};
 const farTowns=(x,y,d)=>t.TOWNS.every(z=>Math.hypot(z.tx-x,z.ty-y)>d);
 // the best tile for a place: the highest score over the map (a coarse sweep)
 const best=score=>{let b=null,bs=-1e9;for(let y=8;y<MH-8;y+=2)for(let x=12;x<MW-12;x+=2){const s=score(x,y);if(s>bs){bs=s;b=[x,y]}}return b};
 const spots={
  grass:()=>best((x,y)=>climOf(x,y)!=='grass'||!farTowns(x,y,9)||!count(x,y,1,isRoad)?-1e9:count(x,y,6,open)+3*Math.min(10,count(x,y,9,(a,b)=>kind(a,b)===t.T_FOREST))),
  ashford:()=>{const z=t.townBy('Ashford');return[z.tx,z.ty+2]},
  frost:()=>best((x,y)=>climOf(x,y)!=='frost'||!farTowns(x,y,7)?-1e9:count(x,y,6,open)+2*Math.min(12,count(x,y,9,(a,b)=>kind(a,b)===t.T_FOREST))+(count(x,y,3,isRoad)?20:0)),
  desert:()=>best((x,y)=>climOf(x,y)!=='desert'||!farTowns(x,y,7)?-1e9:count(x,y,6,open)+(count(x,y,3,isRoad)?20:0)+Math.min(8,count(x,y,9,(a,b)=>kind(a,b)===t.T_HILL||kind(a,b)===t.T_MOUNT))),
  forest:()=>best((x,y)=>climOf(x,y)!=='grass'||!farTowns(x,y,9)||!open(x,y)?-1e9:Math.min(60,count(x,y,5,open))+Math.min(40,count(x,y,5,(a,b)=>kind(a,b)===t.T_FOREST))*1.5-(count(x,y,7,(a,b)=>kind(a,b)===t.T_FOREST)>110?50:0))
 };
 // a diagonal stretch of road: followed tile by tile (a step across or a step down, never more than 2 the same way running), in
 // one climate, as far across as down; the longest
 const diag=()=>{let bestR=null;for(let y=4;y<MH-16;y++)for(let x=4;x<MW-16;x++){if(!isRoad(x,y)||!farTowns(x,y,6))continue;const c0=climOf(x,y);
   for(const d of [1,-1]){const path=[[x,y]];let cx=x,cy=y,run=0,way=0;for(let k=0;k<40;k++){const ax=isRoad(cx+d,cy)&&climOf(cx+d,cy)===c0,dn=isRoad(cx,cy+1)&&climOf(cx,cy+1)===c0;
       const go=ax&&dn?(way===1&&run>=1?2:1):ax?1:dn?2:0;if(!go)break;run=go===way?run+1:1;way=go;if(run>2)break;if(go===1)cx+=d;else cy++;path.push([cx,cy])}
     const w=Math.abs(cx-x),h=cy-y,m=Math.min(w,h)+(c0==='grass'?3:0)+count(cx,cy,5,open)/20;if(w>=5&&h>=5&&(!bestR||m>bestR.m))bestR={x,y,d,path,m,c0}}}return bestR};
 // a bend: a straight run of road across (5 tiles or more) turning into a straight run up or down (5 or more), in the grass
 const bend=()=>{let bestB=null;for(let y=6;y<MH-12;y++)for(let x=8;x<MW-8;x++){if(!isRoad(x,y)||climOf(x,y)!=='grass'||!farTowns(x,y,6))continue;
   for(const hx of [1,-1])for(const vy of [1,-1]){let a=0,b=0;while(a<9&&isRoad(x+hx*(a+1),y)&&!isRoad(x+hx*(a+1),y+vy))a++;while(b<9&&isRoad(x,y+vy*(b+1))&&!isRoad(x+hx,y+vy*(b+1)))b++;if(a<5||b<5)continue;
     const s=Math.min(a,b)*3+count(x+hx*3,y+vy*3,5,open)+count(x+hx*3,y-vy*2,3,open)+count(x-hx*2,y+vy*3,3,open);if(!bestB||s>bestB.s){const path=[];for(let i=a;i>0;i--)path.push([x+hx*i,y]);path.push([x,y]);for(let i=1;i<=b;i++)path.push([x,y+vy*i]);bestB={x,y,s,path}}}}return bestB};
 // what stands at each place: [sample, facings]
 const PLAN={grass:[['cottage',YAWS],['house',YAWS],['farmhouse',YAWS]],ashford:[['inn',YAWS],['chapel',YAWS],['cottage',YAWS]],frost:[['frost',YAWS],['chapel',[0,2]],['inn',[4,6]]],
  desert:[['desert',YAWS],['house',[0,6]]],forest:[['cottage',YAWS],['farmhouse',[0,2]],['house',YAWS],['yard_a',[0,6]]]};
 const OLD={cottage:'cottage',house:'townhouse',frost:'cottage',desert:'cottage',farmhouse:'longhouse',inn:'tavern',chapel:'church',yard_a:'longhouse'};
 // the buildings in the game's layers (structures.js lotEnts, called before anything standing is drawn): first every one's flat
 // ground, then every shadow laid into one mask and shaded once (neighbours' shadows merge, none covered by another's sprite), then
 // the standing sprites among the holdings', each by its front edge
 let BLD=[];const lot0=t.lotEnts,SM=document.createElement('canvas');window.__lotEnts0=lot0;
 window.__lotEnts=function(ents,cam,V){lot0(ents,cam,V);const g=t.ctx,at=b=>[b.x*TL-cam.x,(b.y+b.n)*TL-b.s.img.height-cam.y];
   for(const b of BLD)if(b.s.ground)g.drawImage(b.s.ground,...at(b));
   SM.width=t.VW;SM.height=t.VH;const sg=SM.getContext('2d', { willReadFrequently: true });let any=false;for(const b of BLD){if(b.s.shade){sg.drawImage(b.s.shadow,...at(b));any=true}else g.drawImage(b.s.shadow,...at(b))}
   if(any){g.globalAlpha=PX.MODEL_SHADE;g.drawImage(SM,0,0);g.globalAlpha=1}
   for(const b of BLD)ents.push({y:(b.y+b.n)*TL-1,f:()=>g.drawImage(b.s.img,...at(b))})};
 (0,eval)('lotEnts=window.__lotEnts');
 let msSum=0,msN=0;
 const model=(name,yaw,seed,env,people)=>{const sp=PX.modelSample(name,{yaw,seed,people});if(env==='frost')sp.snow=true;const b=PX.model(sp);msSum+=b.ms;msN++;return b};
 // the figures: you at the middle, a lord and his banner, a caravan, townsfolk round you (everyone within your sight), each on an
 // open tile no building stands on (out of the woods: a party there hides)
 const spotNear=(tx,ty,dx,dy,used)=>{for(let r=0;r<6;r++)for(let y=ty+dy-r;y<=ty+dy+r;y++)for(let x=tx+dx-r;x<=tx+dx+r;x++){const k=x+','+y;if(!taken.has(k)&&!used.has(k)&&(kind(x,y)===t.T_OPEN||isRoad(x,y))){
        used.add(k);return[(x+.5)*TL,(y+.8)*TL]}}return[(tx+dx+.5)*TL,(ty+dy+.8)*TL]};
 const cast=(tx,ty)=>{const used=new Set();[P.x,P.y]=spotNear(tx,ty,0,0,used);P.gear.mount=null;W.monsters=[];W.critters=[];t.bandits.length=0;W.refugees=[];
   W.lords.forEach(l=>{l.x=-999});const L=W.lords.find(l=>!l.dead),lp=spotNear(tx,ty,3,1,used);if(L)Object.assign(L,{inside:null,dead:false,x:lp[0],y:lp[1],state:'march'});
   W.caravans=[];for(const tw of t.TOWNS){for(let i=0;i<3&&!W.caravans.length;i++)t.sendCaravan(tw);if(W.caravans.length)break}W.caravans.slice(1).forEach(c=>{c.x=-999});if(W.caravans[0])[W.caravans[0].x,W.caravans[0].y]=spotNear(tx,ty,-3,2,used);
   if(!W.folk.length)for(let i=0;i<240;i++)t.updateFolk(.05);W.folk.forEach((f,i)=>{if(i<5)[f.x,f.y]=spotNear(tx,ty,-2+i,-2-(i%2),used);else f.x=-999})};
 const shots=[];
 const snap=(name,fx,fy)=>{G.clock=t.DAY*.3;t.drawWorld();t.drawWorld();shots.push(['SHOT '+name,t.cv.toDataURL('image/png')]);crop(name+'_x3',fx,fy)};
 // x3: a third of the view round (fx, fy) (the place's buildings), from the frame just drawn
 const crop=(name,fx,fy)=>{const cv=t.cv,c=document.createElement('canvas');c.width=cv.width;c.height=cv.height;const g=c.getContext('2d', { willReadFrequently: true });g.imageSmoothingEnabled=false;
   const w=Math.round(cv.width/3),h=Math.round(cv.height/3),sx=Math.max(0,Math.min(cv.width-w,Math.round(fx-G.cam.x-w/2))),sy=Math.max(0,Math.min(cv.height-h,Math.round(fy-G.cam.y-h/2)));
   g.drawImage(cv,sx,sy,w,h,0,0,w*3,h*3);shots.push(['SHOT '+name,c.toDataURL('image/png')])};
 const mid=lay=>[lay.reduce((a,b)=>a+(b.x+b.n/2)*TL,0)/Math.max(1,lay.length),lay.reduce((a,b)=>a+(b.y+b.n/2)*TL,0)/Math.max(1,lay.length)];
 const show=(name,lay,env,fx,fy,people)=>{BLD=lay.map(b=>Object.assign({},b,{s:model(b.s0,b.yaw,b.seed,env,b.people||people)}));snap(name,fx,fy)};
 // one place: its buildings laid out round its anchor (largest first), the cast round you, drawn new (and old)
 const scene=(name,anchor,items,pair)=>{taken=new Set();const [ax,ay]=anchor,lay=[];let sd=1;
   const list=[];for(const [s,yaws] of items)for(const y of yaws)list.push([s,y]);list.sort((a,b)=>PX.modelSample(b[0]).cell-PX.modelSample(a[0]).cell);
   for(const [s,yaw] of list){const n=PX.modelSample(s).cell/TL,at=near(ax,ay,n,18);if(at)lay.push({s0:s,yaw,x:at[0],y:at[1],n,seed:sd++})}
   const env=climOf(ax,ay),[cx,cy]=mid(lay);cast(Math.floor(cx/TL),Math.floor(cy/TL));show(name,lay,env,cx,cy);
   o.push('INFO '+name+': '+lay.length+' buildings round tile '+ax+','+ay+' ('+env+')')};
 const want=k=>!only.length||only.includes(k);
 for(const k of ['grass','ashford','frost','desert','forest']){if(!want(k))continue;const a=spots[k]();if(!a){o.push('INFO no place found for '+k);continue}scene(k,a,PLAN[k])}// (no old-and-new pair: the old art retired at stage 3)
 /* a street's frontage: along a road (its tiles in order) house plots (2 x 2 tiles) touching it and each other, each facing the
    road at its nearest straight facing (the plot's side with the most road along it: south yaw 0, west yaw 2, north yaw 4, east
    yaw 6); then the gaps a plot leaves by the road (the triangles of a diagonal street, a bend's corner) filled with sheds,
    gardens and cottages, each facing the road too */
 const facing=(x,y,n)=>{let c=[0,0,0,0];for(let i=0;i<n;i++){if(isRoad(x+i,y+n))c[0]++;if(isRoad(x-1,y+i))c[1]++;if(isRoad(x+i,y-1))c[2]++;if(isRoad(x+n,y+i))c[3]++}
   const k=[0,1,3,2].reduce((a,b)=>c[b]>c[a]?b:a,0);return c[k]?YAWS[k]:0};
 const frontage=(path,plots,fill)=>{const lay=[];let k=0,sd=1;
   for(const [rx,ry] of path)for(const [x,y] of [[rx-1,ry+1],[rx,ry+1],[rx-1,ry-2],[rx,ry-2],[rx-2,ry-1],[rx-2,ry],[rx+1,ry-1],[rx+1,ry]])if(tight(x,y,2)){take(x,y,2);lay.push({s0:plots[k++%plots.length],yaw:facing(x,y,2),x,y,n:2,seed:sd++})}
   let f=0;for(const [rx,ry] of path)for(const [x,y] of [[rx,ry+1],[rx,ry-1],[rx-1,ry],[rx+1,ry]])if(tight(x,y,1)&&lay.some(b=>x>=b.x-1&&x<=b.x+b.n&&y>=b.y-1&&y<=b.y+b.n)){take(x,y,1);lay.push({s0:fill[f++%fill.length],yaw:facing(x,y,1),x,y,n:1,seed:sd++})}
   return lay};
 const ROWS=['row_a','row_b','row_c','row_d'];
 const dwellings=lay=>{for(const b of BLD.filter(b=>b.s.dwellings&&b.s.dwellings.length).slice(0,4))o.push('INFO   '+b.s0+' facing '+b.yaw+': '+b.s.dwellings.map(d=>d.kind+' '+(d.footprint.u[1]-d.footprint.u[0])+'x'+(d.footprint.v[1]-d.footprint.v[0])+(d.storeys>1?' '+d.storeys+' storeys':'')+', '+d.area+' px, '+d.windows.length+' windows seen, door '+(d.door&&d.door.seen?'seen':'hidden')).join('; '))};
 // a straight street: compact plots along it on both sides, a hamlet's yards and a lone cottage beside it
 if(want('street')){taken=new Set();
   const row=(x,y,n)=>{for(let k=0;k<n;k++)for(let j=0;j<2;j++)for(let i=0;i<2;i++)if(!open(x+2*k+i,y+j))return false;return true};
   let S0=null,bs=-1;for(let y=8;y<MH-8;y++)for(let x=8;x<MW-16;x++){if(climOf(x,y)!=='grass'||!farTowns(x,y,4))continue;let k=0;while(k<10&&isRoad(x+k,y))k++;if(k<8||!row(x,y-2,4))continue;
     const s=(row(x,y+1,3)?10:0)+count(x+4,y,6,open);if(s>bs){bs=s;S0=[x,y]}}
   if(!S0)o.push('INFO no straight road for the street');else{const [sx,sy]=S0,lay=frontage(Array.from({length:8},(_,i)=>[sx+i,sy]),ROWS,['shed','garden']);
     for(const [s0,yaw,dx,dy] of [['yard_a',0,10,-3],['yard_b',6,11,1],['cottage',0,-3,-2]]){const n=PX.modelSample(s0).cell/TL,at=near(sx+dx,sy+dy,n,8);if(at)lay.push({s0,yaw,x:at[0],y:at[1],n,seed:lay.length+3})}
     cast(sx+4,sy);show('street',lay,'grass',(sx+5)*TL,(sy+.5)*TL);{const ya=lay.find(b=>b.s0==='yard_a');if(ya)crop('street_hamlet_x3',(ya.x+1.5)*TL,(ya.y+1.5)*TL)}
     o.push('INFO street: '+lay.length+' pieces along the road from tile '+sx+','+sy);dwellings()}}
 // a diagonal street: the plots step a tile at a time down the 45° road, each at its nearest straight facing
 if(want('diagonal')){const R=diag();if(!R)o.push('INFO no diagonal road found');else{taken=new Set();const lay=frontage(R.path,ROWS,['shed','garden','cottage','house']),m=R.path[R.path.length>>1];
   cast(m[0],m[1]);show('diagonal_street',lay,R.c0,(m[0]+.5)*TL,(m[1]+.5)*TL);
   o.push('INFO diagonal street: '+lay.length+' pieces ('+lay.filter(b=>b.n>1).length+' plots) along '+R.path.length+' tiles of road from tile '+R.x+','+R.y+' ('+R.c0+'), facings '+[...new Set(lay.map(b=>b.yaw))].join(', '))}}
 // a street round a bend: the facings turn with the road
 if(want('curve')){const B=bend();if(!B)o.push('INFO no bend found');else{taken=new Set();const lay=frontage(B.path,ROWS,['shed','cottage','garden','house']);
   cast(B.x,B.y);show('curve_street',lay,'grass',(B.x+.5)*TL,(B.y+.5)*TL);
   o.push('INFO curve street: '+lay.length+' pieces ('+lay.filter(b=>b.n>1).length+' plots) round the bend at tile '+B.x+','+B.y+', facings '+[...new Set(lay.map(b=>b.yaw))].join(', '))}}
 // two towns side by side, the same plots: humans' (tile and thatch) and dwarves' (slate), each two rows of plots facing a lane
 if(want('peoples')){taken=new Set();const blockOk=(x,y)=>{for(let j=0;j<5;j++)for(let i=0;i<14;i++)if(!open(x+i,y+j))return false;return true};
   const a=best((x,y)=>climOf(x,y)!=='grass'||!farTowns(x,y,6)||!blockOk(x-7,y-2)?-1e9:count(x,y,8,open)+(count(x,y,4,isRoad)?15:0));
   if(!a)o.push('INFO no room for two towns');else{const [ax,ay]=a,lay=[];let sd=1;
     for(const [pp,x0] of [['human',ax-7],['dwarf',ax+1]]){for(let k=0;k<3;k++){lay.push({s0:ROWS[(k+sd)%4],yaw:0,x:x0+2*k,y:ay-2,n:2,seed:sd++,people:pp});lay.push({s0:ROWS[(k+sd+1)%4],yaw:4,x:x0+2*k,y:ay+1,n:2,seed:sd++,people:pp})}}
     lay.forEach(b=>take(b.x,b.y,2));cast(ax,ay);show('peoples',lay,'grass',ax*TL,(ay+.5)*TL);o.push('INFO peoples: a human town (left) and a dwarf town (right) at tile '+ax+','+ay)}}
 // a small village made only of clusters (model.js PX.MODEL_CLUSTERS): a town quarter (64), an inn, a market, a chapel, a smithy, a
 // farmstead and a mill (32), gathered round the village's middle, each facing it at its nearest straight facing
 if(want('village')){taken=new Set();const a=best((x,y)=>climOf(x,y)!=='grass'||!farTowns(x,y,8)?-1e9:count(x,y,7,open)+(count(x,y,2,isRoad)?25:0));
   if(!a)o.push('INFO no room for the village');else{const [ax,ay]=a,lay=[];let sd=1;
     for(const s0 of ['quarter','inn_yard','market','chapel_yard','smithy','farmstead','mill']){const n=PX.modelSample(s0).cell/TL,at=near(ax,ay,n,12);if(!at)continue;
       const cx=at[0]+n/2-ax-.5,cy=at[1]+n/2-ay-.5,yaw=Math.abs(cx)>Math.abs(cy)?(cx>0?2:6):(cy>0?4:0);lay.push({s0,yaw,x:at[0],y:at[1],n,seed:sd++})}
     const [mx,my]=mid(lay);cast(Math.floor(mx/TL),Math.floor(my/TL));show('village',lay,'grass',mx,my);
     o.push('INFO village: '+lay.map(b=>b.s0+' facing '+b.yaw).join(', ')+' round tile '+ax+','+ay);
     for(const b of BLD)o.push('INFO   '+b.s0+' ('+b.s.role+'): '+b.s.buildings.map(d=>d.kind+'/'+d.role+' '+d.area+' px'+(d.door&&d.door.seen?', door seen':'')).join('; '))}}
 BLD=[];(0,eval)('lotEnts=window.__lotEnts0');
 o.push('INFO '+msN+' models, '+(msSum/Math.max(1,msN)).toFixed(2)+' ms each');
 for(const [k,v] of shots)o.push(k+' '+v);
 o.push('PASS buildpreview: '+shots.length+' pictures');
}catch(e){o.push('EXC '+e.message+'\n'+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.join('\n');document.body.appendChild(d)};
