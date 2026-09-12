import express from 'express'
import cors from 'cors'
import http from 'node:http'
import { env } from './config/env.js'
import { telemetryRouter } from './routes/telemetry.routes.js'
import { errorHandler } from './middleware/errorHandler.js'
import { createMqttClient } from './mqtt/client.js'
import { attachTelemetryHandler } from './mqtt/telemetryHandler.js'
import { createSocketServer } from './websocket/socket.js'
import { logger } from './utils/logger.js'

const app = express()
app.use(cors({ origin: env.corsOrigin }))
app.use(express.json())
app.use('/api', telemetryRouter)
app.use(errorHandler)

const httpServer = http.createServer(app)
const io = createSocketServer(httpServer, env.corsOrigin)

const mqttClient = createMqttClient()
attachTelemetryHandler(mqttClient, io)

httpServer.listen(env.port, () => logger.info(`Server listening on :${env.port}`))