'use strict';
/* ---------- folk: workers at the estates ---------- */
// W.folk: workers, only around holdings near you (not saved). Every estate's workers live and work at it, inside its building
// (unseen), and once a day carry what they made to their holding: each sets out at his own hour between the afternoon and dusk
// (DELIVER), walks to its gate with his load, stops in a little while, and walks back to the estate and in again. Met at their
// estate (a click on it: estates.js estateMeet); one out on the road, where he walks (to talk to, hire, rob or press-gang).
// st: 'in' (at work inside), 'out' (to the holding, loaded), 'town' (delivering, inside its gate), 'back' (home to the estate)
const FOLK_R=520;
// (the estates whose workers you have come near: town|estate; forgotten once you are far)
const FOLK_SEEN=new Set();
const dayPart=()=>G.clock/DAY;
// the hours a delivery may start (share of the day: the afternoon to the end of dusk), and how long it takes inside the gate
const DELIVER={from:.45,to:.66,stop:[1.5,3.5]};

/* workers */
function folkHome(t){return{x:t.x+rint(-6,6),y:t.y+10}}
// an estate's door: where its workers go in and come out (the front of its building)
function folkDoor(t,k){const sp=bldSpots(t)[k];return sp?{x:sp.x+rint(-3,3),y:sp.y+5}:folkHome(t)}
// out on the map (seen, and met where he walks): on the way to the holding or back
const folkOut=f=>f.st==='out'||f.st==='back';
function updateFolk(d){
  W.folk=W.folk||[];
  // workers belong to nearby holdings only; far ones go
  W.folk=W.folk.filter(f=>{const t=townBy(f.home);return t&&Math.hypot(t.x-P.x,t.y-P.y)<FOLK_R+120&&!f.gone});
  for(const key of FOLK_SEEN){const t=townBy(key.split('|')[0]);if(!t||Math.hypot(t.x-P.x,t.y-P.y)>FOLK_R+120)FOLK_SEEN.delete(key)}/* (out of reach: met afresh next time) */
  const now=dayPart(),win=now>=DELIVER.from&&now<DELIVER.to;
  for(const t of TOWNS){if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>FOLK_R||ruined(t))continue;const sp=bldSpots(t);
    for(const k in sp){const lv=bldLv(t,k),job=ESTATES[k]&&ESTATES[k].work;if(!lv||!job)continue;
      // (all of them there as you come near; one taken or fled comes back only slowly, so a hire or a press-gang shows)
      const key=t.name+'|'+k,first=!FOLK_SEEN.has(key);FOLK_SEEN.add(key);
      for(let have=W.folk.filter(f=>f.home===t.name&&f.k===k).length;have<Math.min(3,lv+1)&&(first||Math.random()<d*.02);have++){const at=folkDoor(t,k),leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from);
        W.folk.push({folk:true,home:t.name,k,job,x:at.x,y:at.y,tx:at.x,ty:at.y,st:'in',leave,done:now>leave?G.day:-1,dir:1,ph:Math.random()*6})}}}
  for(const f of W.folk){
    const t=townBy(f.home);if(!t){f.gone=true;continue}
    const threat=bandits.some(b=>Math.hypot(b.x-f.x,b.y-f.y)<70)||until(t,'fear')&&Math.hypot(P.x-f.x,P.y-f.y)<90;
    // at work inside: out with the day's load at his hour (not while the holding is besieged or afraid)
    if(f.st==='in'){f.moving=false;if(win&&f.done!==G.day&&now>=f.leave&&!besieged(t)&&!until(t,'fear')){const g=folkHome(t);f.st='out';f.tx=g.x;f.ty=g.y}continue}
    // delivering inside the gate: then back to the estate
    if(f.st==='town'){f.wait-=d;if(f.wait<=0){const g=folkHome(t),door=folkDoor(t,f.k);f.x=g.x;f.y=g.y;f.tx=door.x;f.ty=door.y;f.st='back'}continue}
    const dx=f.tx-f.x,dy=f.ty-f.y,dd=Math.hypot(dx,dy);
    if(dd>1.5){f.dir=dx>=0?1:-1;f.moving=true;if(routeTo(f,f.tx,f.ty,(threat?16:9)*d))continue}
    // (there, or no way there: in at the gate, or in at the estate's door; a new hour for tomorrow's load)
    f.moving=false;
    if(f.st==='out'){f.st='town';f.wait=DELIVER.stop[0]+Math.random()*(DELIVER.stop[1]-DELIVER.stop[0]);f.done=G.day;f.leave=DELIVER.from+Math.random()*(DELIVER.to-DELIVER.from)}
    else if(f.st==='back'){f.st='in';const door=folkDoor(t,f.k);f.x=door.x;f.y=door.y}
  }
}
// a worker on the map: the people's figure with the trade's tool (people.js workerSprite), the home's race
// (carry: his load on his back, on the way to the holding)
function folkSprite(job,frame,race,v,carry){return workerSprite(job,frame,race,v,carry)}

function drawFolk(ents,cam,V){
  // (only those out on the road: the rest are at work inside their estate, or delivering inside the gate)
  for(const f of W.folk||[]){if(!folkOut(f)||Math.abs(f.x-P.x)>V*1.3||Math.abs(f.y-P.y)>V*1.3)continue;
    ents.push({y:f.y,f:()=>{const fr=f.moving?Math.floor((performance.now()/180+f.ph))%2:0,t=townBy(f.home),s=folkSprite(f.job,fr,t&&t.races?t.races[0]:'human',Math.floor(f.ph*7),f.st==='out'),sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y);
      ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-3,sy-1,6,2);ctx.save();ctx.translate(sx,sy);if(f.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-14);ctx.restore()}})}
}

/* meeting a worker: talk, hire, rob or press-gang */
// (from: the estate it was opened from: Back returns there)
function workerMeet(f,from){
  const t=townBy(f.home);if(!t)return;G.wk=f;G.wkFrom=from||null;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const short=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage').slice(0,3).map(g=>GOODS[g].n.toLowerCase()),glut=Object.keys(GOODS).filter(g=>marketState(t,g)==='surplus').slice(0,3).map(g=>GOODS[g].n.toLowerCase());
  const own=t.owner==='player',lv=levyOf(t.races[0]),c=hireCost(lv),[g,n]=jobGood(t,f.job);
  showPanel('<div class="top"><h2>'+cap1(an(f.job))+' of '+t.name+'</h2><span class="muted">'+(t.owner?'Subject of the '+FACS[t.owner].n:'')+'</span></div>'+
    '<p>&ldquo;'+(foodDays(t)<2?'There is hardly any bread left in '+t.name+'.':t.pros>70?'Good times in '+t.name+'.':'We get by.')+(short.length?' We are short of '+short.join(', ')+'.':'')+(glut.length?' There is plenty of '+glut.join(', ')+'.':'')+'&rdquo;</p>'+
    '<p class="muted">'+t.name+': '+t.pop+' people, prosperity '+Math.round(t.pros)+'%, food for '+foodDays(t)+' days.</p><div class="btns">'+
    dlgBtn('wk-hire',null,'Hire as '+ST[lv].n.toLowerCase()+' '+c+'g',partyRoom()<1?'Your band is full':P.gold<c?'Not enough gold':!canHire(t,lv)&&!own?'They do not trust you':'')+
    (own?'':dlgBtn('wk-rob',null,'Rob them ('+n+' '+GOODS[g].n.toLowerCase()+')'))+(own?'':dlgBtn('wk-press',null,'Press-gang into your band',partyRoom()<1?'Your band is full':''))+
    '</div>'+(own?'':'<p class="muted">Robbing or press-ganging: reputation in '+t.name+' falls, the '+(t.owner?FACS[t.owner].n:'owner')+' resents it, and its workers flee the fields for a while.</p>')+nav(G.wkFrom?['wk-back',null,'Back']:null,['dlg-close',null,'Leave']));
}
function workerAct(a){
  const f=G.wk,t=f&&townBy(f.home);if(!t){closeDialog();return}
  if(a==='wk-back'){const o=G.wkFrom;G.wk=null;G.wkFrom=null;if(o)estateMeet(o);else closeDialog();return}
  const take=()=>{f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,t.pop-1)};
  if(a==='wk-hire'){const lv=levyOf(t.races[0]),c=hireCost(lv);if(partyRoom()<1||P.gold<c||!canHire(t,lv)&&t.owner!=='player')return;P.gold-=c;P.add(lv);take();
    return notice('A new recruit','The '+f.job+' lays down the '+(f.job==='farmer'?'hoe':'tools')+' and joins your band as '+an(ST[lv].n.toLowerCase())+'. '+t.name+' has one less pair of hands.','good')}
  if(a==='wk-rob'){const [g,n]=jobGood(t,f.job);ensureEcon(t);const k=invAdd('good',g,Math.min(n,Math.max(1,t.stock[g]||0)));t.stock[g]=Math.max(0,(t.stock[g]||0)-k);const gold=rint(2,6);P.gold+=gold;
    const cost=wrong(t,CONDUCT.robWorker);mood('cruel');return notice('Robbed','You take '+k+' '+GOODS[g].n.toLowerCase()+' and '+gold+' coins. The workers of '+t.name+' run for home. It costs you: '+cost+'.','bad')}
  if(a==='wk-press'){if(partyRoom()<1)return;const lv=levyOf(t.races[0]);P.add(lv);take();const cost=wrong(t,CONDUCT.pressWorker);mood('cruel');
    return notice('Press-ganged','Your soldiers drag the '+f.job+' into the ranks. '+cap1(an(ST[lv].n.toLowerCase()))+' joins, unwilling, and the fields of '+t.name+' empty for days. It costs you: '+cost+'.','bad')}
}
onAct('wk-',workerAct);
