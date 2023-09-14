import { beforeEach, describe, expect, it } from 'vitest'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'
import { FetchNearbyGymUseCase } from './fetch-nearby-gyms'

let gymsRepository: InMemoryGymsRepository
let sut: FetchNearbyGymUseCase

describe('Fetch nearby gyms', () => {
  beforeEach(async () => {
    gymsRepository = new InMemoryGymsRepository()
    sut = new FetchNearbyGymUseCase(gymsRepository)
  })

  it('should be able to fetch nearby gyms', async () => {
    await gymsRepository.create({
      title: 'Far out Gym',
      latitude: -23.53274,
      longitude: -46.72993,
    })

    await gymsRepository.create({
      title: 'Nearby Gym',
      latitude: -23.6355,
      longitude: -46.78847,
    })

    const { gyms } = await sut.execute({
      userLatitude: -23.6336868,
      userLongitude: -46.7862208,
    })
    expect(gyms).toHaveLength(1)
    expect(gyms).toEqual([expect.objectContaining({ title: 'Nearby Gym' })])
  })
})
