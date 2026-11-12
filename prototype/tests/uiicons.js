'use strict';
// Shared material illustrations: semantic coverage, native crops, transparency and retained UI contracts.
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),t=T,parse=s=>{const e=document.createElement('div');e.innerHTML=s;return e.firstElementChild};
 try{
  ok(Object.keys(t.ICONS).every(k=>t.UI_ILLUSTRATIONS[k]),'every shared interface symbol has illustrated artwork');
  const icons=Object.keys(t.UI_ILLUSTRATIONS).map(k=>[k,parse(t.icon(k,18))]);
  ok(icons.every(([k,e])=>e?.dataset.uiIcon===k&&e.querySelector('image')&&e.getAttribute('aria-hidden')==='true'&&e.getAttribute('width')==='18'),'shared icons preserve their size, transparent image rendering and decorative accessibility contract');
  ok(icons.every(([k,e])=>e.getAttribute('viewBox')===t.UI_ILLUSTRATIONS[k].slice(0,4).join(' ')),'native atlas crops retain each illustration’s proportions');
  const defs=[...Object.values(t.ITEMS),...Object.values(t.MATS),...Object.values(t.GOODS)];
  ok(defs.every(d=>parse(t.itemIllustration(d,26))?.querySelector('[data-ui-icon]')),'every equipment, material and good definition renders an illustrated inventory icon');
  {const e=document.createElement('div'),id=Object.keys(t.ITEMS)[0];e.innerHTML='<span data-icon="gear:'+id+'"></span>';t.fillIcons(e);ok(!!e.querySelector('.item-illustration image')&&!e.querySelector('canvas,[data-icon]'),'inventory placeholders resolve to shared illustrated art');}
  ok([...Object.values(t.ORDER_ICON),...Object.values(t.ABIL_ICON)].every(rows=>parse(t.pixelSVG(rows,18))?.dataset.uiOrder),'all battle orders and abilities use illustrated command symbols');
  const badges=Object.keys(t.GLYPH).map(k=>[k,parse(t.badgeSVG(k,14))]);
  ok(badges.every(([k,e])=>e?.dataset.uiStatus===k&&e.querySelector('[data-ui-icon]')&&e.querySelector('circle')?.getAttribute('stroke')===t.BADGE_RIM[k]),'every battle status uses illustrated art while preserving its semantic rim colour');
  const looks=new Map();for(const [k] of badges){const id=JSON.stringify(t.UI_STATUS_ART[k])+t.BADGE_RIM[k];looks.set(id,(looks.get(id)||[]).concat(k));}ok([...looks.values()].every(v=>v.length===1),'battle statuses remain visually distinct by illustration, modifier and rim');
  const confidence=parse(t.badgeSVG('confident',14));ok(confidence.getAttribute('role')==='img'&&confidence.getAttribute('aria-label')===t.CONFIDENCE_LABEL&&confidence.dataset.status==='confident','confidence keeps its full accessible explanation');
  ok(Object.keys(t.UNIT_GLYPH).every(k=>parse(t.glyphSVG(k,18))?.querySelector('image')),'troop type symbols use the same transparent illustration family');
  ok(Object.keys(t.FORMS).every(k=>parse(t.formIcon(k,24,16))?.dataset.uiFormation===k),'formation diagrams retain their real geometry with matching metal studs');
  const images=await Promise.all(t.UI_ICON_SHEETS.map(async S=>{const i=new Image();i.src=S[0];await i.decode();return i}));
  await Promise.all(t.UI_ICON_SHEETS.map((S,i)=>t.uiAtlasImage(i).decode()));const c=document.createElement('canvas');c.width=80;c.height=40;const g=c.getContext('2d');ok(t.uiCanvasIcon(g,'sword',0,0,32,32)&&t.uiCanvasBadge(g,'confident',40,0,32,t.BADGE_RIM.confident)&&g.getImageData(0,0,80,40).data.some((v,i)=>i%4===3&&v>0),'tactical markers render the same illustrations on canvas');
  ok(images.every((im,i)=>im.naturalWidth===t.UI_ICON_SHEETS[i][1]&&im.naturalHeight===t.UI_ICON_SHEETS[i][2]),'all shared icon atlases load at their registered native sizes');
  const canvases=images.map(im=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;c.getContext('2d').drawImage(im,0,0);return c.getContext('2d',{willReadFrequently:true})});
  ok(canvases.every((g,i)=>[[0,0],[images[i].width-1,0],[0,images[i].height-1],[images[i].width-1,images[i].height-1]].every(([x,y])=>g.getImageData(x,y,1,1).data[3]<=1)),'all atlas outside corners are transparent apart from at most 1/255 antialiasing');
  ok(Object.values(t.UI_ILLUSTRATIONS).every(A=>[[A[0],A[1]],[A[0]+A[2]-1,A[1]],[A[0],A[1]+A[3]-1],[A[0]+A[2]-1,A[1]+A[3]-1]].every(([x,y])=>canvases[A[4]||0].getImageData(x,y,1,1).data[3]<=2)),'all icon crop corners are transparent within 2/255 antialiasing tolerance');
  ok(Object.values(t.UI_ILLUSTRATIONS).every(A=>{const im=images[A[4]||0];return A[0]>=0&&A[1]>=0&&A[0]+A[2]<=im.width&&A[1]+A[3]<=im.height}),'every icon crop stays inside its source atlas');
 }catch(e){exc(e)}finally{out()}
};
