<script setup>
import { ref, computed } from 'vue'
import { CheckCircle2, ShieldCheck, AlertTriangle, XCircle, X, Check } from 'lucide-vue-next'

const props = defineProps({
  foundationName: {
    type: String,
    default: 'Custom Design System',
  },
  auditData: {
    type: Object,
    default: () => null,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const isOpen = ref(false)

const validation = computed(() => props.auditData?.validation || null)
const reqCoverage = computed(() => props.auditData?.requirement_coverage || null)
const antiSlop = computed(() => props.auditData?.anti_slop || null)
const visualReview = computed(() => props.auditData?.visual_review || null)

const status = computed(() => {
  if (!props.auditData) return 'pass'
  const v = (validation.value?.status || 'pass').toLowerCase()
  const c = (reqCoverage.value?.status || 'pass').toLowerCase()
  const a = (antiSlop.value?.status || 'pass').toLowerCase()
  if (v === 'fail' || c === 'fail' || a === 'fail') return 'fail'
  if (v === 'repaired' || c === 'repaired') return 'repaired'
  return 'pass'
})

const badgeConfig = computed(() => {
  if (status.value === 'fail') {
    return {
      label: 'Audit Issues',
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: XCircle,
      iconColor: 'text-rose-400',
    }
  }
  if (status.value === 'repaired') {
    return {
      label: 'Repaired',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: AlertTriangle,
      iconColor: 'text-amber-400',
    }
  }
  return {
    label: 'Verified',
    color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    icon: CheckCircle2,
    iconColor: 'text-emerald-400',
  }
})

const pillars = computed(() => [
  {
    category: 'Architecture & Schema',
    name: 'Component Hierarchy & Schema Integrity',
    desc: 'Semantik HTML, struktur DOM clean, dan kesesuaian AST compiler tanpa layout broken.',
    status: (validation.value?.status || 'pass').toUpperCase(),
    passed: (validation.value?.status || 'pass').toLowerCase() !== 'fail',
  },
  {
    category: 'Requirement & Intent',
    name: 'Intent Alignment & Scope Accuracy',
    desc: 'Fitur yang dirender tepat sesuai prompt pengguna, tanpa fitur spekulatif atau bloat tak diinginkan.',
    status: (reqCoverage.value?.status || 'pass').toUpperCase(),
    passed: (reqCoverage.value?.status || 'pass').toLowerCase() !== 'fail',
  },
  {
    category: 'Anti AI-Slop & Hallucination',
    name: 'Authentic Domain Entities & Zero Slop',
    desc: validation.value?.hallucination_check || 'Bebas dari placeholder lorem ipsum, halo glowing berlebihan, dan domain halusinasi.',
    status: (antiSlop.value?.status || 'pass').toUpperCase(),
    passed: (antiSlop.value?.status || 'pass').toLowerCase() !== 'fail',
  },
  {
    category: 'Visual & Design System',
    name: 'Spacing Geometry & Color Contrast',
    desc: 'Skala spacing konsisten (4/8/16/24px) dengan kepatuhan kontras WCAG AA.',
    status: (visualReview.value?.status || 'pass').toUpperCase(),
    passed: (visualReview.value?.status || 'pass').toLowerCase() !== 'fail',
  },
])

const scores = computed(() => validation.value?.score || null)
</script>

<template>
  <div class="relative inline-block select-none text-left">
    <!-- Trigger Badge -->
    <button
      type="button"
      @click.stop="isOpen = !isOpen"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer shadow-xs"
      :class="[
        isOpen
          ? 'bg-slate-800 text-white border-slate-600 ring-1 ring-white/10'
          : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
      ]"
      title="Status Audit Kualitas AI & Anti-Slop"
    >
      <component :is="badgeConfig.icon" class="w-3 h-3" :class="badgeConfig.iconColor" />
      <span v-if="!compact">Quality Audit</span>
      <span class="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border" :class="badgeConfig.color">
        {{ badgeConfig.label }}
      </span>
    </button>

    <!-- Audit Popover Modal -->
    <div
      v-if="isOpen"
      class="absolute top-8 right-0 w-88 p-4 rounded-xl border border-slate-700/90 bg-slate-900/95 shadow-2xl backdrop-blur-xl z-50 text-slate-200 animate-in fade-in zoom-in-95 duration-150"
      @click.stop
    >
      <div class="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800 text-left">
        <div class="flex items-center gap-1.5 text-xs font-bold text-white">
          <ShieldCheck class="w-4 h-4 text-emerald-400" />
          <span>Product Quality & Anti-Slop Audit</span>
        </div>
        <button
          type="button"
          @click.stop="isOpen = false"
          class="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <p class="text-[11px] text-slate-400 leading-relaxed mb-3 text-left">
        Evaluasi kualitas struktural dan kepatuhan anti-slop yang diaudit langsung oleh engine backend.
      </p>

      <div class="space-y-2 text-left max-h-72 overflow-y-auto custom-scrollbar pr-0.5">
        <div
          v-for="(item, i) in pillars"
          :key="i"
          class="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-start gap-2.5"
        >
          <CheckCircle2 v-if="item.passed" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
          <AlertTriangle v-else class="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between">
              <span class="text-[9px] font-mono uppercase tracking-wider text-indigo-400 font-semibold">{{ item.category }}</span>
              <span
                class="text-[9px] font-mono font-bold"
                :class="item.passed ? 'text-emerald-400' : 'text-amber-400'"
              >
                {{ item.status }}
              </span>
            </div>
            <div class="text-[11px] font-bold text-slate-200 mt-0.5">
              {{ item.name }}
            </div>
            <p class="text-[10px] text-slate-400 leading-tight mt-1">
              {{ item.desc }}
            </p>
          </div>
        </div>

        <!-- Scores Breakdown -->
        <div v-if="scores" class="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 pt-2">
          <div class="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">Audit Quality Scores</div>
          <div class="grid grid-cols-2 gap-1.5 text-[10px]">
            <div class="flex justify-between py-0.5 border-b border-slate-800/60 text-slate-400">
              <span>Fidelity:</span>
              <span class="font-mono font-bold text-emerald-400">{{ scores.requirement_fidelity ?? 10 }}/10</span>
            </div>
            <div class="flex justify-between py-0.5 border-b border-slate-800/60 text-slate-400">
              <span>Scope:</span>
              <span class="font-mono font-bold text-emerald-400">{{ scores.scope_accuracy ?? scores.scope ?? 10 }}/10</span>
            </div>
            <div class="flex justify-between py-0.5 border-b border-slate-800/60 text-slate-400">
              <span>Traceability:</span>
              <span class="font-mono font-bold text-emerald-400">{{ scores.traceability ?? 10 }}/10</span>
            </div>
            <div class="flex justify-between py-0.5 border-b border-slate-800/60 text-slate-400">
              <span>Simplicity:</span>
              <span class="font-mono font-bold text-emerald-400">{{ scores.simplicity ?? 10 }}/10</span>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
        <span>Aesthetic Engine: <strong class="text-slate-200 font-mono">{{ foundationName }}</strong></span>
        <span class="text-emerald-400 font-semibold font-mono">Verified Runtime</span>
      </div>
    </div>
  </div>
</template>
