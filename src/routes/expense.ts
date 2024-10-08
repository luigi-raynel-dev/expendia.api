import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import dayjs from 'dayjs'
import { groupMember, groupMemberByExpense } from '../plugins/groupMember'
import {
  expensePaymentNotification,
  expensesExpirationNotification,
  fullyPaidExpenseNotification,
  newExpenseNotification
} from '../modules/notifications'
import { sysadmin } from '../plugins/sysadmin'

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/groups/:id/expenses',
    {
      onRequest: [authenticate, groupMember]
    },
    async (request, reply) => {
      const getDayParams = z.object({
        month: z.string(),
        year: z.string()
      })

      const { month, year } = getDayParams.parse(request.query)

      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const group = await prisma.group.findUnique({
        where: {
          id
        }
      })

      if (!group) return reply.status(404).send()

      const date = dayjs(`${year}-${month}`, 'YYYY-MM')

      const expenses = await prisma.expense.findMany({
        where: {
          group_id: id,
          dueDate: {
            gte: date.startOf('month').toDate(),
            lt: date.endOf('month').toDate()
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
      return { expenses }
    }
  )

  fastify.get(
    '/expenses/:id',
    {
      onRequest: [authenticate, groupMemberByExpense]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const expense = await prisma.expense.findUnique({
        where: {
          id
        },
        include: {
          Paying: {
            include: {
              paying: true
            }
          }
        }
      })

      if (!expense) return reply.status(404).send()
      return { expense }
    }
  )

  fastify.post(
    '/groups/:id/expenses',
    {
      onRequest: [authenticate, groupMember]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        title: z.string(),
        cost: z.number(),
        dueDate: z.string().nullable(),
        payers: z.array(
          z.object({
            email: z.string().email(),
            cost: z.number()
          })
        )
      })

      const { title, cost, dueDate, payers } = createGroupBody.parse(
        request.body
      )

      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const { sub: user_id } = request.user
      const me = await prisma.user.findUniqueOrThrow({
        where: { id: user_id }
      })

      const group = await prisma.group.findUnique({
        where: {
          id
        }
      })

      if (!group) return reply.status(404).send()

      const expense = await prisma.expense.create({
        data: {
          group_id: id,
          title,
          cost,
          dueDate,
          user_id
        }
      })

      for (const payer of payers) {
        const user = await prisma.user.findUnique({
          where: {
            email: payer.email
          }
        })
        if (user) {
          const paying = await prisma.paying.create({
            data: {
              user_id: user.id,
              cost: payer.cost,
              expense_id: expense.id,
              paid: false
            }
          })
          await newExpenseNotification(me, user, paying, expense)
        }
      }

      return reply.status(201).send({
        status: true,
        expense
      })
    }
  )

  fastify.put(
    '/expenses/:id',
    {
      onRequest: [authenticate, groupMemberByExpense]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        title: z.string(),
        cost: z.number(),
        dueDate: z.string().nullable(),
        payers: z.array(
          z.object({
            email: z.string().email(),
            cost: z.number()
          })
        )
      })

      const { title, cost, dueDate, payers } = createGroupBody.parse(
        request.body
      )

      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const expense = await prisma.expense.findUnique({
        where: {
          id
        }
      })

      if (!expense) return reply.status(404).send()

      const { sub: user_id } = request.user
      const me = await prisma.user.findUniqueOrThrow({
        where: { id: user_id }
      })

      const updatedAt = dayjs().format()

      await prisma.expense.update({
        data: {
          title,
          cost,
          dueDate,
          createdAt: expense.createdAt,
          updatedAt
        },
        where: {
          id
        }
      })

      for (const payer of payers) {
        const user = await prisma.user.findUnique({
          where: {
            email: payer.email
          }
        })
        if (user) {
          const expensePayer = await prisma.paying.findUnique({
            where: {
              expense_id_user_id: {
                expense_id: expense.id,
                user_id: user.id
              }
            }
          })
          if (expensePayer) {
            if (payer.cost > 0.0) {
              await prisma.paying.update({
                data: {
                  cost: payer.cost
                },
                where: {
                  expense_id_user_id: {
                    expense_id: expense.id,
                    user_id: user.id
                  }
                }
              })
            } else {
              await prisma.paying.delete({
                where: {
                  expense_id_user_id: {
                    expense_id: expense.id,
                    user_id: user.id
                  }
                }
              })
            }
          } else {
            const paying = await prisma.paying.create({
              data: {
                cost: payer.cost,
                user_id: user.id,
                expense_id: expense.id,
                paid: false
              }
            })

            await newExpenseNotification(me, user, paying, expense)
          }
        }
      }

      const expensePayers = await prisma.paying.findMany({
        where: {
          expense_id: expense.id
        },
        include: {
          paying: true
        }
      })

      for (const { paying } of expensePayers) {
        const payerExists =
          payers.find(({ email }) => email === paying.email) !== undefined

        if (!payerExists)
          await prisma.paying.delete({
            where: {
              expense_id_user_id: {
                expense_id: expense.id,
                user_id: paying.id
              }
            }
          })
      }

      return reply.status(200).send({
        status: true,
        payers
      })
    }
  )

  fastify.patch(
    '/expenses/:id',
    {
      onRequest: [authenticate, groupMemberByExpense]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        email: z.string().email(),
        paid: z.boolean(),
        paidAt: z.string().nullable()
      })

      const { paid, paidAt, email } = createGroupBody.parse(request.body)

      const { sub: user_id } = request.user
      const me = await prisma.user.findUniqueOrThrow({
        where: { id: user_id }
      })

      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const expense = await prisma.expense.findUnique({
        where: {
          id
        }
      })

      if (!expense) return reply.status(404).send()

      const user = await prisma.user.findUniqueOrThrow({
        where: { email }
      })

      await prisma.paying.update({
        data: {
          paid,
          paidAt
        },
        where: {
          expense_id_user_id: {
            expense_id: id,
            user_id: user.id
          }
        }
      })

      const paying = await prisma.paying.findMany({
        where: { expense_id: id },
        include: {
          paying: true
        }
      })

      if (paying.filter(({ paid }) => paid === false).length === 0) {
        for (const payer of paying) {
          if (payer.paying.id !== me.id)
            await fullyPaidExpenseNotification(payer.paying, expense)
        }
      } else if (paid) {
        for (const payer of paying) {
          if (payer.paying.id !== me.id)
            await expensePaymentNotification(me, user, payer.paying, expense)
        }
      }

      return reply.status(200).send({
        status: true
      })
    }
  )

  fastify.delete(
    '/expenses/:id',
    {
      onRequest: [authenticate, groupMemberByExpense]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const expense = await prisma.expense.findUnique({
        where: {
          id
        }
      })

      if (!expense) return reply.status(404).send()

      await prisma.paying.deleteMany({
        where: {
          expense_id: id
        }
      })

      await prisma.expense.delete({
        where: {
          id
        }
      })

      return reply.status(200).send({
        status: true
      })
    }
  )

  fastify.post(
    '/expenses/expiration/notification',
    {
      onRequest: [authenticate, sysadmin]
    },
    async (request, reply) => {
      const bodyScheme = z.object({
        gte: z.number(),
        lt: z.number()
      })

      const { gte, lt } = bodyScheme.parse(request.body)

      await expensesExpirationNotification(gte, lt)

      return reply.status(200).send({
        status: true
      })
    }
  )
}
