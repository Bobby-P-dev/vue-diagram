<script setup>
import { ref, computed, watch } from 'vue'
import {
  Sparkles,
  BookOpen,
  X,
  Trash2,
  Workflow,
  Network,
  Database,
  Boxes,
  RefreshCw,
  Zap,
  Brain,
  Layers,
  Loader2,
  PlusCircle,
  Search,
  LayoutTemplate,
  Smartphone,
  Monitor,
  Globe,
  Palette,
  Check,
  ChevronDown,
  ChevronUp,
  FilePlus,
  Sliders,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'
import { DESIGN_FOUNDATIONS } from '../../assets/foundations.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'create', 'createBlank'])

const store = useDiagramStore()

// Tab state: 'ui_design' | 'diagram' | 'templates'
const activeTab = ref('ui_design')

// UI Design State (Clean & Essential)
const uiPrompt = ref('')
const uiDevice = ref('web') // 'web' | 'mobile' | 'desktop'
const uiThemeMode = ref('dark') // 'dark' | 'light'
const uiFoundation = ref('ramp')
const uiAccentColor = ref('#6366f1')
const showAdvanced = ref(false)

// Diagram State
const prompt = ref('')
const diagramType = ref('flowchart')

// Template Gallery State
const templateSearch = ref('')
const selectedCategory = ref('All')
const templateTypeFilter = ref('all') // 'all' | 'diagram' | 'ui_design'

const UI_DEVICES = [
  {
    value: 'web',
    label: 'Web App',
    resolution: '1024 × 720',
    icon: Globe,
    desc: 'Widescreen browser SaaS',
  },
  {
    value: 'mobile',
    label: 'Mobile App',
    resolution: '375 × 812',
    icon: Smartphone,
    desc: 'Smartphone Dynamic Island',
  },
  {
    value: 'desktop',
    label: 'Desktop App',
    resolution: '1100 × 740',
    icon: Monitor,
    desc: 'Dense workspace dashboard',
  },
]

const QUICK_ACCENT_COLORS = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#a855f7', // Violet
  '#3b82f6', // Blue
  '#0f172a', // Obsidian Dark
]

const QUICK_CHIPS = [
  { icon: '💼', text: 'CRM pipeline dengan card prospek, filter status, dan deal table' },
  { icon: '☕', text: 'POS kasir kafe resto dengan grid menu dan struk pesanan QRIS' },
  { icon: '⚽', text: 'Platform booking lapangan futsal dengan slot jadwal sewa dan DP' },
  { icon: '🩺', text: 'Sistem klinik dengan jadwal dokter spesialis dan antrian pasien' },
]

const DIAGRAM_TYPES = [
  {
    value: 'flowchart',
    label: 'Flowchart',
    icon: Workflow,
    iconColor: 'text-blue-500',
    description: 'Alur kerja, percabangan logika & prosedur',
    placeholder: 'Contoh: Alur checkout toko online dengan validasi stok, payment gateway, dan notifikasi email',
  },
  {
    value: 'architecture',
    label: 'Architecture',
    icon: Network,
    iconColor: 'text-indigo-500',
    description: 'Cloud microservices, gateway, database & cache',
    placeholder: 'Contoh: Arsitektur microservices e-commerce dengan API Gateway, Redis cache, dan PostgreSQL',
  },
  {
    value: 'erd',
    label: 'ERD / Database',
    icon: Database,
    iconColor: 'text-emerald-500',
    description: 'Tabel database relasional, field PK/FK & relasi',
    placeholder: 'Contoh: Skema database sistem rumah sakit: Pasien, Dokter, Poliklinik, dan Rekam Medis',
  },
  {
    value: 'class',
    label: 'UML Class',
    icon: Boxes,
    iconColor: 'text-violet-500',
    description: 'Struktur kelas OOP, atribut, method & relasi',
    placeholder: 'Contoh: Class diagram reservasi hotel: User, Room, Reservation, Payment, Invoice',
  },
  {
    value: 'state',
    label: 'State Machine',
    icon: RefreshCw,
    iconColor: 'text-amber-500',
    description: 'Siklus hidup (lifecycle) & transisi status',
    placeholder: 'Contoh: State lifecycle pesanan: Draft -> Menunggu Pembayaran -> Diproses -> Dikirim -> Selesai',
  },
  {
    value: 'pipeline',
    label: 'Data Pipeline',
    icon: Zap,
    iconColor: 'text-cyan-500',
    description: 'Aliran data ETL, stream processing & sink',
    placeholder: 'Contoh: Data pipeline analitik: Event Source -> Kafka -> Flink -> ClickHouse -> Dashboard',
  },
  {
    value: 'mindmap',
    label: 'Mind Map',
    icon: Brain,
    iconColor: 'text-rose-500',
    description: 'Peta hierarki pemikiran & topik',
    placeholder: 'Contoh: Roadmap produk Q3: Fitur Mobile, Security, AI Copilot, dan Infra',
  },
  {
    value: 'swimlane',
    label: 'Swimlane BPMN',
    icon: Layers,
    iconColor: 'text-orange-500',
    description: 'Alur proses lintas divisi/aktor',
    placeholder: 'Contoh: Alur pengadaan barang (Procurement): Requester, Approver, Purchasing, Supplier',
  },
]

const currentDiagramPlaceholder = computed(() => {
  const selected = DIAGRAM_TYPES.find((t) => t.value === diagramType.value)
  return selected?.placeholder || 'Deskripsikan diagram yang ingin Anda buat...'
})

// Unified templates
const diagramTemplates = computed(() => store.templatesList.value || [])
const uiTemplates = computed(() => store.uiTemplatesList.value || [])

const allTemplatesUnified = computed(() => {
  const list = []
  diagramTemplates.value.forEach((t) => {
    list.push({ ...t, _kind: 'diagram' })
  })
  uiTemplates.value.forEach((t) => {
    list.push({ ...t, _kind: 'ui_design' })
  })
  return list
})

const categories = computed(() => {
  const cats = new Set(['All'])
  allTemplatesUnified.value.forEach((t) => {
    if (t.category) cats.add(t.category)
  })
  return Array.from(cats)
})

const filteredTemplates = computed(() => {
  return allTemplatesUnified.value.filter((t) => {
    if (templateTypeFilter.value !== 'all' && t._kind !== templateTypeFilter.value) {
      return false
    }
    const matchCategory =
      selectedCategory.value === 'All' || t.category === selectedCategory.value

    const query = templateSearch.value.toLowerCase().trim()
    const matchSearch =
      !query ||
      t.name.toLowerCase().includes(query) ||
      (t.description && t.description.toLowerCase().includes(query)) ||
      (t.diagram_type && t.diagram_type.toLowerCase().includes(query)) ||
      (t.device && t.device.toLowerCase().includes(query))
    return matchCategory && matchSearch
  })
})

function getDiagramTypeBadge(type) {
  const map = {
    swimlane: { label: 'BPMN Swimlane', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    architecture: { label: 'Cloud Architecture', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
    erd: { label: 'Relational ERD', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    flowchart: { label: 'Flowchart', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  }
  return map[type] || { label: type, color: 'bg-slate-100 text-slate-700 border-slate-200' }
}

// Reset when modal opens
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      prompt.value = ''
      uiPrompt.value = ''
      diagramType.value = 'flowchart'
      uiDevice.value = 'web'
      uiThemeMode.value = 'dark'
      showAdvanced.value = false
      templateSearch.value = ''
      selectedCategory.value = 'All'
      templateTypeFilter.value = 'all'
      store.loadTemplates()
      store.loadUiTemplates()
    }
  },
  { flush: 'sync' },
)

function handleCreateBlank(mode = 'ui_design') {
  if (props.isLoading) return
  emit('createBlank', {
    mode,
    device: uiDevice.value,
    themeMode: uiThemeMode.value,
    foundation: uiFoundation.value,
  })
}

function handleSubmitUiDesign() {
  if (!uiPrompt.value.trim() || props.isLoading) return
  const submittedPrompt = uiPrompt.value.trim()
  const dev = uiDevice.value
  const thmMode = uiThemeMode.value
  const fnd = uiFoundation.value
  const accent = uiAccentColor.value
  uiPrompt.value = ''
  emit('create', {
    mode: 'ui_design',
    prompt: submittedPrompt,
    device: dev,
    themeMode: thmMode,
    foundation: fnd,
    accentColor: accent,
  })
}

function handleSubmitDiagram() {
  if (!prompt.value.trim() || props.isLoading) return
  const submittedPrompt = prompt.value.trim()
  const submittedType = diagramType.value
  prompt.value = ''
  emit('create', {
    mode: 'diagram',
    prompt: submittedPrompt,
    diagramType: submittedType,
  })
}

function handleUseTemplate(template) {
  if (props.isLoading) return
  if (template._kind === 'ui_design') {
    emit('create', {
      mode: 'ui_design',
      templateId: template.id,
    })
  } else {
    emit('create', {
      mode: 'diagram',
      prompt: '',
      diagramType: template.diagram_type,
      templateId: template.id,
    })
  }
}

function handleClose() {
  if (props.isLoading) return
  prompt.value = ''
  uiPrompt.value = ''
  emit('close')
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in"
    @click.self="handleClose"
  >
    <div class="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
      <!-- Header -->
      <div class="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/70">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
            <Sparkles class="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-slate-900 leading-snug">Buat Project Baru</h3>
            <p class="text-[11px] text-slate-500">Mulai dari kanvas kosong atau generate dengan AI</p>
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

      <!-- Navigation Tabs -->
      <div class="flex items-center px-5 border-b border-slate-200 bg-white gap-2 flex-shrink-0">
        <!-- Tab 1: UI Design Canvas -->
        <button
          type="button"
          @click="activeTab = 'ui_design'"
          class="flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all"
          :class="
            activeTab === 'ui_design'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          "
        >
          <Palette class="w-3.5 h-3.5" />
          <span>UI Design Canvas</span>
        </button>

        <!-- Tab 2: Diagram & Flowchart -->
        <button
          type="button"
          @click="activeTab = 'diagram'"
          class="flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all"
          :class="
            activeTab === 'diagram'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          "
        >
          <Workflow class="w-3.5 h-3.5" />
          <span>Diagram / Flowchart</span>
        </button>

        <!-- Tab 3: Galeri Template -->
        <button
          type="button"
          @click="activeTab = 'templates'"
          class="flex items-center gap-2 py-2.5 px-3 text-xs font-semibold border-b-2 transition-all ml-auto"
          :class="
            activeTab === 'templates'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          "
        >
          <BookOpen class="w-3.5 h-3.5" />
          <span>Template</span>
          <span
            v-if="allTemplatesUnified.length > 0"
            class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full"
            :class="activeTab === 'templates' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'"
          >
            {{ allTemplatesUnified.length }}
          </span>
        </button>
      </div>

      <!-- ==================== TAB 1: UI DESIGN CANVAS (SIMPLIFIED & CLEAN) ==================== -->
      <div v-if="activeTab === 'ui_design'" class="overflow-y-auto p-5 space-y-4 flex-1">
        <form @submit.prevent="handleSubmitUiDesign" class="space-y-4">
          <!-- Row 1: Target Device & Theme Mode -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <!-- Target Device -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Target Device
              </label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="d in UI_DEVICES"
                  :key="d.value"
                  type="button"
                  @click="uiDevice = d.value"
                  :class="[
                    'flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all',
                    uiDevice === d.value
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/40 hover:bg-slate-50'
                  ]"
                >
                  <component
                    :is="d.icon"
                    class="w-4 h-4 mb-1"
                    :class="uiDevice === d.value ? 'text-indigo-600' : 'text-slate-400'"
                  />
                  <span class="text-xs font-semibold">{{ d.label }}</span>
                  <span class="text-[9px] font-mono text-slate-400">{{ d.resolution }}</span>
                </button>
              </div>
            </div>

            <!-- Mode Tampilan (Dark vs Light) -->
            <div>
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Mode Tampilan
              </label>
              <div class="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  @click="uiThemeMode = 'dark'"
                  :class="[
                    'flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all',
                    uiThemeMode === 'dark'
                      ? 'border-slate-900 bg-slate-900 text-white shadow-xs ring-1 ring-slate-900/30'
                      : 'border-slate-200 text-slate-600 bg-slate-50/40 hover:bg-slate-50'
                  ]"
                >
                  <span>🌙 Dark Mode</span>
                </button>
                <button
                  type="button"
                  @click="uiThemeMode = 'light'"
                  :class="[
                    'flex items-center justify-center gap-2 p-3 rounded-xl border font-semibold text-xs transition-all',
                    uiThemeMode === 'light'
                      ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-xs ring-1 ring-indigo-500/30'
                      : 'border-slate-200 text-slate-600 bg-slate-50/40 hover:bg-slate-50'
                  ]"
                >
                  <span>☀️ Light Mode</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Row 2: Prompt Kebutuhan -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Deskripsi Kebutuhan UI / Prompt
              </label>
              <button
                v-if="uiPrompt.length > 0"
                type="button"
                @click="uiPrompt = ''"
                class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 class="w-3 h-3" />
                <span>Hapus</span>
              </button>
            </div>
            <textarea
              v-model="uiPrompt"
              rows="3"
              :disabled="isLoading"
              placeholder="Contoh: Dashboard CRM deals pipeline dengan tabel prospek, kartu KPI pendapatan, dan filter status..."
              class="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed transition-all shadow-inner bg-white"
            ></textarea>

            <!-- Quick Suggestions Chips -->
            <div class="mt-2 flex flex-wrap gap-1.5 items-center">
              <span class="text-[10px] text-slate-400 font-medium">Contoh:</span>
              <button
                v-for="(chip, idx) in QUICK_CHIPS"
                :key="idx"
                type="button"
                @click="uiPrompt = chip.text"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 text-[11px] transition-colors border border-slate-200/80"
              >
                <span>{{ chip.icon }}</span>
                <span class="truncate max-w-[140px]">{{ chip.text.split(' ')[0] }} {{ chip.text.split(' ')[1] }}</span>
              </button>
            </div>
          </div>

          <!-- Row 3: Collapsible Advanced Settings (Optional) -->
          <div class="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              type="button"
              @click="showAdvanced = !showAdvanced"
              class="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div class="flex items-center gap-1.5">
                <Sliders class="w-3.5 h-3.5 text-slate-500" />
                <span>Pengaturan Lanjutan (Opsional)</span>
              </div>
              <component :is="showAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5 text-slate-400" />
            </button>

            <div v-if="showAdvanced" class="p-3.5 pt-1 space-y-3 border-t border-slate-200/70 bg-white">
              <!-- Foundation Selection -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Design Foundation
                </label>
                <div class="grid grid-cols-3 gap-1.5">
                  <button
                    v-for="f in DESIGN_FOUNDATIONS"
                    :key="f.id"
                    type="button"
                    @click="uiFoundation = f.id"
                    :class="[
                      'p-2 rounded-lg border text-left text-xs transition-all',
                      uiFoundation === f.id
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 font-bold'
                        : 'border-slate-200 text-slate-600 bg-slate-50/40 hover:bg-slate-50'
                    ]"
                  >
                    <div class="truncate">{{ f.name }}</div>
                    <span class="text-[9px] text-slate-400 font-mono">{{ f.tokens?.radius || '8px' }}</span>
                  </button>
                </div>
              </div>

              <!-- Accent Color Selection -->
              <div>
                <label class="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Warna Aksen Kustom
                </label>
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-1.5">
                    <button
                      v-for="hex in QUICK_ACCENT_COLORS"
                      :key="hex"
                      type="button"
                      @click="uiAccentColor = hex"
                      class="w-5 h-5 rounded-full border border-slate-300 transition-transform flex items-center justify-center"
                      :class="uiAccentColor === hex ? 'scale-110 ring-2 ring-indigo-500/40 shadow-xs' : 'hover:scale-105'"
                      :style="{ backgroundColor: hex }"
                    >
                      <Check v-if="uiAccentColor === hex" class="w-2.5 h-2.5 text-white stroke-[3]" />
                    </button>
                  </div>
                  <input
                    v-model="uiAccentColor"
                    type="color"
                    class="w-6 h-6 rounded cursor-pointer border border-slate-200 p-0 ml-1"
                    title="Pilih warna bebas"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Actions Footer -->
          <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            <!-- Left: Instant Blank Canvas Button -->
            <button
              type="button"
              @click="handleCreateBlank('ui_design')"
              :disabled="isLoading"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-98"
              title="Langsung masuk ke kanvas kosong tanpa generate AI"
            >
              <FilePlus class="w-3.5 h-3.5 text-slate-500" />
              <span>Mulai Kanvas Kosong</span>
            </button>

            <!-- Right: Cancel & Generate -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="handleClose"
                class="px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="!uiPrompt.trim() || isLoading"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
                <Sparkles v-else class="w-3.5 h-3.5" />
                <span>{{ isLoading ? 'Mendesain...' : 'Generate Desain' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- ==================== TAB 2: DIAGRAM & FLOWCHART ==================== -->
      <div v-else-if="activeTab === 'diagram'" class="overflow-y-auto p-5 space-y-4 flex-1">
        <form @submit.prevent="handleSubmitDiagram" class="space-y-4">
          <div>
            <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Tipe Diagram
            </label>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              <button
                v-for="t in DIAGRAM_TYPES"
                :key="t.value"
                type="button"
                @click="diagramType = t.value"
                :class="[
                  'group flex flex-col p-2 rounded-xl border text-left transition-all',
                  diagramType === t.value
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 shadow-xs ring-1 ring-indigo-500/30'
                    : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/40 hover:bg-slate-50'
                ]"
              >
                <div class="flex items-center gap-1.5 min-w-0 mb-0.5">
                  <component
                    :is="t.icon"
                    class="w-3.5 h-3.5 flex-shrink-0"
                    :class="diagramType === t.value ? 'text-indigo-600' : t.iconColor"
                  />
                  <span class="text-xs font-semibold truncate">{{ t.label }}</span>
                </div>
                <p class="text-[10px] leading-tight line-clamp-1 text-slate-400">
                  {{ t.description }}
                </p>
              </button>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label class="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Deskripsi / Prompt AI
              </label>
              <button
                v-if="prompt.length > 0"
                type="button"
                @click="prompt = ''"
                class="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 class="w-3 h-3" />
                <span>Hapus</span>
              </button>
            </div>
            <textarea
              v-model="prompt"
              rows="3"
              :disabled="isLoading"
              :placeholder="currentDiagramPlaceholder"
              class="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed transition-all shadow-inner bg-white"
            ></textarea>
          </div>

          <!-- Actions Footer -->
          <div class="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
            <!-- Left: Instant Blank Canvas Button -->
            <button
              type="button"
              @click="handleCreateBlank(diagramType)"
              :disabled="isLoading"
              class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs active:scale-98"
            >
              <FilePlus class="w-3.5 h-3.5 text-slate-500" />
              <span>Mulai Kanvas Kosong</span>
            </button>

            <!-- Right: Cancel & Generate -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="handleClose"
                class="px-3.5 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                :disabled="!prompt.trim() || isLoading"
                class="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                <Loader2 v-if="isLoading" class="w-3.5 h-3.5 animate-spin" />
                <PlusCircle v-else class="w-3.5 h-3.5" />
                <span>{{ isLoading ? 'Generating...' : 'Generate Diagram' }}</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- ==================== TAB 3: GALERI TEMPLATE ==================== -->
      <div v-else-if="activeTab === 'templates'" class="overflow-y-auto p-5 space-y-3 flex-1">
        <!-- Search & Filter Controls -->
        <div class="flex items-center gap-2">
          <div class="relative flex-1">
            <Search class="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              v-model="templateSearch"
              type="text"
              placeholder="Cari template..."
              class="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-hidden focus:bg-white focus:border-indigo-500"
            />
          </div>

          <!-- Kind Filter -->
          <select
            v-model="templateTypeFilter"
            class="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:bg-white"
          >
            <option value="all">Semua Tipe</option>
            <option value="ui_design">UI Design Canvas</option>
            <option value="diagram">Diagram Flowchart</option>
          </select>
        </div>

        <!-- Template List Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
          <div
            v-for="tpl in filteredTemplates"
            :key="tpl.id"
            class="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-400 hover:shadow-xs transition-all flex flex-col justify-between text-left"
          >
            <div>
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="font-bold text-xs text-slate-900 truncate">{{ tpl.name }}</span>
                <span
                  v-if="tpl._kind === 'ui_design'"
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200/80"
                >
                  UI Design
                </span>
                <span
                  v-else
                  class="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                  :class="getDiagramTypeBadge(tpl.diagram_type).color"
                >
                  {{ getDiagramTypeBadge(tpl.diagram_type).label }}
                </span>
              </div>
              <p class="text-[11px] text-slate-500 line-clamp-2 leading-tight mb-2">{{ tpl.description }}</p>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span class="text-[10px] text-slate-400 font-mono">{{ tpl.device || tpl.diagram_type }}</span>
              <button
                type="button"
                @click="handleUseTemplate(tpl)"
                :disabled="isLoading"
                class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Gunakan
              </button>
            </div>
          </div>
        </div>

        <div v-if="filteredTemplates.length === 0" class="text-center py-8 text-xs text-slate-400">
          Tidak ada template yang cocok
        </div>
      </div>
    </div>
  </div>
</template>
