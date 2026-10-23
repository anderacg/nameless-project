'use strict';
// The world map's own figures (doc/WORLD_DESIGN.md §10.1, Phase 1): smaller than the battle's, so a person is clearly smaller than
// a house. A person 6 wide and 10 high over the outline under the feet (a dwarf 9), a rider 13 (16 to his banner's top), the beasts,
// the herds, the caravan and the ships each at its size; every one in a power-of-two cell with its pixels well inside it, its
// outline (the dark navy #1a1c26) round the silhouette only. The click targets keep their size for touch (the rings and REACH).
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m);
try{
 const t=T,G=t.G,P=t.P,W=t.W,OUT=[0x1a,0x1c,0x26];t.act('begin','soldier');G.quietEvents=true;
 // a picture's drawn box: [x0, y0, x1, y1]; its width and height; the height over the outline under its feet (fh); its outline
 // pixels that are not the silhouette's (inner: not joined through the outline to the ground round it) and its edge pixels not of
 // the outline (open)
 const look=s=>{const d=s.getContext('2d').getImageData(0,0,s.width,s.height).data,W0=s.width,H0=s.height,a=(x,y)=>x>=0&&y>=0&&x<W0&&y<H0&&d[(y*W0+x)*4+3]>0,
   out=(x,y)=>{if(!a(x,y))return false;const i=(y*W0+x)*4;return d[i]===OUT[0]&&d[i+1]===OUT[1]&&d[i+2]===OUT[2]};let inner=0,open=0;
   const N=[[1,0],[-1,0],[0,1],[0,-1]],seen=new Set(),q=[];
   for(let y=0;y<H0;y++)for(let x=0;x<W0;x++)if(out(x,y)&&N.some(([i,j])=>!a(x+i,y+j))){seen.add(y*W0+x);q.push([x,y])}
   while(q.length){const [x,y]=q.pop();for(const [i,j] of N){const X=x+i,Y=y+j;if(out(X,Y)&&!seen.has(Y*W0+X)){seen.add(Y*W0+X);q.push([X,Y])}}}
   for(let y=0;y<H0;y++)for(let x=0;x<W0;x++){if(!a(x,y))continue;const edge=N.some(([i,j])=>!a(x+i,y+j));if(out(x,y)&&!seen.has(y*W0+x))inner++;if(edge&&!out(x,y))open++}
   const b=t.opaqueBox(s);return{w:b[2]-b[0]+1,h:b[3]-b[1]+1,fh:b[3]-b[1],bottom:b[3],cell:s.width,inner,open}};
 const cell=s=>s.width===s.height&&[8,16,32,64].includes(s.width);
 // ---- people: every follower (each variant, people and band), worker (loaded or not), refugee, bandit and leader on foot, at every step
 {const ps=[],races=['human','elf','dwarf','orc'];
  for(const r of races)for(let v=0;v<6;v++)for(let f=0;f<4;f++){ps.push(['follower '+r+v,t.followerSprite('#3d74d6',f,v,r),r]);ps.push(['band '+r+v,t.followerSprite('#8a4a3a',f,v,r,true),r])}
  for(const j of Object.keys(t.JOBS))for(let f=0;f<4;f++){ps.push([j,t.workerSprite(j,f,'human',1),'human']);ps.push([j+' loaded',t.workerSprite(j,f,'dwarf',2,true),'dwarf'])}
  for(let v=0;v<4;v++)ps.push(['refugee',t.refugeeSprite(v,v),'human']);for(let f=0;f<4;f++)ps.push(['bandit',t.banditSprite(f),'human']);
  const L=ps.map(([n,s,r])=>[n,look(s),r]),tall=L.filter(([n,q,r])=>q.fh>(r==='dwarf'?9:10)||q.h<9),wide=L.filter(([n,q])=>q.w>9),cells=ps.filter(([n,s])=>s.width!==16||!cell(s));
  const body=L.filter(([n])=>/^follower/.test(n)),bw=Math.max(...body.map(([n,q])=>q.w)),bh=Math.max(...L.filter(([n,q,r])=>r==='human').map(([n,q])=>q.fh));
  info('a person '+bh+' high over the outline under the feet ('+(bh+1)+' with it), a dwarf '+Math.max(...L.filter(([n,q,r])=>r==='dwarf').map(([n,q])=>q.fh))+'; '+Math.min(...L.map(([n,q])=>q.w))+'-'+bw+' wide with what is in the hand');
  ok(!tall.length&&!cells.length&&L.length>200,'every person on the map (followers, bands, workers, refugees, bandits: '+L.length+') is 10 high (a dwarf 9) in a 16 cell'+(tall.length?': '+tall.slice(0,3).map(([n,q])=>n+' '+q.fh).join(', '):''));
  ok(!wide.length,'and at most 9 wide, held weapon or tool and load on the back included (6 without)'+(wide.length?': '+wide.slice(0,3).map(([n,q])=>n+' '+q.w).join(', '):''));
  const bare=t.mapPerson({race:'human',skin:'skin',hair:'brown',helm:'bare',outer:'leather',inner:'dark',team:'#3d74d6'},0),qb=look(bare);
  ok(qb.w===6&&qb.fh===10,'a person with nothing in his hands is 6 x 10 (with the outline; '+qb.w+' x '+qb.fh+')');
  const oi=L.filter(([n,q])=>q.inner>0||q.open>0);ok(!oi.length,'each outlined round the silhouette only: no outline inside, no edge without it'+(oi.length?': '+oi.slice(0,3).map(([n,q])=>n+' '+q.inner+'/'+q.open).join(', '):''));
  const house=16;ok(bh<house*.7,'a person ('+bh+') is clearly smaller than a house (a 16-px tile)')}
 // ---- leaders: a person (his sword in his hand) or a rider, no banner in the hand (it floats over the party: below), every step
 {const fs=[];for(let f=0;f<4;f++){fs.push(['lord on foot',t.partySprite('#c74453','',f)]);fs.push(['rider',t.partySprite('#c74453',t.C.horse,f)]);fs.push(['you mounted',t.partySprite('#e8b94a','#8a8a8a',f)])}
  const L=fs.map(([n,s])=>[n,look(s),s]),bad=L.filter(([n,q,s])=>s.width!==16||(n==='lord on foot'?q.fh>10||q.w>8:q.h>13||q.w>15)||q.inner||q.open);
  const r=L.find(([n])=>n==='rider')[1];info('a rider '+r.w+' x '+r.h+' (in a 16 cell); a lord on foot '+L[0][1].w+' x '+L[0][1].fh);
  ok(!bad.length,'leaders on the map hold no banner: on foot a person 10 high, mounted a rider at most 13, outlined round the silhouette only'+(bad.length?': '+bad.slice(0,3).map(([n,q])=>n+' '+q.w+'x'+q.h+' '+q.inner+'/'+q.open).join(', '):''))}
 // ---- banners: each party flies its own over it (Total War-style), none for a beast or a herd
 {const tw=t.townBy('Ashford'),L=W.lords.find(l=>!l.dead);t.spawnBandit(true);const b=t.bandits[0];
  const pt=t.asParty({pt:true,watch:'day',home:tw.name,fac:tw.owner,troops:['hum_spear'],x:0,y:0,cool:0,dir:1}),cv=t.asParty({cv:true,fac:tw.owner,from:tw.name,to:tw.name,x:0,y:0,goods:{},guards:2,cool:0,dir:1});
  const rd=t.asParty({x:0,y:0,n:3,kind:'raiders',list:['militia','militia','militia'],t:0,a:0,cool:0}),cp=t.asParty({cid:'brann',troops:['hum_levy'],x:0,y:0,order:'stay'});
  const want=[[L,'banner',t.FACS[L.fac].col,L.fac],[P,'banner',t.FACS.player.col,'crown'],[cp,'banner',t.FACS.player.col,'star'],[pt,'pennant',t.FACS[tw.owner].col,tw.owner],[b,'rag',t.BAND_FLAG[b.kind],'skull'],[rd,'rag',t.BAND_FLAG.raiders,'skull'],[cv,'trade',t.caravanCol(cv),'coin']];
  const wrong=want.filter(([q,k,c,d])=>{const B=q.banner();return !B||B.k!==k||B.col!==c||B.dev!==d}).map(([q])=>q.mapKind);
  ok(!wrong.length,'each kind its banner: a realm\'s lord its colour and emblem, you a crown on your colour, a companion a star, guards their realm\'s pennant, bands a tattered rag (raiders\' ochre), a caravan a trade pennant'+(wrong.length?': '+wrong.join(', '):''));
  const beasts=[t.asMonster({id:'wolf',x:0,y:0,lv:1,n:1}),t.asMonster({id:'dragon',x:0,y:0,lv:1,n:1}),t.asHerd({crit:true,id:'deer',x:0,y:0,n:2}),t.asRefugees({rf:true,from:tw.name,to:tw.name,n:4,x:0,y:0})];
  ok(beasts.every(q=>!q.banner&&!t.bannerAt(q,0)),'a beast, the dragon, a herd and refugees fly none');
  const sp=[];for(const [q] of want)for(const f of [0,1])sp.push([q.mapKind,look(t.bannerSprite(q.banner(),f)),t.bannerSprite(q.banner(),f)]);
  const bb=sp.filter(([n,q,s])=>s.width!==16||q.h>16||q.w>12||q.inner||q.open);info('banners: '+sp.filter((x,i)=>!(i%2)).map(([n,q])=>n+' '+q.w+'x'+q.h).join(', '));
  ok(!bb.length&&t.bannerSprite(L.banner(),0)!==t.bannerSprite(L.banner(),1),'each banner in a 16 cell, at most 12 x 16, outlined round the silhouette only, fluttering in two frames'+(bb.length?': '+bb.slice(0,3).map(([n,q])=>n+' '+q.w+'x'+q.h+' '+q.inner+'/'+q.open).join(', '):''));
  // (drawn: over the party, after every figure, yours last; none for a party out of sight or sheltering inside)
  t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];G.mode='world';G.modal=false;t.hidePanel();G.clock=t.DAY*.3;
  let spot=null;for(let ty=12;ty<t.MH-12&&!spot;ty++)for(let tx=12;tx<t.MW-12&&!spot;tx++){const x=(tx+.5)*16,y=(ty+.5)*16;if(t.tAt(tx,ty)===t.T_OPEN&&!t.hiddenAt(x,y)&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>200)&&W.sites.every(z=>Math.hypot(z.x-x,z.y-y)>80))spot=[x,y]}
  P.x=spot[0];P.y=spot[1];P.stay=null;t.reveal();Object.assign(L,{x:P.x+40,y:P.y,inside:null,fight:null,dead:false});
  const c=t.ctx,orig=c.drawImage;let drawn=[];c.drawImage=function(img,...a){drawn.push(img);return orig.call(c,img,...a)};const sees=()=>{drawn=[];t.drawWorld();return drawn};
  try{const fl=s=>[0,1].map(f=>t.bannerSprite(s.banner(),f)),has=(d,q)=>fl(q).some(s=>d.includes(s)),at=(d,q)=>Math.max(...fl(q).map(s=>d.lastIndexOf(s)));
   const d1=sees(),fig=Math.max(...[0,1,2,3].map(f=>d1.lastIndexOf(t.partySprite(t.FACS[L.fac].col,t.C.horse,f))));
   ok(has(d1,L)&&has(d1,P)&&at(d1,L)>fig&&at(d1,P)>at(d1,L),'a lord in sight flies his banner, drawn after the figures (over them and the trees), yours over his');
   L.x=P.x+t.vis()*1.5;const d2=sees();ok(!has(d2,L),'out of your sight, no banner');L.x=P.x+40;L.inside=tw.name;const d3=sees();ok(!has(d3,L),'sheltering inside a holding, none');L.inside=null}
  finally{c.drawImage=orig}
  // (a click on the banner picks its party; its ring still does)
  const B=t.bannerAt(L,0),q=t.opaqueBox(B.s);ok(t.pickAt(B.x+q[0]+4,B.y+q[1]+3)===L&&t.pickAt(L.x+6,L.y-4)===L,'a click on his banner picks him, and his ring still does');
  L.x=P.x+t.vis()*1.5;const B2=t.bannerAt(L,0);ok(t.pickAt(B2.x+q[0]+4,B2.y+q[1]+3)!==L,'a banner out of sight answers no click');L.x=-9999}
 // ---- beasts, herds, the caravan and the ships: their sizes and cells
 {const sz={wolf:[9,6],boar:[9,6],bear:[11,8],tiger:[11,6],spider:[9,6],scorpion:[10,7],slime:[7,5],troll:[9,13],wyrm:[15,7],griffin:[12,9]},rows=[],bad=[];
  for(const id of Object.keys(t.MONSTERS)){const M=t.MONSTERS[id];for(const f of [0,1]){const s=t.monsterMapSprite(id,f),q=look(s),z=sz[M.unit];
    if(M.mythic){if(s.width!==32)bad.push(id+' cell '+s.width);continue}
    if(!z||s.width!==(M.unit==='slime'?8:16)||Math.abs(q.w-z[0])>1||Math.abs(q.h-z[1])>1||q.inner||q.open)bad.push(id+' '+q.w+'x'+q.h+' in '+s.width+(q.inner||q.open?' outline '+q.inner+'/'+q.open:''));if(!f)rows.push(M.unit+' '+q.w+'x'+q.h)}}
  info('beasts: '+rows.join(', ')+'; the dragon in a 32 cell');
  ok(!bad.length&&rows.length>=10,'every beast on the map has its own small figure in a 16 cell (a slime in 8) at its size (the dragon its drake, 32: it should look huge)'+(bad.length?': '+bad.join('; '):''));
  ok(t.monsterMapSprite('wolf',0)!==t.unitSprite('wolf',1,false,0,2)&&t.monsterMapSprite('wolf',0)!==t.monsterMapSprite('wolf',1),'not the battle\'s figures, two steps each');
  const csz={cow:[11,7,16],sheep:[6,5,8],pig:[6,5,8],goat:[6,5,8],deer:[9,8,16],stag:[9,9,16],reindeer:[9,9,16],ibex:[9,8,16],gazelle:[9,8,16],hen:[6,5,8],rabbit:[6,5,8],hare:[6,5,8],fowl:[6,5,8],camel:[12,9,16],buffalo:[11,7,16],tamereindeer:[9,9,16]},cr=[],cb=[];
  for(const id of Object.keys(t.CRITTERS))for(const f of [0,1]){const s=t.critterSprite(id,f),q=look(s),z=csz[id];if(!z||s.width!==z[2]||Math.abs(q.w-z[0])>1||Math.abs(q.h-z[1])>1||q.inner||q.open)cb.push(id+' '+q.w+'x'+q.h+' in '+s.width);if(!f)cr.push(id+' '+q.w+'x'+q.h)}
  info('herds: '+cr.join(', '));
  ok(!cb.length,'every animal of the herds at its size: a cow or a water buffalo 11 x 7 in 16, a camel 12 x 9, a sheep, pig or goat 6 x 5 in 8, deer and their kin some 9 x 8 in 16, a hen or a rabbit in 8'+(cb.length?': '+cb.join('; '):''));
  const cv=[0,1,2,3].map(f=>look(t.caravanSprite('#c74453',f)));ok(cv.every(q=>q.cell===32&&q.w>=28&&q.w<=31&&q.h<=13),'a caravan (ox, cart, drover) some 30 x 12 in a 32 cell ('+cv[0].w+' x '+cv[0].h+')');
  const cog=look(t.shipSprite({seed:1,big:true,col:'#c74453'})),boat=look(t.shipSprite({seed:1,big:false})),mc=t.shipSprite({seed:1,big:true,moored:true}),mb=t.shipSprite({seed:1,big:false,moored:true});
  ok(cog.cell===32&&Math.abs(cog.w-26)<=2&&Math.abs(cog.h-20)<=2&&boat.cell===16&&Math.abs(boat.w-14)<=2&&boat.h<=9,'a cog some 26 x 20 in a 32 cell ('+cog.w+' x '+cog.h+'), a rowing boat some 12 x 8 in 16 ('+boat.w+' x '+boat.h+')');
  ok(mc.width===32&&mb.width===16&&t.opaqueBox(mc)[3]===31&&t.opaqueBox(mb)[3]===15&&mc.hull>0&&mc.top>mc.hull,'moored, they keep their cells and waterlines (the pier reads their hull and castles: hull '+mc.hull+', top '+mc.top+')')}
 // ---- the host: at most 9 followers, ranks 4 px apart
 ok(t.hostSize(4)===0&&t.hostSize(12)>0&&t.hostSize(200)===9,'a host shows at most 9 followers ('+[12,30,60,200].map(n=>n+' → '+t.hostSize(n)).join(', ')+')');
 // ---- click targets keep their size: each kind's ring, the reach; a lord, a caravan still answer on their figures
 {const rings={};const at={x:0,y:0,V:1e9,add:(q,r,dy)=>{rings[q.mapKind]=[r,dy||0]},box(){},fig(){},camp(){}};
  const tw=t.townBy('Ashford'),L=W.lords.find(l=>!l.dead);t.spawnBandit(true);
  const things=[L,t.bandits[0],t.asParty({pt:true,watch:'day',home:tw.name,fac:tw.owner,troops:['hum_spear'],x:0,y:0,cool:0,dir:1}),t.asParty({cv:true,fac:tw.owner,from:tw.name,to:tw.name,x:0,y:0,goods:{},guards:2,cool:0,dir:1}),
   t.asMonster({id:'wolf',x:0,y:0,lv:1,n:1}),t.asHerd({crit:true,id:'deer',x:0,y:0,n:2}),t.asRefugees({rf:true,from:tw.name,to:tw.name,n:4,x:0,y:0}),t.asWorker({folk:true,home:tw.name,x:0,y:0,st:'out'})];
  for(const q of things){q.inside=null;q.dead=false;q.pick(at)}
  const want={lord:[10,4],band:[10,4],patrol:[10,4],caravan:[11,5],monster:[11,6],critter:[9,4],refugee:[10,4],worker:[6,4]};
  ok(JSON.stringify(rings)===JSON.stringify(want)&&t.REACH===14,'every kind keeps its click ring for touch ('+Object.keys(rings).map(k=>k+' '+rings[k][0]).join(', ')+') and you reach what is 14 px off');
  // (a click 9 px from a lord's ring centre still meets him; on his horse's banner, away from the ring, too)
  t.bandits.length=0;W.lords.forEach(l=>{l.x=-9999;l.y=-9999});W.monsters=[];W.critters=[];W.caravans=[];W.refugees=[];W.folk=[];W.patrols=[];
  Object.assign(L,{x:P.x+40,y:P.y,inside:null,fight:null,dead:false});ok(t.pickAt(L.x+9,L.y-4)===L&&t.pickAt(L.x,L.y-4)===L,'a click on a lord\'s ring picks him, as wide as before (9 px off)');
  const F=t.partyFig(L,L.look(),0),b=t.opaqueBox(F.s),fx=F.flip?F.x+F.s.width-1-b[0]-1:F.x+b[0]+1,fy=F.y+b[1]+1;ok(t.pickAt(fx,fy)===L,'and on his banner\'s top, on the figure itself')}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
