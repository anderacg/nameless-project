'use strict';
// Approved tiger frames: synchronous, cached and aligned to the existing unit's feet.
(function(PX){
  const A=PX.TIGER_ART,BASE=200,cache=new Map(),masters=new Map(),pounces=new WeakMap();
  const pose=(clip,frame)=>{const c=A.clips[clip]||A.clips.idle;return BASE+c[0]+Math.max(0,Math.min(c[1]-1,Math.floor(frame||0)))};
  function sample(clip,seconds){const c=A.clips[clip];return pose(clip,Math.floor(Math.max(0,seconds)*1000/c[2])%c[1])}
  function index(p){
    if(p>=BASE&&p<BASE+A.frames.length)return p-BASE;
    if(p>=PX.BEAST_DEAD)return A.clips.death_back[0]+7;
    if(p<2)return A.clips.idle[0]+(p?4:0);
    if(p<6)return A.clips.walk[0]+(p-2)*2;
    if(p<9)return A.clips.swipe[0]+[0,3,7][p-6];
    if(p<12)return A.clips.bite[0]+[0,3,7][p-9];
    if(p<15)return A.clips.swipe[0]+[0,3,7][p-12];
    if(p<19)return A.clips.run[0]+(p-15)*2;
    return A.clips.walk[0]+((p-19)%4)*2;
  }
  function master(i){
    if(masters.has(i))return masters.get(i);
    const [x0,y0,x1,y1,runs]=A.frames[i],w=x1-x0,c=PX.canvas(96,64),g=c.getContext('2d'),d=g.createImageData(96,64);let n=0;
    for(let k=0;k<runs.length;k+=2){const rgba=A.palette[runs[k+1]];for(let j=0;j<runs[k];j++,n++)if(rgba[3])d.data.set(rgba,((y0+Math.floor(n/w))*96+x0+n%w)*4)}
    g.putImageData(d,0,0);masters.set(i,c);return c;
  }
  function render(o){
    const i=index(o.pose||0),v=((o.v||0)%3+3)%3,ally=o.team===0,key=i+':'+v+':'+ally+':'+PX.BEAST_EDGE+':'+PX.BEAST_RIM;
    if(cache.has(key))return cache.get(key);
    const c=PX.canvas(48,32),g=c.getContext('2d',{willReadFrequently:true});g.imageSmoothingEnabled=false;const drop=Math.min(4,30-Math.floor((A.frames[i][3]-1)/2));g.drawImage(master(i),0,drop,48,32);
    const d=g.getImageData(0,0,48,32),p=d.data;
    // Tint the orange coat only. White markings and black stripes keep their colors.
    for(let k=0;k<p.length;k+=4)if(p[k+3]&&p[k]>p[k+1]*1.3&&p[k+1]>p[k+2]*1.3&&p[k+1]>55){if(v===1){p[k]=Math.round(p[k]*.88);p[k+1]=Math.round(p[k+1]*.86)}else if(v===2){p[k]=Math.min(255,Math.round(p[k]*1.06));p[k+1]=Math.min(255,Math.round(p[k+1]*1.12))}}
    // Remove isolated reduction artifacts and close single-pixel pinholes.
    const on=(x,y)=>x>=0&&y>=0&&x<48&&y<32&&p[(y*48+x)*4+3];
    for(let y=1;y<31;y++)for(let x=1;x<47;x++)if(!on(x,y)&&on(x-1,y)&&on(x+1,y)&&on(x,y-1)&&on(x,y+1))p.set(p.slice((y*48+x-1)*4,(y*48+x-1)*4+4),(y*48+x)*4);
    g.putImageData(d,0,0);
    if(ally){g.fillStyle='#398dd5';g.fillRect(32,20,1,2);g.fillStyle='#3056ac';g.fillRect(32,22,1,1)}
    c.fh=32-(Math.floor(A.frames[A.clips.idle[0]][1]/2)+4);c.kind='tiger';cache.set(key,c);return c;
  }
  function live(u,time,moved,attackTime){
    const phase=time+(u.id||0)*.037,age=u.atkAt==null?Infinity:time-u.atkAt;
    // The battle already raises the actor during a pounce; use a level run frame here.
    if((u.z||0)>1)return pose('run',3);
    const leap=pounces.has(u)?time-pounces.get(u):Infinity;
    if(leap>=0&&leap<.65)return pose('pounce',Math.floor(leap/.65*8));
    if(age>=0&&age<attackTime)return pose((u.id||0)%2?'swipe':'bite',Math.floor(age/attackTime*8));
    const hit=u.hitAt==null?Infinity:time-u.hitAt;
    if(hit>=0&&hit<.3)return pose('hurt',Math.floor(hit/.3*4));
    if(moved)return sample(u.spdNow>u.s.spd*.75?'run':u.spdNow<u.s.spd*.45?'stalk':'walk',u.walkPhase==null?phase:u.walkPhase*.1);
    if(phase%20>=10&&phase%20<11.04)return pose('roar',Math.floor((phase%20-10)/1.04*8));
    return sample('idle',phase);
  }
  const beast=PX.beast,map=PX.beastMap;
  PX.tiger=Object.freeze({pose,sample,live,render,pounce:(u,time)=>pounces.set(u,time),clips:A.clips,first:BASE});
  PX.beast=(kind,o)=>kind==='tiger'?render(o||{}):beast(kind,o);
  PX.beastMap=(kind,f)=>{if(kind!=='tiger')return map(kind,f);const c=PX.canvas(24,16),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(render({pose:pose('walk',f||0),team:1}),0,0,24,16);c.fh=10;c.kind=kind;return c};
})(window.PX=window.PX||{});
