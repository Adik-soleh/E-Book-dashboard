<template>
  <section class="cart-view">
    <header class="cart-header">
      <div>
        <p class="eyebrow">Keranjang digital</p>
        <h1>Keranjang saya</h1>
        <p class="muted" v-if="cart.itemCount">
          {{ cart.itemCount }} judul siap dibayar. Nikmati ringkasan harga dan checkout yang aman.
        </p>
        <p class="muted" v-else>Tambahkan ebook ke keranjang untuk melanjutkan pembayaran.</p>
      </div>
      <button v-if="cart.itemCount" class="ghost" @click="confirmClear" :disabled="clearing">
        {{ clearing ? 'Membersihkan…' : 'Kosongkan keranjang' }}
      </button>
    </header>

    <div v-if="cartLoading" class="loading-state">Memuat keranjang…</div>

    <div v-else-if="cart.itemCount" class="cart-layout">
      <div class="items">
        <article v-for="item in cart.items" :key="item.id" class="cart-item">
          <div class="cover">
            <img :src="coverFrom(item.ebook?.coverUrl)" :alt="item.ebook?.title ?? 'Ebook cover'" />
          </div>
          <div class="details">
            <div>
              <p class="eyebrow">{{ item.ebook?.author }}</p>
              <h3>{{ item.ebook?.title }}</h3>
            </div>
            <p class="price">{{ formatCurrency(item.ebook?.price ?? 0) }}</p>
            <div class="quantity-control">
              <button @click="updateQuantity(item, item.quantity - 1)" :disabled="item.quantity <= 1 || updatingId === item.id">
                -
              </button>
              <span>{{ item.quantity }}</span>
              <button @click="updateQuantity(item, item.quantity + 1)" :disabled="updatingId === item.id">+</button>
            </div>
            <p class="line-total">Subtotal: <strong>{{ formatCurrency(item.lineTotal) }}</strong></p>
            <div class="item-actions">
              <button class="ghost" @click="goToDetail(item.ebookId)">Detail</button>
              <button class="secondary" @click="goToCheckout(item.ebookId)">Checkout</button>
              <button class="link" @click="removeItem(item)" :disabled="removingId === item.id">
                {{ removingId === item.id ? 'Menghapus…' : 'Hapus' }}
              </button>
            </div>
          </div>
        </article>
      </div>
      <aside class="summary">
        <h2>Ringkasan pembayaran</h2>
        <div class="summary-row">
          <span>Judul</span>
          <span>{{ cart.totals.items }}</span>
        </div>
        <div class="summary-row">
          <span>Total kuantitas</span>
          <span>{{ cart.totals.quantity }}</span>
        </div>
        <div class="summary-row total">
          <span>Total harga</span>
          <span>{{ formatCurrency(cart.totals.subtotal) }}</span>
        </div>
        <p class="muted">
          Checkout dilakukan per judul. Pilih tombol checkout di kartu item untuk diarahkan ke halaman pembayaran.
        </p>
        <button class="primary" @click="checkoutFirst" :disabled="!cart.itemCount">Checkout judul pertama</button>
      </aside>
    </div>

    <div v-else class="empty-state">
      <h2>Keranjang kosong</h2>
      <p>
        Cari judul favorit di beranda dan tekan tombol <strong>Tambah ke keranjang</strong> untuk memulai proses
        pembelian.
      </p>
      <router-link class="primary" to="/">Lihat koleksi</router-link>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useCartStore } from '../stores/cart';
import type { CartLineItem } from '../types';
import { apiBaseUrl } from '../api/http';

const cart = useCartStore();
const router = useRouter();
const updatingId = ref<string | null>(null);
const removingId = ref<string | null>(null);
const clearing = ref(false);
const formatter = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' });

const cartLoading = computed(() => cart.loading && !cart.initialized);

onMounted(() => {
  if (!cart.initialized) {
    cart.fetchCart().catch(() => {});
  }
});

const formatCurrency = (value: number) => formatter.format(value);

const coverFrom = (coverUrl?: string | null) => {
  if (!coverUrl) return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=60';
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  try {
    return new URL(coverUrl, apiBaseUrl).toString();
  } catch {
    return 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=400&q=60';
  }
};

const updateQuantity = async (item: CartLineItem, quantity: number) => {
  if (quantity < 1 || updatingId.value) return;
  updatingId.value = item.id;
  try {
    await cart.update(item.id, quantity);
  } finally {
    updatingId.value = null;
  }
};

const removeItem = async (item: CartLineItem) => {
  if (removingId.value) return;
  const result = await Swal.fire({
    title: 'Hapus dari keranjang?',
    text: item.ebook?.title ?? 'Item',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
    background: '#0f172a',
    color: '#e2e8f0',
  });
  if (!result.isConfirmed) return;
  removingId.value = item.id;
  try {
    await cart.remove(item.id);
  } finally {
    removingId.value = null;
  }
};

const confirmClear = async () => {
  const result = await Swal.fire({
    title: 'Kosongkan keranjang?',
    text: 'Semua item akan dihapus.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Kosongkan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#f97316',
    background: '#0f172a',
    color: '#e2e8f0',
  });
  if (!result.isConfirmed) return;
  clearing.value = true;
  try {
    await cart.clear();
  } finally {
    clearing.value = false;
  }
};

const goToCheckout = (ebookId: string) => {
  router.push({ name: 'checkout', params: { id: ebookId } });
};

const checkoutFirst = () => {
  const first = cart.items[0];
  if (!first) return;
  goToCheckout(first.ebookId);
};

const goToDetail = (ebookId: string) => {
  router.push({ name: 'ebook-detail', params: { id: ebookId } });
};
</script>

<style scoped>
.cart-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.cart-layout {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 360px);
  gap: 1.5rem;
  align-items: start;
}

.items {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
}

.cover img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  border-radius: 18px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.price {
  margin: 0;
  font-weight: 600;
  font-size: 1.2rem;
}

.quantity-control {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.35rem 0.8rem;
  width: fit-content;
}

.quantity-control button {
  border: none;
  background: transparent;
  color: white;
  font-size: 1.1rem;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 999px;
  cursor: pointer;
}

.quantity-control span {
  min-width: 1.5rem;
  text-align: center;
}

.line-total {
  margin: 0;
  color: var(--muted);
}

.item-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.summary {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.03);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  color: var(--muted);
}

.summary-row.total span:last-child {
  font-size: 1.5rem;
  color: white;
}

.empty-state,
.loading-state {
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.02);
  padding: 2.5rem;
  text-align: center;
}

.primary,
.secondary,
.ghost,
.link {
  border-radius: 999px;
  padding: 0.5rem 1.2rem;
  border: none;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
}

.primary {
  background: linear-gradient(120deg, var(--primary), var(--accent));
  color: white;
}

.secondary {
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: white;
}

.link {
  border: none;
  background: transparent;
  color: #f87171;
  padding: 0;
}

.muted {
  color: var(--muted);
  margin: 0;
}

@media (max-width: 960px) {
  .cart-layout {
    grid-template-columns: 1fr;
  }

  .cart-item {
    grid-template-columns: 1fr;
  }

  .cover img {
    height: 260px;
  }
}
</style>
