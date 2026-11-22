'use strict';
Kit.suite(({ok})=>{const t=T,P=t.P,G=t.G,C=t.Carcass,H=t.IndividualHealth;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();G.paused=true;
 const home=Kit.goHome('Ashford');Kit.goTo(home.x+350,home.y+300);P.troops={hum_foot:2};
 const foe=t.asParty({kind:'bandits',x:P.x+25,y:P.y,list:['militia','archer'],ld:null,cool:0});t.bandits.push(foe);G.enc={kind:'party',ref:foe,list:foe.troops.slice(),allies:[],foes:[]};t.startBattle({enemies:G.enc.list,tournament:false});const b=t.B;
 for(const u of b.units.filter(u=>u.team===1)){u.hp=0;const cp={x:u.x,y:u.y,team:u.team,face:1,wait:true};b.corpses.push(cp);t.vfxDeath(u,cp)}
 const fallen=C.from(b);ok(fallen.length===2&&fallen.every(c=>c.bandit&&!c.ours),'real roaming bandit casualties retain bandit ownership on their corpses');
 C.list=[];t.lootEnd();C.lay(fallen);const bodies=C.list.slice();
 ok(bodies.every(c=>!c.empty()&&c.gold>=t.CARCASS.banditGold[0]&&c.gold<=t.CARCASS.banditGold[1]),'each otherwise empty bandit corpse receives a small coin purse');
 ok(bodies.every(c=>c.what().includes('gold')&&c.tip().includes('look')),'coins make a corpse visibly lootable, with its gold in the tooltip');
 const amount=bodies.reduce((n,c)=>n+c.gold,0),gold=P.gold;bodies[0].meet();ok(P.gold===gold+amount&&bodies.every(c=>!c.gold),'searching nearby bodies transfers their coins once');
 C.done();bodies[0].meet();ok(P.gold===gold+amount&&bodies.every(c=>c.empty()),'reopening picked-clean bodies cannot create more gold');
 const saved=C.save(),loaded=saved.map(c=>t.asCarcass(JSON.parse(JSON.stringify(c))));ok(loaded.every(c=>!c.gold&&c.empty()),'picked-clean coin purses stay empty across save and restore');
 const fresh=t.asCarcass({cc:1,x:P.x,y:P.y,day:G.day,bandit:true,items:[]});C.provision([fresh]);C.list=[fresh];const held=fresh.gold,json=JSON.parse(JSON.stringify(C.save()));C.list=json.map(c=>t.asCarcass(c));ok(C.list[0].gold===held&&!C.list[0].empty(),'uncollected coin purses persist in saves');
 const stocked=t.asCarcass({cc:1,x:P.x,y:P.y,day:G.day,bandit:true,items:[{k:'good',id:'meat',n:1}]}),animal=t.asCarcass({cc:1,x:P.x,y:P.y,day:G.day,bandit:true,bst:true,items:[]}),friend=t.asCarcass({cc:1,x:P.x,y:P.y,day:G.day,bandit:true,ours:true,items:[]});C.provision([stocked,animal,friend]);
 ok(!stocked.gold&&!animal.gold&&!friend.gold,'existing items need no fallback; animals and friendly casualties do not gain invented coin purses');
 const robber=t.asParty({kind:'bandits',x:P.x,y:P.y,list:['militia'],corpse:{x:P.x,y:P.y,wait:0}});C.seek(robber,.1);ok(robber.plunder.gold===held&&C.list[0].empty(),'NPC looters transfer corpse coins to their own plunder and empty the purse');
 ok(C.isBandit({residentSite:Object.create(t.BanditCamp.prototype)})&&!C.isBandit({sourceArmy:{mapKind:'garrison'},team:0}),'hostile camp residents qualify; ordinary garrison soldiers do not');
 const sprite=document.createElement('canvas');sprite.width=32;sprite.height=40;sprite.getContext('2d').fillRect(10,17,10,20);
 ok(H.top(sprite)===21,'health anchors ignore transparent pixels above the visible sprite');
 ok(t.UNIT_HEALTH.size===2&&t.UNIT_HEALTH.scale<1&&t.UNIT_HEALTH.clear===1,'health squares are smaller and clear the visible body by only one scaled pixel');
 t.HPBARS.on=true;const paint=H.paint,seen=[];H.paint=function(...a){seen.push(a);return paint.apply(this,a)};
 try{H.battle();const u=b.hero,k=H.scale(t.unitIconScale(),b.world?t.VS:t.bview().k),p=t.fromField({x:u.x,y:u.y-t.fieldLift(u.x,u.y)-(H.top(t.actorSprite(u,0,true))+(u.z||0))*t.fightSpace()});ok(seen.some(a=>Math.abs(a[0]-p.x)<.01&&Math.abs(a[1]-(p.y-k))<.01&&a[4]===k),'the actual battle overlay uses the close body anchor and reduced scale')}finally{H.paint=paint}
 ok(H.scale(2/3,3)===1/3&&H.scale(.01,3)===1/3,'compact squares keep whole device-pixel edges and remain visible when zoomed out');
 ok(!ERR.length,'no runtime errors');
});
