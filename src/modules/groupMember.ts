import { Group, User } from '@prisma/client'
import { inviteMember } from './invite'
import { sendPushNotification } from './pushNotification'

export const newGroupNotification = async (
  me: User,
  user: User,
  group: Group
) => {
  if (me.id !== user.id) {
    await inviteMember(me, user, group)
    if (user.password || user.googleId)
      await sendPushNotification(user.id, {
        data: {
          notificationTopic: 'NEW_GROUP',
          groupId: group.id
        },
        notification: {
          title: 'Você faz parte de um novo grupo',
          body: `${me.firstname} te adicionou ao grupo: ${group.title} para dividir as despesas.`
        }
      })
  }
}
