import { defineStore } from 'pinia';
import { ebooksApi, tagsApi } from '../api';
import type { EbookSummary, Paginated, Tag } from '../types';

interface EbookState {
  paginated: Paginated<EbookSummary> | null;
  tags: Tag[];
  filters: { search: string; tag: string | null; page: number };
  loading: boolean;
}

export const useEbookStore = defineStore('ebooks', {
  state: (): EbookState => ({
    paginated: null,
    tags: [],
    filters: { search: '', tag: null, page: 1 },
    loading: false,
  }),
  actions: {
    async fetchEbooks(overrides: Partial<{ search: string; tag: string; page: number }> = {}) {
      this.loading = true;
      const params = { ...this.filters, ...overrides };
      try {
        const response = await ebooksApi.list(params);
        this.paginated = response;
        this.filters = params;
      } finally {
        this.loading = false;
      }
    },
    async fetchTags() {
      this.tags = await tagsApi.list();
    },
  },
});
