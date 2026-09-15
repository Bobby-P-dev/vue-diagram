<script setup>
import { computed } from 'vue'
import { Sparkles, ArrowRight, Play } from 'lucide-vue-next'

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
const actions = computed(() => props.data?.actions || [{ label: 'Get Started', variant: 'primary' }])
</script>

<template>
  <section class="w-full px-6 py-8 text-left relative overflow-hidden">
    <!-- Optional Badge -->
    <div v-if="data.badge" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide mb-3 border"
      :class="
        isDark
          ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50'
          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
      "
    >
      <Sparkles class="w-3 h-3 text-indigo-400" />
      <span>{{ data.badge }}</span>
    </div>

    <!-- Title -->
    <h2
      class="text-2xl sm:text-3xl font-black tracking-tight leading-tight max-w-2xl"
      :class="isDark ? 'text-white' : 'text-slate-900'"
    >
      {{ data.title || 'Transform Your Digital Workflows' }}
    </h2>

    <!-- Subtitle -->
    <p
      v-if="data.subtitle"
      class="mt-2 text-xs sm:text-sm leading-relaxed max-w-xl"
      :class="isDark ? 'text-slate-400' : 'text-slate-600'"
    >
      {{ data.subtitle }}
    </p>

    <!-- Optional Price -->
    <div v-if="data.price" class="mt-4 flex items-baseline gap-2">
      <span class="text-3xl font-extrabold text-indigo-500">{{ data.price }}</span>
      <span class="text-xs text-slate-400">One-time purchase / Free global shipping</span>
    </div>

    <!-- Action Buttons -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <button
        v-for="(act, i) in actions"
        :key="i"
        class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
        :class="
          act.variant === 'primary'
            ? 'text-white hover:opacity-90 active:scale-95'
            : isDark
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
        "
        :style="act.variant === 'primary' ? { backgroundColor: primaryColor } : {}"
      >
        <span>{{ act.label }}</span>
        <ArrowRight v-if="act.variant === 'primary'" class="w-3.5 h-3.5" />
      </button>
    </div>
  </section>
</template>
