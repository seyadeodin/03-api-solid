import { CheckInsRepository } from '@/repositories/check-ins-repository'
import { CheckIn } from '@prisma/client'

interface FetchUserscheckInsHistoryUseCaseRequest {
  userId: string
  page: number
}

interface FetchUserscheckInsHistoryUseCaseResponse {
  checkIns: CheckIn[]
}

export class FetchUserscheckInsHistoryUseCase {
  constructor(private checkInsRepository: CheckInsRepository) {}

  async execute({
    userId,
    page,
  }: FetchUserscheckInsHistoryUseCaseRequest): Promise<FetchUserscheckInsHistoryUseCaseResponse> {
    const checkIns = await this.checkInsRepository.findManyByUserId(
      userId,
      page,
    )

    return {
      checkIns,
    }
  }
}
