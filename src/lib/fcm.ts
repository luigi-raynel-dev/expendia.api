import { getLogger } from '../logs/logger'
import { getAccessToken } from './googleOAuth'
import fetch from 'cross-fetch'

const expoUsername = process.env.EXPO_USERNAME || ''
const expoSlug = process.env.EXPO_SLUG || ''
const expoUri = `@${expoUsername}/${expoSlug}`

const fcmScopeMessage = process.env.FCM_GOOGLE_SCOPE || ''
export interface FcmDataProps extends Record<string, string | undefined> {
  topic:
    | 'NEW_GROUP'
    | 'NEW_EXPENSE'
    | 'FULLY_PAID'
    | 'USER_PAID'
    | 'EXPENSE_EXPIRATION'
  groupId?: string
  expenseId?: string
  url?: string
}

const fmcScopes = [fcmScopeMessage]
export interface FcmMessageProps {
  data: FcmDataProps
  notification: {
    title: string
    body: string
  }
}
export interface SendFcmMessagePayload extends FcmMessageProps {
  token: string
}

const logger = getLogger('fcm')

export const sendFcmMessage = async (payload: SendFcmMessagePayload) => {
  const accessToken = await getAccessToken(fmcScopes)

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
          experienceId: expoUri,
          notificationExperienceUrl: `exp://exp.host/${expoUri}`,
          scopeKey: expoUri,
          ...payload.data
        }
      }
    })
  }

  let notificationId = null
  try {
    const response = await fetch(process.env.FCM_SEND_URL || '', options)
    const data = (await response.json()) as { name?: string }
    if (data?.name) {
      const segments = data.name.split('/')
      notificationId = segments[segments.length - 1]
    }

    logger?.info(data)
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error)
    logger?.error(error)
  }
  return notificationId
}
