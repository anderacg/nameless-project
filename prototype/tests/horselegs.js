'use strict';
// The horse (people.js HORSE_ART; the owner, 2026-11-02: "can you fix the mounts sprites? i mean the horse legs", "make sure to
// make it look like horse"; 2026-11-03: "a second pass for leggier horses", a little longer only): its legs' joints by frame,
// every hoof on the ground or over it; a four-beat walk, one leg lifted at a time, in a horse's order; a gallop reaching wide and
// gathered off the ground (pose 17, the references' suspension); the hooves drawn where the table puts them; the legs
// HORSE_ART.leg px longer under the same body (+1 and +2 tried); the rider, his hands, his back and his height up with the seat
// together, a px less (sunk into the saddle); made once and kept, in the cell as before; the switches: on false the pre-horse
// horse pixel for pixel, tall false the first pass's
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');
 const A=t.HORSE_ART,spr=t.spr,clear=()=>{for(const k in spr)delete spr[k];t.FIGURES.map.clear()};
 // (a canvas's pixels as one hash: FNV-1a)
 const hash=list=>{let h=2166136261>>>0;for(const s of list){const d=s.getContext('2d',{willReadFrequently:true}).getImageData(0,0,s.width,s.height).data;h=Math.imul(h^s.width,16777619)>>>0;for(let i=0;i<d.length;i++)h=Math.imul(h^d[i],16777619)>>>0}return h.toString(16)};
 const POSES=[0,1,2,3,4,5,15,16,17,18],KINDS=['hum_knight','hum_squire','hum_lancer','hum_hbow','elf_hart','elf_lance','dw_ram','orc_wolf'];
 const down=L=>{const d=t.pgrid(32,22);t.drawMountDown(d,L);t.poutline(d);return t.pcanvas(d)};
 const looks=[t.lookOf('hum_knight',1,false,0,'',null),t.lookOf('hum_lancer',0,false,2,'',null),t.lookOf('elf_hart',0,false,1,'',null),t.lookOf('dw_ram',1,false,0,'',null),t.lookOf('orc_wolf',0,false,0,'',null)];
 const pics=()=>{clear();return[...KINDS.flatMap(k=>POSES.map(p=>t.unitSprite(k,0,false,1,p))),...looks.map(L=>t.horseSprite(L)),...looks.map(down)]};
 const LEG=A.leg,bay={mount:'horse',mountC:'horse',team:'red'},frameOf=(B,w)=>w>=4?B.gallop[w-4]:w>=0?B.walk[w]:B.idle[0];
 // ---- at each length tried: the table, each frame's hooves on the ground or over it (h px), at most one lifted in a walk
 for(const n of [1,2]){A.leg=n;const B=t.horseBuild(),frames=[...B.idle,...B.walk,...B.gallop],hooves=F=>F.legs.map((L,i)=>[B.hips[i]+L[5],L[6]]),at=' (leg +'+n+')';
  ok(frames.every(F=>F.legs.length===4&&F.legs.every(L=>L.length===7&&L[6]>=0))&&[...B.idle,...B.walk].every(F=>F.legs.every(L=>L[6]<=4))&&B.gallop.every(F=>F.legs.every(L=>L[6]<=7)),
   frames.length+' frames, four legs each, every hoof on the ground or over it (walking at most 4 px, galloping 7)'+at);
  ok(B.idle.every(F=>hooves(F).every(([x,h])=>!h)),'standing: four hooves on the ground'+at);
  {const up=B.walk.map(F=>F.legs.map((L,i)=>L[6]>0?i:-1).filter(i=>i>=0));if(n===1)info('the walk lifts: '+up.map(u=>u.join('+')||'none').join(', ')+' (0 far hind, 1 near hind, 2 far fore, 3 near fore)');
   ok(up.every(u=>u.length<=1)&&up.map(u=>u[0]).join()===[0,2,1,3].join(),'the walk: four beats, one leg lifted at a time, in a horse\'s order (left hind, left fore, right hind, right fore)'+at)}
  {const span=F=>{const x=hooves(F).map(([x])=>x);return Math.max(...x)-Math.min(...x)},[E,P,Gt,H]=B.gallop;
   info('the gallop\'s hooves span '+B.gallop.map(span).join(', ')+' px; lift '+B.gallop.map(F=>hooves(F).map(([,h])=>h).join('')).join(' ')+at);
   ok(span(E)>span(Gt)+5&&hooves(Gt).every(([,h])=>h>0)&&hooves(E).some(([,h])=>!h),'the gallop: reaching wide ('+span(E)+' px), then gathered under the body ('+span(Gt)+' px) and off the ground'+at);
   // (pose 17, the suspension as the references': the fore legs folded back under the chest, the hind reaching forward and lower)
   const [fh,nh,ff,nf]=Gt.legs;ok(ff[5]<ff[1]&&nf[5]<nf[1]&&fh[5]>fh[1]&&nh[5]>nh[1]&&Math.min(ff[6],nf[6])>Math.max(fh[6],nh[6]),'gathered: the fore cannons folded back, the hind reaching forward and lower'+at);
   ok(Gt.bob<P.bob&&Gt.bob<H.bob&&E.bob>=P.bob&&E.bob>=H.bob&&B.gallop.every(F=>F.body==='run')&&B.walk.every(F=>!F.body),'the body highest gathered, lowest reaching to land; galloping the neck stretched out'+at)}
  // ---- drawn: the hooves where the table puts them, the planted ones on the ground row, the rest over it
  {const bad=[];for(let w=-1;w<8;w++){const g=t.pgrid(32,32),F=frameOf(B,w);t.drawMount(g,bay,w);
    const hp=[];for(let i=0;i<g.p.length;i++)if(g.p[i]===A.hoof)hp.push([i%32,Math.floor(i/32)]);
    const on=hooves(F).filter(([x,h])=>t.pget(g,x,30-h)===A.hoof).length;if(on<3||hp.some(([x,y])=>y<23)||hp.length<3)bad.push(w+': '+on+' at their joints, rows '+hp.map(p=>p[1]).join(''))}
   ok(!bad.length,'every frame\'s hooves drawn at its joints, on the bottom row or at most 7 px over it'+at+(bad.length?' ('+bad.join('; ')+')':''))}
  // ---- one head in every frame (the owner: "the head when running is too small"): its pixels the same, standing, walking and
  // galloping, hung at its poll; only the neck under it changes
  // (the bare head: its tack and coat off, HORSE_TACK.on, MOUNT_COAT.on false)
  {const col=t.horseCols(t.pal('horse'),t.pal('dark')),bad=[];t.HORSE_TACK.on=false;t.MOUNT_COAT.on=false;for(let w=-1;w<8;w++){const g=t.pgrid(32,32),F=frameOf(B,w),[hx,hy]=B.poll[F.body||'stand'];t.drawMount(g,bay,w);
    B.head.forEach((r,y)=>[...r].forEach((c,x)=>{if(col[c]&&t.pget(g,hx+x,B.y0+hy+y+F.bob+(F.head||0))!==col[c])bad.push(w+': '+x+','+y)}))}t.HORSE_TACK.on=true;t.MOUNT_COAT.on=true;
   const L=B.head.length,Wd=Math.max(...B.head.map(r=>r.length)),deep=B.head.map(r=>r.replace(/\./g,'').length);
   ok(!bad.length&&Object.keys(B.poll).join()===Object.keys(B.body).join(),'one head ('+Wd+'x'+L+' px, '+Math.max(...deep)+' px across at the jowl to '+deep[L-1]+' at the muzzle) drawn the same in all 9 frames, at each shape\'s poll'+at+(bad.length?' ('+bad.slice(0,5).join('; ')+')':''))}
  // ---- the coat (2026-11-07, the owner: "add detail like furs, or shading"): every mount's main colour shaded down its body in
  // more tones than its ramp's (a sheen, a shade, a deeper foot), a wolf's in fur; MOUNT_COAT.on false: flat as before
  {const tones=(m,on)=>{t.MOUNT_COAT.on=on;const g=t.pgrid(32,32);t.drawMount(g,{mount:m,team:'blue'},-1);t.MOUNT_COAT.on=true;return new Set(g.p.filter(Boolean)).size};
   const more=['horse','stag','ram','wolf','warg'].map(m=>[m,tones(m,true)-tones(m,false)]);
   ok(more.every(([,n])=>n>=2),'each mount shaded in more tones ('+more.map(([m,n])=>m+' +'+n).join(', ')+')')}
  // ---- no lone speck (2026-11-07, the owner: "check distort pixel"): in every mount's every frame, ridden, empty or barded, no
  // pixel set alone in a field of one other colour, but an eye
  {const eyes=new Set(['#27272c','#ffdc04','#2a1e18']),bad=[];for(const m of ['horse','stag','ram','wolf','warg'])for(const brd of [0,1])for(const sd of [0,1])for(let w=-1;w<8;w++){
     const g=t.pgrid(32,32);t.drawMount(g,{mount:m,team:'blue',saddled:!!sd,barded:!!brd},w);g.edge=true;t.poutline(g);const at=(x,y)=>x>=0&&y>=0&&x<32&&y<32?g.p[y*32+x]:null;
     for(let y=0;y<32;y++)for(let x=0;x<32;x++){const c=at(x,y),n=[at(x-1,y),at(x+1,y),at(x,y-1),at(x,y+1)];if(c&&!eyes.has(c)&&n.every(q=>q&&q===n[0]&&q!==c))bad.push(m+' '+w+': '+x+','+y)}}
   ok(!bad.length,'no lone speck on any mount, but its eye'+(bad.length?' ('+bad.slice(0,5).join('; ')+')':''))}
  // ---- the detail (2026-11-07, the owner: "make sure mount have more details"): a steel bit, a studded breast strap, a cloth of
  // the side's colour under the saddle he sits in; none of it with HORSE_TACK.on false; a stag's rack joined to its head
  {const T=t.HORSE_TACK,draw=(L,w)=>{const g=t.pgrid(32,32);t.drawMount(g,L,w);return g},cl=t.pal(bay.team)[1],on=draw(bay,4);T.on=false;const off=draw(bay,4);T.on=true;
   const st=draw({mount:'stag',team:'red'},-1),at=(x,y)=>x>=0&&y>=0&&x<st.w&&y<st.h&&st.p[y*st.w+x],i0=st.p.findIndex(c=>c),seen=new Set([i0]),q=[i0];
   while(q.length){const i=q.pop(),x=i%st.w,y=(i-x)/st.w;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(at(x+dx,y+dy)&&!seen.has((y+dy)*st.w+x+dx)){seen.add((y+dy)*st.w+x+dx);q.push((y+dy)*st.w+x+dx)}}
   const loose=st.p.filter(c=>c).length-seen.size;
   ok(on.p.includes(T.steel)&&on.p.includes(t.PPAL.gold[1])&&on.p.includes(cl)&&!off.p.includes(T.steel)&&!off.p.includes(cl)&&!loose,'a ridden horse its bit, breast strap and its side\'s cloth under the saddle, none with HORSE_TACK.on false; a stag in one piece, its antlers joined to its head ('+loose+' loose)')}
  // ---- the legs n px longer under the same body; the rider up n px on it (no longer sunk a px into the saddle), his hands, back and
  // height with him
  {const legs=tall=>{A.tall=tall;const g=t.pgrid(32,32);t.drawMount(g,bay,-1);A.tall=true;const col=[];for(let y=0;y<32;y++)if(t.pget(g,14,y))col.push(y);const top=col[0],belly=col[col.length-1];return{deep:belly-top+1,leg:30-belly}};
   const s=legs(true),o=legs(false);info('standing: the body '+o.deep+' px deep on '+o.leg+' px of leg (the first pass), now '+s.deep+' on '+s.leg+at);
   // (2026-11-07, the owner: "the mount portions still weird": the body two rows deeper, as deep as its legs are long)
   ok(s.leg===o.leg+n-2&&s.deep===o.deep+2,'the legs '+s.leg+' px under a body 2 px deeper ('+s.deep+' px deep; the first pass\'s '+o.deep+' on legs '+o.leg+')'+at)}
  {const seat=w=>t.drawMount(t.pgrid(32,32),bay,w,3,5),W=[-1,0,1,2,3,4,5,6,7];A.tall=false;const old=W.map(seat);A.tall=true;const nw=W.map(seat);
   info('the seat by frame, the first pass '+old.join(' ')+', now '+nw.join(' ')+at);ok(nw.every((y,i)=>y===old[i]-n),'the rider '+n+' px higher in every frame (on the saddle, no longer sunk into it: the owner, 2026-11-04), a frame behind the horse as before'+at)}
  {const riders=tall=>{A.tall=tall;clear();const r=KINDS.slice(0,6).flatMap(k=>POSES.map(p=>t.unitSprite(k,0,false,1,p)));A.tall=true;return r},o=riders(false),s=riders(true),bad=[],d=n;
   s.forEach((c,i)=>{const p=o[i];for(const k of ['hand','back','free'])if(p[k]&&(!c[k]||c[k][0]!==p[k][0]||c[k][1]!==p[k][1]-d))bad.push(k+' '+i);if(c.ch!==p.ch+d||c.width!==p.width)bad.push('fh '+i+': '+p.ch+'>'+c.ch)});
   info('a rider\'s height (fh) standing '+o[0].ch+' to '+s[0].ch+', at most '+Math.max(...o.map(c=>c.ch))+' to '+Math.max(...s.map(c=>c.ch))+at);
   ok(!bad.length,'his hand (lance, sword, bow), back (the flags) and free hand '+d+' px up with the seat, his height (bars, labels) '+d+' px more, in the same cell'+at+(bad.length?' ('+bad.slice(0,6).join('; ')+')':''))}
  // ---- the barding over its body only; the fallen horse in its cell
  {const g=t.pgrid(32,32),L=t.lookOf('hum_knight',1,false,0,'',null),Tm=t.pal(L.team),y0=B.y0+6;t.drawMount(g,L,-1);const out=[];
   for(let i=0;i<g.p.length;i++){const x=i%32,y=Math.floor(i/32);if(Tm.includes(g.p[i])&&(y<y0||y>y0+5||x<6||x>22))out.push(x+','+y)}
   ok(!out.length&&g.p.filter(c=>Tm.includes(c)).length>30,'a knight\'s horse wears its side\'s cloth over its body down to its belly, nowhere else'+at+(out.length?' ('+out.slice(0,6).join(' ')+')':''))}
  {const d=t.pgrid(32,22);t.drawMountDown(d,looks[1]);let low=0;for(let i=0;i<d.p.length;i++)if(d.p[i])low=Math.max(low,Math.floor(i/32));ok(low<=20&&d.p.includes(A.hoof),'fallen: its legs out toward you, inside its 32x22 cell (to row '+low+')'+at)}}
 A.leg=LEG;
 // ---- a ram and a wolf as they were; kept, made once
 {const keep=()=>hash(looks.slice(3).map(L=>t.horseSprite(L)).concat(looks.slice(3).map(down),['dw_ram','orc_wolf'].flatMap(k=>POSES.map(p=>t.unitSprite(k,0,false,1,p)))));
  clear();const on=keep();A.on=false;clear();const off=keep();A.on=true;clear();ok(on===off,'a ram and a wolf as they were ('+on+')')}
 {const L=t.lookOf('hum_lancer',0,false,2,'',null),cells=()=>{clear();return[...KINDS.flatMap(k=>POSES.map(p=>t.unitSprite(k,0,false,1,p).width)),t.horseSprite(L).width].join()};
  A.on=false;const off=cells();A.on=true;const on=cells(),a=t.unitSprite('hum_knight',0,false,1,16),h=t.horseSprite(L);
  ok(a===t.unitSprite('hum_knight',0,false,1,16)&&h===t.horseSprite(L)&&t.figHorse('chestnut',3)===t.figHorse('chestnut',3)&&on===off&&t.horseBuild()===t.horseBuild(),'each made once and kept by its look and pose, in its cell as before (a rider '+a.width+', a horse '+h.width+'), the build once a length')}
 // ---- the switches: on false, the pre-horse pixels exactly; tall false, the first pass's (both recorded before the change); each
 // length its own
 // (FIRST re-recorded 2026-11-04, on purpose: the owner, "make sure the leg when walking or running is correct and fix the extra
 // dots in the outer line": every horse's legs drawn edge to edge, the near one 2 px, the far one 1 px a pixel apart (people.js
 // horseLeg), and its tail joined edge to edge, both builds; was 5bf21915)
 // (OLD and FIRST re-recorded again 2026-11-04, on purpose: the owner, the rider "a bit low", "show more of him": every rider's
 // seated leg drawn over the cloth, his thigh, knee, shin and foot outlined (people.js RIDER_LEG), whatever the horse; was
 // fd8736e5 and d5440a64; then the leg shorter and slanted, the owner: "too long and too square", was 765cc6c3 and c2d7d437; then
 // the leg by what he wears, "chain mail or different boots" (people.js riderLegCol), was 5ee78211 and 7ada482b)
 // (both re-recorded 2026-11-06, on purpose: riders paper dolls on their mounts, and every mount with no outline, its edge a shade
 // darker (dollfigs.js DOLL_FIGS.riders, edge). Proof: riders and edge off gives both again. Were e109237f, 325b1149)
 // (both re-recorded 2026-11-07, on purpose: the owner, "fix wolf mount and dwarf mount": the wolf, the warg and the ram drawn by
 // hand (engine/beasts.js PX.mountArt), whatever the horse. Proof: PX.mountArt returning null gives both again. Were 7a98ba5d,
 // 6018605c)
 // (and again 2026-11-07: the owner, "fix any weird transparent pixel": a pinhole of up to 3 px shut in by the figure filled
 // (people.js pfillHoles). Proof: pfillHoles doing nothing gives both again. Were 3ee76635, 17984ae4)
 // (FIRST again 2026-11-07: the owner, "horse and stag mount some legs seem like a stick and too thin": the near leg 3 px over the
 // forearm and 2 below, the far one 2 to the fetlock (people.js horseLeg). Proof: the commit before gives it again. Was 854406d)
 // (both again 2026-11-07: the owner, "recheck any weird distorted pixels": a pinhole takes the colour most of its neighbours share,
 // never an eye copied, and a loose piece of a figure is joined to it (people.js pfillHoles, pjoin). Proof: 8aaa2d8 gives both again.
 // Were 51d8201e, 1c22f79b)
 // (both again 2026-11-07: the owner, "the outline should blend with the sprite, a darker shade of it": round every rider and mount
 // a blended outline, a deep shade of what it borders (people.js prim, DOLL_FIGS.rim). Proof: DOLL_FIGS.rim and PX.BEAST_RIM false
 // give both again. Were 11aacf6e, 8c06f885)
 // (both again 2026-11-07: the owner, "bigger shields with the army's device, distinct helmets": a rider's shield before his off arm
 // with his people's device, a knight's helm crested, a horned helm's horns (figures.js ShieldGear, dollfigs.js DOLL_HELM). Proof:
 // 0f9504c gives both again. Were 8cfc6411, 5eb97e7c)
 // (both again 2026-11-07: the owner, "make sure the outline doesn't look too square": a lance's thin shaft unringed, corners left
 // open, the lit side's outline lighter (people.js prim, DOLL_FIGS.rimLit). Proof: 5ff3c16 gives both again. Were ed920d7, d3fa43ba)
 // (both again 2026-11-07: the owner, "a bit too big", "floating", "the sprite should look correct": the outline inside the figure,
 // no bigger than drawn; every figure's feet on the row it stands on; a doll's sword walking as at rest, a great weapon upright,
 // none through the ground (people.js prim, dollfigs.js DOLL_FIGS.dy 0, weapons.js HOLD_DOLL, downClamp). Proof: 9243c05 gives both
 // again. Were 74d82a6a, bc05bb84)
 // (both again 2026-11-07: the owner, "the sword looks bending": a thin weapon drawn along the nearest of the slopes a line steps
 // evenly on, so a rider's lance and sword are straight at any angle (weapons.js cleanDeg). Proof: 6fd183f gives both again. Were
 // dbfcc2e8, 48977866)
 // (both again 2026-11-07: the owner, "make sure mount have more details": every horse's mane in strands, its quarters and
 // shoulder shaded, its bridle, reins and breast strap, a cloth and a girth under every saddle; the stag's rack; the ram's fleece in
 // curls, the wolf's dark saddle and pale chest (people.js horseDetail, HORSE_TACK, PPAL.fleece; engine/beasts.js MOUNT_ART).
 // Proof: 9b6a5bc gives both again. Were 46e9bc72, e36d264)
 // (both again 2026-11-07: the owner, "the mount portions still weird, check distort pixel": the body two rows deeper, a barded
 // horse's caparison to its belly, no reins or blotches, the stag's lyre of antlers, the ram's curls in arcs. Proof: f20888e gives
 // both again. Were 64d8cf30, 6c25b61d)
 // (both again 2026-11-07: the owner, "add detail like furs, or shading to mounts": every mount's coat shaded down its body, a
 // wolf's, a warg's and a ram's in fur (people.js mountCoat, MOUNT_COAT). Proof: 4f6f01f gives both again. Were c75e1892, 8a943596)
 // (both again 2026-11-07: the owner, "hero sprite looks weird", "too blocky and no need the crown": your hero riding in what he
 // wears (a mail coat mail, a jerkin over linen sleeves, his cape behind him only, no crown), an item's colour shaded (people.js
 // lookOf, dollfigs.js dollParts, engine/doll.js cloak). Proof: abf740f gives both again. Were fcd3587c, 2ab7d0ce)
 // (both again 2026-11-07: the owner, "blue cape is a square": a cape a mantle over the shoulders and a pixel of cloth hanging
 // behind the back arm to a hem, never a block (engine/doll.js cloak). Proof: 80b4972 gives both again. Were f92a987c, 7f8045c2)
 // (re-recorded 2026-11-07, on purpose: the owner, "some world map sprites still has black outer line instead of darker shading colour":
 // a picture ringed in PX.outline a shade of what it borders, never ink (engine/pixel.js), a dark body's a lighter shade (PX.RIM.dark).
 // Proof: c58c542 gives 57925876 and 85a9c6b8 again. Were 57925876, 85a9c6b8)
 // (re-recorded 2026-11-07, on purpose: the owner, "no need darker shader if that area is only 1 px": a rider's edge only where he is
 // 3 px or more across (people.js prim), his legs and arms keep their colours. Proof: 8d1c9bf gives e97e9b72 and 1f30aa again.
 // Were e97e9b72, 1f30aa)
 const OLD='e3391a73',FIRST='14c05120';
 {A.on=false;const off=hash(pics());A.on=true;A.tall=false;const first=hash(pics());A.tall=true;const by=[0,1,2].map(n=>{A.leg=n;return hash(pics())});A.leg=LEG;
  info('pictures off '+off+', the first pass '+first+', leg +0 +1 +2 '+by.join(' ')+' (HORSE_ART.leg '+LEG+')');
  ok(off===OLD,'HORSE_ART.on false: the pre-horse horses, pixel for pixel ('+off+', recorded '+OLD+')');
  ok(first===FIRST,'HORSE_ART.tall false: the first pass\'s horses, pixel for pixel ('+first+', recorded '+FIRST+')');
  ok(new Set([off,first,...by]).size===5,'HORSE_ART.leg: each length its own horse (+0: the first pass\'s, its gathered frame mended)')}
 clear() // ---- no loose pixels (the owner, 2026-11-04: "fix the extra dots in the outer line"): in every frame, every pixel of its legs
 // touches another by an edge, never only by a corner
 {const L={mount:'horse',mountC:'horse',team:'blue'},bad=[];for(const w of [-1,0,1,2,3,4,5,6,7]){const g=t.pgrid(34,32);t.drawMount(g,L,w);const at=(x,y)=>x>=0&&y>=0&&x<g.w&&y<g.h&&g.p[y*g.w+x];
   for(let y=Math.floor(g.h*.55);y<g.h;y++)for(let x=0;x<g.w;x++)if(at(x,y)&&!(at(x-1,y)||at(x+1,y)||at(x,y-1)||at(x,y+1)))bad.push(w+':'+x+','+y)}
  ok(!bad.length,'every frame\'s legs whole: no pixel on its own'+(bad.length?' ('+bad.slice(0,6).join(' ')+')':''))}
 // ---- the rider's leg by what he wears (the owner, 2026-11-04: "can the legs differ, like chain mail or different boots"): plate,
 // mail and leather each their own; your greaves and boots their own metal's
 {const col=(L,k,x,y)=>t.riderLegCol(L,k,x,y),pl=col({armor:'plate'},'L',12,7),ml=[col({armor:'mail'},'L',12,7),col({armor:'mail'},'L',13,7)],le=col({armor:'leather'},'L',12,7);
  ok(pl!==le&&!ml.includes(le)&&ml[0]!==ml[1]&&col({armor:'plate'},'F',13,9)!==col({armor:'leather'},'F',13,9),'plate greaves and sabatons, chain mail in two shades, leather leggings and boots: each its own');
  const keep={...t.P.gear},gr=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='legs'&&t.ITEMS[k].col),bt=Object.keys(t.ITEMS).find(k=>t.ITEMS[k].slot==='feet'&&t.ITEMS[k].col);
  try{t.P.gear.legs=gr;t.P.gear.feet=bt;const H=t.lookOf('hum_knight',0,true,0);ok(H.legsC===t.ITEMS[gr].col&&H.feetC===t.ITEMS[bt].col&&col(H,'L',12,7)===t.pal(t.ITEMS[gr].col)[1],'your greaves and boots on your seated leg, in their metal\'s colours ('+t.ITEMS[gr].n+', '+t.ITEMS[bt].n+')')}finally{Object.assign(t.P.gear,keep)}}
});
