<script setup>
import { computed } from 'vue'
import { Wallet, TrendingUp, Repeat, Clock, User } from 'lucide-vue-next'

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
  wallet: Wallet,
  'trending-up': TrendingUp,
  repeat: Repeat,
  clock: Clock,
  user: User,
}
</script>

<template>
  <nav
    class="w-full px-6 py-3 border-t flex items-center justify-between transition-colors mt-auto"
    :class="isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'"
  >
    <div
      v-for="(item, i) in data.items || []"
      :key="i"
      class="flex flex-col items-center gap-1 cursor-pointer transition-colors"
      :class="item.label === data.active ? 'text-purple-400 font-bold' : 'hover:text-slate-200'"
      :style="item.label === data.active ? { color: primaryColor } : {}"
    >
      <component :is="ICONS[item.icon] || Wallet" class="w-4 h-4" />
      <span class="text-[9px] font-semibold">{{ item.label }}</span>
    </div>
  </nav>
</template>
