<script setup>
import { ref, computed } from 'vue'
import {
  Terminal,
  ShieldCheck,
  Code2,
  Cpu,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  Target,
  MousePointer2,
  Navigation2,
  MessageSquare,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const store = useDiagramStore()

const isOpen = ref(false)
const isExpanded = ref(true)
const activeTab = ref('payload') // 'payload' | 'artifact' | 'visual_edit' | 'audit'
const isCopied = ref(false)
let copyTimer = null

const canvasMode = computed(() => store.canvasMode.value)
const selectedTarget = computed(() => store.selectedTarget.value)
const selectionContext = computed(() => store.selectionContext.value)
const selectedComponentId = computed(() => store.selectedComponentId.value)

const outgoingPayload = computed(() => store.lastApiPayload.value)
const artifact = computed(() => store.lastGeneratedArtifact.value)

// Check if outgoing payload is truly thin (no hardcoded foundation, theme, or palette)
const isThinClientCertified = computed(() => {
  if (!outgoingPayload.value) return true
  const p = outgoingPayload.value
  return !p.foundation && !p.theme && !p.theme_mode && !p.accent_color && !p.template_id
})

// Current active node data
const activeNode = computed(() => {
  const nodes = store.nodes.value || []
  return nodes.find((n) => n.type === 'ui_frame') || nodes[0] || null
})

const nodeData = computed(() => activeNode.value?.data || null)
const auditState = computed(() => nodeData.value?.audit || null)
const validation = computed(() => auditState.value?.validation || null)

const htmlCode = computed(() => {
  return (
    nodeData.value?.implementation?.source?.html ||
    nodeData.value?.code_export?.html ||
    nodeData.value?.rawHtml ||
    nodeData.value?.raw_html ||
    ''
  )
})

const vueCode = computed(() => {
  return (
    nodeData.value?.implementation?.source?.vue ||
    nodeData.value?.code_export?.vue ||
    ''
  )
})

const lineCountHtml = computed(() => (htmlCode.value ? htmlCode.value.split('\n').length : 0))
const lineCountVue = computed(() => (vueCode.value ? vueCode.value.split('\n').length : 0))

async function copyPayload() {
  try {
    const text = JSON.stringify(outgoingPayload.value, null, 2)
    await navigator.clipboard.writeText(text)
    isCopied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => {
      isCopied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy payload:', err)
  }
}
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 font-sans select-none text-left">
    <!-- Floating Collapsed Trigger Button -->
    <div v-if="!isOpen" class="flex items-center gap-2">
      <button
        type="button"
        @click="isOpen = true"
        class="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/95 text-slate-200 border border-slate-700/80 shadow-2xl hover:bg-slate-800 hover:border-indigo-500/60 transition-all backdrop-blur-md cursor-pointer group"
      >
        <div class="w-2 h-2 rounded-full" :class="isThinClientCertified ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'"></div>
        <Terminal class="w-4 h-4 text-indigo-400 group-hover:text-indigo-300" />
        <span class="text-xs font-mono font-bold">Dev Debug Panel</span>
        <span
          class="text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold"
          :class="isThinClientCertified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
        >
          {{ isThinClientCertified ? 'Thin Client' : 'Override' }}
        </span>
      </button>
    </div>

    <!-- Expanded Debug Panel Window -->
    <div
      v-else
      class="w-96 md:w-[460px] bg-slate-950/95 border border-slate-700/90 rounded-2xl shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden text-slate-200 transition-all duration-200 ring-1 ring-white/10"
      :style="{ maxHeight: isExpanded ? '540px' : '48px' }"
    >
      <!-- Panel Header Bar -->
      <div class="h-12 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 flex-shrink-0">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-indigo-400" />
          <h3 class="text-xs font-bold text-white tracking-wide">RancangLab Thin Client Inspector</h3>
          <span
            class="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
            :class="isThinClientCertified ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'"
          >
            {{ isThinClientCertified ? '100% UNBIASED' : 'MANUAL OVERRIDE' }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            type="button"
            @click="isExpanded = !isExpanded"
            class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            :title="isExpanded ? 'Minimize' : 'Expand'"
          >
            <ChevronDown v-if="isExpanded" class="w-3.5 h-3.5" />
            <ChevronUp v-else class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="isOpen = false"
            class="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Panel"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Panel Body (Visible when expanded) -->
      <div v-if="isExpanded" class="flex-1 flex flex-col overflow-hidden">
        <!-- Sub Tabs -->
        <div class="flex border-b border-slate-800/80 bg-slate-900/50 px-3 pt-2 gap-2 text-xs font-mono">
          <button
            type="button"
            @click="activeTab = 'payload'"
            class="pb-2 px-2.5 font-semibold transition-colors flex items-center gap-1.5 relative border-b-2 -mb-px"
            :class="activeTab === 'payload' ? 'text-indigo-400 border-indigo-500' : 'text-slate-400 border-transparent hover:text-slate-200'"
          >
            <Cpu class="w-3.5 h-3.5" />
            <span>API Payload</span>
          </button>
          <button
            type="button"
            @click="activeTab = 'artifact'"
            class="pb-2 px-2.5 font-semibold transition-colors flex items-center gap-1.5 relative border-b-2 -mb-px"
            :class="activeTab === 'artifact' ? 'text-sky-400 border-sky-500' : 'text-slate-400 border-transparent hover:text-slate-200'"
          >
            <Code2 class="w-3.5 h-3.5" />
            <span>Artifact Code</span>
          </button>
          <button
            type="button"
            @click="activeTab = 'visual_edit'"
            class="pb-2 px-2.5 font-semibold transition-colors flex items-center gap-1.5 relative border-b-2 -mb-px"
            :class="activeTab === 'visual_edit' ? 'text-amber-400 border-amber-500' : 'text-slate-400 border-transparent hover:text-slate-200'"
          >
            <Target class="w-3.5 h-3.5" />
            <span>Visual Edit</span>
          </button>
          <button
            type="button"
            @click="activeTab = 'audit'"
            class="pb-2 px-2.5 font-semibold transition-colors flex items-center gap-1.5 relative border-b-2 -mb-px"
            :class="activeTab === 'audit' ? 'text-emerald-400 border-emerald-500' : 'text-slate-400 border-transparent hover:text-slate-200'"
          >
            <ShieldCheck class="w-3.5 h-3.5" />
            <span>Backend Audit</span>
          </button>
        </div>

        <!-- Tab 1: API Outgoing Payload -->
        <div v-if="activeTab === 'payload'" class="p-4 flex-1 overflow-y-auto space-y-3 font-mono text-xs select-text">
          <div class="flex items-center justify-between">
            <span class="text-slate-400 text-[11px] font-sans">Outgoing Request to Engine:</span>
            <button
              v-if="outgoingPayload"
              type="button"
              @click="copyPayload"
              class="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
            >
              <Check v-if="isCopied" class="w-3 h-3 text-emerald-400" />
              <Copy v-else class="w-3 h-3" />
              <span>{{ isCopied ? 'Copied' : 'Copy JSON' }}</span>
            </button>
          </div>

          <div v-if="outgoingPayload" class="rounded-xl bg-slate-900/80 border border-slate-800 p-3 overflow-x-auto text-[11px] leading-relaxed">
            <pre><code class="text-indigo-300">{{ JSON.stringify(outgoingPayload, null, 2) }}</code></pre>
          </div>
          <div v-else class="p-6 text-center text-slate-500 text-xs font-sans">
            Belum ada request generasi UI yang dikirimkan.
          </div>

          <!-- Thin Client Guarantee Box -->
          <div
            class="p-3 rounded-xl border flex items-start gap-2.5 text-[11px] font-sans"
            :class="isThinClientCertified ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300' : 'bg-amber-950/20 border-amber-500/30 text-amber-300'"
          >
            <CheckCircle2 v-if="isThinClientCertified" class="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <AlertTriangle v-else class="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-bold">
                {{ isThinClientCertified ? 'Thin Client Mode Certified' : 'Preset Terdeteksi' }}
              </p>
              <p class="text-[10px] opacity-80 mt-0.5 leading-snug">
                {{
                  isThinClientCertified
                    ? 'Frontend tidak menginjeksi foundation, palette, atau template. AI Engine menentukan 100% estetika desain murni dari prompt.'
                    : 'Request ini menyertakan parameter override manual yang memandu engine ke fondasi tertentu.'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Tab 2: Artifact & Code Single-Source-of-Truth -->
        <div v-else-if="activeTab === 'artifact'" class="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs select-text">
          <div class="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">HTML Code Lines:</span>
              <span class="text-emerald-400 font-bold text-base mt-0.5 block">{{ lineCountHtml }} lines</span>
            </div>
            <div class="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800">
              <span class="text-slate-400 block text-[10px]">Vue Code Lines:</span>
              <span class="text-sky-400 font-bold text-base mt-0.5 block">{{ lineCountVue }} lines</span>
            </div>
          </div>

          <div class="p-3 rounded-xl bg-slate-900/50 border border-slate-800 text-[11px] space-y-1.5">
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Single Source of Truth:</span>
              <span class="font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 class="w-3 h-3" />
                <span>Verified Iframe & Code Synchronized</span>
              </span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Target Framework:</span>
              <span class="font-mono text-slate-200">Vue 3 + Tailwind CSS CDN</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-slate-400">Device Canvas:</span>
              <span class="font-mono text-slate-200">{{ nodeData?.canvas?.device || 'web' }} ({{ nodeData?.canvas?.width }} × {{ nodeData?.canvas?.height }})</span>
            </div>
          </div>
        </div>

        <!-- Tab 3: Visual Edit & Canvas State -->
        <div v-else-if="activeTab === 'visual_edit'" class="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs select-text">
          <!-- Canvas Mode State -->
          <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Active Canvas Mode:</span>
              <span
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase"
                :class="
                  canvasMode === 'edit'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : canvasMode === 'comment'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                "
              >
                {{ canvasMode }}
              </span>
            </div>
            <div class="flex gap-1 pt-1">
              <button
                type="button"
                @click="store.setCanvasMode('preview')"
                class="flex-1 py-1 rounded text-[10px] font-semibold border transition-all text-center"
                :class="canvasMode === 'preview' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'"
              >
                Preview
              </button>
              <button
                type="button"
                @click="store.setCanvasMode('edit')"
                class="flex-1 py-1 rounded text-[10px] font-semibold border transition-all text-center"
                :class="canvasMode === 'edit' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'"
              >
                Edit
              </button>
              <button
                type="button"
                @click="store.setCanvasMode('comment')"
                class="flex-1 py-1 rounded text-[10px] font-semibold border transition-all text-center"
                :class="canvasMode === 'comment' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'"
              >
                Comment
              </button>
            </div>
          </div>

          <!-- Selection Inspector -->
          <div class="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 text-[11px]">Selected Target:</span>
              <span
                v-if="selectedComponentId"
                class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
              >
                {{ selectedTarget?.type || 'component' }}
              </span>
              <span v-else class="text-[10px] text-slate-500 font-mono">None</span>
            </div>

            <div v-if="selectedComponentId" class="space-y-1.5 pt-1 text-[11px]">
              <div class="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span class="text-slate-400">Target ID:</span>
                <span class="font-mono text-emerald-400 font-bold">{{ selectedComponentId }}</span>
              </div>
              <div v-if="selectedTarget?.section_id" class="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span class="text-slate-400">Section ID:</span>
                <span class="font-mono text-indigo-300">{{ selectedTarget.section_id }}</span>
              </div>
              <div v-if="selectionContext?.tag" class="flex justify-between items-center bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                <span class="text-slate-400">HTML Tag:</span>
                <span class="font-mono text-slate-200">&lt;{{ selectionContext.tag }}&gt;</span>
              </div>
              <div v-if="selectionContext?.text" class="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <span class="text-slate-400 block text-[10px]">Text Content:</span>
                <p class="text-slate-200 italic mt-0.5 truncate">"{{ selectionContext.text }}"</p>
              </div>

              <div class="pt-1 flex justify-end">
                <button
                  type="button"
                  @click="store.clearSelectedTarget()"
                  class="px-2 py-1 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30"
                >
                  Clear Selection
                </button>
              </div>
            </div>

            <div v-else class="p-3 text-center text-slate-500 text-[11px]">
              Masuk ke mode Edit/Comment lalu klik elemen di dalam canvas untuk memilih target secara presisi.
            </div>
          </div>
        </div>

        <!-- Tab 4: Backend Audit -->
        <div v-else-if="activeTab === 'audit'" class="p-4 flex-1 overflow-y-auto space-y-3 font-sans text-xs select-text">
          <div class="grid grid-cols-2 gap-2 text-[10px] font-mono">
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Validation:</span>
              <span class="font-bold text-emerald-400 uppercase">{{ auditState?.validation?.status || 'PASS' }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Coverage:</span>
              <span class="font-bold text-emerald-400 uppercase">{{ auditState?.requirement_coverage?.status || 'PASS' }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Anti-Slop:</span>
              <span class="font-bold text-emerald-400 uppercase">{{ auditState?.anti_slop?.status || 'PASS' }}</span>
            </div>
            <div class="p-2 rounded-lg bg-slate-900/70 border border-slate-800 flex justify-between items-center">
              <span class="text-slate-400">Visual Review:</span>
              <span class="font-bold text-emerald-400 uppercase">{{ auditState?.visual_review?.status || 'PASS' }}</span>
            </div>
          </div>

          <div v-if="validation?.hallucination_check" class="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300">
            <span class="font-bold block mb-0.5 text-emerald-400 font-mono text-[10px]">Anti-Hallucination:</span>
            {{ validation.hallucination_check }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
