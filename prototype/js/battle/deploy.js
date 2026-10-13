'use strict';
/* ---------- before and around the fight: deployment and who commands your army.
   Deployment: a battle you fight opens frozen, your band in its zone (your side of the field, shaded). Place your groups there:
   right-click a spot, or right-drag a line (its width and facing), set formations and orders; the enemy stands where it will.
   Space (or Begin) starts the fight. Settings can switch deployment off.
   Command: by default your army does only what you order (every group holds where it stands, fighting what comes to it).
   The AI button (A) hands it to a captain who commands it as the enemy's does (commander.js); any order you give takes it back. ---------- */
// zone: the share of the field (from your edge) you deploy in
const DEPLOY={zone:.3};
const BDEPLOY={on:(()=>{try{return localStorage.getItem('ashmark.bdeploy')!=='0'}catch(e){return true}})()};
const BAUTO={on:(()=>{try{return localStorage.getItem('ashmark.bauto')==='1'}catch(e){return false}})()};
function setDeploy(on){BDEPLOY.on=!!on;try{localStorage.setItem('ashmark.bdeploy',BDEPLOY.on?'1':'0')}catch(e){}}
// the deployment zone (field px)
const deployZone=()=>({x0:8,x1:Math.round(BW*DEPLOY.zone),y0:18,y1:BH-6});
function deployInit(opts){B.deploy=!!(opts.deploy&&BDEPLOY.on&&!opts.tournament);B.auto=!opts.tournament&&BAUTO.on;if(B.deploy)log('Deploy your band: right-click or right-drag in the shaded zone, then Space to begin.')}
// keep a point in the zone
const inZone=(x,y)=>{const Z=deployZone();return{x:clamp(x,Z.x0,Z.x1),y:clamp(y,Z.y0,Z.y1)}};
// deploying, the groups just placed stand there at once (in the zone), not march
function deploySnap(gs){
  const Z=deployZone();for(const g of gs){const gr=B.groups[g];if(!gr)continue;const a=inZone(gr.ax,gr.ay);gr.ax=a.x;gr.ay=a.y;gr.order='hold';gr.tgt=null;gr.queue=[];
    for(const u of grpUnits(g)){u.x=clamp(gr.ax+(u.sx||0),Z.x0,Z.x1);u.y=clamp(gr.ay+(u.sy||0),Z.y0,Z.y1)}}
}
// the fight begins: the withdrawal point is where your band now stands
function beginFight(){if(!B||!B.deploy)return;B.deploy=false;exitInit(B.units);B.paused=false;battleSpeedUI();setOrderUI();log('The battle begins.')}
// the shaded zone and the word, while deploying (drawn on the field)
function drawDeploy(){
  if(!B.deploy)return;const Z=deployZone();ctx.fillStyle='rgba(74,122,192,.12)';ctx.fillRect(Z.x0,Z.y0,Z.x1-Z.x0,Z.y1-Z.y0);
  ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(111,168,224,.7)';ctx.lineWidth=1;ctx.strokeRect(Z.x0+.5,Z.y0+.5,Z.x1-Z.x0,Z.y1-Z.y0);ctx.restore();
}
// the AI in command of your army, on or off (remembered for the next battle)
function setAuto(on,quiet){
  if(!B)return;B.auto=!!on;BAUTO.on=B.auto;try{localStorage.setItem('ashmark.bauto',B.auto?'1':'0')}catch(e){}
  if(B.auto)for(const g of ['inf','arc','cav','hero'])if(B.groups[g]){B.groups[g].flanked=false;B.groups[g].t=0;B.groups[g].queue=[]}
  B.cmdT=0;autoUI();if(!quiet)log(B.auto?'The AI takes command of your army (A: take it back).':'You take command of your army.');
}
// an order of yours takes command back from the AI
function takeCommand(){if(B&&B.auto)setAuto(false)}
function autoUI(){const b=typeof document!=='undefined'&&document.getElementById('bAuto');if(!b||!B)return;b.classList.toggle('on',!!B.auto);b.setAttribute('aria-pressed',String(!!B.auto))}
