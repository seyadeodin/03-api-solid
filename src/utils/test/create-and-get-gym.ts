import { FastifyInstance } from 'fastify'
import request from 'supertest'

export async function createAndGetGym(app: FastifyInstance, token: string) {
  await request(app.server)
    .post('/gyms')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Powerlifter Gym',
      description: 'Strong and beautiful',
      phone: '11987654321',
      latitude: -23.6336868,
      longitude: -46.7862208,
    })

  const response = await request(app.server)
    .get('/gyms/search')
    .set('Authorization', `Bearer ${token}`)
    .query({ q: 'gym' })

  return response.body.gyms[0]
}
