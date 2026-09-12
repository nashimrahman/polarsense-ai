import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from './pool.js'
import { logger } from '../utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function migrate() {
  const dir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()
  for (const file of files) {
    const sql = fs.readFileSync(path.join(dir, file), 'utf8')
    logger.info(`Running migration ${file}`)
    await pool.query(sql)
  }
  logger.info('Migrations complete')
  await pool.end()
}

migrate().catch((err) => {
  logger.error('Migration failed', err)
  process.exit(1)
})