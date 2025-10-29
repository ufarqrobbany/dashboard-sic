# -----------------------------------------------------------------------------
# Deskripsi: Modul ini adalah inti dari aplikasi web (API Gateway) menggunakan 
#            FastAPI. Modul ini mendefinisikan endpoint API untuk mengambil 
#            data terbaru dan riwayat, serta memulai thread MQTT saat startup.
# -----------------------------------------------------------------------------

from fastapi import FastAPI
from typing import Dict, List, Any
from fastapi.middleware.cors import CORSMiddleware

from mqtt_handler import start_mqtt_thread
from storage import get_history

app = FastAPI(
    title="Lens Guard API",
    description="API untuk memonitor data suhu dan kelembaban storage kamera."
)

origins = ["*"] 

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True, 
    allow_methods=["*"], 
    allow_headers=["*"], 
)

@app.on_event("startup")
def startup_event() -> None:
    """Handler yang dipanggil saat aplikasi dimulai. Memulai thread MQTT."""
    start_mqtt_thread()

@app.get("/api/history", response_model=List[Dict[str, Any]], summary="Riwayat Data Sensor")
def history() -> List[Dict[str, Any]]:
    """Mengambil riwayat data sensor (maksimal 3 hari terakhir)."""
    return get_history()