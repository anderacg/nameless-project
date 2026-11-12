'use strict';
/* ---------- provinces (doc/START_AND_GATES_DESIGN.md §2.3, G3; the owner, 2026-11-05: provinces on the map now, with their danger):
   every city and castle a seat, every holding in the province of the seat nearest it (a free hamlet too: the free marches of that
   province). A province's danger: the strength on its land (the beasts, the bands, the bandits' lairs and the lords at war with you,
   within PROVINCE.reach tiles of its holdings) against your army's (PROVINCE.levels: calm, watchful, dangerous, deadly; what
   makes it so, its strongest). Shown on the full map (ui/map.js: its name at its seat, its danger, a lock where its seat refuses
   you); setting out for a deadly one (input.js worldMove), a warning once a day: a soft lock, the road still open ---------- */
class Provinces{
  // the provinces of the world in (made again when its holdings change hands or fall: the key)
  static all(){
    const key=TOWNS.map(t=>t.name+(t.owner||'')+(t.gone?'x':'')).join('|');if(this._k===key&&this._v)return this._v;
    const seats=TOWNS.filter(t=>(t.kind==='city'||t.kind==='castle')&&!t.gone),P0=seats.map(s=>({seat:s,name:'Province of '+s.name,holdings:[s]}));
    for(const t of TOWNS){if(t.gone||seats.includes(t))continue;let best=null,bd=Infinity;
      for(const p of P0){const s=p.seat,d=Math.hypot(s.tx-t.tx,s.ty-t.ty)*(s.owner===t.owner?1:1.5);if(d<bd){bd=d;best=p}}if(best)best.holdings.push(t)}
    this._k=key;this._v=P0;return P0}
  // the province a point (px) lies in: the one whose holding is nearest it
  static at(x,y){let best=null,bd=Infinity;for(const p of this.all())for(const t of p.holdings){const d=Math.hypot(t.x-x,t.y-y);if(d<bd){bd=d;best=p}}return best}
  // its danger: {lv (0-3), word, foes (their power), what (its strongest, in words)}
  static danger(p){
    const X=PROVINCE,R=X.reach*TILE,on=o=>p.holdings.some(t=>Math.hypot(t.x-o.x,t.y-o.y)<=R),list=[];
    for(const m of W.monsters||[])if(!m.dead&&on(m))list.push([m.power(),(MONSTERS[m.id]&&monOf(m).n||'beasts')]);
    for(const b of bandits)if(!b.gone&&on(b))list.push([b.power(),'a band of '+(b.kind||'bandits')]);
    for(const l of W.lords||[])if(!l.dead&&!l.inside&&hostileTo(l.fac)&&on(l))list.push([rating(l.troops),lordName(l)+'’s army']);
    for(const s of W.sites||[])if((s.type==='camp'||s.type==='hideout')&&!s.cleared&&on(s))list.push([X.lair,s.type==='camp'?'a bandit camp':'a hideout']);
    for(const s of W.sites||[])if(s.type===OUTPOST_TYPE&&s.band&&on(s))list.push([X.lair,LAIR_SAY[s.band].toLowerCase()+' in the '+s.name]);// (a standard made a lair: world/outposts.js)
    const foes=list.reduce((a,[v])=>a+v,0),mine=Math.max(1,partyPower()),r=foes/mine;let lv=0;for(let i=0;i<X.levels.length;i++)if(r>=X.levels[i])lv=i+1;
    list.sort((a,b)=>b[0]-a[0]);return{lv,word:X.words[lv],foes,what:list.slice(0,2).map(e=>e[1])}}
  // setting out for (x, y): a warning once a day for a deadly province you are not in
  static warn(x,y){
    if(!PROVINCE.on)return;const p=this.at(x,y);if(!p||p===this.at(P.x,P.y))return;const d=this.danger(p);if(d.lv<PROVINCE.warn)return;
    if(!this._warned)this._warned={};if(this._warned[p.name]===G.day)return;this._warned[p.name]=G.day;
    toast('Few your size come back from the '+p.name+(d.what.length?': '+d.what.join(' and ')+(d.what.length>1?' hold':' holds')+' its roads.':'.'),'bad')}
}
