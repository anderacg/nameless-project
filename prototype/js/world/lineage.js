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
/* ---------- resting places (the owner, 2026-11-09: "Can you make it a actual places?"): every grave belongs to a place on the map, a
   site of its own (W.sites, type 'rest'), named, found as places are (its title rising), on the full map and the minimap, its
   page the site window's (its banner: the place as it stands): your family's plot (all your line buried by people), a house's
   crypt, a lone grave or cairn, or remains no one buried. Its graves draw themselves; its page holds what is done there: pray at
   each that still holds anything, take their grave goods, pay your respects at a crypt. sync makes the places for the graves,
   and keeps each where its graves are ---------- */
SITE_TYPES.rest={n:'Resting place',ico:'altar',col:'#d8c890',d:'Where the dead lie, and something of them lingers.'};
class RestSite extends Site{
  get screen(){return PAGE_SCREEN}
  get scoutable(){return false}
  get empties(){return false}
  known(){return true}
  // (its graves: the family's plot, a house's crypt, or one alone)
  members(){const L=Remains.list;return this.kind==='plot'?L.filter(o=>o.grave&&o.plot):this.kind==='crypt'?L.filter(o=>o.crypt&&o.house===this.ref):L.filter(o=>o.grave&&!o.plot&&RestSite.keyOf(o)===this.ref)}
  static keyOf(g){return g.who+':'+g.day+':'+Math.round(g.x)}
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
    if(this.kind==='plot')return '<p>The plot of the family of '+htmlText(Legacy.plot?.family||'your line')+', by '+htmlText(g?.at||'')+': '+ms.length+' of your line lie here, within its low wall.</p>';
    if(this.kind==='crypt'){const h=Houses.byId(this.ref);return '<p>The crypt of '+htmlText(h?.name||'a house')+', at '+htmlText(h?.seat||'its seat')+'. Their names are cut over its door: '+(h?h.dead.map(d=>htmlText(d.name)+' <span class="muted">(day '+d.day+', '+htmlText(d.how)+')</span>').join(', '):'')+'.</p>'}
    return g?'<p>'+g.words.line.replace('{at}',htmlText(g.at||''))+'here lies '+htmlText(g.who)+', who fell to '+htmlText(g.life?.by||'beasts')+'.</p>':''}
  page(){const ms=this.members(),acts=[];let body=this.about();
    if(this.kind!=='crypt')body+='<div class="lab">Here lie</div>'+ms.map(g=>'<p><b>'+htmlText(g.who)+'</b> <span class="muted">· '+g.words.label.toLowerCase()+' · fell on day '+g.day+(g.n>1?' · the '+ordinal(g.n)+' of your line':'')+' · level '+(g.life?.level||0)+'</span>'+
      (g.spent?' <span class="muted">· prayed at</span>':g.xp?' <span class="gold">· '+g.xp+' experience lingers</span>':'')+(g.empty()?'':' · with them: '+g.what())+'</p>').join('');
    ms.forEach((g,i)=>{if(g.grave&&!g.spent&&g.xp>0)acts.push({icon:'altar',label:'Pray for '+htmlText(g.who),act:'site-rest',arg:'pray:'+i,facts:[g.xp+' experience']});
      if(!g.empty())acts.push({icon:'gold',label:'Take what lies with '+htmlText(g.who),act:'site-rest',arg:'take:'+i,facts:[g.what()]});
      if(g.crypt)acts.push({icon:'altar',label:'Pay your respects',act:'site-rest',arg:'respect:'+i,why:g.paid===G.day?'Paid today':'',facts:['its living lords think the better of you']})});
    return {body,acts}}
  act(a,arg,done){if(a!=='site-rest')return false;const [k,n]=String(arg).split(':'),g=this.members()[+n];if(!g)return true;
    if(k==='pray'){G.site=null;g.pray();return true}
    if(k==='take'){const got=g.take();done(got?'From '+g.who+': '+got+'.':'Nothing you can carry.');return true}
    if(k==='respect'&&g.crypt){g.respect();done('You pay your respects.');return true}return true}
  // (the places for the graves: each made once, kept where its graves are; its name)
  static sync(){if(!W.sites)return;const want=[];
    if(Remains.list.some(o=>o.grave&&o.plot))want.push(['plot','plot']);
    for(const o of Remains.list){if(o.crypt)want.push(['crypt',o.house]);else if(o.grave&&!o.plot)want.push(['lone',RestSite.keyOf(o)])}
    for(const [kind,ref] of want){let s=W.sites.find(x=>x.type==='rest'&&x.kind===kind&&x.ref===ref);
      if(!s){s=siteOf({i:1+Math.max(0,...W.sites.map(x=>x.i||0)),type:'rest',kind,ref,seed:W.sites.length+1,seen:true,cleared:false,back:0,name:'',tx:0,ty:0,x:0,y:0});W.sites.push(s)}
      const ms=s.members();if(!ms.length)continue;s.x=Math.round(ms.reduce((a,g)=>a+g.x,0)/ms.length);s.y=Math.round(ms.reduce((a,g)=>a+g.y,0)/ms.length);s.tx=Math.floor(s.x/TILE);s.ty=Math.floor(s.y/TILE);
      s.name=kind==='plot'?'Rest of '+(Legacy.plot?.family?cap1(Legacy.plot.family):'your line'):kind==='crypt'?'Crypt of '+(Houses.byId(ref)?.name||'a house'):ms[0].name}
    W.sites=W.sites.filter(x=>x.type!=='rest'||x.members().length)}
}
SITE_CLASS.rest=RestSite;
