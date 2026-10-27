/* SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Moazam Ali
 */
import { BlueprintReveal, directions } from './blueprint-reveal.js';

const optionKeys=['enabled','direction','material','density','duration','speed','guides','movement','color','seed'];
export function normalizeOptions(input={}) {
  const result={};
  for(const key of optionKeys)if(input[key]!==undefined)result[key]=input[key];
  if(result.direction!==undefined&&!directions.includes(result.direction))throw new TypeError('Unknown reveal direction');
  if(result.material!==undefined&&!['hybrid','dots','lines'].includes(result.material))throw new TypeError('Unknown line treatment');
  for(const [key,min,max] of [['density',4,40],['duration',100,30000],['speed',.1,4],['seed',1,2147483646]]){
    if(result[key]===undefined)continue;
    const value=Number(result[key]);if(!Number.isFinite(value))throw new TypeError(`${key} must be finite`);
    result[key]=Math.max(min,Math.min(max,value));
  }
  for(const key of ['enabled','guides','movement'])if(result[key]!==undefined&&typeof result[key]!=='boolean')throw new TypeError(`${key} must be boolean`);
  return result;
}
export function resolveOptions(config,key,group,overrides={},live={}) {
  return normalizeOptions({...config.defaults,...config.groups?.[group],...config.components?.[key],...overrides,...live});
}

// Pixel margins avoid IntersectionObserver's width-relative percentage margins.
export function viewportRootMargin(height,activation='center',band=.2){
  if(activation==='viewport')return '0px';
  if(activation!=='center')throw new TypeError('Unknown viewport activation');
  const fraction=Number(band);
  if(!Number.isFinite(fraction)||fraction<=0||fraction>1)throw new TypeError('viewportBand must be > 0 and <= 1');
  const inset=Math.max(0,Number(height)||0)*(1-fraction)/2;
  return `-${inset}px 0px -${inset}px 0px`;
}

/** A project-level coordinator. Import on the client, register after mounting. */
export function mountBlueprintProject({root=document,config,blueprints={},development=false,observe=false,onError=console.warn}={}) {
  if(!config?.defaults)throw new TypeError('Pass the shared blueprint-reveal config');
  const records=new Map(),listeners=new Set(),globalOptions={};
  const playback={trigger:'visible',activation:'center',viewportBand:.2,once:true,stagger:70,maxStagger:280,threshold:0,loop:false,loopDelay:1200,...config.playback};
  let destroyed=false,observer,mutationObserver,controlsCleanup,inspecting=false,inspectionProgress=null;
  const visible=frame=>{const b=frame.getBoundingClientRect();return b.width>0&&b.height>0&&b.bottom>0&&b.top<innerHeight&&b.right>0&&b.left<innerWidth;};
  const notify=()=>listeners.forEach(listener=>listener(api.getSettings()));
  const clearTimers=record=>{clearTimeout(record.timer);clearTimeout(record.loopTimer);};
  function apply(record){
    const options=resolveOptions(config,record.key,record.group,record.overrides,globalOptions);
    record.enabled=options.enabled!==false;
    record.effect.setOptions({...options,duration:(options.duration||1800)/(options.speed||1)});
    if(!record.enabled){clearTimers(record);record.effect.pause().seek(1);}
  }
  function start(record,delay=0,replay=false){
    clearTimers(record);
    if(!record.enabled)return;
    record.timer=setTimeout(()=>{
      if(destroyed||!record.frame.isConnected)return;
      // Never hide a focused form or button from someone already interacting.
      if(record.frame.contains(document.activeElement)){record.effect.pause().seek(1);return;}
      record.started=true;
      if(replay)record.effect.replay();else record.effect.play();
    },delay);
  }
  function remove(frame){
    const record=records.get(frame);if(!record)return;
    clearTimers(record);observer?.unobserve(frame);record.effect.destroy();records.delete(frame);
  }
  function register(frame,{key=frame.dataset.reveal,group=frame.dataset.revealGroup,content,geometry,overlayMount,overrides={}}={}){
    if(destroyed)throw new Error('Reveal coordinator has been destroyed');
    if(records.has(frame))return()=>remove(frame);
    if(!key)throw new TypeError('Each component needs a stable data-reveal key');
    // An enclosing registered component already owns this visual region.
    if([...records.keys()].some(other=>other.contains(frame)||frame.contains(other)))throw new Error(`Nested reveal frames overlap: ${key}`);
    const target=content||(frame.querySelector('[data-reveal-content]')||frame.firstElementChild);
    const record={frame,key,group,overrides,started:false,enabled:true};
    const factory=geometry||blueprints[key];
    const initial=resolveOptions(config,key,group,overrides,globalOptions);
    record.effect=new BlueprintReveal(frame,{...initial,content:target,geometry:factory,overlayMount,onComplete:()=>{
      if(playback.loop&&record.enabled&&!document.hidden&&visible(frame)){
        record.loopTimer=setTimeout(()=>{if(!document.hidden&&visible(frame))start(record,0,true);},playback.loopDelay);
      }
    }});
    records.set(frame,record);apply(record);
    if(record.enabled){
      if(inspecting){if(inspectionProgress!==null)record.effect.seek(inspectionProgress);if(playback.trigger==='visible')observer?.observe(frame);}
      else if(playback.trigger==='manual')record.effect.seek(1);
      else if(playback.trigger==='load'||!observer)start(record,Math.min((records.size-1)*playback.stagger,playback.maxStagger));
      else {
        // Arm the blueprint before entry, rather than showing the final UI and
        // making it disappear when it reaches the activation band.
        if(!record.effect.reducedMotion.matches&&!frame.contains(document.activeElement))record.effect.seek(0);
        observer.observe(frame);
      }
    }
    return()=>remove(frame);
  }
  function scan(scope=root){
    // DOM mode only: framework integrations should register with lifecycle hooks.
    const frames=[...(scope.matches?.('[data-reveal]')?[scope]:[]),...scope.querySelectorAll('[data-reveal]')];
    for(const frame of frames){
      if(records.has(frame)||frame.closest('[data-reveal-ignore]'))continue;
      try{register(frame);}catch(error){onError(`Blueprint reveal skipped ${frame.dataset.reveal}: ${error.message}`);}
    }
    return api;
  }
  const api={
    register,scan,
    replayAll(){inspecting=false;inspectionProgress=null;let index=0;for(const record of records.values())if(visible(record.frame)){if(playback.once)observer?.unobserve(record.frame);start(record,Math.min(index++*playback.stagger,playback.maxStagger),true);}return api;},
    pauseAll(){inspecting=true;for(const record of records.values()){clearTimers(record);record.effect.pause();}return api;},
    seekAll(progress){inspectionProgress=Math.max(0,Math.min(1,Number(progress)||0));api.pauseAll();for(const record of records.values())if(record.enabled)record.effect.seek(progress);return api;},
    refresh(){for(const record of records.values())record.effect.refresh();return api;},
    setOptions(options,{replay=true}={}){Object.assign(globalOptions,normalizeOptions(options));for(const record of records.values())apply(record);notify();if(replay)api.replayAll();return api;},
    reset(){for(const key of Object.keys(globalOptions))delete globalOptions[key];for(const record of records.values())apply(record);notify();return api.replayAll();},
    getSettings(){return normalizeOptions({...config.defaults,...globalOptions});},
    subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},
    get enabledControls(){return Boolean(config.controls?.enabled&&(development||config.controls.developmentOnly===false));},
    setControlsCleanup(cleanup){controlsCleanup=cleanup;},
    destroy(){if(destroyed)return;destroyed=true;window.removeEventListener('resize',observeViewport);observer?.disconnect();mutationObserver?.disconnect();for(const frame of [...records.keys()])remove(frame);controlsCleanup?.();listeners.clear();}
  };
  function observeViewport(){
    if(destroyed||typeof IntersectionObserver!=='function')return;
    observer?.disconnect();
    observer=new IntersectionObserver(entries=>{
    let index=0;
    for(const entry of entries){
      const record=records.get(entry.target);if(!record||inspecting)continue;
      // Anchor jumps / restored scroll can skip the central band entirely.
      // Already-passed targets must remain readable, rather than stay clipped.
      if(!record.started&&!entry.isIntersecting&&entry.rootBounds&&entry.boundingClientRect.bottom<=entry.rootBounds.top){
        clearTimers(record);record.started=true;record.effect.seek(1);
        if(playback.once)observer.unobserve(record.frame);
        continue;
      }
      if(entry.isIntersecting&&entry.intersectionRect.height>0&&(!record.started||!playback.once)){
        start(record,Math.min(index++*playback.stagger,playback.maxStagger),record.started);
        if(playback.once)observer.unobserve(record.frame);
      }
    }
    },{threshold:playback.threshold,rootMargin:viewportRootMargin(innerHeight,playback.activation,playback.viewportBand)});
    for(const record of records.values())if(record.enabled&&(!record.started||!playback.once)&&playback.trigger==='visible')observer.observe(record.frame);
  }
  observeViewport();
  window.addEventListener('resize',observeViewport,{passive:true});
  if(observe){
    mutationObserver=new MutationObserver(mutations=>{
      let additions=false;
      for(const mutation of mutations)for(const node of mutation.addedNodes)if(node.nodeType===1&&(node.matches?.('[data-reveal]')||node.querySelector?.('[data-reveal]')))additions=true;
      for(const frame of [...records.keys()])if(!frame.isConnected)remove(frame);
      if(additions)scan();
    });mutationObserver.observe(root===document?document.documentElement:root,{childList:true,subtree:true});
  }
  return api;
}
