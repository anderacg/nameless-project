'use strict';
// Resources: the land holds ore veins and fishing grounds by terrain and climate, rare ones only in some places; each holding's
// mine and port bring up what its own land holds, so regional goods are cheap at the source and dear elsewhere; and a smith
// forges only from the metals its holding has, using them up.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.quietEvents=true;const TW=t.TOWNS,D=t.DEPOSITS,GD=t.GOODS;
 // ---- where things are found
 const n=g=>D.filter(d=>d.g===g).length,cnt=Object.keys(t.RES_RATE).map(g=>g+' '+n(g)).join(', ');
 ok(Object.keys(t.RES_RATE).every(g=>n(g)>0),'every resource is found somewhere: '+cnt);
 ok(n('mithril')<n('silver')&&n('adamant')<n('silver')&&n('silver')<n('iron')&&n('pearls')<n('salmon')+n('eel'),'rare ones are rare (mithril, adamantite and pearls less than common metals and fish)');
 const clim=d=>t.climAt((d.tx+.5)*16,(d.ty+.5)*16);
 ok(D.filter(d=>d.g==='mithril').every(d=>clim(d)!=='desert'&&clim(d)!=='swamp')&&D.filter(d=>d.g==='eel').every(d=>clim(d)==='swamp'||clim(d)==='grass'),'each by its climate: mithril never in desert or swamp, eels in swamp and lowland waters');
 const under=d=>d.home&&TW.some(z=>z.name===d.home&&z.tx===d.tx&&z.ty===d.ty);
 ok(D.every(d=>d.kind==='ore'?[t.T_HILL,t.T_MOUNT].includes(t.tAt(d.tx,d.ty))||under(d):t.tAt(d.tx,d.ty)===t.T_WATER),'ore veins lie in hills and mountains (or, with none in reach, under the holding), fishing grounds in the water');
 const lands=new Set(TW.map(z=>t.resText(z)));ok(lands.size>=TW.length*.5&&TW.every(z=>t.resText(z)),'every holding’s land yields something, and they differ ('+lands.size+' different lands among '+TW.length+')');
 // ---- regional goods start where they are found, and are cheap there
 const bad=[];for(const z of TW){t.ensureEcon(z);for(const g in GD)if(GD[g].res&&(z.stock[g]||0)>0&&!t.resOf(z)[g])bad.push(z.name+' '+g)}
 ok(!bad.length,'regional goods are in stock only where the land yields them'+(bad.length?': '+bad.slice(0,5).join(', '):''));
 {const g=['silver','gold','gems','salmon','copper'].find(g=>TW.some(z=>t.resOf(z)[g])&&TW.some(z=>!t.resOf(z)[g])),src=TW.find(z=>t.resOf(z)[g]),far=TW.find(z=>!t.resOf(z)[g]);
  ok(t.marketPrice(src,g)<t.marketPrice(far,g),g+' is cheaper where it is found ('+src.name+' '+t.marketPrice(src,g)+'g) than where it is not ('+far.name+' '+t.marketPrice(far,g)+'g)')}
 // ---- mines and ports bring up their own land's goods
 {const z=TW.find(q=>t.resHas(q,'ore').length&&t.bldLv(q,'mine')),ores=t.resHas(z,'ore'),before=ores.map(g=>z.stock[g]||0);z.pop=z.T.pop0*1.5;
  for(let i=0;i<5;i++)t.produce(z);ok(ores.every((g,i)=>(z.stock[g]||0)>before[i]),z.name+'’s mine brings up the ores of its land: '+ores.join(', '))}
 {const z=TW.find(q=>t.resHas(q,'fish').length&&t.bldLv(q,'port'));if(z){const g=t.resHas(z,'fish')[0],b=z.stock[g]||0;for(let i=0;i<8;i++)t.produce(z);ok((z.stock[g]||0)>b,z.name+'’s port lands its waters’ catch ('+g+')')}}
 {const z=TW.find(q=>t.resHas(q,'ore').length);ok(t.jobGood(z,'miner')[0]===t.resHas(z,'ore').sort((a,b)=>t.resOf(z)[b]-t.resOf(z)[a])[0],'its miners carry its own ore ('+t.jobGood(z,'miner')[0]+')')}
 // ---- the smith forges from what its holding has
 {const z=t.townBy('Ashford');t.ensureEcon(z);for(const g of ['copper','tin','iron','silver','gold','mithril','adamant'])z.stock[g]=0;z.stock.timber=50;W.shops=W.shops||{};delete W.shops[z.name];
  ok(t.smithStock(z).every(id=>t.ITEMS[id].tier===0),'with no metal in town the smith makes only wooden pieces');
  z.stock.mithril=8;delete W.shops[z.name];const st=t.smithStock(z),m=st.filter(id=>t.ITEMS[id].tier===5).length;
  ok(st.every(id=>[0,5].includes(t.ITEMS[id].tier))&&m>0&&z.stock.mithril===8-2*m,'given mithril it forges mithril pieces ('+m+'), using 2 mithril for each');
  z.stock.copper=5;z.stock.tin=0;delete W.shops[z.name];ok(t.smithStock(z).every(id=>t.ITEMS[id].tier!==1),'bronze needs tin as well as copper')}
 // ---- the town panel tells you what its land yields
 {const z=TW.find(q=>t.resText(q));G.mode='world';G.modal=false;t.hidePanel();t.enterTown(z);ok(new RegExp('yields').test(document.getElementById('panel').innerHTML),z.name+'’s panel names its land’s resources: '+t.resText(z));t.act('leave')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
