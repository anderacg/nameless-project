'use strict';
/* ---------- item kinds: what each thing in a bag is (doc/STORY_DESIGN.md §7, wave C) ----------
   A bag (P.inv, a loot pile) holds plain saved records {k, id, n} (a letter's with its own record L), saved exactly as they
   always were. What a record is comes from its kind, one object per kind, read with the record:
     Gear (k 'gear': ITEMS, data/monsters.js, and the generated g_* pieces of data/gear.js);
     Mount (a Gear whose slot is 'mount': the m_* of data/gear.js, sold at stables);
     Good (k 'good': GOODS, data/places.js: food, ammunition, wares);
     Trophy (k 'mat': MATS, data/monsters.js: what beasts leave);
     Letter (k 'letter': a robbed messenger's, world/letters.js).
   Each knows its data entry (def), name and description, its stack size, its worth (its data's value), its price (what a
   market pays for one) and cost (what one costs to buy), its slot and stats (gear), how it is spoken of (title: the bag's
   label; some: left behind; sold: sold), its place in a sorted bag (place, compare) and on a loot pile (lootRank, lootLine),
   and its verbs: Choices (story/choice.js) read with its bag slot's index. itemKind(rec) gives the kind of a record. The data
   tables stay the data: the kinds read them. ---------- */
const HANDS={one:'one-handed',two:'two-handed',hybrid:'hybrid'};
// (a piece's data: its rank (its tier, else by its rarity), and what it is in words: a one-handed weapon, a cape)
const itemRank=I=>I.tier!=null?I.tier:{common:2,rare:4,epic:6}[I.r];
const kindLabel=I=>I.slot==='weapon'?HANDS[I.hand||'one']+' weapon':SLOTS[I.slot].toLowerCase();
// the verbs every kind shares (specs: each kind makes its own Choices of them): left behind, and sold at a market for what it
// fetches
const DROP_VERB={id:'drop',icon:'close',label:'Drop',tip:'Leave it behind.',
  run:i=>{
    const s=P.inv[i];
    P.inv[i]=null;
    if(s)log('You leave '+itemKind(s).some(s)+' behind.');
  }};
const SELL_VERB={id:'sell',icon:'gold',label:'Sell',tip:'Sell it at the market.',
  run:i=>{
    const x=P.inv[i],K=itemKind(x),g=K.fetches(x);
    P.gold+=g;
    P.inv[i]=null;
    train('trade',g/20);
    log('You sell '+K.sold(x)+' for '+g+' gold.','gold');
  }};
class ItemKind{
  // k: the records' kind; place: its place among the kinds in a sorted bag
  constructor(k,place){
    this.k=k;
    this.place=place;
    this.verbList=null;
  }
  // what it is: its data entry (n, icon, col, d)
  def(s){return null}
  name(s){return this.def(s).n}
  describe(s){return this.def(s).d}
  // how many fit in one bag slot
  stack(id){return 1}
  // about what one is worth; what a market pays for one, and what the whole slot fetches; what one costs (t: the holding)
  worth(s){return 0}
  price(s,t){return 0}
  fetches(s,t){return this.price(s,t)*s.n}
  cost(s,t){return null}
  // where it is worn and what it gives (gear only); its colour in the bag (gear: its rarity's)
  slot(s){return null}
  stats(s){return {}}
  colour(s){return ''}
  // its words: the bag's label, one left behind, one sold
  title(s){return this.name(s)+', '+s.n}
  some(s){
    return s.n>1?s.n+' '+this.name(s).toLowerCase()+'s':'the '+this.name(s);
  }
  sold(s){return 'the '+this.name(s)}
  // a sorted bag: two of this kind
  compare(a,b){return 0}
  // a loot pile: best first, and its line
  lootRank(s){return 0}
  lootLine(s){return ''}
  // what you can do with it: Choices, read with its bag slot's index (made when first asked for: story/choice.js loads later)
  verbSpecs(){return [DROP_VERB]}
  get verbs(){
    if(!this.verbList)this.verbList=Choice.list(this.verbSpecs());
    return this.verbList;
  }
  verb(id){return this.verbs.find(c=>c.id===id)||null}
}
/* gear: worn by you or a companion, in its slot (SLOTS; rings on any finger), its stats (m) counted while worn */
class Gear extends ItemKind{
  constructor(){
    super('gear',0);
    this.slotOrder=Object.fromEntries(Object.keys(SLOTS).map((k,i)=>[k,i]));
  }
  def(s){return ITEMS[s.id]}
  worth(s){return ITEMS[s.id].v}
  // a market pays a little more, and a smith asks a little less, the better your Trading
  price(s){return Math.round(ITEMS[s.id].v*(.6+.01*skill('trade')))}
  fetches(s){return this.price(s)}
  cost(s){return Math.round(ITEMS[s.id].v*(1.2-.01*skill('trade')))}
  slot(s){return ITEMS[s.id].slot}
  stats(s){return ITEMS[s.id].m}
  colour(s){return RARITY[ITEMS[s.id].r]}
  rank(s){return itemRank(ITEMS[s.id])}
  label(s){return kindLabel(ITEMS[s.id])}
  title(s){return ITEMS[s.id].n+', '+ITEMS[s.id].r+' '+this.label(s)}
  // the key it goes to on you: its slot; a ring on your first bare finger (else the first)
  keyOn(id){
    const sl=ITEMS[id].slot;
    if(sl!=='ring')return sl;
    const f=EQUIP.filter(k=>k.startsWith('ring'));
    return f.find(k=>!P.gear[k])||f[0];
  }
  // (by id, as worn gear is kept) a weapon's damage type and a body armour's class (data/matchups.js ITEM_DT, ITEM_ARMOR)
  damageType(id){
    const I=id&&ITEMS[id];
    if(!I)return null;
    return I.dt||ITEM_DT[I.base]||(I.icon==='club'?'blunt':I.icon==='spear'||I.icon==='dagger'?'pierce':'slash');
  }
  armourClass(id){
    const I=id&&ITEMS[id];
    if(!I)return null;
    return I.armor||ITEM_ARMOR[id]||(I.base==='mail'?I.tier<2?'leather':I.tier<4?'mail':'plate':'leather');
  }
  // a sorted bag: by slot, the best first, then by name
  compare(a,b){
    const A=ITEMS[a.id],B=ITEMS[b.id];
    return this.slotOrder[A.slot]-this.slotOrder[B.slot]||itemRank(B)-itemRank(A)||A.n.localeCompare(B.n);
  }
  lootRank(s){return 100+this.rank(s)}
  lootLine(s){return cap1(ITEMS[s.id].r)+' '+this.label(s)}
  // worn where it goes (its need: why that slot will not take it now), or in the off hand (a one-handed weapon); sold; left
  verbSpecs(){
    return [
      {id:'equip',icon:'helm',label:'Equip',tip:'Wear it.',need:i=>blockedWhy(targetKey(P.inv[i].id)),run:i=>invEquip(i)},
      {id:'off',icon:'shield',label:'Off hand',tip:'Hold it in your off hand.',
        when:i=>ITEMS[P.inv[i].id].slot==='weapon'&&accepts('offhand',P.inv[i].id),need:()=>blockedWhy('offhand'),run:i=>equipInto(i,'offhand')},
      SELL_VERB,DROP_VERB];
  }
}
/* a mount: gear for its own slot, bought at a stable (commons from anyone, a rare beast with standing there) */
class Mount extends Gear{
  // the mounts a holding's stable keeps: none that only beasts drop; the rest by its kind, its peoples and its land
  stockAt(t){
    const clim=climAt(t.x,t.y);
    return Object.keys(MOUNTS).filter(k=>{
      const M=MOUNTS[k];
      if(M.drop)return false;
      return t.sellsMount(M,clim);
    }).map(k=>'m_'+k);
  }
  canBuyAt(s,t){return ITEMS[s.id].r==='common'||standingAt(t)>=REP_NEED[2]}
  // the ground it crosses at full speed
  ground(s){return ITEMS[s.id].ign}
}
/* trade goods: food, ammunition and wares, stacked (GOODS stack), priced by each market's stock (world/economy.js) */
class Good extends ItemKind{
  constructor(){
    super('good',1);
    this.ids=Object.keys(GOODS);
  }
  def(s){return GOODS[s.id]}
  stack(id){return GOODS[id].stack}
  worth(s){return GOODS[s.id].base}
  price(s,t){return nextSell(t,s.id)}
  cost(s,t){return nextBuy(t,s.id)}
  some(s){return s.n+' '+this.name(s).toLowerCase()}
  // a sorted bag: in the order of GOODS, the bigger stack first
  compare(a,b){return this.ids.indexOf(a.id)-this.ids.indexOf(b.id)||b.n-a.n}
  lootRank(s){return GOODS[s.id].base/10}
  lootLine(s){return 'Goods · '+GOODS[s.id].stack+' a slot'}
}
/* trophies: what beasts leave, sold at any market (STACK to a slot) */
class Trophy extends ItemKind{
  constructor(){super('mat',2)}
  def(s){return MATS[s.id]}
  stack(id){return STACK}
  worth(s){return MATS[s.id].v}
  price(s){return Math.round(MATS[s.id].v*(.75+.01*skill('trade')))}
  title(s){return this.name(s)+', '+s.n+' trophies'}
  sold(s){return s.n+' '+this.name(s).toLowerCase()+(s.n>1?'s':'')}
  // a sorted bag: the dearest first, the bigger stack first
  compare(a,b){return MATS[b.id].v-MATS[a.id].v||b.n-a.n}
  lootRank(s){return 50+MATS[s.id].v/10}
  lootLine(s){return 'Trophy · '+MATS[s.id].v+'g'}
  verbSpecs(){return [SELL_VERB,DROP_VERB]}
}
/* a sealed letter: one to a slot, its record with it (world/letters.js); sold or delivered on its own page (pageVerbs) */
class Letter extends ItemKind{
  constructor(){super('letter',3)}
  def(s){return letterDef(s)}
  worth(s){
    const L=letterOf(s);
    return L?L.worth:0;
  }
  title(s){return this.name(s)+', to '+s.L.to}
  compare(a,b){return String(a.id).localeCompare(b.id)}
  // its page's verbs (read with its record L): Break the seal, Sell it to a rival, Deliver it, Burn it
  get pageVerbs(){return LETTER_VERBS}
}
const ITEM_KINDS={gear:new Gear(),mount:new Mount(),good:new Good(),mat:new Trophy(),letter:new Letter()};
// the kind of a bag record {k, id}: a mount is the gear for the mount slot; any other kind reads as a trophy, as it always did
function itemKind(s){
  if(s.k==='gear')return ITEMS[s.id]&&ITEMS[s.id].slot==='mount'?ITEM_KINDS.mount:ITEM_KINDS.gear;
  return ITEM_KINDS[s.k]||ITEM_KINDS.mat;
}
// (the old names)
const itemDef=s=>itemKind(s).def(s);
const stackOf=(k,id)=>itemKind({k,id}).stack(id);
const itemDt=id=>ITEM_KINDS.gear.damageType(id);
const itemArmor=id=>ITEM_KINDS.gear.armourClass(id);
const targetKey=id=>ITEM_KINDS.gear.keyOn(id);
