'use strict';
// Valuables (doc/ITEMS_DESIGN.md §4b; data/items.js VALUABLES, VALUE, VALUE_FINDS; core/items.js Valuable; world/sites.js
// valuablesFound; world/captives.js spoilsWon): jewels, rings, a chalice, a relic, worth a lot for one slot (5 to a slot). Found in
// the chests of caves and ruins, in bandit camps and on the lords and chieftains you beat (the stream 'valuables': the world's
// Math.random untouched); sold at any market, better in a city, better with Trading.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,V=t.VALUABLES,K=t.ITEM_KINDS.val;
 Kit.begin('soldier',4242);Kit.clear();Kit.world();
 const empty=()=>{P.inv=Array(t.INV_SIZE).fill(null);t.fitInv()},vals=()=>P.inv.filter(s=>s&&s.k==='val').reduce((a,s)=>a+s.n,0);
 // ---- the kind
 ok(Object.keys(V).length>=5&&Object.values(V).every(v=>v.v>0&&t.RARITY[v.r]&&v.icon&&v.d)&&K.stack('ring')===5,Object.keys(V).length+' valuables ('+Object.values(V).map(v=>v.n).join(', ')+'), 5 to a slot');
 empty();ok(t.invAdd('val','ring',7)===7&&P.inv.filter(Boolean).length===2&&t.itemCat(P.inv[0]).n==='Valuable'&&/Gold ring/.test(K.title(P.inv[0])),'they stack 5 to a slot, of the category Valuable');
 {const r={k:'val',id:'chalice',n:1},city=t.townBy('Ashford'),town=t.townBy('Oakhurst'),vil=t.townBy('Thornwick'),tr=P.sk.trade.lv;
  P.sk.trade.lv=0;const pc=K.price(r,city),pt=K.price(r,town),pv=K.price(r,vil);P.sk.trade.lv=5;const p5=K.price(r,city);P.sk.trade.lv=tr;
  ok(pc>pt&&pt>pv&&p5>pc&&pc===Math.round(V.chalice.v*t.VALUE.sell*t.VALUE.kind.city),'a market pays more in a city ('+pc+') than a town ('+pt+') or a village ('+pv+'), more with Trading ('+p5+' at 5)')}
 // ---- where they are found: from their own stream
 const r0=Math.random;let drew=0;Math.random=()=>{drew++;return r0()};
 empty();{const say=Kit.stubStream('valuables',[0,0,.5],()=>t.valuablesFound('ruin'));ok(vals()===1&&/Among the gold: /.test(say),'a ruin\'s chest: '+say.trim())}
 empty();{const say=Kit.stubStream('valuables',.999,()=>t.valuablesFound('cave'));ok(!vals()&&say==='','none, when the dice say so')}
 Math.random=r0;ok(drew===0,'drawn from their own stream, never the world\'s Math.random');
 empty();{const s={chest:{gold:0,gear:0,finds:'ruin'}},g0=P.gold;const say=Kit.stubStream('valuables',0,()=>Kit.stub(.99,()=>t.siteChest(s)));ok(P.gold>g0&&vals()>=1&&/The chest holds/.test(say)&&/Among the gold/.test(say),'a chest: its gold and its valuables ('+say.replace(/<[^>]+>/g,'').trim()+')')}
 ok(t.Site.prototype.__lookupGetter__('chest').call({}).finds==='cave'&&t.Ruins.prototype.__lookupGetter__('chest').call({}).finds==='ruin','caves\' and ruins\' chests have theirs (VALUE_FINDS)');
 empty();{const say=Kit.stubStream('valuables',0,()=>t.spoilsWon({kind:'lord',ref:{}}));ok(/His purse holds/.test(say)&&vals()>=1,'a beaten lord\'s purse: '+say.trim())}
 empty();{const say=Kit.stubStream('valuables',0,()=>t.spoilsWon({kind:'camp',ref:{ld:{name:'X'}}}));ok((say.match(/His purse holds/g)||[]).length===1&&/Among their plunder/.test(say),'a bandit camp: its chieftain\'s purse and its plunder')}
 empty();{const say=Kit.stubStream('valuables',0,()=>t.spoilsWon({kind:'party',ref:{}}));ok(say===''&&!vals(),'a band with no chieftain: none')}
 // past the bag's limit: left behind, said so
 empty();for(let i=0;i<t.invCap()+t.BAG.maxOver;i++)t.invAdd('mat','pelt',t.STACK);{const say=Kit.stubStream('valuables',0,()=>t.valuablesFound('lord'));ok(new RegExp(t.BAG_FULL).test(say)&&!vals(),'with no room at all: '+say.trim())}
 // a won fight: on the loot pile
 empty();P.troops={hum_knight:20};G.enc={kind:'camp',ref:{cleared:false,back:0,x:P.x,y:P.y,ld:t.newChief('bandits',2)},n:3};Kit.world({enc:G.enc});t.startEncounter(G.enc);
 Kit.stubStream('valuables',0,()=>t.autoResolve());ok(G.loot&&G.loot.pile.some(s=>s.k==='val')&&/His purse holds/.test(Kit.panel())&&/Among their plunder/.test(Kit.panel()),'a bandit camp beaten: the valuables on the loot pile, and the victory says so');
 t.act('lt-all');ok(vals()>=1,'taken');t.act('cont');Kit.done({world:true});
 // sold at the market
 const ash=t.townBy('Ashford');G.lastTown=null;Kit.world();t.enterTown(ash);t.act('tab','trade');
 {const i=P.inv.findIndex(s=>s&&s.k==='val'),s=P.inv[i],g0=P.gold,p=K.fetches(s,ash);ok(/From your inventory/.test(Kit.panel())&&Kit.q('[data-act="sell-own"][data-arg="'+i+'"]'),'the market lists them to sell');
  t.act('sell-own',String(i));ok(P.gold===g0+p&&!P.inv[i],'sold: +'+p+' gold for '+s.n)}
 t.act('leave');Kit.done({world:true});
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
