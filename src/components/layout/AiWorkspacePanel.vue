<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import {
  Bot,
  PanelRightClose,
  MessageSquarePlus,
  Send,
  Sparkles,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Layers,
  Search,
  X,
  Palette,
  Workflow,
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
const asyncJob = store.asyncJob
const promptInput = ref('')
const selectedScope = ref('screen') // 'screen' | 'section' | 'foundation'
const chatMessagesContainer = ref(null)

// Initial Generation Mode on Empty Canvas (UI Design vs Diagram)
const initialMode = ref('ui_design') // 'ui_design' | 'diagram'
const initialDevice = ref('web')
const initialDiagramType = ref('flowchart')

const messages = computed(() => store.chatHistory.value || [])
const isGenerating = computed(() => store.isGenerating.value)
const isChatGenerating = computed(() => store.isChatGenerating.value)

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
  () => [messages.value.length, isChatGenerating.value],
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

// Auto-switch scope when element selection changes
watch(
  () => store.selectedTarget?.value,
  (target) => {
    if (target?.type === 'section') {
      selectedScope.value = 'section'
    } else if (target?.id) {
      selectedScope.value = 'component'
    } else if (!target) {
      selectedScope.value = 'screen'
    }
  },
  { immediate: true }
)

async function handleSendMessage(customPrompt = null) {
  const text = (customPrompt || promptInput.value).trim()
  if (!text || isGenerating.value) return

  if (!customPrompt) {
    promptInput.value = ''
  }

  // If no project is active yet (empty canvas), initiate a new project!
  if (!store.activeProject.value?.id) {
    if (initialMode.value === 'ui_design') {
      await store.startNewUiDesignProject({
        prompt: text,
        device: initialDevice.value,
      })
    } else {
      await store.startNewProject(text, initialDiagramType.value)
    }
    return
  }

  const targetId = selectedScope.value === 'screen' ? null : store.selectedComponentId.value
  await store.sendFollowUpChat(text, targetId)
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
        v-if="messages.length === 0 && !isChatGenerating"
        class="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400"
      >
        <div class="w-10 h-10 mb-2 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center border border-indigo-100/60 shadow-xs">
          <MessageSquarePlus class="w-5 h-5 text-indigo-600" />
        </div>
        <p class="text-xs font-semibold text-slate-700">RancangLab Assistant Siap</p>
        <p class="text-[11px] text-slate-400 mt-1 max-w-[240px] leading-relaxed">
          {{ !store.activeProject.value?.id
            ? 'Ketik ide antarmuka atau alur diagram di bawah untuk mulai membuat proyek baru dengan AI.'
            : 'Ketik prompt untuk merevisi layout, menambah section, mengubah warna, atau mengekspor kode.'
          }}
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

      <!-- Generating Live Progress Indicator (Shown ONLY when user sends a chat message) -->
      <div v-if="isChatGenerating" class="flex flex-col items-start gap-1">
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
              <span>Analyzing design requirements & intent</span>
            </div>
            <div class="flex items-center gap-1.5 text-slate-600 animate-pulse">
              <span class="w-3 h-3 rounded-full border border-indigo-500 border-t-transparent animate-spin"></span>
              <span>Generating bespoke layout and Tailwind markup</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Prompt Input Area -->
    <div class="p-3 border-t border-slate-200 bg-white">
      <!-- Target Component Indicator (If element is selected on canvas) -->
      <div
        v-if="store.selectedComponentId.value"
        class="mb-2 px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center justify-between shadow-2xs"
      >
        <div class="flex items-center gap-2 min-w-0">
          <span class="w-2 h-2 rounded-full bg-indigo-600 animate-pulse flex-shrink-0"></span>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
              <span>Target ({{ store.selectedTarget.value?.type || 'component' }}):</span>
              <span class="font-mono text-slate-900 font-bold truncate">{{ store.selectedComponentId.value }}</span>
            </div>
            <p v-if="store.selectionContext.value?.text" class="text-[10px] text-slate-500 italic truncate mt-0.5">
              "{{ store.selectionContext.value.text }}"
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="store.clearSelectedTarget()"
          class="p-0.5 rounded text-indigo-400 hover:text-indigo-700 hover:bg-indigo-100 transition-colors flex-shrink-0"
          title="Batal target komponen"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Initial Generation Mode Switcher (When Canvas is Empty) -->
      <div v-if="!store.activeProject.value?.id" class="flex items-center justify-between mb-2 text-xs">
        <div class="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold text-slate-600">
          <button
            type="button"
            @click="initialMode = 'ui_design'"
            :class="[
              'px-2 py-0.5 rounded transition-all flex items-center gap-1',
              initialMode === 'ui_design' ? 'bg-white font-bold text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
            ]"
          >
            <Palette class="w-3 h-3" />
            <span>UI Design</span>
          </button>
          <button
            type="button"
            @click="initialMode = 'diagram'"
            :class="[
              'px-2 py-0.5 rounded transition-all flex items-center gap-1',
              initialMode === 'diagram' ? 'bg-white font-bold text-indigo-700 shadow-2xs' : 'hover:text-slate-900'
            ]"
          >
            <Workflow class="w-3 h-3" />
            <span>Diagram</span>
          </button>
        </div>

        <div v-if="initialMode === 'ui_design'" class="flex items-center gap-1 text-[10px] font-medium text-slate-500">
          <button
            type="button"
            @click="initialDevice = 'web'"
            :class="['px-1.5 py-0.5 rounded transition-all', initialDevice === 'web' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600']"
          >
            Web
          </button>
          <button
            type="button"
            @click="initialDevice = 'mobile'"
            :class="['px-1.5 py-0.5 rounded transition-all', initialDevice === 'mobile' ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-400 hover:text-slate-600']"
          >
            Mobile
          </button>
        </div>

        <div v-else>
          <select
            v-model="initialDiagramType"
            class="px-1.5 py-0.5 text-[10px] font-semibold bg-slate-50 border border-slate-200 rounded text-slate-700 focus:outline-hidden cursor-pointer"
          >
            <option value="flowchart">Flowchart</option>
            <option value="architecture">Architecture</option>
            <option value="sequence">Sequence</option>
            <option value="erd">ERD / Database</option>
            <option value="class">UML Class</option>
            <option value="state">State Machine</option>
          </select>
        </div>
      </div>

      <!-- Context Scope Selector (When Active Project Exists) -->
      <div v-else class="flex items-center justify-between mb-2 text-[10px] text-slate-500">
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
          <span>•</span>
          <button
            type="button"
            @click="selectedScope = 'component'"
            class="px-1.5 py-0.5 rounded transition-colors"
            :class="selectedScope === 'component' ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-400 hover:text-slate-600'"
          >
            Component
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
            !store.activeProject.value?.id
              ? (initialMode === 'ui_design' ? 'Ketik ide antarmuka untuk generate UI baru...' : 'Ketik alur sistem untuk generate diagram baru...')
              : (isUiMode ? 'Tulis prompt bebas untuk UI atau section baru...' : 'Ketik revisi diagram...')
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
