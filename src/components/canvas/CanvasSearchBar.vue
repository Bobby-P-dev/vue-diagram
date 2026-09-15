<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  Search,
  X,
  ChevronUp,
  ChevronDown,
  Database,
  Columns,
  Workflow,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-vue-next'

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:isOpen', 'focusNode'])

const searchInputRef = ref(null)
const searchQuery = ref('')
const selectedIndex = ref(0)
const isDropdownOpen = ref(false)

// Filter out background swimlane nodes
const searchableNodes = computed(() => {
  return (props.nodes || []).filter((n) => {
    if (!n || !n.id) return false
    if (n.type === 'swimlane' || String(n.id).startsWith('swimlane-')) return false
    return true
  })
})

// Search matching algorithm
const searchResults = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return []

  const results = []

  for (const node of searchableNodes.value) {
    const id = String(node.id || '').toLowerCase()
    const label = String(node.data?.label || node.data?.title || '').toLowerCase()
    const desc = String(node.data?.description || '').toLowerCase()
    const isDb = node.type === 'database' || (Array.isArray(node.data?.columns) && node.data.columns.length > 0)
    
    // Check table / node name match
    const isExactName = label === query || id === query
    const isNameMatch = label.includes(query) || id.includes(query)

    // Check columns match for ERD database tables
    const matchedColumns = []
    if (Array.isArray(node.data?.columns)) {
      for (const col of node.data.columns) {
        const colName = String(col.name || '').toLowerCase()
        const colType = String(col.type || '').toLowerCase()
        if (colName.includes(query) || colType.includes(query)) {
          matchedColumns.push(col.name || colName)
        }
      }
    }

    if (isNameMatch || matchedColumns.length > 0 || desc.includes(query)) {
      let score = 0
      if (isExactName) score = 100
      else if (label.startsWith(query)) score = 80
      else if (isNameMatch) score = 60
      else if (matchedColumns.length > 0) score = 40
      else score = 20

      results.push({
        id: node.id,
        node,
        name: node.data?.label || node.data?.title || node.id,
        type: node.type || 'default',
        isDatabase: isDb,
        matchedColumns,
        score,
      })
    }
  }

  // Sort by relevance score descending
  results.sort((a, b) => b.score - a.score)
  return results
})

// When results change, reset selected index and auto-focus first match
watch(
  () => searchResults.value,
  (results) => {
    if (results.length > 0) {
      selectedIndex.value = 0
      emitFocus(results[0].id)
    }
  }
)

function emitFocus(nodeId) {
  if (!nodeId) return
  emit('focusNode', nodeId)
}

function handleSelect(index) {
  if (index < 0 || index >= searchResults.value.length) return
  selectedIndex.value = index
  const target = searchResults.value[index]
  if (target) {
    emitFocus(target.id)
  }
}

function nextMatch() {
  if (searchResults.value.length === 0) return
  const nextIdx = (selectedIndex.value + 1) % searchResults.value.length
  handleSelect(nextIdx)
}

function prevMatch() {
  if (searchResults.value.length === 0) return
  const prevIdx = (selectedIndex.value - 1 + searchResults.value.length) % searchResults.value.length
  handleSelect(prevIdx)
}

function handleKeyDown(e) {
  if (e.key === 'Enter') {
    e.preventDefault()
    if (e.shiftKey) {
      prevMatch()
    } else {
      nextMatch()
    }
  } else if (e.key === 'Escape') {
    e.preventDefault()
    closeSearch()
  } else if (e.key === 'ArrowDown' && isDropdownOpen.value) {
    e.preventDefault()
    nextMatch()
  } else if (e.key === 'ArrowUp' && isDropdownOpen.value) {
    e.preventDefault()
    prevMatch()
  }
}

function openSearch() {
  emit('update:isOpen', true)
  isDropdownOpen.value = true
  nextTick(() => {
    if (searchInputRef.value) {
      searchInputRef.value.focus()
      searchInputRef.value.select()
    }
    if (searchResults.value.length > 0) {
      emitFocus(searchResults.value[selectedIndex.value]?.id)
    }
  })
}

function closeSearch() {
  emit('update:isOpen', false)
  isDropdownOpen.value = false
}

// Global shortcut handler (Ctrl+F / Cmd+F)
function handleGlobalShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
    e.preventDefault()
    if (props.isOpen) {
      if (searchInputRef.value) {
        searchInputRef.value.focus()
        searchInputRef.value.select()
      }
    } else {
      openSearch()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})

// Auto-focus when opened from outside
watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      openSearch()
    } else {
      isDropdownOpen.value = false
    }
  }
)
</script>

<template>
  <div class="absolute top-3 left-4 z-30 select-none">
    <!-- COLLAPSED TRIGGER BUTTON -->
    <button
      v-if="!isOpen"
      type="button"
      @click="openSearch"
      class="group flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-200/90 rounded-xl shadow-xs backdrop-blur-md transition-all text-xs font-medium cursor-pointer"
      title="Cari Tabel / Node di Canvas (Ctrl+F)"
    >
      <Search class="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
      <span>Cari di Canvas...</span>
      <kbd class="ml-1 px-1.5 py-0.5 text-[10px] font-mono font-bold bg-slate-100 text-slate-500 rounded-md border border-slate-200">
        Ctrl+F
      </kbd>
    </button>

    <!-- EXPANDED SEARCH BAR & RESULTS CARD -->
    <div
      v-else
      class="w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 animate-in fade-in zoom-in-95"
    >
      <!-- Search Input Header -->
      <div class="p-2 flex items-center gap-2 bg-slate-50/90 border-b border-slate-100">
        <div class="pl-1.5 text-indigo-600">
          <Search class="w-4 h-4" />
        </div>

        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="Cari nama tabel (approval, users) atau kolom..."
          @keydown="handleKeyDown"
          @focus="isDropdownOpen = true"
          class="flex-1 bg-transparent text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden font-medium py-1"
        />

        <!-- Match Count Badge -->
        <div
          v-if="searchQuery.trim()"
          class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap"
          :class="
            searchResults.length > 0
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200/60'
              : 'bg-rose-50 text-rose-600 border border-rose-200/60'
          "
        >
          {{ searchResults.length > 0 ? `${selectedIndex + 1} / ${searchResults.length}` : '0 hasil' }}
        </div>

        <!-- Navigation Arrows (Previous / Next) -->
        <div class="flex items-center gap-0.5 border-l border-slate-200 pl-1.5 text-slate-500">
          <button
            type="button"
            @click="prevMatch"
            :disabled="searchResults.length === 0"
            class="p-1 rounded hover:bg-slate-200/70 active:bg-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
            title="Sebelumnya (Shift+Enter)"
          >
            <ChevronUp class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="nextMatch"
            :disabled="searchResults.length === 0"
            class="p-1 rounded hover:bg-slate-200/70 active:bg-slate-300 disabled:opacity-30 transition-colors cursor-pointer"
            title="Berikutnya (Enter)"
          >
            <ChevronDown class="w-3.5 h-3.5" />
          </button>
        </div>

        <!-- Close Button -->
        <button
          type="button"
          @click="closeSearch"
          class="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded transition-colors cursor-pointer"
          title="Tutup (Esc)"
        >
          <X class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Results Dropdown List -->
      <div
        v-if="searchQuery.trim() && isDropdownOpen"
        class="max-h-60 overflow-y-auto custom-scrollbar p-1.5 bg-white divide-y divide-slate-50"
      >
        <template v-if="searchResults.length > 0">
          <button
            v-for="(item, idx) in searchResults"
            :key="item.id"
            type="button"
            @click="handleSelect(idx)"
            class="w-full text-left px-2.5 py-2 rounded-lg flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer"
            :class="
              idx === selectedIndex
                ? 'bg-indigo-50/90 text-indigo-950 font-semibold border border-indigo-200/70'
                : 'hover:bg-slate-50 text-slate-700'
            "
          >
            <div class="flex items-center gap-2 min-w-0">
              <div
                class="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 shadow-2xs"
                :class="
                  item.isDatabase
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                "
              >
                <Database v-if="item.isDatabase" class="w-3.5 h-3.5" />
                <Workflow v-else class="w-3.5 h-3.5" />
              </div>

              <div class="min-w-0">
                <p class="truncate leading-snug font-medium text-slate-900">
                  {{ item.name }}
                </p>
                <div v-if="item.matchedColumns && item.matchedColumns.length > 0" class="flex items-center gap-1 text-[10px] text-emerald-600 truncate mt-0.5">
                  <Columns class="w-3 h-3 flex-shrink-0" />
                  <span class="truncate font-mono">
                    Kolom: {{ item.matchedColumns.join(', ') }}
                  </span>
                </div>
              </div>
            </div>

            <span
              class="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
              :class="
                item.isDatabase
                  ? 'bg-emerald-100/60 text-emerald-700 border border-emerald-200/60'
                  : 'bg-slate-100 text-slate-500 border border-slate-200'
              "
            >
              {{ item.isDatabase ? 'Tabel ERD' : item.type }}
            </span>
          </button>
        </template>

        <div v-else class="py-4 text-center text-slate-400 text-xs">
          <p class="font-medium text-slate-600">Tidak ada node yang cocok</p>
          <p class="text-[11px] text-slate-400 mt-0.5">Coba cari dengan nama tabel atau kolom lain</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(148, 163, 184, 0.4);
  border-radius: 4px;
}
</style>
