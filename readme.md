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