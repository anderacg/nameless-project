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
   - its family (the owner, 2026-11-09: "Give lords spouses and children so houses have real families"): a lord's spouse and children
     are its kin (LordHouse#kin, not lords: no army), made as the house first knows him (seed); day by day the grown and unwed of it
     wed, its couples have children, its children come of age (daily); one dead is followed by their eldest grown child, else a grown
     brother or sister, else their spouse, else the eldest grown of its blood, else a cousin from afar (heirOf).
   Numbers: data/death.js DEATH.house ---------- */
class LordHouse{
  constructor(o){Object.assign(this,o)}
  // (a lord's house: his own, or one he founds now)
  static of(l){let h=l.house&&Houses.byId(l.house);if(h){if(!l.famed&&!l.gone&&!l.dead)h.seed(l);return h}const sur=String(l.name||'').split(/\s+/).pop()||'Nameless',seat=Spatial.nearest(fiefsOf(l.fac),l.x,l.y);
    h=new LordHouse({id:'h'+(++Houses.n),name:'House '+sur,fac:l.fac,seat:seat?seat.name:'',dead:[],kin:[]});Houses.list.push(h);l.house=h.id;h.seed(l);return h}
  // (a grudge against you, the hero who did it: gone with you, for a new person is a stranger to them)
  grudged(){return !!this.grudge&&this.grudge.gen===Legacy.fallen}
  get live(){return W.lords.filter(l=>l.house===this.id&&!l.dead&&!l.gone)}
  // ---- what you know of it (the owner, 2026-11-09: "only appear once you know them or someone tell you about their family (only
  // when very friendly)"): one of it is known once you know them (KNOWLEDGE: met, or named to you), or read their name on its crypt,
  // or a close friend of the house told you of it (tell); the rest of it shown as ?? (ui/family.js housePage)
  knows(id){return Object.hasOwn(KNOWLEDGE.lords,id)||(this.known||[]).includes(id)}
  learn(ids){this.known??=[];for(const id of ids)if(!this.known.includes(id))this.known.push(id)}
  get members(){return [...this.dead.map(d=>({...d,dead:true})),...this.live,...this.kinLive]}
  get knownAny(){return this.members.some(m=>this.knows(m.id))}
  // (a lord of it who thinks well enough of you (DEATH.house.tell) tells you of all of it: its living and its dead; else '' and why not)
  tellWhy(l){return relWith(l)>=DEATH.house.tell?'':'Only for a close friend'}
  tell(l){if(this.tellWhy(l))return '';const live=this.live.filter(o=>o!==l),D=this.dead,K=this.kinLive,blood=K.filter(k=>!k.inlaw),wed=K.filter(k=>k.inlaw);
    for(const o of live)KNOWLEDGE.lord(o);this.learn([...D.map(d=>d.id),...K.map(k=>k.id)]);
    return '<p>'+htmlText(this.name)+(this.seat?', of '+htmlText(this.seat):'')+'. '+(live.length?'Its lords besides me: '+live.map(o=>htmlText(o.name)).join(', ')+'. ':K.length?'':'There is only me of it now. ')+
      (blood.length?'Of our blood besides: '+blood.map(k=>htmlText(k.name)+(this.adult(k)?'':' (a child yet)')).join(', ')+'. ':'')+(wed.length?'Wed into the house: '+wed.map(k=>htmlText(k.name)).join(', ')+'. ':'')+
      (D.length?'Our dead lie in the crypt: '+D.map(d=>htmlText(d.name)+' ('+htmlText(d.how)+')').join(', ')+'.':'None of us lies in the crypt yet.')+'</p>'}
  // ---- its family: kin (spouses wed into it, inlaw; children of its blood, parent), lords and its dead by the same fields
  get kinLive(){return (this.kin||[]).filter(k=>!k.dead)}
  // (anyone of it by id: a lord of it living, one of its dead, one of its kin)
  person(id){return id&&(W.lords.find(o=>o.id===id&&o.house===this.id&&!o.gone)||this.dead.find(d=>d.id===id)||(this.kin||[]).find(k=>k.id===id))||null}
  adult(p){return p.born==null||G.day-p.born>=DEATH.house.fam.adult}
  childrenOf(id){return [...this.live,...this.kinLive].filter(p=>p.parent===id)}
  // (a lord's people: his own, else his realm's, as his face is drawn: ui/faces.js Faces.lord)
  raceOf(l){if(l.race)return l.race;const rs=FACS[l.fac||this.fac]?.races||['human'];return rs[Rng.seedOf('face:'+l.name)%rs.length]||'human'}
  // (a given name of a people, a woman's or a man's, one no lord alive, none of its dead and none of its kin goes by if it can)
  nameFor(race,g,R){const L=(FOLK_NAMES[race]||FOLK_NAMES.human).filter(n=>FOLK_WOMEN.includes(n)===(g==='f')),last=n=>String(n).split(/\s+/).pop(),
      used=new Set([...W.lords.filter(o=>!o.gone).map(o=>last(o.name)),...this.dead.map(d=>last(d.name)),...(this.kin||[]).map(k=>k.name)]),free=L.filter(n=>!used.has(n));
    return R.pick(free.length?free:L)}
  addKin(o){(this.kin??=[]).push({id:this.id+'k'+(this.kn=(this.kn||0)+1),kin:true,...o});return this.kin[this.kin.length-1]}
  // (a child of one of its blood: their people, a daughter or a son; born: the day)
  child(p,R,born){const g=R.chance(.5)?'f':'m',race=this.raceOf(p);return this.addKin({name:this.nameFor(race,g,R),gender:g,race,born,parent:p.id})}
  // (one of it wed: a spouse of their people from outside the house, of age)
  wed(p,R){const F=DEATH.house.fam,g=genderOf(p)==='f'?'m':'f',race=this.raceOf(p),s=this.addKin({name:this.nameFor(race,g,R),gender:g,race,born:G.day-R.int(F.adult,F.adult+F.age[1]),spouse:p.id,inlaw:true});p.spouse=s.id;return s}
  // (a lord's family as his house first knows him: a spouse, and children of all ages)
  seed(l){if(l.famed)return;l.famed=true;const F=DEATH.house.fam,R=rngOf('houses');
    if(l.spouse||!R.chance(F.wed))return;this.wed(l,R);for(let i=0,n=R.int(F.kids[0],F.kids[1]);i<n;i++)this.child(l,R,G.day-R.int(F.age[0],F.age[1]))}
  // (each day: the grown and unwed of its blood may wed, its couples have children; none past cap of it alive)
  daily(){const F=DEATH.house.fam,R=rngOf('houses');for(const l of this.live)this.seed(l);
    const blood=()=>[...this.live,...this.kinLive].filter(p=>!p.inlaw);
    for(const p of blood()){if(this.live.length+this.kinLive.length>=F.cap)return;const s=p.spouse&&this.person(p.spouse);
      if(!p.spouse){if(this.adult(p)&&R.chance(F.marry))this.wed(p,R)}else if(s&&!s.dead&&this.childrenOf(p.id).length<F.most&&R.chance(F.birth))this.child(p,R,G.day)}}
  // (who takes up the place of one of it dead (d): their eldest grown child, else a grown brother or sister, else their spouse, else
  // the eldest grown of its blood; none: one of the realm's people from afar, a cousin of it)
  heirOf(d){const K=this.kinLive,eld=a=>a.filter(k=>this.adult(k)&&!k.inlaw).sort((a,b)=>a.born-b.born)[0];
    return d&&(eld(K.filter(k=>k.parent===d.id))||(d.parent?eld(K.filter(k=>k.parent===d.parent)):null)||K.find(k=>k.id===d.spouse&&this.adult(k)))||eld(K)||null}
  // (one of it dead for good: named in its crypt, and one of it to take up his place)
  // (byYou: put to death or slain by you: the house holds it against you (grudge), its living lords and the next of it, while you live)
  fell(l,how,byYou){if(this.dead.some(d=>d.id===l.id))return;this.dead.push({id:l.id,name:l.name,day:G.day,how,lv:l.lv||1,byYou:!!byYou,of:l.succeeded||null,fac:l.fac,race:l.race,gender:genderOf(l),parent:l.parent||null,spouse:l.spouse||null,inlaw:l.inlaw||undefined,born:l.born,kinFace:l.kinFace||undefined,cousin:l.cousin||undefined});Crypt.of(this).honour(l);
    if(byYou){this.grudge={gen:Legacy.fallen,day:G.day,name:l.name,how};for(const o of this.live)changeRel(o,DEATH.house.grudge,'you killed '+l.name+' of '+this.name)}
    if(!W.dead[l.fac]&&FACS[l.fac])this.next={of:l.id,day:G.day+DEATH.house.wait,fac:l.fac,lv:Math.max(1,(l.lv||1)-DEATH.house.lv),title:String(l.name).split(/\s+/)[0]};
    worldEvent({text:l.name+' of '+this.name+' is dead ('+how+'). '+cap1(pr(l).his)+' house will bury '+pr(l).him+' at '+(this.seat||'home')+'.',x:l.x,y:l.y,fac:[l.fac],cls:'bad',past:l.name+' died'})}
  // (the one who takes up the place: a given name of the realm's people, the title fitting them)
  succeed(){const n=this.next;if(!n||G.day<n.day)return;this.next=null;if(W.dead[n.fac]||!FACS[n.fac])return;
    const k=this.heirOf(this.dead.find(d=>d.id===n.of));if(k)return this.raise(k,n);
    const R=rngOf('houses'),race=FACS[n.fac].races[R.int(0,FACS[n.fac].races.length-1)]||'human',T0=DEATH.house.titles,
      taken=g=>W.lords.some(o=>!o.gone&&String(o.name).split(/\s+/).pop()===g)||this.dead.some(d=>String(d.name).split(/\s+/).pop()===g);let given=R.pick(FOLK_NAMES[race]||FOLK_NAMES.human);for(let k=0;k<6&&taken(given);k++)given=R.pick(FOLK_NAMES[race]||FOLK_NAMES.human);// (no two lords alive of one name, nor one of its dead's)
    const f=FOLK_WOMEN.includes(given),
      T=DEATH.house.titles,title=T[n.title]?T[n.title][f?1:0]:n.title,seat=townBy(this.seat)||Spatial.nearest(fiefsOf(n.fac),P.x,P.y);if(!seat)return;
    const l=asParty({id:this.id+'_'+G.day+'_'+this.dead.length,name:title+' '+given,fac:n.fac,x:seat.x+rint(-8,8),y:seat.y+14,troops:armyOf(n.fac,DEATH.house.men),state:'rest',tgt:seat.name,sd:0,cool:0,dead:false,gone:false,back:0,house:this.id,gender:f?'f':'m',succeeded:n.of||null,race,cousin:true});
    // (his skills made as any lord's: realms.js lordStats; then the level he comes to it with)
    lordStats(l);l.lv=n.lv;W.lords.push(l);if(this.grudged())changeRel(l,Math.round(DEATH.house.grudge*(this.grudge.half?DEATH.kin.rel:1)),(this.grudge.half?'your kin':'you')+' killed '+this.grudge.name+' of '+this.name);
    worldEvent({text:l.name+' takes up the place of '+this.name+' at '+seat.name+'.',x:seat.x,y:seat.y,fac:[n.fac],post:false,kind:''});return l}
  // (one of its kin a lord now (n: the place, from fell): their own name and face, under the title fitting them, at its seat)
  raise(k,n){const seat=townBy(this.seat)||Spatial.nearest(fiefsOf(n.fac),P.x,P.y);if(!seat)return null;const T=DEATH.house.titles,f=k.gender==='f';
    this.kin=this.kin.filter(o=>o!==k);const {kin:_,...rec}=k;
    const l=asParty({...rec,name:(T[n.title]?T[n.title][f?1:0]:n.title)+' '+k.name,fac:n.fac,x:seat.x+rint(-8,8),y:seat.y+14,troops:armyOf(n.fac,DEATH.house.men),state:'rest',tgt:seat.name,sd:0,cool:0,dead:false,gone:false,back:0,house:this.id,succeeded:n.of||null,famed:true,kinFace:true});
    lordStats(l);l.lv=n.lv;W.lords.push(l);if((this.known||[]).includes(l.id))KNOWLEDGE.lord(l);
    if(this.grudged())changeRel(l,Math.round(DEATH.house.grudge*(this.grudge.half?DEATH.kin.rel:1)),(this.grudge.half?'your kin':'you')+' killed '+this.grudge.name+' of '+this.name);
    worldEvent({text:l.name+' takes up the place of '+this.name+' at '+seat.name+'.',x:seat.x,y:seat.y,fac:[n.fac],post:false,kind:''});return l}
}
const Houses={list:[],n:0,
  byId(id){return this.list.find(h=>h.id===id)||null},
  // (the houses you know one of, the rule on: a house founded for each lord you know, as you look them up)
  known(){if(!DEATH.on)return [];for(const l of W.lords)if(!l.gone&&!l.dead&&KNOWLEDGE.knowsLord(l))LordHouse.of(l);return this.list.filter(h=>h.knownAny)},
  // a lord dead for good (how: 'put to death', 'slain'), with the rule on
  died(l,how,byYou){if(!DEATH.on||!l)return;LordHouse.of(l).fell(l,how,byYou)},
  // (his army beaten: now and then he dies on the field, gone for good; by you (byYou), his house's grudge)
  slain(l,byYou){if(!DEATH.on||!l||l.gone||Math.random()>=DEATH.house.slain)return false;Object.assign(l,{dead:true,gone:true,back:1e9,troops:[],inside:null});this.died(l,'slain in battle',byYou);return true},
  // (a lord's house in a line: its name, seat, its dead, a grudge against you; make: found it now if it has none, the rule on)
  tagOf(l,make){const h=l.house&&this.byId(l.house)||(make&&DEATH.on&&!l.gone?LordHouse.of(l):null);if(!h)return '';
    return '<small>'+htmlText(h.name)+(h.seat?' · seat '+htmlText(h.seat):'')+(h.dead.length?' · '+h.dead.length+' in its crypt':'')+(h.grudged()?' · <span class="bad">bears you a grudge: '+(h.grudge.half?'your kin':'you')+' killed '+htmlText(h.grudge.name)+'</span>':'')+'</small>'},
  hour(){if(!DEATH.on)return;const day=this.day!==G.day;this.day=G.day;for(const h of this.list){h.succeed();if(day)h.daily()}},
  save(){return this.list.length?{n:this.n,list:this.list,day:this.day}:undefined},
  load(v){this.n=v?.n||0;this.day=v?.day;this.list=(v?.list||[]).map(o=>new LordHouse(o))}
};
/* a house's crypt at its seat (a kind of Remains: world/death.js): a stone mausoleum, the realm's banner over its door, its dead named
   on its page. Pay your respects (once a day): the house's living lords think the better of you (DEATH.house.respect) */
class Crypt extends Remains{
  static of(h){let c=Remains.list.find(o=>o.crypt&&o.house===h.id);if(c)return c;const t=townBy(h.seat)||Spatial.nearest(fiefsOf(h.fac),P.x,P.y),p=t?Grave.ground(t.x,t.y,null):{x:P.x,y:P.y};
    c=asCrypt({rm:1,crypt:1,house:h.id,x:p.x,y:p.y,who:h.name,day:G.day,gold:0,items:[]});Remains.list.push(c);RestSite.sync();return c}
  get kind(){return 'crypt'}
  get grave(){return 0}
  get houseOf(){return Houses.byId(this.house)}
  honour(l){this.day=G.day}
  robbable(){return false}
  get name(){return 'Crypt of '+this.who}
  get label(){return 'Crypt'}
  tip(){const h=this.houseOf;return '<b>The crypt of '+htmlText(this.who)+'</b><small>'+(h?h.dead.length+' of its dead lie here'+(FACS[h.fac]?' · the '+htmlText(FACS[h.fac].n):''):'')+'</small><span class="act">Click: go there</span>'}
  mapDot(V){return null}
  meet(){G.mode='dialog';G.remains=this;const h=this.houseOf,dead=h?h.dead:[],live=h?h.live:[],paid=this.paid===G.day;if(h)h.learn(dead.map(d=>d.id));
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
/* ---------- resting places (the owner, 2026-11-09: "Can you make it a actual places?"): every grave belongs to a place on the map, a
   site of its own (W.sites, type 'rest'), named, found as places are (its title rising), on the full map and the minimap, its
   page the site window's (its banner: the place as it stands): your family's plot (all your line buried by people), a house's
   crypt, a lone grave or cairn, or remains no one buried. Its graves draw themselves; its page holds what is done there: pray at
   each that still holds anything, take their grave goods, pay your respects at a crypt. sync makes the places for the graves,
   and keeps each where its graves are ---------- */
SITE_TYPES.rest={n:'Resting place',ico:'altar',col:'#d8c890',d:'Where the dead lie, and something of them lingers.',made:true,on:()=>false};// (made in play, never by the world: genSites passes it by)
class RestSite extends Site{
  get screen(){return PAGE_SCREEN}
  get scoutable(){return false}
  get empties(){return false}
  known(){return true}
  // (its graves: the family's plot, a house's crypt, or one alone)
  members(){const L=Remains.list;return this.kind==='plot'?L.filter(o=>o.grave&&o.plot&&o.plot===this.ref):this.kind==='crypt'?L.filter(o=>o.crypt&&o.house===this.ref):L.filter(o=>o.grave&&!o.plot&&RestSite.keyOf(o)===this.ref)}
  // (a lone grave's own key, kept as it is moved: buried where it lay, or carried away)
  static keyOf(g){return g.key||(g.key=g.who+':'+g.day+':'+(g.n||0))}
  static point(tx,ty){return[(tx+.5)*TILE,(ty+.5)*TILE]}
  placed(){}
  // (its picture: its finest grave's, for the full map; drawn on the map by its graves themselves)
  picture(){const ms=this.members(),order=['tomb','crypt','grave','stone','cairn','small','remains'],g=ms.slice().sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind))[0];
    const S=GraveArt.sprite(g?g.kind:'small',g?.seed||1);return S.cv}
  draw(){}
  view(){const ms=this.members(),ps=[];for(const g of ms){const S=GraveArt.sprite(g.kind,g.seed||1);ps.push([S.ground,g.x-S.ax,g.y-S.ay],[S.cv,g.x-S.ax,g.y-S.ay])}
    return{key:'rest:'+this.i+':'+ms.length+':'+ms.filter(g=>g.spent).length,x:this.x,y:this.y+8,alt:this.name,ps}}
  box(box){const ms=this.members();if(!ms.length)return;box(this,Math.min(...ms.map(g=>g.x))-12,Math.min(...ms.map(g=>g.y))-14,Math.max(...ms.map(g=>g.x))+12,Math.max(...ms.map(g=>g.y))+8)}
  tip(){const n=this.members().length;return '<b>'+Discovery.nameOf(this)+'</b><small>'+this.T.n+(this.kind==='plot'?' · '+n+' of your line':this.kind==='crypt'?' · '+(Houses.byId(this.ref)?.dead.length||0)+' lords':'')+'</small><span class="act">Click: go there</span>'}
  about(){const ms=this.members(),g=ms[0];
    if(this.kind==='plot')return '<p>The plot of the family of '+htmlText(g?.family||Legacy.plot?.family||'your line')+', by '+htmlText(g?.at||'')+': '+ms.length+' of your line lie here, within its low wall.</p>';
    if(this.kind==='crypt'){const h=Houses.byId(this.ref);return '<p>The crypt of '+htmlText(h?.name||'a house')+', at '+htmlText(h?.seat||'its seat')+'. Their names are cut over its door: '+(h?h.dead.map(d=>htmlText(d.name)+' <span class="muted">(day '+d.day+', '+htmlText(d.how)+')</span>').join(', '):'')+'.</p>'}
    return g?'<p>'+(g.unburied?'No one has buried them yet: '+htmlText(g.who)+' lies as they fell, to '+htmlText(g.life?.by||'beasts')+'.'+(g.heir?' Their heir is coming for them.':''):g.words.line.replace('{at}',htmlText(g.at||''))+'here lies '+htmlText(g.who)+', who fell to '+htmlText(g.life?.by||'beasts')+'.')+'</p>':''}
  page(){const ms=this.members(),acts=[];let body=this.about();
    if(this.kind!=='crypt')body+='<div class="lab">Here lie</div>'+ms.map(g=>'<p><b>'+htmlText(g.who)+'</b> <span class="muted">· '+g.words.label.toLowerCase()+' · fell on day '+g.day+(g.n>1?' · the '+ordinal(g.n)+' of your line':'')+' · level '+(g.life?.level||0)+'</span>'+
      (g.spent?' <span class="muted">· prayed at</span>':g.xp?' <span class="gold">· '+g.xp+' experience lingers</span>':'')+(g.empty()?'':' · with them: '+g.what())+'</p>').join('');
    ms.forEach((g,i)=>{if(g.grave&&!g.spent&&g.xp>0)acts.push({icon:'altar',label:'Pray for '+htmlText(g.who),act:'site-rest',arg:'pray:'+i,facts:[g.xp+' experience']});
      if(!g.empty())acts.push({icon:'gold',label:'Take what lies with '+htmlText(g.who),act:'site-rest',arg:'take:'+i,facts:[g.what()]});
      if(g.unburied){acts.push({icon:'altar',label:'Bury '+htmlText(g.who)+' here',act:'site-rest',arg:'here:'+i,facts:[(g.life?.renown||0)>=DEATH.grave.tiers.cairn?'a cairn over them':'a small grave']});
        const to=townBy(Legacy.plot?.at)||Spatial.nearestHolding(g.x,g.y,t=>!t.gone);if(to)acts.push({icon:'altar',label:'Carry them to '+(Legacy.plot?'the family plot':to.name),act:'site-rest',arg:'plot:'+i,facts:['by '+to.name]})}
      if(g.crypt)acts.push({icon:'altar',label:'Pay your respects',act:'site-rest',arg:'respect:'+i,why:g.paid===G.day?'Paid today':'',facts:['its living lords think the better of you']})});
    return {body,acts}}
  act(a,arg,done){if(a!=='site-rest')return false;const [k,n]=String(arg).split(':'),g=this.members()[+n];if(!g)return true;
    if(k==='pray'){G.site=null;g.pray();return true}
    if(k==='take'){const got=g.take();done(got?'From '+g.who+': '+got+'.':'Nothing you can carry.');return true}
    if((k==='here'||k==='plot')&&g.unburied){Grave.rest(g,null,k);G.site=null;G.mode='world';hidePanel();log('You bury '+g.who+(g.at?' in the family plot at '+g.at:' where they lay')+'.','gold','story');return true}
    if(k==='respect'&&g.crypt){g.respect();done('You pay your respects.');return true}return true}
  // (the places for the graves: each made once, kept where its graves are; its name)
  static sync(){if(!W.sites)return;const want=[];
    for(const at of new Set(Remains.list.filter(o=>o.grave&&o.plot).map(o=>o.plot)))want.push(['plot',at]);
    for(const o of Remains.list){if(o.crypt)want.push(['crypt',o.house]);else if(o.grave&&!o.plot)want.push(['lone',RestSite.keyOf(o)])}
    for(const [kind,ref] of want){let s=W.sites.find(x=>x.type==='rest'&&x.kind===kind&&x.ref===ref);
      let i=RESTSITE_I0+(++Legacy.restN);while(W.sites.some(x=>x.i===i))i=RESTSITE_I0+(++Legacy.restN);
      if(!s){s=siteOf({i,type:'rest',kind,ref,seed:W.sites.length+1,seen:true,cleared:false,back:0,name:'',tx:0,ty:0,x:0,y:0});W.sites.push(s)}
      const ms=s.members();if(!ms.length)continue;s.x=Math.round(ms.reduce((a,g)=>a+g.x,0)/ms.length);s.y=Math.round(ms.reduce((a,g)=>a+g.y,0)/ms.length);s.tx=Math.floor(s.x/TILE);s.ty=Math.floor(s.y/TILE);
      s.name=kind==='plot'?cap1(ms[0].family||Legacy.plot?.family||'your')+' Family Rest':kind==='crypt'?'Crypt of '+(Houses.byId(ref)?.name||'a house'):ms[0].name}
    W.sites=W.sites.filter(x=>x.type!=='rest'||x.members().length)}
}
SITE_CLASS.rest=RestSite;
// (a resting place's number: its own run, far past the world's sites, never used again once a place is gone, so a place found and
// gone never makes a new one known: Legacy.restN, saved)
const RESTSITE_I0=100000;
