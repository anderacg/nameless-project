'use strict';
// The approved adventurer is player-only; races, equipment, movement and the bare-handed rig still resolve normally.
Kit.suite(({ok})=>{
 const t=T,P=t.P;Kit.begin('soldier',23);Kit.clear();
 const pixels=c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).join(','),looks=[];
 for(const race of ['human','dwarf','elf','orc']){
  P.race=race;P.gear=t.emptyGear();const L=t.lookOf('hero',0,true,0),sprite=t.unitSprite('hero',0,true,0);
  ok(L.playerStyle&&L.helm==='bare'&&L.outer==='leather'&&L.inner==='forest'&&L.cape===t.PLAYER_HERO_LOOK.cape,race+': the approved open-faced leather and blue-green cloak defaults');
  ok(L.short===t.RACE_LOOK[race].short&&L.ears===t.RACE_LOOK[race].ears&&L.tusk===t.RACE_LOOK[race].tusk&&!!L.beard===(race==='dwarf'),race+': its height, ears, tusks and beard still identify the race');
  looks.push(pixels(sprite));let crisp=true,visible=true;
  for(let pose=0;pose<=40;pose++){const c=t.unitSprite('hero',0,true,0,pose),rgba=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=3;i<rgba.length;i+=4){if(rgba[i])n++;if(rgba[i]!==0&&rgba[i]!==255)crisp=false}if(!n)visible=false}
  ok(crisp&&visible,race+': every movement, weapon, defence and bare-handed frame is visible and uses opaque integer pixels');
 }
 ok(new Set(looks).size===4,'each player race has its own visible silhouette and face');
 P.race='human';P.gear=t.emptyGear();const unarmed=t.partySprite('#e8b94a',null,0,'human');
 P.gear.head=t.gearId('helm',2);P.gear.body=t.gearId('mail',3);P.gear.weapon=t.gearId('sword',2);
 const L=t.lookOf('hero',0,true,0),stats=JSON.stringify(t.heroStats());
 ok(L.helm==='kettle'&&L.helmC===t.ITEMS[P.gear.head].col&&L.outer===t.ITEMS[P.gear.body].col&&L.weapon==='sword','equipped helmet, armor material and weapon override the defaults');
 const full=t.peopleSprite(L,0,false),body=t.peopleSprite(L,0,true);
 ok(body.hand&&pixels(full)!==pixels(body),'the melee body still provides its hand anchor and leaves a separate weapon off when asked');
 ok(t.partySprite('#e8b94a',null,0,'human')!==unarmed,'the small-map player cache refreshes when gear changes');
 t.unitSprite('hero',0,true,0,15);t.marchLeaderSprite(P,0);
 ok(JSON.stringify(t.heroStats())===stats,'rendering the hero in battle and marching does not alter combat stats');
 ok(!t.lookOf('hum_sword',0,false,0).playerStyle&&!t.lookOf('brann',0,false,0,'brann').playerStyle,'soldiers and companions keep their existing templates');
});
