import axios from 'axios'
import { db } from '../db'
import { settings } from '../db/schema'

async function getEvolutionConfig() {
  const allSettings = await db.select().from(settings)
  const map = Object.fromEntries(allSettings.map((s) => [s.key, s.value.trim()]))

  return {
    baseUrl: map['evolution_base_url'] || process.env.EVOLUTION_BASE_URL || '',
    apiKey: map['evolution_api_key'] || process.env.EVOLUTION_API_KEY || '',
    instanceName: map['evolution_instance'] || process.env.EVOLUTION_INSTANCE || '',
  }
}

export interface SendMessagePayload {
  channelId: string
  title: string
  price: string
  affiliateLink: string
  imageUrl: string
}

export async function sendWhatsAppMessage(payload: SendMessagePayload): Promise<void> {
  const config = await getEvolutionConfig()

  if (!config.baseUrl || !config.apiKey || !config.instanceName) {
    throw new Error('Evolution API not configured. Set baseUrl, apiKey and instanceName in Settings.')
  }

  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
  })

  const number = `${payload.channelId}@newsletter`
  const caption = `🛒 *${payload.title}*\n\n💰 R$ ${payload.price}\n\n👉 ${payload.affiliateLink}`

  if (payload.imageUrl) {
    // Send image with caption
    await client.post(`/message/sendMedia/${config.instanceName}`, {
      number,
      mediatype: 'image',
      mimetype: 'image/jpeg',
      caption,
      media: payload.imageUrl,
      fileName: 'produto.jpg',
    })
  } else {
    // Send text only
    await client.post(`/message/sendText/${config.instanceName}`, {
      number,
      text: caption,
    })
  }
}
