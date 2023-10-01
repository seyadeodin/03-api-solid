import { AppError } from '@/shared/errors/AppErrors'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { makeRegisterUseCase } from '@/use-cases/factories/make-register-use-case'

const registerBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterBodyType = z.infer<typeof registerBodySchema>

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { email, name, password } = registerBodySchema.parse(request.body)

  const registerUseCase = makeRegisterUseCase()
  try {
    await registerUseCase.execute({
      name,
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
