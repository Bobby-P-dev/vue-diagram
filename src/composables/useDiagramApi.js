const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:8080/api'

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`

  let response
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    })
  } catch (networkError) {
    throw new Error(
      `Network error while calling ${url}: ${networkError.message}`,
    )
  }

  let payload = null
  const rawText = await response.text()
  if (rawText) {
    try {
      payload = JSON.parse(rawText)
    } catch (parseError) {
      if (!response.ok) {
        throw new Error(rawText.trim() || `HTTP ${response.status} ${response.statusText}`)
      }
      throw new Error(
        `Failed to parse JSON response from ${url}: ${parseError.message}`,
      )
    }
  }

  if (!response.ok) {
    const backendMessage =
      payload && (payload.error || payload.message)
        ? payload.error || payload.message
        : `HTTP ${response.status} ${response.statusText}`
    throw new Error(backendMessage)
  }

  if (payload && typeof payload === 'object' && 'status' in payload) {
    if (payload.status !== 'success') {
      throw new Error(
        payload.error || payload.message || 'Backend returned an error status',
      )
    }
    return payload.data
  }

  return payload
}

export function useDiagramApi() {
  async function createProject(prompt, diagramType = 'flowchart', templateId = null) {
    if (!templateId && (!prompt || typeof prompt !== 'string')) {
      throw new Error('createProject: `prompt` must be a non-empty string')
    }

    const payload = {
      diagram_type: diagramType,
    }
    if (templateId) {
      payload.template_id = templateId
    }
    if (prompt) {
      payload.prompt = prompt.trim()
    }

    return request('/projects', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function sendChat(projectId, prompt, targetedNodeIds = []) {
    if (!projectId) {
      throw new Error('sendChat: `projectId` is required')
    }
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('sendChat: `prompt` must be a non-empty string')
    }

    return request(`/projects/${encodeURIComponent(projectId)}/chat`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: prompt.trim(),
        targeted_node_ids: targetedNodeIds,
      }),
    })
  }

  async function getProjects({ limit = 15, offset = 0 } = {}) {
    const params = new URLSearchParams()
    if (typeof limit === 'number' && limit > 0) params.set('limit', String(limit))
    if (typeof offset === 'number' && offset >= 0) params.set('offset', String(offset))
    const query = params.toString() ? `?${params.toString()}` : ''
    return request(`/projects${query}`, { method: 'GET' })
  }

  async function togglePinProject(projectId) {
    if (!projectId) {
      throw new Error('togglePinProject: `projectId` is required')
    }
    return request(`/projects/${encodeURIComponent(projectId)}/pin`, {
      method: 'POST',
    })
  }

  async function getProjectDetails(projectId) {
    if (!projectId) {
      throw new Error('getProjectDetails: `projectId` is required')
    }
    return request(`/projects/${encodeURIComponent(projectId)}`, {
      method: 'GET',
    })
  }

  async function getVersions(projectId) {
    if (!projectId) {
      throw new Error('getVersions: `projectId` is required')
    }
    return request(`/projects/${encodeURIComponent(projectId)}/versions`, {
      method: 'GET',
    })
  }

  async function rollbackVersion(projectId, versionId) {
    if (!projectId || !versionId) {
      throw new Error('rollbackVersion: `projectId` and `versionId` are required')
    }
    return request(
      `/projects/${encodeURIComponent(projectId)}/rollback/${encodeURIComponent(versionId)}`,
      { method: 'POST' },
    )
  }

  async function getTemplates() {
    return request('/templates', { method: 'GET' })
  }

  async function getUiTemplates() {
    return request('/ui-design/templates', { method: 'GET' })
  }

  async function createUiDesign({
    prompt = '',
    device = 'web',
    theme = null,
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
    const payload = {
      device,
    }
    if (theme) {
      payload.theme = theme
    }
    if (foundation) {
      payload.foundation = foundation
    }
    if (themeMode) {
      payload.theme_mode = themeMode
    }
    if (accentColor) {
      payload.accent_color = accentColor
    }
    if (customTone) {
      payload.custom_tone = customTone
    }
    if (archetype) {
      payload.archetype = archetype
    }
    if (density) {
      payload.density = density
    }
    if (productContext) {
      payload.product_context = productContext
    }
    if (primaryUser) {
      payload.primary_user = primaryUser
    }
    if (primaryTask) {
      payload.primary_task = primaryTask
    }
    if (templateId) {
      payload.template_id = templateId
    }
    if (prompt) {
      payload.prompt = prompt.trim()
    }

    return request('/ui-design/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function createUiDesignAsync(options = {}) {
    const {
      prompt = '',
      device = 'web',
      theme = null,
      themeMode = null,
      accentColor = null,
      customTone = null,
      foundation = null,
      archetype = null,
      density = null,
      productContext = null,
      primaryUser = null,
      primaryTask = null,
    } = options

    const payload = {
      device,
    }
    if (theme) payload.theme = theme
    if (foundation) payload.foundation = foundation
    if (themeMode) payload.theme_mode = themeMode
    if (accentColor) payload.accent_color = accentColor
    if (customTone) payload.custom_tone = customTone
    if (archetype) payload.archetype = archetype
    if (density) payload.density = density
    if (productContext) payload.product_context = productContext
    if (primaryUser) payload.primary_user = primaryUser
    if (primaryTask) payload.primary_task = primaryTask
    if (prompt) payload.prompt = prompt.trim()

    return request('/ui-design/generate/async', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function getJobStatus(jobId) {
    if (!jobId) throw new Error('getJobStatus: `jobId` is required')
    return request(`/jobs/${encodeURIComponent(jobId)}`)
  }

  async function sendUiDesignChat(projectId, prompt, targetedNodeIds = [], selectedComponentId = null, target = null, selectionContext = null) {
    if (!projectId) {
      throw new Error('sendUiDesignChat: `projectId` is required')
    }
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('sendUiDesignChat: `prompt` must be a non-empty string')
    }

    const payload = { 
      prompt: prompt.trim(),
      instruction: prompt.trim(),
    }
    const targets = Array.isArray(targetedNodeIds) ? [...targetedNodeIds] : []
    if (selectedComponentId && !targets.includes(selectedComponentId)) {
      targets.push(selectedComponentId)
    }
    if (targets.length > 0) {
      payload.targeted_node_ids = targets
    }
    if (selectedComponentId) {
      payload.selected_component_id = selectedComponentId
    }
    if (target) {
      payload.target = target
    }
    if (selectionContext) {
      payload.selection_context = selectionContext
    }

    return request(`/ui-design/projects/${encodeURIComponent(projectId)}/chat`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async function getComments(projectId) {
    if (!projectId) return []
    return request(`/projects/${encodeURIComponent(projectId)}/comments`)
  }

  async function addComment(projectId, commentData) {
    if (!projectId) throw new Error('addComment: `projectId` is required')
    return request(`/projects/${encodeURIComponent(projectId)}/comments`, {
      method: 'POST',
      body: JSON.stringify(commentData),
    })
  }

  async function updateCommentStatus(commentId, status) {
    if (!commentId) throw new Error('updateCommentStatus: `commentId` is required')
    return request(`/comments/${encodeURIComponent(commentId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async function deleteComment(commentId) {
    if (!commentId) throw new Error('deleteComment: `commentId` is required')
    return request(`/comments/${encodeURIComponent(commentId)}`, {
      method: 'DELETE',
    })
  }

  async function getFoundations() {
    return request('/foundations')
  }

  async function getSettings() {
    return request('/settings')
  }

  async function updateSettings(settings) {
    return request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    })
  }

  async function getExports(projectId) {
    if (!projectId) return []
    return request(`/projects/${encodeURIComponent(projectId)}/exports`)
  }

  return {
    apiBaseUrl: API_BASE_URL,
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
    createUiDesignAsync,
    getJobStatus,
    sendUiDesignChat,
    getComments,
    addComment,
    updateCommentStatus,
    deleteComment,
    getFoundations,
    getSettings,
    updateSettings,
    getExports,
  }
}
