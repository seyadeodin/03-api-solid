import { beforeEach, describe, expect, it } from 'vitest'
import { SearchGymUseCase } from './search-gym'
import { InMemoryGymsRepository } from '@/repositories/in-memory/in-memory-gyms-repository'

let gymsRepository: InMemoryGymsRepository
let sut: SearchGymUseCase

describe('Search gym use case', () => {
  beforeEach(async () => {
    gymsRepository = new InMemoryGymsRepository()
    sut = new SearchGymUseCase(gymsRepository)
  })

  it('should be able to search for gym', async () => {
    await gymsRepository.create({
      title: 'Academia Teste',
      latitude: 0,
      longitude: 0,
    })

    await gymsRepository.create({
      title: 'Academia Produção',
      latitude: 0,
      longitude: 0,
    })

    const { gyms } = await sut.execute({ query: 'teste', page: 1 })
    expect(gyms).toHaveLength(1)
    expect(gyms).toEqual([expect.objectContaining({ title: 'Academia Teste' })])
  })
  it('should be able to fetch paginated gyms', async () => {
    for (let i = 1; i <= 22; i++) {
      await gymsRepository.create({
        title: 'Academia Teste ' + i,
        latitude: 0,
        longitude: 0,
      })
    }

    const { gyms } = await sut.execute({ query: 'teste', page: 2 })

    expect(gyms).toHaveLength(2)
    expect(gyms).toEqual([
      expect.objectContaining({ title: 'Academia Teste 21' }),
      expect.objectContaining({ title: 'Academia Teste 22' }),
    ])
  })
})
