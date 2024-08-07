import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const addIsAdminFlagInGroupCreators = async () => {
  const groups = await prisma.group.findMany({
    select: {
      id: true,
      user_id: true
    }
  })
  for (const { id, user_id } of groups) {
    const groupCreator = await prisma.member.findUnique({
      where: {
        group_id_user_id: {
          group_id: id,
          user_id
        }
      }
    })

    if (groupCreator && typeof groupCreator.isAdmin !== 'boolean')
      await prisma.member.update({
        data: {
          isAdmin: true
        },
        where: {
          group_id_user_id: {
            group_id: id,
            user_id
          }
        }
      })
  }
}
