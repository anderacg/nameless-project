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
 info('Shared mounted posture covers horse, stag, ram, wolf and warg; native gallop cycles remain species-specific.');
});
