import { hash } from 'bcryptjs'
import { RegisterBodyType } from '@/http/controllers/register'
import { AppError } from '@/shared/errors/AppErrors'
import { UsersRepository } from '@/repositories/users-repository'
import { User } from '@prisma/client'

interface RegisterUserCaseResponse {
  user: User
}

export class RegisterUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    name,
    email,
    password,
  }: RegisterBodyType): Promise<RegisterUserCaseResponse> {
    const password_hash = await hash(password, 6)

    const userWithSameEmail = await this.usersRepository.findByEmail(email)

    if (userWithSameEmail) {
      throw new AppError('Email already exists', 409)
    }

    const user = await this.usersRepository.create({
      name,
      email,
      password_hash,
    })

    return {
      user,
    }
  }
}
