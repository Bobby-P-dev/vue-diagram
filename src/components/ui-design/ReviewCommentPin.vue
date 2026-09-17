<script setup>
import { ref } from 'vue'
import { MessageSquare, Check, X, Send, CornerDownRight } from 'lucide-vue-next'

const props = defineProps({
  comments: {
    type: Array,
    default: () => [],
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['addComment', 'resolveComment', 'sendToAi'])

const isAdding = ref(false)
const newCommentText = ref('')
const activeCommentId = ref(null)

function handleAddComment() {
  if (!newCommentText.value.trim()) return
  emit('addComment', {
    id: `comment-${Date.now()}`,
    author: 'Designer',
    content: newCommentText.value.trim(),
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'Open',
  })
  newCommentText.value = ''
  isAdding.value = false
}

function handleResolve(id) {
  emit('resolveComment', id)
}

function handleSendToAi(comment) {
  emit('sendToAi', { content: comment.content, target: comment.target || null })
}
</script>

<template>
  <div class="relative inline-block text-left select-none">
    <!-- Action Button to Add / View Comments -->
    <button
      type="button"
      @click.stop="isAdding = !isAdding"
      class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold border transition-all cursor-pointer shadow-xs"
      :class="
        isAdding || comments.some(c => c.status === 'Open')
          ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
          : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:text-white'
      "
      title="Beri Masukan Desain / Review Pins"
    >
      <MessageSquare class="w-3 h-3" />
      <span v-if="!compact">Review</span>
      <span
        v-if="comments.filter(c => c.status === 'Open').length > 0"
        class="px-1 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[9px]"
      >
        {{ comments.filter(c => c.status === 'Open').length }}
      </span>
    </button>

    <!-- Comments Panel Overlay -->
    <div
      v-if="isAdding"
      class="absolute top-8 right-0 w-84 p-3.5 rounded-xl border border-slate-700/90 bg-slate-900/95 shadow-2xl backdrop-blur-xl z-50 text-slate-200"
      @click.stop
    >
      <div class="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
        <div class="flex items-center gap-1.5 text-xs font-bold text-white">
          <MessageSquare class="w-4 h-4 text-amber-400" />
          <span>Feedback & Review Desain</span>
        </div>
        <button
          type="button"
          @click.stop="isAdding = false"
          class="p-0.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Quick Add Comment Input -->
      <div class="mb-3">
        <textarea
          v-model="newCommentText"
          placeholder="Tulis feedback (misal: 'Rapatkan margin antar kartu', 'Ganti tombol CTA')..."
          rows="2"
          class="w-full p-2.5 rounded-lg border border-slate-700/80 bg-slate-950/80 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
          @keydown.enter.prevent="handleAddComment"
        ></textarea>
        <div class="flex items-center justify-between mt-1.5">
          <span class="text-[10px] text-slate-500">Tekan Enter untuk simpan</span>
          <button
            type="button"
            @click="handleAddComment"
            class="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
          >
            <span>Tambah Pin</span>
            <Send class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Comments List -->
      <div class="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
        <div
          v-if="comments.length === 0"
          class="text-center py-4 text-[11px] text-slate-500"
        >
          Belum ada catatan feedback. Ketik di atas untuk menambahkan!
        </div>

        <div
          v-for="c in comments"
          :key="c.id"
          class="p-2.5 rounded-lg border transition-all text-left"
          :class="
            c.status === 'Resolved'
              ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
              : 'bg-slate-950/80 border-slate-800/90'
          "
        >
          <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
            <span class="font-bold text-slate-300">{{ c.author }}</span>
            <span class="font-mono">{{ c.timestamp }}</span>
          </div>

          <div v-if="c.target?.id" class="mb-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[9px]">
            <span>🎯 {{ c.target.id }}</span>
            <span class="text-slate-400 font-sans">({{ c.target.type }})</span>
          </div>

          <p class="text-xs text-slate-200 leading-relaxed mb-2" :class="c.status === 'Resolved' ? 'line-through' : ''">
            {{ c.content }}
          </p>

          <div class="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
            <button
              type="button"
              @click="handleSendToAi(c)"
              class="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
              title="Kirim catatan ini ke AI Prompt untuk diperbaiki secara targeted"
            >
              <CornerDownRight class="w-3 h-3" />
              <span>Apply with AI</span>
            </button>

            <button
              type="button"
              @click="handleResolve(c.id)"
              class="flex items-center gap-1 font-medium transition-colors"
              :class="c.status === 'Resolved' ? 'text-slate-500 hover:text-slate-300' : 'text-emerald-400 hover:text-emerald-300'"
            >
              <Check class="w-3 h-3" />
              <span>{{ c.status === 'Resolved' ? 'Reopen' : 'Resolve' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
