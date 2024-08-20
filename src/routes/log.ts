import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authenticate } from '../plugins/authenticate'
import { sysadmin } from '../plugins/sysadmin'
import { cleanOldLogs } from '../logs/logger'

export async function logRoutes(fastify: FastifyInstance) {
  fastify.delete(
    '/oldLogs',
    {
      onRequest: [authenticate, sysadmin]
    },
    async (request, reply) => {
      const bodyScheme = z.object({
        daysLimit: z.number()
      })

      const { daysLimit } = bodyScheme.parse(request.body)

      cleanOldLogs(daysLimit)

      return reply.status(200).send({
        status: true
      })
    }
  )
}
