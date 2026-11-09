'use strict';
// The shared rider posture reaches every mount, with fixed hips and native hand/weapon anchors.
Kit.suite(({ok,info})=>{const t=T;Kit.begin('soldier');const kinds=['hum_squire','elf_hart','dw_ram','orc_wolf','orc_warg'],original=window.drawMountedRider,calls=[];
 try{window.drawMountedRider=(...args)=>{calls.push({kind:args[1].mount,lean:args[6]});return original(...args)};
  for(const type of kinds){const L=t.lookOf(type,0,false,0),start=calls.length;for(const pose of [0,3,16])t.peopleSprite(L,pose);const c=calls.slice(start);
   ok(c.length===3&&c[0].lean===0&&c[1].lean>0&&c[2].lean>c[1].lean,L.mount+' uses an upright idle, light walking lean and stronger gallop lean');
  }
 }finally{window.drawMountedRider=original}
 for(const type of kinds){const L={...t.lookOf(type,0,false,0),weapon:null,held:null,shield:null,offShield:null},a=t.pgrid(80,60),b=t.pgrid(80,60),A=t.drawMountedRider(a,L,20,10,null,-1,0),B=t.drawMountedRider(b,L,20,10,null,-1,1),row=(g,y)=>g.p.slice(y*g.w,(y+1)*g.w),center=(g,y)=>{const xs=row(g,y).flatMap((c,x)=>c?[x]:[]);return xs.reduce((n,x)=>n+x,0)/xs.length};
  ok(center(b,14)>center(a,14)&&row(a,21).join()===row(b,21).join()&&B.hand[1]===A.hand[1],L.mount+' leans forward from fixed hips with its hand anchored on the same row');
 }
 for(const kind of ['horse','stag','ram','wolf','warg']){const L={...t.lookOf('hero',0,true,0),mount:kind};for(const pose of [0,3,16]){const c=t.peopleSprite(L,pose);ok(c.width>0&&c.height>0&&c.hand?.every(Number.isFinite),'hero on '+kind+' pose '+pose+' keeps valid body and weapon anchors')}}
 const ram=t.lookOf('dw_ram',0,false,0);let clearance=true;
 for(const walk of [-1,0,1,2,3,4,5,6,7]){const loose=t.pgrid(32,32),ridden=t.pgrid(32,32),seat=t.drawMount(loose,ram,walk),at=t.drawMount(ridden,{...ram,ridden:true},walk),changed=[];
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){const a=loose.p[y*32+x],b=ridden.p[y*32+x];if(a!==b){changed.push([x,y]);if(!a||!b||x<9||x>18||y<seat+5||y>seat+10)clearance=false}}
  if(!changed.length||seat!==at)clearance=false;
 }
 ok(clearance,'ram saddle clearance removes wool only under the rider in every gait, preserving silhouette and seat height');
 info('Shared mounted posture covers horse, stag, ram, wolf and warg; native gallop cycles remain species-specific.');
});
