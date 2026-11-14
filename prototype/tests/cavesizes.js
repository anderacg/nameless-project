'use strict';
// A cave's size (battle/interior.js INTERIOR.sizes, Interior.sizeOf; the owner, 2026-11-13: "Does a cave have variations? Like small
// cave with 1 room"; "Ok"): by what lairs in it, a hollow (one chamber), a small cave, a cave, a great cave with side chambers;
// now and then one larger by its place, the same every visit; its own field; fewer or more of your band going in; a camp's, a cave.
Kit.suite(({ok,info})=>{
 const t=T,G=t.G,P=t.P,W=t.W,X=t.INTERIOR,Z=X.sizes,on0=X.on,B=()=>t.B,M=t.MONSTERS;
 try{
  X.on=true;Kit.begin('soldier',5);Kit.clear();Kit.world();{const r=t.partyRoster(P);r.add('hum_foot',14)}
  // ---- what lairs in it: its size (each kind's at a place it is not grown)
  {const base=id=>{const out=new Set();for(let i=0;i<60;i++)out.add(t.Interior.sizeOf({id,x:i*37+11,y:i*53+7}));return [...out]};
   const kinds=Object.keys(M).filter(k=>M[k].unit&&!(t.MONSTER_BREEDS&&t.MONSTER_BREEDS.kinds[k]));info('sizes by kind: '+kinds.map(k=>k+' '+base(k).join('/')).join(', '));
   ok(base('bear').includes('hollow')&&base('boar').includes('small')&&base('wolf').includes('cave')&&base('dragon').join()==='great','a bear\'s a hollow, boars\' a small cave, wolves\' a cave, a dragon\'s a great cave');
   const seen=kinds.map(base).flat();ok(['hollow','small','cave','great'].every(k=>seen.includes(k)),'every size somewhere');
   const g=kinds.filter(k=>base(k).length>1);ok(g.length&&g.every(k=>base(k).length===2),'now and then one larger by its place ('+g.join(', ')+')');
   const s={id:'wolf',x:1234,y:567};ok(t.Interior.sizeOf(s)===t.Interior.sizeOf({...s}),'the same at the same place, every visit');
   ok(t.Interior.sizeOf(Object.assign(Object.create(t.Hideout.prototype),{id:'bear',x:1,y:1}))==='cave','a hideout: a cave, always')}
  // ---- each size's layout: its chambers, all reached from the mouth, the deepest the strongest's; a great cave's side chambers
  for(const k of Z.order){const S=t.FIELD_SIZES[Z[k].field],L=t.InteriorLayout.make('cave',12345,S.w,40,S.h-40,t.TERRAIN.cs,k),n=L.rooms.length,R=Z[k].rooms||X.cave.rooms,side=Z[k].side;
   ok(L.joined(t.TERRAIN.cs)&&n>=R[0]&&n<=R[1]+(side?side[1]:0)&&L.deep<n&&(!side||n-L.deep-1>=side[0]),
     Z[k].n+': '+n+' chamber'+(n>1?'s':'')+' on a '+S.w+'x'+S.h+' field, every one reached from the mouth'+(side?', '+(n-L.deep-1)+' off to the side':''))}
  // ---- fought: its field, how many go in, the foes in theirs (a hollow: its far side)
  for(const [id,want] of [['bear','hollow'],['dragon','great']]){Kit.world();t.B=null;
   const cave=Object.assign(Object.create(t.Cave.prototype),{i:9e5,type:'cave',id,x:P.x+60,y:P.y,tx:0,ty:0,seed:7,seen:true,cleared:false,back:0,name:'Test Hollow'});
   let k=t.Interior.sizeOf(cave);for(let i=0;k!==want&&i<400;i++){cave.x+=37;k=t.Interior.sizeOf(cave)}
   const men=t.Interior.menOf(cave),pick=t.Interior.pick(men);ok(t.Interior.count(pick)===Math.min(men,14)&&men===Z[want].men,Z[want].n+': '+t.Interior.count(pick)+' of your band go in (at most '+men+')');
   t.caveFight(cave,2,pick);t.act('fight');const b=B();
   const L=b&&b.interior,mine=b?b.units.filter(u=>u.team===0):[],foes=b?b.units.filter(u=>u.team===1):[];
   ok(b&&b.inside==='cave'&&b.fsize===Z[want].field&&L&&L.size===want,'fought inside, on its own field ('+(b&&b.fsize)+')');
   if(want==='hollow'){const m=L.rooms[0],mx=mine.reduce((a,u)=>a+u.x,0)/mine.length,fx=foes.reduce((a,u)=>a+u.x,0)/foes.length;ok(L.rooms.length===1&&fx>mx+40&&foes.every(u=>Math.hypot(u.x-m.x,u.y-m.y)<m.rx*1.2),'one chamber: you at its mouth side, the beasts at its far side ('+Math.round(fx-mx)+' px apart)')}
   else{const d=L.rooms[L.deep],big=foes.sort((a,c)=>c.max-a.max)[0];ok(L.rooms.length>=7&&Math.hypot(big.x-d.x,big.y-d.y)<d.rx*1.3,'a great cave: '+L.rooms.length+' chambers, the beast in the deepest')}
   if(b){b.over=true;t.B=null;t.fieldDone()}Kit.world()}
 }finally{X.on=on0;t.B=null}
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
