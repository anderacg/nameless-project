'use strict';
// The questbook on the world (doc/QUESTS_DESIGN.md §8, Q8): a story's "beat a band" is the band that troubles its holding (none:
// one out of its nearest hideout, never set beside the holding), its "hunt" the pack by its fields (none: one where such beasts
// live), a rescue's band one out of a hideout; and an entry's conditions may name the world near it: threat, news, short.
Kit.suite(({ok})=>{
 const t=T,P=t.P,G=t.G,W=t.W,TILE=t.TILE;Kit.begin('soldier',17);Kit.world();Kit.clear();
 const ash=t.townBy('Ashford'),tiles=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/TILE,C=t.Stories.ctx({town:'Ashford'});P.quests=[];
 const bandAt=(x,y,n)=>{const b=t.asParty({x,y,n,kind:'bandits',list:t.makeEnemies(n,false,'bandits'),t:0,a:0,idle:true,cool:99,ld:t.newChief('bandits',2)});t.bandits.push(b);return b};
 // ======== beat a band
 {const b=bandAt(ash.x+200,ash.y,5),n0=t.bandits.length,q=t.Quest.make('band',ash,null,{band:'Red Vipers'});q.accept();
  ok(b.qid===q.id&&t.bandits.length===n0&&b.name==='Red Vipers','a band in its lands: that band, called the Red Vipers, none made')}
 {Kit.clear();P.quests=[];const L=t.Troubles.lairs(ash)[0],q=t.Quest.make('band',ash,null,{band:'Red Vipers'}),took=q.accept(),b=t.bandits.find(x=>x.qid===q.id);
  if(L)ok(took&&b&&tiles(b,L)<2,'none: one out of the '+L.name+' ('+Math.round(tiles(b||L,ash))+' tiles from Ashford), not beside it');else ok(!took,'none and no hideout: not begun')}
 // ======== hunt beasts
 {Kit.clear();P.quests=[];const id=Object.keys(t.MONSTERS).find(k=>!t.MONSTERS[k].mythic);const m=t.asMonster({id,x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:2,n:3,t:0,a:0,cool:0});W.monsters.push(m);
  const n0=W.monsters.length,q=t.Quest.make('beasts',ash,null,{});q.accept();ok(m.qid===q.id&&W.monsters.length===n0,'a pack by its fields: that pack, none made');
  Kit.clear();P.quests=[];const q2=t.Quest.make('beasts',ash,null,{});if(q2.accept()){const m2=W.monsters.find(x=>x.qid===q2.id),M=t.MONSTERS[m2.id];ok(M.where.some(w=>t.habitatAt(m2.hx,m2.hy).includes(w)),'none: one where such beasts live ('+t.habitatAt(m2.hx,m2.hy).join('/')+')')}else ok(true,'(no habitat near)')}
 // ======== conditions on the world
 {Kit.clear();const S=t.Stories,lairs=t.Troubles.lairs(ash).length>0;ok(S.holds({threat:'band'},C)===lairs,'threat band: a band there, or a hideout to come out of ('+lairs+')');
  ok(!S.holds({threat:'beast'},C),'threat beast: none by the fields');W.monsters.push(t.asMonster({id:Object.keys(t.MONSTERS)[0],x:ash.x+150,y:ash.y,hx:ash.x+150,hy:ash.y,lv:1,n:2,t:0,a:0,cool:0}));ok(S.holds({threat:'beast'},C),'a pack by them: true');
  ok(!S.holds({news:'caravan'},C),'news: none yet');t.newsRecord('caravan',{x:ash.x+100,y:ash.y},{from:'Ashford'});ok(S.holds({news:'caravan'},C),'a caravan robbed near: true');
  const g=t.Troubles.short(ash)[0];ok(!g||S.holds({short:g},C),'short: what it is short of ('+g+')')}
 P.quests=[];Kit.clear();
 ok(!ERR.length,'no runtime errors'+(ERR.length?': '+ERR[0]:''));
});
