<template>
  <article class="card">
    <figure class="cover">
      <img :src="coverUrl" :alt="ebook.title" />
      <span class="badge" :class="{ free: ebook.price === 0 }">
        {{ ebook.price ? `Rp ${ebook.price.toLocaleString()}` : 'Gratis' }}
      </span>
      <span v-if="ebook.hasPurchased" class="owned-pill">Dimiliki</span>
    </figure>
    <div class="card-body">
      <p class="eyebrow">{{ ebook.author }}</p>
      <h3>{{ ebook.title }}</h3>
      <p class="description">{{ ebook.description }}</p>
      <div class="tags" v-if="ebook.tags.length">
        <span v-for="tag in ebook.tags" :key="tag">{{ tag }}</span>
      </div>
      <div class="cta">
        <div class="status-pill" :class="{ owned: ebook.hasPurchased }">
          {{ ebook.hasPurchased ? 'Sudah dibeli' : ebook.price === 0 ? 'Gratis' : 'Tersedia' }}
        </div>
        <router-link :to="{ name: 'ebook-detail', params: { id: ebook.id } }">Detail</router-link>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { apiBaseUrl } from '../../api/http';
import type { EbookSummary } from '../../types';

const props = defineProps<{ ebook: EbookSummary }>();
const fallbackCover = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=60';
const coverUrl = computed(() => {
  if (!props.ebook.coverUrl) return fallbackCover;
  if (/^https?:\/\//i.test(props.ebook.coverUrl)) {
    return props.ebook.coverUrl;
  }
  try {
    return new URL(props.ebook.coverUrl, apiBaseUrl).toString();
  } catch {
    return fallbackCover;
  }
});
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.04);
  border-radius: 28px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  min-height: 440px;
  box-shadow: 0 25px 45px rgba(5, 8, 22, 0.45);
}

.cover {
  position: relative;
  height: 220px;
  margin: 0;
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.badge {
  position: absolute;
  top: 16px;
  right: 16px;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  background: rgba(124, 58, 237, 0.85);
  color: white;
  font-weight: 600;
  font-size: 0.85rem;
}

.badge.free {
  background: rgba(34, 197, 94, 0.9);
}

.owned-pill {
  position: absolute;
  bottom: 16px;
  left: 16px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.7);
  color: #4ade80;
  padding: 0.25rem 0.8rem;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.15em;
}

.card-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  flex: 1;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-size: 0.7rem;
  color: var(--muted);
  margin: 0;
}

h3 {
  margin: 0;
}

.description {
  color: var(--muted);
  margin: 0;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.tags span {
  border-radius: 999px;
  background: rgba(56, 189, 248, 0.1);
  color: var(--accent);
  padding: 0.15rem 0.7rem;
  font-size: 0.75rem;
}

.cta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  gap: 0.5rem;
}

.status-pill {
  border-radius: 999px;
  padding: 0.25rem 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  font-size: 0.8rem;
  color: var(--muted);
}

.status-pill.owned {
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

a {
  text-decoration: none;
  color: white;
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.35rem 1rem;
}
</style>
