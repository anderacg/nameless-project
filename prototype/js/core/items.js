'use strict';
/* ---------- item kinds: what each thing in a bag is (doc/STORY_DESIGN.md §7, wave C), and its category (doc/ITEMS_DESIGN.md) ----------
   A bag (P.inv, a loot pile) holds plain saved records {k, id, n} (a letter's with its own record L; a quest item's with by, the
   quest or thread it is bound to), saved exactly as they always were. What a record is comes from its kind, one object per kind,
   read with the record:
     Gear (k 'gear': ITEMS, data/monsters.js, and the generated g_* pieces of data/gear.js);
     Mount (a Gear whose slot is 'mount': the m_* of data/gear.js, sold at stables);
     Quiver (a Gear whose slot is 'quiver': the q_* of data/gear.js, sold at markets and smiths: your shots in a battle);
     Good (k 'good': GOODS, data/places.js: food, drink and wares; a holding's old arrows and bolts are no item);
     Trophy (k 'mat': MATS, data/monsters.js: what beasts leave);
     Valuable (k 'val': VALUABLES, data/items.js: jewels, rings, relics);
     QuestItem (k 'quest': QUEST_ITEMS, data/items.js: bound to the quest or thread that gave it);
     Letter (k 'letter': a robbed messenger's, world/letters.js).
   Each knows its data entry (def), name and description, its category (cat: one of ITEM_CATS, data/items.js, by catId: its data's
   cat, else its kind's; none: not an item, never carried), its stack size, its worth (its data's value), its price (what a market
   pays for one) and cost (what one costs to buy), its slot and stats (gear), how it is spoken of (title: the bag's label; some:
   left behind; sold: sold), how it sorts against another of its kind (compare) and stands on a loot pile (lootRank, lootLine),
   what coming into your stores does (gained: a drink's morale), and its verbs: Choices (story/choice.js) read with its bag slot's
   index, Sell and Drop shown only as its category allows. itemKind(rec) gives the kind of a record. The data tables stay the
   data: the kinds read them. ---------- */
const HANDS={one:'one-handed',two:'two-handed',hybrid:'hybrid'};
// (a piece's data: its rank (its tier, else by its rarity), and what it is in words: a one-handed weapon, a cape)
const itemRank=I=>I.tier!=null?I.tier:{common:2,rare:4,epic:6}[I.r];
const kindLabel=I=>I.slot==='weapon'?HANDS[I.hand||'one']+' weapon':SLOTS[I.slot].toLowerCase();
// a record's category (null: not an item, as a holding's old arrows)
const itemCat=s=>itemKind(s).cat(s);
// the verbs every kind shares (specs: each kind makes its own Choices of them), each shown only as the item's category allows (a
// quest item is bound: neither): left behind, and sold at a market for what it fetches (there: a city pays more for a valuable)
const catAllows=(i,rule)=>{const c=P.inv[i]&&itemCat(P.inv[i]);return !c||!!c[rule]};
const DROP_VERB={id:'drop',icon:'close',label:'Drop',tip:'Leave it behind.',when:i=>catAllows(i,'drop'),
  run:i=>{
    const s=P.inv[i];
    if(!catAllows(i,'drop'))return;
    P.inv[i]=null;
    if(s)log('You leave '+itemKind(s).some(s)+' behind.');
  }};
const SELL_VERB={id:'sell',icon:'gold',label:'Sell',tip:'Sell it at the market.',when:i=>catAllows(i,'sell'),
  run:i=>{
    const x=P.inv[i],K=itemKind(x),g=K.fetches(x,G.town&&G.town.ref);
    if(!catAllows(i,'sell'))return;
    P.gold+=g;
    P.inv[i]=null;
    train('trade',g/20);
    log('You sell '+K.sold(x)+' for '+g+' gold.','gold');
  }};
class ItemKind{
  // k: the records' kind
  constructor(k){
    this.k=k;
    this.verbList=null;
  }
  // what it is: its data entry (n, icon, col, d)
  def(s){return null}
  name(s){return this.def(s).n}
  describe(s){return this.def(s).d}
  // its category: its id (ITEM_CATS) and the entry (null: not an item)
  catId(s){return 'trade'}
  cat(s){return ITEM_CATS[this.catId(s)]||null}
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
  // n of it come into your stores (the bag): what that does (a drink: its morale, world/supply.js)
  gained(s,n){}
  // what you can do with it: Choices, read with its bag slot's index (made when first asked for: story/choice.js loads later)
  verbSpecs(){return [DROP_VERB]}
  get verbs(){
    if(!this.verbList)this.verbList=Choice.list(this.verbSpecs());
    return this.verbList;
  }
  verb(id){return this.verbs.find(c=>c.id===id)||null}
}
/* gear: worn by you or a companion, in its slot (SLOTS; rings on any finger), its stats (m) counted while worn. A weapon (or a
   torch or tome in the off hand) is of the category Weapon; a mount's gear Mount; the rest Armour */
class Gear extends ItemKind{
  constructor(){
    super('gear');
    this.slotOrder=Object.fromEntries(Object.keys(SLOTS).map((k,i)=>[k,i]));
  }
  def(s){return ITEMS[s.id]}
  catId(s){
    const I=ITEMS[s.id];
    if(!I)return null;
    if(I.slot==='weapon'||I.slot==='offhand'&&I.icon!=='shield')return 'weapon';
    return MOUNT_KEYS.includes(I.slot)?'mount':'armour'}
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
  catId(s){return 'mount'}
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
/* a quiver (doc/ITEMS_DESIGN.md §2b): gear for its own slot (QUIVERS, data/gear.js), its arrows in its name. Its shots are its
   wearer's in every battle, full at each start: your hero's (battle/combat.js) and the characters' (their stats' shots). Sold at
   markets and smiths, as its data says */
class Quiver extends Gear{
  q(id){return QUIVERS[ITEMS[id].quiver]}
  catId(s){return 'quiver'}
  label(s){return this.q(s.id).fits==='crossbow'?'bolt case':'quiver'}
  title(s){return ITEMS[s.id].n+' · '+arrowsText(this.q(s.id))}
  lootLine(s){return cap1(arrowsText(this.q(s.id)))+' · for a '+this.q(s.id).fits}
  // what a fighter shoots: by its weapon (w: an item id) if it has one (a bow, a crossbow, or none: a blade, a staff), else by its
  // kind's stats s (a bow; a flat shot: a crossbow; casters and beasts none)
  shootsWith(w,s){
    const I=w&&ITEMS[w];
    if(I)return I.kind==='ranged'?I.shot&&I.shot.flat?'crossbow':'bow':null;
    return s&&s.range&&!s.magic&&!s.beast?s.flat?'crossbow':'bow':null}
  // the shots a fighter wearing gear carries into a battle: its quiver's if it fits what it shoots, else QUIVER.none; null when it
  // shoots nothing (no quiver needed)
  shots(gear,shoots){
    if(!shoots)return null;
    const Q=gear&&gear.quiver&&ITEMS[gear.quiver]&&QUIVERS[ITEMS[gear.quiver].quiver];
    return Q&&Q.fits===shoots?Q.shots:QUIVER.none}
  // the quivers a holding sells at a place of it (trade: its market square; smith): market ones at any market, smith ones at any
  // smith, city ones at a city's smith, a people's at their holdings (at the smith, else the market)
  stockAt(t,place){
    return Object.keys(QUIVERS).filter(k=>{
      const w=QUIVERS[k].sold;
      if(w==='market')return place==='trade';
      if(w==='smith')return place==='smith';
      if(w==='city')return place==='smith'&&t.kind==='city';
      return t.races.includes(w)&&place===(t.has('smith')?'smith':'trade');
    }).map(k=>'q_'+k);
  }
}
/* trade goods: food, drink and wares, stacked (GOODS stack), priced by each market's stock (world/economy.js). Of the category its
   data names, else Food, Water (a drink), Resource (a regional good) or Trade good; a holding's old arrows and bolts none */
class Good extends ItemKind{
  constructor(){
    super('good');
    this.ids=Object.keys(GOODS).filter(g=>!GOODS[g].ammo);
  }
  def(s){return GOODS[s.id]}
  catId(s){
    const D=GOODS[s.id];
    if(!D||D.ammo)return null;
    return D.cat||(D.food?'food':D.drink?'water':D.res?'resource':'trade')}
  stack(id){return GOODS[id].stack}
  worth(s){return GOODS[s.id].base}
  price(s,t){return nextSell(t,s.id)}
  cost(s,t){return nextBuy(t,s.id)}
  some(s){return s.n+' '+this.name(s).toLowerCase()}
  // a sorted bag: in the order of GOODS, the bigger stack first
  compare(a,b){return this.ids.indexOf(a.id)-this.ids.indexOf(b.id)||b.n-a.n}
  lootRank(s){return GOODS[s.id].base/10}
  lootLine(s){return ITEM_CATS[this.catId(s)].n+' · '+GOODS[s.id].stack+' a slot'}
  // a drink into your stores: its morale, once (world/supply.js drinkIn)
  gained(s,n){if(this.catId(s)==='water')drinkIn(s.id,n)}
}
/* trophies: what beasts leave, sold at any market (STACK to a slot) */
class Trophy extends ItemKind{
  constructor(){super('mat')}
  def(s){return MATS[s.id]}
  catId(s){return 'trophy'}
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
/* valuables (doc/ITEMS_DESIGN.md §4b): jewels, rings, a chalice, a relic (VALUABLES), worth a lot for one slot (VALUE.stack to a
   slot); a market pays for them by your Trading, a city best (VALUE). Found in lairs, ruins and camps and on the lords and
   chieftains you beat (world/sites.js valuablesFound) */
class Valuable extends ItemKind{
  constructor(){super('val')}
  def(s){return VALUABLES[s.id]}
  catId(s){return 'valuable'}
  stack(id){return VALUE.stack}
  worth(s){return VALUABLES[s.id].v}
  price(s,t){return Math.round(VALUABLES[s.id].v*(VALUE.sell+VALUE.trade*skill('trade'))*(t&&VALUE.kind[t.kind]||1))}
  colour(s){return RARITY[VALUABLES[s.id].r]}
  title(s){return this.name(s)+(s.n>1?', '+s.n:'')+', '+VALUABLES[s.id].r+' valuable'}
  some(s){return s.n>1?s.n+' × '+this.name(s).toLowerCase():'the '+this.name(s).toLowerCase()}
  sold(s){return this.some(s)}
  // a sorted bag: the dearest first, the bigger stack first
  compare(a,b){return VALUABLES[b.id].v-VALUABLES[a.id].v||b.n-a.n}
  lootRank(s){return 80+VALUABLES[s.id].v/10}
  lootLine(s){return 'Valuable · '+VALUABLES[s.id].v+'g'}
  verbSpecs(){return [SELL_VERB,DROP_VERB]}
}
/* quest items (doc/ITEMS_DESIGN.md §4): bound to the quest or thread that gave them (by: its key, 'quest:3', 'thread:1'; none:
   bound to nothing), so neither sold nor dropped; each takes a bag slot, never refused (past the bag's limit too: core/inventory.js),
   and is gone when its quest or thread ends (the bus's 'quest:ended', 'thread:ended'). Given and taken by the story's outcomes
   (story/outcome.js item) */
class QuestItem extends ItemKind{
  constructor(){super('quest')}
  def(s){return QUEST_ITEMS[s.id]}
  catId(s){return 'quest'}
  title(s){return this.name(s)+', a quest item'}
  some(s){return 'the '+this.name(s).toLowerCase()}
  verbSpecs(){return []}
  // the key of what a happening binds it to: a quest or a thread; an encounter a thread began, that thread; else nothing
  boundTo(e){
    if(!e||!e.shape)return null;
    if(e.shape==='quest'||e.shape==='thread')return e.shape+':'+e.id;
    const th=typeof Thread!=='undefined'?Thread.list().on.find(th=>th.waits({e})):null;
    return th?'thread:'+th.i:null}
  // given (into your bag, never left behind) and taken back: how many
  give(id,e){return playerInventory.add('quest',id,1,true,{by:this.boundTo(e)})}
  take(id){return playerInventory.take('quest',id,1)}
  // its quest or thread over (e): what it gave is gone from your bag
  ended(e){
    const key=e&&e.shape+':'+e.id;
    if(!key)return;
    P.inv.forEach((s,i)=>{if(s&&s.k==='quest'&&s.by===key){P.inv[i]=null;log('You no longer carry '+this.some(s)+': its '+e.shape+' is over.')}});
  }
}
const ITEM_KINDS={gear:new Gear(),mount:new Mount(),quiver:new Quiver(),good:new Good(),mat:new Trophy(),val:new Valuable(),quest:new QuestItem()};
// (the sealed letter's kind, Letter, is world/letters.js's: ITEM_KINDS.letter)
for(const ev of ['quest:ended','thread:ended'])worldOn(ev,d=>ITEM_KINDS.quest.ended(d&&d.e));
// the kind of a bag record {k, id}: a mount or a quiver is the gear for its slot; any other kind reads as a trophy, as it always did
function itemKind(s){
  if(s.k==='gear'){const sl=ITEMS[s.id]&&ITEMS[s.id].slot;return sl==='mount'?ITEM_KINDS.mount:sl==='quiver'?ITEM_KINDS.quiver:ITEM_KINDS.gear}
  return ITEM_KINDS[s.k]||ITEM_KINDS.mat;
}
// a good you can carry (an item: a holding's old arrows are none)
const itemGood=g=>!!ITEM_KINDS.good.catId({id:g});
// the shots a fighter carries into a battle (its gear, its weapon's id w, its stats s): Quiver shots; null, none needed
const quiverShots=(gear,w,s)=>ITEM_KINDS.quiver.shots(gear,ITEM_KINDS.quiver.shootsWith(w,s));
// (the old names)
const itemDef=s=>itemKind(s).def(s);
const stackOf=(k,id)=>itemKind({k,id}).stack(id);
const itemDt=id=>ITEM_KINDS.gear.damageType(id);
const itemArmor=id=>ITEM_KINDS.gear.armourClass(id);
const targetKey=id=>ITEM_KINDS.gear.keyOn(id);
