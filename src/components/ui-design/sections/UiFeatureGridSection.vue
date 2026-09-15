<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  Zap,
  Shield,
  Layers,
  Cpu,
  Globe,
  ArrowRight,
  Workflow,
  Database,
  Lock,
} from 'lucide-vue-next'

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

const ICON_MAP = {
  zap: Zap,
  shield: Shield,
  layers: Layers,
  cpu: Cpu,
  globe: Globe,
  workflow: Workflow,
  database: Database,
  lock: Lock,
  sparkles: Sparkles,
}

function getFeatureIcon(name) {
  return ICON_MAP[String(name).toLowerCase()] || Sparkles
}

const title = computed(() => props.data?.title || 'Fitur Unggulan Arsitektur Modern')
const subtitle = computed(() => props.data?.subtitle || 'Didesain secara presisi untuk performa maksimal, skalabilitas tinggi, dan keamanan tingkat enterprise.')
const items = computed(() => {
  if (Array.isArray(props.data?.items) && props.data.items.length > 0) {
    return props.data.items
  }
  return [
    {
      icon: 'zap',
      tag: 'Ultra Fast',
      title: 'Pemrosesan Real-Time',
      description: 'Pipeline data dengan latensi sub-millisecond untuk respons instan ke pengguna akhir.',
    },
    {
      icon: 'shield',
      tag: 'Security First',
      title: 'Enkripsi End-to-End',
      description: 'Keamanan data berstandar SOC2 dan enkripsi tingkat perbankan di seluruh lapisan API.',
    },
    {
      icon: 'layers',
      tag: 'Modular',
      title: 'Komponen Terisolasi',
      description: 'Arsitektur modular yang mempermudah deployment, pengujian, dan skalabilitas tim.',
    },
  ]
})
</script>

<template>
  <section class="w-full px-6 py-8 text-left relative overflow-hidden">
    <!-- Section Header -->
    <div class="mb-6 max-w-2xl">
      <div
        v-if="data.badge"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide mb-2.5 border"
        :class="
          isDark
            ? 'bg-indigo-950/40 text-indigo-300 border-indigo-800/50'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        "
      >
        <Sparkles class="w-3 h-3 text-indigo-400" />
        <span>{{ data.badge }}</span>
      </div>

      <h3 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
        {{ title }}
      </h3>
      <p class="mt-1 text-xs sm:text-sm leading-relaxed text-slate-400">
        {{ subtitle }}
      </p>
    </div>

    <!-- Features Grid -->
    <div
      class="grid gap-4"
      :class="[
        items.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        items.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 sm:grid-cols-3'
      ]"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="group p-5 rounded-2xl border transition-all duration-200 relative flex flex-col justify-between"
        :class="
          isDark
            ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
        "
      >
        <div>
          <!-- Icon & Tag -->
          <div class="flex items-center justify-between gap-2 mb-3.5">
            <div
              class="w-8 h-8 rounded-xl flex items-center justify-center border shadow-xs"
              :class="
                isDark
                  ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              "
            >
              <component :is="getFeatureIcon(item.icon)" class="w-4 h-4" />
            </div>

            <span
              v-if="item.tag"
              class="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full"
              :class="
                isDark
                  ? 'bg-slate-800/80 text-slate-300 border border-slate-700/60'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              "
            >
              {{ item.tag }}
            </span>
          </div>

          <!-- Title -->
          <h4 class="text-sm font-bold tracking-tight mb-1" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ item.title }}
          </h4>

          <!-- Description -->
          <p class="text-xs text-slate-400 leading-relaxed">
            {{ item.description }}
          </p>
        </div>

        <div v-if="item.action" class="mt-4 pt-3 border-t border-slate-800/50 flex items-center text-[11px] font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
          <span>{{ item.action }}</span>
          <ArrowRight class="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  </section>
</template>
