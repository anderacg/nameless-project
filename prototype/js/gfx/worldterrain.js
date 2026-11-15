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

// (the land's kinds, by what they show)
const TERK={water:0,wet:1,sand:2,dune:3,grass:4,meadow:5,wood:6,rock:7,scree:8,snow:9,bank:10};
const tmix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t],tmul=(a,k)=>[a[0]*k,a[1]*k,a[2]*k];
// (a tone of a palette by patches a few px across, a little grain within: the lab's pick)
const tpick=(L3,x,y,s)=>L3[Math.min(L3.length-1,Math.floor((wnoise2(x/5,y/5,s)*.8+hs(x,y,s+1)*.2)*L3.length))];

// the chunk X, Y, w x h (game px) painted r times finer into rec.fcv: F its game-px picture as painted, G its ground alone (the window
// x0, y0, ww wide), KP the ground's water mask and distances (artGenGround's: M, DT, X0, Y0, RW)
function* terrainChunk(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r){
  const T=WORLD_TERRAIN,PAL=terrainPal(),LV=WM.lv||(WM.lv=reliefOf(WM)),W2=w*r,H2=h*r,out=new ImageData(W2,H2),O=out.data,TS=16;
  // (the game px whose levels are worked: the chunk, a px round it, and above it as far as the tallest face can hang)
  const up=Math.ceil(24*T.lh/r),gx0=X-2,gy0=Y-up,GW=w+4,GH=h+up+3,Lv=new Float32Array(GW*GH),St=new Float32Array(GW*GH),Gx=new Float32Array(GW*GH),Gy=new Float32Array(GW*GH),Wa=new Uint8Array(GW*GH);
  const tlv=(tx,ty)=>LV[Math.max(0,Math.min(MH-1,ty))*MW+Math.max(0,Math.min(MW-1,tx))],tk=(tx,ty)=>tiles[Math.max(0,Math.min(MH-1,ty))*MW+Math.max(0,Math.min(MW-1,tx))];
  for(let j=0;j<GH;j++){const gy=gy0+j;for(let i=0;i<GW;i++){const gx=gx0+i,u=(gx-8)/TS,v=(gy-8)/TS,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,
      t=tk(gx>>4,gy>>4),wet=t===T_WATER||t===T_FORD;
      let e=(tlv(tx,ty)*(1-fu)+tlv(tx+1,ty)*fu)*(1-fv)+(tlv(tx,ty+1)*(1-fu)+tlv(tx+1,ty+1)*fu)*fv;
      if(wet)e=tlv(gx>>4,gy>>4);else e+=((wnoise2(gx*r/T.sc,gy*r/T.sc,311)-.5)*1.4+(wnoise2(gx*r/(T.sc*.35),gy*r/(T.sc*.35),312)-.5)*.6)*2*T.detail*(t===T_MOUNT?T.mount:1);
      Lv[j*GW+i]=Math.max(0,e);Wa[j*GW+i]=wet?1:0}
    if(!(j&31))yield}
  // (each px's slope, and its level stepped where it is steep: never near a road, a lot or a ford, nor on water)
  for(let j=1;j<GH-1;j++)for(let i=1;i<GW-1;i++){const k=j*GW+i,gx=gx0+i,gy=gy0+j,gxl=(Lv[k+1]-Lv[k-1])/2,gyl=(Lv[k+GW]-Lv[k-GW])/2,g=Math.hypot(gxl,gyl);Gx[k]=gxl;Gy[k]=gyl;
    const t=tk(gx>>4,gy>>4),flat=Wa[k]||t===T_ROAD||t===T_FORD||(typeof occAt==='function'&&occAt(gx>>4,gy>>4)>0);
    const sw=flat?0:Math.max(0,Math.min(1,(g-T.steps.from)/(T.steps.to-T.steps.from))),s3=sw*sw*(3-2*sw),e=Lv[k];St[k]=e+(Math.floor(e)-e)*s3}
  yield;
  const at=(gx,gy)=>(gy-gy0)*GW+gx-gx0,mi=(gx,gy)=>(gy-KP.Y0)*KP.RW+gx-KP.X0,inK=(gx,gy)=>gx>=KP.X0&&gy>=KP.Y0&&gx<KP.X0+KP.RW&&gy<KP.Y0+KP.RH;
  // the tops: every fine px its own ground (or what the game painted over it), shaded by its slope
  const C=[0,0,0];
  for(let y=0;y<h;y++){for(let x=0;x<w;x++){const gx=X+x,gy=Y+y,fo=(y*w+x)*4,go=((gy-y0)*ww+gx-x0)*4,k=at(gx,gy),ti=(gy>>4)*MW+(gx>>4),t=tiles[ti],
      over=F[fo]!==G[go]||F[fo+1]!==G[go+1]||F[fo+2]!==G[go+2]||!!(P.fd&&P.fd[ti]);
      if(over){for(let j=0;j<r;j++)for(let i=0;i<r;i++){const o=((y*r+j)*W2+x*r+i)*4;O[o]=F[fo];O[o+1]=F[fo+1];O[o+2]=F[fo+2];O[o+3]=255}continue}
      const m=inK(gx,gy)?KP.M[mi(gx,gy)]:0,dd=inK(gx,gy)?KP.DT[mi(gx,gy)]:99,e=Lv[k],sl=Math.max(-.16,Math.min(.12,(-Gx[k]-.6*Gy[k])/1*T.lh*T.shade/r));
      // (its climates, by the tiles' round it: their shares)
      const u=(gx-8)/TS,v=(gy-8)/TS,tx=Math.floor(u),ty=Math.floor(v),fu=u-tx,fv=v-ty,cw=[0,0,0,0],cl=(a,b)=>climate[Math.max(0,Math.min(MH-1,b))*MW+Math.max(0,Math.min(MW-1,a))];
      cw[cl(tx,ty)]+=(1-fu)*(1-fv);cw[cl(tx+1,ty)]+=fu*(1-fv);cw[cl(tx,ty+1)]+=(1-fu)*fv;cw[cl(tx+1,ty+1)]+=fu*fv;
      // (the nearest water's kind: the sea's or a lake's open water, or a river's)
      let open=true;if(!m&&dd<T.dune){const j=wnear(P.wk,gx>>4,gy>>4,4);if(j>=0){const kj=P.wk[j];open=kj===1||kj===5}}
      for(let j=0;j<r;j++)for(let i=0;i<r;i++){const o=((y*r+j)*W2+x*r+i)*4,fx=gx*r+i,fy=gy*r+j;C[0]=C[1]=C[2]=0;
        for(let c=0;c<4;c++){if(cw[c]<.02)continue;const c3=m?terWater(PAL[c],c,m,dd,P,gx,gy,fx,fy):terLand(PAL[c],c,t,e,Math.hypot(Gx[k],Gy[k]),dd,open,fx,fy);C[0]+=c3[0]*cw[c];C[1]+=c3[1]*cw[c];C[2]+=c3[2]*cw[c]}
        const s=m?1:1+sl;O[o]=C[0]*s;O[o+1]=C[1]*s;O[o+2]=C[2]*s;O[o+3]=255}}
    if(!(y&7))yield}
  // the faces: north to south, each step down (the stepped level dropping between a game px and the one south of it) hangs its face
  // over the px south of the edge, lh fine px a level; the edge's lip lit (snow on a high one), the foot in the face's shade
  const FM=new Uint8Array(W2*H2);// (what the faces cover, fine px: no prop nor grass stands on a face)
  for(let x=0;x<w;x++){const gx=X+x;for(let gy=gy0+1;gy<Y+h;gy++){const k=at(gx,gy),kn=k+GW,d=St[k]-St[kn];if(!(d>=T.steps.min))continue;
      const n=Math.round(d*T.lh),wet=Wa[k],wetB=Wa[kn],t=tiles[(Math.max(0,gy)>>4)*MW+(gx>>4)],rocky=t===T_MOUNT||Lv[k]>=T.rock-1||d>=2,ci=climate[(Math.max(0,gy)>>4)*MW+(gx>>4)],Q=PAL[ci];
      const fy0=(gy+1)*r,snowy=Lv[k]>=T.snow-1;
      // (the lip: its edge lit, snow on a high one)
      if(gy>=Y)for(let i=0;i<r;i++){const o=(((gy-Y)*r+r-1)*W2+x*r+i)*4;if(snowy&&!wet){O[o]=242;O[o+1]=246;O[o+2]=252}else{O[o]=Math.min(255,O[o]*1.12);O[o+1]=Math.min(255,O[o+1]*1.12);O[o+2]=Math.min(255,O[o+2]*1.12)}}
      for(let dz=0;dz<n;dz++){const fy=fy0+dz,yy=fy-Y*r;if(yy<0)continue;if(yy>=H2)break;const f=dz/Math.max(1,n),zh=Math.round(d*T.lh)-dz;
        for(let i=0;i<r;i++){const fx=gx*r+i,o=(yy*W2+x*r+i)*4,nz=hs(fx,fy,331);let c;FM[yy*W2+x*r+i]=1;
          if(wet&&wetB){const q=hs(fx,0,332);c=dz>=n-2?Q.foam:Q.fall[q<.35?0:q<.75?1:2];if(nz<.03)c=Q.foam}
          else if(rocky){const RC=Q.rock;c=tmix(f<.5?RC[2]:RC[3],Q.face[2],.25);c=tmix(c,RC[4]||RC[3],Math.min(.5,f*.5));if(zh%T.lh===0)c=tmul(c,.62);else if((zh+1)%T.lh===0)c=tmul(RC[1],.95);
            if(nz<.1)c=tmul(c,.86);if((fx>>1)%7===0&&nz<.5)c=tmul(c,.9)}
          else{c=tmix(Q.bank[0],Q.bank[2],f);if(nz<.08)c=tmul(c,.88);if(dz===0)c=tmix(c,Q.lip,.5);if(f<.3&&nz>.9)c=Q.grass[1]}
          O[o]=c[0];O[o+1]=c[1];O[o+2]=c[2]}}
      // (the foot of the face in its shade)
      const fy=fy0+n,yy=fy-Y*r;if(yy>=0&&yy<H2)for(let i=0;i<r;i++){const o=(yy*W2+x*r+i)*4;O[o]*=.78;O[o+1]*=.78;O[o+2]*=.78}}
    if(!(x&15))yield}
  rec.fcv=mkcv(W2,H2);rec.fcv.getContext('2d').putImageData(out,0,0);rec.fr=r;
  yield* terrainProps(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r,FM,Lv,St,at)}

/* the land's nature on the chunk (the world lab's: engine/worldflora.js, WORLD_FLORA): on a grid of step fine px, each cell's
   thing by its ground and climate: trees in the woods (their kind by where they stand: lowland, waterside, hills, mountain, a
   village's), bushes, logs, stumps, ferns and mushrooms under them; trees, bushes, boulders, stones, flowers (agaves and bones in
   the desert) on open ground and hills; boulders and stones up the mountains; cattails on the banks. None on water, a road, a lot, a
   ford, what the game painted over the ground or a face. rec.props: {x, y (its foot, game px), s (its picture, fine px), ax, ay,
   low (flat: no cover)}, sorted by y; rec.grass: the clumps (fine px, kind, variant), sorted by y */
function* terrainProps(rec,P,F,G,KP,X,Y,w,h,x0,y0,ww,r,FM,Lv,St,at){
  const FL=PX.flora,WF=WORLD_FLORA,st=WF.step,out=[],GX=[],GY=[],GT=[],GV=[],W2=w*r,H2=h*r,near=(gx,gy,d,f)=>{for(let b=-d;b<=d;b++)for(let a=-d;a<=d;a++){const u=(gx>>4)+a,v=(gy>>4)+b;if(u>=0&&v>=0&&u<MW&&v<MH&&f(v*MW+u,u,v))return true}return false};
  const ok=(gx,gy,fx,fy)=>{const fo=((gy-Y)*w+gx-X)*4,go=((gy-y0)*ww+gx-x0)*4,ti=(gy>>4)*MW+(gx>>4),t=tiles[ti];if(t===T_WATER||t===T_ROAD||t===T_FORD)return false;
    if(F[fo]!==G[go]||F[fo+1]!==G[go+1]||F[fo+2]!==G[go+2])return false;if(FM[(fy-Y*r)*W2+fx-X*r])return false;if(typeof occAt==='function'&&occAt(gx>>4,gy>>4)>0)return false;
    const mx=gx-KP.X0,my=gy-KP.Y0;if(mx>=0&&my>=0&&mx<KP.RW&&my<KP.RH&&KP.M[my*KP.RW+mx])return false;return true};
  const pickOf=(mix,h)=>{let tot=0,sp=null;for(const q in mix)tot+=mix[q];let q=h*tot;for(const k in mix){sp=k;if((q-=mix[k])<0)break}return sp};
  let lastLook=null;const look=cl=>{if(lastLook===cl)return;lastLook=cl;FL.look=WF.look[cl];FL.cap=WF.look[cl].snow};
  for(let fy=Y*r+2;fy<(Y+h)*r;fy+=st){for(let fx=X*r+2;fx<(X+w)*r;fx+=st){const jx=Math.round(fx+(hs(fx,fy,401)-.5)*st),jy=Math.round(fy+(hs(fx,fy,402)-.5)*st);
      if(jx<X*r||jy<Y*r||jx>=(X+w)*r||jy>=(Y+h)*r)continue;const gx=Math.floor(jx/r),gy=Math.floor(jy/r);if(!ok(gx,gy,jx,jy))continue;
      const ti=(gy>>4)*MW+(gx>>4),t=tiles[ti],cl=CLIMS[climate[ti]],C=WF.chance[cl],v=Math.floor(hs(fx,fy,403)*8),q0=hs(fx,fy,404),e=Lv[at(gx,gy)];
      const mix=WF.trees[cl],zone=t===T_MOUNT?'mountain':t===T_HILL?'hills':near(gx,gy,1,i=>(WM.river[i]&3)&&tiles[i]===T_WATER)?'waterside':near(gx,gy,2,(i,u,v)=>typeof occAt==='function'&&occAt(u,v)>0)?'village':'lowland';
      const put=(o,kind,low)=>{if(o)out.push({x:jx/r,y:jy/r,s:o.img,ax:o.ax,ay:o.ay,kind,low:!!low})};
      look(cl);let q=q0;
      if(t===T_FOREST){if((q-=C.woods*.4)<0){put(FL.treePic(pickOf(mix[zone],hs(fx,fy,405)),v%6,hs(fx,fy,406)<.15?0:hs(fx,fy,407)<.1?2:1,cl==='frost'||e>=WORLD_TERRAIN.snow-3),'tree');continue}
        const W2c=C.woods2;if(W2c.bush&&(q-=W2c.bush)<0){put(FL.bushPic(v,FL.look.bush==='oak'?(v&1?'dark':'oak'):FL.look.bush),'bush');continue}if(W2c.log&&(q-=W2c.log)<0){put(FL.logPic(10+v,v),'log',true);continue}
        if(W2c.stump&&(q-=W2c.stump)<0){put(FL.stumpPic(v),'stump',true);continue}if(W2c.fern&&(q-=W2c.fern)<0){put(FL.fernPic(v),'fern',true);continue}
        if(W2c.mushroom&&(q-=W2c.mushroom)<0){put(FL.mushroomPic(v),'mushroom',true);continue}if(W2c.agave&&(q-=W2c.agave)<0){put(FL.agavePic(v),'agave',true);continue}}
      else{const Z=t===T_MOUNT?C.mountain:t===T_HILL?C.hills:C.open;
        if(Z.tree&&(q-=Z.tree)<0){put(FL.treePic(pickOf(mix[zone],hs(fx,fy,405)),v%6,hs(fx,fy,406)<.4?0:1,cl==='frost'||e>=WORLD_TERRAIN.snow-3),'tree');continue}
        if(Z.bush&&(q-=Z.bush)<0){put(FL.bushPic(v,FL.look.bush==='oak'?(v&1?'oak':'birch'):FL.look.bush),'bush');continue}
        if(Z.boulder&&(q-=Z.boulder)<0){put(FL.boulderPic(v,11+(v%4)*3,FL.look.moss),'rock');continue}if(Z.stone&&(q-=Z.stone)<0){put(FL.stonePic(3+(v%4),v),'stone',true);continue}
        if(Z.flowers&&(q-=Z.flowers)<0){put(FL.flowersPic(v+Math.floor(hs(fx,fy,408)*3)*8),'flowers',true);continue}if(Z.agave&&(q-=Z.agave)<0){put(FL.agavePic(v),'agave',true);continue}
        if(Z.bones&&(q-=Z.bones)<0){put(FL.bonesPic(v),'bones',true);continue}
        const dd=KP.DT?KP.DT[(gy-KP.Y0)*KP.RW+gx-KP.X0]:99;if(dd<4&&C.bank.cattail&&(q-=C.bank.cattail)<0){put(FL.cattailPic(v),'reeds');continue}}}
    if(!(fy&63))yield}
  FL.cap=false;
  // (the grass's clumps: on a grid of its step, by the ground's kind (open, meadow, woods, dunes) and climate, thicker in patches)
  const GS=WF.grass,KI=FL.GRASS_KINDS;
  for(let fy=Y*r+1;fy<(Y+h)*r;fy+=GS.step){for(let fx=X*r+1;fx<(X+w)*r;fx+=GS.step){const jx=Math.round(fx+(hs(fx,fy,411)-.5)*GS.step),jy=Math.round(fy+(hs(fx,fy,412)-.5)*GS.step);
      if(jx<X*r||jy<Y*r||jx>=(X+w)*r||jy>=(Y+h)*r)continue;const gx=Math.floor(jx/r),gy=Math.floor(jy/r);if(!ok(gx,gy,jx,jy))continue;const ti=(gy>>4)*MW+(gx>>4),t=tiles[ti];if(t===T_MOUNT)continue;
      const cl=CLIMS[climate[ti]],dd=KP.DT?KP.DT[(gy-KP.Y0)*KP.RW+gx-KP.X0]:99,g=t===T_FOREST?'woods':dd*2<WORLD_TERRAIN.dune?'dune':wnoise2(jx/120,jy/120,344)>.62?'meadow':'open';
      const ch=GS.chance[cl][g]*(.35+1.3*wnoise2(jx/GS.patch,jy/GS.patch,413));if(hs(fx,fy,414)>ch)continue;
      GX.push(jx);GY.push(jy);GT.push(Math.max(0,KI.indexOf(GS.kinds[cl][g])));GV.push(Math.floor(hs(fx,fy,415)*4))}
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
function terrainEnts(ents,cam){const r=sceneRes();if(r<=1)return;const WA=WorldArt,x0=cam.x-48,x1=cam.x+VW+48,y0=cam.y-8,y1=cam.y+VH+64,FL=PX.flora;
  const c0=Math.max(0,Math.floor(x0/CHUNK)),c1=Math.min(WA.cols-1,Math.floor(x1/CHUNK)),r0=Math.max(0,Math.floor(y0/CHUNK)),r1=Math.min(WA.rows-1,Math.floor(y1/CHUNK));
  const recs=[];for(let cy=r0;cy<=r1;cy++)for(let cx=c0;cx<=c1;cx++){const c=WA.chunks.get(cy*WA.cols+cx);if(c&&c.props&&c.fr===r)recs.push(c)}
  // (the grass)
  {const now=performance.now(),dt=Math.min(.1,(now-(TGRASS.t||now))/1000),G=WORLD_FLORA.grass,t=now/1000,BW=(VW+1)*r,BH=(VH+1)*r,A=FL.grassAtlas(),n=FL.lean,GW=FL.GW,GH=FL.GH,
      w1=t*1.9,w2=t*G.gust[1]*6.28/3,g2=6.28/G.gust[0],hx=P.x*r,hy=P.y*r,R2=G.push,dec=Math.exp(-dt/G.spring*2.3);TGRASS.t=now;
    if(!TGRASS.buf||TGRASS.buf.width!==BW||TGRASS.buf.height!==BH){TGRASS.buf=new ImageData(BW,BH);TGRASS.buf.u=new Uint32Array(TGRASS.buf.data.buffer);TGRASS.cv=mkcv(BW,BH)}
    const U=TGRASS.buf.u;U.fill(0);let any=false;
    for(const c of recs){const Gr=c.grass;if(!Gr)continue;const fy0=cam.y*r-4,fy1=(cam.y+VH)*r+GH;let lo=0,hi=Gr.n;while(lo<hi){const m=(lo+hi)>>1;if(Gr.Y[m]<fy0)lo=m+1;else hi=m}
      for(let k=lo;k<Gr.n&&Gr.Y[k]<=fy1;k++){const X=Gr.X[k],Y=Gr.Y[k],bx=X-cam.x*r-5,by=Y-cam.y*r-9;if(bx<-GW||bx>BW)continue;any=true;
        const wind=G.wind*(Math.sin(w1+X*.05+Y*.03)+.8*Math.sin(w2+X*g2-Y*.01));let Pv=Gr.P[k];if(Pv){Pv*=dec;if(Pv<.05&&Pv>-.05)Pv=0}const dx=X-hx,dy=(Y-hy)*1.5;
        if(dx<R2&&dx>-R2&&dy<R2&&dy>-R2){const d=Math.hypot(dx,dy);if(d<R2){const p=(dx>=0?1:-1)*n*(1-d/R2)*1.2;if(Math.abs(p)>Math.abs(Pv))Pv=p}}Gr.P[k]=Pv;
        const lean=Math.max(-n,Math.min(n,Math.round(Pv?wind*(1-Math.min(1,Math.abs(Pv)/n)*.7)+Pv:wind))),sp=A.px[(Gr.T[k]*4+Gr.V[k])*(2*n+1)+lean+n],D=sp.D,Cc=sp.C;
        for(let j=0,q=0;j<Cc.length;j++,q+=2){const x=bx+D[q],y=by+D[q+1];if(x>=0&&y>=0&&x<BW&&y<BH)U[y*BW+x]=Cc[j]}}}
    if(any){TGRASS.cv.getContext('2d').putImageData(TGRASS.buf,0,0);ctx.drawImage(TGRASS.cv,0,0,BW/r,BH/r)}}
  // (the props, by their feet, among the buildings)
  for(const c of recs)for(const p of c.props){const X=p.x-p.ax/r,Y=p.y-p.ay/r;if(X>x1||X+p.s.width/r<x0||p.y<y0||Y>y1)continue;
    ents.push({st:true,y:p.y,f:()=>{const sx=Math.round((X-cam.x)*r)/r,sy=Math.round((Y-cam.y)*r)/r;ctx.drawImage(p.s,sx,sy,p.s.width/r,p.s.height/r);if(!p.low)depthPic(terrainHalf(p.s,r),sx,sy)}})}}

// a land px's top colour (the lab's topCol): its kind by its tile, height, slope and the water near it; its climate's grain on it
function terLand(Q,c,t,e,g,dd,open,fx,fy){const T=WORLD_TERRAIN,cl=CLIMS[c],wob=wnoise2(fx/50,fy/50,341)-.5,dw=dd*2;let k,col;
  if(t===T_MOUNT||e>=T.rock+wob*3)k=e>=T.snow+wob*2.4?TERK.snow:g>=.15||hs(fx>>2,fy>>2,342)<.5?TERK.rock:TERK.scree;
  else if(dw<T.wet+wob*4&&open)k=TERK.wet;else if(dw<T.sand+wob*12&&open&&e<1.2)k=TERK.sand;else if(dw<T.dune+wob*20&&open&&e<1.6&&cl!=='swamp')k=TERK.dune;
  else if(!open&&dw<T.bank)k=TERK.bank;
  else if(t===T_FOREST)k=TERK.wood;else if(t===T_HILL&&g>=.3&&wnoise2(fx/14,fy/14,343)>.68)k=TERK.scree;
  else k=wnoise2(fx/120,fy/120,344)>.62?TERK.meadow:TERK.grass;
  switch(k){
    case TERK.snow:col=tpick(Q.snow,fx,fy,345);break;
    case TERK.rock:{col=tpick(Q.rock.slice(0,3),fx,fy,346);const gp=wnoise2(fx/14,fy/14,347);if(gp>.62&&e<T.snow-1)col=tmix(col,Q.grass[0],.5);break}
    case TERK.scree:col=tmix(tpick(Q.scree,fx,fy,348),Q.grass[0],hs(fx>>2,fy>>2,349)<.3?.4:0);break;
    case TERK.wet:col=tpick(Q.wet,fx,fy,350);break;case TERK.sand:col=tpick(Q.sand,fx,fy,351);break;
    case TERK.dune:col=tmix(tpick(Q.sand,fx,fy,352),Q.dune[hs(fx,fy,353)<.5?0:1],.45);break;
    case TERK.bank:col=tmix(tpick(Q.mud,fx,fy,354),Q.grass[0],Math.min(1,dw/T.bank));break;
    case TERK.wood:col=tpick(Q.wood,fx,fy,355);break;case TERK.meadow:col=tpick(Q.meadow,fx,fy,356);break;
    default:col=tpick(Q.grass,fx,fy,357)}
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
function terWater(Q,c,m,dd,P,gx,gy,fx,fy){const T=WORLD_TERRAIN,river=m===2||m===3,dp=P.dep[(gy>>4)*MW+(gx>>4)],d=river?Math.min(1.4,dd*.14):Math.min((dp===9?4:Math.min(4,dp+1))*T.depth*2,dd*.09);
  if(CLIMS[c]==='frost'&&!river&&d<.45+(wnoise2(fx/40,fy/40,371)-.5)*.5){let col=tpick(Q.ice,fx,fy,372);if(Math.abs(wnoise2(fx/10,fy/10,373)-.5)<.018)col=tmul(col,.86);return col}
  const S=river?Q.river:Q.sea,bed=river?Q.pebble[Math.floor(hs(fx>>1,fy>>1,374)*4)]:Q.bed[Math.sin(fx*.35+fy*.12+wnoise2(fx/12,fy/12,375)*6)>.55?0:1];
  let col=d<.4?tmix(S[0],S[1],d/.4):d<1?tmix(S[1],S[2],(d-.4)/.6):tmix(S[2],S[3],Math.min(1,d-1));
  const a=Math.pow(Math.max(0,1-d/(river?.55:T.clear)),1.4);col=tmix(col,bed,a*.8);if(a>.15&&wnoise2(fx/3,fy/3,376)>.74)col=tmix(col,[232,246,246],.22*a);
  if(dd<1.3&&hs(fx,fy,377)>.35)col=tmix(col,Q.foam,.55);
  return col}
