'use strict';
// Your camp's people (the owner, 2026-11-28: "recheck the player camps sprites whether one man vs many people in army sprite make
// sense"): alone, you alone by your fire and one lean-to; a band, you and a few of yours; an army, more of them and more tents,
// never a crowd; the first round the fire, the rest by their tents; by night only the watch; none before the fire burns, none
// while a fight has them, nor you while you stay in a holding.
Kit.suite(({ok,info})=>{
 const t=T,P=t.P,G=t.G,C=t.CampSite,F=t.CAMP_SITE.folk;Kit.begin('soldier',1);Kit.clear();Kit.world();
 const [x,y]=Kit.field(t.TOWNS[0]);
 const camp=(troops,lv)=>{if(P.camp){P.camp=null;C.strike('you')}Kit.goTo(x,y);P.troops=troops;P.level=lv||1;for(let i=0;i<6;i++)t.updateWorld(1/30);t.drawWorld();t.pitchCamp();C.t0.set('you',-1e6);
  const c=C.yours(P.x,P.y),L=C.layoutOf(c);return{c,L,who:C.folkOf(c,L)}};
 const day=fn=>{const k=window.darkness;window.darkness=()=>0;try{return fn()}finally{window.darkness=k}},night=fn=>{const k=window.darkness;window.darkness=()=>1;try{return fn()}finally{window.darkness=k}};
 const rows=[];
 day(()=>{
  // ---- alone
  {const {c,L,who}=camp({});rows.push('alone: '+L.length+' tent, '+who.length+' up');
   ok(C.humble()&&L.length===1&&who.length===1&&who[0].type==='hero'&&Math.hypot(who[0].x-c.x,(who[0].y-c.y)/t.CAMP_SITE.squash)<=F.seat+1,'alone: one makeshift tent, and you alone by your fire')}
  // ---- a band and an army: more tents, more of yours about, never more than the most
  {const a=camp({hum_levy:12}),b=camp({hum_levy:40,hum_foot:20},6),d=camp({hum_levy:100,hum_foot:60,hum_knight:40},9);
   rows.push('12 men: '+a.L.length+' tents, '+a.who.length+' up','60 men: '+b.L.length+' tents, '+b.who.length+' up','200 men: '+d.L.length+' tents, '+d.who.length+' up');
   ok(a.who.length===1+Math.ceil(12/F.per)&&b.who.length===1+F.most&&d.who.length===1+F.most&&a.L.length<b.L.length&&b.L.length<d.L.length,'a band shows you and a man for every '+F.per+' of yours, an army '+F.most+' at most, its tents more with its men ('+[a,b,d].map(z=>z.L.length+' tents/'+z.who.length+' up').join(', ')+')');
   const seats=d.who.slice(0,F.seats),rest=d.who.slice(F.seats);
   ok(seats.every(u=>Math.hypot(u.x-d.c.x,(u.y-d.c.y)/t.CAMP_SITE.squash)<=F.seat+1)&&rest.length>0&&rest.every(u=>d.L.some(q=>Math.abs(u.x-q.x)<=F.door[0]&&u.y-q.y===F.door[1])),'the first '+F.seats+' stand round the fire, the rest each by a tent\'s door');
   ok(d.who[0].type==='hero'&&d.who.every(u=>u.campMan&&!u.walking)&&new Set(d.who.map(u=>u.x+','+u.y)).size===d.who.length&&C.folkOf(d.c,d.L)===d.who,'each stands in his own place, kept from frame to frame');
   // ---- on the frame: an entry a man, drawn
   const ents=[];C.draw(ents,{x:P.x-200,y:P.y-100},d.c);const mine=ents.filter(e=>e.own),bad=ents.filter(e=>Object.keys(e).some(k=>!(k in t.WORLD_ENT)));
   let err='';try{for(let i=0;i<3;i++)t.drawWorld()}catch(e){err=e.message}
   ok(mine.length===d.who.length&&!bad.length&&!err,'the camp puts each of them on the map\'s list ('+mine.length+'), and the map draws'+(err?' ('+err+')':''));
   // ---- not you while you stay in a holding; none while a fight has them
   const away=C.folkOf({...d.c,heroAway:true,key:'zz1'},d.L),none=C.folkOf({...d.c,folk:false,key:'zz2'},d.L);C.men.delete('zz1');C.men.delete('zz2');
   ok(away.length===F.most&&away.every(u=>u.type!=='hero')&&!none.length,'while you stay in a holding your men are by the fire without you; a camp a fight caught shows none (they are on the field)');
   // ---- none before the fire burns
   C.t0.set('you',performance.now()/1000);const e2=[];C.draw(e2,{x:P.x-200,y:P.y-100},d.c);C.t0.set('you',-1e6);
   ok(!e2.some(e=>e.own),'while the camp goes up none stands in it yet (your men stand by, as marchers)')}});
 // ---- by night: the watch
 night(()=>{const d=camp({hum_levy:100,hum_foot:60},9);rows.push('200 men by night: '+d.who.length+' up');
  ok(d.who.length===1+Math.ceil(F.most/F.watch),'by night only the watch is up: you and '+Math.ceil(F.most/F.watch)+' of '+F.most)});
 info(rows.join('; '));
 // ---- off
 {F.on=false;try{const d=day(()=>camp({hum_levy:12}));ok(!d.who.length,'CAMP_SITE.folk.on false: an empty camp, as before')}finally{F.on=true}}
});
