const test=require('node:test')
const assert=require('node:assert/strict')
const fs=require('node:fs')
const vm=require('node:vm')
const ts=require('typescript')
const compile=path=>ts.transpileModule(fs.readFileSync(__dirname+'/../'+path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
const sseContext={exports:{},TextDecoder};vm.runInNewContext(compile('src/utils/sse.ts'),sseContext)
const readEventStream=sseContext.exports.readEventStream
const bytes=new TextEncoder()
function body(text,oneByte=false){const data=bytes.encode(text);return new ReadableStream({start(c){if(oneByte)for(const value of data)c.enqueue(Uint8Array.of(value));else c.enqueue(data);c.close()}})}
test('SSE parser preserves split UTF-8 and CRLF frames, ignores heartbeats and handles multiline JSON',async()=>{
 const rows=[]
 await readEventStream(body(': heartbeat\r\n\r\nevent: progress\r\ndata: {"text":\r\ndata: "中文分片"}\r\n\r\ndata: {"type":"RUN_FINISHED"}\n\n',true),row=>rows.push(row))
 assert.equal(rows.length,2);assert.equal(rows[0].text,'中文分片');assert.equal(rows[1].type,'RUN_FINISHED')
})
test('SSE parser rejects truncated or malformed payloads instead of silently completing',async()=>{
 await assert.rejects(()=>readEventStream(body('data: {"text":"incomplete"}'),()=>{}),/未完整接收/)
 await assert.rejects(()=>readEventStream(body('data: invalid\n\n'),()=>{}))
})
function sharedRequest(fetcher, clock={}){
 let requests=0,loggedOut=0
 const axios={create:()=>({interceptors:{request:{use:()=>{}},response:{use:()=>{}}}})}
 const store={getToken:()=> 'test-token',getTokenType:()=> 'Bearer',getTokenExpires:()=>0,getRefreshToken:()=>'',logout:()=>loggedOut++}
 const ctx={exports:{},AbortController,setTimeout,clearTimeout,...clock,fetch:async(...args)=>{requests++;return fetcher(...args)},require:name=>{
  if(name==='@/config/mock')return {isMockEnabled:()=>false}
  if(name==='axios')return {default:axios}
  if(name==='element-plus')return {ElMessage:{error:()=>{}},ElMessageBox:{alert:()=>Promise.resolve()}}
  if(name==='./env')return {getBaseURL:()=> 'https://example.invalid/iceeboot'}
  if(name==='./sse')return {readEventStream}
  if(name==='@/stores/user')return {useUserStore:()=>store}
  if(name==='@/router')return {default:{push:()=>{}}}
  if(name==='@/locales/useAppI18n')return {t:value=>value}
  throw Error(name)
 }}
 vm.runInNewContext(compile('src/utils/request.ts'),ctx)
 return {request:ctx.exports.request,count:()=>requests,loggedOut:()=>loggedOut}
}
test('stream requests preserve API prefix and Authorization without replaying the submitted turn',async()=>{
 let captured
 const {request,count}=sharedRequest(async(url,init)=>{captured={url,init};return new Response(body('data: {"type":"RUN_FINISHED"}\n\n'),{headers:{'Content-Type':'text/event-stream'}})})
 const rows=[];await request.stream('/api/v1/example',{input:'你好'},row=>rows.push(row))
 assert.equal(captured.url,'https://example.invalid/iceeboot/api/v1/example');assert.equal(captured.init.headers.Authorization,'Bearer test-token')
 assert.equal(JSON.parse(captured.init.body).input,'你好');assert.equal(rows[0].type,'RUN_FINISHED');assert.equal(count(),1)
})
test('stream authentication errors use central logout and never retry the POST',async()=>{
 const {request,count,loggedOut}=sharedRequest(async()=>new Response(JSON.stringify({code:401,message:'expired'}),{status:401,headers:{'Content-Type':'application/json'}}))
 await assert.rejects(()=>request.stream('/api/v1/example',{},()=>{}),/expired/);assert.equal(count(),1);assert.equal(loggedOut(),1)
})

test('a stalled connection times out without replaying the request',async()=>{
 let deadline
 const {request,count}=sharedRequest(async(url,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>reject(new Error('aborted')))),{setTimeout:fn=>{deadline=fn;return 1},clearTimeout:()=>{}})
 const pending=request.stream('/api/v1/example',{},()=>{})
 deadline()
 await assert.rejects(()=>pending,/45秒/);assert.equal(count(),1)
})
