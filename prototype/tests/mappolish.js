'use strict';
// The map's big figures: a lord's troop count stands clear above his banner (floating over him since Phase 1) and keeps still as his horse
// walks; a mounted lord and a caravan answer a click or hover anywhere on what is drawn of them (horse and banner; cart, ox
// and drover), and someone small beside them still takes his own click; ships sit in power-of-two cells on the people's scale.
// (Phase 1, D25: the map's own smaller figures: a rider and a person in a 16 cell, a caravan and a cog in 32, a rowing boat in 16;
// the click rings keep their size for touch, so a rider now lies within his: mapfigures.js)
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{const t=T,G=t.G,P=t.P,W=t.W;t.act('begin','soldier');G.mode='world';G.modal=false;t.hidePanel();G.clock=t.DAY*.3;
 // (an open spot away from holdings, sites and woods, everyone else sent off the map)
 const MW=t.MW,MH=t.MH,TILE=t.TILE;let spot=null;
 for(let ty=10;ty<MH-10&&!spot;ty++)for(let tx=10;tx<MW-10&&!spot;tx++){const x=(tx+.5)*TILE,y=(ty+.5)*TILE;let dry=true;for(let j=-6;j<=6&&dry;j++)for(let i=-8;i<=8&&dry;i++){if(!t.passable(t.tiles[(ty+j)*MW+tx+i])||t.hiddenAt((tx+i+.5)*TILE,(ty+j+.5)*TILE))dry=false}
   if(dry&&t.TOWNS.every(z=>Math.hypot(z.x-x,z.y-y)>260)&&W.sites.every(s=>Math.hypot(s.x-x,s.y-y)>120))spot=[x,y]}
 ok(!!spot,'an open spot for the fixture');P.x=spot[0];P.y=spot[1];t.reveal();
 W.parties.forEach(p=>{if(p!==P){p.x=-9999;p.y=-9999}});W.critters=[];W.folk=[];W.caravans=[];W.refugees=[];W.ships=[];
 const l=W.lords[0];Object.assign(l,{inside:null,dead:false,x:P.x+40,y:P.y,state:'march'});l.fight=null;
 const face=d=>{t.faceDir(l);l.x+=d;t.faceDir(l)};face(1);
 // ---- the lord's label
 const labels=[],txt0=window.txt;window.txt=function(...a){if(!t.TXTQ)labels.push(a);return txt0.apply(this,a)};
 const ys=[];for(const fr of [0,1]){performance.now=()=>fr*170+5;labels.length=0;t.drawWorld();const B=t.bannerAt(l,0),bx=B.x-G.cam.x+7,L=labels.find(a=>a[0]===String(l.size)&&Math.abs(a[1]-bx)<2);
   const top=B.y-G.cam.y+t.opaqueBox(B.s)[1];ys.push(L?L[2]:null);
   ok(!!L&&L[2]+1<top,'step '+fr+': the lord’s troop count ('+l.size+') is drawn clear above his banner (label row '+(L&&L[2])+', banner top '+top+')')}
 window.txt=txt0;delete performance.now;
 ok(ys[0]!=null&&ys[0]===ys[1],'and it stays still as his horse steps ('+ys.join(' / ')+')');
 // ---- clicks and hovers on a lord's whole horse
 // (a picture's drawn pixels in world places: the cell's top left and whether it faces left)
 const px=(s,x0,y0,flip)=>{const d=s.getContext('2d', { willReadFrequently: true }).getImageData(0,0,s.width,s.height).data,a=[];for(let y=0;y<s.height;y++)for(let x=0;x<s.width;x++)if(d[(y*s.width+x)*4+3]>200)a.push([x0+(flip?s.width-1-x:x)+.5,y0+y+.5]);return a};
 const ring=(q,x,y,r,dy)=>Math.hypot(q.x-x,q.y-dy-y)<r;// (the old ring: 10 round a party's middle, 11 round a caravan's)
 for(const d of [1,-1]){face(d);const s=t.partySprite(t.FACS[l.fac].col,t.C.horse,0),p=px(s,l.x-8,l.y+3-16,d<0),
     top=p.reduce((a,b)=>b[1]<a[1]?b:a),head=p.reduce((a,b)=>b[0]*d>a[0]*d?b:a),tail=p.reduce((a,b)=>b[0]*d<a[0]*d?b:a),hoof=p.filter(q=>q[1]>=l.y).reduce((a,b)=>b[0]*d<a[0]*d?b:a);
   const pts={'banner top':top,'horse’s head':head,'tail':tail,'hind hoof':hoof},far=Object.keys(pts).filter(k=>!ring(l,pts[k][0],pts[k][1],10,4));
   ok(Object.keys(pts).every(k=>Math.abs(pts[k][0]-l.x)<=8&&pts[k][1]>=l.y-13&&pts[k][1]<=l.y+3),'facing '+(d>0?'right':'left')+', the lord’s horse and banner fill his 16 cell, '+(far.length?'reaching past his 10 pixel ring: '+far.join(', '):'within his 10 pixel ring'));
   const miss=Object.keys(pts).filter(k=>t.pickAt(pts[k][0],pts[k][1])!==l);ok(!miss.length,'a click anywhere on his horse and banner picks him: '+Object.keys(pts).join(', ')+(miss.length?' (missed: '+miss.join(', ')+')':''));
   {const B=t.bannerAt(l,0),bb=t.opaqueBox(B.s);ok(t.pickAt(B.x+bb[0]+3,B.y+bb[1]+2)===l&&t.pickAt(B.x+bb[0]+3,B.y+bb[1]-4)!==l&&t.pickAt(head[0]+d*4,head[1])!==l,'his banner over him picks him too; not the open ground above it or ahead of his horse')}
   const tip=t.tipFor(t.pickAt(head[0],head[1]));ok(!!tip&&tip.includes(l.name),'hovering his horse’s head shows his card')}
 // (someone small beside him keeps his own click)
 face(1);const b=t.bandits[0];b.fight=null;b.x=l.x-9;b.y=l.y+3;
 ok(t.pickAt(b.x,b.y-6)===b,'a bandit standing by the lord’s horse is still picked when clicked');
 {const s=t.partySprite(t.FACS[l.fac].col,t.C.horse,0),hd=px(s,l.x-8,l.y+3-16,false).reduce((a,q)=>q[0]>a[0]?q:a);ok(t.pickAt(hd[0],hd[1])===l,'and the horse’s head, away from him, still picks the lord')}
 b.x=-9999;b.y=-9999;
 // ---- clicks on a caravan's whole cart, ox and drover
 for(let i=0;i<30&&!W.caravans.length;i++)t.sendCaravan(t.TOWNS[i%t.TOWNS.length]);const c=W.caravans[0];ok(!!c,'a caravan for the fixture');
 if(c){c.x=P.x-20;c.y=P.y+60;for(const d of [1,-1]){c.dir=d;const s=t.caravanPic(c),p=px(s,c.x-16,c.y+1-32,d<0),
     back=p.reduce((a,q)=>q[0]*d<a[0]*d?q:a),drover=p.reduce((a,q)=>q[0]*d>a[0]*d?q:a),cover=p.filter(q=>q[0]*d<c.x*d).reduce((a,q)=>q[1]<a[1]?q:a),wheel=p.filter(q=>q[0]*d<c.x*d).reduce((a,q)=>q[1]>a[1]?q:a);
   const pts={'cart’s back':back,'drover':drover,'cover':cover,'wheel':wheel},far=Object.keys(pts).filter(k=>!ring(c,pts[k][0],pts[k][1],11,5));
   ok(far.length>=3,'facing '+(d>0?'right':'left')+', the caravan reaches past its old 11 pixel ring: '+far.join(', '));
   const miss=Object.keys(pts).filter(k=>t.pickAt(pts[k][0],pts[k][1])!==c);ok(!miss.length,'a click anywhere on the cart, ox and drover picks the caravan'+(miss.length?' (missed: '+miss.join(', ')+')':''));
   ok(t.pickAt(back[0]-d*4,back[1])!==c&&t.pickAt(cover[0],cover[1]-5)!==c,'but not the ground behind the cart or above its cover');
   const tip=t.tipFor(t.pickAt(drover[0],drover[1]));ok(!!tip&&/aravan/.test(tip),'hovering the drover shows the caravan’s card')}
  c.dir=1;const ox=px(t.caravanPic(c),c.x-16,c.y+1-32,false).filter(q=>q[0]>c.x-3&&q[0]<c.x+5).reduce((a,q)=>q[1]<a[1]?q:a);
  const b2=t.bandits[1]||t.bandits[0];b2.fight=null;b2.x=ox[0];b2.y=c.y+4;ok(t.pickAt(b2.x,b2.y-6)===b2,'a band standing at the ox is still picked when clicked, not the caravan');b2.x=-9999;b2.y=-9999}
 // ---- ships: power-of-two cells, waterline on the bottom row, on the map's scale (a man 10 high)
 for(const big of [true,false]){const s=t.shipSprite({seed:4,big,col:'#a8483a'}),bx=t.opaqueBox(s),len=bx[2]-bx[0]+1;
   ok(s.width===s.height&&s.width===(big?32:16)&&bx[3]===s.height-1,(big?'a trade ship':'a fishing boat')+' sits in a '+s.width+'x'+s.height+' cell, its waterline on the bottom row');
   ok(big?len>=2.5*10&&bx[3]-bx[1]+1>=2*10:len>=12,(big?'a cog is some two and a half men long and two tall':'a rowing boat is longer than a man is tall')+' ('+len+' long, '+(bx[3]-bx[1]+1)+' high)')}
 // ---- moored at a pier (structures.js estateBoats): the same ships, the rowing boat empty, the cog's sail furled
 {const row=(s,y)=>{const d=s.getContext('2d', { willReadFrequently: true }).getImageData(9,y,13,1).data;let k=0;for(let i=3;i<d.length;i+=4)if(d[i])k++;return k};
  const sail=t.shipSprite({seed:4,big:true,col:'#a8483a'}),furl=t.shipSprite({seed:4,big:true,col:'#a8483a',moored:true}),rb=t.shipSprite({seed:4,big:false,moored:true});
  ok(furl.width===32&&t.opaqueBox(furl)[3]===31&&rb.width===16&&t.opaqueBox(rb)[3]===15,'moored boats keep their ships’ cells and waterlines (32 and 16, the bottom row)');
  ok(row(sail,19)>8&&row(furl,19)<=4,'a moored cog’s sail is furled on its yard ('+row(furl,19)+' pixels across where the sail hangs under way: the mast in its outline)');
  ok(t.opaqueBox(rb)[1]>t.opaqueBox(t.shipSprite({seed:4,big:false}))[1],'a moored rowing boat lies empty, no fisherman in it')}
 {const z=t.TOWNS.find(q=>t.dockOf(q));if(z){const d=t.dockOf(z);W.ships=[{k:'trade',home:z.name,to:z.name,fac:z.owner,x:(d.tx+.5)*TILE,y:(d.ty+.5)*TILE,path:[],i:0,seed:3,dir:-1,state:'out',big:true,col:'#a8483a'},{k:'fish',home:z.name,x:(d.tx+.5)*TILE,y:(d.ty+1.5)*TILE,path:[],i:0,seed:4,dir:1,state:'fish',big:false}];
   P.x=d.tx*TILE;P.y=d.ty*TILE+30;t.reveal();t.drawWorld();ok(!ERR.length,'ships and boats are drawn without error')}}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
