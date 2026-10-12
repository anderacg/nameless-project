'use strict';
// Weapon attack patterns: each weapon family's combo, the shape of each blow (sweep, thrust, slam, spin, twin) as its hitbox,
// thrusts piercing a line, sweeps covering a wide arc but not a long reach, troop blows by weapon, and the matching poses.
window.RUN=()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);
try{
 const t=T,G=t.G,P=t.P,gid=t.gearId;try{localStorage.clear()}catch(e){}
 t.act('begin','soldier');P.troops={};P.comps={};G.mouse.in=false;
 const at=(dx,dy)=>({x:100+dx,y:100+dy,s:{big:false}});
 // the shapes, from a hero at (100,100) aiming right with reach 30
 const sw=t.COMBO[0],th=t.COMBOS.thrust[0],sl=t.COMBOS.hammer[0],sp=t.COMBOS.heavy[2],tw=t.COMBOS.dual[2];
 ok(sw.shape==='arc'&&th.shape==='thrust'&&sl.shape==='slam'&&sp.shape==='spin'&&tw.shape==='twin','sword sweeps, spear thrusts, hammer slams, greatsword spins, twin blades strike in a V');
 const inS=(c,dx,dy,R)=>t.inShape(100,100,0,R||30,c,at(dx,dy));
 ok(inS(sw,20,14)&&!inS(th,20,14),'a sweep catches a foe off to the side that a thrust misses');
 ok(inS(th,33,2)&&inS(th,15,-3)&&!inS(th,10,12),'a thrust reaches straight ahead along a narrow line');
 ok(!inS(sw,-20,0)&&inS(sp,-20,0),'only a spin hits behind you');
 ok(inS(sl,18,8)&&!inS(sl,2,-14),'a slam hits a patch of ground ahead');
 ok(inS(tw,28,8)&&inS(tw,28,-8)&&!inS(tw,10,14),'twin strikes thrust left and right of the aim');
 // which combo each weapon brings
 const use=(w,off)=>{P.gear.weapon=w;P.gear.offhand=off||null;return t.heroCombo()};
 const pat=c=>c.map(x=>x.shape).join(',');
 const sword=pat(use(gid('sword',1))),spear=pat(use(gid('spear',1))),phal=pat(use(gid('spear',1),gid('shield',1))),ham=pat(use(gid('warhammer',1))),gs=pat(use(gid('greatsword',1))),dg=pat(use(gid('dagger',1))),ax=pat(use(gid('axe',1)));
 ok(sword.split(',').filter(x=>x==='arc').length===2&&sword.includes('thrust'),'sword: two sweeps and one riposte ('+sword+')');
 ok(spear.split(',').filter(x=>x==='thrust').length===2&&t.COMBOS.thrust[1].arc<.8,'spear: thrusts and one narrow sweep ('+spear+')');
 ok(phal==='thrust,thrust,thrust','spear and shield: jabs and a drive ('+phal+')');
 ok(ham.startsWith('slam')&&gs.endsWith('spin')&&dg.startsWith('thrust')&&ax.startsWith('slam'),'hammer '+ham+' · greatsword '+gs+' · dagger '+dg+' · axe '+ax);
 // in battle: a thrust pierces a line of enemies; a sweep hits those around but not one behind another
 const battle=enemies=>{P.hp=P.sp=P.mp=null;G.mode='world';G.modal=false;t.hidePanel();G.enc={kind:'party',ref:{cool:0},list:enemies.slice()};t.startBattle({enemies,tournament:false});const B=t.B;B.aim=0;B.units.filter(u=>u.team===0&&!u.hero).forEach(u=>{u.x=10;u.y=30});return B};
 use(gid('spear',2));let B=battle(['chief','chief','chief']);let h=B.hero,es=B.units.filter(u=>u.team===1);es.forEach((u,i)=>{u.x=h.x+12+i*12;u.y=h.y;u.cd=9;u.hp=u.max=999});
 t.swing();ok(es.filter(u=>u.hp<u.max).length>=2,'a spear thrust pierces '+es.filter(u=>u.hp<u.max).length+' enemies in a line');
 ok(B.slashes.some(s=>s.kind==='thrust'),'and leaves a darting streak');ok(h.atkStyle==='thrust','the hero shows a thrust');
 B.over=true;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 use(gid('sword',2));B=battle(['chief','chief']);h=B.hero;es=B.units.filter(u=>u.team===1);es[0].x=h.x+14;es[0].y=h.y+12;es[1].x=h.x+14;es[1].y=h.y-12;es.forEach(u=>{u.cd=9;u.hp=u.max=999});
 t.swing();ok(es.every(u=>u.hp<u.max),'a sword slash sweeps across two enemies side by side');ok(B.slashes.some(s=>s.kind==='arc')&&h.atkStyle==='swing','with a sweeping crescent and a swing');
 B.over=true;t.updateBattle(.01);t.act('cont');while(G.mode==='perk')t.act('perk',G.perkOffer[0]);
 // troops: spearmen pierce to the one behind; beasts claw
 P.gear.weapon=gid('sword',0);B=battle(['militia','militia']);const sm={...t.ST.spearman},u={x:100,y:100,s:sm,team:0,type:'spearman',hp:30,max:30,face:1},a1=B.units.filter(x=>x.team===1);
 a1[0].x=114;a1[0].y=100;a1[1].x=126;a1[1].y=100;a1.forEach(x=>x.hp=x.max=999);t.meleeFollow(u,a1[0],10);ok(a1[1].hp<a1[1].max&&B.slashes.some(s=>s.kind==='thrust'),'a spearman’s thrust carries on into the enemy behind');
 const bear={x:100,y:100,s:{...t.ST.bear},team:0,type:'bear',face:1};t.meleeFollow(bear,a1[0],5);ok(B.slashes.some(s=>s.kind==='claw'),'beasts leave claw marks');
 ok(t.troopStyle({s:t.ST.spearman,type:'spearman',atkN:1})==='thrust'&&t.troopStyle({s:t.ST.chief,type:'chief',atkN:1})==='overhead','spearmen thrust, chieftains chop from above');
 // poses: a swing, a thrust and an overhead blow look different
 const px=c=>{const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hh=0;for(let i=0;i<d.length;i+=4)hh=(hh*31+d[i]+d[i+1]*3+d[i+2]*7+d[i+3])|0;return hh};
 ok(new Set([7,10,13].map(p=>px(t.unitSprite('militia',0,false,0,p)))).size===3,'swing, thrust and overhead strikes are drawn differently');
 B.over=true;t.updateBattle(.01);t.act('cont');t.frame();
}catch(e){o.push('EXC '+e.message+' '+e.stack)}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
