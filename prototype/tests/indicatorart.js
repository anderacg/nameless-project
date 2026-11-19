'use strict';
// Changing states preserve their information without the legacy pixel-art renderers.
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T;
 try{
  await Promise.all([t.UI_MARKER_RIM.decode(),...t.UI_ICON_SHEETS.map((_,i)=>t.uiAtlasImage(i).decode())]);
  const pixels=c=>c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data,
   hash=c=>{let h=0;for(const v of pixels(c))h=(h*31+v)|0;return h};
  for(const kind of ['eye','water','flag','arrow']){
   const c=t.uiIndicatorCanvas(kind,18,18,'#b8c7a1'),d=pixels(c);
   ok(c.width===72&&c.height===72&&d.some((v,i)=>i%4===3&&v>0)&&d.some((v,i)=>i%4===3&&v>0&&v<255),kind+': shaded artwork has high-resolution curved edges');
   ok(!d[3]&&!d[(c.width-1)*4+3]&&!d[d.length-1],kind+': no opaque square outside its silhouette');
  }
  for(const kind of ['eye','water'])ok(new Set([0,.25,.5,.75,1].map(level=>hash(t.uiIndicatorCanvas(kind,18,18,'#b8c7a1',level)))).size===5,kind+': all five exposure/fill states remain visually distinct');
  ok(new Set(['stand','fall','squash','home','bang','ask'].map(k=>hash(t.wuiArrow(k,'#d6b052')))).size>=5,'navigation, home, warning and question markers retain distinct shapes');
  const rank=new Image();rank.src=t.badgeSrc('steel',3);await rank.decode();ok(rank.width===96&&rank.height===104&&rank.src!==t.badgeSrc('steel',4)&&rank.src!==t.badgeSrc('gold',3),'rank shield preserves metal and chevron differences at high resolution');
  const c=document.createElement('canvas');c.width=c.height=100;const g=c.getContext('2d');t.sceneServiceIcon(g,'crown',10,10);ok(pixels(c).some((v,i)=>i%4===3&&v>0),'town NPC markers render the shared painted artwork');
  const ready=window.uiIconReady;
  try{window.uiIconReady=()=>false;t.WUIP.delete('x');ok(t.wuiSwords()===null,'cold attack marker waits for its local painting without a pixel-art fallback');}
  finally{window.uiIconReady=ready}
  ok(!!t.wuiSwords()?.uiIcon,'attack marker appears once its local illustration is ready');
 }catch(e){exc(e)}finally{out()}
};
