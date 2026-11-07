'use strict';
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',17);Kit.clear();Kit.world();
 const pixels=s=>Array.from(s.getContext('2d').getImageData(0,0,s.width,s.height).data).join(','),u={type:'dw_axe',id:1,walk:0,walking:false},owner=col=>({look:()=>({col})});
 const battle=t.unitSprite('dw_axe',0,false,1,0),before=pixels(battle),orange=t.marchSprite(u,owner('#de873b')),purple=t.marchSprite(u,owner('#a351c9'));
 ok(pixels(orange)!==pixels(purple),'travel soldiers retain their faction colors instead of sharing a battle-side palette');
 ok(before===pixels(t.unitSprite('dw_axe',0,false,1,0))&&battle!==orange,'travel tint does not alter cached battle sprites');
 ok(pixels(orange)!==pixels(t.marchSprite({...u,type:'orc_grunt'},owner('#de873b'))),'mixed-race troops retain their individual unit appearance under faction tint');
 t.WORLD_BATTLE.on=true;
 const hero=t.marchLeaderSprite(t.P,0),race=t.P.race;t.P.race=race==='orc'?'human':'orc';
 ok(pixels(hero)!==pixels(t.marchLeaderSprite(t.P,0)),'hero leader uses current character race instead of a generic campaign figure');t.P.race=race;
 const lord=t.W.lords[0],actual=t.marchLeaderSprite(lord,0),base=t.unitSprite(t.charOf(lord).key,0,false,0,0,false,false,lord.look().col),k=t.WORLD_BATTLE.sprite/t.WORLD_BATTLE.scale;
 const expected=t.mkc(Math.ceil(base.width*k),Math.ceil(base.height*k),g=>g.drawImage(base,0,0,base.width*k,base.height*k));
 ok(pixels(actual)===pixels(expected),'lord leader uses the battle character kind at marching scale and faction tint');
 {const L={id:1,row:'leader',type:t.charOf(lord).key,character:true,x:20,y:20,walking:false},oldDraw=t.ctx.drawImage,drawn=[];try{t.ctx.drawImage=s=>drawn.push(s);t.drawMarcher(L,lord,{x:0,y:0})}finally{t.ctx.drawImage=oldDraw}
  const bare=t.unitSprite(t.charOf(lord).key,0,false,0,0,true,false,lord.look().col),held=t.mapHeld(t.marchLook(L,lord),bare,false);
  // (zoomed out, each picture shrunk first, kept by its own (render.js reduced, mapPic: .src); the fist laid over the grip apart)
  const pics=drawn.map(x=>x.src||x).filter(x=>!x.fist);
  ok(pics.length===(held?2:1)&&pics.some(x=>pixels(x)===pixels(bare))&&(!held||pics.includes(held.w)),'a lord marches in his army (his place in it: march.js), drawn by the full battle sprite: his body bare, his weapon apart in his hand, as in battle (the owner, 2026-11-03)')}
 const fig=t.partyFig(lord,lord.look(),0);
 ok(fig.s===actual&&Math.abs(lord.headY()-Math.min(...Array.from({length:t.PEOPLE_STEPS},(_,f)=>{const q=t.partyFig(lord,lord.look(),f);return q.y+t.opaqueBox(q.s)[1]})))<=1,'leader picking and banner height follow the displayed battle sprite');
});
