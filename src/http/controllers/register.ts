import { AppError } from '@/shared/errors/AppErrors'
import { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { RegisterUseCase } from '@/use-cases/register'
import { PrismaUsersRepository } from '@/repositories/prisma/prisma-users-repository'

const registerBodySchema = z.object({
  name: z.string(),
  email: z.string().email(),
  password: z.string().min(6),
})

export type RegisterBodyType = z.infer<typeof registerBodySchema>

export async function register(request: FastifyRequest, reply: FastifyReply) {
  const { email, name, password } = registerBodySchema.parse(request.body)

  const prismaUsersRepository = new PrismaUsersRepository()
  const registerUseCase = new RegisterUseCase(prismaUsersRepository)
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
