<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import {
  ShieldCheck,
  X,
  Plus,
  KeyRound,
  Copy,
  Check,
  Calendar,
  Clock,
  Trash2,
  Power,
  RotateCw,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  FolderOpen,
  Sparkles,
  Pencil,
} from 'lucide-vue-next'
import { useDiagramStore } from '../../stores/diagramStore.js'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const store = useDiagramStore()

const isLoading = ref(false)
const isSubmitting = ref(false)
const actionInProgressId = ref(null)
const credentials = ref([])
const errorMessage = ref('')
const newlyCreated = ref(null)
const copiedId = ref(null)
const visibleKeys = ref(new Set())

// New Credential Form State
const newName = ref('')
const newFeatureScope = ref('all') // 'all' | 'diagram' | 'ui'
const selectedDurationPreset = ref('1d')
const customDurationValue = ref(1)
const customDurationUnit = ref('days') // 'minutes', 'hours', 'days'
const customDate = ref('')

const durationPresetOptions = [
  { label: '15 Menit', value: '15m' },
  { label: '30 Menit', value: '30m' },
  { label: '1 Jam', value: '1h' },
  { label: '6 Jam', value: '6h' },
  { label: '1 Hari (24 Jam)', value: '1d' },
  { label: '7 Hari (1 Minggu)', value: '7d' },
  { label: '30 Hari (1 Bulan)', value: '30d' },
  { label: 'Permanen', value: 'permanent' },
  { label: 'Kustom Durasi (Menit / Jam / Hari)', value: 'custom' },
  { label: 'Kustom Tanggal & Waktu', value: 'datetime' },
]

// Edit Modal State
const isEditModalOpen = ref(false)
const editingCred = ref(null)
const editName = ref('')
const editIsActive = ref(true)
const editFeatureScope = ref('all') // 'all' | 'diagram' | 'ui'
const editExpiryMode = ref('keep') // 'keep' | 'set_duration' | 'extend' | 'permanent' | 'datetime'
const editDurationValue = ref(1)
const editDurationUnit = ref('hours') // 'minutes', 'hours', 'days'
const editCustomDate = ref('')
const isEditSaving = ref(false)
const editError = ref('')

async function loadCredentials() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const list = await store.fetchAdminCredentials()
    credentials.value = list || []
  } catch (err) {
    errorMessage.value = err.message || 'Gagal mengambil daftar kredensial'
  } finally {
    isLoading.value = false
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      newlyCreated.value = null
      loadCredentials()
    }
  },
  { immediate: true }
)

async function handleCreate() {
  if (!newName.value.trim()) {
    alert('Nama pengguna atau label harus diisi.')
    return
  }

  isSubmitting.value = true
  errorMessage.value = ''
  try {
    const payload = {
      name: newName.value.trim(),
      role: 'user',
      can_generate_diagram: newFeatureScope.value !== 'ui',
      can_generate_ui: newFeatureScope.value !== 'diagram',
    }

    if (selectedDurationPreset.value === '15m') {
      payload.duration_minutes = 15
    } else if (selectedDurationPreset.value === '30m') {
      payload.duration_minutes = 30
    } else if (selectedDurationPreset.value === '1h') {
      payload.duration_hours = 1
    } else if (selectedDurationPreset.value === '6h') {
      payload.duration_hours = 6
    } else if (selectedDurationPreset.value === '1d') {
      payload.duration_days = 1
    } else if (selectedDurationPreset.value === '7d') {
      payload.duration_days = 7
    } else if (selectedDurationPreset.value === '30d') {
      payload.duration_days = 30
    } else if (selectedDurationPreset.value === 'permanent') {
      payload.duration_days = 0
    } else if (selectedDurationPreset.value === 'custom') {
      const val = parseInt(customDurationValue.value) || 1
      if (customDurationUnit.value === 'minutes') {
        payload.duration_minutes = val
      } else if (customDurationUnit.value === 'hours') {
        payload.duration_hours = val
      } else {
        payload.duration_days = val
      }
    } else if (selectedDurationPreset.value === 'datetime' && customDate.value) {
      payload.expires_at = new Date(customDate.value).toISOString()
    }

    const created = await store.createAdminCredential(payload)
    newlyCreated.value = created
    newName.value = ''
    newFeatureScope.value = 'all'
    selectedDurationPreset.value = '1d'
    customDurationValue.value = 1
    customDurationUnit.value = 'days'
    customDate.value = ''
    await loadCredentials()
  } catch (err) {
    errorMessage.value = err.message || 'Gagal membuat kredensial baru'
  } finally {
    isSubmitting.value = false
  }
}

async function handleCopy(key, id) {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(key)
    } else {
      const ta = document.createElement('textarea')
      ta.value = key
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copiedId.value = id
    setTimeout(() => {
      if (copiedId.value === id) copiedId.value = null
    }, 2500)
  } catch (_) {}
}

function toggleShowKey(id) {
  if (visibleKeys.value.has(id)) {
    visibleKeys.value.delete(id)
  } else {
    visibleKeys.value.add(id)
  }
}

async function handleToggleActive(cred) {
  actionInProgressId.value = cred.id
  try {
    const newStatus = !cred.is_active
    await store.updateAdminCredential(cred.id, { is_active: newStatus })
    await loadCredentials()
  } catch (err) {
    alert(`Gagal mengubah status: ${err.message}`)
  } finally {
    actionInProgressId.value = null
  }
}

async function handleExtend(cred, days) {
  actionInProgressId.value = cred.id
  try {
    await store.updateAdminCredential(cred.id, { extend_days: days, is_active: true })
    await loadCredentials()
  } catch (err) {
    alert(`Gagal memperpanjang masa aktif: ${err.message}`)
  } finally {
    actionInProgressId.value = null
  }
}

async function handleDelete(cred) {
  if (!confirm(`Yakin ingin menghapus kredensial "${cred.name}"? Pengguna tidak akan dapat mengakses sistem lagi.`)) {
    return
  }

  actionInProgressId.value = cred.id
  try {
    await store.deleteAdminCredential(cred.id)
    await loadCredentials()
  } catch (err) {
    alert(`Gagal menghapus kredensial: ${err.message}`)
  } finally {
    actionInProgressId.value = null
  }
}

function handleOpenEdit(cred) {
  editingCred.value = cred
  editName.value = cred.name
  editIsActive.value = cred.is_active
  if (cred.can_generate_diagram && !cred.can_generate_ui) {
    editFeatureScope.value = 'diagram'
  } else if (!cred.can_generate_diagram && cred.can_generate_ui) {
    editFeatureScope.value = 'ui'
  } else {
    editFeatureScope.value = 'all'
  }
  editExpiryMode.value = 'keep'
  editDurationValue.value = 1
  editDurationUnit.value = 'hours'
  if (cred.expires_at) {
    const d = new Date(cred.expires_at)
    const pad = (n) => String(n).padStart(2, '0')
    editCustomDate.value = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } else {
    editCustomDate.value = ''
  }
  editError.value = ''
  isEditModalOpen.value = true
}

function handleCloseEdit() {
  isEditModalOpen.value = false
  editingCred.value = null
  editError.value = ''
}

async function handleSaveEdit() {
  if (!editingCred.value) return
  if (!editName.value.trim()) {
    editError.value = 'Nama pengguna / label harus diisi'
    return
  }

  isEditSaving.value = true
  editError.value = ''
  try {
    const payload = {
      name: editName.value.trim(),
      is_active: editIsActive.value,
    }

    if (editingCred.value.role !== 'admin') {
      payload.can_generate_diagram = editFeatureScope.value !== 'ui'
      payload.can_generate_ui = editFeatureScope.value !== 'diagram'
    }

    if (editExpiryMode.value === 'permanent') {
      payload.set_permanent = true
    } else if (editExpiryMode.value === 'set_duration') {
      const val = parseInt(editDurationValue.value) || 1
      if (editDurationUnit.value === 'minutes') {
        payload.duration_minutes = val
      } else if (editDurationUnit.value === 'hours') {
        payload.duration_hours = val
      } else {
        payload.duration_days = val
      }
    } else if (editExpiryMode.value === 'extend') {
      const val = parseInt(editDurationValue.value) || 1
      if (editDurationUnit.value === 'minutes') {
        payload.extend_minutes = val
      } else if (editDurationUnit.value === 'hours') {
        payload.extend_hours = val
      } else {
        payload.extend_days = val
      }
    } else if (editExpiryMode.value === 'datetime' && editCustomDate.value) {
      payload.expires_at = new Date(editCustomDate.value).toISOString()
    }

    await store.updateAdminCredential(editingCred.value.id, payload)
    isEditModalOpen.value = false
    editingCred.value = null
    await loadCredentials()
  } catch (err) {
    editError.value = err.message || 'Gagal memperbarui kredensial'
  } finally {
    isEditSaving.value = false
  }
}
</script>

<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm transition-all"
    @click.self="emit('close')"
  >
    <div
      class="w-full max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-800 dark:text-slate-100"
    >
      <!-- Modal Header -->
      <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
            <ShieldCheck class="w-5 h-5" />
          </div>
          <div>
            <h2 class="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Manajemen Kredensial Pengguna
            </h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              Buat akses acak per user dengan masa aktif otomatis (1 hari, 7 hari, 30 hari, atau permanen).
            </p>
          </div>
        </div>

        <button
          type="button"
          @click="emit('close')"
          class="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Modal Body (Scrollable) -->
      <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        <!-- Notification: Newly Generated Credential -->
        <transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 -translate-y-2"
          enter-to-class="opacity-100 translate-y-0"
        >
          <div
            v-if="newlyCreated"
            class="p-4 rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
          >
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0">
                <Check class="w-4 h-4" />
              </div>
              <div>
                <p class="text-xs font-bold">Kredensial Baru Berhasil Dibuat untuk: {{ newlyCreated.name }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="font-mono font-bold text-xs bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-700/60 text-emerald-950 dark:text-emerald-100 select-all">
                    {{ newlyCreated.credential_key }}
                  </span>
                  <span class="text-[11px] text-emerald-700 dark:text-emerald-300">
                    ({{ newlyCreated.expires_in_human }})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              @click="handleCopy(newlyCreated.credential_key, 'newly-created')"
              class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer flex-shrink-0"
            >
              <Check v-if="copiedId === 'newly-created'" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedId === 'newly-created' ? 'Tersalin!' : 'Salin Kredensial' }}</span>
            </button>
          </div>
        </transition>

        <!-- Form: Buat Kredensial Baru -->
        <div class="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
          <div class="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <Plus class="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Generate Kredensial Pengguna Baru</span>
          </div>

          <form @submit.prevent="handleCreate" class="space-y-3">
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
              <!-- Label / Nama -->
              <div class="sm:col-span-5">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Pengguna / Catatan Klien
                </label>
                <input
                  v-model="newName"
                  type="text"
                  placeholder="Contoh: Klien PT Abadi, Tim Frontend"
                  required
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <!-- Masa Aktif Preset -->
              <div class="sm:col-span-4">
                <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Masa Aktif Kredensial
                </label>
                <select
                  v-model="selectedDurationPreset"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option v-for="opt in durationPresetOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>

              <!-- Submit Button -->
              <div class="sm:col-span-3">
                <button
                  type="submit"
                  :disabled="isSubmitting || !newName.trim()"
                  class="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Loader2 v-if="isSubmitting" class="w-3.5 h-3.5 animate-spin" />
                  <Sparkles v-else class="w-3.5 h-3.5" />
                  <span>Generate Acak</span>
                </button>
              </div>
            </div>

            <!-- Hak Akses Fitur -->
            <div>
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                Hak Akses Fitur Pengguna
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="newFeatureScope = 'all'"
                  class="p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer"
                  :class="newFeatureScope === 'all'
                    ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'"
                >
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0" :class="newFeatureScope === 'all' ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-400'">
                    <div v-if="newFeatureScope === 'all'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>🌐 Semua Fitur</span>
                    </div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diagram Alur + Desain UI</div>
                  </div>
                </button>

                <button
                  type="button"
                  @click="newFeatureScope = 'diagram'"
                  class="p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer"
                  :class="newFeatureScope === 'diagram'
                    ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'"
                >
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0" :class="newFeatureScope === 'diagram' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-400'">
                    <div v-if="newFeatureScope === 'diagram'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>📊 Hanya Diagram</span>
                    </div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">ERD, Flowchart, Arsitektur</div>
                  </div>
                </button>

                <button
                  type="button"
                  @click="newFeatureScope = 'ui'"
                  class="p-2.5 rounded-lg border text-left flex items-center gap-2.5 transition-all cursor-pointer"
                  :class="newFeatureScope === 'ui'
                    ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300'"
                >
                  <div class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0" :class="newFeatureScope === 'ui' ? 'border-purple-600 bg-purple-600 text-white' : 'border-slate-400'">
                    <div v-if="newFeatureScope === 'ui'" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <div class="text-xs font-bold leading-tight flex items-center gap-1">
                      <span>🎨 Hanya Desain UI</span>
                    </div>
                    <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Mockup Web, Mobile, Desktop</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- Custom Duration (Menit / Jam / Hari) -->
            <div v-if="selectedDurationPreset === 'custom'" class="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <span class="text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                Tentukan Durasi:
              </span>
              <input
                v-model.number="customDurationValue"
                type="number"
                min="1"
                required
                class="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
              <select
                v-model="customDurationUnit"
                class="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              >
                <option value="minutes">Menit</option>
                <option value="hours">Jam</option>
                <option value="days">Hari</option>
              </select>
            </div>

            <!-- Custom Specific Date Field (if selected) -->
            <div v-if="selectedDurationPreset === 'datetime'" class="pt-2 border-t border-slate-200 dark:border-slate-800">
              <label class="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Pilih Tanggal & Jam Kedaluwarsa
              </label>
              <input
                v-model="customDate"
                type="datetime-local"
                required
                class="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white"
              />
            </div>
          </form>
        </div>

        <!-- Table: Daftar Kredensial -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-xs font-bold text-slate-900 dark:text-white">
              Daftar Kredensial Aktif ({{ credentials.length }})
            </h3>
            <button
              type="button"
              @click="loadCredentials"
              class="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 cursor-pointer"
            >
              <RotateCw class="w-3 h-3" :class="{ 'animate-spin': isLoading }" />
              <span>Muat Ulang</span>
            </button>
          </div>

          <div class="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
            <div class="overflow-x-auto">
              <table class="w-full text-left text-xs">
                <thead class="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                  <tr>
                    <th class="px-4 py-3">Nama / Peruntukan</th>
                    <th class="px-4 py-3">Kode Kredensial</th>
                    <th class="px-4 py-3">Izin Fitur</th>
                    <th class="px-4 py-3">Status</th>
                    <th class="px-4 py-3">Masa Aktif</th>
                    <th class="px-4 py-3 text-center">Proyek</th>
                    <th class="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  <tr v-if="credentials.length === 0 && !isLoading">
                    <td colspan="7" class="px-4 py-8 text-center text-slate-400">
                      Belum ada kredensial pengguna tambahan.
                    </td>
                  </tr>

                  <tr
                    v-for="cred in credentials"
                    :key="cred.id"
                    class="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <!-- Nama / Role -->
                    <td class="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                      <div class="flex items-center gap-2">
                        <span>{{ cred.name }}</span>
                        <span
                          v-if="cred.role === 'admin'"
                          class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                        >
                          MASTER ADMIN
                        </span>
                      </div>
                      <div class="text-[10px] text-slate-400 font-normal">
                        Dibuat: {{ new Date(cred.created_at).toLocaleDateString('id-ID') }}
                      </div>
                    </td>

                    <!-- Kode Kredensial (Masked / Toggle) -->
                    <td class="px-4 py-3 font-mono">
                      <div class="flex items-center gap-1.5">
                        <span class="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {{ visibleKeys.has(cred.id) ? cred.credential_key : (cred.credential_key.substring(0, 7) + '••••••••') }}
                        </span>
                        <button
                          type="button"
                          @click="toggleShowKey(cred.id)"
                          class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                          :title="visibleKeys.has(cred.id) ? 'Sembunyikan' : 'Lihat'"
                        >
                          <EyeOff v-if="visibleKeys.has(cred.id)" class="w-3.5 h-3.5" />
                          <Eye v-else class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="handleCopy(cred.credential_key, cred.id)"
                          class="p-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded transition-colors cursor-pointer"
                          title="Salin Kredensial"
                        >
                          <Check v-if="copiedId === cred.id" class="w-3.5 h-3.5 text-emerald-500" />
                          <Copy v-else class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <!-- Izin Fitur Badge -->
                    <td class="px-4 py-3">
                      <span
                        v-if="cred.can_generate_diagram && cred.can_generate_ui"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60"
                        title="Dapat mengakses Diagram & Desain UI"
                      >
                        <span>🌐</span>
                        <span>Diagram & UI</span>
                      </span>
                      <span
                        v-else-if="cred.can_generate_diagram"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60"
                        title="Hanya dapat membuat dan mengedit Diagram"
                      >
                        <span>📊</span>
                        <span>Diagram Saja</span>
                      </span>
                      <span
                        v-else-if="cred.can_generate_ui"
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                        title="Hanya dapat membuat dan mengedit Desain UI"
                      >
                        <span>🎨</span>
                        <span>Desain UI Saja</span>
                      </span>
                      <span
                        v-else
                        class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700"
                      >
                        Terkunci
                      </span>
                    </td>

                    <!-- Status Badge -->
                    <td class="px-4 py-3">
                      <span
                        v-if="!cred.is_active"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60"
                      >
                        Dinonaktifkan
                      </span>
                      <span
                        v-else-if="cred.is_expired"
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60"
                      >
                        Kedaluwarsa
                      </span>
                      <span
                        v-else
                        class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60"
                      >
                        Aktif
                      </span>
                    </td>

                    <!-- Masa Aktif / Sisa Hari -->
                    <td class="px-4 py-3 text-slate-600 dark:text-slate-300 text-[11px]">
                      <div class="font-medium">
                        {{ cred.expires_in_human }}
                      </div>
                      <div v-if="cred.expires_at" class="text-[10px] text-slate-400">
                        s/d {{ new Date(cred.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) }}
                      </div>
                    </td>

                    <!-- Jumlah Proyek -->
                    <td class="px-4 py-3 text-center">
                      <span class="inline-flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <FolderOpen class="w-3 h-3 text-slate-400" />
                        <span>{{ cred.project_count }}</span>
                      </span>
                    </td>

                    <!-- Aksi -->
                    <td class="px-4 py-3 text-right">
                      <div class="inline-flex items-center gap-1">
                        <!-- Edit Button (Pencil) -->
                        <button
                          type="button"
                          @click="handleOpenEdit(cred)"
                          :disabled="actionInProgressId === cred.id"
                          class="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors cursor-pointer"
                          title="Edit Kredensial (Nama, Status, Waktu Fleksibel)"
                        >
                          <Pencil class="w-3.5 h-3.5" />
                        </button>

                        <!-- Perpanjang (+1 Hari) jika bukan admin master -->
                        <button
                          v-if="cred.role !== 'admin'"
                          type="button"
                          @click="handleExtend(cred, 1)"
                          :disabled="actionInProgressId === cred.id"
                          class="px-1.5 py-1 text-[10px] font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                          title="Perpanjang +1 Hari Langsung"
                        >
                          +1H
                        </button>

                        <!-- Toggle Aktif/Nonaktif -->
                        <button
                          v-if="cred.role !== 'admin'"
                          type="button"
                          @click="handleToggleActive(cred)"
                          :disabled="actionInProgressId === cred.id"
                          :title="cred.is_active ? 'Nonaktifkan Kredensial' : 'Aktifkan Kembali Kredensial'"
                          :class="[
                            'p-1.5 rounded transition-colors cursor-pointer',
                            cred.is_active
                              ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                              : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                          ]"
                        >
                          <Power class="w-3.5 h-3.5" />
                        </button>

                        <!-- Hapus -->
                        <button
                          v-if="cred.role !== 'admin'"
                          type="button"
                          @click="handleDelete(cred)"
                          :disabled="actionInProgressId === cred.id"
                          title="Hapus Kredensial"
                          class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="px-6 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 text-xs text-slate-500">
        <span>Kredensial kedaluwarsa tetap menyimpan seluruh riwayat chat & proyek di database.</span>
        <button
          type="button"
          @click="emit('close')"
          class="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-lg transition-colors cursor-pointer"
        >
          Tutup
        </button>
      </div>

      <!-- Floating Sub-Modal: Edit Credential -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 scale-95"
        enter-to-class="opacity-100 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="isEditModalOpen"
          class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs"
          @click.self="handleCloseEdit"
        >
          <div class="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800/60">
                  <Pencil class="w-4 h-4" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Edit Kredensial Pengguna</h3>
                  <p class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">{{ editingCred?.credential_key }}</p>
                </div>
              </div>
              <button
                type="button"
                @click="handleCloseEdit"
                class="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Body -->
            <div class="p-5 space-y-4 text-xs">
              <div v-if="editError" class="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-900/60">
                <AlertCircle class="w-4 h-4 shrink-0" />
                <span>{{ editError }}</span>
              </div>

              <!-- Nama -->
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Pengguna / Catatan
                </label>
                <input
                  v-model="editName"
                  type="text"
                  required
                  placeholder="Contoh: Klien PT Abadi"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <!-- Status Akses -->
              <div>
                <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Status Akses
                </label>
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    @click="editIsActive = true"
                    :class="[
                      'py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer',
                      editIsActive
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Aktif</span>
                  </button>
                  <button
                    type="button"
                    :disabled="editingCred?.role === 'admin'"
                    @click="editingCred?.role !== 'admin' && (editIsActive = false)"
                    :class="[
                      'py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-all',
                      editingCred?.role === 'admin'
                        ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 text-slate-400'
                        : !editIsActive
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 shadow-xs cursor-pointer'
                          : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-pointer'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                    <span>Nonaktif</span>
                  </button>
                </div>
              </div>

              <!-- Hak Akses Fitur -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Hak Akses Fitur
                  </label>
                  <span v-if="editingCred?.role === 'admin'" class="text-[10px] text-amber-500 font-semibold">
                    Master Admin (Full Access Terkunci)
                  </span>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    :disabled="editingCred?.role === 'admin'"
                    @click="editingCred?.role !== 'admin' && (editFeatureScope = 'all')"
                    class="py-2 px-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
                    :class="[
                      editingCred?.role === 'admin' ? 'cursor-not-allowed opacity-90' : 'cursor-pointer',
                      editFeatureScope === 'all'
                        ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full shrink-0" :class="editFeatureScope === 'all' ? 'bg-indigo-500' : 'bg-slate-400'"></span>
                    <div class="min-w-0">
                      <div class="text-xs font-bold truncate">🌐 Semua Fitur</div>
                      <div class="text-[9px] text-slate-500 dark:text-slate-400">Diagram + UI</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    :disabled="editingCred?.role === 'admin'"
                    @click="editingCred?.role !== 'admin' && (editFeatureScope = 'diagram')"
                    class="py-2 px-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
                    :class="[
                      editingCred?.role === 'admin' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                      editFeatureScope === 'diagram'
                        ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full shrink-0" :class="editFeatureScope === 'diagram' ? 'bg-amber-500' : 'bg-slate-400'"></span>
                    <div class="min-w-0">
                      <div class="text-xs font-bold truncate">📊 Diagram</div>
                      <div class="text-[9px] text-slate-500 dark:text-slate-400">Hanya Diagram</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    :disabled="editingCred?.role === 'admin'"
                    @click="editingCred?.role !== 'admin' && (editFeatureScope = 'ui')"
                    class="py-2 px-2.5 rounded-lg border text-left flex items-center gap-2 transition-all"
                    :class="[
                      editingCred?.role === 'admin' ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                      editFeatureScope === 'ui'
                        ? 'border-purple-500 bg-purple-50/80 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 ring-1 ring-purple-500/30'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    ]"
                  >
                    <span class="w-2 h-2 rounded-full shrink-0" :class="editFeatureScope === 'ui' ? 'bg-purple-500' : 'bg-slate-400'"></span>
                    <div class="min-w-0">
                      <div class="text-xs font-bold truncate">🎨 Desain UI</div>
                      <div class="text-[9px] text-slate-500 dark:text-slate-400">Hanya Desain UI</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Pengaturan Masa Aktif Fleksibel -->
              <div class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div class="flex items-center justify-between">
                  <label class="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    Pengaturan Masa Aktif
                  </label>
                  <span class="text-[10px] text-slate-400">
                    Saat ini: {{ editingCred?.expires_in_human }}
                  </span>
                </div>

                <select
                  v-model="editExpiryMode"
                  class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                >
                  <option value="keep">Tetap (Jangan ubah masa aktif)</option>
                  <option value="set_duration">Atur Masa Aktif Baru (Mulai Dari Sekarang)</option>
                  <option value="extend">Perpanjang dari Masa Aktif Saat Ini</option>
                  <option value="permanent">Jadikan Permanen (Tanpa Batas Waktu)</option>
                  <option value="datetime">Kustom Tanggal & Jam Kedaluwarsa</option>
                </select>

                <!-- Input Durasi Fleksibel (Menit / Jam / Hari) -->
                <div
                  v-if="editExpiryMode === 'set_duration' || editExpiryMode === 'extend'"
                  class="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {{ editExpiryMode === 'set_duration' ? 'Aktif selama:' : 'Tambah durasi:' }}
                    </span>
                    <input
                      v-model.number="editDurationValue"
                      type="number"
                      min="1"
                      required
                      class="w-20 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                    />
                    <select
                      v-model="editDurationUnit"
                      class="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-hidden"
                    >
                      <option value="minutes">Menit</option>
                      <option value="hours">Jam</option>
                      <option value="days">Hari</option>
                    </select>
                  </div>

                  <!-- Quick shortcuts -->
                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <button
                      type="button"
                      @click="editDurationValue = 15; editDurationUnit = 'minutes'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      15 Menit
                    </button>
                    <button
                      type="button"
                      @click="editDurationValue = 30; editDurationUnit = 'minutes'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      30 Menit
                    </button>
                    <button
                      type="button"
                      @click="editDurationValue = 1; editDurationUnit = 'hours'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      1 Jam
                    </button>
                    <button
                      type="button"
                      @click="editDurationValue = 12; editDurationUnit = 'hours'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      12 Jam
                    </button>
                    <button
                      type="button"
                      @click="editDurationValue = 1; editDurationUnit = 'days'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      1 Hari
                    </button>
                    <button
                      type="button"
                      @click="editDurationValue = 7; editDurationUnit = 'days'"
                      class="px-2 py-0.5 text-[10px] rounded-md border border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      7 Hari
                    </button>
                  </div>
                </div>

                <!-- Input Tanggal & Jam Spesifik -->
                <div v-if="editExpiryMode === 'datetime'" class="pt-1">
                  <input
                    v-model="editCustomDate"
                    type="datetime-local"
                    required
                    class="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div class="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                @click="handleCloseEdit"
                class="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                @click="handleSaveEdit"
                :disabled="isEditSaving || !editName.trim()"
                class="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Loader2 v-if="isEditSaving" class="w-3.5 h-3.5 animate-spin" />
                <Check v-else class="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>
