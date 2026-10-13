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
const compMeleeSk=id=>{const w=compInit(id).gear.weapon,I=w&&ITEMS[w];return I&&!I.kind&&I.hand==='two'?'twoh':'oneh'};
// their battle stats: their own, grown by level, gear, disciplines and perks
function compStats(id){
  const c=compInit(id),b=ST[id],s={...b},w=c.gear.weapon&&ITEMS[c.gear.weapon];
  const g=k=>COMP_SLOTS.reduce((a,sl)=>{const it=c.gear[sl]&&ITEMS[c.gear[sl]];return a+(it&&it.m&&it.m[k]||0)},0);
  s.hp=Math.round((b.hp*(1+.1*(c.lv-1))+g('hp'))*(compHas(id,'stalwart')?1.15:1));
  let dmg=b.dmg*(1+.07*(c.lv-1))+g('dmg');
  if(w){if(w.kind){s.range=Math.max(b.range||0,110);s.reach=0}else{s.range=0;s.reach=Math.max(b.reach||13,13)+(w.m.reach||0)}}
  if(s.range)dmg*=1+.04*compSkill(id,'archery');else dmg+=.6*compSkill(id,compMeleeSk(id));
  s.dmg=+(dmg*(compHas(id,'brute')?1.12:1)).toFixed(1);s.spd=Math.round(b.spd*(1+g('spd')+(compHas(id,'swift')?.1:0)));
  s.block=Math.min(.6,g('block')+(compHas(id,'guardian')?.1:0));
  return s;
}
// gear: what fits a slot, and giving or taking it back
const compFits=(id,slot)=>P.inv.map((x,i)=>[x,i]).filter(([x])=>x&&x.k==='gear'&&ITEMS[x.id]&&ITEMS[x.id].slot===slot);
function compEquip(id,slot,i){const c=compInit(id),x=P.inv[i];if(!c||!x||x.k!=='gear'||ITEMS[x.id].slot!==slot)return false;
  const old=c.gear[slot];P.inv[i]=old?{k:'gear',id:old,n:1}:null;c.gear[slot]=x.id;
  if(slot==='weapon'&&ITEMS[x.id].hand==='two'&&c.gear.offhand){if(!invAdd('gear',c.gear.offhand,1))return true;delete c.gear.offhand}
  return true}
function compUnequip(id,slot){const c=compInit(id);if(!c||!c.gear[slot])return false;if(!invAdd('gear',c.gear[slot],1)){log('Your bag is full.','bad');return false}delete c.gear[slot];return true}

/* leading a party */
const cparties=()=>Object.keys(P.comps).map(id=>compInit(id)&&P.comps[id].party).filter(Boolean).map(asParty);
const cpartyCap=id=>4+2*compInit(id).lv+compSkill(id,'lead')+(compHas(id,'captain')?4:0);
const canLead=id=>{const c=compInit(id);return c.lv>=COMP_LEAD.lv&&c.ap>=COMP_LEAD.ap};
const cpPower=p=>power(p.troops)*(1+.04*compSkill(p.cid,'lead'));
// hand soldiers over (the party forms beside you) or take them back (only beside you)
function cpGive(id,k,n){const c=compInit(id);if(!canLead(id))return 0;n=Math.min(n,P.troops[k]||0,cpartyCap(id)-(c.party?c.party.troops.length:0));if(n<=0)return 0;
  if(!c.party)c.party=asParty({cid:id,x:P.x+10,y:P.y+6,troops:[],order:'follow',base:null,cool:2,dir:1});
  P.remove(k,n);partyAdd(c.party,k,n);return n}
function cpTake(id,k,n){const p=compInit(id).party;if(!p||Math.hypot(p.x-P.x,p.y-P.y)>60)return 0;let got=0;
  while(got<n&&partySize()<partyCap()){if(!partyRemove(p,k,1))break;P.add(k);got++}
  if(!p.troops.length)cpDisband(id,true);return got}
function cpDisband(id,home){const c=P.comps[id];if(!c||!c.party)return;const p=c.party;for(const k of p.troops)P.add(k);c.party=null;if(home)log(COMPS[id].short+' rejoins your band'+(p.troops.length?' with '+p.troops.length+' soldiers':'')+'.')}
// where a party may shelter: as you may (stay.js), but a party pays only for its own soldiers
const cpStayOk=t=>!yourShelterWhy(t);// (a companion's party shelters by your rules: parties.js)
const cpStayCost=p=>STAY_BASE+Math.ceil(p.troops.length/2);
function cpOrder(id,o){const p=compInit(id).party;if(!p)return;if(p.inside)p.leave();p.order=o;p.wx=null;
  if(o==='stay'){const h=nearestOf(p,TOWNS.filter(cpStayOk));if(!h){p.order='follow';log(COMPS[id].short+' finds no holding that will take them in.','bad');return}p.base=h.name;log(COMPS[id].short+' will shelter in '+h.name+(stayFree(h)?'':' ('+cpStayCost(p)+'g a day from your purse)')+' and hire there.');return}
  if(o==='patrol'){const h=nearestOf(P,TOWNS.filter(t=>!hostileTo(t.owner)))||nearestOf(P,TOWNS);p.base=h.name;log(COMPS[id].short+' will patrol the land of '+h.name+'.')}
  else if(o==='follow')log(COMPS[id].short+' will ride with you.');else log(COMPS[id].short+' is coming back to your band.')}
// each moment on the map: keep clear of what it cannot beat, run down bandits and weak enemies near it, otherwise follow
// you, patrol its holding's land, or come back to you
// each moment on the map: CompanionBrain (brains.js)
// once a day: a party patrolling a friendly holding hires its volunteers with your gold (up to its cap), and its leader learns to lead
function compDay(){
  for(const id in P.comps){const c=compInit(id);
    if(c.party&&c.party.inside){const p=c.party,h=townBy(p.base);if(h&&!stayFree(h)){const k=cpStayCost(p);if(P.gold>=k)P.gold-=k;else{p.leave();p.order='follow';log('You cannot pay for '+COMPS[id].short+'’s lodgings. The party leaves '+h.name+' to rejoin you.','bad')}}}
    if(c.party){compTrain(id,'lead',2);const p=c.party,t=(p.order==='patrol'||p.inside)&&townBy(p.base);
      if(t&&!hostileTo(t.owner)&&Math.hypot(t.x-p.x,t.y-p.y)<120)for(let k=0;k<2&&p.troops.length<cpartyCap(id)&&canDraft(t);k++){const r=RACES[t.races[rint(0,t.races.length-1)]],type=Math.random()<.6?r.melee:r.ranged,cost=HIRE[type]||22;
        if(P.gold<cost)break;P.gold-=cost;draftLocals(t,1);partyAdd(p,type);log(COMPS[id].short+' hires '+an(ST[type].n.toLowerCase())+' in '+t.name+' ('+cost+'g).')}}
    if(c.role==='scout'&&compInBand(id))compTrain(id,'scout',3);if(c.role==='surgeon'&&compInBand(id))compTrain(id,'med',2)}
}
// on the map: drawn with every party (render.js drawParties; its look: parties.js)
