'use strict';
// Provinces (doc/START_AND_GATES_DESIGN.md §2.3, G3; the owner, 2026-11-05: provinces on the map now, with their danger): every city
// and castle a seat, every holding in exactly one province (its nearest seat's); a province's danger by the strength on its land
// against yours (calm to deadly, what makes it so); the full map names each province at its seat, its danger, a lock where its
// seat refuses you, and a legend for them; setting out for a deadly province warns you once a day, the road still open. Off (the
// harness's default), the map as before.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,X=t.PROVINCE,on0=[X.on,t.GATES.on];
 try{
  Kit.begin('soldier',1);Kit.world();X.on=true;
  const Pv=t.Provinces.all(),seats=t.TOWNS.filter(h=>h.kind==='city'||h.kind==='castle'),inOne=t.TOWNS.every(h=>Pv.filter(p=>p.holdings.includes(h)).length===1);
  ok(Pv.length===seats.length&&inOne&&Pv.every(p=>p.holdings[0]===p.seat&&/^Province of /.test(p.name)),Pv.length+' provinces, one a city or castle, every holding in exactly one ('+Pv.map(p=>p.name.slice(12)+' '+p.holdings.length).join(', ')+')');
  ok(t.Provinces.at(Pv[0].seat.x,Pv[0].seat.y)===Pv[0],'a point in a province: the one whose holding is nearest');
  // ---- danger: calm with nothing about; deadly with a great army there
  {const p=Pv[0];t.bandits.length=0;W.monsters=[];W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.sites.forEach(s=>{if(s.type==='camp'||s.type==='hideout')s.cleared=true});
   const d0=t.Provinces.danger(p);ok(d0.lv===0&&d0.word==='calm','nothing on its land: calm ('+d0.foes+')');
   const b=t.asParty({kind:'bandits',troops:Array(60).fill('hum_knight'),x:p.seat.x+80,y:p.seat.y,cool:0,t:9,a:0,idle:true});t.bandits.push(b);
   const d1=t.Provinces.danger(p);ok(d1.lv===3&&d1.word==='deadly'&&/band/.test(d1.what.join()),'a great band on it, far stronger than you: deadly ('+d1.what.join(', ')+')');
   // ---- the warning: setting out for it from elsewhere, once a day
   const said=[],toast0=window.toast;window.toast=(m,c)=>{said.push(m);toast0(m,c)};try{const far=Pv.find(q=>q!==p);Kit.goTo(far.seat.x,far.seat.y+40);
    t.worldMove(p.seat.x+20,p.seat.y+40);t.worldMove(p.seat.x+24,p.seat.y+40);ok(said.filter(m=>/Few your size/.test(m)).length===1&&P.tx!=null,'setting out for a deadly province: a warning, once a day, and you go on ('+said[0]+')');
   }finally{window.toast=toast0}
   t.bandits.length=0}
  // ---- the full map: each province named at its seat, its danger, its lock; the legend
  {t.GATES.on=true;P.renown=0;P.home=null;Kit.world();for(const h of t.TOWNS)t.revealDisk(h.x,h.y,30);t.fullMapOpen();const pic=document.querySelector('.fm-pic');t.fullMapShow(2,{x:P.x/t.TILE,y:P.y/t.TILE});
   const marks=[...document.querySelectorAll('.fm-prov')].filter(e=>!e.closest('.fm-leg')),locks=document.querySelectorAll('.fm-pic .fm-lock').length;
   ok(marks.length===Pv.length&&locks>0&&/Province of/.test(marks[0].title)&&t.PROVINCE.words.includes(marks[0].textContent.trim())&&document.querySelector('.fm-leg')&&/Provinces/.test(document.querySelector('.fm-leg').textContent),'the full map: each province at its seat with its danger (its name in its tooltip) ('+marks.length+'), a lock where its seat refuses you ('+locks+'), and a legend');
   t.closeOver();t.GATES.on=on0[1]}
  // ---- off: the map as before
  {X.on=false;t.fullMapOpen();ok(!document.querySelector('.fm-pic .fm-prov'),'off: no province on the map');t.closeOver()}
 }finally{X.on=on0[0];t.GATES.on=on0[1]}
});
