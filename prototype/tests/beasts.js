'use strict';
// Beasts and monsters (engine/beasts.js): every beast and monster is drawn in the people figures' style, in a power-of-two cell
// (the dragon 64, the big ones 32), its feet on the unit's point, a dark navy outline round its silhouette only; three seeded
// variants; poses for standing, walking, running, its blows (the dragon's breath) and lying dead, shown as it moves and strikes;
// its own figure on the world map (the dragon flying); one of yours wears the side's blue; the old sprites are gone. Reports the
// cache and the drawing cost of a 200-strong monster battle.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,PX=t.PX;t.act('begin','soldier');
 const kinds=Object.keys(t.ST).filter(k=>t.ST[k].beast),poses=[...t.BEAST_POSES,PX.BEAST_DEAD];
 const data=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 const OUT=[0x1a,0x1c,0x26],isOut=(d,i)=>d[i+3]&&d[i]===OUT[0]&&d[i+1]===OUT[1]&&d[i+2]===OUT[2];
 // ---- every kind: the new figure, from the engine
 ok(kinds.length>=11&&kinds.every(k=>PX.BEAST_KINDS.includes(k)),kinds.length+' beasts and monsters, each a kind of the engine’s ('+kinds.join(', ')+')');
 ok(kinds.every(k=>t.unitSprite(k,1,false,0,0)===t.beastSprite(k,1,0,0)&&t.unitSprite(k,1,false,0,0).ch>0),'each fighter’s sprite is its new figure (unitSprite → beastSprite → PX.beast)');
 ok((0,eval)('typeof dragonSprite')==='undefined'&&(0,eval)('typeof bigBeastSprite')==='undefined'&&t.beastSprite.length===4&&!/outlined\(|bigBeast|dragonSprite/.test(t.unitSprite.toString()+t.corpseOf.toString()),'the old beast, big-beast and dragon sprites are gone and nothing calls them');
 // ---- cells: a power of two, the dragon 64, the big ones 32, the slime 16; feet on the row above the cell's bottom (its outline under)
 {const bad=[],size={};for(const k of kinds)for(const p of poses){const c=t.unitSprite(k,1,false,0,p),n=c.width;size[k]=n;
   if(c.height!==n||![8,16,32,64].includes(n))bad.push(k+' '+p+' '+c.width+'x'+c.height);}
  ok(!bad.length&&size.dragon===64&&size.troll===32&&size.wyrm===32&&size.slime===16&&size.wolf===32,'every pose in a power-of-two cell: '+kinds.map(k=>k+' '+size[k]).join(', ')+(bad.length?' — not: '+bad.slice(0,4).join('; '):''));
  // (the feet: the lowest coloured row is the one over the outline at the bottom, in every pose; drawn at y - height + 2 they stand on y)
  const off=[];for(const k of kinds)for(const p of poses){const c=t.unitSprite(k,1,false,0,p),d=data(c),n=c.width;let low=-1;
   for(let y=n-1;y>=0&&low<0;y--)for(let x=0;x<n;x++){const i=(y*n+x)*4;if(d[i+3]&&!isOut(d,i)){low=y;break}}if(p>=15&&p<=18?low<n-5||low>n-2:low!==n-2)off.push(k+' '+p+' ('+low+')')}
  ok(!off.length,'every pose stands on the unit’s point: its feet on the cell’s row n−2, the outline under them (running, it may leave the ground a little)'+(off.length?': '+off.slice(0,5).join(', '):''));
  // (c.ch: the figure's own height for the health bar: the standing figure's top, within the cell; the same in every pose)
  const ch=[];for(const k of kinds){const c=t.unitSprite(k,1,false,0,0),d=data(c),n=c.width;let top=n;for(let y=0;y<n&&top===n;y++)for(let x=0;x<n;x++)if(d[(y*n+x)*4+3]){top=y;break}
   if(c.ch!==n-top||poses.some(p=>t.unitSprite(k,1,false,0,p).ch!==c.ch))ch.push(k+' '+c.ch+'/'+(n-top))}
  ok(!ch.length,'each one’s height (c.ch) is its standing figure’s, the same in every pose: '+kinds.map(k=>k+' '+t.unitSprite(k,1,false,0,0).ch).join(', ')+(ch.length?' — off: '+ch.join(', '):''));
  // (its foot on the ground about the unit's size: the big ones (their reach 12 further) wide, the rest a soldier's to a horse's)
  const span=k=>{const c=t.unitSprite(k,1,false,0,0),d=data(c),n=c.width,y=n-2;let a=n,b=-1;for(let x=0;x<n;x++){const i=(y*n+x)*4;if(d[i+3]&&!isOut(d,i)){a=Math.min(a,x);b=Math.max(b,x)}}return b-a+1};
  const sp=Object.fromEntries(kinds.map(k=>[k,span(k)])),wide=kinds.filter(k=>t.ST[k].big?sp[k]<12||sp[k]>40:sp[k]<4||sp[k]>26);
  ok(!wide.length,'where each stands is about its size on the field (the feet’s span): '+kinds.map(k=>k+' '+sp[k]).join(', ')+(wide.length?' — off: '+wide.join(', '):''))}
 // ---- the outline: dark navy round the silhouette, and only there (taken off, the figure's own pixels outlined again give it back
 // exactly: no pixel of the figure itself is the outline's colour, and every pixel round it is)
 {const bad=[];let n=0;for(const k of kinds)for(const team of [0,1])for(const v of [0,1,2])for(const p of poses){const c=t.unitSprite(k,team,false,v,p),d=data(c),W=c.width,H=c.height;n++;
   const fig=(x,y)=>{if(x<0||y<0||x>=W||y>=H)return false;const i=(y*W+x)*4;return d[i+3]>0&&!isOut(d,i)};let why='';
   for(let y=0;y<H&&!why;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(d[i+3]&&d[i+3]!==255){why='half-clear';break}
     const rim=!fig(x,y)&&(fig(x-1,y)||fig(x+1,y)||fig(x,y-1)||fig(x,y+1));if(rim!==!!isOut(d,i)){why=(rim?'an edge not outlined':'the outline\u2019s colour inside')+' at '+x+','+y;break}}
   if(why&&!bad.some(b=>b.startsWith(k+' ')))bad.push(k+' v'+v+' pose '+p+' '+why)}
  ok(!bad.length,'the dark navy outline runs round every silhouette and nowhere inside it, true pixels only ('+n+' sprites)'+(bad.length?': '+bad.join('; '):''))}
 // ---- variants: three, seeded (the same each time, never Math.random), v and v+3 alike
 {const px=c=>Array.from(data(c)).join(),mr=Math.random;let calls=0;Math.random=()=>{calls++;return mr()};const fresh={},again={};
  try{for(const k of kinds){fresh[k]=[0,1,2].map(v=>px(PX.beast(k,{v,pose:0,team:1})));again[k]=px(PX.beast(k,{v:1,pose:0,team:1}))}}finally{Math.random=mr}
  ok(!calls&&kinds.every(k=>again[k]===fresh[k][1]),'the figures are seeded: drawn again they come out the same, and drawing them never calls Math.random ('+calls+')');
  const vb=kinds.filter(k=>!(new Set(fresh[k]).size===3&&t.unitSprite(k,1,false,4,0)===t.unitSprite(k,1,false,1,0)&&t.unitSprite(k,1,false,3,0)===t.unitSprite(k,1,false,0,0)));
  ok(!vb.length,'three variants of each (a coat, its shade and marks): a line of wolves is not one wolf copied'+(vb.length?': not '+vb.join(', '):''))}
 // ---- poses: standing, walking, running, the blow, the dragon's breath, dead
 {const few=kinds.filter(k=>new Set(poses.map(p=>t.unitSprite(k,1,false,0,p))).size<(k==='dragon'?16:13));
  ok(!few.length,'each has its poses: '+kinds.map(k=>k+' '+new Set(poses.map(p=>t.unitSprite(k,1,false,0,p))).size).join(', ')+(few.length?' — too few: '+few.join(', '):''));
  const walk=k=>new Set([2,3,4,5].map(p=>t.unitSprite(k,1,false,0,p))).size,atk=k=>new Set([6,7,8].map(p=>t.unitSprite(k,1,false,0,p))).size;
  ok(kinds.every(k=>walk(k)>=2&&atk(k)>=3&&t.unitSprite(k,1,false,0,15)!==t.unitSprite(k,1,false,0,2)),'a walk of several steps, a run of its own, a blow of three frames (wind up, strike, follow through)');
  ok(t.unitSprite('dragon',1,false,0,10)!==t.unitSprite('dragon',1,false,0,7)&&t.unitSprite('wolf',1,false,0,10)===t.unitSprite('wolf',1,false,0,7)&&t.unitSprite('bear',1,false,0,21)===t.unitSprite('bear',1,false,0,4),'the dragon breathes fire in its own frames; for the rest the second blow is the first, a climb the walk')}
 // ---- they take their poses in battle: walking and running as they move, striking as they attack, breathing fire, leaping
 {G.mode='world';G.modal=false;t.hidePanel();P.troops={hum_spear:6,hum_bow:3};t.startBattle({enemies:['wolf','bear','troll','spider','dragon'],tournament:false});const B=t.B;
  const u=k=>B.units.find(x=>x.type===k&&x.hp>0),w=u('wolf'),dr=u('dragon'),sp=u('spider');
  ok(w&&dr&&sp,'a battle with beasts and a dragon');
  B.t=10;w.atkAt=null;w.shot=null;w.z=0;w.spdNow=w.s.spd;const pr=t.beastPose(w,true);w.spdNow=w.s.spd*.5;const pw=t.beastPose(w,true),ps=t.beastPose(w,false);w.atkAt=B.t-t.ATK_ANIM*.5;const pa=t.beastPose(w,true);w.atkAt=null;w.z=6;const pj=t.beastPose(w,true);w.z=0;
  sp.shot={t:.1,aim:1};const pspit=t.beastPose(sp,false);sp.shot=null;dr.br=3.5-.1;const pb=t.beastPose(dr,false);dr.br=2;
  ok(pr>=15&&pr<=18&&pw>=2&&pw<=5&&ps<=1&&pa===7&&pj===16&&pspit===6&&pb===9,'its pose: running fast, walking, breathing at rest, mid-blow, in a pounce, winding up a spit, breathing fire ('+[pr,pw,ps,pa,pj,pspit,pb].join(', ')+')');
  // (drawn: the pose's figure is the one put on the field)
  const ctx=t.ctx,orig=ctx.drawImage,drawn=new Set();ctx.drawImage=function(img,...a){drawn.add(img);return orig.call(ctx,img,...a)};
  try{w.plx=w.x-1;w.ply=w.y;w.spdNow=w.s.spd*.5;w.hitAt=null;t.drawUnit(w);const walking=[...drawn].some(c=>[2,3,4,5].some(p=>c===t.unitSprite('wolf',w.team,false,w.v,p)));
   drawn.clear();w.plx=w.x;w.ply=w.y;w.movF=0;w.atkAt=B.t-t.ATK_ANIM*.5;t.drawUnit(w);const striking=drawn.has(t.unitSprite('wolf',w.team,false,w.v,7));w.atkAt=null;
   drawn.clear();dr.plx=dr.x;dr.ply=dr.y;dr.movF=0;dr.br=3.5-.05;t.drawUnit(dr);const fire=drawn.has(t.unitSprite('dragon',dr.team,false,dr.v,9));dr.br=2;
   ok(walking&&striking&&fire,'and drawn so on the field: the walk as it moves, the strike as it attacks, the breath ('+[walking,striking,fire]+')')}finally{ctx.drawImage=orig}
  // (the fallen: a beast drops to the ground and lies in its dead pose, lower than it stood)
  const c=t.corpseOf(w),top=s=>{const d=data(s),n=s.width;for(let y=0;y<n;y++)for(let x=0;x<n;x++)if(d[(y*n+x)*4+3])return y;return n};
  ok(c.beast&&c.down&&c.down===t.unitSprite('wolf',w.team,false,w.v,PX.BEAST_DEAD)&&c.down.width===c.beast.width&&top(c.down)>top(c.beast)+2&&kinds.every(k=>top(t.unitSprite(k,1,false,0,PX.BEAST_DEAD))>=top(t.unitSprite(k,1,false,0,0))&&t.unitSprite(k,1,false,0,PX.BEAST_DEAD)!==t.unitSprite(k,1,false,0,0)),'a beast that falls lies dead in its own pose, low on the ground, in the same cell (vfx.js drawCorpses): '+kinds.map(k=>k+' '+top(t.unitSprite(k,1,false,0,0))+'\u2192'+top(t.unitSprite(k,1,false,0,PX.BEAST_DEAD))).join(', '));
  // (made ahead: the battle's warm-up lists every beast's poses)
  t.warmBattle(B.units);const nb=t.WARM.b.length;let n=0;while((t.WARM.q.length||t.WARM.b.length)&&n++<2000)t.warmStep();ok(nb>=2*poses.length&&!t.WARM.q.length&&!t.WARM.b.length&&['wolf','dragon'].every(k=>poses.every(p=>t.spr['bst'+k+'1'+(B.units.find(x=>x.type===k).v%3)+'p'+t.beastPoseOf(k,p)])),'their poses are made ahead with the rest of the battle’s sprites');
  B.over=true;B.endT=0;t.B=null;G.mode='world'}
 // ---- your side: a collar or a band in the side's blue; a wild one wears none of it
 {const blue=c=>{const d=data(c);let n=0;for(let i=0;i<d.length;i+=4)if(d[i+3]&&((d[i]===0x39&&d[i+1]===0x8d&&d[i+2]===0xd5)||(d[i]===0x30&&d[i+1]===0x56&&d[i+2]===0xac)))n++;return n};
  ok(kinds.every(k=>blue(t.unitSprite(k,0,false,0,0))>0&&!blue(t.unitSprite(k,1,false,0,0))),'a beast on your side wears the side’s blue (a collar, a band, a harness); a wild one none')}
 // ---- the world map
 {const ids=Object.keys(t.MONSTERS),bad=ids.filter(id=>{const s=t.monsterMapSprite(id,0);return !(s.width===s.height&&[8,16,32,64].includes(s.width)&&s.ch>0)});
  ok(!bad.length,'every monster on the map has its figure in a power-of-two cell'+(bad.length?': not '+bad.join(', '):''));
  const dm=t.monsterMapSprite('dragon',0);ok(dm.width===32&&dm!==t.monsterMapSprite('dragon',1)&&dm!==t.unitSprite('dragon',1,false,0,0)&&t.monsterMapSprite('wolf',1)!==t.unitSprite('wolf',1,false,0,3)&&t.monsterMapSprite('wolf',0).width===16,'the dragon on the map is the dragon, smaller, on the wing (wings up, then level); the rest their own small map figures (Phase 1: mapfigures.js)');
  const P0={x:P.x,y:P.y};{const W=t.W,tw=t.TOWNS[0];P.x=tw.x;P.y=tw.y+40;W.monsters=[t.asMonster({id:'bear',x:P.x+30,y:P.y,hx:P.x,hy:P.y,lv:1,n:1,t:0,a:0,cool:0})];
   const ctx=t.ctx,orig=ctx.drawImage,drawn=new Set();ctx.drawImage=function(img,...a){drawn.add(img);return orig.call(ctx,img,...a)};
   try{G.mode='world';G.modal=false;t.drawWorld()}finally{ctx.drawImage=orig}
   ok([0,1].some(f=>drawn.has(t.monsterMapSprite('bear',f))),'a beast on the map is drawn in its map figure')}Object.assign(P,P0)}
 // ---- cost: the cache, the making, a 200-strong monster battle's drawing
 {const a=performance.now();let made=0;for(const k of kinds)for(const team of [0,1])for(const v of [0,1,2])for(const p of poses){PX.beast(k,{v,pose:p,team});made++}
  const ms=performance.now()-a,all=Object.keys(t.spr).filter(k=>k.startsWith('bst')).length;
  o.push('INFO beast sprites: '+made+' figures in all ('+kinds.length+' kinds x 2 sides x 3 variants x '+poses.length+' poses), drawn from scratch in '+ms.toFixed(0)+' ms ('+(ms/made).toFixed(2)+' ms each); cached once each: '+all+' in the cache now');
  (0,eval)('B=null');G.mode='world';G.modal=false;t.hidePanel();const L=t.BattleLab;L.start({leftGroups:[{type:'hum_spear',count:50},{type:'hum_bow',count:30},{type:'hum_knight',count:20}],rightGroups:[{type:'wolf',count:30},{type:'boar',count:20},{type:'spider',count:20},{type:'scorpion',count:12},{type:'bear',count:6},{type:'tiger',count:4},{type:'slime',count:4},{type:'troll',count:2},{type:'griffin',count:1},{type:'dragon',count:1}],deploy:false,paused:true,ai:true,seed:5,distance:160});
  try{const B=t.B;B.paused=false;for(let i=0;i<150;i++)t.updateBattle(1/60);B.paused=true;t.warmBattle(B.units);let q=0;while((t.WARM.q.length||t.WARM.b.length)&&q++<5000)t.warmStep();
   const nb=B.units.filter(u=>u.hp>0&&t.ST[u.type].beast).length,N=40;t.drawBattle();const a2=performance.now();for(let i=0;i<N;i++){B.t+=1/60;t.drawBattle()}const per=(performance.now()-a2)/N;
   const b2=performance.now();for(let i=0;i<N;i++)for(const u of B.units)if(u.hp>0&&t.ST[u.type].beast){u.plx=u.x-1;t.beastSprite(u.type,u.team,u.v,t.beastPose(u,true))}const look=(performance.now()-b2)/N;
   o.push('INFO a 200-strong monster battle ('+B.units.length+' on the field, '+nb+' beasts alive): drawBattle '+per.toFixed(2)+' ms a frame; a frame’s beast poses looked up in '+look.toFixed(3)+' ms; cache '+Object.keys(t.spr).filter(k=>k.startsWith('bst')).length+' beast sprites');
   ok(per<60,'a 200-strong monster battle draws in '+per.toFixed(1)+' ms a frame')}finally{if(L.active)L.exit()}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
