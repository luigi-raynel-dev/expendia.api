import { User } from '@prisma/client'
import { sendCode } from './userCode'

export const sendConfirmationEmail = async (user: User) => {
  const resp: any = await sendCode(
    user,
    'Confirmar e-mail',
    'criação da sua conta',
    'confirm-email',
    {
      helloLabel: 'Bem vindo',
      title:
        'É muito bom tê-lo em nosso aplicativo, mas antes precisamos que confirme que seu e-mail está correto.'
    }
  )

  return resp
}
