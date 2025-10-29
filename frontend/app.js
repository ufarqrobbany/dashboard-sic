// --- 1. Konfigurasi Koneksi MQTT ---
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt"; // port 8884 = WebSocket Secure
const options = {
  username: "",   // kosong karena broker publik
  password: "",   // kosong juga
  keepalive: 60,
  reconnectPeriod: 2000
};
const topic = "sic/dibimbing/FuntasticFour/Reqi/pub/dht";

// URL API Backend (yang berjalan di port 8000)
const apiUrl = "http://127.0.0.1:8000/api/history";

// --- 2. Inisialisasi Elemen DOM ---
const tempEl = document.getElementById("temp");
const humEl = document.getElementById("hum");
const statusEl = document.getElementById("status");

/**
 * Memperbarui tampilan status berdasarkan nilai kelembapan.
 * @param {number} h - Nilai kelembapan.
 */
function setStatus(h) {
  if (h < 55) {
    statusEl.className = "status ok";
    statusEl.textContent = "✅ Aman";
  } else if (h < 65) {
    statusEl.className = "status warn";
    statusEl.textContent = "⚠️ Waspada";
  } else {
    statusEl.className = "status danger";
    statusEl.textContent = "🚨 Bahaya!";
  }
}

// --- 3. Inisialisasi Chart.js ---

// Fungsi bantuan untuk membuat Opsi Chart
const getChartOptions = (title) => ({
  responsive: true,
  scales: { 
    y: { 
      beginAtZero: false, // Biarkan skala otomatis
      title: {
          display: true,
          text: title
      }
    },
    x: {
      title: {
          display: true,
          text: 'Waktu'
      }
    }
  },
  plugins: { 
    legend: { display: false }, // Sembunyikan legenda, sudah jelas dari judul
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  animation: {
    duration: 300 // Animasi update lebih cepat
  }
});

// Buat Chart 1 (Suhu)
const tempCtx = document.getElementById("tempChart").getContext("2d");
const tempChart = new Chart(tempCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Suhu",
        data: [],
        borderColor: "#2563eb",
        fill: true,
        backgroundColor: "rgba(37,99,235,.1)",
        tension: 0.1
      }
    ]
  },
  options: getChartOptions("Suhu (°C)")
});

// Buat Chart 2 (Kelembapan)
const humCtx = document.getElementById("humChart").getContext("2d");
const humChart = new Chart(humCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Kelembapan",
        data: [],
        borderColor: "#10b981",
        fill: true,
        backgroundColor: "rgba(16,185,129,.1)",
        tension: 0.1
      }
    ]
  },
  options: getChartOptions("Kelembapan (%)")
});

// --- 4. Memuat data historis dari API ---
/**
 * Mengambil data riwayat dari API backend untuk mengisi chart saat 
 * halaman pertama kali dimuat.
 */
async function loadInitialData() {
  try {
    // Panggil API backend
    const response = await fetch(apiUrl);
    if (!response.ok) {
      statusEl.textContent = "Gagal memuat history";
      statusEl.className = "status warn";
      console.error("Gagal mengambil data history:", response.statusText);
      return;
    }
    
    const historyData = await response.json();
    if (!historyData || historyData.length === 0) {
      console.log("Data history masih kosong.");
      return;
    }

    // Siapkan data untuk chart
    const labels = [];
    const temps = [];
    const hums = [];

    historyData.forEach(row => {
      // Ekstrak hanya WAKTU dari timestamp (mis: "2025-10-28 12:46:07" -> "12:46:07")
      // Kita asumsikan data di CSV sudah dalam format yang bisa diparsing
      const time = new Date(row.timestamp).toLocaleTimeString(); 
      labels.push(time);
      temps.push(parseFloat(row.temperature)); // Pastikan datanya float
      hums.push(parseFloat(row.humidity));
    });

    // Masukkan data history ke Chart
    chart.data.labels = labels;
    chart.data.datasets[0].data = temps;
    chart.data.datasets[1].data = hums;
    
    // Perbarui metrik dan status dengan data TERAKHIR dari history
    const latestData = historyData[historyData.length - 1];
    if (latestData) {
        const latestTemp = parseFloat(latestData.temperature);
        const latestHum = parseFloat(latestData.humidity);
        
        tempEl.textContent = latestTemp.toFixed(1);
        humEl.textContent = latestHum.toFixed(1);
        setStatus(latestHum);
    }

    chart.update(); // Tampilkan data di chart

  } catch (e) {
    console.error("Error saat load initial data:", e);
    statusEl.className = "status warn";
    statusEl.textContent = "Gagal terhubung ke API backend";
  }
}

// --- 5. Logika MQTT ---
const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  client.subscribe(topic);
});

client.on("message", (t, msg) => {
  try {
    const data = JSON.parse(msg.toString());
    const now = new Date().toLocaleTimeString();

    // Perbarui Teks Metrik
    tempEl.textContent = data.temperature.toFixed(1);
    humEl.textContent = data.humidity.toFixed(1);
    
    // Perbarui Status
    setStatus(data.humidity);

    // Tambahkan data ke Chart
    chart.data.labels.push(now);
    chart.data.datasets[0].data.push(data.temperature);
    chart.data.datasets[1].data.push(data.humidity);

    // Batasi data chart (hanya tampilkan 30 data terakhir)
    if (chart.data.labels.length > 30) {
      chart.data.labels.shift();
      chart.data.datasets[0].data.shift();
      chart.data.datasets[1].data.shift();
    }
    chart.update();

  } catch (e) {
    console.error("Gagal memproses pesan MQTT:", e);
  }
});

loadInitialData();