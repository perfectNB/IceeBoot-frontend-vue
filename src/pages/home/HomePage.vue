<template>
  <div ref="pageRoot" class="launch-site" :class="{ 'is-dark': isDark, 'can-reveal': canReveal && !prefersReducedMotion, 'reduce-motion': prefersReducedMotion }">
    <a class="skip-link" href="#capabilities">{{ t('home.skipContent') }}</a>
    <header class="launch-header">
      <div class="launch-width header-inner">
        <a class="brand" href="#" aria-label="IceeBoot"><img class="brand-symbol" src="@/assets/logo.png" alt="" width="32" height="32">IceeBoot<span class="brand-dot">.</span></a>
        <nav :aria-label="t('home.navigation')"><a href="#capabilities">{{ t('home.navCapabilities') }}</a><a href="#integration">{{ t('home.navIntegration') }}</a><a :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></nav>
        <div class="header-actions"><button class="motion-button" :disabled="prefersReducedMotion" :aria-label="t(ambientPaused ? 'home.resumeMotion' : 'home.pauseMotion')" :aria-pressed="ambientPaused" @click="ambientPaused = !ambientPaused"><el-icon aria-hidden="true"><component :is="ambientPaused ? VideoPlay : VideoPause" /></el-icon></button><LanguageSwitcher /><button class="utility-button" :aria-label="t(isDark ? 'home.lightTheme' : 'home.darkTheme')" @click="toggleTheme"><el-icon aria-hidden="true"><component :is="isDark ? Sunny : Moon" /></el-icon></button><button class="nav-cta" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.login') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button></div>
      </div>
    </header>

    <main>
      <section data-scene="hero" class="hero-section">
        <div class="hero-sticky">
          <div class="hero-grid launch-width">
            <div class="hero-copy">
              <p class="eyebrow"><span class="status-dot"></span>{{ t('home.chapter_foundation_eyebrow') }}</p>
              <h1>{{ t('home.heroTitle') }}<span>{{ t('home.heroTitleHighlight') }}</span></h1>
              <p class="hero-description">{{ t('home.heroDescription') }}</p>
              <div class="hero-actions"><button class="launch-button primary" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.experience') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button><a class="text-link" :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></div>
              <div class="hero-spec"><span>JAVA + VUE</span><i></i><span>POWERED BY AGENTSCOPE</span></div>
            </div>
            <div class="hero-art">
              <BrandMascot :paused="motionStopped || showLoginDialog" />
            </div>
          </div>
          <div class="hero-bottom launch-width"><span>{{ t('home.visualCaption') }}</span><a href="#capabilities">{{ t('home.scrollExplore') }}<el-icon aria-hidden="true"><Bottom /></el-icon></a></div>
        </div>
      </section>

      <section id="capabilities" class="manifesto launch-width">
        <p class="eyebrow" data-reveal>LESS PLUMBING. MORE BUILDING.</p>
        <h2 data-reveal>{{ t('home.platformTitle') }}<span>{{ t('home.platformHighlight') }}</span></h2>
        <p data-reveal>{{ t('home.platformDescription') }}</p>
        <nav class="chapter-navigation" :aria-label="t('home.navCapabilities')"><a v-for="(feature, index) in features" :key="feature.kind" :href="`#${feature.kind}`"><span>0{{ index + 1 }}</span>{{ t(`home.section_${feature.kind}`) }}<el-icon aria-hidden="true"><Bottom /></el-icon></a></nav>
      </section>

      <section v-for="(feature, index) in features" :id="feature.kind" :key="feature.kind" :data-scene="feature.kind" class="feature-scene" :class="[`feature-${feature.kind}`, { 'is-reversed': index % 2 === 1 }]">
        <div class="feature-sticky">
          <div class="feature-heading launch-width"><span>0{{ index + 1 }} / {{ feature.eyebrow }}</span><span>ICEEBOOT</span></div>
          <div class="feature-grid launch-width">
            <div class="feature-art">
              <div class="scene-halo" aria-hidden="true"></div>
              <span class="scene-watermark" aria-hidden="true">{{ feature.mark }}</span>
              <AgentCoreScene :kind="feature.kind" :label="t(`home.scene_${feature.kind}`)" :progress="sceneProgress[feature.kind] || 0" :reduced-motion="motionStopped" :dark="isDark" :selection="feature.kind === 'models' ? providers.findIndex(provider => provider.name === selectedProvider.name) : capabilityMask" />
              <div class="scene-caption"><span class="status-dot"></span><span>{{ t(`home.scene_caption_${feature.kind}`) }}</span><span class="scene-coordinate" aria-hidden="true">[ {{ String(Math.round((sceneProgress[feature.kind] || 0) * 100)).padStart(3, '0') }} ]</span></div>
            </div>
            <div class="feature-copy">
              <p class="eyebrow">{{ feature.subheading }}</p>
              <h2><span v-for="(part, partIndex) in t(`home.${feature.title}`).split('，')" :key="partIndex">{{ partIndex ? part : part + (t(`home.${feature.title}`).includes('，') ? '，' : '') }}</span></h2>
              <p class="feature-description">{{ t(`home.${feature.description}`) }}</p>
              <div v-if="feature.kind === 'foundation'" class="service-list"><div v-for="service in services" :key="service.key"><el-icon aria-hidden="true"><component :is="service.icon" /></el-icon><strong>{{ service.label }}</strong><span>{{ t(`home.service_${service.key}`) }}</span></div></div>
              <div v-else-if="feature.kind === 'agent'" class="capability-control">
                <span class="control-label">{{ t('home.composerLabel') }}</span>
                <div class="capability-buttons"><button v-for="capability in demoCapabilities" :key="capability" :aria-pressed="selectedCapabilities.includes(capability)" @click="toggleCapability(capability)"><el-icon aria-hidden="true"><Check v-if="selectedCapabilities.includes(capability)" /><Plus v-else /></el-icon>{{ capability }}</button></div>
                <div class="mount-line"><span>{{ t('home.composerMounted') }}</span><code>{{ selectedCapabilities.length ? selectedCapabilities.join(' / ') : t('home.composerEmpty') }}</code></div>
                <div class="agent-footnote"><span>HarnessAgent</span><span>Knowledge</span><span>Sub-agents</span></div>
              </div>
              <div v-else-if="feature.kind === 'models'" class="model-control">
                <div class="provider-list" :aria-label="t('home.providersLabel')"><button v-for="provider in providers" :key="provider.name" :aria-pressed="selectedProvider.name === provider.name" @click="selectedProvider = provider"><span>{{ provider.name }}</span><el-icon class="provider-check" aria-hidden="true"><Check /></el-icon></button></div>
                <div class="model-connection"><div><span>PROVIDER</span><strong>{{ selectedProvider.name }}</strong></div><el-icon aria-hidden="true"><Connection /></el-icon><div><span>PROTOCOL</span><strong>{{ selectedProvider.protocol }}</strong></div></div>
                <p class="configuration-hint">Base URL <span>/</span> API Key <span>/</span> Model</p>
              </div>
              <div v-else class="sandbox-control">
                <div class="runtime-heading"><span class="status-dot"></span><strong>ALIYUN E2B</strong><span>{{ t('home.composerExample') }}</span></div>
                <div class="terminal-line"><span>01</span><code><i>$</i> python scripts/analyze.py</code></div><div class="terminal-line"><span>02</span><code><i>$</i> curl https://api.example.com</code></div>
                <div class="runtime-options"><span><el-icon aria-hidden="true"><Box /></el-icon>{{ t('home.sandboxTemplate') }}</span><span><el-icon aria-hidden="true"><Key /></el-icon>{{ t('home.sandboxEnvironment') }}</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="integration" class="integration-section" data-scene="integration">
        <div class="launch-width">
          <div class="integration-intro" data-reveal><p class="eyebrow">04 → YOUR APPLICATION</p><h2>{{ t('home.integrationTitle') }}<span>{{ t('home.integrationHighlight') }}</span></h2><p>{{ t('home.integrationDescription') }}</p></div>
          <div class="integration-layout">
            <div class="governance-list"><article v-for="(item, index) in governance" :key="item.key" data-reveal><span class="governance-number">0{{ index + 1 }}</span><div><h3><el-icon aria-hidden="true"><component :is="item.icon" /></el-icon>{{ t(`home.governance_${item.key}`) }}</h3><p>{{ t(`home.governance_${item.key}_description`) }}</p></div></article><a :href="docsUrl" target="_blank" rel="noopener noreferrer" class="text-link">{{ t('home.integrationDocs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></div>
            <div class="code-perspective" :style="{ '--code-tilt': `${motionStopped ? 0 : (1 - (sceneProgress.integration || 0)) * 9}deg` }"><div class="code-depth" aria-hidden="true"></div><div class="code-window"><div class="code-toolbar"><div class="window-dots" aria-hidden="true"><i></i><i></i><i></i></div><div class="code-switch"><button v-for="mode in exampleModes" :key="mode" :aria-pressed="exampleMode === mode" :class="{ active: exampleMode === mode }" @click="exampleMode = mode">{{ mode === 'typescript' ? 'TypeScript' : 'HTTP' }}</button></div><button class="copy-button" :aria-label="t('home.copyCode')" @click="copyCode"><el-icon aria-hidden="true"><CopyDocument /></el-icon>{{ t('home.copy') }}</button></div><div class="code-content" tabindex="0" :aria-label="t('home.codeExample')"><pre><code><span v-for="(line, index) in exampleCode.split('\n')" :key="index" class="code-line"><span class="line-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span :class="{ 'code-comment': line.startsWith('//') }">{{ line || ' ' }}</span></span></code></pre></div><div class="code-footnote"><el-icon aria-hidden="true"><Lock /></el-icon>{{ t('home.previewPermission') }}<span>{{ t('home.codeExample') }}</span></div></div></div>
          </div>
        </div>
      </section>
      <section id="getting-started" class="getting-started launch-width">
        <div class="section-intro" data-reveal><p class="eyebrow">YOUR FIRST BUILD</p><h2>{{ t('home.startTitle') }}</h2><p>{{ t('home.startDescription') }}</p></div>
        <ol class="steps"><li v-for="step in steps" :key="step" data-reveal><span class="step-number">0{{ step }}</span><h3>{{ t(`home.step${step}`) }}</h3><p>{{ t(`home.step${step}Desc`) }}</p></li></ol>
        <div class="stack-strip" :aria-label="t('home.techTitle')"><span>{{ t('home.techTitle') }}</span><strong v-for="tech in techStack" :key="tech">{{ tech }}</strong></div>
      </section>
      <section class="finale-section" data-scene="finale"><div class="finale-art"><AgentCoreScene kind="hero" :label="t('home.scene_hero')" :progress="sceneProgress.finale || 0" :reduced-motion="motionStopped" :dark="isDark" /></div><div class="launch-width finale-content"><p class="eyebrow">MAKE IT YOURS.</p><h2>{{ t('home.calloutTitle') }}<span>{{ t('home.calloutHighlight') }}</span></h2><p>{{ t('home.calloutDescription') }}</p><button class="launch-button primary" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.experience') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button></div></section>
    </main>

    <footer class="launch-footer"><div class="launch-width"><div class="footer-main"><a class="brand" href="#"><img class="brand-symbol" src="@/assets/logo.png" alt="" width="32" height="32">IceeBoot.</a><p>{{ t('home.footerDescription') }}</p><div class="footer-links"><a :href="sourceUrl" target="_blank" rel="noopener noreferrer">Gitee<el-icon aria-hidden="true"><TopRight /></el-icon></a><a :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}</a><button @click="showContactDialog = true">{{ t('home.contactUs') }}</button><button v-if="isLoggedIn" @click="handleLogout">{{ t('home.logoutBtn') }}</button></div></div><div class="footer-bottom"><span>© {{ currentYear }} IceeBoot</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2024086986号-2</a></div></div></footer>
    <LoginDialog v-model="showLoginDialog" :paused="motionStopped" @success="handleLoginSuccess" />
    <el-dialog v-model="showMockDialog" :title="t('home.mockTitle')" width="min(400px, calc(100vw - 32px))" align-center><p>{{ t('home.mockContent') }}</p><template #footer><el-button @click="showMockDialog = false">{{ t('home.mockDismiss') }}</el-button><el-button type="primary" @click="openGitee">{{ t('home.getSource') }}</el-button></template></el-dialog>
    <el-dialog v-model="showContactDialog" :title="t('home.contactUs')" width="min(560px, calc(100vw - 32px))" align-center><div class="contact-grid"><figure v-for="platform in socialPlatforms" :key="platform.name"><img :src="platform.qrCode" :alt="t('home.contactQr', { name: platform.name })" loading="lazy" width="144" height="144" /><figcaption>{{ platform.name }}</figcaption></figure></div></el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Moon, Sunny, ArrowRight, TopRight, Cpu, Check, Connection, Lock, CopyDocument, Upload, Message, Key, ChatDotRound, Box, Tickets, Finished, Plus, Bottom, VideoPlay, VideoPause } from '@element-plus/icons-vue'
import { isDark, toggleTheme } from '@/utils/theme'
import BrandMascot from '@/components/common/BrandMascot.vue'
import LoginDialog from '@/components/common/LoginDialog.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { useUserStore } from '@/stores/user'
import { isMockEnabled } from '@/config/mock'
import { exchangeWechatTicket } from '@/api/auth'
import type { MenuItem } from '@/types'
import { useScrollStory } from './composables/useScrollStory'

const AgentCoreScene = defineAsyncComponent(() => import('./components/AgentCoreScene.vue'))
const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const { t } = useI18n()
const pageRoot = ref<HTMLElement>()
const { sceneProgress, prefersReducedMotion, canReveal } = useScrollStory(pageRoot)
const ambientPaused = ref(false)
const motionStopped = computed(() => prefersReducedMotion.value || ambientPaused.value)
const isLoggedIn = computed(() => !!userStore.getToken())
const showLoginDialog = ref(false)
const showMockDialog = ref(false)
const showContactDialog = ref(false)
const currentYear = new Date().getFullYear()
const docsUrl = 'https://doc.iceeboot.yxycompany.com'
const sourceUrl = 'https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java'
const techStack = ['Spring Boot', 'Vue 3', 'TypeScript', 'AgentScope', 'MySQL']
const features = [
  { kind: 'foundation', eyebrow: 'THE FOUNDATION', mark: 'BASE.', subheading: 'EVERYTHING STARTS HERE', title: 'productServicesTitle', description: 'productServicesDescription' },
  { kind: 'agent', eyebrow: 'AGENT EXECUTION', mark: 'AGENT.', subheading: 'CONNECTED TO DO MORE', title: 'productAgentTitle', description: 'productAgentDescription' },
  { kind: 'models', eyebrow: 'MODEL CONNECTIONS', mark: 'MODEL.', subheading: 'YOUR MODEL. YOUR CHOICE.', title: 'productModelTitle', description: 'productModelDescription' },
  { kind: 'sandbox', eyebrow: 'ISOLATED RUNTIME', mark: 'SPACE.', subheading: 'ROOM TO EXECUTE', title: 'productSandboxTitle', description: 'productSandboxDescription' },
] as const
const steps = [1, 2, 3, 4]
const exampleModes = ['typescript', 'http'] as const
const exampleMode = ref<(typeof exampleModes)[number]>('typescript')
const exampleCode = computed(() => exampleMode.value === 'typescript'
  ? `import { agentConsole } from '@/api/agentConsole'

// ${t('home.codeComment')}
const result = await agentConsole.invoke(
  'assistant',
  '${t('home.codeInput')}',
)

console.log(result.output)`
  : `POST /iceeboot/api/v1/agent-console/agents/by-code/assistant/invoke
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "input": "${t('home.codeInput')}"
}`)
const demoCapabilities = ['Skills', 'Tools', 'MCP']
const selectedCapabilities = ref(['Skills', 'Tools'])
const capabilityMask = computed(() => selectedCapabilities.value.reduce((mask, name) => mask | (1 << demoCapabilities.indexOf(name)), 0))
function toggleCapability(capability: string) {
  selectedCapabilities.value = selectedCapabilities.value.includes(capability)
    ? selectedCapabilities.value.filter((item) => item !== capability)
    : [...selectedCapabilities.value, capability]
}
const providers = [
  { name: 'GPT', protocol: 'OpenAI Chat / Responses' },
  { name: 'Claude', protocol: 'Anthropic' },
  { name: 'Gemini', protocol: 'Gemini' },
  { name: 'Qwen', protocol: 'OpenAI compatible' },
  { name: 'DeepSeek', protocol: 'OpenAI compatible' },
  { name: 'GLM', protocol: 'OpenAI compatible' },
  { name: 'Kimi', protocol: 'OpenAI compatible' },
  { name: 'MiniMax', protocol: 'OpenAI compatible' },
]
const selectedProvider = ref(providers[0]!)
const services = [
  { key: 'storage', label: 'OSS', icon: Upload },
  { key: 'model', label: 'LLM', icon: Cpu },
  { key: 'sms', label: 'SMS', icon: ChatDotRound },
  { key: 'email', label: 'Email', icon: Message },
  { key: 'auth', label: 'Auth', icon: Key },
  { key: 'sandbox', label: 'Sandbox', icon: Box },
]
const governance = [
  { key: 'permission', icon: Lock },
  { key: 'version', icon: Finished },
  { key: 'usage', icon: Tickets },
]
const socialPlatforms = [
  { name: 'Bilibili', qrCode: new URL('@/assets/img/qr-code/bilibili.png', import.meta.url).href },
  { name: 'Douyin', qrCode: new URL('@/assets/img/qr-code/dy.png', import.meta.url).href },
  { name: 'Xiaohongshu', qrCode: new URL('@/assets/img/qr-code/xhs.png', import.meta.url).href },
  { name: 'WeChat', qrCode: new URL('@/assets/img/qr-code/wx.png', import.meta.url).href },
  { name: 'QQ', qrCode: new URL('@/assets/img/qr-code/qq.png', import.meta.url).href },
]
async function copyCode() {
  try { await navigator.clipboard.writeText(exampleCode.value); ElMessage.success(t('home.copySuccess')) }
  catch { ElMessage.warning(t('home.copyFailed')) }
}
function handleExperience() {
  if (isLoggedIn.value) goToFirstMenu()
  else showLoginDialog.value = true
}
function openGitee() {
  window.open(sourceUrl, '_blank', 'noopener,noreferrer')
  showMockDialog.value = false
}

const normalizeMenuPath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

const resolveFirstMenuPath = (menus?: MenuItem[]): string | null => {
  if (!menus || menus.length === 0) return null
  for (const menu of menus) {
    if (menu.type === 'link') continue
    if (menu.children && menu.children.length > 0) {
      const childPath = resolveFirstMenuPath(menu.children)
      if (childPath) return childPath
    }
    if (menu.path) return normalizeMenuPath(menu.path)
  }
  return null
}

const goToFirstMenu = () => {
  const target = resolveFirstMenuPath(userStore.user?.menus) || '/404'
  router.push(target)
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm(t('home.logoutConfirm'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    userStore.logout()
    ElMessage.success(t('home.logoutSuccess'))
  } catch { /* cancelled */ }
}


const resolveSingleQueryValue = (value: unknown): string => {
  if (!value) return ''
  if (Array.isArray(value)) {
    const first = value[0]
    return typeof first === 'string' ? first : ''
  }
  return typeof value === 'string' ? value : ''
}

const handleLoginSuccess = () => {
  showLoginDialog.value = false
  goToFirstMenu()
}

const handleWechatCallback = async () => {
  const errorMessage = resolveSingleQueryValue(route.query.error)
  if (errorMessage) {
    ElMessage.error(errorMessage)
    showLoginDialog.value = true
    await router.replace({ path: '/', query: {}, hash: '' })
    return
  }
  const fragmentTicket = new URLSearchParams(route.hash.replace(/^#/, '')).get('ticket')
  const ticket = fragmentTicket || resolveSingleQueryValue(route.query.ticket)
  if (!ticket) return
  try {
    const response = await exchangeWechatTicket(ticket)
    userStore.setAuthTokens(response)
    userStore.setUser(response.user)
    await router.replace({ path: '/', query: {}, hash: '' })
    goToFirstMenu()
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : t('login.loginFailed'))
    showLoginDialog.value = true
    await router.replace({ path: '/', query: {}, hash: '' })
  }
}

let mockTimer: ReturnType<typeof setTimeout> | undefined
onMounted(() => {
  if (isMockEnabled()) mockTimer = setTimeout(() => { showMockDialog.value = true }, 2000)
  void handleWechatCallback()
})
onBeforeUnmount(() => { if (mockTimer) clearTimeout(mockTimer) })
</script>

<style scoped lang="scss">
.launch-site {
  --paper: #ffffff; --ink: #172b49; --muted: #536781; --line: #d9e3f0; --accent: #2563d9;
  --site-bg: #ffffff; --stage: #f4f8ff; --stage-alt: #eef4fd; --stage-model: #f8faff; --header-bg: #ffffffed;
  --text: #172b49; --secondary: #506581; --subtle: #5c7392; --highlight: #077cc8; --accent-ink: #2966ce;
  --hairline: #285c9e26; --wash: #2563df08; --halo: #99dcfd5c; --watermark: #194fa510;
  --button-bg: #2864dc; --button-ink: #ffffff; --button-hover: #1c50bc; --selected-bg: #2864dc; --selected-ink: #ffffff;
  --editor-bg: #12233e; --editor-ink: #dce8ff; --editor-muted: #9bb4d7; --editor-border: #6987b04d;
  color-scheme: light;
  background: var(--site-bg); color: var(--text); font-family: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif; -webkit-font-smoothing: antialiased;
  &.is-dark {
    --paper: #161616; --ink: #f2f2f2; --muted: #b3b3b3; --line: #303030; --accent: #80b5ff;
    --site-bg: #0a0a0a; --stage: #141414; --stage-alt: #181818; --stage-model: #111111; --header-bg: #141414f5;
    --text: #f2f2f2; --secondary: #c4c4c4; --subtle: #a3a3a3; --highlight: #80b5ff; --accent-ink: #80b5ff;
    --hairline: #879cff30; --wash: #7688ff09; --halo: #714dff29; --watermark: #9994ff0e;
    --button-bg: #1969ba; --button-ink: #ffffff; --button-hover: #2277ca; --selected-bg: #7546df; --selected-ink: #ffffff;
    --editor-bg: #181818; --editor-ink: #ededed; --editor-muted: #a3a3a3; --editor-border: #383838;
    color-scheme: dark;
  }
  a { color: inherit; text-decoration: none; } button { font: inherit; cursor: pointer; } button:disabled { opacity: .4; cursor: default; }
  button, a { -webkit-tap-highlight-color: transparent; } .el-icon { flex-shrink: 0; }
  a:focus-visible, button:focus-visible, [tabindex='0']:focus-visible { outline: 2px solid var(--accent-ink); outline-offset: 5px; }
  h1, h2, h3, p { margin: 0; } h1, h2, h3 { text-wrap: balance; } p { text-wrap: pretty; }
}
// 夜间光色集中在交互与模型周围，正文保持清晰，避免全屏光污染。
.launch-site.is-dark {
  .hero-section { background: var(--site-bg); }
  .hero-copy h1 span, .finale-content h2 span { color: #77cfff; background: linear-gradient(110deg, #a4eaff, #64b6ff); background-clip: text; -webkit-text-fill-color: transparent; }
  .nav-cta, .launch-button.primary { background: linear-gradient(115deg, #165dbe, #1478b4); border-color: #bfa0ff40; box-shadow: 0 4px 24px #7846e72b; &:hover { background: linear-gradient(115deg, #1c69c9, #167fbb); box-shadow: 0 6px 30px #7846e745; } }
  .provider-list button[aria-pressed='true'], .capability-buttons button[aria-pressed='true'] { background: #34245d; border-color: #b08aff; color: #f1eaff; box-shadow: inset 0 0 18px #9b64ff16, 0 0 18px #8751ff18; }
  .feature-agent .scene-halo { background: radial-gradient(ellipse, #ba42dd20, transparent 70%); }
  .feature-models .scene-halo { background: radial-gradient(ellipse, #286cff24, transparent 70%); }
  .feature-sandbox .scene-halo { background: radial-gradient(ellipse, #7550ed28, transparent 70%); }
}
.launch-header, .hero-section, .feature-scene, .integration-section, .launch-footer { transition: background-color .28s ease, color .28s ease, border-color .28s ease; }
.launch-width { width: min(1200px, calc(100% - clamp(64px, 16vw, 320px))); margin-inline: auto; }
.skip-link { position: fixed; top: 8px; left: 20px; z-index: 300; padding: 12px 18px; background: white; color: black !important; transform: translateY(-200%); &:focus { transform: none; } }
.launch-header { position: sticky; top: 0; z-index: 80; background: var(--header-bg); backdrop-filter: blur(24px); }
.header-inner { min-height: 72px; display: flex; align-items: center; gap: 36px; }
.brand { display: inline-flex; align-items: center; gap: 10px; font-size: 23px; font-weight: 650; letter-spacing: -1px; flex-shrink: 0; }
.brand-symbol { display: block; flex: none; }
.brand-dot { color: var(--accent-ink); margin-left: -9px; }
.header-inner nav { display: flex; gap: 32px; margin-left: auto; a { min-height: 44px; display: inline-flex; align-items: center; gap: 6px; color: var(--secondary); font-size: 12px; &:hover { color: var(--text); } } }
.header-actions { display: flex; align-items: center; gap: 4px; :deep(.lang-btn) { width: 44px; height: 44px; margin: 0; color: var(--secondary); } }
.utility-button, .motion-button { width: 44px; height: 44px; display: grid; place-items: center; background: none; border: 0; color: var(--secondary); font-size: 17px; border-radius: 50%; &:hover { background: var(--wash); } }
.motion-button { border: 1px solid var(--hairline); width: 36px; height: 36px; margin-right: 6px; }
.nav-cta { display: inline-flex; align-items: center; gap: 12px; padding: 0 20px; min-height: 40px; border: 1px solid var(--hairline); border-radius: 24px; background: var(--button-bg); color: var(--button-ink); font-size: 12px; }
.eyebrow { display: flex; align-items: center; gap: 9px; font-size: 10px; letter-spacing: .13em; font-weight: 500; color: var(--subtle); line-height: 1.8; }
.status-dot { width: 5px; height: 5px; border-radius: 50%; display: inline-block; background: var(--accent-ink); box-shadow: 0 0 12px var(--halo); flex-shrink: 0; }
.hero-section { height: 125svh; min-height: 820px; background: radial-gradient(ellipse at 75% 44%, var(--halo), transparent 54%), linear-gradient(155deg, var(--site-bg) 38%, var(--stage)); }
.hero-sticky { height: calc(100svh - 72px); min-height: 650px; position: sticky; top: 72px; overflow: hidden; }
.hero-grid { display: grid; grid-template-columns: 1fr 1.05fr; align-items: center; height: calc(100% - 70px); }
.hero-copy { position: relative; z-index: 2; padding-top: 8px; }
.hero-copy h1 { margin-top: 26px; font-size: clamp(52px, 5.1vw, 80px); font-weight: 550; line-height: 1.22; letter-spacing: -.065em; span { display: block; color: var(--highlight); } }
.hero-description { max-width: 425px; color: var(--secondary); font-size: 15px; line-height: 2; margin-top: 26px !important; }
.hero-actions { display: flex; align-items: center; gap: 28px; margin-top: 34px; }
.launch-button { display: inline-flex; align-items: center; justify-content: center; gap: 28px; min-height: 50px; padding: 0 25px; border: 1px solid transparent; border-radius: 28px; font-size: 13px; font-weight: 600; transition: background .2s, transform .2s; &.primary { background: var(--button-bg); color: var(--button-ink); } &:hover { background: var(--button-hover); transform: translateY(-2px); } }
.text-link { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; font-size: 12px; color: var(--secondary) !important; &:hover { color: var(--text) !important; } }
.hero-spec { display: flex; align-items: center; gap: 12px; margin-top: 37px; color: var(--subtle); font-size: 9px; letter-spacing: .09em; i { width: 3px; height: 3px; background: var(--subtle); border-radius: 50%; } }
.hero-art { display: grid; place-items: center; position: relative; height: min(650px, 75svh); margin: 0; }
.hero-art .brand-scene { width: min(100%, 64svh); }
.hero-bottom { display: flex; align-items: center; justify-content: space-between; height: 60px; color: var(--subtle); font-size: 11px; a { display: inline-flex; gap: 18px; align-items: center; min-height: 44px; } }
.manifesto { padding-block: 120px 100px; text-align: center; .eyebrow { justify-content: center; } h2 { font-size: clamp(36px, 4.2vw, 60px); letter-spacing: -.055em; line-height: 1.4; font-weight: 500; margin-top: 25px; span { display: block; color: var(--highlight); } } > p:not(.eyebrow) { color: var(--secondary); max-width: 540px; font-size: 15px; line-height: 2; margin: 26px auto 0; } }
.chapter-navigation { display: flex; justify-content: center; gap: 38px; margin-top: 55px; a { display: flex; align-items: center; gap: 12px; min-height: 48px; font-size: 12px; color: var(--text); span { font-size: 9px; color: var(--subtle); } .el-icon { color: var(--accent-ink); font-size: 11px; } &:hover { color: var(--accent-ink); } } }
#capabilities, #integration, .feature-scene { scroll-margin-top: 72px; }
.feature-scene { height: 145svh; min-height: 1050px; position: relative; background: var(--stage); }
.feature-sticky { position: sticky; top: 72px; height: calc(100svh - 72px); min-height: 650px; display: flex; flex-direction: column; overflow: hidden; }
.feature-heading { display: flex; align-items: center; justify-content: space-between; gap: 28px; padding-top: 32px; color: var(--subtle); font-size: 9px; letter-spacing: .15em; flex-shrink: 0; }
.feature-grid { flex: 1; display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; gap: 65px; min-height: 0; }
.feature-art { position: relative; height: min(570px, 70svh); min-width: 0; margin-inline: 0; }
.scene-halo { position: absolute; width: 85%; height: 65%; left: 8%; top: 20%; border-radius: 50%; background: radial-gradient(ellipse, var(--halo), transparent 70%); pointer-events: none; }
.scene-watermark { position: absolute; top: 7%; left: 8%; color: var(--watermark); font-size: clamp(50px, 7vw, 108px); font-weight: 600; letter-spacing: -.06em; pointer-events: none; }
.scene-caption { position: absolute; inset: auto 10% 2%; display: flex; align-items: center; gap: 10px; font-size: 10px; color: var(--subtle); pointer-events: none; }
.scene-coordinate { margin-left: auto; color: var(--subtle); font: 10px monospace; }
.feature-copy { position: relative; padding-block: 40px; h2 { font-size: clamp(34px, 3.25vw, 49px); line-height: 1.4; letter-spacing: -.045em; font-weight: 500; margin-top: 20px; max-width: 450px; } }
.feature-description { margin-top: 23px !important; color: var(--secondary); font-size: 14px; line-height: 2; max-width: 440px; }
.feature-agent { background: var(--stage-alt); }.feature-models { background: var(--stage-model); }.feature-sandbox { background: var(--stage-alt); }
.is-reversed .feature-art { grid-column: 2; grid-row: 1; }.is-reversed .feature-copy { grid-column: 1; grid-row: 1; }
.service-list { display: grid; grid-template-columns: 1fr 1fr; gap: 0 24px; margin-top: 30px; > div { display: grid; grid-template-columns: 20px 1fr; column-gap: 10px; align-items: center; padding: 15px 0; .el-icon { grid-row: span 2; color: var(--accent-ink); font-size: 18px; } strong { font-size: 13px; font-weight: 500; } > span { font-size: 10px; color: var(--subtle); margin-top: 4px; } } }
.capability-control, .model-control, .sandbox-control { margin-top: 32px; }
.control-label { display: block; color: var(--subtle); font-size: 10px; margin-bottom: 14px; }
.capability-buttons { display: flex; gap: 9px; flex-wrap: wrap; button { display: inline-flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 18px; border-radius: 24px; border: 1px solid var(--hairline); background: none; color: var(--secondary); font-size: 12px; &[aria-pressed='true'] { background: var(--selected-bg); border-color: var(--selected-bg); color: var(--selected-ink); } } }
.mount-line { margin-top: 22px; padding-top: 17px; display: flex; flex-direction: column; gap: 9px; > span { font-size: 10px; color: var(--subtle); } code { color: var(--accent-ink); font-size: 12px; } }
.agent-footnote { display: flex; gap: 17px; color: var(--subtle); margin-top: 27px; font-size: 10px; }
.provider-list {
  display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px;
  button {
    min-width: 0; min-height: 48px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 5px;
    border: 1px solid var(--hairline); border-radius: 9px; color: var(--secondary); background: var(--wash); font-size: 12px; white-space: nowrap;
    transition: color .22s, background .22s, border-color .22s, transform .22s;
    &[aria-pressed='true'] { background: var(--selected-bg); border-color: var(--selected-bg); color: var(--selected-ink); .provider-check { opacity: 1; transform: scale(1); } }
    &:hover { border-color: var(--accent-ink); transform: translateY(-2px); }
    &:active { transform: translateY(0); }
  }
  .provider-check { width: 12px; font-size: 12px; opacity: 0; transform: scale(.6); transition: opacity .2s, transform .3s; }
}
.model-control { width: 100%; max-width: 520px; }
.model-connection { display: grid; grid-template-columns: minmax(80px, .65fr) 24px minmax(0, 1.7fr); align-items: center; gap: 16px; margin-top: 27px; padding-block: 20px; > div { display: flex; flex-direction: column; gap: 9px; min-width: 0; } span { font-size: 8px; letter-spacing: .15em; color: var(--subtle); } strong { font-size: 12px; font-weight: 500; line-height: 1.6; } .el-icon { color: var(--accent-ink); } }
.configuration-hint { font: 10px 'SFMono-Regular', Consolas, monospace; margin-top: 17px !important; color: var(--subtle); span { margin-inline: 12px; color: var(--subtle); } }
.sandbox-control { padding-top: 23px; }
.runtime-heading { display: flex; align-items: center; gap: 9px; margin-bottom: 24px; strong { font-size: 11px; letter-spacing: .07em; font-weight: 500; } > span:last-child { margin-left: auto; font-size: 9px; color: var(--subtle); } }
.terminal-line { display: flex; gap: 20px; align-items: center; padding: 10px 0; font-size: 12px; > span { font-size: 9px; color: var(--subtle); } code { overflow-wrap: anywhere; } i { font-style: normal; color: var(--accent-ink); margin-right: 8px; } }
.runtime-options { display: flex; gap: 28px; padding-top: 22px; margin-top: 18px; span { display: flex; align-items: center; gap: 7px; font-size: 11px; color: var(--secondary); } }
.integration-section { padding-block: 115px 125px; background: var(--paper); color: var(--ink); overflow: hidden; }
.integration-intro { max-width: 850px; .eyebrow { color: var(--accent); } h2 { font-size: clamp(36px, 4vw, 56px); letter-spacing: -.045em; line-height: 1.35; margin-top: 20px; font-weight: 500; span { display: block; color: var(--muted); } } > p:last-child { color: var(--muted); font-size: 14px; line-height: 2; max-width: 560px; margin-top: 25px; } }
.integration-layout { display: grid; grid-template-columns: .8fr 1.2fr; gap: 80px; margin-top: 65px; align-items: center; }
.governance-list { article { display: flex; align-items: flex-start; gap: 18px; border-top: 1px solid var(--line); padding-block: 22px; } h3 { display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 600; .el-icon { font-size: 17px; color: var(--accent); } } p { color: var(--muted); font-size: 12px; line-height: 1.9; margin-top: 12px; } .text-link { color: var(--accent) !important; margin-top: 10px; } }
.governance-number { font: 10px monospace; padding-top: 5px; color: var(--muted); }
.code-perspective { perspective: 1200px; position: relative; }
.code-window { position: relative; background: var(--editor-bg); border: 1px solid var(--editor-border); border-radius: 14px; overflow: hidden; color: var(--editor-ink); transform: rotateY(calc(var(--code-tilt) * -1)) rotateX(calc(var(--code-tilt) * .5)); transition: transform .25s ease-out; box-shadow: 0 28px 65px -30px #10264736; }
.code-depth { position: absolute; inset: 16px -12px -16px 14px; background: var(--line); border: 1px solid var(--editor-border); border-radius: 14px; transform: rotateY(calc(var(--code-tilt) * -1)); }
.code-toolbar { display: flex; align-items: center; gap: 15px; padding-inline: 20px; border-bottom: 1px solid #ffffff13; }
.window-dots { display: flex; gap: 5px; i { width: 6px; height: 6px; background: var(--editor-muted); border-radius: 50%; } }
.code-switch { display: flex; gap: 15px; button { min-height: 52px; border: 0; border-bottom: 2px solid transparent; background: none; color: var(--editor-muted); font-size: 11px; &.active { color: var(--editor-ink); border-bottom-color: var(--editor-ink); } } }
.copy-button { margin-left: auto; display: inline-flex; align-items: center; gap: 5px; min-height: 44px; border: 0; background: none; color: var(--editor-muted); font-size: 11px; }
.code-content { min-height: 280px; padding: 26px 20px; pre { margin: 0; } code { font: 12px/2.15 'SFMono-Regular', Consolas, monospace; } }
.code-line { display: grid; grid-template-columns: 30px minmax(0, 1fr); white-space: pre-wrap; overflow-wrap: anywhere; }.line-number { font-size: 10px; color: var(--editor-muted); user-select: none; }.code-comment { color: var(--editor-muted); }
.code-footnote { border-top: 1px solid #ffffff13; display: flex; align-items: center; gap: 8px; padding: 15px 20px; font-size: 10px; color: var(--editor-muted); > span { margin-left: auto; font-size: 9px; } }
.getting-started { padding-block: 110px 70px; }
.section-intro { h2 { font-size: clamp(30px, 3vw, 42px); font-weight: 500; letter-spacing: -.04em; margin-top: 18px; } > p:last-child { color: var(--secondary); font-size: 14px; line-height: 1.8; margin-top: 22px; } }
.steps { list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 30px; padding: 0; margin-top: 50px; li { padding-top: 24px; } h3 { font-size: 16px; font-weight: 500; margin-top: 30px; } p { color: var(--secondary); font-size: 12px; line-height: 1.9; margin-top: 15px; } }
.step-number { font: 11px monospace; color: var(--accent-ink); }.stack-strip { display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; padding-top: 32px; margin-top: 65px; > span { font-size: 10px; color: var(--subtle); } strong { font-weight: 500; font-size: 12px; } }
.finale-section { position: relative; padding-block: 80px 105px; overflow: hidden; background: radial-gradient(ellipse at 50% 20%, var(--halo), transparent 60%); }
.finale-art { position: relative; width: min(650px, 100%); height: 330px; margin: -60px auto -28px; }
.finale-content { position: relative; text-align: center; .eyebrow { justify-content: center; } h2 { font-size: clamp(36px, 4.5vw, 62px); font-weight: 500; line-height: 1.4; letter-spacing: -.055em; margin-top: 20px; span { display: block; color: var(--highlight); } } > p:not(.eyebrow) { color: var(--secondary); font-size: 14px; line-height: 1.9; margin-top: 25px; }.launch-button { margin-top: 30px; } }
.launch-footer { background: var(--site-bg); padding-block: 32px 20px; }.footer-main { display: flex; align-items: center; gap: 24px; > p { font-size: 11px; color: var(--subtle); } }.footer-links { margin-left: auto; display: flex; gap: 22px; a,button { display: inline-flex; align-items: center; gap: 5px; min-height: 44px; border: 0; background: none; color: var(--secondary); font-size: 11px; } }.footer-bottom { display: flex; justify-content: space-between; gap: 16px; margin-top: 24px; padding-top: 20px; color: var(--subtle); font-size: 10px; }
.contact-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 22px 16px; figure { margin: 0; text-align: center; } img { width: 100%; max-width: 144px; height: auto; aspect-ratio: 1; object-fit: contain; } figcaption { margin-top: 8px; font-size: 12px; } }
.can-reveal [data-reveal] { opacity: 0; transform: translateY(20px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.3,1); &.is-visible { opacity: 1; transform: none; } }
@media (min-width: 1700px) { .launch-width { width: min(1280px, 80%); } .hero-copy h1 { font-size: 90px; }.feature-copy h2 { font-size: 54px; }.hero-description, .feature-description { font-size: 16px; max-width: 500px; }.hero-art { height: 750px; }.feature-art { height: 650px; } }
@media (max-width: 1100px) { .header-inner { gap: 20px; }.header-inner nav { gap: 18px; }.hero-copy h1 { font-size: 56px; }.feature-grid { gap: 35px; }.feature-copy h2 { font-size: 36px; }.integration-layout { gap: 45px; } }
@media (max-width: 760px) {
  .launch-width { width: calc(100% - 48px); }.header-inner { width: calc(100% - 32px); min-height: 64px; gap: 8px; }.header-inner nav { display: none; }.header-actions { margin-left: auto; gap: 0; }.brand { font-size: 20px; gap: 4px; }.brand-dot { margin-left: -3px; }.nav-cta { min-height: 36px; padding-inline: 13px; }.motion-button { margin: 0; width: 32px; height: 32px; }.utility-button { width: 36px; }.header-actions :deep(.lang-btn) { width: 36px; }
  .hero-section { min-height: 0; height: auto; }.hero-sticky { position: relative; top: 0; height: auto; min-height: 0; }.hero-grid { display: flex; flex-direction: column; align-items: stretch; }.hero-copy { padding-top: 55px; }.hero-copy h1 { font-size: clamp(42px, 8vw, 62px); margin-top: 20px; }.hero-description { max-width: 520px; font-size: 13px; line-height: 1.9; margin-top: 20px !important; }.hero-actions { margin-top: 25px; gap: 25px; }.hero-spec { margin-top: 27px; font-size: 8px; }.hero-art { height: 390px; margin: -5px 0 -10px; }.hero-art .brand-scene { width: min(100%, 370px); }.hero-bottom { font-size: 9px; height: 64px; gap: 14px; > span { max-width: 145px; line-height: 1.8; } a { gap: 6px; } }
  .manifesto { padding-block: 75px; text-align: left; .eyebrow { justify-content: flex-start; } h2 { font-size: 34px; } > p:not(.eyebrow) { font-size: 13px; margin-top: 22px; } }.chapter-navigation { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 24px; margin-top: 30px; a { justify-content: space-between; font-size: 11px; } }
  .feature-scene { height: auto; min-height: 0; scroll-margin-top: 64px; }.feature-sticky { position: relative; top: 0; height: auto; min-height: 0; }.feature-heading { padding-top: 28px; font-size: 8px; gap: 18px; }.feature-heading > span:last-child { display: none; }.feature-grid { display: flex; flex-direction: column; gap: 0; align-items: stretch; }.feature-art { order: 2; height: 410px; margin: -20px 0 30px; }.feature-copy { padding-block: 40px; h2 { font-size: 34px; margin-top: 13px; max-width: 560px; } }.feature-copy h2 > span { display: block; }.feature-description { font-size: 13px; margin-top: 18px !important; max-width: 560px; }.scene-watermark { font-size: 70px; top: 4%; }.scene-caption { font-size: 9px; inset-inline: 10%; }.service-list { margin-top: 23px; gap: 0 24px; }.capability-control,.model-control,.sandbox-control { margin-top: 24px; }.capability-buttons button { flex: 1; justify-content: center; padding-inline: 10px; }.provider-list { gap: 8px; button { padding-inline: 7px; gap: 3px; font-size: 11px; } .provider-check { width: 10px; font-size: 10px; } }.feature-foundation .feature-art { height: 380px; }.feature-models .feature-art { height: 430px; }.terminal-line { font-size: 11px; gap: 16px; }
  .integration-section { padding-block: 70px 85px; }.integration-intro h2 { font-size: 33px; }.integration-intro > p:last-child { font-size: 13px; }.integration-layout { grid-template-columns: 1fr; gap: 35px; margin-top: 35px; }.governance-list article { padding-block: 18px; }.code-content { padding-inline: 14px; code { font-size: 10px; } }.code-toolbar { padding-inline: 14px; gap: 10px; }.code-footnote > span { display: none; }.code-depth { right: -5px; }.code-window { transform: none; }.code-depth { transform: none; }
  .getting-started { padding-block: 70px 55px; }.section-intro h2 { font-size: 30px; }.section-intro > p:last-child { font-size: 13px; }.steps { grid-template-columns: 1fr 1fr; gap: 30px 22px; margin-top: 35px; h3 { font-size: 15px; margin-top: 20px; } p { font-size: 11px; } }.stack-strip { justify-content: flex-start; gap: 20px 28px; margin-top: 40px; > span { width: 100%; } }.finale-art { height: 280px; margin-top: -30px; }.finale-section { padding-block: 50px 75px; }.finale-content h2 { font-size: 34px; }.finale-content > p:not(.eyebrow) { font-size: 13px; }.footer-main { flex-wrap: wrap; gap: 14px; > p { max-width: 180px; font-size: 10px; line-height: 1.8; } }.footer-links { width: 100%; margin: 0; gap: 22px; flex-wrap: wrap; }.footer-bottom { font-size: 9px; }.contact-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 360px) { .provider-list { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-height: 760px) and (min-width: 761px) { .hero-sticky, .feature-sticky { min-height: 570px; }.feature-art { height: 480px; }.feature-copy { padding-block: 25px; }.feature-copy h2 { font-size: 35px; }.feature-description { font-size: 13px; margin-top: 17px !important; }.feature-heading { padding-top: 20px; }.service-list { margin-top: 20px; }.service-list > div { padding-block: 11px; }.hero-copy h1 { font-size: 58px; }.hero-art { height: 490px; } }
.reduce-motion { .hero-section,.feature-scene { height: auto; min-height: 0; }.hero-sticky,.feature-sticky { position: relative; top: 0; height: auto; }.hero-grid { min-height: 650px; }.feature-grid { min-height: 650px; }.code-window,.code-depth { transform: none; } }
@media (prefers-reduced-motion: reduce) { .launch-site *, .launch-site *::before, .launch-site *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }.can-reveal [data-reveal] { opacity: 1; transform: none; } }
</style>
