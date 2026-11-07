(function () {
  'use strict';
  const E=PortraitEngine,$=id=>document.getElementById(id),names={race:'Race',ears:'Ear shape',face:'Face shape',hair:'Hairstyle',eyes:'Eyes',brows:'Eyebrows',nose:'Nose',mouth:'Mouth',beard:'Facial hair',age:'Age',marks:'Skin marks',clothing:'Clothing / armor',headwear:'Headwear / helmet'};
  const state={config:{...E.defaults},colors:{...E.colors},colored:false,visible:Object.fromEntries(E.order.map(s=>[s.id,true])),selected:'hairFront',portrait:null};
  const selectors={},checks={},tiles={};
  function copy(src,target){const g=target.getContext('2d');g.clearRect(0,0,E.size,E.size);g.imageSmoothingEnabled=false;g.drawImage(src,0,0);}
  function title(s){const label={coif:'Mail coif',nasal:'Nasal helm',kettle:'Kettle helm',cap:'Wool cap',gambeson:'Quilted gambeson',mail:'Mail shirt',tunic:'Laced tunic',surcoat:'Surcoat / mail',fur:'Fur mantle'};return label[s]||s.split('-').map(v=>v.charAt(0).toUpperCase()+v.slice(1)).join(' ');}
  let controlsRace=null;
  function fillOptions(select,key,race){
    const allowed=E.partsFor(race,key),groups=key==='hair'?Object.entries(E.hairGroups):key==='headwear'?Object.entries(E.headwearGroups):[[null,allowed]];
    select.replaceChildren();for(const [group,values] of groups){const choices=values.filter(v=>allowed.includes(v));if(!choices.length)continue;const parent=group?document.createElement('optgroup'):select;if(group){parent.label=group;select.append(parent);}for(const v of choices){const option=document.createElement('option');option.value=v;option.textContent=title(v);parent.append(option);}}
  }
  function anchors(){const g=$('anchors').getContext('2d');g.clearRect(0,0,E.size,E.size);if(!$('show-anchors').checked)return;g.strokeStyle='#e9bb69';g.fillStyle='#e9bb69';g.lineWidth=.5;for(const a of [...state.portrait.anchors.eyes,state.portrait.anchors.nose,state.portrait.anchors.mouth]){g.beginPath();g.moveTo(a.x-3,a.y+.5);g.lineTo(a.x+3,a.y+.5);g.moveTo(a.x+.5,a.y-3);g.lineTo(a.x+.5,a.y+3);g.stroke();}}
  function inspect(id) {
    state.selected=id;
    for(const spec of E.order)tiles[spec.id].classList.toggle('selected',spec.id===id);
    const src=state.portrait.layers[id];
    const pixels=src.getContext('2d').getImageData(0,0,E.size,E.size).data;
    let x0=E.size,y0=E.size,x1=-1,y1=-1;
    for(let y=0;y<E.size;y++)for(let x=0;x<E.size;x++) {
      if(!pixels[(y*E.size+x)*4+3])continue;
      x0=Math.min(x0,x);x1=Math.max(x1,x);
      y0=Math.min(y0,y);y1=Math.max(y1,y);
    }
    const g=$('inspection').getContext('2d');
    g.clearRect(0,0,E.size,E.size);
    g.imageSmoothingEnabled=false;
    if(x1>=0) {
      const size=Math.max(x1-x0+1,y1-y0+1)+8;
      const cx=(x0+x1+1)/2,cy=(y0+y1+1)/2;
      g.drawImage(src,cx-size/2,cy-size/2,size,size,0,0,E.size,E.size);
    }
    $('layer-title').textContent=E.order.find(spec=>spec.id===id).name+' · grayscale source';
  }
  function render(rebuild=false){
    state.config=E.normalize(state.config);
    if(controlsRace!==state.config.race){for(const [key,select] of Object.entries(selectors))fillOptions(select,key,state.config.race);controlsRace=state.config.race;}
    if(rebuild||!state.portrait)state.portrait=E.build(state.config);
    copy(E.composite(state.portrait,{colors:state.colored?state.colors:null,visible:state.visible}),$('portrait'));
    for(const profile of E.profiles)$('profile-'+profile).setAttribute('aria-pressed',String(state.config.profile===profile));
    const fit=E.headwearRules[state.config.headwear].hair;$('headwear-note').textContent={show:'Hair remains visible.',tuck:'Crown hair tucked under this headwear.',hide:'Hair and ears concealed by this headwear.',frame:'Hair stays within the veil; back hair and ears are covered.'}[fit];
    anchors();$('gray').setAttribute('aria-pressed',String(!state.colored));$('color').setAttribute('aria-pressed',String(state.colored));
    $('preset').value=String(E.presets.findIndex(p=>JSON.stringify(state.config)===JSON.stringify(E.normalize(p.config)))).replace('-1','');for(const key of Object.keys(selectors))selectors[key].value=state.config[key];$('seed').value=state.config.seed;
    for(const s of E.order){checks[s.id].checked=state.visible[s.id];copy(state.portrait.layers[s.id],tiles[s.id].querySelector('canvas'));}
    inspect(state.selected);
    $('color-hint').textContent=state.colored?'Applied to preview only':'Enable tint preview to apply';
    $('status').textContent=state.colored?'Tinted composite · grayscale source layers preserved':'Grayscale composite · 32-value shading';
    window.portraitWorkshop=Object.freeze({state,render,engine:E});
    document.dispatchEvent(new Event('portrait:change'));
  }
  function download(name,href){const a=document.createElement('a');a.download=name;a.href=href;document.body.append(a);a.click();a.remove();}
  function blob(name,text){const url=URL.createObjectURL(new Blob([text],{type:'application/json'}));download(name,url);setTimeout(()=>URL.revokeObjectURL(url),1000);}
  for(const profile of E.profiles)$('profile-'+profile).onclick=()=>{
    state.config=E.startProfile(profile,state.config);
    if(profile!=='custom')for(const spec of E.order)state.visible[spec.id]=true;
    render(true);
  };
  const soldierGroup=document.createElement('optgroup');soldierGroup.label='Soldiers · infantry, archers & cavalry';E.presets.forEach((p,i)=>{const opt=document.createElement('option');opt.value=String(i);opt.textContent=p.name;(p.category==='soldier'?soldierGroup:$('preset')).append(opt);});$('preset').append(soldierGroup);
  $('preset').onchange=()=>{const p=E.presets[Number($('preset').value)];if($('preset').value===''||!p)return;state.config=E.normalize(p.config);for(const spec of E.order)state.visible[spec.id]=true;render(true);};
  for(const [key,values] of Object.entries(E.options)){
    const label=document.createElement('label'),select=document.createElement('select');select.id='feature-'+key;
    fillOptions(select,key,state.config.race);
    label.append(document.createTextNode(names[key]),select);if(key==='race'){const note=document.createElement('small');note.textContent='Only compatible parts are listed. Switching race replaces incompatible choices.';note.style.cssText='font-size:11px;line-height:1.4;color:#aaa;font-weight:normal';label.append(note);}if(key==='headwear'){const note=document.createElement('small');note.id='headwear-note';note.style.cssText='font-size:11px;line-height:1.4;color:#aaa;font-weight:normal';label.append(note);}$('features').append(label);selectors[key]=select;
    select.onchange=()=>{if(key==='race')state.config=E.startRace(select.value,state.config);else state.config[key]=select.value;render(true);};
  }
  for(const [key,value] of Object.entries(state.colors)){
    const label=document.createElement('label'),input=document.createElement('input');input.type='color';input.value=value;input.id='tint-'+key;input.setAttribute('aria-label',title(key)+' tint');
    label.append(input,document.createTextNode(title(key)));$('colors').append(label);input.oninput=()=>{state.colors[key]=input.value;render();};
  }
  for(const s of E.order){
    const tile=document.createElement('div');tile.className='layer';tile.dataset.layer=s.id;
    const art=document.createElement('button');art.type='button';art.className='layer-art checker';art.setAttribute('aria-label','Inspect '+s.name);art.onclick=()=>inspect(s.id);
    const cv=document.createElement('canvas');cv.width=cv.height=E.size;art.append(cv);
    const label=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.checked=true;check.id='visible-'+s.id;check.onchange=()=>{state.visible[s.id]=check.checked;render();};
    label.append(check,document.createTextNode(s.name));tile.append(art,label);$('layers').append(tile);tiles[s.id]=tile;checks[s.id]=check;
  }
  $('gray').onclick=()=>{state.colored=false;render();};$('color').onclick=()=>{state.colored=true;render();};$('show-anchors').onchange=anchors;
  $('seed').onchange=()=>{const raw=$('seed').valueAsNumber;state.config.seed=Number.isFinite(raw)?Math.max(0,Math.min(4294967295,Math.trunc(raw))):23;render(true);};
  $('random').onclick=()=>{state.config=E.random((state.config.seed+0x9e3779b9)>>>0,state.config.profile,state.config.race);for(const s of E.order)state.visible[s.id]=true;render(true);};
  $('blank').onclick=()=>{for(const s of E.order)state.visible[s.id]=s.id==='face'||s.id==='clothing';render();};
  $('restore').onclick=()=>{for(const s of E.order)state.visible[s.id]=true;render();};
  $('download-layer').onclick=()=>download('portrait-'+state.selected+'-grayscale.png',state.portrait.layers[state.selected].toDataURL('image/png'));
  $('download-portrait').onclick=()=>download('portrait-'+(state.colored?'tinted':'grayscale')+'.png',$('portrait').toDataURL('image/png'));
  $('download-atlas').onclick=()=>{const c=document.createElement('canvas');c.width=E.size*E.order.length;c.height=E.size;const g=c.getContext('2d');E.order.forEach((s,i)=>g.drawImage(state.portrait.layers[s.id],i*E.size,0));download('portrait-grayscale-atlas.png',c.toDataURL('image/png'));};
  $('import-json').onclick=()=>$('recipe-file').click();
  $('recipe-file').onchange=async()=>{const f=$('recipe-file').files[0];if(!f)return;try{if(f.size>100000)throw Error('Recipe is too large');const r=JSON.parse(await f.text());if(![4,5,6,E.version].includes(r.version)||!r.config||typeof r.config!=='object')throw Error('Choose a version 4–7 portrait recipe');state.config=E.normalize(r.config);for(const key of Object.keys(E.colors)){const color=r.colors?.[key];state.colors[key]=/^#[0-9a-f]{6}$/i.test(color)?color:E.colors[key];$('tint-'+key).value=state.colors[key];}for(const s of E.order)state.visible[s.id]=r.visible?.[s.id]!==false;state.colored=r.colored===true;render(true);}catch(e){$('status').textContent='Could not load recipe: '+e.message;}finally{$('recipe-file').value='';}};
  $('download-json').onclick=()=>blob('portrait-recipe.json',JSON.stringify({version:E.version,size:E.size,config:state.config,headwearFit:E.headwearRules[state.config.headwear],colors:state.colors,colored:state.colored,visible:state.visible,anchors:state.portrait.anchors,drawOrder:E.order.map((s,i)=>({...s,frame:{x:i*E.size,y:0,width:E.size,height:E.size},origin:{x:0,y:0}}))},null,2));
  render(true);
})();
