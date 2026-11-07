'use strict';
// Bows aimed up and down (the owner, 2026-11-07: "make bows aim up and down too; long target or shooting to higher, arrows will lob;
// short target and shooting from higher, the arrow will be straight"): an arrow's rise (battle/projectiles.js arcRise) grows with
// the distance and with the height its mark stands above the shooter, and falls as he stands above it; a bowman's bow, drawn apart
// in battle (figures.js bowPic), is raised to the shot's own angle (render.js bowAim), level for a near shot.
Kit.suite(({ok,info})=>{
 const t=T;Kit.begin('soldier',1);
 const near=t.arcRise(60),far=t.arcRise(320),up=t.arcRise(200,-28),flat=t.arcRise(200,0),down=t.arcRise(200,28);
 ok(near<far&&up>flat&&flat>down&&down>=t.ARC_RISE.min,'an arrow lobs higher the farther its mark ('+near.toFixed(1)+' → '+far.toFixed(1)+' px) and the higher it stands ('+down.toFixed(1)+' from above, '+flat.toFixed(1)+' level, '+up.toFixed(1)+' up to it)');
 // (the bowman's aim: his mark near, far, up a hill)
 const u={x:0,y:0,tgt:null},aim=(d)=>{u.tgt={x:d,y:0,hp:1};return t.bowAim(u)};
 const a0=aim(40),a1=aim(150),a2=aim(450);info('aim at 40, 150, 450 px: '+a0+'°, '+a1+'°, '+a2+'°');
 const hu=(dh)=>{u.tgt={x:200,y:0,hp:1};const L=t.levelAt;window.levelAt=(x,y)=>x>100?dh:0;try{return t.bowAim(u)}finally{window.levelAt=L}},hi=hu(4),lo=hu(-4);info('at 200 px, its mark 4 levels up '+hi+'°, 4 down '+lo+'°');
 ok(a0<a1&&a1<=a2&&a2===45&&hi>lo&&t.BOW_AIM.steps.includes(a2),'a near mark aimed low, a farther one higher, a far one at 45°; a mark up a hill higher, one below flatter');
 // (and the arrow flies so: Missile.fire's height, its landing's ground below him or above him)
 {const L=t.levelAt;window.__B0=t.B;(0,eval)('B={arrows:[]}');const u={x:0,y:0,team:0},H=dh=>{window.levelAt=(x,y)=>x>100?dh:0;try{t.B.arrows.length=0;t.Missile.fire(u,0,1,{},200,{exact:true});return t.B.arrows[0].H}finally{window.levelAt=L}};
  try{const up=H(4),lv=H(0),dn=H(-4);ok(up>lv&&lv>dn,'an arrow loosed lobs higher up to a mark on higher ground ('+up.toFixed(1)+' px), level '+lv.toFixed(1)+', flatter down to one below ('+dn.toFixed(1)+')')}finally{(0,eval)('B=window.__B0');delete window.__B0}}
 // (each angle its own picture, the bow, string and arrow whole: every pixel touching another by an edge)
 const pics=t.BOW_AIM.steps.map(d=>t.bowPic('bow','thrust',1,d,'#f3bfad')),px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,W=c.width,on=(x,y)=>x>=0&&y>=0&&x<W&&y<c.height&&d[(y*W+x)*4+3]>0;
   let n=0,lone=0;for(let y=0;y<c.height;y++)for(let x=0;x<W;x++)if(on(x,y)){n++;if(!on(x-1,y)&&!on(x+1,y)&&!on(x,y-1)&&!on(x,y+1))lone++}return{n,lone,s:Array.from(d).join()}};
 const P=pics.map(px);ok(new Set(P.map(p=>p.s)).size===P.length&&P.every(p=>p.n>12&&p.lone<=2),'each aim its own bow, drawn whole ('+P.map(p=>p.n+'/'+p.lone).join(', ')+' px/loose)');
 // (in battle the body is drawn without it: the same figure, its bow apart)
 const b=t.unitSprite('hum_bow',0,false,0,10,'bow'),w=t.unitSprite('hum_bow',0,false,0,10,true);ok(b!==w&&!!b.hand,'a bowman\'s battle body drawn with his bow apart, his hand there to hold it');
});
