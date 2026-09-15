<script setup>
import { ref, computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { GitBranch } from 'lucide-vue-next'

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

const label = computed(() => props.data?.label || 'Condition?')

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
</script>

<template>
  <div
    class="w-[160px] rounded-xl border-2 border-amber-400/90 bg-amber-50 px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md hover:border-amber-500 group"
  >
    <!-- Left handle for horizontal incoming flow -->
    <Handle
      id="left"
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
    />

    <!-- Top handle for vertical incoming flow -->
    <Handle
      id="top"
      type="target"
      :position="Position.Top"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
    />

    <div class="text-center">
      <span
        class="mb-1.5 inline-flex items-center gap-1 rounded-full bg-amber-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800"
      >
        <GitBranch class="w-3 h-3 text-amber-700" />
        Gateway
      </span>

      <div v-if="isEditing" class="w-full mt-1">
        <input
          ref="inputRef"
          v-model="editValue"
          type="text"
          class="w-full text-xs font-bold text-center border border-amber-500 rounded px-1.5 py-0.5 bg-white text-slate-900 shadow-inner focus:outline-none ring-1 ring-amber-400"
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
        class="text-xs font-bold text-amber-950 leading-snug break-words cursor-text hover:text-amber-700 transition-colors"
        title="Double-click untuk edit teks"
      >
        {{ label }}
      </p>
    </div>

    <!-- Right handle for horizontal outgoing flow -->
    <Handle
      id="right"
      type="source"
      :position="Position.Right"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500 !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
    />

    <!-- Bottom handle for vertical outgoing flow -->
    <Handle
      id="bottom"
      type="source"
      :position="Position.Bottom"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"
    />
  </div>
</template>
