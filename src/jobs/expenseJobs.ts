import * as cron from 'node-cron'
import { expensesExpirationNotification } from '../modules/notifications'

export const expensesAboutToExpire = async (cronExpression: string) => {
  cron.schedule(cronExpression, async () => {
    console.log('chegou')
    await expensesExpirationNotification()
    console.log('terminou')
  })
}
