const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
function page(api) {
 api = { sessions: async()=>[], ...api }
 const unmount=[]
 const source=fs.readFileSync(__dirname+'/../src/pages/admin/agent-console/components/AgentConversation.vue','utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]+`
 export const state={select,send,create,loadSessions,older,input,current,messages,failed,sending}`
 const js=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const context={exports:{},defineProps:()=>({agent:{draft:{id:7,code:'chat'}}}),setTimeout:()=>0,clearTimeout:()=>{},require:(name)=>{
  if(name==='vue') return {...vue,onMounted:()=>{},onBeforeUnmount:(fn)=>unmount.push(fn)}
  if(name==='element-plus') return {ElMessage:{error:()=>{}}}
  if(name==='@/api/agentConsole') return {agentConsole:api}
  if(name==='@/utils/permission') return {hasPermission:()=>true}
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
