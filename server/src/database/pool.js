import pg from 'pg'
import { env } from '../config/env.js'

const { Pool } = pg

export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: env.databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
})

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error', err)
})