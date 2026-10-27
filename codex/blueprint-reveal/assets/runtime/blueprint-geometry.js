/* SPDX-License-Identifier: MIT
 * Copyright (c) 2026 Blueprint Reveal contributors
 */
/** Layout-aware blueprint authoring tools. Read DOM only after mount/layout. */
const limits = { nodes: 100, textLines: 80, svgSamples: 160 };
function visible(node) {
  const style=getComputedStyle(node),box=node.getBoundingClientRect();
  return style.display!=='none'&&style.visibility!=='hidden'&&style.opacity!=='0'&&box.width>0&&box.height>0;
}
function mapper(frame) {
  const box=frame.getBoundingClientRect();
  const sx=frame.offsetWidth/(box.width||1),sy=frame.offsetHeight/(box.height||1);
  return {point:(x,y)=>[(x-box.left)*sx,(y-box.top)*sy],box:node=>{
    const b=node.getBoundingClientRect();return {x:(b.left-box.left)*sx,y:(b.top-box.top)*sy,width:b.width*sx,height:b.height*sy};
  }};
}
export function rectFor(frame,node,options={}) {
  const b=mapper(frame).box(node),radius=parseFloat(getComputedStyle(node).borderRadius)||0;
  return ['rect',{...b,rx:Math.min(options.radius??radius,b.width/2,b.height/2)}];
}
export function lineFor(frame,node) {
  const b=mapper(frame).box(node);return ['line',{x1:b.x,y1:b.y+b.height/2,x2:b.x+b.width,y2:b.y+b.height/2}];
}
export function circleFor(frame,node) {
  const b=mapper(frame).box(node);return ['ellipse',{cx:b.x+b.width/2,cy:b.y+b.height/2,rx:b.width/2,ry:b.height/2}];
}
export function svgFor(frame,root) {
  const map=mapper(frame),result=[];
  const paths=root.matches('path,line,rect,circle,ellipse,polyline,polygon')?[root]:[...root.querySelectorAll('path,line,rect,circle,ellipse,polyline,polygon')];
  for(const path of paths.slice(0,limits.nodes)){
    if(path.closest('defs,clipPath,mask')||!visible(path)||typeof path.getTotalLength!=='function')continue;
    let length,matrix;try{length=path.getTotalLength();matrix=path.getScreenCTM();}catch{continue;}
    if(!matrix||!Number.isFinite(length)||length<=0)continue;
    const count=Math.min(limits.svgSamples,Math.max(8,Math.ceil(length/4))),points=[];
    for(let i=0;i<=count;i++){
      const p=path.getPointAtLength(length*i/count),screen=new DOMPoint(p.x,p.y).matrixTransform(matrix);
      points.push(map.point(screen.x,screen.y).join(','));
    }
    result.push(['polyline',{points:points.join(' ')}]);
  }
  return result;
}
export function textFor(frame,root) {
  const map=mapper(frame),shapes=[],range=document.createRange();
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  let node;
  while((node=walker.nextNode())&&shapes.length<limits.textLines){
    if(!node.textContent.trim()||!visible(node.parentElement)||node.parentElement.closest('script,style,[aria-hidden="true"]'))continue;
    range.selectNodeContents(node);
    for(const b of range.getClientRects()){
      if(b.width<1||b.height<1)continue;
      const [x,y]=map.point(b.left,b.top+b.height*.55),[x2]=map.point(b.right,b.top);
      // Actual wrapped line lengths; no private text is serialized into the registry.
      shapes.push(['line',{x1:x,y1:y,x2,y2:y}]);
      if(shapes.length>=limits.textLines)break;
    }
  }
  return shapes;
}
/** Compose semantic anchors; selectors must be grounded in inspected components. */
export function blueprintFor(frame,content,{anchors=[],text=false,outline=true}={}) {
  const shapes=outline?[rectFor(frame,content)]:[];
  for(const anchor of anchors){
    const nodes=anchor.selector===':self'?[content]:[...content.querySelectorAll(anchor.selector)];
    for(const node of nodes.slice(0,limits.nodes)){
      if(!visible(node))continue;
      const kind=anchor.kind||'rect';
      if(kind==='svg')shapes.push(...svgFor(frame,node));
      else if(kind==='text')shapes.push(...textFor(frame,node));
      else shapes.push(kind==='line'?lineFor(frame,node):kind==='circle'?circleFor(frame,node):rectFor(frame,node,anchor));
    }
  }
  if(text)shapes.push(...textFor(frame,content));
  return shapes;
}
