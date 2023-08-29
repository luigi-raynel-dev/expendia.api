import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { promisify } from 'util'
import { createWriteStream, readFileSync } from 'fs'
import { pipeline } from 'stream'
import { extension, lookup } from 'mime-types'

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
      const { sub: id } = request.user

      const data = await request.file()
      let avatarUrl: null | string = null

      if (data) {
        const ext = extension(data.mimetype)
        const path = `uploads/avatars/${id}.${ext}`
        const pump = promisify(pipeline)
        pump(data.file, createWriteStream(path))
        avatarUrl = `${process.env.APP_URL}/${path}`
      }

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

  fastify.get('/uploads/avatars/:filename', async (request, reply) => {
    const queryParams = z.object({
      filename: z.string()
    })
    const { filename } = queryParams.parse(request.params)

    const path = `uploads/avatars/${filename}`
    const buffer = readFileSync(path)

    reply.type(lookup(path) || 'text/html').send(buffer)
  })
}
