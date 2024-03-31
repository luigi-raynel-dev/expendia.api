import { deleteLogs } from './deleteLogs'
import { expensesAboutToExpire } from './expenseJobs'

export const schedule = {
  run: async () => {
    await expensesAboutToExpire('0 6-12 * * *')
    await deleteLogs('0 0 * * *')
  }
}
