import { sendFcmMessage, FcmMessageProps } from '../lib/fcm'
import { prisma } from '../lib/prisma'

export const getUserNotificationTokens = async (user_id: string) => {
  const userTokens = await prisma.notificationToken.findMany({
    select: {
      token: true
    },
    where: {
      user_id
    }
  })

  return userTokens
}

export const sendPushNotification = async (
  user_id: string,
  message: FcmMessageProps
) => {
  const userTokens = await getUserNotificationTokens(user_id)

  userTokens.map(async ({ token }) => {
    await sendFcmMessage({
      token,
      ...message
    })
  })
}
