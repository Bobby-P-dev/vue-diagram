import { ref, computed } from 'vue'
import { useDiagramApi } from './useDiagramApi.js'

export function useAsyncJob() {
  const { getJobStatus } = useDiagramApi()

  const isJobRunning = ref(false)
  const currentJobId = ref(null)
  const currentProjectId = ref(null)
  const jobStatus = ref(null) // 'queued' | 'processing' | 'completed' | 'failed'
  const activeAgentStepIndex = ref(0)
  const pollTimer = ref(null)
  const errorMessage = ref(null)

  const AGENT_PIPELINE = [
    { name: 'Requirement Analyst', role: 'Menganalisis kebutuhan & batasan', icon: 'Search' },
    { name: 'Information Architect', role: 'Menyusun struktur layout & section', icon: 'Layout' },
    { name: 'UI Component Specialist', role: 'Menghasilkan komponen & styling', icon: 'Palette' },
    { name: 'Anti-Slop Critic', role: 'Audit visual & jaminan kualitas', icon: 'ShieldCheck' },
  ]

  const currentAgent = computed(
    () => AGENT_PIPELINE[activeAgentStepIndex.value] || AGENT_PIPELINE[0],
  )

  function startPolling(jobId, projectId, onComplete, onError) {
    currentJobId.value = jobId
    currentProjectId.value = projectId
    isJobRunning.value = true
    jobStatus.value = 'queued'
    activeAgentStepIndex.value = 0
    errorMessage.value = null

    if (pollTimer.value) clearInterval(pollTimer.value)

    let elapsedTicks = 0
    let consecutiveErrors = 0
    const maxTicks = 200 // ~300 seconds (5 minutes) at 1.5s interval

    pollTimer.value = setInterval(async () => {
      elapsedTicks++

      // Realistic agent progression pacing corresponding to LLM execution phases:
      // Step 0: Requirement Analyst (~0-20s, ticks 1-13)
      // Step 1: Information Architect (~20-45s, ticks 14-30)
      // Step 2: UI Component Specialist (~45-110s, ticks 31-75)
      // Step 3: Anti-Slop Critic (~110s+, ticks 76+)
      if (elapsedTicks >= 76) {
        activeAgentStepIndex.value = 3
      } else if (elapsedTicks >= 31) {
        activeAgentStepIndex.value = 2
      } else if (elapsedTicks >= 14) {
        activeAgentStepIndex.value = 1
      } else {
        activeAgentStepIndex.value = 0
      }

      // Explicit global timeout check after 5 minutes
      if (elapsedTicks > maxTicks) {
        clearInterval(pollTimer.value)
        pollTimer.value = null
        isJobRunning.value = false
        const timeoutErr = 'Proses pembuatan UI melebihi batas waktu (5 menit). Silakan periksa koneksi atau coba kembali.'
        errorMessage.value = timeoutErr
        if (onError) onError(timeoutErr)
        return
      }

      try {
        const res = await getJobStatus(jobId)
        consecutiveErrors = 0 // Reset error counter on success

        if (res?.status) {
          jobStatus.value = res.status
          if (res.status === 'completed') {
            clearInterval(pollTimer.value)
            pollTimer.value = null
            isJobRunning.value = false
            activeAgentStepIndex.value = AGENT_PIPELINE.length - 1
            if (onComplete) await onComplete(projectId)
          } else if (res.status === 'failed') {
            clearInterval(pollTimer.value)
            pollTimer.value = null
            isJobRunning.value = false
            const err = res.error || 'Pembuatan UI gagal dieksekusi oleh CrewAI'
            errorMessage.value = err
            if (onError) onError(err)
          }
        }
      } catch (err) {
        consecutiveErrors++
        console.warn(`[AsyncJob] Polling error (attempt ${consecutiveErrors}/10):`, err)

        // Only fail on persistent consecutive connection losses (10 polls = 15 seconds of unreachable server)
        if (consecutiveErrors >= 10) {
          clearInterval(pollTimer.value)
          pollTimer.value = null
          isJobRunning.value = false
          const netErr = `Gagal terhubung ke server setelah beberapa kali percobaan: ${err.message || 'Network error'}`
          errorMessage.value = netErr
          if (onError) onError(netErr)
        }
      }
    }, 1500)
  }

  function stopPolling() {
    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
    }
    isJobRunning.value = false
  }

  return {
    isJobRunning,
    currentJobId,
    currentProjectId,
    jobStatus,
    activeAgentStepIndex,
    currentAgent,
    AGENT_PIPELINE,
    errorMessage,
    startPolling,
    stopPolling,
  }
}
