import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { sysadmin } from '../plugins/sysadmin'

export async function pushNotificationRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/pushToken',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const createBody = z.object({
        token: z.string()
      })

      const { token } = createBody.parse(request.body)

      const { sub: user_id } = request.user

      let notificationToken = await prisma.notificationToken.findUnique({
        where: { token }
      })
      if (notificationToken)
        notificationToken = await prisma.notificationToken.update({
          data: {
            user_id
          },
          where: {
            token
          }
        })
      else
        notificationToken = await prisma.notificationToken.create({
          data: {
            token,
            user_id
          }
        })

      return reply.send({
        status: true,
        notificationToken
      })
    }
  )

  fastify.post(
    '/getNotificationFromFCM',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const bodyScheme = z.object({
        notificationId: z.string()
      })

      const { notificationId } = bodyScheme.parse(request.body)

      const { sub: user_id } = request.user

      const notification = await prisma.notification.findFirst({
        where: {
          notificationId,
          notificationToken: {
            user_id
          }
        }
      })

      if (!notification)
        return reply.status(404).send({
          status: false,
          error: 'notification.not.found'
        })

      return reply.send({
        status: true,
        notification
      })
    }
  )
}
