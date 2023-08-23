import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { RegisterBodyType } from '../controllers/register'
import { AppError } from '@/shared/errors/AppErrors'

export async function registerUseCase({
  name,
  email,
  password,
}: RegisterBodyType) {
  const password_hash = await hash(password, 6)

  const userWithSameEmail = await prisma.user.findUnique({
    where: {
      email,
    },
  })

  if (userWithSameEmail) {
    throw new AppError('Email already exists', 409)
  }

  await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
    },
  })
}
