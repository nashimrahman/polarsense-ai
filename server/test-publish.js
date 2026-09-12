#!/usr/bin/env node
/**
 * test-publish.js — Local test MQTT publisher for PolarSense AI
 *
 * Simulates an ESP32 sending telemetry to HiveMQ so you can verify the
 * full pipeline (MQTT → backend → PostgreSQL → Socket.IO → frontend)
 * WITHOUT needing the physical ESP32 to have a working TLS connection.
 *
 * Usage:
 *   node test-publish.js            # publish every 5s indefinitely
 *   node test-publish.js --once     # publish a single message then exit
 *   node test-publish.js --count 3  # publish 3 messages then exit
 *
 * The script reads the same server/.env as the backend, so credentials
 * and topic are automatically in sync.
 *
 * NOTE: This is a HACKATHON/DEVELOPMENT tool only.
 *       Do NOT use in production. Do NOT commit real secrets.
 */

import 'dotenv/config'
import mqtt from 'mqtt'

// ── Config ────────────────────────────────────────────────────────────────
const HOST     = process.env.MQTT_HOST     || 'localhost'
const PORT     = Number(process.env.MQTT_PORT || 8883)
const USERNAME = process.env.MQTT_USERNAME || ''
const PASSWORD = process.env.MQTT_PASSWORD || ''
const TOPIC    = process.env.MQTT_TELEMETRY_TOPIC || 'polarsenseai/buoy/telemetry'

const INTERVAL_MS  = 5_000   // how often to publish (ms)
const BUOY_ID      = 'POLAR-001'

// ── CLI args ──────────────────────────────────────────────────────────────
const args    = process.argv.slice(2)
const once    = args.includes('--once')
const countIdx = args.indexOf('--count')
const maxCount = countIdx !== -1 ? Number(args[countIdx + 1]) : (once ? 1 : Infinity)

// ── Payload generator ─────────────────────────────────────────────────────
let count = 0

function makePayload() {
  count++
  // Gently walk values so the dashboard shows realistic change over time.
  const t = Date.now() / 1000
  return {
    buoy_id:                  BUOY_ID,
    temperature_c:            Number((-1.5 + Math.sin(t / 60) * 0.8).toFixed(2)),
    air_temperature_c:        Number((-0.8 + Math.cos(t / 90) * 1.2).toFixed(2)),
    humidity_percent:         Number((72 + Math.sin(t / 120) * 8).toFixed(1)),
    pressure_hpa:             Number((1013 + Math.cos(t / 180) * 15).toFixed(1)),
    wind_speed_ms:            Number((8 + Math.abs(Math.sin(t / 40)) * 6).toFixed(2)),
    wave_height_m:            Number((1.5 + Math.sin(t / 70) * 0.6).toFixed(2)),
    salinity_psu:             Number((34.2 + Math.cos(t / 200) * 0.5).toFixed(2)),
    ice_concentration_percent:Number((55 + Math.sin(t / 300) * 10).toFixed(1)),
    current_speed_ms:         Number((0.7 + Math.cos(t / 100) * 0.2).toFixed(2)),
    battery_percent:          Number((95 - count * 0.01).toFixed(1)),
    latitude:                 Number((-59.999 + Math.sin(t / 500) * 0.001).toFixed(6)),
    longitude:                Number((20.0005 + Math.cos(t / 500) * 0.001).toFixed(6)),
    accel_x_g:                0.01,
    accel_y_g:                0.00,
    accel_z_g:                1.00,
    gyro_x_dps:               0.00,
    gyro_y_dps:               0.00,
    gyro_z_dps:               0.00,
    mode:                     'NORMAL',
  }
}

// ── Connect & publish ─────────────────────────────────────────────────────
const url = `mqtts://${HOST}:${PORT}`
console.log(`[test-publish] Connecting to ${url} as ${USERNAME}`)
console.log(`[test-publish] Topic: ${TOPIC}`)
console.log(`[test-publish] Mode: ${isFinite(maxCount) ? `${maxCount} message(s)` : 'continuous'}`)

const client = mqtt.connect(url, {
  username:        USERNAME,
  password:        PASSWORD,
  reconnectPeriod: 0,         // don't auto-reconnect — fail fast
  connectTimeout:  10_000,
  clientId:        `polarsense-test-${Date.now()}`,
})

function publish() {
  const payload = makePayload()
  const json    = JSON.stringify(payload)
  client.publish(TOPIC, json, { qos: 1 }, (err) => {
    if (err) {
      console.error('[test-publish] Publish failed:', err.message)
    } else {
      console.log(`[test-publish] #${count} Published ${BUOY_ID} | temp=${payload.temperature_c}°C | battery=${payload.battery_percent}%`)
    }
    if (count >= maxCount) {
      console.log('[test-publish] Done. Disconnecting.')
      client.end()
      process.exit(0)
    }
  })
}

client.on('connect', () => {
  console.log('[test-publish] ✅ Connected to MQTT broker')
  publish() // publish immediately on connect
  if (!isFinite(maxCount) || maxCount > 1) {
    setInterval(publish, INTERVAL_MS)
  }
})

client.on('error', (err) => {
  console.error('[test-publish] ❌ MQTT error:', err.message)
  client.end()
  process.exit(1)
})

client.on('close', () => {
  if (count < maxCount) {
    console.error('[test-publish] Connection closed before finishing.')
    process.exit(1)
  }
})
