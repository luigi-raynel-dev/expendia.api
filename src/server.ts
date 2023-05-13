import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import './lib/dayjs'
import { authRoutes } from './routes/auth'
import { groupRoutes } from './routes/group'
import { memberRoutes } from './routes/member'
import { expenseRoutes } from './routes/expense'

async function bootstrap() {
  const fastify = Fastify({
    logger: true
  })

  await fastify.register(cors, {
    origin: true
  })

  await fastify.register(jwt, {
    secret: '437bsidbscdy0832y0bUBUSBCHVP'
  })

  await fastify.register(authRoutes)
  await fastify.register(groupRoutes)
  await fastify.register(memberRoutes)
  await fastify.register(expenseRoutes)

  await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap()
