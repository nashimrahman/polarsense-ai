CREATE TABLE IF NOT EXISTS telemetry (
  id                    BIGSERIAL PRIMARY KEY,
  buoy_id               TEXT NOT NULL,
  temperature_c         DOUBLE PRECISION,
  air_temperature_c     DOUBLE PRECISION,
  humidity_percent      DOUBLE PRECISION,
  pressure_hpa          DOUBLE PRECISION,
  wind_speed_ms         DOUBLE PRECISION,
  wave_height_m         DOUBLE PRECISION,
  salinity_psu          DOUBLE PRECISION,
  ice_concentration_pct DOUBLE PRECISION,
  current_speed_ms      DOUBLE PRECISION,
  battery_percent       DOUBLE PRECISION,
  latitude              DOUBLE PRECISION,
  longitude             DOUBLE PRECISION,
  mode                  TEXT,
  extra                 JSONB DEFAULT '{}'::jsonb,  -- accel/gyro + anything unmapped
  device_timestamp      TIMESTAMPTZ,                -- null: ESP32 payload sends none today
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_telemetry_buoy_created
  ON telemetry (buoy_id, created_at DESC);