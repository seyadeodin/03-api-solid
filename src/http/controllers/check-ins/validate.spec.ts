import request from 'supertest'
import { app } from '@/app'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createAndAuthenticateUser } from '@/utils/test/create-and-authenticate-user'
import { createAndGetGym } from '@/utils/test/create-and-get-gym'
import { prisma } from '@/lib/prisma'

describe('Validate check-in (e2e)', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('should be able to validate check-in', async () => {
    const { token } = await createAndAuthenticateUser(app)
    const user = await prisma.user.findFirstOrThrow()

    const gym = await prisma.gym.create({
      data: {
        title: 'Powerlifter Gym',
        latitude: -23.6336868,
        longitude: -46.7862208,
      },
    })

    const checkIn = await prisma.checkIn.create({
      data: {
        gym_id: gym.id,
        user_id: user.id,
      },
    })

    const response = await request(app.server)
      .patch(`/gyms/${checkIn.id}/validate`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        latitude: -23.6336868,
        longitude: -46.7862208,
      })
    console.log(
      'LS -> src/http/controllers/check-ins/create.spec.ts:27 -> response: ',
      JSON.stringify(response.body),
    )

    expect(response.statusCode).toEqual(200)
  })
})
