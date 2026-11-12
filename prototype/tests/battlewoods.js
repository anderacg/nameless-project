'use strict';
// The woods cover the fighters in a world battle (gfx/render.js drawBattle, depth.js worldOverdraw; the owner, 2026-10-31: "when
// battle, the forest seems not to cover units"): fought on the world map, each soldier is drawn with the trees in front of him put
// back over him, as the map's own figures are; those over your own men fade, so you still see them.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',51);Kit.clear();Kit.world();t.GUIDE.on=false;t.WORLD_BATTLE.on=true;t.BDEPLOY.on=false;
 // (a wood deep enough to stand in: a forest tile with forest all round it, open ground a few tiles south to come from)
 let at=-1;const F=(x,y)=>t.WM.kind[y*t.MW+x]===t.T_FOREST;
 for(let i=0;i<t.WM.kind.length&&at<0;i++){const x=i%t.MW,y=Math.floor(i/t.MW);if(x<25||x>t.MW-25||y<25||y>t.MH-25)continue;
  let ok2=true;for(let j=-2;j<=2&&ok2;j++)for(let k=-2;k<=2&&ok2;k++)if(!F(x+k,y+j))ok2=false;if(ok2&&t.WM.kind[(y+5)*t.MW+x]===t.T_OPEN)at=i}
 ok(at>=0,'(a wood to fight in)');if(at<0)return;
 const wx=(at%t.MW+.5)*t.TILE,wy=(Math.floor(at/t.MW)+.5)*t.TILE;Kit.goTo(wx,wy+5*t.TILE);P.troops={hum_foot:60};P.sk.lead.lv=20*PROF.per;
 const enemy=t.asParty({kind:'bandits',troops:Array(60).fill('militia'),x:P.x+60,y:P.y,cool:0});G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const b=t.B;ok(b&&b.world,'a world battle');if(!b||!b.world)return;b.paused=true;
 const u=b.units.find(x=>x.team===0&&!x.hero),p=b.world.field({x:wx,y:wy});u.x=p.x;u.y=p.y;t.camCentre(u.x,u.y);
 const D=t.WDEPTH;for(let i=0;i<3;i++)t.frame();
 const mine=D.boxes.filter(x=>x[5]),covered=D.cov.size;
 ok(mine.length>0,'your soldiers are drawn as the map\'s figures are, each with what stands in front of him ('+D.boxes.length+' boxes, '+mine.length+' yours)');
 ok(covered>0,'one in the wood: the trees in front of him drawn over him, faded ('+covered+' trees over your men)');
 // the camera off its whole pixels (a battle's camera glides): the cover still drawn over them (its mask once lost every pixel to a
 // fraction of the camera: no tree drawn over anyone)
 {const o0=window.overdrawBox,G0={x:G.cam.x,y:G.cam.y};let boxes=0,filled=0;window.overdrawBox=function(x0,y0,x1,y1){const r=o0.apply(this,arguments);
   if(r){boxes++;const I=D.img,w=x1-x0+1,h=y1-y0+1;let c=0;for(let y=0;y<h&&!c;y++)for(let x=0;x<w;x++)if(I.data[(y*I.width+x)*4+3]){c=1;break}filled+=c}return r};
  try{G.cam.x=Math.floor(G.cam.x)+.37;G.cam.y=Math.floor(G.cam.y)+.61;t.frame();ok(boxes>0&&filled===boxes,'the camera at a fraction of a pixel: every man under the trees has them drawn over him ('+filled+' of '+boxes+')')}
  finally{window.overdrawBox=o0;G.cam.x=G0.x;G.cam.y=G0.y}}
 // dashes (WDEPTH.dash): the men under trees outlined in dashes by their side's colour, over what covers them; none in the open, none off
 {const d0=window.dashDraw,seen=[];window.dashDraw=function(rec,m,x0,y0,x1,y1,col){seen.push(col);return d0.apply(this,arguments)};
  try{t.frame();ok(seen.includes(D.dash.col.own),'your men under the trees: outlined in dashes, your colour ('+seen.length+' outlines)');
   const n=seen.length;b.units.forEach(x=>{if(x!==u)x.x=x.y=-9999});t.frame();const one=seen.length-n;
   let op=null;const O=(x,y)=>t.WM.kind[y*t.MW+x]===t.T_OPEN&&!(t.WM.forest&&t.WM.forest[y*t.MW+x]);
   for(let r=1;r<20&&!op;r++)for(let j=-r;j<=r&&!op;j++)for(let i=-r;i<=r&&!op;i++){const x=at%t.MW+i,y=Math.floor(at/t.MW)+j;let all=true;for(let a=-2;a<=2&&all;a++)for(let c=-2;c<=2;c++)if(!O(x+c,y+a)){all=false;break}if(all)op={x:(x+.5)*t.TILE,y:(y+.5)*t.TILE}}
   const q=b.world.field(op||{x:wx,y:wy+5*t.TILE});u.x=q.x;u.y=q.y;t.camCentre(u.x,u.y);t.frame();const open=seen.length-n-one;
   ok(one>=1&&open===0,'one man in the wood outlined ('+one+'), the same man in the open not ('+open+')');
   u.x=p.x;u.y=p.y;t.camCentre(u.x,u.y);D.dash.on=false;const m0=seen.length;t.frame();ok(seen.length===m0,'and none with the switch off')}
  finally{window.dashDraw=d0;D.dash.on=true}}
 // (its cost, INFO: a frame with and without, sixty a side in the wood)
 {const pn=()=>performance.now();
  const ms=on=>{D.on=on;const a=pn();for(let i=0;i<20;i++)t.frame();return (pn()-a)/20};const b2=t.B;b2.units.forEach((u,i)=>{const q=b2.world.field({x:wx+(i%10-5)*6,y:wy+(Math.floor(i/10)-1)*6});u.x=q.x;u.y=q.y});
  const off=ms(false),on=ms(true);D.dash.on=false;const nd=ms(true);D.dash.on=true;D.on=true;info('a frame in the wood: '+on.toFixed(2)+' ms with the trees over them and dashes, '+nd.toFixed(2)+' ms without dashes, '+off.toFixed(2)+' ms without either ('+b2.units.length+' on the field)')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
