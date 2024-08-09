import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { tokenGenerator } from './auth'
import { groupAdmin } from '../plugins/groupAdmin'
import { groupMember } from '../plugins/groupMember'
import { newGroupNotification } from '../modules/notifications'

export async function groupRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/groups',
    {
      onRequest: [authenticate]
    },
    async request => {
      const { sub: user_id, email } = request.user
      const groups = await prisma.group.findMany({
        include: {
          Member: {
            include: {
              member: true
            }
          }
        },
        where: {
          Member: {
            some: {
              user_id
            }
          }
        }
      })

      const user = await prisma.user.findUnique({
        where: { email }
      })

      return {
        groups,
        token: user ? tokenGenerator(user, fastify) : false
      }
    }
  )

  fastify.get(
    '/groups/:id',
    {
      onRequest: [authenticate, groupMember]
    },
    async request => {
      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const group = await prisma.group.findUnique({
        where: {
          id
        },
        include: {
          Member: {
            include: {
              member: true
            }
          }
        }
      })

      return { group }
    }
  )

  fastify.post(
    '/groups',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        title: z.string(),
        members: z.array(z.string().email())
      })

      const { title, members } = createGroupBody.parse(request.body)

      const { sub: user_id } = request.user
      const me = await prisma.user.findUniqueOrThrow({
        where: {
          id: user_id
        }
      })

      const group = await prisma.group.create({
        data: {
          title,
          user_id
        }
      })

      await prisma.member.create({
        data: {
          group_id: group.id,
          user_id,
          isAdmin: true
        }
      })

      for (const member of members) {
        let user = await prisma.user.findUnique({
          where: {
            email: member
          }
        })

        if (!user)
          user = await prisma.user.create({
            data: {
              email: member
            }
          })

        await prisma.member.create({
          data: {
            group_id: group.id,
            user_id: user.id
          }
        })

        await newGroupNotification(me, user, group)
      }

      return reply.status(201).send({
        status: true,
        group_id: group.id
      })
    }
  )

  fastify.patch(
    '/groups/:id',
    {
      onRequest: [authenticate, groupAdmin]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        title: z.string()
      })

      const { title } = createGroupBody.parse(request.body)

      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const group = await prisma.group.findUnique({
        where: {
          id
        }
      })

      if (!group) return reply.status(404).send()

      await prisma.group.update({
        data: {
          title
        },
        where: {
          id
        }
      })

      return {
        status: true
      }
    }
  )

  fastify.delete(
    '/groups/:id',
    {
      onRequest: [authenticate, groupAdmin]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const group = await prisma.group.findUnique({
        where: {
          id
        }
      })

      if (!group) return reply.status(404).send()

      await prisma.group.delete({ where: { id } })

      return {
        status: true
      }
    }
  )
}
