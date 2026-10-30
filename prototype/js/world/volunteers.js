'use strict';
/* ---------- volunteers (the owner, 2026-10-30: "people might want to join your army for free if you have a good reputation and
   renown"; "at holdings, or when you set up camp near holdings and use the recruitment action during encampment"; "it will
   replenish your army until max and should affect population as well"; "the hire still exists, like an instant hire"). Staying in a
   holding, or camped on its lands, with standing there of VOLUNTEERS.standing or more and its realm not hostile: Recruit (the Under
   way panel). Each hour some join (VOLUNTEERS.slow a hour at that standing, up to .fast at .at, more with renown), free, out of its
   willing (t.vol) and its people (t.pop); only to refill your groups of a tier-1 or peasant kind it raises (and you may hire
   there), never a new group. Done when no such group has room, or your band is full; you leave its lands, or break camp: it
   stops. P.recruit: {town, acc (the part of the next one come), n (joined so far)} ---------- */
const VOLUNTEERS={standing:20,slow:.5,fast:1,at:80,renown:400,renownMax:.5};
// (where you could recruit now: the holding you stay in, or whose lands your camp is on)
const volunteerTown=()=>P.stay?townBy(P.stay.town):P.camp?landHold(P.x,P.y):null;
// (why its people will not come: '' when they will)
function volunteerWhy(t){if(!t||t.gone)return 'No holding near';if(hostileTo(t.owner))return 'Its realm is hostile to you';if(recruitment.closed(t))return 'It is in no state to spare men';
  if(standingAt(t)<VOLUNTEERS.standing)return 'They do not know you well enough (standing '+standingAt(t)+' of '+VOLUNTEERS.standing+')';if(!volunteerGroups(t).length)return 'None of your groups to refill';return ''}
// (your groups they would refill: a tier-1 or peasant kind it raises and you may hire there, with room)
function volunteerGroups(t){const r=partyRoster(P),ks=new Set(t.races.flatMap(x=>t.hires(x)));
  return partyRoom()<1?[]:r.groups.filter(g=>(ST[g.type]?.tier||0)<=1&&(ks.has(g.type)||ST[g.type]?.peasant)&&canHire(t,g.type)&&r.groupRoom(g.type,g.id)>0)}
// (how many an hour: by your standing there, and your renown)
const volunteerRate=t=>{const V=VOLUNTEERS,s=clamp((standingAt(t)-V.standing)/(V.at-V.standing),0,1);return (V.slow+(V.fast-V.slow)*s)*(1+Math.min(V.renownMax,P.renown/V.renown))};
function volunteerStart(){const t=volunteerTown(),why=volunteerWhy(t);if(why)return toast(why+'.','bad');P.recruit={town:t.name,acc:0,n:0};log('You let it be known in '+t.name+' that you take volunteers.','good','band');updateHUD(true)}
function volunteerStop(why){const R=P.recruit;if(!R)return;P.recruit=null;log((R.n?R.n+' volunteer'+(R.n>1?'s':'')+' joined you at '+R.town:'No volunteers joined you at '+R.town)+(why?' ('+why+')':'')+'.',R.n?'good':'','band');updateHUD(true)}
// the hour's: while you stay or camp there, some join; done when no group has room
function volunteerHour(){const R=P.recruit;if(!R)return;const t=townBy(R.town);if(!t||volunteerTown()!==t)return volunteerStop('you left');
  const why=volunteerWhy(t);if(why)return volunteerStop(why.toLowerCase());if((t.vol||0)<1)return;
  R.acc+=volunteerRate(t);while(R.acc>=1&&(t.vol||0)>=1){const gs=volunteerGroups(t);if(!gs.length)break;R.acc-=1;
    const g=gs.sort((a,b)=>partyRoster(P).groupRoom(b.type,b.id)-partyRoster(P).groupRoom(a.type,a.id))[0];if(!partyRoster(P).add(g.type,1,g.id))break;
    skinsJoin(1);t.vol-=1;t.pop=Math.max(10,(t.pop||0)-1);R.n++}
  if(!volunteerGroups(t).length)volunteerStop('your groups are full')}
Systems.add({name:'volunteers',order:{hour:40},hour:volunteerHour});
