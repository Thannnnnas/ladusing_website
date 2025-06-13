<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useRouter } from 'vue-router';

const router = useRouter();

const username = ref('');
const email = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const isLoading = ref(false);

const showNotification = ref(false);
const notificationMessage = ref('');
const notificationType = ref(''); 
let notificationTimeout = null;

function triggerNotification(message, type, duration = 1500) {
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

const handleRegister = async () => {
  if (!username.value || !email.value || !password.value || !passwordConfirmation.value) {
    triggerNotification('Semua kolom wajib diisi!', 'error');
    return;
  }

  if (password.value !== passwordConfirmation.value) {
    triggerNotification('Konfirmasi kata sandi tidak cocok!', 'error');
    return;
  }

  isLoading.value = true;

  try {
    const response = await axios.post('http://172.20.3.47:9999/auth/register', {
      username: username.value,
      email: email.value,
      password: password.value,
    });

    if (response.data && response.data.message === "User registered successfully") {
      triggerNotification('Pendaftaran berhasil! Silakan masuk.', 'success');
      
      setTimeout(() => {
        router.push('/login');
      }, 500); 
    } else {
      throw new Error('Gagal mendaftarkan pengguna.');
    }

  } catch (error) {
    console.error('Pendaftaran gagal:', error);
    let errorMessage = 'Pendaftaran gagal. Mungkin username atau email sudah digunakan.';
    if (error.response && error.response.data && (error.response.data.message || error.response.data.error) ) {
        errorMessage = `Pendaftaran gagal: ${error.response.data.message || error.response.data.error}`;
    }
    triggerNotification(errorMessage, 'error');
  } finally {
    isLoading.value = false;
  }
};

const goToLogin = () => {
  router.push('/login');
};
</script>

<template>
  <div class="register-page-container">
    <div class="left-panel">
      <div class="mascot-container">
        <img src="@/assets/images/monyet-maskot.png" alt="Maskot Ladusing" class="mascot-image" />
      </div>
    </div>

    <div class="right-panel">
      <div class="register-form-wrapper">
        <img src="@/assets/images/logo-ladusing.png" alt="Logo Ladusing" class="logo-image" />
        <p class="welcome-text">
          Silahkan daftar dengan mengisi formulir dibawah ini!
        </p>
        <form @submit.prevent="handleRegister" class="register-form">
          <div class="input-group">
            <label for="username">Username</label>
            <input type="text" id="username" v-model="username" autocomplete="username" />
          </div>
          <div class="input-group">
            <label for="email">Email</label>
            <input type="email" id="email" v-model="email" autocomplete="email" />
          </div>
          <div class="input-group">
            <label for="password">Kata Sandi</label>
            <input type="password" id="password" v-model="password" autocomplete="new-password" />
          </div>
          <div class="input-group">
            <label for="passwordConfirmation">Konfirmasi Kata Sandi</label>
            <input type="password" id="passwordConfirmation" v-model="passwordConfirmation" autocomplete="new-password" />
          </div>
          <button type="submit" class="register-button" :disabled="isLoading">
            <span v-if="!isLoading">Daftar</span>
            <span v-else>Mendaftar...</span>
          </button>
        </form>
        <p class="login-link">
          Sudah punya akun? <a href="#" @click.prevent="goToLogin">Masuk</a>
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
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

.register-page-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  font-family: 'Poppins', sans-serif;
  background-color: #F8F9FA;
  position: relative;
  overflow: hidden;
}

/* Kolom Kiri */
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

.register-form-wrapper {
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
  margin-bottom: 15px;
}

.register-form {
  width: 100%;
}

.input-group {
  margin-bottom: 10px;
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

.register-button {
  width: 100%;
  padding: 15px;
  border: none;
  border-radius: 8px;
  background-color: #1e3a8a;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 10px;
  transition: background-color 0.3s;
}

.register-button:hover:not(:disabled) {
  background-color: #2547a7;
}

.register-button:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.login-link {
  margin-top: 20px;
  font-size: 14px;
  color: #343a40;
  text-align: center;
}

.login-link a {
  color: #1e3a8a;
  font-weight: 600;
  text-decoration: none;
}

.login-link a:hover {
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

