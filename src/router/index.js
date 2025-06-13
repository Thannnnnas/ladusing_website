import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import RegisterView from '../views/RegisterView.vue';

const BudgetingView = () => import('../views/BudgetingView.vue');
const PencatatanView = () => import('../views/PencatatanView.vue'); 
const LaporanView = () => import('../views/LaporanView.vue');

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/register', name: 'register', component: RegisterView },
    {
      path: '/budgeting',
      name: 'budgeting',
      component: BudgetingView,
      meta: { requiresAuth: true }
    },
    { 
      path: '/pencatatan',
      name: 'pencatatan',
      component: PencatatanView,
      meta: { requiresAuth: true }
    },
    { 
      path: '/laporan',
      name: 'laporan',
      component: LaporanView,
      meta: { requiresAuth: true }
    }
  ]
});

// Navigation Guard (tetap sama)
router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('authToken');
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login');
  } else {
    next();
  }
});

export default router;
