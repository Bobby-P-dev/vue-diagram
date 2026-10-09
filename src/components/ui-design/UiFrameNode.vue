<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  Lock,
  RotateCw,
  Code,
  Eye,
  Copy,
  Check,
  Smartphone,
  Tablet,
  Monitor,
  Globe,
  Maximize2,
  FileText,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Box,
  MousePointer2,
  MessageSquare,
  Navigation2,
  ChevronRight,
  X,
  Target,
  GripVertical,
  Wifi,
  Battery,
  Signal,
  Trash2,
} from 'lucide-vue-next'

import { formatAuditScore } from '../../utils/uiAudit.js'
import AntiSlopBadge from './AntiSlopBadge.vue'
import ReviewCommentPin from './ReviewCommentPin.vue'
import ArtifactPreview from './ArtifactPreview.vue'
import { useDiagramStore } from '../../stores/diagramStore.js'
import { useDiagramApi } from '../../composables/useDiagramApi.js'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const store = useDiagramStore()
const api = useDiagramApi()

// Canvas Edit Modes — read from global store so AiWorkspacePanel / DevDebugPanel can also read/write
const canvasMode = store.canvasMode

// Iframe ref — for postMessage mode changes to the sandbox
const sandboxIframe = ref(null)
const navInterceptLog = ref([]) // tracks RANCANGLAB_PREVIEW_NAVIGATE events for debug

const device = computed(() => String(props.data?.canvas?.device || props.data?.device || 'web').toLowerCase())
const title = computed(() => props.data?.canvas?.title || props.data?.title || 'UI Design Frame')
const width = computed(() => Number(props.data?.canvas?.width || props.data?.width) || (device.value === 'mobile' ? 375 : 1024))
const height = computed(() => Number(props.data?.canvas?.height || props.data?.height) || (device.value === 'mobile' ? 812 : 720))

const activeViewport = ref(device.value === 'mobile' ? 'mobile' : 'web')
watch(() => device.value, (d) => {
  activeViewport.value = d === 'mobile' ? 'mobile' : 'web'
})

const effectiveWidth = computed(() => {
  if (activeViewport.value === 'mobile') return 375
  if (activeViewport.value === 'tablet') return 768
  return Number(props.data?.canvas?.width || props.data?.width) || (device.value === 'desktop' ? 1100 : 1024)
})

const effectiveHeight = computed(() => {
  if (activeViewport.value === 'mobile') return 812
  if (activeViewport.value === 'tablet') return 840
  return Number(props.data?.canvas?.height || props.data?.height) || (device.value === 'desktop' ? 740 : 720)
})

function setViewportPreview(v) {
  activeViewport.value = v
}

function setCanvasMode(mode) {
  store.setCanvasMode(mode)
  // Notify iframe sandbox about mode change
  const iframeEl = sandboxIframe.value
  if (iframeEl?.contentWindow) {
    iframeEl.contentWindow.postMessage({ type: 'RANCANGLAB_SET_MODE', mode }, '*')
  }
}

function handleFrameClick() {
  if (props.id) {
    store.selectedNodes.value = [props.id]
  }
}

function handleWindowMessage(e) {
  if (e.data?.type === 'RANCANGLAB_IFRAME_READY') {
    const iframeEl = sandboxIframe.value
    if (iframeEl?.contentWindow) {
      iframeEl.contentWindow.postMessage({ type: 'RANCANGLAB_SET_MODE', mode: canvasMode.value }, '*')
    }
  }
  if (e.data?.type === 'RANCANGLAB_PREVIEW_NAVIGATE') {
    const entry = { href: e.data?.href, time: new Date().toLocaleTimeString() }
    navInterceptLog.value.unshift(entry)
    if (navInterceptLog.value.length > 10) navInterceptLog.value.length = 10
    console.log('[UiFrameNode] Intercepted navigation attempt inside preview iframe:', e.data?.href)
  }
}

// Watch canvasMode and propagate to iframe (needed when iframe is already loaded)
watch(canvasMode, (mode) => {
  const iframeEl = sandboxIframe.value
  if (iframeEl?.contentWindow) {
    iframeEl.contentWindow.postMessage({ type: 'RANCANGLAB_SET_MODE', mode }, '*')
  }
})

const theme = computed(() => props.data?.design_state?.design_spec?.visual?.theme || props.data?.theme || null)
const sections = computed(() => props.data?.design_state?.design_spec?.sections || props.data?.sections || [])
const codeExport = computed(() => {
  if (props.data?.implementation?.source) {
    return props.data.implementation.source
  }
  return props.data?.code_export || {}
})

const pageSpec = computed(() => props.data?.design_state?.design_spec?.page || props.data?.page_spec || null)
const designDecisions = computed(() => props.data?.design_state?.design_spec?.design_decisions || props.data?.design_decisions || null)
const antiSlopAudit = computed(() => props.data?.audit?.anti_slop || props.data?.anti_slop_audit || null)
const requirementSpec = computed(() => props.data?.design_state?.requirement_spec || props.data?.requirement_spec || null)
const validation = computed(() => props.data?.audit?.validation || props.data?.validation || null)
const auditState = computed(() => props.data?.audit || null)
const changePlan = computed(() => props.data?.change_plan || null)

// Canonical single source of truth for HTML: raw_html -> rawHtml -> code_export.html -> implementation.source.html
const rawHtml = computed(() => {
  return (
    props.data?.raw_html ||
    props.data?.rawHtml ||
    props.data?.code_export?.html ||
    props.data?.implementation?.source?.html ||
    props.data?.custom_markup ||
    ''
  )
})

const artifactData = computed(() => {
  return {
    id: props.id,
    title: title.value,
    device: device.value,
    theme: theme.value,
    sections: sections.value,
    raw_html: rawHtml.value,
    rawHtml: rawHtml.value,
    code_export: codeExport.value,
    implementation: props.data?.implementation || {
      framework: 'vue',
      styling: 'tailwind',
      source: { html: rawHtml.value },
    },
    design_spec: props.data?.design_state?.design_spec || {
      sections: sections.value,
      theme: theme.value,
      page: pageSpec.value,
    },
    page_spec: pageSpec.value,
  }
})

const artifactVersion = computed(() => {
  return (
    props.data?.version ||
    props.data?.implementation?.version ||
    store.activeProject.value?.version_number ||
    store.activeProject.value?.version ||
    1
  )
})

const viewMode = ref('visual') // 'visual' | 'code'
const isCopied = ref(false)
let copyTimer = null

// Review / Feedback comments local store with backend sync
const reviewComments = ref([
  { id: 'c-1', author: 'Designer', content: 'Hierarki tombol CTA utama dan margin card sudah optimal.', timestamp: '10:45', status: 'Resolved' }
])

onMounted(async () => {
  window.addEventListener('message', handleWindowMessage)
  const currentProjectId = store.activeProject.value?.id || store.activeProject?.id
  if (currentProjectId) {
    try {
      const serverComments = await api.getComments(currentProjectId)
      if (serverComments && serverComments.length > 0) {
        const matched = serverComments.filter(c => !c.node_id || c.node_id === props.id)
        if (matched.length > 0) {
          reviewComments.value = matched.map(c => ({
            id: c.id,
            author: c.author,
            content: c.content,
            timestamp: new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: c.status === 'resolved' ? 'Resolved' : 'Open',
            target: c.metadata?.target || null,
          }))
        }
      }
    } catch (e) {
      console.warn('Could not load persistent comments:', e)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleWindowMessage)
})

async function handleAddComment(comment) {
  const activeTarget = store.selectedTarget?.value
  if (activeTarget && !comment.target) {
    comment.target = activeTarget
  }

  reviewComments.value.unshift(comment)
  const currentProjectId = store.activeProject.value?.id || store.activeProject?.id
  if (currentProjectId) {
    try {
      const saved = await api.addComment(currentProjectId, {
        node_id: props.id,
        author: comment.author || 'Designer',
        content: comment.content,
        position_x: 0,
        position_y: 0,
        metadata: comment.target ? { target: comment.target } : {},
      })
      if (saved?.id) {
        comment.id = saved.id
      }
    } catch (err) {
      console.error('Failed to save comment to database:', err)
    }
  }
}

async function handleResolveComment(id) {
  const target = reviewComments.value.find(c => c.id === id)
  if (target) {
    target.status = target.status === 'Resolved' ? 'Open' : 'Resolved'
    if (id && !id.startsWith('comment-')) {
      try {
        await api.updateCommentStatus(id, target.status.toLowerCase())
      } catch (err) {
        console.error('Failed to update comment status:', err)
      }
    }
  }
}

function handleSendToAi(payload) {
  const text = typeof payload === 'string' ? payload : (payload?.content || '')
  const target = (typeof payload === 'object' && payload?.target) ? payload.target : (store.selectedTarget?.value || null)
  if (store.sendFollowUpChat) {
    store.sendFollowUpChat(`Perbaiki desain sesuai feedback review: "${text}"`, null, target)
  }
}

// The backend compiler currently exports HTML + Vue only (no React/JSX/TSX), so
// default to the HTML tab, which always has real content, instead of the React tab
// that would just fall back to the same HTML while mislabeled as TSX.
const activeCodeTab = ref('html') // 'html' | 'vue'

const displayCode = computed(() => {
  const exports = props.data?.code_export || props.data?.implementation?.source || {}
  if (activeCodeTab.value === 'react') {
    return (
      exports.react ||
      exports.jsx ||
      exports.tsx ||
      exports.html ||
      rawHtml.value ||
      ''
    )
  }
  if (activeCodeTab.value === 'html') {
    return (
      exports.html ||
      rawHtml.value ||
      ''
    )
  }
  if (activeCodeTab.value === 'vue') {
    return (
      exports.vue ||
      props.data?.implementation?.source?.vue ||
      ''
    )
  }
  return (
    exports.react ||
    exports.html ||
    rawHtml.value ||
    ''
  )
})

function cycleMobileViewMode() {
  if (viewMode.value === 'visual') viewMode.value = 'sandbox'
  else if (viewMode.value === 'sandbox') viewMode.value = 'code'
  else if (viewMode.value === 'code') viewMode.value = 'spec'
  else viewMode.value = 'visual'
}

async function handleSwitchToWeb() {
  if (store.isChatGenerating?.value) return
  if (props.id) {
    store.selectedNodes.value = [props.id]
  }
  const target = {
    type: 'device',
    id: props.id,
    frame_id: props.id,
  }
  if (store.sendFollowUpChat) {
    await store.sendFollowUpChat('ubah ke mode web', null, { target, scope: 'screen' })
  }
}

async function handleSwitchToMobile() {
  if (store.isChatGenerating?.value) return
  if (props.id) {
    store.selectedNodes.value = [props.id]
  }
  const target = {
    type: 'device',
    id: props.id,
    frame_id: props.id,
  }
  if (store.sendFollowUpChat) {
    await store.sendFollowUpChat('ubah ke mode mobile', null, { target, scope: 'screen' })
  }
}

async function handleDeleteScreen() {
  if (!props.id) return
  const screenTitle = title.value || 'Screen'
  const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus screen "${screenTitle}" ini dari kanvas?`)
  if (!confirmed) return
  await store.deleteFrameNode(props.id)
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(displayCode.value)
    isCopied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy code:', err)
  }
}
</script>

<template>
  <div
    class="relative select-text transition-shadow group"
    @click="handleFrameClick"
    :style="{ width: device === 'mobile' ? `${Math.max(effectiveWidth, 480)}px` : `${effectiveWidth}px` }"
  >
    <!-- Vue Flow Connection Handles (LR and TB) -->
    <Handle
      type="target"
      :position="Position.Left"
      id="left"
      class="!h-3 !w-3 !border-2 !border-white !bg-indigo-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
    />
    <Handle
      type="target"
      :position="Position.Top"
      id="top"
      class="!h-3 !w-3 !border-2 !border-white !bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity z-50"
    />

    <!-- Viewport Switcher Floating Quick-Action Bar (Active when previewing mobile or tablet) -->
    <div
      v-if="device !== 'mobile' && activeViewport !== 'web'"
      class="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-900/95 border border-indigo-500/60 px-3 py-1 rounded-full shadow-2xl z-50 text-[10px] font-mono text-slate-200 whitespace-nowrap backdrop-blur-md animate-in fade-in slide-in-from-bottom-1 duration-200"
    >
      <span class="text-slate-300 font-semibold flex items-center gap-1">
        <Smartphone v-if="activeViewport === 'mobile'" class="w-3.5 h-3.5 text-indigo-400" />
        <Tablet v-else class="w-3.5 h-3.5 text-indigo-400" />
        <span>{{ activeViewport === 'mobile' ? 'Mobile (375px)' : 'Tablet (768px)' }}</span>
      </span>
      <span class="text-slate-600">•</span>
      <button
        type="button"
        @click.stop="setViewportPreview('web')"
        class="px-2.5 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold transition-all flex items-center gap-1 cursor-pointer shadow-xs"
        title="Kembalikan kanvas ke ukuran Web Desktop (1024px)"
      >
        <Monitor class="w-3 h-3" />
        <span>Kembali ke Web (1024px)</span>
      </button>
    </div>

    <!-- ==================== WEB / DESKTOP BROWSER FRAME ==================== -->
    <div
      v-if="device !== 'mobile'"
      class="rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
      :style="{ minHeight: `${effectiveHeight}px` }"
    >
      <!-- Browser Chrome Header Bar (Acts as Drag Handle for Vue Flow) -->
      <div
        class="frame-drag-handle h-10 px-2.5 sm:px-4 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 select-none bg-slate-900 text-slate-200 cursor-grab active:cursor-grabbing transition-colors"
        title="Tahan & geser untuk memindahkan screen ini di kanvas"
      >
        <!-- Left Group: Drag Grip, Traffic Lights & Viewport Switcher -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <div class="p-0.5 text-slate-500 group-hover:text-indigo-400 transition-colors" title="Grip Handle">
            <GripVertical class="w-3.5 h-3.5" />
          </div>

          <!-- Traffic Light Buttons -->
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-inner"></span>
            <span class="w-3 h-3 rounded-full bg-[#eab308] inline-block shadow-inner"></span>
            <span class="w-3 h-3 rounded-full bg-[#22c55e] inline-block shadow-inner"></span>
          </div>

          <!-- Viewport preview controls (Desktop, Tablet, Mobile) -->
          <div class="nodrag flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60 flex-shrink-0">
            <button
              type="button"
              @click.stop="setViewportPreview('web')"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="activeViewport === 'web' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Desktop Viewport (1024px)"
            >
              <Monitor class="w-3 h-3" />
            </button>
            <button
              type="button"
              @click.stop="setViewportPreview('tablet')"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="activeViewport === 'tablet' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Tablet Viewport (768px)"
            >
              <Tablet class="w-3 h-3" />
            </button>
            <button
              type="button"
              @click.stop="setViewportPreview('mobile')"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="activeViewport === 'mobile' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Mobile Viewport (375px)"
            >
              <Smartphone class="w-3 h-3" />
            </button>
          </div>

          <!-- Quick Convert to Mobile Button (AI mode change) -->
          <button
            type="button"
            @click.stop="handleSwitchToMobile"
            :disabled="store.isChatGenerating?.value"
            class="nodrag px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
            title="Ubah screen ini dari mode web desktop ke format mobile via AI"
          >
            <Smartphone class="w-3 h-3 text-white" />
            <span v-if="effectiveWidth >= 1000">Ubah ke Mobile</span>
          </button>
        </div>

        <!-- Center: URL Address Bar (Visible when viewport is wide >= 1200) or Title (>= 768) -->
        <div
          v-if="effectiveWidth >= 1200"
          class="nodrag flex-1 max-w-xs h-6 px-3 rounded-md border text-[11px] font-mono flex items-center gap-2 truncate bg-slate-950/70 border-slate-800 text-slate-400 shrink"
        >
          <Lock class="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span class="truncate">https://app.{{ String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-') }}.io</span>
          <RotateCw class="w-2.5 h-2.5 ml-auto text-slate-400 opacity-60" />
        </div>
        <div
          v-else-if="effectiveWidth >= 768"
          class="nodrag flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-400 truncate max-w-[140px] shrink"
          :title="title"
        >
          <span class="truncate">{{ title }}</span>
        </div>

        <!-- Right Group: Badges, Review, Canvas Edit Mode, View Mode, Copy, Delete -->
        <div class="nodrag flex items-center gap-1.5 flex-shrink-0">
          <AntiSlopBadge :compact="effectiveWidth < 1200" :foundation-name="theme?.palette || 'Custom Design System'" :audit-data="auditState" />
          
          <ReviewCommentPin
            :compact="effectiveWidth < 1200"
            :comments="reviewComments"
            @add-comment="handleAddComment"
            @resolve-comment="handleResolveComment"
            @send-to-ai="handleSendToAi"
          />

          <!-- Canvas Edit Mode Switcher (PREVIEW / EDIT / COMMENT) -->
          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60 shrink-0">
            <button
              type="button"
              @click.stop="setCanvasMode('preview')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="canvasMode === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Preview Mode: Navigasi dan link aktif, interaksi normal"
            >
              <Navigation2 class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Preview</span>
            </button>
            <button
              type="button"
              @click.stop="setCanvasMode('edit')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="canvasMode === 'edit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Edit Mode: Klik komponen atau seksi untuk memilih target patch AI"
            >
              <MousePointer2 class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Edit</span>
            </button>
            <button
              type="button"
              @click.stop="setCanvasMode('comment')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="canvasMode === 'comment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Comment Mode: Klik elemen untuk memberi komentar per komponen"
            >
              <MessageSquare class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Comment</span>
            </button>
          </div>

          <span v-if="effectiveWidth >= 1280" class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 hidden sm:inline-block shrink-0">
            {{ effectiveWidth }} × {{ effectiveHeight }}
          </span>

          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60 shrink-0">
            <button
              type="button"
              @click.stop="viewMode = 'visual'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="viewMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Canvas Native Modular Vue Components"
            >
              <Eye class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Canvas</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'sandbox'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="viewMode === 'sandbox' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Isolated Iframe Sandbox (Zero CSS Bleed)"
            >
              <Box class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Sandbox</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'code'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Lihat Kode"
            >
              <Code class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Code</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'spec'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
              :class="viewMode === 'spec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Spesifikasi Halaman"
            >
              <FileText class="w-3 h-3" />
              <span v-if="effectiveWidth >= 1200">Spec</span>
            </button>
          </div>

          <!-- Copy Code Button -->
          <button
            type="button"
            @click.stop="copyCode"
            class="p-1 rounded-lg border border-slate-700/60 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
            :title="isCopied ? 'Tersalin!' : 'Salin Kode UI'"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
          </button>

          <!-- Delete Screen Button -->
          <button
            type="button"
            @click.stop="handleDeleteScreen"
            class="p-1 rounded-lg border border-slate-700/60 bg-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/20 transition-colors cursor-pointer shrink-0"
            title="Hapus Screen ini dari kanvas"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex flex-col overflow-y-auto relative">
        <!-- Visual Canvas Mode: Single Source of Visual Truth with Canvas Editor Overlay -->
        <div v-if="viewMode === 'visual'" class="flex-1 flex flex-col min-h-[500px] relative">
          <ArtifactPreview
            :artifact="artifactData"
            mode="canvas"
            :viewport="activeViewport"
            :version="artifactVersion"
            :frame-id="id"
          />
        </div>

        <!-- Isolated Sandbox Mode: Pure Artifact Preview without Editor Overlay -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[500px] relative overflow-hidden bg-slate-950 flex flex-col">
          <ArtifactPreview
            :artifact="artifactData"
            mode="sandbox"
            :viewport="activeViewport"
            :version="artifactVersion"
            :frame-id="id"
          />
        </div>

        <!-- Spec & 3-Pillar Compiler Architecture Mode -->
        <div v-else-if="viewMode === 'spec'" class="p-6 bg-slate-950 text-slate-200 overflow-y-auto flex-1 space-y-6 text-left select-text">
          <!-- Header Banner -->
          <div class="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-400 font-bold">11-Layer AI Design Compiler • Architecture & Traceability</span>
              <h4 class="text-base font-bold text-white mt-0.5">{{ pageSpec?.page_name || title }}</h4>
            </div>
            <div class="flex items-center gap-2">
              <span
                class="px-2.5 py-1 rounded text-[10px] font-mono font-semibold border flex items-center gap-1.5"
                :class="validation?.status === 'fail' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : validation?.status === 'repaired' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : validation?.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-slate-500/20 text-slate-300 border-slate-500/30'"
              >
                <CheckCircle2 class="w-3 h-3" />
                <span>Compiler Status: {{ (validation?.status || 'unavailable').toUpperCase() }}</span>
              </span>
            </div>
          </div>

          <!-- Change Plan & Locality Audit Card (Rendered when an iteration has occurred) -->
          <div v-if="changePlan" class="p-4 rounded-xl bg-slate-900 border border-indigo-500/40 space-y-3">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
                <span class="text-xs font-bold text-white uppercase tracking-wider">Change Plan & Locality Audit</span>
              </div>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded font-semibold border"
                :class="changePlan.strategy === 'patch' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'"
              >
                Strategy: {{ (changePlan.strategy || 'patch').toUpperCase() }}
              </span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span class="text-slate-400 block text-[10px] uppercase font-mono">Klasifikasi</span>
                <span class="font-bold text-slate-200 mt-0.5 inline-block uppercase text-[11px]">{{ changePlan.classification }}</span>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span class="text-slate-400 block text-[10px] uppercase font-mono">Scope & Target</span>
                <span class="font-bold text-slate-200 mt-0.5 inline-block text-[11px]">
                  {{ changePlan.scope || 'component' }} • {{ changePlan.target?.component || changePlan.target?.section || changePlan.target?.property || 'general' }}
                </span>
              </div>
              <div class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span class="text-slate-400 block text-[10px] uppercase font-mono">Change Locality</span>
                <span class="text-emerald-400 font-semibold mt-0.5 inline-block text-[11px]">
                  {{ changePlan.regenerate ? 'Rebuild Diperlukan' : '100% Local Patch (0 Drift)' }}
                </span>
              </div>
            </div>

            <div v-if="changePlan.preserve && changePlan.preserve.length > 0" class="pt-1">
              <span class="text-[11px] text-slate-400 block mb-1 font-medium">Elemen yang Dipertahankan (Preserved):</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span
                  v-for="(p, pidx) in changePlan.preserve"
                  :key="pidx"
                  class="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                >
                  ✓ {{ p }}
                </span>
              </div>
            </div>
          </div>

          <!-- 3-Pillar Architectural Specification Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <!-- Pillar 1: Requirement Specification (WHAT) -->
            <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  <FileText class="w-4 h-4" />
                  <span>1. Requirement (WHAT)</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {{ requirementSpec?.page?.complexity || pageSpec?.complexity || 'Simple' }}
                </span>
              </div>
              <div class="space-y-2.5 text-xs flex-1">
                <div v-if="requirementSpec?.raw_prompt" class="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                  <span class="text-slate-400 block text-[10px] uppercase font-mono">Raw Prompt:</span>
                  <p class="text-slate-200 text-[11px] italic mt-0.5">"{{ requirementSpec.raw_prompt }}"</p>
                </div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Functional: {{ (requirementSpec?.design_freedom?.functional || requirementSpec?.freedom?.functional || 'low').toUpperCase() }}
                  </span>
                  <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    Visual: {{ (requirementSpec?.design_freedom?.visual || requirementSpec?.freedom?.visual || 'medium').toUpperCase() }}
                  </span>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Tipe Halaman:</span>
                  <p class="text-slate-200 font-semibold mt-0.5">{{ requirementSpec?.page?.type || pageSpec?.type || pageSpec?.page_name || 'Authentication / Standard' }}</p>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px]">Tujuan Utama:</span>
                  <p class="text-slate-200 mt-0.5 leading-snug">{{ requirementSpec?.page?.purpose || requirementSpec?.goals?.primary || pageSpec?.primary_goal || pageSpec?.purpose || 'Menyediakan antarmuka tugas terstruktur.' }}</p>
                </div>

                <!-- Explicit Requirements -->
                <div v-if="(requirementSpec?.explicit && requirementSpec.explicit.length > 0) || (requirementSpec?.requirements?.explicit && requirementSpec.requirements.explicit.length > 0)">
                  <span class="text-slate-400 block text-[11px]">Kebutuhan Eksplisit (Wajib):</span>
                  <div class="space-y-1 mt-1">
                    <div
                      v-for="(ex, exi) in (requirementSpec.explicit || requirementSpec.requirements.explicit)"
                      :key="exi"
                      class="flex items-start gap-1.5 text-[11px] text-emerald-300/90"
                    >
                      <span v-if="ex.id" class="font-mono text-[9px] text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded flex-shrink-0">[{{ ex.id }}]</span>
                      <span>{{ ex.description || ex }}</span>
                    </div>
                  </div>
                </div>

                <!-- Implied Requirements -->
                <div v-if="(requirementSpec?.implied && requirementSpec.implied.length > 0) || (requirementSpec?.requirements?.implied && requirementSpec.requirements.implied.length > 0)">
                  <span class="text-slate-400 block text-[11px]">Kebutuhan Implied:</span>
                  <div class="space-y-1 mt-1">
                    <div
                      v-for="(im, imi) in (requirementSpec.implied || requirementSpec.requirements.implied)"
                      :key="imi"
                      class="flex items-start gap-1.5 text-[11px] text-slate-300"
                    >
                      <span v-if="im.id" class="font-mono text-[9px] text-slate-400 bg-slate-800/80 px-1 py-0.5 rounded flex-shrink-0">[{{ im.id }}]</span>
                      <span>{{ im.description || im }}</span>
                    </div>
                  </div>
                </div>

                <!-- Optional Requirements -->
                <div v-if="(requirementSpec?.optional && requirementSpec.optional.length > 0) || (requirementSpec?.requirements?.optional && requirementSpec.requirements.optional.length > 0)">
                  <span class="text-slate-400 block text-[11px]">Fitur Opsional (Omitted by Default):</span>
                  <div class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="(opt, opti) in (requirementSpec.optional || requirementSpec.requirements.optional)"
                      :key="opti"
                      class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60"
                    >
                      {{ typeof opt === 'object' ? (opt.description || opt.id) : opt }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Pillar 2: Design Specification & Traceability (HOW) -->
            <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
                  <Layers class="w-4 h-4" />
                  <span>2. Design & Traceability (HOW)</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  {{ sections.length }} Sections
                </span>
              </div>
              <div class="space-y-2.5 text-xs flex-1">
                <div>
                  <span class="text-slate-400 block text-[11px]">Tata Letak & Tata Visual:</span>
                  <p class="text-slate-200 mt-0.5 font-medium">{{ pageSpec?.layout || 'Centered Minimal' }} • <span class="text-slate-400">{{ pageSpec?.visual_direction || theme?.mode || 'Modern Dark' }}</span></p>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px] mb-1">Traceability Seksi & Komponen:</span>
                  <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                    <div
                      v-for="(sec, sidx) in sections"
                      :key="sec.id || sidx"
                      class="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] flex flex-col gap-1"
                    >
                      <div class="flex items-center justify-between">
                        <div class="flex items-center gap-1.5">
                          <span v-if="sec.id" class="font-mono text-[9px] text-sky-400 bg-sky-950/50 px-1 py-0.5 rounded border border-sky-800/40">{{ sec.id }}</span>
                          <span class="font-bold text-slate-200 font-mono text-[10px]">{{ sec.type }}</span>
                        </div>
                        <span
                          class="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase"
                          :class="sec.priority === 'high' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'"
                        >
                          {{ sec.priority || 'standard' }}
                        </span>
                      </div>
                      <p class="text-slate-400 text-[10px]">{{ sec.purpose || 'Komponen antarmuka terverifikasi' }}</p>
                      
                      <!-- Section Requirement Source -->
                      <div class="flex items-center gap-1 text-[9px] text-sky-400/90 font-mono">
                        <span>Source:</span>
                        <span class="text-slate-300">
                          {{ typeof sec.requirement_source === 'object' ? `${sec.requirement_source.type} (${sec.requirement_source.id})` : (sec.requirement_source || 'page_layout') }}
                        </span>
                      </div>

                      <!-- Subcomponents with Stable IDs -->
                      <div v-if="sec.components && sec.components.length > 0" class="pt-1.5 border-t border-slate-800/60 mt-0.5 space-y-1">
                        <span class="text-[9px] font-mono text-slate-400 uppercase">Targetable Components:</span>
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="cmp in sec.components"
                            :key="cmp.id"
                            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[9px] font-mono text-slate-300"
                            :title="`${cmp.purpose || cmp.type} (Source: ${cmp.requirement_source?.id || 'implied'})`"
                          >
                            <span class="text-indigo-300 font-semibold">{{ cmp.id }}</span>
                            <span class="text-slate-500 text-[8px]">({{ cmp.type }})</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Structured Design Decisions -->
                <div v-if="Array.isArray(designDecisions) && designDecisions.length > 0" class="pt-1">
                  <span class="text-slate-400 block text-[11px] mb-1">Structured Design Decisions:</span>
                  <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                    <div
                      v-for="(dec, didx) in designDecisions"
                      :key="dec.id || didx"
                      class="p-1.5 rounded bg-slate-950/60 border border-slate-800 text-[10px]"
                    >
                      <div class="flex items-center justify-between text-[9px] font-mono text-slate-400">
                        <span>{{ dec.id }}</span>
                        <span class="text-indigo-400">{{ dec.source }}</span>
                      </div>
                      <p class="text-slate-200 font-semibold mt-0.5">{{ dec.decision }}</p>
                      <p class="text-slate-400 text-[9px] mt-0.5">{{ dec.reason }}</p>
                    </div>
                  </div>
                </div>
                <div v-else-if="designDecisions?.omitted_features && designDecisions.omitted_features.length > 0">
                  <span class="text-slate-400 block text-[11px]">Fitur Ditiadakan (Anti-Bloat):</span>
                  <p class="text-amber-300/90 text-[11px] mt-0.5">{{ designDecisions.omitted_features.join(', ') }}</p>
                </div>
              </div>
            </div>

            <!-- Pillar 3: UI Validator & Audit (EVALUATION) -->
            <div class="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 flex flex-col">
              <div class="flex items-center justify-between border-b border-slate-800 pb-2">
                <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck class="w-4 h-4" />
                  <span>3. Validator & Audit (EVALUATION)</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Anti-Hallucination
                </span>
              </div>
              <div class="space-y-2.5 text-xs flex-1">
                <!-- Canonical Audit Status Grid -->
                <div>
                  <span class="text-slate-400 block text-[11px] mb-1">Deterministic & Quality Audit:</span>
                  <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Schema:</span>
                      <span class="font-bold text-slate-300 font-mono uppercase">{{ auditState?.validation?.status || 'unavailable' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Coverage:</span>
                      <span class="font-bold text-slate-300 font-mono uppercase">{{ auditState?.requirement_coverage?.status || 'unavailable' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Anti-Slop:</span>
                      <span class="font-bold text-slate-300 font-mono uppercase">{{ auditState?.anti_slop?.status || 'unavailable' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Visual Review:</span>
                      <span class="font-bold text-slate-300 font-mono uppercase">{{ auditState?.visual_review?.status || 'unavailable' }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span class="text-slate-400 block text-[11px]">Anti-Hallucination Audit:</span>
                  <div class="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 mt-1 flex items-start gap-1.5">
                    <CheckCircle2 class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <span>{{ validation?.hallucination_check || 'Belum dievaluasi.' }}</span>
                  </div>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px] mb-1">Skor Kualitas Kompiler (8 Metrik):</span>
                  <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Fidelity:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.requirement_fidelity) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Scope:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.scope_accuracy ?? validation?.score?.scope) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Traceability:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.traceability) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Simplicity:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.simplicity) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Hierarchy:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.hierarchy) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Consistency:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.visual_consistency ?? validation?.score?.consistency) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Responsive:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.responsive_quality) }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Anti-Hallucination:</span>
                      <span class="font-bold text-slate-300 font-mono">{{ formatAuditScore(validation?.score?.hallucination_safety) }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="validation?.structured_issues && validation.structured_issues.length > 0">
                  <span class="text-slate-400 block text-[11px] mb-1">Intervensi Guard Kompiler:</span>
                  <div class="space-y-1 max-h-32 overflow-y-auto pr-1">
                    <div
                      v-for="(issue, ii) in validation.structured_issues"
                      :key="ii"
                      class="p-1.5 rounded bg-amber-950/20 border border-amber-800/30 text-[10px] text-amber-200 leading-snug"
                    >
                      <span class="font-mono text-amber-400 font-semibold uppercase">[{{ issue.type }}]</span>
                      <span class="text-slate-300 font-mono ml-1">{{ issue.component }}:</span>
                      {{ issue.action }} — <span class="text-amber-300/80">{{ issue.reason }}</span>
                    </div>
                  </div>
                </div>
                <div v-if="validation?.stripped_sections && validation.stripped_sections.length > 0">
                  <span class="text-slate-400 block text-[11px]">Seksi Dipangkas Otomatis:</span>
                  <ul class="list-disc list-inside text-[10px] text-rose-300/90 mt-0.5">
                    <li v-for="(str, stri) in validation.stripped_sections" :key="stri">{{ str }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Code Viewer Mode -->
        <div v-else class="p-6 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed flex-1">
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-slate-400 text-[11px] gap-2">
            <!-- Framework Switcher Tabs -->
            <div class="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 gap-1">
              <button
                type="button"
                @click.stop="activeCodeTab = 'react'"
                :class="activeCodeTab === 'react' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer"
              >
                React (TSX)
              </button>
              <button
                type="button"
                @click.stop="activeCodeTab = 'html'"
                :class="activeCodeTab === 'html' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer"
              >
                HTML5
              </button>
              <button
                type="button"
                @click.stop="activeCodeTab = 'vue'"
                :class="activeCodeTab === 'vue' ? 'bg-indigo-600 text-white shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2.5 py-1 rounded text-[10px] transition-all cursor-pointer"
              >
                Vue 3
              </button>
            </div>
            <span v-if="isCopied" class="text-emerald-400 font-bold">✓ Kode disalin ke clipboard</span>
          </div>
          <pre v-if="displayCode" class="max-h-[70vh] overflow-auto"><code>{{ displayCode }}</code></pre>
          <div v-else class="flex flex-col items-center justify-center gap-2 text-center py-16 text-slate-500">
            <Code class="w-7 h-7 opacity-40 mx-auto" />
            <span class="text-xs">Belum ada kode untuk tab ini. Ketik prompt di AI Copilot untuk mulai mengompilasi desain.</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== MOBILE SMARTPHONE FRAME ==================== -->
    <div v-else class="flex flex-col items-center select-text w-full">
      <!-- Mobile Dedicated Frame Header Bar (Clean Control Dock with Drag Handle) -->
      <div
        class="frame-drag-handle w-full mb-3 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-800 shadow-xl flex items-center justify-between gap-2 select-none cursor-grab active:cursor-grabbing backdrop-blur-md text-slate-200 ring-1 ring-white/5 transition-all"
        :style="{ maxWidth: `${Math.max(width, 440)}px` }"
        title="Tahan & geser untuk memindahkan screen ini di kanvas"
      >
        <!-- Left: Drag Grip + Title + Ubah ke Web Button -->
        <div class="flex items-center gap-2 min-w-0">
          <div class="p-0.5 text-slate-500 group-hover:text-indigo-400 transition-colors shrink-0" title="Grip Handle (Tahan & geser untuk memindahkan screen)">
            <GripVertical class="w-3.5 h-3.5" />
          </div>

          <div class="flex items-center gap-1.5 min-w-0 shrink">
            <Smartphone class="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span class="text-xs font-bold text-slate-200 truncate max-w-[110px]" :title="title">{{ title }}</span>
          </div>

          <!-- Clickable Button to Switch to Web View -->
          <button
            type="button"
            @click.stop="handleSwitchToWeb"
            :disabled="store.isChatGenerating?.value"
            class="nodrag px-2 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-[10px] font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
            title="Ubah screen ini dari mode mobile ke format web desktop"
          >
            <Monitor class="w-3 h-3 text-white" />
            <span>Ubah ke Web</span>
          </button>
        </div>

        <!-- Right: Action Controls (nodrag prevents dragging when clicking buttons) -->
        <div class="nodrag flex items-center gap-1.5 shrink-0">
          <AntiSlopBadge :compact="true" :foundation-name="theme?.palette || 'Custom Design System'" :audit-data="auditState" />
          <ReviewCommentPin
            :compact="true"
            :comments="reviewComments"
            @add-comment="handleAddComment"
            @resolve-comment="handleResolveComment"
            @send-to-ai="handleSendToAi"
          />

          <!-- View Mode Switcher (Compact Icons on mobile) -->
          <div class="flex items-center rounded-lg border border-slate-700/70 p-0.5 bg-slate-950/70">
            <button
              type="button"
              @click.stop="viewMode = 'visual'"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'visual' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Canvas Editor"
            >
              <Eye class="w-3 h-3" />
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'sandbox'"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'sandbox' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Sandbox Preview"
            >
              <Box class="w-3 h-3" />
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'code'"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'code' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Lihat Kode"
            >
              <Code class="w-3 h-3" />
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'spec'"
              class="p-1 rounded text-[10px] font-semibold transition-colors cursor-pointer"
              :class="viewMode === 'spec' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Spesifikasi Halaman"
            >
              <FileText class="w-3 h-3" />
            </button>
          </div>

          <!-- Copy Code Button -->
          <button
            type="button"
            @click.stop="copyCode"
            class="p-1 rounded-lg border border-slate-700/60 bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            :title="isCopied ? 'Tersalin!' : 'Salin Kode UI'"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
          </button>

          <!-- Delete Screen Button -->
          <button
            type="button"
            @click.stop="handleDeleteScreen"
            class="p-1 rounded-lg border border-slate-700/60 bg-slate-800 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
            title="Hapus Screen ini dari kanvas"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Mobile Smartphone Hardware Shell -->
      <div
        class="mx-auto rounded-[48px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300 ring-1 ring-white/10"
        :style="{ width: `${width}px`, minHeight: `${height}px` }"
      >
        <!-- Native Mobile Status Bar & Dynamic Island (Pure Hardware Mockup) -->
        <div class="h-10 w-full bg-slate-900/60 border-b border-white/5 flex items-center justify-between px-6 select-none z-40 relative flex-shrink-0 backdrop-blur-xs">
          <!-- Left: Native Time -->
          <span class="text-[12px] font-semibold text-slate-300 font-mono">9:41</span>

          <!-- Center: Dynamic Island -->
          <div class="w-24 h-5 rounded-full bg-black flex items-center justify-center gap-2 border border-white/10 shadow-xs">
            <span class="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></span>
            <span class="w-2 h-2 rounded-full bg-indigo-950/80 border border-indigo-900/60"></span>
          </div>

          <!-- Right: Mobile Indicators -->
          <div class="flex items-center gap-1.5 text-slate-300 text-[11px]">
            <Signal class="w-3 h-3" />
            <Wifi class="w-3 h-3" />
            <Battery class="w-4 h-4" />
          </div>
        </div>
        <!-- Mobile Content Area -->
        <div class="flex-1 flex flex-col overflow-y-auto relative">
        <!-- Mobile Visual Canvas Mode: Single Source of Visual Truth with Canvas Editor Overlay -->
        <div v-if="viewMode === 'visual'" class="flex-1 flex flex-col min-h-[400px] relative">
          <ArtifactPreview
            :artifact="artifactData"
            mode="canvas"
            viewport="mobile"
            :version="artifactVersion"
            :frame-id="id"
          />
        </div>

        <!-- Mobile Isolated Sandbox Mode: Pure Artifact Preview without Editor Overlay -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[400px] relative overflow-hidden bg-slate-950 flex flex-col">
          <ArtifactPreview
            :artifact="artifactData"
            mode="sandbox"
            viewport="mobile"
            :version="artifactVersion"
            :frame-id="id"
          />
        </div>

        <!-- Spec Mode Mobile (3-Pillar Compiler Architecture) -->
        <div v-else-if="viewMode === 'spec'" class="p-4 bg-slate-950 text-slate-200 text-xs overflow-y-auto space-y-3.5 flex-1 text-left select-text">
          <div class="pb-2 border-b border-slate-800 flex items-center justify-between">
            <div>
              <span class="text-[9px] font-mono text-indigo-400 font-bold uppercase">AI Design Compiler</span>
              <div class="text-xs font-bold text-white">{{ pageSpec?.page_name || title }}</div>
            </div>
            <span
              class="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase"
              :class="validation?.status === 'fail' ? 'bg-rose-500/20 text-rose-300' : validation?.status === 'pass' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'"
            >
              {{ validation?.status || 'unavailable' }}
            </span>
          </div>

          <!-- 1. Requirement -->
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">1. Requirement (WHAT)</span>
              <span class="text-[8px] font-mono px-1 py-0.5 rounded bg-amber-500/10 text-amber-300">
                F-{{ (requirementSpec?.design_freedom?.functional || requirementSpec?.freedom?.functional || 'low').toUpperCase() }} / V-{{ (requirementSpec?.design_freedom?.visual || requirementSpec?.freedom?.visual || 'med').toUpperCase() }}
              </span>
            </div>
            <div class="text-[11px] text-slate-300">
              <span class="text-slate-400 text-[10px] block">Tujuan Utama:</span>
              {{ requirementSpec?.goals?.primary || pageSpec?.primary_goal || 'Alur mobile terfokus dan responsif.' }}
            </div>
            <div class="text-[10px] text-slate-400">
              Domain: <span class="text-slate-200 font-mono">{{ requirementSpec?.context?.domain || 'Null (Unspecified)' }}</span>
            </div>
          </div>

          <!-- 2. Traceability -->
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span class="text-[10px] font-bold text-sky-300 uppercase tracking-wider block">2. Traceability (HOW)</span>
            <div class="space-y-1 text-[10px]">
              <div v-for="(sec, sidx) in sections" :key="sec.id || sidx" class="flex justify-between items-center text-slate-300 border-b border-slate-800/60 pb-0.5">
                <span class="font-mono text-white">{{ sec.type }}</span>
                <span class="text-slate-400">{{ sec.requirement_source || 'page' }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Audit -->
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span class="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">3. Validator (VERIFIED)</span>
            <p class="text-[10px] text-emerald-400">{{ validation?.hallucination_check || 'Belum dievaluasi.' }}</p>
            <div class="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-slate-800">
              <span class="text-slate-400">Fidelity: <span class="text-emerald-400 font-mono font-bold">{{ formatAuditScore(validation?.score?.requirement_fidelity) }}</span></span>
              <span class="text-slate-400">Scope: <span class="text-emerald-400 font-mono font-bold">{{ formatAuditScore(validation?.score?.scope_accuracy ?? validation?.score?.scope) }}</span></span>
            </div>
          </div>
        </div>

        <!-- Code Viewer Mode -->
        <div v-else class="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed flex-1">
          <div class="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-800 text-slate-400 text-[10px] gap-1">
            <div class="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 gap-1">
              <button
                type="button"
                @click.stop="activeCodeTab = 'react'"
                :class="activeCodeTab === 'react' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer"
              >
                React
              </button>
              <button
                type="button"
                @click.stop="activeCodeTab = 'html'"
                :class="activeCodeTab === 'html' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer"
              >
                HTML
              </button>
              <button
                type="button"
                @click.stop="activeCodeTab = 'vue'"
                :class="activeCodeTab === 'vue' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'"
                class="px-2 py-0.5 rounded text-[9px] transition-all cursor-pointer"
              >
                Vue
              </button>
            </div>
            <span v-if="isCopied" class="text-emerald-400 font-bold">✓ Copied</span>
          </div>
          <pre v-if="displayCode" class="max-h-[60vh] overflow-auto"><code>{{ displayCode }}</code></pre>
          <div v-else class="flex flex-col items-center justify-center gap-2 text-center py-12 text-slate-500">
            <Code class="w-6 h-6 opacity-40 mx-auto" />
            <span class="text-[11px]">Belum ada kode untuk tab ini.</span>
          </div>
        </div>
      </div>

      <!-- Bottom Home Indicator Swipe Bar -->
      <div class="h-6 w-full flex items-center justify-center flex-shrink-0 bg-transparent">
        <div class="w-28 h-1 rounded-full bg-slate-600/60"></div>
      </div>
    </div>
  </div>

    <!-- Vue Flow Output Handles (LR and TB) -->
    <Handle
      type="source"
      :position="Position.Right"
      id="right"
      class="!h-3 !w-3 !border-2 !border-white !bg-indigo-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-50"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      id="bottom"
      class="!h-3 !w-3 !border-2 !border-white !bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity z-50"
    />
  </div>
</template>
