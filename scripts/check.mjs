#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {scanRelease} from './audit-release.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export function validateSkill(directory){
  const text=fs.readFileSync(path.join(directory,'SKILL.md'),'utf8');
  const front=text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if(!front)throw new Error('Missing skill frontmatter');
  if(!/^name: blueprint-reveal\s*$/m.test(front[1]))throw new Error('Unexpected skill name');
  if(!/^description: "[^\r\n]+"\s*$/m.test(front[1]))throw new Error('Missing single-line skill description');
  if(!/^license: MIT\s*$/m.test(front[1]))throw new Error('Missing skill license');
  if(/\[TODO:/.test(text))throw new Error('Unfinished skill scaffold');
  for(const match of text.matchAll(/\]\((references\/[^)]+)\)/g))if(!fs.existsSync(path.join(directory,match[1])))throw new Error('Missing skill reference');
}
export async function check(){
  for(const tool of ['codex','claude-code']){
    const skill=path.join(root,tool,'blueprint-reveal');validateSkill(skill);
    for(const name of ['blueprint-reveal.js','blueprint-geometry.js','project-controller.js','reveal-controls.js'])await import(pathToFileURL(path.join(skill,'assets/runtime',name)).href);
    await import(pathToFileURL(path.join(skill,'scripts/scaffold.mjs')).href);
  }
  const audit=scanRelease(root);if(audit.findings.length)throw new Error(`Publication audit failed: ${JSON.stringify(audit.findings)}`);
  return {skills:2,sourceFiles:audit.files.length};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{const result=await check();console.log(`Checks passed: ${result.skills} skill packages; ${result.sourceFiles} audited files.`);}catch(error){console.error(error.message);process.exitCode=1;}
}
