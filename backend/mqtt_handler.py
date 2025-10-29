# -----------------------------------------------------------------------------
# Deskripsi: Modul ini mengelola koneksi dengan broker MQTT. Fungsinya meliputi 
#            menerima data sensor, memprosesnya, menyimpan ke storage, dan 
#            memicu sistem peringatan (Telegram & Buzzer) jika kondisi terlampaui.
# -----------------------------------------------------------------------------

import json, threading, time
import paho.mqtt.client as mqtt
import ssl, certifi
from typing import Any
from config import (
    BROKER, PORT, USERNAME, PASSWORD, DHT_TOPIC, BUZZER_TOPIC, TELEGRAM_COOLDOWN_SECONDS
)
from storage import save_data
from telegram_notifier import send_telegram

# --- Variabel Global Status ---
buzzer_state: bool = False  # Status Buzzer: False=OFF, True=ON
last_telegram_time: float = 0.0 # Waktu terakhir notifikasi Telegram dikirim

HUMIDITY_ALERT_THRESHOLD = 80 # Ambang batas kelembaban (%) untuk ALERT

def on_message(client: mqtt.Client, userdata: Any, msg: mqtt.MQTTMessage) -> None:
    """Handler saat pesan MQTT diterima. Memproses, menyimpan, dan mengecek alert."""
    global buzzer_state
    global last_telegram_time
    
    try:
        # 1. Parsing dan Validasi data
        data = json.loads(msg.payload.decode())
        temp = data.get("temperature")
        hum = data.get("humidity")

        if temp is None or hum is None:
             print("Peringatan: Data sensor tidak lengkap.")
             return
        
        # 2. Menyimpan data
        ts = save_data(temp, hum)
        print(f"[{ts}] Data diterima: T={temp}°C | H={hum}%")

        # 3. Logika ALERT
        if hum > HUMIDITY_ALERT_THRESHOLD:
            current_time = time.time()
            cooldown_period = TELEGRAM_COOLDOWN_SECONDS
            
            # Cek Cooldown Telegram
            if current_time - last_telegram_time > cooldown_period:
                send_telegram(f"🚨 ALERT: Kelembaban tinggi terdeteksi: {hum}% pada {ts}.")
                last_telegram_time = current_time
            else:
                cooldown_remaining = cooldown_period - (current_time - last_telegram_time)
                print(f"[{ts}] Notifikasi Telegram dilewati. Sisa cooldown: {cooldown_remaining:.0f} detik.")
            
            # Kontrol Buzzer: NYALAKAN jika belum ON
            if not buzzer_state:
                client.publish(BUZZER_TOPIC, "on", qos=1)
                print(f"[{ts}] Buzzer ON: Publikasi 'on' ke topik {BUZZER_TOPIC}")
                buzzer_state = True
                
        # Kontrol Buzzer: MATIKAN jika sudah ON dan kondisi normal
        elif hum <= HUMIDITY_ALERT_THRESHOLD and buzzer_state:
            client.publish(BUZZER_TOPIC, "off", qos=1)
            print(f"[{ts}] Buzzer OFF: Publikasi 'off' ke topik {BUZZER_TOPIC}")
            buzzer_state = False
            
    except json.JSONDecodeError:
        print(f"Error parsing JSON: {msg.payload.decode()}")
    except Exception as e:
        print(f"Error memproses pesan MQTT: {e}")


def mqtt_loop() -> None:
    """Menginisialisasi koneksi dan menjalankan loop MQTT selamanya."""
    client = mqtt.Client()
    
    # Konfigurasi koneksi aman (TLS/SSL)
    client.username_pw_set(USERNAME, PASSWORD)
    client.tls_set(ca_certs=certifi.where(), tls_version=ssl.PROTOCOL_TLSv1_2)
    
    # Hubungkan, Subscribe, dan atur handler
    client.connect(BROKER, PORT)
    client.subscribe(DHT_TOPIC)
    client.on_message = on_message
    
    client.loop_forever()


def start_mqtt_thread() -> None:
    """Memulai loop MQTT dalam thread terpisah (daemon)."""
    print("Memulai thread MQTT...")
    threading.Thread(target=mqtt_loop, daemon=True).start()