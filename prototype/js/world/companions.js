'use strict';
/* ---------- companions grow as you do: a level from the experience you share, gear you give them, disciplines that rise as
   they fight, a perk every third level; and one you trust can lead a party of your soldiers on the map ---------- */
// P.comps[id]: {ap, role, lv, xp, gear:{slot:itemId}, sk:{k:{lv,xp}}, perks:[], perkPend, party, hurt (wounded until day)}
// party: {cid, uid, x, y, troops:[type], order:'follow'|'patrol'|'return'|'stay', base (holding name), inside, wx, wy, cool, dir, fight}
const COMP_SLOTS=['weapon','offhand','head','body','arms','legs','feet'];
const COMP_SK={oneh:'One-Handed',twoh:'Two-Handed',archery:'Archery',med:'Medicine',scout:'Scouting',lead:'Leadership'};
// what each brings when they join (they are no beginners); the rest start at 0
const COMP_START={brann:{oneh:3,lead:2},elske:{med:3,oneh:1},tavi:{archery:3,scout:3}};
const COMP_PERKS={brute:{n:'Brute',d:'+12% damage'},stalwart:{n:'Stalwart',d:'+15% health'},swift:{n:'Swift',d:'+10% speed in battle'},
  guardian:{n:'Guardian',d:'Takes 10% less damage'},captain:{n:'Captain',d:'Leads 4 more soldiers in a party'}};
const COMP_LEAD={lv:2,ap:2};// who may lead a party: level 2 and trusting you
// the holding whose tavern they wait in: their own, or (in a world without it) their people's capital
const compTown=id=>townBy(COMPS[id].town)||capitalOf(COMPS[id].race);
function compInit(id){const c=P.comps[id];if(!c)return null;if(c.lv)return c;
  Object.assign(c,{lv:1,xp:0,gear:{},sk:{},perks:[],perkPend:0,party:null,hurt:0});for(const k in COMP_SK)c.sk[k]={lv:(COMP_START[id]||{})[k]||0,xp:0};return c}
const compSkill=(id,k)=>{const c=compInit(id);return c&&c.sk[k]?c.sk[k].lv:0};
// (leaders.js: as every leader grows)
function compTrain(id,k,n){const c=compInit(id);if(c)leaderOf(c,id).train(k,n)}
function compXp(id,n){const c=compInit(id);if(c)leaderOf(c,id).gainXp(n)}
const compHas=(id,p)=>!!compInit(id)&&compInit(id).perks.includes(p);
// in your band: not away leading a party, not lying wounded
const compInBand=id=>{const c=compInit(id);return !!c&&!c.party&&!(c.hurt>G.day)};
const compsInBand=()=>Object.keys(P.comps).filter(compInBand);
// the melee discipline of the weapon they hold
const compMeleeSk=id=>meleeSkOf(compInit(id));
// their battle stats: their own, grown by level, gear, disciplines and perks
function compStats(id){return charStats(charOf(compInit(id),id))}// (characters.js: one formula for every character)
// gear: what fits a slot, and giving or taking it back
const compEquipment=id=>{const c=compInit(id);return c?new EquipmentService(c,playerInventory,{items:ITEMS,slots:COMP_SLOTS,slotType:slotOfKey,mountKeys:[],dualWield:false}):null};
const compFits=(id,slot)=>{const e=compEquipment(id);return !e||e.blockedWhy(slot)?[]:P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k==='gear'&&e.accepts(slot,x.id))};
function compEquip(id,slot,i){const e=compEquipment(id);return !!e&&equipmentFeedback(e.equip(i,slot))}
function compUnequip(id,slot){const e=compEquipment(id);return !!e&&equipmentFeedback(e.unequip(slot))}

/* leading a party */
const cparties=()=>Object.keys(P.comps).map(id=>compInit(id)&&P.comps[id].party).filter(Boolean);
const cpartyCap=id=>4+2*compInit(id).lv+compSkill(id,'lead')+(compHas(id,'captain')?4:0);
const canLead=id=>{const c=compInit(id);return c.lv>=COMP_LEAD.lv&&c.ap>=COMP_LEAD.ap};
// Plans are transient. Forming a party builds a private candidate, attached only after a successful transfer.
function cpTransferPlan(id,direction,source,n,target='new'){
  const fail=code=>({quote:{ok:false,code}});
  if(!Object.prototype.hasOwnProperty.call(P.comps,id)||!Object.prototype.hasOwnProperty.call(COMPS,id)||!['give','take'].includes(direction))return fail('companion');
  const c=compInit(id);if(direction==='give'&&!canLead(id))return fail('leadership');
  if(direction==='take'&&!c.party)return fail('party');
  const forming=!c.party,p=c.party||asParty({cid:id,x:P.x+10,y:P.y+6,troops:[],order:'follow',base:null,cool:2,dir:1});
  if(p.fight)return fail('fighting');
  if(direction==='take'&&Math.hypot(p.x-P.x,p.y-P.y)>WORLD_SCALE.ai.compTake)return fail('distance');
  const from=partyRoster(direction==='give'?P:p),to=partyRoster(direction==='give'?p:P),
    rejoin=direction==='take'&&n===from.size&&!sum(p.wounded||{})&&!(p.woundedGroups||[]).some(g=>g.count>0),
    room=direction==='give'?cpartyCap(id)-to.size-sum(p.wounded||{}):partyRoom(),reserve=rejoin?1:0,
    quote=from.quoteGroupTransfer(to,source,n,target,room,reserve);
  if(quote.ok)Object.assign(quote,{id,direction,forming,rejoin,room,fromAfter:quote.fromAfter-(forming||rejoin?1:0)});
  return {quote,c,p,from,to,room,reserve,forming,rejoin};
}
const cpTransferQuote=(...args)=>cpTransferPlan(...args).quote;
function cpTransferGroup(id,direction,source,n,target='new'){
  const plan=cpTransferPlan(id,direction,source,n,target),q=plan.quote;if(!q.ok)return q;
  const result=plan.from.transferGroupTo(plan.to,source,n,target,plan.room,plan.reserve);if(!result.ok)return result;
  if(plan.forming)plan.c.party=plan.p;
  if(plan.rejoin){plan.c.party=null;log(COMPS[id].short+' rejoins your band.')}
  return {...q,destinationId:result.destinationId};
}
// Count-based callers retain their up-to-N behavior, but delegate to one explicitly resolved source and destination.
function cpGive(id,k,n){
  if(!Object.prototype.hasOwnProperty.call(P.comps,id)||!Object.prototype.hasOwnProperty.call(COMPS,id)||!troopAmount(n))return 0;const c=compInit(id),from=partyRoster(P),g=from.groups.find(g=>g.type===k);if(!g)return 0;
  const to=c.party&&partyRoster(c.party),target=to?.groups.find(g=>g.type===k)?.id||'new',amount=Math.min(n,g.count,cpartyCap(id)-(to?.size||0)-sum(c.party?.wounded||{}));
  const result=cpTransferGroup(id,'give',g.id,amount,target);return result.ok?result.count:0;
}
function cpTake(id,k,n){
  const p=P.comps[id]?.party;if(!p||!troopAmount(n))return 0;const g=partyRoster(p).groups.find(g=>g.type===k);if(!g)return 0;
  const target=partyRoster(P).groups.find(g=>g.type===k)?.id||'new',result=cpTransferGroup(id,'take',g.id,Math.min(n,g.count,partyRoom()),target);return result.ok?result.count:0;
}
function cpDisband(id,home){const c=P.comps[id];if(!c||!c.party)return;const p=c.party,n=p.troops.length;
  const r=partyRoster(P),source=partyRoster(p),groups=source.groups.slice(),wounded=sum(p.wounded||{})||(p.woundedGroups||[]).some(g=>g.count>0);
  // Automatic return preserves boundaries too, and is checked for the entire army before any soldier moves.
  if(wounded||r.slots+groups.length+1>ARMY_LIMIT||Object.keys(source.counts).some(k=>!r.accepts(k)||!Number.isSafeInteger(r.count(k)+source.count(k)))){
    p.order='follow';if(!p.returnBlocked)log(wounded?COMPS[id].short+' must keep their wounded with their own army.':'Make room for '+groups.length+' troop groups and '+COMPS[id].short+' before they can rejoin (10 groups maximum).','bad');p.returnBlocked=true;return}
  for(const g of groups)source.transferGroupTo(r,g.id,g.count,'new',Infinity,1);
  c.party=null;if(home)log(COMPS[id].short+' rejoins your band'+(n?' with '+n+' soldiers':'')+'.')}
// where a party may shelter: as you may (stay.js), but a party pays only for its own soldiers
const cpStayOk=t=>!yourShelterWhy(t);// (a companion's party shelters by your rules: parties.js)
const cpStayCost=p=>STAY_BASE+Math.ceil(p.troops.length/2);
function cpOrder(id,o){const p=compInit(id).party;if(!p)return;if(p.inside)p.leave();p.order=o;p.wx=null;
  if(o==='stay'){const h=Spatial.nearestHolding(p.x,p.y,cpStayOk);if(!h){p.order='follow';log(COMPS[id].short+' finds no holding that will take them in.','bad');return}p.base=h.name;log(COMPS[id].short+' will shelter in '+h.name+(stayFree(h)?'':' ('+cpStayCost(p)+'g a day from your purse)')+' and hire there.');return}
  if(o==='patrol'){const h=Spatial.nearestHolding(P.x,P.y,t=>!hostileTo(t.owner))||Spatial.nearestHolding(P.x,P.y);p.base=h.name;log(COMPS[id].short+' will patrol the land of '+h.name+'.')}
  else if(o==='follow')log(COMPS[id].short+' will ride with you.');else log(COMPS[id].short+' is coming back to your band.')}
// each moment on the map: keep clear of what it cannot beat, run down bandits and weak enemies near it, otherwise follow
// you, patrol its holding's land, or come back to you
// each moment on the map: CompanionBrain (brains.js)
// once a day: a party patrolling a friendly holding hires its volunteers with your gold (up to its cap), and its leader learns to lead
function compDay(){
  for(const id in P.comps){const c=compInit(id);
    if(c.party&&c.party.inside){const p=c.party,h=townBy(p.base);if(h&&!stayFree(h)){const k=cpStayCost(p);if(P.gold>=k)P.gold-=k;else{p.leave();p.order='follow';log('You cannot pay for '+COMPS[id].short+'’s lodgings. The party leaves '+h.name+' to rejoin you.','bad')}}}
    if(c.party){compTrain(id,'lead',2);const p=c.party,t=(p.order==='patrol'||p.inside)&&townBy(p.base);
      if(t&&!hostileTo(t.owner)&&Math.hypot(t.x-p.x,t.y-p.y)<WORLD_SCALE.ai.compDraft)for(let k=0;k<2&&p.troops.length<cpartyCap(id)&&canDraft(t);k++){const r=RACES[t.races[rint(0,t.races.length-1)]],type=Math.random()<.6?r.melee:r.ranged,cost=HIRE[type]||22;
        if(P.gold<cost||!partyRoster(p).canAdd(type))break;P.gold-=cost;draftLocals(t,1);p.add(type);log(COMPS[id].short+' hires '+an(ST[type].n.toLowerCase())+' in '+t.name+' ('+cost+'g).')}}
    if(c.role==='scout'&&compInBand(id))compTrain(id,'scout',3);if(c.role==='surgeon'&&compInBand(id))compTrain(id,'med',2)}
}
// on the map: drawn with every party (render.js drawParties; its look: parties.js)
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'companions',order:{day:150},day:compDay});
