import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import dayjs from 'dayjs'

export async function expenseRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/groups/:id/expenses',
    {
      onRequest: [authenticate]
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

      const { sub: user_id } = request.user

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
        }
      })
      return { expenses }
    }
  )

  fastify.get(
    '/expenses/:id',
    {
      onRequest: [authenticate]
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
      onRequest: [authenticate]
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

      payers.map(async payer => {
        const user = await prisma.user.findUnique({
          where: {
            email: payer.email
          }
        })
        if (user) {
          await prisma.paying.create({
            data: {
              user_id: user.id,
              cost: payer.cost,
              expense_id: expense.id,
              paid: false
            }
          })
        }
      })

      return reply.status(201).send({
        status: true,
        expense
      })
    }
  )

  fastify.put(
    '/expenses/:id',
    {
      onRequest: [authenticate]
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

      const updatedAt = dayjs().format()

      await prisma.expense.update({
        data: {
          title,
          cost,
          dueDate,
          createdAt: expense?.createdAt,
          updatedAt
        },
        where: {
          id
        }
      })
      const olds: any[] = []
      payers.map(async payer => {
        const user = await prisma.user.findUnique({
          where: {
            email: payer.email
          }
        })
        if (user) {
          const expensePayer = await prisma.paying.findUnique({
            where: {
              expense_id_user_id: {
                expense_id: expense?.id,
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
                    expense_id: expense?.id,
                    user_id: user.id
                  }
                }
              })
            } else {
              await prisma.paying.delete({
                where: {
                  expense_id_user_id: {
                    expense_id: expense?.id,
                    user_id: user.id
                  }
                }
              })
            }
          } else {
            await prisma.paying.create({
              data: {
                cost: payer.cost,
                user_id: user.id,
                expense_id: expense?.id,
                paid: false
              }
            })
          }
        }
      })

      return reply.status(200).send({
        status: true,
        olds,
        payers
      })
    }
  )

  fastify.patch(
    '/expenses/:id',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        userId: z.string().cuid(),
        paid: z.boolean(),
        paidAt: z.string().nullable()
      })

      const { paid, paidAt, userId } = createGroupBody.parse(request.body)

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

      await prisma.paying.update({
        data: {
          paid,
          paidAt
        },
        where: {
          expense_id_user_id: {
            expense_id: id,
            user_id: userId
          }
        }
      })

      return reply.status(200).send({
        status: true
      })
    }
  )

  fastify.delete(
    '/expenses/:id',
    {
      onRequest: [authenticate]
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
}
