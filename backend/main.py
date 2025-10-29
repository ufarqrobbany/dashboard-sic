# -----------------------------------------------------------------------------
# Deskripsi: Modul ini adalah inti dari aplikasi web (API Gateway) menggunakan 
#            FastAPI. Modul ini mendefinisikan endpoint API untuk mengambil 
#            data terbaru dan riwayat, serta memulai thread MQTT saat startup.
# -----------------------------------------------------------------------------

from fastapi import FastAPI
from typing import Dict, List, Any

from mqtt_handler import start_mqtt_thread
from storage import get_latest, get_history

app = FastAPI(
    title="Camera Monitor API",
    description="API untuk memonitor data suhu dan kelembaban storage kamera."
)

@app.on_event("startup")
def startup_event() -> None:
    """Handler yang dipanggil saat aplikasi dimulai. Memulai thread MQTT."""
    start_mqtt_thread()


@app.get("/api/latest", response_model=Dict[str, Any], summary="Data Sensor Terbaru")
def latest() -> Dict[str, Any]:
    """Mengambil data sensor (suhu dan kelembaban) yang paling baru."""
    return get_latest()


@app.get("/api/history", response_model=List[Dict[str, Any]], summary="Riwayat Data Sensor")
def history(limit: int = 30) -> List[Dict[str, Any]]:
    """Mengambil riwayat data sensor sebanyak 'limit' baris terakhir."""
    # Batasi nilai maksimum limit agar tidak membebani sistem
    if limit > 500:
        limit = 500
        
    return get_history(limit)