const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
function page(api, permissions=()=>true) {
 api = { sessions: async()=>[], files: async()=>[], ...api }
 if (!api.invokeStream) api.invokeStream = (code, text, session) => api.invoke?.(code, text, session)
 const unmount=[]
 const source=fs.readFileSync(__dirname+'/../src/pages/admin/agent-console/components/AgentConversation.vue','utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]+`
 export const state={select,send,create,loadSessions,older,input,current,messages,failed,sending,sessionQuery,visibleSessions,renderMarkdown,traces,liveRunId,phase,loadTrace,stop,streamError,showTrace,eventFailed,upload,recover,reuseFile,removeAttachment,pendingAttachments,runFiles,uploading,historyVisible,historyError,chooseSession,inspectorOpen,inspectorTab,openInspector,inspectedRun,inspectedFiles,focusedRunId,flushStreaming:()=>flushStreaming()}`
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const context={exports:{},AbortController,setInterval:()=>0,clearInterval:()=>{},defineProps:()=>({agent:{draft:{id:7,code:'chat'}}}),setTimeout:()=>0,clearTimeout:()=>{},require:(name)=>{
  if(name==='vue') return {...vue,onMounted:()=>{},onBeforeUnmount:(fn)=>unmount.push(fn)}
  if(name==='markdown-it') return {default:require('markdown-it')}
  if(name==='element-plus') return {ElMessage:{error:()=>{},warning:()=>{}},ElMessageBox:{confirm:async()=>{}}}
  if(name==='@/api/agentConsole') return {agentConsole:api}
  if(name==='@/utils/permission') return {hasPermission:permissions}
  throw Error(name)
 }}
 vm.runInNewContext(js,context)
 return {s:context.exports.state,unmount:()=>unmount.forEach(fn=>fn())}
}
const session=(id)=>({agentId:7,sessionId:id,title:id,version:1})
test('restored session is reused for consecutive messages and history is reloaded',async()=>{
 const calls=[]
 const {s}=page({messages:async()=>[],invoke:async(...args)=>calls.push(args)})
 await s.select(session('saved'))
 s.input.value='first';await s.send()
 s.input.value='second';await s.send()
 assert.equal(calls.length,2)
 assert.deepEqual([...calls[0]],['chat','first','saved'])
 assert.deepEqual([...calls[1]],['chat','second','saved'])
})
test('late history from a previous selection cannot replace current messages',async()=>{
 let resolve
 const {s}=page({messages:async(id,session)=>session==='old'?new Promise(r=>resolve=r):[{id:2,content:'new'}]})
 const previous=s.select(session('old'))
 await s.select(session('new'))
 resolve([{id:1,content:'old'}]);await previous
 assert.equal(s.messages.value[0].content,'new')
})
test('history failure prevents sending and a retry restores the conversation',async()=>{
 let failing=true,calls=0
 const {s}=page({messages:async()=>{if(failing)throw Error('offline');return []},invoke:async()=>calls++})
 await s.select(session('saved'));s.input.value='question';await s.send()
 assert.equal(calls,0)
 failing=false;await s.select(session('saved'));s.input.value='question';await s.send()
 assert.equal(calls,1)
})
test('failed send retains the input and reloads stored execution status',async()=>{
 let requests=0
 const {s}=page({messages:async()=>++requests===1?[]:[{id:1,status:'FAILED',content:''}],invoke:async()=>{throw Error('failed')}})
 await s.select(session('saved'));s.input.value='retry me';await s.send()
 assert.equal(s.input.value,'retry me')
 assert.equal(s.messages.value[0].status,'FAILED')
 assert.equal(s.sending.value,false)
})

test('history search filters titles without changing the selected conversation',async()=>{
 const rows=[{...session('first'),title:'项目计划'},{...session('second'),title:'代码审查'}]
 const {s}=page({sessions:async()=>rows,messages:async()=>[]})
 await s.loadSessions()
 s.sessionQuery.value='  审查  '
 assert.equal(s.visibleSessions.value.length,1)
 assert.equal(s.visibleSessions.value[0].sessionId,'second')
 assert.equal(s.current.value.sessionId,'first')
 s.sessionQuery.value=''
 assert.equal(s.visibleSessions.value.length,2)
})
test('assistant Markdown formats text and code while escaping executable content',()=>{
 const {s}=page({})
 const html=s.renderMarkdown('**重点**\n\n```js\nconst value = 1\n```\n\n<script>alert(1)</script>\n\n[危险](javascript:alert(1))\n\n![图片](https://example.invalid/tracker.png)')
 assert.match(html,/<strong>重点<\/strong>/)
 assert.match(html,/<pre><code class="language-js">/)
 assert.ok(!html.includes('<script>'))
 assert.ok(!html.includes('href="javascript:'))
 assert.ok(!html.includes('<img'))
 const link=s.renderMarkdown('[文档](https://example.com)')
 assert.match(link,/target="_blank"/)
 assert.match(link,/rel="noopener noreferrer"/)
})

const progress=(type,sequence,extra={})=>({type,sequence,rootRunId:'run1',runId:'run1',parentRunId:'',agentCode:'chat',title:type,text:'',callId:'reply1',toolName:'',status:'RUNNING',timestamp:Date.now(),...extra})
test('messages and answer deltas appear before completion; child output stays in the trace',async()=>{
 let emit,finish
 const stored=[{id:10,runId:'run1',role:'user',content:'question',status:'SUCCEEDED'},{id:11,runId:'run1',role:'assistant',content:'final answer',status:'SUCCEEDED'}]
 let reads=0
 const {s}=page({messages:async()=>++reads===1?[]:stored,invokeStream:async(code,text,id,onEvent)=>{emit=onEvent;await new Promise(r=>finish=r)}})
 await s.select(session('saved'));s.input.value='question';const pending=s.send()
 await new Promise(setImmediate)
 assert.equal(s.messages.value[0].content,'question');assert.equal(s.sending.value,true)
 emit(progress('RUN_STARTED',1));emit(progress('MODEL_STARTED',2));emit(progress('TEXT_DELTA',3,{text:'first part'}));s.flushStreaming()
 assert.equal(s.messages.value[1].content,'first part');assert.equal(s.input.value,'')
 emit(progress('TEXT_DELTA',4,{runId:'child',parentRunId:'run1',text:'child internals'}));s.flushStreaming()
 assert.equal(s.messages.value[1].content,'first part')
 emit(progress('TOOL_STARTED',5,{toolName:'load_skill_through_path',title:'加载技能',text:'skill: example'}))
 assert.equal(s.traces.value.run1.at(-1).title,'加载技能')
 emit(progress('RUN_FINISHED',6,{status:'SUCCEEDED',text:'final answer'}));finish();await pending
 assert.equal(s.messages.value[1].content,'final answer');assert.equal(s.sending.value,false)
})
test('stop targets current run and interrupted streams retain the question for retry',async()=>{
 let emit,finish,cancelled
 let reads=0
 const {s}=page({messages:async()=>++reads===1?[]:[{id:2,runId:'run1',role:'assistant',content:'partial',status:'CANCELLED'}],
  invokeStream:async(code,text,id,onEvent)=>{emit=onEvent;await new Promise(r=>finish=r)},cancelRun:async id=>{cancelled=id}})
 await s.select(session('saved'));s.input.value='question';const pending=s.send();await new Promise(setImmediate)
 emit(progress('RUN_STARTED',1));await s.stop();assert.equal(cancelled,'run1')
 emit(progress('ERROR',2,{status:'CANCELLED',text:'执行已取消'}));finish();await pending
 assert.equal(s.messages.value[0].content,'partial');assert.equal(s.input.value,'question');assert.equal(s.streamError.value,'执行已取消')
})
test('unmount aborts an active stream and late progress cannot mutate messages',async()=>{
 let emit,signal,finish
 const {s,unmount}=page({messages:async()=>[],invokeStream:async(code,text,id,onEvent,abort)=>{emit=onEvent;signal=abort;await new Promise(r=>finish=r)}})
 await s.select(session('saved'));s.input.value='question';const pending=s.send();await new Promise(setImmediate)
 unmount();assert.equal(signal.aborted,true)
 emit(progress('TEXT_DELTA',1,{text:'late response'}));s.flushStreaming()
 assert.equal(s.messages.value[1].content,'')
 finish();await pending
})
test('late historical trace cannot replace a different selected conversation',async()=>{
 let resolve
 const {s}=page({messages:async()=>[],progress:async()=>new Promise(r=>resolve=r)})
 await s.select(session('old'));const previous=s.loadTrace({runId:'old_run'})
 await s.select(session('new'));resolve([progress('RUN_STARTED',1)]);await previous
 assert.equal(s.traces.value.old_run,undefined)
})

test('provider analysis streams separately and remains visible when history permission is stale',async()=>{
 let emit,finish,queries=0
 const {s}=page({messages:async()=>[],progress:async()=>{queries++;return []},invokeStream:async(code,text,id,onEvent)=>{emit=onEvent;await new Promise(r=>finish=r)}},code=>code!=='ai:session:events:api')
 await s.select(session('saved'));s.input.value='question';const pending=s.send();await new Promise(setImmediate)
 emit(progress('RUN_STARTED',1));emit(progress('MODEL_STARTED',2));emit(progress('REASONING_DELTA',3,{callId:'analysis',text:'模型返回的分析片段'}));s.flushStreaming()
 assert.equal(s.showTrace({runId:'run1'}),true)
 assert.equal(s.traces.value.run1.at(-1).text,'模型返回的分析片段');assert.equal(s.messages.value[1].content,'')
 emit(progress('REASONING_FINISHED',4,{callId:'analysis',text:'完整的模型分析内容',status:'SUCCEEDED'}))
 assert.equal(s.traces.value.run1.filter(row=>row.type.startsWith('REASONING_')).length,1)
 assert.equal(s.traces.value.run1.at(-1).text,'完整的模型分析内容')
 await s.loadTrace({runId:'run1'});assert.equal(queries,0)
 assert.equal(s.eventFailed(progress('TOOL_FINISHED',5,{status:'DENIED'})),true)
 emit(progress('ERROR',6,{status:'FAILED',text:'智能体达到最大执行轮次'}));finish();await pending
})

test('uploads stay in the selected session and oversized batches are rejected before transport',async()=>{
 const calls=[]
 const {s}=page({messages:async()=>[],uploadFile:async(id,sid,file)=>{calls.push([id,sid,file.name]);return {id:'file-1',name:file.name,sizeBytes:file.size,kind:'ATTACHMENT'}}})
 await s.select(session('files'))
 const picker={files:[{name:'data.csv',size:1024}],value:'selected'}
 await s.upload({target:picker})
 assert.deepEqual(calls,[[7,'files','data.csv']])
 assert.equal(s.pendingAttachments.value[0].id,'file-1')
 assert.equal(picker.value,'')
 await s.upload({target:{files:[{name:'big',size:21*1024*1024}],value:'selected'}})
 assert.equal(calls.length,1)
})
test('a conversation cannot switch during an attachment upload',async()=>{
 let resolve
 const {s}=page({messages:async()=>[],uploadFile:()=>new Promise(r=>resolve=r)})
 await s.select(session('original'))
 const pending=s.upload({target:{files:[{name:'file',size:1}],value:'selected'}})
 await s.select(session('other'))
 assert.equal(s.current.value.sessionId,'original')
 resolve({id:'a',name:'file',sizeBytes:1,kind:'ATTACHMENT'});await pending
 assert.equal(s.current.value.sessionId,'original')
})
test('recovery prepares an editable fresh session without invoking the model',async()=>{
 let invokes=0
 const {s}=page({messages:async()=>[],recover:async()=>({session:{...session('retry'),version:1},input:'task plus previous context',attachments:[{id:'copy',name:'data',sizeBytes:10,kind:'ATTACHMENT'}]}),invoke:async()=>invokes++})
 await s.select(session('failed'))
 await s.recover({runId:'failed-run'})
 assert.equal(s.current.value.sessionId,'retry')
 assert.equal(s.current.value.version,1)
 assert.equal(s.input.value,'task plus previous context')
 assert.equal(s.pendingAttachments.value[0].id,'copy')
 assert.equal(invokes,0)
})
test('reused generated files are removed from the next request without deleting history',async()=>{
 let deletes=0
 const {s}=page({messages:async()=>[],deleteFile:async()=>deletes++})
 await s.select(session('files'))
 s.reuseFile({id:'artifact',name:'report',sizeBytes:100,kind:'ARTIFACT'})
 await s.removeAttachment(s.pendingAttachments.value[0])
 assert.equal(s.pendingAttachments.value.length,0)
 assert.equal(deletes,0)
})

test('inspector opens the requested historical turn using the selected session scope',async()=>{
 const calls=[]
 const rows=[{id:1,runId:'older',role:'assistant',createTime:'2026-11-12T12:00:00Z'},{id:2,runId:'latest',role:'assistant',createTime:'2026-11-12T12:01:00Z'}]
 const {s}=page({messages:async()=>rows,progress:async()=>[],files:async(id,sid,run)=>{calls.push([id,sid,run]);return run?[{id:run+'-file',name:'report',sizeBytes:1,kind:'ARTIFACT'}]:[]}})
 await s.select(session('owned'))
 await s.openInspector('files',rows[0])
 assert.equal(s.inspectorOpen.value,true)
 assert.equal(s.inspectorTab.value,'files')
 assert.equal(s.inspectedRun.value.runId,'older')
 assert.equal(s.inspectedFiles.value[0].id,'older-file')
 assert.deepEqual(calls.at(-1),[7,'owned','older'])
})
test('late inspector data from a previous session cannot populate the new session',async()=>{
 let finish
 const {s}=page({messages:async(id,sid)=>[{id:1,runId:sid+'-run',role:'assistant',createTime:'2026-11-12T12:00:00Z'}],progress:async()=>[],files:async(id,sid,run)=>sid==='old'&&run?new Promise(resolve=>finish=resolve):[]})
 await s.select(session('old'))
 const loading=s.openInspector('files',s.messages.value[0])
 await s.select(session('new'))
 finish([{id:'old-private-file',name:'private',sizeBytes:1,kind:'ARTIFACT'}]);await loading
 assert.equal(s.inspectedRun.value.runId,'new-run')
 assert.equal(s.inspectedFiles.value.length,0)
 assert.equal(s.runFiles.value['old-run'],undefined)
})
test('selecting the current history row closes history without clearing its draft',async()=>{
 let loads=0
 const {s}=page({messages:async()=>{loads++;return []}})
 await s.select(session('same'));s.input.value='unsent draft';s.historyVisible.value=true
 await s.chooseSession(session('same'))
 assert.equal(s.historyVisible.value,false)
 assert.equal(s.input.value,'unsent draft')
 assert.equal(loads,1)
})
test('history refresh failure does not invalidate a loaded chat',async()=>{
 const {s}=page({messages:async()=>[],sessions:async()=>{throw Error('offline')}})
 await s.select(session('owned'));await s.loadSessions()
 assert.equal(s.failed.value,false)
 assert.ok(s.historyError.value.includes('无法加载'))
 assert.equal(s.current.value.sessionId,'owned')
})
test('the file inspector cannot request files without list permission',async()=>{
 let calls=0
 const {s}=page({messages:async()=>[],files:async()=>{calls++;return []}},()=>false)
 await s.select(session('owned'));await s.openInspector('files')
 assert.equal(s.inspectorOpen.value,false)
 assert.equal(calls,0)
})
