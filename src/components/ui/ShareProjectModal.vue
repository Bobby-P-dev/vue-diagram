<script setup>
import { ref, computed, watch } from 'vue'
import {
  Share2,
  X,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Loader2,
  Trash2,
  Eye,
  MessageSquare,
  Workflow,
  Sparkles,
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

const isLoading = ref(false)
const isRevoking = ref(false)
const shareData = ref(null)
const copied = ref(false)
let copyTimer = null

const activeProject = computed(() => store.activeProject.value)
const messageCount = computed(() => (store.chatHistory.value || []).length)
const nodeCount = computed(() => (store.nodes.value || []).length)

const shareUrl = computed(() => {
  if (!shareData.value?.share_token) return ''
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}/?share=${shareData.value.share_token}`
})

async function fetchStatus() {
  if (!activeProject.value?.id) return
  isLoading.value = true
  try {
    const res = await store.getShareStatus(activeProject.value.id)
    if (res && res.is_active) {
      shareData.value = res
    } else {
      shareData.value = null
    }
  } catch (err) {
    shareData.value = null
  } finally {
    isLoading.value = false
  }
}

async function handleCreateShare() {
  if (!activeProject.value?.id || isLoading.value) return
  isLoading.value = true
  try {
    const res = await store.shareProject(activeProject.value.id)
    shareData.value = res
  } catch (err) {
    // handled by store
  } finally {
    isLoading.value = false
  }
}

async function handleRevokeShare() {
  if (!activeProject.value?.id || isRevoking.value) return
  isRevoking.value = true
  try {
    await store.revokeShare(activeProject.value.id)
    shareData.value = null
  } catch (err) {
    // handled by store
  } finally {
    isRevoking.value = false
  }
}

async function handleCopy() {
  if (!shareUrl.value) return
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(shareUrl.value)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = shareUrl.value
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

function handleOpenPreview() {
  if (!shareUrl.value) return
  window.open(shareUrl.value, '_blank')
}

function handleClose() {
  copied.value = false
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      copied.value = false
      fetchStatus()
    }
  },
  { immediate: true },
)
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
    @click.self="handleClose"
  >
    <div
      class="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up"
    >
      <!-- Header -->
      <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
            <Share2 class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-snug">Bagikan Proyek & Chat</h3>
            <p class="text-[11px] text-slate-500">Buat tautan publik untuk membagikan obrolan AI dan kanvas</p>
          </div>
        </div>
        <button
          type="button"
          @click="handleClose"
          class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
          title="Tutup Modal"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Body -->
      <div class="p-5 space-y-4">
        <!-- Project Summary Card -->
        <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 flex flex-col gap-2">
          <div class="flex items-center justify-between gap-2">
            <span class="font-bold text-xs text-slate-800 truncate">
              {{ activeProject?.title || 'Untitled Project' }}
            </span>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
              {{ activeProject?.diagram_type?.toUpperCase() || 'DIAGRAM' }}
            </span>
          </div>

          <div class="flex items-center gap-4 text-[11px] text-slate-500">
            <div class="flex items-center gap-1.5">
              <MessageSquare class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ messageCount }} Pesan Chat</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Workflow class="w-3.5 h-3.5 text-slate-400" />
              <span>{{ nodeCount }} Elemen Diagram</span>
            </div>
            <div v-if="shareData?.view_count !== undefined" class="flex items-center gap-1.5 ml-auto text-emerald-600 font-medium">
              <Eye class="w-3.5 h-3.5" />
              <span>{{ shareData.view_count }}x Dilihat</span>
            </div>
          </div>
        </div>

        <!-- Share Link State -->
        <div v-if="isLoading" class="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
          <Loader2 class="w-6 h-6 animate-spin text-indigo-600" />
          <span class="text-xs font-medium">Memeriksa status tautan...</span>
        </div>

        <div v-else-if="shareData?.is_active" class="space-y-3">
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Tautan Publik
            </label>
            <div class="flex items-center gap-2">
              <div class="flex-1 relative">
                <input
                  type="text"
                  readonly
                  :value="shareUrl"
                  class="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-700 font-mono select-all focus:outline-hidden focus:border-indigo-500"
                  @click="$event.target.select()"
                />
              </div>

              <button
                type="button"
                @click="handleCopy"
                class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs flex-shrink-0"
                :class="
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white'
                "
              >
                <Check v-if="copied" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copied ? 'Tersalin!' : 'Salin Link' }}</span>
              </button>

              <button
                type="button"
                @click="handleOpenPreview"
                class="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
                title="Buka Pratinjau di Tab Baru"
              >
                <ExternalLink class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Feature Description -->
          <div class="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex items-start gap-2.5 text-xs text-indigo-950">
            <ShieldCheck class="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
            <div class="space-y-0.5">
              <p class="font-semibold">Siapapun yang memiliki link dapat melihat:</p>
              <p class="text-[11px] text-indigo-800/80 leading-relaxed">
                Riwayat pesan percakapan dengan AI dan kanvas diagram dalam mode <strong>interaktif (read-only)</strong>. Penerima tautan juga dapat mengunduh gambar PNG atau menduplikasi proyek ke workspace mereka sendiri.
              </p>
            </div>
          </div>

          <!-- Revoke / Disable Link -->
          <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span class="text-xs text-slate-400">Tautan ini aktif dan dapat diakses publik.</span>
            <button
              type="button"
              @click="handleRevokeShare"
              :disabled="isRevoking"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <Loader2 v-if="isRevoking" class="w-3.5 h-3.5 animate-spin" />
              <Trash2 v-else class="w-3.5 h-3.5" />
              <span>Nonaktifkan Tautan</span>
            </button>
          </div>
        </div>

        <div v-else class="py-6 flex flex-col items-center justify-center text-center space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <Sparkles class="w-6 h-6 text-indigo-600" />
          </div>
          <div class="max-w-sm space-y-1">
            <h4 class="text-sm font-bold text-slate-800">Tautan Berbagi Belum Aktif</h4>
            <p class="text-xs text-slate-500 leading-relaxed">
              Buat tautan publik agar rekan tim atau klien dapat meninjau alur obrolan AI dan kanvas diagram ini secara online.
            </p>
          </div>
          <button
            type="button"
            @click="handleCreateShare"
            :disabled="isLoading"
            class="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all active:scale-98"
          >
            <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
            <Share2 v-else class="w-3.5 h-3.5" />
            <span>Buat Tautan Publik</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
