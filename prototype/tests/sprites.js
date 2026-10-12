'use strict';
// Sprites: everything is drawn by code. Soldiers get varied looks and animated poses with an outline, struck fighters flash,
// every holding, site, critter and obstacle has a sprite, the world map is painted in detail and roads and holdings stay clear.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),out=()=>{const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
 const t=T,G=t.G,P=t.P,W=t.W;const world2=()=>{t.hidePanel();G.mode='world';G.modal=false;G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['militia']}};
 try{
  t.act('begin','soldier');
  ok((0,eval)('typeof ART')==='undefined'&&!document.querySelector('script[src="js/art.js"]')&&!document.getElementById('artBtn'),'no sprite sheets are loaded and there is no art switch');
  ok(t.TOWNS.every(x=>t.holdingSprite(x).width>0),'every holding has a generated sprite');
  ok(['cave','ruins','shrine','hideout','travelers'].every(ty=>t.siteSprite({type:ty,seed:7,i:1,x:100,y:100,kind:0}).width>0),'every kind of site has a generated sprite');
  ok(['grass','frost','desert','swamp'].every(c=>t.obstacleSprite('tree',c).width>0&&t.obstacleSprite('rock',c).width>0),'trees and rocks for every climate');
  ok(Object.keys(t.CRITTERS).every(k=>t.critterSprite(k).width>0),'every critter has a sprite');
  ok(Object.keys(t.ST).every(k=>t.unitSprite(k,1,false).width>0),'every fighter has a sprite');
  // drawing
  P.troops={hum_spear:3,hum_bow:2,hum_knight:1,dw_axe:1,elf_glade:1,orc_wolf:1};P.comps={brann:{ap:0,role:''}};G.mode='world';G.modal=false;t.hidePanel();
  G.enc={kind:'party',ref:{cool:0,x:P.x,y:P.y},list:['orc_grunt','chief','boar','troll','dragon']};t.startBattle({enemies:G.enc.list,tournament:false});
  for(let i=0;i<40;i++)t.updateBattle(.03);t.B.units.forEach(u=>u.atkAt=t.B.t-.1);t.drawBattle();for(let i=0;i<5;i++)t.updateBattle(.03);t.drawBattle();
  ok(t.B.units.filter(u=>u.plx!=null).length>=10,'a battle draws its fighters');
  t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  W.sites.forEach(s=>s.seen=true);P.gear.mount='m_horse';G.mode='world';t.drawWorld();ok(Object.keys(t.spr).some(k=>k.startsWith('p#e8b94a'+t.ITEMS.m_horse.col)),'the hero rides a horse on the map');P.gear.mount=null;
  const px=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.join(),looks=new Set([0,1,2,3,4,5].map(v=>px(t.unitSprite('hum_spear',0,false,v))));
  ok(looks.size===6,'six different looks for one kind of soldier');
  ok(px(t.unitSprite('hero',0,true,3))===px(t.unitSprite('hero',0,true,0)),'your hero always looks the same');
  world2();t.startBattle({enemies:['militia','militia','militia'],tournament:false});ok(t.B.units.every(u=>u.v>=0&&u.v<6),'every soldier in a battle gets a look');t.drawBattle();t.B.over=true;t.B.endT=0;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
  t.showTitle('settings');ok(!/Procedural|Pack sprites/.test(document.getElementById('panel').innerHTML),'Settings no longer offers an art choice');
 // procedural detail and animation
 {const px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let h=0;for(let i=0;i<d.length;i+=4)h=(h*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])|0;return h};
  const poses=[0,1,2,3,4,5,6,7,8].map(p=>px(t.unitSprite('spearman',0,false,1,p)));ok(new Set(poses).size>=7,'a soldier has '+new Set(poses).size+' distinct poses: breathing, striding and striking');
  const s0=t.unitSprite('militia',1,false,2,0),d0=s0.getContext('2d').getImageData(0,0,s0.width,s0.height).data;let dark=0;for(let i=0;i<d0.length;i+=4)if(d0[i+3]>150&&d0[i]<30&&d0[i+1]<30&&d0[i+2]<30)dark++;
  ok(s0.width===22&&dark>20,'procedural sprites have a dark outline');
  const w=t.whiteOf(s0),wd=w.getContext('2d').getImageData(0,0,w.width,w.height).data;let white=0,any=0;for(let i=0;i<wd.length;i+=4)if(wd[i+3]){any++;if(wd[i]===255&&wd[i+1]===255)white++}ok(any&&white===any,'a struck fighter flashes white');
  const m=t.worldCv().getContext('2d').getImageData(t.townBy('Ashford').x-200,t.townBy('Ashford').y-200,400,400).data,cols=new Set();for(let i=0;i<m.length;i+=16)cols.add(m[i]>>3<<10|m[i+1]>>3<<5|m[i+2]>>3);
  ok(cols.size>40,'the world map is painted in '+cols.size+' shades around Ashford');
  t.worldCv();let roads=0,clearRoads=0;for(let i=0;i<t.tiles.length;i++)if(t.tiles[i]===t.T_ROAD){roads++;if(t.isClear((i%t.MW+.5)*16,(Math.floor(i/t.MW)+.5)*16))clearRoads++}
  ok(roads&&clearRoads===roads&&t.TOWNS.every(x=>t.isClear(x.x,x.y)&&t.isClear(x.x,x.y-20)),'roads, holdings and their yards are kept clear of trees, hills and peaks');
  ok(t.TOWNS.every(x=>Object.values(t.bldSpots(x)).every(p=>t.isClear(p.x,p.y))),'every estate plot is cleared');
  ok(t.arenaFor('desert')!==t.arenaFor('frost')&&t.arenaFor('grass').width===t.VW,'each climate has its own battle ground');}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 out();
};
