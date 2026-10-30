'use strict';
/* ---------- trainers (doc/RANKS_DESIGN.md §3, phase 3; their numbers data/trainers.js TRAINERS): a holding that trains keeps a few
   (W.trainers by holding, made the first time asked, from the 'trainers' stream: their roles from the troops it raises, their
   level by its kind); yours are your hero with Drillmaster and a companion given the Trainer role, and they teach only in your
   camp, free. A lesson: one of your groups of a role the trainer knows gains his level's flat experience, never past his level's
   rank (TRAINERS.cap), TRAINERS.week lessons a week each for your whole army (P.trainUse for yours, a holding's on its record).
   An expert or more of a kind's role is needed for its special upgrade (core/recruitment.js, upgradeTrainer) ---------- */
// (a kind's role for training: data/trainers.js TRAINERS.roles)
function trainRole(type){const s=ST[type];if(!s)return null;if(s.range)return s.magic?'caster':s.mounted?'horsebow':s.flat?'xbow':'bow';return s.mounted||s.charge?'cav':unitClass(s)==='spear'?'spear':'foot'}
const trainLevelN=tr=>TRAINERS.levels[tr.level-1];
const trainRolesN=tr=>tr.roles.map(r=>TRAINERS.roles[r]).join(', ');
// (the week, and a trainer's lessons given in it)
const trainWeek=()=>Math.floor((G.day-1)/7);
function trainUsed(tr){const u=tr.own?(P.trainUse||{})[tr.id]:tr.used;return u&&u.wk===trainWeek()?u.n:0}
const trainLeft=tr=>TRAINERS.week-trainUsed(tr);
function trainSpend(tr){const u={wk:trainWeek(),n:trainUsed(tr)+1};if(tr.own)(P.trainUse||(P.trainUse={}))[tr.id]=u;else tr.used=u}
// a holding's trainers, and the wandering ones there now: none where it does not train, or while it is closed (sacked, raided, in
// turmoil)
function trainersAt(t){if(!t||!t.T?.train||recruitment.closed(t))return [];const W0=W.trainers||(W.trainers={}),own=W0[t.name]||(W0[t.name]=trainersMake(t));
  return [...own,...wanderers().filter(w=>w.at===t.name)]}
function trainersMake(t){const A=TRAINERS.at[t.kind]||TRAINERS.at.town,R=rngOf('trainers'),kinds=t.races.flatMap(r=>t.hires(r)).flatMap(k=>[k,...(UP[k]||[])]),
    pool=[...new Set(kinds.map(trainRole).filter(Boolean))],N=FOLK_NAMES[t.races[0]]||FOLK_NAMES.human,out=[];
  for(let i=0;i<A[0]&&pool.length;i++){const a=R.pick(pool),b=R.chance(.5)?R.pick(pool):a,roles=[...new Set([a,b])];
    out.push({id:t.name+':'+i,name:R.pick(N)+' the '+TRAINERS.title[roles[0]],roles,level:R.int(A[1],A[2]),town:t.name})}
  return out}
/* ---- the wandering trainers (phase 4; the owner: "some may stay at a fixed place, some may travel around holdings or places, so it
   will work with news and rumours"): TRAINERS.wander.levels of them (made the first time asked), each a few days at a holding that
   trains, then on to the next, known beforehand; each move in the news (news.js 'trainer'). The ones you meet or hear of are kept
   in your Journal (P.trainersMet: trainerMeet, trainerHeard) ---- */
const trainHoldings=()=>TOWNS.filter(t=>t.T?.train&&!t.gone);
function wanderers(){if(W.wanderers)return W.wanderers;const R=rngOf('trainers'),roles=Object.keys(TRAINERS.roles),hs=trainHoldings();W.wanderers=[];if(!hs.length)return W.wanderers;
  TRAINERS.wander.levels.forEach((lv,i)=>{const role=R.pick(roles),N=FOLK_NAMES[R.pick(Object.keys(FOLK_NAMES))];
    const w={id:'w:'+i,name:R.pick(N)+' the '+TRAINERS.title[role],roles:[role],level:lv,wander:true,at:R.pick(hs).name,until:G.day+R.int(...TRAINERS.wander.stay)};w.next=wanderNext(w,R);W.wanderers.push(w);wanderNews(w)});
  return W.wanderers}
// (where he goes next: another holding that trains, the nearer likelier)
function wanderNext(w,R=rngOf('trainers')){const here=townBy(w.at),hs=trainHoldings().filter(t=>t.name!==w.at);if(!hs.length)return w.at;
  const d=t=>here?Math.hypot(t.x-here.x,t.y-here.y):1,near=hs.sort((a,b)=>d(a)-d(b)).slice(0,6);return R.pick(near).name}
const wanderNews=w=>{const t=townBy(w.at);if(t)newsRecord('trainer',t,{id:w.id,name:w.name,lv:trainLevelN(w),roles:trainRolesN(w),town:w.at,next:w.next})};
// the day's: made on the first, then each whose days are up moves on
function trainersDay(){if(!W.wanderers)return void wanderers();const R=rngOf('trainers');for(const w of W.wanderers)if(G.day>=w.until){w.at=w.next;w.until=G.day+R.int(...TRAINERS.wander.stay);w.next=wanderNext(w,R);wanderNews(w)}}
Systems.add({name:'trainers',order:{day:212},day:trainersDay});
// (your Journal's: one met (where, the day), one heard of (where, and where next))
function trainerMeet(tr){if(tr.own)return;(P.trainersMet||(P.trainersMet={}))[tr.id]={name:tr.name,roles:tr.roles,level:tr.level,at:tr.wander?tr.at:tr.town,wander:!!tr.wander,day:G.day,met:true}}
function trainerHeard(d){const w=(W.wanderers||[]).find(x=>x.id===d.id);if(!w)return;const M=P.trainersMet||(P.trainersMet={}),o=M[w.id];
  M[w.id]={name:w.name,roles:w.roles,level:w.level,at:d.town,next:d.next,wander:true,day:G.day,met:!!o?.met}}
// yours: your hero with Drillmaster (his level by Leadership), a companion as Trainer (by his level), each his roles
function ownTrainers(){const out=[],lv=n=>clamp(1+Math.floor(n/5),1,3);
  if(has('drill'))out.push({id:'hero',own:true,name:'You',roles:TRAINERS.hero,level:lv(skill('lead'))});
  const c=roleOf('trainer');if(c){const o=compInit(c);out.push({id:'comp_'+c,own:true,name:COMPS[c].short||COMPS[c].n,roles:TRAINERS.look[COMPS[c].look]||['foot'],level:lv(o.lv||1)})}
  return out}
// a lesson's price (yours: free), and why it cannot be given now ('' when it can)
const lessonPrice=(tr,g)=>tr.own?0:TRAINERS.gold[tr.level-1]*Math.max(1,ST[g.type].tier);
function lessonWhy(tr,g){const cap=TRAINERS.cap[tr.level-1];
  if(tr.own&&!P.camp)return 'Only in your camp';if(!tr.roles.includes(trainRole(g.type)))return 'Teaches '+trainRolesN(tr)+' only';
  if(rankPeasant(g.type)?rankReady(g):rankOf(g)>=cap)return rankPeasant(g.type)?'Ready to upgrade':'Trains to rank '+cap+' at most';
  if(trainLeft(tr)<1)return 'No more lessons this week';if(P.gold<lessonPrice(tr,g))return 'Not enough gold';return ''}
// a lesson: its experience, never past the trainer's rank (at the last rank, no mastery: that is the battle's)
function lesson(tr,g){const why=lessonWhy(tr,g);if(why)return{ok:false,why};const cap=TRAINERS.cap[tr.level-1],m=g.mxp,price=lessonPrice(tr,g),xp=TRAINERS.xp[tr.level-1];
  P.gold-=price;trainSpend(tr);const up=rankGain(g,xp);
  if(!rankPeasant(g.type)&&rankOf(g)>=cap){g.rank=cap;g.xp=cap<RANKS.max?Math.min(rankXp(g),rankNeed(g)-1):0;if(m==null)delete g.mxp;else g.mxp=m}
  return{ok:true,xp,up,price}}
// the trainer a special upgrade into to needs: an expert or more of its role, at t (a holding) or yours in your camp; none: null
function upgradeTrainer(t,to){const role=trainRole(to),ok=tr=>tr.level>=TRAINERS.upgrade&&tr.roles.includes(role);return trainersAt(t).find(ok)||(P.camp?ownTrainers().find(ok):null)||null}
onAct('trn-',(a,arg)=>{if(a!=='trn-lesson')return;const [tid,gid]=String(arg).split('|'),g=partyRoster(P).groups.find(x=>x.id===gid),tr=[...trainersAt(G.town?.ref),...ownTrainers()].find(x=>x.id===tid);
  if(!g||!tr)return;const r=lesson(tr,g);if(!r.ok)return toast(r.why+'.','bad');
  log(armyGroupLabel(gid)+' drill with '+tr.name+(tr.own?'':' ('+r.price+'g)')+': +'+r.xp+' experience'+(r.up?', rank '+rankOf(g)+'!':'.'),'good','band');
  if(G.mode==='town')renderTown();else if(G.mode==='char')renderChar()});
Saves.add({key:'trainers',order:350,defaults:null,save:()=>W.trainers&&Object.keys(W.trainers).length||W.wanderers?{at:W.trainers,wander:W.wanderers}:undefined,load:v=>{W.trainers=v?.at||{};W.wanderers=v?.wander||null}});
