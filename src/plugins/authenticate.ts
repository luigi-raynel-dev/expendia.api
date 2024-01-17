import { FastifyReply, FastifyRequest } from 'fastify'
import { prisma } from '../lib/prisma'

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await request.jwtVerify()

  const { sub: user_id } = request.user

  const user = await prisma.user.findUnique({
    where: { id: user_id }
  })

  if (!user)
    return reply.status(401).send({
      status: false,
      error: 'Unauthorized',
      message: "The user doesn't exist in our database"
    })
}
