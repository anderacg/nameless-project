'use strict';
// Not a test: scenes for screenshots of the band card and the names (headless Chrome --screenshot at a window size).
// ?shot=card (on the map: a named band, some wounded, your hero hurt, a little tired) | default (the same, no names) |
// new (the New game page with its name fields filled) | names (the Names window over the map) | fill (stopped at the water's
// edge, the waterskins 60% filled: the card's bar, the drop over your band) | ring (there, the action ring open: Fill waterskins)
window.RUN=()=>{
 const t=T,G=t.G,P=t.P,shot=new URLSearchParams(location.search).get('shot')||'card';
 window.requestAnimationFrame=()=>0;Math.random=t.seeded(77);
 if(shot==='new'){t.showTitle('new');for(const [k,v] of [['hero','Bran Redhand'],['band','The Grey Company']]){const i=document.querySelector('#panel [data-name="'+k+'"]');i.value=v;i.dispatchEvent(new Event('input',{bubbles:true}))}t.MainMenu.frame(performance.now());return}
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.mode='world';G.modal=false;t.hidePanel();
 if(shot!=='default'){P.name='Bran Redhand';P.band='The Grey Company'}
 P.troops={hum_spear:6,hum_bow:4};P.wounded={hum_spear:2};P.hp=t.vitals()[0]*.6;P.morale=72;P.bsta=38;P.tx=P.x+120;P.ty=P.y;
 if(shot==='fill'||shot==='ring'){const K=t.WorldArt.ensure().wk,r=t.SUPPLY.fill.near*16;let at=null;
  for(let ty=8;ty<t.MH-8&&!at;ty++)for(let tx=8;tx<t.MW-8;tx++){if(t.tAt(tx,ty)!==t.T_OPEN||t.tAt(tx,ty-1)!==t.T_WATER||t.tAt(tx,ty+1)!==t.T_OPEN||K[(ty+1)*t.MW+tx]||t.climAt(tx*16,ty*16)!=='grass'||t.TOWNS.some(h=>Math.hypot(h.x-tx*16,h.y-ty*16)<160))continue;
   const x=(tx+.5)*16;let y=ty*16;while(y<(ty+2)*16&&t.waterEdge(x,y+1,r))y++;if(y>ty*16){at=[x,y];break}}
  P.x=at[0];P.y=at[1];P.tx=null;G.chase=null;G.clock=t.DAY*.3;t.reveal();t.goodTake('water',1e9);t.goodTake('skin_empty',1e9);t.playerInventory.add('good','skin_empty',99);t.SKINS.reset(false);
  if(shot==='fill'){t.fillSkins();t.SKINS.on.at-=t.SKINS.on.h*.6;t.SKINS.step()}else t.SKINS.t=1e9}// (the ring's: not yet begun by itself)
 t.updateHUD(true);t.frame();t.MainMenu.frame(performance.now());if(shot==='names')t.openNames();
 if(shot==='ring'){t.fitScreen();t.frame();const c=t.cv.getBoundingClientRect();t.ringOpen(c.left+c.width/2+30,c.top+c.height/2,P.x+16,P.y)}// (laid out at the window's size first; the camera on you: you at the middle)
};
