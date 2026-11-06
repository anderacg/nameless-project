'use strict';
// Paper dolls (engine/doll.js; the owner, 2026-11-06: "a base body skeleton, then gear or each component added to the body by
// parts: hairstyle, equipment, clothes, different uniforms"): every race's base body, every uniform on every race in every pose
// drawn whole, each part in its slot's place, the side's colour on a uniform, hair under a hood, the weapon from the hand, the
// shield on the other arm, no outline, a shadow underfoot.
Kit.suite(({ok,info})=>{
 const PX=T.PX,DL=PX.DOLL,{W,H}=DL.D,px=cv=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data,hex=(d,i)=>'#'+[d[i],d[i+1],d[i+2]].map(v=>v.toString(16).padStart(2,'0')).join('');
 const at2=(cv,x,y)=>{const d=cv.getContext('2d').getImageData(x,y,1,1).data;return d[3]?hex(d,0):null};
 const at=(cv,x,y)=>{const d=px(cv),i=(y*W+x)*4;return d[i+3]?hex(d,i):null},count=cv=>{const d=px(cv);let n=0;for(let i=3;i<d.length;i+=4)if(d[i])n++;return n};
 // ---- the base bodies
 const races=Object.keys(DL.RACES),bodies=races.map(r=>PX.doll({race:r,style:'bald',beard:false}));
 ok(bodies.every(b=>b.width===W&&b.height===H&&count(b)>80),'a base body for every race ('+races.join(', ')+'), '+W+' × '+H+': '+bodies.map(count).join(', ')+' pixels');
 const hb=b=>{const d=px(b);let y0=H,y1=-1,x0=W,x1=-1;for(let i=3;i<d.length;i+=4)if(d[i]){const x=(i>>2)%W,y=(i>>2)/W|0;y0=Math.min(y0,y);y1=Math.max(y1,y);x0=Math.min(x0,x);x1=Math.max(x1,x)}return[x1-x0+1,y1-y0+1]};
 const [mw,mh]=hb(bodies[0]),[dw,dh]=hb(bodies[races.indexOf('dwarf')]),[ow]=hb(bodies[races.indexOf('orc')]);
 ok(dh<mh&&dw>mw&&ow>mw,'a dwarf shorter and broader ('+dw+' × '+dh+'), an orc broader ('+ow+') than a man ('+mw+' × '+mh+')');
 // ---- every uniform on every race in every pose, whole and inside its cell
 const bad=[];let n=0;for(const race of races)for(const u of Object.keys(DL.UNIFORMS))for(const [pose,L] of Object.entries(DL.POSES))for(let f=0;f<L.length;f++){n++;
   try{const cv=PX.doll({race,uniform:u,pose,frame:f,team:'red'});if(count(cv)<70)bad.push(race+' '+u+' '+pose+f+' '+count(cv))}catch(e){bad.push(race+' '+u+' '+pose+f+': '+e.message)}}
 ok(!bad.length,n+' figures (every uniform, race, pose and frame) drawn whole'+(bad.length?': '+bad.slice(0,5).join('; '):''));
 // ---- parts by slot: the side's colour on the uniform, hair hidden under a hood, a part changes only its own regions
 const b0=PX.doll({uniform:'spearman',team:'blue'}),r0=PX.doll({uniform:'spearman',team:'red'}),c=DL.D.OX+4,y=b0.anchors.head[1]+6;
 ok(at(b0,c,y)!==at(r0,c,y)&&DL.MAT.red.includes(at(r0,c,y)),'a uniform in its side’s colour: the tabard red for red ('+at(r0,c,y)+'), blue for blue ('+at(b0,c,y)+')');
 const hood=PX.doll({uniform:[['hood','green']],hair:'blond'}),[hx,hy]=hood.anchors.head;ok(!DL.MAT.blond.includes(at(hood,hx+1,hy)),'the hair under a hood');
 const plain=PX.doll({uniform:[['shirt','linen']]}),belted=PX.doll({uniform:[['shirt','linen'],['belt','leather']]}),pd=px(plain),bd=px(belted);let diff=0,off=0;
 for(let i=0;i<pd.length;i+=4)if(pd[i]!==bd[i]||pd[i+1]!==bd[i+1]||pd[i+2]!==bd[i+2]){diff++;const yy=(i/4/W)|0;if(Math.abs(yy-(plain.anchors.hand[1]-1))>1)off++}
 ok(diff>0&&!off,'a part changes only its own place: a belt, '+diff+' pixels, all at the hips');
 // ---- equipment from the anchors: the weapon from the hand, the shield on the other arm
 const sp=PX.doll({uniform:'spearman'}),noW=PX.doll({uniform:'spearman',weapon:null});ok(count(sp)>count(noW),'a weapon drawn from the hand: the spear '+(count(sp)-count(noW))+' pixels');
 const sh=PX.doll({uniform:'swordsman'}),[ox,oy]=sh.anchors.off;ok(DL.MAT.iron.includes(at(sh,ox-1,oy-2)),'the shield on his other arm, in its iron rim');
 // ---- gear drawn apart: the body bare has none of it, each piece its own picture with its grip, laid on at its anchor
 {const full=PX.doll({uniform:'swordsman',team:'red'}),bare=PX.doll({uniform:'swordsman',team:'red',bare:true}),g=full.gear,sw=PX.dollGear('sword'),shd=PX.dollGear('shield','red');
  ok(g.length===2&&g.some(q=>q.slot==='weapon'&&q.kind==='sword'&&q.anchor==='hand')&&g.some(q=>q.slot==='shield'&&q.anchor==='off')&&count(bare)<count(full)-8,'his gear apart from his body: a sword from his hand, a shield on his arm; bare, the body alone ('+count(bare)+' of '+count(full)+' pixels)');
  ok(sw&&sw.ax!=null&&shd&&shd.width===4&&DL.MAT.red.includes(at2(shd,1,2)),'each piece its own picture, its grip marked (sword '+sw.width+' × '+sw.height+', shield '+shd.width+' × '+shd.height+')')}
 // ---- the style: no outline, a shadow underfoot
 const outl=[];for(const b of [b0,sp,sh,hood])for(let i=0,d=px(b);i<d.length;i+=4)if(d[i+3]&&hex(d,i)==='#1a1c26')outl.push(i);
 const [fx,fy]=sp.anchors.feet;ok(!outl.length&&at(sp,fx,fy)==='#000037','no outline (its edges its own darkest tones), a shadow underfoot');
 // ---- poses: the walk's frames differ
 const w=[0,1,2,3].map(f=>px(PX.doll({uniform:'militia',pose:'walk',frame:f})).join());ok(w[0]!==w[1]&&w[1]!==w[3],'a walk of four frames, its steps differing');
 // ---- the grayscale base (the owner, 2026-11-06: "base sprites grayscale, so we can dynamically change colours"): one base for every
 // side, its pixels channels and tones, painted from any palette; the game's two sides one base
 {const sp=u=>({uniform:'spearman',team:u}),B1=PX.dollBase(sp('red')),B2=PX.dollBase(sp('blue')),g=px(B1.grey);let grey=true;for(let i=0;i<g.length;i+=4)if(g[i+3]&&(g[i]!==g[i+1]||g[i+1]!==g[i+2]))grey=false;
  const p=PX.dollPaint(B1,n=>n==='team'?DL.MAT.green:DL.MAT[n]||DL.MAT.grey),q=PX.doll(sp('red'));
  ok(B1===B2&&grey&&B1.chans.includes('team')&&B1.chans.includes('skin'),'one grey base for every side ('+B1.chans.join(', ')+')');
  ok(px(p).join()!==px(q).join()&&count(p)===count(q),'painted from any palette: the same figure, its colours its own (green for red)');
  const L0=T.lookOf('hum_spear',0,false,1,'',null),L1=T.lookOf('hum_spear',1,false,1,'',null);ok(PX.dollBase(T.dollSpec(L0,'idle',0))===PX.dollBase(T.dollSpec(L1,'idle',0)),'the game’s two sides share his base, painted in each one’s colours')}
 info(JSON.stringify({races:races.length,uniforms:Object.keys(DL.UNIFORMS).length,parts:Object.keys(DL.PARTS).length,figures:n}));
});
