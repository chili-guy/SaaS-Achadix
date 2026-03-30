import {
  pgTable,
  uuid,
  text,
  boolean,
  timestamp,
  pgEnum,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ─── Enums ────────────────────────────────────────────────────────────────────

export const postStatusEnum = pgEnum('post_status', ['pending', 'sent', 'failed'])

// ─── Tables ───────────────────────────────────────────────────────────────────

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  price: text('price').notNull(),
  imageUrl: text('image_url').notNull(),
  affiliateLink: text('affiliate_link').notNull(),
  shopeeUrl: text('shopee_url').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  channelId: text('channel_id').notNull(),
  cronExpression: text('cron_expression').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const posts = pgTable('posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  channelId: uuid('channel_id')
    .notNull()
    .references(() => channels.id, { onDelete: 'cascade' }),
  status: postStatusEnum('status').notNull().default('pending'),
  sentAt: timestamp('sent_at'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const settings = pgTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

// ─── Relations ────────────────────────────────────────────────────────────────

export const productsRelations = relations(products, ({ many }) => ({
  posts: many(posts),
}))

export const channelsRelations = relations(channels, ({ many }) => ({
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  product: one(products, {
    fields: [posts.productId],
    references: [products.id],
  }),
  channel: one(channels, {
    fields: [posts.channelId],
    references: [channels.id],
  }),
}))

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Channel = typeof channels.$inferSelect
export type NewChannel = typeof channels.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Setting = typeof settings.$inferSelect
