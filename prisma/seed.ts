import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function run() {
  await prisma.codeRequestType.create({
    data: {
      slug: 'password-recovery',
      title: 'Password Recovery'
    }
  })
}

run()
