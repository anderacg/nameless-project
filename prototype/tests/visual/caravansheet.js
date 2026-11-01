'use strict';
// Not a test (run by name: -Suites visual/caravansheet): a sheet of the caravan on the map, for the eye (the owner, 2026-11-01: "the
// caravan sprite looks out of place not match with battle style"): the old one (the map's small style, kept here) and the new one
// (caravans.js caravanSprite, in the battle figures' style), each beside a guard as the map draws them (the old at the map's own
// size, the new and the guards WORLD_BATTLE.sprite/scale as big), at 4 screen pixels to a map pixel: each way it faces, its walk
// and its wheel's turn, its owners' colours, the cart left behind and the burnt wagon, a caravan on the march among its guards, and
// the new one at the battle's own size beside battle figures. Its picture is the IMG line, a PNG as a data URL
window.RUN=()=>{const o=[],t=T;
 try{
  window.requestAnimationFrame=()=>0;t.act('begin','soldier');
  const K=4,k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale,cols=Object.keys(t.FACS).map(f=>t.FACS[f].col).filter((c,i,a)=>c&&a.indexOf(c)===i).slice(0,6),col=cols[1]||'#c74453';
  // (the old sprite, as it was until 2026-11-01: a 32x12 cell at the map's own size, its drover a map person)
  const OX=['#d8c094','#a88a62','#6e5a44','#463a32'],OXT=['......ow.','.hhhhhhHe','dHHHHHHHn','.dHHHHHd.'],OXL=[['.kH..kH..'],['k.H.k..H.']];
  const old=(col,f)=>{f=(f||0)%t.PEOPLE_STEPS;const g=t.pgrid(30,12),s=(x,y,c)=>t.pset(g,x+1,y+1,c),Wo=t.CV_WOOD,O=OX,G=9,mix=t.cvMix;
    const Cv=[mix(col,'#f4e8c8',.5),mix(col,'#d8ccb0',.3),mix(col,'#2e2a40',.35),mix(col,'#1a1c26',.55)],oc={h:O[0],H:O[1],d:O[2],k:O[3],o:'#a8987a',w:'#ece4cc',e:'#1a1410',n:'#b8a090'};
    OXT.concat(t.PX.mapLegs(OXL[0],OXL[1],f)).forEach((r,y)=>[...r].forEach((c,x)=>{if(oc[c])s(13+x,G-4+y,oc[c])}));s(19,G-4,Wo[0]);s(19,G-3,Wo[1]);
    for(let y=0;y<=3;y++)for(let x=y?1:2;x<=(y?9:8);x++)s(x,y,x===9?Cv[3]:y===0?Cv[0]:(x-1)%3===2?Cv[2]:y===1?Cv[0]:Cv[1]);
    for(let x=0;x<=10;x++){s(x,4,Wo[0]);s(x,5,Wo[2])}s(11,6,Wo[1]);s(12,6,Wo[1]);
    const wx=2,wy=4;for(const [x,y] of [[1,0],[2,0],[3,0],[4,0],[0,1],[5,1],[0,2],[5,2],[0,3],[5,3],[0,4],[5,4],[1,5],[2,5],[3,5],[4,5]])s(wx+x,wy+y,y>=4||x===0&&y>=2?Wo[3]:Wo[2]);
    for(const [x,y] of (f>>1&1?[[3,1],[4,3],[2,4],[1,2]]:[[2,1],[4,2],[3,4],[1,3]]))s(wx+x,wy+y,Wo[1]);for(const [x,y] of [[2,2],[3,2],[2,3],[3,3]])s(wx+x,wy+y,x===2&&y===2?'#8e95a6':'#6e7890');
    t.poutline(g);const dr=t.mapPerson({race:'human',skin:'skinTan',hair:'brown',eye:t.PEOPLE_EYE,helm:'hood',hood:'linen',outer:'cloth',inner:'dark',team:'leather',weapon:'javelin',shortHair:true},f);
    return t.cellOf(t.mkc(32,12,x=>{x.drawImage(t.pcanvas(g),0,0);x.drawImage(dr,26-8,12-16)}))};
  const oldCart=burnt=>t.cellOf(t.mkc(14,12,g=>{g.drawImage(old('#6a5a48',0),0,20,14,12,0,0,14,12);if(burnt){g.globalCompositeOperation='source-atop';g.fillStyle='rgba(28,20,16,.62)';g.fillRect(0,0,14,12)}}));
  const nu=(c,f,w,how)=>t.caravanSprite(c,f,w,how),guard=(v,p,c)=>t.unitSprite('hum_spear',0,false,v,p,false,false,c||col);
  // (a row: its label and its pictures [picture, scale (map px to its px), facing, dx, dy]; a group: pictures drawn together, their
  // feet at dx, dy (map px) from its middle, nearest last)
  const rows=[],add=(label,items)=>rows.push([label,items]),one=(s,sc,face)=>({w:s.width*sc,h:(s.height-t.opaqueBox(s)[1])*sc,list:[[s,sc,face||1,0,0]]}),
    group=list=>{const xs=list.flatMap(([s,sc,f,dx])=>[dx-s.width*sc/2,dx+s.width*sc/2]),ys=list.map(([s,sc,f,dx,dy])=>dy-(s.height-t.opaqueBox(s)[1])*sc);return{w:Math.max(...xs)-Math.min(...xs),h:-Math.min(...ys,0)+Math.max(0,...list.map(q=>q[4])),x0:Math.min(...xs),list:list.slice().sort((a,b)=>a[4]-b[4])}};
  add('old, a guard',[one(old(col,0),1),one(old(col,0),1,-1),one(old(col,3),1),one(guard(1,0),k)]);
  add('new: still, its walk',[one(nu(col,0,0),k),...[1,2,3,4].map(f=>one(nu(col,f,f%3),k)),one(guard(1,0),k),one(guard(2,3),k)]);
  add('new, facing left',[0,1,2,3,4].map(f=>one(nu(col,f,f%3),k,-1)));
  add('its owners\' colours',cols.map(c=>one(nu(c,0,0),k)));
  add('left behind, burnt',[one(oldCart(0),1),one(oldCart(1),1),one(nu('#8a7a5a',0,0,'left'),k),one(nu('#8a7a5a',0,0,'burnt'),k),one(nu('#8a7a5a',0,0,'left'),k,-1)]);
  const march=(s,sc,f)=>group([[s,sc,1,0,0],[guard(1,f?2:0),k,1,-22,-7],[guard(2,f?3:0),k,1,-6,-9],[guard(3,f?4:0),k,1,12,-8],[guard(4,f?5:0),k,1,-20,6],[guard(5,f?2:0),k,1,-2,7],[guard(0,f?3:0),k,1,16,6]]);
  add('on the march',[march(old(col,2),1,1),march(nu(col,2,1),k,1)]);
  add('battle size',[one(nu(col,1,0),1),one(guard(1,0),1),one(t.unitSprite('hum_knight',0,false,1,0),1),one(t.unitSprite('hum_bow',1,false,2,3),1)]);
  const lw=34,W=Math.max(...rows.map(([l,L])=>L.reduce((a,q)=>a+q.w+6,0)))+lw,heights=rows.map(([l,L])=>Math.max(...L.map(q=>q.h))+6),H=heights.reduce((a,b)=>a+b,0),cv=document.createElement('canvas');
  cv.width=Math.ceil(W*K);cv.height=Math.ceil(H*K);const g=cv.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#6f8a5a';g.fillRect(0,0,cv.width,cv.height);let y=0;
  rows.forEach(([label,L],r)=>{const h=heights[r]-6;g.fillStyle='#fff';g.font='11px Arial';g.fillText(label,4,(y+h/2+2)*K);let x=lw;
    for(const q of L){const mx=x+(q.x0!=null?-q.x0:q.w/2);for(const [s,sc,face,dx,dy] of q.list){g.save();g.translate(Math.round((mx+dx)*K),Math.round((y+h-Math.max(0,...q.list.map(p=>p[4]))+dy)*K));g.scale(face*sc*K,sc*K);g.drawImage(s,-(s.width>>1),-s.height);g.restore()}x+=q.w+6}
    y+=heights[r]});
  o.push('IMG '+cv.toDataURL('image/png'));o.push('PASS caravan sheet drawn ('+rows.length+' rows)');
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
