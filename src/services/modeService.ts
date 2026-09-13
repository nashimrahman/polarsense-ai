/**
 * modeService.ts
 *
 * Sends a mode-change command for a buoy via the Node.js REST API.
 *
 * Flow:
 *   React UI clicks [STORM]
 *       ↓
 *   modeService.setMode('PS-01', 'STORM')
 *       ↓
 *   POST /api/buoy/PS-01/mode  { mode: 'STORM' }
 *       ↓
 *   Node.js publishes MQTT command to polarsenseai/buoy/command
 *       ↓
 *   ESP32 switches sampling interval and reports mode in telemetry
 *
 * React NEVER talks to MQTT or the ESP32 directly.
 */

const API_URL =
  (import.meta?.env?.VITE_API_URL as string | undefined) || 'http://localhost:4000'

export type BuoyMode = 'NORMAL' | 'STORM'

/**
 * Send a mode-change command to the Node.js backend.
 *
 * @param buoyId  Dashboard buoy ID (e.g. 'PS-01')
 * @param mode    'NORMAL' | 'STORM'
 * @throws        Error with a user-friendly message on failure
 */
export async function setMode(buoyId: string, mode: BuoyMode): Promise<void> {
  const url = `${API_URL}/api/buoy/${encodeURIComponent(buoyId)}/mode`

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode }),
    })
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.')
  }

  if (!response.ok) {
    let apiMessage = `Mode change failed (HTTP ${response.status}).`
    try {
      const body = await response.json() as { error?: string }
      apiMessage = body.error || apiMessage
    } catch {
      // ignore — use default message
    }
    throw new Error(apiMessage)
  }
}
