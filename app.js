const SERVICE_UUID = '4fafc201-1fb5-459e-8fcc-c5c9c331914b';
const CHARACTERISTIC_UUID = 'beb5483e-36e1-4688-b7f5-ea07361b26a8';

let ledCharacteristic = null;

// Ampul animasyonu ayarı
let bulbAnim = true;

function setMessage(msg) {
  document.getElementById('messages').textContent = msg;
}

function setBulb(on) {
  const bulbContainer = document.getElementById('bulbContainer');
  if (on) {
    bulbContainer.classList.add('bulb-on');
    bulbContainer.classList.remove('bulb-off');
    if (!bulbAnim) {
      document.getElementById('bulbGlass').style.animation = 'none';
    } else {
      document.getElementById('bulbGlass').style.animation = '';
    }
  } else {
    bulbContainer.classList.add('bulb-off');
    bulbContainer.classList.remove('bulb-on');
    document.getElementById('bulbGlass').style.animation = 'none';
  }
}

// Başlangıçta ampul kapalı
setBulb(false);

document.addEventListener('DOMContentLoaded', () => {
  const baglanBtn = document.getElementById('baglanBtn');
  const ledSwitch = document.getElementById('ledSwitch');
  const darkModeBtn = document.getElementById('darkModeBtn');
  const themeColorSettings = document.getElementById('themeColorSettings');
  const langSelect = document.getElementById('langSelect');

  // Sayfa yüklenince localStorage'dan tema rengini uygula
  const savedColor = localStorage.getItem('themeColor');
  if (savedColor) {
    document.documentElement.style.setProperty('--main-color', savedColor);
    themeColorSettings.value = savedColor;
  }

  // Sadece ayarlar modalındaki select ile çalış
  themeColorSettings.addEventListener('change', function() {
    document.documentElement.style.setProperty('--main-color', this.value);
    localStorage.setItem('themeColor', this.value);
  });

  if (!localStorage.getItem('darkMode')) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.classList.add('dark');
      darkModeBtn.textContent = '☀️';
    }
  } else if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark');
    darkModeBtn.textContent = '☀️';
  }

  darkModeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
      darkModeBtn.textContent = '☀️';
      localStorage.setItem('darkMode', 'enabled');
    } else {
      darkModeBtn.textContent = '🌙';
      localStorage.setItem('darkMode', 'disabled');
    }
  });

  // Bağlan butonu
  baglanBtn.addEventListener('click', async () => {
    try {
      setMessage('Cihaza bağlanılıyor...');
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'ESP32_BLE_LED' }],
        optionalServices: [SERVICE_UUID]
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      ledCharacteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);

      document.getElementById('durum').textContent = 'Durum: Bağlandı';
      ledSwitch.disabled = false;
      setMessage('Bağlantı başarılı.');
      // Bağlantı başarılı olduğunda:
      document.getElementById('statusIcon').className = 'status-on';
    } catch (error) {
      document.getElementById('durum').textContent = 'Durum: Bağlı değil';
      ledSwitch.disabled = true;
      setMessage('Bağlantı hatası: ' + error);
      // Bağlantı koparsa:
      document.getElementById('statusIcon').className = 'status-off';
    }
  });

  // Switch ile LED kontrolü
  ledSwitch.addEventListener('change', async function() {
    if (!ledCharacteristic) return;
    try {
      if (this.checked) {
        await ledCharacteristic.writeValue(new TextEncoder().encode("1"));
        setMessage('LED açıldı.');
        setBulb(true);
        showToast('LED açıldı!');
      } else {
        await ledCharacteristic.writeValue(new TextEncoder().encode("0"));
        setMessage('LED kapatıldı.');
        setBulb(false);
        showToast('LED kapatıldı!');
      }
    } catch (e) {
      setMessage('LED anahtarı hatası: ' + e);
    }
  });

  // Ayarlar modalı aç/kapat
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettingsBtn = document.getElementById('closeSettingsBtn');
  const autoConnectSwitch = document.getElementById('autoConnectSwitch');

  settingsBtn.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
    settingsModal.querySelector('.modal-content').classList.add('animate__animated', 'animate__fadeInDown');
    themeColorSettings.value = localStorage.getItem('themeColor') || '#1976d2';
    autoConnectSwitch.checked = localStorage.getItem('autoConnect') === 'true';
  });
  closeSettingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('hidden');
    settingsModal.querySelector('.modal-content').classList.remove('animate__animated', 'animate__fadeInDown');
  });

  // Otomatik bağlanma anahtarı
  autoConnectSwitch.addEventListener('change', function() {
    localStorage.setItem('autoConnect', this.checked ? 'true' : 'false');
  });

  // Sayfa yüklenince localStorage'dan dili uygula
  const savedLang = localStorage.getItem('lang') || 'tr';
  langSelect.value = savedLang;
  setLang(savedLang);

  langSelect.addEventListener('change', function() {
    setLang(this.value);
    localStorage.setItem('lang', this.value);
  });

  function setLang(lang) {
    document.querySelectorAll('[data-tr]').forEach(el => {
      el.textContent = el.getAttribute('data-' + lang);
    });
  }
});

// Basit toast fonksiyonu
function showToast(msg) {
  const toast = document.createElement('div');
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '30px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = '#1976d2';
  toast.style.color = '#fff';
  toast.style.padding = '12px 24px';
  toast.style.borderRadius = '8px';
  toast.style.zIndex = 9999;
  toast.classList.add('animate__animated', 'animate__fadeInUp');
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}