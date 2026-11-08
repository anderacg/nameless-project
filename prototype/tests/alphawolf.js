'use strict';
window.ARENA=true;
// Real alpha pack member: spawning, counts, persistence, combat, rewards and larger mounts.
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');const PX=t.PX,K=t.WOLF_ALPHA,ST=t.ST,A=PX.wolf;
 const make=(extra={})=>t.asMonster({id:'wolf',x:t.P.x+40,y:t.P.y,hx:t.P.x+40,hy:t.P.y,lv:1,n:5,t:0,a:0,cool:0,...extra});
 const m=make({alpha:1}),plain=make();
 ok(ST[K.unit].hp>ST.wolf.hp&&ST[K.unit].dmg>ST.wolf.dmg&&ST[K.unit].beast,'Alpha Wolf is a tougher wolf unit, not an extra cosmetic pack icon');
 const base=PX.beast('wolf',{pose:0,team:1}),alpha=PX.beast(K.unit,{pose:0,team:1});
 ok(alpha.width===60&&alpha.height===40&&alpha.fh>base.fh&&PX.beastMap(K.unit,0).fh>PX.beastMap('wolf',0).fh,'alpha combat and map sprites are 25% larger');
 ok(PX.BEAST_KINDS.includes(K.unit)&&PX.BEAST_DEATHS[K.unit].length===3&&PX._beastFit(K.unit).ok,'all alpha poses and deaths are registered and fit their canvas');
 const broken=[];
 for(let f=0;f<PX.WOLF_ART.frames.length;f++){
  const c=A.alphaRender({pose:A.first+f,team:1}),w=c.width,h=c.height,d=c.getContext('2d').getImageData(0,0,w,h).data,on=(x,y)=>x>=0&&y>=0&&x<w&&y<h&&d[(y*w+x)*4+3],seen=new Set();let components=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const j=y*w+x;if(d[j*4+3]!==0&&d[j*4+3]!==255)broken.push(f+' alpha');
   if(!on(x,y)&&on(x-1,y)&&on(x+1,y)&&on(x,y-1)&&on(x,y+1))broken.push(f+' gap');
   if(!on(x,y)||seen.has(j))continue;components++;const q=[j];seen.add(j);
   while(q.length){const k=q.pop(),xx=k%w,yy=Math.floor(k/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const X=xx+dx,Y=yy+dy,n=Y*w+X;if(on(X,Y)&&!seen.has(n)){seen.add(n);q.push(n)}}}
  }
  if(components!==1)broken.push(f+' components '+components);
 }
 ok(!broken.length,'all 108 alpha poses render directly from the reference master with solid pixels and a connected silhouette'+(broken.length?': '+broken.slice(0,12).join(', '):''));
 const face=alpha.getContext('2d').getImageData(0,0,alpha.width,alpha.height).data,hasColor=color=>Array.from({length:face.length/4},(_,i)=>i*4).some(i=>face[i+3]&&color.every((v,j)=>face[i+j]===v));
 ok(hasColor([37,49,48])&&hasColor([233,188,88]),'the reference nose and amber eye remain visible on the native alpha frame');
 ok(m.n===5&&m.size===5&&m.troops.length===5&&m.troops[0]===K.unit&&m.tc[K.unit]===1&&m.tc.wolf===4,'an alpha replaces one ordinary wolf; total pack headcount stays five');
 ok(m.power()>plain.power()&&m.fightPower()>plain.fightPower(),'encounter and world-fight power include the stronger alpha');
 ok(m.tip().includes('Alpha Wolf')&&m.label().includes('Alpha Wolf'),'pack tooltips and labels identify the leader');
 const rows=t.marchRows(m),lead=rows.find(r=>r.type===K.unit);ok(lead&&lead.count===1&&lead.x===0&&lead.y===0&&rows.reduce((n,r)=>n+r.count,0)===5,'the alpha leads the map formation without being counted twice');
 const restored=t.asMonster(JSON.parse(JSON.stringify(m)));ok(restored.alpha===1&&restored.n===5&&restored.tc[K.unit]===1&&restored.troops.length===5,'packed save/load preserves the leader and mixed roster');
 ok(restored.remove(K.unit,1)===1&&restored.n===4&&!restored.alpha&&!restored.troops.includes(K.unit),'killing the alpha through the roster removes it permanently');
 const dead=t.asMonster(JSON.parse(JSON.stringify(restored)));dead.add('wolf',1);ok(!dead.alpha&&dead.n===5&&!dead.troops.includes(K.unit),'loading and adding ordinary wolves cannot resurrect a slain alpha');
 const survivors=make({alpha:1});survivors.troops=['wolf','wolf'];ok(survivors.n===2&&!survivors.alpha&&survivors.tc.wolf===2,'battle survivor lists clear a dead leader');survivors.troops=[K.unit,'wolf'];ok(survivors.n===2&&survivors.alpha===1&&survivors.tc[K.unit]===1,'survivor lists preserve a living leader');
 const cut=make({alpha:1});ok(cut.removeAny(4).every(k=>k==='wolf')&&cut.n===1&&cut.alpha===1&&cut.removeAny(1)[0]===K.unit&&!cut.n&&!cut.alpha,'abstract pack losses remove and report the correct unit types');
 const chance=K.chance,random=Math.random;let selected=0;
 try{Math.random=()=>{throw Error('alpha selection touched the shared RNG')};for(let i=0;i<1000;i++)if(t.wolfAlphaAt({id:'wolf',n:5,hx:100+i*17,hy:200+i*31,lv:1}))selected++;
  K.chance=0;ok(!t.wolfAlphaAt(make()),'zero chance produces ordinary packs');K.chance=1;ok(t.wolfAlphaAt(make())&&!t.wolfAlphaAt(make({n:1}))&&!t.wolfAlphaAt({id:'bear',n:5}),'only multi-wolf packs can receive one leader');
 }finally{K.chance=chance;Math.random=random}
 ok(selected>150&&selected<350,'alpha presence is occasional and deterministic: '+selected+' / 1000 lairs');
 const weights=Object.fromEntries(Object.entries(t.MONSTERS).map(([k,v])=>[k,v.w]));
 try{for(const [k,M]of Object.entries(t.MONSTERS))M.w=k==='wolf'?1:0;K.chance=1;const before=t.W.monsters.length;for(let i=0;i<4&&t.W.monsters.length===before;i++)t.spawnMonster(true);const born=t.W.monsters.slice(before);ok(born.length>0&&born.every(m=>m.id==='wolf'&&m.alpha===1&&m.troops.filter(k=>k===K.unit).length===1),'the production spawn path assigns a single alpha at birth');}
 finally{for(const[k,w]of Object.entries(weights))t.MONSTERS[k].w=w;K.chance=chance}
 t.startMonster(m);ok(t.G.enc.list.filter(k=>k===K.unit).length===1&&t.G.enc.list.length===5&&document.getElementById('panel').textContent.includes('Alpha Wolf'),'encounters include and display the alpha alongside its pack');t.G.enc=null;t.G.mode='world';t.hidePanel();
 ok(t.monsterXp(m,[K.unit,'wolf','wolf'])===K.xp+20,'slaying an alpha grants its own XP');const pelts=t.invCount('mat','pelt');t.monsterLoot(m,[K.unit,'wolf']);ok(t.invCount('mat','pelt')===pelts+2,'alpha wolves still yield wolf pelts');
 const L=t.lookOf('orc_wolf',0,false,0),art=PX.mountArt('wolf',-1,{C:t.pal('wolf'),M:t.pal('wool')});ok(art.g.w===40&&art.g.h===36&&art.riderX===6,'riders use larger alpha wolves with a centered saddle');
 const state=t.BEAST_TACTICS.on;try{t.BEAST_TACTICS.on=true;t.BattleLab.start({leftGroups:[{type:'militia',count:4}],rightGroups:[{type:K.unit,count:1},{type:'wolf',count:4}],seed:7,deploy:false,paused:true,ai:true});
  const B=t.B,u=B.units.find(u=>u.type===K.unit),normal=B.units.find(u=>u.type==='wolf');ok(u&&normal&&u.max>normal.max&&t.beastKind(u.grp)?.way==='pack','the alpha enters combat with its own stats and wolf pack tactics');ok(t.beastPose(u,false)>=A.first,'alpha combat uses the approved wolf animation clips');
 }finally{if(t.BattleLab.active)t.BattleLab.exit();t.BEAST_TACTICS.on=state}
 info('Alpha chance '+Math.round(K.chance*100)+'%; one replaces an ordinary pack member; rider mounts use the larger body.');
});
