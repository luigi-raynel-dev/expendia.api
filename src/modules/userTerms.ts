import { prisma } from '../lib/prisma'

const requiredTermsSlugs = ['privacy-policy', 'terms-of-use']

export const acceptRequiredTerms = async (user_id: string) => {
  for (const slug of requiredTermsSlugs) {
    const term = await prisma.term.findUnique({ where: { slug } })
    if (term) {
      const userTerm = await prisma.userTerm.findUnique({
        where: {
          user_id_term_id: {
            term_id: term.id,
            user_id
          }
        }
      })

      if (userTerm) {
        await prisma.userTerm.update({
          data: {
            accepted: true,
            acceptedAt: new Date()
          },
          where: {
            user_id_term_id: {
              term_id: term.id,
              user_id
            }
          }
        })
      } else {
        await prisma.userTerm.create({
          data: {
            accepted: true,
            acceptedAt: new Date(),
            term_id: term.id,
            user_id
          }
        })
      }
    }
  }
}
