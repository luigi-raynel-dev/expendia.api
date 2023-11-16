import randomatic from 'randomatic'
import { prisma } from '../lib/prisma'
import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { sendMail } from '../lib/nodemailer'
import { emailTemplate } from '../lib/emailTemplate'

export type BodyType = {
  html?: string
  start?: string
  helloLabel?: string
  title?: string | null
  helper?: string | null
  ignoreEmailText?: string | null
  expirationText?: string | null
  end?: string
}

export const sendCode = async (
  user: User,
  title: string,
  subtitle: string,
  slug: string,
  body?: BodyType,
  digits?: number
) => {
  const code = randomatic('0', digits || 5)

  const html =
    body?.html ||
    `
    ${body?.start || ''}
    ${
      body?.title !== null
        ? `<p>${
            body?.title || `Recebemos uma solicitação para ${subtitle}`
          }</p>`
        : ''
    }
    <div style="background: #ddd;padding: 10px; text-align: center;">
      <h2>${code}</h2>
    </div>
    ${
      body?.helper !== null
        ? `<p>${
            body?.helper ||
            `Por favor, utilize este código acima para confirmar a ${subtitle} no nosso aplicativo.`
          }</p>`
        : ''
    }
    ${
      body?.ignoreEmailText !== null
        ? `<p>${
            body?.ignoreEmailText ||
            `Se você não solicitou a ${subtitle}, ignore este e-mail.`
          }</p>`
        : ''
    }
    ${
      body?.expirationText !== null
        ? `<p>${
            body?.expirationText ||
            `Este código expira em 30 minutos, caso expirado será necessário solicitar um novo pelo aplicativo.`
          }</p>`
        : ''
    }
    ${body?.end || ''}
    `

  const resp: any = await sendMail({
    to: user.email,
    subject: `Expendia - ${title}`,
    html: emailTemplate(title, user.firstname || '', html, body?.helloLabel)
  })

  if (!resp?.status) return resp

  const code_request_type = await prisma.codeRequestType.findUniqueOrThrow({
    where: { slug }
  })
  await prisma.userCode.create({
    data: {
      code,
      code_request_type_id: code_request_type.id,
      user_id: user.id,
      expiresIn: dayjs().add(30, 'minute').toISOString()
    }
  })

  return resp
}

export const validateCode = async (user_id: string, code: string) => {
  const userCode = await prisma.userCode.findFirst({
    where: {
      user_id,
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

  return userCode
}
