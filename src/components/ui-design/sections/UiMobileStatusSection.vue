<script setup>
import { Wifi, BatteryMedium, Signal } from 'lucide-vue-next'

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  theme: {
    type: Object,
    default: () => ({}),
  },
})
</script>

<template>
  <div class="w-full px-6 pt-3 pb-1 flex items-center justify-between text-xs font-semibold select-none">
    <span>{{ data.time || '09:41' }}</span>
    <div class="flex items-center gap-2 text-slate-400">
      <Signal class="w-3.5 h-3.5" />
      <Wifi class="w-3.5 h-3.5" />
      <div class="flex items-center gap-1 font-mono text-[10px]">
        <span>{{ data.battery || '100%' }}</span>
        <BatteryMedium class="w-4 h-4 text-emerald-400" />
      </div>
    </div>
  </div>
</template>
