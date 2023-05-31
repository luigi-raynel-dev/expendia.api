import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { tokenGenerator } from './auth'
import { Group, Member } from '@prisma/client'

interface GroupMembers extends Group {
  members?: Member[]
}

export async function groupRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/groups',
    {
      onRequest: [authenticate]
    },
    async request => {
      const { sub: user_id, email } = request.user
      const groups: GroupMembers[] = await prisma.group.findMany({
        include: {
          Member: {
            where: {
              user_id
            }
          }
        }
      })

      groups.map(async (group, index) => {
        groups[index].members = await prisma.member.findMany({
          include: {
            member: {
              select: {
                id: true,
                email: true,
                firstname: true,
                lastname: true,
                avatarUrl: true
              }
            }
          },
          where: {
            group_id: group.id
          }
        })
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
      onRequest: [authenticate]
    },
    async request => {
      const queryParams = z.object({
        id: z.string().cuid()
      })
      const { id } = queryParams.parse(request.params)

      const group = await prisma.group.findUnique({
        where: {
          id
        }
      })

      const members = await prisma.member.findMany({
        where: {
          group_id: id
        },
        include: {
          member: true
        }
      })

      return { group, members }
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
      const group = await prisma.group.create({
        data: {
          title,
          user_id
        }
      })

      await prisma.member.create({
        data: {
          group_id: group.id,
          user_id
        }
      })

      members.map(async member => {
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
      })

      return reply.status(201).send({
        status: true,
        group_id: group.id
      })
    }
  )

  fastify.put(
    '/groups/:id',
    {
      onRequest: [authenticate]
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
      onRequest: [authenticate]
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

      await prisma.member.deleteMany({
        where: {
          group_id: id
        }
      })

      await prisma.group.deleteMany({
        where: {
          id
        }
      })

      return {
        status: true
      }
    }
  )
}
