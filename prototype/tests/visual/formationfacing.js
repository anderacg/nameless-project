'use strict';
window.RUN=()=>{try{
 T.begin('soldier');T.G.quietEvents=true;T.G.mode='world';T.G.modal=false;T.hidePanel();
 T.BattleLab.start({leftGroups:[{type:'hum_bow',count:10,name:'West battery'},{type:'hum_bow',count:10,name:'North battery'},{type:'hum_foot',count:8,name:'Scattered guard'}],rightGroups:[{type:'hum_foot',count:8}],deploy:false,paused:true,ai:false,morale:false,seed:42});
 const ids=T.playerGroups(),a=T.B.groups[ids[0]],b=T.B.groups[ids[1]],guard=T.B.groups[ids[2]];
 const slot=(g)=>T.grpUnits(g.id).forEach(u=>{u.x=g.ax+u.sx;u.y=g.ay+u.sy});
 a.placeAt(280,330);a.face=0;a.currentFacing=0;T.layForm(a.id);slot(a);T.grpUnits(a.id)[0].x+=180;T.grpUnits(a.id)[0].y+=90;
 b.placeAt(490,300);b.face=Math.PI/2;b.currentFacing=Math.PI/2;T.layForm(b.id);slot(b);
 guard.placeAt(330,500);guard.face=Math.PI;guard.currentFacing=Math.PI;T.layForm(guard.id);slot(guard);T.grpUnits(guard.id)[0].x+=180;T.grpUnits(guard.id)[0].y+=90;
 T.B.sel=[a.id,b.id];T.B.iconHov=null;T.drawBattle();T.setOrderUI();
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS duplicate archer formation coverage visual fixture';document.body.appendChild(d);
}catch(e){const d=document.createElement('pre');d.id='OUT';d.textContent='EXC '+e.stack;document.body.appendChild(d)}};
