<script setup>
import { computed } from 'vue'
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  Check,
  KeyRound,
  Eye,
  Sparkles,
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

const title = computed(() => props.data?.title || 'Masuk ke Akun Anda')
const subtitle = computed(() => props.data?.subtitle || 'Masuk dengan kredensial Anda.')
const fields = computed(() => {
  if (Array.isArray(props.data?.fields) && props.data.fields.length > 0) {
    return props.data.fields
  }
  // Default login fields if not specified
  return [
    { label: 'Email', name: 'email', type: 'email', placeholder: 'nama@email.com', icon: 'mail' },
    { label: 'Kata Sandi', name: 'password', type: 'password', placeholder: '••••••••', icon: 'lock' },
  ]
})

// Optional features: STRICTLY DEFAULT TO EMPTY / FALSE unless provided by DSL
const socialButtons = computed(() => {
  if (Array.isArray(props.data?.social_buttons)) {
    return props.data.social_buttons
  }
  return []
})
const showRememberMe = computed(() => Boolean(props.data?.show_remember_me))
const showForgotPassword = computed(() => Boolean(props.data?.show_forgot_password))
const submitLabel = computed(() => props.data?.submit_label || 'Lanjutkan Masuk')
const switchText = computed(() => props.data?.switch_text || '')
const switchAction = computed(() => props.data?.switch_action || '')
</script>

<template>
  <section class="w-full px-6 py-8 flex items-center justify-center">
    <div
      class="w-full max-w-md p-6 sm:p-8 rounded-2xl border transition-all duration-300 relative overflow-hidden text-left"
      :class="
        isDark
          ? 'bg-slate-900/80 border-slate-800/90 shadow-2xl backdrop-blur-md'
          : 'bg-white border-slate-200/90 shadow-xl'
      "
    >
      <!-- Ambient Glow Behind Card -->
      <div
        class="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none"
        :style="{ backgroundColor: primaryColor }"
      ></div>

      <!-- Header -->
      <div class="text-left mb-6 relative z-10">
        <div
          v-if="data.badge"
          class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide mb-2.5 border"
          :class="
            isDark
              ? 'bg-indigo-950/50 text-indigo-300 border-indigo-800/50'
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          "
        >
          <Sparkles class="w-2.5 h-2.5 text-indigo-400" />
          <span>{{ data.badge }}</span>
        </div>

        <h3 class="text-xl sm:text-2xl font-black tracking-tight" :class="isDark ? 'text-white' : 'text-slate-900'">
          {{ title }}
        </h3>
        <p class="mt-1 text-xs text-slate-400 leading-relaxed">
          {{ subtitle }}
        </p>
      </div>

      <!-- Social Auth Buttons (if enabled) -->
      <div v-if="socialButtons.length > 0" class="space-y-2 mb-5 relative z-10">
        <div class="grid grid-cols-2 gap-2.5">
          <button
            v-for="provider in socialButtons"
            :key="provider"
            type="button"
            class="flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-semibold transition-all hover:scale-[1.02] active:scale-95"
            :class="
              isDark
                ? 'bg-slate-800/70 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-xs'
            "
          >
            <!-- Google Icon SVG -->
            <svg v-if="provider === 'Google'" class="w-3.5 h-3.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <!-- GitHub Icon SVG -->
            <svg v-else-if="provider === 'GitHub'" class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <KeyRound v-else class="w-3.5 h-3.5" />
            <span>{{ provider }}</span>
          </button>
        </div>

        <div class="relative flex items-center justify-center my-3">
          <div class="w-full border-t border-slate-700/50"></div>
          <span class="absolute px-2 text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-900">
            atau dengan email
          </span>
        </div>
      </div>

      <!-- Form Inputs -->
      <form class="space-y-3.5 relative z-10" @submit.prevent>
        <div v-for="(f, i) in fields" :key="i" class="text-left">
          <label class="block text-[11px] font-semibold text-slate-300 mb-1">
            {{ f.label }}
          </label>
          <div class="relative flex items-center">
            <input
              :type="f.type || 'text'"
              :placeholder="f.placeholder || ''"
              :value="f.value || ''"
              class="w-full py-2 px-3 rounded-xl border text-xs transition-all outline-none"
              :class="
                isDark
                  ? 'bg-slate-950/80 border-slate-800 text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50'
              "
            />
            <div v-if="f.type === 'password'" class="absolute right-3 text-slate-500 cursor-pointer hover:text-slate-300">
              <Eye class="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <!-- Remember Me & Forgot Password (ONLY if requested) -->
        <div v-if="showRememberMe || showForgotPassword" class="flex items-center justify-between text-[11px] text-slate-400 pt-1">
          <label v-if="showRememberMe" class="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              class="w-3.5 h-3.5 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-0 bg-slate-950"
            />
            <span>Ingat saya</span>
          </label>
          <div v-else></div>
          <a v-if="showForgotPassword" href="#" class="text-indigo-400 hover:text-indigo-300 font-medium">Lupa sandi?</a>
        </div>

        <!-- Submit Button -->
        <button
          type="button"
          class="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 transition-all shadow-md mt-4 hover:opacity-95 active:scale-[0.98]"
          :style="{ backgroundColor: primaryColor }"
        >
          <span>{{ submitLabel }}</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>
      </form>

      <!-- Footer switch text (ONLY if registration switch requested) -->
      <div v-if="switchAction" class="mt-5 text-center text-[11px] text-slate-400 relative z-10 border-t border-slate-800/60 pt-3">
        <span>{{ switchText }} </span>
        <a href="#" class="font-semibold text-indigo-400 hover:text-indigo-300">
          {{ switchAction }}
        </a>
      </div>
    </div>
  </section>
</template>
