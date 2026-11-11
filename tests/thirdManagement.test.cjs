const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const pages = ['system/EmailManagement.vue','system/SmsManagement.vue','third/Email.vue','third/OSS.vue','third/SMS.vue']
function messages(locale, namespace) {
 const context={exports:{}}
 const source=fs.readFileSync(__dirname+'/../src/locales/lang/'+locale+'/'+namespace+'.ts','utf8')
 vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,context)
 return context.exports.default
}
for(const locale of ['zh-CN','en']) for(const page of pages) test(`${page} has complete ${locale} labels and validation messages`,()=>{
 const source=fs.readFileSync(__dirname+'/../src/pages/admin/'+page,'utf8')
 const missing=[]
 for(const [,namespace,key] of source.matchAll(/['"](thirdOss|thirdSms|thirdEmail|thirdCommon|emailManagement|smsManagement)\.([^'"]+)['"]/g)) {
  let value=messages(locale,namespace)
  for(const part of key.split('.')) value=value?.[part]
  if(typeof value!=='string'||!value.trim())missing.push(namespace+'.'+key)
 }
 assert.deepEqual([...new Set(missing)],[])
})

const vue = require('vue')
function state(page, api = {}) {
 const file=fs.readFileSync(__dirname+'/../src/pages/admin/'+page,'utf8')
 const fields=page.startsWith('third/')?'maskKey,providerQuery,providerList,visibleProviders':'sendForm,sendFormRef,statusForm,handleSend'+(page.includes('Sms')?',balanceForm':'')
 const script=file.match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1]+'\nexport const state={'+fields+'}'
 const compiled=ts.transpileModule(script,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
 const context={exports:{},defineOptions:()=>{},require(name){
  if(name==='vue')return {...vue,onMounted:()=>{}}
  if(name==='vue-i18n')return {useI18n:()=>({t:key=>key})}
  if(name==='element-plus')return {ElMessage:{success:()=>{},error:()=>{}},ElMessageBox:{}}
  if(name.startsWith('@/api'))return api
  if(name==='@/utils/permission')return {hasPermission:()=>true}
  if(name.endsWith('.scss')||name==='@element-plus/icons-vue')return {}
  throw Error(name)
 }}
 vm.runInNewContext(compiled,context)
 return context.exports.state
}
for(const page of ['third/OSS.vue','third/Email.vue','third/SMS.vue']) test(`${page} masks short secrets and supports provider filtering`,()=>{
 const s=state(page)
 assert.notEqual(s.maskKey('abc'),'abc')
 assert.ok(!s.maskKey('private-credential').includes('private'))
 s.providerList.value=[{providerName:'aliyun',displayName:'阿里云',description:''},{providerName:'tencent',displayName:'腾讯云',description:''}]
 s.providerQuery.value=' ALIYUN '
 assert.equal(s.visibleProviders.value.length,1)
 assert.equal(s.visibleProviders.value[0].providerName,'aliyun')
})
for(const page of ['system/EmailManagement.vue','system/SmsManagement.vue']) test(`${page} clears stale keys when switching providers`,async()=>{
 const s=state(page)
 for(const form of [s.sendForm,s.statusForm,s.balanceForm].filter(Boolean)) {
  form.provider='old';await vue.nextTick();form.keyId=42
  form.provider='new';await vue.nextTick();assert.equal(form.keyId,undefined)
 }
})
test('reorganized email form preserves recipients, content and optional settings in the request',async()=>{
 const calls=[]
 const s=state('system/EmailManagement.vue',{sendEmail:async payload=>{calls.push(payload);return {success:true}}})
 s.sendFormRef.value={validate:async()=>true}
 s.sendForm.provider='smtp';await vue.nextTick()
 Object.assign(s.sendForm,{keyId:7,toEmail:'one@example.test',toEmails:'two@example.test;three@example.test',ccEmails:'cc@example.test',bccEmails:'bcc@example.test',subject:'Hello',textContent:'Plain',htmlContent:'<p>HTML</p>',templateParamsJson:'{"name":"Test"}',customHeadersJson:'{"X-Test":"yes"}',attachmentsJson:'[]'})
 await s.handleSend()
 assert.equal(calls.length,1)
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0].toEmails)),['two@example.test','three@example.test'])
 assert.equal(calls[0].keyId,7)
 assert.equal(calls[0].htmlContent,'<p>HTML</p>')
 assert.equal(calls[0].textContent,'Plain')
 assert.equal(calls[0].customHeaders['X-Test'],'yes')
 assert.equal(calls[0].templateParams.name,'Test')
})
test('reorganized SMS form preserves batch recipients and template parameters',async()=>{
 const calls=[]
 const s=state('system/SmsManagement.vue',{sendSms:async payload=>{calls.push(payload);return {success:true}}})
 s.sendFormRef.value={validate:async()=>true}
 s.sendForm.provider='sms';await vue.nextTick()
 Object.assign(s.sendForm,{keyId:8,phoneNumbers:'13800000000\n13900000000',content:'Test',templateId:'template',signName:'sign',templateParamsJson:'{"code":"1234"}'})
 await s.handleSend()
 assert.equal(calls.length,1)
 assert.deepEqual(JSON.parse(JSON.stringify(calls[0].phoneNumbers)),['13800000000','13900000000'])
 assert.equal(calls[0].templateParams.code,'1234')
 assert.equal(calls[0].keyId,8)
 assert.equal(calls[0].templateId,'template')
})
