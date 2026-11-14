'use strict';
/* Character records remain plain JSON. A service owns graph rules, point spending, refunds, slots and ability modifiers. */
class TalentService{
  constructor(owner,rules){this.owner=owner;this.rules=rules}
  node(id){return Object.prototype.hasOwnProperty.call(this.rules.nodes,id)?this.rules.nodes[id]:null}
  skillDef(id){const skills=this.rules.skills();return Object.prototype.hasOwnProperty.call(skills,id)?skills[id]:null}
  has(id){return (this.owner.tree||[]).includes(id)}
  root(){const id=this.rules.root();return id&&this.has(id)?id:'start'}
  knows(id){const S=this.skillDef(id);return !!S&&(!S.learn||this.has(S.learn))}
  /* the round tree (data/tree.js TREE_RING, PROF_TREE, TREE_PATH; the owner, 2026-11-08, Skyrim's way): skill points, LEVEL.pts each
     level of the character's, spent on any of its nodes, each its cost by kind (2026-11-13, the owner: "make skill harder to unlock":
     TREE_COST); a node opens once a node linked to it is learned (a path's first pair at once: entry) and its proficiency has reached
     its tier's level (TREE_GATE). What a node gives grows with its proficiency's level (treeScale: state.js tmOf) */
  profLv(k){const s=this.owner.sk&&this.owner.sk[k];return s?s.lv:0}
  reached(id){const N=this.node(id);return !!N&&!!N.prof}
  // (its tier's nodes, of proficiency k; how many of them it has)
  trees(){return this.rules.trees?this.rules.trees():PROF_TREE}
  tierHas(k,t){const R=this.trees(),T=R[k]&&R[k][t];return T?T.filter(([id])=>this.has(id)).length:0}
  // (what a node costs, by its kind: rules.costs, data/tree.js TREE_COST; an origin free; and the level of its proficiency its tier
  // waits for: rules.gates, TREE_GATE, a bonus node its tier below's)
  cost(id){const N=this.node(id),C=this.rules.costs;return N&&N.prof?C&&C[N.t]||1:0}
  gate(id){const N=this.node(id),L=this.rules.gates;return N&&N.prof&&L?L[Math.min(N.tier,L.length-1)]||0:0}
  gated(id){const N=this.node(id);return !!N&&this.profLv(N.prof)<this.gate(id)}
  // its points: earned (its level × LEVEL.pts), spent (the trees' nodes it has, each its cost), left
  points(){const earned=Math.max(0,(this.owner.level??this.owner.lv??0)|0)*LEVEL.pts,spent=(this.owner.tree||[]).reduce((a,id)=>a+this.cost(id),0);return{earned,spent,left:Math.max(0,earned-spent)}}
  // (linked to one learned, or a path's first pair)
  reach(id){const N=this.node(id);return !!N&&!!N.prof&&(!!N.entry||(N.links||[]).some(l=>this.has(l)))}
  canTake(id){return !this.has(id)&&this.reach(id)&&!this.gated(id)&&this.points().left>=this.cost(id)}
  // (unlearned, nothing left hanging: every other node learned still reached from the middle without it)
  canRefund(id){const N=this.node(id);if(!N||!N.prof||!this.has(id))return false;const L=(this.owner.tree||[]).filter(x=>x!==id&&this.node(x)?.prof),seen=new Set(L.filter(x=>this.node(x).entry)),q=[...seen];
    while(q.length){const x=q.pop();for(const l of this.node(x).links||[])if(L.includes(l)&&!seen.has(l)){seen.add(l);q.push(l)}}return seen.size===L.length}
  // (the nodes still to learn on the shortest way to id, the first one open now: [] when it is learned or out of reach)
  pathTo(id){if(!this.node(id)||this.has(id))return [];const prev=new Map([[id,null]]),q=[id];
    while(q.length){const x=q.shift();if(this.reach(x)){const out=[];for(let y=x;y!=null;y=prev.get(y))out.push(y);return out}
      for(const l of this.node(x).links||[])if(!this.has(l)&&!prev.has(l)&&this.node(l)?.prof){prev.set(l,x);q.push(l)}}return []}
  // (a proficiency's nodes: its pairs and the bonus nodes between them)
  nodesOf(k){const R=this.rules.nodes;return Object.keys(R).filter(id=>R[id]&&R[id].prof===k)}
  // what waits: each point left while a node can be taken (the first tree with one, once a point); of one tree, prof: [prof] if it has one
  pending(prof){const R=this.trees(),left=this.points().left;if(!left)return [];const can=k=>this.nodesOf(k).some(id=>this.canTake(id));
    if(prof)return R[prof]&&can(prof)?[prof]:[];const k=Object.keys(R).find(can);return k?Array(left).fill(k):[]}
  apply(id){return !!this.node(id)}
  autoSlot(id){
    if(!this.knows(id))return -1;const o=this.owner;o.slots=o.slots||Array(this.rules.slotCount).fill(null);
    if(o.slots.includes(id))return o.slots.indexOf(id);const i=o.slots.indexOf(null);if(i>=0)o.slots[i]=id;return i;
  }
  take(id){
    if(!this.canTake(id))return {ok:false,code:'ineligible',id};
    const o=this.owner;o.tree.push(id);this.apply(id,1);const unlock=this.rules.nodes[id].m.unlock;
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
    const o=this.owner;this.rules.wallet.gold-=cost;o.tree=o.tree.filter(x=>x!==id);this.apply(id,-1);
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
  let service=TALENTS.get(o);if(!service){service=new TalentService(o,{nodes:TREE,skills:()=>HSKILLS,root:()=>o===P?o.origin:'start',slotCount:10,
    wallet:P,refundCost:()=>15*P.level,costs:TREE_COST,gates:TREE_GATE,ai:()=>['lord','chieftain'].includes(charRole(o)),effect:k=>tmOf(o,k),finisher:o===P?{styles:()=>FIN_STYLE,ready:()=>finReady()}:null});TALENTS.set(o,service)}return service;
}
// Shorthand commands also serve character AI; presentation stays outside the service itself.
const knowsOf=(o,id)=>talentsOf(o).knows(id),treeHasOf=(o,id)=>talentsOf(o).has(id),treeRootOf=o=>talentsOf(o).root();
const canTakeOf=(o,id)=>talentsOf(o).canTake(id),canRefundOf=(o,id)=>talentsOf(o).canRefund(id);
const treePendingOf=(o,prof)=>talentsOf(o).pending(prof),treePending=prof=>treePendingOf(P,prof);
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
