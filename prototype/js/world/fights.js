'use strict';
/* ---------- fights: battles between parties on the map, which take time and can be joined ---------- */
// W.fights: Fight {id, x, y, sides:[[uid…],[uid…]], t, dur, acc:[a,b]} (a world object, below; saved as its plain fields).
// When parties clash (lords, patrols, bandit bands, caravans; beasts with bands and with the land's defenders: defence.js)
// they stop where they are and fight it out over a while: dur grows with every fighter in it, so a skirmish of a few is over
// quickly and a clash of armies grinds on. Each moment each
// side loses fighters at a rate set by the other's share of the strength, so the stronger side wins more and more easily; a
// side that falls far behind breaks and is routed.
// Lords and patrols nearby ride in on the side of their friends against their enemies. You can join either side: then
// the fight becomes your battle, everyone in it fighting beside you or against you.
const uidOf=o=>o.uid||(o.uid='u'+(++W.uidN));
// every party that can fight on the map, by uid (a beast too: monsters.js)
function partyBy(u){return cparties().find(o=>o.uid===u)||W.lords.find(o=>o.uid===u&&!o.dead)||bandits.find(o=>o.uid===u)||W.patrols.find(o=>o.uid===u&&!o.gone)||W.caravans.find(o=>o.uid===u&&!o.gone)||asMonster(W.monsters.find(o=>o.uid===u))||null}
// (each says for itself what it is, mapKind; its name, label(); its realm, faction; its fighters, troops: a caravan's are its
// guards, CaravanParty: parties.js; how strong it is, power(), and in a fight here, fightPower(): its fighters, at its level for
// a beast; and how it takes a blow there, takeLoss: a party loses one fighter, a beast is wounded and loses one of its pack when
// its wounds come to one beast's strength)
const fightOf=o=>o&&o.fight?W.fights.find(f=>f.id===o.fight):null;
// is a party busy fighting? (a stale mark, from a fight that is gone, is cleared)
const inFight=o=>{if(!o.fight)return false;if(fightOf(o))return true;o.fight=null;return false};
const sideParties=(f,s)=>(f.sides[s]||[]).map(partyBy).filter(Boolean);
const fightParties=f=>f.sides.flatMap((_,s)=>sideParties(f,s));
const fightOpponents=(f,s)=>f.sides.flatMap((_,i)=>i===s?[]:sideParties(f,i)).filter(o=>!f.multi||sideParties(f,s).some(a=>fightHostile(f,a,o)));
const sideTroops=(f,s)=>sideParties(f,s).flatMap(o=>o.troops);
const sidePower=(f,s)=>sideParties(f,s).reduce((a,o)=>a+o.fightPower(),0);

// two groups of parties clash; one already fighting pulls the others into its fight
function startFight(A,B){
  A=[...new Set(A)].slice(0,BATTLE_JOIN.armies-1);B=[...new Set(B)].filter(o=>!A.includes(o)).slice(0,BATTLE_JOIN.armies-A.length);if(!A.length||!B.length)return null;
  const all=[...A,...B],old=all.map(fightOf).find(Boolean);
  if(old){for(const o of all)if(!o.fight){const s=sideFor(old,o);if(s>=0)joinFight(old,o,s)}return old}
  const x=all.reduce((s,o)=>s+o.x,0)/all.length,y=all.reduce((s,o)=>s+o.y,0)/all.length,n=all.reduce((s,o)=>s+o.troops.length,0);
  const f=asFight({id:'f'+(++W.fightN),x,y,sides:[A.map(uidOf),B.map(uidOf)],t:0,n0:n,dur:FIGHT.base+FIGHT.per*n,acc:[0,0]});
  all.forEach(o=>{o.fight=f.id});W.fights.push(f);fightPlace(f);
  // (seen, or one you take part in, at once; no rider for it: he brings its end; worldlog.js)
  worldEvent({text:'Battle near '+Spatial.nearestHolding(f.x,f.y).name+': '+A.map(o=>o.label()).join(', ')+' against '+B.map(o=>o.label()).join(', ')+'.',cls:all.some(o=>o.mine)?'bad':'',x,y,post:false,noise:'battle',
    was:Math.hypot(x-P.x,y-P.y)<vis()*1.5||all.some(o=>o.faction===P.fac||o.mine)});
  return f;
}
function joinFight(f,o,s){if(s<0||o.fight||fightParties(f).length>=BATTLE_JOIN.armies||fightParties(f).reduce((n,p)=>n+p.fighters,0)+o.fighters>BATTLE_JOIN.fighters)return false;if(s>=2&&!f.multi){f.multi=true;f.wars=[];for(const a of sideParties(f,0))for(const b of sideParties(f,1))f.wars.push([uidOf(a),uidOf(b)])}if(!f.sides[s])f.sides[s]=[];f.sides[s].push(uidOf(o));o.fight=f.id;const k=o.troops.length;f.n0=(f.n0||0)+k;f.dur+=FIGHT.per*k;if(!f.multi)fightPlace(f);return true}
// the two lines face each other across the fight
function fightPlace(f){for(const s of [0,1])sideParties(f,s).forEach((o,i)=>{const x=f.x+(s?14:-14)+(s?1:-1)*(i>>1)*10,y=f.y+(i%2?8:-4)+(i>>1)*3,army=MARCH_ARMIES.get(o);if(army)army.relocate(x,y);else{o.x=x;o.y=y}o.dir=s?-1:1})}
// whose side a party would take: its realm's and allies', against its enemies; bands stick together; lawful men fight bands
function sideFor(f,o){
  const sides=f.sides.map((_,i)=>sideParties(f,i));if(fightParties(f).length>=BATTLE_JOIN.armies||fightParties(f).reduce((n,p)=>n+p.fighters,0)+o.fighters>BATTLE_JOIN.fighters)return -1;
  const relations=sides.map(ps=>ps.map(p=>armyRelation(o,p)));if(!relations.flat().some(v=>v<0))return -1;
  const fit=relations.findIndex((rs,i)=>rs.length&&rs.every(v=>v>0)&&relations.every((vs,j)=>j===i||vs.every(v=>v<0)));return fit<0?f.sides.length:fit;
}
// a party out of the fight: routed and gone, its goods to the winners if it was a caravan
function routParty(o,winners){
  const k=o.mapKind,near=Math.hypot(o.x-P.x,o.y-P.y)<vis()*1.5;o.fight=null;
  if(k==='cparty'){const c=P.comps[o.cid];if(c){c.party=null;c.hurt=G.day+3;log(COMPS[o.cid].short+'’s party is broken. '+COMPS[o.cid].short+' limps back to you, wounded for 3 days.','bad','war')}return}
  if(k==='lord'){if(o.state==='siege'&&townBy(o.tgt))worldEmit('siege:broken',{town:townBy(o.tgt),lord:o});worldEmit('lord:routed',{lord:o});defeatLord(o);
    {const H=Spatial.nearestHolding(o.x,o.y).name;worldEvent({text:o.name+' is routed near '+H+'.',cls:o.fac===P.fac?'bad':'',x:o.x,y:o.y,fac:[o.fac],heard:['lord',o],noise:'battle',was:near||o.fac===P.fac,seen:'You see '+o.name+' routed near '+H+'.',past:o.name+' was routed near '+H})}}
  else if(k==='band'){bandits=bandits.filter(x=>x!==o);chiefEscapes(o.ld)}// (its chieftain gets away)
  else if(k==='patrol')patrolBeaten(o);
  else if(k==='monster')beastRouted(o);
  else{o.gone=true;W.caravans=W.caravans.filter(x=>x!==o);const lord=winners.find(w=>w.mapKind==='lord'),band=winners.find(w=>w.mapKind==='band');
    worldEmit('caravan:beaten',{caravan:o,lord,band});// (the bus: news.js)
    if(lord){const home=Spatial.nearest(fiefsOf(lord.fac),lord.x,lord.y);if(home){ensureEcon(home);for(const g in o.goods)home.stock[g]=(home.stock[g]||0)+o.goods[g]}}
    else if(band)band.add('militia')// (it arms one more with the plunder)
    {const yours=o.mine?', one of yours':'';worldEvent({text:(lord?lord.name+' seizes':band?'Bandits plunder':'The enemy takes')+' a caravan of '+o.from+yours+'.',cls:o.mine||o.fac===P.fac?'bad':'',x:o.x,y:o.y,fac:[o.fac],mine:o.mine,heard:['caravan',o],noise:'battle',was:o.mine||o.fac===P.fac||near,
      seen:'You see '+(lord?lord.name+' seize':band?'bandits plunder':'the enemy take')+' a caravan of '+o.from+yours+'.',past:'a caravan of '+o.from+(o.mine?', one of yours,':'')+' was '+(lord?'seized by '+lord.name:band?'plundered by bandits':'taken by the enemy')})}}
}
// a party that came through: free to go on its way
// (a lord who rode out to defend his land goes back to what he was doing: defence.js)
function freeParty(o){o.fight=null;o.cool=3;const k=o.mapKind;if(k==='band'){o.n=o.size;o.pw=0}if(k==='caravan'&&!o.guards)o.guards=1;if(k==='lord'){if(o.defend)lordDefended(o);else if(o.state!=='siege')lordThink(o)}}
function endFight(f,win){
  const W0=sideParties(f,win),L=sideParties(f,1-win),lw=W0.filter(o=>o.mapKind==='lord'),ll=L.filter(o=>o.mapKind==='lord');
  {const foes=L.reduce((a,o)=>a+o.troops.length,0)+Math.round((f.n0||0)/3);lw.forEach(o=>lordWins(o,foes));W0.filter(o=>o.mapKind==='band').forEach(o=>chiefWins(o,foes));W0.filter(o=>o.cid).forEach(o=>{compXp(o.cid,12+2*foes);compTrain(o.cid,'lead',3)})}
  lw.forEach((a,i)=>lw.slice(i+1).forEach(b=>changeLordRel(a,b,RELATION.together)));ll.forEach(a=>lw.forEach(b=>changeLordRel(a,b,RELATION.beaten)));
  worldEmit('fight:ended',{fight:f,won:W0,lost:L});L.forEach(o=>routParty(o,W0));W0.forEach(freeParty);// (the bus: the news of it before the beaten are gone: news.js)
  W.fights=W.fights.filter(x=>x!==f);
  // (seen at once; by rider when a lord of your realm or a party of yours fought in it; else news: worldlog.js)
  if(W0.length&&L.length){const who=W0.map(o=>o.label()).join(' and '),H=Spatial.nearestHolding(f.x,f.y).name;
    worldEvent({text:who+' win'+(W0.length>1?'':'s')+' the battle near '+H+'.',x:f.x,y:f.y,mine:[...W0,...L].some(o=>o.mine||o.mapKind==='lord'&&P.fac&&o.fac===P.fac),heard:['fight',f],noise:'battle',
      was:Math.hypot(f.x-P.x,f.y-P.y)<vis()*1.5,past:who+' won the battle near '+H})}
}
function updateFights(d){
  for(const f of [...W.fights]){
    if(f.multi){updateArmyFight(f,d);continue}
    // gone from the field (beaten elsewhere, arrived, dead): out of the fight
    for(const s of [0,1])f.sides[s]=f.sides[s].filter(u=>{const o=partyBy(u);return o&&o.fight===f.id&&o.troops.length});
    if(!f.sides[0].length||!f.sides[1].length){const win=f.sides[0].length?0:1;sideParties(f,win).forEach(freeParty);W.fights=W.fights.filter(x=>x!==f);continue}
    DISTRACTIONS.notice(f,'battle');
    // lords and patrols nearby ride in
    for(const o of [...W.lords.filter(l=>!l.dead&&!l.inside&&!l.fight),...W.patrols.filter(p=>!p.fight),...cparties().filter(p=>!p.fight),...bandits.filter(p=>!p.fight),...W.monsters.map(asMonster).filter(p=>!p.fight)])
      if(!(o.cool>0)&&Math.hypot(o.x-f.x,o.y-f.y)<FIGHT.join){const s=sideFor(f,o);if(s>=0){joinFight(f,o,s);worldEvent({text:o.label()+' rides into the battle near '+Spatial.nearestHolding(f.x,f.y).name+'.',x:f.x,y:f.y,post:false,noise:'battle',was:Math.hypot(f.x-P.x,f.y-P.y)<vis()*1.5})}}
    if(f.multi){updateArmyFight(f,d);continue}
    // each side wears the other down by its share of the strength; the whole fight takes about dur
    // the pace is set by how many started (and joined): an even fight takes about dur, a lopsided one less
    const pw=[0,1].map(s=>sidePower(f,s)*lordTac(sideParties(f,s))*(f.amb?.side===s&&f.t<f.amb.until?WAYLAY.fight:1)),rate=(f.n0||sideTroops(f,0).length+sideTroops(f,1).length)/Math.max(1,f.dur);
    for(const s of [0,1]){f.acc[s]+=d*rate*pw[1-s]/Math.max(1,pw[0]+pw[1]);
      while(f.acc[s]>=1){f.acc[s]--;const ps=sideParties(f,s).filter(o=>o.troops.length);if(!ps.length)break;let r=Math.random()*ps.reduce((a,o)=>a+o.troops.length,0),o=ps[0];for(const p of ps){r-=p.troops.length;if(r<=0){o=p;break}}
        // a lord's Medicine: some of his fallen live
        if(o.mapKind==='lord'){lordTrain(o,'med',2);if(Math.random()<.07*lordSkill(o,'med'))continue}
        // (one blow of the other side: as strong as its average fighter)
        o.takeLoss(sidePower(f,1-s)/Math.max(1,sideTroops(f,1-s).length));if(!o.troops.length)routParty(o,sideParties(f,1-s))}}
    f.t+=d;const p0=sidePower(f,0),p1=sidePower(f,1);
    if(!p0||p0<FIGHT.rout*p1)endFight(f,1);else if(!p1||p1<FIGHT.rout*p0)endFight(f,0);
  }
}

/* you and a fight */
function fightMeet(f){
  G.fg=f;G.mode='dialog';P.tx=null;G.chase=null;const where=Spatial.nearestHolding(f.x,f.y).name;
  const side=s=>{const ps=sideParties(f,s),tr=sideTroops(f,s);return '<div class="row"><div class="info"><strong>'+ps.map(o=>{const fc=o.faction;return '<span'+(fc?' style="color:'+(fc==='player'?FACS.player.col:FACS[fc].col)+'"':'')+'>'+htmlText(partyName(o))+' ('+o.troops.length+')</span>'}).join(', ')+'</strong><small>'+tr.length+' fighters · power '+rating(tr)+'</small></div><div class="acts">'+dlgBtn('fg-join',s,'Join them',joinWhy(f,s))+'</div></div>'};
  if(f.multi){showPanel('<h2>Battle near '+where+'</h2><p>Multiple armies are fighting. Each keeps its own enemies and allies.</p>'+f.sides.map((_,i)=>side(i)).join('')+nav(null,['dlg-close',null,'Watch from afar']));return}
  const p0=sidePower(f,0),p1=sidePower(f,1),share=Math.round(p0/Math.max(1,p0+p1)*100);
  showPanel('<h2>Battle near '+where+'</h2><p class="muted">The fight has gone on a while ('+Math.round(f.t/Math.max(.1,f.dur)*100)+'% of its likely length). Your power: '+partyPower()+'.</p>'+side(0)+
    '<div style="height:8px;background:#7e2a26;border:1px solid var(--line)"><div style="height:100%;width:'+share+'%;background:#3d74d6"></div></div>'+side(1)+
    '<p class="muted">Joining a side means fighting its enemies, beside everyone on your side; realms you fight against turn hostile for 20 days.</p>'+nav(null,['dlg-close',null,'Watch from afar']));
}
// why you can't join a side: your employer fights on the other one, it is a side of bandits (unless they fight a beast), or
// it is a beast's (it fights for no one)
function joinWhy(f,s){const other=fightOpponents(f,s),mine=sideParties(f,s);if(P.fac&&other.some(o=>o.faction===P.fac))return 'Your employer is on the other side';if(other.some(o=>o.faction==='player'))return 'Your own people are on the other side';
  if(mine.some(o=>o.mapKind==='monster'))return 'It is a wild beast';if(mine.some(o=>o.mapKind==='band')&&!other.some(o=>o.mapKind==='monster'))return 'They are bandits';return ''}
// the parties of a side as battle forces: lords as they are; the rest wrapped with their fighters, name and realm
function forceOf(o){const k=o.mapKind;if(k==='lord')return o;partyRoster(o).groups;return{kind:k,src:o,name:o.label(),fac:o.faction,troops:o.troops.slice(),army:o.army?structuredClone(o.army):undefined}}
// after your battle: write the forces' fighters back to their parties
function syncForces(list){for(const f of list||[]){if(!f.src)continue;const o=f.src;if(f.kind==='garrison')o.gar=f.troops.length;else o.troops=f.troops;if(f.army)o.army=structuredClone(f.army)}}
// a holding's garrison as a battle force: it sallies beside whoever fights its besiegers, or beside the army come to relieve it
const garrisonForce=t=>({kind:'garrison',src:t,name:'the garrison of '+t.name,fac:t.owner,troops:garList(t)});
// a force you beat (or that fought beside you and was ground down); one you beat is heard on the bus as yours (a bounty's band,
// a lord to kill: quests)
function routForce(f,mine){if(!f.src){if(mine)worldEmit('lord:beaten',{lord:f});defeatLord(f);return ''}if(f.kind==='garrison')return '';const o=f.src;if(f.kind==='caravan'&&mine){const t=o.loot();o.gone=true;return t}
  if(mine&&f.kind==='band')worldEmit('band:beaten',{band:o});worldPart(()=>routParty(o,[]));return ''}
function fightAct(a,arg){
  const f=G.fg;if(!f||!W.fights.includes(f)){closeDialog();return}
  if(a==='fg-join'){const s=+arg;if(joinWhy(f,s))return;
    for(const o of fightOpponents(f,s)){const fc=o.faction;if(fc&&fc!=='player'&&realmOf(fc).provoke(20,10))log('The '+FACS[fc].n+' turns hostile to you.','bad','war')}
    // (against a beast: your battle with it, as when you meet it (monsters.js startMonster), the side you joined beside you)
    G.fg=null;const opponents=fightOpponents(f,s),others=f.sides.flatMap((_,i)=>i===s?[]:sideParties(f,i)),neutralForces=others.filter(o=>!opponents.includes(o));const m=opponents.find(o=>o.mapKind==='monster');
    if(m)return startEncounter({kind:'monster',ref:m,fight:f,neutralForces,lv:m.lv,list:m.troops.slice(),mine:true,allies:sideParties(f,s).map(forceOf),foes:others.filter(o=>o!==m).map(forceOf)});
    startEncounter({kind:'field',ref:f,side:s,neutralForces,list:[],allies:sideParties(f,s).map(forceOf),foes:others.map(forceOf),title:'Battle near '+Spatial.nearestHolding(f.x,f.y).name})}
}
onAct('fg-',fightAct);
// you won the battle: the fight is over, your side goes on its way
function fieldWon(e){const f=e.ref;sideParties(f,e.side).forEach(freeParty);worldPart(()=>sideParties(f,1-e.side).forEach(o=>routParty(o,[])));W.fights=W.fights.filter(x=>x!==f);return ''}

/* on the map: a fight is a world object (parties.js WorldObject): seen under the same sight and concealment rule as a unit, met by joining it
   (fightMeet: a click on a party in it, world.js interact), drawn as dust, steel and a tally; no dot on the minimap */
class Fight extends WorldObject{
  get mapKind(){return 'fight'}
  here(){return W.fights.includes(this)}
  inView(V){return spotted(this,V)}
  meet(){fightMeet(this)}
  draw(ents,cam,V){if(!this.inView(V)||B?.world?.hides(this))return;const f=this;
    ents.push({y:f.y+20,f:()=>{subT(f);const sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y),t=performance.now();
      for(let i=0;i<6;i++){const a=t/300+i*1.05,r=7+3*Math.sin(t/200+i);ctx.fillStyle='rgba(200,184,150,'+(.25+.15*Math.sin(t/150+i)).toFixed(2)+')';ctx.fillRect(Math.round(sx+Math.cos(a)*r)-2,Math.round(sy+Math.sin(a)*r*.5)-1,3,2)}
      if(Math.floor(t/120)%3===0){ctx.fillStyle='#fff8d0';ctx.fillRect(sx+rint(-6,6),sy-rint(3,10),1,1)}
      ctx.strokeStyle='#e4e0cf';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(sx-3,sy-17);ctx.lineTo(sx+3,sy-11);ctx.moveTo(sx+3,sy-17);ctx.lineTo(sx-3,sy-11);ctx.stroke();
      // the tally: each side's fighters in its colours
      const col=s=>{const p=sideParties(f,s)[0],fc=p&&p.faction;return fc?(fc==='player'?FACS.player.col:FACS[fc].col):'#ff9a90'};
      if(f.multi){txt(fightParties(f).length+' armies',sx,sy-20,'#e4c876','center');return}
      txt(String(sideTroops(f,0).length),sx-6,sy-20,col(0),'right');txt('vs',sx,sy-20,'#e4e0cf','center');txt(String(sideTroops(f,1).length),sx+6,sy-20,col(1),'left')}})}
}
// (a fight from a save is plain data until the map asks)
const asFight=asClass(Fight);
function drawFights(ents,cam,V){for(const f of W.fights)asFight(f).draw(ents,cam,V)}
// its work in the world's day and frame (core/systems.js)
Systems.add({name:'fights',order:{frame:80},frame:updateFights});

// Resumed tactical fights retain actual positions and surviving rosters; no new soldiers are generated.
function fightHostile(f,a,b){return armyRelation(a,b)<0||(f.wars||[]).some(([x,y])=>x===a.uid&&y===b.uid||x===b.uid&&y===a.uid)}
function resumeArmyFight(parties,hostile=(a,b)=>armyRelation(a,b)<0){
 parties=[...new Set(parties)].filter(o=>!o.dead&&!o.gone&&o.troops.length).slice(0,BATTLE_JOIN.armies);const wars=[];
 for(let i=0;i<parties.length;i++)for(let j=i+1;j<parties.length;j++)if(hostile(parties[i],parties[j]))wars.push([uidOf(parties[i]),uidOf(parties[j])]);
 if(!wars.length){parties.forEach(freeParty);return null}
 const n=parties.reduce((a,o)=>a+o.troops.length,0),f=asFight({id:'f'+(++W.fightN),x:parties.reduce((n,o)=>n+o.x,0)/parties.length,y:parties.reduce((n,o)=>n+o.y,0)/parties.length,sides:parties.map(o=>[uidOf(o)]),multi:true,wars,wear:{},t:0,n0:n,dur:FIGHT.base+FIGHT.per*n,acc:[]});parties.forEach(o=>o.fight=f.id);W.fights.push(f);return f;
}
function updateArmyFight(f,d){
 const nearby=[...W.lords.filter(o=>!o.dead&&!o.inside),...W.patrols,...cparties(),...bandits,...W.monsters.map(asMonster)];
 for(const o of nearby)if(!o.fight&&!o.gone&&!(o.cool>0)&&o.troops.length&&Math.hypot(o.x-f.x,o.y-f.y)<FIGHT.join){const side=sideFor(f,o);if(side>=0)joinFight(f,o,side)}
 const parties=fightParties(f).filter(o=>o.fight===f.id&&o.troops.length),state=parties.map(o=>({o,power:o.fightPower()*lordTac([o]),foes:parties.filter(p=>p!==o&&fightHostile(f,o,p))})),total=state.reduce((n,s)=>n+s.power,0),rate=(f.n0||1)/Math.max(1,f.dur),wear=f.wear||(f.wear={});
 for(const s of state){const enemies=state.filter(q=>s.foes.includes(q.o)),incoming=enemies.reduce((n,q)=>n+q.power/Math.max(1,q.foes.length),0);if(!incoming)continue;
  const key=uidOf(s.o);wear[key]=(wear[key]||0)+d*rate*incoming/Math.max(1,total);
  while(wear[key]>=1&&s.o.troops.length){wear[key]--;s.o.takeLoss(enemies.reduce((n,q)=>n+q.power,0)/Math.max(1,s.foes.reduce((n,o)=>n+o.troops.length,0)))}
  if(!s.o.troops.length){routParty(s.o,s.foes);continue}
  if(s.o.fightPower()<FIGHT.rout*incoming){s.o.fight=null;s.o.cool=12;s.o.fled=true}
 }
 f.t+=d;f.sides=f.sides.map(ps=>ps.filter(uid=>{const o=partyBy(uid);return o&&o.fight===f.id&&o.troops.length}));const alive=fightParties(f);
 if(!alive.some((a,i)=>alive.slice(i+1).some(b=>fightHostile(f,a,b)))){alive.forEach(freeParty);W.fights=W.fights.filter(o=>o!==f);worldEmit('fight:ended',{fight:f,won:alive,lost:[]})}
}
