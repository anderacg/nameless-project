'use strict';
/* ---------- fights: battles between parties on the map, which take time and can be joined ---------- */
// W.fights: {id, x, y, sides:[[uid…],[uid…]], t, dur, acc:[a,b]}. When parties clash (lords, patrols, bandit bands, caravans)
// they stop where they are and fight it out over a while: dur grows with every fighter in it, so a skirmish of a few is
// over quickly and a clash of armies grinds on. Each moment each side loses fighters at a rate set by the other's share of
// the strength, so the stronger side wins more and more easily; a side that falls far behind breaks and is routed.
// Lords and patrols nearby ride in on the side of their friends against their enemies. You can join either side: then
// the fight becomes your battle, everyone in it fighting beside you or against you.
const uidOf=o=>o.uid||(o.uid='u'+(W.uidN=(W.uidN||0)+1));
// every party that can fight on the map, by uid
function partyBy(u){return cparties().find(o=>o.uid===u)||W.lords.find(o=>o.uid===u&&!o.dead)||bandits.find(o=>o.uid===u)||(W.patrols||[]).find(o=>o.uid===u&&!o.gone)||(W.caravans||[]).find(o=>o.uid===u&&!o.gone)||null}
const partyKind=o=>o&&o.cid?'cparty':W.lords.includes(o)?'lord':bandits.includes(o)?'band':(W.patrols||[]).includes(o)?'patrol':'caravan';
// the fighters of a party (a caravan's are its guards: CaravanParty)
function troopsOf(o){const k=partyKind(o);return k==='lord'||k==='cparty'?o.troops:k==='band'?o.list:k==='patrol'?o.troops:asParty(o).troops}
const partyName=o=>{const k=partyKind(o);return k==='cparty'?COMPS[o.cid].short+'’s party':k==='lord'?o.name:k==='band'?BANDS[o.kind||'bandits'][0].replace(' ahead',''):k==='patrol'?'Guards of '+o.home:'Caravan of '+o.from};
const partyFac=o=>partyKind(o)==='band'?null:partyKind(o)==='cparty'?'player':o.fac;
const fightOf=o=>o&&o.fight?(W.fights||[]).find(f=>f.id===o.fight):null;
// is a party busy fighting? (a stale mark, from a fight that is gone, is cleared)
const inFight=o=>{if(!o.fight)return false;if(fightOf(o))return true;o.fight=null;return false};
const sideParties=(f,s)=>f.sides[s].map(partyBy).filter(Boolean);
const sideTroops=(f,s)=>sideParties(f,s).flatMap(troopsOf);

// two groups of parties clash; one already fighting pulls the others into its fight
function startFight(A,B){
  W.fights=W.fights||[];const all=[...A,...B],old=all.map(fightOf).find(Boolean);
  if(old){const anchor=all.find(o=>fightOf(o)===old),as=old.sides[0].includes(uidOf(anchor))?0:1,sa=A.includes(anchor)?as:1-as;
    for(const o of A)if(!o.fight)joinFight(old,o,sa);for(const o of B)if(!o.fight)joinFight(old,o,1-sa);return old}
  const x=all.reduce((s,o)=>s+o.x,0)/all.length,y=all.reduce((s,o)=>s+o.y,0)/all.length,n=all.reduce((s,o)=>s+troopsOf(o).length,0);
  const f={id:'f'+(W.fightN=(W.fightN||0)+1),x,y,sides:[A.map(uidOf),B.map(uidOf)],t:0,n0:n,dur:FIGHT.base+FIGHT.per*n,acc:[0,0]};
  all.forEach(o=>{o.fight=f.id});W.fights.push(f);fightPlace(f);
  if(Math.hypot(x-P.x,y-P.y)<vis()*1.5||all.some(o=>partyFac(o)===P.fac||o.mine))log('Battle near '+nearestOf(f,TOWNS).name+': '+A.map(partyName).join(', ')+' against '+B.map(partyName).join(', ')+'.',all.some(o=>o.mine)?'bad':'');
  return f;
}
function joinFight(f,o,s){if(o.fight)return;f.sides[s].push(uidOf(o));o.fight=f.id;const k=troopsOf(o).length;f.n0=(f.n0||0)+k;f.dur+=FIGHT.per*k;fightPlace(f)}
// the two lines face each other across the fight
function fightPlace(f){for(const s of [0,1])sideParties(f,s).forEach((o,i)=>{o.x=f.x+(s?14:-14)+(s?1:-1)*(i>>1)*10;o.y=f.y+(i%2?8:-4)+(i>>1)*3;o.dir=s?-1:1})}
// whose side a party would take: its realm's and allies', against its enemies; bands stick together; lawful men fight bands
function sideFor(f,o){
  const fac=partyFac(o),lord=partyKind(o)==='lord',score=s=>sideParties(f,s).reduce((a,p)=>{if(lord&&partyKind(p)==='lord'){const r=lordRel(o,p);if(r<=RELATION.rival)return a-3}const pf=partyFac(p);if(!fac)return a+(pf?-1:1);if(!pf)return a-1;return a+(pf===fac||relOf(pf,fac).s==='ally'?2:atWar(pf,fac)?-2:0)},0);
  const a=score(0),b=score(1);return a>0&&b<0?0:b>0&&a<0?1:-1;
}
// a party out of the fight: routed and gone, its goods to the winners if it was a caravan
function routParty(o,winners){
  const k=partyKind(o),near=Math.hypot(o.x-P.x,o.y-P.y)<vis()*1.5;o.fight=null;
  if(k==='cparty'){const c=P.comps[o.cid];if(c){c.party=null;c.hurt=G.day+3;log(COMPS[o.cid].short+'’s party is broken. '+COMPS[o.cid].short+' limps back to you, wounded for 3 days.','bad')}return}
  if(k==='lord'){defeatLord(o);if(near||o.fac===P.fac)log(o.name+' is routed near '+nearestOf(o,TOWNS).name+'.',o.fac===P.fac?'bad':'')}
  else if(k==='band'){bandits=bandits.filter(x=>x!==o);chiefEscapes(o.ld)}// (its chieftain gets away)
  else if(k==='patrol')patrolBeaten(o);
  else{o.gone=true;W.caravans=W.caravans.filter(x=>x!==o);const lord=winners.find(w=>partyKind(w)==='lord'),band=winners.find(w=>partyKind(w)==='band');
    if(lord){const home=nearestOf(lord,fiefsOf(lord.fac));if(home){ensureEcon(home);for(const g in o.goods)home.stock[g]=(home.stock[g]||0)+o.goods[g]}}
    else if(band)partyAdd(band,'militia')// (it arms one more with the plunder)
    if(o.mine||o.fac===P.fac||near)log((lord?lord.name+' seizes':band?'Bandits plunder':'The enemy takes')+' a caravan of '+o.from+(o.mine?', one of yours':'')+'.',o.mine||o.fac===P.fac?'bad':'')}
}
// a party that came through: free to go on its way
function freeParty(o){o.fight=null;o.cool=3;const k=partyKind(o);if(k==='band'){o.n=o.list.length;o.pw=0}if(k==='caravan'&&!o.guards)o.guards=1;if(k==='lord'&&o.state!=='siege')lordThink(o)}
function endFight(f,win){
  const W0=sideParties(f,win),L=sideParties(f,1-win),lw=W0.filter(o=>partyKind(o)==='lord'),ll=L.filter(o=>partyKind(o)==='lord');
  {const foes=L.reduce((a,o)=>a+troopsOf(o).length,0)+Math.round((f.n0||0)/3);lw.forEach(o=>lordWins(o,foes));W0.filter(o=>partyKind(o)==='band').forEach(o=>chiefWins(o,foes));W0.filter(o=>o.cid).forEach(o=>{compXp(o.cid,12+2*foes);compTrain(o.cid,'lead',3)})}
  lw.forEach((a,i)=>lw.slice(i+1).forEach(b=>changeLordRel(a,b,RELATION.together)));ll.forEach(a=>lw.forEach(b=>changeLordRel(a,b,RELATION.beaten)));
  L.forEach(o=>routParty(o,W0));W0.forEach(freeParty);
  W.fights=W.fights.filter(x=>x!==f);
  if(Math.hypot(f.x-P.x,f.y-P.y)<vis()*1.5&&W0.length&&L.length)log(W0.map(partyName).join(' and ')+' win'+(W0.length>1?'':'s')+' the battle near '+nearestOf(f,TOWNS).name+'.');
}
function updateFights(d){
  W.fights=W.fights||[];
  for(const f of [...W.fights]){
    // gone from the field (beaten elsewhere, arrived, dead): out of the fight
    for(const s of [0,1])f.sides[s]=f.sides[s].filter(u=>{const o=partyBy(u);return o&&o.fight===f.id&&troopsOf(o).length});
    if(!f.sides[0].length||!f.sides[1].length){const win=f.sides[0].length?0:1;sideParties(f,win).forEach(freeParty);W.fights=W.fights.filter(x=>x!==f);continue}
    // lords and patrols nearby ride in
    for(const o of [...W.lords.filter(l=>!l.dead&&!l.inside&&!l.fight),...(W.patrols||[]).filter(p=>!p.fight)])
      if(Math.hypot(o.x-f.x,o.y-f.y)<FIGHT.join){const s=sideFor(f,o);if(s>=0){joinFight(f,o,s);if(Math.hypot(f.x-P.x,f.y-P.y)<vis()*1.5)log(partyName(o)+' rides into the battle near '+nearestOf(f,TOWNS).name+'.')}}
    // each side wears the other down by its share of the strength; the whole fight takes about dur
    // the pace is set by how many started (and joined): an even fight takes about dur, a lopsided one less
    const pw=[0,1].map(s=>power(sideTroops(f,s))*lordTac(sideParties(f,s))),rate=(f.n0||sideTroops(f,0).length+sideTroops(f,1).length)/Math.max(1,f.dur);
    for(const s of [0,1]){f.acc[s]+=d*rate*pw[1-s]/Math.max(1,pw[0]+pw[1]);
      while(f.acc[s]>=1){f.acc[s]--;const ps=sideParties(f,s).filter(o=>troopsOf(o).length);if(!ps.length)break;let r=Math.random()*ps.reduce((a,o)=>a+troopsOf(o).length,0),o=ps[0];for(const p of ps){r-=troopsOf(p).length;if(r<=0){o=p;break}}
        // a lord's Medicine: some of his fallen live
        if(partyKind(o)==='lord'){lordTrain(o,'med',2);if(Math.random()<.07*lordSkill(o,'med'))continue}
        partyRemoveAny(o,1);if(!troopsOf(o).length)routParty(o,sideParties(f,1-s))}}
    f.t+=d;const p0=power(sideTroops(f,0)),p1=power(sideTroops(f,1));
    if(!p0||p0<FIGHT.rout*p1)endFight(f,1);else if(!p1||p1<FIGHT.rout*p0)endFight(f,0);
  }
}

/* you and a fight */
function fightMeet(f){
  G.fg=f;G.mode='dialog';P.tx=null;G.chase=null;const where=nearestOf(f,TOWNS).name;
  const side=s=>{const ps=sideParties(f,s),tr=sideTroops(f,s);return '<div class="row"><div class="info"><strong>'+ps.map(o=>{const fc=partyFac(o);return '<span'+(fc?' style="color:'+(fc==='player'?FACS.player.col:FACS[fc].col)+'"':'')+'>'+partyName(o)+' ('+troopsOf(o).length+')</span>'}).join(', ')+'</strong><small>'+tr.length+' fighters · power '+rating(tr)+'</small></div><div class="acts">'+dlgBtn('fg-join',s,'Join them',joinWhy(f,s))+'</div></div>'};
  const p0=power(sideTroops(f,0)),p1=power(sideTroops(f,1)),share=Math.round(p0/Math.max(1,p0+p1)*100);
  showPanel('<h2>Battle near '+where+'</h2><p class="muted">The fight has gone on a while ('+Math.round(f.t/Math.max(.1,f.dur)*100)+'% of its likely length). Your power: '+partyPower()+'.</p>'+side(0)+
    '<div style="height:8px;background:#7e2a26;border:1px solid var(--line)"><div style="height:100%;width:'+share+'%;background:#3d74d6"></div></div>'+side(1)+
    '<p class="muted">Joining a side means fighting its enemies, beside everyone on your side; realms you fight against turn hostile for 20 days.</p>'+nav(null,['dlg-close',null,'Watch from afar']));
}
// why you can't join a side: your employer fights on the other one, or it is a side of bandits
function joinWhy(f,s){const other=sideParties(f,1-s),mine=sideParties(f,s);if(P.fac&&other.some(o=>partyFac(o)===P.fac))return 'Your employer is on the other side';if(other.some(o=>partyFac(o)==='player'))return 'Your own people are on the other side';if(mine.some(o=>partyKind(o)==='band'))return 'They are bandits';return ''}
// the parties of a side as battle forces: lords as they are; the rest wrapped with their fighters, name and realm
function forceOf(o){const k=partyKind(o);if(k==='lord')return o;if(o instanceof Party)partyRoster(o).groups;return{kind:k,src:o,name:partyName(o),fac:partyFac(o),troops:troopsOf(o).slice(),army:o.army?structuredClone(o.army):undefined}}
// after your battle: write the forces' fighters back to their parties
function syncForces(list){for(const f of list||[]){if(!f.src)continue;const o=f.src;if(f.kind==='band'){o.list=f.troops;o.n=o.list.length;o.pw=0}else if(f.kind==='patrol'||f.kind==='caravan')o.troops=f.troops;else if(f.kind==='garrison')o.gar=f.troops.length;else if(f.kind==='cparty')o.troops=f.troops;if(f.army)o.army=structuredClone(f.army)}}
// a holding's garrison as a battle force: it sallies beside whoever fights its besiegers, or beside the army come to relieve it
const garrisonForce=t=>({kind:'garrison',src:t,name:'the garrison of '+t.name,fac:t.owner,troops:garList(t)});
// a force you beat (or that fought beside you and was ground down)
function routForce(f,mine){if(!f.src){defeatLord(f);return ''}if(f.kind==='garrison')return '';const o=f.src;if(f.kind==='caravan'&&mine){const t=caravanLoot(o);o.gone=true;return t}routParty(o,[]);return ''}
function fightAct(a,arg){
  const f=G.fg;if(!f||!W.fights.includes(f)){closeDialog();return}
  if(a==='fg-join'){const s=+arg;if(joinWhy(f,s))return;
    for(const o of sideParties(f,1-s)){const fc=partyFac(o);if(fc&&fc!=='player'&&!hostileTo(fc)){P.hostile[fc]=Math.max(P.hostile[fc]||0,G.day+20);addHonor(fc,-10,true);log('The '+FACS[fc].n+' turns hostile to you.','bad')}}
    G.fg=null;startEncounter({kind:'field',ref:f,side:s,list:[],allies:sideParties(f,s).map(forceOf),foes:sideParties(f,1-s).map(forceOf),title:'Battle near '+nearestOf(f,TOWNS).name})}
}
onAct('fg-',fightAct);
// you won the battle: the fight is over, your side goes on its way
function fieldWon(e){const f=e.ref;sideParties(f,e.side).forEach(freeParty);sideParties(f,1-e.side).forEach(o=>routParty(o,[]));W.fights=W.fights.filter(x=>x!==f);return ''}

/* on the map: dust, steel and a tally over each fight */
function drawFights(ents,cam,V){
  for(const f of W.fights||[]){if(Math.hypot(f.x-P.x,f.y-P.y)>V*1.2)continue;
    ents.push({y:f.y+20,f:()=>{const sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y),t=performance.now();
      for(let i=0;i<6;i++){const a=t/300+i*1.05,r=10+4*Math.sin(t/200+i);ctx.fillStyle='rgba(200,184,150,'+(.25+.15*Math.sin(t/150+i)).toFixed(2)+')';ctx.fillRect(Math.round(sx+Math.cos(a)*r)-2,Math.round(sy+Math.sin(a)*r*.5)-1,4,3)}
      if(Math.floor(t/120)%3===0){ctx.fillStyle='#fff8d0';ctx.fillRect(sx+rint(-8,8),sy-rint(4,14),2,2)}
      ctx.strokeStyle='#e4e0cf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-4,sy-22);ctx.lineTo(sx+4,sy-14);ctx.moveTo(sx+4,sy-22);ctx.lineTo(sx-4,sy-14);ctx.stroke();
      // the tally: each side's fighters in its colours
      const col=s=>{const p=sideParties(f,s)[0],fc=p&&partyFac(p);return fc?(fc==='player'?FACS.player.col:FACS[fc].col):'#ff9a90'};
      txt(String(sideTroops(f,0).length),sx-6,sy-26,col(0),'right');txt('vs',sx,sy-26,'#e4e0cf','center');txt(String(sideTroops(f,1).length),sx+6,sy-26,col(1),'left')}})}
}
