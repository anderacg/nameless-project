'use strict';
/* ---------- a holding's houses on the map (the owner, 2026-10-31: "make buildings like houses actually clickable and inspectable like
   estate buildings, instead of pointing to the holding"): a house is a world object of its own (House: one per house lot, kept aside,
   never saved), picked on its building in its holding's order of lots (HoldingObject pick), looked at in its own page
   (ui/house.js) ---------- */
const HOUSE_OBJ=new WeakMap();
class House extends WorldObject{
  #t;#l;
  constructor(t,l){super();this.#t=t;this.#l=l;this.town=t.name;const m=lotMid(l);this.x=m.x;this.y=m.y}
  get mapKind(){return 'house'}
  get meetsAnyTime(){return true}
  get holding(){return this.#t}
  get lot(){return this.#l}
  meet(){houseMeet(this)}
  pick(at){}// (with its holding's lots, in their order: pickOn)
  pickOn(at,t,l){at.box(this,l.x*TILE,l.y*TILE,(l.x+l.n)*TILE,(l.y+l.n)*TILE,0)}
  // its kind (its model: a cottage, a townhouse, a stone hall, a tree house, an elf hall), its households, its people
  kindN(){return cap1(String(this.#l.type||'house').replace(/([a-z])(hall|house)$/,'$1 $2'))}
  households(){return this.#l.st==='built'?lotHouseholds(this.#t,this.#l):0}
  people(){return this.households()*HOUSING.household}
  // your quests that lead to it (story/steps.js StepQuest.place: a house of its holding, at its door)
  quests(){const m=lotMid(this.#l);return P.quests.filter(q=>q.to?.k==='house'&&q.to.town===this.town&&Math.hypot(q.to.x-m.x,q.to.y-m.y)<this.#l.n*TILE)}
  tip(){return '<b>'+this.kindN()+'</b><small>A house of '+this.town+(this.#l.st==='built'?' · '+this.households()+' household'+(this.households()>1?'s':''):this.#l.st==='ruined'?' · burnt':' · being built')+'</small>'+(this.quests().length?'<small class="gold">'+htmlText(this.quests()[0].title)+'</small>':'')+'<span class="act">Click: look</span>'}
}
const housePick=(t,l)=>{let o=HOUSE_OBJ.get(l);if(!o)HOUSE_OBJ.set(l,o=new House(t,l));return o};
