'use strict';
// Not a test (run by name: -Suites visual/horses): the horses (people.js HORSE_ART; the owner, 2026-11-02: "can you fix the mounts
// sprites? i mean the horse legs", "make sure to make it look like horse"; 2026-11-03: "a second pass for leggier horses", +1 px,
// then the head: "the head when running is too small", "not too square"), side by side in each row: before (the +1 horse with
// the head the owner last saw), after (HORSE_ART.leg 1, its one head), the first pass (HORSE_ART.tall false) and the old
// (HORSE_ART.on false). At 6x the knight's and the lancer's horses in every frame (standing 0-1, walking 2-5, galloping 15-18),
// the loose and bare horses, before and after; then a knight, a light rider, a horse archer, a stag rider, loose and fallen
// horses in battle at 2x and 1x and on the map's march (marchSprite's size: WORLD_BATTLE.sprite / WORLD_BATTLE.scale) at 1x and
// 2x; then the bare horse's silhouettes in black at 6x, 2x and 1x (the photos' and the references' beside them are pasted on by
// hand: they are not in the repo). Its picture is the IMG line
Kit.suite(({o,ok})=>{const t=T;Kit.begin('soldier');window.requestAnimationFrame=()=>0;
 const A=t.HORSE_ART,spr=t.spr,LEG=A.leg,clear=()=>{for(const k in spr)delete spr[k];t.FIGURES.map.clear()};
 const POSES=[0,1,2,3,4,5,15,16,17,18],riders=['hum_knight','hum_lancer','hum_hbow'],mk=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale;
 // (a fallen horse alone: drawMountDown as corpseOf draws it; a silhouette: every px black)
 const down=L=>{const d=t.pgrid(32,22);t.drawMountDown(d,L);t.poutline(d);return t.pcanvas(d)};
 const black=s=>t.mkc(s.width,s.height,g=>{g.drawImage(s,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#000';g.fillRect(0,0,s.width,s.height)});
 // (before: the sized build as the owner last saw it, its head and neck in its body rows (2026-11-03: "the head when running is too
 // small"); after, today's: one head hung at its poll)
 const Z=A.sized,KEYS=['top','body','head','poll','headX','headY','ears'],look=Object.fromEntries(KEYS.map(k=>[k,Z[k]])),builds=()=>{for(const k in t.HORSE_BUILDS)delete t.HORSE_BUILDS[k]};
 const BEFORE={top:-2,head:null,poll:null,headX:24,headY:9,ears:{stand:[-3,-2],run:[-2,1]},body:{stand:['.......................y........','.....................mmHh.......','...................mmHHkHh......','..................mHHHHHHHh.....','.................mHHHHHddHHh....','.................mHHHHd..dHHh...','................mHHHHHd...dHHk..','.......hhhh....mHHHHHHd....dd...','......hHHHhhhhhhHHHHHHHd........','......hHHHHHHHHHHHHHHHd.........','......HHHHHHHHHHHHHHHHd.........','......dHHHddddddddHHdd..........'],
   run:['','','','........................y.......','.....................mmmHh......','..................mmmHHHkHh.....','................mmHHHHHHHHHh....','.......hhhh....mHHHHHHHHddHHh...','......hHHHhhhhhhHHHHHHHd...dHk..','......hHHHHHHHHHHHHHHHd.....dd..','......HHHHHHHHHHHHHHHHd.........','......dHHHddddddddHHdd..........']}};
 const set=(on,tall,leg,old)=>{A.on=on;A.tall=tall;A.leg=leg;Object.assign(Z,old?BEFORE:look);builds();clear();const L=t.lookOf('hum_knight',1,false,0,'',null),Ll=t.lookOf('hum_lancer',0,false,1,'',null);
   return{riders:riders.map(k=>POSES.map(p=>t.unitSprite(k,0,false,1,p))),stag:POSES.map(p=>t.unitSprite('elf_hart',0,false,1,p)),
     loose:[t.horseSprite(L),t.horseSprite(Ll),t.figHorse('chestnut',0),t.figHorse('horseB',3)],fallen:[down(L),down(Ll),down({mount:'horse',mountC:'horseG',team:'blue'})],
     bare:POSES.map(p=>t.figHorse('horse',p<2?0:p<6?p:p-11+2))}};
 // (the bare horse's frames by walk: figHorse's pose-2; its gallop (walk 4-7) by poses 6-9)
 const before=['leg +1, before',set(true,true,1,true)],V=[['first pass',set(true,false,0)],['leg +1, after',set(true,true,1)],['old',set(false,true,0)]];
 A.on=true;A.tall=true;A.leg=LEG;Object.assign(Z,look);builds();clear();
 // (a row: its label, then each version's pictures in turn, at scale K)
 const rows=[],add=(label,pick,K,vs=V)=>rows.push([label,vs.map(([n,S])=>[n,pick(S)]),K]);
 riders.slice(0,2).forEach((k,i)=>add(k+' head 6x',S=>S.riders[i],6,[before,V[1]]));add('loose, bare head 6x',S=>[...S.loose.slice(0,2),...S.bare],6,[before,V[1]]);
 for(const K of [2,1]){riders.forEach((k,i)=>add(k+' '+K+'x',S=>S.riders[i],K,[before,...V]));add('stag '+K+'x',S=>S.stag,K,[before,...V]);add('loose, fallen '+K+'x',S=>[...S.loose,...S.fallen],K,[before,...V])}
 for(const K of [1,2])riders.forEach((k,i)=>add(k+' march '+K+'x',S=>S.riders[i],mk*K,[before,...V]));
 for(const K of [6,2,1])add('silhouette '+K+'x',S=>S.bare.map(black),K,[before,V[1]]);
 const gap=24,wid=([l,G,K])=>G.reduce((a,[n,L])=>a+L.reduce((b,s)=>b+Math.ceil((s.width+4)*K),0)+gap,0),hei=([l,G,K])=>Math.ceil((Math.max(...G.flatMap(([n,L])=>L.map(s=>s.height)))+4)*K)+20;
 const cv=document.createElement('canvas');cv.width=Math.max(...rows.map(wid))+170;cv.height=rows.reduce((a,r)=>a+hei(r),0);
 const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,cv.width,cv.height);let y=0;
 for(const r of rows){const [label,G,K]=r,h=Math.max(...G.flatMap(([n,L])=>L.map(s=>s.height)));g.fillStyle='#fff';g.font='12px Arial';g.fillText(label,4,y+20+Math.min(h*K,40)/2);let x=170;
   for(const [n,L] of G){g.fillStyle='#ffe9a8';g.fillText(n,x,y+13);for(const s of L){const w=Math.round(s.width*K),hh=Math.round(s.height*K);g.drawImage(s,x,y+16+Math.round(h*K)-hh,w,hh);x+=Math.ceil((s.width+4)*K)}
     g.fillStyle='rgba(0,0,0,.25)';g.fillRect(x+gap/2-1,y,2,hei(r)-4);x+=gap}
   y+=hei(r)}
 o.push('IMG '+cv.toDataURL('image/png'));ok(true,'horse sheet drawn ('+rows.length+' rows, '+cv.width+'x'+cv.height+', the march at '+mk.toFixed(3)+'x)')});
