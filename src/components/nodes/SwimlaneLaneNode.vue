<script setup>
import { computed } from 'vue'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const laneName = computed(() => String(props.data?.name || 'PROCESS').toUpperCase())
const width = computed(() => props.data?.width || 1200)
const height = computed(() => props.data?.height || 220)
const borderColor = computed(() => props.data?.color || '#3b82f6')
const headerBg = computed(() => props.data?.headerBg || '#2563eb')
const textColor = computed(() => props.data?.text || '#ffffff')
const bgColor = computed(() => props.data?.bg || 'rgba(59, 130, 246, 0.03)')
</script>

<template>
  <div
    class="swimlane-band relative rounded-2xl transition-all duration-300 pointer-events-none select-none"
    :style="{
      width: `${width}px`,
      height: `${height}px`,
      backgroundColor: bgColor,
      border: `1.5px dashed ${borderColor}`,
    }"
  >
    <!-- Left Lane Header Badge / Tag -->
    <div
      class="absolute left-3 top-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-sm font-bold text-xs tracking-wider z-10"
      :style="{
        backgroundColor: headerBg,
        color: textColor,
        boxShadow: `0 4px 12px -2px ${borderColor}30`,
      }"
    >
      <span class="w-2 h-2 rounded-full bg-white/90"></span>
      <span>{{ laneName }}</span>
    </div>
  </div>
</template>

<style scoped>
/* No backdrop-filter to avoid GPU mirroring artifact in transformed canvas */
</style>
