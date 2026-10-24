'use strict';
// Real battle HUD and shared character/troop line: &w=844&h=390&scene=ghost|placed|keys.
window.RUN=()=>{
 const t=T,q=new URLSearchParams(location.search),scene=q.get('scene')||'placed';window.requestAnimationFrame=()=>0;
 const size=()=>{if(q.get('w')){const s=document.getElementById('screen').style;s.width=q.get('w')+'px';s.height=q.get('h')+'px'}};size();addEventListener('resize',size);
 t.GUIDE.on=false;t.BattleLab.start({leftGroups:[{type:'hum_foot',count:8,name:'Guard'},{type:'hero',count:1},{type:'hum_bow',count:6,name:'Archers'},{type:'brann',count:1}],rightGroups:[{type:'hum_foot',count:10}],deploy:true,paused:true,ai:false,morale:false,seed:42});
 const b=t.B,ids=t.playerGroups();b.sel=[ids[0],ids[2]];t.ctrlGroup('3',true);b.sel='hero';t.ctrlGroup('4',true);
 if(scene==='keys')for(const k of '567890')t.ctrlGroup(k,true);
 b.sel='all';const z=t.deployZone(),x=(z.x0+z.x1)/2,y0=z.y0+25,y1=z.y1-25;t.formDragTo(x,y0,x,y1);
 if(scene==='ghost')b.rdrag={x0:x+40,y0:y0+25,x1:x+40,y1:y1-25};
 t.G.msgs=[];t.setOrderUI();t.frame();document.getElementById('dev-lab-bar').hidden=true;
 const d=document.createElement('pre');d.id='OUT';d.hidden=true;d.textContent='PASS battle line and effective-key cards '+scene;document.body.appendChild(d);
};
