import { makeSearchGymUseCase } from '@/use-cases/factories/make-search-gym-use-case'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

const searchGymsQuerySchema = z.object({
  q: z.string(),
  page: z.coerce.number().min(1).default(1),
})

export async function search(request: FastifyRequest, reply: FastifyReply) {
  const { q, page } = searchGymsQuerySchema.parse(request.query)

  const searchGymUseCase = makeSearchGymUseCase()

  const { gyms } = await searchGymUseCase.execute({
    page,
    query: q,
  })

  return reply.status(200).send({ gyms })
}
