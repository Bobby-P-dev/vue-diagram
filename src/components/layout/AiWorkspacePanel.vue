<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  Bot,
  PanelRightClose,
  MessageSquarePlus,
  Send,
  Sparkles,
  CheckCircle2,
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

const emit = defineEmits(['toggle', 'inspectTokens', 'selectFoundation'])

const store = useDiagramStore()
const promptInput = ref('')
const selectedScope = ref('screen') // 'screen' | 'section' | 'foundation'
const chatMessagesContainer = ref(null)

const messages = computed(() => store.chatHistory.value || [])
const isGenerating = computed(() => store.isGenerating.value)

const activeFoundation = computed(() => {
  return (
    DESIGN_FOUNDATIONS.find((f) => f.id === props.activeFoundationId) ||
    DESIGN_FOUNDATIONS[0]
  )
})

const isUiMode = computed(() => {
  return (
    store.activeProject.value?.project_mode === 'ui_design' ||
    store.activeProject.value?.diagram_type === 'ui_design'
  )
})

function scrollToBottom() {
  nextTick(() => {
    if (chatMessagesContainer.value) {
      chatMessagesContainer.value.scrollTop = chatMessagesContainer.value.scrollHeight
    }
  })
}

watch(
  () => [messages.value.length, isGenerating.value],
  () => {
    scrollToBottom()
  },
  { deep: true }
)

watch(
  () => store.activeProject.value?.id,
  () => {
    promptInput.value = ''
  }
)

async function handleSendMessage(customPrompt = null) {
  const text = (customPrompt || promptInput.value).trim()
  if (!text || isGenerating.value) return

  if (!customPrompt) {
    promptInput.value = ''
  }

  // Prepend foundation context if needed
  const contextPrefix = isUiMode.value
    ? `[Foundation: ${activeFoundation.value.name}] `
    : ''
  
  await store.sendFollowUpChat(contextPrefix + text)
}

function handleKeyDown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSendMessage()
  }
}
</script>

<template>
  <div
    :class="[
      'h-full flex flex-col bg-white border-l border-slate-200/90 shadow-xl transition-all duration-300 ease-in-out z-20 flex-shrink-0 text-slate-800',
      isOpen ? 'w-[380px]' : 'w-0 overflow-hidden'
    ]"
  >
    <!-- Header -->
    <div class="px-4 py-3 border-b border-slate-200/90 flex items-center justify-between bg-slate-50/80 backdrop-blur-xs">
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
            <span>Online</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="emit('toggle')"
          class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          title="Collapse Panel"
        >
          <PanelRightClose class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div
      ref="chatMessagesContainer"
      class="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/40"
    >
      <div
        v-if="messages.length === 0 && !isGenerating"
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <div class="w-10 h-10 mb-2 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100/60 shadow-xs">
          <MessageSquarePlus class="w-5 h-5 text-indigo-600" />
        </div>
        <p class="text-xs font-semibold text-slate-700">RancangLab Assistant Siap</p>
        <p class="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
          Ketik prompt untuk merevisi layout, menambah section, mengubah warna, atau mengekspor kode.
        </p>
      </div>

      <!-- Messages Stream -->
      <template v-for="(msg, idx) in messages" :key="msg.id || idx">
        <!-- User Bubble -->
        <div v-if="msg.role === 'user'" class="flex flex-col items-end gap-1">
          <div class="max-w-[85%] rounded-xl rounded-tr-xs bg-indigo-600 px-3.5 py-2 text-white shadow-xs">
            <p class="text-xs leading-relaxed whitespace-pre-wrap">{{ msg.content }}</p>
          </div>
          <span class="text-[9px] text-slate-400 pr-1">Anda</span>
        </div>

        <!-- Assistant Bubble -->
        <div v-else class="flex flex-col items-start gap-1">
          <div class="max-w-[90%] rounded-xl rounded-tl-xs bg-white border border-slate-200 px-3.5 py-2.5 text-slate-800 shadow-xs">
            <div class="flex items-center gap-1.5 mb-1 text-[10px] text-indigo-600 font-semibold">
              <Sparkles class="w-3 h-3 text-indigo-600" />
              <span>RancangLab AI</span>
            </div>
            <p class="text-xs leading-relaxed whitespace-pre-wrap text-slate-700">{{ msg.content }}</p>
          </div>
          <span class="text-[9px] text-slate-400 pl-1">RancangLab AI</span>
        </div>
      </template>

      <!-- Generating Live Progress Indicator -->
      <div v-if="isGenerating" class="flex flex-col items-start gap-1">
        <div class="rounded-xl rounded-tl-xs bg-white border border-indigo-200/90 px-3.5 py-3 shadow-xs space-y-2 w-[85%]">
          <div class="flex items-center gap-2 text-indigo-600 text-xs font-semibold">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
            </span>
            <span>AI Reasoning & Synthesizing...</span>
          </div>
          <div class="space-y-1.5 text-[10px] text-slate-500 font-mono">
            <div class="flex items-center gap-1.5 text-indigo-700">
              <CheckCircle2 class="w-3 h-3 text-indigo-600" />
              <span>Checking {{ activeFoundation.name }} tokens</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-600 animate-pulse">
              <span class="w-3 h-3 rounded-full border border-indigo-500 border-t-transparent animate-spin"></span>
              <span>Building pixel-perfect Tailwind markup</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Prompt Input Area -->
    <div class="p-3 border-t border-slate-200 bg-white">
      <!-- Context Scope Selector -->
      <div class="flex items-center justify-between mb-2 text-[10px] text-slate-500">
        <div class="flex items-center gap-1">
          <span class="font-medium text-slate-600">Scope:</span>
          <button
            type="button"
            @click="selectedScope = 'screen'"
            class="px-1.5 py-0.5 rounded transition-colors"
            :class="selectedScope === 'screen' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-400 hover:text-slate-600'"
          >
            Entire Screen
          </button>
          <span>•</span>
          <button
            type="button"
            @click="selectedScope = 'section'"
            class="px-1.5 py-0.5 rounded transition-colors"
            :class="selectedScope === 'section' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-400 hover:text-slate-600'"
          >
            Section
          </button>
        </div>
        <span class="font-mono text-slate-400">Shift+Enter new line</span>
      </div>

      <!-- Textarea Box -->
      <div class="relative rounded-lg border border-slate-200 bg-slate-50/60 focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
        <textarea
          v-model="promptInput"
          @keydown="handleKeyDown"
          :placeholder="
            isUiMode
              ? 'Tulis prompt bebas untuk UI atau section baru...'
              : 'Ketik revisi diagram...'
          "
          rows="3"
          class="w-full resize-none bg-transparent px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden"
          :disabled="isGenerating"
        ></textarea>

        <div class="flex items-center justify-between px-2.5 py-1.5 border-t border-slate-100 bg-white rounded-b-lg">
          <span class="text-[10px] text-slate-400 font-mono">
            {{ promptInput.length }} chars
          </span>

          <button
            type="button"
            @click="handleSendMessage()"
            :disabled="!promptInput.trim() || isGenerating"
            class="flex items-center gap-1 px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold transition-all disabled:opacity-40 shadow-xs"
          >
            <Send class="w-3 h-3" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
