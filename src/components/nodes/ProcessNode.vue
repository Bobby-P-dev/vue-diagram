<script setup>
import { ref, computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import {
  Activity,
  Pencil,
  Send,
  Search,
  CheckCircle2,
  ShoppingCart,
  CreditCard,
  FileText,
  User,
  Users,
  Bell,
  Settings,
  Database,
  RefreshCw,
  AlertCircle,
  Mail,
  Package,
  Truck,
  ShieldCheck,
} from 'lucide-vue-next'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const label = computed(() => props.data?.label || 'Process')
const subtitle = computed(() => props.data?.subtitle || props.data?.subText || '')
const lane = computed(() => props.data?.lane || '')

const isEditing = ref(false)
const editValue = ref('')
const inputRef = ref(null)

function startEdit() {
  isEditing.value = true
  editValue.value = props.data?.label || ''
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function saveEdit() {
  if (!isEditing.value) return
  if (editValue.value.trim()) {
    props.data.label = editValue.value.trim()
  }
  isEditing.value = false
}

function cancelEdit() {
  isEditing.value = false
}

const ICON_MAP = {
  pencil: Pencil,
  edit: Pencil,
  write: Pencil,
  draft: Pencil,
  send: Send,
  submit: Send,
  search: Search,
  review: Search,
  inspect: Search,
  check: CheckCircle2,
  approve: CheckCircle2,
  cart: ShoppingCart,
  purchase: ShoppingCart,
  order: ShoppingCart,
  'credit-card': CreditCard,
  payment: CreditCard,
  pay: CreditCard,
  file: FileText,
  'file-text': FileText,
  document: FileText,
  user: User,
  requester: User,
  users: Users,
  bell: Bell,
  notify: Bell,
  settings: Settings,
  database: Database,
  system: Database,
  refresh: RefreshCw,
  sync: RefreshCw,
  alert: AlertCircle,
  mail: Mail,
  email: Mail,
  box: Package,
  package: Package,
  delivery: Truck,
  truck: Truck,
  shield: ShieldCheck,
}

const resolvedIcon = computed(() => {
  const iconKey = String(props.data?.icon || '').toLowerCase().trim()
  return ICON_MAP[iconKey] || Activity
})
</script>

<template>
  <div
    class="w-[210px] rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-indigo-400 group"
  >
    <!-- 4-Way Handles for both LR and TB flows -->
    <Handle
      type="target"
      :position="Position.Left"
      id="left"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
    />
    <Handle
      type="target"
      :position="Position.Top"
      id="top"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
    />

    <div class="flex items-start gap-2.5">
      <div
        class="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0 border border-indigo-100/80 text-indigo-600 mt-0.5"
      >
        <component :is="resolvedIcon" class="w-3.5 h-3.5" />
      </div>
      <div class="min-w-0 flex-1">
        <div v-if="isEditing" class="w-full">
          <input
            ref="inputRef"
            v-model="editValue"
            type="text"
            class="w-full text-xs font-bold border border-indigo-500 rounded px-1.5 py-0.5 bg-white text-slate-900 shadow-inner focus:outline-none ring-1 ring-indigo-400"
            @blur="saveEdit"
            @keydown.enter.prevent="saveEdit"
            @keydown.esc.prevent="cancelEdit"
            @click.stop
            @dblclick.stop
            @keydown.stop
          />
        </div>
        <p
          v-else
          @dblclick.stop="startEdit"
          class="text-xs font-bold text-slate-800 leading-snug break-words cursor-text hover:text-indigo-600 transition-colors"
          title="Double-click untuk edit teks"
        >
          {{ label }}
        </p>
        <p v-if="subtitle" class="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
          {{ subtitle }}
        </p>
        <span
          v-if="lane"
          class="mt-1.5 inline-block text-[9px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200/60"
        >
          {{ lane }}
        </span>
      </div>
    </div>

    <Handle
      type="source"
      :position="Position.Right"
      id="right"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
    />
    <Handle
      type="source"
      :position="Position.Bottom"
      id="bottom"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity"
    />
  </div>
</template>
