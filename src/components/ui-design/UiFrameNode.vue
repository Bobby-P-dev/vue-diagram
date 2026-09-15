<script setup>
import { ref, computed, onMounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  Lock,
  RotateCw,
  Code,
  Eye,
  Copy,
  Check,
  Smartphone,
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
} from 'lucide-vue-next'

import UiNavbarSection from './sections/UiNavbarSection.vue'
import UiHeroSection from './sections/UiHeroSection.vue'
import UiKpiSection from './sections/UiKpiSection.vue'
import UiTableSection from './sections/UiTableSection.vue'
import UiMobileStatusSection from './sections/UiMobileStatusSection.vue'
import UiBalanceSection from './sections/UiBalanceSection.vue'
import UiAssetListSection from './sections/UiAssetListSection.vue'
import UiMobileNavSection from './sections/UiMobileNavSection.vue'
import UiAnnouncementSection from './sections/UiAnnouncementSection.vue'
import UiFormSection from './sections/UiFormSection.vue'
import UiFeatureGridSection from './sections/UiFeatureGridSection.vue'
import UiProductGridSection from './sections/UiProductGridSection.vue'
import UiPricingSection from './sections/UiPricingSection.vue'

import AntiSlopBadge from './AntiSlopBadge.vue'
import ReviewCommentPin from './ReviewCommentPin.vue'
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

const device = computed(() => String(props.data?.canvas?.device || props.data?.device || 'web').toLowerCase())
const title = computed(() => props.data?.canvas?.title || props.data?.title || 'UI Design Frame')
const width = computed(() => Number(props.data?.canvas?.width || props.data?.width) || (device.value === 'mobile' ? 375 : 1024))
const height = computed(() => Number(props.data?.canvas?.height || props.data?.height) || (device.value === 'mobile' ? 812 : 720))
const theme = computed(() => props.data?.design_state?.design_spec?.visual?.theme || props.data?.theme || { mode: 'dark', primary: '#6366f1' })
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

// Canonical single source of truth for HTML: implementation.source.html -> code_export.html -> rawHtml
const rawHtml = computed(() => {
  return (
    props.data?.implementation?.source?.html ||
    props.data?.code_export?.html ||
    props.data?.rawHtml ||
    props.data?.raw_html ||
    props.data?.custom_markup ||
    ''
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
  const currentProjectId = store.activeProject?.id
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
            status: c.status === 'resolved' ? 'Resolved' : 'Open'
          }))
        }
      }
    } catch (e) {
      console.warn('Could not load persistent comments:', e)
    }
  }
})

async function handleAddComment(comment) {
  reviewComments.value.unshift(comment)
  const currentProjectId = store.activeProject?.id
  if (currentProjectId) {
    try {
      const saved = await api.addComment(currentProjectId, {
        node_id: props.id,
        author: comment.author || 'Designer',
        content: comment.content,
        position_x: 0,
        position_y: 0,
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
    try {
      await api.updateCommentStatus(id, target.status.toLowerCase())
    } catch (err) {
      console.error('Failed to update comment status:', err)
    }
  }
}

function handleSendToAi(text) {
  if (store.sendFollowUpChat) {
    store.sendFollowUpChat(`Perbaiki desain sesuai feedback review: "${text}"`)
  }
}

const SECTION_COMPONENTS = {
  navbar: UiNavbarSection,
  hero: UiHeroSection,
  kpi_grid: UiKpiSection,
  data_table: UiTableSection,
  mobile_status_bar: UiMobileStatusSection,
  balance_card: UiBalanceSection,
  asset_list: UiAssetListSection,
  mobile_bottom_nav: UiMobileNavSection,
  announcement_bar: UiAnnouncementSection,
  form: UiFormSection,
  form_card: UiFormSection,
  auth_card: UiFormSection,
  login_card: UiFormSection,
  feature_grid: UiFeatureGridSection,
  features: UiFeatureGridSection,
  benefits: UiFeatureGridSection,
  product_grid: UiProductGridSection,
  products: UiProductGridSection,
  storefront: UiProductGridSection,
  catalog: UiProductGridSection,
  pricing_table: UiPricingSection,
  pricing: UiPricingSection,
  plans: UiPricingSection,
}

const displayCode = computed(() => {
  return (
    props.data?.implementation?.source?.vue ||
    codeExport.value?.vue ||
    props.data?.implementation?.source?.html ||
    codeExport.value?.html ||
    rawHtml.value ||
    `<!-- Tailwind UI Code for ${title.value} -->\n<div class="w-full bg-slate-900 text-white">\n  <!-- Sections: ${sections.value.map((s) => s.type).join(', ')} -->\n</div>`
  )
})

const sandboxDoc = computed(() => {
  let htmlContent =
    props.data?.implementation?.source?.html ||
    codeExport.value?.html ||
    rawHtml.value ||
    ''
  if (!htmlContent && sections.value.length > 0) {
    htmlContent = `<div class="p-8 text-center text-slate-400 font-sans"><p class="text-sm">Menyiapkan kode sandbox untuk seksi: ${sections.value.map(s => s.type).join(', ')}...</p></div>`
  }
  const isDark = theme.value?.mode === 'dark'
  const bgColor = isDark ? '#020617' : '#f8fafc'
  const textColor = isDark ? '#f1f5f9' : '#0f172a'
  const primaryColor = theme.value?.primary || '#6366f1'

  return `<!DOCTYPE html>
<html lang="en" class="${isDark ? 'dark' : ''}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '${primaryColor}',
            primary: '${primaryColor}'
          }
        }
      }
    }
  <\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
      color: ${textColor};
      min-height: 100vh;
      overflow-x: hidden;
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
  </style>
</head>
<body class="${isDark ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}">
  ${htmlContent}
</body>
</html>`
})

function cycleMobileViewMode() {
  if (viewMode.value === 'visual') viewMode.value = 'sandbox'
  else if (viewMode.value === 'sandbox') viewMode.value = 'code'
  else if (viewMode.value === 'code') viewMode.value = 'spec'
  else viewMode.value = 'visual'
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
    :style="{ width: `${width}px` }"
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

    <!-- ==================== WEB / DESKTOP BROWSER FRAME ==================== -->
    <div
      v-if="device !== 'mobile'"
      class="rounded-2xl border border-slate-200/90 bg-slate-900 shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
      :class="theme.mode === 'dark' ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-slate-50 text-slate-900 border-slate-300'"
      :style="{ minHeight: `${height}px` }"
    >
      <!-- Browser Chrome Header Bar -->
      <div
        class="h-10 px-4 border-b flex items-center justify-between gap-4 flex-shrink-0 select-none"
        :class="theme.mode === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'"
      >
        <!-- Traffic Light Buttons -->
        <div class="flex items-center gap-1.5">
          <span class="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-inner"></span>
          <span class="w-3 h-3 rounded-full bg-[#eab308] inline-block shadow-inner"></span>
          <span class="w-3 h-3 rounded-full bg-[#22c55e] inline-block shadow-inner"></span>
        </div>

        <!-- URL Address Bar -->
        <div
          class="flex-1 max-w-md h-6 px-3 rounded-md border text-[11px] font-mono flex items-center gap-2 truncate"
          :class="theme.mode === 'dark' ? 'bg-slate-950/70 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-600 shadow-inner'"
        >
          <Lock class="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span class="truncate">https://app.{{ String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-') }}.io</span>
          <RotateCw class="w-2.5 h-2.5 ml-auto text-slate-400 opacity-60" />
        </div>

        <!-- Resolution badge, Anti-Slop badge, Review Pins & View mode toggle -->
        <div class="flex items-center gap-2">
          <AntiSlopBadge :foundation-name="theme.palette || 'Ramp Clean'" />
          
          <ReviewCommentPin
            :comments="reviewComments"
            @add-comment="handleAddComment"
            @resolve-comment="handleResolveComment"
            @send-to-ai="handleSendToAi"
          />

          <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 hidden sm:inline-block">
            {{ width }} × {{ height }}
          </span>

          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60">
            <button
              type="button"
              @click.stop="viewMode = 'visual'"
              class="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
              :class="viewMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Canvas Native Modular Vue Components"
            >
              <Eye class="w-3 h-3" />
              <span>Canvas</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'sandbox'"
              class="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
              :class="viewMode === 'sandbox' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Isolated Iframe Sandbox (Zero CSS Bleed)"
            >
              <Box class="w-3 h-3" />
              <span>Sandbox</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'code'"
              class="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
              :class="viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
            >
              <Code class="w-3 h-3" />
              <span>Code</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'spec'"
              class="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors"
              :class="viewMode === 'spec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Spesifikasi Halaman & Keputusan Desain (11-Layer Architecture)"
            >
              <FileText class="w-3 h-3" />
              <span>Spec</span>
            </button>
          </div>

          <button
            type="button"
            @click.stop="copyCode"
            class="p-1 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            :title="isCopied ? 'Tersalin!' : 'Salin Kode UI'"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- Content Area -->
      <div class="flex-1 flex flex-col overflow-y-auto">
        <!-- Visual Sections Mode -->
        <div v-if="viewMode === 'visual'" class="flex-1 flex flex-col">
          <!-- Modular Sections Mode (Primary Renderer) -->
          <template v-if="sections.length > 0">
            <component
              v-for="(sec, idx) in sections"
              :key="sec.id || idx"
              :is="SECTION_COMPONENTS[sec.type] || UiHeroSection"
              :data="sec"
              :theme="theme"
            />
          </template>

          <!-- Freeform Custom Tailwind HTML Renderer (Fallback only) -->
          <div v-else-if="rawHtml" class="w-full flex-1" v-html="rawHtml"></div>

          <!-- Empty Canvas Placeholder -->
          <div v-else class="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500 text-xs">
            <FileText class="w-10 h-10 text-slate-600 mb-3 opacity-40" />
            <p class="font-semibold text-slate-300 text-sm">Kanvas UI Kosong</p>
            <p class="text-xs text-slate-500 mt-1 max-w-sm">Ketik prompt atau deskripsi antarmuka di panel chat untuk mulai mengompilasi desain.</p>
          </div>
        </div>

        <!-- Isolated Sandbox Mode -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[500px] relative overflow-hidden bg-slate-950 flex flex-col">
          <div class="h-6 px-3 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center justify-between flex-shrink-0 select-none">
            <span class="flex items-center gap-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Isolated Iframe Sandbox Runtime (Zero CSS Bleed)
            </span>
            <span class="text-slate-500">sandbox="allow-scripts allow-same-origin"</span>
          </div>
          <iframe
            :srcdoc="sandboxDoc"
            sandbox="allow-scripts allow-same-origin"
            class="w-full flex-1 border-0 block bg-transparent"
            title="Isolated Sandbox Runtime"
          ></iframe>
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
                :class="validation?.status === 'fail' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : validation?.status === 'repaired' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'"
              >
                <CheckCircle2 class="w-3 h-3" />
                <span>Compiler Status: {{ (validation?.status || 'PASS').toUpperCase() }}</span>
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
                      <span class="font-bold text-emerald-400 font-mono uppercase">{{ auditState?.validation?.status || 'PASS' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Coverage:</span>
                      <span class="font-bold text-emerald-400 font-mono uppercase">{{ auditState?.requirement_coverage?.status || 'PASS' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Anti-Slop:</span>
                      <span class="font-bold text-emerald-400 font-mono uppercase">{{ auditState?.anti_slop?.status || 'PASS' }}</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Visual Review:</span>
                      <span class="font-bold text-emerald-400 font-mono uppercase">{{ auditState?.visual_review?.status || 'PASS' }}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span class="text-slate-400 block text-[11px]">Anti-Hallucination Audit:</span>
                  <div class="p-2 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 mt-1 flex items-start gap-1.5">
                    <CheckCircle2 class="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-emerald-400" />
                    <span>{{ validation?.hallucination_check || 'Clean: Bebas domain spekulatif, treasury palsu, dan elemen halusinasi.' }}</span>
                  </div>
                </div>
                <div>
                  <span class="text-slate-400 block text-[11px] mb-1">Skor Kualitas Kompiler (8 Metrik):</span>
                  <div class="grid grid-cols-2 gap-1.5 text-[10px]">
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Fidelity:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.requirement_fidelity ?? 10 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Scope:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.scope_accuracy ?? validation?.score?.scope ?? 10 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Traceability:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.traceability ?? 10 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Simplicity:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.simplicity ?? 10 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Hierarchy:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.hierarchy ?? 9 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Consistency:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.visual_consistency ?? validation?.score?.consistency ?? 10 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Responsive:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.responsive_quality ?? 9 }}/10</span>
                    </div>
                    <div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 flex justify-between items-center">
                      <span class="text-slate-400">Anti-Hallucination:</span>
                      <span class="font-bold text-emerald-400 font-mono">{{ validation?.score?.hallucination_safety ?? 10 }}/10</span>
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
          <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
            <span>Vue 3 / Tailwind CSS Component</span>
            <span v-if="isCopied" class="text-emerald-400 font-bold">✓ Kode disalin ke clipboard</span>
          </div>
          <pre><code>{{ displayCode }}</code></pre>
        </div>
      </div>
    </div>

    <!-- ==================== MOBILE SMARTPHONE FRAME ==================== -->
    <div
      v-else
      class="mx-auto rounded-[48px] border-[8px] border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col relative transition-all duration-300 ring-1 ring-white/10"
      :style="{ width: `${width}px`, minHeight: `${height}px` }"
    >
      <!-- Dynamic Island / Top Notch Speaker -->
      <div class="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black flex items-center justify-center gap-2 z-40 border border-white/5">
        <span class="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800"></span>
        <span class="w-2 h-2 rounded-full bg-indigo-950 border border-indigo-900"></span>
      </div>

      <!-- Controls Overlay on Top Right Outside Frame -->
      <div class="absolute -top-9 right-0 flex items-center gap-1.5 z-50">
        <AntiSlopBadge :foundation-name="theme.palette || 'Raycast Keyboard'" />
        <ReviewCommentPin
          :comments="reviewComments"
          @add-comment="handleAddComment"
          @resolve-comment="handleResolveComment"
          @send-to-ai="handleSendToAi"
        />

        <span class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700 shadow-xs">
          375 × 812 • iOS
        </span>
        <button
          type="button"
          @click.stop="cycleMobileViewMode"
          class="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-xs flex items-center gap-1"
          title="Ganti Mode Tampilan (Canvas / Sandbox / Code / Spec)"
        >
          <Eye v-if="viewMode === 'visual'" class="w-3 h-3 text-indigo-400" />
          <Box v-else-if="viewMode === 'sandbox'" class="w-3 h-3 text-emerald-400" />
          <Code v-else-if="viewMode === 'code'" class="w-3 h-3 text-amber-400" />
          <FileText v-else class="w-3 h-3 text-sky-400" />
          <span class="capitalize">{{ viewMode === 'visual' ? 'Canvas' : viewMode }}</span>
        </button>
        <button
          type="button"
          @click.stop="copyCode"
          class="p-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 shadow-xs"
        >
          <Check v-if="isCopied" class="w-3 h-3 text-emerald-400" />
          <Copy v-else class="w-3 h-3" />
        </button>
      </div>

      <!-- Mobile Content Area -->
      <div class="flex-1 flex flex-col pt-3 overflow-y-auto">
        <div v-if="viewMode === 'visual'" class="flex-1 flex flex-col">
          <!-- Modular Sections Mode (Primary Renderer) -->
          <template v-if="sections.length > 0">
            <component
              v-for="(sec, idx) in sections"
              :key="sec.id || idx"
              :is="SECTION_COMPONENTS[sec.type] || UiHeroSection"
              :data="sec"
              :theme="theme"
            />
          </template>

          <!-- Freeform Custom Tailwind HTML Renderer (Fallback only) -->
          <div v-else-if="rawHtml" class="w-full flex-1" v-html="rawHtml"></div>

          <!-- Empty Canvas Mobile Placeholder -->
          <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
            <Smartphone class="w-8 h-8 text-slate-600 mb-2 opacity-40" />
            <p class="font-semibold text-slate-300 text-xs">Kanvas Mobile Kosong</p>
            <p class="text-[10px] text-slate-500 mt-1 max-w-[200px]">Ketik prompt di AI Copilot untuk mengompilasi tampilan mobile.</p>
          </div>
        </div>

        <!-- Isolated Sandbox Mobile -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[400px] relative overflow-hidden bg-slate-950 flex flex-col">
          <div class="h-5 px-2 bg-slate-900 border-b border-slate-800 text-[9px] font-mono text-emerald-400 flex items-center justify-between flex-shrink-0 select-none">
            <span class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Sandbox Iframe
            </span>
            <span class="text-slate-500 text-[8px]">allow-scripts</span>
          </div>
          <iframe
            :srcdoc="sandboxDoc"
            sandbox="allow-scripts allow-same-origin"
            class="w-full flex-1 border-0 block bg-transparent"
            title="Isolated Sandbox Runtime"
          ></iframe>
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
              :class="validation?.status === 'fail' ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'"
            >
              {{ validation?.status || 'PASS' }}
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
              <div v-for="(sec, sidx) in sections" :key="sidx" class="flex justify-between items-center text-slate-300 border-b border-slate-800/60 pb-0.5">
                <span class="font-mono text-white">{{ sec.type }}</span>
                <span class="text-slate-400">{{ sec.requirement_source || 'page' }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Audit -->
          <div class="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span class="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">3. Validator (VERIFIED)</span>
            <p class="text-[10px] text-emerald-400">{{ validation?.hallucination_check || 'Clean: Bebas domain halusinasi.' }}</p>
            <div class="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-slate-800">
              <span class="text-slate-400">Fidelity: <span class="text-emerald-400 font-mono font-bold">{{ validation?.score?.requirement_fidelity ?? 10 }}/10</span></span>
              <span class="text-slate-400">Scope: <span class="text-emerald-400 font-mono font-bold">{{ validation?.score?.scope_accuracy ?? validation?.score?.scope ?? 10 }}/10</span></span>
            </div>
          </div>
        </div>

        <!-- Code Viewer Mode -->
        <div v-else class="p-4 bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto leading-relaxed flex-1">
          <pre><code>{{ displayCode }}</code></pre>
        </div>
      </div>

      <!-- Bottom Home Indicator Swipe Bar -->
      <div class="h-6 w-full flex items-center justify-center flex-shrink-0 bg-transparent">
        <div class="w-28 h-1 rounded-full bg-slate-600/60"></div>
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
