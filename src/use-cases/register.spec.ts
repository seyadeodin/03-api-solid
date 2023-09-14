import { expect, describe, it, beforeEach } from 'vitest'
import { RegisterUseCase } from './register'
import { compare } from 'bcryptjs'
import { InMemoryUsersRepository } from '@/repositories/in-memory/in-memory-users-repository'
import { AppError } from '@/shared/errors/AppErrors'

let usersRepository: InMemoryUsersRepository
let sut: RegisterUseCase

describe('Register use case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new RegisterUseCase(usersRepository)
  })

  it('should be able to register', async () => {
    const { user } = await sut.execute({
      name: 'João Cabeção',
      email: 'joao.cabecao@email.com',
      password: 'password',
    })

    expect(user.id).toEqual(expect.any(String))
  })
  it('should hash user password upon registration', async () => {
    const { user } = await sut.execute({
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
    const email = 'joao.cabecao@email.com'

    await sut.execute({
      name: 'João Cabeção',
      email,
      password: 'password',
    })

    expect(() =>
      sut.execute({
        name: 'João Cabeção',
        email,
        password: 'password',
      }),
    ).rejects.toBeInstanceOf(AppError)
  })
})
