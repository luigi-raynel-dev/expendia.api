import { Group, User } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { sendMail } from '../lib/nodemailer'
import { emailTemplate } from '../lib/emailTemplate'

export const inviteMember = async (from: User, to: User, group: Group) => {
  const title = `${from.firstname} te adicionou ao grupo: ${group.title}`

  const resp: any = await sendMail({
    to: to.email,
    subject: `Expendia - ${title}`,
    html: emailTemplate(
      title,
      to.firstname || 'novo usuário',
      `
      <p>
        Você foi adicionado por <strong>${from.firstname}</strong> ao grupo <strong>${group.title}</strong> para dividir as despesas.
      </p>
      <p>
        Pronto para dividir as despesas com o grupo?
      </p>
      <div style="width: 100%; text-align: center; margin: 0 auto; padding: 8px; color: white">
        <a href="${process.env.GOOGLE_PLAY_URL}" title="Disponível no Google Play">
          <img width="200px" alt="Disponível no Google Play" src="${process.env.GOOGLE_PLAY_BADGE_URL}" />
        </a>
      </div>
      `
    )
  })

  if (!resp?.status) return resp

  return resp
}
