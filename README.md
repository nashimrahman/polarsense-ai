# PolarSense AI

An autonomous ocean observation command center for a simulated fleet of 24 buoys
drifting across the Southern Ocean and Antarctic coastline. Built as a
hackathon-grade climate intelligence dashboard.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (custom dark "mission control" theme)
- Recharts for analytics
- Mapbox GL JS for the polar globe view
- Framer Motion for motion and page transitions
- Zustand for state management
- Lucide for icons

## Getting started

```bash
npm install
cp .env.example .env
# add a free Mapbox public token to .env as VITE_MAPBOX_TOKEN
npm run dev
```

Without a Mapbox token, the Map View falls back to a stylized polar
projection built from the same live buoy data, so the app runs fully
out of the box.

## Architecture

- `src/data/mockData.ts` seeds 24 buoys with realistic Southern Ocean
  coordinates, deployment metadata, and 48-hour telemetry history.
- `src/services/telemetryService.ts` simulates a realtime backend
  (e.g. Firebase Realtime Database) — it ticks every 3 seconds and
  pushes new snapshots to subscribers.
- `src/services/alertService.ts` evaluates fleet telemetry against
  thresholds (wind, battery, temperature, connectivity, signal) and
  raises deduplicated, severity-ranked alerts.
- `src/services/predictionService.ts` is a mock inference layer that
  derives battery-life, storm-probability, sensor-health, and anomaly
  scores from the current fleet snapshot, plus a short list of
  plain-language recommendations.
- `src/store/useStore.ts` (Zustand) wires the three services together,
  holds UI state, and drives toast notifications.

## Pages

| Route         | Description                                   |
|---------------|------------------------------------------------|
| `/`           | Landing page                                   |
| `/dashboard`  | Executive overview cards + fleet snapshot      |
| `/live`       | Per-buoy live telemetry with sparklines        |
| `/map`        | Antarctic-centered Mapbox globe with buoys     |
| `/analytics`  | Recharts trends with 24h / 7d / 30d filters    |
| `/insights`   | AI prediction panel and recommendations        |
| `/alerts`     | Severity-filtered alert center                 |
| `/devices`    | Device health, gauges, and diagnostics         |
| `/settings`   | Notification, telemetry, and appearance prefs  |

## Notes

All telemetry is simulated client-side; nothing here calls a real
ocean sensor network. The data generator and mock services are
structured so a real backend (Firebase, MQTT bridge, REST API) could
be swapped in behind the same `subscribe()` interfaces.
# polarsense-ai
# polarsense-ai
