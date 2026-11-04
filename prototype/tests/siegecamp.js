'use strict';
// Your siege camp under a battle (the owner, 2026-11-04: "when we camp and attacked by lords the camp icons etc still draw"): a
// battle fought on the map round you hides your siege camp, its "Siege day" and your camp; after it, the siege camp is back.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G;Kit.begin('soldier',1);Kit.clear();t.GUIDE.on=false;
 const T3=t.TOWNS.find(z=>z.kind!=='village'&&z.owner!=='player');P.hostile={[T3.owner]:G.day+60};T3.gar=5;Kit.world({encCool:0});P.x=T3.x+40;P.y=T3.y+40;P.troops={hum_foot:6};P.siege={town:T3.name,days:2};
 const seen=()=>{const said=[],cs=window.campSprite,tx=window.txt;let camps=0;window.campSprite=(...a)=>{camps++;return cs(...a)};window.txt=(s,...a)=>{said.push(String(s));return tx(s,...a)};
  try{t.drawWorld()}finally{window.campSprite=cs;window.txt=tx}return{camps,day:said.some(s=>/^Siege day/.test(s))}};
 {const s=seen();ok(s.camps>0&&s.day,'besieging: your siege camp and its "Siege day" drawn ('+s.camps+')')}
 const L=t.makeEnemies(4,false,'bandits');G.enc={kind:'party',ref:{x:P.x+20,y:P.y,troops:L.slice()},list:L,allies:[],foes:[],mine:true};
 t.startBattle({enemies:L,tournament:false});Kit.engage();
 ok(t.B&&t.B.world,'(a lord\'s men fall on you: a battle on the map)');
 {const s=seen();ok(t.B&&s.camps===0&&!s.day,'while it is fought: no siege camp, no "Siege day" under the men ('+s.camps+')')}
 P.camp={at:0};{const s=seen();ok(s.camps===0,'nor your camp');P.camp=null}
 if(t.B){t.B.over=true;t.B.win=true;t.B.endT=0;t.updateBattle(.01);if(t.B)t.finishBattle();Kit.done({cont:true,world:true})}
 P.siege=P.siege||{town:T3.name,days:2};{const s=seen();ok(!t.B&&s.camps>0&&s.day,'after it, the siege camp back')}
 P.siege=null;
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
