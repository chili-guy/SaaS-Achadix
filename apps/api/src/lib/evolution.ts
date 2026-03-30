import axios from 'axios'
import { db } from '../db'
import { settings } from '../db/schema'

interface EvolutionConfig {
  baseUrl: string
  apiKey: string
  instanceName: string
}

async function getEvolutionConfig(): Promise<EvolutionConfig> {
  const allSettings = await db.select().from(settings)
  const map = Object.fromEntries(allSettings.map((s) => [s.key, s.value]))

  const baseUrl =
    map['evolution_base_url'] || process.env.EVOLUTION_BASE_URL || ''
  const apiKey =
    map['evolution_api_key'] || process.env.EVOLUTION_API_KEY || ''
  const instanceName =
    map['evolution_instance'] || process.env.EVOLUTION_INSTANCE || ''

  return { baseUrl, apiKey, instanceName }
}

export interface SendMessagePayload {
  channelId: string
  title: string
  price: string
  affiliateLink: string
  imageUrl: string
}

export async function sendWhatsAppMessage(
  payload: SendMessagePayload
): Promise<void> {
  const config = await getEvolutionConfig()

  if (!config.baseUrl || !config.apiKey || !config.instanceName) {
    throw new Error(
      'Evolution API not configured. Set baseUrl, apiKey and instanceName in Settings.'
    )
  }

  const text = `🛒 *${payload.title}*\n\n💰 R$ ${payload.price}\n\n👉 ${payload.affiliateLink}`

  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      apikey: config.apiKey,
      'Content-Type': 'application/json',
    },
  })

  await client.post(
    `/message/sendText/${config.instanceName}`,
    {
      number: `${payload.channelId}@newsletter`,
      text,
      media: payload.imageUrl,
    }
  )
}
