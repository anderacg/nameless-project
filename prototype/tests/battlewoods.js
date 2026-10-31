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
 const wx=(at%t.MW+.5)*t.TILE,wy=(Math.floor(at/t.MW)+.5)*t.TILE;Kit.goTo(wx,wy+5*t.TILE);P.troops={hum_foot:60};P.sk.lead.lv=20;
 const enemy=t.asParty({kind:'bandits',troops:Array(60).fill('militia'),x:P.x+60,y:P.y,cool:0});G.enc={kind:'party',ref:enemy,list:enemy.troops.slice(),allies:[],foes:[],mine:true};
 t.startBattle({enemies:G.enc.list,tournament:false,deploy:false});const b=t.B;ok(b&&b.world,'a world battle');if(!b||!b.world)return;b.paused=true;
 const u=b.units.find(x=>x.team===0&&!x.hero),p=b.world.field({x:wx,y:wy});u.x=p.x;u.y=p.y;t.camCentre(u.x,u.y);
 const D=t.WDEPTH;for(let i=0;i<3;i++)t.frame();
 const mine=D.boxes.filter(x=>x[5]),covered=D.cov.size;
 ok(mine.length>0,'your soldiers are drawn as the map\'s figures are, each with what stands in front of him ('+D.boxes.length+' boxes, '+mine.length+' yours)');
 ok(covered>0,'one in the wood: the trees in front of him drawn over him, faded ('+covered+' trees over your men)');
 // (its cost, INFO: a frame with and without, sixty a side in the wood)
 {const pn=()=>performance.now();
  const ms=on=>{D.on=on;const a=pn();for(let i=0;i<20;i++)t.frame();return (pn()-a)/20};const b2=t.B;b2.units.forEach((u,i)=>{const q=b2.world.field({x:wx+(i%10-5)*6,y:wy+(Math.floor(i/10)-1)*6});u.x=q.x;u.y=q.y});
  const off=ms(false),on=ms(true);D.on=true;info('a frame in the wood: '+on.toFixed(2)+' ms with the trees over them, '+off.toFixed(2)+' ms without ('+b2.units.length+' on the field)')}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
