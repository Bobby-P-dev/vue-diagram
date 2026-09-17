<script setup>
import { ref, computed } from 'vue'
import {
  Plus,
  PanelLeftClose,
  Workflow,
  Network,
  Database,
  Boxes,
  RefreshCw,
  Zap,
  Brain,
  Layers,
  Palette,
  Pin,
  Search,
  Sliders,
  CheckCircle2,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'
import { DESIGN_FOUNDATIONS } from '../../assets/foundations.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
  activeFoundationId: {
    type: String,
    default: 'ramp',
  },
})

const emit = defineEmits([
  'toggle',
  'newProject',
  'selectFoundation',
  'inspectTokens',
  'sendPromptToChat',
])

const store = useDiagramStore()
const activeTab = ref('projects') // 'projects' | 'foundations' | 'review'
const searchQuery = ref('')

const projects = computed(() => store.projectsList.value || [])
const activeId = computed(() => store.activeProject.value?.id)

const filteredProjects = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) return projects.value
  return projects.value.filter(
    (p) =>
      p.title?.toLowerCase().includes(query) ||
      p.diagram_type?.toLowerCase().includes(query)
  )
})

const pinnedProjects = computed(() =>
  filteredProjects.value.filter((p) => p.is_pinned)
)
const unpinnedProjects = computed(() =>
  filteredProjects.value.filter((p) => !p.is_pinned)
)

function handleSelectProject(id) {
  store.openProject(id)
}

function handleTogglePin(id) {
  store.togglePin(id)
}

// Throttled infinite scroll handler for smooth performance
let scrollTicking = false
function handleScroll(e) {
  if (scrollTicking) return
  scrollTicking = true
  requestAnimationFrame(() => {
    const el = e.target
    if (el) {
      const { scrollTop, scrollHeight, clientHeight } = el
      if (scrollTop + clientHeight >= scrollHeight - 60) {
        if (store.projectsHasMore.value && !store.isProjectsLoadingMore.value) {
          store.loadMoreProjects()
        }
      }
    }
    scrollTicking = false
  })
}

const TYPE_SHORT_LABELS = {
  flowchart: 'FLOWCHART',
  architecture: 'ARCH',
  erd: 'ERD',
  class: 'UML CLASS',
  state: 'STATE',
  pipeline: 'PIPELINE',
  mindmap: 'MINDMAP',
  swimlane: 'SWIMLANE',
  ui_design: 'UI DESIGN',
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

function getDiagramIcon(type) {
  return TYPE_ICON_MAP[type?.toLowerCase()] || FileText
}

function formatDiagramType(type) {
  if (!type) return ''
  return TYPE_SHORT_LABELS[type.toLowerCase()] || type.toUpperCase()
}

function formatDate(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (e) {
    return dateString
  }
}

// Canvas feedback comments mock / live aggregation
const reviewComments = computed(() => {
  const currentNodes = store.nodes.value || []
  const frameNode = currentNodes.find((n) => n.type === 'ui_frame')
  if (frameNode?.data?.comments && Array.isArray(frameNode.data.comments)) {
    return frameNode.data.comments
  }
  return [
    {
      id: 'c1',
      author: 'Reviewer',
      text: 'Gunakan layout yang lebih padat dan bersihkan spacing antar kartu',
      status: 'open',
      time: '2 jam lalu',
    },
    {
      id: 'c2',
      author: 'Design Lead',
      text: 'Pastikan kontras teks subtitle memenuhi standard WCAG AA',
      status: 'resolved',
      time: '1 jam lalu',
    },
  ]
})
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800 z-30 select-none flex-shrink-0',
      isOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
    ]"
  >
    <!-- Header with New Project button & collapse -->
    <div class="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
      <button
        type="button"
        @click="emit('newProject')"
        class="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold py-2 px-3 rounded-lg transition-colors shadow-xs"
      >
        <Plus class="w-3.5 h-3.5" />
        <span>New Project</span>
      </button>

      <button
        type="button"
        @click="emit('toggle')"
        title="Collapse sidebar"
        class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
      >
        <PanelLeftClose class="w-4 h-4" />
      </button>
    </div>

    <!-- Sidebar Navigation Tabs -->
    <div class="px-3 pt-2 pb-1 border-b border-slate-800/80 flex items-center gap-1">
      <button
        type="button"
        @click="activeTab = 'projects'"
        class="flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all text-center"
        :class="
          activeTab === 'projects'
            ? 'bg-slate-800 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        "
      >
        Projects
      </button>
      <button
        type="button"
        @click="activeTab = 'foundations'"
        class="flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all text-center"
        :class="
          activeTab === 'foundations'
            ? 'bg-slate-800 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        "
      >
        Foundations
      </button>
      <button
        type="button"
        @click="activeTab = 'review'"
        class="flex-1 py-1.5 text-[11px] font-semibold rounded-md transition-all text-center"
        :class="
          activeTab === 'review'
            ? 'bg-slate-800 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
        "
      >
        Review
      </button>
    </div>

    <!-- TAB 1: PROJECTS LIST -->
    <div
      v-if="activeTab === 'projects'"
      class="flex-1 overflow-y-auto px-2 py-2 space-y-3 custom-scrollbar"
      @scroll="handleScroll"
    >
      <!-- Search Input -->
      <div class="relative px-1">
        <Search class="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-slate-500" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Filter projects..."
          class="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-950/60 border border-slate-800 rounded-md text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
        />
      </div>

      <div v-if="store.isSidebarLoading.value" class="space-y-2 p-1">
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
      </div>

      <div v-else-if="projects.length === 0" class="text-center py-8 text-slate-500 text-xs">
        Belum ada project
      </div>

      <template v-else>
        <!-- Pinned Projects Section -->
        <div v-if="pinnedProjects.length > 0" class="space-y-1">
          <div class="px-2 py-1 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400">
            <span class="flex items-center gap-1.5">
              <Pin class="w-3 h-3 text-indigo-400 rotate-45" />
              Pinned Projects ({{ pinnedProjects.length }})
            </span>
          </div>

          <div
            v-for="p in pinnedProjects"
            :key="p.id"
            :class="[
              'group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs',
              p.id === activeId
                ? 'bg-slate-800/90 text-white border-indigo-500/50 shadow-xs'
                : 'border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-white'
            ]"
            @click="handleSelectProject(p.id)"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <component
                :is="getDiagramIcon(p.diagram_type)"
                :class="[
                  'w-3.5 h-3.5 flex-shrink-0',
                  p.id === activeId ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                ]"
              />
              <div class="truncate">
                <p class="font-medium truncate leading-snug">{{ p.title || 'Untitled' }}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 leading-tight">
                  <span class="font-mono text-indigo-300/80">{{ formatDiagramType(p.diagram_type) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(p.created_at) }}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click.stop="handleTogglePin(p.id)"
              class="p-1 rounded text-indigo-400 hover:bg-slate-700/60 transition-colors ml-1"
              title="Unpin project"
            >
              <Pin class="w-3.5 h-3.5 fill-indigo-400 rotate-45" />
            </button>
          </div>
        </div>

        <!-- Recent Projects Section -->
        <div class="space-y-1">
          <div class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Recent Projects
          </div>

          <div
            v-for="p in unpinnedProjects"
            :key="p.id"
            :class="[
              'group relative flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all border text-xs',
              p.id === activeId
                ? 'bg-slate-800/90 text-white border-indigo-500/50 shadow-xs'
                : 'border-transparent text-slate-300 hover:bg-slate-800/40 hover:text-white'
            ]"
            @click="handleSelectProject(p.id)"
          >
            <div class="flex items-center gap-2 min-w-0 flex-1">
              <component
                :is="getDiagramIcon(p.diagram_type)"
                :class="[
                  'w-3.5 h-3.5 flex-shrink-0',
                  p.id === activeId ? 'text-indigo-400' : 'text-slate-400 group-hover:text-slate-300'
                ]"
              />
              <div class="truncate">
                <p class="font-medium truncate leading-snug">{{ p.title || 'Untitled' }}</p>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-400 leading-tight">
                  <span class="font-mono text-slate-400">{{ formatDiagramType(p.diagram_type) }}</span>
                  <span>•</span>
                  <span>{{ formatDate(p.created_at) }}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click.stop="handleTogglePin(p.id)"
              class="p-1 rounded text-slate-400 opacity-0 group-hover:opacity-100 hover:text-slate-200 hover:bg-slate-700/60 transition-all ml-1"
              title="Pin project"
            >
              <Pin class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Infinite scroll loading indicator -->
        <div v-if="store.isProjectsLoadingMore.value" class="py-2 text-center text-xs text-indigo-400">
          Memuat project lainnya...
        </div>
      </template>
    </div>

    <!-- TAB 2: FOUNDATIONS SELECTOR -->
    <div v-else-if="activeTab === 'foundations'" class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Design Foundation</span>
        <button
          type="button"
          @click="emit('inspectTokens')"
          class="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          <Sliders class="w-3 h-3" />
          <span>Tokens</span>
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="f in DESIGN_FOUNDATIONS"
          :key="f.id"
          :class="[
            'p-2.5 rounded-lg border cursor-pointer transition-all',
            f.id === activeFoundationId
              ? 'bg-indigo-950/40 border-indigo-500/60 text-white ring-1 ring-indigo-500/30'
              : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/40'
          ]"
          @click="emit('selectFoundation', f.id)"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="font-semibold text-xs text-slate-100">{{ f.name }}</span>
            <span
              v-if="f.id === activeFoundationId"
              class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
            >
              ACTIVE
            </span>
          </div>
          <p class="text-[11px] text-slate-400 line-clamp-2 leading-tight mb-2">{{ f.description }}</p>

          <div class="flex items-center gap-1.5">
            <span
              class="w-3 h-3 rounded-full border border-slate-700"
              :style="{ backgroundColor: f.tokens?.accent || f.tokens?.accentHighlight || '#6366f1' }"
            ></span>
            <span class="text-[10px] font-mono text-slate-400">{{ (f.tokens?.fontDisplay || 'Inter').split(',')[0] }}</span>
            <span class="text-[10px] text-slate-400">•</span>
            <span class="text-[10px] text-slate-400">{{ f.tokens?.radius || '8px' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 3: REVIEW / FEEDBACK COMMENTS -->
    <div v-else-if="activeTab === 'review'" class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Canvas Review Pins</span>
        <span class="text-[10px] font-mono text-indigo-400">{{ reviewComments.length }} pins</span>
      </div>

      <div class="space-y-2">
        <div
          v-for="c in reviewComments"
          :key="c.id"
          class="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800 space-y-2 text-xs"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-1.5">
              <MessageSquare class="w-3 h-3 text-amber-400" />
              <span class="font-semibold text-slate-200">{{ c.author }}</span>
            </div>
            <span
              class="text-[9px] px-1.5 py-0.5 rounded font-mono uppercase"
              :class="
                c.status === 'resolved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              "
            >
              {{ c.status }}
            </span>
          </div>

          <p class="text-slate-300 text-[11px] leading-relaxed">{{ c.text }}</p>

          <div class="pt-1 flex items-center justify-between border-t border-slate-800/80">
            <span class="text-[10px] text-slate-500">{{ c.time }}</span>
            <button
              type="button"
              @click="emit('sendPromptToChat', 'Perbaiki berdasarkan review: ' + c.text)"
              class="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <Sparkles class="w-2.5 h-2.5" />
              <span>Kirim ke AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer: Token Inspector Quick Trigger -->
    <div class="p-2.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-xs">
      <button
        type="button"
        @click="emit('inspectTokens')"
        class="text-slate-400 hover:text-slate-200 flex items-center gap-1.5 text-[11px] transition-colors"
      >
        <Sliders class="w-3.5 h-3.5 text-indigo-400" />
        <span>Inspect Active Tokens</span>
      </button>

      <div class="flex items-center gap-1.5">
        <img src="/rl.svg" alt="RancangLab" class="h-3.5 w-auto object-contain flex-shrink-0 opacity-80" />
        <span class="text-[10px] font-mono text-slate-400">RancangLab v1</span>
      </div>
    </div>
  </aside>
</template>
