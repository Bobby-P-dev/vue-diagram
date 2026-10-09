export function formatAuditScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 10
    ? `${value}/10`
    : '—'
}

export function summarizeAudit(audit) {
  const statuses = ['validation', 'requirement_coverage', 'anti_slop', 'visual_review']
    .map(key => String(audit?.[key]?.status || 'unavailable').toLowerCase())
  if (statuses.includes('fail') || statuses.includes('revise')) return 'fail'
  if (statuses.includes('repaired')) return 'repaired'
  if (statuses.every(status => status === 'pass')) return 'pass'
  return 'unavailable'
}
