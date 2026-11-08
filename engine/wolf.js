'use strict';
// Approved wolf art; the old renderer remains in place for every other creature.
(function(PX){
  const A=PX.WOLF_ART,BASE=400,cache=new Map(),masters=new Map(),maps=new Map();
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
  function map(frame){const f=((frame||0)%8+8)%8;if(!maps.has(f)){const c=decode(A.map.frames[f],A.map.palette,16,16);c.fh=11;c.kind='wolf';maps.set(f,c)}return maps.get(f)}
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
  const beast=PX.beast,beastMap=PX.beastMap;
  PX.wolf=Object.freeze({pose,sample,render,map,live,clips:A.clips,first:BASE});
  PX.beast=(kind,o)=>kind==='wolf'?render(o||{}):beast(kind,o);
  PX.beastMap=(kind,f)=>kind==='wolf'?map(f):beastMap(kind,f);
})(window.PX=window.PX||{});
