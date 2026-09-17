<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  Bot,
  PanelRightClose,
  MessageSquarePlus,
  Crosshair,
  Send,
  X,
  Sparkles,
  Target,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['toggle'])

const store = useDiagramStore()
const promptInput = ref('')
const chatMessagesContainer = ref(null)

const messages = computed(() => store.chatHistory.value || [])
const isGenerating = computed(() => store.isGenerating.value)
const isChatGenerating = computed(() => store.isChatGenerating.value)

const selectedTarget = computed(() => store.selectedTarget?.value)
const selectionContext = computed(() => store.selectionContext?.value)

const selectedNodesDetails = computed(() => {
  return store.selectedNodes.value.map((id) => {
    const node = store.nodes.value.find((n) => n.id === id)
    return {
      id,
      label: node?.data?.label || id,
    }
  })
})

const chatPlaceholder = computed(() => {
  const isUi =
    store.activeProject.value?.project_mode === 'ui_design' ||
    store.activeProject.value?.diagram_type === 'ui_design'
  if (isUi) {
    if (selectedTarget.value) {
      return `Minta AI ubah ${selectedTarget.value.type} '${selectedTarget.value.id}'... (hanya target ini yang diubah)`
    }
    return "Minta AI ubah UI... (klik elemen pada preview untuk edit targeted)"
  }
  return "Ketik revisi diagram... (misal: 'Tambahkan validasi', 'Ganti alur ke DB')"
})

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
    }
  })
}

watch(
  () => [messages.value.length, isChatGenerating.value],
  () => {
    scrollToBottom()
  },
  { deep: true },
)

// Pastikan input chat bersih saat berpindah project
watch(
  () => store.activeProject.value?.id,
  () => {
    promptInput.value = ''
  },
)

function removeTargetNode(id) {
  store.toggleNodeSelection(id)
}

async function handleSendMessage() {
  const text = promptInput.value.trim()
  if (!text || isGenerating.value) return

  promptInput.value = ''
  await store.sendFollowUpChat(text)
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}

function formatTime(dateString) {
  if (!dateString) return ''
  try {
    const d = new Date(dateString)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch (e) {
    return ''
  }
}
</script>

<template>
  <div
    :class="[
      'h-full flex flex-col bg-white border-l border-slate-200 shadow-xl transition-all duration-300 ease-in-out z-20 flex-shrink-0',
      isOpen ? 'w-[360px]' : 'w-0 overflow-hidden'
    ]"
  >
    <!-- Chat Header -->
    <div class="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
      <div class="flex items-center gap-2">
        <div class="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
          <Bot class="w-3.5 h-3.5" />
        </div>
        <h2 class="text-sm font-semibold text-slate-800">Chat & Diagram Assistant</h2>
      </div>

      <button
        type="button"
        @click="emit('toggle')"
        class="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-md transition-colors"
        title="Toggle Chat Panel"
      >
        <PanelRightClose class="w-4 h-4" />
      </button>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div
      ref="chatMessagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50"
    >
      <div
        v-if="messages.length === 0 && !isChatGenerating"
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <div class="w-12 h-12 mb-3 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shadow-inner border border-indigo-100/60">
          <MessageSquarePlus class="w-6 h-6 text-indigo-500" />
        </div>
        <p class="text-sm font-medium text-slate-700">Project Conversation</p>
        <p class="text-xs text-slate-400 mt-1 max-w-[220px]">
          Ask revisions or click nodes on the canvas to edit specific steps!
        </p>
      </div>

      <!-- Message Bubbles -->
      <div
        v-for="msg in messages"
        :key="msg.id || msg.created_at"
        :class="[
          'flex flex-col',
          msg.role === 'user' ? 'items-end' : 'items-start'
        ]"
      >
        <!-- Target Badge if present in user message -->
        <div
          v-if="msg.role === 'user' && msg.target_node_ids && (Array.isArray(msg.target_node_ids) ? msg.target_node_ids.length : true)"
          class="mb-1 text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1"
        >
          <Crosshair class="w-3 h-3 text-indigo-600" />
          <span>Focused on:</span>
          <span class="font-semibold">{{ Array.isArray(msg.target_node_ids) ? msg.target_node_ids.join(', ') : msg.target_node_ids }}</span>
        </div>

        <div
          :class="[
            'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm shadow-sm leading-relaxed',
            msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-tr-none'
              : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-none'
          ]"
        >
          <div class="whitespace-pre-wrap break-words">{{ msg.content }}</div>
        </div>

        <span class="text-[10px] text-slate-400 mt-1 px-1">
          {{ formatTime(msg.created_at) }}
        </span>
      </div>

      <!-- Elegant Loading Skeleton for AI Response -->
      <div v-if="isChatGenerating" class="flex flex-col items-start animate-fade-in">
        <div class="max-w-[92%] bg-gradient-to-br from-white via-slate-50 to-indigo-50/30 rounded-2xl rounded-tl-none p-4 border border-indigo-100 shadow-sm space-y-3 relative overflow-hidden">
          <!-- Top Shimmer Bar -->
          <div class="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 via-pink-500 to-cyan-400 animate-pulse"></div>

          <div class="flex items-center gap-2.5">
            <div class="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles class="w-3.5 h-3.5 animate-spin" />
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-xs font-semibold text-slate-800 block">
                {{ store.activeProject.value?.project_mode === 'ui_design' ? 'AI UI Designer' : 'AI Architect' }}
              </span>
              <span class="text-[11px] text-indigo-600 font-medium">Sedang memproses & menyusun visual...</span>
            </div>
            <!-- Waveform bars -->
            <div class="flex items-center gap-1">
              <span class="w-1 h-3 bg-indigo-500 rounded-full animate-bounce"></span>
              <span class="w-1 h-4 bg-purple-500 rounded-full animate-bounce [animation-delay:0.15s]"></span>
              <span class="w-1 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              <span class="w-1 h-3.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:0.45s]"></span>
            </div>
          </div>

          <div class="space-y-1.5 pt-1">
            <div class="h-2.5 bg-gradient-to-r from-indigo-100 via-slate-100 to-indigo-50 rounded-full w-full animate-pulse"></div>
            <div class="h-2 bg-gradient-to-r from-indigo-100 via-slate-100 to-indigo-50 rounded-full w-4/5 animate-pulse [animation-delay:0.2s]"></div>
            <div class="h-2 bg-gradient-to-r from-indigo-100 via-slate-100 to-indigo-50 rounded-full w-2/3 animate-pulse [animation-delay:0.4s]"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Targeted Nodes Badge Container (Above Input Box) -->
    <div
      v-if="selectedNodesDetails.length > 0"
      class="px-4 py-2 bg-indigo-50/80 border-t border-indigo-100 flex flex-wrap items-center gap-1.5"
    >
      <span class="text-xs font-semibold text-indigo-700 flex items-center gap-1">
        <Crosshair class="w-3.5 h-3.5 text-indigo-700" />
        <span>Target:</span>
      </span>

      <div
        v-for="item in selectedNodesDetails"
        :key="item.id"
        class="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-800 text-xs px-2 py-0.5 rounded-full shadow-xs"
      >
        <span class="max-w-[140px] truncate font-medium">{{ item.label }}</span>
        <button
          type="button"
          @click="removeTargetNode(item.id)"
          class="text-indigo-400 hover:text-red-500 font-bold ml-0.5 text-xs transition-colors p-0.5 rounded hover:bg-red-50"
          title="Remove target"
        >
          <X class="w-2.5 h-2.5" />
        </button>
      </div>

      <button
        type="button"
        @click="store.clearNodeSelection"
        class="text-[11px] text-indigo-500 hover:text-indigo-700 ml-auto underline"
      >
        Clear all
      </button>
    </div>

    <!-- Targeted UI Element / Section Badge Container (Above Input Box) -->
    <div
      v-if="selectedTarget"
      class="px-3.5 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between gap-2 transition-all shadow-xs"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse flex-shrink-0"></span>
        <span class="text-xs font-semibold text-amber-800 flex items-center gap-1 flex-shrink-0">
          <Target class="w-3.5 h-3.5 text-amber-600" />
          <span>Target:</span>
        </span>
        <span class="inline-flex items-center gap-1 bg-white border border-amber-300 text-amber-900 text-xs px-2 py-0.5 rounded-md font-mono font-medium shadow-xs truncate">
          {{ selectedTarget.id }}
          <span class="text-[10px] text-amber-600 uppercase font-sans font-semibold">({{ selectedTarget.type }})</span>
        </span>
        <span v-if="selectionContext?.text" class="text-[11px] text-slate-500 truncate max-w-[110px] italic hidden sm:inline">
          "{{ selectionContext.text }}"
        </span>
      </div>

      <button
        type="button"
        @click="store.clearSelectedTarget"
        class="text-amber-700 hover:text-red-600 text-xs flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-amber-100 transition-colors flex-shrink-0 font-medium"
        title="Batalkan target (edit seluruh halaman / global)"
      >
        <X class="w-3 h-3" />
        <span class="text-[10px]">Batal</span>
      </button>
    </div>

    <!-- Sticky Input Box -->
    <div class="p-3 border-t border-slate-200 bg-white">
      <form @submit.prevent="handleSendMessage" class="relative flex items-end gap-2">
        <textarea
          v-model="promptInput"
          @keydown="handleKeyDown"
          rows="2"
          :disabled="isGenerating"
          :placeholder="chatPlaceholder"
          class="flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-slate-400 disabled:bg-slate-100 disabled:opacity-60 transition-all shadow-inner"
        ></textarea>

        <button
          type="submit"
          :disabled="!promptInput.trim() || isGenerating"
          class="h-10 w-10 flex items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
          title="Send message"
        >
          <Send class="w-4 h-4" />
        </button>
      </form>
      <p class="text-[10px] text-slate-400 mt-1.5 text-center">
        Press <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[9px]">Enter</kbd> to send, <kbd class="px-1 py-0.5 bg-slate-100 border border-slate-300 rounded text-[9px]">Shift+Enter</kbd> for newline
      </p>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 4px;
}
</style>
