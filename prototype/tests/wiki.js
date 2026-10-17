'use strict';
// Load the actual second entry point, not just its script list. Retained constants/helpers must still build the reference.
window.RUN=()=>{
  const o=[],ok=(c,m)=>o.push((c?'PASS ':'FAIL ')+m);let done=false;
  window.requestAnimationFrame=()=>0;
  const frame=document.createElement('iframe');frame.width=1000;frame.height=700;frame.style.cssText='position:absolute;left:-12000px;top:0;border:0';
  const finish=()=>{if(done)return;done=true;clearTimeout(timer);frame.remove();const d=document.createElement('pre');d.id='OUT';d.textContent=o.concat(ERR.map(e=>'ERR '+e)).join('\n');document.body.appendChild(d)};
  const timer=setTimeout(()=>{ok(false,'wiki finishes loading within 30 seconds');finish()},30000);
  frame.onload=()=>{try{
    const w=frame.contentWindow,d=frame.contentDocument,sections=d.querySelectorAll('main section');
    ok(w.WIKI_OK>=15&&sections.length===w.WIKI_OK,'the actual wiki builds all its sections (built '+w.WIKI_OK+', found '+sections.length+')');
    ok(!!d.querySelector('#realms .entry')&&!!d.querySelector('#combat .entry'),'realm and battle reference content still renders');
    ok(d.querySelectorAll('#combat table').length>0&&d.getElementById('combat').textContent.includes('Shield wall'),'formation reference data remains available');
    ok(!d.querySelector('[data-spr]')&&d.querySelectorAll('canvas.spr').length>20,'wiki sprite placeholders become rendered canvases (remaining '+d.querySelectorAll('[data-spr]').length+', canvases '+d.querySelectorAll('canvas.spr').length+')');
    ok(w.eval('typeof seeded')==='function'&&w.eval('typeof LCAP')==='number'&&w.eval('FORM_ORDER.length')===3&&w.eval('typeof shieldWallActive')==='function','shared helpers and wiki-only constant consumers remain intact');
    const search=d.getElementById('q');ok(!!search,'the wiki search control exists');
    if(search){search.value='dragon';search.dispatchEvent(new w.Event('input',{bubbles:true}));const shown=[...d.querySelectorAll('main section:not([hidden])')];ok(shown.length>0&&shown.length<sections.length&&/match/.test(d.getElementById('qinfo').textContent)&&shown.some(s=>s.textContent.toLowerCase().includes('dragon')),'wiki search filters reference entries and reports matches')}
  }catch(e){o.push('EXC '+e.message+' '+e.stack)}finish()};
  frame.src='wiki.html';document.body.appendChild(frame);
};
