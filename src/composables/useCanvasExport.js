import { toPng, toSvg } from 'html-to-image'

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

  if (diagramType === 'erd') {
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

  if (diagramType === 'swimlane') {
    let mermaid = 'flowchart LR\n'
    const lanes = {}
    const swimlaneNodes = safeNodes.filter((n) => n.type !== 'swimlane_lane')

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

  const isHorizontal = diagramType === 'pipeline'
  let mermaid = `flowchart ${isHorizontal ? 'LR' : 'TD'}\n`

  safeNodes.forEach((node) => {
    if (node.type === 'swimlane_lane') return
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
      const target = resolveTargetElement(canvasElement)
      prepareSvgForExport(target)

      const dataUrl = await toPng(target, {
        backgroundColor: '#ffffff',
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
    } catch (error) {
      throw new Error(`downloadAsPng failed: ${error.message}`)
    }
  }

  async function downloadAsSvg(canvasElement, fileName = 'diagram.svg') {
    try {
      const target = resolveTargetElement(canvasElement)
      prepareSvgForExport(target)

      const dataUrl = await toSvg(target, {
        backgroundColor: '#ffffff',
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
