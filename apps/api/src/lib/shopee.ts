import crypto from 'crypto'
import axios from 'axios'

const SHOPEE_API_URL = 'https://open-api.affiliate.shopee.com.br/graphql'

function buildAuthHeader(payload: string): string {
  const appId = process.env.SHOPEE_APP_ID || ''
  const secret = process.env.SHOPEE_SECRET || ''
  const timestamp = Math.floor(Date.now() / 1000)
  const rawString = `${appId}${timestamp}${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawString)
    .digest('hex')
  return `${appId}:${timestamp}:${signature}`
}

// ─── Generate affiliate short link ────────────────────────────────────────────

function cleanShopeeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    // Mantém apenas o path — remove todos os query params de rastreamento
    return `${url.origin}${url.pathname}`
  } catch {
    return rawUrl
  }
}

export async function generateAffiliateLink(originUrl: string): Promise<string> {
  originUrl = cleanShopeeUrl(originUrl)
  const query = `
    mutation generateShortLink($input: GenerateShortLinkInput!) {
      generateShortLink(input: $input) {
        short_link
      }
    }
  `
  const variables = {
    input: {
      originUrl,
      subIds: ['shopbot'],
    },
  }

  const payload = JSON.stringify({ query, variables })
  const auth = buildAuthHeader(payload)

  const { data } = await axios.post(SHOPEE_API_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
  })

  const shortLink = data?.data?.generateShortLink?.short_link
  if (!shortLink) {
    throw new Error(
      data?.errors?.[0]?.message || 'Failed to generate affiliate link'
    )
  }

  return shortLink
}

// ─── Fetch trending product offers ────────────────────────────────────────────

export interface ShopeeProduct {
  productName: string
  priceMin: number
  imageUrl: string
  productUrl: string
  affiliateLink?: string
}

export async function fetchProductOffers(limit = 10): Promise<ShopeeProduct[]> {
  const query = `
    query getProductOffer($input: ProductOfferInput!) {
      productOffer(input: $input) {
        nodes {
          productName
          priceMin
          imageUrl
          productUrl
          offerLink
        }
      }
    }
  `
  const variables = {
    input: {
      page: 1,
      limit,
      sortType: 2, // 2 = by commission
    },
  }

  const payload = JSON.stringify({ query, variables })
  const auth = buildAuthHeader(payload)

  const { data } = await axios.post(SHOPEE_API_URL, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
  })

  const nodes = data?.data?.productOffer?.nodes || []

  return nodes.map((n: any) => ({
    productName: n.productName,
    priceMin: n.priceMin,
    imageUrl: n.imageUrl,
    productUrl: n.productUrl,
    affiliateLink: n.offerLink,
  }))
}
