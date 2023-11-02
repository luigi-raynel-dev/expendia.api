import randomatic from 'randomatic'
import { prisma } from '../lib/prisma'
import { User } from '@prisma/client'
import dayjs from 'dayjs'
import { sendMail } from '../lib/nodemailer'
import { emailTemplate } from '../lib/emailTemplate'

export const sendCode = async (
  user: User,
  title: string,
  subtitle: string,
  slug: string
) => {
  const code = randomatic('0', 5)

  const html = `
    <p>Recebemos uma solicitação para ${subtitle}.</p>
    <div style="background: #ddd;padding: 10px; text-align: center;">
      <h2>${code}</h2>
    </div>
    <p>Por favor, utilize este código acima para confirmar a ${subtitle} no nosso aplicativo.</p>
    <p>Se você não solicitou a ${subtitle}, ignore este e-mail.</p
    <p>Este código expira em 30 minutos, caso expirado será necessário solicitar um novo pelo aplicativo.</p>
    `
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
  const resp = await sendMail({
    to: user.email,
    subject: `Expendia - ${title}`,
    html: emailTemplate(title, `${user.firstname} ${user.lastname}`, html)
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
