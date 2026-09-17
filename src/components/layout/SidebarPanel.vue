<script setup>
import { computed } from 'vue'
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
  Sparkles,
  FolderPlus,
  FileText,
  Layers,
  Palette,
  Pin,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggle', 'newProject'])

const store = useDiagramStore()

const projects = computed(() => store.projectsList.value || [])
const activeId = computed(() => store.activeProject.value?.id)

const pinnedProjects = computed(() => projects.value.filter(p => p.is_pinned))
const unpinnedProjects = computed(() => projects.value.filter(p => !p.is_pinned))

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
      // Trigger load more when 60px away from bottom
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
</script>

<template>
  <aside
    :class="[
      'h-full flex flex-col bg-slate-900 text-slate-200 transition-all duration-300 ease-in-out border-r border-slate-800 z-30 select-none flex-shrink-0',
      isOpen ? 'w-[260px]' : 'w-0 overflow-hidden'
    ]"
  >
    <!-- Header with New Project button -->
    <div class="p-3 border-b border-slate-800/80 flex items-center justify-between gap-2">
      <button
        type="button"
        @click="emit('newProject')"
        class="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-medium py-2.5 px-3 rounded-lg transition-colors shadow-sm"
      >
        <Plus class="w-4 h-4" />
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

    <!-- Project List with Infinite Scroll -->
    <div
      class="flex-1 overflow-y-auto px-2 py-3 space-y-3 custom-scrollbar"
      @scroll="handleScroll"
    >
      <div v-if="store.isSidebarLoading.value" class="space-y-2 p-1">
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
        <div class="h-10 bg-slate-800 animate-pulse rounded-lg"></div>
      </div>

      <div
        v-else-if="projects.length === 0"
        class="text-center py-10 px-4 text-xs text-slate-500 flex flex-col items-center justify-center"
      >
        <FolderPlus class="w-8 h-8 text-slate-600 mb-2 opacity-60" />
        <p>Belum ada project.</p>
        <p class="text-slate-600 text-[11px] mt-1">Klik "New Project" untuk membuat visual atau UI!</p>
      </div>

      <template v-else>
        <!-- Pinned Projects Section -->
        <div v-if="pinnedProjects.length > 0" class="space-y-1">
          <div class="flex items-center justify-between px-2 py-1 text-[10px] font-semibold text-amber-400/90 uppercase tracking-wider">
            <span class="flex items-center gap-1.5">
              <Pin class="w-3 h-3 fill-amber-400/40 text-amber-400 rotate-45" />
              Disematkan ({{ pinnedProjects.length }})
            </span>
          </div>

          <div
            v-for="project in pinnedProjects"
            :key="project.id"
            @click="handleSelectProject(project.id)"
            :class="[
              'group relative flex flex-col p-2.5 rounded-lg cursor-pointer transition-all border text-left',
              activeId === project.id
                ? 'bg-slate-800 text-white border-indigo-500/60 shadow-sm'
                : 'bg-slate-900/60 border-amber-500/20 text-slate-300 hover:bg-slate-800/60 hover:border-amber-500/40'
            ]"
          >
            <div class="flex items-center justify-between gap-1.5 mb-1">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <component
                  :is="getDiagramIcon(project.diagram_type)"
                  class="w-3.5 h-3.5 flex-shrink-0"
                  :class="project.diagram_type === 'ui_design' ? 'text-pink-400' : 'text-indigo-400'"
                />
                <span class="text-xs font-medium truncate leading-snug">
                  {{ project.title || 'Untitled Project' }}
                </span>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  @click.stop="handleTogglePin(project.id)"
                  title="Lepas pin"
                  class="p-1 rounded text-amber-400 hover:text-amber-300 hover:bg-amber-400/10 transition-colors"
                >
                  <Pin class="w-3 h-3 fill-amber-400 text-amber-400 rotate-45" />
                </button>
                <span
                  v-if="project.diagram_type"
                  class="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  :class="
                    project.diagram_type === 'ui_design'
                      ? 'bg-pink-950/80 text-pink-300 border border-pink-700/50'
                      : 'bg-slate-700/60 text-indigo-300'
                  "
                >
                  {{ formatDiagramType(project.diagram_type) }}
                </span>
              </div>
            </div>
            <span class="text-[11px] text-slate-500 group-hover:text-slate-400 pl-5">
              {{ formatDate(project.updated_at || project.created_at) }}
            </span>
          </div>
        </div>

        <!-- Recent / All Projects Section -->
        <div class="space-y-1">
          <div
            v-if="pinnedProjects.length > 0"
            class="flex items-center justify-between px-2 pt-2 pb-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
          >
            <span>Semua Project</span>
            <span v-if="store.projectsTotal.value" class="text-[9px] text-slate-500 font-mono">
              {{ store.projectsTotal.value }} total
            </span>
          </div>

          <div
            v-for="project in (pinnedProjects.length > 0 ? unpinnedProjects : projects)"
            :key="project.id"
            @click="handleSelectProject(project.id)"
            :class="[
              'group relative flex flex-col p-2.5 rounded-lg cursor-pointer transition-all border text-left',
              activeId === project.id
                ? 'bg-slate-800/90 text-white border-indigo-500/50 shadow-sm'
                : 'text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200'
            ]"
          >
            <div class="flex items-center justify-between gap-1.5 mb-1">
              <div class="flex items-center gap-1.5 min-w-0 flex-1">
                <component
                  :is="getDiagramIcon(project.diagram_type)"
                  class="w-3.5 h-3.5 flex-shrink-0"
                  :class="project.diagram_type === 'ui_design' ? 'text-pink-400' : 'text-indigo-400'"
                />
                <span class="text-xs font-medium truncate leading-snug">
                  {{ project.title || 'Untitled Project' }}
                </span>
              </div>
              <div class="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  @click.stop="handleTogglePin(project.id)"
                  title="Sematkan project ke atas"
                  class="p-1 rounded opacity-0 group-hover:opacity-100 text-slate-500 hover:text-amber-400 hover:bg-slate-700/60 transition-all"
                >
                  <Pin class="w-3 h-3 hover:rotate-12 transition-transform" />
                </button>
                <span
                  v-if="project.diagram_type"
                  class="text-[9px] font-mono px-1.5 py-0.5 rounded flex-shrink-0"
                  :class="
                    project.diagram_type === 'ui_design'
                      ? 'bg-pink-950/80 text-pink-300 border border-pink-700/50'
                      : 'bg-slate-700/60 text-indigo-300'
                  "
                >
                  {{ formatDiagramType(project.diagram_type) }}
                </span>
              </div>
            </div>
            <span class="text-[11px] text-slate-500 group-hover:text-slate-400 pl-5">
              {{ formatDate(project.updated_at || project.created_at) }}
            </span>
          </div>
        </div>

        <!-- Infinite Scroll Loading Indicator -->
        <div v-if="store.isProjectsLoadingMore.value" class="py-2.5 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div class="w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin"></div>
          <span class="text-[11px] text-slate-400 font-mono">Memuat...</span>
        </div>

        <!-- End of Projects Notice -->
        <div
          v-else-if="!store.projectsHasMore.value && projects.length >= 15"
          class="py-2 text-center text-[10px] text-slate-600 font-mono tracking-wide"
        >
          Semua {{ store.projectsTotal.value }} project dimuat
        </div>
      </template>
    </div>

    <!-- Footer Profile/Brand -->
    <div class="p-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
      <div class="flex items-center gap-1.5">
        <img src="/rl.svg" alt="RancangLab Logo" class="h-4 w-auto object-contain flex-shrink-0 opacity-90" />
        <span class="font-medium text-slate-300">RancangLab</span>
      </div>
      <span class="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">v1</span>
    </div>
  </aside>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(100, 116, 139, 0.4);
  border-radius: 4px;
}
</style>
