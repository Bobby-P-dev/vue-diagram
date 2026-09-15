<script setup>
import { computed } from 'vue'
import { X, Sliders, Palette, Check } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  foundation: {
    type: Object,
    default: () => ({}),
  },
})

const emit = defineEmits(['close', 'applyToken'])

const tokens = computed(() => props.foundation?.tokens || {})
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 select-none"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 text-slate-200 text-left relative animate-in fade-in zoom-in-95 duration-200"
    >
      <!-- Header -->
      <div class="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Sliders class="w-4 h-4" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-white">Design Token Inspector</h3>
            <p class="text-[11px] text-slate-400">Fondasi Aktif: <strong class="text-indigo-300 font-mono">{{ foundation.name || 'Custom' }}</strong></p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Token Spec Rows -->
      <div class="space-y-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
        <!-- Color Tokens -->
        <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
          <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Palette class="w-3.5 h-3.5 text-indigo-400" />
            <span>Semantic Color System</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[11px]">Foreground</span>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: tokens.foreground || tokens.textPrimary }"></span>
                <span class="font-mono text-[10px]">{{ tokens.foreground || tokens.textPrimary || '#0f172a' }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[11px]">Surface</span>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: tokens.surface }"></span>
                <span class="font-mono text-[10px]">{{ tokens.surface || '#ffffff' }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[11px]">Primary Brand</span>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: tokens.primary || tokens.accent }"></span>
                <span class="font-mono text-[10px]">{{ tokens.primary || tokens.accent || '#6366f1' }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800">
              <span class="text-slate-400 text-[11px]">Border Subtle</span>
              <div class="flex items-center gap-1.5">
                <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: tokens.border }"></span>
                <span class="font-mono text-[10px]">{{ tokens.border || '#e2e8f0' }}</span>
              </div>
            </div>
          </div>

          <!-- Status Colors Row -->
          <div class="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span class="text-slate-500 font-mono">Status Signals:</span>
            <div class="flex items-center gap-2 font-mono">
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tokens.success || '#10b981' }"></span>Success</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tokens.warning || '#f59e0b' }"></span>Warning</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tokens.danger || '#ef4444' }"></span>Danger</span>
              <span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full" :style="{ backgroundColor: tokens.info || '#3b82f6' }"></span>Info</span>
            </div>
          </div>
        </div>

        <!-- Typography & Radius Tokens -->
        <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
          <div class="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">
            Geometry & Spacing Scale (4–64px)
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
              <span class="text-slate-400">Display & Body Fonts</span>
              <span class="font-mono text-slate-200 truncate max-w-[200px]">{{ tokens.fontDisplay || 'Inter, sans-serif' }}</span>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
              <span class="text-slate-400">Corner Radius Strategy</span>
              <span class="font-mono text-indigo-400 font-bold">
                Small {{ tokens.radiusStrategy?.small || '4px' }} / Medium {{ tokens.radius || '8px' }} / Large {{ tokens.radiusStrategy?.large || '12px' }}
              </span>
            </div>

            <div class="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-[11px]">
              <span class="text-slate-400">Calibrated Spacing Scale</span>
              <span class="font-mono text-emerald-400 font-bold text-[10px]">4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 px</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          Selesai
        </button>
      </div>
    </div>
  </div>
</template>
