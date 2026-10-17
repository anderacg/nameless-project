'use strict';
// Territory: every holding rules land around it; borders follow travel cost; captured holdings bring their land; reach grows in
// peace and with friendly neighbors, shrinks with conquest and war; cleared camps push it out; fief income, HUD, borders and saves.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,TW=t.TOWNS,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');W.critters=[];W.sites=[];W.monsters=[];W.lords=[];t.bandits.length=0;G.quietEvents=true;
 const at=x=>t.landHold(x.x,x.y),tiles=x=>t.landOf(x);
 ok(TW.every(x=>at(x)===x),'every holding rules its own ground');
 ok(TW.every(x=>tiles(x)>40),'every holding rules land (smallest '+Math.min(...TW.map(tiles))+' tiles)');
 const v=TW.find(x=>x.kind==='village'),c=TW.find(x=>x.kind==='castle');
 ok(t.landReach(c)>t.landReach(v),'castles reach further than villages');
 let wild=0,water=0;for(let k=0;k<t.LAND.length;k++){if(t.LAND[k]<0&&t.tiles[k]!==t.T_WATER)wild++;if(t.LAND[k]>=0&&t.tiles[k]===t.T_WATER)water++}
 ok(wild>200&&!water,'land between realms stays wild ('+wild+' tiles, '+(t.LAND.filter(x=>x>=0).length)+' ruled), and nobody rules the water');
 ok(t.landName(-999,-999)==='Wild lands'&&t.landName(v.x,v.y)===v.name+' lands','land names: '+v.name+' lands, or the wilds');
 // capture: the land goes with the holding
 const f0=v.owner,other=t.FIDS.find(f=>f!==f0),L0=t.landsOf(other),n=tiles(v);
 v.owner=other;ok(at(v).owner===other&&t.landsOf(other)===L0+n,'a captured holding brings its '+n+' tiles to the new owner');
 // growth in peace; conquest and war cut it back
 v.lastOwner=other;v.grow=0;const g0=tiles(v);for(let i=0;i<30;i++)t.landDay();
 ok(v.grow>=4&&tiles(v)>g0,'in peace a holding reaches further ('+g0+' → '+tiles(v)+' tiles)');
 ok(v.grow<=t.growCap(v),'growth stops at its cap ('+t.growCap(v)+')');
 const gc=v.grow;v.owner=f0;t.landDay();ok(v.grow<=gc-2+.2,'conquest burns the borderland (reach −2)');
 v.raided=G.day+5;const gr=v.grow;t.landDay();ok(v.grow<gr,'a raided holding loses reach');v.raided=0;
 // friendly neighbors
 const lone=TW.find(x=>x.kind==='town'),cap0=t.growCap(lone),own=lone.owner;TW.forEach(x=>{if(x!==lone&&Math.hypot(x.tx-lone.tx,x.ty-lone.ty)<35)x.owner=own});
 ok(t.growCap(lone)>=cap0,'friendly holdings nearby raise the cap ('+cap0+' → '+t.growCap(lone)+')');
 // clearing a camp settles land
 const camp=t.CAMP_SPOTS[0],h=t.pacify(camp.x,camp.y);ok(h&&h.grow>0,'clearing a camp pushes out the nearest holding ('+(h&&h.name)+')');
 // fiefs pay for land
 v.owner='player';v.lastOwner='player';v.sacked=v.raided=v.turmoil=0;ok(t.fiefIncome(v)===t.taxOf(v)&&t.fiefIncome(v)>0,'a fief pays its taxes: '+t.fiefIncome(v)+' gold a day');
 G.mode='world';G.modal=false;t.hidePanel();G.lastTown=null;t.enterTown(v);t.act('tab','fief');ok(/rules \d+ tiles of land/.test(document.getElementById('panel').innerHTML),'the Fief tab shows its land');t.act('leave');
 // crossing a border
 G.landFac=undefined;G.landLogAt=0;P.x=-50;P.y=-50;t.landWatch();P.x=v.x;P.y=v.y;G.landLogAt=-1e9;t.landWatch();
 ok(G.landFac==='player'&&/your own lands/.test(document.getElementById('log').textContent),'crossing into your land says so');
 t.updateHUD(true);ok(new RegExp(v.name+' lands').test(document.getElementById('stats').innerHTML),'the HUD names whose land you stand on');
 // drawing
 t.frame();ok(true,'borders and the minimap tint draw');
 // saves keep reach
 v.grow=6.5;t.saveGame(true);v.grow=0;t.act('load');ok(Math.abs(t.townBy(v.name).grow-6.5)<.01,'each holding’s reach survives a reload');
 ok(t.MW===224&&t.MH===160&&t.TOWNS.length===37,'Ashmark is 224 x 160 tiles with 37 holdings');
 t.updateHUD(true);t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
