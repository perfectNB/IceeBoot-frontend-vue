const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const vue = require('vue')
const ts = require('typescript')
function theme(saved, systemDark = false) {
  const store = new Map(saved ? [['iceeboot-theme', saved]] : [])
  const attributes = new Map(), classes = new Set(), listeners = new Set()
  const html = { setAttribute: (name, value) => attributes.set(name, value), classList: {
    add: name => classes.add(name), remove: name => classes.delete(name),
    toggle: (name, enabled) => enabled ? classes.add(name) : classes.delete(name),
  } }
  const media = { matches: systemDark, addEventListener: (_name, listener) => listeners.add(listener),
    removeEventListener: (_name, listener) => listeners.delete(listener) }
  const source = fs.readFileSync(__dirname + '/../src/utils/theme.ts', 'utf8')
  const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText
  const context = {exports:{},document:{documentElement:html},window:{matchMedia:()=>media},
    localStorage:{getItem:name=>store.get(name)||null,setItem:(name,value)=>store.set(name,value)},
    require:name=>{assert.equal(name,'vue');return vue}}
  vm.runInNewContext(compiled,context)
  return {...context.exports,store,attributes,classes,listeners,systemChange(value){for(const fn of listeners)fn({matches:value})}}
}
test('saved dark theme synchronizes app and Element Plus before rendering',()=>{
  const t=theme('dark');t.initTheme()
  assert.equal(t.attributes.get('data-theme'),'dark')
  assert.equal(t.classes.has('dark'),true)
  assert.equal(t.isDark.value,true)
})
test('initial light theme is explicitly applied even when the state starts false',()=>{
  const t=theme('light',true);t.initTheme()
  assert.equal(t.attributes.get('data-theme'),'light')
  assert.equal(t.classes.has('dark'),false)
})
test('system theme changes keep following the system until the user chooses',async()=>{
  const t=theme(undefined,true);t.initTheme();t.watchSystemTheme();await vue.nextTick()
  assert.equal(t.store.has('iceeboot-theme'),false)
  t.systemChange(false)
  assert.equal(t.attributes.get('data-theme'),'light')
  assert.equal(t.store.has('iceeboot-theme'),false)
  t.setTheme('dark');t.systemChange(false)
  assert.equal(t.attributes.get('data-theme'),'dark')
  assert.equal(t.store.get('iceeboot-theme'),'dark')
})
test('manual toggle applies synchronously and persists the preference',()=>{
  const t=theme('light');t.initTheme();t.toggleTheme()
  assert.equal(t.attributes.get('data-theme'),'dark')
  assert.equal(t.classes.has('dark'),true)
  assert.equal(t.store.get('iceeboot-theme'),'dark')
  t.toggleTheme()
  assert.equal(t.attributes.get('data-theme'),'light')
  assert.equal(t.classes.has('dark'),false)
})
test('system theme listener can be removed on cleanup',()=>{
  const t=theme();const stop=t.watchSystemTheme()
  assert.equal(t.listeners.size,1);stop();assert.equal(t.listeners.size,0)
})
