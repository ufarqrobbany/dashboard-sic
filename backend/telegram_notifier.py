# -----------------------------------------------------------------------------
# Deskripsi: Modul ini bertanggung jawab untuk mengirimkan notifikasi pesan 
#            teks ke Telegram melalui Telegram Bot API.
# -----------------------------------------------------------------------------

import requests
from requests.exceptions import RequestException
from config import TELEGRAM_TOKEN, CHAT_ID

def send_telegram(message: str):
    """Mengirim pesan notifikasi ke Telegram Bot."""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = {"chat_id": CHAT_ID, "text": message}
        requests.post(url, data=data, timeout=5) 
    except RequestException as e:
        print(f"Error Koneksi/Request Telegram: {e}")
    except Exception as e:
        print(f"Error tidak terduga saat mengirim Telegram: {e}")
