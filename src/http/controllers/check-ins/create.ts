import { makeCheckInUseCase } from '@/use-cases/factories/make-check-in-use-case'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'

const createCheckInBodySchema = z.object({
  latitude: z.number().refine(
    (value) => Math.abs(value) <= 90,
    // Math.abs(absolute) transforms our value into a positive one
  ),
  longitude: z.number().refine((value) => Math.abs(value) <= 180),
})

const createCheckInParamsSchema = z.object({
  gymId: z.string().uuid(),
})

export async function create(request: FastifyRequest, reply: FastifyReply) {
  const { latitude, longitude } = createCheckInBodySchema.parse(request.body)
  const { gymId } = createCheckInParamsSchema.parse(request.params)

  const checkInUseCase = makeCheckInUseCase()

  await checkInUseCase.execute({
    gymId,
    userId: request.user.sub,
    userLatitude: latitude,
    userLongitude: longitude,
  })

  return reply.status(201).send()
}
