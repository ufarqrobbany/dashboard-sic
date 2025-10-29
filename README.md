# 📸 Camera Storage Monitor Dashboard

## 1\. Deskripsi Proyek

**Camera Storage Monitor Dashboard** adalah dashboard untuk sistem pemantauan suhu (`Temperature`) dan kelembaban (`Humidity`) secara real-time. Proyek ini dirancang untuk memantau kondisi lingkungan, seperti tempat penyimpanan kamera, untuk mencegah kerusakan akibat kelembaban yang tidak ideal.

Sistem ini terdiri dari dua bagian utama:

1.  **Backend (Python/FastAPI):** Bertugas menerima data sensor melalui MQTT, menyimpannya ke file CSV, menyediakan API untuk riwayat data, dan mengirimkan notifikasi peringatan melalui Telegram jika kelembaban melebihi ambang batas.
2.  **Frontend (HTML/JS):** Sebuah dashboard web sederhana yang menampilkan data suhu dan kelembaban secara real-time, serta grafik riwayat singkat menggunakan Chart.js.

## 2\. Fitur Utama

  * **Dashboard Real-time:** Menampilkan metrik suhu dan kelembaban terbaru.
  * **Visualisasi Grafik:** Menggunakan Chart.js untuk menggambar grafik data sensor secara langsung di browser.
  * **Komunikasi MQTT:** Menggunakan broker MQTT (seperti HiveMQ) untuk komunikasi data yang efisien antara perangkat sensor, backend, dan frontend.
  * **Penyimpanan Data:** Data sensor secara persisten disimpan dalam file `data.csv`.
  * **API Peringatan (Alerting):** Backend akan secara otomatis:
      * Mengirim notifikasi ke **Telegram** jika kelembaban melebihi ambang batas (`HUMIDITY_ALERT_THRESHOLD`).
      * Menerbitkan perintah ke topik **Buzzer** (`BUZZER_TOPIC`) untuk menyalakan aktuator peringatan.
  * **API Gateway:** Menyediakan endpoint API (`/api/latest` dan `/api/history`) menggunakan FastAPI untuk mengambil data historis dari CSV.

## 3\. Arsitektur Sistem

1.  **Perangkat IoT:** Sebuah perangkat ESP32 membaca sensor DHT, memformatnya sebagai JSON (`{"temperature": 25.0, "humidity": 70.0}`), dan mengirimkannya ke `DHT_TOPIC` di broker MQTT.
2.  **Broker MQTT (HiveMQ):** Bertindak sebagai perantara pesan.
3.  **Backend (Python):**
      * Mendengarkan `DHT_TOPIC`.
      * Saat data diterima, `mqtt_handler.py` memanggil `storage.py`. **Timestamp ditambahkan oleh backend (server-side)** saat data diterima, lalu disimpan ke `data.csv`. [cite: `dashboard-sic/backend/storage.py`]
      * Jika data melebihi ambang batas, `mqtt_handler.py` memanggil `telegram_notifier.py` dan menerbitkan pesan ke `BUZZER_TOPIC`.
      * `main.py` menjalankan server API untuk melayani permintaan data.
4.  **Frontend (Browser):**
      * `app.js` terhubung ke broker MQTT (via WebSocket) dan mendengarkan `DHT_TOPIC`.
      * Data yang masuk langsung ditampilkan di `index.html`.

-----

## 4\. Instalasi dan Konfigurasi

### A. Backend (Python)

1.  **Navigasi ke Direktori:**

    ```bash
    cd lens-guard-dashboard/backend
    ```

2.  **Buat Virtual Environment (Direkomendasikan):**

    ```bash
    # Windows
    python -m venv venv
    venv\Scripts\activate

    # macOS / Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Instal Dependensi:**
    Pastikan Anda memiliki `requirements.txt` dan jalankan:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Konfigurasi Kredensial (SANGAT PENTING):**
    Buka file `backend/config.py` dan isi konstanta yang masih kosong:

    ```python
    # --- Konfigurasi File Lokal ---
    CSV_FILE = "data.csv" # Biarkan default jika tidak ingin diubah

    # --- Konfigurasi Telegram Bot ---
    # Dapatkan dari BotFather di Telegram
    TELEGRAM_TOKEN = "ISI_TOKEN_BOT_ANDA"
    # Dapatkan dari @userinfobot atau @myidbot di Telegram
    CHAT_ID = "ISI_CHAT_ID_TUJUAN_ANDA"
    TELEGRAM_COOLDOWN_SECONDS = 300

    # --- Konfigurasi Broker MQTT ---
    BROKER = "broker.hivemq.com" # Sudah terisi
    PORT = 8883 # Sudah terisi (SSL)
    USERNAME = "" # Kosongkan untuk broker publik
    PASSWORD = "" # Kosongkan untuk broker publik

    # TOPIK HARUS DIISI
    # Pastikan topik ini SAMA dengan yang digunakan perangkat IoT Anda
    DHT_TOPIC = "sic/dibimbing/FuntasticFour/Reqi/pub/dht" # Contoh, sesuaikan!
    BUZZER_TOPIC = "sic/dibimbing/FuntasticFour/Reqi/cmd/buzzer" # Contoh, sesuaikan!
    ```

### B. Frontend (Web Dashboard)

1.  **Konfigurasi Topik:**
    Buka file `frontend/app.js`.

2.  **Sesuaikan Topik MQTT:**
    Pastikan nilai `const topic` di `app.js` SAMA PERSIS dengan `DHT_TOPIC` yang Anda atur di `config.py`.

    ```javascript
    // --- 1. Konfigurasi Koneksi MQTT ---
    const brokerUrl = "wss://broker.hivemq.com:8884/mqtt"; // Sudah benar
    // ...
    // PASTIKAN TOPIK INI SAMA DENGAN 'DHT_TOPIC' DI config.py
    const topic = "sic/dibimbing/FuntasticFour/Reqi/pub/dht"; //
    ```

## 5\. Menjalankan Proyek

1.  **Jalankan Backend (Terminal 1):**
    Pastikan Anda berada di direktori `backend/` dan virtual environment (venv) Anda aktif. Jalankan server FastAPI menggunakan Uvicorn:

    ```bash
    uvicorn main:app --reload
    ```

      * Server API akan berjalan di `http://127.0.0.1:8000`.
      * Listener MQTT akan otomatis dimulai di latar belakang (didefinisikan di `main.py` @ `startup_event`).
      * Anda akan melihat log "Memulai thread MQTT..." di terminal Anda.

2.  **Jalankan Frontend (Terminal 2):**
    Buka terminal baru, pindah ke direktori frontend/, dan jalankan perintah berikut (kami menggunakan port 8001 agar tidak bentrok dengan backend):

    ```bash
    cd frontend
    python -m http.server 8001
    ```
    
      * Server frontend akan berjalan di http://localhost:8001.

4.  **Mulai Publikasi Data:**
    Nyalakan perangkat IoT Anda (atau gunakan simulator MQTT) untuk mulai mengirim data sensor ke `DHT_TOPIC` yang telah dikonfigurasi.

5.  **Verifikasi:**

      * Buka http://localhost:8001 di browser Anda. Anda akan melihat metrik dan grafik diperbarui secara real-time.
      * Periksa terminal backend, Anda akan melihat log data yang diterima (mis. `[2025-10-28 12:46:07] Data diterima: T=25.3°C | H=77.7%`).
      * Buka `http://127.0.0.1:8000/docs` untuk melihat dokumentasi API (Swagger UI).
  
---

## 6. Tim Pengembang

Proyek ini dikembangkan oleh Tim **FuntasticFour** dari **Politeknik Negeri Bandung**:

**Anggota:**
* Banteng Harisantoso
* Farrel Zandra
* Reqi Jumantara Hapid
* Umar Faruq Robbany

**Pembimbing:**
* Yudi Widhiyasana, S.Si., M.T.
