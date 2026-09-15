<script setup>
import { computed } from 'vue'
import { ArrowRight, Sparkles } from 'lucide-vue-next'

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  theme: {
    type: Object,
    default: () => ({}),
  },
})

const primaryColor = computed(() => props.theme?.primary || '#2563eb')
</script>

<template>
  <div
    class="w-full px-4 py-2 text-center text-xs font-semibold flex items-center justify-center gap-2 text-white"
    :style="{ backgroundColor: primaryColor }"
  >
    <Sparkles class="w-3.5 h-3.5" />
    <span>{{ data.text }}</span>
    <span v-if="data.linkText" class="underline cursor-pointer flex items-center gap-0.5">
      {{ data.linkText }}
      <ArrowRight class="w-3 h-3" />
    </span>
  </div>
</template>
