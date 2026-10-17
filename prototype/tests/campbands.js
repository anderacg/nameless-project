'use strict';
// Bands sheltering in a bandit camp are parties on every path: when they ride in, after a save is loaded (the camp's bands
// come back from plain JSON) and when they ride out at dawn (campEmpty). Attacking a camp after loading fights the bands'
// own troops (no undefined in the enemy list), and the saved JSON of the camp's bands keeps its shape across a load.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');G.quietEvents=true;
 const ci=0,camp=()=>t.camps()[ci];let c=camp();c.cleared=false;c.bands=[];
 // two bands ride into the camp at night by their own brain (the creation path): one of mixed troops, one with a chieftain
 const band=(n,kind,ld)=>t.asParty({x:c.x,y:c.y+3,n,kind,list:t.makeEnemies(n,false,kind),t:0,a:0,idle:true,cool:5,ld});
 t.bandits.length=0;const b1=band(4,'bandits',null),b2=band(5,'bandits',t.newChief('bandits',2));t.bandits.push(b1,b2);
 b1.add('archer',2);b2.add('militia',1);b1.power();b2.power();
 P.x=c.x+3000;P.y=c.y;G.clock=t.DAY*.95;t.updateBands(.01);
 ok(c.bands.length===2&&c.bands.every(b=>b instanceof t.BandParty)&&!t.bandits.length,'bands that ride into a camp at night shelter there as parties ('+c.bands.length+' inside)');
 const want=c.bands.map(b=>b.troops.slice());
 // save, then load: the camp's bands come back from plain JSON
 G.mode='world';G.modal=false;t.saveGame(true,'1');const s1=t.readSlot('1'),j1=s1.world.sites.find(s=>s.type==='camp'&&s.tx===c.tx&&s.ty===c.ty).bands;
 ok(j1.length===2&&j1.every(b=>b.tc&&!('list' in b)&&!('troops' in b)),'a sheltering band saves as plain counts (tc), not a list');
 t.loadGame('1');c=camp();
 ok(c.bands.length===2&&c.bands.every(b=>b instanceof t.BandParty),'after loading, the bands sheltering in the camp are parties again');
 ok(c.bands.every((b,i)=>b.troops.length===want[i].length&&b.troops.join()===want[i].join()&&b.n===want[i].length),'after loading, each band has its own troops back ('+c.bands.map(b=>b.troops.length).join(', ')+')');
 // the saved JSON keeps its shape: saving again after the load writes the same fields and values (pw is a power cache,
 // reset on load for every band as for the roving ones)
 G.mode='world';G.modal=false;t.saveGame(true,'2');const j2=t.readSlot('2').world.sites.find(s=>s.type==='camp'&&s.tx===c.tx&&s.ty===c.ty).bands;
 const keys=b=>Object.keys(b).sort().join(),strip=b=>{const x={...b};delete x.pw;return JSON.stringify(x,Object.keys(x).sort())};
 ok(j2.length===j1.length&&j2.every((b,i)=>keys(b)===keys(j1[i])),'the saved bands have the same fields before and after a load ('+keys(j1[0])+')');
 ok(j2.every((b,i)=>strip(b)===strip(j1[i])),'the saved bands have the same values before and after a load (but the pw power cache)');
 ok(JSON.stringify(t.readSlot('2').world.sites.map(s=>Object.keys(s).sort().join()))===JSON.stringify(s1.world.sites.map(s=>Object.keys(s).sort().join())),'every saved site has the same fields before and after a load');
 // attacking the camp after loading: its own raiders and chieftain, and every sheltering band's troops
 G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;t.enterSite(c);
 const L=G.enc&&G.enc.list||[],tail=want.flat();
 ok(G.enc&&G.enc.kind==='camp'&&G.enc.ref===c,'attacking the camp after loading opens its encounter');
 ok(L.length&&L.every(k=>typeof k==='string'&&t.ST[k]),'the enemy list has no undefined or unknown soldier ('+L.length+' soldiers)');
 ok(L.slice(-tail.length).join()===tail.join(),'the enemy list ends with the sheltering bands\' troops ('+tail.length+')');
 t.act('flee');
 // at dawn the bands ride out: campEmpty puts them back on the map (bands from plain data made parties as on loading: restore)
 G.mode='world';G.modal=false;t.hidePanel();G.enc=null;t.bandits.length=0;
 const plain=JSON.parse(JSON.stringify(c.bands));c.bands=plain;c.restore();t.campEmpty(c);
 ok(!c.bands.length&&t.bandits.length===2&&t.bandits.every(b=>b instanceof t.BandParty&&b.troops.length>0&&!b.gone),'bands released at dawn are parties on the map ('+t.bandits.map(b=>b.size).join(', ')+')');
 ok(t.bandits.every((b,i)=>b.troops.join()===want[i].join()),'released bands keep their troops');
 ok(t.bandits.every(b=>b.mapKind==='band'&&b.here()),'a released band is a band on the map');
 // and a battle at the camp after loading fights the bands' soldiers
 t.loadGame('1');c=camp();
 ok(c.bands.length===2&&c.bands.every(b=>b instanceof t.BandParty),'bands sheltering in the camp are parties after another load');
 G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.enc=null;t.enterSite(c);t.act('fight');
 const B=t.B,foes=B?B.units.filter(u=>u.team===1):[],cnt=a=>a.reduce((m,k)=>(m[k]=(m[k]||0)+1,m),{}),fc=cnt(foes.map(u=>u.type)),bc=cnt(tail);
 ok(B&&foes.length&&foes.every(u=>t.ST[u.type]),'the battle at the camp starts with real soldiers ('+foes.length+' foes)');
 ok(B&&Object.keys(bc).every(k=>(fc[k]||0)>=bc[k]),'the battle has the sheltering bands\' troops ('+JSON.stringify(bc)+' within '+JSON.stringify(fc)+')');
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
