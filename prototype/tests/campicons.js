'use strict';
// A camp's services on the map and the recruit amount (the owner, 2026-11-18: "reduce a clicing the area of camp sites", "an
// interactable icons instead for each camp sites ... separated each menu around the actual camp site", "only camps for now, this
// include recruitable unit, icons when close", "Bring back the recruit unit adjustable amount like I want to hire only 1/10"):
// a tap on a camp's ground walks you there and picks nothing; each of its services has its own icon, shown only when you are close,
// its tap opening that service alone (the window's frame: its place, Leave its way out); its traders and sellswords stand in it; the
// hiring desk's stepper hires as many as you choose, 1 to its most.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,I=t.ENCAMP.icons;Kit.begin('soldier',1);Kit.world();G.mode='world';G.modal=false;
 const camps=W.sites.filter(s=>s instanceof t.Encampment&&!s.cleared&&s.TR.goods.length&&s.unit&&s.mercs>1);
 if(!camps.length){info('no camp with goods and sellswords on this world');ok(true,'nothing to check');return}
 const s=camps[0];s.seen=true;Kit.goTo(s.x,s.y+40);G.mode='world';G.modal=false;for(let i=0;i<4;i++){t.updateWorld(1/30);t.drawWorld()}
 const L=t.CampSpots.list(s),shown=()=>L.filter(o=>o.box);
 // ---- close: an icon each, apart from one another
 ok(L.map(o=>o.k).join()==='trade,hire,fire'&&shown().length===3,'close by: an icon for each service ('+shown().map(o=>o.k).join(', ')+'), within '+I.near+' px');
 {const px=Math.round(I.css*t.dprOf()),cs=[...t.UI_ICON_CACHE].filter(([k])=>k.startsWith('marker:')).map(([,c])=>c);
  ok(cs.length>=3&&cs.every(c=>c.width===px&&c.height===px),'camp artwork caches at screen DPR rather than world zoom');}
 const B=shown().map(o=>o.box),apart=B.every((a,i)=>B.every((b,j)=>i===j||a[2]-I.tap*0<=b[0]||b[2]<=a[0]||a[3]<=b[1]||b[3]<=a[1]||Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]))<(a[2]-a[0])*(a[3]-a[1])*.25));
 ok(apart,'the icons kept apart (none over another by a quarter of its badge)');
 // ---- a tap on the camp's ground: walked to, no camp picked
 {const a=s.area();let camp=0,n=0;for(let y=a[1]+2;y<a[3];y+=4)for(let x=a[0]+2;x<a[2];x+=4){const o=t.pickAt(x,y);n++;if(o===s)camp++}
  ok(n>20&&camp===0,'a tap anywhere on its ground picks no camp ('+camp+' of '+n+' points), so it walks you there')}
 // ---- each icon's tap: that service alone
 for(const o of shown()){const b=o.box,cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2,hit=t.pickAt(cx,cy);
  ok(hit===o,o.k+': a tap on its icon picks it');
  G.mode='world';G.modal=false;t.interact(o);const panel=document.getElementById('panel'),items=panel.querySelectorAll('[data-act="site-tab"]');
  ok(G.mode==='site'&&G.site===s&&G.siteSolo===o.k&&G.siteTab===o.k&&items.length<=2&&panel.querySelector('[data-act="site-leave"]'),o.k+': opens that service alone ('+items.length+' rail item, Leave its way out)');
  t.act('site-leave');ok(G.mode==='world'&&!G.siteSolo,o.k+': Leave back to the map')}
 // A trader directly underneath a fire badge must not steal its click and open Wagons.
 {const o=L.find(o=>o.k==='fire'),p=t.CampFolk.of.get(s)?.ppl.find(p=>p.R.at==='trade');
  if(o?.box&&p){const old={x:p.x,y:p.y,hid:p.hid},b=o.box,x=(b[0]+b[2])/2,y=(b[1]+b[3])/2;
   try{p.x=x;p.y=y+4;p.hid=false;const hit=t.pickAt(x,y);ok(hit===o,'a camp service badge wins over a trader underneath');
    t.interact(hit);ok(G.siteSolo==='fire'&&G.siteTab==='fire','the fire badge still opens Campfire with a trader underneath');t.act('site-leave');
   }finally{Object.assign(p,old)}}}
 // ---- its people: the traders by their wares, the sellswords about the camp
 {const C=t.CampFolk.of.get(s),ring=C?C.ring+40:0,at=k=>C?C.ppl.filter(p=>p.R.at===k&&Math.hypot(p.x-s.x,p.y-s.y)<ring):[];
  ok(at('trade').length>0&&at('hire').length>0,'its traders ('+at('trade').length+') and its sellswords ('+at('hire').length+') stand in the camp');
  const p=at('hire')[0];if(p){G.mode='world';G.modal=false;t.CampFolk.meet(p);ok(G.mode==='site'&&G.siteSolo==='hire','a sellsword met: the hiring alone');t.act('site-leave')}}
 // ---- far: none shown, none picked
 {Kit.goTo(s.x,s.y+I.near+80);G.mode='world';G.modal=false;t.drawWorld();ok(!shown().length,'farther than '+I.near+' px: no icon shown or picked')}
 // ---- the stepper: 1 of many, Max as many as you can pay, kept within 1 and its most
 {Kit.goTo(s.x,s.y+40);G.mode='world';G.modal=false;t.drawWorld();const d=s.deskOf(),k=d.src.kinds.find(k=>d.pool(k)>=2);
  if(!k)info('no kind with two willing: the stepper not checked');else{const r=t.partyRoster(P);
   if(r.slots>=r.groupLimit)info('no free unit slot: the stepper checked on its numbers only');
   P.gold=100000;G.mode='site';G.site=s;G.siteSolo='hire';G.siteTab='hire';
   t.act('site-rec-amt','u:'+k+'|=1');const one=d.unit(k);ok(one.n===1&&one.cost===d.src.cost(k),'the stepper set to 1: one man, his price ('+one.cost+'g)');
   t.act('site-rec-amt','u:'+k+'|-1');ok(d.unit(k).n===1,'− at one stays one');
   t.act('site-rec-amt','u:'+k+'|=max');const mx=d.unit(k);t.act('site-rec-amt','u:'+k+'|+1');ok(d.unit(k).n===mx.n&&mx.n===mx.max,'Max: its most ('+mx.n+'), + no further');
   const c=d.src.cost(k);P.gold=c*2+c-1;t.act('site-rec-amt','u:'+k+'|=max');const af=d.unit(k);ok(af.n===Math.min(2,af.max)&&af.cost<=P.gold,'Max with the gold for two: '+af.n+' ('+af.cost+'g of '+P.gold+'g)');
   if(r.slots<r.groupLimit){P.gold=100000;t.act('site-rec-amt','u:'+k+'|=1');const g0=P.gold,men0=t.partySize();t.act('site-rec-unit',k);
    ok(t.partySize()===men0+1&&g0-P.gold===c,'Recruit with 1 chosen hires exactly one ('+(t.partySize()-men0)+' man, '+(g0-P.gold)+'g)')}
   const html=d.body();ok(/data-act="site-rec-amt"/.test(html)&&/>Max</.test(html),'the desk shows the stepper (−, the count, +, 1, 5, 10, Max)')}}
 G.site=null;G.siteSolo=null;G.mode='world';
});
// Artwork must be decoded before synchronous world/picking assertions; a cold marker never caches a blank or legacy glyph.
{const run=window.RUN;window.RUN=async()=>{try{
  await Promise.all([T.UI_MARKER_RIM.decode(),...Object.values(T.ENCAMP.icons.ico).map(k=>T.uiAtlasImage(T.UI_ILLUSTRATIONS[k][4]||0).decode())]);
  run();window.requestAnimationFrame=()=>0;
}catch(e){const r=Kit.report();r.exc(e);r.out()}}}
