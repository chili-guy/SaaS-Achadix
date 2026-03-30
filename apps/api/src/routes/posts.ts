import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { posts, products, channels } from '../db/schema'
import { eq, desc, and } from 'drizzle-orm'

const filterSchema = z.object({
  channelId: z.string().uuid().optional(),
  status: z.enum(['pending', 'sent', 'failed']).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

export async function postRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // GET /posts
  app.get('/', async (req) => {
    const { channelId, status, page, pageSize } = filterSchema.parse(
      req.query
    )

    const conditions = []
    if (channelId) conditions.push(eq(posts.channelId, channelId))
    if (status) conditions.push(eq(posts.status, status))

    const rows = await db
      .select({
        id: posts.id,
        productId: posts.productId,
        channelId: posts.channelId,
        status: posts.status,
        sentAt: posts.sentAt,
        errorMessage: posts.errorMessage,
        createdAt: posts.createdAt,
        productTitle: products.title,
        productPrice: products.price,
        productImageUrl: products.imageUrl,
        channelName: channels.name,
      })
      .from(posts)
      .leftJoin(products, eq(posts.productId, products.id))
      .leftJoin(channels, eq(posts.channelId, channels.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(posts.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize)

    return rows
  })

  // GET /posts/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [row] = await db
      .select()
      .from(posts)
      .where(eq(posts.id, req.params.id))
      .limit(1)

    if (!row) return reply.status(404).send({ error: 'Post not found' })
    return row
  })
}
