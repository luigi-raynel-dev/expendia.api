import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'

export async function sysadmin(request: FastifyRequest, reply: FastifyReply) {
  const { sub: user_id } = request.user

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: user_id }
  })

  if (!user.isAdmin) return reply.status(403).send()
}
