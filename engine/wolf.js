'use strict';
// Approved wolf art; the old renderer remains in place for every other creature.
(function(PX){
  const A=PX.WOLF_ART,BASE=400,ALPHA='alpha_wolf',ALPHA_SCALE=1.25,RIDER_X=6,MOUNT=Object.freeze({w:40,h:36,downH:26,ground:23,axis:19}),cache=new Map(),masters=new Map(),maps=new Map(),mounts=new Map(),alphas=new Map();
  const pose=(clip,frame)=>{const c=A.clips[clip]||A.clips.idle;return BASE+c[0]+Math.max(0,Math.min(c[1]-1,Math.floor(frame||0)))};
  const sample=(clip,seconds)=>{const c=A.clips[clip];return pose(clip,Math.floor(Math.max(0,seconds)*1000/c[2])%c[1])};
  function index(p){
    if(p>=BASE&&p<BASE+A.frames.length)return p-BASE;
    if(p>=PX.BEAST_DEAD)return A.clips[['death_side','death_back','death_slump'][(p-PX.BEAST_DEAD)%3]][0]+7;
    if(p<2)return A.clips.idle[0]+(p?4:0);
    if(p<6)return A.clips.walk[0]+(p-2)*2;
    if(p<15)return A.clips.bite[0]+[0,3,7][(p-6)%3];
    if(p<19)return A.clips.run[0]+(p-15)*2;
    return A.clips.walk[0]+((p-19)%4)*2;
  }
  function decode(record,palette,w,h){
    const [x0,y0,x1,y1,runs]=record,c=PX.canvas(w,h),g=c.getContext('2d'),d=g.createImageData(w,h),span=x1-x0;let n=0;
    for(let k=0;k<runs.length;k+=2){const color=palette[runs[k+1]];for(let j=0;j<runs[k];j++,n++)if(color[3])d.data.set(color,((y0+Math.floor(n/span))*w+x0+n%span)*4)}
    g.putImageData(d,0,0);return c;
  }
  function master(i){if(!masters.has(i))masters.set(i,decode(A.frames[i],A.palette,96,64));return masters.get(i)}
  function render(o){
    const i=index(o.pose||0),v=((o.v||0)%3+3)%3,ally=o.team===0,key=i+':'+v+':'+ally;
    if(cache.has(key))return cache.get(key);
    const c=PX.canvas(48,32),g=c.getContext('2d',{willReadFrequently:true}),drop=Math.min(4,30-Math.floor((A.frames[i][3]-1)/2));g.imageSmoothingEnabled=false;g.drawImage(master(i),0,drop,48,32);
    const d=g.getImageData(0,0,48,32),p=d.data;
    const coat=['b9b9ae','92958d','696f6b','414a48','797f7a','59635f','424c4b','303b3b'].map(c=>[0,2,4].map(i=>parseInt(c.slice(i,i+2),16)));
    for(let k=0;k<p.length;k+=4)if(p[k+3]&&v&&coat.some(c=>c[0]===p[k]&&c[1]===p[k+1]&&c[2]===p[k+2]))for(let j=0;j<3;j++)p[k+j]=Math.min(255,Math.round(p[k+j]*(v===1?.8:1.13)));
    // Nearest-neighbor reduction may leave a single pixel enclosed at a bent joint.
    for(let pass=0;pass<3;pass++){let count=0;for(let y=1;y<31;y++)for(let x=1;x<47;x++){const n=(y*48+x)*4;if(!p[n+3]&&p[n-1]&&p[n+7]&&p[n-48*4+3]&&p[n+48*4+3]){p.set(p.slice(n-4,n),n);count++}}if(!count)break}
    if(ally){
      const dead=i>=A.clips.death_side[0],tx=31,ty=dead?25:20;let best=-1,distance=Infinity;
      for(let y=0;y<32;y++)for(let x=24;x<38;x++){const k=(y*48+x)*4,dist=Math.abs(x-tx)+Math.abs(y-ty);if(p[k+3]&&dist<distance){best=k;distance=dist}}
      if(best>=0){p.set([57,141,213,255],best);for(const step of [-48*4,48*4])if(best+step>=0&&best+step<p.length&&p[best+step+3])p.set([48,86,172,255],best+step)}
    }
    g.putImageData(d,0,0);c.fh=32-(Math.floor(A.frames[A.clips.idle[0]][1]/2)+4);c.kind='wolf';cache.set(key,c);return c;
  }
  function alphaRender(o){
    const src=render(o),key=index(o.pose||0)+':'+((o.v||0)%3)+':'+(o.team===0);if(alphas.has(key))return alphas.get(key);
    const c=PX.canvas(60,40),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(src,0,0,60,40);c.fh=Math.ceil(src.fh*ALPHA_SCALE);c.kind=ALPHA;alphas.set(key,c);return c;
  }
  function map(frame,alpha=false){const f=((frame||0)%8+8)%8,key=alpha?'a'+f:f;if(!maps.has(key)){let c=decode(A.map.frames[f],A.map.palette,16,16);if(alpha){const large=PX.canvas(20,20),g=large.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(c,0,0,20,20);c=large}c.fh=alpha?14:11;c.kind=alpha?ALPHA:'wolf';maps.set(key,c)}return maps.get(key)}
  // The approved wolf under an existing rider: fresh grids keep tack and side colors local.
  function mount(kind,walk,pal,down){
    const step=walk==null||walk<0?-1:walk%8,key=JSON.stringify([kind,step,pal.C,pal.M,down||false]);let saved=mounts.get(key);
    if(!saved){
      const clip=down?down==='belly'?'lie_down':'death_back':step<0?'idle':step>=4?'run':'walk',frame=down?7:step<0?0:(step%4)*2;
      const source=alphaRender({pose:pose(clip,frame),team:1,v:0}),rgba=source.getContext('2d').getImageData(0,0,60,40).data,g=PX._beastKit.grid(MOUNT.w,down?MOUNT.downH-1:MOUNT.h),dy=down?-15:-4;
      const ramps=[['b9b9ae','92958d','696f6b','414a48'],['797f7a','59635f','424c4b','303b3b'],['eee6d2','d6d0bc','a8aa9b','777f76']],color=(r,g,b)=>'#'+[r,g,b].map(n=>n.toString(16).padStart(2,'0')).join('');
      for(let y=0;y<40;y++)for(let x=10;x<50;x++){
        const i=(y*60+x)*4;if(!rgba[i+3])continue;const X=x-10,Y=y+dy;if(Y<0||Y>=g.h)continue;
        const hex=color(rgba[i],rgba[i+1],rgba[i+2]).slice(1);let c='#'+hex;
        for(let r=0;r<ramps.length;r++){const tone=ramps[r].indexOf(hex);if(tone>=0)c=r===2?pal.M[tone]:pal.C[Math.min(3,tone+(r===1?1:0))]}
        g.p[Y*g.w+X]=c;
      }
      // The saddle follows the real back, not a fixed height above a moving body.
      const spine=[];for(let x=11+RIDER_X;x<=16+RIDER_X;x++)for(let y=10;y<MOUNT.h-2;y++)if(g.p[y*g.w+x]){spine.push(y);break}spine.sort((a,b)=>a-b);
      const seat=down?MOUNT.ground:spine[Math.floor(spine.length/2)]||22;
      saved={g,riderX:RIDER_X,bob:down?0:seat-22,seat,body:[down?16:seat,down?MOUNT.ground:seat+7]};mounts.set(key,saved);
    }
    return{...saved,g:{...saved.g,p:saved.g.p.slice()}};
  }
  function live(u,time,moved,attackTime){
    const phase=time+(u.id||0)*.037,age=u.atkAt==null?Infinity:time-u.atkAt;
    if((u.z||0)>1)return pose('run',3);
    if(age>=0&&age<attackTime)return pose((u.id||0)%2?'bite':'lunge',Math.floor(age/attackTime*8));
    const hit=u.hitAt==null?Infinity:time-u.hitAt;if(hit>=0&&hit<.3)return pose('hurt',Math.floor(hit/.3*4));
    if(moved)return sample(u.spdNow>u.s.spd*.75?'run':u.spdNow<u.s.spd*.45?'stalk':'walk',u.walkPhase==null?phase:u.walkPhase*.11);
    if(phase%30>=15&&phase%30<16.44)return pose('howl',Math.floor((phase%30-15)/1.44*8));
    if(phase%30>=20&&phase%30<21.12)return pose('snarl',Math.floor((phase%30-20)/1.12*8));
    return sample('idle',phase);
  }
  const beast=PX.beast,beastMap=PX.beastMap,mountArt=PX.mountArt,beastFit=PX._beastFit;
  PX.wolf=Object.freeze({pose,sample,render,map,live,mount,alphaRender,alpha:ALPHA,alphaScale:ALPHA_SCALE,mountSize:MOUNT,isWolf:kind=>kind==='wolf'||kind===ALPHA,riderX:RIDER_X,clips:A.clips,first:BASE});
  PX.beast=(kind,o)=>kind==='wolf'?render(o||{}):kind===ALPHA?alphaRender(o||{}):beast(kind,o);
  PX.beastMap=(kind,f)=>kind==='wolf'?map(f):kind===ALPHA?map(f,true):beastMap(kind,f);
  PX.mountArt=(kind,walk,pal,down)=>kind==='wolf'||kind==='warg'?mount(kind,walk,pal,down):mountArt(kind,walk,pal,down);
  if(!PX.BEAST_KINDS.includes(ALPHA))PX.BEAST_KINDS.push(ALPHA);
  PX.BEAST_DEATHS[ALPHA]=PX.BEAST_DEATHS.wolf.slice();
  PX._beastFit=kind=>{if(kind!==ALPHA)return beastFit(kind);let x0=60,y0=40,x1=-1;for(let i=0;i<A.frames.length;i++){const c=alphaRender({pose:BASE+i,team:1}),d=c.getContext('2d').getImageData(0,0,60,40).data;for(let y=0;y<40;y++)for(let x=0;x<60;x++)if(d[(y*60+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y)}}return{kind,W:60,H:40,left:x0,right:x1,top:y0,ok:x0>=0&&x1<60&&y0>=0}};
})(window.PX=window.PX||{});
