<template>
  <section class="admin-surface space-y-8">
    <transition name="toast">
      <div v-if="toast.visible" class="toast" :class="toast.type">
        {{ toast.message }}
      </div>
    </transition>

    <header class="page-header">
      <div>
        <p class="eyebrow">SQL based dashboard</p>
        <h1>Admin analytics</h1>
        <p class="muted">
          Pantau performa pembelian, top produk, pending invoice, dan kelola katalog dengan tampilan ala
          dashboard modern.
        </p>
      </div>
      <div class="header-actions">
        <button class="ghost-btn" type="button" @click="refresh()" :disabled="refreshing">
          {{ refreshing ? 'Menyinkronkan...' : 'Sinkron data' }}
        </button>
        <router-link class="outline-btn" to="/">Ke landing</router-link>
        <router-link class="primary-btn" to="/admin/upload">Tambah e-book</router-link>
      </div>
    </header>

    <section class="card action-card">
      <div>
        <p class="eyebrow">Catalog actions</p>
        <h3>Upload terpisah</h3>
        <p class="muted">
          Untuk pengalaman yang lebih fokus, form upload kini berada di halaman khusus.
        </p>
      </div>
      <router-link class="primary-btn" to="/admin/upload">Buka halaman upload</router-link>
    </section>

    <div class="analytics-grid">
      <article class="card map-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Online sales top countries</p>
            <h3>Distribusi pembaca</h3>
          </div>
        </div>
        <div class="map-visual">
          <span
            v-for="dot in worldDots"
            :key="dot.label"
            class="map-dot"
            :style="{ top: dot.top, left: dot.left, width: dot.size, height: dot.size }"
            :title="`${dot.label} • ${dot.value}`"
          ></span>
        </div>
        <ul class="region-list">
          <li v-for="region in topRegions" :key="region.name">
            <div>
              <p class="region-name">{{ region.name }}</p>
              <p class="muted text-xs">Penjualan online</p>
            </div>
            <span class="region-value">{{ formatCurrency(region.total) }}</span>
          </li>
          <li v-if="!topRegions.length" class="muted text-sm">Belum ada data region.</li>
        </ul>
      </article>

      <article class="card line-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Sales 2024</p>
            <h3>Total pendapatan</h3>
          </div>
          <div class="highlight">
            <strong>{{ formatCurrency(totalRevenue) }}</strong>
            <span :class="{ positive: revenueDelta >= 0 }">
              {{ revenueDeltaLabel }} / hari
            </span>
          </div>
        </div>
        <div class="chart-shell h-48">
          <Line
            v-if="lineChartHasData"
            :data="lineChartData"
            :options="lineChartOptions"
          />
          <p v-else class="muted text-sm text-center py-8">Belum ada data revenue.</p>
        </div>
        <div v-if="lineChartHasData" class="chart-footer">
          <div v-for="point in revenueTrend.slice(-4)" :key="point.key">
            <p class="muted text-xs">{{ point.label }}</p>
            <p class="font-semibold text-white">{{ formatCurrency(point.total) }}</p>
          </div>
        </div>
      </article>

      <article class="card donut-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Top products</p>
            <h3>Kontribusi revenue</h3>
          </div>
        </div>
        <div class="donut-wrapper">
          <div class="donut-shell">
            <Doughnut
              v-if="donutChartHasData"
              :data="donutChartData"
              :options="donutChartOptions"
            />
            <p v-else class="muted text-sm text-center py-8">Belum ada data produk.</p>
          </div>
          <ul class="donut-legend">
            <li v-for="slice in topProductSlices" :key="slice.label">
              <span class="legend-dot" :style="{ backgroundColor: slice.color }"></span>
              <div>
                <p class="font-medium text-white">{{ slice.label }}</p>
                <p class="muted text-xs">{{ slice.percent }}% • {{ formatCurrency(slice.revenue) }}</p>
              </div>
            </li>
            <li v-if="!topProductSlices.length" class="muted text-sm">Belum ada transaksi paid.</li>
          </ul>
        </div>
      </article>

      <article class="card bar-card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Query Q3 series</p>
            <h3>Status order</h3>
          </div>
        </div>
        <div class="chart-shell h-56">
          <Bar
            v-if="barChartHasData"
            :data="barChartData"
            :options="barChartOptions"
          />
          <p v-else class="muted text-sm text-center py-8">Belum ada status order.</p>
        </div>
      </article>
    </div>

    <section class="card product-table">
      <div class="card-heading">
        <div>
          <p class="eyebrow">Products descriptions</p>
          <h3>Performa produk</h3>
        </div>
        <span class="muted text-sm">Berdasarkan order paid</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Product name</th>
              <th>Author</th>
              <th>Unit sold</th>
              <th>Sales amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="product in topProductRows" :key="product.id">
              <td>{{ product.title }}</td>
              <td>{{ product.author || '—' }}</td>
              <td>{{ product.units }}</td>
              <td>{{ formatCurrency(product.revenue) }}</td>
            </tr>
            <tr v-if="!topProductRows.length">
              <td colspan="4" class="muted text-sm">Belum ada penjualan paid.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div class="data-grid">
      <section class="card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Catalog</p>
            <h3>Daftar e-book aktif</h3>
          </div>
          <span class="muted text-sm">Total {{ ebooks.length }} judul</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Judul</th>
                <th>Harga</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="ebook in ebooks" :key="ebook.id">
                <td>
                <p class="font-medium text-white">{{ ebook.title }}</p>
                  <p class="muted text-xs">{{ ebook.author }}</p>
                </td>
                <td>{{ formatCurrency(ebook.price) }}</td>
                <td>
                  <span class="status-badge" :class="ebook.isPublished ? 'success' : 'muted'">
                    {{ ebook.isPublished ? 'Published' : 'Draft' }}
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button
                      v-if="!ebook.isPublished"
                      class="publish-btn text-xs"
                      type="button"
                      @click="publishEbook(ebook)"
                      :disabled="publishingId === ebook.id"
                    >
                      {{ publishingId === ebook.id ? 'Mem-publish...' : 'Publish' }}
                    </button>
                    <button
                      class="ghost-btn text-xs"
                      type="button"
                      @click="removeEbook(ebook.id)"
                      :disabled="deletingId === ebook.id"
                    >
                      {{ deletingId === ebook.id ? 'Menghapus...' : 'Hapus' }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!ebooks.length">
                <td colspan="4" class="muted text-sm">Belum ada katalog.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <div class="card-heading">
          <div>
            <p class="eyebrow">Transaksi terbaru</p>
            <h3>Sinkron webhook Midtrans</h3>
          </div>
          <button class="ghost-btn" type="button" @click="refresh()" :disabled="refreshing">
            {{ refreshing ? 'Menyinkronkan...' : 'Refresh' }}
          </button>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Pembeli</th>
                <th>E-book</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Tanggal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="order in recentOrders" :key="order.id">
                <td>
                  <p class="font-medium text-white">{{ order.user.name }}</p>
                  <p class="muted text-xs">{{ order.user.email }}</p>
                </td>
                <td>
                  <p class="font-medium text-white">{{ order.ebook?.title ?? 'E-book dihapus' }}</p>
                  <p class="muted text-xs">{{ order.ebook?.author }}</p>
                </td>
                <td>{{ formatCurrency(order.amount) }}</td>
                <td>
                  <span class="status-badge" :class="order.status.toLowerCase()">
                    {{ order.status }}
                  </span>
                </td>
                <td>{{ formatDate(order.createdAt) }}</td>
              </tr>
              <tr v-if="!recentOrders.length">
                <td colspan="5" class="muted text-sm">Belum ada transaksi.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ebooksApi, ordersApi } from '../api';
import type { AdminOrder, EbookSummary } from '../types';
import Swal from 'sweetalert2';
import { Line, Doughnut, Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

type ToastType = 'success' | 'error';

const ebooks = ref<EbookSummary[]>([]);
const orders = ref<AdminOrder[]>([]);
const refreshing = ref(false);
const deletingId = ref<string | null>(null);
const publishingId = ref<string | null>(null);
const toast = reactive({ visible: false, type: 'success' as ToastType, message: '' });
let toastTimer: ReturnType<typeof setTimeout> | null = null;

const confirmAction = async (options: {
  title: string;
  text?: string;
  confirmButtonText?: string;
}) => {
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

const refresh = async (silent = false) => {
  refreshing.value = true;
  try {
    const [list, orderList] = await Promise.all([
      ebooksApi.list({ limit: 50, page: 1 }),
      ordersApi.listAll(),
    ]);
    ebooks.value = list.items;
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

const paidOrders = computed(() => orders.value.filter((order) => order.status === 'PAID'));

const totalRevenue = computed(() =>
  paidOrders.value.reduce((sum, order) => sum + order.amount, 0)
);

const revenueTrend = computed(() => {
  const buckets = new Map<string, number>();
  for (const order of paidOrders.value) {
    const key = new Date(order.createdAt).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + order.amount);
  }

  const today = new Date();
  const points: { key: string; label: string; total: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const key = date.toISOString().slice(0, 10);
    points.push({
      key,
      label: date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      total: buckets.get(key) ?? 0,
    });
  }
  return points;
});

const revenueDelta = computed(() => {
  if (revenueTrend.value.length < 2) return 0;
  const last = revenueTrend.value[revenueTrend.value.length - 1];
  const prev = revenueTrend.value[revenueTrend.value.length - 2];
  if (!last || !prev) return 0;
  return last.total - prev.total;
});

const revenueDeltaLabel = computed(() => {
  const formatted = formatCurrency(Math.abs(revenueDelta.value));
  if (revenueDelta.value === 0) return formatted;
  return `${revenueDelta.value > 0 ? '+' : '-'}${formatted}`;
});

const lineChartData = computed(() => ({
  labels: revenueTrend.value.map((point) => point.label),
  datasets: [
    {
      label: 'Revenue',
      data: revenueTrend.value.map((point) => Math.round(point.total)),
      fill: true,
      backgroundColor: 'rgba(56, 189, 248, 0.25)',
      borderColor: '#38bdf8',
      borderWidth: 2,
      tension: 0.35,
      pointRadius: 0,
    },
  ],
}));

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context: any) => formatCurrency(context.parsed?.y ?? context.parsed ?? 0),
      },
    },
  },
  scales: {
    x: {
      ticks: { color: '#cbd5f5' },
      grid: { color: 'rgba(255,255,255,0.05)' },
    },
    y: {
      ticks: {
        color: '#cbd5f5',
        callback: (value: number | string) =>
          typeof value === 'number' ? `${(value / 1000).toFixed(0)}k` : value,
      },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
  },
};

const topProducts = computed(() => {
  const map = new Map<
    string,
    { id: string; title: string; author: string | null; units: number; revenue: number }
  >();

  for (const order of paidOrders.value) {
    const key = order.ebook?.id ?? order.ebookId;
    if (!key) continue;
    const entry =
      map.get(key) ??
      ({
        id: key,
        title: order.ebook?.title ?? 'Tidak diketahui',
        author: order.ebook?.author ?? null,
        units: 0,
        revenue: 0,
      } as { id: string; title: string; author: string | null; units: number; revenue: number });
    entry.units += 1;
    entry.revenue += order.amount;
    map.set(key, entry);
  }

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
});

const topProductRows = computed(() => topProducts.value.slice(0, 6));

const topProductSlices = computed(() => {
  if (!topProducts.value.length) return [];
  const palette = ['#38bdf8', '#7c3aed', '#f472b6', '#facc15', '#10b981'];
  const slices = topProducts.value.slice(0, 4).map((product, index) => ({
    label: product.title,
    revenue: product.revenue,
    color: palette[index % palette.length],
  }));
  const remaining = topProducts.value.slice(4);
  if (remaining.length) {
    slices.push({
      label: 'Lainnya',
      revenue: remaining.reduce((sum, item) => sum + item.revenue, 0),
      color: '#cbd5f5',
    });
  }
  const total = slices.reduce((sum, slice) => sum + slice.revenue, 0) || 1;
  let cursor = 0;
  return slices.map((slice) => {
    const portion = (slice.revenue / total) * 100;
    const start = cursor;
    const end = cursor + portion;
    cursor = end;
    return {
      ...slice,
      percent: Math.round((slice.revenue / total) * 100),
      start,
      end,
    };
  });
});

const donutChartData = computed(() => ({
  labels: topProductSlices.value.map((slice) => slice.label),
  datasets: [
    {
      backgroundColor: topProductSlices.value.map((slice) => slice.color),
      borderWidth: 0,
      data: topProductSlices.value.map((slice) => Math.round(slice.revenue)),
    },
  ],
}));

const donutChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: { legend: { display: false } },
};

const lineChartHasData = computed(() =>
  lineChartData.value.datasets.some((dataset) =>
    dataset.data.some((value) => Number(value) > 0)
  )
);

const donutChartHasData = computed(() =>
  donutChartData.value.datasets.some((dataset) =>
    dataset.data.some((value) => Number(value) > 0)
  )
);

const barChartHasData = computed(() =>
  barChartData.value.datasets.some((dataset) =>
    dataset.data.some((value) => Number(value) > 0)
  )
);

const statusBreakdown = computed(() => {
  const template = [
    { label: 'PAID', count: 0, color: '#10b981' },
    { label: 'PENDING', count: 0, color: '#fbbf24' },
    { label: 'FAILED', count: 0, color: '#f87171' },
  ];
  const map = Object.fromEntries(template.map((item) => [item.label, item]));

  for (const order of orders.value) {
    const bucket = map[order.status];
    if (bucket) {
      bucket.count += 1;
    }
  }

  return template;
});

const barChartData = computed(() => ({
  labels: statusBreakdown.value.map((item) => item.label),
  datasets: [
    {
      data: statusBreakdown.value.map((item) => item.count),
      backgroundColor: statusBreakdown.value.map((item) => item.color),
      borderRadius: 12,
    },
  ],
}));

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: { color: '#cbd5f5' },
      grid: { display: false },
    },
    y: {
      beginAtZero: true,
      ticks: { color: '#cbd5f5', precision: 0 },
      grid: { color: 'rgba(255,255,255,0.08)' },
    },
  },
};

const recentOrders = computed(() =>
  [...orders.value]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
);

const resolveRegionFromEmail = (email: string) => {
  const parts = email.split('.');
  const tld = parts[parts.length - 1]?.toLowerCase();
  switch (tld) {
    case 'id':
      return 'Indonesia';
    case 'sg':
      return 'Singapore';
    case 'my':
      return 'Malaysia';
    case 'us':
      return 'United States';
    case 'au':
      return 'Australia';
    case 'uk':
      return 'United Kingdom';
    default:
      return 'Global';
  }
};

const regionBreakdown = computed(() => {
  const map = new Map<string, number>();
  for (const order of paidOrders.value) {
    const region = resolveRegionFromEmail(order.user.email);
    map.set(region, (map.get(region) ?? 0) + order.amount);
  }
  return Array.from(map.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total);
});

const topRegions = computed(() => regionBreakdown.value.slice(0, 4));

const worldDots = computed(() => {
  const template = [
    { top: '24%', left: '20%' },
    { top: '34%', left: '48%' },
    { top: '52%', left: '70%' },
  ];
  const maxValue = Math.max(...topRegions.value.map((region) => region.total), 1);
  return template.map((pos, index) => {
    const entry = topRegions.value[index];
    const size = entry ? 28 + (entry.total / maxValue) * 36 : 20;
    return {
      ...pos,
      size: `${size}px`,
      label: entry?.name ?? 'Global',
      value: entry ? formatCurrency(entry.total) : formatCurrency(0),
    };
  });
});

const removeEbook = async (id: string) => {
  const target = ebooks.value.find((ebook) => ebook.id === id);
  const confirmed = await confirmAction({
    title: 'Hapus e-book?',
    text: `E-book "${target?.title ?? ''}" akan dihapus permanen.`,
    confirmButtonText: 'Ya, hapus',
  });
  if (!confirmed) return;
  deletingId.value = id;
  try {
    await ebooksApi.remove(id);
    showToast('E-book berhasil dihapus');
    await refresh(true);
  } catch (error) {
    showToast('Gagal menghapus e-book.', 'error');
  } finally {
    deletingId.value = null;
  }
};

const publishEbook = async (ebook: EbookSummary) => {
  if (ebook.isPublished) return;
  const confirmed = await confirmAction({
    title: 'Publish e-book?',
    text: `"${ebook.title}" akan tampil di katalog publik.`,
    confirmButtonText: 'Ya, publish',
  });
  if (!confirmed) return;
  publishingId.value = ebook.id;
  try {
    await ebooksApi.publish(ebook.id);
    showToast('E-book berhasil dipublish');
    await refresh(true);
  } catch (error) {
    showToast('Gagal mempublish e-book.', 'error');
  } finally {
    publishingId.value = null;
  }
};
</script>

<style scoped lang="postcss">
.admin-surface {
  @apply min-h-screen rounded-3xl p-6 text-white;
  background: radial-gradient(circle at 20% 20%, rgba(76, 29, 149, 0.35), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(56, 189, 248, 0.25), transparent 50%),
    #050816;
}

.page-header {
  @apply flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur lg:flex-row lg:items-center lg:justify-between;
}

.card {
  @apply rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur;
}

.action-card {
  @apply flex flex-col gap-4 md:flex-row md:items-center md:justify-between;
}

.card-heading {
  @apply flex flex-wrap items-center justify-between gap-3;
}

.eyebrow {
  @apply text-xs uppercase tracking-[0.3em] text-white/60;
}

.muted {
  @apply text-white/60;
}

.header-actions {
  @apply flex flex-wrap gap-3;
}

.analytics-grid {
  @apply grid gap-6 lg:grid-cols-2 xl:grid-cols-4;
}

.map-visual {
  @apply relative mt-4 h-40 w-full overflow-hidden rounded-2xl border border-white/10;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.3), rgba(124, 58, 237, 0.25));
}

.map-dot {
  @apply absolute rounded-full bg-accent/70 shadow;
  transform: translate(-50%, -50%);
}

.region-list {
  @apply mt-4 space-y-3;
}

.region-name {
  @apply font-medium text-white;
}

.region-value {
  @apply text-sm font-semibold text-white;
}

.highlight {
  @apply text-right;
}

.highlight strong {
  @apply block text-3xl font-semibold text-white;
}

.highlight span {
  @apply text-sm font-medium text-red-300;
}

.highlight span.positive {
  @apply text-emerald-300;
}

.chart-shell {
  @apply mt-4 rounded-2xl border border-white/10 bg-white/5 p-3;
}

.chart-shell canvas {
  @apply h-full w-full;
}

.chart-footer {
  @apply mt-4 grid grid-cols-2 gap-3 text-sm;
}

.chart-footer p {
  @apply text-white;
}

.donut-wrapper {
  @apply mt-4 flex flex-col gap-4 lg:flex-row;
}

.donut-shell {
  @apply relative mx-auto flex h-40 w-40 items-center justify-center;
}

.donut-shell canvas {
  @apply h-full w-full;
}

.donut-legend {
  @apply flex-1 space-y-3 text-sm;
}

.legend-dot {
  @apply inline-block h-3 w-3 rounded-full;
}

.product-table,
.data-grid section {
  @apply border border-white/10;
}

.table-wrapper {
  @apply overflow-x-auto;
}

table {
  @apply w-full border-collapse text-sm;
}

th {
  @apply border-b border-white/10 pb-3 text-left text-xs font-semibold uppercase tracking-wide text-white/50;
}

td {
  @apply border-b border-white/5 py-3 pr-4 align-top text-white/80;
}

.data-grid {
  @apply grid gap-6 lg:grid-cols-2;
}

.status-badge {
  @apply inline-flex rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/70;
}

.status-badge.success,
.status-badge.paid {
  @apply border-emerald-300/50 text-emerald-300;
}

.status-badge.pending {
  @apply border-amber-300/50 text-amber-300;
}

.status-badge.failed {
  @apply border-red-400/50 text-red-300;
}

.status-badge.muted {
  @apply border-white/20 text-white/40;
}

.action-buttons {
  @apply flex flex-wrap gap-2;
}

.publish-btn {
  @apply inline-flex items-center gap-2 rounded-2xl border border-accent/30 bg-accent/20 px-4 py-2 font-semibold text-white transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-60;
}

.primary-btn {
  @apply inline-flex items-center justify-center rounded-2xl px-5 py-2 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-60;
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
  .analytics-grid,
  .data-grid {
    @apply grid-cols-1;
  }
}
</style>
