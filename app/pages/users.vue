<template>
  <div>
    <!-- Page Header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-base-content">Pengguna</h1>
        <p class="text-sm text-base-content/50 mt-1">Kelola akun pengguna</p>
      </div>
      <div class="mt-3 sm:mt-0">
        <button class="btn btn-primary btn-sm" @click="openCreateModal">
          <IconUserPlus class="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="card bg-base-100 border border-base-300">
      <div class="card-body p-0">
        <div v-if="!users?.length" class="p-10 text-center">
          <IconUsers class="w-12 h-12 text-base-content/15 mx-auto mb-3" />
          <p class="text-sm text-base-content/50">Belum ada pengguna</p>
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Dibuat</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in users" :key="u.id">
                <td class="font-medium">{{ u.name }}</td>
                <td class="text-sm text-base-content/60">{{ u.email }}</td>
                <td>
                  <span class="badge badge-sm badge-soft" :class="u.role?.name === 'ADMIN' ? 'badge-primary' : 'badge-info'">
                    {{ u.role?.name }}
                  </span>
                </td>
                <td>
                  <span class="badge badge-sm" :class="u.isActive ? 'badge-soft badge-success' : 'badge-soft badge-error'">
                    {{ u.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                </td>
                <td class="text-sm text-base-content/60">{{ formatDate(u.createdAt) }}</td>
                <td>
                  <div class="flex gap-1">
                    <button class="btn btn-ghost btn-xs" @click="editUser(u)">
                      <IconEdit class="w-4 h-4" />
                    </button>
                    <button v-if="u.id !== currentUserId" class="btn btn-ghost btn-xs text-error" @click="deleteUser(u)">
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <dialog class="modal" :class="{ 'modal-open': showModal }">
      <div class="modal-box max-w-md">
        <button class="btn btn-sm btn-circle btn-ghost absolute right-3 top-3" @click="showModal = false">
          <IconX class="w-4 h-4" />
        </button>
        <h3 class="font-bold text-lg mb-4">{{ editingId ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h3>

        <form @submit.prevent="saveUser" class="space-y-3">
          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Nama</legend>
            <input v-model="form.name" type="text" class="input w-full" required placeholder="Nama lengkap" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Email</legend>
            <input v-model="form.email" type="email" class="input w-full" required placeholder="user@restoman.id" />
          </fieldset>

          <fieldset class="fieldset">
            <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">
              {{ editingId ? 'Password (kosongkan jika tidak diubah)' : 'Password' }}
            </legend>
            <input v-model="form.password" type="password" class="input w-full" :required="!editingId" placeholder="••••••••" />
          </fieldset>

          <div class="grid grid-cols-2 gap-3">
            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">Role</legend>
              <select v-model="form.roleId" class="select w-full" required>
                <option value="">Pilih Role</option>
                <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
              </select>
            </fieldset>

            <fieldset class="fieldset">
              <legend class="fieldset-legend text-xs font-semibold uppercase tracking-wide">PIN (opsional)</legend>
              <input v-model="form.pin" type="text" class="input w-full" maxlength="6" placeholder="123456" />
            </fieldset>
          </div>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.isActive" class="toggle toggle-sm toggle-primary" />
            <span class="text-sm">Aktif</span>
          </label>

          <div class="flex justify-end gap-2 pt-2">
            <button type="button" class="btn btn-ghost btn-sm" @click="showModal = false">Batal</button>
            <button type="submit" class="btn btn-primary btn-sm" :disabled="saving">
              <span v-if="saving" class="loading loading-spinner loading-xs"></span>
              {{ editingId ? 'Simpan' : 'Tambah' }}
            </button>
          </div>
        </form>
      </div>
      <form method="dialog" class="modal-backdrop" @click="showModal = false"><button>close</button></form>
    </dialog>
  </div>
</template>

<script setup lang="ts">
import { IconUserPlus, IconUsers, IconEdit, IconTrash, IconX } from '@tabler/icons-vue'

const auth = useAuth()
const currentUserId = computed(() => auth.user.value?.id)

const { data: users, refresh } = useFetch<any[]>('/api/users')
const { data: roles } = useFetch<any[]>('/api/roles')

const showModal = ref(false)
const editingId = ref('')
const saving = ref(false)

const form = ref({
  name: '',
  email: '',
  password: '',
  roleId: '',
  pin: '',
  isActive: true,
})

function openCreateModal() {
  editingId.value = ''
  form.value = { name: '', email: '', password: '', roleId: '', pin: '', isActive: true }
  showModal.value = true
}

function editUser(u: any) {
  editingId.value = u.id
  form.value = {
    name: u.name,
    email: u.email,
    password: '',
    roleId: u.role?.id || '',
    pin: u.pin || '',
    isActive: u.isActive,
  }
  showModal.value = true
}

async function saveUser() {
  saving.value = true
  try {
    const body: any = { ...form.value }
    if (editingId.value && !body.password) delete body.password

    if (editingId.value) {
      await $fetch(`/api/users/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/users', { method: 'POST', body })
    }
    showModal.value = false
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menyimpan')
  } finally {
    saving.value = false
  }
}

async function deleteUser(u: any) {
  if (!confirm(`Nonaktifkan user "${u.name}"?`)) return
  try {
    await $fetch(`/api/users/${u.id}`, { method: 'DELETE' })
    refresh()
  } catch (err: any) {
    alert(err?.data?.statusMessage || 'Gagal menonaktifkan')
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}
</script>
