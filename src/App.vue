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
  FilePlus,
  ArrowRight,
  BookOpen,
} from 'lucide-vue-next'
import TopNavbar from './components/layout/TopNavbar.vue'
import ProjectSidebar from './components/layout/ProjectSidebar.vue'
import AiWorkspacePanel from './components/layout/AiWorkspacePanel.vue'
import DiagramCanvas from './components/canvas/DiagramCanvas.vue'
import ExportDropdown from './components/ui/ExportDropdown.vue'
import NewProjectModal from './components/ui/NewProjectModal.vue'
import VersionHistoryModal from './components/ui/VersionHistoryModal.vue'
import FoundationsCatalog from './components/ui-design/views/FoundationsCatalog.vue'
import TemplateExplorer from './components/ui-design/views/TemplateExplorer.vue'
import TokenInspectorModal from './components/ui-design/TokenInspectorModal.vue'
import DevDebugPanel from './components/ui-design/DevDebugPanel.vue'
import { DESIGN_FOUNDATIONS } from './assets/foundations.js'
import { useDiagramStore } from './stores/diagramStore.js'

const store = useDiagramStore()

const currentView = ref('workspace') // 'workspace' | 'foundations' | 'templates'
const isSidebarOpen = ref(true)
const isChatOpen = ref(true)
const isNewModalOpen = ref(false)
const isVersionHistoryOpen = ref(false)
const isTokenInspectorOpen = ref(false)
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

const DIRECTION_MAP = {
  flowchart: 'TB',
  architecture: 'TB',
  erd: 'TB',
  class: 'TB',
  state: 'LR',
  pipeline: 'LR',
  mindmap: 'LR',
  swimlane: 'LR',
  network: 'TB',
  sequence: 'LR',
  ui_design: 'LR',
}

const DIAGRAM_TYPE_LABELS = {
  flowchart: 'Flowchart',
  architecture: 'Architecture',
  erd: 'ERD / Database',
  class: 'UML Class',
  state: 'State Machine',
  pipeline: 'Data Pipeline',
  mindmap: 'Mind Map',
  swimlane: 'Swimlane BPMN',
  ui_design: 'UI Design Canvas',
}

const TYPE_ICON_MAP = {
  flowchart: Workflow,
  architecture: Network,
  erd: Database,
  class: Boxes,
  state: RefreshCw,
  pipeline: Zap,
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
  let success = false
  if (template._kind === 'ui_design') {
    success = await store.startNewUiDesignProject({
      templateId: template.id,
    })
  } else {
    success = await store.startNewProject('', template.diagram_type, template.id)
  }
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
      orchestrationMode: payload.orchestrationMode || 'crewai',
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

onMounted(async () => {
  await store.loadSidebar()
  // Start on an empty canvas with copilot chat open by default (do not auto-open random project)
  store.activeProject.value = null
  store.nodes.value = []
  store.edges.value = []
  store.chatHistory.value = []
  isChatOpen.value = true
})
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans text-slate-800 antialiased">
    <!-- 1. TOP NAVBAR -->
    <TopNavbar
      :current-view="currentView"
      :active-project-title="store.activeProject.value?.title || 'Untitled Project'"
      :active-foundation-name="activeFoundation.name"
      :has-diagram="store.hasDiagram.value"
      :current-version-number="currentVersionNumber"
      :is-ui-design="isUiDesignProject"
      @navigate="handleNavigate"
      @new-project="openNewProjectModal"
      @open-versions="isVersionHistoryOpen = true"
      @inspect-tokens="openTokenInspector"
      @toggle-sidebar="toggleSidebar"
    />

    <!-- 2. BODY CONTENT (Conditional on currentView) -->
    <div class="flex flex-1 w-full h-[calc(100vh-48px)] overflow-hidden bg-slate-50">
      <!-- VIEW A: FOUNDATIONS CATALOG -->
      <div v-if="currentView === 'foundations'" class="w-full h-full overflow-hidden bg-slate-950">
        <FoundationsCatalog
          :active-foundation-id="store.activeFoundationId.value"
          @select-foundation="handleSelectFoundationFromCatalog"
          @inspect-tokens="openTokenInspector"
        />
      </div>

      <!-- VIEW B: TEMPLATES EXPLORER -->
      <div v-else-if="currentView === 'templates'" class="w-full h-full overflow-hidden bg-slate-950">
        <TemplateExplorer
          @use-template="handleSelectTemplate"
          @preview-template="handleSelectTemplate"
        />
      </div>

      <!-- VIEW C: ACTIVE WORKSPACE (Canvas + Sidebars) -->
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

            <!-- Loading State on Empty Canvas (Fast Track) -->
            <div
              v-else-if="!store.hasDiagram.value && store.isProjectGenerating?.value"
              class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 select-none px-4"
            >
              <div class="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-600 flex items-center justify-center animate-pulse border border-indigo-200/50">
                <Loader2 class="w-6 h-6 animate-spin text-indigo-600" />
              </div>
              <div class="text-center">
                <p class="text-sm font-bold text-slate-800">AI sedang merancang antarmuka...</p>
                <p class="text-xs text-slate-500 mt-1 max-w-sm">
                  Menyusun UX structure, token visual, dan komponen produksi langsung ke kanvas baru.
                </p>
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
                      <option value="architecture">Architecture</option>
                      <option value="sequence">Sequence Diagram</option>
                      <option value="erd">ERD / Database</option>
                      <option value="class">UML Class</option>
                      <option value="state">State Machine</option>
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
                  type="button"
                  @click="currentView = 'foundations'"
                  class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <Layers class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Pilih Fondasi</span>
                </button>
                <button
                  type="button"
                  @click="currentView = 'templates'"
                  class="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5"
                >
                  <BookOpen class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Gunakan Template</span>
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
        />
      </div>
    </div>

    <!-- MODALS -->
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

    <!-- Developer Thin Client Debug Panel -->
    <DevDebugPanel />

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
