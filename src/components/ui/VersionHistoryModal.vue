<script setup>
import { computed } from 'vue'
import {
  History,
  RotateCcw,
  Clock,
  X,
  Layers,
  Sparkles,
  ChevronRight,
  CheckCircle2,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const store = useDiagramStore()

const versions = computed(() => store.projectVersions.value || [])
const activeProject = computed(() => store.activeProject.value)
const isGenerating = computed(() => store.isGenerating.value)

function formatDate(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

async function handleRollback(versionId) {
  if (!confirm('Apakah Anda yakin ingin mengembalikan diagram ke versi ini?')) {
    return
  }
  const success = await store.rollbackToVersion(versionId)
  if (success) {
    emit('close')
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      @click="emit('close')"
    ></div>

    <!-- Modal Card -->
    <div
      class="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10 text-slate-100"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <History class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-white flex items-center gap-2">
              <span>Riwayat Versi Diagram</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {{ versions.length }} Versi
              </span>
            </h3>
            <p class="text-xs text-slate-400 mt-0.5 truncate max-w-sm">
              {{ activeProject?.title || 'Diagram Saat Ini' }}
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Versions List -->
      <div class="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
        <div v-if="store.isLoadingVersions.value" class="py-12 text-center text-slate-400 text-xs">
          <div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Memuat riwayat versi...
        </div>

        <div v-else-if="versions.length === 0" class="py-12 text-center text-slate-500 text-xs">
          <History class="w-8 h-8 text-slate-600 mb-2 mx-auto opacity-50" />
          <p>Belum ada riwayat snapshot untuk proyek ini.</p>
        </div>

        <div
          v-else
          v-for="(ver, index) in versions"
          :key="ver.id"
          class="p-4 rounded-xl border transition-all relative overflow-hidden"
          :class="[
            index === 0
              ? 'bg-slate-800/80 border-indigo-500/50 shadow-md shadow-indigo-950/20'
              : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/60'
          ]"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span
                  class="font-extrabold text-xs px-2 py-0.5 rounded-md"
                  :class="index === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'"
                >
                  Versi {{ ver.version_number }}
                </span>
                <span v-if="index === 0" class="text-[10px] font-semibold text-indigo-400 flex items-center gap-1">
                  <CheckCircle2 class="w-3 h-3" />
                  Versi Aktif
                </span>
                <span class="text-[11px] text-slate-400 flex items-center gap-1 ml-auto">
                  <Clock class="w-3 h-3" />
                  {{ formatDate(ver.created_at) }}
                </span>
              </div>

              <p class="text-xs text-slate-200 leading-relaxed line-clamp-2 mt-1.5 font-medium">
                {{ ver.change_summary || 'Perubahan diagram oleh AI' }}
              </p>
            </div>

            <!-- Rollback Button (only for previous versions) -->
            <button
              v-if="index !== 0"
              type="button"
              :disabled="isGenerating"
              @click="handleRollback(ver.id)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-amber-600 active:bg-amber-700 text-slate-200 hover:text-white transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 mt-1"
              title="Kembalikan diagram ke versi ini"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Rollback</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <span>Setiap prompt dan revisi AI otomatis disimpan sebagai snapshot aman.</span>
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors font-medium"
        >
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>
