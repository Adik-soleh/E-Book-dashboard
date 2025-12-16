<template>
  <div class="app-shell">
    <div class="glow" />
    <header class="app-header">
      <router-link to="/" class="brand">
        <span class="dot" />
        E-Book <span>Vault</span>
      </router-link>
      <nav class="nav-links">
        <router-link to="/">Home</router-link>
        <router-link v-if="auth.user" to="/library">My Library</router-link>
        <router-link v-if="auth.user?.role === 'ADMIN'" to="/admin">Admin</router-link>
      </nav>
      <div class="auth-module">
        <div v-if="auth.user" class="user-info">
          <div>
            <p class="muted">Signed in as</p>
            <p class="name">{{ auth.user.name }}</p>
          </div>
          <button class="ghost" @click="logout">Logout</button>
        </div>
        <div v-else class="auth-actions">
          <router-link class="ghost" to="/login">Masuk</router-link>
          <router-link class="primary" to="/register">Daftar</router-link>
        </div>
      </div>
    </header>
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import Swal from 'sweetalert2';
import { useAuthStore } from './stores/auth';

const auth = useAuthStore();
const logout = async () => {
  const result = await Swal.fire({
    title: 'Logout dari akun?',
    text: 'Kamu bisa masuk kembali kapan saja.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#38bdf8',
    cancelButtonColor: '#1f2937',
    reverseButtons: true,
    confirmButtonText: 'Ya, logout',
    cancelButtonText: 'Batal',
  });
  if (!result.isConfirmed) return;
  auth.logout();
};

onMounted(() => {
  auth.hydrate();
});
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  isolation: isolate;
}

.glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(120, 49, 255, 0.3), transparent 45%),
    radial-gradient(circle at 80% 0%, rgba(56, 189, 248, 0.3), transparent 50%);
  filter: blur(90px);
  opacity: 0.8;
  z-index: -1;
}

.app-header {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  padding: 1.5rem 3rem;
  gap: 2rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.4rem;
  font-weight: 600;
  color: var(--text);
  text-decoration: none;
}

.brand .dot {
  width: 12px;
  height: 12px;
  border-radius: 999px;
  background: var(--accent);
  box-shadow: 0 0 20px var(--accent);
}

.brand span:last-child {
  color: var(--accent);
}

.nav-links {
  display: flex;
  gap: 1rem;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  padding: 0.35rem;
}

.nav-links a {
  text-decoration: none;
  color: var(--muted);
  padding: 0.4rem 1rem;
  border-radius: 999px;
  transition: color 0.2s, background 0.2s;
}

.nav-links a.router-link-active {
  background: rgba(255, 255, 255, 0.12);
  color: white;
}

.auth-module {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.auth-actions {
  display: flex;
  gap: 0.5rem;
  background: var(--glass);
  border: 1px solid var(--glass-border);
  border-radius: 999px;
  padding: 0.35rem 0.5rem;
}

.primary {
  border: none;
  border-radius: 999px;
  padding: 0.45rem 1.2rem;
  background: linear-gradient(120deg, var(--primary), var(--accent));
  color: white;
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.ghost {
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0.35rem 1rem;
  background: transparent;
  color: white;
  cursor: pointer;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  background: var(--glass);
  padding: 0.35rem 0.6rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
}

.user-info .muted {
  margin: 0;
  font-size: 0.75rem;
  color: var(--muted);
}

.user-info .name {
  margin: 0;
  font-weight: 600;
}

.app-content {
  flex: 1;
  padding: 2rem 3rem 4rem;
}

  @media (max-width: 1024px) {
    .app-header {
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .auth-actions {
      width: 100%;
      justify-content: space-between;
    }

    .auth-actions .primary,
    .auth-actions .ghost {
      flex: 1;
      width: auto;
    }
  }
</style>
