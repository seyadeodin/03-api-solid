# Project Structure
### Installing dependencies
- `npm i tsup tsx typescript -D` for our dev dependencies and then `npm i fastify`
- `tsc --init` to generate a `tsconfig.json` changing our target to `es2020`
- After that we create a file for our serve and app
### Using npm exact version
- We ensure our packages are using the same exact version creating a .npmrc with the flag`save-exact=true`
- That done we can use bots like **renovatebot** which will keep checking our projects dependencies and open pull requests to update them, in case these updates don't break our application.

### Environemnt variables
- We create a `.env` and `.env.example` files adding the first to our `.gitignore`
- We install dotenv `npm i dotenv` which we use in conjunction with zod `npm i zod` to make our variables validation.
- [[./src/env/index.ts]]:
  - Here we validate our data using zod.
  - In our schema we use a enum to check our `NODE_ENV`
  - For our port we coerce it into a number
  - After that we parse it and check for errors accessing the key `.succes`
  - `.errors.format` present us with an error redable by our user.
  - `throw new Error` prevent our app from running if our envs are not present.
  - In case everythign is alright we export the data in `_env.data`
  ```tsx
  import 'dotenv/config';
  import { z } from 'zod';

  const envSchema = z.object({
    NODE_ENV: z.enum(['dev', 'test', 'production']).default('dev'),
    PORT: z.coerce.number().default(3333)
  })

  const _env = envSchema.safeParse(process.env)

  if (_env.success === false) {
    console.error('❌ Invalid environment variables', _env.error.format)

    throw new Error('Invalid environment varibles')
  }

  export const env = _env.data;
  ```
### ESLint Setup and final touches
- We do `npm i eslint @rocketseat/eslint-config -D`
- Create a `.eslintrc.json` and add 
  ```json
  {
    "extends": [
      "@rocketseat/eslint-config/node"
    ]
  }
  ```
- And then in tsconfig.json we add alias:
  ````json
  "baseUrl": "./",
  "paths": {
    "@/*": [
      "./src/*"
    ]
  },
  ```

# Docker
- To use bitnami postgres  image forthe first time
`docker run --name api-solid-pg -e POSTGRESQL_USERNAME=docker -e POSTGRESQL_PASSWORD=docker -e POSTGRESQL_DATABAS=apisolid -p 5432:5432  bitnami/postgresql`
- To run it again `docker start api-solid-pg``
- To stop `docker stop api-solid-pg`
- And see list of images: `docker ps`

# Docker Compose
- Docker compose is a tool we use to create the necessary containers to run our application. 
- We do it by creating a file and specifying all containers and settings necessary for it to run.
- To run: `docker compose up -d` [-d is detached]
- To stop: `docker compose stop`
- To delete it: `docker compose down`

# Use case and design patterns

### Controller
- Starting with our controller on [./src/http/controllers/register.ts] is where we receive the data from the request, parse it,and send back the reply. It is also here our use-case and repository are declared and used, and whre our catch all is located to treat the error and send it back to the user.

### Repository
- Is where our data storage is located, we abstract it with [./src/repositories/users-repository.ts] where the interface, our contract is declared with the methods and parameters needed.
    ```tsx
    import { Prisma, User } from '@prisma/client'

    export interface UsersRepository {
      create(data: Prisma.UserCreateInput): Promise<User>
      findByEmail(email: string): Promise<User | null>
    }
    ```
- It is implemented in [./src/repositories/prisma/prisma-users-repository.ts]. Here we create a class that implements our itnerface and makes the data transcations using prisma.
```tsx
    import { Prisma, User } from '@prisma/client'
    import { prisma } from '@/lib/prisma'
    import { UsersRepository } from '../users-repository'

    export class PrismaUsersRepository implements UsersRepository {
      async create({ name, email, password_hash }: Prisma.UserCreateInput) {
        const user = await prisma.user.create({
          data: {
            name,
            email,
            password_hash,
          },
        })

        return user
      }

      async findByEmail(email: string) {
        const user = await prisma.user.findUnique({
          where: {
            email,
          },
        })
        return user
      }
    }
```

### Use-case
- The use-case is where our business logic is created. On thte constructor the user repository is received as a parameter. After we do the necessary transformations and further validation of our data we pass it to our reository to store it.
    - By declaring our `usersRepository` as property of our constructor with a modifier as a prefix ts automatically delclares it in our class so we can call it with `this.usersRepository`
    ```tsx
    import { hash } from 'bcryptjs'
    import { RegisterBodyType } from '@/http/controllers/register'
    import { AppError } from '@/shared/errors/AppErrors'
    import { UsersRepository } from '@/repositories/users-repository'

    export class RegisterUseCase {
      constructor(private usersRepository: UsersRepository) {}

      async execute({ name, email, password }: RegisterBodyType) {
        const password_hash = await hash(password, 6)

        const userWithSameEmail = await this.usersRepository.findByEmail(email)

        if (userWithSameEmail) {
          throw new AppError('Email already exists', 409)
        }

        await this.usersRepository.create({
          name,
          email,
          password_hash,
        })
      }
    }

    ```

### Error treatment
- To treat erros globally in our application we declare in [./src/app.ts] a `app.setErrorHandler` which will receives all erros that get thrown at the last(first) level of our application and treat it. Here we treat our zod errors and unknown origin errors. We also leave a space where we can add an external tool to monitor errors like Sentry, Datalog and NewRelic
    ```tsx
    app.setErrorHandler((err, _, reply) => {
      if (err instanceof ZodError) {
        return reply
          .status(400)
          .send({ message: 'Validation erro.', issues: err.format() })
      }

      if (env.NODE_ENV !== 'production') {
        console.error(err)
      } else {
        // Here we add an external tool like Datalog/NewRelic/Sentry
      }

      return reply.status(500).send({ message: 'Internal server error.' })
    })

    ```

# Tests
### Setup
- For testing we add a few dependencies:
    ```bash
     pnpm i vitest vite-tsconfig-paths -D
     pnpm i -D @vitest/ui
    ```
- Create a vite.config.ts:
    ```tsx
    import { defineConfig } from 'vitest/config'
    import tsconfigPaths from 'vite-tsconfig-paths'

    export default defineConfig({
      plugins: [tsconfigPaths()],
      test: {
        environmentMatchGlobs: [['src/http/controllers/**', 'prisma']],
      },
    })
    ```
- And create the necessary scripts to run our tests:
```json
"scripts": {
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  },

```

# Implementing use cases with tests
####  Use case
- Here is an example of a use case we made [./src/use-cases/check-in.ts]:
    - Our use case have an interface for its request and response.
    - In our constructor we invoke both check in and gym repository to do our operations
    - Inside our function we first convert our Prisma values from decimal to number and throw it to our service.
    ```tsx
    import { CheckInsRepository } from '@/repositories/check-ins-repository'
    import { GymsRepository } from '@/repositories/gyms-repository'
    import { AppError } from '@/shared/errors/AppErrors'
    import { getDistanceBetweenCoordinates } from '@/utils/get-distance-between-coordinates'
    import { CheckIn } from '@prisma/client'

    interface CheckInUseCaseRequest {
      userId: string
      gymId: string
      userLatitude: number
      userLongitude: number
    }

    interface CheckInUseCaseResponse {
      checkIn: CheckIn
    }

    export class CheckInUseCase {
      constructor(
        private checkInsRepository: CheckInsRepository,
        private gymsRepository: GymsRepository,
      ) {}

      async execute({
        userId,
        gymId,
        userLatitude,
        userLongitude,
      }: CheckInUseCaseRequest): Promise<CheckInUseCaseResponse> {
        const gym = await this.gymsRepository.findById(gymId)

        if (!gym) {
          throw new AppError('Resource not found', 400)
        }

        const distance = getDistanceBetweenCoordinates(
          { latitude: userLatitude, longitude: userLongitude },
          {
            latitude: gym.latitude.toNumber(),
            longitude: gym.longitude.toNumber(),
          },
        )

        const MAX_DISTANCE_IN_KILOMETERS = 0.1

        if (distance > MAX_DISTANCE_IN_KILOMETERS) {
          throw new AppError('Max distance surpassed.')
        }

        const checkInOnSameDay = await this.checkInsRepository.findByUserIdOnDate(
          userId,
          new Date(),
        )

        if (checkInOnSameDay) {
          throw new AppError('Max number of check-ins reached.')
        }

        const checkIn = await this.checkInsRepository.create({
          user_id: userId,
          gym_id: gymId,
        })

        return {
          checkIn,
        }
      }
    }
    ```
### In-memory repository
- One of the in-memory repositories we created to simulate our databse operations [./src/repositories/in-memory/in-memory-check-ins-repository.ts]:
    - In `findByUserIdOnDate` we use `dayjs` to get our date `startOf` and `endOf` and then `isAfter` and `isBefore` to check if its on the same day.
    ```tsx
    import type { CheckIn, Prisma } from '@prisma/client'
    import { CheckInsRepository } from '../check-ins-repository'
    import { randomUUID } from 'crypto'
    import dayjs from 'dayjs'

    export class InMemoryCheckInsRepository implements CheckInsRepository {
      public items: CheckIn[] = []

      async findById(id: string): Promise<CheckIn | null> {
        const checkIn = this.items.find((item) => item.id === id)

        if (!checkIn) {
          return null
        }

        return checkIn
      }

      async findByUserIdOnDate(userId: string, date: Date) {
        const startOfTheDay = dayjs(date).startOf('date')
        const endOfTheDay = dayjs(date).endOf('date')

        const checkInOnSameDate = this.items.find((checkIn) => {
          const checkInDate = dayjs(checkIn.created_at)
          const isOnSameDate =
            checkInDate.isAfter(startOfTheDay) && checkInDate.isBefore(endOfTheDay)
          return checkIn.user_id === userId && isOnSameDate
        })

        if (!checkInOnSameDate) {
          return null
        }

        return checkInOnSameDate
      }

      async findManyByUserId(userId: string, page: number): Promise<CheckIn[]> {
        return this.items
          .filter((item) => item.id !== userId)
          .slice((page - 1) * 20, page * 20)
      }

      async countByUserId(userId: string): Promise<number> {
        return this.items.filter((item) => item.id !== userId).length
      }

      async create({
        gym_id,
        user_id,
        validated_at,
      }: Prisma.CheckInUncheckedCreateInput) {
        const checkIn: CheckIn = {
          id: randomUUID(),
          gym_id,
          user_id,
          created_at: new Date(),
          validated_at: validated_at ? new Date(validated_at) : null,
        }
        this.items.push(checkIn)

        return checkIn
      }

      async save(checkIn: CheckIn): Promise<CheckIn> {
        const checkInIndex = this.items.findIndex((item) => item.id === checkIn.id)

        if (checkInIndex >= 0) {
          this.items[checkInIndex] = checkIn
        }

        return checkIn
      }
    }

    ```
### Test
- Here is one of the most example tests we made [./src/use-cases/check-in.spec.ts]:
    - Here we create a gym before each test, since a check-in must necessarily have a corresonding gym from which we compare the distance between it and user.
    - We use `vi.setSystemTime` to manipulate the date
    - Another function we can use from vitest is `vi.advanceTimersByTime(twentyOneMinutsInMs)` which advances time by a determined amount of ms.
    - One other good example to look is [./src/use-cases/fetch-users-check-ins-history.spec.ts] where multiple exects are used to validate our usecase
    ```tsx
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

    ```
### Service
- A service we create to calculate the distance between coordinates, would be interesting to undestand it better later [./src/utils/get-distance-between-coordinates.ts]:
    ```tsx
    export interface Coordinate {
      latitude: number
      longitude: number
    }

    export function getDistanceBetweenCoordinates(
      from: Coordinate,
      to: Coordinate,
    ) {
      const fromRadian = (Math.PI * from.latitude) / 180
      const toRadian = (Math.PI * to.latitude) / 180

      const theta = from.longitude - to.longitude
      const radTheta = (Math.PI * theta) / 180

      let dist =
        Math.sin(fromRadian) * Math.sin(toRadian) +
        Math.cos(fromRadian) * Math.cos(toRadian) * Math.cos(radTheta)

      if (dist > 1) {
        dist = 1
      }

      dist = Math.acos(dist)
      dist = (dist * 180) / Math.PI
      dist = dist * 60 * 1.1515
      dist = dist * 1.609344

      return dist
    }

    ```
### Factory


# Controllers and E2E tests
### JWT
- JSON web tokens are unique, non modifiable stateless tokens created by our backend from a keyword. It is separated in header.payload.verify_signature. 
    - Header contains the algorithm we used to generate our token
    - Payload contains the data of our user his id being named as sub
    - Our signature is what protects the data in our payload fro mbeing modified.
- JWT is a form of authentication which works bettwer when used with HTTP routes, for that reason it will be contained in our http layer.

### Creating a controller
- An example of a controller in [./src/http/controllers/gyms/create.ts]. We validate the data received through a schema, execute our useCase and return a status.
    ```tsx
    import { FastifyRequest, FastifyReply } from 'fastify'
    import { z } from 'zod'
    import { makeCreateGymUseCase } from '@/use-cases/factories/make-create-gym-use-case'

    const createGymBodySchema = z.object({
      title: z.string(),
      description: z.string().nullable(),
      phone: z.string().nullable(),
      latitude: z.number().refine(
        (value) => Math.abs(value) <= 90,
        // Math.abs(absolute) transforms our value into a positive one
      ),
      longitude: z.number().refine((value) => Math.abs(value) <= 180),
    })

    export type RegisterBodyType = z.infer<typeof createGymBodySchema>

    export async function create(request: FastifyRequest, reply: FastifyReply) {
      const { title, description, phone, latitude, longitude } =
        createGymBodySchema.parse(request.body)

      const createGymUseCase = makeCreateGymUseCase()

      await createGymUseCase.execute({
        title,
        description,
        phone,
        latitude,
        longitude,
      })

      return reply.status(201).send()
    }

    ```
- In [./src/http/controllers/check-ins/routes.ts]
    - Here is an example of routing. When we're modyfing a specific checkIn or gym, we code it as a params.
    - Notice that even tho a route is in the check-in route it is still accessed through the `/gyms` since a check-in or validation is done to a gym.
    ```tsx
    export async function checkInsRoutes(app: FastifyInstance) {
      app.addHook('onRequest', verifyJWT)

      app.get('/check-ins/history', history)
      app.get('/check-ins/metrics', metrics)

      app.post('/gyms/:gymId/check-ins', create)
      app.patch('/gyms/:checkInId/validate', create)
    }
    ```

### Creating test environemnt
- To create a test environment we need to follow a few steps:
    1. Create [./src/prisma/prisma-users-repository] folder
    2. npm start it
    3. Add to [./src/vite.config.ts]:
        ```tsx
          test: {
            environmentMatchGlobs: [['src/http/controllers/**', 'prisma']],
          },

        ```
    4. Create a link between our prima-users-repository and project running `npm link` on [./prisma/vitest-environment-prisma/] and `npm link vitest-environment-prism` on [./]
    5. To avoid the need of having to repeat the linking process on every environemnt we use we create the following scripts on [./package.json] (we also need to install npm-run-all for it to run on non-unix complianat systems) for that:
        - On npm we can add pre and post to run commands before and after our command is runt.
   ```json
   {
    "test:create-prisma-environment": "npm link ./prisma/vitest-environment-prisma",
    "test:install-prisma-environment": "npm link vitest-environment-prisma",
    "build": "tsup src --out-dir build",
    "test": "vitest run --dir src/use-cases",
    "test:watch": "vitest --dir src/use-cases",
    "pretest:e2e": "run-s test:create-prisma-environment test:install-prisma-environment",
    "test:e2e": "vitest run --dir src/http",
   }
   ``` 
### Creating a E2E test
- In [./src/http/controllers/check-ins/validate.spec.ts] we have complete example of a e2e validation
    - We use supertest to call our app and call our endpoints, before each and after every test we ready and close it.
    - To create our user and get our token we created a function that can be called for the various tests wwhere it is needed.
    - For operations besides our main one, for the memoment we call directly prisma to create our entries.
    - After that's done we call the route we want 
        - Here we use `patch` but we could use any other http method aswell
        - `.send` for a json body but for query params we can use `query`
        - `.set` to add our bearer token to our header with the name authorization
    ```tsx
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

        expect(response.statusCode).toEqual(200)
      })
    })
    ```
- Function to register and create authentication on [./src/utils/test/create-and-authenticate-user.ts]
    ```tsx
    import { FastifyInstance } from 'fastify'
    import request from 'supertest'

    export async function createAndAuthenticateUser(app: FastifyInstance) {
      await request(app.server).post('/users').send({
        name: 'João Cabeção',
        email: 'joao.cabecao@email.com',
        password: 'password',
      })

      const authResponse = await request(app.server).post('/sessions').send({
        email: 'joao.cabecao@email.com',
        password: 'password',
      })

      const { token } = authResponse.body

      return { token }
    }

    ```
