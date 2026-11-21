'use strict';
// The campaign and mobile presenters register destinations; this is the only owner that moves shared controls.
const HudControls={
  records:new Map(),
  bind(el,to,active,priority){
    if(!el||!to)throw new Error('A HUD control or its destination is missing');
    let record=this.records.get(el);
    if(!record){const home=document.createComment('HUD control home');el.before(home);record={el,home,routes:[]};this.records.set(el,record)}
    record.routes.push({to,active,priority});record.routes.sort((a,b)=>b.priority-a.priority);
    return{el,home:record.home,to};
  },
  sync(){
    for(const record of this.records.values()){
      const route=record.routes.find(r=>r.active());
      if(route){if(record.el.parentNode!==route.to)route.to.appendChild(record.el)}
      else if(record.el.previousSibling!==record.home)record.home.after(record.el);
    }
  }
};

/* the band card (top left; doc/SUPPLY_DESIGN.md §8; the owner, 2026-10-23): your band's name, big (a button: the Names window,
   ui/names.js), under it your hero's name (else your race and past), level and rank, her portrait and the points to spend; three
   bars, each in %: Fitness (world/supply.js bandFitness: the fit and your hero's health over the whole band; red under half; on
   hover the fit, the wounded, your hero's health and what hurt them lately), Morale (P.morale; red under 30; on hover the
   troops' nerve it drifts toward) and Stamina (green, amber Tired, red Exhausted, the state's word by its %, an arrow for which
   way it goes: ▼ draining, ▲ coming back; on hover its rate an hour and why); while the waterskins fill, a thin bar under them
   (Filling waterskins, in %: world/supply.js SKINS); the tags that apply (Tired, Exhausted, Thirsty,
   Hungry, Cold, In camp: on hover, why); gold, food and drink in days at the current rate, furs in or near the frost or when
   carried, troops, power and pace as icon chips (what runs short is red); where you are and whom you serve. Your hero's health
   and mana are in the Hero window (C) and the battle. The top bar: the day and the time */
// the left panel's group at the bottom left (the owner, 2026-11-04: "a level up button at the bottom left corner ... like a square
// box and animated in blinking"): its one notice now, the skill points your levels left you to spend (treePending), a square that
// blinks till they are spent; a click opens your Skill trees (as K) on a tree that has a node to take. None: the group hidden
function lvBox(){const el=$('#lgroup');if(!el)return;const n=typeof treePending==='function'?treePending().length:0,sig=String(n);if(el.dataset.sig===sig)return;el.dataset.sig=sig;el.hidden=!n;
  const what=n+' skill point'+(n>1?'s':'');
  el.innerHTML=n?'<button class="lvup" type="button" title="'+what+' to spend (K)" aria-label="'+what+' to spend">'+icon('skills',22)+'<b>+'+n+'</b><small>Skill point'+(n>1?'s':'')+'</small></button>':''}
{const g=document.getElementById('lgroup');if(g)g.addEventListener('click',e=>{if(!e.target.closest('.lvup'))return;if(G.mode==='skills')return;const t=treePending()[0];
  if(t)G.skTree=t;openSkills('talents')})}
function updateHUD(force){
  lvBox();
  const el=$('#stats');if(!el)return;const cnt=partySize(),cap=partyCap(),S=supplyNow(),F=bandFitness(),fp=Math.round(F.pct),mo=Math.round(P.morale),lh=landHold(P.x,P.y),sp=bandPace();
  const bar=(v,cls,txt,title)=>'<div class="bar '+cls+'" title="'+title+'"><i style="width:'+Math.max(0,Math.min(100,Math.round(v)))+'%"></i><em>'+(window.campaignHud?window.campaignHud.condition(cls.split(' ')[0],v):txt)+'</em></div>';
  const chip=(ic,val,title,warn,cls)=>'<span class="chip'+(warn?' warn':'')+'" title="'+title+'">'+icon(ic,14)+'<span'+(cls?' class="'+cls+'"':'')+'>'+val+'</span></span>';
  const days=d=>(d>=10?Math.floor(d):Math.floor(d*10)/10)+'d',rate=S.r.n,go=S.go?'on the march':'at rest';
  const arrow=rate<0?' ▼':rate>0&&P.bsta<100?' ▲':'',word={tired:'Tired',exhausted:'Exhausted'}[S.st],hurt=BAND.hurt.map(h=>h.why).join(', ');
  const staTip='Your band’s stamina '+Math.round(P.bsta)+'%'+(rate?': '+(rate>0?'+':'')+Math.round(rate*10)/10+' an hour ('+S.r.why.join(', ')+')':'')+'. Tired under '+SUPPLY.tired+'%, Exhausted under '+SUPPLY.exhausted+'%.';
  const fit0='Your band’s fitness '+fp+'%: '+F.fit+' fit, '+F.wounded+' wounded, your hero at '+Math.round(F.hp*100)+'% health'+(hurt?'. Lately: '+hurt:'')+'.',hl=healthLines(),fitTip=fit0+(hl?' '+hl:'');
  const moTip='Your band’s morale '+mo+'%'+(bandNerve()!=null?': your troops’ nerve is '+Math.round(bandNerve())+', and it drifts toward it':'')+'.';
  const foodTip='Food: '+(FOODS.filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+', about '+days(S.foodDays)+' '+go;
  const tags=[...S.tags,burdenTag()].filter(Boolean);// (an overfilled bag: Burdened, core/inventory.js)
  const drinkTip='Drink: '+(drinkOrder(S.L).filter(g=>goodN(g)).map(g=>GOODS[g].n+' '+goodN(g)).join(', ')||'none')+', about '+days(S.drinkDays)+' '+go+(S.L.desert?' (in the desert, water only)':'')+(BAND.liquor?', liquor first':'')+', '+skinsTip();
  const who=RACES[P.race].n+' '+(BGS[P.bg]?BGS[P.bg].n:'');
  setHtml(el,'<div class="pc-head"><img class="pc-pic" src="'+portrait('hero',true)+'" alt=""><div class="pc-who"><button class="pc-band" type="button" data-act="nm-open" title="'+htmlText(bandName())+': rename your band and your hero">'+htmlText(bandName())+'</button>'+
      '<small title="'+htmlText((heroName()?heroName()+', ':'')+who)+', Level '+P.level+', '+rankName()+'">'+htmlText(heroName()||who)+', Lv '+P.level+', '+rankName()+'</small></div>'+
'</div>'+
    '<div class="bars">'+bar(fp,'fit'+(fp<50?' low':''),'Fitness<b>'+fp+'%</b>',fitTip)+bar(mo,'mor'+(mo<30?' low':''),'Morale<b>'+mo+'%</b>',moTip)+
      bar(P.bsta,'sta '+S.st,'Stamina'+arrow+'<b>'+(word?word+', ':'')+Math.round(P.bsta)+'%</b>',staTip)+'</div>'+
    (S.fill!=null?'<div class="pc-fill" title="Filling your waterskins: '+S.fill+'%. Any order stops it; you keep what is in."><i style="width:'+S.fill+'%"></i><em>Filling waterskins<b>'+S.fill+'%</b></em></div>':'')+
    (tags.length?'<div class="pc-tags">'+tags.map(([t,c,w])=>'<span class="tag '+c+'" title="'+w+'">'+t+'</span>').join('')+'</div>':'')+
    '<div class="pc-res">'+chip('gold',P.gold,'Gold',false,'gold')+chip('food',days(S.foodDays),foodTip,S.foodDays<1)+chip('mug',days(S.drinkDays),drinkTip,S.drinkDays<1)+
      (S.furs.show?chip('furs',S.furs.have+'<small>/'+S.furs.need+'</small>','Furs: '+S.furs.need+' needed in the frost (1 for every '+SUPPLY.furPer+' people)',S.L.frost&&S.furs.have<S.furs.need):'')+
      chip('troops',cnt+'<small> '+partyRoster(P).slots+'/'+partyRoster(P).groupLimit+'</small>','Troops: '+cnt+' men in '+partyRoster(P).slots+' of '+partyRoster(P).groupLimit+' unit slots')+chip('power',partyPower(),'Party power','', 'gold')+
      chip('speed',sp.toFixed(1)+'×','Your band’s pace before the ground: the slowest of you, its size, the wounded, mounts, Athletics or Riding, a Guide, Forced March, tiredness, Hurry, an overfilled bag',sp<.8)+
      (prisonerCount()?chip('prisoners',prisonerCount(),'Prisoners'):'')+'</div>'+
    (()=>{const M=armyGroundMix(P),main=M.names[0][0],part=M.road&&M.road*2<M.n?', part on the road':'',
      pace=travelMul()/Math.max(1e-6,bandPace()),tip='Your men stand on: '+M.names.map(([k,v])=>k+' '+v+' of '+M.n).join(', ')+', their ground, pace ×'+pace.toFixed(2)+(M.n>1&&!P.byRoad&&M.road?'. By road (B): your men form a column on the road, at its full speed':'');
      return '<div class="pc-line" title="Where you are">'+icon('region',12)+'<span>'+regionAt(P.x,P.y).name+', <span title="'+htmlText(tip)+'">'+htmlText(main)+part+'</span>, '})()+'<span style="color:'+(lh?landCol(lh.owner):'#9a958a')+'">'+landName(P.x,P.y)+'</span></span></div>'+
    '<div class="pc-line" title="Renown and whom you serve">'+icon('renown',12)+'<span>'+P.renown+'</span>'+icon('banner',12)+'<span'+(P.fac?' style="color:'+FACS[P.fac].col+'"':'')+'>'+(P.fac?FACS[P.fac].n:'Independent')+'</span></div>');
  // (the day, its season and its time; the weather where you are by it, its icon in the sun's or moon's place: world/weather.js)
  const d=$('#wday');if(d){const w=WEATHER.on?ambWeather():null,K=w&&WEATHER.kinds[w],sky=icon(darkness()>.3?'moon':'sun',16);
    setHtml(d,(K?'<i class="wx" title="Weather: '+Weather.name(w)+', travel ×'+K.speed+', sight ×'+K.sight+'">'+(w==='clear'?sky:icon('wx_'+w,16))+'</i>':sky)+'<span>Day '+G.day+(K?', '+Weather.season().n:'')+', '+timeOfDay()+(K?', '+Weather.name(w):'')+'</span><b'+(G.paused?'':' class="off"')+'>Paused</b>')}
  window.mobileWorldHud?.update(fp,mo,Math.round(P.bsta));
  window.campaignHud?.update(S,cnt);
  const cb=$('#campBtn');if(cb){cb.classList.toggle('on',!!P.camp);cb.setAttribute('aria-pressed',String(!!P.camp))}
  questTrackHUD();// (the quests you track, under the band card as it now stands: ui/questtrack.js)
  underwayHUD();// (what your band is doing, under the minimap: ui/underway.js)
}
// a short hint at the top of the screen for where you are (H shows every control)
function updateHint(){
  const h=$('#hint');if(!h)return;h.hidden=!GUIDE.on;// (guide texts off: no hint: ui.js)
  h.textContent=G.mode==='scene'?'WASD or click to walk, E talk, out of the gate to leave, H help':G.mode==='battle'?'':'Click to travel, hover for details, Space pause, H help';
}
// (a group holding: standing in its places, sent nowhere and set on no one. 'hold' is also the order a move gives, its men going
// to their new places, so the order alone would light Hold on nearly always)
function holding(g){const gr=B.groups[g],m=grpUnits(g);return !!gr&&gr.order==='hold'&&!gr.tgt&&!(gr.queue&&gr.queue.length)&&m.length>0&&m.filter(u=>u.slotted&&!u.spdNow).length>=m.length*.6}
function setOrderUI(){
  if(!B)return;const gs=selGroups().filter(g=>grpUnits(g).length),src=gs.length?gs:selGroups();
  document.querySelectorAll('[data-order]').forEach(b=>{const o=b.dataset.order;b.classList.toggle('on',o==='charge'?src.every(g=>!walking(B.groups[g])):o==='advance'?src.every(g=>walking(B.groups[g])):o==='hold'?src.every(holding):src.every(g=>B.groups[g].order===o))});
  // the formation buttons: lit when every selected group it suits stands in it; dimmed when it suits none of them
  document.querySelectorAll('[data-form]').forEach(b=>{const f=b.dataset.form,fit=src.filter(g=>formFits(g,f)),on=fit.length>0&&fit.every(g=>B.groups[g].form===f);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!fit.length});
  // (a shooters' flag dimmed when none of the selection shoots; lit when every one of them that does has it)
  document.querySelectorAll('[data-flag]').forEach(b=>{const f=b.dataset.flag,l=src.filter(g=>grpUnits(g).some(u=>flagEligible(u,f))),on=l.length>0&&l.every(g=>B.groups[g][f]);b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));b.disabled=!l.length;
    if(f==='shieldWall'){const m=gs.flatMap(grpUnits),eligible=m.filter(shieldEligible).length,active=m.filter(shieldWallActive).length;b.title='Shield wall (a stance slot: Q, W or E by the kind): '+eligible+'/'+m.length+' eligible, '+active+' supported and active. Supported shield infantry: 35% less frontal damage, 40% slower. Charge/run lowers shields.';b.setAttribute('aria-label',b.title)}});
  // unit cards, the selected unit's details and the top bar (battlehud.js)
  bhudCards();document.querySelectorAll('[data-grp]').forEach(b=>bhudCard(b,b.dataset.grp));bhudInfo();bhudTop();
}
// the world's speed (SPEEDS, TRAVEL_FAST: core.js), lit on its button; why: Travel fast ends (world.js fastWatch), said in the log.
// Travel fast will not start with danger in sight
function setSpeed(n,why){
  if(why&&G.speed===TRAVEL_FAST&&n!==TRAVEL_FAST)log('Travel fast ends: '+why+'.','bad');
  G.speed=n;window.mobileWorldHud?.speed();document.querySelectorAll('[data-speed]').forEach(b=>{const on=+b.dataset.speed===n;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on))})}
function pauseUI(){const b=$('#pause');if(!b)return;b.innerHTML=icon(G.paused?'play':'pause',14);b.setAttribute('aria-label',G.paused?'Play':'Pause');b.classList.toggle('on',!!G.paused)}
function togglePause(){G.paused=!G.paused;pauseUI();updateHUD(true)}
