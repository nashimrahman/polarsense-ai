import { Router } from 'express'
import { health, latest, history, stats } from '../controllers/telemetry.controller.js'

export const telemetryRouter = Router()
telemetryRouter.get('/health', health)
telemetryRouter.get('/latest', latest)
telemetryRouter.get('/history', history)
telemetryRouter.get('/stats', stats)