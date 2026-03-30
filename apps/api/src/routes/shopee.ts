import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { db } from '../db'
import { products } from '../db/schema'
import { generateAffiliateLink, fetchProductOffers } from '../lib/shopee'

export async function shopeeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (req, reply) => {
    try {
      await req.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // POST /shopee/generate-link
  // Recebe uma URL da Shopee e retorna o link de afiliado
  app.post('/generate-link', async (req, reply) => {
    const { url } = z.object({ url: z.string().url() }).parse(req.body)
    const affiliateLink = await generateAffiliateLink(url)
    return { affiliateLink }
  })

  // GET /shopee/offers
  // Busca produtos em alta e retorna com link de afiliado
  app.get('/offers', async (req) => {
    const { limit } = z
      .object({ limit: z.coerce.number().int().min(1).max(50).default(10) })
      .parse(req.query)

    const offers = await fetchProductOffers(limit)
    return offers
  })

  // POST /shopee/import
  // Importa um produto da Shopee direto para o catálogo
  app.post('/import', async (req, reply) => {
    const schema = z.object({
      shopeeUrl: z.string().url(),
      title: z.string().min(1),
      price: z.string().min(1),
      imageUrl: z.string().url(),
    })

    const { shopeeUrl, title, price, imageUrl } = schema.parse(req.body)

    // Gera link de afiliado automaticamente
    const affiliateLink = await generateAffiliateLink(shopeeUrl)

    const [product] = await db
      .insert(products)
      .values({ title, price, imageUrl, affiliateLink, shopeeUrl, active: true })
      .returning()

    return reply.status(201).send(product)
  })
}
