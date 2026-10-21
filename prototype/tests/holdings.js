'use strict';
// Holdings alike: nothing built stands on a road (each road is led round a holding's centre to its gate, and the roads still
// join every holding); any holding with walls is besieged and one without is raided or seized, whatever its kind; a castle
// has no market but keeps stores, which you can see, and in a castle of yours fill and draw on.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MW=t.MW,MH=t.MH,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;
 const road=(x,y)=>t.tAt(x,y)===t.T_ROAD,on=[];
 for(const z of t.TOWNS)for(const l of z.lots){for(let j=0;j<l.n;j++)for(let i=0;i<l.n;i++)if(road(l.x+i,l.y+j))on.push(z.name+' '+l.type);for(const [x,y] of l.plots||[])if(road(x,y))on.push(z.name+' '+l.k+' field')}
 for(const s of W.sites){const sp=t.siteSprite(s),x0=Math.floor((s.x-sp.ax)/TILE),y0=Math.floor((s.y+8-sp.ay)/TILE);for(let j=0;j<sp.height/TILE;j++)for(let i=0;i<sp.width/TILE;i++)if(road(x0+i,y0+j))on.push(s.type)}
 t.CAMP_SPOTS.forEach((c,k)=>{for(let j=-1;j<=0;j++)for(let i=0;i<=1;i++)if(road(c.tx+i,c.ty+j))on.push('bandit camp '+k)});
 ok(!on.length,'no building, field, site or camp stands on a road'+(on.length?': '+[...new Set(on)].slice(0,8).join(', '):''));
 // every holding's gate is on the road network, and the roads join them all
 const gate=z=>{const c=t.lotCentre(z);return[z.tx,c.y+c.n]};const g0=gate(t.TOWNS[0]),seen=new Uint8Array(MW*MH),q=[g0[1]*MW+g0[0]];seen[q[0]]=1;
 const way=(x,y)=>road(x,y)||t.tAt(x,y)===t.T_FORD;// (8 ways: a generated world's roads run diagonally too, its fords are road; doc/WORLD_DESIGN.md §8.11)
 while(q.length){const j=q.pop(),x=j%MW,y=(j/MW)|0;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const k=(y+b)*MW+x+a;if(!seen[k]&&way(x+a,y+b)){seen[k]=1;q.push(k)}}}
 const cut=t.TOWNS.filter(z=>{const [x,y]=gate(z);return !road(x,y)||!seen[y*MW+x]});
 ok(!cut.length,'each road runs to its holding\'s gate, and the roads still join every holding'+(cut.length?': not '+cut.map(z=>z.name).join(', '):''));
 // walls decide how a holding is taken
 const world=()=>{t.hidePanel();G.mode='world';G.modal=false;G.bes=null};
 const v=t.TOWNS.find(z=>z.kind==='village'),c=t.TOWNS.find(z=>z.kind==='castle');P.hostile={[v.owner]:G.day+60,[c.owner]:G.day+60};P.troops={hum_knight:12};
 v.wall=1;world();t.openSiege(v);let h=document.getElementById('panel').innerHTML;ok(/data-act="sg-camp"/.test(h)&&!/data-act="sg-raid"/.test(h),'a village behind a palisade must be besieged');
 c.wall=0;world();t.openSiege(c);h=document.getElementById('panel').innerHTML;ok(/data-act="sg-raid"/.test(h)&&/data-act="sg-assault"/.test(h)&&!/data-act="sg-camp"/.test(h),'a castle whose walls are down is raided or seized outright');
 world();P.hostile={};
 // a castle's stores
 const k=t.TOWNS.find(z=>z.kind==='castle');k.owner='player';t.ensureEcon(k);k.stock.iron=10;G.lastTown=null;t.enterTown(k);
 ok(t.townTabs(k).some(x=>x[0]==='stores')&&!t.townTabs(k).some(x=>x[0]==='trade'),'a castle has stores, and no market');
 t.act('tab','stores');t.invAdd('good','grain',12);const g0n=t.goodN('grain'),s0=k.stock.grain||0;t.act('st-put','grain:all');ok(t.goodN('grain')===0&&k.stock.grain===s0+g0n,'in a castle of yours you store goods ('+g0n+' grain put in)');
 t.act('st-take','iron:5');ok(t.goodN('iron')===5&&k.stock.iron===5,'and take them out again');
 t.act('leave');world();const k2=t.TOWNS.find(z=>z.kind==='castle'&&z.owner!=='player');G.lastTown=null;t.enterTown(k2);t.act('tab','stores');h=document.getElementById('panel').innerHTML;
 ok(/nothing here is for sale/.test(h)&&!/st-take/.test(h),'another lord\'s stores you can only look at');t.act('leave');world();
 // fields: every farm, pasture and quarry stands with room for its first fields, and makes only what its fields allow
 {const bad=[];for(const z of t.TOWNS)for(const k of ['farm','pasture','quarry'])if(t.bldLv(z,k)&&t.estatePlots(z,k).length<t.PLOTS_AT[k](1))bad.push(z.name+' '+k);
  ok(!bad.length,'every farm, pasture and quarry has open ground for its fields'+(bad.length?': '+bad.join(', '):''));
  // (the first farm, no brewery of its own using grain meanwhile: a generated world may give it one)
  const z=t.TOWNS.find(q=>t.bldLv(q,'farm')),l=t.lotAt(z,'farm'),keep=l.plots,br=z.bld.brewery;z.bld.brewery=0;t.ensureEcon(z);z.pop=z.T.pop0*2;
  const g0=z.stock.grain;t.produce(z);const full=z.stock.grain-g0;l.plots=[];const g1=z.stock.grain;t.produce(z);const none=z.stock.grain-g1;l.plots=keep;z.bld.brewery=br;
  ok(full>0&&none===0,'a farm with its fields makes grain ('+full+'); without them, none')}
 // sabotage
 {const z=t.TOWNS.find(q=>q.owner&&q.owner!=='player'&&t.bldLv(q,'farm')),o0=t.estatePick(z,'farm');P.fac=null;P.hostile={};const rnd=Math.random;world();
  Math.random=()=>0;t.estateMeet(o0);t.act('es-tab','raid');ok(/data-act="es-ask" data-arg="sabotage"/.test(document.getElementById('panel').innerHTML),'an estate can be sabotaged');t.act('es-sabotage');Math.random=rnd;
  ok(t.sabotaged(z,'farm')&&!t.hostileTo(z.owner),'unseen, it is wrecked for '+(z.sab.farm-G.day)+' days and its realm does not know who did it');
  const g0=z.stock.grain;z.pop=z.T.pop0*2;t.produce(z);const lv=t.bldLv(z,'farm');ok(z.stock.grain-g0<6*lv,'while wrecked it makes nothing');
  world();z.sab={};Math.random=()=>.999;t.estateMeet(o0);t.act('es-sabotage');Math.random=rnd;ok(G.enc&&G.enc.kind==='estate'&&G.enc.ref.sab&&t.hostileTo(z.owner),'caught, you must fight its guards');t.act('flee');world()}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
