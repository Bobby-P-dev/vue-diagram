<script setup>
import { ref, computed, onBeforeUnmount } from 'vue'
import {
  Download,
  ChevronDown,
  FileCode,
  Image,
  Code,
  FileJson,
  Check,
  Loader2,
} from 'lucide-vue-next'
import { useCanvasExport } from '../../composables/useCanvasExport.js'
import { useDiagramStore } from '../../stores/diagramStore.js'

const {
  downloadAsPng,
  downloadAsSvg,
  copyMermaidToClipboard,
  downloadAsJson,
} = useCanvasExport()

const store = useDiagramStore()

const hasUiFrames = computed(() => {
  return (store.nodes.value || []).some((n) => n.type === 'ui_frame')
})

const isOpen = ref(false)
const isExporting = ref(false)
const errorMessage = ref('')
const copySuccess = ref(false)
let copyTimer = null

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

async function handleExport(format) {
  if (isExporting.value) return
  isExporting.value = true
  errorMessage.value = ''
  try {
    const projectTitle = store.activeProject?.value?.title || 'diagram'
    const safeTitle = projectTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'diagram'
    const timestamp = Date.now()

    if (format === 'png') {
      await downloadAsPng(null, `${safeTitle}-${timestamp}.png`)
      close()
    } else if (format === 'svg') {
      await downloadAsSvg(null, `${safeTitle}-${timestamp}.svg`)
      close()
    } else if (format === 'mermaid') {
      await copyMermaidToClipboard(
        store.nodes.value,
        store.edges.value,
        store.activeDiagramType.value,
      )
      copySuccess.value = true
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        copySuccess.value = false
        close()
      }, 2500)
    } else if (format === 'ui_code') {
      const frames = (store.nodes.value || []).filter((n) => n.type === 'ui_frame')
      const codeList = frames.map((f, i) => {
        const title = f.data?.canvas?.title || f.data?.title || `Frame ${i + 1}`
        const code =
          f.data?.implementation?.source?.vue ||
          f.data?.implementation?.source?.html ||
          f.data?.code_export?.vue ||
          f.data?.code_export?.html ||
          ''
        return `<!-- ==================== ${title} ==================== -->\n${code}`
      })
      const fullCode = codeList.join('\n\n')
      await navigator.clipboard.writeText(fullCode)
      copySuccess.value = true
      clearTimeout(copyTimer)
      copyTimer = setTimeout(() => {
        copySuccess.value = false
        close()
      }, 2500)
    } else if (format === 'json') {
      downloadAsJson(
        store.activeProject?.value,
        store.nodes.value,
        store.edges.value,
        `${safeTitle}-${timestamp}.json`,
      )
      close()
    }
  } catch (error) {
    errorMessage.value = error.message || 'Export failed'
  } finally {
    isExporting.value = false
  }
}

function handleClickOutside(event) {
  if (!event.target.closest('[data-export-dropdown]')) {
    close()
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('click', handleClickOutside)
  onBeforeUnmount(() => {
    window.removeEventListener('click', handleClickOutside)
    clearTimeout(copyTimer)
  })
}
</script>

<template>
  <!-- Relative container so absolute popup menu never alters parent flex height -->
  <div data-export-dropdown class="relative inline-block text-left">
    <button
      type="button"
      class="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
      :disabled="isExporting || !store.hasDiagram.value"
      @click.stop="toggle"
      title="Export diagram dalam berbagai format"
    >
      <Loader2 v-if="isExporting" class="h-3.5 w-3.5 animate-spin text-indigo-600" />
      <Download v-else class="h-3.5 w-3.5 text-slate-600" />
      <span>{{ isExporting ? 'Memproses...' : 'Export' }}</span>
      <ChevronDown
        class="h-3.5 w-3.5 transition-transform text-slate-400"
        :class="{ 'rotate-180': isOpen }"
      />
    </button>

    <!-- Floating Dropdown Menu (Absolute position prevents button from jumping upward) -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl py-1 animate-fade-in divide-y divide-slate-100 z-50"
    >
      <!-- Visual Image Exports -->
      <div class="py-1">
        <button
          type="button"
          class="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          :disabled="isExporting"
          @click.stop="handleExport('png')"
        >
          <div class="flex items-center gap-2.5">
            <Image class="h-4 w-4 text-indigo-500" />
            <span>Download PNG</span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-indigo-50 text-indigo-600 font-semibold rounded">
            HD 2x
          </span>
        </button>

        <button
          type="button"
          class="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          :disabled="isExporting"
          @click.stop="handleExport('svg')"
        >
          <div class="flex items-center gap-2.5">
            <FileCode class="h-4 w-4 text-emerald-500" />
            <span>Download SVG</span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-50 text-emerald-600 font-semibold rounded">
            Vektor
          </span>
        </button>
      </div>

      <!-- Developer & Code Exports -->
      <div class="py-1">
        <button
          v-if="hasUiFrames"
          type="button"
          class="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          :disabled="isExporting"
          @click.stop="handleExport('ui_code')"
        >
          <div class="flex items-center gap-2.5">
            <Check v-if="copySuccess" class="h-4 w-4 text-emerald-600" />
            <Code v-else class="h-4 w-4 text-pink-500" />
            <span :class="copySuccess ? 'text-emerald-700 font-semibold' : ''">
              {{ copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Kode UI (Vue/Tailwind)' }}
            </span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-pink-50 text-pink-600 font-semibold rounded">
            Vue
          </span>
        </button>

        <button
          v-if="!hasUiFrames"
          type="button"
          class="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          :disabled="isExporting"
          @click.stop="handleExport('mermaid')"
        >
          <div class="flex items-center gap-2.5">
            <Check v-if="copySuccess" class="h-4 w-4 text-emerald-600" />
            <Code v-else class="h-4 w-4 text-violet-500" />
            <span :class="copySuccess ? 'text-emerald-700 font-semibold' : ''">
              {{ copySuccess ? 'Tersalin ke Clipboard!' : 'Salin Kode Mermaid' }}
            </span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-violet-50 text-violet-600 font-semibold rounded">
            Notion
          </span>
        </button>

        <button
          type="button"
          class="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          :disabled="isExporting"
          @click.stop="handleExport('json')"
        >
          <div class="flex items-center gap-2.5">
            <FileJson class="h-4 w-4 text-amber-500" />
            <span>Download Raw JSON</span>
          </div>
          <span class="text-[10px] font-mono px-1.5 py-0.2 bg-amber-50 text-amber-600 font-semibold rounded">
            Data
          </span>
        </button>
      </div>
    </div>

    <!-- Error Toast -->
    <p
      v-if="errorMessage"
      class="absolute right-0 top-full mt-2 w-56 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-600 shadow-xl z-50"
    >
      {{ errorMessage }}
    </p>

    <!-- Success Toast for Mermaid copy -->
    <div
      v-if="copySuccess && !isOpen"
      class="absolute right-0 top-full mt-2 whitespace-nowrap flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs font-medium text-emerald-700 shadow-xl animate-fade-in z-50"
    >
      <Check class="w-3.5 h-3.5 text-emerald-600" />
      <span>Kode Mermaid disalin! Tempel di GitHub atau Notion.</span>
    </div>
  </div>
</template>
