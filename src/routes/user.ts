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
    async (request, reply) => {
      const createBody = z.object({
        avatar: z.string().nullable()
      })
      const { avatar } = createBody.parse(request.body)

      const { sub: id } = request.user

      let avatarUrl: null | string = null
      if (avatar) {
        const filename = id + getCurrentDateTimeInBase64()
        const path = `uploads/avatars/${filename}.jpg`
        const imageData = Buffer.from(avatar, 'base64')
        writeFile(path, imageData, error => {
          if (error) console.error(error)
        })
        avatarUrl = `${process.env.APP_URL}/${path}`
      }

      await prisma.user.update({
        data: {
          avatarUrl
        },
        where: { id }
      })

      return {
        status: true,
        avatarUrl
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
