/**
 * exportService.ts
 *
 * Thin service for requesting telemetry exports from the Node.js backend.
 * React MUST NOT connect directly to PostgreSQL — all data comes through the API.
 */

const API_URL =
  (import.meta?.env?.VITE_API_URL as string | undefined) || 'http://localhost:4000'

export type ExportFormat = 'csv' | 'json'

export interface ExportOptions {
  buoyId: string      // Dashboard buoy ID, e.g. 'PS-01'
  from?: string       // ISO date string, e.g. '2026-09-10'
  to?: string         // ISO date string, e.g. '2026-09-13'
  format: ExportFormat
}

/**
 * Request an export from the Node.js backend.
 *
 * On success:    triggers a browser file download.
 * On 404:        throws an Error with the API's "no data" message.
 * On other 4xx:  throws an Error with the API's validation message.
 * On network/5xx: throws a generic user-friendly Error.
 */
export async function exportTelemetry(opts: ExportOptions): Promise<void> {
  const params = new URLSearchParams()
  params.set('buoy_id', opts.buoyId)
  if (opts.from) params.set('from', opts.from)
  if (opts.to)   params.set('to',   opts.to)
  params.set('format', opts.format)

  const url = `${API_URL}/api/telemetry/export?${params.toString()}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new Error('Unable to reach the server. Please check your connection.')
  }

  // 404 → "No telemetry data found..."
  // 400 → validation error from the API
  if (!response.ok) {
    let apiMessage = `Export failed (HTTP ${response.status}).`
    try {
      const body = await response.json() as { message?: string; error?: string }
      apiMessage = body.message || body.error || apiMessage
    } catch {
      // ignore JSON parse failure — use the default message
    }
    throw new Error(apiMessage)
  }

  // Parse the Content-Disposition header to extract the server-generated filename.
  // Falls back to a sensible default so the download is always named correctly.
  const disposition = response.headers.get('Content-Disposition') || ''
  const filenameMatch = disposition.match(/filename="?([^";\r\n]+)"?/i)
  const buoySlug = opts.buoyId.replace(/[^a-z0-9_-]/gi, '_')
  const dateSuffix =
    opts.from && opts.to  ? `${opts.from}_to_${opts.to}`
    : opts.from           ? `from_${opts.from}`
    : opts.to             ? `to_${opts.to}`
    : 'all'
  const fallbackName = `polarsense_${buoySlug}_telemetry_${dateSuffix}.${opts.format}`
  const filename = filenameMatch ? filenameMatch[1] : fallbackName

  // Convert the response body to a Blob, create a temporary object URL,
  // programmatically click an invisible <a> element to trigger the download,
  // then revoke the URL to free memory.
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
