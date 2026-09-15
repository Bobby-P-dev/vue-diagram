<script setup>
import { computed } from 'vue'
import { TrendingUp, TrendingDown, Activity } from 'lucide-vue-next'

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
const primaryColor = computed(() => props.theme?.primary || '#6366f1')
const items = computed(() => props.data?.items || [])
</script>

<template>
  <section class="w-full px-6 py-4">
    <div
      class="grid gap-3.5"
      :class="[
        items.length === 2 ? 'grid-cols-2' :
        items.length === 3 ? 'grid-cols-1 sm:grid-cols-3' :
        'grid-cols-2 sm:grid-cols-4'
      ]"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="p-4 rounded-xl border transition-all duration-200"
        :class="
          isDark
            ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
        "
      >
        <div class="flex items-center justify-between gap-1 text-[11px] font-medium text-slate-400">
          <span class="truncate">{{ item.label }}</span>
          <span
            v-if="item.change"
            class="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md flex items-center gap-0.5"
            :class="
              String(item.change).startsWith('+')
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-indigo-500/10 text-indigo-400'
            "
          >
            <TrendingUp v-if="String(item.change).startsWith('+')" class="w-2.5 h-2.5" />
            <span>{{ item.change }}</span>
          </span>
        </div>

        <div class="mt-2 text-xl sm:text-2xl font-black tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          {{ item.value }}
        </div>

        <p v-if="item.description" class="mt-1 text-[10px] text-slate-500 leading-snug line-clamp-1">
          {{ item.description }}
        </p>
      </div>
    </div>
  </section>
</template>
