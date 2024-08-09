import { sendFcmMessage, FcmMessageProps } from '../lib/fcm'
import { prisma } from '../lib/prisma'

export const getUserNotificationTokens = async (user_id: string) => {
  const userTokens = await prisma.notificationToken.findMany({
    select: {
      token: true,
      id: true
    },
    where: {
      user_id
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 3
  })

  return userTokens
}

export const sendPushNotification = async (
  user_id: string,
  message: FcmMessageProps
) => {
  const userTokens = await getUserNotificationTokens(user_id)

  for (const { token, id } of userTokens) {
    const notificationId = await sendFcmMessage({
      token,
      ...message
    })

    if (notificationId) {
      await prisma.notification.create({
        data: {
          notificationTokenId: id,
          notificationId,
          ...message.data,
          ...message.notification
        }
      })
    }
  }
}
