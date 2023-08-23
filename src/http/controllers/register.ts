import { AppError } from '@/shared/errors/AppErrors'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { registerUseCase } from '../use-cases/register'

const registerBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterBodyType = z.infer<typeof registerBodySchema>

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { email, name, password } = registerBodySchema.parse(request.body)

  try {
    await registerUseCase({
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
  }

  return reply.status(201).send()
}
