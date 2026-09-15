<script setup>
import { ref, computed } from 'vue'
import {
  LayoutGrid,
  Search,
  ArrowRight,
  Sparkles,
  Layers,
  Smartphone,
  Monitor,
  Eye,
} from 'lucide-vue-next'

const props = defineProps({
  templates: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['useTemplate', 'previewTemplate'])

const searchQuery = ref('')
const selectedCategory = ref('all')

const categories = [
  { id: 'all', label: 'Semua' },
  { id: 'saas', label: 'SaaS & Web App' },
  { id: 'dashboard', label: 'Dashboard & Analytics' },
  { id: 'ecommerce', label: 'E-Commerce & Store' },
  { id: 'mobile', label: 'Mobile App' },
  { id: 'landing', label: 'Landing Page' },
  { id: 'auth', label: 'Autentikasi' },
]

// Sample curated templates if database is still empty or loading
const defaultTemplates = [
  {
    id: 'tpl-1',
    name: 'Nexora Cloud Observability Suite',
    category: 'dashboard',
    device: 'web',
    screens_count: 1,
    foundation: 'Railway Terminal',
    description: 'Dashboard SaaS cloud analytics dengan navbar status, KPI pod kubernetes, dan tabel microservices.',
    accent: '#6366f1',
  },
  {
    id: 'tpl-2',
    name: 'Krypton Web3 Multi-Asset Mobile Wallet',
    category: 'mobile',
    device: 'mobile',
    screens_count: 1,
    foundation: 'Raycast Keyboard',
    description: 'Aplikasi smartphone iPhone/Android dengan status bar, kartu saldo, portofolio crypto, dan bottom navigation.',
    accent: '#a855f7',
  },
  {
    id: 'tpl-3',
    name: 'Aura Sound Pro Storefront & Checkout',
    category: 'ecommerce',
    device: 'desktop',
    screens_count: 1,
    foundation: 'Ramp Clean',
    description: 'Toko audio premium dengan announcement bar, hero banner, katalog headphone, dan spesifikasi.',
    accent: '#f59e0b',
  },
  {
    id: 'tpl-4',
    name: 'Kroma Studio Glassmorphic Auth Portal',
    category: 'auth',
    device: 'web',
    screens_count: 1,
    foundation: 'Cal.com Calm',
    description: 'Halaman masuk & daftar desainer lengkap dengan SSO Google & GitHub serta enkripsi sandi.',
    accent: '#6366f1',
  },
  {
    id: 'tpl-5',
    name: 'Aruna Batik Nusantara Storefront Flash Sale',
    category: 'ecommerce',
    device: 'web',
    screens_count: 1,
    foundation: 'Ramp Clean',
    description: 'E-Commerce fashion busana batik kontemporer dengan flash deal 55% dan 4 produk asli.',
    accent: '#f43f5e',
  },
  {
    id: 'tpl-6',
    name: 'Attio Modern CRM Pipeline & Contacts',
    category: 'saas',
    device: 'web',
    screens_count: 1,
    foundation: 'Attio Fluid',
    description: 'Workspace relasi pelanggan dengan multi-column data views dan tag status kustom.',
    accent: '#7c3aed',
  },
]

const allTemplates = computed(() => {
  if (Array.isArray(props.templates) && props.templates.length > 0) {
    // Merge or map with defaults
    return props.templates
  }
  return defaultTemplates
})

const filteredTemplates = computed(() => {
  return allTemplates.value.filter((t) => {
    const matchesCat =
      selectedCategory.value === 'all' ||
      String(t.category || '').toLowerCase().includes(selectedCategory.value)
    const matchesSearch =
      !searchQuery.value ||
      String(t.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      String(t.description || '').toLowerCase().includes(searchQuery.value.toLowerCase())
    return matchesCat && matchesSearch
  })
})
</script>

<template>
  <div class="w-full h-full flex flex-col md:flex-row overflow-hidden bg-slate-950 text-slate-100 text-left select-none">
    <!-- Category Sidebar -->
    <aside class="w-full md:w-60 border-r border-slate-800/80 p-5 flex flex-col justify-between flex-shrink-0 bg-slate-900/40">
      <div>
        <div class="flex items-center gap-2 mb-6">
          <div class="w-7 h-7 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <LayoutGrid class="w-3.5 h-3.5" />
          </div>
          <h2 class="text-sm font-bold text-white">Koleksi Template</h2>
        </div>

        <nav class="space-y-1">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            @click="selectedCategory = cat.id"
            class="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-all"
            :class="
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            "
          >
            <span>{{ cat.label }}</span>
          </button>
        </nav>
      </div>

      <div class="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
        {{ filteredTemplates.length }} template siap digunakan
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Search & Filters Toolbar -->
      <div class="p-5 border-b border-slate-800/80 flex items-center justify-between gap-4 bg-slate-900/20">
        <div class="relative flex-1 max-w-md">
          <Search class="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari template (misal: CRM, E-commerce, Mobile, Login)..."
            class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-900/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
          />
        </div>

        <div class="text-xs text-slate-400 font-mono hidden sm:block">
          Bebas AI-Slop • Siap Dikembangkan
        </div>
      </div>

      <!-- Templates Grid -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="tpl in filteredTemplates"
            :key="tpl.id"
            class="group rounded-2xl border border-slate-800/90 bg-slate-900/60 hover:bg-slate-900 hover:border-slate-700 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-xl"
          >
            <div>
              <!-- Mockup Preview Banner -->
              <div
                class="h-40 w-full p-4 bg-slate-950 border-b border-slate-800/80 flex flex-col justify-between relative overflow-hidden group-hover:scale-[1.01] transition-transform"
              >
                <div class="flex items-center justify-between z-10">
                  <span class="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 border border-slate-700/80">
                    {{ tpl.category.toUpperCase() }}
                  </span>

                  <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 flex items-center gap-1">
                    <Monitor v-if="tpl.device !== 'mobile'" class="w-3 h-3" />
                    <Smartphone v-else class="w-3 h-3" />
                    <span>{{ tpl.device === 'mobile' ? 'Mobile' : 'Web' }}</span>
                  </span>
                </div>

                <!-- Abstract UI lines preview -->
                <div class="space-y-1.5 opacity-60 z-10">
                  <div class="h-3 w-1/2 rounded bg-slate-700/50"></div>
                  <div class="h-6 w-full rounded bg-slate-800/50 border border-slate-700/30"></div>
                </div>

                <div
                  class="absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-15 pointer-events-none"
                  :style="{ backgroundColor: tpl.accent || '#6366f1' }"
                ></div>
              </div>

              <!-- Info Area -->
              <div class="p-5 text-left">
                <h3 class="text-sm font-bold text-white tracking-tight mb-1 group-hover:text-indigo-300 transition-colors">
                  {{ tpl.name }}
                </h3>
                <p class="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-3">
                  {{ tpl.description || 'Template arsitektur antarmuka modern.' }}
                </p>

                <div class="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span>Fondasi: <strong class="text-slate-300 font-normal">{{ tpl.foundation || 'Ramp Clean' }}</strong></span>
                  <span>1 Layar</span>
                </div>
              </div>
            </div>

            <!-- Action Button -->
            <div class="p-5 pt-0">
              <button
                type="button"
                @click="emit('useTemplate', tpl)"
                class="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
              >
                <span>Gunakan Template</span>
                <ArrowRight class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
