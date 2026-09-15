<script setup>
import { computed } from 'vue'
import { Send, ArrowDownLeft, Repeat, Plus, TrendingUp } from 'lucide-vue-next'

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

const isDark = computed(() => props.theme?.mode === 'dark')
const primaryColor = computed(() => props.theme?.primary || '#a855f7')

const ICONS = {
  send: Send,
  download: ArrowDownLeft,
  'refresh-cw': Repeat,
  plus: Plus,
}
</script>

<template>
  <div class="px-5 py-4">
    <!-- Card Container -->
    <div
      class="p-5 rounded-3xl border relative overflow-hidden transition-all shadow-md"
      :class="
        isDark
          ? 'bg-gradient-to-br from-purple-950/40 to-slate-900 border-purple-900/50 text-white'
          : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-100 text-slate-900'
      "
    >
      <p class="text-xs font-medium text-slate-400">
        {{ data.label || 'Total Net Worth' }}
      </p>

      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-3xl font-black tracking-tight">{{ data.amount || '$0.00' }}</span>
        <span
          v-if="data.change"
          class="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5"
        >
          <TrendingUp class="w-3 h-3" />
          <span>{{ data.change }}</span>
        </span>
      </div>

      <!-- Quick Action Buttons -->
      <div class="mt-5 grid grid-cols-4 gap-2 pt-3 border-t border-white/10">
        <button
          v-for="(act, i) in data.actions || []"
          :key="i"
          class="flex flex-col items-center gap-1.5 group transition-transform active:scale-95"
        >
          <div
            class="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm transition-opacity group-hover:opacity-90"
            :style="{ backgroundColor: primaryColor }"
          >
            <component :is="ICONS[act.icon] || Send" class="w-4 h-4" />
          </div>
          <span class="text-[11px] font-semibold text-slate-300 group-hover:text-white">{{ act.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
