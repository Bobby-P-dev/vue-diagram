<script setup>
import { computed } from 'vue'
import { Check, Sparkles, ArrowRight } from 'lucide-vue-next'

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

const title = computed(() => props.data?.title || 'Pilihan Paket Fleksibel untuk Kebutuhan Anda')
const subtitle = computed(() => props.data?.subtitle || 'Mulai gratis atau upgrade untuk fitur kolaborasi tanpa batas dan dukungan prioritas.')
const plans = computed(() => {
  if (Array.isArray(props.data?.plans) && props.data.plans.length > 0) {
    return props.data.plans
  }
  if (Array.isArray(props.data?.items) && props.data.items.length > 0) {
    return props.data.items
  }
  return [
    {
      name: 'Starter',
      price: 'Rp 0',
      period: '/bulan',
      description: 'Ideal untuk individu yang ingin mencoba eksplorasi diagram & UI.',
      features: ['3 Project Aktif', 'Ekspor PNG Standard', 'Akses Komponen Dasar', 'Dukungan Komunitas'],
      cta: 'Mulai Gratis',
      popular: false,
    },
    {
      name: 'Professional',
      price: 'Rp 149.000',
      period: '/bulan',
      description: 'Untuk profesional dan tim kecil yang membutuhkan produktivitas maksimal.',
      features: ['Unlimited Projects', 'AI Auto-Generate UI & Diagram', 'Ekspor Kode Vue 3 & Tailwind', 'Snapshot Versi & Rollback', 'Dukungan Prioritas 24/7'],
      cta: 'Coba Pro 14 Hari',
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Rp 499.000',
      period: '/bulan',
      description: 'Keamanan tingkat bank, SSO, dan arsitektur kustom skala besar.',
      features: ['Semua Fitur Pro', 'Dedicated Cloud Instance', 'Audit Log & SOC2 Compliance', 'Custom SLA 99.99%', 'Account Manager Khusus'],
      cta: 'Hubungi Sales',
      popular: false,
    },
  ]
})
</script>

<template>
  <section class="w-full px-6 py-8 text-left relative overflow-hidden">
    <!-- Header -->
    <div class="text-center max-w-2xl mx-auto mb-8">
      <div
        v-if="data.badge"
        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide mb-2.5 border"
        :class="
          isDark
            ? 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50'
            : 'bg-indigo-50 text-indigo-700 border-indigo-200'
        "
      >
        <Sparkles class="w-3 h-3 text-indigo-400" />
        <span>{{ data.badge }}</span>
      </div>

      <h3 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
        {{ title }}
      </h3>
      <p class="mt-1 text-xs sm:text-sm text-slate-400 leading-relaxed">
        {{ subtitle }}
      </p>
    </div>

    <!-- Pricing Cards Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 items-stretch">
      <div
        v-for="(plan, i) in plans"
        :key="i"
        class="rounded-2xl p-6 border transition-all duration-300 flex flex-col justify-between relative"
        :class="[
          plan.popular
            ? 'border-indigo-500/80 bg-slate-900/90 shadow-2xl ring-1 ring-indigo-500/50 -translate-y-1'
            : isDark
              ? 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
              : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
        ]"
      >
        <!-- Popular Ribbon -->
        <span
          v-if="plan.popular"
          class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase text-white shadow-md flex items-center gap-1"
          :style="{ backgroundColor: primaryColor }"
        >
          <Sparkles class="w-2.5 h-2.5" />
          <span>Paling Populer</span>
        </span>

        <div>
          <!-- Plan Header -->
          <div class="flex items-center justify-between mb-1.5">
            <h4 class="text-sm font-bold tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ plan.name }}
            </h4>
          </div>
          <p class="text-[11px] text-slate-400 leading-snug mb-4">
            {{ plan.description }}
          </p>

          <!-- Price -->
          <div class="mb-5 flex items-baseline gap-1">
            <span class="text-2xl sm:text-3xl font-black" :class="isDark ? 'text-white' : 'text-slate-900'">
              {{ plan.price }}
            </span>
            <span class="text-xs text-slate-400">{{ plan.period || '/bln' }}</span>
          </div>

          <!-- Feature List -->
          <div class="space-y-2.5 pt-4 border-t border-slate-800/60 mb-6 text-left">
            <div
              v-for="(f, fi) in plan.features"
              :key="fi"
              class="flex items-start gap-2 text-xs text-slate-300"
            >
              <div class="w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-500/20">
                <Check class="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span class="leading-tight">{{ f }}</span>
            </div>
          </div>
        </div>

        <!-- CTA Button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5"
          :class="[
            plan.popular
              ? 'text-white hover:opacity-95 active:scale-95'
              : isDark
                ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
                : 'bg-slate-100 text-slate-800 hover:bg-slate-200 border border-slate-200'
          ]"
          :style="plan.popular ? { backgroundColor: primaryColor } : {}"
        >
          <span>{{ plan.cta || 'Pilih Paket' }}</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </section>
</template>
