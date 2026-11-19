'use strict';
// Camp markers keep transparent corners, a readable recruitment plus, and DPR-sized caches independent of map zoom.
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T,W=t.ENCAMP.icons.css;
 try{
  await Promise.all([t.UI_MARKER_RIM.decode(),...Object.values(t.ENCAMP.icons.ico).map(k=>t.uiAtlasImage(t.UI_ILLUSTRATIONS[k][4]||0).decode())]);
  for(const [service,name] of Object.entries(t.ENCAMP.icons.ico)){
   const c=document.createElement('canvas');c.width=c.height=W;const g=c.getContext('2d',{willReadFrequently:true});
   ok(t.campBadge(g,name,W,W),service+': painted marker renders from locally bundled art');
   const pixels=g.getImageData(0,0,W,W).data;
   ok(pixels.some((v,i)=>i%4===3&&v>128),service+': marker contains visible artwork');
   ok([[0,0],[W-1,0],[0,W-1],[W-1,W-1]].every(([x,y])=>g.getImageData(x,y,1,1).data[3]<=2),service+': bevel corners stay transparent');
  }
  {const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=a.height=b.width=b.height=W;
   t.campBadge(a.getContext('2d'),'recruit',W,W);t.uiCanvasMarker(b.getContext('2d'),'recruit',W,W);
   const A=a.getContext('2d').getImageData(0,0,W,W).data,B=b.getContext('2d').getImageData(0,0,W,W).data;
   let changed=0,green=0;for(let y=2;y<W/2;y++)for(let x=W/2;x<W-2;x++){const i=(y*W+x)*4;if(A[i]!==B[i]||A[i+1]!==B[i+1]||A[i+2]!==B[i+2])changed++;if(A[i+1]>A[i]+8&&A[i+1]>A[i+2]+8)green++;}
   ok(changed>=8&&green>=3,'Recruitment retains a distinct green plus badge instead of becoming Rally');
  }
  {const c=document.createElement('canvas');c.width=c.height=W*2;const g=c.getContext('2d');g.scale(2,2);t.campBadge(g,'fire',W,W);
   ok(t.UI_ICON_CACHE.has('marker:fire|'+W*2+'x'+W*2),'screen-space artwork caches at device-pixel density');
  }
  {const ready=window.uiIconReady,c=document.createElement('canvas');c.width=c.height=23;const g=c.getContext('2d'),before=t.UI_ICON_CACHE.size;
   try{window.uiIconReady=()=>false;ok(!t.uiCanvasMarker(g,'fire',23,23)&&t.UI_ICON_CACHE.size===before,'loading artwork leaves no blank or old pixel marker in the cache');}
   finally{window.uiIconReady=ready}
   ok(t.uiCanvasMarker(g,'fire',23,23),'the same marker becomes visible once its artwork is ready');
  }
 }catch(e){exc(e)}finally{out()}
};
