'use strict';
// Live campaign chrome, its control wiring and shared minimap coordinates.
// The stopped test loop needs the title layer synchronized explicitly.
Kit.suite(({ok})=>{
 const t=T;window.requestAnimationFrame=()=>0;Kit.begin('soldier',23);Kit.clear();Kit.world();t.G.paused=true;t.updateHUD(true);t.frame();t.MainMenu.frame(performance.now());
 const hud=window.campaignHud,screen=document.getElementById('screen'),rect=e=>e.getBoundingClientRect(),visible=e=>!!e.getClientRects().length&&getComputedStyle(e).display!=='none';
 ok(hud&&hud.desktop&&visible(hud.resources),'desktop campaign uses the live resource rail');
 t.P.gold=437;t.updateHUD(true);ok(hud.resources.querySelector('b').textContent==='437','gold is read from the current game, not the concept illustration');
 hud.update({...t.supplyNow(),foodDays:3,drinkDays:.5},t.partySize());ok(!hud.warning.hidden&&hud.warning.textContent.includes('Drink'),'low supplies show a live inventory warning');
 hud.update({...t.supplyNow(),foodDays:3,drinkDays:3},t.partySize());ok(hud.warning.hidden,'the supply warning clears when provisions are sufficient');t.updateHUD(true);
 const r=t.worldMiniRect(),slot=rect(hud.slot),canvas=rect(document.getElementById('game')),k=canvas.width/t.VW;
 ok(Math.abs(canvas.left+r.x*k-slot.left)<k+1&&Math.abs(canvas.top+r.y*k-slot.top)<k+1,'the canvas minimap aligns with its framed console slot');
 ok(t.fullMapHit({x:r.x+r.w/2,y:r.y+r.h/2})&&!t.fullMapHit({x:r.x-5,y:r.y-5}),'minimap hit testing uses the new drawing rectangle');
 ok(document.elementFromPoint(slot.left+slot.width/2,slot.top+slot.height/2)===hud.slot,'the framed minimap has a click target aligned with its picture ('+document.elementsFromPoint(slot.left+slot.width/2,slot.top+slot.height/2).map(e=>e.tagName+'#'+e.id+'.'+e.className).join(' / ')+')');
 ok(document.elementFromPoint(canvas.left+40,canvas.bottom-6)?.id!=='game','clicking the timber console does not issue a travel order behind it');
 const dock=rect(document.querySelector('.dock')),stats=rect(document.getElementById('stats')),mini=rect(document.querySelector('.campaign-survey'));
 ok(stats.right<dock.left&&dock.right<mini.left,'company, command buttons and minimap have separate console space');
 const buttons=[...document.querySelectorAll('.dockrow:not(.sys) .dbtn')];ok(buttons.length===7&&buttons.every(b=>rect(b).width>=44&&rect(b).height>=44),'all seven original command buttons remain visible with usable targets');
 hud.details.click();ok(screen.classList.contains('company-details')&&hud.details.getAttribute('aria-expanded')==='true'&&visible(document.querySelector('.pc-res')),'company details exposes the complete original supply and condition information');hud.details.click();
 document.getElementById('pause').click();ok(!t.G.paused,'the original pause button still controls the clock');document.getElementById('pause').click();
 document.querySelector('[data-speed="2"]').click();ok(t.G.speed===2,'the original speed buttons remain wired');
 hud.slot.click();t.updateHUD(true);t.frame();ok(t.G.mode==='fullmap'&&!visible(hud.resources),'campaign chrome leaves the full map unobstructed');t.closeOver();t.frame();
 ok(t.G.mode==='world'&&visible(hud.resources),'closing the map restores campaign chrome');
 t.G.mode='title';t.frame();ok(!visible(hud.resources)&&!visible(hud.details),'campaign decorations do not leak onto the title screen');
});
