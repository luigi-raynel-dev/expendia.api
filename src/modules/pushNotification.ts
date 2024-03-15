import { sendFcmMessage } from '../lib/fcm'
import { prisma } from '../lib/prisma'

export const getUserNotificationTokens = async (user_id: string) => {
  const userTokens = await prisma.notificationToken.findMany({
    where: {
      user_id
    }
  })

  return userTokens
}

export const sendPushNotification = async (user_id: string) => {
  const userTokens = await getUserNotificationTokens(user_id)

  // userTokens.map(async userToken => {
  //   await sendFcmMessage({
  //     // message payload
  //   })
  // })
}
