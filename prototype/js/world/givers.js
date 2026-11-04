'use strict';
/* ---------- a holding's givers (doc/QUESTS_DESIGN.md §4, Q2): the people who give work there, one for each row of GIVERS
   (data/quests.js) whose at fits it, in that order. Each is made from the holding itself (its people's names, its name hashed:
   no random draw), never saved; only their regard for you is (P.grel, by key: the holding's name and their trade; none: no
   field). A giver: {role, key, n (their trade), name, race, jobs, why, pays, town}.
   - of(t): its givers; for(t, type): the first who gives that kind;
   - regard(g), change(g, n): their regard for you, and a change of it (said in the log);
   - label(g): "Hob, the reeve of Millbrook";
   - goods(g, gold, t): what the share of a job's pay they make in goods is: [good, n] of the holding's stock, or null ---------- */
const Givers={
  fits(t,at){
    if(at.kind&&!at.kind.includes(t.kind))return false;
    if(at.estate&&!(bldLv(t,at.estate)>0))return false;
    return !(at.walls&&wallOf(t)<at.walls);
  },
  of(t){
    if(!t||!t.T)return [];
    const race=(t.races&&t.races[0])||'human',N=FOLK_NAMES[race]||FOLK_NAMES.human;
    return Object.entries(GIVERS).filter(([,G0])=>this.fits(t,G0.at)).map(([role,G0])=>{
      const h=folkHash(t.name+':'+role);
      return{role,key:t.name+':'+role,n:G0.n,name:N[h%N.length],race,jobs:G0.jobs,why:G0.why,pays:G0.pays,town:t.name};
    });
  },
  for(t,type){
    return this.of(t).find(g=>g.jobs.includes(type))||null;
  },
  byKey(key){
    const [town,role]=String(key||'').split(':'),t=townBy(town);
    return t&&this.of(t).find(g=>g.role===role)||null;
  },
  label(g){
    return g.name+', the '+g.n+' of '+g.town;
  },
  regard(g){
    return g&&P.grel?P.grel[g.key]||0:0;
  },
  change(g,n){
    if(!g||!n)return;
    (P.grel||(P.grel={}))[g.key]=this.regard(g)+n;
    log(g.name+' the '+g.n+(n>0?' thinks better of you.':' thinks less of you.'),n>0?'good':'bad','story');
  },
  goods(g,gold,t){
    if(!g||g.pays>=1||!t)return null;
    ensureEcon(t);
    const k=GIVER_PAY.find(x=>(t.stock[x]||0)>=1);
    if(!k)return null;
    const each=Math.max(1,marketPrice(t,k)),n=Math.min(Math.floor(t.stock[k]),Math.max(1,Math.round(gold*(1-g.pays)/each)));
    return n>0?[k,n]:null;
  },
};
