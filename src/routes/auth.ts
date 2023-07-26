import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { User } from '@prisma/client'
import { sendMail } from '../lib/nodemailer'
import cryptoRandomString from 'crypto-random-string'
import { emailTemplate } from '../lib/emailTemplate'
import dayjs from 'dayjs'

export const tokenGenerator = (
  { firstname, lastname, avatarUrl, email, id }: User,
  fastify: FastifyInstance
) => {
  return fastify.jwt.sign(
    { firstname, lastname, avatarUrl, email },
    {
      sub: id,
      expiresIn: `${process.env.JWT_EXP_DAYS} days`
    }
  )
}

export async function authRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/me',
    {
      onRequest: [authenticate]
    },
    async request => {
      return { user: request.user }
    }
  )

  fastify.post('/sign-in', async request => {
    const createUserBody = z.object({
      email: z.string().email(),
      password: z.string()
    })

    const { email, password } = createUserBody.parse(request.body)

    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || (!user.password && !user.googleId))
      return {
        status: false,
        message: 'Usuário não existe.',
        error: 'USER_DOES_NOT_EXIST'
      }

    if (!user.password && user.googleId)
      return {
        status: false,
        message: 'Usuário autenticado com o Google.',
        error: 'USER_AUTHENTICATED_WITH_GOOGLE'
      }

    if (!compareSync(password, user?.password || ''))
      return {
        status: false,
        message: 'Senha inválida.',
        error: 'INVALID_PASSWORD'
      }

    return {
      status: true,
      token: tokenGenerator(user, fastify),
      user: {
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatarUrl: user.avatarUrl
      }
    }
  })

  fastify.post('/sign-up', async (request, reply) => {
    const createUserBody = z.object({
      firstname: z.string().min(3),
      lastname: z.string().min(3),
      email: z.string().email(),
      password: z.string().min(6)
    })
    const { firstname, lastname, email, password } = createUserBody.parse(
      request.body
    )
    let user = await prisma.user.findUnique({
      where: { email }
    })
    if (user && (user.password || user.googleId))
      return {
        status: false,
        message: user.googleId
          ? 'Usuário autenticado com o Google.'
          : 'Usuário já cadastrado.',
        error: user.googleId
          ? 'USER_AUTHENTICATED_WITH_GOOGLE'
          : 'USER_ALREADY_EXISTS'
      }
    const hash = hashSync(password, genSaltSync(10))
    const data = {
      firstname,
      lastname,
      email,
      password: hash
    }
    user =
      user && !user.password
        ? await prisma.user.update({
            data,
            where: {
              email
            }
          })
        : await prisma.user.create({ data })
    return reply.status(201).send({
      status: true,
      message: 'Usuário cadastrado com sucesso.',
      token: tokenGenerator(user, fastify)
    })
  })

  fastify.post('/google-auth', async request => {
    const createUserBody = z.object({
      accessToken: z.string()
    })
    const { accessToken } = createUserBody.parse(request.body)
    const userResponse = await fetch(process.env.GOOGLE_PROFILE_URL || '', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    })
    const userData = await userResponse.json()
    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      given_name: z.string(),
      family_name: z.string(),
      picture: z.string().url()
    })
    const { id, email, given_name, family_name, picture } =
      userInfoSchema.parse(userData)
    let user = await prisma.user.findUnique({
      where: {
        googleId: id
      }
    })
    if (!user) {
      const userDataGoogle = {
        googleId: id,
        firstname: given_name,
        lastname: family_name,
        email: email,
        avatarUrl: picture
      }
      const userVerify = await prisma.user.findUnique({
        where: {
          email
        }
      })
      if (userVerify) {
        user = await prisma.user.update({
          data: userDataGoogle,
          where: {
            email
          }
        })
      } else {
        user = await prisma.user.create({
          data: userDataGoogle
        })
      }
    }
    const token = tokenGenerator(user, fastify)
    return { status: true, token, user }
  })

  fastify.post('/password-recovery', async request => {
    const createUserBody = z.object({
      email: z.string().email()
    })
    const { email } = createUserBody.parse(request.body)
    let user = await prisma.user.findUnique({
      where: { email }
    })
    if (!user || !user.password)
      return {
        status: false,
        message: 'Usuário não existe.',
        error: 'USER_DOES_NOT_EXIST'
      }
    const code = cryptoRandomString({ length: 5, type: 'numeric' })
    const html = `
    <p>Recebemos uma solicitação para redefinição da senha.</p>
    <div style="background: #ddd;padding: 10px; text-align: center;">
      <h2>${code}</h2>
    </div>
    <p>Por favor, utilize este código acima para redefinir sua senha no nosso app.</p>
    <p>Se você não solicitou a redefinição de senha, ignore este e-mail.</p>
    `
    const code_request_type = await prisma.codeRequestType.findUnique({
      where: {
        slug: 'password-recovery'
      }
    })
    await prisma.userCode.create({
      data: {
        code,
        code_request_type_id: code_request_type!.id,
        user_id: user.id,
        expiresIn: dayjs().add(30, 'minute').toISOString()
      }
    })
    sendMail(
      {
        to: email,
        subject: 'TrooPay - Código para redefinição de senha',
        html: emailTemplate(
          'Código para redefinição de senha',
          `${user.firstname} ${user.lastname}`,
          html
        )
      },
      (error, info) => {
        if (error) console.log(error)
        else console.log(info)
      }
    )
    return {
      status: true
    }
  })

  fastify.post('/validate-code', async request => {
    const createUserBody = z.object({
      code: z.string(),
      email: z.string().email()
    })

    const { code, email } = createUserBody.parse(request.body)

    let user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !user.password)
      return {
        status: false,
        message: 'Usuário não existe.',
        error: 'USER_DOES_NOT_EXIST'
      }

    const userCode = await prisma.userCode.findFirst({
      where: {
        user_id: user.id,
        code,
        validatedIn: null,
        expiresIn: {
          gte: new Date()
        }
      }
    })

    if (userCode) {
      await prisma.userCode.update({
        data: {
          validatedIn: new Date()
        },
        where: {
          id: userCode.id
        }
      })
    }

    return {
      status: userCode !== null,
      token: userCode ? tokenGenerator(user, fastify) : undefined,
      user: userCode ? user : undefined
    }
  })

  fastify.patch(
    '/password',
    {
      onRequest: [authenticate]
    },
    async request => {
      const createUserBody = z.object({
        password: z.string().min(6)
      })
      const { password } = createUserBody.parse(request.body)
      const { sub: id } = request.user
      const hash = hashSync(password, genSaltSync(10))

      await prisma.user.update({
        data: {
          password: hash
        },
        where: { id }
      })

      return {
        status: true
      }
    }
  )
}
