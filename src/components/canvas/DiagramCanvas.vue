<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Background, BackgroundVariant } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import StartEndNode from '../nodes/StartEndNode.vue'
import ProcessNode from '../nodes/ProcessNode.vue'
import DecisionNode from '../nodes/DecisionNode.vue'
import DatabaseNode from '../nodes/DatabaseNode.vue'
import SwimlaneLaneNode from '../nodes/SwimlaneLaneNode.vue'
import UiFrameNode from '../ui-design/UiFrameNode.vue'
import CanvasSearchBar from './CanvasSearchBar.vue'
import { useGraphLayout } from '../../composables/useGraphLayout.js'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  edges: {
    type: Array,
    default: () => [],
  },
  direction: {
    type: String,
    default: 'TB',
  },
  diagramType: {
    type: String,
    default: '',
  },
})

const { fitView, zoomIn, zoomOut, zoomTo, viewport } = useVueFlow('diagram-canvas')
const { layoutGraph } = useGraphLayout()
const store = useDiagramStore()

const layoutedNodes = ref([])
const layoutedEdges = ref([])

const zoomPercentage = computed(() => {
  if (!viewport.value?.zoom) return 100
  return Math.round(viewport.value.zoom * 100)
})

function handleResetZoom() {
  zoomTo(1, { duration: 300 })
}

const isSearchOpen = ref(false)

function handleFocusNode(nodeId) {
  if (!nodeId) return
  store.selectNode(nodeId)
  nextTick(() => {
    fitView({
      nodes: [nodeId],
      padding: 0.8,
      duration: 600,
      maxZoom: 1.2,
    })
  })
}

function applySelectedClasses() {
  const selected = store.selectedNodes.value || []
  for (const node of layoutedNodes.value) {
    if (node.type !== 'swimlane') {
      node.class = selected.includes(node.id) ? 'targeted-node' : ''
    }
  }
}

watch(
  () => [props.nodes, props.edges, props.direction, props.diagramType, store.activeProject.value?.diagram_type],
  ([newNodes, newEdges, direction, propDiagramType, activeDiagramType]) => {
    if (!newNodes || newNodes.length === 0) {
      layoutedNodes.value = []
      layoutedEdges.value = []
      store.setLanes([])
      return
    }

    const effectiveType = String(propDiagramType || activeDiagramType || '').toLowerCase().trim()
    const isDatabaseOrErd =
      effectiveType === 'erd' ||
      effectiveType === 'database' ||
      newNodes.some((n) => n.type === 'database' || (Array.isArray(n.data?.columns) && n.data.columns.length > 0))

    const isSwimlane = (effectiveType === 'swimlane' || effectiveType === 'bpmn') && !isDatabaseOrErd

    const positioned = layoutGraph(newNodes, newEdges, direction, effectiveType)
    const lanes = isSwimlane ? (positioned.lanes || []) : []
    store.setLanes(lanes)

    const selected = store.selectedNodes.value || []
    const regularNodes = positioned.map((node) => ({
      ...node,
      class: selected.includes(node.id) ? 'targeted-node' : '',
    }))

    // Generate visual swimlane strip nodes behind regular nodes ONLY IF swimlane
    const laneNodes = isSwimlane
      ? lanes.map((lane) => ({
          id: `swimlane-${lane.id}`,
          type: 'swimlane',
          position: { x: lane.x, y: lane.y },
          data: lane,
          selectable: false,
          draggable: false,
          connectable: false,
          zIndex: -1,
        }))
      : []

    layoutedNodes.value = [...laneNodes, ...regularNodes]
    layoutedEdges.value = [...newEdges]

    nextTick(() => {
      fitView({ padding: 0.2, duration: 600, minZoom: 0.02, maxZoom: 1.5 })
    })
  },
  { immediate: true, deep: true },
)

watch(
  () => [...store.selectedNodes.value],
  () => {
    applySelectedClasses()
  },
  { deep: true },
)

function onNodeClick(e) {
  if (e.node?.type === 'swimlane' || String(e.node?.id || '').startsWith('swimlane-')) {
    return
  }
  store.toggleNodeSelection(e.node.id)
}

function onPaneClick() {
  store.clearNodeSelection()
}

function enforceEdgeFillNone() {
  const edgePaths = document.querySelectorAll(
    '#diagram-canvas .vue-flow__edge-path, #diagram-canvas .vue-flow__connection-path, #diagram-canvas .vue-flow__edge path'
  )
  edgePaths.forEach((path) => {
    if (path.getAttribute('fill') !== 'none') {
      path.setAttribute('fill', 'none')
      path.style.setProperty('fill', 'none', 'important')
    }
  })
}

function handleKeyDown(e) {
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return
  if (e.key === '=' || e.key === '+') {
    e.preventDefault()
    zoomIn({ duration: 200 })
  } else if (e.key === '-' || e.key === '_') {
    e.preventDefault()
    zoomOut({ duration: 200 })
  } else if (e.key === '0' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    fitView({ padding: 0.2, duration: 400, minZoom: 0.02, maxZoom: 1.5 })
  }
}

let edgeObserver = null

onMounted(() => {
  const canvasEl = document.getElementById('diagram-canvas')
  if (canvasEl && typeof MutationObserver !== 'undefined') {
    edgeObserver = new MutationObserver(() => {
      enforceEdgeFillNone()
    })
    edgeObserver.observe(canvasEl, { childList: true, subtree: true, attributes: false })
  }
  enforceEdgeFillNone()
  window.addEventListener('keydown', handleKeyDown)
})

onBeforeUnmount(() => {
  if (edgeObserver) {
    edgeObserver.disconnect()
    edgeObserver = null
  }
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="relative w-full h-full overflow-hidden">
    <!-- Quick Canvas Search & Navigator -->
    <CanvasSearchBar
      :nodes="layoutedNodes"
      v-model:is-open="isSearchOpen"
      @focus-node="handleFocusNode"
    />

    <VueFlow
      id="diagram-canvas"
      class="w-full h-full"
    v-model:nodes="layoutedNodes"
    v-model:edges="layoutedEdges"
    :min-zoom="0.02"
    :max-zoom="5"
    :fit-view-on-init="true"
    @node-click="onNodeClick"
    @pane-click="onPaneClick"
  >
    <template #node-swimlane="nodeProps">
      <SwimlaneLaneNode v-bind="nodeProps" />
    </template>
    <template #node-input="nodeProps">
      <StartEndNode v-bind="nodeProps" />
    </template>
    <template #node-output="nodeProps">
      <StartEndNode v-bind="nodeProps" />
    </template>
    <template #node-default="nodeProps">
      <ProcessNode v-bind="nodeProps" />
    </template>
    <template #node-decision="nodeProps">
      <DecisionNode v-bind="nodeProps" />
    </template>
    <template #node-database="nodeProps">
      <DatabaseNode v-bind="nodeProps" />
    </template>
    <template #node-ui_frame="nodeProps">
      <UiFrameNode v-bind="nodeProps" />
    </template>

    <Background
      :variant="BackgroundVariant.Dots"
      :gap="16"
      :size="1"
      pattern-color="#cbd5e1"
    />
    <Controls position="bottom-right">
      <template #top>
        <button
          type="button"
          class="vue-flow__controls-button !w-auto !px-1.5 !h-7 !text-[10px] !font-mono font-bold text-slate-700 bg-white select-none text-center cursor-pointer hover:bg-slate-100 hover:text-indigo-600 border-b border-slate-200 transition-colors"
          title="Zoom Level (Klik untuk reset ke 100%)"
          @click="handleResetZoom"
        >
          {{ zoomPercentage }}%
        </button>
      </template>
    </Controls>
    <MiniMap position="bottom-left" />
    </VueFlow>
  </div>
</template>

<style scoped>
:deep(.vue-flow__node-swimlane) {
  pointer-events: none !important;
  cursor: default !important;
  z-index: -1 !important;
}

:deep(.vue-flow__node.targeted-node) {
  box-shadow: 0 0 0 4px rgba(79, 70, 229, 0.4), 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
  border-radius: 12px;
  transform: scale(1.03);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 100 !important;
}

:deep(.vue-flow__node.targeted-node > div) {
  border-color: #4f46e5 !important;
}
</style>
