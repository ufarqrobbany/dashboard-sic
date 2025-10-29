# -----------------------------------------------------------------------------
# Deskripsi: Modul ini menyimpan semua konstanta konfigurasi global yang 
#            digunakan di seluruh aplikasi backend, seperti kredensial MQTT, 
#            token Telegram, dan nama file.
# -----------------------------------------------------------------------------

# --- Konfigurasi File Lokal ---
CSV_FILE = "data.csv" # CSV untuk menyimpan data sensor

# --- Konfigurasi Telegram Bot ---
TELEGRAM_TOKEN = ""
CHAT_ID = ""
TELEGRAM_COOLDOWN_SECONDS = 300 # Cooldown mengirim notifikasi (dalam detik)

# --- Konfigurasi Broker MQTT ---
BROKER = "broker.hivemq.com"
PORT = 8883
USERNAME = ""
PASSWORD = ""
DHT_TOPIC = "" # Topik untuk menerima data sensor DHT
BUZZER_TOPIC = "" # Topik untuk mengirim perintah Buzzer

