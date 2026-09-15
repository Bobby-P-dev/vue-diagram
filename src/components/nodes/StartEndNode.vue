<script setup>
import { ref, computed, nextTick } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Play, CheckCircle2 } from 'lucide-vue-next'

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'input',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
})

const isInput = computed(() => props.type === 'input')

const label = computed(
  () => props.data?.label || (isInput.value ? 'Start' : 'End'),
)

const nodeClasses = computed(() =>
  isInput.value
    ? 'border-emerald-500 text-emerald-700 bg-emerald-50/95'
    : 'border-rose-500 text-rose-700 bg-rose-50/95',
)

const handleClass = computed(() =>
  isInput.value ? '!bg-emerald-500' : '!bg-rose-500',
)

const isEditing = ref(false)
const editValue = ref('')
const inputRef = ref(null)

function startEdit() {
  isEditing.value = true
  editValue.value = label.value
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
    class="w-[150px] relative flex items-center justify-center gap-1.5 rounded-full border-2 px-3 py-2 shadow-sm font-bold text-xs tracking-wide transition-all duration-200 hover:shadow-md group"
    :class="nodeClasses"
  >
    <!-- Left handle for Output/End node in LR flow -->
    <Handle
      v-if="type === 'output'"
      id="left"
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-white !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="handleClass"
    />

    <!-- Top handle for Output/End node in TB flow -->
    <Handle
      v-if="type === 'output'"
      id="top"
      type="target"
      :position="Position.Top"
      class="!h-2.5 !w-2.5 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      :class="handleClass"
    />

    <Play v-if="isInput" class="w-3 h-3 text-emerald-600 fill-emerald-600 flex-shrink-0" />
    <CheckCircle2 v-else class="w-3 h-3 text-rose-600 flex-shrink-0" />

    <div v-if="isEditing" class="w-full">
      <input
        ref="inputRef"
        v-model="editValue"
        type="text"
        class="w-full text-xs font-bold text-center border border-slate-400 rounded-full px-2 py-0.5 bg-white text-slate-900 shadow-inner focus:outline-none ring-1 ring-indigo-400"
        @blur="saveEdit"
        @keydown.enter.prevent="saveEdit"
        @keydown.esc.prevent="cancelEdit"
        @click.stop
        @dblclick.stop
        @keydown.stop
      />
    </div>
    <span
      v-else
      @dblclick.stop="startEdit"
      class="truncate cursor-text hover:underline"
      title="Double-click untuk edit teks"
    >
      {{ label }}
    </span>

    <!-- Right handle for Input/Start node in LR flow -->
    <Handle
      v-if="type === 'input'"
      id="right"
      type="source"
      :position="Position.Right"
      class="!h-2.5 !w-2.5 !border-2 !border-white !top-1/2 !-translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
      :class="handleClass"
    />

    <!-- Bottom handle for Input/Start node in TB flow -->
    <Handle
      v-if="type === 'input'"
      id="bottom"
      type="source"
      :position="Position.Bottom"
      class="!h-2.5 !w-2.5 !border-2 !border-white opacity-0 group-hover:opacity-100 transition-opacity"
      :class="handleClass"
    />
  </div>
</template>
