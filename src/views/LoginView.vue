<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();
const email = ref('');
const password = ref('');
const isLoading = ref(false);

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref(''); 

let notificationTimeout = null;

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

const handleLogin = async () => {
  if (!email.value || !password.value) {
    triggerNotification('Email dan Kata Sandi tidak boleh kosong!', 'error');
    return;
  }

  isLoading.value = true;

  try {
    const response = await axios.post('http://172.20.3.47:9999/auth/login', {
      email: email.value,
      password: password.value,
    });

    if (response.data && response.data.access_token) {
      const token = response.data.access_token;
      localStorage.setItem('authToken', token);

      triggerNotification('Login berhasil!', 'success');

      setTimeout(() => {
        router.push('/budgeting');
      }, 500); 

    } else {
      throw new Error('Respons tidak valid dari server.');
    }
  } catch (error) {
    console.error('Login gagal:', error);
    let errorMessage = 'Login gagal. Terjadi kesalahan pada server.';
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage = `Login gagal: ${error.response.data.error}`;
    } 
    else if (error.response && error.response.data && error.response.data.message) {
      errorMessage = `Login gagal: ${error.response.data.message}`;
    }
    triggerNotification(errorMessage, 'error');
  } finally {
    isLoading.value = false;
  }
};

const goToRegister = () => {
  router.push('/register');
};
</script>

<template>
  <div class="login-page-container">
    <div class="left-panel">
      <div class="mascot-container">
        <img src="@/assets/images/monyet-maskot.png" alt="Maskot Ladusing" class="mascot-image" />
      </div>
    </div>

    <div class="right-panel">
      <div class="login-form-wrapper">
        <img src="@/assets/images/logo-ladusing.png" alt="Logo Ladusing" class="logo-image" />
        <p class="welcome-text">
          Silahkan masuk dengan alamat Email yang terdaftar!
        </p>
        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" autocomplete="email" />
          </div>
          <div class="input-group">
            <label for="password">Kata Sandi</label>
            <input type="password" id="password" v-model="password" autocomplete="current-password" />
          </div>
          <button type="submit" class="login-button" :disabled="isLoading">
            <span v-if="!isLoading">Masuk</span>
            <span v-else>Loading...</span>
          </button>
        </form>
        <p class="register-link">
          Belum punya akun? <a href="#" @click.prevent="goToRegister">Daftar</a>
        </p>
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
/* Pengaturan Font Global */
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.login-page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  font-family: 'Poppins', sans-serif;
  background-color: #F8F9FA;
  position: relative; /* Diperlukan agar notifikasi fixed berfungsi baik */
  overflow: hidden;
}

.left-panel {
  flex: 1;
  background: linear-gradient(180deg, #1e3a8a 0%, #3b82f6 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40px;
  overflow: hidden;
  position: relative;
}

.mascot-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mascot-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  z-index: 1;
}

/* Kolom Kanan */
.right-panel {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
  padding: 40px;
}

.login-form-wrapper {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
}

.logo-image {
  width: 250px;
  margin-bottom: 30px;
  align-self: flex-start;
}

.welcome-text {
  font-size: 16px;
  color: #6c757d;
  margin-bottom: 25px;
}

.login-form {
  width: 100%;
}

.input-group {
  margin-bottom: 20px;
}

.input-group label {
  display: block;
  font-size: 14px;
  color: #343a40;
  margin-bottom: 8px;
  font-weight: 500;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 8px;
  background-color: #f8f9fa;
  font-size: 16px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: #1e3a8a;
  box-shadow: 0 0 0 3px rgba(30, 58, 138, 0.1);
}

.login-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  background-color: #1e3a8a;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.3s;
}

.login-button:hover:not(:disabled) {
  background-color: #2547a7;
}

.login-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.register-link {
  margin-top: 30px;
  font-size: 14px;
  color: #343a40;
  text-align: center;
}

.register-link a {
  color: #1e3a8a;
  font-weight: 600;
  text-decoration: none;
}

.register-link a:hover {
  text-decoration: underline;
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
  z-index: 1000;
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


@media (max-width: 992px) {
  .left-panel {
    display: none;
  }
  .right-panel {
    flex: 1 1 100%;
  }
}
</style>

