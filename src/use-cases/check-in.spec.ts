import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { CheckInUseCase } from './check-in'
import { AppError } from '@/shared/errors/AppErrors'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'

let checkInsRepository: InMemoryCheckInsRepository
let gymRepository: InMemoryGymsRepository
let sut: CheckInUseCase

describe('Check-in', () => {
  beforeEach(async () => {
    checkInsRepository = new InMemoryCheckInsRepository()
    gymRepository = new InMemoryGymsRepository()
    sut = new CheckInUseCase(checkInsRepository, gymRepository)

    gymRepository.create({
      id: 'gym-id',
      phone: '11931223213',
      title: 'Academia Teste',
      latitude: -23.6336868,
      longitude: -46.7862208,
      description: 'Só para os testadores de peso',
      created_at: new Date(),
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to create check in', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0, 0))

    const { checkIn } = await sut.execute({
      userId: 'user-id',
      gymId: 'gym-id',
      userLatitude: -23.6336868,
      userLongitude: -46.7862208,
    })
    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should not be able to check in twice in the same date for same user', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0, 0))

    await sut.execute({
      userId: 'user-id',
      gymId: 'gym-id',
      userLatitude: -23.6336868,
      userLongitude: -46.7862208,
    })

    await expect(async () =>
      sut.execute({
        userId: 'user-id',
        gymId: 'gym-id',
        userLatitude: -23.6336868,
        userLongitude: -46.7862208,
      }),
    ).rejects.toBeInstanceOf(AppError)
  })

  it('should be able to check in twice in different dates for same user', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0, 0))

    await sut.execute({
      userId: 'user-id',
      gymId: 'gym-id',
      userLatitude: -23.6336868,
      userLongitude: -46.7862208,
    })

    vi.setSystemTime(new Date(2022, 0, 21, 8, 0, 0, 0))

    const { checkIn } = await sut.execute({
      userId: 'user-id',
      gymId: 'gym-id',
      userLatitude: -23.6336868,
      userLongitude: -46.7862208,
    })

    expect(checkIn.id).toEqual(expect.any(String))
  })

  it('should note be able to check in on distant gym', async () => {
    vi.setSystemTime(new Date(2022, 0, 20, 8, 0, 0, 0))

    await expect(async () => {
      await sut.execute({
        userId: 'user-id',
        gymId: 'gym-id',
        userLatitude: -23.6524369,
        userLongitude: -46.8061568,
      })
    }).rejects.toBeInstanceOf(AppError)
  })
})

// red -> error no teste
// green -> codar minimo possivel para o teste passar
// refactor -> refatoro o codigo
