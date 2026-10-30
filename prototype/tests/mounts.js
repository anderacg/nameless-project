'use strict';
// Goods and mounts: trade goods take bag slots and stack per good, eating frees slots, a full bag blocks buying,
// nobody starts with a mount, stables sell by place and standing, mounts speed travel,
// cross their home ground at full speed, fly, add saddlebag slots and show on the map.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,MW=t.MW,MH=t.MH,TILE=t.TILE,N=t.INV_SIZE;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 const slots=g=>P.inv.filter(s=>s&&s.k==='good'&&s.id===g).length;
 const empty=()=>{P.inv=Array(t.invCap()).fill(null)};
 // a new hero
 for(const bg of Object.keys(t.BGS)){t.act('begin',bg);ok(!P.gear.mount,bg+' starts on foot')}
 t.act('begin','merchant');
 ok(!('cargo' in P)&&t.goodN('grain')===10&&t.goodN('cloth')===4&&!t.goodN('bolts')&&P.gear.quiver==='q_wornCase'&&P.inv.filter(Boolean).length===2,'starting goods sit in the bag (2 slots), the bolt case on you');
 // stacking
 empty();ok(t.invAdd('good','grain',30)===30&&slots('grain')===1,'30 grain fit one slot');t.invAdd('good','grain',1);ok(slots('grain')===2,'the 31st grain takes a second slot');
 ok(t.invAdd('good','iron',16)===16&&slots('iron')===2,'iron stacks only 15 to a slot');
 ok(t.goodTake('grain',1)===1&&slots('grain')===1,'taking from the small stack first frees its slot');
 // a full bag
 empty();for(let i=0,n=t.invCap()+t.BAG.maxOver;i<n;i++)t.invAdd('gear',t.gearId('ring',0),1);ok(t.goodRoom('grain')===0&&t.invAdd('good','grain',5)===0,'a bag at its limit holds no more goods');
 const ash=t.townBy('Ashford');G.mode='world';G.modal=false;G.lastTown=null;P.gold=1000;t.enterTown(ash);t.act('tab','trade');
 ok(document.querySelector('[data-act="buy"][data-arg="grain:1"]').disabled,'Buy is disabled with the bag at its limit');
 P.inv[0]=null;t.act('buy','grain:5');ok(t.goodN('grain')===5,'buying fills a free slot');
 const g0=P.gold;t.act('sell','grain:5');ok(t.goodN('grain')===0&&P.gold>g0&&!P.inv[0],'selling empties it');
 ok(!/data-act="sell-item" data-arg="0"/.test(panel()),'goods are not listed again under your inventory');t.act('leave');done();
 // eating frees slots
 empty();t.invAdd('good','grain',31);t.invAdd('good','water',10);P.troops={militia:7};const eat=t.eatPerDay();t.supplyMoved();for(let h=0;h<24;h++)t.supplyHour();// (a day at rest: it eats and drinks by the hour, world/supply.js)
 ok(t.goodN('grain')===31-eat&&slots('grain')===1,'the band eats '+eat+' grain and the spare slot frees up');
 P.troops={};
 // the inventory screen
 empty();t.invAdd('good','spice',4);G.mode='world';G.modal=false;t.hidePanel();t.openInv();t.act('inv-sel','0');
 ok(/Spice/.test(document.querySelector('.fb-item-detail').innerHTML)&&/Trade good/.test(document.querySelector('.fb-item-detail').innerHTML),'goods show in the bag with details');
 ok(document.querySelector('.fb-equipment .slot[data-arg="eq:mount"]'),'the equipment has a Mount slot');t.act('inv-close');
 // stables
 G.lastTown=null;P.gold=5000;P.rep={};t.enterTown(ash);t.act('tab','stable');
 const st=t.stableStock(ash);ok(st.includes('m_mule')&&st.includes('m_horse')&&st.includes('m_courser')&&!st.includes('m_warg')&&!st.includes('m_griffin'),'Ashford stable: '+st.map(id=>t.ITEMS[id].n).join(', '));
 const vil=t.TOWNS.find(x=>x.kind==='village'),vs=t.stableStock(vil);ok(vs.length===2&&vs.includes('m_pony'),'villages keep mules and ponies');
 const orc=t.TOWNS.find(x=>x.kind!=='village'&&x.races.includes('orc'));ok(t.stableStock(orc).includes('m_warg'),'orc holdings sell wargs');
 ok(t.TOWNS.some(x=>x.kind!=='village'&&t.stableStock(x).includes('m_camel')),'a desert holding sells camels');
 ok(t.standingAt(ash)<t.REP_NEED[2]&&document.querySelector('[data-act="buy-mount"][data-arg="m_courser"]').disabled,'a courser needs standing '+t.REP_NEED[2]);
 // ride
 const spot=(clim,terr)=>{for(let i=0;i<MW*MH;i++)if(t.CLIMS[t.climate[i]]===clim&&t.tiles[i]===terr)return{x:(i%MW+.5)*TILE,y:(Math.floor(i/MW)+.5)*TILE}};
 const at=(s,fn)=>{const x=P.x,y=P.y;P.x=s.x;P.y=s.y;const r=fn();P.x=x;P.y=y;return r};
 const grass=spot('grass',t.T_OPEN),forest=spot('grass',t.T_FOREST),hill=spot('grass',t.T_HILL);
 const foot=at(grass,t.travelMul);t.act('buy-mount','m_horse');
 ok(P.gear.mount==='m_horse'&&P.gold===5000-t.gearPrice('m_horse'),'buying a horse saddles it straight away');
 const ride=at(grass,t.travelMul);ok(ride>foot*1.2,'a horse travels faster ('+foot.toFixed(2)+' → '+ride.toFixed(2)+')');
 ok(t.heroStats().spd>(48+P.attr.agi*2)*(1+t.gm('spd')-.1)+1,'and moves faster in battle');
 t.frame();
 t.act('buy-mount','m_mule');ok(P.gear.mount==='m_horse'&&t.invCount('gear','m_mule')===1,'a second mount goes in the bag');t.act('leave');done();
 const i=P.inv.findIndex(s=>s&&s.id==='m_mule');t.invEquip(i);ok(P.gear.mount==='m_mule'&&t.invCap()===N+4&&t.invCount('gear','m_horse')===1,'a mule adds 4 saddlebag slots');
 for(let k=0;k<P.inv.length;k++)if(!P.inv[k])P.inv[k]={k:'good',id:'timber',n:1};for(let k=0;k<t.BAG.maxOver;k++)P.inv.push({k:'good',id:'timber',n:1});const h=P.inv.findIndex(s=>s&&s.id==='m_horse');
 ok(!t.invEquip(h)&&P.gear.mount==='m_mule','you cannot swap off a mule with full saddlebags (the bag at its limit)');P.inv.splice(t.invCap());
 // ground
 P.race='human';P.gear.mount='m_elk';t.fitInv();ok(at(forest,t.travelMul)>at(forest,()=>t.speedAt(P.x,P.y,'human')*(1+t.gm('travel')))*1.5,'an elk crosses forest at full speed');
 P.gear.mount='m_griffin';const fl=[forest,hill,spot('swamp',t.T_OPEN),spot('desert',t.T_OPEN)].map(s=>at(s,t.travelMul));
 ok(fl.every(v=>Math.abs(v-fl[0])<.01)&&fl[0]>=at(grass,t.travelMul)/1.11,'a griffin flies over everything at one speed ('+fl.map(v=>v.toFixed(2)).join(', ')+')');
 ok(t.MONSTERS.griffin.gear.some(g=>g[0]==='m_griffin')&&t.ITEMS.m_drake.fly,'griffins can drop one; dragons guard drake eggs');
 // persists
 P.gear.mount='m_warg';P.inv=P.inv.map(()=>null);t.fitInv();G.mode='world';t.saveGame();P.gear.mount=null;t.act('load');ok(P.gear.mount==='m_warg','your mount is saved');
 const blank=Object.keys(t.MOUNTS).filter(k=>{const c=t.itemIcon(t.ITEMS['m_'+k]),px=c.getContext('2d', { willReadFrequently: true }).getImageData(0,0,16,16).data;let n=0;for(let j=3;j<px.length;j+=4)if(px[j])n++;return n<20});
 ok(!blank.length,'every mount has an icon');
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
