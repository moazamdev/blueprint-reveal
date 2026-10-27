#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const rules=[
  ['private-key',/-----BEGIN (?:[A-Z]+ )?PRIVATE KEY-----/g],
  ['github-credential',/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,})\b/g],
  ['api-credential',/\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/g],
  ['artifact-credential',/\bart_v\d+_[A-Za-z0-9_]{20,}\b/g],
  ['cloud-access-key',/\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
  ['bearer-credential',/\bBearer\s+[A-Za-z0-9._-]{20,}/g],
  ['hosting-identifier',/\b(?:appgprj|appgrepo|appgdep)_[A-Za-z0-9]{12,}\b/g],
  ['personal-windows-path',/[A-Za-z]:[\\/]+Users[\\/]+(?!Public\b|Default\b)[^\\/\s<>"']+/g],
  ['personal-unix-path',/\/(?:Users|home)\/[A-Za-z0-9_.-]+\//g],
  ['embedded-url-password',/https?:\/\/[^\s/:]+:[^\s/@]+@/g]
];
const blockedDirs=new Set(['.openai','.codex','.claude','.agents','.aws','.ssh','node_modules','__pycache__']);
const allowedExtensions=new Set(['.md','.js','.mjs','.json','.html','.css','.yaml','.yml']);
const allowedBare=new Set(['LICENSE','.gitignore','.gitattributes']);
const previewMedia=new Set(['original-demo.png','original-demo-poster.png','original-demo.gif','original-demo.mp4','monochrome-gallery.png','monochrome-gallery-poster.png','monochrome-gallery.gif','monochrome-gallery.mp4'].map(name=>`docs/media/${name}`));

function validMediaHeader(bytes,extension){
  if(extension==='.png')return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if(extension==='.gif')return ['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString('ascii'));
  if(extension==='.mp4')return bytes.subarray(4,8).toString('ascii')==='ftyp';
  return false;
}
/** Rule matches are reported without their values, to avoid exposing a secret. */
export function scanText(text,file='input'){
  const findings=[];
  for(const [rule,pattern] of rules){pattern.lastIndex=0;for(const match of text.matchAll(pattern))findings.push({file,rule,line:text.slice(0,match.index).split('\n').length});}
  return findings;
}
export function scanRelease(directory=root){
  const findings=[],files=[];
  let mediaManifest={};
  const manifestPath=path.join(directory,'docs/media/manifest.json');
  if(fs.existsSync(manifestPath)){
    try{mediaManifest=JSON.parse(fs.readFileSync(manifestPath,'utf8')).files||{};}
    catch{findings.push({file:'docs/media/manifest.json',rule:'invalid-media-manifest',line:0});}
  }
  function visit(dir){for(const name of fs.readdirSync(dir)){
    const absolute=path.join(dir,name),relative=path.relative(directory,absolute).replaceAll(path.sep,'/'),stat=fs.lstatSync(absolute);
    if(name==='.git'&&dir===directory)continue; // Normal local repository metadata is not publication source.
    if(stat.isSymbolicLink()){findings.push({file:relative,rule:'symbolic-link',line:0});continue;}
    if(stat.isDirectory()){
      if(blockedDirs.has(name)||name==='.git')findings.push({file:relative,rule:'private-or-generated-directory',line:0});
      else visit(absolute);
      continue;
    }
    if(!stat.isFile()){findings.push({file:relative,rule:'non-regular-file',line:0});continue;}
    files.push(relative);
    const bytes=fs.readFileSync(absolute);
    if(previewMedia.has(relative)){
      if(!validMediaHeader(bytes,path.extname(name)))findings.push({file:relative,rule:'invalid-preview-media',line:0});
      if(bytes.length>12*1024*1024)findings.push({file:relative,rule:'oversized-preview-media',line:0});
      const expected=mediaManifest[relative];
      if(!expected||expected.bytes!==bytes.length||expected.sha256!==createHash('sha256').update(bytes).digest('hex'))findings.push({file:relative,rule:'unreviewed-preview-media',line:0});
      continue;
    }
    if(!allowedExtensions.has(path.extname(name))&&!allowedBare.has(name)){findings.push({file:relative,rule:'unexpected-file-type',line:0});continue;}
    if(bytes.includes(0)){findings.push({file:relative,rule:'unexpected-binary',line:0});continue;}
    findings.push(...scanText(bytes.toString('utf8'),relative));
  }}visit(directory);
  return {files:files.sort(),findings};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=scanRelease();
  if(report.findings.length){console.error(JSON.stringify({status:'failed',findings:report.findings},null,2));process.exitCode=1;}
  else console.log(`Release audit passed: ${report.files.length} files; no configured secret or private-metadata patterns detected; approved preview media verified.`);
}
