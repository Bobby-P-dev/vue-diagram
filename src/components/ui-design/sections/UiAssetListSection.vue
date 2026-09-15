<script setup>
import { computed } from 'vue'
import { Coins } from 'lucide-vue-next'

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
const assets = computed(() => props.data?.assets || [])
</script>

<template>
  <div class="px-5 py-2">
    <h3 class="text-xs font-bold mb-2.5" :class="isDark ? 'text-slate-300' : 'text-slate-700'">
      {{ data.title || 'Your Assets' }}
    </h3>

    <div class="space-y-2">
      <div
        v-for="(ast, i) in assets"
        :key="i"
        class="p-3 rounded-2xl border flex items-center justify-between transition-all"
        :class="
          isDark
            ? 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
        "
      >
        <div class="flex items-center gap-3">
          <div
            class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white"
            :style="{ backgroundColor: primaryColor }"
          >
            {{ ast.symbol }}
          </div>
          <div>
            <p class="text-xs font-bold leading-snug" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ ast.name }}
            </p>
            <p class="text-[11px] text-slate-400 font-mono">{{ ast.balance }}</p>
          </div>
        </div>

        <div class="text-right">
          <p class="text-xs font-black" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ ast.fiat }}
          </p>
          <span
            v-if="ast.change"
            class="text-[10px] font-mono font-bold"
            :class="String(ast.change).startsWith('+') ? 'text-emerald-400' : 'text-rose-400'"
          >
            {{ ast.change }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
