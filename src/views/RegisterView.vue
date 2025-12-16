<template>
  <section class="relative min-h-screen overflow-hidden bg-brand-dark text-white">
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,#3a2e75_0%,rgba(5,8,22,0)_45%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.4),rgba(5,8,22,0)_55%)] opacity-70"></div>
      <div class="absolute left-1/2 top-24 h-72 w-72 -translate-x-1/2 rounded-full bg-highlight/10 blur-3xl"></div>
    </div>
    <div class="relative mx-auto flex max-w-6xl flex-col gap-12 px-6 py-16 lg:flex-row lg:items-center">
      <div class="space-y-8 lg:w-1/2">
        <p class="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-sm text-white/70">
          <span class="h-1.5 w-1.5 rounded-full bg-accent"></span>
          Daftar hanya dalam hitungan detik
        </p>
        <div class="space-y-4">
          <h1 class="text-4xl font-semibold leading-tight md:text-5xl">
            Buat akun untuk akses ribuan koleksi eksklusif
          </h1>
          <p class="text-base text-white/70">
            Personalisasi rekomendasi bacaan, lanjutkan halaman terakhir otomatis, dan simpan koleksi
            favoritmu di semua perangkat.
          </p>
        </div>
        <div class="grid gap-6 md:grid-cols-2">
          <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p class="text-sm text-white/60">Koleksi premium</p>
            <p class="mt-3 text-3xl font-semibold">18.000+</p>
            <p class="mt-2 text-sm text-white/60">Dari penerbit terbaik Indonesia</p>
          </div>
          <div class="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p class="text-sm text-white/60">Fitur unggulan</p>
            <ul class="mt-3 space-y-2 text-sm text-white/75">
              <li class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span> Mode malam dan fokus
              </li>
              <li class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span> Highlight dan catatan
              </li>
              <li class="flex items-center gap-2">
                <span class="h-1.5 w-1.5 rounded-full bg-accent"></span> Sinkron ke semua device
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <div class="mb-8 flex items-start justify-between gap-4">
          <div>
            <p class="text-sm text-white/60">Mulai perjalanan membacamu</p>
            <h2 class="text-2xl font-semibold">Daftar akun baru</h2>
          </div>
          <router-link to="/login" class="text-sm font-medium text-highlight transition hover:text-white">
            Sudah punya akun?
          </router-link>
        </div>
        <form class="space-y-5" @submit.prevent="handleRegister">
          <div class="space-y-2">
            <label class="text-sm text-white/70" for="name">Nama lengkap</label>
            <input
              id="name"
              v-model="name"
              type="text"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autocomplete="name"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm text-white/70" for="register-email">Email</label>
            <input
              id="register-email"
              v-model="email"
              type="email"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autocomplete="email"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm text-white/70" for="register-password">Kata sandi</label>
            <input
              id="register-password"
              v-model="password"
              type="password"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              autocomplete="new-password"
              minlength="6"
              required
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm text-white/70" for="confirm-password">Konfirmasi kata sandi</label>
            <input
              id="confirm-password"
              v-model="passwordConfirmation"
              type="password"
              class="w-full rounded-2xl border border-white/10 bg-brand-light/30 px-4 py-3 text-base text-white placeholder:text-white/40 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              minlength="6"
              required
            />
          </div>
          <p v-if="errorMessage" class="rounded-2xl border border-red-300/50 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {{ errorMessage }}
          </p>
          <button
            type="submit"
            class="flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-accent to-highlight px-4 py-3 text-base font-semibold text-brand-dark shadow-glow transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            :disabled="auth.loading"
          >
            {{ auth.loading ? 'Memproses...' : 'Buat akun' }}
          </button>
        </form>
        <p class="mt-8 text-center text-sm text-white/50">
          Dengan membuat akun kamu setuju pada
          <span class="font-semibold text-highlight">Syarat & Ketentuan</span> kami.
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
const redirectPath = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : '/'
);

const name = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const errorMessage = ref('');

const handleRegister = async () => {
  errorMessage.value = '';
  if (password.value !== passwordConfirmation.value) {
    errorMessage.value = 'Konfirmasi kata sandi tidak sama.';
    return;
  }

  try {
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    });
    router.push(redirectPath.value);
  } catch (error) {
    errorMessage.value =
      (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
      'Gagal mendaftar, silakan coba lagi.';
  }
};
</script>
