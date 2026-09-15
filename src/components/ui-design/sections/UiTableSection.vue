<script setup>
import { computed } from 'vue'
import { MoreHorizontal, ArrowUpRight } from 'lucide-vue-next'

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
const columns = computed(() => props.data?.columns || ['Item', 'Status', 'Date'])
const rows = computed(() => props.data?.rows || [])

function getStatusBadge(status) {
  const s = String(status || '').toLowerCase()
  if (s.includes('run') || s.includes('success') || s.includes('active')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
  }
  if (s.includes('scale') || s.includes('pend') || s.includes('wait')) {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  }
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20'
}
</script>

<template>
  <section class="w-full px-6 py-4">
    <div
      class="rounded-xl border overflow-hidden transition-all"
      :class="isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-xs'"
    >
      <!-- Header -->
      <div class="px-5 py-3.5 border-b flex items-center justify-between"
        :class="isDark ? 'border-slate-800' : 'border-slate-100'"
      >
        <div>
          <h3 class="text-xs font-bold" :class="isDark ? 'text-white' : 'text-slate-900'">
            {{ data.title || 'Data Records' }}
          </h3>
          <p v-if="data.subtitle" class="text-[10px] text-slate-400 leading-tight mt-0.5">
            {{ data.subtitle }}
          </p>
        </div>
        <button
          class="text-xs font-semibold px-2.5 py-1 rounded-lg border text-indigo-500 hover:text-indigo-400 flex items-center gap-1"
          :class="isDark ? 'border-slate-800 hover:bg-slate-800/60' : 'border-slate-200 hover:bg-slate-50'"
        >
          <span>View All</span>
          <ArrowUpRight class="w-3 h-3" />
        </button>
      </div>

      <!-- Table Body -->
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="text-[10px] uppercase font-semibold tracking-wider border-b"
            :class="isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500'"
          >
            <tr>
              <th v-for="(col, i) in columns" :key="i" class="px-4 py-2.5">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y" :class="isDark ? 'divide-slate-800/80 text-slate-300' : 'divide-slate-100 text-slate-700'">
            <tr
              v-for="(row, rIdx) in rows"
              :key="rIdx"
              class="transition-colors hover:bg-indigo-500/5"
            >
              <td
                v-for="(val, key, cIdx) in row"
                :key="cIdx"
                class="px-4 py-3 text-xs"
              >
                <!-- Status pill renderer -->
                <span
                  v-if="String(key).toLowerCase().includes('status')"
                  class="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                  :class="getStatusBadge(val)"
                >
                  {{ val }}
                </span>
                <span v-else class="font-medium">
                  {{ val }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
