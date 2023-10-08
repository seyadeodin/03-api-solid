import { Role } from '@/@types/roles'
import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import request from 'supertest'

interface CreateAndAuthenticateUserProps {
  app: FastifyInstance
  role?: Role
}

export async function createAndAuthenticateUser({
  app,
  role = 'MEMBER',
}: CreateAndAuthenticateUserProps) {
  await prisma.user.create({
    data: {
      name: 'João Cabeção',
      email: 'joao.cabecao@email.com',
      password_hash: await hash('password', 6),
      role,
    },
  })

  const authResponse = await request(app.server).post('/sessions').send({
    email: 'joao.cabecao@email.com',
    password: 'password',
  })

  const { token } = authResponse.body

  return { token }
}
