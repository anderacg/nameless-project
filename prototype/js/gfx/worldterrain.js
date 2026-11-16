'use strict';
/* ---------- the world map's terrain at the scene's finer resolution (doc/OPEN_WORLD_DESIGN.md phase 1 step 2 and phase 2; the owner,
   2026-11-15: "go with all ... adding height, sea level that labs can do, and migrate them into the world generator"): the world
   lab's ground (engine/worldlab.js) on the world's own tiles, climates and relief (worldgen.js reliefOf, the map's lv), a chunk at a
   time (worldart.js paintSteps, when a chunk is painted fine: terrainChunk). Everything stands where the map says it does: each px
   shows its own place's ground; where the land steps down (stepped where it is steep: WORLD_TERRAIN.steps) the face of that step
   (earth, or rock with a ledge at every level, snow on a high lip; a fall where water steps down) hangs over the strip south of
   the edge, WORLD_TERRAIN.lh px a level, as the lab's terraces look; gentle ground is shaded by its slope, not stepped. The sea's
   water by its depth under the sea's level, its bed showing in the shallows; a river's murkier; the frost's shallows frozen. The
   shore's wet sand, beach and dunes; a river's muddy bank; rock and scree, then snow, up the heights. What lies over the ground
   (roads, yards, fords, trampled patches, the passes over it: bridges and the like) is the game's own painting, its px r x r ---------- */

// the lab's grounds by climate (its COL and CLIMATE_COL; the battle map's PX.GROUND_PAL where it has them), made once
let TPAL=null;
function terrainPal(){if(TPAL)return TPAL;const GP=PX.GROUND_PAL,hx=c=>[parseInt(c.slice(1,3),16),parseInt(c.slice(3,5),16),parseInt(c.slice(5,7),16)],gp=(c,k)=>GP[c][k].map(hx);
  const base={grass:gp('grass','base'),meadow:[[92,138,60],[108,152,68],[126,166,80]],wood:[[52,84,40],[60,94,44],[70,104,50]],sand:[[222,204,150],[232,216,166],[240,226,180]],
    wet:[[188,168,120],[198,178,128]],dune:[[204,190,128],[180,176,112]],rock:GP.grass.rock.c.map(hx),snow:[[226,232,240],[240,244,250],[250,252,255]],face:gp('grass','face'),
    bank:[[120,98,66],[98,80,56],[78,64,46]],lip:[70,104,48],sea:[[150,212,204],[90,170,190],[52,118,170],[30,72,128]],bed:[[214,196,146],[196,178,128]],
    river:[[150,196,184],[116,160,150],[90,130,124],[78,114,112]],pebble:[[150,140,118],[122,114,98],[170,160,136],[104,98,86]],mud:[[104,96,62],[86,80,52]],
    scree:[[150,148,138],[118,116,110]],foam:[236,244,246],fall:[[236,244,248],[182,216,232],[134,180,208]],cool:[60,84,64],ice:[[198,222,234],[184,212,228],[214,234,242]]};
  const over={grass:{},
    desert:{grass:[[214,184,128],[224,196,140],[204,174,120]],meadow:[[196,152,104],[206,164,114],[186,142,96]],wood:[[188,160,108],[176,148,98],[198,170,116]],
      rock:GP.desert.rock.c.map(hx),face:gp('desert','face'),scree:[[184,138,98],[154,110,78]],bank:[[156,120,78],[132,98,62],[106,78,52]],lip:[200,176,122],
      sea:[[130,214,206],[74,180,194],[46,126,170],[28,80,132]],river:[[146,200,190],[98,160,164],[74,130,140],[56,104,112]],cool:[176,124,84]},
    frost:{grass:[[138,146,112],[152,158,122],[126,134,104]],meadow:[[222,230,240],[236,242,250],[208,218,232]],wood:[[214,222,234],[228,236,246],[198,208,224]],
      sand:[[176,176,168],[190,190,182],[160,160,154]],wet:[[140,142,140],[152,154,152]],dune:[[214,220,228],[196,204,214]],rock:GP.frost.rock.c.map(hx),face:gp('frost','face'),
      scree:[[160,166,178],[126,132,146]],bank:[[112,108,100],[94,90,84],[76,72,68]],lip:[226,232,242],sea:[[150,186,196],[100,146,170],[64,100,138],[38,64,98]],
      bed:[[150,150,144],[128,128,124]],river:[[150,182,190],[110,146,158],[84,118,134],[70,100,118]],cool:[196,206,226]},
    swamp:{grass:[[76,96,52],[88,108,58],[68,88,46]],meadow:[[92,82,52],[104,92,58],[82,74,46]],wood:[[52,72,40],[60,82,44],[46,64,36]],
      sand:[[150,140,110],[162,152,120],[140,130,100]],wet:[[118,110,86],[128,120,94]],dune:[[140,140,96],[120,124,80]],face:gp('swamp','face'),rock:GP.swamp.rock.c.map(hx),
      sea:[[126,170,150],[86,136,132],[56,100,116],[36,70,92]],river:[[104,112,76],[84,94,62],[66,76,50],[54,62,42]],bank:[[86,74,50],[72,62,42],[58,50,36]],lip:[72,92,46],
      mud:[[78,70,46],[64,58,38]],cool:[56,74,58]}};
  TPAL=CLIMS.map(c=>Object.assign({},base,over[c]||{}));return TPAL}

// (how much of a wood the ground at game px (gx, gy) is, by the tiles round it (land: the plan's land kinds, worldways.js) seen through a
// warp: a wood's edge ragged and soft, never a tile's square; over .5 its floor and its trees)
function terWood(land,gx,gy){const wu=(gx+(wnoise2(gx/12,gy/12,551)-.5)*16-8)/16,wv=(gy+(wnoise2(gx/12+9,gy/12,552)-.5)*16-8)/16,wx=Math.floor(wu),wy=Math.floor(wv),au=wu-wx,av=wv-wy,
    isW=(a,b)=>land[Math.max(0,Math.min(MH-1,b))*MW+Math.max(0,Math.min(MW-1,a))]===T_FOREST?1:0;
  return (isW(wx,wy)*(1-au)+isW(wx+1,wy)*au)*(1-av)+(isW(wx,wy+1)*(1-au)+isW(wx+1,wy+1)*au)*av}
// (the land's kinds, by what they show)
const TERK={water:0,wet:1,sand:2,dune:3,grass:4,meadow:5,wood:6,rock:7,scree:8,snow:9,bank:10,oasis:11};
let TER_K=0;// (the kind terLand last chose)
const tmix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],tmul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
// (a tone of a palette by patches a few px across, a little grain within: the lab's pick)
const tpick=(L3,x,y,s)=>L3[Math.min(L3.length-1,Math.floor((wnoise2(x/5,y/5,s)*.8+hs(x,y,s+1)*.2)*L3.length))];

// the chunk X, Y, w x h (game px) painted r times finer into rec.fcv: F its game-px picture as painted (the yards, trampled ground,
// ferries, ore), G its ground alone (the window x0, y0, ww wide), KP the ground's water mask and distances (artGenGround's: M, DT,
// X0, Y0, RW: the sea's and the lakes'); its ways the lab's (worldways.js: the rivers and brooks as curves, their surface stepping
// down the land; the roads worn tracks; the bridges standing over the water)
function* terrainChunk(rec,P,F,G,KP,X,Y,w,h,HE,x0,y0,ww,r){
  const T=WORLD_TERRAIN,PAL=terrainPal(),LV=WM.lv||(WM.lv=reliefOf(WM)),LH=landHeight(WM),W2=w*r,H2=h*r,HE2=HE*r,out=new ImageData(W2,H2),O=out.data,CW=new Uint8ClampedArray(W2*HE2*4),WK=new Uint8Array(W2*HE2),WA=new Float32Array(W2*HE2),WL=new Int16Array(W2*HE2),PL=new Uint8Array(W2*HE2),KD=new Uint8Array(W2*HE2),TS=16,WY=waysOf(P),WV=WORLD_WAYS,Rv=WM.river,k2=r/2;
  // (the game px whose levels are worked: the chunk, a px round it, and south of it as far as the highest lift reaches (HE rows))
  const gx0=X-2,gy0=Y-2,GW=w+4,GH=HE+4,Lv=new Float32Array(GW*GH),St=new Float32Array(GW*GH),Gx=new Float32Array(GW*GH),Gy=new Float32Array(GW*GH),Wa=new Uint8Array(GW*GH),SW=new Float32Array(GW*GH);
  const tlv=(tx,ty)=>LV[Math.max(0,Math.min(MH-1,ty))*MW+Math.max(0,Math.min(MW-1,tx))],tix=(gx,gy)=>Math.max(0,Math.min(MH-1,gy>>4))*MW+Math.max(0,Math.min(MW-1,gx>>4));
  // (the ways near: the rivers' and brooks' curves and the roads, at game px over the levels' window and at fine px over the chunk;
  //  the sea's and the lakes' tiles (a river's mouth on them with them) keep the shore's water)
  const bankG=WV.river.bank*WAY_LP,shG=WV.road.sh*WAY_LP,bankF=WV.river.bank*k2,edgeF=WV.road.edge*k2,varyF=WV.road.hw[1]*WV.road.vary*k2;
  const RG=yield* waysBand(WY.SA,gx0,gy0,GW,GH,1,bankG+2+T.shore.reach),DG=yield* waysBand(WY.RA,gx0,gy0,GW,GH,1,shG+1);
  const RF=yield* waysBand(WY.SA,X*r,Y*r,W2,HE2,r,bankF+2+T.shore.reach*r),DF=yield* waysBand(WY.RA,X*r,Y*r,W2,HE2,r,edgeF+varyF+2);
  // (no road under a bridge's open span, as the lab's OPEN: the river and its banks stay as they are under it, only its ends rest on
  //  the road's fill)
  bridgeOpen(WY.bridges,DG,gx0,gy0,GW,GH,1,shG);bridgeOpen(WY.bridges,DF,X*r,Y*r,W2,HE2,r,(edgeF+varyF)/r);
  // (the roads' dead ends and the streams' fords near: worldways.js waysOf ends, fords)
  const RDf=WV.road.fade,ENc=[],FOc=[];{const E=WY.ends||[];for(let q=0;q<E.length;q+=2){const x=E[q],y=E[q+1];if(x>X-RDf&&x<X+w+RDf&&y>Y-RDf&&y<Y+HE+RDf)ENc.push(x,y)}
    for(const f of WY.fords||[])if(f.mx>X-32&&f.mx<X+w+32&&f.my>Y-32&&f.my<Y+HE+32)FOc.push(f)}
  /* (the sea's and the lakes' water, the lab's way: no tile's square: a field between the tiles' middles (-1 open water, +1 land; a
     river's tiles land, its curve its own) roughened by a noise of a lab px or two, water under 0; then each px's distance (game px) to
     the water (DW: the beach, wet sand and dunes, the lab's shore widths) and the water's to the land (DL: its depth, its foam), over the
     window and a margin as wide as the dunes reach) */
  const BKF=new Float32Array(W2*HE2).fill(1),ow=ti=>tiles[ti]===T_WATER&&(!(Rv[ti]&3)||WY.mouth[ti]),MG=Math.ceil(T.dune/2)+8,ex0=gx0-MG,ey0=gy0-MG,EW=GW+2*MG,EH=GH+2*MG,WAT=new Uint8Array(EW*EH),DW=new Float32Array(EW*EH),DL=new Float32Array(EW*EH),WLV=new Float32Array(EW*EH);
  {const ovf=(tx,ty)=>{tx=Math.max(0,Math.min(MW-1,tx));ty=Math.max(0,Math.min(MH-1,ty));return ow(ty*MW+tx)};
    // (the field a cubic B-spline over the tiles, read at a place warped by noise (shore.warp game px at shore.sc): a lake's or a bay's
    //  shore rounded and wandering, never the tiles' straight runs and diamonds (the owner: "Recheck if there's any weird squared
    //  look"); bias keeps every water tile's middle water)
    const SH=T.shore;
    for(let j=0;j<EH;j++){const gy=ey0+j;for(let i=0;i<EW;i++){const gx=ex0+i,wx=gx+(wnoise2(gx/SH.sc,gy/SH.sc,573)-.5)*2*SH.warp,wy=gy+(wnoise2(gx/SH.sc,gy/SH.sc,574)-.5)*2*SH.warp,
        u=(wx-8)/TS,v=(wy-8)/TS,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,a=ovf(tx,ty),b=ovf(tx+1,ty),c=ovf(tx,ty+1),d=ovf(tx+1,ty+1);
        let any=a||b||c||d;if(!any)for(let q=-1;q<=2&&!any;q++)for(let p=-1;p<=2;p++)if(ovf(tx+p,ty+q)){any=true;break}if(!any)continue;
        const bx=labBS(fu),by=labBS(fv);let bs=0;for(let q=0;q<4;q++){let rr=0;for(let p=0;p<4;p++)rr+=bx[p]*(ovf(tx+p-1,ty+q-1)?-1:1);bs+=by[q]*rr}
        const f=bs-SH.bias+(wnoise2(gx/9,gy/9,571)-.5)*.5+(wnoise2(gx/3.5,gy/3.5,572)-.5)*.2;
        if(f<0){const q=j*EW+i;WAT[q]=1;let lo=1e9;for(const [x,y,o] of [[tx,ty,a],[tx+1,ty,b],[tx,ty+1,c],[tx+1,ty+1,d]])if(o)lo=Math.min(lo,LV[Math.max(0,Math.min(MH-1,y))*MW+Math.max(0,Math.min(MW-1,x))]);WLV[q]=lo}}
      if(!(j&63))yield}
    const cham=(D,src)=>{for(let q=0;q<EW*EH;q++)D[q]=src(q)?0:1e6;
      for(let y=0;y<EH;y++)for(let x=0;x<EW;x++){const q=y*EW+x;let d=D[q];if(!d)continue;if(x>0)d=Math.min(d,D[q-1]+1);if(y>0){d=Math.min(d,D[q-EW]+1);if(x>0)d=Math.min(d,D[q-EW-1]+1.414);if(x<EW-1)d=Math.min(d,D[q-EW+1]+1.414)}D[q]=d}
      for(let y=EH-1;y>=0;y--)for(let x=EW-1;x>=0;x--){const q=y*EW+x;let d=D[q];if(!d)continue;if(x<EW-1)d=Math.min(d,D[q+1]+1);if(y<EH-1){d=Math.min(d,D[q+EW]+1);if(x<EW-1)d=Math.min(d,D[q+EW+1]+1.414);if(x>0)d=Math.min(d,D[q+EW-1]+1.414)}D[q]=d}};
    cham(DW,q=>WAT[q]);cham(DL,q=>!WAT[q]);yield
    /* (a wide river's banks (two tiles or more): one smooth curve over its tiles, read the same way, its water every px inside it
       (the river's own curves there giving its flow; its depth by how far in it is), drawn shore.river wider than its tiles so its
       curves lie inside it: its banks never show a bulge for each of its curves' points (the
       owner, 2026-11-15: "the wide water has a scalloped edge, a round bulge per tile")) */
    // (the wide rivers' tiles, and the tiles within 3 of one, kept with the ways: WY.WR, WY.WRN)
    if(!WY.WR){const A=WY.WR=new Uint8Array(MW*MH),B=WY.WRN=new Uint8Array(MW*MH);for(let i=0;i<MW*MH;i++)A[i]=tiles[i]===T_WATER&&(Rv[i]&3)>=2&&!WY.mouth[i]?1:0;
      for(let i=0;i<MW*MH;i++){if(!A[i])continue;const x=i%MW,y=(i-x)/MW;for(let b=-3;b<=3;b++)for(let a=-3;a<=3;a++){const u=x+a,v=y+b;if(u>=0&&v>=0&&u<MW&&v<MH)B[v*MW+u]=1}}}
    const WRA=WY.WR,WRB=WY.WRN,wr=(tx,ty)=>WRA[Math.max(0,Math.min(MH-1,ty))*MW+Math.max(0,Math.min(MW-1,tx))];
    // (which of the rivers' segments are the wide water's own (they start on its tiles): its smooth bank dries only its own px, never a
    //  stream's running into it (the owner, 2026-11-16: "it should be watered or shallow path not like a whole land cross the river"))
    if(!WY.SWD){const n=WY.SP.length,D=WY.SWD=new Uint8Array(n);for(let q=0;q<n;q++){const a=WY.SP[q];D[q]=wr(Math.floor(WY.X[a]/TS),Math.floor(WY.Y[a]/TS))}}
    const SWD=WY.SWD;
    // (the field at game px (x, y), a float: under 0 the water, 0 to shore.bank its bank; null away from a wide river)
    const fAt=(x,y)=>{const wx=x+(wnoise2(x/SH.sc,y/SH.sc,575)-.5)*2*SH.warp*1.2,wy=y+(wnoise2(x/SH.sc,y/SH.sc,576)-.5)*2*SH.warp*1.2,u=(wx-8)/TS,v=(wy-8)/TS,tx=Math.floor(u),ty=Math.floor(v);
      const bx=labBS(u-tx),by=labBS(v-ty);let bs=0,any=false;for(let q=0;q<4;q++){let rr=0;for(let p=0;p<4;p++){const w=wr(tx+p-1,ty+q-1);if(w)any=true;rr+=bx[p]*(w?-1:1)}bs+=by[q]*rr}
      return any?bs-SH.river+(wnoise2(x/7,y/7,577)-.5)*.3:null},near=(x,y)=>WRB[Math.max(0,Math.min(MH-1,y>>4))*MW+Math.max(0,Math.min(MW-1,x>>4))];
    // (the land's heights by game px; the water, its depth and its bank by fine px, so its edge is smooth at the lab's px, never in
    //  steps of two (the owner: "Make sure the edge are smooth not square"))
    for(let j=0;j<GH;j++){const gy=gy0+j;for(let i=0;i<GW;i++){const gx=gx0+i;if(!near(gx,gy))continue;const f=fAt(gx+.5,gy+.5);if(f===null)continue;const k=j*GW+i;if(RG.Q[k]<0)continue;
        if(f<0)RG.S[k]=-WY.HW[WY.SP[RG.Q[k]]]*Math.max(.08,Math.min(.6,-f*.9));else if(f<SH.bank&&RG.S[k]<0&&SWD[RG.Q[k]])RG.S[k]=.5}}
    // (its dirt bank along that curve, as wide all along: an earth face at the water, then mud, dark grass up it (BKF, what the bank's
    //  colour reads; the owner: "keep that dirt edge"))
    for(let fy=0;fy<HE2;fy++){const y=Y+(fy+.5)/r;for(let fx=0;fx<W2;fx++){const x=X+(fx+.5)/r;if(!near(x|0,y|0))continue;const fi=fy*W2+fx;if(RF.Q[fi]<0)continue;const f=fAt(x,y);if(f===null)continue;
        if(f<0)RF.S[fi]=-WY.HW[WY.SP[RF.Q[fi]]]*r*Math.max(.08,Math.min(.6,-f*.9));else if(f<SH.bank&&!(RF.S[fi]<0&&!SWD[RF.Q[fi]])){BKF[fi]=Math.min(BKF[fi],f/SH.bank);if(RF.S[fi]<0)RF.S[fi]=.5}}}
    yield}
  const WB0dw=(gx,gy)=>{const q=(gy-ey0)*EW+gx-ex0;return q>=0&&q<EW*EH?DW[q]:99},eq=(gx,gy)=>(gy-ey0)*EW+gx-ex0,seaAt=(gx,gy)=>{const q=eq(gx,gy);return q>=0&&q<EW*EH&&WAT[q]===1};
  const seaT=ti=>ow(ti),surf=(q,t)=>{const a=WY.SP[q];return riverSurf(WY.LV[a],WY.LV[a+1],t)};
  for(let j=0;j<GH;j++){const gy=gy0+j;for(let i=0;i<GW;i++){const gx=gx0+i,u=(gx-8)/TS,v=(gy-8)/TS,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,ti=tix(gx,gy),t=tiles[ti],sea=seaAt(gx,gy),k=j*GW+i;
      let e,wet=sea;
      if(sea)e=WLV[eq(gx,gy)];
      else{e=LH(gx*2+1,gy*2+1);// (the lab's land: worldgen.js landHeight, at this game px's middle in lab px)
        // (a river's or a brook's water at its surface, flat across; its banks eased to it)
        const s=RG.S[k];if(s<0){e=surf(RG.Q[k],RG.T[k]);wet=true}else if(s<bankG){const sv=surf(RG.Q[k],RG.T[k])+.3;e=sv+(e-sv)*wsm(s/bankG)}
        // (a road at its graded height (the lab's), its shoulders cut into the land or banked up to it)
        if(!wet){const ds=DG.S[k];if(ds<shG){const q=DG.Q[k],t=DG.T[k],rz=WY.RZ[q*2]+(WY.RZ[q*2+1]-WY.RZ[q*2])*t;e=ds<0?rz:rz+(e-rz)*wsm(ds/shG)}}}
      Lv[k]=Math.max(0,e);Wa[k]=wet?1:0}
    if(!(j&31))yield}
  // (each px's slope, and its level stepped where it is steep: never on water, near a road, a lot; a lot's ground (its tiles) eased
  //  into the steps round it over flat game px, never a square edge (the owner, 2026-11-15: "hill level still weird"))
  const OC=new Float32Array(GW*GH);if(typeof occAt==='function'){const R=T.flat,tmp=new Float32Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)OC[j*GW+i]=occAt((gx0+i)>>4,(gy0+j)>>4)>0?1:0;
    for(let j=0;j<GH;j++){let a=0;for(let i=-R;i<GW+R;i++){if(i+R<GW&&i+R>=0)a+=OC[j*GW+i+R];if(i-R-1>=0&&i-R-1<GW)a-=OC[j*GW+i-R-1];if(i>=0&&i<GW)tmp[j*GW+i]=a/(2*R+1)}}
    for(let i=0;i<GW;i++){let a=0;for(let j=-R;j<GH+R;j++){if(j+R<GH&&j+R>=0)a+=tmp[(j+R)*GW+i];if(j-R-1>=0&&j-R-1<GH)a-=tmp[(j-R-1)*GW+i];if(j>=0&&j<GH)OC[j*GW+i]=Math.min(1,a/(2*R+1)*2)}}}
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i,gxl=(Lv[k+1]-Lv[k-1])/2,gyl=(Lv[k+GW]-Lv[k-GW])/2,g=Math.hypot(gxl,gyl);Gx[k]=gxl;Gy[k]=gyl;
    const flat=Wa[k]||DG.S[k]<shG||RG.S[k]<bankG*T.shore.unstep;
    const sw=flat?0:Math.max(0,Math.min(1,(g-T.steps.from)/(T.steps.to-T.steps.from)))*(1-OC[k]),s3=sw*sw*(3-2*sw),e=Lv[k],B=T.steps.band;St[k]=e+(Math.floor(e/B)*B-e)*s3;SW[k]=s3}
  yield;
  // (each game px's climate as the ground's colour picks it (terClimate: warped, dithered), for the blend, the decor and the faces)
  const CLG=new Uint8Array(GW*GH);for(let j=0;j<GH;j++)for(let i=0;i<GW;i++)CLG[j*GW+i]=terClimate(gx0+i,gy0+j);
  const at=(gx,gy)=>(gy-gy0)*GW+gx-gx0,mi=(gx,gy)=>(gy-KP.Y0)*KP.RW+gx-KP.X0,inK=(gx,gy)=>gx>=KP.X0&&gy>=KP.Y0&&gx<KP.X0+KP.RW&&gy<KP.Y0+KP.RH;
  // the tops: every fine px its own ground (or what the game painted over it), shaded by its slope; a river's water, its bank; a road
  const C=[0,0,0],MOU=WY.mouths.filter(([mx,my,mw])=>mx+mw>X&&mx-mw<X+w&&my+mw>Y&&my-mw<Y+HE);
  for(let y=0;y<HE;y++){for(let x=0;x<w;x++){const gx=X+x,gy=Y+y,fo=(y*w+x)*4,go=((gy-y0)*ww+gx-x0)*4,k=at(gx,gy),ti=(gy>>4)*MW+(gx>>4),t=tiles[ti],ford=t===T_FORD&&DF.S[(y*r)*W2+x*r]<4*r,
      over=F[fo]!==G[go]||F[fo+1]!==G[go+1]||F[fo+2]!==G[go+2];
      const qe=eq(gx,gy),m=WAT[qe]?1:0,dd=m?DL[qe]:DW[qe],e=Lv[k],sl=Math.max(-.16,Math.min(.12,(-Gx[k]-.6*Gy[k])/1*T.lh*T.shade/r)),flat=Math.hypot(Gx[k],Gy[k])<.03;
      // (its climates, by the tiles' round it: their shares)
      //  read at a place warped by noise (T.climWarp game px), its own one picked from those shares, dithered: a climate's edge (and a
      //  river's colour across it) ragged, never along the tiles (the owner: "Recheck if there's any weird squared look")
      const wgx=gx+(wnoise2(gx/23,gy/23,601)-.5)*2*T.climWarp,wgy=gy+(wnoise2(gx/23,gy/23,602)-.5)*2*T.climWarp,u=(wgx-8)/TS,v=(wgy-8)/TS,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,cw=[0,0,0,0],cl=(a,b)=>climate[Math.max(0,Math.min(MH-1,b))*MW+Math.max(0,Math.min(MW-1,a))];
      cw[cl(tx,ty)]+=(1-fu)*(1-fv);cw[cl(tx+1,ty)]+=fu*(1-fv);cw[cl(tx,ty+1)]+=(1-fu)*fv;cw[cl(tx+1,ty+1)]+=fu*fv;
      let ci=0;{const pk=hs(gx,gy,603);let acc=0;for(let c=0;c<4;c++){acc+=cw[c];if(pk<acc){ci=c;break}}}const Q=PAL[ci];
      // (how much of a wood it is, by the tiles round it seen through a warp: its edge ragged and soft, never a tile's square)
      const wd=terWood(WY.land,gx,gy);
      // (the nearest water's kind: the sea's or a lake's open water (its beach), or a river's (its bank is the river's own))
      const open=true,ddL=dd,cmax=cw.indexOf(Math.max(...cw));
      for(let j=0;j<r;j++)for(let i=0;i<r;i++){const fi=(y*r+j)*W2+x*r+i,o=fi*4,fx=gx*r+i,fy=gy*r+j,rs=RF.S[fi];let col,shade=true;
        if(!m&&rs<0){const a=WY.SP[RF.Q[fi]],tt=RF.T[fi],hw=(WY.HW[a]+(WY.HW[a+1]-WY.HW[a])*tt)*r,q=Math.min(1,(rs+hw)/hw),dp=WY.DP[a]+(WY.DP[a+1]-WY.DP[a])*tt;
          // (the frost's shelf ice along its banks only on its own course, not where it runs out into a lake or the sea (the open water's
          //  smooth mask, WAT) nor within shore.ice px of it (its mouth widening into it): there its edges are open water, the ice straight lines
          //  across it; the open water's own ice: terWater)
          // (the current's run down it: the px's distance along the river's line, and across it, past its segment's ends as well,
          //  so the run never stands still over a bend's outer wedge); its ripples and streaks along it, in its main stream only,
          //  fewer out from its middle (a wide one's lanes would curl round a bend's inside)
          const RW=WV.river.flow,RN=WY.RN||(WY.RN=riverRun(WY)),ux=RN.X[a+1]-RN.X[a],uy=RN.Y[a+1]-RN.Y[a],L=Math.hypot(ux,uy)||1,px=(fx+.5)/r-RN.X[a],py=(fy+.5)/r-RN.Y[a],
            A=(RN.C[a]+(px*ux+py*uy)/L)*r,c=Math.abs(px*uy-py*ux)/L*r,ln=Math.round(c/RW.lane),e=c/hw/RW.edge;
          col=wayWater(Q,CLIMS[ci],fx,fy,(dp*(1-q*q)+.04)*(ford?WV.river.ford:1),m||dd<T.shore.ice?0:q,ford,A,c,e);shade=false;WK[fi]=2;WA[fi]=A;
          WL[fi]=e>=1||hs(ln,1,546)<e||wnoise2(A/RW.gate,ln*.7,544)<RW.on?0:1+((hs(ln,0,545)*900)|0);
          // (a natural ford where a track crosses a stream (the owner: "No need to be human made stone ford"): the stream spread
          //  shallow over a gravel bed along the road, its pebbles showing, riffles where it runs over them)
          for(const f of FOc){const tx2=fx/r-f.mx,ty2=fy/r-f.my,t=tx2*f.ux+ty2*f.uy,v=ty2*f.ux-tx2*f.uy;if(Math.abs(v)>f.hw||Math.abs(t)>f.hb+3)continue;
            col=wayWater(Q,CLIMS[ci],fx,fy,.04+.08*Math.abs(v)/f.hw,q,false);if(wnoise2(fx/(3*k2),fy/(1.6*k2),579)>.72)col=tmix(col,Q.fall[0],.45);break}
          // (a fall's white water, seen whichever way its river runs: its lip whitening as it goes over, a pool churning foam at its foot;
          //  only across its own channel (falls.wide of its half-width), fading in from its ends and its sides, never spread across a wide river's or a lake's water)
          const FD=WY.FD||(WY.FD=fallDist(WY)),f0=FD[a],f1=FD[a+1],FA=T.falls,cw=1-c/(hw*FA.wide);if((f0<1e8||f1<1e8)&&cw>0){const fd=f0<1e8&&f1<1e8?f0+(f1-f0)*tt:f0<1e8?f0:f1,nz=hs(fx,fy,577);
            if(fd<0&&fd>-FA.lip){const u=(1+fd/FA.lip)*Math.min(1,cw*3);col=tmix(col,Q.fall[nz<.4?0:1],.95*u);if(u>.3)WK[fi]=3}
            else if(fd>=0&&fd<FA.pool){const u=(1-fd/FA.pool)*Math.min(1,cw*3);col=tmix(col,nz<u*.7?Q.foam:Q.fall[1],.3*u+.65*u*u);if(u>.35)WK[fi]=3}}}
        else if(over&&!(BKF[fi]<1&&t===T_WATER))col=[F[fo],F[fo+1],F[fo+2]];
        else{C[0]=C[1]=C[2]=0;
          for(let c=0;c<4;c++){if(cw[c]<.02)continue;const c3=m?terWater(PAL[c],c,m,dd,P,gx,gy,fx,fy):terLand(PAL[c],c,WY.land[ti],e,Math.hypot(Gx[k],Gy[k]),ddL,open,fx,fy,wd);if(c===cmax&&!m)KD[fi]=TER_K+1;C[0]+=c3[0]*cw[c];C[1]+=c3[1]*cw[c];C[2]+=c3[2]*cw[c]}
          col=[C[0],C[1],C[2]];
          // (the climates' own, the lab's: the desert green by its rivers (oasis lab px of the water); the swamp's pools on its low land,
          //  still and murky, duckweed on them)
          if(!m&&cmax===2&&rs<T.oasis*k2&&KD[fi]>0){col=tmix(col,tpick(PAL[0].grass,fx,fy,573),Math.min(1,(T.oasis*k2-rs)/(6*k2))*.8);KD[fi]=TERK.oasis+1}
          if(!m&&cmax===3&&e<T.pools.lo&&rs>4*r&&DF.S[fi]>6*r&&(KD[fi]===TERK.grass+1||KD[fi]===TERK.meadow+1)){const pm=wnoise2(fx/(T.pools.sc*k2),fy/(T.pools.sc*k2),574)*.7+wnoise2(fx/(T.pools.sc*k2*.4),fy/(T.pools.sc*k2*.4),575)*.3;
            if(pm>T.pools.at){const d=Math.min(.7,.05+(pm-T.pools.at)*T.pools.deep);col=tmix([86,108,84],[52,70,58],Math.min(1,d/.7));if(wnoise2(fx/6,fy/6,576)>.78&&hs(fx,fy,577)<.55)col=tmix(col,[110,140,62],.65);if(pm-T.pools.at<.012)col=tmix(col,[56,48,32],.6);KD[fi]=0;PL[fi]=1;shade=false}}
          if(m){shade=false;WK[fi]=1;
            // (a river's water fanning out into the sea past its mouth: its plume)
            for(const [mx,my,mw] of MOU){const dq=Math.hypot(fx-mx*r,fy-my*r)/(mw*r);if(dq<1){const rc=wayWater(Q,CLIMS[ci],fx,fy,.6,0,false);col=tmix(col,rc,(1-dq)*(1-dq)*.7)}}}
          // (a river's bank: mud at the water, dark grass up it, then the land)
          else if(rs<bankF||BKF[fi]<1){const tb=Math.min(rs<bankF?rs/bankF:1,BKF[fi]);col=tb<.45?tmix(tpick(Q.mud,fx,fy,519),tmul(col,.86),tb/.45):tmix(tmul(col,.86),col,(tb-.45)/.55)}}
        // (a road over it: the lab's worn track, its edge ragged; never over water)
        // (its width wandering along it and its edge ragged, the lab's: vary, edge)
        // (by the land it runs through: the ground's colour mixed in, the ground over it in patches (snow, sand, mud); at a dead end it
        //  narrows and fades into the land, dithered, over road.fade game px)
        const ds=DF.S[fi];if(!m&&!(rs<0)&&ds<edgeF+varyF){const sg=DF.Q[fi],o6=sg*6,A=WY.RA,hwR=A[o6+4]*r,along=(WY.RL[sg]+DF.T[fi]*Math.hypot(A[o6+2]-A[o6],A[o6+3]-A[o6+1]))*r;
          let fe=1;for(let q=0;q<ENc.length;q+=2){const ex=fx/r-ENc[q],ey=fy/r-ENc[q+1],d2=ex*ex+ey*ey;if(d2<RDf*RDf)fe=Math.min(fe,sstep(Math.sqrt(d2)/RDf))}
          const hv=hwR*(1+WV.road.vary*(wnoise2(along/(30*k2),.5,534)-.5)*2)*(.35+.65*fe),rg=ds+hwR-hv-(wnoise2(fx/(13*k2),fy/(13*k2),533)-.5)*2*edgeF;
          if(rg<0){const ax=A[o6]*r,ay=A[o6+1]*r,bx=A[o6+2]*r,by=A[o6+3]*r,side=Math.sign((bx-ax)*(fy+.5-ay)-(by-ay)*(fx+.5-ax))||1,BM=WV.road.biome,land=col;
            let rc=tmix(wayRoad(fx,fy,(ds+hwR)*side,hv,along,flat,col,k2),land,BM.mix[ci]);if(wnoise2(fx/(9*k2),fy/(9*k2),538)>BM.patch[ci])rc=tmix(rc,land,.75);
            col=fe>=1?rc:hs(fx,fy,539)>fe*1.15?land:tmix(land,rc,.35+.65*fe)}}
        // (a ford's banks: the track running down onto wet gravel at the water)
        if(!m&&!(rs<0))for(const f of FOc){const tx2=fx/r-f.mx,ty2=fy/r-f.my,t=tx2*f.ux+ty2*f.uy,v=ty2*f.ux-tx2*f.uy;if(Math.abs(v)>f.hw*1.1||Math.abs(t)>f.hb+6)continue;
          const g=1-Math.max(0,(Math.abs(t)-f.hb)/6);col=tmix(col,tmix(tpick(Q.mud,fx,fy,519),Q.pebble[Math.floor(hs(fx>>1,fy>>1,580)*4)],.55),.65*g*(1-Math.abs(v)/(f.hw*1.1)));break}
        // (a road's cutting or embankment where its shoulder is steep: earth showing in ragged patches, the lab's cut)
        if(!m&&!(rs<0)&&ds>=0&&ds<WV.road.sh*k2){const gq=Math.hypot(Gx[k],Gy[k]);if(gq>=.1&&hs(fx,fy,560)<Math.min(1,(gq-.1)/.25)*.9)col=tmix(tpick(Q.bank,fx,fy,561),col,.25)}
        const s=shade?1+sl:1;CW[o]=col[0]*s;CW[o+1]=col[1]*s;CW[o+2]=col[2]*s;CW[o+3]=255}}
    if(!(y&7))yield}
  // (reeds on the rivers' banks: a few px tall, up from the mud)
  for(let fy=Y*r+6;fy<(Y+HE)*r;fy++)for(let fx=X*r;fx<(X+w)*r;fx++){const fi=(fy-Y*r)*W2+fx-X*r,rs=RF.S[fi];if(!(rs>=0&&rs<bankF*.6)||hs(fx,fy,535)>.035)continue;
    const n=Math.round((3+hs(fx,fy,536)*3)*k2);for(let j=1;j<=n;j++){const o=(fi-j*W2)*4,c=j===n&&hs(fx,fy,537)<.4?WAY_COL.reed[2]:WAY_COL.reed[j&1];CW[o]=c[0];CW[o+1]=c[1];CW[o+2]=c[2]}}
  yield;
  /* the grounds blended, the lab's (its blend): each land px's plain colour (its kind's palette's middle, in its climate) averaged over
     blend.r lab px round it among the grounds that blend, sampled through a warp so the edge is ragged; its colour moved by blend.k of
     the difference, its own grain kept */
  {const BL=T.blend,R=Math.max(1,Math.round(BL.r*k2)),N2=W2*HE2,BR=new Float32Array(N2),BG=new Float32Array(N2),BB=new Float32Array(N2),BM=new Float32Array(N2),mean=L3=>[0,1,2].map(j=>L3.reduce((a,c)=>a+c[j],0)/L3.length),
      KB=PAL.map(Q=>{const o=[];o[TERK.wet]=mean(Q.wet);o[TERK.sand]=mean(Q.sand);o[TERK.dune]=tmix(mean(Q.sand),Q.dune[0],.45);o[TERK.grass]=mean(Q.grass);o[TERK.meadow]=mean(Q.meadow);o[TERK.wood]=mean(Q.wood);
        o[TERK.scree]=mean(Q.scree);o[TERK.rock]=mean(Q.rock.slice(0,3));o[TERK.snow]=mean(Q.snow);o[TERK.bank]=tmix(mean(Q.mud),mean(Q.grass),.5);o[TERK.oasis]=mean(PAL[0].grass);return o});
    const plain=(fi,fx,fy)=>{const kd=KD[fi];if(!kd)return null;const gx=Math.floor(fx/r),gy=Math.floor(fy/r);return KB[CLG[at(gx,gy)]][kd-1]};
    for(let fy=0;fy<HE2;fy++)for(let fx=0;fx<W2;fx++){const fi=fy*W2+fx,c=plain(fi,X*r+fx,Y*r+fy);if(!c)continue;BR[fi]=c[0];BG[fi]=c[1];BB[fi]=c[2];BM[fi]=1}
    const tmp=new Float32Array(Math.max(W2,HE2)),box=(A,len,stride,start)=>{let acc=0;for(let q=-R;q<=R;q++)acc+=A[start+Math.min(len-1,Math.max(0,q))*stride];
      for(let q=0;q<len;q++){tmp[q]=acc;acc+=A[start+Math.min(len-1,q+R+1)*stride]-A[start+Math.max(0,q-R)*stride]}for(let q=0;q<len;q++)A[start+q*stride]=tmp[q]};
    // (down the columns all at once, row by row, a running sum for each column: the same box as box(A, HE2, W2, x) for every x, read
    //  in memory's order, not a whole row's stride a step)
    const VB=terBlurBuf(N2),acc=new Float64Array(W2),cl=q=>Math.min(HE2-1,Math.max(0,q))*W2,boxV=A=>{acc.fill(0);for(let q=-R;q<=R;q++){const o=cl(q);for(let x=0;x<W2;x++)acc[x]+=A[o+x]}
      for(let y=0;y<HE2;y++){const o=y*W2,a=cl(y+R+1),b=cl(y-R);for(let x=0;x<W2;x++){VB[o+x]=acc[x];acc[x]+=A[a+x]-A[b+x]}}A.set(VB.subarray(0,N2))};
    for(const A of [BR,BG,BB,BM]){for(let pass=0;pass<2;pass++){for(let y=0;y<HE2;y++)box(A,W2,1,y*W2);boxV(A)}yield}
    for(let fy=0;fy<HE2;fy++)for(let fx=0;fx<W2;fx++){const fi=fy*W2+fx,ax=X*r+fx,ay=Y*r+fy,c=plain(fi,ax,ay);if(!c)continue;
      const wx=Math.min(W2-1,Math.max(0,Math.round(fx+(wnoise2(ax/(12*k2),ay/(12*k2),578)-.5)*BL.warp*k2))),wy=Math.min(HE2-1,Math.max(0,Math.round(fy+(wnoise2(ax/(12*k2)+9,ay/(12*k2),579)-.5)*BL.warp*k2))),j=wy*W2+wx,mm=BM[j];if(!mm)continue;
      const o=fi*4;CW[o]+=(BR[j]/mm-c[0])*BL.k;CW[o+1]+=(BG[j]/mm-c[1])*BL.k;CW[o+2]+=(BB[j]/mm-c[2])*BL.k}
    yield}
  /* the small things on the ground, the lab's (its decor): tufts in the grass, flowers in the meadows, marram on the dunes, driftwood
     along the tide line, shells on the beach, the woods' fallen leaves and twigs, pebbles on scree and rock; each a px or a few, up from
     its own px (lifted with the land) */
  {const DC=T.decor,put=(fx,fy,c)=>{if(fx<0||fy<0||fx>=W2||fy>=HE2)return;const o=(fy*W2+fx)*4;CW[o]=c[0];CW[o+1]=c[1];CW[o+2]=c[2]};
    for(let fy=2;fy<HE2;fy++)for(let fx=1;fx<W2-1;fx++){const kd=KD[fy*W2+fx]-1;if(kd<0)continue;const ax=X*r+fx,ay=Y*r+fy,q=hs(ax,ay,580);if(q>.06)continue;const gx=Math.floor(ax/r),gy=Math.floor(ay/r),Q=PAL[CLG[at(gx,gy)]];
      if(kd===TERK.grass||kd===TERK.meadow||kd===TERK.oasis){if(q<.03){const c=tmul(Q.grass[q<.012?0:1],.72);put(fx,fy-1,c);if(q<.015)put(fx,fy-2,tmul(Q.grass[0],.62))}else if(kd===TERK.meadow&&q<.05)put(fx,fy-1,DC.flower[Math.floor(hs(ax,ay,581)*4)])}
      else if(kd===TERK.dune&&q<.05){const n=2+Math.floor(hs(ax,ay,582)*3);for(let j=1;j<=n;j++)put(fx+(j>2&&q<.025?1:0),fy-j,DC.marram[j&1])}
      else if((kd===TERK.sand||kd===TERK.wet)&&q<.0013&&WB0dw(gx,gy)*2<20){const n=3+Math.floor(hs(ax,ay,583)*4);for(let j=0;j<n;j++){put(fx+j,fy+1,tmul(Q.wet[0],.85));put(fx+j,fy,j===0||j===n-1?DC.drift[0]:DC.drift[1])}}
      else if(kd===TERK.sand&&q<.012)put(fx,fy,DC.shell);
      else if(kd===TERK.wood&&q<.03){if(q<.012){const c=DC.litter[Math.floor(hs(ax,ay,584)*3)];put(fx,fy-1,c);put(fx+1,fy-1,tmul(c,.8))}else put(fx,fy-1,tmul(Q.wood[0],.7))}
      else if((kd===TERK.scree||kd===TERK.rock)&&q<.03){put(fx,fy,Q.scree[1]);if(q<.015){put(fx,fy-1,Q.scree[0]);put(fx+1,fy,tmul(Q.scree[1],.8))}}}
    yield}
  /* the land drawn as the world lab draws it (engine/worldlab.js paint; the owner, 2026-11-15: "use the LAB version including the
     drawing"): each fine px's top lifted up the screen by its height (its stepped level, WORLD_TERRAIN.lh fine px a level: LF), column
     by column north to south, the nearer over the farther; where the next px's top lies lower, this px's south face fills down to it
     (a fall where water steps down, a stone wall under a road, rock with a ledge at every level, sand, earth with its lip); the lip
     of a step lit (snow on a high one), the foot of a face in its shade. The chunk's picture is the screen's: rows Y to Y + h of the
     view; the land south of it (HE: as far as the highest lift reaches) seen in it lifted. DEPF: each screen px's ground (its world
     row, fine, -1 none); TOP: 1 where it is a top (no prop nor grass stands on a face) */
  const LF=new Int16Array(GW*GH);for(let k=0;k<GW*GH;k++)LF[k]=Math.max(0,Math.round((Wa[k]?Lv[k]:St[k])*T.lh));
  /* (each fine px's own lift, the lab's resolution (the owner, 2026-11-15: "Why i see a lot of square edge in the game version but
     not in the lab? Is it generated using a different scales?": it was each game px's, two lab px, so every edge a stair of two):
     land's level between its game px's middles (bilinear; water beside it never pulling it down), stepped by its own share of the
     step (SW's, between); water (its colour's, WK) flat at its game px's level, or at the wet one's beside it. LFF its lift, WF wet,
     SF its step's share) */
  const LFF=new Int16Array(W2*HE2),WF=new Uint8Array(W2*HE2),SF=new Float32Array(W2*HE2),SB=T.steps.band;
  for(let fy=0;fy<HE2;fy++){const gy=Y+((fy/r)|0);for(let fx=0;fx<W2;fx++){const fi=fy*W2+fx,gx=X+((fx/r)|0),kc=at(gx,gy);
    if(WK[fi]){let l=Wa[kc]?Lv[kc]:1e9;if(l>1e8){for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){const j=kc+b*GW+a;if(j>=0&&j<GW*GH&&Wa[j])l=Math.min(l,Lv[j])}if(l>1e8)l=Lv[kc]}
      // (a river's water a little under its banks (shore.lip fine px), so its dirt edge shows along it (the owner: "keep that dirt edge"))
      WF[fi]=1;LFF[fi]=Math.max(0,Math.round(l*T.lh)-(WK[fi]===2?T.shore.lip:0));continue}
    const u=(X*r+fx+.5)/r-.5-gx0,v=(Y*r+fy+.5)/r-.5-gy0,i0=Math.max(0,Math.min(GW-2,Math.floor(u))),j0=Math.max(0,Math.min(GH-2,Math.floor(v))),fu=Math.max(0,Math.min(1,u-i0)),fv=Math.max(0,Math.min(1,v-j0)),k0=j0*GW+i0;
    const ks=[k0,k0+1,k0+GW,k0+GW+1],ws=[(1-fu)*(1-fv),fu*(1-fv),(1-fu)*fv,fu*fv];let land=-1e9;for(const q of ks)if(!Wa[q])land=Math.max(land,Lv[q]);if(land<-1e8)land=Lv[kc]+.3;
    let e=0,sw=0;for(let q=0;q<4;q++){e+=ws[q]*(Wa[ks[q]]?land:Lv[ks[q]]);sw+=ws[q]*SW[ks[q]]}
    SF[fi]=sw;LFF[fi]=Math.max(0,Math.round((e+(Math.floor(e/SB)*SB-e)*sw)*T.lh))}}
  const lfAt=(jx,jy)=>{const fx=jx-X*r,fy=jy-Y*r;return fx>=0&&fy>=0&&fx<W2&&fy<HE2?LFF[fy*W2+fx]:LF[at(Math.floor(jx/r),Math.floor(jy/r))]};
  const DEPF=new Int32Array(W2*H2).fill(-1),TOP=new Uint8Array(W2*H2),lh=T.lh,SH=[],FL=[];
  for(let fx=0;fx<W2;fx++){const x=(fx/r)|0,gx=X+x;let first=-1;
    for(let fy=0;fy<HE2;fy++){const y=(fy/r)|0,gy=Y+y,k=at(gx,gy),fi=fy*W2+fx,L=LFF[fi],wt=WF[fi],sy=fy-L,ci=fi*4;
      if(sy>=0&&sy<H2){const o=(sy*W2+fx)*4;let s=1;const fp=fy>0?fi-W2:fi,fq=fy>1?fi-2*W2:fi;
        if(LFF[fp]>L+3&&!wt)s=.78;else if(LFF[fq]>L+3&&!wt)s=.9;
        // (an edge where the ground falls away north, west or east, its face unseen from the south (the owner, 2026-11-15: "make an edge
        //  for the south ankle that we cannot see"): its crest's own px darkened)
        else if(!wt){const RM=T.rim;if(fp!==fi&&LFF[fp]<L-RM.drop&&!WF[fp])s=RM.north;else{const fw=fx>0?fi-1:fi,fe=fx<W2-1?fi+1:fi;if(fw!==fi&&LFF[fw]<L-RM.drop&&!WF[fw]||fe!==fi&&LFF[fe]<L-RM.drop&&!WF[fe])s=RM.side}}
        O[o]=CW[ci]*s;O[o+1]=CW[ci+1]*s;O[o+2]=CW[ci+2]*s;O[o+3]=255;DEPF[sy*W2+fx]=fy;TOP[sy*W2+fx]=1;if(first<0)first=sy;
        const wk=WK[fy*W2+fx];if(wk===1){if(fx>0&&!WK[fy*W2+fx-1]||fx<W2-1&&!WK[fy*W2+fx+1]||fy>0&&!WK[(fy-1)*W2+fx]||fy<HE2-1&&!WK[(fy+1)*W2+fx])SH.push(fx,sy,(wnoise2((fx+X*r)/14,fy/14,540)*1900)|0)}else if(wk===2&&WL[fy*W2+fx])FL.push(fx,sy,Math.round(WA[fy*W2+fx])%30000,WL[fy*W2+fx]);else if(wk===3)FL.push(fx,sy,-2,(hs(fx+X*r,fy,543)*100)|0)}
      if(fy+1>=HE2)continue;const fN=fi+W2,kN=at(gx,Y+(((fy+1)/r)|0)),LN=LFF[fN],syN=fy+1-LN;if(syN<=sy+1)continue;
      // (the lip, lit; snow on a high one)
      const wet=wt,wetB=WF[fN],n=syN-sy-1,ti=tix(gx,gy),t=tiles[ti],Q=PAL[CLG[k]],road=DG.S[k]<shG,wall=DG.S[k]<WORLD_WAYS.road.wall*WAY_LP&&!WY.RB[DG.Q[k]],rocky=!road&&!(RG.S[k]<bankG+2)&&WK[fN]!==2&&(Math.hypot(Gx[k],Gy[k])>=T.steepG||Lv[k]>=T.rock-1||(L-LN)>=2*lh),snowy=Lv[k]>=T.snow-1,sand=!rocky&&Lv[k]<1.2&&!road;
      if(sy>=0&&sy<H2&&!wet&&!(n<=3&&SF[fi]<.5&&SF[fN]<.5)){const o=(sy*W2+fx)*4;if(snowy){O[o]=242;O[o+1]=246;O[o+2]=252}else{O[o]=Math.min(255,O[o]*1.12);O[o+1]=Math.min(255,O[o+1]*1.12);O[o+2]=Math.min(255,O[o+2]*1.12)}}
      // (a small drop on smooth ground or along water: no face, the lab's way: this top shading into the next)
      if(n<=3&&(SF[fi]<.5&&SF[fN]<.5&&!(wetB&&!wet&&WK[fN]===2)||wet&&wetB)){const ci2=((fy+1)*W2+fx)*4;for(let dz=1;dz<=n;dz++){const yy=sy+dz;if(yy<0||yy>=H2)continue;const f=dz/(n+1),o=(yy*W2+fx)*4;
          O[o]=CW[ci]+(CW[ci2]-CW[ci])*f;O[o+1]=CW[ci+1]+(CW[ci2+1]-CW[ci+1])*f;O[o+2]=CW[ci+2]+(CW[ci2+2]-CW[ci+2])*f;O[o+3]=255;DEPF[yy*W2+fx]=fy;TOP[yy*W2+fx]=1}continue}
      for(let dz=1;dz<=n;dz++){const yy=sy+dz;if(yy<0)continue;if(yy>=H2)break;const f=dz/Math.max(1,n),zh=L-dz,nz=hs(gx*r+fx%r,fy+dz,331),afx=X*r+fx;let c;
        if(wet&&wetB){const q=hs(afx,0,332);c=dz>=n-1?Q.foam:Q.fall[q<.35?0:q<.75?1:2];if(nz<.03)c=Q.foam;if(yy>=0&&yy<H2&&dz<n-1)FL.push(fx,yy,-1,(hs(afx,0,542)*20)|0)}
        else if(wall){const row=Math.floor(dz/3),off=(row&1)*3;c=dz%3===0||(afx+off)%6===0?WAY_COL.stone[2]:WAY_COL.stone[hs(Math.floor((afx+off)/6),row,333)<.5?0:1]}
        else if(rocky){const RC=Q.rock;c=tmix(f<.5?RC[2]:RC[3],Q.face[2],.25);c=tmix(c,RC[4]||RC[3],Math.min(.5,f*.5));if(zh%lh===0)c=tmul(c,.62);else if((zh+1)%lh===0)c=tmul(RC[1],.95);
          if(nz<.1)c=tmul(c,.86);if(wnoise2(afx/3,(fy+dz)/6,334)>.7)c=tmul(c,.9);if(snowy&&(zh%lh===0||zh%lh===lh-1)&&nz<.7)c=Q.snow[1]}
        else if(sand)c=tmix(Q.sand[0],Q.wet[1],f*.8);
        else{c=dz===1?Q.lip:dz===2&&nz<.5?Q.lip:tmix(Q.bank[0],Q.bank[2],f);if(nz<.06)c=tmul(c,.85)}
        const o=(yy*W2+fx)*4;O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2];O[o+3]=255;DEPF[yy*W2+fx]=fy;TOP[yy*W2+fx]=0}}
    // (above the first: the map's north edge lifted away, its ground carried up)
    if(first>0){const o0=(first*W2+fx)*4;for(let yy=0;yy<first;yy++){const o=(yy*W2+fx)*4;O[o]=O[o0];O[o+1]=O[o0+1];O[o+2]=O[o0+2];O[o+3]=255}}
    if(!(fx&31))yield}
  // (the bridges are a layer of their own over it, the land whole under them: worldways.js bridgeEnts)
  rec.fcv=mkcv(W2,H2);rec.fcv.getContext('2d').putImageData(out,0,0);rec.fr=r;
  // (the water that moves (the lab's): the shore's px the foam rides (x, y on the picture, a phase), the rivers' px (x, y, how far
  //  along, a phase; along -1 a fall's))
  rec.shore=Int16Array.from(SH);rec.flow=Int16Array.from(FL);
  // (each game px drawn as water or not (its fine px's middle): what a man in water is drawn by, so none wades on the drawn bank)
  {const WE=rec.wet=new Uint8Array(w*h);for(let y=0;y<h;y++)for(let x=0;x<w;x++){const f=(y*r+(r>>1))*W2+x*r+(r>>1);WE[y*w+x]=WF[f]?WK[f]||1:0}
    // (each water px's distance to the drawn land, game px (3 a step, 4 aslant, then /3; the chunk's edge not land), for how deep a man
    //  there stands: drawnDepth)
    const SD=rec.shd=new Uint8Array(w*h),D=new Uint16Array(w*h);for(let k=0;k<w*h;k++)D[k]=WE[k]?765:0;
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){const k=y*w+x;if(!D[k])continue;let v=D[k];if(x>0)v=Math.min(v,D[k-1]+3);if(y>0){v=Math.min(v,D[k-w]+3);if(x>0)v=Math.min(v,D[k-w-1]+4);if(x<w-1)v=Math.min(v,D[k-w+1]+4)}D[k]=v}
    for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const k=y*w+x;if(!D[k])continue;let v=D[k];if(x<w-1)v=Math.min(v,D[k+1]+3);if(y<h-1){v=Math.min(v,D[k+w]+3);if(x<w-1)v=Math.min(v,D[k+w+1]+4);if(x>0)v=Math.min(v,D[k+w-1]+4)}D[k]=v}
    for(let k=0;k<w*h;k++)SD[k]=Math.min(255,Math.round(D[k]/3))}
  // (what the view reads of it: each game px's lift (fine px) on the chunk's ground, and each screen game px's ground row, game px)
  {const LI=rec.lift=new Int16Array(w*h),DE=rec.dep=new Int16Array(w*h).fill(-1);for(let y=0;y<h;y++)for(let x=0;x<w;x++){LI[y*w+x]=LFF[(y*r+(r>>1))*W2+x*r+(r>>1)];const d=DEPF[(y*r)*W2+x*r];DE[y*w+x]=d<0?-1:Y+((d/r)|0)}}
  const vis=(jx,jy)=>{const L=lfAt(jx,jy),sy=jy-Y*r-L,sx=jx-X*r;return sy<0?-2:sy>=H2||sx<0||sx>=W2?-3:DEPF[sy*W2+sx]===jy-Y*r&&TOP[sy*W2+sx]?sy:-1};
  yield* terrainProps(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r,vis,Lv,St,at,{RF,DF,seaT,seaAt,dw:(gx,gy)=>{const q=eq(gx,gy);return q>=0&&q<EW*EH?DW[q]:99},bankF,LF,lfAt,DEPF,W2,H2,PL})}

/* the land's nature on the chunk (the world lab's: engine/worldflora.js, WORLD_FLORA): on a grid of step fine px, each cell's
   thing by its ground and climate: trees in the woods (their kind by where they stand: lowland, waterside, hills, mountain, a
   village's), bushes, logs, stumps, ferns and mushrooms under them; trees, bushes, boulders, stones, flowers (agaves and bones in
   the desert) on open ground and hills; boulders and stones up the mountains; cattails on the banks. None on water, a road, a lot, a
   ford, what the game painted over the ground or a face. rec.props: {x, y (its foot, game px), s (its picture, fine px), ax, ay,
   low (flat: no cover)}, sorted by y; rec.grass: the clumps (fine px, kind, variant), sorted by y */
function* terrainProps(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r,vis,Lv,St,at,WB){
  const LAND=waysOf(P).land,FL=PX.flora,WF=WORLD_FLORA,st=WF.step,out=[],GX=[],GY=[],GT=[],GV=[],W2=w*r,H2=h*r,near=(gx,gy,d,f)=>{for(let b=-d;b<=d;b++)for(let a=-d;a<=d;a++){const u=(gx>>4)+a,v=(gy>>4)+b;if(u>=0&&v>=0&&u<MW&&v<MH&&f(v*MW+u,u,v))return true}return false};
  const ok=(gx,gy,fx,fy)=>{const fo=((gy-Y)*w+gx-X)*4,go=((gy-y0)*ww+gx-x0)*4,ti=(gy>>4)*MW+(gx>>4),fi=(fy-Y*r)*W2+fx-X*r;if(WB.seaAt(gx,gy)||WB.RF.S[fi]<2*r||WB.DF.S[fi]<3*r||WB.PL[fi])return false;
    if(F[fo]!==G[go]||F[fo+1]!==G[go+1]||F[fo+2]!==G[go+2])return false;if(vis(fx,fy)===-1)return false;if(typeof occAt==='function'&&occAt(gx>>4,gy>>4)>0)return false;
    return true};
  // (a prop's picture cut where the ground in front of it is drawn over it: a ridge nearer hides what stands behind it, as the lab's
  //  occluded; within this chunk's picture)
  const cutPic=(o,jx,jy)=>{const L=WB.lfAt(jx,jy),img=o.img,w0=img.width,h0=img.height,sx0=jx-o.ax-X*r,sy0=jy-L-o.ay-Y*r,D=WB.DEPF,W2=WB.W2,lim=jy-Y*r+r;let any=false;
    for(let y=Math.max(0,sy0);y<Math.min(WB.H2,sy0+h0)&&!any;y++)for(let x=Math.max(0,sx0);x<Math.min(W2,sx0+w0);x++)if(D[y*W2+x]>lim){any=true;break}
    if(!any)return img;const c=mkcv(w0,h0),g=c.getContext('2d');g.drawImage(img,0,0);const d=g.getImageData(0,0,w0,h0),A=d.data;
    for(let y=0;y<h0;y++){const yy=sy0+y;if(yy<0||yy>=WB.H2)continue;for(let x=0;x<w0;x++){const xx=sx0+x;if(xx>=0&&xx<W2&&D[yy*W2+xx]>lim)A[(y*w0+x)*4+3]=0}}g.putImageData(d,0,0);return c};
  const pickOf=(mix,h)=>{let tot=0,sp=null;for(const q in mix)tot+=mix[q];let q=h*tot;for(const k in mix){sp=k;if((q-=mix[k])<0)break}return sp};
  let lastLook=null;const look=cl=>{if(lastLook===cl)return;lastLook=cl;FL.look=WF.look[cl];FL.cap=WF.look[cl].snow};
  for(let fy=Y*r+2;fy<(Y+h)*r;fy+=st){for(let fx=X*r+2;fx<(X+w)*r;fx+=st){const jx=Math.round(fx+(hs(fx,fy,401)-.5)*st),jy=Math.round(fy+(hs(fx,fy,402)-.5)*st);
      if(jx<X*r||jy<Y*r||jx>=(X+w)*r||jy>=(Y+h)*r)continue;const gx=Math.floor(jx/r),gy=Math.floor(jy/r);if(!ok(gx,gy,jx,jy))continue;
      const ti=(gy>>4)*MW+(gx>>4),t=tiles[ti],cl=CLIMS[terClimate(gx,gy)],C=WF.chance[cl],v=Math.floor(hs(fx,fy,403)*8),q0=hs(fx,fy,404),e=Lv[at(gx,gy)];
      // (the hills' and mountains' trees by the land's height (and a little noise), not by the tile's kind: no edge along the tiles)
      const eh=e+(wnoise2(gx/30,gy/30,604)-.5)*1.6,mix=WF.trees[cl],zone=t===T_MOUNT||eh>=WORLD_TERRAIN.rock-1?'mountain':eh>=GEN_RELIEF.hill[1]-2?'hills':near(gx,gy,1,i=>(WM.river[i]&3)&&tiles[i]===T_WATER)?'waterside':near(gx,gy,2,(i,u,v)=>typeof occAt==='function'&&occAt(u,v)>0)?'village':'lowland';
      const put=(o,kind,low)=>{if(o)out.push({x:jx/r,y:jy/r,s:cutPic(o,jx,jy),ax:o.ax,ay:o.ay,kind,low:!!low})};
      look(cl);let q=q0;
      // (the swamp's pools, the lab's: lily pads on them, reeds round their edges)
      {const fi=(jy-Y*r)*W2+jx-X*r,PO=C.pool;if(PO&&[4,-4,4*W2,-4*W2].some(o=>WB.PL[fi+o])&&(q-=PO.reeds)<0){put(FL.cattailPic(v),'reeds');continue}}
      if(terWood(LAND,gx,gy)>.5){if((q-=C.woods*.4)<0){put(FL.treePic(pickOf(mix[zone],hs(fx,fy,405)),v%6,hs(fx,fy,406)<.15?0:hs(fx,fy,407)<.1?2:1,cl==='frost'||e>=WORLD_TERRAIN.snow-3),'tree');continue}
        const W2c=C.woods2;if(W2c.bush&&(q-=W2c.bush)<0){put(FL.bushPic(v,FL.look.bush==='oak'?(v&1?'dark':'oak'):FL.look.bush),'bush');continue}if(W2c.log&&(q-=W2c.log)<0){put(FL.logPic(10+v,v),'log',true);continue}
        if(W2c.stump&&(q-=W2c.stump)<0){put(FL.stumpPic(v),'stump',true);continue}if(W2c.fern&&(q-=W2c.fern)<0){put(FL.fernPic(v),'fern',true);continue}
        if(W2c.mushroom&&(q-=W2c.mushroom)<0){put(FL.mushroomPic(v),'mushroom',true);continue}if(W2c.agave&&(q-=W2c.agave)<0){put(FL.agavePic(v),'agave',true);continue}}
      else{const Z=t===T_MOUNT?C.mountain:t===T_HILL?C.hills:C.open;
        if(Z.tree&&(q-=Z.tree)<0){put(FL.treePic(pickOf(mix[zone],hs(fx,fy,405)),v%6,hs(fx,fy,406)<.4?0:1,cl==='frost'||e>=WORLD_TERRAIN.snow-3),'tree');continue}
        if(Z.bush&&(q-=Z.bush)<0){put(FL.bushPic(v,FL.look.bush==='oak'?(v&1?'oak':'birch'):FL.look.bush),'bush');continue}
        if(Z.boulder&&(q-=Z.boulder)<0){put(FL.boulderPic(v,11+(v%4)*3,FL.look.moss),'rock');continue}if(Z.stone&&(q-=Z.stone)<0){put(FL.stonePic(3+(v%4),v),'stone',true);continue}
        if(Z.flowers&&(q-=Z.flowers)<0){put(FL.flowersPic(v+Math.floor(hs(fx,fy,408)*3)*8),'flowers',true);continue}if(Z.agave&&(q-=Z.agave)<0){put(FL.agavePic(v),'agave',true);continue}
        if(Z.bones&&(q-=Z.bones)<0){put(FL.bonesPic(v),'bones',true);continue}
        const rb=WB.RF.S[(jy-Y*r)*W2+jx-X*r];if(rb<WB.bankF*1.5&&C.bank.cattail&&(q-=C.bank.cattail)<0){put(FL.cattailPic(v),'reeds');continue}}}
    if(!(fy&63))yield}
  // (lily pads on the swamp's pools, flat on the water)
  for(let fy=Y*r+2;fy<(Y+h)*r;fy+=st)for(let fx=X*r+2;fx<(X+w)*r;fx+=st){const jx=Math.round(fx+(hs(fx,fy,416)-.5)*st),jy=Math.round(fy+(hs(fx,fy,417)-.5)*st);
    if(jx<X*r||jy<Y*r||jx>=(X+w)*r||jy>=(Y+h)*r||!WB.PL[(jy-Y*r)*W2+jx-X*r]||vis(jx,jy)===-1)continue;const PO=WF.chance[CLIMS[terClimate(jx/r|0,jy/r|0)]].pool;
    if(PO&&hs(fx,fy,418)<PO.lily){const o=FL.lilyPic(Math.floor(hs(fx,fy,419)*8));out.push({x:jx/r,y:jy/r,s:o.img,ax:o.ax,ay:o.ay,kind:'lily',low:true})}}
  FL.cap=false;
  // (the ground trodden bare just south of a prop's foot, the lab's (makeGrass): a strip as deep as a clump is tall, as wide as the
  //  prop's lowest rows and 4 px more each side, where a clump would stand over its foot)
  const BW2=W2,BH2=h*r,BARE=new Uint8Array(BW2*BH2);
  for(const p of out){if(p.low)continue;const im=p.s;if(!im.foot){let a=1e9,b=-1;try{const y0=Math.max(0,im.height-FL.GH),d=im.getContext('2d').getImageData(0,y0,im.width,im.height-y0).data;
        for(let k=3;k<d.length;k+=4)if(d[k]===255){const x=(k>>2)%im.width;if(x<a)a=x;if(x>b)b=x}}catch(e){}im.foot=[a,b]}
    if(im.foot[1]<0)continue;const jx=Math.round(p.x*r)-X*r,jy=Math.round(p.y*r)-Y*r,xa=Math.max(0,jx-p.ax+im.foot[0]-4),xb=Math.min(BW2-1,jx-p.ax+im.foot[1]+4);
    for(let y=Math.max(0,jy+1);y<=Math.min(BH2-1,jy+FL.GH);y++)BARE.fill(1,y*BW2+xa,y*BW2+xb+1)}
  // (the grass's clumps: on a grid of its step, by the ground's kind (open, meadow, woods, dunes) and climate, thicker in patches)
  const GS=WF.grass,KI=FL.GRASS_KINDS;
  for(let fy=Y*r+1;fy<(Y+h)*r;fy+=GS.step){for(let fx=X*r+1;fx<(X+w)*r;fx+=GS.step){const jx=Math.round(fx+(hs(fx,fy,411)-.5)*GS.step),jy=Math.round(fy+(hs(fx,fy,412)-.5)*GS.step);
      if(jx<X*r||jy<Y*r||jx>=(X+w)*r||jy>=(Y+h)*r||BARE[(jy-Y*r)*BW2+jx-X*r])continue;const gx=Math.floor(jx/r),gy=Math.floor(jy/r);if(!ok(gx,gy,jx,jy))continue;const ti=(gy>>4)*MW+(gx>>4),t=tiles[ti];if(t===T_MOUNT)continue;
      const cl=CLIMS[terClimate(gx,gy)],dd=WB.dw(gx,gy),g=terWood(LAND,gx,gy)>.5?'woods':dd*2<WORLD_TERRAIN.dune?'dune':wnoise2(jx/120,jy/120,344)>.62?'meadow':'open';
      const ch=GS.chance[cl][g]*(.35+1.3*wnoise2(jx/GS.patch,jy/GS.patch,413));if(hs(fx,fy,414)>ch)continue;
      {const L=WB.lfAt(jx,jy);GX.push(jx);GY.push(jy-L)}GT.push(Math.max(0,KI.indexOf(GS.kinds[cl][g])));GV.push(Math.floor(hs(fx,fy,415)*4))}
    if(!(fy&63))yield}
  out.sort((a,b)=>a.y-b.y);rec.props=out;
  const ord=GX.map((_,k)=>k).sort((a,b)=>GY[a]-GY[b]);rec.grass={X:Int32Array.from(ord.map(k=>GX[k])),Y:Int32Array.from(ord.map(k=>GY[k])),T:Uint8Array.from(ord.map(k=>GT[k])),V:Uint8Array.from(ord.map(k=>GV[k])),P:new Float32Array(ord.length),n:ord.length}}

// (a prop's picture at game px, for the depth overdraw's mask (gfx/depth.js depthPic): its fine picture taken down, kept on it)
const terrainHalf=(s,r)=>s._h||(s._h=mkc(Math.ceil(s.width/r),Math.ceil(s.height/r),g=>{g.imageSmoothingEnabled=false;g.drawImage(s,0,0,s.width/r,s.height/r)}));
/* the props and grass of the chunks in view, into the scene (render.js drawWorld): each prop among the buildings by its foot (st: kept
   with the scene, remembered under the fog), what stands put in the depth overdraw's pictures so a man behind it is covered; the
   grass first, flat on the ground: each clump leaning by the wind (two waves rolling across the land) and bent away from you as you
   pass (WORLD_FLORA.grass push px; springing back over spring s), written into one buffer at the scene's resolution and laid once */
const TGRASS={buf:null,cv:null,t:0};
// a man standing in the grass, the lab's (its clumps in order of their feet with him): the clumps whose foot is just south of his (within
// a clump's height) and within hw game px of him either side drawn again over him, as they lean this frame. (x, y): his foot, game px;
// drawn where the scene's transform is (up by LIFT_NOW in liftDraw)
const GRASS_OVER={buf:null,cv:null};
function grassOver(x,y,hw){const r=typeof sceneRes==='function'?sceneRes():1,T=TGRASS;if(r<=1||!T.recs||!T.cam||!PX.flora)return;const FL=PX.flora,A=FL.grassAtlas(),n=FL.lean,GW=FL.GW,GH=FL.GH,
    L=typeof LIFT_NOW==='number'?LIFT_NOW:0,fy=Math.round((y-L)*r),fx0=Math.round((x-hw)*r)-GW,fx1=Math.round((x+hw)*r)+GW,BW=fx1-fx0+1,BH=2*GH+2,oy=fy-GH;let U=null,BWb=0;
  for(const c of T.recs){const Gr=c.grass;if(!Gr||!Gr.L)continue;let lo=0,hi=Gr.n;while(lo<hi){const m=(lo+hi)>>1;if(Gr.Y[m]<=fy)lo=m+1;else hi=m}
    for(let k=lo;k<Gr.n&&Gr.Y[k]<=fy+GH;k++){const X=Gr.X[k];if(X<fx0+GW||X>fx1-GW)continue;
      if(!U){if(!GRASS_OVER.buf||GRASS_OVER.buf.width<BW||GRASS_OVER.buf.height<BH){GRASS_OVER.buf=new ImageData(Math.max(BW,64),Math.max(BH,32));GRASS_OVER.buf.u=new Uint32Array(GRASS_OVER.buf.data.buffer);GRASS_OVER.cv=mkcv(GRASS_OVER.buf.width,GRASS_OVER.buf.height)}
        U=GRASS_OVER.buf.u;U.fill(0);BWb=GRASS_OVER.buf.width}
      const sp=A.px[(Gr.T[k]*4+Gr.V[k])*(2*n+1)+Gr.L[k]+n],D=sp.D,Cc=sp.C,bx=X-fx0-5,by=Gr.Y[k]-oy-9;
      for(let j=0,q=0;j<Cc.length;j++,q+=2){const px=bx+D[q],py=by+D[q+1];if(px>=0&&py>=0&&px<BW&&py<BH)U[py*BWb+px]=Cc[j]}}}
  if(!U)return;GRASS_OVER.cv.getContext('2d').putImageData(GRASS_OVER.buf,0,0,0,0,BW,BH);
  ctx.drawImage(GRASS_OVER.cv,0,0,BW,BH,fx0/r-T.cam.x,oy/r+L-T.cam.y,BW/r,BH/r)}
// footprints, the lab's (LAB.prints; the owner, 2026-11-16: "Do all that"): a man walking leaves a print every step px, left and right of his
// way, where the ground takes one (printGround: snow, sand, the marsh, wet ground by the water), fading over fade s; kept in a ring
// (fine px x, y lifted with the land, the time, the ground, the side), drawn under the grass (terrainEnts)
const FOOTPRINTS={buf:null,n:0,at:0,walk:new WeakMap()};
function printGround(x,y){const t=terrAt(x,y);if(t===T_WATER||t===T_FORD||t===T_ROAD||t===T_MOUNT||RoadBand.on(x,y))return -1;const c=CLIMS[terClimate(Math.floor(x),Math.floor(y))],K=WORLD_TERRAIN.prints.kinds;
  if(c==='frost'||(WM.lv&&WM.lv[Math.floor(y/TILE)*MW+Math.floor(x/TILE)]>=SLOPE.snow))return K.snow;if(c==='desert')return K.sand;if(c==='swamp')return K.marsh;
  const b=WORLD_TERRAIN.prints.bank;return drawnWet(x+b,y)||drawnWet(x-b,y)||drawnWet(x,y+b)||drawnWet(x,y-b)?K.wet:-1}
function stepPrint(u){const F=FOOTPRINTS,PR=WORLD_TERRAIN.prints,r=typeof sceneRes==='function'?sceneRes():1;if(r<=1)return;let w=F.walk.get(u);if(!w){F.walk.set(u,{x:u.x,y:u.y,d:0,side:1});return}
  const dx=u.x-w.x,dy=u.y-w.y,l=Math.hypot(dx,dy);w.x=u.x;w.y=u.y;if(!l||l>PR.step*4)return;w.d+=l;if(w.d<PR.step)return;w.d=0;w.side=-w.side;
  const px=u.x-dy/l*w.side*PR.side,py=u.y+dx/l*w.side*PR.side,g=printGround(px,py);if(g<0)return;
  if(!F.buf)F.buf=new Float32Array(PR.max*5);const o=F.at*5,B=F.buf;B[o]=px*r;B[o+1]=(py-liftAt(px,py))*r;B[o+2]=performance.now();B[o+3]=g;B[o+4]=w.side;F.at=(F.at+1)%PR.max;F.n=Math.min(PR.max,F.n+1)}
// (the blend's scratch, kept between chunks)
let TER_BLUR=null;
const terBlurBuf=n=>TER_BLUR&&TER_BLUR.length>=n?TER_BLUR:(TER_BLUR=new Float32Array(n));
// (a river's run, its current's line: its line smoothed over smooth times its half-width each way (a wide one's line wanders within
// its water: its current runs straighter), and each point's distance along it, game px)
function riverRun(WY){const X=WY.X,Y=WY.Y,n=X.length,SX=new Float32Array(n),SY=new Float32Array(n),C=new Float32Array(n),on=new Uint8Array(n),D=new Float32Array(n),K=WORLD_WAYS.river.flow.smooth;
  for(const k of WY.SP)on[k]=1;
  for(let k0=0;k0<n;){let k1=k0;while(k1<n-1&&on[k1])k1++;
    for(let k=k0+1;k<=k1;k++)D[k]=D[k-1]+Math.hypot(X[k]-X[k-1],Y[k]-Y[k-1]);
    for(let k=k0;k<=k1;k++){const R=Math.max(1,WY.HW[k]*K);let sx=0,sy=0,sw=0;for(let j=k;j>=k0&&D[k]-D[j]<=R;j--){const w=1-(D[k]-D[j])/R;sx+=X[j]*w;sy+=Y[j]*w;sw+=w}
      for(let j=k+1;j<=k1&&D[j]-D[k]<=R;j++){const w=1-(D[j]-D[k])/R;sx+=X[j]*w;sy+=Y[j]*w;sw+=w}SX[k]=sx/sw;SY[k]=sy/sw}
    for(let k=k0+1;k<=k1;k++)C[k]=C[k-1]+Math.hypot(SX[k]-SX[k-1],SY[k]-SY[k-1]);k0=k1+1}
  return {X:SX,Y:SY,C}}
// (the climate at game px (gx, gy) as the painter picks it (terrainChunk): read at a place warped by noise, picked from the tiles'
// shares round it by a hash, so a prop's kind changes with the ground's, never along a tile's edge)
function terClimate(gx,gy){const T=WORLD_TERRAIN,wgx=gx+(wnoise2(gx/23,gy/23,601)-.5)*2*T.climWarp,wgy=gy+(wnoise2(gx/23,gy/23,602)-.5)*2*T.climWarp,u=(wgx-8)/16,v=(wgy-8)/16,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,
    cl=(a,b)=>climate[Math.max(0,Math.min(MH-1,b))*MW+Math.max(0,Math.min(MW-1,a))],cw=[0,0,0,0];
  cw[cl(tx,ty)]+=(1-fu)*(1-fv);cw[cl(tx+1,ty)]+=fu*(1-fv);cw[cl(tx,ty+1)]+=(1-fu)*fv;cw[cl(tx+1,ty+1)]+=fu*fv;
  const pk=hs(gx,gy,603);let acc=0;for(let c=0;c<4;c++){acc+=cw[c];if(pk<acc)return c}return cl(gx>>4,gy>>4)}
function terrainEnts(ents,cam){const r=sceneRes();bridgeEnts(ents,cam);if(r<=1)return;const WA=WorldArt,x0=cam.x-48,x1=cam.x+VW+48,y0=cam.y-8,y1=cam.y+VH+64,FL=PX.flora;
  const c0=Math.max(0,Math.floor(x0/CHUNK)),c1=Math.min(WA.cols-1,Math.floor(x1/CHUNK)),r0=Math.max(0,Math.floor(y0/CHUNK)),r1=Math.min(WA.rows-1,Math.floor(y1/CHUNK));
  const recs=[];for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const c=WA.chunks.get(cy*WA.cols+cx);if(c&&c.props&&c.fr===r)recs.push(c)}
  // (the grass)
  {const now=performance.now(),dt=Math.min(.1,(now-(TGRASS.t||now))/1000),G=WORLD_FLORA.grass,t=now/1000,BW=(VW+1)*r,BH=(VH+1)*r,A=FL.grassAtlas(),n=FL.lean,GW=FL.GW,GH=FL.GH,
      w1=t*1.9,w2=t*G.gust[1]*6.28/3,g2=6.28/G.gust[0],hx=P.x*r,hy=P.y*r,R2=G.push,dec=Math.exp(-dt/G.spring*2.3);TGRASS.t=now;
    if(!TGRASS.buf||TGRASS.buf.width!==BW||TGRASS.buf.height!==BH){TGRASS.buf=new ImageData(BW,BH);TGRASS.buf.u=new Uint32Array(TGRASS.buf.data.buffer);TGRASS.cv=mkcv(BW,BH)}
    const U=TGRASS.buf.u;U.fill(0);let any=false;
    // (footprints, the lab's, fading: under the grass)
  {const F=FOOTPRINTS,PR=WORLD_TERRAIN.prints,nw=now,B=F.buf;for(let k=0;k<F.n;k++){const o=k*5,a=1-(nw-B[o+2])/1000/PR.fade;if(a<=0)continue;const x=Math.round(B[o]-cam.x*r),y=Math.round(B[o+1]-cam.y*r);
      if(x<0||y<0||x>=BW-1||y>=BH-1)continue;const c=PR.col[B[o+3]],v=(Math.round(204*a)<<24|c[2]<<16|c[1]<<8|c[0])>>>0;U[y*BW+x]=v;U[y*BW+x+1]=v;U[(y+1)*BW+x+(B[o+4]>0?1:0)]=v;any=true}}
  // (the water moving, the lab's: foam riding the shore, the river's current in streaks running down it (a lit crest, a darker trough
    //  behind it, each px of a streak sharing its phase with those beside it, so they run as lines, not dots), white down a fall)
    {const ts=now/1000,FO=0xd8f6f4ec,SP=0x5cf2ece0,SL=0x30eee4d4,WF=0x99fffcfa,RW=WORLD_WAYS.river.flow;
      for(const c of recs){const S=c.shore,F=c.flow,ox=c.cx*CHUNK*r-cam.x*r-5+5,oy=c.cy*CHUNK*r-cam.y*r;
        if(S)for(let k=0;k<S.length;k+=3){const x=S[k]+ox,y=S[k+1]+oy;if(x<0||y<0||x>=BW||y>=BH)continue;if(Math.sin(ts*1.6+S[k+2]/100)>.45){U[y*BW+x]=FO;any=true}}
        if(F)for(let k=0;k<F.length;k+=4){const x=F[k]+ox,y=F[k+1]+oy;if(x<0||y<0||x>=BW||y>=BH)continue;
          if(F[k+2]===-1){if((((F[k+1]+c.cy*CHUNK*r)*.5-ts*24+F[k+3])%5+5)%5<1){U[y*BW+x]=WF;any=true}}
          else if(F[k+2]===-2){if(((ts*7+F[k+3]*.37)|0)%4===0){U[y*BW+x]=(F[k+3]&1)?WF:SP;any=true}}else{const q=((F[k+2]-ts*RW.speed+F[k+3])%RW.period+RW.period)%RW.period;if(q<RW.len){U[y*BW+x]=q>RW.len-1.2?WF:q>RW.len*.4?SP:SL;any=true}}}}}
    for(const c of recs){const Gr=c.grass;if(!Gr)continue;const fy0=cam.y*r-4,fy1=(cam.y+VH)*r+GH;let lo=0,hi=Gr.n;while(lo<hi){const m=(lo+hi)>>1;if(Gr.Y[m]<fy0)lo=m+1;else hi=m}
      for(let k=lo;k<Gr.n&&Gr.Y[k]<=fy1;k++){const X=Gr.X[k],Y=Gr.Y[k],bx=X-cam.x*r-5,by=Y-cam.y*r-9;if(bx<-GW||bx>BW)continue;any=true;
        const wind=G.wind*(Math.sin(w1+X*.05+Y*.03)+.8*Math.sin(w2+X*g2-Y*.01));let Pv=Gr.P[k];if(Pv){Pv*=dec;if(Pv<.05&&Pv>-.05)Pv=0}const dx=X-hx,dy=(Y-hy)*1.5;
        if(dx<R2&&dx>-R2&&dy<R2&&dy>-R2){const d=Math.hypot(dx,dy);if(d<R2){const p=(dx>=0?1:-1)*n*(1-d/R2)*1.2;if(Math.abs(p)>Math.abs(Pv))Pv=p}}Gr.P[k]=Pv;
        const lean=Math.max(-n,Math.min(n,Math.round(Pv?wind*(1-Math.min(1,Math.abs(Pv)/n)*.7)+Pv:wind))),sp=A.px[(Gr.T[k]*4+Gr.V[k])*(2*n+1)+lean+n],D=sp.D,Cc=sp.C;(Gr.L||(Gr.L=new Int8Array(Gr.n)))[k]=lean;
        for(let j=0,q=0;j<Cc.length;j++,q+=2){const x=bx+D[q],y=by+D[q+1];if(x>=0&&y>=0&&x<BW&&y<BH)U[y*BW+x]=Cc[j]}}}
    if(any){TGRASS.cv.getContext('2d').putImageData(TGRASS.buf,0,0);ctx.drawImage(TGRASS.cv,0,0,BW/r,BH/r)}}
  TGRASS.recs=recs;TGRASS.cam=cam;
  // (the props, by their feet, among the buildings)
  for(const c of recs)for(const p of c.props){const X=p.x-p.ax/r,Y=p.y-p.ay/r;if(X>x1||X+p.s.width/r<x0||p.y<y0||Y>y1)continue;
    ents.push({st:true,x:p.x,y:p.y,f:()=>{const sx=Math.round((X-cam.x)*r)/r,sy=Math.round((Y-cam.y)*r)/r;ctx.drawImage(p.s,sx,sy,p.s.width/r,p.s.height/r);if(!p.low)depthPic(terrainHalf(p.s,r),sx,sy,p.ay/r)}})}}

// a land px's top colour (the lab's topCol): its kind by its tile, height, slope and the water near it; its climate's grain on it
function terLand(Q,c,t,e,g,dd,open,fx,fy,wd){const T=WORLD_TERRAIN,cl=CLIMS[c],wob=wnoise2(fx/50,fy/50,341)-.5,dw=dd*2;let k,col;
  // (the lab's: rock from its height up or where it is a cliff, snow over it but on a cliff; scree where it is steep)
  if(e>=T.rock+wob*3||g>=T.cliffG)k=e>=T.snow+wob*2.4&&g<T.cliffG?TERK.snow:TERK.rock;
  else if(g>=T.steepG&&e>2)k=TERK.scree;
  else if(dw<T.wet+wob*4&&open)k=TERK.wet;else if(dw<T.sand+wob*12&&open&&e<1.2)k=TERK.sand;else if(dw<T.dune+wob*20&&open&&e<1.6&&cl!=='swamp')k=TERK.dune;
  else if(!open&&dw<T.bank)k=TERK.bank;
  else if(wd>.5)k=TERK.wood;
  else k=wnoise2(fx/120,fy/120,344)>.62?TERK.meadow:TERK.grass;
  TER_K=k;
  switch(k){
    case TERK.snow:col=tpick(Q.snow,fx,fy,345);break;
    case TERK.rock:{col=tpick(Q.rock.slice(0,3),fx,fy,346);const gp=wnoise2(fx/14,fy/14,347);if(gp>.62&&e<T.snow-1)col=tmix(col,Q.grass[0],.5);break}
    case TERK.scree:col=tmix(tpick(Q.scree,fx,fy,348),Q.grass[0],hs(fx>>2,fy>>2,349)<.3?.4:0);break;
    case TERK.wet:col=tpick(Q.wet,fx,fy,350);break;case TERK.sand:col=tpick(Q.sand,fx,fy,351);break;
    case TERK.dune:col=tmix(tpick(Q.sand,fx,fy,352),Q.dune[hs(fx,fy,353)<.5?0:1],.45);break;
    case TERK.bank:col=tmix(tpick(Q.mud,fx,fy,354),Q.grass[0],Math.min(1,dw/T.bank));break;
    case TERK.wood:col=tpick(Q.wood,fx,fy,355);break;case TERK.meadow:col=tpick(Q.meadow,fx,fy,356);break;
    default:col=tpick(Q.grass,fx,fy,357)}
  // (the lab's blend: a wood's floor and the grass round it shading into each other over its ragged edge)
  if(wd>.2&&wd<.8&&(k===TERK.wood||k===TERK.grass||k===TERK.meadow))col=tmix(col,k===TERK.wood?tpick(Q.grass,fx,fy,357):tpick(Q.wood,fx,fy,355),.5-Math.abs(wd-.5));
  // (the climate's own grain: the desert's ripples and cracked clay; the tundra's snow lying in patches; the bog's wet shine)
  if(cl==='desert'){if(k===TERK.grass||k===TERK.dune)col=tmul(col,1+.05*Math.sin(fx*.3+fy*.85+wnoise2(fx/20,fy/20,358)*7));else if(k===TERK.meadow&&(Math.abs(wnoise2(fx/6,fy/6,359)-.5)<.03||Math.abs(wnoise2(fx/6+40,fy/6,360)-.5)<.03))col=tmul(col,.78)}
  else if(cl==='frost'&&k===TERK.grass&&wnoise2(fx/26,fy/26,361)*.7+wnoise2(fx/9,fy/9,362)*.3>.56)col=tpick(Q.meadow,fx,fy,363);
  else if(cl==='swamp'&&k===TERK.meadow&&wnoise2(fx/5,fy/5,364)>.72)col=tmix(col,[120,136,130],.35);
  // (higher land a little cooler)
  if(k>=TERK.grass&&k<=TERK.wood&&e>3)col=tmix(col,Q.cool,Math.min(.35,(e-3)*.04));
  return col}
// a water px's colour (the lab's underWater): by its depth (the sea's or a lake's by its tile's depth and the shore near; a river's
// deepest down its middle), its bed (sand, pebbles) showing in the shallows, light caught there; foam at the shore; the frost's
// shallow sea frozen
// (the sea's depth class between the tiles' middles, smooth (a cubic B-spline over them, read at a warped place): its colour never
// stepping along a tile's edge (the owner: "make sure the map generation dont have this kind if flat stair anywhere"))
function terDepth(P,gx,gy){const A=P._depF||(P._depF=Float32Array.from(P.dep,v=>v===9?4:Math.min(4,v+1))),wx=gx+(wnoise2(gx/40,gy/40,605)-.5)*20,wy=gy+(wnoise2(gx/40,gy/40,606)-.5)*20;
  return labAt(A,MW,MH,(wx-8)/16,(wy-8)/16)}
function terWater(Q,c,m,dd,P,gx,gy,fx,fy){const T=WORLD_TERRAIN,river=m===2||m===3,d=river?Math.min(1.4,dd*.14):Math.min(terDepth(P,gx,gy)*T.depth*2,dd*.09);
  if(CLIMS[c]==='frost'&&!river&&d<.45+(wnoise2(fx/40,fy/40,371)-.5)*.5){let col=tpick(Q.ice,fx,fy,372);if(Math.abs(wnoise2(fx/10,fy/10,373)-.5)<.018)col=tmul(col,.86);return col}
  const S=river?Q.river:Q.sea,bed=river?Q.pebble[Math.floor(hs(fx>>1,fy>>1,374)*4)]:Q.bed[Math.sin(fx*.35+fy*.12+wnoise2(fx/12,fy/12,375)*6)>.55?0:1];
  let col=d<.4?tmix(S[0],S[1],d/.4):d<1?tmix(S[1],S[2],(d-.4)/.6):tmix(S[2],S[3],Math.min(1,d-1));
  const a=Math.pow(Math.max(0,1-d/(river?.55:T.clear)),1.4);col=tmix(col,bed,a*.8);if(a>.15&&wnoise2(fx/3,fy/3,376)>.74)col=tmix(col,[232,246,246],.22*a);
  if(dd<1.3&&hs(fx,fy,377)>.35)col=tmix(col,Q.foam,.55);
  return col}

/* ---------- what stands on the land, lifted with it (the world lab's: engine/worldlab.js, the hero and the props drawn up the screen
   by their ground's lift; a ridge in front of one drawn again over him) ---------- */
// (the lift the thing being drawn is drawn at, game px: depth.js depthPic follows it)
let LIFT_NOW=0;
// the lift of the ground at map px (x, y), game px up the screen: the painted chunk's (rec.lift), else from the tiles' levels
// (whether game px (x, y) is drawn as water: its chunk's own (rec.wet) where it is painted fine, else its tile's band; drawnWater:
// its water's kind there, 1 the sea's or a lake's, 2 a river's, 3 a fall's, 0 none or not painted fine)
function drawnWater(x,y){x=Math.floor(x);y=Math.floor(y);if(typeof WorldArt==='undefined'||x<0||y<0||x>=MW*TILE||y>=MH*TILE)return 0;const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WorldArt.chunks.get(cy*WorldArt.cols+cx);
  return c&&c.wet&&c.wet[(y-cy*CHUNK)*c.cv.width+x-cx*CHUNK]||0}
// (how deep a man at game px (x, y) stands, levels: his tile's depth (map.js waterDepths; open water as deep as WATER.open), eased in
// from the drawn bank over WATER.draw.ramp px, the lab's (it reads the depth at his px); 0 where no water is drawn)
function drawnDepth(x,y){x=Math.floor(x);y=Math.floor(y);if(!drawnWet(x,y))return 0;const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE),dt=waterDepths(WM)[i],D=dt<0?WATER.open:dt;
  const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WorldArt.chunks.get(cy*WorldArt.cols+cx);if(!c||!c.shd)return D;
  const sd=c.shd[(y-cy*CHUNK)*c.cv.width+x-cx*CHUNK];return D*Math.min(1,(sd+.5)/WATER.draw.ramp)}
function drawnWet(x,y){x=Math.floor(x);y=Math.floor(y);if(typeof WorldArt==='undefined'||x<0||y<0||x>=MW*TILE||y>=MH*TILE)return false;const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WorldArt.chunks.get(cy*WorldArt.cols+cx);
  if(c&&c.wet){const w=c.cv.width,v=c.wet[(y-cy*CHUNK)*w+x-cx*CHUNK];if(v!==undefined)return v>0}return waterBand(Math.floor(y/TILE)*MW+Math.floor(x/TILE))>0}
function liftAt(x,y){if(!isFinite(x)||!isFinite(y)||typeof WorldArt==='undefined')return 0;x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=MW*TILE||y>=MH*TILE)return 0;
  const WA=WorldArt,cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WA.chunks.get(cy*WA.cols+cx);
  if(c&&c.lift){const w=c.cv.width,v=c.lift[(y-cy*CHUNK)*w+x-cx*CHUNK];if(v!==undefined)return v/(c.fr||1)}
  if(!WM||typeof landHeight!=='function')return 0;const r=typeof sceneRes==='function'?sceneRes():1;return Math.round(Math.max(0,landHeight(WM)(x*2+1,y*2+1))*WORLD_TERRAIN.lh)/r}
// the map point whose ground shows at the view's point (x, y) (the camera's map px plus the screen's): the chunk's own (rec.dep)
function liftGround(x,y){if(typeof WorldArt==='undefined')return{x,y};const fx=Math.floor(x),fy=Math.floor(y),WA=WorldArt,cx=Math.floor(fx/CHUNK),cy=Math.floor(fy/CHUNK),c=WA.chunks.get(cy*WA.cols+cx);
  if(c&&c.dep){const w=c.cv.width,d=c.dep[(fy-cy*CHUNK)*w+fx-cx*CHUNK];if(d>=0)return{x,y:d+(y-fy)}}return{x,y}}
// a thing drawn up by its ground's lift (e.x, e.ly or e.y: where it stands); a mover (front) has the ground in front of it drawn again
// over it, where a ridge nearer hides it (liftFront)
function liftDraw(e,front){const x=e.lx??e.x;if(x==null){e.f();return}const y=e.ly??e.y,L=liftAt(x,y);if(!L){e.f();if(front){liftFront(x,y,0);bridgeOver(x,y,0)}return}
  const was=LIFT_NOW,nl=LIGHTQ.length,nb=BANNERQ.length;LIFT_NOW=L;ctx.save();ctx.translate(0,-L);try{e.f()}finally{ctx.restore();LIFT_NOW=was}
  for(let i=nl;i<LIGHTQ.length;i++)LIGHTQ[i].y-=L;for(let i=nb;i<BANNERQ.length;i++)BANNERQ[i].lift=L;if(front){liftFront(x,y,L);bridgeOver(x,y,L)}}
// (the ground nearer than (x, y) where it shows over the man standing there: his box, a column at a time, from the chunk's picture)
function liftFront(x,y,L){const cam={x:Math.floor(G.cam.x),y:Math.floor(G.cam.y)},WA=WorldArt,top=Math.floor(y-L-26),bot=Math.floor(y-L),x0=Math.floor(x-9),x1=Math.floor(x+9),cx=Math.floor(x/CHUNK);
  const depAt=(px,py)=>{const c=WA.chunks.get(Math.floor(py/CHUNK)*WA.cols+Math.floor(px/CHUNK));if(!c||!c.dep||px<0||py<0)return -1;return c.dep[(py-Math.floor(py/CHUNK)*CHUNK)*c.cv.width+px-Math.floor(px/CHUNK)*CHUNK]};
  const lim=Math.floor(y)+1;let any=false;for(const py of [bot-1,bot-6,bot-14])if(depAt(Math.floor(x),py)>lim){any=true;break}if(!any)return;
  for(let px=x0;px<=x1;px++){let a=-1;for(let py=top;py<=bot+1;py++){const hid=depAt(px,py)>lim;if(hid&&a<0)a=py;if((!hid||py===bot+1)&&a>=0){const e=hid?py+1:py,c=WA.chunks.get(Math.floor(a/CHUNK)*WA.cols+Math.floor(px/CHUNK));
        if(c&&c.fcv){const X=Math.floor(px/CHUNK)*CHUNK,Y=Math.floor(a/CHUNK)*CHUNK,r=c.fr||1,h=Math.min(e,Y+CHUNK)-a;if(h>0)ctx.drawImage(c.fcv,(px-X)*r,(a-Y)*r,r,h*r,px-cam.x,a-cam.y,1,h)}a=-1}}}}

/* the climate's own air, the world lab's (engine/worldlab.js snowfall, mist): over the land where you are, after the weather: in the frost
   flakes always falling, swaying with the wind (CLIMATE_AIR.flakes for a screen of 640 x 360 lab px); in the swamp banks of mist drifting
   over its low land (one a cell of cell game px where its hash passes mist, drifting drift px a second) */
const CLIMATE_AIR={flakes:50,cell:150,mist:.45,drift:5},CAIR={fl:[],t:0};
function climateAir(cam){if(typeof P==='undefined'||!P||B?.world)return;const cl=climAt(P.x,P.y),r=sceneRes(),now=performance.now(),dt=Math.min(.1,(now-(CAIR.t||now))/1000);CAIR.t=now;const C=CLIMATE_AIR;
  if(cl==='frost'){const n=Math.round(C.flakes*VW*VH/(320*180));while(CAIR.fl.length<n)CAIR.fl.push({x:Math.random()*VW,y:Math.random()*VH,z:Math.random()});CAIR.fl.length=n;
    ctx.save();ctx.fillStyle='rgba(248,250,255,.85)';for(const f of CAIR.fl){f.y+=(5+f.z*11)*dt;f.x+=(3+Math.sin(now/900+f.z*9)*2)*dt;if(f.y>VH+1){f.y=-1;f.x=Math.random()*VW}if(f.x>VW+1)f.x=-1;
      const s=(f.z>.6?2:1)/r;ctx.fillRect(Math.round(f.x*r)/r,Math.round(f.y*r)/r,s,s)}ctx.restore()}
  else CAIR.fl.length=0;
  if(cl==='swamp'&&PX.flora&&PX.flora.mistPic){const pic=PX.flora.mistPic(),t=now/1000,c0=Math.floor((cam.x-200)/C.cell),c1=Math.floor((cam.x+VW+60)/C.cell),r0=Math.floor((cam.y-60)/C.cell),r1=Math.floor((cam.y+VH+60)/C.cell);ctx.save();
    for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const h=hs(cx,cy,590);if(h>C.mist)continue;const x=cx*C.cell+hs(cx,cy,591)*C.cell+((t*C.drift*(.6+h))%C.cell),y=cy*C.cell+hs(cx,cy,592)*C.cell;
      if(climAt(x,y)!=='swamp'||terrAt(x,y)===T_HILL||terrAt(x,y)===T_MOUNT)continue;const s=(.7+hs(cx,cy,593)*.8)/r;ctx.globalAlpha=.55;ctx.drawImage(pic,Math.round(x-cam.x-pic.width*s/2),Math.round(y-cam.y-liftAt(x,y)-pic.height*s/2),pic.width*s,pic.height*s)}
    ctx.restore()}}
