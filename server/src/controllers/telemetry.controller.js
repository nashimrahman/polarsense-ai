import { getLatest, getHistory, getStats, exportTelemetry } from '../services/telemetry.service.js'

export async function health(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() })
}

export async function latest(req, res, next) {
  try {
    const row = await getLatest(req.query.buoyId)
    res.json(row)
  } catch (e) { next(e) }
}

export async function history(req, res, next) {
  try {
    const rows = await getHistory({
      buoyId: req.query.buoyId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit,
    })
    res.json(rows)
  } catch (e) { next(e) }
}

export async function stats(req, res, next) {
  try {
    res.json(await getStats(req.query.buoyId))
  } catch (e) { next(e) }
}

// ── Buoy ID mapping ────────────────────────────────────────────────────────
// The dashboard uses friendly IDs (PS-01). The DB stores POLAR-001.
// Only PS-01 is a real buoy. All others are offline placeholders.
const DASHBOARD_TO_DEVICE = {
  'PS-01': 'POLAR-001',
}
const ALLOWED_BUOYS = Object.keys(DASHBOARD_TO_DEVICE) // ['PS-01']
const ALLOWED_FORMATS = ['csv', 'json']

/**
 * GET /api/telemetry/export
 *
 * Query params:
 *   buoy_id  (string, default 'PS-01', whitelist: PS-01)
 *   from     (ISO date, optional)
 *   to       (ISO date, optional)
 *   format   (csv|json, default csv)
 *
 * Returns a downloadable file whose rows are real PostgreSQL records.
 * Returns 404 JSON when no rows match the range.
 */
export async function exportHandler(req, res, next) {
  try {
    // ── 1. Validate buoy_id ────────────────────────────────────────────────
    const dashboardBuoyId = (req.query.buoy_id || 'PS-01').toString().trim()
    if (!ALLOWED_BUOYS.includes(dashboardBuoyId)) {
      return res.status(400).json({
        error: `Invalid buoy_id. Allowed values: ${ALLOWED_BUOYS.join(', ')}`,
      })
    }
    const deviceBuoyId = DASHBOARD_TO_DEVICE[dashboardBuoyId]

    // ── 2. Validate date range ────────────────────────────────────────────
    const fromParam = req.query.from ? req.query.from.toString().trim() : null
    const toParam   = req.query.to   ? req.query.to.toString().trim()   : null

    if (fromParam && isNaN(Date.parse(fromParam))) {
      return res.status(400).json({ error: `Invalid "from" date: ${fromParam}` })
    }
    if (toParam && isNaN(Date.parse(toParam))) {
      return res.status(400).json({ error: `Invalid "to" date: ${toParam}` })
    }
    if (fromParam && toParam && new Date(fromParam) > new Date(toParam)) {
      return res.status(400).json({ error: '"from" must not be after "to"' })
    }

    // ── 3. Validate format ────────────────────────────────────────────────
    const format = ((req.query.format || 'csv').toString().trim()).toLowerCase()
    if (!ALLOWED_FORMATS.includes(format)) {
      return res.status(400).json({
        error: `Invalid format. Allowed values: ${ALLOWED_FORMATS.join(', ')}`,
      })
    }

    // ── 4. Query PostgreSQL ───────────────────────────────────────────────
    const rows = await exportTelemetry({
      buoyId: deviceBuoyId,
      from: fromParam,
      to: toParam,
    })

    // ── 5. Handle empty result ─────────────────────────────────────────────
    if (!rows.length) {
      return res.status(404).json({
        message: 'No telemetry data found for the selected period.',
      })
    }

    // ── 6. Build filename ──────────────────────────────────────────────────
    const dateSuffix = fromParam && toParam
      ? `${fromParam}_to_${toParam}`
      : fromParam
        ? `from_${fromParam}`
        : toParam
          ? `to_${toParam}`
          : 'all'
    const filename = `polarsense_${dashboardBuoyId}_telemetry_${dateSuffix}.${format}`

    // ── 7. Generate export ─────────────────────────────────────────────────
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
      const payload = {
        buoy_id: dashboardBuoyId,
        device_id: deviceBuoyId,
        from: fromParam,
        to: toParam,
        exported_at: new Date().toISOString(),
        record_count: rows.length,
        records: rows.map(flattenRow),
      }
      return res.json(payload)
    }

    // CSV (default)
    const CSV_COLUMNS = [
      'id', 'buoy_id', 'created_at', 'device_timestamp',
      'temperature_c', 'air_temperature_c', 'humidity_percent', 'pressure_hpa',
      'wind_speed_ms', 'wave_height_m', 'salinity_psu', 'ice_concentration_pct',
      'current_speed_ms', 'battery_percent', 'latitude', 'longitude', 'mode',
      'accel_x_g', 'accel_y_g', 'accel_z_g',
      'gyro_x_dps', 'gyro_y_dps', 'gyro_z_dps',
      'sampling', 'energy_mode', 'risk',
    ]

    const csvLines = [
      CSV_COLUMNS.join(','),
      ...rows.map((row) => {
        const flat = flattenRow(row)
        return CSV_COLUMNS.map((col) => csvCell(flat[col])).join(',')
      }),
    ]
    const csvContent = csvLines.join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(csvContent)

  } catch (e) {
    next(e)
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Flattens a raw telemetry DB row:
 * - Promotes accel/gyro/sampling/energy_mode/risk from extra JSONB into top-level keys.
 * - Keeps all existing scalar columns as-is.
 */
function flattenRow(row) {
  const extra = (row.extra && typeof row.extra === 'object') ? row.extra : {}
  const accel  = extra.accel  || {}
  const gyro   = extra.gyro   || {}
  return {
    id:                    row.id,
    buoy_id:               row.buoy_id,
    created_at:            row.created_at,
    device_timestamp:      row.device_timestamp ?? null,
    temperature_c:         row.temperature_c,
    air_temperature_c:     row.air_temperature_c,
    humidity_percent:      row.humidity_percent,
    pressure_hpa:          row.pressure_hpa,
    wind_speed_ms:         row.wind_speed_ms,
    wave_height_m:         row.wave_height_m,
    salinity_psu:          row.salinity_psu,
    ice_concentration_pct: row.ice_concentration_pct,
    current_speed_ms:      row.current_speed_ms,
    battery_percent:       row.battery_percent,
    latitude:              row.latitude,
    longitude:             row.longitude,
    mode:                  row.mode,
    accel_x_g:             accel.x ?? null,
    accel_y_g:             accel.y ?? null,
    accel_z_g:             accel.z ?? null,
    gyro_x_dps:            gyro.x  ?? null,
    gyro_y_dps:            gyro.y  ?? null,
    gyro_z_dps:            gyro.z  ?? null,
    sampling:              extra.sampling    ?? null,
    energy_mode:           extra.energy_mode ?? null,
    risk:                  extra.risk        ?? null,
  }
}

/**
 * Wraps a value for safe CSV inclusion:
 * - null/undefined → empty string
 * - numbers remain unquoted
 * - strings are quoted and internal quotes are escaped
 */
function csvCell(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}