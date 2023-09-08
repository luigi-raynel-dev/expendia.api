import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { readFileSync, writeFile } from 'fs'
import { lookup } from 'mime-types'
import { getCurrentDateTimeInBase64 } from '../helpers/datetime'

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

      if (email && email !== user.email) {
        const emailRegistered = await prisma.user.findUnique({
          where: {
            email
          }
        })

        if (emailRegistered)
          return {
            status: false,
            error: 'EMAIL_ALREADY_REGISTERED'
          }
      }

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
      const createBody = z.object({
        avatar: z.string().nullable()
      })
      const { avatar } = createBody.parse(request.body)

      const { sub: id } = request.user
      const avatarUri = `/avatar/${id}.jpg`

      await prisma.user.update({
        data: {
          avatarBase64: avatar,
          avatarUri
        },
        where: { id }
      })

      return {
        status: true,
        avatarUri
      }
    }
  )

  fastify.get('/avatar/:id', async (request, reply) => {
    const queryParams = z.object({
      id: z.string()
    })
    const { id } = queryParams.parse(request.params)

    try {
      const { avatarBase64 } = await prisma.user.findFirstOrThrow({
        select: { avatarBase64: true },
        where: { avatarUri: `/avatar/${id}` }
      })

      if (avatarBase64) {
        const buffer = Buffer.from(avatarBase64, 'base64')
        reply.type('image/jpeg').send(buffer)
      } else {
        reply.status(404).send()
      }
    } catch (err) {
      reply.status(404).send()
    }
  })
}
