// ─── Products ─────────────────────────────────────────────────────────────────

export interface Product {
  id: string
  title: string
  price: string
  imageUrl: string
  affiliateLink: string
  shopeeUrl: string
  active: boolean
  createdAt: string
}

export interface CreateProductDto {
  title: string
  price: string
  imageUrl: string
  affiliateLink: string
  shopeeUrl: string
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  active?: boolean
}

// ─── Channels ─────────────────────────────────────────────────────────────────

export interface Channel {
  id: string
  name: string
  channelId: string
  cronExpression: string
  active: boolean
  createdAt: string
}

export interface CreateChannelDto {
  name: string
  channelId: string
  cronExpression: string
}

export interface UpdateChannelDto extends Partial<CreateChannelDto> {
  active?: boolean
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export type PostStatus = 'pending' | 'sent' | 'failed'

export interface Post {
  id: string
  productId: string
  channelId: string
  status: PostStatus
  sentAt: string | null
  errorMessage: string | null
  createdAt: string
  product?: Pick<Product, 'title' | 'price' | 'imageUrl'>
  channel?: Pick<Channel, 'name'>
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface Setting {
  key: string
  value: string
}

export interface EvolutionSettings {
  baseUrl: string
  apiKey: string
  instanceName: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginDto {
  password: string
}

export interface LoginResponse {
  token: string
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}
