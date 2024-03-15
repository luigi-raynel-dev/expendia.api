import { getAccessToken } from './googleOAuth'

const fcmScopeMessage = process.env.FCM_GOOGLE_SCOPE || ''

const fmcScopes = [fcmScopeMessage]

export interface SendFcmMessagePayload {
  token: string
  data: Record<string, string>
  notification: {
    title: string
    body: string
  }
}

export const sendFcmMessage = async (payload: SendFcmMessagePayload) => {
  const accessToken = await getAccessToken(fmcScopes)

  console.log(accessToken)
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        ...payload,
        data: {
          ...payload.data
        }
      }
    })
  }

  try {
    const response = await fetch(process.env.FCM_SEND_URL || '', options)
    console.log(await response.text())
    // const data = await response.json()
    // console.log('Mensagem enviada com sucesso:', data)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
  }
}
