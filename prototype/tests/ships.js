'use strict';
// Ships: fishing boats put out from their ports in the morning, sail only on water to a fishing ground, fish, and are home by
// night; trade ships carry a port's surplus over water to the friendly port on the same sea that needs it, and unload there.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TILE=t.TILE,MW=t.MW;t.act('begin','soldier');G.quietEvents=true;
 const ports=t.TOWNS.filter(z=>t.dockOf(z));ok(ports.length>=2,ports.length+' ports have a dock on the water: '+ports.map(z=>z.name).join(', '));
 // (water a boat sails: open water, or a navigable river, under its bridges and over its fords too: ships.js isWater)
 const wet=s=>t.isWater(Math.floor(s.x/TILE),Math.floor(s.y/TILE));
 ok(!ports.some(z=>t.climAt(z.x,z.y)==='frost'&&t.dockOf(z)&&t.climAt((t.dockOf(z).tx+.5)*TILE,(t.dockOf(z).ty+.5)*TILE)==='frost'),'no boat puts out on the frozen lakes of the frost');
 // ---- fishing boats
 W.ships=[];G.clock=t.DAY*.3;for(let i=0;i<400&&!W.ships.length;i++)t.updateShips(.05);
 const b=W.ships.find(s=>s.k==='fish');ok(!!b,'in the morning a port sends out a fishing boat ('+(b&&b.home)+')');
 if(b){ok(b.path.every(j=>t.isWater(j%t.MW,(j-j%t.MW)/t.MW)&&t.climate[j]!==t.CLIM.frost),'its course lies over open water only (never the ice; a navigable river under its bridges too)');let dry=0;
  for(let i=0;i<3000&&b.state==='out';i++){G.clock=t.DAY*.3;t.updateShips(.05);if(!wet(b))dry++}ok(b.state==='fish'&&!dry,'it sails out over the water and fishes');
  const dp=t.DEPOSITS.find(d=>d.kind==='fish'&&d.tx===Math.floor(b.x/TILE)&&d.ty===Math.floor(b.y/TILE));o.push('INFO fishing at '+(dp?'its '+dp.g+' grounds':'open water'));
  G.clock=t.DAY*.7;for(let i=0;i<4000&&W.ships.includes(b);i++)t.updateShips(.05);ok(!W.ships.includes(b),'and in the evening it sails home')}
 // ---- trade ships
 W.ships=[];G.clock=t.DAY*.9;let pair=null;
 for(const a of ports)for(const z of ports){if(a===z||pair)continue;const da=t.dockOf(a),dz=t.dockOf(z);if(t.waterIds()[da.ty*MW+da.tx]===t.waterIds()[dz.ty*MW+dz.tx]&&t.shipPath(da,dz))pair=[a,z]}
 ok(!!pair,'some ports share a sea, so trade ships have routes');{const W_=t.waterIds(),by={};for(const z of ports){const d=t.dockOf(z),k=W_[d.ty*MW+d.tx];(by[k]=by[k]||[]).push(z.name)}o.push('INFO seas: '+Object.values(by).map(a=>a.join(' + ')).join(' | '))}
 if(pair){const [a,z]=pair;a.owner=z.owner;t.ensureEcon(a);t.ensureEcon(z);a.stock.cheese=400;z.stock.cheese=0;
  const s=t.sendShip(a);ok(s&&s.goods.cheese>0&&s.to===z.name,a.name+' ships its surplus cheese to '+(s&&s.to));const c0=z.stock.cheese,n=s.goods.cheese;
  let dry=0;for(let i=0;i<20000&&W.ships.includes(s);i++){t.updateShips(.05);if(!wet(s))dry++}
  ok(!W.ships.includes(s)&&z.stock.cheese>=c0+n&&!dry,'the ship sails over water and unloads it there (+'+(z.stock.cheese-c0)+' cheese)')}
 // ---- drawn on the map
 if(ports.length){const z=ports[0],d=t.dockOf(z);W.ships=[{k:'fish',home:z.name,x:(d.tx+.5)*TILE,y:(d.ty+.5)*TILE,path:[],i:0,seed:3,dir:-1,state:'fish',until:1e9,big:false}];P.x=W.ships[0].x;P.y=W.ships[0].y+40;G.mode='world';G.modal=false;t.hidePanel();t.drawWorld();ok(!ERR.length,'boats are drawn without error')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
