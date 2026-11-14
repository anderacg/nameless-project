'use strict';
// Villagers' clothes by the land (data/dress.js FOLK_DRESS; the owner, 2026-11-14: "make a clothing variation for villagers like
// using white, or natural colors and material based on locations. The colder area may wear fur clothes"): the folk (people.js
// folkLook) in undyed and natural cloth, furs and pelts in the frost, pale linen and hoods in the desert, the marsh's dull greens;
// the trades keep their own coats but in the frost and the desert; peasants drawn as soldiers (sprites.js spriteLook) the same,
// by the climate they stand in (sprites.js dressedIn); the soldiers untouched; the switch off, everyone as before.
Kit.suite(({ok,info})=>{
 const t=T,X=t.FOLK_DRESS,CL=['grass','frost','desert','swamp'],V=[...Array(24).keys()],folk=c=>t.dressedIn(c,()=>V.map(v=>t.folkLook('folk','human',v)));
 ok(CL.every(c=>X[c]&&X[c].outer.length&&X[c].inner.length&&X[c].head.length)&&CL.every(c=>[...X[c].outer,...X[c].inner,...X[c].hood].every(m=>t.PPAL[m])),'a dress for every climate, every cloth in the palette');
 {const g=folk('grass'),bright=['violet','teal','blue','red','purple','gold'];
  ok(g.every(o=>X.grass.outer.includes(o.outer)&&!bright.includes(o.outer)&&!bright.includes(o.team))&&new Set(g.map(o=>o.outer)).size>=5,'on the grassland: undyed and natural cloth, no dyes ('+[...new Set(g.map(o=>o.outer))].join(', ')+')')}
 {const f=folk('frost'),fur=f.filter(o=>o.outer==='fur').length,pelt=f.filter(o=>/^pelt_/.test(o.helm)).length,cloak=f.filter(o=>o.cape).length;
  ok(fur>=f.length/3&&pelt>=f.length/3&&cloak>=f.length/2,'in the frost: furs ('+fur+' of '+f.length+'), wolf and bear pelts on their heads ('+pelt+'), fur cloaks ('+cloak+')')}
 {const d=folk('desert'),pale=d.filter(o=>['white','linen','sand'].includes(o.outer)).length,hood=d.filter(o=>o.helm==='hood').length,robe=d.filter(o=>o.robe).length;
  ok(pale>=d.length*.6&&hood>=d.length/3&&robe>=d.length/4,'in the desert: pale linen ('+pale+' of '+d.length+'), hoods ('+hood+'), long robes ('+robe+')')}
 {const s=folk('swamp');ok(s.every(o=>X.swamp.outer.includes(o.outer)),'in the marsh: its dull greens and greys ('+[...new Set(s.map(o=>o.outer))].join(', ')+')')}
 // (the trades: a smith keeps his leather but in the frost and the desert)
 {const sm=c=>t.dressedIn(c,()=>t.folkLook('smith','human',2));ok(sm('grass').outer==='leather'&&sm('swamp').outer==='leather'&&X.frost.outer.includes(sm('frost').outer)&&X.desert.outer.includes(sm('desert').outer),'a smith keeps his leather apron at home, wears the land’s coat in the frost ('+sm('frost').outer+') and the desert ('+sm('desert').outer+')')}
 // (peasants drawn as soldiers: their trade's coat, the land's dress in the frost and the desert; the soldiers untouched)
 {const look=(type,c)=>t.dressedIn(c,()=>t.spriteLook(type,0,false,1,'#6a5a48')),pg=look('hum_farmer','grass'),pf=look('hum_farmer','frost'),pd=look('hum_farmer','desert');
  ok(pf.outer==='fur'||X.frost.outer.includes(pf.outer),'a peasant in the frost in its coats ('+pf.outer+', '+pf.helm+')');
  ok(X.desert.outer.includes(pd.outer)&&pg.outer!==undefined,'in the desert in pale linen ('+pd.outer+')');
  const sg=JSON.stringify(look('hum_spear','grass')),sd=JSON.stringify(look('hum_spear','desert'));ok(sg===sd,'a soldier dressed the same in every land (his kit is his kit)');
  const k=c=>t.dressedIn(c,()=>t.unitSprite('hum_farmer',0,false,1,0,false,false,'#6a5a48'));ok(k('grass')!==k('frost')&&k('frost')===k('frost'),'each land its own picture of a peasant, kept')}
 // (the switch off: everyone as before)
 {const was=t.folkLook('folk','human',3);try{X.on=false;const o=t.dressedIn('frost',()=>t.folkLook('folk','human',3));ok(t.FOLK_CLOTH.includes(o.outer)&&!o.cape,'FOLK_DRESS.on false: the old coloured cloth, no furs ('+o.outer+')')}finally{X.on=true}}
});
