import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createCodeRequestTypes = async () => {
  const codeRequestTypes = [
    {
      slug: 'password-recovery',
      title: 'Password Recovery'
    },
    {
      slug: 'delete-account',
      title: 'Delete Account'
    },
    {
      slug: 'confirm-email',
      title: 'Confirm email'
    }
  ]

  for (const data of codeRequestTypes) {
    const type = await prisma.codeRequestType.findUnique({
      where: { slug: data.slug }
    })

    if (!type) await prisma.codeRequestType.create({ data })
  }
}
