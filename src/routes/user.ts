import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { promisify } from 'util'
import { createWriteStream } from 'fs'
import { pipeline } from 'stream'
import { extension } from 'mime-types'

export async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/user/:email',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const queryParams = z.object({
        email: z.string().email()
      })
      const { email } = queryParams.parse(request.params)

      const user = await prisma.user.findUnique({
        where: {
          email
        }
      })

      if (!user) return reply.status(404).send()

      return { user }
    }
  )

  fastify.patch(
    '/profile',
    {
      onRequest: [authenticate]
    },
    async request => {
      const createUserBody = z.object({
        firstname: z.string().min(2).nullable(),
        lastname: z.string().min(2).nullable(),
        email: z.string().email().nullable()
      })
      const { firstname, lastname, email } = createUserBody.parse(request.body)

      const { sub: id } = request.user

      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id
        }
      })

      await prisma.user.update({
        data: {
          firstname: firstname || user.firstname,
          lastname: lastname || user.lastname,
          email: email || user.email
        },
        where: { id }
      })

      return {
        status: true
      }
    }
  )

  fastify.patch(
    '/avatar',
    {
      onRequest: [authenticate]
    },
    async request => {
      const data = await request.file()

      if (!data)
        return {
          status: false
        }

      const { sub: id } = request.user

      const ext = extension(data.mimetype)
      const avatarUrl = `uploads/avatars/${id}.${ext}`
      const pump = promisify(pipeline)
      pump(data.file, createWriteStream(avatarUrl))

      const user = await prisma.user.findUniqueOrThrow({
        where: {
          id
        }
      })

      await prisma.user.update({
        data: {
          avatarUrl
        },
        where: { id }
      })

      return {
        status: true
      }
    }
  )
}
