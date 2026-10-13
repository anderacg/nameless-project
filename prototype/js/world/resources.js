'use strict';
/* ---------- resources: where the land holds ore veins and fishing grounds, and what each holding's mines and ports bring up ---------- */
// The map is the same every game, and so are its deposits: one chance in each 3 x 3 block of tiles on a hill (an ore vein, by
// ORE_W) or in water by the shore (a fishing ground, by FISH_W), and one in ten mountain tiles. Common ores are everywhere;
// silver, gold and gems favour the mountains and the desert, mithril only the frozen peaks, and adamantite lies only deep inside
// the great ranges. A holding works the veins and waters within RES_RANGE tiles: its mine brings up their ores, its port their fish (data/economy.js, RES_RATE).
const DEPOSITS=[],DEP_AT=new Int16Array(MW*MH).fill(-1);
(function(){
  const pick=(w,r)=>{const ks=Object.keys(w).filter(k=>w[k]>0),tot=ks.reduce((a,k)=>a+w[k],0);let x=r*tot;for(const k of ks){x-=w[k];if(x<0)return k}return ks[ks.length-1]};
  const shore=(x,y)=>[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>{const t=tAt(x+a,y+b);return t!==T_WATER&&t!==T_MOUNT});
  const deep=(x,y)=>[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].every(([a,b])=>tAt(x+a,y+b)===T_MOUNT);
  const put=(x,y,g)=>{DEP_AT[y*MW+x]=DEPOSITS.length;DEPOSITS.push({tx:x,ty:y,g,rich:1+Math.floor(hash(x,y,74)*2)*.5+(hash(x,y,75)<.15?.5:0),kind:ORE_W[g]?'ore':'fish'})};
  const ore=(x,y,where)=>{const c=CLIMS[climate[y*MW+x]],w={};for(const k in ORE_W)w[k]=ORE_W[k][where]*ORE_W[k].clim[c];if(where==='mount'&&deep(x,y))w.adamant=(w.adamant||0)+1.5;return pick(w,hash(x,y,76))};
  for(let by=0;by<MH;by+=3)for(let bx=0;bx<MW;bx+=3){
    const x=bx+Math.floor(hash(bx,by,71)*3),y=by+Math.floor(hash(bx,by,72)*3);if(x<1||y<1||x>=MW-1||y>=MH-1)continue;
    const t=tiles[y*MW+x],c=CLIMS[climate[y*MW+x]],r=hash(x,y,73);
    if(t===T_HILL&&r<.55)put(x,y,ore(x,y,'hill'));
    else if(t===T_WATER&&shore(x,y)&&r<.35){const w={};for(const k in FISH_W)w[k]=FISH_W[k][c];if(Object.values(w).some(v=>v>0))put(x,y,pick(w,hash(x,y,76)))}}
  for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++)if(tiles[y*MW+x]===T_MOUNT&&hash(x,y,77)<.1)put(x,y,ore(x,y,'mount'));
  // every holding has a home deposit that suits its land and its folk: dwarves dig iron, silver and mithril, orcs gold and gems,
  // a holding known for cheap iron has its seam. It lies on the nearest hill or mountain (or is a fishing ground by the nearest shore)
  // within HOME_RANGE, further out than its other veins if need be: it always counts as the holding's own (d.home)
  const RACE_ORE={dwarf:{iron:2,silver:2.5,mithril:3,gems:1.5},orc:{gold:2,gems:2,iron:1.3},elf:{silver:1.5,tin:1.3},human:{copper:1.3,tin:1.3}};
  for(const t of TOWNS){const c=t.clim||CLIMS[climate[t.ty*MW+t.tx]],rock=[],wet=[];
    for(let y=t.ty-HOME_RANGE;y<=t.ty+HOME_RANGE;y++)for(let x=t.tx-HOME_RANGE;x<=t.tx+HOME_RANGE;x++){if(x<1||y<1||x>=MW-1||y>=MH-1||Math.hypot(x-t.tx,y-t.ty)>HOME_RANGE||DEP_AT[y*MW+x]>=0)continue;
      const tt=tiles[y*MW+x];if(tt===T_HILL||tt===T_MOUNT)rock.push([x,y]);else if(tt===T_WATER&&shore(x,y))wet.push([x,y])}
    const w={},rb=Object.assign({},...t.races.map(r=>RACE_ORE[r]||{}));
    if(rock.length)for(const k in ORE_W)w[k]=(ORE_W[k].hill+ORE_W[k].mount)*(ORE_W[k].clim[c]||0)*(rb[k]||1)*(k==='iron'&&t.mod&&t.mod.iron<=.8?4:1);
    if(wet.length)for(const k in FISH_W)w[k]=(FISH_W[k][c]||0)*(rock.length?.8:1.5);
    // no rock or water in reach at all: a seam under the holding itself
    if(!Object.values(w).some(v=>v>0)){for(const k in ORE_W)w[k]=ORE_W[k].hill*(ORE_W[k].clim[c]||0)*(rb[k]||1);rock.push([t.tx,t.ty])}
    const g=pick(w,hash(t.tx,t.ty,78)),at=(ORE_W[g]?rock:wet).sort((p,q)=>Math.hypot(p[0]-t.tx,p[1]-t.ty)-Math.hypot(q[0]-t.tx,q[1]-t.ty))[0];
    put(at[0],at[1],g);Object.assign(DEPOSITS[DEPOSITS.length-1],{rich:1.5,home:t.name})}
})();
// what a holding's land holds: {good: richness} over its home deposit and the others within RES_RANGE (the map never changes, so it is kept)
function resOf(t){if(t._res)return t._res;const o={};for(const d of DEPOSITS)if(d.home===t.name||Math.hypot(d.tx-t.tx,d.ty-t.ty)<=RES_RANGE)o[d.g]=(o[d.g]||0)+d.rich;return t._res=o}
const resHas=(t,kind)=>Object.keys(resOf(t)).filter(g=>(ORE_W[g]?'ore':'fish')===kind);
// a day's yield per level of its mine (the ores of its veins, or poor seams of iron and copper where it has none) or its port
// (fish, ships' spice, and the catch of its fishing grounds)
function resOut(t,k){
  const o={},R=resOf(t);
  if(k==='mine'){for(const g of resHas(t,'ore'))o[g]=RES_RATE[g]*Math.min(2,R[g]);if(!Object.keys(o).length){o.iron=1.5;o.copper=1}}
  else if(k==='port'){Object.assign(o,MAKE.port.out);for(const g of resHas(t,'fish'))o[g]=RES_RATE[g]*Math.min(2,R[g])}
  return o;
}
// the holding's resources, for its panel: rarest first
const resText=t=>{const ks=Object.keys(resOf(t)).sort((a,b)=>GOODS[b].base-GOODS[a].base);return ks.length?ks.map(g=>GOODS[g].n.toLowerCase()).join(', '):''};
// what a miner or fisher of a holding carries: its richest ore or catch
const jobGood=(t,job)=>{const kind=job==='miner'?'ore':job==='fisher'?'fish':null,ks=kind&&t?resHas(t,kind).sort((a,b)=>resOf(t)[b]-resOf(t)[a]):[];
  return ks.length?[ks[0],Math.max(1,Math.round(JOB_GOODS[job][1]*Math.min(1,RES_RATE[ks[0]]/2)))]:JOB_GOODS[job]||['grain',3]};
