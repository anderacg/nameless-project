'use strict';
// Climate cannot invent equipment; equipped fur parts retain independent ownership.
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const gear=t.P.gear,inv=t.P.inv;try{
  t.P.gear={};const look=()=>t.spriteLook('hero',0,true,0),cold=()=>t.dressedIn('frost',look),warm=()=>t.dressedIn('grass',look);
  let a=warm(),b=cold();ok(b.helm===a.helm&&b.cape===a.cape&&!b.helm.startsWith('pelt_'),'snow adds neither animal headwear nor a fur mantle to an unequipped hero');
  t.P.inv=[{k:'gear',id:'bearcoat',n:1},{k:'mat',id:'pelt',n:3}];ok(!cold().cape,'fur armor and pelts carried in the bag do not count as equipped');
  t.P.gear={body:'bearcoat',head:'g_helm_2'};a=warm();b=cold();ok(a.cape===t.ITEMS.bearcoat.col&&b.cape===a.cape,'equipped Bear Hide Coat supplies its actual mantle in warm and snowy terrain');
  ok(a.helm==='kettle'&&b.helm===a.helm&&b.helmC===t.ITEMS.g_helm_2.col,'a fur coat preserves the equipped metal helmet instead of granting an animal head');
  t.P.gear={body:'g_mail_2',head:'g_helm_2'};b=cold();ok(!b.cape&&b.helm==='kettle','replacing the fur coat removes the mantle immediately in snow');
  const cid=Object.keys(t.COMPS)[0],comp=t.lookOf('militia',0,false,0,cid,{body:'bearcoat',head:'g_helm_2'});ok(comp.cape===t.ITEMS.bearcoat.col&&comp.helm==='kettle','companion equipment follows the same independent body and head rules');
  const old=t.ITEMS._furhead;t.ITEMS._furhead={slot:'head',col:'#9a8877',fur:{helm:'pelt_wolf'}};try{t.P.gear={head:'_furhead'};b=cold();ok(b.helm==='pelt_wolf'&&!b.cape,'explicitly equipped fur headwear does not also grant a fur mantle')}finally{if(old)t.ITEMS._furhead=old;else delete t.ITEMS._furhead}
  {const old=t.ITEMS._furcape;try{t.ITEMS._furcape={slot:'cape',col:'#8e704e',fur:{cape:true}};t.P.gear={};const bare=t.unitSprite('hero',0,true,0,0);t.P.gear={cape:'_furcape'};const equipped=t.unitSprite('hero',0,true,0,0);ok(cold().cape==='#8e704e'&&bare!==equipped,'equipping a fur cloak refreshes the cached sprite without requiring a climate change');t.P.gear={};ok(t.unitSprite('hero',0,true,0,0)===bare,'unequipping the cloak restores the correct cached appearance')}finally{if(old)t.ITEMS._furcape=old;else delete t.ITEMS._furcape}}
  for(const type of ['hum_foot','hum_bow','dw_thane'])if(t.ST[type]){const a=t.dressedIn('grass',()=>t.spriteLook(type,0,false,0)),b=t.dressedIn('frost',()=>t.spriteLook(type,0,false,0));ok(a.helm===b.helm&&a.cape===b.cape,type+': snow preserves the troop kit')}
  const L={helm:'pelt_bear',cape:'#795739'};ok(t.winterLook(L)===L,'a predefined fur kit is preserved without manufacturing extra parts');
 }finally{t.P.gear=gear;t.P.inv=inv}
 ok(!ERR.length,'equipped fur rendering produces no runtime errors');
});
