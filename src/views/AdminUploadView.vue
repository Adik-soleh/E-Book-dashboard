<template>
  <section class="upload-surface space-y-8">
    <transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>

    <header class="card upload-header">
      <div>
        <p class="eyebrow">Catalog workspace</p>
        <h1>Upload & kelola e-book</h1>
        <p class="muted">
          Pisahkan proses penambahan katalog agar tetap fokus. Validasi cover, file PDF, dan tag sebelum
          dipublikasikan.
        </p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="refresh()" :disabled="refreshing">
          {{ refreshing ? 'Memuat...' : 'Refresh data' }}
        </button>
        <router-link class="outline-btn" to="/admin">Kembali ke dashboard</router-link>
      </div>
    </header>

    <div class="upload-grid">
      <form class="card" @submit.prevent="createEbook">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Upload catalog</p>
            <h3>Tambah e-book baru</h3>
          </div>
          <span class="status-pill" :class="{ success: ebookForm.isPublished }">
            {{ ebookForm.isPublished ? 'Published' : 'Draft' }}
          </span>
        </div>
        <div class="form-grid">
          <label class="form-field">
            <span>Judul</span>
            <input class="form-input" v-model="ebookForm.title" placeholder="Judul e-book" required />
          </label>
          <label class="form-field">
            <span>Penulis</span>
            <input class="form-input" v-model="ebookForm.author" placeholder="Nama penulis" required />
          </label>
        </div>
        <label class="form-field">
          <span>Deskripsi</span>
          <textarea
            class="form-input"
            rows="5"
            v-model="ebookForm.description"
            placeholder="Highlight konten menarik"
            required
          ></textarea>
        </label>
        <div class="form-grid">
          <label class="form-field">
            <span>Harga</span>
            <input
              class="form-input"
              type="number"
              min="0"
              v-model.number="ebookForm.price"
              placeholder="Rp"
            />
          </label>
          <label class="toggle">
            <input type="checkbox" v-model="ebookForm.isPublished" />
            <span>Langsung publish setelah upload</span>
          </label>
        </div>
        <label class="form-field">
          <span>Tags</span>
          <select class="form-input" multiple v-model="ebookForm.tags">
            <option v-for="tag in tags" :key="tag.id" :value="tag.name">{{ tag.name }}</option>
          </select>
        </label>
        <div class="form-grid">
          <label class="form-field">
            <span>Cover image</span>
            <input
              class="form-input file"
              type="file"
              accept="image/*"
              @change="(e) => handleFile(e, 'coverBase64')"
            />
          </label>
          <label class="form-field">
            <span>PDF file</span>
            <input
              class="form-input file"
              type="file"
              accept="application/pdf"
              @change="(e) => handleFile(e, 'fileBase64')"
            />
          </label>
        </div>
        <button class="primary-btn w-full justify-center" type="submit" :disabled="savingEbook">
          {{ savingEbook ? 'Menyimpan...' : 'Publikasikan e-book' }}
        </button>
      </form>

      <div class="space-y-6">
        <form class="card" @submit.prevent="createTag">
          <div class="card-heading">
            <div>
              <p class="eyebrow">Tags collection</p>
              <h3>Tambah kategori</h3>
            </div>
          </div>
          <label class="form-field">
            <span>Nama tag</span>
            <input class="form-input" v-model="tagName" placeholder="Contoh: Finansial" required />
          </label>
          <button class="ghost-btn w-full justify-center" type="submit" :disabled="savingTag">
            {{ savingTag ? 'Menambah...' : 'Tambah tag' }}
          </button>
          <div v-if="tags.length" class="tag-cloud">
            <span v-for="tag in tags" :key="tag.id">{{ tag.name }}</span>
          </div>
        </form>

        <section class="card">
          <div class="card-heading">
            <div>
              <p class="eyebrow">Pending invoices</p>
              <h3>Menunggu Midtrans</h3>
            </div>
            <span class="status-pill warning">{{ pendingInvoices.length }}</span>
          </div>
          <p class="muted text-sm">Automatis dari webhook.</p>
          <div v-if="pendingVisibleInvoices.length" class="pending-list">
            <article v-for="invoice in pendingVisibleInvoices" :key="invoice.id" class="pending-row">
              <div>
                <p class="font-medium text-white">{{ invoice.user.name }}</p>
                <p class="muted text-xs">{{ invoice.ebook?.title ?? 'E-book dihapus' }}</p>
              </div>
              <div class="text-right">
                <p class="font-semibold text-white">{{ formatCurrency(invoice.amount) }}</p>
                <p class="muted text-xs">{{ formatDate(invoice.createdAt) }}</p>
              </div>
            </article>
          </div>
          <p v-else class="muted text-sm pt-4">Tidak ada invoice pending.</p>
        </section>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ebooksApi, ordersApi, tagsApi } from '../api';
import type { AdminOrder, Tag } from '../types';
import Swal from 'sweetalert2';

type ToastType = 'success' | 'error';

const tags = ref<Tag[]>([]);
const orders = ref<AdminOrder[]>([]);
const tagName = ref('');
const refreshing = ref(false);
const savingEbook = ref(false);
const savingTag = ref(false);
const toast = reactive({ visible: false, type: 'success' as ToastType, message: '' });
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const ebookForm = reactive({
  title: '',
  author: '',
  description: '',
  price: 0,
  isPublished: true,
  tags: [] as string[],
  coverBase64: '',
  fileBase64: '',
});

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);

const formatDate = (date: string | number | Date) =>
  new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });

const showToast = (message: string, type: ToastType = 'success') => {
  toast.message = message;
  toast.type = type;
  toast.visible = true;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.visible = false;
  }, 4000);
};

const confirmAction = async (options: { title: string; text?: string; confirmButtonText?: string }) => {
  const result = await Swal.fire({
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#38bdf8',
    cancelButtonColor: '#1f2937',
    reverseButtons: true,
    cancelButtonText: 'Batal',
    confirmButtonText: 'Ya, lanjut',
    ...options,
  });
  return result.isConfirmed;
};

const refresh = async (silent = false) => {
  refreshing.value = true;
  try {
    const [tagList, orderList] = await Promise.all([tagsApi.list(), ordersApi.listAll()]);
    tags.value = tagList;
    orders.value = orderList;
    if (!silent) {
      showToast('Data berhasil diperbarui');
    }
  } catch (error) {
    showToast('Gagal memuat data, coba lagi.', 'error');
  } finally {
    refreshing.value = false;
  }
};

onMounted(() => {
  refresh(true);
});

const pendingInvoices = computed(() =>
  orders.value
    .filter((order) => order.status === 'PENDING')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
);

const pendingVisibleInvoices = computed(() => pendingInvoices.value.slice(0, 5));

const handleFile = (event: Event, key: 'coverBase64' | 'fileBase64') => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    ebookForm[key] = reader.result as string;
  };
  reader.readAsDataURL(file);
};

const resetEbookForm = () => {
  Object.assign(ebookForm, {
    title: '',
    author: '',
    description: '',
    price: 0,
    isPublished: true,
    tags: [],
    coverBase64: '',
    fileBase64: '',
  });
};

const createEbook = async () => {
  const confirmed = await confirmAction({
    title: 'Publikasikan e-book?',
    text: 'Pastikan seluruh detail sudah benar.',
    confirmButtonText: 'Ya, simpan',
  });
  if (!confirmed) return;
  savingEbook.value = true;
  try {
    await ebooksApi.create(ebookForm);
    showToast('E-book berhasil disimpan');
    resetEbookForm();
    await refresh(true);
  } catch (error) {
    showToast('Gagal menyimpan e-book, coba lagi.', 'error');
  } finally {
    savingEbook.value = false;
  }
};

const createTag = async () => {
  if (!tagName.value.trim()) return;
  const confirmed = await confirmAction({
    title: 'Tambah tag baru?',
    text: `Tag "${tagName.value}" akan tersimpan.`,
    confirmButtonText: 'Ya, tambahkan',
  });
  if (!confirmed) return;
  savingTag.value = true;
  try {
    await tagsApi.create({ name: tagName.value.trim() });
    tagName.value = '';
    await refresh(true);
    showToast('Tag baru ditambahkan');
  } catch (error) {
    showToast('Gagal menambah tag.', 'error');
  } finally {
    savingTag.value = false;
  }
};
</script>

<style scoped lang="postcss">
.upload-surface {
  @apply min-h-screen rounded-3xl p-6 text-white;
  background: radial-gradient(circle at 15% 10%, rgba(124, 58, 237, 0.35), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(56, 189, 248, 0.2), transparent 55%),
    #050816;
}

.card {
  @apply rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur;
}

.upload-header {
  @apply flex flex-col gap-4 md:flex-row md:items-center md:justify-between;
}

.header-actions {
  @apply flex flex-wrap gap-3;
}

.eyebrow {
  @apply text-xs uppercase tracking-[0.3em] text-white/60;
}

.muted {
  @apply text-white/60;
}

.upload-grid {
  @apply grid gap-6 lg:grid-cols-[2fr,1fr];
}

.card-heading {
  @apply flex flex-wrap items-center justify-between gap-3;
}

.form-grid {
  @apply grid gap-4 md:grid-cols-2;
}

.form-field {
  @apply flex flex-col gap-2 text-sm font-medium text-white/70;
}

.form-input {
  @apply rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30;
}

.form-input.file {
  @apply cursor-pointer;
}

.toggle {
  @apply mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80;
}

.toggle input {
  @apply h-5 w-5 rounded border-white/30 text-accent focus:ring-accent;
}

.tag-cloud {
  @apply mt-4 flex flex-wrap gap-2 text-xs;
}

.tag-cloud span {
  @apply rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/70;
}

.status-pill {
  @apply rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70;
}

.status-pill.success {
  @apply border-emerald-300/50 text-emerald-300;
}

.status-pill.warning {
  @apply border-amber-300/50 text-amber-300;
}

.pending-list {
  @apply mt-4 space-y-4;
}

.pending-row {
  @apply flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4;
}

.primary-btn {
  @apply inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60;
  background: linear-gradient(120deg, var(--primary), var(--accent));
}

.ghost-btn {
  @apply inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-60;
}

.outline-btn {
  @apply inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/40;
}

.toast {
  @apply fixed right-6 top-6 z-50 min-w-[240px] rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-2xl shadow-black/40;
}

.toast.success {
  @apply bg-emerald-500/90;
}

.toast.error {
  @apply bg-red-500/90;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .upload-grid {
    @apply grid-cols-1;
  }
}
</style>
