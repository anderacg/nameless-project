'use strict';
/* ---------- quests: jobs from holdings and lords ---------- */
// P.jobs[holding] = {day, list}: up to JOB_OFFERS offers, refreshed every JOB_REFRESH days. P.quests: the ones you took (at most QUEST_MAX).
// A quest: {id, type, title, text, giver (holding or lord name), lord (bool), fac, due, reward {gold, rep, honor, xp}, done, ...type fields}.
// Kill and clear quests are done when the deed is; you then report back. Deliveries are handed in where they were asked for.
// A courier pays on arrival. Lord quests can be reported to the lord or at any holding of his faction.
const QUEST_MAX=4,JOB_OFFERS=2,JOB_REFRESH=7;
const BAND_NAMES=['Red Vipers','Ash Crows','Black Hounds','Grey Wolves','Bone Saws','Mud Rats','Iron Jaws','Night Owls','Rusty Knives','Hollow Men','Crooked Spears','Burnt Hands'];
const qScale=()=>1+G.day/60,qTiles=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE;
const questBy=id=>P.quests.find(q=>q.id===id);
// a free spot 8 to 16 tiles from a holding, on ground you can reach
function spotNear(t,lo,hi,ok){
  const f=flowTo(TOWNS[0]);
  for(let k=0;k<300;k++){const a=Math.random()*6.283,d=(lo+Math.random()*(hi-lo))*TILE,x=t.x+Math.cos(a)*d,y=t.y+Math.sin(a)*d,tx=Math.floor(x/TILE),ty=Math.floor(y/TILE);
    if(tx<2||ty<2||tx>=MW-2||ty>=MH-2||!passable(tAt(tx,ty))||!isFinite(f[ty*MW+tx])||TOWNS.some(o=>Math.hypot(o.x-x,o.y-y)<48)||(ok&&!ok(x,y)))continue;return{x:(tx+.5)*TILE,y:(ty+.5)*TILE}}
  return null;
}
/* making offers */
function makeQuest(type,t,lord){
  const q={type,giver:lord?lord.name:t.name,lord:!!lord,fac:lord?lord.fac:t.owner,home:t.name},s=qScale(),r=(g,rep,hon,xp)=>q.reward={gold:Math.round(g*s*.7),rep,honor:hon,xp};
  if(type==='bounty'){q.band=BAND_NAMES[rint(0,BAND_NAMES.length-1)];q.n=rint(4,6)+Math.floor(G.day/12);q.days=8;q.title='Bounty: the '+q.band;
    q.text='The '+q.band+', a band of about '+q.n+', have been robbing travellers near '+t.name+'. Find them and break them.';r(50+14*q.n,8,3,20+5*q.n)}
  else if(type==='beast'){const c=t.clim,ids=Object.keys(MONSTERS).filter(id=>MONSTERS[id].where.includes(c)||MONSTERS[id].where.includes('forest')&&c==='grass');if(!ids.length)return null;
    q.mon=ids[rint(0,ids.length-1)];const M=MONSTERS[q.mon];q.n=Math.max(M.count[0],M.count[1]);q.lv=monLevel()+1;q.days=10;q.title='Beast hunt: '+M.n.toLowerCase();
    q.text=cap1(M.n.toLowerCase())+' have been killing livestock outside '+t.name+'. They are bigger than most. Kill them.';r(40+M.xp*q.n*.9,8,2,0)}
  else if(type==='clear'){const s2=W.sites.filter(x=>x.clearJob&&!x.cleared&&qTiles(x,t)<35).sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];if(!s2)return null;
    q.site=s2.i;q.days=12;q.title='Clear the '+s2.name;q.text='The '+s2.name+' to the '+compass(s2.x-t.x,s2.y-t.y)+' troubles '+t.name+'. Clear it out.';r(130,10,3,40)}
  else if(type==='supply'){ensureEcon(t);const goods=Object.keys(GOODS).filter(g=>!GOODS[g].spoil&&!GOODS[g].ammo&&needOf(t,g)>.05).sort((a,b)=>(t.stock[a]||0)/targetStock(t,a)-(t.stock[b]||0)/targetStock(t,b));if(!goods.length)return null;q.good=goods[rint(0,Math.min(1,goods.length-1))];q.n=rint(8,15);q.days=10;
    q.title='Supply run: '+GOODS[q.good].n.toLowerCase();q.text=t.name+' is short of '+GOODS[q.good].n.toLowerCase()+'. Bring '+q.n+' here.';r(GOODS[q.good].base*q.n*1.6,8,2,15)}
  else if(type==='hunt'){const hides=Math.random()<.4;q.mat=hides?'hide':null;q.good=hides?null:'meat';q.n=hides?rint(3,5):rint(12,20);q.days=12;
    q.title=hides?'Hides for the tanner':'Meat for the feast';q.text=hides?'The tanner of '+t.name+' wants '+q.n+' deer hides.':t.name+' is holding a feast and needs '+q.n+' meat.';r(hides?q.n*28:q.n*13,8,1,15)}
  else if(type==='courier'){const dest=TOWNS.filter(o=>o!==t&&!hostileTo(o.owner)&&qTiles(o,t)>18&&qTiles(o,t)<60);if(!dest.length)return null;const d=dest[rint(0,dest.length-1)];
    q.to=d.name;q.days=Math.ceil(qTiles(d,t)/8)+5;q.title='Letter for '+d.name;q.text='Carry a sealed letter from '+q.giver+' to '+d.name+', '+Math.round(qTiles(d,t))+' tiles to the '+compass(d.x-t.x,d.y-t.y)+'. You are paid on arrival.';r(25+qTiles(d,t)*1.6,5,2,15)}
  else if(type==='troops'){q.n=rint(3,5);q.tier=2;q.days=12;q.title='Reinforce '+t.name;q.text='The garrison of '+t.name+' is thin. Hand over '+q.n+' troops of tier 2 or better.';r(45*q.n,6,8,25)}
  else if(type==='lordkill'){const foes=W.lords.filter(o=>!o.dead&&atWar(q.fac,o.fac));if(!foes.length)return null;const f=foes[rint(0,foes.length-1)];
    q.target=f.name;q.tfac=f.fac;q.days=20;q.title='Defeat '+f.name;q.text=lord.name+' wants '+f.name+' of the '+FACS[f.fac].n+' beaten in the field.';r(280,0,15,80)}
  else if(type==='raid'){const vs=TOWNS.filter(v=>!walled(v)&&atWar(q.fac,v.owner));if(!vs.length)return null;const v=vs.sort((a,b)=>qTiles(a,t)-qTiles(b,t))[0];
    q.village=v.name;q.days=12;q.title='Raid '+v.name;q.text=lord.name+' wants the '+FACS[v.owner].n+' village of '+v.name+' raided.';r(160,0,10,40)}
  else return null;
  return q;
}
function jobsAt(t){
  P.jobs=P.jobs||{};const j=P.jobs[t.name];
  if(!j||G.day-j.day>=JOB_REFRESH){const list=[],kinds=t.T.jobs.slice();
    for(let k=0;k<12&&list.length<JOB_OFFERS;k++){const q=makeQuest(kinds[rint(0,kinds.length-1)],t);if(q&&!list.some(o=>o.type===q.type))list.push(q)}
    P.jobs[t.name]={day:G.day,list}}
  return P.jobs[t.name].list;
}
// a lord's job: war work if his faction is at war (raids only for those who serve him), else a bounty or a beast near his lands
function lordJob(l){
  const t=nearestOf(l,fiefsOf(l.fac).length?fiefsOf(l.fac):TOWNS);const kinds=enemiesOf(l.fac).length?(P.fac===l.fac?['lordkill','raid']:['lordkill']):['bounty','beast'];
  for(let k=0;k<6;k++){const q=makeQuest(kinds[rint(0,kinds.length-1)],t,l);if(q)return q}return null;
}
/* taking a quest: spawn whatever must be hunted */
function acceptQuest(q){
  if(P.quests.length>=QUEST_MAX)return false;
  q.id=P.qid=(P.qid||0)+1;q.due=G.day+q.days;q.done=false;const t=townBy(q.home);
  if(q.type==='bounty'){const p=spotNear(t,8,16);if(!p)return false;const kind=climAt(p.x,p.y)==='desert'?'raiders':climAt(p.x,p.y)==='swamp'?'bog':'bandits';
    bandits.push(asParty({x:p.x,y:p.y,n:q.n,kind,list:makeEnemies(q.n,false,kind),t:0,a:0,idle:true,cool:0,qid:q.id,name:q.band,ld:newChief(kind,2+Math.floor(G.day/20))}));q.x=p.x;q.y=p.y}
  if(q.type==='beast'){const M=MONSTERS[q.mon],p=spotNear(t,6,14,(x,y)=>M.where.some(w=>habitatAt(x,y).includes(w)))||spotNear(t,6,14);if(!p)return false;
    W.monsters.push(asMonster({id:q.mon,x:p.x,y:p.y,hx:p.x,hy:p.y,lv:q.lv,n:q.n,t:0,a:0,cool:0,qid:q.id}));q.x=p.x;q.y=p.y}
  if(q.type==='clear'){const s=W.sites[q.site];if(!s||s.cleared)return false;s.seen=true;q.x=s.x;q.y=s.y}
  if(q.type==='lordkill')q.x=null;
  if(q.type==='raid'){const v=townBy(q.village);q.x=v.x;q.y=v.y}
  if(q.type==='courier'){const d=townBy(q.to);q.x=d.x;q.y=d.y}
  P.quests.push(q);log('New quest: '+q.title+'. '+q.days+' days. Track it with C → Quests.','gold');return true;
}
// where a quest points you now: its target, or home once it is done
function questGoal(q){
  if(q.done||['supply','hunt','troops'].includes(q.type)){const t=q.lord?nearestOf(P,fiefsOf(q.fac).filter(x=>!hostileTo(x.owner)))||townBy(q.home):townBy(q.home);return t?{x:t.x,y:t.y,name:t.name}:null}
  if(q.type==='bounty'){const b=bandits.find(x=>x.qid===q.id)||camps().flatMap(c=>c.bands||[]).find(x=>x.qid===q.id);return b?{x:b.x,y:b.y,name:(b.ld?b.ld.name+' and ':'')+'the '+q.band}:null}
  if(q.type==='beast'){const m=W.monsters.find(x=>x.qid===q.id);return m?{x:m.x,y:m.y,name:MONSTERS[q.mon].n.toLowerCase()}:null}
  if(q.type==='lordkill'){const l=W.lords.find(x=>x.name===q.target&&!x.dead);return l?{x:l.x,y:l.y,name:q.target}:null}
  if(q.type==='clear'){const s=W.sites[q.site];return s?{x:s.x,y:s.y,name:'the '+s.name}:null}
  if(q.type==='raid'||q.type==='courier'){const t=townBy(q.village||q.to);return{x:t.x,y:t.y,name:t.name}}
  return null;
}
// can it be handed in now?
function questReady(q){
  if(q.type==='supply')return goodN(q.good)>=q.n;
  if(q.type==='hunt')return q.mat?invCount('mat',q.mat)>=q.n:goodN('meat')>=q.n;
  if(q.type==='troops')return Object.keys(P.troops).reduce((a,k)=>a+(ST[k].tier>=q.tier?P.troops[k]:0),0)>=q.n;
  return q.done;
}
function questProgress(q){
  if(q.type==='supply')return goodN(q.good)+' / '+q.n+' '+GOODS[q.good].n.toLowerCase();
  if(q.type==='hunt')return(q.mat?invCount('mat',q.mat):goodN('meat'))+' / '+q.n+' '+(q.mat?'hides':'meat');
  if(q.type==='troops')return Object.keys(P.troops).reduce((a,k)=>a+(ST[k].tier>=q.tier?P.troops[k]:0),0)+' / '+q.n+' troops of tier '+q.tier+'+';
  return q.done?'Done. Report to '+(q.lord?q.giver+' or any '+FACS[q.fac].n+' holding':q.home)+'.':q.type==='courier'?'Deliver to '+q.to+'.':'Not done yet.';
}
// the deed is done: called from fights, raids and searches
function questNotify(kind,ref){
  for(const q of P.quests){if(q.done)continue;
    const hit=kind==='band'&&q.type==='bounty'&&ref.qid===q.id||kind==='monster'&&q.type==='beast'&&ref.qid===q.id||kind==='site'&&q.type==='clear'&&ref.i===q.site||
      kind==='lord'&&q.type==='lordkill'&&ref.name===q.target||kind==='raid'&&q.type==='raid'&&ref.name===q.village;
    if(hit){q.done=true;log('Quest done: '+q.title+'. Report back to '+(q.lord?q.giver:q.home)+'.','gold')}
  }
}
function payQuest(q,where){
  const r=q.reward,giver=q.lord&&W.lords.find(l=>l.name===q.giver);P.gold+=r.gold;
  if(giver){const bonus=Math.round(r.gold*Math.max(0,relWith(giver))/200);if(bonus){P.gold+=bonus;log(giver.name+' adds '+bonus+' gold for a friend.','gold')}changeRel(giver,RELATION.jobDone,'you did their work')}gainXp(r.xp);P.renown+=q.lord?4:2;
  if(r.rep)addRep(q.lord?where:q.home,r.rep,true);if(r.honor)addHonor(q.fac,r.honor,true);
  P.quests=P.quests.filter(x=>x!==q);log('Quest complete: '+q.title+'. +'+r.gold+' gold'+(r.rep?', +'+r.rep+' reputation':'')+(r.honor?', +'+r.honor+' honor':'')+'.','good');
}
// hand in at a holding: takes the goods or troops it asked for
function turnIn(q,t){
  if(!questReady(q))return false;
  if(q.type==='supply'){goodTake(q.good,q.n);const ht=townBy(q.home);if(ht){ensureEcon(ht);ht.stock[q.good]=(ht.stock[q.good]||0)+q.n}}
  if(q.type==='hunt'){if(q.mat){let n=q.n;for(let i=0;i<P.inv.length&&n;i++){const s=P.inv[i];if(s&&s.k==='mat'&&s.id===q.mat){const k=Math.min(n,s.n);s.n-=k;n-=k;if(!s.n)P.inv[i]=null}}}else goodTake('meat',q.n)}
  if(q.type==='troops'){let n=q.n;for(const k of Object.keys(P.troops).sort((a,b)=>ST[a].tier-ST[b].tier))while(n&&ST[k].tier>=q.tier&&P.troops[k]>0){P.remove(k);n--;t.gar=Math.min(t.T.gar+6,t.gar+1)}}
  payQuest(q,t.name);return true;
}
const canReportAt=(q,t)=>q.lord?t.owner===q.fac:t.name===q.home;
function failQuest(q,why){
  P.quests=P.quests.filter(x=>x!==q);if(q.lord)addHonor(q.fac,-5,true);else addRep(q.home,-6,true);
  bandits.forEach(b=>{if(b.qid===q.id)delete b.qid});W.monsters.forEach(m=>{if(m.qid===q.id)delete m.qid});
  log('Quest failed: '+q.title+'. '+why,'bad');{const giver=q.lord&&W.lords.find(l=>l.name===q.giver);if(giver)changeRel(giver,RELATION.jobFailed,'you failed their work')}
}
// each day: deadlines pass
function questDay(){for(const q of P.quests.slice())if(G.day>q.due&&!q.done)failQuest(q,(q.lord?q.giver:q.home)+' is disappointed.')}
// arriving at a holding: couriers deliver
function questArrive(t){for(const q of P.quests.slice())if(q.type==='courier'&&q.to===t.name){addRep(t.name,3,true);payQuest(q,t.name)}}
/* panels */
const rewardText=r=>'<span class="gold">'+r.gold+' gold</span>'+(r.rep?' · +'+r.rep+' reputation':'')+(r.honor?' · +'+r.honor+' honor':'')+(r.xp?' · '+r.xp+' XP':'');
function jobsBody(t){
  const here=P.quests.filter(q=>canReportAt(q,t)),offers=jobsAt(t),full=P.quests.length>=QUEST_MAX,st=standingAt(t);
  const row=(title,sub,acts)=>'<div class="row"><div class="info"><strong>'+title+'</strong><small>'+sub+'</small></div><div class="acts">'+acts+'</div></div>';
  return '<div class="lab">Your quests here</div>'+(here.length?here.map(q=>row(q.title,questProgress(q)+' · '+rewardText(q.reward),'<button class="btn sm" type="button" data-act="q-turnin" data-arg="'+q.id+'"'+(questReady(q)?'':' disabled')+'>'+(['supply','hunt','troops'].includes(q.type)?'Hand over':'Report')+'</button>')).join(''):'<p class="muted">None.</p>')+
    '<div class="lab" style="margin-top:6px">Work offered · '+P.quests.length+' / '+QUEST_MAX+' quests taken</div>'+
    (st<-10?'<p class="muted">Nobody here trusts you with work. Raise your standing first.</p>':offers.length?offers.map((q,i)=>row(q.title,q.text+' '+q.days+' days. Reward: '+rewardText(q.reward),'<button class="btn sm" type="button" data-act="q-accept" data-arg="'+i+'"'+(full?' disabled title="You have too many quests"':'')+'>Accept</button>')).join(''):'<p class="muted">No more work this week.</p>');
}
function questsBody(){
  if(!P.quests.length)return '<p class="muted">No quests. Look for work in the Jobs tab of any holding, or ask a friendly lord.</p>';
  return P.quests.map(q=>{const g=questGoal(q),d=g?Math.round(qTiles(g,P)):0;return '<div class="row"><div class="info"><strong>'+q.title+'</strong><small>'+q.text+'</small><small class="'+(q.done||questReady(q)?'good':'')+'">'+questProgress(q)+'</small>'+
    '<small>'+(g?'Go '+(d<2?'here':d+' tiles '+compass(g.x-P.x,g.y-P.y))+(g.name?' to '+g.name:'')+'. ':'')+(q.due-G.day)+' days left · '+rewardText(q.reward)+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="q-abandon" data-arg="'+q.id+'">Abandon</button></div></div>'}).join('');
}
// town actions (from the town screen) and log actions (from the character screen)
function questAct(a,arg,t){
  if(!a.startsWith('q-'))return false;
  if(a==='q-accept'&&t){const list=jobsAt(t),q=list[+arg];if(q&&standingAt(t)>=-10&&acceptQuest(q))list.splice(+arg,1)}
  else if(a==='q-turnin'&&t){const q=questBy(+arg);if(q&&canReportAt(q,t)){if(q.done&&!['supply','hunt','troops'].includes(q.type))payQuest(q,t.name);else turnIn(q,t)}}
  else if(a==='q-abandon'){const q=questBy(+arg);if(q)failQuest(q,'You gave it up.')}
  else if(a==='q-lord'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref;if(G.lordJob&&acceptQuest(G.lordJob)){G.lordJob=null;l.asked=G.day}lordMeet(l);return true}
  else if(a==='q-lord-report'&&G.enc&&G.enc.kind==='lord'){const l=G.enc.ref;P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done).forEach(q=>payQuest(q,nearestOf(l,fiefsOf(l.fac)).name));lordMeet(l);return true}
  return 'refresh';
}
// the lord dialog's job section
function lordJobHtml(l){
  if(hostileTo(l.fac))return '';
  if(relWith(l)<RELATION.jobsAt)return '<p class="muted">'+l.name+' has no work for you.</p>';
  const done=P.quests.filter(q=>q.lord&&q.giver===l.name&&q.done),mine=P.quests.find(q=>q.lord&&q.giver===l.name);
  if(done.length)return '<p class="gold">'+l.name+' hears your report.</p><div class="btns"><button class="btn primary" type="button" data-act="q-lord-report">Report: '+done.map(q=>q.title).join(', ')+'</button></div>';
  if(mine)return '<p class="muted">You are working for '+l.name+': '+mine.title+'.</p>';
  if(honorWith(l.fac)<0)return '<p class="muted">'+l.name+' has no work for someone the '+FACS[l.fac].n+' distrusts.</p>';
  if(l.asked===G.day)return '';
  if(!G.lordJob||G.lordJob.giver!==l.name)G.lordJob=lordJob(l);const q=G.lordJob;
  return q?'<div class="row"><div class="info"><strong>'+q.title+'</strong><small>'+q.text+' '+q.days+' days. Reward: '+rewardText(q.reward)+'</small></div><div class="acts"><button class="btn sm" type="button" data-act="q-lord"'+(P.quests.length>=QUEST_MAX?' disabled':'')+'>Accept</button></div></div>':'<p class="muted">'+l.name+' has no work for you.</p>';
}
/* the map: a marker over each quest's goal */
function drawQuestMarks(cam){
  const t=performance.now()/300;
  for(const q of P.quests){const g=questGoal(q);if(!g)continue;const sx=Math.round(g.x-cam.x),sy=Math.round(g.y-cam.y);
    if(sx<-10||sy<-10||sx>VW+10||sy>VH+10)continue;txt(q.done||questReady(q)?'?':'!',sx,sy-24+Math.round(Math.sin(t)*2),'#ffe040','center')}
}
