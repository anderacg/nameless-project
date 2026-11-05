'use strict';
// The humble start (doc/START_AND_GATES_DESIGN.md §1; the owner, 2026-11-05: "start from nothing: you spawn in a small hamlet far
// away", every past with its reason; a Nobody in a natural hamlet): each past begins in a hamlet or a small village of its row
// (PAST_START: whose, which kinds, far from the capitals), fair (HUMBLE_START: no bandit camp or hideout close, no wild land close,
// a realm's holding a road away), with its own first line naming the place; the place known as yours (P.home, its reputation, a
// bed for nothing), the next holding known; one game's number starts alike. Off (the harness's default), your people's capital
// as before. On the classic seed and on Normal s1.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,X=t.HUMBLE_START,ROWS=t.PAST_START,on0=X.on;
 try{
  // ---- off: as before, your people's capital
  {X.on=false;t.begin('soldier');const cap=t.capitalOf(P.race);ok(P.home===cap.name&&Math.hypot(P.x-cap.x,P.y-cap.y)<6*t.TILE,'off: you begin at your people’s capital, as before ('+P.home+')')}
  X.on=true;
  for(const [wname,S] of [['classic',undefined],['Normal s1',{preset:'normal',seed:'s1'}]]){
   const seen=[];
   for(const k of Object.keys(t.BGS)){
    t.begin(k,S);G.quietEvents=true;const row=ROWS[k],h=t.townBy(P.home),line=(G.msgs[0]&&G.msgs[0].m||'')+'';
    if(!h){ok(false,wname+' '+k+': no home ('+P.home+')');continue}
    const kindOk=row.kinds.includes(h.kind)||['hamlet','village'].includes(h.kind),whoOk=row.at==='free'?!h.owner:row.at==='realm'?!!h.owner:true;
    const caps=t.StartPlace.capitals(),far=Math.min(...caps.filter(c=>t.Router.reach(h,c)).map(c=>t.Router.days(h,c)));
    const camps=t.CAMP_SPOTS.every(c=>Math.hypot(c.tx-h.tx,c.ty-h.ty)>=X.camp),hides=t.W.sites.every(s=>!(s instanceof t.Hideout)||Math.hypot(s.tx-h.tx,s.ty-h.ty)>=X.camp);
    const atGate=Math.hypot(P.x-h.x,P.y-h.y)<6*t.TILE,rep=(P.rep[h.name]||0)>=X.rep,bed=t.stayFree(h);
    seen.push(k+' '+h.name+' ('+h.kind+(h.owner?' of the '+t.FACS[h.owner].n:', free')+', '+far.toFixed(1)+' days from a capital)');
    ok(kindOk&&atGate&&rep&&bed&&camps&&hides&&far>=X.off-.01,wname+' '+k+': begins at '+h.name+', a '+h.kind+(whoOk?'':' (its row’s place found none: a fallback)')+', '+far.toFixed(1)+' days from the nearest capital, no bandit camp or hideout within '+X.camp+' tiles; known there (reputation '+(P.rep[h.name]||0)+'), a bed for nothing');
    ok(/\S/.test(line)&&line.includes(h.name),wname+' '+k+': its own first line names it: “'+line.replace(/<[^>]+>/g,'').slice(0,120)+'”');
    if(k==='nobody')ok(h.kind==='hamlet'&&!h.owner,wname+': a Nobody wakes in a natural hamlet, the free folk’s ('+h.name+')');
   }
   info(wname+': '+seen.join('; '));
  }
  // ---- two games: the Nobody's place by each game's own draw ('origin' stream), always a natural hamlet
  {const A=[];for(let i=0;i<3;i++){t.begin('nobody');A.push(P.home)}ok(A.every(n=>{const h=t.townBy(n);return h&&h.kind==='hamlet'&&!h.owner}),'three new games as a Nobody: a natural hamlet each time ('+A.join(', ')+')')}
 }finally{X.on=on0}
});
