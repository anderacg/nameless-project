'use strict';
// The land's faces drawn as earth and rock, not bars (the owner, 2026-11-19: "please fix that straight line steep hill": a tall bank over
// a river by a camp came out as even upright stripes of cream and brown, each game px column a face of its own kind by its level alone,
// and flat down it; gfx/worldterrain.js faceTexel, WORLD_TERRAIN.face): on the owner's bank and on a mountain's, a desert's and a frost's
// cliffs, a tall face's columns not a repeating pattern (their brightness along it no strong autocorrelation at any lag of 2 to 8 px),
// its top no ruler line (the grass hanging over it, raggedly), its kinds mottled, not striped; a low bank a soft step.
Kit.suite(({ok,info})=>{const t=T,WA=t.WorldArt,FC=t.WORLD_TERRAIN.face,AC=.5,STRAIGHT=24,LOW=.3;// (the old painter: the frost's cliff .64, low banks 25-45% off their tops)
 Kit.begin('soldier',1);(0,eval)('VS=2');const keep=FC.log;FC.log=true;
 // (the spots: the owner's bank by the camp over the lake, and tall faces in the mountains, the desert and the frost)
 const spots={bank:[4619,2717],mountain:[2856,616],desert:[6184,3816],frost:[5576,1128],bank2:[3384,3864]},lum=(d,o)=>d[o]*.3+d[o+1]*.59+d[o+2]*.11;
 const sum={};
 try{for(const [name,[x,y]] of Object.entries(spots)){const cx=Math.floor(x/t.CHUNK),cy=Math.floor(y/t.CHUNK),k=cy*WA.cols+cx;WA.chunks.delete(k);const j=WA.start(cx,cy);while(!j.gen.next().done);WA.done(j);
   const rec=j.rec,L=rec.faceLog||[],cv=rec.fcv,g=cv.getContext('2d'),d=g.getImageData(0,0,cv.width,cv.height).data,Wd=cv.width,px=(fx,y)=>lum(d,(y*Wd+fx)*4);
   const cols=[];for(let i=0;i<L.length;i+=5)if(!L[i+4])cols.push({fx:L[i],sy:L[i+1],n:L[i+2],ov:L[i+3]});
   // (a tall face's columns, in runs along it)
   const tall=cols.filter(c=>c.n>=10&&c.sy>=0&&c.sy+c.n<cv.height).sort((a,b)=>a.fx-b.fx||a.sy-b.sy),runs=[];let run=[];
   for(const c of tall){const p=run[run.length-1];if(p&&c.fx===p.fx)continue;if(p&&c.fx===p.fx+1&&Math.abs(c.sy-p.sy)<=c.n/2)run.push(c);else{if(run.length>=12)runs.push(run);run=[c]}}if(run.length>=12)runs.push(run);
   let acW=0,acN=0,straight=0;
   for(const R of runs){const p=R.map(c=>{let s=0,m=0;for(let dz=c.ov+1;dz<=c.n;dz++){s+=px(c.fx,c.sy+dz);m++}return m?s/m:0}),mu=p.reduce((a,b)=>a+b,0)/p.length,v=p.reduce((a,b)=>a+(b-mu)*(b-mu),0)/p.length;
    if(v>1){let mx=0;for(let lag=2;lag<=8&&lag<p.length/2;lag++){let c=0;for(let i=0;i+lag<p.length;i++)c+=(p[i]-mu)*(p[i+lag]-mu);mx=Math.max(mx,c/((p.length-lag)*v))}acW+=mx*R.length;acN+=R.length}
    let s=1;for(let i=1;i<R.length;i++){if(R[i].sy+R[i].ov===R[i-1].sy+R[i-1].ov&&R[i].sy===R[i-1].sy)s++;else s=1;straight=Math.max(straight,s)}}
   // (a low bank: its face's px against its top's)
   let lowD=0,lowN=0;for(const c of cols)if(c.n>=2&&c.n<=FC.low&&c.sy>0&&c.sy+c.n<cv.height){const tp=px(c.fx,c.sy);if(tp<20)continue;for(let dz=1;dz<=c.n;dz++){lowD+=Math.abs(px(c.fx,c.sy+dz)-tp)/tp;lowN++}}
   sum[name]={runs:runs.length,cols:tall.length,ac:acN?acW/acN:0,straight,low:lowN?lowD/lowN:0};
   info(name+': '+tall.length+' tall face columns in '+runs.length+' runs, their autocorrelation along at lag 2-8 '+sum[name].ac.toFixed(2)+', top straight '+straight+' px at most, a low bank '+(sum[name].low*100).toFixed(0)+'% off its top ('+lowN+' px)')}}
 finally{FC.log=keep}
 const S=Object.values(sum).filter(s=>s.runs);
 ok(S.length>=3,'tall faces found on '+S.length+' of '+Object.keys(spots).length+' spots');
 ok(S.every(s=>s.ac<AC),'no tall face a repeating column pattern: autocorrelation at lag 2-8 under '+AC+' ('+Object.entries(sum).map(([k,s])=>k+' '+s.ac.toFixed(2)).join(', ')+')');
 ok(S.every(s=>s.straight<=STRAIGHT),'no tall face\'s top a ruler line over '+STRAIGHT+' fine px ('+Object.entries(sum).map(([k,s])=>k+' '+s.straight).join(', ')+')');
 ok(Object.values(sum).every(s=>s.low<LOW),'a low bank a soft step: its face within '+(LOW*100)+'% of its top\'s brightness ('+Object.entries(sum).map(([k,s])=>k+' '+(s.low*100).toFixed(0)+'%').join(', ')+')');
});
