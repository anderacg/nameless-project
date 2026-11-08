/* Studio chrome and scene navigation; editing stays in the existing controllers. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id),G=spriteRigEditor,W=spriteWorkshop;
 const paths={character:'M8 3h8v7H8z M5 21v-5a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v5 M9 17v4m6-4v4',pose:'M12 4v7m0 0L5 7m7 4 7-4m-7 4-5 9m5-9 5 9 M10 3h4',animate:'m8 4 12 8-12 8z',parts:'m4 16 10-11 5 5L8 21H3z M12 7l5 5',export:'M14 3h7v7m0-7L11 13 M11 4H4v16h16v-7',undo:'M4 5v6h6 M4 11a8 8 0 1 1 1 7',redo:'M20 5v6h-6 M20 11a8 8 0 1 0-1 7'};
 const icon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+paths[name]+'"/></svg>';
 document.body.classList.add('studio-app');
 document.querySelector('.studio-header .eyebrow').textContent='ASHMARK';
 document.querySelector('.studio-header h1').textContent='Sprite Studio';
 document.querySelector('.studio-header p').textContent='Character & animation workspace';
 for(const tab of document.querySelectorAll('[data-mode]'))tab.querySelector('span').innerHTML=icon(tab.dataset.mode);
 const shell=document.createElement('div');shell.className='studio-shell';$('character-panel').before(shell);
 const browser=document.createElement('aside');browser.className='asset-browser';browser.setAttribute('aria-label','Scene and asset browser');browser.innerHTML='<div class="dock-title"><span id="browser-title">CHARACTER LIBRARY</span><span class="live-dot" aria-hidden="true"></span></div><label class="asset-search"><span class="sr-only">Search scene or presets</span><input id="studio-search" type="search" placeholder="Search presets…"></label><div id="scene-list" class="scene-list"></div><div class="browser-note"><span class="eyebrow">WORKSPACE TIPS</span><p id="browser-tip"></p><div class="shortcut-row"><kbd>Space</kbd><span>Play / pause</span></div><div class="shortcut-row"><kbd>⌘ / Ctrl Z</kbd><span>Undo edit</span></div><div class="shortcut-row"><kbd>⌘ / Ctrl S</kbd><span>Save project</span></div></div>';
 shell.append(browser,$('character-panel'),$('rig-studio'));
 browser.append($('variation-options'),$('collection-options'));
 const dock=document.createElement('section');dock.className='studio-dock';dock.setAttribute('aria-label','Animation timeline');dock.innerHTML='<div class="dock-title"><div><span class="live-dot" aria-hidden="true"></span> <span id="timeline-title">ANIMATION TIMELINE</span></div><span id="timeline-info"></span></div><div id="timeline-rig"></div><div id="timeline-character"></div>';
 shell.append(dock);$('timeline-rig').append(document.querySelector('.preview-actions'),$('rig-timeline'));$('timeline-character').append($('pose').closest('.toolbar'),$('frames'));
 const tools=document.createElement('div');tools.className='canvas-tools';tools.innerHTML='<div class="canvas-label"><span class="live-dot" aria-hidden="true"></span><strong id="canvas-title">CHARACTER VIEW</strong><span id="canvas-direction">Facing right</span></div><div class="canvas-tool-buttons"><button id="studio-fit" title="Reset canvas zoom">Fit sprite</button><button id="studio-backdrop" title="Change canvas background">Backdrop</button><button id="studio-scene" aria-expanded="false" aria-controls="scene-list">Scene</button></div>';
 const characterPreview=document.querySelector('.preview'),rigStage=document.querySelector('.rig-stage-column');characterPreview.prepend(tools);const options=document.querySelector('.preview-options');options.append($('gray').closest('label'));document.querySelector('.controls').append(options);
 document.querySelector('.rig-heading').hidden=true;
 const history=document.querySelector('.history-tools');for(const name of ['undo','redo']){const button=$('rig-'+name);button.setAttribute('aria-label',name==='undo'?'Undo edit':'Redo edit');button.innerHTML=icon(name)+'<span>'+(name==='undo'?'Undo':'Redo')+'</span>';}document.querySelector('.project-actions').prepend(history);
 const status=$('studio-status');status.classList.add('studio-statusbar');document.querySelector('main').append(status);
 const scene=$('scene-list'),search=$('studio-search'),desktop=matchMedia('(min-width:1000px) and (min-height:550px)');let queued=false,lastMode='',lastState='';
 function placeDock(){if(desktop.matches)shell.append(dock);else(spriteStudioUI.mode==='character'?characterPreview:rigStage).append(dock);}
 desktop.addEventListener('change',placeDock);
 const depth=id=>{let n=0,b=SpriteRig.bones.find(b=>b.id===id);while(b?.parent){n++;b=SpriteRig.bones.find(v=>v.id===b.parent);}return n;};
 function rebuild(){queued=false;const mode=spriteStudioUI.mode,character=mode==='character',s=G.state;
  if(lastMode!==mode){search.value='';lastMode=mode;}
  const query=search.value.toLowerCase();$('browser-title').textContent=character?'CHARACTER LIBRARY':'SCENE HIERARCHY';search.placeholder=character?'Search presets…':'Find a body part…';
  $('browser-tip').textContent=character?'Choose a preset as your starting point. Appearance changes also update your rig.':'Select a body part here or tap its joint on the canvas. Your frame changes stay with the project.';
  $('variation-options').hidden=$('collection-options').hidden=!character;
  $('timeline-rig').hidden=character;$('timeline-character').hidden=!character;
  $('canvas-title').textContent=character?'CHARACTER VIEW':mode==='parts'?(s.pixelEditing?'PIXEL EDITOR':'PART COMPOSITION'):'POSE VIEW';$('canvas-direction').textContent='Facing '+(s.left?'left':'right');
  (character?characterPreview:rigStage).prepend(tools);placeDock();
  $('timeline-title').textContent=character?'GAME ANIMATION PREVIEW':'ANIMATION TIMELINE';
  const clip=s.asset.clips[s.clip];$('timeline-info').textContent=character?W.state.pose+' · '+W.state.fps+' FPS':clip.name+' · '+clip.frames.length+' frames · '+clip.frames.reduce((n,f)=>n+f.duration,0)+' ms';
  const focused=scene.contains(document.activeElement)?document.activeElement.dataset.sceneId:null;scene.replaceChildren();
  if(character){for(const preset of SpriteStudio.presets){if(!(preset.name+' '+preset.id).toLowerCase().includes(query))continue;const button=document.createElement('button');button.className='scene-item preset-item';button.dataset.sceneId='preset:'+preset.id;button.textContent=preset.name.replace(/[-_]/g,' ');button.setAttribute('aria-pressed',String($('preset').value===preset.id));button.onclick=()=>{W.apply(preset.config);queue();};scene.append(button);}}
  else{for(const option of $('rig-bone').options){if(!option.textContent.toLowerCase().includes(query))continue;const row=document.createElement('div');row.className='scene-row';const button=document.createElement('button');button.className='scene-item';button.dataset.sceneId='bone:'+option.value;button.style.setProperty('--depth',depth(option.value));button.textContent=option.textContent;button.setAttribute('aria-pressed',String(option.value===s.bone));button.onclick=()=>{$('rig-bone').value=option.value;$('rig-bone').dispatchEvent(new Event('change'));};const eye=document.createElement('button'),visible=!s.asset.hidden.includes(option.value);eye.className='scene-visibility';eye.dataset.sceneId='visibility:'+option.value;eye.textContent=visible?'●':'○';eye.title=(visible?'Hide ':'Show ')+option.textContent;eye.setAttribute('aria-label',eye.title);eye.setAttribute('aria-pressed',String(visible));eye.onclick=()=>{$('rig-bone').value=option.value;$('rig-bone').dispatchEvent(new Event('change'));$('rig-hide-bone').checked=visible;$('rig-hide-bone').dispatchEvent(new Event('change'));};row.append(button,eye);scene.append(row);}
   for(const [i,part]of s.asset.parts.entries()){if(!part.name.toLowerCase().includes(query))continue;const button=document.createElement('button');button.className='scene-item custom-item';button.dataset.sceneId='part:'+part.id;button.textContent='▧ '+part.name;button.onclick=()=>{spriteStudioUI.show('parts');$('rig-part').value=i;$('rig-part').dispatchEvent(new Event('change'));};scene.append(button);}}
  if(focused)for(const button of scene.querySelectorAll('[data-scene-id]'))if(button.dataset.sceneId===focused)button.focus({preventScroll:true});
  if(!scene.children.length){const p=document.createElement('p');p.className='muted small';p.textContent='No matches. Try another name.';scene.append(p);}
 }
 function queue(){if(queued)return;queued=true;requestAnimationFrame(rebuild);}
 search.oninput=queue;
 $('studio-fit').onclick=()=>{const character=spriteStudioUI.mode==='character',select=$(character?'zoom':'rig-view');if(character){const stage=$('stage'),canvas=$('preview'),fit=Math.min((stage.clientWidth-24)/canvas.width,(stage.clientHeight-24)/canvas.height),values=[...select.options].map(o=>Number(o.value)).sort((a,b)=>a-b);select.value=[...values].reverse().find(v=>v<=fit)||values[0];}else{const s=G.state,c=SpriteRig.render(s.asset,s.asset.clips[s.clip].frames[s.frame].pose,{facing:s.left?'left':'right'}).image,pixels=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let radius=0;for(let n=0;n<pixels.length/4;n++)if(pixels[n*4+3])radius=Math.max(radius,Math.abs(n%c.width-c.width/2+.5),Math.abs(Math.floor(n/c.width)-c.height/2+.5));select.value=[32,48,64,128].find(v=>v>=radius*2+4)||128;}select.dispatchEvent(new Event('change'));};
 const backdrops=['checker','charcoal','paper'];let backdrop='checker';try{const value=localStorage.getItem('ashmark.studioBackdrop');if(backdrops.includes(value))backdrop=value;}catch(e){}
 function setBackdrop(){document.body.dataset.backdrop=backdrop;$('studio-backdrop').textContent={checker:'Backdrop: grid',charcoal:'Backdrop: dark',paper:'Backdrop: light'}[backdrop];}
 $('studio-backdrop').onclick=()=>{backdrop=backdrops[(backdrops.indexOf(backdrop)+1)%backdrops.length];setBackdrop();try{localStorage.setItem('ashmark.studioBackdrop',backdrop);}catch(e){}};setBackdrop();
 $('studio-scene').onclick=()=>{const open=!document.body.classList.contains('scene-open');document.body.classList.toggle('scene-open',open);$('studio-scene').setAttribute('aria-expanded',String(open));if(open)search.focus();};
 new MutationObserver(queue).observe(document.body,{attributes:true,attributeFilter:['data-mode','data-painting']});
 new MutationObserver(queue).observe($('rig-bone'),{childList:true});
 document.addEventListener('sprite:change',queue);document.addEventListener('rig:saved',queue);
 // Refresh timeline labels without rebuilding the scene on every playback frame.
 new MutationObserver(()=>{const s=G.state,key=[s.clip,s.frame,s.left].join(':');if(key!==lastState){lastState=key;$('canvas-direction').textContent='Facing '+(s.left?'left':'right');}}).observe($('rig-readout'),{childList:true});
 queue();
})();
