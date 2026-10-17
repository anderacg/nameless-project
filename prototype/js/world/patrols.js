'use strict';
/* ---------- patrols: every holding's guards ride its land ---------- */
// W.patrols: {pt, watch, home, fac, troops, x, y, wx, wy (waypoint), wait, last, cool, dir}. A holding keeps two watches: the
// day watch and the night watch (watch: 'day' | 'night'). The watch on duty goes out from the garrison when it can be spared
// (its soldiers leave the garrison while it is out), and at the change of the watch, at dusk and at dawn, it walks home and
// rejoins the garrison as the other sets out. It walks its beat round the holding's buildings (the day watch also rides out
// over its land; the night watch keeps close, by torchlight), hunts bandits there, fights an enemy army it can beat and runs
// home from one it can't. It goes home at once when the holding is besieged, or when it is down to half.
// The guards stop you if you have wronged the holding lately (t.crime: pay the fine or fight) and attack if their realm is
// hostile to you. Your own fiefs' guards ride for you.
const patrolOf=t=>W.patrols.find(p=>p.home===t.name);
// the watch on duty: the night watch from nightfall to dawn
const watchNow=()=>G.clock/DAY>=NIGHT_AT?'night':'day';
const watchOf=p=>p.watch||'day';
// a holding sends out the watch on duty, if it is not out already and the garrison can spare it
function sendWatch(t){
  if(!t.owner||besieged(t)||ruined(t)||(t.watchOff||0)>worldTime())return;const w=watchNow();if(W.patrols.some(p=>p.home===t.name&&watchOf(p)===w))return;
  const n=t.T.patrol.size;if(t.gar<t.T.patrol.keep+n)return;
  t.gar-=n;W.patrols.push(asParty({pt:true,watch:w,home:t.name,fac:t.owner,troops:garList({gar:n,races:t.races}),x:t.x+rint(-6,6),y:t.y+14,wx:null,wy:null,cool:0,dir:1}));
}
let watchCheck=0;
const crimeAt=t=>t&&t.crime&&t.crime.until>G.day?t.crime:null;
// is (x, y) land the patrol guards: its holding's, or another holding of the same realm's
const patrolLand=(p,x,y)=>{const h=landHold(x,y);return !!h&&(h.name===p.home||h.owner===p.fac)};
function patrolDay(){for(const t of TOWNS)sendWatch(t)}
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
function patrolMeet(p){
  const t=townBy(p.home),f=FACS[p.fac],c=crimeAt(t);G.pt=p;P.tx=null;G.chase=null;p.cool=6;
  if(hostileTo(p.fac))return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:'Guards of '+p.home});
  G.mode='dialog';
  if(c&&p.fac!=='player')return showPanel('<h2>The guards of '+p.home+' stop you</h2><p>&ldquo;You have wronged the people of '+p.home+'. Pay '+c.fine+' gold to set it right, or answer for it.&rdquo;</p>'+
    '<p class="muted">'+p.troops.length+' guards of the <span style="color:'+f.col+'">'+f.n+'</span> (power '+p.power()+' vs your '+partyPower()+'). Refusing makes the '+f.n+' hostile for 20 days.</p><div class="btns">'+
    dlgBtn('pt-pay',null,'Pay '+c.fine+' gold',P.gold<c.fine?'Not enough gold':'',true)+dlgBtn('pt-fight',null,'Refuse and fight')+dlgBtn('pt-run',null,'Run for it')+'</div>');
  const band=bandits.filter(b=>patrolLand(p,b.x,b.y)).length;
  showPanel('<h2>'+(watchOf(p)==='night'?'The night watch of ':'Guards of ')+p.home+'</h2><p class="muted">'+p.troops.length+' soldiers of the <span style="color:'+f.col+'">'+f.n+'</span> riding the land of '+p.home+'.</p><p>&ldquo;'+
    (p.fac==='player'?'All quiet, my lord.':band?'Bandits have been seen on our land. Keep your eyes open.':'The roads are safe, for now.')+'&rdquo;</p><div class="btns">'+
    (p.fac==='player'||P.fac===p.fac?'':dlgBtn('pt-attack',null,'Attack (the '+f.n+' turns hostile)'))+'</div>'+nav(null,['dlg-close',null,'Leave']));
}
function patrolAct(a){
  const p=G.pt;if(!p){closeDialog();return}const t=townBy(p.home),c=crimeAt(t);
  if(a==='pt-pay'&&c&&P.gold>=c.fine){P.gold-=c.fine;t.crime=null;addRep(t.name,2,true);G.pt=null;return notice('Fine paid','The guards take '+c.fine+' gold and let you pass. The matter is closed.','good')}
  if(a==='pt-run'){const l=Math.hypot(P.x-p.x,P.y-p.y)||1;walk(P,(P.x-p.x)/l,(P.y-p.y)/l,40);p.cool=8;G.pt=null;closeDialog();G.encCool=4;log('You slip away from the guards of '+p.home+'. They will be looking for you.','bad');return}
  if(a==='pt-fight'||a==='pt-attack'){if(!hostileTo(p.fac)){P.hostile[p.fac]=Math.max(P.hostile[p.fac]||0,G.day+20);addHonor(p.fac,a==='pt-fight'?-5:-10,true)}G.pt=null;
    return startEncounter({kind:'patrol',ref:p,list:p.troops.slice(),title:'Guards of '+p.home})}
}
onAct('pt-',patrolAct);
// beaten: the patrol is gone, its holding sends no watch out for a while, and remembers
function patrolBeaten(p){const t=townBy(p.home);p.gone=true;W.patrols=W.patrols.filter(x=>x!==p);if(t)t.watchOff=worldTime()+PATROL.rest*DAY;return t}
function patrolWon(e){const p=e.ref,t=patrolBeaten(p);if(t){addRep(t.name,-5,true);t.crime=null}return ' The guards of '+p.home+' are scattered: '+p.home+' sends no watch out until tomorrow.'}

/* on the map: guards on foot behind their banner */
// drawn with every party (render.js drawParties; its look: parties.js)
