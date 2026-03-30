import { Pool } from 'pg'

export async function initSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })

  await pool.query(`
    DO $$ BEGIN
      CREATE TYPE "post_status" AS ENUM('pending', 'sent', 'failed');
    EXCEPTION WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "products" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "title" text NOT NULL,
      "price" text NOT NULL,
      "image_url" text NOT NULL,
      "affiliate_link" text NOT NULL,
      "shopee_url" text NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "channels" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "name" text NOT NULL,
      "channel_id" text NOT NULL,
      "cron_expression" text NOT NULL,
      "active" boolean DEFAULT true NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "posts" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "product_id" uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      "channel_id" uuid NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      "status" post_status DEFAULT 'pending' NOT NULL,
      "sent_at" timestamp,
      "error_message" text,
      "created_at" timestamp DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "settings" (
      "key" text PRIMARY KEY NOT NULL,
      "value" text NOT NULL
    );
  `)

  await pool.end()
  console.log('[db] Schema initialized')
}
