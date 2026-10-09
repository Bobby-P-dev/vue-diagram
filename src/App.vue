<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import {
  PanelLeftOpen,
  MessageSquare,
  Plus,
  Sparkles,
  Workflow,
  Network,
  Database,
  Boxes,
  RefreshCw,
  Zap,
  Brain,
  Layers,
  AlertCircle,
  X,
  History,
  Palette,
  Loader2,
  CheckCircle2,
  Clock,
  FilePlus,
  ArrowRight,
  ArrowLeftRight,
  Component,
  Server,
  GitBranch,
  Share2,
} from 'lucide-vue-next'
import TopNavbar from './components/layout/TopNavbar.vue'
import ProjectSidebar from './components/layout/ProjectSidebar.vue'
import AiWorkspacePanel from './components/layout/AiWorkspacePanel.vue'
import DiagramCanvas from './components/canvas/DiagramCanvas.vue'
import ExportDropdown from './components/ui/ExportDropdown.vue'
import NewProjectModal from './components/ui/NewProjectModal.vue'
import VersionHistoryModal from './components/ui/VersionHistoryModal.vue'
import ShareProjectModal from './components/ui/ShareProjectModal.vue'
import FoundationsCatalog from './components/ui-design/views/FoundationsCatalog.vue'
import SharedProjectView from './components/ui-design/views/SharedProjectView.vue'
import TokenInspectorModal from './components/ui-design/TokenInspectorModal.vue'
import AccessGateView from './components/auth/AccessGateView.vue'
import AdminCredentialsModal from './components/admin/AdminCredentialsModal.vue'
import { DESIGN_FOUNDATIONS } from './assets/foundations.js'
import { useDiagramStore } from './stores/diagramStore.js'

const store = useDiagramStore()

const currentView = ref('workspace') // 'workspace' | 'foundations' | 'shared'
const isSidebarOpen = ref(true)
const isChatOpen = ref(true)
const isNewModalOpen = ref(false)
const isVersionHistoryOpen = ref(false)
const isTokenInspectorOpen = ref(false)
const isShareModalOpen = ref(false)
const isAdminModalOpen = ref(false)
const shareToken = ref('')
const errorVisible = ref(false)
let errorTimer = null

const activeFoundation = computed(() => {
  return (
    DESIGN_FOUNDATIONS.find((f) => f.id === store.activeFoundationId.value) ||
    DESIGN_FOUNDATIONS[0]
  )
})

const currentVersionNumber = computed(() => {
  const versions = store.projectVersions.value || []
  return versions.length > 0 ? versions[0].version_number : 1
})

const formattedStreamTime = computed(() => {
  const sec = store.uiStreamProgress.value?.elapsedSeconds || 0
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const streamDisplaySections = computed(() => {
  const progress = store.uiStreamProgress.value || {}
  const rawSections = progress.sections || []
  const stage = progress.stage || 'idle'
  const activeSection = progress.activeSection || ''

  if (rawSections.length > 0) {
    const activeIdx = rawSections.indexOf(activeSection)
    if (activeIdx >= 0) {
      return rawSections.map((s, idx) => {
        const name = s.replace(/^sec-/, '').replace(/_/g, ' ')
        let status = 'pending'
        if (stage === 'complete') {
          status = 'done'
        } else if (idx < activeIdx) {
          status = 'done'
        } else if (idx === activeIdx) {
          status = 'active'
        }
        return {
          id: s,
          label: name.charAt(0).toUpperCase() + name.slice(1),
          status,
        }
      })
    }

    const list = rawSections.map((s, idx) => {
      const name = s.replace(/^sec-/, '').replace(/_/g, ' ')
      const isDone = stage === 'compiling' || stage === 'complete' || idx < rawSections.length - 1
      const isCurrent = stage === 'generating' && idx === rawSections.length - 1
      return {
        id: s,
        label: name.charAt(0).toUpperCase() + name.slice(1),
        status: isDone ? 'done' : isCurrent ? 'active' : 'pending',
      }
    })

    // Validasi & Penataan Kanvas only activates when token generation is complete
    list.push({
      id: 'canvas-assembly',
      label: 'Validasi & Penataan Kanvas',
      status: stage === 'complete' ? 'done' : stage === 'compiling' ? 'active' : 'pending',
    })

    return list
  }

  // Fallback before individual sections are parsed from stream
  const tokens = progress.tokens || 0
  const isAnalyzing = stage === 'analyzing' || (stage === 'generating' && tokens < 60)
  const isGenerating = stage === 'generating' && tokens >= 60

  return [
    {
      id: 'analyzing',
      label: 'Analisis Kebutuhan & Arsitektur UI',
      status: isAnalyzing ? 'active' : 'done',
    },
    {
      id: 'layout',
      label: 'Perancangan Struktur & Layout',
      status: isGenerating ? 'active' : (isAnalyzing ? 'pending' : 'done'),
    },
    {
      id: 'components',
      label: 'Perakitan Komponen & Kode Tailwind',
      status: stage === 'compiling' || stage === 'complete' ? 'done' : 'pending',
    },
    {
      id: 'canvas-assembly',
      label: 'Validasi & Penataan Kanvas',
      status: stage === 'complete' ? 'done' : stage === 'compiling' ? 'active' : 'pending',
    },
  ]
})

const DIRECTION_MAP = {
  flowchart: 'TB',
  architecture: 'TB',
  c4: 'TB',
  sequence: 'LR',
  erd: 'TB',
  class: 'TB',
  state: 'LR',
  pipeline: 'LR',
  network: 'TB',
  cicd: 'LR',
  mindmap: 'LR',
  swimlane: 'LR',
  ui_design: 'LR',
}

const DIAGRAM_TYPE_LABELS = {
  flowchart: 'Flowchart',
  architecture: 'Architecture',
  c4: 'C4 Model',
  sequence: 'Sequence Diagram',
  erd: 'ERD / Database',
  class: 'UML Class',
  state: 'State Machine',
  pipeline: 'Data Pipeline',
  network: 'Network & Infra',
  cicd: 'CI/CD Pipeline',
  mindmap: 'Mind Map',
  swimlane: 'Swimlane BPMN',
  ui_design: 'UI Design Canvas',
}

const TYPE_ICON_MAP = {
  flowchart: Workflow,
  architecture: Network,
  c4: Component,
  sequence: ArrowLeftRight,
  erd: Database,
  class: Boxes,
  state: RefreshCw,
  pipeline: Zap,
  network: Server,
  cicd: GitBranch,
  mindmap: Brain,
  swimlane: Layers,
  ui_design: Palette,
}

const isUiDesignProject = computed(() => {
  return (
    store.activeProject.value?.project_mode === 'ui_design' ||
    store.activeProject.value?.diagram_type === 'ui_design'
  )
})

const currentDirection = computed(() => {
  const type = store.activeProject.value?.diagram_type || 'flowchart'
  return DIRECTION_MAP[type] || 'TB'
})

const activeDiagramLabel = computed(() => {
  const type = store.activeProject.value?.diagram_type
  if (!type) return ''
  return DIAGRAM_TYPE_LABELS[type.toLowerCase()] || type.toUpperCase()
})

const activeDiagramIcon = computed(() => {
  const type = store.activeProject.value?.diagram_type
  return TYPE_ICON_MAP[type?.toLowerCase()] || Workflow
})

function handleNavigate(view) {
  currentView.value = view
}

function openTokenInspector() {
  isTokenInspectorOpen.value = true
}

function handleSelectFoundation(foundationId) {
  store.setActiveFoundation(foundationId)
}

function handleSelectFoundationFromCatalog(foundationOrId) {
  const id = typeof foundationOrId === 'string' ? foundationOrId : foundationOrId?.id
  if (id) store.setActiveFoundation(id)
  currentView.value = 'workspace'
}

function handleCreateWithFoundation(foundationId) {
  store.setActiveFoundation(foundationId)
  currentView.value = 'workspace'
  openNewProjectModal()
}

async function handleSelectTemplate(template) {
  const success = await store.startNewProject('', template.diagram_type, template.id)
  if (success) {
    currentView.value = 'workspace'
  }
}

function handleSendPromptToChat(promptText) {
  store.sendFollowUpChat(promptText)
}

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
}

function toggleChat() {
  isChatOpen.value = !isChatOpen.value
}

function openNewProjectModal() {
  isNewModalOpen.value = true
}

function closeNewProjectModal() {
  isNewModalOpen.value = false
}

async function handleCreateProject(payload) {
  closeNewProjectModal()
  currentView.value = 'workspace'

  if (payload.mode === 'ui_design') {
    await store.startNewUiDesignProject({
      prompt: payload.prompt,
      device: payload.device,
      orchestrationMode: payload.orchestrationMode || 'fast',
      templateId: payload.templateId,
    })
  } else {
    await store.startNewProject(
      payload.prompt,
      payload.diagramType,
      payload.templateId,
    )
  }
}

async function handleCreateBlankProject(payload) {
  closeNewProjectModal()
  currentView.value = 'workspace'
  await store.createBlankProject(
    payload?.mode || 'ui_design',
    payload?.device || 'web',
  )
}

const canvasMode = ref('ui_design') // 'ui_design' | 'diagram'
const canvasPrompt = ref('')
const canvasDevice = ref('web')
const canvasDiagramType = ref('flowchart')

watch(
  () => [store.canGenerateUI.value, store.canGenerateDiagram.value],
  ([canUI, canDiagram]) => {
    if (!canUI && canDiagram) {
      canvasMode.value = 'diagram'
    } else if (canUI && !canDiagram) {
      canvasMode.value = 'ui_design'
    }
  },
  { immediate: true },
)

async function handleGenerateFromCanvas() {
  if (!canvasPrompt.value.trim() || store.isGenerating.value) return
  const text = canvasPrompt.value.trim()
  canvasPrompt.value = ''

  if (canvasMode.value === 'ui_design') {
    await store.startNewUiDesignProject({
      prompt: text,
      device: canvasDevice.value,
    })
  } else {
    await store.startNewProject(text, canvasDiagramType.value)
  }
}

function showError(msg) {
  errorVisible.value = true
  clearTimeout(errorTimer)
  errorTimer = setTimeout(() => {
    errorVisible.value = false
  }, 6000)
}

function dismissError() {
  errorVisible.value = false
  clearTimeout(errorTimer)
  store.clearError()
}

watch(
  () => store.errorMessage.value,
  (msg) => {
    if (msg) showError(msg)
  }
)

function openShareModal() {
  isShareModalOpen.value = true
}

function handleCloseShare() {
  if (window.history.replaceState) {
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
  }
  currentView.value = 'workspace'
}

async function handleForkSuccess(forkedProject) {
  if (window.history.replaceState) {
    const cleanUrl = window.location.pathname
    window.history.replaceState({}, document.title, cleanUrl)
  }
  currentView.value = 'workspace'
  await store.loadSidebar()
  if (forkedProject?.id) {
    await store.selectProject(forkedProject.id)
  }
}

async function handleLoginSuccess() {
  await store.loadSidebar()
  currentView.value = 'workspace'
}

function handleLogout() {
  store.logout()
  currentView.value = 'workspace'
}

onMounted(async () => {
  // Check URL for share token (?share=token or /share/token)
  const urlParams = new URLSearchParams(window.location.search)
  const queryShare = urlParams.get('share')
  const pathShareMatch = window.location.pathname.match(/\/share\/([a-zA-Z0-9_-]+)/)
  const foundToken = queryShare || (pathShareMatch ? pathShareMatch[1] : null)

  if (foundToken) {
    shareToken.value = foundToken
    currentView.value = 'shared'
  }

  // Verify auth session with backend
  const hasAuth = await store.checkAuth()
  if (hasAuth) {
    await store.loadSidebar()
  }

  // Start on an empty canvas with copilot chat open by default (do not auto-open random project)
  if (!foundToken) {
    store.activeProject.value = null
    store.nodes.value = []
    store.edges.value = []
    store.chatHistory.value = []
    isChatOpen.value = true
  }
})
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans text-slate-800 antialiased">
    <!-- ACCESS GATE: Shown when not authenticated and not accessing a public shared view -->
    <AccessGateView
      v-if="!store.isAuthenticated.value && currentView !== 'shared'"
      @login-success="handleLoginSuccess"
    />

    <!-- AUTHENTICATED APP OR PUBLIC SHARE VIEW -->
    <template v-else>
      <!-- 1. TOP NAVBAR (Hidden during standalone public share view) -->
      <TopNavbar
        v-if="currentView !== 'shared'"
        :current-view="currentView"
        :active-project-title="store.activeProject.value?.title || 'Untitled Project'"
        :active-foundation-name="activeFoundation.name"
        :has-diagram="store.hasDiagram.value"
        :current-version-number="currentVersionNumber"
        :is-ui-design="isUiDesignProject"
        :current-user="store.currentUser.value"
        :is-admin="store.isAdmin.value"
        :can-generate-ui="store.canGenerateUI.value"
        @navigate="handleNavigate"
        @new-project="openNewProjectModal"
        @open-versions="isVersionHistoryOpen = true"
        @inspect-tokens="openTokenInspector"
        @toggle-sidebar="toggleSidebar"
        @open-admin="isAdminModalOpen = true"
        @logout="handleLogout"
      />

      <!-- 2. BODY CONTENT (Conditional on currentView) -->
      <div :class="['flex flex-1 w-full overflow-hidden bg-slate-50', currentView === 'shared' ? 'h-full' : 'h-[calc(100vh-48px)]']">
      <!-- VIEW S: SHARED PROJECT (Public Interactive Read-only View) -->
      <div v-if="currentView === 'shared'" class="w-full h-full overflow-hidden bg-slate-900">
        <SharedProjectView
          :token="shareToken"
          @close-share="handleCloseShare"
          @fork-success="handleForkSuccess"
        />
      </div>

      <!-- VIEW A: FOUNDATIONS CATALOG -->
      <div v-else-if="currentView === 'foundations'" class="w-full h-full overflow-hidden bg-slate-950">
        <FoundationsCatalog
          :active-foundation-id="store.activeFoundationId.value"
          @select-foundation="handleSelectFoundationFromCatalog"
          @inspect-tokens="openTokenInspector"
        />
      </div>

      <!-- VIEW B: ACTIVE WORKSPACE (Canvas + Sidebars) -->
      <div v-else class="flex w-full h-full overflow-hidden">
        <!-- LEFT SIDEBAR -->
        <ProjectSidebar
          :is-open="isSidebarOpen"
          :active-foundation-id="store.activeFoundationId.value"
          @toggle="toggleSidebar"
          @new-project="openNewProjectModal"
          @select-foundation="handleSelectFoundation"
          @inspect-tokens="openTokenInspector"
          @send-prompt-to-chat="handleSendPromptToChat"
        />

        <!-- CENTER CANVAS WORKSPACE -->
        <main class="relative flex flex-1 flex-col h-full min-w-0 overflow-hidden bg-slate-50">
          <!-- Canvas Top Quick Action Bar -->
          <div class="h-10 border-b border-slate-200/80 bg-white/90 backdrop-blur-xs px-4 flex items-center justify-between z-10 select-none shadow-xs">
            <div class="flex items-center gap-2 min-w-0">
              <button
                v-if="!isSidebarOpen"
                type="button"
                @click="toggleSidebar"
                title="Open sidebar"
                class="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors"
              >
                <PanelLeftOpen class="w-4 h-4" />
              </button>

              <div class="flex items-center gap-2 truncate">
                <span class="text-xs font-semibold text-slate-800 truncate">
                  {{ store.activeProject.value?.title || 'No Project Selected' }}
                </span>
                <span
                  v-if="isUiDesignProject"
                  class="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs"
                >
                  <Palette class="w-2.5 h-2.5 text-indigo-600 flex-shrink-0" />
                  <span>UI Design Canvas</span>
                </span>
                <span
                  v-else-if="store.activeProject.value?.diagram_type"
                  class="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-xs"
                >
                  <component :is="activeDiagramIcon" class="w-2.5 h-2.5 text-slate-600 flex-shrink-0" />
                  <span>{{ activeDiagramLabel }}</span>
                </span>
              </div>
            </div>

            <!-- Right Controls: Version History, Export, Toggle Chat -->
            <div class="flex items-center gap-2">
              <button
                v-if="store.hasDiagram.value"
                type="button"
                @click="isVersionHistoryOpen = true"
                title="Riwayat Versi Diagram"
                class="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <History class="w-3.5 h-3.5 text-indigo-600" />
                <span class="hidden md:inline font-semibold text-[11px]">
                  v{{ currentVersionNumber }}
                </span>
              </button>

              <ExportDropdown v-if="store.hasDiagram.value" />

              <button
                v-if="store.hasDiagram.value"
                type="button"
                @click="openShareModal"
                title="Bagikan Proyek & Chat"
                class="px-2 py-1 rounded-md border border-slate-200 bg-white hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 text-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Share2 class="w-3.5 h-3.5 text-indigo-600" />
                <span class="hidden sm:inline font-semibold text-[11px]">Bagikan</span>
              </button>

              <button
                type="button"
                @click="toggleChat"
                :title="isChatOpen ? 'Hide Assistant' : 'Show Assistant'"
                :class="[
                  'p-1.5 rounded-md border text-xs font-medium transition-colors flex items-center gap-1.5',
                  isChatOpen
                    ? 'bg-slate-100 text-slate-800 border-slate-200'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 shadow-xs'
                ]"
              >
                <MessageSquare class="w-3.5 h-3.5" />
                <span class="hidden md:inline text-[11px]">{{ isChatOpen ? 'Close Copilot' : 'Open Copilot' }}</span>
              </button>
            </div>
          </div>

          <!-- Canvas Container -->
          <div class="relative flex-1 w-full h-full overflow-hidden">
            <DiagramCanvas
              :nodes="store.nodes.value"
              :edges="store.edges.value"
              :direction="currentDirection"
              :diagram-type="store.activeProject.value?.diagram_type"
            />

            <!-- Multi-Screen / New Screen Generation Overlay on Existing Canvas -->
            <div
              v-if="store.hasDiagram.value && store.isNewScreenGenerating?.value"
              class="pointer-events-none absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-30 flex flex-col items-center justify-center select-none px-4 transition-all"
            >
              <div class="pointer-events-auto w-full max-w-md max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                <!-- Header: Badge & Live Timer -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Stream Synthesis</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    <Clock class="w-3.5 h-3.5 text-slate-500" />
                    <span>{{ formattedStreamTime }}</span>
                  </div>
                </div>

                <!-- Current Action & Token Counter -->
                <div class="space-y-1 text-left">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                      <span>{{ store.uiStreamProgress?.value?.message || 'Merancang screen baru di samping kanvas...' }}</span>
                    </h4>
                  </div>
                  <div class="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>
                      <span v-if="store.uiStreamProgress?.value?.tokens > 0" class="font-medium text-indigo-600">
                        ⚡ {{ store.uiStreamProgress?.value?.tokens }} token terkompilasi
                      </span>
                      <span v-else>Menyelaraskan identitas brand & layout Screen 1...</span>
                    </span>
                    <span class="font-bold text-slate-700">{{ store.uiStreamProgress?.value?.progressPercent || 15 }}%</span>
                  </div>
                </div>

                <!-- Smooth Animated Progress Bar -->
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                  <div
                    class="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                    :style="{ width: `${store.uiStreamProgress?.value?.progressPercent || 15}%` }"
                  ></div>
                </div>

                <!-- Live Section Checklist / Construction Status -->
                <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 text-left space-y-2">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Seksi Sedang Dibuat
                  </div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(sec, idx) in streamDisplaySections"
                      :key="idx"
                      class="flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors"
                      :class="[
                        sec.status === 'active' ? 'bg-indigo-50/80 text-indigo-900 font-semibold' :
                        sec.status === 'done' ? 'text-slate-600' : 'text-slate-400'
                      ]"
                    >
                      <div class="flex items-center gap-2">
                        <CheckCircle2 v-if="sec.status === 'done'" class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <Loader2 v-else-if="sec.status === 'active'" class="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                        <span v-else class="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400 shrink-0">•</span>
                        <span>{{ sec.label }}</span>
                      </div>
                      <span
                        v-if="sec.status === 'active'"
                        class="text-[10px] font-bold text-indigo-600 px-1.5 py-0.5 rounded-md bg-indigo-100/70"
                      >
                        Sedang Dirakit
                      </span>
                      <span
                        v-else-if="sec.status === 'done'"
                        class="text-[10px] font-medium text-emerald-600"
                      >
                        Siap
                      </span>
                      <span v-else class="text-[10px] text-slate-400">Menunggu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- CrewAI Multi-Agent Generating Overlay on Canvas -->
            <div
              v-if="!store.hasDiagram.value && store.asyncJob?.isJobRunning?.value"
              class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3.5 select-none px-4"
            >
              <div class="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center border border-indigo-200/60 shadow-lg backdrop-blur-xs">
                <Loader2 class="w-7 h-7 animate-spin text-indigo-600" />
              </div>
              <div class="text-center max-w-sm">
                <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100/80 text-indigo-700 text-[11px] font-semibold mb-2">
                  <Sparkles class="w-3 h-3 text-indigo-600" />
                  <span>CrewAI 4-Agent Pipeline</span>
                </div>
                <p class="text-sm font-bold text-slate-800">
                  {{ store.asyncJob.currentAgent?.value?.name || 'Agen AI' }} Sedang Bekerja...
                </p>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ store.asyncJob.currentAgent?.value?.role || 'Menyusun rancangan antarmuka...' }}
                </p>
              </div>

              <!-- Pipeline Progression Dots -->
              <div class="flex items-center gap-2 mt-0.5">
                <div
                  v-for="(agent, idx) in store.asyncJob.AGENT_PIPELINE"
                  :key="idx"
                  :class="[
                    'h-1.5 rounded-full transition-all duration-300',
                    idx === store.asyncJob.activeAgentStepIndex?.value
                      ? 'w-7 bg-indigo-600'
                      : idx < store.asyncJob.activeAgentStepIndex?.value
                      ? 'w-2 bg-emerald-500'
                      : 'w-2 bg-slate-300'
                  ]"
                />
              </div>
            </div>

            <!-- Loading State on Empty Canvas (Fast Track with Live SSE Streaming Feedback) -->
            <div
              v-else-if="!store.hasDiagram.value && store.isProjectGenerating?.value"
              class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center select-none px-4"
            >
              <div class="pointer-events-auto w-full max-w-md max-h-[85vh] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 p-5 space-y-4">
                <!-- Header: Badge & Live Timer -->
                <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Live Stream Synthesis</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">
                    <Clock class="w-3.5 h-3.5 text-slate-500" />
                    <span>{{ formattedStreamTime }}</span>
                  </div>
                </div>

                <!-- Current Action & Token Counter -->
                <div class="space-y-1 text-left">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Loader2 class="w-4 h-4 animate-spin text-indigo-600 shrink-0" />
                      <span>{{ store.uiStreamProgress?.value?.message || 'Merancang antarmuka...' }}</span>
                    </h4>
                  </div>
                  <div class="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>
                      <span v-if="store.uiStreamProgress?.value?.tokens > 0" class="font-medium text-indigo-600">
                        ⚡ {{ store.uiStreamProgress?.value?.tokens }} token terkompilasi
                      </span>
                      <span v-else>Membedah instruksi & tata letak UI...</span>
                    </span>
                    <span class="font-bold text-slate-700">{{ store.uiStreamProgress?.value?.progressPercent || 15 }}%</span>
                  </div>
                </div>

                <!-- Smooth Animated Progress Bar -->
                <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative">
                  <div
                    class="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300"
                    :style="{ width: `${store.uiStreamProgress?.value?.progressPercent || 15}%` }"
                  ></div>
                </div>

                <!-- Live Section Checklist / Construction Status -->
                <div class="bg-slate-50/80 rounded-xl p-3 border border-slate-200/60 text-left space-y-2">
                  <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Seksi Sedang Dibuat
                  </div>
                  <div class="space-y-1.5">
                    <div
                      v-for="(sec, idx) in streamDisplaySections"
                      :key="idx"
                      class="flex items-center justify-between text-xs py-1 px-2 rounded-lg transition-colors"
                      :class="[
                        sec.status === 'active' ? 'bg-indigo-50/80 text-indigo-900 font-semibold' :
                        sec.status === 'done' ? 'text-slate-600' : 'text-slate-400'
                      ]"
                    >
                      <div class="flex items-center gap-2">
                        <CheckCircle2 v-if="sec.status === 'done'" class="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <Loader2 v-else-if="sec.status === 'active'" class="w-3.5 h-3.5 text-indigo-600 animate-spin shrink-0" />
                        <span v-else class="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center text-[9px] text-slate-400 shrink-0">•</span>
                        <span>{{ sec.label }}</span>
                      </div>
                      <span
                        v-if="sec.status === 'active'"
                        class="text-[10px] font-bold text-indigo-600 px-1.5 py-0.5 rounded-md bg-indigo-100/70"
                      >
                        Sedang Dirakit
                      </span>
                      <span
                        v-else-if="sec.status === 'done'"
                        class="text-[10px] font-medium text-emerald-600"
                      >
                        Siap
                      </span>
                      <span v-else class="text-[10px] text-slate-400">Menunggu</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Empty State CTA & Interactive Quick Prompt on Canvas -->
            <div
              v-else-if="!store.hasDiagram.value"
              class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 select-none px-4"
            >
              <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center shadow-xs border border-indigo-100 text-indigo-600">
                <Sparkles class="w-6 h-6 text-indigo-600" />
              </div>
              <div class="text-center">
                <p class="text-base sm:text-lg font-bold text-slate-800">
                  {{ store.activeProject.value?.title || 'Kanvas Kosong' }}
                </p>
                <p class="text-xs text-slate-500 mt-1 max-w-md">
                  Kanvas baru siap digunakan. Ketik ide antarmuka atau alur diagram di bawah untuk generate langsung dengan AI.
                </p>
              </div>

              <!-- Inline Quick Prompt Input Bar (Pointer Events Enabled) -->
              <div class="pointer-events-auto w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3 space-y-2.5">
                <!-- Mode Switcher (UI Design vs Diagram) & Configuration Sub-Bar -->
                <div class="flex items-center justify-between gap-2 px-1 border-b border-slate-100 pb-2">
                  <!-- Mode Switcher -->
                  <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-xs font-semibold text-slate-600">
                    <button
                      v-if="store.canGenerateUI.value"
                      type="button"
                      @click="canvasMode = 'ui_design'"
                      :class="[
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
                        canvasMode === 'ui_design' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                      ]"
                    >
                      <Palette class="w-3.5 h-3.5" />
                      <span>UI Design</span>
                    </button>
                    <button
                      v-if="store.canGenerateDiagram.value"
                      type="button"
                      @click="canvasMode = 'diagram'"
                      :class="[
                        'px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5',
                        canvasMode === 'diagram' ? 'bg-white font-bold text-indigo-700 shadow-xs' : 'hover:text-slate-900'
                      ]"
                    >
                      <Workflow class="w-3.5 h-3.5" />
                      <span>Diagram</span>
                    </button>
                  </div>

                  <!-- Sub-options: Viewport for UI Design, Diagram Type for Diagram -->
                  <div v-if="canvasMode === 'ui_design'" class="flex items-center gap-1 bg-slate-50 rounded-lg p-0.5 text-[11px] font-medium text-slate-600 border border-slate-200/60">
                    <button
                      type="button"
                      @click="canvasDevice = 'web'"
                      :class="['px-2 py-0.5 rounded transition-all', canvasDevice === 'web' ? 'bg-indigo-600 font-bold text-white shadow-2xs' : 'hover:text-slate-900']"
                    >
                      Web
                    </button>
                    <button
                      type="button"
                      @click="canvasDevice = 'mobile'"
                      :class="['px-2 py-0.5 rounded transition-all', canvasDevice === 'mobile' ? 'bg-indigo-600 font-bold text-white shadow-2xs' : 'hover:text-slate-900']"
                    >
                      Mobile
                    </button>
                    <button
                      type="button"
                      @click="canvasDevice = 'desktop'"
                      :class="['px-2 py-0.5 rounded transition-all', canvasDevice === 'desktop' ? 'bg-indigo-600 font-bold text-white shadow-2xs' : 'hover:text-slate-900']"
                    >
                      Desktop
                    </button>
                  </div>

                  <div v-else class="flex items-center gap-1.5">
                    <span class="text-[11px] text-slate-400 font-medium hidden sm:inline">Tipe:</span>
                    <select
                      v-model="canvasDiagramType"
                      class="px-2 py-1 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="flowchart">Flowchart</option>
                      <option value="architecture">Cloud Architecture</option>
                      <option value="sequence">Sequence Diagram</option>
                      <option value="c4">C4 Model Architecture</option>
                      <option value="erd">ERD / Relational DB</option>
                      <option value="class">UML Class</option>
                      <option value="state">State Machine</option>
                      <option value="pipeline">Data Pipeline</option>
                      <option value="network">Network & Infra</option>
                      <option value="cicd">CI/CD Pipeline</option>
                      <option value="swimlane">Swimlane BPMN</option>
                      <option value="mindmap">Mind Map</option>
                    </select>
                  </div>
                </div>

                <!-- Input Field & Submit Button -->
                <div class="flex items-center gap-2">
                  <input
                    v-model="canvasPrompt"
                    type="text"
                    :placeholder="
                      canvasMode === 'ui_design'
                        ? 'Ketik ide antarmuka (misal: CRM deals pipeline, POS resto, e-commerce)...'
                        : 'Ketik alur atau sistem diagram (misal: Alur checkout & payment gateway, Arsitektur AWS)...'
                    "
                    @keydown.enter="handleGenerateFromCanvas"
                    class="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    @click="handleGenerateFromCanvas"
                    :disabled="!canvasPrompt.trim() || store.isGenerating.value"
                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 flex-shrink-0"
                  >
                    <Sparkles class="w-3.5 h-3.5" />
                    <span>Generate</span>
                  </button>
                </div>
              </div>

              <!-- Quick Helper Buttons -->
              <div class="flex items-center gap-2 pointer-events-auto mt-1">
                <button
                  type="button"
                  @click="openNewProjectModal"
                  class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Plus class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dialog Lengkap</span>
                </button>
                <button
                  v-if="store.canGenerateUI.value"
                  type="button"
                  @click="currentView = 'foundations'"
                  class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Layers class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilih Fondasi</span>
                </button>
              </div>
            </div>
          </div>
        </main>

        <!-- RIGHT COPILOT PANEL -->
        <AiWorkspacePanel
          :is-open="isChatOpen"
          :active-foundation-id="store.activeFoundationId.value"
          @toggle="toggleChat"
          @inspect-tokens="openTokenInspector"
          @select-foundation="handleSelectFoundation"
          @share="openShareModal"
        />
      </div>
    </div>
    </template>

    <!-- MODALS -->
    <!-- Admin Credentials Modal (accessible by Master Admin) -->
    <AdminCredentialsModal
      :is-open="isAdminModalOpen"
      @close="isAdminModalOpen = false"
    />

    <!-- Share Project Modal -->
    <ShareProjectModal
      :is-open="isShareModalOpen"
      @close="isShareModalOpen = false"
    />

    <!-- Token Inspector Modal -->
    <TokenInspectorModal
      :is-open="isTokenInspectorOpen"
      :foundation="activeFoundation"
      @close="isTokenInspectorOpen = false"
      @apply-token="handleSelectFoundation"
    />

    <!-- New Project Modal -->
    <NewProjectModal
      :is-open="isNewModalOpen"
      :is-loading="store.isGenerating.value"
      @close="closeNewProjectModal"
      @create="handleCreateProject"
      @create-blank="handleCreateBlankProject"
    />

    <!-- Version History Modal -->
    <VersionHistoryModal
      :is-open="isVersionHistoryOpen"
      @close="isVersionHistoryOpen = false"
    />

    <!-- Error Toast Notification -->
    <transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div
        v-if="errorVisible"
        class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-3 shadow-xl"
        role="alert"
      >
        <AlertCircle class="w-4 h-4 text-red-500 flex-shrink-0" />
        <p class="text-xs sm:text-sm font-medium text-red-700">{{ store.errorMessage.value }}</p>
        <button
          type="button"
          class="ml-2 rounded-full p-1 text-red-400 transition-colors hover:bg-red-100 hover:text-red-600"
          @click="dismissError"
          aria-label="Dismiss error"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>
    </transition>
  </div>
</template>
