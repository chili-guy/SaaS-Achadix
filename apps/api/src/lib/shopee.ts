import crypto from 'crypto'
import axios from 'axios'

const SHOPEE_API_URL = 'https://open-api.affiliate.shopee.com.br/graphql'

function buildAuthHeader(payload: string): string {
  const appId = process.env.SHOPEE_APP_ID || ''
  const secret = process.env.SHOPEE_SECRET || ''
  const timestamp = Math.floor(Date.now() / 1000)

  // Shopee Affiliate API BR: HMAC-SHA256(secret, appId + timestamp + body)
  const rawString = `${appId}${timestamp}${payload}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(rawString)
    .digest('hex')

  return `${appId}:${timestamp}:${signature}`
}

function cleanShopeeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl)
    return `${url.origin}${url.pathname}`
  } catch {
    return rawUrl
  }
}

// ─── Generate affiliate short link ────────────────────────────────────────────

export async function generateAffiliateLink(originUrl: string): Promise<string> {
  originUrl = cleanShopeeUrl(originUrl)

  const query = `mutation generateShortLink($input: GenerateShortLinkInput!) {
    generateShortLink(input: $input) {
      short_link
    }
  }`

  const variables = {
    input: {
      originUrl,
      subIds: ['shopbot'],
    },
  }

  const body = JSON.stringify({ query, variables })
  const auth = buildAuthHeader(body)

  try {
    const { data } = await axios.post(SHOPEE_API_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    })

    if (data?.errors?.length) {
      throw new Error(data.errors[0].message)
    }

    const shortLink = data?.data?.generateShortLink?.short_link
    if (!shortLink) throw new Error('Link não retornado pela API')
    return shortLink
  } catch (err: any) {
    const msg = err?.response?.data?.errors?.[0]?.message || err?.message || 'Erro ao gerar link'
    throw new Error(msg)
  }
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
  const query = `query getProductOffer($input: ProductOfferV2Input!) {
    productOfferV2(input: $input) {
      nodes {
        productName
        priceMin
        imageUrl
        productUrl
        offerLink
      }
    }
  }`

  const variables = {
    input: {
      page: 1,
      limit,
      sortType: 2,
    },
  }

  const body = JSON.stringify({ query, variables })
  const auth = buildAuthHeader(body)

  try {
    const { data } = await axios.post(SHOPEE_API_URL, body, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
    })

    const nodes =
      data?.data?.productOfferV2?.nodes ||
      data?.data?.productOffer?.nodes ||
      []

    return nodes.map((n: any) => ({
      productName: n.productName,
      priceMin: n.priceMin,
      imageUrl: n.imageUrl,
      productUrl: n.productUrl,
      affiliateLink: n.offerLink,
    }))
  } catch (err: any) {
    console.error('[shopee] fetchProductOffers error:', JSON.stringify(err?.response?.data) || err?.message)
    return []
  }
}
