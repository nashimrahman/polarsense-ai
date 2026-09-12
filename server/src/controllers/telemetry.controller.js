import { getLatest, getHistory, getStats } from '../services/telemetry.service.js'

export async function health(req, res) {
  res.json({ status: 'ok', time: new Date().toISOString() })
}

export async function latest(req, res, next) {
  try {
    const row = await getLatest(req.query.buoyId)
    res.json(row)
  } catch (e) { next(e) }
}

export async function history(req, res, next) {
  try {
    const rows = await getHistory({
      buoyId: req.query.buoyId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit,
    })
    res.json(rows)
  } catch (e) { next(e) }
}

export async function stats(req, res, next) {
  try {
    res.json(await getStats(req.query.buoyId))
  } catch (e) { next(e) }
}