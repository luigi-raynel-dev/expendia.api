import * as cron from 'node-cron'
import { cleanOldLogs } from '../logs/logger'

export const deleteLogs = async (cronExpression: string) => {
  cron.schedule(cronExpression, () => {
    cleanOldLogs()
  })
}
