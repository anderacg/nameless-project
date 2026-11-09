'use strict';
/* ---------- a new life in the same world (doc/DEATH_DESIGN.md §6, phase 3; the owner, 2026-11-09: "Your loots dropped, you start as a
   new people in the same world"; "let companion have it, and companion will lead the band if their loyalty is high, they will
   keep up your legacy but no benefit for new character"). Slain (world/death.js Death.died), you pick a new person (page) and go on
   (reborn) in this world, at this date:
   - what the old hero leaves (handOut). Their heir, the most loyal companion (heirOf: at least DEATH.heir.ap, a tie to the higher
     level), takes it: your own holdings (owner 'player') as the crown of a realm of their own (found: a realm made in play, its
     FACS entry saved), or, you a realm's vassal, as one of its lords; your caravans' purses into their treasury. The companions
     content with them (DEATH.heir.follow) ride with them, "<heir>'s company" (raise: a lord, l.heir). With no heir (or none with a
     realm to lead), each holding goes to the realm nearest it, the caravans' purses to the realms they were bound for. Every
     companion not with the heir is free in their tavern again, as they were (kept: hired again with their levels and gear, their
     regard for you gone; Legacy.rejoin);
   - what resets: your hero (session.js resetPlayer: purse, army, prisoners, regard, honour, renown, quests, tree), the map you knew
     (the fog, the names, what you had heard), your stories (ended), the quests' marks on the world (their qid);
   - what stays: the world (its holdings, lords, wars, date), the chronicle, your remains and the man-eater that killed you.
   The heir's company ends with its lord, gone or dead: its companions free (hour). Saved: the realms made and the companions kept
   (the save piece legacy, loaded before the holdings and the lords that name its realms). Numbers: data/death.js DEATH.heir ---------- */
class Legacy{
  static realms={};static kept={};static raised=null;static fallen=0;static plot=null;static restN=0;static family='';static line=[];// (family: your line's name; line: each of it who fell, Legacy.record)// (fallen: how many of your line have died; plot: your family's, world/death.js Grave.inPlot)
  // the heir: the most loyal companion with you, at least DEATH.heir.ap, a tie to the higher level; null: none
  static heirOf(comps){return Object.keys(comps).filter(id=>(comps[id].ap||0)>=DEATH.heir.ap&&!comps[id].jail)
    .sort((a,b)=>(comps[b].ap-comps[a].ap)||((comps[b].lv||0)-(comps[a].lv||0)))[0]||null}
  // (the heirs' lords now, and whether a companion rides with one)
  static lords(){return W.lords.filter(l=>l.heir&&!l.dead&&!l.gone)}
  static serves(id){return this.lords().some(l=>l.heir.comps.includes(id))}
  // the old hero's things handed out (before your hero is made afresh); its lines for the log
  static handOut(){
    const comps=P.comps,own=TOWNS.filter(t=>t.owner==='player'&&!t.gone),served=P.fac&&FACS[P.fac]&&!W.dead[P.fac]?P.fac:null,cid=this.heirOf(comps),say=[];
    const fac=cid?served||(own.length?this.found(cid):null):null,lord=fac?this.raise(cid,fac,own):null;
    // (your holdings: the heir's realm, else the one you served, else the realm nearest each)
    for(const t of own){t.owner=fac||served||this.nextRealm(t)||null;Timed.of(t).set('turmoil',5)}
    if(own.length)say.push(own.map(t=>t.name).join(', ')+' '+(own.length>1?'go':'goes')+(fac?' to '+COMPS[cid].short+', under the '+FACS[fac].n:' to their neighbours')+'.');
    // (your caravans: their purses to the heir's realm, else the realm each was bound for; their goods to the holding)
    for(const c of W.caravans.filter(c=>c.mine)){const t=townBy(c.dest||c.to)||townBy(c.home),f=fac||t?.owner;if(f&&FACS[f])W.treas[f]=treas(f)+(c.purse||0);
      if(t){ensureEcon(t);for(const g in c.goods||{})t.stock[g]=(t.stock[g]||0)+c.goods[g]}}
    W.caravans=W.caravans.filter(c=>!c.mine);
    // (your companions, as they were: free, or riding with the heir until their company ends, Legacy.serves)
    for(const id in comps){const c={...comps[id]};for(const k of ['party','lost','jail','hurt','ap','role'])delete c[k];this.kept[id]=c}
    if(lord)say.push(COMPS[cid].n+' leads your company on'+(lord.heir.comps.length>1?', with '+lord.heir.comps.filter(x=>x!==cid).map(x=>COMPS[x].short).join(' and '):'')+'.');
    return say}
  // a realm of the heir's own: your banner's colour, their people, at war with whoever was at war with you
  static found(cid){let n=1;while(FACS['legacy'+n])n++;const id='legacy'+n,race=ST[cid]?.race||'human';
    const base=P.band||COMPS[cid].short+'’s Company',taken=n=>Object.values(FACS).some(f=>f.n===n);let nm=base;for(let k=2;taken(nm);k++)nm=base+' '+['II','III','IV','V','VI','VII','VIII','IX','X'][Math.min(8,k-2)]+(k>10?' ('+k+')':'');
    const def={n:nm,col:FACS.player.col,d:'The realm '+COMPS[cid].short+' keeps in the name of '+(heroName()||'a fallen hero')+'.',races:[race],lords:[COMPS[cid].n],gender:{}};
    this.realms[id]=def;this.install(id,def);for(const f of FIDS)if(f!==id&&realmOf('player').atWar(f))setRel(id,f,'war');return id}
  // (a realm made in play: in FACS for good, its name read wherever it is named; among the realms that act, FIDS, until it falls)
  static install(id,def){FACS[id]=def;if(!def.gone&&!FIDS.includes(id))FIDS.push(id)}
  // (one with no holding and no lord left: out of the realms that act, so many lives make no crowd of dead realms; its name kept)
  static prune(){for(const id in this.realms){const d=this.realms[id];if(d.gone||fiefsOf(id).length||W.lords.some(l=>l.fac===id&&!l.dead&&!l.gone))continue;
    d.gone=true;const i=FIDS.indexOf(id);if(i>=0)FIDS.splice(i,1);for(const k in W.rel)if(k.split('|').includes(id))delete W.rel[k];W.dead[id]=W.dead[id]||G.day}}
  // (the heir as a lord: at their realm's holding nearest you, with the companions content with them and the men of their party if
  // they led one, else a few)
  static raise(cid,fac,own){const c=P.comps[cid],h=own[0]||Spatial.nearest(fiefsOf(fac),P.x,P.y)||Spatial.nearestHolding(P.x,P.y);
    const comps=[cid,...Object.keys(P.comps).filter(id=>id!==cid&&(P.comps[id].ap||0)>=DEATH.heir.follow&&!P.comps[id].jail)];
    const l=asParty({id:'heir_'+cid+'_'+G.day,name:COMPS[cid].n,fac,x:h.x+rint(-8,8),y:h.y+14,troops:c.party?.troops?.slice()||armyOf(fac,DEATH.heir.men),state:'rest',tgt:h.name,sd:0,cool:0,dead:false,gone:false,back:0,lv:c.lv||0,heir:{cid,comps,of:heroName()||'a fallen hero'}});
    W.lords.push(l);this.raised=l;const L=this.line[this.line.length-1];if(L)L.heir=COMPS[cid].n;return l}
  // (a holding with no heir: to the realm whose holding is nearest it)
  static nextRealm(t){const o=Spatial.nearest(TOWNS.filter(x=>x!==t&&!x.gone&&x.owner&&x.owner!=='player'&&FACS[x.owner]&&!W.dead[x.owner]),t.x,t.y);return o?o.owner:null}
  // (a companion kept, hired again: as they were)
  static rejoin(id){const k=this.kept[id],c=P.comps[id];if(!k||!c)return;delete this.kept[id];Object.assign(c,k,{ap:c.ap||0})}
  // ---- the page: your new person (your race, your name, your past: its card goes on)
  static page(){const r=G.race||P.race||'human';G.race=r;G.mode='dialog';
    showPanel('<div class="top"><h2>A new life</h2><span class="muted">Day '+G.day+' · the same world</span></div>'+
      '<p class="muted">The world goes on: its holdings, lords and wars as they stand, and what '+htmlText(Death.slain?.who||'your hero')+' left behind. You begin again with nothing of theirs.</p>'+
      '<div class="lab">Your race</div><div class="tabs" role="group" aria-label="Race">'+Object.keys(RACES).map(k=>'<button class="btn sm'+(r===k?' on':'')+'" type="button" data-act="death-race" data-arg="'+k+'" aria-pressed="'+(r===k)+'">'+RACES[k].n+'</button>').join('')+'</div>'+
      '<div class="lab">Your name · or leave it for later</div>'+nameFields(NEW_NAMES)+
      '<div class="lab">Your family · the name your line goes by, on its graves and its plot</div><label class="nm-field"><span>Family</span><span class="nm-line"><input data-name="family" type="text" maxlength="'+NAMING.max+'" autocomplete="off" spellcheck="false" value="'+htmlText(NEW_NAMES.family??this.familyGuess())+'" placeholder="'+htmlText(this.familyGuess())+'"></span></label>'+
      '<div class="lab">Your past · it decides where you begin</div><div class="cards origin-cards">'+Object.keys(BGS).map(k=>{const B0=BGS[k],w=B0.weapon?BASES[B0.weapon]:null;
        return '<button class="card origin-card" type="button" data-act="death-past" data-arg="'+k+'">'+originArt(k)+'<strong>'+B0.n+'</strong><span class="gold">'+(w?w.n:'Bare hands')+'</span><span>'+B0.d+'</span></button>'}).join('')+'</div>'+
      nav(['death-slain',null,'Back'],null))}
  // ---- going on as someone new (k: your past)
  // (your family's name: as chosen, else your line's so far, else the first of it's own last name)
  static familyGuess(){if(this.family)return this.family;const w=String(this.line[0]?.who||Death.slain?.who||P.name||'').trim().split(/\s+/);return cap1(w.length>1&&w[0]?w[w.length-1]:w[0]||'Wanderer')}
  // (one of your line fallen: their life, for your family's tree (ui/family.js))
  static record(s){this.line.push({n:s.n,who:s.who,race:s.race,bg:s.bg,born:s.born,day:s.day,days:s.days,level:s.level,renown:s.renown,earned:s.earned,by:s.by,near:s.near,family:this.family||''})}
  static reborn(k){const b=BGS[k],old=Death.slain;if(!b||!old)return false;
    {const f=cleanName(NEW_NAMES.family??'');this.family=f||this.family||this.familyGuess();NEW_NAMES.family=undefined;const L=this.line[this.line.length-1];if(L&&!L.family)L.family=this.family}
    this.raised=null;const said=this.handOut(),qs=P.quests.length;
    // (your remains buried: a grave at your heir's holding, else a cairn where you fell: world/death.js Grave)
    Grave.bury(old,this.raised);said.push('Their body lies where they fell'+(this.raised?': '+COMPS[this.raised.heir.cid].short+' will come for it.':', for whoever finds it.'));
    // (the quests' marks on the world gone with them; your stories ended)
    const ids=new Set(P.quests.map(q=>q.id));for(const o of [...W.monsters,...bandits,...W.sites,...W.lords])if(o&&o.qid!=null&&ids.has(o.qid))delete o.qid;
    for(const th of Thread.list().on.slice())th.end('left');
    gameSession.resetPlayer();Captivity.held=null;Captivity.scattered=[];Death.slain=null;Death.pending=null;
    heroFrom(k,b);P.born=G.day;
    fogReset();Discovery.reset();KNOWLEDGE.reset();for(const s of W.sites)s.seen=false;
    const {home}=heroHome(k,b);hidePanel();
    log(cap1(old.who)+' is dead. '+[...said,qs?'Those who gave them work hear of it: '+qs+' quest'+(qs>1?'s':'')+' left undone.':''].filter(Boolean).join(' '),'bad','story');
    log((P.name?htmlText(P.name):'You')+' set'+(P.name?'s':'')+' out from '+home.name+', a '+RACES[P.race].n.toLowerCase()+' '+b.n.toLowerCase()+', with nothing of theirs.','gold','story');
    worldEmit('hero:reborn',{old});updateHint();updateHUD(true);return true}
  static act(a,arg){if(!Death.slain)return;// (a new life only for the dead)
    if(a==='death-new')return this.page();
    if(a==='death-slain')return Death.open();
    if(a==='death-race'&&RACES[arg]){G.race=arg;return this.page()}
    if(a==='death-past')return this.reborn(arg)}
  // each hour: a company whose lord is gone breaks up, its companions free
  static hour(){this.prune();for(const l of W.lords){const h=l.heir;if(!h||h.ended||!(l.dead||l.gone))continue;h.ended=true;
    worldEvent({text:cap1(l.name)+'’s company breaks up: '+h.comps.map(id=>COMPS[id].short).join(', ')+' go their own ways.',x:l.x,y:l.y,fac:[l.fac],post:false,kind:''})}}
  static save(){return Object.keys(this.realms).length||Object.keys(this.kept).length||this.fallen||this.restN?{realms:this.realms,kept:this.kept,fallen:this.fallen,plot:this.plot,restN:this.restN,family:this.family,line:this.line}:undefined}
  static load(v){this.clear();for(const id in v?.realms||{}){this.realms[id]=v.realms[id];this.install(id,v.realms[id])}this.kept=v?.kept||{};this.fallen=v?.fallen||0;this.plot=v?.plot||null;this.restN=v?.restN||0;this.family=v?.family||'';this.line=v?.line||[]}
  static clear(){for(const id in this.realms){delete FACS[id];const i=FIDS.indexOf(id);if(i>=0)FIDS.splice(i,1);REALMS.delete(id)}this.realms={};this.kept={};this.fallen=0;this.plot=null;this.restN=0;this.family='';this.line=[]}
}
onWorld(()=>Legacy.clear());
Systems.add({name:'heirs',order:{hour:166},hour:()=>Legacy.hour()});
// (order 25: before the holdings and the lords that name its realms; left out of a save with none)
Saves.add({key:'legacy',order:25,defaults:null,save:()=>Legacy.save(),load:v=>Legacy.load(v)});
