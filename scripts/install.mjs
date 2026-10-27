#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const repoRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const within=(root,target)=>{const rel=path.relative(root,target);return rel===''||(!rel.startsWith(`..${path.sep}`)&&rel!=='..'&&!path.isAbsolute(rel));};
export function inventory(root){
  const files=[];
  function visit(dir){for(const name of fs.readdirSync(dir)){
    const file=path.join(dir,name),stat=fs.lstatSync(file);
    if(stat.isSymbolicLink())throw new Error('Skill installation refuses symbolic links');
    if(stat.isDirectory())visit(file);else if(stat.isFile())files.push({path:path.relative(root,file),hash:sha(fs.readFileSync(file))});
    else throw new Error('Skill contains a non-regular file');
  }}visit(root);return files.sort((a,b)=>a.path.localeCompare(b.path));
}
/** Preflight all selected targets before copying; existing different skills stay intact. */
export function install({tool='both',scope='user',project,home=os.homedir(),codexHome=process.env.CODEX_HOME,dryRun=false}={}){
  if(!['both','codex','claude-code'].includes(tool))throw new Error('--tool must be codex, claude-code or both');
  if(!['user','project'].includes(scope))throw new Error('--scope must be user or project');
  if(scope==='project'&&!project)throw new Error('--project is required for project-scoped installation');
  const base=scope==='project'?fs.realpathSync(project):path.resolve(home);
  const tools=tool==='both'?['codex','claude-code']:[tool];
  const plans=tools.map(name=>{
    const source=path.join(repoRoot,name,'blueprint-reveal');
    const target=name==='codex'
      ?scope==='project'?path.join(base,'.agents','skills','blueprint-reveal'):path.join(codexHome||path.join(base,'.codex'),'skills','blueprint-reveal')
      :path.join(base,'.claude','skills','blueprint-reveal');
    // Refuse existing destination symlinks rather than copying through them.
    let parent=target;
    while(!fs.existsSync(parent)&&parent!==path.dirname(parent))parent=path.dirname(parent);
    if(fs.existsSync(target)&&fs.lstatSync(target).isSymbolicLink())throw new Error('Skill destination is a symbolic link');
    if(scope==='project'&&!within(base,fs.realpathSync(parent)))throw new Error('Skill destination leaves the selected project');
    const sourceFiles=inventory(source),existing=fs.existsSync(target);
    if(existing&&JSON.stringify(sourceFiles)!==JSON.stringify(inventory(target)))throw new Error(`A different ${name} skill exists at the destination; review it before replacing it`);
    return {tool:name,source,target,sourceFiles,action:existing?'unchanged':'install'};
  });
  if(!dryRun)for(const plan of plans){
    if(plan.action==='install'){fs.mkdirSync(path.dirname(plan.target),{recursive:true});fs.cpSync(plan.source,plan.target,{recursive:true,force:false,errorOnExist:true});}
    if(JSON.stringify(inventory(plan.target))!==JSON.stringify(plan.sourceFiles))throw new Error(`Installed ${plan.tool} file verification failed`);
  }
  return {dryRun,scope,results:plans.map(({tool,target,action,sourceFiles})=>({tool,target,action,files:sourceFiles.length}))};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const options={},args=process.argv.slice(2);
    for(let i=0;i<args.length;i++){
      if(args[i]==='--dry-run'){options.dryRun=true;continue;}
      if(!['--tool','--scope','--project'].includes(args[i])||!args[i+1]||args[i+1].startsWith('--'))throw new Error('Usage: node scripts/install.mjs --tool codex|claude-code|both [--scope user|project] [--project PATH] [--dry-run]');
      options[args[i].slice(2)]=args[++i];
    }
    console.log(JSON.stringify(install(options),null,2));
  }catch(error){console.error(error.message);process.exitCode=1;}
}
