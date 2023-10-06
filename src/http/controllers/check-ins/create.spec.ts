import request from 'supertest'
import { app } from '@/app'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user'
import { createAndGetGym } from '@/utils/test/create-and-get-gym'

describe('Create check-in (e2e)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to check-in', async () => {
    const { token } = await createAndAuthenticateUser(app)
    const gym = await createAndGetGym(app, token)

    // app.post('/gyms/:gymId/check-ins', create)
    const response = await request(app.server)
      .post(`/gyms/${gym.id}/check-ins`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: -23.6336868,
        longitude: -46.7862208,
      })
    console.log(
      'LS -> src/http/controllers/check-ins/create.spec.ts:27 -> response: ',
      response.body,
    )

    expect(response.statusCode).toEqual(201)
  })
})
