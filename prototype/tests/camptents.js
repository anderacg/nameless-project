'use strict';
// A camp's tents are cloth (the owner, 2026-11-19: "make sure that the tents in camps look like a fabrics, or fabric material"):
// every tent style made of the camp's own models, of cloth, hide, poles, rope and pegs only (no chimney, no window, no stone,
// plaster, slate, tile or thatch); the cloth drawn as cloth (seams, folds, a hem: no courses, no speckle of stone); each tent's
// cell, anchor and foot on the land as before; the camp's service icons still standing over their tents.
Kit.suite(({ok,info})=>{
 const t=T,X=t.PX,W=t.W;Kit.begin('soldier',1);Kit.world();
 const ST=['ridge','bell','tepee','yurt','pavilion','leanto','pup','marquee','porch','hut'],SEEDS=[0,1,2,3,4,5,6,7,8,9,10,11];
 const MAT=/^(camp[CHS]\d+|timber|rope|hide|linen|iron)$/,BAD=/chimney|window|shutter|dormer|bell_?tower/i;
 const alpha=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data;
 // ---- the parts: tent models, cloth and poles only
 {let n=0;const bad=[],kinds=new Set(),mats=new Set();
  for(const st of ST)for(const sd of SEEDS)for(const [c,tr] of [['#d8ccb0','#b03a2a'],['#5a9a6a','#e8e0b0'],['#a07850','#7e2a26']]){
   const s=X.buildingModelSpec({type:'camp_'+st,seed:sd,env:'temperate',lv:X.campLv(c,tr,0)});n++;
   for(const p of s.parts){kinds.add(p.k);const m=p.wall||p.mat;if(m)mats.add(m);
    if(p.k==='chimney'||BAD.test(p.name||'')||m&&!MAT.test(m)||p.foot||p.frame||p.topMat&&!MAT.test(p.topMat)||p.name==='pole'&&p.u[1]-p.u[0]>1)bad.push(st+' '+sd+': '+p.k+' '+(p.name||'')+' '+(m||''))}
   for(const d of s.decals||[]){const k=d.kind||d.k||d.name||d[1];if(BAD.test(String(k)))bad.push(st+' '+sd+': decal '+k)}}
  info('parts: '+[...kinds].join(', ')+'; materials: '+[...mats].map(m=>m.replace(/\d+$/,'')).filter((m,i,a)=>a.indexOf(m)===i).join(', '));
  ok(n===ST.length*SEEDS.length*3&&!bad.length,'every tent ('+n+' made) of cloth, hide, poles, rope and pegs: no chimney, window, stone or roofing, its flag on a thin pole'+(bad.length?' ('+bad.slice(0,4).join('; ')+')':''))}
 // ---- the cloth: undyed cloth in the shade is its own colour deeper, never a cool slate grey
 {let op=0,cool=0;for(const st of ST)for(const sd of [0,5]){const m=X.buildingModel({type:'camp_'+st,seed:sd,env:'temperate',snow:0,lv:X.campLv('#d8ccb0','#b03a2a',0),detail:2}),d=alpha(m.img);
   for(let i=0;i<d.length;i+=4)if(d[i+3]>200){op++;if(d[i+2]>d[i]+4)cool++}}
  info('cool pixels '+cool+' of '+op);ok(op>2000&&cool<op*.03,'undyed cloth warm in the shade ('+(cool/op*100).toFixed(1)+'% of its pixels bluer than red), not slate')}
 // ---- the tents' cells and feet: as the camp lays them out
 {const camps=W.sites.filter(s=>s instanceof t.Encampment&&!s.cleared);let n=0;const bad=[];
  for(const s of camps){const L=s.layout(),clim=t.climAt?t.climAt(s.x,s.y):'temperate';
   L.forEach((q,i)=>{const p=s.tentPic(q,i,clim);if(!p)return;n++;const N=p.width;
    if(!((N===32||N===16)&&p.height===N&&p.ax===N/2&&p.ay===N))bad.push(s.TR.key+' '+i+': '+N+'x'+p.height+' at '+p.ax+','+p.ay)})}
  ok(n>0&&!bad.length,'every camp\'s tent ('+n+') in its cell (32 px, a pup 16), its foot at the cell\'s foot and middle'+(bad.length?' ('+bad.slice(0,3).join('; ')+')':''))}
 {const bad=[];for(const st of ST)for(const sd of [0,5]){const m=X.buildingModel({type:'camp_'+st,seed:sd,env:'temperate',snow:0,lv:X.campLv('#d8ccb0','#b03a2a',0)}),d=alpha(m.ground),N=m.cell;
   let lo=-1;for(let y=N-1;y>=0&&lo<0;y--)for(let x=0;x<N;x++)if(d[(y*N+x)*4+3]>0){lo=y;break}if(lo<N-4)bad.push(st+' '+sd+' '+lo)}
  ok(!bad.length,'every tent stands on its foot on the land (its ground at its cell\'s foot)'+(bad.length?' ('+bad.join('; ')+')':''))}
 // ---- the icons: each at a tent stands over that tent's cloth
 {const U=t.ENCAMP.icons.up,hs=[];let n=0;const bad=[];
  for(const s of W.sites.filter(s=>s instanceof t.Encampment&&!s.cleared)){const L=s.layout(),clim=t.climAt?t.climAt(s.x,s.y):'temperate';
   for(const k of t.CampSpots.keys(s)){const a=t.CampSpots.anchor(s,k);if(a.up!==U.tent)continue;const i=L.findIndex(q=>q.x===a.x&&q.y===a.y),p=i>=0&&s.tentPic(L[i],i,clim);if(!p)continue;n++;
    const d=alpha(p);let top=p.ay;for(let y=p.ay-1;y>=0;y--)for(let x=p.ax-2;x<=p.ax+2;x++)if(d[(y*p.width+x)*4+3]>0)top=Math.min(top,y);
    hs.push(p.ay-top);if(Math.abs(p.ay-top-U.tent)>10)bad.push(s.TR.key+' '+k+' '+s.look(i,L[i].s).style+' '+(p.ay-top))}}
  ok(n>0&&!bad.length,'each service icon at a tent ('+n+') stands over it, its stalk down onto its cloth: the tents under them '+Math.min(...hs)+' to '+Math.max(...hs)+' px tall, the icon '+U.tent+' px up'+(bad.length?' ('+bad.slice(0,3).join('; ')+')':''))}
});
