import { Worker, Job } from 'bullmq'
import { redisConnection } from './redis'
import { db } from '../db'
import { products, channels, posts } from '../db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { sendWhatsAppMessage } from '../lib/evolution'

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

      // Pick a random active product that hasn't been posted to this channel recently
      const activeProducts = await db
        .select()
        .from(products)
        .where(eq(products.active, true))

      if (activeProducts.length === 0) {
        throw new Error('No active products available to post')
      }

      // Pick random product
      const product =
        activeProducts[Math.floor(Math.random() * activeProducts.length)]

      // Create pending post record
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

        // Mark as sent
        await db
          .update(posts)
          .set({ status: 'sent', sentAt: new Date() })
          .where(eq(posts.id, post.id))

        console.log(
          `[send-post] Sent product "${product.title}" to channel "${channel.name}"`
        )
      } catch (err: any) {
        // Mark as failed
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
