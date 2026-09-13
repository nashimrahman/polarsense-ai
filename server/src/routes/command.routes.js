/**
 * command.routes.js
 *
 * Mounts the buoy mode-change endpoint.
 *
 * Route:  POST /api/buoy/:buoyId/mode
 *
 * The mqttClient must be passed in at mount-time (via createCommandRouter)
 * so the controller can publish commands without importing a global singleton.
 */

import { Router } from 'express'
import { createModeHandler } from '../controllers/command.controller.js'

/**
 * @param {import('mqtt').MqttClient} mqttClient
 * @returns {import('express').Router}
 */
export function createCommandRouter(mqttClient) {
  const router = Router()

  // POST /api/buoy/:buoyId/mode
  router.post('/buoy/:buoyId/mode', createModeHandler(mqttClient))

  return router
}
