const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const vue = require('vue')
const draft = (code) => ({sourcePath:code,code,name:code,description:'Skill',enabled:true,content:'# Skill',resources:{'scripts/run.py':'pass'},toolIds:[]})
function page(api, existingCodes = []) {
 const events=[], unmount=[]
 const source=fs.readFileSync(__dirname+'/../src/pages/admin/agent-console/components/SkillImportDialog.vue','utf8').split('<script setup lang="ts">')[1].split('</script>')[0]+`
 export const state={mode,file,url,branch,directory,drafts,selected,valid,error,loading,saving,preview,commit,toggleSelection,close,acceptFile,choose,dropFile,removeFile,resetPreview,changeMode}`
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const context={exports:{},defineProps:()=>({existingCodes}),defineEmits:()=>name=>events.push(name),require:name=>{
  if(name==='vue')return {...vue,onBeforeUnmount:fn=>unmount.push(fn)}
  if(name==='element-plus')return {ElMessage:{success:()=>{},error:()=>{}}}
  if(name==='@/api/agentConsole')return {agentConsole:api}
  if(name==='@/utils/permission')return {hasPermission:()=>true}
  throw Error(name)
 }}
 vm.runInNewContext(compiled,context)
 return {s:context.exports.state,events,unmount:()=>unmount.forEach(fn=>fn())}
}
test('preview is read only; conflict can be renamed; selected skills commit without preview-only fields',async()=>{
 const committed=[]
 const {s,events}=page({previewSkillArchive:async()=>({skills:[draft('existing'),draft('other')],warnings:[]}),importSkills:async items=>{committed.push(items);return [{id:1}]}},['existing'])
 s.file.value={name:'skills.zip'};await vue.nextTick();await s.preview()
 assert.equal(committed.length,0)
 assert.equal(s.valid.value,false)
 s.drafts.value[0].code='renamed';s.drafts.value[1].selected=false
 assert.equal(s.valid.value,true)
 await s.commit()
 assert.equal(committed.length,1)
 assert.equal(committed[0].length,1)
 assert.equal(committed[0][0].code,'renamed')
 assert.equal(committed[0][0].resources['scripts/run.py'],'pass')
 assert.equal('sourcePath' in committed[0][0],false)
 assert.equal('selected' in committed[0][0],false)
 assert.deepEqual(events,['imported','close'])
})
test('github preview passes repository, explicit branch and directory then toggles every selection',async()=>{
 const calls=[]
 const {s}=page({previewGithubSkills:async request=>{calls.push(request);return {skills:[draft('one'),draft('two')],warnings:[]}}})
 s.mode.value='github';s.url.value=' https://github.com/owner/repo ';s.branch.value=' feature/new ';s.directory.value=' skills/demo '
 await vue.nextTick();await s.preview()
 assert.equal(calls[0].url,'https://github.com/owner/repo')
 assert.equal(calls[0].ref,'feature/new');assert.equal(calls[0].path,'skills/demo')
 s.toggleSelection();assert.equal(s.selected.value.length,0)
 s.toggleSelection();assert.equal(s.selected.value.length,2)
})
test('duplicate codes block commit and server errors preserve edited previews for retry',async()=>{
 let failed=true,calls=0
 const {s}=page({previewSkillArchive:async()=>({skills:[draft('one'),draft('one')],warnings:[]}),importSkills:async()=>{calls++;if(failed)throw {response:{data:{message:'编码已存在'}}};return []}})
 s.file.value={name:'skills.zip'};await vue.nextTick();await s.preview()
 await s.commit();assert.equal(calls,0)
 s.drafts.value[1].code='two';await s.commit()
 assert.equal(s.error.value,'编码已存在')
 assert.equal(s.drafts.value.length,2)
 failed=false;await s.commit();assert.equal(calls,2)
})
test('closing during a preview ignores late responses; source changes discard stale previews',async()=>{
 let resolve
 const {s,unmount}=page({previewSkillArchive:()=>new Promise(r=>resolve=r)})
 s.file.value={name:'skills.zip'};await vue.nextTick();const pending=s.preview()
 unmount();resolve({skills:[draft('late')],warnings:[]});await pending
 assert.equal(s.drafts.value.length,0)
})
test('double submit creates only one import request',async()=>{
 let resolve,calls=0
 const {s}=page({previewSkillArchive:async()=>({skills:[draft('one')],warnings:[]}),importSkills:()=>{calls++;return new Promise(r=>resolve=r)}})
 s.file.value={name:'skills.zip'};await vue.nextTick();await s.preview()
 const first=s.commit();await s.commit();assert.equal(calls,1)
 resolve([{id:1}]);await first
})

test('drop area validates a single archive and preserves the previous file on invalid input',async()=>{
 const {s}=page({})
 s.dropFile({dataTransfer:{files:[{name:'skills.zip',size:2048}]}})
 assert.equal(s.file.value.name,'skills.zip')
 s.dropFile({dataTransfer:{files:[{name:'bad.exe',size:10}]}})
 assert.equal(s.file.value.name,'skills.zip')
 s.dropFile({dataTransfer:{files:[{name:'one.zip',size:10},{name:'two.zip',size:10}]}})
 assert.equal(s.file.value.name,'skills.zip')
 s.dropFile({dataTransfer:{files:[{name:'large.zip',size:21*1024*1024}]}})
 assert.equal(s.file.value.name,'skills.zip')
 s.loading.value=true
 s.dropFile({dataTransfer:{files:[{name:'other.zip',size:10}]}})
 assert.equal(s.file.value.name,'skills.zip')
 s.loading.value=false;s.removeFile();assert.equal(s.file.value,undefined)
})
test('file picker can reselect the same file and preview can return to source selection',async()=>{
 const {s}=page({previewSkillArchive:async()=>({skills:[draft('one')],warnings:[]})})
 const input={files:[{name:'skills.zip',size:2048}],value:'skills.zip'}
 s.choose({target:input});assert.equal(input.value,'')
 await vue.nextTick();await s.preview();assert.equal(s.drafts.value.length,1)
 s.resetPreview();assert.equal(s.drafts.value.length,0)
 assert.equal(s.file.value.name,'skills.zip')
 s.loading.value=true;s.changeMode('github');assert.equal(s.mode.value,'archive')
 s.loading.value=false;s.changeMode('github');assert.equal(s.mode.value,'github')
})
