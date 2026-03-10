<template>
  <div class="space-y-3">
    <!-- Preview -->
    <div class="flex items-center gap-3">
      <div class="w-12 h-12 rounded-lg border border-base-300 bg-base-200 flex items-center justify-center overflow-hidden shrink-0">
        <img v-if="modelValue" :src="modelValue" class="w-full h-full object-contain p-1.5" alt="icon preview" />
        <IconPhoto v-else class="w-6 h-6 text-base-content/25" />
      </div>
      <div>
        <p class="text-sm font-medium text-base-content">{{ modelValue ? 'Icon terpilih' : 'Belum ada icon' }}</p>
        <button v-if="modelValue" type="button" class="text-xs text-error link link-hover" @click="clear">
          Hapus icon
        </button>
      </div>
    </div>

    <!-- Tab switcher -->
    <div class="flex gap-1">
      <button
        type="button"
        class="btn btn-xs"
        :class="tab === 'upload' ? 'btn-primary' : 'btn-ghost'"
        @click="tab = 'upload'"
      >
        <IconUpload class="w-3 h-3" /> Upload File
      </button>
      <button
        type="button"
        class="btn btn-xs"
        :class="tab === 'url' ? 'btn-primary' : 'btn-ghost'"
        @click="tab = 'url'"
      >
        <IconLink class="w-3 h-3" /> Gunakan URL
      </button>
    </div>

    <!-- Upload tab -->
    <div v-if="tab === 'upload'">
      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        @change="handleUpload"
      />
      <button
        type="button"
        class="btn btn-outline btn-sm w-full"
        :disabled="uploading"
        @click="(fileInput as HTMLInputElement)?.click()"
      >
        <span v-if="uploading" class="loading loading-spinner loading-xs"></span>
        <IconUpload v-else class="w-4 h-4" />
        {{ uploading ? 'Mengupload...' : 'Pilih file (PNG, JPG, SVG, WebP · max 500KB)' }}
      </button>
      <p v-if="uploadError" class="text-xs text-error mt-1.5">{{ uploadError }}</p>
    </div>

    <!-- URL tab -->
    <div v-if="tab === 'url'" class="flex gap-2">
      <input
        v-model="urlInput"
        type="url"
        class="input input-sm flex-1"
        placeholder="https://logo.clearbit.com/bca.co.id"
        @keydown.enter.prevent="applyUrl"
      />
      <button type="button" class="btn btn-primary btn-sm" @click="applyUrl">Pakai</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { IconPhoto, IconUpload, IconLink } from '@tabler/icons-vue'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const tab = ref<'upload' | 'url'>('upload')
const uploading = ref(false)
const uploadError = ref('')
const urlInput = ref('')
const fileInput = ref<HTMLInputElement>()

async function handleUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  uploadError.value = ''
  uploading.value = true
  try {
    const form = new FormData()
    form.append('file', file)
    const res = await $fetch<{ url: string }>('/api/upload/icon', { method: 'POST', body: form })
    emit('update:modelValue', res.url)
  } catch (err: any) {
    uploadError.value = err.data?.statusMessage || 'Upload gagal, coba lagi'
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function applyUrl() {
  const url = urlInput.value.trim()
  if (url) {
    emit('update:modelValue', url)
    urlInput.value = ''
  }
}

function clear() {
  emit('update:modelValue', '')
}
</script>
