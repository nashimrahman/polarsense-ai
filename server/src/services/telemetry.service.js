import { pool } from '../database/pool.js'

export async function insertTelemetry(d) {
  const extra = {
    accel: { x: d.accel_x_g, y: d.accel_y_g, z: d.accel_z_g },
    gyro: { x: d.gyro_x_dps, y: d.gyro_y_dps, z: d.gyro_z_dps },
    // Autonomous system fields — no DB columns, stored here so RETURNING * carries them through Socket.IO
    sampling:    d.sampling    ?? null,
    energy_mode: d.energy_mode ?? null,
    risk:        d.risk        ?? null,
  }
  const { rows } = await pool.query(
    `INSERT INTO telemetry
      (buoy_id, temperature_c, air_temperature_c, humidity_percent, pressure_hpa,
       wind_speed_ms, wave_height_m, salinity_psu, ice_concentration_pct,
       current_speed_ms, battery_percent, latitude, longitude, mode, extra)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     RETURNING *`,
    [
      d.buoy_id, d.temperature_c, d.air_temperature_c, d.humidity_percent, d.pressure_hpa,
      d.wind_speed_ms, d.wave_height_m, d.salinity_psu, d.ice_concentration_percent,
      d.current_speed_ms, d.battery_percent, d.latitude, d.longitude, d.mode, extra,
    ]
  )
  return rows[0]
}

export async function getLatest(buoyId = 'POLAR-001') {
  const { rows } = await pool.query(
    `SELECT * FROM telemetry WHERE buoy_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [buoyId]
  )
  return rows[0] ?? null
}

export async function getHistory({ buoyId = 'POLAR-001', startDate, endDate, limit = 200 }) {
  const clauses = ['buoy_id = $1']
  const params = [buoyId]
  if (startDate) { params.push(startDate); clauses.push(`created_at >= $${params.length}`) }
  if (endDate)   { params.push(endDate);   clauses.push(`created_at <= $${params.length}`) }
  params.push(Math.min(Number(limit) || 200, 2000))
  const { rows } = await pool.query(
    `SELECT * FROM telemetry WHERE ${clauses.join(' AND ')}
     ORDER BY created_at DESC LIMIT $${params.length}`,
    params
  )
  return rows
}

export async function getStats(buoyId = 'POLAR-001') {
  const { rows } = await pool.query(
    `SELECT
       AVG(temperature_c) AS avg_temperature_c,
       AVG(humidity_percent) AS avg_humidity_percent,
       AVG(pressure_hpa) AS avg_pressure_hpa,
       (SELECT battery_percent FROM telemetry WHERE buoy_id = $1 ORDER BY created_at DESC LIMIT 1) AS latest_battery_percent
     FROM telemetry WHERE buoy_id = $1`,
    [buoyId]
  )
  return rows[0]
}

/**
 * Export all telemetry rows for a buoy within an optional date range.
 * No row cap — returns every matching record, ordered oldest-first.
 * Uses fully parameterized queries; no raw user input in SQL.
 *
 * @param {Object} opts
 * @param {string} opts.buoyId   - The DB-level buoy ID (e.g. 'POLAR-001')
 * @param {string} [opts.from]   - ISO date string for range start (inclusive)
 * @param {string} [opts.to]     - ISO date string for range end (inclusive, end of day)
 * @returns {Promise<Array>}     - Raw DB rows
 */
export async function exportTelemetry({ buoyId, from, to }) {
  const clauses = ['buoy_id = $1']
  const params = [buoyId]

  if (from) {
    params.push(from)
    clauses.push(`created_at >= $${params.length}`)
  }
  if (to) {
    // Include the full "to" day by pushing the start of the next day
    const endOfDay = new Date(to)
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1)
    params.push(endOfDay.toISOString())
    clauses.push(`created_at < $${params.length}`)
  }

  const { rows } = await pool.query(
    `SELECT * FROM telemetry WHERE ${clauses.join(' AND ')} ORDER BY created_at ASC`,
    params
  )
  return rows
}