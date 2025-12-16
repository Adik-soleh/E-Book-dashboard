<template>
  <section class="checkout">
    <div class="panel form">
      <p class="eyebrow">Secure checkout</p>
      <h1>Complete your purchase</h1>
      <p class="subtitle">
        Choose your payment provider and we’ll create a unique invoice. Once Midtrans confirms your payment, the ebook
        instantly appears in your library ready to download or read online.
      </p>
      <label>
        Payment provider
        <div class="select">
          <select v-model="provider">
            <option value="midtrans">Midtrans</option>
            <option value="xendit">Xendit</option>
          </select>
        </div>
      </label>
      <button class="primary" @click="createOrder">Generate invoice</button>
      <p class="hint">Invoices open in a new tab so you can finish the payment without leaving this page.</p>
    </div>
    <div class="panel status">
      <template v-if="orderSummary">
        <div class="status-headline">
          <div>
            <p class="eyebrow">Payment tracker</p>
            <h2>{{ statusHeadline }}</h2>
            <p class="muted">
              Order ID <span>{{ orderSummary.orderId }}</span>
            </p>
          </div>
          <span class="pill" :class="status">{{ status?.toLowerCase() }}</span>
        </div>
        <div class="timeline">
          <div class="step" :class="{ active: currentStep >= 1 }">
            <span>1</span>
            <p>Invoice created</p>
          </div>
          <div class="divider" :class="{ active: currentStep >= 2 }" />
          <div class="step" :class="{ active: currentStep >= 2 }">
            <span>2</span>
            <p>Waiting for payment</p>
          </div>
          <div class="divider" :class="{ active: currentStep === 3 }" />
          <div class="step" :class="{ active: currentStep === 3 }">
            <span>3</span>
            <p>Ready to read</p>
          </div>
        </div>
        <div class="notice" v-if="orderSummary.invoiceUrl && waiting">
          <p class="muted">
            Didn’t see the Midtrans window?
            <a :href="orderSummary.invoiceUrl" target="_blank" rel="noopener">Open it again</a>.
          </p>
          <button class="ghost" @click="manualRefresh" :disabled="refreshing">
            {{ refreshing ? 'Refreshing…' : 'Saya sudah bayar – cek status' }}
          </button>
        </div>
        <p class="muted" v-if="isPaid">You can now jump back to the ebook detail, open the reader, or find it inside your library.</p>
        <div class="cta-group">
          <button class="ghost" @click="goToDetail">View ebook</button>
          <button class="secondary" @click="goToLibrary" :disabled="!isPaid">Go to my library</button>
          <button class="primary" @click="goToReader" :disabled="!isPaid">Start reading</button>
        </div>
      </template>
      <template v-else>
        <div class="placeholder">
          <h2>Track your payment</h2>
          <p>
            After generating an invoice you’ll see real-time updates here. Once Midtrans marks the transaction as
            <strong>settled</strong>, the book unlocks automatically.
          </p>
          <ul>
            <li>Generate invoice → pay via Midtrans</li>
            <li>We listen to the webhook and update your order</li>
            <li>The ebook appears in <em>My Library</em> instantly</li>
          </ul>
        </div>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ordersApi } from '../api';
import type { Order, OrderSummary } from '../types';
import { useEbookStore } from '../stores/ebooks';

const route = useRoute();
const router = useRouter();
const ebookStore = useEbookStore();
const provider = ref('midtrans');
const orderSummary = ref<OrderSummary | null>(null);
const liveOrder = ref<Order | null>(null);
const polling = ref<ReturnType<typeof setInterval> | null>(null);
const refreshing = ref(false);
const loadingExistingOrder = ref(false);
const snapBaseUrl = (import.meta.env.VITE_MIDTRANS_SNAP_URL as string | undefined) ?? 'https://app.sandbox.midtrans.com';

const status = computed(() => liveOrder.value?.status ?? orderSummary.value?.status ?? null);
const isPaid = computed(() => status.value === 'PAID');
const waiting = computed(() => status.value === 'PENDING');
const currentStep = computed(() => {
  if (!orderSummary.value) return 0;
  if (isPaid.value) return 3;
  if (status.value === 'FAILED') return 2;
  return status.value ? 2 : 1;
});
const statusHeadline = computed(() => {
  if (isPaid.value) return 'Payment confirmed';
  if (status.value === 'FAILED') return 'Payment failed';
  return 'Waiting for confirmation';
});

const createOrder = async () => {
  stopPolling();
  orderSummary.value = await ordersApi.create({ ebookId: route.params.id as string, paymentProvider: provider.value });
  liveOrder.value = null;
  persistOrderId(orderSummary.value.orderId);

  if (orderSummary.value.invoiceUrl) {
    window.open(orderSummary.value.invoiceUrl, '_blank', 'noopener');
  }

  if (orderSummary.value.status === 'PAID') {
    handlePaid();
    return;
  }

  startPolling();
};

const startPolling = () => {
  stopPolling();
  if (!orderSummary.value) return;
  polling.value = setInterval(async () => {
    if (!orderSummary.value) return;
    try {
      const latest = await ordersApi.detail(orderSummary.value.orderId);
      liveOrder.value = latest;
      if (latest.status === 'PAID') {
        handlePaid();
      }
    } catch (error) {
      console.error('Failed to refresh order', error);
    }
  }, 4000);
};

const stopPolling = () => {
  if (polling.value) {
    clearInterval(polling.value);
    polling.value = null;
  }
};

const handlePaid = () => {
  stopPolling();
  ebookStore.fetchEbooks();
};

const goToDetail = () => {
  router.push({ name: 'ebook-detail', params: { id: route.params.id } });
};

const goToLibrary = () => {
  router.push({ name: 'library' });
};

const goToReader = () => {
  router.push({ name: 'reader', params: { id: route.params.id } });
};

const manualRefresh = async () => {
  if (!orderSummary.value) return;
  refreshing.value = true;
  try {
    const updated = await ordersApi.refresh(orderSummary.value.orderId);
    liveOrder.value = updated;
    if (updated.status === 'PAID') {
      handlePaid();
    }
  } finally {
    refreshing.value = false;
  }
};

const persistOrderId = (orderId?: string | null) => {
  const nextQuery = { ...route.query };
  if (orderId) {
    nextQuery.orderId = orderId;
  } else {
    delete nextQuery.orderId;
  }
  router.replace({ query: nextQuery }).catch(() => {});
};

const buildMidtransInvoiceUrl = (token: string) => {
  const normalized = snapBaseUrl.endsWith('/') ? snapBaseUrl.slice(0, -1) : snapBaseUrl;
  return `${normalized}/snap/v2/vtweb/${token}`;
};

const hydrateOrderFromQuery = async (orderId: string) => {
  loadingExistingOrder.value = true;
  stopPolling();
  try {
    const existing = await ordersApi.detail(orderId);
    orderSummary.value = {
      orderId: existing.id,
      status: existing.status,
      invoiceUrl:
        existing.paymentProvider === 'midtrans' && existing.paymentReference
          ? buildMidtransInvoiceUrl(existing.paymentReference)
          : null,
    };
    liveOrder.value = existing;
    persistOrderId(orderId);
    if (existing.status === 'PAID') {
      handlePaid();
    } else {
      startPolling();
    }
  } catch (error) {
    console.error('Failed to hydrate order from query', error);
    persistOrderId(null);
  } finally {
    loadingExistingOrder.value = false;
  }
};

watch(
  () => route.query.orderId,
  (value) => {
    const orderId = Array.isArray(value) ? value[0] : value;
    if (!orderId || typeof orderId !== 'string') {
      return;
    }
    if (orderSummary.value?.orderId === orderId || loadingExistingOrder.value) {
      return;
    }
    hydrateOrderFromQuery(orderId);
  },
  { immediate: true },
);

onBeforeUnmount(stopPolling);
</script>

<style scoped>
.checkout {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  align-items: start;
}

.panel {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 28px;
  padding: 2rem;
  backdrop-filter: blur(12px);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form h1 {
  margin: 0.5rem 0;
}

.eyebrow {
  margin: 0;
  color: var(--muted);
  letter-spacing: 0.25em;
  text-transform: uppercase;
  font-size: 0.7rem;
}

.subtitle {
  color: var(--muted);
  margin: 0;
}

label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: var(--muted);
  font-weight: 500;
}

.select {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  padding: 0.4rem 0.8rem;
  background: rgba(15, 23, 42, 0.5);
}

select {
  width: 100%;
  border: none;
  background: transparent;
  color: white;
  font-family: inherit;
  font-size: 1rem;
}

select:focus {
  outline: none;
}

.primary,
.secondary,
.ghost {
  border-radius: 999px;
  padding: 0.75rem 1.4rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.primary {
  background: linear-gradient(120deg, var(--primary), var(--accent));
  color: white;
}

.secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: white;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
}

.hint {
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
}

.status-headline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.status-headline h2 {
  margin: 0.4rem 0 0;
}

.muted {
  color: var(--muted);
  margin: 0;
}

.muted span {
  color: white;
  font-weight: 600;
}

.pill {
  text-transform: uppercase;
  letter-spacing: 0.1em;
  font-size: 0.65rem;
  padding: 0.4rem 1rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.pill.paid {
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.pill.pending {
  border-color: rgba(250, 204, 21, 0.4);
  color: #facc15;
}

.pill.failed {
  border-color: rgba(248, 113, 113, 0.4);
  color: #f87171;
}

.timeline {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin: 1rem 0;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  color: var(--muted);
  font-size: 0.85rem;
}

.step span {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
}

.step.active {
  color: white;
}

.step.active span {
  border-color: transparent;
  background: linear-gradient(120deg, var(--primary), var(--accent));
  box-shadow: 0 12px 30px rgba(124, 58, 237, 0.3);
}

.divider {
  height: 2px;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 999px;
}

.divider.active {
  background: linear-gradient(120deg, var(--primary), var(--accent));
}

.cta-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.cta-group button {
  flex: 1;
  min-width: 120px;
}

.notice {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.placeholder {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: var(--muted);
}

.placeholder ul {
  padding-left: 1.2rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.placeholder strong {
  color: white;
}
</style>
