'use strict';
// The map's people in the battle's figures (people.js MAP_FIGS; the owner, 2026-11-01: "can you update encounters and old sprites
// to look like current sprite designs?"): every kind (a road encounter's people standing, walking, kneeling and fallen, a rider and
// a horse alone, followers, workers and their loads, refugees and their bundles, a ship's crew) drawn with the battle's body, at
// the marchers' size and in their outline, kept, its feet where the map expects them; with the switch off, the old pictures again;
// a busy map's frame timed both ways
Kit.suite(({ok,info})=>{const t=T,G=t.G,P=t.P,W=t.W;Kit.begin('soldier');
 const k=t.figK(),OUT=t.PEOPLE_OUT,col='#c74453';
 // a picture's drawn box (w, h, its bottom row, its middle), its pixels and how many of them are the outline's navy
 const look=s=>{const d=s.getContext('2d',{willReadFrequently:true}).getImageData(0,0,s.width,s.height).data,b=t.opaqueBox(s);let n=0,out=0;
   for(let i=0;i<d.length;i+=4)if(d[i+3]){n++;if('#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('')===OUT)out++}
   return{w:b[2]-b[0]+1,h:b[3]-b[1]+1,bottom:b[3],mid:(b[0]+b[2]+1)/2,n,out:out/Math.max(1,n)}};
 const pixels=s=>s.getContext('2d',{willReadFrequently:true}).getImageData(0,0,s.width,s.height).data.join(',');
 const cell=s=>s.width===s.height&&[16,32,64].includes(s.width);
 // ---- the marchers' range: their figures on foot and riding (march.js marchSprite: unitSprite in the army's colour)
 const foot=['hum_levy','hum_spear','hum_pike','hum_bow','hum_guard','dw_clan','dw_axe','elf_glade','elf_spear','orc_grunt','orc_brute','hum_mage'],ride=['hum_squire','hum_knight','hum_lancer','elf_hart','dw_ram'];
 const span=list=>{const q=list.map(look);return{h:[Math.min(...q.map(x=>x.h)),Math.max(...q.map(x=>x.h))],w:[Math.min(...q.map(x=>x.w)),Math.max(...q.map(x=>x.w))],out:[Math.min(...q.map(x=>x.out)),Math.max(...q.map(x=>x.out))]}};
 const MF=span(foot.flatMap(u=>[0,2,4].map(p=>t.unitSprite(u,0,false,p%6,p,false,false,col)))),MR=span(ride.map(u=>t.unitSprite(u,0,false,1,0,false,false,col)));
 info('marchers on foot: '+MF.h.join('-')+' high, '+MF.w.join('-')+' wide, outline '+MF.out.map(x=>x.toFixed(2)).join('-')+'; riding '+MR.h.join('-')+' x '+MR.w.join('-'));
 const inR=(v,[a,b],d)=>v>=a-d&&v<=b+d;
 // ---- every kind, by the new builders
 const kinds=[],add=(name,s,how)=>kinds.push([name,s,how||'foot']);
 const roadKeys=Object.keys(t.ENC_LOOK),races=['human','dwarf','elf','orc'];
 for(const key of roadKeys)for(const r of races)for(const p of [0,2,5])add('road '+key+' '+r+' p'+p,t.figRoad(key,r,1,p));
 for(const r of races)for(let v=0;v<6;v++){add('follower '+r+v,t.figFollower(col,v,r,false,2+v%4));add('band '+r+v,t.figFollower(t.ENC_RAIDER,v,r,true,0))}
 for(const j of ['farmer','herder','woodcutter','miner','fisher','builder','quarry'])for(const c of [false,true])add('worker '+j+(c?' loaded':''),t.figWorker(j,'human',1,c?3:0,c));
 for(const r of races)for(let v=0;v<4;v++)add('refugee '+r+v,t.figRefugee(v,r,v?2+v:0));
 for(const tr of Object.keys(t.TRADES))add('carrier '+tr,t.figCarrier(t.peasantKind('human',tr),1,'#bda882',tr==='quarryman'?'quarry':tr,2));
 for(const key of ['pilgrim','herbalist','hunter','villager'])for(const r of ['human','dwarf'])add('kneel '+key+' '+r,t.figKneel(key,r,1),'kneel');
 for(const key of ['traveller','ander','shroud'])for(const b of [0,1])add('down '+key+(b?' in blood':''),t.figDown(key,'human',0,b),'down');
 for(const coat of ['horse','chestnut','horseB','horseG'])add('rider '+coat,t.figRider('messenger','human',0,'#3d74d6',coat,2),'ride');
 for(const coat of ['horse','chestnut'])for(const p of [0,3])add('horse '+coat+' p'+p,t.figHorse(coat,p),'horse');
 const bad=[],sizes={};
 for(const [name,s,how] of kinds){const q=look(s),why=[];
   if(!s.dense)why.push('not dense');if(!cell(s))why.push('cell '+s.width+'x'+s.height);if(!/blood|^rider|^horse/.test(name)&&(q.out<MF.out[0]-.08||q.out>MF.out[1]+.08))why.push('outline '+q.out.toFixed(2));// (a pool of blood has no outline; a rider and a horse keep the mounts' outline, 2026-11-06: those on foot are paper dolls, unoutlined)
   if(s.height-1-q.bottom>1)why.push('feet '+(s.height-1-q.bottom)+' over the bottom');
   if(how==='foot'&&(!inR(q.h,MF.h,2)||!inR(q.w,MF.w,3)))why.push(q.w+'x'+q.h);
   if(how==='ride'&&(!inR(q.h,MR.h,2)||!inR(q.w,MR.w,3)))why.push(q.w+'x'+q.h);
   if(how==='down'&&q.w<=q.h)why.push('not lying: '+q.w+'x'+q.h);
   if(how==='foot'&&Math.abs(q.mid-s.width/2)>5)why.push('middle '+q.mid);
   (sizes[how]=sizes[how]||[]).push(q.w+'x'+q.h);if(why.length)bad.push(name+': '+why.join(', '))}
 ok(!bad.length,kinds.length+' figures of every kind are the battle\'s bodies: dense, in a cell, their feet on its bottom row, the marchers\' outline, on foot and riding within the marchers\' size'+(bad.length?' ('+bad.slice(0,8).join('; ')+')':''));
 info('sizes: '+Object.entries(sizes).map(([h,L])=>h+' '+[...new Set(L)].slice(0,8).join(' ')).join(' | '));
 // (kneeling: lower than standing, its feet on the ground; the walk: the battle's four steps, each its own picture)
 {const st=look(t.figRoad('hunter','human',1,0)),kn=look(t.figKneel('hunter','human',1));ok(kn.h<st.h&&kn.bottom===st.bottom,'kneeling: '+(st.h-kn.h)+' px lower than standing, on the ground as he stands (row '+kn.bottom+')')}
 {const ps=[2,3,4,5].map(p=>pixels(t.figRoad('traveller','human',0,p)));ok(new Set(ps).size>=3&&ps.join('|')===[2,3,4,5].map(p=>pixels(t.figOf(t.ENC_LOOK.traveller('human',0),p))).join('|')&&t.figPose(0,false)===0&&[0,1,2,3,4,5,6,7].map(f=>t.figPose(f,true)).join('')==='23452345','walking: the marchers\' four steps (a step each WALK.foot px; the third the standing stride, as theirs), standing at 0')}
 // (kept: made once)
 ok(t.figRoad('bard','elf',2,3)===t.figRoad('bard','elf',2,3)&&t.figFollower(col,1,'orc',false,2)===t.figFollower(col,1,'orc',false,2)&&t.figDown('traveller','human',0,1)===t.figDown('traveller','human',0,1)&&t.FIGURES.get('mrpbardelf2p3'),'each made once, kept in FIGURES by its look and pose');
 // (their things: a load on a worker's back, a refugee's bundle, a peddler's pack, a bard's lute, a bandage; the battle's bodies untouched)
 {const differ=[[t.figWorker('farmer','human',0,0,true),t.figOf({...t.workerLook('farmer','human',0,true),load:null},0)],[t.figRefugee(0,'human',0),t.figOf(t.refugeeLook(0,'human'),0)],[t.figRoad('peddler','human',0,0),t.figOf({...t.ENC_LOOK.peddler('human',0),load:null},0)],
   [t.figRoad('bard','human',0,0),t.figOf({...t.ENC_LOOK.bard('human',0),weapon:null},0)],[t.figRoad('healed','human',0,0),t.figRoad('traveller','human',0,0)]].map(([a,b])=>pixels(a)!==pixels(b));info('their things show: '+differ.join(' '));
  ok(differ.every(Boolean),'their own things show: a worker\'s load, a refugee\'s bundle, a peddler\'s pack, a bard\'s lute, a bandage')}
 // ---- the picture at the map's size (a click, the box, a page's banner)
 {const s=t.figRoad('beggar','human',0,0),m=t.figPic(s);ok(m===t.figPic(s)&&m.width===Math.ceil(s.width*k)&&m.ch===Math.ceil(s.ch*k)&&look(m).h<=Math.ceil(look(s).h*k)+1,'at the map\'s size: '+m.width+'x'+m.height+' ('+look(m).w+'x'+look(m).h+' drawn), kept')}
 // ---- the road's encounters: their people dense, drawn as the marchers are, their boxes about their feet; off, the old pictures
 Kit.clear();Kit.world();const home=Kit.goHome();t.roadSt().on=[];const es=[];let i=0;
 for(const key of Object.keys(t.ROAD_ENC)){const a=i++*.7,e=t.roadSpawn(key,P.x+Math.cos(a)*40,P.y+Math.sin(a)*40);if(e)es.push(e)}
 const PEOPLE=['walk','stand','kneel','down','soldier','refugee','worker','rider','horse'];
 const pieces=()=>es.flatMap(e=>{const R=t.roadPieces(e);return t.ENC_SCENE.lay(e,true).map((p,j)=>[e,p,R[j][1]])}).filter(([e,p])=>PEOPLE.includes(p.k));
 {const on=pieces(),boxOn=es.map(e=>t.ENC_SCENE.box(e)),picsOn=es.map(e=>t.ENC_SCENE.pics(e));
   t.MAP_FIGS.on=false;let off,boxOff,picsOff;try{off=pieces();boxOff=es.map(e=>t.ENC_SCENE.box(e));picsOff=es.map(e=>t.ENC_SCENE.pics(e))}finally{t.MAP_FIGS.on=true}
   ok(on.length>=10&&on.every(([e,p])=>p.s&&p.s.dense),on.length+' people in '+es.length+' road encounters ('+[...new Set(on.map(([e,p])=>p.k))].join(', ')+'): each the battle\'s figure');
   const old=(e,p,w)=>{const r=e.race||'human',v=p.o.v||0;return p.k==='walk'||p.k==='stand'?t.roadPerson(w,r,v,0):p.k==='kneel'?t.roadKneel(w,r,v):p.k==='down'?t.roadDown(w,r,v,p.o.blood):p.k==='soldier'?t.followerSprite(p.o.col||t.ENC_RAIDER,0,v,r,p.o.band):p.k==='refugee'?t.refugeeSprite(0,v):p.k==='worker'?t.workerSprite(w,0,r,v):p.k==='rider'?t.roadRider(w,r,v,0,p.o.col,p.o.coat):t.roadHorse(p.o.coat||'horse',0)};
   ok(off.length===on.length&&off.every(([e,p,w])=>!p.s.dense&&p.s===old(e,p,w)),'MAP_FIGS.on false: the old pictures, the very ones (roadPerson, roadKneel, roadDown, followerSprite, refugeeSprite, workerSprite, roadRider, roadHorse)');
   const feet=boxOn.every((b,j)=>Math.abs(b[3]-boxOff[j][3])<=1&&b[0]<=es[j].x&&b[2]>=es[j].x),dh=boxOn.map((b,j)=>(boxOff[j][3]-boxOff[j][1])-(b[3]-b[1]));
   ok(feet&&picsOn.every((L,j)=>L.length===picsOff[j].length),'their boxes stand on the same feet (bottoms within a px, about the same point; heights '+Math.min(...dh)+' to '+Math.max(...dh)+' px less), and their banners show as many pictures')}
 {const e=es.find(x=>t.ENC_SCENE.lay(x,false).some(p=>PEOPLE.includes(p.k))),ents=[],seen=[],keep=window.drawFig;window.drawFig=function(s){seen.push(s);return keep.apply(this,arguments)};
   try{t.ENC_SCENE.draw(e,ents,G.cam);for(const q of ents)q.f()}finally{window.drawFig=keep}
   ok(seen.length>0&&seen.every(s=>s.dense),'drawn as the marchers are (drawFig: '+k+' as big, by the feet), '+seen.length+' of them')}
 // ---- refugees on the road and a worker carrying his load (folk.js): the new figures; off, the old
 {const r=t.asRefugees({rf:true,from:home.name,to:home.name,n:12,why:'raided',race:'dwarf',goods:{},purse:5,x:P.x+20,y:P.y,dir:1,cool:0});W.refugees=[r];
   const spy=names=>{const got={},keep=names.map(n=>window[n]);names.forEach((n,i)=>{got[n]=[];window[n]=function(){got[n].push([...arguments]);return keep[i].apply(this,arguments)}});return[got,()=>names.forEach((n,i)=>{window[n]=keep[i]})]};
   const draw=o=>{const ents=[];o.draw(ents,G.cam,t.vis()+999);for(const q of ents)q.f();return ents.length};
   let [got,undo]=spy(['figRefugee','refugeeSprite']);try{draw(r)}finally{undo()}
   const on=got;[got,undo]=spy(['figRefugee','refugeeSprite']);t.MAP_FIGS.on=false;try{draw(r)}finally{undo();t.MAP_FIGS.on=true}
   ok(on.figRefugee.length>=3&&!on.refugeeSprite.length&&on.figRefugee.every(a=>a[1]==='dwarf')&&got.refugeeSprite.length>=3&&!got.figRefugee.length,'refugees: '+on.figRefugee.length+' battle figures of their people (dwarves) with their bundles; off, the old small ones');W.refugees=[];
   const wk=t.asWorker({id:'t|1',home:home.name,k:'farm',job:'farmer',x:P.x+12,y:P.y,dir:1,st:'out',ph:.3,moving:false});W.folk=[wk];t.FOLK_SEEN.add(home.name+'|farm');
   [got,undo]=spy(['figCarrier','unitSprite']);try{draw(wk)}finally{undo()}
   ok(got.figCarrier.length===1&&got.figCarrier[0][3]==='farmer','a worker on his way to the holding: his trade\'s figure with his load on his back, his tool left behind');
   [got,undo]=spy(['figCarrier','unitSprite']);t.MAP_FIGS.on=false;try{draw(wk)}finally{undo();t.MAP_FIGS.on=true}
   ok(!got.figCarrier.length&&got.unitSprite.length>=1,'off: the trade\'s figure as before');W.folk=[]}
 // ---- ships: the crew the battle's figures at their density (hi), the picture and its anchors as before
 {const keys=['ax','ay','cw','ch','stern','net','hull','top'],sh=o=>t.shipSprite(o),os=[{seed:4,big:true,col:'#a8483a'},{seed:5,big:false},{seed:6,big:true,col:'#3d74d6',moored:true},{seed:7,big:false,moored:true}];
   const nu=os.map(sh);t.MAP_FIGS.on=false;let old;try{old=os.map(sh)}finally{t.MAP_FIGS.on=true}
   const z=Math.round(1/k);
   ok(nu.every((s,j)=>s!==old[j]&&s.hi&&s.hi.width===s.width*z&&!old[j].hi&&keys.every(q=>s[q]===old[j][q])&&JSON.stringify(s.posts)===JSON.stringify(old[j].posts)&&Math.abs(t.opaqueBox(s)[1]-t.opaqueBox(old[j])[1])<=1),'ships: their crews at the battle\'s density (hi, '+z+'x), drawn back to the map\'s size; the picture\'s anchors and top as before');
   ok(pixels(nu[3])===pixels(old[3])&&pixels(nu[0])!==pixels(old[0]),'a moored rowing boat (no one in it) the same; a cog\'s crew changed')}
 // ---- a busy map's frame, both ways (the owner's PC: a few frames only)
 {Kit.goHome();t.roadSt().on=es;for(const e of es){e.x=P.x+(e.x-home.x);e.y=P.y+(e.y-home.y)}
   W.refugees=[0,1,2,3].map(j=>t.asRefugees({rf:true,from:home.name,to:home.name,n:18,why:'raided',race:'human',goods:{},purse:5,x:P.x-50+j*30,y:P.y+30,dir:j%2?1:-1,cool:0}));
   const time=n=>{for(let j=0;j<3;j++)t.drawWorld();const t0=performance.now();for(let j=0;j<n;j++){t.FIGURES.frame();t.drawWorld()}return(performance.now()-t0)/n};
   const a=time(20);t.MAP_FIGS.on=false;let b;try{b=time(20)}finally{t.MAP_FIGS.on=true}const a2=time(20);
   info('a busy map ('+es.length+' encounters, 4 refugee bands): '+Math.min(a,a2).toFixed(2)+' ms a frame with the new figures, '+b.toFixed(2)+' ms with the old');
   ok(Math.min(a,a2)<=b*1.25+1,'no frame cost worth noting ('+Math.min(a,a2).toFixed(2)+' ms against '+b.toFixed(2)+')');W.refugees=[];t.roadSt().on=[]}
 ok(!ERR.length,'no errors'+(ERR.length?': '+ERR.slice(0,3).join(' | '):''));
});
