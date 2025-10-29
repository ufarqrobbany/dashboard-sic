# -----------------------------------------------------------------------------
# Deskripsi: Modul ini menangani semua operasi pembacaan dan penulisan 
#            data sensor ke file CSV lokal (persisten).
# -----------------------------------------------------------------------------

import csv, os
from datetime import datetime, timedelta
from typing import Dict, List, Any
from config import CSV_FILE

CSV_HEADERS = ["timestamp", "temperature", "humidity"]

# Inisialisasi file CSV jika belum ada
if not os.path.exists(CSV_FILE):
    with open(CSV_FILE, "w", newline="") as f:
        csv.writer(f).writerow(CSV_HEADERS)

def save_data(temp: float, hum: float) -> str:
    """Menyimpan data suhu dan kelembaban ke CSV, mengembalikan timestamp."""
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    with open(CSV_FILE, "a", newline="") as f:
        csv.writer(f).writerow([ts, temp, hum])
        
    return ts

def get_history() -> List[Dict[str, Any]]:
    """Mengambil riwayat data sebanyak 3 hari terakhir dari CSV."""
    
    # Tentukan batas waktu (3 hari yang lalu)
    three_days_ago = datetime.now() - timedelta(days=3)
    history_data = []

    with open(CSV_FILE, "r") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # Konversi timestamp di CSV ke objek datetime
                row_time = datetime.strptime(row["timestamp"], "%Y-%m-%d %H:%M:%S")
                
                # Hanya ambil data jika lebih baru dari 3 hari yang lalu
                if row_time > three_days_ago:
                    history_data.append(row)
            except (ValueError, TypeError):
                # Lewati baris jika format timestamp salah
                continue
                
    return history_data
