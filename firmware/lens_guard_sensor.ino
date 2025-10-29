/*
    {Program untuk membaca data dari sensor DHT11 dan mengirimkannya ke broker MQTT.
     Selain itu, program ini juga dapat menerima perintah dari broker MQTT untuk
     mengendalikan LED bawaan pada ESP32.}
    Author      : FuntasticFour Team
    Institution : Politeknik Negeri Bandung
    Date        : 23 Oktober 2025
*/

#include <WiFi.h>
#include <PubSubClient.h>
#include "DHT.h"

// === Konfigurasi Pin ===
#define DHTPIN 4        // Pin data DHT11
#define DHTTYPE DHT11   // Jenis sensor DHT
#define LED_PIN 2       // LED bawaan ESP32
#define BUZZER_PIN 13   // Pin Buzzer

// === Konfigurasi Ambang Batas (Threshold) ===
#define HUMIDITY_THRESHOLD_MAX 65.0 // Peringatan jika Kelembaban > 65%
#define TEMP_THRESHOLD_MAX 30.0     // Peringatan jika Suhu > 30°C

// === Inisialisasi DHT ===
DHT dht(DHTPIN, DHTTYPE);

// === Konfigurasi WiFi ===
const char* ssid = "bismillaah_dulu";
const char* password = "bismillaah";

// === Konfigurasi MQTT ===
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_topic = "sic/dibimbing/FuntasticFour/Reqi/pub/dht";
const char* mqtt_topic_sub = "sic/dibimbing/FuntasticFour/Reqi/cmd/led";
String clientId = "FuntasticFour_Permanent_Client";

// === Objek MQTT & WiFi ===
WiFiClient espClient;
PubSubClient client(espClient);

// Variabel global untuk status alarm
bool alarmActive = false;

// ----------------------------
// FUNGSI: Koneksi ke WiFi
// ----------------------------
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Menghubungkan ke WiFi: ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

// ----------------------------
// FUNGSI: Callback MQTT (Kontrol Manual)
// ----------------------------
void callback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  message.trim();

  Serial.print("\nPesan diterima dari ");
  Serial.print(topic);
  Serial.print(": ");
  Serial.println(message);

  // Kontrol manual ini menimpa status alarm
  if (message.equalsIgnoreCase("ON")) {
    digitalWrite(LED_PIN, HIGH);  // Asumsi HIGH = ON
    digitalWrite(BUZZER_PIN, HIGH); // Asumsi HIGH = ON
    Serial.println("LED/Buzzer ON (Manual)");
  } 
  else if (message.equalsIgnoreCase("OFF")) {
    digitalWrite(LED_PIN, LOW); // Asumsi LOW = OFF
    digitalWrite(BUZZER_PIN, LOW); // Asumsi LOW = OFF
    Serial.println("LED/Buzzer OFF (Manual)");
  }
}

// ----------------------------
// FUNGSI: Reconnect MQTT
// ----------------------------
void reconnect() {
  while (!client.connected()) {
    Serial.print("Menghubungkan ke broker MQTT...");
    if (client.connect(clientId.c_str())) {
      Serial.println("Terhubung!");
      client.subscribe(mqtt_topic_sub);
      Serial.print("📡 Berlangganan ke topik: ");
      Serial.println(mqtt_topic_sub);
    } else {
      Serial.print("Gagal, rc=");
      Serial.print(client.state());
      Serial.println(" | Coba lagi dalam 5 detik...");
      delay(5000);
    }
  }
}

// ----------------------------
// SETUP
// ----------------------------
void setup() {
  Serial.begin(115200);
  dht.begin();
  
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Set kondisi awal (Aktuator OFF)
  digitalWrite(BUZZER_PIN, LOW); 
  digitalWrite(LED_PIN, LOW);

  Serial.println("Menghubungkan ke WiFi...");
  setup_wifi();
  
  Serial.println("WiFi Terhubung!");
  Serial.println(WiFi.localIP());

  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

// ----------------------------
// LOOP
// ----------------------------
long lastMsg = 0;

void loop() {
    if (!client.connected()) {
        reconnect();
    }
    client.loop(); // Panggil ini sesering mungkin!

    long now = millis();
    if (now - lastMsg > 2000) { // Cek apakah sudah 2 detik berlalu
        lastMsg = now;

        float h = dht.readHumidity();
        float t = dht.readTemperature();

        if (isnan(h) || isnan(t)) {
            Serial.println("Gagal membaca data dari DHT sensor!");
            return;
        }

        // === LOGIKA ALARM LOKAL ===
        if (t > TEMP_THRESHOLD_MAX || h > HUMIDITY_THRESHOLD_MAX) {
          alarmActive = true;
          digitalWrite(BUZZER_PIN, HIGH); // Nyalakan Buzzer
          digitalWrite(LED_PIN, HIGH);    // Nyalakan LED
        } else {
          alarmActive = false;
          digitalWrite(BUZZER_PIN, LOW);  // Matikan Buzzer
          digitalWrite(LED_PIN, LOW);     // Matikan LED
        }

        // === Kirim Data ke MQTT ===
        char msg[50];
        sprintf(msg, "{\"temperature\": %.2f, \"humidity\": %.2f}", t, h);
        
        client.publish(mqtt_topic, msg);
        Serial.print("Data terkirim ke MQTT: ");
        Serial.println(msg);
    }
}