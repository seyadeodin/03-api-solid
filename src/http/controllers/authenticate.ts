import { AppError } from '@/shared/errors/AppErrors'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeAuthenticateUseCase } from '@/use-cases/factories/make-authenticate-use-case'

const authenticateBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterBodyType = z.infer<typeof authenticateBodySchema>

export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { email, password } = authenticateBodySchema.parse(request.body)

  const authenticateUseCase = makeAuthenticateUseCase()

  try {
    await authenticateUseCase.execute({
      email,
      password,
    })
  } catch (err) {
    if (err instanceof AppError) {
      reply.status(err.statusCode).send({
        message: err.message,
      })
    }
    throw err
  }

  return reply.status(201).send()
}
