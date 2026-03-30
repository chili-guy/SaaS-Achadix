import { Worker, Job } from 'bullmq'
import { redisConnection } from './redis'
import { db } from '../db'
import { products, channels, posts } from '../db/schema'
import { eq, and } from 'drizzle-orm'
import { sendWhatsAppMessage } from '../lib/evolution'
import { fetchProductOffers } from '../lib/shopee'

export interface SendPostJobData {
  channelId: string
}

export function createSendPostWorker() {
  const worker = new Worker<SendPostJobData>(
    'send-post',
    async (job: Job<SendPostJobData>) => {
      const { channelId } = job.data

      // Fetch channel
      const [channel] = await db
        .select()
        .from(channels)
        .where(and(eq(channels.id, channelId), eq(channels.active, true)))
        .limit(1)

      if (!channel) {
        throw new Error(`Channel ${channelId} not found or inactive`)
      }

      // Busca ofertas frescas da Shopee
      const offers = await fetchProductOffers(20)
      if (offers.length === 0) {
        throw new Error('Nenhuma oferta retornada pela API da Shopee')
      }

      // Escolhe uma oferta aleatória
      const offer = offers[Math.floor(Math.random() * offers.length)]

      if (!offer.affiliateLink) {
        throw new Error('Oferta sem link de afiliado')
      }

      // Upsert: reusa produto existente pelo shopeeUrl ou cria novo
      const [existing] = await db
        .select()
        .from(products)
        .where(eq(products.shopeeUrl, offer.productUrl))
        .limit(1)

      let product
      if (existing) {
        const [updated] = await db
          .update(products)
          .set({
            title: offer.productName,
            price: (offer.priceMin / 100000).toFixed(2),
            imageUrl: offer.imageUrl,
            affiliateLink: offer.affiliateLink,
            active: true,
          })
          .where(eq(products.shopeeUrl, offer.productUrl))
          .returning()
        product = updated
      } else {
        const [inserted] = await db
          .insert(products)
          .values({
            title: offer.productName,
            price: (offer.priceMin / 100000).toFixed(2),
            imageUrl: offer.imageUrl,
            affiliateLink: offer.affiliateLink,
            shopeeUrl: offer.productUrl,
            active: true,
          })
          .returning()
        product = inserted
      }

      // Cria registro de post pendente
      const [post] = await db
        .insert(posts)
        .values({
          productId: product.id,
          channelId: channel.id,
          status: 'pending',
        })
        .returning()

      try {
        await sendWhatsAppMessage({
          channelId: channel.channelId,
          title: product.title,
          price: product.price,
          affiliateLink: product.affiliateLink,
          imageUrl: product.imageUrl,
        })

        await db
          .update(posts)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(posts.id, post.id))

        console.log(
          `[send-post] Enviado "${product.title}" para o canal "${channel.name}"`
        )
      } catch (err: any) {
        await db
          .update(posts)
          .set({
            status: 'failed',
            errorMessage: err?.message || 'Unknown error',
          })
          .where(eq(posts.id, post.id))

        throw err
      }
    },
    {
      connection: redisConnection,
      concurrency: 3,
    }
  )

  worker.on('failed', (job, err) => {
    console.error(`[send-post] Job ${job?.id} failed:`, err.message)
  })

  worker.on('completed', (job) => {
    console.log(`[send-post] Job ${job.id} completed`)
  })

  return worker
}
