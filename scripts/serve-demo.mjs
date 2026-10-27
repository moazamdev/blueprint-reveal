#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.gif':'image/gif','.mp4':'video/mp4'};
export function createDemoServer(){return http.createServer((request,response)=>{
  if(!['GET','HEAD'].includes(request.method)){response.writeHead(405);response.end();return;}
  try{
    const url=new URL(request.url,'http://localhost');
    if(url.pathname==='/'){response.writeHead(302,{Location:'/examples/demo/index.html'});response.end();return;}
    const pathname=decodeURIComponent(url.pathname);
    const target=path.resolve(root,`.${pathname}`),relative=path.relative(root,target);
    if(relative.startsWith('..')||path.isAbsolute(relative)){response.writeHead(403);response.end();return;}
    if(!fs.existsSync(target)||!fs.statSync(target).isFile()){response.writeHead(404);response.end();return;}
    const real=fs.realpathSync(target),realRelative=path.relative(root,real);
    if(realRelative.startsWith('..')||path.isAbsolute(realRelative)||!types[path.extname(real)]){response.writeHead(403);response.end();return;}
    response.writeHead(200,{'Content-Type':types[path.extname(real)],'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});
    if(request.method==='HEAD')response.end();else fs.createReadStream(real).pipe(response);
  }catch{response.writeHead(400);response.end();}
});}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const server=createDemoServer();server.on('error',()=>{console.error('Demo server could not start. Port 4175 may already be in use.');process.exitCode=1;});
  server.listen(4175,'127.0.0.1',()=>console.log('Blueprint Reveal demo: http://127.0.0.1:4175/ (Ctrl+C to stop)'));
}
