/* SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Moazam Ali
 */
/** BlueprintReveal — dependency-free, deterministic DOM + SVG + canvas reveal.
 * This module is independent of the demo, Tailwind, and daisyUI.
 */
const NS = 'http://www.w3.org/2000/svg';
let sequence = 0;
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const part = (t, a, b) => clamp((t - a) / (b - a));
const smooth = t => t * t * (3 - 2 * t);
const ease = t => 1 - (1 - t) ** 3;
const lerp = (a, b, t) => a + (b - a) * t;
export const directions = ['diagonal', 'top', 'left', 'bottom', 'right', 'diagonal-reverse', 'center'];

/** Signed distance through a unit rectangle, normalized to [0,1]. */
export function directionProgress(x, y, direction = 'diagonal') {
  switch (direction) {
    case 'top': return y;
    case 'bottom': return 1 - y;
    case 'left': return x;
    case 'right': return 1 - x;
    case 'diagonal-reverse': return 1 - (x + y) / 2;
    case 'center': return Math.max(Math.abs(x - .5), Math.abs(y - .5)) * 2;
    default: return (x + y) / 2;
  }
}

/** Clip a unit rectangle against the reveal's moving half-plane.
 * These points drive BOTH the SVG blueprint and actual DOM content.
 */
export function revealPolygon(progress, direction = 'diagonal') {
  const t = clamp(progress);
  if (direction === 'center') {
    const a = (1 - t) / 2, b = 1 - a;
    return [[a,a],[b,a],[b,b],[a,b]];
  }
  const polygon = [[0,0],[1,0],[1,1],[0,1]], result = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = directionProgress(...a, direction) - t;
    const db = directionProgress(...b, direction) - t;
    if (da <= 0) result.push(a);
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
      const f = da / (da - db);
      result.push([lerp(a[0],b[0],f),lerp(a[1],b[1],f)]);
    }
  }
  return result.length ? result : [[0,0],[0,0],[0,0]];
}

function el(tag, attrs = {}) {
  const element = document.createElementNS(NS, tag);
  Object.entries(attrs).forEach(([key,value]) => element.setAttribute(key,String(value)));
  return element;
}
function seeded(seed) {
  let state = seed;
  return () => { state = state * 16807 % 2147483647; return (state - 1) / 2147483646; };
}

export class BlueprintReveal {
  constructor(frame, options = {}) {
    if (!(frame instanceof HTMLElement)) throw new TypeError('BlueprintReveal requires an HTML frame element.');
    this.frame = frame;
    this.options = {direction:'diagonal', material:'hybrid', movement:true, density:8, duration:2400, color:'#737e6c', seed:127, ...options};
    this.content = typeof options.content === 'string' ? frame.querySelector(options.content) : options.content || frame.firstElementChild;
    if (!(this.content instanceof HTMLElement)) throw new TypeError('Provide a content element inside the frame.');
    if (!frame.contains(this.content) || this.content === frame) throw new TypeError('Content must be a descendant of the frame.');
    this.original = {framePosition:frame.style.position, clipPath:this.content.style.clipPath, opacity:this.content.style.opacity, filter:this.content.style.filter, inert:this.content.inert};
    if (getComputedStyle(frame).position === 'static') frame.style.position = 'relative';
    this.layer = document.createElement('div');
    this.layer.setAttribute('aria-hidden','true');
    this.layer.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:visible;z-index:2';
    this.canvas = document.createElement('canvas');
    this.svg = el('svg');
    for (const surface of [this.canvas,this.svg]) surface.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible';
    this.layer.append(this.svg,this.canvas);(options.overlayMount||frame).append(this.layer);
    this.ctx = this.canvas.getContext('2d');
    this.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    this.reduceHandler = event => { if(event.matches){this.pause();this.seek(1);} };
    this.reducedMotion.addEventListener('change',this.reduceHandler);
    this.progress = 1;
    this.refresh();
    this.observer = new ResizeObserver(() => {
      if(frame.offsetWidth && frame.offsetHeight && (frame.offsetWidth !== this.width || frame.offsetHeight !== this.height)) this.refresh();
    });
    this.observer.observe(frame);
    this.visibilityHandler = () => { this.lastTime = null; };
    document.addEventListener('visibilitychange',this.visibilityHandler);
  }

  /** Simple layout outlines; custom geometry is best for charts and icons. */
  autoGeometry() {
    const rect = this.content.getBoundingClientRect(), outer = this.frame.getBoundingClientRect();
    const sx = this.width / (outer.width || this.width), sy = this.height / (outer.height || this.height);
    const shapes = [['rect',{x:.5,y:.5,width:this.width-1,height:this.height-1,rx:parseFloat(getComputedStyle(this.content).borderRadius)||0}]];
    const candidates = [...this.content.querySelectorAll('[data-blueprint],h1,h2,h3,p,button,img,svg,input,[role="img"]')].slice(0,64);
    for (const node of candidates) {
      const bounds = node.getBoundingClientRect();
      if (!bounds.width || !bounds.height) continue;
      let x=(bounds.x-rect.x)*sx,y=(bounds.y-rect.y)*sy,w=bounds.width*sx,h=bounds.height*sy;
      if (['H1','H2','H3','P'].includes(node.tagName)) {y+=h*.36;h=Math.max(3,h*.24);}
      shapes.push(['rect',{x,y,width:w,height:h,rx:Math.min(4,h/2)}]);
    }
    return shapes;
  }

  refresh() {
    if(this.destroyed)return this;
    this.width=this.frame.offsetWidth || 250;
    this.height=this.frame.offsetHeight || 280;
    const {width:w,height:h}=this;
    const ratio=Math.min(devicePixelRatio||1,2);
    this.canvas.width=w*ratio;this.canvas.height=h*ratio;this.ctx.setTransform(ratio,0,0,ratio,0,0);
    this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    this.svg.replaceChildren();
    const instance=++sequence,id=`blueprint-clip-${instance}`,maskId=`blueprint-surface-${instance}`,defs=el('defs'),clip=el('clipPath',{id});
    this.clip=el('polygon');clip.append(this.clip);defs.append(clip);this.svg.append(defs);
    // White retains construction; the black polygon removes the finished surface.
    const mask=el('mask',{id:maskId,maskUnits:'userSpaceOnUse',x:-4,y:-4,width:w+8,height:h+8,style:'mask-type:luminance'});
    mask.append(el('rect',{x:-4,y:-4,width:w+8,height:h+8,fill:'white'}));
    this.surfaceCutout=el('polygon',{fill:'black'});mask.append(this.surfaceCutout);defs.append(mask);
    const construction=el('g',{mask:`url(#${maskId})`});this.svg.append(construction);
    this.group=el('g',{'clip-path':`url(#${id})`});construction.append(this.group);
    const supplied=typeof this.options.geometry==='function'?this.options.geometry({frame:this.frame,content:this.content,width:w,height:h}):this.options.geometry;
    const shapes=supplied?.shapes || supplied || this.autoGeometry();
    this.paths=shapes.map(([tag,attrs],index)=>{
      if(!['rect','path','circle','line','ellipse','polyline','polygon'].includes(tag))throw new TypeError(`Unsupported geometry: ${tag}`);
      const path=el(tag,{...attrs,fill:'none',stroke:this.options.color,'stroke-width':index===0?.85:.65,'stroke-linecap':'round'});
      this.group.append(path);
      return {element:path,length:path.getTotalLength(),index};
    });
    const rng=seeded(this.options.seed), spacing=Math.max(4,this.options.density);
    this.points=[];
    this.paths.forEach(({element,length,index})=>{
      const count=Math.ceil(length/(index===0?spacing*.8:spacing));
      for(let i=0;i<count;i++){
        const p=element.getPointAtLength(i/count*length);
        this.points.push({x:p.x,y:p.y,gx:Math.round(rng()*w/14)*14,gy:Math.round(rng()*h/14)*14,seed:rng(),phase:rng()*Math.PI*2,radius:index===0?.9:.65});
      }
    });
    this.matrix=[];
    for(let y=0;y<=h;y+=16)for(let x=0;x<=w;x+=16)this.matrix.push({x,y,phase:rng()*Math.PI*2,seed:rng()});
    this.seek(this.progress);
    return this;
  }

  setOptions(options) {
    const rebuild=options.density!==undefined || options.geometry!==undefined || options.seed!==undefined || options.color!==undefined;
    Object.assign(this.options,options);
    if(!directions.includes(this.options.direction))this.options.direction='diagonal';
    if(rebuild)this.refresh();else this.seek(this.progress);
    return this;
  }

  /** Explicit seeking remains available with reduced motion; autoplay does not. */
  seek(value) {
    if(this.destroyed)return this;
    const t=this.progress=clamp(Number(value)||0),w=this.width,h=this.height,ctx=this.ctx;
    const moving=this.options.movement && !this.reducedMotion.matches;
    const phase=moving?t*20:0;
    const assemble=smooth(part(t,.04,.48));
    const pointAlpha=part(t,0,.07);
    // One shared boundary reveals the real component and erases its blueprint.
    const reveal=smooth(part(t,.42,.72));
    const surfacePolygon=revealPolygon(reveal,this.options.direction);
    this.surfaceCutout.setAttribute('points',surfacePolygon.map(([x,y])=>`${x*w},${y*h}`).join(' '));
    ctx.clearRect(0,0,w,h);ctx.fillStyle=this.options.color;
    // A faint, breathing matrix survives behind the moving construction points.
    const matrixAlpha=part(t,0,.08);
    for(const p of this.matrix){
      const drift=moving?(1-assemble)*2:0;
      ctx.globalAlpha=matrixAlpha*(.055+.065*(1+Math.sin(phase*.6+p.phase))/2);
      ctx.beginPath();ctx.arc(p.x+Math.sin(phase+p.phase)*drift,p.y+Math.cos(phase*.7+p.phase)*drift,.55,0,Math.PI*2);ctx.fill();
    }
    for(const p of this.points){
      const field=directionProgress(p.x/w,p.y/h,this.options.direction);
      const local=ease(clamp((assemble-field*.15-p.seed*.09)/.76));
      const wobble=moving?Math.sin(Math.PI*local)*(3+8*p.seed):0;
      const flutter=moving?Math.sin(phase+p.phase)*(1-smooth(part(t,.65,.9)))*.9:0;
      const x=lerp(p.gx,p.x,local)+Math.sin(phase*.75+p.phase)*wobble+flutter;
      const y=lerp(p.gy,p.y,local)+Math.cos(phase*.65+p.phase)*wobble;
      ctx.globalAlpha=pointAlpha*(.16+p.seed*.56);
      ctx.beginPath();ctx.arc(x,y,p.radius,0,Math.PI*2);ctx.fill();
    }
    const wireAlpha=part(t,.1,.25);
    this.group.style.opacity=String(wireAlpha);
    const trace=ease(part(t,.12,.6));
    const poly=revealPolygon(trace,this.options.direction);
    this.clip.setAttribute('points',poly.map(([x,y])=>`${x*w},${y*h}`).join(' '));
    this.paths.forEach(({element,length,index})=>{
      const material=this.options.material;
      element.setAttribute('stroke-dasharray',material==='lines'?'12 4':material==='dots'?'0.1 4.5':index===0?'0.1 4':'2 4');
      element.setAttribute('stroke-dashoffset',String(moving?-t*(index===0?110:70)-index*1.7:0));
      // Tracing heads and brief trailing segments visibly travel along the geometry.
      if(moving && t>.12 && t<.86 && index%2===0){
        const u=(t*(1.3+index*.014)+index*.137)%1;
        const head=element.getPointAtLength(length*u);
        ctx.globalAlpha=wireAlpha*.72;ctx.beginPath();ctx.arc(head.x,head.y,index===0?1.45:1,0,Math.PI*2);ctx.fill();
        ctx.globalAlpha=wireAlpha*.2;
        for(let k=1;k<=3;k++){const tail=element.getPointAtLength(length*((u-k*.008+1)%1));ctx.beginPath();ctx.arc(tail.x,tail.y,.55,0,Math.PI*2);ctx.fill();}
      }
    });
    // Moving horizontal and vertical drafting cursors accompany the sweep.
    const guideAlpha=this.options.guides===false?0:part(t,0,.1);
    if(guideAlpha>0){
      ctx.globalAlpha=guideAlpha*.23;ctx.strokeStyle=this.options.color;ctx.lineWidth=.5;ctx.setLineDash([1,5]);
      const scan=(t*1.45)%1,x=scan*w,y=((scan+.27)%1)*h;
      ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=guideAlpha*.65;ctx.strokeRect(x-2,y-2,4,4);
    }
    // Erase matrix, particles, tracing heads and cursors inside that same boundary.
    ctx.save();ctx.globalAlpha=1;ctx.globalCompositeOperation='destination-out';
    ctx.beginPath();surfacePolygon.forEach(([x,y],index)=>index?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();ctx.fill();ctx.restore();ctx.globalAlpha=1;
    this.content.style.opacity=this.original.opacity;
    this.content.style.clipPath=reveal>=1?this.original.clipPath:`polygon(${surfacePolygon.map(([x,y])=>`${x*100}% ${y*100}%`).join(',')})`;
    this.content.style.filter=this.original.filter;
    this.content.inert=reveal<1 || this.original.inert;
    this.layer.style.visibility=reveal>=1?'hidden':'visible';
    return this;
  }

  play() {
    if(this.destroyed)return this;
    this.pause();
    if(this.reducedMotion.matches){this.seek(1);return this;}
    if(this.progress>=1)this.seek(0);
    this.playing=true;this.lastTime=null;
    const tick=now=>{
      if(!this.playing)return;
      const dt=this.lastTime===null?0:Math.min(now-this.lastTime,80);this.lastTime=now;
      if(!document.hidden)this.seek(this.progress+dt/Math.max(100,this.options.duration));
      if(this.progress<1)this.raf=requestAnimationFrame(tick);else {this.playing=false;this.options.onComplete?.();}
    };
    this.raf=requestAnimationFrame(tick);return this;
  }
  pause(){this.playing=false;cancelAnimationFrame(this.raf);return this;}
  replay(){this.seek(0);return this.play();}
  destroy(){
    if(this.destroyed)return;
    this.pause();this.observer.disconnect();this.reducedMotion.removeEventListener('change',this.reduceHandler);
    document.removeEventListener('visibilitychange',this.visibilityHandler);this.layer.remove();
    for(const property of ['clipPath','opacity','filter'])this.content.style[property]=this.original[property];
    this.content.inert=this.original.inert;this.frame.style.position=this.original.framePosition;this.destroyed=true;
  }
}
