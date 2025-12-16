<template>
  <section class="relative min-h-screen overflow-hidden bg-brand-dark text-white">
    <div class="absolute inset-0">
      <div class="absolute -left-32 top-10 h-72 w-72 rounded-full bg-accent/20 blur-3xl"></div>
      <div class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-highlight/10 blur-3xl"></div>
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,#2d2257_0%,#050816_65%)] opacity-60"></div>
    </div>
    <div class="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
      <div class="space-y-8 lg:w-1/2">
        <p class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-sm text-white/70">
          <span class="h-1.5 w-1.5 rounded-full bg-highlight"></span>
          Eksklusif untuk koleksi e-book terbaik
        </p>
        <div class="space-y-4">
          <h1 class="text-4xl font-semibold leading-tight md:text-5xl">
            Masuk untuk melanjutkan membaca koleksi favoritmu
          </h1>
          <p class="text-base text-white/70">
            Akses perpustakaan digital lengkap dengan satu akun. Sinkron antar perangkat, rekomendasi
            personal, dan pengalaman membaca nyaman kapan saja.
          </p>
        </div>
        <div class="grid gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <div class="flex items-center gap-4">
            <div class="rounded-2xl border border-white/10 p-3">
              <span class="text-3xl font-semibold text-highlight">50K+</span>
            </div>
            <div>
              <p class="text-sm text-white/60">Pembaca aktif</p>
              <p class="text-lg font-medium">Setiap bulannya</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="h-12 w-12 rounded-2xl border border-white/10 bg-white/5"></div>
            <p class="text-white/60">
              Nikmati pengalaman membaca dengan highlight interaktif, catatan, dan mode malam.
            </p>
          </div>
        </div>
      </div>

      <div class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div class="mb-8 flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-white/60">Selamat datang kembali</p>
            <h2 class="text-2xl font-semibold">Masuk ke akunmu</h2>
          </div>
          <router-link
            to="/register"
            class="text-sm font-medium text-highlight transition hover:text-white"
          >
            Daftar akun
          </router-link>
        </div>
        <form class="space-y-5" @submit.prevent="handleLogin">
          <div class="space-y-2">
            <label class="text-sm text-white/70" for="email">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm text-white/70">
              <label for="password">Kata sandi</label>
              <button type="button" class="text-highlight hover:text-white">
                Lupa sandi?
              </button>
            </div>
            <input
              id="password"
              v-model="password"
              type="password"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autocomplete="current-password"
              minlength="6"
              required
            />
          </div>
          <p v-if="errorMessage" class="rounded-2xl border border-red-300/50 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {{ errorMessage }}
          </p>
          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-highlight to-accent px-4 py-3 text-base font-semibold text-brand-dark shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="auth.loading"
          >
            {{ auth.loading ? 'Memproses...' : 'Masuk Sekarang' }}
          </button>
        </form>
        <p class="mt-8 text-center text-sm text-white/50">
          Belum punya akun?
          <router-link to="/register" class="font-semibold text-highlight hover:text-white">
            Daftar sekarang
          </router-link>
        </p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const redirectPath = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/'
);

const handleLogin = async () => {
  errorMessage.value = '';
  try {
    await auth.login({ email: email.value, password: password.value });
    router.push(redirectPath.value);
  } catch (error) {
    errorMessage.value =
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Gagal masuk, silakan coba lagi.';
  }
};
</script>
