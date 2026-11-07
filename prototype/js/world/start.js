'use strict';
/* ---------- the humble start (doc/START_AND_GATES_DESIGN.md §1; the owner, 2026-11-05: "start from nothing: you spawn in a small
   hamlet far away", every past with its own reason): where a new game puts you. StartPlace.pick(k) picks, for past k, a hamlet or
   a small village by its row of PAST_START (whose, which kinds, what it lies by, how far from the capitals), fair by HUMBLE_START
   (no bandits or wild land close, a realm's holding a road away), among your own people's first (a holding of your race), then
   anyone's; {t: the place, c: what it lies by (a castle, a town), line: the
   first line}, or null (HUMBLE_START off, or nowhere fits: your people's capital, as before). The draw that breaks ties is the
   'origin' content stream's (core/rng.js), its own, so one world and one game's number start alike and the start's other draws
   stay as they were ---------- */
class StartPlace{
  // the capitals of the realms, and yours
  static capitals(){return FIDS.map(f=>realmCapital(f)).filter(Boolean)}
  // (is it fair: nothing that hunts a newcomer close, somewhere to go next by road: the next holding, or null)
  static fair(t){
    const X=HUMBLE_START,near=(x,y,r)=>Math.hypot(x-t.tx,y-t.ty)<r;
    if(CAMP_SPOTS.some(c=>near(c.tx,c.ty,X.camp))||W.sites.some(s=>s instanceof Hideout&&near(s.tx,s.ty,X.camp)))return null;
    const R=WM.region;if(R)for(let y=t.ty-X.wild;y<=t.ty+X.wild;y++)for(let x=t.tx-X.wild;x<=t.tx+X.wild;x++)if(WM.has(x,y)&&R[y*MW+x]&&near(x,y,X.wild))return null;
    let best=null,bd=Infinity;for(const o of TOWNS){if(o===t||!o.owner||o.kind==='hamlet'||!Router.reach(t,o))continue;const d=Router.days(t,o);if(d<bd){bd=d;best=o}}
    return bd<=X.next?best:null}
  // (what it lies by, for near: the holding it names ({c}), true, or null)
  static by(t,near){
    const X=HUMBLE_START;if(!near)return true;
    if(near==='castle'||near==='town'){const want=near==='castle'?['castle']:['town','city'],lim=near==='castle'?[0,X.castle]:X.town;let best=null,bd=Infinity;
      for(const o of TOWNS){if(!want.includes(o.kind)||!o.owner||(near==='castle'&&t.owner&&o.owner!==t.owner)||!Router.reach(t,o))continue;const d=Router.days(t,o);if(d>=lim[0]&&d<=lim[1]&&d<bd){bd=d;best=o}}return best}
    if(near==='woods'){let n=0,f=0;for(let y=t.ty-X.woodsR;y<=t.ty+X.woodsR;y++)for(let x=t.tx-X.woodsR;x<=t.tx+X.woodsR;x++){if(!WM.has(x,y))continue;n++;if(tAt(x,y)===T_FOREST)f++}return n&&f/n>=X.woods?true:null}
    if(near==='stones')return W.sites.some(s=>(s.type==='shrine'||s.type==='ruins')&&Math.hypot(s.tx-t.tx,s.ty-t.ty)<=X.stones)?true:null;
    if(near==='road'){const g=(t.ty+1)*MW+t.tx,gx=t.tx,gy=t.ty+1;for(const r of WM.roads)if(r.kind==='road'&&!r.est)for(const i of r.path){const x=i%MW,y=(i-x)/MW;if(Math.abs(x-gx)<=X.road&&Math.abs(y-gy)<=X.road&&i!==g)return true}return null}
    return null}
  // (the places for a row: its kinds and whose, each with its days from the nearest capital and from your own)
  // (ours: only your own people's: a holding of your race (the owner, 2026-11-07: "make the starting city align with race"))
  static ours(t){return (t.races||[]).includes(P.race)}
  static places(row,kinds,at,ours){
    const caps=this.capitals(),own=capitalOf(P.race);
    return TOWNS.filter(t=>kinds.includes(t.kind)&&!t.gone&&(!ours||this.ours(t))&&(at==='free'?!t.owner:at==='realm'?!!t.owner:true)).map(t=>{
      const ds=caps.filter(c=>Router.reach(t,c)).map(c=>Router.days(t,c));return{t,far:ds.length?Math.min(...ds):99,own:own&&Router.reach(t,own)?Router.days(t,own):99}})}
  // where past k begins
  static pick(k){
    if(!HUMBLE_START.on)return null;const row=PAST_START[k];if(!row)return null;
    const R=rngOf('origin'),tries=[[row.at,row.kinds,row.near],[row.at,row.kinds,null],['any',['hamlet'],null],['any',['village','hamlet'],null]];
    // (your own people's places first, each of the row's tries; then anyone's, as before)
    for(const ours of [true,false])for(const [at,kinds,near] of tries){let best=null,bs=-Infinity;
      for(const p of this.places(row,kinds,at,ours)){if(p.far<HUMBLE_START.off)continue;const c=this.by(p.t,near);if(!c)continue;const next=this.fair(p.t);if(!next)continue;
        const s=(row.away?Math.min(p.far,p.own)+p.own*.5:0)+R.next()*HUMBLE_START.jitter*(row.away?1:10);if(s>bs){bs=s;best={t:p.t,c:c===true?null:c,next}}}
      if(best){const c=best.c||best.next;best.line=row.line.replace('{h}',best.t.name).replace('{c}',c.name);return best}}
    return null}
}
