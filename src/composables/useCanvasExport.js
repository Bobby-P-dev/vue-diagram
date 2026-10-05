import { toPng, toSvg } from 'html-to-image'
import { useVueFlow } from '@vue-flow/core'
import { useDiagramStore } from '../stores/diagramStore.js'

function triggerDownload(dataUrl, fileName) {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function resolveTargetElement(canvasElement) {
  let target = canvasElement

  if (typeof target === 'string') {
    target = document.querySelector(target)
  }

  if (!target && typeof document !== 'undefined') {
    target =
      document.querySelector('#diagram-canvas') ||
      document.querySelector('.vue-flow') ||
      document.querySelector('.vue-flow__viewport')
  }

  if (!target) {
    throw new Error(
      'resolveTargetElement: Target element `#diagram-canvas` or `.vue-flow` not found.',
    )
  }

  return target
}

function prepareSvgForExport(target) {
  if (!target || typeof target.querySelectorAll !== 'function') return

  // 1. Force fill="none" on all SVG edge paths to prevent solid black triangles
  const edgePaths = target.querySelectorAll(
    '.vue-flow__edge-path, .vue-flow__connection-path, .vue-flow__edge path, path[class*="edge-path"]'
  )
  edgePaths.forEach((path) => {
    path.setAttribute('fill', 'none')
    path.style.setProperty('fill', 'none', 'important')
    const stroke = path.getAttribute('stroke') || window.getComputedStyle(path).stroke
    if (!stroke || stroke === 'none') {
      path.setAttribute('stroke', '#94a3b8')
    }
    const strokeWidth = path.getAttribute('stroke-width') || window.getComputedStyle(path).strokeWidth
    if (!strokeWidth || strokeWidth === '0px') {
      path.setAttribute('stroke-width', '1.5')
    }
  })

  // 2. Ensure arrowheads / markers have visible fill
  const markers = target.querySelectorAll(
    'marker path, marker polyline, .vue-flow__arrowhead'
  )
  markers.forEach((marker) => {
    const currentFill = marker.getAttribute('fill')
    if (!currentFill || currentFill === 'none') {
      marker.setAttribute('fill', '#94a3b8')
      marker.style.setProperty('fill', '#94a3b8', 'important')
    }
  })
}

function calculateDiagramBounds(target) {
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  const root = target || document.querySelector('#diagram-canvas') || document

  // 1. Try Vue Flow instance state first
  try {
    const vueFlow = useVueFlow('diagram-canvas')
    const vfNodes = vueFlow?.getNodes?.value || (typeof vueFlow?.getNodes === 'function' ? vueFlow.getNodes() : [])
    if (Array.isArray(vfNodes) && vfNodes.length > 0) {
      for (const node of vfNodes) {
        if (node.hidden) continue

        const posX = typeof node.computedPosition?.x === 'number'
          ? node.computedPosition.x
          : typeof node.position?.x === 'number'
            ? node.position.x
            : 0

        const posY = typeof node.computedPosition?.y === 'number'
          ? node.computedPosition.y
          : typeof node.position?.y === 'number'
            ? node.position.y
            : 0

        let width = node.dimensions?.width
        let height = node.dimensions?.height

        const safeId = CSS?.escape ? CSS.escape(node.id) : node.id
        const domEl = root.querySelector(`.vue-flow__node[data-id="${safeId}"]`)
        if (domEl) {
          width = domEl.offsetWidth || domEl.clientWidth || width
          height = domEl.offsetHeight || domEl.clientHeight || height
        }

        if (!width || !height) {
          if (node.type === 'database') {
            width = width || 280
            height = height || 180
          } else if (node.type === 'ui_frame') {
            const isMobile = String(node.data?.device || '').toLowerCase() === 'mobile'
            width = width || (isMobile ? 375 : 1024)
            height = height || (isMobile ? 812 : 720)
          } else if (node.type === 'decision') {
            width = width || 160
            height = height || 84
          } else {
            width = width || 210
            height = height || 70
          }
        }

        minX = Math.min(minX, posX)
        minY = Math.min(minY, posY)
        maxX = Math.max(maxX, posX + width)
        maxY = Math.max(maxY, posY + height)
      }
    }
  } catch (_) {
    // Proceed to store / DOM inspection
  }

  // 2. Fallback: Try Diagram Store nodes
  if (!isFinite(minX) || !isFinite(maxX)) {
    try {
      const store = useDiagramStore()
      const storeNodes = store.nodes.value || []
      if (Array.isArray(storeNodes) && storeNodes.length > 0) {
        for (const node of storeNodes) {
          if (node.hidden) continue
          const posX = typeof node.position?.x === 'number' ? node.position.x : 0
          const posY = typeof node.position?.y === 'number' ? node.position.y : 0

          let width = 0
          let height = 0
          const safeId = CSS?.escape ? CSS.escape(node.id) : node.id
          const domEl = root.querySelector(`.vue-flow__node[data-id="${safeId}"]`)
          if (domEl) {
            width = domEl.offsetWidth || domEl.clientWidth || 0
            height = domEl.offsetHeight || domEl.clientHeight || 0
          }

          if (!width || !height) {
            if (node.type === 'database') {
              width = 280
              height = 180
            } else if (node.type === 'ui_frame') {
              const isMobile = String(node.data?.device || '').toLowerCase() === 'mobile'
              width = isMobile ? 375 : 1024
              height = isMobile ? 812 : 720
            } else if (node.type === 'decision') {
              width = 160
              height = 84
            } else {
              width = 210
              height = 70
            }
          }

          minX = Math.min(minX, posX)
          minY = Math.min(minY, posY)
          maxX = Math.max(maxX, posX + width)
          maxY = Math.max(maxY, posY + height)
        }
      }
    } catch (_) {}
  }

  // 3. Fallback: Measure from DOM elements directly
  if (!isFinite(minX) || !isFinite(maxX)) {
    const domNodes = root.querySelectorAll('.vue-flow__node')
    if (domNodes && domNodes.length > 0) {
      domNodes.forEach((el) => {
        let x = 0
        let y = 0
        const transform = el.style.transform || ''
        const match = transform.match(
          /translate(?:3d)?\(\s*(-?\d+(?:\.\d+)?)(?:px)?(?:\s*,\s*|\s+)(-?\d+(?:\.\d+)?)(?:px)?/,
        )
        if (match) {
          x = parseFloat(match[1])
          y = parseFloat(match[2])
        } else {
          x = el.offsetLeft || 0
          y = el.offsetTop || 0
        }
        const w = el.offsetWidth || el.clientWidth || 210
        const h = el.offsetHeight || el.clientHeight || 70
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x + w)
        maxY = Math.max(maxY, y + h)
      })
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return null
  }

  return {
    x: minX,
    y: minY,
    width: Math.max(maxX - minX, 100),
    height: Math.max(maxY - minY, 100),
  }
}

function sanitizeId(id) {
  return String(id || 'node').replace(/[^a-zA-Z0-9_]/g, '_')
}

function sanitizeLabel(label) {
  return String(label || '')
    .replace(/"/g, "'")
    .replace(/[\r\n]+/g, ' ')
}

export function generateMermaidCode(nodes = [], edges = [], diagramType = 'flowchart') {
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const safeEdges = Array.isArray(edges) ? edges : []
  const normType = String(diagramType || '').toLowerCase().trim()

  if (normType === 'erd' || normType === 'database') {
    let mermaid = 'erDiagram\n'
    const entities = safeNodes.filter((n) => n.type === 'database')

    entities.forEach((node) => {
      const entityName = sanitizeId(node.data?.label || node.id).toUpperCase()
      mermaid += `    ${entityName} {\n`
      const columns = Array.isArray(node.data?.columns) ? node.data.columns : []
      if (columns.length === 0) {
        mermaid += `        string id PK\n`
      } else {
        columns.forEach((col) => {
          const type = (col.type || 'string').replace(/[^a-zA-Z0-9]/g, '')
          const name = (col.name || 'field').replace(/[^a-zA-Z0-9_]/g, '')
          const constraint = col.is_pk ? 'PK' : col.is_fk ? 'FK' : ''
          mermaid += `        ${type} ${name} ${constraint}\n`
        })
      }
      mermaid += `    }\n`
    })

    safeEdges.forEach((edge) => {
      const srcNode = safeNodes.find((n) => n.id === edge.source)
      const tgtNode = safeNodes.find((n) => n.id === edge.target)
      const srcName = sanitizeId(srcNode?.data?.label || edge.source).toUpperCase()
      const tgtName = sanitizeId(tgtNode?.data?.label || edge.target).toUpperCase()
      const relLabel = sanitizeLabel(edge.label || 'relates')
      mermaid += `    ${srcName} ||--o{ ${tgtName} : "${relLabel}"\n`
    })

    return mermaid
  }

  if (normType === 'sequence') {
    let mermaid = 'sequenceDiagram\n    autonumber\n'
    safeNodes.forEach((node) => {
      const id = sanitizeId(node.id)
      const label = sanitizeLabel(node.data?.label || node.id)
      if (node.type === 'input') {
        mermaid += `    actor ${id} as ${label}\n`
      } else {
        mermaid += `    participant ${id} as ${label}\n`
      }
    })
    safeEdges.forEach((edge) => {
      const src = sanitizeId(edge.source)
      const tgt = sanitizeId(edge.target)
      const label = sanitizeLabel(edge.label || 'message')
      const arrow = edge.dashed ? '-->>' : '->>'
      mermaid += `    ${src}${arrow}${tgt}: ${label}\n`
    })
    return mermaid
  }

  if (normType === 'class' || normType === 'uml') {
    let mermaid = 'classDiagram\n'
    safeNodes.forEach((node) => {
      const className = sanitizeId(node.data?.label || node.id)
      mermaid += `    class ${className} {\n`
      const columns = Array.isArray(node.data?.columns) ? node.data.columns : []
      columns.forEach((col) => {
        const type = sanitizeId(col.type || 'String')
        const name = sanitizeLabel(col.name || 'field')
        mermaid += `        +${type} ${name}\n`
      })
      mermaid += `    }\n`
    })
    safeEdges.forEach((edge) => {
      const src = sanitizeId(edge.source)
      const tgt = sanitizeId(edge.target)
      const label = edge.label ? ` : ${sanitizeLabel(edge.label)}` : ''
      mermaid += `    ${src} --> ${tgt}${label}\n`
    })
    return mermaid
  }

  if (normType === 'state') {
    let mermaid = 'stateDiagram-v2\n'
    safeNodes.forEach((node) => {
      const id = sanitizeId(node.id)
      const label = sanitizeLabel(node.data?.label || node.id)
      if (node.type === 'input') {
        mermaid += `    [*] --> ${id}\n`
      }
      mermaid += `    ${id} : ${label}\n`
      if (node.type === 'output') {
        mermaid += `    ${id} --> [*]\n`
      }
    })
    safeEdges.forEach((edge) => {
      const src = sanitizeId(edge.source)
      const tgt = sanitizeId(edge.target)
      const label = edge.label ? ` : ${sanitizeLabel(edge.label)}` : ''
      mermaid += `    ${src} --> ${tgt}${label}\n`
    })
    return mermaid
  }

  if (normType === 'swimlane' || normType === 'bpmn') {
    let mermaid = 'flowchart LR\n'
    const lanes = {}
    const swimlaneNodes = safeNodes.filter((n) => n.type !== 'swimlane' && n.type !== 'swimlane_lane')

    swimlaneNodes.forEach((node) => {
      const laneName = (node.data?.lane || 'DEFAULT').toUpperCase()
      if (!lanes[laneName]) lanes[laneName] = []
      lanes[laneName].push(node)
    })

    Object.entries(lanes).forEach(([laneName, laneNodes]) => {
      mermaid += `    subgraph ${sanitizeId(laneName)} ["${laneName}"]\n`
      laneNodes.forEach((node) => {
        const id = sanitizeId(node.id)
        const label = sanitizeLabel(node.data?.label || node.id)
        if (node.type === 'decision') {
          mermaid += `        ${id}{"${label}"}\n`
        } else if (node.type === 'input' || node.type === 'output') {
          mermaid += `        ${id}(["${label}"])\n`
        } else {
          mermaid += `        ${id}["${label}"]\n`
        }
      })
      mermaid += `    end\n`
    })

    safeEdges.forEach((edge) => {
      const src = sanitizeId(edge.source)
      const tgt = sanitizeId(edge.target)
      const label = edge.label ? `|"${sanitizeLabel(edge.label)}"|` : ''
      const arrow = edge.dashed ? '-.->' : '-->'
      mermaid += `    ${src} ${arrow}${label} ${tgt}\n`
    })

    return mermaid
  }

  const isHorizontal = ['pipeline', 'cicd', 'sequence', 'state', 'workflow'].includes(normType)
  let mermaid = `flowchart ${isHorizontal ? 'LR' : 'TD'}\n`

  safeNodes.forEach((node) => {
    if (node.type === 'swimlane' || node.type === 'swimlane_lane') return
    const id = sanitizeId(node.id)
    const label = sanitizeLabel(node.data?.label || node.id)

    if (node.type === 'decision') {
      mermaid += `    ${id}{"${label}"}\n`
    } else if (node.type === 'database') {
      mermaid += `    ${id}[("${label}")]\n`
    } else if (node.type === 'input' || node.type === 'output') {
      mermaid += `    ${id}(["${label}"])\n`
    } else {
      mermaid += `    ${id}["${label}"]\n`
    }
  })

  safeEdges.forEach((edge) => {
    const src = sanitizeId(edge.source)
    const tgt = sanitizeId(edge.target)
    const label = edge.label ? `|"${sanitizeLabel(edge.label)}"|` : ''
    const arrow = edge.dashed ? '-.->' : '-->'
    mermaid += `    ${src} ${arrow}${label} ${tgt}\n`
  })

  return mermaid
}

export function useCanvasExport() {
  async function downloadAsPng(canvasElement, fileName = 'diagram.png') {
    try {
      const container = resolveTargetElement(canvasElement)
      prepareSvgForExport(container)

      // Target the inner transformation pane where all nodes and edges actually live
      const transformPane =
        container.querySelector('.vue-flow__transformationpane') ||
        container.querySelector('.vue-flow__viewport') ||
        container

      const bounds = calculateDiagramBounds(container)
      const padding = 36 // Tight, clean padding directly around content

      let exportWidth, exportHeight, exportTransform

      if (bounds) {
        exportWidth = Math.ceil(bounds.width + padding * 2)
        exportHeight = Math.ceil(bounds.height + padding * 2)
        // Reset scale to 1 and position (minX, minY) at (padding, padding)
        exportTransform = `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`
      } else {
        exportWidth = container.clientWidth || 1200
        exportHeight = container.clientHeight || 800
        exportTransform = 'translate(0, 0) scale(1)'
      }

      // Temporarily strip targeted-node blue rings during export
      const targetedEls = container.querySelectorAll('.targeted-node')
      targetedEls.forEach((el) => el.classList.remove('targeted-node'))

      try {
        const dataUrl = await toPng(transformPane, {
          backgroundColor: '#ffffff',
          width: exportWidth,
          height: exportHeight,
          style: {
            width: `${exportWidth}px`,
            height: `${exportHeight}px`,
            transform: exportTransform,
            transformOrigin: '0 0',
            position: 'relative',
            top: '0',
            left: '0',
            overflow: 'visible',
            backgroundColor: '#ffffff',
          },
          pixelRatio: 2, // High-Resolution 2x Retina Export
          filter: (node) => {
            if (node.classList) {
              return (
                !node.classList.contains('vue-flow__minimap') &&
                !node.classList.contains('vue-flow__controls') &&
                !node.classList.contains('vue-flow__panel') &&
                !node.classList.contains('vue-flow__background')
              )
            }
            return true
          },
        })
        triggerDownload(dataUrl, fileName)
        return dataUrl
      } finally {
        targetedEls.forEach((el) => el.classList.add('targeted-node'))
      }
    } catch (error) {
      throw new Error(`downloadAsPng failed: ${error.message}`)
    }
  }

  async function downloadAsSvg(canvasElement, fileName = 'diagram.svg') {
    try {
      const container = resolveTargetElement(canvasElement)
      prepareSvgForExport(container)

      const transformPane =
        container.querySelector('.vue-flow__transformationpane') ||
        container.querySelector('.vue-flow__viewport') ||
        container

      const bounds = calculateDiagramBounds(container)
      const padding = 36

      let exportWidth, exportHeight, exportTransform

      if (bounds) {
        exportWidth = Math.ceil(bounds.width + padding * 2)
        exportHeight = Math.ceil(bounds.height + padding * 2)
        exportTransform = `translate(${-bounds.x + padding}px, ${-bounds.y + padding}px) scale(1)`
      } else {
        exportWidth = container.clientWidth || 1200
        exportHeight = container.clientHeight || 800
        exportTransform = 'translate(0, 0) scale(1)'
      }

      const targetedEls = container.querySelectorAll('.targeted-node')
      targetedEls.forEach((el) => el.classList.remove('targeted-node'))

      try {
        const dataUrl = await toSvg(transformPane, {
          backgroundColor: '#ffffff',
          width: exportWidth,
          height: exportHeight,
          style: {
            width: `${exportWidth}px`,
            height: `${exportHeight}px`,
            transform: exportTransform,
            transformOrigin: '0 0',
            position: 'relative',
            top: '0',
            left: '0',
            overflow: 'visible',
            backgroundColor: '#ffffff',
          },
          filter: (node) => {
            if (node.classList) {
              return (
                !node.classList.contains('vue-flow__minimap') &&
                !node.classList.contains('vue-flow__controls') &&
                !node.classList.contains('vue-flow__panel') &&
                !node.classList.contains('vue-flow__background')
              )
            }
            return true
          },
        })
        triggerDownload(dataUrl, fileName)
        return dataUrl
      } finally {
        targetedEls.forEach((el) => el.classList.add('targeted-node'))
      }
    } catch (error) {
      throw new Error(`downloadAsSvg failed: ${error.message}`)
    }
  }

  async function copyMermaidToClipboard(nodes, edges, diagramType) {
    try {
      const code = generateMermaidCode(nodes, edges, diagramType)
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = code
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      return code
    } catch (error) {
      throw new Error(`copyMermaid failed: ${error.message}`)
    }
  }

  function downloadAsJson(project, nodes, edges, fileName = 'diagram.json') {
    try {
      const data = {
        exported_at: new Date().toISOString(),
        project: project || {},
        diagram_type: project?.diagram_type || 'flowchart',
        nodes: nodes || [],
        edges: edges || [],
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      triggerDownload(url, fileName)
      URL.revokeObjectURL(url)
    } catch (error) {
      throw new Error(`downloadAsJson failed: ${error.message}`)
    }
  }

  return {
    downloadAsPng,
    downloadAsSvg,
    copyMermaidToClipboard,
    downloadAsJson,
    generateMermaidCode,
  }
}

