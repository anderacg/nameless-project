'use strict';
/* Developer tools deliberately use explicit commands, never eval. They are not saved. */
const DevConsole={
  opened:false,root:null,history:[],historyAt:0,previousFocus:null,
  help:'help | money 1000 | where | tp 1200 800 | goto Ashford | get player | get player.attr | set player.attr.agi 12 | roster | get unit.0 | set unit.0.s.spd 80 | units bow | battle hum_bow 5 hum_foot 5 | pause | step 60 | restart | exit | speed 3 | noNeeds true | enc | enc child | quest | quest bounty | book millers_debt | chains | chain 1 | chain 1 go | passengers | escort | ander\nspeed n (or speed(n)): your band’s map speed × n, 1 resets. noNeeds true/false (or noNeeds(true)): no hunger, thirst or stamina drain, nor their tolls on your hero. Both for testing: never saved, gone on reload.\nThe story (for testing content): enc lists the road’s encounter kinds, enc child (or enc(\'lostChild\'): by id or name) spawns one near you; quest lists the job kinds, quest bounty offers one at the holding nearest you and takes it; chains lists the threads (chain quests) under way, chain 1 shows one’s step, what it waits for, its memory and its past, chain 1 go takes you to where its step points; passengers lists those you escort, escort (or escort 3, a quest’s number) takes you to an escort’s place; ander (or ander(), enc wounded ander) lays Ander The Fallen, wounded, by the road near you (once a game).\nCoordinates are world pixels. tp tile 50 60 uses tile coordinates. roster lists live unit IDs. Numeric edits require finite values. String edits use JSON quotes. Cheats affect the current campaign and can be saved; battle tests use private copies.',
  text(value){const seen=new WeakSet();return typeof value==='string'?value:JSON.stringify(value,(k,v)=>{if(v&&typeof v==='object'){if(seen.has(v))return '[reference]';seen.add(v)}return v},2)},
  write(value,error=false){if(!this.root)return;const out=this.root.querySelector('[data-dev-output]'),line=document.createElement('div');line.className=error?'dev-error':'';line.textContent=String(this.text(value)).slice(0,10000);out.append(line);while(out.children.length>100)out.firstChild.remove();out.scrollTop=out.scrollHeight},
  // (a battle test needs a world in: from the main menu with none, it says so; ui/mainmenu.js)
  labStart(c){if(!WM)throw Error('The battle test bench needs a world: start or load a campaign first.');return BattleLab.start(c)},
  number(value){if(value==null||String(value).trim()===''||!Number.isFinite(Number(value)))throw Error('Expected a finite number.');return Number(value)},
  resolve(path){
    const parts=String(path||'').split('.');if(parts.some(p=>!/^\w+$/.test(p)||['__proto__','prototype','constructor'].includes(p)))throw Error('Use a dotted path without prototype access.');
    const root=parts.shift();let object;if(root==='player'||root==='P')object=P;else if(root==='game'||root==='G')object=G;else if(root==='unit'){
      if(!B)throw Error('No active battle.');const id=this.number(parts.shift());object=B.units.find(u=>u.id===id);if(!object)throw Error('No unit with that ID.');
    }else if(root==='group'){
      if(!B)throw Error('No active battle.');const id=parts.shift();object=B.groups[id];if(!object)throw Error('No group with that ID.');
    }else throw Error('Paths start with player, game, unit.<id>, or group.<id>.');
    let parent=null,key=null;for(const p of parts){const d=object&&Object.getOwnPropertyDescriptor(object,p);if(!d||!('value' in d))throw Error('No editable own field: '+p);parent=object;key=p;object=d.value}
    return {value:object,parent,key,root};
  },
  set(path,json){
    if(path.startsWith('unit.')&&!/^unit\.\d+\.(?:s\.\w+(?:\.\w+)*|\w+)$/.test(path))throw Error('Edit unit runtime fields or unit.<id>.s stats, not linked definitions or campaign records.');
    const r=this.resolve(path);if(!r.parent||r.value&&typeof r.value==='object'||typeof r.value==='function')throw Error('Only existing scalar fields can be edited.');
    if(['game','G'].includes(r.root)&&!/^\w+\.(day|clock|speed|paused)$/.test(path))throw Error('Game edits are limited to day, clock, speed and paused.');
    if(r.root==='group'&&!/^group\.\w+\.resolve\.mor$/.test(path))throw Error('Group edits are limited to group.<id>.resolve.mor (shared morale).');
    if(/^unit\.\d+\.(mor|mor0|confidence|rout|rallied|shattered|breakT|cohesion|outmatched|overwhelmed|lossStrain|confidenceBlockedUntil)$/.test(path))throw Error('Morale fields are group-owned output mirrors. Use set group.<id>.resolve.mor instead.');
    if(/^unit\.\d+\.(id|type|team|grp|hero|comp|leader|lord|unit)$/.test(path))throw Error('Unit identity/group fields are read-only. Edit stats or live values instead.');
    let v;try{v=JSON.parse(json)}catch(e){throw Error('Use a JSON scalar: 100, true, null, or "text".');}
    if(v!==null&&!['number','string','boolean'].includes(typeof v)||typeof v==='number'&&!Number.isFinite(v))throw Error('Only finite numbers, strings, booleans and null are allowed.');
    if(r.value!==null&&v!==null&&typeof v!==typeof r.value)throw Error('Keep the existing field type.');
    if(typeof r.value==='number'&&v===null)throw Error('Numeric fields cannot be set to null.');
    if(/^\w+\.gold$/.test(path)&&(!Number.isSafeInteger(v)||v<0))throw Error('Gold must be a nonnegative safe integer.');
    if(/^\w+\.race$/.test(path)&&!Object.hasOwn(RACES,v))throw Error('Unknown race.');
    if(/^\w+\.gear\./.test(path)&&v!==null&&!Object.hasOwn(ITEMS,v))throw Error('Unknown equipment ID.');
    let target=r;if(/^unit\.\d+\.s\./.test(path)){const u=this.resolve(path.split('.').slice(0,2).join('.')).value;u.s=structuredClone(u.s);target=this.resolve(path)}
    target.parent[target.key]=v;if(r.root==='group'){target.parent.refreshState();target.parent.sync();setOrderUI()}if(typeof P.changed==='function')P.changed();updateHUD(true);return path+' = '+this.text(v);
  },
  teleport(x,y){
    if(BattleLab.active||B||G.mode!=='world'||G.modal)throw Error('Teleport from the unobstructed campaign map.');
    x=this.number(x);y=this.number(y);if(x<0||y<0||x>=MW*TILE||y>=MH*TILE||!passable(terrAt(x,y)))throw Error('Destination must be walkable land inside the map.');
    P.stay=null;P.x=x;P.y=y;P.tx=P.ty=null;P.stuck=0;G.chase=null;G.encCool=3;G.lastTown=null;reveal();updateHUD(true);return 'Teleported to '+x.toFixed(1)+', '+y.toFixed(1)+' world pixels.';
  },
  // (a command and its words; name(args), as speed(3), reads as name args)
  execute(line){
    const match=String(line).trim().replace(/^(\w+)\(([^)]*)\)$/,'$1 $2').match(/^(\S+)(?:\s+([\s\S]*))?$/);if(!match)return '';const cmd=match[1].toLowerCase(),arg=match[2]||'',args=arg.split(/\s+/).filter(Boolean);
    if(cmd==='help')return this.help;
    if(cmd==='money'){if(args.length!==1)throw Error('Usage: money 1000 (adds gold; negatives subtract).');const n=this.number(arg),next=P.gold+n;if(!Number.isSafeInteger(n)||!Number.isSafeInteger(next)||next<0)throw Error('Gold must remain a nonnegative safe integer.');P.gold=next;updateHUD(true);return 'Gold: '+P.gold}
    if(cmd==='where')return {x:P.x,y:P.y,tileX:Math.floor(P.x/TILE),tileY:Math.floor(P.y/TILE),mode:G.mode};
    if(cmd==='get')return this.resolve(arg).value;
    if(cmd==='set'){const m=arg.match(/^(\S+)\s+([\s\S]+)$/);if(!m)throw Error('Usage: set player.gold 1000');return this.set(m[1],m[2])}
    if(cmd==='tp'){if(args[0]==='tile'&&args.length===3)return this.teleport(this.number(args[1])*TILE+TILE/2,this.number(args[2])*TILE+TILE/2);if(args.length!==2)throw Error('Usage: tp x y or tp tile x y');return this.teleport(args[0],args[1])}
    if(cmd==='goto'){
      const name=arg.replace(/^"|"$/g,'').toLowerCase(),exact=TOWNS.find(t=>t.name.toLowerCase()===name),matches=exact?[exact]:TOWNS.filter(t=>t.name.toLowerCase().includes(name));
      if(!name||matches.length!==1)throw Error('Use a unique holding name. Matches: '+matches.slice(0,12).map(t=>t.name).join(', '));const town=matches[0];
      for(let r=0;r<=5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=town.x+dx*TILE,y=town.y+dy*TILE;if(passable(terrAt(x,y)))return this.teleport(x,y)+' Near '+town.name+'.'}throw Error('No walkable destination near that holding.');
    }
    if(cmd==='units')return Object.entries(ST).filter(([id,s])=>(id+' '+s.n).toLowerCase().includes(arg.toLowerCase())).map(([id,s])=>id+' — '+s.n).join('\n');
    if(cmd==='roster'){if(!B)throw Error('No active battle.');return B.units.map(u=>u.id+' · side '+u.team+' · '+u.type+' · HP '+Math.round(u.hp)+'/'+u.max+' · ('+u.x.toFixed(1)+', '+u.y.toFixed(1)+')').join('\n')}
    if(cmd==='battle'){if(!arg){this.show('battle');return 'Build two armies or load a preset below.'}if(args.length!==4)throw Error('Usage: battle hum_bow 5 hum_foot 5, or battle for the army builder.');return this.labStart({left:args[0],leftCount:this.number(args[1]),right:args[2],rightCount:this.number(args[3])})}
    if(cmd==='pause'){if(B){if(BattleLab.session&&BattleLab.session.result)throw Error('Test finished; restart it.');battlePause();this.labStatus();return B.paused?'Battle paused.':'Battle running (close the console to continue).'}G.paused=!G.paused;pauseUI();return G.paused?'World paused.':'World running (close the console to continue).'}
    if(cmd==='step')return BattleLab.step(arg?this.number(arg):1);
    if(cmd==='restart')return BattleLab.restart();
    if(cmd==='exit')return BattleLab.exit();
    if(cmd==='speed'){if(args.length!==1)throw Error('Usage: speed 3 (your band\'s map speed × 3; speed 1 resets).');const n=this.number(arg);if(n<=0||n>50)throw Error('Speed must be above 0 and at most 50.');CHEAT.speed=n;updateHUD(true);return n===1?'Band speed back to normal.':'Band speed × '+n+' (testing only, not saved).'}
    if(cmd==='noneeds'){const v={true:true,on:true,1:true,false:false,off:false,0:false}[String(arg).trim().toLowerCase()];if(v===undefined)throw Error('Usage: noNeeds true or noNeeds false.');CHEAT.noNeeds=v;updateHUD(true);return v?'No hunger, thirst or stamina drain (testing only, not saved).':'Hunger, thirst and stamina drain are back.'}
    if(cmd==='clear'){if(this.root)this.root.querySelector('[data-dev-output]').replaceChildren();return ''}
    if(['enc','quest','book','chains','threads','chain','thread','passengers','escort','ander'].includes(cmd))return this.story(cmd,arg.replace(/^["']|["']$/g,'').trim());
    throw Error('Unknown command. Type help.');
  },
  /* the story's commands (doc/STORY_DESIGN.md; for testing content): an encounter kind spawned near you, a job kind offered and
     taken, the threads under way and one's state (and a jump to where its step points), your passengers and a jump to an
     escort's place, Ander The Fallen laid by the road (story/wounded.js: his chain forced; never twice a game) */
  story(cmd,arg){
    const key=s=>String(s).toLowerCase().replace(/[^a-z]/g,''),find=(list,what)=>list.find(K=>key(K.id)===key(arg)||key(K.n||'')===key(arg)||key(K.wn||'')===key(arg));
    // (you at a walkable spot by (x, y))
    const jump=(x,y,name)=>{let best=null,bd=Infinity;for(let dy=-6;dy<=6;dy++)for(let dx=-6;dx<=6;dx++){const px=x+dx*TILE/2,py=y+dy*TILE/2,d=Math.hypot(dx,dy);if(d<bd&&px>=0&&py>=0&&px<MW*TILE&&py<MH*TILE&&passable(terrAt(px,py))){bd=d;best=[px,py]}}
      if(!best)throw Error('No walkable spot by '+name+'.');return this.teleport(best[0],best[1])};
    if(cmd==='ander'||cmd==='enc'&&/^(wounded|traveller)\s+ander$/i.test(arg)){if(G.mode!=='world')throw Error('Spawn from the campaign map.');
      if(!Wounded.anderFree())throw Error('Ander The Fallen has been met already this game (never twice), or lies on the road or rides in a chain now.');
      const K=kindOf('encounter','traveller'),p=roadSpot(K.on,0,K.near)||roadSpot('wild'),e=p&&roadSpawn('traveller',p[0],p[1]);if(!e)throw Error('No spot for him here: try elsewhere.');
      Wounded.ander(e);return 'Ander The Fallen lies wounded '+Math.round(e.fromYou()/TILE)+' tiles to the '+compass(e.x-P.x,e.y-P.y)+'. Tend his wounds, take him home and clear his attackers’ hideout: he joins you.'}
    if(cmd==='enc'){const ks=Kinds.on('encounter','travelHour');if(!arg)return 'Encounter kinds: '+ks.map(K=>K.id+' ('+K.n+')').join(', ');
      const K=find(ks,arg);if(!K)throw Error('No encounter kind '+arg+'. Type enc for the list.');if(G.mode!=='world')throw Error('Spawn from the campaign map.');
      const p=roadSpot(K.on,0,K.near)||roadSpot('wild'),e=p&&roadSpawn(K.id,p[0],p[1]);if(!e)throw Error('No spot for a '+K.n.toLowerCase()+' here: try elsewhere.');
      return K.n+' ('+K.id+') spawned '+Math.round(e.fromYou()/TILE)+' tiles to the '+compass(e.x-P.x,e.y-P.y)+'.'}
    if(cmd==='quest'){const ks=Kinds.all('quest');if(!arg)return 'Quest kinds: '+ks.map(K=>K.id).join(', ');
      const K=find(ks,arg);if(!K)throw Error('No quest kind '+arg+'. Type quest for the list.');const t=Spatial.nearestHolding(P.x,P.y);
      const lord=['lordkill','raid'].includes(K.id)?W.lords.find(l=>!l.dead&&l.fac===t.owner)||W.lords.find(l=>!l.dead):null,q=makeQuest(K.id,t,lord);
      if(!q)throw Error('No '+K.id+' job can be offered at '+t.name+' now.');if(!acceptQuest(q))throw Error('Could not take it: too many quests, or none of its kind can begin here.');updateHUD(true);
      return 'Offered at '+t.name+(lord?' by '+lord.name:'')+' and taken: '+q.title+' (quest '+q.id+', '+q.days+' days).'}
    // (a questbook entry begun where you are, by the nearest holding (a lord's: a lord of its realm), at its first step or at one named)
    if(cmd==='book'){const ids=Questbook.all();if(!arg)return 'Questbook entries: '+ids.map(id=>id+' ('+QUESTBOOK[id].giver?.by+')').join(', ');
      const [id,at]=arg.split(/\s+/),E=Questbook.entry(id);if(!E)throw Error('No questbook entry '+id+'. Type book for the list.');if(at&&!E.steps[at])throw Error('No step '+at+' in '+id+': '+Object.keys(E.steps).join(', ')+'.');
      const t=Spatial.nearestHolding(P.x,P.y),l=E.giver?.by==='lord'?W.lords.find(x=>!x.dead&&x.fac===t.owner)||W.lords.find(x=>!x.dead):null,th=Questbook.take(id,Stories.ctx({town:t.name,fac:l?.fac,lord:l?.name,lordRef:l}),at,true);
      if(!th)throw Error('It is under way already. Type chains for the list.');updateHUD(true);return 'Begun at '+t.name+(l?' for '+l.name:'')+': '+E.title+' (thread '+th.i+', step '+(th.at||'over')+').'}
    if(cmd==='chains'||cmd==='threads'){const L=Thread.list().on;if(!L.length)return 'No thread under way. Thread kinds: '+(Kinds.all('thread').map(K=>K.id).join(', ')||'none');
      return L.map(th=>th.i+' · '+th.kind.n+' ('+th.k+') · step '+th.at+' · waits for '+(th.wait?th.wait.shape+' '+th.wait.id:'nothing')+' · begun day '+th.day).join('\n')}
    if((cmd==='chain'||cmd==='thread')&&/\s+go$/i.test(arg)){const th=Thread.list().on.find(x=>x.i===this.number(arg.replace(/\s+go$/i,'')));if(!th)throw Error('No thread '+arg+' under way. Type chains for the list.');
      const q=th.wait&&th.wait.shape==='quest'&&P.quests.find(x=>x.id===th.wait.id),g=q&&questGoal(q);if(!g)throw Error('Its step points nowhere now ('+th.at+(th.pageSpec?': its page waits for you on the map':'')+').');
      return jump(g.x,g.y,g.name||'it')+' At '+(g.name||'its place')+' ('+th.at+').'}
    if(cmd==='chain'||cmd==='thread'){const th=Thread.list().on.find(x=>x.i===this.number(arg));if(!th)throw Error('No thread '+arg+' under way. Type chains for the list.');const s=th.current;
      return {id:th.i,kind:th.k,name:th.kind.n,day:th.day,step:th.at,starts:s&&s.start?Thread.starterOf(s):null,until:s?Thread.until(s):null,wait:th.wait,memory:th.memory,past:th.past,page:!!th.pageSpec}}
    if(cmd==='passengers'){const L=Escort.list();if(!L.length)return 'No passengers.';
      return L.map(q=>q.id+' · '+q.pn+' ('+q.who+') to '+q.to.name+' ['+q.to.k+' at '+q.to.x+', '+q.to.y+'] · '+Escort.way(q)+' · due day '+q.due+' · eats '+q.eat+' a day').join('\n')}
    if(cmd==='escort'){const L=Escort.list(),q=arg?L.find(x=>x.id===this.number(arg)):L[0];if(!q)throw Error(L.length?'No escort with that quest number. Type passengers.':'No passengers.');
      return jump(q.to.x,q.to.y,q.to.name)+' At '+q.to.name+': '+q.pn+' is there once the world runs.'}
  },
  submit(line){if(!String(line).trim())return;this.history.push(line);if(this.history.length>100)this.history.shift();this.historyAt=this.history.length;this.write('> '+line);try{const r=this.execute(line);if(r!==''&&r!==undefined)this.write(r);return r}catch(e){this.write(e.message,true);return {error:e.message}}},
  show(tab='console'){if(!this.root)this.init();if(!this.opened)this.previousFocus=document.activeElement;this.opened=true;this.root.hidden=false;G.keys={};if(B&&B.cam)B.cam.keys={};this.root.querySelector('[data-dev-console]').hidden=tab!=='console';this.root.querySelector('[data-dev-battle]').hidden=tab!=='battle';this.root.querySelector('[data-dev-report]').hidden=tab!=='report';if(tab==='report')this.renderLabReport();this.root.querySelector(tab==='console'?'[data-dev-command]':tab==='battle'?'[data-lab-side="left"] select':'[data-lab-export]').focus();this.labStatus()},
  renderLabReport(){
    const host=this.root.querySelector('[data-dev-report]'),r=BattleLab.report();if(!r){host.querySelector('[data-lab-report-content]').textContent='No active laboratory report.';return}
    const esc=htmlText,labels={group_routed:'Formation routed',group_rallied:'Formation rallied',withdraw_order:'Withdrawal ordered',routed:'Routed'},compact=events=>{
      const shown=events.length>8?[...events.slice(0,4),...events.slice(-4)]:events;
      return shown.map(e=>esc(e.type==='field_exit'?(e.cause==='routed'?'Routed exit':'Withdrawn exit'):labels[e.type]||e.type)+' '+e.time.toFixed(2)+'s').join('<br>')+(events.length>8?'<br>… '+(events.length-8)+' more in JSON':'');
    },moraleSamples=samples=>{const shown=samples.slice(-6);return shown.map(s=>s.time.toFixed(1)+'s · '+(s.average===null?'—':s.average.toFixed(1))+(s.state?' · '+esc(s.state):'')+(s.missilePressure>0?' · unanswered fire':'')).join('<br>')+(samples.length>shown.length?'<br>… '+(samples.length-shown.length)+' earlier samples in JSON':'')};
    host.querySelector('[data-lab-report-content]').innerHTML='<p>Elapsed '+r.final.time.toFixed(2)+' s · '+esc(r.final.result||'In progress')+' · Seed '+r.seed+'</p>'+['left','right'].map(side=>'<section><h3>'+side[0].toUpperCase()+side.slice(1)+' side</h3><div class="lab-report-scroll"><table><thead><tr><th>Group</th><th>Survivors</th><th>Remaining</th><th>Dead</th><th>Damage dealt</th><th>Damage taken</th><th>Kills</th><th>Shared morale (time · value · state)</th><th>Routed exits</th><th>Withdrawn exits</th><th>Formation/exit timestamps</th></tr></thead><tbody>'+Object.values(r.groups).filter(g=>g.side===side).map(g=>{
      const events=g.events.filter(e=>['group_routed','group_rallied','withdraw_order','field_exit'].includes(e.type));return '<tr><th>'+esc(g.name)+'</th><td>'+g.final.survivors+'</td><td>'+g.final.remaining+'</td><td>'+g.final.dead+'</td><td>'+Math.round(g.damageDealt)+'</td><td>'+Math.round(g.damageTaken)+'</td><td>'+g.kills+'</td><td>'+moraleSamples(g.morale)+'</td><td>'+g.final.routedExits+'</td><td>'+g.final.withdrawnExits+'</td><td>'+compact(events)+'</td></tr>';
    }).join('')+'</tbody></table></div></section>').join('')+'<p>Each formation has one shared morale value. JSON includes confidence, cohesion, recent-loss strain and unanswered missile pressure. Effective damage is post-mitigation HP removed, capped at remaining HP; missing sources are uncredited.</p>';
  },
  close(){if(!this.opened)return;this.opened=false;this.root.hidden=true;if(this.previousFocus&&this.previousFocus.isConnected)this.previousFocus.focus({preventScroll:true})},
  labStatus(){const bar=document.getElementById('dev-lab-bar');if(!bar)return;bar.hidden=!BattleLab.active;const start=this.root?.querySelector('[data-lab-start]');if(start)start.disabled=BattleLab.active;if(BattleLab.active){const s=BattleLab.session;bar.querySelector('span').textContent=(s.result||'BATTLE TEST · '+(B?.deploy?'Deployment':B?.paused?'Paused':'Running'))+' · no campaign consequences';bar.querySelector('[data-dev-tool=pause]').textContent=B?.deploy?'Begin':B?.paused?'Play':'Pause';bar.querySelector('[data-dev-tool=pause]').disabled=!!s.result;bar.querySelector('[data-dev-tool=step]').disabled=!!(B?.deploy||s.result)}},
  battleFormHtml(){return '<form data-dev-battle hidden><h2>Army battle laboratory</h2><p>1–10 groups per side, including characters. Each troop group has 1–100 fighters; maximum 200 fighters per army. Duplicate troop types stay independent.</p>'+
    '<div class="lab-presets"><label>Preset<select data-lab-preset></select></label><button type="button" data-lab-action="load">Load preset</button><button type="button" data-lab-action="last">Use last test</button><label>Preset name<input data-lab-preset-name maxlength="32" placeholder="My mixed army"></label><button type="button" data-lab-action="save">Save / replace named preset</button><button type="button" data-lab-action="delete">Delete selected user preset</button></div>'+
    '<div class="lab-armies">'+['left','right'].map(side=>'<section data-lab-side="'+side+'"><h3>'+side[0].toUpperCase()+side.slice(1)+' army</h3><p data-lab-budget role="status"></p><div data-lab-rows></div><button type="button" data-lab-add="'+side+'">Add group</button></section>').join('')+'</div>'+
    '<div class="dev-grid"><label>Separation without deployment (pixels)<input name="distance" type="number" min="40" max="800" value="220" required></label><label>Random seed<input name="seed" type="number" min="0" max="4294967295" value="42" required></label><label>Terrain<select name="terrain"><option value="open">Open</option><option value="forest">Forest</option><option value="hill">Hill</option></select></label><label>Climate<select name="climate">'+CLIMS.map(k=>'<option>'+k+'</option>').join('')+'</select></label></div>'+
    '<div class="dev-checks">'+[['deploy','Deploy left army before battle'],['ai','AI commands left side'],['paused','Start paused (also after Begin)'],['morale','Morale/routing']].map(([k,n])=>'<label><input name="'+k+'" type="checkbox" checked> '+n+'</label>').join('')+'</div><p>The current hero is left-side only. Companions are independent level-1 templates, not campaign recruits. Each character needs one group and count 1. The right army deploys automatically. Begin ends deployment; Step works after Begin. Tests cannot change campaign saves.</p><button type="submit" data-lab-start>Start isolated army test</button><div data-dev-error role="alert"></div></form>'},
  labRowHtml(side,row,open=false){
    const option=(id,name)=>'<option value="'+htmlText(id)+'"'+(row.type===id?' selected':'')+'>'+htmlText(name)+'</option>',
      options=(side==='left'?option('hero','Your hero (current build/equipment)'):'')+Object.entries(ST).sort((a,b)=>a[1].n.localeCompare(b[1].n)).map(([id,s])=>option(id,(Object.hasOwn(COMPS,id)?'Companion template: ':'')+s.n+' ['+id+']')).join('');
    return '<details data-lab-row'+(open?' open':'')+'><summary><span data-lab-summary></span></summary><div class="lab-row-actions"><button type="button" data-lab-row-action="up" aria-label="Move group up">↑</button><button type="button" data-lab-row-action="down" aria-label="Move group down">↓</button><button type="button" data-lab-row-action="remove">Remove group</button></div><div class="lab-row-fields"><label class="lab-unit">Unit<select data-lab-field="type">'+options+'</select></label><label>Count<input data-lab-field="count" type="number" min="1" max="'+(row.type==='hero'||Object.hasOwn(COMPS,row.type)?1:100)+'" value="'+row.count+'" required></label><label>Formation<select data-lab-field="form">'+Object.entries(FORMS).map(([id,f])=>'<option value="'+id+'"'+(row.form===id?' selected':'')+'>'+f.n+'</option>').join('')+'</select></label><label>Files (0 = auto)<input data-lab-field="files" type="number" min="0" max="100" value="'+(row.files||0)+'" required></label><label>Name (optional)<input data-lab-field="name" maxlength="32" value="'+htmlText(row.name||'')+'"></label></div></details>';
  },
  readBattleForm(){
    const f=this.root.querySelector('[data-dev-battle]'),c={mode:'army'};
    for(const side of ['left','right'])c[side+'Groups']=[...f.querySelectorAll('[data-lab-side="'+side+'"] [data-lab-row]')].map(row=>Object.fromEntries(['type','count','form','files','name'].map(k=>{const value=row.querySelector('[data-lab-field="'+k+'"]').value;return [k,['count','files'].includes(k)?Number(value):value]})));
    for(const k of ['terrain','climate'])c[k]=f.elements[k].value;for(const k of ['distance','seed'])c[k]=Number(f.elements[k].value);for(const k of ['ai','paused','morale','deploy'])c[k]=f.elements[k].checked;return c;
  },
  applyBattleConfig(raw){const c=BattleLab.validate(raw),f=this.root.querySelector('[data-dev-battle]');for(const side of ['left','right'])f.querySelector('[data-lab-side="'+side+'"] [data-lab-rows]').innerHTML=c[side+'Groups'].map((r,i)=>this.labRowHtml(side,r,i===0)).join('');for(const k of ['terrain','climate','distance','seed'])f.elements[k].value=c[k];for(const k of ['ai','paused','morale','deploy'])f.elements[k].checked=c[k];f.querySelector('[data-dev-error]').textContent='';this.refreshLabRows()},
  refreshLabRows(){
    for(const side of ['left','right']){const box=this.root.querySelector('[data-lab-side="'+side+'"]'),rows=[...box.querySelectorAll('[data-lab-row]')];let total=0;
      rows.forEach((row,i)=>{const type=row.querySelector('[data-lab-field="type"]').value,count=Number(row.querySelector('[data-lab-field="count"]').value),name=row.querySelector('[data-lab-field="name"]').value;
        total+=count;row.querySelector('[data-lab-summary]').textContent=(i+1)+'. '+(name||ST[type]?.n||'Your hero')+' × '+count;
        for(const action of ['up','down','remove'])row.querySelector('[data-lab-row-action="'+action+'"]').disabled=action==='up'?i===0:action==='down'?i===rows.length-1:rows.length===1;
      });
      const budget=box.querySelector('[data-lab-budget]');budget.textContent=rows.length+' / 10 groups · '+total+' / 200 fighters';budget.classList.toggle('dev-error',total>200);box.querySelector('[data-lab-add]').disabled=rows.length>=10;
    }
  },
  fillLabPresets(selectedName){this.presetEntries=[...BattleLab.builtins().map((p,i)=>({...p,key:'b'+i,builtin:true})),...BattleLab.savedPresets().map((p,i)=>({...p,key:'u'+i,builtin:false}))];const select=this.root.querySelector('[data-lab-preset]');select.innerHTML='<option value="">Choose a preset</option>'+this.presetEntries.map(p=>'<option value="'+p.key+'">'+htmlText((p.builtin?'Built-in: ':'Saved: ')+p.name)+'</option>').join('');if(selectedName)select.value=this.presetEntries.find(p=>!p.builtin&&p.name===selectedName)?.key||''},
  labError(message){const out=this.root.querySelector('[data-dev-error]');out.textContent=message;out.scrollIntoView({block:'nearest'})},
  labAction(e){
    const add=e.target.closest('[data-lab-add]'),button=e.target.closest('[data-lab-row-action]'),action=e.target.closest('[data-lab-action]');
    if(!add&&!button&&!action)return;
    try{
      if(add){const list=this.root.querySelector('[data-lab-side="'+add.dataset.labAdd+'"] [data-lab-rows]');if(list.children.length>=10)return;for(const row of list.children)row.open=false;list.insertAdjacentHTML('beforeend',this.labRowHtml(add.dataset.labAdd,{type:'hum_foot',count:10,form:'line',files:0},true));list.lastElementChild.querySelector('select').focus()}
      if(button){const row=button.closest('[data-lab-row]'),list=row.parentElement,a=button.dataset.labRowAction;if(a==='remove'&&list.children.length>1){const next=row.nextElementSibling||row.previousElementSibling;row.remove();next?.querySelector('summary').focus()}else{if(a==='up'&&row.previousElementSibling)list.insertBefore(row,row.previousElementSibling);else if(a==='down'&&row.nextElementSibling)list.insertBefore(row.nextElementSibling,row);button.focus()}}
      if(action){const f=this.root.querySelector('[data-dev-battle]'),a=action.dataset.labAction,p=this.presetEntries.find(p=>p.key===f.querySelector('[data-lab-preset]').value),name=f.querySelector('[data-lab-preset-name]');
        if(a==='last'){if(!BattleLab.last)throw Error('No previous test configuration.');this.applyBattleConfig(BattleLab.last)}
        if(a==='load'){if(!p)throw Error('Choose a preset first.');this.applyBattleConfig(p.config);name.value=p.builtin?'':p.name}
        if(a==='save'){const saved=BattleLab.savePreset(name.value,this.readBattleForm());this.fillLabPresets(saved.name)}
        if(a==='delete'){if(!p||p.builtin)throw Error('Select a saved user preset to delete; built-ins are read-only.');BattleLab.deletePreset(p.name);this.fillLabPresets();name.value=''}
      }
      this.refreshLabRows();this.root.querySelector('[data-dev-error]').textContent='';
    }catch(err){this.labError(err.message)}
  },
  init(){
    if(this.root)return;
    // (opened from Settings → Developer tools, or ` or F2: ui.js settingAct)
    const root=this.root=document.createElement('section');root.id='dev-console';root.hidden=true;root.setAttribute('role','dialog');root.setAttribute('aria-label','Developer tools');root.setAttribute('aria-modal','true');
    root.innerHTML='<div class="dev-window"><header><strong>Developer tools</strong><button type="button" data-dev-tab="console">Console</button><button type="button" data-dev-tab="battle">Battle test</button><button type="button" data-dev-close aria-label="Close developer tools">Close · Esc</button></header><p>Simulation pauses while this window is open. Campaign cheats can be saved; tests are isolated.</p><div data-dev-console><div data-dev-output role="log" aria-live="polite"></div><form data-dev-form><label for="dev-command">Command</label><input id="dev-command" data-dev-command autocomplete="off" spellcheck="false" placeholder="help"><button type="submit">Run</button></form></div><section data-dev-report hidden><h2>Battle laboratory report</h2><button type="button" data-lab-export>Download JSON</button><div data-lab-report-content></div></section>'+this.battleFormHtml()+'</div>';
    document.body.append(root);this.applyBattleConfig({leftGroups:[{type:'hum_bow',count:1}],rightGroups:[{type:'hum_foot',count:1}]});this.fillLabPresets();
    root.addEventListener('click',e=>{e.stopPropagation();const tab=e.target.closest('[data-dev-tab]');if(tab)this.show(tab.dataset.devTab);if(e.target.closest('[data-dev-close]'))this.close()});
    root.addEventListener('click',e=>{if(e.target.closest('[data-lab-export]'))try{BattleLab.exportReport()}catch(err){this.write(err.message,true)}});
    root.addEventListener('click',e=>this.labAction(e));
    root.addEventListener('input',e=>{if(e.target.closest('[data-lab-row]'))this.refreshLabRows()});
    root.addEventListener('invalid',e=>{const row=e.target.closest('[data-lab-row]');if(row)row.open=true},true);
    root.addEventListener('change',e=>{const row=e.target.closest('[data-lab-row]');if(!row)return;if(e.target.dataset.labField==='type'){const type=e.target.value,character=type==='hero'||Object.hasOwn(COMPS,type),count=row.querySelector('[data-lab-field="count"]'),form=row.querySelector('[data-lab-field="form"]');count.max=character?1:100;if(character){count.value=1;row.querySelector('[data-lab-field="files"]').value=0}if(character||FORMS[form.value].who&&!FORM_WHO[FORMS[form.value].who]({s:ST[type]}))form.value='line'}this.refreshLabRows()});
    root.querySelector('[data-dev-form]').addEventListener('submit',e=>{e.preventDefault();const input=root.querySelector('[data-dev-command]');this.submit(input.value);input.value=''});
    root.querySelector('[data-dev-battle]').addEventListener('submit',e=>{e.preventDefault();try{this.labStart(this.readBattleForm());root.querySelector('[data-dev-error]').textContent=''}catch(err){this.labError(err.message)}});
    window.addEventListener('keydown',e=>{
      if((e.code==='Backquote'||e.key==='F2')&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat)this.opened?this.close():this.show();return}
      if(this.opened){if(e.key==='Escape'){e.preventDefault();this.close()}else if((e.key==='ArrowUp'||e.key==='ArrowDown')&&e.target.matches('[data-dev-command]')){e.preventDefault();this.historyAt=clamp(this.historyAt+(e.key==='ArrowUp'?-1:1),0,this.history.length);e.target.value=this.history[this.historyAt]||''}else if(e.key==='Tab'){const items=[...root.querySelectorAll('button,input,select')].filter(n=>n.offsetParent!==null),i=items.indexOf(document.activeElement);if(e.shiftKey&&i<=0||!e.shiftKey&&i===items.length-1){e.preventDefault();items[e.shiftKey?items.length-1:0].focus()}}e.stopPropagation();return}
      if(BattleLab.active&&e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();this.show('battle')}
    },true);
    window.addEventListener('keyup',e=>{if(this.opened)e.stopPropagation()},true);
    const bar=document.createElement('div');bar.id='dev-lab-bar';bar.hidden=true;bar.innerHTML='<span></span><button type="button" data-dev-tool="report">Report</button>'+[['pause','Pause'],['step','Step'],['restart','Restart'],['exit','Exit test'],['tools','Tools']].map(([k,n])=>'<button type="button" data-dev-tool="'+k+'">'+n+'</button>').join('');document.body.append(bar);
    bar.addEventListener('click',e=>{e.stopPropagation();const b=e.target.closest('[data-dev-tool]');if(!b)return;try{if(b.dataset.devTool==='tools')this.show('battle');else if(b.dataset.devTool==='report')this.show('report');else this.submit(b.dataset.devTool);this.labStatus()}catch(err){this.show();this.write(err.message,true)}});
    this.write(this.help);
  }
};
