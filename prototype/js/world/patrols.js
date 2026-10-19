'use strict';
/* ---------- patrols: every holding's guards ride its land ---------- */
// W.patrols: {pt, watch, home, fac, troops, sent, x, y, wx, wy (waypoint), wait, last, cool, dir}. A holding keeps two standing
// watches: the day watch and the night watch (watch: 'day' | 'night'; who they are: watchesOf). The watch on duty goes out from
// the garrison when it can be spared (its soldiers leave the garrison while it is out; sent: how many), and at the change of the
// watch, at dusk and at dawn, it walks home and rejoins the garrison as the other sets out. It walks its beat round the
// holding's buildings (the day watch also rides out over its land; the night watch keeps close, by torchlight), hunts bandits
// there, fights an enemy army it can beat and runs home from one it can't. It goes home at once when the holding is besieged, or
// when it is down to half. Beaten, only that watch keeps in for a while; the other still goes out at its hour.
// The guards stop you if you have wronged the holding lately (t.crime, known to both watches: pay the fine or fight) and attack
// if their realm is hostile to you. Your own fiefs' guards ride for you.
const patrolOf=t=>W.patrols.find(p=>p.home===t.name);
// the watch on duty: the night watch from nightfall to dawn
const watchNow=()=>G.clock/DAY>=NIGHT_AT?'night':'day';
const watchOf=p=>p.watch||'day';
const watchName=p=>WATCH[watchOf(p)].n+' of '+p.home;
/* a holding's two standing watches (t.watches: day, night), each {cap (its captain: a name of the holding's people, seeded by the
   holding, as its workers are named), kinds (its make-up: WATCH), n (how many it has now: its fallen are lost, and it takes them
   back from the garrison over the days, patrolDay), off (worldTime: beaten, it keeps in till then)}. Made when first needed,
   and again (captains, strength and rest kept) when the holding's kind changes the watch's size */
function watchesOf(t){
  const n=t.T.patrol.size,o=t.watches;if(o&&o.day.kinds.length===n)return o;
  const R=seeded(folkHash(t.name+' watch')),rc=k=>RACES[t.races[k%t.races.length]],nm=r=>FOLK_NAMES[r]||FOLK_NAMES.human,a=nm(t.races[0]),b=nm(t.races[1]||t.races[0]);
  let i=Math.floor(R()*a.length),j=Math.floor(R()*b.length);if(a[i]===b[j])j=(j+1)%b.length;const cap={day:a[i],night:b[j]};
  const make=w=>{const X=WATCH[w],kinds=[...Array(n)].map((_,k)=>{const c=rc(k),q=X.lead[k]||X.mix[Math.floor(R()*X.mix.length)];return q==='spear'?UP[c.melee][0]:c[q]});
    return {cap:o?o[w].cap:cap[w],kinds,n:o?Math.min(o[w].n,n):n,off:o?o[w].off:0}};
  return t.watches={day:make('day'),night:make('night')};
}
// a holding sends out the watch on duty, if it is not out already or resting, has half its men or more, and the garrison can
// spare them
function sendWatch(t){
  if(!t.owner||besieged(t)||ruined(t))return;const w=watchNow(),X=watchesOf(t)[w];if(X.off>worldTime()||W.patrols.some(p=>p.home===t.name&&watchOf(p)===w))return;
  const n=X.n;if(n*2<t.T.patrol.size||t.gar<t.T.patrol.keep+n)return;
  t.gar-=n;W.patrols.push(asParty({pt:true,watch:w,home:t.name,fac:t.owner,troops:X.kinds.slice(0,n),sent:n,x:t.x+rint(-6,6),y:t.y+14,wx:null,wy:null,cool:0,dir:1}));
}
// home (or scattered): those still standing rejoin the garrison; the fallen are lost to the watch
function watchBack(t,p){t.gar+=p.troops.length;const X=watchesOf(t)[watchOf(p)];X.n=Math.max(0,X.n-((p.sent||p.troops.length)-p.troops.length));p.gone=true}
let watchCheck=0;
const crimeAt=t=>t&&t.crime&&t.crime.until>G.day?t.crime:null;
// is (x, y) land the patrol guards: its holding's, or another holding of the same realm's
const patrolLand=(p,x,y)=>{const h=landHold(x,y);return !!h&&(h.name===p.home||h.owner===p.fac)};
// each day a watch short of men takes WATCH.refill back while the whole garrison (in and out) can spare them; then the watch
// on duty goes out
function patrolDay(){for(const t of TOWNS){
  if(t.owner&&!ruined(t)){const all=t.gar+W.patrols.reduce((a,p)=>a+(p.home===t.name?p.troops.length:0),0);
    for(const X of Object.values(watchesOf(t)))if(X.n<X.kinds.length&&all>=t.T.patrol.keep+X.n+WATCH.refill)X.n=Math.min(X.kinds.length,X.n+WATCH.refill)}
  sendWatch(t)}}
// its beat: from building to building of the holding (its centre, houses, estates and their fields), one of the nearest it has
// not just left, to a corner just outside it, where it stops a moment to look about; now and then out along its land
function patrolWaypoint(p,t){
  const ls=(t.lots||[]).filter(l=>l.st!=='ruined'&&l.id!==p.last).sort((a,b)=>Math.hypot((a.x+a.n/2)*TILE-p.x,(a.y+a.n/2)*TILE-p.y)-Math.hypot((b.x+b.n/2)*TILE-p.x,(b.y+b.n/2)*TILE-p.y)).slice(0,4);
  if(ls.length&&(watchOf(p)==='night'||Math.random()<.85)){const l=ls[rint(0,ls.length-1)];p.last=l.id;p.wait=.6+Math.random()*1.4;
    for(let k=0;k<4;k++){const c=rint(0,3),x=(l.x+(c&1?l.n:0))*TILE+(c&1?5:-5),y=(l.y+(c&2?l.n:0))*TILE+(c&2?7:-3);if(passable(terrAt(x,y))){p.wx=x;p.wy=y;return}}
    p.wx=(l.x+l.n/2)*TILE;p.wy=(l.y+l.n)*TILE+6;return}
  p.wait=0;
  const R=t.T.reach;for(let k=0;k<30;k++){const x=(t.tx+rint(-R,R)+.5)*TILE,y=(t.ty+rint(-R,R)+.5)*TILE;if(passable(terrAt(x,y))&&landHold(x,y)===t){p.wx=x;p.wy=y;return}}
  p.wx=t.x;p.wy=t.y+20;
}
// each moment on the map: PatrolBrain (brains.js)

/* meeting the guards */
// (by its captain: the watch's name, his, and its words, WATCH say)
function patrolMeet(p){
  const t=townBy(p.home),f=FACS[p.fac],c=crimeAt(t),X=WATCH[watchOf(p)],cap='Captain '+(t?watchesOf(t)[watchOf(p)].cap:'');G.pt=p;P.tx=null;G.chase=null;p.cool=6;
  if(hostileTo(p.fac))return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:watchName(p)});
  G.mode='dialog';
  if(c&&p.fac!=='player')return showPanel('<h2>The '+X.n.toLowerCase()+' of '+p.home+' stops you</h2><p><b>'+cap+'</b>: &ldquo;You have wronged the people of '+p.home+'. Pay '+c.fine+' gold to set it right, or answer for it.&rdquo;</p>'+
    '<p class="muted">'+p.troops.length+' guards of the <span style="color:'+f.col+'">'+f.n+'</span> (power '+p.power()+' vs your '+partyPower()+'). Refusing makes the '+f.n+' hostile for 20 days.</p><div class="btns">'+
    dlgBtn('pt-pay',null,'Pay '+c.fine+' gold',P.gold<c.fine?'Not enough gold':'',true)+dlgBtn('pt-fight',null,'Refuse and fight')+'</div>'+nav(null,['pt-run',null,'Run for it']));
  const S=X.say,line=p.fac==='player'?S.mine:bandits.some(b=>patrolLand(p,b.x,b.y))?S.band:S.quiet[G.day%S.quiet.length];
  showPanel('<h2>'+watchName(p)+'</h2><p class="muted">'+cap+' and '+p.troops.length+' soldiers of the <span style="color:'+f.col+'">'+f.n+'</span>, '+X.beat+' '+p.home+'.</p><p><b>'+cap+'</b>: &ldquo;'+line+'&rdquo;</p><div class="btns">'+
    (p.fac==='player'||P.fac===p.fac?'':dlgBtn('pt-attack',null,'Attack (the '+f.n+' turns hostile)'))+'</div>'+nav(null,['dlg-close',null,'Leave']));
}
function patrolAct(a){
  const p=G.pt;if(!p){closeDialog();return}const t=townBy(p.home),c=crimeAt(t);
  if(a==='pt-pay'&&c&&P.gold>=c.fine){P.gold-=c.fine;t.crime=null;addRep(t.name,2,true);G.pt=null;return notice('Fine paid','The guards take '+c.fine+' gold and let you pass. The matter is closed.','good')}
  if(a==='pt-run'){const l=Math.hypot(P.x-p.x,P.y-p.y)||1;walk(P,(P.x-p.x)/l,(P.y-p.y)/l,WORLD_SCALE.ai.slipAway);p.cool=8;G.pt=null;closeDialog();G.encCool=4;log('You slip away from the guards of '+p.home+'. They will be looking for you.','bad');return}
  if(a==='pt-fight'||a==='pt-attack'){if(!hostileTo(p.fac)){P.hostile[p.fac]=Math.max(P.hostile[p.fac]||0,G.day+20);addHonor(p.fac,a==='pt-fight'?-5:-10,true)}G.pt=null;
    return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:watchName(p)})}
}
onAct('pt-',patrolAct);
// beaten: the patrol is gone, those still standing make their way home, and that watch (only) keeps in for a while, short of
// its fallen; its holding remembers
function patrolBeaten(p){const t=townBy(p.home);W.patrols=W.patrols.filter(x=>x!==p);if(t){watchesOf(t)[watchOf(p)].off=worldTime()+PATROL.rest*DAY;watchBack(t,p)}p.gone=true;return t}
// (those you slew are its fallen, whether or not the battle took them off it already)
function patrolWon(e,slain){const p=e.ref;p.troops=p.troops.slice(0,Math.max(0,e.list.length-(slain||[]).length));const t=patrolBeaten(p);if(t){addRep(t.name,-5,true);t.crime=null}
  return ' The '+WATCH[watchOf(p)].n.toLowerCase()+' of '+p.home+' is scattered: it keeps in until tomorrow, short of its fallen, but the '+(watchOf(p)==='night'?'day':'night')+' watch still goes out.'}

/* on the map: guards on foot behind their banner */
// drawn with every party (render.js drawParties; its look: parties.js)
