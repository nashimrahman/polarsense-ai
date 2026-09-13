/**
 * command.controller.js
 *
 * Handles buoy mode commands (NORMAL / STORM).
 *
 * Flow:
 *   POST /api/buoy/:buoyId/mode
 *       ↓ validate
 *       ↓ map dashboard ID → device ID
 *       ↓ publish MQTT to polarsenseai/buoy/command
 *       ↓ ESP32 receives command → changes sampling interval
 *       ↓ telemetry arrives at the new rate
 *       ↓ mode field in telemetry confirms the switch
 *
 * The mqttClient is injected via createCommandRouter() so this module
 * does NOT import it globally — the server creates it once and shares it.
 */

import { logger } from '../utils/logger.js'
import { env } from '../config/env.js'

// ── Allowed values ────────────────────────────────────────────────────────────

/** Dashboard buoy ID → device MQTT ID mapping */
const DASHBOARD_TO_DEVICE = {
  'PS-01': 'POLAR-001',
}

/** Modes the ESP32 understands */
const ALLOWED_MODES = ['NORMAL', 'STORM']

// ── Controller factory ────────────────────────────────────────────────────────

/**
 * Returns an Express request handler that publishes a mode-change command
 * to the MQTT broker for the target buoy.
 *
 * @param {import('mqtt').MqttClient} mqttClient - The shared MQTT client.
 */
export function createModeHandler(mqttClient) {
  /**
   * POST /api/buoy/:buoyId/mode
   *
   * Body: { "mode": "STORM" }
   *
   * Responses:
   *   200  { ok: true,  mode: "STORM",  deviceId: "POLAR-001" }
   *   400  { error: "..." }   — invalid buoyId or mode
   *   503  { error: "..." }   — MQTT not connected
   */
  return async function modeHandler(req, res, next) {
    try {
      // 1. Validate buoyId
      const { buoyId } = req.params
      const deviceId = DASHBOARD_TO_DEVICE[buoyId]
      if (!deviceId) {
        return res.status(400).json({
          error: `Unknown buoy ID: ${buoyId}. Allowed: ${Object.keys(DASHBOARD_TO_DEVICE).join(', ')}`,
        })
      }

      // 2. Validate mode
      const mode = (req.body?.mode || '').toString().trim().toUpperCase()
      if (!ALLOWED_MODES.includes(mode)) {
        return res.status(400).json({
          error: `Invalid mode: "${mode}". Allowed: ${ALLOWED_MODES.join(', ')}`,
        })
      }

      // 3. Check MQTT is connected before attempting to publish
      if (!mqttClient.connected) {
        logger.warn(`[ModeCommand] MQTT not connected — cannot send ${mode} command to ${deviceId}`)
        return res.status(503).json({
          error: 'MQTT broker is not connected. The command could not be delivered. Please try again.',
        })
      }

      // 4. Build and publish the command payload.
      const commandPayload = JSON.stringify({
        COMMAND: 'SET_MODE',
        MODE: mode,
        DEVICE_ID: deviceId,
        TIMESTAMP: new Date().toISOString(),
      })

      const topic = env.mqtt.commandTopic

      await new Promise((resolve, reject) => {
        mqttClient.publish(topic, commandPayload, { qos: 1, retain: false }, (err) => {
          if (err) reject(err)
          else resolve()
        })
      })

      logger.info(`[ModeCommand] Sent set_mode=${mode} for ${deviceId} via ${topic}`)

      return res.json({
        ok: true,
        mode,
        deviceId,
        topic,
        sentAt: new Date().toISOString(),
      })
    } catch (err) {
      logger.error('[ModeCommand] Failed to publish mode command:', err.message)
      next(err)
    }
  }
}
