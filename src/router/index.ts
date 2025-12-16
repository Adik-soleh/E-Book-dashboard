import { createRouter, createWebHistory } from 'vue-router';
import EbookListView from '../views/EbookListView.vue';
import EbookDetailView from '../views/EbookDetailView.vue';
import CheckoutView from '../views/CheckoutView.vue';
import ReaderView from '../views/ReaderView.vue';
import AdminDashboard from '../views/AdminDashboard.vue';
import AdminUploadView from '../views/AdminUploadView.vue';
import LibraryView from '../views/LibraryView.vue';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: EbookListView },
    { path: '/ebooks/:id', name: 'ebook-detail', component: EbookDetailView, props: true },
    { path: '/checkout/:id', name: 'checkout', component: CheckoutView, props: true, meta: { requiresAuth: true } },
    { path: '/reader/:id', name: 'reader', component: ReaderView, props: true, meta: { requiresAuth: true } },
    { path: '/library', name: 'library', component: LibraryView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminDashboard, meta: { requiresAuth: true, adminOnly: true } },
    {
      path: '/admin/upload',
      name: 'admin-upload',
      component: AdminUploadView,
      meta: { requiresAuth: true, adminOnly: true },
    },
    { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
    { path: '/register', name: 'register', component: RegisterView, meta: { guestOnly: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  await auth.hydrate();

  if (to.meta.requiresAuth && !auth.user) {
    const query =
      to.fullPath && to.fullPath !== '/' ? { redirect: to.fullPath } : undefined;
    return query ? { name: 'login', query } : { name: 'login' };
  }

  if (to.meta.adminOnly && auth.user?.role !== 'ADMIN') {
    return { name: 'home' };
  }

  if (to.meta.guestOnly && auth.user) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : { name: 'home' };
  }

  return true;
});

export default router;
