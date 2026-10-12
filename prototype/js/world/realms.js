'use strict';
/* ---------- factions and world sim ---------- */
const W={rel:{},lords:[],dead:{},sites:[],critters:[]};
// daily war chance per peaceful pair, scaled so more factions don't mean more wars overall
const FIDS=Object.keys(FACS),WAR_RATE=.05*3/(FIDS.length*(FIDS.length-1)/2),LCAP=18,FIEF0=Math.round(TOWNS.length/FIDS.length);
// holdings you take for yourself belong to 'player'. It is not one of FIDS: it never rolls wars, and it is at war with whoever is hostile to you.
FACS.player={n:'Free Banner',col:'#f0d060',d:'Your own banner and the holdings that fly it.',races:[],lords:[]};
const rk=(a,b)=>a<b?a+'|'+b:b+'|'+a;
const relOf=(a,b)=>W.rel[rk(a,b)]||{s:'peace',since:0};
const atWar=(a,b)=>!!a&&!!b&&a!==b&&(a==='player'?hostileTo(b):b==='player'?hostileTo(a):relOf(a,b).s==='war');
const enemiesOf=f=>FIDS.filter(g=>atWar(f,g));
const fiefsOf=f=>TOWNS.filter(t=>t.owner===f);
const facCol=t=>t.owner?FACS[t.owner].col:'#98a0ba';
const hostileTo=f=>!!f&&f!=='player'&&((!!P.fac&&atWar(P.fac,f))||(P.hostile[f]||0)>G.day);
const townBy=n=>TOWNS.find(t=>t.name===n);
const besieged=t=>W.lords.some(l=>!l.dead&&l.state==='siege'&&l.tgt===t.name)||!!(P.siege&&P.siege.town===t.name)||!!(P.raid&&P.raid.town===t.name);
const nearestOf=(o,list)=>{let b=null,bd=1e9;for(const t of list){const d=Math.hypot(t.x-o.x,t.y-o.y);if(d<bd){bd=d;b=t}}return b};
const lcap=f=>LCAP+4*Math.max(0,FIEF0-fiefsOf(f).length);
const cull=(l,frac)=>{l.troops=l.troops.filter(()=>Math.random()>frac)};
const facRaces=f=>{const rs=[...new Set(fiefsOf(f).flatMap(t=>t.races))];return rs.length?rs:FACS[f].races};
function armyOf(f,n){const rs=facRaces(f),a=[];for(let i=0;i<n;i++){const c=RACES[rs[rint(0,rs.length-1)]],r=Math.random();a.push(r<.35?c.melee:r<.58?UP[c.melee][0]:r<.76?c.ranged:r<.84?UP[c.ranged][0]:r<.91?c.mage:c.horse)}return a}
function garList(t){const a=[];for(let i=0;i<t.gar;i++){const c=RACES[t.races[i%t.races.length]];a.push(i%7===6?c.mage:i%3===2?c.ranged:i%2?UP[c.melee][0]:c.melee)}return a}
function initWorld(){
  TOWNS.forEach(t=>{t.owner=t.lastOwner=HOME[t.name];t.gar=GARCAP[t.kind];t.sacked=t.raided=t.turmoil=0;t.grow=GROW0;initEstates(t);initEconomy(t)});W.caravans=[];W.folk=[];W.refugees=[];W.treas={};W.tolls={};
  W.rel={};W.dead={};W.lords=[];W.monsters=[];W.mythic={};
  {const a=FIDS[rint(0,FIDS.length-1)],others=FIDS.filter(x=>x!==a),b=others[rint(0,others.length-1)];W.rel[rk(a,b)]={s:'war',since:1}}
  addMissingLords();
}
// every faction fields its listed lords; also fills in lords for factions an older save didn't have
function addMissingLords(){
  FIDS.forEach(f=>FACS[f].lords.forEach((n,i)=>{if(W.lords.some(l=>l.name===n)||W.dead[f])return;const own=fiefsOf(f);if(!own.length)return;const h=own[i%own.length];
    W.lords.push({id:f+i,name:n,fac:f,x:h.x+rint(-8,8),y:h.y+14,troops:armyOf(f,12),state:'rest',tgt:h.name,sd:0,cool:0,dead:false,gone:false,back:0})}));
}
function setRel(a,b,s,chain){
  const prev=relOf(a,b).s;W.rel[rk(a,b)]={s,since:G.day};
  const A='the '+FACS[a].n,Bn='the '+FACS[b].n,mine=P.fac===a||P.fac===b;
  const m=s==='war'?'War! '+A[0].toUpperCase()+A.slice(1)+' and '+Bn+' are at war.':s==='ally'?A[0].toUpperCase()+A.slice(1)+' and '+Bn+' form an alliance.':prev==='ally'?'The alliance between '+A+' and '+Bn+' ends.':A[0].toUpperCase()+A.slice(1)+' and '+Bn+' agree to a truce.';
  log(m,mine?(s==='war'?'bad':'good'):'gold');
  if(s==='war'&&!chain)FIDS.forEach(c=>{if(c!==a&&c!==b&&!W.dead[c]){if(relOf(c,a).s==='ally'&&relOf(c,b).s==='peace')setRel(c,b,'war',1);if(relOf(c,b).s==='ally'&&relOf(c,a).s==='peace')setRel(c,a,'war',1)}});
  W.lords.forEach(l=>{if(!l.dead&&(l.fac===a||l.fac===b)&&l.state!=='siege')lordThink(l)});
}
function lordThink(l){
  const own=fiefsOf(l.fac);if(!own.length){l.dead=true;l.gone=true;return}
  const foes=TOWNS.filter(t=>atWar(l.fac,t.owner)),hit=own.find(besieged);
  if(hit&&l.troops.length>=9){l.state='relieve';l.tgt=hit.name;return}
  if(l.troops.length<9||(!foes.length&&l.troops.length<lcap(l.fac)-4)){l.state='home';l.tgt=nearestOf(l,own).name;return}
  if(foes.length){l.state='march';l.tgt=nearestOf(l,foes).name;return}
  l.state='patrol';l.tgt=own[rint(0,own.length-1)].name;
}
// you beat a lord's army: a bounty from your employer, a broken siege, and honor with his enemies (from ON_WIN)
function lordWon(l,res){
  let txt='';
  if(P.fac&&atWar(P.fac,l.fac)){res.gold+=40;P.renown+=5;txt+=' Your employer adds a 40 gold bounty.'}
  if(l.state==='siege'){const st=townBy(l.tgt);if(st&&!hostileTo(st.owner)){addRep(st.name,10,true);if(st.owner!=='player')addHonor(st.owner,8,true);txt+=' You break the siege of '+st.name+'. Its people cheer you in.'}}
  questNotify('lord',l);defeatLord(l);log(l.name+' flees the field. The '+FACS[l.fac].n+' will remember this.');
  FIDS.filter(f=>atWar(f,l.fac)).forEach(f=>addHonor(f,5));addHonor(l.fac,-10);
  return txt;
}
function defeatLord(l){l.dead=true;l.troops=[];l.back=G.day+4;l.state='rest'}
function fallFaction(f){
  W.dead[f]=true;W.lords.forEach(l=>{if(l.fac===f){l.dead=true;l.gone=true}});FIDS.forEach(g=>{if(g!==f)delete W.rel[rk(f,g)]});
  log('The '+FACS[f].n+' has fallen. Its last holding is lost.','bad');
  if(P.fac===f){P.fac=null;log('Your contract ends with the fall of your employer.','bad')}
}
function resolveSiege(l,t){
  const mine=t.owner==='player',pa=power(l.troops)*(.8+Math.random()*.4),pd=power(garList(t))*(mine?2.2:1.8+.8*Math.max(0,FIEF0-fiefsOf(t.owner).length))*(1+.15*(wallOf(t)-WALL0[t.kind]))*(t.stock&&foodDays(t)<2?.6:1)*(.8+Math.random()*.4);
  if(pa>pd){
    const prev=t.owner;cull(l,clamp(.1+.5*(pd/pa)**2,.05,.6));t.owner=l.fac;t.gar=4;l.state='rest';
    // conquest leaves its mark: turmoil for a while, and sometimes the victors sack the place
    t.turmoil=G.day+8;breach(t);const sacked=Math.random()<.35;if(sacked){t.sacked=G.day+15;burnEstates(t,2);sackStock(t,.5,.25)}
    log(t.name+' falls to '+l.name+' of the '+FACS[l.fac].n+(sacked?', who sacks it':'')+'.'+(mine?' You have lost your fief.':''),l.fac===P.fac?'good':prev===P.fac||mine?'bad':'gold');
    W.lords.forEach(o=>{if(!o.dead&&o!==l&&o.tgt===t.name)lordThink(o)});
    if(!mine&&!fiefsOf(prev).length)fallFaction(prev);
  }else{cull(l,.55);t.gar=Math.max(2,Math.round(t.gar*.6));log('The siege of '+t.name+' fails. '+l.name+' falls back.');lordThink(l)}
}
function lordBattle(a,b){
  const pa=power(a.troops)*(.8+Math.random()*.4),pb=power(b.troops)*(.8+Math.random()*.4),w=pa>pb?a:b,lo=w===a?b:a,r=Math.min(pa,pb)/Math.max(pa,pb);
  cull(w,clamp(.1+.5*r*r,.05,.7));defeatLord(lo);if(w.state!=='siege')lordThink(w);
  log(w.name+' defeats '+lo.name+' near '+nearestOf(w,TOWNS).name+'.',w.fac===P.fac?'good':lo.fac===P.fac?'bad':'');
}
function worldDay(){
  for(let i=0;i<FIDS.length;i++)for(let j=i+1;j<FIDS.length;j++){
    const a=FIDS[i],b=FIDS[j];if(W.dead[a]||W.dead[b])continue;const r=relOf(a,b),age=G.day-r.since;
    if(r.s==='peace'&&age>=6&&Math.random()<WAR_RATE)setRel(a,b,'war');
    else if(r.s==='war'&&age>=8&&Math.random()<Math.min(.35,.04+(age-8)*.01+(Math.abs(fiefsOf(a).length-fiefsOf(b).length)>=2?.08:0)+(Math.min(fiefsOf(a).length,fiefsOf(b).length)<=1?.25:0)+(econWeary(a)||econWeary(b)?.12:0)))setRel(a,b,'peace');
    else if(r.s==='peace'&&FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.3)setRel(a,b,'ally');
    else if(r.s==='ally'&&!FIDS.some(c=>c!==a&&c!==b&&atWar(a,c)&&atWar(b,c))&&Math.random()<.2)setRel(a,b,'peace');
  }
  TOWNS.forEach(t=>{const cap=Math.round(GARCAP[t.kind]*(until(t,'sacked')?.5:1));if(t.owner&&t.owner!=='player'&&!besieged(t)&&t.gar<cap&&payRealm(t.owner,6,t,1))t.gar++});
  for(const l of W.lords){
    if(l.gone)continue;
    if(l.dead){
      if(G.day<l.back)continue;const own=fiefsOf(l.fac);if(!own.length){l.gone=true;continue}
      const h=own[rint(0,own.length-1)];if(!payRealm(l.fac,90,h,9))continue;Object.assign(l,{dead:false,x:h.x,y:h.y+14,troops:armyOf(l.fac,9),state:'rest',tgt:h.name,cool:3});
      log(l.name+' raises a new army at '+h.name+'.');continue;
    }
    const t=townBy(l.tgt);
    if(l.state==='siege'){if(!t||!atWar(l.fac,t.owner)){lordThink(l);continue}if(++l.sd>=2+wallOf(t))resolveSiege(l,t);continue}
    if(l.state==='rest'&&t&&t.owner===l.fac){
      for(let k=0,n=3+Math.max(0,FIEF0-fiefsOf(l.fac).length);k<n&&l.troops.length<lcap(l.fac)&&payRealm(l.fac,10,t,1);k++){const rs=facRaces(l.fac),c=RACES[rs[rint(0,rs.length-1)]];l.troops.push(Math.random()<.6?c.melee:c.ranged)}
      const i=l.troops.findIndex(x=>UP[x]);if(i>=0&&Math.random()<.7){const u=UP[l.troops[i]];l.troops[i]=u[rint(0,u.length-1)]}
    }
    if(l.state==='rest'||Math.random()<.35)lordThink(l);
  }
}
function updateLords(d){
  for(const l of W.lords){
    if(l.dead)continue;l.cool=Math.max(0,l.cool-d);
    const dx=P.x-l.x,dy=P.y-l.y,pd=Math.hypot(dx,dy),hostile=hostileTo(l.fac),mul=Math.max(.45,speedAt(l.x,l.y));
    const st=hostile?stance(rating(l.troops)):null,see=90*(hiddenAt(P.x,P.y)?.55:1);
    if(st==='afraid'&&l.state==='siege'&&pd<see){l.state='home';l.tgt=nearestOf(l,fiefsOf(l.fac)).name;log(l.name+' abandons the siege as your band approaches.','good')}
    const dread=W.lords.find(o=>!o.dead&&o!==l&&atWar(o.fac,l.fac)&&Math.hypot(o.x-l.x,o.y-l.y)<70&&rating(o.troops)>=rating(l.troops)*1.5);
    if(dread&&l.state==='march'&&fiefsOf(l.fac).length){l.state='home';l.tgt=nearestOf(l,fiefsOf(l.fac)).name}
    if(!(hostile&&l.cool<=0&&l.state!=='siege'&&stanceMove(l,st,pd,dx,dy,see,26*mul*d,true))){
      const t=townBy(l.tgt);if(!t){lordThink(l);continue}
      const tx=t.x+(l.state==='siege'?(l.id.endsWith('0')?-16:16):0),ty=t.y+12,dd=Math.hypot(tx-l.x,ty-l.y);
      if(dd>4)travelTo(l,t,tx,ty,26*mul*d);
      else if(l.state==='march'){
        if(atWar(l.fac,t.owner)){l.state='siege';l.sd=0;if(Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5||t.owner===P.fac||t.owner==='player')log(l.name+' of the '+FACS[l.fac].n+' lays siege to '+t.name+(t.owner==='player'?', your fief!':'.'),t.owner===P.fac||t.owner==='player'?'bad':'')}
        else lordThink(l);
      }else if(l.state==='home'||l.state==='patrol'||l.state==='relieve')l.state='rest';
    }
    if(hostile&&st==='attack'&&pd<10&&l.cool<=0&&G.encCool<=0&&!G.modal){startEncounter({kind:'lord',ref:l,list:l.troops.slice()});return true}
  }
  for(let i=0;i<W.lords.length;i++){const a=W.lords[i];if(a.dead)continue;
    for(let j=i+1;j<W.lords.length;j++){const b=W.lords[j];if(!b.dead&&atWar(a.fac,b.fac)&&Math.hypot(a.x-b.x,a.y-b.y)<20){lordBattle(a,b);if(a.dead)break}}}
  return false;
}
function lordMeet(l){
  if(hostileTo(l.fac))return cornered(l,'lord')?parley(l,'lord'):startEncounter({kind:'lord',ref:l,list:l.troops.slice()});
  G.enc={kind:'lord',ref:l};G.mode='dialog';P.tx=null;const f=FACS[l.fac];
  const st=P.fac===l.fac?'You serve the '+f.n+'.':P.fac?'Your employer is at '+(relOf(P.fac,l.fac).s==='ally'?'alliance':'peace')+' with them.':'They have no quarrel with you.';
  showPanel('<h2>'+l.name+'</h2><p class="muted">Lord of the <span style="color:'+f.col+'">'+f.n+'</span>, leading '+l.troops.length+' soldiers (power '+rating(l.troops)+' vs your '+partyPower()+').</p><p>'+st+'</p>'+
    lordJobHtml(l)+'<div class="btns">'+(P.fac===l.fac?'':'<button class="btn" type="button" data-act="lord-attack">Attack</button>')+'<button class="btn primary" type="button" data-act="lord-leave">Leave</button></div>'+
    (P.fac===l.fac?'':'<p class="muted">Attacking makes the '+f.n+' hostile to you for 20 days.</p>'));
}
