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

function handleWindowMessage(e) {
  // Element selection — only process in edit/comment mode
  if (e.data?.type === 'UI_COMPONENT_CLICKED' && e.data?.componentId) {
    if (canvasMode.value === 'edit' || canvasMode.value === 'comment') {
      store.setSelectedComponent(e.data.componentId)
    }
  }
  if (e.data?.type === 'UI_ELEMENT_SELECTED' && e.data?.target) {
    if (canvasMode.value === 'edit' || canvasMode.value === 'comment') {
      store.setSelectedTarget(e.data.target, e.data.context)
    }
  }
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
    `<!-- Belum ada kode antarmuka. Silakan masukkan prompt untuk mulai mengompilasi desain. -->`
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

  // Pure Thin Client: Do NOT force dark mode or arbitrary brand/primary colors.
  // The AI Design Engine generates bespoke Tailwind classes and styling.
  const isExplicitDark = theme.value?.mode === 'dark'
  const customPrimary = theme.value?.primary

  const tailwindThemeConfig = customPrimary
    ? `tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: '${customPrimary}',
            primary: '${customPrimary}'
          }
        }
      }
    }`
    : `tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {}
      }
    }`

  return `<!DOCTYPE html>
<html lang="en"${isExplicitDark ? ' class="dark"' : ''}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"><\/script>
  <script>
    ${tailwindThemeConfig}
  <\/script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      overflow-x: hidden;
      background-color: ${isExplicitDark ? '#020617' : 'transparent'};
      color: ${isExplicitDark ? '#f1f5f9' : 'inherit'};
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.2); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.4); }
    /* Selectable element base styles — only visible in edit/comment mode */
    body.rl-edit-mode [data-rl-id],
    body.rl-comment-mode [data-rl-id] {
      cursor: crosshair;
      transition: outline 0.12s ease-in-out;
    }
    body.rl-edit-mode [data-rl-id]:hover,
    body.rl-comment-mode [data-rl-id]:hover {
      outline: 1.5px dashed rgba(99, 102, 241, 0.7) !important;
      outline-offset: 2px;
    }
    body.rl-edit-mode [data-rl-id].rl-selected,
    body.rl-comment-mode [data-rl-id].rl-selected {
      outline: 2px solid #6366f1 !important;
      outline-offset: 2px;
    }
    /* Edit mode badge */
    #rl-mode-badge {
      position: fixed;
      top: 8px;
      right: 8px;
      z-index: 9999;
      font-size: 10px;
      font-family: monospace;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
      pointer-events: none;
      display: none;
    }
    body.rl-edit-mode #rl-mode-badge { display: block; background: rgba(99,102,241,0.9); color: white; content: 'EDIT'; }
    body.rl-comment-mode #rl-mode-badge { display: block; background: rgba(249,115,22,0.9); color: white; }
  <\/style>
<\/head>
<body class="${isExplicitDark ? 'dark' : ''}">
  <div id="rl-mode-badge">EDIT</div>
  ${htmlContent}
  <script>
    (function() {
      var currentMode = 'preview'; // 'preview' | 'edit' | 'comment'
      var activeSelected = null;

      // Apply mode class to body
      function applyMode(mode) {
        currentMode = mode;
        document.body.classList.remove('rl-preview-mode', 'rl-edit-mode', 'rl-comment-mode');
        document.body.classList.add('rl-' + mode + '-mode');
        var badge = document.getElementById('rl-mode-badge');
        if (badge) {
          badge.textContent = mode.toUpperCase();
        }
        // Clear selection when switching to preview
        if (mode === 'preview' && activeSelected) {
          activeSelected.classList.remove('rl-selected');
          activeSelected = null;
        }
      }

      // Listen for mode changes from parent
      window.addEventListener('message', function(evt) {
        if (evt.data && evt.data.type === 'RANCANGLAB_SET_MODE') {
          applyMode(evt.data.mode || 'preview');
        }
      });

      // Notify parent that iframe is ready (so parent can push current mode)
      window.parent.postMessage({ type: 'RANCANGLAB_IFRAME_READY' }, '*');

      document.addEventListener('click', function(e) {

        // 1. Intercept Link Navigations (Always — prevents host app recursion)
        var anchor = e.target.closest('a');
        if (anchor) {
          var href = anchor.getAttribute('href');
          if (href) {
            // In EDIT/COMMENT mode: completely block all navigation, select anchor element instead
            if (currentMode === 'edit' || currentMode === 'comment') {
              e.preventDefault();
              e.stopPropagation();
              // Select the anchor as a component if it has identity
              trySelectElement(anchor, e);
              return;
            }

            // In PREVIEW mode: allow hash scrolling, block app-recursive nav
            e.preventDefault();
            e.stopPropagation();

            if (href.startsWith('#')) {
              var hashTarget = document.querySelector(href);
              if (hashTarget) {
                hashTarget.scrollIntoView({ behavior: 'smooth' });
              }
              return;
            } else if (href.startsWith('http://') || href.startsWith('https://')) {
              window.open(href, '_blank', 'noopener,noreferrer');
              return;
            } else {
              // Relative path or root '/' — notify parent, try local scroll
              window.parent.postMessage({ type: 'RANCANGLAB_PREVIEW_NAVIGATE', href: href }, '*');
              var cleanSlug = href.replace(/^\\/+/, '').split('?')[0].split('#')[0];
              if (cleanSlug) {
                var matchEl = document.getElementById(cleanSlug) || document.getElementById('sec-' + cleanSlug);
                if (matchEl) {
                  matchEl.scrollIntoView({ behavior: 'smooth' });
                }
              }
              return;
            }
          }
        }

        // 2. Element & Section Selection — only in EDIT / COMMENT modes
        if (currentMode !== 'edit' && currentMode !== 'comment') return;
        trySelectElement(e.target, e);

      }, true);

      function trySelectElement(startEl, e) {
        // Determine selectable priority: data-rl-id > data-component-id > id on meaningful elements
        var SELECTABLE_TAGS = new Set(['section','header','footer','nav','main','article','aside','form',
          'button','a','h1','h2','h3','h4','h5','h6','img','input','select','textarea',
          'ul','ol','table','figure','blockquote','dialog','details','label']);

        var target = startEl;
        while (target && target !== document.body) {
          var rlid = target.getAttribute('data-rl-id') ||
                     target.getAttribute('data-component-id') ||
                     (SELECTABLE_TAGS.has(target.tagName.toLowerCase()) && target.id ? target.id : null);

          if (rlid) {
            // Update visual selection
            if (activeSelected) activeSelected.classList.remove('rl-selected');
            target.classList.add('rl-selected');
            activeSelected = target;

            var kind = target.getAttribute('data-rl-kind') || (rlid.startsWith('sec-') ? 'section' : 'component');
            var secEl = target.closest('[data-rl-kind="section"], [id^="sec-"]');
            var secId = secEl ? (secEl.getAttribute('data-rl-id') || secEl.id) : null;

            // Build breadcrumb path
            var breadcrumb = [];
            var cur = target;
            while (cur && cur !== document.body) {
              var cid = cur.getAttribute('data-rl-id') || cur.getAttribute('data-component-id') || (SELECTABLE_TAGS.has(cur.tagName.toLowerCase()) && cur.id ? cur.id : null);
              if (cid && cid !== rlid) breadcrumb.unshift(cid);
              cur = cur.parentElement;
            }

            window.parent.postMessage({
              type: 'UI_ELEMENT_SELECTED',
              mode: currentMode,
              target: {
                type: kind,
                id: rlid,
                section_id: secId,
                tag: target.tagName.toLowerCase(),
              },
              context: {
                tag: target.tagName.toLowerCase(),
                text: (target.innerText || '').slice(0, 80).trim(),
                role: target.getAttribute('role') || kind,
                breadcrumb: breadcrumb,
              }
            }, '*');

            window.parent.postMessage({ type: 'UI_COMPONENT_CLICKED', componentId: rlid }, '*');
            break;
          }
          target = target.parentElement;
        }
      }

    })();
  <\/script>
<\/body>
<\/html>`
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
    :style="{ width: `${effectiveWidth}px` }"
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
      <!-- Browser Chrome Header Bar -->
      <div
        class="h-10 px-2.5 sm:px-4 border-b border-slate-800 flex items-center justify-between gap-2 sm:gap-3 flex-shrink-0 select-none bg-slate-900 text-slate-200"
      >
        <!-- Left Group: Traffic Lights & Viewport Switcher (Always on Left, Never Cut Off) -->
        <div class="flex items-center gap-2 flex-shrink-0">
          <!-- Traffic Light Buttons -->
          <div class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-full bg-[#ef4444] inline-block shadow-inner"></span>
            <span class="w-3 h-3 rounded-full bg-[#eab308] inline-block shadow-inner"></span>
            <span class="w-3 h-3 rounded-full bg-[#22c55e] inline-block shadow-inner"></span>
          </div>

          <!-- Viewport preview controls (Desktop, Tablet, Mobile) - Always visible on front -->
          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60 flex-shrink-0">
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
        </div>

        <!-- Center: URL Address Bar (Visible when viewport is wide enough) -->
        <div
          v-if="effectiveWidth >= 800"
          class="flex-1 max-w-sm h-6 px-3 rounded-md border text-[11px] font-mono flex items-center gap-2 truncate bg-slate-950/70 border-slate-800 text-slate-400"
        >
          <Lock class="w-3 h-3 text-emerald-500 flex-shrink-0" />
          <span class="truncate">https://app.{{ String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-') }}.io</span>
          <RotateCw class="w-2.5 h-2.5 ml-auto text-slate-400 opacity-60" />
        </div>

        <!-- Right Group: Badges, Review, Canvas Edit Mode, View Mode, Copy -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <AntiSlopBadge :compact="effectiveWidth < 700" :foundation-name="theme?.palette || 'Custom Design System'" :audit-data="auditState" />
          
          <ReviewCommentPin
            :compact="effectiveWidth < 700"
            :comments="reviewComments"
            @add-comment="handleAddComment"
            @resolve-comment="handleResolveComment"
            @send-to-ai="handleSendToAi"
          />

          <!-- Canvas Edit Mode Switcher (PREVIEW / EDIT / COMMENT) -->
          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60">
            <button
              type="button"
              @click.stop="setCanvasMode('preview')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="canvasMode === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Preview Mode: Navigasi dan link aktif, interaksi normal"
            >
              <Navigation2 class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Preview</span>
            </button>
            <button
              type="button"
              @click.stop="setCanvasMode('edit')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="canvasMode === 'edit' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Edit Mode: Klik komponen atau seksi untuk memilih target patch AI"
            >
              <MousePointer2 class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Edit</span>
            </button>
            <button
              type="button"
              @click.stop="setCanvasMode('comment')"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="canvasMode === 'comment' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'"
              title="Comment Mode: Klik elemen untuk memberi komentar per komponen"
            >
              <MessageSquare class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Comment</span>
            </button>
          </div>

          <span v-if="effectiveWidth >= 950" class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-800/80 text-slate-300 border border-slate-700/60 hidden sm:inline-block">
            {{ effectiveWidth }} × {{ effectiveHeight }}
          </span>

          <div class="flex items-center rounded-lg border border-slate-700/60 p-0.5 bg-slate-950/60">
            <button
              type="button"
              @click.stop="viewMode = 'visual'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="viewMode === 'visual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Canvas Native Modular Vue Components"
            >
              <Eye class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Canvas</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'sandbox'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="viewMode === 'sandbox' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Isolated Iframe Sandbox (Zero CSS Bleed)"
            >
              <Box class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Sandbox</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'code'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="viewMode === 'code' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Lihat Kode"
            >
              <Code class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Code</span>
            </button>
            <button
              type="button"
              @click.stop="viewMode = 'spec'"
              class="px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              :class="viewMode === 'spec' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'"
              title="Spesifikasi Halaman"
            >
              <FileText class="w-3 h-3" />
              <span v-if="effectiveWidth >= 700">Spec</span>
            </button>
          </div>

          <button
            type="button"
            @click.stop="copyCode"
            class="p-1 rounded-lg border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            :title="isCopied ? 'Tersalin!' : 'Salin Kode UI'"
          >
            <Check v-if="isCopied" class="w-3.5 h-3.5 text-emerald-400" />
            <Copy v-else class="w-3.5 h-3.5" />
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
          />
        </div>

        <!-- Isolated Sandbox Mode: Pure Artifact Preview without Editor Overlay -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[500px] relative overflow-hidden bg-slate-950 flex flex-col">
          <ArtifactPreview
            :artifact="artifactData"
            mode="sandbox"
            :viewport="activeViewport"
            :version="artifactVersion"
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
        <AntiSlopBadge :foundation-name="theme?.palette || 'Custom Design System'" :audit-data="auditState" />
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
      <div class="flex-1 flex flex-col pt-3 overflow-y-auto relative">
        <!-- Mobile Visual Canvas Mode: Single Source of Visual Truth with Canvas Editor Overlay -->
        <div v-if="viewMode === 'visual'" class="flex-1 flex flex-col min-h-[400px] relative">
          <ArtifactPreview
            :artifact="artifactData"
            mode="canvas"
            viewport="mobile"
            :version="artifactVersion"
          />
        </div>

        <!-- Mobile Isolated Sandbox Mode: Pure Artifact Preview without Editor Overlay -->
        <div v-else-if="viewMode === 'sandbox'" class="flex-1 w-full h-full min-h-[400px] relative overflow-hidden bg-slate-950 flex flex-col">
          <ArtifactPreview
            :artifact="artifactData"
            mode="sandbox"
            viewport="mobile"
            :version="artifactVersion"
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
              <div v-for="(sec, sidx) in sections" :key="sec.id || sidx" class="flex justify-between items-center text-slate-300 border-b border-slate-800/60 pb-0.5">
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
