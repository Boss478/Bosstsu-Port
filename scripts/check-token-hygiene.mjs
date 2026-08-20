#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unused-expressions, @typescript-eslint/no-unused-vars */
import fs from 'node:fs';
import {execSync} from 'node:child_process';
const W=[];
const warn=m=>W.push(m);
const ok=m=>console.log(`OK: ${m}`);
const skip=m=>console.log(`SKIP: ${m}`);
try{let t=fs.readFileSync('.agents/memory.md','utf8');const n=(t.match(/\n/g)||[]).length||t.split('\n').length;
n<=250?ok(`memory.md ${n} <=250`):warn(`memory.md ${n} >250`);}catch(e){warn('memory.md missing')}
try{const f=fs.readdirSync('.agents/report').filter(x=>x.endsWith('.md'));
f.length===13?ok(`report 13 md`):warn(`report ${f.length} md !=13`);
const evals=f.filter(x=>x.startsWith('eval-')).length;
const sess=f.length-evals;
evals===1&&sess===12?ok(`split 12 session +1 eval`):warn(`split ${sess}+${evals} !=12+1`);
if(evals===1){const newest=[...f].filter(x=>x.startsWith('eval-')).sort().pop();
ok(`newest eval ${newest} (filename timestamp)`);}
const non=fs.readdirSync('.agents/report').filter(x=>!x.endsWith('.md')&&x!=='archive');
non.length===0?ok('non-md 0 besides archive'):warn(`non-md ${non.length}: ${non.join(', ')}`);
}catch(e){warn('report check failed '+e.message)}
try{const all=fs.readdirSync('.agents/tasks').filter(x=>x.endsWith('.md')&&x!=='todo.md');
if(all.length<5) skip(`tasks n/a sample ${all.length}<5`);
else{const s=all.map(f=>{let t=fs.readFileSync('.agents/tasks/'+f,'utf8');return{f,l:(t.match(/\n/g)||[]).length||t.split('\n').length,m:fs.statSync('.agents/tasks/'+f).mtimeMs}}).sort((a,b)=>b.m-a.m).slice(0,10);
const bad=s.filter(x=>x.l>60);
bad.length?warn(`tasks ${bad.length}/${s.length} >60: ${bad.map(x=>x.f+':'+x.l).join(', ')}`):ok(`tasks ${s.length} sample <=60`);}
}catch(e){warn('tasks check failed '+e.message)}
try{let out='';try{out=execSync('grep -l "Review gate" .agents/plans/*.md 2>/dev/null',{encoding:'utf8'});}catch{}
const files=out.trim()?out.trim().split('\n').filter(Boolean):[];
if(files.length<5) skip(`verdict n/a sample ${files.length}<5`);
else{const s=files.map(f=>({f,m:fs.statSync(f).mtimeMs})).sort((a,b)=>b.m-a.m).slice(0,5);
const bad=[];
for(const {f}of s){const L=fs.readFileSync(f,'utf8').split('\n');
let a=L.findIndex(x=>x.includes('Review gate'));if(a<0)continue;
let b=L.findIndex((x,i)=>i>a&&x.startsWith('## '));if(b<0)b=L.length;
const len=b-a;if(len>40)bad.push(f.replace('.agents/plans/','')+':'+len);}
bad.length?warn(`verdict ${bad.length}/${s.length} >40: ${bad.join(', ')}`):ok(`verdict ${s.length} sample <=40`);}
}catch(e){warn('verdict check failed '+e.message)}
try{const r=execSync('git ls-files .agents/report/archive | wc -l',{encoding:'utf8'}).trim();
const m=execSync('git ls-files .agents/memory/archive | wc -l',{encoding:'utf8'}).trim();
parseInt(r)>0?ok(`report archive tracked ${r.trim()} files`):warn('report archive not tracked');
parseInt(m)>0?ok(`memory archive tracked ${m.trim()} files`):warn('memory archive not tracked');
}catch(e){warn('archive check failed '+e.message)}
if(W.length){console.log('\nWARN '+W.length+':');W.forEach(x=>console.log('WARN: '+x));}
console.log(`\ncheck:tokens ${W.length?'warn-only':'pass'} (${W.length} warnings)`);
process.exit(0);
