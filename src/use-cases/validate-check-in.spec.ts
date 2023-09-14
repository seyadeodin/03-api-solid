import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { InMemoryCheckInsRepository } from '@/repositories/in-memory/in-memory-check-ins-repository'
import { AppError } from '@/shared/errors/AppErrors'
import { ValidateCheckInUseCase } from './validate-check-in'

let checkInsRepository: InMemoryCheckInsRepository
let sut: ValidateCheckInUseCase

describe('Validate check-in', () => {
  beforeEach(async () => {
    checkInsRepository = new InMemoryCheckInsRepository()
    sut = new ValidateCheckInUseCase(checkInsRepository)

    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be able to validate check-in', async () => {
    const createdCheckIn = await checkInsRepository.create({
      user_id: 'user-01',
      gym_id: 'gym-01',
    })

    const { checkIn } = await sut.execute({
      checkInId: createdCheckIn.id,
    })

    expect(checkIn.created_at).toEqual(expect.any(Date))
    expect(checkInsRepository.items[0].validated_at).toEqual(expect.any(Date))
  })

  it('should not be able to validate a nonexistent check-in', async () => {
    await expect(async () => {
      await sut.execute({
        checkInId: 'nonexistent-id',
      })
    }).rejects.toBeInstanceOf(AppError)
  })

  it('should not be able to validade check-in after 20 minutes from its created', async () => {
    vi.setSystemTime(new Date(2023, 0, 1, 13, 40))

    const createdCheckIn = await checkInsRepository.create({
      user_id: 'user-01',
      gym_id: 'gym-01',
    })

    const twentyOneMinutsInMs = 1000 * 60 * 21
    vi.advanceTimersByTime(twentyOneMinutsInMs)

    await expect(
      async () =>
        await sut.execute({
          checkInId: createdCheckIn.id,
        }),
    ).rejects.toBeInstanceOf(AppError)
  })
})
