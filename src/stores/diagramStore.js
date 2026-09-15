import { ref, computed } from 'vue'
import { MarkerType } from '@vue-flow/core'
import { useDiagramApi } from '../composables/useDiagramApi.js'
import { normalizeUIFrameNode } from '../utils/uiFrameNormalizer.js'

const NODE_TYPE_MAP = {
  start: 'input',
  input: 'input',
  end: 'output',
  output: 'output',
  process: 'default',
  task: 'default',
  step: 'default',
  default: 'default',
  decision: 'decision',
  condition: 'decision',
  database: 'database',
  table: 'database',
  entity: 'database',
  erd: 'database',
  ui_frame: 'ui_frame',
}

function normalizeNodeType(rawType) {
  if (!rawType) return 'default'
  const lower = String(rawType).toLowerCase()
  if (lower === 'ui_frame' || lower === 'uiframe') return 'ui_frame'
  return NODE_TYPE_MAP[lower] || 'default'
}

function normalizeNodes(rawNodes = []) {
  return rawNodes.map((node, index) => {
    if (node.type === 'ui_frame') {
      return normalizeUIFrameNode({
        id: String(node.id ?? `ui-frame-${index + 1}`),
        type: 'ui_frame',
        data: node.data || {},
        position: node.position || { x: 60, y: 60 },
      })
    }

    const columns = node.data?.columns || node.columns || []
    const hasColumns = Array.isArray(columns) && columns.length > 0
    const rawType = hasColumns ? 'database' : (node.type || 'default')
    const isDatabaseTable = rawType === 'database' || rawType === 'table' || rawType === 'erd' || hasColumns

    return {
      id: String(node.id ?? `node-${index}`),
      type: normalizeNodeType(rawType),
      data: {
        label: node.label ?? node.data?.label ?? 'Untitled',
        subText: node.subText ?? node.data?.subText ?? node.data?.subtitle ?? '',
        lane: isDatabaseTable ? '' : (node.data?.lane ?? node.lane ?? ''),
        icon: node.data?.icon ?? node.icon ?? '',
        columns: columns,
        ...(node.data || {}),
        ...(isDatabaseTable ? { lane: '' } : {}),
      },
      position: node.position || { x: 0, y: 0 },
    }
  })
}

export function normalizeEdges(rawEdges = []) {
  return rawEdges.map((edge, index) => {
    const isDashed = Boolean(edge.dashed || edge.data?.dashed || edge.style?.strokeDasharray)
    return {
      id: String(edge.id ?? `edge-${index}`),
      source: String(edge.source),
      target: String(edge.target),
      sourceHandle: edge.sourceHandle ?? edge.source_handle ?? undefined,
      label: edge.label ?? '',
      type: edge.type || 'smoothstep',
      animated: Boolean(edge.animated),
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: '#94a3b8',
      },
      style: {
        stroke: '#94a3b8',
        strokeWidth: 1.5,
        fill: 'none',
        ...(isDashed ? { strokeDasharray: '5,5' } : {}),
      },
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 6,
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
      labelStyle: { fill: '#475569', fontWeight: 600, fontSize: 11 },
      dashed: isDashed,
    }
  })
}

const projectsList = ref([])
const projectsTotal = ref(0)
const projectsHasMore = ref(false)
const isProjectsLoadingMore = ref(false)
const activeProject = ref(null)
const chatHistory = ref([])
const nodes = ref([])
const edges = ref([])
const selectedNodes = ref([])
const currentLanes = ref([])
const projectVersions = ref([])
const isLoadingVersions = ref(false)
const templatesList = ref([])
const uiTemplatesList = ref([])
const activeFoundationId = ref('ramp')

const isGenerating = ref(false)
const isSidebarLoading = ref(false)
const errorMessage = ref('')

const hasDiagram = computed(() => nodes.value.length > 0)
const activeDiagramType = computed(() => activeProject.value?.diagram_type || 'flowchart')

export function useDiagramStore() {
  function setActiveFoundation(id) {
    if (id) activeFoundationId.value = id
  }
  const {
    createProject,
    sendChat,
    getProjects,
    togglePinProject,
    getProjectDetails,
    getVersions,
    rollbackVersion,
    getTemplates,
    getUiTemplates,
    createUiDesign,
    sendUiDesignChat,
  } = useDiagramApi()

  function clearError() {
    errorMessage.value = ''
  }

  function setProjectState(projectData) {
    activeProject.value = projectData
    chatHistory.value = projectData?.messages || []

    const rawNodes = Array.isArray(projectData?.nodes) 
      ? projectData.nodes 
      : Array.isArray(projectData?.current_nodes) 
        ? projectData.current_nodes 
        : []
        
    const rawEdges = Array.isArray(projectData?.edges) 
      ? projectData.edges 
      : Array.isArray(projectData?.current_edges) 
        ? projectData.current_edges 
        : []

    nodes.value = normalizeNodes(rawNodes)
    edges.value = normalizeEdges(rawEdges)
    currentLanes.value = []
  }

  function setLanes(lanes) {
    currentLanes.value = Array.isArray(lanes) ? lanes : []
  }

  function sortProjectsList() {
    projectsList.value.sort((a, b) => {
      const pinA = a.is_pinned ? 1 : 0
      const pinB = b.is_pinned ? 1 : 0
      if (pinA !== pinB) return pinB - pinA
      const timeA = new Date(a.updated_at || a.created_at || 0).getTime()
      const timeB = new Date(b.updated_at || b.created_at || 0).getTime()
      return timeB - timeA
    })
  }

  async function loadSidebar(reset = true) {
    if (reset) {
      isSidebarLoading.value = true
    }
    try {
      const data = await getProjects({ limit: 15, offset: 0 })
      if (data && Array.isArray(data.items)) {
        projectsList.value = data.items
        projectsTotal.value = data.total_count ?? data.items.length
        projectsHasMore.value = Boolean(data.has_more)
      } else if (Array.isArray(data)) {
        projectsList.value = data
        projectsTotal.value = data.length
        projectsHasMore.value = false
      }
      sortProjectsList()
    } catch (err) {
      console.error('Failed to load projects:', err)
      errorMessage.value = err.message || 'Failed to load projects'
    } finally {
      if (reset) {
        isSidebarLoading.value = false
      }
    }
  }

  async function loadMoreProjects() {
    if (isProjectsLoadingMore.value || !projectsHasMore.value) return
    isProjectsLoadingMore.value = true
    try {
      const currentOffset = projectsList.value.length
      const data = await getProjects({ limit: 15, offset: currentOffset })
      if (data && Array.isArray(data.items)) {
        const existingIds = new Set(projectsList.value.map(p => p.id))
        const newItems = data.items.filter(p => !existingIds.has(p.id))
        projectsList.value = [...projectsList.value, ...newItems]
        projectsTotal.value = data.total_count ?? projectsList.value.length
        projectsHasMore.value = Boolean(data.has_more)
        sortProjectsList()
      } else {
        projectsHasMore.value = false
      }
    } catch (err) {
      console.error('Failed to load more projects:', err)
    } finally {
      isProjectsLoadingMore.value = false
    }
  }

  async function togglePin(projectId) {
    if (!projectId) return

    const index = projectsList.value.findIndex(p => p.id === projectId)
    if (index === -1) return

    const previousState = Boolean(projectsList.value[index].is_pinned)
    const newState = !previousState

    // Optimistic update
    projectsList.value[index] = {
      ...projectsList.value[index],
      is_pinned: newState,
      updated_at: new Date().toISOString()
    }
    sortProjectsList()

    try {
      const res = await togglePinProject(projectId)
      if (res && typeof res.is_pinned === 'boolean') {
        const target = projectsList.value.find(p => p.id === projectId)
        if (target) {
          target.is_pinned = res.is_pinned
          sortProjectsList()
        }
      }
    } catch (err) {
      console.error('Failed to toggle pin:', err)
      // Revert optimistic update
      const target = projectsList.value.find(p => p.id === projectId)
      if (target) {
        target.is_pinned = previousState
        sortProjectsList()
      }
      errorMessage.value = err.message || 'Gagal mengubah status pin project'
    }
  }

  async function openProject(id) {
    if (!id) return false
    
    isGenerating.value = true
    errorMessage.value = ''
    try {
      const data = await getProjectDetails(id)
      setProjectState(data)
      selectedNodes.value = []
      loadProjectVersions(id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Failed to load project details'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function createBlankProject(mode = 'ui_design', device = 'web', themeMode = 'dark') {
    isGenerating.value = true
    errorMessage.value = ''

    // IMMEDIATELY clean the canvas
    nodes.value = []
    edges.value = []
    chatHistory.value = []
    selectedNodes.value = []
    currentLanes.value = []
    activeProject.value = {
      id: null,
      title: mode === 'ui_design' ? 'Untitled UI Design' : 'Untitled Project',
      diagram_type: mode === 'ui_design' ? 'ui_design' : 'flowchart',
      project_mode: mode === 'ui_design' ? 'ui_design' : 'diagram',
    }

    try {
      let data
      if (mode === 'ui_design') {
        data = await createUiDesign({
          prompt: '',
          device,
          themeMode,
          foundation: activeFoundationId.value || 'ramp',
        })
      } else {
        data = await createProject('', mode)
      }

      setProjectState(data)
      await loadSidebar()
      if (data?.id) loadProjectVersions(data.id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Gagal membuat canvas baru'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function startNewProject(prompt, diagramType = 'flowchart', templateId = null) {
    isGenerating.value = true
    errorMessage.value = ''

    // IMMEDIATELY reset canvas so previous project is not visible / updated in place
    nodes.value = []
    edges.value = []
    chatHistory.value = []
    selectedNodes.value = []
    currentLanes.value = []
    activeProject.value = {
      id: null,
      title: prompt ? `Merancang: ${prompt.slice(0, 30)}...` : 'Project Baru',
      diagram_type: diagramType,
    }

    try {
      const data = await createProject(prompt, diagramType, templateId)
      setProjectState(data)
      selectedNodes.value = []
      await loadSidebar()
      if (data?.id) loadProjectVersions(data.id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Failed to create new project'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function startNewUiDesignProject({
    prompt = '',
    device = 'web',
    theme = 'Modern Custom',
    themeMode = null,
    accentColor = null,
    customTone = null,
    templateId = null,
    foundation = null,
    archetype = null,
    density = null,
    productContext = null,
    primaryUser = null,
    primaryTask = null,
  } = {}) {
    isGenerating.value = true
    errorMessage.value = ''

    // IMMEDIATELY reset canvas so previous project is not visible / updated in place
    nodes.value = []
    edges.value = []
    chatHistory.value = []
    selectedNodes.value = []
    currentLanes.value = []
    activeProject.value = {
      id: null,
      title: prompt ? `Merancang: ${prompt.slice(0, 30)}...` : 'UI Design Baru',
      diagram_type: 'ui_design',
      project_mode: 'ui_design',
    }

    try {
      const chosenFoundation = foundation || activeFoundationId.value || 'ramp'
      activeFoundationId.value = chosenFoundation
      const data = await createUiDesign({
        prompt,
        device,
        theme,
        themeMode,
        accentColor,
        customTone,
        templateId,
        foundation: chosenFoundation,
        archetype,
        density,
        productContext,
        primaryUser,
        primaryTask,
      })
      setProjectState(data)
      selectedNodes.value = []
      await loadSidebar()
      if (data?.id) loadProjectVersions(data.id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Failed to create UI design project'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function sendFollowUpChat(prompt) {
    if (!activeProject.value?.id) {
      errorMessage.value = 'No active project to update'
      return false
    }
    
    isGenerating.value = true
    errorMessage.value = ''
    
    // Optimistic UI update for the chat
    chatHistory.value.push({
      id: `temp-${Date.now()}`,
      role: 'user',
      content: prompt,
      target_node_ids: selectedNodes.value.length ? [...selectedNodes.value] : null,
      created_at: new Date().toISOString()
    })

    try {
      const isUiDesign =
        activeProject.value?.project_mode === 'ui_design' ||
        activeProject.value?.diagram_type === 'ui_design'

      const data = isUiDesign
        ? await sendUiDesignChat(activeProject.value.id, prompt, activeFoundationId.value)
        : await sendChat(activeProject.value.id, prompt, selectedNodes.value)

      setProjectState(data)
      selectedNodes.value = []
      if (activeProject.value?.id) loadProjectVersions(activeProject.value.id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Failed to send chat'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function loadProjectVersions(projectId) {
    if (!projectId) return
    isLoadingVersions.value = true
    try {
      const data = await getVersions(projectId)
      projectVersions.value = Array.isArray(data) ? data : []
    } catch (err) {
      console.error('Failed to load versions:', err)
      projectVersions.value = []
    } finally {
      isLoadingVersions.value = false
    }
  }

  async function rollbackToVersion(versionId) {
    if (!activeProject.value?.id || !versionId) return false
    isGenerating.value = true
    errorMessage.value = ''
    try {
      const data = await rollbackVersion(activeProject.value.id, versionId)
      setProjectState(data)
      await loadProjectVersions(activeProject.value.id)
      return true
    } catch (err) {
      errorMessage.value = err.message || 'Failed to rollback version'
      return false
    } finally {
      isGenerating.value = false
    }
  }

  async function loadTemplates() {
    try {
      const data = await getTemplates()
      templatesList.value = Array.isArray(data) ? data : []
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  async function loadUiTemplates() {
    try {
      const data = await getUiTemplates()
      uiTemplatesList.value = Array.isArray(data) ? data : []
    } catch (err) {
      console.error('Failed to load UI templates:', err)
    }
  }

  function toggleNodeSelection(nodeId) {
    const index = selectedNodes.value.indexOf(nodeId)
    if (index === -1) {
      selectedNodes.value.push(nodeId)
    } else {
      selectedNodes.value.splice(index, 1)
    }
  }

  function selectNode(nodeId) {
    selectedNodes.value = nodeId ? [nodeId] : []
  }

  function clearNodeSelection() {
    selectedNodes.value = []
  }

  return {
    selectNode,
    projectsList,
    projectsTotal,
    projectsHasMore,
    isProjectsLoadingMore,
    activeProject,
    chatHistory,
    nodes,
    edges,
    selectedNodes,
    isGenerating,
    isSidebarLoading,
    errorMessage,
    hasDiagram,
    activeDiagramType,
    currentLanes,
    projectVersions,
    isLoadingVersions,
    templatesList,
    uiTemplatesList,
    setLanes,
    
    activeFoundationId,
    setActiveFoundation,
    loadSidebar,
    loadMoreProjects,
    togglePin,
    openProject,
    createBlankProject,
    startNewProject,
    startNewUiDesignProject,
    sendFollowUpChat,
    loadProjectVersions,
    rollbackToVersion,
    loadTemplates,
    loadUiTemplates,
    toggleNodeSelection,
    clearNodeSelection,
    clearError,
  }
}
