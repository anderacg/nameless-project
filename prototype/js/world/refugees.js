'use strict';
/* ---------- refugees: people leaving a ruined holding for a better one ---------- */
// W.refugees: {rf, from, to, n, why, race, goods, purse, x, y, dir, cool}. People leave a holding that is sacked, raided, starving,
// besieged or miserable for a friendly holding nearby that is doing better: they come off its people when they set out and
// join the other's when they arrive. Bandits rob them on the way; you can feed, settle, recruit or rob them.
const REFUGEE_CAP=Math.round(14*MAP_DENS),REFUGEE_SPD=11;
// why people would leave a holding, or '' if they stay
function fleeReason(t){ensureEcon(t);return until(t,'sacked')?'sacked':until(t,'raided')?'raided':foodDays(t)<1?'hunger':besieged(t)?'siege':t.pros<25?'hardship':until(t,'turmoil')&&t.pros<45?'conquest':housingFull(t)?'crowded':''}
// where they go: the nearest holding not at war with theirs that is fed, unbesieged and clearly better off
function refuge(t){
  let best=null,bd=1e9;const crowded=housingFull(t)&&fleeReason(t)==='crowded';
  for(const o of TOWNS){if(o===t||!o.owner||besieged(o)||ruined(o)||atWar(o.owner,t.owner))continue;ensureEcon(o);if(crowded?(housing(o)-(o.pop||0)<15||foodDays(o)<3):(o.pros<t.pros+15||foodDays(o)<3))continue;
    const d=Math.hypot(o.tx-t.tx,o.ty-t.ty);if(d<bd&&d<70){bd=d;best=o}}
  return best;
}
function sendRefugees(t,to,why){
  const n=Math.min(t.pop-20,rint(6,14)+(why==='sacked'?8:0));if(n<4)return null;t.pop-=n;ensureEcon(t);
  const goods={};for(const g of ['grain','cheese','cloth']){const k=Math.min(t.stock[g]||0,rint(0,3));if(k){goods[g]=k;t.stock[g]-=k}}
  const r={rf:true,from:t.name,to:to.name,n,why,race:t.races[rint(0,t.races.length-1)],goods,purse:rint(5,12)+Math.round(n*1.5),x:t.x+rint(-6,6),y:t.y+14,dir:1,cool:0};
  W.refugees.push(r);
  if(t.owner==='player'||Math.hypot(t.x-P.x,t.y-P.y)<vis()*1.5)log(n+' people leave '+t.name+' for '+to.name+': '+REFUGEE_WHY[why]+'.',t.owner==='player'?'bad':'');
  return r;
}
function refugeeDay(){
  for(const t of TOWNS){if(W.refugees.length>=REFUGEE_CAP)break;const why=fleeReason(t);if(!why||t.pop<=30||Math.random()>(why==='hardship'||why==='conquest'||why==='crowded'?.12:.3))continue;
    if(W.refugees.some(r=>r.from===t.name))continue;const to=refuge(t);if(to)sendRefugees(t,to,why)}
}
function refugeesArrive(r,to){
  ensureEcon(to);to.pop+=r.n;for(const g in r.goods)to.stock[g]=(to.stock[g]||0)+r.goods[g];to.pros=Math.max(0,to.pros-Math.min(4,r.n/8));
  if(to.owner==='player')log(r.n+' refugees from '+r.from+' settle in '+to.name+'.','good');
}
function updateRefugees(d){
  const hide=hiddenAt(P.x,P.y)?.55:1;
  for(const r of W.refugees){
    r.cool=Math.max(0,r.cool-d);let to=townBy(r.to);
    if(!to||besieged(to)||to.owner!=='player'&&atWar(to.owner,(townBy(r.from)||{}).owner)){const f=townBy(r.from);to=f&&refuge(f);if(!to){r.gone=true;continue}r.to=to.name}
    const dx=P.x-r.x,dy=P.y-r.y,pd=Math.hypot(dx,dy),afraid=!P.stay&&r.fear&&pd<70*hide;
    if(afraid){walk(r,-dx,-dy,REFUGEE_SPD*1.2*d);r.dir=dx>0?-1:1}
    else{const ox=r.x;travelTo(r,to,to.x,to.y+12,REFUGEE_SPD*Math.max(.5,speedAt(r.x,r.y)||1)*d);r.dir=r.x>=ox?1:-1}
    if(Math.hypot(to.x-r.x,to.y+12-r.y)<8){refugeesArrive(r,to);r.gone=true;continue}
    // bandits rob them of what they carry, and some do not survive it
    const b=!r.robbed&&bandits.find(o=>Math.hypot(o.x-r.x,o.y-r.y)<12);
    if(b){r.robbed=true;r.goods={};r.purse=0;r.n=Math.max(2,r.n-rint(0,2));if(pd<vis())log('Bandits fall on refugees from '+r.from+'.','bad')}
    if(pd<10&&r.cool<=0&&!G.modal&&G.chase===r){refugeeMeet(r);return true}
  }
  W.refugees=W.refugees.filter(r=>!r.gone);return false;
}

/* meeting refugees */
/* refugees */
function refugeeMeet(r){
  G.rf=r;G.mode='dialog';P.tx=null;G.chase=null;r.cool=4;const mine=playerFiefs().filter(t=>!besieged(t)),k=Math.min(3,Math.floor(r.n/4),partyRoom());
  showPanel('<div class="top"><h2>Refugees from '+r.from+'</h2><span class="muted">Bound for '+r.to+'</span></div>'+
    '<p>'+r.n+' '+RACES[r.race].n.toLowerCase()+' folk on the road, because '+REFUGEE_WHY[r.why]+'. They carry '+(Object.keys(r.goods).length?Object.keys(r.goods).map(g=>r.goods[g]+' '+GOODS[g].n.toLowerCase()).join(', ')+' and ':'')+(r.purse?'a few coins':'almost nothing')+'.</p><div class="btns">'+
    dlgBtn('rf-feed',null,'Share '+CONDUCT.feedRefugees.food+' food',r.fed?'Already fed':foodN()<CONDUCT.feedRefugees.food?'Not enough food':'')+
    (mine.length&&townBy(r.to).owner!=='player'?dlgBtn('rf-settle',null,'Offer them a home in '+nearestOf(r,mine).name):'')+
    dlgBtn('rf-recruit',null,'Ask for volunteers ('+k+')',k<1?(partyRoom()<1?'Your band is full':'Too few of them'):r.asked?'Already asked':'')+
    dlgBtn('rf-rob',null,'Rob them',r.robbed?'Nothing left to take':'')+'</div>'+
    '<p class="muted">Kindness is remembered in '+r.from+' and '+r.to+'; robbing refugees shames you with both, and with their lords.</p>'+nav(null,['dlg-close',null,'Leave']));
}
function refugeeAct(a){
  const r=G.rf;if(!r){closeDialog();return}const from=townBy(r.from),to=townBy(r.to);
  const C=CONDUCT;
  if(a==='rf-feed'&&!r.fed&&foodN()>=C.feedRefugees.food){const c=C.feedRefugees;foodTake(c.food);r.fed=true;if(from)addRep(from.name,c.rep,true);if(to)addRep(to.name,c.repTo,true);if(from&&from.owner&&from.owner!=='player')addHonor(from.owner,c.honor,true);mood('kind');
    return notice('Fed','They bless your name. Reputation in '+r.from+' +'+c.rep+' and in '+r.to+' +'+c.repTo+'.','good')}
  if(a==='rf-settle'){const home=nearestOf(r,playerFiefs().filter(t=>!besieged(t)));if(!home)return;r.to=home.name;const c=C.settleRefugees;if(from)addRep(from.name,c.rep,true);if(from&&from.owner&&from.owner!=='player')addHonor(from.owner,-c.honor,true);
    return notice('A new home','They turn toward '+home.name+'. '+r.n+' more people will live and pay taxes there. The '+(from&&from.owner&&from.owner!=='player'?FACS[from.owner].n+' grumbles at losing them (−'+c.honor+' honor).':'road is long.'),'good')}
  if(a==='rf-recruit'&&!r.asked){const k=Math.min(3,Math.floor(r.n/4),partyRoom());if(k<1)return;const lv=levyOf(r.race);if(!partyRoster(P).canAdd(lv))return;r.asked=true;P.add(lv,k);r.n-=k;if(from)addRep(from.name,-2,true);
    return notice('Volunteers',k+' of them take up arms with you as '+ST[lv].n.toLowerCase()+(k>1?'s':'')+'. Fewer will reach '+r.to+'.','good')}
  if(a==='rf-rob'&&!r.robbed){const got=Object.keys(r.goods).map(g=>{const k=invAdd('good',g,r.goods[g]);return k?k+' '+GOODS[g].n.toLowerCase():''}).filter(Boolean),gold=r.purse;P.gold+=gold;r.goods={};r.purse=0;r.robbed=true;r.fear=true;r.n=Math.max(2,r.n-rint(1,3));
    const c=C.robRefugees,cost=[from&&wrong(from,{rep:c.rep,honor:c.honor,morale:c.morale}),to&&to!==from&&wrong(to,{rep:c.repTo,honor:c.honorTo})].filter(Boolean).join(', ');mood('cruel');
    return notice('Robbed','You take '+(got.length?got.join(', ')+' and ':'')+gold+' gold. Some of them die on the road, and word spreads. It costs you: '+cost+'.','bad')}
}

/* on the map */
// (a refugee on the map: people.js refugeeSprite)
function drawRefugees(ents,cam,V){
  for(const r of W.refugees){if(Math.hypot(r.x-P.x,r.y-P.y)>V*1.2)continue;
    ents.push({y:r.y,f:()=>{const sx=Math.round(r.x-cam.x),sy=Math.round(r.y-cam.y),k=Math.min(6,Math.max(3,Math.ceil(r.n/3))),mv=performance.now();ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(sx-8,sy-1,16,2);
      for(let i=0;i<k;i++){const px=sx-r.dir*((i%3)*6-6)+(i>2?-r.dir*3:0),py=sy-(i>2?3:0);const s=refugeeSprite(Math.floor(mv/220+i)%2,i);ctx.save();ctx.translate(px,py);if(r.dir<0)ctx.scale(-1,1);ctx.drawImage(s,-8,-15);ctx.restore()}
      if(Math.hypot(r.x-P.x,r.y-P.y)<90)txt('Refugees '+r.n,sx,sy-12,r.fear?'#ff9a90':'#c8c2ae','center')}})}
}
onAct('rf-',refugeeAct);
