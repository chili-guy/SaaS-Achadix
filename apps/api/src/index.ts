import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import path from 'path'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { authRoutes } from './routes/auth'
import { productRoutes } from './routes/products'
import { channelRoutes } from './routes/channels'
import { postRoutes } from './routes/posts'
import { settingsRoutes } from './routes/settings'
import { startScheduler } from './workers/schedule-posts.worker'
import { createSendPostWorker } from './workers/send-post.worker'

const app = Fastify({ logger: true })

async function runMigrations() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)
  const migrationsFolder = path.join(__dirname, '..', 'drizzle')
  console.log('[db] Running migrations from:', migrationsFolder)
  await migrate(db, { migrationsFolder })
  await pool.end()
  console.log('[db] Migrations complete')
}

async function bootstrap() {
  // Run migrations before anything else
  await runMigrations()

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  await app.register(jwt, {
    secret: process.env.NEXTAUTH_SECRET || 'shopbot-super-secret-key',
  })

  // Routes
  await app.register(authRoutes)
  await app.register(productRoutes, { prefix: '/products' })
  await app.register(channelRoutes, { prefix: '/channels' })
  await app.register(postRoutes, { prefix: '/posts' })
  await app.register(settingsRoutes, { prefix: '/settings' })

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date() }))

  // Start BullMQ worker
  createSendPostWorker()
  console.log('[worker] send-post worker started')

  // Start cron scheduler (non-blocking, errors won't crash the process)
  startScheduler().catch((err) =>
    console.error('[scheduler] Failed to start:', err)
  )

  // Start server
  const port = Number(process.env.API_PORT) || 3001
  await app.listen({ port, host: '0.0.0.0' })
  console.log(`[api] Server running on port ${port}`)
}

bootstrap().catch((err) => {
  console.error('Failed to start:', err)
  process.exit(1)
})
