import { expect, describe, it } from 'vitest'
import { RegisterUseCase } from './register'
import { compare } from 'bcryptjs'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { AppError } from '@/shared/errors/AppErrors'

describe('Register use case', () => {
  it('should be able to register', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const registerUseCase = new RegisterUseCase(usersRepository)

    const { user } = await registerUseCase.execute({
      name: 'João Cabeção',
      email: 'joao.cabecao@email.com',
      password: 'password',
    })

    expect(user.id).toEqual(expect.any(String))
  })
  it('should hash user password upon registration', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const registerUseCase = new RegisterUseCase(usersRepository)

    const { user } = await registerUseCase.execute({
      name: 'João Cabeção',
      email: 'joao.cabecao@email.com',
      password: 'password',
    })

    const isPasswordCorrectlyHashed = await compare(
      'password',
      user.password_hash,
    )

    expect(isPasswordCorrectlyHashed).toBe(true)
  })
  it('should not be able to register with the same e-mail twice', async () => {
    const usersRepository = new InMemoryUsersRepository()
    const registerUseCase = new RegisterUseCase(usersRepository)

    const email = 'joao.cabecao@email.com'

    await registerUseCase.execute({
      name: 'João Cabeção',
      email,
      password: 'password',
    })

    expect(() =>
      registerUseCase.execute({
        name: 'João Cabeção',
        email,
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(AppError)
  })
})
