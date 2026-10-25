'use strict';
/* ---------- before and around the fight: deployment and who commands your army.
   Deployment: a battle you fight opens frozen, your band in its zone (your side of the field, shaded). Place your groups there:
   right-click a spot, or right-drag a line (its width and facing), set formations and orders; the enemy stands where it will.
   Space (or Begin) starts the fight. Settings can switch deployment off.
   Command: by default your army does only what you order (every group holds where it stands, fighting what comes to it).
   The AI button (A) hands groups to a captain who commands them as the enemy's does (commander.js): the selected groups (each its
   own flag, g.aiCmd, this battle only), or with nothing selected the whole army (B.auto, kept for the next battle: BAUTO); A again
   on groups the AI has takes them back, and any order you give a group takes that group back. The captain orders only the groups
   it has; yours under your own hands are friends it fights beside (its reading of the battle counts them: commander.js assess),
   never its to order. ---------- */
// zone: the share of the field (from your edge) you deploy in
const DEPLOY={zone:.3};
// deployment on or off (Settings); BDEPLOY, AUTOSK and BAUTO are views over the settings table (PREFS, ui.js)
const BDEPLOY=prefView('bdeploy');
// your characters' skills and special moves on their own (Auto skills, K): on, they use them when the moment is right; off, never
const AUTOSK=prefView('autoskills');
function setAutoSkills(on){prefSet('autoskills',on);if(B)toast('Auto skills '+(AUTOSK.on?'on: your hero and companions use their skills when the moment is right.':'off: your hero and companions use no skills.'))}
// the AI in command of your army, kept for the next battle (setAuto)
const BAUTO=prefView('bauto');
function setDeploy(on){prefSet('bdeploy',on)}
// the deployment zone (field px): your side's (setup.js fieldZone: on a sized field with open ground behind it); holding a bridge,
// on to the bank (B.dzone: setup.js arrangeType)
const deployZone=()=>{const Z=fieldZone(0);if(B&&B.dzone)Z.x1=Math.max(Z.x0+FORMS.line.gx*2,B.dzone.x1);return Z};
function deployInit(opts){B.deploy=!!(opts.deploy&&(opts.sandbox||BDEPLOY.on)&&!opts.tournament);B.auto=!opts.tournament&&BAUTO.on;if(B.deploy&&GUIDE.on)toast('Deploy your band: right-click or right-drag in the shaded zone, then Space to begin.')}
// keep a point in the zone
const inZone=(x,y)=>{const Z=deployZone();return{x:clamp(x,Z.x0,Z.x1),y:clamp(y,Z.y0,Z.y1)}};
// deploying, the groups just placed stand there at once (in the zone), not march
function deploySnap(gs){
  const Z=deployZone();for(const g of gs){const gr=B.groups[g];if(!gr)continue;const a=inZone(gr.ax,gr.ay);gr.placeAt(a.x,a.y);gr.currentFacing=gr.face;
    for(const u of grpUnits(g)){u.x=clamp(gr.ax+(u.sx||0),Z.x0,Z.x1);u.y=clamp(gr.ay+(u.sy||0),Z.y0,Z.y1)}}
}
// the fight begins (the withdrawal edge is your side of the field)
function beginFight(){if(!B||!B.deploy)return;B.deploy=false;exitInit(B.units);B.paused=!!(B.opts.sandbox&&B.opts.pauseAfterDeploy);battleSpeedUI();setOrderUI();toast('The battle begins.')}
// the shaded zone and the word, while deploying (drawn on the field)
function drawDeploy(){
  if(!B.deploy)return;const Z=deployZone();ctx.fillStyle='rgba(74,122,192,.12)';ctx.fillRect(Z.x0,Z.y0,Z.x1-Z.x0,Z.y1-Z.y0);
  ctx.save();ctx.setLineDash([4,3]);ctx.strokeStyle='rgba(111,168,224,.7)';ctx.lineWidth=1;ctx.strokeRect(Z.x0+.5,Z.y0+.5,Z.x1-Z.x0,Z.y1-Z.y0);ctx.restore();
}
// your groups in the AI's hands: the whole army (B.auto) or each its own (g.aiCmd); aiAll: every one of them (the commander's
// powers then the AI's too: commandpowers.js), aiAny: any (your captain thinks: commander.js command)
const aiHas=g=>!!(B&&g&&g.player&&(B.auto||g.aiCmd));
const aiAll=()=>!!B&&(!!B.auto||playerGroups().length>0&&playerGroups().every(id=>B.groups[id].aiCmd));
const aiAny=()=>!!B&&(!!B.auto||playerGroups().some(id=>B.groups[id].aiCmd));
// (the AI's hold on your army changed: its captain (commander.js captainMem, its key 0) forgotten, to think afresh at once; the
// whole-army choice remembered for the next battle)
function aiChanged(quiet,msg){if(B.captains)delete B.captains[0];B.cmdT=0;if(!B.opts.sandbox)prefSet('bauto',aiAll());autoUI();if(!quiet)toast(msg)}
// the AI in command of your whole army, on or off (remembered for the next battle); every group's own flag cleared
function setAuto(on,quiet){
  if(!B)return;B.auto=!!on;for(const g of playerGroups())B.groups[g].aiCmd=false;
  if(B.auto)for(const g of playerGroups())B.groups[g].aiReset();
  aiChanged(quiet,B.auto?'The AI takes command of your army (A: take it back).':'You take command of your army.');
}
// these groups of yours to the AI (on: its notes on them cleared, for a fresh start) or back to you; from the whole army, each the
// rest keep theirs
function setGroupsAuto(gs,on,quiet){
  if(!B)return;const mine=playerGroups();gs=gs.filter(g=>mine.includes(g)&&!!aiHas(B.groups[g])!==!!on);if(!gs.length)return;
  if(B.auto){B.auto=false;for(const g of mine)B.groups[g].aiCmd=true}
  for(const g of gs){B.groups[g].aiCmd=!!on;if(on)B.groups[g].aiReset()}
  const who=htmlText(gs.map(groupName).join(' and ')),all=aiAll(),none=!aiAny();
  aiChanged(quiet,on?(all?'The AI takes command of your army (A: take it back).':'The AI takes command of '+who+' (A: take them back).'):none?'You take command of your army.':'You take command of '+who+'.');
}
// A, or the AI button: the selected groups to the AI, or back to you when it has them all; nothing selected (or All), the
// whole army, on or off
function autoKey(){if(!B)return;const gs=B.sel==='all'?[]:selGroups().filter(g=>grpUnits(g).length);
  if(!gs.length)setAuto(!aiAll());else setGroupsAuto(gs,!gs.every(g=>aiHas(B.groups[g])));setOrderUI()}// (the cards' AI badges)
// an order of yours to groups gs takes those of them the AI has back
function takeCommand(gs){if(B&&gs&&gs.length)setGroupsAuto(gs,false)}
// (the AI button: lit with the whole army the AI's, half lit (some) with some of it)
function autoUI(){const k=typeof document!=='undefined'&&document.getElementById('bSkills');if(k){k.classList.toggle('on',AUTOSK.on);k.setAttribute('aria-pressed',String(AUTOSK.on))}const b=typeof document!=='undefined'&&document.getElementById('bAuto');if(!b||!B)return;const all=aiAll(),some=!all&&aiAny();b.classList.toggle('on',all);b.classList.toggle('some',some);b.setAttribute('aria-pressed',all?'true':some?'mixed':'false')}
