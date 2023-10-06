import { FastifyInstance } from 'fastify'
import request from 'supertest'

export async function createAndAuthenticateUser(app: FastifyInstance) {
  await request(app.server).post('/users').send({
    name: 'João Cabeção',
    email: 'joao.cabecao@email.com',
    password: 'password',
  })

  const authResponse = await request(app.server).post('/sessions').send({
    email: 'joao.cabecao@email.com',
    password: 'password',
  })

  const { token } = authResponse.body

  return { token }
}
