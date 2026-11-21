'use strict';
// Ground as painted: cached chunks first, existing tile/height fallbacks otherwise. Coordinates are map pixels.
// Water describes the ground beneath a bridge; onDeck describes the walkable surface above it.
const WorldGround={
  depth(x,y){x=Math.floor(x);y=Math.floor(y);if(!drawnWet(x,y))return 0;const i=Math.floor(y/TILE)*MW+Math.floor(x/TILE),dt=waterDepths(WM)[i],D=dt<0?WATER.open:dt;
  const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WorldArt.chunks.get(cy*WorldArt.cols+cx);if(!c||!c.shd)return D;
  const sd=c.shd[(y-cy*CHUNK)*c.cv.width+x-cx*CHUNK];return D*Math.min(1,(sd+.5)/WATER.draw.ramp)},
  wet(x,y){x=Math.floor(x);y=Math.floor(y);if(typeof WorldArt==='undefined'||x<0||y<0||x>=MW*TILE||y>=MH*TILE)return false;const cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WorldArt.chunks.get(cy*WorldArt.cols+cx);
  if(c&&c.wet){const w=c.cv.width,v=c.wet[(y-cy*CHUNK)*w+x-cx*CHUNK];if(v!==undefined)return v>0}return waterBand(Math.floor(y/TILE)*MW+Math.floor(x/TILE))>0},
  height(x,y){if(!isFinite(x)||!isFinite(y)||typeof WorldArt==='undefined')return 0;x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=MW*TILE||y>=MH*TILE)return 0;
  const WA=WorldArt,cx=Math.floor(x/CHUNK),cy=Math.floor(y/CHUNK),c=WA.chunks.get(cy*WA.cols+cx);
  if(c&&c.lift){const w=c.cv.width,v=c.lift[(y-cy*CHUNK)*w+x-cx*CHUNK];if(v!==undefined)return v/(c.fr||1)}
  if(!WM||typeof landHeight!=='function')return 0;const r=typeof sceneRes==='function'?sceneRes():1;return Math.round(Math.max(0,landHeight(WM)(x*2+1,y*2+1))*WORLD_TERRAIN.lh)/r},
  unproject(x,y){if(typeof WorldArt==='undefined')return{x,y};const fx=Math.floor(x),fy=Math.floor(y),WA=WorldArt,cx=Math.floor(fx/CHUNK),cy=Math.floor(fy/CHUNK),c=WA.chunks.get(cy*WA.cols+cx);
  if(c&&c.dep){const w=c.cv.width,d=c.dep[(fy-cy*CHUNK)*w+fx-cx*CHUNK];if(d>=0)return{x,y:d+(y-fy)}}return{x,y}},
  bridge(x,y){return bridgeShift(x,y)},
  at(x,y,out={}){
    const height=liftAt(x,y),shift=this.bridge(x,y);
    out.x=x;out.y=y;out.height=height;out.shift=shift;out.onDeck=!!(shift&&shift[2]);
    out.wet=drawnWet(x,y);out.depth=out.wet?drawnDepth(x,y):0;
    out.drawX=x+(shift?shift[0]:0);out.drawY=y-height+(shift?shift[1]:0);
    return out;
  }
};
