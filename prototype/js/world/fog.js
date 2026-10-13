'use strict';
/* ---------- fog of war: the land you have explored, and what you can see now ---------- */
// W.seen: a byte a tile, 1 once you have seen it. Within your sight (vis()) you see everything as it is. Land you have seen
// but are not looking at now is remembered: its ground, and the holdings, camps and sites on it as you last saw them, dimmed,
// with nothing that moves on it. Land you have never seen is dark. render.js draws it; the save keeps W.seen.
function seenArr(){if(!(W.seen instanceof Uint8Array)||W.seen.length!==MW*MH)W.seen=new Uint8Array(MW*MH);return W.seen}
const seenTile=(tx,ty)=>tx>=0&&ty>=0&&tx<MW&&ty<MH&&seenArr()[ty*MW+tx]===1;
const seenAt=(x,y)=>seenTile(Math.floor(x/TILE),Math.floor(y/TILE));
// in your sight now
const inSight=(x,y)=>Math.hypot(x-P.x,y-P.y)<vis();
let fogDirty=true,lastReveal='';
// what you see now becomes known (each tile whose middle lies within your sight)
function reveal(){
  const S=seenArr(),V=vis(),tx=Math.floor(P.x/TILE),ty=Math.floor(P.y/TILE),key=tx+','+ty+','+Math.round(V);if(key===lastReveal)return;lastReveal=key;
  const r=Math.ceil(V/TILE)+1;
  for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(x<0||y<0||x>=MW||y>=MH||S[y*MW+x])continue;if(Math.hypot((x+.5)*TILE-P.x,(y+.5)*TILE-P.y)<V){S[y*MW+x]=1;fogDirty=true}}
}
// a fresh map (a new game): nothing known yet
function fogReset(){W.seen=new Uint8Array(MW*MH);fogDirty=true;lastReveal=''}
// in the save: a bit a tile, as base64
function seenSave(){const S=seenArr(),b=new Uint8Array(Math.ceil(S.length/8));for(let i=0;i<S.length;i++)if(S[i])b[i>>3]|=1<<(i&7);let s='';for(let i=0;i<b.length;i+=4096)s+=String.fromCharCode.apply(null,b.subarray(i,i+4096));return btoa(s)}
function seenLoad(str){fogReset();if(!str)return;try{const s=atob(str),S=W.seen;for(let i=0;i<S.length;i++)S[i]=(s.charCodeAt(i>>3)>>(i&7))&1}catch(e){fogReset()}}

/* drawing */
// the ragged edge of the dark: a checker of 2-pixel blocks over a dark tile beside known land
const FOG_COL='#05070c';
let fogEdgeCv=null;
const fogEdge=()=>fogEdgeCv||(fogEdgeCv=mkc(TILE,TILE,g=>{g.fillStyle=FOG_COL;for(let y=0;y<TILE;y+=2)for(let x=0;x<TILE;x+=2)if(((x>>1)+(y>>1))%2===0)g.fillRect(x,y,2,2)}));
// unknown land in view: dark tiles, ragged where they meet known land
function drawDark(cam){
  const x0=Math.max(0,Math.floor(cam.x/TILE)),y0=Math.max(0,Math.floor(cam.y/TILE)),x1=Math.min(MW-1,Math.floor((cam.x+VW)/TILE)),y1=Math.min(MH-1,Math.floor((cam.y+VH)/TILE));
  ctx.fillStyle=FOG_COL;
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(seenTile(x,y))continue;const sx=x*TILE-cam.x,sy=y*TILE-cam.y;
    if(seenTile(x-1,y)||seenTile(x+1,y)||seenTile(x,y-1)||seenTile(x,y+1))ctx.drawImage(fogEdge(),sx,sy);else ctx.fillRect(sx,sy,TILE,TILE)}
}
// the minimap's dark: one pixel a tile, rebuilt when more land is known (at most twice a second)
let fogMini=null,fogMiniT=0;
function fogMiniCv(){
  const now=performance.now();if(fogMini&&(!fogDirty||now-fogMiniT<500))return fogMini;fogDirty=false;fogMiniT=now;
  const S=seenArr();return fogMini=mkc(MW,MH,g=>{const d=g.createImageData(MW,MH);for(let i=0;i<S.length;i++)if(!S[i]){d.data[i*4]=5;d.data[i*4+1]=7;d.data[i*4+2]=12;d.data[i*4+3]=255}g.putImageData(d,0,0)});
}
