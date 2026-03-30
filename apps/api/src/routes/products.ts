import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { products } from '../db/schema'
import { eq, desc } from 'drizzle-orm'

const createSchema = z.object({
  title: z.string().min(1),
  price: z.string().min(1),
  imageUrl: z.string().url(),
  affiliateLink: z.string().url(),
  shopeeUrl: z.string().url(),
})

const updateSchema = createSchema.partial().extend({
  active: z.boolean().optional(),
})

export async function productRoutes(app: FastifyInstance) {
  // All routes require auth
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // GET /products
  app.get('/', async () => {
    return db.select().from(products).orderBy(desc(products.createdAt))
  })

  // GET /products/:id
  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id))
      .limit(1)

    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })

  // POST /products
  app.post('/', async (req, reply) => {
    const data = createSchema.parse(req.body)
    const [product] = await db.insert(products).values(data).returning()
    return reply.status(201).send(product)
  })

  // PUT /products/:id
  app.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const data = updateSchema.parse(req.body)
    const [product] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, req.params.id))
      .returning()

    if (!product) return reply.status(404).send({ error: 'Product not found' })
    return product
  })

  // PATCH /products/:id/toggle
  app.patch<{ Params: { id: string } }>('/:id/toggle', async (req, reply) => {
    const [current] = await db
      .select()
      .from(products)
      .where(eq(products.id, req.params.id))
      .limit(1)

    if (!current) return reply.status(404).send({ error: 'Product not found' })

    const [updated] = await db
      .update(products)
      .set({ active: !current.active })
      .where(eq(products.id, req.params.id))
      .returning()

    return updated
  })

  // DELETE /products/:id
  app.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const [deleted] = await db
      .delete(products)
      .where(eq(products.id, req.params.id))
      .returning()

    if (!deleted) return reply.status(404).send({ error: 'Product not found' })
    return reply.status(204).send()
  })
}
