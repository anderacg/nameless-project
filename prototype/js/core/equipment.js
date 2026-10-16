'use strict';
/* One transaction for every wearer. The service returns an outcome; its caller decides how to present it. */
class EquipmentService{
  constructor(owner,inventory,rules){this.owner=owner;this.inventory=inventory;this.rules=rules}
  accepts(key,id){
    const I=this.rules.items[id];if(!I||!this.rules.slots.includes(key))return false;
    if(key==='offhand')return I.slot==='offhand'||this.rules.dualWield&&I.slot==='weapon'&&(I.hand||'one')==='one';
    return this.rules.slotType(key)===I.slot;
  }
  twoHanded(id){const I=this.rules.items[id];return !!I&&I.hand==='two'}
  blockedWhy(key){
    const g=this.owner.gear;
    if(this.rules.mountKeys.includes(key)&&!g.mount)return 'Equip a mount first: its gear needs something to wear it.';
    if(key==='offhand'&&this.twoHanded(g.weapon))return 'The '+this.rules.items[g.weapon].n+' takes both hands.';
    return '';
  }
  displaced(){
    const g=this.owner.gear;
    return [...(this.twoHanded(g.weapon)&&g.offhand?['offhand']:[]),...(g.mount?[]:this.rules.mountKeys.filter(k=>g[k]))];
  }
  transaction(change,fail){
    const gear={...this.owner.gear},inv=this.inventory.slots.map(s=>s&&{...s});
    const undo=reason=>{this.owner.gear=gear;this.inventory.owner.inv=inv;return {ok:false,reason:reason||'',moved:[]}};
    try{
      if(!change())return undo();const moved=[];
      for(const key of this.displaced()){
        const id=this.owner.gear[key],name=this.rules.items[id].n;
        if(!this.inventory.add('gear',id,1))return undo('Your bag is full. Make room for the '+name+' first.');
        this.owner.gear[key]=null;moved.push(name);
      }
      if(!this.inventory.resize())return undo(fail||'Empty the extra bag slots before you swap that.');
      return {ok:true,reason:'',moved};
    }catch(e){undo();throw e}
  }
  equip(i,key){
    const s=Number.isInteger(i)&&i>=0&&this.inventory.slots[i];
    if(!s||s.k!=='gear'||!this.accepts(key,s.id))return {ok:false,reason:'',moved:[]};
    const reason=this.blockedWhy(key);if(reason)return {ok:false,reason,moved:[]};
    return this.transaction(()=>{const old=this.owner.gear[key];this.owner.gear[key]=s.id;this.inventory.slots[i]=old?{k:'gear',id:old,n:1}:null;return true});
  }
  unequip(key,to){
    const id=this.owner.gear[key];if(!this.rules.slots.includes(key)||!id)return {ok:false,reason:'',moved:[]};
    const i=Number.isInteger(to)&&to>=0&&to<this.inventory.slots.length&&!this.inventory.slots[to]?to:this.inventory.slots.indexOf(null);
    if(i<0)return {ok:false,reason:'Your bag is full. Make room before you take that off.',moved:[]};
    return this.transaction(()=>{this.owner.gear[key]=null;this.inventory.slots[i]={k:'gear',id,n:1};return true},'Empty the extra bag slots before you take that off.');
  }
  swap(a,b){
    const x=this.owner.gear[a],y=this.owner.gear[b];
    if(!x||!this.accepts(b,x)||y&&!this.accepts(a,y))return {ok:false,reason:'',moved:[]};
    const reason=this.blockedWhy(b)||y&&this.blockedWhy(a);if(reason)return {ok:false,reason,moved:[]};
    return this.transaction(()=>{this.owner.gear[a]=y||null;this.owner.gear[b]=x;return true});
  }
}
const heroEquipment=new EquipmentService(P,playerInventory,{items:ITEMS,slots:EQUIP,slotType:slotOfKey,mountKeys:MOUNT_KEYS,dualWield:true});
const accepts=(key,id)=>heroEquipment.accepts(key,id);
const twoHanded=id=>heroEquipment.twoHanded(id);
const blockedWhy=key=>heroEquipment.blockedWhy(key);
const targetKey=id=>{const sl=ITEMS[id].slot;if(sl!=='ring')return sl;const f=EQUIP.filter(k=>k.startsWith('ring'));return f.find(k=>!P.gear[k])||f[0]};
