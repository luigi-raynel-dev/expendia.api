import * as cron from 'node-cron'
import { expensesExpirationNotification } from '../modules/notifications'

export const expensesAboutToExpire = async (cronExpression: string) => {
  cron.schedule(cronExpression, async () => {
    await expensesExpirationNotification([5, 1, 0, -1, -5])
  })
}
