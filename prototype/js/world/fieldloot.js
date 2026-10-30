'use strict';
/* ---------- spoils left on the field (the owner, 2026-10-30: withdrawn or beaten with beasts holding the field, "you can still get
   all loots ... but you have to come back at that area and claim it"; "the beast may wander around there, looters or bandits may
   also seek this"). What the fight would have paid stays where it was fought: the beasts make it their ground (their lair moved
   there), and a side quest (step kind 'fieldloot') points you back. Reached with no beast within FIELD_LOOT.guard px, it is yours;
   each day a band within FIELD_LOOT.seek px may set out for it (lure) and, there, takes it (BandBrain: brains.js). In
   FIELD_LOOT.days it is gone. ---------- */
const FIELD_LOOT={days:5,guard:60,seek:320,lure:.35,take:10};
// what the fight would have paid (resolution.js conclude, monsters.js monsterLoot), nothing yet in the bag: gold for each man slain,
// the beast's own (mats, meat, the wolves' furs) and its gear by its rolls
function fieldSpoils(slain,m){const M=MONSTERS[m.id],n=slain.filter(k=>k===M.unit).length,items=[];let gold=0;for(const k of slain)if(!ST[k]?.beast)gold+=rint(2,6);
  if(n&&M.mat)items.push(['mat',M.mat,n]);if(n&&M.meat)items.push(['good','meat',n*M.meat]);const furs=Math.floor(slain.filter(k=>k==='wolf').length/2);if(furs)items.push(['good','furs',furs]);
  for(const [it,ch] of M.gear||[])if(monRng().chance(ch*(1+.1*((m.lv||1)-1))))items.push(['gear',it,1]);return{gold:Math.round(gold*(1+tm('loot'))),items}}
// the spoils left at x, y by the beast m (its lair there now) and the quest to take them back; null when there is nothing to leave
function leaveFieldLoot(x,y,slain,m){if(!m||!MONSTERS[m.id]||!slain?.length)return null;const s=fieldSpoils(slain,m);if(!s.gold&&!s.items.length)return null;
  if(!MONSTERS[m.id].mythic){m.hx=x;m.hy=y}const q=Quest.make('fieldloot',Spatial.nearestHolding(x,y),null,{x,y,gold:s.gold,items:s.items,beast:MONSTERS[m.id].n.toLowerCase()});return q&&q.accept()?q:null}
// (its line under the battle's report)
const fieldLootLine=q=>'<p class="gold">Your spoils ('+q.what()+') stay on the field, the '+q.beast+' over them: come back for them (Quests).</p>';
const lootName=(k,id)=>(k==='gear'?ITEMS:k==='mat'?MATS:GOODS)[id].n.toLowerCase();
class FieldLootQuest extends StepQuest{
  setup(t,lord,s){this.x=Math.round(s.x);this.y=Math.round(s.y);this.gold=s.gold||0;this.items=s.items||[];this.beast=s.beast||'beasts';this.days=FIELD_LOOT.days;this.prize={};this.forfeit={};this.reward=StepQuest.reward({});
    this.to={k:'spot',x:this.x,y:this.y,name:'the field near '+t.name};this.giver=t.name;this.title='Spoils left on the field';
    this.text='Your fallen foes and their spoils ('+this.what()+') lie where you fought, near '+t.name+', and the '+this.beast+' hold the ground. Drive them off and it is yours; bandits may find it first. In '+this.days+' days it is gone.'}
  what(){return [this.gold&&this.gold+' gold',...this.items.map(([k,id,n])=>n+' '+lootName(k,id))].filter(Boolean).join(', ')}
  get reaches(){return true}
  // (a beast still on the spot, out of any fight: it is theirs yet)
  guarded(){return W.monsters.some(m=>!m.fight&&Math.hypot(m.x-this.x,m.y-this.y)<FIELD_LOOT.guard)}
  near(){return super.near()&&!this.guarded()}
  reached(){const got=[];if(this.gold){P.gold+=this.gold;got.push(this.gold+' gold')}let left=0;
    for(const [k,id,n] of this.items){const a=invAdd(k,id,n);if(a)got.push(a+' '+lootName(k,id));left+=n-a}
    this.lines={arrive:'On the field you gather '+(got.join(', ')||'nothing you can carry')+'.'+(left?' Your bag is full: the rest stays behind.':'')};this.pay('arrived','arrive')}
  todo(){return this.guarded()?'Drive the '+this.beast+' off the field.':'Go back to the field and gather the spoils.'}
  // (the day's: late, gone; else a band near it may set out for it)
  lapse(){super.lapse();if(this.fate)return;const X=FIELD_LOOT;
    for(const b of bandits)if(!b.lootGo&&!b.qid&&!b.gone&&!b.fight&&Math.hypot(b.x-this.x,b.y-this.y)<X.seek&&Math.random()<X.lure)b.lootGo={q:this.id,x:this.x,y:this.y}}
  sayOf(k){return {late:'What you left on the field is gone: picked over and scattered.',looted:'Bandits have picked the field clean of your spoils.'}[k]||super.sayOf(k)}
  // a band's moment bound for it (BandBrain): a step there; there, it takes it. False when it is no more to seek
  static seek(b,d){const g=b.lootGo,q=P.quests.find(x=>x.id===g.q&&x.type==='fieldloot');if(!q){b.lootGo=null;return false}
    if(Math.hypot(g.x-b.x,g.y-b.y)<FIELD_LOOT.take){b.lootGo=null;Quest.as(q).over('looted','looted');return true}
    Router.travel(b,g,moveStep(16,d))||walk(b,g.x-b.x,g.y-b.y,Math.min(Math.hypot(g.x-b.x,g.y-b.y),moveStep(16,d)));return true}
}
defineKind('step','fieldloot',{cls:FieldLootQuest});
