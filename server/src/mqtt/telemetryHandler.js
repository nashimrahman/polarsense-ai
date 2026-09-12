import { validateTelemetryPayload } from '../middleware/validateTelemetry.js'
import { insertTelemetry } from '../services/telemetry.service.js'
import { logger } from '../utils/logger.js'

export function attachTelemetryHandler(mqttClient, io) {
  mqttClient.on('message', async (topic, payload) => {
    
    console.log('\n===== RAW MQTT MESSAGE =====');
    console.log('Topic:', topic);
    console.log('Payload:', payload.toString());
    console.log('============================\n');

    const { valid, data, error } = validateTelemetryPayload(payload)
    if (!valid) {
      logger.warn('Rejected telemetry payload:', error, 'topic:', topic)
      return
    }
    try {
      const row = await insertTelemetry(data)
      io.emit('telemetry_update', row)
      logger.info('Stored + broadcast telemetry for', data.buoy_id)
    } catch (err) {
      logger.error('DB insert failed', err.message)
    }
  })
}