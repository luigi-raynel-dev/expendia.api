import dayjs from 'dayjs'

export const convertFloatToMoney = (value: number) => {
  return value !== 0
    ? value.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      })
    : 'R$ 0,00'
}

export const getDaysToExpire = (dueDate: Date) => {
  const today = dayjs().startOf('day')
  const dueDateDay = dayjs(dueDate).startOf('day')

  return dueDateDay.diff(today, 'day')
}

export const getFormatedDaysToExpire = (
  dueDateOrDays: Date | number | null
) => {
  const daysToExpire: number | undefined =
    dueDateOrDays === null
      ? undefined
      : typeof dueDateOrDays === 'number'
      ? dueDateOrDays
      : getDaysToExpire(dueDateOrDays)

  return daysToExpire === undefined
    ? 'não tem data de vencimento'
    : daysToExpire === 0
    ? 'vence hoje'
    : daysToExpire === 1
    ? 'vence amanhã'
    : daysToExpire === -1
    ? 'venceu ontem'
    : daysToExpire < -1
    ? `venceu à ${Math.abs(daysToExpire)} dias`
    : `vence em ${daysToExpire} dias`
}
