# -----------------------------------------------------------------------------
# Deskripsi: Modul ini menangani semua operasi pembacaan dan penulisan 
#            data sensor ke file CSV lokal (persisten).
# -----------------------------------------------------------------------------

import csv, os
from datetime import datetime
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

def get_latest() -> Dict[str, Any]:
    """Mengambil baris data sensor terbaru dari CSV."""
    with open(CSV_FILE, "r") as f:
        rows = list(csv.DictReader(f))
        
    return rows[-1] if rows else {}

def get_history(limit: int = 30) -> List[Dict[str, Any]]:
    """Mengambil riwayat data sebanyak 'limit' baris terakhir dari CSV."""
    with open(CSV_FILE, "r") as f:
        rows = list(csv.DictReader(f))
        
    return rows[-limit:]
