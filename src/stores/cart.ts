import { defineStore } from 'pinia';
import { cartApi } from '../api';
import type { CartPayload } from '../types';

interface CartState {
  data: CartPayload;
  loading: boolean;
  initialized: boolean;
}

const emptyCart = (): CartPayload => ({
  items: [],
  totals: { items: 0, quantity: 0, subtotal: 0 },
});

export const useCartStore = defineStore('cart', {
  state: (): CartState => ({
    data: emptyCart(),
    loading: false,
    initialized: false,
  }),
  getters: {
    items(state) {
      return state.data.items;
    },
    totals(state) {
      return state.data.totals;
    },
    itemCount(state) {
      return state.data.totals.items;
    },
    hasItem: (state) => (ebookId?: string) => {
      if (!ebookId) return false;
      return state.data.items.some((item) => item.ebookId === ebookId);
    },
  },
  actions: {
    setCart(payload: CartPayload) {
      this.data = payload;
      this.initialized = true;
    },
    reset() {
      this.data = emptyCart();
      this.initialized = false;
    },
    async fetchCart() {
      this.loading = true;
      try {
        const cart = await cartApi.list();
        this.setCart(cart);
      } finally {
        this.loading = false;
      }
    },
    async add(ebookId: string, quantity = 1) {
      const cart = await cartApi.add({ ebookId, quantity });
      this.setCart(cart);
      return cart;
    },
    async update(itemId: string, quantity: number) {
      const cart = await cartApi.update(itemId, { quantity });
      this.setCart(cart);
      return cart;
    },
    async remove(itemId: string) {
      const cart = await cartApi.remove(itemId);
      this.setCart(cart);
      return cart;
    },
    async clear() {
      const cart = await cartApi.clear();
      this.setCart(cart);
      return cart;
    },
  },
});
