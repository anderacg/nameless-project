'use strict';
// Live campaign chrome, its control wiring and shared minimap coordinates.
// The stopped test loop needs the title layer synchronized explicitly.
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();t.G.paused=true;const home=Kit.goHome('Ashford');t.P.x=home.x+40;t.P.y=home.y+30;t.updateHUD(true);t.frame();t.MainMenu.frame(performance.now());
 const hud=window.campaignHud,screen=document.getElementById('screen'),rect=e=>e.getBoundingClientRect(),visible=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
 ok(hud&&hud.desktop&&visible(hud.resources),'desktop campaign uses the live resource rail');
 ok(hud.brand.textContent.includes(t.bandName())&&hud.brand.querySelector('.tipflag'),'army header shows the current band name and real map flag');
 ok(!visible(document.querySelector('#stats .pc-pic'))&&hud.company.contains(hud.resources)&&hud.company.contains(document.getElementById('stats')),'resources and portrait-free conditions share one panel');
 ok(!hud.townCard.hidden&&hud.townCard.querySelector('h3').textContent===home.name&&hud.townCard.textContent.includes(String(home.gar)),'nearby holding card uses its real name and garrison');
 const approach0=window.worldApproach;let approached=null;try{window.worldApproach=o=>{approached=o};hud.townCard.querySelector('[data-town-action="approach"]').click()}finally{window.worldApproach=approach0}ok(approached===home,'the holding action delegates to normal travel and gate rules');
 ok(document.querySelectorAll('.dockrow:not(.sys) .campaign-command-art').length===6,'illustrated command icons survive input initialization');
 t.P.gold=437;t.updateHUD(true);ok(hud.resources.querySelector('b').textContent==='437','gold is read from the current game, not the concept illustration');
 hud.update({...t.supplyNow(),foodDays:3,drinkDays:.5},t.partySize());ok(hud.resources.querySelector('[data-supply="mug"].warn .campaign-resource-alert')?.textContent==='LOW'&&!document.querySelector('.campaign-warning'),'low drink is highlighted directly in the resource bar without a floating warning');
 hud.update({...t.supplyNow(),foodDays:3,drinkDays:3},t.partySize());ok(!hud.resources.querySelector('.campaign-resource-alert'),'the supply warning clears when provisions are sufficient');t.updateHUD(true);
 const r=t.worldMiniRect(),slot=rect(hud.slot),canvas=rect(document.getElementById('game')),k=canvas.width/t.VW;
 ok(Math.abs(canvas.left+r.x*k-slot.left)<k+1&&Math.abs(canvas.top+r.y*k-slot.top)<k+1,'the canvas minimap aligns with its framed console slot');
 ok(hud.slot.querySelector('canvas')?.width>0,'the framed minimap presents the live rendered canvas');
 const panel=document.querySelector('.campaign-survey'),padding=getComputedStyle(panel);ok(['paddingTop','paddingRight','paddingBottom','paddingLeft'].every(k=>parseFloat(padding[k])===0),'the minimap frame has no wooden spacer around the picture');
 ok(document.querySelectorAll('#stats .campaign-condition-art').length===3,'desktop fitness, morale and stamina share illustrated condition icons');
 ok(t.fullMapHit({x:r.x+r.w/2,y:r.y+r.h/2})&&!t.fullMapHit({x:r.x-5,y:r.y-5}),'minimap hit testing uses the new drawing rectangle');
 ok(document.elementFromPoint(slot.left+slot.width/2,slot.top+slot.height/2)===hud.slot,'the framed minimap has a click target aligned with its picture ('+document.elementsFromPoint(slot.left+slot.width/2,slot.top+slot.height/2).map(e=>e.tagName+'#'+e.id+'.'+e.className).join(' / ')+')');
 ok(document.elementFromPoint(canvas.left+40,canvas.bottom-6)?.id!=='game','clicking the timber console does not issue a travel order behind it');
 const dock=rect(document.querySelector('.dock')),stats=rect(document.getElementById('stats')),mini=rect(document.querySelector('.campaign-survey'));
 ok(rect(hud.company).right<dock.left&&mini.top<canvas.top+100&&mini.bottom<dock.top,'status and commands have separate space with the minimap at upper right');
 ok(hud.mapZoom.contains(document.getElementById('zoomIn'))&&hud.mapZoom.contains(document.getElementById('zoomOut'))&&rect(document.querySelector('.dockrow.sys')).bottom<canvas.top+65,'zoom controls follow the map frame and utility controls occupy the top bar');
 const buttons=[...document.querySelectorAll('.dockrow:not(.sys) .dbtn')].filter(visible);ok(buttons.length===5&&buttons.every(b=>rect(b).width>=44&&rect(b).height>=44),'five illustrated commands have usable targets and no redundant Map button');
 ok(document.querySelector('.dockrow.sys').contains(document.getElementById('helpBtn')),'Help remains available in the utility row');
 hud.details.click();ok(screen.classList.contains('company-details')&&hud.details.getAttribute('aria-expanded')==='true'&&visible(document.querySelector('.pc-res')),'company details exposes the complete original supply and condition information');hud.details.click();
 ok(getComputedStyle(document.querySelector('.wtop [data-speed="2"]')).borderImageSource==='none','time controls do not have nested square frames');
 document.getElementById('pause').click();ok(!t.G.paused,'the original pause button still controls the clock');document.getElementById('pause').click();
 document.querySelector('[data-speed="2"]').click();ok(t.G.speed===2,'the original speed buttons remain wired');
 hud.slot.click();t.updateHUD(true);t.frame();ok(t.G.mode==='fullmap'&&!visible(hud.resources),'campaign chrome leaves the full map unobstructed');t.closeOver();t.frame();
 ok(t.G.mode==='world'&&visible(hud.resources),'closing the map restores campaign chrome');
 t.G.mode='title';t.frame();ok(!visible(hud.resources)&&!visible(hud.details),'campaign decorations do not leak onto the title screen');
});
