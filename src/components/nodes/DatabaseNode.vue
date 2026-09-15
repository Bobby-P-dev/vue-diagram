<script setup>
import { computed } from 'vue'
import { Handle, Position } from '@vue-flow/core'
import { Database, Key, Link2 } from 'lucide-vue-next'

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

const tableName = computed(() => props.data?.label || 'table_name')
const subText = computed(() => props.data?.subText || '')
const columns = computed(() => {
  if (Array.isArray(props.data?.columns)) return props.data.columns
  return []
})
</script>

<template>
  <div
    class="min-w-[280px] w-max max-w-2xl rounded-xl border border-slate-300 bg-white shadow-md transition-all hover:shadow-lg overflow-hidden select-none font-sans"
  >
    <!-- Multi-directional Handles for flexible ERD connections -->
    <Handle
      id="top-target"
      type="target"
      :position="Position.Top"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500"
    />
    <Handle
      id="left-target"
      type="target"
      :position="Position.Left"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500"
    />

    <!-- Table Header -->
    <div class="bg-slate-800 text-white px-3.5 py-2 flex items-center justify-between gap-3 border-b border-slate-700">
      <div class="flex items-center gap-2 min-w-0">
        <Database class="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        <span class="font-bold text-xs sm:text-sm tracking-wide font-mono whitespace-nowrap">
          {{ tableName }}
        </span>
      </div>
      <span
        v-if="columns.length"
        class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300 flex-shrink-0"
      >
        {{ columns.length }} cols
      </span>
    </div>

    <!-- Optional description / subText -->
    <div
      v-if="subText && columns.length === 0"
      class="p-3 text-xs text-slate-500 bg-slate-50/50 text-center"
    >
      {{ subText }}
    </div>

    <!-- Columns Table List -->
    <div v-if="columns.length > 0" class="divide-y divide-slate-100 text-xs">
      <div
        v-for="(col, idx) in columns"
        :key="idx"
        class="flex items-center justify-between px-3.5 py-1.5 hover:bg-indigo-50/40 transition-colors gap-4 whitespace-nowrap"
      >
        <!-- Left: Key indicator & Column Name -->
        <div class="flex items-center gap-1.5 flex-shrink-0">
          <span
            v-if="col.is_pk"
            class="inline-flex items-center gap-0.5 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex-shrink-0"
            title="Primary Key"
          >
            <Key class="w-2.5 h-2.5 text-amber-700" />
            PK
          </span>
          <span
            v-else-if="col.is_fk"
            class="inline-flex items-center gap-0.5 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-300 flex-shrink-0"
            title="Foreign Key"
          >
            <Link2 class="w-2.5 h-2.5 text-sky-700" />
            FK
          </span>
          <span
            v-else
            class="w-1.5 h-1.5 rounded-full bg-slate-300 inline-block ml-0.5 flex-shrink-0"
          ></span>

          <span
            :class="[
              'font-mono font-medium whitespace-nowrap',
              col.is_pk ? 'text-slate-900 font-semibold' : 'text-slate-700'
            ]"
          >
            {{ col.name }}
          </span>
        </div>

        <!-- Right: Data Type & Constraints -->
        <div class="flex items-center gap-1.5 flex-shrink-0 text-[11px] font-mono ml-auto">
          <span class="text-indigo-600 font-medium whitespace-nowrap">
            {{ col.type }}
          </span>
          <span
            v-if="col.constraint"
            class="text-[9px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 whitespace-nowrap"
          >
            {{ col.constraint }}
          </span>
        </div>
      </div>
    </div>

    <!-- Output Handles -->
    <Handle
      id="bottom-source"
      type="source"
      :position="Position.Bottom"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500"
    />
    <Handle
      id="right-source"
      type="source"
      :position="Position.Right"
      class="!h-2.5 !w-2.5 !border-2 !border-white !bg-indigo-500"
    />
  </div>
</template>
