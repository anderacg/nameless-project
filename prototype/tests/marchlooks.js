'use strict';
Kit.suite(({ok})=>{
 const t=T;Kit.begin('soldier',17);Kit.clear();Kit.world();
 const pixels=s=>Array.from(s.getContext('2d').getImageData(0,0,s.width,s.height).data).join(','),u={type:'dw_axe',id:1,walk:0,walking:false},owner=col=>({look:()=>({col})});
 const battle=t.unitSprite('dw_axe',0,false,1,0),before=pixels(battle),orange=t.marchSprite(u,owner('#de873b')),purple=t.marchSprite(u,owner('#a351c9'));
 ok(pixels(orange)!==pixels(purple),'travel soldiers retain their faction colors instead of sharing a battle-side palette');
 ok(before===pixels(t.unitSprite('dw_axe',0,false,1,0))&&battle!==orange,'travel tint does not alter cached battle sprites');
 ok(pixels(orange)!==pixels(t.marchSprite({...u,type:'orc_grunt'},owner('#de873b'))),'mixed-race troops retain their individual unit appearance under faction tint');
 const dwarf=t.partySprite('#de873b','',0,'dwarf'),human=t.partySprite('#de873b','',0,'human');
 ok(pixels(dwarf)!==pixels(human)&&dwarf!==human,'campaign leader sprites and cache distinguish races within one faction color');
});
