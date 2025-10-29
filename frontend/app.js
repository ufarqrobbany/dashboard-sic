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
const ctx = document.getElementById("chart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Suhu (°C)",
        data: [],
        borderColor: "#2563eb",
        fill: true,
        backgroundColor: "rgba(37,99,235,.1)"
      },
      {
        label: "Kelembapan (%)",
        data: [],
        borderColor: "#10b981",
        fill: true,
        backgroundColor: "rgba(16,185,129,.1)"
      }
    ]
  },
  options: {
    responsive: true,
    scales: { y: { beginAtZero: true } },
    plugins: { legend: { position: "bottom" } }
  }
});

// --- 4. Logika MQTT ---
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