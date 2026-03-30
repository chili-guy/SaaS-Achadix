import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { settings } from '../db/schema'
import { eq } from 'drizzle-orm'

const settingsSchema = z.object({
  evolution_base_url: z.string().url().optional(),
  evolution_api_key: z.string().optional(),
  evolution_instance: z.string().optional(),
})

export async function settingsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // GET /settings
  app.get('/', async () => {
    const rows = await db.select().from(settings)
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  })

  // PUT /settings
  app.put('/', async (req, reply) => {
    const data = settingsSchema.parse(req.body)

    const upserts = Object.entries(data)
      .filter(([, v]) => v !== undefined)
      .map(([key, value]) =>
        db
          .insert(settings)
          .values({ key, value: value! })
          .onConflictDoUpdate({ target: settings.key, set: { value: value! } })
      )

    await Promise.all(upserts)
    const rows = await db.select().from(settings)
    return Object.fromEntries(rows.map((r) => [r.key, r.value]))
  })
}
