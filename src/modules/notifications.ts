import { Expense, Group, Paying, User } from '@prisma/client'
import { inviteMember } from './invite'
import { sendPushNotification } from './pushNotification'
import { convertFloatToMoney, getFormatedDaysToExpire } from './expense'
import { prisma } from '../lib/prisma'
import dayjs from 'dayjs'

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

export const fullyPaidExpenseNotification = async (
  user: User,
  expense: Expense
) => {
  if (user.password || user.googleId)
    await sendPushNotification(user.id, {
      data: {
        notificationTopic: 'FULLY_PAID',
        groupId: expense.group_id,
        expenseId: expense.id
      },
      notification: {
        title: 'A despesa foi totalmente paga',
        body: `A despesa: ${expense.title}, foi totalmente paga por todos.`
      }
    })
}

export const expensePaymentNotification = async (
  me: User,
  user: User,
  to: User,
  expense: Expense
) => {
  if (to.password || to.googleId)
    await sendPushNotification(to.id, {
      data: {
        notificationTopic: 'FULLY_PAID',
        groupId: expense.group_id,
        expenseId: expense.id
      },
      notification: {
        title: `${user.firstname || 'Um usuário'} pagou uma despesa`,
        body: `${user.firstname || 'Um usuário'} pagou a despesa: ${
          expense.title
        }${me.id !== user.id ? `, ${me.firstname} marcou o pagamento` : ''}.`
      }
    })
}

export const expensesExpirationNotification = async () => {
  const aWeekAgo = dayjs().subtract(7, 'day').startOf('day').toDate()
  const tomorrow = dayjs().add(1, 'day').endOf('day').toDate()

  const expenses = await prisma.expense.findMany({
    where: {
      dueDate: {
        gte: aWeekAgo,
        lt: tomorrow
      }
    },
    include: {
      Paying: {
        include: {
          paying: true
        }
      }
    },
    orderBy: {
      dueDate: 'asc'
    }
  })

  expenses.map(expense => {
    expense.Paying.map(async member => {
      if (!member.paid && (member.paying.password || member.paying.googleId)) {
        await sendPushNotification(member.paying.id, {
          data: {
            notificationTopic: 'EXPENSE_EXPIRATION',
            groupId: expense.group_id,
            expenseId: expense.id
          },
          notification: {
            title: `A despesa ${getFormatedDaysToExpire(expense.dueDate)}`,
            body: `A despesa: ${expense.title} ${getFormatedDaysToExpire(
              expense.dueDate
            )}.`
          }
        })
      }
    })
  })
}
