'use strict';
// Visual feedback must preserve native actions, cancellation and dynamically rebuilt controls.
window.RUN=async()=>{const {ok,exc,out}=Kit.report(),host=document.createElement('div'),wait=n=>new Promise(r=>setTimeout(r,n));
 host.className='campaign-world';host.style.cssText='position:fixed;left:20px;top:20px;z-index:999999';host.innerHTML='<div class="dockrow sys"><button type="button" class="dbtn" id="feedbackFixture"><span>Test control</span></button></div>';document.body.append(host);
 let b=host.querySelector('button'),actions=0;b.style.transition='none';b.addEventListener('click',()=>actions++);
 try{
  const base=getComputedStyle(b).filter;b.querySelector('span').click();await Promise.resolve();
  ok(actions===1&&b.classList.contains('ui-clicked')&&getComputedStyle(b).filter!==base,'a nested-icon click performs its action once and leaves visible tap feedback after release');
  await wait(220);ok(!b.classList.contains('ui-clicked')&&getComputedStyle(b).filter===base,'tap lighting clears without leaving a stuck pressed state');
  b.click();await wait(120);b.click();await wait(100);ok(b.classList.contains('ui-clicked'),'rapid repeated taps keep feedback until the last tap completes');await wait(220);
  for(const [key,value] of [['class','dbtn on'],['class','dbtn selected'],['aria-pressed','true'],['aria-selected','true'],['aria-expanded','true']]){
   b.setAttribute(key,value);ok(getComputedStyle(b).outlineStyle==='solid'&&getComputedStyle(b).outlineWidth==='1px','persistent '+key+'='+value+' retains a visible selected rim under the illustrated skin');b.setAttribute('class','dbtn');if(key!=='class')b.removeAttribute(key);
  }
  const before=actions;b.disabled=true;b.click();b.dispatchEvent(new MouseEvent('click',{bubbles:true}));await Promise.resolve();
  ok(!b.classList.contains('ui-clicked')&&actions===before+1&&Number(getComputedStyle(b).opacity)<1,'native disabled buttons ignore activation and synthetic clicks cannot light disabled artwork');b.disabled=false;
  b.setAttribute('aria-disabled','true');b.click();await Promise.resolve();ok(!b.classList.contains('ui-clicked')&&Number(getComputedStyle(b).opacity)<1,'ARIA-disabled controls use the same dimmed state without press feedback');b.removeAttribute('aria-disabled');
  b.addEventListener('click',e=>e.preventDefault(),{once:true});b.click();await Promise.resolve();ok(!b.classList.contains('ui-clicked'),'cancelled actions do not leave a click highlight');
  b.addEventListener('click',()=>b.replaceWith(b.cloneNode(true)),{once:true});b.click();await Promise.resolve();b=host.querySelector('button');ok(b.classList.contains('ui-clicked'),'a control rebuilt during its action receives feedback through its stable id');await wait(220);
  ok(!b.classList.contains('ui-clicked'),'feedback on a rebuilt control also clears');
  const transient=document.createElement('button');transient.className='btn';host.append(transient);transient.addEventListener('click',()=>transient.remove());transient.click();await Promise.resolve();ok(!transient.isConnected&&!transient.classList.contains('ui-clicked'),'a removed control without an id safely skips deferred feedback');
  b.classList.add('on');b.focus();ok(b.matches(':focus-visible')&&getComputedStyle(b).outlineWidth==='2px'&&getComputedStyle(b).outlineOffset==='3px','a selected control still has a separate outer keyboard-focus ring');
 }catch(e){exc(e)}finally{host.remove();out()}
};
