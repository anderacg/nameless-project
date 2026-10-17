'use strict';
/* Character records remain plain JSON. A service owns graph rules, point spending, refunds, slots and ability modifiers. */
class TalentService{
  constructor(owner,rules){this.owner=owner;this.rules=rules}
  node(id){return Object.prototype.hasOwnProperty.call(this.rules.nodes,id)?this.rules.nodes[id]:null}
  skillDef(id){const skills=this.rules.skills();return Object.prototype.hasOwnProperty.call(skills,id)?skills[id]:null}
  has(id){return (this.owner.tree||[]).includes(id)}
  root(){const id=this.rules.root();return id&&this.has(id)?id:'start'}
  knows(id){const S=this.skillDef(id);return !!S&&(!S.learn||this.has(S.learn))}
  canTake(id){const N=this.node(id);return !!N&&!this.has(id)&&this.owner.tp>0&&N.t!=='origin'&&N.links.some(n=>this.has(n))}
  canRefund(id){
    const N=this.node(id),root=this.root();if(!N||id===root||N.t==='origin'||!this.has(id))return false;
    const keep=new Set(this.owner.tree.filter(x=>x!==id)),seen=new Set([root]),q=[root];
    while(q.length){const c=q.pop();for(const n of this.rules.nodes[c].links)if(keep.has(n)&&!seen.has(n)){seen.add(n);q.push(n)}}
    return seen.size===keep.size;
  }
  apply(id,sign){const N=this.node(id);if(!N)return false;const m=N.m,o=this.owner;if(m.attr)for(const a in m.attr)o.attr[a]=Math.max(this.rules.minAttribute,(o.attr[a]||0)+sign*m.attr[a]);return true}
  autoSlot(id){
    if(!this.knows(id))return -1;const o=this.owner;o.slots=o.slots||Array(this.rules.slotCount).fill(null);
    if(o.slots.includes(id))return o.slots.indexOf(id);const i=o.slots.indexOf(null);if(i>=0)o.slots[i]=id;return i;
  }
  take(id){
    if(!this.canTake(id))return {ok:false,code:'ineligible',id};
    const o=this.owner;o.tree.push(id);o.tp--;this.apply(id,1);const unlock=this.rules.nodes[id].m.unlock;
    return {ok:true,code:'learned',id,unlock,slot:unlock?this.autoSlot(unlock):-1};
  }
  refundCost(){return this.rules.refundCost()}
  quoteRefund(id){
    if(!this.canRefund(id))return {ok:false,code:'dependent',id};
    const cost=this.refundCost();if(this.rules.wallet.gold<cost)return {ok:false,code:'gold',id,cost};
    return {ok:true,code:'refunded',id,cost};
  }
  refund(id){
    const result=this.quoteRefund(id);if(!result.ok)return result;const cost=result.cost;
    const o=this.owner;this.rules.wallet.gold-=cost;o.tree=o.tree.filter(x=>x!==id);o.tp++;this.apply(id,-1);
    const unlock=this.rules.nodes[id].m.unlock;if(unlock)o.slots=(o.slots||[]).map(s=>s===unlock?null:s);
    return {ok:true,code:'refunded',id,cost,unlock};
  }
  assignSlot(i,id){
    if(!Number.isInteger(i)||i<0||i>=this.rules.slotCount||id&&!this.knows(id))return {ok:false,code:'slot'};
    const o=this.owner;o.slots=o.slots||Array(this.rules.slotCount).fill(null);o.slots=o.slots.map(s=>s===id?null:s);o.slots[i]=id||null;
    return {ok:true,code:'slot',slot:i,id:id||null};
  }
  canChooseFinisher(id){const f=this.rules.finisher;return !!(f&&Object.prototype.hasOwnProperty.call(f.styles(),id)&&f.ready()&&!this.owner.fin)}
  chooseFinisher(id){
    if(!this.canChooseFinisher(id))return {ok:false,code:'finisher'};
    this.owner.fin=id;return {ok:true,code:'finisher',id};
  }
  ability(id,spell){
    const S=this.skillDef(id);if(!S)return null;const t=this.rules.effect,c=1-t(id+'Cost');
    return {...S,mp:Math.round(S.mp*c*(1-.02*spell)),sp:Math.round(S.sp*c),cd:+(S.cd*(1-t(id+'Cd'))).toFixed(1),r:1+t(id+'R'),dmg:1+t(id+'Dmg'),stun:t(id+'Stun'),dur:t(id+'Dur')};
  }
}
const TALENTS=new WeakMap();
function talentsOf(o){
  let service=TALENTS.get(o);if(!service){service=new TalentService(o,{nodes:TREE,skills:()=>HSKILLS,root:()=>o===P?o.origin:'start',minAttribute:o===P?1:0,slotCount:10,
    wallet:P,refundCost:()=>15*P.level,effect:k=>tmOf(o,k),finisher:o===P?{styles:()=>FIN_STYLE,ready:()=>finReady()}:null});TALENTS.set(o,service)}return service;
}
// Shorthand commands also serve character AI; presentation stays outside the service itself.
const knowsOf=(o,id)=>talentsOf(o).knows(id),treeHasOf=(o,id)=>talentsOf(o).has(id),treeRootOf=o=>talentsOf(o).root();
const canTakeOf=(o,id)=>talentsOf(o).canTake(id),canRefundOf=(o,id)=>talentsOf(o).canRefund(id);
const knows=id=>knowsOf(P,id),treeHas=id=>treeHasOf(P,id),treeRoot=()=>treeRootOf(P),canTake=id=>canTakeOf(P,id),canRefund=id=>canRefundOf(P,id);
const refundCost=()=>talentsOf(P).refundCost();
const applyNodeOf=(o,id,sign)=>talentsOf(o).apply(id,sign),applyNode=(id,sign)=>applyNodeOf(P,id,sign);
const slotSkillOf=(o,id)=>talentsOf(o).autoSlot(id),slotSkill=id=>slotSkillOf(P,id);
const treeWho=o=>o===P?null:Object.keys(P.comps||{}).find(k=>P.comps[k]===o);
function takeNodeOf(o,id,quiet){
  const r=talentsOf(o).take(id);if(!r.ok)return false;const who=treeWho(o),nm=who&&COMPS[who]?COMPS[who].short:null;
  if(!quiet)log(r.unlock?(nm?nm+' learns':'Learned')+' the active skill '+HSKILLS[r.unlock].n+(r.slot>=0?', in slot '+(r.slot+1):'; put it in a free slot on the Skill bar')+'.':(nm?nm+' learns':'Learned')+': '+TREE[id].n+'.','gold');
  return true;
}
const takeNode=id=>takeNodeOf(P,id);
function refundNodeOf(o,id){
  const r=talentsOf(o).refund(id);if(!r.ok)return false;if(o===P)vitals();const who=treeWho(o),nm=who&&COMPS[who]?COMPS[who].short:o.name||'They';
  log((o===P?'You unlearn ':nm+' unlearns ')+TREE[id].n+'.');return true;
}
const refundNode=id=>refundNodeOf(P,id);
const abilOf=(o,id,spell)=>talentsOf(o).ability(id,spell),abil=id=>abilOf(P,id,skill('spell'));
const dodgeCost=()=>Math.round(STAM.dodge*(1-tm('dodgeCost'))),dodgeCd=()=>DODGE_CD*(1-tm('dodgeCd'));
