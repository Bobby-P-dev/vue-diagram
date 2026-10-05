<script setup>
import { ref, computed, onMounted } from 'vue'
import {
  Share2,
  Copy,
  Check,
  Download,
  GitFork,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertCircle,
  Eye,
  Calendar,
  Bot,
  PanelRightClose,
} from 'lucide-vue-next'
import DiagramCanvas from '../../canvas/DiagramCanvas.vue'
import { useDiagramStore, normalizeNodes, normalizeEdges } from '../../../stores/diagramStore.js'
import { useCanvasExport } from '../../../composables/useCanvasExport.js'

const props = defineProps({
  token: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['closeShare', 'forkSuccess'])

const store = useDiagramStore()
const { downloadAsPng } = useCanvasExport()

const isLoading = ref(true)
const isForking = ref(false)
const isExporting = ref(false)
const errorMessage = ref('')
const sharedData = ref(null)
const copied = ref(false)
let copyTimer = null

// Desktop Copilot Sidebar Toggle (Defaults to open for full context, can be collapsed for full-canvas view)
const isChatOpen = ref(true)

// Mobile tab state: 'canvas' | 'chat'
const activeMobileTab = ref('canvas')

const project = computed(() => sharedData.value?.project || {})
const shareInfo = computed(() => sharedData.value?.share || {})
const messages = computed(() => sharedData.value?.messages || [])

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

const currentDirection = computed(() => {
  const type = project.value?.diagram_type || 'flowchart'
  return DIRECTION_MAP[String(type).toLowerCase()] || 'TB'
})

const parsedNodes = computed(() => {
  const raw = project.value?.current_nodes || project.value?.nodes || []
  if (Array.isArray(raw)) {
    return normalizeNodes(raw)
  }
  return []
})

const parsedEdges = computed(() => {
  const raw = project.value?.current_edges || project.value?.edges || []
  if (Array.isArray(raw)) {
    return normalizeEdges(raw)
  }
  return []
})

const formattedDate = computed(() => {
  if (!shareInfo.value?.created_at) return ''
  try {
    const d = new Date(shareInfo.value.created_at)
    return d.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch (_) {
    return shareInfo.value.created_at
  }
})

async function fetchSharedProject() {
  if (!props.token) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await store.loadSharedProject(props.token)
    sharedData.value = res
  } catch (err) {
    errorMessage.value =
      err.message || 'Tautan berbagi tidak ditemukan atau telah dinonaktifkan oleh pemilik.'
  } finally {
    isLoading.value = false
  }
}

async function handleCopyLink() {
  const url = window.location.href
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(url)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      copied.value = false
    }, 2500)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

async function handleDownloadPng() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const title = (project.value?.title || 'shared-diagram')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
    await downloadAsPng(null, `${title}-shared.png`)
  } catch (err) {
    alert(`Export gagal: ${err.message}`)
  } finally {
    isExporting.value = false
  }
}

async function handleForkToWorkspace() {
  if (isForking.value || !props.token) return
  if (!store.isAuthenticated.value) {
    alert('Silakan masukkan kredensial akses Anda terlebih dahulu untuk menyalin proyek ke workspace pribadi Anda.')
    emit('closeShare')
    return
  }

  const isUi = project.value?.diagram_type === 'ui_design'
  if (isUi && !store.canGenerateUI.value) {
    alert('Akses Dibatasi: Kredensial Anda tidak memiliki izin untuk mengimpor atau mengedit proyek Desain UI.')
    return
  }
  if (!isUi && !store.canGenerateDiagram.value) {
    alert('Akses Dibatasi: Kredensial Anda tidak memiliki izin untuk mengimpor atau mengedit proyek Diagram.')
    return
  }

  isForking.value = true
  try {
    const forked = await store.forkSharedProject(props.token)
    emit('forkSuccess', forked)
  } catch (err) {
    alert(`Gagal menyalin proyek: ${err.message}`)
  } finally {
    isForking.value = false
  }
}

onMounted(() => {
  fetchSharedProject()
})
</script>

<template>
  <div class="flex flex-col h-screen w-screen overflow-hidden bg-slate-900 font-sans antialiased text-slate-800">
    <!-- Top Shared Navigation Header -->
    <header class="h-14 border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between text-xs text-slate-300 z-30 select-none flex-shrink-0">
      <!-- Left: Brand / Back Button + Project Identity -->
      <div class="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <button
          type="button"
          @click="emit('closeShare')"
          class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border border-slate-800 cursor-pointer"
          title="Buka Workspace Utama"
        >
          <ArrowLeft class="w-4 h-4" />
          <span class="text-xs font-semibold hidden md:inline">Editor</span>
        </button>

        <div class="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

        <div class="flex items-center gap-2 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Share2 class="w-3.5 h-3.5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 sm:gap-2">
              <h1 class="font-bold text-white text-xs sm:text-sm truncate">
                {{ project?.title || 'Shared Project' }}
              </h1>
              <span v-if="project?.diagram_type" class="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {{ project.diagram_type }}
              </span>
              <span class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hidden sm:inline-block">
                Shared View
              </span>
            </div>
            <div class="flex items-center gap-3 text-[10px] text-slate-400">
              <span v-if="formattedDate" class="flex items-center gap-1">
                <Calendar class="w-2.5 h-2.5" />
                <span>{{ formattedDate }}</span>
              </span>
              <span v-if="shareInfo?.view_count !== undefined" class="flex items-center gap-1 text-emerald-400">
                <Eye class="w-2.5 h-2.5" />
                <span>{{ shareInfo.view_count }} views</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Center: Mobile View Switcher (Visible only on small screens) -->
      <div class="flex md:hidden items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800">
        <button
          type="button"
          @click="activeMobileTab = 'canvas'"
          class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
          :class="activeMobileTab === 'canvas' ? 'bg-indigo-600 text-white' : 'text-slate-400'"
        >
          Kanvas
        </button>
        <button
          type="button"
          @click="activeMobileTab = 'chat'"
          class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors"
          :class="activeMobileTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-400'"
        >
          Chat ({{ messages.length }})
        </button>
      </div>

      <!-- Right: Action Buttons -->
      <div class="flex items-center gap-2">
        <!-- Toggle Copilot Panel (Desktop) -->
        <button
          type="button"
          @click="isChatOpen = !isChatOpen"
          :class="[
            'hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer',
            isChatOpen
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750'
              : 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'
          ]"
          :title="isChatOpen ? 'Tutup Riwayat Copilot' : 'Buka Riwayat Copilot'"
        >
          <MessageSquare class="w-3.5 h-3.5" />
          <span>{{ isChatOpen ? 'Tutup Copilot' : 'Buka Copilot' }}</span>
          <span v-if="messages.length > 0" class="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-900 text-slate-300">
            {{ messages.length }}
          </span>
        </button>

        <!-- Download PNG -->
        <button
          type="button"
          @click="handleDownloadPng"
          :disabled="isExporting || isLoading"
          class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
          title="Download PNG Full HD"
        >
          <Loader2 v-if="isExporting" class="w-3.5 h-3.5 animate-spin" />
          <Download v-else class="w-3.5 h-3.5 text-indigo-400" />
          <span>Download PNG</span>
        </button>

        <!-- Copy Link -->
        <button
          type="button"
          @click="handleCopyLink"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          title="Salin Tautan Berbagi"
        >
          <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-400" />
          <Copy v-else class="w-3.5 h-3.5 text-slate-400" />
          <span :class="copied ? 'text-emerald-400 font-bold' : ''">
            {{ copied ? 'Tersalin!' : 'Salin Link' }}
          </span>
        </button>

        <!-- Fork / Clone to Workspace -->
        <button
          type="button"
          @click="handleForkToWorkspace"
          :disabled="isForking || isLoading"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
          title="Duplikasi project ini ke workspace Anda agar bisa diedit dan dilanjutkan obrolannya dengan AI"
        >
          <Loader2 v-if="isForking" class="w-3.5 h-3.5 animate-spin" />
          <GitFork v-else class="w-3.5 h-3.5" />
          <span>Clone ke Workspace</span>
        </button>
      </div>
    </header>

    <!-- Main Content Area: Hero Canvas on Left/Center, Copilot on Right -->
    <div class="flex-1 w-full h-[calc(100vh-56px)] overflow-hidden bg-slate-50 relative flex">
      <!-- Loading State -->
      <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-20">
        <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shadow-xs">
          <Loader2 class="w-6 h-6 animate-spin text-indigo-600" />
        </div>
        <p class="text-xs font-semibold text-slate-700">Memuat Diagram & Percakapan...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="errorMessage" class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white z-20 p-6 text-center">
        <div class="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shadow-xs">
          <AlertCircle class="w-7 h-7" />
        </div>
        <div class="max-w-md space-y-1">
          <h3 class="text-sm font-bold text-slate-800">Tautan Berbagi Tidak Ditemukan</h3>
          <p class="text-xs text-slate-500 leading-relaxed">{{ errorMessage }}</p>
        </div>
        <button
          type="button"
          @click="emit('closeShare')"
          class="mt-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-500 transition-colors cursor-pointer"
        >
          Buka RancangLab Editor
        </button>
      </div>

      <!-- Main Interactive Content -->
      <template v-else>
        <!-- LEFT / CENTER: Interactive Canvas Host -->
        <main
          :class="[
            'flex-1 h-full min-w-0 overflow-hidden relative bg-slate-50 transition-all',
            activeMobileTab === 'canvas' ? 'flex' : 'hidden md:flex'
          ]"
        >
          <DiagramCanvas
            :nodes="parsedNodes"
            :edges="parsedEdges"
            :direction="currentDirection"
            :diagram-type="project?.diagram_type"
          />
        </main>

        <!-- RIGHT PANEL: Copilot Chat History Transcripts -->
        <aside
          :class="[
            'h-full flex flex-col bg-white border-l border-slate-200/90 shadow-xl transition-all duration-300 ease-in-out z-20 flex-shrink-0 text-slate-800',
            activeMobileTab === 'chat'
              ? 'flex w-full'
              : isChatOpen
              ? 'hidden md:flex md:w-[380px] lg:w-[420px]'
              : 'hidden'
          ]"
        >
          <!-- Copilot Header -->
          <div class="px-4 py-3 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80 backdrop-blur-xs flex-shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-md bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Bot class="w-3.5 h-3.5" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h2 class="text-xs font-bold text-slate-900 leading-tight">RancangLab Copilot</h2>
                  <span class="px-1.5 py-0.2 rounded text-[9px] font-bold font-mono bg-indigo-50 text-indigo-600 border border-indigo-200/60">v1</span>
                </div>
                <div class="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Pratinjau Percakapan</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="isChatOpen = false"
              class="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors cursor-pointer"
              title="Tutup Panel"
            >
              <PanelRightClose class="w-4 h-4" />
            </button>
          </div>

          <!-- Messages Stream -->
          <div class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40">
            <div v-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <MessageSquare class="w-8 h-8 text-slate-300 mb-2" />
              <p class="text-xs font-semibold text-slate-600">Belum Ada Riwayat Obrolan</p>
              <p class="text-[11px] text-slate-400 mt-1 max-w-[200px]">Diagram ini dibuat langsung atau riwayat obrolan belum tercatat.</p>
            </div>

            <template v-for="(msg, idx) in messages" :key="msg.id || idx">
              <!-- User Bubble -->
              <div v-if="msg.role === 'user'" class="flex flex-col items-end gap-1">
                <div class="max-w-[88%] rounded-2xl rounded-tr-xs bg-indigo-600 px-4 py-2.5 text-white shadow-xs">
                  <p class="text-xs leading-relaxed whitespace-pre-wrap font-normal">{{ msg.content }}</p>
                </div>
                <span class="text-[9px] text-slate-400 pr-1">Pengguna</span>
              </div>

              <!-- Assistant Bubble -->
              <div v-else class="flex flex-col items-start gap-1">
                <div class="max-w-[92%] rounded-2xl rounded-tl-xs bg-white border border-slate-200/90 px-4 py-3 text-slate-800 shadow-xs">
                  <div class="flex items-center gap-1.5 mb-1.5 text-[10px] text-indigo-600 font-bold">
                    <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
                    <span>RancangLab AI</span>
                  </div>
                  <p class="text-xs leading-relaxed whitespace-pre-wrap text-slate-700">{{ msg.content }}</p>
                </div>
                <span class="text-[9px] text-slate-400 pl-1">RancangLab AI</span>
              </div>
            </template>
          </div>

          <!-- Bottom Clone Callout Banner -->
          <div class="p-3.5 border-t border-slate-200/90 bg-white flex-shrink-0">
            <div class="rounded-xl bg-indigo-50/70 border border-indigo-100 p-3 space-y-2">
              <div class="flex items-start gap-2">
                <Sparkles class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div class="min-w-0">
                  <p class="text-[11px] font-bold text-slate-800">Lanjutkan Diskusi dengan AI</p>
                  <p class="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Clone proyek ini ke workspace Anda untuk mengedit diagram, menambah node, atau meminta variasi desain baru.
                  </p>
                </div>
              </div>
              <button
                type="button"
                @click="handleForkToWorkspace"
                :disabled="isForking"
                class="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Loader2 v-if="isForking" class="w-3.5 h-3.5 animate-spin" />
                <GitFork v-else class="w-3.5 h-3.5" />
                <span>Clone ke Workspace Saya</span>
              </button>
            </div>
          </div>
        </aside>
      </template>
    </div>
  </div>
</template>
