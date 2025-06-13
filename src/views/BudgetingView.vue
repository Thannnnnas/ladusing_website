<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = ref({ username: '', email: '' });
const isLoading = ref(true);
const activeTab = ref('pemasukan');
const allBudgetCategories = ref([]);
const selectedMonth = ref('');
const availableMonths = ref([]);
const showAddDialog = ref(false);

const newCategory = ref({
  name: '',
  limit: null,
});

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref(''); 
let notificationTimeout = null;

const displayedCategories = computed(() => {
  if (!Array.isArray(allBudgetCategories.value)) return [];
  return allBudgetCategories.value.filter(cat => cat.type === activeTab.value);
});

onMounted(async () => {
  const token = getAuthToken();
  if (token) {
    await Promise.all([
      fetchUserProfile(token),
      fetchInitialBudgetData(token)
    ]);
  }
  generateAvailableMonths();
  if (!selectedMonth.value) {
    const now = new Date();
    selectedMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
});

function triggerNotification(message, type, duration = 3000) {
  if (notificationTimeout) {
    clearTimeout(notificationTimeout);
  }
  notificationMessage.value = message;
  notificationType.value = type;
  showNotification.value = true;
  notificationTimeout = setTimeout(() => {
    showNotification.value = false;
  }, duration);
}

async function fetchUserProfile(token) {
  try {
    const response = await axios.get('http://172.20.3.47:9999/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    user.value = {
      username: response.data.username,
      email: response.data.email
    };
  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
    logout();
  }
}

async function fetchInitialBudgetData(token) {
    const now = new Date();
    const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    await fetchBudgetData(token, initialMonth);
}

async function fetchBudgetData(token, month) {
  if (!token || !month) return;
  isLoading.value = true;
  try {
    const response = await axios.get(`http://172.20.3.47:9999/budgeting?month=${month}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    allBudgetCategories.value = response.data;
  } catch (error) {
    console.error('Gagal memuat data budgeting:', error);
    allBudgetCategories.value = [];
  } finally {
    isLoading.value = false;
  }
}

function onMonthChange() {
    const token = getAuthToken();
    fetchBudgetData(token, selectedMonth.value);
}

function getAuthToken() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    router.push('/login');
    return null;
  }
  return token;
}

function generateAvailableMonths() {
  const months = [];
  const now = new Date();
  for (let i = -6; i <= 12; i++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
    months.push({ value: `${year}-${month}`, text: monthDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' }) });
  }
  availableMonths.value = months;
}

async function handleAddCategory() {
  const token = getAuthToken();
  if (!token) return;

  // Validasi input dan ganti alert dengan notifikasi
  if (!newCategory.value.name) {
    triggerNotification('Nama Kategori tidak boleh kosong.', 'error');
    return;
  }
  if (activeTab.value === 'pengeluaran' && (!newCategory.value.limit || newCategory.value.limit <= 0)) {
    triggerNotification('Limit untuk pengeluaran harus diisi dan lebih dari 0.', 'error');
    return;
  }

  const payload = {
    month: `${selectedMonth.value}-01`,
    category: newCategory.value.name,
    type: activeTab.value,
  };

  if (activeTab.value === 'pengeluaran') {
    payload.limit_amount = parseFloat(newCategory.value.limit);
  }

  try {
    await axios.post('http://172.20.3.47:9999/budgeting', payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    triggerNotification('Kategori berhasil ditambahkan!', 'success');
    closeAddDialog();
    await fetchBudgetData(token, selectedMonth.value);
  } catch (error) {
    console.error('Gagal menambah kategori:', error);
    const errorMessage = error.response?.data?.message || 'Terjadi kesalahan saat menambah kategori.';
    triggerNotification(`Gagal: ${errorMessage}`, 'error');
  }
}

function openAddDialog() {
  newCategory.value = { name: '', limit: null };
  showAddDialog.value = true;
}

function closeAddDialog() {
  showAddDialog.value = false;
}

function formatCurrency(value) {
  if (typeof value !== 'number') return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function logout() {
  localStorage.removeItem('authToken');
  router.push('/login');
}
</script>

<template>
  <div class="page-container">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="@/assets/images/logo-ladusing.png" alt="Logo Ladusing" class="sidebar-logo" />
      </div>
      <nav class="sidebar-nav">
        <router-link to="/budgeting" class="nav-item" active-class="active">Budgeting</router-link>
        <router-link to="/pencatatan" class="nav-item">Pencatatan</router-link>
        <router-link to="/laporan" class="nav-item">Laporan</router-link>
        <a href="#" @click.prevent="logout" class="nav-item">Keluar</a>
      </nav>
      <div class="sidebar-footer">
        <div class="profile-avatar"></div>
        <div class="profile-info">
          <span class="profile-name">{{ user.username }}</span>
          <span class="profile-email">{{ user.email }}</span>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="main-content">
      <h1 class="page-title">Budgeting</h1>
      <div class="content-header">
        <div class="period-selector">
          <span>Pilih Periode</span>
          <select v-model="selectedMonth" @change="onMonthChange">
            <option v-for="month in availableMonths" :key="month.value" :value="month.value">
              {{ month.text }}
            </option>
          </select>
        </div>
      </div>

      <div class="tabs">
        <button @click="activeTab = 'pemasukan'" :class="{ active: activeTab === 'pemasukan' }">
          Pemasukan
        </button>
        <button @click="activeTab = 'pengeluaran'" :class="{ active: activeTab === 'pengeluaran' }">
          Pengeluaran
        </button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Kategori</th>
              <th v-if="activeTab === 'pengeluaran'">Limit</th>
              <th v-if="activeTab === 'pengeluaran'">Sisa Limit</th>
              <th v-else>Aktual</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="4" class="text-center">Memuat data...</td>
            </tr>
            <tr v-else-if="displayedCategories.length === 0">
              <td colspan="4" class="text-center">Belum ada data untuk kategori ini.</td>
            </tr>
            <tr v-for="(item, index) in displayedCategories" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.category }}</td>
              <td v-if="activeTab === 'pengeluaran'">{{ formatCurrency(item.limit_amount) }}</td>
              <td v-if="activeTab === 'pengeluaran'">{{ formatCurrency(item.remaining_limit) }}</td>
              <td v-else>{{ formatCurrency(item.total_income_from_transactions) }}</td>
            </tr>
          </tbody>
        </table>
        <button @click="openAddDialog" class="btn-add-new">Baru +</button>
      </div>
    </main>

    <div v-if="showAddDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h2>Tambah Kategori {{ activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran' }}</h2>
        <div class="dialog-form">
          <div class="form-group">
            <label for="categoryName">Nama Kategori</label>
            <input type="text" id="categoryName" v-model="newCategory.name" placeholder="cth: Gaji, Makanan">
          </div>
          <div v-if="activeTab === 'pengeluaran'" class="form-group">
            <label for="categoryLimit">Limit</label>
            <input type="number" id="categoryLimit" v-model="newCategory.limit" placeholder="cth: 1000000">
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeAddDialog" class="btn-secondary">Batal</button>
          <button @click="handleAddCategory" class="btn-primary">Tambah</button>
        </div>
      </div>
    </div>
    
    <Transition name="toast-fade">
      <div v-if="showNotification" class="notification-toast" :class="`toast-${notificationType}`">
        {{ notificationMessage }}
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.page-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #f0f4f8;
  font-family: 'Poppins', sans-serif;
  position: relative; 
  overflow: hidden;
}
.sidebar {
  width: 250px;
  background-color: #A6C8FF; 
  display: flex;
  flex-direction: column;
  padding: 20px;
  flex-shrink: 0; 
}
.main-content {
  flex-grow: 1; 
  background-color: #00008B; 
  padding: 24px 40px;
  display: flex;
  flex-direction: column;
  overflow-y: auto; 
}

.sidebar-header .sidebar-logo {
    width: 150px;
    margin-bottom: 40px;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  text-decoration: none;
  color: #00008B;
  font-weight: 500;
  transition: background-color 0.2s;
}
.nav-item.active, .nav-item:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
.sidebar-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
}
.profile-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #00008B;
  flex-shrink: 0;
}
.profile-info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.profile-name {
  font-weight: bold;
  color: #00008B;
}
.profile-email {
  font-size: 0.8rem;
  color: #00008B;
  opacity: 0.8;
}

/* MAIN CONTENT STYLES */
.page-title {
  color: white;
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 20px;
}
.content-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
.period-selector {
  background-color: white;
  color: black;
  padding: 4px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.period-selector select {
    border: none;
    background: transparent;
    font-size: 1rem;
    font-weight: bold;
    cursor: pointer;
}
.period-selector select:focus {
    outline: none;
}
.tabs {
  margin-bottom: 16px;
}
.tabs button {
  background: none;
  border: none;
  color: #ccc;
  padding: 10px 20px;
  font-size: 1rem;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.2s, border-color 0.2s;
}
.tabs button.active {
  color: white;
  font-weight: bold;
  border-bottom-color: white;
}
.table-container {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  flex-grow: 1;
  position: relative;
  display: flex;
  flex-direction: column;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  text-align: left;
  padding: 12px 16px;
  border-bottom: 1px solid #eee;
}
th {
  font-weight: bold;
  color: #333;
}
tbody {
  color: #555;
}
.btn-add-new {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background-color: #00008B;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s;
}
.btn-add-new:hover {
  background-color: #1e3a8a;
}
.text-center {
  text-align: center;
  color: #999;
  padding: 40px 0;
}

/* DIALOG STYLES */
.dialog-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.dialog-content {
  background-color: white;
  padding: 24px;
  border-radius: 8px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 5px 15px rgba(0,0,0,0.3);
}
.dialog-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #333;
}
.form-group {
  margin-bottom: 16px;
}
.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}
.form-group input {
  width: 100%;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #ccc;
  box-sizing: border-box; 
}
.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
.btn-secondary {
    background-color: #e2e8f0;
    color: #333;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
}
.btn-primary {
    background-color: #00008B;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
}

.notification-toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1001; 
  text-align: center;
}

.toast-success {
  background-color: #28a745; /* Hijau untuk sukses */
}

.toast-error {
  background-color: #dc3545; /* Merah untuk error */
}

/* Transisi untuk fade-in dan fade-out */
.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translate(-50%, 20px); 
}
</style>

