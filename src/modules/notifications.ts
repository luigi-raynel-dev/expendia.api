import { Expense, Group, Paying, User } from '@prisma/client'
import { inviteMember } from './invite'
import { sendPushNotification } from './pushNotification'
import {
  convertFloatToMoney,
  getDaysToExpire,
  getFormatedDaysToExpire
} from './expense'

export const newGroupNotification = async (
  me: User,
  user: User,
  group: Group
) => {
  if (me.id !== user.id) {
    await inviteMember(me, user, group)
    if (user.password || user.googleId)
      await sendPushNotification(user.id, {
        data: {
          notificationTopic: 'NEW_GROUP',
          groupId: group.id
        },
        notification: {
          title: 'Você faz parte de um novo grupo',
          body: `${me.firstname} te adicionou ao grupo: ${group.title} para dividir as despesas.`
        }
      })
  }
}

export const newExpenseNotification = async (
  me: User,
  user: User,
  paying: Paying,
  expense: Expense
) => {
  if (me.id !== user.id) {
    if (user.password || user.googleId)
      await sendPushNotification(user.id, {
        data: {
          notificationTopic: 'NEW_EXPENSE',
          groupId: expense.group_id,
          expenseId: expense.id
        },
        notification: {
          title: 'Você foi atribuído a uma nova despesa',
          body: `${me.firstname} te atribuiu a despesa: ${
            expense.title
          }, que ${getFormatedDaysToExpire(
            expense.dueDate
          )} com o valor total de ${convertFloatToMoney(
            Number(expense.cost)
          )}, e você pagará ${convertFloatToMoney(Number(paying.cost))}.`
        }
      })
  }
}
