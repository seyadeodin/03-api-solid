import request from 'supertest'
import { app } from '@/app'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user'

describe('Create gym (e2e)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to create a gym', async () => {
    const { token } = await createAndAuthenticateUser({ app, role: 'ADMIN' })

    const response = await request(app.server)
      .post('/gyms')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Powerlifter Gym',
        description: 'Strong and beautiful',
        phone: '11987654321',
        latitude: -23.6336868,
        longitude: -46.7862208,
      })

    expect(response.statusCode).toEqual(201)
  })
})
