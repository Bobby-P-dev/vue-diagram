<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { Target, ChevronRight, X, FileText } from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  artifact: {
    type: Object,
    default: () => ({}),
  },
  mode: {
    type: String,
    default: 'canvas', // 'canvas' | 'sandbox'
    validator: (v) => ['canvas', 'sandbox'].includes(v),
  },
  viewport: {
    type: String,
    default: 'desktop', // 'desktop' | 'tablet' | 'mobile'
  },
  version: {
    type: [Number, String],
    default: 1,
  },
})

const store = useDiagramStore()
const iframeRef = ref(null)

// Normalize HTML from multiple possible artifact schema locations with raw_html prioritized
const rawHtml = computed(() => {
  return (
    props.artifact?.raw_html ||
    props.artifact?.rawHtml ||
    props.artifact?.code_export?.html ||
    props.artifact?.implementation?.source?.html ||
    props.artifact?.custom_markup ||
    ''
  )
})

// Deterministic source hash for reliable iframe cache busting / reactivity
const sourceHash = computed(() => {
  const str = rawHtml.value || ''
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return `${str.length}-${Math.abs(hash)}`
})

const theme = computed(() => {
  return (
    props.artifact?.design_state?.design_spec?.visual?.theme ||
    props.artifact?.theme ||
    null
  )
})

// Listen for messages from the iframe (element selection, navigation intercept, etc.)
function handleIframeMessage(e) {
  if (!e.data) return

  // In sandbox mode, ignore interactive editor selection
  if (props.mode === 'sandbox') return

  if (e.data.type === 'RANCANGLAB_REQUEST_MODE' && e.data.mode) {
    store.setCanvasMode(e.data.mode)
  }

  if (e.data.type === 'UI_ELEMENT_SELECTED' && e.data.target) {
    if (store.canvasMode.value === 'preview') {
      store.setCanvasMode('edit')
    }
    store.setSelectedTarget(e.data.target, e.data.context)
  }

  if (e.data.type === 'UI_COMPONENT_CLICKED' && e.data.componentId) {
    if (store.canvasMode.value === 'preview') {
      store.setCanvasMode('edit')
    }
    store.setSelectedComponent(e.data.componentId)
  }

  if (e.data.type === 'RANCANGLAB_IFRAME_READY') {
    syncModeToIframe()
  }

  if (e.data.type === 'RANCANGLAB_PREVIEW_NAVIGATE') {
    console.log('[ArtifactPreview] Intercepted navigation:', e.data.href)
  }
}

function syncModeToIframe() {
  const win = iframeRef.value?.contentWindow
  if (!win) return

  if (props.mode === 'sandbox') {
    win.postMessage({ type: 'RANCANGLAB_SET_MODE', mode: 'preview' }, '*')
  } else {
    // In canvas mode, sync the global canvasMode (preview, edit, comment)
    win.postMessage({ type: 'RANCANGLAB_SET_MODE', mode: store.canvasMode.value }, '*')
  }
}

watch(
  () => store.canvasMode.value,
  () => {
    if (props.mode === 'canvas') {
      syncModeToIframe()
    }
  }
)

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleIframeMessage)
})

// Build the complete standalone HTML document for the iframe
const sandboxDoc = computed(() => {
  const htmlContent = rawHtml.value
  if (!htmlContent) return ''

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

  const isCanvas = props.mode === 'canvas'

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

    ${
      isCanvas
        ? `
    /* Canvas Editor Overlay: Selectable element base styles */
    body.rl-edit-mode [data-rl-id],
    body.rl-comment-mode [data-rl-id] {
      cursor: crosshair;
      transition: outline 0.12s ease-in-out;
    }
    body.rl-edit-mode [data-rl-id]:hover,
    body.rl-comment-mode [data-rl-id]:hover {
      outline: 1.5px dashed rgba(99, 102, 241, 0.75) !important;
      outline-offset: 2px;
    }
    body.rl-edit-mode [data-rl-id].rl-selected,
    body.rl-comment-mode [data-rl-id].rl-selected {
      outline: 2px solid #6366f1 !important;
      outline-offset: 2px;
    }
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
    body.rl-edit-mode #rl-mode-badge { display: block; background: rgba(99,102,241,0.9); color: white; }
    body.rl-comment-mode #rl-mode-badge { display: block; background: rgba(249,115,22,0.9); color: white; }
    `
        : `
    /* Sandbox Mode: Pure artifact preview with zero editor outlines */
    [data-rl-id] { cursor: inherit; }
    #rl-mode-badge { display: none !important; }
    `
    }
  <\/style>
<\/head>
<body class="${isExplicitDark ? 'dark' : ''}">
  <div id="rl-mode-badge">EDIT</div>
  ${htmlContent}
  <script>
    (function() {
      var isCanvasMode = ${isCanvas};
      var currentMode = isCanvasMode ? 'preview' : 'preview';
      var activeSelected = null;

      function applyMode(mode) {
        if (!isCanvasMode) return;
        currentMode = mode;
        document.body.classList.remove('rl-edit-mode', 'rl-comment-mode');
        var badge = document.getElementById('rl-mode-badge');
        if (mode === 'edit') {
          document.body.classList.add('rl-edit-mode');
          if (badge) badge.textContent = 'EDIT';
        } else if (mode === 'comment') {
          document.body.classList.add('rl-comment-mode');
          if (badge) badge.textContent = 'COMMENT';
        }
      }

      window.addEventListener('message', function(e) {
        if (!e.data) return;
        if (e.data.type === 'RANCANGLAB_SET_MODE') {
          applyMode(e.data.mode);
        }
      });

      // Intercept anchor navigation
      document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a) return;
        var href = a.getAttribute('href');
        if (!href) return;

        if (href.startsWith('#')) {
          e.preventDefault();
          var targetId = href.slice(1);
          var targetEl = document.getElementById(targetId) || document.querySelector('[data-rl-id=\"' + targetId + '\"]');
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
          return;
        }

        if (href.startsWith('http://') || href.startsWith('https://')) {
          e.preventDefault();
          window.open(href, '_blank', 'noopener,noreferrer');
          return;
        }

        // Relative link guard
        e.preventDefault();
        try {
          window.parent.postMessage({ type: 'RANCANGLAB_PREVIEW_NAVIGATE', href: href }, '*');
        } catch(err) {}
      }, true);

      if (isCanvasMode) {
        document.addEventListener('click', function(e) {
          var el = e.target.closest('[data-rl-id]');
          if (!el) return;

          e.preventDefault();
          e.stopPropagation();

          if (currentMode !== 'edit' && currentMode !== 'comment') {
            applyMode('edit');
            try {
              window.parent.postMessage({ type: 'RANCANGLAB_REQUEST_MODE', mode: 'edit' }, '*');
            } catch(err) {}
          }

          if (activeSelected) {
            activeSelected.classList.remove('rl-selected');
          }
          activeSelected = el;
          el.classList.add('rl-selected');

          var rlId = el.getAttribute('data-rl-id');
          var rlKind = el.getAttribute('data-rl-kind') || 'component';
          var secEl = el.closest('[data-rl-kind=\"section\"], [data-rl-id^=\"sec-\"]');
          var sectionId = secEl ? secEl.getAttribute('data-rl-id') : null;

          var textSnippet = (el.innerText || el.textContent || '').trim().slice(0, 45);

          try {
            window.parent.postMessage({
              type: 'UI_ELEMENT_SELECTED',
              target: {
                id: rlId,
                type: rlKind,
                section_id: sectionId
              },
              context: {
                tag: el.tagName.toLowerCase(),
                role: el.getAttribute('role') || el.getAttribute('aria-label') || null,
                text: textSnippet
              }
            }, '*');
          } catch (err) {}
        }, true);
      }

      try {
        window.parent.postMessage({ type: 'RANCANGLAB_IFRAME_READY' }, '*');
      } catch (e) {}
    })();
  <\/script>
<\/body>
<\/html>`
})
</script>

<template>
  <div class="w-full flex-1 flex flex-col relative overflow-hidden bg-transparent">
    <!-- Sandbox Header Indicator (Only in Sandbox mode) -->
    <div
      v-if="mode === 'sandbox'"
      class="h-6 px-3 bg-slate-900 border-b border-slate-800 text-[10px] font-mono text-emerald-400 flex items-center justify-between flex-shrink-0 select-none"
    >
      <span class="flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        Isolated Iframe Sandbox Runtime (Single Source of Truth)
      </span>
      <span class="text-slate-500">version: {{ version || 1 }}</span>
    </div>

    <!-- Active Artifact Iframe Runtime -->
    <div v-if="rawHtml" class="w-full flex-1 flex flex-col relative min-h-[500px]">
      <iframe
        :key="`${mode}-${version || 1}-${sourceHash}`"
        ref="iframeRef"
        :srcdoc="sandboxDoc"
        sandbox="allow-scripts allow-popups"
        class="w-full flex-1 border-0 block bg-transparent min-h-[550px]"
        :title="mode === 'canvas' ? 'Canvas Artifact Runtime' : 'Sandbox Artifact Runtime'"
      ></iframe>

      <!-- Canvas Editor Overlay (Selection Pill) -->
      <div
        v-if="mode === 'canvas' && (store.canvasMode.value === 'edit' || store.canvasMode.value === 'comment') && store.selectedTarget.value"
        class="sticky bottom-3 mx-4 p-2.5 rounded-xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/60 shadow-2xl flex items-center justify-between gap-3 text-xs text-slate-200 z-30 transition-all animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center flex-shrink-0">
            <Target class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <!-- Breadcrumb -->
            <div class="flex items-center gap-1 text-[10px] text-slate-400 font-mono truncate">
              <span>Page</span>
              <ChevronRight class="w-2.5 h-2.5 text-slate-600" />
              <span v-if="store.selectedTarget.value.section_id" class="text-indigo-300">
                {{ store.selectedTarget.value.section_id }}
                <ChevronRight class="w-2.5 h-2.5 text-slate-600 inline ml-1" />
              </span>
              <span class="text-emerald-400 font-semibold">{{ store.selectedTarget.value.id }}</span>
            </div>
            <!-- Selection context snippet -->
            <div class="text-[11px] text-slate-300 truncate mt-0.5 font-sans flex items-center gap-1.5">
              <span class="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 text-[9px] font-mono uppercase border border-indigo-800/60 font-semibold">
                {{ store.selectedTarget.value.type || 'component' }}
              </span>
              <span v-if="store.selectionContext.value?.text" class="italic text-slate-300 truncate">
                "{{ store.selectionContext.value.text }}"
              </span>
              <span v-else class="text-slate-400 font-mono text-[10px]">
                &lt;{{ store.selectionContext.value?.tag || 'element' }}&gt;
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-shrink-0">
          <span class="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
            Ketik prompt di chat untuk patch elemen ini
          </span>
          <button
            type="button"
            @click.stop="store.clearSelectedTarget()"
            class="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            title="Batal pilih elemen"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Empty Canvas Placeholder -->
    <div v-else class="flex-1 flex flex-col items-center justify-center p-16 text-center text-slate-500 text-xs min-h-[400px]">
      <FileText class="w-10 h-10 text-slate-600 mb-3 opacity-40" />
      <p class="font-semibold text-slate-300 text-sm">Kanvas UI Kosong</p>
      <p class="text-xs text-slate-500 mt-1 max-w-sm">Ketik prompt atau deskripsi antarmuka di panel chat untuk mulai mengompilasi desain.</p>
    </div>
  </div>
</template>
