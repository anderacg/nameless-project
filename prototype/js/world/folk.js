'use strict';
/* ---------- folk: workers in the fields ---------- */
// W.folk: workers, only around holdings near you (not saved). Each walks from its holding to its estate in the morning,
// works there, and walks home at dusk; they stay inside while a holding is besieged or burned.
const FOLK_R=520;
const dayPart=()=>G.clock/DAY;
const workHours=()=>dayPart()>.04&&dayPart()<NIGHT_AT-.04;

/* workers */
function folkHome(t){return{x:t.x+rint(-6,6),y:t.y+10}}
function updateFolk(d){
  W.folk=W.folk||[];
  // workers belong to nearby holdings only; far ones go
  W.folk=W.folk.filter(f=>{const t=townBy(f.home);return t&&Math.hypot(t.x-P.x,t.y-P.y)<FOLK_R+120&&!f.gone});
  if(workHours())for(const t of TOWNS){
    if(!t.bld||Math.hypot(t.x-P.x,t.y-P.y)>FOLK_R||besieged(t)||ruined(t))continue;const sp=bldSpots(t);
    for(const k in sp){const lv=bldLv(t,k),job=ESTATES[k].work;if(!lv||!job)continue;
      const have=W.folk.filter(f=>f.home===t.name&&f.k===k).length;
      if(have<Math.min(3,lv+1)&&!until(t,'fear')&&Math.random()<d*.6){const h=folkHome(t);W.folk.push({folk:true,home:t.name,k,job,x:h.x,y:h.y,tx:sp[k].x+rint(-10,10),ty:sp[k].y+rint(-6,6),st:'out',t:0,dir:1,ph:Math.random()*6})}}
  }
  for(const f of W.folk){
    const t=townBy(f.home),threat=bandits.some(b=>Math.hypot(b.x-f.x,b.y-f.y)<70)||!t||besieged(t)||until(t,'fear')&&Math.hypot(P.x-f.x,P.y-f.y)<90;
    if(f.st!=='back'&&(!workHours()||threat)){f.st='back';const h=folkHome(t||{x:f.x,y:f.y});f.tx=h.x;f.ty=h.y}
    if(f.st==='work'){f.t-=d;if(f.t<=0){f.t=.6+Math.random()*1.2;const sp=bldSpots(t)[f.k];if(sp){f.tx=sp.x+rint(-12,12);f.ty=sp.y+rint(-7,7)}}}
    const dx=f.tx-f.x,dy=f.ty-f.y,dd=Math.hypot(dx,dy);
    if(dd>1.5){f.dir=dx>=0?1:-1;f.moving=true;if(!routeTo(f,f.tx,f.ty,(threat?16:9)*d)){// no way there over land: home, or gone if home is out of reach too
      if(f.st==='back')f.gone=true;else{f.st='back';const h=folkHome(t||{x:f.x,y:f.y});f.tx=h.x;f.ty=h.y}}}
    else{f.moving=false;if(f.st==='out'){f.st='work';f.t=.5}else if(f.st==='back')f.gone=true}
  }
}
function folkSprite(job,frame){
  const key='fk'+job+frame;if(spr[key])return spr[key];const J=JOBS[job];
  return spr[key]=cellOf(mkc(7,9,g=>{const r=(c,x,y,w,h)=>rect(g,c,x,y,w||1,h||1);
    r('#e8c39e',2,0,3,3);r(job==='farmer'?'#d8c060':'#5a3a20',1,0,5,1);r(J.col,2,3,3,3);r('#4a3a2a',2,6,1,2+(frame?0:1));r('#4a3a2a',4,6,1,2+(frame?1:0));
    if(job==='woodcutter'||job==='miner'){r('#7a5a3a',5,1,1,5);r(J.tool,5,1,2,1)}else if(job==='fisher'){r('#7a5a3a',5,0,1,6);r(J.tool,6,0,1,4)}else{r('#7a5a3a',5,2,1,5);r(J.tool,5,1,1,1)}}));
}

function drawFolk(ents,cam,V){
  for(const f of W.folk||[]){if(Math.abs(f.x-P.x)>V*1.3||Math.abs(f.y-P.y)>V*1.3)continue;
    ents.push({y:f.y,f:()=>{const fr=f.moving?Math.floor((performance.now()/180+f.ph))%2:0,s=folkSprite(f.job,fr),sx=Math.round(f.x-cam.x),sy=Math.round(f.y-cam.y);
      ctx.save();ctx.translate(sx,sy);if(f.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-16+(f.st==='work'&&!f.moving&&Math.floor(performance.now()/300+f.ph)%2?1:0));ctx.restore()}})}
}

/* meeting a worker: talk, hire, rob or press-gang */
function workerMeet(f){
  const t=townBy(f.home);if(!t)return;G.wk=f;G.mode='dialog';P.tx=null;G.chase=null;ensureEcon(t);
  const short=Object.keys(GOODS).filter(g=>marketState(t,g)==='shortage').slice(0,3).map(g=>GOODS[g].n.toLowerCase()),glut=Object.keys(GOODS).filter(g=>marketState(t,g)==='surplus').slice(0,3).map(g=>GOODS[g].n.toLowerCase());
  const own=t.owner==='player',lv=levyOf(t.races[0]),c=hireCost(lv),[g,n]=jobGood(t,f.job);
  showPanel('<div class="top"><h2>'+cap1(an(f.job))+' of '+t.name+'</h2><span class="muted">'+(t.owner?'Subject of the '+FACS[t.owner].n:'')+'</span></div>'+
    '<p>&ldquo;'+(foodDays(t)<2?'There is hardly any bread left in '+t.name+'.':t.pros>70?'Good times in '+t.name+'.':'We get by.')+(short.length?' We are short of '+short.join(', ')+'.':'')+(glut.length?' There is plenty of '+glut.join(', ')+'.':'')+'&rdquo;</p>'+
    '<p class="muted">'+t.name+': '+t.pop+' people, prosperity '+Math.round(t.pros)+'%, food for '+foodDays(t)+' days.</p><div class="btns">'+
    dlgBtn('wk-hire',null,'Hire as '+ST[lv].n.toLowerCase()+' '+c+'g',partyRoom()<1?'Your band is full':P.gold<c?'Not enough gold':!canHire(t,lv)&&!own?'They do not trust you':'')+
    (own?'':dlgBtn('wk-rob',null,'Rob them ('+n+' '+GOODS[g].n.toLowerCase()+')'))+(own?'':dlgBtn('wk-press',null,'Press-gang into your band',partyRoom()<1?'Your band is full':''))+
    dlgBtn('dlg-close',null,'Leave',null,true)+'</div>'+(own?'':'<p class="muted">Robbing or press-ganging: reputation in '+t.name+' falls, the '+(t.owner?FACS[t.owner].n:'owner')+' resents it, and its workers flee the fields for a while.</p>'));
}
function workerAct(a){
  const f=G.wk,t=f&&townBy(f.home);if(!t){closeDialog();return}
  const take=()=>{f.gone=true;W.folk=W.folk.filter(x=>x!==f);t.pop=Math.max(10,t.pop-1)};
  if(a==='wk-hire'){const lv=levyOf(t.races[0]),c=hireCost(lv);if(partyRoom()<1||P.gold<c||!canHire(t,lv)&&t.owner!=='player')return;P.gold-=c;P.add(lv);take();
    return notice('A new recruit','The '+f.job+' lays down the '+(f.job==='farmer'?'hoe':'tools')+' and joins your band as '+an(ST[lv].n.toLowerCase())+'. '+t.name+' has one less pair of hands.','good')}
  if(a==='wk-rob'){const [g,n]=jobGood(t,f.job);ensureEcon(t);const k=invAdd('good',g,Math.min(n,Math.max(1,t.stock[g]||0)));t.stock[g]=Math.max(0,(t.stock[g]||0)-k);const gold=rint(2,6);P.gold+=gold;
    const cost=wrong(t,CONDUCT.robWorker);mood('cruel');return notice('Robbed','You take '+k+' '+GOODS[g].n.toLowerCase()+' and '+gold+' coins. The workers of '+t.name+' run for home. It costs you: '+cost+'.','bad')}
  if(a==='wk-press'){if(partyRoom()<1)return;const lv=levyOf(t.races[0]);P.add(lv);take();const cost=wrong(t,CONDUCT.pressWorker);mood('cruel');
    return notice('Press-ganged','Your soldiers drag the '+f.job+' into the ranks. '+cap1(an(ST[lv].n.toLowerCase()))+' joins, unwilling, and the fields of '+t.name+' empty for days. It costs you: '+cost+'.','bad')}
}
onAct('wk-',workerAct);
