import { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'

export async function groupMember(
  request: FastifyRequest,
  reply: FastifyReply
) {
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

  if (!groupMember)
    return reply.status(403).send({
      status: false,
      error: 'GROUP_MEMBER_ROLE'
    })
}

export async function groupMemberByExpense(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const queryParams = z.object({
    id: z.string().cuid()
  })
  const { id } = queryParams.parse(request.params)

  const { sub: user_id } = request.user

  const groupMember = await prisma.member.findFirst({
    where: {
      user_id,
      group: {
        Expense: {
          some: {
            id
          }
        }
      }
    }
  })

  if (!groupMember)
    return reply.status(403).send({
      status: false,
      error: 'GROUP_MEMBER_ROLE'
    })
}
