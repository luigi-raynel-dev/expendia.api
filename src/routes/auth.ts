import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'
import { compareSync, genSaltSync, hashSync } from 'bcrypt'
import { User } from '@prisma/client'
import axios from 'axios'
import { acceptRequiredTerms } from '../modules/userTerms'
import { sendCode, validateCode } from '../modules/userCode'
import { sendConfirmationEmail } from '../modules/Welcome'

export const tokenGenerator = (
  { email, id }: User,
  fastify: FastifyInstance
) => {
  return fastify.jwt.sign(
    { email },
    {
      sub: id
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
    console.log(email)

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
        ...user,
        hasPassword: user.password !== null,
        password: undefined
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

    await acceptRequiredTerms(user.id)

    const confirmationEmail = await sendConfirmationEmail(user)

    return reply.status(201).send({
      status: true,
      confirmationEmail,
      message: 'Usuário cadastrado com sucesso.',
      token: tokenGenerator(user, fastify),
      user: {
        ...user,
        hasPassword: user.password !== null,
        password: undefined
      }
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

    let image = await axios.get(picture, { responseType: 'arraybuffer' })
    const avatarBase64 = Buffer.from(image.data).toString('base64')

    const userDataGoogle = {
      googleId: id,
      firstname: given_name,
      lastname: family_name,
      email,
      avatarBase64
    }
    let user = await prisma.user.findUnique({
      where: {
        email
      }
    })
    if (user)
      user = await prisma.user.update({
        data: {
          avatarBase64,
          avatarUri: `/avatar/${user.id}.jpg`
        },
        where: {
          id: user.id
        }
      })
    else {
      user = await prisma.user.create({
        data: userDataGoogle
      })
      user = await prisma.user.update({
        data: {
          avatarUri: `/avatar/${user.id}.jpg`
        },
        where: {
          id: user.id
        }
      })
    }

    acceptRequiredTerms(user.id)

    const token = tokenGenerator(user, fastify)
    return {
      status: true,
      token,
      user: {
        ...user,
        hasPassword: user.password !== null,
        password: undefined
      }
    }
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

    const resp = await sendCode(
      user,
      'Código para redefinição de senha',
      'redefinição da senha',
      'password-recovery'
    )

    return resp
  })

  fastify.post(
    '/confirm-email',
    {
      onRequest: [authenticate]
    },
    async request => {
      const createUserBody = z.object({
        code: z.string()
      })

      const { code } = createUserBody.parse(request.body)

      const { sub: user_id } = request.user

      const userCode = await validateCode(user_id, code)

      if (!userCode)
        return {
          status: false,
          error: 'INVALID_CODE'
        }

      await prisma.user.update({
        data: {
          confirmedEmail: true
        },
        where: {
          id: user_id
        }
      })

      return {
        status: true
      }
    }
  )

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

    const userCode = await validateCode(user.id, code)

    return {
      status: userCode !== null,
      token: userCode ? tokenGenerator(user, fastify) : undefined,
      user: !userCode
        ? undefined
        : {
            ...user,
            hasPassword: user.password !== null,
            password: undefined
          }
    }
  })

  fastify.post(
    '/request-account-deletion',
    {
      onRequest: [authenticate]
    },
    async request => {
      const { sub: user_id } = request.user

      const user = await prisma.user.findUniqueOrThrow({
        where: { id: user_id }
      })

      const resp = await sendCode(
        user,
        'Código para exclusão da sua conta',
        'exclusão da sua conta',
        'delete-account'
      )
      return resp
    }
  )

  fastify.post(
    '/delete-account',
    {
      onRequest: [authenticate]
    },
    async request => {
      const createUserBody = z.object({
        code: z.string()
      })

      const { code } = createUserBody.parse(request.body)

      const { sub: user_id } = request.user

      const userCode = await validateCode(user_id, code)

      if (!userCode)
        return {
          status: false,
          error: 'INVALID_CODE'
        }

      await prisma.user.update({
        data: {
          firstname: 'Usuário',
          lastname: 'Anônimo',
          email: `anonym_${user_id}@expendia.luigiraynel.com.br`,
          password: null,
          avatarBase64: null,
          avatarUri: null,
          googleId: null,
          confirmedEmail: false
        },
        where: {
          id: user_id
        }
      })

      return {
        status: true
      }
    }
  )

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
