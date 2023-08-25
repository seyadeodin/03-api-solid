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

# 
