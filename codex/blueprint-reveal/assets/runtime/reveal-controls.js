/* SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Moazam Ali
 */
/** Optional development controls. No UI framework or global CSS required. */
export function mountRevealControls(controller,{parent=document.body}={}) {
  if(!controller.enabledControls)return()=>{};
  const host=document.createElement('div');host.dataset.blueprintControls='';
  const shadow=host.attachShadow({mode:'open'}),style=document.createElement('style');
  style.textContent=`:host{position:fixed;bottom:16px;right:16px;z-index:2140;color-scheme:light;font:12px/1.5 system-ui,sans-serif;color:#273323}*{box-sizing:border-box}details{width:min(340px,calc(100vw - 32px));background:#fcfdfa;border:1px solid #cdd6c6;border-radius:9px;box-shadow:0 8px 30px #26331e22}summary{padding:11px 14px;cursor:pointer;font-weight:600}section{padding:0 14px 14px;display:grid;grid-template-columns:1fr 1fr;gap:10px}label{display:flex;flex-direction:column;gap:4px}select,input[type=number],button{font:inherit;color:inherit;background:white;border:1px solid #cbd5c3;border-radius:4px;min-height:32px;padding:5px 7px;min-width:0;width:100%}input{accent-color:#526b43}input[type=checkbox]{width:14px;height:14px}label.check{flex-direction:row;align-items:center;gap:6px;min-height:28px}button{cursor:pointer}button:hover{background:#edf2e8}:focus-visible{outline:2px solid #4c713c;outline-offset:3px}.wide{grid-column:1/-1}.buttons{display:flex;gap:6px}.note{margin:0;color:#56684b;font-size:11px}output{display:block;min-height:17px}`;
  const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='Blueprint reveal controls';details.append(summary);
  const section=document.createElement('section');details.append(section);shadow.append(style,details);parent.append(host);
  const inputs=new Map();
  function control(key,title,values){
    const label=document.createElement('label');label.append(document.createTextNode(title));
    const input=document.createElement('select');input.setAttribute('aria-label',title);
    for(const [value,text] of values){const option=document.createElement('option');option.value=value;option.textContent=text;input.append(option);}
    input.addEventListener('change',()=>controller.setOptions({[key]:['density','duration','speed'].includes(key)?Number(input.value):input.value}));
    label.append(input);section.append(label);inputs.set(key,input);
  }
  control('direction','Reveal from',[['diagonal','Top-left diagonal'],['top','Top'],['left','Left'],['bottom','Bottom'],['right','Right'],['diagonal-reverse','Bottom-right diagonal'],['center','Center outward']]);
  control('material','Line treatment',[['hybrid','Dots + dashes'],['dots','Dotted'],['lines','Drafting lines']]);
  control('density','Point spacing',[['5','Dense · 5px'],['8','Reference · 8px'],['13','Sparse · 13px']]);
  control('duration','Duration',[['1000','1 second'],['1800','1.8 seconds'],['2400','2.4 seconds'],['4800','4.8 seconds'],['7200','7.2 seconds']]);
  control('speed','Speed',[['0.5','0.5×'],['1','1×'],['1.5','1.5×'],['2','2×']]);
  for(const [key,title] of [['enabled','Enabled'],['guides','Guides'],['movement','Moving points & lines']]){
    const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.setAttribute('aria-label',title);
    input.addEventListener('change',()=>controller.setOptions({[key]:input.checked}));label.append(input,document.createTextNode(title));section.append(label);inputs.set(key,input);
  }
  const scrubLabel=document.createElement('label');scrubLabel.className='wide';scrubLabel.textContent='Inspect timeline';const scrub=document.createElement('input');scrub.type='range';scrub.min='0';scrub.max='100';scrub.value='100';scrub.setAttribute('aria-label','Inspect reveal timeline');scrub.addEventListener('input',()=>controller.seekAll(Number(scrub.value)/100));scrubLabel.append(scrub);section.append(scrubLabel);
  const buttons=document.createElement('div');buttons.className='buttons wide';section.append(buttons);
  for(const [title,action] of [['Replay',()=>controller.replayAll()],['Pause',()=>controller.pauseAll()],['Reset',()=>controller.reset()]]){const button=document.createElement('button');button.textContent=title;button.addEventListener('click',action);buttons.append(button);}
  const note=document.createElement('p');note.className='note wide';note.textContent='Preview changes are temporary. Copy these defaults into blueprint-reveal.config.js to keep them.';section.append(note);
  const copy=document.createElement('button');copy.className='wide';copy.textContent='Copy current defaults';const result=document.createElement('output');result.className='wide note';result.setAttribute('role','status');
  copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(JSON.stringify(controller.getSettings(),null,2));result.textContent='Copied defaults; paste them into the config file.';}catch{result.textContent='Clipboard unavailable. Read the current settings in the panel.';}});section.append(copy,result);
  const unsubscribe=controller.subscribe(sync);
  function sync(settings){
    for(const [key,input] of inputs){
      if(input.type==='checkbox')input.checked=settings[key]!==false;
      else{const value=String(settings[key]);if(![...input.options].some(option=>option.value===value)){const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);}input.value=value;}
    }
  }
  sync(controller.getSettings());
  const cleanup=()=>{unsubscribe();host.remove();};controller.setControlsCleanup(cleanup);return cleanup;
}
