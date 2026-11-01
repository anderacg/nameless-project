'use strict';
// Not a test (run by name: -Suites visual/kitbalance -TimeoutSeconds 600): unit kits step 2 (doc/UNIT_KITS_DESIGN.md §10.2) and the
// spears against cavalry, AI on AI in the lab (morale on, 400 px apart, flat ground, seeds 1-6): Shield Men, Pikemen and Levies
// against Knights (a wedge) and Lancers, rank 2 (RANKS.ai), under step 1's rules (every switch off: their front always braced),
// step 2's (Brace a stance, the AI bracing by rule; Anti-cavalry, Anti-large) and step 2 never braced (the Brace stance taken from
// them). Per set: the spears' wins, the riders', unfinished (240 s); mean length; the winners standing; the riders' charges
// landed (morale.js chargeHit, at a charge's momentum) and those met braced (spearBraced: no bonus). The AI's brace timing:
// commander.js AI_TACTICS. Never fails.
window.RUN=()=>{const t=T,L=t.BattleLab,o=[],ch=window.chargeHit;let met=0,land=0;
 const SEEDS=[1,2,3,4,5,6],CAP=240,FIGHTS=[['Shield Men 16 v Knights 8',[{type:'hum_spear',count:16}],[{type:'hum_knight',count:8,form:'wedge'}]],
  ['Pikemen 16 v Knights 8',[{type:'hum_pike',count:16}],[{type:'hum_knight',count:8,form:'wedge'}]],['Levies 16 v Lancers 8',[{type:'hum_levy',count:16}],[{type:'hum_lancer',count:8,form:'wedge'}]]];
 const SETS=[['step 1',false,true],['step 2',true,true],['step 2, unbraced',true,false]];
 try{window.requestAnimationFrame=()=>0;t.act('begin','soldier');t.G.quietEvents=true;t.GUIDE.on=false;const who=t.STANCES.brace.who;window.chargeHit=(u,e)=>{if(u.s.charge&&t.momentum(u)>=t.CHARGE.min){land++;if(t.spearBraced(e,u))met++}return ch(u,e)};
  for(const [fight,left,right] of FIGHTS)for(const [name,on,brace] of SETS){let sw=0,rw=0,un=0;met=land=0;const len=[],stand=[];
   Kit.kits(on,()=>{t.STANCES.brace.who=brace?who:()=>false;try{
    for(const seed of SEEDS){t.G.mode='world';t.G.modal=false;L.start({leftGroups:left,rightGroups:right,morale:true,deploy:false,paused:true,ai:true,seed,distance:400,ground:'none'});
     let s=0;while(!L.session.result&&t.B.t<CAP&&s++<2000)L.step(60);const res=L.session.result,B=t.B;
     if(!res)un++;else{len.push(B.t);const l=/Left/.test(res);if(l)sw++;else rw++;stand.push(B.units.filter(u=>u.team===(l?0:1)&&u.hp>0&&!u.rout).length)}L.exit()}}finally{t.STANCES.brace.who=who}});
   const mean=len.length?len.reduce((a,b)=>a+b,0)/len.length:0;
   o.push('INFO '+fight.padEnd(26)+name.padEnd(18)+'spears '+sw+' / riders '+rw+' / unfinished '+un+'; mean '+mean.toFixed(0)+' s; winners standing '+(stand.length?(stand.reduce((a,b)=>a+b,0)/stand.length).toFixed(1):'-')+'; charges landed '+land+', met braced '+met)}
 }catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{if(L.active)L.exit();window.chargeHit=ch}
 const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
