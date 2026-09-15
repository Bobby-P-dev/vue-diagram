<script setup>
import { computed } from 'vue'
import { Sparkles, User, Bell, Search, ExternalLink } from 'lucide-vue-next'

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
const links = computed(() => props.data?.links || ['Home', 'Features', 'Pricing', 'Docs'])
</script>

<template>
  <header
    class="w-full px-5 py-3 border-b flex items-center justify-between transition-colors"
    :class="
      isDark
        ? 'bg-slate-900/90 border-slate-800 text-slate-100'
        : 'bg-white border-slate-200 text-slate-900'
    "
  >
    <!-- Left: Brand & Badge -->
    <div class="flex items-center gap-3">
      <div class="flex items-center gap-2 font-bold text-sm tracking-tight">
        <div
          class="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white shadow-xs"
          :style="{ backgroundColor: primaryColor }"
        >
          {{ String(data.brand || 'App').slice(0, 1) }}
        </div>
        <span class="font-extrabold">{{ data.brand || 'ModernApp' }}</span>
      </div>

      <span
        v-if="data.badge"
        class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
        :class="
          isDark
            ? 'bg-indigo-950/60 text-indigo-400 border-indigo-800/60'
            : 'bg-indigo-50 text-indigo-600 border-indigo-200'
        "
      >
        {{ data.badge }}
      </span>
    </div>

    <!-- Center: Links -->
    <nav class="hidden sm:flex items-center gap-5 text-xs font-medium">
      <a
        v-for="(link, i) in links"
        :key="i"
        href="javascript:void(0)"
        class="transition-colors hover:text-indigo-400"
        :class="i === 0 ? 'font-bold' : isDark ? 'text-slate-400' : 'text-slate-600'"
      >
        {{ link }}
      </a>
    </nav>

    <!-- Right: User or Cart or Action -->
    <div class="flex items-center gap-3">
      <div
        v-if="data.user"
        class="flex items-center gap-2"
      >
        <div class="text-right hidden md:block">
          <p class="text-xs font-semibold leading-tight">{{ data.user.name }}</p>
          <p class="text-[10px] text-slate-400 leading-tight">{{ data.user.role || 'Member' }}</p>
        </div>
        <img
          v-if="data.user.avatar"
          :src="data.user.avatar"
          alt="Avatar"
          class="w-7 h-7 rounded-full object-cover ring-2 ring-indigo-500/30"
        />
        <div
          v-else
          class="w-7 h-7 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs"
        >
          <User class="w-3.5 h-3.5" />
        </div>
      </div>

      <button
        v-else-if="data.cart_count !== undefined"
        class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs flex items-center gap-1.5"
        :style="{ backgroundColor: primaryColor }"
      >
        <span>Cart</span>
        <span class="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px]">{{ data.cart_count }}</span>
      </button>

      <button
        v-else
        class="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow-xs"
        :style="{ backgroundColor: primaryColor }"
      >
        Sign In
      </button>
    </div>
  </header>
</template>
