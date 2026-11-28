'use strict';
// A holding's places on the map (the owner, 2026-11-24: "Make holding have the same mechanic as camp where the shop and market should be
// interact at estate or certain buildings"; world/holdspots.js, data/holdings.js HOLD_SPOTS): as a camp's services, a badge for each
// of its shops over the building that keeps it (its market and smithy estates where they stand, else the houses nearest its centre)
// and one for its centre (the rest of its places); a badge walked to opens that place alone, the centre the rest; its gate asks first.
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,H=t.HoldSpots,S=t.HOLD_SPOTS;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);t.GATES.on=false;
 const town=t.TOWNS.filter(h=>h.kind==='town'&&!t.foeAt(h)).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];
 ok(!!town,'a town to visit ('+(town&&town.name)+')');if(!town)return;
 const places=H.places(town),shops=H.shops(town),rest=H.rest(town);
 ok(shops.length&&rest.length&&[...shops,...rest].sort().join()===places.slice().sort().join(),'its places split: the shops ('+shops+') and its centre\'s ('+rest+')');
 // (where they stand: the market and the smith in their estates' buildings where built, the rest each in its own house)
 const at=k=>H.anchor(town,k),mid=l=>t.lotMid(l),same=(a,b)=>Math.abs(a.x-b.x)<1&&Math.abs(a.y-b.y)<1;
 for(const [k,e] of Object.entries(S.at)){const l=t.lotAt(town,e);if(l&&shops.includes(k))ok(same(at(k),mid(l)),'the '+k+'\'s badge over its '+e+' building')}
 const pts=H.keys(town).map(at),uniq=new Set(pts.map(p=>Math.round(p.x)+','+Math.round(p.y)));ok(uniq.size===pts.length,'each badge over a building of its own ('+uniq.size+' of '+pts.length+')');
 ok(same(at('keep'),mid(t.lotCentre(town))),'its centre\'s badge over its centre');
 // (a shop's badge walked to: that place alone, no way Back to the whole town)
 const spot=k=>H.list(town).find(o=>o.k===k),leave=()=>{t.hidePanel();G.mode='world';G.modal=false;G.town=null};
 spot('trade').meet();ok(G.mode==='town'&&G.town.tab==='trade'&&t.townPlaces(town).join()==='trade','the market\'s badge: its market alone');
 ok(!document.querySelector('#panel [data-nav][data-act="tab"][data-arg="home"]'),'no Back to the whole town from it');
 t.act('tab','home');ok(G.town.tab==='trade','its header keeps it there');leave();
 // (the centre's: the rest; arriving at the centre: the same)
 spot('keep').meet();ok(G.mode==='town'&&t.townPlaces(town).join()===rest.join()&&!shops.some(k=>t.townPlaces(town).includes(k)),'its centre\'s badge: the rest of its places ('+t.townPlaces(town)+')');leave();
 t.approachHolding(town);ok(G.mode==='town'&&t.townPlaces(town).join()===rest.join(),'arriving at its centre: the same');leave();
 // (its gate asks first, at a building as at its centre)
 t.GATES.on=true;const g=t.Gates.admits(town);if(!g.ok){spot('trade').meet();ok(G.mode==='gate','a gate that will not have you yet stops you at a building too');leave()}else info('the town admits you: no gate to see');t.GATES.on=false;
 // (the look off: arriving opens all its places, as before; entering from elsewhere opens all of them)
 S.on=false;t.approachHolding(town);ok(t.townPlaces(town).join()===places.join(),'with the badges off, arriving opens all its places');leave();S.on=true;
 t.enterTown(town);ok(t.townPlaces(town).join()===places.join(),'entered any other way: all of them');leave();
 // (shown near it, picked before what lies under them)
 P.x=mid(t.lotCentre(town)).x+20;P.y=mid(t.lotCentre(town)).y+30;Kit.world();t.frame();
 ok(H.shown(town),'shown while you are near it');const o=H.list(town).find(q=>q.box);
 if(o){const b=o.box;ok(t.pickAt((b[0]+b[2])/2,(b[1]+b[3])/2)===o,'a tap on a badge picks it')}else info('no badge drawn yet (its pictures still loading)');
 // ---- a badge glides with the map (the owner, 2026-11-28: "These icons around buildings are shaking"): on a phone (3 device px a CSS
 //  px) the map moves a device px at a time; a badge is put to the device px too, a step for each of the map's, not three at once
 {const dp=Object.getOwnPropertyDescriptor(window,'devicePixelRatio'),cap=t.RENDER.cap,ready=window.uiMarkerReady,badge=window.campBadge,c=t.ctx,tr=c.translate,xs=[];
  try{Object.defineProperty(window,'devicePixelRatio',{value:3,configurable:true});t.RENDER.cap=3;window.uiMarkerReady=()=>true;window.campBadge=()=>{};
   const cam={x:Math.floor(P.x-100),y:Math.floor(P.y-100)},it=[{o:{},a:{x:P.x,y:P.y+4,up:10}}];
   for(let k=0;k<12;k++){c.save();c.setTransform(6,0,0,6,-k,0);let got=null;c.translate=function(x,y){if(got==null)got=x;return tr.call(this,x,y)};try{t.MapBadges.draw(it,cam,S,()=>'x')}finally{c.translate=tr;c.restore()}xs.push(got*3)}
   const whole=xs.every(v=>Math.abs(v-Math.round(v))<1e-6),steps=xs.slice(1).map((v,i)=>Math.round(xs[i]-v));
   ok(whole&&steps.every(d=>d===1),'the map moved a device px at a time, a badge moves with it a device px at a time (steps '+steps.join(' ')+'; snapped to CSS px it stood two frames and jumped three)')}
  finally{if(dp)Object.defineProperty(window,'devicePixelRatio',dp);else delete window.devicePixelRatio;t.RENDER.cap=cap;window.uiMarkerReady=ready;window.campBadge=badge}}
 P.x=town.x+S.near*3;P.y=town.y;ok(!H.shown(town),'none from afar');
 ok(!ERR.length,'no runtime errors');
});
