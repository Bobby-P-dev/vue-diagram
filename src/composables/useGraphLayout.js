import dagre from 'dagre'

const NODE_DIMENSIONS = {
  decision: { width: 140, height: 70 },
  process: { width: 190, height: 56 },
  default: { width: 190, height: 56 },
  input: { width: 160, height: 48 },
  output: { width: 160, height: 48 },
  start: { width: 160, height: 48 },
  end: { width: 160, height: 48 },
  startend: { width: 160, height: 48 },
}

const LANE_COLORS = [
  { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.04)', headerBg: '#2563eb', text: '#ffffff' }, // Blue
  { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.04)', headerBg: '#d97706', text: '#ffffff' }, // Amber
  { border: '#a855f7', bg: 'rgba(168, 85, 247, 0.04)', headerBg: '#9333ea', text: '#ffffff' }, // Purple
  { border: '#10b981', bg: 'rgba(16, 185, 129, 0.04)', headerBg: '#059669', text: '#ffffff' }, // Green
  { border: '#64748b', bg: 'rgba(100, 116, 139, 0.04)', headerBg: '#475569', text: '#ffffff' }, // Slate
  { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.04)', headerBg: '#db2777', text: '#ffffff' }, // Pink
  { border: '#06b6d4', bg: 'rgba(6, 182, 212, 0.04)', headerBg: '#0891b2', text: '#ffffff' }, // Cyan
]

const LANE_HEIGHT = 220
const LANE_GAP = 20
const LANE_LEFT_OFFSET = 160
const LANE_TOP_OFFSET = 40
const NODE_MIN_GAP_X = 50

function getNodeDimensions(node) {
  if (node.type === 'ui_frame') {
    const isMobile = String(node.data?.device || '').toLowerCase() === 'mobile'
    const w = Number(node.data?.width) || (isMobile ? 375 : 1024)
    const h = Number(node.data?.height) || (isMobile ? 812 : 720)
    return { width: w, height: h }
  }
  if (node.type === 'database' || (node.data?.columns && node.data.columns.length > 0)) {
    const columns = Array.isArray(node.data?.columns) ? node.data.columns : []
    const colCount = columns.length || 3
    const labelLen = String(node.data?.label || '').length

    // Hitung estimasi lebar tabel berdasarkan baris terpanjang agar tidak terpotong
    let maxRowChars = labelLen + 10
    columns.forEach((col) => {
      const nameLen = String(col.name || '').length
      const typeLen = String(col.type || '').length
      const constraintLen = String(col.constraint || '').length
      const badgeLen = col.is_pk || col.is_fk ? 4 : 2
      const rowChars = badgeLen + nameLen + typeLen + constraintLen + 6
      if (rowChars > maxRowChars) {
        maxRowChars = rowChars
      }
    })

    const dynamicWidth = Math.max(280, Math.min(620, Math.round(maxRowChars * 7.6) + 48))
    const dynamicHeight = 48 + (colCount * 28) + 16

    return {
      width: dynamicWidth,
      height: dynamicHeight,
    }
  }
  if (node.type === 'decision') {
    return { width: 160, height: 84 }
  }
  if (node.type === 'input' || node.type === 'output' || node.type === 'start' || node.type === 'end') {
    return { width: 150, height: 46 }
  }
  
  const hasSubtitle = Boolean(node.data?.subtitle || node.data?.subText)
  const hasLane = Boolean(node.data?.lane)
  let h = 68
  if (hasSubtitle) h += 26
  if (hasLane) h += 20
  return {
    width: 210,
    height: h,
  }
}

export function useGraphLayout() {
  function layoutSwimlaneGraph(rawNodes = [], rawEdges = []) {
    // 1. Ekstrak unique lanes sesuai urutan kemunculan di nodes
    const uniqueLanes = []
    rawNodes.forEach((node) => {
      const lane = String(node.data?.lane || 'PROCESS').toUpperCase().trim()
      if (lane && !uniqueLanes.includes(lane)) {
        uniqueLanes.push(lane)
      }
    })

    if (uniqueLanes.length === 0) {
      uniqueLanes.push('PROCESS')
    }

    // 2. Gunakan Dagre LR untuk menghitung urutan sekuensial langkah horizontal (X)
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({
      rankdir: 'LR',
      nodesep: 60,
      ranksep: 130,
    })

    rawNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node)
      dagreGraph.setNode(node.id, { width, height })
    })

    rawEdges.forEach((edge) => {
      if (edge.source && edge.target) {
        dagreGraph.setEdge(edge.source, edge.target)
      }
    })

    dagre.layout(dagreGraph)

    // 3. Kunci koordinat vertikal Y ke garis tengah jalur (lane) masing-masing
    const laneNodesMap = {}
    uniqueLanes.forEach((lane) => {
      laneNodesMap[lane] = []
    })

    const initialPositioned = rawNodes.map((node) => {
      const { width, height } = getNodeDimensions(node)
      const dagreNode = dagreGraph.node(node.id) || { x: 100, y: 100 }
      const laneName = String(node.data?.lane || uniqueLanes[0]).toUpperCase().trim()
      let laneIndex = uniqueLanes.indexOf(laneName)
      if (laneIndex === -1) laneIndex = 0

      const laneY = LANE_TOP_OFFSET + laneIndex * (LANE_HEIGHT + LANE_GAP)
      const laneCenterY = laneY + LANE_HEIGHT / 2

      const nodeObj = {
        id: node.id,
        type: node.type,
        data: {
          ...(node.data || {}),
          lane: laneName,
        },
        width,
        height,
        position: {
          x: Math.max(LANE_LEFT_OFFSET + 30, LANE_LEFT_OFFSET + dagreNode.x - width / 2),
          y: laneCenterY - height / 2,
        },
      }

      if (laneNodesMap[laneName]) {
        laneNodesMap[laneName].push(nodeObj)
      }
      return nodeObj
    })

    // 4. Anti-collision: Cegah node bertumpuk secara horizontal di jalur yang sama
    uniqueLanes.forEach((lane) => {
      const nodesInLane = laneNodesMap[lane]
      if (nodesInLane && nodesInLane.length > 1) {
        nodesInLane.sort((a, b) => a.position.x - b.position.x)
        for (let i = 1; i < nodesInLane.length; i++) {
          const prev = nodesInLane[i - 1]
          const curr = nodesInLane[i]
          const minX = prev.position.x + prev.width + NODE_MIN_GAP_X
          if (curr.position.x < minX) {
            curr.position.x = minX
          }
        }
      }
    })

    // 5. Hitung batas lebar maksimum canvas dan geometri tiap jalur
    let maxX = 1200
    initialPositioned.forEach((node) => {
      const rightEdge = node.position.x + node.width + 120
      if (rightEdge > maxX) maxX = rightEdge
    })

    const lanes = uniqueLanes.map((laneName, idx) => {
      const laneY = LANE_TOP_OFFSET + idx * (LANE_HEIGHT + LANE_GAP)
      const colorScheme = LANE_COLORS[idx % LANE_COLORS.length]
      return {
        id: `lane-${idx}`,
        name: laneName,
        x: 20,
        y: laneY,
        width: maxX - 20,
        height: LANE_HEIGHT,
        color: colorScheme.border,
        headerBg: colorScheme.headerBg,
        bg: colorScheme.bg,
        text: colorScheme.text,
      }
    })

    const resultNodes = initialPositioned.map((n) => ({
      id: n.id,
      type: n.type,
      data: n.data,
      position: n.position,
    }))
    resultNodes.lanes = lanes

    return resultNodes
  }

  function layoutGraph(rawNodes = [], rawEdges = [], direction = 'TB', diagramType = '') {
    if (!Array.isArray(rawNodes) || !Array.isArray(rawEdges)) {
      throw new Error('layoutGraph: `rawNodes` and `rawEdges` must be arrays')
    }

    if (rawNodes.length === 0) {
      const empty = []
      empty.lanes = []
      return empty
    }

    const resolvedDirection =
      typeof direction === 'string'
        ? direction
        : direction?.direction || 'TB'

    // Deteksi apakah diagram bertipe ERD / Database atau berisi struktur tabel database
    const normalizedType = String(diagramType || '').toLowerCase().trim()
    const isDatabaseOrErd =
      normalizedType === 'erd' ||
      normalizedType === 'database' ||
      rawNodes.some((n) => n.type === 'database' || (Array.isArray(n.data?.columns) && n.data.columns.length > 0))

    // Swimlane layout HANYA diperuntukkan bagi diagram Swimlane / BPMN, dan BUKAN untuk struktur tabel ERD
    const isSwimlane =
      (normalizedType === 'swimlane' || normalizedType === 'bpmn') &&
      !isDatabaseOrErd

    const hasLanes = isSwimlane && rawNodes.some((n) => Boolean(n.data?.lane && String(n.data.lane).trim() !== ''))
    if (hasLanes) {
      return layoutSwimlaneGraph(rawNodes, rawEdges)
    }

    // Jika semua node adalah UI Frame dan tidak ada edge, pertahankan posisi koordinat
    const allUiFrames = rawNodes.length > 0 && rawNodes.every((n) => n.type === 'ui_frame')
    if (allUiFrames && rawEdges.length === 0) {
      let currentX = 60
      const layoutedNodes = rawNodes.map((node) => {
        const { width } = getNodeDimensions(node)
        const posX = node.position?.x !== undefined ? node.position.x : currentX
        const posY = node.position?.y !== undefined ? node.position.y : 60
        currentX = Math.max(currentX + width + 80, posX + width + 80)
        return {
          id: node.id,
          type: node.type,
          data: node.data,
          position: {
            x: posX,
            y: posY,
          },
        }
      })
      layoutedNodes.lanes = []
      return layoutedNodes
    }

    // Layout Dagre Standar untuk diagram non-swimlane (ERD, Flowchart, Architecture, dll)
    const dagreGraph = new dagre.graphlib.Graph()
    dagreGraph.setDefaultEdgeLabel(() => ({}))
    dagreGraph.setGraph({
      rankdir: resolvedDirection,
      nodesep: isDatabaseOrErd ? 120 : 80,
      ranksep: isDatabaseOrErd ? 160 : 120,
    })

    rawNodes.forEach((node) => {
      const { width, height } = getNodeDimensions(node)
      dagreGraph.setNode(node.id, { width, height })
    })

    rawEdges.forEach((edge) => {
      if (edge.source && edge.target) {
        dagreGraph.setEdge(edge.source, edge.target)
      }
    })

    dagre.layout(dagreGraph)

    const layoutedNodes = rawNodes.map((node) => {
      const { width, height } = getNodeDimensions(node)
      const nodeWithPosition = dagreGraph.node(node.id)

      return {
        id: node.id,
        type: node.type,
        data: node.data,
        position: {
          x: nodeWithPosition.x - width / 2,
          y: nodeWithPosition.y - height / 2,
        },
      }
    })

    layoutedNodes.lanes = []
    return layoutedNodes
  }

  return {
    layoutGraph,
    layoutSwimlaneGraph,
    getNodeDimensions,
    LANE_COLORS,
    LANE_HEIGHT,
  }
}
