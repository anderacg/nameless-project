'use strict';
/* ---------- the road's band (the owner, 2026-10-23: "sometimes my character even stands on the road but the game still reads it as
   swamp"): a road's speed follows the road as drawn, the lines the art paints (gfx/worldart.js artRoadSegs: artGenPlan's segments),
   not its tiles (a chain a tile wide, a staircase on a diagonal). Within ROAD_BAND's full px of a line, its road's speed; over the
   shoulder beyond, blended down to the land's; past that, the land's (map.js speedAt, for everyone who moves by it). Water and the
   peaks stay as they are, a ford keeps its own pace, a road's own tile its road's (a bridge's deck; a road through a holding,
   where nothing is drawn: as ever). regionAt names the road there (map.js).
   RoadBand: the field, a byte a ROAD_BAND.cell px square, kept only for the tiles a band reaches (ix: each tile's block, 1 +
   its index, 0 none; blk: the blocks, (TILE / cell)² bytes each). A byte: 0 off every band; else 64 if its way is an estate's track
   (lots.js estTrack: WM.roads' est), and how far in, 1-63 (63: within the full width; less over the shoulder). Made when first
   read, again whenever the ways change (router.js WAYV: a world going in, the estates' tracks laid or taken up, a crossing shut)
   ---------- */
// great, track: [full, shoulder] px from the line as drawn, a great road's (its bridges' ramps too) and a track's; cell: the
// field's square, px (TILE a whole number of them); speed: a road's (a great road or a track between places); trackSpeed: an
// estate's track's (the owner: "a little slower"); human: humans' × on both; name: how far in (0-1) regionAt calls it the road
const ROAD_BAND={great:[10,6],track:[8,6],cell:4,speed:1.3,trackSpeed:1.15,human:1.1,name:.5};
const RoadBand={ix:null,blk:null,k:0,v:-1,
  // the byte at map point (x, y), px
  at(x,y){if(this.v!==WAYV)this.build();if(!this.ix||x<0||y<0)return 0;const tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);if(tx>=MW||ty>=MH)return 0;
    const b=this.ix[ty*MW+tx],k=this.k;return b?this.blk[(b-1)*k*k+Math.floor((y-ty*TILE)/ROAD_BAND.cell)*k+Math.floor((x-tx*TILE)/ROAD_BAND.cell)]:0},
  // (a byte's road speed for race, and its share of it, 0-1)
  speed:(b,race)=>(b&64?ROAD_BAND.trackSpeed:ROAD_BAND.speed)*(race==='human'?ROAD_BAND.human:1),
  share:b=>(b&63)/63,
  // on the road at (x, y): its own tile, or far enough into a band (ROAD_BAND.name); 0 not, 1 a road, 2 an estate's track
  on(x,y){const t=terrAt(x,y);if(t===T_FORD||!passable(t))return 0;const b=this.at(x,y);if(t!==T_ROAD&&(b&63)<ROAD_BAND.name*63)return 0;return b&64?2:1},
  // (the field made again from the roads as drawn: no world or no art, none, and every tile reads as ever)
  build(){this.v=WAYV;this.ix=this.blk=null;if(typeof WM==='undefined'||!WM||!WM.roads||typeof artRoadSegs!=='function')return;
    const B=ROAD_BAND,cs=B.cell,k=this.k=Math.round(TILE/cs),{segs:S,est:E}=artRoadSegs(),ix=new Uint32Array(MW*MH);let n=0;
    // (each segment's reach: its cells round it, fn(cell x, cell y, how far in 1-63, 64 if an estate's track))
    const each=fn=>{for(let q=0,j=0;q<S.length;q+=5,j++){const [full,sh]=S[q+4]&1?B.great:B.track,R=full+sh,a=S[q],b=S[q+1],vx=S[q+2]-a,vy=S[q+3]-b,L=vx*vx+vy*vy,tk=E[j]?64:0;
      for(let cy=Math.max(0,Math.floor((Math.min(b,b+vy)-R)/cs)),y1=Math.min(MH*k-1,Math.floor((Math.max(b,b+vy)+R)/cs));cy<=y1;cy++)
        for(let cx=Math.max(0,Math.floor((Math.min(a,a+vx)-R)/cs)),x1=Math.min(MW*k-1,Math.floor((Math.max(a,a+vx)+R)/cs));cx<=x1;cx++){
          const ex=(cx+.5)*cs-a,ey=(cy+.5)*cs-b,u=L?Math.max(0,Math.min(1,(ex*vx+ey*vy)/L)):0,dx=ex-vx*u,dy=ey-vy*u,d=Math.sqrt(dx*dx+dy*dy);if(d>=R)continue;
          const w=d<=full?63:Math.round(63*(R-d)/sh);if(w)fn(cx,cy,w,tk)}}};
    each((cx,cy)=>{const i=Math.floor(cy/k)*MW+Math.floor(cx/k);if(!ix[i])ix[i]=++n});
    // (the farther in wins; at a tie a road over an estate's track)
    const blk=new Uint8Array(n*k*k);each((cx,cy,w,tk)=>{const i=(ix[Math.floor(cy/k)*MW+Math.floor(cx/k)]-1)*k*k+(cy%k)*k+cx%k,o=blk[i]&63;if(w>o||w===o&&blk[i]&64&&!tk)blk[i]=tk|w});
    this.ix=n<65535?Uint16Array.from(ix):ix;this.blk=blk},
  bytes(){return this.ix?this.ix.byteLength+this.blk.byteLength:0}
};
