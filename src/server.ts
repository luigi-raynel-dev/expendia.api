import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import './lib/dayjs'
import { authRoutes } from './routes/auth'
import { groupRoutes } from './routes/group'
import { memberRoutes } from './routes/member'
import { expenseRoutes } from './routes/expense'

const schema = {
  type: 'object',
  required: ['JWT_KEY'],
  properties: {
    JWT_KEY: {
      type: 'string'
    }
  }
}

const options = {
  confKey: 'config',
  schema,
  dotenv: true,
  data: process.env
}

async function bootstrap() {
  const fastify = Fastify({
    logger: true
  })

  await fastify.register(fastifyEnv, options)
  await fastify.after()

  await fastify.register(cors, {
    origin: true
  })

  await fastify.register(jwt, {
    secret: process.env.JWT_KEY || ''
  })

  await fastify.register(authRoutes)
  await fastify.register(groupRoutes)
  await fastify.register(memberRoutes)
  await fastify.register(expenseRoutes)

  await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap()
