<template>
  <section v-if="ebook" class="detail">
    <div class="cover">
      <img :src="cover" alt="Cover" />
      <div class="meta-chip">
        <p>{{ ebook.canDownload ? 'Ready to read' : 'Locked' }}</p>
        <span>{{ ebook.hasPurchased ? 'Owned' : 'Preview' }}</span>
      </div>
    </div>
    <div class="info">
      <p class="eyebrow">E-book • {{ ebook.tags.join(', ') || 'Untagged' }}</p>
      <h1>{{ ebook.title }}</h1>
      <p class="author">By {{ ebook.author }}</p>
      <p class="description">{{ ebook.description }}</p>
      <div class="pill-group">
        <span>Reader sync</span>
        <span>Secure token download</span>
        <span>Dark friendly UI</span>
      </div>
      <div class="actions">
        <div>
          <p class="label">Price</p>
          <p class="price">{{ ebook.price ? `Rp ${ebook.price.toLocaleString()}` : 'Gratis' }}</p>
        </div>
        <div class="buttons">
          <button v-if="!ebook.hasPurchased" class="primary" @click="goToCheckout">Purchase</button>
          <button v-if="ebook.canDownload" class="secondary" @click="downloadFile">Download</button>
          <button v-if="ebook.canDownload" class="ghost" @click="openReader">Read online</button>
        </div>
      </div>
    </div>
  </section>
  <div v-else class="loading">Loading book…</div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ebooksApi } from '../api';
import type { EbookDetail } from '../types';
import { apiBaseUrl } from '../api/http';
import { useAuthStore } from '../stores/auth';
import { ensureDownloadToken } from '../utils/downloadTokens';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const ebook = ref<EbookDetail | null>(null);

onMounted(async () => {
  ebook.value = await ebooksApi.detail(route.params.id as string);
});

const placeholderCover = 'https://placehold.co/400x600?text=Cover';
const cover = computed(() => {
  if (!ebook.value?.coverUrl) return placeholderCover;
  if (/^https?:\/\//i.test(ebook.value.coverUrl)) {
    return ebook.value.coverUrl;
  }
  try {
    return new URL(ebook.value.coverUrl, apiBaseUrl).toString();
  } catch {
    return placeholderCover;
  }
});

const goToCheckout = () => {
  router.push({ name: 'checkout', params: { id: route.params.id } });
};

const downloadFile = async () => {
  if (!auth.user) return alert('Login required');
  const token = await ensureDownloadToken(route.params.id as string, { forceRefresh: true });
  window.open(`${apiBaseUrl}/download/${token}`, '_blank');
};

const openReader = () => {
  router.push({ name: 'reader', params: { id: route.params.id } });
};
</script>

<style scoped>
.detail {
  display: grid;
  grid-template-columns: minmax(280px, 360px) 1fr;
  gap: 2rem;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2.5rem;
}

.cover {
  position: relative;
}

img {
  width: 100%;
  border-radius: 24px;
  object-fit: cover;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
}

.meta-chip {
  position: absolute;
  bottom: 20px;
  left: 20px;
  background: rgba(5, 8, 22, 0.7);
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  display: flex;
  gap: 0.7rem;
  align-items: center;
  font-size: 0.85rem;
}

.meta-chip span {
  color: var(--accent);
}

.info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  color: var(--muted);
  text-transform: uppercase;
}

.author {
  margin: 0;
  color: var(--muted);
}

.description {
  margin: 0;
  color: var(--text);
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.pill-group span {
  border-radius: 999px;
  padding: 0.3rem 0.9rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  font-size: 0.85rem;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.label {
  color: var(--muted);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
}

.price {
  margin: 0.2rem 0 0;
  font-size: 2rem;
  font-weight: 600;
}

.buttons {
  display: flex;
  gap: 0.6rem;
}

.primary,
.secondary,
.ghost {
  border-radius: 999px;
  padding: 0.45rem 1.3rem;
  cursor: pointer;
  border: none;
  font-weight: 600;
  color: white;
}

.primary {
  background: linear-gradient(120deg, var(--primary), var(--accent));
}

.secondary {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.loading {
  text-align: center;
  padding: 2rem;
  color: var(--muted);
}

@media (max-width: 900px) {
  .detail {
    grid-template-columns: 1fr;
  }
}
</style>
