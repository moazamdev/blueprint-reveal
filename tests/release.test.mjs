import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {install,inventory} from '../scripts/install.mjs';
import {scanText,scanRelease} from '../scripts/audit-release.mjs';
import {validateSkill} from '../scripts/check.mjs';
import {createDemoServer} from '../scripts/serve-demo.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
function fixture(t){const directory=fs.mkdtempSync(path.join(os.tmpdir(),'blueprint-release-'));t.after(()=>fs.rmSync(directory,{recursive:true,force:true}));return directory;}
test('both public skill packages have valid structure and identical shared files',()=>{
  const codex=path.join(root,'codex/blueprint-reveal'),claude=path.join(root,'claude-code/blueprint-reveal');
  validateSkill(codex);validateSkill(claude);
  for(const group of ['assets','scripts','references'])assert.deepEqual(inventory(path.join(codex,group)),inventory(path.join(claude,group)));
  const normalize=text=>text.replace('Invoke in Codex with `$blueprint-reveal`','Invoke in TOOL with COMMAND').replace('Invoke in Claude Code with `/blueprint-reveal`','Invoke in TOOL with COMMAND');
  assert.equal(normalize(fs.readFileSync(path.join(codex,'SKILL.md'),'utf8')),normalize(fs.readFileSync(path.join(claude,'SKILL.md'),'utf8')));
});
test('installer dry-run does not write personal or project files',t=>{
  const home=fixture(t),report=install({home,codexHome:'',dryRun:true});
  assert.equal(report.results.length,2);assert.equal(fs.readdirSync(home).length,0);
});
test('portable installer copies both tools and reruns without overwriting',t=>{
  const home=fixture(t);install({home,codexHome:''});
  const report=install({home,codexHome:''});assert.ok(report.results.every(result=>result.action==='unchanged'));
  assert.ok(fs.existsSync(path.join(home,'.claude/skills/blueprint-reveal/SKILL.md')));
  assert.ok(fs.existsSync(path.join(home,'.codex/skills/blueprint-reveal/assets/runtime/LICENSE')));
});
test('installer preflights both destinations before any write',t=>{
  const home=fixture(t),target=path.join(home,'.claude/skills/blueprint-reveal');fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'SKILL.md'),'user version');
  assert.throws(()=>install({home,codexHome:''}),/different/);
  assert.equal(fs.existsSync(path.join(home,'.codex')),false);
});
test('project-scoped installation uses project skill discovery directories',t=>{
  const project=fixture(t);install({scope:'project',project});
  assert.ok(fs.existsSync(path.join(project,'.agents/skills/blueprint-reveal/SKILL.md')));
  assert.ok(fs.existsSync(path.join(project,'.claude/skills/blueprint-reveal/SKILL.md')));
});
test('audit finds constructed credential samples without printing their values',()=>{
  const sample=['gh'+'p_'+'a'.repeat(36),'Bearer'+' '+'b'.repeat(32),['C:','Users','private-person','key.txt'].join('\\')].join('\n');
  const findings=scanText(sample);
  assert.equal(findings.length,3);assert.ok(findings.every(finding=>!JSON.stringify(finding).includes('a'.repeat(36))));
  assert.deepEqual(scanText('direction: diagonal; density: 8; duration: 1800;'),[]);
});
test('publication contains no detected credentials, personal paths or forbidden metadata',()=>{
  const result=scanRelease(root);assert.deepEqual(result.findings,[]);
  assert.ok(result.files.includes('LICENSE'));assert.ok(result.files.includes('.github/workflows/checks.yml'));
});
test('README preview links resolve to all eight reviewed media assets',()=>{
  const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
  const links=new Set([...readme.matchAll(/\]\((docs\/media\/[^)]+)\)/g)].map(match=>match[1]));
  assert.equal(links.size,8);
  for(const link of links)assert.ok(fs.statSync(path.join(root,link)).size>1000);
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs/media/manifest.json'),'utf8'));
  assert.deepEqual([...links].sort(),Object.keys(manifest.files).sort());
  assert.equal(manifest.revealSeconds,7.2);
});
test('approved preview media cannot change without a reviewed manifest update',t=>{
  const directory=fixture(t),media=path.join(directory,'docs/media');fs.mkdirSync(media,{recursive:true});
  for(const name of ['manifest.json','original-demo.png'])fs.copyFileSync(path.join(root,'docs/media',name),path.join(media,name));
  assert.deepEqual(scanRelease(directory).findings,[]);
  fs.appendFileSync(path.join(media,'original-demo.png'),'altered');
  assert.ok(scanRelease(directory).findings.some(finding=>finding.rule==='unreviewed-preview-media'));
});
test('preview exception does not allow arbitrary images or disguised binaries',t=>{
  const directory=fixture(t),media=path.join(directory,'docs/media');fs.mkdirSync(media,{recursive:true});
  fs.writeFileSync(path.join(media,'original-demo.mp4'),'not a video');
  fs.copyFileSync(path.join(root,'docs/media/original-demo.png'),path.join(directory,'unreviewed.png'));
  const findings=scanRelease(directory).findings;
  assert.ok(findings.some(finding=>finding.rule==='invalid-preview-media'));
  assert.ok(findings.some(finding=>finding.rule==='unexpected-file-type'&&finding.file==='unreviewed.png'));
});
test('demo entry redirects to the correct asset base and modules have JavaScript MIME',async t=>{
  const server=createDemoServer();
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const origin=`http://127.0.0.1:${server.address().port}`;
  const entry=await fetch(origin);assert.ok(entry.url.endsWith('/examples/demo/index.html'));assert.equal(entry.status,200);
  const registry=await fetch(new URL('./blueprints.js',entry.url));assert.equal(registry.status,200);assert.match(registry.headers.get('content-type'),/javascript/);
  const runtime=await fetch(`${origin}/codex/blueprint-reveal/assets/runtime/blueprint-reveal.js`);assert.equal(runtime.status,200);assert.match(runtime.headers.get('content-type'),/javascript/);
  assert.equal(runtime.headers.get('x-content-type-options'),'nosniff');
  assert.equal((await fetch(origin,{method:'POST'})).status,405);
  for(const [name,type] of [['original-demo.png','image/png'],['original-demo.gif','image/gif'],['monochrome-gallery.mp4','video/mp4']]){
    const response=await fetch(`${origin}/docs/media/${name}`,{method:'HEAD'});
    assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),type);
  }
});
