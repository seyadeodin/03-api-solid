import request from 'supertest'
import { app } from '@/app'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

describe('Authenticate (e2e)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to register', async () => {
    await request(app.server).post('/users').send({
      name: 'João Cabeção',
      email: 'joao.cabecao@email.com',
      password: 'password',
    })

    const response = await request(app.server).post('/sessions').send({
      email: 'joao.cabecao@email.com',
      password: 'password',
    })

    expect(response.statusCode).toEqual(200)
    expect(response.body).toEqual({
      token: expect.any(String),
    })
  })
})
