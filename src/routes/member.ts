import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { User } from '@prisma/client'
import { inviteMember } from '../modules/invite'
import { groupAdmin } from '../plugins/groupAdmin'
import { groupMember } from '../plugins/groupMember'

export async function memberRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/groups/:id/members',
    {
      onRequest: [authenticate, groupMember]
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

      const members = await prisma.member.findMany({
        where: {
          group_id: id
        },
        include: {
          member: true
        }
      })
      return { members }
    }
  )

  fastify.get(
    '/recent-members',
    {
      onRequest: [authenticate]
    },
    async request => {
      const { sub: user_id } = request.user

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

      const members: User[] = []

      groups.forEach(({ Member }) => {
        Member.forEach(({ member }) => {
          if (
            !members.find(({ id }) => id === member.id) &&
            member.id !== user_id
          ) {
            members.push(member)
          }
        })
      })

      return { members }
    }
  )

  fastify.patch(
    '/groups/:id/members',
    {
      onRequest: [authenticate, groupAdmin]
    },
    async (request, reply) => {
      const createGroupBody = z.object({
        members: z.array(z.string().email())
      })

      const { members } = createGroupBody.parse(request.body)

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

      const { sub: user_id } = request.user
      const me = await prisma.user.findUniqueOrThrow({
        where: {
          id: user_id
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

        const groupMember = await prisma.member.findFirst({
          where: {
            group_id: id,
            user_id: user.id
          }
        })

        if (!groupMember) {
          await prisma.member.create({
            data: {
              group_id: group.id,
              user_id: user.id
            }
          })
          await inviteMember(me, user, group)
        }
      })

      const groupMembers = await prisma.member.findMany({
        where: {
          group_id: id
        },
        include: {
          member: true
        }
      })

      groupMembers.map(async groupMember => {
        const memberExists = members.includes(groupMember.member.email)
        if (!memberExists) {
          await prisma.member.delete({
            where: {
              group_id_user_id: {
                group_id: groupMember.group_id,
                user_id: groupMember.user_id
              }
            }
          })
        }
      })

      return {
        status: true
      }
    }
  )

  fastify.patch(
    '/groups/:id/members/:user_id/admin',
    {
      onRequest: [authenticate, groupAdmin]
    },
    async (request, reply) => {
      const body = z.object({
        member_id: z.string().cuid().nullable()
      })

      const { member_id } = body.parse(request.body)

      const queryParams = z.object({
        id: z.string().cuid(),
        user_id: z.string().cuid()
      })
      const { id, user_id } = queryParams.parse(request.params)

      const groupMember = await prisma.member.findUnique({
        where: {
          group_id_user_id: {
            group_id: id,
            user_id
          }
        }
      })

      if (!groupMember) return reply.status(404).send()

      if (groupMember.isAdmin === true) {
        const admins = await prisma.member.findMany({
          where: {
            isAdmin: true,
            group_id: id
          }
        })

        if (admins.length === 1) {
          if (member_id) {
            await prisma.member.update({
              data: {
                isAdmin: true
              },
              where: {
                group_id_user_id: {
                  group_id: id,
                  user_id: member_id
                }
              }
            })
          } else {
            await prisma.member.updateMany({
              data: {
                isAdmin: true
              },
              where: {
                group_id: id
              }
            })
          }
        }
      }

      await prisma.member.update({
        data: {
          isAdmin: !Boolean(groupMember.isAdmin)
        },
        where: {
          group_id_user_id: {
            group_id: id,
            user_id
          }
        }
      })

      return {
        status: true
      }
    }
  )

  fastify.delete(
    '/groups/:id/members/:user_id',
    {
      onRequest: [authenticate, groupAdmin]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string().cuid(),
        user_id: z.string().cuid()
      })
      const { id, user_id } = queryParams.parse(request.params)

      const groupMember = await prisma.member.findUnique({
        where: {
          group_id_user_id: {
            group_id: id,
            user_id
          }
        }
      })

      if (!groupMember) return reply.status(404).send()

      if (groupMember.isAdmin) {
        const admins = await prisma.member.findMany({
          where: {
            group_id: id,
            isAdmin: true
          }
        })

        if (admins.length === 1) {
          await prisma.member.updateMany({
            data: {
              isAdmin: true
            },
            where: {
              group_id: id
            }
          })
        }
      }

      await prisma.member.delete({
        where: {
          group_id_user_id: {
            group_id: id,
            user_id
          }
        }
      })

      return {
        status: true
      }
    }
  )
}
