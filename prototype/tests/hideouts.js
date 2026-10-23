'use strict';
// Hideouts deep in the wilds (the owner, 2026-10-23: "bandit and raider hideouts should spawn far away from holdings, mostly
// found in wilderness areas"; world/sites.js HIDEOUT_PLACE, HIDEOUT_BAND, wildLand; data/world.js DENSITY.grow wild). On the
// classic seed: as many as its wild land holds (the land far from every holding and road), about half what its land gave; each
// HIDEOUT_PLACE far tiles or more from every holding and road tiles from every road, track and ford, on the wild land, off the
// estates, SITE_GAP from another hideout, the bandit camps and the travellers; most in a clearing in the wilds or deep in the
// swamp or the desert, their raiders by the climate. A hideout's band: a bigger garrison, a stronger chieftain, richer plunder
// (the den's row); bandits in searched ruins as a hideout was (the ruin's row, not one draw more). And the same on Normal s1.
// INFO: the distances.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,MW=t.MW,H=t.HIDEOUT_PLACE,B=t.HIDEOUT_BAND,D=t.DENSITY,g=D.grow,C=D.classic;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');
 const S=W.sites,of=ty=>S.filter(s=>s.type===ty),hid=of('hideout'),wl=t.wildLand(),N=t.density(t.WM).sites.hideout;
 // ---- how many: by the wild land; about half what the land gave (24 x (land / the base's)^.8)
 {const L=t.worldLand(t.WM),was=Math.round(C.sites.hideout*Math.pow(L/g.land,.8)),r=N/was;
  ok(hid.length===N&&N===Math.round(C.sites.hideout*wl.n/g.wild)&&t.worldWild(t.WM)===wl.n&&r>=.4&&r<=.6,
   hid.length+' hideouts by the wild land ('+wl.n+' tiles of '+L+' land, the base '+g.wild+'), '+(r*100).toFixed(0)+'% of the '+was+' the land gave');
  const other={kind:new Uint8Array(100),roads:[]};ok(t.worldWild(other)===g.wild&&t.density(other).sites.hideout===C.sites.hideout,'a world not in counts the base\'s wild land ('+g.wild+'): the base\'s '+C.sites.hideout+' hideouts')}
 // ---- where: far from every holding and road, on the wild land, off the estates and lots
 const holdD=s=>Math.min(...t.TOWNS.map(w=>Math.hypot(w.tx-s.tx,w.ty-s.ty)));
 const roadD=s=>{let b=Infinity;const R=40;for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const k=t.tAt(s.tx+i,s.ty+j);if((k===t.T_ROAD||k===t.T_FORD)&&s.tx+i>=0&&s.ty+j>=0&&s.tx+i<MW&&s.ty+j<t.MH)b=Math.min(b,Math.hypot(i,j))}return b};
 const hd=hid.map(holdD),rd=hid.map(roadD);
 ok(hd.every(d=>d>=H.far)&&rd.every(d=>d>=H.road)&&hid.every(s=>wl.at[s.ty*MW+s.tx]===1&&t.Hideout.ground(s.tx,s.ty)),'every hideout '+H.far+' tiles or more from every holding (the nearest '+Math.min(...hd).toFixed(1)+') and '+H.road+' from every road, track and ford (the nearest '+Math.min(...rd).toFixed(1)+'), on the wild land');
 ok(hid.every(s=>t.Hideout.clear(s.tx,s.ty)&&t.Hideout.fits(s.tx,s.ty)),'on clear ground, nothing built there, off the estates ('+t.BANDIT_GAP+' tiles)');
 {const q=a=>{a=a.slice().sort((x,y)=>x-y);return [0,.25,.5,.75,1].map(f=>a[Math.min(a.length-1,Math.floor(f*a.length))]).map(v=>v<99?v.toFixed(1):'over 40').join(' / ')};
  info('tiles to the nearest holding (least / quarter / middle / three quarters / most): '+q(hd)+'; to the nearest road: '+q(rd))}
 // ---- the wilds: most in a clearing among woods and hills, or deep in the swamp or the desert; raiders by the climate
 {const wild=hid.filter(s=>t.wildGround(s.tx,s.ty)),cl=s=>t.climAt(s.x,s.y),deep=wild.filter(s=>['swamp','desert'].includes(cl(s))).length;
  ok(wild.length>=hid.length*.6,wild.length+' of '+hid.length+' on wild ground ('+deep+' of them in the swamp or the desert)');
  ok(hid.every(s=>s.band===(cl(s)==='desert'?'raiders':cl(s)==='swamp'?'bog':'bandits')&&s.name===t.HIDEOUT_NAMES[s.band]),'their raiders by the climate: '+['bandits','raiders','bog'].map(b=>hid.filter(s=>s.band===b).length+' '+b).join(', '))}
 // ---- spacing (SITE_GAP): from another hideout, the bandit camps and the travellers
 {const G2=t.SITE_GAP.hideout,near=(a,L)=>Math.min(Infinity,...L.filter(b=>b!==a).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty))),d=k=>Math.min(...hid.map(a=>near(a,of(k))));
  ok(G2.hideout===20&&d('hideout')>=G2.hideout&&d('camp')>=G2.camp&&d('travelers')>=G2.travelers,'apart: '+d('hideout').toFixed(1)+' tiles from another hideout at the least ('+G2.hideout+'), '+d('camp').toFixed(1)+' from a bandit camp ('+G2.camp+'), '+d('travelers').toFixed(1)+' from the travellers ('+G2.travelers+')')}
 // ---- the band: a bigger garrison, a stronger chieftain, richer plunder
 const h=hid[0],K=B.den,day=Math.floor(G.day/15);
 {const lv=hid.map(s=>s.ld.lv),own=[];for(let k=0;k<30;k++)own.push(h.foes().length-1);
  ok(h.tune===K&&h.size0===8&&lv.every(v=>v>=K.chief[0]&&v<=K.chief[1])&&own.every(n=>n>=K.foes[0]+day&&n<=K.foes[1]+day)&&h.guess().n===K.size0+day+1,
   'a hideout\'s garrison '+K.foes.join('-')+' (+1 every 15 days; seen from outside '+K.size0+'), its chieftain level '+K.chief.join('-')+' (here '+Math.min(...lv)+'-'+Math.max(...lv)+')')}
 {const rnd=Math.random,inv0=P.inv.filter(Boolean).length;let a,b,res1={gold:100},res2={gold:100};
  try{Math.random=()=>0;a=h.plunder(res1);Math.random=()=>.99;b=h.plunder(res2)}finally{Math.random=rnd}
  ok(res1.gold===150&&res2.gold===150&&/Among their plunder/.test(a)&&b===''&&P.inv.filter(Boolean).length===inv0+1&&K.gear===.4,'its plunder: the gold x'+K.gold+' (100 to '+res1.gold+'), and '+K.gear*100+'% another piece of gear past a camp\'s (4 in 5)');
  const n=9,say=h.lootSay(n);ok(new RegExp('about '+Math.round((n*4+25)*K.gold)+' gold').test(say)&&/maybe another/.test(say),'your scouts tell of it: '+say)}
 // (cleared, it comes back in 10 days with a chieftain as strong)
 {const back=G.day;h.cleared=true;h.back=back;h.day();ok(!h.cleared&&h.ld.lv>=K.chief[0]+Math.floor(back/30)&&h.ld.lv<=K.chief[1]+Math.floor(back/30)&&t.SITE_TYPES.hideout.respawn===10,'it fills again after '+t.SITE_TYPES.hideout.respawn+' days, its new chieftain level '+h.ld.lv)}
 // ---- bandits in searched ruins: as a hideout was, not one draw more
 {const r=of('ruins')[0],rnd=Math.random;let n=0;const o2=t.occupantSite(r,'hideout'),Rw=B.ruin,res={gold:100};
  try{Math.random=()=>{n++;return rnd()};o2.plunder(res)}finally{Math.random=rnd}
  ok(o2.within===r.name&&o2.tune===Rw&&o2.size0===6&&o2.ld.lv>=1&&o2.ld.lv<=3&&res.gold===100&&n===0&&o2.lootSay(9)===t.Lair.prototype.lootSay.call(o2,9),'bandits in the '+r.name+': as a hideout was (seen as '+Rw.size0+', a chieftain '+Rw.chief.join('-')+', a camp\'s plunder and no draw for more)')}
 // ---- a generated world (Normal, seed 1): the same rules, its count beside the land's
 {window.requestAnimationFrame=()=>0;t.forgeInstall(t.genWorld({preset:'normal',seed:'1'}));t.startGame('soldier',t.BGS.soldier);G.quietEvents=true;
  const m=t.WM,L=t.worldLand(m),w=t.wildLand(),hs=W.sites.filter(s=>s.type==='hideout'),n=t.density(m).sites.hideout,was=Math.round(C.sites.hideout*Math.pow(L/g.land,.8));
  const ap=Math.min(Infinity,...hs.map(a=>Math.min(Infinity,...hs.filter(b=>b!==a).map(b=>Math.hypot(a.tx-b.tx,a.ty-b.ty)))));
  ok(!m.classic&&hs.length>=n*.9&&hs.every(s=>holdD(s)>=H.far&&roadD(s)>=H.road)&&ap>=t.SITE_GAP.hideout.hideout&&hs.filter(s=>t.wildGround(s.tx,s.ty)).length>=hs.length*.6,
   'Normal s1: '+hs.length+' of '+n+' hideouts by its '+w.n+' tiles of wild land ('+L+' land: '+was+' by the land), every one as far out, '+ap.toFixed(1)+' apart at the least, '+hs.filter(s=>t.wildGround(s.tx,s.ty)).length+' on wild ground')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
