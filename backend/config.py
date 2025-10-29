# -----------------------------------------------------------------------------
# Deskripsi: Modul ini menyimpan semua konstanta konfigurasi global yang 
#            digunakan di seluruh aplikasi backend, seperti kredensial MQTT, 
#            token Telegram, dan nama file.
# -----------------------------------------------------------------------------

# --- Konfigurasi File Lokal ---
CSV_FILE = "data.csv" # CSV untuk menyimpan data sensor

# --- Konfigurasi Telegram Bot ---
TELEGRAM_TOKEN = "8225694717:AAFy7IzwVEbzqCzOM4WmIGMGT239FIbIc1A"
CHAT_ID = "-4627709856"
TELEGRAM_COOLDOWN_SECONDS = 300 # Cooldown mengirim notifikasi (dalam detik)

# --- Konfigurasi Broker MQTT ---
BROKER = "broker.hivemq.com"
PORT = 8883
USERNAME = ""
PASSWORD = ""
DHT_TOPIC = "sic/dibimbing/FuntasticFour/Reqi/pub/dht" # Topik untuk menerima data sensor DHT
BUZZER_TOPIC = "sic/dibimbing/FuntasticFour/Reqi/cmd/led" # Topik untuk mengirim perintah Buzzer