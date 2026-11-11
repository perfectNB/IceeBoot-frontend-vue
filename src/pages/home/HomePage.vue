<template>
  <div ref="pageRoot" class="launch-site" :class="{ 'is-dark': isDark, 'can-reveal': canReveal && !prefersReducedMotion, 'reduce-motion': prefersReducedMotion }">
    <a class="skip-link" href="#capabilities">{{ t('home.skipContent') }}</a>
    <header class="launch-header">
      <div class="launch-width header-inner">
        <a class="brand" href="#" aria-label="IceeBoot"><span class="brand-symbol" aria-hidden="true"><el-icon><Cpu /></el-icon></span>IceeBoot<span class="brand-dot">.</span></a>
        <nav :aria-label="t('home.navigation')"><a href="#capabilities">{{ t('home.navCapabilities') }}</a><a href="#integration">{{ t('home.navIntegration') }}</a><a :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></nav>
        <div class="header-actions"><LanguageSwitcher /><button class="utility-button" :aria-label="t(isDark ? 'home.lightTheme' : 'home.darkTheme')" @click="toggleTheme"><el-icon aria-hidden="true"><component :is="isDark ? Sunny : Moon" /></el-icon></button><button class="nav-cta" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.login') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button></div>
      </div>
      <span class="reading-progress" :style="{ transform: `scaleX(${pageProgress})` }" aria-hidden="true"></span>
    </header>

    <main>
      <section ref="storyElement" class="engine-story" :aria-label="t('home.storyLabel')">
        <div class="story-sticky">
          <div class="story-atmosphere" aria-hidden="true"></div>
          <div class="engine-visual" :class="{ 'is-separated': activeChapter === 1 }"><AgentCoreScene :label="t('home.storyLabel')" :progress="prefersReducedMotion ? 0 : storyProgress" :reduced-motion="prefersReducedMotion || ambientPaused" /></div>
          <div class="launch-width story-content">
            <div class="story-copy">
              <article v-for="(chapter, index) in chapters" :key="chapter.key" :data-chapter="index" class="chapter-copy" :class="{ active: activeChapter === index }" :aria-hidden="!prefersReducedMotion && activeChapter !== index" :inert="!prefersReducedMotion && activeChapter !== index">
                <p class="chapter-eyebrow"><span aria-hidden="true"></span>{{ t(`home.chapter_${chapter.key}_eyebrow`) }}</p>
                <h1 v-if="index === 0">{{ t('home.heroTitle') }}<span>{{ t('home.heroTitleHighlight') }}</span></h1>
                <h2 v-else>{{ t(`home.chapter_${chapter.key}_title`) }}<span>{{ t(`home.chapter_${chapter.key}_highlight`) }}</span></h2>
                <p class="chapter-description">{{ t(index === 0 ? 'home.heroDescription' : `home.chapter_${chapter.key}_description`) }}</p>
                <div class="chapter-actions"><button class="launch-button primary" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.experience') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button><a class="chapter-link" :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></div>
                <div class="chapter-tags"><span v-for="tag in chapter.tags" :key="tag">{{ tag }}</span></div>
              </article>
            </div>
            <div class="scene-annotation" aria-hidden="true"><span class="annotation-line"></span><span>{{ t(`home.chapter_${chapters[activeChapter]!.key}_annotation`) }}</span><span class="annotation-spec">ICEEBOOT / ENGINE {{ String(activeChapter + 1).padStart(2, '0') }}</span></div>
          </div>
          <div class="launch-width story-controls">
            <div class="chapter-index"><button v-for="(chapter, index) in chapters" :key="chapter.key" :aria-current="activeChapter === index ? 'step' : undefined" @click="scrollToChapter(index)"><span class="chapter-number">0{{ index + 1 }}</span><span>{{ t(`home.chapter_${chapter.key}_short`) }}</span><span class="chapter-progress" :style="{ transform: `scaleX(${Math.max(0, Math.min(1, storyProgress * 3 - index))})` }" aria-hidden="true"></span></button></div>
            <div class="motion-controls"><span class="scroll-cue">{{ t('home.scrollExplore') }}<el-icon aria-hidden="true"><Bottom /></el-icon></span><button class="motion-button" :disabled="prefersReducedMotion" :aria-label="t(ambientPaused ? 'home.resumeMotion' : 'home.pauseMotion')" :aria-pressed="ambientPaused" @click="ambientPaused = !ambientPaused"><el-icon aria-hidden="true"><component :is="ambientPaused ? VideoPlay : VideoPause" /></el-icon></button></div>
          </div>
        </div>
      </section>

      <section id="capabilities" class="capabilities-section launch-width">
        <div class="section-intro" data-reveal><p class="eyebrow">BUILT FOR YOUR NEXT IDEA</p><h2>{{ t('home.platformTitle') }}<span>{{ t('home.platformHighlight') }}</span></h2><p>{{ t('home.platformDescription') }}</p></div>
        <div class="capability-bento">
          <article class="product-card agent-product" data-reveal>
            <div class="product-copy"><span class="product-kicker">01 / AGENT EXECUTION</span><h3>{{ t('home.productAgentTitle') }}</h3><p>{{ t('home.productAgentDescription') }}</p></div>
            <div class="agent-composer" :aria-label="t('home.composerLabel')"><div class="composer-top"><span class="composer-avatar"><el-icon aria-hidden="true"><Connection /></el-icon></span><div><strong>assistant</strong><span>{{ t('home.composerExample') }}</span></div><span class="version-pill">v1</span></div><div class="composer-lines"><span>{{ t('home.composerModel') }}</span><strong>{{ selectedProvider.name }}</strong></div><div class="composer-capabilities"><button v-for="capability in demoCapabilities" :key="capability" :aria-pressed="selectedCapabilities.includes(capability)" :class="{ selected: selectedCapabilities.includes(capability) }" @click="toggleCapability(capability)"><el-icon aria-hidden="true"><Check v-if="selectedCapabilities.includes(capability)" /><Plus v-else /></el-icon>{{ capability }}</button></div><div class="composer-result"><span class="code-label">{{ t('home.composerMounted') }}</span><code>{{ selectedCapabilities.length ? selectedCapabilities.join(' + ') : t('home.composerEmpty') }}</code></div></div>
          </article>
          <article class="product-card services-product" data-reveal>
            <div class="product-copy"><span class="product-kicker">02 / THE FOUNDATION</span><h3>{{ t('home.productServicesTitle') }}</h3><p>{{ t('home.productServicesDescription') }}</p></div>
            <div class="service-matrix"><div v-for="service in services" :key="service.key"><span class="service-icon"><el-icon aria-hidden="true"><component :is="service.icon" /></el-icon></span><strong>{{ service.label }}</strong><span>{{ t(`home.service_${service.key}`) }}</span></div></div>
          </article>
          <article class="product-card model-product" data-reveal>
            <div class="product-copy"><span class="product-kicker">03 / YOUR MODEL. YOUR CHOICE.</span><h3>{{ t('home.productModelTitle') }}</h3><p>{{ t('home.productModelDescription') }}</p></div>
            <div class="provider-grid" :aria-label="t('home.providersLabel')"><button v-for="provider in providers" :key="provider.name" :aria-pressed="selectedProvider.name === provider.name" :class="{ selected: selectedProvider.name === provider.name }" @click="selectedProvider = provider"><span class="provider-monogram" aria-hidden="true">{{ provider.name[0] }}</span>{{ provider.name }}</button></div>
            <div class="provider-detail"><span>{{ selectedProvider.name }}</span><span>{{ selectedProvider.protocol }}</span><el-icon aria-hidden="true"><Connection /></el-icon></div>
          </article>
          <article class="product-card sandbox-product" data-reveal>
            <div class="product-copy"><span class="product-kicker">04 / ROOM TO EXECUTE</span><h3>{{ t('home.productSandboxTitle') }}</h3><p>{{ t('home.productSandboxDescription') }}</p></div>
            <div class="sandbox-diagram" aria-hidden="true"><div class="sandbox-layer layer-back"></div><div class="sandbox-layer layer-front"><el-icon><Box /></el-icon><strong>E2B</strong><span>ISOLATED RUNTIME</span></div></div><div class="sandbox-command"><span aria-hidden="true">$</span><code>python scripts/analyze.py</code><span class="command-tag">{{ t('home.composerExample') }}</span></div>
          </article>
          <article class="product-card governance-product" data-reveal>
            <div class="product-copy"><span class="product-kicker">05 / READY FOR REAL APPLICATIONS</span><h3>{{ t('home.productGovernanceTitle') }}</h3><p>{{ t('home.productGovernanceDescription') }}</p></div>
            <div class="governance-grid"><div v-for="item in governance" :key="item.key"><el-icon aria-hidden="true"><component :is="item.icon" /></el-icon><strong>{{ t(`home.governance_${item.key}`) }}</strong><span>{{ t(`home.governance_${item.key}_description`) }}</span></div></div>
          </article>
        </div>
      </section>

      <section id="integration" class="integration-section">
        <div class="launch-width integration-layout">
          <div class="integration-copy" data-reveal><p class="eyebrow">CONFIGURE. PUBLISH. INVOKE.</p><h2>{{ t('home.integrationTitle') }}<span>{{ t('home.integrationHighlight') }}</span></h2><p>{{ t('home.integrationDescription') }}</p><ul><li v-for="note in ['code', 'release', 'permission']" :key="note"><el-icon aria-hidden="true"><Check /></el-icon>{{ t(`home.integration_${note}`) }}</li></ul><a :href="docsUrl" target="_blank" rel="noopener noreferrer" class="text-link">{{ t('home.integrationDocs') }}<el-icon aria-hidden="true"><TopRight /></el-icon></a></div>
          <div class="code-window" data-reveal><div class="code-toolbar"><div class="window-dots" aria-hidden="true"><i></i><i></i><i></i></div><div class="code-switch"><button v-for="mode in exampleModes" :key="mode" :aria-pressed="exampleMode === mode" :class="{ active: exampleMode === mode }" @click="exampleMode = mode">{{ mode === 'typescript' ? 'TypeScript' : 'HTTP' }}</button></div><button class="copy-button" :aria-label="t('home.copyCode')" @click="copyCode"><el-icon aria-hidden="true"><CopyDocument /></el-icon>{{ t('home.copy') }}</button></div><div class="code-content" tabindex="0" :aria-label="t('home.codeExample')"><pre><code><span v-for="(line, index) in exampleCode.split('\n')" :key="index" class="code-line"><span class="line-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span><span :class="{ 'code-comment': line.startsWith('//') }">{{ line || ' ' }}</span></span></code></pre></div><div class="code-footnote"><el-icon aria-hidden="true"><Lock /></el-icon>{{ t('home.previewPermission') }}<span>{{ t('home.codeExample') }}</span></div></div>
        </div>
      </section>

      <section id="getting-started" class="getting-started launch-width">
        <div class="section-intro" data-reveal><p class="eyebrow">SMALL STEPS. REAL POSSIBILITIES.</p><h2>{{ t('home.startTitle') }}</h2><p>{{ t('home.startDescription') }}</p></div>
        <ol class="steps"><li v-for="step in steps" :key="step" data-reveal><span class="step-number">0{{ step }}</span><h3>{{ t(`home.step${step}`) }}</h3><p>{{ t(`home.step${step}Desc`) }}</p></li></ol>
        <div class="stack-strip" :aria-label="t('home.techTitle')"><span>{{ t('home.techTitle') }}</span><strong v-for="tech in techStack" :key="tech">{{ tech }}</strong></div>
      </section>

      <section class="finale-section"><div class="finale-glow" aria-hidden="true"></div><div class="launch-width finale-content" data-reveal><span class="finale-mark" aria-hidden="true"><el-icon><Cpu /></el-icon></span><p class="eyebrow">THE NEXT CHAPTER IS YOURS.</p><h2>{{ t('home.calloutTitle') }}<span>{{ t('home.calloutHighlight') }}</span></h2><p>{{ t('home.calloutDescription') }}</p><button class="launch-button primary" @click="handleExperience">{{ t(isLoggedIn ? 'home.console' : 'home.experience') }}<el-icon aria-hidden="true"><ArrowRight /></el-icon></button></div></section>
    </main>

    <footer class="launch-footer"><div class="launch-width"><div class="footer-main"><a class="brand" href="#"><span class="brand-symbol" aria-hidden="true"><el-icon><Cpu /></el-icon></span>IceeBoot.</a><p>{{ t('home.footerDescription') }}</p><div class="footer-links"><a :href="sourceUrl" target="_blank" rel="noopener noreferrer">Gitee<el-icon aria-hidden="true"><TopRight /></el-icon></a><a :href="docsUrl" target="_blank" rel="noopener noreferrer">{{ t('home.docs') }}</a><button @click="showContactDialog = true">{{ t('home.contactUs') }}</button><button v-if="isLoggedIn" @click="handleLogout">{{ t('home.logoutBtn') }}</button></div></div><div class="footer-bottom"><span>© {{ currentYear }} IceeBoot</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">京ICP备2024086986号-2</a></div></div></footer>
    <LoginDialog v-model="showLoginDialog" @success="handleLoginSuccess" />
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
const storyElement = ref<HTMLElement>()
const { storyProgress, pageProgress, activeChapter, prefersReducedMotion, canReveal, scrollToChapter } = useScrollStory(storyElement, pageRoot)
const ambientPaused = ref(false)
const isLoggedIn = computed(() => !!userStore.getToken())
const showLoginDialog = ref(false)
const showMockDialog = ref(false)
const showContactDialog = ref(false)
const currentYear = new Date().getFullYear()
const docsUrl = 'https://doc.iceeboot.yxycompany.com'
const sourceUrl = 'https://gitee.com/woshinibaba438cnmlgb/zboot-backend-java'
const techStack = ['Spring Boot', 'Vue 3', 'TypeScript', 'AgentScope', 'MySQL']
const chapters = [
  { key: 'foundation', tags: ['OSS', 'LLM', 'SMS', 'Email', 'RBAC'] },
  { key: 'capabilities', tags: ['Skills', 'Tools', 'MCP', 'E2B'] },
  { key: 'delivery', tags: ['Agent code', 'Versions', 'Token usage'] },
]
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
  --launch-bg: #f5f5f7;
  --launch-surface: #fff;
  --launch-ink: #1d1d20;
  --launch-muted: #666b75;
  --launch-line: #e4e5e9;
  --launch-blue: #2461df;
  --launch-soft: #edf2ff;
  min-height: 100vh;
  background: var(--launch-bg);
  color: var(--launch-ink);
  font-family: 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  -webkit-font-smoothing: antialiased;
  &.is-dark { --launch-bg: #101217; --launch-surface: #191c23; --launch-ink: #f0f2f7; --launch-muted: #a7aeba; --launch-line: #303541; --launch-blue: #8eb4ff; --launch-soft: #252f43; }
  a { color: inherit; text-decoration: none; }
  button { font: inherit; cursor: pointer; }
  a, button { -webkit-tap-highlight-color: transparent; }
  button:disabled { opacity: .45; cursor: default; }
  a:focus-visible, button:focus-visible, [tabindex='0']:focus-visible { outline: 3px solid #6eacff; outline-offset: 5px; }
  .el-icon { flex-shrink: 0; }
}
.launch-width { width: min(1200px, calc(100% - 80px)); margin-inline: auto; }
.skip-link { position: fixed; top: 10px; left: 20px; z-index: 200; background: #fff; color: #161b26 !important; padding: 12px 18px; border-radius: 8px; transform: translateY(-200%); &:focus { transform: translateY(0); } }
.launch-header { position: sticky; top: 0; z-index: 80; background: #080b12e8; color: #f5f7fc; backdrop-filter: blur(18px); border-bottom: 1px solid #ffffff12; }
.header-inner { display: flex; align-items: center; min-height: 64px; gap: 32px; }
.brand { display: inline-flex; align-items: center; gap: 9px; font-size: 21px; font-weight: 650; letter-spacing: -1px; flex-shrink: 0; }
.brand-symbol { width: 29px; height: 29px; display: grid; place-items: center; border-radius: 8px; color: #98c2ff; border: 1px solid #81a9ee66; background: linear-gradient(145deg, #1a355f, #101725); box-shadow: inset 0 1px 1px #b8d6ff33; font-size: 18px; }
.brand-dot { margin-left: -8px; color: #8cbaff; }
.header-inner nav { display: flex; align-items: center; justify-content: center; gap: 32px; margin-left: auto; a { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; min-height: 44px; color: #bec4d1; &:hover { color: #fff; } } }
.header-actions { display: flex; align-items: center; gap: 5px; :deep(.lang-btn) { width: 44px; height: 44px; margin: 0; color: #bdc8de; } }
.utility-button { display: grid; place-items: center; width: 44px; height: 44px; border: 0; border-radius: 8px; background: transparent; color: #bdc8de; font-size: 17px; &:hover { background: #ffffff0a; } }
.nav-cta { min-height: 36px; margin-left: 8px; padding: 0 16px; border: 1px solid #ffffff24; border-radius: 24px; background: #f1f5ff; color: #151e2f; display: inline-flex; gap: 9px; align-items: center; font-size: 12px; font-weight: 600; }
.reading-progress { position: absolute; inset: auto 0 -1px; height: 2px; background: #73b6ff; transform-origin: left; pointer-events: none; }
.engine-story { height: 315svh; min-height: 1900px; background: #060910; color: #f6f8ff; }
.story-sticky { position: sticky; top: 64px; height: calc(100svh - 64px); min-height: 540px; overflow: hidden; background: #060910; isolation: isolate; }
.story-atmosphere { position: absolute; inset: 0; background: radial-gradient(ellipse at 77% 47%, #17396460 0%, #0a12202a 33%, transparent 65%), linear-gradient(0deg, #080d16, transparent 30%); pointer-events: none; }
.engine-visual { position: absolute; inset: -1% -8% 3% 33%; z-index: 0; min-width: 0; transition: filter 500ms ease; }
.story-content { position: relative; display: flex; align-items: center; height: calc(100% - 112px); padding-top: 12px; pointer-events: none; }
.story-copy { width: 46%; display: grid; grid-template-areas: 'chapter'; position: relative; z-index: 2; }
.chapter-copy { grid-area: chapter; opacity: 0; transform: translateY(24px); pointer-events: none; transition: opacity 380ms ease, transform 550ms cubic-bezier(.2,.7,.3,1); &.active { opacity: 1; transform: none; pointer-events: auto; } }
.chapter-eyebrow { display: flex; align-items: center; gap: 9px; font-size: 11px; font-weight: 500; letter-spacing: .1em; color: #9ec6ff; margin-bottom: 24px; span { width: 5px; height: 5px; border-radius: 50%; background: #8cc9ff; box-shadow: 0 0 14px #77bcff99; } }
.chapter-copy h1, .chapter-copy h2 { font-size: clamp(46px, 5.2vw, 74px); letter-spacing: -.055em; line-height: 1.2; font-weight: 650; text-wrap: balance; span { display: block; color: #a9cbff; } }
.chapter-copy h2 { font-size: clamp(42px, 4.5vw, 64px); }
.chapter-description { color: #aeb9cc; font-size: 15px; line-height: 1.95; margin-top: 28px; max-width: 415px; text-wrap: pretty; }
.chapter-actions { margin-top: 30px; display: flex; align-items: center; gap: 25px; }
.launch-button { display: inline-flex; align-items: center; justify-content: center; gap: 16px; min-height: 48px; border: 0; border-radius: 28px; padding: 0 25px; font-size: 14px; font-weight: 600; transition: transform 180ms ease, background 180ms ease; &:hover { transform: translateY(-2px); } &.primary { background: #3677ee; color: #fff; box-shadow: 0 4px 24px #2860d21f; &:hover { background: #4786fb; } } }
.chapter-link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-size: 13px; color: #d8e5fb !important; }
.chapter-tags { display: flex; flex-wrap: wrap; align-items: center; gap: 9px; margin-top: 25px; span { color: #8392aa; font-size: 10px; font-family: 'SFMono-Regular', Consolas, monospace; &:not(:last-child)::after { content: '/'; color: #465268; margin-left: 9px; } } }
.scene-annotation { position: absolute; right: 0; bottom: 20px; display: flex; align-items: center; gap: 8px; font-size: 11px; color: #b3c8e9; pointer-events: none; }
.annotation-line { width: 32px; height: 1px; background: #6499de; }
.annotation-spec { font-size: 8px; letter-spacing: .1em; color: #61738f; margin-left: 8px; }
.story-controls { position: absolute; inset: auto 0 28px; display: flex; align-items: flex-end; justify-content: space-between; gap: 28px; }
.chapter-index { display: flex; gap: 23px; button { display: flex; position: relative; align-items: center; gap: 9px; min-height: 48px; width: 125px; padding: 10px 0; border: 0; border-bottom: 1px solid #ffffff24; background: none; color: #7d8ca4; text-align: left; font-size: 12px; &[aria-current='step'] { color: #e4eeff; } } }
.chapter-number { font-size: 9px; font-family: 'SFMono-Regular', Consolas, monospace; }
.chapter-progress { position: absolute; height: 1px; bottom: -1px; inset-inline: 0; background: #8dbaff; transform-origin: left; }
.motion-controls { display: flex; align-items: center; gap: 20px; }
.scroll-cue { display: flex; align-items: center; gap: 10px; color: #8392aa; font-size: 10px; .el-icon { animation: scroll-nudge 2s ease-in-out infinite; } }
.motion-button { display: grid; place-items: center; border: 1px solid #ffffff22; background: #ffffff05; border-radius: 50%; width: 44px; height: 44px; color: #c2d2e9; font-size: 17px; }
@keyframes scroll-nudge { 50% { transform: translateY(4px); } }
.capabilities-section { padding-block: 112px 104px; scroll-margin-top: 96px; }
.section-intro { max-width: 850px; margin-bottom: 54px; }
.eyebrow { color: var(--launch-blue); font-size: 10px; font-weight: 600; letter-spacing: .15em; margin-bottom: 18px; }
.section-intro h2, .integration-copy h2 { font-size: clamp(34px, 4vw, 52px); line-height: 1.35; font-weight: 650; letter-spacing: -.045em; text-wrap: balance; span { display: block; color: var(--launch-muted); } }
.section-intro > p:last-child { color: var(--launch-muted); font-size: 16px; line-height: 1.9; margin-top: 23px; max-width: 600px; }
.capability-bento { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: 24px; }
.product-card { overflow: hidden; border-radius: 26px; background: var(--launch-surface); border: 1px solid var(--launch-line); padding: 38px; position: relative; }
.product-kicker { display: block; color: var(--launch-muted); font-size: 9px; letter-spacing: .1em; margin-bottom: 16px; }
.product-copy h3 { font-size: 29px; line-height: 1.35; letter-spacing: -.04em; font-weight: 650; }
.product-copy p { color: var(--launch-muted); font-size: 13px; line-height: 1.9; margin-top: 15px; max-width: 460px; }
.agent-product { grid-column: span 7; background: linear-gradient(160deg, var(--launch-surface), var(--launch-soft)); }
.services-product { grid-column: span 5; }
.agent-composer { max-width: 440px; margin: 32px auto 0; padding: 22px; border: 1px solid var(--launch-line); background: var(--launch-surface); border-radius: 16px; box-shadow: 0 16px 30px -24px #132b5c77; }
.composer-top { display: flex; align-items: center; gap: 10px; > div { display: flex; flex-direction: column; gap: 3px; } strong { font-size: 16px; font-weight: 600; } > div > span { color: var(--launch-muted); font-size: 10px; } }
.composer-avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 10px; background: var(--launch-soft); color: var(--launch-blue); font-size: 20px; }
.version-pill { margin-left: auto; font-size: 10px; color: var(--launch-blue); background: var(--launch-soft); border-radius: 4px; padding: 4px 8px; }
.composer-lines { display: flex; justify-content: space-between; font-size: 11px; border-block: 1px solid var(--launch-line); padding-block: 14px; margin-block: 18px 14px; color: var(--launch-muted); strong { color: var(--launch-ink); font-weight: 500; } }
.composer-capabilities { display: flex; gap: 8px; flex-wrap: wrap; button { display: flex; align-items: center; gap: 5px; min-height: 38px; padding: 0 11px; background: none; border: 1px solid var(--launch-line); border-radius: 7px; color: var(--launch-muted); font-size: 11px; &.selected { border-color: #9ab8f0; color: var(--launch-blue); background: var(--launch-soft); } } }
.composer-result { border-top: 1px dashed var(--launch-line); padding-top: 15px; margin-top: 15px; display: flex; flex-direction: column; gap: 7px; code { color: var(--launch-blue); font-size: 11px; } }
.code-label { color: var(--launch-muted); font-size: 10px; }
.service-matrix { display: grid; grid-template-columns: repeat(3, 1fr); gap: 25px 12px; margin-top: 44px; > div { display: flex; flex-direction: column; align-items: center; gap: 8px; } strong { font-size: 12px; font-weight: 600; } > div > span:last-child { color: var(--launch-muted); font-size: 10px; } }
.service-icon { display: grid; place-items: center; width: 49px; height: 49px; color: var(--launch-blue); background: var(--launch-soft); border: 1px solid var(--launch-line); border-radius: 14px; font-size: 23px; }
.model-product { grid-column: span 6; }
.provider-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-top: 27px; button { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 9px; min-height: 80px; border: 1px solid var(--launch-line); border-radius: 12px; background: none; color: var(--launch-muted); font-size: 10px; transition: background 180ms, border-color 180ms; &.selected { border-color: var(--launch-blue); background: var(--launch-soft); color: var(--launch-blue); } } }
.provider-monogram { font-size: 22px; font-weight: 600; line-height: 1; color: var(--launch-ink); }
.provider-detail { display: flex; align-items: center; gap: 12px; border-top: 1px solid var(--launch-line); margin-top: 20px; padding-top: 17px; font-size: 11px; > span:first-child { font-weight: 600; } > span:nth-child(2) { color: var(--launch-muted); margin-left: auto; } .el-icon { color: var(--launch-blue); } }
.sandbox-product { grid-column: span 6; background: #101a2c; border-color: #273b58; color: #f1f5ff; .product-kicker { color: #8aabd8; } .product-copy p { color: #a7bbd9; } }
.sandbox-diagram { width: 220px; height: 172px; margin: 10px auto 5px; position: relative; perspective: 700px; }
.sandbox-layer { position: absolute; inset: 25px 20px; border-radius: 18px; transform: rotateX(49deg) rotateZ(-31deg); border: 1px solid #92bcff70; }
.layer-back { background: #315a9226; transform: translateY(27px) rotateX(49deg) rotateZ(-31deg); box-shadow: 0 8px 30px #1c4fa033; }
.layer-front { background: linear-gradient(145deg, #456b9860, #1a2e4b); box-shadow: inset 0 1px 4px #9fc6ff50, 0 10px 35px #001b42b3; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 6px; .el-icon { color: #b4d6ff; font-size: 24px; } strong { font-size: 24px; line-height: 1; letter-spacing: 1px; } span { color: #94b8e8; font-size: 8px; letter-spacing: .15em; } }
.sandbox-command { display: flex; align-items: center; gap: 10px; font-size: 11px; border: 1px solid #7ca5db30; border-radius: 8px; padding: 13px 14px; background: #07101f; color: #b9d3f5; > span:first-child { color: #6ea5f7; } code { overflow-wrap: anywhere; min-width: 0; } }
.command-tag { margin-left: auto; color: #7d9abd; font-size: 9px; white-space: nowrap; }
.governance-product { grid-column: span 12; display: grid; grid-template-columns: 1fr 1.2fr; align-items: center; gap: 45px; }
.governance-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 25px; > div { display: flex; flex-direction: column; gap: 12px; border-left: 1px solid var(--launch-line); padding-left: 20px; } .el-icon { font-size: 22px; color: var(--launch-blue); } strong { font-size: 13px; font-weight: 600; } span { font-size: 11px; line-height: 1.8; color: var(--launch-muted); } }
.integration-section { background: var(--launch-surface); border-block: 1px solid var(--launch-line); padding-block: 100px; scroll-margin-top: 64px; }
.integration-layout { display: grid; grid-template-columns: .85fr 1.15fr; align-items: center; gap: 70px; }
.integration-copy > p:not(.eyebrow) { color: var(--launch-muted); font-size: 14px; line-height: 1.9; margin-top: 25px; max-width: 360px; }
.integration-copy ul { list-style: none; display: flex; flex-direction: column; gap: 13px; margin-top: 25px; li { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--launch-muted); .el-icon { color: var(--launch-blue); } } }
.text-link { display: inline-flex; align-items: center; gap: 6px; color: var(--launch-blue) !important; font-size: 13px; margin-top: 30px; min-height: 44px; }
.code-window { background: #111a2a; border: 1px solid #34425b; border-radius: 16px; overflow: hidden; box-shadow: 0 24px 48px -25px #0b173d70; }
.code-toolbar { display: flex; align-items: center; gap: 15px; padding: 0 18px; border-bottom: 1px solid #ffffff10; }
.window-dots { display: flex; gap: 5px; margin-right: 5px; i { width: 6px; height: 6px; background: #47556d; border-radius: 50%; } }
.code-switch { display: flex; gap: 16px; button { border: 0; border-bottom: 2px solid transparent; background: none; color: #9dadc7; min-height: 48px; padding: 0 1px; font-size: 11px; &.active { color: #eff6ff; border-bottom-color: #85b9ff; } } }
.copy-button { display: flex; align-items: center; gap: 5px; margin-left: auto; min-height: 44px; border: 0; background: none; color: #b7c9e4; font-size: 11px; }
.code-content { padding: 26px 20px; min-height: 290px; pre { margin: 0; } code { font-family: 'SFMono-Regular', Consolas, monospace; font-size: 12px; line-height: 2.15; color: #dce9ff; } }
.code-line { display: grid; grid-template-columns: 30px minmax(0, 1fr); white-space: pre-wrap; overflow-wrap: anywhere; }
.line-number { color: #6d819f; user-select: none; font-size: 10px; }
.code-comment { color: #8dabc9; }
.code-footnote { display: flex; align-items: center; gap: 7px; padding: 15px 18px; border-top: 1px solid #ffffff10; color: #95abc9; font-size: 10px; span { margin-left: auto; font-size: 9px; } }
.getting-started { padding-block: 100px 75px; }
.steps { list-style: none; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 32px; li { border-top: 1px solid var(--launch-line); padding-top: 24px; } h3 { font-size: 17px; font-weight: 600; margin-block: 20px 12px; } p { color: var(--launch-muted); font-size: 12px; line-height: 1.9; } }
.step-number { font-size: 12px; color: var(--launch-blue); font-family: 'SFMono-Regular', Consolas, monospace; }
.stack-strip { display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between; gap: 20px; padding-top: 45px; margin-top: 60px; border-top: 1px solid var(--launch-line); > span { font-size: 11px; color: var(--launch-muted); } strong { font-size: 13px; font-weight: 600; } }
.finale-section { background: #070b14; color: #f2f5fd; overflow: hidden; position: relative; padding-block: 105px; }
.finale-glow { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% 100%, #15488360, transparent 60%); pointer-events: none; }
.finale-content { position: relative; text-align: center; .eyebrow { margin-top: 24px; color: #89b9ff; } h2 { font-size: clamp(38px, 5vw, 62px); line-height: 1.3; letter-spacing: -.05em; font-weight: 600; span { display: block; color: #9ebee9; } } > p:not(.eyebrow) { color: #9aaecb; font-size: 14px; line-height: 1.8; margin-top: 23px; } .launch-button { margin-top: 32px; } }
.finale-mark { display: inline-grid; place-items: center; width: 65px; height: 65px; border: 1px solid #89b9ff66; border-radius: 18px; font-size: 35px; color: #a8d2ff; background: linear-gradient(135deg, #213a5c, #101a2b); box-shadow: inset 0 1px 3px #c5e0ff66, 0 14px 45px #00387950; transform: perspective(500px) rotateX(18deg) rotateY(-20deg); }
.launch-footer { background: #070b14; color: #bdc7d8; border-top: 1px solid #ffffff12; padding-block: 32px 20px; }
.footer-main { display: flex; align-items: center; gap: 24px; > p { font-size: 11px; color: #8c9cb4; } }
.footer-links { display: flex; gap: 22px; margin-left: auto; a, button { min-height: 44px; display: inline-flex; gap: 4px; align-items: center; border: 0; background: none; color: #9cabc2; font-size: 11px; } }
.footer-bottom { display: flex; justify-content: space-between; gap: 14px; border-top: 1px solid #ffffff10; margin-top: 24px; padding-top: 20px; color: #71839e; font-size: 10px; }
.contact-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 22px 16px; figure { margin: 0; text-align: center; } img { width: 100%; max-width: 144px; height: auto; aspect-ratio: 1; object-fit: contain; } figcaption { font-size: 12px; margin-top: 8px; } }
.can-reveal [data-reveal] { opacity: 0; transform: translateY(36px) scale(.985); transition: opacity 700ms ease, transform 900ms cubic-bezier(.2,.7,.3,1); &.is-visible { opacity: 1; transform: none; } }
@media (min-width: 1600px) { .launch-width { width: min(1360px, calc(100% - 120px)); } .chapter-copy h1 { font-size: 84px; } .story-copy { width: 47%; } .chapter-description { font-size: 16px; } }
@media (max-width: 1100px) {
  .launch-width { width: calc(100% - 56px); }
  .chapter-copy h1 { font-size: 58px; }
  .chapter-copy h2 { font-size: 50px; }
  .engine-visual { left: 30%; right: -15%; }
  .chapter-description { font-size: 14px; }
  .scene-annotation .annotation-spec { display: none; }
  .product-card { padding: 30px; }
  .product-copy h3 { font-size: 26px; }
  .integration-layout { gap: 40px; }
  .governance-product { grid-template-columns: 1fr; gap: 30px; }
  .governance-grid > div { padding-left: 0; border-left: 0; border-top: 1px solid var(--launch-line); padding-top: 18px; }
}
@media (max-width: 760px) {
  .launch-width { width: calc(100% - 40px); }
  .header-inner { gap: 8px; }
  .header-inner nav { display: none; }
  .header-actions { margin-left: auto; gap: 0; }
  .nav-cta { padding-inline: 13px; margin-left: 5px; }
  .brand { font-size: 19px; gap: 7px; }
  .brand-symbol { width: 27px; height: 27px; }
  .engine-story { height: 290svh; min-height: 1700px; }
  .story-sticky { min-height: 620px; }
  .story-content { align-items: flex-start; padding-top: 36px; height: calc(100% - 94px); }
  .story-copy { width: 100%; }
  .chapter-copy h1 { font-size: clamp(41px, 7vw, 56px); }
  .chapter-copy h2 { font-size: 40px; }
  .chapter-eyebrow { font-size: 9px; margin-bottom: 17px; }
  .chapter-description { margin-top: 18px; max-width: 440px; font-size: 13px; line-height: 1.85; }
  .chapter-actions { gap: 22px; margin-top: 20px; }
  .launch-button { min-height: 44px; padding-inline: 21px; font-size: 13px; }
  .chapter-tags { margin-top: 17px; }
  .engine-visual { top: 36%; left: -7%; right: -7%; bottom: 48px; }
  .scene-annotation { bottom: -2px; left: 0; right: auto; font-size: 9px; }
  .scene-annotation .annotation-line { width: 18px; }
  .story-controls { bottom: 17px; gap: 12px; align-items: flex-end; }
  .chapter-index { gap: 12px; flex: 1; button { width: auto; flex: 1; gap: 6px; font-size: 10px; } }
  .motion-controls { gap: 0; }
  .scroll-cue { display: none; }
  .motion-button { width: 40px; height: 40px; }
  .capabilities-section { padding-block: 70px; }
  .section-intro { margin-bottom: 34px; }
  .section-intro h2, .integration-copy h2 { font-size: 34px; }
  .section-intro > p:last-child { font-size: 14px; margin-top: 20px; }
  .capability-bento { gap: 18px; }
  .product-card { grid-column: span 12; padding: 28px; border-radius: 22px; }
  .services-product .product-copy p { max-width: 100%; }
  .service-matrix { gap: 24px; margin-top: 30px; }
  .service-matrix strong { font-size: 13px; }
  .agent-composer { margin-top: 25px; padding: 18px; }
  .composer-capabilities button { min-height: 44px; }
  .sandbox-diagram { margin-block: 20px; }
  .provider-grid button { min-height: 82px; }
  .governance-grid { gap: 16px; > div { gap: 10px; } strong { font-size: 12px; } span { font-size: 10px; } }
  .integration-section { padding-block: 65px; }
  .integration-layout { grid-template-columns: 1fr; gap: 35px; }
  .integration-copy > p:not(.eyebrow) { max-width: none; }
  .code-content { padding: 20px 14px; code { font-size: 11px; } }
  .code-footnote span { display: none; }
  .getting-started { padding-block: 65px; }
  .steps { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 28px 22px; }
  .steps h3 { font-size: 16px; }
  .stack-strip { gap: 18px 25px; padding-top: 30px; margin-top: 40px; > span { width: 100%; } }
  .finale-section { padding-block: 75px; }
  .finale-content > p:not(.eyebrow) { max-width: 300px; margin-inline: auto; }
  .footer-main { flex-wrap: wrap; gap: 15px; > p { width: calc(100% - 150px); font-size: 10px; line-height: 1.7; } }
  .footer-links { width: 100%; margin: 0; gap: 25px; flex-wrap: wrap; }
  .footer-bottom { font-size: 9px; }
}
@media (max-width: 400px) {
  .launch-width { width: calc(100% - 32px); }
  .chapter-copy h1 { font-size: 40px; }
  .chapter-copy h2 { font-size: 36px; }
  .chapter-description { font-size: 12px; max-width: 330px; }
  .product-card { padding: 24px; }
  .product-copy h3 { font-size: 25px; }
  .provider-grid { gap: 6px; button { font-size: 9px; } }
  .provider-detail { font-size: 10px; }
  .contact-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
.reduce-motion {
  .engine-story { height: auto; min-height: 0; }
  .story-sticky { position: relative; top: 0; height: auto; min-height: 0; overflow: hidden; }
  .story-content { display: block; height: auto; padding-block: 380px 50px; }
  .engine-visual { inset: 0 0 auto; height: 360px; }
  .story-copy { display: flex; width: 100%; flex-direction: column; gap: 60px; max-width: 700px; }
  .chapter-copy { opacity: 1; transform: none; pointer-events: auto; }
  .chapter-copy h1, .chapter-copy h2 { font-size: clamp(36px, 5vw, 60px); }
  .scene-annotation, .story-controls { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .launch-site *, .launch-site *::before, .launch-site *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .can-reveal [data-reveal] { opacity: 1; transform: none; }
}
</style>
