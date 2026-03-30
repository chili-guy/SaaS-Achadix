import cron from 'node-cron'
import { db } from '../db'
import { channels } from '../db/schema'
import { eq } from 'drizzle-orm'
import { sendPostQueue } from './queue'

// Map of channelId -> cron task, so we can restart when config changes
const activeTasks = new Map<string, cron.ScheduledTask>()

export async function syncSchedules() {
  console.log('[scheduler] Syncing channel schedules...')

  const activeChannels = await db
    .select()
    .from(channels)
    .where(eq(channels.active, true))

  const activeIds = new Set(activeChannels.map((c) => c.id))

  // Stop tasks for removed/inactive channels
  for (const [id, task] of activeTasks.entries()) {
    if (!activeIds.has(id)) {
      task.stop()
      activeTasks.delete(id)
      console.log(`[scheduler] Stopped schedule for channel ${id}`)
    }
  }

  // Start or restart tasks for active channels
  for (const channel of activeChannels) {
    const existing = activeTasks.get(channel.id)

    // Always re-register to pick up cron expression changes
    if (existing) {
      existing.stop()
      activeTasks.delete(channel.id)
    }

    if (!cron.validate(channel.cronExpression)) {
      console.warn(
        `[scheduler] Invalid cron for channel "${channel.name}": ${channel.cronExpression}`
      )
      continue
    }

    const task = cron.schedule(channel.cronExpression, async () => {
      console.log(
        `[scheduler] Queueing post for channel "${channel.name}" (${channel.cronExpression})`
      )
      await sendPostQueue.add(
        `send-post-${channel.id}`,
        { channelId: channel.id },
        {
          jobId: `channel-${channel.id}-${Date.now()}`,
        }
      )
    })

    activeTasks.set(channel.id, task)
    console.log(
      `[scheduler] Scheduled "${channel.name}" with cron: ${channel.cronExpression}`
    )
  }
}

// Re-sync every 5 minutes to pick up config changes
export async function startScheduler() {
  await syncSchedules()
  cron.schedule('*/5 * * * *', () => syncSchedules().catch(console.error))
  console.log('[scheduler] Started. Re-syncing every 5 minutes.')
}
