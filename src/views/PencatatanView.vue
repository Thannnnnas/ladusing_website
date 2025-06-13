<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';

const router = useRouter();
const user = ref({ username: '', email: '' });
const isLoading = ref(true);
const activeTab = ref('pemasukan'); 
const transactions = ref([]);
const allBudgetCategories = ref([]); 
const selectedMonth = ref('');
const availableMonths = ref([]);
const showAddDialog = ref(false);

const newTransaction = ref({
  date: new Date().toISOString().split('T')[0], // Default tanggal hari ini
  budgeting_id: null,
  amount: null,
});

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref(''); // 'success' atau 'error'
let notificationTimeout = null;

const displayedTransactions = computed(() => {
  if (!Array.isArray(transactions.value)) return [];
  return transactions.value.filter(t => t.type === activeTab.value);
});

const availableCategoriesForDialog = computed(() => {
    if (!Array.isArray(allBudgetCategories.value)) return [];
    return allBudgetCategories.value.filter(cat => cat.type === activeTab.value);
});

onMounted(async () => {
  const token = getAuthToken();
  if (token) {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    selectedMonth.value = currentMonth;

    await Promise.all([
      fetchUserProfile(token),
      fetchBudgetCategories(token, currentMonth),
      fetchTransactions(token, currentMonth)
    ]);
  }
  generateAvailableMonths();
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

function getAuthToken() {
  const token = localStorage.getItem('authToken');
  if (!token) router.push('/login');
  return token;
}

async function fetchUserProfile(token) {
  try {
    const response = await axios.get('http://172.20.3.47:9999/profile', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    user.value = { username: response.data.username, email: response.data.email };
  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
    logout();
  }
}

async function fetchBudgetCategories(token, month) {
    try {
        const response = await axios.get(`http://172.20.3.47:9999/budgeting?month=${month}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        allBudgetCategories.value = response.data;
    } catch (error) {
        console.error('Gagal memuat kategori budgeting:', error);
    }
}

async function fetchTransactions(token, month) {
  isLoading.value = true;
  try {
    const response = await axios.get(`http://172.20.3.47:9999/transactions?month=${month}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    transactions.value = response.data.map(t => {
        const budget = allBudgetCategories.value.find(b => b.id === t.budgeting_id);
        return { ...t, category_name: budget ? budget.category : 'Tidak Diketahui' };
    });
  } catch (error) {
    console.error('Gagal memuat transaksi:', error);
    transactions.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function onMonthChange() {
    const token = getAuthToken();
    if (!token) return;
    isLoading.value = true;
    await fetchBudgetCategories(token, selectedMonth.value);
    await fetchTransactions(token, selectedMonth.value);
    isLoading.value = false;
}

async function handleAddTransaction() {
  const token = getAuthToken();
  if (!token) return;

  if (!newTransaction.value.budgeting_id || !newTransaction.value.amount || newTransaction.value.amount <= 0) {
    triggerNotification('Kategori dan jumlah harus diisi dengan benar.', 'error');
    return;
  }

  const selectedCategory = allBudgetCategories.value.find(c => c.id === newTransaction.value.budgeting_id);

  if (selectedCategory && selectedCategory.type === 'pengeluaran') {
    if (parseFloat(newTransaction.value.amount) > selectedCategory.remaining_limit) {
      triggerNotification(`Jumlah melebihi sisa limit kategori (${formatCurrency(selectedCategory.remaining_limit)})`, 'error');
      return;
    }
  }

  const payload = {
    budgeting_id: newTransaction.value.budgeting_id,
    transaction_date: newTransaction.value.date,
    type: selectedCategory.type,
    amount: parseFloat(newTransaction.value.amount),
  };

  try {
    await axios.post('http://172.20.3.47:9999/transactions', payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    triggerNotification('Transaksi berhasil ditambahkan!', 'success');
    closeAddDialog();
    await fetchTransactions(token, selectedMonth.value);
    await fetchBudgetCategories(token, selectedMonth.value); 
  } catch (error) {
    console.error('Gagal menambah transaksi:', error);
    const errorMessage = error.response?.data?.message || 'Terjadi kesalahan';
    triggerNotification(`Gagal menambah transaksi: ${errorMessage}`, 'error');
  }
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

function openAddDialog() {
  newTransaction.value = {
    date: new Date().toISOString().split('T')[0],
    budgeting_id: null,
    amount: null,
  };
  showAddDialog.value = true;
}

function closeAddDialog() {
  showAddDialog.value = false;
}

function formatCurrency(value) {
  if (typeof value !== 'number') return 'Rp 0';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
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
        <router-link to="/budgeting" class="nav-item">Budgeting</router-link>
        <router-link to="/pencatatan" class="nav-item" active-class="active">Pencatatan</router-link>
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
      <h1 class="page-title">Pencatatan</h1>
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
        <button @click="activeTab = 'pemasukan'" :class="{ active: activeTab === 'pemasukan' }">Pemasukan</button>
        <button @click="activeTab = 'pengeluaran'" :class="{ active: activeTab === 'pengeluaran' }">Pengeluaran</button>
      </div>

      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Kategori</th>
              <th>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="isLoading">
              <td colspan="3" class="text-center">Memuat data...</td>
            </tr>
            <tr v-else-if="displayedTransactions.length === 0">
              <td colspan="3" class="text-center">Belum ada transaksi untuk kategori ini.</td>
            </tr>
            <tr v-for="item in displayedTransactions" :key="item.id">
              <td>{{ formatDate(item.transaction_date) }}</td>
              <td>{{ item.category_name }}</td>
              <td>{{ formatCurrency(item.amount) }}</td>
            </tr>
          </tbody>
        </table>
        <button @click="openAddDialog" class="btn-add-new">Baru +</button>
      </div>
    </main>

    <!-- ADD NEW DIALOG -->
    <div v-if="showAddDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h2>Tambah Transaksi {{ activeTab === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran' }}</h2>
        <div class="dialog-form">
          <div class="form-group">
            <label for="transactionDate">Tanggal</label>
            <input type="date" id="transactionDate" v-model="newTransaction.date">
          </div>
          <div class="form-group">
            <label for="transactionCategory">Kategori</label>
            <select id="transactionCategory" v-model="newTransaction.budgeting_id">
              <option :value="null" disabled>-- Pilih Kategori --</option>
              <option v-for="cat in availableCategoriesForDialog" :key="cat.id" :value="cat.id">
                {{ cat.category }} <span v-if="cat.type === 'pengeluaran'"> (Sisa: {{ formatCurrency(cat.remaining_limit) }})</span>
              </option>
            </select>
          </div>
           <div class="form-group">
            <label for="transactionAmount">Jumlah</label>
            <input type="number" id="transactionAmount" v-model="newTransaction.amount" placeholder="cth: 50000">
          </div>
        </div>
        <div class="dialog-actions">
          <button @click="closeAddDialog" class="btn-secondary">Batal</button>
          <button @click="handleAddTransaction" class="btn-primary">Tambah</button>
        </div>
      </div>
    </div>
    
    <!-- --- Elemen Notifikasi (Toast) --- -->
    <Transition name="toast-fade">
      <div v-if="showNotification" class="notification-toast" :class="`toast-${notificationType}`">
        {{ notificationMessage }}
      </div>
    </Transition>

  </div>
</template>

<style scoped>
/* GENERAL LAYOUT & SIDEBAR (Sama seperti BudgetingView) */
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
  background-color: #f8f9fa;
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
}
.dialog-content h2 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #555;
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
.form-group input, .form-group select {
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
}
.btn-primary {
    background-color: #00008B;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
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
  z-index: 1001; /* Z-index lebih tinggi dari dialog overlay */
  text-align: center;
}

.toast-success {
  background-color: #28a745; /* Hijau untuk sukses */
}

.toast-error {
  background-color: #dc3545; /* Merah untuk error */
}

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

