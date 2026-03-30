import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { channels } from '../db/schema'
import { eq, desc } from 'drizzle-orm'
import { syncSchedules } from '../workers/schedule-posts.worker'

const createSchema = z.object({
  name: z.string().min(1),
  channelId: z.string().min(1),
  cronExpression: z.string().min(1),
})

const updateSchema = createSchema.partial().extend({
  active: z.boolean().optional(),
})

export async function channelRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // GET /channels
  app.get('/', async () => {
    return db.select().from(channels).orderBy(desc(channels.createdAt))
  })

  // GET /channels/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [channel] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, req.params.id))
      .limit(1)

    if (!channel) return reply.status(404).send({ error: 'Channel not found' })
    return channel
  })

  // POST /channels
  app.post('/', async (req, reply) => {
    const data = createSchema.parse(req.body)
    const [channel] = await db.insert(channels).values(data).returning()
    await syncSchedules()
    return reply.status(201).send(channel)
  })

  // PUT /channels/:id
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const data = updateSchema.parse(req.body)
    const [channel] = await db
      .update(channels)
      .set(data)
      .where(eq(channels.id, req.params.id))
      .returning()

    if (!channel) return reply.status(404).send({ error: 'Channel not found' })
    await syncSchedules()
    return channel
  })

  // PATCH /channels/:id/toggle
  app.patch<{ Params: { id: string } }>('/:id/toggle', async (req, reply) => {
    const [current] = await db
      .select()
      .from(channels)
      .where(eq(channels.id, req.params.id))
      .limit(1)

    if (!current) return reply.status(404).send({ error: 'Channel not found' })

    const [updated] = await db
      .update(channels)
      .set({ active: !current.active })
      .where(eq(channels.id, req.params.id))
      .returning()

    await syncSchedules()
    return updated
  })

  // DELETE /channels/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [deleted] = await db
      .delete(channels)
      .where(eq(channels.id, req.params.id))
      .returning()

    if (!deleted) return reply.status(404).send({ error: 'Channel not found' })
    await syncSchedules()
    return reply.status(204).send()
  })
}
