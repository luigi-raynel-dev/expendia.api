import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const createEssentialTerms = async () => {
  const terms = [
    {
      title: 'Política de privacidade',
      slug: 'privacy-policy',
      text: 'Texto não definido.'
    },
    {
      title: 'Termos de uso',
      slug: 'terms-of-use',
      text: 'Texto não definido.'
    }
  ]

  terms.map(async data => {
    const term = await prisma.term.findUnique({
      where: {
        slug: data.slug
      }
    })

    if (!term) await prisma.term.create({ data })
  })
}
