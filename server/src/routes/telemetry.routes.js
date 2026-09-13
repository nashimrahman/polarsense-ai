import { Router } from 'express'
import { health, latest, history, stats, exportHandler } from '../controllers/telemetry.controller.js'

export const telemetryRouter = Router()
telemetryRouter.get('/health', health)
telemetryRouter.get('/latest', latest)
telemetryRouter.get('/history', history)
telemetryRouter.get('/stats', stats)
telemetryRouter.get('/telemetry/export', exportHandler)