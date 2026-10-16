'use strict';
/* Holdings still save a number, not a typed roster. Crossing that boundary intentionally converts each soldier to one guard. */
class GarrisonService{
  constructor(player,rules){this.player=player;this.rules=rules}
  owned(t){return !!t&&t.owner==='player'}
  canHire(t,n){return this.owned(t)&&troopAmount(n)&&this.player.gold>=this.rules.price*n&&t.gar+n<=this.rules.capacity(t)}
  station(t,k,n){
    if(!this.owned(t))return 0;const roster=this.rules.roster(),m=roster.limit(k,n,this.rules.capacity(t)-t.gar);
    const moved=roster.remove(k,m);t.gar+=moved;return moved;
  }
  callup(t){
    if(!this.owned(t)||t.gar<=1||this.rules.room()<1)return 0;
    const moved=this.rules.roster().add(this.rules.unit(t),1);t.gar-=moved;return moved;
  }
  hire(t,n){
    const p=this.player;if(!this.canHire(t,n))return 0;
    const moved=this.rules.draft(t,n);p.gold-=this.rules.price*moved;t.gar+=moved;return moved;
  }
}
const garrisons=new GarrisonService(P,{roster:()=>partyRoster(P),capacity:t=>fiefCap(t),room:partyRoom,unit:t=>RACES[t.races[0]].melee,price:30,draft:(t,n)=>draftLocals(t,n)});
