import { AIInsightState, Buoy } from '@/types'

/**
 * Mock inference layer. In production this would call a hosted model
 * (e.g. a time-series transformer) with recent telemetry windows and
 * return calibrated forecasts. Here we derive plausible values from the
 * current fleet snapshot so the UI has something coherent to react to.
 */
class PredictionService {
  infer(buoys: Buoy[]): AIInsightState {
    const online = buoys.filter((b) => b.status !== 'offline')
    const avgBattery = online.reduce((s, b) => s + b.telemetry.battery, 0) / (online.length || 1)
    const avgWind = online.reduce((s, b) => s + b.telemetry.windSpeed, 0) / (online.length || 1)
    const degraded = buoys.filter((b) => b.status === 'degraded').length
    const offline = buoys.filter((b) => b.status === 'offline').length

    const batteryRemainingDays = Math.round((avgBattery / 100) * 165)
    const sensorHealthPct = Math.round(100 - (degraded * 3 + offline * 8))
    const stormProbabilityPct = Math.round(Math.min(97, Math.max(4, (avgWind - 8) * 3.1)))
    const anomalyScore = Math.round(Math.min(100, degraded * 6 + offline * 14 + Math.max(0, avgWind - 40) * 2))

    const recommendations: AIInsightState['recommendations'] = []

    recommendations.push({
      id: 'battery',
      tone: avgBattery > 40 ? 'positive' : 'warning',
      text: avgBattery > 40
        ? 'Battery discharge normal across the fleet. No charging intervention required.'
        : `Fleet-average battery at ${avgBattery.toFixed(0)}%. Recommend prioritizing solar-facing repositioning where possible.`,
    })

    recommendations.push({
      id: 'storm',
      tone: stormProbabilityPct > 60 ? 'warning' : 'neutral',
      text: stormProbabilityPct > 60
        ? `Wind patterns indicate possible storm formation within 12 hours (${stormProbabilityPct}% confidence).`
        : 'No significant storm systems detected in current wind and pressure trends.',
    })

    recommendations.push({
      id: 'sensors',
      tone: sensorHealthPct > 90 ? 'positive' : 'warning',
      text: sensorHealthPct > 90
        ? 'No sensor degradation detected. All calibration checks nominal.'
        : `${degraded + offline} device(s) reporting degraded or lost signal. Diagnostics recommended.`,
    })

    if (anomalyScore > 25) {
      recommendations.push({
        id: 'anomaly',
        tone: 'warning',
        text: `Anomaly score elevated to ${anomalyScore}/100 — deviation clusters detected in the ${
          buoys.find((b) => b.status === 'degraded')?.region ?? 'Southern Ocean'
        } sector.`,
      })
    }

    return {
      batteryRemainingDays,
      sensorHealthPct: Math.max(0, sensorHealthPct),
      stormProbabilityPct,
      anomalyScore,
      recommendations,
    }
  }
}

export const predictionService = new PredictionService()
