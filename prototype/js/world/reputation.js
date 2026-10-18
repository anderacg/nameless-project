'use strict';
/* ---------- reputation: local standing at each holding, honor with each faction ---------- */
const repAt=n=>P.rep[n]||0,honorWith=f=>P.honor[f]||0;
// what a holding thinks of you: its local reputation, half your honor with its owner, and trust if your race lives there
function standingAt(t){return Math.round(repAt(t.name)+honorWith(t.owner)*.5+(t.races.includes(P.race)?RACE_TRUST:0)+(t.owner==='player'?40:0))}
const needFor=k=>REP_NEED[ST[k].tier]||REP_NEED[1];
const canHire=(t,k)=>standingAt(t)>=needFor(k);
function addRep(name,n,quiet){
  if(!n)return;const before=Math.round(repAt(name));P.rep[name]=clamp(repAt(name)+n,-50,100);
  if(!quiet&&Math.round(repAt(name))!==before)log((n>0?'Your name grows in ':'Your name sours in ')+name+' ('+(n>0?'+':'')+Math.round(n)+' reputation).',n>0?'good':'bad');
}
function addHonor(f,n,quiet){
  if(!n||!FACS[f])return;P.honor[f]=clamp(honorWith(f)+n,-100,100);
  if(!quiet)log('The '+FACS[f].n+(n>0?' honors you':' resents you')+' ('+(n>0?'+':'')+n+' honor).',n>0?'good':'bad');
}
// deeds in the field count for the nearest holding within law.repNear tiles (data/world.js), and a little for its owner
function repNear(x,y,n){const t=nearestOf({x,y},TOWNS);if(t&&Math.hypot(t.x-x,t.y-y)<WORLD_SCALE.law.repNear*TILE){addRep(t.name,n);addHonor(t.owner,Math.max(1,Math.round(n/3)),true)}}
