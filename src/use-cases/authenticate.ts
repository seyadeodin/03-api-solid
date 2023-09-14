import { UsersRepository } from '@/repositories/users-repository'
import { AppError } from '@/shared/errors/AppErrors'
import { User } from '@prisma/client'
import { compare } from 'bcryptjs'

interface AuthenticateUseCaseRequest {
  email: string
  password: string
}

interface AuthenticateUseCaseResponse {
  user: User
}

export class AuthenticateUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute({
    email,
    password,
  }: AuthenticateUseCaseRequest): Promise<AuthenticateUseCaseResponse> {
    // search user on db
    // compare db password with passwword
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      throw new AppError('Invalid credentials')
    }

    const doesPasswordMatches = await compare(password, user.password_hash)

    if (!doesPasswordMatches) {
      throw new AppError('Invalid credentials', 400)
    }

    return {
      user,
    }
  }
}
