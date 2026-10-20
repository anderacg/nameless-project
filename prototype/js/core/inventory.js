'use strict';
/* Bag operations work on plain saved records. Keep the owner, not its array: load, sort and rollback can replace that array. */
class Inventory{
  constructor(owner,capacity,stack){this.owner=owner;this.capacity=capacity;this.stack=stack}
  get slots(){return this.owner.inv}
  get free(){return this.slots.filter(s=>!s).length}
  count(k,id){return this.slots.reduce((n,s)=>n+(s&&s.k===k&&s.id===id?s.n:0),0)}
  room(k,id){const max=this.stack(k,id);return this.slots.reduce((n,s)=>n+(!s?max:s.k===k&&s.id===id?max-s.n:0),0)}
  add(k,id,n){
    let left=n;const max=this.stack(k,id);
    if(max>1)for(const s of this.slots)if(left&&s&&s.k===k&&s.id===id&&s.n<max){const m=Math.min(left,max-s.n);s.n+=m;left-=m}
    for(let i=0;i<this.slots.length&&left;i++)if(!this.slots[i]){const m=Math.min(left,max);this.slots[i]={k,id,n:m};left-=m}
    return n-left;
  }
  take(k,id,n){
    let left=n;const idx=this.slots.map((s,i)=>i).filter(i=>this.slots[i]&&this.slots[i].k===k&&this.slots[i].id===id).sort((a,b)=>this.slots[a].n-this.slots[b].n);
    for(const i of idx){if(!left)break;const s=this.slots[i],m=Math.min(left,s.n);s.n-=m;left-=m;if(!s.n)this.slots[i]=null}
    return n-left;
  }
  resize(){
    const cap=this.capacity();if(this.slots.length>cap&&this.slots.slice(cap).some(Boolean))return false;
    while(this.slots.length<cap)this.slots.push(null);this.slots.length=cap;return true;
  }
  sort(compare){
    const merged=[];
    for(const s of this.slots.filter(Boolean)){
      const m=s.k!=='gear'&&merged.find(x=>x.k===s.k&&x.id===s.id&&x.n<this.stack(x.k,x.id));
      if(m){const n=Math.min(s.n,this.stack(m.k,m.id)-m.n);m.n+=n;s.n-=n;if(s.n)merged.push(s)}else merged.push(s);
    }
    merged.sort(compare);this.owner.inv=merged.concat(Array(this.capacity()-merged.length).fill(null));
  }
}
// (what each record is, its stack and its order: its kind, core/items.js itemKind)
const playerInventory=new Inventory(P,()=>INV_SIZE+gm('slots'),stackOf);
const invCap=()=>playerInventory.capacity();
const invFree=()=>playerInventory.free;
const invCount=(k,id)=>playerInventory.count(k,id);
const goodN=g=>invCount('good',g);
const goodRoom=g=>playerInventory.room('good',g);
const foodN=()=>FOODS.reduce((n,g)=>n+goodN(g),0);
const foodKinds=()=>FOODS.filter(g=>goodN(g)>0).length;
function foodTake(n){let left=n;for(const g of FOODS){if(!left)break;left-=goodTake(g,left)}return n-left}
const goodTake=(g,n)=>playerInventory.take('good',g,n);
// Rewards can collect on the loot pile; equipment transfers call Inventory directly because they already belong to the player.
function invAdd(k,id,n){if(looting()){lootPile(k,id,n);return n}return playerInventory.add(k,id,n)}
const fitInv=()=>playerInventory.resize();
// sorted: by kind (gear, goods, trophies, letters), then as each kind sorts its own
function sortInventory(){
  playerInventory.sort((a,b)=>{
    const A=itemKind(a),B=itemKind(b);
    return a.k!==b.k?A.place-B.place:A.compare(a,b);
  });
}
