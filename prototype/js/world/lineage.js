'use strict';
/* ---------- the lords' houses (world/lineage.js: LordHouse, Houses, Crypt; a holding's houses are world/houses.js) (the owner, 2026-11-09: "Create a family system for lords as well. Lord die may also have grave but
   may be different grave"; doc/DEATH_DESIGN.md §6.3). Every lord is of a house (LordHouse.of: made the first time it is needed, its
   name the founder's, its seat the realm's holding nearest him), kept in Houses.list (saved: houses). A lord dies for good put to
   death (world/prisons.js pz-exec), or slain as his army is beaten (defeatLord: DEATH.house.slain), only with the death rule on
   (DEATH.on: the tests' harness off, so the world as it was):
   - the house buries him in its crypt at its seat (Crypt: one for each house, every dead of it named on it): a stone mausoleum,
     the realm's banner over its door; you may pay your respects there (its living lords think better of you, once a day);
   - one of the house takes up his place (succeed: after DEATH.house.wait days of mourning, a new lord of the house, of its
     realm's people, at its seat, with a few men); a house whose realm has fallen ends with its last.
   Numbers: data/death.js DEATH.house ---------- */
class LordHouse{
  constructor(o){Object.assign(this,o)}
  // (a lord's house: his own, or one he founds now)
  static of(l){let h=l.house&&Houses.byId(l.house);if(h)return h;const sur=String(l.name||'').split(/\s+/).pop()||'Nameless',seat=Spatial.nearest(fiefsOf(l.fac),l.x,l.y);
    h=new LordHouse({id:'h'+(++Houses.n),name:'House '+sur,fac:l.fac,seat:seat?seat.name:'',dead:[]});Houses.list.push(h);l.house=h.id;return h}
  get live(){return W.lords.filter(l=>l.house===this.id&&!l.dead&&!l.gone)}
  // (one of it dead for good: named in its crypt, and one of it to take up his place)
  fell(l,how){if(this.dead.some(d=>d.id===l.id))return;this.dead.push({id:l.id,name:l.name,day:G.day,how,lv:l.lv||1});Crypt.of(this).honour(l);
    if(!W.dead[l.fac]&&FACS[l.fac])this.next={day:G.day+DEATH.house.wait,fac:l.fac,lv:Math.max(1,(l.lv||1)-DEATH.house.lv),title:String(l.name).split(/\s+/)[0]};
    worldEvent({text:l.name+' of '+this.name+' is dead ('+how+'). '+cap1(pr(l).his)+' house will bury '+pr(l).him+' at '+(this.seat||'home')+'.',x:l.x,y:l.y,fac:[l.fac],cls:'bad',past:l.name+' died'})}
  // (the one who takes up the place: a given name of the realm's people, the title fitting them)
  succeed(){const n=this.next;if(!n||G.day<n.day)return;this.next=null;if(W.dead[n.fac]||!FACS[n.fac])return;
    const R=rngOf('houses'),race=FACS[n.fac].races[R.int(0,FACS[n.fac].races.length-1)]||'human',given=R.pick(FOLK_NAMES[race]||FOLK_NAMES.human),f=FOLK_WOMEN.includes(given),
      T=DEATH.house.titles,title=T[n.title]?T[n.title][f?1:0]:n.title,seat=townBy(this.seat)||Spatial.nearest(fiefsOf(n.fac),P.x,P.y);if(!seat)return;
    const l=asParty({id:this.id+'_'+G.day+'_'+this.dead.length,name:title+' '+given,fac:n.fac,x:seat.x+rint(-8,8),y:seat.y+14,troops:armyOf(n.fac,DEATH.house.men),state:'rest',tgt:seat.name,sd:0,cool:0,dead:false,gone:false,back:0,lv:n.lv,house:this.id,gender:f?'f':'m'});
    W.lords.push(l);worldEvent({text:l.name+' takes up the place of '+this.name+' at '+seat.name+'.',x:seat.x,y:seat.y,fac:[n.fac],post:false,kind:''});return l}
}
const Houses={list:[],n:0,
  byId(id){return this.list.find(h=>h.id===id)||null},
  // a lord dead for good (how: 'put to death', 'slain'), with the rule on
  died(l,how){if(!DEATH.on||!l)return;LordHouse.of(l).fell(l,how)},
  // (his army beaten: now and then he dies on the field, gone for good)
  slain(l){if(!DEATH.on||!l||l.gone||Math.random()>=DEATH.house.slain)return false;Object.assign(l,{dead:true,gone:true,back:1e9,troops:[],inside:null});this.died(l,'slain in battle');return true},
  hour(){if(!DEATH.on)return;for(const h of this.list)h.succeed()},
  save(){return this.list.length?{n:this.n,list:this.list}:undefined},
  load(v){this.n=v?.n||0;this.list=(v?.list||[]).map(o=>new LordHouse(o))}
};
/* a house's crypt at its seat (a kind of Remains: world/death.js): a stone mausoleum, the realm's banner over its door, its dead named
   on its page. Pay your respects (once a day): the house's living lords think the better of you (DEATH.house.respect) */
class Crypt extends Remains{
  static of(h){let c=Remains.list.find(o=>o.crypt&&o.house===h.id);if(c)return c;const t=townBy(h.seat)||Spatial.nearest(fiefsOf(h.fac),P.x,P.y),p=t?Grave.ground(t.x,t.y,null):{x:P.x,y:P.y};
    c=asCrypt({rm:1,crypt:1,house:h.id,x:p.x,y:p.y,who:h.name,day:G.day,gold:0,items:[]});Remains.list.push(c);return c}
  get kind(){return 'crypt'}
  get grave(){return 0}
  get houseOf(){return Houses.byId(this.house)}
  honour(l){this.day=G.day}
  robbable(){return false}
  get name(){return 'Crypt of '+this.who}
  get label(){return 'Crypt'}
  tip(){const h=this.houseOf;return '<b>The crypt of '+htmlText(this.who)+'</b><small>'+(h?h.dead.length+' of its dead lie here'+(FACS[h.fac]?' · the '+htmlText(FACS[h.fac].n):''):'')+'</small><span class="act">Click: go there</span>'}
  mapDot(V){return Discovery.named(this)?[DEATH.grave.col.stone,2]:null}
  meet(){G.mode='dialog';G.remains=this;const h=this.houseOf,dead=h?h.dead:[],live=h?h.live:[],paid=this.paid===G.day;
    showPanel('<div class="top"><h2>A crypt</h2><span class="muted">'+htmlText(this.who)+'</span></div>'+
      '<p>A house of stone at '+htmlText(h?.seat||'its seat')+', the banner of '+(h&&FACS[h.fac]?'the '+htmlText(FACS[h.fac].n):'its realm')+' over its door. Their names are cut over it:</p>'+
      '<div class="lab">Here lie</div>'+(dead.length?dead.map(d=>'<p>'+htmlText(d.name)+' <span class="muted">· day '+d.day+', '+htmlText(d.how)+'</span></p>').join(''):'<p class="muted">No one yet.</p>')+
      (live.length?'<p class="muted">Of the house now: '+live.map(l=>htmlText(l.name)).join(', ')+'.</p>':'')+
      nav(['death-leave',null,'Leave'],paid?null:['death-respect',null,'Pay your respects']))}
  respect(){if(this.paid===G.day)return;this.paid=G.day;const h=this.houseOf;for(const l of h?h.live:[])changeRel(l,DEATH.house.respect,'you paid your respects to the dead of '+h.name);
    log('You pay your respects at the crypt of '+this.who+'.'+(h&&h.live.length?' Its lords hear of it.':''),'gold')}
  draw(ents,cam,V){if(!this.inView(V))return;const c=this,S=GraveArt.sprite('crypt',1),t=performance.now()/1000,h=this.houseOf;
    ents.push({y:c.y-1e5,f:()=>{ctx.drawImage(S.ground,Math.round(c.x-cam.x)-S.ax,Math.round(c.y-cam.y)-S.ay)}});
    ents.push({y:c.y,f:()=>{const x=Math.round(c.x-cam.x),y=Math.round(c.y-cam.y);ctx.save();ctx.drawImage(S.cv,x-S.ax,y-S.ay);GraveArt.live(c,x,y,t,darkness()>.35,h&&FACS[h.fac]?FACS[h.fac].col:null);ctx.restore()}})}
}
const asCrypt=asClass(Crypt);
onWorld(()=>{Houses.list=[];Houses.n=0});
Systems.add({name:'houses',order:{hour:167},hour:()=>Houses.hour()});
Saves.add({key:'houses',order:334,defaults:null,save:()=>Houses.save(),load:v=>Houses.load(v)});
