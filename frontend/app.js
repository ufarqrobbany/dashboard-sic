// --- 1. Konfigurasi Koneksi MQTT ---
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt"; // port 8884 = WebSocket Secure
const options = {
  username: "",   // kosong karena broker publik
  password: "",   // kosong juga
  keepalive: 60,
  reconnectPeriod: 2000
};
const topic = "sic/dibimbing/FuntasticFour/Reqi/pub/dht";

// --- 2. Inisialisasi Elemen DOM ---
const tempEl = document.getElementById("temp");
const humEl = document.getElementById("hum");
const statusEl = document.getElementById("status"); // Status Umum
const statusHumEl = document.getElementById("status-hum"); // Status Kelembapan

/**
 * Memperbarui tampilan status berdasarkan nilai kelembapan.
 * @param {number} h - Nilai kelembapan.
 */
function setStatus(h) {
  let statusClass = "ok";
  let statusText = "✅ Aman";

  if (h >= 60) {
    statusClass = "danger";
    statusText = "🚨 Bahaya!";
  } else if (h > 50) {
    statusClass = "warn";
    statusText = "⚠️ Waspada";
  }
  
  // Update Status Kelembapan (di dalam kartu)
  if (statusHumEl) {
      statusHumEl.className = "status-hum " + statusClass;
      statusHumEl.textContent = statusText;
      statusHumEl.style.display = 'block'; // Tampilkan elemen status-hum
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
    legend: { display: false },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  },
  animation: {
    duration: 300 
  }
});

// Buat Chart 1 (Suhu)
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
  options: { 
    responsive: true,
    scales: { 
      y: { 
        beginAtZero: true, // DIUBAH: Sumbu Y Suhu mulai dari 0
        title: {
            display: true,
            text: "Suhu (°C)"
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
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    animation: {
      duration: 300 
    }
  }
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
  options: {
    responsive: true,
    scales: { 
      y: { 
        min: 0,     // DIUBAH: Sumbu Y Kelembapan minimal 0
        max: 100,   // DIUBAH: Sumbu Y Kelembapan maksimal 100
        title: {
            display: true,
            text: "Kelembapan (%)"
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
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    animation: {
      duration: 300 
    }
  }
});

// --- 5. Logika MQTT ---
const client = mqtt.connect(brokerUrl, options);

client.on("connect", () => {
  console.log("Connected to HiveMQ Cloud");
  client.subscribe(topic);
});

client.on("message", (t, msg) => {
  try {
    // Jika data MQTT masuk, sembunyikan status umum (jika belum tersembunyi)
    if (statusEl) {
        statusEl.style.display = 'none';
    }
      
    const data = JSON.parse(msg.toString());
    const now = new Date().toLocaleTimeString();

    // Perbarui Teks Metrik
    tempEl.textContent = data.temperature.toFixed(1);
    humEl.textContent = data.humidity.toFixed(1);
    
    // Perbarui Status (Ini akan menampilkan/memperbarui status-hum)
    setStatus(data.humidity);

    // Tambahkan data ke Chart Suhu
    tempChart.data.labels.push(now);
    tempChart.data.datasets[0].data.push(data.temperature);
    // Tambahkan data ke Chart Kelembapan
    humChart.data.labels.push(now);
    humChart.data.datasets[0].data.push(data.humidity);

    // Batasi data chart (hanya tampilkan 30 data terakhir)
    if (tempChart.data.labels.length > 30) {
      tempChart.data.labels.shift();
      tempChart.data.datasets[0].data.shift();
      humChart.data.labels.shift();
      humChart.data.datasets[0].data.shift();
    }
    tempChart.update();
    humChart.update();

  } catch (e) {
    console.error("Gagal memproses pesan MQTT:", e);
  }
});

