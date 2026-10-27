import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {scaffold} from '../codex/blueprint-reveal/scripts/scaffold.mjs';
import {normalizeOptions,resolveOptions,viewportRootMargin} from '../codex/blueprint-reveal/assets/runtime/project-controller.js';
import {revealPolygon,directions} from '../codex/blueprint-reveal/assets/runtime/blueprint-reveal.js';

function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'blueprint-skill-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;}
test('dry run changes nothing; setup copies runtime and reruns without rewriting',t=>{
  const project=fixture(t),report=scaffold({project,dryRun:true,out:'runtime'});
  assert.equal(report.integrationRequired,true);assert.equal(fs.readdirSync(project).length,0);
  const first=scaffold({project,out:'runtime'});assert.ok(first.files.every(file=>file.action==='create'));
  assert.ok(fs.existsSync(path.join(project,'runtime/reveal-controls.js')));
  const second=scaffold({project,out:'runtime'});assert.ok(second.files.every(file=>file.action==='unchanged'));
});
test('reruns preserve user config and blueprints',t=>{
  const project=fixture(t);scaffold({project,out:'runtime'});
  for(const name of ['blueprint-reveal.config.js','blueprint-reveal.blueprints.js'])fs.writeFileSync(path.join(project,name),'export default { userChoice: true };');
  const report=scaffold({project,out:'runtime'});
  assert.equal(report.files.filter(file=>file.action==='preserve').length,2);
  assert.match(fs.readFileSync(path.join(project,'blueprint-reveal.config.js'),'utf8'),/userChoice/);
});
test('modified runtime conflicts before any new file is written',t=>{
  const project=fixture(t);scaffold({project,out:'runtime'});
  fs.appendFileSync(path.join(project,'runtime/blueprint-reveal.js'),'\n// user change');
  fs.unlinkSync(path.join(project,'runtime/reveal-controls.js'));
  assert.throws(()=>scaffold({project,out:'runtime'}),/merge deliberately/);
  assert.equal(fs.existsSync(path.join(project,'runtime/reveal-controls.js')),false);
});
test('output cannot escape project root',t=>{
  const project=fixture(t);
  assert.throws(()=>scaffold({project,out:'../outside'}),/inside/);
  assert.throws(()=>scaffold({project,config:'../config.mjs'}),/inside/);
  assert.throws(()=>scaffold({project,out:project}),/relative/);
  assert.equal(fs.readdirSync(project).length,0);
});
test('global values, scoped overrides and live controls resolve in defined order',()=>{
  const config={defaults:{direction:'top',duration:1800,density:8},groups:{cards:{direction:'left'}},components:{metric:{duration:2400}}};
  const result=resolveOptions(config,'metric','cards',{density:5},{direction:'center'});
  assert.deepEqual(result,{direction:'center',duration:2400,density:5});
  assert.equal(resolveOptions(config,'other').direction,'top');
});
test('colliding output files are rejected before making changes',t=>{
  const project=fixture(t);
  assert.throws(()=>scaffold({project,out:'runtime',config:'runtime/blueprint-reveal.js'}),/distinct/);
  assert.equal(fs.readdirSync(project).length,0);
});
test('invalid panel settings cannot poison renderer; bounds are constrained',()=>{
  assert.throws(()=>normalizeOptions({direction:'random'}));
  assert.throws(()=>normalizeOptions({duration:NaN}));
  assert.throws(()=>normalizeOptions({enabled:'false'}));
  assert.equal(normalizeOptions({duration:20}).duration,100);
  assert.equal(normalizeOptions({density:1}).density,4);
  assert.equal(normalizeOptions({speed:99}).speed,4);
  assert.deepEqual(normalizeOptions({unrelated:'ignored'}),{});
});
test('all surface masks reach a full component',()=>{
  const area=p=>Math.abs(p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0))/2;
  for(const direction of directions){assert.equal(area(revealPolygon(0,direction)),0);assert.equal(area(revealPolygon(1,direction)),1);}
});

test('center activation validates its band and calculates height-based pixel margins',()=>{
  assert.equal(viewportRootMargin(900),' -360px 0px -360px 0px'.trim());
  assert.equal(viewportRootMargin(844,'center',.2),'-337.6px 0px -337.6px 0px');
  assert.equal(viewportRootMargin(600,'center',1),'-0px 0px -0px 0px');
  assert.equal(viewportRootMargin(900,'viewport'),'0px');
  assert.throws(()=>viewportRootMargin(900,'center',0),/viewportBand/);
  assert.throws(()=>viewportRootMargin(900,'center',NaN),/viewportBand/);
  assert.throws(()=>viewportRootMargin(900,'edge'),/activation/);
});
