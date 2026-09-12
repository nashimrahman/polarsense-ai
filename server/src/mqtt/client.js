import mqtt from 'mqtt'
import { env } from '../config/env.js'
import { logger } from '../utils/logger.js'

export function createMqttClient() {
  const url = `mqtts://${env.mqtt.host}:${env.mqtt.port}`
  const client = mqtt.connect(url, {
    username: env.mqtt.username,
    password: env.mqtt.password,
    reconnectPeriod: 5000,
    connectTimeout: 10000,
    clientId: `polarsense-backend-${Math.random().toString(16).slice(2, 8)}`,
  })

  client.on('connect', () => {
    logger.info('MQTT connected to', url)
    client.subscribe([env.mqtt.telemetryTopic, env.mqtt.telemetryWildcard], (err) => {
      if (err) logger.error('MQTT subscribe failed', err)
      else logger.info('Subscribed to', env.mqtt.telemetryTopic, 'and', env.mqtt.telemetryWildcard)
    })
  })

  client.on('reconnect', () => logger.warn('MQTT reconnecting...'))
  client.on('close', () => logger.warn('MQTT connection closed'))
  client.on('error', (err) => logger.error('MQTT error', err.message))

  return client
}