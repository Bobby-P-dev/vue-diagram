<script setup>
import { computed } from 'vue'
import {
  Sparkles,
  Star,
  ShoppingCart,
  ArrowRight,
  Tag,
  Heart,
  Package,
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

const title = computed(() => props.data?.title || 'Katalog Produk Pilihan')
const subtitle = computed(() => props.data?.subtitle || 'Koleksi premium dengan diskon khusus dan jaminan kualitas terbaik.')
const products = computed(() => {
  if (Array.isArray(props.data?.products) && props.data.products.length > 0) {
    return props.data.products
  }
  if (Array.isArray(props.data?.items) && props.data.items.length > 0) {
    return props.data.items
  }
  return [
    {
      name: 'Mechanical Keyboard Pro RGB',
      category: 'Peripherals',
      price: 'Rp 899.000',
      original_price: 'Rp 1.199.000',
      discount: '-25%',
      rating: '4.9',
      reviews: '342',
      badge: 'Bestseller',
    },
    {
      name: 'Wireless Studio Headphones ANC',
      category: 'Audio',
      price: 'Rp 1.450.000',
      original_price: 'Rp 1.850.000',
      discount: '-20%',
      rating: '4.8',
      reviews: '512',
      badge: 'Popular',
    },
    {
      name: 'Ergonomic Desk Mat Leather',
      category: 'Workspace',
      price: 'Rp 220.000',
      original_price: 'Rp 290.000',
      discount: '-24%',
      rating: '4.9',
      reviews: '1.2k',
      badge: 'Free Ongkir',
    },
  ]
})
</script>

<template>
  <section class="w-full px-6 py-8 text-left relative overflow-hidden">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
      <div>
        <div
          v-if="data.badge"
          class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wide mb-2 border"
          :class="
            isDark
              ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          "
        >
          <Tag class="w-3 h-3 text-amber-400" />
          <span>{{ data.badge }}</span>
        </div>

        <h3 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          {{ title }}
        </h3>
        <p class="mt-1 text-xs text-slate-400">
          {{ subtitle }}
        </p>
      </div>

      <a
        href="#"
        class="text-xs font-semibold flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition-colors"
      >
        <span>Lihat Semua Produk</span>
        <ArrowRight class="w-3.5 h-3.5" />
      </a>
    </div>

    <!-- Product Grid -->
    <div
      class="grid gap-4"
      :class="[
        products.length === 2 ? 'grid-cols-1 sm:grid-cols-2' :
        products.length === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' :
        'grid-cols-1 sm:grid-cols-3'
      ]"
    >
      <div
        v-for="(p, i) in products"
        :key="i"
        class="group rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col justify-between"
        :class="
          isDark
            ? 'bg-slate-900/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md'
        "
      >
        <!-- Mockup Visual Image Area -->
        <div
          class="h-36 w-full relative flex items-center justify-center p-4 transition-colors"
          :class="isDark ? 'bg-slate-950/60' : 'bg-slate-100/70'"
        >
          <div
            class="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform"
            :class="
              isDark
                ? 'bg-slate-900 border-slate-800 text-indigo-400'
                : 'bg-white border-slate-200 text-indigo-600 shadow-xs'
            "
          >
            <Package class="w-7 h-7" />
          </div>

          <!-- Badges on Image -->
          <span
            v-if="p.discount"
            class="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs"
          >
            {{ p.discount }}
          </span>

          <span
            v-if="p.badge"
            class="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-bold font-mono"
            :class="
              isDark
                ? 'bg-slate-800/90 text-amber-300 border border-amber-500/30'
                : 'bg-white text-amber-700 border border-amber-200 shadow-xs'
            "
          >
            {{ p.badge }}
          </span>
        </div>

        <!-- Info Area -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
              <span class="uppercase tracking-wider font-semibold">{{ p.category || 'General' }}</span>
              <div v-if="p.rating" class="flex items-center gap-1 text-amber-400 font-bold">
                <Star class="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>{{ p.rating }}</span>
                <span v-if="p.reviews" class="text-slate-500 font-normal">({{ p.reviews }})</span>
              </div>
            </div>

            <h4
              class="text-xs sm:text-sm font-bold tracking-tight mb-2 line-clamp-2"
              :class="isDark ? 'text-white' : 'text-slate-900'"
            >
              {{ p.name || p.title }}
            </h4>
          </div>

          <!-- Price & Action -->
          <div class="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2">
            <div>
              <div class="text-sm font-black text-indigo-400">
                {{ p.price }}
              </div>
              <div v-if="p.original_price" class="text-[10px] text-slate-500 line-through">
                {{ p.original_price }}
              </div>
            </div>

            <button
              type="button"
              class="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-white flex items-center gap-1.5 transition-all hover:opacity-90 active:scale-95 shadow-xs"
              :style="{ backgroundColor: primaryColor }"
            >
              <ShoppingCart class="w-3.5 h-3.5" />
              <span>Beli</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
