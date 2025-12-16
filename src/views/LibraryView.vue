<template>
  <section class="library">
    <div class="hero">
      <div>
        <p class="eyebrow">My Library</p>
        <h1>E-book yang sudah kamu miliki</h1>
        <p class="subtitle">
          Semua pembelian tersinkron otomatis setelah Midtrans mengirimkan konfirmasi pembayaran. Mulai baca lagi dari
          halaman terakhir atau unduh file PDF-nya secara aman.
        </p>
        <div class="hero-stats">
          <div class="stat">
            <p>Judul dimiliki</p>
            <strong>{{ libraryItems.length }}</strong>
            <span>siap dibaca</span>
          </div>
          <div class="stat">
            <p>Total belanja</p>
            <strong>{{ formatCurrency(totalSpent) }}</strong>
            <span>akumulasi transaksi</span>
          </div>
          <div class="stat">
            <p>Menunggu pembayaran</p>
            <strong>{{ pendingCount }}</strong>
            <span>transaksi</span>
          </div>
        </div>
      </div>
      <div class="hero-card" v-if="featuredItem">
        <img :src="coverFor(featuredItem.ebook)" alt="Featured cover" />
        <div>
          <p class="muted">Sedang populer</p>
          <h3>{{ featuredItem.ebook.title }}</h3>
          <p>{{ featuredItem.ebook.author }}</p>
          <button class="primary" @click="goToReader(featuredItem.ebook.id)">Lanjut baca</button>
        </div>
      </div>
    </div>

    <div v-if="libraryItems.length" class="shelf">
      <article class="shelf-card" v-for="item in libraryItems" :key="item.ebook.id">
        <img :src="coverFor(item.ebook)" :alt="item.ebook.title" />
        <div class="info">
          <p class="author">{{ item.ebook.author }}</p>
          <h3>{{ item.ebook.title }}</h3>
          <p class="meta">Pembelian {{ formatDate(item.order.createdAt) }}</p>
          <div class="actions">
            <button class="ghost" @click="goToDetail(item.ebook.id)">Detail</button>
            <button class="secondary" @click="downloadBook(item.ebook.id)">Download</button>
            <button class="primary" @click="goToReader(item.ebook.id)">Baca online</button>
          </div>
        </div>
      </article>
    </div>
    <div v-else class="empty">
      <p>Belum ada ebook yang kamu miliki.</p>
      <button class="primary" @click="goToStore">Jelajahi katalog</button>
    </div>

    <section class="panel orders">
      <header>
        <div>
          <h2>Riwayat Transaksi</h2>
          <p class="muted">Pantau status Midtrans dan nominal setiap pembelian</p>
        </div>
        <button class="ghost" @click="refresh" :disabled="loading">{{ loading ? 'Memuat...' : 'Refresh' }}</button>
      </header>
      <div class="table-wrapper" v-if="orders.length">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Judul</th>
              <th>Status</th>
              <th>Provider</th>
              <th>Nominal</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ formatDate(order.createdAt) }}</td>
              <td>
                <strong>{{ order.ebook?.title ?? 'E-book telah dihapus' }}</strong>
                <span class="muted small">{{ order.ebook?.author }}</span>
              </td>
              <td><span class="badge" :class="order.status.toLowerCase()">{{ order.status }}</span></td>
              <td>{{ order.paymentProvider }}</td>
              <td>{{ formatCurrency(order.amount) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-else class="muted">Belum ada transaksi yang tercatat.</p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ordersApi } from '../api';
import type { Order } from '../types';
import { apiBaseUrl } from '../api/http';
import { ensureDownloadToken } from '../utils/downloadTokens';

const router = useRouter();
const orders = ref<Order[]>([]);
const loading = ref(false);
const placeholderCover = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=60';

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(value);
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fetchOrders = async () => {
  loading.value = true;
  try {
    orders.value = await ordersApi.listMine();
  } finally {
    loading.value = false;
  }
};

const refresh = () => fetchOrders();

onMounted(fetchOrders);

const libraryItems = computed(() => {
  const map = new Map<string, { ebook: NonNullable<Order['ebook']>; order: Order }>();
  for (const order of orders.value) {
    if (order.status !== 'PAID' || !order.ebook) continue;
    if (!map.has(order.ebook.id)) {
      map.set(order.ebook.id, { ebook: order.ebook, order });
    }
  }
  return Array.from(map.values());
});

const totalSpent = computed(() => orders.value.filter((o) => o.status === 'PAID').reduce((sum, order) => sum + order.amount, 0));
const pendingCount = computed(() => orders.value.filter((o) => o.status === 'PENDING').length);
const featuredItem = computed(() => libraryItems.value[0] ?? null);

const coverFor = (ebook: NonNullable<Order['ebook']>) => {
  if (!ebook.coverUrl) return placeholderCover;
  if (/^https?:\/\//i.test(ebook.coverUrl)) return ebook.coverUrl;
  try {
    return new URL(ebook.coverUrl, apiBaseUrl).toString();
  } catch {
    return placeholderCover;
  }
};

const goToReader = (ebookId: string) => router.push({ name: 'reader', params: { id: ebookId } });
const goToDetail = (ebookId: string) => router.push({ name: 'ebook-detail', params: { id: ebookId } });
const goToStore = () => router.push({ name: 'home' });

const downloadBook = async (ebookId: string) => {
  const token = await ensureDownloadToken(ebookId, { forceRefresh: true });
  window.open(`${apiBaseUrl}/download/${token}`, '_blank', 'noopener');
};
</script>

<style scoped>
.library {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.4rem;
  padding: 2rem;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(56, 189, 248, 0.1));
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.6);
  font-size: 0.75rem;
}

.hero h1 {
  margin: 0.4rem 0 1rem;
}

.subtitle {
  color: var(--muted);
  margin-bottom: 1.5rem;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
}

.stat {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.stat p {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.stat strong {
  display: block;
  font-size: 1.5rem;
  margin-top: 0.4rem;
}

.hero-card {
  background: rgba(5, 8, 22, 0.7);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.hero-card img {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.hero-card button {
  margin-top: 0.6rem;
}

.shelf {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
}

.shelf-card {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1rem;
  display: flex;
  gap: 1rem;
}

.shelf-card img {
  width: 120px;
  height: 160px;
  object-fit: cover;
  border-radius: 20px;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex: 1;
}

.author {
  margin: 0;
  color: var(--muted);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-size: 0.75rem;
}

.meta {
  color: var(--muted);
  font-size: 0.85rem;
}

.actions {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.primary,
.secondary,
.ghost {
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: linear-gradient(120deg, var(--primary), var(--accent));
  color: white;
}

.secondary {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: white;
}

.ghost {
  background: rgba(255, 255, 255, 0.08);
  color: white;
  border: none;
}

.empty {
  text-align: center;
  padding: 3rem;
  border-radius: 28px;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.03);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
}

.panel {
  background: rgba(255, 255, 255, 0.03);
  border-radius: 28px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
}

.panel header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.75rem 0.4rem;
  text-align: left;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

.small {
  display: block;
  font-size: 0.75rem;
}

.badge {
  padding: 0.3rem 0.9rem;
  border-radius: 999px;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.badge.paid {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
}

.badge.pending {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
}

.badge.failed {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
}

@media (max-width: 720px) {
  .shelf-card {
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .actions {
    justify-content: center;
  }
}
</style>
