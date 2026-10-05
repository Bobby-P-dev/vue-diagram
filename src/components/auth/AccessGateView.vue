<script setup>
import { ref, computed } from 'vue'
import {
  KeyRound,
  ShieldCheck,
  ArrowRight,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Clipboard,
  Check,
  Layers,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  initialError: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['loginSuccess'])

const store = useDiagramStore()

const inputKey = ref('')
const isLoading = ref(false)
const localError = ref('')

const displayError = computed(() => {
  return localError.value || store.authError.value || props.initialError || ''
})

async function handleLogin() {
  const key = inputKey.value.trim()
  if (!key) {
    localError.value = 'Silakan masukkan kode kredensial akses Anda.'
    return
  }

  isLoading.value = true
  localError.value = ''
  try {
    const success = await store.loginWithCredential(key)
    if (success) {
      emit('loginSuccess')
    }
  } catch (err) {
    localError.value = err.message || 'Gagal memverifikasi kredensial'
  } finally {
    isLoading.value = false
  }
}

async function handlePaste() {
  try {
    if (navigator?.clipboard?.readText) {
      const text = await navigator.clipboard.readText()
      if (text) {
        inputKey.value = text.trim()
        localError.value = ''
      }
    }
  } catch (_) {
    // Clipboard permission denied or unavailable
  }
}
</script>

<template>
  <div class="relative min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-x-hidden selection:bg-indigo-500 selection:text-white">
    <!-- Subtle Ambient Glow -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div class="h-[520px] w-[520px] rounded-full bg-indigo-600/10 blur-[130px] transform -translate-y-12"></div>
      <div class="h-[420px] w-[420px] rounded-full bg-violet-500/10 blur-[140px] transform translate-x-40 translate-y-24"></div>
    </div>

    <!-- Top Minimal Bar -->
    <header class="relative z-10 w-full px-6 py-5 flex items-center justify-between border-b border-slate-800/60 bg-slate-950/60 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <img src="/rl.svg" alt="RancangLab Logo" class="h-8 w-auto object-contain flex-shrink-0" />
        <div class="flex items-center gap-2">
          <span class="font-extrabold text-white text-base tracking-tight">RancangLab</span>
          <span class="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold font-mono uppercase rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
            Access Gate
          </span>
        </div>
      </div>

      <div class="flex items-center gap-2 text-xs text-slate-400">
        <ShieldCheck class="w-4 h-4 text-emerald-400" />
        <span class="hidden sm:inline">Ruang Kerja Terisolasi & Terenkripsi</span>
      </div>
    </header>

    <!-- Main Hero & Login Box -->
    <main class="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <!-- Brand Header Badge -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 shadow-inner mb-4">
            <Sparkles class="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Diagram & UI Design Workspace</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Selamat Datang di Workspace
          </h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
            Masukkan kredensial acak yang diberikan administrator untuk membuka ruang kerja dan riwayat percakapan AI Anda.
          </p>
        </div>

        <!-- Card Container -->
        <div class="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl transition-all">
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label for="cred-input" class="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Kode Kredensial Akses</span>
                <button
                  type="button"
                  @click="handlePaste"
                  class="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Clipboard class="w-3 h-3" />
                  <span>Tempel</span>
                </button>
              </label>

              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound class="w-4 h-4" />
                </div>
                <input
                  id="cred-input"
                  v-model="inputKey"
                  type="text"
                  placeholder="Masukkan kode kredensial akses..."
                  autocomplete="off"
                  spellcheck="false"
                  :disabled="isLoading"
                  class="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl text-white placeholder-slate-600 text-xs sm:text-sm font-mono tracking-wider transition-colors outline-hidden disabled:opacity-50"
                />
              </div>
            </div>

            <!-- Error Banner -->
            <transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
            >
              <div
                v-if="displayError"
                class="rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-red-200 text-xs flex items-start gap-2.5 leading-relaxed"
                role="alert"
              >
                <AlertCircle class="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <div class="flex-1">
                  <p class="font-medium text-red-300">{{ displayError }}</p>
                </div>
              </div>
            </transition>

            <!-- Submit Button -->
            <button
              type="submit"
              :disabled="isLoading || !inputKey.trim()"
              class="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin text-white" />
              <template v-else>
                <span>Masuk ke Workspace</span>
                <ArrowRight class="w-4 h-4" />
              </template>
            </button>
          </form>
        </div>

        <!-- Security / Privacy Features Badges -->
        <div class="mt-8 grid grid-cols-2 gap-3 text-left">
          <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div class="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Layers class="w-3.5 h-3.5 text-indigo-400" />
              <span>Private Room</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 leading-snug">
              Setiap user hanya melihat diagram dan riwayat chat miliknya sendiri.
            </p>
          </div>

          <div class="p-3 rounded-xl bg-slate-900/40 border border-slate-800/60">
            <div class="flex items-center gap-1.5 text-slate-300 text-xs font-semibold">
              <Clock class="w-3.5 h-3.5 text-emerald-400" />
              <span>Masa Aktif Fleksibel</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 leading-snug">
              Riwayat proyek tersimpan aman meskipun masa aktif kredensial telah usai.
            </p>
          </div>
        </div>
      </div>
    </main>

    <!-- Footer -->
    <footer class="relative z-10 w-full px-6 py-4 text-center border-t border-slate-900 bg-slate-950/80 text-[11px] text-slate-500">
      <span>&copy; 2026 RancangLab AI Diagram & Design Studio. Terlindungi sistem autentikasi kredensial.</span>
    </footer>
  </div>
</template>
