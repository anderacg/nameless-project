'use strict';
/* Holdings still save a number, not a typed roster. Crossing that boundary intentionally converts each soldier to one guard. */
class GarrisonService{
  constructor(player,rules){this.player=player;this.rules=rules}
  owned(t){return !!t&&t.owner==='player'}
  canHire(t,n){return this.owned(t)&&troopAmount(n)&&this.player.gold>=this.rules.price*n&&t.gar+n<=this.rules.capacity(t)}
  station(t,k,n){
    if(!this.owned(t))return 0;const roster=this.rules.roster(),m=roster.limit(k,n,this.rules.capacity(t)-t.gar);
    const moved=roster.remove(k,m);t.gar+=moved;if(moved)(t.garKinds||(t.garKinds={}))[k]=(t.garKinds[k]||0)+moved;return moved;
  }
  // (one called up: the cheapest kind you stationed there (t.garKinds), so a peasant comes back a peasant; with none of them left, the
  // holding's own guard. The kinds no more than its garrison: those lost from it, the cheapest first, are gone from them)
  callup(t){
    if(!this.owned(t)||t.gar<=1||this.rules.room()<1)return 0;const K=t.garKinds||{};
    let n=Object.values(K).reduce((a,b)=>a+b,0);for(const k of Object.keys(K).sort((a,b)=>hireCost(a)-hireCost(b))){if(n<=t.gar)break;const c=Math.min(K[k],n-t.gar);K[k]-=c;n-=c;if(!K[k])delete K[k]}
    const k=Object.keys(K).sort((a,b)=>hireCost(a)-hireCost(b))[0]||this.rules.unit(t);
    const moved=this.rules.roster().add(k,1);t.gar-=moved;if(moved&&K[k]){K[k]--;if(!K[k])delete K[k]}return moved;
  }
  hire(t,n){
    const p=this.player;if(!this.canHire(t,n))return 0;
    const moved=this.rules.draft(t,n);p.gold-=this.rules.price*moved;t.gar+=moved;return moved;
  }
}
const garrisons=new GarrisonService(P,{roster:()=>partyRoster(P),capacity:t=>fiefCap(t),room:partyRoom,unit:t=>RACES[t.races[0]].melee,price:30,draft:(t,n)=>draftLocals(t,n)});
