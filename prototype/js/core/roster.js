'use strict';
/* Count-based soldiers. Services follow the record's current field, so replacing counts during load does not stale them. */
const troopAmount=n=>Number.isSafeInteger(n)&&n>0;
const countsOf=list=>{const c={};for(const k of list||[])if(typeof k==='string'&&!['__proto__','constructor','prototype'].includes(k))c[k]=(c[k]||0)+1;return c};
const expandCounts=c=>{const a=[];for(const k in c)for(let i=0;i<c[k];i++)a.push(k);return a};
class TroopRoster{
  constructor(owner,field,rules={}){this.owner=owner;this.field=field;this.rules=rules}
  get counts(){return this.owner[this.field]||{}}
  get size(){return Object.keys(this.counts).reduce((n,k)=>n+this.count(k),0)}
  get list(){return expandCounts(this.counts)}
  accepts(k){return typeof k==='string'&&!['__proto__','constructor','prototype'].includes(k)&&(!this.rules.valid||this.rules.valid(k))}
  count(k){const c=this.counts;return Object.prototype.hasOwnProperty.call(c,k)&&troopAmount(c[k])?c[k]:0}
  changed(){if(this.rules.changed)this.rules.changed()}
  limit(k,n,room=Infinity){return this.accepts(k)&&troopAmount(n)?Math.max(0,Math.min(n,this.count(k),Math.floor(room)||0)):0}
  add(k,n=1){
    if(!this.accepts(k)||!troopAmount(n)||!Number.isSafeInteger(this.count(k)+n))return 0;
    const c=this.owner[this.field]||(this.owner[this.field]={});c[k]=this.count(k)+n;this.changed();return n;
  }
  remove(k,n=1){const m=this.limit(k,n);if(m){const c=this.counts;c[k]-=m;if(!c[k])delete c[k];this.changed()}return m}
  removeAny(n=1){
    const out=[];if(!troopAmount(n))return out;
    for(let i=0;i<n&&this.size;i++){
      let r=Math.min(this.size-1,Math.floor(Math.random()*this.size));
      for(const k of Object.keys(this.counts)){r-=this.count(k);if(r<0){this.remove(k);out.push(k);break}}
    }
    return out;
  }
  losses(frac){
    const lost={};if(!Number.isFinite(frac)||frac<=0)return lost;frac=Math.min(1,frac);
    for(const k of Object.keys(this.counts))for(let i=0;i<this.count(k);i++)if(Math.random()<frac)lost[k]=(lost[k]||0)+1;
    return lost;
  }
  lose(lost){const taken={};for(const k of Object.keys(lost||{})){const n=this.remove(k,lost[k]);if(n)taken[k]=n}return taken}
  cull(frac){return this.lose(this.losses(frac))}
  transferTo(target,k,n=1,room=Infinity){
    if(target===this||target.counts===this.counts||!target.accepts(k))return 0;
    const m=this.limit(k,n,room);if(!m||!Number.isSafeInteger(target.count(k)+m))return 0;
    this.remove(k,m);target.add(k,m);return m;
  }
  transferAllTo(target,room=Infinity){
    const moved={};for(const k of Object.keys(this.counts)){const n=this.transferTo(target,k,this.count(k),room);if(n){moved[k]=n;room-=n}}return moved;
  }
  transferAnyTo(target,n=1,room=Infinity){
    const moved=[];if(!troopAmount(n)||target===this||target.counts===this.counts)return moved;
    // Select without changing either roster, then use the same checked transfer as a named kind.
    const sample=new TroopRoster({tc:{...this.counts}},'tc'),picked=sample.removeAny(Math.min(n,Math.max(0,Math.floor(room)||0)));
    for(const k of picked)if(this.transferTo(target,k,1,room)){moved.push(k);room--}return moved;
  }
}
