<script setup>
import { computed } from 'vue'
import {
  Plus,
  Layers,
  LayoutGrid,
  Monitor,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  History,
  FolderOpen,
  LogOut,
  KeyRound,
} from 'lucide-vue-next'

const props = defineProps({
  currentView: {
    type: String,
    default: 'workspace', // 'workspace' | 'foundations' | 'templates'
  },
  activeProjectTitle: {
    type: String,
    default: 'Untitled Project',
  },
  activeFoundationName: {
    type: String,
    default: 'Ramp Clean',
  },
  hasDiagram: {
    type: Boolean,
    default: false,
  },
  currentVersionNumber: {
    type: Number,
    default: 1,
  },
  isUiDesign: {
    type: Boolean,
    default: true,
  },
  currentUser: {
    type: Object,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
  canGenerateUi: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits([
  'navigate',
  'newProject',
  'openVersions',
  'inspectTokens',
  'toggleSidebar',
  'openAdmin',
  'logout',
])
</script>

<template>
  <header class="h-12 border-b border-slate-800/90 bg-slate-900/95 backdrop-blur-md px-4 flex items-center justify-between text-xs text-slate-300 z-40 select-none flex-shrink-0">
    <!-- Left: Brand + Project Title -->
    <div class="flex items-center gap-3 min-w-0">
      <div class="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity" @click="emit('navigate', 'workspace')">
        <img src="/rl.svg" alt="RancangLab Logo" class="h-8 w-auto object-contain flex-shrink-0" />
        <span class="font-bold text-white tracking-tight text-sm">
          RancangLab
        </span>
        <span class="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
          v1
        </span>
      </div>

      <div class="h-4 w-[1px] bg-slate-800 hidden sm:block"></div>

      <!-- Current Project Title with Mode Badge -->
      <div class="flex items-center gap-1.5 min-w-0">
        <span class="font-semibold text-slate-100 truncate max-w-[160px] sm:max-w-xs text-xs">
          {{ activeProjectTitle }}
        </span>

        <button
          v-if="hasDiagram"
          type="button"
          @click="emit('openVersions')"
          class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700/60 transition-colors flex items-center gap-1"
          title="Buka Riwayat Versi"
        >
          <History class="w-2.5 h-2.5" />
          <span>v{{ currentVersionNumber }}</span>
        </button>
      </div>
    </div>

    <!-- Center: View Switcher (Workspace vs Foundations vs Templates) -->
    <div class="flex items-center rounded-lg p-0.5 bg-slate-950/80 border border-slate-800/90">
      <button
        type="button"
        @click="emit('navigate', 'workspace')"
        class="px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all"
        :class="
          currentView === 'workspace'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
        "
      >
        <Monitor class="w-3 h-3" />
        <span>Workspace</span>
      </button>

      <button
        v-if="canGenerateUi"
        type="button"
        @click="emit('navigate', 'foundations')"
        class="px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all"
        :class="
          currentView === 'foundations'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
        "
      >
        <Layers class="w-3 h-3" />
        <span>Foundations</span>
      </button>

      <button
        v-if="canGenerateUi"
        type="button"
        @click="emit('navigate', 'templates')"
        class="px-3 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1.5 transition-all"
        :class="
          currentView === 'templates'
            ? 'bg-indigo-600 text-white shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
        "
      >
        <LayoutGrid class="w-3 h-3" />
        <span>Templates</span>
      </button>
    </div>

    <!-- Right: Active Foundation Pill & New Project Button -->
    <div class="flex items-center gap-2">
      <!-- Design Foundation Indicator -->
      <button
        v-if="canGenerateUi"
        type="button"
        @click="emit('inspectTokens')"
        class="hidden lg:inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-slate-950 border border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white transition-colors"
        title="Inspeksi Design Tokens"
      >
        <Sliders class="w-3 h-3 text-indigo-400" />
        <span>{{ activeFoundationName }}</span>
      </button>

      <!-- Admin Manager Action (Admin Only) -->
      <button
        v-if="isAdmin"
        type="button"
        @click="emit('openAdmin')"
        class="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 border border-indigo-700/60 hover:bg-indigo-900/60 text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
        title="Kelola Kredensial Pengguna"
      >
        <ShieldCheck class="w-3.5 h-3.5 text-indigo-400" />
        <span class="hidden md:inline-block">Kelola Akses</span>
      </button>

      <!-- New Project Action -->
      <button
        type="button"
        @click="emit('newProject')"
        class="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-xs active:scale-95 cursor-pointer"
      >
        <Plus class="w-3.5 h-3.5" />
        <span class="hidden sm:inline-block">New Project</span>
      </button>

      <!-- User Identity Badge & Logout -->
      <div v-if="currentUser" class="flex items-center gap-1.5 ml-1 pl-2 border-l border-slate-800">
        <div
          class="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[11px]"
          :title="currentUser.expires_at ? `Masa aktif: ${currentUser.expires_in_human}` : 'Akses Tanpa Batas'"
        >
          <div class="w-2 h-2 rounded-full" :class="isAdmin ? 'bg-indigo-400' : 'bg-emerald-400'"></div>
          <span class="font-medium text-slate-200 truncate max-w-[90px]">{{ currentUser.name }}</span>
          <span v-if="!isAdmin && currentUser.expires_in_human" class="text-[10px] text-slate-400">
            ({{ currentUser.expires_in_human }})
          </span>
        </div>

        <button
          type="button"
          @click="emit('logout')"
          class="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Keluar / Ganti Kredensial"
        >
          <LogOut class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  </header>
</template>
