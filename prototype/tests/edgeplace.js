'use strict';
// Nothing built at a hill's edge (the owner, 2026-11-19: "Buildings should not be spawn at the edge of hills"; data/world.js
// EDGE_PLACE, world/map.js edgeStep): on the begin world (seed 1, or none) and Normal s2, s3 (seed 2, 3: run it with -Seed 1,2,3), no
// camp's tent or prop has the land step more than EDGE_PLACE.steep px within EDGE_PLACE.margin px of it (CampSite.tentOk: a hard rule); a holding's middle and its lots, the outposts
// and the sites (a cave aside: its mouth is in a cliff, EDGE_PLACE.free) at most a small share (a cost: where nothing else fits,
// a quarry or a mine by its rock most of all); and as many holdings, camps and sites of each kind as the world holds.
Kit.suite(({ok,info})=>{const t=T,G=t.G,TL=t.TILE,E=t.EDGE_PLACE,k=+(new URLSearchParams(location.search).get('seed')||1);
 const [name,seed]=k>1?['Normal s'+k,'s'+k]:['begin',null];{
  if(seed){Kit.fresh();Math.random=t.seeded(1);t.begin('soldier',{preset:'normal',seed});G.quietEvents=true}else Kit.begin('soldier',1);
  const S=t.W.sites,by=(x0,y0,x1,y1)=>t.edgeNear(x0,y0,x1,y1),n={},of=k=>n[k]||(n[k]={by:0,all:0}),add=(k,e)=>{const c=of(k);c.all++;if(e)c.by++};
  for(const h of t.TOWNS){const b=t.centreBox(h);add('centre',by(b.x*TL,b.y*TL,(b.x+b.n)*TL,(b.y+b.n)*TL));
   for(const l of h.lots||[])if(l.k!=='centre')add(t.ESTATES[l.k]?['quarry','mine'].includes(l.k)?'rock':'estate':'lot',by(l.x*TL,l.y*TL,(l.x+l.n)*TL,(l.y+l.n)*TL))}
  const T0=t.CAMP_SITE.tent,tent=q=>by(q.x-T0[0],q.y-T0[1],q.x+T0[0],q.y+1);let short=0;
  for(const s of S){if(s instanceof t.Encampment){s.ground();const L=s.layout();if(L.length<s.tents)short++;for(const q of L)add('tent',tent(q));for(const q of s.props())add('prop',tent(q));continue}
   if(s instanceof t.Outpost){const B=t.OUTPOST_PLACE.body;add('outpost',by((s.tx+B[0])*TL,(s.ty+B[1])*TL,(s.tx+B[2]+1)*TL,(s.ty+B[3]+1)*TL));continue}
   if(E.free.includes(s.type)||!t.SITE_CLASS[s.type])continue;const [px,py]=t.Site.point(s.tx,s.ty),[rx,ry]=E.r;add('site',by(px-rx,py-ry,px+rx,py+4))}
  const share=k=>n[k]?n[k].by/n[k].all:0,say=k=>n[k]?n[k].by+'/'+n[k].all:'none';
  info(name+': by a hill\'s edge: '+Object.keys(n).map(k=>k+' '+say(k)).join(', '));
  ok(n.tent&&!n.tent.by&&!n.prop.by,name+': no camp\'s tent ('+say('tent')+') or prop ('+say('prop')+') by a hill\'s edge');
  ok(!short,name+': every camp where people live has all its tents ('+short+' short)');
  ok(share('lot')<=.03&&share('estate')<=.05,name+': few lots ('+say('lot')+') or estates ('+say('estate')+') by one (a holding\'s middle stays where the world put it: '+say('centre')+'); quarries and mines '+say('rock'));
  ok(share('site')<=.02&&share('outpost')<=.25,name+': few sites ('+say('site')+') or outposts ('+say('outpost')+') by one');
  // (as many as the world holds: its holdings (the settings), bandit camps (CAMP_SPOTS), each kind of site (density, 9 in 10 at least, tests/sites.js))
  const of2=ty=>S.filter(s=>s.type===ty).length,D=t.density(t.WM).sites,want=Object.keys(D).filter(ty=>t.SITE_TYPES[ty]&&!(t.SITE_TYPES[ty].on&&!t.SITE_TYPES[ty].on()));
  ok(t.TOWNS.length===(seed?51:61)&&of2('camp')===t.CAMP_SPOTS.length&&want.every(ty=>of2(ty)<=D[ty]&&of2(ty)>=D[ty]*.9),name+': '+t.TOWNS.length+' holdings, '+of2('camp')+' bandit camps, '+want.map(ty=>of2(ty)+'/'+D[ty]+' '+ty).join(', '))}
});
