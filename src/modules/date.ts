import dayjs from 'dayjs'

export const getDatesByDaysDiffs = (diffs: number[]) => {
  return diffs.map(diff => {
    let date = dayjs()
    if (diff > 0) date = date.add(diff, 'day')
    else if (diff < 0) date = date.subtract(Math.abs(diff), 'day')

    return date.startOf('day').toDate()
  })
}
