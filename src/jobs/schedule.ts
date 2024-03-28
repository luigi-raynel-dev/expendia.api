import { expensesAboutToExpire } from './expenseJobs'

export const schedule = {
  run: async () => {
    await expensesAboutToExpire('0 6-12 * * *')
  }
}
