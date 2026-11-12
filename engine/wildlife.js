'use strict';
/* ---------- PX engine: wildlife and livestock in the battle's style (the owner, 2026-11-12: "make wildlife sprite a battle sprite
   too") ----------
   Each animal hunted or kept (the game's CRITTERS) as a beast of the battle: side-on facing right, shaded in its coat's four-tone
   ramp and outlined as the beasts are (engine/beasts.js quad, its deaths quadDead), at its real size beside a man (some 16 px
   tall): a deer's shoulder 9 px, a cow's 9, a sheep's 6, a pig's 5, a rabbit's 3. Three coats a kind (v). The birds (a hen, a marsh
   fowl) drawn here on two legs. Kinds 'w_' + the animal's id: PX.beast('w_deer', {v, pose, team}); PX.WILD_KINDS lists them. */
(function(PX){
  const K=PX._beastKit,{put,mask,shade,flat,R,quad,quadDead,KINDS}=K;
  // (an antler: a beam from (x, y) up and back, a tine forward at each of tines' rows; c its two tones)
  const antler=(g,x,y,up,tines,c,back=1)=>{for(let k=0;k<up;k++){const ax=x-Math.round(k*back*.5);put(g,ax,y-k,c[k%2?1:0]);if(tines.includes(k))put(g,ax+1,y-k-1,c[0])}};
  // (a horn curving back: from (x, y) its points in order)
  const horn=(g,x,y,pts,c)=>pts.forEach(([dx,dy],k)=>put(g,x+dx,y+dy,c[Math.min(c.length-1,k>>1)]));
  // a hoofed beast: its shape (S, the beasts' quad's: hip and shoulder x, the back's heights, the belly's, the body's radii, legs, head)
  // made from its coat C and variant v by shape(C, v); its ground the canvas's
  const hoofed=(W,H,coats,shape,dx)=>({W,H,coats,dx,draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),S={...shape(C,v),Y:g.h-2};return F.dead?quadDead(g,S,o,F.how):quad(g,S,F,o)}});
  const DK=R('#2e2620'),HOOF=R('#3a302a'),PALE=R('#ece4d2'),HORN=['#e8e0cc','#c8bca0','#9a8e74'],DARKHORN=['#5a4e40','#3e342c','#2a2420'];
  const W={
    // a hind: slender, long-legged, a pale belly and rump, big ears
    w_deer:hoofed(25,24,['#a0683a','#8e5e36','#b07848'],C=>({hip:6,sho:13,back:[9,10],belly:6,ry:3,rh:3.2,rc:3.4,legs:[2,1,2],fore:[1,1,0],C,D:HOOF,L:PALE,lb:1,
      head:{lit:1,x:4,y:15,w:4,h:3,snout:[2,2],sy:1,M:R('#7a4e2e'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-1,y-2,C[1]);put(g,x-2,y-3,C[2]);put(g,x-2,y-2,C[1])}},
      tail:(g,x,y)=>{put(g,x,y,PALE[0]);put(g,x,y+1,PALE[1])}})),
    // a stag: taller, its antlers branching up and back
    w_stag:hoofed(26,30,['#8a5a30','#7a5030','#9a6838'],C=>({hip:6,sho:14,back:[10,11],belly:6,ry:3.2,rh:3.4,rc:3.8,legs:[2,1,2],fore:[2,1,0],C,D:HOOF,L:PALE,lb:1,
      head:{lit:1,x:4,y:16,w:4,h:3,snout:[2,2],sy:1,M:R('#6a4428'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y-2,C[2])},
        more:(g,x,y)=>{const c=['#e0d0a8','#b8a478'];antler(g,x,y-2,6,[1,3,5],c);antler(g,x+1,y-2,5,[2,4],c,.6)}},
      tail:(g,x,y)=>{put(g,x,y,PALE[0])}})),
    // a reindeer: heavier, a pale throat and belly, wide antlers with a brow tine forward
    w_reindeer:hoofed(26,27,['#7a6a5a','#8a7a66','#6a5e52'],C=>({hip:6,sho:14,back:[9,10],belly:5,ry:3.5,rh:3.6,rc:4,legs:[2,1,2],fore:[2,1,0],C,D:HOOF,L:PALE,lb:2,
      head:{lit:1,x:4,y:14,w:4,h:3,snout:[2,2],sy:1,M:R('#5a4e44'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y-2,C[2])},
        more:(g,x,y)=>{const c=['#e8dcc0','#c0b090'];antler(g,x-1,y-2,6,[0,2,4],c,1.2);put(g,x+1,y-1,c[0]);put(g,x+2,y-2,c[1]);antler(g,x+1,y-2,5,[1,3],c,.8)}},
      mane:(g,F,P,hx,hy)=>{for(let k=1;k<4;k++)put(g,hx-1-k,hy+1+k,PALE[k%2])},tail:(g,x,y)=>{put(g,x,y,PALE[1])}})),
    // a gazelle: small and fine, sandy, a dark stripe along its flank over a white belly, its horns straight and ringed
    w_gazelle:hoofed(23,23,['#d0a060','#c89858','#d8ac70'],C=>({hip:6,sho:12,back:[8,8],belly:5,ry:2.6,rh:2.8,rc:2.8,legs:[1,1,2],fore:[1,1,0],C,D:HOOF,L:R('#f4ecdc'),lb:1,
      head:{lit:1,x:3,y:12,w:3,h:3,snout:[2,2],sy:1,M:R('#b88850'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-1,y-2,C[2])},
        more:(g,x,y)=>{horn(g,x,y-2,[[0,0],[-1,-1],[-1,-2],[-2,-3]],DARKHORN)}},
      marks:(g,body,F,o,P)=>{for(let x=P.hip-1;x<=P.sho+1;x++)if(body.has(x,P.bel-2))put(g,x,P.bel-2,R('#6a4a2e')[1])},
      tail:(g,x,y)=>{put(g,x,y,DK[1])}})),
    // a mountain goat: stocky, its horns sweeping back in an arc, a beard
    w_ibex:hoofed(23,20,['#d8d0c0','#c8bca8','#a89a84'],C=>({hip:6,sho:12,back:[8,9],belly:4,ry:3,rh:3.4,rc:3.6,legs:[2,1,1],fore:[2,1,0],C,D:HOOF,
      head:{x:3,y:11,w:3,h:3,snout:[2,2],sy:1,eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y-1,C[2])},
        more:(g,x,y,F,sx,sy)=>{horn(g,x,y-2,[[0,0],[-1,-1],[-2,-1],[-3,0],[-4,1]],['#8a7a5e','#6a5c46','#4e4436']);put(g,sx,sy+2,C[2]);put(g,sx,sy+3,C[3])}},
      tail:(g,x,y)=>{put(g,x,y,C[1])}})),
    // a goat: as the mountain goat, smaller, short horns
    w_goat:hoofed(22,19,['#a89880','#e4dccc','#4e4642'],C=>({hip:5,sho:11,back:[7,8],belly:4,ry:2.8,rh:3,rc:3.2,legs:[2,1,1],fore:[2,1,0],C,D:HOOF,
      head:{x:3,y:10,w:3,h:3,snout:[2,2],sy:1,eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y,C[2])},
        more:(g,x,y,F,sx,sy)=>{horn(g,x,y-2,[[0,0],[-1,-1],[-2,-1]],DARKHORN);put(g,sx,sy+2,C[2])}},
      tail:(g,x,y)=>{put(g,x,y-1,C[1])}})),
    // a sheep: a round woolly body, its face and legs dark
    w_sheep:hoofed(23,15,['#eeeae0','#e2dccc','#d8d0bc'],C=>({hip:6,sho:12,back:[7,8],belly:3,ry:3.6,rh:4,rc:4,legs:[1,1,0],fore:[1,1,0],C,D:HOOF,legC:R('#3e3632'),foreC:R('#3e3632'),
      head:{x:3,y:7,w:3,h:3,snout:[2,2],sy:1,C:R('#3e3632'),eye:'#d8c890',ear:(g,x,y)=>{put(g,x-2,y,R('#3e3632')[2])}},
      marks:(g,body)=>{for(const [x,y] of body.pts())if((x*7+y*3)%5===0&&body.has(x,y-1)&&body.has(x+1,y))put(g,x,y,C[0])},
      tail:(g,x,y)=>{put(g,x,y,C[1]);put(g,x,y+1,C[2])}})),
    // a cow: long and heavy on short legs, a pink muzzle, small horns, a tail to its hocks with a dark tuft; pied, brown or red
    w_cow:hoofed(29,19,['#e8e4d0','#8a5a3a','#a8583a'],(C,v)=>({hip:7,sho:17,back:[10,10],belly:5,ry:4,rh:4.6,rc:5,legs:[2,2,1],fore:[2,2,0],C,D:HOOF,
      head:{x:3,y:9,w:4,h:4,snout:[2,3],sy:1,M:R('#d8a8a0'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y-1,C[2])},more:(g,x,y)=>{put(g,x,y-2,HORN[0]);put(g,x-1,y-3,HORN[1])}},
      marks:v?null:(g,body,F,o,P)=>{for(const [x,y] of body.pts())if(Math.sin(x*1.3)+Math.cos(y*1.7+x*.4)>1.1)put(g,x,y,R('#3a2a20')[body.has(x,y-1)?1:0])},
      tail:(g,x,y)=>{const m=mask();m.limb(x+1,y,x-1,y+6,1,1);flat(g,m,C,2,3);put(g,x-1,y+7,DK[1]);put(g,x-2,y+7,DK[2])}})),
    // a water buffalo: dark and heavy, its great horns swept out and back
    w_buffalo:hoofed(29,19,['#55525a','#4a4648','#625c5e'],C=>({hip:7,sho:17,back:[10,10],belly:5,ry:4,rh:4.6,rc:5,legs:[2,2,1],fore:[2,2,0],C,D:R('#262224'),
      head:{x:3,y:9,w:4,h:4,snout:[2,3],sy:1,M:R('#3e3a3c'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y,C[2])},
        more:(g,x,y)=>{horn(g,x,y-2,[[0,0],[-1,-1],[-2,-1],[-3,-1],[-4,0],[-4,1]],HORN)}},
      tail:(g,x,y)=>{const m=mask();m.limb(x+1,y,x-1,y+6,1,1);flat(g,m,C,2,3);put(g,x-1,y+7,DK[2])}})),
    // a pig: low and round, pink, a flat snout, ears flopped forward, a curled tail
    w_pig:hoofed(23,14,['#e0a0a0','#d8b0a0','#8a6a5e'],C=>({hip:6,sho:12,back:[6,6],belly:3,ry:3,rh:3.4,rc:3.4,legs:[2,2,0],fore:[2,2,0],C,D:R('#6a4a44'),
      head:{x:3,y:5,w:4,h:4,snout:[2,3],sy:1,M:R('#e8b8b0'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x,y-2,C[2]);put(g,x+1,y-1,C[2])}},
      tail:(g,x,y)=>{put(g,x,y,C[2]);put(g,x-1,y-1,C[2]);put(g,x,y-2,C[2])}})),
    // a camel: long legs and neck, a hump high on its back
    w_camel:hoofed(30,25,['#c8a070','#b89060','#d8b484'],C=>({hip:7,sho:15,back:[11,11],belly:8,ry:3.4,rh:3.6,rc:4,hump:[4,3.5,3],legs:[2,1,2],fore:[2,1,0],C,D:R('#6a5440'),
      head:{lit:1,x:6,y:16,w:4,h:3,snout:[3,2],sy:1,M:R('#a88050'),eye:'#1e1814',ear:(g,x,y)=>{put(g,x-2,y-2,C[2])}},
      tail:(g,x,y)=>{put(g,x,y+1,C[2]);put(g,x,y+2,C[3])}})),
    // a rabbit: small and round, long ears laid back, a white scut; a snow hare white, its ears tipped black
    w_rabbit:hoofed(16,13,['#b8a088','#9a8470','#c8b49a'],C=>({hip:3,sho:6,back:[4,3],belly:1,ry:2,rh:2.6,rc:2,legs:[1,1,0],fore:[1,1,0],C,D:R('#6a5a4a'),
      head:{x:1,y:3,w:3,h:3,snout:[1,1],sy:1,eye:'#1e1814',ear:(g,x,y)=>{for(const [dx,dy,t] of [[-1,-2,0],[-1,-3,1],[-2,-3,1],[-2,-4,2],[-3,-4,2],[-2,-2,1]])put(g,x+dx,y+dy,C[t])}},
      tail:(g,x,y)=>{put(g,x+1,y,'#f4f0e8')}}),2),
    w_hare:hoofed(17,15,['#eef3f8','#e4eaf0','#dce4ec'],C=>({hip:3,sho:7,back:[5,4],belly:1,ry:2,rh:2.8,rc:2.2,legs:[1,1,0],fore:[1,1,0],C,D:R('#8a8a90'),
      head:{x:1,y:4,w:3,h:3,snout:[1,1],sy:1,eye:'#1e1814',ear:(g,x,y)=>{for(const [dx,dy,t] of [[-1,-2,0],[-1,-3,1],[-2,-3,1],[-2,-4,1],[-3,-4,1],[-2,-2,1]])put(g,x+dx,y+dy,C[t]);put(g,x-3,y-5,'#2a2630');put(g,x-4,y-5,'#2a2630')}},
      tail:(g,x,y)=>{put(g,x+1,y,'#ffffff')}}),2)};
  /* the birds, on two legs: a round body, the head up ahead of it, a tail up behind, the legs walking under (F.legs' near pair);
     dead on its side, on its back (its feet up), or its head tucked under it */
  const bird=(W,H,coats,B)=>({W,H,coats,draw(g,F,o){const v=o.v%3,C=R(this.coats[v]),Y=g.h-2,b=F.dead?0:F.bob||0,dead=F.dead?F.how:null;
    const legs=()=>{const L=B.leg;for(const [i,dx] of [[2,0],[3,2]]){const [ox,lift]=F.legs[i]||[0,0],x0=B.x+dx-1,fx=x0+Math.round(ox/2);put(g,x0,Y-2+b,L);put(g,fx,Y-1-lift,L);put(g,fx,Y-lift,L);put(g,fx+1,Y-lift,L)}};
    if(dead){const lie=mask().ell(B.x,Y-B.ry*.7,B.rx+.5,B.ry*.75);shade(g,lie,C);
      if(dead==='back'){put(g,B.x-1,Y-B.ry*1.5,B.leg);put(g,B.x-1,Y-B.ry*1.5-1,B.leg);put(g,B.x+1,Y-B.ry*1.5,B.leg);put(g,B.x+2,Y-B.ry*1.5-1,B.leg)}
      else{put(g,B.x-B.rx,Y-B.ry,C[2]);put(g,B.x-B.rx-1,Y-B.ry-1,C[3])}
      if(dead==='slump'){B.head(g,B.x+1,Y-B.ry,C,true);return}
      B.head(g,B.x+B.rx+2,Y-1,C,true);return}
    legs();const body=mask().ell(B.x,Y-B.y+b,B.rx,B.ry);if(B.tail)B.tail(g,B.x-B.rx,Y-B.y+b,C);shade(g,body,C);if(B.marks)B.marks(g,body,C);
    const lean=F.a==='run'?1:0;B.head(g,B.x+B.hx+lean,Y-B.hy+b+(F.head?F.head[1]:0),C,false)}});
  W.w_hen=bird(16,15,['#c87a3a','#e8dcc8','#5a4a40'],{x:6,y:4,rx:3.2,ry:2.4,hx:3,hy:7,leg:'#d8a838',
    tail:(g,x,y,C)=>{put(g,x,y-2,C[2]);put(g,x-1,y-3,C[3]);put(g,x,y-3,C[2]);put(g,x+1,y-1,C[2])},
    head:(g,x,y,C,dead)=>{const h=mask().ell(x,y,1.5,1.5);shade(g,h,C);put(g,x,y-2,'#c8302a');put(g,x+1,y-2,'#e04038');put(g,x+2,y,'#e0b040');if(!dead){put(g,x+1,y-1,'#1e1814');put(g,x+1,y+2,'#c8302a')}}});
  W.w_fowl=bird(18,13,['#6a7a5a','#8a7a62','#5a6a70'],{x:6,y:3,rx:3.6,ry:2,hx:4,hy:6,leg:'#d88a30',
    tail:(g,x,y,C)=>{put(g,x,y-1,C[3]);put(g,x-1,y-2,C[3])},
    marks:(g,body,C)=>{for(const [x,y] of body.pts())if(y<=Math.min(...body.pts().map(p=>p[1]))+1&&x%2)put(g,x,y,C[0])},
    head:(g,x,y,C,dead)=>{const H=R('#2e5a3a');for(let k=1;k<=(dead?0:2);k++)put(g,x-1,y+k,C[1]);put(g,x-1,y+(dead?0:1),'#f4f0e8');const h=mask().ell(x,y,1.4,1.3);shade(g,h,H);put(g,x+2,y,'#d8b040');put(g,x+3,y+1,'#c89a30');if(!dead)put(g,x,y-1,'#1e1814')}});
  // (each a kind of the engine's, its deaths the beasts')
  for(const [k,D] of Object.entries(W)){KINDS[k]=D;D.kind=k;if(!PX.BEAST_KINDS.includes(k))PX.BEAST_KINDS.push(k);PX.BEAST_DEATHS[k]=D.deaths||['side','back','slump']}
  PX.WILD_KINDS=Object.keys(W);
})(window.PX=window.PX||{});
