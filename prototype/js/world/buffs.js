'use strict';
/* ---------- your units' upgrades (data/buffs.js BUFFS; the owner, 2026-10-31: the tech tree "tied to holdings, you have to visit the
   workshop/smith or relevant buildings for upgrades"; "tied to unit group not individual unit (except group of 1)"): each of your
   troop groups keeps its own (g.buffs: [{id, from: where it was bought}]), a group of one, your hero or a companion, his own
   (P.unitBuffs, by 'hero' or 'comp_id'). A building of a holding offers those whose at is its place and whose need it meets (offer);
   bought there for the whole group, at its price a man (buy); new men refilling a group pay for its upgrades too (perMan: the
   hiring desk); upgraded into another kind, a group keeps them, one that no longer fits its kind kept but idle (fits); two merged
   keep only what both had (core/army.js). In battle each of your soldiers takes his group's (buffUnit, once) ---------- */
const Buffs={
  // (a group's upgrades, by its id: a troop group's, its wounded's while all are down; a group of one's. Only make (a purchase)
  // keeps a list on it: a look leaves none behind, so a group or your hero with none saves and fights as before)
  rec(id,make){if(id==='hero'||String(id).startsWith('comp_')){const U=make?P.unitBuffs||(P.unitBuffs={}):P.unitBuffs||{};return U[id]||(make?U[id]=[]:[])}
    const g=partyRoster(P).groups.find(x=>x.id===id)||(P.woundedGroups||[]).find(w=>w.id===id);return g?g.buffs||(make?g.buffs=[]:[]):null},
  list(id){return (this.rec(id)||[]).filter(x=>BUFFS[x.id])},
  has(id,b){return this.list(id).some(x=>x.id===b)},
  // (the kind of a group: its troops', your hero's, a companion's; and its numbers, a character's his own)
  kindOf(id){return id==='hero'?charOf(P).key:String(id).startsWith('comp_')?charOf(compInit(id.slice(5)),id.slice(5)).key:(partyRoster(P).groups.find(x=>x.id===id)||(P.woundedGroups||[]).find(w=>w.id===id))?.type},
  statsOf(id){return id==='hero'?charOf(P).stats():String(id).startsWith('comp_')?charOf(compInit(id.slice(5)),id.slice(5)).stats():ST[this.kindOf(id)]},
  // (its men: a troop group's fit and wounded; a group of one, one)
  men(id){if(id==='hero'||String(id).startsWith('comp_'))return 1;const r=partyRoster(P),g=r.groups.find(x=>x.id===id);return (g?g.count:0)+r.wounded(id)},
  // (does buff b improve kind k (s: its numbers, a character's his own))
  fits(b,k,s=ST[k]){const w=b.who||{};if(!s)return false;
    return (!w.race||w.race===s.race)&&(!w.unit||w.unit===(s.mounted?'mounted':s.range>0?'ranged':'foot'))&&(!w.cls||w.cls===unitClass(s))&&(!w.tier||s.tier>=w.tier[0]&&s.tier<=w.tier[1])&&(!w.kinds||w.kinds.includes(k))},
  // what a building (place: smith, stable, ...) of holding t offers: by its at, and its need (tier: the holding's)
  offer(t,place){return Object.keys(BUFFS).filter(id=>{const b=BUFFS[id];return b.at===place&&(!b.need||(t.T.tier||0)>=(b.need.tier||0))})},
  price(id,b){return Math.round((BUFFS[b]?.cost||0)*this.men(id))},
  // (a new man's share: what a group's upgrades cost a man)
  perMan(id){return this.list(id).reduce((n,x)=>n+(BUFFS[x.id].cost||0),0)},
  // why a group cannot have b here now ('' when it can)
  why(t,place,id,b){const B=BUFFS[b];return !B||!this.offer(t,place).includes(b)?'Not offered here':this.has(id,b)?'They have it':!this.fits(B,this.kindOf(id),this.statsOf(id))?'Not for their kind':P.gold<this.price(id,b)?'Not enough gold':''},
  buy(t,place,id,b){if(this.why(t,place,id,b))return false;P.gold-=this.price(id,b);this.rec(id,true).push({id:b,from:t.name});return true},
  // a soldier's numbers with his group's upgrades that fit his kind (list: [{id}])
  apply(s,list,k){const m={};for(const x of list){const b=BUFFS[x.id];if(!b||!this.fits(b,k,s))continue;for(const [y,v] of Object.entries(b.mods||{}))m[y]=(m[y]||0)+v}if(!Object.keys(m).length)return s;
    const pct=(y,v)=>v==null?v:v*(1+(m[y]||0));
    return {...s,hp:Math.round(pct('hpPct',s.hp)),dmg:pct('dmgPct',s.dmg),spd:pct('spdPct',s.spd),reach:pct('reachPct',s.reach),range:s.range?pct('rangePct',s.range):s.range,cd:pct('cdPct',s.cd),
      ...(m.armor?{av:Math.max(0,Math.min(100,armorValue(s)+m.armor))}:{}),...(m.morale?{morale:unitMoraleOf(s)+m.morale}:{})}},
  // the skills its upgrades teach a kind k (list: [{id}]; data/buffs.js skill: battle/unitkit.js UnitKit's slots), each once, in the order bought
  skills(list,k,s=ST[k]){return [...new Set((list||[]).map(x=>BUFFS[x.id]).filter(b=>b?.skill&&this.fits(b,k,s)).map(b=>b.skill))]},
  // (a buff's changes in words)
  text(b){const M=b.mods||{},L={hpPct:'health',dmgPct:'damage',spdPct:'speed',reachPct:'reach',rangePct:'range',cdPct:'swing and shot time'},p=v=>(v>0?'+':'')+Math.round(v*100)+'%';
    return [...Object.keys(L).filter(x=>M[x]).map(x=>p(M[x])+' '+L[x]),M.armor&&(M.armor>0?'+':'')+M.armor+' armour',M.morale&&(M.morale>0?'+':'')+M.morale+' morale',b.skill&&UNIT_SKILLS[b.skill]&&'the skill '+UNIT_SKILLS[b.skill].n].filter(Boolean).join(', ')}};
// each of your soldiers in battle, once (battle.js battleStep, after his rank's): his group's upgrades; your hero's and a companion's their own
const BUFFED=new WeakSet();
function buffUnit(u){if(BUFFED.has(u))return;BUFFED.add(u);if(u.team!==0)return;const g=B.groups[u.grp];if(!g?.player&&!u.hero)return;
  const id=u.hero?'hero':u.comp&&u.leader?.comp?'comp_'+u.leader.comp:null,list=id?Buffs.list(id):battleRec(g)?.buffs||[];if(!list.length)return;
  const s=Buffs.apply(u.s,list,u.type);if(s===u.s)return;if(s.hp!==u.s.hp){const full=u.hp>=u.max;u.max=s.hp;if(full)u.hp=s.hp}u.s=s}
