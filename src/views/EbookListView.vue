<template>
  <section class="list-view">
    <div class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Digital Library</p>
        <h1>Baca e-book premium dengan pengalaman yang menarik</h1>
        <p class="subtitle">
          Kurasi harian menampilkan judul bisnis, teknologi, hingga fiksi populer. Semua terhubung dengan reader online,
          token download aman, dan Midtrans untuk pembayaran yang terpercaya.
        </p>
        <div class="search-bar">
          <div class="search">
            <span class="dot" />
            <input type="search" v-model="search" placeholder="Cari judul atau penulis…" @keyup.enter="handleSearch" />
          </div>
          <button class="secondary" @click="handleSearch">Cari</button>
          <button class="ghost" @click="browseCollection">Lihat koleksi</button>
        </div>
        <div class="metrics">
          <div>
            <p>Judul aktif</p>
            <strong>{{ totalItems }}</strong>
          </div>
          <div>
            <p>Tag</p>
            <strong>{{ ebookStore.tags.length }}</strong>
          </div>
          <div>
            <p>Sinkron reader</p>
            <strong>Live</strong>
          </div>
        </div>
      </div>
      <div class="hero-feature" v-if="featured">
        <img :src="featuredCover" :alt="featured.title" />
        <div>
          <p class="muted">Pilihan editor</p>
          <h3>{{ featured.title }}</h3>
          <p>{{ featured.author }}</p>
          <button class="primary" @click="goToFeatured">Lihat detail</button>
        </div>
      </div>
    </div>
    <div class="filter-bar">
      <div class="chips">
        <p class="muted">Kategori terpopuler</p>
        <TagFilter :tags="ebookStore.tags" v-model="selectedTag" @update:modelValue="handleTag" />
      </div>
      <button class="reset" @click="resetFilters">Reset filter</button>
    </div>
    <div class="grid" ref="gridRef">
      <EbookCard v-for="ebook in ebookStore.paginated?.items ?? []" :key="ebook.id" :ebook="ebook" />
    </div>
    <footer v-if="ebookStore.paginated" class="pagination">
      <button :disabled="ebookStore.filters.page <= 1" @click="changePage(ebookStore.filters.page - 1)">Sebelumnya</button>
      <span>Halaman {{ ebookStore.filters.page }} / {{ totalPages }}</span>
      <button :disabled="ebookStore.filters.page >= totalPages" @click="changePage(ebookStore.filters.page + 1)">Selanjutnya</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useEbookStore } from '../stores/ebooks';
import TagFilter from '../components/ebooks/TagFilter.vue';
import EbookCard from '../components/ebooks/EbookCard.vue';
import { apiBaseUrl } from '../api/http';

const ebookStore = useEbookStore();
const router = useRouter();
const search = ref(ebookStore.filters.search);
const selectedTag = ref<string | null>(ebookStore.filters.tag);
const gridRef = ref<HTMLElement | null>(null);
const placeholderCover = 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=600&q=60';

onMounted(async () => {
  await Promise.all([ebookStore.fetchTags(), ebookStore.fetchEbooks()]);
});

const coverFrom = (coverUrl: string | null) => {
  if (!coverUrl) return placeholderCover;
  if (/^https?:\/\//i.test(coverUrl)) return coverUrl;
  try {
    return new URL(coverUrl, apiBaseUrl).toString();
  } catch {
    return placeholderCover;
  }
};

const featured = computed(() => ebookStore.paginated?.items[0] ?? null);
const featuredCover = computed(() => coverFrom(featured.value?.coverUrl ?? null));

const handleSearch = () => {
  ebookStore.fetchEbooks({ search: search.value, page: 1 });
};

const handleTag = (tag: string | null) => {
  selectedTag.value = tag;
  ebookStore.fetchEbooks({ tag: tag ?? undefined, page: 1 });
};

const resetFilters = () => {
  search.value = '';
  selectedTag.value = null;
  ebookStore.fetchEbooks({ search: '', tag: undefined, page: 1 });
};

const changePage = (page: number) => {
  ebookStore.fetchEbooks({ page });
  browseCollection();
};

const browseCollection = () => {
  gridRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const goToFeatured = () => {
  if (!featured.value) return;
  router.push({ name: 'ebook-detail', params: { id: featured.value.id } });
};

const totalPages = computed(() => {
  if (!ebookStore.paginated) return 1;
  return Math.ceil(ebookStore.paginated.meta.total / ebookStore.paginated.meta.limit);
});

const totalItems = computed(() => ebookStore.paginated?.meta.total ?? 0);
</script>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  padding: 2.5rem;
  border-radius: 36px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.08), rgba(56, 189, 248, 0.15));
  backdrop-filter: blur(10px);
}

.hero-copy h1 {
  margin: 0.8rem 0;
  font-size: clamp(2rem, 4vw, 3.4rem);
  line-height: 1.2;
}

.eyebrow {
  margin: 0;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: rgba(15, 23, 42, 0.8);
  font-size: 0.75rem;
}

.subtitle {
  margin: 0;
  color: var(--muted);
  max-width: 600px;
}

.search-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin: 1.5rem 0;
}

.search {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 18px;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.search input {
  background: transparent;
  border: none;
  color: inherit;
  width: 100%;
  font-size: 1rem;
}

.search input:focus {
  outline: none;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary);
}

.secondary,
.ghost {
  border-radius: 16px;
  padding: 0.6rem 1.4rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
}

.secondary {
  background: var(--primary);
  color: white;
}

.ghost {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.4);
  color: white;
}

.metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
}

.metrics div {
  background: rgba(5, 8, 22, 0.35);
  border-radius: 16px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.metrics p {
  margin: 0;
  color: var(--muted);
  font-size: 0.85rem;
}

.metrics strong {
  font-size: 1.8rem;
}

.hero-feature {
  background: rgba(5, 8, 22, 0.8);
  border-radius: 28px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.hero-feature img {
  width: 150px;
  height: 210px;
  object-fit: cover;
  border-radius: 20px;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.5);
}

.hero-feature button {
  margin-top: 0.8rem;
}

.primary {
  border-radius: 999px;
  padding: 0.45rem 1.4rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: linear-gradient(120deg, var(--primary), var(--accent));
  color: white;
}

.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.chips {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.reset {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  border-radius: 12px;
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.pagination button {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  padding: 0.5rem 1.2rem;
  color: inherit;
  cursor: pointer;
}

@media (max-width: 720px) {
  .search-bar {
    flex-direction: column;
  }

  .hero-feature {
    flex-direction: column;
  }
}
</style>
