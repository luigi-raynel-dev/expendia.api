import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function groupAdmin(request: FastifyRequest, reply: FastifyReply) {
  const queryParams = z.object({
    id: z.string().cuid()
  })
  const { id } = queryParams.parse(request.params)

  const { sub: user_id } = request.user

  const groupMember = await prisma.member.findUnique({
    where: {
      group_id_user_id: {
        group_id: id,
        user_id
      }
    }
  })

  if (groupMember?.isAdmin !== true)
    return reply.status(403).send({
      status: false,
      error: 'GROUP_ADMIN_ROLE'
    })
}
