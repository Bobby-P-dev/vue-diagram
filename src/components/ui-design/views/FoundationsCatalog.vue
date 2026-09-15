<script setup>
import { ref } from 'vue'
import {
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  Sliders,
  ExternalLink,
} from 'lucide-vue-next'
import { DESIGN_FOUNDATIONS } from '../../../assets/foundations.js'

const props = defineProps({
  activeFoundationId: {
    type: String,
    default: 'ramp',
  },
})

const emit = defineEmits(['selectFoundation', 'inspectTokens'])
</script>

<template>
  <div class="w-full h-full overflow-y-auto custom-scrollbar p-6 md:p-10 bg-slate-950 text-slate-100 text-left">
    <!-- Header Section -->
    <div class="max-w-4xl mx-auto mb-10 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold mb-3">
        <Sparkles class="w-3.5 h-3.5" />
        <span>Katalog Design Foundations</span>
      </div>
      <h1 class="text-3xl md:text-4xl font-black tracking-tight text-white mb-2">
        Start with a proven design foundation.
      </h1>
      <p class="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Jangan mulai dari kanvas kosong. Pilih fondasi sistem desain terkurasi dengan hierarki tipografi, batas border presisi, dan aturan Anti-Slop ketat untuk proyek SaaS modern Anda.
      </p>
    </div>

    <!-- Foundations Grid -->
    <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="foundation in DESIGN_FOUNDATIONS"
        :key="foundation.id"
        class="rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative group"
        :class="
          activeFoundationId === foundation.id
            ? 'bg-slate-900 border-indigo-500 shadow-xl ring-1 ring-indigo-500/40'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
        "
      >
        <div>
          <!-- Thumbnail Mockup Preview Area -->
          <div
            class="h-36 w-full p-4 border-b flex flex-col justify-between transition-colors relative"
            :style="{ backgroundColor: foundation.tokens.background, borderColor: foundation.tokens.border }"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-1.5">
                <span
                  class="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                  :style="{
                    backgroundColor: foundation.tokens.surface,
                    color: foundation.tokens.textPrimary || foundation.tokens.foreground,
                    borderColor: foundation.tokens.border,
                  }"
                >
                  {{ foundation.category }}
                </span>
                <span v-if="foundation.personality" class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-slate-900/80 text-indigo-300 border border-indigo-500/30">
                  {{ foundation.personality }}
                </span>
              </div>

              <!-- Active Foundation Indicator -->
              <span
                v-if="activeFoundationId === foundation.id"
                class="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-xs"
              >
                <Check class="w-3 h-3" />
                <span>Aktif</span>
              </span>
            </div>

            <!-- Mini Wireframe Silhouette Mockup -->
            <div class="space-y-1.5 opacity-80">
              <div
                class="h-4 w-3/4 rounded border"
                :style="{
                  backgroundColor: foundation.tokens.surface,
                  borderColor: foundation.tokens.border,
                }"
              ></div>
              <div class="flex items-center gap-2">
                <div
                  class="h-8 flex-1 rounded border p-1"
                  :style="{
                    backgroundColor: foundation.tokens.surface,
                    borderColor: foundation.tokens.border,
                  }"
                >
                  <div
                    class="h-1.5 w-1/2 rounded mb-1"
                    :style="{ backgroundColor: foundation.tokens.accentHighlight || foundation.tokens.accent }"
                  ></div>
                  <div class="h-1.5 w-3/4 rounded bg-slate-400/30"></div>
                </div>
                <div
                  class="h-8 flex-1 rounded border p-1"
                  :style="{
                    backgroundColor: foundation.tokens.surface,
                    borderColor: foundation.tokens.border,
                  }"
                >
                  <div class="h-1.5 w-1/3 rounded mb-1 bg-slate-400/30"></div>
                  <div class="h-1.5 w-2/3 rounded bg-slate-400/30"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Info Area -->
          <div class="p-5">
            <div class="flex items-center justify-between mb-1.5">
              <h3 class="text-base font-bold text-white tracking-tight">
                {{ foundation.name }}
              </h3>
            </div>
            <p class="text-xs text-slate-400 leading-relaxed mb-4">
              {{ foundation.description }}
            </p>

            <!-- Color Swatches & Tokens Spec -->
            <div class="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 mb-4 space-y-2">
              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Palette</span>
                <div class="flex items-center gap-1">
                  <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: foundation.tokens.background }"></span>
                  <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: foundation.tokens.surface }"></span>
                  <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: foundation.tokens.border }"></span>
                  <span class="w-3.5 h-3.5 rounded border border-white/20" :style="{ backgroundColor: foundation.tokens.accentHighlight || foundation.tokens.accent }"></span>
                </div>
              </div>

              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Typography</span>
                <span class="font-mono text-slate-300 text-[10px]">{{ foundation.tokens.fontDisplay.split(',')[0] }}</span>
              </div>

              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Corner Radius</span>
                <span class="font-mono text-indigo-400 font-bold text-[10px]">{{ foundation.tokens.radius }}</span>
              </div>

              <div class="flex items-center justify-between text-[11px]">
                <span class="text-slate-400">Spacing Scale</span>
                <span class="font-mono text-emerald-400 font-bold text-[10px]">4–64px scale</span>
              </div>
            </div>

            <!-- Anti-Slop Rules checklist -->
            <div class="space-y-1 mb-2">
              <div
                v-for="(rule, ri) in foundation.antiSlopRules.slice(0, 2)"
                :key="ri"
                class="flex items-start gap-1.5 text-[10px] text-slate-400 leading-tight"
              >
                <ShieldCheck class="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{{ rule }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Footer -->
        <div class="p-5 pt-0 flex items-center gap-2">
          <button
            type="button"
            @click="emit('selectFoundation', foundation)"
            class="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs"
            :class="
              activeFoundationId === foundation.id
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            "
          >
            <span>{{ activeFoundationId === foundation.id ? 'Sedang Digunakan' : 'Gunakan Fondasi' }}</span>
            <ArrowRight class="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            @click="emit('inspectTokens', foundation)"
            class="p-2.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Inspeksi Token Desain"
          >
            <Sliders class="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
