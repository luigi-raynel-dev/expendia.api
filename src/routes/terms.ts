import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { sysadmin } from '../plugins/sysadmin'

export async function termsRoutes(fastify: FastifyInstance) {
  fastify.get('/terms', async () => {
    const terms = await prisma.term.findMany()

    return { terms }
  })

  fastify.get('/terms/:slug', async (request, reply) => {
    const queryParams = z.object({
      slug: z.string()
    })
    const { slug } = queryParams.parse(request.params)

    const term = await prisma.term.findUnique({
      where: {
        slug
      }
    })

    if (!term) reply.status(404).send()

    return { term }
  })

  fastify.get(
    '/user/terms/:slug',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const queryParams = z.object({
        slug: z.string()
      })
      const { slug } = queryParams.parse(request.params)

      const { sub: user_id } = request.user

      const term = await prisma.term.findUnique({
        where: {
          slug
        }
      })

      if (!term) return reply.status(404).send()

      let userTerm = await prisma.userTerm.findUnique({
        where: {
          user_id_term_id: {
            term_id: term.id,
            user_id
          }
        }
      })

      if (!userTerm) {
        userTerm = await prisma.userTerm.create({
          data: {
            accepted: null,
            acceptedAt: null,
            term_id: term.id,
            user_id
          }
        })
      }

      return { userTerm }
    }
  )

  fastify.patch(
    '/user/terms/:slug',
    {
      onRequest: [authenticate]
    },
    async (request, reply) => {
      const queryParams = z.object({
        slug: z.string()
      })
      const { slug } = queryParams.parse(request.params)

      const createBody = z.object({
        accepted: z.boolean().nullable()
      })
      const { accepted } = createBody.parse(request.body)

      const { sub: user_id } = request.user

      const term = await prisma.term.findUnique({
        where: {
          slug
        }
      })

      if (!term) return reply.status(404).send()

      let userTerm = await prisma.userTerm.findUnique({
        where: {
          user_id_term_id: {
            term_id: term.id,
            user_id
          }
        }
      })

      const data = {
        accepted,
        acceptedAt: accepted === true ? new Date() : null,
        term_id: term.id,
        user_id
      }

      if (!userTerm) {
        userTerm = await prisma.userTerm.create({
          data
        })
      } else {
        userTerm = await prisma.userTerm.update({
          data,
          where: {
            user_id_term_id: {
              term_id: term.id,
              user_id
            }
          }
        })
      }

      return { userTerm }
    }
  )

  fastify.post(
    '/terms',
    {
      onRequest: [authenticate, sysadmin]
    },
    async request => {
      const createBody = z.object({
        title: z.string().min(2),
        slug: z.string().min(2),
        text: z.string().min(2)
      })
      const { title, slug, text } = createBody.parse(request.body)

      await prisma.term.create({
        data: {
          title: title,
          slug: slug,
          text: text
        }
      })

      return {
        status: true
      }
    }
  )

  fastify.put(
    '/terms/:id',
    {
      onRequest: [authenticate, sysadmin]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string()
      })
      const { id } = queryParams.parse(request.params)

      const createBody = z.object({
        title: z.string().min(2).nullable(),
        slug: z.string().min(2).nullable(),
        text: z.string().min(2).nullable()
      })
      const { title, slug, text } = createBody.parse(request.body)

      const term = await prisma.term.findUnique({ where: { id } })

      if (!term) return reply.status(404).send()

      await prisma.term.update({
        data: {
          title: title || term.title,
          slug: slug || term.slug,
          text: text || term.text,
          updatedAt: text !== term.text ? new Date() : term.updatedAt
        },
        where: { id }
      })

      return {
        status: true
      }
    }
  )

  fastify.delete(
    '/terms/:id',
    {
      onRequest: [authenticate, sysadmin]
    },
    async (request, reply) => {
      const queryParams = z.object({
        id: z.string()
      })
      const { id } = queryParams.parse(request.params)

      const term = await prisma.term.findUnique({ where: { id } })

      if (!term) return reply.status(404).send()

      await prisma.term.delete({ where: { id } })

      return {
        status: true
      }
    }
  )
}
