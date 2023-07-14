import Fastify from 'fastify'
import fastifyEnv from '@fastify/env'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import './lib/dayjs'
import { authRoutes } from './routes/auth'
import { groupRoutes } from './routes/group'
import { memberRoutes } from './routes/member'
import { expenseRoutes } from './routes/expense'
import { userRoutes } from './routes/user'

const schema = {
  type: 'object',
  required: [
    'JWT_KEY',
    'GOOGLE_PROFILE_URL',
    'SMTP_HOST',
    'SMTP_AUTH_USER',
    'SMTP_AUTH_PASS'
  ],
  properties: {
    JWT_KEY: {
      type: 'string'
    },
    GOOGLE_PROFILE_URL: {
      type: 'string'
    },
    SMTP_HOST: {
      type: 'string'
    },
    SMTP_PORT: {
      type: 'string'
    },
    SMTP_IGNORE_TLS: {
      type: 'string'
    },
    SMTP_AUTH_USER: {
      type: 'string'
    },
    SMTP_AUTH_PASS: {
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
  await fastify.register(userRoutes)
  await fastify.register(groupRoutes)
  await fastify.register(memberRoutes)
  await fastify.register(expenseRoutes)

  await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap()
