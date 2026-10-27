'use strict';
// The battle HUD on a quick start (ui/battlehud.js #bbar; battle/setup.js measureField, present; render.js frame): a battle started
// from an encounter, in steps as in the game (LOADING.sync off), with deployment off, with the AI commanding and with deployment
// on. The HUD is laid out unseen while the field is measured; from the moment it shows (watched as it changes, before the
// browser paints) it is complete: the battle drawn under it and the map's own HUD away, a card for every group filled in, the
// buttons' icons, the numbers of this battle, its field, the speed, pause and AI buttons, the details; and it stays so frame
// after frame. Started in one go (LOADING.sync, as every other suite), it shows at once, as before.
window.RUN=async()=>{const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m),info=m=>o.push('INFO '+m),t=T,G=t.G,P=t.P,ev=s=>(0,eval)(s);
const bar=document.getElementById('bbar'),q=s=>bar.querySelector(s),qa=s=>[...bar.querySelectorAll(s)],next=()=>new Promise(r=>requestAnimationFrame(()=>r()));
// (what is wrong with the HUD as it stands: nothing if it is hidden or complete)
const wrong=()=>{if(bar.hidden)return [];const B=t.B,w=[],gs=B?['all',...t.playerGroups()]:[],cards=qa('.bcards .ucard'),sc=document.getElementById('screen');
 if(!B||G.mode!=='battle')w.push('shown with no battle ('+G.mode+')');if(!B)return w;
 if(sc&&sc.dataset.mode!=='battle')w.push('over the map\'s own HUD (screen '+sc.dataset.mode+')');
 if(t.cv.width!==t.BVW||t.cv.height!==t.BVH)w.push('over the map\'s picture (canvas '+t.cv.width+'x'+t.cv.height+')');
 if(cards.map(c=>c.dataset.grp).join()!==gs.join())w.push('cards '+cards.map(c=>c.dataset.grp).join()+' for '+gs.join());
 if(cards.some(c=>!c.querySelector('.ubars .ub')||!c.title))w.push('a card not filled in');
 if(qa('.obtn[data-order],.obtn[data-flag],.obtn[data-form]').some(b=>!b.querySelector('svg')))w.push('a button with no icon');
 const live=k=>B.units.filter(u=>u.team===k&&u.hp>0).length;if(q('#bMine').textContent!==String(live(0))||q('#bFoe').textContent!==String(live(1)))w.push('numbers '+q('#bMine').textContent+'/'+q('#bFoe').textContent+' for '+live(0)+'/'+live(1));
 if(q('#bField').textContent!==B.env.name)w.push('field "'+q('#bField').textContent+'"');
 // (a battle opens ready, paused for Start Battle (f8cfe32); forming up first, as armies walk to their places (c0ba7c6))
 const st=q('#bStatus').textContent,want=B.over?null:B.muster?.active?/^(Forming up|Preparation paused)/:B.ready?/^Ready · Start Battle/:B.deploy?/Deploy/:null;
 if(want?!want.test(st):/Deploy|Ready/.test(st))w.push('status "'+st+'"');
 if(q('#bPause').textContent!==(!B.over&&(B.ready||B.deploy)?'▶ Start':B.paused?'▶ Play':'⏸ Pause'))w.push('pause "'+q('#bPause').textContent+'"');
 if(qa('[data-bspeed]').filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>+b.dataset.bspeed).join()!==String(B.speed))w.push('speed buttons');
 if(q('#bAuto').classList.contains('on')!==t.aiAll())w.push('AI button');
 if(!q('#bInfo').textContent.trim())w.push('no details');return w};
const close=()=>{ev('B=null');t.fieldDone();G.mode='world';G.modal=false;t.hidePanel();t.bbar.hidden=true};
const sync0=t.LOADING.sync,sw=ev('[TERRAIN.on,FOG.on,EXITS.on,FIELD_SIZES.on,BDEPLOY.on,BAUTO.on]');
try{
 t.act('begin','soldier');G.quietEvents=true;t.GUIDE.on=false;G.encCool=1e9;
 ev('TERRAIN.on=true;FOG.on=true;EXITS.on=true;FIELD_SIZES.on=true');
 const enc=()=>{close();P.troops={hum_levy:6,hum_bow:4};t.startEncounter({kind:'party',ref:t.asParty({x:P.x,y:P.y,cool:0,troops:['militia','militia','militia']}),n:3,list:['militia','militia','militia']})};
 for(const [name,deploy,ai] of [['deployment off',false,false],['the AI commanding',false,true],['deployment on',true,false]]){
  ev('BDEPLOY.on='+deploy+';BAUTO.on='+ai);t.LOADING.sync=false;enc();
  let shown=null,bad=[],frames=0;const seen=new MutationObserver(()=>{const w=wrong();if(!bar.hidden&&shown==null)shown={w,mode:G.mode};if(w.length)bad.push(w.join('; '))});
  seen.observe(bar,{attributes:true,attributeFilter:['hidden']});
  try{t.act('fight');for(let i=0;i<240&&!(t.B&&G.mode==='battle'&&!bar.hidden);i++){const w=wrong();if(w.length)bad.push(w.join('; '));await next();frames++}
   const start=frames;for(let i=0;i<20;i++){await next();frames++;const w=wrong();if(w.length)bad.push(w.join('; '))}
   ok(shown&&!shown.w.length&&!bad.length&&!bar.hidden&&frames>start,name+': hidden while the field is made ('+start+' frames), complete from the moment it shows'+(t.B&&t.B.deploy?' (deploying, ready: ▶ Start)':t.B&&t.B.ready?' (ready: ▶ Start)':'')+(ai?' (AI lit)':'')+' and for 20 frames after'+(shown&&shown.w.length?': at first '+shown.w.join('; '):'')+(bad.length?': '+[...new Set(bad)].slice(0,3).join(' | '):''))}
  finally{seen.disconnect();t.LOADING.sync=sync0}}
 // ---- in one go (LOADING.sync): shown at once, complete, as before
 ev('BDEPLOY.on=false;BAUTO.on=false');enc();t.act('fight');{const w=wrong().filter(x=>!/canvas|screen/.test(x));ok(!bar.hidden&&G.mode==='battle'&&!w.length,'started in one go (the tests\' way): shown at once, complete'+(w.length?': '+w.join('; '):''))}
}catch(e){o.push('EXC '+e.message+' '+e.stack)}finally{t.LOADING.sync=sync0;ev('[TERRAIN.on,FOG.on,EXITS.on,FIELD_SIZES.on,BDEPLOY.on,BAUTO.on]=['+sw.join()+']');try{close()}catch(e){}}
const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d);
};
