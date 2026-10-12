'use strict';
// Sites: caves, traveller camps, bandit hideouts, ruins and shrines are spread over the map, reachable, hidden until seen;
// each one plays out (fights, chests, trade, sellswords, rest, news, prayer), refills or moves on, saves, and is drawn.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MW=t.MW,MH=t.MH,TILE=t.TILE;try{localStorage.clear()}catch(e){}
 const done=()=>{while(G.mode==='perk')t.act('perk',G.perkOffer[0])};
 const panel=()=>document.getElementById('panel').innerHTML;
 t.act('begin','soldier');
 const S=W.sites,of=ty=>S.filter(s=>s.type===ty),want=Object.keys(t.SITE_TYPES);
 ok(want.every(ty=>of(ty).length===Math.round(t.SITE_TYPES[ty].count*t.MAP_DENS)),'every kind placed: '+want.map(ty=>of(ty).length+' '+ty).join(', '));
 const f=t.flowTo(t.TOWNS[0]);ok(S.every(s=>t.passable(t.tAt(s.tx,s.ty))&&isFinite(f[s.ty*MW+s.tx])),'all '+S.length+' sites stand on open ground you can reach');
 const quad=[0,1,2,3].map(q=>S.filter(s=>(s.tx<MW/2?0:1)+(s.ty<MH/2?0:2)===q).length);ok(quad.every(n=>n>=4),'spread over the whole map (per quarter: '+quad.join(', ')+')');
 ok(S.every(s=>t.TOWNS.every(w=>Math.hypot(w.tx-s.tx,w.ty-s.ty)>=6)),'none sit on top of a holding');
 ok(of('cave').every(s=>t.MONSTERS[s.id]),'every cave has a lair beast ('+[...new Set(of('cave').map(s=>s.id))].join(', ')+')');
 // hidden until seen
 ok(S.filter(s=>s.seen).length===0,'sites start hidden');
 const go=s=>{P.x=s.x;P.y=s.y;P.tx=null;G.mode='world';G.modal=false;t.hidePanel();G.encCool=0;G.lastSite=null;return t.updateSites()};
 const strong=()=>{P.troops={hum_knight:25,hum_long:15};P.hp=null;t.vitals()};
 // cave
 const cave=of('cave')[0];go(cave);ok(cave.seen&&G.mode==='site'&&new RegExp(cave.name).test(panel())&&/Enter/.test(panel()),'reaching a cave spots it and opens its panel');
 t.act('site-fight');ok(G.enc&&G.enc.kind==='cave'&&G.enc.list.length===t.MONSTERS[cave.id].count[1]+1&&new RegExp(cave.name).test(panel()),'entering starts a lair fight');
 strong();const g0=P.gold,inv0=P.inv.filter(Boolean).length;t.act('auto');
 ok(cave.cleared&&cave.back===G.day+25&&P.gold>g0&&/chest/.test(panel()),'winning empties the cave and opens its chest (+'+(P.gold-g0)+' gold)');t.act('cont');done();
 ok(!t.updateSites()&&G.mode==='world','standing on it does not reopen it');
 G.day=cave.back;t.siteDay();ok(!cave.cleared,'after 25 days something new moves in');
 // hideout
 const hid=of('hideout')[0];go(hid);ok(G.enc&&G.enc.kind==='camp'&&G.enc.list.includes('chief')&&new RegExp(hid.name).test(panel()),'a '+hid.name.toLowerCase()+' attacks with a chieftain');
 strong();t.act('auto');ok(hid.cleared&&hid.back===G.day+10,'beating it clears the hideout for 10 days');t.act('cont');done();
 // ruins
 let fights=0,chests=0,lore=0;
 for(let k=0;k<40;k++){const r=of('ruins')[k%of('ruins').length];r.cleared=false;go(r);const gg=P.gold;t.act('site-search');
   if(G.enc){fights++;strong();t.act('auto');t.act('cont');done()}else{if(P.gold>gg)chests++;else lore++;t.act('site-leave')}}
 ok(fights&&chests&&lore,'searching ruins finds chests ('+chests+'), lore ('+lore+') or guardians ('+fights+')');
 // shrine
 const sh=of('shrine')[0];go(sh);const m=t.vitals();P.sp=1;P.mp=1;t.act('site-pray','0');ok(P.sp===m[1]&&P.mp===m[2]&&sh.back===G.day+7,'praying restores stamina and mana');
 ok(document.querySelector('[data-act="site-pray"]').disabled,'and only once a week');t.act('site-leave');
 // travellers
 const tr=of('travelers').find(s=>t.TRAVELERS[s.kind].race)||of('travelers')[0];if(!t.TRAVELERS[tr.kind].race){tr.kind=0;t.stockTravelers(tr)}
 go(tr);ok(G.mode==='site'&&new RegExp(tr.name).test(panel()),'a camp of '+tr.name.toLowerCase());
 P.gold=2000;P.troops={};P.inv=P.inv.map(()=>null);const g=Object.keys(tr.stock)[0],n0=t.goodN(g);t.act('site-buy',g);ok(t.goodN(g)===n0+5,'buy '+g+' from them');
 const u=tr.unit;t.act('site-hire');ok(P.troops[u]===1,'hire a sellsword ('+t.ST[u].n+') with no standing');
 P.hp=10;t.act('site-fire');ok(P.hp>10&&document.querySelector('[data-act="site-fire"]').disabled,'rest by their fire once a day');
 const seen0=S.filter(s=>s.seen).length;t.act('site-news');ok(S.filter(s=>s.seen).length===seen0+2&&/on your map/.test(panel()),'news puts two new places on your map');
 t.invAdd('mat','pelt',3);const g1=P.gold;t.act('site-sell');ok(P.gold>g1&&!t.invCount('mat','pelt'),'they buy trophies');
 t.act('site-leave');ok(G.mode==='world','Leave returns to the map');
 const x0=tr.x,y0=tr.y;G.day=tr.until;G.lastSite=null;t.siteDay();ok((tr.x!==x0||tr.y!==y0)&&!tr.seen&&tr.until>G.day,'travellers pack up and move on');
 // save and load
 G.mode='world';t.saveGame();const snap=JSON.stringify(S.map(s=>[s.type,s.x,s.y,s.seen,s.cleared]));W.sites=[];t.act('load');
 ok(JSON.stringify(W.sites.map(s=>[s.type,s.x,s.y,s.seen,s.cleared]))===snap,'sites, what you found and what you cleared survive a reload');
 // drawn
 const blank=W.sites.filter(s=>{const c=t.siteSprite(s),px=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let j=3;j<px.length;j+=4)if(px[j])n++;return n<40});
 ok(!blank.length,'every site has a sprite');
 W.sites.forEach(s=>s.seen=true);P.x=W.sites[0].x+30;P.y=W.sites[0].y;G.mode='world';G.modal=false;t.hidePanel();t.frame();
 t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
