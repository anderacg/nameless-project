'use strict';
/* ---------- parties: every band of soldiers on the map keeps them the same way, as counts by kind ({hum_spear: 6, ...}, as
   your own band does), in o.tc. A party's troops (and a bandit band's list, the same thing) are a view: a list built from the
   counts, read-only, for everything that reads soldiers one by one (power, battles, drawing). Change them through the party:
   add, remove, removeAny, cull, or by setting troops to a new list. The kinds: lords, your companions' parties, bandit bands
   and holdings' patrols (caravans and your own band come later). A party made as plain data (a new one, or one from a save) is
   made one of its kind by asParty(o) wherever its soldiers are changed, so plain data keeps working until then. ---------- */
const countsOf=list=>{const c={};for(const k of list||[])c[k]=(c[k]||0)+1;return c};
const expandCounts=c=>{const a=[];for(const k in c)for(let i=0;i<c[k];i++)a.push(k);return a};
const LISTS=new WeakMap();// each party's list view, rebuilt when its soldiers change (kept aside: never saved)
class Party{
  get troops(){let a=LISTS.get(this);if(!a){a=Object.freeze(expandCounts(this.tc));LISTS.set(this,a)}return a}
  set troops(list){this.tc=countsOf(list);this.changed()}
  get size(){let n=0;for(const k in this.tc)n+=this.tc[k];return n}
  has(k){return (this.tc[k]||0)>0}
  add(k,n=1){if(n>0){this.tc[k]=(this.tc[k]||0)+n;this.changed()}return this}
  // take up to n of a kind; returns how many
  remove(k,n=1){const m=Math.min(n,this.tc[k]||0);if(m>0){this.tc[k]-=m;if(!this.tc[k])delete this.tc[k];this.changed()}return m}
  // take n at random, one by one; returns the kinds taken
  removeAny(n=1){const out=[];for(let i=0;i<n;i++){const s=this.size;if(!s)break;let r=Math.floor(Math.random()*s);for(const k in this.tc){r-=this.tc[k];if(r<0){this.remove(k);out.push(k);break}}}return out}
  // each soldier lost with this chance
  cull(frac){for(const k of Object.keys(this.tc)){let lost=0;for(let i=0;i<this.tc[k];i++)if(Math.random()<frac)lost++;this.remove(k,lost)}return this}
  changed(){LISTS.delete(this)}
  // on the map (to be drawn and clicked): not beaten, not inside a holding
  onMap(){return !this.dead&&!this.inside}
  // in sight (fog): within your sight, or nearer when it is in woods or hills
  inView(V){return this.onMap()&&Math.hypot(this.x-P.x,this.y-P.y)<V*(hiddenAt(this.x,this.y)?.45:1)}
  // sheltering in a holding: inside is the holding's name. shelterWhy(t): why it may not go in there ('' if it may; each kind
  // has its rules); enter and leave by the gate
  shelterWhy(t){return !t?'Nowhere':besieged(t)?'The gates are barred for the siege':''}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y+4}
  leave(){const t=townBy(this.inside);this.inside=null;if(t){this.x=t.x+rint(-6,6);this.y=t.y+14}}
  // how it looks on the map (render.js drawParties): colour, rider, moving, label
  look(){return{col:'#888',dir:this.dir||1,moving:true,seed:0,label:String(this.size),labelCol:'#ccc'}}
}
class LordParty extends Party{
  get brain(){return BRAINS.lord}
  shelterWhy(t){return t&&t.owner!==this.fac?'Not a holding of his realm':super.shelterWhy(t)}
  look(){const col=FACS[this.fac].col,still=this.state==='rest'||this.state==='siege';return{col,race:FACS[this.fac].races[0],rider:'horse',dir:faceDir(this),moving:!still,seed:this.id.length*31+this.name.length,label:String(this.size),labelCol:hostileTo(this.fac)?STANCE_COL[stance(rating(this.troops))]:col}}
}
class CompanionParty extends Party{
  get brain(){return BRAINS.cparty}
  shelterWhy(t){return !t?'Nowhere':yourShelterWhy(t)}
  enter(t){this.inside=t.name;this.x=t.x;this.y=t.y}
  inView(V){return this.onMap()&&Math.hypot(this.x-P.x,this.y-P.y)<V}// (yours: always in sight)
  look(){return{col:FACS.player.col,race:P.race,dir:this.dir||1,moving:true,seed:this.cid.length*7,label:COMPS[this.cid].short+' '+this.size,labelCol:'#9fc0ff'}}
}
class PatrolParty extends Party{
  get brain(){return BRAINS.patrol}
  look(){const col=this.fac==='player'?FACS.player.col:FACS[this.fac].col,near=Math.hypot(this.x-P.x,this.y-P.y)<120;
    return{col,race:this.fac==='player'?P.race:FACS[this.fac].races[0],dir:this.dir||1,moving:true,seed:this.home.length*13,torch:watchOf(this)==='night',label:near?String(this.size):'',labelCol:hostileTo(this.fac)?STANCE_COL[stance(rating(this.troops))]:crimeAt(townBy(this.home))&&this.fac!=='player'?'#ff9a90':col}}
}
// a bandit band: its list is its troops; n (how many it shows) follows them
class BandParty extends Party{
  get brain(){return BRAINS.band}
  look(){const c=this.ld;return{col:'#8a4a3a',bandit:true,dir:faceDir(this),moving:!this.idle,seed:Math.round(this.x)%97,label:(c?c.name.split(' ')[0]+' Lv'+c.lv+' · ':'')+this.n,labelCol:STANCE_COL[stance(bandPower(this))]}}
  get list(){return this.troops} set list(a){this.troops=a}
  changed(){super.changed();if(this.tc)this.n=this.size;this.pw=0}
}
// your own band: its counts are P.troops, as they always were (read everywhere as counts), and it changes the way every party
// does (P.add, P.remove, P.size...). Its own troops shadow the list view; its list is built on asking. You are its brain.
class PlayerParty extends Party{
  get tc(){return this.troops} set tc(v){this.troops=v}
  get list(){return expandCounts(this.troops)}
  get brain(){return null}
  get inside(){return this.stay?this.stay.town:null}
  onMap(){return !this.stay}
  shelterWhy(t){return !t?'Nowhere':yourShelterWhy(t,stayCost())}
  enter(t){return startStay(t)}
  leave(why,cls){if(this.stay)leaveStay(why,cls)}
  look(){return{col:'#3d74d6',rider:mountDef()?mountDef().col:'',dir:this.dir||1,moving:this.tx!=null,seed:5,label:'',labelCol:'#fff'}}
}
Object.setPrototypeOf(P,PlayerParty.prototype);
// which kind a plain party is
const partyClassOf=o=>o.cid?CompanionParty:o.pt?PatrolParty:o.fac&&o.name&&!o.cv?LordParty:BandParty;
// make a party one of its kind: its own list of soldiers (or a save's counts) becomes its counts
function asParty(o){
  if(!o||o instanceof Party)return o;
  const own=k=>Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,list=own('troops')||own('list'),C=partyClassOf(o);
  delete o.troops;delete o.list;Object.setPrototypeOf(o,C.prototype);
  o.tc=o.tc||(list?countsOf(list):C===BandParty?countsOf(makeEnemies(o.n||3,false,o.kind)):{});o.changed();return o;
}
// every party on the map, made one of its kind: the lords in the field, bands, patrols, your companions' parties
function allParties(){const a=[...W.lords.filter(l=>!l.dead),...bandits,...(W.patrols||[]),...cparties()];a.forEach(asParty);return a}
Object.defineProperty(W,'parties',{get:allParties,enumerable:false});
// change a party's soldiers, whatever it is yet (plain or made)
const partyAdd=(o,k,n)=>asParty(o).add(k,n);
const partyRemove=(o,k,n)=>asParty(o).remove(k,n);
const partyRemoveAny=(o,n)=>asParty(o).removeAny(n);
