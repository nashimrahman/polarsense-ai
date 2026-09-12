import 'dotenv/config'

function required(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

export const env = {
  port: Number(process.env.PORT || 4000),
  mqtt: {
    host: required('MQTT_HOST'),
    port: Number(process.env.MQTT_PORT || 8883),
    username: required('MQTT_USERNAME'),
    password: required('MQTT_PASSWORD'),
    telemetryTopic: process.env.MQTT_TELEMETRY_TOPIC || 'polarsenseai/buoy/telemetry',
    telemetryWildcard: process.env.MQTT_TELEMETRY_WILDCARD || 'polarsenseai/buoy/+/telemetry',
    commandTopic: process.env.MQTT_COMMAND_TOPIC || 'polarsenseai/buoy/command',
  },
  databaseUrl: required('DATABASE_URL'),
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173').split(','),
}