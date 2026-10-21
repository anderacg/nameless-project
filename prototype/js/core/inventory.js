'use strict';
/* ---------- a bag (doc/ITEMS_DESIGN.md §4a). Its operations work on plain saved records; keep the owner, not its array: load, sort
   and rollback can replace that array. Its size is its capacity (your hero's and your mount's packs); what does not fit goes into
   overflow slots past it, nothing refused up to BAG.maxOver of them (data/items.js), each slot over a burden on your pace (burden);
   past that nothing more is carried (force: a quest item still is). It carries only what its category routes to the bag (an item
   with none, a holding's old arrows, never); gained(k, id, n): what n of a thing coming in does (a drink's morale) ---------- */
class Inventory{
  constructor(owner,capacity,stack,gained){this.owner=owner;this.capacity=capacity;this.stack=stack;this.gained=gained||null}
  get slots(){return this.owner.inv}
  // its own size; its slots filled; empty ones within its size; filled past it; and those it can still fill (to its limit)
  get size(){return this.capacity()}
  get used(){return this.slots.reduce((n,s)=>n+(s?1:0),0)}
  get free(){return Math.max(0,this.size-this.used)}
  get over(){return Math.max(0,this.used-this.size)}
  get spare(){return Math.max(0,this.size+BAG.maxOver-this.used)}
  // its pace: × 1 − BAG.per a slot over, never under BAG.floor
  burden(){return Math.max(BAG.floor,1-BAG.per*this.over)}
  // does it carry this (its category goes to the bag)?
  carries(k,id){const c=itemKind({k,id}).cat({k,id});return !!c&&c.route==='bag'}
  count(k,id){return this.slots.reduce((n,s)=>n+(s&&s.k===k&&s.id===id?s.n:0),0)}
  // how many more of one it takes: the room in its stacks of it, and a stack in each slot it can still fill
  room(k,id){
    if(!this.carries(k,id))return 0;
    const max=this.stack(k,id);return this.slots.reduce((n,s)=>n+(s&&s.k===k&&s.id===id?max-s.n:0),0)+this.spare*max}
  // up to n of one in (force: past its limit; extra: fields of each new record, a quest item's by): how many went in
  add(k,id,n,force,extra){
    if(!(n>0)||!this.carries(k,id))return 0;
    let left=n;const max=this.stack(k,id);
    if(max>1)for(const s of this.slots)if(left&&s&&s.k===k&&s.id===id&&s.n<max){const m=Math.min(left,max-s.n);s.n+=m;left-=m}
    while(left&&(force||this.spare)){const m=Math.min(left,max);this.put({k,id,n:m,...extra},true);left-=m}
    if(left<n&&this.gained)this.gained(k,id,n-left);
    return n-left;
  }
  // a record into its first empty slot, else a new one past the last (force: past its limit too): where (-1: no room)
  put(rec,force){
    if(!force&&!this.spare)return -1;
    const i=this.slots.indexOf(null);if(i>=0){this.slots[i]=rec;return i}
    this.slots.push(rec);return this.slots.length-1;
  }
  take(k,id,n){
    let left=n;const idx=this.slots.map((s,i)=>i).filter(i=>this.slots[i]&&this.slots[i].k===k&&this.slots[i].id===id).sort((a,b)=>this.slots[a].n-this.slots[b].n);
    for(const i of idx){if(!left)break;const s=this.slots[i],m=Math.min(left,s.n);s.n-=m;left-=m;if(!s.n)this.slots[i]=null}
    return n-left;
  }
  // tidied: what lies past its size moved into its empty slots, the empty ones past it dropped
  settle(){
    const s=this.slots,cap=this.size;
    for(let i=cap;i<s.length;i++)if(s[i]){const j=s.indexOf(null);if(j<0||j>=cap)break;s[j]=s[i];s[i]=null}
    if(s.length>cap)s.push(...s.splice(cap).filter(Boolean));
  }
  // to its size (a pack put on or taken off): false when what it holds would be past its limit
  resize(){
    this.settle();if(this.used>this.size+BAG.maxOver)return false;
    while(this.slots.length<this.size)this.slots.push(null);return true;
  }
  sort(compare){
    const merged=[];
    for(const s of this.slots.filter(Boolean)){
      const m=s.k!=='gear'&&merged.find(x=>x.k===s.k&&x.id===s.id&&x.n<this.stack(x.k,x.id));
      if(m){const n=Math.min(s.n,this.stack(m.k,m.id)-m.n);m.n+=n;s.n-=n;if(s.n)merged.push(s)}else merged.push(s);
    }
    merged.sort(compare);this.owner.inv=merged.concat(Array(Math.max(0,this.size-merged.length)).fill(null));
  }
}
// (what each record is, its stack, its category and order: its kind, core/items.js itemKind; what one coming in does: its kind's gained)
const playerInventory=new Inventory(P,()=>INV_SIZE+gm('slots'),stackOf,(k,id,n)=>itemKind({k,id}).gained({k,id},n));
// what a refused thing says (past the bag's limit)
const BAG_FULL='You cannot carry any more';
const invCap=()=>playerInventory.size;
const invFree=()=>playerInventory.free;
const invCount=(k,id)=>playerInventory.count(k,id);
const goodN=g=>invCount('good',g);
const goodRoom=g=>playerInventory.room('good',g);
const foodN=()=>FOODS.reduce((n,g)=>n+goodN(g),0);
const foodKinds=()=>FOODS.filter(g=>goodN(g)>0).length;
function foodTake(n){let left=n;for(const g of FOODS){if(!left)break;left-=goodTake(g,left)}return n-left}
const goodTake=(g,n)=>playerInventory.take('good',g,n);
// Rewards can collect on the loot pile; equipment transfers call Inventory directly because they already belong to the player.
// (what is not an item, a holding's old arrows, goes nowhere)
function invAdd(k,id,n){if(!playerInventory.carries(k,id))return 0;if(looting()){lootPile(k,id,n);return n}return playerInventory.add(k,id,n)}
const fitInv=()=>playerInventory.resize();
// your pace under the bag's burden (world/world.js bandPace), and the card's Burdened tag (render.js updateHUD), or null: the
// slots over, the pace they cost and what one slot freed gives back
const bagPace=()=>playerInventory.burden();
function burdenTag(){
  const I=playerInventory,o=I.over;if(!o)return null;
  const cost=Math.round((1-I.burden())*100),back=Math.round((Math.max(BAG.floor,1-BAG.per*(o-1))-I.burden())*100);
  return ['Burdened',I.spare?'warn':'bad',o+' slot'+(o>1?'s':'')+' past your bag’s '+I.size+': your pace is '+cost+'% slower. '+(back?'Each slot you free gives back '+back+'%.':'Free some slots to walk faster.')+(I.spare?'':' '+BAG_FULL+'.')];
}
// sorted: by category (in ITEM_CATS's order), then as each kind sorts its own (two kinds in one category: the dearer first)
const CAT_AT=Object.fromEntries(Object.keys(ITEM_CATS).map((c,i)=>[c,i]));
function sortInventory(){
  playerInventory.sort((a,b)=>{
    const A=itemKind(a),B=itemKind(b),ca=CAT_AT[A.catId(a)]??99,cb=CAT_AT[B.catId(b)]??99;
    return ca-cb||(A===B?A.compare(a,b):B.worth(b)-A.worth(a));
  });
}
