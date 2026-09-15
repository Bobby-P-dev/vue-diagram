/**
 * Canonical UI Frame Normalizer
 *
 * Enforces the Single Source of Truth architecture:
 * UI_FRAME
 *  ├── canvas (Presentation only: position, device, width, height, title)
 *  ├── design_state (Source of truth: requirement_spec [WHAT], design_spec [HOW])
 *  ├── implementation (Generated Vue + Tailwind code, build metadata)
 *  └── audit (Evaluation only: validation, requirement_coverage, anti_slop)
 *
 * Guarantees 100% backward compatibility for legacy projects loaded from PostgreSQL.
 */

export function normalizeUIFrameNode(node) {
  if (!node || typeof node !== 'object') return node
  const rawData = node.data || {}

  // 1. CANVAS PRESENTATION (Position, Device, Width, Height, Title)
  const device = String(rawData.canvas?.device || rawData.device || 'web').toLowerCase()
  const defaultWidth = device === 'mobile' ? 375 : 1024
  const defaultHeight = device === 'mobile' ? 812 : 720

  const canvas = {
    position: rawData.canvas?.position || node.position || { x: 60, y: 60 },
    device: device,
    width: Number(rawData.canvas?.width || rawData.width) || defaultWidth,
    height: Number(rawData.canvas?.height || rawData.height) || defaultHeight,
    title: rawData.canvas?.title || rawData.title || 'UI Design Frame',
  }

  // 2. DESIGN STATE (Requirement Spec + Design Spec)
  const reqSpec = rawData.design_state?.requirement_spec || rawData.requirement_spec || null
  const rawSections = rawData.design_state?.design_spec?.sections || rawData.sections || []
  const theme = rawData.design_state?.design_spec?.visual?.theme || rawData.theme || { mode: 'dark', primary: '#6366f1' }

  const designState = {
    requirement_spec: reqSpec,
    design_spec: {
      page: rawData.design_state?.design_spec?.page || rawData.page_spec || {
        type: 'standard',
        purpose: 'Render user requested screen',
        complexity: 'simple',
      },
      visual: rawData.design_state?.design_spec?.visual || {
        style: ['modern'],
        theme: theme,
      },
      layout: rawData.design_state?.design_spec?.layout || {
        type: 'centered',
        responsive: true,
      },
      sections: rawSections,
      design_decisions: rawData.design_state?.design_spec?.design_decisions || rawData.design_decisions || [],
    },
  }

  // 3. IMPLEMENTATION (Vue + Tailwind Source Code)
  const vueSource =
    rawData.implementation?.source?.vue ||
    rawData.code_export?.vue ||
    ''

  const htmlSource =
    rawData.implementation?.source?.html ||
    rawData.code_export?.html ||
    rawData.raw_html ||
    rawData.rawHtml ||
    ''

  const implementation = {
    framework: rawData.implementation?.framework || 'vue',
    styling: rawData.implementation?.styling || 'tailwind',
    source: {
      vue: vueSource,
      html: htmlSource,
    },
    generated_at: rawData.implementation?.generated_at || new Date().toISOString(),
    version: rawData.implementation?.version || 1,
  }

  // 4. AUDIT STATE (Evaluation only)
  const audit = {
    validation: rawData.audit?.validation || rawData.validation || { status: 'pass' },
    requirement_coverage: rawData.audit?.requirement_coverage || { status: 'pass' },
    anti_slop: rawData.audit?.anti_slop || rawData.anti_slop_audit || { status: 'pass' },
    visual_review: rawData.audit?.visual_review || { status: 'pass' },
  }

  const changePlan = rawData.change_plan || null

  return {
    ...node,
    position: node.position || canvas.position,
    data: {
      // CANONICAL HIERARCHY
      canvas,
      design_state: designState,
      implementation,
      audit,
      change_plan: changePlan,

      // BACKWARD COMPATIBILITY ADAPTERS (Maintained for legacy child components)
      device: canvas.device,
      title: canvas.title,
      width: canvas.width,
      height: canvas.height,
      theme: theme,
      sections: rawSections,
      code_export: {
        vue: vueSource,
        html: htmlSource,
      },
      raw_html: htmlSource,
      rawHtml: htmlSource,
      page_spec: designState.design_spec.page,
      design_decisions: designState.design_spec.design_decisions,
      requirement_spec: reqSpec,
      validation: audit.validation,
      anti_slop_audit: audit.anti_slop,
    },
  }
}
