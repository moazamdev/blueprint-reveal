#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const skillRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
function inside(root,target){const relative=path.relative(root,target);return relative===''||(!relative.startsWith(`..${path.sep}`)&&relative!=='..'&&!path.isAbsolute(relative));}
function destination(root,relative){
  if(path.isAbsolute(relative))throw new Error('Output paths must be project-relative');
  const target=path.resolve(root,relative);if(!inside(root,target)||target===root)throw new Error('Output must stay inside the selected project');
  let parent=target;while(!fs.existsSync(parent))parent=path.dirname(parent);
  if(!inside(root,fs.realpathSync(parent)))throw new Error('Output resolves through a symlink outside the project');
  return target;
}
/** Copy assets only. The coding agent still authors geometry and app integration. */
export function scaffold({project,out='src/blueprint-reveal',config='blueprint-reveal.config.js',registry='blueprint-reveal.blueprints.js',dryRun=false}={}){
  if(!project)throw new Error('Specify --project with the project root');
  const root=fs.realpathSync(project);
  if(!fs.statSync(root).isDirectory())throw new Error('Project root must be a directory');
  const target=destination(root,out),configPath=destination(root,config),registryPath=destination(root,registry);
  const files=fs.readdirSync(path.join(skillRoot,'assets','runtime')).map(name=>({source:path.join(skillRoot,'assets','runtime',name),target:path.join(target,name),preserve:false}));
  files.push({source:path.join(skillRoot,'assets','blueprint-reveal.config.js'),target:configPath,preserve:true});
  files.push({source:path.join(skillRoot,'assets','blueprint-reveal.blueprints.js'),target:registryPath,preserve:true});
  if(new Set(files.map(file=>file.target.toLowerCase())).size!==files.length)throw new Error('Runtime, config and registry destinations must be distinct');
  const plan=files.map(file=>{
    // Validate each final file as well, including preexisting file symlinks.
    destination(root,path.relative(root,file.target));
    const bytes=fs.readFileSync(file.source),exists=fs.existsSync(file.target);
    if(exists&&!fs.statSync(file.target).isFile())throw new Error(`Expected a file at ${path.relative(root,file.target)}`);
    const same=exists&&fs.statSync(file.target).isFile()&&hash(fs.readFileSync(file.target))===hash(bytes);
    return {...file,bytes,action:!exists?'create':same?'unchanged':file.preserve?'preserve':'conflict'};
  });
  const conflicts=plan.filter(file=>file.action==='conflict');
  if(conflicts.length)throw new Error(`Existing runtime differs; merge deliberately instead of overwriting: ${conflicts.map(file=>path.relative(root,file.target)).join(', ')}`);
  if(!dryRun){
    for(const file of plan)if(file.action==='create'){
      fs.mkdirSync(path.dirname(file.target),{recursive:true});fs.writeFileSync(file.target,file.bytes,{flag:'wx'});
    }
  }
  return {project:root,dryRun,integrationRequired:true,files:plan.map(({target,action,bytes})=>({path:path.relative(root,target),action,sha256:hash(bytes)}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const flags=process.argv.slice(2),options={};
    for(let i=0;i<flags.length;i++){
      const flag=flags[i];
      if(flag==='--dry-run'){options.dryRun=true;continue;}
      if(!['--project','--out','--config','--registry'].includes(flag)||!flags[i+1]||flags[i+1].startsWith('--'))throw new Error('Usage: node scaffold.mjs --project ROOT [--out RELATIVE_DIR] [--config RELATIVE_FILE] [--registry RELATIVE_FILE] [--dry-run]');
      options[flag.slice(2)]=flags[++i];
    }
    console.log(JSON.stringify(scaffold(options),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
