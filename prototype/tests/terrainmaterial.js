'use strict';
// An unfinished chunk cannot retain another climate's material when its next paint step resumes.
Kit.suite(({ok})=>{const t=T,WA=t.WorldArt;
 const pic=c=>{const v=c.fcv||c.cv,d=v.getContext('2d').getImageData(0,0,v.width,v.height).data;let h=2166136261;for(let i=0;i<d.length;i+=4)h=Math.imul(h^(d[i]|d[i+1]<<8|d[i+2]<<16),16777619)>>>0;return h.toString(16)};
  // Different climates share the flora atlas. Resuming one must restore its own material, including snow caps.
  {const FL=t.PX.flora,look0=FL.look,cap0=FL.cap,patches=['frost','grass'].map(cl=>{const i=t.tiles.findIndex((kind,i)=>kind===t.T_FOREST&&t.climate[i]===t.CLIMS.indexOf(cl)&&!t.occAt(i%t.MW,Math.floor(i/t.MW)));return i<0?null:[i%t.MW*t.TILE,Math.floor(i/t.MW)*t.TILE]});
   const make=p=>{const rec={fine:2},cv=t.mkcv(64,48);return{rec,gen:t.paintSteps(WA.ensure(),p[0],p[1],64,48,cv.getContext('2d'),0,0,rec)}},
    signature=c=>pic(c)+'|'+JSON.stringify((c.props||[]).map(p=>[p.x,p.y,p.kind,pic({cv:p.s})]));
   ok(patches.every(Boolean),'frost and grass forest patches exist for material isolation');
   if(patches.every(Boolean)){const isolated=patches.map(p=>{const j=make(p);t.runGen(j.gen);return signature(j.rec)}),a=make(patches[0]),b=make(patches[1]);let ad=false,bd=false;
    const resume=(j,cl)=>{FL.look=t.WORLD_FLORA.look[cl];FL.cap=FL.look.snow;return j.gen.next().done};
    try{while(!ad||!bd){for(let n=0;n<7&&!ad;n++)ad=resume(a,'grass');for(let n=0;n<11&&!bd;n++)bd=resume(b,'frost')}}finally{FL.look=look0;FL.cap=cap0}
    ok(a.rec.props.length>0&&b.rec.props.length>0&&signature(a.rec)===isolated[0]&&signature(b.rec)===isolated[1],'interleaved frost and grass retain their isolated terrain and vegetation pixels')}
  }
});
