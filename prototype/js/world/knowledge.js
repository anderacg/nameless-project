'use strict';
/* ---------- people and realms you know: discoveries kept for good, whereabouts only as last seen or heard ----------
   Recording news is never learning it. hear reads only words actually told to you; news, riders and intelligence give dated
   reports, and watch remembers sightings. An older report cannot replace a newer sighting. Known holdings keep their last
   owner until seen again or a proclamation tells you of their capture. The save piece known defaults empty ---------- */
class JournalKnowledge{
  constructor(){this.reset()}
  reset(){this.lords={};this.realms=[];this.holdings={}}
  knowsLord(l){return Object.hasOwn(this.lords,l.id)}
  knowsRealm(f){return this.realms.includes(f)}
  realm(f){if(FIDS.includes(f)&&!this.knowsRealm(f))this.realms.push(f)}
  lord(l){if(!l)return;this.realm(l.fac);if(!this.knowsLord(l))this.lords[l.id]=null}
  holding(t,fac=t.owner,at=G.day){
    if(!t)return;this.realm(fac);const old=this.holdings[t.name];
    if(!old||at>=old.day)this.holdings[t.name]={fac,day:at};
  }
  report(l,text,at=G.day,seen=false){
    this.lord(l);const old=this.lords[l.id];
    if(old&&(old.at>at||old.at===at&&old.seen&&!seen))return;
    this.lords[l.id]={text,at,day:G.day,...(seen?{seen:true}:{})};
  }
  // Whole names in the words spoken (HTML formatting removed); never the unspoken facts of an item or its source.
  hear(html,report=false,at=G.day,precise=false){
    const el=document.createElement('div');el.innerHTML=String(html);const text=el.textContent.replace(/\s+/g,' ').trim();
    const has=n=>{let i=-1;while((i=text.indexOf(n,i+1))!==-1)if(!/[\p{L}\p{N}_]/u.test(text[i-1]||' ')&&!/[\p{L}\p{N}_]/u.test(text[i+n.length]||' '))return true;return false};
    for(const f of FIDS)if(has(FACS[f].n))this.realm(f);
    for(const l of W.lords)if(has(l.name)){this.lord(l);if(report)this.report(l,text,at,precise)}
  }
  news(it,text){
    this.hear(text,true,it.day);const d=it.detail||{};
    if(it.k==='fell'&&FACS[d.fac]){const t=townBy(d.town);if(t)this.holding(t,d.fac,it.day)}
  }
  sight(l){
    const home=l.inside&&townBy(l.inside),near=Spatial.nearestHolding(l.x,l.y,t=>Object.hasOwn(this.holdings,t.name));
    this.report(l,(home?'In '+home.name:'In the field'+(near&&Math.hypot(l.x-near.x,l.y-near.y)<vis()*2?' near '+near.name:''))+' · '+l.troops.length+' soldiers',G.day,true);
  }
  watch(){
    this.realm(P.fac);if(G.lastTown&&!this.holdings[G.lastTown.name])this.holding(G.lastTown);
    const here=(['town','scene'].includes(G.mode)||G.mode==='journal'&&G.overBack==='scene')&&G.town&&G.town.ref;
    for(const t of TOWNS)if(!t.gone&&(t.owner==='player'||t===here||inSight(t.x,t.y)||!this.holdings[t.name]&&seenTile(t.tx,t.ty)))this.holding(t);
    const V=vis();for(const l of W.lords)if(!l.dead&&!l.gone&&(l.inside?here&&l.inside===here.name:spotted(l,V)))this.sight(l);
  }
  save(){if(Object.keys(this.lords).length||this.realms.length||Object.keys(this.holdings).length)return {lords:this.lords,realms:this.realms,holdings:this.holdings}}
  load(v){this.lords=v.lords;this.realms=v.realms;this.holdings=v.holdings}
}
const KNOWLEDGE=new JournalKnowledge();
onWorld(()=>KNOWLEDGE.reset());
Saves.add({key:'known',order:310,defaults:{lords:{},realms:[],holdings:{}},save:()=>KNOWLEDGE.save(),load:v=>KNOWLEDGE.load(v)});
