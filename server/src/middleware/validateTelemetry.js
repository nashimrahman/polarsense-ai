// Validates against the REAL ESP32 payload shape (see sketch.ino publishTelemetry()).
// Every field is optional except buoy_id — the firmware could evolve, and we don't
// want to drop a whole reading because one accel field was momentarily missing.
export function validateTelemetryPayload(raw) {
  let data
  try {
    data = JSON.parse(raw.toString())
  } catch {
    return { valid: false, error: 'Invalid JSON' }
  }

  if (typeof data.buoy_id !== 'string' || !data.buoy_id) {
    return { valid: false, error: 'Missing buoy_id' }
  }

  const numFields = [
    'temperature_c', 'air_temperature_c', 'humidity_percent', 'pressure_hpa',
    'wind_speed_ms', 'wave_height_m', 'salinity_psu', 'ice_concentration_percent',
    'current_speed_ms', 'battery_percent', 'latitude', 'longitude',
    'accel_x_g', 'accel_y_g', 'accel_z_g', 'gyro_x_dps', 'gyro_y_dps', 'gyro_z_dps',
  ]
  for (const f of numFields) {
    if (data[f] !== undefined && typeof data[f] !== 'number') {
      return { valid: false, error: `Field ${f} is not numeric` }
    }
  }

  return { valid: true, data }
}