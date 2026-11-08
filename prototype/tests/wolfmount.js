'use strict';
// Approved wolf under riders: saddle attachment, mutable grids and fallen mounts.
Kit.suite(({ok,info})=>{const t=T,PX=t.PX;Kit.begin('soldier');
 const raw=g=>g.p.join('|'),pal=kind=>({C:t.pal(kind),M:t.pal('wool')}),kinds=['wolf','warg'];
 const poses=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27];
 for(const kind of kinds){
  const P=pal(kind),stand=PX.mountArt(kind,-1,P),walk=Array.from({length:4},(_,i)=>PX.mountArt(kind,i,P)),run=Array.from({length:4},(_,i)=>PX.mountArt(kind,i+4,P));
  ok(stand.g.w===32&&stand.g.h===32&&stand.seat>=18&&stand.seat<=23,kind+' uses the new 32px wolf mount with its saddle on the back');
  ok(new Set(walk.map(a=>raw(a.g))).size>=3&&new Set(run.map(a=>raw(a.g))).size>=3,kind+' has distinct walking and running poses');
  ok([stand,...walk,...run].every(a=>Array.from({length:6},(_,i)=>a.g.p[a.seat*32+11+i]).some(Boolean)),kind+' rider seat always touches the back');
  const untouched=raw(stand.g);stand.g.p.fill('#ff0000');ok(raw(PX.mountArt(kind,-1,P).g)===untouched,kind+' saddle/barding edits cannot leak into another rider');
  const side=PX.mountArt(kind,0,P,true),belly=PX.mountArt(kind,0,P,'belly');ok(side.g.h===21&&belly.g.h===21&&raw(side.g)!==raw(belly.g),kind+' uses separate authored side and belly fallen poses');
 }
 ok(raw(PX.mountArt('wolf',0,pal('wolf')).g)!==raw(PX.mountArt('warg',0,pal('warg')).g),'wargs keep their darker coat');
 const units=['orc_wolf','orc_wolfbow','orc_warg'];let count=0,bad=[];
 for(const type of units)for(const team of [0,1])for(const pose of poses){const s=t.unitSprite(type,team,false,0,pose);count++;if(!s.hand||!s.ch||s.width!==s.height)bad.push(type+' '+pose);}
 info(count+' rider sprites: infantry rider, archer and warg raider on both sides');ok(!bad.length,'all mounted actions retain their rider/weapon anchors'+(bad.length?': '+bad.join(', '):''));
 const g=t.pgrid(32,32),L=t.lookOf('orc_wolf',0,false,0);t.drawMount(g,{...L,saddled:true},-1);const down=t.mountDown(L,'side'),belly=t.mountDown(L,'belly');
 ok(g.p.some(Boolean)&&down.width===32&&down.height===22&&belly.width===32&&belly.height===22,'unridden and fallen wolves use the approved mount through production drawing');
});
